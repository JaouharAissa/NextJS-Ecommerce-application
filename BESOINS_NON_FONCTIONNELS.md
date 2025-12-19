# Besoins Non Fonctionnels du Projet (NFR)

Ce document décrit les exigences techniques et qualitatives qui ne concernent pas directement les fonctionnalités métiers, mais sont cruciales pour le bon fonctionnement, la sécurité et la pérennité de l'application.

## 1. 🔒 Sécurité (Priorité Haute)

*   **Confidentialité des Données** :
    *   Les mots de passe utilisateurs doivent être hachés (Bcrypt) avant stockage. Aucune donnée sensible ne doit être stockée en clair.
    *   Les communications doivent être cryptées (HTTPS implicite en production).
*   **Authentification et Autorisation** :
    *   Utilisation de tokens JWT (JSON Web Tokens) sécurisés et signés pour maintenir la session utilisateur sans état (stateless).
    *   Protection contre les attaques par force brute (pas explicitement codé, mais une bonne pratique à mentionner pour le déploiement).
    *   Contrôle d'accès strict (RBAC) : Seuls les administrateurs peuvent accéder au dashboard et supprimer des éléments.
*   **Sécurité des Paiements** :
    *   Aucune information bancaire (numéro de carte, CVC) ne doit transiter ou être stockée sur nos serveurs. Tout doit être délégué à un prestataire certifié PCI-DSS (Stripe).
*   **Validation des Entrées** :
    *   Protection contre les injections NoSQL via l'utilisation d'ORM (Mongoose) et la validation des types.
    *   Sanitization des entrées utilisateurs (commentaires, formulaires) pour prévenir les attaques XSS.

## 2. ⚡ Performance

*   **Temps de Réponse API** :
    *   L'analyse de sentiment (IA) doit se faire de manière quasi-instantanée (< 500ms visé) pour ne pas bloquer l'expérience utilisateur. L'utilisation de DistilBERT (modèle "distillé") répond à ce besoin.
*   **Chargement Front-end** :
    *   Le "First Contentful Paint" (FCP) doit être optimisé. Utilisation de Next.js pour le Server-Side Rendering (SSR) et l'optimisation automatique des images et polices.
    *   Les bundles JavaScript doivent être minifiés et divisés (Code Splitting) pour éviter de charger du code inutile.
*   **Optimisation Base de Données** :
    *   Utilisation d'index sur les champs fréquemment recherchés (`email`, `username`, `produitId`) pour garantir des recherches rapides même avec beaucoup de données.

## 3. 📈 Scalabilité

*   **Architecture Micro-services (Hybride)** :
    *   Le découplage entre le backend Next.js (application principale) et le service Python (IA) permet de faire évoluer chaque partie indépendamment. Si le trafic augmente sur l'IA, on peut scaler uniquement le service Python.
*   **Base de Données** :
    *   MongoDB est conçu pour la scalabilité horizontale (sharding) si le volume de données devient critique.
*   **Stateless** :
    *   L'architecture JWT permet d'ajouter facilement de nouveaux serveurs d'application sans problème de synchronisation de session.

## 4. 🛡️ Fiabilité et Disponibilité

*   **Gestion des Erreurs** :
    *   L'application doit gérer gracieusement les échecs (ex: si le service IA ne répond pas, le commentaire est quand même posté mais sans analyse, ou avec un message d'erreur clair).
    *   Pas de "White Screen of Death" : L'interface doit informer l'utilisateur en cas d'erreur réseau.
*   **Intégrité des Données** :
    *   Les transactions critiques (commandes) doivent garantir la cohérence des stocks et des paiements.

## 5. 🧩 Maintenabilité

*   **Qualité du Code** :
    *   Utilisation de **TypeScript** pour le typage statique, réduisant les bugs liés aux types et facilitant la compréhension du code.
    *   Architecture claire et modulaire (dossiers séparés pour `models`, `components`, `api`, `lib`).
*   **Documentation** :
    *   Le code doit être auto-explicatif et documenté là où la logique est complexe (comme fait dans `EXPLICATION_PROJET_COMPLETE.md`).

## 6. 📱 Utilisabilité et UX

*   **Responsive Design** :
    *   L'application doit être utilisable sur tous les terminaux (Mobile, Tablette, Desktop) grâce à TailwindCSS.
*   **Feedback Utilisateur** :
    *   Le système doit fournir un feedback visuel immédiat pour chaque action (chargement, succès, erreur).
