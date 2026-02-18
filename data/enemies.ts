export const ENEMY_TYPES = [
  {
    name: 'Gobelin',
    image: '👺',
    hpMultiplier: 0.8,
    attackMultiplier: 0.9,
    minWave: 1,
  },
  {
    name: 'Squelette',
    image: '💀',
    hpMultiplier: 0.7,
    attackMultiplier: 1.0,
    minWave: 1,
  },
  {
    name: 'Orc',
    image: '👹',
    hpMultiplier: 1.0,
    attackMultiplier: 1.1,
    minWave: 2,
  },
  {
    name: 'Troll',
    image: '🧟',
    hpMultiplier: 1.2,
    attackMultiplier: 0.8,
    minWave: 3,
  },
  {
    name: 'Dragon',
    image: '🐉',
    hpMultiplier: 1.5,
    attackMultiplier: 1.2,
    minWave: 4,
  },
];

export const BOSS_TYPES = [
  {
    name: 'Roi Gobelin',
    image: '👑👺',
  },
  {
    name: 'Seigneur Dragon',
    image: '🐲',
  },
  {
    name: 'Démon Ancien',
    image: '😈',
  },
];

// Pour utiliser des images à la place des emojis, remplace juste :
// image: '👺'  →  image: '/images/enemies/goblin.png'
