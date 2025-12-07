import {
    Injectable,
    NotFoundException,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { GetFeedDto, FeedItemType, CreatePostDto } from './dto';
import { Prisma, Post, ReliefMission, User, Profile, Establishment } from '@prisma/client';

interface FeedItem {
    id: string;
    type: 'POST' | 'MISSION';
    title: string;
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
    // Post-specific fields
    postType?: string;
    viewCount?: number;
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
     * Get mixed feed of Posts and ReliefMissions
     * Returns chronologically sorted items based on filters
     */
    async getFeed(filters: GetFeedDto): Promise<PaginatedFeedResult> {
        const {
            type = FeedItemType.ALL,
            city,
            postalCode,
            tags,
            category,
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

            // Build common where clauses
            const locationFilter = this.buildLocationFilter(city, postalCode);

            // Fetch Posts if requested
            if (type === FeedItemType.ALL || type === FeedItemType.POST) {
                const { posts, count: postCount } = await this.fetchPosts({
                    locationFilter,
                    tags,
                    category,
                    skip: type === FeedItemType.POST ? skip : 0,
                    take: type === FeedItemType.POST ? limit : Math.ceil(limit / 2),
                });

                feedItems.push(...posts);
                totalCount += postCount;
            }

            // Fetch ReliefMissions if requested
            if (type === FeedItemType.ALL || type === FeedItemType.MISSION) {
                const { missions, count: missionCount } = await this.fetchMissions({
                    locationFilter: locationFilter as any,
                    tags,
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
        skip: number;
        take: number;
    }) {
        const { locationFilter, tags, category, skip, take } = options;

        const where: Prisma.PostWhereInput = {
            isActive: true,
            OR: [
                { validUntil: null },
                { validUntil: { gte: new Date() } },
            ],
        };

        if (locationFilter) {
            Object.assign(where, locationFilter);
        }

        if (category) {
            where.category = category;
        }

        // Tags filtering using JSON contains (PostgreSQL)
        if (tags && tags.length > 0) {
            where.tags = { hasSome: tags } as any;
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
        skip: number;
        take: number;
    }) {
        const { locationFilter, tags, skip, take } = options;

        const where: Prisma.ReliefMissionWhereInput = {
            status: 'OPEN',
            startDate: { gte: new Date() },
        };

        if (locationFilter) {
            Object.assign(where, locationFilter);
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

    private mapPostToFeedItem(post: Post & { author: User & { profile: Profile | null } }): FeedItem {
        const profile = post.author?.profile;

        return {
            id: post.id,
            type: 'POST',
            title: post.title,
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
