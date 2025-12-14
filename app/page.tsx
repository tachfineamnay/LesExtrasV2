'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    Bell,
    Home,
    Siren,
    Calendar,
    MessageCircle,
    User,
    Plus,
    ChevronRight,
    ArrowRight,
    Sparkles,
    TrendingUp,
} from 'lucide-react';

import {
    FeedFilters,
    FeedSidebar,
    FeedList,
    FeedSkeleton,
    type FeedItem,
    type TalentPoolItem,
    type ActivityItem,
} from '@/components/feed';
import { getFeed, createPost, mapApiItemToFeedItem, type CreatePostPayload } from '@/app/services/wall.service';
import { ToastContainer, useToasts } from '@/components/ui/Toast';

// ===========================================
// NAVIGATION
// ===========================================

const NAV_ITEMS = [
    { href: '/', label: 'Wall', icon: Home, active: true },
    { href: '/sos', label: 'SOS Renfort', icon: Siren, highlight: true },
    { href: '/bookings', label: 'Agenda', icon: Calendar },
    { href: '/messages', label: 'Messages', icon: MessageCircle, badge: 3 },
    { href: '/profile', label: 'Profil', icon: User },
];

// ===========================================
// MOCK DATA (will be replaced by API)
// ===========================================

const MOCK_FEED: FeedItem[] = [
    {
        id: '1',
        type: 'NEED',
        title: 'Éducateur(trice) spécialisé(e) pour weekend',
        establishment: 'EHPAD Les Jardins',
        city: 'Lyon 3e',
        description: 'Recherche éducateur(trice) expérimenté(e) pour accompagnement de résidents le weekend.',
        urgencyLevel: 'CRITICAL',
        hourlyRate: 25,
        jobTitle: 'Éducateur spécialisé',
        startDate: '2024-12-07',
        isNightShift: false,
        tags: ['EHPAD', 'Weekend'],
    },
    {
        id: '2',
        type: 'OFFER',
        title: 'Atelier Art-Thérapie pour Séniors',
        providerName: 'Marie Dupont',
        providerRating: 4.8,
        providerReviews: 23,
        city: 'Paris 15e',
        description: 'Séances d\'art-thérapie adaptées aux personnes âgées.',
        serviceType: 'WORKSHOP',
        category: 'Art-thérapie',
        basePrice: 150,
        imageUrl: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400',
        tags: ['Séniors', 'Créatif'],
    },
    {
        id: '3',
        type: 'NEED',
        title: 'Aide-soignant(e) de nuit',
        establishment: 'Clinique Saint-Joseph',
        city: 'Marseille',
        description: 'Poste de nuit pour accompagnement des patients en service gériatrique.',
        urgencyLevel: 'HIGH',
        hourlyRate: 22,
        jobTitle: 'Aide-soignant(e)',
        startDate: '2024-12-08',
        isNightShift: true,
        tags: ['Nuit', 'Gériatrie'],
    },
    {
        id: '4',
        type: 'OFFER',
        title: 'Coaching Sport Adapté en Visio',
        providerName: 'Thomas Martin',
        providerRating: 4.9,
        providerReviews: 47,
        city: 'Toulouse',
        description: 'Séances de sport adapté en visioconférence.',
        serviceType: 'COACHING_VIDEO',
        category: 'Sport adapté',
        basePrice: 45,
        imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400',
        tags: ['Visio', 'Sport'],
    },
];

const MOCK_TALENT_POOL: TalentPoolItem[] = [
    { id: '1', name: 'Marie D.', role: 'Éducatrice', avatar: null, rating: 4.8 },
    { id: '2', name: 'Thomas M.', role: 'Coach sportif', avatar: null, rating: 4.9 },
    { id: '3', name: 'Sophie L.', role: 'Musicothérapeute', avatar: null, rating: 4.7 },
];

const MOCK_ACTIVITY: ActivityItem[] = [
    { id: '1', text: 'Marie D. a postulé à votre mission', time: '2h' },
    { id: '2', text: 'Nouvelle mission urgente à Lyon', time: '4h' },
    { id: '3', text: 'Réservation confirmée avec Thomas M.', time: '6h' },
];

// ===========================================
// HELPERS
// ===========================================

const decodeUserIdFromToken = (token?: string | null) => {
    if (!token) return null;
    try {
        const cleaned = token.replace(/^Bearer\s+/i, '').trim();
        const parts = cleaned.split('.');
        if (parts.length < 2) return null;
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        return payload.sub || payload.id || null;
    } catch {
        return null;
    }
};

// ===========================================
// MAIN COMPONENT
// ===========================================

