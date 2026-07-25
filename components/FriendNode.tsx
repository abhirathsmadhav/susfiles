'use client';

import { Friend } from '@/types';
import Link from 'next/link';

interface FriendNodeProps {
  friend: Friend;
  x?: number;
  y?: number;
  isInline?: boolean;
  onClick?: () => void;
}

export default function FriendNode({ friend, x = 0, y = 0, isInline = false, onClick }: FriendNodeProps) {
  return (
    <div
      className={`${isInline ? 'relative' : 'absolute'} z-20 flex flex-col items-center gap-1 cursor-pointer group`}
      style={isInline ? {} : { left: x, top: y, transform: 'translate(-50%, -50%)' }}
      onClick={onClick}
    >
      <Link href={`/friends/${friend.id}`}>
        <div
          className="relative w-20 h-20 border-[3px] border-black overflow-hidden transition-all group-hover:-translate-y-1"
          style={{
            boxShadow: `5px 5px 0px ${friend.signatureColor}`,
            borderRadius: '0',
          }}
        >
          {friend.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={friend.avatarUrl}
              alt={friend.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center font-brutal text-2xl"
              style={{ background: friend.signatureColor }}
            >
              {friend.name.charAt(0)}
            </div>
          )}
        </div>
        <div
          className="px-2 py-0.5 border-[2px] border-black font-brutal text-[11px] uppercase text-center mt-1"
          style={{ background: friend.signatureColor }}
        >
          {friend.nickname || friend.name}
        </div>
      </Link>
    </div>
  );
}
