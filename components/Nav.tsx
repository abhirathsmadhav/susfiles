'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FolderSearch, LayoutGrid, Users, PlusCircle, UserPlus, LogIn, LogOut, User, Ghost } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from 'next-themes';

export default function Nav() {
  const { user, isGuest, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleLogout = async () => {
    await logout();
    document.cookie = 'sus-session=; Max-Age=0; path=/';
    toast.success('Logged out!');
    router.push('/');
  };

  const navLinks = [
    { href: '/', label: 'THE WALL', icon: <LayoutGrid className="w-5 h-5 mr-1 inline" /> },
    { href: '/friends', label: 'THE CREW', icon: <Users className="w-5 h-5 mr-1 inline" /> },
  ];

  return (
    <>
      {/* --- DESKTOP BRUTALIST NAV --- */}
      <nav className="hidden md:flex sticky top-0 z-[100] w-full items-center justify-between px-6 py-4 bg-acid-yellow dark:bg-black border-b-[4px] border-black dark:border-white shadow-[0_4px_0_0_#000] dark:shadow-[0_4px_0_0_#fff] transition-colors duration-300">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-brutal text-3xl tracking-tight hover:skew-x-[-3deg] transition-transform duration-100 dark:text-acid-yellow flex items-center gap-2">
            <FolderSearch className="w-8 h-8" strokeWidth={3} /> SUS FILES
          </Link>

          <div className="flex items-center gap-2">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-4 py-2 font-bold uppercase text-sm tracking-wide border-[3px] border-transparent transition-all hover:border-black dark:hover:border-white hover:bg-black dark:hover:bg-white hover:text-acid-yellow dark:hover:text-black ${
                  pathname === l.href ? 'border-black dark:border-white bg-black dark:bg-white text-acid-yellow dark:text-black' : 'dark:text-white'
                }`}
                style={{ fontFamily: 'Archivo Black, sans-serif' }}
              >
                {l.icon} {l.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Only show Add buttons if logged in */}
          {user && (
            <div className="flex items-center gap-2 mr-2">
              <Link
                href="/post"
                className="px-4 py-2 font-bold uppercase text-sm tracking-wide border-[3px] border-black dark:border-white bg-lime-green dark:bg-black text-black dark:text-lime-green hover:bg-black hover:text-lime-green dark:hover:bg-white dark:hover:text-black transition-colors flex items-center gap-1"
                style={{ fontFamily: 'Archivo Black, sans-serif' }}
              >
                <PlusCircle className="w-4 h-4" /> POST
              </Link>
              <Link
                href="/suspects/new"
                className="px-4 py-2 font-bold uppercase text-sm tracking-wide border-[3px] border-black dark:border-white bg-hot-pink dark:bg-black text-black dark:text-hot-pink hover:bg-black hover:text-hot-pink dark:hover:bg-white dark:hover:text-black transition-colors flex items-center gap-1"
                style={{ fontFamily: 'Archivo Black, sans-serif' }}
              >
                <UserPlus className="w-4 h-4" /> SUSPECT
              </Link>
            </div>
          )}



          {user ? (
            <div className="flex items-center gap-2">
              {isGuest && (
                <Link
                  href="/login"
                  className="flex items-center gap-1 px-4 py-2 border-[3px] border-black dark:border-white font-brutal text-sm uppercase bg-white dark:bg-brutal-black hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                >
                  <Ghost className="w-4 h-4" /> SIGN UP
                </Link>
              )}
              <Link
                href="/profile"
                className="flex items-center gap-1 px-4 py-2 border-[3px] border-black dark:border-white font-brutal text-sm uppercase bg-white dark:bg-brutal-black hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
              >
                <User className="w-4 h-4" /> PROFILE
              </Link>
              <button onClick={handleLogout} className="flex items-center gap-1 btn-brutal px-4 py-2 text-sm bg-white dark:bg-brutal-black dark:text-white dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black">
                <LogOut className="w-4 h-4" /> LOG OUT
              </button>
            </div>
          ) : (
            <Link href="/login" className="flex items-center gap-1 btn-brutal px-4 py-2 text-sm bg-white dark:bg-brutal-black dark:text-white dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black">
              <LogIn className="w-4 h-4" /> LOG IN
            </Link>
          )}
        </div>
      </nav>

      {/* --- MOBILE BOTTOM TAB BAR --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] flex items-center justify-around bg-acid-yellow dark:bg-black border-t-[3px] border-black dark:border-white pb-safe">
        {navLinks.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`flex flex-col items-center justify-center flex-1 py-3 border-r-[3px] border-black dark:border-white last:border-r-0 transition-colors ${
              pathname === l.href ? 'bg-black text-acid-yellow dark:bg-white dark:text-black' : 'dark:text-white hover:bg-black/10 dark:hover:bg-white/10'
            }`}
          >
            <span className="text-xl mb-1">{l.href === '/' ? <LayoutGrid /> : <Users />}</span>
            <span className="font-brutal text-[10px] leading-none uppercase">{l.label.split(' ').slice(1).join(' ')}</span>
          </Link>
        ))}



        {user && (
          <Link
            href="/post"
            className={`flex flex-col items-center justify-center flex-1 py-3 border-r-[3px] border-black dark:border-white transition-colors ${
              pathname === '/post' ? 'bg-acid-yellow text-black' : 'dark:text-white hover:bg-black/10 dark:hover:bg-white/10'
            }`}
          >
            <span className="text-xl mb-1"><PlusCircle /></span>
            <span className="font-brutal text-[10px] leading-none uppercase">POST</span>
          </Link>
        )}

        {user && (
          <Link
            href="/profile"
            className={`flex flex-col items-center justify-center flex-1 py-3 border-r-[3px] border-black dark:border-white transition-colors ${
              pathname === '/profile' ? 'bg-acid-yellow text-black' : 'dark:text-white hover:bg-black/10 dark:hover:bg-white/10'
            }`}
          >
            <span className="text-xl mb-1"><User /></span>
            <span className="font-brutal text-[10px] leading-none uppercase">ME</span>
          </Link>
        )}

        {user ? (
          <button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center flex-1 py-3 border-black dark:border-white transition-colors dark:text-white hover:bg-black/10 dark:hover:bg-white/10"
          >
            <span className="text-xl mb-1"><LogOut /></span>
            <span className="font-brutal text-[10px] leading-none uppercase">OUT</span>
          </button>
        ) : (
          <Link
            href="/login"
            className="flex flex-col items-center justify-center flex-1 py-3 border-black dark:border-white transition-colors dark:text-white hover:bg-black/10 dark:hover:bg-white/10"
          >
            <span className="text-xl mb-1"><LogIn /></span>
            <span className="font-brutal text-[10px] leading-none uppercase">IN</span>
          </Link>
        )}
      </nav>
      
      {/* Spacer for bottom tab bar on mobile */}
      <div className="h-16 md:hidden" />
    </>
  );
}
