'use client';

import { Card as CardType, Friend } from '@/types';
import Image from 'next/image';
import { motion, PanInfo } from 'framer-motion';
import { useRef, useState } from 'react';
import CassettePlayer from './CassettePlayer';

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
  const isAbsolute = style?.position === 'absolute';

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
          <div className="w-full border-b-[2px] border-black">
            <CassettePlayer audioUrl={card.audioUrl} title={card.title} color={accent} />
          </div>
        )}

        {card.type === 'video' && card.videoUrl && (
          <div className="w-full border-b-[2px] border-black bg-black">
            <video 
              src={card.videoUrl} 
              controls 
              className={`w-full object-cover ${
                !card.mediaAspectRatio || card.mediaAspectRatio === '1:1' ? 'aspect-square' :
                card.mediaAspectRatio === 'original' ? '' :
                card.mediaAspectRatio === '4:3' ? 'aspect-[4/3]' :
                card.mediaAspectRatio === '16:9' ? 'aspect-video' :
                card.mediaAspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-square'
              }`} 
              onClick={(e) => e.stopPropagation()} 
            />
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
