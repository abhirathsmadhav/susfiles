'use client';

import { Card, Friend } from '@/types';
import { useEffect, useRef } from 'react';
import EmojiReactions from './EmojiReactions';
import Link from 'next/link';

interface CardModalProps {
  card: Card;
  friends: Friend[];
  onClose: () => void;
}

function getAccentColor(card: Card, friends: Friend[]): string {
  if (card.color) return card.color;
  const linked = friends.find((f) => card.linkedFriendIds.includes(f.id));
  return linked?.signatureColor ?? '#F5F500';
}

export default function CardModal({ card, friends, onClose }: CardModalProps) {
  const accent = getAccentColor(card, friends);
  const linkedFriends = friends.filter((f) => card.linkedFriendIds.includes(f.id));

  // Close on ESC
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div
        className="bottom-sheet sm:relative sm:w-full sm:max-w-lg sm:animate-slide-up w-full flex flex-col"
        style={{ '--accent': accent } as React.CSSProperties}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
          <div className="drag-handle" />
        </div>

        {/* Accent bar (desktop only) */}
        <div className="hidden sm:block h-3 shrink-0" style={{ background: accent }} />

        {/* Header row — sticky */}
        <div className="flex items-center justify-between px-4 py-3 border-b-[2px] border-black flex-shrink-0">
          <span
            className="tag-brutal text-xs"
            style={{ background: accent }}
          >
            {card.type.toUpperCase()}
          </span>
          <button
            onClick={onClose}
            className="w-9 h-9 border-[3px] border-black bg-black text-acid-yellow font-brutal flex items-center justify-center hover:bg-hot-pink transition-colors flex-shrink-0"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto overscroll-contain flex-1 px-4 py-4 space-y-4">
          {/* Title */}
          {card.title && (
            <h2 className="font-brutal text-xl sm:text-2xl leading-tight">{card.title}</h2>
          )}

          {/* Image */}
          {card.type === 'image' && card.imageUrl && (
            <div className="border-[3px] border-black overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={card.imageUrl}
                alt={card.caption ?? 'Card image'}
                className="w-full h-auto"
              />
            </div>
          )}

          {/* Video */}
          {card.type === 'video' && card.videoUrl && (
            <div className="border-[3px] border-black overflow-hidden bg-black">
              <video src={card.videoUrl} controls className="w-full max-h-72 object-contain" />
            </div>
          )}

          {/* Audio */}
          {card.type === 'audio' && card.audioUrl && (
            <div className="border-[3px] border-black bg-[#1A1A1A] p-4">
              <audio src={card.audioUrl} controls className="w-full" />
            </div>
          )}

          {/* Content */}
          <div
            className={`text-base leading-relaxed ${
              card.type === 'quote'
                ? 'text-lg italic font-mono border-l-4 border-black pl-4 py-1'
                : ''
            }`}
          >
            {card.type === 'quote' ? `"${card.content}"` : card.content}
          </div>

          {/* Caption */}
          {card.caption && (
            <p className="text-sm opacity-60">{card.caption}</p>
          )}

          {/* Linked friends */}
          {linkedFriends.length > 0 && (
            <div>
              <p className="font-brutal text-xs uppercase tracking-wider mb-2 opacity-50">
                Suspects Involved
              </p>
              <div className="flex flex-wrap gap-2">
                {linkedFriends.map((f) => (
                  <Link
                    key={f.id}
                    href={`/friends/${f.id}`}
                    className="flex items-center gap-1.5 px-3 py-2 border-[2px] border-black font-bold text-sm hover:opacity-80 transition-opacity active:scale-95"
                    style={{ background: f.signatureColor }}
                    onClick={onClose}
                  >
                    {f.avatarUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={f.avatarUrl}
                        alt={f.name}
                        className="w-5 h-5 rounded-full border border-black object-cover"
                      />
                    )}
                    {f.nickname || f.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Reactions */}
          <div className="border-t-[2px] border-black pt-4">
            <p className="font-brutal text-xs uppercase tracking-wider mb-3 opacity-50">
              Vibe Check
            </p>
            <EmojiReactions cardId={card.id} reactions={card.reactions} />
          </div>

          {/* Bottom spacer for safe area */}
          <div style={{ height: 'env(safe-area-inset-bottom, 8px)' }} />
        </div>
      </div>
    </div>
  );
}
