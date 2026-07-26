'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  FolderSearch,
  LayoutGrid,
  Users,
  PlusCircle,
  UserPlus,
  LogIn,
  LogOut,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Nav() {
  const { user, isGuest, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleLogout = async () => {
    await logout();
    document.cookie = 'sus-session=; Max-Age=0; path=/';
    toast.success('Logged out!');
    router.push('/');
  };

  if (!mounted) return null;

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* ===== DESKTOP NAV ===== */}
      <nav className="hidden md:flex sticky top-0 z-[100] w-full items-center justify-between px-6 py-3 bg-acid-yellow border-b-[4px] border-black shadow-[0_4px_0_0_#000] transition-colors duration-300">
        <div className="flex items-center gap-5">
          <Link
            href="/"
            className="font-brutal text-2xl tracking-tight hover:skew-x-[-3deg] transition-transform duration-100 flex items-center gap-2"
          >
            <FolderSearch className="w-7 h-7" strokeWidth={3} /> SUS FILES
          </Link>

          <div className="flex items-center gap-1">
            {[
              { href: '/', label: 'THE WALL', icon: <LayoutGrid className="w-4 h-4" /> },
              { href: '/friends', label: 'THE CREW', icon: <Users className="w-4 h-4" /> },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-1 px-3 py-2 font-brutal text-xs uppercase tracking-wide border-[3px] border-transparent transition-all hover:border-black hover:bg-black hover:text-acid-yellow ${
                  isActive(l.href)
                    ? 'border-black bg-black text-acid-yellow'
                    : ''
                }`}
              >
                {l.icon} {l.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user && !isGuest && (
            <>
              <Link
                href="/post"
                className="flex items-center gap-1 px-3 py-2 font-brutal text-xs uppercase border-[3px] border-black bg-lime-green text-black hover:bg-black hover:text-lime-green transition-colors"
              >
                <PlusCircle className="w-4 h-4" /> POST
              </Link>
              <Link
                href="/suspects/new"
                className="flex items-center gap-1 px-3 py-2 font-brutal text-xs uppercase border-[3px] border-black bg-hot-pink text-white hover:bg-black hover:text-hot-pink transition-colors"
              >
                <UserPlus className="w-4 h-4" /> SUSPECT
              </Link>
            </>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="flex items-center gap-1 px-3 py-2 font-brutal text-xs uppercase border-[3px] border-black bg-white hover:bg-black hover:text-white transition-colors"
              >
                <User className="w-4 h-4" /> PROFILE
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 btn-brutal px-3 py-2 text-xs bg-white border-black hover:bg-black hover:text-white"
              >
                <LogOut className="w-4 h-4" /> LOG OUT
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1 btn-brutal px-3 py-2 text-xs bg-white border-black hover:bg-black hover:text-white"
            >
              <LogIn className="w-4 h-4" /> LOG IN
            </Link>
          )}
        </div>
      </nav>

      {/* ===== MOBILE TOP BAR ===== */}
      <header className="md:hidden sticky top-0 z-[100] flex items-center justify-between px-4 bg-acid-yellow border-b-[3px] border-black"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 10px)', paddingBottom: '10px' }}
      >
        <Link href="/" className="font-brutal text-xl tracking-tight flex items-center gap-1.5">
          <FolderSearch className="w-5 h-5" strokeWidth={3} /> SUS FILES
        </Link>
        {user && !isGuest && (
          <div className="flex items-center gap-1.5">
            <Link
              href="/post"
              className="flex items-center gap-1 px-2.5 py-1.5 font-brutal text-[11px] uppercase border-[2px] border-black bg-lime-green text-black"
              style={{ boxShadow: '2px 2px 0px #000' }}
            >
              <PlusCircle className="w-3.5 h-3.5" /> POST
            </Link>
            <Link
              href="/suspects/new"
              className="flex items-center gap-1 px-2.5 py-1.5 font-brutal text-[11px] uppercase border-[2px] border-black bg-hot-pink text-white"
              style={{ boxShadow: '2px 2px 0px #000' }}
            >
              <UserPlus className="w-3.5 h-3.5" /> +SUSPECT
            </Link>
          </div>
        )}
        {!user && (
          <Link
            href="/login"
            className="flex items-center gap-1 px-3 py-1.5 font-brutal text-xs uppercase border-[2px] border-black bg-white"
            style={{ boxShadow: '2px 2px 0px #000' }}
          >
            <LogIn className="w-3.5 h-3.5" /> LOG IN
          </Link>
        )}
      </header>

      {/* ===== MOBILE BOTTOM TAB BAR ===== */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-[100] flex items-stretch bg-acid-yellow border-t-[3px] border-black"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Wall */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center flex-1 py-2 gap-0.5 border-r-[3px] border-black transition-colors ${
            isActive('/') ? 'bg-black text-acid-yellow' : 'hover:bg-black/10'
          }`}
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="font-brutal text-[9px] leading-none uppercase">Wall</span>
        </Link>

        {/* Crew */}
        <Link
          href="/friends"
          className={`flex flex-col items-center justify-center flex-1 py-2 gap-0.5 border-r-[3px] border-black transition-colors ${
            isActive('/friends') ? 'bg-black text-acid-yellow' : 'hover:bg-black/10'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="font-brutal text-[9px] leading-none uppercase">Crew</span>
        </Link>

        {/* Profile (logged in) or Login */}
        {user ? (
          <>
            <Link
              href="/profile"
              className={`flex flex-col items-center justify-center flex-1 py-2 gap-0.5 border-r-[3px] border-black transition-colors ${
                isActive('/profile') ? 'bg-black text-acid-yellow' : 'hover:bg-black/10'
              }`}
            >
              <User className="w-5 h-5" />
              <span className="font-brutal text-[9px] leading-none uppercase">Me</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex flex-col items-center justify-center flex-1 py-2 gap-0.5 hover:bg-black/10 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-brutal text-[9px] leading-none uppercase">Out</span>
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className={`flex flex-col items-center justify-center flex-1 py-2 gap-0.5 transition-colors ${
              isActive('/login') ? 'bg-black text-acid-yellow' : 'hover:bg-black/10'
            }`}
          >
            <LogIn className="w-5 h-5" />
            <span className="font-brutal text-[9px] leading-none uppercase">Login</span>
          </Link>
        )}
      </nav>
    </>
  );
}
