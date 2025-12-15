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
    Zap,
    Search,
    Filter
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
// SCALED MOCK DATA (25+ ITEMS)
// ===========================================

const MOCK_FEED: FeedItem[] = [
    { id: '1', type: 'NEED', title: 'Éducateur(trice) spécialisé(e) pour weekend', establishment: 'EHPAD Les Jardins', city: 'Lyon 3e', description: 'Recherche éducateur(trice) expérimenté(e) pour accompagnement de résidents.', urgencyLevel: 'CRITICAL', hourlyRate: 25, jobTitle: 'Éducateur spécialisé', startDate: '2024-12-07', isNightShift: false, tags: ['EHPAD', 'Weekend'] },
    { id: '2', type: 'OFFER', title: 'Atelier Art-Thérapie pour Séniors', providerName: 'Marie Dupont', providerRating: 4.8, providerReviews: 23, city: 'Paris 15e', description: 'Séances d\'art-thérapie adaptées aux personnes âgées.', serviceType: 'WORKSHOP', category: 'Art-thérapie', basePrice: 150, imageUrl: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400', tags: ['Séniors', 'Créatif'] },
    { id: '3', type: 'NEED', title: 'Aide-soignant(e) de nuit', establishment: 'Clinique Saint-Joseph', city: 'Marseille', description: 'Poste de nuit pour accompagnement des patients.', urgencyLevel: 'HIGH', hourlyRate: 22, jobTitle: 'Aide-soignant(e)', startDate: '2024-12-08', isNightShift: true, tags: ['Nuit', 'Gériatrie'] },
    { id: '4', type: 'OFFER', title: 'Coaching Sport Adapté en Visio', providerName: 'Thomas Martin', providerRating: 4.9, providerReviews: 47, city: 'Toulouse', description: 'Séances de sport adapté en visioconférence.', serviceType: 'COACHING_VIDEO', category: 'Sport adapté', basePrice: 45, imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400', tags: ['Visio', 'Sport'] },
    { id: '5', type: 'NEED', title: 'Renfort Infirmier(e) urgences', establishment: 'Hôpital Nord', city: 'Lille', description: 'Besoin urgent de renfort aux urgences.', urgencyLevel: 'CRITICAL', hourlyRate: 35, jobTitle: 'Infirmier(e)', startDate: '2024-12-09', isNightShift: true, tags: ['Urgences', 'Nuit'] },
    { id: '6', type: 'OFFER', title: 'Formation Gestion Stress', providerName: 'Sophie Laurent', providerRating: 4.7, providerReviews: 12, city: 'Bordeaux', description: 'Formation pour équipes soignantes.', serviceType: 'WORKSHOP', category: 'Bien-être', basePrice: 200, imageUrl: 'https://images.unsplash.com/photo-1544367563-12123d8965cd?w=400', tags: ['Formation', 'Stress'] },
    { id: '7', type: 'NEED', title: 'AMP pour foyer de vie', establishment: 'Foyer L\'Espoir', city: 'Nantes', description: 'Accompagnement quotidien des résidents.', urgencyLevel: 'MEDIUM', hourlyRate: 20, jobTitle: 'AMP', startDate: '2024-12-10', isNightShift: false, tags: ['Handicap', 'Jour'] },
    { id: '8', type: 'OFFER', title: 'Musicothérapie en groupe', providerName: 'Lucas Bernard', providerRating: 4.5, providerReviews: 8, city: 'Strasbourg', description: 'Séances de musicothérapie.', serviceType: 'WORKSHOP', category: 'Musique', basePrice: 120, imageUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400', tags: ['Musique', 'Groupe'] },
    { id: '9', type: 'NEED', title: 'Psychologue clinicien(ne)', establishment: 'CMP Enfants', city: 'Nice', description: 'Remplacement congé maternité.', urgencyLevel: 'LOW', hourlyRate: 40, jobTitle: 'Psychologue', startDate: '2024-12-11', isNightShift: false, tags: ['Enfants', 'Psy'] },
    { id: '10', type: 'OFFER', title: 'Yoga sur chaise', providerName: 'Emma Petit', providerRating: 4.6, providerReviews: 15, city: 'Rennes', description: 'Yoga adapté pour personnes à mobilité réduite.', serviceType: 'WORKSHOP', category: 'Sport', basePrice: 80, imageUrl: 'https://images.unsplash.com/photo-1544367563-12123d8965cd?w=400', tags: ['Yoga', 'PMR'] },
    { id: '11', type: 'NEED', title: 'Moniteur Éducateur remplacement', establishment: 'IME Les Papillons', city: 'Montpellier', description: 'Accompagnement éducatif.', urgencyLevel: 'HIGH', hourlyRate: 23, jobTitle: 'Moniteur Éducateur', startDate: '2024-12-12', isNightShift: false, tags: ['IME', 'Educatif'] },
    { id: '12', type: 'OFFER', title: 'Sophrologie en ligne', providerName: 'Julie Dubois', providerRating: 4.8, providerReviews: 30, city: 'Lyon', description: 'Séances de sophrologie à distance.', serviceType: 'COACHING_VIDEO', category: 'Bien-être', basePrice: 50, imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400', tags: ['Visio', 'Sophro'] },
    { id: '13', type: 'NEED', title: 'Veilleur de nuit', establishment: 'Maison d\'Accueil', city: 'Toulon', description: 'Surveillance de nuit.', urgencyLevel: 'CRITICAL', hourlyRate: 18, jobTitle: 'Veilleur', startDate: '2024-12-13', isNightShift: true, tags: ['Nuit', 'Sécurité'] },
    { id: '14', type: 'OFFER', title: 'Atelier Cuisine Thérapeutique', providerName: 'Chef Marc', providerRating: 4.9, providerReviews: 50, city: 'Dijon', description: 'Cuisine adaptée.', serviceType: 'WORKSHOP', category: 'Cuisine', basePrice: 180, imageUrl: 'https://images.unsplash.com/photo-1556910103-1c02745a30bf?w=400', tags: ['Cuisine', 'Thérapie'] },
    { id: '15', type: 'NEED', title: 'Ergothérapeute', establishment: 'Centre Rééducation', city: 'Grenoble', description: 'Bilan et rééducation.', urgencyLevel: 'MEDIUM', hourlyRate: 32, jobTitle: 'Ergothérapeute', startDate: '2024-12-14', isNightShift: false, tags: ['Rééducation', 'Santé'] },
    { id: '16', type: 'OFFER', title: 'Médiation Animale', providerName: 'Laura & Rex', providerRating: 4.7, providerReviews: 20, city: 'Angers', description: 'Séances avec chiens formés.', serviceType: 'WORKSHOP', category: 'Animaux', basePrice: 130, imageUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400', tags: ['Animaux', 'Médiation'] },
    { id: '17', type: 'NEED', title: 'Agent hôtelier hospitalier', establishment: 'CHU', city: 'Nîmes', description: 'Entretien des locaux.', urgencyLevel: 'HIGH', hourlyRate: 15, jobTitle: 'Agent hôtelier', startDate: '2024-12-15', isNightShift: false, tags: ['Entretien', 'Hôpital'] },
    { id: '18', type: 'OFFER', title: 'Coaching vocal', providerName: 'Sarah Sing', providerRating: 4.6, providerReviews: 10, city: 'Aix-en-Provence', description: 'Expression vocale.', serviceType: 'COACHING_VIDEO', category: 'Art', basePrice: 60, imageUrl: 'https://images.unsplash.com/photo-1516280440614-6697288d5d38?w=400', tags: ['Chant', 'Visio'] },
    { id: '19', type: 'NEED', title: 'Kiné respiratoire', establishment: 'Ehpad Le Parc', city: 'Saint-Étienne', description: 'Intervention ponctuelle.', urgencyLevel: 'CRITICAL', hourlyRate: 45, jobTitle: 'Kinésithérapeute', startDate: '2024-12-16', isNightShift: false, tags: ['Kiné', 'Soins'] },
    { id: '20', type: 'OFFER', title: 'Atelier Jardinage', providerName: 'Pierre Vert', providerRating: 4.8, providerReviews: 25, city: 'Tours', description: 'Jardinage adapté.', serviceType: 'WORKSHOP', category: 'Nature', basePrice: 100, imageUrl: 'https://images.unsplash.com/photo-14168797412d3-f3d1b995cc6d?w=400', tags: ['Jardin', 'Nature'] },
    { id: '21', type: 'NEED', title: 'Auxiliaire de vie', establishment: 'MAD Service', city: 'Clermont-Ferrand', description: 'Aide à domicile.', urgencyLevel: 'MEDIUM', hourlyRate: 17, jobTitle: 'Auxiliaire de vie', startDate: '2024-12-17', isNightShift: false, tags: ['Domicile', 'Aide'] },
    { id: '22', type: 'OFFER', title: 'Danse assise', providerName: 'Studio Move', providerRating: 4.5, providerReviews: 18, city: 'Le Mans', description: 'Danse adaptée.', serviceType: 'WORKSHOP', category: 'Danse', basePrice: 90, imageUrl: 'https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?w=400', tags: ['Danse', 'Senior'] },
    { id: '23', type: 'NEED', title: 'Secrétaire médicale', establishment: 'Cabinet Médical', city: 'Brest', description: 'Accueil et gestion.', urgencyLevel: 'LOW', hourlyRate: 16, jobTitle: 'Secrétaire', startDate: '2024-12-18', isNightShift: false, tags: ['Admin', 'Santé'] },
    { id: '24', type: 'OFFER', title: 'Relaxation sonore', providerName: 'Zen Sound', providerRating: 4.9, providerReviews: 35, city: 'Limoges', description: 'Bols tibétains.', serviceType: 'WORKSHOP', category: 'Bien-être', basePrice: 110, imageUrl: 'https://images.unsplash.com/photo-1515023115689-589c33041697?w=400', tags: ['Son', 'Zen'] },
    { id: '25', type: 'NEED', title: 'Directeur adjoint', establishment: 'EHPAD Soleil', city: 'Annecy', description: 'Gestion d\'équipe.', urgencyLevel: 'HIGH', hourlyRate: 40, jobTitle: 'Directeur', startDate: '2024-12-19', isNightShift: false, tags: ['Direction', 'Management'] },
    { id: '26', type: 'OFFER', title: 'Cours Informatique', providerName: 'Geek Help', providerRating: 4.7, providerReviews: 14, city: 'Metz', description: 'Aide numérique.', serviceType: 'COACHING_VIDEO', category: 'Formation', basePrice: 40, imageUrl: 'https://images.unsplash.com/photo-1531297461136-82lw9b61d696?w=400', tags: ['Informatique', 'Visio'] },
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

    // Publish form (Quick Actions)
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
                setPosts(prev => {
                    // Merge mock and API (for demo density) unique by ID
                    const existingIds = new Set(prev.map(p => p.id));
                    const newItems = mappedItems.filter(i => !existingIds.has(i.id));
                    return [...newItems, ...prev]; // Put real items fast, then fallback to mock
                });
            }
        } catch (error) {
            console.error('Error loading feed:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        // Mock loading delay for effect
        setTimeout(() => fetchFeed(), 800);
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
        // For demo: just duplicate existing items with new IDs to simulate infinite scroll
        const moreItems = filteredFeed.slice(0, 10).map(item => ({
            ...item,
            id: `${item.id}-dup-${Date.now()}`
        }));
        setPosts(prev => [...prev, ...moreItems]);
        // setHasMore(false); // Keep it infinite for demo fun
    }, [filteredFeed]);

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
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center justify-between py-3">
                        <Link href="/" className="flex-shrink-0 group">
                            <h1 className="text-2xl font-bold text-slate-900 group-hover:scale-105 transition-transform">
                                Les<span className="text-transparent bg-clip-text bg-gradient-to-r from-coral-500 to-orange-500">Extras</span>
                            </h1>
                        </Link>

                        <nav className="flex items-center gap-1 bg-slate-100/50 p-1.5 rounded-2xl">
                            {NAV_ITEMS.map((item) => {
                                const Icon = item.icon;
                                if (item.highlight) {
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-medium text-sm hover:shadow-lg hover:shadow-red-500/20 transition-all active:scale-95"
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
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all relative ${item.active
                                            ? 'bg-white text-slate-900 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {item.label}
                                        {item.badge && (
                                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-coral-500 text-white text-xs rounded-full flex items-center justify-center shadow-sm border-2 border-white">
                                                {item.badge}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="flex items-center gap-3">
                            <button className="relative p-2.5 rounded-xl hover:bg-slate-100 transition-colors">
                                <Bell className="w-5 h-5 text-slate-600" />
                                <span className="absolute top-2 right-2 w-2 h-2 bg-coral-500 rounded-full ring-2 ring-white" />
                            </button>
                            <Link href="/profile" className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-slate-100 transition-colors">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-coral-100 to-orange-100 flex items-center justify-center border-2 border-white shadow-sm">
                                    <User className="w-4 h-4 text-coral-600" />
                                </div>
                            </Link>
                        </div>
                    </div>

                    {/* Mobile Header */}
                    <div className="lg:hidden py-4 flex items-center justify-between">
                        <h1 className="text-xl font-bold text-slate-900">
                            Les<span className="text-transparent bg-clip-text bg-gradient-to-r from-coral-500 to-orange-500">Extras</span>
                        </h1>
                        <button className="relative p-2 rounded-xl hover:bg-slate-100">
                            <Bell className="w-5 h-5 text-slate-600" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-coral-500 rounded-full" />
                        </button>
                    </div>

                    {/* Filters & Search */}
                    <div className="py-2 pb-4">
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

            {/* NEW HERO SECTION (Innovation) */}
            <section className="relative overflow-hidden bg-white border-b border-slate-100">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-orange-50/30" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">

                        {/* Welcome */}
                        <div className="space-y-1">
                            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                <Sparkles className="w-6 h-6 text-amber-400 fill-amber-400" />
                                Le Wall <span className="text-slate-400 font-normal text-lg ml-2">Flux en temps réel</span>
                            </h2>
                            <p className="text-slate-500 max-w-md">
                                Trouvez votre prochaine mission ou le talent idéal parmi <strong className="text-slate-900">{posts.length}+ annonces</strong> vérifiées.
                            </p>
                        </div>

                        {/* Quick Actions (Innovation) */}
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <button
                                onClick={() => { setShowPublishForm(true); setNewPostType('NEED'); }}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-all hover:shadow-lg hover:-translate-y-0.5"
                            >
                                <Zap className="w-4 h-4 text-yellow-400" />
                                Publier un Besoin
                            </button>
                            <button
                                onClick={() => { setShowPublishForm(true); setNewPostType('OFFER'); }}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 font-medium hover:border-slate-300 hover:bg-slate-50 transition-all hover:shadow-md hover:-translate-y-0.5"
                            >
                                <Plus className="w-4 h-4" />
                                Proposer une Offre
                            </button>
                        </div>

                    </div>
                </div>
            </section>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex gap-8">
                    {/* Feed */}
                    <div className="flex-1 space-y-6">

                        {/* Publish Card (Collapsible) */}
                        <motion.div
                            initial={false}
                            animate={{
                                height: showPublishForm ? 'auto' : 0,
                                opacity: showPublishForm ? 1 : 0,
                                marginBottom: showPublishForm ? 24 : 0
                            }}
                            className="overflow-hidden"
                        >
                            <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-slate-900">
                                        Nouvelle publication : {newPostType === 'NEED' ? 'Besoin' : 'Offre'}
                                    </h3>
                                    <button onClick={() => setShowPublishForm(false)} className="text-slate-400 hover:text-slate-600">
                                        Fermer
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <input
                                        value={newPostTitle}
                                        onChange={(e) => setNewPostTitle(e.target.value)}
                                        placeholder="Titre de votre annonce..."
                                        className="w-full text-lg font-medium placeholder:text-slate-300 border-none focus:ring-0 p-0"
                                        autoFocus
                                    />
                                    <div className="h-px bg-slate-100" />
                                    <textarea
                                        value={newPostContent}
                                        onChange={(e) => setNewPostContent(e.target.value)}
                                        placeholder="Dites-en plus sur votre recherche..."
                                        className="w-full min-h-[100px] resize-none border-none focus:ring-0 p-0 text-slate-600"
                                    />
                                    <div className="flex items-center gap-4 pt-2">
                                        <div className="flex-1 bg-slate-50 rounded-xl px-4 py-2 flex items-center gap-2">
                                            <Search className="w-4 h-4 text-slate-400" />
                                            <input
                                                value={newPostCity}
                                                onChange={(e) => setNewPostCity(e.target.value)}
                                                placeholder="Ajouter une ville..."
                                                className="bg-transparent border-none focus:ring-0 w-full text-sm"
                                            />
                                        </div>
                                        <button
                                            onClick={handlePublish}
                                            disabled={isPublishDisabled}
                                            className={`px-6 py-2 rounded-xl bg-coral-500 text-white font-medium hover:bg-coral-600 transition-colors ${isPublishDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {isSubmitting ? '...' : 'Publier'}
                                        </button>
                                    </div>
                                </div>
                            </div>
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
                    <div className="hidden lg:block w-80 space-y-6">
                        <FeedSidebar
                            talentPool={MOCK_TALENT_POOL}
                            activity={MOCK_ACTIVITY}
                        />

                        {/* Promo Widget (Innovation) */}
                        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl p-6 text-white text-center shadow-lg shadow-indigo-500/25">
                            <p className="font-bold text-lg mb-2">Devenez Premium</p>
                            <p className="text-white/80 text-sm mb-4">Accédez à des offres exclusives et boostez votre visibilité.</p>
                            <button className="w-full py-2 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-colors">
                                Découvrir
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
