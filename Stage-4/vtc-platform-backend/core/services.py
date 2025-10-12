# core/services.py
import logging
from decimal import Decimal
from typing import Optional, Tuple

import requests
from django.conf import settings
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.db import transaction, IntegrityError
from django.utils import timezone
from django.utils.formats import date_format  # <-- pour format FR "j F Y à H:i"
from django.utils.html import strip_tags       # <-- fallback texte depuis HTML

from .models import Booking, Driver, Invoice

logger = logging.getLogger(__name__)


# ---------------------------------------------------------
# Helper : date/heure en français (mois en toutes lettres)
# ---------------------------------------------------------
def format_dt_fr(dt, with_time: bool = True) -> str:
    """
    Retourne une date/heure localisée FR :
      - with_time=True  -> "2 octobre 2025 à 14:30"
      - with_time=False -> "2 octobre 2025"
    """
    if not dt:
        return ""
    try:
        dt = timezone.localtime(dt)  # respecte USE_TZ/TIME_ZONE
    except Exception:
        pass
    if with_time:
        # Django format string (pas strftime) : j=jour, F=mois en lettres, Y=année, H:i=heure:minutes
        return date_format(dt, "j F Y à H:i", use_l10n=True)
    return date_format(dt, "j F Y", use_l10n=True)


