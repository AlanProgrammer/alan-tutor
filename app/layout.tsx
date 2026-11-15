import type { Metadata, Viewport } from 'next';
import { Noto_Sans_Arabic } from 'next/font/google';
import './globals.css';

// ڕێکخستنی فۆنتە کوردییەکە بۆ ئەوەی لەسەر هەموو ئامێرەکان جوان دەربکەوێت
const notoSansArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-arabic'
});

export const metadata: Metadata = {
  title: 'Alan Tutor — English, on your terms',
  description: 'A personal English tutor for Sorani Kurdish speakers, from A1 to C2.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Alan Tutor' },
  icons: { icon: '/icon.svg', apple: '/icon.svg' }
};

export const viewport: Viewport = {
  themeColor: '#0b0913',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={notoSansArabic.className}>
        {children}
        <script dangerouslySetInnerHTML={{ __html: "if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}))}" }} />
      </body>
    </html>
  );
}