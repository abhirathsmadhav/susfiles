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

// Tree mode layout
interface TreeLayout {
  friends: { friend: Friend; x: number; y: number }[];
  cards: { card: CardType; friendId: string; x: number; y: number }[];
  lines: { x1: number; y1: number; x2: number; y2: number; color: string }[];
  totalWidth: number;
  totalHeight: number;
}

function getTreeLayout(cards: CardType[], friends: Friend[]): TreeLayout {
  const NODE_X_GAP = 460;
  const NODE_Y = 140;
  const CARD_Y_START = 280;
  const CARD_Y_GAP = 260;

  const result: TreeLayout = {
    friends: [],
    cards: [],
    lines: [],
    totalWidth: 0,
    totalHeight: 0,
  };

  friends.forEach((friend, fi) => {
    const nodeX = 160 + fi * NODE_X_GAP;
    const nodeY = NODE_Y;
    result.friends.push({ friend, x: nodeX, y: nodeY });

    const linked = cards.filter((c) => c.linkedFriendIds.includes(friend.id));
    linked.forEach((card, ci) => {
      const isLeft = ci % 2 === 0;
      const noise = Math.sin(ci * 7.1 + fi) * 40;
      const cardX = nodeX + (isLeft ? -140 + noise : 50 + noise);
      const cardY = CARD_Y_START + ci * CARD_Y_GAP;
      const rot = (Math.sin(ci * 3.1) - 0.5) * 10;

      result.cards.push({
        card: { ...card, position: { ...card.position, rotation: rot } },
        friendId: friend.id,
        x: cardX,
        y: cardY,
      });
      result.lines.push({
        x1: nodeX,
        y1: nodeY + 50,
        x2: isLeft ? cardX + 200 : cardX + 40,
        y2: cardY + 20,
        color: friend.signatureColor,
      });
    });
  });

  result.totalWidth = 160 + Math.max(friends.length - 1, 0) * NODE_X_GAP + 280;
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

  const treeLayout = useMemo(
    () => getTreeLayout(filteredCards, friends),
    [filteredCards, friends]
  );

  // Masonry breakpoints — mobile-first
  const masonryBreakpoints = {
    default: 4,
    1280: 4,
    1024: 3,
    768: 2,
    640: 2,
    0: 1,
  };

  const toolbarControls = (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center gap-2 justify-between flex-wrap">
        {/* Mode buttons — hidden on mobile (only masonry shown) */}
        <div className="hidden sm:flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setMode('masonry')}
            className={`flex items-center gap-1 btn-brutal-sm ${mode === 'masonry' ? 'bg-black text-acid-yellow' : ''}`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> MASONRY
          </button>
          <button
            onClick={() => setMode('scatter')}
            className={`flex items-center gap-1 btn-brutal-sm ${mode === 'scatter' ? 'bg-black text-acid-yellow' : ''}`}
          >
            <Wind className="w-3.5 h-3.5" /> SCATTER
          </button>
          <button
            onClick={() => setMode('tree')}
            className={`flex items-center gap-1 btn-brutal-sm ${mode === 'tree' ? 'bg-black text-acid-yellow' : ''}`}
          >
            <Network className="w-3.5 h-3.5" /> TREE
          </button>
        </div>

        {/* Mobile: only show masonry label */}
        <div className="flex sm:hidden items-center gap-1.5">
          <span className="font-brutal text-xs uppercase opacity-60">{filteredCards.length} files</span>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="hidden sm:inline font-mono text-xs opacity-50">{filteredCards.length} files</span>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1 btn-brutal-sm ${showFilters ? 'bg-hot-pink text-white border-hot-pink' : ''}`}
          >
            <Search className="w-3.5 h-3.5" /> FILTER
          </button>
          <button onClick={handleShuffle} className="flex items-center gap-1 btn-brutal-sm">
            <Shuffle className="w-3.5 h-3.5" /> SHUFFLE
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
    <div className="flex flex-col gap-3 md:gap-4">
      {portalTarget ? createPortal(toolbarControls, portalTarget) : toolbarControls}

      {filteredCards.length === 0 && (
        <div className="panel-brutal text-center py-12">
          <p className="font-brutal text-xl">🔍 NO FILES FOUND</p>
          <p className="text-sm opacity-60 mt-2">Try a different filter, suspect.</p>
        </div>
      )}

      {/* ===== SCATTER MODE (desktop only) ===== */}
      {mode === 'scatter' && filteredCards.length > 0 && (
        <div
          className="hidden sm:block relative overflow-auto border-[3px] border-black bg-[#F0EDE0]"
          style={{
            minHeight: 650,
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(0,0,0,0.06) 39px, rgba(0,0,0,0.06) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(0,0,0,0.06) 39px, rgba(0,0,0,0.06) 40px)',
            boxShadow: '5px 5px 0px #000',
          }}
        >
          <div style={{ position: 'relative', minHeight: 650, minWidth: 850 }}>
            {scatterLayout.map(({ card, rotation }, i) => {
              const isFeatured = roastOfTheDay?.id === card.id;
              const cols = Math.ceil(Math.sqrt(filteredCards.length));
              const col = i % cols;
              const row = Math.floor(i / cols);
              const rng = (n: number) => {
                let x = Math.sin(n * 9301 + shuffleSeed * 49297 + 233) * 10000;
                return x - Math.floor(x);
              };
              const baseX = 50 + col * 230 + rng(i * 2) * 70;
              const baseY = 50 + row * 270 + rng(i * 2 + 1) * 70;
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
          </div>
        </div>
      )}

      {/* Fallback to masonry when scatter/tree selected on mobile */}
      {mode === 'scatter' && filteredCards.length > 0 && (
        <div className="sm:hidden">
          <Masonry
            breakpointCols={masonryBreakpoints}
            className="my-masonry-grid"
            columnClassName="my-masonry-grid_column"
          >
            {scatterLayout.map(({ card }) => (
              <div key={card.id}>
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

      {/* ===== TREE MODE (desktop only) ===== */}
      {mode === 'tree' && filteredCards.length > 0 && (
        <>
          {/* Mobile: vertical timeline */}
          <div className="sm:hidden flex flex-col gap-12 p-4 border-[3px] border-black bg-[#F0EDE0]" style={{ boxShadow: '4px 4px 0px #000' }}>
            {friends.map((friend) => {
              const linked = filteredCards.filter((c) => c.linkedFriendIds.includes(friend.id));
              if (linked.length === 0) return null;
              return (
                <div key={friend.id} className="relative flex flex-col items-center w-full max-w-sm mx-auto">
                  <div className="z-10 relative bg-[#F0EDE0] p-2">
                    <FriendNode friend={friend} isInline={true} />
                  </div>
                  <div
                    className="w-[3px] absolute top-10 bottom-0 z-0"
                    style={{ backgroundColor: friend.signatureColor || '#000' }}
                  />
                  <div className="flex flex-col gap-6 w-full mt-4 pl-6">
                    {linked.map((card, idx) => {
                      const isFeatured = roastOfTheDay?.id === card.id;
                      const rot = idx % 2 === 0 ? 1.5 : -1.5;
                      return (
                        <div key={card.id} className="relative w-full">
                          <div
                            className="absolute -left-6 top-1/2 w-6 h-[3px] z-0 -translate-y-1/2"
                            style={{ backgroundColor: friend.signatureColor || '#000' }}
                          />
                          <div className="relative z-10">
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

          {/* Desktop: horizontal tree */}
          <div
            className="hidden sm:block relative overflow-auto border-[3px] border-black bg-[#F0EDE0]"
            style={{
              minHeight: treeLayout.totalHeight,
              backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.07) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
              boxShadow: '5px 5px 0px #000',
            }}
          >
            <div style={{ position: 'relative', width: treeLayout.totalWidth, height: treeLayout.totalHeight }}>
              <SVGConnectors lines={treeLayout.lines} width={treeLayout.totalWidth} height={treeLayout.totalHeight} />
              {treeLayout.friends.map(({ friend, x, y }) => (
                <FriendNode key={friend.id} friend={friend} x={x} y={y} />
              ))}
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
        <Masonry
          breakpointCols={masonryBreakpoints}
          className="my-masonry-grid"
          columnClassName="my-masonry-grid_column"
        >
          {scatterLayout.map(({ card }) => (
            <div key={card.id}>
              <Card
                card={card}
                friends={friends}
                onClick={() => setActiveCard(card)}
                isFeatured={roastOfTheDay?.id === card.id}
              />
            </div>
          ))}
        </Masonry>
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