# =========================================================
# ROUTING (distance par la route + durée, avec ou sans trafic)
# =========================================================
class RoutingService:
    """
    Calcule distance & durée via un provider de routage.

    Providers supportés :
      - OSRM    (gratuit, pas de trafic)
      - MAPBOX  (driving-traffic, durée avec trafic)
      - HERE    (durée avec trafic)
      - TOMTOM  (durée avec trafic)

    Retour standard:
    {
      "distance_km": float,  # en kilomètres (par la route)
      "duration_min": int,   # en minutes
      "has_traffic": bool,   # True si la durée prend en compte le trafic
      "provider": "OSRM" | "MAPBOX" | "HERE" | "TOMTOM"
    }
    """

    @staticmethod
    def _route_osrm(lat1, lon1, lat2, lon2):
        base = getattr(settings, "OSRM_BASE_URL", "https://router.project-osrm.org").rstrip("/")
        url = f"{base}/route/v1/driving/{lon1},{lat1};{lon2},{lat2}"
        params = {"overview": "false", "alternatives": "false"}
        r = requests.get(url, params=params, timeout=8)
        r.raise_for_status()
        data = r.json()
        route = (data.get("routes") or [{}])[0]
        dist_m = float(route.get("distance", 0.0))
        dur_s = float(route.get("duration", 0.0))
        return {
            "distance_km": round(dist_m / 1000.0, 3),
            "duration_min": int(round(dur_s / 60.0)),
            "has_traffic": False,
            "provider": "OSRM",
        }

    @staticmethod
    def _route_mapbox(lat1, lon1, lat2, lon2):
        token = getattr(settings, "MAPBOX_ACCESS_TOKEN", "")
        if not token:
            raise RuntimeError("MAPBOX_ACCESS_TOKEN manquant")
        # profil "driving-traffic" -> prend en compte le trafic
        url = f"https://api.mapbox.com/directions/v5/mapbox/driving-traffic/{lon1},{lat1};{lon2},{lat2}"
        params = {
            "alternatives": "false",
            "overview": "false",
            "geometries": "polyline6",
            "annotations": "distance,duration",
            "access_token": token,
            "language": "fr",
        }
        r = requests.get(url, params=params, timeout=8)
        r.raise_for_status()
        data = r.json()
        route = (data.get("routes") or [{}])[0]
        dist_m = float(route.get("distance", 0.0))
        dur_s = float(route.get("duration", 0.0))
        return {
            "distance_km": round(dist_m / 1000.0, 3),
            "duration_min": int(round(dur_s / 60.0)),
            "has_traffic": True,
            "provider": "MAPBOX",
        }

    @staticmethod
    def _route_here(lat1, lon1, lat2, lon2):
        api_key = getattr(settings, "HERE_API_KEY", "")
        if not api_key:
            raise RuntimeError("HERE_API_KEY manquant")

        dt_iso = timezone.now().strftime("%Y-%m-%dT%H:%M:%SZ")  # trafic temps réel (UTC)

        url = "https://router.hereapi.com/v8/routes"
        params = {
            "transportMode": "car",
            "origin": f"{lat1},{lon1}",
            "destination": f"{lat2},{lon2}",
            "routingMode": "fast",
            "return": "summary",
            "lang": "fr-FR",
            "departureTime": dt_iso,
            "apikey": api_key,   # <- minuscule
        }
        r = requests.get(url, params=params, timeout=8)
        r.raise_for_status()
        data = r.json()

        routes = data.get("routes") or []
        if not routes:
            return {"distance_km": 0.0, "duration_min": 0, "has_traffic": True, "provider": "HERE"}

        best = routes[0]
        total_len_m = sum(float((sec.get("summary") or {}).get("length", 0.0)) for sec in best.get("sections", []))
        total_dur_s = sum(float((sec.get("summary") or {}).get("duration", 0.0)) for sec in best.get("sections", []))

        return {
            "distance_km": round(total_len_m / 1000.0, 3),
            "duration_min": int(round(total_dur_s / 60.0)),
            "has_traffic": True,
            "provider": "HERE",
        }

    @staticmethod
    def _route_tomtom(lat1, lon1, lat2, lon2):
        api_key = getattr(settings, "TOMTOM_API_KEY", "")
        if not api_key:
            raise RuntimeError("TOMTOM_API_KEY manquant")
        url = f"https://api.tomtom.com/routing/1/calculateRoute/{lat1},{lon1}:{lat2},{lon2}/json"
        params = {
            "traffic": "true",
            "computeTravelTimeFor": "all",
            "key": api_key,
        }
        r = requests.get(url, params=params, timeout=8)
        r.raise_for_status()
        data = r.json()
        summary = ((data.get("routes") or [{}])[0].get("summary") or {})
        dist_m = float(summary.get("lengthInMeters", 0.0))
        dur_s = float(summary.get("travelTimeInSeconds", 0.0))
        return {
            "distance_km": round(dist_m / 1000.0, 3),
            "duration_min": int(round(dur_s / 60.0)),
            "has_traffic": True,
            "provider": "TOMTOM",
        }

    @classmethod
    def route(cls, lat1, lon1, lat2, lon2):
        provider = getattr(settings, "ROUTING_PROVIDER", "OSRM").upper()

        # (Optionnel) petit cache (si config Django cache activée)
        cache = None
        try:
            from django.core.cache import cache as dj_cache
            cache = dj_cache
            cache_key = f"route:{provider}:{round(lat1,5)},{round(lon1,5)}->{round(lat2,5)},{round(lon2,5)}"
            cached = cache.get(cache_key)
            if cached:
                return cached
        except Exception:
            pass

        try:
            if provider == "MAPBOX":
                res = cls._route_mapbox(lat1, lon1, lat2, lon2)
            elif provider == "HERE":
                res = cls._route_here(lat1, lon1, lat2, lon2)
            elif provider == "TOMTOM":
                res = cls._route_tomtom(lat1, lon1, lat2, lon2)
            else:
                res = cls._route_osrm(lat1, lon1, lat2, lon2)
        except Exception as e:
            logger.error(f"[RoutingService] provider={provider} erreur: {e}. Fallback OSRM.")
            res = cls._route_osrm(lat1, lon1, lat2, lon2)

        if cache:
            try:
                cache.set(cache_key, res, timeout=300)  # 5 minutes
            except Exception:
                pass

        return res


