/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Bắt buộc: Xuất ra HTML/CSS/JS tĩnh để host được trên GitHub Pages
  // Chỉ áp basePath khi production (deploy lên GitHub Pages tại /vanh).
  // Khi dev local, basePath = '' để truy cập http://localhost:3000/ như bình thường.
  basePath: process.env.NODE_ENV === 'production' ? '/vanh' : '',

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