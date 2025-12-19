import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { GetFeedDto, FeedItemType, CreatePostDto, CreateServiceDto } from './dto';
import { Prisma, Post, ReliefMission, User, Profile, Establishment, Service, PostType, PostCategory, ServiceType, MissionStatus } from '@prisma/client';

type DecodedFeedCursor = {
    createdAt: Date;
    skip: {
        postIds: string[];
        serviceIds: string[];
        missionIds: string[];
    };
};

interface FeedItem {
    id: string;
    type: 'POST' | 'MISSION' | 'SERVICE';
    title: string;
    name?: string;
    content: string;
    authorId: string;
    authorName: string;
    authorAvatar: string | null;
    authorRole: string;
    city: string | null;
    postalCode: string | null;
    tags: string[];
    category: string | null;
    createdAt: Date;
    validUntil: Date | null;
    // Mission-specific fields
    urgencyLevel?: string;
    hourlyRate?: number;
    status?: string;
    client?: (User & { profile: Profile | null; establishment: Establishment | null }) | null;
    // Post-specific fields
    postType?: string;
    viewCount?: number;
    mediaUrls?: string[];
    // Service-specific fields
    basePrice?: number | null;
    serviceType?: string | null;
    providerRating?: number | null;
    providerReviews?: number | null;
    imageUrl?: string | null;
    profile?: Profile | null;
}

interface PaginatedFeedResult {
    items: FeedItem[];
    pageInfo: {
        limit: number;
        hasNextPage: boolean;
        nextCursor: string | null;
    };
}