# =========================================================
# PRICING / TARIFICATION
# =========================================================
class PricingService:
    """
    Service de calcul de prix basé sur la distance PAR LA ROUTE.
    - eco/berline/van : total = max(minimum, per_km * distance)
      (pas de composante "par minute")
    - goldwing : ancien modèle base + km + minute (inchangé)
    """

    VEHICLE_TARIFFS = {
        "eco":      {"per_km": Decimal("2.50"), "minimum": Decimal("35.00")},
        "berline":  {"per_km": Decimal("3.20"), "minimum": Decimal("50.00")},
        "van":      {"per_km": Decimal("4.00"), "minimum": Decimal("70.00")},
        # Ancien modèle conservé
        "goldwing": {"per_km": Decimal("4.50"), "minimum": Decimal("70.00")},
    }

    @classmethod
    def calculate_price(
        cls,
        pickup_lat: float,
        pickup_lon: float,
        dest_lat: float,
        dest_lon: float,
        vehicle_type: str = "eco",
        passengers: int = 1,
        luggage_count: int = 0,
        scheduled_time=None,
    ) -> dict:
        """
        Estime le prix selon le type de véhicule à partir du routing provider.
        """
        tariffs = cls.VEHICLE_TARIFFS.get(vehicle_type, cls.VEHICLE_TARIFFS["eco"])

        # 1) Distance & durée via RoutingService (par la route, potentiellement avec trafic)
        route = RoutingService.route(pickup_lat, pickup_lon, dest_lat, dest_lon)
        distance_km = float(route["distance_km"])
        duration_min = int(route["duration_min"])
        provider = route.get("provider", "OSRM")
        has_traffic = bool(route.get("has_traffic", False))

        # 2) Calcul selon le modèle
        if "minimum" in tariffs:
            # Nouveau modèle (eco/berline/van)
            per_km = tariffs["per_km"]
            minimum = tariffs["minimum"]

            distance_price = Decimal(str(distance_km)) * per_km
            time_price = Decimal("0.00")   # pas de composante minute
            base_price = Decimal("0.00")   # pas de base
            subtotal = distance_price
            total_price = max(subtotal, minimum)

            return {
                "distance_km": round(distance_km, 2),
                "estimated_duration_minutes": duration_min,
                "routing_provider": provider,
                "has_traffic": has_traffic,
                "base_price": float(base_price),
                "minimum_price": float(minimum),
                "distance_price": float(distance_price),
                "time_price": float(time_price),
                "estimated_price": float(Decimal(total_price).quantize(Decimal("0.01"))),
            }

        # Ancien modèle (goldwing)
        base_price = tariffs.get("base", Decimal("0.00"))
        per_km = tariffs["per_km"]
        per_min = tariffs.get("per_min", Decimal("0.00"))

        distance_price = Decimal(str(distance_km)) * per_km
        time_price = Decimal(str(duration_min)) * per_min
        total_price = base_price + distance_price + time_price

        return {
            "distance_km": round(distance_km, 2),
            "estimated_duration_minutes": duration_min,
            "routing_provider": provider,
            "has_traffic": has_traffic,
            "base_price": float(base_price),
            "distance_price": float(distance_price),
            "time_price": float(time_price),
            "estimated_price": float(Decimal(total_price).quantize(Decimal("0.01"))),
        }


