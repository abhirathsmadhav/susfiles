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
  friendIds?: string[];
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
  spaceId?: string;        // ID of the private space this belongs to
  mediaAspectRatio?: 'original' | '1:1' | '4:3' | '16:9' | '9:16';
}

export interface Space {
  id: string;
  name: string;
  description?: string;
  adminId: string;
  memberIds: string[];
  backgroundColor: string; // E.g., '#F0EDE0', '#111111', etc.
  gridStyle: 'none' | 'dots' | 'grid';
  createdAt: string;
}

export type FriendInput = Omit<Friend, 'id' | 'createdAt'>;
export type CardInput = Omit<Card, 'id' | 'createdAt' | 'createdBy' | 'reactions'>;
export type SpaceInput = Omit<Space, 'id' | 'createdAt'>;

export interface SpaceInvitation {
  id: string;
  spaceId: string;
  spaceName: string;
  fromUid: string;
  toUid: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}
