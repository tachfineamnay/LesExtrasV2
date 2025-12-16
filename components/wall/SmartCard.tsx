'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowUpRight, Clock, MapPin, Video } from 'lucide-react';
import { ImmersiveCard } from './ImmersiveCard';

export type DiscoveryMode = 'FIELD' | 'VISIO';

export interface SmartCardProps {
    item: any;
    mode: DiscoveryMode;
}

const toDate = (value: unknown): Date | null => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(String(value));
    return Number.isNaN(date.getTime()) ? null : date;
};

const formatDuration = (diffMs: number) => {
    const totalMinutes = Math.max(1, Math.round(diffMs / 60000));
    if (totalMinutes < 60) return `${totalMinutes} min`;
    const hours = Math.round(totalMinutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.round(hours / 24);
    return `${days}j`;
};

const asStringArray = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    return value.filter((tag: unknown): tag is string => typeof tag === 'string' && tag.trim().length > 0);
};

const isMission = (item: any) => String(item?.type || '').toUpperCase() === 'MISSION' || Boolean(item?.urgencyLevel);
const isService = (item: any) =>
    String(item?.type || '').toUpperCase() === 'SERVICE' ||
    Boolean(item?.serviceType) ||
    Boolean(item?.basePrice) ||
    Boolean(item?.profile);

export function SmartCard({ item, mode }: SmartCardProps) {
    const rawType = String(item?.type || '').toUpperCase();

    if (isService(item) && rawType !== 'MISSION') {
        const profile = item?.profile;
        const providerName = profile
            ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || item?.authorName || 'Prestataire'
            : item?.authorName || 'Prestataire';
        const pricePerHour = item?.basePrice ?? profile?.hourlyRate ?? null;
        const priceLabel = typeof pricePerHour === 'number' && !Number.isNaN(pricePerHour) ? `${pricePerHour} €/h` : undefined;
        const serviceTitle = item?.title || item?.name || item?.category || 'Service';
        const imageUrl = item?.imageUrl || (Array.isArray(item?.galleryUrls) ? item.galleryUrls[0] : null);
        const avatarUrl = profile?.avatarUrl || item?.authorAvatar || null;
        const href = item?.id ? `/offer/${item.id}` : undefined;
        const showVisioBadge = mode === 'VISIO';

        return (
            <ImmersiveCard
                href={href}
                title={providerName}
                subtitle={serviceTitle}
                priceLabel={priceLabel}
                imageUrl={imageUrl}
                avatarUrl={avatarUrl}
                badge={
                    showVisioBadge ? (
                        <motion.span
                            className="inline-flex items-center gap-2 rounded-full bg-white/12 border border-white/20 px-3 py-1.5 text-xs font-semibold text-white"
                            animate={{ opacity: [0.75, 1, 0.75], scale: [1, 1.03, 1] }}
                            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            <Video className="h-4 w-4 text-indigo-200" />
                            Dispo Visio
                        </motion.span>
                    ) : null
                }
            />
        );
    }

    if (isMission(item)) {
        const missionId = item?.id as string | undefined;
        const href = missionId ? `/need/${missionId}` : undefined;
        const urgencyLevel = String(item?.urgencyLevel || 'MEDIUM').toUpperCase();
        const isUrgent = urgencyLevel === 'HIGH' || urgencyLevel === 'CRITICAL';
        const jobTitle = String(item?.category || item?.jobTitle || item?.title || 'Mission');
        const missionTitle = String(item?.title || 'Mission');
        const city = String(item?.city || item?.client?.establishment?.city || '');
        const hourlyRate = typeof item?.hourlyRate === 'number' ? item.hourlyRate : null;
        const startOrExpiry = toDate(item?.validUntil || item?.startDate || item?.createdAt);
        const diffMs = startOrExpiry ? startOrExpiry.getTime() - Date.now() : null;
        const timerLabel = diffMs !== null ? `Expire dans ${formatDuration(diffMs)}` : 'Disponible';

        const tags = asStringArray(item?.tags || item?.requiredSkills);
        const cardBody = (
            <motion.article
                whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                transition={{ type: 'spring' as const, stiffness: 220, damping: 18 }}
                className={`group relative h-full overflow-hidden rounded-3xl p-6 shadow-soft border border-white/60 backdrop-blur-md ${
                    isUrgent ? 'bg-[#FF6B6B]/10' : 'bg-white/70'
                }`}
            >
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[#FF6B6B]/15 blur-3xl" />
                    <div className="absolute bottom-[-120px] left-[-140px] h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
                </div>

                <div className="relative flex items-center justify-between gap-3">
                    <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                            isUrgent ? 'bg-white/60 text-[#FF6B6B]' : 'bg-slate-900/5 text-slate-700'
                        }`}
                    >
                        <Clock className="h-4 w-4" />
                        {timerLabel}
                    </span>

                    {hourlyRate !== null ? (
                        <span className="rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold text-slate-900">
                            {hourlyRate} €/h
                        </span>
                    ) : null}
                </div>

                <div className="relative mt-6 space-y-3">
                    <h3 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 uppercase">
                        {jobTitle}
                    </h3>
                    <p className="text-sm text-slate-600 line-clamp-2">{missionTitle}</p>
                </div>

                <div className="relative mt-6 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    {city ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/60 px-3 py-1">
                            <MapPin className="h-4 w-4 text-[#FF6B6B]" />
                            {city}
                        </span>
                    ) : null}

                    {tags.slice(0, 3).map((tag) => (
                        <span
                            key={tag}
                            className="rounded-full bg-slate-900/5 px-3 py-1 text-xs font-medium text-slate-700"
                        >
                            {tag}
                        </span>
                    ))}
                </div>

                <div className="relative mt-auto pt-6 flex items-center justify-end">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 group-hover:text-[#FF6B6B] transition-colors">
                        Voir
                        <ArrowUpRight className="h-4 w-4" />
                    </span>
                </div>
            </motion.article>
        );

        return href ? (
            <Link href={href} className="block h-full">
                {cardBody}
            </Link>
        ) : (
            cardBody
        );
    }

    const title = String(item?.title || item?.name || 'Publication');
    const content = String(item?.content || '');
    const tags = asStringArray(item?.tags);

    return (
        <motion.article
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: 'spring' as const, stiffness: 220, damping: 18 }}
            className="group relative h-full rounded-3xl p-6 bg-white/70 backdrop-blur-md border border-white/60 shadow-soft"
        >
            <h3 className="text-xl font-semibold text-slate-900 tracking-tight line-clamp-2">
                {title}
            </h3>
            {content ? (
                <p className="mt-3 text-sm text-slate-600 line-clamp-3">{content}</p>
            ) : null}
            {tags.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-2">
                    {tags.slice(0, 4).map((tag) => (
                        <span
                            key={tag}
                            className="rounded-full bg-slate-900/5 px-3 py-1 text-xs font-medium text-slate-700"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            ) : null}
        </motion.article>
    );
}

