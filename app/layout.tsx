import type { Metadata } from 'next'
import { Quicksand, Ms_Madi } from 'next/font/google'
import './globals.css'

const quicksand = Quicksand({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500'],
  variable: '--font-quicksand',
})

const msMadi = Ms_Madi({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-ms-madi',
})

export const metadata: Metadata = {
  title: 'Chúc Vanh thi tốt nhaaa!',
  description: 'Không gian ôn thi bình yên cho kỳ thi THPT 2025',
  generator: 'Higo',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" className={`${quicksand.variable} ${msMadi.variable}`} suppressHydrationWarning>
      <body className="antialiased overflow-hidden" suppressHydrationWarning>{children}</body>
    </html>
  )
}
