import Link from 'next/link';
import { Siren, Calendar, User, Search, ArrowRight } from 'lucide-react';
import { GrowthDashboardWidgets } from '@/components/growth';

export default function DashboardHubPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Tableau de Bord</h1>
                        <p className="text-sm text-gray-500">Bienvenue sur votre espace Les Extras</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-coral-100 flex items-center justify-center text-coral-600 font-semibold">
                        JD
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-10">
                    <GrowthDashboardWidgets />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* SOS Renfort - Primary Card */}
                    <Link
                        href="/dashboard/relief"
                        className="group relative p-8 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 md:col-span-2 lg:col-span-2 overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Siren className="w-48 h-48 text-coral-500" />
                        </div>
                        <div className="relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-coral-500 to-orange-500 flex items-center justify-center shadow-lg shadow-coral-500/30 mb-6">
                                <Siren className="w-7 h-7 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">SOS Renfort</h2>
                            <p className="text-gray-500 max-w-md mb-8">
                                Publiez une mission urgente et trouvez un professionnel qualifié en moins de 30 minutes.
                            </p>
                            <span className="inline-flex items-center gap-2 text-coral-600 font-medium group-hover:gap-3 transition-all">
                                Accéder au module
                                <ArrowRight className="w-4 h-4" />
                            </span>
                        </div>
                    </Link>

                    {/* Agenda - Secondary */}
                    <div className="group p-8 bg-white rounded-3xl border border-gray-100 shadow-sm hover:border-gray-200 transition-all duration-300 opacity-60">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-6 text-gray-400">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Agenda</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Gérez vos réservations d'ateliers et vos disponibilités.
                        </p>
                        <span className="inline-flex px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">
                            Bientôt disponible
                        </span>
                    </div>

                    {/* Profil */}
                    <Link
                        href="/profile"
                        className="group p-8 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md hover:border-coral-100 transition-all duration-300"
                    >
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-6 text-blue-600">
                            <User className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Mon Profil</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Mettez à jour vos informations et vos préférences.
                        </p>
                    </Link>

                    {/* Recherche */}
                    <Link
                        href="/search"
                        className="group p-8 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md hover:border-coral-100 transition-all duration-300"
                    >
                        <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mb-6 text-purple-600">
                            <Search className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Rechercher</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Trouvez des animateurs ou des services spécifiques.
                        </p>
                    </Link>

                </div>
            </main>
        </div>
    );
}
