// ============================================================
// The Sus Files — Shared TypeScript Types
// ============================================================

export type CardType = 'quote' | 'convo' | 'image' | 'audio' | 'video' | 'moment' | 'text';

export type UserRole = 'user' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  username?: string;
  callSign?: string;
  avatarUrl?: string;
  signatureColor?: string;
  role: UserRole;
  createdAt: string;
}

export interface Friend {
  id: string;
  name: string;
  nickname: string;
  avatarUrl: string;
  signatureColor: string; // hex e.g. "#FF3E9A"
  tagline: string;        // short roasty one-liner
  createdAt: string;
  createdBy?: string;     // uid of the user who created this suspect
}

export interface CardPosition {
  x: number | 'auto';
  y: number | 'auto';
  rotation: number; // degrees, e.g. -6 to +6
}

export interface Reactions {
  '💀': number;
  '🔥': number;
  '😭': number;
  '🤡': number;
}

export interface Card {
  id: string;
  type: CardType;
  title?: string;
  content: string;
  imageUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
  caption?: string;
  linkedFriendIds: string[];
  color?: string;          // accent override hex
  position: CardPosition;
  reactions: Reactions;
  createdAt: string;
  createdBy: string;
}

// For create/update forms — omits server-generated fields
export type FriendInput = Omit<Friend, 'id' | 'createdAt'>;
export type CardInput = Omit<Card, 'id' | 'createdAt' | 'createdBy' | 'reactions'>;
