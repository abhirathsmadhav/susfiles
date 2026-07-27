'use client';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
import { motion } from 'framer-motion';

interface WallCanvasProps {
  cards: CardType[];
  friends: Friend[];
}

// Generate a deterministic-ish random rotation for a card
function randomPosition(seed: number, index: number, total: number) {
  const rng = (n: number) => {
    let x = Math.sin(n + seed) * 10000;
    return x - Math.floor(x);
  };
  const rotation = (rng(index * 3.1) - 0.5) * 24; // -12 to +12 deg
  return { rotation };
}

// Layout for scatter mode
function getScatterLayout(cards: CardType[], shuffleSeed: number) {
  return cards.map((card, i) => {
    // Always use seed-based rotation so each card has a unique tilt
    const { rotation } = randomPosition(shuffleSeed, i, cards.length);
    return { card, rotation };
  });
}

// Network mode layout
interface NetworkLayout {
  friends: { friend: Friend; x: number; y: number }[];
  cards: { card: CardType; x: number; y: number }[];
  lines: { x1: number; y1: number; x2: number; y2: number; color: string; dashed?: boolean }[];
  totalWidth: number;
  totalHeight: number;
}

function getNetworkLayout(cards: CardType[], friends: Friend[]): NetworkLayout {
  const result: NetworkLayout = {
    friends: [],
    cards: [],
    lines: [],
    totalWidth: 0,
    totalHeight: 0,
  };

  if (friends.length === 0 && cards.length === 0) return result;

  const R = Math.max(300, friends.length * 150);
  const canvasSize = 4000;
  const centerX = canvasSize / 2;
  const centerY = canvasSize / 2;
  
  result.totalWidth = canvasSize;
  result.totalHeight = canvasSize;

  const friendPos = new Map<string, {x: number, y: number}>();

  friends.forEach((friend, fi) => {
    const theta = (fi / Math.max(friends.length, 1)) * 2 * Math.PI - Math.PI / 2;
    const x = centerX + R * Math.cos(theta);
    const y = centerY + R * Math.sin(theta);
    result.friends.push({ friend, x, y });
    friendPos.set(friend.id, { x, y });
  });

  cards.forEach((card, ci) => {
    const linked = card.linkedFriendIds.filter(id => friendPos.has(id));
    
    let baseX = centerX;
    let baseY = centerY;

    if (linked.length > 0) {
      baseX = linked.reduce((sum, id) => sum + friendPos.get(id)!.x, 0) / linked.length;
      baseY = linked.reduce((sum, id) => sum + friendPos.get(id)!.y, 0) / linked.length;
    }

    // Offset cards to prevent overlap using golden angle
    const radius = 250 + (ci % 5) * 80;
    const angle = ci * 2.39996;
    
    // Offset by half-width (-125) and half-height (-150) so the target point is the center of the card
    const cardX = baseX + radius * Math.cos(angle) - 125;
    const cardY = baseY + radius * Math.sin(angle) - 150;
    const rot = (Math.sin(ci * 3.1) - 0.5) * 15;

    result.cards.push({
      card: { ...card, position: { ...card.position, rotation: rot } },
      x: cardX,
      y: cardY,
    });

    linked.forEach(id => {
      const fPos = friendPos.get(id)!;
      const fData = friends.find(f => f.id === id);
      result.lines.push({
        x1: fPos.x,
        y1: fPos.y,
        x2: cardX + 125, // center X of card
        y2: cardY + 150, // center Y of card
        color: fData?.signatureColor || '#000',
      });
    });
  });

  // Connect friends to other friends
  const drawnLines = new Set<string>();
  friends.forEach(friend => {
    const p1 = friendPos.get(friend.id);
    if (!p1 || !friend.friendIds) return;
    
    friend.friendIds.forEach(targetId => {
      const p2 = friendPos.get(targetId);
      if (p2) {
        // Ensure we only draw one line per pair
        const hash = [friend.id, targetId].sort().join('-');
        if (!drawnLines.has(hash)) {
          drawnLines.add(hash);
          result.lines.push({
            x1: p1.x,
            y1: p1.y,
            x2: p2.x,
            y2: p2.y,
            color: friend.signatureColor || '#888',
            dashed: true,
          });
        }
      }
    });
  });

  return result;
}

