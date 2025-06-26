import { useState, useEffect, useRef } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet"
import L from "leaflet"
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png"
import markerIcon from "leaflet/dist/images/marker-icon.png"
import markerShadow from "leaflet/dist/images/marker-shadow.png"
import "leaflet/dist/leaflet.css"
import { Skeleton } from "@/components/ui/skeleton"


/*****************************************************
 * Leaflet icon paths fix (Vite)
 *****************************************************/

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

/*****************************************************
 * AddressAutocomplete Component
 *****************************************************/
function AddressAutocomplete({ label, onSelect }) {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  

  // fetch suggestions
  useEffect(() => {
    const controller = new AbortController()
    if (query.length < 3) {
      setSuggestions([])
      return () => controller.abort()
    }
    fetch(
      `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`,
      { signal: controller.signal }
    )
      .then((res) => res.json())
      .then((data) => {
        setSuggestions(
          data.features.map((f) => ({
            id: f.properties.id,
            label: f.properties.label,
            lat: f.geometry.coordinates[1],
            lon: f.geometry.coordinates[0],
          }))
        )
      })
      .catch((err) => {
        if (err.name !== "AbortError") console.error(err)
      })
    return () => controller.abort()
  }, [query])

  // close dropdown on outside click
  useEffect(() => {
    const handle = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [])

  return (
    <div ref={ref} className="relative">
      <Label>{label}</Label>
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder={label}
        className="bg-white"
      />
      {open && suggestions.length > 0 && (
        <div className="absolute z-10 w-full bg-white border shadow-sm mt-1 rounded-md max-h-60 overflow-auto">
          {suggestions.map((s) => (
            <div
              key={s.id}
              className="p-2 cursor-pointer hover:bg-gray-100"
              onMouseDown={() => {
                setQuery(s.label)
                onSelect({ address: s.label, lat: s.lat, lon: s.lon })
                setOpen(false)
              }}
            >
              {s.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="flex flex-col space-y-3 w-full">
      <Skeleton className="h-[125px] w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  )
}

/*****************************************************
 * FitBounds – zoom to markers
 *****************************************************/
function FitBounds({ points }) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 0) return
    const bounds = L.latLngBounds(points)
    map.fitBounds(bounds, { padding: [50, 50] })
  }, [points, map])
  return null
}

/*****************************************************
 * RouteLine – draw polyline via OSRM
 *****************************************************/
function RouteLine({ start, end }) {
  const [coords, setCoords] = useState([])
  const map = useMap() // not used but keeps hook order

  useEffect(() => {
    if (!start || !end) return
    const controller = new AbortController()
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lon},${start.lat};${end.lon},${end.lat}?overview=full&geometries=geojson&alternatives=false`
    fetch(url, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (data.code === "Ok" && data.routes.length) {
          const geo = data.routes[0].geometry.coordinates
          setCoords(geo.map(([lon, lat]) => [lat, lon]))
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") console.error(err)
      })
    return () => controller.abort()
  }, [start, end])

  if (!start || !end || coords.length === 0) return null
  return <Polyline positions={coords} weight={4} />
}

/*****************************************************
 * HomePage Component
 *****************************************************/
export default function HomePage() {
  // form state
  const [mode, setMode] = useState("now")
  const [date, setDate] = useState(null)
  const [time, setTime] = useState("")
  const [vehicleType, setVehicleType] = useState("eco")

  const [departure, setDeparture] = useState(null)
  const [arrival, setArrival] = useState(null)

  // temporary quote state
  const [loading, setLoading] = useState(false)
  const [quote, setQuote] = useState(null) // {km, minutes, price}

  // fill default date/time when switching to "later"
  useEffect(() => {
    if (mode === "later") {
      const now = new Date()
      if (!date) setDate(now)
      if (!time) {
        const h = String(now.getHours()).padStart(2, "0")
        const m = String(now.getMinutes()).padStart(2, "0")
        setTime(`${h}:${m}`)
      }
    }
  }, [mode])

  /********************** TEMPORARY ESTIMATION LOGIC **********************/
  const base = 5
  const perKm = 1.5
  const perMin = 0.4
  const calcPrice = (km, minutes) => (base + km * perKm + minutes * perMin).toFixed(2)

  const handleEstimate = async () => {
    if (!departure || !arrival) {
      alert("Veuillez sélectionner les adresses de départ et d'arrivée")
      return
    }
    // prevent past datetime if later
    if (mode === "later" && date) {
      const [h, m] = time.split(":")
      const dt = new Date(date)
      dt.setHours(Number(h))
      dt.setMinutes(Number(m))
      if (dt < new Date()) {
        alert("Veuillez choisir une date et une heure ultérieures.")
        return
      }
    }

    setLoading(true)
    setQuote(null)

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${departure.lon},${departure.lat};${arrival.lon},${arrival.lat}?overview=false&geometries=polyline&alternatives=false`
      const res = await fetch(url)
      const data = await res.json()
      if (data.code === "Ok" && data.routes.length) {
        const { distance, duration } = data.routes[0] // m, s
        const km = distance / 1000
        const minutes = Math.ceil(duration / 60)
        const price = calcPrice(km, minutes)
        setQuote({ km, minutes, price })
      } else {
        alert("Impossible de calculer l'estimation.")
      }
    } catch (e) {
      console.error(e)
      alert("Erreur réseau lors du calcul de l'estimation.")
    } finally {
      setLoading(false)
    }
  }

  // map points
  const points = []
  if (departure) points.push([departure.lat, departure.lon])
  if (arrival) points.push([arrival.lat, arrival.lon])

  return (
    <div className="min-h-screen flex flex-col items-start justify-start bg-white p-4 space-y-6 ml-40 pt-24">
      <h1 className="text-4xl font-bold">Voyager sereinement avec nous</h1>

      <div className="flex flex-col md:flex-row w-full max-w-6xl gap-6">
        {/***************** FORM CARD *****************/}
        <Card className="w-full md:w-1/2">
          <CardHeader>
            <CardTitle>Réservation rapide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AddressAutocomplete label="Adresse de départ" onSelect={setDeparture} />
            <AddressAutocomplete label="Adresse d'arrivée" onSelect={setArrival} />

            {/* moment choice */}
            <div className="space-y-2">
              <Label>Quand souhaitez-vous partir ?</Label>
              <RadioGroup defaultValue="now" onValueChange={setMode}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="now" id="now" />
                  <Label htmlFor="now">Maintenant</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="later" id="later" />
                  <Label htmlFor="later">Plus tard</Label>
                </div>
              </RadioGroup>
            </div>

            {mode === "later" && (
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Date de départ</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "dd/MM/yyyy") : "Choisir une date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white rounded-xl shadow-lg border">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                        fromDate={new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="time">Heure souhaitée</Label>
                  <Input
                    id="time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {/* vehicle options */}
            <div className="grid grid-cols-2 gap-4 items-stretch">
              {vehicleOptions.map(({ value, label, image }) => (
                <Card
                  key={value}
                  onClick={() => setVehicleType(value)}
                  className={cn(
                    "p-2 rounded-md border cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-y-1",
                    vehicleType === value && "border-black bg-muted"
                  )}
                >
                  <img src={image} alt={label} className="h-16 object-contain" />
                  <span className="text-sm font-medium leading-none">{label}</span>
                </Card>
              ))}
            </div>

            <Button
              className="w-full bg-black text-white hover:bg-gray-900"
              onClick={handleEstimate}
              disabled={loading}
            >
              {loading ? "Calcul..." : "Estimer le prix"}
            </Button>

            {/* Skeleton pendant le chargement */}
            {loading && <SkeletonCard />}


            {quote && (
              <Card className="bg-muted/50 mt-2">
                <CardHeader>
                  <CardTitle>Estimation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="flex justify-between"><span>Distance</span><span>{quote.km.toFixed(1)} km</span></div>
                  <div className="flex justify-between"><span>Durée</span><span>{quote.minutes} min</span></div>
                  <div className="flex justify-between font-semibold"><span>Prix estimé</span><span>{quote.price} €</span></div>
                  {/* Bouton de connexion */}
                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() => alert('Redirection vers la connexion...')}
                    >
                      Connectez-vous pour commander
                    </Button>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/***************** MAP *****************/}
        <div className="w-full md:w-1/2 h-[500px] rounded-xl overflow-hidden border">
          <MapContainer
            center={[48.8566, 2.3522]}
            zoom={13}
            scrollWheelZoom={false}
            className="w-full h-full z-0"
          >
            <TileLayer
              attribution="&copy; OpenStreetMap"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {departure && (
              <Marker position={[departure.lat, departure.lon]}>
                <Popup>Départ: {departure.address}</Popup>
              </Marker>
            )}
            {arrival && (
              <Marker position={[arrival.lat, arrival.lon]}>
                <Popup>Arrivée: {arrival.address}</Popup>
              </Marker>
            )}
            {points.length > 0 && <FitBounds points={points} />}
            {departure && arrival && <RouteLine start={departure} end={arrival} />}
          </MapContainer>
        </div>
      </div>
    </div>
  )
}

const vehicleOptions = [
  {
    value: "eco",
    label: "Eco",
    image: "https://i.ibb.co/cSfk04p4/2025-MBC68193482303-removebg-preview.png",
  },
  {
    value: "berline",
    label: "Berline",
    image: "https://i.ibb.co/cSfk04p4/2025-MBC68193482303-removebg-preview.png",
  },
  {
    value: "van",
    label: "Van",
    image: "https://i.ibb.co/cSfk04p4/2025-MBC68193482303-removebg-preview.png",
  },
  {
    value: "goldwing",
    label: "Goldwing",
    image: "https://i.ibb.co/cSfk04p4/2025-MBC68193482303-removebg-preview.png",
  },
]
