import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Permite carregar as imagens do Supabase
      },
    ],
  },
}

export default nextConfig
