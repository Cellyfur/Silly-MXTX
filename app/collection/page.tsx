'use client';

import { useState, useEffect } from 'react';
import { OwnedCharacter, RARITY_CONFIG, MAX_CONSTELLATION, CHARACTERS } from '@/lib/characters';
import { CharacterImage } from '@/components/CharacterImage';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Collection() {
    const { user, loadUserData } = useAuth();
    const router = useRouter();
    const [inventory, setInventory] = useState<OwnedCharacter[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            router.push('/auth');
            return;
        }

        loadUserData().then((data) => {
            if (data) {
                setInventory(data.inventory);
            }
            setLoading(false);
        });
    }, [user, loadUserData, router]);

    const getStarsClass = (rarity: 'Common' | 'Rare' | 'Legendary') => {
        switch(rarity) {
            case 'Common': return 'stars-common';
            case 'Rare': return 'stars-rare';
            case 'Legendary': return 'stars-legendary';
        }
    };

    const findCharacter = (id: string) => {
        return inventory.find(char => char.id === id);
    };

    if (!user || loading) {
        return null;
    }

    return (
        <div className="min-h-screen">
            <header className="header">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <Link href="/" className="nav-link">
                        <h1 className="header-title">墨香铜臭</h1>
                    </Link>
                    <Link href="/" className="add-coins-btn">
                        ← Retour aux Tirages
                    </Link>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="max-w-6xl mx-auto">
                    <div className="card">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="card-title">Tous les Personnages ({inventory.length}/{CHARACTERS.length})</h2>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {CHARACTERS.map((char) => {
                                const ownedChar = findCharacter(char.id);
                                const isOwned = ownedChar !== undefined;

                                return (
                                    <div
                                        key={char.id}
                                        className={`inventory-card relative group ${!isOwned ? 'opacity-40 grayscale' : ''}`}
                                        style={{
                                            boxShadow: isOwned ? `0 0 15px ${RARITY_CONFIG[char.rarity].glowColor}` : 'none'
                                        }}
                                    >
                                        {isOwned && ownedChar && (
                                            <div className="absolute top-2 right-2 bg-black/90 rounded-full w-8 h-8 flex items-center justify-center border border-amber-500">
                        <span className={`text-xs font-bold ${ownedChar.constellation === MAX_CONSTELLATION ? 'text-amber-400' : 'text-white'}`}>
                          C{ownedChar.constellation}
                        </span>
                                            </div>
                                        )}

                                        {isOwned && ownedChar && ownedChar.constellation === MAX_CONSTELLATION && (
                                            <div className="absolute top-2 left-2 text-xl" title="Constellation Max">
                                                ✨
                                            </div>
                                        )}

                                        {!isOwned && (
                                            <div className="absolute top-2 left-2 text-xl opacity-50">
                                                🔒
                                            </div>
                                        )}

                                        <div className={`mb-2 mt-4 flex justify-center ${!isOwned ? 'opacity-30' : ''}`}>
                                            <CharacterImage
                                                src={char.image}
                                                alt={char.name}
                                                size="medium"
                                                crop="head"
                                            />
                                        </div>
                                        <div className={`text-xs font-medium truncate mb-1 ${!isOwned ? 'opacity-50' : ''}`}
                                             style={{ color: 'var(--ink)' }}>
                                            {isOwned ? char.name : '???'}
                                        </div>

                                        <div className="flex justify-center gap-0.5 mb-2">
                                            {[...Array(RARITY_CONFIG[char.rarity].stars)].map((_, i) => (
                                                <span key={i} className={`text-xs ${getStarsClass(char.rarity)} ${!isOwned ? 'opacity-30' : ''}`}>⭐</span>
                                            ))}
                                        </div>

                                        {isOwned && ownedChar ? (
                                            <>
                                                <div className="text-xs text-gray-400">
                                                    Obtenu {ownedChar.count}x
                                                </div>

                                                <div className="mt-2 bg-black/50 rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all"
                                                        style={{ width: `${(ownedChar.constellation / MAX_CONSTELLATION) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-xs text-gray-600 opacity-50">
                                                Non obtenu
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="bg-black/60 border border-gray-800 rounded-lg p-4 text-center">
                                <div className="text-3xl mb-2">📊</div>
                                <div className="text-gray-400 text-sm">Possédés</div>
                                <div className="text-white text-2xl font-bold">{inventory.length}/{CHARACTERS.length}</div>
                            </div>
                            <div className="bg-black/60 border border-gray-800 rounded-lg p-4 text-center">
                                <div className="text-3xl mb-2">📈</div>
                                <div className="text-gray-400 text-sm">Complétion</div>
                                <div className="text-white text-2xl font-bold">
                                    {((inventory.length / CHARACTERS.length) * 100).toFixed(0)}%
                                </div>
                            </div>
                            <div className="bg-black/60 border border-red-800 rounded-lg p-4 text-center">
                                <div className="text-3xl mb-2">🔥</div>
                                <div className="text-gray-400 text-sm">Rares</div>
                                <div className="text-red-500 text-2xl font-bold">
                                    {inventory.filter(c => c.rarity === 'Rare').length}
                                </div>
                            </div>
                            <div className="bg-black/60 border border-amber-800 rounded-lg p-4 text-center">
                                <div className="text-3xl mb-2">⭐</div>
                                <div className="text-gray-400 text-sm">Légendaires</div>
                                <div className="text-amber-400 text-2xl font-bold">
                                    {inventory.filter(c => c.rarity === 'Legendary').length}
                                </div>
                            </div>
                            <div className="bg-black/60 border border-amber-800 rounded-lg p-4 text-center">
                                <div className="text-3xl mb-2">✨</div>
                                <div className="text-gray-400 text-sm">C6 Max</div>
                                <div className="text-amber-400 text-2xl font-bold">
                                    {inventory.filter(c => c.constellation === MAX_CONSTELLATION).length}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}