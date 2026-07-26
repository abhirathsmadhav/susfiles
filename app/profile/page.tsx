'use client';

import AuthGuard from '@/components/AuthGuard';
import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs, onSnapshot, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card } from '@/types';
import { useAuth } from '@/lib/auth-context';
import UploadZone from '@/components/UploadZone';
import toast from 'react-hot-toast';
import Nav from '@/components/Nav';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, profile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [posts, setPosts] = useState<Card[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  
  // UI State
  const [isEditing, setIsEditing] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);

  // Form State
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
      if (!profile.username) {
        setIsEditing(true);
      }
    }
  }, [profile]);

  // Load Posts
  useEffect(() => {
    if (!user || !profile?.username) {
      setLoadingPosts(false);
      return;
    }
    
    async function fetchPosts() {
      try {
        const q = query(collection(db, 'cards'), where('createdBy', '==', user!.uid));
        const snap = await getDocs(q);
        const fetched = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Card));
        fetched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setPosts(fetched);
      } catch (err) {
        console.error('Failed to load posts', err);
      } finally {
        setLoadingPosts(false);
      }
    }
    fetchPosts();
  }, [user, profile?.username]);

  // Load Friend Requests
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'friendRequests'), where('to', '==', user.uid), where('status', '==', 'pending'));
    const unsub = onSnapshot(q, async (snap) => {
      const reqs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const populated = await Promise.all(reqs.map(async (req: any) => {
        const uSnap = await getDoc(doc(db, 'users', req.from));
        return { ...req, user: uSnap.data() };
      }));
      setRequests(populated);
    });
    return unsub;
  }, [user]);

  const handleAcceptRequest = async (req: any) => {
    try {
      await updateDoc(doc(db, 'users', user!.uid), {
        friendIds: arrayUnion(req.from)
      });
      await updateDoc(doc(db, 'users', req.from), {
        friendIds: arrayUnion(user!.uid)
      });
      await deleteDoc(doc(db, 'friendRequests', req.id));
      toast.success('Friend added to Crew! 🤝');
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      console.error(err);
      toast.error('Failed to accept request');
    }
  };

  const handleDeclineRequest = async (reqId: string) => {
    try {
      await deleteDoc(doc(db, 'friendRequests', reqId));
      toast.success('Request declined 🚫');
    } catch (err) {
      toast.error('Failed to decline request');
    }
  };

  const handleDeletePost = async (cardId: string) => {
    if (!window.confirm("Are you sure you want to delete this file? This cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, 'cards', cardId));
      setPosts((prev) => prev.filter((c) => c.id !== cardId));
      toast.success("File deleted successfully.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete file.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    if (user.isAnonymous) {
      toast.error('Guests cannot create profiles! 🛑');
      return;
    }

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

  if (!profile) return null;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-off-white flex flex-col" style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))' }}>
        <Nav />
        
        {/* Profile Header View Mode */}
        {!isEditing && profile.username && (
          <div className="border-b-[3px] border-black" style={{ background: profile.signatureColor || '#F5F500' }}>
            <div className="max-w-7xl mx-auto px-4 py-6 md:py-10">
              <div className="flex gap-2 mb-4 flex-wrap">
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1 font-brutal text-xs border-[2px] border-black px-3 py-2 bg-white hover:bg-black hover:text-white transition-colors"
                  style={{ boxShadow: '2px 2px 0px #000' }}
                >
                  ✏️ EDIT PROFILE
                </button>
              </div>

              <div className="flex items-center gap-4">
                <div
                  className="w-20 h-20 md:w-32 md:h-32 border-[3px] md:border-[4px] border-black overflow-hidden flex-shrink-0"
                  style={{ boxShadow: '4px 4px 0px #000' }}
                >
                  {profile.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-brutal text-4xl md:text-6xl bg-white">
                      {profile.displayName.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h1 className="font-brutal text-3xl md:text-5xl leading-none truncate bg-white inline-block px-2 border-2 border-black" style={{ boxShadow: '2px 2px 0px #000' }}>
                    {profile.displayName}
                  </h1>
                  <p className="font-mono font-bold text-sm mt-1 uppercase bg-black text-white inline-block px-2 ml-2">
                    @{profile.username}
                  </p>
                  {profile.callSign && (
                    <div className="mt-2 inline-block">
                      <p className="text-sm italic font-mono font-bold border-2 border-black pl-2 pr-3 py-0.5 bg-[#FAFAF5] text-black">
                        aka &quot;{profile.callSign}&quot;
                      </p>
                    </div>
                  )}
                  <div className="mt-3">
                    <span className="tag-brutal bg-white text-black border-2 border-black">
                      👥 {profile.friendIds?.length || 0} FRIENDS
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-5 md:py-8 flex flex-col lg:flex-row gap-8">
          
          {/* Left Column (Forms & Inbox) */}
          <div className="flex-1 max-w-lg">
            {isEditing && (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h1 className="font-brutal text-3xl">👤 EDIT PROFILE</h1>
                  {profile.username && (
                    <button onClick={() => setIsEditing(false)} className="text-sm font-bold underline hover:text-hot-pink">
                      CANCEL
                    </button>
                  )}
                </div>
                {profile?.role === 'admin' && (
                  <div className="mb-4 p-3 border-[3px] border-black bg-acid-yellow font-brutal text-sm">
                    NOTE: You are an Admin.
                  </div>
                )}

                <form onSubmit={handleSubmit} className="panel-brutal flex flex-col gap-5 mb-8">
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
                            boxShadow: signatureColor === c ? '0 0 0 3px black, 0 0 0 5px white' : '2px 2px 0px #000',
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

                  <button type="submit" disabled={saving} className="btn-brutal bg-hot-pink text-white w-full text-base py-4">
                    {saving ? 'SAVING...' : 'SAVE PROFILE'}
                  </button>
                </form>
              </>
            )}

            {!isEditing && profile.username && (
              <div className="mb-8">
                <h2 className="font-brutal text-2xl mb-4 border-b-[3px] border-black pb-2 flex items-center justify-between">
                  INBOX 
                  {requests.length > 0 && (
                    <span className="bg-hot-pink text-white text-xs px-2 py-1">{requests.length} NEW</span>
                  )}
                </h2>
                
                {requests.length === 0 ? (
                  <div className="panel-brutal text-center p-6 bg-[#FAFAF5]">
                    <p className="font-brutal text-sm opacity-60">NO PENDING REQUESTS</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {requests.map(req => (
                      <div key={req.id} className="panel-brutal bg-white p-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 border-2 border-black overflow-hidden flex-shrink-0">
                            {req.user?.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={req.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gray-200" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-sm leading-tight">{req.user?.displayName || 'Unknown User'}</p>
                            <p className="font-mono text-[10px] opacity-60">@{req.user?.username}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleAcceptRequest(req)} className="btn-brutal-sm bg-lime-green text-black">✓</button>
                          <button onClick={() => handleDeclineRequest(req.id)} className="btn-brutal-sm bg-[#FF2D78] text-white">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column (My Posts) */}
          <div className="flex-1 w-full max-w-2xl">
            <h2 className="font-brutal text-2xl mb-4 border-b-[3px] border-black pb-2">MY POSTS</h2>
            
            {!profile.username ? (
              <div className="panel-brutal bg-acid-yellow text-center p-6">
                <p className="font-bold text-sm">⚠️ PROFILE INCOMPLETE</p>
                <p className="font-mono text-xs mt-2 opacity-80">
                  Please complete and save your profile to view and manage your posts.
                </p>
              </div>
            ) : loadingPosts ? (
              <p className="font-mono text-sm opacity-60">Loading posts...</p>
            ) : posts.length === 0 ? (
              <div className="panel-brutal text-center p-6 bg-white">
                <p className="font-brutal">NO POSTS YET</p>
                <p className="font-mono text-xs mt-2 opacity-60">You haven&apos;t uploaded any evidence.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {posts.map((post) => (
                  <div key={post.id} className="panel-brutal bg-white p-3 flex flex-col gap-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="tag-brutal bg-black text-white text-[10px]">
                        {post.type.toUpperCase()}
                      </span>
                      <span className="font-mono text-[10px] opacity-60">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="font-bold text-sm line-clamp-2 min-h-[40px]">
                      {post.title || post.content || 'Untitled File'}
                    </p>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="btn-brutal-sm bg-[#FF2D78] text-white mt-2 self-start"
                    >
                      DELETE
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </main>
      </div>
    </AuthGuard>
  );
}
