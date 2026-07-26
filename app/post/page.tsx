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

const TYPE_ICONS: Record<CardType, string> = {
  image: '🖼️',
  quote: '💬',
  video: '🎥',
  audio: '🎵',
  convo: '🗣️',
  moment: '⚡',
  text: '📝',
};

export default function PostPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
          rotation: Math.floor(Math.random() * 30) - 15,
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
      console.error('POST FILE ERROR:', err);
      toast.error('Failed to post file.');
    } finally {
      setSaving(false);
    }
  };

  const types: CardType[] = ['image', 'quote', 'video', 'audio', 'convo', 'moment', 'text'];

  return (
    <AuthGuard>
      <div
        className="min-h-screen bg-off-white flex flex-col"
        style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))' }}
      >
        <Nav />
        <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-5 md:py-8">
          <h1 className="font-brutal text-3xl md:text-4xl mb-5">➕ ADD FILE</h1>

          <form onSubmit={handleSubmit} className="panel-brutal flex flex-col gap-5">

            {/* Type Selection — horizontal scroll */}
            <div>
              <label className="block font-brutal text-xs mb-2 uppercase tracking-wider">FILE TYPE</label>
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
                {types.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setType(t); setMediaUrl(''); }}
                    className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 border-[2px] border-black font-brutal text-xs uppercase transition-all ${
                      type === t ? 'bg-black text-acid-yellow' : 'bg-white hover:bg-black/5'
                    }`}
                    style={{ boxShadow: type === t ? '3px 3px 0px #F5F500' : '2px 2px 0px #000', minWidth: 56 }}
                  >
                    <span className="text-base">{TYPE_ICONS[t]}</span>
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Media Upload */}
            {['image', 'audio', 'video'].includes(type) && (
              <div>
                <label className="block font-brutal text-xs mb-2 uppercase tracking-wider">MEDIA</label>
                <UploadZone
                  onUpload={(url) => setMediaUrl(url)}
                  currentUrl={mediaUrl}
                  acceptAudio={['audio', 'video'].includes(type)}
                />
              </div>
            )}

            {/* Content */}
            <div>
              <label className="block font-brutal text-xs mb-2 uppercase tracking-wider">
                {type === 'quote' ? 'THE QUOTE' : 'CONTENT / DESCRIPTION'}
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="input-brutal min-h-[90px] resize-none"
                placeholder={type === 'quote' ? '"What did they actually say?"' : 'What happened?'}
              />
            </div>

            {/* Title + Caption */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-brutal text-xs mb-2 uppercase tracking-wider">TITLE (Optional)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-brutal"
                  placeholder="e.g. The Incident"
                />
              </div>
              {['image', 'video'].includes(type) && (
                <div>
                  <label className="block font-brutal text-xs mb-2 uppercase tracking-wider">CAPTION (Optional)</label>
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="input-brutal"
                    placeholder="Context?"
                  />
                </div>
              )}
            </div>

            {/* Tag Suspects */}
            <div>
              <label className="block font-brutal text-xs mb-2 uppercase tracking-wider">TAG SUSPECTS *</label>
              <input
                type="text"
                placeholder="🔍 Search suspects..."
                className="input-brutal mb-2"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {loading ? (
                <p className="font-mono text-sm opacity-60">Loading suspects...</p>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto p-2 border-[3px] border-black bg-[#FAFAF5]">
                  {friends
                    .filter(
                      (f) =>
                        selectedFriends.includes(f.id) ||
                        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        f.nickname?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((f) => {
                      const isSelected = selectedFriends.includes(f.id);
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() =>
                            setSelectedFriends((prev) =>
                              isSelected ? prev.filter((id) => id !== f.id) : [...prev, f.id]
                            )
                          }
                          className="flex items-center gap-1.5 px-3 py-2 font-bold text-xs border-[2px] border-black transition-all active:scale-95"
                          style={{
                            backgroundColor: isSelected ? f.signatureColor : 'white',
                            boxShadow: isSelected ? '2px 2px 0px #000' : 'none',
                          }}
                        >
                          {f.avatarUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={f.avatarUrl} alt="" className="w-4 h-4 rounded-full border border-black object-cover" />
                          )}
                          {f.nickname || f.name}
                          {isSelected && <span className="ml-0.5">✓</span>}
                        </button>
                      );
                    })}
                  {friends.length === 0 && (
                    <p className="text-sm opacity-50 font-mono">No suspects found.</p>
                  )}
                </div>
              )}
              {selectedFriends.length > 0 && (
                <p className="font-mono text-xs mt-1.5 opacity-60">
                  {selectedFriends.length} selected
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={saving || loading}
              className="btn-brutal bg-acid-yellow w-full text-base py-4 mt-1"
            >
              {saving ? '⬆️ UPLOADING...' : '📌 POST TO THE WALL'}
            </button>
          </form>
        </main>
      </div>
    </AuthGuard>
  );
}
