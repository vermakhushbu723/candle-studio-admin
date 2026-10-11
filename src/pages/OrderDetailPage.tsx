import { MailOutlined, PhoneOutlined, PrinterOutlined, WhatsAppOutlined } from '@ant-design/icons';
import { Button, Form, Input, Select, Skeleton, Steps, message } from 'antd';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, assetUrl } from '@/api/client';
import { FRAGRANCES, PAYMENT, type Order } from '@/api/types';
import { Avatar, DetailHeader, Pane } from '@/components/MasterDetail';
import { Field, StatusTag } from '@/components/ui';
import { useCounts } from '@/store/countsStore';
import { dateTime, inr } from '@/utils/format';

// Same five stages the customer sees on the website's Track Order page
const flow = ['Order Placed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

/** Order detail pane (used inside the Orders master/detail layout). */
export default function OrderDetail({ id, onChanged }: { id: string; onChanged?: () => void }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const refreshCounts = useCounts((s) => s.refresh);

  useEffect(() => {
    setOrder(null);
    api<{ order: Order }>(`/orders/${id}`)
      .then((r) => {
        setOrder(r.order);
        form.setFieldsValue({ status: r.order.status, awb: r.order.awb, courier: r.order.courier, paymentStatus: r.order.paymentStatus, note: '' });
      })
      .catch((e) => message.error(e.message));
  }, [id]);

  if (!order) return <div className="p-6"><Skeleton active avatar paragraph={{ rows: 8 }} /></div>;

  const save = async (v: { status: string; awb?: string; courier?: string; paymentStatus: string; note?: string }) => {
    setSaving(true);
    try {
      const r = await api<{ order: Order }>(`/orders/${order.id}/status`, { method: 'PATCH', body: v });
      setOrder({ ...order, ...r.order });
      form.setFieldValue('note', '');
      message.success(`Order updated to “${r.order.status}”`);
      refreshCounts();
      onChanged?.();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const current = order.status === 'Cancelled' ? -1 : flow.indexOf(order.status);
  const { name, phone, email } = order.customer;

  return (
    <>
      <DetailHeader
        avatar={<Avatar text={name} tone="terra" />}
        title={`#${order.id} · ${name}`}
        subtitle={`Placed ${dateTime(order.date)} · ${order.items.length} item(s) · ${inr(order.total)}`}
        extra={
          <>
            <StatusTag status={order.status} />
            <a href={`https://wa.me/91${phone}?text=${encodeURIComponent(`Hi ${name.split(' ')[0]}! Update on your Jyotessa order #${order.id}: ${order.status}.`)}`} target="_blank" rel="noreferrer"><Button size="small" icon={<WhatsAppOutlined />} /></a>
            <a href={`tel:+91${phone}`}><Button size="small" icon={<PhoneOutlined />} /></a>
            <a href={`mailto:${email}?subject=Your Jyotessa order ${order.id}`}><Button size="small" icon={<MailOutlined />} /></a>
            <Button size="small" icon={<PrinterOutlined />} onClick={() => window.print()} />
          </>
        }
      />

      <div className="space-y-4 p-4 md:p-5">
        <Pane className="overflow-x-auto">
          {order.status === 'Cancelled' ? (
            <p className="text-red-600">This order was cancelled. Stock has been returned to inventory.</p>
          ) : order.status === 'Payment Pending' ? (
            <p className="text-[#a8471a]">Waiting for the customer to finish the Razorpay payment. Stock is not reserved yet.</p>
          ) : (
            <Steps size="small" current={current} items={flow.map((s) => ({ title: <span className="text-[11px]">{s}</span> }))} className="min-w-[520px]" />
          )}
        </Pane>

        <div className="grid gap-4 2xl:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            <Pane>
              <h4 className="mb-2 font-sans text-sm font-semibold">Items</h4>
              <ul className="m-0 list-none divide-y divide-black/5 p-0">
                {order.items.map((i, k) => (
                  <li key={k} className="flex gap-3 py-3">
                    <img src={assetUrl(i.image)} alt="" className="h-14 w-12 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{i.name}</p>
                      {i.fragrance && <p className="text-xs text-char/55">Fragrance: {FRAGRANCES[i.fragrance] ?? i.fragrance}</p>}
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-char/60">{inr(i.price)} × {i.quantity}</p>
                      <p className="font-semibold">{inr(i.price * i.quantity)}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="ml-auto mt-2 max-w-xs space-y-1 text-sm">
                <Row l="Subtotal" v={inr(order.subtotal)} />
                {order.discount > 0 && <Row l={`Discount ${order.couponCode ? `(${order.couponCode})` : ''}`} v={`− ${inr(order.discount)}`} />}
                <Row l="Shipping" v={order.shipping ? inr(order.shipping) : 'Free'} />
                <div className="flex justify-between border-t border-black/5 pt-2 text-base font-semibold"><span>Total</span><span>{inr(order.total)}</span></div>
              </div>
            </Pane>

            <Pane className="grid gap-3 sm:grid-cols-2">
              <Field label="Email">{email}</Field>
              <Field label="Mobile">+91 {phone}</Field>
              <Field label="Shipping address">{order.address.line1}, {order.address.city}, {order.address.state} – {order.address.pincode}</Field>
              <Field label="Payment">
                {PAYMENT[order.paymentMethod]} · <StatusTag status={order.paymentStatus} />
                {order.razorpayPaymentId && <span className="mt-1 block text-xs text-char/50">Razorpay {order.razorpayPaymentId}</span>}
              </Field>
              <Field label="Account">
                {order.account ? <Link to="/customers" className="text-terra-dark">{order.account.name} (registered)</Link> : 'Guest checkout'}
              </Field>
              {order.giftNote && <Field label="Gift note (handwrite on card)"><i>“{order.giftNote}”</i></Field>}
            </Pane>
          </div>

          <div className="space-y-4">
            <Pane>
              <h4 className="mb-3 font-sans text-sm font-semibold">Update order</h4>
              <Form form={form} layout="vertical" onFinish={save} requiredMark={false}>
                <Form.Item name="status" label="Order status" rules={[{ required: true }]}>
                  <Select options={['Payment Pending', ...flow, 'Cancelled'].map((s) => ({ value: s }))} />
                </Form.Item>
                <Form.Item name="paymentStatus" label="Payment status">
                  <Select options={['Pending', 'Paid', 'Refunded', 'Failed'].map((s) => ({ value: s }))} />
                </Form.Item>
                <Form.Item name="courier" label="Courier"><Input placeholder="Shiprocket · Delhivery" /></Form.Item>
                <Form.Item name="awb" label="AWB / tracking number"><Input placeholder="e.g. SR700012345" /></Form.Item>
                <Form.Item name="note" label="Note (shown in history)"><Input.TextArea rows={2} /></Form.Item>
                <Button type="primary" htmlType="submit" block loading={saving}>Save changes</Button>
              </Form>
            </Pane>
            <Pane>
              <h4 className="mb-3 font-sans text-sm font-semibold">Status history</h4>
              <ol className="m-0 list-none space-y-3 border-l-2 border-terra/50 p-0 pl-4">
                {[...order.statusHistory].reverse().map((h, k) => (
                  <li key={k} className="relative">
                    <span className="absolute -left-[23px] top-1 h-3 w-3 rounded-full bg-terra-dark ring-4 ring-white" />
                    <p className="text-sm font-medium">{h.status}</p>
                    <p className="text-xs text-char/50">{dateTime(h.at)}{h.note ? ` — ${h.note}` : ''}</p>
                  </li>
                ))}
              </ol>
            </Pane>
          </div>
        </div>
      </div>
    </>
  );
}

function Row({ l, v }: { l: string; v: string }) {
  return (
    <div className="flex justify-between text-char/70">
      <span>{l}</span>
      <span>{v}</span>
    </div>
  );
}
