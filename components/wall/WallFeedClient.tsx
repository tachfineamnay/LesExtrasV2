'use client';

import type { ReactNode } from 'react';
import { useMemo, useRef } from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ChevronLeft, ChevronRight, Flame, Loader2, Plus, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { CreateActionModal, type CreateActionModalUser } from '@/components/create/CreateActionModal';
import type { SocialPostCardItem } from '@/components/feed/SocialPostCard';
import { FeedSidebar } from './FeedSidebar';
import { MissionCard } from './MissionCard';
import { ServiceCard } from './ServiceCard';
import { SmartSearchBar, type FloatingAvatar } from './SmartSearchBar';
import { useWallFeed } from './useWallFeed';

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
    initialNextCursor?: string | null;
    initialHasNextPage?: boolean;
    talentPool?: TalentPoolItem[];
    activity?: ActivityItem[];
}

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

const toSocialPostCardItem = (item: any): SocialPostCardItem | null => {
    const id = String(item?.id || '');
    const content = String(item?.content || '').trim();
    if (!id || !content) return null;

    return {
        id,
        type: 'POST',
        postType: typeof item?.postType === 'string' ? item.postType : undefined,
        title: typeof item?.title === 'string' ? item.title : undefined,
        content,
        category: typeof item?.category === 'string' ? item.category : null,
        mediaUrls: Array.isArray(item?.mediaUrls)
            ? item.mediaUrls.filter((url: unknown): url is string => typeof url === 'string' && url.trim().length > 0)
            : [],
        createdAt: item?.createdAt,
        authorName: typeof item?.authorName === 'string' ? item.authorName : undefined,
        authorAvatar: typeof item?.authorAvatar === 'string' ? item.authorAvatar : null,
        isOptimistic: Boolean(item?.isOptimistic),
    };
};

const isType = (item: any, type: string) => String(item?.type || '').toUpperCase() === type;

const isUrgentMission = (mission: any) => {
    const urgency = String(mission?.urgencyLevel || '').toUpperCase();
    return urgency === 'HIGH' || urgency === 'CRITICAL';
};

function SectionEmptyState({
    icon: Icon,
    title,
    description,
}: {
    icon: LucideIcon;
    title: string;
    description: string;
}) {
    return (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-white shadow-sm">
                <Icon className="h-6 w-6 text-slate-300" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
    );
}

