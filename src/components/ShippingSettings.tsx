import { Alert, Button, Form, InputNumber, Skeleton, Switch, message } from 'antd';
import { useEffect, useState } from 'react';
import { api } from '@/api/client';
import { Pane } from '@/components/MasterDetail';
import { inr } from '@/utils/format';

interface Shipping {
  shippingFee: number;
  freeShippingEnabled: boolean;
  freeShippingAbove: number;
}

/** Shipping charge + free-shipping threshold used by the website cart, checkout and order totals. */
export default function ShippingSettings() {
  const [form] = Form.useForm<Shipping>();
  const [saved, setSaved] = useState<Shipping | null>(null);
  const [saving, setSaving] = useState(false);
  const live = Form.useWatch([], form) as Shipping | undefined;

  useEffect(() => {
    api<{ shipping: Shipping }>('/settings/shipping')
      .then((r) => setSaved(r.shipping))
      .catch((e) => message.error(e.message));
  }, []);

  const save = async (v: Shipping) => {
    setSaving(true);
    try {
      const r = await api<{ shipping: Shipping; message: string }>('/settings/shipping', { method: 'PUT', body: v });
      setSaved(r.shipping);
      message.success(r.message);
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (!saved) return <Skeleton active paragraph={{ rows: 5 }} />;
  const s = { ...saved, ...live };

  return (
    <div className="max-w-xl space-y-4">
      <Pane>
        <Form form={form} layout="vertical" initialValues={saved} onFinish={save} requiredMark={false}>
          <Form.Item name="shippingFee" label="Shipping charge (₹)" extra="Added to orders that don’t qualify for free shipping. Use 0 for always-free shipping." rules={[{ required: true }]}>
            <InputNumber min={0} max={5000} precision={0} prefix="₹" className="w-full" />
          </Form.Item>
          <Form.Item name="freeShippingEnabled" label="Free shipping above a minimum order" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item
            name="freeShippingAbove"
            label="Free shipping when the order is at least (₹)"
            extra="Checked after coupon discounts."
            rules={[{ required: true }]}
          >
            <InputNumber min={0} max={1000000} precision={0} prefix="₹" className="w-full" disabled={!s.freeShippingEnabled} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={saving}>Save shipping charges</Button>
        </Form>
      </Pane>
      <Alert
        type="info"
        showIcon
        message="What customers will see"
        description={
          s.shippingFee === 0
            ? 'Free shipping on every order.'
            : s.freeShippingEnabled
              ? `Free shipping on orders of ${inr(s.freeShippingAbove)} or more; ${inr(s.shippingFee)} below that.`
              : `A flat ${inr(s.shippingFee)} shipping charge on every order.`
        }
      />
    </div>
  );
}
