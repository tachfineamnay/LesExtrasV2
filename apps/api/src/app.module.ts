import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

// Core
import { PrismaModule } from './common/prisma/prisma.module';
import { GeocodingModule } from './common/services/geocoding.module';

// Feature Modules
import { AuthModule } from './auth/auth.module';
import { MatchingEngineModule } from './matching-engine/matching-engine.module';
import { VideoBookingModule } from './video-booking/video-booking.module';
import { WallFeedModule } from './wall-feed/wall-feed.module';
import { ContractsModule } from './contracts/contracts.module';
import { MessagesModule } from './messages/messages.module';
import { PaymentsModule } from './payments/payments.module';
import { HealthModule } from './health/health.module';

@Module({
    imports: [
        // Configuration
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env.local', '.env'],
        }),

        // Rate Limiting
        ThrottlerModule.forRoot([
            {
                name: 'short',
                ttl: 1000,
                limit: 3,
            },
            {
                name: 'medium',
                ttl: 10000,
                limit: 20,
            },
            {
                name: 'long',
                ttl: 60000,
                limit: 100,
            },
        ]),

        // Core
        PrismaModule,
        GeocodingModule,

        // Features
        AuthModule,
        MatchingEngineModule,
        VideoBookingModule,
        WallFeedModule,
        ContractsModule,
        MessagesModule,
        PaymentsModule,
        HealthModule,
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule { }
