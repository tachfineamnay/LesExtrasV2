'use client';

import type { MouseEvent } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Video, Palette, Star, MapPin, MessageCircle } from 'lucide-react';

// ===========================================
// SERVICE CARD - Design "Split Content" SEO
// Structure: Image 16:9 + Avatar Overlap + Body Text
// Palette: Teal-500 / Indigo-600
// SEO: <article>, <h3>, <p>, alt dynamique
// ===========================================

export interface ServiceCardProps {
    data: any;
    currentUserId?: string;
    onSelfContact?: () => void;
    onClick?: () => void;
}

const getInitials = (value?: string) => {
    if (!value) return 'LX';
    const parts = value.split(' ').filter(Boolean);
    if (parts.length === 0) return 'LX';
    return parts.map((part) => part[0]?.toUpperCase()).join('').slice(0, 2);
};

// Service type badge config
const serviceTypeBadge = {
    COACHING_VIDEO: { 
        label: 'SocioLive', 
        icon: Video, 
        bgColor: 'bg-teal-500', 
        textColor: 'text-white',
        emoji: '🎥'
    },
    WORKSHOP: { 
        label: 'Atelier', 
        icon: Palette, 
        bgColor: 'bg-indigo-600', 
        textColor: 'text-white',
        emoji: '🎨'
    },
    DEFAULT: { 
        label: 'Service', 
        icon: Palette, 
        bgColor: 'bg-slate-700', 
        textColor: 'text-white',
        emoji: '✨'
    },
};

