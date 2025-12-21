import type { ReactNode } from "react";
import Link from "next/link";
import { DesktopTopNav, MobileBottomNav } from "@/components/layout";
import { SocketProvider } from "@/components/providers/SocketProvider";

function PlatformFooter() {
    return (
        <footer className="bg-white border-t border-slate-200">
            <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <Link href="/" className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-teal-500 shadow-soft flex items-center justify-center">
                        <span className="text-white font-semibold tracking-tight">SP</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-900 leading-none">Sociopulse</span>
                        <span className="text-xs text-slate-500 leading-tight">Plateforme médico-sociale</span>
                    </div>
                </Link>
                <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                    <Link href="/wall" className="hover:text-slate-900 transition-colors">Wall</Link>
                    <Link href="/dashboard" className="hover:text-slate-900 transition-colors">Tableau de bord</Link>
                    <Link href="/bookings" className="hover:text-slate-900 transition-colors">Agenda</Link>
                    <Link href="/messages" className="hover:text-slate-900 transition-colors">Messages</Link>
                    <Link href="/profile" className="hover:text-slate-900 transition-colors">Profil</Link>
                </div>
            </div>
        </footer>
    );
}

export default function PlatformLayout({ children }: { children: ReactNode }) {
    return (
        <SocketProvider>
            <div className="min-h-screen bg-canvas flex flex-col">
                <DesktopTopNav />
                <div className="flex-1 flex flex-col has-bottom-nav lg:pb-0">
                    <main className="flex-1">{children}</main>
                    <PlatformFooter />
                </div>
                <MobileBottomNav />
            </div>
        </SocketProvider>
    );
}
