/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,

  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 500, // Check files manually every 1 second
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

export default nextConfig;