# =========================================================
# NOTIFICATIONS (Emails / Telegram)
# =========================================================
class NotificationService:
    """
    Service d’envoi des notifications (emails / Telegram).
    """

    # ------------------------------
    # Helpers
    # ------------------------------
    @staticmethod
    def _get_customer_identity(booking: Booking) -> Tuple[str, Optional[str]]:
        """
        Retourne (name, email) pour le client (connecté ou invité).
        """
        if getattr(booking, "user_id", None):
            name = (booking.user.get_full_name() or booking.user.username or "Client")
            email = booking.user.email
        else:
            # Réservation invité
            name = getattr(booking, "guest_name", None) or "Client"
            email = getattr(booking, "guest_email", None)
        return name, email

    # ------------------------------
    # Emails client (HTML stylé)
    # ------------------------------
    @staticmethod
    def send_booking_confirmation(booking: Booking) -> bool:
        """
        Envoie l’e-mail de confirmation au client avec le *même style* que la page.
        Utilise le template HTML: templates/emails/booking_confirmation.html
        """
        try:
            to_name, to_email = NotificationService._get_customer_identity(booking)
            if not to_email:
                logger.info(f"[booking:{booking.id}] Pas d’email client → on saute l’envoi confirmation.")
                return True  # ne bloque pas le flux

            # Contexte pour le template
            context = {
                "client_name": to_name,
                "booking_code": getattr(booking, "confirmation_number", None)
                                 or f"VTC{int(getattr(booking, 'id', 0)):06d}",
                "pickup_address": getattr(booking, "pickup_address", "") or getattr(booking, "origin_address", ""),
                "dropoff_address": getattr(booking, "destination_address", "") or getattr(booking, "dropoff_address", ""),
                "scheduled_at": format_dt_fr(getattr(booking, "scheduled_time", None) or getattr(booking, "pickup_datetime", None)),
                "vehicle_type": getattr(booking, "get_vehicle_type_display", lambda: getattr(booking, "vehicle_type", "-"))(),
                "passengers": getattr(booking, "passengers", "–"),
                "luggage": getattr(booking, "luggage_count", "–"),
                "estimated_price": f"{Decimal(getattr(booking, 'estimated_price', 0)):.2f} €".replace(".", ",")
                                   if getattr(booking, "estimated_price", None) is not None else "—",
                "status_label": getattr(booking, "get_status_display", lambda: getattr(booking, "status", "En attente"))(),
            }

            subject = f"Réservation reçue – {context['booking_code']}"
            html = render_to_string("email/booking_confirmation.html", context)
            text = strip_tags(html)  # fallback texte simple

            msg = EmailMultiAlternatives(
                subject=subject,
                body=text,
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
                to=[to_email],
            )
            msg.attach_alternative(html, "text/html")
            msg.send(fail_silently=False)
            return True

        except Exception as e:
            logger.error(f"[booking:{getattr(booking, 'id', '?')}] Erreur email confirmation (HTML) : {e}")
            return False

    @staticmethod
    def send_driver_assignment(booking: Booking) -> bool:
        """
        Envoie l’email d’assignation chauffeur au client (invité supporté).
        """
        if not booking.driver:
            return False

        try:
            to_name, to_email = NotificationService._get_customer_identity(booking)
            if not to_email:
                logger.info(f"[booking:{booking.id}] Pas d’email client → on saute l’envoi assignation.")
                return True

            subject = f"Chauffeur assigné - Réservation #{getattr(booking, 'confirmation_number', '')}"
            message = f"""Bonjour {to_name},

Un chauffeur a été assigné à votre réservation.

Chauffeur :
- Nom : {booking.driver.name}
- Téléphone : {booking.driver.phone_number}
- Véhicule : {booking.driver.get_vehicle_summary()}

Course :
- Départ : {getattr(booking, 'pickup_address', '')}
- Destination : {getattr(booking, 'destination_address', '')}
- Heure prévue : {format_dt_fr(getattr(booking, 'scheduled_time', None))}
- Véhicule demandé : {getattr(booking, 'get_vehicle_type_display', lambda: getattr(booking, 'vehicle_type', '-'))()}
- Passagers : {getattr(booking, 'passengers', '–')}
- Bagages : {getattr(booking, 'luggage_count', '–')}

Cordialement,
L'équipe French Driver
"""

            send_mail(
                subject=subject,
                message=message,
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
                recipient_list=[to_email],
                fail_silently=False,
            )
            return True

        except Exception as e:
            logger.error(f"[booking:{getattr(booking, 'id', '?')}] Erreur email assignation : {e}")
            return False

    # ------------------------------
    # Notification ADMIN (dispatch)
    # ------------------------------
    @staticmethod
    def notify_admin_new_booking(booking: Booking) -> bool:
        """
        Envoie un email au dispatch/admin à chaque nouvelle demande.
        Nécessite ADMIN_EMAILS dans settings.
        """
        admin_emails = getattr(settings, "ADMIN_EMAILS", [])
        if not admin_emails:
            return True  # pas bloquant s'il n'y a pas de destinataires

        try:
            when_str = format_dt_fr(getattr(booking, "scheduled_time", None))
            subject = f"[FD] Nouvelle demande #{getattr(booking, 'confirmation_number', '')}"
            body = (
                f"Départ : {getattr(booking, 'pickup_address', '')}\n"
                f"Arrivée : {getattr(booking, 'destination_address', '')}\n"
                f"Quand : {when_str}\n"
                f"Véhicule : {getattr(booking, 'get_vehicle_type_display', lambda: getattr(booking, 'vehicle_type', '-'))()} ({getattr(booking, 'vehicle_type', '-')})\n"
                f"Passagers : {getattr(booking, 'passengers', '–')} | Bagages : {getattr(booking, 'luggage_count', '–')}\n"
                f"Prix estimé : {getattr(booking, 'estimated_price', '–')} €\n"
                f"Statut : {getattr(booking, 'get_status_display', lambda: getattr(booking, 'status', '-'))()}\n"
                f"Client : {(booking.user.get_full_name() if getattr(booking, 'user_id', None) else (getattr(booking, 'guest_name', None) or 'Invité'))}\n"
                f"Email : {(booking.user.email if getattr(booking, 'user_id', None) else (getattr(booking, 'guest_email', None) or '—'))}\n"
                f"Téléphone : {(getattr(booking.user, 'phone_number', None) if getattr(booking, 'user_id', None) else (getattr(booking, 'guest_phone', None) or '—'))}\n"
            )
            send_mail(
                subject=subject,
                message=body,
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
                recipient_list=admin_emails,
                fail_silently=False,
            )
            return True
        except Exception as e:
            logger.error(f"Erreur notif admin booking {getattr(booking, 'id', '?')}: {e}")
            return False

    # ------------------------------
    # Notification Chauffeurs (Email + Telegram)
    # ------------------------------
    @staticmethod
    def notify_driver_new_booking(driver: Driver, booking: Booking) -> bool:
        """
        Notifie un chauffeur d’une nouvelle course (email + Telegram).
        """
        success_email = False
        success_telegram = False

        # 1) Email au chauffeur
        try:
            client_name, _ = NotificationService._get_customer_identity(booking)

            subject = f"Nouvelle course disponible - {getattr(booking, 'pickup_address', '')}"
            message = f"""Bonjour {driver.name},

Une nouvelle course est disponible :

Détails :
- Départ : {getattr(booking, 'pickup_address', '')}
- Destination : {getattr(booking, 'destination_address', '')}
- Heure prévue : {format_dt_fr(getattr(booking, 'scheduled_time', None))}
- Véhicule : {getattr(booking, 'get_vehicle_type_display', lambda: getattr(booking, 'vehicle_type', '-'))()}
- Passagers : {getattr(booking, 'passengers', '–')}
- Bagages : {getattr(booking, 'luggage_count', '–')}
- Prix estimé : {getattr(booking, 'estimated_price', '–')} €
- Client : {client_name}

Pour accepter cette course, veuillez contacter la centrale ou répondre via Telegram.

Cordialement,
L'équipe French Driver
"""

            send_mail(
                subject=subject,
                message=message,
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
                recipient_list=[driver.email],
                fail_silently=False,
            )
            success_email = True

        except Exception as e:
            logger.error(f"[driver:{getattr(driver, 'id', '?')}] Erreur email nouvelle course : {e}")

        # 2) Telegram
        if driver.can_receive_notifications():
            try:
                client_name, _ = NotificationService._get_customer_identity(booking)
                telegram_message = f"""🚖 *NOUVELLE COURSE DISPONIBLE*

📍 *Départ :* {getattr(booking, 'pickup_address', '')}
🎯 *Destination :* {getattr(booking, 'destination_address', '')}
⏰ *Heure :* {format_dt_fr(getattr(booking, 'scheduled_time', None))}
🚘 *Véhicule :* {getattr(booking, 'get_vehicle_type_display', lambda: getattr(booking, 'vehicle_type', '-'))()}
👥 *Passagers :* {getattr(booking, 'passengers', '–')}   🧳 *Bagages :* {getattr(booking, 'luggage_count', '–')}
💶 *Prix :* {getattr(booking, 'estimated_price', '–')} €

👤 *Client :* {client_name}

🔔 Contactez la centrale pour accepter !
"""
                response = requests.post(
                    f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage",
                    json={"chat_id": driver.telegram_chat_id, "text": telegram_message, "parse_mode": "Markdown"}
                )
                success_telegram = bool(response.json().get("ok", False))
            except Exception as e:
                logger.error(f"[driver:{getattr(driver, 'id', '?')}] Erreur notif Telegram : {e}")

        return success_email or success_telegram


