import { NextResponse } from "next/server"
import { db } from "@/lib/server/db"
import { authorizeRoles } from "@/lib/server/rbac"

const prismaDb: any = db

function parseJson(value: string | null) {
  if (!value) return {}
  try {
    return JSON.parse(value)
  } catch {
    return {}
  }
}

function normalizeInvoiceStatus(value: string): "Paid" | "Pending" | "Overdue" | "Draft" {
  const normalized = String(value || "draft").toLowerCase()
  if (normalized === "paid" || normalized === "completed" || normalized === "success") return "Paid"
  if (normalized === "pending") return "Pending"
  if (normalized === "overdue") return "Overdue"
  return "Draft"
}

export async function GET(request: Request) {
  const denied = authorizeRoles(request, ["secretary", "admin", "sub-admin", "subadmin"])
  if (denied) return denied

  try {
    const rows = await prismaDb.paymentTransaction.findMany({
      where: { provider: "invoice" },
      include: {
        booking: {
          include: {
            customer: { select: { name: true, phone: true } },
            provider: { select: { id: true, name: true } },
            service: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 250,
    })

    const invoices = rows.map((row: any) => {
      const payload = parseJson(row.response)
      const requestPayload = parseJson(row.request)
      const amount = Number(row.amount || 0)
      const tax = Math.round(amount * 0.16)
      const total = amount + tax

      return {
        id: row.id,
        bookingId: String(row.bookingId || ""),
        client: String(row?.booking?.customer?.name || payload.client || "Client"),
        clientPhone: String(row?.booking?.customer?.phone || ""),
        service: String(row?.booking?.service?.name || payload.service || "Service"),
        date: new Date(row.createdAt).toISOString().slice(0, 10),
        dueDate: String(payload.dueDate || requestPayload.dueDate || ""),
        amount,
        tax,
        total,
        status: normalizeInvoiceStatus(String(payload.status || row.status || "draft")),
        items: Array.isArray(payload.items)
          ? payload.items.map((item: any) => ({
              desc: String(item?.desc || "Item"),
              qty: Number(item?.qty || 1),
              rate: Number(item?.rate || 0),
            }))
          : [],
      }
    })

    return NextResponse.json({
      ok: true,
      data: {
        invoices,
        stats: {
          total: invoices.length,
          paid: invoices.filter((invoice: any) => invoice.status === "Paid").length,
          pending: invoices.filter((invoice: any) => invoice.status === "Pending").length,
          overdue: invoices.filter((invoice: any) => invoice.status === "Overdue").length,
        },
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load invoices"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const denied = authorizeRoles(request, ["secretary", "admin", "sub-admin", "subadmin"])
  if (denied) return denied

  try {
    const body = await request.json()
    const bookingId = String(body?.bookingId || body?.clientId || "").trim()
    const dueDate = String(body?.dueDate || "").trim()
    const items = Array.isArray(body?.items)
      ? body.items
          .map((item: any) => ({
            desc: String(item?.desc || "").trim(),
            qty: Math.max(1, Math.round(Number(item?.qty || 1))),
            rate: Math.max(0, Math.round(Number(item?.rate || 0))),
          }))
          .filter((item: any) => item.desc)
      : []

    if (!bookingId) {
      return NextResponse.json({ ok: false, error: "bookingId is required" }, { status: 400 })
    }

    const booking = await prismaDb.booking.findFirst({
      where: { id: bookingId },
      include: {
        customer: { select: { name: true, phone: true } },
        service: { select: { name: true } },
      },
    })

    if (!booking) {
      return NextResponse.json({ ok: false, error: "Booking not found" }, { status: 404 })
    }

    const amount = items.length
      ? items.reduce((sum: number, item: any) => sum + item.qty * item.rate, 0)
      : Number(booking.amount || 0)

    const row = await prismaDb.paymentTransaction.create({
      data: {
        provider: "invoice",
        kind: "issue",
        bookingId: booking.id,
        amount,
        currency: "KES",
        status: "DRAFT",
        request: JSON.stringify({ bookingId: booking.id, dueDate, items }),
        response: JSON.stringify({ dueDate, items, status: "draft" }),
      },
      select: { id: true },
    })

    return NextResponse.json({ ok: true, data: { id: row.id } })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create invoice"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}