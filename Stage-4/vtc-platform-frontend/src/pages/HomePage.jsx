import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';


const vehicleOptions = [
  { value: "eco", label: "Eco", image: "https://i.ibb.co/cSfk04p4/2025-MBC68193482303-removebg-preview.png" },
  { value: "berline", label: "Berline", image: "https://i.ibb.co/cSfk04p4/2025-MBC68193482303-removebg-preview.png" },
  { value: "van", label: "Van", image: "https://i.ibb.co/cSfk04p4/2025-MBC68193482303-removebg-preview.png" },
  { value: "goldwing", label: "Goldwing", image: "https://i.ibb.co/cSfk04p4/2025-MBC68193482303-removebg-preview.png" },
]

export default function HomePage() {
  const [mode, setMode] = useState("now")
  const [date, setDate] = useState(null)
  const [time, setTime] = useState("")
  const [vehicleType, setVehicleType] = useState("eco")

  return (
    <div className="min-h-screen flex flex-col items-start justify-start bg-white p-4 space-y-6 ml-40 pt-24">
      <h1 className="text-4xl font-bold">Voyager sereinement avec nous</h1>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Réservation rapide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Adresse de départ" />
          <Input placeholder="Adresse d'arrivée" />

          {/* Choix de moment */}
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

          {/* Date et heure si "plus tard" */}
          {mode === "later" && (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Date de départ</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left", !date && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "dd/MM/yyyy") : "Choisir une date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white rounded-xl shadow-lg border">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
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




          <Button className="w-full bg-black text-white hover:bg-gray-900">
            Estimer le prix
          </Button>
        </CardContent>
      </Card>
    </div>
  )

}

