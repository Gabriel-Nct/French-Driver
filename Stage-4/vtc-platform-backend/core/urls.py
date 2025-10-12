# core/urls.py
from django.urls import path
from django.conf import settings
from . import views_api
from rest_framework_simplejwt.views import TokenRefreshView
from .views_api import InvoiceDetailView
from .views_api import ContactView

urlpatterns = [
    # Toujours actifs
    path('health/', views_api.health_check, name='health_check'),

    # Auth (admin/driver)
    path('auth/login/', views_api.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # --- OUVERT À TOUS (guest) ---
    path('bookings/estimate/', views_api.BookingEstimateView.as_view(), name='booking_estimate'),
    path('bookings/create/', views_api.BookingCreateView.as_view(), name='booking_create'),

    # Admin / Dispatch / Drivers
    path('admin/dashboard/', views_api.AdminDashboardView.as_view(), name='admin_dashboard'),
    path('admin/bookings/<int:pk>/update/', views_api.AdminBookingUpdateView.as_view(), name='admin_booking_update'),
    path('admin/dispatch/', views_api.DispatchView.as_view(), name='dispatch'),

    path('drivers/', views_api.DriverListView.as_view(), name='driver_list'),
    path('drivers/create/', views_api.DriverCreateView.as_view(), name='driver_create'),

    # Telegram webhook
    path('telegram/webhook/', views_api.TelegramWebhookView.as_view(), name='telegram_webhook'),

    path('contact/', ContactView.as_view(), name='api-contact'),  # ← sans 'api/'
]

# --- Espace client (caché si flag False) ---
if getattr(settings, "CLIENT_PORTAL_ENABLED", True):
    urlpatterns += [
        path('auth/register/', views_api.UserRegistrationView.as_view(), name='user_registration'),
        path('auth/profile/', views_api.user_profile, name='user_profile'),

        path('bookings/<int:pk>/', views_api.BookingDetailView.as_view(), name='booking_detail'),
        path('bookings/user/<int:user_id>/', views_api.UserBookingsView.as_view(), name='user_bookings'),

        path('invoices/<int:booking_id>/', InvoiceDetailView.as_view(), name='invoice_detail'),
    ]
