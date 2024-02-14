const graphURL = [
  'localhost:5000',
  'opencollective.com'
].join(' ')


/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/path/:path*',
        destination: 'http://localhost:5000/path/:path*', // Replace with your backend server URL
      },
    ];
  },
}

module.exports = nextConfig
