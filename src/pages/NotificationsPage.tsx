import { BellOutlined, MailOutlined, ReloadOutlined, SendOutlined } from '@ant-design/icons';
import { Alert, Button, Checkbox, Form, Input, Popconfirm, Table, Tag, message } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/api/client';
import { PageTitle, StatCard } from '@/components/ui';
import { dateTime } from '@/utils/format';

interface NotificationRow {
  _id: string;
  title: string;
  body: string;
  link: string;
  channels: ('push' | 'email')[];
  trigger: string;
  status: 'sending' | 'sent' | 'failed';
  stats: { customers: number; pushSent: number; pushFailed: number; emailSent: number; emailFailed: number };
  error?: string;
  createdBy?: string;
  createdAt: string;
}
interface ListResponse {
  items: NotificationRow[];
  total: number;
  channels: { push: boolean; email: boolean };
  audience: { customers: number; withPush: number; withEmail: number; optedIn: number };
}

const triggerLabel: Record<string, string> = { manual: 'Manual', 'new-product': 'New product', 'new-offer': 'New offer', 'new-collection': 'New collection' };

/** Send a push/email message to customers + history of everything sent (manual and automatic). */
export default function NotificationsPage() {
  const [form] = Form.useForm();
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api<ListResponse>('/notifications', { query: { limit: 50 } }));
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const send = async (v: { title: string; body: string; link?: string; channels: ('push' | 'email')[] }) => {
    setSending(true);
    try {
      const r = await api<{ message: string }>('/notifications', { method: 'POST', body: v });
      message.success(r.message);
      form.resetFields();
      await load();
      setTimeout(load, 5000); // delivery numbers arrive a moment later
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  const ch = data?.channels;
  const a = data?.audience;

  return (
    <>
      <PageTitle title="Notifications" subtitle="Send offers and announcements to customers by push and email." extra={<Button icon={<ReloadOutlined />} onClick={load}>Refresh</Button>} />

      {ch && (!ch.push || !ch.email) && (
        <Alert
          className="mb-4"
          type="warning"
          showIcon
          message="Some channels aren’t connected yet"
          description={
            <ul className="m-0 pl-4">
              {!ch.push && <li><b>Push</b>: add FIREBASE_SERVICE_ACCOUNT_BASE64 to the API’s .env (and the VITE_FIREBASE_* keys on the website).</li>}
              {!ch.email && <li><b>Email</b>: add SMTP_HOST / SMTP_USER / SMTP_PASS / MAIL_FROM to the API’s .env.</li>}
              <li>Messages can still be composed; they’ll be recorded with 0 delivered on channels that aren’t connected.</li>
            </ul>
          }
        />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Customers" value={a?.customers ?? '—'} icon={<BellOutlined />} tone="cocoa" />
        <StatCard label="Want offers" value={a?.optedIn ?? '—'} hint="Offer updates turned on" icon={<BellOutlined />} tone="terra" />
        <StatCard label="Push devices" value={a?.withPush ?? '—'} hint={ch?.push ? 'Firebase connected' : 'Firebase not connected'} icon={<BellOutlined />} tone="gold" />
        <StatCard label="With email" value={a?.withEmail ?? '—'} hint={ch?.email ? 'SMTP connected' : 'SMTP not connected'} icon={<MailOutlined />} tone="char" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[420px_1fr]">
        <div className="panel">
          <h3 className="mb-1 text-lg">New message</h3>
          <p className="mb-4 text-xs text-char/50">Goes to every customer who has offer updates turned on.</p>
          <Form form={form} layout="vertical" onFinish={send} requiredMark={false} initialValues={{ channels: ['push', 'email'], link: '/shop' }}>
            <Form.Item name="title" label="Title" rules={[{ required: true, min: 3, max: 80 }]}>
              <Input placeholder="Diwali sale is live 🪔" maxLength={80} showCount />
            </Form.Item>
            <Form.Item name="body" label="Message" rules={[{ required: true, min: 3, max: 240 }]}>
              <Input.TextArea rows={3} placeholder="Flat 20% off on all diya sets till Sunday. Use code DIWALI20." maxLength={240} showCount />
            </Form.Item>
            <Form.Item name="link" label="Opens page" extra="e.g. /shop, /shop?category=diwali-special, /product/ocean-escape">
              <Input />
            </Form.Item>
            <Form.Item name="channels" label="Send by" rules={[{ required: true, type: 'array', min: 1, message: 'Pick at least one channel' }]}>
              <Checkbox.Group options={[{ label: 'Push notification', value: 'push' }, { label: 'Email', value: 'email' }]} />
            </Form.Item>
            <Popconfirm title={`Send to ${a?.optedIn ?? 0} customers?`} onConfirm={() => form.submit()}>
              <Button type="primary" icon={<SendOutlined />} loading={sending}>Send</Button>
            </Popconfirm>
          </Form>
        </div>

        <div className="panel">
          <h3 className="mb-3 text-lg">Sent</h3>
          <Table<NotificationRow>
            size="small"
            rowKey="_id"
            loading={loading}
            dataSource={data?.items ?? []}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 640 }}
            columns={[
              { title: 'Sent', dataIndex: 'createdAt', width: 150, render: (d) => <span className="text-xs">{dateTime(d)}</span> },
              {
                title: 'Message',
                render: (_, n) => (
                  <div>
                    <p className="font-medium">{n.title}</p>
                    <p className="text-xs text-char/55">{n.body}</p>
                    {n.error && <p className="text-xs text-red-600">{n.error}</p>}
                  </div>
                ),
              },
              { title: 'Type', dataIndex: 'trigger', width: 120, render: (t) => <Tag>{triggerLabel[t] ?? t}</Tag> },
              {
                title: 'Delivered',
                width: 170,
                render: (_, n) =>
                  n.status === 'sending' ? (
                    <Tag color="blue">Sending…</Tag>
                  ) : (
                    <span className="text-xs">
                      {n.channels.includes('push') && <span className="block">Push: {n.stats.pushSent}{n.stats.pushFailed ? ` (${n.stats.pushFailed} failed)` : ''}</span>}
                      {n.channels.includes('email') && <span className="block">Email: {n.stats.emailSent}{n.stats.emailFailed ? ` (${n.stats.emailFailed} failed)` : ''}</span>}
                    </span>
                  ),
              },
            ]}
          />
        </div>
      </div>
    </>
  );
}
