'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, ChevronLeft, ChevronRight as ChevronRightIcon, MapPin, MessageCircle, Search, Siren, Sparkles, Video } from 'lucide-react';
import { getFeed } from '@/app/services/wall.service';
import Link from 'next/link';
import { BentoFeed } from './BentoFeed';
import { SmartSearchBar, type FloatingAvatar } from './SmartSearchBar';
import { SmartCard, type DiscoveryMode } from './SmartCard';

export interface TalentPoolItem {
    id: string;
    name: string;
    role: string;
    avatar: string | null;
    rating: number;
}

export interface ActivityItem {
    id: string;
    text: string;
    time: string;
}

interface WallFeedClientProps {
    initialData?: any[];
    initialFeed?: any[];
    talentPool?: TalentPoolItem[];
    activity?: ActivityItem[];
}

const MODE_OPTIONS = [
    {
        id: 'FIELD' as const,
        label: 'Renfort Terrain',
        icon: MapPin,
        accentClass: 'text-[#FF6B6B]',
    },
    {
        id: 'VISIO' as const,
        label: "Eduat'heure / Visio",
        icon: Video,
        accentClass: 'text-indigo-500',
    },
];

const QUICK_ACTIONS = [
    {
        href: '/dashboard/relief',
        label: 'SOS Renfort',
        description: 'Créer une mission urgente en 30 sec',
        icon: Siren,
        iconClass: 'text-[#FF6B6B]',
        bgClass: 'from-[#FF6B6B]/18 via-orange-500/12 to-white/40',
    },
    {
        href: '/bookings',
        label: 'Agenda',
        description: 'Vos réservations et prochains créneaux',
        icon: Calendar,
        iconClass: 'text-slate-800',
        bgClass: 'from-slate-900/5 via-white/40 to-white/60',
    },
    {
        href: '/messages',
        label: 'Messages',
        description: 'Reprendre une conversation',
        icon: MessageCircle,
        iconClass: 'text-indigo-500',
        bgClass: 'from-indigo-500/14 via-indigo-500/8 to-white/55',
    },
] as const;

const isMissionItem = (item: any) =>
    String(item?.type || '').toUpperCase() === 'MISSION' || Boolean(item?.urgencyLevel);

const isPostItem = (item: any) => String(item?.type || '').toUpperCase() === 'POST';

const isServiceItem = (item: any) => {
    const type = String(item?.type || '').toUpperCase();
    return type === 'SERVICE' || Boolean(item?.serviceType) || Boolean(item?.profile);
};

const isVisioServiceItem = (item: any) => {
    if (!isServiceItem(item)) return false;

    const serviceType = String(item?.serviceType || '').toUpperCase();
    return serviceType === 'COACHING_VIDEO';
};

const filterItemsForMode = (items: any[], mode: DiscoveryMode) => {
    if (!Array.isArray(items)) return [];
    if (mode === 'FIELD') {
        return items.filter((item) => {
            if (isMissionItem(item)) return true;
            if (isPostItem(item)) return true;
            if (isServiceItem(item) && !isVisioServiceItem(item)) return true;
            return false;
        });
    }

    return items.filter((item) => isPostItem(item) || isVisioServiceItem(item));
};

const extractHeroAvatars = (items: any[]): FloatingAvatar[] => {
    const result: FloatingAvatar[] = [];
    const seen = new Set<string>();

    for (const item of items) {
        const profile = item?.profile;
        const id = String(profile?.userId || item?.authorId || item?.id || '');
        if (!id || seen.has(id)) continue;

        const name = profile
            ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || item?.authorName || null
            : item?.authorName || null;

        const avatarUrl = profile?.avatarUrl || item?.authorAvatar || null;

        if (!name && !avatarUrl) continue;

        seen.add(id);
        result.push({ id, name, avatarUrl });
        if (result.length >= 6) break;
    }

    return result;
};

