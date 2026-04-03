/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@vibeping/sdk'],
  output: 'standalone',
};

module.exports = nextConfig;
