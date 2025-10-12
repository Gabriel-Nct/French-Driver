# core/views_api.py
from datetime import timedelta
import json
import logging

from django.conf import settings
from django.core.mail import send_mail
from rest_framework.permissions import AllowAny


from django.db.models import Q, Count, Sum, Avg
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import User, Driver, Booking, Invoice
from .serializers import (
    CustomTokenObtainPairSerializer, UserRegistrationSerializer,
    UserSerializer, DriverSerializer,
    BookingEstimateSerializer, BookingCreateSerializer,
    BookingSerializer, BookingUpdateSerializer, InvoiceSerializer,
    PriceEstimateResponseSerializer,
    AdminDashboardSerializer, DispatchSerializer,
    ContactSerializer,
)
# APRÈS
from .services import (
    PricingService, NotificationService, DispatchService, InvoiceService
)
from vtc_platform.captcha import verify_turnstile_token, get_client_ip


logger = logging.getLogger(__name__)


# ===============================
# AUTHENTIFICATION
# ===============================

class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom view for JWT authentication"""
    serializer_class = CustomTokenObtainPairSerializer


class UserRegistrationView(generics.CreateAPIView):
    """View for user registration"""
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response({
            'success': True,
            'data': {
                'user_id': user.id,
                'message': 'Utilisateur créé avec succès'
            }
        }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
def user_profile(request):
    """Retrieves the profile of the logged in user"""
    serializer = UserSerializer(request.user)
    return Response({
        'success': True,
        'data': serializer.data
    })


# ===============================
# GESTION DES RÉSERVATIONS
# ===============================

class BookingEstimateView(APIView):
    """Estimation de prix (ouverte aux invités)"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        d = request.data
        try:
            pickup_lat = float(d.get("pickup_lat") or d.get("pickup_latitude"))
            pickup_lon = float(d.get("pickup_lon") or d.get("pickup_longitude"))
            dest_lat   = float(d.get("dest_lat")   or d.get("destination_latitude"))
            dest_lon   = float(d.get("dest_lon")   or d.get("destination_longitude"))
        except (TypeError, ValueError):
            return Response(
                {"detail": "Champs requis: pickup_(lat|latitude), pickup_(lon|longitude), "
                           "dest_(lat|latitude), dest_(lon|longitude)."},
                status=status.HTTP_400_BAD_REQUEST
            )

        vehicle_type = d.get("vehicle_type", "eco")
        try:
            passengers = int(d.get("passengers") or 1)
        except (TypeError, ValueError):
            passengers = 1
        try:
            luggage_count = int(d.get("luggage_count") or 0)
        except (TypeError, ValueError):
            luggage_count = 0

        estimate = PricingService.calculate_price(
            pickup_lat, pickup_lon, dest_lat, dest_lon, vehicle_type
            # Si ton PricingService accepte ces kwargs, décommente :
            # passengers=passengers, luggage_count=luggage_count
        )
        estimate["pickup_coordinates"] = {"latitude": pickup_lat, "longitude": pickup_lon}
        estimate["destination_coordinates"] = {"latitude": dest_lat, "longitude": dest_lon}
        estimate["vehicle_type"] = vehicle_type
        estimate["passengers"] = passengers
        estimate["luggage_count"] = luggage_count
        return Response({"success": True, "data": estimate}, status=status.HTTP_200_OK)


