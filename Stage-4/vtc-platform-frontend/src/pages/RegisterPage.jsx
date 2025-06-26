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

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setError("");
    // TODO: envoyer les données au back ici
    console.log({ firstName, lastName, email, phone, password });
    alert("Compte créé avec succès !");
  };

  return (
    <div className="bg-white min-h-screen flex flex-col lg:flex-row items-center justify-center p-4 overflow-x-hidden">
      {/* Formulaire d'inscription */}
      <div className="flex items-center justify-center w-full lg:w-1/2 p-4">
        <Card className="w-full max-w-md bg-white border shadow-md hover:shadow-xl transition-transform duration-300 hover:-translate-y-1">
          <CardHeader>
            <h1 className="text-3xl font-semibold text-black text-center">
              Créer un compte
            </h1>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-black">
                  Prénom
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Jean"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="rounded-xl bg-white text-black focus:outline-none focus:ring-2 focus:ring-black/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-black">
                  Nom
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Dupont"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="rounded-xl bg-white text-black focus:outline-none focus:ring-2 focus:ring-black/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-black">
                  Adresse mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jean.dupont@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl bg-white text-black focus:outline-none focus:ring-2 focus:ring-black/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-black">
                  Numéro de téléphone
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="06 12 34 56 78"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-black">
                  Confirmer le mot de passe
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                S'inscrire
              </Button>

              <div className="text-center text-sm text-gray-600 mt-2">
                Déjà un compte ?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-black hover:underline"
                >
                  Se connecter
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Image */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4">
        <img
          src="https://i.ibb.co/CKNb65mn/Chat-GPT-Image-23-juin-2025-a-16-58-22.png"
          alt="Illustration"
          className="w-full max-w-xl object-contain"
        />
      </div>
    </div>
  );
}