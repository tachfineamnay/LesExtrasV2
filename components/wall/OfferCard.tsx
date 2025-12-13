'use client';

import type { MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Star, MapPin, Video } from 'lucide-react';
import { CardShell } from './CardShell';

export interface OfferCardProps {
    id: string;
    authorId?: string;
    currentUserId?: string;
    onSelfContact?: () => void;
    title: string;
    providerName: string;
    providerAvatar?: string;
    providerRating?: number;
    providerReviews?: number;
    city?: string;
    description: string;
    serviceType: 'WORKSHOP' | 'COACHING_VIDEO';
    category?: string;
    basePrice?: number;
    imageUrl?: string;
    tags?: string[];
    onClick?: () => void;
    /** Whether the card is favorited */
    isFavorite?: boolean;
    /** Callback when favorite is toggled */
    onFavoriteToggle?: () => void;
    /** Callback when share is clicked */
    onShare?: () => void;
}

export function OfferCard({
    authorId,
    currentUserId,
    title,
    providerName,
    providerAvatar,
    providerRating = 0,
    providerReviews = 0,
    city,
    description,
    serviceType,
    category,
    basePrice,
    imageUrl,
    tags = [],
    onClick,
    onSelfContact,
    isFavorite = false,
    onFavoriteToggle,
    onShare,
}: OfferCardProps) {
    const isVideo = serviceType === 'COACHING_VIDEO';
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

    // Hero content - Image or Pattern
    const heroContent = imageUrl ? (
        <div className="relative h-36 overflow-hidden">
            <img
                src={imageUrl}
                alt={title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

            {/* Video Badge */}
            {isVideo && (
                <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs font-medium text-slate-700 shadow-sm">
                        <Video className="w-3 h-3 text-coral-500" />
                        Visio
                    </span>
                </div>
            )}
        </div>
    ) : (
        <div className="pattern-hero">
            {/* Video Badge on pattern hero */}
            {isVideo && (
                <div className="absolute top-3 right-3 z-10">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs font-medium text-slate-700 shadow-sm">
                        <Video className="w-3 h-3 text-coral-500" />
                        Visio
                    </span>
                </div>
            )}

            {/* Provider Avatar - Centered in hero when no image */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-coral-100 to-coral-200 flex items-center justify-center overflow-hidden ring-4 ring-white shadow-lg">
                    {providerAvatar ? (
                        <img src={providerAvatar} alt={providerName} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-xl font-bold text-coral-600">
                            {providerName.charAt(0).toUpperCase()}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );

    // Footer content with price and contact button
    const footerContent = (
        <div className="flex items-center gap-3">
            {basePrice && (
                <span className="inline-flex items-center gap-0.5 font-semibold text-slate-900">
                    <span className="text-lg">{basePrice} €</span>
                    <span className="text-xs text-slate-400 font-normal">/séance</span>
                </span>
            )}
            <button
                type="button"
                onClick={handleContact}
                className="btn-secondary"
                aria-label={`Contacter ${providerName}`}
            >
                Contacter
            </button>
        </div>
    );

    return (
        <CardShell
            variant="offer"
            hasImage={!!imageUrl}
            heroContent={heroContent}
            onClick={onClick}
            isFavorite={isFavorite}
            onFavoriteToggle={handleFavoriteToggle}
            onShare={handleShare}
            showSocialActions={true}
            footerContent={footerContent}
        >
            {/* Provider Info */}
            <div className="flex items-center gap-3 mb-3">
                {/* Small Avatar (when hero has image) */}
                {imageUrl && (
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-coral-100 to-coral-200 flex items-center justify-center overflow-hidden ring-2 ring-white shadow-sm">
                        {providerAvatar ? (
                            <img src={providerAvatar} alt={providerName} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-sm font-semibold text-coral-600">
                                {providerName.charAt(0).toUpperCase()}
                            </span>
                        )}
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{providerName}</p>
                    <div className="flex items-center gap-1.5">
                        {providerRating > 0 && (
                            <>
                                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                <span className="text-xs font-medium text-slate-700">{providerRating.toFixed(1)}</span>
                                <span className="text-xs text-slate-400">({providerReviews})</span>
                            </>
                        )}
                        {city && (
                            <span className="inline-flex items-center gap-0.5 text-xs text-slate-400 ml-1">
                                <MapPin className="w-3 h-3" />
                                {city}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Title */}
            <h3 className="font-semibold text-slate-900 text-base leading-tight line-clamp-2 group-hover:text-coral-600 transition-colors mb-2">
                {title}
            </h3>

            {/* Category Badge */}
            {category && (
                <span className="inline-block px-3 py-1 rounded-lg bg-coral-50 text-coral-700 text-xs font-medium mb-3">
                    {category}
                </span>
            )}

            {/* Description */}
            <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 mb-4">
                {description}
            </p>

            {/* Tags */}
            {tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {tags.slice(0, 2).map((tag, index) => (
                        <span
                            key={index}
                            className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs"
                        >
                            {tag}
                        </span>
                    ))}
                    {tags.length > 2 && (
                        <span className="text-xs text-slate-400">+{tags.length - 2}</span>
                    )}
                </div>
            )}
        </CardShell>
    );
}
