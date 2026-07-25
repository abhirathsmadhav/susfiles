'use client';

import { useState, useRef, useEffect } from 'react';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Reactions } from '@/types';
import toast from 'react-hot-toast';
import JSConfetti from 'js-confetti';

interface EmojiReactionsProps {
  cardId: string;
  reactions: Reactions;
}

const EMOJIS: (keyof Reactions)[] = ['💀', '🔥', '😭', '🤡'];

const LABELS: Record<keyof Reactions, string> = {
  '💀': 'DEAD',
  '🔥': 'FIRE',
  '😭': 'CRYING',
  '🤡': 'CLOWNED',
};

export default function EmojiReactions({ cardId, reactions }: EmojiReactionsProps) {
  const [localReactions, setLocalReactions] = useState<Reactions>({ ...reactions });
  const [reacted, setReacted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<string | null>(null);
  
  // Store the js-confetti instance so we don't recreate it every time
  const confettiRef = useRef<JSConfetti | null>(null);
  useEffect(() => {
    confettiRef.current = new JSConfetti();
  }, []);

  const handleReact = async (emoji: keyof Reactions) => {
    if (reacted.has(emoji)) {
      toast('Already reacted with ' + emoji, { icon: '🚫' });
      return;
    }
    setLoading(emoji);
    try {
      const ref = doc(db, 'cards', cardId);
      await updateDoc(ref, {
        [`reactions.${emoji}`]: increment(1),
      });
      setLocalReactions((prev) => ({ ...prev, [emoji]: (prev[emoji] ?? 0) + 1 }));
      setReacted((prev) => new Set([...prev, emoji]));
      
      // Rain emojis! 🌧️
      if (confettiRef.current) {
        confettiRef.current.addConfetti({
          emojis: [emoji],
          emojiSize: 50,
          confettiNumber: 40,
        });
      }
    } catch {
      toast.error('Reaction failed!');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => handleReact(emoji)}
          disabled={loading === emoji}
          className={`flex items-center gap-1.5 px-3 py-2 border-[2px] border-black font-bold text-sm transition-all ${
            reacted.has(emoji)
              ? 'bg-acid-yellow shadow-brutal-pressed translate-x-1 translate-y-1'
              : 'bg-white hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-sm'
          }`}
          style={reacted.has(emoji) ? {} : { boxShadow: '3px 3px 0px #000' }}
        >
          <span className="text-lg leading-none">{emoji}</span>
          <span className="text-xs font-brutal">
            {LABELS[emoji]} {localReactions[emoji] > 0 && `· ${localReactions[emoji]}`}
          </span>
        </button>
      ))}
    </div>
  );
}
