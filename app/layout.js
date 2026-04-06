import './globals.css';

export const metadata = {
  title: 'PathForge — AI-Powered College Advising',
  description: 'Real courses. Real clubs. Career prep college won\'t teach you. Personalized to your school and career goals.',
  keywords: ['college advising', 'course planning', 'career roadmap', 'college courses', 'investment banking', 'software engineering'],
  openGraph: {
    title: 'PathForge — AI-Powered College Advising',
    description: 'Your personalized college roadmap. From first lecture to first offer.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PathForge — AI-Powered College Advising',
    description: 'Your personalized college roadmap. From first lecture to first offer.',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
