import { ArrowLeftOutlined, LeftOutlined, ReloadOutlined, RightOutlined, SearchOutlined } from '@ant-design/icons';
import { Empty, Input, InputNumber, Spin } from 'antd';
import { useEffect, useState, type ReactNode } from 'react';

export interface Row {
  avatar: ReactNode;
  title: ReactNode;
  meta?: ReactNode; // small coloured line under the title (e.g. "INDIVIDUAL · Technician")
  preview?: ReactNode; // grey one-liner (last message, email…)
  time?: string;
  badge?: ReactNode; // unread-style bubble on the right
}

interface Props<T> {
  title: string;
  icon: ReactNode;
  items: T[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  getKey: (item: T) => string;
  renderRow: (item: T) => Row;
  renderDetail: (key: string, item: T | undefined) => ReactNode;
  onPage: (page: number, limit: number) => void;
  onRefresh: () => void;
  onSearch: (q: string) => void;
  searchPlaceholder?: string;
  chips?: { options: string[]; value: string; onChange: (v: string) => void };
  /** Extra controls under the chips (selects, buttons) */
  toolbar?: ReactNode;
  /** Buttons in the list header (e.g. "New") */
  actions?: ReactNode;
  /** Select this key instead of the first row (deep links, "new" forms) */
  selectedKey?: string | null;
  onSelect?: (key: string | null) => void;
  emptyText?: string;
}

/**
 * Chat-style master/detail workspace: list on the left, detail on the right.
 * The first row is selected automatically whenever the current selection isn't set.
 */
export default function MasterDetail<T>(props: Props<T>) {
  const { items, total, page, limit, loading, getKey, renderRow, renderDetail } = props;
  const [internal, setInternal] = useState<string | null>(null);
  const [mobileDetail, setMobileDetail] = useState(false);
  const controlled = props.selectedKey !== undefined;
  const selected = controlled ? props.selectedKey ?? null : internal;

  const select = (key: string | null, fromUser = false) => {
    if (controlled) props.onSelect?.(key);
    else setInternal(key);
    if (fromUser) setMobileDetail(true);
  };

  // Default: first row selected — also after a filter/search removes the current selection
  useEffect(() => {
    if (loading || !items.length) return;
    const missing = selected && !controlled && !items.some((i) => getKey(i) === selected);
    if (!selected || missing) select(getKey(items[0]));
  }, [loading, items, selected]);

  const from = total ? (page - 1) * limit + 1 : 0;
  const to = Math.min(total, page * limit);
  const lastPage = Math.max(1, Math.ceil(total / limit));
  const selectedItem = items.find((i) => getKey(i) === selected);

  return (
    <div className="flex h-[calc(100vh-4rem-2rem)] overflow-hidden rounded-2xl border border-black/5 bg-white shadow-soft md:h-[calc(100vh-4rem-3rem)]">
      {/* ——— List ——— */}
      <section className={`flex w-full shrink-0 flex-col border-r border-black/5 md:w-[330px] xl:w-[360px] ${mobileDetail ? 'hidden md:flex' : 'flex'}`}>
        <header className="border-b border-black/5 p-3">
          <div className="flex items-center gap-2">
            <span className="text-base text-terra-dark">{props.icon}</span>
            <h2 className="font-sans text-[14px] font-semibold text-char">{props.title}</h2>
            <span className="text-xs text-char/45">{from}–{to} of {total}</span>
            <span className="ml-auto flex items-center gap-1">
              <InputNumber size="small" min={5} max={100} value={limit} onChange={(v) => v && props.onPage(1, v)} className="w-14" aria-label="Rows per page" />
              <IconBtn label="Previous" disabled={page <= 1} onClick={() => props.onPage(page - 1, limit)}><LeftOutlined /></IconBtn>
              <IconBtn label="Next" disabled={page >= lastPage} onClick={() => props.onPage(page + 1, limit)}><RightOutlined /></IconBtn>
              <IconBtn label="Refresh" onClick={props.onRefresh}><ReloadOutlined spin={loading} /></IconBtn>
            </span>
          </div>
          {props.actions && <div className="mt-2 flex flex-wrap gap-2">{props.actions}</div>}
          <Input
            allowClear
            prefix={<SearchOutlined className="text-char/35" />}
            placeholder={props.searchPlaceholder ?? 'Search…'}
            className="mt-3 rounded-xl"
            onPressEnter={(e) => props.onSearch((e.target as HTMLInputElement).value)}
            onChange={(e) => !e.target.value && props.onSearch('')}
          />
          {props.chips && (
            <div className="no-scrollbar mt-2.5 flex gap-1.5 overflow-x-auto">
              {props.chips.options.map((c) => (
                <button
                  key={c}
                  onClick={() => props.chips!.onChange(c)}
                  className={`shrink-0 cursor-pointer rounded-full border-0 px-3 py-1 text-xs font-medium transition ${
                    props.chips!.value === c ? 'bg-terra-dark text-white' : 'bg-[#f3f1ee] text-char/70 hover:bg-terra-soft'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
          {props.toolbar && <div className="mt-2.5 flex flex-wrap gap-2">{props.toolbar}</div>}
        </header>

        <div className="thin-scroll relative flex-1 overflow-y-auto">
          {loading && !items.length && <div className="flex justify-center p-10"><Spin /></div>}
          {!loading && !items.length && <Empty className="mt-12" description={props.emptyText ?? 'Nothing here yet'} />}
          <ul className="m-0 list-none p-0">
            {items.map((item) => {
              const key = getKey(item);
              const r = renderRow(item);
              const active = key === selected;
              return (
                <li key={key}>
                  <button
                    onClick={() => select(key, true)}
                    className={`flex w-full cursor-pointer items-start gap-3 border-0 border-b border-black/[0.04] px-3.5 py-3 text-left transition ${
                      active ? 'bg-terra-soft' : 'bg-transparent hover:bg-[#faf7f5]'
                    }`}
                  >
                    <span className="relative shrink-0">
                      {r.avatar}
                      {active && <span className="absolute -left-3.5 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r bg-terra-dark" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-[13.5px] font-medium text-char">{r.title}</span>
                        {r.time && <span className="shrink-0 text-[11px] text-char/40">{r.time}</span>}
                      </span>
                      {r.meta && <span className="block truncate text-[11px] font-medium uppercase tracking-wide text-cocoa-dark">{r.meta}</span>}
                      <span className="mt-0.5 flex items-center justify-between gap-2">
                        <span className="truncate text-[12px] text-char/55">{r.preview}</span>
                        {r.badge !== undefined && r.badge !== null && r.badge !== false && <span className="shrink-0">{r.badge}</span>}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ——— Detail ——— */}
      <section className={`min-w-0 flex-1 flex-col bg-[#faf8f6] ${mobileDetail ? 'flex' : 'hidden md:flex'}`}>
        <button
          onClick={() => setMobileDetail(false)}
          className="flex cursor-pointer items-center gap-2 border-0 border-b border-black/5 bg-white px-4 py-3 text-sm text-char md:hidden"
        >
          <ArrowLeftOutlined /> Back to list
        </button>
        {selected ? (
          <div key={selected} className="thin-scroll flex min-h-0 flex-1 flex-col overflow-y-auto">
            {renderDetail(selected, selectedItem)}
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-terra-soft text-2xl text-terra-dark">{props.icon}</span>
            <p className="mt-3 font-medium text-char">Select an item</p>
            <p className="text-sm text-char/50">Pick something from the list to see details.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function IconBtn({ children, label, onClick, disabled }: { children: ReactNode; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-xs text-char/60 hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}

/** Shared pieces for detail panes */
export function DetailHeader({ avatar, title, subtitle, extra }: { avatar: ReactNode; title: ReactNode; subtitle?: ReactNode; extra?: ReactNode }) {
  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-black/5 bg-white px-5 py-3.5">
      {avatar}
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-sans text-base font-semibold text-char">{title}</h3>
        {subtitle && <p className="truncate text-xs text-char/50">{subtitle}</p>}
      </div>
      {extra && <div className="flex flex-wrap items-center gap-2">{extra}</div>}
    </div>
  );
}

export function Pane({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl bg-white p-4 shadow-soft ${className}`}>{children}</div>;
}

export const initials = (s?: string) =>
  (s ?? '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

export function Avatar({ text, src, tone = 'terra', size = 44 }: { text?: string; src?: string; tone?: 'terra' | 'cocoa' | 'gold' | 'char'; size?: number }) {
  const tones = { terra: 'bg-terra-soft text-terra-dark', cocoa: 'bg-cocoa-light text-cocoa-dark', gold: 'bg-[#F6ECDD] text-gold', char: 'bg-char/10 text-char' };
  return src ? (
    <img src={src} alt="" style={{ width: size, height: size }} className="rounded-full object-cover" />
  ) : (
    <span style={{ width: size, height: size }} className={`flex items-center justify-center rounded-full text-sm font-semibold ${tones[tone]}`}>
      {initials(text)}
    </span>
  );
}

export const Dot = ({ n }: { n: number }) => (
  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-terra-dark px-1.5 text-[11px] font-semibold text-white">{n}</span>
);

/** Spreads a useList() result into MasterDetail's list props */
export function fromList<T>(list: {
  items: T[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  goTo: (page: number, limit: number) => void;
  reload: () => void;
  update: (p: Record<string, unknown>) => void;
}) {
  return {
    items: list.items,
    total: list.total,
    page: list.page,
    limit: list.limit,
    loading: list.loading,
    onPage: list.goTo,
    onRefresh: list.reload,
    onSearch: (q: string) => list.update({ q: q || undefined }),
  };
}
