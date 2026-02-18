import { OwnedCharacter } from './characters';
import { ENEMY_TYPES, BOSS_TYPES } from '@/data/enemies';

export interface Fighter {
  id: string;
  name: string;
  image: string;
  rarity: 'Common' | 'Rare' | 'Legendary';
  constellation: number;
  maxHp: number;
  currentHp: number;
  attack: number;
  isPlayer: boolean;
  isDefending: boolean;
  attackBuff: number;
  buffTurnsRemaining: number;
}

export interface Enemy {
  id: string;
  name: string;
  image: string;
  hp: number;
  maxHp: number;
  attack: number;
}

export interface BattleAction {
  type: 'attack' | 'power-attack' | 'defend' | 'special';
  attacker: Fighter;
  target?: Fighter | Enemy;
}

export interface QTEResult {
  success: boolean;
  score: number; // 0-100
  damageMultiplier: number; // 0 (perfect dodge) to 1 (full damage)
}

// Stats de base par rareté
const BASE_STATS = {
  Common: { hp: 100, attack: 20 },
  Rare: { hp: 150, attack: 30 },
  Legendary: { hp: 200, attack: 40 },
};

// Calculer les stats d'un personnage avec bonus de constellation
export function calculateStats(character: OwnedCharacter): { hp: number; attack: number } {
  const base = BASE_STATS[character.rarity];
  const constellationBonus = 1 + (character.constellation * 0.1); // +10% par niveau
  
  return {
    hp: Math.floor(base.hp * constellationBonus),
    attack: Math.floor(base.attack * constellationBonus),
  };
}

// Créer un fighter à partir d'un personnage
export function createFighter(character: OwnedCharacter): Fighter {
  const stats = calculateStats(character);
  
  return {
    id: character.id,
    name: character.name,
    image: character.image,
    rarity: character.rarity,
    constellation: character.constellation,
    maxHp: stats.hp,
    currentHp: stats.hp,
    attack: stats.attack,
    isPlayer: true,
    isDefending: false,
    attackBuff: 1,
    buffTurnsRemaining: 0,
  };
}

// Générer des ennemis pour une vague
export function generateEnemies(wave: number): Enemy[] {
  const enemyCount = Math.min(3 + Math.floor(wave / 2), 5); // 3-5 ennemis
  const enemies: Enemy[] = [];
  
  for (let i = 0; i < enemyCount; i++) {
    // Choisir un type d'ennemi adapté à la vague
    const availableTypes = ENEMY_TYPES.filter(t => t.minWave <= wave);
    const type = availableTypes[Math.min(Math.floor(wave / 2), availableTypes.length - 1)];
    
    const baseHp = 80 + (wave * 20);
    const baseAttack = 15 + (wave * 5);
    
    const hp = Math.floor(baseHp * type.hpMultiplier);
    const attack = Math.floor(baseAttack * type.attackMultiplier);
    
    enemies.push({
      id: `enemy-${wave}-${i}`,
      name: `${type.name} ${i + 1}`,
      image: type.image,
      hp: hp,
      maxHp: hp,
      attack: attack,
    });
  }
  
  return enemies;
}

// Générer un boss pour la vague finale
export function generateBoss(wave: number): Enemy {
  const boss = BOSS_TYPES[wave % BOSS_TYPES.length];
  const hp = 300 + (wave * 50);
  const attack = 40 + (wave * 10);
  
  return {
    id: `boss-${wave}`,
    name: boss.name,
    image: boss.image,
    hp: hp,
    maxHp: hp,
    attack: attack,
  };
}

// Calculer les dégâts avec variance
export function calculateDamage(baseAttack: number, multiplier: number = 1): number {
  const variance = 0.9 + Math.random() * 0.2; // 90% à 110%
  return Math.floor(baseAttack * variance * multiplier);
}

// Exécuter une action de combat
export function executeAction(
  action: BattleAction,
  target: Fighter | Enemy,
  fighters: Fighter[]
): { damage: number; message: string; healAmount?: number; buffApplied?: boolean } {
  const attacker = action.attacker;
  let damage = 0;
  let message = '';
  let healAmount = 0;
  let buffApplied = false;

  switch (action.type) {
    case 'attack':
      damage = calculateDamage(attacker.attack * attacker.attackBuff);
      if ('isDefending' in target && target.isDefending) {
        damage = Math.floor(damage * 0.5);
      }
      target.hp = Math.max(0, target.hp - damage);
      message = `${attacker.name} attaque ${target.name} pour ${damage} dégâts !`;
      break;

    case 'power-attack':
      const powerHit = Math.random() < 0.7; // 70% de chance de toucher
      if (powerHit) {
        damage = calculateDamage(attacker.attack * attacker.attackBuff * 1.5);
        if ('isDefending' in target && target.isDefending) {
          damage = Math.floor(damage * 0.5);
        }
        target.hp = Math.max(0, target.hp - damage);
        message = `${attacker.name} utilise Attaque Puissante sur ${target.name} pour ${damage} dégâts ! 💥`;
      } else {
        message = `${attacker.name} rate son Attaque Puissante ! ❌`;
      }
      break;

    case 'defend':
      attacker.isDefending = true;
      message = `${attacker.name} se met en défense ! 🛡️`;
      break;

    case 'special':
      if (attacker.rarity === 'Common') {
        // Soigne un allié
        const aliveFighters = fighters.filter(f => f.currentHp > 0 && f.currentHp < f.maxHp);
        if (aliveFighters.length > 0) {
          const targetFighter = aliveFighters[Math.floor(Math.random() * aliveFighters.length)];
          healAmount = 20;
          targetFighter.currentHp = Math.min(targetFighter.maxHp, targetFighter.currentHp + healAmount);
          message = `${attacker.name} soigne ${targetFighter.name} de ${healAmount} HP ! 💚`;
        } else {
          message = `${attacker.name} essaie de soigner mais personne n'est blessé !`;
        }
      } else if (attacker.rarity === 'Rare') {
        // Attaque de zone (appliquée à la cible seulement pour la simulation)
        damage = calculateDamage(attacker.attack * attacker.attackBuff * 0.8);
        target.hp = Math.max(0, target.hp - damage);
        message = `${attacker.name} utilise Attaque de Zone ! Tous les ennemis prennent ${damage} dégâts ! 🌪️`;
      } else if (attacker.rarity === 'Legendary') {
        // Buff d'équipe
        fighters.forEach(f => {
          f.attackBuff = 1.3;
          f.buffTurnsRemaining = 2;
        });
        buffApplied = true;
        message = `${attacker.name} booste toute l'équipe ! +30% ATK pendant 2 tours ! ✨`;
      }
      break;
  }

  return { damage, message, healAmount, buffApplied };
}

// Mettre à jour les buffs et debuffs en début de tour
export function updateTurnEffects(fighter: Fighter): void {
  // Réinitialiser la défense
  fighter.isDefending = false;

  // Décrémenter les buffs
  if (fighter.buffTurnsRemaining > 0) {
    fighter.buffTurnsRemaining--;
    if (fighter.buffTurnsRemaining === 0) {
      fighter.attackBuff = 1;
    }
  }
}

// Récompenses par vague
export const WAVE_REWARDS: { [key: number]: number } = {
  1: 100,
  2: 150,
  3: 200,
  4: 300,
  5: 500,
};

export function getTotalReward(wavesCompleted: number): number {
  let total = 0;
  for (let i = 1; i <= wavesCompleted; i++) {
    total += WAVE_REWARDS[i] || 100;
  }
  return total;
}

