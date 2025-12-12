'use client';

import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
    ArrowLeft, 
    MapPin, 
    Clock, 
    Star, 
    Mail, 
    Phone, 
    Calendar,
    Zap,
    Video,
    Building2,
    User,
    Tag,
    Euro,
    Share2,
    Heart,
    MessageCircle
} from 'lucide-react';
import Link from 'next/link';

// Mock data - will be replaced by API call
const MOCK_OFFERS = [
    {
        id: '2',
        type: 'OFFER',
        title: 'Atelier Art-Thérapie pour Séniors',
        providerName: 'Marie Dupont',
        providerRating: 4.8,
        providerReviews: 23,
        city: 'Paris 15e',
        description: 'Séances d\'art-thérapie adaptées aux personnes âgées. Peinture, collage, expression libre. Approche bienveillante et personnalisée pour stimuler la créativité et favoriser le bien-être émotionnel.',
        serviceType: 'WORKSHOP',
        category: 'Art-thérapie',
        basePrice: 150,
        imageUrl: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800',
        tags: ['Séniors', 'Créatif', 'Groupe'],
        duration: '2h',
        availability: 'Lundi au vendredi',
    },
    {
        id: '4',
        type: 'OFFER',
        title: 'Coaching Sport Adapté en Visio',
        providerName: 'Thomas Martin',
        providerRating: 4.9,
        providerReviews: 47,
        city: 'Toulouse',
        description: 'Séances de sport adapté en visioconférence. Mobilité douce, renforcement musculaire adaptés à tous les niveaux.',
        serviceType: 'COACHING_VIDEO',
        category: 'Sport adapté',
        basePrice: 45,
        imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800',
        tags: ['Visio', 'Sport', 'Mobilité'],
        duration: '1h',
        availability: 'Sur rendez-vous',
    },
    {
        id: '6',
        type: 'OFFER',
        title: 'Musicothérapie - Séances de groupe',
        providerName: 'Sophie Lefèvre',
        providerRating: 4.7,
        providerReviews: 31,
        city: 'Bordeaux',
        description: 'Ateliers musicaux thérapeutiques adaptés à tous les publics. Instruments, chant, écoute active.',
        serviceType: 'WORKSHOP',
        category: 'Musicothérapie',
        basePrice: 180,
        imageUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800',
        tags: ['Musique', 'Groupe', 'Thérapie'],
        duration: '1h30',
        availability: 'Mercredi et samedi',
    },
];

const MOCK_NEEDS = [
    {
        id: '1',
        type: 'NEED',
        title: 'Éducateur(trice) spécialisé(e) pour weekend',
        establishment: 'EHPAD Les Jardins',
        city: 'Lyon 3e',
        description: 'Recherche éducateur(trice) expérimenté(e) pour accompagnement de résidents le weekend. Expérience EHPAD requise. Travail en équipe pluridisciplinaire.',
        urgencyLevel: 'CRITICAL',
        hourlyRate: 25,
        jobTitle: 'Éducateur spécialisé',
        startDate: '2024-12-07',
        isNightShift: false,
        tags: ['EHPAD', 'Weekend', 'Expérimenté'],
        requirements: ['Diplôme DEES', '3 ans d\'expérience', 'Permis B'],
    },
    {
        id: '3',
        type: 'NEED',
        title: 'Aide-soignant(e) de nuit',
        establishment: 'Clinique Saint-Joseph',
        city: 'Marseille',
        description: 'Poste de nuit pour accompagnement des patients en service gériatrique. Equipe bienveillante.',
        urgencyLevel: 'HIGH',
        hourlyRate: 22,
        jobTitle: 'Aide-soignant(e)',
        startDate: '2024-12-08',
        isNightShift: true,
        tags: ['Nuit', 'Gériatrie', 'Clinique'],
        requirements: ['DEAS obligatoire', 'Expérience gériatrie'],
    },
    {
        id: '5',
        type: 'NEED',
        title: 'Intervenant(e) atelier mémoire',
        establishment: 'IME Les Oliviers',
        city: 'Nice',
        description: 'Animation d\'ateliers de stimulation cognitive pour résidents atteints de troubles de la mémoire.',
        urgencyLevel: 'MEDIUM',
        hourlyRate: 28,
        jobTitle: 'Psychomotricien',
        startDate: '2024-12-15',
        isNightShift: false,
        tags: ['Mémoire', 'Cognitif', 'IME'],
        requirements: ['Formation psychomotricité', 'Expérience troubles cognitifs'],
    },
];

function getUrgencyConfig(level: string) {
    switch (level) {
        case 'CRITICAL':
            return { label: 'Urgent', color: 'bg-red-100 text-red-700 border-red-200', icon: Zap };
        case 'HIGH':
            return { label: 'Sous 24h', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Clock };
        case 'MEDIUM':
            return { label: 'Cette semaine', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Calendar };
        default:
            return { label: 'Flexible', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Clock };
    }
}

