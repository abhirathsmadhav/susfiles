'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, Friend } from '@/types';
import Nav from '@/components/Nav';
import WallCanvas from '@/components/WallCanvas';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function HomePage() {
  const { user, loading: authLoading, loginAsGuest } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      setDataLoading(false);
      return;
    }

    async function load() {
      setDataLoading(true);
      try {
        const [friendsSnap, cardsSnap, usersSnap] = await Promise.all([
          getDocs(query(collection(db, 'friends'), orderBy('createdAt', 'asc'))),
          getDocs(query(collection(db, 'cards'), orderBy('createdAt', 'desc'))),
          getDocs(collection(db, 'users')),
        ]);

        const mappedUsers: Friend[] = usersSnap.docs
          .filter((d) => d.data().username)
          .map((d) => {
            const data = d.data();
            return {
              id: data.uid,
              name: data.displayName || 'Unknown',
              nickname: data.callSign || `@${data.username}`,
              avatarUrl: data.avatarUrl,
              signatureColor: data.signatureColor || '#F5F500',
              tagline: data.tagline || '',
              createdAt: data.createdAt,
            };
          });

        const mappedFriends: Friend[] = friendsSnap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as Friend)
        );

        setFriends([...mappedUsers, ...mappedFriends]);
        setCards(cardsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Card)).filter(c => !c.spaceId));
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setDataLoading(false);
      }
    }
    load();
  }, [user]);

  const handleGuestLogin = async () => {
    try {
      await loginAsGuest();
      toast.success('Sneaking in as a guest 👻');
    } catch {
      toast.error('Failed to start browsing as guest');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center">
        <p className="font-brutal text-xl animate-pulse">🕵️ VERIFYING CLEARANCE...</p>
      </div>
    );
  }

  // --- LANDING PAGE (Logged Out) ---
  if (!user) {
    return (
      <div className="min-h-screen bg-off-white flex flex-col">
        <Nav />
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-10 text-center">
          <div className="max-w-lg mx-auto w-full">
            <h1
              className="font-brutal text-5xl sm:text-7xl leading-none tracking-tight mb-4"
              style={{ WebkitTextStroke: '2px #000' }}
            >
              THE SUS
              <br />
              <span className="relative inline-block">
                FILES
                <span
                  className="absolute -bottom-1 left-0 w-full h-2.5 bg-hot-pink"
                  style={{ transform: 'skew(-5deg)' }}
                />
              </span>
            </h1>

            <p className="font-mono text-base sm:text-lg max-w-sm mx-auto opacity-80 mt-6 mb-8">
              A highly classified archive of your friends&apos; most unhinged quotes, photos, and out-of-context moments.
            </p>

            <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
              <button
                onClick={handleGuestLogin}
                className="btn-brutal text-base px-6 py-4 bg-acid-yellow hover:bg-black hover:text-acid-yellow w-full"
              >
                👻 START BROWSING
              </button>
              <Link
                href="/login"
                className="btn-brutal text-base px-6 py-4 bg-white hover:bg-black hover:text-white w-full"
              >
                🔐 LOG IN / SIGN UP
              </Link>
            </div>
          </div>

          {/* How it works */}
          <div className="max-w-2xl mx-auto w-full mt-16 text-left">
            <h2 className="font-brutal text-2xl mb-5 border-b-[3px] border-black pb-2">
              CLASSIFIED BRIEFING
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { n: '1', color: '#F5F500', title: 'Identify Suspects', body: 'Add your friends. Give them a Call Sign and signature color.' },
                { n: '2', color: '#FF2D78', title: 'Compile Evidence', body: 'Upload photos, quotes, or weird texts to The Wall.' },
                { n: '3', color: '#39FF14', title: 'Connect the Dots', body: 'Tag suspects in the evidence. Use Tree Mode to connect the string.' },
                { n: '4', color: '#0066FF', title: 'Roast & React', body: "Leave emoji reactions. The most unhinged file becomes 'Roast of the Day'." },
                { n: '5', color: '#9D00FF', title: 'Private Spaces', body: 'Create encrypted walls. Lock evidence behind closed doors for invited eyes only.' },
                { n: '6', color: '#FFFFFF', title: 'Go Ghost', body: 'Browse the main archives anonymously without leaving a digital footprint.' },
              ].map((item) => (
                <div key={item.n} className="panel-brutal bg-white">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className="flex items-center justify-center w-7 h-7 border-[2px] border-black font-brutal text-sm flex-shrink-0"
                      style={{ background: item.color }}
                    >
                      {item.n}
                    </span>
                    <h3 className="font-brutal text-base">{item.title}</h3>
                  </div>
                  <p className="font-mono text-xs opacity-70 leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Marquee */}
        <div className="w-full overflow-hidden border-t-[3px] border-black bg-acid-yellow py-2">
          <div className="animate-marquee w-max">
            {[...Array(10)].map((_, i) => (
              <span key={i} className="font-brutal text-xs uppercase tracking-widest px-4 whitespace-nowrap">
                ⚠️ HIGHLY CONFIDENTIAL ⚠️ THE SUS FILES ⚠️ DO NOT DISTRIBUTE ⚠️ BURN AFTER READING ⚠️{' '}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- FEED / WALL (Logged In) ---
  return (
    <div className="min-h-screen bg-off-white snap-start" style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))' }}>
      <Nav />

      {/* Compact header */}
      <div className="border-b-[3px] border-black bg-acid-yellow">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="font-brutal text-2xl md:text-4xl leading-none tracking-tight">
                THE SUS ARCHIVE
              </h1>
              <p className="mt-0.5 text-xs font-bold opacity-60" style={{ fontFamily: 'Space Mono, monospace' }}>
                Everything is connected.
              </p>
            </div>
            <div className="flex gap-2 text-center flex-shrink-0">
              <div className="border-[2px] border-black bg-hot-pink text-white px-3 py-1.5" style={{ boxShadow: '3px 3px 0px #000' }}>
                <div className="font-brutal text-lg leading-none">{dataLoading ? '—' : cards.length}</div>
                <div className="font-mono text-[9px] uppercase">FILES</div>
              </div>
              <div className="border-[2px] border-black bg-electric-blue text-white px-3 py-1.5" style={{ boxShadow: '3px 3px 0px #000' }}>
                <div className="font-brutal text-lg leading-none">{dataLoading ? '—' : friends.length}</div>
                <div className="font-mono text-[9px] uppercase">SUSPECTS</div>
              </div>
            </div>
          </div>
          {/* Portal target for WallCanvas toolbar */}
          <div id="wall-toolbar-portal" className="mt-4 empty:mt-0" />
        </div>
      </div>

      {/* Marquee Strip */}
      <div className="w-full overflow-hidden border-b-[3px] border-black bg-white py-1">
        <div className="animate-marquee w-max">
          {[...Array(10)].map((_, i) => (
            <span key={i} className="font-brutal text-[10px] uppercase tracking-widest px-4 opacity-60 whitespace-nowrap">
              * UNAUTHORIZED ACCESS IS PROHIBITED * EYES ONLY * THE TRUTH IS IN HERE *{' '}
            </span>
          ))}
        </div>
      </div>

      {/* Wall */}
      <main className="w-full flex-1 flex flex-col">
        {dataLoading ? (
          <div className="max-w-7xl w-full mx-auto px-3 md:px-4 py-16 panel-brutal text-center mt-8">
            <p className="font-brutal text-xl animate-pulse">📂 LOADING THE FILES...</p>
          </div>
        ) : cards.length === 0 && friends.length === 0 ? (
          <div className="max-w-7xl w-full mx-auto px-3 md:px-4 py-16 panel-brutal text-center mt-8">
            <p className="font-brutal text-2xl mb-2">📁 NO FILES YET</p>
            <p className="font-mono text-sm opacity-60">The admin needs to add some sus content first.</p>
          </div>
        ) : (
          <WallCanvas cards={cards} friends={friends} />
        )}
      </main>
    </div>
  );
}
