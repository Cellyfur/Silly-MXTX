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
      <div className="card max-w-md w-full">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 mb-2 text-center">
          ✨ Gacha Game
        </h1>
        <p className="text-amber-200/70 text-center mb-8">
          {isLogin ? 'Connectez-vous à votre compte' : 'Créez votre compte'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-amber-100 text-sm font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/50 border border-amber-600/30 rounded-lg text-amber-100 placeholder-amber-200/30 focus:outline-none focus:border-amber-500/50 transition-colors"
              placeholder="votre@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-amber-100 text-sm font-medium mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/50 border border-amber-600/30 rounded-lg text-amber-100 placeholder-amber-200/30 focus:outline-none focus:border-amber-500/50 transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-600/50 text-red-200 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:from-slate-700 disabled:to-slate-800 px-6 py-3 rounded-lg text-slate-950 font-bold transition-all shadow-lg shadow-amber-600/30 disabled:shadow-none"
          >
            {loading ? 'Chargement...' : isLogin ? 'Se connecter' : "S'inscrire"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-amber-300 hover:text-amber-200 text-sm transition-colors"
          >
            {isLogin ? "Pas de compte ? Créer un compte" : "Déjà un compte ? Se connecter"}
          </button>
        </div>
      </div>
    </div>
  );
}