@Injectable()
export class WallFeedService {
    private readonly logger = new Logger(WallFeedService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Get mixed feed of Posts, Services and ReliefMissions
     * Returns chronologically sorted items based on filters
     */
    async getFeed(filters: GetFeedDto): Promise<PaginatedFeedResult> {
        const {
            type = FeedItemType.ALL,
            cursor: cursorRaw,
            city,
            postalCode,
            tags,
            category,
            search,
            latitude,
            longitude,
            radiusKm = 50,
            limit = 20,
        } = filters;

        const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
        const take = safeLimit + 1;
        const decodedCursor = this.decodeFeedCursor(cursorRaw);

        const normalizedSearch = search?.trim() || undefined;
        const normalizedCategory = category?.trim() || undefined;
        const normalizedCity = city?.trim() || undefined;
        const normalizedPostalCode = postalCode?.trim() || undefined;
        const normalizedTags = Array.isArray(tags)
            ? tags
                .filter((t): t is string => typeof t === 'string')
                .map((t) => t.trim())
                .filter(Boolean)
            : undefined;

        try {
            const shouldFetchPosts = type === FeedItemType.ALL || type === FeedItemType.POST;
            const shouldFetchServices = type === FeedItemType.ALL || type === FeedItemType.SERVICE;
            const shouldFetchMissions = type === FeedItemType.ALL || type === FeedItemType.MISSION;

            const [posts, services, missions] = await Promise.all([
                shouldFetchPosts
                    ? this.prisma.post.findMany({
                        where: this.buildPostWhere({
                            cursor: decodedCursor,
                            search: normalizedSearch,
                            category: normalizedCategory,
                            city: normalizedCity,
                            postalCode: normalizedPostalCode,
                            tags: normalizedTags,
                        }),
                        include: {
                            author: { include: { profile: true, establishment: true } },
                        },
                        orderBy: { createdAt: 'desc' },
                        take,
                    })
                    : Promise.resolve([]),
                shouldFetchServices
                    ? this.prisma.service.findMany({
                        where: this.buildServiceWhere({
                            cursor: decodedCursor,
                            search: normalizedSearch,
                            category: normalizedCategory,
                            city: normalizedCity,
                            postalCode: normalizedPostalCode,
                            tags: normalizedTags,
                        }),
                        include: {
                            profile: { include: { user: true } },
                        },
                        orderBy: { createdAt: 'desc' },
                        take,
                    })
                    : Promise.resolve([]),
                shouldFetchMissions
                    ? this.prisma.reliefMission.findMany({
                        where: this.buildMissionWhere({
                            cursor: decodedCursor,
                            search: normalizedSearch,
                            category: normalizedCategory,
                            city: normalizedCity,
                            postalCode: normalizedPostalCode,
                            tags: normalizedTags,
                        }),
                        include: {
                            client: { include: { profile: true, establishment: true } },
                        },
                        orderBy: { createdAt: 'desc' },
                        take,
                    })
                    : Promise.resolve([]),
            ]);

            const merged: FeedItem[] = [
                ...posts.map((post) => this.mapPostToFeedItem(post)),
                ...services.map((service) => this.mapServiceToFeedItem(service)),
                ...missions.map((mission) => this.mapMissionToFeedItem(mission)),
            ];

            merged.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

            const distanceFiltered =
                latitude && longitude
                    ? this.filterByDistance(merged, latitude, longitude, radiusKm)
                    : merged;

            const pageItems = distanceFiltered.slice(0, safeLimit);
            const hasNextPage = distanceFiltered.length > safeLimit;

            const nextCursor = hasNextPage && pageItems.length > 0
                ? this.encodeNextCursor(pageItems, decodedCursor)
                : null;

            return {
                items: pageItems,
                pageInfo: {
                    limit: safeLimit,
                    hasNextPage,
                    nextCursor,
                },
            };
        } catch (error) {
            this.logger.error(`getFeed failed: ${error.message}`, error.stack);
            throw new InternalServerErrorException('Erreur lors de la récupération du fil');
        }
    }

    /**
     * Create a booking from a service
     */
    async createBooking(clientId: string, payload: {
        serviceId: string;
        date: string;
        startTime: string;
        duration: number;
        message?: string;
    }) {
        try {
            const service = await this.prisma.service.findUnique({
                where: { id: payload.serviceId },
                include: { profile: true },
            });

            if (!service || !service.profile?.userId) {
                throw new NotFoundException('Service non trouvé');
            }

            const sessionDate = new Date(payload.date);
            const duration = Number(payload.duration) || 1;
            const pricePerHour = service.basePrice ?? service.profile.hourlyRate ?? 0;
            const totalPrice = Number(pricePerHour) * duration;

            const booking = await this.prisma.booking.create({
                data: {
                    clientId,
                    providerId: service.profile.userId,
                    serviceId: service.id,
                    sessionDate,
                    sessionTime: payload.startTime,
                    totalPrice,
                    clientNotes: payload.message,
                    isVideoSession: service.type === 'COACHING_VIDEO',
                },
            });

            return booking;
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            this.logger.error(`createBooking failed: ${error.message}`);
            throw new InternalServerErrorException('Erreur lors de la création de la réservation');
        }
    }

    async getUserBookings(userId: string) {
        try {
            const bookings = await this.prisma.booking.findMany({
                where: {
                    OR: [
                        { clientId: userId },
                        { providerId: userId },
                    ],
                },
                include: {
                    service: { select: { name: true, imageUrl: true, type: true } },
                    provider: {
                        include: {
                            profile: { select: { firstName: true, lastName: true, avatarUrl: true, city: true } },
                        },
                    },
                    client: {
                        include: {
                            profile: { select: { firstName: true, lastName: true, avatarUrl: true } },
                            establishment: { select: { name: true, city: true } },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });

            return bookings.map(booking => ({
                id: booking.id,
                title: booking.service?.name || 'Réservation',
                partnerName: booking.clientId === userId
                    ? `${booking.provider?.profile?.firstName || ''} ${booking.provider?.profile?.lastName || ''}`.trim() || 'Prestataire'
                    : booking.client?.establishment?.name || `${booking.client?.profile?.firstName || ''} ${booking.client?.profile?.lastName || ''}`.trim() || 'Client',
                partnerAvatar: booking.clientId === userId
                    ? booking.provider?.profile?.avatarUrl
                    : booking.client?.profile?.avatarUrl,
                date: booking.sessionDate,
                time: booking.sessionTime || '09:00',
                duration: '1h',
                location: booking.clientId === userId
                    ? booking.provider?.profile?.city || 'Non précisé'
                    : booking.client?.establishment?.city || 'Non précisé',
                price: booking.totalPrice,
                status: booking.status,
                isVideoSession: booking.isVideoSession,
                videoRoomId: booking.videoRoomId,
            }));
        } catch (error) {
            this.logger.error(`getUserBookings failed: ${error.message}`);
            throw new InternalServerErrorException('Erreur lors de la récupération des réservations');
        }
    }

    /**
     * Create a new post
     */
    async createPost(authorId: string, dto: CreatePostDto): Promise<FeedItem> {
        try {
            if (!dto.ethicsConfirmed) {
                throw new BadRequestException('La validation éthique est obligatoire.');
            }

            const normalizedContent = dto.content?.trim();
            if (!normalizedContent) {
                throw new BadRequestException('Le contenu du post est requis.');
            }

            const normalizedTitle = dto.title?.trim();
            const prefix = dto.category === PostCategory.EXPERIENCE ? 'Expérience' : 'Actu';
            const snippet = normalizedContent.replace(/\s+/g, ' ').slice(0, 60);
            const title = normalizedTitle || `${prefix}: ${snippet}${normalizedContent.length > 60 ? '…' : ''}`;

            const post = await this.prisma.post.create({
                data: {
                    authorId,
                    type: PostType.SOCIAL,
                    title,
                    content: normalizedContent,
                    city: dto.city,
                    postalCode: dto.postalCode,
                    tags: dto.tags || [],
                    category: dto.category,
                    mediaUrls: dto.mediaUrls || [],
                    validUntil: null,
                },
                include: {
                    author: {
                        include: { profile: true, establishment: true },
                    },
                },
            });

            this.logger.log(`Post created: ${post.id} by user ${authorId}`);

            return this.mapPostToFeedItem(post);
        } catch (error) {
            this.logger.error(`createPost failed: ${error.message}`, error.stack);
            throw new InternalServerErrorException('Erreur lors de la création du post');
        }
    }

    /**
     * Get a single post by ID
     */
    async getPost(postId: string): Promise<FeedItem> {
        try {
            const post = await this.prisma.post.findUnique({
                where: { id: postId },
                include: {
                    author: {
                        include: { profile: true, establishment: true },
                    },
                },
            });

            if (!post) {
                throw new NotFoundException(`Post ${postId} non trouvé`);
            }

            // Increment view count
            await this.prisma.post.update({
                where: { id: postId },
                data: { viewCount: { increment: 1 } },
            });

            return this.mapPostToFeedItem(post);
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            this.logger.error(`getPost failed: ${error.message}`);
            throw new InternalServerErrorException('Erreur lors de la récupération');
        }
    }

    /**
     * Get a single service by ID with profile/user
     */
    async getServiceById(serviceId: string) {
        try {
            const service = await this.prisma.service.findUnique({
                where: { id: serviceId },
                include: {
                    profile: {
                        include: {
                            user: true,
                        },
                    },
                },
            });

            if (!service) {
                throw new NotFoundException(`Service ${serviceId} non trouvé`);
            }

            return service;
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            this.logger.error(`getServiceById failed: ${error.message}`);
            throw new InternalServerErrorException('Erreur lors de la récupération du service');
        }
    }

    /**
     * Create a new service (Offer) for EXTRA users
     */
    async createService(userId: string, userRole: string, dto: CreateServiceDto) {
        try {
            if (userRole !== 'EXTRA') {
                throw new ForbiddenException('Seuls les profils EXTRA peuvent créer une offre.');
            }

            const name = dto.name?.trim();
            if (!name) {
                throw new BadRequestException('Le nom du service est requis.');
            }

            const profile = await this.prisma.profile.findUnique({
                where: { userId },
            });

            if (!profile) {
                throw new BadRequestException('Profil EXTRA requis pour créer une offre.');
            }

            const slug = await this.generateUniqueServiceSlug(name);

            const service = await this.prisma.service.create({
                data: {
                    profileId: profile.id,
                    name,
                    slug,
                    shortDescription: dto.shortDescription?.trim() || null,
                    description: dto.description?.trim() || null,
                    type: dto.type ?? ServiceType.WORKSHOP,
                    category: dto.category?.trim() || null,
                    basePrice: dto.basePrice ?? null,
                    imageUrl: dto.imageUrl?.trim() || null,
                    galleryUrls: dto.galleryUrls || [],
                    tags: dto.tags || [],
                    isActive: true,
                },
                include: {
                    profile: {
                        include: { user: true },
                    },
                },
            });

            this.logger.log(`Service created: ${service.id} by user ${userId}`);

            return service;
        } catch (error) {
            if (error instanceof BadRequestException || error instanceof ForbiddenException) throw error;
            this.logger.error(`createService failed: ${error.message}`, error.stack);
            throw new InternalServerErrorException('Erreur lors de la création du service');
        }
    }

    /**
     * Delete a post
     */
    async deletePost(postId: string, userId: string): Promise<void> {
        try {
            const post = await this.prisma.post.findUnique({
                where: { id: postId },
            });

            if (!post) {
                throw new NotFoundException(`Post ${postId} non trouvé`);
            }

            if (post.authorId !== userId) {
                throw new Error('Non autorisé à supprimer ce post');
            }

            await this.prisma.post.delete({
                where: { id: postId },
            });

            this.logger.log(`Post deleted: ${postId}`);
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            throw new InternalServerErrorException('Erreur lors de la suppression');
        }
    }

    // ==================== Private Helper Methods ====================

    private asStringArray(value: Prisma.JsonValue): string[] {
        if (!Array.isArray(value)) return [];
        return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
    }

    private uniqueStrings(values: string[]): string[] {
        return Array.from(new Set(values.filter(Boolean)));
    }

    private decodeFeedCursor(raw?: string): DecodedFeedCursor | null {
        if (!raw || typeof raw !== 'string') return null;

        try {
            const json = Buffer.from(raw, 'base64').toString('utf8');
            const parsed: unknown = JSON.parse(json);

            if (!parsed || typeof parsed !== 'object') return null;

            const record = parsed as Record<string, unknown>;
            const createdAtRaw = record['createdAt'];
            if (typeof createdAtRaw !== 'string') return null;

            const createdAt = new Date(createdAtRaw);
            if (Number.isNaN(createdAt.getTime())) return null;

            const skipRaw = record['skip'];
            const skipRecord = skipRaw && typeof skipRaw === 'object' ? (skipRaw as Record<string, unknown>) : {};

            const toStringArray = (value: unknown) =>
                Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];

            return {
                createdAt,
                skip: {
                    postIds: toStringArray(skipRecord['postIds']),
                    serviceIds: toStringArray(skipRecord['serviceIds']),
                    missionIds: toStringArray(skipRecord['missionIds']),
                },
            };
        } catch {
            return null;
        }
    }

    private encodeNextCursor(items: FeedItem[], previous: DecodedFeedCursor | null): string {
        const lastItem = items[items.length - 1];
        const createdAt = lastItem.createdAt;

        const boundaryItems = items.filter((item) => item.createdAt.getTime() === createdAt.getTime());

        const skip = {
            postIds: boundaryItems.filter((item) => item.type === 'POST').map((item) => item.id),
            serviceIds: boundaryItems.filter((item) => item.type === 'SERVICE').map((item) => item.id),
            missionIds: boundaryItems.filter((item) => item.type === 'MISSION').map((item) => item.id),
        };

        const mergedSkip =
            previous && previous.createdAt.getTime() === createdAt.getTime()
                ? {
                    postIds: this.uniqueStrings([...previous.skip.postIds, ...skip.postIds]),
                    serviceIds: this.uniqueStrings([...previous.skip.serviceIds, ...skip.serviceIds]),
                    missionIds: this.uniqueStrings([...previous.skip.missionIds, ...skip.missionIds]),
                }
                : skip;

        const payload = {
            createdAt: createdAt.toISOString(),
            skip: mergedSkip,
        };

        return Buffer.from(JSON.stringify(payload)).toString('base64');
    }

    private buildPostWhere(filters: {
        cursor: DecodedFeedCursor | null;
        search?: string;
        category?: string;
        city?: string;
        postalCode?: string;
        tags?: string[];
    }): Prisma.PostWhereInput {
        const { cursor, search, category, city, postalCode, tags } = filters;
        const and: Prisma.PostWhereInput[] = [
            {
                OR: [
                    { validUntil: null },
                    { validUntil: { gte: new Date() } },
                ],
            },
        ];

        if (city) {
            and.push({ city: { contains: city, mode: 'insensitive' } });
        }

        if (postalCode) {
            and.push({ postalCode: { startsWith: postalCode } });
        }

        if (search) {
            and.push({
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { content: { contains: search, mode: 'insensitive' } },
                ],
            });
        }

        if (category) {
            const upper = category.toUpperCase();
            const postCategory = (Object.values(PostCategory) as string[]).includes(upper)
                ? (upper as PostCategory)
                : null;

            and.push({
                OR: [
                    ...(postCategory ? [{ category: postCategory }] : []),
                    { title: { contains: category, mode: 'insensitive' } },
                    { content: { contains: category, mode: 'insensitive' } },
                    { tags: { array_contains: [category] } },
                ],
            });
        }

        if (tags && tags.length > 0) {
            and.push({
                OR: tags.map((tag) => ({ tags: { array_contains: [tag] } })),
            });
        }

        if (cursor) {
            and.push({
                OR: [
                    { createdAt: { lt: cursor.createdAt } },
                    {
                        AND: [
                            { createdAt: cursor.createdAt },
                            { id: { notIn: cursor.skip.postIds } },
                        ],
                    },
                ],
            });
        }

        return {
            isActive: true,
            type: PostType.SOCIAL,
            AND: and,
        };
    }

    private buildServiceWhere(filters: {
        cursor: DecodedFeedCursor | null;
        search?: string;
        category?: string;
        city?: string;
        postalCode?: string;
        tags?: string[];
    }): Prisma.ServiceWhereInput {
        const { cursor, search, category, city, postalCode, tags } = filters;
        const and: Prisma.ServiceWhereInput[] = [];

        if (city || postalCode) {
            const profileWhere: Prisma.ProfileWhereInput = {};
            if (city) profileWhere.city = { contains: city, mode: 'insensitive' };
            if (postalCode) profileWhere.postalCode = { startsWith: postalCode };
            and.push({ profile: profileWhere });
        }

        if (search) {
            and.push({
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                    { shortDescription: { contains: search, mode: 'insensitive' } },
                    { category: { contains: search, mode: 'insensitive' } },
                ],
            });
        }

        if (category) {
            const upper = category.toUpperCase();
            const serviceType = (Object.values(ServiceType) as string[]).includes(upper)
                ? (upper as ServiceType)
                : null;

            and.push({
                OR: [
                    ...(serviceType ? [{ type: serviceType }] : []),
                    { category: { contains: category, mode: 'insensitive' } },
                    { tags: { array_contains: [category] } },
                ],
            });
        }

        if (tags && tags.length > 0) {
            and.push({
                OR: tags.map((tag) => ({ tags: { array_contains: [tag] } })),
            });
        }

        if (cursor) {
            and.push({
                OR: [
                    { createdAt: { lt: cursor.createdAt } },
                    {
                        AND: [
                            { createdAt: cursor.createdAt },
                            { id: { notIn: cursor.skip.serviceIds } },
                        ],
                    },
                ],
            });
        }

        return {
            isActive: true,
            AND: and.length > 0 ? and : undefined,
        };
    }

    private buildMissionWhere(filters: {
        cursor: DecodedFeedCursor | null;
        search?: string;
        category?: string;
        city?: string;
        postalCode?: string;
        tags?: string[];
    }): Prisma.ReliefMissionWhereInput {
        const { cursor, search, category, city, postalCode, tags } = filters;
        const and: Prisma.ReliefMissionWhereInput[] = [];

        if (city) {
            and.push({ city: { contains: city, mode: 'insensitive' } });
        }

        if (postalCode) {
            and.push({ postalCode: { startsWith: postalCode } });
        }

        if (search) {
            and.push({
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                    { jobTitle: { contains: search, mode: 'insensitive' } },
                ],
            });
        }

        if (category) {
            and.push({
                OR: [
                    { jobTitle: { contains: category, mode: 'insensitive' } },
                    { requiredSkills: { array_contains: [category] } },
                ],
            });
        }

        if (tags && tags.length > 0) {
            and.push({
                OR: tags.map((tag) => ({ requiredSkills: { array_contains: [tag] } })),
            });
        }

        if (cursor) {
            and.push({
                OR: [
                    { createdAt: { lt: cursor.createdAt } },
                    {
                        AND: [
                            { createdAt: cursor.createdAt },
                            { id: { notIn: cursor.skip.missionIds } },
                        ],
                    },
                ],
            });
        }

        return {
            status: MissionStatus.OPEN,
            startDate: { gte: new Date() },
            AND: and.length > 0 ? and : undefined,
        };
    }

