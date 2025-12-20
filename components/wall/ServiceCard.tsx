'use client';

import type { KeyboardEvent, MouseEvent } from 'react';
import { MapPin, MessageCircle, Palette, Star, Video } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
    return parts
        .map((part) => part[0]?.toUpperCase())
        .join('')
        .slice(0, 2);
};

const serviceTypeBadge = {
    COACHING_VIDEO: {
        label: 'SocioLive',
        icon: Video,
        className: 'bg-teal-50 text-teal-700 ring-1 ring-teal-200/60',
    },
    WORKSHOP: {
        label: 'Atelier',
        icon: Palette,
        className: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/60',
    },
    DEFAULT: {
        label: 'Service',
        icon: Palette,
        className: 'bg-slate-50 text-slate-700 ring-1 ring-slate-200',
    },
} as const;

export function ServiceCard({ data, currentUserId, onSelfContact, onClick }: ServiceCardProps) {
    const router = useRouter();
    const service = data || {};

    const authorId = service?.profile?.userId || service?.authorId || service?.author?.id;
    const cardId = service?.id || service?.serviceId;
    const detailHref = cardId ? `/offer/${cardId}` : null;

    const title = service?.name || service?.title || 'Service';
    const providerName = service?.profile
        ? `${service.profile.firstName || ''} ${service.profile.lastName || ''}`.trim() ||
          service.profile.displayName ||
          service.authorName ||
          'Expert'
        : service?.authorName || service?.providerName || 'Expert';

    const providerAvatar = service?.profile?.avatarUrl || service?.authorAvatar || service?.providerAvatar || null;
    const providerRating = Number(service?.providerRating ?? service?.profile?.averageRating ?? 0);
    const providerReviews = Number(service?.providerReviews ?? service?.profile?.totalReviews ?? 0);
    const city = service?.city || service?.profile?.city || '';

    const description = service?.shortDescription || service?.description || service?.content || service?.bio || '';
    const category = typeof service?.category === 'string' ? service.category : null;

    const basePriceRaw = service?.basePrice ?? service?.hourlyRate ?? null;
    const basePrice = basePriceRaw !== null && basePriceRaw !== undefined ? Number(basePriceRaw) : null;
    const showBasePrice = basePrice !== null && !Number.isNaN(basePrice);

    const serviceType = (service?.serviceType || service?.type || 'WORKSHOP') as keyof typeof serviceTypeBadge;
    const badgeConfig = serviceTypeBadge[serviceType] || serviceTypeBadge.DEFAULT;
    const BadgeIcon = badgeConfig.icon;

    const imageUrl =
        service?.imageUrl ||
        (Array.isArray(service?.imageUrls) ? service.imageUrls[0] : undefined) ||
        (Array.isArray(service?.galleryUrls) ? service.galleryUrls[0] : undefined) ||
        service?.coverImage ||
        null;

    const imageAlt = `${title} par ${providerName}${city ? ` à ${city}` : ''}`;

    const handleContact = (event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        event.preventDefault();

        if (!authorId) return;
        if (currentUserId && authorId === currentUserId) {
            onSelfContact?.();
            return;
        }

        router.push(`/messages?recipientId=${encodeURIComponent(String(authorId))}`);
    };

    const handleOpenDetail = () => {
        if (onClick) {
            onClick();
            return;
        }

        if (detailHref) {
            router.push(detailHref);
        }
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
        if (!detailHref) return;
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        handleOpenDetail();
    };

    return (
        <article
            onClick={handleOpenDetail}
            onKeyDown={handleKeyDown}
            role={detailHref ? 'button' : undefined}
            tabIndex={detailHref ? 0 : undefined}
            className="group flex flex-col h-full min-h-0 bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden transition-all hover:-translate-y-1 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-200"
        >
            <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={imageAlt}
                        className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                        loading="lazy"
                        decoding="async"
                    />
                ) : (
                    <div className="h-full w-full bg-gradient-to-br from-indigo-500 via-indigo-400 to-teal-500" />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-black/0 to-black/0" />

                <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
                    <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${badgeConfig.className}`}
                    >
                        <BadgeIcon className="h-4 w-4" />
                        {badgeConfig.label}
                    </span>
                    {category ? (
                        <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-white/60">
                            {category}
                        </span>
                    ) : null}
                </div>
            </div>

            <div className="flex-1 flex flex-col p-5 gap-4">
                <div className="space-y-2">
                    <h3 className="text-base sm:text-lg font-semibold tracking-tight text-slate-900 leading-snug line-clamp-2">
                        {title}
                    </h3>

                    <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-xl bg-slate-100 ring-1 ring-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                            {providerAvatar ? (
                                <img
                                    src={providerAvatar}
                                    alt={providerName}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                    decoding="async"
                                />
                            ) : (
                                <span className="text-sm font-semibold text-slate-700">{getInitials(providerName)}</span>
                            )}
                        </div>

                        <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{providerName}</p>
                            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                                {providerRating > 0 ? (
                                    <span className="inline-flex items-center gap-1">
                                        <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                                        <span className="font-medium">{providerRating.toFixed(1)}</span>
                                        <span className="text-slate-400">({providerReviews})</span>
                                    </span>
                                ) : null}

                                {city ? (
                                    <span className="inline-flex items-center gap-1">
                                        <MapPin className="h-3.5 w-3.5" />
                                        <span className="truncate max-w-[14rem]">{city}</span>
                                    </span>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>

                {description ? (
                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">{description}</p>
                ) : null}

                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">
                            {showBasePrice ? (
                                <>
                                    {basePrice}€ <span className="text-xs font-normal text-slate-500">/h</span>
                                </>
                            ) : (
                                'Sur devis'
                            )}
                        </p>
                        <p className="text-xs text-slate-500">Mise en relation directe</p>
                    </div>

                    <button
                        type="button"
                        onClick={handleContact}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:bg-indigo-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!authorId}
                        aria-label={authorId ? `Contacter ${providerName}` : 'Contacter'}
                    >
                        <span className="hidden sm:inline">Contacter</span>
                        <span className="sm:hidden">Contact</span>
                        <MessageCircle className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </article>
    );
}

