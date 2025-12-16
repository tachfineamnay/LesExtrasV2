'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Calendar, Home, MessageCircle, Siren, LogIn } from 'lucide-react';

const NAV_ITEMS = [
    { href: '/wall', label: 'Wall', icon: Home },
    { href: '/dashboard/relief', label: 'SOS', icon: Siren, highlight: true },
    { href: '/bookings', label: 'Agenda', icon: Calendar },
    { href: '/messages', label: 'Messages', icon: MessageCircle },
];

export function DesktopTopNav() {
    const pathname = usePathname();

    if (pathname.startsWith('/auth/')) {
        return null;
    }

    return (
        <header className="hidden lg:block sticky top-0 z-50">
            <div className="glass border-b border-white/60">
                <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-6">
                    <Link href="/wall" className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#FF6B6B] via-[#FF6B6B] to-indigo-500 shadow-soft flex items-center justify-center">
                            <span className="text-white font-semibold tracking-tight">LX</span>
                        </div>
                        <span className="text-lg font-semibold text-slate-900 tracking-tight">
                            Les<span className="text-gradient">Extras</span>
                        </span>
                    </Link>

                    <nav className="flex items-center gap-2">
                        {NAV_ITEMS.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                            const isHighlight = item.highlight;

                            if (isHighlight) {
                                return (
                                    <Link key={item.href} href={item.href} className="relative">
                                        <motion.span
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-[#FF6B6B] to-orange-500 text-white font-semibold shadow-soft"
                                        >
                                            <Icon className="h-4 w-4" />
                                            {item.label}
                                        </motion.span>
                                    </Link>
                                );
                            }

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold tracking-tight transition-colors ${
                                        isActive
                                            ? 'bg-slate-900/5 text-slate-900'
                                            : 'text-slate-600 hover:bg-slate-900/5 hover:text-slate-900'
                                    }`}
                                >
                                    <Icon className={`h-4 w-4 ${isActive ? 'text-[#FF6B6B]' : 'text-slate-400'}`} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <Link href="/auth/login" className="btn-primary">
                        <LogIn className="h-4 w-4" />
                        Se connecter
                    </Link>
                </div>
            </div>
        </header>
    );
}

