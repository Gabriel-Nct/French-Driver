// src/pages/MentionsLegalesPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Building2,
  Server,
  Mail,
  Phone,
  Globe,
  Shield,
  Scale,
  Link as LinkIcon,
  Image as ImageIcon,
  ArrowUp,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// 🔧 À PERSONNALISER
const COMPANY = {
  site: "https://www.frenchdriver.fr",
  name: "FRENCH DRIVER",
  legalForm: "SAS",
  shareCapital: "5 000 €", // optionnel
  siren: "000 000 000",
  rcsCity: "Paris",
  vatNumber: "FR00 000000000", // optionnel
  address: "12 rue Exemple, 75000 Paris, France",
  email: "contact@frenchdriver.fr",
  phone: "+33 6 12 34 56 78",
  publicationDirector: {
    name: "Prénom NOM",
    title: "Directeur de la publication",
  },
  host: {
    name: "OVHcloud",
    address: "2 rue Kellermann, 59100 Roubaix, France",
    phone: "1007",
    website: "https://www.ovhcloud.com",
  },
  consumerMediator: {
    // Obligatoire en B2C : indiquer votre médiateur de la consommation
    name: "Médiateur de la consommation (ex.: Médiation Tourisme et Voyage)",
    website: "https://www.mtv.travel", // exemple ; remplacez par votre médiateur
    email: "contact@mtv.travel", // optionnel selon médiateur
  },
  odrUrl: "https://ec.europa.eu/consumers/odr",
  lastUpdate: "10 octobre 2025",
};

const SECTIONS = [
  { id: "editor", label: "1. Éditeur du site" },
  { id: "host", label: "2. Hébergeur" },
  { id: "contact", label: "3. Contact" },
  { id: "mediation", label: "4. Médiation de la consommation" },
  { id: "ip", label: "5. Propriété intellectuelle" },
  { id: "privacy", label: "6. Données personnelles" },
  { id: "cookies", label: "7. Cookies" },
  { id: "liability", label: "8. Responsabilité" },
  { id: "links", label: "9. Liens externes" },
  { id: "law", label: "10. Droit applicable" },
  { id: "credits", label: "11. Crédits" },
  { id: "changes", label: "12. Mise à jour" },
];

