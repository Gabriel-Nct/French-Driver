/* =======================  HomePage.jsx  ======================= */
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Footer from "@/components/Footer";           // <— footer import
import SuggestionsSection from "@/components/SuggestionsSection";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

/* ------------ Leaflet icon patch ------------ */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

/* ------------------------------------------------------------------ */
/*  AddressAutocomplete                                               */
/* ------------------------------------------------------------------ */
function AddressAutocomplete({ label, onSelect }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    const ctrl = new AbortController();
    fetch(
      `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(
        query,
      )}&limit=5`,
      { signal: ctrl.signal },
    )
      .then((r) => r.json())
      .then((d) => {
        const feats = Array.isArray(d?.features) ? d.features : [];
        setSuggestions(
          feats.map((f) => ({
            id: f.properties.id,
            label: f.properties.label,
            lat: f.geometry.coordinates[1],
            lon: f.geometry.coordinates[0],
          })),
        );
      })
      .catch((e) => {
        if (e.name !== "AbortError") console.error(e);
      });
    return () => ctrl.abort();
  }, [query]);

  /* close on outside click */
  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <Label>{label}</Label>
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
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
                setQuery(s.label);
                onSelect({
                  address: s.label,
                  lat: s.lat,
                  lon: s.lon,
                });
                setOpen(false);
              }}
            >
              {s.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  FitBounds & RouteLine                                             */
/* ------------------------------------------------------------------ */
function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length) map.fitBounds(L.latLngBounds(points), { padding: [50, 50] });
  }, [points, map]);
  return null;
}

function RouteLine({ start, end }) {
  const [coords, setCoords] = useState([]);
  useEffect(() => {
    if (!start || !end) return;
    const ctrl = new AbortController();
    fetch(
      `https://router.project-osrm.org/route/v1/driving/${start.lon},${start.lat};${end.lon},${end.lat}?overview=full&geometries=geojson`,
      { signal: ctrl.signal },
    )
      .then((r) => r.json())
      .then((d) => {
        const line = d?.routes?.[0]?.geometry?.coordinates || [];
        setCoords(line.map(([lon, lat]) => [lat, lon]));
      })
      .catch((e) => {
        if (e.name !== "AbortError") console.error(e);
      });
    return () => ctrl.abort();
  }, [start, end]);
  if (!coords.length) return null;
  return <Polyline positions={coords} weight={4} />;
}

