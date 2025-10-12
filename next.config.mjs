/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on `node-snappy` module
    if (!isServer) {
      config.externals = [...(config.externals || []), 'snappy', '@napi-rs/snappy-linux-x64-gnu', '@napi-rs/snappy-linux-x64-musl'];
    }

    return config;
  },
}

export default nextConfig
