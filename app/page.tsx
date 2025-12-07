

export default function HomePage() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-24">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">

                    {/* ============================== */}
                    {/* LEFT: Content Area            */}
                    {/* ============================== */}
                    <div className="lg:col-span-7 space-y-12">

                        {/* Hero */}
                        <header className="space-y-6">
                            {/* Logo Mark */}
                            {/* Logo Mark */}
                            <div className="flex items-center gap-3">
                                {/* Using the official uploaded logo */}
                                <img
                                    src="/images/logo.png"
                                    alt="ADEPA Les Extras"
                                    className="h-16 w-auto object-contain"
                                />
                            </div>

                            {/* Headline */}
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-gray-900 leading-[1.1]">
                                Des expériences
                                <br />
                                <span className="font-normal text-gradient">sur-mesure</span>
                            </h1>

                            <p className="text-lg text-gray-500 max-w-lg leading-relaxed font-light">
                                Animations, team-building et ateliers créatifs.
                                Une approche personnalisée pour des moments inoubliables.
                            </p>
                        </header>

                        {/* Features Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { icon: "◎", label: "Sur-mesure", desc: "Adapté à vos besoins" },
                                { icon: "◉", label: "Tous publics", desc: "Enfants, ados, adultes" },
                                { icon: "✦", label: "Experts", desc: "Animateurs certifiés" },
                                { icon: "◈", label: "Mobilité", desc: "Partout en France" },
                            ].map((feature) => (
                                <div
                                    key={feature.label}
                                    className="group p-5 bg-white rounded-2xl border border-gray-100 
                           hover:border-coral-100 hover:shadow-soft transition-all duration-300"
                                >
                                    <span className="text-2xl text-coral-400 block mb-3">{feature.icon}</span>
                                    <h3 className="text-sm font-medium text-gray-800 mb-1">
                                        {feature.label}
                                    </h3>
                                    <p className="text-xs text-gray-400">{feature.desc}</p>
                                </div>
                            ))}
                        </div>

                        {/* Social Proof */}
                        <div className="flex items-center gap-6 pt-4">
                            <div className="flex -space-x-2">
                                {[...Array(4)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 border-2 border-white"
                                    />
                                ))}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-700">+500 événements</p>
                                <p className="text-xs text-gray-400">Clients satisfaits depuis 2018</p>
                            </div>
                        </div>
                    </div>

                    {/* ============================== */}
                    {/* RIGHT: Booking Widget          */}
                    {/* ============================== */}
                    {/* ============================== */}
                    {/* RIGHT: Navigation Tiles        */}
                    {/* ============================== */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* Tile 1: Establishments */}
                        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-200/50 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-coral-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />

                            <div className="relative z-10">
                                <span className="inline-block px-3 py-1 mb-4 text-[10px] font-bold tracking-wider text-coral-600 uppercase bg-coral-100 rounded-full">
                                    Établissements
                                </span>
                                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                                    Besoin de renfort ?
                                </h3>
                                <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                                    Accédez à votre tableau de bord pour gérer vos demandes et trouver des experts qualifiés.
                                </p>

                                <a
                                    href="/dashboard"
                                    className="flex items-center justify-between w-full px-6 py-4 bg-gray-900 text-white rounded-2xl hover:bg-gray-800 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-gray-900/20"
                                >
                                    <span className="font-medium">Accéder au Dashboard</span>
                                    <svg className="w-5 h-5 text-gray-300 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </a>
                            </div>
                        </div>

                        {/* Tile 2: Extras */}
                        <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-8 border border-gray-200 hover:bg-white hover:shadow-lg transition-all duration-300 group">
                            <div className="relative z-10">
                                <span className="inline-block px-3 py-1 mb-4 text-[10px] font-bold tracking-wider text-gray-500 uppercase bg-gray-100 rounded-full">
                                    Extras
                                </span>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    Rejoindre l'équipe
                                </h3>
                                <p className="text-gray-500 text-sm mb-6">
                                    Proposez vos services et gérez votre emploi du temps en toute liberté.
                                </p>

                                <a
                                    href="/auth/login"
                                    className="flex items-center text-coral-600 font-medium hover:text-coral-700 transition-colors"
                                >
                                    <span className="border-b-2 border-coral-200 group-hover:border-coral-500 transition-colors">Se connecter</span>
                                    <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
