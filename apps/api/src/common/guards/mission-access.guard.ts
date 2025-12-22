import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Request } from 'express';

@Injectable()
export class MissionAccessGuard implements CanActivate {
    private readonly logger = new Logger(MissionAccessGuard.name);

    constructor(private readonly prisma: PrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const missionId = this.extractMissionId(request);

        // If the route does not target a mission, skip silently
        if (!missionId) {
            return true;
        }

        if (!request.user) {
            throw new ForbiddenException('Authentification requise pour accéder à cette mission');
        }

        const mission = await this.prisma.reliefMission.findUnique({
            where: { id: missionId },
            select: { clientId: true, assignedTalentId: true },
        });

        if (!mission) {
            throw new NotFoundException(`Mission ${missionId} introuvable`);
        }

        // Admins bypass the mission membership check
        if (request.user.role === 'ADMIN') {
            return true;
        }

        const isParticipant =
            mission.clientId === request.user.id ||
            mission.assignedTalentId === request.user.id;

        if (!isParticipant) {
            this.logger.warn(
                `Mission access denied for user ${request.user.id} on mission ${missionId}`,
            );
            throw new ForbiddenException(
                'Accès refusé : vous devez être client ou talent assigné de la mission',
            );
        }

        return true;
    }

    private extractMissionId(request: Request): string | undefined {
        const paramsMissionId = request.params?.missionId || request.params?.id;
        if (paramsMissionId) {
            return paramsMissionId;
        }

        if (typeof request.body === 'object' && request.body !== null) {
            const missionId = request.body.missionId || request.body.mission_id;
            if (missionId) {
                return missionId;
            }
        }

        return undefined;
    }
}