export function ServiceCard({
    data,
    currentUserId,
    onClick,
    onSelfContact,
}: ServiceCardProps) {
    const service = data || {};
    const authorId = service?.profile?.userId || service?.authorId || service?.author?.id;
    const title = service?.name || service?.title || 'Service';
    const providerFirstName = service?.profile?.firstName || '';
    const providerLastName = service?.profile?.lastName || '';
    const providerName = service?.profile
        ? `${providerFirstName} ${providerLastName}`.trim() || service.profile.displayName || service.authorName || 'Expert'
        : service?.authorName || service?.providerName || 'Expert';
    const providerAvatar = service?.profile?.avatarUrl || service?.authorAvatar || service?.providerAvatar;
    const providerRating = Number(service?.providerRating ?? service?.profile?.averageRating ?? 0);
    const providerReviews = Number(service?.providerReviews ?? service?.profile?.totalReviews ?? 0);
    const city = service?.city || service?.profile?.city || '';
    const description = service?.content || service?.description || service?.bio || '';
    const serviceType = (service?.serviceType || service?.type || 'WORKSHOP') as keyof typeof serviceTypeBadge;
    const category = service?.category;
    const basePriceRaw = service?.basePrice ?? service?.hourlyRate ?? null;
    const basePrice = basePriceRaw !== null && basePriceRaw !== undefined ? Number(basePriceRaw) : null;
    const showBasePrice = basePrice !== null && !Number.isNaN(basePrice);
    const cardId = service?.id || service?.serviceId;
    const detailHref = cardId ? `/offer/${cardId}` : undefined;
    
    // Tags pour SEO
    const rawTags = Array.isArray(service?.tags) ? service.tags : [];
    const tags: string[] = rawTags.filter((tag: unknown): tag is string => typeof tag === 'string' && tag.trim().length > 0).slice(0, 3);
    
    // Image de l'expert en action
    const imageUrl =
        service?.imageUrl ||
        (Array.isArray(service?.imageUrls) ? service.imageUrls[0] : undefined) ||
        (Array.isArray(service?.galleryUrls) ? service.galleryUrls[0] : undefined) ||
        service?.coverImage;
    
    const hasImage = Boolean(imageUrl);
    const badgeConfig = serviceTypeBadge[serviceType] || serviceTypeBadge.DEFAULT;
    const BadgeIcon = badgeConfig.icon;
    const router = useRouter();

    // SEO: Alt tag dynamique
    const imageAlt = `${title} par ${providerName}${city ? ` à ${city}` : ''}`;

    const handleContact = (event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        event.preventDefault();

        if (!authorId) return;
        if (currentUserId && authorId === currentUserId) {
            onSelfContact?.();
            return;
        }

        router.push(`/messages?recipientId=${encodeURIComponent(authorId)}`);
    };

    const card = (
        <motion.article
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="group relative bg-white rounded-2xl overflow-hidden cursor-pointer
                       shadow-soft hover:shadow-soft-lg
                       transition-all duration-300"
            itemScope
            itemType="https://schema.org/Service"
        >
            {/* ========== HEADER IMAGE (16:9) ========== */}
            <div className="relative aspect-video overflow-hidden">
                {/* Background Image or Gradient */}
                {hasImage ? (
                    <img
                        src={imageUrl}
                        alt={imageAlt}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        decoding="async"
                        itemProp="image"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-400 via-teal-400 to-indigo-500" />
                )}

                {/* Floating Badges - Top */}
                <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                    {/* Service Type Badge */}
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${badgeConfig.bgColor} ${badgeConfig.textColor} shadow-lg backdrop-blur-sm`}>
                        <BadgeIcon className="w-3.5 h-3.5" />
                        {badgeConfig.label}
                    </span>

                    {/* Category Badge */}
                    {category && (
                        <span className="px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm text-xs font-medium text-slate-700 shadow-lg">
                            {category}
                        </span>
                    )}
                </div>
            </div>

            {/* ========== AVATAR OVERLAP (Cheval) ========== */}
            <div className="relative px-5">
                <div className="absolute -top-6 left-5 z-10">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center overflow-hidden ring-4 ring-white shadow-lg">
                        {providerAvatar ? (
                            <img
                                src={providerAvatar}
                                alt={`Photo de ${providerName}`}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                decoding="async"
                            />
                        ) : (
                            <span className="text-sm font-bold text-white">
                                {getInitials(providerName)}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* ========== BODY (Contenu Blanc) ========== */}
            <div className="p-5 pt-8">
                {/* Titre SEO */}
                <h3 
                    className="text-lg font-bold text-slate-900 leading-tight line-clamp-1 group-hover:text-indigo-600 transition-colors"
                    itemProp="name"
                >
                    {title}
                </h3>

                {/* Expert Name + Location */}
                <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                    <span itemProp="provider">{providerName}</span>
                    {city && (
                        <>
                            <span>•</span>
                            <span className="inline-flex items-center gap-0.5">
                                <MapPin className="w-3 h-3" />
                                <span itemProp="areaServed">{city}</span>
                            </span>
                        </>
                    )}
                </div>

                {/* Description SEO (VITAL) */}
                {description && (
                    <p 
                        className="text-sm text-slate-600 mt-3 line-clamp-2 leading-relaxed"
                        itemProp="description"
                    >
                        {description}
                    </p>
                )}

                {/* Tags SEO */}
                {tags.length > 0 && (
                    <ul className="flex flex-wrap gap-1.5 mt-3" aria-label="Compétences">
                        {tags.map((tag, index) => (
                            <li 
                                key={index}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 text-xs text-slate-600 font-medium"
                            >
                                {tag}
                            </li>
                        ))}
                    </ul>
                )}

                {/* ========== FOOTER (Méta) ========== */}
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                    {/* Rating */}
                    <div className="flex items-center gap-1">
                        {providerRating > 0 ? (
                            <>
                                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                <span className="text-sm font-semibold text-slate-900">{providerRating.toFixed(1)}</span>
                                <span className="text-xs text-slate-400">({providerReviews})</span>
                            </>
                        ) : (
                            <span className="text-xs text-slate-400">Nouveau</span>
                        )}
                    </div>

                    {/* Price */}
                    {showBasePrice && (
                        <div className="flex items-baseline gap-0.5" itemProp="offers" itemScope itemType="https://schema.org/Offer">
                            <span className="text-lg font-bold text-indigo-600" itemProp="price">{basePrice}</span>
                            <span className="text-sm text-slate-500">€/h</span>
                            <meta itemProp="priceCurrency" content="EUR" />
                        </div>
                    )}
                </div>

                {/* CTA Button */}
                <button
                    type="button"
                    onClick={handleContact}
                    className="w-full mt-4 inline-flex items-center justify-center gap-2 
                               px-4 py-2.5 rounded-xl 
                               bg-gradient-to-r from-teal-500 to-indigo-600 
                               text-white text-sm font-semibold
                               hover:from-teal-600 hover:to-indigo-700
                               shadow-md hover:shadow-lg
                               active:scale-[0.98] transition-all"
                    aria-label={`Contacter ${providerName}`}
                >
                    <MessageCircle className="w-4 h-4" />
                    Contacter l'expert
                </button>
            </div>

            {/* Hover Border Effect */}
            <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-teal-300 transition-colors pointer-events-none" />
        </motion.article>
    );

    return detailHref ? (
        <Link href={detailHref} className="block h-full">
            {card}
        </Link>
    ) : (
        card
    );
}
