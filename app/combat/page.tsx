'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { OwnedCharacter } from '@/lib/characters';
import { 
  Fighter, 
  Enemy, 
  createFighter, 
  generateEnemies, 
  generateBoss,
  executeAction,
  updateTurnEffects,
  getTotalReward,
  WAVE_REWARDS 
} from '@/lib/combat';

type GameState = 'team-selection' | 'player-turn' | 'enemy-turn' | 'qte' | 'victory' | 'defeat';
type ActionType = 'attack' | 'power-attack' | 'defend' | 'special';

export default function Combat() {
  const { user, loadUserData, saveUserData } = useAuth();
  const router = useRouter();
  
  const [inventory, setInventory] = useState<OwnedCharacter[]>([]);
  const [coins, setCoins] = useState(0);
  const [selectedTeam, setSelectedTeam] = useState<string[]>([]);
  const [gameState, setGameState] = useState<GameState>('team-selection');
  const [wave, setWave] = useState(1);
  const [playerTeam, setPlayerTeam] = useState<Fighter[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  
  const [currentTurn, setCurrentTurn] = useState(0);
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [attackingEnemy, setAttackingEnemy] = useState<Enemy | null>(null);
  
  const [qteActive, setQteActive] = useState(false);
  const [qteBarPosition, setQteBarPosition] = useState(0);
  const [qteBarDirection, setQteBarDirection] = useState(1);
  const [qteResult, setQteResult] = useState<number | null>(null);
  const qteIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }

    loadUserData().then((data) => {
      if (data) {
        setInventory(data.inventory);
        setCoins(data.coins);
      }
    });
  }, [user, loadUserData, router]);

  useEffect(() => {
    if (qteActive) {
      qteIntervalRef.current = setInterval(() => {
        setQteBarPosition(prev => {
          let newPos = prev + (qteBarDirection * 3);
          let newDir = qteBarDirection;
          
          if (newPos >= 100) {
            newPos = 100;
            newDir = -1;
          } else if (newPos <= 0) {
            newPos = 0;
            newDir = 1;
          }
          
          setQteBarDirection(newDir);
          return newPos;
        });
      }, 20);
    } else {
      if (qteIntervalRef.current) {
        clearInterval(qteIntervalRef.current);
      }
    }

    return () => {
      if (qteIntervalRef.current) {
        clearInterval(qteIntervalRef.current);
      }
    };
  }, [qteActive, qteBarDirection]);

  const toggleCharacterSelection = (charId: string) => {
    if (selectedTeam.includes(charId)) {
      setSelectedTeam(selectedTeam.filter(id => id !== charId));
    } else if (selectedTeam.length < 3) {
      setSelectedTeam([...selectedTeam, charId]);
    }
  };

  const startBattle = () => {
    if (selectedTeam.length !== 3) {
      alert('Sélectionne exactement 3 personnages !');
      return;
    }

    const team = selectedTeam
      .map(id => inventory.find(char => char.id === id))
      .filter(char => char !== undefined)
      .map(char => createFighter(char!));

    setPlayerTeam(team);
    setEnemies(generateEnemies(1));
    setWave(1);
    setBattleLog(['⚔️ Le combat commence !']);
    setCurrentTurn(0);
    setGameState('player-turn');
  };

  const selectAction = (action: ActionType) => {
    setSelectedAction(action);
    if (action === 'defend' || action === 'special') {
      executePlayerAction(action, null);
    }
  };

  const selectTarget = (targetId: string) => {
    if (!selectedAction) return;
    setSelectedTarget(targetId);
    executePlayerAction(selectedAction, targetId);
  };

  const executePlayerAction = (action: ActionType, targetId: string | null) => {
    const currentFighter = playerTeam[currentTurn];
    if (!currentFighter || currentFighter.currentHp <= 0) {
      nextPlayerTurn();
      return;
    }

    let target: Enemy | Fighter | null = null;
    
    if (action !== 'defend') {
      if (action === 'special' && currentFighter.rarity === 'Common') {
        target = null;
      } else {
        target = enemies.find(e => e.id === targetId) || null;
        if (!target || target.hp <= 0) {
          alert('Cible invalide !');
          return;
        }
      }
    }

    const result = executeAction(
      { type: action, attacker: currentFighter, target: target || enemies[0] },
      target || enemies[0],
      playerTeam
    );

    const newEnemies = [...enemies];
    const newPlayerTeam = [...playerTeam];
    
    if (action === 'special' && currentFighter.rarity === 'Rare') {
      newEnemies.forEach(enemy => {
        if (enemy.hp > 0) {
          enemy.hp = Math.max(0, enemy.hp - result.damage);
        }
      });
    }

    setEnemies(newEnemies);
    setPlayerTeam(newPlayerTeam);
    setBattleLog(prev => [...prev, result.message]);

    if (newEnemies.every(e => e.hp <= 0)) {
      setTimeout(() => {
        handleWaveVictory();
      }, 1000);
      return;
    }

    setSelectedAction(null);
    setSelectedTarget(null);
    nextPlayerTurn();
  };

  const nextPlayerTurn = () => {
    const nextTurn = currentTurn + 1;
    
    if (nextTurn >= playerTeam.length) {
      startEnemyTurn();
    } else {
      const nextFighter = playerTeam[nextTurn];
      if (nextFighter.currentHp <= 0) {
        setCurrentTurn(nextTurn);
        setTimeout(() => nextPlayerTurn(), 100);
      } else {
        updateTurnEffects(nextFighter);
        setCurrentTurn(nextTurn);
      }
    }
  };

  const startEnemyTurn = () => {
    setGameState('enemy-turn');
    
    const aliveEnemies = enemies.filter(e => e.hp > 0);
    if (aliveEnemies.length === 0) return;

    let enemyIndex = 0;
    
    const processNextEnemy = () => {
      if (enemyIndex >= aliveEnemies.length) {
        setCurrentTurn(0);
        playerTeam.forEach(f => updateTurnEffects(f));
        setGameState('player-turn');
        return;
      }

      const enemy = aliveEnemies[enemyIndex];
      setAttackingEnemy(enemy);
      startQTE(enemy);
      enemyIndex++;
    };

    processNextEnemy();
  };

  const startQTE = (enemy: Enemy) => {
    setQteActive(true);
    setQteBarPosition(0);
    setQteBarDirection(1);
    setQteResult(null);
    setGameState('qte');
  };

  const handleQTEClick = () => {
    if (!qteActive || !attackingEnemy) return;
    
    setQteActive(false);
    const score = qteBarPosition;
    setQteResult(score);

    // Debug - retire cette ligne après avoir testé
    console.log('QTE Position:', score);

    let damageMultiplier = 1;
    let resultText = '';
    
    if (score >= 45 && score <= 55) {
      damageMultiplier = 0;
      resultText = '🎯 PERFECT ! Esquive complète !';
    } else if (score >= 30 && score <= 70) {
      damageMultiplier = 0.5;
      resultText = '✅ Bien ! Dégâts réduits de 50% !';
    } else {
      damageMultiplier = 1;
      resultText = '❌ Raté ! Dégâts pleins !';
    }

    const aliveFighters = playerTeam.filter(f => f.currentHp > 0);
    if (aliveFighters.length === 0) return;

    const target = aliveFighters[Math.floor(Math.random() * aliveFighters.length)];
    const baseDamage = attackingEnemy.attack;
    const variance = 0.9 + Math.random() * 0.2;
    let damage = Math.floor(baseDamage * variance * damageMultiplier);
    
    if (target.isDefending) {
      damage = Math.floor(damage * 0.5);
    }
    
    target.currentHp = Math.max(0, target.currentHp - damage);
    
    const attackMessage = damage > 0 
      ? `${attackingEnemy.name} attaque ${target.name} pour ${damage} dégâts !`
      : `${attackingEnemy.name} attaque mais ${target.name} esquive !`;

    setBattleLog(prev => [...prev, resultText, attackMessage]);
    setPlayerTeam([...playerTeam]);

    if (playerTeam.every(f => f.currentHp <= 0)) {
      setTimeout(() => {
        handleDefeat();
      }, 1000);
      return;
    }

    setTimeout(() => {
      setQteResult(null);
      setAttackingEnemy(null);
      setGameState('enemy-turn');
      
      const aliveEnemies = enemies.filter(e => e.hp > 0);
      const currentEnemyIndex = aliveEnemies.findIndex(e => e.id === attackingEnemy.id);
      
      if (currentEnemyIndex < aliveEnemies.length - 1) {
        setTimeout(() => {
          const nextEnemy = aliveEnemies[currentEnemyIndex + 1];
          setAttackingEnemy(nextEnemy);
          startQTE(nextEnemy);
        }, 500);
      } else {
        setTimeout(() => {
          setCurrentTurn(0);
          playerTeam.forEach(f => updateTurnEffects(f));
          setGameState('player-turn');
        }, 1000);
      }
    }, 1500);
  };

  const handleWaveVictory = () => {
    setBattleLog(prev => [...prev, `🎉 Victoire de la vague ${wave} !`]);
    
    if (wave >= 5) {
      const totalReward = getTotalReward(wave);
      setCoins(coins + totalReward);
      saveUserData(coins + totalReward, inventory);
      setGameState('victory');
    } else {
      setTimeout(() => {
        nextWave();
      }, 2000);
    }
  };

  const nextWave = () => {
    const nextWaveNum = wave + 1;
    setWave(nextWaveNum);
    
    if (nextWaveNum === 5) {
      setEnemies([generateBoss(nextWaveNum)]);
    } else {
      setEnemies(generateEnemies(nextWaveNum));
    }
    
    setBattleLog(prev => [...prev, `🌊 Vague ${nextWaveNum} commence !`]);
    setCurrentTurn(0);
    setGameState('player-turn');
  };

  const handleDefeat = () => {
    const reward = getTotalReward(wave - 1);
    if (reward > 0) {
      setCoins(coins + reward);
      saveUserData(coins + reward, inventory);
    }
    setBattleLog(prev => [...prev, `💀 Défaite à la vague ${wave}...`]);
    setGameState('defeat');
  };

  const resetGame = () => {
    setSelectedTeam([]);
    setGameState('team-selection');
    setWave(1);
    setPlayerTeam([]);
    setEnemies([]);
    setBattleLog([]);
    setCurrentTurn(0);
    setSelectedAction(null);
    setSelectedTarget(null);
  };

  if (!user) {
    return null;
  }

  const currentFighter = playerTeam[currentTurn];

  return (
    <div className="min-h-screen">
      <header className="header">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="header-title">⚔️ Combat Arena</h1>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-white hover:text-amber-400 transition-colors font-medium">
              ← Retour
            </Link>
            <div className="coins-display">
              <span className="text-2xl">💰</span>
              <span className="coins-value">{coins}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Team Selection */}
          {gameState === 'team-selection' && (
            <div className="card">
              <h2 className="card-title">Sélectionne ton équipe (3 personnages)</h2>
              
              <div className="mb-6 text-center">
                <div className="inline-flex gap-2 bg-black/60 px-6 py-3 rounded-lg border border-amber-600/30">
                  <span className="text-white font-bold">{selectedTeam.length} / 3</span>
                  <span className="text-gray-400">personnages sélectionnés</span>
                </div>
              </div>

              {inventory.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📦</div>
                  <p className="text-gray-400 mb-4">Tu n'as aucun personnage !</p>
                  <Link href="/" className="add-coins-btn inline-block">
                    Faire des tirages
                  </Link>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
                    {inventory.map((char) => {
                      const isSelected = selectedTeam.includes(char.id);
                      
                      return (
                        <button
                          key={char.id}
                          onClick={() => toggleCharacterSelection(char.id)}
                          className={`inventory-card bg-gray-800 relative transition-all ${
                            isSelected 
                              ? 'ring-4 ring-amber-500 scale-105' 
                              : 'hover:scale-105 opacity-80 hover:opacity-100'
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2 bg-amber-500 text-black rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm">
                              ✓
                            </div>
                          )}
                          
                          <div className="absolute top-2 left-2 bg-black/80 rounded-full px-2 py-1 text-xs text-white font-bold">
                            C{char.constellation}
                          </div>

                          <div className="text-4xl mb-2 mt-6">{char.image}</div>
                          <div className="text-white text-xs font-medium truncate mb-1">{char.name}</div>
                          <div className="text-xs text-gray-400">
                            ❤️ {Math.floor((char.rarity === 'Common' ? 100 : char.rarity === 'Rare' ? 150 : 200) * (1 + char.constellation * 0.1))}
                          </div>
                          <div className="text-xs text-red-400">
                            ⚔️ {Math.floor((char.rarity === 'Common' ? 20 : char.rarity === 'Rare' ? 30 : 40) * (1 + char.constellation * 0.1))}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="text-center">
                    <button
                      onClick={startBattle}
                      disabled={selectedTeam.length !== 3}
                      className="bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 disabled:from-gray-700 disabled:to-gray-800 px-8 py-4 rounded-lg text-white text-xl font-bold transition-all shadow-lg disabled:cursor-not-allowed"
                    >
                      {selectedTeam.length === 3 ? '⚔️ Commencer le Combat !' : '❌ Sélectionne 3 personnages'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Battle Screen */}
          {(gameState === 'player-turn' || gameState === 'enemy-turn' || gameState === 'qte') && (
            <div className="space-y-6">
              {/* Wave Info */}
              <div className="card text-center">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-500 mb-2">
                  🌊 Vague {wave} / 5
                </h2>
                <p className="text-gray-400">Récompense : {WAVE_REWARDS[wave] || 100} 💰</p>
                
                {gameState === 'player-turn' && currentFighter && (
                  <div className="mt-3 text-xl text-green-400 font-bold">
                    🎯 Tour de {currentFighter.name}
                  </div>
                )}
                
                {gameState === 'enemy-turn' && (
                  <div className="mt-3 text-xl text-red-400 font-bold">
                    👹 Tour des Ennemis
                  </div>
                )}
              </div>

              {/* Battle Area */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Player Team */}
                <div className="card">
                  <h3 className="text-xl font-bold text-green-400 mb-4">👥 Ton Équipe</h3>
                  <div className="space-y-3">
                    {playerTeam.map((fighter, index) => (
                      <div 
                        key={fighter.id} 
                        className={`bg-black/60 rounded-lg p-3 border transition-all ${
                          index === currentTurn && gameState === 'player-turn'
                            ? 'border-amber-500 ring-2 ring-amber-500/50' 
                            : 'border-green-600/30'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-3xl">{fighter.image}</span>
                            <div>
                              <div className="text-white font-bold">{fighter.name}</div>
                              <div className="text-xs text-gray-400">
                                C{fighter.constellation}
                                {fighter.isDefending && <span className="text-blue-400 ml-2">🛡️</span>}
                                {fighter.buffTurnsRemaining > 0 && <span className="text-amber-400 ml-2">✨({fighter.buffTurnsRemaining})</span>}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-400">HP</div>
                            <div className={`font-bold ${fighter.currentHp > 0 ? 'text-green-400' : 'text-red-500'}`}>
                              {fighter.currentHp} / {fighter.maxHp}
                            </div>
                          </div>
                        </div>
                        <div className="bg-black/50 rounded-full h-2 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-500"
                            style={{ width: `${(fighter.currentHp / fighter.maxHp) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Enemies */}
                <div className="card">
                  <h3 className="text-xl font-bold text-red-400 mb-4">👹 Ennemis</h3>
                  <div className="space-y-3">
                    {enemies.map((enemy) => (
                      <button
                        key={enemy.id}
                        onClick={() => gameState === 'player-turn' && selectTarget(enemy.id)}
                        disabled={enemy.hp <= 0 || gameState !== 'player-turn' || !selectedAction || selectedAction === 'defend'}
                        className={`w-full bg-black/60 rounded-lg p-3 border transition-all ${
                          enemy.hp <= 0 
                            ? 'border-gray-800 opacity-50' 
                            : selectedTarget === enemy.id && selectedAction
                            ? 'border-amber-500 ring-2 ring-amber-500/50'
                            : 'border-red-600/30 hover:border-red-500'
                        } disabled:cursor-not-allowed`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-3xl">{enemy.image}</span>
                            <div className="text-white font-bold text-left">{enemy.name}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-400">HP</div>
                            <div className={`font-bold ${enemy.hp > 0 ? 'text-red-400' : 'text-gray-600'}`}>
                              {enemy.hp} / {enemy.maxHp}
                            </div>
                          </div>
                        </div>
                        <div className="bg-black/50 rounded-full h-2 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-500"
                            style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
                          ></div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {gameState === 'player-turn' && currentFighter && currentFighter.currentHp > 0 && (
                <div className="card">
                  <h3 className="text-lg font-bold text-amber-400 mb-4 text-center">⚔️ Actions Disponibles</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button
                      onClick={() => selectAction('attack')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedAction === 'attack'
                          ? 'bg-red-900/50 border-red-500' 
                          : 'bg-gray-800 border-gray-700 hover:border-red-500'
                      }`}
                    >
                      <div className="text-3xl mb-2">⚔️</div>
                      <div className="text-white font-bold">Attaque</div>
                      <div className="text-xs text-gray-400">Dégâts normaux</div>
                    </button>

                    <button
                      onClick={() => selectAction('power-attack')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedAction === 'power-attack'
                          ? 'bg-orange-900/50 border-orange-500' 
                          : 'bg-gray-800 border-gray-700 hover:border-orange-500'
                      }`}
                    >
                      <div className="text-3xl mb-2">💥</div>
                      <div className="text-white font-bold">Puissante</div>
                      <div className="text-xs text-gray-400">1.5x, 70% précision</div>
                    </button>

                    <button
                      onClick={() => selectAction('defend')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedAction === 'defend'
                          ? 'bg-blue-900/50 border-blue-500' 
                          : 'bg-gray-800 border-gray-700 hover:border-blue-500'
                      }`}
                    >
                      <div className="text-3xl mb-2">🛡️</div>
                      <div className="text-white font-bold">Défense</div>
                      <div className="text-xs text-gray-400">-50% dégâts</div>
                    </button>

                    <button
                      onClick={() => selectAction('special')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedAction === 'special'
                          ? 'bg-purple-900/50 border-purple-500' 
                          : 'bg-gray-800 border-gray-700 hover:border-purple-500'
                      }`}
                    >
                      <div className="text-3xl mb-2">✨</div>
                      <div className="text-white font-bold">Spéciale</div>
                      <div className="text-xs text-gray-400">
                        {currentFighter.rarity === 'Common' && 'Soin 20 HP'}
                        {currentFighter.rarity === 'Rare' && 'Zone'}
                        {currentFighter.rarity === 'Legendary' && '+30% ATK'}
                      </div>
                    </button>
                  </div>
                  
                  {selectedAction && selectedAction !== 'defend' && selectedAction !== 'special' && (
                    <div className="mt-4 text-center text-amber-400 animate-pulse">
                      👆 Sélectionne une cible !
                    </div>
                  )}
                </div>
              )}

              {/* QTE */}
              {gameState === 'qte' && qteActive && attackingEnemy && (
                <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
                  <div className="card max-w-2xl w-full">
                    <h2 className="text-3xl font-bold text-red-400 mb-6 text-center">
                      {attackingEnemy.image} {attackingEnemy.name} attaque !
                    </h2>
                    
                    <div className="mb-8">
                      <div className="text-center text-white text-xl mb-4">
                        Clique quand la barre est dans la zone verte ! 🎯
                      </div>
                      
                      <div className="relative h-12 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-700">
                        <div 
                          className="absolute h-full bg-green-500/30 border-2 border-green-400"
                          style={{ left: '45%', width: '10%' }}
                        ></div>
                        
                        <div 
                          className="absolute h-full bg-yellow-500/20"
                          style={{ left: '30%', width: '40%' }}
                        ></div>
                        
                        {/* Curseur - plus large et visible */}
                        <div 
                          className="absolute h-full w-2 bg-white shadow-lg shadow-white/50 transition-all"
                          style={{ left: `${qteBarPosition}%`, transform: 'translateX(-50%)' }}
                        >
                          <div className="absolute -top-1 -bottom-1 -left-1 -right-1 bg-white/50 blur-sm"></div>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleQTEClick}
                      className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 px-8 py-6 rounded-lg text-white text-2xl font-bold transition-all shadow-lg"
                    >
                      BLOQUER ! 🛡️
                    </button>
                  </div>
                </div>
              )}

              {/* QTE Result */}
              {qteResult !== null && !qteActive && (
                <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
                  <div className="card max-w-md text-center">
                    <div className="text-6xl mb-4">
                      {qteResult >= 45 && qteResult <= 55 ? '🎯' : qteResult >= 30 && qteResult <= 70 ? '✅' : '❌'}
                    </div>
                    <div className="text-3xl font-bold text-white mb-2">
                      {qteResult >= 45 && qteResult <= 55 ? 'PERFECT !' : qteResult >= 30 && qteResult <= 70 ? 'BIEN !' : 'RATÉ !'}
                    </div>
                    <div className="text-gray-400">
                      Score : {qteResult.toFixed(0)}%
                    </div>
                  </div>
                </div>
              )}

              {/* Battle Log */}
              {battleLog.length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-bold text-amber-400 mb-3">📜 Journal</h3>
                  <div className="bg-black/60 rounded-lg p-4 max-h-48 overflow-y-auto space-y-1">
                    {battleLog.slice(-10).map((log, index) => (
                      <div key={index} className="text-sm text-gray-300">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Victory Screen */}
          {gameState === 'victory' && (
            <div className="card text-center">
              <div className="text-8xl mb-4">🎉</div>
              <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-400 mb-4">
                VICTOIRE TOTALE !
              </h2>
              <p className="text-xl text-white mb-6">
                Tu as vaincu toutes les vagues !
              </p>
              <div className="bg-black/60 rounded-lg p-6 mb-6 inline-block">
                <div className="text-gray-400 mb-2">Récompense Totale</div>
                <div className="text-5xl font-bold text-amber-400">
                  +{getTotalReward(5)} 💰
                </div>
              </div>
              <div className="flex gap-4 justify-center">
                <button onClick={resetGame} className="add-coins-btn">
                  🔄 Recommencer
                </button>
                <Link href="/" className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 px-6 py-3 rounded-lg text-white font-bold transition-all">
                  Retour
                </Link>
              </div>
            </div>
          )}

          {/* Defeat Screen */}
          {gameState === 'defeat' && (
            <div className="card text-center">
              <div className="text-8xl mb-4">💀</div>
              <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-gray-500 mb-4">
                Défaite...
              </h2>
              <p className="text-xl text-white mb-6">
                Vaincu à la vague {wave}
              </p>
              {wave > 1 && (
                <div className="bg-black/60 rounded-lg p-6 mb-6 inline-block">
                  <div className="text-gray-400 mb-2">Récompense</div>
                  <div className="text-5xl font-bold text-amber-400">
                    +{getTotalReward(wave - 1)} 💰
                  </div>
                </div>
              )}
              <div className="flex gap-4 justify-center">
                <button onClick={resetGame} className="add-coins-btn">
                  🔄 Réessayer
                </button>
                <Link href="/" className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 px-6 py-3 rounded-lg text-white font-bold transition-all">
                  Retour
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
