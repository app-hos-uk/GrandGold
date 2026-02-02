'use client';

import { Share2 } from 'lucide-react';

interface ARShareProps {
  imageDataUrl: string;
  productName: string;
  onShare?: () => void;
}

export function ARShare({ imageDataUrl, productName, onShare }: ARShareProps) {
  const handleShare = async () => {
    try {
      if (navigator.share) {
        const blob = await (await fetch(imageDataUrl)).blob();
        const file = new File([blob], 'ar-tryon.png', { type: 'image/png' });
        await navigator.share({
          title: `My ${productName} try-on - GrandGold`,
          text: `Check out how this looks on me! Try it yourself at GrandGold.`,
          files: [file],
        });
      } else {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
          `Check out my ${productName} try-on! ${typeof window !== 'undefined' ? window.location.href : ''}`
        )}`;
        window.open(whatsappUrl, '_blank');
      }
      onShare?.();
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        const instagramUrl = 'https://www.instagram.com/';
        window.open(instagramUrl, '_blank');
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className="p-3 bg-black/50 backdrop-blur-sm rounded-lg hover:bg-black/70 transition-colors"
      title="Share"
    >
      <Share2 className="w-5 h-5 text-white" />
    </button>
  );
}
