import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from 'next-themes';

export const metadata: Metadata = {
  title: 'The Sus Files',
  description: "A curated archive of your friends' most unhinged moments, quotes, and chaos.",
  keywords: ['sus files', 'memes', 'friends', 'quotes', 'roast'],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-off-white dark:bg-brutal-black text-brutal-black dark:text-off-white transition-colors duration-200 overflow-x-hidden">
        <ThemeProvider attribute="class" forcedTheme="light">
          <AuthProvider>
            {children}
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#0A0A0A',
                  color: '#FAFAF5',
                  border: '3px solid #000',
                  boxShadow: '4px 4px 0px #F5F500',
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontWeight: 700,
                  borderRadius: '0',
                  fontSize: '14px',
                  maxWidth: '90vw',
                },
              }}
            />
            {/* Legal link — hidden on mobile (overlaps nav) */}
            <div className="hidden md:block fixed bottom-4 left-4 font-mono text-xs font-bold opacity-60 z-[999]">
              <a href="/legal" className="hover:underline hover:text-hot-pink transition-colors">
                LEGAL / PRIVACY
              </a>
            </div>
            <div className="hidden md:block fixed bottom-4 right-4 font-mono text-xs font-bold opacity-40 pointer-events-none z-[999]">
              DEVELOPED BY GHOST
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
