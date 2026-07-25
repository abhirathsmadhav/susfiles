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
            <div className="fixed bottom-20 md:bottom-4 left-2 md:left-4 font-mono text-[10px] md:text-xs font-bold opacity-60 z-[999]" style={{ textShadow: '1px 1px 0px #fff' }}>
              <a href="/legal" className="hover:underline hover:text-hot-pink transition-colors">LEGAL / PRIVACY</a>
            </div>
            <div className="fixed bottom-20 md:bottom-4 right-2 md:right-4 font-mono text-[10px] md:text-xs font-bold opacity-40 pointer-events-none z-[999]" style={{ textShadow: '1px 1px 0px #fff' }}>
              DEVELOPED BY GHOST
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
