/* =======================  HomePage.jsx (invité + planif contrôlée + tolérance)  ======================= */
import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Footer from "@/components/Footer";
import SuggestionsSection from "@/components/SuggestionsSection";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import Turnstile from "react-turnstile";
import { Toaster, toast } from "sonner";

/* ------------ Config API ------------ */
const API_BASE = import.meta.env.VITE_API_URL || "/api";
const TERMS_URL = "/conditions";
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

/* ------------ Leaflet icon patch ------------ */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

/* ------------------------------------------------------------------ */
/*  Utils                                                             */
/* ------------------------------------------------------------------ */
const pad2 = (n) => String(n).padStart(2, "0");

function toServerDateTime(localDate) {
  const d = new Date(localDate);
  const tzOffsetMin = -d.getTimezoneOffset();
  const sign = tzOffsetMin >= 0 ? "+" : "-";
  const offH = pad2(Math.trunc(Math.abs(tzOffsetMin) / 60));
  const offM = pad2(Math.abs(tzOffsetMin) % 60);
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  const HH = pad2(d.getHours());
  const MM = pad2(d.getMinutes());
  const SS = pad2(d.getSeconds());
  return `${yyyy}-${mm}-${dd}T${HH}:${MM}:${SS}${sign}${offH}:${offM}`;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function isSameDay(a, b) {
  return (
    a &&
    b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function hhmm(d = new Date()) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

// Considère "passé" seulement si on est plus vieux que la tolérance (par défaut 60s)
function isPastWithTolerance(d, toleranceMs = 60_000) {
  return d.getTime() < Date.now() - toleranceMs;
}

/* ---- Auth helpers: désactivé (toujours invité) ---- */
function getAccessToken() {
  return undefined; // Aucun client ne se connecte => jamais d'Authorization
}

async function postJSON(url, body) {
  const token = getAccessToken();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  let data = {};
  try {
    data = await res.json();
  } catch {}

  if (!res.ok) {
    if (res.status === 401 && token) {
      localStorage.removeItem("access_token");
      return postJSON(url, body);
    }
    const detail = (data && (data.detail || data.errors)) || data;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return data;
}

/* ------------------------------------------------------------------ */
/*  AddressAutocomplete — BAN + Nominatim                             */
/* ------------------------------------------------------------------ */
function AddressAutocomplete({ label, onSelect }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  // Île-de-France — viewbox = left,top,right,bottom (lon,lat)
  const VIEWBOX = "1.45,49.2,3.55,48.0";

  const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
  const tokenize = (s) => norm(s).split(/[^a-z0-9]+/).filter(Boolean);

  const dedupe = (items) => {
    const seen = new Set();
    return items.filter((it) => {
      const k = `${norm(it.label)}|${Math.round(it.lat * 10000)}|${Math.round(it.lon * 10000)}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  };

  const buildLabel = (it) => {
    const name = it.name || (it.display_name ? it.display_name.split(",")[0] : "");
    const city =
      it.address?.city ||
      it.address?.town ||
      it.address?.village ||
      it.address?.municipality ||
      it.address?.county ||
      "";
    return city && name ? `${name}, ${city}` : it.display_name || name;
  };

  const variantsFor = (q) => {
    const v = [q];
    const nq = norm(q);
    const short = nq.length <= 4 && !/\s/.test(nq);
    if (short) {
      v.push(`${q} aéroport`, `aéroport ${q}`, `${q} airport`, `${q} gare`, `gare ${q}`, `${q} paris`);
    } else {
      if (!/\bgare\b/i.test(q)) v.push(`${q} gare`);
    }
    return Array.from(new Set(v));
  };

  const scoreNominatim = (item, qTokens) => {
    const cls = item.class;
    const typ = item.type;
    const imp = Number(item.importance || 0);
    const labelN = norm(buildLabel(item));
    let s = imp;
    if (cls === "aeroway" && (typ === "aerodrome" || typ === "airport")) s += 1.0;
    if (cls === "railway" && (typ === "station" || typ === "halt")) s += 0.8;
    const hits = qTokens.filter((t) => t.length >= 2 && labelN.includes(t)).length;
    s += Math.min(0.6, hits * 0.2);
    return s;
  };

  const searchBAN = async (q, signal) => {
    const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=5&autocomplete=1`;
    const r = await fetch(url, { signal });
    const d = await r.json();
    const feats = Array.isArray(d?.features) ? d.features : [];
    return feats
      .map((f) => ({
        id: f.properties?.id || `ban:${f.properties?.label}`,
        label: f.properties?.label,
        lat: f.geometry?.coordinates?.[1],
        lon: f.geometry?.coordinates?.[0],
        source: "ban",
        _score: 0.1,
      }))
      .filter((x) => x.lat && x.lon && x.label);
  };

  const searchNominatim = async (q, signal) => {
    const qs = variantsFor(q);
    const qTokens = tokenize(q);
    const results = await Promise.allSettled(
      qs.map((qq) =>
        fetch(
          `https://nominatim.openstreetmap.org/search?` +
            `format=jsonv2&limit=8&accept-language=fr&addressdetails=1&namedetails=1&countrycodes=fr&` +
            `viewbox=${VIEWBOX}&bounded=1&q=${encodeURIComponent(qq)}`,
          { signal, headers: { Accept: "application/json" } }
        ).then((r) => r.json())
      )
    );

  const items = [];
    for (const res of results) {
      if (res.status !== "fulfilled" || !Array.isArray(res.value)) continue;
      for (const it of res.value) {
        const label = buildLabel(it);
        if (!label || !it.lat || !it.lon) continue;
        items.push({
          id: `nominatim:${it.place_id}`,
          label,
          lat: parseFloat(it.lat),
          lon: parseFloat(it.lon),
          source: "nominatim",
          _score: scoreNominatim(it, qTokens),
        });
      }
    }
    return items.sort((a, b) => b._score - a._score).slice(0, 12);
  };

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }

    setOpen(true);
    setLoading(true);

    debounceRef.current = setTimeout(async () => {
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      try {
        const [ban, nom] = await Promise.allSettled([searchBAN(q, ctrl.signal), searchNominatim(q, ctrl.signal)]);

        let items = [];
        if (nom.status === "fulfilled") items = items.concat(nom.value);
        if (ban.status === "fulfilled") items = items.concat(ban.value);

        items = dedupe(items).slice(0, 8);
        setSuggestions(items);
      } catch (e) {
        if (e.name !== "AbortError") console.error(e);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const pick = (s) => {
    setQuery(s.label);
    onSelect({ address: s.label, lat: s.lat, lon: s.lon });
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <Label>{label}</Label>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder={label}
        className="bg-white"
        aria-autocomplete="list"
        aria-expanded={open}
      />
      {open && (
        <div className="absolute z-20 w-full bg-white border shadow-sm mt-1 rounded-md max-h-60 overflow-auto">
          {loading && <div className="p-2 text-sm text-neutral-500">Recherche…</div>}
          {!loading && suggestions.length === 0 && (
            <div className="p-2 text-sm text-neutral-500">Aucun résultat</div>
          )}
          {suggestions.map((s) => (
            <div
              key={s.id}
              className="p-2 cursor-pointer hover:bg-gray-100 flex items-center justify-between gap-2"
              onMouseDown={() => pick(s)}
            >
              <span>{s.label}</span>
              <span className="text-[10px] text-neutral-500 uppercase">{s.source}</span>
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
    if (points.length) map.fitBounds(L.latLngBounds(points), { padding: [24, 24] });
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
      { signal: ctrl.signal }
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

/* -------- NumberStepper (XS) -------- */
function NumberStepper({ id, value, onChange, min = 0, max = 99, step = 1, ariaLabel }) {
  const dec = () => onChange(Math.max(min, value - step));
  const inc = () => onChange(Math.min(max, value + step));
  return (
    <div
      className="inline-flex items-stretch rounded-lg border border-neutral-200 bg-white/90 overflow-hidden
                 w-full max-w-[150px] shadow-sm"
    >
      <button
        type="button"
        onClick={dec}
        className="w-9 h-9 grid place-items-center text-[15px] font-semibold
                   hover:bg-neutral-50 active:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-300"
        aria-label={`Diminuer ${ariaLabel}`}
      >
        −
      </button>
      <div
        id={id}
        className="px-2 min-w-[40px] h-9 grid place-items-center text-sm font-medium select-none"
        aria-live="polite"
      >
        {value}
      </div>
      <button
        type="button"
        onClick={inc}
        className="w-9 h-9 grid place-items-center text-[15px] font-semibold
                   hover:bg-neutral-50 active:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-300"
        aria-label={`Augmenter ${ariaLabel}`}
      >
        +
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  HomePage                                                          */
/* ------------------------------------------------------------------ */
export default function HomePage() {
  // Nettoyage éventuel d'un token invalide stocké
  useEffect(() => {
    const t = localStorage.getItem("access_token");
    if (t === "null" || t === "undefined") localStorage.removeItem("access_token");
  }, []);

  /* ---------- form ---------- */
  const [mode, setMode] = useState("now"); // "now" | "later"
  const [date, setDate] = useState(null);
  const [time, setTime] = useState("");
  const [vehicleType, setVehicleType] = useState("eco");
  const [departure, setDeparture] = useState(null);
  const [arrival, setArrival] = useState(null);

  /* Passagers & Bagages */
  const [passengers, setPassengers] = useState(1);
  const [baggages, setBaggages] = useState(0);

  /* Guest info */
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");

  const [guestErrors, setGuestErrors] = useState({});
  const [isValidatingGuest, setIsValidatingGuest] = useState(false);

  /* Acceptation des conditions */
  const [acceptTerms, setAcceptTerms] = useState(false);

  /* CAPTCHA Turnstile */
  const [captchaToken, setCaptchaToken] = useState(null);
  const [captchaError, setCaptchaError] = useState("");

  /* ---------- estimate ---------- */
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [error, setError] = useState(null);

  /* auto-fill date/heure si "Plus tard" */
  useEffect(() => {
    if (mode === "later") {
      const now = new Date();
      if (!date || date < startOfToday()) setDate(now);
      const nowHM = hhmm(now);
      if (!time || (date && isSameDay(date, now) && time < nowHM)) setTime(nowHM);
    }
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Objet Date final à envoyer (local, pas sérialisé) */
  const scheduledLocal = useMemo(() => {
    if (mode === "later" && date) {
      const d = new Date(date);
      const [H, M] = (time || "00:00").split(":");
      d.setHours(parseInt(H || "0", 10), parseInt(M || "0", 10), 0, 0);
      return d;
    }
    return new Date();
  }, [mode, date, time]);

  /* ---------- règles d'éligibilité véhicule selon passagers ---------- */
  const vehicleAllowed = (value, pax) => {
    if (pax >= 4) return value === "van"; // 4+ → Van uniquement
    if (pax === 3) return value !== "goldwing";
    if (pax === 2) return value !== "goldwing";
    return true;
  };

  useEffect(() => {
    if (!vehicleAllowed(vehicleType, passengers)) {
      setVehicleType(passengers >= 4 ? "van" : "eco");
    }
  }, [passengers]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- Validation Guest ---------- */
  const validateGuestInfo = () => {
    const errors = {};
    if (!guestName.trim()) errors.name = "Le nom est requis";
    else if (guestName.trim().length < 2) errors.name = "Le nom doit contenir au moins 2 caractères";

    if (!guestPhone.trim()) errors.phone = "Le téléphone est requis";
    else if (!/^(\+33|0)[1-9]\d{8}$/.test(guestPhone.replace(/\s/g, "")))
      errors.phone = "Format de téléphone invalide (ex: 06 00 00 00 00)";

    if (!guestEmail.trim()) errors.email = "L'email est requis";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) errors.email = "Format d'email invalide";

    setGuestErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const formatPhoneNumber = (value) => {
    const digits = value.replace(/\D/g, "");
    if (digits.startsWith("33")) {
      return digits.replace(
        /^(\d{2})(\d{1})(\d{0,2})(\d{0,2})(\d{0,2})(\d{0,2}).*$/,
        (_, a, b, c, d, e, f) =>
          `+${a} ${b}${c ? " " + c : ""}${d ? " " + d : ""}${e ? " " + e : ""}${f ? " " + f : ""}`.trim()
      );
    }
    return digits.replace(
      /^(\d{0,2})(\d{0,2})(\d{0,2})(\d{0,2})(\d{0,2}).*$/,
      (_, a, b, c, d, e) => [a, b, c, d, e].filter(Boolean).join(" ")
    );
  };

  /* ---------- ESTIMATE ---------- */
  const handleEstimate = async () => {
    setError(null);
    setConfirm(null);

    if (!departure || !arrival) {
      toast.error("Adresse manquante", { description: "Sélectionnez l'adresse de départ et d'arrivée." });
      return;
    }

    // Garde-fou uniquement en mode "Plus tard" (tolérance 60s pour éviter les faux négatifs)
    if (mode === "later" && isPastWithTolerance(scheduledLocal)) {
      setError("La date/heure choisies sont déjà passées. Choisissez un créneau ultérieur.");
      return;
    }

    setLoading(true);
    setQuote(null);

    try {
      const when = mode === "later" && date ? scheduledLocal : new Date();
      const payload = {
        pickup_address: departure.address,
        pickup_latitude: departure.lat,
        pickup_longitude: departure.lon,
        destination_address: arrival.address,
        destination_latitude: arrival.lat,
        destination_longitude: arrival.lon,
        vehicle_type: vehicleType,
        scheduled_time: toServerDateTime(when),
        passengers,
        luggage_count: baggages,
      };

      const res = await postJSON(`${API_BASE}/bookings/estimate/`, payload);
      const data = res.data || res;

      setQuote({
        km: Number(data.distance_km),
        minutes: Number(data.estimated_duration_minutes),
        price: Number(data.estimated_price).toFixed(2),
        source: "server",
      });
    } catch (e) {
      console.error(e);
      setError("Le calcul d’estimation a échoué côté serveur. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- CREATE ---------- */
  const handleCreate = async () => {
    setError(null);
    setConfirm(null);
    setCaptchaError("");

    if (!departure || !arrival) {
      toast.error("Adresse manquante", { description: "Sélectionnez l'adresse de départ et d'arrivée." });
      return;
    }
    if (!quote || quote.source !== "server") {
      setError("Pour réserver, vous devez d’abord obtenir une estimation validée par le serveur.");
      return;
    }
    if (!acceptTerms) {
      setError("Vous devez accepter les conditions de réservation pour envoyer la demande.");
      return;
    }
    if (!validateGuestInfo()) {
      setError("Veuillez corriger les erreurs dans le formulaire.");
      return;
    }
    if (!captchaToken) {
      setCaptchaError("Veuillez compléter le CAPTCHA avant d'envoyer la demande.");
      return;
    }

    // Garde-fou uniquement pour "Plus tard"
    if (mode === "later" && isPastWithTolerance(scheduledLocal)) {
      setError("La date/heure choisies sont déjà passées. Choisissez un créneau ultérieur.");
      return;
    }

    setIsValidatingGuest(true);

    try {
      const when = mode === "later" && date ? scheduledLocal : new Date();
      const payload = {
        pickup_address: departure.address,
        pickup_latitude: departure.lat,
        pickup_longitude: departure.lon,
        destination_address: arrival.address,
        destination_latitude: arrival.lat,
        destination_longitude: arrival.lon,
        scheduled_time: toServerDateTime(when),
        vehicle_type: vehicleType,
        passengers,
        luggage_count: baggages,
        captcha_token: captchaToken,
        // Mode invité forcé
        guest_name: guestName.trim(),
        guest_phone: guestPhone.replace(/\s/g, ""),
        guest_email: guestEmail.trim(),
      };

      const res = await postJSON(`${API_BASE}/bookings/create/`, payload);
      const data = res.data || res;
      setConfirm(data);

      setGuestName("");
      setGuestPhone("");
      setGuestEmail("");
      setGuestErrors({});
      setAcceptTerms(false);
      setCaptchaToken(null);
    } catch (e) {
      console.error(e);
      let msg = "Erreur de création de réservation.";
      try {
        const obj = JSON.parse(e.message);
        const ge = {};
        if (obj?.guest_name?.length) ge.name = Array.isArray(obj.guest_name) ? obj.guest_name[0] : String(obj.guest_name);
        if (obj?.guest_phone?.length) ge.phone = Array.isArray(obj.guest_phone) ? obj.guest_phone[0] : String(obj.guest_phone);
        if (obj?.guest_email?.length) ge.email = Array.isArray(obj.guest_email) ? obj.guest_email[0] : String(obj.guest_email);
        if (Object.keys(ge).length) {
          setGuestErrors((prev) => ({ ...prev, ...ge }));
          msg = "Veuillez corriger les erreurs dans le formulaire.";
        } else if (obj?.detail) {
          msg = String(obj.detail);
        } else if (obj?.captcha) {
          msg = "Vérification CAPTCHA échouée. Merci de réessayer.";
        } else {
          msg = e.message;
        }
      } catch {
        msg = e.message || msg;
      }
      setError(msg);
      setCaptchaToken(null);
    } finally {
      setIsValidatingGuest(false);
    }
  };

  /* ---------- carte ---------- */
  const pts = [];
  if (departure) pts.push([departure.lat, departure.lon]);
  if (arrival) pts.push([arrival.lat, arrival.lon]);

  const minTimeForUI = date && isSameDay(date, new Date()) ? hhmm(new Date()) : "00:00";

  return (
    <>
      <div className="min-h-screen bg-white md:ml-40">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 md:px-8 pt-20 md:pt-24 space-y-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
            Où que vous alliez,<br className="hidden sm:block" />
            <span className="sm:whitespace-nowrap"> French Driver vous y conduit.</span>
          </h1>

          <div className="flex flex-col md:flex-row gap-6">
            {/* -------- Formulaire -------- */}
            <Card className="w-full md:w-1/2">
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">Demande de réservation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <AddressAutocomplete label="Adresse de départ" onSelect={setDeparture} />
                <AddressAutocomplete label="Adresse d'arrivée" onSelect={setArrival} />

                {/* Quand ? */}
                <div className="space-y-2">
                  <Label>Quand souhaitez-vous partir&nbsp;?</Label>
                  <RadioGroup value={mode} onValueChange={setMode} className="flex flex-wrap gap-4">
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

                {/* Date / heure (bloquées dans le passé) */}
                {mode === "later" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn("w-full justify-start", !date && "text-muted-foreground")}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? date.toLocaleDateString() : "Choisir"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-auto bg-white rounded-xl shadow-lg border">
                          <Calendar
                            mode="single"
                            selected={date}
                            onSelect={(d) => {
                              if (!d) return;
                              if (d < startOfToday()) return; // sécurité en plus de fromDate
                              setDate(d);
                              const now = new Date();
                              if (isSameDay(d, now)) {
                                const minHM = hhmm(now);
                                if (!time || time < minHM) setTime(minHM);
                              } else if (!time) {
                                setTime("00:00");
                              }
                            }}
                            initialFocus
                            fromDate={startOfToday()}
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
                        min={minTimeForUI}
                        onChange={(e) => {
                          let v = e.target.value;
                          if (date && isSameDay(date, new Date())) {
                            const minHM = hhmm(new Date());
                            if (v < minHM) {
                              v = minHM;
                              toast.warning("L’heure ne peut pas être dans le passé (aujourd’hui).");
                            }
                          }
                          setTime(v);
                        }}
                      />
                      {date && isSameDay(date, new Date()) && (
                        <p className="text-xs text-neutral-500">Heure minimale aujourd’hui : {minTimeForUI}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Passagers & Bagages — XS côte à côte */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                  <Label className="flex items-center gap-2 text-[13px] font-semibold text-neutral-800">                      <svg width="16" height="16" viewBox="0 0 24 24" className="text-neutral-700" aria-hidden="true">
                        <path
                          fill="currentColor"
                          d="M16 7a4 4 0 11-8 0a4 4 0 018 0Zm-4 7a7 7 0 00-7 7h14a7 7 0 00-7-7Z"
                        />
                      </svg>
                      Nombre de passagers
                    </Label>
                    <div className="mt-1">
                      <NumberStepper
                        id="pax-stepper"
                        value={passengers}
                        onChange={(v) => setPassengers(Math.max(1, v))}
                        min={1}
                        max={8}
                        step={1}
                        ariaLabel="nombre de passagers"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="flex items-center gap-2 text-[13px] font-semibold text-neutral-800">
                      <svg width="16" height="16" viewBox="0 0 24 24" className="text-neutral-700" aria-hidden="true">
                        <path
                          fill="currentColor"
                          d="M9 6a3 3 0 116 0v1h2a3 3 0 013 3v6a3 3 0 01-3 3H7a3 3 0 01-3-3V10a3 3 0 013-3h2V6Z"
                        />
                      </svg>
                      Nombre de bagages
                    </Label>
                    <div className="mt-1">
                      <NumberStepper
                        id="bags-stepper"
                        value={baggages}
                        onChange={(v) => setBaggages(Math.max(0, v))}
                        min={0}
                        max={12}
                        step={1}
                        ariaLabel="nombre de bagages"
                      />
                    </div>
                  </div>
                </div>

                {/* Véhicules (activés/désactivés selon passagers) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                  {vehicleOptions.map((opt) => {
                    const enabled = vehicleAllowed(opt.value, passengers);
                    const isActive = vehicleType === opt.value && enabled;
                    return (
                      <Card
                        key={opt.value}
                        onClick={() => enabled && setVehicleType(opt.value)}
                        onKeyDown={(e) => {
                          if (!enabled) return;
                          if (e.key === "Enter" || e.key === " ") setVehicleType(opt.value);
                        }}
                        role="button"
                        aria-pressed={isActive}
                        aria-disabled={!enabled}
                        tabIndex={enabled ? 0 : -1}
                        className={cn(
                          "p-2 border rounded-md flex flex-col items-center gap-1 transition focus:outline-none focus:ring-2 focus:ring-offset-2",
                          enabled ? "cursor-pointer hover:bg-muted/40" : "cursor-not-allowed opacity-50 grayscale",
                          isActive && "border-black bg-muted"
                        )}
                      >
                        <img src={opt.image} alt={opt.label} className="h-12 sm:h-16 object-contain" />
                        <span className="text-xs sm:text-sm">{opt.label}</span>
                        {!enabled && <span className="mt-1 text-[10px] text-muted-foreground">Indisponible</span>}
                      </Card>
                    );
                  })}
                </div>

                <Button className="w-full" onClick={handleEstimate} disabled={loading}>
                  {loading ? "Calcul..." : "Estimer le prix"}
                </Button>

                {loading && <SkeletonCard />}
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{error}</div>
                )}

                {quote && (
                  <Card className="bg-muted/50 mt-2">
                    <CardHeader>
                      <CardTitle>Estimation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <div className="flex justify-between text-sm sm:text-base">
                        <span>Distance</span>
                        <span>{Number(quote.km).toFixed(1)} km</span>
                      </div>
                      <div className="flex justify-between text-sm sm:text-base">
                        <span>Durée</span>
                        <span>{quote.minutes} min</span>
                      </div>
                      <div className="flex justify-between font-semibold text-sm sm:text-base">
                        <span>Prix</span>
                        <span>{quote.price} €</span>
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        {quote?.source === "server" ? "Tarif validé par le serveur" : ""}
                      </div>

                      {/* Formulaire invité */}
                      <GuestInfo
                        guestName={guestName}
                        setGuestName={setGuestName}
                        guestPhone={guestPhone}
                        setGuestPhone={setGuestPhone}
                        guestEmail={guestEmail}
                        setGuestEmail={setGuestEmail}
                        guestErrors={guestErrors}
                        setGuestErrors={setGuestErrors}
                        formatPhoneNumber={formatPhoneNumber}
                      />

                      {/* Conditions */}
                      <div className="mt-3 flex items-start gap-2">
                        <input
                          id="accept-terms"
                          type="checkbox"
                          className="mt-1 h-4 w-4 rounded border-neutral-300"
                          checked={acceptTerms}
                          onChange={(e) => setAcceptTerms(e.target.checked)}
                          aria-describedby="terms-hint"
                        />
                        <Label htmlFor="accept-terms" className="text-sm text-neutral-800">
                          J’accepte les{" "}
                          <a
                            href={TERMS_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline underline-offset-2 hover:opacity-80"
                          >
                            conditions de réservation
                          </a>
                          .
                        </Label>
                      </div>
                      <p
                        id="terms-hint"
                        className={`mt-1 text-xs ${acceptTerms ? "text-neutral-500" : "text-red-600"}`}
                      >
                        {acceptTerms
                          ? "Merci, vous pouvez envoyer la demande."
                          : "Vous devez accepter les conditions pour envoyer la demande."}
                      </p>

                      {/* CAPTCHA */}
                      <div className="mt-3">
                        <Turnstile
                          sitekey={TURNSTILE_SITE_KEY}
                          onVerify={(token) => {
                            setCaptchaToken(token);
                            setCaptchaError("");
                          }}
                          onExpire={() => setCaptchaToken(null)}
                          onError={() => setCaptchaError("Le CAPTCHA a rencontré une erreur. Réessayez.")}
                          options={{ action: "booking_create", appearance: "always" }}
                        />
                        {captchaError && <p className="mt-2 text-sm text-red-600">{captchaError}</p>}
                      </div>

                      <Button
                        className="w-full mt-4"
                        onClick={handleCreate}
                        disabled={isValidatingGuest || !quote || quote.source !== "server" || !acceptTerms || !captchaToken}
                        aria-busy={isValidatingGuest}
                      >
                        {isValidatingGuest ? "Envoi..." : "Envoyer la demande"}
                      </Button>

                      {confirm && (
                        <div className="mt-4 p-3 rounded-md border bg-emerald-50 text-emerald-800 text-sm">
                          Demande envoyée ✅ — N° {confirm.confirmation_number} • Statut {confirm.status}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            {/* -------- Carte -------- */}
            <div className="w-full md:w-1/2">
              <div className="h-[260px] sm:h-[320px] md:h-[500px] rounded-xl overflow-hidden border">
                <MapContainer
                  center={[48.8566, 2.3522]}
                  zoom={13}
                  scrollWheelZoom={false}
                  className="w-full h-full relative z-0 [&_.leaflet-control]:z-0"
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
                  {departure && arrival && <RouteLine start={departure} end={arrival} />}
                </MapContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* -------- Cartes Suggestions -------- */}
      <SuggestionsSection />

      {/* ---------- Footer ---------- */}
      <Footer />

      {/* ---------- Toaster ---------- */}
      <Toaster richColors position="top-center" />
    </>
  );
}

/* ---------- GuestInfo (extrait) ---------- */
function GuestInfo({
  guestName,
  setGuestName,
  guestPhone,
  setGuestPhone,
  guestEmail,
  setGuestEmail,
  guestErrors,
  setGuestErrors,
  formatPhoneNumber,
}) {
  return (
    <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">Vos coordonnées</h3>
          <p className="text-sm text-gray-600 mt-1">Ces informations servent à confirmer votre demande de réservation.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Nom */}
        <div className="space-y-2">
          <Label htmlFor="guest-name" className="text-sm font-medium text-gray-700">
            Nom complet <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input
              id="guest-name"
              required
              value={guestName}
              onChange={(e) => {
                setGuestName(e.target.value);
                if (guestErrors.name) {
                  const ne = { ...guestErrors };
                  delete ne.name;
                  setGuestErrors(ne);
                }
              }}
              placeholder="Jean Dupont"
              className={cn("pl-10", guestErrors.name ? "border-red-300 focus:border-red-500 focus:ring-red-500" : "")}
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          {guestErrors.name && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {guestErrors.name}
            </p>
          )}
        </div>

        {/* Téléphone */}
        <div className="space-y-2">
          <Label htmlFor="guest-phone" className="text-sm font-medium text-gray-700">
            Téléphone <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input
              id="guest-phone"
              required
              type="tel"
              inputMode="tel"
              value={guestPhone}
              onChange={(e) => {
                const formatted = formatPhoneNumber(e.target.value);
                setGuestPhone(formatted);
                if (guestErrors.phone) {
                  const ne = { ...guestErrors };
                  delete ne.phone;
                  setGuestErrors(ne);
                }
              }}
              placeholder="06 00 00 00 00"
              className={cn("pl-10", guestErrors.phone ? "border-red-300 focus:border-red-500 focus:ring-red-500" : "")}
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
          </div>
          {guestErrors.phone && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {guestErrors.phone}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="guest-email" className="text-sm font-medium text-gray-700">
            Email <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input
              id="guest-email"
              required
              type="email"
              autoComplete="email"
              value={guestEmail}
              onChange={(e) => {
                setGuestEmail(e.target.value);
                if (guestErrors.email) {
                  const ne = { ...guestErrors };
                  delete ne.email;
                  setGuestErrors(ne);
                }
              }}
              placeholder="jean.dupont@example.com"
              className={cn("pl-10", guestErrors.email ? "border-red-300 focus:border-red-500 focus:ring-red-500" : "")}
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
              />
            </svg>
          </div>
          {guestErrors.email && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {guestErrors.email}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Options véhicules ---------- */
const vehicleOptions = [
  { value: "eco", label: "Eco", image: "https://i.ibb.co/Kcjx8GkP/corolla.jpg" },
  { value: "berline", label: "Berline", image: "https://i.ibb.co/1f77wxrS/classee.jpg" },
  { value: "van", label: "Van", image: "https://i.ibb.co/rK0hKz6f/mitch-v-min.png" },
  { value: "goldwing", label: "Goldwing", image: "https://i.ibb.co/N2ff8pL4/IMG-5220-2.jpg" },
];

/* ---------- SkeletonCard ---------- */
function SkeletonCard() {
  return (
    <div className="flex flex-col space-y-3 w-full">
      <Skeleton className="h-[100px] sm:h-[125px] w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}
