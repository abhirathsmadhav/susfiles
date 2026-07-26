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

export default function Card({ card, friends, onClick, isFeatured, style, className, isDraggable, onDragEnd }: CardProps) {
  const accent = getAccentColor(card, friends);
  const linkedFriends = friends.filter((f) => card.linkedFriendIds.includes(f.id));
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);

  const isAbsolute = style?.position === 'absolute';

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
      className={`relative select-none tape-corner ${isFeatured ? 'pushpin' : ''} ${className ?? ''} ${isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} ${isAbsolute ? '' : 'w-full'}`}
      style={{
        '--card-rotation': `${card.position.rotation ?? 0}deg`,
        ...style,
      } as React.CSSProperties}
    >
      <div
        className={`wall-card border-[3px] border-black bg-white overflow-hidden ${isAbsolute ? '' : 'w-full'}`}
        style={{
          boxShadow: '4px 4px 0px #000',
          width: isAbsolute ? (isFeatured ? 300 : 210) : undefined,
          maxWidth: '100%',
        }}
      >
        {/* Accent bar */}
        <div className="h-2.5 w-full" style={{ background: accent }} />

        {/* Type tag row */}
        <div className="flex items-center justify-between px-3 pt-2 pb-1">
          <span
            className="tag-brutal text-[10px]"
            style={{ background: accent, borderColor: '#000' }}
          >
            {getTypeIcon(card.type)} {card.type.toUpperCase()}
          </span>
          {isFeatured && (
            <span className="tag-brutal text-[10px] bg-hot-pink text-white border-hot-pink">
              🔥 ROAST
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
              loading="lazy"
            />
          </div>
        )}

        {/* Audio */}
        {card.type === 'audio' && card.audioUrl && (
          <div className="w-full border-b-[2px] border-black p-3 bg-[#1A1A1A] flex items-center gap-3 min-h-[72px]">
            <button
              onClick={(e) => { e.stopPropagation(); toggleAudio(); }}
              className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-[#F5F500] border-[2px] border-black hover:scale-110 active:scale-95 transition-transform"
              style={{ boxShadow: '3px 3px 0px #000' }}
            >
              <span className="text-lg translate-x-[1px]">{isPlaying ? '⏸' : '▶'}</span>
            </button>
            <div className="flex-1 h-2.5 bg-white border-[2px] border-black relative overflow-hidden" style={{ boxShadow: '2px 2px 0px #000' }}>
              <div className="absolute left-0 top-0 bottom-0 bg-[#FF2D78]" style={{ width: `${audioProgress}%`, transition: 'width 0.1s linear' }} />
            </div>
            <audio
              ref={audioRef}
              src={card.audioUrl}
              className="hidden"
              onTimeUpdate={() => {
                if (audioRef.current) {
                  setAudioProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
                }
              }}
              onEnded={() => setIsPlaying(false)}
            />
          </div>
        )}

        {/* Video */}
        {card.type === 'video' && card.videoUrl && (
          <div className="w-full border-b-[2px] border-black bg-black">
            <video src={card.videoUrl} controls className="w-full h-full max-h-56 object-contain" onClick={(e) => e.stopPropagation()} />
          </div>
        )}

        {/* Content */}
        <div className="px-3 py-2">
          {card.title && (
            <h3 className="font-brutal text-sm leading-tight mb-1 line-clamp-2">{card.title}</h3>
          )}
          <p
            className={`text-sm leading-snug line-clamp-4 ${card.type === 'quote' ? 'italic' : ''}`}
            style={{ fontFamily: card.type === 'quote' ? 'Space Mono, monospace' : undefined }}
          >
            {card.type === 'quote' ? `"${card.content}"` : card.content}
          </p>
          {card.caption && card.type === 'image' && (
            <p className="text-xs mt-1 opacity-60 line-clamp-2">{card.caption}</p>
          )}
        </div>

        {/* Linked friends */}
        {linkedFriends.length > 0 && (
          <div className="flex items-center gap-1 px-3 pb-2 flex-wrap">
            {linkedFriends.slice(0, 2).map((f) => (
              <span
                key={f.id}
                className="text-[10px] font-bold px-1.5 py-0.5 border-[2px] border-black max-w-[80px] truncate"
                style={{ background: f.signatureColor }}
              >
                {f.nickname || f.name}
              </span>
            ))}
            {linkedFriends.length > 2 && (
              <span className="text-[10px] font-bold opacity-60">+{linkedFriends.length - 2}</span>
            )}
          </div>
        )}

        {/* Reactions */}
        {Object.values(card.reactions ?? {}).some((v) => v > 0) && (
          <div className="flex items-center gap-1.5 px-3 pb-2 border-t-[2px] border-black pt-2 text-xs flex-wrap">
            {Object.entries(card.reactions ?? {}).map(([emoji, count]) =>
              count > 0 ? (
                <span key={emoji} className="font-bold">
                  {emoji} {count}
                </span>
              ) : null
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
