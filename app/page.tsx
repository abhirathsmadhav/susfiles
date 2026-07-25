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
          getDocs(collection(db, 'users'))
        ]);
        
        const mappedUsers: Friend[] = usersSnap.docs
          .filter(d => d.data().username)
          .map(d => {
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
        
        const mappedFriends: Friend[] = friendsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Friend));
        
        setFriends([...mappedUsers, ...mappedFriends]);
        setCards(cardsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Card)));
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
    } catch (err) {
      toast.error('Failed to start browsing as guest');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center">
        <p className="font-brutal text-2xl animate-pulse">🕵️ VERIFYING CLEARANCE...</p>
      </div>
    );
  }

  // --- LANDING PAGE (Logged Out) ---
  if (!user) {
    return (
      <div className="min-h-screen bg-off-white dark:bg-brutal-black transition-colors duration-300 flex flex-col">
        <Nav />
        <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <div className="max-w-2xl mx-auto space-y-8">
            <h1
              className="font-brutal text-6xl md:text-8xl leading-none tracking-tight"
              style={{ WebkitTextStroke: '2px #000' }}
            >
              THE SUS
              <br />
              <span className="relative inline-block">
                FILES
                <span
                  className="absolute -bottom-1 left-0 w-full h-3 bg-hot-pink"
                  style={{ transform: 'skew(-5deg)' }}
                />
              </span>
            </h1>
            
            <p className="font-mono text-lg md:text-xl max-w-lg mx-auto opacity-80">
              A highly classified, chaotic archive of your friends&apos; most unhinged quotes, photos, and completely out-of-context moments.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <button
                onClick={handleGuestLogin}
                className="btn-brutal text-lg px-8 py-4 bg-acid-yellow hover:bg-black hover:text-acid-yellow w-full sm:w-auto"
              >
                👻 START BROWSING
              </button>
              <Link
                href="/login"
                className="btn-brutal text-lg px-8 py-4 bg-white hover:bg-black hover:text-white w-full sm:w-auto"
              >
                🔐 LOG IN
              </Link>
            </div>
          </div>
          
          {/* Tutorial / Guide Section */}
          <div className="max-w-4xl mx-auto w-full mt-24 text-left pb-12">
            <h2 className="font-brutal text-3xl mb-8 border-b-[4px] border-black pb-2 inline-block">CLASSIFIED BRIEFING</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="panel-brutal bg-[#F0EDE0]">
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-black text-[#F5F500] font-brutal text-xl">1</span>
                  <h3 className="font-brutal text-xl">Identify Suspects</h3>
                </div>
                <p className="font-mono text-sm opacity-80">Add your friends to The Crew. Give them a Call Sign and assign a signature color to track them across the archive.</p>
              </div>
              <div className="panel-brutal bg-white">
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-black text-[#FF2D78] font-brutal text-xl">2</span>
                  <h3 className="font-brutal text-xl">Compile Evidence</h3>
                </div>
                <p className="font-mono text-sm opacity-80">Upload photos, out-of-context quotes, or weird texts to The Wall. Document the chaos.</p>
              </div>
              <div className="panel-brutal bg-white">
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-black text-[#39FF14] font-brutal text-xl">3</span>
                  <h3 className="font-brutal text-xl">Connect the Dots</h3>
                </div>
                <p className="font-mono text-sm opacity-80">Tag suspects in the evidence. Switch to Tree Mode to literally connect the string between suspects and their crimes.</p>
              </div>
              <div className="panel-brutal bg-[#F0EDE0]">
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-black text-[#0066FF] font-brutal text-xl">4</span>
                  <h3 className="font-brutal text-xl">Roast & React</h3>
                </div>
                <p className="font-mono text-sm opacity-80">Leave emoji reactions on posts. The most unhinged file will be crowned the 'Roast of the Day'.</p>
              </div>
            </div>
          </div>
        </main>
        
        <div className="w-full overflow-hidden border-t-[3px] border-black dark:border-white bg-acid-yellow dark:bg-black py-2 mt-auto">
          <div className="animate-marquee w-max">
            {[...Array(10)].map((_, i) => (
              <span key={i} className="font-brutal text-sm uppercase tracking-widest px-4 dark:text-acid-yellow whitespace-nowrap">
                ⚠️ HIGHLY CONFIDENTIAL ⚠️ THE SUS FILES ⚠️ DO NOT DISTRIBUTE ⚠️ BURN AFTER READING ⚠️ HIGHLY CONFIDENTIAL ⚠️ THE SUS FILES ⚠️ DO NOT DISTRIBUTE ⚠️ BURN AFTER READING 
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- FEED / WALL (Logged In) ---
  return (
    <div className="min-h-screen bg-off-white dark:bg-brutal-black transition-colors duration-300">
      <Nav />

      {/* Hero header */}
      <div className="border-b-[3px] border-black dark:border-white bg-acid-yellow dark:bg-brutal-black pt-16 md:pt-4 transition-colors">
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
            <div>
              <h1
                className="font-brutal text-4xl md:text-6xl leading-none tracking-tight dark:text-acid-yellow"
                style={{ WebkitTextStroke: '2px var(--stroke-color, #000)' }}
              >
                THE SUS ARCHIVE
              </h1>
              <p
                className="mt-2 text-sm md:text-base font-bold max-w-md"
                style={{ fontFamily: 'Space Mono, monospace' }}
              >
                Everything is connected. Investigate the suspects below.
              </p>
            </div>
            <div className="flex gap-3 text-center">
              <div className="panel-brutal py-2 px-4 bg-hot-pink border-black text-white">
                <div className="font-brutal text-2xl">{dataLoading ? '—' : cards.length}</div>
                <div className="font-mono text-[10px] uppercase">FILES</div>
              </div>
              <div className="panel-brutal py-2 px-4 bg-electric-blue border-black text-white">
                <div className="font-brutal text-2xl">{dataLoading ? '—' : friends.length}</div>
                <div className="font-mono text-[10px] uppercase">SUSPECTS</div>
              </div>
            </div>
          </div>
          {/* Portal target for WallCanvas toolbar */}
          <div id="wall-toolbar-portal" className="mt-8 empty:mt-0" />
        </div>
      </div>

      {/* Marquee Strip */}
      <div className="w-full overflow-hidden border-b-[3px] border-black dark:border-white bg-white dark:bg-brutal-black py-1">
        <div className="animate-marquee w-max">
          {[...Array(10)].map((_, i) => (
            <span key={i} className="font-brutal text-[10px] uppercase tracking-widest px-4 opacity-70 whitespace-nowrap">
              * UNAUTHORIZED ACCESS IS PROHIBITED * EYES ONLY * THE TRUTH IS IN HERE * UNAUTHORIZED ACCESS IS PROHIBITED * EYES ONLY * THE TRUTH IS IN HERE *
            </span>
          ))}
        </div>
      </div>

      {/* Wall */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {dataLoading ? (
          <div className="panel-brutal text-center py-20">
            <p className="font-brutal text-2xl animate-pulse">📂 LOADING THE FILES...</p>
          </div>
        ) : cards.length === 0 && friends.length === 0 ? (
          <div className="panel-brutal text-center py-20">
            <p className="font-brutal text-3xl mb-3">📁 NO FILES YET</p>
            <p className="font-mono text-sm opacity-60">
              The admin needs to add some sus content first.
            </p>
          </div>
        ) : (
          <WallCanvas cards={cards} friends={friends} />
        )}
      </main>
    </div>
  );
}

