'use client';

import { useState } from 'react';

interface TutorialModalProps {
    onComplete: () => void;
}

const STEPS = [
    {
        icon: '🖋️',
        title: 'Bienvenue ! ',
        subtitle: 'Bienvenue dans Silly MXTX',
        content: `Un jeu de collection de personnages inspiré de l'univers MXTX. Invoquez des personnages, combattez et complétez votre collection !`,
        hint: null,
    },
    {
        icon: '💰',
        title: 'Les Pièces',
        subtitle: 'Votre monnaie d\'invocation',
        content: `Vous débutez avec 5 000 pièces. Chaque invocation coûte 160 pièces — un seul tirage, ou dix à la fois pour 1 600 pièces. Gardez un œil sur votre solde en haut à droite de l'écran.`,
        hint: '💡 Utilisez le bouton +1000 💰 pour recharger en mode test',
    },
    {
        icon: '✨',
        title: 'Les Invocations',
        subtitle: 'Tirez et découvrez',
        content: `Trois raretés vous attendent : les personnages Communs (⭐⭐⭐, 70%), Rares (⭐⭐⭐⭐, 25%), et les légendaires (⭐⭐⭐⭐⭐, 5%). Chaque tirage révèle le personnage un à un, avec son fond caractéristique.`,
        hint: '💡 Le tirage x10 vous offre une chance supplémentaire d\'obtenir un personnage rare',
    },
    {
        icon: '📚',
        title: 'Les Constellations',
        subtitle: 'Améliorez vos favoris',
        content: `Obtenir un personnage déjà possédé augmente sa Constellation, de C0 à C6. Au-delà de C6, chaque doublon vous rapporte 100 pièces. Consultez votre collection complète depuis le menu en haut.`,
        hint: '💡 Les personnages légendaires à C6 sont particulièrement redoutables en combat',
    },
    {
        icon: '⚔️',
        title: 'Le Combat',
        subtitle: 'Mettez vos héros à l\'épreuve',
        content: `Affrontez des ennemis dans des combats au tour par tour. Esquivez les attaques ennemies grâce au système de QTE — un timing parfait peut faire toute la différence. Constituez une équipe solide depuis votre collection.`,
        hint: '💡 Les personnages Légendaires ont des capacités spéciales plus puissantes',
    },
    {
        icon: '🌸',
        title: 'À vous de jouer !',
        subtitle: 'L\'aventure commence',
        content: `Tout est prêt. Faites vos premiers tirages, et amusez-vous bien !`,
        hint: null,
    },
];

