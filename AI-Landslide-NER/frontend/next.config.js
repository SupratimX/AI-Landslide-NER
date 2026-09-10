/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow loading Leaflet images
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
