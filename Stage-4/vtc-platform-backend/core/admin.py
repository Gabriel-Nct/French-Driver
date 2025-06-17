from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from .models import User, Driver, Booking, Invoice


class CustomUserCreationForm(UserCreationForm):
    """Formulaire de création d'utilisateur personnalisé"""

    class Meta:
        model = User
        fields = (
            'username', 'email', 'first_name',
            'last_name', 'phone_number', 'user_type'
            )


class CustomUserChangeForm(UserChangeForm):
    """Formulaire de modification d'utilisateur personnalisé"""

    class Meta:
        model = User
        fields = (
            'username', 'email', 'first_name',
            'last_name', 'phone_number', 'user_type'
            )


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Administration personnalisée pour le modèle User"""

    form = CustomUserChangeForm
    add_form = CustomUserCreationForm

    # Champs affichés dans la liste
    list_display = (
        'username', 'email', 'first_name', 'last_name',
        'user_type', 'is_active', 'created_at'
        )
    list_filter = ('user_type', 'is_active', 'is_staff', 'created_at')
    search_fields = (
        'username', 'email', 'first_name',
        'last_name', 'phone_number'
        )

    # Configuration des fieldsets pour l'édition
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Informations personnalisées', {
            'fields': ('phone_number', 'user_type', 'created_at', 'updated_at')
        }),
    )

    # Configuration des fieldsets pour l'ajout
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Informations personnalisées', {
            'fields': (
                'phone_number', 'user_type',
                'first_name', 'last_name', 'email'
                )
        }),
    )

    readonly_fields = ('created_at', 'updated_at')


@admin.register(Driver)
class DriverAdmin(admin.ModelAdmin):
    """Administration pour le modèle Driver"""

    list_display = (
        'name', 'email', 'phone_number',
        'license_number', 'created_at'
        )
    list_filter = ('created_at',)
    search_fields = ('name', 'email', 'phone_number', 'license_number')
    readonly_fields = ('created_at',)

    fieldsets = (
        ('Informations personnelles', {
            'fields': ('name', 'email', 'phone_number')
        }),
        ('Informations professionnelles', {
            'fields': ('license_number', 'vehicle_info')
        }),
        ('Métadonnées', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )

    def get_vehicle_summary(self, obj):
        """Affiche un résumé du véhicule dans l'admin"""
        return obj.get_vehicle_summary()
    get_vehicle_summary.short_description = 'Véhicule (résumé)'


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    """Administration pour le modèle Booking"""

    list_display = (
        'id', 'confirmation_number', 'user', 'driver', 'status',
        'pickup_address', 'destination_address', 'estimated_price',
        'scheduled_time', 'created_at'
    )

    list_filter = ('status', 'created_at', 'scheduled_time')
    search_fields = (
        'user__username', 'user__email', 'driver__name',
        'pickup_address', 'destination_address'
    )

    readonly_fields = ('confirmation_number', 'created_at', 'completed_at')

    fieldsets = (
        ('Informations générales', {
            'fields': ('user', 'driver', 'status', 'confirmation_number')
        }),
        ('Trajets', {
            'fields': (
                'pickup_address', 'pickup_latitude', 'pickup_longitude',
                'destination_address', 'destination_latitude',
                'destination_longitude'
            )
        }),
        ('Tarification', {
            'fields': ('estimated_price', 'final_price')
        }),
        ('Planning', {
            'fields': ('scheduled_time', 'created_at', 'completed_at')
        }),
    )

    def get_queryset(self, request):
        """Optimise les requêtes avec select_related"""
        return super().get_queryset(request).select_related('user', 'driver')


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    """Administration pour le modèle Invoice"""

    list_display = (
        'invoice_number', 'booking', 'amount', 'tax_amount',
        'total_amount', 'status', 'generated_at'
    )

    list_filter = ('status', 'generated_at')
    search_fields = ('invoice_number', 'booking__user__username')

    readonly_fields = ('invoice_number', 'total_amount', 'generated_at')

    fieldsets = (
        ('Informations générales', {
            'fields': ('booking', 'invoice_number', 'status')
        }),
        ('Montants', {
            'fields': ('amount', 'tax_amount', 'total_amount')
        }),
        ('Métadonnées', {
            'fields': ('generated_at', 'pdf_path')
        }),
    )
