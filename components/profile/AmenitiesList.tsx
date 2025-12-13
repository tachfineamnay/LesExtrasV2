'use client';

import { motion } from 'framer-motion';
import { 
    Car, 
    Utensils, 
    Users, 
    Coffee, 
    Wifi, 
    Clock, 
    Shield, 
    Heart,
    Accessibility,
    TreePine,
    Bus,
    Baby,
    Dumbbell,
    Music,
    Palette,
    Dog,
    Sun,
    Moon,
    type LucideIcon
} from 'lucide-react';

export type AmenityType = 
    | 'parking'
    | 'meals'
    | 'young_team'
    | 'coffee'
    | 'wifi'
    | 'flexible_hours'
    | 'insurance'
    | 'care'
    | 'accessibility'
    | 'garden'
    | 'transport'
    | 'childcare'
    | 'gym'
    | 'music_therapy'
    | 'art_therapy'
    | 'pets_allowed'
    | 'day_shift'
    | 'night_shift';

export interface Amenity {
    type: AmenityType;
    label?: string;
}

const amenityConfig: Record<AmenityType, {
    icon: LucideIcon;
    label: string;
    color: string;
    bgColor: string;
}> = {
    parking: {
        icon: Car,
        label: 'Parking gratuit',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
    },
    meals: {
        icon: Utensils,
        label: 'Repas offert',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
    },
    young_team: {
        icon: Users,
        label: 'Équipe jeune',
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
    },
    coffee: {
        icon: Coffee,
        label: 'Café à volonté',
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
    },
    wifi: {
        icon: Wifi,
        label: 'WiFi disponible',
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-50',
    },
    flexible_hours: {
        icon: Clock,
        label: 'Horaires flexibles',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
    },
    insurance: {
        icon: Shield,
        label: 'Assurance incluse',
        color: 'text-slate-600',
        bgColor: 'bg-slate-50',
    },
    care: {
        icon: Heart,
        label: 'Ambiance bienveillante',
        color: 'text-pink-600',
        bgColor: 'bg-pink-50',
    },
    accessibility: {
        icon: Accessibility,
        label: 'Accessible PMR',
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
    },
    garden: {
        icon: TreePine,
        label: 'Espace vert',
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
    },
    transport: {
        icon: Bus,
        label: 'Transports à proximité',
        color: 'text-sky-600',
        bgColor: 'bg-sky-50',
    },
    childcare: {
        icon: Baby,
        label: 'Crèche d\'entreprise',
        color: 'text-rose-600',
        bgColor: 'bg-rose-50',
    },
    gym: {
        icon: Dumbbell,
        label: 'Salle de sport',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
    },
    music_therapy: {
        icon: Music,
        label: 'Musicothérapie',
        color: 'text-violet-600',
        bgColor: 'bg-violet-50',
    },
    art_therapy: {
        icon: Palette,
        label: 'Art-thérapie',
        color: 'text-fuchsia-600',
        bgColor: 'bg-fuchsia-50',
    },
    pets_allowed: {
        icon: Dog,
        label: 'Animaux acceptés',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
    },
    day_shift: {
        icon: Sun,
        label: 'Poste de jour',
        color: 'text-amber-500',
        bgColor: 'bg-amber-50',
    },
    night_shift: {
        icon: Moon,
        label: 'Poste de nuit',
        color: 'text-indigo-500',
        bgColor: 'bg-indigo-50',
    },
};

export interface AmenitiesListProps {
    amenities: Amenity[];
    /** Display style */
    variant?: 'grid' | 'inline' | 'compact';
    /** Maximum items to show before "more" */
    maxVisible?: number;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            type: 'spring' as const,
            stiffness: 200,
            damping: 20,
        },
    },
};

export function AmenitiesList({ 
    amenities, 
    variant = 'grid',
    maxVisible = 8,
}: AmenitiesListProps) {
    if (amenities.length === 0) return null;

    const visibleAmenities = amenities.slice(0, maxVisible);
    const hiddenCount = amenities.length - maxVisible;

    if (variant === 'compact') {
        return (
            <div className="flex flex-wrap gap-2">
                {visibleAmenities.map((amenity, index) => {
                    const config = amenityConfig[amenity.type];
                    const Icon = config.icon;

                    return (
                        <span
                            key={index}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}
                            title={amenity.label || config.label}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            {amenity.label || config.label}
                        </span>
                    );
                })}
                {hiddenCount > 0 && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        +{hiddenCount}
                    </span>
                )}
            </div>
        );
    }

    if (variant === 'inline') {
        return (
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="flex flex-wrap gap-2"
            >
                {visibleAmenities.map((amenity, index) => {
                    const config = amenityConfig[amenity.type];
                    const Icon = config.icon;

                    return (
                        <motion.div
                            key={index}
                            variants={itemVariants}
                            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl ${config.bgColor} border border-slate-100`}
                        >
                            <Icon className={`w-4 h-4 ${config.color}`} />
                            <span className="text-sm font-medium text-slate-700">
                                {amenity.label || config.label}
                            </span>
                        </motion.div>
                    );
                })}
            </motion.div>
        );
    }

    // Grid variant (default)
    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 sm:grid-cols-3 gap-3"
        >
            {visibleAmenities.map((amenity, index) => {
                const config = amenityConfig[amenity.type];
                const Icon = config.icon;

                return (
                    <motion.div
                        key={index}
                        variants={itemVariants}
                        whileHover={{ scale: 1.02 }}
                        className={`flex items-center gap-3 p-3 rounded-xl ${config.bgColor} border border-slate-100/50 cursor-default`}
                    >
                        <div className={`w-9 h-9 rounded-lg bg-white/80 flex items-center justify-center shadow-sm`}>
                            <Icon className={`w-5 h-5 ${config.color}`} />
                        </div>
                        <span className="text-sm font-medium text-slate-700">
                            {amenity.label || config.label}
                        </span>
                    </motion.div>
                );
            })}
            
            {hiddenCount > 0 && (
                <motion.button
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                    +{hiddenCount} autres avantages
                </motion.button>
            )}
        </motion.div>
    );
}

// Helper to convert string array to Amenity array
export function parseAmenities(amenityStrings: string[]): Amenity[] {
    const typeMap: Record<string, AmenityType> = {
        'parking': 'parking',
        'parking gratuit': 'parking',
        'repas': 'meals',
        'repas offert': 'meals',
        'équipe jeune': 'young_team',
        'jeune équipe': 'young_team',
        'café': 'coffee',
        'wifi': 'wifi',
        'horaires flexibles': 'flexible_hours',
        'flexible': 'flexible_hours',
        'assurance': 'insurance',
        'bienveillant': 'care',
        'bienveillance': 'care',
        'accessible': 'accessibility',
        'pmr': 'accessibility',
        'jardin': 'garden',
        'espace vert': 'garden',
        'transport': 'transport',
        'métro': 'transport',
        'crèche': 'childcare',
        'sport': 'gym',
        'musique': 'music_therapy',
        'musicothérapie': 'music_therapy',
        'art': 'art_therapy',
        'art-thérapie': 'art_therapy',
        'animaux': 'pets_allowed',
        'jour': 'day_shift',
        'nuit': 'night_shift',
    };

    return amenityStrings.map(str => {
        const normalized = str.toLowerCase().trim();
        const type = typeMap[normalized] || 'care';
        return { type, label: str };
    });
}
