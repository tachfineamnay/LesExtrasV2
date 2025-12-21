import { Module } from '@nestjs/common';
import { MissionHubController } from './mission-hub.controller';
import { MissionHubService } from './mission-hub.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [PrismaModule, NotificationsModule],
    controllers: [MissionHubController],
    providers: [MissionHubService],
    exports: [MissionHubService],
})
export class MissionHubModule { }
