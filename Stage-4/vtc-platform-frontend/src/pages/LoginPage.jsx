import React from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <div className="bg-white min-h-screen flex flex-col lg:flex-row items-center justify-center p-4 overflow-x-hidden">
      {/* Formulaire de connexion */}
      <div className="flex items-center justify-center w-full lg:w-1/2 p-4">
        <Card className="w-full max-w-md bg-white border shadow-md hover:shadow-xl transition-transform duration-300 hover:-translate-y-1">
          <CardHeader>
            <h1 className="text-3xl font-semibold text-black text-center">
              Connexion
            </h1>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-black">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
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
                  className="rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 bg-white text-black"
                />
              </div>

              <Button
  type="submit"
  className="w-full mt-4 rounded-xl hover:scale-105 transition-transform duration-200"
          >
            Se connecter
          </Button>

          <Button
            variant="outline"
            className="w-full mt-2 bg-black text-white border border-black rounded-xl hover:bg-neutral-900 hover:scale-105 transition-transform duration-200"
          >
            Créer un compte
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
          src="https://i.ibb.co/DH2jvgpF/Chat-GPT-Image-23-juin-2025-a-16-18-03.png"
          alt="Illustration"
          className="w-full max-w-xl object-contain"

        />
      </div>
    </div>
  );
}
