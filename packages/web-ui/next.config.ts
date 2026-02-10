import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@line-twilio-chat/shared'],
  experimental: {
    typedRoutes: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'stickershop.line-scdn.net',
        pathname: '/stickershop/**',
      },
      {
        protocol: 'https',
        hostname: 'sprofile.line-scdn.net',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
