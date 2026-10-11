import { DeleteOutlined, PlusOutlined, SaveOutlined, TagsOutlined } from '@ant-design/icons';
import { Button, DatePicker, Form, Input, InputNumber, Popconfirm, Progress, Select, Switch, message } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/api/client';
import type { Coupon } from '@/api/types';
import MasterDetail, { DetailHeader, Pane } from '@/components/MasterDetail';
import { StatusTag } from '@/components/ui';
import { date, inr } from '@/utils/format';

const NEW = '__new';
const expired = (c: Coupon) => dayjs(c.expiry).isBefore(dayjs(), 'day');
const statusOf = (c: Coupon) => (expired(c) ? 'Expired' : c.isActive ? 'Active' : 'Paused');
const discountText = (c: Coupon) => (c.type === 'percent' ? `${c.value}% off${c.maxDiscount ? ` (max ${inr(c.maxDiscount)})` : ''}` : `${inr(c.value)} off`);

export default function CouponsPage() {
  const [all, setAll] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [chip, setChip] = useState('All');
  const [selected, setSelected] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setAll((await api<{ items: Coupon[] }>('/coupons')).items);
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  // Coupons are few, so filtering happens client-side
  const items = useMemo(
    () => all.filter((c) => (chip === 'All' || statusOf(c) === chip) && (!q || `${c.code} ${c.description}`.toLowerCase().includes(q.toLowerCase()))),
    [all, chip, q],
  );

  return (
    <MasterDetail<Coupon>
      title="Coupons"
      icon={<TagsOutlined />}
      items={items}
      total={items.length}
      page={1}
      limit={Math.max(items.length, 5)}
      loading={loading}
      onPage={() => undefined}
      onRefresh={load}
      onSearch={setQ}
      getKey={(c) => c._id}
      searchPlaceholder="Search code or description…"
      chips={{ options: ['All', 'Active', 'Paused', 'Expired'], value: chip, onChange: (v) => { setChip(v); setSelected(null); } }}
      actions={<Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => setSelected(NEW)}>New coupon</Button>}
      selectedKey={selected}
      onSelect={setSelected}
      renderRow={(c) => ({
        avatar: (
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-terra-soft text-[11px] font-bold text-terra-dark">
            {c.type === 'percent' ? `${c.value}%` : `₹${c.value}`}
          </span>
        ),
        title: <span className="font-mono">{c.code}</span>,
        meta: `${discountText(c)} · min ${inr(c.minOrder)}`,
        preview: c.description,
        time: `till ${date(c.expiry)}`,
        badge: <StatusTag status={statusOf(c)} />,
      })}
      renderDetail={(key, item) => (
        <CouponEditor
          coupon={key === NEW ? null : item ?? null}
          onSaved={async (id) => {
            await load();
            setSelected(id);
          }}
          onDeleted={async () => {
            await load();
            setSelected(null);
          }}
        />
      )}
    />
  );
}

function CouponEditor({ coupon, onSaved, onDeleted }: { coupon: Coupon | null; onSaved: (id: string) => void; onDeleted: () => void }) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const initial = coupon
    ? { ...coupon, expiry: dayjs(coupon.expiry) }
    : { type: 'percent', minOrder: 0, usageLimit: 0, isActive: true, expiry: dayjs().add(30, 'day') };

  const save = async (v: Record<string, unknown> & { expiry: dayjs.Dayjs }) => {
    setSaving(true);
    // Cleared number inputs come back as null — drop them so optional fields stay unset
    const clean = Object.fromEntries(Object.entries(v).filter(([, x]) => x !== null && x !== undefined));
    const body = { ...clean, expiry: v.expiry.format('YYYY-MM-DD') };
    try {
      const r = coupon
        ? await api<{ coupon: Coupon }>(`/coupons/${coupon._id}`, { method: 'PUT', body })
        : await api<{ coupon: Coupon }>('/coupons', { method: 'POST', body });
      message.success('Coupon saved');
      onSaved(r.coupon._id);
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    await api(`/coupons/${coupon!._id}`, { method: 'DELETE' }).catch((e) => message.error(e.message));
    message.success('Coupon deleted');
    onDeleted();
  };

  return (
    <>
      <DetailHeader
        avatar={<span className="flex h-11 w-11 items-center justify-center rounded-full bg-terra-soft text-terra-dark"><TagsOutlined /></span>}
        title={coupon ? <span className="font-mono">{coupon.code}</span> : 'New coupon'}
        subtitle={coupon ? `${discountText(coupon)} · used ${coupon.usedCount} time(s)` : 'Create a discount code for the website'}
        extra={
          <>
            {coupon && <Popconfirm title="Delete coupon?" onConfirm={remove}><Button danger icon={<DeleteOutlined />} /></Popconfirm>}
            <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={() => form.submit()}>Save</Button>
          </>
        }
      />
      <div className="space-y-4 p-4 md:p-5">
        {coupon && coupon.usageLimit > 0 && (
          <Pane>
            <p className="mb-1 text-sm text-char/60">Usage</p>
            <Progress percent={Math.round((coupon.usedCount / coupon.usageLimit) * 100)} format={() => `${coupon.usedCount}/${coupon.usageLimit}`} strokeColor="#6C2408" />
          </Pane>
        )}
        <Pane>
          <Form form={form} layout="vertical" onFinish={save} requiredMark={false} initialValues={initial} className="grid gap-x-4 sm:grid-cols-2">
            <Form.Item name="code" label="Code" rules={[{ required: true, min: 3 }]} normalize={(v?: string) => v?.toUpperCase().replace(/\s+/g, '')}>
              <Input className="font-mono" placeholder="GLOW10" />
            </Form.Item>
            <Form.Item name="type" label="Type"><Select options={[{ value: 'percent', label: 'Percentage' }, { value: 'fixed', label: 'Fixed amount' }]} /></Form.Item>
            <Form.Item name="value" label="Value" rules={[{ required: true }]}><InputNumber min={1} className="w-full" /></Form.Item>
            <Form.Item name="maxDiscount" label="Max discount (₹)"><InputNumber min={0} className="w-full" /></Form.Item>
            <Form.Item name="minOrder" label="Minimum order (₹)"><InputNumber min={0} className="w-full" /></Form.Item>
            <Form.Item name="usageLimit" label="Usage limit (0 = unlimited)"><InputNumber min={0} className="w-full" /></Form.Item>
            <Form.Item name="expiry" label="Expiry" rules={[{ required: true }]}><DatePicker className="w-full" /></Form.Item>
            <Form.Item name="isActive" label="Active" valuePropName="checked"><Switch /></Form.Item>
            {!coupon && (
              <Form.Item name="notify" label="Notify customers" valuePropName="checked" tooltip="Sends a push notification + email to customers who want offer updates, as soon as you save.">
                <Switch />
              </Form.Item>
            )}
            <Form.Item name="description" label="Description (shown to customers)" className="sm:col-span-2"><Input /></Form.Item>
          </Form>
        </Pane>
      </div>
    </>
  );
}
