'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Mail, Lock, ChevronRight } from 'lucide-react';
import { auth } from '@/lib/auth';
import { useToasts, ToastContainer } from '@/components/ui/Toast';
import { Logo } from '@/components/ui/Logo';

const loginSchema = z.object({
    email: z.string().email('Email invalide'),
    password: z.string().min(1, 'Mot de passe requis'),
});

type LoginSchema = z.infer<typeof loginSchema>;

const getApiBase = () => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const normalized = apiBase.replace(/\/+$/, '');
    return normalized.endsWith('/api/v1') ? normalized : `${normalized}/api/v1`;
};

export default function LoginPage() {
    const router = useRouter();
    const { toasts, addToast, removeToast } = useToasts();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginSchema>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginSchema) => {
        setIsLoading(true);
        try {
            const response = await auth.login(data.email, data.password);
            auth.setToken(response.accessToken);

            const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
            const isDashHost = hostname.startsWith('dash.');

            let redirectPath = isDashHost ? '/admin' : '/wall';

            try {
                const meRes = await fetch(`${getApiBase()}/auth/me`, {
                    headers: { Authorization: `Bearer ${response.accessToken}` },
                });

                if (meRes.ok) {
                    const user = await meRes.json();
                    if (String(user?.role).toUpperCase() === 'ADMIN') {
                        redirectPath = '/admin';
                    } else if (isDashHost) {
                        auth.logout();
                        return;
                    }
                }
            } catch {
                // ignore
            }

            addToast({
                message: 'Connexion réussie ! Redirection...',
                type: 'success',
            });

            setTimeout(() => {
                router.push(redirectPath);
                router.refresh();
            }, 800);
        } catch (error: any) {
            addToast({
                message: error.message || 'Erreur lors de la connexion',
                type: 'error',
            });
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white/90 backdrop-blur-xl shadow-xl shadow-indigo-100/50 border border-slate-100 rounded-3xl p-8 sm:p-10 w-full animate-in fade-in zoom-in duration-500">
            <div className="flex flex-col items-center gap-6 mb-8">
                <Logo size="lg" />
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Heureux de vous revoir</h1>
                    <p className="text-slate-500">Connectez-vous pour accéder à votre espace</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-1 group">
                    <label className="text-sm font-medium text-slate-700 ml-1">Email</label>
                    <div className="relative transition-all duration-300">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors w-5 h-5" />
                        <input
                            {...register('email')}
                            type="email"
                            placeholder="exemple@sociopulse.com"
                            className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border bg-slate-50/50 focus:bg-white transition-all outline-none focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-400 ${errors.email
                                    ? 'border-red-300 focus:border-red-500'
                                    : 'border-slate-200 focus:border-indigo-500 hover:border-slate-300'
                                }`}
                        />
                    </div>
                    {errors.email && <p className="text-sm text-red-500 px-2 font-medium">{errors.email.message}</p>}
                </div>

                <div className="space-y-1 group">
                    <div className="flex justify-between items-center px-1">
                        <label className="text-sm font-medium text-slate-700">Mot de passe</label>
                        <Link
                            href="/auth/forgot-password"
                            className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
                        >
                            Mot de passe oublié ?
                        </Link>
                    </div>
                    <div className="relative transition-all duration-300">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors w-5 h-5" />
                        <input
                            {...register('password')}
                            type="password"
                            placeholder="••••••••"
                            className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border bg-slate-50/50 focus:bg-white transition-all outline-none focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-400 ${errors.password
                                    ? 'border-red-300 focus:border-red-500'
                                    : 'border-slate-200 focus:border-indigo-500 hover:border-slate-300'
                                }`}
                        />
                    </div>
                    {errors.password && <p className="text-sm text-red-500 px-2 font-medium">{errors.password.message}</p>}
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-teal-500 hover:scale-[1.02] active:scale-[0.98] text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-indigo-500/20 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 mt-2"
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            Se connecter
                            <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                        </>
                    )}
                </button>
            </form>

            <div className="text-center pt-8 mt-2">
                <p className="text-sm text-slate-500">
                    Pas encore de compte ?{' '}
                    <Link href="/onboarding" className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors">
                        Créer un compte
                    </Link>
                </p>
            </div>

            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </div>
    );
}
