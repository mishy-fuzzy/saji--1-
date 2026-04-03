import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getSessionActor, hasAnyRole } from "@/lib/server/api-auth";

const prismaDb: any = db;

type RangeKey = "7d" | "30d" | "90d" | "year";

function getRangeDays(range: string): number {
  if (range === "30d") return 30;
  if (range === "90d") return 90;
  if (range === "year") return 365;
  return 7;
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short" });
}

function dateDaysAgo(days: number): Date {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  base.setDate(base.getDate() - days);
  return base;
}

export async function GET(request: Request) {
  try {
    const { actor, error } = await getSessionActor(request);
    if (error || !actor) return error;

    if (!hasAnyRole(actor, ["shopkeeper", "admin", "sub-admin", "subadmin"])) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const range = (searchParams.get("range") || "7d") as RangeKey;
    const rangeDays = getRangeDays(range);

    const periodStart = dateDaysAgo(rangeDays - 1);
    const previousStart = dateDaysAgo(rangeDays * 2 - 1);
    const previousEnd = dateDaysAgo(rangeDays);

    const [bookings, previousBookings, products, messages, notifications] = await Promise.all([
      prismaDb.booking.findMany({
        where: {
          providerId: actor.id,
          createdAt: { gte: periodStart },
        },
        include: {
          service: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
      }),
      prismaDb.booking.findMany({
        where: {
          providerId: actor.id,
          createdAt: { gte: previousStart, lt: previousEnd },
        },
        select: {
          amount: true,
          customerId: true,
          serviceId: true,
        },
      }),
      prismaDb.service.findMany({
        where: { providerId: actor.id },
        select: { id: true, name: true, category: true },
      }),
      prismaDb.message.count({
        where: {
          OR: [{ senderId: actor.id }, { receiverId: actor.id }],
          createdAt: { gte: periodStart },
        },
      }),
      prismaDb.authLog.count({
        where: {
          provider: "system",
          mode: "notification",
          email: actor.id,
          createdAt: { gte: periodStart },
        },
      }),
    ]);

    const totalRevenue = bookings.reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0);
    const totalOrders = bookings.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const uniqueCustomers = new Set(bookings.map((row: any) => String(row.customerId || "")).filter(Boolean)).size;

    const previousRevenue = previousBookings.reduce(
      (sum: number, row: any) => sum + Number(row.amount || 0),
      0,
    );
    const previousOrders = previousBookings.length;
    const previousCustomers = new Set(
      previousBookings.map((row: any) => String(row.customerId || "")).filter(Boolean),
    ).size;

    const calcChange = (current: number, prev: number): number => {
      if (prev <= 0) return current > 0 ? 100 : 0;
      return Number((((current - prev) / prev) * 100).toFixed(1));
    };

    const revenueChange = calcChange(totalRevenue, previousRevenue);
    const orderChange = calcChange(totalOrders, previousOrders);
    const aovChange = calcChange(averageOrderValue, previousOrders > 0 ? previousRevenue / previousOrders : 0);
    const customerChange = calcChange(uniqueCustomers, previousCustomers);

    const salesByDay = new Map<string, { revenue: number; orders: number }>();
    for (let i = 6; i >= 0; i--) {
      const date = dateDaysAgo(i);
      salesByDay.set(dayKey(date), { revenue: 0, orders: 0 });
    }
    bookings.forEach((row: any) => {
      const key = dayKey(new Date(row.createdAt));
      if (!salesByDay.has(key)) return;
      const current = salesByDay.get(key)!;
      current.revenue += Number(row.amount || 0);
      current.orders += 1;
      salesByDay.set(key, current);
    });

    const salesData = Array.from(salesByDay.entries()).map(([key, value]) => {
      const date = new Date(key);
      return {
        name: date.toLocaleDateString("en-US", { weekday: "short" }),
        revenue: value.revenue,
        orders: value.orders,
      };
    });

    const monthlyMap = new Map<string, { name: string; revenue: number }>();
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setDate(1);
      date.setMonth(date.getMonth() - i);
      monthlyMap.set(monthKey(date), { name: monthLabel(date), revenue: 0 });
    }

    bookings.forEach((row: any) => {
      const key = monthKey(new Date(row.createdAt));
      if (!monthlyMap.has(key)) return;
      const current = monthlyMap.get(key)!;
      current.revenue += Number(row.amount || 0);
      monthlyMap.set(key, current);
    });

    const monthlySales = Array.from(monthlyMap.values());

    const categoryRevenue = new Map<string, number>();
    bookings.forEach((row: any) => {
      const category = String(row?.service?.category || "General");
      categoryRevenue.set(category, (categoryRevenue.get(category) || 0) + Number(row.amount || 0));
    });
    const totalCategoryRevenue = Array.from(categoryRevenue.values()).reduce((sum, amount) => sum + amount, 0);

    const colors = ["#d97706", "#2563eb", "#059669", "#7c3aed", "#ef4444", "#0ea5e9"];
    const categoryData = Array.from(categoryRevenue.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, amount], index) => ({
        name,
        value: totalCategoryRevenue > 0 ? Math.round((amount / totalCategoryRevenue) * 100) : 0,
        color: colors[index % colors.length],
      }));

    const trafficSources = [
      { name: "Customers", visitors: uniqueCustomers },
      { name: "Orders", visitors: totalOrders },
      { name: "Messages", visitors: Number(messages || 0) },
      { name: "Products", visitors: products.length },
      { name: "Notifications", visitors: Number(notifications || 0) },
    ];

    const previousProductMap = new Map<string, { sales: number; revenue: number }>();
    previousBookings.forEach((row: any) => {
      const key = String(row?.serviceId || "");
      if (!key) return;
      const current = previousProductMap.get(key) || { sales: 0, revenue: 0 };
      current.sales += 1;
      current.revenue += Number(row.amount || 0);
      previousProductMap.set(key, current);
    });

    const productMap = new Map<string, { name: string; sales: number; revenue: number }>();
    bookings.forEach((row: any) => {
      const key = String(row?.service?.id || row?.serviceId || "");
      if (!key) return;
      const current = productMap.get(key) || {
        name: String(row?.service?.name || "Product"),
        sales: 0,
        revenue: 0,
      };
      current.sales += 1;
      current.revenue += Number(row.amount || 0);
      productMap.set(key, current);
    });

    const topProducts = Array.from(productMap.entries())
      .map(([id, item]) => {
        const prev = previousProductMap.get(id);
        const prevRevenue = Number(prev?.revenue || 0);
        const growth = prevRevenue > 0 ? ((item.revenue - prevRevenue) / prevRevenue) * 100 : item.revenue > 0 ? 100 : 0;
        return {
          name: item.name,
          sales: item.sales,
          revenue: item.revenue,
          growth: Number(growth.toFixed(1)),
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return NextResponse.json({
      ok: true,
      data: {
        kpis: {
          totalRevenue,
          totalOrders,
          averageOrderValue,
          customers: uniqueCustomers,
          revenueChange,
          orderChange,
          averageOrderValueChange: aovChange,
          customerChange,
        },
        salesData,
        monthlySales,
        categoryData,
        trafficSources,
        topProducts,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load analytics";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
