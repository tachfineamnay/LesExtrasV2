'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
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
    Bell,
    Home,
    Siren,
    Calendar,
    MessageCircle,
    User,
    Plus,
    TrendingUp,
    Sparkles,
    ArrowRight
} from 'lucide-react';
import Link from 'next/link';
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
    category?: string;
    basePrice?: number;
    imageUrl?: string;
    tags: string[];
}

export type FeedItem = NeedItem | OfferItem;

type ApiFeedItem = {
    id: string;
    authorId?: string;
    type?: 'POST' | 'MISSION' | 'NEED' | 'OFFER';
    postType?: 'OFFER' | 'NEED';
    title?: string;
    content?: string;
    description?: string;
    authorName?: string;
    establishment?: string;
    city?: string | null;
    tags?: string[] | null;
    category?: string | null;
    urgencyLevel?: NeedItem['urgencyLevel'];
    hourlyRate?: number | null;
    validUntil?: string | Date | null;
    startDate?: string | Date | null;
    isNightShift?: boolean | null;
    serviceType?: OfferItem['serviceType'];
    basePrice?: number | null;
    providerName?: string;
    providerRating?: number;
    providerReviews?: number;
    imageUrl?: string;
    imageUrls?: string[] | null;
};

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
    initialFeed: FeedItem[];
    talentPool: TalentPoolItem[];
    activity: ActivityItem[];
}

const FILTER_BADGES = [
    { id: 'urgent', label: 'Urgent', icon: Zap, color: 'text-red-500' },
    { id: 'sport', label: 'Sport', icon: Dumbbell, color: 'text-blue-500' },
    { id: 'visio', label: 'Visio', icon: Video, color: 'text-purple-500' },
    { id: 'bien-etre', label: 'Bien-etre', icon: Heart, color: 'text-pink-500' },
    { id: 'art', label: 'Art', icon: Palette, color: 'text-orange-500' },
];

// Desktop navigation items
const NAV_ITEMS = [
    { href: '/', label: 'Wall', icon: Home, active: true },
    { href: '/dashboard/relief', label: 'SOS Renfort', icon: Siren, highlight: true },
    { href: '/bookings', label: 'Agenda', icon: Calendar },
    { href: '/messages', label: 'Messages', icon: MessageCircle, badge: 3 },
    { href: '/profile', label: 'Profil', icon: User },
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
            type: 'spring' as const,
            stiffness: 100,
            damping: 15,
        },
    },
};

