/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Generate a standalone build for Vercel
  output: 'standalone',
  // Configure images for Leaflet markers
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
