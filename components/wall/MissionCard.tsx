'use client';

import type { MouseEvent } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, Euro, Calendar, Zap, Clock, Building2, ArrowRight } from 'lucide-react';

// ===========================================
// MISSION CARD - Design "Split Content" SEO
// Structure: Header Contexte + Body Détails + Footer CTA
// Palette: Rose-500 / Slate-900
// SEO: <article>, <h3>, <p>, micro-data ready
// ===========================================

export interface MissionCardProps {
    data: any;
    onClick?: () => void;
}

const urgencyConfig = {
    LOW: { label: 'Sous 1 semaine', color: 'bg-slate-100 text-slate-600', urgent: false, dot: 'bg-slate-400' },
    MEDIUM: { label: 'Sous 48h', color: 'bg-amber-100 text-amber-700', urgent: false, dot: 'bg-amber-500' },
    HIGH: { label: 'Sous 24h', color: 'bg-orange-100 text-orange-700', urgent: true, dot: 'bg-orange-500' },
    CRITICAL: { label: 'Urgent', color: 'bg-rose-100 text-rose-700', urgent: true, dot: 'bg-rose-500' },
};

const getInitials = (value?: string) => {
    if (!value) return 'LX';
    const parts = value.split(' ').filter(Boolean);
    if (parts.length === 0) return 'LX';
    return parts.map((part) => part[0]?.toUpperCase()).join('').slice(0, 2);
};

const formatRelativeTime = (value?: string | Date | null) => {
    if (!value) return '';
    const date = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(date.getTime())) return '';

    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

    if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    const diffDays = Math.round(diffHours / 24);
    return `Il y a ${diffDays}j`;
};

