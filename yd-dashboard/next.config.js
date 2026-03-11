/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost'],
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/documents',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;