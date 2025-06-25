from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator
from decimal import Decimal
from django.utils import timezone


class User(AbstractUser):
    """
    Extended User Model for the VTC platform
    Inherits from AbstractUser to keep all basic functionality
    """

    USER_TYPE_CHOICES = [
        ('CLIENT', 'Client'),
        ('ADMIN', 'Administrateur'),
    ]

    # Phone number validation (French/international format)
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Le numéro de téléphone doit être au format: '+999999999'."
        " 9 à 15 chiffres autorisés."
    )

    # Additional fields
    phone_number = models.CharField(
        validators=[phone_regex],
        max_length=17,
        blank=True,
        default='',
        help_text="Numéro de téléphone au format international"
    )

    user_type = models.CharField(
        max_length=10,
        choices=USER_TYPE_CHOICES,
        default='CLIENT',
        help_text="Type d'utilisateur"
    )

    # Automatic timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'

    def __str__(self):
        return f"{self.username} ({self.get_user_type_display()})"

    def get_full_name(self):
        """Returns the user's full name"""
        return f"{self.first_name} {self.last_name}".strip()

    def is_client(self):
        """Checks if the user is a client"""
        return self.user_type == 'CLIENT'

    def is_admin_user(self):
        """Checks if the user is an administrator"""
        return self.user_type == 'ADMIN'


class Driver(models.Model):
    """
    Driver Model for VTC drivers
    """

    name = models.CharField(
        max_length=100,
        help_text="Nom complet du chauffeur"
    )

    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Le numéro de téléphone doit être au format: '+999999999'."
        " 9 à 15 chiffres autorisés."
    )

    phone_number = models.CharField(
        validators=[phone_regex],
        max_length=17,
        unique=True,
        default='',
        help_text="Numéro de téléphone unique du chauffeur"
    )

    email = models.EmailField(
        unique=True,
        help_text="Adresse email unique du chauffeur"
    )

    license_number = models.CharField(
        max_length=50,
        unique=True,
        help_text="Numéro de licence VTC unique"
    )

    vehicle_info = models.TextField(
        help_text="Informations sur le véhicule (marque, modèle, plaque, etc.)"
    )

    telegram_chat_id = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Chat ID Telegram du chauffeur pour les notifications"
    )

    telegram_username = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Username Telegram du chauffeur (optionnel)"
    )

    # Notification settings
    notifications_enabled = models.BooleanField(
        default=True,
        help_text="Le chauffeur souhaite-t-il recevoir des notifications ?"
    )

    # Creation timestamp
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'drivers'
        verbose_name = 'Chauffeur'
        verbose_name_plural = 'Chauffeurs'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} - {self.license_number}"

    @property
    def display_phone(self):
        """Displays the phone number in a formatted manner"""
        return self.phone_number

    def get_vehicle_summary(self):
        """Returns a vehicle summary (first 50 characters)"""
        if len(self.vehicle_info) > 50:
            return self.vehicle_info[:50] + "..."
        else:
            return self.vehicle_info

    def has_telegram(self):
        """Check if the driver has configured Telegram"""
        return bool(self.telegram_chat_id)

    def can_receive_notifications(self):
        """Check if the driver can receive notifications"""
        return self.notifications_enabled and self.has_telegram()


