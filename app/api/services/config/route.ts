import { NextResponse } from "next/server";

const emergencySurcharge = Number(process.env.EMERGENCY_SURCHARGE || 0);
const downpaymentPercent = Number(process.env.DOWNPAYMENT_PERCENT || 0.25);

export async function GET() {
  return NextResponse.json({
    ok: true,
    data: {
      emergencySurcharge: Number.isFinite(emergencySurcharge)
        ? emergencySurcharge
        : 0,
      downpaymentPercent: Number.isFinite(downpaymentPercent)
        ? downpaymentPercent
        : 0.25,
    },
  });
}
