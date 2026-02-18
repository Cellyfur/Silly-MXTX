# 🎨 Guide : Images de fond pour les révélations

## Comment activer les images de fond

### Étape 1 : Ajouter vos images

Créez un dossier `public/images/backgrounds/` et ajoutez 3 images :

```
public/
├── images/
│   └── backgrounds/
│       ├── common.jpg      # Fond pour personnages Common (3⭐)
│       ├── rare.jpg        # Fond pour personnages Rare (4⭐)
│       └── legendary.jpg   # Fond pour personnages Legendary (5⭐)
```

**Recommandations pour les images :**
- Format : JPG ou PNG
- Taille : 1920x1080 minimum (Full HD)
- Style : Fonds sombres ou avec beaucoup de contraste
- Thème suggéré :
  - Common : Forêt, prairie, paysage simple
  - Rare : Ville mystique, temple, ruines
  - Legendary : Ciel étoilé, palais doré, dimension divine

### Étape 2 : Activer les fonds dans le code

Dans `app/page.tsx`, ligne ~9, change :

```typescript
const USE_BACKGROUND_IMAGES = false; // ❌ Actuellement désactivé
```

En :

```typescript
const USE_BACKGROUND_IMAGES = true; // ✅ Activé !
```

C'est tout ! 🎉

## 🎨 Personnaliser les fonds

Édite `lib/backgrounds.ts` pour :

1. **Changer les chemins des images** :
```typescript
Common: {
  image: '/images/backgrounds/ma-propre-image.jpg',
  // ...
}
```

2. **Ajuster l'overlay** (assombrir l'image) :
```typescript
Common: {
  // ...
  overlayOpacity: 0.4, // 0 = transparent, 1 = noir complet
}
```

3. **Modifier le dégradé de secours** (si image non trouvée) :
```typescript
Common: {
  // ...
  gradient: 'radial-gradient(circle, blue, black)',
}
```

## 💡 Astuces

### Utiliser des GIFs animés
Remplace `.jpg` par `.gif` :
```typescript
image: '/images/backgrounds/legendary.gif',
```

### Utiliser des vidéos
Pour des fonds vidéo, il faudra modifier le code pour utiliser `<video>` au lieu de `backgroundImage`.

### Images différentes par personnage
Actuellement, chaque rareté a 1 image. Pour avoir une image par personnage :

1. Ajoute un champ `backgroundImage` dans `data/characters.ts` :
```typescript
{ 
  id: 'char-1', 
  name: 'Aria', 
  image: '/images/aria.png',
  backgroundImage: '/images/backgrounds/aria-bg.jpg', // ← Nouveau
  rarity: 'Legendary' 
}
```

2. Utilise cette image dans `page.tsx` :
```typescript
style={{
  backgroundImage: `url('${currentResult.character.backgroundImage}')`,
  // ...
}}
```

## 🖼️ Où trouver des images

- **Gratuit et libre de droits** :
  - [Unsplash](https://unsplash.com/) - Photos haute qualité
  - [Pexels](https://www.pexels.com/) - Photos et vidéos
  - [Pixabay](https://pixabay.com/) - Images et illustrations
  
- **IA générative** :
  - Midjourney, DALL-E, Stable Diffusion
  - Prompt exemple : "fantasy landscape, dark atmosphere, cinematic lighting"

## 🎬 Exemple de résultat

**Avec dégradé** (actuel) :
```
┌─────────────────────┐
│   Dégradé rouge     │  ← Fond uni avec effet radial
│                     │
│      🔥 Phoenix     │
│                     │
└─────────────────────┘
```

**Avec image** :
```
┌─────────────────────┐
│  🏔️ Montagne + 🌅   │  ← Image de fond épique
│  avec overlay noir  │
│                     │
│      🔥 Phoenix     │  ← Personnage par-dessus
│                     │
└─────────────────────┘
```

Beaucoup plus immersif ! ✨
