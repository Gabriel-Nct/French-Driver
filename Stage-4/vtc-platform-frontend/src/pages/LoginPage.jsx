import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const navigate = useNavigate();

  /* -------------------------------------------------- */
  /*  handleSubmit                                      */
  /* -------------------------------------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      /* ---------- Authentification ---------- */
      const res = await fetch("/api/auth/login/", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(
          data.detail ||
          Object.values(data).flat().join(" ") ||
          "Erreur lors de la connexion."
        );
        return;
      }

      const { access, refresh, user } = await res.json();

      /* ---------- Stockage ---------- */
      localStorage.setItem("access_token",  access);
      localStorage.setItem("refresh_token", refresh);
      localStorage.setItem("user",          JSON.stringify(user));
      window.dispatchEvent(new Event("userChanged"));

      /* ---------- Réservation en attente ---------- */
      const pendingRaw = localStorage.getItem("pendingBooking");
      if (pendingRaw) {
        const p = JSON.parse(pendingRaw);

        /* construction du payload avec scheduled_time obligatoire */
        const bookingPayload = {
          pickup_address:        p.departure.address,
          pickup_latitude:       Number(p.departure.lat),
          pickup_longitude:      Number(p.departure.lon),
          destination_address:   p.arrival.address,
          destination_latitude:  Number(p.arrival.lat),
          destination_longitude: Number(p.arrival.lon),
          estimated_price:       Number(p.quote.price),
          vehicle_type:          p.vehicle_type,
          scheduled_time:        p.scheduled_time || new Date().toISOString(),
        };

        /* envoi de la création */
        const createRes = await fetch("/api/bookings/create/", {
          method:  "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:  `Bearer ${access}`,
          },
          body: JSON.stringify(bookingPayload),
        });

        if (!createRes.ok) {
          const errJson = await createRes.json();
          console.error("❌ booking create 400 :", errJson);
          alert("Création de la réservation impossible : " + JSON.stringify(errJson));
        }

        localStorage.removeItem("pendingBooking");
      }

      /* ---------- Redirection ---------- */
      navigate(`/customer/${user.id}`);
    } catch (err) {
      setError(err.message || "Erreur réseau.");
    }
  };

  /* -------------------------------------------------- */
  /*  Render                                            */
  /* -------------------------------------------------- */
  return (
    <div className="bg-white min-h-screen flex flex-col lg:flex-row items-center justify-center p-4 overflow-x-hidden">
      <div className="flex items-center justify-center w-full lg:w-1/2 p-4">
        <Card className="w-full max-w-md bg-white border shadow-md hover:shadow-xl transition-transform duration-300 hover:-translate-y-1">
          <CardHeader>
            <h1 className="text-3xl font-semibold text-black text-center">
              Se connecter
            </h1>
          </CardHeader>

          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="username" className="text-black">
                  Email
                </Label>
                <Input
                  id="username"
                  type="email"
                  placeholder="test@exemple.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="rounded-xl bg-white text-black focus:outline-none focus:ring-2 focus:ring-black/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-black">
                  Mot de passe
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl bg-white text-black focus:outline-none focus:ring-2 focus:ring-black/20"
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 font-medium text-center">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full mt-4 rounded-xl hover:scale-105 transition-transform duration-200"
              >
                Connexion
              </Button>

              <div className="text-center text-sm text-gray-600 mt-2">
                Pas de compte ?{' '}
                <Link
                  to="/register"
                  className="font-semibold text-black hover:underline"
                >
                  S'inscrire
                </Link>
              </div>

              {/* Lien vers la page de connexion admin */}
              <div className="text-center text-sm text-gray-600 mt-1">
                Vous êtes administrateur ?{' '}
                <Link
                  to="/admin/login"
                  className="font-semibold text-black hover:underline"
                >
                  Connexion Admin
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-4">
        <img
          src="https://i.ibb.co/CKNb65mn/Chat-GPT-Image-23-juin-2025-a-16-58-22.png"
          alt="Illustration login"
          className="w-full max-w-xl object-contain"
        />
      </div>
    </div>
  );
}
