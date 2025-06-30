import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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
import { DownloadIcon, Loader2, Car } from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Utils                                                                      */
/* -------------------------------------------------------------------------- */

const getToken = () => localStorage.getItem("access_token") || "";

const StatusBadge = ({ status }) => {
  let className = "capitalize";
  switch (status) {
    case "COMPLETED":
      className += " bg-green-600 text-white";
      break;
    case "CANCELLED":
      className += " bg-red-600 text-white";
      break;
    case "IN_PROGRESS":
      className += " bg-blue-600 text-white";
      break;
    default:
      className += " bg-gray-200 text-gray-800";
  }
  return <Badge className={className}>{status.toLowerCase()}</Badge>;
};

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function CustomerPage() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ----------------------------- Fetch profile ---------------------------- */
  useEffect(() => {
    const token = getToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const fetchData = async () => {
      try {
        /* 1. Profil utilisateur */
        const profileRes = await fetch("/api/auth/profile/", { headers });
        if (!profileRes.ok) throw new Error("profile");
        const profileJson = await profileRes.json();
        const profile = profileJson.data || profileJson;

        /* 2. Réservations de l’utilisateur */
        const bookingsRes = await fetch(
          `/api/bookings/user/${id}/?page_size=30`,
          { headers },
        );
        if (!bookingsRes.ok) throw new Error("bookings");
        const bookingsJson = await bookingsRes.json();
        const bookings =
          bookingsJson.results || bookingsJson.data || bookingsJson;

        setClient({ ...profile, bookings: Array.isArray(bookings) ? bookings : [] });
      } catch (e) {
        console.error(e);
        setError("Impossible de charger vos données.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
    else {
      setError("Identifiant utilisateur manquant dans l'URL.");
      setLoading(false);
    }
  }, [id]);

  /* ------------------------------- Rendu UI ------------------------------- */
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center text-red-600 font-semibold">
        {error}
      </div>
    );
  }

  if (!client) return null;

  const bookingsArray = client.bookings || [];

  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* ------------------------------------------------------------------ */}
      {/* Profil client                                                      */}
      {/* ------------------------------------------------------------------ */}
      <Card className="shadow-md rounded-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Profil client</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Detail label="Nom" value={client.last_name} />
          <Detail label="Prénom" value={client.first_name} />
          <Detail label="Email" value={client.email} />
          <Detail
            label="Téléphone"
            value={client.phone_number || client.phone || "—"}
          />
        </CardContent>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* Dernières courses                                                  */}
      {/* ------------------------------------------------------------------ */}
      <Card className="shadow-md rounded-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold flex items-center gap-2">
            <Car className="h-5 w-5" aria-hidden="true" />
            Dernières courses
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Départ</TableHead>
                <TableHead>Arrivée</TableHead>
                <TableHead>N° réservation</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Facture</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookingsArray.map((booking, idx) => (
                <TableRow key={booking.id || idx} className="hover:bg-muted/50">
                  <TableCell className="text-center">{idx + 1}</TableCell>

                  {/* Date & heure */}
                  <TableCell>
                    {new Date(booking.scheduled_time).toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>

                  {/* Adresses */}
                  <TableCell>{booking.pickup_address}</TableCell>
                  <TableCell>{booking.destination_address}</TableCell>

                  {/* Numéro de réservation */}
                  <TableCell>
                    {booking.confirmation_number || booking.id}
                  </TableCell>

                  {/* Statut */}
                  <TableCell>
                    <StatusBadge status={booking.status} />
                  </TableCell>

                  {/* Facture */}
                  <TableCell className="text-right">
                    {booking.invoice_url ? (
                      <Button size="icon" variant="outline" asChild>
                        <a
                          href={booking.invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Télécharger la facture"
                        >
                          <DownloadIcon className="h-4 w-4" />
                        </a>
                      </Button>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}

              {/* Aucune réservation */}
              {bookingsArray.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Aucune réservation pour l’instant.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Petits composants auxiliaires                                              */
/* -------------------------------------------------------------------------- */

const Detail = ({ label, value }) => (
  <div>
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="text-lg font-medium">{value}</p>
  </div>
);

/* -------------------------------------------------------------------------- */
/* Données factices exportées pour Storybook / tests                          */
/* -------------------------------------------------------------------------- */
export const mockClient = {
  first_name: "Alice",
  last_name: "Martin",
  email: "alice.martin@example.com",
  phone_number: "+33 6 12 34 56 78",
  bookings: [
    {
      id: 1,
      scheduled_time: "2025-06-20T14:30:00Z",
      status: "COMPLETED",
      pickup_address: "10 Rue de Rivoli, Paris",
      destination_address: "Aéroport CDG Terminal 2E",
      confirmation_number: "RSV-0001",
      invoice_url: "/invoices/INV-001.pdf",
    },
  ],
};
