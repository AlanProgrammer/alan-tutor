/** @type {import('next').NextConfig} */
const nextConfig = { 
  reactStrictMode: true, 
  poweredByHeader: false,
  experimental: {
    serverComponentsExternalPackages: ["telegraf"],
  },
};

export default nextConfig;