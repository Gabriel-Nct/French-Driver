# start_telegram_bot.py
import os
import django
import asyncio
import logging

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vtc_platform.settings')
django.setup()

from core.telegram_service import telegram_service

# Configuration des logs
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

async def main():
    """Démarre le bot en mode polling pour les tests"""
    try:
        print("🔄 Initialisation du bot Telegram...")
        await telegram_service.initialize_application()
        
        print("🚀 Bot Telegram démarré en mode polling...")
        print(f"📱 Nom du bot: French Driver (@french_driverbot)")
        print("✅ Le bot est maintenant en ligne !")
        print("\n" + "="*50)
        print("📋 TESTE MAINTENANT SUR TELEGRAM :")
        print("1. Cherche @french_driverbot")
        print("2. Envoie /start")
        print("3. Tu devrais recevoir ton Chat ID")
        print("="*50 + "\n")
        
        # Démarre le polling
        await telegram_service.application.initialize()
        await telegram_service.application.start()
        await telegram_service.application.updater.start_polling()
        
        print("⏳ Bot en attente de messages... (Ctrl+C pour arrêter)")
        
        try:
            # Garde le bot en vie
            await asyncio.Event().wait()
        except KeyboardInterrupt:
            print("\n🛑 Arrêt du bot demandé...")
        
    except Exception as e:
        print(f"❌ Erreur lors du démarrage : {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        print("🔄 Nettoyage...")
        try:
            await telegram_service.application.stop()
            print("✅ Bot arrêté proprement")
        except:
            pass

if __name__ == '__main__':
    asyncio.run(main())