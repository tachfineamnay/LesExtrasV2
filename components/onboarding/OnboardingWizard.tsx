'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import Cookies from 'js-cookie';
import { toast } from 'sonner';
import {
    Check,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Lock,
    Mail,
    Search,
    Sparkles,
    UserCheck,
} from 'lucide-react';
import { TagSelector, type GrowthTag } from '@/components/growth/TagSelector';
import { auth } from '@/lib/auth';

type UserType = 'TALENT' | 'SEEKER' | null;

const accountSchema = z
    .object({
        email: z.string().email('Email invalide'),
        password: z.string().min(8, 'Mot de passe min 8 caractères'),
        confirmPassword: z.string(),
        referrerCode: z.string().trim().optional(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Les mots de passe ne correspondent pas',
        path: ['confirmPassword'],
    });

type AccountFormData = z.infer<typeof accountSchema>;

type RegisterResponse = {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        email: string;
        role: string;
        status: string;
    };
};

const slideVariants = {
    enter: { opacity: 0, x: 30 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
};

const cardVariants = {
    idle: { scale: 1, boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' },
    hover: { scale: 1.02, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' },
};

const getApiBase = () => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:4000';
    const normalized = apiBase.replace(/\/+$/, '');
    return normalized.endsWith('/api/v1') ? normalized : `${normalized}/api/v1`;
};

export function OnboardingWizard() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [step, setStep] = useState(1);
    const [userType, setUserType] = useState<UserType>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasCreatedAccount, setHasCreatedAccount] = useState(false);

    const [isLoadingTags, setIsLoadingTags] = useState(false);
    const [tags, setTags] = useState<GrowthTag[]>([]);
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

    const totalSteps = 3;
    const progressPercentage = (Math.min(step, totalSteps) / totalSteps) * 100;

    const refFromUrl = searchParams.get('ref')?.trim() || '';

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<AccountFormData>({
        resolver: zodResolver(accountSchema),
        defaultValues: { referrerCode: refFromUrl || undefined },
    });

    useEffect(() => {
        if (!refFromUrl) return;
        setValue('referrerCode', refFromUrl, { shouldValidate: true });
    }, [refFromUrl, setValue]);

    const apiBase = useMemo(() => getApiBase(), []);

    const goBack = () => {
        if (step === 3) {
            setStep(2);
            return;
        }
        if (step === 2) {
            setStep(1);
            setUserType(null);
        }
    };

    const handleUserTypeSelect = (type: UserType) => {
        setUserType(type);
        setStep(2);
    };

    const onSubmitAccount = async (data: AccountFormData) => {
        if (!userType) {
            toast.error('Sélectionnez votre profil pour continuer.');
            setStep(1);
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                email: data.email,
                password: data.password,
                role: userType === 'TALENT' ? 'EXTRA' : 'CLIENT',
                referrerCode: data.referrerCode?.trim() || undefined,
            };

            const res = await fetch(`${apiBase}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                cache: 'no-store',
            });

            if (!res.ok) {
                const errorText = await res.text().catch(() => '');
                toast.error(errorText || "Erreur lors de l'inscription");
                return;
            }

            const response = (await res.json()) as RegisterResponse;
            auth.setToken(response.accessToken);
            setHasCreatedAccount(true);
            toast.success('Compte créé. Choisissez vos tags.');
            setStep(3);
        } catch {
            toast.error('Erreur de connexion au serveur');
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        if (step !== 3 || tags.length > 0 || isLoadingTags) return;

        setIsLoadingTags(true);
        fetch(`${apiBase}/growth/tags`, { cache: 'no-store' })
            .then(async (res) => {
                if (!res.ok) throw new Error('Failed to load tags');
                const data = (await res.json()) as GrowthTag[];
                setTags(Array.isArray(data) ? data : []);
            })
            .catch(() => {
                toast.error("Impossible de charger les tags pour l'instant.");
                setTags([]);
            })
            .finally(() => setIsLoadingTags(false));
    }, [apiBase, isLoadingTags, step, tags.length]);

    const submitTags = async () => {
        if (!hasCreatedAccount) {
            toast.error('Créez votre compte avant de sélectionner des tags.');
            setStep(2);
            return;
        }

        if (selectedTagIds.length === 0) {
            toast.error('Sélectionnez au moins 1 tag.');
            return;
        }

        const token = Cookies.get('accessToken');
        if (!token) {
            toast.error('Session expirée, reconnectez-vous.');
            router.push('/auth/login');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`${apiBase}/growth/me/tags`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ tagIds: selectedTagIds }),
                cache: 'no-store',
            });

            if (!res.ok) {
                const errorText = await res.text().catch(() => '');
                toast.error(errorText || 'Erreur lors de la sauvegarde des tags');
                return;
            }

            toast.success('✅ Tags enregistrés. Bienvenue !');
            setStep(4);
            setTimeout(() => router.push('/dashboard'), 650);
        } catch {
            toast.error('Erreur de connexion au serveur');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
                <div className="max-w-2xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between mb-3">
                        <h1 className="text-xl font-bold text-slate-900">
                            Les <span className="text-coral-500">Extras</span>
                        </h1>
                        <span className="text-sm text-slate-500">
                            Étape {Math.min(step, totalSteps)} sur {totalSteps}
                        </span>
                    </div>

                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-coral-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercentage}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center px-4 py-8">
                <div className="w-full max-w-2xl">
                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.div
                                key="step1"
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.25 }}
                                className="space-y-8"
                            >
                                <div className="text-center">
                                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                                        Qui êtes-vous ?
                                    </h2>
                                    <p className="text-slate-500">Inscription en 30 secondes.</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <motion.button
                                        type="button"
                                        variants={cardVariants}
                                        initial="idle"
                                        whileHover="hover"
                                        onClick={() => handleUserTypeSelect('TALENT')}
                                        className={`
                                            relative p-6 rounded-2xl bg-white border-2 text-left transition-all
                                            ${userType === 'TALENT'
                                                ? 'border-coral-500 ring-2 ring-coral-200'
                                                : 'border-slate-200 hover:border-slate-300'
                                            }
                                        `}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div
                                                className={`
                                                    w-14 h-14 rounded-xl flex items-center justify-center
                                                    ${userType === 'TALENT' ? 'bg-coral-50' : 'bg-slate-100'}
                                                `}
                                            >
                                                <UserCheck
                                                    className={`w-7 h-7 ${userType === 'TALENT' ? 'text-coral-500' : 'text-slate-600'}`}
                                                />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-slate-900">Je suis un Extra</h3>
                                                <p className="text-sm text-slate-500">Professionnel du médico-social</p>
                                            </div>
                                        </div>
                                        {userType === 'TALENT' ? (
                                            <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-coral-500 flex items-center justify-center">
                                                <Check className="w-4 h-4 text-white" />
                                            </div>
                                        ) : null}
                                    </motion.button>

                                    <motion.button
                                        type="button"
                                        variants={cardVariants}
                                        initial="idle"
                                        whileHover="hover"
                                        onClick={() => handleUserTypeSelect('SEEKER')}
                                        className={`
                                            relative p-6 rounded-2xl bg-white border-2 text-left transition-all
                                            ${userType === 'SEEKER'
                                                ? 'border-coral-500 ring-2 ring-coral-200'
                                                : 'border-slate-200 hover:border-slate-300'
                                            }
                                        `}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div
                                                className={`
                                                    w-14 h-14 rounded-xl flex items-center justify-center
                                                    ${userType === 'SEEKER' ? 'bg-coral-50' : 'bg-slate-100'}
                                                `}
                                            >
                                                <Search
                                                    className={`w-7 h-7 ${userType === 'SEEKER' ? 'text-coral-500' : 'text-slate-600'}`}
                                                />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-slate-900">Je suis un Client</h3>
                                                <p className="text-sm text-slate-500">Établissement, structure ou particulier</p>
                                            </div>
                                        </div>
                                        {userType === 'SEEKER' ? (
                                            <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-coral-500 flex items-center justify-center">
                                                <Check className="w-4 h-4 text-white" />
                                            </div>
                                        ) : null}
                                    </motion.button>
                                </div>
                            </motion.div>
                        ) : null}

                        {step === 2 ? (
                            <motion.div
                                key="step2"
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.25 }}
                                className="space-y-8"
                            >
                                <div className="text-center">
                                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                                        Créez votre compte
                                    </h2>
                                    <p className="text-slate-500">Email + mot de passe. C’est tout.</p>
                                </div>

                                <form onSubmit={handleSubmit(onSubmitAccount)} className="space-y-6">
                                    <div>
                                        <label className="text-sm font-semibold text-slate-700 mb-1">Email *</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                            <input
                                                type="email"
                                                {...register('email')}
                                                className="input-premium !pl-10"
                                                placeholder="vous@exemple.com"
                                            />
                                        </div>
                                        {errors.email ? (
                                            <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                                        ) : null}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-semibold text-slate-700 mb-1">Mot de passe *</label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                                <input
                                                    type="password"
                                                    {...register('password')}
                                                    className="input-premium !pl-10"
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                            {errors.password ? (
                                                <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
                                            ) : null}
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-slate-700 mb-1">Confirmer *</label>
                                            <input
                                                type="password"
                                                {...register('confirmPassword')}
                                                className="input-premium"
                                                placeholder="••••••••"
                                            />
                                            {errors.confirmPassword ? (
                                                <p className="text-sm text-red-500 mt-1">{errors.confirmPassword.message}</p>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm font-semibold text-slate-700 mb-1">Code parrain (optionnel)</label>
                                        <input
                                            type="text"
                                            {...register('referrerCode')}
                                            className="input-premium"
                                            placeholder={refFromUrl || 'Ex: aB3kLm9_'}
                                        />
                                        {refFromUrl ? (
                                            <p className="text-xs text-slate-500 mt-2">Parrainage détecté via votre lien.</p>
                                        ) : null}
                                    </div>

                                    <div className="flex items-center justify-between pt-4">
                                        <button
                                            type="button"
                                            onClick={goBack}
                                            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                            Retour
                                        </button>

                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="btn-primary !px-6 !py-3 shadow-soft hover:shadow-soft-lg disabled:opacity-70"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Création…
                                                </>
                                            ) : (
                                                <>
                                                    Continuer
                                                    <ChevronRight className="w-5 h-5" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        ) : null}

                        {step === 3 ? (
                            <motion.div
                                key="step3"
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.25 }}
                                className="space-y-6"
                            >
                                <div className="text-center space-y-2">
                                    <div className="mx-auto h-12 w-12 rounded-2xl bg-coral-500/10 flex items-center justify-center">
                                        <Sparkles className="h-6 w-6 text-coral-600" />
                                    </div>
                                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                                        Qui êtes-vous ?
                                    </h2>
                                    <p className="text-slate-500">
                                        Choisissez quelques tags pour personnaliser votre expérience.
                                    </p>
                                </div>

                                <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6">
                                    {isLoadingTags ? (
                                        <div className="flex items-center justify-center gap-3 py-10 text-slate-600">
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            Chargement des tags…
                                        </div>
                                    ) : (
                                        <TagSelector
                                            tags={tags}
                                            selectedIds={selectedTagIds}
                                            onChange={setSelectedTagIds}
                                            maxSelected={10}
                                        />
                                    )}

                                    <div className="flex items-center justify-between pt-6">
                                        <button
                                            type="button"
                                            onClick={goBack}
                                            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                            Retour
                                        </button>

                                        <button
                                            type="button"
                                            onClick={submitTags}
                                            disabled={isSubmitting || isLoadingTags}
                                            className="btn-primary !px-6 !py-3 shadow-soft hover:shadow-soft-lg disabled:opacity-70"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Enregistrement…
                                                </>
                                            ) : (
                                                <>
                                                    Terminer
                                                    <ChevronRight className="w-5 h-5" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : null}

                        {step === 4 ? (
                            <motion.div
                                key="step4"
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.25 }}
                                className="text-center space-y-6"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                                    className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center"
                                >
                                    <Check className="w-10 h-10 text-green-600" />
                                </motion.div>

                                <div>
                                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                                        Bienvenue chez Les Extras !
                                    </h2>
                                    <p className="text-slate-500">Votre compte est prêt.</p>
                                </div>

                                <div className="flex items-center justify-center gap-2 text-slate-500">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Redirection vers votre tableau de bord…</span>
                                </div>
                            </motion.div>
                        ) : null}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}

