# test_mysql_connection.py
import os
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vtc_platform.settings')
django.setup()

from django.db import connection
from django.core.management import execute_from_command_line
from core.models import User, Driver, Booking

def test_mysql_connection():
    print("=== Test de connexion MySQL ===")
    
    try:
        # Test de connexion
        with connection.cursor() as cursor:
            cursor.execute("SELECT VERSION()")
            version = cursor.fetchone()
            print(f"✓ Connexion MySQL réussie")
            print(f"✓ Version MySQL: {version[0]}")
        
        # Test des modèles
        print(f"\n=== Test des modèles ===")
        print(f"✓ Nombre d'utilisateurs: {User.objects.count()}")
        print(f"✓ Nombre de chauffeurs: {Driver.objects.count()}")
        print(f"✓ Nombre de réservations: {Booking.objects.count()}")
        
        # Test de création
        print(f"\n=== Test de création ===")
        user, created = User.objects.get_or_create(
            username='test_mysql',
            defaults={
                'email': 'test_mysql@vtc.fr',
                'first_name': 'Test',
                'last_name': 'MySQL',
                'user_type': 'CLIENT'
            }
        )
        
        if created:
            user.set_password('testpass123')
            user.save()
            print(f"✓ Utilisateur créé: {user}")
        else:
            print(f"✓ Utilisateur existant: {user}")
        
        # Informations sur la base
        print(f"\n=== Informations base de données ===")
        with connection.cursor() as cursor:
            cursor.execute("SELECT DATABASE()")
            db_name = cursor.fetchone()
            print(f"✓ Base de données: {db_name[0]}")
            
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
            print(f"✓ Nombre de tables: {len(tables)}")
            print(f"✓ Tables: {[table[0] for table in tables]}")
        
        print(f"\n=== Migration MySQL réussie ! ===")
        
    except Exception as e:
        print(f"✗ Erreur: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    test_mysql_connection()
