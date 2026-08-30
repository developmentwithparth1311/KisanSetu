/** @type {import('next').NextConfig} */
const pythonApiUrl = (process.env.PYTHON_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  async rewrites() {
    // Keep browser fetch paths stable while FastAPI is the sole API runtime.
    // ``beforeFiles`` takes precedence over the retained handlers during the
    // validation window and proxies methods, bodies, and query parameters.
    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: `${pythonApiUrl}/api/:path*`,
        },
      ],
    };
  },
};

module.exports = nextConfig;
