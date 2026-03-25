import { NextResponse } from "next/server"
import { db } from "@/lib/server/db"
import { authorizeRoles } from "@/lib/server/rbac"

export async function GET(request: Request) {
  const denied = authorizeRoles(request, ["admin", "sub-admin", "subadmin"])
  if (denied) return denied

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    const jobs = await db.booking.findMany({
      where: {
        ...(status && status !== "All" ? { status: status.toLowerCase() } : {}),
      },
      include: {
        customer: { select: { name: true, email: true } },
        provider: { select: { name: true, email: true } },
        service: { select: { name: true, category: true } },
      },
      orderBy: { createdAt: "desc" }
    })

    // Map database fields to UI fields
    const formattedJobs = jobs.map(job => ({
      id: job.id,
      title: job.service?.name || "Untitled Job",
      client: job.customer?.name || "Unknown Client",
      budget: job.amount,
      status: job.status.charAt(0).toUpperCase() + job.status.slice(1),
      progress: job.status === "completed" ? 100 : job.status === "pending" ? 0 : 50,
      deadline: new Date(job.createdAt).toLocaleDateString(),
      applicants: 0, 
      assigned: job.provider?.name || "Unassigned",
      category: job.service?.category || "General"
    }))

    return NextResponse.json({ ok: true, data: formattedJobs })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch jobs"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const denied = authorizeRoles(request, ["admin"])
  if (denied) return denied

  try {
    const body = await request.json()
    const { title, clientId, amount, serviceId } = body

    const job = await db.booking.create({
      data: {
        amount: parseInt(amount),
        customerId: clientId,
        serviceId: serviceId,
        providerId: "", // Initially unassigned
        status: "pending",
        currency: "KES"
      }
    })

    return NextResponse.json({ ok: true, data: job })
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Failed to create job" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const denied = authorizeRoles(request, ["admin"])
  if (denied) return denied

  try {
    const body = await request.json()
    const { id, status } = body

    const updated = await db.booking.update({
      where: { id },
      data: { status: status.toLowerCase() }
    })

    return NextResponse.json({ ok: true, data: updated })
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Failed to update job" }, { status: 500 })
  }
}