import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPageAdmin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: authentification admin ici
    console.log("Admin login:", { username, password });
    alert("Connexion administrateur en cours...");
  };

  return (
    <div className="bg-white min-h-screen flex flex-col lg:flex-row items-center justify-center p-4 overflow-x-hidden">
      {/* Formulaire de connexion admin */}
      <div className="flex items-center justify-center w-full lg:w-1/2 p-4">
        <Card className="w-full max-w-md bg-white border shadow-md hover:shadow-xl transition-transform duration-300 hover:-translate-y-1">
          <CardHeader>
            <h1 className="text-3xl font-semibold text-black text-center">
              Connexion Admin
            </h1>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="username" className="text-black">
                  Nom d'utilisateur
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="admin123"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 bg-white text-black"
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
                  className="rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 bg-white text-black"
                />
              </div>

              <Button
                type="submit"
                className="w-full mt-4 rounded-xl hover:scale-105 transition-transform duration-200"
              >
                Se connecter
              </Button>

              <div className="text-right mt-2">
                <Link
                  to="#"
                  className="text-sm text-gray-600 hover:text-black transition-colors"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Image à droite */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4">
        <img
          src="https://i.ibb.co/Z42Hpj9/Chat-GPT-Image-23-juin-2025-a-19-19-42.png"
          alt="Illustration Admin"
          className="w-full max-w-xl object-contain"
        />
      </div>
    </div>
  );
}
