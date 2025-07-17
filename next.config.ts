import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    distDir: 'dist',
    serverExternalPackages: ['sequelize'],
};

export default nextConfig;
