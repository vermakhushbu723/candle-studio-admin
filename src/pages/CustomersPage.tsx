import { DownloadOutlined, MailOutlined, PhoneOutlined, TeamOutlined, WhatsAppOutlined } from '@ant-design/icons';
import { Button, Skeleton, Switch, Table, message } from 'antd';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api/client';
import type { Customer } from '@/api/types';
import MasterDetail, { Avatar, DetailHeader, Pane, fromList } from '@/components/MasterDetail';
import { Field, StatCard, StatusTag } from '@/components/ui';
import { useList } from '@/hooks/useList';
import { ago, date, downloadCsv, inr, shortTime } from '@/utils/format';

interface Detail {
  customer: Customer;
  stats: { orders: number; spent: number; lastOrder: string | null };
  orders: { id: string; total: number; status: string; date: string; items: number }[];
  addresses: { line1: string; city: string; state: string; pincode: string; name?: string; phone?: string; usedAt: string }[];
}

const LOGIN: Record<string, string> = { phone: 'Mobile + OTP', google: 'Google', password: 'Password' };

export default function CustomersPage() {
  const list = useList<Customer>('/customers');

  return (
    <MasterDetail<Customer>
      title="Customers"
      icon={<TeamOutlined />}
      {...fromList(list)}
      getKey={(c) => c._id}
      searchPlaceholder="Search name, email or phone…"
      actions={
        <Button
          size="small"
          icon={<DownloadOutlined />}
          onClick={() => downloadCsv('customers.csv', list.items.map((c) => ({ name: c.name, email: c.email, phone: c.phone, orders: c.orders, spent: c.spent, joined: date(c.createdAt) })))}
        >
          Export CSV
        </Button>
      }
      renderRow={(c) => ({
        avatar: <Avatar text={c.name} tone={c.isBlocked ? 'char' : 'cocoa'} />,
        title: c.name,
        meta: `${c.orders} orders · ${inr(c.spent)}${c.isBlocked ? ' · blocked' : ''}`,
        preview: [c.phone && `+91 ${c.phone}`, c.email].filter(Boolean).join(' · ') || '—',
        time: shortTime(c.lastOrder ?? c.createdAt),
      })}
      renderDetail={(key) => <CustomerDetail id={key} onChanged={list.reload} />}
    />
  );
}

function CustomerDetail({ id, onChanged }: { id: string; onChanged: () => void }) {
  const [d, setD] = useState<Detail | null>(null);
  const load = () => api<Detail>(`/customers/${id}`).then(setD).catch((e) => message.error(e.message));
  useEffect(() => {
    load();
  }, [id]);

  if (!d) return <div className="p-6"><Skeleton active avatar paragraph={{ rows: 8 }} /></div>;
  const c = d.customer;

  const block = async (isBlocked: boolean) => {
    try {
      await api(`/customers/${c._id}/block`, { method: 'PATCH', body: { isBlocked } });
      message.success(isBlocked ? 'Customer blocked — they can no longer log in' : 'Customer unblocked');
      load();
      onChanged();
    } catch (e) {
      message.error((e as Error).message);
    }
  };

  return (
    <>
      <DetailHeader
        avatar={<Avatar text={c.name} tone="cocoa" />}
        title={c.name}
        subtitle={`Customer since ${date(c.createdAt)} · last login ${ago(c.lastLoginAt)}`}
        extra={
          <>
            {c.phone && <a href={`https://wa.me/91${c.phone}`} target="_blank" rel="noreferrer"><Button size="small" icon={<WhatsAppOutlined />} /></a>}
            {c.phone && <a href={`tel:+91${c.phone}`}><Button size="small" icon={<PhoneOutlined />} /></a>}
            <a href={`mailto:${c.email}`}><Button size="small" icon={<MailOutlined />} /></a>
            <span className="ml-1 flex items-center gap-2 text-xs text-char/60">Active <Switch size="small" checked={!c.isBlocked} onChange={(v) => block(!v)} /></span>
          </>
        }
      />
      <div className="space-y-4 p-4 md:p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Orders" value={d.stats.orders} icon={<span>#</span>} tone="cocoa" />
          <StatCard label="Total spent" value={inr(d.stats.spent)} icon={<span>₹</span>} tone="terra" />
          <StatCard label="Last order" value={<span className="text-base">{ago(d.stats.lastOrder ?? undefined)}</span>} icon={<span>•</span>} tone="gold" />
        </div>
        <Pane className="grid gap-4 sm:grid-cols-3">
          <Field label="Email">{c.email || '—'}</Field>
          <Field label="Mobile">{c.phone ? `+91 ${c.phone}` : '—'}</Field>
          <Field label="Status">{c.isBlocked ? 'Blocked' : 'Active'}</Field>
          <Field label="Signs in with">{LOGIN[c.loginMethod ?? ''] ?? '—'}{c.googleLinked && c.loginMethod !== 'google' ? ' (Google linked)' : ''}</Field>
          <Field label="Joined">{date(c.createdAt)}</Field>
          <Field label="Last login">{c.lastLoginAt ? ago(c.lastLoginAt) : '—'}</Field>
          <Field label="Offer updates">{c.notifyOffers === false ? 'Turned off' : 'On (email + push)'}</Field>
          <Field label="Push devices">
            {Array.isArray(c.pushDevices) && c.pushDevices.length
              ? c.pushDevices.map((p, i) => <span key={i} className="block">{p.device ?? 'Browser'} <span className="text-char/45">· {date(p.addedAt)}</span></span>)
              : 'None — hasn’t turned on notifications'}
          </Field>
        </Pane>
        {d.addresses.length > 0 && (
          <Pane>
            <h4 className="mb-3 font-sans text-sm font-semibold">Delivery addresses ({d.addresses.length})</h4>
            <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
              {d.addresses.map((a, i) => (
                <li key={i} className="rounded-xl border border-black/5 p-3 text-sm">
                  <p className="font-medium">{a.name}{a.phone ? ` · +91 ${a.phone}` : ''}</p>
                  <p className="text-char/65">{a.line1}, {a.city}, {a.state} – {a.pincode}</p>
                  <p className="mt-1 text-xs text-char/45">Last used {date(a.usedAt)}</p>
                </li>
              ))}
            </ul>
          </Pane>
        )}
        <Pane>
          <h4 className="mb-3 font-sans text-sm font-semibold">Orders ({d.orders.length})</h4>
          <Table
            size="small"
            rowKey="id"
            pagination={false}
            dataSource={d.orders}
            scroll={{ x: 480 }}
            locale={{ emptyText: 'No orders yet' }}
            columns={[
              { title: 'Order', dataIndex: 'id', render: (x) => <Link to={`/orders/${x}`} className="text-terra-dark">#{x}</Link> },
              { title: 'Date', dataIndex: 'date', render: date },
              { title: 'Items', dataIndex: 'items' },
              { title: 'Total', dataIndex: 'total', render: inr },
              { title: 'Status', dataIndex: 'status', render: (s) => <StatusTag status={s} /> },
            ]}
          />
        </Pane>
      </div>
    </>
  );
}
