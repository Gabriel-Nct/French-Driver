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
  ChevronLeft,
  ChevronRight,
  Search,
  Phone,
  Mail,
  User,
  MessageCircle,
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
/* Pagination Component                                                       */
/* -------------------------------------------------------------------------- */
function Pagination({ currentPage, totalPages, onPageChange }) {
  const pages = [];
  const showPages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
  let endPage = Math.min(totalPages, startPage + showPages - 1);
  
  if (endPage - startPage + 1 < showPages) {
    startPage = Math.max(1, endPage - showPages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center space-x-2 mt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      {startPage > 1 && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
          >
            1
          </Button>
          {startPage > 2 && <span className="px-2">...</span>}
        </>
      )}
      
      {pages.map((page) => (
        <Button
          key={page}
          variant={currentPage === page ? "default" : "outline"}
          size="sm"
          onClick={() => onPageChange(page)}
        >
          {page}
        </Button>
      ))}
      
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="px-2">...</span>}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
          >
            {totalPages}
          </Button>
        </>
      )}
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

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
      <DialogContent className="max-w-2xl overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Détails réservation n°{booking.confirmation_number || booking.id}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Informations Client */}
          <Card className="p-4">
            <CardTitle className="text-lg mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Informations Client
            </CardTitle>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Nom :</span>
                {booking.user?.first_name && booking.user?.last_name ? (
                  <span>{booking.user.first_name} {booking.user.last_name}</span>
                ) : (
                  <span className="text-gray-500">Non renseigné</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Email :</span>
                <span>{booking.user?.email || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Téléphone :</span>
                {booking.user?.phone_number ? (
                  <span>{booking.user.phone_number}</span>
                ) : (
                  <span className="text-gray-500">Non renseigné</span>
                )}
              </div>
            </div>
          </Card>

          {/* Informations Trajet */}
          <Card className="p-4">
            <CardTitle className="text-lg mb-3 flex items-center gap-2">
              <Car className="h-4 w-4" />
              Informations Trajet
            </CardTitle>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Départ :</strong> {booking.pickup_address}
              </p>
              <p>
                <strong>Destination :</strong> {booking.destination_address}
              </p>
              <p>
                <strong>Heure prévue :</strong> {fmtDate(booking.scheduled_time)}
              </p>
              <p>
                <strong>Prix estimé :</strong> {booking.estimated_price}€
              </p>
              {booking.final_price && booking.final_price !== booking.estimated_price && (
                <p>
                  <strong>Prix final :</strong> {booking.final_price}€
                </p>
              )}
            </div>
          </Card>

          {/* Informations Chauffeur */}
          {booking.driver && (
            <Card className="p-4">
              <CardTitle className="text-lg mb-3 flex items-center gap-2">
                <UserRound className="h-4 w-4" />
                Chauffeur Assigné
              </CardTitle>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Nom :</strong> {booking.driver.name}
                </p>
                <p>
                  <strong>Téléphone :</strong> {booking.driver.phone_number}
                </p>
                <p>
                  <strong>Email :</strong> {booking.driver.email}
                </p>
                <p>
                  <strong>Véhicule :</strong> {booking.driver.vehicle_summary || booking.driver.vehicle_info}
                </p>
              </div>
            </Card>
          )}

          {/* Informations Système */}
          <Card className="p-4">
            <CardTitle className="text-lg mb-3">Informations Système</CardTitle>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Statut :</strong> <StatusBadge status={booking.status} />
              </p>
              <p>
                <strong>Créée le :</strong> {fmtDate(booking.created_at)}
              </p>
              {booking.completed_at && (
                <p>
                  <strong>Terminée le :</strong> {fmtDate(booking.completed_at)}
                </p>
              )}
              {booking.invoice_number && (
                <p>
                  <strong>Facture :</strong> {booking.invoice_number}
                </p>
              )}
            </div>
          </Card>
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
/* BookingTable avec Pagination                                              */
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  /* ----- filtres et pagination ----- */
  const filtered = useMemo(() => {
    const result = rows.filter((b) => {
      if (statusFilter !== "ALL" && b.status !== statusFilter) return false;
      if (!search) return true;
      const t = search.toLowerCase();
      return (
        b.user?.email?.toLowerCase().includes(t) ||
        b.user?.first_name?.toLowerCase().includes(t) ||
        b.user?.last_name?.toLowerCase().includes(t) ||
        b.user?.phone_number?.toLowerCase().includes(t) ||
        b.confirmation_number?.toLowerCase().includes(t) ||
        b.id.toString().includes(t)
      );
    });
    return result;
  }, [rows, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filtered.slice(startIndex, startIndex + itemsPerPage);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  /* ----- rendu ----- */
  return (
    <Fragment>
      <Card className="shadow-md rounded-2xl">
        {/* barre de recherche + filtres */}
        <CardHeader className="space-y-4">
          <CardTitle className="text-2xl font-semibold flex items-center gap-2">
            <UserRound className="h-5 w-5" /> 
            Réservations ({period}) - {filtered.length} résultat(s)
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative sm:w-1/3">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par email, nom, téléphone, n°..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {[
                  { value: "ALL", label: "Tous statuts" },
                  { value: "PENDING", label: "En attente" },
                  { value: "CONFIRMED", label: "Confirmée" },
                  { value: "DRIVER_ASSIGNED", label: "Chauffeur assigné" },
                  { value: "IN_PROGRESS", label: "En cours" },
                  { value: "COMPLETED", label: "Terminée" },
                  { value: "CANCELLED", label: "Annulée" },
                ].map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
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
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Chauffeur</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((b) => (
                    <TableRow
                      key={b.id}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => setDetailBooking(b)}
                    >
                      <TableCell className="font-medium">{b.id}</TableCell>
                      <TableCell>{fmtDate(b.created_at)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {b.user?.first_name && b.user?.last_name 
                              ? `${b.user.first_name} ${b.user.last_name}`
                              : b.user?.email || "—"
                            }
                          </div>
                          {b.user?.email && b.user?.first_name && (
                            <div className="text-sm text-gray-500">
                              {b.user.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {b.user?.phone_number ? (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {b.user.phone_number}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
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

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
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
/* DriverTable avec recherche améliorée                                      */
/* -------------------------------------------------------------------------- */
function DriverTable() {
  const { data, loading, refresh } = useRemoteData(API.drivers, []);
  const rows = unwrap(data);
  const [openCreate, setOpenCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [form, setForm] = useState({
    name: "",
    phone_number: "",
    email: "",
    license_number: "",
    vehicle_info: "",
    telegram_chat_id: "",
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
        telegram_chat_id: "",
      });
      refresh();
    } else {
      const errorData = await res.json();
      alert(`Erreur lors de la création: ${errorData.error || 'Erreur inconnue'}`);
    }
  };

  // Filtres et pagination pour les chauffeurs
  const filteredDrivers = useMemo(() => {
    if (!search) return rows;
    const t = search.toLowerCase();
    return rows.filter((d) =>
      d.name?.toLowerCase().includes(t) ||
      d.phone_number?.toLowerCase().includes(t) ||
      d.email?.toLowerCase().includes(t) ||
      d.license_number?.toLowerCase().includes(t)
    );
  }, [rows, search]);

  const totalPages = Math.ceil(filteredDrivers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDrivers = filteredDrivers.slice(startIndex, startIndex + itemsPerPage);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  return (
    <Fragment>
      <Card className="shadow-md rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex-1">
            <CardTitle className="text-2xl font-semibold flex items-center gap-2 mb-4">
              <Car className="h-5 w-5" /> 
              Chauffeurs ({filteredDrivers.length})
            </CardTitle>
            <div className="flex gap-2 items-center">
              <div className="relative w-80">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom, téléphone, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          <Button onClick={() => setOpenCreate(true)} className="ml-4">
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
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Véhicule</TableHead>
                    <TableHead>Telegram</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedDrivers.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.id}</TableCell>
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {d.phone_number}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {d.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        {d.vehicle_summary || d.vehicle_info || "—"}
                      </TableCell>
                      <TableCell>
                        {d.telegram_chat_id ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <MessageCircle className="h-3 w-3" />
                            Configuré
                          </div>
                        ) : (
                          <span className="text-gray-400">Non configuré</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination pour les chauffeurs */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog : création chauffeur avec Chat ID Telegram */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="max-w-lg bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5" />
              Nouveau chauffeur
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            {[
              {
                label: "Nom complet *",
                key: "name",
                type: "text",
                placeholder: "Ex: Jean Dupont",
                icon: User
              },
              {
                label: "Téléphone *",
                key: "phone_number",
                type: "tel",
                placeholder: "Ex: +33123456789",
                icon: Phone
              },
              {
                label: "Email *",
                key: "email",
                type: "email",
                placeholder: "Ex: jean.dupont@example.com",
                icon: Mail
              },
              {
                label: "N° de licence VTC *",
                key: "license_number",
                type: "text",
                placeholder: "Ex: VTC123456789",
                icon: ClipboardList
              },
            ].map(({ label, key, type, placeholder, icon: Icon }) => (
              <div key={key} className="grid gap-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {label}
                </label>
                <Input
                  type={type}
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [key]: e.target.value }))
                  }
                  className="w-full"
                />
              </div>
            ))}
            
            {/* Champ véhicule avec textarea */}
            <div className="grid gap-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Car className="h-4 w-4" />
                Informations véhicule *
              </label>
              <textarea
                placeholder="Ex: Mercedes Classe E - Noire - AB-123-CD"
                value={form.vehicle_info}
                onChange={(e) =>
                  setForm((f) => ({ ...f, vehicle_info: e.target.value }))
                }
                className="w-full p-2 border border-gray-300 rounded-md resize-none h-20"
              />
              <p className="text-xs text-gray-500">
                Marque, modèle, couleur, plaque d'immatriculation
              </p>
            </div>

            {/* Nouveau champ Chat ID Telegram */}
            <div className="grid gap-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Chat ID Telegram (optionnel)
              </label>
              <Input
                type="text"
                placeholder="Ex: 123456789"
                value={form.telegram_chat_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, telegram_chat_id: e.target.value }))
                }
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Le chauffeur peut obtenir son Chat ID en envoyant /start au bot Telegram
              </p>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-blue-700">
                <strong>Note :</strong> Les champs marqués d'un * sont obligatoires. 
                Le Chat ID Telegram permettra au chauffeur de recevoir des notifications.
              </p>
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setOpenCreate(false)}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleCreate} 
              disabled={!form.name || !form.phone_number || !form.email || !form.license_number || !form.vehicle_info}
            >
              Créer le chauffeur
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
    <div className="container mx-auto pt-20 pb-8 px-4 space-y-8">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <PieChart className="h-6 w-6" /> Tableau de bord Admin
      </h1>

      <Tabs value={tab} onValueChange={setTab} className="space-y-8">
        <TabsList>
          <TabsTrigger value="today">Aujourd'hui</TabsTrigger>
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