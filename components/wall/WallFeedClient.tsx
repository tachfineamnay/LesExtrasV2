'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    Search,
    Zap,
    Dumbbell,
    Video,
    Heart,
    Palette,
    Filter,
    Users,
    Activity,
    ChevronRight,
    Clock,
    Star,
    Bell
} from 'lucide-react';
import { NeedCard, OfferCard } from '@/components/wall';
import { getFeed, createPost, type CreatePostPayload } from '@/app/services/wall.service';
import { ToastContainer, useToasts } from '@/components/ui/Toast';

// Types for feed items
export interface NeedItem {
    id: string;
    authorId?: string;
    type: 'NEED';
    title: string;
    establishment: string;
    city: string;
    description: string;
    urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    hourlyRate: number;
    jobTitle: string;
    startDate: string;
    isNightShift: boolean;
    tags: string[];
}

export interface OfferItem {
    id: string;
    authorId?: string;
    type: 'OFFER';
    title: string;
    providerName: string;
    providerRating: number;
    providerReviews: number;
    city: string;
    description: string;
    serviceType: 'WORKSHOP' | 'COACHING_VIDEO';
    category: string;
    basePrice: number;
    imageUrl?: string;
    tags: string[];
}

export type FeedItem = NeedItem | OfferItem;

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

const FILTER_BADGES = [
    { id: 'urgent', label: 'Urgent', icon: Zap, color: 'text-red-500' },
    { id: 'sport', label: 'Sport', icon: Dumbbell, color: 'text-blue-500' },
    { id: 'visio', label: 'Visio', icon: Video, color: 'text-purple-500' },
    { id: 'bien-etre', label: 'Bien-etre', icon: Heart, color: 'text-pink-500' },
    { id: 'art', label: 'Art', icon: Palette, color: 'text-orange-500' },
];

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 100,
            damping: 15,
        },
    },
};

const decodeUserIdFromToken = (token?: string | null) => {
    if (!token) return null;

    try {
        const cleaned = token.replace(/^Bearer\s+/i, '').trim();
        const parts = cleaned.split('.');
        if (parts.length < 2) return null;

        const payload = JSON.parse(
            atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
        );

        return payload.sub || payload.id || null;
    } catch {
        return null;
    }
};

