# Explication Détaillée du Projet

Ce document contient les réponses détaillées à vos questions techniques concernant l'architecture, la sécurité, l'intelligence artificielle et la base de données de l'application.

---

## 🤖 Intelligence Artificielle et Modèle (DistilBERT)

### Fonctionnement du modèle et intégration
Le modèle utilisé est **DistilBERT** (`distilbert-base-uncased-finetuned-sst-2-english`), une version plus légère et rapide de BERT, affinée ("fine-tuned") sur le dataset SST-2 pour l'analyse de sentiment.

1.  **Architecture** : Le backend Next.js ne fait pas tourner le modèle directement. Il communique via HTTP avec un micro-service Python (FastAPI) dédié.
2.  **Flux de données** :
    *   Le frontend envoie le commentaire à l'API Next.js (`/api/commentaires`).
    *   L'API Next.js transmet le texte au service Python (`http://127.0.0.1:4000/analyze`).
    *   Python tokenise le texte, le passe dans DistilBERT, et retourne un score de probabilité (logits) converti en sentiment (positif/négatif).

### Pourquoi DistilBERT ?
**Performance vs Précision** : DistilBERT conserve environ 97% des performances de BERT tout en étant 40% plus léger et 60% plus rapide. C'est idéal pour un environnement web où le temps de réponse est critique pour l'expérience utilisateur.

### Gestion du sentiment "Neutre"
Le modèle SST-2 est binaire (Positif/Négatif). Pour gérer le neutre, nous avons implémenté deux mécanismes :
1.  **Heuristique de Confiance (IA)** : Si le score de confiance du modèle est inférieur à **0.6** (60%), nous considérons que l'avis est mitigé et le classons comme "Neutre".
2.  **Règle Métier (Business Rule)** : Indépendamment du texte, si l'utilisateur met une note de **3/5 étoiles**, le sentiment est forcé à "Neutre" dans le code backend, car 3 étoiles représente une satisfaction moyenne.

### Rôle de l'IA
Le rôle principal est d'analyser automatiquement les avis clients pour :
*   Donner un feedback instantané sur la perception du produit.
*   Calculer le "score moyen" de sentiment d'un produit (stocké et mis à jour en base).
*   Aider les administrateurs à filtrer les avis négatifs potentiels.

---

## 🛠 Frontend et Optimisation

### Gestion des états (State Management)
L'application utilise principalement les fonctionnalités natives de **React 19** et **Next.js 15** :
*   **Local State** : `useState` pour les interactions simples (formulaires, toggles).
*   **Server Components** : Pour récupérer les données directement sur le serveur, réduisant ainsi le JavaScript envoyé au client.
*   **URL State** : Pour les filtres et la recherche (via `searchParams`), ce qui rend les liens partageables.

### Optimisation de la performance
*   **Next.js TurboPack** : Utilisation du nouveau bundler pour des builds rapides.
*   **CSS Optimisé** : TailwindCSS 4 permet de ne générer que le CSS utilisé.
*   **Lazy Loading** : Les images et composants lourds sont chargés uniquement lorsque nécessaires.
*   **Fonts** : Utilisation de `next/font` pour optimiser le chargement des polices et éviter le layout shift (CLS).

---

## 🔒 Sécurité et Authentification

### Authentification
*   **JWT (JSON Web Tokens)** : Les sessions sont gérées via des tokens signés. Le token contient l'ID utilisateur et son rôle, permettant au backend de valider les requêtes sans interroger la base à chaque fois pour l'identité (stateless).
*   **Salles de Hachage** : Les mots de passe sont hachés avec **Bcrypt** avant d'être stockés. On ne stocke jamais les mots de passe en clair.

### Protection de l'API et Données
*   **Validation côté Backend** : L'API vérifie systématiquement que les champs requis sont présents et valides (ex: note entre 1 et 5) avant de traiter la requête.
*   **Authorization Headers** : Les routes protégées vérifient la présence et la validité du token `Bearer` dans les headers.
*   **Role-Based Access Control (RBAC)** : Certaines routes (ex: suppressions) vérifient spécifiquement si `role === 'admin'`.

---

## 💾 Base de Données (MongoDB)

### Pourquoi MongoDB ?
MongoDB a été choisi pour sa **flexibilité (NoSQL)**. Dans un projet e-commerce évolutif, la structure des produits ou des avis peut changer (nouveaux champs). MongoDB permet d'adapter le schéma sans migrations lourdes SQL.

### Structure des Données
Nous utilisons **Mongoose** pour définir des schémas stricts et valider les données :
*   **Users** : Contient username, email, password (hash), role, et le panier (`cart`) imbriqué directement.
*   **Produits** : Info produit + `score_moyen` (calculé).
*   **Commentaires** : Lien vers User et Produit, contient le texte, la note, et le résultat de l'analyse sentiment.
*   **Commandes** : Historique des achats.

### Relations vs Imbrication
*   **Panier (Imbrication)** : Le panier est stocké *dans* le document User (`cart: [CartItemSchema]`). C'est plus performant car on récupère l'utilisateur et son panier en une seule requête.
*   **Favoris et Commentaires (Références)** : Les favoris et commentaires sont stockés par référence (`ObjectId`) pour éviter de surcharger le document utilisateur si la liste devient très longue.

### Gestion de l'intégrité
*   **Mongoose Schemas** : Ils imposent des types (String, Number) et des contraintes (`required`, `min`, `max`) au niveau applicatif.
*   **Atomic Updates** : Lors du recalcul des notes moyennes, nous utilisons des agrégations MongoDB (`$avg`) pour garantir la précision.

---

## ➕ Questions Supplémentaires (Demandées et Suggérées)

### Q: Comment fonctionne le système de Favoris ?
**R:** Lorsqu'un utilisateur ajoute un favori, nous ne copions pas tout le produit. Nous ajoutons simplement l'ID du produit (`_id`) dans un tableau `favorites` du document User.
Pour afficher la page favoris, nous utilisons la fonction `.populate('favorites')` de Mongoose qui va automatiquement chercher les détails complets des produits correspondants.

### Q: Comment est généré le fichier PDF de la facture ? (Téléchargement PDF)
**R:** Le PDF est généré dynamiquement côté serveur (backend) grâce à la librairie **`pdf-lib`**.
*   Le code (`src/lib/invoice.ts`) dessine "manuellement" le texte, les lignes et les montants sur une page blanche virtuelle.
*   Le fichier est ensuite sauvegardé temporairement dans `public/invoices` et l'URL est renvoyée au client pour le téléchargement.

### Q: Comment fonctionne le paiement ?
**R:** Nous utilisons **Stripe Checkout**.
1.  Le frontend envoie les items du panier à l'API (`/api/stripe/create-checkout-session`).
2.  L'API demande à Stripe de créer une session de paiement sécurisée.
3.  L'API renvoie une URL vers une page hébergée par Stripe où l'utilisateur saisit sa carte bancaire.
4.  Une fois payé, Stripe redirige l'utilisateur vers notre page de succès (`/payment/success`).

### Q: Comment gérez-vous les données sensibles comme les mots de passe ?
**R:**
1.  **Hachage** : Utilisation de `bcrypt.hash()` avec un "salt" lors de l'inscription.
2.  **Filtrage** : Lors du renvoi des données utilisateur vers le frontend, on s'assure de ne jamais renvoyer le champ `password`.
3.  **Comparaison** : Lors du login, on utilise `bcrypt.compare()` qui vérifie le mot de passe sans jamais le déchiffrer (car c'est impossible).
