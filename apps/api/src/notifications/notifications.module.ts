import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../common/prisma/prisma.module';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';

@Module({
    imports: [
        PrismaModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.get<string>('JWT_SECRET'),
                signOptions: {
                    expiresIn: config.get<string>('JWT_EXPIRES_IN', '7d'),
                },
            }),
        }),
    ],
    providers: [
        NotificationsGateway,
        NotificationsService,
    ],
    exports: [
        NotificationsGateway,
        NotificationsService,
    ],
})
export class NotificationsModule { }
