'use client';

import { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';

interface ProactiveChatProps {
  onOpen: () => void;
  itemCount: number;
  isChatOpen: boolean;
}

/** Shows proactive chat prompt when user has cart items and has been idle */
export function ProactiveChat({ onOpen, itemCount, isChatOpen }: ProactiveChatProps) {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isChatOpen || dismissed || itemCount === 0) {
      setShow(false);
      return;
    }
    const timer = setTimeout(() => setShow(true), 45000); // 45 seconds
    return () => clearTimeout(timer);
  }, [itemCount, isChatOpen, dismissed]);

  if (!show) return null;

  return (
    <div className="fixed bottom-24 right-6 z-40 animate-in fade-in slide-in-from-bottom-2">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 max-w-[280px]">
        <p className="text-sm text-gray-700 mb-3">
          Need help with your cart? Chat with us for instant answers.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              onOpen();
              setShow(false);
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-gold-500 hover:bg-gold-600 text-white text-sm font-medium rounded-lg"
          >
            <MessageCircle className="w-4 h-4" />
            Chat now
          </button>
          <button
            onClick={() => {
              setDismissed(true);
              setShow(false);
            }}
            className="py-2 px-3 text-gray-500 hover:text-gray-700 text-sm"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
