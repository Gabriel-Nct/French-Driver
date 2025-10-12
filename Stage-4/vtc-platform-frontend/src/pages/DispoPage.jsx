// src/pages/DispoPage.jsx
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Phone,
  Mail,
  Car,
  Users,
  Shield,
  Clock,
  MapPin,
  BadgeCheck,
  Calendar,
  CreditCard,
  Luggage,
  Baby,
  Wifi
} from "lucide-react";

export default function DispoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/40">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 pt-16 pb-10 sm:pt-24">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Mise à disposition avec chauffeur privé
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-prose">
            Un chauffeur dédié pour vous accompagner à l’heure, à la demi-journée ou à la journée.
            Idéal pour rendez-vous en série, mariages, salons, roadshows, visites clients ou
            transferts longue distance.
          </p>

          {/* USP bar */}
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-xl border bg-background p-4">
              <Clock className="h-6 w-6 text-primary" />
              <div>
                <p className="font-semibold">Ponctualité garantie</p>
                <p className="text-sm text-muted-foreground">Suivi temps réel &amp; marge d’anticipation</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border bg-background p-4">
              <Shield className="h-6 w-6 text-primary" />
              <div>
                <p className="font-semibold">Chauffeurs pros &amp; assurés</p>
                <p className="text-sm text-muted-foreground">Expérimentés, discrets, multilingues</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border bg-background p-4">
              <BadgeCheck className="h-6 w-6 text-primary" />
              <div>
                <p className="font-semibold">Forfait clair</p>
                <p className="text-sm text-muted-foreground">Tarif au km, sans frais cachés</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Véhicules avec specs concrètes */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-bold mb-6">Nos véhicules</h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="shadow-md hover:shadow-lg transition">
            <CardHeader>
              <Car className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Berline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Confort business pour 1 à 3 passagers. Idéal rendez-vous et déplacements urbains/region.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Climatisation bi-zone, sièges confort</li>
                <li>
                  <Luggage className="inline h-4 w-4 mr-1" />
                  2–3 bagages cabine
                </li>
                <li>
                  <Wifi className="inline h-4 w-4 mr-1" />
                  Eau &amp; chargeurs à bord
                </li>
                <li>
                  <Baby className="inline h-4 w-4 mr-1" />
                  Siège bébé sur demande (gratuit)
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition">
            <CardHeader>
              <Users className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Van</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Parfait pour groupes/familles jusqu’à 7 passagers + bagages.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Sièges indépendants, accès aisé</li>
                <li>
                  <Luggage className="inline h-4 w-4 mr-1" />
                  6–8 bagages (selon configuration)
                </li>
                <li>Idéal événements &amp; navettes hôtels</li>
                <li>Vitres surteintées, discrétion</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition">
            <CardHeader>
              <Car className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Berline haut de gamme</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Luxe &amp; standing pour vos moments clés (Cérémonies, VIP, direction).
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Sellerie premium, suspension confort</li>
                <li>Accueil soigné, tenue professionnelle</li>
                <li>Discrétion &amp; confidentialité</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Ce qui est inclus */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-xl border bg-background p-6 sm:p-8">
          <h3 className="text-xl font-semibold mb-4">Toujours inclus dans votre mise à disposition</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
            <div className="flex items-start gap-3">
              <BadgeCheck className="mt-0.5 h-5 w-5 text-primary" />
              <p>Chauffeur privé dédié pendant toute la durée</p>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-5 w-5 text-primary" />
              <p>Attente et détours raisonnables compris</p>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 text-primary" />
              <p>Itinéraire à la demande (multi-arrêts)</p>
            </div>
            <div className="flex items-start gap-3">
              <Wifi className="mt-0.5 h-5 w-5 text-primary" />
              <p>Bouteille d’eau &amp; chargeurs</p>
            </div>
            <div className="flex items-start gap-3">
              <Baby className="mt-0.5 h-5 w-5 text-primary" />
              <p>Rehausseur/siège enfant sur demande</p>
            </div>
            <div className="flex items-start gap-3">
              <CreditCard className="mt-0.5 h-5 w-5 text-primary" />
              <p>Paiement CB/espèces &amp; facture envoyée</p>
            </div>
          </div>
        </div>
      </section>

      {/* Exemples de prix (indicatifs, basés sur vos règles au km/minimum) */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <h3 className="text-xl font-semibold mb-4">Exemples de forfaits (indicatifs)</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Tarification au kilomètre, temps d’attente inclus. Le prix final dépend du nombre de kilomètres
          réellement parcourus (minimum appliqué selon la catégorie).
        </p>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>2h – 50&nbsp;km</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>Berline&nbsp;: ~160&nbsp;€ (3,20€/km)</p>
              <p>Van&nbsp;: ~200&nbsp;€ (4,00€/km)</p>
              <p>Eco&nbsp;: ~125&nbsp;€ (2,50€/km)</p>
              <p className="text-xs text-muted-foreground">Exemple : tournée de RDV en ville + périphérie</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>1/2 journée – 100&nbsp;km</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>Berline&nbsp;: ~320&nbsp;€</p>
              <p>Van&nbsp;: ~400&nbsp;€</p>
              <p>Eco&nbsp;: ~250&nbsp;€</p>
              <p className="text-xs text-muted-foreground">Exemple : salons/prospects + aéroport</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Journée – 200&nbsp;km</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>Berline&nbsp;: ~640&nbsp;€</p>
              <p>Van&nbsp;: ~800&nbsp;€</p>
              <p>Eco&nbsp;: ~500&nbsp;€</p>
              <p className="text-xs text-muted-foreground">Exemple : mariage / roadshow complet</p>
            </CardContent>
          </Card>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Besoin d’un devis précis ? Utilisez l’estimation en ligne ou contactez-nous — réponse rapide.
        </p>
      </section>

      {/* Comment ça marche */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <h3 className="text-xl font-semibold mb-4">Comment ça marche&nbsp;?</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-background p-5">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-5 w-5 text-primary" />
              <p className="font-semibold">1. Vous planifiez</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Donnez la date, les plages horaires et les étapes (si connues). Nous ajustons ensemble.
            </p>
          </div>
          <div className="rounded-xl border bg-background p-5">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-primary" />
              <p className="font-semibold">2. Confirmation claire</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Récapitulatif par e-mail avec le véhicule, le chauffeur et le tarif estimé.
            </p>
          </div>
          <div className="rounded-xl border bg-background p-5">
            <div className="flex items-center gap-2 mb-2">
              <Car className="h-5 w-5 text-primary" />
              <p className="font-semibold">3. Jour J</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Chauffeur à l’heure au point de prise en charge. Itinéraire souple selon vos besoins.
            </p>
          </div>
        </div>
      </section>

      {/* Zones desservies */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-xl border bg-background p-6 sm:p-8">
          <h3 className="text-xl font-semibold mb-4">Zones desservies</h3>
          <p className="text-sm text-muted-foreground">
            Départs/arrivées en métropole et grandes agglomérations voisines. Longues distances et trajets
            inter-villes possibles sur demande (France / pays limitrophes). Détail précis communiqué au devis.
          </p>
        </div>
      </section>

      {/* FAQ courte */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <h3 className="text-xl font-semibold mb-4">Questions fréquentes</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Peut-on ajouter des arrêts en cours de route&nbsp;?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Oui, la mise à disposition est souple. Le tarif s’adapte simplement aux kilomètres réellement parcourus.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Comment est calculé le prix&nbsp;?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Au km, avec un minimum selon la catégorie. Le temps d’attente est inclus — pas de facturation à la minute.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Peut-on obtenir une facture&nbsp;?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Bien sûr. Elle est envoyée automatiquement par e-mail après la prestation.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Annulation / modification&nbsp;?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Flexible tant que le chauffeur n’est pas en route. Au-delà, seules les dépenses engagées peuvent être dues.
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact direct (gros CTA) */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="mx-auto max-w-4xl px-4 text-center space-y-6">
          <h2 className="text-3xl font-bold sm:text-4xl">Réservez votre chauffeur dès maintenant</h2>
          <p className="text-lg opacity-90">
            Réponse rapide 7j/7. Devis précis en quelques minutes.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6 mt-8">
            <a
              href="tel:+33XXXXXXXXX"
              className="flex items-center justify-center gap-2 text-2xl font-semibold underline-offset-4 hover:underline"
            >
              <Phone className="h-7 w-7" /> +33 X XX XX XX XX
            </a>
            <a
              href="mailto:contact@votre-domaine.fr?subject=Demande%20mise%20%C3%A0%20disposition"
              className="flex items-center justify-center gap-2 text-2xl font-semibold underline-offset-4 hover:underline"
            >
              <Mail className="h-7 w-7" /> contact@votre-domaine.fr
            </a>
          </div>
          <p className="text-sm opacity-80 mt-4">
            Précisez la date, les horaires et les étapes si possible — on s’occupe du reste.
          </p>
        </div>
      </section>
    </div>
  );
}
