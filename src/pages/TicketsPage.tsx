import { CustomerServiceOutlined, DeleteOutlined, DownloadOutlined, PhoneOutlined, WhatsAppOutlined } from '@ant-design/icons';
import { Button, Popconfirm, message } from 'antd';
import { useState } from 'react';
import { api } from '@/api/client';
import type { Ticket } from '@/api/types';
import MasterDetail, { Avatar, DetailHeader, Dot, Pane, fromList } from '@/components/MasterDetail';
import StatusNotesPanel from '@/components/StatusNotesPanel';
import { Field, StatusTag } from '@/components/ui';
import { useList } from '@/hooks/useList';
import { useCounts } from '@/store/countsStore';
import { date, dateTime, downloadCsv, shortTime } from '@/utils/format';

const statuses = ['Open', 'In progress', 'Resolved', 'Closed'];

/** Website support chatbot (Diya) → "Leave us a message" form. The customer is promised a call back within 24h. */
export default function TicketsPage() {
  const list = useList<Ticket>('/tickets');
  const [chip, setChip] = useState('All');
  const [local, setLocal] = useState<Record<string, Ticket>>({});
  const refreshCounts = useCounts((s) => s.refresh);

  const remove = async (id: string) => {
    try {
      await api(`/tickets/${id}`, { method: 'DELETE' });
      list.reload();
      refreshCounts();
    } catch (e) {
      message.error((e as Error).message);
    }
  };

  return (
    <MasterDetail<Ticket>
      title="Chat Requests"
      icon={<CustomerServiceOutlined />}
      {...fromList(list)}
      getKey={(t) => t._id}
      searchPlaceholder="Ticket, name, phone, message…"
      chips={{ options: ['All', ...statuses], value: chip, onChange: (v) => { setChip(v); list.update({ status: v === 'All' ? undefined : v }); } }}
      actions={
        <Button size="small" icon={<DownloadOutlined />} onClick={() => downloadCsv('chat-requests.csv', list.items.map((t) => ({ ticket: t.ticketId, date: date(t.createdAt), name: t.name, phone: t.phone, topic: t.topic, message: t.message, status: t.status })))}>
          Export CSV
        </Button>
      }
      renderRow={(t) => ({
        avatar: <Avatar text={t.name} tone={t.status === 'Open' ? 'terra' : 'cocoa'} />,
        title: t.name,
        meta: `${t.ticketId} · ${t.topic}`,
        preview: t.message,
        time: shortTime(t.createdAt),
        badge: t.status === 'Open' ? <Dot n={1} /> : null,
      })}
      renderDetail={(key, item) => {
        const t = local[key] ?? item;
        if (!t) return null;
        return (
          <>
            <DetailHeader
              avatar={<Avatar text={t.name} />}
              title={`${t.name} · ${t.ticketId}`}
              subtitle={`+91 ${t.phone} · ${t.topic}`}
              extra={
                <>
                  <StatusTag status={t.status} />
                  <a href={`https://wa.me/91${t.phone}?text=${encodeURIComponent(`Hi ${t.name.split(' ')[0]}! This is Jyotessa about your ticket ${t.ticketId}.`)}`} target="_blank" rel="noreferrer">
                    <Button size="small" icon={<WhatsAppOutlined />} />
                  </a>
                  <a href={`tel:+91${t.phone}`}><Button size="small" icon={<PhoneOutlined />} /></a>
                  <Popconfirm title="Delete this request?" onConfirm={() => remove(t._id)}><Button size="small" danger icon={<DeleteOutlined />} /></Popconfirm>
                </>
              }
            />
            <div className="space-y-4 p-4 md:p-5">
              <div className="flex">
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white p-4 text-sm leading-relaxed shadow-soft">
                  <p className="mb-1 text-xs font-medium text-terra-dark">{t.topic}</p>
                  <p className="whitespace-pre-wrap">{t.message}</p>
                  <p className="mt-2 text-right text-[11px] text-char/40">{dateTime(t.createdAt)}</p>
                </div>
              </div>
              <Pane className="grid gap-4 sm:grid-cols-3">
                <Field label="Ticket">{t.ticketId}</Field>
                <Field label="Phone">+91 {t.phone}</Field>
                <Field label="Topic">{t.topic}</Field>
              </Pane>
              <StatusNotesPanel
                path={`/tickets/${t._id}`}
                status={t.status}
                statuses={statuses}
                notes={t.notes}
                onSaved={(saved) => {
                  setLocal((l) => ({ ...l, [key]: saved as Ticket }));
                  list.reload();
                }}
              />
            </div>
          </>
        );
      }}
    />
  );
}
