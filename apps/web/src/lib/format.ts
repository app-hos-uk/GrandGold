/**
 * Format dates for display - relative ("2 hours ago") or absolute
 */
export function formatRelativeDate(date: Date | string | number): string {
  if (!date) return '—';
  try {
    const d = typeof date === 'object' && 'getTime' in date ? date : new Date(date);
    if (isNaN(d.getTime())) return '—';
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
    if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
    if (diffDay < 30) return `${Math.floor(diffDay / 7)} week${Math.floor(diffDay / 7) === 1 ? '' : 's'} ago`;
    return d.toLocaleDateString();
  } catch {
    return '—';
  }
}

export function formatDateShort(date: Date | string | number): string {
  if (!date) return '—';
  try {
    const d = typeof date === 'object' && 'getTime' in date ? date : new Date(date);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '—';
  }
}

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}
