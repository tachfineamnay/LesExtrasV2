import {
    Injectable,
    NotFoundException,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { GetFeedDto, FeedItemType, CreatePostDto } from './dto';
import { Prisma, Post, ReliefMission, User, Profile, Establishment, Service } from '@prisma/client';

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
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
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
            city,
            postalCode,
            tags,
            category,
            search,
            latitude,
            longitude,
            radiusKm = 50,
            page = 1,
            limit = 20,
        } = filters;

        try {
            const skip = (page - 1) * limit;
            const feedItems: FeedItem[] = [];
            let totalCount = 0;
            const normalizedSearch = search?.trim();
            const normalizedCategory = category?.trim();

            // Build common where clauses
            const locationFilter = this.buildLocationFilter(city, postalCode);

            // Fetch Posts if requested
            if (type === FeedItemType.ALL || type === FeedItemType.POST) {
                const { posts, count: postCount } = await this.fetchPosts({
                    locationFilter,
                    tags,
                    category: normalizedCategory,
                    search: normalizedSearch,
                    skip: type === FeedItemType.POST ? skip : 0,
                    take: type === FeedItemType.POST ? limit : Math.ceil(limit / 2),
                });

                feedItems.push(...posts);
                totalCount += postCount;

                const { services, count: serviceCount } = await this.fetchServices({
                    tags,
                    category: normalizedCategory,
                    search: normalizedSearch,
                    skip: type === FeedItemType.POST ? skip : 0,
                    take: type === FeedItemType.POST ? limit : Math.ceil(limit / 2),
                });

                feedItems.push(...services);
                totalCount += serviceCount;
            }

            // Fetch ReliefMissions if requested
            if (type === FeedItemType.ALL || type === FeedItemType.MISSION) {
                const { missions, count: missionCount } = await this.fetchMissions({
                    locationFilter: locationFilter as any,
                    tags,
                    category: normalizedCategory,
                    search: normalizedSearch,
                    skip: type === FeedItemType.MISSION ? skip : 0,
                    take: type === FeedItemType.MISSION ? limit : Math.ceil(limit / 2),
                });

                feedItems.push(...missions);
                totalCount += missionCount;
            }

            // Sort all items by createdAt (newest first)
            feedItems.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

            // Apply geo-filtering if coordinates provided
            let filteredItems = feedItems;
            if (latitude && longitude) {
                filteredItems = this.filterByDistance(feedItems, latitude, longitude, radiusKm);
            }

            // Paginate the mixed results for 'ALL' type
            const paginatedItems = type === FeedItemType.ALL
                ? filteredItems.slice(skip, skip + limit)
                : filteredItems;

            const totalForPagination = type === FeedItemType.ALL
                ? filteredItems.length
                : totalCount;

            return {
                items: paginatedItems,
                pagination: {
                    page,
                    limit,
                    total: totalForPagination,
                    totalPages: Math.ceil(totalForPagination / limit),
                    hasNext: page * limit < totalForPagination,
                    hasPrev: page > 1,
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
            const post = await this.prisma.post.create({
                data: {
                    authorId,
                    type: dto.type,
                    title: dto.title,
                    content: dto.content,
                    city: dto.city,
                    postalCode: dto.postalCode,
                    tags: dto.tags || [],
                    category: dto.category,
                    validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
                },
                include: {
                    author: {
                        include: { profile: true },
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
                        include: { profile: true },
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
            const possiblePostType = ['OFFER', 'NEED'].includes(normalizedCategory.toUpperCase())
                ? normalizedCategory.toUpperCase()
                : undefined;

            andConditions.push({
                OR: [
                    { category: { contains: normalizedCategory, mode: 'insensitive' } },
                    { tags: { has: normalizedCategory } as any },
                    ...(possiblePostType ? [{ type: possiblePostType as any }] : []),
                ],
            });
        }

        // Tags filtering using JSON contains (PostgreSQL)
        if (tags && tags.length > 0) {
            andConditions.push({ tags: { hasSome: tags } as any });
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
                        include: { profile: true },
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

    private mapPostToFeedItem(post: Post & { author: User & { profile: Profile | null } }): FeedItem {
        const profile = post.author?.profile;

        return {
            id: post.id,
            type: 'POST',
            title: post.title,
            name: post.title,
            content: post.content,
            authorId: post.authorId,
            authorName: profile
                ? `${profile.firstName} ${profile.lastName}`
                : post.author?.email || 'Utilisateur',
            authorAvatar: profile?.avatarUrl || null,
            authorRole: post.author?.role || 'CLIENT',
            city: post.city,
            postalCode: post.postalCode,
            tags: post.tags as string[] || [],
            category: post.category,
            createdAt: post.createdAt,
            validUntil: post.validUntil,
            postType: post.type,
            viewCount: post.viewCount,
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
            tags: mission.requiredSkills as string[] || [],
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
            tags: service.tags as string[] || [],
            category: service.category || null,
            createdAt: service.createdAt,
            validUntil: null,
            postType: 'OFFER',
            serviceType: service.type,
            basePrice: service.basePrice,
            providerRating: (profile as any)?.averageRating || null,
            providerReviews: (profile as any)?.totalReviews || null,
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
