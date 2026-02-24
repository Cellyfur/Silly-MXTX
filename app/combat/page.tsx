'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
import { CharacterImage } from '@/components/CharacterImage';

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

    // QTE : refs pour éviter tout problème de stale closure dans le setInterval
    const [qteActive, setQteActive] = useState(false);
    const [qteBarDisplay, setQteBarDisplay] = useState(0);
    const [qteResult, setQteResult] = useState<number | null>(null);
    const [qteTargetName, setQteTargetName] = useState<string>('');
    const qteIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const qtePosRef = useRef(0);
    const qteDirRef = useRef(1);
    const attackingEnemyRef = useRef<Enemy | null>(null);

    // Sync ref avec le state pour accès dans handleQTEClick
    useEffect(() => {
        attackingEnemyRef.current = attackingEnemy;
    }, [attackingEnemy]);

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

    // Boucle QTE : entièrement pilotée par des refs, zéro dépendance sur des states
    useEffect(() => {
        if (qteActive) {
            qtePosRef.current = 0;
            qteDirRef.current = 1;
            setQteBarDisplay(0);

            qteIntervalRef.current = setInterval(() => {
                let newPos = qtePosRef.current + qteDirRef.current * 2.5;
                if (newPos >= 100) { newPos = 100; qteDirRef.current = -1; }
                else if (newPos <= 0) { newPos = 0; qteDirRef.current = 1; }
                qtePosRef.current = newPos;
                setQteBarDisplay(newPos);
            }, 16);
        } else {
            if (qteIntervalRef.current) {
                clearInterval(qteIntervalRef.current);
                qteIntervalRef.current = null;
            }
        }
        return () => {
            if (qteIntervalRef.current) {
                clearInterval(qteIntervalRef.current);
                qteIntervalRef.current = null;
            }
        };
    }, [qteActive]);

    const toggleCharacterSelection = (charId: string) => {
        if (selectedTeam.includes(charId)) {
            setSelectedTeam(selectedTeam.filter(id => id !== charId));
        } else if (selectedTeam.length < 3) {
            setSelectedTeam([...selectedTeam, charId]);
        }
    };

    const startBattle = () => {
        if (selectedTeam.length !== 3) { alert('Sélectionne exactement 3 personnages !'); return; }
        const team = selectedTeam
            .map(id => inventory.find(char => char.id === id))
            .filter(Boolean)
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
        if (action === 'defend' || action === 'special') executePlayerAction(action, null);
    };

    const selectTarget = (targetId: string) => {
        if (!selectedAction) return;
        setSelectedTarget(targetId);
        executePlayerAction(selectedAction, targetId);
    };

    const executePlayerAction = (action: ActionType, targetId: string | null) => {
        const currentFighter = playerTeam[currentTurn];
        if (!currentFighter || currentFighter.currentHp <= 0) { nextPlayerTurn(); return; }

        let target: Enemy | Fighter | null = null;
        if (action !== 'defend') {
            if (action === 'special' && currentFighter.rarity === 'Common') {
                target = null;
            } else {
                target = enemies.find(e => e.id === targetId) || null;
                if (!target || target.hp <= 0) { alert('Cible invalide !'); return; }
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
            newEnemies.forEach(enemy => { if (enemy.hp > 0) enemy.hp = Math.max(0, enemy.hp - result.damage); });
        }
        setEnemies(newEnemies);
        setPlayerTeam(newPlayerTeam);
        setBattleLog(prev => [...prev, result.message]);

        if (newEnemies.every(e => e.hp <= 0)) { setTimeout(() => handleWaveVictory(), 1000); return; }
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
            if (nextFighter.currentHp <= 0) { setCurrentTurn(nextTurn); setTimeout(() => nextPlayerTurn(), 100); }
            else { updateTurnEffects(nextFighter); setCurrentTurn(nextTurn); }
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

    const startQTE = (_enemy: Enemy) => {
        setQteResult(null);
        // Pré-calculer la cible pour l'afficher dans le header du QTE
        setPlayerTeam(currentTeam => {
            const aliveFighters = currentTeam.filter(f => f.currentHp > 0);
            if (aliveFighters.length > 0) {
                const target = aliveFighters[Math.floor(Math.random() * aliveFighters.length)];
                setQteTargetName(target.name);
            }
            return currentTeam;
        });
        setQteActive(true);
        setGameState('qte');
    };

    // Clic QTE : lit qtePosRef.current, jamais le state
    const handleQTEClick = useCallback(() => {
        if (!qteActive) return;

        // Arrêter l'interval immédiatement
        if (qteIntervalRef.current) {
            clearInterval(qteIntervalRef.current);
            qteIntervalRef.current = null;
        }
        setQteActive(false);

        const score = qtePosRef.current; // position réelle, toujours fraîche
        setQteResult(score);

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

        const currentEnemy = attackingEnemyRef.current;
        if (!currentEnemy) return;

        setPlayerTeam(currentTeam => {
            const aliveFighters = currentTeam.filter(f => f.currentHp > 0);
            if (aliveFighters.length === 0) return currentTeam;

            // Utiliser la cible pré-calculée (affichée au joueur), sinon fallback aléatoire
            const target = aliveFighters.find(f => f.name === qteTargetName)
                ?? aliveFighters[Math.floor(Math.random() * aliveFighters.length)];
            const baseDamage = currentEnemy.attack;
            const variance = 0.9 + Math.random() * 0.2;
            let damage = Math.floor(baseDamage * variance * damageMultiplier);
            if (target.isDefending) damage = Math.floor(damage * 0.5);
            target.currentHp = Math.max(0, target.currentHp - damage);

            // Message clair : "NomMonstre attaque NomPersonnage pour X dégâts !"
            const attackMessage = damage > 0
                ? `${currentEnemy.name} attaque ${target.name} pour ${damage} dégâts !`
                : `${currentEnemy.name} attaque ${target.name}… mais ${target.name} esquive complètement !`;

            setBattleLog(prev => [...prev, resultText, attackMessage]);

            const updatedTeam = [...currentTeam];
            if (updatedTeam.every(f => f.currentHp <= 0)) {
                setTimeout(() => handleDefeat(), 1000);
                return updatedTeam;
            }

            setTimeout(() => {
                setQteResult(null);
                setEnemies(currentEnemies => {
                    const aliveEnemies = currentEnemies.filter(e => e.hp > 0);
                    const currentEnemyIndex = aliveEnemies.findIndex(e => e.id === currentEnemy.id);
                    if (currentEnemyIndex < aliveEnemies.length - 1) {
                        setTimeout(() => {
                            const nextEnemy = aliveEnemies[currentEnemyIndex + 1];
                            setAttackingEnemy(nextEnemy);
                            startQTE(nextEnemy);
                        }, 500);
                    } else {
                        setTimeout(() => {
                            setCurrentTurn(0);
                            updatedTeam.forEach(f => updateTurnEffects(f));
                            setGameState('player-turn');
                            setAttackingEnemy(null);
                        }, 1000);
                    }
                    return currentEnemies;
                });
            }, 1500);

            return updatedTeam;
        });
    }, [qteActive]);

    const handleWaveVictory = () => {
        setBattleLog(prev => [...prev, `🎉 Victoire de la vague ${wave} !`]);
        if (wave >= 5) {
            const totalReward = getTotalReward(wave);
            setCoins(c => c + totalReward);
            saveUserData(coins + totalReward, inventory);
            setGameState('victory');
        } else {
            setTimeout(() => nextWave(), 2000);
        }
    };

    const nextWave = () => {
        const nextWaveNum = wave + 1;
        setWave(nextWaveNum);
        setEnemies(nextWaveNum === 5 ? [generateBoss(nextWaveNum)] : generateEnemies(nextWaveNum));
        setBattleLog(prev => [...prev, `🌊 Vague ${nextWaveNum} commence !`]);
        setCurrentTurn(0);
        setGameState('player-turn');
    };

    const handleDefeat = () => {
        const reward = getTotalReward(wave - 1);
        if (reward > 0) {
            setCoins(c => c + reward);
            saveUserData(coins + reward, inventory);
        }
        setBattleLog(prev => [...prev, `💀 Défaite à la vague ${wave}...`]);
        setGameState('defeat');
    };

    const resetGame = () => {
        setSelectedTeam([]); setGameState('team-selection'); setWave(1);
        setPlayerTeam([]); setEnemies([]); setBattleLog([]); setCurrentTurn(0);
        setSelectedAction(null); setSelectedTarget(null); setAttackingEnemy(null);
        setQteActive(false); setQteResult(null); setQteTargetName('');
    };

    if (!user) return null;
    const currentFighter = playerTeam[currentTurn];

    return (
        <div className="min-h-screen">
            <header className="header">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="header-title">⚔️ Combat Arena</h1>
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-white hover:text-amber-400 transition-colors font-medium">← Retour</Link>
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
                                    <div className="text-6xl mb-4">📭</div>
                                    <p className="text-gray-400 text-xl mb-4">Aucun personnage dans ta collection !</p>
                                    <Link href="/" className="add-coins-btn">Faire des tirages</Link>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
                                        {inventory.map((char) => {
                                            const isSelected = selectedTeam.includes(char.id);
                                            return (
                                                <button key={char.id} onClick={() => toggleCharacterSelection(char.id)}
                                                        className={`p-3 rounded-lg border-2 transition-all text-center ${isSelected ? 'border-amber-500 bg-amber-900/30 scale-105' : 'border-gray-700 bg-gray-800/50 hover:border-gray-500'}`}>
                                                    <CharacterImage src={char.image} alt={char.name} size="medium" className="mx-auto mb-2" />
                                                    <div className="text-white font-bold text-sm">{char.name}</div>
                                                    <div className="text-xs text-gray-400">C{char.constellation}</div>
                                                    <div className="text-xs text-green-400">❤️ {Math.floor((char.rarity === 'Common' ? 100 : char.rarity === 'Rare' ? 150 : 200) * (1 + char.constellation * 0.1))}</div>
                                                    <div className="text-xs text-red-400">⚔️ {Math.floor((char.rarity === 'Common' ? 20 : char.rarity === 'Rare' ? 30 : 40) * (1 + char.constellation * 0.1))}</div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div className="text-center">
                                        <button
                                            onClick={startBattle}
                                            disabled={selectedTeam.length !== 3}
                                            style={{
                                                fontFamily: "'Shippori Mincho', serif",
                                                letterSpacing: '0.08em',
                                                fontSize: '1.1rem',
                                                fontWeight: 700,
                                                padding: '0.9rem 2.5rem',
                                                borderRadius: '0.75rem',
                                                border: selectedTeam.length === 3 ? '1px solid #8b1010' : '1px solid rgba(26,20,16,0.2)',
                                                background: selectedTeam.length === 3 ? 'var(--ink)' : 'rgba(26,20,16,0.08)',
                                                color: selectedTeam.length === 3 ? 'var(--ivory)' : 'rgba(26,20,16,0.35)',
                                                cursor: selectedTeam.length === 3 ? 'pointer' : 'not-allowed',
                                                transition: 'all 0.2s ease',
                                                boxShadow: selectedTeam.length === 3 ? '0 4px 20px rgba(26,20,16,0.2)' : 'none',
                                                position: 'relative',
                                                overflow: 'hidden',
                                            }}
                                            onMouseEnter={e => {
                                                if (selectedTeam.length === 3) {
                                                    e.currentTarget.style.background = 'var(--ink-soft)';
                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                    e.currentTarget.style.boxShadow = '0 6px 28px rgba(26,20,16,0.28)';
                                                }
                                            }}
                                            onMouseLeave={e => {
                                                if (selectedTeam.length === 3) {
                                                    e.currentTarget.style.background = 'var(--ink)';
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(26,20,16,0.2)';
                                                }
                                            }}
                                        >
                                            {selectedTeam.length === 3 ? '⚔️ Commencer le Combat' : `${selectedTeam.length} / 3 personnages sélectionnés`}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Battle Screen */}
                    {(gameState === 'player-turn' || gameState === 'enemy-turn' || gameState === 'qte') && (
                        <div className="space-y-6">
                            <div className="card text-center">
                                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-500 mb-2">🌊 Vague {wave} / 5</h2>
                                <p className="text-gray-400">Récompense : {WAVE_REWARDS[wave] || 100} 💰</p>
                                {gameState === 'player-turn' && currentFighter && (
                                    <div className="mt-3 text-xl text-green-400 font-bold">🎯 Tour de {currentFighter.name}</div>
                                )}
                                {gameState === 'enemy-turn' && <div className="mt-3 text-xl text-red-400 font-bold">👹 Tour des Ennemis</div>}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Player Team */}
                                <div className="card">
                                    <h3 className="text-xl font-bold text-green-400 mb-4">👥 Ton Équipe</h3>
                                    <div className="space-y-3">
                                        {playerTeam.map((fighter, index) => (
                                            <div key={fighter.id} className={`bg-black/60 rounded-lg p-3 border transition-all ${index === currentTurn && gameState === 'player-turn' ? 'border-amber-500 ring-2 ring-amber-500/50' : 'border-green-600/30'}`}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <CharacterImage src={fighter.image} alt={fighter.name} size="small" />
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
                                                        <div className={`font-bold ${fighter.currentHp > 0 ? 'text-green-400' : 'text-red-500'}`}>{fighter.currentHp} / {fighter.maxHp}</div>
                                                    </div>
                                                </div>
                                                <div className="bg-black/50 rounded-full h-2 overflow-hidden">
                                                    <div className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-500" style={{ width: `${(fighter.currentHp / fighter.maxHp) * 100}%` }} />
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
                                            <button key={enemy.id} onClick={() => gameState === 'player-turn' && selectTarget(enemy.id)}
                                                    disabled={enemy.hp <= 0 || gameState !== 'player-turn' || !selectedAction || selectedAction === 'defend'}
                                                    className={`w-full bg-black/60 rounded-lg p-3 border transition-all text-left ${enemy.hp <= 0 ? 'border-gray-800 opacity-50' : selectedTarget === enemy.id && selectedAction ? 'border-red-500 ring-2 ring-red-500/50' : 'border-red-600/30 hover:border-red-500'}`}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <CharacterImage src={enemy.image} alt={enemy.name} size="small" />
                                                        <div>
                                                            <div className="text-white font-bold">{enemy.name}</div>
                                                            <div className="text-xs text-gray-400">⚔️ {enemy.attack}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm text-gray-400">HP</div>
                                                        <div className={`font-bold ${enemy.hp > 0 ? 'text-red-400' : 'text-gray-600'}`}>{enemy.hp} / {enemy.maxHp}</div>
                                                    </div>
                                                </div>
                                                <div className="bg-black/50 rounded-full h-2 overflow-hidden">
                                                    <div className="h-full bg-gradient-to-r from-red-800 to-red-500 transition-all duration-500" style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }} />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            {gameState === 'player-turn' && currentFighter && currentFighter.currentHp > 0 && (
                                <div className="card">
                                    <h3 className="text-xl font-bold text-amber-400 mb-4">⚡ Actions de {currentFighter.name}</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { action: 'attack' as ActionType, icon: '⚔️', label: 'Attaque', desc: 'Dégâts normaux', color: 'red' },
                                            { action: 'power-attack' as ActionType, icon: '💥', label: 'Puissante', desc: '1.5x, 70% précision', color: 'orange' },
                                            { action: 'defend' as ActionType, icon: '🛡️', label: 'Défense', desc: '-50% dégâts', color: 'blue' },
                                            { action: 'special' as ActionType, icon: '✨', label: 'Spéciale', desc: currentFighter.rarity === 'Common' ? 'Soin 20 HP' : currentFighter.rarity === 'Rare' ? 'Zone' : '+30% ATK', color: 'purple' },
                                        ].map(({ action, icon, label, desc, color }) => (
                                            <button key={action} onClick={() => selectAction(action)}
                                                    className={`p-4 rounded-lg border-2 transition-all ${selectedAction === action ? `bg-${color}-900/50 border-${color}-500` : `bg-gray-800 border-gray-700 hover:border-${color}-500`}`}>
                                                <div className="text-3xl mb-2">{icon}</div>
                                                <div className="text-white font-bold">{label}</div>
                                                <div className="text-xs text-gray-400">{desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                    {selectedAction && selectedAction !== 'defend' && selectedAction !== 'special' && (
                                        <div className="mt-4 text-center text-amber-400 animate-pulse">👆 Sélectionne une cible !</div>
                                    )}
                                </div>
                            )}

                            {/* QTE */}
                            {gameState === 'qte' && qteActive && attackingEnemy && (
                                <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
                                    <div className="card max-w-2xl w-full">
                                        <h2 className="text-3xl font-bold text-red-400 mb-2 text-center">
                                            <CharacterImage src={attackingEnemy.image} alt={attackingEnemy.name} size="medium" className="inline-block mr-2" />
                                            {attackingEnemy.name} attaque !
                                        </h2>
                                        {qteTargetName && (
                                            <p className="text-center text-gray-300 mb-4">
                                                Cible : <span className="text-amber-300 font-bold">{qteTargetName}</span> est visé·e !
                                            </p>
                                        )}

                                        <div className="mb-6">
                                            <div className="text-center text-gray-300 text-base mb-4">
                                                Clique quand le curseur est dans la <span className="text-green-400 font-bold">zone verte</span> 🎯
                                            </div>

                                            {/* Légende */}
                                            <div className="flex text-xs mb-1 px-1" style={{ justifyContent: 'space-between' }}>
                                                <span className="text-gray-500">Raté</span>
                                                <span className="text-yellow-400">Partiel (30-70%)</span>
                                                <span className="text-green-400 font-bold">PERFECT (45-55%)</span>
                                                <span className="text-yellow-400">Partiel</span>
                                                <span className="text-gray-500">Raté</span>
                                            </div>

                                            <div className="relative h-14 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-600">
                                                {/* Zone partielle jaune */}
                                                <div className="absolute h-full bg-yellow-500/15 border-x border-yellow-500/40" style={{ left: '30%', width: '40%' }} />
                                                {/* Zone parfaite verte */}
                                                <div className="absolute h-full bg-green-500/35 border-x-2 border-green-400" style={{ left: '45%', width: '10%' }} />
                                                {/* Curseur blanc lumineux */}
                                                <div className="absolute top-0 h-full w-3 rounded"
                                                     style={{ left: `${qteBarDisplay}%`, transform: 'translateX(-50%)', background: 'white', boxShadow: '0 0 14px 5px rgba(255,255,255,0.75)' }} />
                                            </div>
                                        </div>

                                        <button onClick={handleQTEClick}
                                                className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 px-8 py-6 rounded-lg text-white text-2xl font-bold transition-all shadow-lg active:scale-95">
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
                                        <div className="text-gray-400">Position : {qteResult.toFixed(0)}%</div>
                                    </div>
                                </div>
                            )}

                            {/* Battle Log */}
                            {battleLog.length > 0 && (
                                <div className="card">
                                    <h3 className="text-lg font-bold text-amber-400 mb-3">📜 Journal</h3>
                                    <div className="bg-black/60 rounded-lg p-4 max-h-48 overflow-y-auto space-y-1">
                                        {battleLog.slice(-10).map((log, index) => (
                                            <div key={index} className="text-sm text-gray-300">{log}</div>
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
                            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-400 mb-4">VICTOIRE TOTALE !</h2>
                            <p className="text-xl text-white mb-6">Tu as vaincu toutes les vagues !</p>
                            <div className="bg-black/60 rounded-lg p-6 mb-6 inline-block">
                                <div className="text-gray-400 mb-2">Récompense Totale</div>
                                <div className="text-5xl font-bold text-amber-400">+{getTotalReward(5)} 💰</div>
                            </div>
                            <div className="flex gap-4 justify-center">
                                <button onClick={resetGame} className="add-coins-btn">🔄 Recommencer</button>
                                <Link href="/" className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 px-6 py-3 rounded-lg text-white font-bold transition-all">Retour</Link>
                            </div>
                        </div>
                    )}

                    {/* Defeat Screen */}
                    {gameState === 'defeat' && (
                        <div className="card text-center">
                            <div className="text-8xl mb-4">💀</div>
                            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-gray-500 mb-4">Défaite...</h2>
                            <p className="text-xl text-white mb-6">Vaincu à la vague {wave}</p>
                            {wave > 1 && (
                                <div className="bg-black/60 rounded-lg p-6 mb-6 inline-block">
                                    <div className="text-gray-400 mb-2">Récompense</div>
                                    <div className="text-5xl font-bold text-amber-400">+{getTotalReward(wave - 1)} 💰</div>
                                </div>
                            )}
                            <div className="flex gap-4 justify-center">
                                <button onClick={resetGame} className="add-coins-btn">🔄 Réessayer</button>
                                <Link href="/" className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 px-6 py-3 rounded-lg text-white font-bold transition-all">Retour</Link>
                            </div>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}