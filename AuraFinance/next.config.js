const { PHASE_DEVELOPMENT_SERVER } = require('next/constants');

module.exports = (phase) => {
  /** @type {import('next').NextConfig} */
  const nextConfig = {
    experimental: {
      externalDir: true,
    },
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : '.next',
    allowedDevOrigins: ["*.preview.same-app.com"],
    images: {
      unoptimized: true,
      domains: [
        "source.unsplash.com",
        "images.unsplash.com",
        "ext.same-assets.com",
        "ugc.same-assets.com",
      ],
      remotePatterns: [
        {
          protocol: "https",
          hostname: "source.unsplash.com",
          pathname: "/**",
        },
        {
          protocol: "https",
          hostname: "images.unsplash.com",
          pathname: "/**",
        },
        {
          protocol: "https",
          hostname: "ext.same-assets.com",
          pathname: "/**",
        },
        {
          protocol: "https",
          hostname: "ugc.same-assets.com",
          pathname: "/**",
        },
      ],
    },
  };

  return nextConfig;
};
