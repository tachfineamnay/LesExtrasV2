'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Home, MessageCircle, Siren, LogIn, UserPlus, Bell, User, LogOut, Settings, ChevronDown, Shield, Activity } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { CreateActionModal } from '@/components/create/CreateActionModal';

const NAV_ITEMS = [
    { href: '/wall', label: 'Wall', icon: Home },
    { href: '/dashboard/relief', label: 'SOS', icon: Siren, highlight: true },
    { href: '/bookings', label: 'Agenda', icon: Calendar },
    { href: '/messages', label: 'Messages', icon: MessageCircle },
];

export function DesktopTopNav() {
    const pathname = usePathname();
    const { user, isAuthenticated, isLoading, logout } = useAuth();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [notificationCount] = useState(3); // TODO: connect to real notifications
    const [messageCount] = useState(2); // TODO: connect to real messages count
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (pathname.startsWith('/auth/') || pathname.startsWith('/onboarding')) {
        return null;
    }

    // User initials for avatar
    const getInitials = () => {
        if (user?.profile?.firstName && user?.profile?.lastName) {
            return `${user.profile.firstName[0]}${user.profile.lastName[0]}`.toUpperCase();
        }
        if (user?.profile?.firstName) {
            return user.profile.firstName.substring(0, 2).toUpperCase();
        }
        return 'U';
    };

    return (
        <header className="hidden lg:block sticky top-0 z-50">
            <div className="glass border-b border-white/60">
                <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-6">
                    <Link href="/wall" className="flex items-center gap-2.5 group">
                        {/* Logo Icon - Pulse/Heartbeat */}
                        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-teal-500 shadow-soft flex items-center justify-center transition-transform group-hover:scale-105">
                            <Activity className="h-5 w-5 text-white" strokeWidth={2.5} />
                        </div>
                        {/* Logo Text */}
                        <span className="hidden sm:inline text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-teal-500">
                            Sociopulse
                        </span>
                    </Link>

                    <nav className="flex items-center gap-2">
                        {NAV_ITEMS.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                            const isHighlight = item.highlight;
                            const isMessages = item.href === '/messages';

                            if (isHighlight) {
                                return (
                                    <Link key={item.href} href={item.href} className="relative">
                                        <motion.span
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-semibold shadow-soft"
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
                                    className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold tracking-tight transition-colors ${
                                        isActive
                                            ? 'bg-slate-900/5 text-slate-900'
                                            : 'text-slate-600 hover:bg-slate-900/5 hover:text-slate-900'
                                    }`}
                                >
                                    <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                                    {item.label}
                                    {/* Badge messages non lus */}
                                    {isMessages && isAuthenticated && messageCount > 0 && (
                                        <span className="absolute -top-1 -right-1 h-5 w-5 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm">
                                            {messageCount > 9 ? '9+' : messageCount}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Right section: Auth buttons or User menu */}
                    <div className="flex items-center gap-3">
                        {isAuthenticated ? (
                            <>
                                {user ? <CreateActionModal user={user} /> : null}

                                {/* Notifications avec badge */}
                                <button 
                                    onClick={() => {/* TODO: implement notifications panel */}} 
                                    className="relative p-2.5 rounded-xl bg-white/80 hover:bg-white border border-slate-200/50 hover:border-slate-300 transition-all hover:shadow-sm group"
                                >
                                    <Bell className="h-5 w-5 text-slate-600 group-hover:text-slate-800 transition-colors" />
                                    {notificationCount > 0 && (
                                        <motion.span 
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm"
                                        >
                                            {notificationCount > 9 ? '9+' : notificationCount}
                                        </motion.span>
                                    )}
                                </button>

                                {/* Menu utilisateur avec dropdown */}
                                <div className="relative" ref={menuRef}>
                                    <button
                                        onClick={() => setShowUserMenu(!showUserMenu)}
                                        className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-white/80 hover:bg-white border border-slate-200/50 hover:border-slate-300 transition-all hover:shadow-sm"
                                    >
                                        {/* Avatar */}
                                        {user?.profile?.avatarUrl ? (
                                            <img 
                                                src={user.profile.avatarUrl} 
                                                alt="Avatar" 
                                                className="h-8 w-8 rounded-lg object-cover"
                                            />
                                        ) : (
                                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-600 to-teal-500 flex items-center justify-center">
                                                <span className="text-white text-sm font-semibold">{getInitials()}</span>
                                            </div>
                                        )}
                                        {/* Prénom */}
                                        <span className="text-sm font-medium text-slate-700 max-w-[100px] truncate hidden xl:block">
                                            {user?.profile?.firstName || 'Mon compte'}
                                        </span>
                                        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                                    </button>

                                    {/* Dropdown menu */}
                                    <AnimatePresence>
                                        {showUserMenu && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                                transition={{ duration: 0.15 }}
                                                className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
                                            >
                                                {/* Header utilisateur */}
                                                <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-100">
                                                    <p className="text-sm font-semibold text-slate-900 truncate">
                                                        {user?.profile?.firstName} {user?.profile?.lastName}
                                                    </p>
                                                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                                                </div>

                                                {/* Menu items */}
                                                <div className="py-2">
                                                    {/* Admin link - only for ADMIN role */}
                                                    {user?.role === 'ADMIN' && (
                                                        <Link
                                                            href="/admin"
                                                            onClick={() => setShowUserMenu(false)}
                                                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors font-medium"
                                                        >
                                                            <Shield className="h-4 w-4 text-purple-600" />
                                                            Administration
                                                        </Link>
                                                    )}
                                                    <Link
                                                        href="/profile"
                                                        onClick={() => setShowUserMenu(false)}
                                                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                                    >
                                                        <User className="h-4 w-4 text-slate-400" />
                                                        Mon profil
                                                    </Link>
                                                    <Link
                                                        href="/settings/profile"
                                                        onClick={() => setShowUserMenu(false)}
                                                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                                    >
                                                        <Settings className="h-4 w-4 text-slate-400" />
                                                        Paramètres
                                                    </Link>
                                                </div>

                                                {/* Déconnexion */}
                                                <div className="border-t border-slate-100 py-2">
                                                    <button
                                                        onClick={() => {
                                                            setShowUserMenu(false);
                                                            logout();
                                                        }}
                                                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                    >
                                                        <LogOut className="h-4 w-4" />
                                                        Déconnexion
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* S'inscrire - Outline Indigo */}
                                <Link 
                                    href="/onboarding" 
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-indigo-700 bg-white/80 border border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 transition-all hover:shadow-sm"
                                >
                                    <UserPlus className="h-4 w-4" />
                                    S'inscrire
                                </Link>

                                {/* Se connecter - Solid Indigo */}
                                <Link href="/auth/login" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md">
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

