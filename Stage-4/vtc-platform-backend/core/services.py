import math
import requests
from decimal import Decimal
from typing import Tuple, Optional
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from .models import Booking, Driver, Invoice
import asyncio
from .telegram_service import telegram_service
from django.db import transaction, IntegrityError
from django.utils import timezone
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string



class PricingService:
    """
    Service for calculating distances and ride prices
    """

    # Tarifs par type de véhicule
    VEHICLE_TARIFFS = {
        "eco":      {"base": Decimal("5.00"), "per_km": Decimal("1.50"), "per_min": Decimal("0.40")},
        "berline":  {"base": Decimal("7.00"), "per_km": Decimal("1.80"), "per_min": Decimal("0.45")},
        "van":      {"base": Decimal("8.00"), "per_km": Decimal("2.00"), "per_min": Decimal("0.50")},
        "goldwing": {"base": Decimal("8.00"), "per_km": Decimal("2.00"), "per_min": Decimal("0.50")},
    }

    # ————————————————————————————————————————————————
    # 1️⃣  Distance & durée
    # ————————————————————————————————————————————————
    @staticmethod
    def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Distance (km) entre deux points GPS (Haversine)
        """
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        dlat, dlon = lat2 - lat1, lon2 - lon1
        a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
        c = 2 * math.asin(math.sqrt(a))
        return 6371 * c  # Rayon moyen de la Terre (km)

    @staticmethod
    def estimate_duration(distance_km: float) -> int:
        """
        Durée estimée (minutes) à 30 km/h de moyenne
        """
        return int((distance_km / 30) * 60)

    # ————————————————————————————————————————————————
    # 2️⃣  Prix
    # ————————————————————————————————————————————————
    @classmethod
    def calculate_price(
        cls,
        pickup_lat: float,
        pickup_lon: float,
        dest_lat: float,
        dest_lon: float,
        vehicle_type: str = "eco",
    ) -> dict:
        """
        Estime le prix d’une course selon le type de véhicule
        """
        # a. Tarifs applicables
        tariffs = cls.VEHICLE_TARIFFS.get(vehicle_type, cls.VEHICLE_TARIFFS["eco"])
        base_price, per_km, per_min = tariffs["base"], tariffs["per_km"], tariffs["per_min"]

        # b. Distance & durée
        distance_km = cls.calculate_distance(pickup_lat, pickup_lon, dest_lat, dest_lon)
        duration_min = cls.estimate_duration(distance_km)

        # c. Calcul
        distance_price = Decimal(str(distance_km)) * per_km
        time_price = Decimal(str(duration_min)) * per_min
        total_price = base_price + distance_price + time_price

        # d. Résultat détaillé
        return {
            "distance_km": round(distance_km, 2),
            "estimated_duration_minutes": duration_min,
            "base_price": float(base_price),
            "distance_price": float(distance_price),
            "time_price": float(time_price),
            "estimated_price": float(total_price.quantize(Decimal("0.01"))),
        }



class NotificationService:
    """
    Service for sending email notifications
    """

    @staticmethod
    def send_booking_confirmation(booking: Booking) -> bool:
        """
        Sends a booking confirmation email to the customer
        """
        try:
            subject = f"Confirmation de votre réservation VTC #{booking.confirmation_number}"

            message = f"""
            Bonjour {booking.user.get_full_name() or booking.user.username},

            Votre réservation VTC a été confirmée avec succès.

            Détails de votre réservation :
            - Numéro de confirmation : {booking.confirmation_number}
            - Départ : {booking.pickup_address}
            - Destination : {booking.destination_address}
            - Heure prévue : {booking.scheduled_time.strftime('%d/%m/%Y à %H:%M')}
            - Prix estimé : {booking.estimated_price}€

            Statut : {booking.get_status_display()}

            Nous vous tiendrons informé de l'évolution de votre réservation.

            Cordialement,
            L'équipe French Driver
            """

            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[booking.user.email],
                fail_silently=False,
            )

            return True

        except Exception as e:
            print(f"Erreur lors de l'envoi de l'email de confirmation : {e}")
            return False

    @staticmethod
    def send_driver_assignment(booking: Booking) -> bool:
        """
        Sends a driver assignment email to the customer
        """
        if not booking.driver:
            return False

        try:
            subject = f"Chauffeur assigné - Réservation #{booking.confirmation_number}"

            message = f"""
            Bonjour {booking.user.get_full_name()},

            Un chauffeur a été assigné à votre réservation.

            Détails du chauffeur :
            - Nom : {booking.driver.name}
            - Téléphone : {booking.driver.phone_number}
            - Véhicule : {booking.driver.get_vehicle_summary()}

            Détails de votre course :
            - Départ : {booking.pickup_address}
            - Destination : {booking.destination_address}
            - Heure prévue : {booking.scheduled_time.strftime('%d/%m/%Y à %H:%M')}

            Votre chauffeur vous contactera directement si nécessaire.

            Cordialement,
            L'équipe French Driver
            """

            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[booking.user.email],
                fail_silently=False,
            )

            return True

        except Exception as e:
            print(f"Erreur lors de l'envoi de l'email d'assignation : {e}")
            return False

    @staticmethod
    def notify_driver_new_booking(driver: Driver, booking: Booking) -> bool:
        """
        Notifies a driver of a new available ride
        """
        try:
            subject = f"Nouvelle course disponible - {booking.pickup_address}"

            message = f"""
            Bonjour {driver.name},

            Une nouvelle course est disponible :

            Détails :
            - Départ : {booking.pickup_address}
            - Destination : {booking.destination_address}
            - Heure prévue : {booking.scheduled_time.strftime('%d/%m/%Y à %H:%M')}
            - Prix estimé : {booking.estimated_price}€
            - Client : {booking.user.get_full_name()}

            Pour accepter cette course, veuillez contacter la centrale ou répondre via Telegram.

            Cordialement,
            L'équipe French Driver
            """

            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[driver.email],
                fail_silently=False,
            )

            success_email = True

        except Exception as e:
            print(f"Erreur lors de l'envoi de l'email au chauffeur : {e}")

        # 2. Notification by Telegram
        if driver.can_receive_notifications():
            try:
                telegram_message = f"""
                🚖 *NOUVELLE COURSE DISPONIBLE*

                📍 *Départ :* {booking.pickup_address}
                🎯 *Destination :* {booking.destination_address}
                ⏰ *Heure :* {booking.scheduled_time.strftime('%d/%m/%Y à %H:%M')}
                💰 *Prix :* {booking.estimated_price}€

                👤 *Client :* {booking.user.get_full_name() or booking.user.username}

                🔔 Contactez la centrale pour accepter !
                """

                response = requests.post(f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage", json={"chat_id": driver.telegram_chat_id, "text": telegram_message,  "parse_mode": "Markdown"})

                success_telegram = response.json().get("ok", False)

            except Exception as e:
                print(f"Erreur lors de l'envoi de la notification Telegram : {e}")

        return success_email or success_telegram


class DispatchService:
    """
    Service for managing race dispatch
    """

    @staticmethod
    def broadcast_to_available_drivers(booking: Booking) -> dict:
        """
        Broadcast a ride to all available drivers
        Returns a broadcast report
        """
        # For now, all drivers
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
        Manually assign a driver to a reservation
        """
        try:
            booking.assign_driver(driver)

            # Send notifications
            NotificationService.send_driver_assignment(booking)

            return True

        except Exception as e:
            print(f"Erreur lors de l'assignation du chauffeur : {e}")
            return False


