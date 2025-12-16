import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAdminNoteDto {
    @ApiProperty({ description: 'Contenu de la note', example: 'Excellent profil, à privilégier pour les missions urgentes.' })
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    content: string;
}

export class AdminNoteResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    content: string;

    @ApiProperty()
    adminId: string;

    @ApiProperty()
    targetUserId: string;

    @ApiProperty()
    createdAt: Date;
}

export class UserListDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    email: string;

    @ApiProperty()
    role: string;

    @ApiProperty()
    status: string;

    @ApiProperty({ required: false })
    clientType?: string;

    @ApiProperty()
    isVerified: boolean;

    @ApiProperty()
    onboardingStep: number;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty({ required: false })
    profile?: {
        firstName: string;
        lastName: string;
        avatarUrl?: string;
    };

    @ApiProperty({ required: false })
    establishment?: {
        name: string;
    };
}
