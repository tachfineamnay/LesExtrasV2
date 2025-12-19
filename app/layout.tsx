import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { SonnerToaster } from "@/components/ui/SonnerToaster";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Les Extras | Plateforme M‚dico-Sociale",
    description: "La plateforme B2B2C pour le secteur m‚dico-social. Trouvez des renforts, r‚servez des ateliers, connectez-vous avec des professionnels qualifi‚s.",
    keywords: ["m‚dico-social", "EHPAD", "renforts", "ateliers", "professionnels de sant‚"],
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="fr" className="smooth-scroll">
            <body className={outfit.className}>
                {children}
                <SonnerToaster />
            </body>
        </html>
    );
}
