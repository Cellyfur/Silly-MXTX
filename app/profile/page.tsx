'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    updateEmail,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider,
    updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

type Section = 'pseudo' | 'email' | 'password' | null;

export default function ProfilePage() {
    const { user, logout } = useAuth();
    const router = useRouter();

    const [activeSection, setActiveSection] = useState<Section>(null);
    const [username, setUsername] = useState('');
    const [newUsername, setNewUsername] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user) {
            router.push('/auth');
            return;
        }
        // Charger le pseudo depuis Firestore
        const loadUsername = async () => {
            const docRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setUsername(data.username || '');
            }
        };
        loadUsername();
    }, [user, router]);

    if (!user) return null;

    const resetFeedback = () => {
        setError('');
        setSuccess('');
    };

    const toggleSection = (section: Section) => {
        setActiveSection(activeSection === section ? null : section);
        resetFeedback();
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setNewEmail('');
        setNewUsername('');
    };

    const reauthenticate = async (password: string) => {
        if (!user?.email) throw new Error('Pas de compte email');
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);
    };

    const handleUpdateUsername = async () => {
        if (!newUsername.trim()) return setError('Le pseudo ne peut pas être vide');
        setLoading(true);
        resetFeedback();
        try {
            await setDoc(doc(db, 'users', user.uid), { username: newUsername.trim() }, { merge: true });
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, { displayName: newUsername.trim() });
            }
            setUsername(newUsername.trim());
            setSuccess('Pseudo mis à jour !');
            setNewUsername('');
            setActiveSection(null);
        } catch {
            setError('Erreur lors de la mise à jour du pseudo');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateEmail = async () => {
        if (!newEmail.trim()) return setError('Entrez un nouvel email');
        setLoading(true);
        resetFeedback();
        try {
            await reauthenticate(currentPassword);
            if (auth.currentUser) await updateEmail(auth.currentUser, newEmail.trim());
            setSuccess('Email mis à jour !');
            setActiveSection(null);
        } catch (err: any) {
            if (err.code === 'auth/wrong-password') setError('Mot de passe incorrect');
            else if (err.code === 'auth/email-already-in-use') setError('Cet email est déjà utilisé');
            else setError('Erreur lors de la mise à jour');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async () => {
        if (newPassword !== confirmPassword) return setError('Les mots de passe ne correspondent pas');
        if (newPassword.length < 6) return setError('Le mot de passe doit contenir au moins 6 caractères');
        setLoading(true);
        resetFeedback();
        try {
            await reauthenticate(currentPassword);
            if (auth.currentUser) await updatePassword(auth.currentUser, newPassword);
            setSuccess('Mot de passe mis à jour !');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setActiveSection(null);
        } catch (err: any) {
            if (err.code === 'auth/wrong-password') setError('Mot de passe actuel incorrect');
            else setError('Erreur lors de la mise à jour');
        } finally {
            setLoading(false);
        }
    };

    const displayName = username || user.email?.split('@')[0] || 'Invocateur';

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="header">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <Link href="/" className="nav-link">
                        <h1 className="header-title">墨香铜臭</h1>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/" className="nav-link">🎴 Tirages</Link>
                        <Link href="/collection" className="nav-link">📚 Collection</Link>
                        <Link href="/combat" className="nav-link">⚔️ Combat</Link>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-12 max-w-2xl">

                {/* Avatar & nom */}
                <div className="text-center mb-10">
                    <div
                        className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 text-4xl"
                        style={{
                            background: 'rgba(196,30,30,0.08)',
                            border: '2px solid rgba(196,30,30,0.2)',
                            boxShadow: '0 4px 20px rgba(196,30,30,0.1)',
                        }}
                    >
                        🪷
                    </div>
                    <h2
                        className="text-3xl font-bold mb-1"
                        style={{ fontFamily: "'Shippori Mincho', serif", color: '#291400', letterSpacing: '0.08em' }}
                    >
                        {displayName}
                    </h2>
                    <p style={{ color: 'rgba(41,20,0,0.45)', fontSize: '0.875rem' }}>{user.email}</p>
                    <div style={{
                        height: '2px', width: '3rem', margin: '1rem auto 0',
                        background: 'linear-gradient(90deg, transparent, #c41e1e, transparent)',
                    }} />
                </div>

                {/* Feedback global */}
                {success && (
                    <div className="mb-6 px-4 py-3 rounded-lg text-sm" style={{
                        background: 'rgba(21,128,61,0.06)',
                        border: '1px solid rgba(21,128,61,0.25)',
                        color: '#166534',
                    }}>
                        ✓ {success}
                    </div>
                )}
                {error && (
                    <div className="mb-6 px-4 py-3 rounded-lg text-sm" style={{
                        background: 'rgba(196,30,30,0.06)',
                        border: '1px solid rgba(196,30,30,0.25)',
                        color: '#8b1010',
                    }}>
                        {error}
                    </div>
                )}

                {/* Sections */}
                <div className="space-y-3">

                    {/* Pseudo */}
                    <ProfileSection
                        label="Pseudo"
                        value={username || 'Non défini'}
                        icon="✒️"
                        isOpen={activeSection === 'pseudo'}
                        onToggle={() => toggleSection('pseudo')}
                    >
                        <div className="space-y-3 pt-2">
                            <input
                                type="text"
                                className="auth-input"
                                placeholder="Nouveau pseudo..."
                                value={newUsername}
                                onChange={e => setNewUsername(e.target.value)}
                                maxLength={32}
                            />
                            <button
                                onClick={handleUpdateUsername}
                                disabled={loading}
                                className="auth-btn"
                                style={loading ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                            >
                                {loading ? 'Mise à jour...' : 'Enregistrer'}
                            </button>
                        </div>
                    </ProfileSection>

                    {/* Email */}
                    <ProfileSection
                        label="Email"
                        value={user.email || ''}
                        icon="📧"
                        isOpen={activeSection === 'email'}
                        onToggle={() => toggleSection('email')}
                    >
                        <div className="space-y-3 pt-2">
                            <input
                                type="email"
                                className="auth-input"
                                placeholder="Nouvel email..."
                                value={newEmail}
                                onChange={e => setNewEmail(e.target.value)}
                            />
                            <input
                                type="password"
                                className="auth-input"
                                placeholder="Mot de passe actuel (requis)"
                                value={currentPassword}
                                onChange={e => setCurrentPassword(e.target.value)}
                            />
                            <button
                                onClick={handleUpdateEmail}
                                disabled={loading}
                                className="auth-btn"
                                style={loading ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                            >
                                {loading ? 'Mise à jour...' : 'Changer l\'email'}
                            </button>
                        </div>
                    </ProfileSection>

                    {/* Mot de passe */}
                    <ProfileSection
                        label="Mot de passe"
                        value="••••••••"
                        icon="🔑"
                        isOpen={activeSection === 'password'}
                        onToggle={() => toggleSection('password')}
                    >
                        <div className="space-y-3 pt-2">
                            <input
                                type="password"
                                className="auth-input"
                                placeholder="Mot de passe actuel"
                                value={currentPassword}
                                onChange={e => setCurrentPassword(e.target.value)}
                            />
                            <input
                                type="password"
                                className="auth-input"
                                placeholder="Nouveau mot de passe"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                            />
                            <input
                                type="password"
                                className="auth-input"
                                placeholder="Confirmer le nouveau mot de passe"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                            />
                            <button
                                onClick={handleUpdatePassword}
                                disabled={loading}
                                className="auth-btn"
                                style={loading ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                            >
                                {loading ? 'Mise à jour...' : 'Changer le mot de passe'}
                            </button>
                        </div>
                    </ProfileSection>
                </div>

                {/* Déconnexion */}
                <div className="mt-10 pt-6" style={{ borderTop: '1px solid rgba(41,20,0,0.08)' }}>
                    <button
                        onClick={async () => { await logout(); router.push('/auth'); }}
                        className="w-full py-3 rounded-lg text-sm font-medium transition-all hover:opacity-80"
                        style={{
                            color: '#8b1010',
                            background: 'rgba(196,30,30,0.05)',
                            border: '1px solid rgba(196,30,30,0.2)',
                            letterSpacing: '0.04em',
                        }}
                    >
                        Se déconnecter
                    </button>
                </div>
            </main>
        </div>
    );
}

/* Composant section accordéon */
function ProfileSection({
                            label,
                            value,
                            icon,
                            isOpen,
                            onToggle,
                            children,
                        }: {
    label: string;
    value: string;
    icon: string;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}) {
    return (
        <div
            className="rounded-xl overflow-hidden transition-all"
            style={{
                background: 'rgba(255,253,248,0.8)',
                border: `1px solid ${isOpen ? 'rgba(196,30,30,0.25)' : 'rgba(41,20,0,0.1)'}`,
                boxShadow: isOpen ? '0 4px 20px rgba(196,30,30,0.06)' : '0 1px 4px rgba(41,20,0,0.04)',
            }}
        >
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between px-5 py-4 text-left transition-all"
            >
                <div className="flex items-center gap-3">
                    <span className="text-xl">{icon}</span>
                    <div>
                        <div className="text-xs font-medium mb-0.5" style={{ color: 'rgba(41,20,0,0.45)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                            {label}
                        </div>
                        <div className="text-sm font-medium" style={{ color: '#291400' }}>
                            {value}
                        </div>
                    </div>
                </div>
                <span
                    className="text-xs transition-transform duration-300"
                    style={{
                        color: 'rgba(196,30,30,0.7)',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        display: 'inline-block',
                    }}
                >
                    ▾
                </span>
            </button>

            {isOpen && (
                <div className="px-5 pb-5" style={{ borderTop: '1px solid rgba(41,20,0,0.06)' }}>
                    {children}
                </div>
            )}
        </div>
    );
}