import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreateIntentDto } from './dto';
import { JwtAuthGuard } from '../common/guards';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Post('create-intent')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Créer un PaymentIntent (mock Stripe)' })
    async createIntent(@Body() dto: CreateIntentDto) {
        return this.paymentsService.createIntent(dto);
    }
}
