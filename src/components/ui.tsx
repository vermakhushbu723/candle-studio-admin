import { Tag } from 'antd';
import type { ReactNode } from 'react';
import { statusColor } from '@/config/theme';

export function PageTitle({ title, subtitle, extra }: { title: string; subtitle?: string; extra?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl md:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-char/55">{subtitle}</p>}
      </div>
      {extra && <div className="flex flex-wrap gap-2">{extra}</div>}
    </div>
  );
}

export function StatusTag({ status }: { status: string }) {
  return <Tag color={statusColor[status] ?? 'default'} className="m-0 rounded-full px-2.5">{status}</Tag>;
}

export function StatCard({ label, value, icon, tone = 'terra', hint }: { label: string; value: ReactNode; icon: ReactNode; tone?: 'terra' | 'cocoa' | 'gold' | 'char'; hint?: ReactNode }) {
  const tones = {
    terra: 'bg-terra-soft text-terra-dark',
    cocoa: 'bg-cocoa-light text-cocoa-dark',
    gold: 'bg-[#F6ECDD] text-gold',
    char: 'bg-char/5 text-char',
  };
  return (
    <div className="panel flex items-start justify-between gap-3 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-char/50">{label}</p>
        <p className="mt-2 truncate text-2xl font-semibold text-char">{value}</p>
        {hint && <p className="mt-1 text-xs text-char/50">{hint}</p>}
      </div>
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg ${tones[tone]}`}>{icon}</span>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-char/45">{label}</p>
      <div className="mt-0.5 text-sm text-char">{children || '—'}</div>
    </div>
  );
}
