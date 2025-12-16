import { Injectable, InternalServerErrorException, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateIntentDto } from './dto';

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);
    private readonly stripe: Stripe;

    constructor(
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
    ) {
        const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
        if (!secretKey) {
            this.logger.warn('STRIPE_SECRET_KEY non configurée - mode test');
        }
        this.stripe = new Stripe(secretKey || 'sk_test_placeholder');
    }

    async createIntent(dto: CreateIntentDto) {
        try {
            const paymentIntent = await this.stripe.paymentIntents.create({
                amount: dto.amount,
                currency: dto.currency.toLowerCase(),
                metadata: dto.metadata || {},
                automatic_payment_methods: { enabled: true },
            });

            this.logger.log(`PaymentIntent created: ${paymentIntent.id} for ${dto.amount} ${dto.currency}`);

            return { clientSecret: paymentIntent.client_secret };
        } catch (error) {
            this.logger.error(`createIntent failed: ${error.message}`);
            throw new InternalServerErrorException('Erreur lors de la création du paiement');
        }
    }

    async createPaymentIntentForBooking(bookingId: string) {
        try {
            const booking = await this.prisma.booking.findUnique({
                where: { id: bookingId },
                include: {
                    service: true,
                    client: { select: { email: true } },
                },
            });

            if (!booking) {
                throw new NotFoundException(`Booking ${bookingId} non trouvé`);
            }

            const amountInCents = Math.round(booking.totalPrice * 100);

            const paymentIntent = await this.stripe.paymentIntents.create({
                amount: amountInCents,
                currency: 'eur',
                metadata: {
                    bookingId: booking.id,
                    serviceId: booking.serviceId || '',
                    clientEmail: booking.client?.email || '',
                },
                automatic_payment_methods: { enabled: true },
            });

            await this.prisma.booking.update({
                where: { id: bookingId },
                data: { stripePaymentIntentId: paymentIntent.id },
            });

            this.logger.log(`PaymentIntent ${paymentIntent.id} created for booking ${bookingId}`);

            return {
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id,
                amount: amountInCents,
            };
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            this.logger.error(`createPaymentIntentForBooking failed: ${error.message}`);
            throw new InternalServerErrorException('Erreur lors de la création du paiement');
        }
    }

    async confirmMockPayment(bookingId: string) {
        try {
            const booking = await this.prisma.booking.findUnique({
                where: { id: bookingId },
            });

            if (!booking) {
                throw new NotFoundException(`Booking ${bookingId} non trouvé`);
            }

            const updated = await this.prisma.booking.update({
                where: { id: bookingId },
                data: {
                    status: 'PAID',
                    paidAt: new Date(),
                    confirmedAt: new Date(),
                },
            });

            this.logger.log(`Booking ${bookingId} confirmé et marqué PAID`);

            return {
                success: true,
                bookingId: updated.id,
                status: updated.status,
            };
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            this.logger.error(`confirmMockPayment failed: ${error.message}`);
            throw new InternalServerErrorException('Erreur lors de la confirmation');
        }
    }

    async getBookingForCheckout(bookingId: string) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                service: { select: { name: true, imageUrl: true } },
                provider: {
                    include: {
                        profile: { select: { firstName: true, lastName: true, avatarUrl: true } },
                    },
                },
            },
        });

        if (!booking) {
            throw new NotFoundException(`Booking ${bookingId} non trouvé`);
        }

        return booking;
    }
}
