// Weather calculation utilities
export function computeHeatIndex(T: number, RH: number): number {
  const e = 6.105 * Math.exp((17.27 * T) / (237.7 + T))
  const HI = T + 0.33 * (RH / 100) * e
  return HI
}

export function buildFeatures(data: any[]) {
  // Sort by date
  const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const features = sorted.map((row, idx) => {
    const t_lag1 = idx > 0 ? sorted[idx - 1].t2m_c : row.t2m_c
    const t_lag2 = idx > 1 ? sorted[idx - 2].t2m_c : row.t2m_c

    // 3-day precipitation sum
    let precip_3d = row.precip
    for (let i = 1; i <= 2 && idx - i >= 0; i++) {
      precip_3d += sorted[idx - i].precip
    }

    // 7-day precipitation sum
    let precip_7d = row.precip
    for (let i = 1; i <= 6 && idx - i >= 0; i++) {
      precip_7d += sorted[idx - i].precip
    }

    const ws_lag1 = idx > 0 ? sorted[idx - 1].ws : row.ws

    // Cyclical time features
    const date = new Date(row.date)
    const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000)
    const sin_doy = Math.sin((2 * Math.PI * dayOfYear) / 365.25)
    const cos_doy = Math.cos((2 * Math.PI * dayOfYear) / 365.25)

    const heat_index = computeHeatIndex(row.t2m_c, row.rh)

    return {
      ...row,
      t_lag1,
      t_lag2,
      precip_3d,
      precip_7d,
      ws_lag1,
      sin_doy,
      cos_doy,
      heat_index,
    }
  })

  return features[features.length - 1] // Return most recent
}
