import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    // Emergency services with standard pricing
    const emergencyServices = [
      {
        id: "burst-pipe",
        label: "Burst Pipe",
        price: 3500,
        icon: "Droplets",
        description: "Urgent water pipe repair",
      },
      {
        id: "power-outage",
        label: "Power Outage",
        price: 4000,
        icon: "Zap",
        description: "Electrical emergency",
      },
      {
        id: "gas-leak",
        label: "Gas Leak",
        price: 5000,
        icon: "Flame",
        description: "Gas emergency repair",
      },
      {
        id: "flooding",
        label: "Flooding",
        price: 4500,
        icon: "CloudRain",
        description: "Water damage emergency",
      },
      {
        id: "lock-out",
        label: "Lock Out",
        price: 2500,
        icon: "Key",
        description: "Emergency locksmith",
      },
      {
        id: "broken-window",
        label: "Broken Window",
        price: 3000,
        icon: "PanelTop",
        description: "Window repair",
      },
    ]

    return NextResponse.json({
      ok: true,
      data: emergencyServices,
    })
  } catch (error) {
    console.error("Emergency services error:", error)
    return NextResponse.json(
      { ok: false, error: "Failed to fetch emergency services" },
      { status: 500 }
    )
  }
}
