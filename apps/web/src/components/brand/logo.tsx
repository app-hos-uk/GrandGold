'use client';

import { useState } from 'react';
import Link from 'next/link';

interface LogoProps {
  /** Height class (e.g. h-8, h-10, h-14) */
  className?: string;
  /** Link href; if not set, renders a div */
  href?: string;
  /** For dark backgrounds (e.g. footer, admin sidebar) */
  variant?: 'light' | 'dark';
}

const LOGO_LIGHT = '/logo.svg';
const LOGO_DARK = '/logo-dark.svg';

export function Logo({ className = 'h-10 w-auto', href, variant = 'light' }: LogoProps) {
  const [failed, setFailed] = useState(false);

  const textClass = variant === 'dark'
    ? 'font-display font-semibold text-white'
    : 'font-display font-semibold text-gray-900';

  const goldClass = variant === 'dark' ? 'text-gold-400' : 'text-gold-500';

  const handleError = () => setFailed(true);

  const logoSrc = variant === 'dark' ? LOGO_DARK : LOGO_LIGHT;

  const content = failed ? (
    <span className={`${textClass} ${className}`}>
      The Grand <span className={goldClass}>Gold</span>
    </span>
  ) : (
    <img
      src={logoSrc}
      alt="The Grand Gold"
      className={`object-contain ${className}`}
      onError={handleError}
    />
  );

  if (href) {
    return (
      <Link href={href} className="flex items-center">
        {content}
      </Link>
    );
  }
  return <div className="flex items-center">{content}</div>;
}
