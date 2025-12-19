'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Home,
    Search,
    Siren,
    Calendar,
    User,
    Plus,
    Shield
} from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { CreateActionModal } from '@/components/create/CreateActionModal';

const NAV_ITEMS = [
    { href: '/wall', label: 'Accueil', icon: Home },
    { href: '/search', label: 'Recherche', icon: Search },
    { href: '/dashboard/relief', label: 'SOS', icon: Siren, highlight: true },
    { href: '/bookings', label: 'Agenda', icon: Calendar },
    { href: '/profile', label: 'Profil', icon: User },
];

export function MobileBottomNav() {
    const pathname = usePathname();
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';
    const canPublish = Boolean(user && (user.role === 'CLIENT' || user.role === 'EXTRA'));

    // Hide on auth pages and onboarding
    if (pathname.startsWith('/auth/') || pathname.startsWith('/onboarding')) {
        return null;
    }

    // Build nav items - replace Search with Admin for admin users
    const navItems = isAdmin
        ? NAV_ITEMS.map(item => 
            item.href === '/search' 
                ? { href: '/admin', label: 'Admin', icon: Shield }
                : item
          )
        : NAV_ITEMS;

    // Hide on desktop
    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
            {/* Glass background */}
            <div className="absolute inset-0 bg-white/80 backdrop-blur-xl border-t border-gray-200" />

            {/* Safe area padding for iPhone */}
            <div className="relative px-2 pb-safe">
                {canPublish && user ? (
                    <div className="absolute right-4 -top-6 z-10">
                        <CreateActionModal
                            user={user}
                            trigger={
                                <button
                                    type="button"
                                    className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-teal-500 flex items-center justify-center shadow-lg shadow-indigo-500/30"
                                    aria-label="Publier"
                                >
                                    <Plus className="w-6 h-6 text-white" />
                                </button>
                            }
                        />
                    </div>
                ) : null}

                <div className="flex items-center justify-around h-16">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        const isHighlight = 'highlight' in item && item.highlight;
                        const isAdminItem = item.href === '/admin';

                        if (isHighlight) {
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="relative -mt-6"
                                >
                                    <motion.div
                                        whileTap={{ scale: 0.9 }}
                                        className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/30"
                                    >
                                        <Icon className="w-6 h-6 text-white" />
                                    </motion.div>
                                    <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-medium text-rose-600">
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
                    ${isActive ? (isAdminItem ? 'bg-purple-100' : 'bg-brand-100') : ''}
                  `}
                                >
                                    <Icon className={`
                    w-5 h-5 transition-colors
                    ${isActive ? (isAdminItem ? 'text-purple-600' : 'text-brand-600') : 'text-gray-400'}
                  `} />
                                </motion.div>
                                <span className={`
                  text-[10px] font-medium transition-colors
                  ${isActive ? (isAdminItem ? 'text-purple-600' : 'text-brand-600') : 'text-gray-400'}
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
