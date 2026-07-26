'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav';
import { Space, SpaceInput } from '@/types';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';
import { PlusCircle, Lock, Users, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function SpacesPage() {
  const { user, isGuest, loading } = useAuth();
  const router = useRouter();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [bgColor, setBgColor] = useState('#F0EDE0');
  const [gridStyle, setGridStyle] = useState<'none' | 'dots' | 'grid'>('grid');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user || isGuest) {
      router.push('/');
      return;
    }

    async function loadSpaces() {
      setIsLoading(true);
      try {
        const q = query(
          collection(db, 'spaces'),
          where('memberIds', 'array-contains', user?.uid)
        );
        const snap = await getDocs(q);
        setSpaces(snap.docs.map(d => ({ id: d.id, ...d.data() } as Space)));
      } catch (err) {
        console.error(err);
        toast.error('Failed to load spaces');
      } finally {
        setIsLoading(false);
      }
    }

    loadSpaces();
  }, [user, isGuest, loading, router]);

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim()) return toast.error('Name is required');

    setIsSubmitting(true);
    try {
      const spaceData: SpaceInput = {
        name,
        description,
        adminId: user.uid,
        memberIds: [user.uid],
        backgroundColor: bgColor,
        gridStyle
      };

      const docRef = await addDoc(collection(db, 'spaces'), {
        ...spaceData,
        createdAt: new Date().toISOString()
      });

      setSpaces([...spaces, { id: docRef.id, ...spaceData, createdAt: new Date().toISOString() }]);
      setShowCreateForm(false);
      setName('');
      setDescription('');
      toast.success('Private Space created! 🔐');
    } catch (err) {
      console.error(err);
      toast.error('Failed to create space');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-off-white pb-20 md:pb-8">
      <Nav />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8 border-b-[3px] border-black pb-4">
          <div>
            <h1 className="font-brutal text-4xl">PRIVATE SPACES</h1>
            <p className="font-mono text-xs opacity-60 mt-1">Classified rooms. Invite only.</p>
          </div>
          <button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            className={`btn-brutal px-4 py-2 ${showCreateForm ? 'bg-black text-white' : 'bg-lime-green'}`}
          >
            <PlusCircle className="w-4 h-4 inline-block mr-1" />
            {showCreateForm ? 'CANCEL' : 'NEW SPACE'}
          </button>
        </div>

        {showCreateForm && (
          <form onSubmit={handleCreateSpace} className="panel-brutal bg-white mb-8 animate-slide-up">
            <h2 className="font-brutal text-2xl mb-4">CREATE A SECURE ROOM</h2>
            <div className="space-y-4">
              <div>
                <label className="block font-brutal text-xs mb-1">SPACE NAME</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-brutal w-full" 
                  placeholder="e.g. The Boyz Group Chat"
                  required
                />
              </div>
              <div>
                <label className="block font-brutal text-xs mb-1">DESCRIPTION (OPTIONAL)</label>
                <input 
                  type="text" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-brutal w-full" 
                  placeholder="What happens here stays here."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-brutal text-xs mb-1">BACKGROUND COLOR</label>
                  <input 
                    type="color" 
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-full h-10 border-[2px] border-black p-1 cursor-pointer bg-white block" 
                  />
                </div>
                <div>
                  <label className="block font-brutal text-xs mb-1">GRID STYLE</label>
                  <select 
                    value={gridStyle}
                    onChange={(e) => setGridStyle(e.target.value as any)}
                    className="input-brutal w-full h-10"
                  >
                    <option value="none">None</option>
                    <option value="grid">Grid (Graph Paper)</option>
                    <option value="dots">Dots</option>
                  </select>
                </div>
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="btn-brutal w-full bg-hot-pink text-white py-3 mt-4 disabled:opacity-50"
              >
                {isSubmitting ? 'ENCRYPTING...' : 'INITIALIZE SPACE'}
              </button>
            </div>
          </form>
        )}

        {isLoading ? (
          <div className="text-center py-12 font-brutal animate-pulse">Scanning secure frequencies...</div>
        ) : spaces.length === 0 ? (
          <div className="panel-brutal text-center py-12 bg-gray-100">
            <Lock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="font-brutal text-xl">NO SPACES FOUND</h3>
            <p className="font-mono text-sm opacity-60 mt-2">You don't belong to any private spaces yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {spaces.map(space => (
              <Link key={space.id} href={`/spaces/${space.id}`} className="group relative block">
                <div 
                  className="panel-brutal transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 duration-200 h-full flex flex-col"
                  style={{ backgroundColor: space.backgroundColor }}
                >
                  <div className="flex items-start justify-between mb-4 bg-white/80 p-2 border-[2px] border-black">
                    <h3 className="font-brutal text-xl truncate">{space.name}</h3>
                    <ExternalLink className="w-4 h-4 opacity-50" />
                  </div>
                  {space.description && (
                    <p className="font-mono text-sm mb-4 bg-white/80 p-2 border-[2px] border-black">{space.description}</p>
                  )}
                  <div className="mt-auto flex items-center gap-4 bg-black text-white p-2">
                    <span className="flex items-center gap-1 font-mono text-xs">
                      <Users className="w-3 h-3" /> {space.memberIds.length} MEMBERS
                    </span>
                    {space.adminId === user?.uid && (
                      <span className="font-brutal text-[10px] bg-acid-yellow text-black px-1">ADMIN</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
