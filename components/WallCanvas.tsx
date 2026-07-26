'use client';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LayoutGrid, Wind, Network, Search, Shuffle } from 'lucide-react';
import { Card as CardType, Friend, CardType as CType } from '@/types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import Masonry from 'react-masonry-css';
import Card from './Card';
import CardModal from './CardModal';
import FilterBar from './FilterBar';
import FriendNode from './FriendNode';
import SVGConnectors from './SVGConnectors';

interface WallCanvasProps {
  cards: CardType[];
  friends: Friend[];
}

// Generate a deterministic-ish random position for a card
function randomPosition(seed: number, index: number, total: number) {
  const rng = (n: number) => {
    let x = Math.sin(n + seed) * 10000;
    return x - Math.floor(x);
  };
  const rotation = (rng(index * 3.1) - 0.5) * 30; // -15 to +15 deg
  return { rotation };
}

// Layout for scatter mode
function getScatterLayout(cards: CardType[], shuffleSeed: number) {
  return cards.map((card, i) => {
    // Always use seed-based rotation so each card has a unique tilt,
    // regardless of the stored position.rotation (which can be the same for all cards).
    const { rotation } = randomPosition(shuffleSeed, i, cards.length);
    return { card, rotation };
  });
}

// Tree mode layout
interface TreeLayout {
  friends: { friend: Friend; x: number; y: number }[];
  cards: { card: CardType; friendId: string; x: number; y: number }[];
  lines: { x1: number; y1: number; x2: number; y2: number; color: string }[];
  totalWidth: number;
  totalHeight: number;
}

function getTreeLayout(cards: CardType[], friends: Friend[]): TreeLayout {
  const NODE_X_GAP = 500;
  const NODE_Y = 160;
  const CARD_Y_START = 300;
  const CARD_Y_GAP = 280;

  const result: TreeLayout = {
    friends: [],
    cards: [],
    lines: [],
    totalWidth: 0,
    totalHeight: 0,
  };

  friends.forEach((friend, fi) => {
    const nodeX = 180 + fi * NODE_X_GAP;
    const nodeY = NODE_Y;
    result.friends.push({ friend, x: nodeX, y: nodeY });

    const linked = cards.filter((c) => c.linkedFriendIds.includes(friend.id));
    linked.forEach((card, ci) => {
      // Stagger left and right for a dynamic look
      const isLeft = ci % 2 === 0;
      const noise = Math.sin(ci * 7.1 + fi) * 40;
      const cardX = nodeX + (isLeft ? -150 + noise : 60 + noise);
      const cardY = CARD_Y_START + ci * CARD_Y_GAP;
      
      // Calculate rotation for the card directly here to be used in rendering
      const rot = (Math.sin(ci * 3.1) - 0.5) * 12;

      result.cards.push({ card: { ...card, position: { ...card.position, rotation: rot } }, friendId: friend.id, x: cardX, y: cardY });
      result.lines.push({
        x1: nodeX,
        y1: nodeY + 50,
        x2: isLeft ? cardX + 200 : cardX + 40, // Attach to different sides based on stagger
        y2: cardY + 20,
        color: friend.signatureColor,
      });
    });
  });

  result.totalWidth = 180 + Math.max(friends.length - 1, 0) * NODE_X_GAP + 300;
  result.totalHeight = Math.max(
    600,
    CARD_Y_START +
      Math.max(...friends.map((f) => cards.filter((c) => c.linkedFriendIds.includes(f.id)).length), 1) *
        CARD_Y_GAP +
      200
  );

  return result;
}

