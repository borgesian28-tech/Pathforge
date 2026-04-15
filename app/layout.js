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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
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
