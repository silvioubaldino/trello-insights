import path from 'node:path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // App Router is default; enabling typed routes and server actions if needed later
    typedRoutes: true,
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  eslint: {
    // We'll fix lint issues progressively; do not block builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Do not block builds on type errors initially during migration
    ignoreBuildErrors: true,
  },
  webpack(config) {
    // Preserva alias '@' apontando para 'src'
    config.resolve.alias['@'] = config.resolve.alias['@'] || path.resolve(process.cwd(), 'src');
    return config;
  },
};

export default nextConfig;


