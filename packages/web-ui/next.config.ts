import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@line-twilio-chat/shared'],
  experimental: {
    typedRoutes: false,
  },
};

export default nextConfig;
