/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/favicon.ico",
        destination: "/brand-icon.svg",
      },
    ];
  },
};

export default nextConfig;