export function TutorialModal({ onComplete }: TutorialModalProps) {
    const [step, setStep] = useState(0);
    const [exiting, setExiting] = useState(false);

    const current = STEPS[step];
    const isLast = step === STEPS.length - 1;

    const handleNext = () => {
        if (isLast) {
            setExiting(true);
            setTimeout(onComplete, 400);
        } else {
            setStep(s => s + 1);
        }
    };

    const handlePrev = () => {
        if (step > 0) setStep(s => s - 1);
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
                background: `rgba(18, 14, 10, ${exiting ? 0 : 0.72})`,
                backdropFilter: 'blur(3px)',
                transition: 'background 0.4s ease',
            }}
        >
            {/* Modal */}
            <div
                style={{
                    width: '100%',
                    maxWidth: '520px',
                    background: 'linear-gradient(160deg, #fffdf5 0%, #f5ede0 100%)',
                    border: '1px solid rgba(26, 20, 16, 0.14)',
                    borderRadius: '1.25rem',
                    boxShadow: '0 24px 80px rgba(18, 14, 10, 0.45), inset 0 1px 0 rgba(255,255,255,0.9)',
                    padding: '2.5rem 2.25rem 2rem',
                    position: 'relative',
                    opacity: exiting ? 0 : 1,
                    transform: exiting ? 'scale(0.96) translateY(8px)' : 'scale(1) translateY(0)',
                    transition: 'opacity 0.4s ease, transform 0.4s ease',
                }}
            >
                {/* Trait décoratif haut */}
                <div style={{
                    position: 'absolute',
                    top: 0, left: '10%', right: '10%',
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent, #c41e1e 30%, #c41e1e 70%, transparent)',
                    borderRadius: '2px',
                }} />

                {/* Icône + Titre */}
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '2.8rem', marginBottom: '0.75rem', lineHeight: 1 }}>
                        {current.icon}
                    </div>
                    <h2 style={{
                        fontFamily: "'Shippori Mincho', serif",
                        fontSize: '1.4rem',
                        fontWeight: 700,
                        color: '#1a1410',
                        letterSpacing: '0.06em',
                        marginBottom: '0.3rem',
                    }}>
                        {current.title}
                    </h2>
                    <p style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '0.8rem',
                        color: 'rgba(41, 20, 0, 0.5)',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                    }}>
                        {current.subtitle}
                    </p>
                </div>

                {/* Séparateur carmin */}
                <div style={{
                    height: '1px',
                    background: 'linear-gradient(90deg, transparent, rgba(196,30,30,0.25), transparent)',
                    marginBottom: '1.5rem',
                }} />

                {/* Contenu */}
                <p style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.95rem',
                    lineHeight: 1.75,
                    color: 'rgba(41, 20, 0, 0.78)',
                    textAlign: 'center',
                    marginBottom: current.hint ? '1.25rem' : '2rem',
                }}>
                    {current.content}
                </p>

                {/* Hint */}
                {current.hint && (
                    <div style={{
                        background: 'rgba(196, 30, 30, 0.05)',
                        border: '1px solid rgba(196, 30, 30, 0.18)',
                        borderRadius: '0.6rem',
                        padding: '0.65rem 1rem',
                        marginBottom: '2rem',
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '0.825rem',
                        color: 'rgba(139, 16, 16, 0.85)',
                        textAlign: 'center',
                    }}>
                        {current.hint}
                    </div>
                )}

                {/* Progress dots */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    marginBottom: '1.5rem',
                }}>
                    {STEPS.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setStep(i)}
                            style={{
                                width: i === step ? '1.5rem' : '0.5rem',
                                height: '0.5rem',
                                borderRadius: '9999px',
                                background: i === step ? '#c41e1e' : 'rgba(26, 20, 16, 0.2)',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                padding: 0,
                            }}
                        />
                    ))}
                </div>

                {/* Boutons navigation */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {step > 0 && (
                        <button
                            onClick={handlePrev}
                            style={{
                                flex: '0 0 auto',
                                padding: '0.7rem 1.25rem',
                                borderRadius: '0.75rem',
                                border: '1px solid rgba(26, 20, 16, 0.18)',
                                background: 'rgba(26, 20, 16, 0.04)',
                                color: 'rgba(41, 20, 0, 0.65)',
                                fontFamily: "'Inter', sans-serif",
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(26,20,16,0.08)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(26,20,16,0.04)')}
                        >
                            ← Retour
                        </button>
                    )}
                    <button
                        onClick={handleNext}
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            borderRadius: '0.75rem',
                            border: '1px solid #8b1010',
                            background: isLast
                                ? 'linear-gradient(135deg, #c41e1e, #8b1010)'
                                : '#1a1410',
                            color: '#fffdf5',
                            fontFamily: "'Shippori Mincho', serif",
                            fontSize: '1rem',
                            fontWeight: 600,
                            letterSpacing: '0.06em',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: isLast
                                ? '0 4px 20px rgba(196, 30, 30, 0.3)'
                                : '0 4px 16px rgba(26, 20, 16, 0.2)',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = isLast
                                ? '0 6px 24px rgba(196, 30, 30, 0.4)'
                                : '0 6px 20px rgba(26, 20, 16, 0.3)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = isLast
                                ? '0 4px 20px rgba(196, 30, 30, 0.3)'
                                : '0 4px 16px rgba(26, 20, 16, 0.2)';
                        }}
                    >
                        {isLast ? '🌸 Commencer l\'aventure' : 'Suivant →'}
                    </button>
                </div>

                {/* Skip */}
                {!isLast && (
                    <div style={{ textAlign: 'center', marginTop: '0.875rem' }}>
                        <button
                            onClick={() => { setExiting(true); setTimeout(onComplete, 400); }}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'rgba(41, 20, 0, 0.35)',
                                fontSize: '0.78rem',
                                cursor: 'pointer',
                                fontFamily: "'Inter', sans-serif",
                                letterSpacing: '0.04em',
                                textDecoration: 'underline',
                                textUnderlineOffset: '3px',
                            }}
                        >
                            Passer le tutoriel
                        </button>
                    </div>
                )}

                {/* Trait décoratif bas */}
                <div style={{
                    position: 'absolute',
                    bottom: 0, left: '10%', right: '10%',
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent, rgba(196,30,30,0.3), transparent)',
                    borderRadius: '2px',
                }} />
            </div>
        </div>
    );
}