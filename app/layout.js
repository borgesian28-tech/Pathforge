import './globals.css';
import { AuthProvider } from '@/components/AuthContext';

export const metadata = {
  title: 'PathForge — AI-Powered Academic Advising',
  description: 'Real courses. Real clubs. Career prep school won\'t teach you. From high school to master\'s — personalized to you.',
  keywords: ['academic advising', 'course planning', 'career roadmap', 'college courses', 'high school', 'graduate school'],
  manifest: '/manifest.json',
  themeColor: '#C9A84C',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PathForge',
  },
  openGraph: {
    title: 'PathForge — AI-Powered Academic Advising',
    description: 'Your personalized academic roadmap. From first class to first offer.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PathForge — AI-Powered Academic Advising',
    description: 'Your personalized academic roadmap. From first class to first offer.',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
