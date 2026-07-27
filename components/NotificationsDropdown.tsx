'use client';

import { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { AppNotification } from '@/types';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationsDropdown() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(db, 'notifications'),
      where('toUid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification)));
    });

    return () => unsub();
  }, [user]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleOpen = async () => {
    setIsOpen(!isOpen);
    // Mark all as read when opening
    if (!isOpen && unreadCount > 0) {
      const batch = writeBatch(db);
      notifications.filter(n => !n.read).forEach(n => {
        batch.update(doc(db, 'notifications', n.id), { read: true });
      });
      await batch.commit();
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={handleOpen}
        className="relative p-2 hover:bg-black/5 transition-colors rounded-full"
      >
        <Bell className="w-6 h-6" strokeWidth={2.5} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-3 h-3 bg-hot-pink rounded-full border-2 border-[#F0EDE0]"></span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 top-full mt-2 w-72 md:w-80 panel-brutal bg-white z-[200] max-h-[70vh] overflow-y-auto"
            style={{ padding: '0' }}
          >
            <div className="p-3 border-b-[2px] border-black bg-acid-yellow flex justify-between items-center">
              <h3 className="font-brutal text-sm">NOTIFICATIONS</h3>
            </div>
            
            {notifications.length === 0 ? (
              <div className="p-6 text-center opacity-50 font-mono text-xs">
                No alerts on your radar.
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.slice(0, 50).map((n, i) => (
                  <div 
                    key={n.id} 
                    className={`p-3 text-sm font-mono leading-tight border-b-[2px] border-black hover:bg-black/5 transition-colors ${!n.read ? 'bg-acid-yellow/20' : ''} ${i === notifications.length - 1 ? 'border-b-0' : ''}`}
                  >
                    <span className="opacity-80">{n.message}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
