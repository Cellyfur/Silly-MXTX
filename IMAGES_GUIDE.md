# 🎨 Guide : Personnages et Ennemis

## 📁 Structure des fichiers

Les données sont maintenant séparées dans des fichiers dédiés :

- **`data/characters.ts`** - Liste de tous les personnages
- **`data/enemies.ts`** - Types d'ennemis et boss
- **`components/CharacterImage.tsx`** - Composant pour afficher images ou emojis

## 🖼️ Utiliser des images à la place des emojis

### Étape 1 : Ajouter vos images

Créez un dossier `public/images/` et ajoutez vos images :

```
public/
├── images/
│   ├── characters/
│   │   ├── aria.png
│   │   ├── draven.png
│   │   └── ...
│   └── enemies/
│       ├── goblin.png
│       ├── dragon.png
│       └── ...
```

### Étape 2 : Modifier les données

Dans `data/characters.ts`, remplacez les emojis par les chemins d'images :

**Avant (emoji) :**
```typescript
{ id: 'char-1', name: 'Aria', image: '🧙‍♀️', rarity: 'Legendary' }
```

**Après (image) :**
```typescript
{ id: 'char-1', name: 'Aria', image: '/images/characters/aria.png', rarity: 'Legendary' }
```

### Étape 3 : Utiliser le composant CharacterImage

Dans vos pages, importez et utilisez le composant :

```tsx
import { CharacterImage } from '@/components/CharacterImage';

// Au lieu de :
<div className="text-4xl">{character.image}</div>

// Utilisez :
<CharacterImage 
  src={character.image} 
  alt={character.name}
  size="medium"
/>
```

### Tailles disponibles :
- `small` - 48x48px (text-3xl)
- `medium` - 64x64px (text-4xl) - par défaut
- `large` - 96x96px (text-6xl)
- `xlarge` - 128x128px (text-8xl)
- `xxlarge` - 192x192px (text-9xl)

## 🔧 Le composant détecte automatiquement

Le composant `CharacterImage` détecte automatiquement si c'est :
- **Un emoji** → affiche le texte
- **Une image** → affiche avec Next.js Image (optimisé)

Vous pouvez **mélanger** emojis et images dans le même jeu !

## 📝 Exemple complet

```typescript
// data/characters.ts
export const CHARACTERS_DATA = [
  // Avec emoji
  { id: 'char-1', name: 'Tom', image: '🧑', rarity: 'Common' },
  
  // Avec image
  { id: 'char-2', name: 'Aria', image: '/images/aria.png', rarity: 'Legendary' },
];
```

## 🎮 Modifier les personnages

Pour ajouter/modifier des personnages, éditez simplement `data/characters.ts` :

```typescript
export const CHARACTERS_DATA = [
  { 
    id: 'char-99',           // ID unique
    name: 'Nouveau Héros',   // Nom affiché
    image: '/images/hero.png', // Emoji ou chemin
    rarity: 'Legendary'      // Common, Rare, ou Legendary
  },
];
```

## 👹 Modifier les ennemis

Pour changer les ennemis, éditez `data/enemies.ts` :

```typescript
export const ENEMY_TYPES = [
  {
    name: 'Gobelin',
    image: '/images/enemies/goblin.png', // ou un emoji
    hpMultiplier: 0.8,    // Multiplicateur de HP
    attackMultiplier: 0.9, // Multiplicateur d'attaque
    minWave: 1,           // Apparaît à partir de la vague X
  },
];
```

## ⚙️ Modifier les stats de combat

Les stats de base se trouvent dans `lib/combat.ts` :

```typescript
const BASE_STATS = {
  Common: { hp: 100, attack: 20 },
  Rare: { hp: 150, attack: 30 },
  Legendary: { hp: 200, attack: 40 },
};
```

Changez ces valeurs pour rééquilibrer le jeu !
