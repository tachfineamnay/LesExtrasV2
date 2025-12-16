'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Loader2, AlertTriangle } from 'lucide-react';

interface UserData {
    id: string;
    email: string;
    role: 'CLIENT' | 'EXTRA' | 'ADMIN';
    status: string;
}

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const checkAdminAccess = async () => {
            try {
                const token = localStorage.getItem('token');

                if (!token) {
                    setError('Vous devez être connecté');
                    setTimeout(() => router.push('/login'), 2000);
                    return;
                }

                // Vérifier le rôle via l'API
                const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
                const normalized = apiBase.replace(/\/+$/, '');
                const baseUrl = normalized.endsWith('/api/v1') ? normalized : `${normalized}/api/v1`;

                const res = await fetch(`${baseUrl}/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!res.ok) {
                    setError('Session expirée');
                    localStorage.removeItem('token');
                    setTimeout(() => router.push('/login'), 2000);
                    return;
                }

                const user: UserData = await res.json();

                if (user.role !== 'ADMIN') {
                    setError('Accès réservé aux administrateurs');
                    setTimeout(() => router.push('/dashboard'), 2000);
                    return;
                }

                setIsAuthorized(true);
            } catch (err) {
                setError('Erreur de vérification');
                setTimeout(() => router.push('/login'), 2000);
            } finally {
                setIsLoading(false);
            }
        };

        checkAdminAccess();
    }, [router]);

    // État de chargement
    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex items-center justify-center gap-2 text-slate-600">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Vérification des droits admin...</span>
                    </div>
                </div>
            </div>
        );
    }

    // Erreur d'accès
    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center space-y-4 max-w-md px-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-900">Accès refusé</h1>
                    <p className="text-slate-500">{error}</p>
                    <p className="text-sm text-slate-400">Redirection en cours...</p>
                </div>
            </div>
        );
    }

    // Autorisé : afficher le contenu admin
    if (isAuthorized) {
        return <>{children}</>;
    }

    return null;
}
