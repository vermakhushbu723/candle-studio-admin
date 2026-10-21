import { Alert, Button, Form, Input, InputNumber, Skeleton, Space, Switch, Table, Tag, message } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { api, WEBSITE_URL } from '@/api/client';
import { Pane } from '@/components/MasterDetail';

interface FollowLink {
  key: string;
  label: string;
  url: string;
}
interface Offer {
  enabled: boolean;
  percent: number;
  validDays: number;
  maxDiscount: number;
  links: FollowLink[];
}
interface Claim {
  id: string;
  customer?: { name?: string; phone?: string; email?: string };
  couponCode: string;
  used: boolean;
  expiry?: string;
  at: string;
}

const date = (d?: string) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

/** Footer QR "Follow & Save" offer: discount, validity, the pages to follow, and who has claimed it. */
export default function FollowOfferSettings() {
  const [form] = Form.useForm<Offer>();
  const [saved, setSaved] = useState<Offer | null>(null);
  const [stats, setStats] = useState({ claims: 0, used: 0 });
  const [claims, setClaims] = useState<Claim[]>([]);
  const [saving, setSaving] = useState(false);

  const load = () => {
    api<{ offer: Offer; stats: { claims: number; used: number } }>('/offers/follow')
      .then((r) => {
        setSaved(r.offer);
        setStats(r.stats);
      })
      .catch((e) => message.error(e.message));
    api<{ items: Claim[] }>('/offers/follow/claims')
      .then((r) => setClaims(r.items))
      .catch(() => undefined);
  };
  useEffect(load, []);

  const save = async (v: Offer) => {
    setSaving(true);
    try {
      const r = await api<{ offer: Offer; message: string }>('/offers/follow', { method: 'PUT', body: v });
      setSaved(r.offer);
      message.success(r.message);
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (!saved) return <Skeleton active paragraph={{ rows: 6 }} />;

  return (
    <div className="max-w-3xl space-y-4">
      <Alert
        type="info"
        showIcon
        message="How it works"
        description={`The QR code in the website footer opens ${WEBSITE_URL}/follow. Customers log in, open every page below, and get a personal one-time coupon (one per account and one per phone).`}
      />
      <div className="grid grid-cols-2 gap-3">
        <Pane><p className="text-xs uppercase text-gray-500">Coupons claimed</p><p className="text-2xl font-semibold">{stats.claims}</p></Pane>
        <Pane><p className="text-xs uppercase text-gray-500">Used in orders</p><p className="text-2xl font-semibold">{stats.used}</p></Pane>
      </div>
      <Pane>
        <Form form={form} layout="vertical" initialValues={saved} onFinish={save} requiredMark={false}>
          <Form.Item name="enabled" label="Offer is live" valuePropName="checked">
            <Switch />
          </Form.Item>
          <div className="grid gap-x-4 sm:grid-cols-3">
            <Form.Item name="percent" label="Discount (%)" rules={[{ required: true }]}>
              <InputNumber min={1} max={90} precision={0} suffix="%" className="w-full" />
            </Form.Item>
            <Form.Item name="validDays" label="Coupon valid for (days)" rules={[{ required: true }]}>
              <InputNumber min={1} max={365} precision={0} className="w-full" />
            </Form.Item>
            <Form.Item name="maxDiscount" label="Max discount (₹, 0 = no cap)" rules={[{ required: true }]}>
              <InputNumber min={0} max={100000} precision={0} prefix="₹" className="w-full" />
            </Form.Item>
          </div>
          <p className="mb-2 font-medium">Pages to follow</p>
          <Form.List name="links">
            {(fields, { add, remove }) => (
              <>
                {fields.map((f) => (
                  <Space key={f.key} align="baseline" className="flex w-full" wrap>
                    <Form.Item name={[f.name, 'key']} rules={[{ required: true }]} className="w-28"><Input placeholder="instagram" /></Form.Item>
                    <Form.Item name={[f.name, 'label']} rules={[{ required: true }]} className="w-32"><Input placeholder="Instagram" /></Form.Item>
                    <Form.Item name={[f.name, 'url']} rules={[{ required: true, type: 'url' }]} className="min-w-64 flex-1"><Input placeholder="https://…" /></Form.Item>
                    {fields.length > 1 && <MinusCircleOutlined onClick={() => remove(f.name)} />}
                  </Space>
                ))}
                <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ key: '', label: '', url: '' })} className="mb-4">Add page</Button>
              </>
            )}
          </Form.List>
          <Button type="primary" htmlType="submit" loading={saving}>Save offer</Button>
        </Form>
      </Pane>
      <Pane>
        <p className="mb-3 font-medium">Recent claims</p>
        <Table<Claim>
          size="small"
          rowKey="id"
          dataSource={claims}
          pagination={{ pageSize: 10 }}
          scroll={{ x: true }}
          columns={[
            { title: 'Customer', render: (_, c) => <span>{c.customer?.name ?? '—'}<br /><span className="text-xs text-gray-500">{c.customer?.phone ? `+91 ${c.customer.phone}` : c.customer?.email}</span></span> },
            { title: 'Coupon', dataIndex: 'couponCode', render: (v: string) => <code>{v}</code> },
            { title: 'Status', render: (_, c) => (c.used ? <Tag color="green">Used</Tag> : <Tag>Not used</Tag>) },
            { title: 'Claimed', dataIndex: 'at', render: (v: string) => date(v) },
            { title: 'Expires', dataIndex: 'expiry', render: (v: string) => date(v) },
          ]}
        />
      </Pane>
    </div>
  );
}
