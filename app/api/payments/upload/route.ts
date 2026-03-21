import { NextResponse } from "next/server"
import { db } from "@/lib/server/db"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const reference = formData.get("reference") as string
    const transactionId = formData.get("transactionId") as string

    if (!file || !reference) {
      return NextResponse.json({ error: "Missing file or reference" }, { status: 400 })
    }

    // In a real production app, you would upload this to S3, Cloudinary, or Vercel Blob.
    // For now, we simulate the upload and record the proof in the database.
    const proofUrl = `uploads/proofs/${reference}-${Date.now()}-${file.name}`

    // Update the transaction in the database
    await db.paymentTransaction.update({
      where: { externalId: reference },
      data: {
        status: "VERIFYING",
        // We store the proof URL in the response field since we don't have a dedicated column
        response: JSON.stringify({ 
          proofUrl, 
          uploadedAt: new Date().toISOString(),
          originalName: file.name
        })
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