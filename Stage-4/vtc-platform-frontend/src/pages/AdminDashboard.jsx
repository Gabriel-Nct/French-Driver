/* -------------------------------------------------------------------------- */
/* AdminDashboard.js                                                          */
/* -------------------------------------------------------------------------- */
import React, {
  useState,
  useMemo,
  useCallback,
  Fragment,
} from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Loader2,
  CheckCircle,
  XCircle,
  UserRound,
  PieChart,
  SendHorizonal,
  RotateCcw,
  ClipboardList,
  PlusCircle,
  Car,
  Check,
  Play,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Helpers & API                                                              */
/* -------------------------------------------------------------------------- */
const API = {
  dashboard: (period) => `/api/admin/dashboard/?period=${period}`,
  drivers: "/api/drivers/",
  createDriver: "/api/drivers/create/",
  dispatch: "/api/admin/dispatch/",
  updateBooking: (id) => `/api/admin/bookings/${id}/update/`,
};

const getToken = () => localStorage.getItem("access_token") || "";

const fetchAuth = (url, options = {}) => {
  const token = getToken();
  const baseHeaders =
    options.body && !options.headers?.["Content-Type"]
      ? { "Content-Type": "application/json" }
      : {};
  return fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      ...baseHeaders,
      ...options.headers,
    },
    ...options,
  });
};

const unwrap = (json) =>
  Array.isArray(json) ? json : json?.results || json?.data || [];

const fmtDate = (d) =>
  new Date(d).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/* -------------------------------------------------------------------------- */
/* Custom hook : useRemoteData                                                */
/* -------------------------------------------------------------------------- */
function useRemoteData(url, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await fetchAuth(typeof url === "function" ? url() : url);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [url]);

  React.useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, refresh };
}

/* -------------------------------------------------------------------------- */
/* StatusBadge                                                                */
/* -------------------------------------------------------------------------- */
const StatusBadge = ({ status }) => {
  const map = {
    PENDING: "bg-gray-200 text-gray-800",
    CONFIRMED: "bg-amber-500 text-white",
    DRIVER_ASSIGNED: "bg-purple-600 text-white",
    IN_PROGRESS: "bg-blue-600 text-white",
    COMPLETED: "bg-green-600 text-white",
    CANCELLED: "bg-red-600 text-white",
  };
  return (
    <Badge className={`capitalize ${map[status] || "bg-gray-200"}`}>
      {status.replace(/_/g, " ").toLowerCase()}
    </Badge>
  );
};

