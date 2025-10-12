/* -------------------------------------------------------------------------- */
/* AdminDashboard.jsx – simple, clair, efficace (pax, bagages, véhicule)      */
/* -------------------------------------------------------------------------- */
import React, { useState, useMemo, useCallback } from "react";
import {
  Card, CardHeader, CardTitle, CardContent,
} from "@/components/ui/card";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui/tabs";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Loader2, PieChart, RotateCcw, Search, Phone, Mail, MapPin,
  CheckCircle2, XCircle, Info, AlertCircle, LogOut, Users, Briefcase, Car,
} from "lucide-react";

/* ---------------------------------- API ----------------------------------- */
const API = {
  dashboard: (period) => `/api/admin/dashboard/?period=${period}`,
  updateBooking: (id) => `/api/admin/bookings/${id}/update/`,
};

const getToken = () =>
  localStorage.getItem("access_token") ||
  localStorage.getItem("access") ||
  localStorage.getItem("accessToken") ||
  "";

/** fetch JSON avec Bearer token + gestion d'erreurs DRF */
async function fetchAuthJson(url, options = {}) {
  const token = getToken();
  const baseHeaders =
    options.body && !options.headers?.["Content-Type"]
      ? { "Content-Type": "application/json" }
      : {};
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, ...baseHeaders, ...options.headers },
    ...options,
  });
  let body = null;
  try {
    body = await res.json();
  } catch (_) {}
  if (!res.ok) {
    const message =
      body?.detail ||
      body?.error?.message ||
      (Array.isArray(body?.errors) ? body.errors.join(", ") : null) ||
      `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

const unwrap = (json) => (Array.isArray(json) ? json : json?.results || json?.data || []);

/** Date sûre (évite Invalid Date) */
const fmtDate = (d) => {
  const dt = d ? new Date(d) : null;
  if (!dt || Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
};

/** Prix en € : final_price d'abord, sinon estimated_price */
const priceOf = (b) => {
  const raw = b?.final_price ?? b?.estimated_price ?? null;
  const n = typeof raw === "number" ? raw : raw != null ? Number(raw) : NaN;
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
};

/** Libellé véhicule propre */
const vehicleLabel = (v) => {
  const map = { eco: "Éco", berline: "Berline", van: "Van", goldwing: "Goldwing" };
  if (!v) return "—";
  const k = String(v).toLowerCase();
  return map[k] || k.charAt(0).toUpperCase() + k.slice(1);
};

/* ------------------------------ Déconnexion ------------------------------- */
async function logout() {
  const token = getToken();
  try {
    await fetch("/api/auth/logout/", {
      method: "POST",
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
        "Content-Type": "application/json",
      },
      credentials: "include",
    }).catch(() => {});
  } catch (_) {
  } finally {
    ["access_token", "access", "accessToken", "refresh", "refresh_token"].forEach((k) =>
      localStorage.removeItem(k)
    );
    sessionStorage.clear();
    document.cookie =
      "sessionid=; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax";
    window.location.href = "/login";
  }
}

/* ------------------------------ Data fetching ------------------------------ */
function useRemoteData(urlFactory, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const url = typeof urlFactory === "function" ? urlFactory() : urlFactory;
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchAuthJson(url);
      setData(payload);
    } catch (e) {
      console.error("API error:", e);
      setError(e);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [urlFactory]);

  React.useEffect(() => {
    refresh();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error, loading, refresh };
}

/* -------------------------------- Status UI -------------------------------- */
const normalizedStatus = (s) => (s ? String(s).toUpperCase() : "PENDING");

const StatusBadge = ({ status }) => {
  const s = normalizedStatus(status);
  const map = {
    PENDING: "bg-gray-200 text-gray-800",
    CONFIRMED: "bg-emerald-600 text-white",
    CANCELLED: "bg-red-600 text-white",
    DRIVER_ASSIGNED: "bg-purple-600 text-white",
    IN_PROGRESS: "bg-blue-600 text-white",
    COMPLETED: "bg-green-600 text-white",
  };
  return (
    <Badge className={`capitalize ${map[s] || "bg-gray-200"}`}>
      {(s || "").replace(/_/g, " ").toLowerCase()}
    </Badge>
  );
};

/* -------------------------------- Mini Stats ------------------------------- */
function MiniStats({ period }) {
  const { data, error, loading } = useRemoteData(() => API.dashboard(period), [period]);

  if (loading)
    return (
      <Card className="p-8 flex justify-center min-h-[100px] items-center">
        <Loader2 className="animate-spin h-6 w-6" />
      </Card>
    );

  if (error)
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <div>
            <p className="font-medium">Erreur chargement stats</p>
            <p className="text-sm">{error.message}</p>
          </div>
        </div>
      </Card>
    );

  if (!data) return null;

  const s = data.data || {};
  const items = [
    { label: "Réservations", value: s.total_bookings ?? "—" },
    { label: "En attente", value: s.pending_bookings ?? "—" },
    { label: "Confirmées", value: s.confirmed_bookings ?? "—" },
    { label: "Annulées", value: s.cancelled_bookings ?? "—" },
    { label: "CA (€)", value: s.total_revenue ?? 0 },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
      {items.map((k) => (
        <Card key={k.label} className="rounded-2xl shadow-md p-4 text-center">
          <CardTitle className="text-3xl font-bold">{k.value}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">{k.label}</p>
        </Card>
      ))}
    </div>
  );
}

/* ------------------------------- Helpers UI -------------------------------- */
const safe = (v) => (typeof v === "string" ? v.trim() : v);
const nameOf = (b) =>
  safe(b?.display_name) ||
  [b?.user?.first_name, b?.user?.last_name].filter(Boolean).join(" ").trim() ||
  safe(b?.guest_name) ||
  null;
const emailOf = (b) =>
  safe(b?.display_email) || safe(b?.user?.email) || safe(b?.guest_email) || null;
const phoneOf = (b) =>
  safe(b?.display_phone) || safe(b?.user?.phone_number) || safe(b?.guest_phone) || null;

/* -------------------------------- BookingTable ----------------------------- */
function BookingTable({ period }) {
  const { data, error, loading, refresh } = useRemoteData(() => API.dashboard(period), [period]);

  const root = data?.data ?? data ?? {};
  const rows = unwrap(root.recent_bookings ?? root.bookings ?? root.items ?? root.results ?? root);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const perPage = 20;

  const onAccept = async (b) => {
    if (normalizedStatus(b.status) !== "PENDING") return;
    await fetchAuthJson(API.updateBooking(b.id), {
      method: "PATCH",
      body: JSON.stringify({ status: "CONFIRMED" }),
    });
    refresh();
  };

  const onRefuse = async (b) => {
    if (normalizedStatus(b.status) === "COMPLETED") return;
    await fetchAuthJson(API.updateBooking(b.id), {
      method: "PATCH",
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    refresh();
  };

  const onComplete = async (b) => {
    if (normalizedStatus(b.status) === "COMPLETED") return;
    await fetchAuthJson(API.updateBooking(b.id), {
      method: "PATCH",
      body: JSON.stringify({ status: "COMPLETED" }),
    });
    refresh();
  };

  const filtered = useMemo(() => {
    const t = search.toLowerCase();
    return rows.filter((b) => {
      const bs = normalizedStatus(b.status);
      if (statusFilter !== "ALL" && bs !== statusFilter) return false;
      if (!t) return true;
      const n  = (nameOf(b) || "").toLowerCase();
      const e  = (emailOf(b) || "").toLowerCase();
      const p  = (phoneOf(b) || "").toLowerCase();
      const id = String(b.id || "");
      const cn = String(b.confirmation_number || "").toLowerCase();
      const from = (b.pickup_address || "").toLowerCase();
      const to   = (b.destination_address || "").toLowerCase();
      const pr   = priceOf(b).toLowerCase();
      const dep  = fmtDate(b.scheduled_time).toLowerCase();
      const pax  = String(b.passengers ?? "").toLowerCase();
      const lug  = String(b.luggage_count ?? "").toLowerCase();
      const veh  = vehicleLabel(b.vehicle_type).toLowerCase();
      return [n, e, p, id, cn, from, to, pr, dep, pax, lug, veh].some((s) => s.includes(t));
    });
  }, [rows, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const start = (page - 1) * perPage;
  const dataPage = filtered.slice(start, start + perPage);

  React.useEffect(() => setPage(1), [search, statusFilter]);

  return (
    <Card className="shadow-md rounded-2xl">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-semibold flex items-center gap-2">
            <Info className="h-5 w-5" />
            Courses ({filtered.length})
          </CardTitle>
          <Button variant="outline" onClick={refresh} title="Rafraîchir">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-md bg-red-50 text-red-700">
            <AlertCircle className="h-5 w-5 mt-0.5" />
            <div>
              <div className="font-medium">Impossible de charger les courses</div>
              <div className="text-sm">
                {error.message}
                {error.status === 401 || error.status === 403
                  ? " — Vérifie que tu es bien connecté(e) en admin."
                  : null}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative sm:w-1/2">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher (nom, email, téléphone, adresse, n°, prix, pax, bagages, véhicule...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="sm:w-56">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {[
                { value: "ALL", label: "Tous statuts" },
                { value: "PENDING", label: "En attente" },
                { value: "CONFIRMED", label: "Confirmée" },
                { value: "IN_PROGRESS", label: "En cours" },
                { value: "COMPLETED", label: "Terminée" },
                { value: "CANCELLED", label: "Annulée" },
                { value: "DRIVER_ASSIGNED", label: "Chauffeur assigné" },
              ].map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : rows.length === 0 && !error ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Aucune course trouvée pour cette période.
            <div className="mt-1">Essaie l’onglet <span className="font-medium">“Tout”</span> si ce n’est pas déjà le cas.</div>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Créée</TableHead>
                  <TableHead>Départ (prévu)</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>N° réservation</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Trajet</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataPage.map((b) => {
                  const n = nameOf(b);
                  const e = emailOf(b);
                  const p = phoneOf(b);
                  const s = normalizedStatus(b.status);
                  const pax = b?.passengers ?? "—";
                  const lug = b?.luggage_count ?? "—";
                  const veh = vehicleLabel(b?.vehicle_type);
                  return (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.id}</TableCell>
                      <TableCell>{fmtDate(b.created_at)}</TableCell>
                      <TableCell>{fmtDate(b.scheduled_time)}</TableCell>

                      {/* Bloc Course : pax / bag / véhicule */}
                      <TableCell>
                        <div className="flex flex-wrap gap-2 text-sm">
                          <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1">
                            <Users className="h-3 w-3" /> {pax}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1">
                            <Briefcase className="h-3 w-3" /> {lug}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1">
                            <Car className="h-3 w-3" /> {veh}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="font-mono">{b.confirmation_number || "—"}</TableCell>
                      <TableCell>{priceOf(b)}</TableCell>

                      <TableCell>
                        <div className="font-medium">{n || e || "—"}</div>
                        {e && n && <div className="text-xs text-gray-500">{e}</div>}
                      </TableCell>

                      <TableCell>
                        {p ? (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {p}
                          </div>
                        ) : e ? (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {e}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="max-w-[320px] text-sm">
                          <div className="flex items-start gap-1">
                            <MapPin className="h-3 w-3 mt-0.5" />
                            <span className="truncate">{b.pickup_address}</span>
                          </div>
                          <div className="flex items-start gap-1">
                            <MapPin className="h-3 w-3 mt-0.5 rotate-180" />
                            <span className="truncate">{b.destination_address}</span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell><StatusBadge status={s} /></TableCell>

                      <TableCell className="text-right space-x-1">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => onAccept(b)}
                          disabled={s !== "PENDING"}
                          title="Accepter"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Accepter
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onComplete(b)}
                          disabled={s === "COMPLETED" || s === "CANCELLED"}
                          title="Marquer comme terminé"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Terminer
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onRefuse(b)}
                          disabled={s === "COMPLETED"}
                          title="Refuser"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Refuser
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  ←
                </Button>
                <span className="text-sm">
                  Page {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  →
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

/* --------------------------------- Layout ---------------------------------- */
export default function AdminDashboard() {
  const [period, setPeriod] = useState("all"); // today | week | month | all

  return (
    <div className="container mx-auto pt-20 pb-8 px-4 space-y-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <PieChart className="h-6 w-6" />
          Tableau de bord – Simple
        </h1>
        <Button variant="outline" onClick={logout} className="gap-2" title="Se déconnecter">
          <LogOut className="h-4 w-4" />
          Déconnexion
        </Button>
      </div>

      <Tabs value={period} onValueChange={setPeriod} className="space-y-8">
        <TabsList>
          <TabsTrigger value="today">Aujourd'hui</TabsTrigger>
          <TabsTrigger value="week">Semaine</TabsTrigger>
          <TabsTrigger value="month">Mois</TabsTrigger>
          <TabsTrigger value="all">Tout</TabsTrigger>
        </TabsList>

        {["today", "week", "month", "all"].map((p) => (
          <TabsContent key={p} value={p} className="space-y-8">
            <MiniStats period={p} />
            <BookingTable period={p} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
