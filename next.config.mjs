/** @type {import('next').NextConfig} */
const nextConfig = { 
  reactStrictMode: true, 
  poweredByHeader: false,
  transpilePackages: ["jose", "jwks-rsa"],
  experimental: {
    serverComponentsExternalPackages: ["telegraf"],
  },
};

export default nextConfig;