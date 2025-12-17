'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Home,
    Search,
    Siren,
    Calendar,
    User
} from 'lucide-react';

const NAV_ITEMS = [
    { href: '/wall', label: 'Accueil', icon: Home },
    { href: '/search', label: 'Recherche', icon: Search },
    { href: '/dashboard/relief', label: 'SOS', icon: Siren, highlight: true },
    { href: '/bookings', label: 'Agenda', icon: Calendar },
    { href: '/profile', label: 'Profil', icon: User },
];

export function MobileBottomNav() {
    const pathname = usePathname();

    // Hide on auth pages and onboarding
    if (pathname.startsWith('/auth/') || pathname.startsWith('/onboarding')) {
        return null;
    }

    // Hide on desktop
    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
            {/* Glass background */}
            <div className="absolute inset-0 bg-white/80 backdrop-blur-xl border-t border-gray-200" />

            {/* Safe area padding for iPhone */}
            <div className="relative px-2 pb-safe">
                <div className="flex items-center justify-around h-16">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        const isHighlight = item.highlight;

                        if (isHighlight) {
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="relative -mt-6"
                                >
                                    <motion.div
                                        whileTap={{ scale: 0.9 }}
                                        className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/30"
                                    >
                                        <Icon className="w-6 h-6 text-white" />
                                    </motion.div>
                                    <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-medium text-red-600">
                                        {item.label}
                                    </span>
                                </Link>
                            );
                        }

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex flex-col items-center gap-0.5 py-2 px-3"
                            >
                                <motion.div
                                    whileTap={{ scale: 0.9 }}
                                    className={`
                    p-2 rounded-xl transition-colors
                    ${isActive ? 'bg-coral-100' : ''}
                  `}
                                >
                                    <Icon className={`
                    w-5 h-5 transition-colors
                    ${isActive ? 'text-coral-600' : 'text-gray-400'}
                  `} />
                                </motion.div>
                                <span className={`
                  text-[10px] font-medium transition-colors
                  ${isActive ? 'text-coral-600' : 'text-gray-400'}
                `}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
