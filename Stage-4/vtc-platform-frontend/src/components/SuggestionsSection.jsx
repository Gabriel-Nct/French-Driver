import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const suggestions = [
  {
    title: "Déplacement",
    desc: "Déplacez-vous où bon vous semble avec French Driver. Réservez votre trajet en un clic et profitez du voyage !",
    img: "https://i.ibb.co/tk3C3C0/Sans-titre-2.png",
  },
  {
    title: "Réserver",
    desc: "Réservez dès maintenant et partez l'esprit tranquille le moment venu.",
    img: "https://i.ibb.co/KMFN7Xv/Chat-GPT-Image-2-juil-2025-a-11-36-49.png",
  },
  {
    title: "Nos Chauffeurs",
    desc: "Avec plus de 10 000 chauffeurs partenaires, nous sommes toujours là pour vous emmener.",
    img: "https://i.ibb.co/rK2G9TFh/Chat-GPT-Image-2-juil-2025-a-11-48-48.png",
  },
];

export default function SuggestionsSection() {
  return (
    <section className="max-w-7xl mx-auto my-16 px-4">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Nos Services French Driver
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Découvrez nos solutions de transport personnalisées pour tous vos déplacements
        </p>
      </div>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 justify-items-center">
        {suggestions.map((s) => (
          <Card key={s.title} className="group relative overflow-hidden border-0 shadow-lg bg-white rounded-2xl p-6 max-w-sm">
            <div className="flex flex-col items-center text-center space-y-4">
              <img
                src={s.img}
                alt={s.title}
                className="w-24 h-24 object-contain mb-2"
                loading="lazy"
              />
              
              <CardHeader className="p-0">
                <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                  {s.title}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-0">
                <p className="text-gray-600 leading-relaxed text-sm">
                  {s.desc}
                </p>
              </CardContent>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}