export default function MentionsLegalesPage() {
  // Bouton "haut de page"
  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll animé depuis le sommaire
  const handleTocClick = useCallback((e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", `#${id}`);
  }, []);

  return (
    <div className="mx-auto max-w-4xl pt-28 pb-12 md:pt-32">
      <span id="top" />

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8" aria-hidden="true" />
          <h1 className="text-3xl font-bold">Mentions légales</h1>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge className="rounded-full">Obligatoire — France / UE</Badge>
          <span className="text-sm text-muted-foreground">
            Dernière mise à jour : {COMPANY.lastUpdate}
          </span>
        </div>
      </div>

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

      {/* 1. Éditeur */}
      <Section id="editor" icon={<Building2 className="h-5 w-5" />} title="1. Éditeur du site">
        <ul className="text-sm space-y-1">
          <li>
            <strong>{COMPANY.name}</strong> ({COMPANY.legalForm}
            {COMPANY.shareCapital ? ` au capital de ${COMPANY.shareCapital}` : ""})
          </li>
          <li>Adresse : {COMPANY.address}</li>
          <li>SIREN : {COMPANY.siren} — RCS {COMPANY.rcsCity}</li>
          {COMPANY.vatNumber && <li>TVA intracommunautaire : {COMPANY.vatNumber}</li>}
          <li>
            Directeur de la publication : {COMPANY.publicationDirector.name} ({COMPANY.publicationDirector.title})
          </li>
          <li>
            Site :{" "}
            <a className="underline underline-offset-4" href={COMPANY.site} target="_blank" rel="noreferrer">
              {COMPANY.site}
            </a>
          </li>
        </ul>
      </Section>

      {/* 2. Hébergeur */}
      <Section id="host" icon={<Server className="h-5 w-5" />} title="2. Hébergeur">
        <ul className="text-sm space-y-1">
          <li>Nom : {COMPANY.host.name}</li>
          <li>Adresse : {COMPANY.host.address}</li>
          <li>Téléphone : {COMPANY.host.phone}</li>
          <li>
            Site :{" "}
            <a className="underline underline-offset-4" href={COMPANY.host.website} target="_blank" rel="noreferrer">
              {COMPANY.host.website}
            </a>
          </li>
        </ul>
      </Section>

      {/* 3. Contact */}
      <Section id="contact" icon={<Mail className="h-5 w-5" />} title="3. Contact">
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoLine icon={<Mail className="h-4 w-4" />} label="E-mail" value={COMPANY.email} href={`mailto:${COMPANY.email}`} />
          <InfoLine icon={<Phone className="h-4 w-4" />} label="Téléphone" value={COMPANY.phone} href={`tel:${COMPANY.phone}`} />
          <InfoLine icon={<Globe className="h-4 w-4" />} label="Site" value={COMPANY.site} href={COMPANY.site} />
        </div>
      </Section>

      {/* 4. Médiation de la consommation */}
      <Section id="mediation" icon={<Scale className="h-5 w-5" />} title="4. Médiation de la consommation">
        <p className="text-sm">
          Conformément aux articles L.616-1 et R.616-1 du code de la consommation, {COMPANY.name} propose un dispositif de
          médiation. L’entité de médiation retenue est : <strong>{COMPANY.consumerMediator.name}</strong>. Vous pouvez la
          contacter via son site :{" "}
          <a className="underline underline-offset-4" href={COMPANY.consumerMediator.website} target="_blank" rel="noreferrer">
            {COMPANY.consumerMediator.website}
          </a>
          {COMPANY.consumerMediator.email ? (
            <>
              {" "}
              ou par e-mail :{" "}
              <a className="underline underline-offset-4" href={`mailto:${COMPANY.consumerMediator.email}`}>
                {COMPANY.consumerMediator.email}
              </a>.
            </>
          ) : (
            "."
          )}
        </p>
        <p className="mt-2 text-sm">
          Plateforme européenne de règlement en ligne des litiges (RLL/ODR) :{" "}
          <a className="underline underline-offset-4" href={COMPANY.odrUrl} target="_blank" rel="noreferrer">
            {COMPANY.odrUrl}
          </a>
          .
        </p>
      </Section>

      {/* 5. Propriété intellectuelle */}
      <Section id="ip" icon={<Shield className="h-5 w-5" />} title="5. Propriété intellectuelle">
        <p className="text-sm">
          L’ensemble des contenus (textes, images, marques, logos, vidéos, icônes, code) présents sur le site sont protégés
          par le droit de la propriété intellectuelle. Toute reproduction, représentation, modification, publication,
          adaptation de tout ou partie des éléments du site est interdite sans l’autorisation écrite préalable de {COMPANY.name}.
        </p>
      </Section>

      {/* 6. Données personnelles */}
      <Section id="privacy" icon={<Shield className="h-5 w-5" />} title="6. Données personnelles">
        <p className="text-sm">
          Pour connaître nos engagements en matière de protection des données (finalités, bases légales, durées, droits RGPD,
          sous-traitants), veuillez consulter notre{" "}
          <a className="underline underline-offset-4" href="/rgpd">
            Politique de confidentialité (RGPD)
          </a>
          .
        </p>
      </Section>

      {/* 7. Cookies */}
      <Section id="cookies" icon={<LinkIcon className="h-5 w-5" />} title="7. Cookies">
        <p className="text-sm">
          Le dépôt de cookies non nécessaires (mesure d’audience non exemptée, marketing, etc.) est soumis à votre consentement.
          Vous pouvez à tout moment{" "}
          <a className="underline underline-offset-4" href="/cookies">
            consulter notre politique Cookies
          </a>{" "}
          et{" "}
          <a className="underline underline-offset-4" href="/cookies#preferences">
            paramétrer vos préférences
          </a>
          .
        </p>
      </Section>

      {/* 8. Responsabilité */}
      <Section id="liability" icon={<FileText className="h-5 w-5" />} title="8. Responsabilité">
        <p className="text-sm">
          {COMPANY.name} met tout en œuvre pour assurer l’exactitude et la mise à jour des informations. Toutefois, des erreurs
          ou omissions peuvent survenir ; l’utilisateur est invité à vérifier l’information. {COMPANY.name} ne saurait être
          tenue responsable des dommages directs ou indirects résultant de l’accès au site ou de l’utilisation des informations.
        </p>
      </Section>

      {/* 9. Liens externes */}
      <Section id="links" icon={<LinkIcon className="h-5 w-5" />} title="9. Liens externes">
        <p className="text-sm">
          Le site peut contenir des liens vers d’autres sites. {COMPANY.name} n’exerce aucun contrôle sur ces sites et décline
          toute responsabilité quant à leurs contenus et politiques.
        </p>
      </Section>

      {/* 10. Droit applicable */}
      <Section id="law" icon={<Scale className="h-5 w-5" />} title="10. Droit applicable">
        <p className="text-sm">
          Le présent site est régi par le droit français. En cas de litige, et à défaut d’accord amiable, les tribunaux
          compétents du ressort de {COMPANY.rcsCity} seront seuls compétents, sous réserve des dispositions d’ordre public applicables.
        </p>
      </Section>

      {/* 11. Crédits */}
      <Section id="credits" icon={<ImageIcon className="h-5 w-5" />} title="11. Crédits">
        <p className="text-sm">
          Crédits photos/illustrations : préciser les auteurs/banques d’images le cas échéant. Icônes :{" "}
          <a className="underline underline-offset-4" href="https://lucide.dev" target="_blank" rel="noreferrer">
            lucide-react
          </a>
          .
        </p>
      </Section>

      {/* 12. Mise à jour */}
      <Section id="changes" title="12. Mise à jour">
        <p className="text-sm">
          {COMPANY.name} se réserve le droit de modifier les présentes mentions à tout moment. La date de mise à jour sera adaptée.
        </p>
        <div className="mt-3">
          <Button asChild variant="outline">
            <a href={`mailto:${COMPANY.email}`}>Nous contacter</a>
          </Button>
        </div>
      </Section>

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

/* ---------- Petits composants ---------- */
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
