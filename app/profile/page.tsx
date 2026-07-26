'use client';

import AuthGuard from '@/components/AuthGuard';
import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import UploadZone from '@/components/UploadZone';
import toast from 'react-hot-toast';
import Nav from '@/components/Nav';

export default function ProfilePage() {
  const { user, profile } = useAuth();
  const [saving, setSaving] = useState(false);

  const [username, setUsername] = useState(profile?.username || '');
  const [callSign, setCallSign] = useState(profile?.callSign || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || '');
  const [signatureColor, setSignatureColor] = useState(profile?.signatureColor || '#F5F500');

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setCallSign(profile.callSign || '');
      setAvatarUrl(profile.avatarUrl || '');
      setSignatureColor(profile.signatureColor || '#F5F500');
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    const formattedUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!formattedUsername) {
      toast.error('Username is required!');
      return;
    }

    setSaving(true);
    try {
      if (formattedUsername !== profile.username) {
        const usernameRef = doc(db, 'usernames', formattedUsername);
        const snap = await getDoc(usernameRef);

        if (snap.exists() && snap.data().uid !== user.uid) {
          toast.error('Username already taken 💀');
          setSaving(false);
          return;
        }

        if (profile.username) {
          await deleteDoc(doc(db, 'usernames', profile.username));
        }

        await setDoc(usernameRef, { uid: user.uid });
      }

      await updateDoc(doc(db, 'users', user.uid), {
        username: formattedUsername,
        callSign: callSign || null,
        avatarUrl,
        signatureColor,
      });

      toast.success('PROFILE UPDATED 🔥');
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const presetColors = [
    '#F5F500', '#FF2D78', '#0066FF', '#39FF14',
    '#FF5F1F', '#9000FF', '#FFFFFF', '#000000',
  ];

  return (
    <AuthGuard>
      <div
        className="min-h-screen bg-off-white flex flex-col"
        style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))' }}
      >
        <Nav />
        <main className="flex-1 max-w-lg w-full mx-auto px-4 py-5 md:py-8">
          <h1 className="font-brutal text-3xl md:text-4xl mb-5">👤 MY PROFILE</h1>

          {profile?.role === 'admin' && (
            <div className="mb-4 p-3 border-[3px] border-black bg-acid-yellow font-brutal text-sm">
              NOTE: You are an Admin.
            </div>
          )}

          <form onSubmit={handleSubmit} className="panel-brutal flex flex-col gap-5">
            {/* Username */}
            <div>
              <label className="block font-brutal text-xs mb-1.5 uppercase tracking-wider">USERNAME *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-brutal text-gray-400">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-brutal pl-9"
                  placeholder="sus_lord_99"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                />
              </div>
              <p className="text-xs font-mono opacity-50 mt-1">Unique. No spaces or special chars.</p>
            </div>

            {/* Call Sign */}
            <div>
              <label className="block font-brutal text-xs mb-1.5 uppercase tracking-wider">CALL SIGN / AKA</label>
              <input
                type="text"
                value={callSign}
                onChange={(e) => setCallSign(e.target.value)}
                className="input-brutal"
                placeholder="e.g. Ghost, Viper, J-Dog"
              />
            </div>

            {/* Avatar */}
            <div>
              <label className="block font-brutal text-xs mb-1.5 uppercase tracking-wider">AVATAR</label>
              <UploadZone onUpload={(url) => setAvatarUrl(url)} currentUrl={avatarUrl} acceptAudio={false} />
            </div>

            {/* Signature Color */}
            <div>
              <label className="block font-brutal text-xs mb-1.5 uppercase tracking-wider">SIGNATURE COLOR</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {presetColors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSignatureColor(c)}
                    className="w-9 h-9 border-[2px] border-black transition-transform hover:-translate-y-1 active:scale-95"
                    style={{
                      backgroundColor: c,
                      boxShadow:
                        signatureColor === c
                          ? '0 0 0 3px black, 0 0 0 5px white'
                          : '2px 2px 0px #000',
                    }}
                    title={c}
                    aria-label={`Color ${c}`}
                  />
                ))}
              </div>
              <input
                type="color"
                value={signatureColor}
                onChange={(e) => setSignatureColor(e.target.value)}
                className="w-full h-12 p-1 border-[3px] border-black cursor-pointer bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn-brutal bg-hot-pink text-white w-full text-base py-4"
            >
              {saving ? 'SAVING...' : 'SAVE PROFILE'}
            </button>
          </form>
        </main>
      </div>
    </AuthGuard>
  );
}
