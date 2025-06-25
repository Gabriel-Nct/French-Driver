# core/telegram_service.py
import asyncio
import logging
from typing import Optional, Dict, Any
from telegram import Bot, Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application, CommandHandler, CallbackQueryHandler, MessageHandler, filters
)
from django.conf import settings
from asgiref.sync import sync_to_async
from .models import Driver, Booking

logger = logging.getLogger(__name__)


class TelegramBotService:
    """Service to manage interactions with Telegram"""

    def __init__(self):
        self.token = settings.TELEGRAM_BOT_TOKEN
        self.bot = Bot(token=self.token)
        self.application = None

    async def initialize_application(self):
        """Initializes the Telegram application"""
        if not self.application:
            self.application = Application.builder().token(self.token).build()

            # Add the handlers
            self.application.add_handler(CommandHandler("start", self.start_command))
            self.application.add_handler(CommandHandler("help", self.help_command))
            self.application.add_handler(CommandHandler("status", self.status_command))
            self.application.add_handler(CallbackQueryHandler(self.handle_booking_response, pattern="^booking_"))
            self.application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, self.handle_message))

    async def start_command(self, update: Update, context):
        """Commande /start"""
        chat_id = update.effective_chat.id
        username = update.effective_user.username

        welcome_message = f"""
🚖 *Bienvenue sur French Driver !*

Bonjour ! Je suis le bot officiel pour les chauffeurs VTC.

Pour recevoir des notifications de courses, vous devez être enregistré dans notre système avec votre Chat ID : `{chat_id}`

📋 *Commandes disponibles :*
/help - Afficher cette aide
/status - Vérifier votre statut

💡 *Comment ça marche :*
1. Votre dispatcher vous enregistre avec ce Chat ID
2. Vous recevez des notifications de nouvelles courses
3. Vous pouvez accepter ou refuser directement ici

❓ Pour toute question, contactez votre dispatcheur.
        """

        await update.message.reply_text(
            welcome_message,
            parse_mode='Markdown'
        )

        # Log for the dispatcher
        logger.info(f"Nouveau chauffeur Telegram: Chat ID {chat_id}, Username: @{username}")

    async def help_command(self, update: Update, context):
        """Commande /help"""
        help_message = """
🆘 *Aide French Driver Bot*

📋 *Commandes :*
/start - Démarrer et obtenir votre Chat ID
/help - Afficher cette aide
/status - Vérifier votre statut dans le système

🔔 *Notifications :*
- Vous recevez automatiquement les nouvelles courses
- Utilisez les boutons pour accepter/refuser
- Réponse rapide = plus de courses !

⚙️ *Configuration :*
Pour activer les notifications, donnez ce Chat ID à votre dispatcheur :
`{}`

📞 *Support :*
Contactez votre centrale pour tout problème technique.
        """.format(update.effective_chat.id)

        await update.message.reply_text(help_message, parse_mode='Markdown')

    async def status_command(self, update: Update, context):
        """Commande /status"""
        chat_id = str(update.effective_chat.id)

        try:
            # Search driver by chat_id
            driver = await sync_to_async(Driver.objects.get)(telegram_chat_id=chat_id)

            status_message = f"""
✅ *Statut : CONNECTÉ*

👤 *Informations :*
- Nom : {driver.name}
- Licence : {driver.license_number}
- Véhicule : {driver.get_vehicle_summary()}

🔔 *Notifications :*
- Statut : {'✅ Activées' if driver.notifications_enabled else '❌ Désactivées'}
- Chat ID : `{chat_id}`

📊 *Statistiques :*
- Courses totales : {await sync_to_async(driver.bookings.count)()}
- Courses en cours : {await sync_to_async(driver.bookings.filter(status__in=['DRIVER_ASSIGNED', 'IN_PROGRESS']).count)()}
            """

        except Driver.DoesNotExist:
            status_message = f"""
❌ *Statut : NON CONNECTÉ*

Votre Chat ID `{chat_id}` n'est pas enregistré dans notre système.

📝 *Pour vous connecter :*
1. Donnez ce Chat ID à votre dispatcheur
2. Il vous enregistrera dans le système
3. Vous recevrez une confirmation

💡 *Besoin d'aide ?*
Contactez votre centrale avec ce Chat ID.
            """

        await update.message.reply_text(status_message, parse_mode='Markdown')

    async def handle_message(self, update: Update, context):
        """Gérer les messages texte génériques"""
        await update.message.reply_text(
            "🤖 Utilisez les commandes /start, /help ou /status pour interagir avec le bot."
        )

    async def send_booking_notification(self, driver: Driver, booking: Booking) -> bool:
        """Envoie une notification de nouvelle course"""
        if not driver.can_receive_notifications():
            return False

        try:
            # Create the action buttons
            keyboard = [
                [
                    InlineKeyboardButton("✅ Accepter", callback_data=f"booking_accept_{booking.id}"),
                    InlineKeyboardButton("❌ Refuser", callback_data=f"booking_refuse_{booking.id}")
                ],
                [
                    InlineKeyboardButton("📍 Voir itinéraire", callback_data=f"booking_route_{booking.id}")
                ]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)

            # Notification message
            message = f"""
🚖 *NOUVELLE COURSE DISPONIBLE*

📍 *Départ :* {booking.pickup_address}
🎯 *Destination :* {booking.destination_address}
⏰ *Heure prévue :* {booking.scheduled_time.strftime('%d/%m/%Y à %H:%M')}
💰 *Prix estimé :* {booking.estimated_price}€

👤 *Client :* {booking.user.get_full_name() or booking.user.username}
📱 *Contact :* {booking.user.phone_number or 'Non renseigné'}

🔔 *Répondez rapidement pour augmenter vos chances !*
            """

            await self.bot.send_message(
                chat_id=driver.telegram_chat_id,
                text=message,
                parse_mode='Markdown',
                reply_markup=reply_markup
            )

            return True

        except Exception as e:
            logger.error(f"Erreur envoi notification Telegram à {driver.name}: {e}")
            return False

    async def handle_booking_response(self, update: Update, context):
        """Gérer les réponses aux notifications de courses"""
        query = update.callback_query
        await query.answer()

        data = query.data
        chat_id = str(query.effective_chat.id)

        try:
            # Check that the driver exists
            driver = await sync_to_async(Driver.objects.get)(telegram_chat_id=chat_id)

            if data.startswith("booking_accept_"):
                booking_id = int(data.split("_")[2])
                await self.handle_booking_accept(query, driver, booking_id)

            elif data.startswith("booking_refuse_"):
                booking_id = int(data.split("_")[2])
                await self.handle_booking_refuse(query, driver, booking_id)

            elif data.startswith("booking_route_"):
                booking_id = int(data.split("_")[2])
                await self.handle_route_request(query, driver, booking_id)

        except Driver.DoesNotExist:
            await query.edit_message_text(
                "❌ Erreur : Vous n'êtes pas enregistré dans le système."
            )
        except Exception as e:
            logger.error(f"Erreur traitement réponse Telegram: {e}")
            await query.edit_message_text(
                "❌ Erreur lors du traitement de votre réponse."
            )

    async def handle_booking_accept(self, query, driver: Driver, booking_id: int):
        """Gérer l'acceptation d'une course"""
        try:
            booking = await sync_to_async(Booking.objects.get)(id=booking_id)

            if booking.status != 'PENDING':
                await query.edit_message_text(
                    "❌ Cette course n'est plus disponible."
                )
                return

            # Assign the driver (this will be managed on the admin side)
            response_message = f"""
✅ *COURSE ACCEPTÉE*

Merci {driver.name} ! Votre acceptation a été transmise à la centrale.

📋 *Détails :*
- Course #{booking.confirmation_number}
- Départ : {booking.pickup_address}
- Destination : {booking.destination_address}
- Prix : {booking.estimated_price}€

⏳ *Prochaines étapes :*
1. La centrale va confirmer votre assignation
2. Vous recevrez les coordonnées client
3. Contactez le client si nécessaire

🚗 *Bonne course !*
            """

            await query.edit_message_text(response_message, parse_mode='Markdown')

            # Log for the dispatcher
            logger.info(f"Course {booking_id} acceptée par {driver.name} (Telegram)")

        except Booking.DoesNotExist:
            await query.edit_message_text("❌ Course introuvable.")

    async def handle_booking_refuse(self, query, driver: Driver, booking_id: int):
        """Gérer le refus d'une course"""
        await query.edit_message_text(
            f"❌ Course refusée par {driver.name}.\n\n"
            "La course reste disponible pour d'autres chauffeurs."
        )

        logger.info(f"Course {booking_id} refusée par {driver.name} (Telegram)")

    async def handle_route_request(self, query, driver: Driver, booking_id: int):
        """Gérer la demande d'itinéraire"""
        try:
            booking = await sync_to_async(Booking.objects.get)(id=booking_id)

            # Create a Google Maps link
            google_maps_url = (
                f"https://www.google.com/maps/dir/"
                f"{booking.pickup_latitude},{booking.pickup_longitude}/"
                f"{booking.destination_latitude},{booking.destination_longitude}"
            )

            route_message = f"""
🗺️ *ITINÉRAIRE*

📍 *Départ :* {booking.pickup_address}
🎯 *Destination :* {booking.destination_address}

🔗 [Ouvrir dans Google Maps]({google_maps_url})

💡 *Conseil :* Vérifiez le trafic avant d'accepter !
            """

            # Add the original action buttons
            keyboard = [
                [
                    InlineKeyboardButton("✅ Accepter", callback_data=f"booking_accept_{booking.id}"),
                    InlineKeyboardButton("❌ Refuser", callback_data=f"booking_refuse_{booking.id}")
                ]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)

            await query.edit_message_text(
                route_message,
                parse_mode='Markdown',
                reply_markup=reply_markup,
                disable_web_page_preview=True
            )

        except Booking.DoesNotExist:
            await query.edit_message_text("❌ Course introuvable.")


# Global instance of the service
telegram_service = TelegramBotService()
