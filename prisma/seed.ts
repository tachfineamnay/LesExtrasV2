import { PrismaClient, UserRole, UserStatus, MissionStatus, BookingStatus, MissionUrgency, TransactionType, TransactionStatus, ServiceType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Start seeding...');

    // 1. Clean DB
    console.log('🧹 Cleaning database...');
    await prisma.transaction.deleteMany();
    await prisma.message.deleteMany();
    await prisma.review.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.missionApplication.deleteMany();
    await prisma.contract.deleteMany();
    await prisma.reliefMission.deleteMany();
    await prisma.service.deleteMany();
    await prisma.availabilitySlot.deleteMany();
    await prisma.talentPoolMember.deleteMany();
    await prisma.talentPool.deleteMany();
    await prisma.profile.deleteMany();
    await prisma.establishment.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();

    const passwordHash = await bcrypt.hash('password123', 10);

    // 2. Create Admin
    console.log('👤 Creating Admin...');
    const admin = await prisma.user.create({
        data: {
            email: 'admin@lesextras.fr',
            passwordHash,
            role: 'ADMIN',
            status: 'VERIFIED',
            walletBalance: 500000, // 5000.00 EUR
            profile: {
                create: {
                    firstName: 'Admin',
                    lastName: 'System',
                    bio: 'Super Admin',
                    specialties: [],
                    diplomas: []
                }
            }
        }
    });

    // 3. Create Clients (Establishments)
    console.log('🏥 Creating Clients...');
    const clientsData = [
        {
            email: 'ehpad.paris@exemple.fr',
            name: 'EHPAD Les Jardins',
            type: 'EHPAD',
            city: 'Paris',
            lat: 48.8566,
            lng: 2.3522,
            address: '12 Rue de Rivoli',
            postalCode: '75004'
        },
        {
            email: 'creche.lyon@exemple.fr',
            name: 'Crèche Les Petits Pas',
            type: 'Crèche',
            city: 'Lyon',
            lat: 45.7640,
            lng: 4.8357,
            address: '5 Place Bellecour',
            postalCode: '69002'
        },
        {
            email: 'ime.paris@exemple.fr',
            name: 'IME L\'Espoir',
            type: 'IME',
            city: 'Paris',
            lat: 48.8606,
            lng: 2.3376,
            address: '150 Rue Saint-Honoré',
            postalCode: '75001'
        }
    ];

    const clients = [];
    for (const clientData of clientsData) {
        const client = await prisma.user.create({
            data: {
                email: clientData.email,
                passwordHash,
                role: 'CLIENT',
                status: 'VERIFIED',
                walletBalance: 200000, // 2000.00 EUR
                establishment: {
                    create: {
                        name: clientData.name,
                        type: clientData.type,
                        city: clientData.city,
                        latitude: clientData.lat,
                        longitude: clientData.lng,
                        address: clientData.address,
                        postalCode: clientData.postalCode,
                        contactName: 'Directeur',
                        contactRole: 'Direction',
                        siret: Math.random().toString().slice(2, 16)
                    }
                }
            }
        });
        clients.push(client);
    }

    // 4. Create Extras (Soignants)
    console.log('👨‍⚕️ Creating Extras...');
    const extrasData = [
        {
            email: 'infirmier.paris@exemple.fr',
            firstName: 'Jean',
            lastName: 'Dupont',
            job: 'Infirmier',
            city: 'Paris',
            lat: 48.8580,
            lng: 2.3500, // Proche client 1
            specialties: ['soins_palliatifs', 'geriatrie']
        },
        {
            email: 'aide.paris@exemple.fr',
            firstName: 'Marie',
            lastName: 'Curie',
            job: 'Aide-soignant',
            city: 'Paris',
            lat: 48.8700,
            lng: 2.3600,
            specialties: ['toilette', 'repas']
        },
        {
            email: 'educ.lyon@exemple.fr',
            firstName: 'Paul',
            lastName: 'Verlaine',
            job: 'Éducateur',
            city: 'Lyon',
            lat: 45.7600,
            lng: 4.8300,
            specialties: ['autisme', 'jeunes']
        },
        {
            email: 'infirmier.loin@exemple.fr',
            firstName: 'Lointain',
            lastName: 'Extra',
            job: 'Infirmier',
            city: 'Versailles',
            lat: 48.8049,
            lng: 2.1204, // > 10km Paris
            specialties: ['nuit']
        },
        {
            email: 'polyvalent@exemple.fr',
            firstName: 'Alex',
            lastName: 'Terieur',
            job: 'Aide-soignant',
            city: 'Paris',
            lat: 48.8500,
            lng: 2.3400,
            specialties: ['geriatrie', 'handicap']
        }
    ];

    const extras = [];
    for (const extraData of extrasData) {
        const extra = await prisma.user.create({
            data: {
                email: extraData.email,
                passwordHash,
                role: 'EXTRA',
                status: 'VERIFIED',
                profile: {
                    create: {
                        firstName: extraData.firstName,
                        lastName: extraData.lastName,
                        headline: extraData.job,
                        bio: `Passionné par mon métier de ${extraData.job}`,
                        city: extraData.city,
                        latitude: extraData.lat,
                        longitude: extraData.lng,
                        specialties: extraData.specialties,
                        diplomas: [
                            { name: "Diplôme d'État", year: 2018, url: "https://example.com/diplome.pdf" }
                        ],
                        hourlyRate: 25.0
                    }
                },
                stripeAccountId: `acct_${Math.random().toString(36).substring(7)}`,
                stripeOnboarded: true
            }
        });
        extras.push(extra);
    }

    // 5. Missions & Matching
    console.log('🚀 Creating Missions...');

    // Mission OUVERTE (Client 0 - Paris)
    await prisma.reliefMission.create({
        data: {
            clientId: clients[0].id,
            title: 'Renfort IDE Nuit',
            description: 'Besoin urgent pour remplacement arrêt maladie.',
            jobTitle: 'Infirmier',
            urgencyLevel: MissionUrgency.HIGH,
            status: MissionStatus.OPEN,
            startDate: new Date(Date.now() + 86400000), // Demain
            endDate: new Date(Date.now() + 86400000 + 28800000), // +8h
            hourlyRate: 35.0,
            estimatedHours: 8,
            totalBudget: 280.0,
            address: '12 Rue de Rivoli',
            city: 'Paris',
            postalCode: '75004',
            latitude: 48.8566,
            longitude: 2.3522,
            isNightShift: true
        }
    });

    // Mission ASSIGNÉE (Client 1 - Lyon, Extra 2 - Lyon)
    await prisma.reliefMission.create({
        data: {
            clientId: clients[1].id,
            assignedExtraId: extras[2].id,
            title: 'Renfort Éducateur',
            description: 'Accompagnement sortie groupe.',
            jobTitle: 'Éducateur',
            urgencyLevel: MissionUrgency.MEDIUM,
            status: MissionStatus.ASSIGNED,
            startDate: new Date(Date.now() + 172800000), // J+2
            endDate: new Date(Date.now() + 172800000 + 14400000), // +4h
            hourlyRate: 30.0,
            estimatedHours: 4,
            totalBudget: 120.0,
            address: '5 Place Bellecour',
            city: 'Lyon',
            postalCode: '69002',
            latitude: 45.7640,
            longitude: 4.8357,
            contract: {
                create: {
                    extraId: extras[2].id,
                    content: "Contrat standard...",
                    status: "SIGNED",
                    signedAt: new Date()
                }
            }
        }
    });

    // Mission TERMINÉE (Client 2 - Paris, Extra 0 - Paris)
    await prisma.reliefMission.create({
        data: {
            clientId: clients[2].id,
            assignedExtraId: extras[0].id,
            title: 'Aide Soignant Jour',
            description: 'Renfort journée normale.',
            jobTitle: 'Aide-soignant',
            urgencyLevel: MissionUrgency.LOW,
            status: MissionStatus.COMPLETED,
            startDate: new Date(Date.now() - 86400000), // Hier
            endDate: new Date(Date.now() - 86400000 + 25200000), // +7h
            hourlyRate: 20.0,
            estimatedHours: 7,
            totalBudget: 140.0,
            address: '150 Rue Saint-Honoré',
            city: 'Paris',
            postalCode: '75001',
            latitude: 48.8606,
            longitude: 2.3376,
            completedAt: new Date()
        }
    });

    // 6. Flux Financier
    console.log('💸 Creating Transactions...');

    // Transaction factice COMPLETED pour Client 0
    await prisma.transaction.create({
        data: {
            userId: clients[0].id,
            type: TransactionType.MISSION_PAYMENT,
            amount: 28000, // 280.00 EUR
            status: TransactionStatus.COMPLETED,
            description: 'Paiement mission Renfort IDE Nuit',
            stripePaymentId: 'pi_fake_123456789'
        }
    });

    // Transaction pour l'Admin (Commission)
    await prisma.transaction.create({
        data: {
            userId: admin.id,
            type: TransactionType.PLATFORM_FEE,
            amount: 1500, // 15.00 EUR
            status: TransactionStatus.COMPLETED,
            description: 'Commission sur mission #123'
        }
    });

    // Create a Service for marketplace testing
    console.log('🛍️ Creating Services...');
    await prisma.service.create({
        data: {
            profileId: extras[2].profile!.id || extras[2].id, // Ensure we have profile ID. Actually extras[2] is User. Getting profile ID via connect is better locally but we need the ID.
            // Wait, creating nested connects is complex if we don't have the ID handy. 
            // Let's refetch extra 2 with profile to get the ID.
            // Or just use connect on create.
            // However, for service creation, we need profileId as literal string according to schema? 
            // Checking schema: profileId String. And profile Relation.
            // Correct approach:
            profile: { connect: { userId: extras[2].id } },
            name: "Atelier Art-Thérapie",
            slug: "atelier-art-therapie-lyon",
            description: "Un atelier pour s'exprimer par l'art.",
            type: ServiceType.WORKSHOP,
            basePrice: 150.0,
            isActive: true
        }
    })

    console.log('✅ Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });