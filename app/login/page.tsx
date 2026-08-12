'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { Eye, EyeOff, FolderSearch, Ghost, Lock, UserPlus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login, signup, loginAsGuest, loginWithGoogle, resetPassword } = useAuth();
  const router = useRouter();
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', displayName: '' });
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignup) {
        await signup(form.email, form.password, form.displayName);
        toast.success('Account created! Welcome to the Files. 🕵️');
      } else {
        await login(form.email, form.password);
        toast.success('Logged in!');
      }
      router.push('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      toast.error(msg.replace('Firebase: ', '').replace(/\(auth\/.*\)/, '').trim());
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setGuestLoading(true);
    try {
      await loginAsGuest();
      toast.success('Sneaking in as a guest 👻');
      router.push('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Guest login failed';
      toast.error(msg.replace('Firebase: ', '').replace(/\(auth\/.*\)/, '').trim());
    } finally {
      setGuestLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      toast.success('Logged in with Google! 🚀');
      router.push('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google login failed';
      
      if (msg.includes('popup-blocked') || msg.includes('network-request-failed') || msg.includes('internal-error')) {
        toast.error('Login blocked! Please disable your adblocker or Brave Shields and try again. 🛑');
      } else if (msg.includes('popup-closed-by-user')) {
        toast.error('Login popup was closed. Please try again.');
      } else {
        toast.error(msg.replace('Firebase: ', '').replace(/\(auth\/.*\)/, '').trim());
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!form.email) {
      toast.error('Please enter your email address first. 📧');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(form.email);
      toast.success('Password reset email sent! Check your inbox. 📬');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send reset email';
      toast.error(msg.replace('Firebase: ', '').replace(/\(auth\/.*\)/, '').trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-off-white flex flex-col" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      {/* Header */}
      <div className="flex items-center justify-center pt-10 pb-6 border-b-[3px] border-black bg-acid-yellow">
        <Link href="/" className="font-brutal text-2xl flex items-center gap-2 hover:skew-x-[-3deg] transition-transform">
          <FolderSearch className="w-6 h-6" strokeWidth={3} /> THE SUS FILES
        </Link>
      </div>

      {/* Form Container */}
      <div className="flex-1 flex flex-col items-center justify-start px-4 pt-6 pb-8">
        <div className="w-full max-w-sm">
          {/* Card */}
          <div className="border-[3px] border-black bg-white" style={{ boxShadow: '6px 6px 0px #F5F500' }}>
            {/* Header */}
            <div className="border-b-[3px] border-black px-5 py-4 bg-black">
              <h1 className="font-brutal text-xl text-acid-yellow flex items-center gap-2">
                {isSignup ? <><UserPlus className="w-5 h-5" /> JOIN THE FILES</> : <><Lock className="w-5 h-5" /> ACCESS THE FILES</>}
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-5 flex flex-col gap-4">
              {isSignup && (
                <div>
                  <label className="font-brutal text-xs uppercase tracking-wider block mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={form.displayName}
                    onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                    className="input-brutal"
                    placeholder="Your name"
                    autoComplete="name"
                    suppressHydrationWarning
                  />
                </div>
              )}

              <div>
                <label className="font-brutal text-xs uppercase tracking-wider block mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="input-brutal"
                  placeholder="you@example.com"
                  autoComplete="email"
                  inputMode="email"
                  suppressHydrationWarning
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-brutal text-xs uppercase tracking-wider block">Password</label>
                  {!isSignup && (
                    <button
                      type="button"
                      onClick={handleResetPassword}
                      className="font-brutal text-[10px] uppercase text-black/50 hover:text-hot-pink transition-colors underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    className="input-brutal pr-12"
                    placeholder="••••••••"
                    autoComplete={isSignup ? 'new-password' : 'current-password'}
                    suppressHydrationWarning
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-black/50 hover:text-black transition-colors p-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-brutal w-full justify-center bg-black text-acid-yellow disabled:opacity-60 disabled:cursor-not-allowed text-base py-3.5 mt-1"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> LOADING...</>
                ) : isSignup ? (
                  'CREATE ACCOUNT'
                ) : (
                  'LOG IN'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 px-5 -mt-1">
              <div className="flex-1 h-[2px] bg-black/10" />
              <span className="font-brutal text-xs text-black/40 uppercase tracking-widest">or</span>
              <div className="flex-1 h-[2px] bg-black/10" />
            </div>

            {/* OAuth + Guest buttons */}
            <div className="px-5 py-4 flex flex-col gap-3">
              {/* Google */}
              <button
                onClick={handleGoogle}
                disabled={googleLoading}
                type="button"
                className="w-full py-3 px-4 font-brutal uppercase tracking-wider text-sm border-[3px] border-black bg-white text-black hover:bg-black hover:text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-3"
                style={{ boxShadow: '4px 4px 0px #000' }}
              >
                {googleLoading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> SIGNING IN...</>
                ) : (
                  <>
                    {/* Google G logo */}
                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    SIGN IN WITH GOOGLE
                  </>
                )}
              </button>

              {/* Guest */}
              <button
                onClick={handleGuest}
                disabled={guestLoading}
                type="button"
                className="w-full py-3 px-4 font-brutal uppercase tracking-wider text-sm border-[3px] border-black bg-[#F0EDE0] text-black hover:bg-black hover:text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ boxShadow: '4px 4px 0px #000' }}
              >
                {guestLoading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> SNEAKING IN...</>
                ) : (
                  <><Ghost className="w-5 h-5" /> BROWSE AS GUEST</>
                )}
              </button>
              <p className="text-center font-mono text-xs text-black/40">
                Read-only · no account needed
              </p>
            </div>

            {/* Toggle Login / Signup */}
            <div className="border-t-[2px] border-black px-5 py-4 text-center bg-[#FAFAF5]">
              <button
                onClick={() => setIsSignup((s) => !s)}
                className="font-bold text-sm underline hover:no-underline hover:text-hot-pink transition-colors"
              >
                {isSignup ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
