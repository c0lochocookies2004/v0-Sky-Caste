"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Droplets, Wind, CloudRain, Calendar, Clock, Navigation } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

interface WeatherModalData {
  location: string
  lat: number
  lon: number
  temperature: number
  humidity: number
  windSpeed: number
  precipitation: number
  condition: string
  emoji: string
  date: string
  dayOfWeek: string
  time: string
}

const MEXICAN_STATES = [
  { name: "Yucatán", lat: 20.7099, lon: -89.0943 },
  { name: "Quintana Roo", lat: 19.1817, lon: -88.4791 },
  { name: "Campeche", lat: 19.8301, lon: -90.5349 },
  { name: "Tabasco", lat: 17.8409, lon: -92.6189 },
  { name: "Chiapas", lat: 16.7569, lon: -93.1292 },
  { name: "Veracruz", lat: 19.1738, lon: -96.1342 },
  { name: "Oaxaca", lat: 17.0732, lon: -96.7266 },
  { name: "Guerrero", lat: 17.4392, lon: -99.5451 },
  { name: "Puebla", lat: 19.0414, lon: -98.2063 },
  { name: "Tlaxcala", lat: 19.3139, lon: -98.2404 },
  { name: "Hidalgo", lat: 20.0911, lon: -98.7624 },
  { name: "México", lat: 19.4969, lon: -99.7233 },
  { name: "Morelos", lat: 18.6813, lon: -99.1013 },
  { name: "Ciudad de México", lat: 19.4326, lon: -99.1332 },
  { name: "Querétaro", lat: 20.5888, lon: -100.3899 },
  { name: "Guanajuato", lat: 21.019, lon: -101.2574 },
  { name: "Michoacán", lat: 19.5665, lon: -101.7068 },
  { name: "Jalisco", lat: 20.6595, lon: -103.3494 },
  { name: "Colima", lat: 19.2452, lon: -103.7241 },
  { name: "Nayarit", lat: 21.7514, lon: -104.8455 },
  { name: "Aguascalientes", lat: 21.8853, lon: -102.2916 },
  { name: "Zacatecas", lat: 22.7709, lon: -102.5832 },
  { name: "San Luis Potosí", lat: 22.1565, lon: -100.9855 },
  { name: "Durango", lat: 24.0277, lon: -104.6532 },
  { name: "Sinaloa", lat: 25.8167, lon: -108.2167 },
  { name: "Sonora", lat: 29.2972, lon: -110.3309 },
  { name: "Chihuahua", lat: 28.6353, lon: -106.0889 },
  { name: "Coahuila", lat: 27.0587, lon: -101.7068 },
  { name: "Nuevo León", lat: 25.5922, lon: -99.9962 },
  { name: "Tamaulipas", lat: 24.2669, lon: -98.8363 },
  { name: "Baja California", lat: 30.8406, lon: -115.2838 },
  { name: "Baja California Sur", lat: 26.0444, lon: -111.6661 },
]

function getWeatherCondition(temp: number, precip: number): { condition: string; emoji: string } {
  if (precip > 5) return { condition: "Lluvioso", emoji: "🌧️" }
  if (temp > 35) return { condition: "Muy Caloroso", emoji: "🔥" }
  if (temp > 30) return { condition: "Caloroso", emoji: "☀️" }
  if (temp > 25) return { condition: "Soleado", emoji: "🌤️" }
  if (temp > 20) return { condition: "Agradable", emoji: "⛅" }
  return { condition: "Fresco", emoji: "🌥️" }
}

function findNearestState(lat: number, lon: number): string {
  let nearestState = MEXICAN_STATES[0]
  let minDistance = Number.MAX_VALUE

  for (const state of MEXICAN_STATES) {
    const distance = Math.sqrt(Math.pow(lat - state.lat, 2) + Math.pow(lon - state.lon, 2))
    if (distance < minDistance) {
      minDistance = distance
      nearestState = state
    }
  }

  return nearestState.name
}

