import { Metadata } from 'next';
import { WallFeedClient } from '@/components/wall/WallFeedClient';

export const metadata: Metadata = {
    title: 'Les Extras - Le Wall | Offres & Besoins Médico-Social',
    description: 'La plateforme de mise en relation médico-sociale. Trouvez votre prochaine mission ou prestataire en temps réel.',
    openGraph: {
        title: 'Les Extras - Le Wall',
        description: 'Plateforme de mise en relation médico-sociale B2B2C',
        type: 'website',
    },
};

const getApiBase = () => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:4000';
    const normalized = apiBase.replace(/\/+$/, '');
    return normalized.endsWith('/api/v1') ? normalized : `${normalized}/api/v1`;
};

type InitialFeed = {
    items: any[];
    nextCursor: string | null;
    hasNextPage: boolean;
};

async function getInitialFeed(): Promise<InitialFeed> {
    try {
        const response = await fetch(`${getApiBase()}/wall/feed`, { cache: 'no-store' });
        if (!response.ok) return { items: [], nextCursor: null, hasNextPage: false };

        const data = await response.json();
        const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
        const nextCursor = typeof data?.pageInfo?.nextCursor === 'string' ? data.pageInfo.nextCursor : null;
        const hasNextPage = Boolean(data?.pageInfo?.hasNextPage);
        return { items, nextCursor, hasNextPage };
    } catch {
        return { items: [], nextCursor: null, hasNextPage: false };
    }
}

export default async function HomePage() {
    const feed = await getInitialFeed();

    return (
        <WallFeedClient
            initialData={feed.items}
            initialNextCursor={feed.nextCursor}
            initialHasNextPage={feed.hasNextPage}
            talentPool={[]}
            activity={[]}
        />
    );
}
