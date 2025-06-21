# core/views_api.py
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.db.models import Q, Count, Sum, Avg
from django.utils import timezone
from datetime import timedelta
from .models import User, Driver, Booking, Invoice
from .serializers import (
    CustomTokenObtainPairSerializer, UserRegistrationSerializer,
    UserSerializer, DriverSerializer,
    BookingEstimateSerializer, BookingCreateSerializer,
    BookingSerializer, BookingUpdateSerializer, InvoiceSerializer,
    PriceEstimateResponseSerializer,
    AdminDashboardSerializer, DispatchSerializer
)
from .services import (
    PricingService, NotificationService, DispatchService, InvoiceService
)
from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied
from .models import Invoice
from .models import Invoice
from .serializers import InvoiceSerializer


# ===============================
# AUTHENTIFICATION
# ===============================

class CustomTokenObtainPairView(TokenObtainPairView):
    """Vue personnalisée pour l'authentification JWT"""
    serializer_class = CustomTokenObtainPairSerializer


class UserRegistrationView(generics.CreateAPIView):
    """Vue pour l'inscription d'utilisateurs"""
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
    """Récupère le profil de l'utilisateur connecté"""
    serializer = UserSerializer(request.user)
    return Response({
        'success': True,
        'data': serializer.data
    })


# ===============================
# GESTION DES RÉSERVATIONS
# ===============================

class BookingEstimateView(APIView):
    """Vue pour l'estimation de prix"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = BookingEstimateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Pour l'instant, utiliser des coordonnées par défaut si non fournies
        pickup_lat = float(
            serializer.validated_data.get('pickup_latitude', 48.8566)
            )
        pickup_lon = float(
            serializer.validated_data.get('pickup_longitude', 2.3522)
            )
        dest_lat = float(
            serializer.validated_data.get('destination_latitude', 49.0097)
            )
        dest_lon = float(
            serializer.validated_data.get('destination_longitude', 2.5479)
            )

        # Calcul du prix
        pricing_result = PricingService.calculate_price(
            pickup_lat, pickup_lon, dest_lat, dest_lon
        )

        # Ajouter les coordonnées à la réponse
        pricing_result['pickup_coordinates'] = {
            'latitude': pickup_lat,
            'longitude': pickup_lon
        }
        pricing_result['destination_coordinates'] = {
            'latitude': dest_lat,
            'longitude': dest_lon
        }

        return Response({
            'success': True,
            'data': pricing_result
        })


class BookingCreateView(generics.CreateAPIView):
    """Vue pour créer une réservation"""
    queryset = Booking.objects.all()
    serializer_class = BookingCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking = serializer.save()

        # Envoyer l'email de confirmation
        NotificationService.send_booking_confirmation(booking)

        return Response({
            'success': True,
            'data': {
                'booking_id': booking.id,
                'confirmation_number': booking.confirmation_number,
                'status': booking.status,
                'estimated_price': booking.estimated_price
            }
        }, status=status.HTTP_201_CREATED)


class BookingDetailView(generics.RetrieveAPIView):
    """Vue pour récupérer les détails d'une réservation"""
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Filtrer les réservations selon le type d'utilisateur"""
        user = self.request.user
        if user.is_admin_user():
            return Booking.objects.all().select_related('user', 'driver')
        else:
            return Booking.objects.filter(user=user).select_related('driver')


class UserBookingsView(generics.ListAPIView):
    """Vue pour l'historique des réservations d'un utilisateur"""
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Booking.objects.filter(user=user).select_related('driver')

        # Filtrage par statut (optionnel)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset.order_by('-created_at')


# ===============================
# ADMINISTRATION
# ===============================

class AdminBookingUpdateView(generics.UpdateAPIView):
    """Vue pour mettre à jour une réservation (Admin uniquement)"""
    queryset = Booking.objects.all()
    serializer_class = BookingUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        """Seuls les admins peuvent accéder"""
        return [permissions.IsAuthenticated(), IsAdminUser()]

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(
            instance, data=request.data, partial=partial
            )
        serializer.is_valid(raise_exception=True)

        # Sauvegarder les changements
        updated_booking = serializer.save()
        if updated_booking.status == 'COMPLETED':
            # on fixe la date de fin de course
            updated_booking.completed_at = timezone.now()
            updated_booking.save()
            InvoiceService.generate_invoice(updated_booking) #ajout

        

        # Envoyer des notifications si nécessaire
        if 'driver' in request.data and updated_booking.driver:
            NotificationService.send_driver_assignment(updated_booking)

        return Response({
            'success': True,
            'data': {
                'booking_id': updated_booking.id,
                'new_status': updated_booking.status,
                'updated_at': updated_booking.updated_at
            }
        })