export default function InteractiveMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any | null>(null)
  const [modalData, setModalData] = useState<WeatherModalData | null>(null)
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [locating, setLocating] = useState(false)

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString())
  const [selectedDay, setSelectedDay] = useState(new Date().getDate().toString())
  const [selectedHour, setSelectedHour] = useState(new Date().getHours().toString())
  const [currentLat, setCurrentLat] = useState<number | null>(null)
  const [currentLon, setCurrentLon] = useState<number | null>(null)
  const [currentStateName, setCurrentStateName] = useState<string>("")

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() + i).toString())
  const months = [
    { value: "1", label: "Enero" },
    { value: "2", label: "Febrero" },
    { value: "3", label: "Marzo" },
    { value: "4", label: "Abril" },
    { value: "5", label: "Mayo" },
    { value: "6", label: "Junio" },
    { value: "7", label: "Julio" },
    { value: "8", label: "Agosto" },
    { value: "9", label: "Septiembre" },
    { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" },
    { value: "12", label: "Diciembre" },
  ]
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString())
  const hours = Array.from({ length: 24 }, (_, i) => ({
    value: i.toString(),
    label: `${i.toString().padStart(2, "0")}:00`,
  }))

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return

      const L = (await import("leaflet")).default

      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        document.head.appendChild(link)
      }

      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      })

      const mapInstance = L.map(mapRef.current).setView([20.7225131, -89.1521709], 6)

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapInstance)

      mapInstance.on("click", (e: any) => {
        handleMapClick(e.latlng.lat, e.latlng.lng)
      })

      setMap(mapInstance)
    }

    initMap()

    return () => {
      if (map) {
        map.remove()
      }
    }
  }, [])

  const adjustWeatherForHour = (baseTemp: number, hour: number) => {
    const hourNum = Number.parseInt(hour)
    let tempAdjustment = 0

    if (hourNum >= 0 && hourNum < 6) {
      tempAdjustment = -5 + hourNum * 0.5
    } else if (hourNum >= 6 && hourNum < 12) {
      tempAdjustment = -3 + (hourNum - 6) * 0.8
    } else if (hourNum >= 12 && hourNum < 18) {
      tempAdjustment = 2 + Math.sin(((hourNum - 12) / 6) * Math.PI) * 2
    } else {
      tempAdjustment = 2 - (hourNum - 18) * 0.8
    }

    return baseTemp + tempAdjustment
  }

  const fetchWeatherForDate = async (lat: number, lon: number, stateName: string) => {
    setLoading(true)

    try {
      const dateStr = `${selectedYear}-${selectedMonth.padStart(2, "0")}-${selectedDay.padStart(2, "0")}`
      console.log("[v0] Fetching weather for:", { lat, lon, dateStr, stateName })
      const response = await fetch(`/api/weather?latitude=${lat}&longitude=${lon}&date=${dateStr}`)
      const data = await response.json()
      console.log("[v0] Weather API response:", data)

      if (data.success) {
        const adjustedTemp = adjustWeatherForHour(data.current_conditions.temperature, selectedHour)

        const { condition, emoji } = getWeatherCondition(adjustedTemp, data.current_conditions.precipitation)

        const selectedDate = new Date(dateStr)
        const daysOfWeek = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
        const dayOfWeek = daysOfWeek[selectedDate.getDay()]
        const time = `${selectedHour.padStart(2, "0")}:00`

        const weatherData = {
          location: stateName,
          lat,
          lon,
          temperature: adjustedTemp,
          humidity: data.current_conditions.humidity,
          windSpeed: data.current_conditions.wind_speed,
          precipitation: data.current_conditions.precipitation,
          condition,
          emoji,
          date: dateStr,
          dayOfWeek,
          time,
        }

        console.log("[v0] Setting modal data:", weatherData)
        setModalData(weatherData)
      } else {
        console.error("[v0] API returned success: false", data)
      }
    } catch (error) {
      console.error("[v0] Error fetching weather:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleMapClick = async (lat: number, lon: number) => {
    setCurrentLat(lat)
    setCurrentLon(lon)
    setIsOpen(true)
    setLoading(true)

    const fallbackStateName = findNearestState(lat, lon)
    setCurrentStateName(fallbackStateName)

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=es`,
      )
      const data = await response.json()

      let locationName = fallbackStateName

      if (data && data.address) {
        const { city, town, village, municipality, state } = data.address

        const localityName = city || town || village || municipality
        const stateName = state

        if (localityName && stateName) {
          locationName = `${localityName}, ${stateName}`
        } else if (localityName) {
          locationName = localityName
        } else if (stateName) {
          locationName = stateName
        }

        setCurrentStateName(locationName)
      }

      await fetchWeatherForDate(lat, lon, locationName)
    } catch (error) {
      console.error("Error with geocoding:", error)
      await fetchWeatherForDate(lat, lon, fallbackStateName)
    }
  }

  const handleDateChange = () => {
    if (currentLat !== null && currentLon !== null) {
      fetchWeatherForDate(currentLat, currentLon, currentStateName)
    }
  }

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("La geolocalización no está disponible en tu navegador")
      return
    }

    setLocating(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords

        if (map) {
          map.setView([latitude, longitude], 10)
        }

        handleMapClick(latitude, longitude)
        setLocating(false)
      },
      (error) => {
        console.error("Error getting location:", error)
        let errorMessage = "No se pudo obtener tu ubicación"

        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = "Permiso de ubicación denegado. Por favor, habilita el acceso a tu ubicación."
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = "Ubicación no disponible. Intenta de nuevo."
        } else if (error.code === error.TIMEOUT) {
          errorMessage = "Tiempo de espera agotado. Intenta de nuevo."
        }

        alert(errorMessage)
        setLocating(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )
  }

  return (
    <>
      <Card className="overflow-hidden relative bg-white dark:bg-slate-900 border-sky-200 dark:border-sky-800">
        <div ref={mapRef} className="w-full h-[400px] md:h-[600px]" />
        <Button
          onClick={handleLocateMe}
          disabled={locating}
          className="absolute bottom-4 right-4 md:bottom-6 md:right-6 z-[1000] h-10 w-10 md:h-12 md:w-12 rounded-full p-0 shadow-lg"
          title="Mi ubicación"
        >
          {locating ? (
            <Loader2 className="h-5 w-5 md:h-6 md:w-6 animate-spin" />
          ) : (
            <Navigation className="h-5 w-5 md:h-6 md:w-6" />
          )}
        </Button>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] z-[9999] bg-white dark:bg-slate-900 border-sky-200 dark:border-sky-800">
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl text-sky-900 dark:text-sky-100">
              Clima en: {currentStateName || "Cargando..."}
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[calc(90vh-8rem)]">
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                <div className="space-y-2">
                  <Label htmlFor="year" className="text-xs md:text-sm text-foreground">
                    Año
                  </Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger id="year" className="h-9 md:h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" className="z-[10000]">
                      {years.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="month" className="text-xs md:text-sm text-foreground">
                    Mes
                  </Label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger id="month" className="h-9 md:h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" className="z-[10000]">
                      {months.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="day" className="text-xs md:text-sm text-foreground">
                    Día
                  </Label>
                  <Select value={selectedDay} onValueChange={setSelectedDay}>
                    <SelectTrigger id="day" className="h-9 md:h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" className="z-[10000]">
                      {days.map((day) => (
                        <SelectItem key={day} value={day}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hour" className="text-xs md:text-sm text-foreground">
                    Hora
                  </Label>
                  <Select value={selectedHour} onValueChange={setSelectedHour}>
                    <SelectTrigger id="hour" className="h-9 md:h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" className="z-[10000] max-h-[200px]">
                      {hours.map((hour) => (
                        <SelectItem key={hour.value} value={hour.value}>
                          {hour.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleDateChange} className="w-full h-9 md:h-10">
                Consultar Clima
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              modalData && (
                <div className="space-y-4 md:space-y-6 py-4">
                  <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
                    <div className="text-7xl md:text-9xl">{modalData.emoji}</div>
                    <div className="space-y-1 text-center md:text-left">
                      <p className="text-4xl md:text-5xl font-bold text-foreground">
                        {modalData.temperature.toFixed(1)}°C
                      </p>
                      <p className="text-lg md:text-xl font-semibold text-sky-600 dark:text-sky-400">
                        {modalData.condition}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 text-xs md:text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {modalData.dayOfWeek}, {modalData.date}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{modalData.time}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 md:gap-4">
                    <Card className="p-3 md:p-4 text-center space-y-2 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
                      <Droplets className="h-5 w-5 md:h-6 md:w-6 mx-auto text-blue-500 dark:text-blue-400" />
                      <p className="text-xl md:text-2xl font-bold text-foreground">{modalData.humidity.toFixed(0)}%</p>
                      <p className="text-[10px] md:text-xs text-muted-foreground">Humedad</p>
                    </Card>

                    <Card className="p-3 md:p-4 text-center space-y-2 bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-900">
                      <Wind className="h-5 w-5 md:h-6 md:w-6 mx-auto text-cyan-500 dark:text-cyan-400" />
                      <p className="text-xl md:text-2xl font-bold text-foreground">{modalData.windSpeed.toFixed(1)}</p>
                      <p className="text-[10px] md:text-xs text-muted-foreground">Viento (m/s)</p>
                    </Card>

                    <Card className="p-3 md:p-4 text-center space-y-2 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900">
                      <CloudRain className="h-5 w-5 md:h-6 md:w-6 mx-auto text-indigo-500 dark:text-indigo-400" />
                      <p className="text-xl md:text-2xl font-bold text-foreground">
                        {modalData.precipitation.toFixed(1)}
                      </p>
                      <p className="text-[10px] md:text-xs text-muted-foreground">Precipitación (mm)</p>
                    </Card>
                  </div>

                  <p className="text-center text-[10px] md:text-xs text-muted-foreground">
                    {modalData.lat.toFixed(4)}°N, {Math.abs(modalData.lon).toFixed(4)}°W
                  </p>
                </div>
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
