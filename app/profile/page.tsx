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
    
    // Format username: lowercase, no spaces, only alphanumeric and underscores
    const formattedUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!formattedUsername) {
      toast.error('Username is required!');
      return;
    }

    setSaving(true);
    try {
      // If username changed, check availability and update usernames collection
      if (formattedUsername !== profile.username) {
        const usernameRef = doc(db, 'usernames', formattedUsername);
        const snap = await getDoc(usernameRef);
        
        if (snap.exists() && snap.data().uid !== user.uid) {
          toast.error('Username already taken 💀');
          setSaving(false);
          return;
        }

        // Release old username if it exists
        if (profile.username) {
          await deleteDoc(doc(db, 'usernames', profile.username));
        }

        // Claim new username
        await setDoc(usernameRef, { uid: user.uid });
      }

      // Update user profile
      await updateDoc(doc(db, 'users', user.uid), {
        username: formattedUsername,
        callSign: callSign || null,
        avatarUrl,
        signatureColor,
      });

      // Force a reload so the auth context picks up the new profile
      // Or we can just wait for the auth context snapshot, but our auth context uses getDoc once on mount.
      // Wait, our auth context in lib/auth-context.tsx uses onAuthStateChanged and getDoc once. We might need to refresh to see the change.
      toast.success('PROFILE UPDATED 🔥');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
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
      <div className="min-h-screen bg-off-white dark:bg-brutal-black transition-colors duration-300 flex flex-col pb-24 md:pb-0">
        <Nav />
        <main className="flex-1 max-w-xl w-full mx-auto p-4 md:p-8 mt-16 md:mt-24">
          <h1 className="font-brutal text-4xl mb-6 dark:text-hot-pink">👤 MY PROFILE</h1>

          {profile?.role === 'admin' && (
             <div className="mb-6 p-4 border-[3px] border-black bg-acid-yellow font-brutal text-sm">
                NOTE: You are an Admin.
             </div>
          )}

          <form onSubmit={handleSubmit} className="panel-brutal flex flex-col gap-6">
            
            <div>
              <label className="block font-brutal text-sm mb-2 dark:text-white">USERNAME *</label>
              <div className="flex relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-brutal text-gray-500">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="input-brutal pl-10"
                  placeholder="sus_lord_99"
                  required
                />
              </div>
              <p className="text-xs font-mono opacity-60 mt-1 dark:text-white">Must be unique. No spaces or special chars.</p>
            </div>

            <div>
              <label className="block font-brutal text-sm mb-2 dark:text-white">CALL SIGN / AKA (Optional)</label>
              <input
                type="text"
                value={callSign}
                onChange={e => setCallSign(e.target.value)}
                className="input-brutal w-full"
                placeholder="e.g. Ghost, Viper, J-Dog"
              />
            </div>

            {/* Avatar Upload */}
            <div>
              <label className="block font-brutal text-sm mb-2 dark:text-white">AVATAR</label>
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
              className="btn-brutal bg-hot-pink text-white w-full text-xl py-4 mt-4"
            >
              {saving ? 'SAVING...' : 'SAVE PROFILE'}
            </button>
          </form>
        </main>
      </div>
    </AuthGuard>
  );
}
