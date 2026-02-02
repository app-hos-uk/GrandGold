'use client';

import { SlidersHorizontal } from 'lucide-react';

export interface ARAdjustment {
  offsetX: number;
  offsetY: number;
  scale: number;
}

interface ARAdjustmentControlsProps {
  adjustment: ARAdjustment;
  onChange: (adj: ARAdjustment) => void;
  category: 'earrings' | 'necklace' | 'ring';
  className?: string;
}

export function ARAdjustmentControls({
  adjustment,
  onChange,
  category,
  className = '',
}: ARAdjustmentControlsProps) {
  return (
    <div className={`bg-black/60 rounded-xl p-4 ${className}`}>
      <div className="flex items-center gap-2 text-white text-sm font-medium mb-3">
        <SlidersHorizontal className="w-4 h-4" />
        Adjust {category}
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-300 block mb-1">Scale</label>
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.05"
            value={adjustment.scale}
            onChange={(e) =>
              onChange({ ...adjustment, scale: parseFloat(e.target.value) })
            }
            className="w-full accent-gold-500"
          />
        </div>
        <div>
          <label className="text-xs text-gray-300 block mb-1">Position X</label>
          <input
            type="range"
            min="-50"
            max="50"
            value={adjustment.offsetX}
            onChange={(e) =>
              onChange({ ...adjustment, offsetX: parseInt(e.target.value, 10) })
            }
            className="w-full accent-gold-500"
          />
        </div>
        <div>
          <label className="text-xs text-gray-300 block mb-1">Position Y</label>
          <input
            type="range"
            min="-50"
            max="50"
            value={adjustment.offsetY}
            onChange={(e) =>
              onChange({ ...adjustment, offsetY: parseInt(e.target.value, 10) })
            }
            className="w-full accent-gold-500"
          />
        </div>
        <button
          type="button"
          onClick={() => onChange({ offsetX: 0, offsetY: 0, scale: 1 })}
          className="w-full py-1.5 text-xs text-gold-400 hover:text-gold-300"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