export default function HomePage() {
    // State
    const [posts, setPosts] = useState<FeedItem[]>(MOCK_FEED);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const { toasts, addToast, removeToast } = useToasts();

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilters, setActiveFilters] = useState<string[]>([]);

    // Publish form
    const [showPublishForm, setShowPublishForm] = useState(false);
    const [newPostTitle, setNewPostTitle] = useState('');
    const [newPostContent, setNewPostContent] = useState('');
    const [newPostCity, setNewPostCity] = useState('');
    const [newPostType, setNewPostType] = useState<'OFFER' | 'NEED'>('OFFER');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get user ID from token
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const candidates = [
            window.localStorage.getItem('accessToken'),
            window.localStorage.getItem('token'),
        ];
        for (const token of candidates) {
            const userId = decodeUserIdFromToken(token);
            if (userId) {
                setCurrentUserId(userId);
                return;
            }
        }
    }, []);

    // Fetch feed on mount
    const fetchFeed = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await getFeed();
            const data = response as any;
            const rawItems = Array.isArray(data) ? data : data?.items || data?.feed || [];

            const mappedItems = (rawItems as any[]).map(mapApiItemToFeedItem).filter(Boolean);

            if (mappedItems.length > 0) {
                setPosts(mappedItems as FeedItem[]);
            }
        } catch (error) {
            console.error('Error loading feed:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFeed();
    }, [fetchFeed]);

    // Filter logic
    const toggleFilter = (filterId: string) => {
        setActiveFilters(prev =>
            prev.includes(filterId)
                ? prev.filter(f => f !== filterId)
                : [...prev, filterId]
        );
    };

    const filteredFeed = useMemo(() => {
        let items = posts;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            items = items.filter(item =>
                item.title.toLowerCase().includes(query) ||
                item.city?.toLowerCase().includes(query)
            );
        }

        if (activeFilters.includes('urgent')) {
            items = items.filter(item =>
                item.type === 'NEED' && ['CRITICAL', 'HIGH'].includes(item.urgencyLevel)
            );
        }
        if (activeFilters.includes('visio')) {
            items = items.filter(item =>
                item.type === 'OFFER' && item.serviceType === 'COACHING_VIDEO'
            );
        }

        return items;
    }, [searchQuery, activeFilters, posts]);

    // Load more (infinite scroll simulation)
    const handleLoadMore = useCallback(() => {
        // In production, this would fetch the next page
        setHasMore(false); // For now, no more data
    }, []);

    // Publish
    const handlePublish = useCallback(async () => {
        if (!newPostTitle.trim() || !newPostContent.trim()) return;

        setIsSubmitting(true);
        try {
            const payload: CreatePostPayload = {
                type: newPostType,
                title: newPostTitle.trim(),
                content: newPostContent.trim(),
                city: newPostCity.trim() || undefined,
            };

            await createPost(payload as any);
            await fetchFeed();
            setNewPostTitle('');
            setNewPostContent('');
            setNewPostCity('');
            setShowPublishForm(false);
            addToast({ message: 'Publication réussie !', type: 'success' });
        } catch (error) {
            addToast({ message: 'Erreur lors de la publication', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    }, [addToast, fetchFeed, newPostCity, newPostContent, newPostTitle, newPostType]);

    const handleSelfContact = useCallback(() => {
        addToast({ message: "C'est votre annonce", type: 'info' });
    }, [addToast]);

    const isPublishDisabled = isSubmitting || !newPostTitle.trim() || !newPostContent.trim();

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center justify-between py-3 border-b border-slate-100/50">
                        <Link href="/" className="flex-shrink-0">
                            <h1 className="text-xl font-bold text-slate-900">
                                Les<span className="text-gradient">Extras</span>
                            </h1>
                        </Link>

                        <nav className="flex items-center gap-1">
                            {NAV_ITEMS.map((item) => {
                                const Icon = item.icon;
                                if (item.highlight) {
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-medium text-sm hover:shadow-lg transition-all"
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
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors relative ${item.active
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
                            <h1 className="text-xl font-bold text-slate-900">
                                Les<span className="text-gradient">Extras</span>
                            </h1>
                            <button
                                aria-label="Notifications"
                                className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors ml-auto"
                            >
                                <Bell className="w-5 h-5 text-slate-600" />
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-coral-500 rounded-full" />
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="py-4 lg:py-3">
                        <FeedFilters
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            activeFilters={activeFilters}
                            onFilterToggle={toggleFilter}
                            syncToUrl={true}
                        />
                    </div>
                </div>
            </header>

            <ToastContainer toasts={toasts} onRemove={removeToast} />

            {/* Hero Section */}
            <section className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-coral-500 to-orange-500 flex items-center justify-center shadow-lg shadow-coral-500/25">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Bienvenue sur le Wall</h2>
                                <p className="text-sm text-slate-500">Découvrez les dernières offres et besoins</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white shadow-soft border border-slate-100">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-sm font-medium text-slate-700">
                                    {posts.filter(p => p.type === 'NEED').length} Besoins actifs
                                </span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white shadow-soft border border-slate-100">
                                <TrendingUp className="w-4 h-4 text-coral-500" />
                                <span className="text-sm font-medium text-slate-700">
                                    {posts.filter(p => p.type === 'OFFER').length} Offres
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex gap-6">
                    {/* Feed */}
                    <div className="flex-1 space-y-4">
                        {/* Publish Card */}
                        <motion.div
                            className="card-surface overflow-hidden"
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
                                        <p className="text-sm text-slate-500">Partager un besoin ou une offre</p>
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
                                            placeholder="Décris ton annonce"
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
                                                className={`btn-primary ${isPublishDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                                            >
                                                {isSubmitting ? 'Publication...' : 'Publier'}
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>

                        {/* Feed List */}
                        <FeedList
                            items={filteredFeed}
                            isLoading={isLoading}
                            hasMore={hasMore}
                            onLoadMore={handleLoadMore}
                            currentUserId={currentUserId}
                            onSelfContact={handleSelfContact}
                        />
                    </div>

                    {/* Sidebar */}
                    <FeedSidebar
                        talentPool={MOCK_TALENT_POOL}
                        activity={MOCK_ACTIVITY}
                    />
                </div>
            </main>
        </div>
    );
}
