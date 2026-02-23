// Configuration des fonds pour la révélation de personnages

export const REVEAL_BACKGROUNDS = {
  Common: {
    // Option 1: Image
    image: '/images/backgrounds/fond_gris.png',
    
    // Option 2: Dégradé (utilisé si image non disponible)
    gradient: 'radial-gradient(circle at center, rgba(156, 163, 175, 0.5), rgba(0,0,0,0.95))',
    
    // Overlay (opacité sur l'image pour mieux voir le texte)
    overlayOpacity: 0.4,
  },
  Rare: {
    image: '/images/backgrounds/fond_rouge.png',
    gradient: 'radial-gradient(circle at center, rgba(220, 38, 38, 0.6), rgba(0,0,0,0.95))',
    overlayOpacity: 0.3,
  },
  Legendary: {
    image: '/images/backgrounds/fond_jaune.png',
    gradient: 'radial-gradient(circle at center, rgba(245, 158, 11, 0.7), rgba(0,0,0,0.95))',
    overlayOpacity: 0.2,
  },
};

// Fonction pour obtenir le style de fond
export function getRevealBackgroundStyle(rarity: 'Common' | 'Rare' | 'Legendary', useImage: boolean = false) {
  const config = REVEAL_BACKGROUNDS[rarity];
  
  if (useImage) {
    return {
      backgroundImage: `url('${config.image}')`,
      backgroundSize: '70%',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    };
  }
  
  return {
    background: config.gradient,
  };
}
