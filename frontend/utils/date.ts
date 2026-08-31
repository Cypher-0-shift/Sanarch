/**
 * Comprehensive Date parsing and formatting utility.
 * Safely handles:
 * - Date instances
 * - Firestore Timestamp objects (.toDate(), { seconds, nanoseconds }, { _seconds, _nanoseconds })
 * - ISO date strings ('2026-08-20T18:41:00Z')
 * - Date-only strings ('2026-08-20', '2026/08/20')
 * - Number timestamps (milliseconds or seconds)
 * - Null / undefined / invalid values without ever throwing or returning "Invalid Date"
 */

export function parseDate(rawDate: any): Date | null {
  if (rawDate === null || rawDate === undefined || rawDate === '') {
    return null;
  }

  // 1. Date instance
  if (rawDate instanceof Date) {
    return isNaN(rawDate.getTime()) ? null : rawDate;
  }

  // 2. Firestore Timestamp instance (with .toDate() method)
  if (typeof rawDate?.toDate === 'function') {
    try {
      const d = rawDate.toDate();
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  }

  // 3. Serialized Firestore Timestamp object ({ seconds, nanoseconds } or { _seconds, _nanoseconds })
  if (typeof rawDate === 'object') {
    const secs = rawDate.seconds ?? rawDate._seconds;
    if (typeof secs === 'number') {
      const nanos = rawDate.nanoseconds ?? rawDate._nanoseconds ?? 0;
      const d = new Date(secs * 1000 + Math.floor(nanos / 1000000));
      return isNaN(d.getTime()) ? null : d;
    }
  }

  // 4. Numeric timestamp (milliseconds or seconds)
  if (typeof rawDate === 'number') {
    if (isNaN(rawDate)) return null;
    // If it's in seconds (e.g. 10 digits like 1715000000), convert to ms
    const ms = rawDate < 10000000000 ? rawDate * 1000 : rawDate;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }

  // 5. String parsing
  if (typeof rawDate === 'string') {
    const trimmed = rawDate.trim();
    if (!trimmed || trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'undefined') {
      return null;
    }

    // Check for YYYY-MM-DD or YYYY/MM/DD (date only, avoid UTC day-shift)
    const ymdMatch = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/.exec(trimmed);
    if (ymdMatch) {
      const year = parseInt(ymdMatch[1], 10);
      const month = parseInt(ymdMatch[2], 10) - 1;
      const day = parseInt(ymdMatch[3], 10);
      // Check if time part exists
      if (trimmed.length === 10) {
        const d = new Date(year, month, day);
        return isNaN(d.getTime()) ? null : d;
      }
    }

    // Check for DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/.exec(trimmed);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const month = parseInt(dmyMatch[2], 10) - 1;
      const year = parseInt(dmyMatch[3], 10);
      const d = new Date(year, month, day);
      return isNaN(d.getTime()) ? null : d;
    }

    // General ISO / string parser
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

/**
 * Format a date safely into a localized string.
 * Never returns "Invalid Date".
 */
export function formatDate(
  rawDate: any,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' },
  fallback = '—'
): string {
  const d = parseDate(rawDate);
  if (!d) return fallback;
  try {
    const result = d.toLocaleDateString('en-US', options);
    return result === 'Invalid Date' ? fallback : result;
  } catch {
    return fallback;
  }
}

/**
 * Format short date (e.g. "Aug 20, 2026")
 */
export function formatDateShort(rawDate: any, fallback = '—'): string {
  return formatDate(rawDate, { month: 'short', day: 'numeric', year: 'numeric' }, fallback);
}

/**
 * Format month + day only (e.g. "Aug 20")
 */
export function formatDateMonthDay(rawDate: any, fallback = '—'): string {
  return formatDate(rawDate, { month: 'short', day: 'numeric' }, fallback);
}

/**
 * Format relative time (e.g. "Just now", "5m ago", "2h ago", "Yesterday", "3d ago", "Aug 20")
 */
export function formatRelativeTime(rawDate: any, fallback = ''): string {
  const date = parseDate(rawDate);
  if (!date) return fallback;

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date, { month: 'short', day: 'numeric' }, fallback);
}

/**
 * Format full date & time (e.g. "Aug 20, 2026, 6:41 PM")
 */
export function formatFullDateTime(rawDate: any, fallback = ''): string {
  const date = parseDate(rawDate);
  if (!date) return fallback;

  try {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return fallback;
  }
}
