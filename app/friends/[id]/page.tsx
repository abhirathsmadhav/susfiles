'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Friend, Card } from '@/types';
import Nav from '@/components/Nav';
import WallCanvas from '@/components/WallCanvas';
import Link from 'next/link';
import { use } from 'react';

interface Props {
  params: Promise<{ id: string }>;
}

export default function FriendPage({ params }: Props) {
  const { id } = use(params);
  const [friend, setFriend] = useState<Friend | null>(null);
  const [allFriends, setAllFriends] = useState<Friend[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isUser, setIsUser] = useState(false);
  const [currentUserUid, setCurrentUserUid] = useState<string | null>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setCurrentUserUid(u?.uid || null));
    return unsub;
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [friendSnap, allFriendsSnap, cardsSnap] = await Promise.all([
          getDoc(doc(db, 'friends', id)),
          getDocs(collection(db, 'friends')),
          getDocs(
            query(
              collection(db, 'cards'),
              where('linkedFriendIds', 'array-contains', id),
              orderBy('createdAt', 'desc')
            )
          ),
        ]);

        let friendData: Friend | null = null;
        let isRegisteredUser = false;

        if (friendSnap.exists()) {
          friendData = { id: friendSnap.id, ...friendSnap.data() } as Friend;
        } else {
          const userSnap = await getDoc(doc(db, 'users', id));
          if (userSnap.exists()) {
            const uData = userSnap.data();
            friendData = {
              id: userSnap.id,
              name: uData.displayName || 'Unknown',
              nickname: uData.callSign || (uData.username ? `@${uData.username}` : undefined),
              avatarUrl: uData.avatarUrl,
              signatureColor: uData.signatureColor || '#F5F500',
              tagline: uData.tagline || '',
              createdAt: uData.createdAt,
            };
            isRegisteredUser = true;
          }
        }

        if (!friendData) {
          setNotFound(true);
          return;
        }

        setIsUser(isRegisteredUser);
        setFriend(friendData);
        setAllFriends(allFriendsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Friend)));
        setCards(cardsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Card)));
      } catch (err) {
        console.error('Failed to load friend:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-off-white">
        <Nav />
        <div className="flex items-center justify-center py-32">
          <p className="font-brutal text-xl animate-pulse">📂 LOADING FILE...</p>
        </div>
      </div>
    );
  }

  if (notFound || !friend) {
    return (
      <div className="min-h-screen bg-off-white">
        <Nav />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <p className="font-brutal text-3xl">🕵️ SUSPECT NOT FOUND</p>
          <Link href="/friends" className="btn-brutal mt-6 inline-flex">
            BACK TO THE CREW
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-off-white" style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))' }}>
      <Nav />

      {/* Profile header */}
      <div className="border-b-[3px] border-black" style={{ background: friend.signatureColor }}>
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
          {/* Back + edit buttons */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <Link
              href="/friends"
              className="inline-flex items-center gap-1 font-brutal text-xs border-[2px] border-black px-3 py-2 bg-white hover:bg-black hover:text-white transition-colors"
              style={{ boxShadow: '2px 2px 0px #000' }}
            >
              ← THE CREW
            </Link>
            {!isUser && friend.createdBy === currentUserUid && (
              <Link
                href={`/suspects/edit/${id}`}
                className="inline-flex items-center gap-1 font-brutal text-xs border-[2px] border-black px-3 py-2 bg-white hover:bg-black hover:text-white transition-colors"
                style={{ boxShadow: '2px 2px 0px #000' }}
              >
                ✏️ EDIT
              </Link>
            )}
            {isUser && currentUserUid === id && (
              <Link
                href="/profile"
                className="inline-flex items-center gap-1 font-brutal text-xs border-[2px] border-black px-3 py-2 bg-white hover:bg-black hover:text-white transition-colors"
                style={{ boxShadow: '2px 2px 0px #000' }}
              >
                ✏️ EDIT PROFILE
              </Link>
            )}
          </div>

          {/* Avatar + Info — horizontal on mobile */}
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 md:w-28 md:h-28 border-[3px] md:border-[4px] border-black overflow-hidden flex-shrink-0"
              style={{ boxShadow: '4px 4px 0px #000' }}
            >
              {friend.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={friend.avatarUrl} alt={friend.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-brutal text-3xl md:text-5xl bg-white">
                  {friend.name.charAt(0)}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="font-brutal text-2xl md:text-5xl leading-none truncate">{friend.name}</h1>
              {friend.nickname && (
                <p className="font-mono font-bold text-xs mt-0.5 opacity-60 uppercase">
                  aka {friend.nickname}
                </p>
              )}
              {friend.tagline && (
                <p
                  className="mt-2 text-sm italic border-l-4 border-black pl-3 line-clamp-2"
                  style={{ fontFamily: 'Space Mono, monospace' }}
                >
                  &ldquo;{friend.tagline}&rdquo;
                </p>
              )}
              <div className="mt-2">
                <span className="tag-brutal bg-black text-white text-xs">
                  {cards.length} FILE{cards.length !== 1 ? 'S' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cards */}
      <main className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-8">
        <h2 className="font-brutal text-xl md:text-2xl mb-4">
          📁 {friend.name.toUpperCase()}&apos;S SUS FILES
        </h2>
        {cards.length === 0 ? (
          <div className="panel-brutal text-center py-12">
            <p className="font-brutal text-xl">🧹 CLEAN RECORD</p>
            <p className="text-sm opacity-60 mt-2">Nothing on file. Yet.</p>
          </div>
        ) : (
          <WallCanvas cards={cards} friends={allFriends} />
        )}
      </main>
    </div>
  );
}
