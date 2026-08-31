/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
};

// PWA config
const withSerwist = require('@serwist/next')({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  reloadOnOnline: true,
  register: true,
});

module.exports = withSerwist(nextConfig);