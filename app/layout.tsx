import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from 'next-themes';

export const metadata: Metadata = {
  title: 'The Sus Files',
  description: 'A curated archive of your friends\' most unhinged moments, quotes, and chaos.',
  keywords: ['sus files', 'memes', 'friends', 'quotes', 'roast'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-off-white dark:bg-brutal-black text-brutal-black dark:text-off-white transition-colors duration-200">
        <ThemeProvider attribute="class" forcedTheme="light">
          <AuthProvider>
            {children}
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: '#0A0A0A',
                  color: '#FAFAF5',
                  border: '3px solid #000',
                  boxShadow: '4px 4px 0px #F5F500',
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontWeight: 700,
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
