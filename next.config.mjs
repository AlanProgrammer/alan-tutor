/** @type {import('next').NextConfig} */
const nextConfig = { 
  reactStrictMode: true, 
  poweredByHeader: false,
  experimental: {
    serverComponentsExternalPackages: ["telegraf", "firebase-admin", "jose", "jwks-rsa"],
  },
};

export default nextConfig;