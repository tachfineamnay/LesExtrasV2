import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, IsObject } from 'class-validator';

export class CreateIntentDto {
    @ApiProperty({ description: 'Montant en centimes' })
    @IsNumber()
    amount: number;

    @ApiProperty({ description: 'Devise, ex: EUR' })
    @IsString()
    currency: string;

    @ApiPropertyOptional({ description: 'Metadata libre' })
    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;
}