# =========================================================
# DISPATCH / AFFECTATION
# =========================================================
class DispatchService:
    """
    Service de dispatch des courses.
    """

    @staticmethod
    def broadcast_to_available_drivers(booking: Booking) -> dict:
        """
        Diffuse la course à tous les chauffeurs disponibles.
        """
        available_drivers = Driver.objects.all()

        success_count = 0
        failed_count = 0
        drivers_contacted = []

        for driver in available_drivers:
            success = NotificationService.notify_driver_new_booking(driver, booking)
            if success:
                success_count += 1
                drivers_contacted.append(driver.name)
            else:
                failed_count += 1

        return {
            'booking_id': booking.id,
            'total_drivers': available_drivers.count(),
            'success_count': success_count,
            'failed_count': failed_count,
            'drivers_contacted': drivers_contacted
        }

    @staticmethod
    def assign_driver_to_booking(booking: Booking, driver: Driver) -> bool:
        """
        Assigne manuellement un chauffeur à une réservation.
        """
        try:
            booking.assign_driver(driver)
            NotificationService.send_driver_assignment(booking)
            return True
        except Exception as e:
            logger.error(f"Erreur lors de l'assignation du chauffeur : {e}")
            return False


# =========================================================
# FACTURATION
# =========================================================
class InvoiceService:
    """
    Service de gestion des factures.
    """

    # ---------- 0) Envoi de la facture par e-mail (HTML) ----------
    @staticmethod
    def _send_invoice_email(invoice: Invoice) -> bool:
        """
        Construit un e-mail HTML + texte et l'envoie au client (connecté ou invité).
        """
        try:
            # Récup destinataire
            if getattr(invoice.booking, "user_id", None):
                to_name = invoice.booking.user.get_full_name() or invoice.booking.user.username or "Client"
                to_email = invoice.booking.user.email
            else:
                to_name = getattr(invoice.booking, "guest_name", None) or "Client"
                to_email = getattr(invoice.booking, "guest_email", None)

            if not to_email:
                logger.info(f"[invoice:{invoice.id}] Pas d’email client → on saute l’envoi facture.")
                return True

            subject = f"Votre facture {invoice.invoice_number}"

            # Corps HTML : templates/email/invoice.html (optionnel)
            html_body = render_to_string(
                "email/invoice.html",
                {"invoice": invoice, "client_name": to_name},
            )

            # Fallback texte brut
            text_body = (
                f"Bonjour {to_name},\n\n"
                f"Facture {invoice.invoice_number}\n"
                f"Date : {format_dt_fr(invoice.generated_at, with_time=False)}\n"
                f"Trajet : {invoice.booking.pickup_address} -> {invoice.booking.destination_address}\n"
                f"Montant TTC : {invoice.total_amount} €\n\n"
                f"Merci de votre confiance.\nL’équipe French Driver"
            )

            email = EmailMultiAlternatives(
                subject=subject,
                body=text_body,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None),
                to=[to_email],
            )
            email.attach_alternative(html_body, "text/html")
            email.send(fail_silently=False)
            return True

        except Exception as e:
            logger.error(f"[invoice:{getattr(invoice, 'id', '?')}] Erreur envoi facture HTML : {e}")
            return False

    # ---------- 1) Génération thread-safe du numéro ----------
    @staticmethod
    def _next_invoice_number() -> str:
        """
        Retourne le prochain numéro VTC-YYYY-MM-XXXX sans collision.
        (Le numéro reste technique avec mois numérique pour l'ordre.)
        """
        now = timezone.now()
        prefix = f"VTC-{now:%Y-%m}-"

        with transaction.atomic():
            last = (
                Invoice.objects
                .select_for_update()
                .filter(invoice_number__startswith=prefix)
                .order_by("-invoice_number")
                .first()
            )

            seq = 1
            if last:
                seq = int(last.invoice_number[-4:]) + 1

            return f"{prefix}{seq:04d}"

    # ---------- 2) Création “retry” en cas de collision ----------
    @classmethod
    def _create_unique_invoice(cls, booking: Booking) -> Invoice:
        """
        Tente de créer une facture ; ré-essaie si l’unicité échoue (rare).
        """
        while True:
            try:
                return Invoice.objects.create(
                    booking=booking,
                    invoice_number=cls._next_invoice_number(),
                    amount=booking.final_price or booking.estimated_price,
                    tax_amount=Decimal("0.00"),
                )
            except IntegrityError:
                continue  # une autre transaction a pris le même numéro

    # ---------- 3) API publique ----------
    @classmethod
    def generate_invoice(cls, booking: Booking) -> Optional[Invoice]:
        """
        Assure qu'une facture existe, puis l'envoie par e-mail HTML.
        (Aucun PDF n'est produit ici.)
        """
        if booking.status != "COMPLETED":
            return None

        # 1) Récupérer ou créer la facture
        invoice = getattr(booking, "invoice", None) or cls._create_unique_invoice(booking)

        # 2) Envoyer l'e-mail (on peut mémoriser l'envoi avec sent_at)
        sent_ok = cls._send_invoice_email(invoice)

        # (optionnel) marquer l'envoi pour éviter les doublons
        if sent_ok and not getattr(invoice, "sent_at", None):
            invoice.sent_at = timezone.now()
            invoice.save(update_fields=["sent_at"])

        return invoice
