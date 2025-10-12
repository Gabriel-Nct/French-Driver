// src/pages/ConditionsPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";

export default function ConditionsPage() {
  const lastUpdate = "10/10/2025";

  // --- Bouton “haut de page” ---
  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    onScroll(); // init
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // --- Scroll animé du sommaire ---
  const handleTocClick = useCallback((e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", `#${id}`);
  }, []);

  // Liste des sections pour le sommaire
  const TOC = [
    { id: "objet", label: "1. Objet" },
    { id: "definitions", label: "2. Définitions" },
    { id: "acceptation", label: "3. Acceptation" },
    { id: "prestations", label: "4. Prestations" },
    { id: "commande", label: "5. Commande & Confirmation" },
    { id: "tarifs", label: "6. Tarification & Paiement" },
    { id: "attente", label: "7. Retards, Attente & No-show" },
    { id: "annulation", label: "8. Annulation" },
    { id: "securite", label: "9. Sécurité & Comportement" },
    { id: "animaux-pmr", label: "10. Animaux, PMR" },
    { id: "nettoyage", label: "11. Dégradations & Nettoyage" },
    { id: "imprevus", label: "12. Imprévus & Force majeure" },
    { id: "responsabilite", label: "13. Responsabilité & Assurances" },
    { id: "support", label: "14. Service client" },
    { id: "pi", label: "15. Propriété intellectuelle" },
    { id: "droit", label: "16. Droit applicable – Juridiction" },
  ];

  return (
    <div className="mx-auto max-w-4xl pt-28 pb-12 md:pt-32">
      {/* Ancre haute pour les liens “Retour en haut” */}
      <span id="top" />

      <Card className="shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl sm:text-3xl">
            Conditions Générales de Vente – French Driver (VTC)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Dernière mise à jour : {lastUpdate}
          </p>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Sommaire */}
          <nav className="rounded-lg border p-4">
            <p className="font-medium mb-2">Sommaire</p>
            <ul className="grid sm:grid-cols-2 gap-y-1 text-sm">
              {TOC.map((item) => (
                <li key={item.id}>
                  <a
                    className="hover:underline"
                    href={`#${item.id}`}
                    onClick={(e) => handleTocClick(e, item.id)}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <Separator />

          {/* 1. Objet */}
          <section id="objet" className="space-y-3 scroll-mt-28 md:scroll-mt-32">
            <h2 className="text-xl font-semibold">1. Objet</h2>
            <p>
              Les présentes Conditions Générales de Vente (« CGV ») régissent les
              prestations de <strong>transport de personnes</strong> et de{" "}
              <strong>mise à disposition de véhicule avec chauffeur</strong>{" "}
              proposées par <strong>French Driver</strong> via son site et/ou application
              (la « Plateforme »). Toute commande vaut acceptation sans réserve des CGV.
            </p>
          </section>

          {/* 2. Définitions */}
          <section id="definitions" className="space-y-3 scroll-mt-28 md:scroll-mt-32">
            <h2 className="text-xl font-semibold">2. Définitions</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Client</strong> : personne qui passe commande (compte ou invité).</li>
              <li><strong>Passager</strong> : personne transportée (peut être différente du Client).</li>
              <li><strong>Prestation</strong> : course point à point et/ou mise à disposition.</li>
              <li><strong>Chauffeur</strong> : conducteur professionnel effectuant la Prestation.</li>
              <li><strong>Confirmation</strong> : récapitulatif de commande validé sur la Plateforme.</li>
            </ul>
          </section>

          {/* 3. Acceptation */}
          <section id="acceptation" className="space-y-3 scroll-mt-28 md:scroll-mt-32">
            <h2 className="text-xl font-semibold">3. Acceptation des CGV</h2>
            <p>
              La validation de la commande est subordonnée à la case «{" "}
              <strong>J’ai lu et j’accepte les CGV</strong> ». Les CGV applicables sont
              celles en vigueur au moment de la Confirmation.
            </p>
          </section>

          {/* 4. Prestations */}
          <section id="prestations" className="space-y-3 scroll-mt-28 md:scroll-mt-32">
            <h2 className="text-xl font-semibold">4. Description des Prestations</h2>
            <p>
              <strong>Course point à point.</strong> Prise en charge à l’adresse indiquée
              et dépose au lieu demandé. L’itinéraire est optimisé par le Chauffeur selon
              la sécurité et le trafic.
            </p>
            <p>
              <strong>Mise à disposition.</strong> Véhicule avec Chauffeur pendant une
              durée déterminée (détails affichés lors de la réservation).
            </p>
            <div className="rounded-md border p-4">
              <p className="font-medium">Catégories & capacités</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li><strong>Eco / Berline</strong> : jusqu’à <strong>3 passagers</strong> max.</li>
                <li><strong>Van</strong> : jusqu’à <strong>6 passagers</strong> max.</li>
              </ul>
              <p className="mt-2 text-sm text-muted-foreground">
                Au-delà de la capacité, <strong>un véhicule supplémentaire</strong> est
                nécessaire et <strong>des coûts additionnels</strong> s’appliquent.
              </p>
            </div>
            <p>
              <strong>Bagages.</strong> Acceptés dans la limite de la capacité du véhicule
              réservé (dimension/quantité raisonnables).
            </p>
            <p>
              <strong>Sièges enfants.</strong> <u>À signaler impérativement lors de la réservation</u> pour
              vérification de disponibilité (obligations de sécurité applicables).
            </p>
          </section>

          {/* 5. Commande */}
          <section id="commande" className="space-y-3 scroll-mt-28 md:scroll-mt-32">
            <h2 className="text-xl font-semibold">5. Commande & Confirmation</h2>
            <p>
              Le Client fournit des informations exactes (adresses, horaires, téléphone joignable).
              La Prestation est formée à la <strong>Confirmation</strong> affichée sur la Plateforme.
            </p>
            <p>
              Toute <strong>modification</strong> post-Confirmation (horaires, adresses, arrêts) est
              <strong> sous réserve de disponibilité</strong> et peut entraîner un{" "}
              <strong>réajustement de prix</strong> (affiché avant validation).
            </p>
          </section>

          {/* 6. Tarifs */}
          <section id="tarifs" className="space-y-3 scroll-mt-28 md:scroll-mt-32">
            <h2 className="text-xl font-semibold">6. Tarification & Paiement</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Prix affiché</strong> : prix dû au moment de la Confirmation (taxes incluses).</li>
              <li>
                <strong>Suppléments inclus</strong> : <u>péages</u>, <u>parkings</u> et
                <u> éventuels surcoûts de nuit</u> sont inclus dans le prix confirmé ;
                aucun paiement complémentaire n’est dû au Chauffeur.
              </li>
              <li>
                <strong>Attente facturable</strong> : au-delà de la franchise (cf. art. 7),
                l’attente est facturée <strong>1,50 € / minute</strong>.
              </li>
              <li>
                <strong>Paiement & Facture</strong> : encaissement selon les modalités proposées
                sur la Plateforme. <u>Facture émise et envoyée par French Driver</u>.
              </li>
            </ul>
          </section>

          {/* 7. Attente */}
          <section id="attente" className="space-y-3 scroll-mt-28 md:scroll-mt-32">
            <h2 className="text-xl font-semibold">7. Retards, Attente & No-show</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Franchise d’attente</strong> : le Chauffeur attend au point de prise en charge.
                <u> Au-delà de 20 minutes</u>, frais d’attente de <strong>1,50 € / minute</strong>
                (à compter de la 21ᵉ minute).
              </li>
              <li>
                <strong>Non-présentation</strong> : sans instruction au-delà d’un délai raisonnable,
                la course peut être annulée et <strong>intégralement facturée</strong> (no-show).
              </li>
              <li>
                <strong>Arrêts/détours</strong> : non prévus ou significatifs ⇒ <strong>réajustement de prix</strong>.
              </li>
            </ul>
          </section>

          {/* 8. Annulation */}
          <section id="annulation" className="space-y-3 scroll-mt-28 md:scroll-mt-32">
            <h2 className="text-xl font-semibold">8. Annulation</h2>
            <p>
              Les conditions d’annulation applicables (délais, éventuels frais, cas de force majeure)
              sont <strong>celles affichées sur la page de réservation</strong> au moment de la commande.
              À défaut d’indication spécifique, l’annulation tardive ou la non-présentation peut être
              <strong> facturée jusqu’à 100 %</strong>.
            </p>
          </section>

          {/* 9. Sécurité */}
          <section id="securite" className="space-y-3 scroll-mt-28 md:scroll-mt-32">
            <h2 className="text-xl font-semibold">9. Sécurité & Comportement</h2>
            <p>
              Port de la ceinture <strong>obligatoire</strong>. Interdiction de fumer, vapoter,
              consommer alcool/drogues. Le Chauffeur peut <strong>refuser</strong> ou{" "}
              <strong>interrompre</strong> la Prestation en cas de <strong>risque</strong>
              (comportement dangereux, surcharge, non-respect des règles).
            </p>
          </section>

          {/* 10. Animaux / PMR */}
          <section id="animaux-pmr" className="space-y-3 scroll-mt-28 md:scroll-mt-32">
            <h2 className="text-xl font-semibold">10. Animaux, PMR</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Animaux</strong> : <u>à signaler obligatoirement</u> lors de la réservation.
                Acceptation selon le véhicule et les conditions (conteneur/harnais, propreté).
              </li>
              <li>
                <strong>Personnes à mobilité réduite (PMR)</strong> : <u>à signaler obligatoirement</u>
                pour organiser l’assistance et/ou un véhicule adapté, <strong>sous réserve de disponibilité</strong>.
              </li>
            </ul>
          </section>

          {/* 11. Nettoyage */}
          <section id="nettoyage" className="space-y-3 scroll-mt-28 md:scroll-mt-32">
            <h2 className="text-xl font-semibold">11. Dégradations & Nettoyage</h2>
            <p>
              Toute dégradation volontaire ou salissure exceptionnelle (ex. vomissures) entraîne la
              facturation d’un <strong>forfait nettoyage</strong> et, le cas échéant, de l’
              <strong>immobilisation</strong> du véhicule (barème communiqué sur demande).
            </p>
          </section>

          {/* 12. Imprévus */}
          <section id="imprevus" className="space-y-3 scroll-mt-28 md:scroll-mt-32">
            <h2 className="text-xl font-semibold">12. Imprévus & Force majeure</h2>
            <p>
              Les temps de trajet ne sont <strong>pas garantis</strong> (trafic, météo, travaux,
              contrôles, etc.). En cas de <strong>force majeure</strong> ou d’événement irrésistible
              et imprévisible, French Driver peut <strong>annuler</strong> ou <strong>reprogrammer</strong>{" "}
              la Prestation, sans responsabilité autre que le <strong>remboursement</strong> des
              sommes versées pour la partie non exécutée.
            </p>
          </section>

          {/* 13. Responsabilité */}
          <section id="responsabilite" className="space-y-3 scroll-mt-28 md:scroll-mt-32">
            <h2 className="text-xl font-semibold">13. Responsabilité & Assurances</h2>
            <p>
              French Driver et/ou ses Chauffeurs professionnels disposent des <strong>autorisations</strong>{" "}
              et <strong>assurances</strong> requises. La responsabilité est limitée aux{" "}
              <strong>dommages directs</strong> prouvés, à l’exclusion des préjudices indirects
              (vol manqué, rdv perdu, perte d’exploitation, etc.).
            </p>
          </section>

          {/* 14. Support */}
          <section id="support" className="space-y-3 scroll-mt-28 md:scroll-mt-32">
            <h2 className="text-xl font-semibold">14. Service client</h2>
            <p>
              Support <strong>7j/7</strong> via les canaux affichés sur la Plateforme.
              Les coordonnées (email, téléphone, liens WhatsApp/Signal/Telegram) seront
              communiquées sur la page Contact.
            </p>
          </section>

          {/* 15. PI */}
          <section id="pi" className="space-y-3 scroll-mt-28 md:scroll-mt-32">
            <h2 className="text-xl font-semibold">15. Propriété intellectuelle</h2>
            <p>
              La Plateforme, ses contenus et marques sont protégés. Toute reproduction non
              autorisée est interdite.
            </p>
          </section>

          {/* 16. Droit */}
          <section id="droit" className="space-y-3 scroll-mt-28 md:scroll-mt-32">
            <h2 className="text-xl font-semibold">16. Droit applicable – Juridiction</h2>
            <p>
              Les CGV sont soumises au <strong>droit français</strong>. Les litiges relèveront
              des tribunaux compétents du ressort indiqué sur la Plateforme, sous réserve des
              règles protectrices du consommateur.
            </p>
          </section>

          <Separator />

          {/* Version courte */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold">Version courte (pour la case à cocher)</h3>
            <blockquote className="border-l-4 pl-4 text-sm leading-relaxed">
              En cochant cette case, je reconnais avoir lu et accepté les Conditions Générales
              de Vente de French Driver, notamment la capacité des véhicules (Eco/Berline :
              3 passagers max, Van : 6 passagers max, véhicule supplémentaire au-delà), l’attente
              facturable après 20 minutes (1,50 €/min), l’inclusion des péages/parkings/surcoûts
              de nuit dans le prix confirmé, ainsi que l’obligation de signaler la présence
              d’animaux et/ou des besoins PMR lors de la réservation.
            </blockquote>
          </section>

          <div className="pt-2">
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
                window.history.replaceState(null, "", "#top");
              }}
              className="text-sm underline hover:no-underline"
            >
              ↑ Retour en haut
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Bouton flottant "haut de page" */}
      {showTop && (
        <Button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-5 right-5 h-10 w-10 rounded-full shadow-lg"
          aria-label="Revenir en haut"
          title="Haut de page"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
