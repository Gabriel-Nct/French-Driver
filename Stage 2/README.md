# Plateforme de mise en relation clients-chauffeurs VTC

## 1. Introduction et Vision du Projet

### 1.1 Contexte
Le marché du transport de personnes est en pleine transformation digitale. Entre les applications existantes et les centrales traditionnelles, il existe un espace pour une solution intermédiaire offrant une expérience fluide aux clients tout en valorisant le travail des chauffeurs professionnels.

### 1.2 Problématiques identifiées
- Trop d'intermédiaires : les chauffeurs doivent souvent passer par des plateformes qui prennent des commissions élevées ou imposent des contraintes
- Manque de visibilité pour les chauffeurs indépendants : difficile d'être trouvés sans centrale ou application dominante
- Perte de revenus : commissions importantes = revenus moindres pour les chauffeurs
- Rigidité des centrales classiques : peu d'outils numériques simples, peu de personnalisation, horaires restreints, etc.

### 1.3 Vision du projet
Développer une plateforme digitale qui :
•	Permet aux clients de réserver facilement un VTC via un site web
•	Relaie la demande côté admin qui nous permet de trouver un chauffeur disponible
•	Utilise notre propre réseau de chauffeurs et canaux de communication pour assurer le service
•	Confirme la réservation au client une fois le chauffeur assigné
•	Simplifie le processus de réservation tout en garantissant un service de qualité

## 2. Project Charter

### 2.1 Objectifs du Projet

#### 2.1.1 But du projet
Développer une plateforme digitale qui met en relation directe les clients et les chauffeurs VTC, offrant une alternative équitable aux grandes plateformes existantes avec une réservation simple côté client et des revenus améliorés côté chauffeurs.

#### 2.1.2 Objectifs SMART 

| N° | Objectif (Quoi ?) | Indicateur (Comment ?) | Cible (Combien ?) | Échéance |
|:---:|:---|:---|:---|:---|
| **1** | Livrer un MVP fonctionnel et testé (toutes features critiques « In-Scope » opérationnelles) | Taux de complétion des stories critiques | **100 %** | **18 juillet 2025** |
| **2** | Garantir une expérience utilisateur fluide lors des tests internes | Score moyen de satisfaction sur questionnaires UX (panel interne de testeurs) | **≥ 4 / 5** | **Semaine du 15 juillet 2025** |
| **3** | Valider la mise en relation bout-en-bout sur environnement privé | Nombre de scénarios de réservation simulés aboutissant à une course confirmée | **≥ 10 scénarios avec ≥ 90 % de réussite** | **Semaine du 15 juillet 2025** |
| **4** | Constituer un réseau pilote de chauffeurs VTC (via notre réseau privé) | Chauffeurs partenaires inscrits et disponibles dans la plateforme de test | **≥ 10 chauffeurs** | **10 juillet 2025** |

### 2.2 Parties Prenantes et Rôles

| **Catégorie** | **Acteur** | **Rôle / Responsabilité** |
|:---:|:---|:---|
| **Interne** | Gabriel | Chef de projet/ Scrum Master – planning, coordination, suivi Kanban |
| | Brahim | Product Owner – priorisation backlog, relations utilisateurs |
| | Gabriel | Développement back-end, API |
| | Brahim | Développement Front-end/UX, test |
| **Externe** | Chauffeurs VTC indépendants | Fournisseurs du service |
| | Clients (particuliers & entreprises) | Utilisateurs finaux ; feedback sur l'expérience utilisateur |
| | Partenaires techniques (cartographie, service mail) | Services tiers essentiels au MVP |

### 2.3 Portée du Projet

