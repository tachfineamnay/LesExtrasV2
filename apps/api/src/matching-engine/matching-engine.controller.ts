import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
} from '@nestjs/swagger';
import { MatchingEngineService } from './matching-engine.service';
import { FindCandidatesDto, MatchingResultDto, CreateMissionDto } from './dto';
import { JwtAuthGuard, MissionAccessGuard, RolesGuard } from '../common/guards';
import { Roles, CurrentUser, CurrentUserPayload } from '../common/decorators';

@ApiTags('matching')
@Controller('matching')
export class MatchingEngineController {
    constructor(private readonly matchingService: MatchingEngineService) { }

    @Post('missions')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiBearerAuth()
    @Roles('CLIENT', 'ADMIN')
    @ApiOperation({ summary: 'Créer une mission SOS' })
    @ApiResponse({ status: 201, description: 'Mission créée' })
    async createMission(
        @CurrentUser() user: CurrentUserPayload,
        @Body() dto: CreateMissionDto,
    ) {
        return this.matchingService.createMission(dto, user.id);
    }

    @Get('missions/:missionId/candidates')
    @UseGuards(JwtAuthGuard, MissionAccessGuard, RolesGuard)
    @ApiBearerAuth()
    @Roles('CLIENT', 'ADMIN')
    @ApiOperation({ summary: 'Trouver des candidats pour une mission SOS' })
    @ApiParam({ name: 'missionId', description: 'ID de la mission' })
    @ApiResponse({ status: 200, type: MatchingResultDto })
    async findCandidates(
        @Param('missionId') missionId: string,
        @Query() options: FindCandidatesDto,
    ): Promise<MatchingResultDto> {
        return this.matchingService.findCandidates(missionId, options);
    }

    @Get('missions/:missionId')
    @UseGuards(JwtAuthGuard, MissionAccessGuard)
    @ApiOperation({ summary: 'Obtenir les détails d\'une mission avec les candidatures' })
    @ApiParam({ name: 'missionId', description: 'ID de la mission' })
    async getMission(@Param('missionId') missionId: string) {
        return this.matchingService.getMissionWithApplications(missionId);
    }

    @Post('missions/:missionId/apply')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiBearerAuth()
    @Roles('TALENT')
    @ApiOperation({ summary: 'Postuler à une mission SOS' })
    @ApiParam({ name: 'missionId', description: 'ID de la mission' })
    async applyToMission(
        @Param('missionId') missionId: string,
        @CurrentUser() user: CurrentUserPayload,
        @Body() body: { coverLetter?: string; proposedRate?: number },
    ) {
        return this.matchingService.applyToMission(
            missionId,
            user.id,
            body.coverLetter,
            body.proposedRate,
        );
    }
}
