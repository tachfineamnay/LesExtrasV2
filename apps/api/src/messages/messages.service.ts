import { Injectable, NotFoundException, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { SendMessageDto } from './dto';

@Injectable()
export class MessagesService {
    private readonly logger = new Logger(MessagesService.name);

    constructor(private readonly prisma: PrismaService) { }

    async send(senderId: string, dto: SendMessageDto) {
        try {
            const recipient = await this.prisma.user.findUnique({ where: { id: dto.recipientId } });
            if (!recipient) {
                throw new NotFoundException(`Destinataire ${dto.recipientId} non trouvé`);
            }

            const message = await this.prisma.message.create({
                data: {
                    senderId,
                    receiverId: dto.recipientId,
                    content: dto.content,
                    attachments: [],
                },
            });

            return message;
        } catch (error) {
            this.logger.error(`send message failed: ${error.message}`);
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException('Erreur lors de lenvoi du message');
        }
    }
}
