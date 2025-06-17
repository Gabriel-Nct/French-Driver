# test_models.py

import os
import django
from core.models import User, Driver

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vtc_platform.settings')
django.setup()


def test_models():
    print("=== Test des modèles ===")

    # Test 1: Création d'un utilisateur client
    print("\n1. Création d'un utilisateur client...")
    client = User.objects.create_user(
        username='client_test',
        email='client@test.fr',
        password='testpass123',
        first_name='Jean',
        last_name='Dupont',
        phone_number='+33123456789',
        user_type='CLIENT'
    )
    print(f"✓ Client créé: {client}")
    print(f"  - Nom complet: {client.get_full_name()}")
    print(f"  - Est client: {client.is_client()}")
    print(f"  - Est admin: {client.is_admin_user()}")

    # Test 2: Création d'un utilisateur admin
    print("\n2. Création d'un utilisateur admin...")
    admin = User.objects.create_user(
        username='admin_test',
        email='admin@test.fr',
        password='testpass123',
        first_name='Marie',
        last_name='Martin',
        phone_number='+33987654321',
        user_type='ADMIN'
    )
    print(f"✓ Admin créé: {admin}")
    print(f"  - Est client: {admin.is_client()}")
    print(f"  - Est admin: {admin.is_admin_user()}")

    # Test 3: Création d'un chauffeur
    print("\n3. Création d'un chauffeur...")
    driver = Driver.objects.create(
        name='Pierre Moreau',
        phone_number='+33456789123',
        email='pierre.moreau@vtc.fr',
        license_number='VTC123456789',
        vehicle_info='Mercedes Classe E - Noire - AB-123-CD'
    )
    print(f"✓ Chauffeur créé: {driver}")
    print(f"  - Téléphone: {driver.display_phone}")
    print(f"  - Véhicule: {driver.get_vehicle_summary()}")

    # Test 4: Vérification des contraintes d'unicité
    print("\n4. Test des contraintes d'unicité...")
    try:
        # Essayer de créer un chauffeur avec le même email
        Driver.objects.create(
            name='Test Duplicate',
            phone_number='+33111111111',
            email='pierre.moreau@vtc.fr',  # Email déjà utilisé
            license_number='VTC999999999',
            vehicle_info='Test vehicle'
        )
        print("✗ Erreur: La contrainte d'unicité n'a pas fonctionné")
    except Exception as e:
        print(f"✓ Contrainte d'unicité respectée: {type(e).__name__}")

    # Test 5: Affichage des statistiques
    print("\n5. Statistiques...")
    print(f"  - Nombre total d'utilisateurs: {User.objects.count()}")
    print(f"  - Nombre de clients: {User.objects.filter(user_type='CLIENT').count()}")
    print(f"  - Nombre d'admins: {User.objects.filter(user_type='ADMIN').count()}")
    print(f"  - Nombre de chauffeurs: {Driver.objects.count()}")

    print("\n=== Tests terminés avec succès ! ===")


if __name__ == '__main__':
    test_models()
