import { IsString, IsNumber, IsOptional, IsEnum, IsArray, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum MissionUrgency {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL',
}

export class FindCandidatesDto {
    @ApiPropertyOptional({ description: 'Filtrer par compétences requises' })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    skills?: string[];

    @ApiPropertyOptional({ description: 'Rayon de recherche en km', default: 30 })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(200)
    radiusKm?: number;

    @ApiPropertyOptional({ description: 'Nombre maximum de candidats', default: 10 })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(50)
    limit?: number;
}

export class CandidateResultDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    userId: string;

    @ApiProperty()
    firstName: string;

    @ApiProperty()
    lastName: string;

    @ApiProperty()
    avatarUrl: string | null;

    @ApiProperty()
    headline: string | null;

    @ApiProperty()
    specialties: string[];

    @ApiProperty()
    diplomas: any[];

    @ApiProperty()
    hourlyRate: number | null;

    @ApiProperty()
    averageRating: number;

    @ApiProperty()
    totalMissions: number;

    @ApiProperty({ description: 'Distance en km depuis la mission' })
    distance: number;

    @ApiProperty({ description: 'Score de matching (0-100)' })
    matchScore: number;

    @ApiProperty({ description: 'Disponibilité vérifiée' })
    isAvailable: boolean;
}

export class MatchingResultDto {
    @ApiProperty({ type: [CandidateResultDto] })
    candidates: CandidateResultDto[];

    @ApiProperty()
    totalFound: number;

    @ApiProperty()
    searchRadius: number;

    @ApiProperty()
    missionId: string;
}

export class CreateMissionDto {
    @ApiProperty({ description: 'Intitulé du poste' })
    @IsString()
    jobTitle: string;

    @ApiPropertyOptional({ description: 'Titre personnalisé de la mission' })
    @IsOptional()
    @IsString()
    title?: string;

    @ApiProperty({ description: 'Taux horaire en EUR' })
    @IsNumber()
    hourlyRate: number;

    @ApiPropertyOptional({ description: 'Mission de nuit', default: false })
    @IsOptional()
    isNightShift?: boolean;

    @ApiProperty({ enum: MissionUrgency, default: MissionUrgency.HIGH })
    @IsEnum(MissionUrgency)
    urgencyLevel: MissionUrgency;

    @ApiPropertyOptional({ description: 'Description de la mission' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ description: 'Date de début (ISO)' })
    @IsString()
    startDate: string;

    @ApiPropertyOptional({ description: 'Date de fin (ISO)' })
    @IsOptional()
    @IsString()
    endDate?: string;

    @ApiProperty({ description: 'Ville' })
    @IsString()
    city: string;

    @ApiProperty({ description: 'Code postal' })
    @IsString()
    postalCode: string;

    @ApiPropertyOptional({ description: 'Adresse complète' })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiPropertyOptional({ description: 'Latitude' })
    @IsOptional()
    @IsNumber()
    latitude?: number;

    @ApiPropertyOptional({ description: 'Longitude' })
    @IsOptional()
    @IsNumber()
    longitude?: number;

    @ApiPropertyOptional({ description: 'Rayon de recherche', default: 30 })
    @IsOptional()
    @IsNumber()
    radiusKm?: number;

    @ApiPropertyOptional({ description: 'Compétences requises', type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    requiredSkills?: string[];

    @ApiPropertyOptional({ description: 'Diplômes requis', type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    requiredDiplomas?: string[];
}