class AdminDashboardView(APIView):
    """Vue pour le dashboard administrateur"""
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        return [permissions.IsAuthenticated(), IsAdminUser()]

    def get(self, request):
        # Période à analyser (par défaut: aujourd'hui)
        period = request.query_params.get('period', 'today')

        if period == 'today':
            start_date = timezone.now().replace(hour=0, minute=0, second=0)
            end_date = timezone.now().replace(hour=23, minute=59, second=59)
        elif period == 'week':
            start_date = timezone.now() - timedelta(days=7)
            end_date = timezone.now()
        elif period == 'month':
            start_date = timezone.now() - timedelta(days=30)
            end_date = timezone.now()
        else:
            start_date = timezone.now().replace(hour=0, minute=0, second=0)
            end_date = timezone.now().replace(hour=23, minute=59, second=59)

        # Statistiques des réservations
        bookings_stats = Booking.objects.filter(
            created_at__range=[start_date, end_date]
        ).aggregate(
            total=Count('id'),
            pending=Count('id', filter=Q(status='PENDING')),
            confirmed=Count('id', filter=Q(status='CONFIRMED')),
            driver_assigned=Count('id', filter=Q(status='DRIVER_ASSIGNED')),
            in_progress=Count('id', filter=Q(status='IN_PROGRESS')),
            completed=Count('id', filter=Q(status='COMPLETED')),
            cancelled=Count('id', filter=Q(status='CANCELLED')),
            total_revenue=Sum('final_price', filter=Q(status='COMPLETED'))
            or 0,
            avg_price=Avg('estimated_price') or 0
        )

        # Réservations récentes
        recent_bookings = Booking.objects.select_related('user', 'driver').order_by('-created_at')[:10]

        dashboard_data = {
            'total_bookings': bookings_stats['total'],
            'pending_bookings': bookings_stats['pending'],
            'confirmed_bookings': bookings_stats['confirmed'],
            'driver_assigned_bookings': bookings_stats['driver_assigned'],
            'in_progress_bookings': bookings_stats['in_progress'],
            'completed_bookings': bookings_stats['completed'],
            'cancelled_bookings': bookings_stats['cancelled'],
            'total_revenue': bookings_stats['total_revenue'],
            'average_price': bookings_stats['avg_price'],
            'recent_bookings': recent_bookings
        }

        serializer = AdminDashboardSerializer(dashboard_data)

        return Response({
            'success': True,
            'data': serializer.data
        })


class DispatchView(APIView):
    """Vue pour les actions de dispatch"""
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
    """Vue pour lister les chauffeurs (Admin)"""
    queryset = Driver.objects.all()
    serializer_class = DriverSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        return [permissions.IsAuthenticated(), IsAdminUser()]


class DriverCreateView(generics.CreateAPIView):
    """Vue pour créer un chauffeur (Admin)"""
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
    """Permission personnalisée pour les administrateurs"""

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_admin_user()
        )
    
class InvoiceDetailView(generics.RetrieveAPIView):
    """Récupère la facture associée à une réservation."""
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        # Tous les admins peuvent, les clients seulement leurs propres factures
        base_perms = [permissions.IsAuthenticated()]
        inst = self.get_object()
        if self.request.user.is_admin_user() or inst.booking.user == self.request.user:
            return base_perms
        raise PermissionDenied("Vous n'avez pas le droit de voir cette facture.")
    
    def get_object(self):
        # On se base sur booking_id dans l’URL plutôt que pk de la facture
        booking_id = self.kwargs['booking_id']
        return Invoice.objects.get(booking__id=booking_id)

# ===============================
# VUE DE SANTÉ (sans authentification)
# ===============================

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def health_check(request):
    """Vue simple pour vérifier que l'API fonctionne"""
    return Response({
        'success': True,
        'message': 'VTC Platform API is running!',
        'version': '1.0.0',
        'timestamp': timezone.now()
    }, status=status.HTTP_200_OK)
