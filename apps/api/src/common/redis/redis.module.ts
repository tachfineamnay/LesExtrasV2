import { Global, Inject, Module, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { Redis as RedisClient } from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
    providers: [
        {
            provide: REDIS_CLIENT,
            inject: [ConfigService],
            useFactory: (configService: ConfigService): RedisClient => {
                const url = configService.get<string>('REDIS_URL');
                const host = configService.get<string>('REDIS_HOST', 'localhost');
                const port = parseInt(configService.get<string>('REDIS_PORT', '6379'), 10);
                const password = configService.get<string>('REDIS_PASSWORD');
                const tlsEnabled = configService.get<string>('REDIS_TLS', 'false') === 'true';

                if (url) {
                    return new Redis(url);
                }

                return new Redis({
                    host,
                    port,
                    password,
                    tls: tlsEnabled ? {} : undefined,
                });
            },
        },
    ],
    exports: [REDIS_CLIENT],
})
export class RedisModule implements OnModuleDestroy {
    constructor(@Inject(REDIS_CLIENT) private readonly client: RedisClient) { }

    async onModuleDestroy() {
        await this.client.quit();
    }
}
