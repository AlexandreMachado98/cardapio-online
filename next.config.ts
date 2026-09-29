import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/pedido/:id/acompanhar',
        destination: '/acompanhar/:id',
      },
      {
        source: '/tracking/:id',
        destination: '/acompanhar/:id',
      },
    ];
  },
};

export default nextConfig;
