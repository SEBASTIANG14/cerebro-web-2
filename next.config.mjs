/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // el .glb es un binario grande: se sirve estatico desde /public con cache larga
  async headers() {
    return [
      {
        source: '/:path*.glb',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },
}
export default nextConfig
