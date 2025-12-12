import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class SendMessageDto {
    @ApiProperty({ description: 'ID du destinataire' })
    @IsString()
    @IsNotEmpty()
    recipientId: string;

    @ApiProperty({ description: 'Contenu du message' })
    @IsString()
    @IsNotEmpty()
    content: string;
}
