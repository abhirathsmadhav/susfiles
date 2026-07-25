'use client';

import { Friend, CardType } from '@/types';
import { useState } from 'react';

interface FilterBarProps {
  friends: Friend[];
  onFilterFriend: (id: string | null) => void;
  onSearch: (query: string) => void;
  onFilterType: (type: CardType | null) => void;
  selectedFriend: string | null;
  selectedType: CardType | null;
}

const CARD_TYPES: CardType[] = ['quote', 'convo', 'image', 'moment', 'text'];

const TYPE_ICONS: Record<CardType, string> = {
  quote: '💬',
  convo: '🗣️',
  image: '📸',
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
    <div className="border-[3px] border-black bg-white p-4" style={{ boxShadow: '4px 4px 0px #000' }}>
      {/* Search input */}
      <div className="mb-3">
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          placeholder="🔍 SEARCH THE FILES..."
          className="input-brutal w-full uppercase placeholder:font-brutal placeholder:text-sm placeholder:opacity-40"
          style={{ fontFamily: 'Archivo Black, sans-serif', fontSize: '0.85rem' }}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {/* Friend filter */}
        <div className="flex-1">
          <p className="font-brutal text-[10px] uppercase tracking-widest mb-1.5 opacity-60">
            Filter by Suspect
          </p>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => onFilterFriend(null)}
              className={`tag-brutal text-[11px] cursor-pointer transition-all hover:-translate-y-0.5 ${
                selectedFriend === null ? 'bg-black text-white' : 'bg-off-white'
              }`}
            >
              ALL
            </button>
            {friends.map((f) => (
              <button
                key={f.id}
                onClick={() => onFilterFriend(selectedFriend === f.id ? null : f.id)}
                className={`tag-brutal text-[11px] cursor-pointer transition-all hover:-translate-y-0.5 ${
                  selectedFriend === f.id ? 'ring-2 ring-black' : ''
                }`}
                style={{ background: f.signatureColor }}
              >
                {f.nickname || f.name}
              </button>
            ))}
          </div>
        </div>

        {/* Type filter */}
        <div>
          <p className="font-brutal text-[10px] uppercase tracking-widest mb-1.5 opacity-60">
            Filter by Type
          </p>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => onFilterType(null)}
              className={`tag-brutal text-[11px] cursor-pointer transition-all hover:-translate-y-0.5 ${
                selectedType === null ? 'bg-black text-white' : 'bg-off-white'
              }`}
            >
              ALL
            </button>
            {CARD_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => onFilterType(selectedType === type ? null : type)}
                className={`tag-brutal text-[11px] cursor-pointer transition-all hover:-translate-y-0.5 ${
                  selectedType === type ? 'bg-black text-white' : 'bg-off-white'
                }`}
              >
                {TYPE_ICONS[type]} {type.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
