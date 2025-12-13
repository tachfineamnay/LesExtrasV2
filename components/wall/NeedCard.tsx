'use client';

import type { MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, MapPin, AlertTriangle, Building2 } from 'lucide-react';
import { CardShell } from './CardShell';

export interface NeedCardProps {
    id: string;
    authorId?: string;
    currentUserId?: string;
    onSelfContact?: () => void;
    title: string;
    establishment: string;
    establishmentLogo?: string;
    city: string;
    description: string;
    urgencyLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    hourlyRate?: number;
    jobTitle: string;
    startDate: string;
    isNightShift?: boolean;
    tags?: string[];
    onClick?: () => void;
    /** Whether the card is favorited */
    isFavorite?: boolean;
    /** Callback when favorite is toggled */
    onFavoriteToggle?: () => void;
    /** Callback when share is clicked */
    onShare?: () => void;
}

const urgencyConfig = {
    LOW: { label: 'Sous 1 semaine', color: 'bg-slate-100 text-slate-600' },
    MEDIUM: { label: 'Sous 48h', color: 'bg-amber-100 text-amber-700' },
    HIGH: { label: 'Sous 24h', color: 'bg-orange-100 text-orange-700' },
    CRITICAL: { label: 'Urgent', color: 'bg-red-100 text-red-700' },
};

export function NeedCard({
    id,
    authorId,
    currentUserId,
    title,
    establishment,
    establishmentLogo,
    city,
    description,
    urgencyLevel = 'MEDIUM',
    hourlyRate,
    jobTitle,
    startDate,
    isNightShift,
    tags = [],
    onClick,
    onSelfContact,
    isFavorite = false,
    onFavoriteToggle,
    onShare,
}: NeedCardProps) {
    const urgency = urgencyConfig[urgencyLevel];
    const isUrgent = urgencyLevel === 'HIGH' || urgencyLevel === 'CRITICAL';
    const router = useRouter();

    const handleContact = (event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();

        if (!authorId) return;
        if (currentUserId && authorId === currentUserId) {
            onSelfContact?.();
            return;
        }

        router.push(`/messages?recipientId=${encodeURIComponent(authorId)}`);
    };

    const handleFavoriteToggle = () => {
        onFavoriteToggle?.();
    };

    const handleShare = () => {
        onShare?.();
    };

    // Hero content with establishment branding
    const heroContent = (
        <div className="pattern-hero-need">
            {/* Urgent Badge */}
            {isUrgent && (
                <div className="absolute top-3 right-3 z-10">
                    <span className={`
                        inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold
                        ${urgency.color} animate-pulse shadow-sm
                    `}>
                        <AlertTriangle className="w-3 h-3" />
                        {urgency.label}
                    </span>
                </div>
            )}

            {/* Establishment Logo - Centered in hero */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-white/90 backdrop-blur-sm flex items-center justify-center overflow-hidden shadow-soft">
                    {establishmentLogo ? (
                        <img src={establishmentLogo} alt={establishment} className="w-full h-full object-cover" />
                    ) : (
                        <Building2 className="w-8 h-8 text-blue-500" />
                    )}
                </div>
            </div>
        </div>
    );

    // Contact button (secondary style for feed)
    const contactButton = (
        <button
            type="button"
            onClick={handleContact}
            className="btn-secondary"
            aria-label={`Contacter ${establishment}`}
        >
            Contacter
        </button>
    );

    return (
        <CardShell
            variant="need"
            hasImage={false}
            heroContent={heroContent}
            onClick={onClick}
            isFavorite={isFavorite}
            onFavoriteToggle={handleFavoriteToggle}
            onShare={handleShare}
            showSocialActions={true}
            footerContent={contactButton}
        >
            {/* Header */}
            <div className="mb-4">
                <h3 className="font-semibold text-slate-900 text-base leading-tight line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {title}
                </h3>
                <p className="text-sm text-slate-500 mt-1">{establishment}</p>
            </div>

            {/* Job Title Badge */}
            <div className="mb-3">
                <span className="inline-block px-3 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium">
                    {jobTitle}
                </span>
            </div>

            {/* Description */}
            <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 mb-4">
                {description}
            </p>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
                    {city}
                </span>
                <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    {new Date(startDate).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short'
                    })}
                    {isNightShift && ' - Nuit'}
                </span>
                {hourlyRate && (
                    <span className="ml-auto font-semibold text-slate-900">
                        {hourlyRate} €/h
                    </span>
                )}
            </div>

            {/* Tags */}
            {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-slate-100">
                    {tags.slice(0, 3).map((tag, index) => (
                        <span
                            key={index}
                            className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs"
                        >
                            {tag}
                        </span>
                    ))}
                    {tags.length > 3 && (
                        <span className="text-xs text-slate-400">+{tags.length - 3}</span>
                    )}
                </div>
            )}
        </CardShell>
    );
}
