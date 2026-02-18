# 🎮 Gacha Game

Un jeu de tirage de personnages (gacha) développé avec Next.js, TypeScript et Firebase.

## 🌟 Fonctionnalités

- **Authentification** : Système de connexion/inscription avec Firebase Auth
- **Cloud Sync** : Vos données sont sauvegardées dans le cloud via Firestore
- **Système de tirage** : Tirage simple (1x) ou multiple (10x)
- **3 niveaux de rareté** :
  - Common (70%) - 3 étoiles - Gris
  - Rare (25%) - 4 étoiles - Bleu
  - Legendary (5%) - 5 étoiles - Or/Orange
- **Système de constellations** : 
  - C0 à C6 par personnage
  - Duplicatas après C6 donnent 100 pièces
- **Système de pièces** : Chaque tirage coûte 160 pièces
- **Collection complète** : Voir tous les personnages (possédés et verrouillés)
- **Animations style Genshin** : 
  - Révélation personnage par personnage
  - Écran récapitulatif des tirages
- **Palette Clair Obscur** : Design inspiré d'Expedition 33

## 🚀 Installation

### 1. Installer les dépendances
```bash
npm install
```

### 2. Configurer Firebase

1. Créez un projet sur [Firebase Console](https://console.firebase.google.com/)
2. Activez **Authentication** (Email/Password)
3. Activez **Firestore Database**
4. Copiez les credentials Firebase

### 3. Configuration de l'environnement

Créez un fichier `.env.local` à la racine du projet :

```env
NEXT_PUBLIC_FIREBASE_API_KEY=votre_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=votre_projet.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=votre_projet_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=votre_projet.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=votre_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=votre_app_id
```

### 4. Règles Firestore

Dans Firebase Console, configurez les règles Firestore :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 5. Lancer le projet

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 🎯 Comment jouer

1. **Créez un compte** ou connectez-vous
2. Vous commencez avec 5000 pièces
3. Choisissez entre un tirage simple (160 pièces) ou un tirage x10 (1600 pièces)
4. Collectionnez des personnages de différentes raretés
5. Augmentez les constellations en obtenant des duplicatas
6. Utilisez le bouton "+1000 💰" pour obtenir plus de pièces (mode test)
7. Consultez votre collection complète dans l'onglet Collection

## 🛠️ Technologies utilisées

- **Next.js 14** - Framework React
- **TypeScript** - Typage statique
- **Tailwind CSS** - Styles et animations
- **Firebase** - Authentification et base de données
  - Firebase Auth - Gestion des utilisateurs
  - Firestore - Stockage des données

## 📁 Structure du projet

```
gacha-game/
├── app/
│   ├── page.tsx              # Page de tirage
│   ├── auth/page.tsx         # Page de connexion/inscription
│   ├── collection/page.tsx   # Page de collection
│   ├── layout.tsx            # Layout avec AuthProvider
│   └── globals.css           # Styles globaux
├── contexts/
│   └── AuthContext.tsx       # Contexte d'authentification
├── lib/
│   ├── characters.ts         # Données et logique des personnages
│   └── firebase.ts           # Configuration Firebase
├── .env.example              # Template des variables d'environnement
└── package.json
```

## 🎨 Personnalisation

### Ajouter des personnages

Modifiez `lib/characters.ts` :

```typescript
{ id: 'c9', name: 'Nouveau Perso', rarity: 'Common', image: '🎭' }
```

### Modifier les taux de rareté

Ajustez dans `RARITY_CONFIG` :

```typescript
Common: { chance: 0.70 },    // 70%
Rare: { chance: 0.25 },      // 25%
Legendary: { chance: 0.05 }  // 5%
```

### Changer les couleurs

Tous les styles sont centralisés dans `app/globals.css`

## 🔐 Sécurité

- Les données utilisateur sont protégées par les règles Firestore
- Chaque utilisateur ne peut accéder qu'à ses propres données
- L'authentification est gérée par Firebase Auth
- Les mots de passe doivent contenir minimum 6 caractères

## 🔧 Améliorations possibles

- [ ] Système de pity (garantie après X tirages)
- [ ] Bannières avec personnages spécifiques
- [ ] Mode sombre/clair
- [ ] Sons et musiques
- [ ] Historique des tirages
- [ ] Classement des joueurs
- [ ] Événements temporaires
- [ ] Récompenses quotidiennes

## 📝 Licence

MIT


## 🌟 Fonctionnalités

- **Système de tirage** : Tirage simple (1x) ou multiple (10x)
- **4 niveaux de rareté** :
  - Common (60%) - Gris
  - Rare (30%) - Bleu
  - Epic (9%) - Violet
  - Legendary (1%) - Or
- **Système de pièces** : Chaque tirage coûte 160 pièces
- **Sauvegarde automatique** : Les pièces et la collection sont sauvegardées dans le localStorage
- **Collection** : Visualisez tous les personnages obtenus
- **Animations** : Effets visuels lors des tirages

## 🚀 Installation

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 🎯 Comment jouer

1. Vous commencez avec 5000 pièces
2. Choisissez entre un tirage simple (160 pièces) ou un tirage x10 (1600 pièces)
3. Collectionnez des personnages de différentes raretés
4. Utilisez le bouton "+1000 💰" pour obtenir plus de pièces (mode test)
5. Consultez votre collection complète en bas de page

## 🛠️ Technologies utilisées

- **Next.js 14** - Framework React
- **TypeScript** - Typage statique
- **Tailwind CSS** - Styles et animations
- **localStorage** - Sauvegarde des données

## 📁 Structure du projet

```
gacha-game/
├── app/
│   ├── page.tsx          # Page principale
│   ├── layout.tsx        # Layout de base
│   └── globals.css       # Styles globaux
├── lib/
│   └── characters.ts     # Données et logique des personnages
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## 🎨 Personnalisation

### Ajouter des personnages

Modifiez le fichier `lib/characters.ts` pour ajouter de nouveaux personnages :

```typescript
{ id: 'c7', name: 'Nouveau Perso', rarity: 'Common', image: '🎭' }
```

### Modifier les taux de rareté

Ajustez les probabilités dans `RARITY_CONFIG` :

```typescript
Common: { chance: 0.60 },  // 60%
Rare: { chance: 0.30 },    // 30%
Epic: { chance: 0.09 },    // 9%
Legendary: { chance: 0.01 } // 1%
```

### Changer le coût des tirages

Modifiez la constante `PULL_COST` dans `app/page.tsx` :

```typescript
const PULL_COST = 160; // Coût par tirage
```

## 🔧 Améliorations possibles

- [ ] Système de monnaie premium
- [ ] Pity system (garantie légendaire après X tirages)
- [ ] Statistiques détaillées
- [ ] Système de duplication (échange contre des ressources)
- [ ] Bannières avec personnages spécifiques
- [ ] Mode sombre/clair
- [ ] Sons et musiques
- [ ] Animations plus élaborées
- [ ] Backend pour sauvegarder en base de données

## 📝 Licence

MIT
