#!/bin/bash

# === CONFIGURATION ===
BRANCH="landing-page"
BUILD_DIR="dist"

echo "🚀 Déploiement de la landing page sur GitHub Pages..."

# 1. Vérifie que tu es bien sur la bonne branche
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
  echo "❌ Tu n'es pas sur la branche '$BRANCH'. Utilise : git switch $BRANCH"
  exit 1
fi

# 2. Nettoyage du dossier de déploiement (évite les vieux fichiers)
rm -rf $BUILD_DIR

# 3. Build du projet Vite
echo "📦 Compilation du projet Vite..."
npm run build || { echo "❌ Échec de la compilation Vite"; exit 1; }

# 4. Copie du contenu de dist/ à la racine
echo "📁 Copie des fichiers compilés dans la racine..."
cp -r dist/* ./

# 5. Commit + push
echo "📤 Commit et push..."
git add .
git commit -m "🚀 Déploiement GitHub Pages"
git push origin $BRANCH

echo "✅ Terminé ! Le site sera bientôt en ligne sur :"
echo "🌐 https://gabriel-nct.github.io/French-Driver/"
