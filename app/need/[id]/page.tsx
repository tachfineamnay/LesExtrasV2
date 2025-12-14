'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { NeedCard } from '@/components/wall';

export default function NeedDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    // Mock single need data
    const mockNeed = {
        id: id,
        type: 'NEED' as const,
        title: 'Éducateur(trice) spécialisé(e) pour weekend',
        establishment: 'EHPAD Les Jardins',
        city: 'Lyon 3e',
        description: 'Recherche éducateur(trice) expérimenté(e) pour accompagnement de résidents le weekend. Expérience souhaitée en gériatrie.',
        urgencyLevel: 'CRITICAL' as const,
        hourlyRate: 25,
        jobTitle: 'Éducateur spécialisé',
        startDate: '2024-12-07',
        isNightShift: false,
        tags: ['EHPAD', 'Weekend', 'Urgent'],
    };

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4 flex items-center justify-center">
            <div className="max-w-md w-full">
                <button onClick={() => router.back()} className="mb-4 text-slate-500 hover:text-slate-700">← Retour</button>
                <NeedCard {...mockNeed} />
            </div>
        </div>
    );
}
