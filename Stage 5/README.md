# French Driver - Landing Page

Landing page moderne et responsive pour French Driver, une plateforme révolutionnaire de transport français.

## Prérequis

Avant de commencer, assurez-vous d'avoir installé :

-   **Node.js** 
-   **npm** 

## Installation et lancement

### 1. Cloner le projet

```bash
git clone https://github.com/Gabriel-Nct/French-Driver.git
cd French-Driver
```

### 2. Accéder à la landing page

```bash
git checkout docs
cd "Stage 5"
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Lancer le serveur de développement

```bash
npm run dev
```

### 4. Ouvrir dans le navigateur

Le site sera accessible à l'adresse : **http://localhost:5173**

## Fonctionnalités

-    **Design moderne** avec animations fluides
-    **Responsive** sur tous les appareils
-    **Galerie d'images** avec lightbox interactive
-    **Optimisé** pour les performances

## Technologies utilisées

-   **React 18** + TypeScript
-   **Vite** pour le build rapide
-   **Tailwind CSS** pour le styling
-   **ESLint** pour la qualité du code

## Structure du projet

```
src/
├── components/
│   ├── Header.tsx      # Navigation principale
│   ├── Hero.tsx        # Section d'accueil
│   ├── Features.tsx    # Fonctionnalités avec lightbox
│   ├── About.tsx       # À propos de l'équipe
│   └── Footer.tsx      # Pied de page
├── App.tsx             # Composant principal
└── main.tsx            # Point d'entrée
```

## Gestion des images

Pour ajouter vos propres images :

1.  Placez-les dans le dossier `public/images/`
2.  Modifiez les chemins dans `Features.tsx` :
    
    ```typescript
    image: '/images/votre-image.png'
    ```
    

## Sections de la landing page

### **Hero**

-   Titre principal avec animation
-   Boutons d'action (CTA)
-   Effet de défilement animé

### **Features**

-   3 fonctionnalités principales
-   Images cliquables avec lightbox
-   Descriptions détaillées

### **About**

-   Présentation de l'équipe
-   Liens LinkedIn
-   Lien vers le code source

### **Footer**
-   Copyright

## Scripts disponibles

```bash
npm run dev          # Serveur de développement
npm run build        # Build de production
npm run preview      # Prévisualiser le build
npm run lint         # Vérifier le code
```


## Équipe

-   **Gabriel Bescond** - Développeur Full-Stack
-   **Brahim** - Développeur Full-Stack

## Licence

Projet réalisé dans le cadre de la formation **Holberton School**.

----------
