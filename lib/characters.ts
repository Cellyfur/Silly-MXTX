import { CHARACTERS_DATA } from '@/data/characters';

export type Rarity = 'Common' | 'Rare' | 'Legendary';

export interface Character {
  id: string;
  name: string;
  rarity: Rarity;
  image: string; // Emoji OU chemin d'image (ex: '/images/aria.png')
}

export interface OwnedCharacter extends Character {
  constellation: number; // 0 à 6
  count: number; // Nombre total de fois obtenu
}

export const RARITY_CONFIG = {
  Common: {
    color: '#9CA3AF',
    bgColor: 'bg-gray-500',
    textColor: 'text-gray-400',
    glowColor: 'rgba(156, 163, 175, 0.5)',
    chance: 0.70, // 70%
    stars: 3,
  },
  Rare: {
    color: '#DC2626',
    bgColor: 'bg-red-600',
    textColor: 'text-red-500',
    glowColor: 'rgba(220, 38, 38, 0.6)',
    chance: 0.25, // 25%
    stars: 4,
  },
  Legendary: {
    color: '#F59E0B',
    bgColor: 'bg-amber-500',
    textColor: 'text-amber-400',
    glowColor: 'rgba(245, 158, 11, 0.7)',
    chance: 0.05, // 5%
    stars: 5,
  },
};

export const MAX_CONSTELLATION = 6;
export const DUPLICATE_COINS = 100;

// Importer les personnages depuis le fichier de données
export const CHARACTERS: Character[] = CHARACTERS_DATA as Character[];

// Fonction de tirage avec les probabilités
export function drawCharacter(): Character {
  const random = Math.random();
  let cumulativeProbability = 0;
  
  for (const [rarity, config] of Object.entries(RARITY_CONFIG)) {
    cumulativeProbability += config.chance;
    if (random <= cumulativeProbability) {
      const charactersOfRarity = CHARACTERS.filter(c => c.rarity === rarity);
      return charactersOfRarity[Math.floor(Math.random() * charactersOfRarity.length)];
    }
  }
  
  // Fallback (ne devrait jamais arriver)
  return CHARACTERS[0];
}
