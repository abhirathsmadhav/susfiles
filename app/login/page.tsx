'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { Eye, EyeOff, FolderSearch, Ghost, Lock, UserPlus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login, signup, loginAsGuest, loginWithGoogle } = useAuth();
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
        document.cookie = 'sus-session=1; path=/; max-age=86400';
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
      document.cookie = 'sus-session=1; path=/; max-age=86400';
      toast.success('Logged in with Google! 🚀');
      router.push('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google login failed';
      toast.error(msg.replace('Firebase: ', '').replace(/\(auth\/.*\)/, '').trim());
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-off-white flex flex-col items-center justify-center p-4">
      {/* Big logo */}
      <Link href="/" className="font-brutal text-3xl mb-8 flex items-center gap-2 hover:skew-x-[-3deg] transition-transform">
        <FolderSearch className="w-8 h-8" strokeWidth={3} /> THE SUS FILES
      </Link>

      <div className="w-full max-w-sm">
        <div className="border-[4px] border-black bg-white" style={{ boxShadow: '8px 8px 0px #F5F500' }}>
          {/* Header */}
          <div className="border-b-[3px] border-black px-6 py-4 bg-acid-yellow">
            <h1 className="font-brutal text-2xl flex items-center gap-2">
              {isSignup ? <><UserPlus className="w-6 h-6" /> JOIN THE FILES</> : <><Lock className="w-6 h-6" /> ACCESS THE FILES</>}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
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
                />
              </div>
            )}
            <div>
              <label className="font-brutal text-xs uppercase tracking-wider block mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="input-brutal"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="font-brutal text-xs uppercase tracking-wider block mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="input-brutal w-full pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-black/60 hover:text-black transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-brutal w-full justify-center mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
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
          <div className="flex items-center gap-3 px-6">
            <div className="flex-1 h-[2px] bg-black/10" />
            <span className="font-brutal text-xs text-black/40 uppercase tracking-widest">or</span>
            <div className="flex-1 h-[2px] bg-black/10" />
          </div>

          {/* Guest button */}
          <div className="px-6 pb-2 pt-4 flex flex-col gap-3">
            <button
              onClick={handleGoogle}
              disabled={googleLoading}
              type="button"
              className="w-full py-3 px-5 font-brutal uppercase tracking-wider text-sm border-[3px] border-black bg-[#4285F4] text-white hover:bg-black hover:text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ boxShadow: '4px 4px 0px #000' }}
            >
              {googleLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> SIGNING IN...</> : 'SIGN IN WITH GOOGLE'}
            </button>
            
            <button
              onClick={handleGuest}
              disabled={guestLoading}
              type="button"
              className="w-full py-3 px-5 font-brutal uppercase tracking-wider text-sm border-[3px] border-black bg-white hover:bg-black hover:text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ boxShadow: '4px 4px 0px #000' }}
            >
              {guestLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> SNEAKING IN...</>
              ) : (
                <><Ghost className="w-5 h-5" /> BROWSE AS GUEST</>
              )}
            </button>
            <p className="text-center font-mono text-xs text-black/40 mt-1">
              Read-only · no account needed
            </p>
          </div>

          <div className="border-t-[2px] border-black px-6 py-4 text-center">
            <button
              onClick={() => setIsSignup((s) => !s)}
              className="font-bold text-sm underline hover:no-underline"
            >
              {isSignup ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