export default function WallDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { type, id } = params as { type: string; id: string };

    // Find item in mock data
    const isOffer = type === 'offer';
    const item = isOffer 
        ? MOCK_OFFERS.find(o => o.id === id)
        : MOCK_NEEDS.find(n => n.id === id);

    if (!item) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Annonce non trouvée</h1>
                    <p className="text-slate-500 mb-4">Cette annonce n'existe plus ou a été supprimée.</p>
                    <Link href="/" className="text-coral-600 font-medium hover:underline">
                        Retour au Wall
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
                            aria-label="Retour"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </button>
                        <div className="flex-1">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                isOffer ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                                {isOffer ? 'Offre' : 'Besoin'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                                <Share2 className="w-5 h-5 text-slate-600" />
                            </button>
                            <button className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                                <Heart className="w-5 h-5 text-slate-600" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-6">
                {isOffer ? (
                    <OfferDetail item={item as typeof MOCK_OFFERS[0]} />
                ) : (
                    <NeedDetail item={item as typeof MOCK_NEEDS[0]} />
                )}
            </main>
        </div>
    );
}

function OfferDetail({ item }: { item: typeof MOCK_OFFERS[0] }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Image */}
            {item.imageUrl && (
                <div className="relative rounded-2xl overflow-hidden h-64 md:h-80">
                    <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                    />
                    {item.serviceType === 'COACHING_VIDEO' && (
                        <div className="absolute top-4 right-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm text-sm font-medium">
                                <Video className="w-4 h-4 text-orange-500" />
                                En visio
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Main Card */}
            <div className="bg-white rounded-2xl p-6 shadow-soft">
                {/* Provider */}
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-100 to-coral-100 flex items-center justify-center">
                        <span className="text-xl font-bold text-orange-600">
                            {item.providerName.charAt(0)}
                        </span>
                    </div>
                    <div>
                        <h2 className="font-semibold text-slate-900">{item.providerName}</h2>
                        <div className="flex items-center gap-2 text-sm">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                            <span className="font-medium">{item.providerRating}</span>
                            <span className="text-slate-400">({item.providerReviews} avis)</span>
                            <span className="text-slate-300">•</span>
                            <MapPin className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-500">{item.city}</span>
                        </div>
                    </div>
                </div>

                {/* Title & Category */}
                <h1 className="text-2xl font-bold text-slate-900 mb-2">{item.title}</h1>
                {item.category && (
                    <span className="inline-block px-3 py-1 rounded-lg bg-orange-50 text-orange-700 text-sm font-medium mb-4">
                        {item.category}
                    </span>
                )}

                {/* Description */}
                <p className="text-slate-600 leading-relaxed mb-6">{item.description}</p>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-slate-50">
                        <p className="text-xs text-slate-500 mb-1">Tarif</p>
                        <p className="text-xl font-bold text-slate-900">{item.basePrice}€<span className="text-sm font-normal text-slate-500">/séance</span></p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50">
                        <p className="text-xs text-slate-500 mb-1">Durée</p>
                        <p className="text-xl font-bold text-slate-900">{item.duration}</p>
                    </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {item.tags.map((tag, i) => (
                        <span key={i} className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-sm">
                            {tag}
                        </span>
                    ))}
                </div>

                {/* CTA */}
                <div className="flex gap-3">
                    <button className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-coral-500 text-white font-semibold hover:bg-coral-600 transition-colors">
                        <MessageCircle className="w-5 h-5" />
                        Contacter
                    </button>
                    <button className="px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors">
                        <Phone className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

function NeedDetail({ item }: { item: typeof MOCK_NEEDS[0] }) {
    const urgency = getUrgencyConfig(item.urgencyLevel);
    const UrgencyIcon = urgency.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Main Card */}
            <div className="bg-white rounded-2xl p-6 shadow-soft border-l-4 border-blue-500">
                {/* Urgency Badge */}
                <div className="flex items-center gap-3 mb-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${urgency.color}`}>
                        <UrgencyIcon className="w-4 h-4" />
                        {urgency.label}
                    </span>
                    {item.isNightShift && (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium">
                            Poste de nuit
                        </span>
                    )}
                </div>

                {/* Establishment */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-slate-900">{item.establishment}</h2>
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                            <MapPin className="w-4 h-4" />
                            {item.city}
                        </div>
                    </div>
                </div>

                {/* Title & Job */}
                <h1 className="text-2xl font-bold text-slate-900 mb-2">{item.title}</h1>
                <span className="inline-block px-3 py-1 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium mb-4">
                    {item.jobTitle}
                </span>

                {/* Description */}
                <p className="text-slate-600 leading-relaxed mb-6">{item.description}</p>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-slate-50">
                        <p className="text-xs text-slate-500 mb-1">Taux horaire</p>
                        <p className="text-xl font-bold text-slate-900">{item.hourlyRate}€<span className="text-sm font-normal text-slate-500">/h</span></p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50">
                        <p className="text-xs text-slate-500 mb-1">Date de début</p>
                        <p className="text-lg font-bold text-slate-900">{new Date(item.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</p>
                    </div>
                </div>

                {/* Requirements */}
                {item.requirements && (
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-slate-900 mb-3">Prérequis</h3>
                        <ul className="space-y-2">
                            {item.requirements.map((req, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    {req}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {item.tags.map((tag, i) => (
                        <span key={i} className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-sm">
                            {tag}
                        </span>
                    ))}
                </div>

                {/* CTA */}
                <div className="flex gap-3">
                    <button className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors">
                        <Mail className="w-5 h-5" />
                        Postuler
                    </button>
                    <button className="px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors">
                        <Phone className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
