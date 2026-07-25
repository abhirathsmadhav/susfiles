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
    // Get current logged in user to show "EDIT PROFILE" for their own profile
    const unsub = auth.onAuthStateChanged(u => setCurrentUserUid(u?.uid || null));
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
          // If not found in friends, check users
          const userSnap = await getDoc(doc(db, 'users', id));
          if (userSnap.exists()) {
            const uData = userSnap.data();
            friendData = {
              id: userSnap.id,
              name: uData.displayName || 'Unknown',
              nickname: uData.callSign || (uData.username ? `@${uData.username}` : undefined),
              avatarUrl: uData.avatarUrl,
              signatureColor: uData.signatureColor || '#F5F500',
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
        <div className="flex items-center justify-center py-40">
          <p className="font-brutal text-2xl animate-pulse">📂 LOADING FILE...</p>
        </div>
      </div>
    );
  }

  if (notFound || !friend) {
    return (
      <div className="min-h-screen bg-off-white">
        <Nav />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <p className="font-brutal text-4xl">🕵️ SUSPECT NOT FOUND</p>
          <Link href="/friends" className="btn-brutal mt-6 inline-flex">
            BACK TO THE CREW
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-off-white">
      <Nav />

      {/* Profile header */}
      <div
        className="border-b-[3px] border-black"
        style={{ background: friend.signatureColor }}
      >
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col items-start gap-4">
          <div className="flex gap-3">
            <Link
              href="/friends"
              className="inline-flex items-center gap-1 font-bold text-sm border-[2px] border-black px-3 py-1 bg-white hover:bg-black hover:text-white transition-colors"
            >
              ← BACK TO THE CREW
            </Link>
            {!isUser && friend.createdBy === currentUserUid && (
              <Link
                href={`/suspects/edit/${id}`}
                className="inline-flex items-center gap-1 font-bold text-sm border-[2px] border-black px-3 py-1 bg-white hover:bg-black hover:text-white transition-colors"
              >
                ✏️ EDIT SUSPECT
              </Link>
            )}
            {isUser && currentUserUid === id && (
              <Link
                href="/profile"
                className="inline-flex items-center gap-1 font-bold text-sm border-[2px] border-black px-3 py-1 bg-white hover:bg-black hover:text-white transition-colors"
              >
                ✏️ EDIT PROFILE
              </Link>
            )}
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div
              className="w-32 h-32 border-[4px] border-black overflow-hidden flex-shrink-0"
              style={{ boxShadow: '6px 6px 0px #000' }}
            >
              {friend.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={friend.avatarUrl}
                  alt={friend.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-brutal text-5xl bg-white">
                  {friend.name.charAt(0)}
                </div>
              )}
            </div>

            {/* Info */}
            <div>
              <h1 className="font-brutal text-4xl md:text-6xl leading-none">{friend.name}</h1>
              {friend.nickname && (
                <p className="font-mono font-bold uppercase text-sm mt-1 opacity-70">
                  aka {friend.nickname}
                </p>
              )}
              <p
                className="mt-3 text-lg italic border-l-4 border-black pl-3 max-w-lg"
                style={{ fontFamily: 'Space Mono, monospace' }}
              >
                &quot;{friend.tagline}&quot;
              </p>
              <div className="mt-4 flex items-center gap-3">
                <span className="tag-brutal bg-black text-white">
                  {cards.length} FILE{cards.length !== 1 ? 'S' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cards */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="font-brutal text-2xl mb-6">
          📁 {friend.name.toUpperCase()}&apos;S SUS FILES
        </h2>
        {cards.length === 0 ? (
          <div className="panel-brutal text-center py-16">
            <p className="font-brutal text-2xl">🧹 CLEAN RECORD</p>
            <p className="text-sm opacity-60 mt-2">Nothing on file. Yet.</p>
          </div>
        ) : (
          <WallCanvas cards={cards} friends={allFriends} />
        )}
      </main>
    </div>
  );
}
