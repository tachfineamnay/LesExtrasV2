import {
    Injectable,
    NotFoundException,
    BadRequestException,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { SignContractDto } from './dto';

@Injectable()
export class ContractsService {
    private readonly logger = new Logger(ContractsService.name);

    constructor(private readonly prisma: PrismaService) { }

    async signContract(extraId: string, dto: SignContractDto) {
        try {
            const mission = await this.prisma.reliefMission.findUnique({
                where: { id: dto.missionId },
                include: { contract: true },
            });

            if (!mission) {
                throw new NotFoundException(`Mission ${dto.missionId} non trouvée`);
            }

            if (mission.status === 'CANCELLED') {
                throw new BadRequestException('Mission annulée');
            }

            const content = dto.content || mission.description || 'Contrat de mission SOS';
            const signatureUrl = dto.signature;
            const now = new Date();

            const contract = await this.prisma.contract.upsert({
                where: { missionId: dto.missionId },
                update: {
                    extraId,
                    content,
                    signatureUrl,
                    status: 'SIGNED',
                    signedAt: now,
                },
                create: {
                    missionId: dto.missionId,
                    extraId,
                    content,
                    signatureUrl,
                    status: 'SIGNED',
                    signedAt: now,
                },
            });

            await this.prisma.reliefMission.update({
                where: { id: dto.missionId },
                data: {
                    assignedExtraId: mission.assignedExtraId || extraId,
                    status: 'ASSIGNED',
                },
            });

            this.logger.log(`Contract signed for mission ${dto.missionId} by ${extraId}`);

            return contract;
        } catch (error) {
            this.logger.error(`signContract failed: ${error.message}`);
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Erreur lors de la signature du contrat');
        }
    }
}
