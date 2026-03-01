'use client';

import { useState, useEffect } from 'react';
import { Character, OwnedCharacter, drawCharacter, RARITY_CONFIG, MAX_CONSTELLATION, DUPLICATE_COINS } from '@/lib/characters';
import { getRevealBackgroundStyle } from '@/lib/backgrounds';
import { CharacterImage } from '@/components/CharacterImage';
import { TutorialModal } from '@/components/TutorialModal';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const PULL_COST = 160;
const INITIAL_COINS = 5000;
const USE_BACKGROUND_IMAGES = true;

interface PullResult {
    character: Character;
    isNew: boolean;
    isDuplicate: boolean;
    previousConstellation: number;
    newConstellation: number;
    coinsReceived: number;
}

export default function Home() {
    const { user, logout, saveUserData, loadUserData, markTutorialSeen } = useAuth();
    const router = useRouter();

    const [coins, setCoins] = useState(INITIAL_COINS);
    const [inventory, setInventory] = useState<OwnedCharacter[]>([]);
    const [pullResults, setPullResults] = useState<PullResult[]>([]);
    const [currentResultIndex, setCurrentResultIndex] = useState(0);
    const [isPulling, setIsPulling] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [isRevealing, setIsRevealing] = useState(false);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [showTutorial, setShowTutorial] = useState(false);

    useEffect(() => {
        if (!user) {
            router.push('/auth');
        }
    }, [user, router]);

    useEffect(() => {
        if (user && !dataLoaded) {
            loadUserData().then((data) => {
                if (data) {
                    setCoins(data.coins);
                    setInventory(data.inventory);
                    // Afficher le tutoriel si pas encore vu
                    if (!data.hasSeenTutorial) {
                        setShowTutorial(true);
                    }
                }
                setDataLoaded(true);
            });
        }
    }, [user, loadUserData, dataLoaded]);

    useEffect(() => {
        if (user && dataLoaded) {
            saveUserData(coins, inventory);
        }
    }, [coins, inventory, user, saveUserData, dataLoaded]);

    const handleTutorialComplete = async () => {
        setShowTutorial(false);
        await markTutorialSeen();
    };

    const handlePull = (count: 1 | 10) => {
        const totalCost = PULL_COST * count;

        if (coins < totalCost) {
            alert(`Pas assez de pièces ! Il vous faut ${totalCost} pièces.`);
            return;
        }

        setIsPulling(true);
        setShowResults(false);
        setShowSummary(false);
        setCurrentResultIndex(0);

        setTimeout(() => {
            const results: PullResult[] = [];
            let updatedInventory = [...inventory];
            let bonusCoins = 0;

            for (let i = 0; i < count; i++) {
                const drawnChar = drawCharacter();
                const existingChar = updatedInventory.find(c => c.id === drawnChar.id);

                if (existingChar) {
                    const previousConstellation = existingChar.constellation;

                    if (existingChar.constellation < MAX_CONSTELLATION) {
                        existingChar.constellation += 1;
                        existingChar.count += 1;

                        results.push({
                            character: drawnChar,
                            isNew: false,
                            isDuplicate: true,
                            previousConstellation,
                            newConstellation: existingChar.constellation,
                            coinsReceived: 0,
                        });
                    } else {
                        existingChar.count += 1;
                        bonusCoins += DUPLICATE_COINS;

                        results.push({
                            character: drawnChar,
                            isNew: false,
                            isDuplicate: true,
                            previousConstellation: MAX_CONSTELLATION,
                            newConstellation: MAX_CONSTELLATION,
                            coinsReceived: DUPLICATE_COINS,
                        });
                    }
                } else {
                    const newChar: OwnedCharacter = {
                        ...drawnChar,
                        constellation: 0,
                        count: 1,
                    };
                    updatedInventory.push(newChar);

                    results.push({
                        character: drawnChar,
                        isNew: true,
                        isDuplicate: false,
                        previousConstellation: 0,
                        newConstellation: 0,
                        coinsReceived: 0,
                    });
                }
            }

            const newCoins = coins - totalCost + bonusCoins;
            setCoins(newCoins);
            setInventory(updatedInventory);
            setPullResults(results);
            setIsPulling(false);
            setShowResults(true);
            setCurrentResultIndex(0);
            setIsRevealing(true);

            setTimeout(() => setIsRevealing(false), 900);
        }, 800);
    };

    const handleRevealClick = () => {
        if (isRevealing) return;

        if (currentResultIndex < pullResults.length - 1) {
            setCurrentResultIndex(prev => prev + 1);
            setIsRevealing(true);
            setTimeout(() => setIsRevealing(false), 900);
        } else {
            setShowResults(false);
            setShowSummary(true);
        }
    };

    const closeSummary = () => {
        setShowSummary(false);
        setPullResults([]);
    };

    const addCoins = () => {
        setCoins(prev => prev + 1000);
    };

    const handleReset = async () => {
        if (confirm('Réinitialiser toutes vos données ?')) {
            setCoins(INITIAL_COINS);
            setInventory([]);
            setPullResults([]);
            setShowResults(false);
            setShowSummary(false);
            if (user) {
                await saveUserData(INITIAL_COINS, []);
            }
        }
    };

    const handleLogout = async () => {
        await logout();
        router.push('/auth');
    };

    const getStarsClass = (rarity: Character['rarity']) => {
        switch(rarity) {
            case 'Common': return 'stars-common';
            case 'Rare': return 'stars-rare';
            case 'Legendary': return 'stars-legendary';
        }
    };

    const getRarityClass = (rarity: Character['rarity']) => {
        switch(rarity) {
            case 'Common': return 'char-rarity-common';
            case 'Rare': return 'char-rarity-rare';
            case 'Legendary': return 'char-rarity-legendary';
        }
    };

    const currentResult = pullResults[currentResultIndex];

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen">
            {showTutorial && (
                <TutorialModal onComplete={handleTutorialComplete} />
            )}

            <header className="header">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <Link href="/" className="nav-link">
                        <h1 className="header-title">墨香铜臭</h1>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/profile" className="nav-link">
                            {user.email}
                        </Link>
                        <Link href="/combat" className="nav-link">
                            ⚔️ Combat
                        </Link>
                        <Link href="/collection" className="nav-link">
                            📚 Collection
                        </Link>
                        <div className="coins-display">
                            <span className="text-2xl">💰</span>
                            <span className="coins-value">{coins}</span>
                        </div>
                        {/*}  <button onClick={addCoins} className="add-coins-btn">
                            +1000 💰
                        </button> */}
                        <button
                            onClick={handleLogout}
                            className="text-sm transition-opacity hover:opacity-60"
                            style={{ color: '#291400' }}
                        >
                            Déconnexion
                        </button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <div className="card">
                        <h2 className="card-title">Invoquer des Personnages</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <button
                                onClick={() => handlePull(1)}
                                disabled={isPulling || coins < PULL_COST || showResults || showSummary}
                                className="pull-btn-single"
                            >
                                <div style={{ color: '#291400' }}>
                                    <div className="text-4xl mb-2">🎴</div>
                                    <div className="text-xl font-bold mb-2">Tirage x1</div>
                                    <div className="text-lg flex items-center justify-center gap-2">
                                        <span>💰</span>
                                        <span className="pull-btn-cost">{PULL_COST}</span>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => handlePull(10)}
                                disabled={isPulling || coins < PULL_COST * 10 || showResults || showSummary}
                                className="pull-btn-multi"
                            >
                                <div style={{ color: '#291400' }}>
                                    <div className="text-4xl mb-2">🎴🎴🎴</div>
                                    <div className="text-xl font-bold mb-2">Tirage x10</div>
                                    <div className="text-lg flex items-center justify-center gap-2">
                                        <span>💰</span>
                                        <span className="pull-btn-cost">{PULL_COST * 10}</span>
                                    </div>
                                </div>
                            </button>
                        </div>

                        {isPulling && (
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin text-6xl mb-4">✨</div>
                                <p className="text-xl font-medium" style={{ color: '#291400' }}>Invocation en cours...</p>
                            </div>
                        )}

                        {!showResults && !isPulling && !showSummary && (
                            <div className="rates-container">
                                <h4 className="rates-title">Taux de Drops</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                    {Object.entries(RARITY_CONFIG).map(([rarity, config]) => (
                                        <div key={rarity} className="rate-item">
                                            <div className="flex items-center gap-2">
                                                <div className="flex gap-0.5">
                                                    {[...Array(config.stars)].map((_, i) => (
                                                        <span key={i} className="text-xs">⭐</span>
                                                    ))}
                                                </div>
                                                <span className="font-medium" style={{ color: '#291400' }}>{rarity}</span>
                                            </div>
                                            <span className={`${config.textColor} font-bold`}>
                                                {(config.chance * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Boutons utilitaires */}
                    <div className="flex gap-3 mt-4 justify-end">
                        <button
                            onClick={() => setShowTutorial(true)}
                            className="text-sm transition-opacity hover:opacity-70"
                            style={{ color: 'rgba(41,20,0,0.5)', fontFamily: "'Inter', sans-serif" }}
                        >
                            📖 Tutoriel
                        </button>
                        <button
                            onClick={handleReset}
                            className="text-sm transition-opacity hover:opacity-70"
                            style={{ color: 'rgba(41,20,0,0.5)', fontFamily: "'Inter', sans-serif" }}
                        >
                            Réinitialiser
                        </button>
                    </div>
                </div>
            </main>

            {showResults && currentResult && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer"
                    style={getRevealBackgroundStyle(currentResult.character.rarity, USE_BACKGROUND_IMAGES)}
                    onClick={handleRevealClick}
                >
                    {USE_BACKGROUND_IMAGES && (
                        <div className="absolute inset-0 bg-black/80"></div>
                    )}

                    <div className={`relative z-10 w-full max-w-6xl mx-auto px-8 ${isRevealing ? 'reveal-animation' : ''}`}>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                            {/* Partie gauche - Infos */}
                            <div className="text-left space-y-6">
                                <h2 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">
                                    {currentResult.character.name}
                                </h2>

                                <div className="flex gap-3 mb-6">
                                    {[...Array(RARITY_CONFIG[currentResult.character.rarity].stars)].map((_, i) => (
                                        <span
                                            key={i}
                                            className={`text-5xl ${getStarsClass(currentResult.character.rarity)}`}
                                            style={{
                                                animation: `starPop 0.5s ease-out ${i * 0.1}s both`,
                                                filter: `drop-shadow(0 0 10px ${RARITY_CONFIG[currentResult.character.rarity].glowColor})`
                                            }}
                                        >⭐</span>
                                    ))}
                                </div>

                                <div className="space-y-4">
                                    {currentResult.isNew ? (
                                        <div className="inline-block px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white text-2xl font-bold rounded-lg border-2 border-green-400 shadow-lg shadow-green-500/50">
                                            <span className="text-3xl mr-2">✨</span>
                                            NEW
                                        </div>
                                    ) : currentResult.coinsReceived > 0 ? (
                                        <div className="inline-block px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white text-2xl font-bold rounded-lg border-2 border-amber-400 shadow-lg shadow-amber-500/50">
                                            <span className="text-3xl mr-2">💰</span>
                                            +{currentResult.coinsReceived}
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="inline-block px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-2xl font-bold rounded-lg border-2 border-blue-400 shadow-lg shadow-blue-500/50">
                                                <span className="text-3xl mr-2">🌟</span>
                                                Constellation +1
                                            </div>

                                            <div className="bg-black/60 rounded-lg p-4 inline-block">
                                                <div className="text-white/70 text-sm mb-2">Constellation</div>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-4xl font-bold text-white/50">C{currentResult.previousConstellation}</span>
                                                    <span className="text-3xl text-white/50">→</span>
                                                    <span className="text-5xl font-bold text-amber-400">C{currentResult.newConstellation}</span>
                                                </div>
                                                {currentResult.newConstellation === MAX_CONSTELLATION && (
                                                    <div className="text-amber-400 text-sm mt-2 font-bold">✨ MAX !</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className={`inline-block px-8 py-4 rounded-lg text-3xl font-bold ${getRarityClass(currentResult.character.rarity)} border-2`}
                                     style={{
                                         borderColor: RARITY_CONFIG[currentResult.character.rarity].color,
                                         boxShadow: `0 0 30px ${RARITY_CONFIG[currentResult.character.rarity].glowColor}`
                                     }}>
                                    {currentResult.character.rarity}
                                </div>

                                <div className="text-white/50 text-lg mt-8">
                                    {currentResultIndex + 1} / {pullResults.length}
                                </div>
                            </div>

                            {/* Partie droite - Image */}
                            <div className="flex justify-center lg:justify-end">
                                <div
                                    className="relative"
                                    style={{
                                        filter: `drop-shadow(0 0 60px ${RARITY_CONFIG[currentResult.character.rarity].glowColor})`
                                    }}
                                >
                                    <div className="animate-float">
                                        <CharacterImage
                                            src={currentResult.character.image}
                                            alt={currentResult.character.name}
                                            size="xxlarge"
                                            className="scale-[2.5]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/50 text-sm animate-pulse">
                            {currentResultIndex < pullResults.length - 1 ? 'Cliquez pour continuer' : 'Cliquez pour le récapitulatif'}
                        </div>
                    </div>
                </div>
            )}

            {/* Écran récapitulatif */}
            {showSummary && pullResults.length > 0 && (
                <div className="summary-screen-bg">
                    <div className="absolute inset-0 opacity-30">
                        {[...Array(50)].map((_, i) => (
                            <div
                                key={i}
                                className="summary-star"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 2}s`,
                                }}
                            />
                        ))}
                    </div>

                    <div className="relative container mx-auto px-4 py-8 h-full flex flex-col">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="summary-title">
                                <span style={{ color: 'var(--carmine)' }}>✨</span>
                                Résultats du Tirage
                            </h2>
                            <button onClick={closeSummary} className="summary-close-btn">✕</button>
                        </div>

                        <div className="flex-1 overflow-y-auto pb-8">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {pullResults.map((result, index) => (
                                    <div
                                        key={index}
                                        className={`summary-card summary-card-${result.character.rarity.toLowerCase()}`}
                                    >
                                        <div className="relative mb-3">
                                            <CharacterImage
                                                src={result.character.image}
                                                alt={result.character.name}
                                                size="large"
                                                className="mx-auto"
                                            />
                                            {result.isNew && (
                                                <div className="summary-new-badge">NOUVEAU</div>
                                            )}
                                            {result.coinsReceived > 0 && (
                                                <div className="summary-coins-badge">+{result.coinsReceived}💰</div>
                                            )}
                                            {result.isDuplicate && result.coinsReceived === 0 && (
                                                <div className="summary-constellation-badge">C{result.newConstellation}</div>
                                            )}
                                        </div>
                                        <div className="char-name text-xs">{result.character.name}</div>
                                        <div className={`${getStarsClass(result.character.rarity)} text-xs`}>
                                            {'★'.repeat(RARITY_CONFIG[result.character.rarity].stars)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-4 justify-center mt-4 flex-wrap">
                            <button onClick={closeSummary} className="summary-action-btn">
                                ✕ Fermer
                            </button>
                            <Link href="/collection" className="summary-collection-btn">
                                📚 Voir la collection
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}