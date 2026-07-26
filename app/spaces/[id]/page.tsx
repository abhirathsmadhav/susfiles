'use client';

import { useEffect, useState, use } from 'react';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion, arrayRemove, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, Friend, Space } from '@/types';
import Nav from '@/components/Nav';
import WallCanvas from '@/components/WallCanvas';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Settings, X, PlusCircle, Trash2, Lock } from 'lucide-react';

export default function PrivateSpacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: spaceId } = use(params);
  const { user, isGuest, loading: authLoading } = useAuth();
  const router = useRouter();

  const [space, setSpace] = useState<Space | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]); // To map cards
  const [allUsers, setAllUsers] = useState<Friend[]>([]); // To allow admin to add members
  const [dataLoading, setDataLoading] = useState(true);
  
  // Settings modal
  const [showSettings, setShowSettings] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [friendToAdd, setFriendToAdd] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user || isGuest) {
      router.push('/');
      return;
    }

    async function loadData() {
      setDataLoading(true);
      try {
        // Load Space
        const spaceRef = doc(db, 'spaces', spaceId);
        const spaceSnap = await getDoc(spaceRef);
        if (!spaceSnap.exists()) {
          toast.error('Space not found');
          router.push('/spaces');
          return;
        }
        
        const spaceData = { id: spaceSnap.id, ...spaceSnap.data() } as Space;
        
        // Security Check
        if (!spaceData.memberIds.includes(user!.uid)) {
          toast.error('You do not have clearance for this space.');
          router.push('/spaces');
          return;
        }
        
        setSpace(spaceData);

        // Load Cards for this Space
        const cardsQ = query(collection(db, 'cards'), where('spaceId', '==', spaceId));
        
        // Load Friends and Users
        const [cardsSnap, friendsSnap, usersSnap] = await Promise.all([
          getDocs(cardsQ),
          getDocs(query(collection(db, 'friends'))),
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
              tagline: data.tagline || '',
              createdAt: data.createdAt,
            };
          });

        const mappedFriends: Friend[] = friendsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Friend));
        const allProfiles = [...mappedUsers, ...mappedFriends];
        
        setFriends(allProfiles);
        setAllUsers(allProfiles);
        
        // Sort cards locally by date
        const spaceCards = cardsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Card));
        spaceCards.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setCards(spaceCards);

      } catch (err) {
        console.error(err);
        toast.error('Failed to load space data');
      } finally {
        setDataLoading(false);
      }
    }
    
    loadData();
  }, [user, isGuest, authLoading, spaceId, router]);

  const handleAddMember = async () => {
    if (!friendToAdd || !space || space.adminId !== user?.uid) return;
    
    try {
      // Check if invitation already exists
      const q = query(
        collection(db, 'spaceInvitations'), 
        where('spaceId', '==', space.id), 
        where('toUid', '==', friendToAdd), 
        where('status', '==', 'pending')
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        toast.error('Invitation already sent to this suspect.');
        return;
      }

      await addDoc(collection(db, 'spaceInvitations'), {
        spaceId: space.id,
        spaceName: space.name,
        fromUid: user?.uid,
        toUid: friendToAdd,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      setFriendToAdd('');
      toast.success('Invitation sent!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to send invitation');
    }
  };

  const handleRemoveMember = async (friendId: string) => {
    if (!space) return;
    try {
      await updateDoc(doc(db, 'spaces', spaceId), {
        memberIds: arrayRemove(friendId)
      });
      setSpace({ ...space, memberIds: space.memberIds.filter(id => id !== friendId) });
      toast.success('Member removed');
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove member');
    }
  };

  const handleDeleteSpace = async () => {
    if (!space || space.adminId !== user?.uid) return;
    

    try {
      await deleteDoc(doc(db, 'spaces', spaceId));
      
      // Also query and delete all cards in this space
      const cardsQuery = query(collection(db, 'cards'), where('spaceId', '==', spaceId));
      const cardsSnap = await getDocs(cardsQuery);
      
      const deletePromises = cardsSnap.docs.map(d => deleteDoc(doc(db, 'cards', d.id)));
      await Promise.all(deletePromises);

      toast.success('Space deleted successfully');
      router.push('/spaces');
    } catch (err) {
      console.error('Failed to delete space:', err);
      toast.error('Failed to delete space');
    }
  };

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-off-white flex flex-col">
        <Nav />
        <div className="flex-1 flex items-center justify-center">
          <p className="font-brutal text-xl animate-pulse">DECRYPTING SPACE...</p>
        </div>
      </div>
    );
  }

  if (!space) {
    return (
      <div className="min-h-screen bg-off-white flex flex-col">
        <Nav />
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="font-brutal text-3xl mb-4">404 - SPACE NOT FOUND</p>
          <button onClick={() => router.push('/spaces')} className="btn-brutal bg-acid-yellow">BACK TO SPACES</button>
        </div>
      </div>
    );
  }

  // Determine grid background class based on gridStyle
  let gridClass = '';
  if (space.gridStyle === 'grid') gridClass = 'bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[size:40px_40px]';
  if (space.gridStyle === 'dots') gridClass = 'bg-[radial-gradient(rgba(0,0,0,0.1)_2px,transparent_2px)] bg-[size:30px_30px]';

  // Available users to add (not already in space)
  const availableToAdd = allUsers.filter(u => !space.memberIds.includes(u.id));

  return (
    <div className={`min-h-screen snap-start flex flex-col`} style={{ backgroundColor: space.backgroundColor || '#F0EDE0' }}>
      <Nav />

      {/* Compact header */}
      <div className="border-b-[3px] border-black bg-white/80 backdrop-blur-sm sticky top-[68px] z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-hot-pink" strokeWidth={3} />
                <h1 className="font-brutal text-2xl md:text-3xl leading-none tracking-tight">
                  {space.name}
                </h1>
              </div>
              {space.description && (
                <p className="mt-1 text-xs font-bold opacity-60 font-mono">
                  {space.description}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {space.adminId === user?.uid && (
                <button 
                  onClick={() => setShowSettings(true)}
                  className="btn-brutal-sm bg-acid-yellow border-black hover:bg-black hover:text-acid-yellow hidden md:flex items-center gap-1"
                >
                  <Settings className="w-3.5 h-3.5" /> SETTINGS
                </button>
              )}
              {/* Mobile settings button */}
              {space.adminId === user?.uid && (
                <button 
                  onClick={() => setShowSettings(true)}
                  className="w-10 h-10 border-[2px] border-black bg-acid-yellow flex items-center justify-center md:hidden"
                  style={{ boxShadow: '2px 2px 0px #000' }}
                >
                  <Settings className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          {/* Portal target for WallCanvas toolbar */}
          <div id="wall-toolbar-portal" className="mt-4 empty:mt-0" />
        </div>
      </div>

      {/* Wall Space Container */}
      <main className={`w-full flex-1 flex flex-col ${gridClass}`}>
        {dataLoading ? (
          <div className="max-w-7xl w-full mx-auto px-4 py-16 panel-brutal bg-white/80 text-center mt-8 backdrop-blur-sm">
            <p className="font-brutal text-xl animate-pulse">LOADING SECURE FILES...</p>
          </div>
        ) : cards.length === 0 ? (
          <div className="max-w-7xl w-full mx-auto px-4 py-16 panel-brutal bg-white/80 text-center mt-8 backdrop-blur-sm">
            <p className="font-brutal text-2xl mb-2">📁 NO SECURE FILES</p>
            <p className="font-mono text-sm opacity-60">This private space is empty. Start posting!</p>
          </div>
        ) : (
          <WallCanvas cards={cards} friends={friends} />
        )}
      </main>

      {/* Settings Modal (Admin Only) */}
      {showSettings && space.adminId === user?.uid && (
        <div className="modal-overlay z-[200]">
          <div className="panel-brutal bg-white w-full max-w-md animate-slide-up relative flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b-[3px] border-black pb-4 mb-4">
              <h2 className="font-brutal text-2xl">SPACE SETTINGS</h2>
              <button onClick={() => setShowSettings(false)} className="hover:opacity-50 transition-opacity">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 pb-4">
              <div className="mb-6">
                <h3 className="font-brutal text-sm mb-2 opacity-60">ADD MEMBERS</h3>
                <div className="flex gap-2">
                  <select 
                    value={friendToAdd}
                    onChange={(e) => setFriendToAdd(e.target.value)}
                    className="input-brutal flex-1"
                  >
                    <option value="">Select a suspect...</option>
                    {availableToAdd.map(f => (
                      <option key={f.id} value={f.id}>{f.nickname || f.name}</option>
                    ))}
                  </select>
                  <button 
                    onClick={handleAddMember}
                    disabled={!friendToAdd}
                    className="btn-brutal bg-lime-green disabled:opacity-50"
                  >
                    <PlusCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="font-brutal text-sm mb-2 opacity-60">CURRENT MEMBERS ({space.memberIds.length})</h3>
                <div className="space-y-2">
                  {space.memberIds.map(id => {
                    const profile = allUsers.find(u => u.id === id);
                    const isAdmin = id === space.adminId;
                    return (
                      <div key={id} className="flex items-center justify-between p-2 border-[2px] border-black bg-off-white">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full border border-black bg-gray-200 overflow-hidden">
                            {profile?.avatarUrl && <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />}
                          </div>
                          <span className="font-brutal text-sm">{profile?.nickname || profile?.name || 'Unknown User'}</span>
                          {isAdmin && <span className="text-[9px] font-mono bg-acid-yellow px-1 border border-black">ADMIN</span>}
                        </div>
                        {!isAdmin && (
                          <button onClick={() => handleRemoveMember(id)} className="text-red-600 hover:text-black">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Danger Zone */}
              <div className="mt-8 pt-6 border-t-[3px] border-black border-dashed">
                <h3 className="font-brutal text-sm mb-3 text-red-600">DANGER ZONE</h3>
                <button 
                  onClick={() => setShowConfirmDelete(true)}
                  className="w-full btn-brutal bg-red-600 text-white hover:bg-black hover:text-red-600 border-black"
                >
                  DELETE SPACE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="modal-overlay z-[210]">
          <div className="panel-brutal bg-white w-full max-w-sm animate-slide-up text-center">
            <h2 className="font-brutal text-2xl mb-4 text-red-600">DELETE SPACE?</h2>
            <p className="font-mono text-sm opacity-80 mb-6">
              Are you sure you want to permanently delete this space and all its contents? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowConfirmDelete(false)}
                className="btn-brutal flex-1 bg-white hover:bg-black hover:text-white"
              >
                CANCEL
              </button>
              <button 
                onClick={() => {
                  setShowConfirmDelete(false);
                  handleDeleteSpace();
                }}
                className="btn-brutal flex-1 bg-red-600 text-white hover:bg-black hover:text-red-600"
              >
                YES, DELETE IT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
