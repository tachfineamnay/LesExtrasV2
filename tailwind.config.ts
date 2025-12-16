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
                // ADEPA Brand Colors
                canvas: "#FAFAFA",
                coral: {
                    50: "#FFF1F1",
                    100: "#FFE4E4",
                    200: "#FEC8C8",
                    300: "#FEA0A0",
                    400: "#FF8585",
                    500: "#FF6B6B", // 2026 Coral (Renfort/Action)
                    600: "#F15353",
                    700: "#D94242",
                    800: "#B93232",
                    900: "#7F1D1D",
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
