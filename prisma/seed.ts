import { PrismaClient, Prisma, UserRole, UserStatus, ServiceType, MissionStatus, MissionUrgency, PostType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const locations = {
    mecs: {
        address: '10 rue Oberkampf, 75011 Paris',
        city: 'Paris',
        postalCode: '75011',
        latitude: 48.8636,
        longitude: 2.3746,
    },
    siham: {
        address: '25 rue de Charenton, 75012 Paris',
        city: 'Paris',
        postalCode: '75012',
        latitude: 48.8469,
        longitude: 2.3795,
    },
};

async function resetDatabase() {
    await prisma.message.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.review.deleteMany();
    await prisma.post.deleteMany();
    await prisma.missionApplication.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.reliefMission.deleteMany();
    await prisma.service.deleteMany();
    await prisma.availabilitySlot.deleteMany();
    await prisma.talentPoolMember.deleteMany();
    await prisma.talentPool.deleteMany();
    await prisma.profile.deleteMany();
    await prisma.establishment.deleteMany();
    await prisma.user.deleteMany();
}

async function main() {
    console.log('Starting database seeding...\n');

    await resetDatabase();
    console.log('Database cleaned');

    const hashedPassword = await bcrypt.hash('password123', 12);

    const admin = await prisma.user.create({
        data: {
            email: 'admin@lesextras.fr',
            passwordHash: hashedPassword,
            phone: '+33600000001',
            role: UserRole.ADMIN,
            status: UserStatus.VERIFIED,
            emailVerified: new Date(),
        },
    });
    console.log(`Admin created: ${admin.email}`);

    const client = await prisma.user.create({
        data: {
            email: 'directeur@mecs-mimosas.fr',
            passwordHash: hashedPassword,
            phone: '+33145670000',
            role: UserRole.CLIENT,
            status: UserStatus.VERIFIED,
            emailVerified: new Date(),
            establishment: {
                create: {
                    name: 'MECS Les Mimosas',
                    siret: '12345678901234',
                    type: 'MECS',
                    description: 'Maison d enfants a caractere social, accueil adolescents et renforts urgents.',
                    address: locations.mecs.address,
                    city: locations.mecs.city,
                    postalCode: locations.mecs.postalCode,
                    latitude: locations.mecs.latitude,
                    longitude: locations.mecs.longitude,
                    website: 'https://mecs-mimosas.fr',
                    contactName: 'Jean Dupont',
                    contactRole: 'Directeur',
                },
            },
        },
        include: { establishment: true },
    });
    console.log(`Client created: ${client.email}`);

    const extra = await prisma.user.create({
        data: {
            email: 'siham@lesextras.fr',
            passwordHash: hashedPassword,
            phone: '+33612345678',
            role: UserRole.EXTRA,
            status: UserStatus.VERIFIED,
            emailVerified: new Date(),
            stripeOnboarded: true,
            profile: {
                create: {
                    firstName: 'Siham',
                    lastName: 'Benali',
                    avatarUrl: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=400&auto=format&fit=crop&q=60',
                    bio: 'Coach sportive et educatrice specialisee. Je combine boxe et mediation pour renforcer la confiance des jeunes en situation fragile.',
                    headline: 'Expert Boxe Educative',
                    specialties: ['boxe educative', 'sport adapte', 'gestion des emotions', 'coaching adolescent'] as Prisma.JsonArray,
                    diplomas: [
                        { name: 'BPJEPS Activites de la forme', year: 2016 },
                        { name: 'Certification boxe educative', year: 2019 },
                        { name: 'Premiers secours PSC1', year: 2022 },
                    ] as Prisma.JsonArray,
                    hourlyRate: 60,
                    address: locations.siham.address,
                    city: locations.siham.city,
                    postalCode: locations.siham.postalCode,
                    latitude: locations.siham.latitude,
                    longitude: locations.siham.longitude,
                    radiusKm: 35,
                    isVideoEnabled: true,
                    totalMissions: 42,
                    totalBookings: 68,
                    averageRating: 4.9,
                    totalReviews: 28,
                },
            },
        },
        include: { profile: true },
    });
    console.log(`Extra created: ${extra.email}`);

    const availabilityData = [
        { dayOfWeek: 1, startTime: '09:00', endTime: '12:00' },
        { dayOfWeek: 3, startTime: '14:00', endTime: '18:00' },
        { dayOfWeek: 5, startTime: '18:30', endTime: '22:00' },
    ];

    for (const slot of availabilityData) {
        await prisma.availabilitySlot.create({
            data: {
                profileId: extra.profile!.id,
                dayOfWeek: slot.dayOfWeek,
                startTime: slot.startTime,
                endTime: slot.endTime,
                duration: 90,
            },
        });
    }
    console.log('Availability slots added for Siham');

    const boxeService = await prisma.service.create({
        data: {
            profileId: extra.profile!.id,
            name: 'Atelier Boxe Educative',
            slug: 'atelier-boxe-educative',
            shortDescription: 'Atelier de 2h pour canaliser les emotions via la boxe.',
            description: 'Atelier collectif qui combine techniques de boxe adaptees et exercices de gestion des emotions pour adolescents et jeunes adultes.',
            type: ServiceType.WORKSHOP,
            category: 'sport',
            pricingOptions: [
                { id: 'decouverte', name: 'Session decouverte', price: 280, duration: '2h', maxParticipants: 12 },
                { id: 'cycle', name: 'Cycle 4 ateliers', price: 950, duration: '4x2h', maxParticipants: 12 },
            ] as Prisma.JsonArray,
            basePrice: 280,
            minParticipants: 6,
            maxParticipants: 12,
            ageGroups: ['12-15 ans', '16-18 ans'] as Prisma.JsonArray,
            imageUrl: 'https://images.unsplash.com/photo-1517438322307-e67111335449?w=800&auto=format&fit=crop&q=60',
            tags: ['boxe', 'emotions', 'collectif', 'paris'] as Prisma.JsonArray,
            isActive: true,
            isFeatured: true,
        },
    });
    console.log(`Service created: ${boxeService.name}`);

    const needPost = await prisma.post.create({
        data: {
            authorId: client.id,
            type: PostType.NEED,
            title: 'Urgent : Veilleur de nuit ce soir',
            content: 'Absence de derniere minute. Nous cherchons un veilleur de nuit pour ce soir de 21h a 7h. Public: adolescents en MECS.',
            category: 'sos-renfort',
            city: locations.mecs.city,
            postalCode: locations.mecs.postalCode,
            latitude: locations.mecs.latitude,
            longitude: locations.mecs.longitude,
            radiusKm: 25,
            tags: ['veille de nuit', 'urgence', 'mecs'] as Prisma.JsonArray,
            isPinned: true,
            validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
    });
    console.log(`Wall NEED post created: ${needPost.title}`);

    const offerPost = await prisma.post.create({
        data: {
            authorId: extra.id,
            type: PostType.OFFER,
            title: 'Atelier Boxe Educative disponible',
            content: 'Je propose un atelier de boxe educative cle en main pour renforcer la cohesion et la confiance des jeunes. Deplacements Paris/IDF.',
            category: 'sport',
            city: locations.siham.city,
            postalCode: locations.siham.postalCode,
            latitude: locations.siham.latitude,
            longitude: locations.siham.longitude,
            radiusKm: 35,
            tags: ['boxe educative', 'cohesion', 'gestion emotion'] as Prisma.JsonArray,
            imageUrls: [
                'https://images.unsplash.com/photo-1501426026826-31c667bdf23d?w=800&auto=format&fit=crop&q=60',
            ] as Prisma.JsonArray,
            isActive: true,
        },
    });
    console.log(`Wall OFFER post created: ${offerPost.title}`);

    const missionStart = new Date();
    missionStart.setHours(missionStart.getHours() + 2, 0, 0, 0);
    const missionEnd = new Date(missionStart.getTime() + 8 * 60 * 60 * 1000);

    const reliefMission = await prisma.reliefMission.create({
        data: {
            clientId: client.id,
            title: 'Renfort veilleur de nuit',
            description: 'Remplacement urgent pour veiller sur le groupe adolescent. Brief securite fourni sur place.',
            jobTitle: 'Surveillant de nuit',
            urgencyLevel: MissionUrgency.CRITICAL,
            startDate: missionStart,
            endDate: missionEnd,
            isNightShift: true,
            hourlyRate: 22,
            estimatedHours: 8,
            address: locations.mecs.address,
            city: locations.mecs.city,
            postalCode: locations.mecs.postalCode,
            latitude: locations.mecs.latitude,
            longitude: locations.mecs.longitude,
            radiusKm: 20,
            requiredSkills: ['veille de nuit', 'gestion de crise', 'ecoute active'] as Prisma.JsonArray,
            requiredDiplomas: ['PSC1'] as Prisma.JsonArray,
            status: MissionStatus.OPEN,
        },
    });
    console.log(`Relief mission created: ${reliefMission.title}`);

    const talentPool = await prisma.talentPool.create({
        data: {
            establishmentId: client.establishment!.id,
            name: 'Intervenants prioritaire',
        },
    });

    await prisma.talentPoolMember.create({
        data: {
            talentPoolId: talentPool.id,
            profileId: extra.profile!.id,
            note: 'Disponible en soiree et urgence.',
        },
    });
    console.log('Talent pool seeded');

    console.log('\nSeeding completed successfully.\n');
    console.log('Credentials ready for tests:');
    console.log(' - Admin: admin@lesextras.fr / password123');
    console.log(' - Extra: siham@lesextras.fr / password123');
    console.log(' - Client: directeur@mecs-mimosas.fr / password123');
}

main()
    .catch((e) => {
        console.error('Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
