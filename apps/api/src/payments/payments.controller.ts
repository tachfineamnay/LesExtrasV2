import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
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
    @ApiOperation({ summary: 'Créer un PaymentIntent Stripe' })
    async createIntent(@Body() dto: CreateIntentDto) {
        return this.paymentsService.createIntent(dto);
    }

    @Post('create-intent/:bookingId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Créer un PaymentIntent pour un booking' })
    async createIntentForBooking(@Param('bookingId') bookingId: string) {
        return this.paymentsService.createPaymentIntentForBooking(bookingId);
    }

    @Post('confirm-mock/:bookingId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Confirmer le paiement (mock pour prototype)' })
    async confirmMock(@Param('bookingId') bookingId: string) {
        return this.paymentsService.confirmMockPayment(bookingId);
    }

    @Get('booking/:bookingId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Récupérer les détails du booking pour checkout' })
    async getBooking(@Param('bookingId') bookingId: string) {
        return this.paymentsService.getBookingForCheckout(bookingId);
    }
}
