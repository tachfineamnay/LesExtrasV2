import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { SonnerToaster } from "@/components/ui/SonnerToaster";
import { SocketProvider } from "@/components/providers";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Sociopulse | Plateforme Médico-Sociale",
    description: "La plateforme B2B2C pour le secteur médico-social. Trouvez des renforts, réservez des ateliers, connectez-vous avec des professionnels qualifiés.",
    keywords: ["médico-social", "EHPAD", "Sociopulse", "renforts", "ateliers", "professionnels de santé"],
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
                <SocketProvider>
                    {children}
                </SocketProvider>
                <SonnerToaster />
            </body>
        </html>
    );
}
