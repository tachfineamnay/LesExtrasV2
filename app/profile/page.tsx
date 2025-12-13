'use client';

import { useState } from 'react';
import { UserProfile, UserProfileData, ProfileContent, ProfileAboutData, MissionHistoryItem, ReviewItem } from '@/components/profile';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    const router = useRouter();
    const [isFavorite, setIsFavorite] = useState(false);

    // TODO: Replace with actual user data from API/auth context
    const isOwnProfile = true; // Determine from auth

    const mockProfile: UserProfileData = {
        id: 'usr_current',
        firstName: 'Marie',
        lastName: 'Dupont',
        email: 'marie.dupont@example.com',
        phone: '06 12 34 56 78',
        avatarUrl: null,
        coverUrl: null,
        headline: 'Éducatrice spécialisée • 10 ans d\'expérience en EHPAD et IME',
        bio: null, // Bio is now in ProfileContent
        city: 'Lyon 3e',
        memberSince: new Date('2022-03-15'),
        isVerified: true,
        role: 'EXTRA',
        stats: {
            averageRating: 4.9,
            totalReviews: 34,
            totalMissions: 47,
            reliabilityRate: 100,
            isAvailable: true,
        },
    };

    // About section data
    const aboutData: ProfileAboutData = {
        bio: 'Passionnée par l\'accompagnement des personnes en situation de handicap. Spécialisée dans l\'autisme et les troubles du comportement. Diplômée DEES avec une certification en musicothérapie. Je m\'adapte aux besoins spécifiques de chaque structure et propose un accompagnement personnalisé.',
        specialties: ['Autisme', 'Petite enfance', 'EHPAD', 'Art-thérapie', 'Troubles du comportement'],
        diplomas: [
            { name: 'DEES (Diplôme d\'État d\'Éducateur Spécialisé)', year: 2014 },
            { name: 'Certification Musicothérapie', year: 2018 },
            { name: 'Formation Autisme - Méthode ABA', year: 2020 },
        ],
        yearsExperience: '10+ ans',
        hourlyRate: 28,
        radiusKm: 30,
        isVideoEnabled: true,
    };

    // Mission history mock data
    const missionsHistory: MissionHistoryItem[] = [
        {
            id: 'm1',
            title: 'Garde de nuit - EHPAD Les Lilas',
            partnerName: 'EHPAD Les Lilas',
            city: 'Lyon 6e',
            date: new Date('2024-12-07'),
            status: 'COMPLETED',
            amount: 224,
        },
        {
            id: 'm2',
            title: 'Accompagnement weekend - IME Soleil',
            partnerName: 'IME Soleil',
            city: 'Villeurbanne',
            date: new Date('2024-12-01'),
            status: 'COMPLETED',
            amount: 336,
        },
        {
            id: 'm3',
            title: 'Atelier Art-thérapie - Résidence Beaumont',
            partnerName: 'Résidence Beaumont',
            city: 'Lyon 3e',
            date: new Date('2024-11-28'),
            status: 'COMPLETED',
            amount: 150,
        },
        {
            id: 'm4',
            title: 'Remplacement éducateur - Foyer Saint-Jean',
            partnerName: 'Foyer Saint-Jean',
            city: 'Lyon 7e',
            date: new Date('2024-11-20'),
            status: 'COMPLETED',
            amount: 280,
        },
        {
            id: 'm5',
            title: 'Animation groupe - Centre Le Phare',
            partnerName: 'Centre Le Phare',
            city: 'Caluire',
            date: new Date('2024-11-15'),
            status: 'COMPLETED',
            amount: 175,
        },
    ];

    // Reviews mock data
    const reviewsData: ReviewItem[] = [
        {
            id: 'r1',
            reviewerName: 'Dr. Sophie Martin',
            reviewerRole: 'Directrice EHPAD Les Lilas',
            rating: 5,
            comment: 'Marie est une professionnelle exceptionnelle. Elle a su créer une relation de confiance avec nos résidents dès le premier jour. Son approche bienveillante et sa patience sont remarquables. Nous ferons appel à elle à nouveau sans hésitation.',
            date: new Date('2024-12-08'),
            isVerifiedMission: true,
            missionTitle: 'Garde de nuit - EHPAD Les Lilas',
            helpfulCount: 12,
        },
        {
            id: 'r2',
            reviewerName: 'Thomas Durand',
            reviewerRole: 'Chef de service IME Soleil',
            rating: 5,
            comment: 'Intervention de grande qualité. Marie s\'est parfaitement intégrée à l\'équipe et a su gérer les situations complexes avec professionnalisme. Les enfants l\'ont beaucoup appréciée.',
            date: new Date('2024-12-02'),
            isVerifiedMission: true,
            missionTitle: 'Accompagnement weekend - IME Soleil',
            response: 'Merci beaucoup Thomas ! C\'est toujours un plaisir de travailler avec votre équipe. Les enfants sont formidables.',
            responseDate: new Date('2024-12-03'),
            helpfulCount: 8,
        },
        {
            id: 'r3',
            reviewerName: 'Claire Petit',
            reviewerRole: 'Coordinatrice Résidence Beaumont',
            rating: 4,
            comment: 'Très bonne animation de l\'atelier art-thérapie. Les résidents ont passé un excellent moment. Marie est créative et sait s\'adapter aux différents niveaux.',
            date: new Date('2024-11-29'),
            isVerifiedMission: true,
            missionTitle: 'Atelier Art-thérapie',
            helpfulCount: 5,
        },
        {
            id: 'r4',
            reviewerName: 'Jean-Pierre Moreau',
            reviewerRole: 'Directeur Foyer Saint-Jean',
            rating: 5,
            comment: 'Excellente professionnelle, ponctuelle et très impliquée. Elle a su gérer le service avec autonomie pendant l\'absence de notre éducateur. Je recommande vivement.',
            date: new Date('2024-11-22'),
            isVerifiedMission: true,
            missionTitle: 'Remplacement éducateur',
        },
    ];

    const handlePrimaryAction = () => {
        router.push('/dashboard/relief');
    };

    const handleMessage = () => {
        router.push('/messages');
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${mockProfile.firstName} ${mockProfile.lastName} - Les Extras`,
                    url: window.location.href,
                });
            } catch (err) {
                // User cancelled share
            }
        } else {
            await navigator.clipboard.writeText(window.location.href);
            alert('Lien copié dans le presse-papier');
        }
    };

    const handleEditCover = () => {
        console.log('Edit cover');
    };

    const handleEditAvatar = () => {
        console.log('Edit avatar');
    };

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Profile Header Card */}
                <UserProfile
                    profile={mockProfile}
                    isOwnProfile={isOwnProfile}
                    isFavorite={isFavorite}
                    onPrimaryAction={handlePrimaryAction}
                    onMessage={handleMessage}
                    onFavoriteToggle={() => setIsFavorite(!isFavorite)}
                    onShare={handleShare}
                    onEditCover={handleEditCover}
                    onEditAvatar={handleEditAvatar}
                />

                {/* Profile Content Tabs */}
                <ProfileContent
                    role={mockProfile.role}
                    userName={mockProfile.firstName}
                    isOwnProfile={isOwnProfile}
                    about={aboutData}
                    missions={missionsHistory}
                    reviews={reviewsData}
                    averageRating={mockProfile.stats.averageRating}
                    totalReviews={mockProfile.stats.totalReviews}
                    onEmptyAction={(type) => {
                        if (type === 'missions') router.push('/dashboard/relief');
                        if (type === 'reviews') router.push('/profile');
                    }}
                />

                {/* Additional Sections for Own Profile */}
                {isOwnProfile && (
                    <div className="bg-white rounded-2xl shadow-soft p-6 border border-slate-100">
                        <h3 className="font-semibold text-slate-900 mb-4">
                            Actions rapides
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => router.push('/dashboard/relief')}
                                className="p-4 rounded-xl bg-coral-50 text-coral-700 text-sm font-medium hover:bg-coral-100 transition-colors text-left"
                            >
                                Trouver une mission
                            </button>
                            <button 
                                onClick={() => router.push('/messages')}
                                className="p-4 rounded-xl bg-slate-50 text-slate-700 text-sm font-medium hover:bg-slate-100 transition-colors text-left"
                            >
                                Voir mes messages
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
