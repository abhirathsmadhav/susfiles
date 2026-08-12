'use client';

import { useAuth } from '@/lib/auth-context';
import SusFilesLoader from '@/components/SusFilesLoader';
import { useEffect, useState } from 'react';

type Stage = 'loading' | 'granted' | 'denied';

// Minimum time to show the loader so the animation has a chance to play
const MIN_SHOW_MS = 1500;
// How long to hold the ACCESS GRANTED state before dismissing
const GRANTED_HOLD_MS = 1400;

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();

  const [stage, setStage] = useState<Stage>('loading');
  const [visible, setVisible] = useState(true);
  const [minElapsed, setMinElapsed] = useState(false);

  // Start minimum display timer immediately on mount
  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), MIN_SHOW_MS);
    return () => clearTimeout(t);
  }, []);

  // React when Firebase auth resolves
  useEffect(() => {
    if (loading) return; // still resolving

    const proceed = () => {
      if (user) {
        // Authenticated → show ACCESS GRANTED, then dismiss
        setStage('granted');
        const t = setTimeout(() => setVisible(false), GRANTED_HOLD_MS);
        return () => clearTimeout(t);
      } else {
        // Not authenticated → dismiss quietly
        setStage('denied');
        const t = setTimeout(() => setVisible(false), 200);
        return () => clearTimeout(t);
      }
    };

    if (minElapsed) {
      proceed();
    } else {
      // Wait for minimum time first, then proceed
      const remaining = MIN_SHOW_MS;
      const t = setTimeout(proceed, remaining);
      return () => clearTimeout(t);
    }
  }, [loading, user, minElapsed]);

  if (!visible) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Loader overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: '#FAFAF5',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <SusFilesLoader stage={stage} />
      </div>

      {/* Pre-render children in the background so they're ready */}
      <div style={{ visibility: 'hidden', position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {children}
      </div>
    </>
  );
}
