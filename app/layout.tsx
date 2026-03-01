import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
    title: "MXTX Wisher",
    icons: {
        icon: '/favicon.png',
    },
    description: "Celly's draft",
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="fr">
        <body>
        {/* Décors sakura fixes */}
        <div className="sakura-corner-tr" aria-hidden="true" />
        <div className="sakura-corner-bl" aria-hidden="true" />

        {/* Pétales tombants */}
        <Petals />
        {/* Message rotation mobile */}
        <div
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center md:hidden landscape:hidden"
            style={{ background: 'var(--ivory)', fontFamily: "'Shippori Mincho', serif" }}
        >
            {/* Titre */}
            <h2 style={{ color: 'var(--ink)', fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: '0.15em', marginBottom: '0.5rem' }}>
                墨香铜臭
            </h2>

            {/* Trait carmin */}
            <div style={{ width: '3rem', height: '2px', background: 'var(--carmine)', marginBottom: '2.5rem', borderRadius: '1px' }} />

            {/* Icône rotation */}
            <div
                className="animate-bounce text-5xl mb-6"
                style={{ color: 'var(--carmine)' }}
            >
                ↻
            </div>

            {/* Message */}
            <p style={{ color: 'var(--ink)', fontSize: '1.1rem', fontWeight: 'bold', textAlign: 'center', padding: '0 2rem', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>
                Tournez votre téléphone
            </p>
            <p style={{ color: 'rgba(41,20,0,0.5)', fontSize: '0.85rem', textAlign: 'center', padding: '0 2.5rem', lineHeight: 1.6 }}>
                Pour une meilleure expérience,<br/>nous vous recommandons le mode paysage.
            </p>
        </div>

        <AuthProvider>
            {children}
        </AuthProvider>
        </body>
        </html>
    );
}

/* Pétales de cerisier animés */
function Petals() {
    const petals = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        left: `${5 + (i * 8.2) % 90}%`,
        delay: `${(i * 1.7) % 12}s`,
        duration: `${10 + (i * 2.3) % 8}s`,
        size: `${5 + (i * 1.1) % 4}px`,
        opacity: 0.25 + (i % 4) * 0.08,
    }));

    return (
        <>
            {petals.map((p) => (
                <div
                    key={p.id}
                    aria-hidden="true"
                    style={{
                        position: 'fixed',
                        left: p.left,
                        top: '-10px',
                        width: p.size,
                        height: p.size,
                        background: '#e87878',
                        borderRadius: '0 100% 0 100%',
                        pointerEvents: 'none',
                        zIndex: 9998,
                        opacity: 0,
                        animation: `petalFall ${p.duration} ${p.delay} linear infinite`,
                    }}
                />
            ))}
        </>
    );
}