/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... existing code ...

  // Optimize webpack caching for more reliable builds
  webpack: (config, { dev, isServer }) => {
    // Improve caching behavior
    if (dev && !isServer) {
      // Use faster source maps in development
      config.devtool = 'eval-source-map';
      
      // Optimize cache directory naming to avoid spaces in paths
      config.cache = {
        ...config.cache,
        name: `${isServer ? 'server' : 'client'}-development`,
        buildDependencies: {
          config: [__filename],
        },
      };
    }

    // Optimize module resolution
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };

    return config;
  },

  // Optimize server restart performance
  onDemandEntries: {
    // Keep pages in memory for longer during development
    maxInactiveAge: 25 * 1000,
    // Keep up to 20 pages in memory
    pagesBufferLength: 20,
  },

  // ... existing code ...
};

module.exports = nextConfig; 