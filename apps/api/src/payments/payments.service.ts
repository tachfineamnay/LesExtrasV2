import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { CreateIntentDto } from './dto';

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);

    async createIntent(dto: CreateIntentDto) {
        try {
            // Mock Stripe PaymentIntent creation
            const clientSecret = `pi_mock_${Date.now()}_secret`;

            this.logger.log(`PaymentIntent mock created for ${dto.amount} ${dto.currency}`);

            return { clientSecret };
        } catch (error) {
            this.logger.error(`createIntent failed: ${error.message}`);
            throw new InternalServerErrorException('Erreur paiement');
        }
    }
}
