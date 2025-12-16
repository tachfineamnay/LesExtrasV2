'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface UserProfile {
    id: string;
    email: string;
    phone?: string;
    role: 'CLIENT' | 'EXTRA' | 'ADMIN';
    status: string;
    walletBalance: number;
    createdAt: string;
    profile?: {
        id: string;
        firstName: string;
        lastName: string;
        avatarUrl?: string;
        coverUrl?: string;
        headline?: string;
        bio?: string;
        city?: string;
        specialties?: string[];
        diplomas?: any[];
        hourlyRate?: number;
        radiusKm?: number;
        isVideoEnabled?: boolean;
    };
    establishment?: {
        id: string;
        name: string;
        type?: string;
        address?: string;
        city?: string;
    };
}

interface UseAuthReturn {
    user: UserProfile | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    logout: () => void;
}

export function useAuth(): UseAuthReturn {
    const router = useRouter();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUser = useCallback(async () => {
        const token = Cookies.get('accessToken');

        if (!token) {
            setUser(null);
            setIsLoading(false);
            return;
        }

        try {
            // Normalize API URL
            const normalized = API_URL.replace(/\/+$/, '');
            const baseUrl = normalized.endsWith('/api/v1') ? normalized : `${normalized}/api/v1`;

            const response = await fetch(`${baseUrl}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // Token expired or invalid
                    Cookies.remove('accessToken');
                    setUser(null);
                    setError('Session expirée');
                    return;
                }
                throw new Error('Erreur de récupération du profil');
            }

            const userData = await response.json();
            setUser(userData);
            setError(null);
        } catch (err: any) {
            console.error('Auth fetch error:', err);
            setError(err.message);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const logout = useCallback(() => {
        Cookies.remove('accessToken');
        setUser(null);
        router.push('/auth/login');
    }, [router]);

    return {
        user,
        isLoading,
        isAuthenticated: !!user,
        error,
        refetch: fetchUser,
        logout,
    };
}