export default function WallCanvas({ cards, friends }: WallCanvasProps) {
  const [mode, setMode] = useState<'scatter' | 'tree' | 'masonry'>('masonry');
  const [shuffleSeed, setShuffleSeed] = useState(42);
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<CType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCard, setActiveCard] = useState<CardType | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();

  useEffect(() => setMounted(true), []);

  const handleDragEnd = async (cardId: string, newX: number, newY: number) => {
    if (!user) return; // Anyone can drag if authenticated in the new rules
    try {
      await updateDoc(doc(db, 'cards', cardId), {
        'position.x': newX,
        'position.y': newY,
      });
      // We don't update local state here because we rely on the Firestore snapshot in page.tsx 
      // which will re-render automatically. But wait, getDocs in page.tsx isn't onSnapshot...
      // Let's at least update it visually if it's not real-time listener.
      // Ah, page.tsx uses `getDocs` not `onSnapshot`, so it won't auto-update.
      // But Framer Motion leaves the element at the dragged position, so it's fine until refresh!
    } catch (err) {
      console.error('Failed to update card position', err);
    }
  };

  // Filter cards
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      if (selectedFriend && !card.linkedFriendIds.includes(selectedFriend)) return false;
      if (selectedType && card.type !== selectedType) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          card.content.toLowerCase().includes(q) ||
          card.title?.toLowerCase().includes(q) ||
          card.caption?.toLowerCase().includes(q) ||
          card.linkedFriendIds.some((id) =>
            friends.find((f) => f.id === id && (f.name.toLowerCase().includes(q) || f.nickname?.toLowerCase().includes(q)))
          )
        );
      }
      return true;
    });
  }, [cards, selectedFriend, selectedType, searchQuery, friends]);

  // Pick "Roast of the Day" — based on most total reactions
  const roastOfTheDay = useMemo(() => {
    if (filteredCards.length === 0) return null;
    return filteredCards.reduce((prev, current) => {
      const prevTotal = Object.values(prev.reactions ?? {}).reduce((a, b) => a + b, 0);
      const currentTotal = Object.values(current.reactions ?? {}).reduce((a, b) => a + b, 0);
      return currentTotal > prevTotal ? current : prev;
    }, filteredCards[0]);
  }, [filteredCards]);

  const handleShuffle = useCallback(() => {
    setShuffleSeed((s) => s + Math.floor(Math.random() * 100) + 1);
  }, []);

  const scatterLayout = useMemo(
    () => getScatterLayout(filteredCards, shuffleSeed),
    [filteredCards, shuffleSeed]
  );

  const treeLayout = useMemo(
    () => getTreeLayout(filteredCards, friends),
    [filteredCards, friends]
  );

  const toolbarControls = (
    <div className="flex flex-col gap-4 w-full">
      {/* Controls bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setMode('masonry')}
            className={`flex items-center gap-1 btn-brutal-sm ${mode === 'masonry' ? 'bg-black text-acid-yellow dark:bg-white dark:text-black' : 'dark:text-white'}`}
          >
            <LayoutGrid className="w-4 h-4" /> MASONRY
          </button>
          <button
            onClick={() => setMode('scatter')}
            className={`flex items-center gap-1 btn-brutal-sm ${mode === 'scatter' ? 'bg-black text-acid-yellow dark:bg-white dark:text-black' : 'dark:text-white'}`}
          >
            <Wind className="w-4 h-4" /> SCATTER
          </button>
          <button
            onClick={() => setMode('tree')}
            className={`flex items-center gap-1 btn-brutal-sm ${mode === 'tree' ? 'bg-black text-acid-yellow dark:bg-white dark:text-black' : 'dark:text-white'}`}
          >
            <Network className="w-4 h-4" /> TREE
          </button>
          <div className="w-[2px] h-6 bg-black dark:bg-white opacity-30 mx-2" />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1 btn-brutal-sm ${showFilters ? 'bg-hot-pink text-white border-hot-pink' : 'dark:text-white'}`}
          >
            <Search className="w-4 h-4" /> SEARCH / FILTER
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <span className="font-mono text-xs opacity-60 text-black dark:text-white">{filteredCards.length} files</span>
          <button onClick={handleShuffle} className="flex items-center gap-1 btn-brutal-sm">
            <Shuffle className="w-4 h-4" /> SHUFFLE
          </button>
        </div>
      </div>

      {/* Filter bar */}
      {showFilters && (
        <FilterBar
          friends={friends}
          onFilterFriend={setSelectedFriend}
          onSearch={setSearchQuery}
          onFilterType={setSelectedType}
          selectedFriend={selectedFriend}
          selectedType={selectedType}
        />
      )}
    </div>
  );

  const portalTarget = mounted ? document.getElementById('wall-toolbar-portal') : null;

  return (
    <div className="flex flex-col gap-4">
      {portalTarget ? createPortal(toolbarControls, portalTarget) : toolbarControls}

      {filteredCards.length === 0 && (
        <div className="panel-brutal text-center py-16">
          <p className="font-brutal text-2xl">🔍 NO FILES FOUND</p>
          <p className="text-sm opacity-60 mt-2">Try a different filter, suspect.</p>
        </div>
      )}

      {/* ===== SCATTER MODE ===== */}
      {mode === 'scatter' && filteredCards.length > 0 && (
        <div
          className="relative overflow-auto border-[3px] border-black dark:border-white bg-[#F0EDE0] dark:bg-[#1A1A1A]"
          style={{
            minHeight: 700,
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(0,0,0,0.07) 39px, rgba(0,0,0,0.07) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(0,0,0,0.07) 39px, rgba(0,0,0,0.07) 40px)',
            boxShadow: '6px 6px 0px #000',
          }}
        >
          {/* Mobile: stack layout */}
          <div className="flex md:hidden flex-col gap-4 p-4">
            {scatterLayout.map(({ card, rotation }) => (
              <Card
                key={card.id}
                card={{ ...card, position: { ...card.position, rotation } }}
                friends={friends}
                onClick={() => setActiveCard(card)}
                isFeatured={roastOfTheDay?.id === card.id}
              />
            ))}
          </div>

          {/* Desktop: absolute positioned scatter */}
          <div className="hidden md:block" style={{ position: 'relative', minHeight: 700, minWidth: 900 }}>
            {scatterLayout.map(({ card, rotation }, i) => {
              const isFeatured = roastOfTheDay?.id === card.id;
              // Use stored position or generate a scattered position
              const cols = Math.ceil(Math.sqrt(filteredCards.length));
              const col = i % cols;
              const row = Math.floor(i / cols);
              const rng = (n: number) => { let x = Math.sin(n * 9301 + shuffleSeed * 49297 + 233) * 10000; return x - Math.floor(x); };
              const baseX = 60 + col * 240 + rng(i * 2) * 80;
              const baseY = 60 + row * 280 + rng(i * 2 + 1) * 80;
              const posX = (card.position.x !== 'auto' && card.position.x) ? card.position.x : baseX;
              const posY = (card.position.y !== 'auto' && card.position.y) ? card.position.y : baseY;

              return (
                <Card
                  key={card.id}
                  card={{ ...card, position: { x: posX, y: posY, rotation } }}
                  friends={friends}
                  onClick={() => setActiveCard(card)}
                  isFeatured={isFeatured}
                  isDraggable={!!user}
                  onDragEnd={handleDragEnd}
                  style={{
                    position: 'absolute',
                    left: posX,
                    top: posY,
                    zIndex: isFeatured ? 30 : 10 + i,
                    transform: `rotate(${rotation}deg)`,
                    animationDelay: `${i * 40}ms`,
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* ===== TREE MODE ===== */}
      {mode === 'tree' && filteredCards.length > 0 && (
        <>
          {/* Mobile Vertical Timeline Layout */}
          <div className="md:hidden flex flex-col gap-16 p-4 border-[3px] border-black dark:border-white bg-[#F0EDE0] dark:bg-[#1A1A1A]" style={{ boxShadow: '6px 6px 0px #000' }}>
            {friends.map(friend => {
              const linked = filteredCards.filter((c) => c.linkedFriendIds.includes(friend.id));
              if (linked.length === 0) return null;
              
              return (
                <div key={friend.id} className="relative flex flex-col items-center w-full max-w-sm mx-auto">
                  {/* Friend Avatar Node */}
                  <div className="z-10 relative bg-[#F0EDE0] p-2">
                    <FriendNode friend={friend} isInline={true} />
                  </div>
                  
                  {/* Vertical Wire */}
                  <div 
                    className="w-[4px] absolute top-10 bottom-0 z-0" 
                    style={{ backgroundColor: friend.signatureColor || '#000' }} 
                  />
                  
                  {/* Attached Cards */}
                  <div className="flex flex-col gap-8 w-full mt-6 pl-8">
                    {linked.map((card, idx) => {
                      const isFeatured = roastOfTheDay?.id === card.id;
                      // Alternate rotation slightly for scrapbook feel
                      const rot = idx % 2 === 0 ? 2 : -2;
                      
                      return (
                        <div key={card.id} className="relative w-full">
                          {/* Horizontal connecting wire */}
                          <div 
                            className="absolute -left-8 top-1/2 w-8 h-[4px] z-0 -translate-y-1/2" 
                            style={{ backgroundColor: friend.signatureColor || '#000' }} 
                          />
                          <div className="relative z-10 transition-transform hover:-translate-y-1">
                            <Card
                              card={{ ...card, position: { ...card.position, rotation: rot } }}
                              friends={friends}
                              onClick={() => setActiveCard(card)}
                              isFeatured={isFeatured}
                              style={{ transform: `rotate(${rot}deg)` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Horizontal Tree Layout */}
          <div
            className="hidden md:block relative overflow-auto border-[3px] border-black dark:border-white bg-[#F0EDE0] dark:bg-[#1A1A1A]"
            style={{
              minHeight: treeLayout.totalHeight,
              backgroundImage:
                'radial-gradient(circle, rgba(0,0,0,0.08) 1px, transparent 1px)',
              backgroundSize: '30px 30px',
              boxShadow: '6px 6px 0px #000',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: treeLayout.totalWidth,
                height: treeLayout.totalHeight,
              }}
            >
              {/* SVG connectors */}
              <SVGConnectors
                lines={treeLayout.lines}
                width={treeLayout.totalWidth}
                height={treeLayout.totalHeight}
              />

              {/* Friend nodes */}
              {treeLayout.friends.map(({ friend, x, y }) => (
                <FriendNode key={friend.id} friend={friend} x={x} y={y} />
              ))}

              {/* Cards */}
              {treeLayout.cards.map(({ card, x, y }) => (
                <Card
                  key={card.id}
                  card={{ ...card, position: { x, y, rotation: card.position.rotation ?? 0 } }}
                  friends={friends}
                  onClick={() => setActiveCard(card)}
                  style={{
                    position: 'absolute',
                    left: x,
                    top: y,
                    zIndex: 10,
                    transform: `rotate(${card.position.rotation}deg)`,
                  }}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* ===== MASONRY MODE ===== */}
      {mode === 'masonry' && filteredCards.length > 0 && (
        <div className="w-full">
          <Masonry
            breakpointCols={{
              default: 4,
              1100: 3,
              700: 2,
              500: 1
            }}
            className="my-masonry-grid"
            columnClassName="my-masonry-grid_column"
          >
            {scatterLayout.map(({ card, rotation }) => (
              <div key={card.id} className="transition-transform hover:-translate-y-1">
                <Card
                  card={{ ...card, position: { ...card.position, rotation } }}
                  friends={friends}
                  onClick={() => setActiveCard(card)}
                  isFeatured={roastOfTheDay?.id === card.id}
                />
              </div>
            ))}
          </Masonry>
        </div>
      )}

      {/* Modal */}
      {activeCard && (
        <CardModal
          card={activeCard}
          friends={friends}
          onClose={() => setActiveCard(null)}
        />
      )}
    </div>
  );
}