class BookingCreateView(generics.CreateAPIView):
    """Création de réservation (invité ou connecté)"""
    queryset = Booking.objects.all()
    serializer_class = BookingCreateSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        """
        Flux:
         - Invité: CAPTCHA Turnstile OBLIGATOIRE (token dans request.data['captcha_token'])
         - Utilisateur connecté: CAPTCHA optionnel (ici non exigé)
         - Ensuite validation serializer + envoi notifications
        """
        # ✅ 1) CAPTCHA pour les invités
        if not request.user.is_authenticated:
            captcha_token = request.data.get("captcha_token")
            ok, info = verify_turnstile_token(captcha_token, get_client_ip(request))
            if not ok:
                logger.warning(f"Turnstile failed (guest): info={info}")
                return Response(
                    {"success": False,
                     "detail": "CAPTCHA invalide. Veuillez réessayer.",
                     "captcha": info},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # ✅ 2) Validation serializer
        serializer = self.get_serializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            logger.warning(f"BookingCreate validation errors: {serializer.errors}")
            return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        # ✅ 3) Sauvegarde
        booking = serializer.save()

        # ✅ 4) Notifications
        NotificationService.send_booking_confirmation(booking)
        try:
            NotificationService.notify_admin_new_booking(booking)
        except Exception:
            logger.exception("Erreur lors de notify_admin_new_booking")

        # ✅ 5) Réponse enrichie
        return Response({
            'success': True,
            'data': {
                'booking_id': booking.id,
                'confirmation_number': booking.confirmation_number,
                'status': booking.status,
                'status_display': booking.get_status_display(),
                'vehicle_type': booking.vehicle_type,
                'passengers': booking.passengers,
                'luggage_count': booking.luggage_count,
                'estimated_price': booking.estimated_price,
            }
        }, status=status.HTTP_201_CREATED)


class BookingDetailView(generics.RetrieveAPIView):
    """Détails d'une réservation"""
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Admins: tout; Client: seulement ses réservations"""
        user = self.request.user
        if user.is_admin_user():
            return Booking.objects.all().select_related('user', 'driver')
        return Booking.objects.filter(user=user).select_related('driver')


class UserBookingsView(generics.ListAPIView):
    """Historique des réservations d'un utilisateur"""
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Booking.objects.filter(user=user).select_related('driver')

        # Filtre par statut (optionnel)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset.order_by('-created_at')


# ===============================
# ADMINISTRATION
# ===============================

class AdminBookingUpdateView(generics.UpdateAPIView):
    """Mise à jour d'une réservation (Admin seulement)"""
    queryset = Booking.objects.all()
    serializer_class = BookingUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        """Only admins can access"""
        return [permissions.IsAuthenticated(), IsAdminUser()]

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        # Save changes
        updated_booking = serializer.save()
        if updated_booking.status == 'COMPLETED':
            # set end date of the ride
            updated_booking.completed_at = timezone.now()
            updated_booking.save()
            # Générer la facture (idempotent côté service si déjà existante)
            InvoiceService.generate_invoice(updated_booking)

        # Notifications si chauffeur assigné
        if 'driver' in request.data and updated_booking.driver:
            NotificationService.send_driver_assignment(updated_booking)

        return Response({
            'success': True,
            'data': {
                'booking_id': updated_booking.id,
                'new_status': updated_booking.status,
                'updated_at': getattr(updated_booking, "updated_at", timezone.now())
            }
        })


class AdminDashboardView(APIView):
    """Vue tableau de bord administrateur"""
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        return [permissions.IsAuthenticated(), IsAdminUser()]

    def get(self, request):
        # NOTE: le front envoie period in {today|week|month|all}. Défault 'today' gardé, mais 'all' est géré.
        period = request.query_params.get('period', 'today')
        now = timezone.now()

        # Base queryset (tri du plus récent au plus ancien)
        qs = (
            Booking.objects
            .select_related('user', 'driver')
            .order_by('-created_at')
        )

        # Filtrage par période
        if period == 'today':
            start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end   = now.replace(hour=23, minute=59, second=59, microsecond=999999)
            qs = qs.filter(created_at__range=[start, end])
        elif period == 'week':
            qs = qs.filter(created_at__gte=now - timedelta(days=7))
        elif period == 'month':
            qs = qs.filter(created_at__gte=now - timedelta(days=30))
        elif period == 'all':
            pass  # pas de filtre de date
        else:
            # fallback: today
            start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end   = now.replace(hour=23, minute=59, second=59, microsecond=999999)
            qs = qs.filter(created_at__range=[start, end])

        # Statistiques sur la même période
        bookings_stats = qs.aggregate(
            total=Count('id'),
            pending=Count('id', filter=Q(status='PENDING')),
            confirmed=Count('id', filter=Q(status='CONFIRMED')),
            driver_assigned=Count('id', filter=Q(status='DRIVER_ASSIGNED')),
            in_progress=Count('id', filter=Q(status='IN_PROGRESS')),
            completed=Count('id', filter=Q(status='COMPLETED')),
            cancelled=Count('id', filter=Q(status='CANCELLED')),
            total_revenue=Sum('final_price', filter=Q(status='COMPLETED')),
            avg_price=Avg('estimated_price'),
        )

        dashboard_data = {
            'total_bookings': bookings_stats['total'] or 0,
            'pending_bookings': bookings_stats['pending'] or 0,
            'confirmed_bookings': bookings_stats['confirmed'] or 0,
            'driver_assigned_bookings': bookings_stats['driver_assigned'] or 0,
            'in_progress_bookings': bookings_stats['in_progress'] or 0,
            'completed_bookings': bookings_stats['completed'] or 0,
            'cancelled_bookings': bookings_stats['cancelled'] or 0,
            'total_revenue': bookings_stats['total_revenue'] or 0,
            'average_price': bookings_stats['avg_price'] or 0,
            # Liste *sur la même période* (jusqu'à 500 pour la pagination front)
            # -> Le serializer AdminDashboardSerializer se charge de sérialiser chaque réservation
            'recent_bookings': list(qs[:500]),
        }

        serializer = AdminDashboardSerializer(dashboard_data)
        return Response({'success': True, 'data': serializer.data})


class DispatchView(APIView):
    """Actions de dispatch (admin)"""
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        return [permissions.IsAuthenticated(), IsAdminUser()]

    def post(self, request):
        serializer = DispatchSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        booking_id = serializer.validated_data['booking_id']
        action = serializer.validated_data['action']

        try:
            booking = Booking.objects.get(id=booking_id)

            if action == 'assign':
                driver_id = serializer.validated_data['driver_id']
                driver = Driver.objects.get(id=driver_id)

                success = DispatchService.assign_driver_to_booking(booking, driver)

                return Response({
                    'success': success,
                    'data': {
                        'booking_id': booking.id,
                        'driver_id': driver.id,
                        'assignment_time': timezone.now()
                    }
                })

            elif action == 'broadcast':
                result = DispatchService.broadcast_to_available_drivers(booking)

                return Response({
                    'success': True,
                    'data': {
                        'booking_id': booking.id,
                        'broadcast_time': timezone.now(),
                        'channels_used': ['email'],
                        'drivers_contacted': result['success_count']
                    }
                })

        except (Booking.DoesNotExist, Driver.DoesNotExist) as e:
            return Response({
                'success': False,
                'error': {
                    'code': 'NOT_FOUND',
                    'message': str(e)
                }
            }, status=status.HTTP_404_NOT_FOUND)


# ===============================
# GESTION DES CHAUFFEURS
# ===============================

class DriverListView(generics.ListAPIView):
    """Liste des chauffeurs (Admin)"""
    queryset = Driver.objects.all()
    serializer_class = DriverSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        return [permissions.IsAuthenticated(), IsAdminUser()]


class DriverCreateView(generics.CreateAPIView):
    """Création d'un chauffeur (Admin)"""
    queryset = Driver.objects.all()
    serializer_class = DriverSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        return [permissions.IsAuthenticated(), IsAdminUser()]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        driver = serializer.save()

        return Response({
            'success': True,
            'data': {
                'driver_id': driver.id,
                'message': 'Chauffeur créé avec succès'
            }
        }, status=status.HTTP_201_CREATED)


# ===============================
# PERMISSION PERSONNALISÉE
# ===============================

class IsAdminUser(permissions.BasePermission):
    """Custom permission for administrators"""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_admin_user()
        )


