import { DownloadOutlined, ShoppingOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { assetUrl } from '@/api/client';
import { PAYMENT, type Order } from '@/api/types';
import MasterDetail, { fromList } from '@/components/MasterDetail';
import { StatusTag } from '@/components/ui';
import { useList } from '@/hooks/useList';
import { date, downloadCsv, inr, shortTime } from '@/utils/format';
import OrderDetail from './OrderDetailPage';

const chips = ['All', 'Payment Pending', 'Order Placed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

export default function OrdersPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const initialStatus = chips.includes(params.get('status') ?? '') ? params.get('status')! : 'All';
  const list = useList<Order>('/orders', { status: initialStatus === 'All' ? undefined : initialStatus });
  const [status, setStatus] = useState(initialStatus);
  const [selected, setSelected] = useState<string | null>(id ?? null);

  const select = (key: string | null) => {
    setSelected(key);
    if (key) navigate(`/orders/${key}`, { replace: true });
  };

  const exportCsv = () =>
    downloadCsv(
      'orders.csv',
      list.items.map((o) => ({
        order: o.id, date: date(o.date), customer: o.customer.name, email: o.customer.email, phone: o.customer.phone, city: o.address.city,
        items: o.items.reduce((s, i) => s + i.quantity, 0), total: o.total, payment: PAYMENT[o.paymentMethod], paymentStatus: o.paymentStatus, status: o.status,
      })),
    );

  return (
    <MasterDetail<Order>
      title="Orders"
      icon={<ShoppingOutlined />}
      {...fromList(list)}
      getKey={(o) => o.id}
      searchPlaceholder="Order ID, name, email, phone, city…"
      chips={{
        options: chips,
        value: status,
        onChange: (v) => {
          setStatus(v);
          setSelected(null);
          list.update({ status: v === 'All' ? undefined : v });
        },
      }}
      actions={<Button size="small" icon={<DownloadOutlined />} onClick={exportCsv}>Export CSV</Button>}
      selectedKey={selected}
      onSelect={select}
      renderRow={(o) => ({
        avatar: (
          <span className="relative block h-11 w-11">
            <img src={assetUrl(o.items[0]?.image)} alt="" className="h-11 w-11 rounded-full object-cover" />
            {o.items.length > 1 && <span className="absolute -bottom-1 -right-1 rounded-full bg-char px-1.5 text-[10px] text-white">+{o.items.length - 1}</span>}
          </span>
        ),
        title: o.customer.name,
        meta: `#${o.id} · ${o.address.city} · ${PAYMENT[o.paymentMethod]}`,
        preview: o.items.map((i) => i.name).join(', '),
        time: shortTime(o.date),
        badge: (
          <span className="flex items-center gap-2">
            <span className="text-xs font-semibold text-char">{inr(o.total)}</span>
            <StatusTag status={o.status} />
          </span>
        ),
      })}
      renderDetail={(key) => <OrderDetail id={key} onChanged={list.reload} />}
    />
  );
}
