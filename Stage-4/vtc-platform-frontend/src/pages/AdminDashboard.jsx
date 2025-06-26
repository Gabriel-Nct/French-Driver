import React, { useEffect, useState, useMemo } from "react";
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
  Loader2,
  CheckCircle,
  XCircle,
  UserRound,
  PieChart,
  SendHorizonal,
  RotateCcw,
} from "lucide-react";

/*****************************************************
 * helpers
 *****************************************************/
function getToken() {
  return localStorage.getItem("access_token") || "";
}

function fmtDate(dateStr) {
  return new Date(dateStr).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }) {
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
}

/*****************************************************
 * Mini KPI component (today)
 *****************************************************/
function MiniStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = getToken();

  useEffect(() => {
    async function fetchStats() {
      const res = await fetch("/api/admin/dashboard?period=today", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setStats(json.data);
      }
      setLoading(false);
    }
    fetchStats();
  }, [token]);

  if (loading)
    return (
      <Card className="p-8 flex justify-center">
        <Loader2 className="animate-spin h-6 w-6" />
      </Card>
    );
  if (!stats) return null;

  const items = [
    { label: "Total aujourd’hui", value: stats.total_bookings },
    { label: "En attente", value: stats.pending_bookings },
    { label: "En cours", value: stats.in_progress_bookings },
    { label: "Terminées", value: stats.completed_bookings },
    { label: "CA €", value: stats.total_revenue || 0 },
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

/*****************************************************
 * BookingTable – liste + filtres / tri
 *****************************************************/
function BookingTable() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const token = getToken();

  async function refresh() {
    setLoading(true);
    const res = await fetch("/api/admin/dashboard?period=week", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const json = await res.json();
      setRows(json.data.recent_bookings || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return rows;
    return rows.filter((b) => {
      const term = search.toLowerCase();
      return (
        b.user?.email?.toLowerCase().includes(term) ||
        b.confirmation_number?.toLowerCase().includes(term)
      );
    });
  }, [rows, search]);

  /* ----- mutations (status / notify) ----- */
  async function patchStatus(id, nextStatus) {
    const res = await fetch(`/api/admin/bookings/${id}/update/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(`Échec de la mise à jour : ${err?.status?.[0] || res.status}`);
    }
    refresh();
  }

  async function notifyDriver(id) {
    const res = await fetch("/api/admin/dispatch/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action: "broadcast", booking_id: id }),
    });
    if (res.ok) {
      alert("Message envoyé ✔️");
    } else {
      alert("Échec de l'envoi 📛");
    }
  }

  return (
    <Card className="shadow-md rounded-2xl">
      <CardHeader className="space-y-4">
        <CardTitle className="text-2xl font-semibold flex items-center gap-2">
          <UserRound className="h-5 w-5" /> Toutes les réservations
        </CardTitle>
        <Input
          placeholder="Rechercher par email ou n° de réservation…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Chauffeur</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((b) => (
                <TableRow key={b.id} className="hover:bg-muted/50">
                  <TableCell>{b.id}</TableCell>
                  <TableCell>{fmtDate(b.created_at)}</TableCell>
                  <TableCell>{b.user?.email || "—"}</TableCell>
                  <TableCell>
                    <StatusBadge status={b.status} />
                  </TableCell>
                  <TableCell>{b.driver?.name || "—"}</TableCell>
                  <TableCell className="text-right space-x-2">
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
                    {b.status === "DRIVER_ASSIGNED" && (
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => notifyDriver(b.id)}
                        title="Notifier le chauffeur"
                      >
                        <SendHorizonal className="h-4 w-4" />
                      </Button>
                    )}
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
                    {b.status === "COMPLETED" && (
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => patchStatus(b.id, "IN_PROGRESS")}
                        title="Revenir à EN COURS"
                      >
                        <RotateCcw className="h-4 w-4" />
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
  );
}

/*****************************************************
 * MAIN AdminDashboard page
 *****************************************************/
export default function AdminDashboard() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
        <PieChart className="h-6 w-6" /> Tableau de bord Admin
      </h1>

      {/* KPI */}
      <MiniStats />

      {/* Queue à traiter (au-dessus pour focus) */}
      <BookingTable />
    </div>
  );
}
