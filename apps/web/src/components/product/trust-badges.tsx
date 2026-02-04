'use client';

import { Shield, Award, FileCheck } from 'lucide-react';

export interface TrustBadgesProps {
  /** BIS hallmark (India) */
  bisHallmark?: boolean;
  /** IGI/GIA certificate for diamonds */
  certificate?: string;
  /** Certification IDs or names */
  certifications?: string[];
  /** Metal purity e.g. 22K, 18K */
  purity?: string;
  /** Verified seller badge */
  verifiedSeller?: boolean;
  className?: string;
}

export function TrustBadges({
  bisHallmark,
  certificate,
  certifications = [],
  purity,
  verifiedSeller,
  className = '',
}: TrustBadgesProps) {
  const items: { icon: typeof Shield; label: string; color: string }[] = [];

  if (bisHallmark) {
    items.push({
      icon: Award,
      label: 'BIS Hallmarked',
      color: 'text-amber-700 bg-amber-50 border-amber-200',
    });
  }
  if (certificate || certifications.length > 0) {
    items.push({
      icon: FileCheck,
      label: certificate || certifications[0] || 'Certified',
      color: 'text-blue-700 bg-blue-50 border-blue-200',
    });
  }
  if (purity) {
    items.push({
      icon: Shield,
      label: `${purity} Gold`,
      color: 'text-gold-700 bg-gold-50 border-gold-200',
    });
  }
  if (verifiedSeller) {
    items.push({
      icon: Shield,
      label: 'GrandGold Verified',
      color: 'text-green-700 bg-green-50 border-green-200',
    });
  }

  if (items.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {items.map((item, i) => (
        <span
          key={i}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${item.color}`}
        >
          <item.icon className="w-3.5 h-3.5" />
          {item.label}
        </span>
      ))}
    </div>
  );
}
