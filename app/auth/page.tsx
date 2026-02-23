'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, signup } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await signup(email, password);
            }
            router.push('/');
        } catch (err: any) {
            if (err.code === 'auth/email-already-in-use') {
                setError('Cet email est déjà utilisé');
            } else if (err.code === 'auth/weak-password') {
                setError('Le mot de passe doit contenir au moins 6 caractères');
            } else if (err.code === 'auth/invalid-email') {
                setError('Email invalide');
            } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                setError('Email ou mot de passe incorrect');
            } else {
                setError('Une erreur est survenue');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="auth-card max-w-md w-full">

                {/* Titre calligraphique */}
                <div className="text-center mb-8">
                    <h1
                        className="text-4xl font-bold mb-3"
                        style={{ fontFamily: "'Shippori Mincho', serif", color: '#291400', letterSpacing: '0.12em' }}
                    >
                        墨香铜臭
                    </h1>
                    {/* Trait décoratif carmin */}
                    <div style={{
                        height: '2px',
                        width: '3rem',
                        margin: '0 auto 0.75rem',
                        background: 'linear-gradient(90deg, transparent, #c41e1e, transparent)'
                    }}/>
                    <p style={{ color: 'rgba(41, 20, 0, 0.55)', fontSize: '0.9rem', letterSpacing: '0.04em' }}>
                        {isLogin ? 'Connectez-vous à votre compte' : 'Créez votre compte'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label
                            className="block text-sm font-medium mb-2"
                            style={{ color: '#291400', letterSpacing: '0.04em' }}
                        >
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="auth-input"
                            placeholder="votre@email.com"
                            required
                        />
                    </div>

                    <div>
                        <label
                            className="block text-sm font-medium mb-2"
                            style={{ color: '#291400', letterSpacing: '0.04em' }}
                        >
                            Mot de passe
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="auth-input"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && (
                        <div style={{
                            background: 'rgba(196, 30, 30, 0.06)',
                            border: '1px solid rgba(196, 30, 30, 0.3)',
                            color: '#8b1010',
                            padding: '0.75rem 1rem',
                            borderRadius: '0.5rem',
                            fontSize: '0.875rem',
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="auth-btn"
                        style={loading ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                    >
                        {loading ? 'Chargement...' : isLogin ? 'Se connecter' : "S'inscrire"}
                    </button>
                </form>

                {/* Séparateur */}
                <div className="divider-carmine mt-6" />

                <div className="text-center">
                    <button
                        onClick={() => { setIsLogin(!isLogin); setError(''); }}
                        className="text-sm transition-opacity hover:opacity-70"
                        style={{ color: 'var(--carmine-dk)', letterSpacing: '0.03em' }}
                    >
                        {isLogin ? "Pas de compte ? Créer un compte" : "Déjà un compte ? Se connecter"}
                    </button>
                </div>
            </div>
        </div>
    );
}