class InvoiceService:
    """
    Service for invoice management
    """

        # ---------- 0. Envoi de la facture par e-mail (HTML) ----------
    @staticmethod
    def _send_invoice_email(invoice: Invoice) -> bool:
        """
        Construit un e-mail HTML + texte et l'envoie au client.
        """
        subject = f"Votre facture {invoice.invoice_number}"

        # Corps HTML : templates/email/invoice.html
        html_body = render_to_string(
            "email/invoice.html",
            {"invoice": invoice},
        )

        # Fallback texte brut (lisible même sans HTML)
        text_body = (
            f"Facture {invoice.invoice_number}\n"
            f"Date  : {invoice.generated_at:%d/%m/%Y}\n"
            f"Trajet: {invoice.booking.pickup_address} -> "
            f"{invoice.booking.destination_address}\n"
            f"Montant TTC : {invoice.amount} €\n"
            "\nMerci de votre confiance.\nL’équipe French Driver"
        )

        email = EmailMultiAlternatives(
            subject=subject,
            body=text_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[invoice.booking.user.email],
        )
        email.attach_alternative(html_body, "text/html")

        try:
            email.send(fail_silently=False)
            return True
        except Exception as e:
            print(f"Erreur envoi facture HTML : {e}")
            return False


    # ---------- 1. Génération thread-safe du numéro ----------
    @staticmethod
    def _next_invoice_number() -> str:
        """
        Retourne le prochain numéro VTC-YYYY-MM-XXXX sans collision,
        en verrouillant les factures du mois courant.
        """
        now = timezone.now()
        prefix = f"VTC-{now:%Y-%m}-"

        with transaction.atomic():                         # ➜ ouvre une transaction SQL
            last = (
                Invoice.objects
                .select_for_update()                       # ➜ lock les lignes du mois
                .filter(invoice_number__startswith=prefix)
                .order_by("-invoice_number")
                .first()
            )

            seq = 1
            if last:                                       # ex : 'VTC-2025-06-0012'
                seq = int(last.invoice_number[-4:]) + 1    #       -> 12 + 1 = 13

            return f"{prefix}{seq:04d}"                    # 'VTC-2025-06-0013'

    # ---------- 2. Création “retry” en cas de collision ----------
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
                # Une autre transaction a inséré le même numéro
                # juste avant le commit → on relance la boucle
                continue

        # ---------- 3. API publique ----------
    @classmethod
    def generate_invoice(cls, booking: Booking) -> Optional[Invoice]:
        """
        Assure qu'une facture existe, puis l'envoie par e-mail HTML.
        AUCUN PDF n'est produit.
        """
        if booking.status != "COMPLETED":
            return None

        # 1. Récupérer ou créer la facture
        invoice = getattr(booking, "invoice", None) or cls._create_unique_invoice(booking)

        # 2. Envoyer l'e-mail (on peut mémoriser l'envoi avec sent_at)
        sent_ok = cls._send_invoice_email(invoice)

        # (optionnel) marquer l'envoi pour éviter les doublons
        if sent_ok and not getattr(invoice, "sent_at", None):
            invoice.sent_at = timezone.now()
            invoice.save(update_fields=["sent_at"])

        return invoice
