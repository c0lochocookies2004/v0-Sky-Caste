"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, CloudRain, Wind, Thermometer, AlertTriangle, Cloud, Sun, Moon } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import InteractiveMap from "./interactive-map"
import ThemeToggle from "./theme-toggle"

interface WeatherPredictions {
  very_hot: number
  very_cold: number
  very_windy: number
  very_wet: number
  very_uncomfortable: number
}

interface CurrentConditions {
  temperature: number
  precipitation: number
  wind_speed: number
  humidity: number
  heat_index: number
}

export default function WeatherDashboard() {
  const [date, setDate] = useState<Date>(new Date())
  const [loading, setLoading] = useState(false)
  const [predictions, setPredictions] = useState<WeatherPredictions | null>(null)
  const [conditions, setConditions] = useState<CurrentConditions | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchPredictions = async () => {
    setLoading(true)
    setError(null)

    try {
      const dateStr = format(date, "yyyy-MM-dd")
      const response = await fetch(`/api/weather?date=${dateStr}&lat=20.9674&lon=-89.5926`)

      if (!response.ok) throw new Error("Failed to fetch predictions")

      const data = await response.json()
      setPredictions(data.predictions)
      setConditions(data.current_conditions)
    } catch (err) {
      setError("Error al obtener las predicciones")
      console.error("[v0] Fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  const predictionItems = predictions
    ? [
        { label: "Muy Caliente", value: predictions.very_hot, icon: Thermometer, color: "text-orange-500" },
        { label: "Muy Frío", value: predictions.very_cold, icon: Thermometer, color: "text-blue-500" },
        { label: "Muy Ventoso", value: predictions.very_windy, icon: Wind, color: "text-cyan-500" },
        { label: "Muy Lluvioso", value: predictions.very_wet, icon: CloudRain, color: "text-blue-400" },
        { label: "Muy Incómodo", value: predictions.very_uncomfortable, icon: AlertTriangle, color: "text-red-500" },
      ]
    : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8 text-center relative">
          <div className="absolute top-0 right-0">
            <ThemeToggle />
          </div>

          <div className="flex flex-col items-center justify-center gap-4 mb-3">
            <div className="relative">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sun className="h-8 w-8 text-amber-400" />
                <div className="relative">
                  <Cloud className="h-12 w-12 text-sky-400 dark:text-sky-500" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full" />
                </div>
                <Moon className="h-8 w-8 text-slate-300" />
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-sky-500 via-blue-600 to-sky-700 dark:from-sky-400 dark:via-blue-500 dark:to-sky-600 bg-clip-text text-transparent tracking-tight">
              SkyCast
            </h1>
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-400">Predicciones meteorológicas para Mérida, Yucatán</p>
        </div>

        <div className="mb-6">
          <InteractiveMap />
        </div>

        <div className="grid gap-6 mb-8">
          <Card className="p-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-sky-200 dark:border-sky-900 shadow-xl">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold mb-1 text-sky-900 dark:text-sky-100">Seleccionar Fecha</h2>
                <p className="text-sm text-muted-foreground">Coordenadas: 20.9674°N, 89.5926°W</p>
              </div>

              <div className="flex gap-3 items-center">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[240px] justify-start text-left font-normal border-sky-300 dark:border-sky-700 hover:bg-sky-50 dark:hover:bg-sky-950",
                        !date && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP", { locale: es }) : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[10000]" align="end" sideOffset={8}>
                    <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus />
                  </PopoverContent>
                </Popover>

                <Button
                  onClick={fetchPredictions}
                  disabled={loading}
                  size="lg"
                  className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white shadow-md"
                >
                  {loading ? "Cargando..." : "Obtener Predicción"}
                </Button>
              </div>
            </div>
          </Card>

          {error && (
            <Card className="p-6 border-destructive bg-red-50 dark:bg-red-950/20">
              <p className="text-destructive">{error}</p>
            </Card>
          )}

          {conditions && (
            <Card className="p-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-blue-200 dark:border-blue-900 shadow-xl">
              <h2 className="text-xl font-semibold mb-4 text-blue-900 dark:text-blue-100">Condiciones Actuales</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="flex flex-col p-3 rounded-lg bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30">
                  <span className="text-sm text-muted-foreground mb-1">Temperatura</span>
                  <span className="text-2xl font-bold font-mono text-orange-600 dark:text-orange-400">
                    {conditions.temperature.toFixed(1)}°C
                  </span>
                </div>
                <div className="flex flex-col p-3 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30">
                  <span className="text-sm text-muted-foreground mb-1">Precipitación</span>
                  <span className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
                    {conditions.precipitation.toFixed(1)} mm
                  </span>
                </div>
                <div className="flex flex-col p-3 rounded-lg bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-cyan-950/30 dark:to-sky-950/30">
                  <span className="text-sm text-muted-foreground mb-1">Viento</span>
                  <span className="text-2xl font-bold font-mono text-cyan-600 dark:text-cyan-400">
                    {conditions.wind_speed.toFixed(1)} m/s
                  </span>
                </div>
                <div className="flex flex-col p-3 rounded-lg bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30">
                  <span className="text-sm text-muted-foreground mb-1">Humedad</span>
                  <span className="text-2xl font-bold font-mono text-teal-600 dark:text-teal-400">
                    {conditions.humidity.toFixed(0)}%
                  </span>
                </div>
                <div className="flex flex-col p-3 rounded-lg bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30">
                  <span className="text-sm text-muted-foreground mb-1">Índice de Calor</span>
                  <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
                    {conditions.heat_index.toFixed(1)}°C
                  </span>
                </div>
              </div>
            </Card>
          )}

          {predictions && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-indigo-900 dark:text-indigo-100">
                Probabilidades de Condiciones Extremas
              </h2>
              <div className="grid gap-4">
                {predictionItems.map((item) => (
                  <Card
                    key={item.label}
                    className="p-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-indigo-200 dark:border-indigo-900 shadow-lg hover:shadow-xl transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <item.icon className={cn("h-5 w-5", item.color)} />
                        <span className="font-semibold">{item.label}</span>
                      </div>
                      <span className="text-2xl font-bold font-mono bg-gradient-to-r from-sky-600 to-indigo-600 dark:from-sky-400 dark:to-indigo-400 bg-clip-text text-transparent">
                        {(item.value * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(item.value * 100, 100)}%` }}
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
