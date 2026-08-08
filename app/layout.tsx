import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AI Interview Agent — Adaptive Technical Interviewer',
  description:
    'A realistic, multi-turn technical interview platform tailored to candidate learning journeys, curriculum objectives, and adaptive AI evaluation.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-[#09090b] text-[#f4f4f5] min-h-screen antialiased selection:bg-indigo-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
