// src/pages/ContactPage.jsx
import React, { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Phone, Mail, Clock, ArrowRight, Check } from "lucide-react";

/**
 * ContactPage.jsx — logos images pour WhatsApp, Signal et Telegram
 * - InfoRow accepte maintenant un 'imgSrc' (affiche une image au lieu d'une icône)
 */

const CONTACT_ENDPOINT = "/api/contact/";
const CONTACT_TO = "bookfrenchdriver@gmail.com";

// ⚙️ Configure ici tes identifiants messageries
const PHONE_DISPLAY = "+33 X XX XX XX XX"; // affichage
const PHONE_E164 = "+33XXXXXXXXX";         // format international (ex: +33612345678)
const TELEGRAM_USERNAME = "FrenchDriver";  // handle sans @

// 🖼️ Logos fournis
const IMG_WHATSAPP = "https://i.ibb.co/CsWzCjTP/whatsapp.png";
const IMG_SIGNAL   = "https://i.ibb.co/HLCzq3w8/signal.png";
const IMG_TELEGRAM = "https://i.ibb.co/vxVRT5Fd/telegramme.png";

export default function ContactPage() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    subject: "",
    reason: "Demande de devis",
    message: "",
    company: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // 🔗 Liens dynamiques (pré-remplis avec le contenu du formulaire si présent)
  const links = useMemo(() => {
    const summary = [
      form.reason ? `Raison: ${form.reason}` : null,
      form.subject ? `Sujet: ${form.subject}` : null,
      form.message ? `Message: ${form.message}` : null,
      form.fullName ? `Nom: ${form.fullName}` : null,
      form.phone ? `Téléphone: ${form.phone}` : null,
      form.email ? `Email: ${form.email}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const textParam = summary ? `?text=${encodeURIComponent(summary)}` : "";
    const waNumber = PHONE_E164.replace(/\+/g, ""); // wa.me attend le numéro sans '+'

    return {
      tel: `tel:${PHONE_E164}`,
      email: `mailto:${CONTACT_TO}`,
      whatsapp: `https://wa.me/${waNumber}${textParam}`,
      signal: `https://signal.me/#p/${encodeURIComponent(PHONE_E164)}`,
      telegram: `https://t.me/${encodeURIComponent(TELEGRAM_USERNAME)}`,
    };
  }, [form]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (form.company) return { ok: false, msg: "Spam détecté." };
    if (!form.fullName.trim()) return { ok: false, msg: "Veuillez indiquer votre nom." };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return { ok: false, msg: "Adresse e-mail invalide." };
    if (!/^[- +()0-9]{6,}$/.test(form.phone)) return { ok: false, msg: "Numéro de téléphone invalide." };
    if (!form.subject.trim()) return { ok: false, msg: "Veuillez indiquer un sujet." };
    if (!form.message.trim() || form.message.trim().length < 10)
      return { ok: false, msg: "Votre message est trop court." };
    return { ok: true, msg: "" };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const { ok, msg } = validate();
    if (!ok) {
      setError(msg);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(CONTACT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: CONTACT_TO,
          full_name: form.fullName,
          email: form.email,
          phone: form.phone,
          subject: form.subject,
          reason: form.reason,
          message: form.message,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || "Une erreur est survenue. Bascule sur e-mail direct.");
      }

      setSuccess("Merci ! Votre message a bien été envoyé. Nous revenons vers vous rapidement.");
      setForm({
        fullName: "",
        email: "",
        phone: "",
        subject: "",
        reason: "Demande de devis",
        message: "",
        company: "",
      });
    } catch (err) {
      const subject = encodeURIComponent(`[Contact] ${form.subject || "Nouvelle demande"}`);
      const body = encodeURIComponent(
        `Nom: ${form.fullName}\nEmail: ${form.email}\nTéléphone: ${form.phone}\nRaison: ${form.reason}\n\nMessage:\n${form.message}`
      );
      window.location.href = `mailto:${CONTACT_TO}?subject=${subject}&body=${body}`;
      setSuccess("Ouverture de votre client mail… Vous pouvez nous écrire directement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/40">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 pt-16 pb-10 sm:pt-24">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Nous contacter</h1>
              <p className="mt-3 text-muted-foreground max-w-prose">
                Une question, un devis ou une réservation spéciale ? Notre équipe vous répond{" "}
                <span className="font-medium text-foreground">7j/7</span>.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border bg-background px-3 py-2 text-sm shadow-sm">
              <Clock className="h-4 w-4" />
              <span>Réponse rapide</span>
            </div>
          </div>
        </div>
      </section>

      {/* Grille principale */}
      <section className="mx-auto max-w-6xl px-4 pb-24 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Colonne infos */}
        <div className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Coordonnées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow
                icon={Phone}
                label="Téléphone"
                value={<a href={links.tel} className="hover:underline">{PHONE_DISPLAY}</a>}
              />
              <InfoRow
                icon={Mail}
                label="Email"
                value={<a href={links.email} className="hover:underline">{CONTACT_TO}</a>}
              />
              <InfoRow
                imgSrc={IMG_WHATSAPP}
                imgAlt="WhatsApp"
                label="WhatsApp"
                value={
                  <a href={links.whatsapp} className="hover:underline" target="_blank" rel="noreferrer">
                    Ouvrir la conversation
                  </a>
                }
              />
              <InfoRow
                imgSrc={IMG_SIGNAL}
                imgAlt="Signal"
                label="Signal"
                value={
                  <a href={links.signal} className="hover:underline" target="_blank" rel="noreferrer">
                    Ouvrir la conversation
                  </a>
                }
              />
              <InfoRow
                imgSrc={IMG_TELEGRAM}
                imgAlt="Telegram"
                label="Telegram"
                value={
                  <a href={links.telegram} className="hover:underline" target="_blank" rel="noreferrer">
                    @{TELEGRAM_USERNAME}
                  </a>
                }
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Horaires</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>
                  <span className="text-foreground font-medium">Disponibilité :</span> 7j/7
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Colonne formulaire (span 2) */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Écrivez-nous</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                {/* Honeypot caché */}
                <input
                  type="text"
                  name="company"
                  value={form.company}
                  onChange={onChange}
                  className="hidden"
                  tabIndex={-1}
                  autoComplete="off"
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Nom complet" htmlFor="fullName">
                    <Input
                      id="fullName"
                      name="fullName"
                      placeholder="Prénom Nom"
                      value={form.fullName}
                      onChange={onChange}
                      required
                    />
                  </Field>

                  <Field label="Email" htmlFor="email">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="vous@exemple.fr"
                      value={form.email}
                      onChange={onChange}
                      required
                    />
                  </Field>

                  <Field label="Téléphone" htmlFor="phone">
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="06 12 34 56 78"
                      value={form.phone}
                      onChange={onChange}
                      required
                    />
                  </Field>

                  <Field label="Sujet" htmlFor="subject">
                    <Input
                      id="subject"
                      name="subject"
                      placeholder="Sujet de votre message"
                      value={form.subject}
                      onChange={onChange}
                      required
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Raison du contact" htmlFor="reason">
                    <select
                      id="reason"
                      name="reason"
                      value={form.reason}
                      onChange={onChange}
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option>Demande de devis</option>
                      <option>Réservation</option>
                      <option>Partenariat</option>
                      <option>Support</option>
                      <option>Autre</option>
                    </select>
                  </Field>
                </div>

                <Field label="Message" htmlFor="message">
                  <textarea
                    id="message"
                    name="message"
                    placeholder="Bonjour, je souhaiterais..."
                    rows={6}
                    value={form.message}
                    onChange={onChange}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                </Field>

                {error && (
                  <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-destructive text-sm">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="flex items-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/5 p-3 text-emerald-700 text-sm">
                    <Check className="h-4 w-4" /> {success}
                  </div>
                )}

                <div className="flex justify-end">
                  <Button type="submit" disabled={loading} className="gap-2">
                    {loading ? "Envoi..." : "Envoyer"}
                    {!loading && <ArrowRight className="h-4 w-4" />}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function Field({ label, htmlFor, children }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </Label>
      {children}
    </div>
  );
}

// ✅ Accepte soit 'icon' (composant) soit 'imgSrc' (URL d'image)
function InfoRow({ icon: Icon, imgSrc, imgAlt, label, value }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <div className="mt-0.5 rounded-lg border bg-background p-2 shadow-sm">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={imgAlt || label}
            className="h-5 w-5 object-contain"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <Icon className="h-4 w-4" />
        )}
      </div>
      <div>
        <div className="text-foreground font-medium">{label}</div>
        <div className="text-muted-foreground">{value}</div>
      </div>
    </div>
  );
}