const toIsoString = (value?: string | Date | null) => {
    if (!value) return new Date().toISOString();
    const date = typeof value === 'string' ? new Date(value) : value;
    return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
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

const mapApiItemToFeedItem = (item: ApiFeedItem | FeedItem): FeedItem | null => {
    if (!item) return null;

    const authorId = (item as any).authorId || (item as any)?.author?.id || undefined;

    if (item.type === 'NEED' || item.type === 'OFFER') {
        return { ...item, authorId } as FeedItem;
    }

    const normalizedTags = Array.isArray(item.tags)
        ? item.tags.filter(Boolean)
        : [];

    if (item.type === 'MISSION' || item.postType === 'NEED') {
        const startDate = item.validUntil || item.startDate;

        return {
            id: item.id,
            authorId,
            type: 'NEED',
            title: item.title || 'Annonce',
            establishment: item.establishment || item.authorName || 'Etablissement',
            city: item.city || '',
            description: item.content || item.description || '',
            urgencyLevel: item.urgencyLevel || 'MEDIUM',
            hourlyRate: item.hourlyRate ?? 0,
            jobTitle: item.category || 'Mission',
            startDate: toIsoString(startDate),
            isNightShift: Boolean(item.isNightShift),
            tags: normalizedTags,
        };
    }

    return {
        id: item.id,
        authorId,
        type: 'OFFER',
        title: item.title || 'Offre',
        providerName: item.providerName || item.authorName || 'Prestataire',
        providerRating: item.providerRating ?? 0,
        providerReviews: item.providerReviews ?? 0,
        city: item.city || '',
        description: item.content || item.description || '',
        serviceType: item.serviceType || 'WORKSHOP',
        category: item.category || undefined,
        basePrice: item.basePrice ?? item.hourlyRate ?? undefined,
        imageUrl: item.imageUrl || (Array.isArray(item.imageUrls) ? item.imageUrls[0] : undefined),
        tags: normalizedTags,
    };
};

export function WallFeedClient({ initialFeed, talentPool, activity }: WallFeedClientProps) {
    const [posts, setPosts] = useState<FeedItem[]>(initialFeed);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const { toasts, addToast, removeToast } = useToasts();
    const [newPostTitle, setNewPostTitle] = useState('');
    const [newPostContent, setNewPostContent] = useState('');
    const [newPostCity, setNewPostCity] = useState('');
    const [newPostType, setNewPostType] = useState<'OFFER' | 'NEED'>('OFFER');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilters, setActiveFilters] = useState<string[]>([]);
    const [showPublishForm, setShowPublishForm] = useState(false);

    useEffect(() => {
        setPosts(initialFeed);
    }, [initialFeed]);

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
        setActiveFilters(prev =>
            prev.includes(filterId)
                ? prev.filter(f => f !== filterId)
                : [...prev, filterId]
        );
    };

    const fetchFeed = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await getFeed();
            const data = response as any;
            const rawItems =
                (Array.isArray(data) && data) ||
                (Array.isArray(data?.items) && data.items) ||
                (Array.isArray(data?.data?.items) && data.data.items) ||
                (Array.isArray(data?.feed?.items) && data.feed.items) ||
                (Array.isArray(data?.feed) && data.feed) ||
                [];

            const mapped = rawItems.map((item: ApiFeedItem | FeedItem) => mapApiItemToFeedItem(item));
            const mappedItems: FeedItem[] = mapped.filter((item: FeedItem | null): item is FeedItem => item !== null);

            // Only update if API returned data, otherwise keep initial mock data
            if (mappedItems.length > 0) {
                setPosts(mappedItems);
            }
        } catch (error) {
            console.error('Erreur lors du chargement du wall', error);
            // Keep initial data on error - don't clear posts
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFeed();
    }, [fetchFeed]);

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
            const mapped = mapApiItemToFeedItem((created || {}) as ApiFeedItem);

            if (mapped) {
                setPosts((prev) => [mapped, ...prev]);
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

    const filteredFeed = useMemo(() => {
        let items = posts;

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            items = items.filter(item =>
                item.title.toLowerCase().includes(query) ||
                ('establishment' in item && item.establishment.toLowerCase().includes(query)) ||
                ('providerName' in item && item.providerName.toLowerCase().includes(query)) ||
                item.city?.toLowerCase().includes(query)
            );
        }

        // Tag filters
        if (activeFilters.includes('urgent')) {
            items = items.filter(item =>
                item.type === 'NEED' && (item.urgencyLevel === 'CRITICAL' || item.urgencyLevel === 'HIGH')
            );
        }
        if (activeFilters.includes('visio')) {
            items = items.filter(item =>
                item.type === 'OFFER' && item.serviceType === 'COACHING_VIDEO'
            );
        }

        return items;
    }, [searchQuery, activeFilters, posts]);

    const isPublishDisabled = isSubmitting || !newPostTitle.trim() || !newPostContent.trim();
    const showSkeleton = isLoading && posts.length === 0;
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
                    {/* Desktop Navigation Row */}
                    <div className="hidden lg:flex items-center justify-between py-3 border-b border-slate-100/50">
                        {/* Logo */}
                        <Link href="/" className="flex-shrink-0">
                            <h1 className="text-xl font-bold text-slate-900">
                                Les<span className="text-gradient">Extras</span>
                            </h1>
                        </Link>

                        {/* Desktop Nav Links */}
                        <nav className="flex items-center gap-1">
                            {NAV_ITEMS.map((item) => {
                                const Icon = item.icon;
                                if (item.highlight) {
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-medium text-sm hover:shadow-lg hover:shadow-red-500/25 transition-all"
                                        >
                                            <Icon className="w-4 h-4" />
                                            {item.label}
                                        </Link>
                                    );
                                }
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors relative ${
                                            item.active
                                                ? 'bg-coral-50 text-coral-600'
                                                : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {item.label}
                                        {item.badge && (
                                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-coral-500 text-white text-xs rounded-full flex items-center justify-center">
                                                {item.badge}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* User Actions */}
                        <div className="flex items-center gap-3">
                            <button
                                aria-label="Notifications"
                                className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors"
                            >
                                <Bell className="w-5 h-5 text-slate-600" />
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-coral-500 rounded-full" />
                            </button>
                            <Link
                                href="/profile"
                                className="w-9 h-9 rounded-full bg-gradient-to-br from-coral-100 to-orange-100 flex items-center justify-center"
                            >
                                <User className="w-4 h-4 text-coral-600" />
                            </Link>
                        </div>
                    </div>

                    {/* Mobile Header */}
                    <div className="lg:hidden py-4">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex-shrink-0">
                                <h1 className="text-xl font-bold text-slate-900">
                                    Les<span className="text-gradient">Extras</span>
                                </h1>
                            </div>
                            <button
                                aria-label="Notifications"
                                className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors ml-auto"
                            >
                                <Bell className="w-5 h-5 text-slate-600" />
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-coral-500 rounded-full" />
                            </button>
                        </div>
                    </div>

                    {/* Search + Filters Row */}
                    <div className="py-4 lg:py-3">
                        {/* Search Bar */}
                        <div className="mb-4">
                            <div className="relative max-w-2xl">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Rechercher un professionnel, une mission, un service..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="input-premium pl-12 pr-4 w-full"
                                    aria-label="Rechercher"
                                />
                            </div>
                        </div>

                        {/* Filter Badges */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                            <span className="flex-shrink-0 text-xs font-medium text-slate-400 mr-1">
                                <Filter className="w-4 h-4" />
                            </span>
                            {FILTER_BADGES.map((filter) => {
                                const Icon = filter.icon;
                                const isActive = activeFilters.includes(filter.id);
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

            {/* Hero Section - Welcome & Quick Stats */}
            <section className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        {/* Welcome Message */}
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-coral-500 to-orange-500 flex items-center justify-center shadow-lg shadow-coral-500/25">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Bienvenue sur le Wall</h2>
                                <p className="text-sm text-slate-500">Decouvrez les dernieres offres et besoins du secteur medico-social</p>
                            </div>
                        </div>

                        {/* Quick Stats Pills */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white shadow-soft border border-slate-100">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-sm font-medium text-slate-700">{posts.filter(p => p.type === 'NEED').length} Besoins actifs</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white shadow-soft border border-slate-100">
                                <TrendingUp className="w-4 h-4 text-coral-500" />
                                <span className="text-sm font-medium text-slate-700">{posts.filter(p => p.type === 'OFFER').length} Offres</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex gap-6">
                    {/* Feed Grid - Masonry */}
                    <div className="flex-1 space-y-4">
                        {/* Publish Card - Collapsible */}
                        <motion.div 
                            className="bg-white rounded-2xl shadow-soft overflow-hidden"
                            initial={false}
                            animate={{ height: showPublishForm ? 'auto' : '64px' }}
                        >
                            <button
                                onClick={() => setShowPublishForm(!showPublishForm)}
                                className="w-full flex items-center justify-between gap-3 p-4 hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-coral-100 to-orange-100 flex items-center justify-center">
                                        <Plus className="w-5 h-5 text-coral-600" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-medium text-slate-900">Publier sur le Wall</p>
                                        <p className="text-sm text-slate-500">Partage un besoin ou une offre</p>
                                    </div>
                                </div>
                                <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${showPublishForm ? 'rotate-90' : ''}`} />
                            </button>
                            
                            {showPublishForm && (
                                <div className="px-5 pb-5 pt-2 border-t border-slate-100">
                                    <div className="flex items-center gap-2 mb-4">
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
                                            className="input-premium min-h-[100px]"
                                        />
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                            <input
                                                value={newPostCity}
                                                onChange={(e) => setNewPostCity(e.target.value)}
                                                placeholder="Ville (optionnel)"
                                                className="input-premium sm:flex-1"
                                            />
                                            <button
                                                type="button"
                                                onClick={handlePublish}
                                                disabled={isPublishDisabled}
                                                className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-coral-500 hover:bg-coral-600 transition-colors ${isPublishDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                                            >
                                                {isSubmitting ? 'Publication...' : 'Publier'}
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>

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
                                {filteredFeed.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        variants={itemVariants}
                                        className="break-inside-avoid"
                                    >
                                        {item.type === 'NEED' ? (
                                            <NeedCard
                                                id={item.id}
                                                authorId={item.authorId}
                                                currentUserId={currentUserId || undefined}
                                                onSelfContact={handleSelfContact}
                                                title={item.title}
                                                establishment={item.establishment}
                                                city={item.city}
                                                description={item.description}
                                                urgencyLevel={item.urgencyLevel}
                                                hourlyRate={item.hourlyRate}
                                                jobTitle={item.jobTitle}
                                                startDate={item.startDate}
                                                isNightShift={item.isNightShift}
                                                tags={item.tags}
                                                onClick={() => console.log('Need clicked:', item.id)}
                                            />
                                        ) : (
                                            <OfferCard
                                                id={item.id}
                                                authorId={item.authorId}
                                                currentUserId={currentUserId || undefined}
                                                onSelfContact={handleSelfContact}
                                                title={item.title}
                                                providerName={item.providerName}
                                                providerRating={item.providerRating}
                                                providerReviews={item.providerReviews}
                                                city={item.city}
                                                description={item.description}
                                                serviceType={item.serviceType}
                                                category={item.category}
                                                basePrice={item.basePrice}
                                                imageUrl={item.imageUrl}
                                                tags={item.tags}
                                                onClick={() => console.log('Offer clicked:', item.id)}
                                            />
                                        )}
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}

                        {/* Empty State */}
                        {!isLoading && filteredFeed.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                                    <Search className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                    Aucun resultat
                                </h3>
                                <p className="text-sm text-slate-500 max-w-sm">
                                    Essayez de modifier vos filtres ou votre recherche pour trouver ce que vous cherchez.
                                </p>
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

            {/* Mobile FAB - Floating Action Button */}
            <motion.button
                onClick={() => {
                    setShowPublishForm(true);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="lg:hidden fixed bottom-20 right-4 z-30 w-14 h-14 rounded-full bg-gradient-to-br from-coral-500 to-orange-500 text-white shadow-xl shadow-coral-500/30 flex items-center justify-center"
                whileTap={{ scale: 0.9 }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5 }}
                aria-label="Publier une annonce"
            >
                <Plus className="w-6 h-6" />
            </motion.button>
        </div>
    );
}
