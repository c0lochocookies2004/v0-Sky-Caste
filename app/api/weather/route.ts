import { type NextRequest, NextResponse } from "next/server"
import { buildFeatures } from "@/lib/weather-utils"

const POWER_BASE = "https://power.larc.nasa.gov/api/temporal/daily/point"

function formatDateForAPI(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}${month}${day}`
}

async function downloadPowerData(lat: number, lon: number, start: string, end: string) {
  const params = new URLSearchParams({
    start,
    end,
    latitude: lat.toString(),
    longitude: lon.toString(),
    parameters: "T2M,PRECTOTCORR,WS2M,RH2M",
    community: "ag",
    format: "JSON",
  })

  console.log("[v0] Calling NASA POWER API:", `${POWER_BASE}?${params}`)

  const response = await fetch(`${POWER_BASE}?${params}`, {
    next: { revalidate: 3600 }, // Cache for 1 hour
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("[v0] NASA POWER API error:", errorText)
    throw new Error("Failed to fetch NASA POWER data")
  }

  const json = await response.json()
  console.log("[v0] NASA POWER API response structure:", JSON.stringify(json).substring(0, 500))

  if (!json.properties || !json.properties.parameter) {
    console.error("[v0] Invalid NASA POWER API response structure:", json)
    throw new Error("Invalid NASA POWER API response structure")
  }

  const params_dict = json.properties.parameter

  const precipKey = params_dict.PRECTOTCORR ? "PRECTOTCORR" : params_dict.PRECTOT ? "PRECTOT" : null

  if (!params_dict.T2M || !precipKey || !params_dict.WS2M || !params_dict.RH2M) {
    console.error("[v0] Missing required parameters. Available:", Object.keys(params_dict))
    throw new Error("Missing required weather parameters in API response")
  }

  const dates = Object.keys(params_dict.T2M).filter((date) => {
    const t2m = params_dict.T2M[date]
    const precip = params_dict[precipKey][date]
    const ws = params_dict.WS2M[date]
    const rh = params_dict.RH2M[date]
    return t2m !== -999 && precip !== -999 && ws !== -999 && rh !== -999
  })

  console.log("[v0] Valid dates after filtering:", dates.length, "out of", Object.keys(params_dict.T2M).length)

  if (dates.length === 0) {
    throw new Error("No valid weather data available for the selected date range")
  }

  const data = dates.map((date) => ({
    date,
    t2m_c: params_dict.T2M[date],
    precip: params_dict[precipKey][date],
    ws: params_dict.WS2M[date],
    rh: params_dict.RH2M[date],
  }))

  console.log("[v0] Processed data points:", data.length)
  return data
}

// Simplified prediction logic (mock ML model)
function predictWeatherConditions(features: any) {
  const { t2m_c, precip_3d, ws, rh, heat_index } = features

  return {
    very_hot: Math.min(Math.max((t2m_c - 30) / 10, 0), 1),
    very_cold: Math.min(Math.max((5 - t2m_c) / 10, 0), 1),
    very_windy: Math.min(Math.max((ws - 5) / 10, 0), 1),
    very_wet: Math.min(Math.max(precip_3d / 10, 0), 1),
    very_uncomfortable: Math.min(
      Math.max(((t2m_c > 30 && rh > 80) || heat_index > 40 ? 1 : 0) * ((heat_index - 35) / 10), 0),
      1,
    ),
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const lat = Number.parseFloat(searchParams.get("lat") || "20.9674")
    const lon = Number.parseFloat(searchParams.get("lon") || "-89.5926")
    const dateParam = searchParams.get("date")

    const targetDate = dateParam ? new Date(dateParam) : new Date()

    const endDate = formatDateForAPI(targetDate)

    const startDate = new Date(targetDate)
    startDate.setDate(startDate.getDate() - 10)
    const start = formatDateForAPI(startDate)

    console.log("[v0] Fetching weather data:", { lat, lon, start, end: endDate })

    const data = await downloadPowerData(lat, lon, start, endDate)
    const features = buildFeatures(data)
    const predictions = predictWeatherConditions(features)

    return NextResponse.json({
      success: true,
      date: endDate,
      location: { lat, lon },
      current_conditions: {
        temperature: features.t2m_c,
        precipitation: features.precip,
        wind_speed: features.ws,
        humidity: features.rh,
        heat_index: features.heat_index,
      },
      predictions,
    })
  } catch (error) {
    console.error("[v0] Weather API error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch weather data" }, { status: 500 })
  }
}
