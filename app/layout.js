import './globals.css';
import { AuthProvider } from '@/components/AuthContext';

export const metadata = {
  title: 'PathForge — AI-Powered Academic Advising',
  description: 'Real courses. Real clubs. Career prep school won\'t teach you. From high school to master\'s — personalized to you.',
  keywords: ['academic advising', 'course planning', 'career roadmap', 'college courses', 'high school', 'graduate school'],
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

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