#### 2.3.1 Dans la portée (In-Scope)
•	Interface web responsive de réservation (authentification, adresses, estimation de prix)
•	Notifications et suivi par email
•	Back-office de dispatch (réception, tarification, attribution des chauffeurs)
•	Tableau de bord analytique basique (volume, taux d'acceptation)
•	Historique des courses et génération de factures PDF

#### 2.3.2 Hors portée (Out-of-Scope)
•	Application mobile native (iOS/Android)
•	Paiement en ligne intégré
•	Programme de fidélité
•	Intelligence artificielle
•	Intégrations tierces étendues (ERP, CRM...)
•	Notifications et suivi par SMS

### 2.4 Risques et Stratégies d'Atténuation

| **Risque** | **Impact** | **Probabilité** | **Stratégie d'atténuation** |
|:---|:---:|:---:|:---|
| Retard technique sur les fonctionnalités clés | MVP incomplet à la date de livraison | **Moyen** | Découper en petites tâches ; revue hebdomadaire ; gel des spécifications 4 semaines avant la livraison |
| Difficulté à recruter des chauffeurs pour les tests | Test insuffisant → expérience client non validée | **Moyen-élevé** | Approche personnalisée ; réseau de contacts ; incitations pour la phase de test |
| Absence de budget dédié | Limitation des services SaaS utilisables | **Moyen** | Exploiter les versions gratuites |
| Problème de compatibilité navigateur / mobile | Utilisateurs bloqués sur certains appareils | **Moyen** | Tests sur navigateurs principaux + responsive checker ; correctifs rapides CSS |
| Charge serveur inattendue lors des tests | Instabilité de la plateforme | **Faible** | Utiliser un hébergement scalable + monitoring simple |

### 2.5 Plan de Haut Niveau

| **Semaine** | **Phase & Jalons** | **Livrables** |
|:---|:---|:---|
| **Semaine 20** (17-21 mai) | Kick-off & Charte | Charte de projet validée, backlog initial |
| **Semaines 21-22** | Conception détaillée | Wireframes, schéma de base de données |
| **Semaines 23-25** | Développement API + Frontend minimal | Système d'authentification, création de course, estimation de prix |
| **Semaine 26** | Intégration dispatch | Système d'acceptation/refus + suivi |
| **Semaine 27** | Tableau de bord & historiques | MVP end-to-end |
| **Semaine 28** | Tests alpha internes | Correction des bugs majeurs & optimisation UX |
| **Semaine 29** (10-17 juillet) | Beta fermée | Intégration du feedback |
| **18 juillet** | Demo Day | Démonstration publique + documentation finale |

## 3. Définition du MVP 

### 3.1 Objectifs du MVP
•	Créer un système fonctionnel de réservation de VTC via site web
•	Développer une API capable de gérer les demandes et de les transmettre aux chauffeurs
•	Établir un réseau initial de chauffeurs partenaires
•	Valider le modèle de fonctionnement de bout en bout
•	Obtenir les premiers retours clients pour itérer rapidement

### 3.2 Cibles principales
•	Cible prioritaire 1 : Clients recherchant un service de VTC fiable et transparent
•	Cible prioritaire 2 : Chauffeurs VTC professionnels cherchant à augmenter leur volume d'activité
•	Cible prioritaire 3 : Entreprises ayant des besoins réguliers de transport professionnel

### 3.3 Fonctionnalités essentielles du MVP

**Pour les clients :**
•	Interface web de réservation simple et intuitive
•	Saisie de l'adresse de départ et d'arrivée
•	Estimation du prix avant validation
•	Confirmation de la réservation par email
•	Système de suivi de la commande
•	Historique des courses et facturation

**Pour la centrale :**
•	Réception et traitement des demandes clients
•	Calcul d'itinéraire et estimation tarifaire
•	Système de mise en relation avec les chauffeurs via différents canaux 
•	Gestion des confirmations et refus
•	Suivi en temps réel des courses en cours
•	Interface d'administration pour l'équipe opérationnelle
•	Tableau de bord analytique pour suivre l'activité

## 4. Idées considérées et processus décisionnel

### 4.1 Options envisagées et évaluées

**Option 1 : Plateforme exclusivement B2B**

Forces :
•	Focus client clair
•	Modèle économique plus prévisible
•	Cycle de vente plus long mais plus rentable
•	Volume de courses régulier

Faiblesses :
•	Marché potentiellement plus restreint
•	Dépendance à quelques gros clients
•	Nécessite une force commerciale dédiée

Raison du rejet partiel : Limitation du potentiel de croissance. Option retenue partiellement pour le MVP avec focus sur clients professionnels, mais sans exclure l'expansion future.

**Option 2 : Système de gestion pour les VTC sans interface client**

Forces :
•	Développement plus simple
•	Focus sur l'amélioration de l'expérience chauffeur
•	Complémentaire aux outils existants

Faiblesses :
•	Ne résout pas le problème des intermédiaires
•	Valeur ajoutée limitée
•	Difficulté à générer des revenus significatifs

Raison du rejet : Ne répond pas à l'objectif principal de mise en relation directe et de réduction des intermédiaires.

**Option 3 : Plateforme hybride (retenue pour le MVP)**

Forces :
•	Commence avec une architecture extensible
•	Modèle économique viable dès le départ
•	Adaptation progressive aux besoins du marché

Faiblesses :
•	Complexité moyenne de développement
•	Nécessite une double approche commerciale (chauffeurs, entreprises et particuliers)

Raison de la sélection : Meilleur compromis entre faisabilité immédiate et potentiel de croissance, aligné avec les ressources disponibles.

## 5. Architecture technique du MVP

### 5.1 Vue d'ensemble du système
•	Frontend client : Site web responsive de réservation
•	API : Cœur du système gérant la logique métier
•	Système de dispatch : Module de communication avec les chauffeurs
•	Backend administratif : Interface de gestion pour l'équipe opérationnelle
•	Base de données : Stockage des utilisateurs, courses, chauffeurs, etc.

### 5.2 Flux de fonctionnement
1.	Le client effectue une demande de course sur le site web
2.	L'API centrale reçoit la demande et la traite (validation, calcul d'itinéraire, tarification)
3.	Le système via les admin afin de dispatch recherche un chauffeur disponible via les canaux définis
4.	Le chauffeur reçoit la proposition et accepte/refuse
5.	En cas d'acceptation, le client reçoit une confirmation
6.	Le chauffeur effectue la course
7.	Le système enregistre la fin de course et gère le paiement (optionnel)
8.	Le client peut évaluer l'expérience

