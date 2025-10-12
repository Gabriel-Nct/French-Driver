// src/components/ReservationMessageCard.jsx
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Clock,
  MapPin,
  Navigation,
  CalendarClock,
  Car,
  Users,
  Luggage,
  Euro,
} from "lucide-react";

export default function ReservationMessageCard() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card className="overflow-hidden border-0 shadow-lg">
        {/* Bandeau avec logo */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-700 text-white px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            {/* Logo French Driver (repris de ta navbar) */}
            <a
              href="/"
              className="group relative transition-all duration-300 hover:scale-105"
              aria-label="French Driver – Accueil"
            >
              <div className="text-lg sm:text-xl font-semibold tracking-tight">
                <span className="text-white group-hover:text-gray-200 transition-colors duration-300">
                  French
                </span>
                <span className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                  {" "}
                  Driver
                </span>
              </div>
            </a>

            {/* Titre confirmation */}
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6" />
              <div className="text-right">
                <p className="text-xs sm:text-sm text-white/80 leading-5">Confirmation</p>
                <h1 className="text-base sm:text-lg font-semibold">Réservation reçue</h1>
              </div>
            </div>
          </div>
        </div>

        <CardHeader className="pb-0">
          <CardTitle className="text-base font-medium text-slate-600">
            Bonjour Brahim Haddad,
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <p className="text-slate-700">
            Votre demande de réservation a bien été reçue.
          </p>

          {/* Détails */}
          <div className="rounded-xl border bg-white">
            <div className="p-4 border-b flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Statut</span>
              <Badge
                variant="secondary"
                className="gap-1 bg-amber-50 text-amber-700 border-amber-200"
              >
                <Clock className="h-4 w-4" /> En attente
              </Badge>
            </div>

            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Detail
                icon={<Euro className="w-4 h-4" />}
                label="Prix estimé"
                value="70.46 €"
              />
              <Detail
                icon={<CalendarClock className="w-4 h-4" />}
                label="Heure prévue"
                value="26 septembre 2025 à 10:27"
              />
              <Detail
                icon={<Car className="w-4 h-4" />}
                label="Véhicule"
                value="Eco"
              />
              <Detail
                icon={<Users className="w-4 h-4" />}
                label="Passagers"
                value="1"
              />
              <Detail
                icon={<Luggage className="w-4 h-4" />}
                label="Bagages"
                value="0"
              />
              <Detail
                icon={<Navigation className="w-4 h-4" />}
                label="Numéro"
                value="VTC000063"
              />
            </div>

            <div className="px-4 pb-4 space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-1 shrink-0 text-slate-500" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Départ
                  </p>
                  <p className="text-slate-800">
                    Aéroport de Paris-Charles-de-Gaulle, Tremblay-en-France
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-1 shrink-0 text-slate-500" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Destination
                  </p>
                  <p className="text-slate-800">Gare du Nord (RER), Paris</p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-slate-700">
            Nous vous tiendrons informé(e) de l&apos;évolution de votre demande.
          </p>

          <div className="text-slate-600">
            <p className="font-medium">Cordialement,</p>
            <p>L&apos;équipe French Driver</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Detail({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-slate-50 px-3 py-2">
      <div className="text-slate-500">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-slate-800 truncate">{value}</p>
      </div>
    </div>
  );
}
