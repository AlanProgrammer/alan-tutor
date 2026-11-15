/** @type {import('next').NextConfig} */
const nextConfig = { 
  reactStrictMode: true, 
  poweredByHeader: false,
  experimental: {
    serverComponentsExternalPackages: ["telegraf", "jose", "jwks-rsa", "firebase-admin"],
  },
};

export default nextConfig;