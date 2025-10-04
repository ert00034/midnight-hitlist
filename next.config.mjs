/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'wow.zamimg.com' },
      { protocol: 'https', hostname: 'www.wowhead.com' },
      { protocol: 'https', hostname: '**' }
    ]
  }
};

export default nextConfig;


