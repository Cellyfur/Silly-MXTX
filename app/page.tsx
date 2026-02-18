'use client';

import { useState, useEffect } from 'react';
import { Character, OwnedCharacter, drawCharacter, RARITY_CONFIG, MAX_CONSTELLATION, DUPLICATE_COINS } from '@/lib/characters';
import { getRevealBackgroundStyle } from '@/lib/backgrounds';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const PULL_COST = 160;
const INITIAL_COINS = 5000;
const USE_BACKGROUND_IMAGES = false; // Change à true pour utiliser des images

interface PullResult {
  character: Character;
  isNew: boolean;
  isDuplicate: boolean;
  previousConstellation: number;
  newConstellation: number;
  coinsReceived: number;
}

export default function Home() {
  const { user, logout, saveUserData, loadUserData } = useAuth();
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
      
      setPullResults(results);
      setInventory(updatedInventory);
      setCoins(coins - totalCost + bonusCoins);
      setIsPulling(false);
      setShowResults(true);
      setIsRevealing(false);
      
      setTimeout(() => {
        setIsRevealing(true);
      }, 500);
    }, 2000);
  };

  const handleNextCharacter = () => {
    if (currentResultIndex < pullResults.length - 1) {
      setCurrentResultIndex(currentResultIndex + 1);
      setIsRevealing(false);
      setTimeout(() => setIsRevealing(true), 100);
    } else {
      setShowResults(false);
      setShowSummary(true);
    }
  };

  const closeSummary = () => {
    setShowSummary(false);
    setPullResults([]);
    setCurrentResultIndex(0);
  };

  const addCoins = () => {
    setCoins(coins + 1000);
  };

  const resetGame = async () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser votre progression ?')) {
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
      <header className="header">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="header-title">✨ Gacha Game</h1>
          <div className="flex items-center gap-4">
            <div className="text-white/70 text-sm hidden md:block">
              {user.email}
            </div>
            <Link href="/combat" className="text-white hover:text-amber-400 transition-colors font-medium">
              ⚔️ Combat
            </Link>
            <Link href="/collection" className="text-white hover:text-amber-400 transition-colors font-medium">
              📚 Collection
            </Link>
            <div className="coins-display">
              <span className="text-2xl">💰</span>
              <span className="coins-value">{coins}</span>
            </div>
            <button onClick={addCoins} className="add-coins-btn">
              +1000 💰
            </button>
            <button onClick={handleLogout} className="text-white/70 hover:text-white transition-colors text-sm">
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
                <div className="text-white">
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
                <div className="text-white">
                  <div className="text-4xl mb-2">🎴🎴🎴</div>
                  <div className="text-xl font-bold mb-2">Tirage x10</div>
                  <div className="text-lg flex items-center justify-center gap-2">
                    <span>💰</span>
                    <span className="pull-btn-cost">{PULL_COST * 10}</span>
                  </div>
                </div>
                <div className="pull-btn-badge">POPULAIRE</div>
              </button>
            </div>

            {isPulling && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin text-6xl mb-4">✨</div>
                <p className="text-white text-xl font-medium">Invocation en cours...</p>
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
                        <span className="text-white font-medium">{rarity}</span>
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

          {!showResults && !isPulling && !showSummary && (
            <div className="mt-6 flex gap-4 justify-center">
              <Link href="/collection" className="bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 border border-gray-700 px-6 py-3 rounded-lg text-white font-medium transition-all">
                Voir ma Collection
              </Link>
              <Link href="/combat" className="bg-gradient-to-r from-red-800 to-red-900 hover:from-red-700 hover:to-red-800 border border-red-600 px-6 py-3 rounded-lg text-white font-medium transition-all">
                ⚔️ Arena de Combat
              </Link>
              <button onClick={resetGame} className="reset-btn">
                Réinitialiser
              </button>
            </div>
          )}
        </div>
      </main>

      {showResults && currentResult && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer"
          style={getRevealBackgroundStyle(currentResult.character.rarity, USE_BACKGROUND_IMAGES)}
          onClick={handleNextCharacter}
        >
          {/* Overlay semi-transparent si image de fond activée */}
          {USE_BACKGROUND_IMAGES && (
            <div className="absolute inset-0 bg-black/40"></div>
          )}
          
          <div className={`text-center relative z-10 ${isRevealing ? 'reveal-animation' : 'opacity-0'}`}>
            <div 
              className="relative mb-8"
              style={{
                filter: `drop-shadow(0 0 50px ${RARITY_CONFIG[currentResult.character.rarity].glowColor})`
              }}
            >
              <div className="text-9xl mb-4 animate-float">{currentResult.character.image}</div>
            </div>

            <div className="space-y-4">
              <h2 className="text-5xl font-bold text-white mb-2">{currentResult.character.name}</h2>
              
              {currentResult.isNew ? (
                <div className="inline-block px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white text-xl font-bold rounded-full mb-4 border-2 border-green-400">
                  ✨ NOUVEAU !
                </div>
              ) : currentResult.coinsReceived > 0 ? (
                <div className="inline-block px-6 py-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white text-xl font-bold rounded-full mb-4 border-2 border-amber-400">
                  💰 +{currentResult.coinsReceived} pièces
                </div>
              ) : (
                <div className="inline-block px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xl font-bold rounded-full mb-4 border-2 border-blue-400">
                  🌟 Constellation +1
                </div>
              )}

              {!currentResult.isNew && (
                <div className="mb-4">
                  <div className="text-white/70 text-sm mb-2">Constellation</div>
                  <div className="flex items-center justify-center gap-4">
                    <span className="text-3xl font-bold text-white/50">C{currentResult.previousConstellation}</span>
                    <span className="text-3xl text-white/50">→</span>
                    <span className="text-4xl font-bold text-amber-400">C{currentResult.newConstellation}</span>
                  </div>
                  {currentResult.newConstellation === MAX_CONSTELLATION && currentResult.coinsReceived === 0 && (
                    <div className="text-amber-400 text-sm mt-2 font-bold">MAX CONSTELLATION ATTEINTE !</div>
                  )}
                </div>
              )}
              
              <div className="flex justify-center gap-2 mb-4">
                {[...Array(RARITY_CONFIG[currentResult.character.rarity].stars)].map((_, i) => (
                  <span 
                    key={i} 
                    className={`text-4xl ${getStarsClass(currentResult.character.rarity)}`}
                    style={{
                      animation: `starPop 0.5s ease-out ${i * 0.1}s both`
                    }}
                  >
                    ⭐
                  </span>
                ))}
              </div>

              <div className={`inline-block px-8 py-3 rounded-full text-2xl font-bold ${getRarityClass(currentResult.character.rarity)} border-2`}
                   style={{
                     borderColor: RARITY_CONFIG[currentResult.character.rarity].color,
                     boxShadow: `0 0 30px ${RARITY_CONFIG[currentResult.character.rarity].glowColor}`
                   }}>
                {currentResult.character.rarity}
              </div>

              <div className="mt-8 text-white/70 text-lg">
                {currentResultIndex + 1} / {pullResults.length}
              </div>

              <div className="mt-4 text-white/50 text-sm animate-pulse">
                {currentResultIndex < pullResults.length - 1 
                  ? 'Cliquez pour continuer' 
                  : 'Cliquez pour voir le récapitulatif'}
              </div>
            </div>
          </div>
        </div>
      )}

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
                <span className="text-amber-400">✨</span>
                Résultats du Tirage
              </h2>
              <button onClick={closeSummary} className="summary-close-btn">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pb-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 perspective-1000">
                {pullResults.map((result, index) => (
                  <div
                    key={index}
                    className="summary-card-container"
                    style={{
                      animationDelay: `${index * 0.05}s`,
                    }}
                  >
                    <div
                      className={`summary-card ${RARITY_CONFIG[result.character.rarity].bgColor}`}
                      style={{
                        boxShadow: `0 0 20px ${RARITY_CONFIG[result.character.rarity].glowColor}, inset 0 0 30px ${RARITY_CONFIG[result.character.rarity].glowColor}`,
                      }}
                    >
                      {result.isNew && (
                        <div className="summary-new-badge">NEW</div>
                      )}

                      {!result.isNew && result.coinsReceived === 0 && (
                        <div className="summary-constellation-badge">C{result.newConstellation}</div>
                      )}

                      {result.coinsReceived > 0 && (
                        <div className="summary-coins-badge">+{result.coinsReceived}💰</div>
                      )}

                      <div className="text-6xl mb-3 mt-6">{result.character.image}</div>
                      <div className="text-white text-sm font-bold mb-2 px-2 truncate">
                        {result.character.name}
                      </div>

                      <div className="flex justify-center gap-1 mb-2">
                        {[...Array(RARITY_CONFIG[result.character.rarity].stars)].map((_, i) => (
                          <span key={i} className={`text-sm ${getStarsClass(result.character.rarity)}`}>
                            ⭐
                          </span>
                        ))}
                      </div>

                      <div className={`text-xs font-bold ${getRarityClass(result.character.rarity)}`}>
                        {result.character.rarity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center gap-4 pt-4 border-t border-white/10">
              <button onClick={closeSummary} className="summary-action-btn">
                Fermer
              </button>
              <Link href="/collection" className="summary-collection-btn">
                Voir la Collection
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
