# core/serializers.py
from decimal import Decimal
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User, Driver, Booking, Invoice
from .services import PricingService


# ===============================
# AUTH / UTILISATEURS
# ===============================

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom Serializer for JWT Authentication"""

    def validate(self, attrs):
        data = super().validate(attrs)
        # Infos utilisateur renvoyées avec le token
        data.update({
            'user': {
                'id': self.user.id,
                'username': self.user.username,
                'email': self.user.email,
                'user_type': self.user.user_type,
                'first_name': self.user.first_name,
                'last_name': self.user.last_name,
            }
        })
        return data


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = (
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'phone_number', 'user_type'
        )

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Les mots de passe ne correspondent pas.")
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        return user


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user information"""
    full_name = serializers.CharField(source='get_full_name', read_only=True)

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'phone_number', 'user_type', 'created_at'
        )
        read_only_fields = ('id', 'username', 'created_at')


# ===============================
# CHAUFFEURS
# ===============================

class DriverSerializer(serializers.ModelSerializer):
    """Serializer for drivers"""
    # ✅ Fix: vehicle_summary n'est pas un champ modèle, on le dérive de la méthode
    vehicle_summary = serializers.CharField(source='get_vehicle_summary', read_only=True)

    class Meta:
        model = Driver
        fields = (
            'id', 'name', 'phone_number', 'email', 'license_number',
            'vehicle_info', 'vehicle_summary', 'telegram_chat_id', 'created_at'
        )
        read_only_fields = ('id', 'created_at')


# ===============================
# RÉSERVATIONS – ESTIMATION
# ===============================

class BookingEstimateSerializer(serializers.Serializer):
    """
    Serializer pour l'estimation de prix.
    Les coords peuvent être optionnelles si la vue gère un fallback (géocodage).
    """
    pickup_address = serializers.CharField(max_length=255)
    destination_address = serializers.CharField(max_length=255)
    scheduled_time = serializers.DateTimeField()

    vehicle_type = serializers.ChoiceField(
        choices=['eco', 'berline', 'van', 'goldwing'],
        default='eco'
    )
    passengers = serializers.IntegerField(min_value=1, required=False, default=1)
    luggage_count = serializers.IntegerField(min_value=0, required=False, default=0)

    # Coordonnées (si fournies par le front)
    pickup_latitude = serializers.DecimalField(max_digits=10, decimal_places=8, required=False)
    pickup_longitude = serializers.DecimalField(max_digits=11, decimal_places=8, required=False)
    destination_latitude = serializers.DecimalField(max_digits=10, decimal_places=8, required=False)
    destination_longitude = serializers.DecimalField(max_digits=11, decimal_places=8, required=False)

    def validate(self, attrs):
        # Ici on n’impose pas les coordonnées — la vue peut géocoder ou refuser
        return attrs


# ===============================
# RÉSERVATIONS – CRÉATION (INVITÉ OU CONNECTÉ)
# ===============================

class BookingCreateSerializer(serializers.ModelSerializer):
    """
    Création de réservation (user connecté OU invité).
    On accepte et stocke: vehicle_type, passengers, luggage_count.
    Le prix estimé est calculé côté serveur au moment de la création.
    """
    # Champs “invité” (réservation sans compte)
    guest_name = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=120)
    guest_phone = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=32)
    guest_email = serializers.EmailField(required=False, allow_null=True)

    # Prix calculé côté serveur (pas d'écriture depuis le client)
    estimated_price = serializers.DecimalField(max_digits=8, decimal_places=2, read_only=True)

    class Meta:
        model = Booking
        fields = (
            'pickup_address', 'pickup_latitude', 'pickup_longitude',
            'destination_address', 'destination_latitude', 'destination_longitude',
            'scheduled_time',
            'vehicle_type', 'passengers', 'luggage_count',   # <-- stockés en DB
            'guest_name', 'guest_phone', 'guest_email',
            'estimated_price',  # read_only
        )

    def validate(self, attrs):
        request = self.context.get("request")
        is_auth = bool(getattr(request, "user", None) and request.user.is_authenticated)
        if not is_auth:
            missing = [k for k in ("guest_name", "guest_phone", "guest_email") if not attrs.get(k)]
            if missing:
                raise serializers.ValidationError({m: "Requis pour une réservation invité." for m in missing})
        # Valeurs par défaut si non transmises
        attrs.setdefault('vehicle_type', 'eco')
        attrs.setdefault('passengers', 1)
        attrs.setdefault('luggage_count', 0)
        return attrs

    def create(self, validated_data):
        """
        Calcule estimated_price via PricingService, attache user si connecté,
        et crée la réservation avec vehicle_type / passengers / luggage_count.
        """
        # Sortir les infos nécessaires au calcul
        vehicle_type = validated_data.get("vehicle_type", "eco")

        # Calcul du prix estimé (le service utilise les coords et le type de véhicule)
        est = PricingService.calculate_price(
            float(validated_data["pickup_latitude"]),
            float(validated_data["pickup_longitude"]),
            float(validated_data["destination_latitude"]),
            float(validated_data["destination_longitude"]),
            vehicle_type=vehicle_type,
            # Si ton service accepte ces paramètres, dé-commente :
            # passengers=validated_data.get("passengers", 1),
            # luggage_count=validated_data.get("luggage_count", 0),
        )
        validated_data["estimated_price"] = Decimal(str(est["estimated_price"]))

        # Attacher l’utilisateur si connecté (sinon None → invité)
        request = self.context.get("request")
        user = request.user if request and getattr(request.user, "is_authenticated", False) else None

        return Booking.objects.create(user=user, **validated_data)


