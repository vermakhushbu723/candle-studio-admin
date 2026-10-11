import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export const inr = (v: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);
export const compactInr = (v: number) => (v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : v >= 1000 ? `₹${(v / 1000).toFixed(1)}k` : `₹${v}`);
export const date = (d?: string | Date) => (d ? dayjs(d).format('DD MMM YYYY') : '—');
export const dateTime = (d?: string | Date) => (d ? dayjs(d).format('DD MMM YYYY, h:mm A') : '—');
export const ago = (d?: string | Date) => (d ? dayjs(d).fromNow() : '—');

/** Downloads rows as CSV (used for exports). */
export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

/** Chat-list style: time for today, "Yesterday", else short date */
export function shortTime(d?: string | Date) {
  if (!d) return '';
  const x = dayjs(d);
  if (x.isSame(dayjs(), 'day')) return x.format('hh:mm a');
  if (x.isSame(dayjs().subtract(1, 'day'), 'day')) return 'Yesterday';
  return x.format('DD MMM');
}
