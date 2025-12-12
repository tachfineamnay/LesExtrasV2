import { Module } from '@nestjs/common';
import { MatchingEngineController } from './matching-engine.controller';
import { MatchingEngineService } from './matching-engine.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
    imports: [AuthModule, PrismaModule],
    controllers: [MatchingEngineController],
    providers: [MatchingEngineService],
    exports: [MatchingEngineService],
})
export class MatchingEngineModule { }
