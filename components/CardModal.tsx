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
  const modalRef = useRef<HTMLDivElement>(null);
  const accent = getAccentColor(card, friends);
  const linkedFriends = friends.filter((f) => card.linkedFriendIds.includes(f.id));

  // Close on ESC
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div
        ref={modalRef}
        className="relative w-full max-w-lg border-[4px] border-black bg-white animate-slide-up max-h-[90vh] flex flex-col"
        style={{ boxShadow: `8px 8px 0px ${accent}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Accent header */}
        <div className="h-4 shrink-0" style={{ background: accent }} />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 border-[3px] border-black bg-black text-acid-yellow font-brutal flex items-center justify-center hover:bg-hot-pink transition-colors z-10"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="p-6 overflow-y-auto">
          {/* Type badge */}
          <div className="mb-3">
            <span
              className="tag-brutal text-xs"
              style={{ background: accent }}
            >
              {card.type.toUpperCase()}
            </span>
          </div>

          {/* Title */}
          {card.title && (
            <h2 className="font-brutal text-2xl leading-tight mb-3">{card.title}</h2>
          )}

          {/* Image */}
          {card.type === 'image' && card.imageUrl && (
            <div className="mb-4 border-[3px] border-black overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={card.imageUrl}
                alt={card.caption ?? 'Card image'}
                className="w-full h-auto"
              />
            </div>
          )}

          {/* Content */}
          <div
            className={`text-base leading-relaxed mb-4 ${card.type === 'quote' ? 'text-lg italic font-mono border-l-4 border-black pl-4' : ''}`}
          >
            {card.type === 'quote' ? `"${card.content}"` : card.content}
          </div>

          {/* Caption */}
          {card.caption && (
            <p className="text-sm opacity-70 mb-4">{card.caption}</p>
          )}

          {/* Linked friends */}
          {linkedFriends.length > 0 && (
            <div className="mb-5">
              <p className="font-brutal text-xs uppercase tracking-wider mb-2 opacity-60">
                Suspects Involved
              </p>
              <div className="flex flex-wrap gap-2">
                {linkedFriends.map((f) => (
                  <Link
                    key={f.id}
                    href={`/friends/${f.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 border-[2px] border-black font-bold text-sm hover:opacity-80 transition-opacity"
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
            <p className="font-brutal text-xs uppercase tracking-wider mb-3 opacity-60">
              Vibe Check
            </p>
            <EmojiReactions cardId={card.id} reactions={card.reactions} />
          </div>
        </div>
      </div>
    </div>
  );
}