export function WallFeedClient({
    initialData,
    initialFeed,
}: WallFeedClientProps) {
    const resolvedInitialData = Array.isArray(initialData)
        ? initialData
        : Array.isArray(initialFeed)
            ? initialFeed
            : [];

    const [mode, setMode] = useState<DiscoveryMode>('FIELD');
    const [searchTerm, setSearchTerm] = useState('');
    const [allItems, setAllItems] = useState<any[]>(resolvedInitialData);
    const [isLoading, setIsLoading] = useState(false);
    const didInitFetchRef = useRef(false);

    const heroAvatars = useMemo(() => extractHeroAvatars(resolvedInitialData), [resolvedInitialData]);
    const visibleItems = useMemo(() => {
        const filtered = filterItemsForMode(allItems, mode);
        return filtered.length > 0 ? filtered : allItems;
    }, [allItems, mode]);

    const offers = useMemo(
        () =>
            visibleItems.filter(
                (item) =>
                    isServiceItem(item) ||
                    (isPostItem(item) && String(item?.postType || item?.type).toUpperCase() === 'OFFER'),
            ),
        [visibleItems],
    );

    const needs = useMemo(
        () =>
            visibleItems.filter(
                (item) =>
                    isMissionItem(item) ||
                    (isPostItem(item) && String(item?.postType || item?.type).toUpperCase() === 'NEED'),
            ),
        [visibleItems],
    );

    useEffect(() => {
        if (searchTerm.trim()) return;
        setAllItems(resolvedInitialData);
    }, [mode, resolvedInitialData, searchTerm]);

    const fetchFeed = useCallback(async () => {
        setIsLoading(true);
        try {
            const params: Record<string, any> = {};
            const normalizedSearch = searchTerm.trim();

            if (normalizedSearch) params.search = normalizedSearch;

            const response = await getFeed(params);
            const data = response as any;
            const rawItems =
                (Array.isArray(data?.items) && data.items) ||
                (Array.isArray(data?.data?.items) && data.data.items) ||
                (Array.isArray(data?.feed?.items) && data.feed.items) ||
                (Array.isArray(data?.feed) && data.feed) ||
                (Array.isArray(data) && data) ||
                [];

            setAllItems(Array.isArray(rawItems) ? rawItems : []);
        } catch (error) {
            console.error('Erreur lors du chargement du wall', error);
        } finally {
            setIsLoading(false);
        }
    }, [searchTerm]);

    useEffect(() => {
        const hasInitialData = resolvedInitialData.length > 0;
        const hasQuery = Boolean(searchTerm.trim());

        if (!didInitFetchRef.current) {
            didInitFetchRef.current = true;

            if (hasInitialData && !hasQuery) {
                return;
            }
        }

        const timeout = setTimeout(() => {
            fetchFeed();
        }, 320);

        return () => clearTimeout(timeout);
    }, [fetchFeed, resolvedInitialData.length, searchTerm]);

    const emptyState = !isLoading && visibleItems.length === 0;
    const modeCopy =
        mode === 'FIELD'
            ? 'Renfort terrain en établissement | Missions urgentes'
            : "Visio 1:1 | Eduat'heure et accompagnement";

    return (
        <div className="relative min-h-screen bg-canvas overflow-hidden">
            {/* Aurora background */}
            <div aria-hidden className="absolute inset-0 -z-10">
                <div className="absolute -top-48 left-1/2 h-[520px] w-[760px] -translate-x-1/2 rounded-full bg-gradient-to-r from-[#FF6B6B]/18 via-indigo-500/12 to-emerald-400/10 blur-3xl" />
                <div className="absolute top-[22%] -left-40 h-[460px] w-[460px] rounded-full bg-[#FF6B6B]/12 blur-3xl" />
                <div className="absolute bottom-[-220px] right-[-140px] h-[560px] w-[560px] rounded-full bg-indigo-500/14 blur-3xl" />
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-safe pb-safe">
                {/* Segmented control */}
                <div className="sticky top-5 lg:top-24 z-30 flex justify-center">
                    <div className="relative inline-flex rounded-2xl bg-white/70 backdrop-blur-md border border-white/60 p-1 shadow-soft">
                        {MODE_OPTIONS.map((option) => {
                            const Icon = option.icon;
                            const isActive = mode === option.id;
                            return (
                                <motion.button
                                    key={option.id}
                                    type="button"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setMode(option.id)}
                                    className={`relative flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-semibold tracking-tight transition-colors ${
                                        isActive ? 'text-slate-900' : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    {isActive ? (
                                        <motion.span
                                            layoutId="discovery-mode"
                                            className="absolute inset-0 rounded-xl bg-white/85 shadow-soft"
                                            transition={{ type: 'spring' as const, stiffness: 280, damping: 24 }}
                                        />
                                    ) : null}
                                    <span className="relative z-10 inline-flex items-center gap-2">
                                        <Icon className={`h-4 w-4 ${isActive ? option.accentClass : 'text-slate-400'}`} />
                                        {option.label}
                                    </span>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                {/* Hero */}
                <section className="pt-10 sm:pt-14 pb-10 sm:pb-14 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, ease: 'easeOut' }}
                        className="mx-auto max-w-3xl"
                    >
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 rounded-full bg-coral-50 border border-coral-200 px-5 py-2.5 text-sm font-bold text-coral-600 shadow-soft mb-8">
                            <Sparkles className="h-4 w-4 text-coral-500" />
                            LES EXTRAS • Le hub du social
                        </div>

                        <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight text-slate-900">
                            Un renfort demain.
                            <span className="block text-gradient">Une visio maintenant.</span>
                        </h1>

                        <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed">{modeCopy}</p>
                    </motion.div>

                    <div className="mx-auto mt-10 w-full max-w-3xl">
                        <SmartSearchBar value={searchTerm} onChange={setSearchTerm} avatars={heroAvatars} />
                    </div>

                    <div className="mx-auto mt-8 w-full max-w-5xl">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                            {QUICK_ACTIONS.map((action) => {
                                const Icon = action.icon;
                                return (
                                    <motion.div
                                        key={action.href}
                                        whileHover={{ y: -2, scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        transition={{ type: 'spring' as const, stiffness: 220, damping: 18 }}
                                    >
                                        <Link
                                            href={action.href}
                                            className="group block rounded-3xl bg-white/70 backdrop-blur-md border border-white/60 shadow-soft hover:shadow-soft-lg transition-shadow p-5"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <div className={`h-11 w-11 rounded-2xl bg-gradient-to-br ${action.bgClass} flex items-center justify-center`}>
                                                        <Icon className={`h-5 w-5 ${action.iconClass}`} />
                                                    </div>
                                                    <p className="mt-4 text-sm font-semibold text-slate-900 tracking-tight">
                                                        {action.label}
                                                    </p>
                                                    <p className="mt-1 text-sm text-slate-600 leading-snug">
                                                        {action.description}
                                                    </p>
                                                </div>

                                                <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-slate-600 transition-colors" />
                                            </div>
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Feed */}
                <section className="pb-16">
                    <div className="flex items-end justify-between gap-4 mb-6">
                        <div>
                            <p className="label-sm">Découverte</p>
                            <h2 className="mt-2 text-xl font-semibold text-slate-900 tracking-tight">
                                {mode === 'FIELD'
                                    ? 'Renfort terrain - Offres & demandes'
                                    : "Eduat'heure / Visio - Offres & demandes"}
                            </h2>
                        </div>
                        {isLoading ? <span className="text-sm text-slate-500">Mise à jour…</span> : null}
                    </div>

                    {/* Offres - Slider pleine largeur */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Offres</p>
                                <p className="text-lg font-semibold text-slate-900">Dernières offres</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-indigo-500">{offers.length} offres</span>
                                <div className="flex gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const container = document.getElementById('offers-slider');
                                            if (container) container.scrollBy({ left: -320, behavior: 'smooth' });
                                        }}
                                        className="p-2 rounded-xl bg-white/80 border border-slate-200 hover:bg-slate-100 transition-colors shadow-sm"
                                        aria-label="Précédent"
                                    >
                                        <ChevronLeft className="w-5 h-5 text-slate-600" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const container = document.getElementById('offers-slider');
                                            if (container) container.scrollBy({ left: 320, behavior: 'smooth' });
                                        }}
                                        className="p-2 rounded-xl bg-white/80 border border-slate-200 hover:bg-slate-100 transition-colors shadow-sm"
                                        aria-label="Suivant"
                                    >
                                        <ChevronRightIcon className="w-5 h-5 text-slate-600" />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div
                            id="offers-slider"
                            className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x scroll-smooth"
                        >
                            {offers.slice(0, 12).map((item, idx) => (
                                <motion.div 
                                    key={`${item?.id ?? idx}-offer`} 
                                    className="flex-shrink-0 w-[300px] snap-start"
                                    whileHover={{ y: -4, scale: 1.01 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                >
                                    <SmartCard item={item} mode={mode} />
                                </motion.div>
                            ))}
                            {offers.length === 0 && (
                                <div className="w-full text-sm text-slate-500 py-12 text-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                                    Aucune offre pour le moment.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Besoins - Slider pleine largeur */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Besoins</p>
                                <p className="text-lg font-semibold text-slate-900">Demandes urgentes</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-coral-500">{needs.length} demandes</span>
                                <div className="flex gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const container = document.getElementById('needs-slider');
                                            if (container) container.scrollBy({ left: -320, behavior: 'smooth' });
                                        }}
                                        className="p-2 rounded-xl bg-white/80 border border-slate-200 hover:bg-slate-100 transition-colors shadow-sm"
                                        aria-label="Précédent"
                                    >
                                        <ChevronLeft className="w-5 h-5 text-slate-600" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const container = document.getElementById('needs-slider');
                                            if (container) container.scrollBy({ left: 320, behavior: 'smooth' });
                                        }}
                                        className="p-2 rounded-xl bg-white/80 border border-slate-200 hover:bg-slate-100 transition-colors shadow-sm"
                                        aria-label="Suivant"
                                    >
                                        <ChevronRightIcon className="w-5 h-5 text-slate-600" />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div
                            id="needs-slider"
                            className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x scroll-smooth"
                        >
                            {needs.slice(0, 12).map((item, idx) => (
                                <motion.div 
                                    key={`${item?.id ?? idx}-need`} 
                                    className="flex-shrink-0 w-[300px] snap-start"
                                    whileHover={{ y: -4, scale: 1.01 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                >
                                    <SmartCard item={item} mode={mode} />
                                </motion.div>
                            ))}
                            {needs.length === 0 && (
                                <div className="w-full text-sm text-slate-500 py-12 text-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                                    Aucune demande pour le moment.
                                </div>
                            )}
                        </div>
                    </div>

                    <BentoFeed items={visibleItems} mode={mode} isLoading={isLoading} />

                    {emptyState ? (
                        <div className="col-span-full text-center py-20">
                            <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                <Search className="h-7 w-7 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">Aucun résultat trouvé</h3>
                            <p className="text-gray-500">Essayez de modifier vos filtres ou votre recherche.</p>
                        </div>
                    ) : null}
                </section>
            </div>
        </div>
    );
}
