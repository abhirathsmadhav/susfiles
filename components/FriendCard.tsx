'use client';

import { Friend } from '@/types';
import Link from 'next/link';
import { getContrastColor } from './FriendNode';

interface FriendCardProps {
  friend: Friend;
}

export default function FriendCard({ friend }: FriendCardProps) {
  return (
    <Link href={`/friends/${friend.id}`} className="block group">
      <div
        className="border-[3px] border-black bg-white overflow-hidden transition-all duration-100 group-hover:-translate-x-1 group-hover:-translate-y-1 group-active:translate-x-0 group-active:translate-y-0"
        style={{ boxShadow: `5px 5px 0px ${friend.signatureColor}` }}
      >
        {/* Color accent bar */}
        <div className="h-2.5 w-full" style={{ background: friend.signatureColor }} />

        <div className="p-3 flex items-center gap-3 sm:flex-col sm:items-center sm:text-center sm:gap-3 sm:p-4">
          {/* Avatar */}
          <div
            className="relative w-14 h-14 sm:w-20 sm:h-20 border-[3px] border-black overflow-hidden flex-shrink-0"
            style={{ boxShadow: `3px 3px 0px ${friend.signatureColor}` }}
          >
            {friend.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={friend.avatarUrl}
                alt={friend.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                loading="lazy"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center font-brutal text-2xl sm:text-3xl"
                style={{ 
                  background: friend.signatureColor,
                  color: getContrastColor(friend.signatureColor || '#F5F500')
                }}
              >
                {friend.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Text info */}
          <div className="flex-1 sm:flex-none min-w-0">
            <h3 className="font-brutal text-base sm:text-lg leading-tight truncate">{friend.name}</h3>
            {friend.nickname && (
              <p className="text-xs font-bold uppercase tracking-widest opacity-50 truncate">
                aka {friend.nickname}
              </p>
            )}
            {friend.tagline && (
              <p
                className="text-xs italic leading-snug mt-1 line-clamp-2 sm:border-t-[2px] sm:border-black sm:pt-2 sm:mt-2 opacity-70"
                style={{ fontFamily: 'Space Mono, monospace' }}
              >
                &ldquo;{friend.tagline}&rdquo;
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-center py-2 border-t-[2px] border-black font-brutal text-xs uppercase tracking-wider"
          style={{ 
            background: friend.signatureColor,
            color: getContrastColor(friend.signatureColor || '#F5F500')
          }}
        >
          VIEW FILE →
        </div>
      </div>
    </Link>
  );
}
