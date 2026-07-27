'use client';

import { Friend, CardType } from '@/types';
import { useState } from 'react';
import { getContrastColor } from './FriendNode';

interface FilterBarProps {
  friends: Friend[];
  onFilterFriend: (id: string | null) => void;
  onSearch: (query: string) => void;
  onFilterType: (type: CardType | null) => void;
  selectedFriend: string | null;
  selectedType: CardType | null;
}

const CARD_TYPES: CardType[] = ['quote', 'convo', 'image', 'audio', 'video', 'moment', 'text'];

const TYPE_ICONS: Record<CardType, string> = {
  quote: '💬',
  convo: '🗣️',
  image: '📸',
  audio: '🎵',
  video: '🎥',
  moment: '⚡',
  text: '📝',
};

export default function FilterBar({
  friends,
  onFilterFriend,
  onSearch,
  onFilterType,
  selectedFriend,
  selectedType,
}: FilterBarProps) {
  const [query, setQuery] = useState('');
  const [recentIds, setRecentIds] = useState<string[]>([]);

  // Load recents on mount
  useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('recentSuspects');
        if (stored) setRecentIds(JSON.parse(stored));
      } catch (e) {}
    }
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onSearch(e.target.value);
  };

  const handleSelectFriend = (id: string | null) => {
    onFilterFriend(id);
    if (id) {
      setRecentIds((prev) => {
        const next = [id, ...prev.filter((x) => x !== id)].slice(0, 5);
        if (typeof window !== 'undefined') {
          localStorage.setItem('recentSuspects', JSON.stringify(next));
        }
        return next;
      });
    }
  };

  let displayedFriends = friends;
  if (query.trim()) {
    const q = query.toLowerCase();
    displayedFriends = friends.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.nickname && f.nickname.toLowerCase().includes(q))
    );
  } else {
    // Show selected, recents, and pad up to 5 if needed
    displayedFriends = friends.filter(
      (f) => selectedFriend === f.id || recentIds.includes(f.id)
    );
    if (displayedFriends.length < 5) {
      const needed = 5 - displayedFriends.length;
      const toAdd = friends.filter((f) => !displayedFriends.includes(f)).slice(0, needed);
      displayedFriends = [...displayedFriends, ...toAdd];
    }
  }

  return (
    <div
      className="border-[3px] border-black bg-white p-3 flex flex-col gap-3"
      style={{ boxShadow: '4px 4px 0px #000' }}
    >
      {/* Search */}
      <input
        type="text"
        value={query}
        onChange={handleSearch}
        placeholder="🔍 Search files or suspects..."
        className="input-brutal text-sm"
        style={{ minHeight: '44px' }}
      />

      {/* Suspect filter — horizontal scroll on mobile */}
      <div>
        <p className="font-brutal text-[10px] uppercase tracking-widest mb-1.5 opacity-50">Suspect</p>
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
          <button
            onClick={() => handleSelectFriend(null)}
            className={`tag-brutal text-[11px] cursor-pointer flex-shrink-0 transition-all hover:-translate-y-0.5 ${
              selectedFriend === null ? 'bg-black text-white' : 'bg-off-white'
            }`}
          >
            ALL
          </button>
          {displayedFriends.map((f) => (
            <button
              key={f.id}
              onClick={() => handleSelectFriend(selectedFriend === f.id ? null : f.id)}
              className={`tag-brutal text-[11px] cursor-pointer flex-shrink-0 transition-all hover:-translate-y-0.5 ${
                selectedFriend === f.id ? 'ring-2 ring-black' : ''
              }`}
              style={{ 
                background: f.signatureColor,
                color: getContrastColor(f.signatureColor || '#F5F500')
              }}
            >
              {f.nickname || f.name}
            </button>
          ))}
          {query.trim() && displayedFriends.length === 0 && (
            <span className="text-xs opacity-50 italic py-1 px-2">No suspects found</span>
          )}
        </div>
      </div>

      {/* Type filter — horizontal scroll on mobile */}
      <div>
        <p className="font-brutal text-[10px] uppercase tracking-widest mb-1.5 opacity-50">Type</p>
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
          <button
            onClick={() => onFilterType(null)}
            className={`tag-brutal text-[11px] cursor-pointer flex-shrink-0 transition-all hover:-translate-y-0.5 ${
              selectedType === null ? 'bg-black text-white' : 'bg-off-white'
            }`}
          >
            ALL
          </button>
          {CARD_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => onFilterType(selectedType === type ? null : type)}
              className={`tag-brutal text-[11px] cursor-pointer flex-shrink-0 transition-all hover:-translate-y-0.5 ${
                selectedType === type ? 'bg-black text-white' : 'bg-off-white'
              }`}
            >
              {TYPE_ICONS[type]} {type.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
