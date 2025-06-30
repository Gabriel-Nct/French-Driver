# core/serializers.py
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from .models import User, Driver, Booking, Invoice
from .services import PricingService
from decimal import Decimal


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom Serializer for JWT Authentication"""

    def validate(self, attrs):
        data = super().validate(attrs)

        # Add user information to the token
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

        user = User.objects.create_user(
            password=password,
            **validated_data
        )
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


class DriverSerializer(serializers.ModelSerializer):
    """Serializer for drivers"""

    vehicle_summary = serializers.CharField(
        source='get_vehicle_summary', read_only=True
        )

    class Meta:
        model = Driver
        fields = (
            'id', 'name', 'phone_number', 'email', 'license_number',
            'vehicle_info', 'vehicle_summary', 'created_at'
        )
        read_only_fields = ('id', 'created_at')


class BookingEstimateSerializer(serializers.Serializer):
    """Serializer for price estimation"""

    pickup_address = serializers.CharField(max_length=255)
    destination_address = serializers.CharField(max_length=255)
    scheduled_time = serializers.DateTimeField()

    vehicle_type = serializers.ChoiceField(
        choices=['eco', 'berline', 'van', 'goldwing'], default='eco'
    )

    # Optional coordinates (will be calculated if not provided)
    pickup_latitude = serializers.DecimalField(
        max_digits=10, decimal_places=8, required=False
    )
    pickup_longitude = serializers.DecimalField(
        max_digits=11, decimal_places=8, required=False
    )
    destination_latitude = serializers.DecimalField(
        max_digits=10, decimal_places=8, required=False
    )
    destination_longitude = serializers.DecimalField(
        max_digits=11, decimal_places=8, required=False
    )

    def validate(self, attrs):
        # For now, we accept without GPS coordinates
        return attrs


class BookingCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating reservations"""

    class Meta:
        model = Booking
        fields = (
            'pickup_address', 'pickup_latitude', 'pickup_longitude',
            'destination_address',
            'destination_latitude', 'destination_longitude',
            'estimated_price', 'scheduled_time'
        )

    def create(self, validated_data):
        # Add logged in user
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class BookingSerializer(serializers.ModelSerializer):
    """Serializer for displaying reservations"""

    user = UserSerializer(read_only=True)
    driver = DriverSerializer(read_only=True)
    confirmation_number = serializers.CharField(read_only=True)
    status_display = serializers.CharField(
        source='get_status_display', read_only=True
        )

    class Meta:
        model = Booking
        fields = (
            'id', 'confirmation_number', 'user', 'driver',
            'pickup_address', 'pickup_latitude', 'pickup_longitude',
            'destination_address', 'destination_latitude',
            'destination_longitude',
            'estimated_price', 'final_price', 'status', 'status_display',
            'scheduled_time', 'created_at', 'completed_at'
        )
        read_only_fields = (
            'id', 'confirmation_number', 'user', 'created_at', 'completed_at'
        )


class BookingUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating reservations (Admin)"""

    class Meta:
        model = Booking
        fields = ('status', 'driver', 'final_price')

    def validate_status(self, value):
        """Validate authorized status transitions"""
        if self.instance:
            current_status = self.instance.status

            # Define allowed transitions
            allowed_transitions = {
                'PENDING': ['CONFIRMED', 'CANCELLED'],
                'CONFIRMED': ['DRIVER_ASSIGNED', 'CANCELLED'],
                'DRIVER_ASSIGNED': ['IN_PROGRESS', 'CANCELLED'],
                'IN_PROGRESS': ['COMPLETED'],
                'COMPLETED': [],
                'CANCELLED': []
            }

            if value not in allowed_transitions.get(current_status, []):
                raise serializers.ValidationError(
                    f"Transition de {current_status} vers {value} non autorisée."
                )

        return value


class InvoiceSerializer(serializers.ModelSerializer):
    """Serializer for invoices"""

    booking = BookingSerializer(read_only=True)

    class Meta:
        model = Invoice
        fields = (
            'id', 'booking', 'invoice_number', 'amount', 'tax_amount',
            'total_amount', 'status', 'generated_at', 'pdf_path'
        )
        read_only_fields = (
            'id', 'invoice_number', 'total_amount', 'generated_at'
        )


# Serializers for estimation responses
class PriceEstimateResponseSerializer(serializers.Serializer):
    """Serializer for price estimation response"""

    estimated_price = serializers.DecimalField(max_digits=8, decimal_places=2)
    distance_km = serializers.FloatField()
    estimated_duration_minutes = serializers.IntegerField()
    pickup_coordinates = serializers.DictField()
    destination_coordinates = serializers.DictField()

    # Calculation details
    base_price = serializers.FloatField()
    distance_price = serializers.FloatField()
    time_price = serializers.FloatField()


# Serializers for admin statistics
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

    # Recent bookings
    recent_bookings = BookingSerializer(many=True, read_only=True)


class DispatchSerializer(serializers.Serializer):
    """Serializer for dispatch actions"""

    booking_id = serializers.IntegerField()
    driver_id = serializers.IntegerField(required=False)
    action = serializers.ChoiceField(choices=['assign', 'broadcast'])

    def validate_booking_id(self, value):
        try:
            booking = Booking.objects.get(id=value)
            if not booking.can_be_cancelled():
                raise serializers.ValidationError(
                    "Cette réservation ne peut plus être modifiée."
                )
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
            raise serializers.ValidationError(
                "L'assignation nécessite un ID de chauffeur."
            )
        return attrs
