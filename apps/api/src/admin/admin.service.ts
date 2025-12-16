import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateAdminNoteDto } from './dto';

@Injectable()
export class AdminService {
    private readonly logger = new Logger(AdminService.name);

    constructor(private readonly prisma: PrismaService) {}

    /**
     * Vérifie que l'utilisateur est un admin
     */
    async isAdmin(userId: string): Promise<boolean> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });
        return user?.role === 'ADMIN';
    }

    /**
     * Liste tous les utilisateurs (CRM)
     */
    async listUsers(filters?: { role?: string; status?: string; search?: string }) {
        const where: any = {};

        if (filters?.role) {
            where.role = filters.role;
        }
        if (filters?.status) {
            where.status = filters.status;
        }
        if (filters?.search) {
            where.OR = [
                { email: { contains: filters.search, mode: 'insensitive' } },
                { profile: { firstName: { contains: filters.search, mode: 'insensitive' } } },
                { profile: { lastName: { contains: filters.search, mode: 'insensitive' } } },
                { establishment: { name: { contains: filters.search, mode: 'insensitive' } } },
            ];
        }

        const users = await this.prisma.user.findMany({
            where,
            include: {
                profile: {
                    select: { firstName: true, lastName: true, avatarUrl: true },
                },
                establishment: {
                    select: { name: true },
                },
                _count: {
                    select: {
                        bookingsAsClient: true,
                        bookingsAsProvider: true,
                        adminNotesReceived: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return users;
    }

    /**
     * Récupère un utilisateur avec ses détails complets
     */
    async getUserDetails(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                profile: true,
                establishment: true,
                documents: {
                    orderBy: { createdAt: 'desc' },
                },
                adminNotesReceived: {
                    include: {
                        admin: {
                            select: { email: true, profile: { select: { firstName: true, lastName: true } } },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
                _count: {
                    select: {
                        bookingsAsClient: true,
                        bookingsAsProvider: true,
                        missionsAsClient: true,
                        missionsAsExtra: true,
                    },
                },
            },
        });

        if (!user) {
            throw new NotFoundException(`Utilisateur ${userId} non trouvé`);
        }

        return user;
    }

    /**
     * Ajoute une note admin sur un utilisateur
     */
    async createAdminNote(adminId: string, targetUserId: string, dto: CreateAdminNoteDto) {
        // Vérifier que l'admin est bien admin
        const isAdmin = await this.isAdmin(adminId);
        if (!isAdmin) {
            throw new ForbiddenException('Seuls les administrateurs peuvent ajouter des notes');
        }

        // Vérifier que l'utilisateur cible existe
        const targetUser = await this.prisma.user.findUnique({
            where: { id: targetUserId },
        });
        if (!targetUser) {
            throw new NotFoundException(`Utilisateur ${targetUserId} non trouvé`);
        }

        const note = await this.prisma.adminNote.create({
            data: {
                adminId,
                targetUserId,
                content: dto.content,
            },
            include: {
                admin: {
                    select: { email: true, profile: { select: { firstName: true, lastName: true } } },
                },
            },
        });

        this.logger.log(`Note admin créée par ${adminId} sur ${targetUserId}`);

        return note;
    }

    /**
     * Récupère les notes d'un utilisateur
     */
    async getUserNotes(targetUserId: string) {
        return this.prisma.adminNote.findMany({
            where: { targetUserId },
            include: {
                admin: {
                    select: { email: true, profile: { select: { firstName: true, lastName: true } } },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Vérifie un utilisateur (isVerified = true)
     */
    async verifyUser(adminId: string, targetUserId: string) {
        const isAdmin = await this.isAdmin(adminId);
        if (!isAdmin) {
            throw new ForbiddenException('Seuls les administrateurs peuvent vérifier les utilisateurs');
        }

        const user = await this.prisma.user.update({
            where: { id: targetUserId },
            data: {
                isVerified: true,
                status: 'VERIFIED',
            },
        });

        this.logger.log(`Utilisateur ${targetUserId} vérifié par ${adminId}`);

        return user;
    }

    /**
     * Met à jour le statut d'un document
     */
    async updateDocumentStatus(adminId: string, documentId: string, status: string, comment?: string) {
        const isAdmin = await this.isAdmin(adminId);
        if (!isAdmin) {
            throw new ForbiddenException('Seuls les administrateurs peuvent valider les documents');
        }

        const document = await this.prisma.userDocument.update({
            where: { id: documentId },
            data: {
                status,
                comment,
                validatedAt: new Date(),
                validatedBy: adminId,
            },
        });

        this.logger.log(`Document ${documentId} mis à jour: ${status}`);

        return document;
    }
}
