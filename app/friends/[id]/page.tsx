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
  addDoc,
  deleteDoc,
  getCountFromServer,
  limit,
  startAfter
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Friend, Card, UserProfile } from '@/types';
import Nav from '@/components/Nav';
import WallCanvas from '@/components/WallCanvas';
import Link from 'next/link';
import { use } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth-context';

interface Props {
  params: Promise<{ id: string }>;
}

export default function FriendPage({ params }: Props) {
  const { id } = use(params);
  const { user: authUser, profile: currentUserProfile } = useAuth();
  
  const [friend, setFriend] = useState<Friend | null>(null);
  const [allFriends, setAllFriends] = useState<Friend[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isUser, setIsUser] = useState(false);
  const [currentUserUid, setCurrentUserUid] = useState<string | null>(null);

  // Rap Sheet Stats
  const [stats, setStats] = useState({ uploads: 0, tagged: 0 });

  // Friend Request State
  const [isFriend, setIsFriend] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);

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
              orderBy('createdAt', 'desc'),
              limit(30)
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
            const uData = userSnap.data() as UserProfile;
            friendData = {
              id: userSnap.id,
              name: uData.displayName || 'Unknown',
              nickname: uData.callSign || (uData.username ? `@${uData.username}` : ''),
              avatarUrl: uData.avatarUrl || '',
              signatureColor: uData.signatureColor || '#F5F500',
              tagline: '',
              createdAt: uData.createdAt,
            };
            isRegisteredUser = true;

            // Check friendship status
            if (currentUserProfile) {
              if (currentUserProfile.friendIds?.includes(id)) {
                setIsFriend(true);
              } else {
                // Check if request is already sent
                const q = query(
                  collection(db, 'friendRequests'),
                  where('from', '==', authUser?.uid || currentUserProfile.uid || ''),
                  where('to', '==', id),
                  where('status', '==', 'pending')
                );
                const reqSnap = await getDocs(q);
                if (!reqSnap.empty) {
                  setRequestSent(true);
                  setRequestId(reqSnap.docs[0].id);
                }
              }
            }
          }
        }

        if (!friendData) {
          setNotFound(true);
          return;
        }

        let uploadsCount = 0;
        if (isRegisteredUser) {
          try {
            const uploadsQuery = query(collection(db, 'cards'), where('createdBy', '==', id));
            const uploadsSnap = await getCountFromServer(uploadsQuery);
            uploadsCount = uploadsSnap.data().count;
          } catch (e) {
            console.error('Failed to count uploads', e);
          }
        }

        setIsUser(isRegisteredUser);
        setFriend(friendData);
        setAllFriends(allFriendsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Friend)));
        setCards(cardsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Card)));
        setStats({ uploads: uploadsCount, tagged: cardsSnap.docs.length });
        setLastVisible(cardsSnap.docs[cardsSnap.docs.length - 1]);
        if (cardsSnap.docs.length < 30) setHasMore(false);
      } catch (err) {
        console.error('Failed to load friend:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    
    if (currentUserProfile !== undefined && authUser !== undefined) {
      load();
    }
  }, [id, currentUserProfile, authUser]);

  const loadMore = async () => {
    if (!lastVisible || !hasMore) return;
    try {
      const q = query(
        collection(db, 'cards'),
        where('linkedFriendIds', 'array-contains', id),
        orderBy('createdAt', 'desc'),
        startAfter(lastVisible),
        limit(30)
      );
      const snap = await getDocs(q);
      setLastVisible(snap.docs[snap.docs.length - 1]);
      if (snap.docs.length < 30) setHasMore(false);
      setCards(prev => [...prev, ...snap.docs.map((d) => ({ id: d.id, ...d.data() } as Card))]);
    } catch (e) {
      console.error('Failed to load more friend cards', e);
    }
  };

  const handleSendRequest = async () => {
    if (!currentUserProfile || !authUser) return;
    if (authUser.isAnonymous) {
      toast.error('Guests cannot send friend requests.');
      return;
    }
    setActionLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'friendRequests'), {
        from: authUser.uid,
        to: id,
        status: 'pending',
        createdAt: new Date().toISOString(),
        fromName: currentUserProfile.displayName,
        fromAvatar: currentUserProfile.avatarUrl || '',
        fromUsername: currentUserProfile.username || ''
      });
      setRequestSent(true);
      setRequestId(docRef.id);
      toast.success('Friend request sent! 📨');
    } catch (err) {
      toast.error('Failed to send request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!requestId) return;
    setActionLoading(true);
    try {
      await deleteDoc(doc(db, 'friendRequests', requestId));
      setRequestSent(false);
      setRequestId(null);
      toast.success('Request cancelled');
    } catch (err) {
      toast.error('Failed to cancel request');
    } finally {
      setActionLoading(false);
    }
  };

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
            {isUser && currentUserUid !== id && currentUserProfile && (
              <>
                {isFriend ? (
                  <button
                    disabled
                    className="inline-flex items-center gap-1 font-brutal text-xs border-[2px] border-black px-3 py-2 bg-lime-green text-black"
                    style={{ boxShadow: '2px 2px 0px #000' }}
                  >
                    🤝 FRIENDS
                  </button>
                ) : requestSent ? (
                  <button
                    onClick={handleCancelRequest}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1 font-brutal text-xs border-[2px] border-black px-3 py-2 bg-black text-white hover:bg-[#FF2D78] transition-colors"
                    style={{ boxShadow: '2px 2px 0px #000' }}
                  >
                    {actionLoading ? '...' : 'CANCEL REQUEST'}
                  </button>
                ) : (
                  <button
                    onClick={handleSendRequest}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1 font-brutal text-xs border-[2px] border-black px-3 py-2 bg-white hover:bg-black hover:text-white transition-colors"
                    style={{ boxShadow: '2px 2px 0px #000' }}
                  >
                    {actionLoading ? '...' : '➕ ADD FRIEND'}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Avatar + Info — horizontal on mobile */}
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 md:w-28 md:h-28 border-[3px] md:border-[4px] border-black overflow-hidden flex-shrink-0 bg-white"
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
              <h1 className="font-brutal text-2xl md:text-5xl leading-none truncate bg-white inline-block px-2 border-2 border-black" style={{ boxShadow: '2px 2px 0px #000' }}>
                {friend.name}
              </h1>
              {friend.nickname && (
                <p className="font-mono font-bold text-xs mt-1 bg-black text-white inline-block px-2 ml-2">
                  {friend.nickname.startsWith('@') ? '' : 'aka '}{friend.nickname}
                </p>
              )}
              {friend.tagline && (
                <div className="mt-2 inline-block">
                  <p className="text-sm italic font-mono font-bold border-2 border-black pl-2 pr-3 py-0.5 bg-[#FAFAF5] text-black">
                    &ldquo;{friend.tagline}&rdquo;
                  </p>
                </div>
              )}
              <div className="mt-2">
                <span className="tag-brutal bg-white text-black border-2 border-black text-xs">
                  {cards.length} FILE{cards.length !== 1 ? 'S' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rap Sheet Stats */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="flex bg-black text-acid-yellow border-4 border-black divide-x-4 divide-black">
          <div className="flex-1 p-3 text-center">
            <div className="font-brutal text-2xl">{stats.uploads}</div>
            <div className="font-brutal text-xs tracking-wider opacity-80">FILES UPLOADED</div>
          </div>
          <div className="flex-1 p-3 text-center">
            <div className="font-brutal text-2xl">{stats.tagged}</div>
            <div className="font-brutal text-xs tracking-wider opacity-80">TIMES TAGGED</div>
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
          <WallCanvas cards={cards} friends={allFriends} onLoadMore={loadMore} hasMore={hasMore} />
        )}
      </main>
    </div>
  );
}
