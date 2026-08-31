/**
 * Utility to ensure SANARCH IDs are always displayed with exactly two hyphens:
 * Format: SAN-{CC}-{PAYLOAD}
 * Examples: 
 *   - Primary:   SAN-IN-26X18P00IHC9E7ZP
 *   - Dependent: SAN-IN-26M05D01IHC9E7K3
 */
export function formatSanarchId(id: string | null | undefined): string {
  if (!id || id === '---' || id === '— — —' || id === '—') return id || '---';

  const clean = id.trim().toUpperCase();

  // If already has exactly 2 hyphens and starts with SAN-
  const parts = clean.split('-');
  if (parts.length === 3 && parts[0] === 'SAN') {
    return clean;
  }

  // If has more than 2 hyphens (e.g. SAN-IN-26-000001-A)
  if (parts.length > 3 && parts[0] === 'SAN') {
    return `${parts[0]}-${parts[1]}-${parts.slice(2).join('')}`;
  }

  // If no hyphens or malformed hyphens (e.g. SANIN26X18P00IHC9E7ZP)
  const raw = clean.replace(/[-\s]/g, '');
  if (raw.startsWith('SAN') && raw.length >= 5) {
    const prefix = raw.slice(0, 3);
    const country = raw.slice(3, 5);
    const rest = raw.slice(5);
    return `${prefix}-${country}-${rest}`;
  }

  return id;
}
