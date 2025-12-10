
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';
import { useToasts, ToastContainer } from '@/components/ui/Toast';
import { Loader2, Mail, Lock, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const loginSchema = z.object({
    email: z.string().email('Email invalide'),
    password: z.string().min(1, 'Mot de passe requis'),
});

type LoginSchema = z.infer<typeof loginSchema>;

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

            addToast({
                message: 'Connexion réussie ! Redirection...',
                type: 'success',
            });

            // Short delay to show the success toast
            setTimeout(() => {
                router.push('/wall');
                router.refresh(); // Refresh to update middleware/server state
            }, 1000);

        } catch (error: any) {
            addToast({
                message: error.message || 'Erreur lors de la connexion',
                type: 'error',
            });
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-slate-900">Bienvenue</h1>
                    <p className="text-slate-500">Connectez-vous à votre espace Les Extras</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                {...register('email')}
                                type="email"
                                placeholder="vous@exemple.com"
                                className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-slate-50 focus:bg-white transition-all outline-none focus:ring-2 focus:ring-blue-500/20 ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                                    }`}
                            />
                        </div>
                        {errors.email && (
                            <p className="text-sm text-red-500 px-1">{errors.email.message}</p>
                        )}
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-slate-700">Mot de passe</label>
                            <Link href="/auth/forgot-password" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                                Oublié ?
                            </Link>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                {...register('password')}
                                type="password"
                                placeholder="••••••••"
                                className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-slate-50 focus:bg-white transition-all outline-none focus:ring-2 focus:ring-blue-500/20 ${errors.password ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                                    }`}
                            />
                        </div>
                        {errors.password && (
                            <p className="text-sm text-red-500 px-1">{errors.password.message}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                Se connecter
                                <ChevronRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>

                <div className="text-center pt-4 border-t border-slate-100">
                    <p className="text-sm text-slate-500">
                        Pas encore de compte ?{' '}
                        <Link href="/onboarding" className="text-blue-600 font-bold hover:text-blue-700">
                            S'inscrire
                        </Link>
                    </p>
                </div>
            </div>

            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </div>
    );
}
