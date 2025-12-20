'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { CheckCircle2, MessageCircle, Plus, Sparkles, TrendingUp } from 'lucide-react';
import { CreateActionModal, type CreateActionModalUser } from '@/components/create/CreateActionModal';
import { SocialPostCard, type SocialPostCardItem } from '@/components/feed/SocialPostCard';
import type { NewsItem } from './NewsWidget';
import type { SuccessItem } from './SuccessWidget';

export interface SidebarData {
    news: NewsItem[];
    recentSuccess: SuccessItem[];
}

type SidebarCategory = { label: string; count: number };

export interface FeedSidebarStats {
    missions: number;
    services: number;
}

export interface FeedSidebarProps {
    isLoading: boolean;
    posts: SocialPostCardItem[];
    topCategories: SidebarCategory[];
    stats: FeedSidebarStats;
    canPublish: boolean;
    user?: CreateActionModalUser | null;
}

function SidebarCard({
    icon: Icon,
    title,
    action,
    children,
}: {
    icon: LucideIcon;
    title: string;
    action?: ReactNode;
    children: ReactNode;
}) {
    return (
        <section className="rounded-2xl border border-slate-200/70 bg-white shadow-sm">
            <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5 min-w-0">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-50 text-slate-700">
                        <Icon className="h-4 w-4" />
                    </span>
                    <h2 className="text-sm font-semibold text-slate-900 truncate">{title}</h2>
                </div>
                {action ? <div className="shrink-0">{action}</div> : null}
            </header>
            <div className="p-5">{children}</div>
        </section>
    );
}

export function FeedSidebar({ isLoading, posts, topCategories, stats, canPublish, user }: FeedSidebarProps) {
    return (
        <aside className="lg:col-span-3">
            <div className="space-y-6 lg:sticky lg:top-24 z-40">
                <section className="rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-sm overflow-hidden">
                    <div className="px-5 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <Sparkles className="h-5 w-5 text-white/90" />
                            <h2 className="text-sm font-semibold tracking-tight">Cette semaine</h2>
                        </div>
                        <Link
                            href="/dashboard"
                            className="text-xs font-medium text-white/80 hover:text-white transition-colors"
                        >
                            Voir
                        </Link>
                    </div>
                    <div className="px-5 pb-5 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-white/15 backdrop-blur-sm p-3">
                            <p className="text-2xl font-semibold leading-none">{stats.missions}</p>
                            <p className="mt-1 text-xs text-white/80">Missions</p>
                        </div>
                        <div className="rounded-xl bg-white/15 backdrop-blur-sm p-3">
                            <p className="text-2xl font-semibold leading-none">{stats.services}</p>
                            <p className="mt-1 text-xs text-white/80">Experts</p>
                        </div>
                    </div>
                </section>

                <SidebarCard
                    icon={TrendingUp}
                    title="Veille"
                    action={
                        <Link href="/search" className="text-xs font-medium text-indigo-700 hover:underline">
                            Explorer
                        </Link>
                    }
                >
                    {topCategories.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {topCategories.map((category) => (
                                <span
                                    key={category.label}
                                    className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                                >
                                    <span className="truncate max-w-[14rem]">{category.label}</span>
                                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600 border border-slate-200">
                                        {category.count}
                                    </span>
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500">Aucune tendance pour l'instant.</p>
                    )}
                </SidebarCard>

                <SidebarCard icon={CheckCircle2} title="Succès">
                    <ul className="space-y-3 text-sm">
                        <li className="flex items-start gap-3">
                            <span className="mt-1 h-2 w-2 rounded-full bg-teal-500" />
                            <span className="text-slate-700">Complétez votre profil pour inspirer confiance.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="mt-1 h-2 w-2 rounded-full bg-indigo-500" />
                            <span className="text-slate-700">Publiez une offre ou un besoin pour accélérer les matchs.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="mt-1 h-2 w-2 rounded-full bg-rose-500" />
                            <span className="text-slate-700">Répondez rapidement aux messages pour augmenter votre conversion.</span>
                        </li>
                    </ul>
                </SidebarCard>

                <SidebarCard
                    icon={MessageCircle}
                    title="Communauté"
                    action={
                        canPublish && user ? (
                            <CreateActionModal
                                user={user}
                                trigger={
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Publier
                                    </button>
                                }
                            />
                        ) : (
                            <Link href="/auth/login" className="text-xs font-medium text-indigo-700 hover:underline">
                                Se connecter
                            </Link>
                        )
                    }
                >
                    {isLoading && posts.length === 0 ? (
                        <div className="space-y-3">
                            {Array.from({ length: 2 }).map((_, index) => (
                                <div key={index} className="h-40 rounded-2xl bg-slate-100 animate-pulse" />
                            ))}
                        </div>
                    ) : posts.length > 0 ? (
                        <div className="space-y-4">
                            {posts.slice(0, 3).map((post) => (
                                <SocialPostCard key={post.id} item={post} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500">
                            Aucune actu pour l'instant. Partagez une info utile pour lancer la discussion.
                        </p>
                    )}
                </SidebarCard>
            </div>
        </aside>
    );
}

