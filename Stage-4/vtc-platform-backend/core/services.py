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


class PricingService:
    """
    Service for calculating prices and distances
    """

    # Basic rates
    BASE_PRICE = Decimal('5.00')  # Support price
    PRICE_PER_KM = Decimal('1.50')  # Price per kilometer
    PRICE_PER_MINUTE = Decimal('0.30')  # Price per minute

    @staticmethod
    def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculates the distance between two GPS points
        using the Haversine formula.
        Returns the distance in kilometers
        """
        # Conversion to radians
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])

        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))

        # Radius of the Earth in kilometers
        r = 6371

        return c * r

    @staticmethod
    def estimate_duration(distance_km: float) -> int:
        """
        Estimate the journey time in minutes
        Assumes an average speed of 30 km/h in the city
        """
        avg_speed_kmh = 30
        duration_hours = distance_km / avg_speed_kmh
        return int(duration_hours * 60)  # Conversion to minutes

    @classmethod
    def calculate_price(cls, pickup_lat: float, pickup_lon: float, dest_lat: float, dest_lon: float) -> dict:
        """
        Calculates the estimated price of a ride
        Returns a dictionary with the details of the calculation
        """
        # Calculating the distance
        distance_km = cls.calculate_distance(pickup_lat, pickup_lon, dest_lat, dest_lon)

        # Estimated duration
        duration_minutes = cls.estimate_duration(distance_km)

        # Price calculation
        distance_price = Decimal(str(distance_km)) * cls.PRICE_PER_KM
        time_price = Decimal(str(duration_minutes)) * cls.PRICE_PER_MINUTE
        total_price = cls.BASE_PRICE + distance_price + time_price

        return {
            'distance_km': round(distance_km, 2),
            'estimated_duration_minutes': duration_minutes,
            'base_price': float(cls.BASE_PRICE),
            'distance_price': float(distance_price),
            'time_price': float(time_price),
            'estimated_price': float(total_price.quantize(Decimal('0.01')))
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

    @staticmethod
    def generate_invoice(booking: Booking) -> Optional[Invoice]:
        """
        Génère une facture pour une réservation terminée
        """
        if booking.status != 'COMPLETED':
            return None

        try:
            # Check if an invoice already exists
            if hasattr(booking, 'invoice'):
                return booking.invoice

            # Create the invoice
            invoice = Invoice.objects.create(
                booking=booking,
                amount=booking.final_price or booking.estimated_price,
                tax_amount=Decimal('0.00'),  # No VAT for now
            )

            return invoice

        except Exception as e:
            print(f"Erreur lors de la génération de la facture : {e}")
            return None
