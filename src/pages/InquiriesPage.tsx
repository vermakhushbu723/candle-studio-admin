import { DeleteOutlined, DownloadOutlined, MailOutlined, MessageOutlined, PhoneOutlined, WhatsAppOutlined } from '@ant-design/icons';
import { Button, Popconfirm, message } from 'antd';
import { useState } from 'react';
import { api } from '@/api/client';
import { CONTACT_TOPICS, type Inquiry } from '@/api/types';
import MasterDetail, { Avatar, DetailHeader, Dot, Pane, fromList } from '@/components/MasterDetail';
import StatusNotesPanel from '@/components/StatusNotesPanel';
import { Field, StatusTag } from '@/components/ui';
import { useList } from '@/hooks/useList';
import { useCounts } from '@/store/countsStore';
import { date, dateTime, downloadCsv, shortTime } from '@/utils/format';

const statuses = ['New', 'In progress', 'Resolved'];
const topic = (t: string) => CONTACT_TOPICS[t] ?? t;

/** Website Contact page → "Send us a message" form. */
export default function InquiriesPage() {
  const list = useList<Inquiry>('/inquiries');
  const [chip, setChip] = useState('All');
  const refreshCounts = useCounts((s) => s.refresh);
  const [local, setLocal] = useState<Record<string, Inquiry>>({}); // freshest copy after edits

  const remove = async (id: string) => {
    try {
      await api(`/inquiries/${id}`, { method: 'DELETE' });
      list.reload();
      refreshCounts();
    } catch (e) {
      message.error((e as Error).message);
    }
  };

  return (
    <MasterDetail<Inquiry>
      title="Contact Enquiries"
      icon={<MessageOutlined />}
      {...fromList(list)}
      getKey={(i) => i._id}
      searchPlaceholder="Search name, email, message…"
      chips={{ options: ['All', ...statuses], value: chip, onChange: (v) => { setChip(v); list.update({ status: v === 'All' ? undefined : v }); } }}
      actions={
        <Button size="small" icon={<DownloadOutlined />} onClick={() => downloadCsv('enquiries.csv', list.items.map((i) => ({ date: date(i.createdAt), name: i.name, email: i.email, phone: i.phone, topic: topic(i.topic), message: i.message, status: i.status })))}>
          Export CSV
        </Button>
      }
      renderRow={(i) => ({
        avatar: <Avatar text={i.name} tone={i.status === 'New' ? 'terra' : 'cocoa'} />,
        title: i.name,
        meta: `${topic(i.topic)} · ${i.status}`,
        preview: i.message,
        time: shortTime(i.createdAt),
        badge: i.status === 'New' ? <Dot n={1} /> : null,
      })}
      renderDetail={(key, item) => {
        const i = local[key] ?? item;
        if (!i) return null;
        return (
          <>
            <DetailHeader
              avatar={<Avatar text={i.name} />}
              title={i.name}
              subtitle={`${i.email}${i.phone ? ` · +91 ${i.phone}` : ''}`}
              extra={
                <>
                  <StatusTag status={i.status} />
                  {i.phone && <a href={`https://wa.me/91${i.phone}`} target="_blank" rel="noreferrer"><Button size="small" icon={<WhatsAppOutlined />} /></a>}
                  {i.phone && <a href={`tel:+91${i.phone}`}><Button size="small" icon={<PhoneOutlined />} /></a>}
                  <a href={`mailto:${i.email}?subject=Re: ${topic(i.topic)}`}><Button size="small" icon={<MailOutlined />} /></a>
                  <Popconfirm title="Delete this enquiry?" onConfirm={() => remove(i._id)}><Button size="small" danger icon={<DeleteOutlined />} /></Popconfirm>
                </>
              }
            />
            <div className="space-y-4 p-4 md:p-5">
              <div className="flex">
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white p-4 text-sm leading-relaxed shadow-soft">
                  <p className="mb-1 text-xs font-medium text-terra-dark">{topic(i.topic)}</p>
                  <p className="whitespace-pre-wrap">{i.message}</p>
                  <p className="mt-2 text-right text-[11px] text-char/40">{dateTime(i.createdAt)}</p>
                </div>
              </div>
              <Pane className="grid gap-4 sm:grid-cols-3">
                <Field label="Email">{i.email}</Field>
                <Field label="Phone">{i.phone ? `+91 ${i.phone}` : ''}</Field>
                <Field label="Topic">{topic(i.topic)}</Field>
              </Pane>
              <StatusNotesPanel
                path={`/inquiries/${i._id}`}
                status={i.status}
                statuses={statuses}
                notes={i.notes}
                onSaved={(saved) => {
                  setLocal((l) => ({ ...l, [key]: saved as Inquiry }));
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
