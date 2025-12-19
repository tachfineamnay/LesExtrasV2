import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // SOCIOPULSE Design System - Tech & Care
                canvas: "#FAFAFA",
                
                // Brand (Indigo) - Actions principales, CTA, Login
                brand: {
                    50: "#EEF2FF",
                    100: "#E0E7FF",
                    200: "#C7D2FE",
                    300: "#A5B4FC",
                    400: "#818CF8",
                    500: "#6366F1",
                    600: "#4F46E5", // Primary Action
                    700: "#4338CA", // brand-dark
                    800: "#3730A3",
                    900: "#312E81",
                    DEFAULT: "#4F46E5",
                },
                // Live (Teal) - SocioLive, Visio, Services
                live: {
                    50: "#F0FDFA",
                    100: "#CCFBF1",
                    200: "#99F6E4",
                    300: "#5EEAD4",
                    400: "#2DD4BF",
                    500: "#14B8A6", // SocioLive
                    600: "#0D9488",
                    700: "#0F766E",
                    800: "#115E59",
                    900: "#134E4A",
                    DEFAULT: "#14B8A6",
                },
                // Alert (Rose) - Missions SOS, Urgences
                alert: {
                    50: "#FFF1F2",
                    100: "#FFE4E6",
                    200: "#FECDD3",
                    300: "#FDA4AF",
                    400: "#FB7185",
                    500: "#F43F5E", // Missions SOS
                    600: "#E11D48",
                    700: "#BE123C",
                    800: "#9F1239",
                    900: "#881337",
                    DEFAULT: "#F43F5E",
                },
                gray: {
                    // ADEPA Cool Grays
                    50: "#F9FAFB",
                    100: "#F3F4F6",
                    200: "#E5E7EB",
                    300: "#D1D5DB",
                    400: "#9CA3AF",
                    500: "#6B7280", // ADEPA Secondary Grey
                    600: "#4B5563",
                    700: "#374151",
                    800: "#1F2937",
                    900: "#111827",
                },
            },
            fontFamily: {
                sans: ["Outfit", "Inter", "system-ui", "sans-serif"], // ADEPA Geometric Style
            },
            boxShadow: {
                soft: "0 4px 16px -4px rgba(0, 0, 0, 0.08)",
                "soft-lg": "0 8px 32px -8px rgba(0, 0, 0, 0.12)",
            },
            animation: {
                "modal-in": "modalIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            },
            keyframes: {
                modalIn: {
                    "0%": { opacity: "0", transform: "scale(0.96)" },
                    "100%": { opacity: "1", transform: "scale(1)" },
                },
            },
        },
    },
    plugins: [],
};

export default config;
