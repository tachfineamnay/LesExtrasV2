'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Calendar, Home, MessageCircle, Siren, LogIn, UserPlus, Bell, User } from 'lucide-react';
import { auth } from '@/lib/auth';

const NAV_ITEMS = [
    { href: '/wall', label: 'Wall', icon: Home },
    { href: '/dashboard/relief', label: 'SOS', icon: Siren, highlight: true },
    { href: '/bookings', label: 'Agenda', icon: Calendar },
    { href: '/messages', label: 'Messages', icon: MessageCircle },
];

export function DesktopTopNav() {
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [hasNotifications, setHasNotifications] = useState(true); // TODO: connect to real notifications

    useEffect(() => {
        setIsAuthenticated(auth.isAuthenticated());
    }, [pathname]);

    if (pathname.startsWith('/auth/') || pathname.startsWith('/onboarding')) {
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

                    {/* Right section: Auth buttons or User icons */}
                    <div className="flex items-center gap-3">
                        {isAuthenticated ? (
                            <>
                                {/* Notifications */}
                                <Link 
                                    href="/notifications" 
                                    className="relative p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
                                >
                                    <Bell className="h-5 w-5 text-slate-600" />
                                    {hasNotifications && (
                                        <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-coral-500 rounded-full border-2 border-white" />
                                    )}
                                </Link>

                                {/* Profile */}
                                <Link 
                                    href="/profile" 
                                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
                                >
                                    <User className="h-5 w-5 text-slate-600" />
                                </Link>
                            </>
                        ) : (
                            <>
                                {/* S'inscrire */}
                                <Link 
                                    href="/onboarding" 
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                                >
                                    <UserPlus className="h-4 w-4" />
                                    S'inscrire
                                </Link>

                                {/* Se connecter */}
                                <Link href="/auth/login" className="btn-primary">
                                    <LogIn className="h-4 w-4" />
                                    Se connecter
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}

