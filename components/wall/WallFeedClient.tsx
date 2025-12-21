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
        <div className="pill-toggle">
            {/* Sliding Indicator */}
            <motion.div
                className="pill-toggle-indicator"
                initial={false}
                animate={{
                    left: mode === 'services' ? '4px' : mode === 'renfort' ? '50%' : '-100%',
                    width: mode === 'all' ? '0%' : '48%',
                    backgroundColor: mode === 'services' ? '#F0FDFA' : mode === 'renfort' ? '#FFF1F2' : 'transparent',
                    borderColor: mode === 'services' ? '#99F6E4' : mode === 'renfort' ? '#FECDD3' : 'transparent',
                    borderWidth: mode === 'all' ? 0 : 1,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />

            <button
                type="button"
                onClick={() => toggle('services')}
                className={`pill-toggle-item ${mode === 'services' ? 'text-teal-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <Video className="w-4 h-4" />
                <span>SocioLive & Ateliers</span>
            </button>

            <button
                type="button"
                onClick={() => toggle('renfort')}
                className={`pill-toggle-item ${mode === 'renfort' ? 'text-rose-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <MapPin className="w-4 h-4" />
                <span>Renfort Terrain</span>
            </button>
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
            {/* ========== HERO PLEIN LARGEUR - 2026 Premium Design ========== */}
            <section className="relative w-full min-h-[90vh] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
                {/* AMBIENT BACKGROUND - Elegant Mesh Gradient */}
                <div aria-hidden className="hero-mesh-gradient" />

                {/* FLOATING ORBS - Ultra subtle ambient glow */}
                <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="floating-orb floating-orb-1" style={{ top: '-15%', left: '10%' }} />
                    <div className="floating-orb floating-orb-2" style={{ top: '50%', right: '-10%' }} />
                    <div className="floating-orb floating-orb-3" style={{ bottom: '-10%', left: '30%' }} />
                </div>

                <div className="relative max-w-5xl mx-auto text-center z-10">
                    {/* Titre H1 Major - Statement Typography */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                        className="mb-8"
                    >
                        <h1 className="hero-title">
                            <span className="text-reveal" style={{ animationDelay: '0.1s' }}>LA PLATEFORME</span>
                            <br />
                            <span className="hero-title-gradient text-reveal" style={{ animationDelay: '0.3s' }}>
                                DU MÉDICO-SOCIAL
                            </span>
                        </h1>
                    </motion.div>

                    {/* Punchline Secondary - Clean & Elegant */}
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-xl sm:text-2xl lg:text-3xl font-semibold text-slate-600/90 max-w-3xl mx-auto leading-relaxed"
                    >
                        Un renfort demain.{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-live-500 to-brand-500">
                            Une Visio ou un Atelier maintenant.
                        </span>
                    </motion.h2>

                    {/* Mission Text - Subtle */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        className="mt-6 text-base sm:text-lg font-medium text-slate-400 max-w-xl mx-auto"
                    >
                        La plateforme des pro de l'éducation spécialisée et du médico-social.
                    </motion.p>

                    {/* Mode Switcher - Premium Pill Design */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="mt-12"
                    >
                        <FeedModeToggle mode={feedMode} onChange={setFeedMode} />
                    </motion.div>

                    {/* Smart Search Bar - Glowing Effect */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.7 }}
                        className="relative mt-10 max-w-2xl mx-auto hero-search-glow"
                    >
                        <div className="relative glass rounded-full border border-white/60 shadow-soft-lg overflow-hidden">
                            <div className="relative">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Rechercher un renfort, une séance SocioLive ou un atelier..."
                                    className="w-full bg-transparent pl-14 pr-6 py-4 text-base font-medium tracking-tight text-slate-900 placeholder:text-slate-400/80 outline-none"
                                    autoComplete="off"
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* Publish CTA */}
                    {canPublish && user && (
                        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.8 }} className="mt-8">
                            <CreateActionModal
                                user={user as unknown as CreateActionModalUser}
                                trigger={
                                    <button type="button" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-600 via-brand-500 to-live-500 px-8 py-4 text-base font-semibold text-white shadow-soft-lg hover:shadow-xl active:scale-[0.98] transition-all duration-300">
                                        <Plus className="h-5 w-5" />
                                        Publier une offre
                                    </button>
                                }
                            />
                        </motion.div>
                    )}
                </div>

                {/* Scroll indicator - Gentle floating */}
                <motion.button
                    onClick={scrollToFeed}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors discover-btn"
                >
                    <span className="text-sm font-medium tracking-wide">Découvrir</span>
                    <ChevronDown className="w-5 h-5" />
                </motion.button>

                {/* Subtle wave transition */}
                <div className="wave-pattern" />
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
                                            {feedMode === 'renfort' ? '📍 Missions terrain' : feedMode === 'services' ? '✨ Experts & Ateliers' : '🌍 La plateforme'}
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
