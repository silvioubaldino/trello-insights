import path from 'node:path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Configuração para produção Vercel
  output: 'standalone',
  
  // Typed Routes (movido de experimental)
  typedRoutes: true,
  
  experimental: {
    // App Router features
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  eslint: {
    // Progressivo: não bloquear builds durante migração
    ignoreDuringBuilds: true,
  },
  
  typescript: {
    // Progressivo: não bloquear builds durante migração
    ignoreBuildErrors: false, // Vamos habilitar checagem após migração completa
  },
  
  webpack(config) {
    // Preserva alias '@' apontando para 'src'
    config.resolve.alias['@'] = config.resolve.alias['@'] || path.resolve(process.cwd(), 'src');
    return config;
  },
};

export default nextConfig;


