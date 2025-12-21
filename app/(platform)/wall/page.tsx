import { Metadata } from 'next';
import { WallFeedClient } from '@/components/wall/WallFeedClient';

// ===========================================
// SOCIOPULSE WALL EXPERIENCE - Wall Page
// Redirect from /wall to homepage
// ===========================================

export const metadata: Metadata = {
    title: 'Sociopulse - La plateforme du médico-social | Renfort & SocioLive',
    description: 'La plateforme de mise en relation médico-sociale. Un renfort demain, une visio ou un atelier maintenant. Trouvez votre mission ou expert en temps réel.',
    keywords: 'renfort médico-social, interim social, SocioLive, atelier, EHPAD, IDE, aide-soignant, éducateur',
    openGraph: {
        title: 'Sociopulse - La plateforme du médico-social',
        description: 'La plateforme de mise en relation médico-sociale B2B2C. Missions de renfort et services SocioLive.',
        type: 'website',
        siteName: 'Sociopulse',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Sociopulse - La plateforme du médico-social',
        description: 'Un renfort demain. Une Visio ou un Atelier maintenant.',
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
        const response = await fetch(`${getApiBase()}/wall/feed`, {
            cache: 'no-store',
            next: { revalidate: 0 }
        });
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

export default async function WallPage() {
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
