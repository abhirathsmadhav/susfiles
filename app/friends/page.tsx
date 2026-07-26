'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Friend } from '@/types';
import Nav from '@/components/Nav';
import FriendCard from '@/components/FriendCard';

export default function FriendsPage() {
  const [verifiedSuspects, setVerifiedSuspects] = useState<Friend[]>([]);
  const [manualSuspects, setManualSuspects] = useState<Friend[]>([]);
  const [search, setSearch] = useState('');
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

        setVerifiedSuspects(mappedUsers);
        setManualSuspects(mappedFriends);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredVerified = verifiedSuspects.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase()) || 
    f.nickname?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredManual = manualSuspects.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase()) || 
    f.nickname?.toLowerCase().includes(search.toLowerCase())
  );

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
            {loading ? '...' : `${verifiedSuspects.length + manualSuspects.length} total suspect(s) on file.`}
          </p>
          <div className="mt-4 max-w-md relative">
            <input 
              type="text" 
              placeholder="SEARCH SUSPECTS..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-brutal w-full py-2 px-3 text-sm bg-white"
            />
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-8 flex flex-col gap-8">
        {loading ? (
          <div className="panel-brutal text-center py-16">
            <p className="font-brutal text-xl animate-pulse">📂 LOADING SUSPECTS...</p>
          </div>
        ) : (
          <>
            <div>
              <h2 className="font-brutal text-2xl mb-4 border-b-[3px] border-black pb-2">✅ VERIFIED SUSPECTS</h2>
              {filteredVerified.length === 0 ? (
                <p className="font-mono text-sm opacity-60">No verified suspects found.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
                  {filteredVerified.map((friend) => (
                    <FriendCard key={friend.id} friend={friend} />
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="font-brutal text-2xl mb-4 border-b-[3px] border-black pb-2">📝 MANUAL SUSPECTS</h2>
              {filteredManual.length === 0 ? (
                <p className="font-mono text-sm opacity-60">No manual suspects found.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
                  {filteredManual.map((friend) => (
                    <FriendCard key={friend.id} friend={friend} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
