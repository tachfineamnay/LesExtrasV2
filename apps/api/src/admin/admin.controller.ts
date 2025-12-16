import {
    Controller,
    Get,
    Post,
    Patch,
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
    ApiQuery,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CreateAdminNoteDto, AdminNoteResponseDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles, CurrentUser, CurrentUserPayload } from '../common/decorators';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class AdminController {
    constructor(private readonly adminService: AdminService) {}

    @Get('users')
    @ApiOperation({ summary: 'Liste tous les utilisateurs (CRM)' })
    @ApiQuery({ name: 'role', required: false, enum: ['CLIENT', 'EXTRA', 'ADMIN'] })
    @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'VERIFIED', 'SUSPENDED', 'BANNED'] })
    @ApiQuery({ name: 'search', required: false })
    @ApiResponse({ status: 200, description: 'Liste des utilisateurs' })
    async listUsers(
        @Query('role') role?: string,
        @Query('status') status?: string,
        @Query('search') search?: string,
    ) {
        return this.adminService.listUsers({ role, status, search });
    }

    @Get('users/:id')
    @ApiOperation({ summary: 'Détails complets d\'un utilisateur' })
    @ApiResponse({ status: 200, description: 'Détails de l\'utilisateur' })
    async getUserDetails(@Param('id') id: string) {
        return this.adminService.getUserDetails(id);
    }

    @Post('users/:id/notes')
    @ApiOperation({ summary: 'Ajouter une note interne sur un utilisateur' })
    @ApiResponse({ status: 201, type: AdminNoteResponseDto })
    async createNote(
        @Param('id') targetUserId: string,
        @Body() dto: CreateAdminNoteDto,
        @CurrentUser() admin: CurrentUserPayload,
    ) {
        return this.adminService.createAdminNote(admin.id, targetUserId, dto);
    }

    @Get('users/:id/notes')
    @ApiOperation({ summary: 'Récupérer les notes d\'un utilisateur' })
    @ApiResponse({ status: 200, type: [AdminNoteResponseDto] })
    async getUserNotes(@Param('id') targetUserId: string) {
        return this.adminService.getUserNotes(targetUserId);
    }

    @Patch('users/:id/verify')
    @ApiOperation({ summary: 'Vérifier un utilisateur' })
    @ApiResponse({ status: 200, description: 'Utilisateur vérifié' })
    async verifyUser(
        @Param('id') targetUserId: string,
        @CurrentUser() admin: CurrentUserPayload,
    ) {
        return this.adminService.verifyUser(admin.id, targetUserId);
    }

    @Patch('documents/:id/status')
    @ApiOperation({ summary: 'Valider ou rejeter un document' })
    @ApiResponse({ status: 200, description: 'Document mis à jour' })
    async updateDocumentStatus(
        @Param('id') documentId: string,
        @Body() body: { status: string; comment?: string },
        @CurrentUser() admin: CurrentUserPayload,
    ) {
        return this.adminService.updateDocumentStatus(admin.id, documentId, body.status, body.comment);
    }
}