export default function WallCanvas({ cards, friends }: WallCanvasProps) {
  const [mode, setMode] = useState<'scatter' | 'network' | 'masonry'>('masonry');
  const [shuffleSeed, setShuffleSeed] = useState(42);
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<CType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCard, setActiveCard] = useState<CardType | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();
  const scatterRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const handleDragEnd = async (cardId: string, newX: number, newY: number) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'cards', cardId), {
        'position.x': newX,
        'position.y': newY,
      });
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
            friends.find(
              (f) =>
                f.id === id &&
                (f.name.toLowerCase().includes(q) || f.nickname?.toLowerCase().includes(q))
            )
          )
        );
      }
      return true;
    });
  }, [cards, selectedFriend, selectedType, searchQuery, friends]);

  // "Roast of the Day" — most total reactions
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

  const networkLayout = useMemo(
    () => getNetworkLayout(filteredCards, friends),
    [filteredCards, friends]
  );

  // Masonry breakpoints — mobile-first
  const masonryBreakpoints = {
    default: 4,
    1280: 4,
    1024: 3,
    768: 2,
    640: 1,
  };

  const toolbarControls = (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center gap-2 justify-between flex-wrap">
        {/* Mode buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setMode('masonry')}
            className={`flex items-center gap-1 btn-brutal-sm ${mode === 'masonry' ? 'bg-black text-acid-yellow' : ''}`}
            title="Masonry View"
          >
            <LayoutGrid className="w-3.5 h-3.5" /> <span className="hidden sm:inline">MASONRY</span>
          </button>
          <button
            onClick={() => setMode('scatter')}
            className={`flex items-center gap-1 btn-brutal-sm ${mode === 'scatter' ? 'bg-black text-acid-yellow' : ''}`}
            title="Scatter View"
          >
            <Wind className="w-3.5 h-3.5" /> <span className="hidden sm:inline">SCATTER</span>
          </button>
          <button
            onClick={() => setMode('network')}
            className={`flex items-center gap-1 btn-brutal-sm ${mode === 'network' ? 'bg-black text-acid-yellow' : ''}`}
            title="Network View"
          >
            <Network className="w-3.5 h-3.5" /> <span className="hidden sm:inline">NETWORK</span>
          </button>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="hidden sm:inline font-mono text-xs opacity-50">{filteredCards.length} files</span>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1 btn-brutal-sm ${showFilters ? 'bg-hot-pink text-white border-hot-pink' : ''}`}
            title="Filter"
          >
            <Search className="w-3.5 h-3.5" /> <span className="hidden sm:inline">FILTER</span>
          </button>
          <button onClick={handleShuffle} className="flex items-center gap-1 btn-brutal-sm" title="Shuffle">
            <Shuffle className="w-3.5 h-3.5" /> <span className="hidden sm:inline">SHUFFLE</span>
          </button>
        </div>
      </div>

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
    <div className="flex flex-col w-full flex-1">
      {portalTarget ? createPortal(toolbarControls, portalTarget) : (
        <div className="max-w-7xl mx-auto px-3 md:px-4 pt-4 w-full">
          {toolbarControls}
        </div>
      )}

      {filteredCards.length === 0 && (
        <div className="max-w-7xl mx-auto px-3 md:px-4 py-16 w-full">
          <div className="panel-brutal text-center py-12">
            <p className="font-brutal text-xl">🔍 NO FILES FOUND</p>
            <p className="text-sm opacity-60 mt-2">Try a different filter, suspect.</p>
          </div>
        </div>
      )}

      {/* ===== SCATTER MODE (desktop only) ===== */}
      {mode === 'scatter' && filteredCards.length > 0 && (
        <div
          ref={scatterRef}
          className="relative overflow-hidden bg-[#F0EDE0] cursor-grab active:cursor-grabbing w-full touch-none"
          style={{ height: 'calc(100vh - 195px)' }}
        >
          <motion.div
            drag
            dragConstraints={scatterRef}
            dragElastic={0.1}
            style={{ 
              position: 'absolute', 
              width: 4000, 
              height: 4000,
              left: '50%',
              top: '50%',
              marginLeft: -2000,
              marginTop: -2000,
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(0,0,0,0.06) 39px, rgba(0,0,0,0.06) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(0,0,0,0.06) 39px, rgba(0,0,0,0.06) 40px)',
            }}
          >
            {scatterLayout.map(({ card, rotation }, i) => {
              const isFeatured = roastOfTheDay?.id === card.id;
              const cols = Math.ceil(Math.sqrt(filteredCards.length));
              const rows = Math.ceil(filteredCards.length / cols);
              const col = i % cols;
              const row = Math.floor(i / cols);
              const rng = (n: number) => {
                let x = Math.sin(n * 9301 + shuffleSeed * 49297 + 233) * 10000;
                return x - Math.floor(x);
              };
              const startX = 2000 - (cols * 230) / 2;
              const startY = 2000 - (rows * 270) / 2;
              const baseX = startX + col * 230 + rng(i * 2) * 70;
              const baseY = startY + row * 270 + rng(i * 2 + 1) * 70;
              const posX = card.position.x !== 'auto' && card.position.x ? card.position.x : baseX;
              const posY = card.position.y !== 'auto' && card.position.y ? card.position.y : baseY;

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
                    animationDelay: `${i * 35}ms`,
                  }}
                />
              );
            })}
          </motion.div>
        </div>
      )}



      {/* ===== NETWORK MODE ===== */}
      {mode === 'network' && filteredCards.length > 0 && (
        <>
          <div
            ref={networkRef}
            className="relative overflow-hidden bg-[#F0EDE0] cursor-grab active:cursor-grabbing w-full touch-none"
            style={{ height: 'calc(100vh - 195px)' }}
          >
            <motion.div 
              drag
              dragConstraints={networkRef}
              dragElastic={0.1}
              style={{ 
                position: 'absolute', 
                width: networkLayout.totalWidth, 
                height: networkLayout.totalHeight,
                left: '50%',
                top: '50%',
                marginLeft: -(networkLayout.totalWidth / 2),
                marginTop: -(networkLayout.totalHeight / 2),
                backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.07) 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }}
            >
              <SVGConnectors lines={networkLayout.lines} width={networkLayout.totalWidth} height={networkLayout.totalHeight} />
              {networkLayout.friends.map(({ friend, x, y }) => (
                <FriendNode key={friend.id} friend={friend} x={x} y={y} />
              ))}
              {networkLayout.cards.map(({ card, x, y }) => (
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
            </motion.div>
          </div>
        </>
      )}

      {/* ===== MASONRY MODE ===== */}
      {mode === 'masonry' && filteredCards.length > 0 && (
        <div className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-8 w-full">
          <Masonry
          breakpointCols={masonryBreakpoints}
          className="my-masonry-grid"
          columnClassName="my-masonry-grid_column"
        >
          {scatterLayout.map(({ card }) => (
            <div key={card.id} className="snap-center snap-always flex items-center justify-center min-h-[80vh] sm:min-h-0 sm:block sm:mb-0">
              <Card
                card={card}
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
