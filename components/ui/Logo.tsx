'use client';

import Link from 'next/link';
import { Outfit } from 'next/font/google';

const outfit = Outfit({
    subsets: ['latin'],
    weight: ['700', '800'],
    display: 'swap',
});

export type LogoSize = 'sm' | 'md' | 'lg' | 'xl';

export interface LogoProps {
    size?: LogoSize;
    showBaseline?: boolean;
    href?: string | null;
    as?: 'h1' | 'span';
    className?: string;
}

const sizeStyles: Record<LogoSize, { word: string; baseline: string; baselineSpacing: string }> = {
    sm: { word: 'text-2xl', baseline: 'text-sm', baselineSpacing: 'mt-1' },
    md: { word: 'text-4xl', baseline: 'text-lg', baselineSpacing: 'mt-2' },
    lg: { word: 'text-5xl', baseline: 'text-xl', baselineSpacing: 'mt-2.5' },
    xl: {
        word: 'text-6xl sm:text-7xl md:text-8xl',
        baseline: 'text-2xl sm:text-3xl',
        baselineSpacing: 'mt-3',
    },
};

export function Logo({ size = 'md', showBaseline = true, href = '/', as = 'span', className }: LogoProps) {
    const styles = sizeStyles[size];
    const TitleTag = as;

    const content = (
        <>
            <TitleTag
                className={`${styles.word} inline-flex items-baseline font-extrabold tracking-tight leading-[0.9]`}
            >
                <span className="text-[#0B2A66]">Socio</span>
                <span className="bg-gradient-to-r from-[#00C2CB] via-[#0085FF] to-[#FF5A5F] bg-clip-text text-transparent">
                    Pulse
                </span>
            </TitleTag>
            {showBaseline ? (
                <p
                    className={`${styles.baselineSpacing} ${styles.baseline} text-center font-bold tracking-tight leading-none text-[#1D3A6D]`}
                >
                    Le hub du social
                </p>
            ) : null}
        </>
    );

    const wrapperClassName = `${outfit.className} inline-flex flex-col items-center whitespace-nowrap ${className ?? ''}`;

    if (href) {
        return (
            <Link href={href} aria-label="SocioPulse" className={wrapperClassName}>
                {content}
            </Link>
        );
    }

    return <div className={wrapperClassName}>{content}</div>;
}

