

# 🚖 Plateforme VTC - Documentation du MVP

**Mise en relation clients-chauffeurs VTC**

---

## 📑 Sommaire

1. [Introduction et Vision du Projet](#1-introduction-et-vision-du-projet)

   * [1.1 Contexte](#11-contexte)
   * [1.2 Problématiques identifiées](#12-problématiques-identifiées)
   * [1.3 Vision du projet](#13-vision-du-projet)
2. [Définition du MVP (Minimum Viable Product)](#2-définition-du-mvp-minimum-viable-product)

   * [2.1 Objectifs du MVP](#21-objectifs-du-mvp)
   * [2.2 Cibles principales](#22-cibles-principales)
   * [2.3 Fonctionnalités essentielles du MVP](#23-fonctionnalités-essentielles-du-mvp)
3. [Idées considérées et processus décisionnel](#3-idées-considérées-et-processus-décisionnel)

   * [3.1 Options envisagées et évaluées](#31-options-envisagées-et-évaluées)
4. [Architecture technique du MVP](#4-architecture-technique-du-mvp)

   * [4.1 Vue d’ensemble du système](#41-vue-densemble-du-système)
   * [4.2 Flux de fonctionnement](#42-flux-de-fonctionnement)
5. [Processus de développement](#5-processus-de-développement)

   * [5.1 Méthodologie](#51-méthodologie)
   * [5.2 Équipe et rôles](#52-équipe-et-rôles)
   * [5.3 Outils de collaboration](#53-outils-de-collaboration)
6. [Fonctionnalités avancées](#6-fonctionnalités-avancées)

   * [6.1 Réservation client](#61-réservation-client)
   * [6.2 Centrale](#62-centrale)
   * [6.3 Backend administratif](#63-backend-administratif)
7. [Conclusion et prochaines étapes](#7-conclusion-et-prochaines-étapes)

   * [7.1 Synthèse du MVP](#71-synthèse-du-mvp)
   * [7.2 Impact potentiel](#72-impact-potentiel)

---



## 1. Introduction et Vision du Projet

### 1.1 Contexte

Le marché du transport de personnes est en pleine transformation digitale. Entre les applications existantes et les centrales traditionnelles, il existe un espace pour une solution intermédiaire offrant une expérience fluide aux clients tout en valorisant le travail des chauffeurs professionnels.

### 1.2 Problématiques identifiées

* **Trop d'intermédiaires** : les chauffeurs doivent souvent passer par des plateformes qui prennent des commissions élevées ou imposent des contraintes.
* **Manque de visibilité pour les chauffeurs indépendants** : difficile d'être trouvés sans centrale ou application dominante.
* **Perte de revenus** : commissions importantes = revenus moindres pour les chauffeurs.
* **Rigidité des centrales classiques** : peu d'outils numériques simples, peu de personnalisation, horaires restreints, etc.

### 1.3 Vision du projet

Développer une plateforme digitale qui :

* Permet aux clients de réserver facilement un VTC via un site web
* Relaie la demande côté admin pour trouver un chauffeur disponible
* Utilise notre propre réseau de chauffeurs et canaux de communication pour assurer le service
* Confirme la réservation au client une fois le chauffeur assigné
* Simplifie le processus de réservation tout en garantissant un service de qualité

---

## 2. Définition du MVP (Minimum Viable Product)

### 2.1 Objectifs du MVP

* Créer un système fonctionnel de réservation de VTC via site web
* Développer une API capable de gérer les demandes et de les transmettre aux chauffeurs
* Établir un réseau initial de chauffeurs partenaires
* Valider le modèle de fonctionnement de bout en bout
* Obtenir les premiers retours clients pour itérer rapidement

### 2.2 Cibles principales

* **Cible prioritaire 1** : Clients recherchant un service de VTC fiable et transparent
* **Cible prioritaire 2** : Chauffeurs VTC professionnels cherchant à augmenter leur volume d'activité
* **Cible prioritaire 3** : Entreprises ayant des besoins réguliers de transport professionnel

### 2.3 Fonctionnalités essentielles du MVP

#### Pour les clients :

* Interface web de réservation simple et intuitive
* Saisie de l'adresse de départ et d'arrivée
* Estimation du prix avant validation
* Confirmation de la réservation par email/SMS
* Système de suivi de la commande
* Option de paiement en ligne sécurisé *(optionnel)*
* Historique des courses et facturation

#### Pour la centrale :

* Réception et traitement des demandes clients
* Calcul d'itinéraire et estimation tarifaire
* Système de mise en relation avec les chauffeurs via différents canaux (SMS, application dédiée, etc.)
* Gestion des confirmations et refus
* Suivi en temps réel des courses en cours
* Interface d'administration pour l'équipe opérationnelle
* Tableau de bord analytique pour suivre l'activité

---

## 3. Idées considérées et processus décisionnel

### 3.1 Options envisagées et évaluées

#### Option 1 : Plateforme exclusivement B2B

**Forces :**

* Focus client clair
* Modèle économique plus prévisible
* Cycle de vente plus long mais plus rentable
* Volume de courses régulier

**Faiblesses :**

* Marché potentiellement plus restreint
* Dépendance à quelques gros clients
* Nécessite une force commerciale dédiée

**Raison du rejet partiel** : Limitation du potentiel de croissance. Option retenue partiellement pour le MVP avec focus sur clients professionnels, mais sans exclure l'expansion future.

---

#### Option 2 : Système de gestion pour les VTC sans interface client

**Forces :**

* Développement plus simple
* Focus sur l'amélioration de l'expérience chauffeur
* Complémentaire aux outils existants

**Faiblesses :**

* Ne résout pas le problème des intermédiaires
* Valeur ajoutée limitée
* Difficulté à générer des revenus significatifs

**Raison du rejet** : Ne répond pas à l'objectif principal de mise en relation directe et de réduction des intermédiaires.

---

#### Option 3 : Plateforme hybride (**retenue pour le MVP**)

**Forces :**

* Commence avec une architecture extensible
* Modèle économique viable dès le départ
* Adaptation progressive aux besoins du marché

**Faiblesses :**

* Complexité moyenne de développement
* Nécessite une double approche commerciale (chauffeurs, entreprises et particuliers)

**Raison de la sélection** : Meilleur compromis entre faisabilité immédiate et potentiel de croissance, aligné avec les ressources disponibles.

---

## 4. Architecture technique du MVP

### 4.1 Vue d’ensemble du système

* **Frontend client** : Site web responsive de réservation
* **API** : Cœur du système gérant la logique métier
* **Système de dispatch** : Module de communication avec les chauffeurs
* **Backend administratif** : Interface de gestion pour l’équipe opérationnelle
* **Base de données** : Stockage des utilisateurs, courses, chauffeurs, etc.

### 4.2 Flux de fonctionnement

1. Le client effectue une demande de course sur le site web
2. L'API centrale reçoit la demande et la traite (validation, calcul d’itinéraire, tarification)
3. Le système via les admins recherche un chauffeur disponible via les canaux définis
4. Le chauffeur reçoit la proposition et accepte/refuse
5. En cas d'acceptation, le client reçoit une confirmation
6. Le chauffeur effectue la course
7. Le système enregistre la fin de course et gère le paiement *(optionnel)*
8. Le client peut évaluer l’expérience

---

## 5. Processus de développement

### 5.1 Méthodologie

* Développement Agile avec méthodologie **Kanban** sur GitHub
* Daily standup via **Slack**/**Discord**

### 5.2 Équipe et rôles

* **Développeur Frontend** : Brahim Haddad et Gabriel Bescond
* **Développeur Backend** : Gabriel Bescond et Brahim Haddad

### 5.3 Outils de collaboration

* **Slack** pour la communication quotidienne
* **Discord** pour les réunions virtuelles
* **Trello** et méthode **Kanban sur GitHub** pour le suivi des tâches

---

## 6. Fonctionnalités avancées

### 6.1 Réservation client

* Géolocalisation automatique pour départ
* Estimation du temps d’attente
* Paiement intégré ou à la course

### 6.2 Centrale

* Système de mise en file d’attente des demandes
* Gestion des timeouts et relances
* API documentée pour intégrations futures

### 6.3 Backend administratif

* Gestion manuelle des cas particuliers
* Suivi des performances (taux d’acceptation, délais moyens)
* Rapports d’activité et analytiques

---

## 7. Conclusion et prochaines étapes

### 7.1 Synthèse du MVP

Cette plateforme VTC se distingue par son approche qui va mettre en relation des clients et des chauffeurs VTC. Le MVP se concentre sur les fonctionnalités essentielles pour valider le concept : réservation client simple, dispatching efficace vers les chauffeurs via différents canaux, et suivi complet de la course. L’architecture technique modulaire permettra une évolution progressive du système.

### 7.2 Impact potentiel

* **Pour les clients** : Service de qualité avec transparence des prix et fiabilité
* **Pour les chauffeurs** : Source additionnelle de revenus avec moins d’intermédiaires
* **Pour l’écosystème** : Alternative équitable dans le marché du transport à la demande

Ce MVP constitue la première étape d’une vision plus large visant à transformer l’expérience du transport VTC, en proposant une plateforme qui valorise à la fois les chauffeurs professionnels et la qualité de service pour les clients.

---