class Booking(models.Model):
    """
    Booking template for VTC reservations
    """

    BOOKING_STATUS_CHOICES = [
        ('PENDING', 'En attente'),
        ('CONFIRMED', 'Confirmée'),
        ('DRIVER_ASSIGNED', 'Chauffeur assigné'),
        ('IN_PROGRESS', 'En cours'),
        ('COMPLETED', 'Terminée'),
        ('CANCELLED', 'Annulée'),
    ]

    # Relationships
    user = models.ForeignKey(
        'User',
        on_delete=models.CASCADE,
        related_name='bookings',
        help_text="Client qui a fait la réservation"
    )

    driver = models.ForeignKey(
        'Driver',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='bookings',
        help_text="Chauffeur assigné à la course"
    )

    # Departure addresses and coordinates
    pickup_address = models.CharField(
        max_length=255,
        help_text="Adresse de départ"
    )

    pickup_latitude = models.DecimalField(
        max_digits=10,
        decimal_places=8,
        help_text="Latitude du point de départ"
    )

    pickup_longitude = models.DecimalField(
        max_digits=11,
        decimal_places=8,
        help_text="Longitude du point de départ"
    )

    # Destination addresses and coordinates
    destination_address = models.CharField(
        max_length=255,
        help_text="Adresse de destination"
    )

    destination_latitude = models.DecimalField(
        max_digits=10,
        decimal_places=8,
        help_text="Latitude du point de destination"
    )

    destination_longitude = models.DecimalField(
        max_digits=11,
        decimal_places=8,
        help_text="Longitude du point de destination"
    )

    # Prices and pricing
    estimated_price = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        help_text="Prix estimé de la course"
    )

    final_price = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Prix final facturé."
        " Pour l'instant égal à l'estimated_price."
    )

    # Status and planning
    status = models.CharField(
        max_length=20,
        choices=BOOKING_STATUS_CHOICES,
        default='PENDING',
        help_text="Statut actuel de la réservation"
    )

    scheduled_time = models.DateTimeField(
        help_text="Heure prévue pour la course"
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Heure de fin de course"
    )

    class Meta:
        db_table = 'bookings'
        verbose_name = 'Réservation'
        verbose_name_plural = 'Réservations'
        ordering = ['-created_at']

    def __str__(self):
        return f"Réservation #{self.id} - {self.user.username} - {self.get_status_display()}"

    def save(self, *args, **kwargs):
        """Override save to set final_price if not set"""
        if self.final_price is None:
            self.final_price = self.estimated_price
        super().save(*args, **kwargs)

    @property
    def confirmation_number(self):
        """Generates a unique confirmation number"""
        return f"VTC{self.id:06d}"

    def assign_driver(self, driver):
        """Assign a driver to the reservation"""
        self.driver = driver
        self.status = 'DRIVER_ASSIGNED'
        self.save()

    def start_trip(self):
        """Start the race"""
        if self.status == 'DRIVER_ASSIGNED':
            self.status = 'IN_PROGRESS'
            self.save()

    def complete_trip(self, final_price=None):
        """Finish the race"""
        if self.status == 'IN_PROGRESS':
            self.status = 'COMPLETED'
            self.completed_at = timezone.now()
            if final_price:
                self.final_price = final_price
            self.save()

    def cancel(self):
        """Cancel the reservation"""
        if self.status in ['PENDING', 'CONFIRMED', 'DRIVER_ASSIGNED']:
            self.status = 'CANCELLED'
            self.save()

    def get_distance_display(self):
        """
        Calculates and displays distance
        (to be implemented with the calculation service)
        """
        # Placeholder - sera implémenté avec PricingService
        return "À calculer"

    def is_active(self):
        """Check if the reservation is active"""
        return self.status in [
            'PENDING', 'CONFIRMED',
            'DRIVER_ASSIGNED', 'IN_PROGRESS'
            ]

    def can_be_cancelled(self):
        """Check if the reservation can be cancelled"""
        return self.status in ['PENDING', 'CONFIRMED', 'DRIVER_ASSIGNED']


class Invoice(models.Model):
    """
    Invoice template for invoices
    """

    INVOICE_STATUS_CHOICES = [
        ('GENERATED', 'Générée'),
        ('SENT', 'Envoyée'),
        ('PAID', 'Payée'),
    ]

    booking = models.OneToOneField(
        'Booking',
        on_delete=models.CASCADE,
        related_name='invoice',
        help_text="Réservation associée à cette facture"
    )

    invoice_number = models.CharField(
        max_length=50,
        unique=True,
        help_text="Numéro de facture unique"
    )

    amount = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        help_text="Montant HT de la facture"
    )

    tax_amount = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Montant de la TVA"
    )

    total_amount = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        help_text="Montant TTC de la facture"
    )

    status = models.CharField(
        max_length=20,
        choices=INVOICE_STATUS_CHOICES,
        default='GENERATED',
        help_text="Statut de la facture"
    )

    generated_at = models.DateTimeField(auto_now_add=True)

    pdf_path = models.CharField(
        max_length=255,
        blank=True,
        help_text="Chemin vers le fichier PDF de la facture"
    )

    class Meta:
        db_table = 'invoices'
        verbose_name = 'Facture'
        verbose_name_plural = 'Factures'
        ordering = ['-generated_at']

    def __str__(self):
        return f"Facture {self.invoice_number} - {self.total_amount}€"

    def save(self, *args, **kwargs):
        """
        Override save to generate invoice number and calculate total
        """
        if not self.invoice_number:
            # Generate a unique invoice number
            year = timezone.now().year
            month = timezone.now().month
            count = Invoice.objects.filter(
                generated_at__year=year,
                generated_at__month=month
            ).count() + 1
            self.invoice_number = f"VTC-{year}-{month:02d}-{count:04d}"

        # Calculate the total amount
        self.total_amount = self.amount + self.tax_amount

        super().save(*args, **kwargs)
