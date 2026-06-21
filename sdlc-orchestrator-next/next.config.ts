import type { NextConfig } from "next";

// The Python backend (server.py) owns /api/* — generate-app, launch, stop, status.
// It runs at http://localhost:3000. Proxy from the Next.js dev server (:3030) so
// fetch('/api/generate-app') from client components hits the Python subprocess
// manager without CORS or hardcoded URLs.
const config: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3000/api/:path*",
      },
    ];
  },
};

export default config;
