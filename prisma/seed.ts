import {
  BookingStatus,
  MissionStatus,
  MissionUrgency,
  PostType,
  PrismaClient,
  ServiceType,
  TransactionStatus,
  TransactionType,
  UserStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const hoursFromNow = (hours: number) => new Date(Date.now() + hours * 60 * 60 * 1000);
const daysFromNow = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);
const hoursAgo = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000);

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);

const pic = (seed: string, width = 1200, height = 800) =>
  `https://picsum.photos/seed/${seed}/${width}/${height}`;
const avatar = (img: number) => `https://i.pravatar.cc/150?img=${img}`;

async function main() {
  console.log('🌱 Seeding database (Wall MVP)...');

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

  console.log('👤 Creating admin...');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@lesextras.fr',
      passwordHash,
      role: 'ADMIN',
      status: UserStatus.VERIFIED,
      walletBalance: 500000,
      profile: {
        create: {
          firstName: 'Admin',
          lastName: 'System',
          bio: 'Super Admin',
          specialties: [],
          diplomas: [],
        },
      },
    },
  });

  console.log('🏢 Creating clients (establishments)...');
  const clientsData = [
    {
      email: 'ehpad.paris@exemple.fr',
      name: 'EHPAD Les Jardins',
      type: 'EHPAD',
      city: 'Paris',
      postalCode: '75004',
      address: '12 Rue de Rivoli',
      latitude: 48.8566,
      longitude: 2.3522,
      description: "EHPAD familial, besoins réguliers en renforts de nuit.",
    },
    {
      email: 'ime.paris@exemple.fr',
      name: "IME L'Espoir",
      type: 'IME',
      city: 'Paris',
      postalCode: '75001',
      address: '150 Rue Saint-Honoré',
      latitude: 48.8606,
      longitude: 2.3376,
      description: 'IME spécialisé TSA, accompagnements éducatifs et ateliers.',
    },
    {
      email: 'creche.lyon@exemple.fr',
      name: 'Crèche Les Petits Pas',
      type: 'Crèche',
      city: 'Lyon',
      postalCode: '69002',
      address: '5 Place Bellecour',
      latitude: 45.764,
      longitude: 4.8357,
      description: "Crèche associative, renforts réguliers sur les pics d’activité.",
    },
    {
      email: 'mecs.lille@exemple.fr',
      name: 'MECS Horizon',
      type: 'MECS',
      city: 'Lille',
      postalCode: '59000',
      address: '8 Rue Nationale',
      latitude: 50.62925,
      longitude: 3.057256,
      description: "Maison d’enfants, besoins en éducateurs et veilles.",
    },
    {
      email: 'foyer.bordeaux@exemple.fr',
      name: 'Foyer Les Amandiers',
      type: 'Foyer de vie',
      city: 'Bordeaux',
      postalCode: '33000',
      address: '20 Cours de l’Intendance',
      latitude: 44.841225,
      longitude: -0.574,
      description: 'Foyer de vie pour adultes, missions de jour et week-end.',
    },
    {
      email: 'ehpad.nantes@exemple.fr',
      name: 'Résidence Beau Séjour',
      type: 'EHPAD',
      city: 'Nantes',
      postalCode: '44000',
      address: '3 Rue de Strasbourg',
      latitude: 47.2184,
      longitude: -1.5536,
      description: 'Résidence seniors, renforts ponctuels sur périodes chargées.',
    },
    {
      email: 'cms.marseille@exemple.fr',
      name: 'Centre Médico-Social Prado',
      type: 'CMS',
      city: 'Marseille',
      postalCode: '13008',
      address: '10 Avenue du Prado',
      latitude: 43.2677,
      longitude: 5.382,
      description: 'CMS, consultations et suivis, besoins en profils polyvalents.',
    },
    {
      email: 'sse.toulouse@exemple.fr',
      name: 'Service Social Enfance Garonne',
      type: 'Service social',
      city: 'Toulouse',
      postalCode: '31000',
      address: '15 Rue d’Alsace-Lorraine',
      latitude: 43.6047,
      longitude: 1.4442,
      description: 'Accompagnement familles, besoins en renfort éducatif & visio.',
    },
  ];

  const clients: any[] = [];
  for (let index = 0; index < clientsData.length; index += 1) {
    const data = clientsData[index];
    const client = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        role: 'CLIENT',
        status: UserStatus.VERIFIED,
        walletBalance: 200000,
        establishment: {
          create: {
            name: data.name,
            type: data.type,
            city: data.city,
            address: data.address,
            postalCode: data.postalCode,
            latitude: data.latitude,
            longitude: data.longitude,
            description: data.description,
            contactName: 'Direction',
            contactRole: 'Direction',
            siret: `SEED${String(index + 1).padStart(12, '0')}`,
            logoUrl: pic(`est-${slugify(data.name)}`, 128, 128),
          },
        },
      },
      include: { establishment: true },
    });
    clients.push(client);
  }

  console.log('🧑‍⚕️ Creating extras...');
  const extrasData = [
    {
      email: 'jean.dupont@exemple.fr',
      firstName: 'Jean',
      lastName: 'Dupont',
      headline: 'Infirmier - Renfort de nuit',
      city: 'Paris',
      postalCode: '75011',
      latitude: 48.857,
      longitude: 2.38,
      hourlyRate: 35,
      isVideoEnabled: false,
      specialties: ['soins', 'nuit', 'gériatrie'],
      avatarImg: 12,
    },
    {
      email: 'marie.curie@exemple.fr',
      firstName: 'Marie',
      lastName: 'Curie',
      headline: 'Aide-soignante - EHPAD & domicile',
      city: 'Paris',
      postalCode: '75004',
      latitude: 48.8566,
      longitude: 2.3522,
      hourlyRate: 28,
      isVideoEnabled: false,
      specialties: ['toilette', 'repas', 'EHPAD'],
      avatarImg: 32,
    },
    {
      email: 'paul.verlaine@exemple.fr',
      firstName: 'Paul',
      lastName: 'Verlaine',
      headline: 'Éducateur spécialisé - TSA',
      city: 'Lyon',
      postalCode: '69002',
      latitude: 45.764,
      longitude: 4.8357,
      hourlyRate: 32,
      isVideoEnabled: true,
      specialties: ['autisme', 'adolescents', 'TSA'],
      avatarImg: 5,
    },
    {
      email: 'ines.martin@exemple.fr',
      firstName: 'Inès',
      lastName: 'Martin',
      headline: 'Coach parental - Educat’heure',
      city: 'Nantes',
      postalCode: '44000',
      latitude: 47.2184,
      longitude: -1.5536,
      hourlyRate: 55,
      isVideoEnabled: true,
      specialties: ['parentalité', 'routines', 'visio'],
      avatarImg: 47,
    },
    {
      email: 'yassine.ben@exemple.fr',
      firstName: 'Yassine',
      lastName: 'Benali',
      headline: 'Psychomotricien - Ateliers seniors',
      city: 'Bordeaux',
      postalCode: '33000',
      latitude: 44.841225,
      longitude: -0.574,
      hourlyRate: 45,
      isVideoEnabled: false,
      specialties: ['motricité', 'seniors', 'stimulation'],
      avatarImg: 19,
    },
    {
      email: 'clara.durand@exemple.fr',
      firstName: 'Clara',
      lastName: 'Durand',
      headline: 'Orthophoniste - Troubles DYS',
      city: 'Lille',
      postalCode: '59000',
      latitude: 50.62925,
      longitude: 3.057256,
      hourlyRate: 60,
      isVideoEnabled: true,
      specialties: ['dyslexie', 'langage', 'visio'],
      avatarImg: 23,
    },
    {
      email: 'adam.cherif@exemple.fr',
      firstName: 'Adam',
      lastName: 'Chérif',
      headline: 'Médiateur - Gestion de conflits',
      city: 'Marseille',
      postalCode: '13008',
      latitude: 43.2677,
      longitude: 5.382,
      hourlyRate: 42,
      isVideoEnabled: true,
      specialties: ['médiation', 'conflits', 'visio'],
      avatarImg: 8,
    },
    {
      email: 'sarah.lopez@exemple.fr',
      firstName: 'Sarah',
      lastName: 'Lopez',
      headline: 'Éducatrice jeunes enfants - Crèche',
      city: 'Lyon',
      postalCode: '69007',
      latitude: 45.7485,
      longitude: 4.8467,
      hourlyRate: 30,
      isVideoEnabled: false,
      specialties: ['petite_enfance', 'animation', 'crèche'],
      avatarImg: 41,
    },
    {
      email: 'lucas.moreau@exemple.fr',
      firstName: 'Lucas',
      lastName: 'Moreau',
      headline: 'Éducateur - MECS & veilles',
      city: 'Lille',
      postalCode: '59800',
      latitude: 50.636,
      longitude: 3.063,
      hourlyRate: 34,
      isVideoEnabled: false,
      specialties: ['mecs', 'veilles', 'groupe'],
      avatarImg: 15,
    },
    {
      email: 'emma.roux@exemple.fr',
      firstName: 'Emma',
      lastName: 'Roux',
      headline: 'Art-thérapeute - Ateliers créatifs',
      city: 'Paris',
      postalCode: '75020',
      latitude: 48.863,
      longitude: 2.401,
      hourlyRate: 48,
      isVideoEnabled: true,
      specialties: ['art_therapie', 'émotions', 'visio'],
      avatarImg: 27,
    },
    {
      email: 'mohamed.ali@exemple.fr',
      firstName: 'Mohamed',
      lastName: 'Ali',
      headline: 'Animateur - Sport adapté',
      city: 'Toulouse',
      postalCode: '31000',
      latitude: 43.6047,
      longitude: 1.4442,
      hourlyRate: 33,
      isVideoEnabled: false,
      specialties: ['sport_adapté', 'cohésion', 'motivation'],
      avatarImg: 36,
    },
    {
      email: 'lea.petit@exemple.fr',
      firstName: 'Léa',
      lastName: 'Petit',
      headline: 'Conseillère - Suivi famille (visio)',
      city: 'Paris',
      postalCode: '75015',
      latitude: 48.842,
      longitude: 2.293,
      hourlyRate: 52,
      isVideoEnabled: true,
      specialties: ['suivi_famille', 'visio', 'accompagnement'],
      avatarImg: 2,
    },
  ];

  const extras: any[] = [];
  for (let index = 0; index < extrasData.length; index += 1) {
    const data = extrasData[index];
    const extra = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        role: 'EXTRA',
        status: UserStatus.VERIFIED,
        stripeAccountId: `acct_seed_${index + 1}`,
        stripeOnboarded: true,
        profile: {
          create: {
            firstName: data.firstName,
            lastName: data.lastName,
            avatarUrl: avatar(data.avatarImg),
            headline: data.headline,
            bio: `Disponible pour des missions de renfort et/ou des sessions visio. ${data.headline}.`,
            city: data.city,
            postalCode: data.postalCode,
            latitude: data.latitude,
            longitude: data.longitude,
            specialties: data.specialties,
            diplomas: [{ name: "Diplôme d'État", year: 2018 }],
            hourlyRate: data.hourlyRate,
            isVideoEnabled: data.isVideoEnabled,
            averageRating: 4.6,
            totalReviews: 18,
          },
        },
      },
      include: { profile: true },
    });
    extras.push(extra);
  }

  console.log('🛍️ Creating services (workshop + visio)...');
  const workshopTemplates = [
    {
      name: 'Atelier Boxe éducative',
      category: 'Sport adapté',
      tags: ['sport', 'cohésion', 'gestion_émotion'],
      basePrice: 70,
      shortDescription:
        'Un atelier structuré pour canaliser l’énergie et renforcer la confiance.',
    },
    {
      name: 'Atelier Mémoire',
      category: 'Seniors',
      tags: ['mémoire', 'stimulation', 'seniors'],
      basePrice: 55,
      shortDescription: 'Stimulation cognitive douce, ludique et progressive.',
    },
    {
      name: 'Atelier Arts & émotions',
      category: 'Art-thérapie',
      tags: ['créatif', 'émotions', 'expression'],
      basePrice: 65,
      shortDescription: 'Créer pour apaiser : une bulle créative guidée.',
    },
    {
      name: 'Atelier Motricité',
      category: 'Psychomotricité',
      tags: ['motricité', 'coordination', 'équilibre'],
      basePrice: 60,
      shortDescription: 'Parcours et jeux moteurs adaptés à tous les niveaux.',
    },
    {
      name: 'Atelier Cuisine & autonomie',
      category: 'Petite enfance',
      tags: ['cuisine', 'autonomie', 'sensoriel'],
      basePrice: 58,
      shortDescription: 'Une activité sensorielle et éducative, simple et sécurisée.',
    },
    {
      name: 'Atelier Cohésion de groupe',
      category: 'Éducatif',
      tags: ['groupe', 'règles', 'collectif'],
      basePrice: 62,
      shortDescription: 'Structurer le collectif et faciliter les interactions.',
    },
  ];

  const videoTemplates = [
    {
      name: 'Coaching parental (Visio)',
      category: "Eduat'heure",
      tags: ['visio', 'parentalité', '1:1'],
      basePrice: 60,
      shortDescription:
        'Un rendez-vous clair pour débloquer une situation du quotidien.',
    },
    {
      name: 'Suivi éducatif (Visio)',
      category: "Eduat'heure",
      tags: ['visio', 'suivi', 'routines'],
      basePrice: 55,
      shortDescription: 'Un accompagnement régulier, simple et actionnable.',
    },
    {
      name: 'Bilan express (Visio)',
      category: 'Accompagnement',
      tags: ['visio', 'bilan', 'conseils'],
      basePrice: 50,
      shortDescription: "45 minutes pour poser un plan d’action concret.",
    },
  ];

  const createdServices: Array<{
    id: string;
    type: ServiceType;
    basePrice: number | null;
    providerId: string;
  }> = [];

  let serviceCounter = 1;
  for (let index = 0; index < extras.length; index += 1) {
    const extra = extras[index];
    const profile = extra.profile;
    if (!profile) continue;

    const workshop = workshopTemplates[index % workshopTemplates.length];
    const workshopSlug = [
      slugify(workshop.name),
      slugify(`${profile.firstName}-${profile.lastName}`),
      String(serviceCounter),
    ].join('-');
    serviceCounter += 1;

    const workshopService = await prisma.service.create({
      data: {
        profileId: profile.id,
        name: workshop.name,
        slug: workshopSlug,
        description: `${workshop.shortDescription}\n\n${profile.headline || ''}`.trim(),
        shortDescription: workshop.shortDescription,
        type: ServiceType.WORKSHOP,
        category: workshop.category,
        basePrice: workshop.basePrice,
        minParticipants: 3,
        maxParticipants: 12,
        ageGroups: ['6-12 ans', 'Ados', 'Adultes'],
        tags: workshop.tags,
        imageUrl: pic(`svc-${workshopSlug}`),
        galleryUrls: [pic(`svc-${workshopSlug}-2`), pic(`svc-${workshopSlug}-3`)],
      },
    });

    createdServices.push({
      id: workshopService.id,
      type: ServiceType.WORKSHOP,
      basePrice: workshop.basePrice,
      providerId: profile.userId,
    });

    if (!profile.isVideoEnabled) continue;

    const video = videoTemplates[index % videoTemplates.length];
    const videoSlug = [
      slugify(video.name),
      slugify(`${profile.firstName}-${profile.lastName}`),
      String(serviceCounter),
    ].join('-');
    serviceCounter += 1;

    const videoService = await prisma.service.create({
      data: {
        profileId: profile.id,
        name: video.name,
        slug: videoSlug,
        description: `${video.shortDescription}\n\nObjectif : repartir avec des actions concrètes.`,
        shortDescription: video.shortDescription,
        type: ServiceType.COACHING_VIDEO,
        category: video.category,
        basePrice: video.basePrice,
        minParticipants: 1,
        maxParticipants: 1,
        ageGroups: ['Parents', 'Adultes'],
        tags: video.tags,
        imageUrl: pic(`svc-${videoSlug}`),
      },
    });

    createdServices.push({
      id: videoService.id,
      type: ServiceType.COACHING_VIDEO,
      basePrice: video.basePrice,
      providerId: profile.userId,
    });
  }

  console.log('🆘 Creating relief missions (SOS renfort)...');
  const openMissions = [
    {
      clientIndex: 0,
      title: 'Renfort IDE Nuit - urgence',
      description: 'Remplacement arrêt maladie. Besoin cette nuit.',
      jobTitle: 'Infirmier',
      urgencyLevel: MissionUrgency.CRITICAL,
      startInHours: 6,
      durationHours: 8,
      hourlyRate: 38,
      skills: ['nuit', 'soins', 'EHPAD'],
    },
    {
      clientIndex: 1,
      title: 'Renfort éducateur TSA (week-end)',
      description: 'Accompagnement atelier et temps collectif.',
      jobTitle: 'Éducateur spécialisé',
      urgencyLevel: MissionUrgency.HIGH,
      startInHours: 18,
      durationHours: 7,
      hourlyRate: 32,
      skills: ['TSA', 'groupe', 'communication'],
    },
    {
      clientIndex: 2,
      title: 'Renfort crèche - ouverture',
      description: 'Besoin sur l’accueil du matin + activités.',
      jobTitle: 'EJE',
      urgencyLevel: MissionUrgency.HIGH,
      startInHours: 28,
      durationHours: 6,
      hourlyRate: 28,
      skills: ['petite_enfance', 'animation', 'sécurité'],
    },
    {
      clientIndex: 3,
      title: 'Veille éducative - nuit',
      description: 'Veille en MECS, présence sécurisante.',
      jobTitle: 'Éducateur',
      urgencyLevel: MissionUrgency.MEDIUM,
      startInHours: 36,
      durationHours: 10,
      hourlyRate: 30,
      skills: ['veilles', 'mecs', 'gestion_crise'],
    },
    {
      clientIndex: 4,
      title: 'Atelier motricité - adultes',
      description: 'Animation + accompagnement, profil psychomotricien apprécié.',
      jobTitle: 'Psychomotricien',
      urgencyLevel: MissionUrgency.MEDIUM,
      startInHours: 44,
      durationHours: 4,
      hourlyRate: 42,
      skills: ['motricité', 'équilibre', 'adapté'],
    },
    {
      clientIndex: 6,
      title: 'Renfort médiation - situation tendue',
      description: 'Apaiser un conflit et remettre du cadre.',
      jobTitle: 'Médiateur',
      urgencyLevel: MissionUrgency.CRITICAL,
      startInHours: 12,
      durationHours: 5,
      hourlyRate: 45,
      skills: ['médiation', 'conflits', 'cadre'],
    },
  ];

  for (const mission of openMissions) {
    const client = clients[mission.clientIndex];
    const est = client?.establishment;
    if (!client || !est) continue;

    const startDate = hoursFromNow(mission.startInHours);
    const endDate = hoursFromNow(mission.startInHours + mission.durationHours);
    const estimatedHours = mission.durationHours;
    const totalBudget = Math.round(mission.hourlyRate * estimatedHours * 100) / 100;

    await prisma.reliefMission.create({
      data: {
        clientId: client.id,
        title: mission.title,
        description: mission.description,
        jobTitle: mission.jobTitle,
        urgencyLevel: mission.urgencyLevel,
        status: MissionStatus.OPEN,
        startDate,
        endDate,
        hourlyRate: mission.hourlyRate,
        estimatedHours,
        totalBudget,
        address: est.address || 'Adresse à préciser',
        city: est.city,
        postalCode: est.postalCode || '',
        latitude: est.latitude,
        longitude: est.longitude,
        requiredSkills: mission.skills,
        requiredDiplomas: ["Diplôme d'État"],
        isNightShift: mission.title.toLowerCase().includes('nuit'),
      },
    });
  }

  console.log('📰 Creating wall posts (offers + needs)...');
  const offerTemplates = [
    {
      title: 'Disponible cette semaine',
      content: 'Réactivité, ponctualité, et expérience en établissement.',
      category: 'Renfort',
    },
    {
      title: 'Atelier collectif clé en main',
      content: 'Je propose un atelier structuré avec objectifs, matériel et suivi.',
      category: 'Atelier',
    },
    {
      title: 'Accompagnement individualisé',
      content: 'Approche bienveillante, plan d’action concret, retours réguliers.',
      category: 'Accompagnement',
    },
  ];

  for (let index = 0; index < extras.length; index += 1) {
    const extra = extras[index];
    const profile = extra.profile;
    if (!profile) continue;

    const template = offerTemplates[index % offerTemplates.length];
    const specialties = Array.isArray(profile.specialties)
      ? (profile.specialties as unknown[])
      : [];
    const specialtyTags = specialties
      .filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0)
      .slice(0, 4);

    const tags = profile.isVideoEnabled ? ['visio', ...specialtyTags] : ['terrain', ...specialtyTags];

    await prisma.post.create({
      data: {
        authorId: extra.id,
        type: PostType.OFFER,
        title: `${template.title} · ${profile.headline || 'Profil'}`,
        content: template.content,
        city: profile.city || undefined,
        postalCode: profile.postalCode || undefined,
        tags,
        category: profile.isVideoEnabled ? 'Visio' : template.category,
        validUntil: daysFromNow(14),
        createdAt: hoursAgo(2 + index),
        imageUrls: [pic(`post-offer-${index + 1}`, 900, 600)],
      },
    });
  }

  const needTemplates = [
    {
      title: 'Besoin renfort éducateur demain',
      content: 'Mission courte, équipe bienveillante, prise de poste rapide.',
      tags: ['urgent', 'renfort'],
      category: 'Renfort',
      validInDays: 5,
    },
    {
      title: 'Recherche profil pour atelier collectif',
      content: 'Objectif : cohésion, autonomie, activités structurées.',
      tags: ['atelier', 'collectif'],
      category: 'Atelier',
      validInDays: 14,
    },
    {
      title: 'Demande session visio Educat’heure',
      content: 'Accompagnement parental 1:1, créneaux en soirée possibles.',
      tags: ['visio', 'parentalité'],
      category: 'Visio',
      validInDays: 10,
    },
  ];

  for (let index = 0; index < clients.length; index += 1) {
    const client = clients[index];
    const est = client.establishment;
    const template = needTemplates[index % needTemplates.length];

    await prisma.post.create({
      data: {
        authorId: client.id,
        type: PostType.NEED,
        title: `${template.title} · ${est?.name || 'Établissement'}`,
        content: template.content,
        city: est?.city || undefined,
        postalCode: est?.postalCode || undefined,
        tags: template.tags,
        category: template.category,
        validUntil: daysFromNow(template.validInDays),
        createdAt: hoursAgo(1 + index),
        imageUrls: [pic(`post-need-${index + 1}`, 900, 600)],
      },
    });
  }

  console.log('📅 Creating a few bookings (agenda demo)...');
  const videoServices = createdServices.filter((service) => service.type === ServiceType.COACHING_VIDEO);
  const workshopServices = createdServices.filter((service) => service.type === ServiceType.WORKSHOP);

  const bookingSeeds = [
    {
      kind: 'VIDEO' as const,
      inDays: 1,
      time: '18:30',
      durationHours: 1,
      status: BookingStatus.PENDING,
      note: "Besoin d'un plan d'action concret pour les routines du soir.",
    },
    {
      kind: 'VIDEO' as const,
      inDays: 3,
      time: '20:00',
      durationHours: 1,
      status: BookingStatus.CONFIRMED,
      note: "Suivi visio : situation à l’école, communication et cadre.",
    },
    {
      kind: 'WORKSHOP' as const,
      inDays: 5,
      time: '14:00',
      durationHours: 2,
      status: BookingStatus.CONFIRMED,
      note: 'Atelier collectif : cohésion de groupe (12 pers).',
    },
    {
      kind: 'WORKSHOP' as const,
      inDays: 8,
      time: '10:00',
      durationHours: 2,
      status: BookingStatus.PENDING,
      note: 'Atelier mémoire pour seniors, groupe de 8 personnes.',
    },
  ];

  for (let index = 0; index < bookingSeeds.length; index += 1) {
    const seed = bookingSeeds[index];
    const client = clients[index % clients.length];

    const servicePool = seed.kind === 'VIDEO' ? videoServices : workshopServices;
    const pickedService = servicePool[index % Math.max(1, servicePool.length)];
    if (!pickedService) continue;

    const pricePerHour = pickedService.basePrice ?? 50;
    const totalPrice = pricePerHour * seed.durationHours;

    await prisma.booking.create({
      data: {
        clientId: client.id,
        providerId: pickedService.providerId,
        serviceId: pickedService.id,
        sessionDate: daysFromNow(seed.inDays),
        sessionTime: seed.time,
        totalPrice,
        status: seed.status,
        isVideoSession: seed.kind === 'VIDEO',
        clientNotes: seed.note,
      },
    });
  }

  console.log('💸 Creating a couple transactions...');
  await prisma.transaction.create({
    data: {
      userId: clients[0].id,
      type: TransactionType.MISSION_PAYMENT,
      amount: 28000,
      status: TransactionStatus.COMPLETED,
      description: 'Paiement mission SOS (seed)',
      stripePaymentId: 'pi_seed_001',
    },
  });

  await prisma.transaction.create({
    data: {
      userId: admin.id,
      type: TransactionType.PLATFORM_FEE,
      amount: 1500,
      status: TransactionStatus.COMPLETED,
      description: 'Commission plateforme (seed)',
    },
  });

  console.log('✅ Seed completed.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
