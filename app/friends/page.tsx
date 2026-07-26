'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Friend } from '@/types';
import Nav from '@/components/Nav';
import FriendCard from '@/components/FriendCard';

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [friendsSnap, usersSnap] = await Promise.all([
          getDocs(query(collection(db, 'friends'), orderBy('createdAt', 'desc'))),
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
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-off-white" style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))' }}>
      <Nav />

      {/* Compact header */}
      <div className="border-b-[3px] border-black bg-lime-green">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-8">
          <h1 className="font-brutal text-3xl md:text-5xl leading-none">
            👥 THE CREW
          </h1>
          <p className="font-mono text-xs mt-1 opacity-60">
            {loading ? '...' : `${friends.length} suspect${friends.length !== 1 ? 's' : ''} on file.`}
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-8">
        {loading ? (
          <div className="panel-brutal text-center py-16">
            <p className="font-brutal text-xl animate-pulse">📂 LOADING SUSPECTS...</p>
          </div>
        ) : friends.length === 0 ? (
          <div className="panel-brutal text-center py-16">
            <p className="font-brutal text-xl">🤷 NO SUSPECTS YET</p>
            <p className="text-sm opacity-60 mt-2">The admin needs to add the crew first.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {friends.map((friend) => (
              <FriendCard key={friend.id} friend={friend} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