export function WallFeedClient({
    initialData,
    initialFeed,
    talentPool = [],
    activity = [],
}: WallFeedClientProps) {
    const resolvedInitialData = Array.isArray(initialData)
        ? initialData
        : Array.isArray(initialFeed)
            ? initialFeed
            : [];

    const [feedItems, setFeedItems] = useState<any[]>(resolvedInitialData);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const didInitFetchRef = useRef(false);
    const { toasts, addToast, removeToast } = useToasts();
    const [newPostTitle, setNewPostTitle] = useState('');
    const [newPostContent, setNewPostContent] = useState('');
    const [newPostCity, setNewPostCity] = useState('');
    const [newPostType, setNewPostType] = useState<'OFFER' | 'NEED'>('OFFER');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<string>('');

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const candidates = [
            window.localStorage.getItem('accessToken'),
            window.localStorage.getItem('token'),
            window.localStorage.getItem('jwt'),
        ];

        for (const token of candidates) {
            const userId = decodeUserIdFromToken(token);
            if (userId) {
                setCurrentUserId(userId);
                return;
            }
        }

        const cookieToken = document.cookie
            ?.split(';')
            .map((c) => c.trim())
            .find((c) => c.startsWith('token=') || c.startsWith('accessToken='));

        if (cookieToken) {
            const [, value] = cookieToken.split('=');
            const userId = decodeUserIdFromToken(value);
            if (userId) setCurrentUserId(userId);
        }
    }, []);

    const toggleFilter = (filterId: string) => {
        setActiveFilter((prev) => (prev === filterId ? '' : filterId));
    };

    const fetchFeed = useCallback(async () => {
        setIsLoading(true);
        try {
            const params: Record<string, any> = {};

            if (searchTerm.trim()) {
                params.search = searchTerm.trim();
            }
            if (activeFilter) {
                params.category = activeFilter;
            }

            const response = await getFeed(params);
            const data = response as any;
            const rawItems =
                (Array.isArray(data?.items) && data.items) ||
                (Array.isArray(data?.data?.items) && data.data.items) ||
                (Array.isArray(data?.feed?.items) && data.feed.items) ||
                (Array.isArray(data?.feed) && data.feed) ||
                (Array.isArray(data) && data) ||
                [];

            setFeedItems(rawItems);
        } catch (error) {
            console.error('Erreur lors du chargement du wall', error);
        } finally {
            setIsLoading(false);
        }
    }, [activeFilter, searchTerm]);

    useEffect(() => {
        const hasInitialData = resolvedInitialData.length > 0;
        const hasQuery = Boolean(searchTerm.trim() || activeFilter);

        if (!didInitFetchRef.current) {
            didInitFetchRef.current = true;

            if (hasInitialData && !hasQuery) {
                return;
            }
        }

        const timeout = setTimeout(() => {
            fetchFeed();
        }, 300);

        return () => clearTimeout(timeout);
    }, [activeFilter, fetchFeed, resolvedInitialData.length, searchTerm]);

    const handlePublish = useCallback(async () => {
        if (!newPostTitle.trim() || !newPostContent.trim()) {
            return;
        }

        setIsSubmitting(true);
        try {
            const payload: CreatePostPayload = {
                type: newPostType,
                title: newPostTitle.trim(),
                content: newPostContent.trim(),
                city: newPostCity.trim() || undefined,
            };

            const created = await createPost(payload as any);
            if (created) {
                setFeedItems((prev) => [created, ...prev]);
            } else {
                await fetchFeed();
            }

            setNewPostTitle('');
            setNewPostContent('');
            setNewPostCity('');
        } catch (error) {
            console.error('Erreur lors de la publication', error);
            addToast({
                message: 'Erreur lors de la publication',
                type: 'error',
            });
        } finally {
            setIsSubmitting(false);
        }
    }, [addToast, fetchFeed, newPostCity, newPostContent, newPostTitle, newPostType]);

    const resolveCardType = useCallback((item: any): 'NEED' | 'OFFER' => {
        const rawType = (item?.type || item?.postType || '').toString().toUpperCase();

        if (rawType === 'MISSION' || rawType === 'NEED') {
            return 'NEED';
        }

        if (rawType === 'POST' && item?.postType && String(item.postType).toUpperCase() === 'NEED') {
            return 'NEED';
        }

        if (item?.urgencyLevel || item?.jobTitle || item?.client) {
            return 'NEED';
        }

        return 'OFFER';
    }, []);

    const isPublishDisabled = isSubmitting || !newPostTitle.trim() || !newPostContent.trim();
    const showSkeleton = isLoading && feedItems.length === 0;
    const handleSelfContact = useCallback(() => {
        addToast({
            message: "C'est votre annonce",
            type: 'info',
        });
    }, [addToast]);

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header Sticky */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="py-4">
                        {/* Top Row: Logo + Search + Notifications */}
                        <div className="flex items-center gap-4 mb-4">
                            {/* Logo */}
                            <div className="flex-shrink-0">
                                <h1 className="text-xl font-bold text-slate-900">
                                    Les<span className="text-gradient">Extras</span>
                                </h1>
                            </div>

                            {/* Search Bar */}
                            <div className="flex-1 max-w-xl">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Rechercher un professionnel, une mission, un service..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="input-premium pl-12 pr-4"
                                        aria-label="Rechercher"
                                    />
                                </div>
                            </div>

                            {/* Notifications */}
                            <button
                                aria-label="Notifications"
                                className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors"
                            >
                                <Bell className="w-5 h-5 text-slate-600" />
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-coral-500 rounded-full" />
                            </button>
                        </div>

                        {/* Filter Badges */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                            <span className="flex-shrink-0 text-xs font-medium text-slate-400 mr-1">
                                <Filter className="w-4 h-4" />
                            </span>
                            {FILTER_BADGES.map((filter) => {
                                const Icon = filter.icon;
                                const isActive = activeFilter === filter.id;
                                return (
                                    <button
                                        key={filter.id}
                                        onClick={() => toggleFilter(filter.id)}
                                        className={`
                      pill-btn flex-shrink-0 flex items-center gap-1.5
                      ${isActive ? 'pill-btn-active' : 'pill-btn-inactive'}
                    `}
                                    >
                                        <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : filter.color}`} />
                                        {filter.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </header>

            <ToastContainer toasts={toasts} onRemove={removeToast} />

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex gap-6">
                    {/* Feed Grid - Masonry */}
                    <div className="flex-1 space-y-4">
                        <div className="bg-white rounded-2xl p-5 shadow-soft">
                            <div className="flex items-center justify-between gap-3 mb-3">
                                <div>
                                    <h2 className="font-semibold text-slate-900">Publier sur le Wall</h2>
                                    <p className="text-sm text-slate-500">Partage un besoin ou une offre</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setNewPostType('NEED')}
                                        className={`pill-btn ${newPostType === 'NEED' ? 'pill-btn-active' : 'pill-btn-inactive'}`}
                                    >
                                        Besoin
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewPostType('OFFER')}
                                        className={`pill-btn ${newPostType === 'OFFER' ? 'pill-btn-active' : 'pill-btn-inactive'}`}
                                    >
                                        Offre
                                    </button>
                                </div>
                            </div>

                            <div className="grid gap-3">
                                <input
                                    value={newPostTitle}
                                    onChange={(e) => setNewPostTitle(e.target.value)}
                                    placeholder="Titre de l'annonce"
                                    className="input-premium"
                                />
                                <textarea
                                    value={newPostContent}
                                    onChange={(e) => setNewPostContent(e.target.value)}
                                    placeholder="Decris ton annonce"
                                    className="input-premium min-h-[120px]"
                                />
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                    <input
                                        value={newPostCity}
                                        onChange={(e) => setNewPostCity(e.target.value)}
                                        placeholder="Ville (optionnel)"
                                        className="input-premium sm:flex-1"
                                    />
                                    <div className="flex justify-end gap-2 sm:w-auto">
                                        <button
                                            type="button"
                                            onClick={handlePublish}
                                            disabled={isPublishDisabled}
                                            className={`inline-flex items-center justify-center px-4 py-2 rounded-xl font-semibold text-white bg-coral-500 hover:bg-coral-600 transition-colors ${isPublishDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        >
                                            {isSubmitting ? 'Publication...' : 'Publier'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {showSkeleton ? (
                            <div className="columns-1 md:columns-2 xl:columns-3 gap-4 space-y-4">
                                {Array.from({ length: 6 }).map((_, index) => (
                                    <div key={index} className="break-inside-avoid">
                                        <div className="h-56 bg-white rounded-2xl shadow-soft border border-slate-100 animate-pulse" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="columns-1 md:columns-2 xl:columns-3 gap-4 space-y-4"
                            >
                                {feedItems.map((item) => {
                                    const cardType = resolveCardType(item);
                                    return (
                                        <motion.div
                                            key={item.id}
                                            variants={itemVariants}
                                            className="break-inside-avoid"
                                        >
                                            {cardType === 'NEED' ? (
                                                <NeedCard
                                                    data={item}
                                                    onClick={() => console.log('Need clicked:', item.id)}
                                                />
                                            ) : (
                                                <OfferCard
                                                    data={item}
                                                    currentUserId={currentUserId || undefined}
                                                    onSelfContact={handleSelfContact}
                                                    onClick={() => console.log('Offer clicked:', item.id)}
                                                />
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </motion.div>
                        )}

                        {/* Empty State */}
                        {!isLoading && feedItems.length === 0 && (
                            <div className="col-span-full text-center py-20">
                                <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                    🔍
                                </div>
                                <h3 className="text-lg font-medium text-gray-900">Aucun résultat trouvé</h3>
                                <p className="text-gray-500">Essayez de modifier vos filtres ou votre recherche.</p>
                            </div>
                        )}
                    </div>

                    {/* Sidebar - Desktop Only */}
                    <aside className="hidden lg:block w-80 flex-shrink-0 space-y-6">
                        {/* Mon Vivier */}
                        <div className="bg-white rounded-2xl p-5 shadow-soft">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                                    <Users className="w-4 h-4 text-coral-500" />
                                    Mon Vivier
                                </h2>
                                <button className="text-xs text-coral-600 font-medium hover:underline">
                                    Voir tout
                                </button>
                            </div>

                            <div className="space-y-3">
                                {talentPool.map((talent) => (
                                    <div
                                        key={talent.id}
                                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-coral-100 to-orange-100 flex items-center justify-center">
                                            <span className="text-sm font-semibold text-coral-600">
                                                {talent.name.charAt(0)}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-900 truncate">
                                                {talent.name}
                                            </p>
                                            <p className="text-xs text-slate-500">{talent.role}</p>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs">
                                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                            <span className="font-medium">{talent.rating}</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Activite Recente */}
                        <div className="bg-white rounded-2xl p-5 shadow-soft">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-blue-500" />
                                    Activite recente
                                </h2>
                            </div>

                            <div className="space-y-3">
                                {activity.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-start gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                                    >
                                        <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-slate-700 leading-snug">
                                                {item.text}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                Il y a {item.time}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="bg-gradient-to-br from-coral-500 to-orange-500 rounded-2xl p-5 text-white">
                            <h3 className="font-semibold mb-3">Cette semaine</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm">
                                    <p className="text-2xl font-bold">12</p>
                                    <p className="text-xs text-white/80">Nouvelles missions</p>
                                </div>
                                <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm">
                                    <p className="text-2xl font-bold">5</p>
                                    <p className="text-xs text-white/80">Candidatures</p>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}
