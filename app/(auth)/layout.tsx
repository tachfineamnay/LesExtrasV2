import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen relative flex items-center justify-center bg-slate-50 overflow-hidden px-4 py-8">
            {/* Mesh Gradient Background */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-100/40 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-teal-100/40 blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                {children}
            </div>
        </div>
    );
}
