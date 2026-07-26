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

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onSearch(e.target.value);
  };

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
        placeholder="🔍 Search files..."
        className="input-brutal text-sm"
        style={{ minHeight: '44px' }}
      />

      {/* Suspect filter — horizontal scroll on mobile */}
      <div>
        <p className="font-brutal text-[10px] uppercase tracking-widest mb-1.5 opacity-50">Suspect</p>
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
          <button
            onClick={() => onFilterFriend(null)}
            className={`tag-brutal text-[11px] cursor-pointer flex-shrink-0 transition-all hover:-translate-y-0.5 ${
              selectedFriend === null ? 'bg-black text-white' : 'bg-off-white'
            }`}
          >
            ALL
          </button>
          {friends.map((f) => (
            <button
              key={f.id}
              onClick={() => onFilterFriend(selectedFriend === f.id ? null : f.id)}
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