# ===============================
# FACTURES
# ===============================

class InvoiceDetailView(generics.RetrieveAPIView):
    """Récupère la facture d'une réservation."""
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        # Admins: ok; Clients: seulement leurs factures
        base_perms = [permissions.IsAuthenticated()]
        inst = self.get_object()
        if self.request.user.is_admin_user() or inst.booking.user == self.request.user:
            return base_perms
        raise PermissionDenied("Vous n'avez pas le droit de voir cette facture.")

    def get_object(self):
        # On se base sur booking_id passé dans l'URL
        booking_id = self.kwargs['booking_id']
        return Invoice.objects.get(booking__id=booking_id)


# ===============================
# VUE DE SANTÉ (sans authentification)
# ===============================

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def health_check(request):
    """Simple view to verify that the API is working"""
    return Response({
        'success': True,
        'message': 'VTC Platform API is running!',
        'version': '1.0.0',
        'timestamp': timezone.now()
    }, status=status.HTTP_200_OK)


# ===============================
# TELEGRAM
# ===============================

@method_decorator(csrf_exempt, name='dispatch')
class TelegramWebhookView(APIView):
    """Endpoint to receive Telegram webhooks"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        try:
            data = json.loads(request.body)
            logger.info(f"Webhook Telegram reçu: {data}")
            return Response({'status': 'ok'})
        except Exception as e:
            logger.error(f"Erreur webhook Telegram: {e}")
            return Response({'error': str(e)}, status=400)



class ContactView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []  # pas de JWT/CSRF requis pour ce formulaire public

    def post(self, request):
        serializer = ContactSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        # Honeypot anti-spam
        if data.get("company"):
            return Response({"detail": "Spam détecté."}, status=status.HTTP_400_BAD_REQUEST)

        to_email = getattr(settings, "CONTACT_DEFAULT_TO", "bookfrenchdriver@gmail.com")
        subject = f"[Contact] {data.get('subject')}"
        body = (
            f"Nom: {data.get('full_name')}\n"
            f"Email: {data.get('email')}\n"
            f"Téléphone: {data.get('phone')}\n"
            f"Raison: {data.get('reason') or '-'}\n\n"
            f"Message:\n{data.get('message')}\n"
        )

        try:
            send_mail(
                subject=subject,
                message=body,
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", settings.EMAIL_HOST_USER),
                recipient_list=[to_email],
                fail_silently=False,
            )
        except Exception as e:
            return Response({"detail": f"Envoi email impossible: {e}"}, status=status.HTTP_502_BAD_GATEWAY)

        return Response({"detail": "Message envoyé. Merci !"}, status=status.HTTP_201_CREATED)