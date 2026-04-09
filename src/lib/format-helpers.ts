/**
 * Format volume in BBL/d for display.
 * >= 1,000,000 → "X.XX MM BBL/d"
 * >= 1,000     → "XXX,XXX BBL/d"
 * < 1,000      → "XXX BBL/d"
 */
export function formatVolume(bbl: number): string {
  if (bbl >= 1_000_000) {
    return `${(bbl / 1_000_000).toFixed(2)} MM BBL/d`;
  }
  return `${Math.round(bbl).toLocaleString()} BBL/d`;
}

/**
 * Format large aggregate volume totals.
 * >= 1,000,000,000 → "X.X B BBL/d"
 * >= 1,000,000     → "X.X MM BBL/d"
 * >= 1,000         → "XXX,XXX BBL/d"
 */
export function formatVolumeTotal(bbl: number): string {
  if (bbl >= 1_000_000_000) {
    return `${(bbl / 1_000_000_000).toFixed(1)} B BBL/d`;
  }
  if (bbl >= 1_000_000) {
    return `${(bbl / 1_000_000).toFixed(1)} MM BBL/d`;
  }
  return `${Math.round(bbl).toLocaleString()} BBL/d`;
}

/**
 * Format volume as a short number for stat card values (no unit suffix).
 * >= 1,000,000 → "X.X MM"
 * < 1,000,000  → "XXX,XXX"
 */
export function formatVolumeShort(bbl: number): string {
  if (bbl >= 1_000_000) {
    return `${(bbl / 1_000_000).toFixed(1)} MM`;
  }
  return Math.round(bbl).toLocaleString();
}
