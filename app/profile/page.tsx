'use client';

import AuthGuard from '@/components/AuthGuard';
import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs, onSnapshot, arrayUnion, addDoc, getCountFromServer } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { deleteUser, EmailAuthProvider, reauthenticateWithCredential, GoogleAuthProvider, reauthenticateWithPopup } from 'firebase/auth';
import { useRouter } from 'next/navigation';
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
  const [spaceInvitations, setSpaceInvitations] = useState<any[]>([]);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  // Account Deletion State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const router = useRouter();

  // Rap Sheet Stats
  const [stats, setStats] = useState({ uploads: 0, tagged: 0 });

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
    const unsub = onSnapshot(q, (snap) => {
      const reqs = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          user: {
            displayName: data.fromName || 'Unknown User',
            username: data.fromUsername || '',
            avatarUrl: data.fromAvatar || '',
            signatureColor: '#000000' // fallback if not included
          }
        };
      });
      setRequests(reqs);
    });

    // Listen to space invitations
    const invQ = query(collection(db, 'spaceInvitations'), where('toUid', '==', user.uid), where('status', '==', 'pending'));
    const unsubInv = onSnapshot(invQ, (snap) => {
      setSpaceInvitations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Fetch Rap Sheet Stats
    const fetchStats = async () => {
      try {
        const uploadsQuery = query(collection(db, 'cards'), where('createdBy', '==', user.uid));
        const tagsQuery = query(collection(db, 'cards'), where('linkedFriendIds', 'array-contains', user.uid));
        
        const [uploadsSnap, tagsSnap] = await Promise.all([
          getCountFromServer(uploadsQuery),
          getCountFromServer(tagsQuery)
        ]);
        
        setStats({
          uploads: uploadsSnap.data().count,
          tagged: tagsSnap.data().count
        });
      } catch (e) {
        console.error('Failed to fetch stats', e);
      }
    };
    fetchStats();

    return () => {
      unsub();
      unsubInv();
    };
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

      await addDoc(collection(db, 'notifications'), {
        toUid: req.from,
        fromUid: user!.uid,
        type: 'invite_accepted',
        message: `${profile?.displayName || 'Someone'} accepted your crew invite! 🤝`,
        read: false,
        createdAt: new Date().toISOString()
      });

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

  const handleAcceptSpaceInvitation = async (invitation: any) => {
    try {
      await updateDoc(doc(db, 'spaces', invitation.spaceId), {
        memberIds: arrayUnion(user!.uid)
      });
      await updateDoc(doc(db, 'spaceInvitations', invitation.id), {
        status: 'accepted'
      });
      toast.success(`Joined space: ${invitation.spaceName} 🔒`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to accept space invitation');
    }
  };

  const handleDeclineSpaceInvitation = async (invitationId: string) => {
    try {
      await updateDoc(doc(db, 'spaceInvitations', invitationId), {
        status: 'declined'
      });
      toast.success('Space invitation declined 🚫');
    } catch (err) {
      console.error(err);
      toast.error('Failed to decline invitation');
    }
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;
    try {
      await deleteDoc(doc(db, 'cards', postToDelete));
      setPosts((prev) => prev.filter((c) => c.id !== postToDelete));
      toast.success("File deleted successfully.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete file.");
    } finally {
      setPostToDelete(null);
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

  const handleDeleteAccount = async () => {
    if (!user || !profile) return;
    setIsDeletingAccount(true);
    try {
      // 1. Re-authenticate
      const providerId = user.providerData[0]?.providerId;
      if (providerId === 'password') {
        if (!deletePassword) {
          toast.error('Password required to delete account');
          setIsDeletingAccount(false);
          return;
        }
        const credential = EmailAuthProvider.credential(user.email!, deletePassword);
        await reauthenticateWithCredential(user, credential);
      } else if (providerId === 'google.com') {
        const provider = new GoogleAuthProvider();
        await reauthenticateWithPopup(user, provider);
      }

      // 2. Clean up Firestore
      if (profile.username) {
        await deleteDoc(doc(db, 'usernames', profile.username));
      }
      await deleteDoc(doc(db, 'users', user.uid));

      // 3. Delete Auth User
      await deleteUser(user);
      
      // 4. Redirect
      document.cookie = 'sus-session=; Max-Age=0; path=/';
      toast.success('Account permanently deleted. 💀');
      router.push('/');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        toast.error('Incorrect password');
      } else {
        toast.error('Failed to delete account');
      }
    } finally {
      setIsDeletingAccount(false);
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
                  <h2 className="font-brutal text-3xl md:text-4xl leading-none">
                    {profile.displayName.toUpperCase()}
                  </h2>
                  {profile.callSign && (
                    <p className="font-mono text-xs md:text-sm mt-1 opacity-80 uppercase tracking-wider">
                      AKA {profile.callSign}
                    </p>
                  )}
                  {profile.username && (
                    <p className="font-mono text-xs md:text-sm mt-0.5 opacity-80 uppercase tracking-wider">
                      @{profile.username}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Rap Sheet Stats */}
            <div className="flex bg-black text-acid-yellow border-t-4 border-black divide-x-4 divide-black">
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
                  
                  <div className="mt-8 pt-6 border-t-[3px] border-black">
                    <h3 className="font-brutal text-lg text-[#FF2D78] mb-2">DANGER ZONE</h3>
                    <p className="font-mono text-xs opacity-60 mb-4">Permanently delete your account and profile data. This cannot be undone.</p>
                    <button 
                      type="button" 
                      onClick={() => setShowDeleteModal(true)}
                      className="btn-brutal bg-black text-[#FF2D78] w-full text-sm py-3 border-[#FF2D78] hover:bg-[#FF2D78] hover:text-white"
                    >
                      DELETE ACCOUNT
                    </button>
                  </div>
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
                  <div className="flex flex-col gap-3 mb-4">
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
                
                {/* Space Invitations */}
                {spaceInvitations.length > 0 && (
                  <>
                    <h3 className="font-brutal text-lg mt-6 mb-3 border-b-[2px] border-black pb-1">SPACE INVITES</h3>
                    <div className="flex flex-col gap-3">
                      {spaceInvitations.map(inv => (
                        <div key={inv.id} className="panel-brutal bg-[#FAFAF5] p-3 flex flex-col gap-3">
                          <div>
                            <p className="font-bold text-sm leading-tight">🔒 {inv.spaceName}</p>
                            <p className="font-mono text-[10px] opacity-60">Private Space Invitation</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleAcceptSpaceInvitation(inv)} className="btn-brutal-sm flex-1 bg-lime-green text-black">JOIN</button>
                            <button onClick={() => handleDeclineSpaceInvitation(inv.id)} className="btn-brutal-sm flex-1 bg-white hover:bg-[#FF2D78] hover:text-white border-black">DECLINE</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
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
                      onClick={() => setPostToDelete(post.id)}
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

        {/* Custom Delete Confirmation Modal */}
        {postToDelete && (
          <div className="modal-overlay z-[210]">
            <div className="panel-brutal bg-white w-full max-w-sm animate-slide-up text-center">
              <h2 className="font-brutal text-2xl mb-4 text-[#FF2D78]">DELETE POST?</h2>
              <p className="font-mono text-sm opacity-80 mb-6">
                Are you sure you want to permanently delete this file? This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => setPostToDelete(null)}
                  className="btn-brutal flex-1 bg-white hover:bg-black hover:text-white"
                >
                  CANCEL
                </button>
                <button 
                  onClick={handleDeletePost}
                  className="btn-brutal flex-1 bg-[#FF2D78] text-white hover:bg-black hover:text-[#FF2D78]"
                >
                  YES, DELETE
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Account Deletion Modal */}
        {showDeleteModal && (
          <div className="modal-overlay z-[210]">
            <div className="panel-brutal bg-white w-full max-w-sm animate-slide-up">
              <h2 className="font-brutal text-2xl mb-2 text-[#FF2D78]">DELETE ACCOUNT?</h2>
              <p className="font-mono text-xs opacity-80 mb-5">
                This will permanently delete your profile and username. Your posts will remain as &quot;Deleted User&quot;.<br/><br/>
                For security, please confirm your identity.
              </p>
              
              {user?.providerData[0]?.providerId === 'password' && (
                <div className="mb-5">
                  <label className="block font-brutal text-xs mb-1.5 uppercase tracking-wider">ENTER PASSWORD</label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="input-brutal w-full"
                    placeholder="••••••••"
                  />
                </div>
              )}
              
              <div className="flex gap-2 mt-2">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="btn-brutal flex-1 bg-white hover:bg-black hover:text-white"
                  disabled={isDeletingAccount}
                >
                  CANCEL
                </button>
                <button 
                  onClick={handleDeleteAccount}
                  className="btn-brutal flex-1 bg-[#FF2D78] text-white hover:bg-black hover:text-[#FF2D78]"
                  disabled={isDeletingAccount}
                >
                  {isDeletingAccount ? 'DELETING...' : (user?.providerData[0]?.providerId === 'google.com' ? 'VERIFY & DELETE' : 'DELETE FOREVER')}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AuthGuard>
  );
}