class BookingSerializer(serializers.ModelSerializer):
    """Serializer pour l’affichage des réservations"""
    user = UserSerializer(read_only=True)
    driver = DriverSerializer(read_only=True)
    confirmation_number = serializers.CharField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    vehicle_type_display = serializers.CharField(source='get_vehicle_type_display', read_only=True)

    class Meta:
        model = Booking
        fields = (
            'id', 'confirmation_number', 'user', 'driver',
            'pickup_address', 'pickup_latitude', 'pickup_longitude',
            'destination_address', 'destination_latitude', 'destination_longitude',
            'scheduled_time',
            'vehicle_type', 'vehicle_type_display', 'passengers', 'luggage_count',
            'estimated_price', 'final_price', 'status', 'status_display',
            'created_at', 'completed_at'
        )
        read_only_fields = (
            'id', 'confirmation_number', 'user', 'driver', 'created_at', 'completed_at'
        )


class BookingUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ('status', 'driver', 'final_price')

    def validate_status(self, value):
        if self.instance:
            current_status = self.instance.status
            # Autoriser "Terminer" directement depuis les états non finaux
            allowed_transitions = {
                'PENDING': ['CONFIRMED', 'CANCELLED', 'COMPLETED'],        # ← ajouté COMPLETED
                'CONFIRMED': ['DRIVER_ASSIGNED', 'CANCELLED', 'COMPLETED'], # ← ajouté COMPLETED
                'DRIVER_ASSIGNED': ['IN_PROGRESS', 'CANCELLED', 'COMPLETED'], # ← ajouté COMPLETED
                'IN_PROGRESS': ['COMPLETED'],
                'COMPLETED': [],
                'CANCELLED': []
            }
            if value not in allowed_transitions.get(current_status, []):
                raise serializers.ValidationError(
                    f"Transition de {current_status} vers {value} non autorisée."
                )
        return value


# ===============================
# FACTURES
# ===============================

class InvoiceSerializer(serializers.ModelSerializer):
    """Serializer for invoices"""
    booking = BookingSerializer(read_only=True)

    class Meta:
        model = Invoice
        fields = (
            'id', 'booking', 'invoice_number', 'amount', 'tax_amount',
            'total_amount', 'status', 'generated_at', 'pdf_path'
        )
        read_only_fields = ('id', 'invoice_number', 'total_amount', 'generated_at')


# ===============================
# RÉPONSE ESTIMATION (facultatif)
# ===============================

class PriceEstimateResponseSerializer(serializers.Serializer):
    """Serializer for price estimation response"""
    estimated_price = serializers.DecimalField(max_digits=8, decimal_places=2)
    distance_km = serializers.FloatField()
    estimated_duration_minutes = serializers.IntegerField()
    pickup_coordinates = serializers.DictField()
    destination_coordinates = serializers.DictField()
    base_price = serializers.FloatField()
    distance_price = serializers.FloatField()
    time_price = serializers.FloatField()


# ===============================
# ADMIN – Réservations (inclut invités + champs fusion display_*)
# ===============================

class DriverMiniSerializer(serializers.ModelSerializer):
    # ✅ Fix: dériver depuis la méthode de modèle
    vehicle_summary = serializers.CharField(source='get_vehicle_summary', read_only=True)

    class Meta:
        model = Driver
        fields = ("id", "name", "phone_number", "email", "vehicle_info", "vehicle_summary")


class UserMiniSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='get_full_name', read_only=True)

    class Meta:
        model = User
        fields = ("id", "first_name", "last_name", "full_name", "email", "phone_number")


class AdminBookingSerializer(serializers.ModelSerializer):
    """
    Serializer admin pour les réservations affichées dans le dashboard.
    - Ajoute `price` unifié (final_price sinon estimated_price)
    - Fournit display_* (name/email/phone) pour le front
    """
    user   = UserMiniSerializer(read_only=True)
    driver = DriverMiniSerializer(read_only=True)

    display_name  = serializers.SerializerMethodField()
    display_email = serializers.SerializerMethodField()
    display_phone = serializers.SerializerMethodField()

    # ✅ Champ unifié pour le front
    price = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = (
            "id", "confirmation_number",
            "status", "created_at", "completed_at",
            "scheduled_time",
            "pickup_address", "destination_address",
            "estimated_price", "final_price", "price",  # <-- price ajouté
            "vehicle_type", "passengers", "luggage_count",
            "user", "driver",
            # champs invités
            "guest_name", "guest_email", "guest_phone",
            # champs fusion pour le front
            "display_name", "display_email", "display_phone",
        )

    def get_price(self, obj):
        # Préfère le prix final s'il existe, sinon l'estimé
        return getattr(obj, "final_price", None) or getattr(obj, "estimated_price", None)

    def get_display_name(self, obj):
        full = " ".join(filter(None, [
            getattr(getattr(obj, "user", None), "first_name", None),
            getattr(getattr(obj, "user", None), "last_name", None),
        ])).strip()
        return full or getattr(obj, "guest_name", None) or None

    def get_display_email(self, obj):
        return (
            getattr(getattr(obj, "user", None), "email", None)
            or getattr(obj, "guest_email", None)
            or None
        )

    def get_display_phone(self, obj):
        return (
            getattr(getattr(obj, "user", None), "phone_number", None)
            or getattr(obj, "guest_phone", None)
            or None
        )


# ===============================
# ADMIN / DASHBOARD
# ===============================

class AdminDashboardSerializer(serializers.Serializer):
    """Serializer for the admin dashboard"""
    total_bookings = serializers.IntegerField()
    pending_bookings = serializers.IntegerField()
    confirmed_bookings = serializers.IntegerField()
    driver_assigned_bookings = serializers.IntegerField()
    in_progress_bookings = serializers.IntegerField()
    completed_bookings = serializers.IntegerField()
    cancelled_bookings = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=10, decimal_places=2)
    average_price = serializers.DecimalField(max_digits=8, decimal_places=2)

    # ➜ expose explicitement la liste des réservations récentes
    recent_bookings = serializers.SerializerMethodField()

    def get_recent_bookings(self, obj):
        # obj est le dict construit dans AdminDashboardView
        bookings = obj.get("recent_bookings", [])
        # On sérialise avec le serializer admin déjà en place
        return AdminBookingSerializer(bookings, many=True).data


# ===============================
# ADMIN / DISPATCH
# ===============================

class DispatchSerializer(serializers.Serializer):
    """Serializer for dispatch actions"""
    booking_id = serializers.IntegerField()
    driver_id = serializers.IntegerField(required=False)
    action = serializers.ChoiceField(choices=['assign', 'broadcast'])

    def validate_booking_id(self, value):
        try:
            booking = Booking.objects.get(id=value)
            if not booking.can_be_cancelled():
                raise serializers.ValidationError("Cette réservation ne peut plus être modifiée.")
            return value
        except Booking.DoesNotExist:
            raise serializers.ValidationError("Réservation introuvable.")

    def validate_driver_id(self, value):
        if value:
            try:
                Driver.objects.get(id=value)
                return value
            except Driver.DoesNotExist:
                raise serializers.ValidationError("Chauffeur introuvable.")
        return value

    def validate(self, attrs):
        if attrs['action'] == 'assign' and not attrs.get('driver_id'):
            raise serializers.ValidationError("L'assignation nécessite un ID de chauffeur.")
        return attrs


class ContactSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=200)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=50)
    subject = serializers.CharField(max_length=200)
    reason = serializers.CharField(max_length=100, required=False, allow_blank=True)
    message = serializers.CharField()
    company = serializers.CharField(required=False, allow_blank=True)  # honeypot anti-spam
