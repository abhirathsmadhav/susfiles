'use client';

import { Friend } from '@/types';
import Link from 'next/link';

interface FriendCardProps {
  friend: Friend;
}

export default function FriendCard({ friend }: FriendCardProps) {
  return (
    <Link href={`/friends/${friend.id}`} className="block group">
      <div
        className="border-[3px] border-black bg-white p-0 overflow-hidden transition-all group-hover:-translate-x-1 group-hover:-translate-y-1"
        style={{ boxShadow: `6px 6px 0px ${friend.signatureColor}` }}
      >
        {/* Color header */}
        <div className="h-3 w-full" style={{ background: friend.signatureColor }} />

        <div className="p-4 flex flex-col items-center text-center gap-3">
          {/* Avatar */}
          <div
            className="relative w-24 h-24 border-[3px] border-black overflow-hidden rounded-none"
            style={{ boxShadow: `4px 4px 0px ${friend.signatureColor}` }}
          >
            {friend.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={friend.avatarUrl}
                alt={friend.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center font-brutal text-3xl"
                style={{ background: friend.signatureColor }}
              >
                {friend.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Name */}
          <div>
            <h3 className="font-brutal text-lg leading-tight">{friend.name}</h3>
            {friend.nickname && (
              <p className="text-xs font-bold uppercase tracking-widest opacity-60">
                aka {friend.nickname}
              </p>
            )}
          </div>

          {/* Tagline */}
          <p
            className="text-sm italic leading-snug border-t-[2px] border-black pt-2 w-full"
            style={{ fontFamily: 'Space Mono, monospace' }}
          >
            "{friend.tagline}"
          </p>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-center py-2 border-t-[2px] border-black font-brutal text-xs uppercase tracking-wider"
          style={{ background: friend.signatureColor }}
        >
          VIEW FILE →
        </div>
      </div>
    </Link>
  );
}
