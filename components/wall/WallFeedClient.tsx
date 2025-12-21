'use client';

import type { ReactNode } from 'react';
import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
    ChevronLeft, ChevronRight, ChevronDown, Flame, Loader2, MapPin,
    Sparkles, Video, Palette, Search, Plus
} from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { CreateActionModal, type CreateActionModalUser } from '@/components/create/CreateActionModal';
import { MissionCard } from './MissionCard';
import { ServiceCard } from './ServiceCard';
import { FeedSidebar, type SidebarData } from './FeedSidebar';
import { useWallFeed } from './useWallFeed';

// ===========================================
// WALL FEED CLIENT - Sociopulse "Wall Experience"
// HERO PLEIN ÉCRAN + Awwwards Level Design
// ===========================================

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
    sidebarData?: SidebarData;
}

type FeedMode = 'all' | 'renfort' | 'services';

const isType = (item: any, type: string) => String(item?.type || '').toUpperCase() === type;

const isUrgentMission = (mission: any) => {
    const urgency = String(mission?.urgencyLevel || '').toUpperCase();
    return urgency === 'HIGH' || urgency === 'CRITICAL';
};

const getMasonrySpan = (index: number, itemCount: number) => {
    if (index === 0) return 'sm:col-span-2 lg:row-span-2';
    if (index % 7 === 3) return 'sm:col-span-2';
    if (index % 11 === 5 && itemCount > 8) return 'lg:col-span-2';
    return '';
};

function SectionEmptyState({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description: string; action?: ReactNode }) {
    return (
        <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white/60 backdrop-blur-md p-12 text-center">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-white shadow-soft">
                <Icon className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <p className="mt-2 text-sm text-slate-600 max-w-sm mx-auto">{description}</p>
            {action && <div className="mt-6 flex justify-center">{action}</div>}
        </div>
    );
}

function FeedModeToggle({ mode, onChange }: { mode: FeedMode; onChange: (mode: FeedMode) => void }) {
    const toggle = (target: 'services' | 'renfort') => {
        if (mode === target) {
            onChange('all');
        } else {
            onChange(target);
        }
    };

    return (
        <div className="inline-flex items-center p-1.5 rounded-2xl bg-white/90 backdrop-blur-md border border-white/60 shadow-xl">
            <motion.button
                type="button"
                onClick={() => toggle('services')}
                className={`relative inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-colors ${mode === 'services' ? 'text-teal-700' : 'text-slate-600 hover:text-slate-900'}`}
            >
                {mode === 'services' && <motion.div layoutId="modeToggleBg" className="absolute inset-0 bg-teal-50 border border-teal-200 rounded-xl" transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }} />}
                <span className="relative flex items-center gap-2"><Video className="w-4 h-4" />SocioLive & Ateliers</span>
            </motion.button>

            <motion.button
                type="button"
                onClick={() => toggle('renfort')}
                className={`relative inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-colors ${mode === 'renfort' ? 'text-rose-700' : 'text-slate-600 hover:text-slate-900'}`}
            >
                {mode === 'renfort' && <motion.div layoutId="modeToggleBg" className="absolute inset-0 bg-rose-50 border border-rose-200 rounded-xl" transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }} />}
                <span className="relative flex items-center gap-2"><MapPin className="w-4 h-4" />Renfort Terrain</span>
            </motion.button>
        </div>
    );
}

