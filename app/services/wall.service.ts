'use client';

export type WallFeedParams = Record<string, string | number | boolean | undefined | null>;

export interface CreatePostPayload {
    type: 'OFFER' | 'NEED';
    title: string;
    content: string;
    city?: string;
    postalCode?: string;
    tags?: string[];
    category?: string;
    validUntil?: string;
}

const getApiBase = () => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:4000';
    const normalized = apiBase.replace(/\/+$/, '');
    return normalized.endsWith('/api/v1') ? normalized : `${normalized}/api/v1`;
};

export async function getFeed(params: WallFeedParams = {}) {
    const search = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        search.set(key, String(value));
    });

    const url = `${getApiBase()}/wall/feed${search.toString() ? `?${search.toString()}` : ''}`;

    try {
        const response = await fetch(url, { cache: 'no-store' });

        if (!response.ok) {
            throw new Error(`getFeed failed with status ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('getFeed error:', error);
        return { items: [] };
    }
}

export async function createPost(payload: CreatePostPayload) {
    const url = `${getApiBase()}/wall/posts`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        cache: 'no-store',
    });

    if (!response.ok) {
        throw new Error(`createPost failed with status ${response.status}`);
    }

    return response.json();
}

// Helper to map API items to FeedItem format
export function mapApiItemToFeedItem(item: any): any {
    if (!item) return null;

    const authorId = item.authorId || item?.author?.id || undefined;
    const normalizedTags = Array.isArray(item.tags) ? item.tags.filter(Boolean) : [];

    // Helper for date conversion
    const toIsoString = (value: any) => {
        if (!value) return new Date().toISOString();
        const date = typeof value === 'string' ? new Date(value) : value;
        return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
    };

    if (item.type === 'MISSION' || item.postType === 'NEED' || item.type === 'NEED') {
        const startDate = item.validUntil || item.startDate;
        return {
            id: item.id,
            authorId,
            type: 'NEED',
            title: item.title || 'Annonce',
            establishment: item.establishment || item.authorName || 'Établissement',
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
}
