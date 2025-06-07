from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from .models import User, Driver


class CustomUserCreationForm(UserCreationForm):
    """Formulaire de création d'utilisateur personnalisé"""

    class Meta:
        model = User
        fields = ('username', 'email', 'first_name','last_name', 'phone_number', 'user_type')


class CustomUserChangeForm(UserChangeForm):
    """Formulaire de modification d'utilisateur personnalisé"""

    class Meta:
        model = User
        fields = ('username', 'email', 'first_name', 'last_name', 'phone_number', 'user_type')


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Administration personnalisée pour le modèle User"""

    form = CustomUserChangeForm
    add_form = CustomUserCreationForm

    # Champs affichés dans la liste
    list_display = ('username', 'email', 'first_name', 'last_name', 'user_type', 'is_active', 'created_at')
    list_filter = ('user_type', 'is_active', 'is_staff', 'created_at')
    search_fields = ('username', 'email', 'first_name', 'last_name', 'phone_number')

    # Configuration des fieldsets pour l'édition
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Informations personnalisées', {
            'fields': ('phone_number', 'user_type', 'created_at', 'updated_at')
        }),
    )

    # Configuration des fieldsets pour l'ajout
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Informations personnalisées', {
            'fields': ('phone_number', 'user_type', 'first_name', 'last_name', 'email')
        }),
    )

    readonly_fields = ('created_at', 'updated_at')


@admin.register(Driver)
class DriverAdmin(admin.ModelAdmin):
    """Administration pour le modèle Driver"""

    list_display = ('name', 'email', 'phone_number', 'license_number', 'created_at')
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
