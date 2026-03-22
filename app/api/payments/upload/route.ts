import { NextResponse } from "next/server"
import { db } from "@/lib/server/db"
import { mkdir, writeFile } from "fs/promises"
import path from "path"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const reference = formData.get("reference") as string
    const transactionId = formData.get("transactionId") as string

    if (!file || (!reference && !transactionId)) {
      return NextResponse.json({ error: "Missing file or transaction identifier" }, { status: 400 })
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "proofs")
    await mkdir(uploadsDir, { recursive: true })

    const originalName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "_")
    const timestamp = Date.now()
    const safeReference = String(reference || transactionId || "payment-proof").replace(/[^a-zA-Z0-9_.-]/g, "_")
    const filename = `${safeReference}-${timestamp}-${originalName}`
    const filePath = path.join(uploadsDir, filename)
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, fileBuffer)

    const proofUrl = `/uploads/proofs/${filename}`

    // Update the transaction in the database
    const existing = await db.paymentTransaction.findFirst({
      where: {
        OR: [
          ...(transactionId ? [{ id: transactionId }] : []),
          ...(reference ? [{ externalId: reference }, { reference }] : []),
        ],
      },
      select: { id: true, response: true },
      orderBy: { createdAt: "desc" },
    })

    if (!existing) {
      return NextResponse.json({ error: "Payment transaction not found" }, { status: 404 })
    }

    await db.paymentTransaction.update({
      where: { id: existing.id },
      data: {
        status: "VERIFYING",
        response: JSON.stringify({
          proofUrl, 
          uploadedAt: new Date().toISOString(),
          originalName: file.name
        }),
      }
    })

    return NextResponse.json({ 
      ok: true, 
      message: "Proof of payment uploaded successfully. Our team will verify it shortly." 
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Failed to upload proof" }, { status: 500 })
  }
}