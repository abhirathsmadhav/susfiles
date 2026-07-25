'use client';

import { Card as CardType, Friend } from '@/types';
import Image from 'next/image';
import { motion, PanInfo } from 'framer-motion';
import { useRef, useState } from 'react';

interface CardProps {
  card: CardType;
  friends: Friend[];
  onClick: () => void;
  isFeatured?: boolean;
  style?: React.CSSProperties;
  className?: string;
  isDraggable?: boolean;
  onDragEnd?: (id: string, x: number, y: number) => void;
}

// Assign a default color based on the first linked friend's signature color
function getAccentColor(card: CardType, friends: Friend[]): string {
  if (card.color) return card.color;
  const linked = friends.find((f) => card.linkedFriendIds.includes(f.id));
  return linked?.signatureColor ?? '#F5F500';
}

function getTypeIcon(type: CardType['type']): string {
  switch (type) {
    case 'quote':   return '💬';
    case 'convo':   return '🗣️';
    case 'image':   return '🖼️';
    case 'audio':   return '🎵';
    case 'video':   return '🎥';
    case 'moment':  return '⚡';
    case 'text':    return '📝';
    default:        return '🃏';
  }
}

function getTypeLabel(type: CardType['type']): string {
  return type.toUpperCase();
}

export default function Card({ card, friends, onClick, isFeatured, style, className, isDraggable, onDragEnd }: CardProps) {
  const accent = getAccentColor(card, friends);
  const linkedFriends = friends.filter((f) => card.linkedFriendIds.includes(f.id));
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleDragEnd = (e: any, info: PanInfo) => {
    if (!isDraggable || !onDragEnd) return;
    
    // We get the final position of the drag relative to its original position
    // Since we are setting style={{ left: posX, top: posY }}, the drag 'offset' (info.point) is absolute page coordinates
    // Actually, info.offset is the delta from the start of the drag.
    // If the element has absolute positioning, we might want to update the original x/y by info.offset.x / y.
    
    // Calculate new position
    const currentX = (typeof card.position.x === 'number') ? card.position.x : 0;
    const currentY = (typeof card.position.y === 'number') ? card.position.y : 0;
    
    onDragEnd(card.id, currentX + info.offset.x, currentY + info.offset.y);
  };

  return (
    <motion.div
      drag={isDraggable}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      onClick={onClick}
      className={`relative select-none tape-corner ${isFeatured ? 'pushpin' : ''} ${className ?? ''} ${isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} ${style?.position === 'absolute' ? '' : 'w-full'}`}
      style={{
        '--card-rotation': `${card.position.rotation ?? 0}deg`,
        ...style,
      } as React.CSSProperties}
    >
      <div
        className={`wall-card border-[3px] border-black bg-white p-0 overflow-hidden ${style?.position === 'absolute' ? '' : 'w-full'}`}
        style={{
          boxShadow: '6px 6px 0px #000',
          width: style?.position === 'absolute' ? (isFeatured ? 320 : 220) : undefined,
          maxWidth: '100%',
        }}
      >
        {/* Accent bar */}
        <div className="h-3 w-full" style={{ background: accent }} />

        {/* Type tag */}
        <div className="flex items-center justify-between px-3 pt-2 pb-1">
          <span
            className="tag-brutal text-[10px]"
            style={{ background: accent, borderColor: '#000' }}
          >
            {getTypeIcon(card.type)} {getTypeLabel(card.type)}
          </span>
          {isFeatured && (
            <span className="tag-brutal text-[10px] bg-hot-pink text-white border-hot-pink">
              🔥 ROAST OF THE DAY
            </span>
          )}
        </div>

        {/* Image */}
        {card.type === 'image' && card.imageUrl && (
          <div className="relative w-full border-t-[2px] border-b-[2px] border-black overflow-hidden bg-black/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={card.imageUrl}
              alt={card.caption ?? card.title ?? 'Card image'}
              className="w-full h-auto block"
              draggable={false}
            />
          </div>
        )}

        {/* Audio */}
        {card.type === 'audio' && card.audioUrl && (
          <div className="flex-1 w-full border-b-[3px] border-black p-4 bg-[#1A1A1A] flex flex-col items-center justify-center min-h-[120px]">
            {/* Brutalist Audio Player */}
            <div className="w-full max-w-xs flex items-center justify-center gap-3">
              <button
                onClick={(e) => { e.stopPropagation(); toggleAudio(); }}
                className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-[#F5F500] border-[3px] border-black rounded-full hover:scale-110 active:scale-95 transition-transform"
                style={{ boxShadow: '4px 4px 0px #000' }}
              >
                <span className="text-xl translate-x-[2px]">{isPlaying ? '⏸' : '▶'}</span>
              </button>
              <div className="flex-1 h-3 bg-white border-[2px] border-black relative overflow-hidden" style={{ boxShadow: '2px 2px 0px #000' }}>
                <div className="absolute left-0 top-0 bottom-0 bg-[#FF2D78]" style={{ width: `${audioProgress}%`, transition: 'width 0.1s linear' }} />
              </div>
            </div>
            <audio ref={audioRef} src={card.audioUrl} className="hidden" />
          </div>
        )}

        {/* Video */}
        {card.type === 'video' && card.videoUrl && (
          <div className="flex-1 w-full border-b-[3px] border-black bg-black min-h-[160px] relative">
            <video src={card.videoUrl} controls className="w-full h-full max-h-64 object-contain" onClick={(e) => e.stopPropagation()} />
          </div>
        )}

        {/* Content */}
        <div className="px-3 py-2">
          {card.title && (
            <h3 className="font-brutal text-sm leading-tight mb-1 truncate">{card.title}</h3>
          )}
          <p
            className={`text-sm leading-snug ${card.type === 'quote' ? 'italic' : ''}`}
            style={{ fontFamily: card.type === 'quote' ? 'Space Mono, monospace' : undefined }}
          >
            {card.type === 'quote' ? `"${card.content}"` : card.content}
          </p>
          {card.caption && card.type === 'image' && (
            <p className="text-xs mt-1 opacity-70">{card.caption}</p>
          )}
        </div>

        {/* Linked friends */}
        {linkedFriends.length > 0 && (
          <div className="flex items-center gap-1 px-3 pb-3 flex-wrap">
            {linkedFriends.slice(0, 3).map((f) => (
              <span
                key={f.id}
                className="text-[10px] font-bold px-1.5 py-0.5 border-[2px] border-black"
                style={{ background: f.signatureColor }}
              >
                {f.nickname || f.name}
              </span>
            ))}
            {linkedFriends.length > 3 && (
              <span className="text-[10px] font-bold">+{linkedFriends.length - 3}</span>
            )}
          </div>
        )}

        {/* Reactions */}
        <div className="flex items-center gap-1 px-3 pb-2 border-t-[2px] border-black pt-2 text-xs">
          {Object.entries(card.reactions ?? {}).map(([emoji, count]) =>
            count > 0 ? (
              <span key={emoji} className="font-bold">
                {emoji} {count}
              </span>
            ) : null
          )}
        </div>
      </div>
    </motion.div>
  );
}
