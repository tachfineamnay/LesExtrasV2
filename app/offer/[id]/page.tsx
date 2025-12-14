'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { OfferCard } from '@/components/wall';

export default function OfferDetailPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const router = useRouter();

    // Mock single offer data
    // In production, fetch by ID
    const mockOffer = {
        id: id,
        type: 'OFFER' as const,
        title: 'Coaching Sport Adapté en Visio',
        providerName: 'Thomas Martin',
        providerRating: 4.9,
        providerReviews: 47,
        city: 'Toulouse',
        description: 'Séances de sport adapté en visioconférence. Programme personnalisé selon vos besoins et objectifs.',
        serviceType: 'COACHING_VIDEO' as const,
        category: 'Sport adapté',
        basePrice: 45,
        imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400',
        tags: ['Visio', 'Sport', 'Bien-être'],
    };

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4 flex items-center justify-center">
            <div className="max-w-md w-full">
                <button onClick={() => router.back()} className="mb-4 text-slate-500 hover:text-slate-700">← Retour</button>
                <OfferCard {...mockOffer} />
            </div>
        </div>
    );
}
