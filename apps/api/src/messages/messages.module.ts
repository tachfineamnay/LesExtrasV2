import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';

@Module({
    imports: [PrismaModule, AuthModule],
    controllers: [MessagesController],
    providers: [MessagesService],
})
export class MessagesModule { }
