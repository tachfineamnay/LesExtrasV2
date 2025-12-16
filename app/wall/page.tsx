import { Metadata } from 'next';
import { WallFeedClient } from '@/components/wall/WallFeedClient';

export const metadata: Metadata = {
    title: 'Le Wall - Les Extras | Offres & Besoins Médico-Social',
    description: 'Découvrez les dernières offres de professionnels et besoins d\'établissements du secteur médico-social.',
    openGraph: {
        title: 'Le Wall - Les Extras',
        description: 'Plateforme de mise en relation médico-sociale B2B2C',
        type: 'website',
    },
};

const getApiBase = () => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:4000';
    const normalized = apiBase.replace(/\/+$/, '');
    return normalized.endsWith('/api/v1') ? normalized : `${normalized}/api/v1`;
};

async function getInitialFeed(): Promise<any[]> {
    try {
        const response = await fetch(`${getApiBase()}/wall/feed`, { cache: 'no-store' });
        if (!response.ok) return [];

        const data = await response.json();
        if (Array.isArray(data?.items)) return data.items;
        if (Array.isArray(data)) return data;
        return [];
    } catch {
        return [];
    }
}

export default async function WallPage() {
    const feed = await getInitialFeed();

    return (
        <WallFeedClient
            initialData={feed}
            talentPool={[]}
            activity={[]}
        />
    );
}