    private slugify(value: string): string {
        const normalized = value
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '')
            .toLowerCase()
            .trim();

        const slug = normalized
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        return slug || 'service';
    }

    private async generateUniqueServiceSlug(name: string): Promise<string> {
        const base = this.slugify(name);
        let candidate = base;

        for (let attempt = 0; attempt < 50; attempt += 1) {
            const exists = await this.prisma.service.findUnique({
                where: { slug: candidate },
                select: { id: true },
            });

            if (!exists) return candidate;
            candidate = `${base}-${attempt + 1}`;
        }

        return `${base}-${Date.now()}`;
    }

    private buildLocationFilter(city?: string, postalCode?: string): Prisma.PostWhereInput | undefined {
        const filter: Prisma.PostWhereInput = {};

        if (city) {
            filter.city = { contains: city, mode: 'insensitive' };
        }

        if (postalCode) {
            filter.postalCode = { startsWith: postalCode };
        }

        return Object.keys(filter).length > 0 ? filter : undefined;
    }

    private async fetchPosts(options: {
        locationFilter?: Prisma.PostWhereInput;
        tags?: string[];
        category?: string;
        search?: string;
        skip: number;
        take: number;
    }) {
        const { locationFilter, tags, category, search, skip, take } = options;
        const andConditions: Prisma.PostWhereInput[] = [];

        const where: Prisma.PostWhereInput = {
            isActive: true,
            AND: [
                {
                    OR: [
                        { validUntil: null },
                        { validUntil: { gte: new Date() } },
                    ],
                },
            ],
        };

        if (locationFilter) {
            andConditions.push(locationFilter);
        }

        if (search) {
            andConditions.push({
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { content: { contains: search, mode: 'insensitive' } },
                ],
            });
        }

        if (category) {
            const normalizedCategory = category.trim();
            const upper = normalizedCategory.toUpperCase();
            const possiblePostType = ['OFFER', 'NEED'].includes(normalizedCategory.toUpperCase())
                ? normalizedCategory.toUpperCase()
                : undefined;
            const possiblePostCategory = (Object.values(PostCategory) as string[]).includes(upper)
                ? (upper as PostCategory)
                : undefined;

            andConditions.push({
                OR: [
                    ...(possiblePostCategory ? [{ category: possiblePostCategory }] : []),
                    { title: { contains: normalizedCategory, mode: 'insensitive' } },
                    { content: { contains: normalizedCategory, mode: 'insensitive' } },
                    { tags: { array_contains: [normalizedCategory] } },
                    ...(possiblePostType ? [{ type: possiblePostType as any }] : []),
                ],
            });
        }

        // Tags filtering using JSON contains
        if (tags && tags.length > 0) {
            andConditions.push({
                OR: tags.map((tag) => ({ tags: { array_contains: [tag] } })),
            });
        }

        if (andConditions.length > 0) {
            const existingAnd = Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : [];
            where.AND = [...existingAnd, ...andConditions];
        }

        const [posts, count] = await Promise.all([
            this.prisma.post.findMany({
                where,
                include: {
                    author: {
                        include: { profile: true, establishment: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take,
            }),
            this.prisma.post.count({ where }),
        ]);

        return {
            posts: posts.map((post) => this.mapPostToFeedItem(post)),
            count,
        };
    }

    private async fetchMissions(options: {
        locationFilter?: Prisma.ReliefMissionWhereInput;
        tags?: string[];
        category?: string;
        search?: string;
        skip: number;
        take: number;
    }) {
        const { locationFilter, tags, category, search, skip, take } = options;
        const andConditions: Prisma.ReliefMissionWhereInput[] = [];

        const where: Prisma.ReliefMissionWhereInput = {
            status: 'OPEN',
            startDate: { gte: new Date() },
            AND: [],
        };

        if (locationFilter) {
            andConditions.push(locationFilter);
        }

        if (search) {
            andConditions.push({
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                    { jobTitle: { contains: search, mode: 'insensitive' } },
                ],
            });
        }

        if (category) {
            const normalizedCategory = category.trim();
            andConditions.push({
                OR: [
                    { requiredSkills: { has: normalizedCategory } as any },
                    { jobTitle: { contains: normalizedCategory, mode: 'insensitive' } },
                ],
            });
        }

        if (tags && tags.length > 0) {
            andConditions.push({ requiredSkills: { hasSome: tags } as any });
        }

        if (andConditions.length > 0) {
            const existingAnd = Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : [];
            where.AND = [...existingAnd, ...andConditions];
        }

        const [missions, count] = await Promise.all([
            this.prisma.reliefMission.findMany({
                where,
                include: {
                    client: {
                        include: {
                            profile: true,
                            establishment: true,
                        },
                    },
                },
                orderBy: [
                    { urgencyLevel: 'desc' },
                    { createdAt: 'desc' },
                ],
                skip,
                take,
            }),
            this.prisma.reliefMission.count({ where }),
        ]);

        return {
            missions: missions.map((mission) => this.mapMissionToFeedItem(mission)),
            count,
        };
    }

    private async fetchServices(options: {
        tags?: string[];
        category?: string;
        search?: string;
        skip: number;
        take: number;
    }) {
        const { tags, category, search, skip, take } = options;
        const andConditions: Prisma.ServiceWhereInput[] = [];

        const where: Prisma.ServiceWhereInput = {
            isActive: true,
            AND: [],
        };

        if (search) {
            andConditions.push({
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                    { shortDescription: { contains: search, mode: 'insensitive' } },
                ],
            });
        }

        if (category) {
            const normalizedCategory = category.trim();
            const possibleServiceType = ['WORKSHOP', 'COACHING_VIDEO'].includes(normalizedCategory.toUpperCase())
                ? normalizedCategory.toUpperCase()
                : null;
            andConditions.push({
                OR: [
                    { category: { contains: normalizedCategory, mode: 'insensitive' } },
                    { tags: { has: normalizedCategory } as any },
                    ...(possibleServiceType ? [{ type: possibleServiceType as any }] : []),
                ],
            });
        }

        if (tags && tags.length > 0) {
            andConditions.push({ tags: { hasSome: tags } as any });
        }

        if (andConditions.length > 0) {
            where.AND = andConditions;
        }

        const [services, count] = await Promise.all([
            this.prisma.service.findMany({
                where,
                include: {
                    profile: {
                        include: { user: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take,
            }),
            this.prisma.service.count({ where }),
        ]);

        return {
            services: services.map((service) => this.mapServiceToFeedItem(service)),
            count,
        };
    }

    private mapPostToFeedItem(
        post: Post & { author: User & { profile: Profile | null; establishment: Establishment | null } },
    ): FeedItem {
        const profile = post.author?.profile;
        const establishment = post.author?.establishment;

        const authorName =
            establishment?.name ||
            (profile ? `${profile.firstName} ${profile.lastName}`.trim() : null) ||
            post.author?.email ||
            'Utilisateur';

        const authorAvatar = establishment?.logoUrl || profile?.avatarUrl || null;

        return {
            id: post.id,
            type: 'POST',
            title: post.title,
            name: post.title,
            content: post.content,
            authorId: post.authorId,
            authorName,
            authorAvatar,
            authorRole: post.author?.role || 'CLIENT',
            city: post.city,
            postalCode: post.postalCode,
            tags: this.asStringArray(post.tags),
            category: post.category,
            createdAt: post.createdAt,
            validUntil: post.validUntil,
            postType: post.type,
            viewCount: post.viewCount,
            mediaUrls: this.asStringArray(post.mediaUrls),
        };
    }

    private mapMissionToFeedItem(
        mission: ReliefMission & {
            client: User & {
                profile: Profile | null;
                establishment: Establishment | null
            }
        }
    ): FeedItem {
        const establishment = mission.client?.establishment;
        const profile = mission.client?.profile;

        return {
            id: mission.id,
            type: 'MISSION',
            title: mission.title,
            content: mission.description,
            authorId: mission.clientId,
            authorName: establishment?.name || profile?.firstName || 'Établissement',
            authorAvatar: establishment?.logoUrl || profile?.avatarUrl || null,
            authorRole: 'CLIENT',
            city: mission.city,
            postalCode: mission.postalCode,
            tags: this.asStringArray(mission.requiredSkills),
            category: mission.jobTitle,
            createdAt: mission.createdAt,
            validUntil: mission.startDate,
            urgencyLevel: mission.urgencyLevel,
            hourlyRate: mission.hourlyRate,
            status: mission.status,
            client: mission.client,
        };
    }

    private mapServiceToFeedItem(
        service: Service & { profile: Profile & { user: User | null } }
    ): FeedItem {
        const profile = service.profile;
        const authorName = profile
            ? `${profile.firstName} ${profile.lastName}`.trim() || 'Prestataire'
            : 'Prestataire';

        return {
            id: service.id,
            type: 'SERVICE',
            title: service.name,
            name: service.name,
            content: service.shortDescription || service.description || '',
            authorId: profile?.userId || service.profileId,
            authorName,
            authorAvatar: profile?.avatarUrl || null,
            authorRole: 'EXTRA',
            city: profile?.city || null,
            postalCode: profile?.postalCode || null,
            tags: this.asStringArray(service.tags),
            category: service.category || null,
            createdAt: service.createdAt,
            validUntil: null,
            postType: 'OFFER',
            serviceType: service.type,
            basePrice: service.basePrice,
            providerRating: profile?.averageRating ?? null,
            providerReviews: profile?.totalReviews ?? null,
            imageUrl: service.imageUrl || null,
            profile,
        };
    }

    private filterByDistance(
        items: FeedItem[],
        lat: number,
        lng: number,
        radiusKm: number,
    ): FeedItem[] {
        // For now, simple zip code prefix matching as fallback
        // Full geo-filtering would require coordinates in the data
        return items;
    }
}
