'use client';

import AuthGuard from '@/components/AuthGuard';
import { useState, useEffect, use } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import UploadZone from '@/components/UploadZone';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditSuspectPage({ params }: Props) {
  const router = useRouter();
  const { id } = use(params);
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [tagline, setTagline] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [signatureColor, setSignatureColor] = useState('#F5F500');

  useEffect(() => {
    async function loadSuspect() {
      try {
        const snap = await getDoc(doc(db, 'friends', id));
        if (!snap.exists()) {
          setNotFound(true);
          return;
        }
        const data = snap.data();
        if (data.createdBy !== user?.uid) {
          toast.error('You are not authorized to edit this suspect.');
          router.push(`/friends/${id}`);
          return;
        }
        setName(data.name || '');
        setNickname(data.nickname || '');
        setTagline(data.tagline || '');
        setAvatarUrl(data.avatarUrl || '');
        setSignatureColor(data.signatureColor || '#F5F500');
      } catch (err) {
        console.error(err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    if (user !== undefined) {
      loadSuspect();
    }
  }, [id, user, router]);

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
        nickname: nickname || null,
        tagline: tagline || '',
        avatarUrl: avatarUrl || null,
        signatureColor,
      };

      await updateDoc(doc(db, 'friends', id), data);
      toast.success('SUSPECT UPDATED 🕵️');
      router.push(`/friends/${id}`);
    } catch (err) {
      toast.error('Failed to update suspect.');
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

  if (notFound) {
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
    <AuthGuard>
      <div className="min-h-screen bg-off-white dark:bg-brutal-black transition-colors duration-300 flex flex-col pb-24 md:pb-0">
        <Nav />
        <main className="flex-1 max-w-xl w-full mx-auto p-4 md:p-8 mt-16 md:mt-24">
          <h1 className="font-brutal text-4xl mb-6 dark:text-lime-green">✏️ EDIT SUSPECT</h1>

          <form onSubmit={handleSubmit} className="panel-brutal flex flex-col gap-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-brutal text-sm mb-2 dark:text-white">FULL NAME *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="input-brutal"
                  placeholder="e.g. John Doe"
                  required
                />
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

            <div className="flex gap-4 mt-4">
              <button
                type="button"
                onClick={() => router.push(`/friends/${id}`)}
                className="btn-brutal bg-white w-1/3 text-xl py-4"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-brutal bg-lime-green flex-1 text-xl py-4"
              >
                {saving ? 'SAVING...' : 'SAVE CHANGES'}
              </button>
            </div>
          </form>
        </main>
      </div>
    </AuthGuard>
  );
}
