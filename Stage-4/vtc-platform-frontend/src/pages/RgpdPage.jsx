// src/pages/RgpdPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Shield, Lock, FileCheck2, Mail, Phone, Globe, ArrowUp } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

// 🔧 À personnaliser
const COMPANY = {
  name: "FRENCH DRIVER",
  legalForm: "SAS",
  siren: "000 000 000",
  address: "12 rue Exemple, 75000 Paris, France",
  email: "contact@frenchdriver.fr",
  phone: "+33 6 12 34 56 78",
  dpoName: "Délégué à la Protection des Données",
  dpoEmail: "dpo@frenchdriver.fr",
  site: "https://www.frenchdriver.fr",
  lastUpdate: "10 octobre 2025",
};

const SECTIONS = [
  { id: "intro", label: "1. Qui sommes-nous ?" },
  { id: "scope", label: "2. Données que nous collectons" },
  { id: "purposes", label: "3. Finalités & bases légales" },
  { id: "retention", label: "4. Durées de conservation" },
  { id: "recipients", label: "5. Destinataires & sous-traitants" },
  { id: "transfers", label: "6. Transferts hors UE/EEE" },
  { id: "rights", label: "7. Vos droits RGPD" },
  { id: "security", label: "8. Sécurité des données" },
  { id: "cookies", label: "9. Cookies & traceurs" },
  { id: "contact", label: "10. Contact & réclamations" },
  { id: "changes", label: "11. Mises à jour" },
];

