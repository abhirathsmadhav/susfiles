'use client';

import AuthGuard from '@/components/AuthGuard';
import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import UploadZone from '@/components/UploadZone';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Friend } from '@/types';

export default function NewSuspectPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [tagline, setTagline] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [signatureColor, setSignatureColor] = useState('#F5F500');

  // Existing suspects
  const [existingPeople, setExistingPeople] = useState<Friend[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [friendsSnap, usersSnap] = await Promise.all([
          getDocs(collection(db, 'friends')),
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
              createdAt: data.createdAt,
              tagline: data.tagline || ''
            };
          });
        
        const mappedFriends: Friend[] = friendsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Friend));
        setExistingPeople([...mappedUsers, ...mappedFriends]);
      } catch (err) {
        console.error("Failed to load existing people", err);
      }
    }
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error('Name is required!');
      return;
    }

    setSaving(true);
    try {
      const data = {
        name,
        nickname: nickname || undefined,
        tagline: tagline || '',
        avatarUrl: avatarUrl || undefined,
        signatureColor,
        createdAt: new Date().toISOString(),
        createdBy: user?.uid || null,
      };

      await addDoc(collection(db, 'friends'), data);
      toast.success('NEW SUSPECT ADDED 🕵️');
      router.push('/');
    } catch (err) {
      toast.error('Failed to add suspect.');
    } finally {
      setSaving(false);
    }
  };

  const presetColors = [
    '#F5F500', // Acid Yellow
    '#FF2D78', // Hot Pink
    '#0066FF', // Electric Blue
    '#39FF14', // Lime Green
    '#FF5F1F', // Brutal Orange
    '#9000FF', // Brutal Purple
    '#FFFFFF', // White
    '#000000', // Black
  ];

  return (
    <AuthGuard>
      <div className="min-h-screen bg-off-white dark:bg-brutal-black transition-colors duration-300 flex flex-col pb-24 md:pb-0">
        <Nav />
        <main className="flex-1 max-w-xl w-full mx-auto p-4 md:p-8 mt-16 md:mt-24">
          <h1 className="font-brutal text-4xl mb-6 dark:text-lime-green">➕ ADD SUSPECT</h1>

          <form onSubmit={handleSubmit} className="panel-brutal flex flex-col gap-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block font-brutal text-sm mb-2 dark:text-white">FULL NAME *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="input-brutal w-full"
                  placeholder="e.g. John Doe"
                  required
                />
                
                {/* Similar Suspects Suggestion */}
                {name.length >= 2 && (
                  <div className="absolute top-full left-0 right-0 z-10 mt-1 flex flex-col gap-1">
                    {existingPeople
                      .filter(p => 
                        p.name.toLowerCase().includes(name.toLowerCase()) || 
                        p.nickname?.toLowerCase().includes(name.toLowerCase())
                      )
                      .slice(0, 3)
                      .map(p => (
                        <Link 
                          key={p.id} 
                          href={`/friends/${p.id}`}
                          className="bg-white border-[2px] border-black p-2 shadow-brutal-sm hover:-translate-y-1 transition-transform flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            {p.avatarUrl ? (
                              <img src={p.avatarUrl} alt={p.name} className="w-6 h-6 border border-black object-cover" />
                            ) : (
                              <div className="w-6 h-6 border border-black bg-gray-200 flex items-center justify-center text-xs font-bold">{p.name.charAt(0)}</div>
                            )}
                            <span className="font-bold text-sm text-black">{p.name}</span>
                          </div>
                          <span className="text-xs text-gray-500 font-bold">Already exists? 🕵️</span>
                        </Link>
                      ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block font-brutal text-sm mb-2 dark:text-white">ALIAS / NICKNAME</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  className="input-brutal w-full"
                  placeholder="e.g. J-Dog"
                />
              </div>
            </div>

            <div>
              <label className="block font-brutal text-sm mb-2 dark:text-white">TAGLINE / ONE-LINER (Optional)</label>
              <input
                type="text"
                value={tagline}
                onChange={e => setTagline(e.target.value)}
                className="input-brutal w-full"
                placeholder="e.g. Always looking sus in electrical."
              />
            </div>

            {/* Avatar Upload */}
            <div>
              <label className="block font-brutal text-sm mb-2 dark:text-white">MUGSHOT (Optional)</label>
              <UploadZone 
                onUpload={(url) => setAvatarUrl(url)} 
                currentUrl={avatarUrl} 
                acceptAudio={false} 
              />
            </div>

            {/* Signature Color */}
            <div>
              <label className="block font-brutal text-sm mb-2 dark:text-white">SIGNATURE COLOR</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {presetColors.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSignatureColor(c)}
                    className="w-8 h-8 border-[2px] border-black transition-transform hover:-translate-y-1"
                    style={{ 
                      backgroundColor: c,
                      boxShadow: signatureColor === c ? '0 0 0 3px black, 0 0 0 5px white' : '2px 2px 0px #000'
                    }}
                    title={c}
                  />
                ))}
              </div>
              <input
                type="color"
                value={signatureColor}
                onChange={e => setSignatureColor(e.target.value)}
                className="w-full h-12 p-1 border-[3px] border-black cursor-pointer bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn-brutal bg-lime-green w-full text-xl py-4 mt-4"
            >
              {saving ? 'ADDING...' : 'ADD SUSPECT TO DATABASE'}
            </button>
          </form>
        </main>
      </div>
    </AuthGuard>
  );
}
