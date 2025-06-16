# test_booking_services.py
import os
import django
from decimal import Decimal
from datetime import datetime, timedelta
from django.utils import timezone
from core.models import User, Driver, Booking, Invoice
from core.services import PricingService, NotificationService, DispatchService, InvoiceService

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vtc_platform.settings')
django.setup()


def test_booking_and_services():
    print("=== Test des modèles Booking et Services ===")

    # Test 1: Création d'une réservation
    print("\n1. Test de création d'une réservation...")

    # Récupérer un utilisateur et un chauffeur existants
    try:
        user = User.objects.filter(user_type='CLIENT').first()
        driver = Driver.objects.first()

        if not user:
            user = User.objects.create_user(
                username='test_client_booking',
                email='client.booking@test.fr',
                password='testpass123',
                first_name='Test',
                last_name='Client',
                user_type='CLIENT'
            )

        if not driver:
            driver = Driver.objects.create(
                name='Test Driver',
                phone_number='+33111222333',
                email='test.driver@vtc.fr',
                license_number='TEST123456',
                vehicle_info='Test Vehicle - AB-123-CD'
            )

        # Test du service de calcul de prix
        print("\n2. Test du service de calcul de prix...")
        paris_coords = (48.8566, 2.3522)  # Paris
        cdg_coords = (49.0097, 2.5479)    # CDG Airport

        pricing_result = PricingService.calculate_price(
            paris_coords[0], paris_coords[1],
            cdg_coords[0], cdg_coords[1]
        )

        print(f"✓ Calcul de prix effectué:")
        print(f"  - Distance: {pricing_result['distance_km']} km")
        print(f"  - Durée estimée: {pricing_result['estimated_duration_minutes']} min")
        print(f"  - Prix estimé: {pricing_result['estimated_price']}€")

        # Création de la réservation
        booking = Booking.objects.create(
            user=user,
            pickup_address="Place de la République, Paris",
            pickup_latitude=Decimal(str(paris_coords[0])),
            pickup_longitude=Decimal(str(paris_coords[1])),
            destination_address="Aéroport Charles de Gaulle, Roissy",
            destination_latitude=Decimal(str(cdg_coords[0])),
            destination_longitude=Decimal(str(cdg_coords[1])),
            estimated_price=Decimal(str(pricing_result['estimated_price'])),
            scheduled_time=timezone.now() + timedelta(hours=2)
        )

        print(f"✓ Réservation créée: {booking}")
        print(f"  - Numéro de confirmation: {booking.confirmation_number}")
        print(f"  - Statut: {booking.get_status_display()}")
        print(f"  - Prix final: {booking.final_price}€")

        # Test 3: Service de notification
        print("\n3. Test du service de notification...")
        success = NotificationService.send_booking_confirmation(booking)
        print(f"✓ Email de confirmation envoyé: {success}")

        # Test 4: Service de dispatch
        print("\n4. Test du service de dispatch...")
        dispatch_result = DispatchService.broadcast_to_available_drivers(booking)
        print(f"✓ Diffusion aux chauffeurs:")
        print(f"  - Chauffeurs contactés: {dispatch_result['success_count']}")
        print(f"  - Noms: {dispatch_result['drivers_contacted']}")

        # Test 5: Assignation de chauffeur
        print("\n5. Test d'assignation de chauffeur...")
        assignment_success = DispatchService.assign_driver_to_booking(booking, driver)
        print(f"✓ Assignation réussie: {assignment_success}")
        print(f"  - Nouveau statut: {booking.get_status_display()}")

        # Test 6: Simulation de fin de course et facture
        print("\n6. Test de fin de course et facturation...")
        booking.start_trip()
        print(f"✓ Course démarrée: {booking.get_status_display()}")

        booking.complete_trip()
        print(f"✓ Course terminée: {booking.get_status_display()}")

        invoice = InvoiceService.generate_invoice(booking)
        if invoice:
            print(f"✓ Facture générée: {invoice}")
            print(f"  - Numéro: {invoice.invoice_number}")
            print(f"  - Montant: {invoice.total_amount}€")

        # Test 7: Méthodes du modèle
        print("\n7. Test des méthodes du modèle...")
        print(f"  - Réservation active: {booking.is_active()}")
        print(f"  - Peut être annulée: {booking.can_be_cancelled()}")

        print("\n=== Tous les tests sont réussis ! ===")

    except Exception as e:
        print(f"✗ Erreur dans les tests: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    test_booking_and_services()
