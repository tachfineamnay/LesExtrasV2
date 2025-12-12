import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters';

async function bootstrap() {
    const logger = new Logger('Bootstrap');
    const app = await NestFactory.create(AppModule);

    // Global prefix
    app.setGlobalPrefix('api/v1');

    // CORS - Dynamic origin support for development and production
    const isDev = process.env.NODE_ENV !== 'production';
    const allowedOrigins = (process.env.FRONTEND_URL || process.env.FRONTEND_URLS || 'http://localhost:3000')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);

    app.enableCors({
        origin: (origin, callback) => {
            // Allow requests with no origin (mobile apps, Postman, etc.)
            if (!origin) {
                return callback(null, true);
            }

            // Check if origin is in allowed list
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            // In dev mode, allow localhost and sslip.io domains
            if (isDev || origin.includes('localhost') || origin.includes('sslip.io')) {
                return callback(null, true);
            }

            // Reject other origins
            callback(new Error('Not allowed by CORS'));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });

    // Global Exception Filter - standardized error responses
    app.useGlobalFilters(new AllExceptionsFilter());

    // Validation
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    // Swagger API Docs
    const config = new DocumentBuilder()
        .setTitle('Les Extras V2 API')
        .setDescription('API pour la plateforme Les Extras - Médico-social B2B2C')
        .setVersion('2.0')
        .addBearerAuth()
        .addTag('auth', 'Authentification et gestion des utilisateurs')
        .addTag('matching', 'Moteur de matching SOS Renfort')
        .addTag('video', 'Gestion des sessions vidéo Educat\'heure')
        .addTag('wall', 'Fil d\'actualité et annonces')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);

    const port = process.env.PORT || 4000;
    await app.listen(port);
    console.log(`🚀 Les Extras API running on http://localhost:${port}`);
    console.log(`📚 Swagger docs: http://localhost:${port}/docs`);
}

bootstrap();
