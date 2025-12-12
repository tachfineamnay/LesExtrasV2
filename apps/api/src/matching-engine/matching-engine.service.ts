import {
    Injectable,
    NotFoundException,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { FindCandidatesDto, CandidateResultDto, MatchingResultDto, CreateMissionDto } from './dto';

interface GeoPoint {
    latitude: number;
    longitude: number;
}

@Injectable()
export class MatchingEngineService {
    private readonly logger = new Logger(MatchingEngineService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Create a relief mission (SOS Renfort)
     */
    async createMission(dto: CreateMissionDto, clientId: string) {
        try {
            const startDate = new Date(dto.startDate);
            const endDate = dto.endDate
                ? new Date(dto.endDate)
                : new Date(startDate.getTime() + 8 * 60 * 60 * 1000);

            const mission = await this.prisma.reliefMission.create({
                data: {
                    clientId,
                    title: dto.title || `Renfort - ${dto.jobTitle}`,
                    description: dto.description || '',
                    jobTitle: dto.jobTitle,
                    hourlyRate: dto.hourlyRate,
                    isNightShift: dto.isNightShift || false,
                    urgencyLevel: dto.urgencyLevel || 'HIGH',
                    startDate,
                    endDate,
                    city: dto.city,
                    postalCode: dto.postalCode,
                    address: dto.address || dto.city,
                    latitude: dto.latitude,
                    longitude: dto.longitude,
                    radiusKm: dto.radiusKm || 30,
                    requiredSkills: dto.requiredSkills || [],
                    requiredDiplomas: dto.requiredDiplomas || [],
                    status: 'OPEN',
                },
            });

            this.logger.log(`Mission created: ${mission.id} by client ${clientId}`);

            return mission;
        } catch (error) {
            this.logger.error(`createMission failed: ${error.message}`);
            throw new InternalServerErrorException('Erreur lors de la création de la mission');
        }
    }

    /**
     * Find candidates for a relief mission
     * Implements the matching algorithm with:
     * - Role filtering (EXTRA only)
     * - Skills/diplomas matching
     * - Geographic distance calculation
     * - Availability verification
     */
    async findCandidates(
        missionId: string,
        options: FindCandidatesDto = {},
    ): Promise<MatchingResultDto> {
        const { skills = [], radiusKm = 30, limit = 10 } = options;

        try {
            // 1. Get the mission details
            const mission = await this.prisma.reliefMission.findUnique({
                where: { id: missionId },
                include: {
                    client: {
                        include: { establishment: true },
                    },
                },
            });

            if (!mission) {
                throw new NotFoundException(`Mission ${missionId} non trouvée`);
            }

            this.logger.log(`Finding candidates for mission: ${mission.title}`);

            // 2. Get all EXTRA users with their profiles
            const extras = await this.prisma.user.findMany({
                where: {
                    role: 'EXTRA',
                    status: 'VERIFIED',
                },
                include: {
                    profile: {
                        include: {
                            availabilitySlots: true,
                        },
                    },
                },
            });

            // 3. Filter and score candidates
            const missionLocation: GeoPoint = {
                latitude: mission.latitude || 0,
                longitude: mission.longitude || 0,
            };

            const requiredSkills = mission.requiredSkills as string[] || [];
            const requiredDiplomas = mission.requiredDiplomas as string[] || [];
            const missionDate = mission.startDate;

            const candidates: CandidateResultDto[] = [];

            for (const extra of extras) {
                if (!extra.profile) continue;

                const profile = extra.profile;
                const profileLocation: GeoPoint = {
                    latitude: profile.latitude || 0,
                    longitude: profile.longitude || 0,
                };

                // a. Calculate geographic distance
                const distance = this.calculateDistance(missionLocation, profileLocation);

                // Skip if outside radius
                if (distance > (mission.radiusKm || radiusKm)) {
                    continue;
                }

                // b. Check skills/specialties match
                const profileSpecialties = profile.specialties as string[] || [];
                const skillsMatch = this.calculateSkillsMatch(requiredSkills, profileSpecialties);

                // c. Check diplomas match
                const profileDiplomas = profile.diplomas as any[] || [];
                const diplomasMatch = this.calculateDiplomasMatch(requiredDiplomas, profileDiplomas);

                // d. Verify availability
                const isAvailable = this.checkAvailability(
                    profile.availabilitySlots,
                    missionDate,
                    mission.isNightShift,
                );

                // e. Calculate match score (0-100)
                const matchScore = this.calculateMatchScore({
                    distance,
                    maxDistance: radiusKm,
                    skillsMatch,
                    diplomasMatch,
                    isAvailable,
                    averageRating: profile.averageRating,
                    totalMissions: profile.totalMissions,
                });

                candidates.push({
                    id: profile.id,
                    userId: extra.id,
                    firstName: profile.firstName,
                    lastName: profile.lastName,
                    avatarUrl: profile.avatarUrl,
                    headline: profile.headline,
                    specialties: profileSpecialties,
                    diplomas: profileDiplomas,
                    hourlyRate: profile.hourlyRate,
                    averageRating: profile.averageRating,
                    totalMissions: profile.totalMissions,
                    distance: Math.round(distance * 10) / 10,
                    matchScore,
                    isAvailable,
                });
            }

            // 4. Sort by match score and limit results
            const sortedCandidates = candidates
                .sort((a, b) => b.matchScore - a.matchScore)
                .slice(0, limit);

            this.logger.log(
                `Found ${sortedCandidates.length} candidates for mission ${missionId}`,
            );

            return {
                candidates: sortedCandidates,
                totalFound: candidates.length,
                searchRadius: radiusKm,
                missionId,
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(`findCandidates failed: ${error.message}`, error.stack);
            throw new InternalServerErrorException(
                'Erreur lors de la recherche de candidats',
            );
        }
    }

    /**
     * Calculate distance between two geographic points using Haversine formula
     * Returns distance in kilometers
     */
    private calculateDistance(point1: GeoPoint, point2: GeoPoint): number {
        // If no coordinates, return max distance
        if (!point1.latitude || !point1.longitude || !point2.latitude || !point2.longitude) {
            return Infinity;
        }

        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(point2.latitude - point1.latitude);
        const dLon = this.toRad(point2.longitude - point1.longitude);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(point1.latitude)) *
            Math.cos(this.toRad(point2.latitude)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private toRad(deg: number): number {
        return deg * (Math.PI / 180);
    }

    /**
     * Calculate skills match percentage
     */
    private calculateSkillsMatch(required: string[], available: string[]): number {
        if (required.length === 0) return 1; // No requirements = full match

        const requiredLower = required.map((s) => s.toLowerCase());
        const availableLower = available.map((s) => s.toLowerCase());

        const matches = requiredLower.filter((skill) =>
            availableLower.some(
                (avail) => avail.includes(skill) || skill.includes(avail),
            ),
        );

        return matches.length / required.length;
    }

    /**
     * Calculate diplomas match percentage
     */
    private calculateDiplomasMatch(required: string[], available: any[]): number {
        if (required.length === 0) return 1;

        const availableNames = available.map((d) => (d.name || '').toLowerCase());
        const requiredLower = required.map((d) => d.toLowerCase());

        const matches = requiredLower.filter((diploma) =>
            availableNames.some(
                (avail) => avail.includes(diploma) || diploma.includes(avail),
            ),
        );

        return matches.length / required.length;
    }

    /**
     * Check if candidate is available for the mission date/time
     */
    private checkAvailability(
        slots: any[],
        missionDate: Date,
        isNightShift: boolean,
    ): boolean {
        if (!slots || slots.length === 0) {
            // No slots defined = assume available
            return true;
        }

        const dayOfWeek = missionDate.getDay();

        // Find slots for this day
        const daySlots = slots.filter(
            (slot) => slot.isActive && slot.dayOfWeek === dayOfWeek,
        );

        if (daySlots.length === 0) {
            // Check for specific date slots
            const specificSlots = slots.filter(
                (slot) =>
                    slot.isActive &&
                    slot.specificDate &&
                    new Date(slot.specificDate).toDateString() === missionDate.toDateString(),
            );
            return specificSlots.length > 0;
        }

        // For night shifts, check if they have evening/night slots
        if (isNightShift) {
            return daySlots.some((slot) => {
                const startHour = parseInt(slot.startTime.split(':')[0], 10);
                return startHour >= 18 || startHour < 6;
            });
        }

        return true;
    }

    /**
     * Calculate overall match score (0-100)
     */
    private calculateMatchScore(params: {
        distance: number;
        maxDistance: number;
        skillsMatch: number;
        diplomasMatch: number;
        isAvailable: boolean;
        averageRating: number;
        totalMissions: number;
    }): number {
        const {
            distance,
            maxDistance,
            skillsMatch,
            diplomasMatch,
            isAvailable,
            averageRating,
            totalMissions,
        } = params;

        // Weights for each factor
        const weights = {
            distance: 0.2,
            skills: 0.25,
            diplomas: 0.25,
            availability: 0.15,
            rating: 0.1,
            experience: 0.05,
        };

        // Distance score (closer = higher)
        const distanceScore = Math.max(0, 1 - distance / maxDistance);

        // Availability score
        const availabilityScore = isAvailable ? 1 : 0.3;

        // Rating score (normalized to 0-1)
        const ratingScore = averageRating / 5;

        // Experience score (caps at 50 missions)
        const experienceScore = Math.min(totalMissions / 50, 1);

        // Calculate weighted score
        const score =
            distanceScore * weights.distance +
            skillsMatch * weights.skills +
            diplomasMatch * weights.diplomas +
            availabilityScore * weights.availability +
            ratingScore * weights.rating +
            experienceScore * weights.experience;

        return Math.round(score * 100);
    }

    /**
     * Get mission details with current applications
     */
    async getMissionWithApplications(missionId: string) {
        try {
            const mission = await this.prisma.reliefMission.findUnique({
                where: { id: missionId },
                include: {
                    client: {
                        include: { establishment: true },
                    },
                    assignedExtra: {
                        include: { profile: true },
                    },
                    applications: {
                        include: {
                            extra: {
                                include: { profile: true },
                            },
                        },
                        orderBy: { createdAt: 'desc' },
                    },
                },
            });

            if (!mission) {
                throw new NotFoundException(`Mission ${missionId} non trouvée`);
            }

            return mission;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(`getMissionWithApplications failed: ${error.message}`);
            throw new InternalServerErrorException('Erreur lors de la récupération');
        }
    }

    /**
     * Apply to a mission
     */
    async applyToMission(
        missionId: string,
        extraId: string,
        coverLetter?: string,
        proposedRate?: number,
    ) {
        try {
            // Check mission exists and is open
            const mission = await this.prisma.reliefMission.findUnique({
                where: { id: missionId },
            });

            if (!mission) {
                throw new NotFoundException(`Mission ${missionId} non trouvée`);
            }

            if (mission.status !== 'OPEN') {
                throw new Error('Cette mission n\'accepte plus de candidatures');
            }

            // Check not already applied
            const existingApplication = await this.prisma.missionApplication.findUnique({
                where: {
                    missionId_extraId: { missionId, extraId },
                },
            });

            if (existingApplication) {
                throw new Error('Vous avez déjà postulé à cette mission');
            }

            // Create application
            const application = await this.prisma.missionApplication.create({
                data: {
                    missionId,
                    extraId,
                    coverLetter,
                    proposedRate,
                    status: 'PENDING',
                },
                include: {
                    mission: true,
                    extra: {
                        include: { profile: true },
                    },
                },
            });

            this.logger.log(`Application created for mission ${missionId} by extra ${extraId}`);

            return application;
        } catch (error) {
            this.logger.error(`applyToMission failed: ${error.message}`);
            throw error;
        }
    }
}
