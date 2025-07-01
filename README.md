# French Driver - Plateforme VTC

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://python.org) [![Django](https://img.shields.io/badge/Django-4.2+-green.svg)](https://djangoproject.com) [![React](https://img.shields.io/badge/React-18+-61dafb.svg)](https://reactjs.org) [![Node.js](https://img.shields.io/badge/Node.js-16+-339933.svg)](https://nodejs.org)

Plateforme VTC complète permettant la réservation de courses, la gestion des chauffeurs et l'administration centralisée.

## Installation rapide

### Prérequis

-   **Python 3** avec pip
-   **Node.js** avec npm
-   **MySQL** 
-   **Git**

### Cloner le projet

```bash
git clone https://github.com/Gabriel-Nct/French-Driver.git
cd French-Driver
git checkout develop
cd Stage-4
```

## 🔧 Configuration Backend (Django)

### 1. Accéder au dossier backend

```bash
cd vtc-platform-backend
```

### 2. Créer un environnement virtuel

```bash
# Créer l'environnement virtuel
python -m venv venv

# Activer l'environnement
# Windows :
venv\Scripts\activate
# macOS/Linux :
source venv/bin/activate
```

### 3. Installer les dépendances

```bash
pip install -r requirements.txt
```

### 4. Configuration de la base de données

**Option A : MySQL (recommandé)**

```sql
-- Se connecter à MySQL
mysql -u root -p

-- Créer la base de données
CREATE DATABASE vtc_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'vtc_user'@'localhost' IDENTIFIED BY 'vtc_password_secure';
GRANT ALL PRIVILEGES ON vtc_platform.* TO 'vtc_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

```

### 5. Configurer le fichier .env

Créer un fichier `.env` dans le dossier `vtc-platform-backend` :

```env
# .env
SECRET_KEY=your-very-secret-key-here-change-this-in-production
DEBUG=True

# Configuration Email (Gmail/Google Workspace)
EMAIL_HOST_USER=bookfrenchdriver@gmail.com
EMAIL_HOST_PASSWORD=vzvewfzwbpdiipki

# Configuration Base de données MySQL
DB_NAME=vtc_platform
DB_USER=vtc_user
DB_PASSWORD=vtc_password_secure
DB_HOST=localhost
DB_PORT=3306

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=7998528268:AAE8jz_4Z3k6nTY9gc9UItFWKdQFWMvITNA
TELEGRAM_WEBHOOK_URL=https://votre-domaine.com/api/telegram/webhook/
TELEGRAM_WEBHOOK_SECRET=french_driver_webhook_secret_2025

# Ton Chat ID pour les tests
TELEGRAM_DEBUG_CHAT_ID=5931054589

```

### 6. Appliquer les migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 7. Créer un superutilisateur (optionnel)

```bash
python manage.py createsuperuser
```

### 8. Lancer le serveur backend

```bash
python manage.py runserver
```
 **Backend disponible sur** : http://localhost:8000

##  Configuration Frontend (React)

### 1. Ouvrir un nouveau terminal et accéder au dossier frontend

```bash
cd vtc-platform-frontend
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer les variables d'environnement (optionnel)

Créer un fichier `.env.local` dans le dossier `vtc-platform-frontend` :

```env
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_TELEGRAM_BOT_NAME=french_driver_bot
```

### 4. Lancer le serveur frontend

```bash
npm run dev
```

 **Frontend disponible sur** : http://localhost:3000

##  Vérification de l'installation

### URLs principales

-   **Frontend** : [http://localhost:3000](http://localhost:3000)
-   **Backend API** : [http://localhost:8000/api/](http://localhost:8000/api/)
-   **Documentation API** : [http://localhost:8000/api/docs/](http://localhost:8000/api/docs/)
-   **Admin Django** : [http://localhost:8000/admin/](http://localhost:8000/admin/)

### Pages frontend de test

-   **Page d'accueil** : [http://localhost:3000/](http://localhost:3000/)
-   **Connexion client** : [http://localhost:3000/login](http://localhost:3000/login)
-   **Inscription** : [http://localhost:3000/register](http://localhost:3000/register)
-   **Connexion admin** : [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
-   **Dashboard admin** : [http://localhost:3000/admin/dashboard](http://localhost:3000/admin/dashboard)
-   **Page client** : [http://localhost:3000/customer/1](http://localhost:3000/customer/1) 



##  Configuration Telegram (optionnel)

### 1. Créer un bot Telegram

1.  Contacter @BotFather sur Telegram
2.  Utiliser `/newbot` et suivre les instructions
3.  Copier le token dans `TELEGRAM_BOT_TOKEN`

### 2. Obtenir votre Chat ID

1.  Envoyer un message à votre bot
2.  Visiter : `https://api.telegram.org/bot<TOKEN>/getUpdates`
3.  Copier le `chat.id` dans `TELEGRAM_DEBUG_CHAT_ID`

## 🛠️ Commandes utiles

### Backend (Django)

```bash
# Créer une nouvelle migration
python manage.py makemigrations

# Appliquer les migrations
python manage.py migrate

# Collecter les fichiers statiques (production)
python manage.py collectstatic

# Lancer le shell Django
python manage.py shell
```

### Frontend (React)

```bash
# Installer une nouvelle dépendance
npm install nom-du-package

# Lancer les tests
npm test

# Build pour la production
npm run build

# Analyser le bundle
npm run analyze
```

##  Dépannage

### Problèmes courants

**1. Erreur de connexion à la base de données**

```bash
# Vérifier que MySQL est démarré
sudo systemctl status mysql
```

**2. Port déjà utilisé**

```bash
# Backend sur un autre port
python manage.py runserver 8001

# Frontend sur un autre port
npm run dev -- --port 3001
```

**3. Problème d'importation Python**

```bash
# Vérifier que l'environnement virtuel est activé
which python
# Réinstaller les dépendances
pip install -r requirements.txt --force-reinstall
```

**4. Erreur CORS Frontend → Backend**

```bash
# Vérifier que django-cors-headers est installé
pip install django-cors-headers
```

##  Structure du projet

```
french-driver/
├── vtc-platform-backend/     # API Django
│   ├── vtc_platform/         # Configuration projet
│   ├── core/                 # Applications Django
│   ├── requirements.txt      # Dépendances Python
│   ├── manage.py            # Script de gestion Django
│   └── .env                 # Variables d'environnement
├── vtc-platform-frontend/    # Interface React
│   ├── src/                 # Code source React
│   ├── public/              # Fichiers statiques
│   ├── package.json         # Dépendances Node.js
│   └── .env.local           # Variables d'environnement
└── README.md
```


##  API Documentation

La documentation interactive de l'API est disponible à l'adresse :

-   **Swagger UI** : http://localhost:8000/api/docs/
