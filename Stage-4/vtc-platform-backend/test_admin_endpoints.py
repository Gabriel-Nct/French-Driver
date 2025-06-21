# test_admin_endpoints.py
import requests
import json

BASE_URL = 'http://localhost:8000/api'


def test_admin_endpoints():
    print("=== Test des endpoints Admin ===")

    # Test 1: Créer un utilisateur admin via l'API d'inscription
    print("\n1. Création d'un utilisateur admin...")
    admin_registration = {
        "username": "admin_api_test",
        "email": "admin_api_test@vtc.fr",
        "password": "adminpass123",
        "password_confirm": "adminpass123",
        "first_name": "Admin",
        "last_name": "API",
        "phone_number": "+33987654321",
        "user_type": "ADMIN"
    }

    response = requests.post(
        f"{BASE_URL}/auth/register/",
        json=admin_registration
    )

    if response.status_code == 201:
        print("✓ Utilisateur admin créé via API")
    else:
        print(f"Info: {response.status_code} - {response.json()}")

    # Test 2: Connexion admin
    print("\n2. Test de connexion admin...")
    login_data = {
        "username": "admin_api_test",
        "password": "adminpass123"
    }

    response = requests.post(
        f"{BASE_URL}/auth/login/",
        json=login_data
    )

    if response.status_code == 200:
        tokens = response.json()
        access_token = tokens['access']
        print("✓ Connexion admin réussie")

        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }

        # Test 3: Dashboard admin
        print("\n3. Test du dashboard admin...")
        response = requests.get(
            f"{BASE_URL}/admin/dashboard/",
            headers=headers
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            dashboard_data = response.json()['data']
            print(
                f"✓ Réservations totales: {dashboard_data['total_bookings']}"
                )
            print(f"✓ Revenus totaux: {dashboard_data['total_revenue']}€")
        else:
            print(f"Response: {response.json()}")

        # Test 4: Liste des chauffeurs
        print("\n4. Test de la liste des chauffeurs...")
        response = requests.get(
            f"{BASE_URL}/drivers/",
            headers=headers
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            drivers_data = response.json()
            if 'results' in drivers_data:
                print(
                    f"✓ Nombre de chauffeurs: {len(drivers_data['results'])}"
                    )
            else:
                print(f"✓ Nombre de chauffeurs: {len(drivers_data)}")
        else:
            print(f"Response: {response.json()}")

        # Test 5: Création d'un chauffeur
        print("\n5. Test de création de chauffeur...")
        driver_data = {
            "name": "Test Driver API",
            "phone_number": "+33987654322",
            "email": "driver.api.test@vtc.fr",
            "license_number": "API123456790",
            "vehicle_info": "Test Vehicle API - XY-789-AB"
        }

        response = requests.post(
            f"{BASE_URL}/drivers/create/",
            json=driver_data,
            headers=headers
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 201:
            print(f"✓ Chauffeur créé: {response.json()}")
        else:
            print(f"Response: {response.json()}")

        print("\n=== Tests admin terminés ===")

    else:
        print("✗ Échec de la connexion admin")
        print(f"Response: {response.json()}")


if __name__ == '__main__':
    test_admin_endpoints()