export function WallFeedClient({
    initialData,
    initialFeed,
    initialNextCursor = null,
    initialHasNextPage = false,
}: WallFeedClientProps) {
    const resolvedInitialData = Array.isArray(initialData)
        ? initialData
        : Array.isArray(initialFeed)
            ? initialFeed
            : [];

    const { user } = useAuth();
    const canPublish = Boolean(user && (user.role === 'CLIENT' || user.role === 'EXTRA'));

    const { feed, isLoading, isLoadingMore, hasMore, loadMore, searchTerm, setSearchTerm } = useWallFeed({
        initialItems: resolvedInitialData,
        initialNextCursor,
        initialHasNextPage,
    });

    const heroAvatars = useMemo(() => extractHeroAvatars(feed), [feed]);

    const missions = useMemo(() => feed.filter((item) => isType(item, 'MISSION')), [feed]);
    const services = useMemo(() => feed.filter((item) => isType(item, 'SERVICE')), [feed]);
    const posts = useMemo(
        () =>
            feed
                .filter((item) => isType(item, 'POST'))
                .map(toSocialPostCardItem)
                .filter(Boolean) as SocialPostCardItem[],
        [feed],
    );

    const urgentMissions = useMemo(() => missions.filter(isUrgentMission).slice(0, 12), [missions]);

    const topCategories = useMemo(() => {
        const counts = new Map<string, number>();
        for (const item of services) {
            const label = String(item?.category || '').trim();
            if (!label) continue;
            counts.set(label, (counts.get(label) || 0) + 1);
        }

        return Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([label, count]) => ({ label, count }));
    }, [services]);

    const urgentRailRef = useRef<HTMLDivElement>(null);

    const scrollUrgentRail = (direction: 'prev' | 'next') => {
        const node = urgentRailRef.current;
        if (!node) return;
        const delta = direction === 'prev' ? -360 : 360;
        node.scrollBy({ left: delta, behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <section className="lg:col-span-9 space-y-8">
                        <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm p-6 md:p-8">
                            <div className="max-w-3xl mx-auto text-center space-y-5">
                                <p className="text-[11px] font-semibold tracking-[0.28em] uppercase text-slate-500">
                                    SOCIOPULSE COCKPIT
                                </p>
                                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
                                    Trouvez un expert, un atelier ou un renfort.
                                </h1>
                                <p className="text-sm md:text-base text-slate-600">
                                    Une interface wide &amp; clean pour piloter vos besoins et vos opportunités en un coup d&apos;oeil.
                                </p>

                                <div className="pt-2">
                                    <SmartSearchBar value={searchTerm} onChange={setSearchTerm} avatars={heroAvatars} />
                                </div>

                                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
                                    {canPublish && user ? (
                                        <CreateActionModal
                                            user={user as unknown as CreateActionModalUser}
                                            trigger={
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                    Publier
                                                </button>
                                            }
                                        />
                                    ) : (
                                        <>
                                            <Link href="/onboarding" className="btn-secondary">
                                                S&apos;inscrire
                                            </Link>
                                            <Link href="/auth/login" className="btn-primary">
                                                Se connecter
                                            </Link>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {urgentMissions.length > 0 ? (
                            <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm p-6">
                                <div className="flex items-center justify-between gap-4 mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-2xl bg-rose-50 border border-rose-100 grid place-items-center">
                                            <Flame className="h-5 w-5 text-rose-500" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                                                Urgences à pourvoir
                                            </p>
                                            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                                                Missions de renfort
                                            </h2>
                                        </div>
                                    </div>

                                    <div className="hidden md:flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => scrollUrgentRail('prev')}
                                            className="h-10 w-10 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm grid place-items-center"
                                            aria-label="Précédent"
                                        >
                                            <ChevronLeft className="h-5 w-5 text-slate-700" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => scrollUrgentRail('next')}
                                            className="h-10 w-10 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm grid place-items-center"
                                            aria-label="Suivant"
                                        >
                                            <ChevronRight className="h-5 w-5 text-slate-700" />
                                        </button>
                                    </div>
                                </div>

                                <div
                                    ref={urgentRailRef}
                                    className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x scroll-smooth"
                                >
                                    {urgentMissions.map((mission, index) => (
                                        <div
                                            key={String(mission?.id ?? index)}
                                            className="flex-shrink-0 w-[300px] sm:w-[340px] snap-start"
                                        >
                                            <MissionCard data={mission} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm p-6">
                            <div className="flex items-center justify-between gap-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-2xl bg-teal-50 border border-teal-100 grid place-items-center">
                                        <Sparkles className="h-5 w-5 text-teal-600" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                                            Experts &amp; ateliers
                                        </p>
                                        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                                            Catalogue
                                        </h2>
                                    </div>
                                </div>

                                {services.length > 0 ? (
                                    <span className="text-sm text-slate-500">{services.length} services</span>
                                ) : null}
                            </div>

                            {isLoading && services.length === 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
                                    {Array.from({ length: 6 }).map((_, index) => (
                                        <div
                                            key={index}
                                            className="h-[22rem] rounded-2xl border border-slate-200/60 bg-slate-50 animate-pulse"
                                        />
                                    ))}
                                </div>
                            ) : services.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
                                    {services.map((service, index) => (
                                        <div key={String(service?.id ?? index)} className="h-full">
                                            <ServiceCard data={service} currentUserId={user?.id ?? undefined} />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <SectionEmptyState
                                    icon={Sparkles}
                                    title="Aucun expert disponible"
                                    description="Affinez votre recherche ou revenez un peu plus tard."
                                />
                            )}

                            {hasMore ? (
                                <div className="flex justify-center pt-6">
                                    <button
                                        type="button"
                                        onClick={loadMore}
                                        className="btn-secondary"
                                        disabled={isLoadingMore}
                                    >
                                        {isLoadingMore ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Chargement…
                                            </>
                                        ) : (
                                            'Charger plus'
                                        )}
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    </section>

                    <FeedSidebar
                        isLoading={isLoading}
                        posts={posts}
                        topCategories={topCategories}
                        stats={{ missions: missions.length, services: services.length }}
                        canPublish={canPublish}
                        user={user ? (user as unknown as CreateActionModalUser) : null}
                    />
                </div>
            </div>
        </div>
    );
}

