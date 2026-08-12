'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import SusFilesLoader from './SusFilesLoader';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const redirected = useRef(false);

  useEffect(() => {
    if (loading || redirected.current) return;
    if (!user) {
      redirected.current = true;
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brutal-black flex flex-col items-center justify-center gap-4">
        <SusFilesLoader stage="loading" />
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