## 6. Processus de développement

### 6.1 Méthodologie
•	Développement Agile avec méthodologie Kanban sur GitHub
•	Daily standup via Slack/Discord

### 6.2 Équipe et rôles
•	Développeur Frontend : Brahim Haddad 
•	Développeur Backend : Gabriel Bescond 

### 6.3 Outils de collaboration
•	Slack pour la communication quotidienne
•	Discord pour les réunions virtuelles
•	Trello et méthode Kanban sur GitHub pour le suivi des tâches

## 7. Fonctionnalités avancées

### 7.1 Réservation client
•	Géolocalisation automatique pour départ
•	Estimation du temps d'attente
•	Paiement intégré ou à la course

### 7.2 Centrale
•	Système de mise en file d'attente des demandes
•	Gestion des timeouts et relances
•	API documentée pour intégrations futures

### 7.3 Backend administratif
•	Gestion manuelle des cas particuliers
•	Suivi des performances (taux d'acceptation, délais moyens)
•	Rapports d'activité et analytiques

## 8. Conclusion et prochaines étapes

### 8.1 Synthèse du MVP
Cette plateforme VTC se distingue par son approche qui va mettre en relation des clients et des chauffeurs VTC. Le MVP se concentre sur les fonctionnalités essentielles pour valider le concept : réservation client simple, dispatching efficace vers les chauffeurs via différents canaux, et suivi complet de la course. L'architecture technique modulaire permettra une évolution progressive du système.

### 8.2 Impact potentiel
•	Pour les clients : Service de qualité avec transparence des prix et fiabilité
•	Pour les chauffeurs : Source additionnelle de revenus avec moins d'intermédiaires
•	Pour l'écosystème : Alternative équitable dans le marché du transport à la demande

Ce MVP constitue la première étape d'une vision plus large visant à transformer l'expérience du transport VTC, en proposant une plateforme qui valorise à la fois les chauffeurs professionnels et la qualité de service pour les clients.