export default function RgpdPage() {
  // --- Bouton "haut de page" ---
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
    // scroll-margin-top appliqué via scroll-mt sur <Section>
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    // Met à jour l’URL sans “saut”
    window.history.replaceState(null, "", `#${id}`);
  }, []);

  return (
    <div className="mx-auto max-w-4xl pt-28 pb-12 md:pt-32">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8" aria-hidden="true" />
          <h1 className="text-3xl font-bold">RGPD — Politique de protection des données</h1>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge className="rounded-full">Conformité & Transparence</Badge>
          <span className="text-sm text-muted-foreground">Dernière mise à jour : {COMPANY.lastUpdate}</span>
        </div>
      </div>

      {/* Alerte non-juridique */}
      <Alert className="mb-6">
        <AlertTitle>Information importante</AlertTitle>
        <AlertDescription>
          Cette page présente nos engagements en matière de protection des données. Elle ne constitue pas un avis juridique.
          Pour des questions spécifiques, contactez notre DPO.
        </AlertDescription>
      </Alert>

      {/* Sommaire */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Sommaire</CardTitle>
        </CardHeader>
        <CardContent>
          <nav className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={(e) => handleTocClick(e, s.id)}
                className="text-sm underline underline-offset-4 hover:no-underline"
              >
                {s.label}
              </a>
            ))}
          </nav>
        </CardContent>
      </Card>

      {/* 1. Qui sommes-nous */}
      <Section id="intro" icon={<FileCheck2 className="h-5 w-5" />} title="1. Qui sommes-nous ?">
        <p>
          {COMPANY.name} ({COMPANY.legalForm}, SIREN {COMPANY.siren}), dont le siège est situé {COMPANY.address}, est
          responsable du traitement des données personnelles collectées via notre site et nos services VTC ({COMPANY.site}).
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <InfoLine icon={<Globe className="h-4 w-4" />} label="Site" value={COMPANY.site} href={COMPANY.site} />
          <InfoLine icon={<Mail className="h-4 w-4" />} label="E-mail" value={COMPANY.email} href={`mailto:${COMPANY.email}`} />
          <InfoLine icon={<Phone className="h-4 w-4" />} label="Téléphone" value={COMPANY.phone} href={`tel:${COMPANY.phone}`} />
        </div>
      </Section>

      {/* 2. Données collectées */}
      <Section id="scope" icon={<Lock className="h-5 w-5" />} title="2. Données que nous collectons">
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Identité & contact :</strong> nom, prénom, e-mail, téléphone.</li>
          <li><strong>Réservation & trajet :</strong> adresses de départ/arrivée, date/heure, préférences (véhicule, bagages, etc.).</li>
          <li><strong>Facturation & paiement :</strong> informations nécessaires à la facturation (les paiements peuvent être traités par un prestataire tiers).</li>
          <li><strong>Support & relation client :</strong> contenu des échanges (e-mail, WhatsApp/Telegram/Signal si vous nous contactez via ces canaux).</li>
          <li><strong>Données techniques :</strong> logs, identifiants de session, navigateur, adresse IP, dans le cadre de la sécurité et des statistiques anonymisées.</li>
        </ul>
        <p className="mt-3 text-sm text-muted-foreground">
          Nous collectons uniquement les données nécessaires, de manière loyale et transparente.
        </p>
      </Section>

      {/* 3. Finalités & bases légales */}
      <Section id="purposes" title="3. Finalités & bases légales">
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-2 text-sm">
            <thead>
              <tr className="text-left">
                <th className="px-3 py-2">Finalité</th>
                <th className="px-3 py-2">Exemples</th>
                <th className="px-3 py-2">Base légale</th>
              </tr>
            </thead>
            <tbody>
              {[
                { purpose: "Gestion des réservations et exécution du trajet", examples: "Création de la commande, confirmations, notifications chauffeur", legal: "Exécution du contrat (art. 6(1)(b) RGPD)" },
                { purpose: "Facturation et obligations comptables", examples: "Émission de factures, conservation légale", legal: "Obligation légale (art. 6(1)(c) RGPD)" },
                { purpose: "Service client et support", examples: "Réponse aux demandes (e-mail, téléphone, messageries)", legal: "Intérêt légitime (art. 6(1)(f) RGPD)" },
                { purpose: "Prospection (newsletter, offres…)", examples: "Envoi d’informations commerciales, si consentement", legal: "Consentement (art. 6(1)(a) RGPD) — révocable à tout moment" },
                { purpose: "Sécurité, prévention de la fraude, logs", examples: "Sécurisation du service, diagnostics", legal: "Intérêt légitime (art. 6(1)(f) RGPD)" },
                { purpose: "Statistiques d’usage", examples: "Mesure d’audience agrégée/anonymisée", legal: "Intérêt légitime ou consentement selon le traceur" },
              ].map((row, i) => (
                <tr key={i} className="bg-muted/30">
                  <td className="px-3 py-2 align-top">{row.purpose}</td>
                  <td className="px-3 py-2 align-top">{row.examples}</td>
                  <td className="px-3 py-2 align-top">{row.legal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* 4. Durées de conservation */}
      <Section id="retention" title="4. Durées de conservation">
        <ul className="list-disc pl-6 space-y-2 text-sm">
          <li><strong>Compte & réservations :</strong> durée de la relation contractuelle + <em>jusqu’à 5 ans</em> en archivage (prescriptions civiles/commerciales).</li>
          <li><strong>Facturation :</strong> <em>10 ans</em> (obligation comptable en France).</li>
          <li><strong>Prospection :</strong> <em>3 ans</em> après le dernier contact ou jusqu’au retrait du consentement.</li>
          <li><strong>Logs techniques :</strong> généralement <em>6 à 12 mois</em> (sécurité/diagnostic), selon nécessité.</li>
        </ul>
        <p className="mt-2 text-sm text-muted-foreground">Au-delà, nous supprimons ou anonymisons les données.</p>
      </Section>

      {/* 5. Destinataires */}
      <Section id="recipients" title="5. Destinataires & sous-traitants">
        <p>Nous partageons des données uniquement quand c’est nécessaire, par exemple avec :</p>
        <ul className="list-disc pl-6 space-y-2 mt-2">
          <li><strong>Chauffeurs partenaires</strong> (exécution du trajet).</li>
          <li><strong>Prestataires techniques</strong> (hébergement, e-mail, anti-robot, messagerie, cartographie, paiement, etc.).</li>
          <li><strong>Autorités</strong> si la loi l’exige.</li>
        </ul>
        <p className="mt-2 text-sm text-muted-foreground">Des contrats conformes à l’article 28 RGPD encadrent nos sous-traitants.</p>
      </Section>

      {/* 6. Transferts hors UE/EEE */}
      <Section id="transfers" title="6. Transferts hors UE/EEE">
        <p>
          Si certains prestataires traitent des données hors UE/EEE, nous nous assurons qu’un cadre adéquat est en place
          (décision d’adéquation, <em>Standard Contractual Clauses</em>, mesures additionnelles).
        </p>
      </Section>

      {/* 7. Droits RGPD (accordéon) */}
      <Section id="rights" title="7. Vos droits RGPD">
        <Accordion type="single" collapsible className="w-full">
          {[
            { t: "Droit d’accès", d: "Obtenir une copie des données vous concernant et des informations sur leur traitement." },
            { t: "Droit de rectification", d: "Corriger des données inexactes ou incomplètes." },
            { t: "Droit à l’effacement", d: "Demander la suppression de vos données, sous conditions (art. 17 RGPD)." },
            { t: "Droit d’opposition", d: "Vous opposer à certains traitements fondés sur l’intérêt légitime ou à la prospection." },
            { t: "Droit à la limitation", d: "Limiter temporairement un traitement (ex. contestation)." },
            { t: "Droit à la portabilité", d: "Recevoir vos données dans un format structuré et lisible par machine." },
            { t: "Retrait du consentement", d: "À tout moment pour les traitements fondés sur le consentement." },
          ].map((item, i) => (
            <AccordionItem key={i} value={`right-${i}`}>
              <AccordionTrigger>{item.t}</AccordionTrigger>
              <AccordionContent>{item.d}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <div className="mt-4">
          <Button asChild variant="secondary">
            <a href={`mailto:${COMPANY.dpoEmail}`}>Exercer un droit RGPD via e-mail (DPO)</a>
          </Button>
        </div>
      </Section>

      {/* 8. Sécurité */}
      <Section id="security" title="8. Sécurité des données">
        <p>
          Nous mettons en œuvre des mesures techniques et organisationnelles adaptées (contrôles d’accès, chiffrement en transit,
          sauvegardes, journalisation, pare-feu, tests réguliers). En cas de violation présentant un risque élevé, nous informerons
          les personnes et, le cas échéant, la CNIL sous 72h.
        </p>
      </Section>

      {/* 9. Cookies */}
      <Section id="cookies" title="9. Cookies & traceurs">
        <p>
          Les cookies nécessaires au service sont déposés sans consentement. Les cookies de mesure d’audience/marketing nécessitent votre
          consentement préalable. Vous pouvez gérer vos préférences à tout moment via le bandeau ou la page dédiée.
        </p>
        <p className="mt-2 text-sm">
          Voir aussi notre <a className="underline underline-offset-4" href="/cookies">Politique Cookies</a>.
        </p>
      </Section>

      {/* 10. Contact & réclamations */}
      <Section id="contact" title="10. Contact & réclamations">
        <div className="grid gap-3 sm:grid-cols-2">
          <ContactCard
            title="Contacter le DPO"
            lines={[`${COMPANY.dpoName}`, COMPANY.dpoEmail]}
            href={`mailto:${COMPANY.dpoEmail}`}
            icon={<Mail className="h-4 w-4" />}
            cta="Écrire au DPO"
          />
          <ContactCard
            title="Service client"
            lines={[COMPANY.email, COMPANY.phone]}
            href={`mailto:${COMPANY.email}`}
            icon={<Phone className="h-4 w-4" />}
            cta="Nous contacter"
          />
        </div>
        <p className="mt-4 text-sm">
          Vous pouvez également introduire une réclamation auprès de la{" "}
          <a className="underline underline-offset-4" href="https://www.cnil.fr" target="_blank" rel="noreferrer">CNIL</a>.
        </p>
      </Section>

      {/* 11. Mises à jour */}
      <Section id="changes" title="11. Mises à jour de cette politique">
        <p>
          Nous pouvons modifier cette politique pour refléter des évolutions légales ou opérationnelles. La date de mise à jour sera ajustée
          et, si nécessaire, nous vous informerons par un canal approprié.
        </p>
      </Section>

      {/* --- Bouton haut de page (flottant) --- */}
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

/* ---------- Petits composants réutilisables ---------- */
function Section({ id, icon, title, children }) {
  return (
    <Card id={id} className="mb-6 scroll-mt-28 md:scroll-mt-32">
      <CardHeader className="flex flex-row items-center gap-2">
        {icon ? icon : null}
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm leading-6">{children}</CardContent>
    </Card>
  );
}

function InfoLine({ icon, label, value, href }) {
  const Inner = () => (
    <div className="flex items-center gap-2 text-sm">
      {icon}
      <span className="font-medium">{label} :</span>
      <span className="truncate">{value}</span>
    </div>
  );
  return href ? (
    <a className="hover:opacity-80" href={href} target="_blank" rel="noreferrer">
      <Inner />
    </a>
  ) : (
    <Inner />
  );
}

function ContactCard({ title, lines = [], href, icon, cta }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <ul className="text-sm">
          {lines.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
        {href && (
          <Button asChild className="mt-2">
            <a href={href}>
              {icon} <span className="ml-2">{cta}</span>
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
