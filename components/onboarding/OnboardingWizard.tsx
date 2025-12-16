'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
    UserCheck,
    Search,
    Building2,
    Heart,
    ChevronRight,
    ChevronLeft,
    Check,
    Loader2,
    Mail,
    Lock,
    User,
    Phone,
} from 'lucide-react';

// ===========================================
// TYPES & SCHEMAS
// ===========================================

type UserType = 'TALENT' | 'SEEKER' | null;
type ClientType = 'ESTABLISHMENT' | 'FAMILY' | null;

const accountSchema = z.object({
    firstName: z.string().min(2, 'Prénom requis (min 2 caractères)'),
    lastName: z.string().min(2, 'Nom requis (min 2 caractères)'),
    email: z.string().email('Email invalide'),
    phone: z.string().min(10, 'Téléphone requis'),
    password: z.string().min(8, 'Mot de passe min 8 caractères'),
    confirmPassword: z.string(),
    establishmentName: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
});

type AccountFormData = z.infer<typeof accountSchema>;

// ===========================================
// ANIMATION VARIANTS
// ===========================================

const slideVariants = {
    enter: { opacity: 0, x: 30 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
};

const cardVariants = {
    idle: { scale: 1, boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' },
    hover: { scale: 1.02, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' },
};

// ===========================================
// COMPONENT
// ===========================================

export function OnboardingWizard() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [userType, setUserType] = useState<UserType>(null);
    const [clientType, setClientType] = useState<ClientType>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<AccountFormData>({
        resolver: zodResolver(accountSchema),
    });

    const totalSteps = userType === 'SEEKER' ? 4 : 3;
    const progressPercentage = (step / totalSteps) * 100;

    // ===========================================
    // HANDLERS
    // ===========================================

    const handleUserTypeSelect = (type: UserType) => {
        setUserType(type);
        if (type === 'TALENT') {
            setStep(3);
        } else {
            setStep(2);
        }
    };

    const handleClientTypeSelect = (type: ClientType) => {
        setClientType(type);
        setStep(3);
    };

    const goBack = () => {
        if (step === 3 && userType === 'TALENT') {
            setStep(1);
            setUserType(null);
        } else if (step === 3 && userType === 'SEEKER') {
            setStep(2);
        } else if (step === 2) {
            setStep(1);
            setUserType(null);
        }
    };

    const onSubmit = async (data: AccountFormData) => {
        setIsSubmitting(true);
        try {
            const payload = {
                ...data,
                role: userType === 'TALENT' ? 'EXTRA' : 'CLIENT',
                clientType: userType === 'SEEKER' ? (clientType === 'ESTABLISHMENT' ? 'ESTABLISHMENT' : 'PARTICULAR') : null,
            };

            const res = await fetch('/api/v1/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setStep(4);
                setTimeout(() => {
                    router.push('/dashboard');
                }, 2000);
            } else {
                const error = await res.json();
                alert(error.message || 'Erreur lors de l\'inscription');
            }
        } catch (error) {
            alert('Erreur de connexion au serveur');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ===========================================
    // RENDER
    // ===========================================

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
                <div className="max-w-2xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between mb-3">
                        <h1 className="text-xl font-bold text-slate-900">
                            Les <span className="text-coral-500">Extras</span>
                        </h1>
                        <span className="text-sm text-slate-500">
                            Étape {step} sur {totalSteps}
                        </span>
                    </div>

                    {/* Progress Bar */}
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

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center px-4 py-8">
                <div className="w-full max-w-2xl">
                    <AnimatePresence mode="wait">
                        {/* ========================================= */}
                        {/* STEP 1: Choix du profil */}
                        {/* ========================================= */}
                        {step === 1 && (
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
                                        Bienvenue. Quel est votre profil ?
                                    </h2>
                                    <p className="text-slate-500">Choisissez l'option qui vous correspond</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Carte Talent */}
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
                                            <div className={`
                                                w-14 h-14 rounded-xl flex items-center justify-center
                                                ${userType === 'TALENT' ? 'bg-coral-50' : 'bg-slate-100'}
                                            `}>
                                                <UserCheck className={`w-7 h-7 ${userType === 'TALENT' ? 'text-coral-500' : 'text-slate-600'}`} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-slate-900">Je suis un Talent</h3>
                                                <p className="text-sm text-slate-500">Professionnel du médico-social</p>
                                            </div>
                                        </div>
                                        {userType === 'TALENT' && (
                                            <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-coral-500 flex items-center justify-center">
                                                <Check className="w-4 h-4 text-white" />
                                            </div>
                                        )}
                                    </motion.button>

                                    {/* Carte Cherche Talent */}
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
                                            <div className={`
                                                w-14 h-14 rounded-xl flex items-center justify-center
                                                ${userType === 'SEEKER' ? 'bg-coral-50' : 'bg-slate-100'}
                                            `}>
                                                <Search className={`w-7 h-7 ${userType === 'SEEKER' ? 'text-coral-500' : 'text-slate-600'}`} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-slate-900">Je cherche un Talent</h3>
                                                <p className="text-sm text-slate-500">Établissement ou famille</p>
                                            </div>
                                        </div>
                                        {userType === 'SEEKER' && (
                                            <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-coral-500 flex items-center justify-center">
                                                <Check className="w-4 h-4 text-white" />
                                            </div>
                                        )}
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}

                        {/* ========================================= */}
                        {/* STEP 2: Précision (si SEEKER) */}
                        {/* ========================================= */}
                        {step === 2 && userType === 'SEEKER' && (
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
                                        Vous représentez...
                                    </h2>
                                    <p className="text-slate-500">Précisez votre situation</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Carte Établissement */}
                                    <motion.button
                                        type="button"
                                        variants={cardVariants}
                                        initial="idle"
                                        whileHover="hover"
                                        onClick={() => handleClientTypeSelect('ESTABLISHMENT')}
                                        className={`
                                            relative p-6 rounded-2xl bg-white border-2 text-left transition-all
                                            ${clientType === 'ESTABLISHMENT'
                                                ? 'border-coral-500 ring-2 ring-coral-200'
                                                : 'border-slate-200 hover:border-slate-300'
                                            }
                                        `}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`
                                                w-14 h-14 rounded-xl flex items-center justify-center
                                                ${clientType === 'ESTABLISHMENT' ? 'bg-coral-50' : 'bg-slate-100'}
                                            `}>
                                                <Building2 className={`w-7 h-7 ${clientType === 'ESTABLISHMENT' ? 'text-coral-500' : 'text-slate-600'}`} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-slate-900">Un Établissement</h3>
                                                <p className="text-sm text-slate-500">EHPAD, IME, Crèche, Hôpital...</p>
                                            </div>
                                        </div>
                                        {clientType === 'ESTABLISHMENT' && (
                                            <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-coral-500 flex items-center justify-center">
                                                <Check className="w-4 h-4 text-white" />
                                            </div>
                                        )}
                                    </motion.button>

                                    {/* Carte Famille */}
                                    <motion.button
                                        type="button"
                                        variants={cardVariants}
                                        initial="idle"
                                        whileHover="hover"
                                        onClick={() => handleClientTypeSelect('FAMILY')}
                                        className={`
                                            relative p-6 rounded-2xl bg-white border-2 text-left transition-all
                                            ${clientType === 'FAMILY'
                                                ? 'border-coral-500 ring-2 ring-coral-200'
                                                : 'border-slate-200 hover:border-slate-300'
                                            }
                                        `}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`
                                                w-14 h-14 rounded-xl flex items-center justify-center
                                                ${clientType === 'FAMILY' ? 'bg-coral-50' : 'bg-slate-100'}
                                            `}>
                                                <Heart className={`w-7 h-7 ${clientType === 'FAMILY' ? 'text-coral-500' : 'text-slate-600'}`} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-slate-900">Une Famille</h3>
                                                <p className="text-sm text-slate-500">Aidant, parent, tuteur...</p>
                                            </div>
                                        </div>
                                        {clientType === 'FAMILY' && (
                                            <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-coral-500 flex items-center justify-center">
                                                <Check className="w-4 h-4 text-white" />
                                            </div>
                                        )}
                                    </motion.button>
                                </div>

                                {/* Bouton Retour */}
                                <div className="flex justify-start">
                                    <button
                                        type="button"
                                        onClick={goBack}
                                        className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                        Retour
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* ========================================= */}
                        {/* STEP 3: Création de compte */}
                        {/* ========================================= */}
                        {step === 3 && (
                            <motion.div
                                key="step3"
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.25 }}
                                className="space-y-6"
                            >
                                <div className="text-center">
                                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                                        Créez votre compte
                                    </h2>
                                    <p className="text-slate-500">
                                        {userType === 'TALENT'
                                            ? 'Rejoignez notre communauté de professionnels'
                                            : clientType === 'ESTABLISHMENT'
                                                ? 'Inscrivez votre établissement'
                                                : 'Trouvez l\'accompagnement adapté'
                                        }
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl shadow-soft p-6 space-y-4">
                                    {/* Nom de l'établissement (si ESTABLISHMENT) */}
                                    {clientType === 'ESTABLISHMENT' && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                                <Building2 className="w-4 h-4 inline mr-1" />
                                                Nom de la structure *
                                            </label>
                                            <input
                                                type="text"
                                                {...register('establishmentName')}
                                                className="input-premium"
                                                placeholder="EHPAD Les Oliviers"
                                            />
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                                <User className="w-4 h-4 inline mr-1" />
                                                Prénom *
                                            </label>
                                            <input
                                                type="text"
                                                {...register('firstName')}
                                                className="input-premium"
                                                placeholder="Marie"
                                            />
                                            {errors.firstName && (
                                                <p className="text-sm text-red-500 mt-1">{errors.firstName.message}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Nom *</label>
                                            <input
                                                type="text"
                                                {...register('lastName')}
                                                className="input-premium"
                                                placeholder="Dupont"
                                            />
                                            {errors.lastName && (
                                                <p className="text-sm text-red-500 mt-1">{errors.lastName.message}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            <Mail className="w-4 h-4 inline mr-1" />
                                            Email *
                                        </label>
                                        <input
                                            type="email"
                                            {...register('email')}
                                            className="input-premium"
                                            placeholder="marie@exemple.com"
                                        />
                                        {errors.email && (
                                            <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            <Phone className="w-4 h-4 inline mr-1" />
                                            Téléphone *
                                        </label>
                                        <input
                                            type="tel"
                                            {...register('phone')}
                                            className="input-premium"
                                            placeholder="06 12 34 56 78"
                                        />
                                        {errors.phone && (
                                            <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                                <Lock className="w-4 h-4 inline mr-1" />
                                                Mot de passe *
                                            </label>
                                            <input
                                                type="password"
                                                {...register('password')}
                                                className="input-premium"
                                                placeholder="••••••••"
                                            />
                                            {errors.password && (
                                                <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Confirmer *</label>
                                            <input
                                                type="password"
                                                {...register('confirmPassword')}
                                                className="input-premium"
                                                placeholder="••••••••"
                                            />
                                            {errors.confirmPassword && (
                                                <p className="text-sm text-red-500 mt-1">{errors.confirmPassword.message}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
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
                                                    Création...
                                                </>
                                            ) : (
                                                <>
                                                    Créer mon compte
                                                    <ChevronRight className="w-5 h-5" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        )}

                        {/* ========================================= */}
                        {/* STEP 4: Succès */}
                        {/* ========================================= */}
                        {step === 4 && (
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
                                    <p className="text-slate-500">
                                        Votre compte a été créé avec succès.
                                    </p>
                                </div>

                                <div className="flex items-center justify-center gap-2 text-slate-500">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Redirection vers votre tableau de bord...</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