/* ------------------------------------------------------------------ */
/*  HomePage                                                          */
/* ------------------------------------------------------------------ */
export default function HomePage() {
  const navigate = useNavigate();

  /* ---------- user ---------- */
  const [currentUser, setCurrentUser] = useState(null);
  const readUser = useCallback(() => {
    const raw = localStorage.getItem("user");
    setCurrentUser(raw ? JSON.parse(raw) : null);
  }, []);
  useEffect(() => {
    readUser();
    window.addEventListener("userChanged", readUser);
    return () => window.removeEventListener("userChanged", readUser);
  }, [readUser]);

  /* ---------- form ---------- */
  const [mode, setMode] = useState("now");
  const [date, setDate] = useState(null);
  const [time, setTime] = useState("");
  const [vehicleType, setVehicleType] = useState("eco");
  const [departure, setDeparture] = useState(null);
  const [arrival, setArrival] = useState(null);

  /* ---------- estimate ---------- */
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState(null); // { km, minutes, price }

  /* auto-fill date/heure si “Plus tard” */
  useEffect(() => {
    if (mode === "later") {
      const now = new Date();
      if (!date) setDate(now);
      if (!time) setTime(now.toISOString().slice(11, 16)); // “HH:MM”
    }
  }, [mode]);

  /* ---------- tarifs locaux (secours visiteurs) ---------- */
  const tariffs = {
    eco: { base: 5, perKm: 1.5, perMin: 0.4 },
    berline: { base: 7, perKm: 1.8, perMin: 0.45 },
    van: { base: 8, perKm: 2.0, perMin: 0.5 },
    goldwing: { base: 8, perKm: 2.0, perMin: 0.5 },
  };
  const priceLocal = (km, min) => {
    const t = tariffs[vehicleType];
    return (t.base + km * t.perKm + min * t.perMin).toFixed(2);
  };
  const vehicleApiType = vehicleType === "goldwing" ? "van" : vehicleType;

  /* ---------- helpers ---------- */
  const isoScheduled = () =>
    mode === "later"
      ? `${date.toISOString().split("T")[0]}T${time}:00Z`
      : new Date().toISOString();

  /* ---------- ESTIMATE ---------- */
  const handleEstimate = async () => {
    if (!departure || !arrival) {
      alert("Sélectionnez départ & arrivée.");
      return;
    }
    setLoading(true);
    setQuote(null);

    try {
      if (currentUser) {
        /* ----- appel backend ----- */
        const res = await fetch("/api/bookings/estimate/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: JSON.stringify({
            pickup_address: departure.address,
            pickup_latitude: departure.lat,
            pickup_longitude: departure.lon,
            destination_address: arrival.address,
            destination_latitude: arrival.lat,
            destination_longitude: arrival.lon,
            vehicle_type: vehicleApiType,
            scheduled_time: isoScheduled(),
          }),
        });
        if (!res.ok) throw new Error();
        const data = (await res.json()).data ?? (await res.json());
        setQuote({
          km: Number(data.distance_km),
          minutes: Number(data.estimated_duration_minutes),
          price: Number(data.estimated_price).toFixed(2),
        });
      } else {
        /* ----- visiteur : OSRM + calcul local ----- */
        const d = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${departure.lon},${departure.lat};${arrival.lon},${arrival.lat}?overview=false`,
        ).then((r) => r.json());
        if (d.code !== "Ok") throw new Error();
        const km = d.routes[0].distance / 1000;
        const min = Math.ceil(d.routes[0].duration / 60);
        setQuote({ km, minutes: min, price: priceLocal(km, min) });
      }
    } catch {
      alert("Impossible de calculer l'estimation.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- CREATE ---------- */
  const handleCreate = async () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    try {
      const res = await fetch("/api/bookings/create/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({
          pickup_address: departure.address,
          pickup_latitude: departure.lat,
          pickup_longitude: departure.lon,
          destination_address: arrival.address,
          destination_latitude: arrival.lat,
          destination_longitude: arrival.lon,
          estimated_price: quote.price,
          vehicle_type: vehicleApiType, // stocké dans la réservation
          scheduled_time: isoScheduled(),
        }),
      });
      if (!res.ok) throw new Error();
      alert("Réservation confirmée !");
      navigate(`/customer/${currentUser.id}`);
    } catch {
      alert("Erreur de création de réservation.");
    }
  };

  /* ---------- carte ---------- */
  const pts = [];
  if (departure) pts.push([departure.lat, departure.lon]);
  if (arrival) pts.push([arrival.lat, arrival.lon]);

  /* ---------- JSX ---------- */
  return (
    <>
      {/* ---------- Contenu principal ---------- */}
      <div className="min-h-screen flex flex-col items-start bg-white p-4 space-y-6 ml-40 pt-24">
        <h1 className="text-4xl font-bold">
          Où que vous alliez,
          <br />
          French Driver vous y conduit.
        </h1>

        <div className="flex flex-col md:flex-row w-full max-w-6xl gap-6">
          {/* -------- Formulaire -------- */}
          <Card className="w-full md:w-1/2">
            <CardHeader>
              <CardTitle>Réservation rapide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <AddressAutocomplete
                label="Adresse de départ"
                onSelect={setDeparture}
              />
              <AddressAutocomplete
                label="Adresse d'arrivée"
                onSelect={setArrival}
              />

              {/* Quand ? */}
              <div className="space-y-2">
                <Label>Quand souhaitez-vous partir&nbsp;?</Label>
                <RadioGroup value={mode} onValueChange={setMode}>
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

              {/* Date / heure */}
              {mode === "later" && (
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start",
                            !date && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? date.toLocaleDateString() : "Choisir"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 w-auto bg-white rounded-xl shadow-lg border">
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
                    <Label htmlFor="time">Heure</Label>
                    <Input
                      id="time"
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Véhicules */}
              <div className="grid grid-cols-2 gap-4">
                {vehicleOptions.map((opt) => (
                  <Card
                    key={opt.value}
                    onClick={() => setVehicleType(opt.value)}
                    className={cn(
                      "p-2 border rounded-md cursor-pointer flex flex-col items-center gap-1 transition",
                      vehicleType === opt.value && "border-black bg-muted",
                    )}
                  >
                    <img
                      src={opt.image}
                      alt={opt.label}
                      className="h-16 object-contain"
                    />
                    <span className="text-sm">{opt.label}</span>
                  </Card>
                ))}
              </div>

              <Button
                className="w-full white"
                onClick={handleEstimate}
                disabled={loading}
              >
                {loading ? "Calcul..." : "Estimer le prix"}
              </Button>

              {loading && <SkeletonCard />}

              {quote && (
                <Card className="bg-muted/50 mt-2">
                  <CardHeader>
                    <CardTitle>Estimation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <div className="flex justify-between">
                      <span>Distance</span>
                      <span>{quote.km.toFixed(1)} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Durée</span>
                      <span>{quote.minutes} min</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Prix</span>
                      <span>{quote.price} €</span>
                    </div>

                    {currentUser ? (
                      <Button
                        className="w-full mt-4"
                        onClick={handleCreate}
                      >
                        Réserver maintenant
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full mt-4"
                        onClick={() => {
                          navigate("/login");
                        }}
                      >
                        Connectez-vous pour commander
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          {/* -------- Carte -------- */}
          <div className="w-full md:w-1/2 h-[500px] rounded-xl overflow-hidden border">
          <MapContainer
                center={[48.8566, 2.3522]}
                zoom={13}
                scrollWheelZoom={false}
                className="
                  w-full h-full
                  relative z-0
                  [&_.leaflet-control]:z-0
                "
              >

              <TileLayer
                attribution="&copy; OpenStreetMap"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {departure && (
                <Marker position={[departure.lat, departure.lon]}>
                  <Popup>{departure.address}</Popup>
                </Marker>
              )}
              {arrival && (
                <Marker position={[arrival.lat, arrival.lon]}>
                  <Popup>{arrival.address}</Popup>
                </Marker>
              )}
              {pts.length > 0 && <FitBounds points={pts} />}
              {departure && arrival && (
                <RouteLine start={departure} end={arrival} />
              )}
            </MapContainer>
          </div>
        </div>
      </div>

      {/* -------- Cartes Suggestions -------- */}
        <SuggestionsSection />


      {/* ---------- Footer ---------- */}
      <Footer /> {/* que sur HomePage */}
    </>
  );
}

/* ---------- Options véhicules ---------- */
const vehicleOptions = [
  {
    value: "eco",
    label: "Eco",
    image: "https://i.ibb.co/Kcjx8GkP/corolla.jpg",
  },
  {
    value: "berline",
    label: "Berline",
    image: "https://i.ibb.co/1f77wxrS/classee.jpg",
  },
  {
    value: "van",
    label: "Van",
    image: "https://i.ibb.co/rK0hKz6f/mitch-v-min.png",
  },
  {
    value: "goldwing",
    label: "Goldwing",
    image: "https://i.ibb.co/N2ff8pL4/IMG-5220-2.jpg",
  },
];

/* ---------- SkeletonCard ---------- */
function SkeletonCard() {
  return (
    <div className="flex flex-col space-y-3 w-full">
      <Skeleton className="h-[125px] w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}
