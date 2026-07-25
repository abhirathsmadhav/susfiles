'use client';

import AuthGuard from '@/components/AuthGuard';
import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Friend, CardType } from '@/types';
import UploadZone from '@/components/UploadZone';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav';
import { useAuth } from '@/lib/auth-context';

export default function PostPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [type, setType] = useState<CardType>('image');
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [color, setColor] = useState('');

  useEffect(() => {
    async function loadFriends() {
      try {
        const [friendsSnap, usersSnap] = await Promise.all([
          getDocs(collection(db, 'friends')),
          getDocs(collection(db, 'users'))
        ]);
        
        const mappedUsers: Friend[] = usersSnap.docs
          .filter(d => d.data().username) // Only show users who have set up a username
          .map(d => {
            const data = d.data();
            return {
              id: data.uid,
              name: data.displayName || 'Unknown',
              nickname: data.callSign || `@${data.username}`,
              avatarUrl: data.avatarUrl,
              signatureColor: data.signatureColor || '#F5F500',
              createdAt: data.createdAt,
            };
          });
        
        const mappedFriends: Friend[] = friendsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Friend));
        
        // Merge and deduplicate just in case
        setFriends([...mappedUsers, ...mappedFriends]);
      } finally {
        setLoading(false);
      }
    }
    loadFriends();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content && !mediaUrl) {
      toast.error('You need some content or media!');
      return;
    }
    if (selectedFriends.length === 0) {
      toast.error('Tag at least one suspect!');
      return;
    }

    setSaving(true);
    try {
      const data: any = {
        type,
        content,
        linkedFriendIds: selectedFriends,
        reactions: {},
        createdAt: new Date().toISOString(),
        createdBy: user?.uid || null,
        position: {
          x: Math.floor(Math.random() * (typeof window !== 'undefined' ? window.innerWidth - 300 : 800)),
          y: Math.floor(Math.random() * (typeof window !== 'undefined' ? window.innerHeight - 300 : 800)),
          rotation: Math.floor(Math.random() * 30) - 15, // -15 to +15
        },
      };

      if (title) data.title = title;
      if (caption) data.caption = caption;
      if (color) data.color = color;

      if (type === 'image' && mediaUrl) data.imageUrl = mediaUrl;
      else if (type === 'audio' && mediaUrl) data.audioUrl = mediaUrl;
      else if (type === 'video' && mediaUrl) data.videoUrl = mediaUrl;

      await addDoc(collection(db, 'cards'), data);
      toast.success('FILE ADDED TO THE WALL 🔥');
      router.push('/');
    } catch (err) {
      console.error("POST FILE ERROR:", err);
      toast.error('Failed to post file.');
    } finally {
      setSaving(false);
    }
  };

  const types: CardType[] = ['quote', 'image', 'video', 'audio', 'convo', 'moment', 'text'];

  return (
    <AuthGuard>
      <div className="min-h-screen bg-off-white dark:bg-brutal-black transition-colors duration-300 flex flex-col pb-24 md:pb-0">
        <Nav />
        <main className="flex-1 max-w-3xl w-full mx-auto p-4 md:p-8 mt-16 md:mt-24">
          <h1 className="font-brutal text-4xl mb-6 dark:text-acid-yellow">➕ ADD FILE</h1>

          <form onSubmit={handleSubmit} className="panel-brutal flex flex-col gap-6">
            
            {/* Type Selection */}
            <div>
              <label className="block font-brutal text-sm mb-2 dark:text-white">FILE TYPE</label>
              <div className="flex flex-wrap gap-2">
                {types.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`btn-brutal-sm ${type === t ? 'bg-black text-acid-yellow dark:bg-white dark:text-black' : 'dark:text-white'}`}
                  >
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Media Upload */}
            {['image', 'audio', 'video'].includes(type) && (
              <div>
                <label className="block font-brutal text-sm mb-2 dark:text-white">MEDIA UPLOAD</label>
                <UploadZone 
                  onUpload={(url) => setMediaUrl(url)} 
                  currentUrl={mediaUrl} 
                  acceptAudio={['audio', 'video'].includes(type)} 
                />
              </div>
            )}

            {/* Content fields */}
            <div>
              <label className="block font-brutal text-sm mb-2 dark:text-white">MAIN CONTENT / QUOTE</label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                className="input-brutal min-h-[100px]"
                placeholder="What did they say or do?"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-brutal text-sm mb-2 dark:text-white">TITLE (Optional)</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="input-brutal"
                  placeholder="e.g. The Incident"
                />
              </div>
              {['image', 'video'].includes(type) && (
                <div>
                  <label className="block font-brutal text-sm mb-2 dark:text-white">CAPTION (Optional)</label>
                  <input
                    type="text"
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                    className="input-brutal"
                    placeholder="Context?"
                  />
                </div>
              )}
            </div>

            {/* Tag Suspects */}
            <div>
              <label className="block font-brutal text-sm mb-2 dark:text-white">TAG SUSPECTS</label>
              <input 
                type="text" 
                placeholder="Search by name or @username..." 
                className="input-brutal w-full mb-3"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {loading ? <p>Loading suspects...</p> : (
                <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-2 border-[3px] border-black bg-white/5">
                  {friends
                    .filter(f => 
                      selectedFriends.includes(f.id) || 
                      f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      f.nickname?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map(f => {
                    const isSelected = selectedFriends.includes(f.id);
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setSelectedFriends(prev => isSelected ? prev.filter(id => id !== f.id) : [...prev, f.id])}
                        className={`px-3 py-1 font-bold text-xs border-[2px] border-black transition-transform hover:-translate-y-1 ${isSelected ? 'shadow-brutal-sm' : ''}`}
                        style={{
                          backgroundColor: isSelected ? f.signatureColor : 'transparent',
                          color: isSelected ? '#000' : 'inherit',
                          borderColor: isSelected ? '#000' : 'gray'
                        }}
                      >
                        {f.nickname || f.name}
                      </button>
                    );
                  })}
                  {friends.length === 0 && <p className="text-sm opacity-50">No suspects found.</p>}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={saving || loading}
              className="btn-brutal bg-acid-yellow w-full text-xl py-4 mt-4"
            >
              {saving ? 'UPLOADING...' : 'POST FILE TO THE WALL'}
            </button>
          </form>
        </main>
      </div>
    </AuthGuard>
  );
}