export function WallFeedClient({
    initialData,
    initialFeed,
    initialNextCursor = null,
    initialHasNextPage = false,
    talentPool = [],
    sidebarData,
}: WallFeedClientProps) {
    const resolvedInitialData = Array.isArray(initialData) ? initialData : Array.isArray(initialFeed) ? initialFeed : [];

    const { user } = useAuth();
    const canPublish = Boolean(user && (user.role === 'CLIENT' || user.role === 'EXTRA'));

    const { feed, isLoading, isLoadingMore, hasMore, loadMore, searchTerm, setSearchTerm } = useWallFeed({
        initialItems: resolvedInitialData,
        initialNextCursor,
        initialHasNextPage,
    });

    const [feedMode, setFeedMode] = useState<FeedMode>('all');

    const missions = useMemo(() => feed.filter((item) => isType(item, 'MISSION')), [feed]);
    const services = useMemo(() => feed.filter((item) => isType(item, 'SERVICE')), [feed]);
    const urgentMissions = useMemo(() => missions.filter(isUrgentMission).slice(0, 12), [missions]);

    // Logic: 'all' shows everything (default), otherwise filter by type
    const displayedItems = useMemo(() => {
        if (feedMode === 'renfort') return missions;
        if (feedMode === 'services') return services;
        return feed;
    }, [feedMode, missions, services, feed]);

    const urgentRailRef = useRef<HTMLDivElement>(null);
    const feedSectionRef = useRef<HTMLDivElement>(null);

    const scrollUrgentRail = (direction: 'prev' | 'next') => {
        const node = urgentRailRef.current;
        if (!node) return;
        node.scrollBy({ left: direction === 'prev' ? -360 : 360, behavior: 'smooth' });
    };

    const scrollToFeed = () => {
        feedSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="relative min-h-screen bg-canvas overflow-hidden">
            {/* ========== HERO PLEIN LARGEUR ========== */}
            <section className="relative w-full py-16 sm:py-20 lg:py-24 flex flex-col items-center px-4 sm:px-6 lg:px-8">
                {/* AMBIENT BACKGROUND */}
                <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute -top-1/4 left-1/2 h-[800px] w-[1200px] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500/20 via-teal-400/15 to-rose-400/15 blur-3xl" />
                    <div className="absolute top-1/3 -left-1/4 h-[600px] w-[600px] rounded-full bg-teal-400/15 blur-3xl" />
                    <div className="absolute bottom-0 right-0 h-[700px] w-[700px] rounded-full bg-indigo-500/15 blur-3xl" />
                </div>

                <div className="max-w-5xl mx-auto text-center">
                    {/* Titre H1 Major */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                        className="mb-6 relative inline-block"
                    >
                        <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-slate-900 leading-[0.9]">
                            LE RÉSEAU <br className="sm:hidden" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 relative">
                                DU SOCIAL
                            </span>
                        </h1>
                    </motion.div>

                    {/* Punchline Secondary */}
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-600 max-w-4xl mx-auto leading-tight"
                    >
                        Un renfort demain. <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-teal-500">Une Visio ou un Atelier maintenant.</span>
                    </motion.h2>

                    {/* Mission Text */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="mt-6 text-lg sm:text-xl font-medium text-slate-500 max-w-2xl mx-auto"
                    >
                        Le Réseau Social des professionnels de l'éducation spécialisée et du médico-social.
                    </motion.p>

                    {/* Mode Switcher */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="mt-10"
                    >
                        <FeedModeToggle mode={feedMode} onChange={setFeedMode} />
                    </motion.div>

                    {/* Smart Search Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="relative mt-10 max-w-2xl mx-auto"
                    >
                        <div aria-hidden className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-r from-indigo-500/25 via-teal-500/20 to-rose-500/15 blur-2xl opacity-70" />
                        <div className="relative glass rounded-[2rem] border border-white/60 shadow-xl overflow-hidden">
                            <div className="relative">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400" />
                                <input
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Rechercher un renfort, une séance SocioLive ou un atelier..."
                                    className="w-full bg-transparent pl-16 pr-6 py-5 text-lg font-medium tracking-tight text-slate-900 placeholder:text-slate-400/90 outline-none"
                                    autoComplete="off"
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* Publish CTA */}
                    {canPublish && user && (
                        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="mt-8">
                            <CreateActionModal
                                user={user as unknown as CreateActionModalUser}
                                trigger={
                                    <button type="button" className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-teal-500 px-7 py-4 text-base font-semibold text-white shadow-xl hover:shadow-2xl active:scale-[0.98] transition-all">
                                        <Plus className="h-5 w-5" />
                                        Publier une offre
                                    </button>
                                }
                            />
                        </motion.div>
                    )}
                </div>

                {/* Scroll indicator */}
                <motion.button
                    onClick={scrollToFeed}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, y: [0, 8, 0] }}
                    transition={{ opacity: { delay: 1 }, y: { duration: 1.5, repeat: Infinity } }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors"
                >
                    <span className="text-sm font-medium">Découvrir</span>
                    <ChevronDown className="w-5 h-5" />
                </motion.button>
            </section>

            {/* ========== MAIN CONTENT ========== */}
            <main ref={feedSectionRef} className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-16 pb-safe">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-9">

                        {/* URGENT MISSIONS RAIL */}
                        <AnimatePresence mode="wait">
                            {feedMode === 'renfort' && urgentMissions.length > 0 && (
                                <motion.section key="urgent-rail" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="mb-10">
                                    <div className="flex items-center justify-between gap-4 mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-11 w-11 rounded-2xl bg-rose-50 border border-rose-100 grid place-items-center">
                                                <Flame className="h-5 w-5 text-rose-500" />
                                            </div>
                                            <div>
                                                <p className="text-[11px] uppercase tracking-[0.22em] text-rose-600 font-semibold">🔥 À pourvoir en urgence</p>
                                                <h2 className="text-lg font-bold tracking-tight text-slate-900">Missions Renfort Express</h2>
                                            </div>
                                        </div>
                                        <div className="hidden md:flex items-center gap-2">
                                            <button type="button" onClick={() => scrollUrgentRail('prev')} className="h-10 w-10 rounded-2xl bg-white/80 border border-slate-200 hover:bg-slate-50 shadow-soft grid place-items-center"><ChevronLeft className="h-5 w-5 text-slate-700" /></button>
                                            <button type="button" onClick={() => scrollUrgentRail('next')} className="h-10 w-10 rounded-2xl bg-white/80 border border-slate-200 hover:bg-slate-50 shadow-soft grid place-items-center"><ChevronRight className="h-5 w-5 text-slate-700" /></button>
                                        </div>
                                    </div>
                                    <div ref={urgentRailRef} className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x scroll-smooth -mx-1 px-1">
                                        {urgentMissions.map((mission, index) => (
                                            <div key={String(mission?.id ?? index)} className="flex-shrink-0 w-[300px] sm:w-[340px] snap-start">
                                                <MissionCard data={mission} />
                                            </div>
                                        ))}
                                    </div>
                                </motion.section>
                            )}
                        </AnimatePresence>

                        {/* MAIN FEED GRID */}
                        <section>
                            <div className="flex items-center justify-between gap-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className={`h-11 w-11 rounded-2xl grid place-items-center ${feedMode === 'renfort' ? 'bg-rose-50 border border-rose-100' : feedMode === 'services' ? 'bg-teal-50 border border-teal-100' : 'bg-indigo-50 border border-indigo-100'}`}>
                                        {feedMode === 'renfort' ? <MapPin className="h-5 w-5 text-rose-500" /> : feedMode === 'services' ? <Palette className="h-5 w-5 text-teal-600" /> : <Sparkles className="h-5 w-5 text-indigo-600" />}
                                    </div>
                                    <div>
                                        <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                                            {feedMode === 'renfort' ? '📍 Missions terrain' : feedMode === 'services' ? '✨ Experts & Ateliers' : '🌍 Tout le réseau'}
                                        </p>
                                        <h2 className="text-lg font-bold tracking-tight text-slate-900">
                                            {feedMode === 'renfort' ? 'Offres de Renfort' : feedMode === 'services' ? 'Catalogue SocioLive' : 'Fil d\'actualité'}
                                        </h2>
                                    </div>
                                </div>
                                {displayedItems.length > 0 && <span className="text-sm text-slate-500 font-medium">{displayedItems.length} {feedMode === 'renfort' ? 'missions' : feedMode === 'services' ? 'services' : 'publications'}</span>}
                            </div>

                            {isLoading && displayedItems.length === 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 auto-rows-fr gap-6 [grid-auto-flow:dense]">
                                    {Array.from({ length: 9 }).map((_, index) => (
                                        <div key={index} className={`rounded-3xl bg-white/60 backdrop-blur-md border border-white/60 shadow-soft animate-pulse min-h-[320px] ${index === 0 ? 'sm:col-span-2 xl:row-span-2' : ''}`} />
                                    ))}
                                </div>
                            ) : displayedItems.length > 0 ? (
                                <AnimatePresence mode="wait">
                                    <motion.div key={feedMode} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 auto-rows-fr gap-6 [grid-auto-flow:dense]">
                                        {displayedItems.map((item, index) => (
                                            <motion.div key={String(item?.id ?? index)} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.03 }} className={`h-full ${getMasonrySpan(index, displayedItems.length)}`}>
                                                {isType(item, 'MISSION') ? <MissionCard data={item} /> : <ServiceCard data={item} currentUserId={user?.id ?? undefined} />}
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                </AnimatePresence>
                            ) : (
                                <SectionEmptyState
                                    icon={feedMode === 'renfort' ? MapPin : Sparkles}
                                    title={feedMode === 'renfort' ? 'Aucune mission disponible' : feedMode === 'services' ? 'Aucun expert disponible' : 'Aucune publication'}
                                    description="Affinez votre recherche ou revenez un peu plus tard."
                                    action={canPublish && user ? (
                                        <CreateActionModal user={user as unknown as CreateActionModalUser} trigger={
                                            <button type="button" className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-teal-500 px-5 py-3 text-sm font-semibold text-white shadow-soft">
                                                <Plus className="h-4 w-4" />{feedMode === 'renfort' ? 'Publier une mission' : 'Publier une annonce'}
                                            </button>
                                        } />
                                    ) : undefined}
                                />
                            )}

                            {hasMore && (
                                <div className="flex justify-center pt-8">
                                    <button type="button" onClick={loadMore} className="btn-secondary" disabled={isLoadingMore}>
                                        {isLoadingMore ? <><Loader2 className="h-4 w-4 animate-spin" />Chargement…</> : 'Charger plus'}
                                    </button>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* SIDEBAR */}
                    <aside className="hidden lg:block lg:col-span-3">
                        <div className="sticky top-24">
                            <FeedSidebar talentPool={talentPool} initialData={sidebarData} />
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}
