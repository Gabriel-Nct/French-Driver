from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator


class User(AbstractUser):
    """
    Modèle User étendu pour la plateforme VTC
    Hérite d'AbstractUser pour garder toutes les fonctionnalités de base
    """

    USER_TYPE_CHOICES = [
        ('CLIENT', 'Client'),
        ('ADMIN', 'Administrateur'),
    ]

    # Validation du numéro de téléphone (format français/international)
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Le numéro de téléphone doit être au format: '+999999999'. 9 à 15 chiffres autorisés."
    )

    # Champs additionnels
    phone_number = models.CharField(
        validators=[phone_regex],
        max_length=17,
        blank=True,
        help_text="Numéro de téléphone au format international"
    )

    user_type = models.CharField(
        max_length=10,
        choices=USER_TYPE_CHOICES,
        default='CLIENT',
        help_text="Type d'utilisateur"
    )

    # Timestamps automatiques
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'

    def __str__(self):
        return f"{self.username} ({self.get_user_type_display()})"

    def get_full_name(self):
        """Retourne le nom complet de l'utilisateur"""
        return f"{self.first_name} {self.last_name}".strip()

    def is_client(self):
        """Vérifie si l'utilisateur est un client"""
        return self.user_type == 'CLIENT'

    def is_admin_user(self):
        """Vérifie si l'utilisateur est un administrateur"""
        return self.user_type == 'ADMIN'


class Driver(models.Model):
    """
    Modèle Driver pour les chauffeurs VTC
    """

    name = models.CharField(
        max_length=100,
        help_text="Nom complet du chauffeur"
    )

    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Le numéro de téléphone doit être au format: '+999999999'. 9 à 15 chiffres autorisés."
    )

    phone_number = models.CharField(
        validators=[phone_regex],
        max_length=17,
        unique=True,
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

    # Timestamp de création
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
        """Affiche le numéro de téléphone de manière formatée"""
        return self.phone_number

    def get_vehicle_summary(self):
        """Retourne un résumé du véhicule (premiers 50 caractères)"""
        if len(self.vehicle_info) > 50:
            return self.vehicle_info[:50] + "..."
        else:
            return self.vehicle_info
