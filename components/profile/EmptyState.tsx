'use client';

import { motion } from 'framer-motion';
import { 
    Sprout, 
    Handshake, 
    Sparkles,
    Star,
    Briefcase,
    MessageCircle
} from 'lucide-react';

export type EmptyStateType = 'missions' | 'reviews' | 'profile';

export interface EmptyStateProps {
    type: EmptyStateType;
    /** User's first name for personalization */
    userName?: string;
    /** Whether this is the user's own profile */
    isOwnProfile?: boolean;
    /** Custom message override */
    customMessage?: string;
    /** Action button callback */
    onAction?: () => void;
    /** Action button label */
    actionLabel?: string;
}

const emptyStateConfig: Record<EmptyStateType, {
    icon: typeof Sprout;
    title: string;
    titleOwn: string;
    description: string;
    descriptionOwn: string;
    iconBg: string;
    iconColor: string;
}> = {
    missions: {
        icon: Sprout,
        title: 'Ce profil est nouveau sur Les Extras !',
        titleOwn: 'Votre parcours commence ici',
        description: 'Soyez le premier à collaborer avec eux.',
        descriptionOwn: 'Complétez votre première mission pour construire votre réputation.',
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
    },
    reviews: {
        icon: Handshake,
        title: 'Pas encore d\'avis',
        titleOwn: 'Aucun avis pour le moment',
        description: 'Soyez le premier à partager votre expérience avec ce profil.',
        descriptionOwn: 'Les avis apparaîtront ici après vos premières collaborations.',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
    },
    profile: {
        icon: Sparkles,
        title: 'Profil en cours de création',
        titleOwn: 'Complétez votre profil',
        description: 'Ce membre n\'a pas encore complété son profil.',
        descriptionOwn: 'Ajoutez vos compétences et expériences pour attirer plus de missions.',
        iconBg: 'bg-coral-100',
        iconColor: 'text-coral-600',
    },
};

const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            type: 'spring' as const,
            stiffness: 100,
            damping: 15,
        },
    },
};

export function EmptyState({
    type,
    userName,
    isOwnProfile = false,
    customMessage,
    onAction,
    actionLabel,
}: EmptyStateProps) {
    const config = emptyStateConfig[type];
    const Icon = config.icon;

    const title = customMessage ? customMessage : (isOwnProfile ? config.titleOwn : config.title);
    const description = isOwnProfile ? config.descriptionOwn : config.description;

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="py-12 px-6 text-center"
        >
            {/* Animated Icon Container */}
            <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="relative inline-flex mb-6"
            >
                {/* Background Glow */}
                <div className={`absolute inset-0 ${config.iconBg} rounded-full blur-xl opacity-50`} />
                
                {/* Icon Circle */}
                <div className={`relative w-20 h-20 rounded-full ${config.iconBg} flex items-center justify-center`}>
                    <Icon className={`w-10 h-10 ${config.iconColor}`} />
                </div>

                {/* Decorative Sparkles */}
                <motion.div
                    animate={{ 
                        rotate: [0, 10, -10, 0],
                        scale: [1, 1.1, 1],
                    }}
                    transition={{ 
                        duration: 3, 
                        repeat: Infinity,
                        repeatType: 'reverse' 
                    }}
                    className="absolute -top-1 -right-1"
                >
                    <Sparkles className="w-5 h-5 text-amber-400" />
                </motion.div>
            </motion.div>

            {/* Title */}
            <motion.h3
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-lg font-semibold text-slate-900 mb-2"
            >
                {userName && !isOwnProfile ? title.replace('Ce profil', userName) : title}
            </motion.h3>

            {/* Description */}
            <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-slate-500 max-w-xs mx-auto mb-6"
            >
                {description}
            </motion.p>

            {/* Action Button */}
            {onAction && actionLabel && (
                <motion.button
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onAction}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-coral-500 text-white font-medium text-sm hover:bg-coral-600 transition-colors shadow-lg shadow-coral-500/25"
                >
                    {type === 'missions' && <Briefcase className="w-4 h-4" />}
                    {type === 'reviews' && <Star className="w-4 h-4" />}
                    {type === 'profile' && <MessageCircle className="w-4 h-4" />}
                    {actionLabel}
                </motion.button>
            )}

            {/* Encouragement for new profiles */}
            {type === 'missions' && !isOwnProfile && (
                <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-100"
                >
                    <Sprout className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-medium text-green-700">
                        Nouveau membre • Inscrit récemment
                    </span>
                </motion.div>
            )}
        </motion.div>
    );
}
