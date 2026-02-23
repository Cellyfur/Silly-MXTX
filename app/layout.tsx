import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
    title: "MXTX Wisher",
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