/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Bắt buộc: Xuất ra HTML/CSS/JS tĩnh để host được trên GitHub Pages
  basePath: '/vanh', // Bắt buộc: Giúp Next.js nhận diện đúng đường dẫn asset trong folder '/vanh'

  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true, // Giữ nguyên cấu hình của bạn (bắt buộc cho static export)
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'flow-content.google' },
    ],
  },
}

export default nextConfig