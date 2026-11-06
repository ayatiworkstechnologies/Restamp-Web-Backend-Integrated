import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(__dirname),
  async redirects() {
    return [
      {
        source: '/resale',
        destination: '/buy?purpose=Resale',
        permanent: false,
      },
      {
        source: '/lease',
        destination: '/buy?purpose=Lease',
        permanent: false,
      },
      {
        source: '/admin',
        destination: '/admin-dashboard',
        permanent: false,
      },
      {
        source: '/dashboard',
        destination: '/admin-dashboard',
        permanent: false,
      },
      {
        source: '/admin-dashboard/login',
        destination: '/admin-login',
        permanent: false,
      },
      {
        source: '/adminlogin',
        destination: '/admin-login',
        permanent: false,
      },
      {
        source: '/admin/login',
        destination: '/admin-login',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;