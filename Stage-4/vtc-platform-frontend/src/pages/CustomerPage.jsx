import React, { useEffect, useState } from "react";
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

/*****************************************************
 * Util – récupérer le token (MVP)
 *****************************************************/
function getToken() {
  return localStorage.getItem("access_token") || "";
}

/*****************************************************
 * StatusBadge – couleurs selon ShadCN design tokens
 *****************************************************/
function StatusBadge({ status }) {
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
}

/*****************************************************
 * ClientPage component – lecture seule
 * Affiche : profil + historique avec date, départ, arrivée, n° réservation, statut, facture
 *****************************************************/
export default function ClientPage({ client: clientProp }) {
  const [client, setClient] = useState(clientProp || null);
  const [loading, setLoading] = useState(!clientProp);
  const [error, setError] = useState("");

  useEffect(() => {
    if (clientProp) return; // mock déjà fourni
    const token = getToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    async function fetchData() {
      try {
        const profileRes = await fetch("/api/me", { headers });
        if (!profileRes.ok) throw new Error("Profile fetch failed");
        const profile = await profileRes.json();

        const bookingsRes = await fetch("/api/me/bookings?limit=30", {
          headers,
        });
        if (!bookingsRes.ok) throw new Error("Bookings fetch failed");
        const bookings = await bookingsRes.json();

        setClient({ ...profile, bookings });
      } catch (e) {
        console.error(e);
        setError("Impossible de charger vos données pour le moment.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [clientProp]);

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

  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Profil client */}
      <div>
        <Card className="shadow-md rounded-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">Profil client</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Nom</p>
              <p className="text-lg font-medium">{client.lastName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Prénom</p>
              <p className="text-lg font-medium">{client.firstName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Adresse mail</p>
              <p className="text-lg font-medium">{client.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Téléphone</p>
              <p className="text-lg font-medium">{client.phone}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historique des courses */}
      <div>
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
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Départ</TableHead>
                  <TableHead>Arrivée</TableHead>
                  <TableHead>N° réservation</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Facture</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {client.bookings.map((booking, idx) => (
                  <TableRow key={booking.id} className="hover:bg-muted/50">
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>
                      {new Date(booking.date).toLocaleString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>{booking.departureAddress}</TableCell>
                    <TableCell>{booking.arrivalAddress}</TableCell>
                    <TableCell>{booking.reservationNumber || booking.id}</TableCell>
                    <TableCell>
                      <StatusBadge status={booking.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {booking.invoiceUrl ? (
                        <Button size="icon" variant="outline" asChild>
                          <a
                            href={booking.invoiceUrl}
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
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/*****************************************************
 * mockClient – export pour tests locaux / App.jsx
 *****************************************************/
export const mockClient = {
  firstName: "Alice",
  lastName: "Martin",
  email: "alice.martin@example.com",
  phone: "+33 6 12 34 56 78",
  bookings: [
    {
      id: 1,
      date: "2025-06-20T14:30:00Z",
      status: "COMPLETED",
      departureAddress: "10 Rue de Rivoli, Paris",
      arrivalAddress: "Aéroport CDG Terminal 2E",
      reservationNumber: "RSV-0001",
      invoiceUrl: "/invoices/INV-001.pdf",
    },
    {
      id: 2,
      date: "2025-06-18T09:00:00Z",
      status: "CANCELLED",
      departureAddress: "Gare Saint-Lazare, Paris",
      arrivalAddress: "La Défense, Tour First",
      reservationNumber: "RSV-0002",
    },
    {
      id: 3,
      date: "2025-06-15T18:45:00Z",
      status: "IN_PROGRESS",
      departureAddress: "Montmartre, Paris",
      arrivalAddress: "75 Avenue des Champs-Élysées, Paris",
      reservationNumber: "RSV-0003",
    },
  ],
};