/* -------------------------------------------------------------------------- */
/* MiniStats                                                                  */
/* -------------------------------------------------------------------------- */
function MiniStats({ period }) {
  const { data, loading } = useRemoteData(API.dashboard(period), [period]);

  if (loading)
    return (
      <Card className="p-8 flex justify-center min-h-[100px] items-center">
        <Loader2 className="animate-spin h-6 w-6" />
      </Card>
    );
  if (!data) return null;

  const s = data.data;
  const items = [
    { label: "Réservations", value: s.total_bookings },
    { label: "En attente", value: s.pending_bookings },
    { label: "En cours", value: s.in_progress_bookings },
    { label: "Terminées", value: s.completed_bookings },
    { label: "CA (€)", value: s.total_revenue || 0 },
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

/* -------------------------------------------------------------------------- */
/* DriverSelectModal                                                          */
/* -------------------------------------------------------------------------- */
function DriverSelectModal({ openId, onClose, onAssign }) {
  const { data: drivers } = useRemoteData(
    () => (openId ? API.drivers : null),
    [openId]
  );
  const [selected, setSelected] = useState(null);

  const handleAssign = async () => {
    if (!selected) return;
    await fetchAuth(API.dispatch, {
      method: "POST",
      body: JSON.stringify({
        action: "assign",
        booking_id: openId,
        driver_id: selected,
      }),
    });
    onAssign();
    onClose();
  };

  return (
    <Dialog open={Boolean(openId)} onOpenChange={onClose}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>Assigner un chauffeur</DialogTitle>
        </DialogHeader>
        <Select onValueChange={setSelected}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choisir un chauffeur" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {unwrap(drivers).map((d) => (
              <SelectItem key={d.id} value={String(d.id)}>
                {d.name} – {d.phone_number}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button
            onClick={handleAssign}
            disabled={!selected}
            className="w-full mt-2"
          >
            Assigner
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* BookingDetailModal                                                         */
/* -------------------------------------------------------------------------- */
function BookingDetailModal({ booking, onClose }) {
  if (!booking) return null;
  return (
    <Dialog open={Boolean(booking)} onOpenChange={onClose}>
      <DialogContent className="max-w-lg overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>
            Détails réservation n°{booking.confirmation_number || booking.id}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <p>
            <strong>Client :</strong> {booking.user?.email}
          </p>
          <p>
            <strong>Départ :</strong> {booking.pickup_address}
          </p>
          <p>
            <strong>Destination :</strong> {booking.destination_address}
          </p>
          <p>
            <strong>Statut :</strong> {booking.status}
          </p>
          <p>
            <strong>Créée le :</strong> {fmtDate(booking.created_at)}
          </p>
          {booking.invoice_number && (
            <p>
              <strong>Facture :</strong>{" "}
              <a
                className="underline"
                href={booking.pdf_path}
                target="_blank"
                rel="noopener noreferrer"
              >
                {booking.invoice_number}
              </a>
            </p>
          )}
        </div>
        {booking.invoice_url && (
          <DialogFooter>
            <Button asChild variant="outline" className="w-full">
              <a
                href={booking.invoice_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Télécharger la facture
              </a>
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* BookingTable                                                               */
/* -------------------------------------------------------------------------- */
function BookingTable({ period }) {
  const { data, loading, refresh } = useRemoteData(API.dashboard(period), [
    period,
  ]);
  const rows = unwrap(data?.data?.recent_bookings);

  /* ----- états locaux ----- */
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [assignModalId, setAssignModalId] = useState(null);
  const [detailBooking, setDetailBooking] = useState(null);

  /* ----- helpers ----- */
  const patchStatus = async (id, next) => {
    await fetchAuth(API.updateBooking(id), {
      method: "PATCH",
      body: JSON.stringify({ status: next }),
    });
    await refresh();
  };

  const notifyDriver = async (id) => {
    await fetchAuth(API.dispatch, {
      method: "POST",
      body: JSON.stringify({ action: "broadcast", booking_id: id }),
    });
    alert("Notification envoyée");
  };

  /* ----- filtres ----- */
  const filtered = useMemo(() => {
    return rows.filter((b) => {
      if (statusFilter !== "ALL" && b.status !== statusFilter) return false;
      if (!search) return true;
      const t = search.toLowerCase();
      return (
        b.user?.email?.toLowerCase().includes(t) ||
        b.confirmation_number?.toLowerCase().includes(t)
      );
    });
  }, [rows, search, statusFilter]);

  /* ----- rendu ----- */
  return (
    <Fragment>
      <Card className="shadow-md rounded-2xl">
        {/* barre de recherche + filtres */}
        <CardHeader className="space-y-4">
          <CardTitle className="text-2xl font-semibold flex items-center gap-2">
            <UserRound className="h-5 w-5" /> Réservations ({period})
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Rechercher email ou n°"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm:w-1/3"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {[
                  "ALL",
                  "PENDING",
                  "CONFIRMED",
                  "DRIVER_ASSIGNED",
                  "IN_PROGRESS",
                  "COMPLETED",
                  "CANCELLED",
                ].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={refresh}
              title="Rafraîchir"
              className="sm:ml-auto"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        {/* tableau */}
        <CardContent className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Chauffeur</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((b) => (
                  <TableRow
                    key={b.id}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => setDetailBooking(b)}
                  >
                    <TableCell>{b.id}</TableCell>
                    <TableCell>{fmtDate(b.created_at)}</TableCell>
                    <TableCell>{b.user?.email || "—"}</TableCell>
                    <TableCell>
                      <StatusBadge status={b.status} />
                    </TableCell>
                    <TableCell>{b.driver?.name || "—"}</TableCell>

                    {/* actions */}
                    <TableCell
                      className="text-right space-x-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* confirmer */}
                      {b.status === "PENDING" && (
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => patchStatus(b.id, "CONFIRMED")}
                          title="Confirmer"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}

                      {/* assigner */}
                      {b.status === "CONFIRMED" && (
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => setAssignModalId(b.id)}
                          title="Assigner chauffeur"
                        >
                          <ClipboardList className="h-4 w-4" />
                        </Button>
                      )}

                      {/* notifier */}
                      {b.status === "DRIVER_ASSIGNED" && (
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => notifyDriver(b.id)}
                          title="Notifier chauffeur"
                        >
                          <SendHorizonal className="h-4 w-4" />
                        </Button>
                      )}

                      {/* démarrer (▶️) */}
                      {b.status === "DRIVER_ASSIGNED" && (
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => patchStatus(b.id, "IN_PROGRESS")}
                          title="Démarrer la course"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}

                      {/* terminer (✓) */}
                      {b.status === "IN_PROGRESS" && (
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => patchStatus(b.id, "COMPLETED")}
                          title="Terminer la course"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}

                      {/* annuler */}
                      {b.status !== "COMPLETED" && (
                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={() => patchStatus(b.id, "CANCELLED")}
                          title="Annuler"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* modales */}
      <DriverSelectModal
        openId={assignModalId}
        onClose={() => setAssignModalId(null)}
        onAssign={refresh}
      />
      <BookingDetailModal
        booking={detailBooking}
        onClose={() => setDetailBooking(null)}
      />
    </Fragment>
  );
}

/* -------------------------------------------------------------------------- */
/* DriverTable (inchangé)                                                     */
/* -------------------------------------------------------------------------- */
function DriverTable() {
  const { data, loading, refresh } = useRemoteData(API.drivers, []);
  const rows = unwrap(data);
  const [openCreate, setOpenCreate] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone_number: "",
    email: "",
    license_number: "",
    vehicle_info: "",
  });

  const handleCreate = async () => {
    const res = await fetchAuth(API.createDriver, {
      method: "POST",
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setOpenCreate(false);
      setForm({
        name: "",
        phone_number: "",
        email: "",
        license_number: "",
        vehicle_info: "",
      });
      refresh();
    } else alert("Erreur lors de la création");
  };

  return (
    <Fragment>
      <Card className="shadow-md rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-semibold flex items-center gap-2">
            <Car className="h-5 w-5" /> Chauffeurs
          </CardTitle>
          <Button onClick={() => setOpenCreate(true)}>
            <PlusCircle className="h-4 w-4 mr-1" />
            Ajouter
          </Button>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Véhicule</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>{d.id}</TableCell>
                    <TableCell>{d.name}</TableCell>
                    <TableCell>{d.phone_number}</TableCell>
                    <TableCell>{d.email}</TableCell>
                    <TableCell>
                      {d.vehicle_summary || d.vehicle_info || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog : création chauffeur */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle>Nouveau chauffeur</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            {[
              ["Nom", "name"],
              ["Téléphone", "phone_number"],
              ["Email", "email"],
              ["N° permis", "license_number"],
              ["Véhicule (marque / modèle / couleur)", "vehicle_info"],
            ].map(([label, key]) => (
              <div key={key} className="grid gap-1">
                <label className="text-sm">{label}</label>
                <Input
                  value={form[key]}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [key]: e.target.value }))
                  }
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={handleCreate} disabled={!form.name}>
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Fragment>
  );
}

/* -------------------------------------------------------------------------- */
/* Main : AdminDashboard                                                      */
/* -------------------------------------------------------------------------- */
export default function AdminDashboard() {
  const [tab, setTab] = useState("today");

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
        <PieChart className="h-6 w-6" /> Tableau de bord Admin
      </h1>

      <Tabs value={tab} onValueChange={setTab} className="space-y-8">
        <TabsList>
          <TabsTrigger value="today">Aujourd’hui</TabsTrigger>
          <TabsTrigger value="week">Semaine</TabsTrigger>
          <TabsTrigger value="month">Mois</TabsTrigger>
          <TabsTrigger value="drivers">Chauffeurs</TabsTrigger>
        </TabsList>

        {["today", "week", "month"].map((p) => (
          <TabsContent key={p} value={p} className="space-y-8">
            <MiniStats period={p} />
            <BookingTable period={p} />
          </TabsContent>
        ))}

        <TabsContent value="drivers">
          <DriverTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
