'use client';

import type { MouseEvent } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, Euro, Calendar, Zap, Clock, Building2, ArrowRight, Sun, Moon } from 'lucide-react';

// ===========================================
// MISSION CARD - Design "Job Board Pro"
// TYPE A : Utilitaire & Urgent
// Fond blanc pur + Bordure gauche Rose épaisse
// Focus : Data (Prix, Lieu, Date, Heure)
// ===========================================

export interface MissionCardProps {
    data: any;
    onClick?: () => void;
}

const urgencyConfig = {
    LOW: { label: 'Sous 1 semaine', color: 'bg-slate-100 text-slate-600', urgent: false, dot: 'bg-slate-400', border: 'border-l-slate-400' },
    MEDIUM: { label: 'Sous 48h', color: 'bg-amber-100 text-amber-700', urgent: false, dot: 'bg-amber-500', border: 'border-l-amber-500' },
    HIGH: { label: 'Sous 24h', color: 'bg-rose-100 text-rose-700', urgent: true, dot: 'bg-rose-500', border: 'border-l-rose-500' },
    CRITICAL: { label: 'Urgent !', color: 'bg-rose-500 text-white', urgent: true, dot: 'bg-white', border: 'border-l-rose-600' },
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
    return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
};

const formatTime = (value?: string | Date | null) => {
    if (!value) return '';
    const date = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
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
    const missionTitle = mission?.title || mission?.jobTitle || 'Mission de renfort';
    const jobType = mission?.jobTitle || mission?.missionType || '';
    const startDate = mission?.startDate;
    const isNightShift = Boolean(mission?.isNightShift);
    const postedLabel = formatRelativeTime(mission?.createdAt);
    const detailHref = missionId ? `/need/${missionId}` : undefined;
    const urgency = urgencyConfig[urgencyLevel];
    const isUrgent = urgency.urgent;
    const router = useRouter();

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

    const priceDisplay = hourlyRate !== null
        ? `${hourlyRate}€/h`
        : totalPrice !== null
            ? `${totalPrice}€`
            : 'À définir';

    const card = (
        <motion.article
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`group relative bg-white rounded-2xl overflow-hidden cursor-pointer
                       border-l-4 ${urgency.border}
                       shadow-soft hover:shadow-soft-lg
                       transition-all duration-300 h-full flex flex-col`}
            itemScope
            itemType="https://schema.org/JobPosting"
        >
            {/* HEADER */}
            <div className="px-5 pt-5 pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                            {establishmentLogo ? (
                                <img src={establishmentLogo} alt={establishment} className="w-full h-full object-cover" loading="lazy" />
                            ) : (
                                <Building2 className="w-5 h-5 text-slate-400" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate" itemProp="hiringOrganization">{establishment}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                <Clock className="w-3 h-3" />
                                <span>{postedLabel || 'Récemment'}</span>
                                {establishmentType && <><span>•</span><span className="truncate">{establishmentType}</span></>}
                            </p>
                        </div>
                    </div>
                    <motion.div
                        animate={isUrgent ? { scale: [1, 1.05, 1] } : {}}
                        transition={{ duration: 0.5, repeat: isUrgent ? Infinity : 0, repeatDelay: 2 }}
                        className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${urgency.color}`}
                    >
                        {isUrgent && <Zap className="w-3 h-3" />}
                        <span className={`w-1.5 h-1.5 rounded-full ${urgency.dot} ${isUrgent ? 'animate-pulse' : ''}`} />
                        {urgency.label}
                    </motion.div>
                </div>
            </div>

            {/* BODY */}
            <div className="p-5 flex-1">
                <h3 className="text-lg font-bold text-slate-900 leading-tight line-clamp-2 group-hover:text-rose-600 transition-colors" itemProp="title">
                    {missionTitle}
                </h3>
                {jobType && jobType !== missionTitle && (
                    <p className="text-sm text-rose-600 font-medium mt-1 flex items-center gap-1" itemProp="occupationalCategory">
                        {jobType}
                        {isNightShift && <span className="inline-flex items-center gap-0.5 ml-1 text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md"><Moon className="w-3 h-3" />Nuit</span>}
                    </p>
                )}
                {description && <p className="text-sm text-slate-600 mt-2 line-clamp-2 leading-relaxed" itemProp="description">{description}</p>}

                {/* DATA GRID */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                    <div className="flex flex-col items-center gap-1 px-3 py-3 rounded-xl bg-rose-50 border border-rose-100 text-center">
                        <Euro className="w-4 h-4 text-rose-500" />
                        <span className="text-sm font-bold text-rose-700" itemProp="baseSalary">{priceDisplay}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 px-3 py-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                        <MapPin className="w-4 h-4 text-slate-500" />
                        <span className="text-xs font-medium text-slate-700 truncate w-full" itemProp="jobLocation">{city}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 px-3 py-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <span className="text-xs font-medium text-slate-700">{startDate ? formatDate(startDate) : 'ASAP'}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 px-3 py-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                        {isNightShift ? <Moon className="w-4 h-4 text-indigo-500" /> : <Sun className="w-4 h-4 text-amber-500" />}
                        <span className="text-xs font-medium text-slate-700">{startDate ? formatTime(startDate) : 'À définir'}</span>
                    </div>
                </div>

                {tags.length > 0 && (
                    <ul className="flex flex-wrap gap-1.5 mt-3">
                        {tags.map((tag, index) => (
                            <li key={index} className="px-2.5 py-1 rounded-lg bg-slate-100 text-xs text-slate-600 font-medium">{tag}</li>
                        ))}
                    </ul>
                )}
            </div>

            {/* FOOTER */}
            <div className="px-5 pb-5 mt-auto">
                <button
                    type="button"
                    onClick={handleViewMission}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold shadow-sm hover:shadow-md active:scale-[0.98] transition-all"
                >
                    Postuler maintenant
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </motion.article>
    );

    return detailHref ? <Link href={detailHref} className="block h-full">{card}</Link> : card;
}
