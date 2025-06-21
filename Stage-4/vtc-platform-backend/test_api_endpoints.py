# test_api_endpoints.py
import os
import django
import requests
import json

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vtc_platform.settings')
django.setup()

BASE_URL = 'http://localhost:8000/api'


def test_endpoints():
    print("=== Test des endpoints API ===")

    # Test 1: Health check (sans authentification)
    print("\n1. Test du health check...")
    response = requests.get(f"{BASE_URL}/health/")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")

    # Test 2: Inscription d'un utilisateur
    print("\n2. Test d'inscription...")
    registration_data = {
        "username": "testapi",
        "email": "testapi@vtc.fr",
        "password": "testpass123",
        "password_confirm": "testpass123",
        "first_name": "Test",
        "last_name": "API",
        "phone_number": "+33123456789",
        "user_type": "CLIENT"
    }

    response = requests.post(
        f"{BASE_URL}/auth/register/",
        json=registration_data
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")

    # Test 3: Connexion
    print("\n3. Test de connexion...")
    login_data = {
        "username": "testapi",
        "password": "testpass123"
    }

    response = requests.post(
        f"{BASE_URL}/auth/login/",
        json=login_data
    )
    print(f"Status: {response.status_code}")

    if response.status_code == 200:
        tokens = response.json()
        access_token = tokens['access']
        print("✓ Connexion réussie")

        # Headers pour les requêtes authentifiées
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }

        # Test 4: Profil utilisateur
        print("\n4. Test du profil utilisateur...")
        response = requests.get(
            f"{BASE_URL}/auth/profile/",
            headers=headers
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")

        # Test 5: Estimation de prix
        print("\n5. Test d'estimation de prix...")
        estimate_data = {
            "pickup_address": "Place de la République, Paris",
            "destination_address": "Aéroport Charles de Gaulle",
            "scheduled_time": "2025-06-10T14:00:00Z",
            "pickup_latitude": 48.8566,
            "pickup_longitude": 2.3522,
            "destination_latitude": 49.0097,
            "destination_longitude": 2.5479
        }

        response = requests.post(
            f"{BASE_URL}/bookings/estimate/",
            json=estimate_data,
            headers=headers
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")

        # Test 6: Création de réservation
        print("\n6. Test de création de réservation...")
        if response.status_code == 200:
            estimate_result = response.json()['data']

            booking_data = {
                "pickup_address": "Place de la République, Paris",
                "pickup_latitude": 48.8566,
                "pickup_longitude": 2.3522,
                "destination_address": "Aéroport Charles de Gaulle",
                "destination_latitude": 49.0097,
                "destination_longitude": 2.5479,
                "estimated_price": estimate_result['estimated_price'],
                "scheduled_time": "2025-06-10T14:00:00Z"
            }

            response = requests.post(
                f"{BASE_URL}/bookings/create/",
                json=booking_data,
                headers=headers
            )
            print(f"Status: {response.status_code}")
            print(f"Response: {response.json()}")

            # Test 7: Récupération des détails de réservation
            if response.status_code == 201:
                booking_id = response.json()['data']['booking_id']

                print(
                    f"\n7. Test de récup de réservation #{booking_id}..."
                    )
                response = requests.get(
                    f"{BASE_URL}/bookings/{booking_id}/",
                    headers=headers
                )
                print(f"Status: {response.status_code}")
                print(f"Response: {response.json()}")

        # Test 8: Historique des réservations utilisateur
        print("\n8. Test de l'historique des réservations...")
        # Récupérer l'ID utilisateur depuis le profil
        profile_response = requests.get(
            f"{BASE_URL}/auth/profile/",
            headers=headers
            )
        if profile_response.status_code == 200:
            user_id = profile_response.json()['data']['id']

            response = requests.get(
                f"{BASE_URL}/bookings/user/{user_id}/",
                headers=headers
            )
            print(f"Status: {response.status_code}")
            print(f"Response: {response.json()}")

    else:
        print("✗ Échec de la connexion")


if __name__ == '__main__':
    test_endpoints()
