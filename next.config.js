/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
    reactStrictMode: true,
    // ignoreBuildErrors SUPPRIMÉ pour garantir la qualité du code
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**', // À restreindre en production
            },
        ],
    },
};

module.exports = nextConfig;