const formatDate = (value?: string | Date | null) => {
    if (!value) return '';
    const date = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

export function MissionCard({ data, onClick }: MissionCardProps) {
    const mission = data || {};
    const missionId = mission?.id;
    const establishment = mission?.client?.establishment?.name || mission?.establishment || mission?.authorName || 'Établissement';
    const establishmentLogo = mission?.client?.establishment?.logoUrl || mission?.establishmentLogo;
    const establishmentType = mission?.client?.establishment?.type || mission?.establishmentType || '';
    const city = mission?.city || mission?.client?.establishment?.city || 'Non précisé';
    const description = mission?.description || mission?.content || mission?.context || '';
    const urgencyLevel = (mission?.urgencyLevel || 'MEDIUM') as keyof typeof urgencyConfig;
    const hourlyRate = mission?.hourlyRate !== undefined && mission?.hourlyRate !== null ? Number(mission.hourlyRate) : null;
    const totalPrice = mission?.totalPrice !== undefined ? Number(mission.totalPrice) : null;
    const missionTitle = mission?.title || mission?.jobTitle || 'Mission';
    const jobType = mission?.jobTitle || mission?.missionType || '';
    const startDate = mission?.startDate;
    const endDate = mission?.endDate;
    const isNightShift = Boolean(mission?.isNightShift);
    const postedLabel = formatRelativeTime(mission?.createdAt);
    const detailHref = missionId ? `/need/${missionId}` : undefined;
    const urgency = urgencyConfig[urgencyLevel];
    const isUrgent = urgency.urgent;
    const router = useRouter();

    // Tags/Skills pour SEO
    const rawTags = Array.isArray(mission?.requiredSkills) 
        ? mission.requiredSkills 
        : Array.isArray(mission?.tags) 
            ? mission.tags 
            : [];
    const tags: string[] = rawTags.filter((tag: unknown): tag is string => typeof tag === 'string' && tag.trim().length > 0).slice(0, 3);

    const handleViewMission = (event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        event.preventDefault();
        if (!missionId) return;
        router.push(`/dashboard/missions/${missionId}`);
    };

    const card = (
        <motion.article
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="group relative bg-white rounded-2xl overflow-hidden cursor-pointer
                       shadow-soft hover:shadow-soft-lg
                       transition-all duration-300"
            itemScope
            itemType="https://schema.org/JobPosting"
        >
            {/* ========== HEADER (Contexte Établissement) ========== */}
            <div className="relative bg-gradient-to-br from-slate-50 to-slate-100 px-5 py-4">
                {/* Motif géométrique subtil */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30z' fill='%23000' fill-opacity='1'/%3E%3C/svg%3E")`,
                    backgroundSize: '30px 30px'
                }} />

                <div className="relative flex items-center gap-3">
                    {/* Logo Établissement */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white flex items-center justify-center overflow-hidden shadow-sm border border-slate-200">
                        {establishmentLogo ? (
                            <img
                                src={establishmentLogo}
                                alt={`Logo ${establishment}`}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                decoding="async"
                            />
                        ) : (
                            <Building2 className="w-6 h-6 text-slate-400" />
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate" itemProp="hiringOrganization">
                            {establishment}
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            <span>{postedLabel}</span>
                            {establishmentType && (
                                <>
                                    <span>•</span>
                                    <span>{establishmentType}</span>
                                </>
                            )}
                        </p>
                    </div>

                    {/* Badge Urgence */}
                    <div className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${urgency.color}`}>
                        {isUrgent && <Zap className="w-3 h-3" />}
                        <span className={`w-1.5 h-1.5 rounded-full ${urgency.dot} ${isUrgent ? 'animate-pulse' : ''}`} />
                        {urgency.label}
                    </div>
                </div>
            </div>

            {/* ========== BODY (Détails Mission) ========== */}
            <div className="p-5">
                {/* Titre du Poste SEO */}
                <h3 
                    className="text-lg font-bold text-slate-900 leading-tight line-clamp-1 group-hover:text-rose-600 transition-colors"
                    itemProp="title"
                >
                    {missionTitle}
                </h3>

                {/* Type de poste */}
                {jobType && jobType !== missionTitle && (
                    <p className="text-sm text-rose-600 font-medium mt-1" itemProp="occupationalCategory">
                        {jobType} {isNightShift && '🌙'}
                    </p>
                )}

                {/* Description/Contexte SEO (VITAL) */}
                {description && (
                    <p 
                        className="text-sm text-slate-600 mt-3 line-clamp-2 leading-relaxed"
                        itemProp="description"
                    >
                        {description}
                    </p>
                )}

                {/* Grid Infos */}
                <div className="grid grid-cols-3 gap-2 mt-4">
                    {/* Lieu */}
                    <div className="flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl bg-slate-50 text-center">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-medium text-slate-700 truncate w-full" itemProp="jobLocation">
                            {city}
                        </span>
                    </div>

                    {/* Date */}
                    <div className="flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl bg-slate-50 text-center">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-medium text-slate-700">
                            {startDate ? formatDate(startDate) : 'ASAP'}
                        </span>
                    </div>

                    {/* Tarif */}
                    <div className="flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl bg-rose-50 text-center">
                        <Euro className="w-4 h-4 text-rose-500" />
                        <span className="text-xs font-bold text-rose-700" itemProp="baseSalary">
                            {hourlyRate !== null ? `${hourlyRate}€/h` : totalPrice !== null ? `${totalPrice}€` : 'À définir'}
                        </span>
                    </div>
                </div>

                {/* Tags/Skills SEO */}
                {tags.length > 0 && (
                    <ul className="flex flex-wrap gap-1.5 mt-3" aria-label="Compétences requises">
                        {tags.map((tag, index) => (
                            <li 
                                key={index}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 text-xs text-slate-600 font-medium"
                                itemProp="skills"
                            >
                                {tag}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* ========== FOOTER (CTA Pleine Largeur) ========== */}
            <div className="px-5 pb-5">
                <button
                    type="button"
                    onClick={handleViewMission}
                    className="w-full inline-flex items-center justify-center gap-2 
                               px-4 py-3 rounded-xl 
                               border-2 border-rose-200 
                               text-rose-600 text-sm font-semibold
                               hover:bg-rose-50 hover:border-rose-300
                               active:scale-[0.98] transition-all"
                    aria-label={`Voir l'offre ${missionTitle}`}
                >
                    Voir l'offre
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>

            {/* Border Effect au survol */}
            <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-rose-200 transition-colors pointer-events-none" />
        </motion.article>
    );

    return detailHref ? (
        <Link href={detailHref} className="block h-full">
            {card}
        </Link>
    ) : (
        card
    );
}
