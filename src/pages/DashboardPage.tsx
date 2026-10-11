import {
  AppstoreOutlined,
  CloseCircleOutlined,
  CustomerServiceOutlined,
  MessageOutlined,
  RiseOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  WalletOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Button, Segmented, Skeleton, Table, message } from 'antd';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api, assetUrl } from '@/api/client';
import { CATEGORIES, LINES, PAYMENT } from '@/api/types';
import { PageTitle, StatCard, StatusTag } from '@/components/ui';
import { brand } from '@/config/theme';
import { useAuth } from '@/store/authStore';
import { compactInr, date, inr } from '@/utils/format';

interface Dashboard {
  cards: Record<string, number>;
  charts: {
    daily: { date: string; sales: number; orders: number }[];
    monthly: { month: string; sales: number; orders: number }[];
    byLine: { line: keyof typeof LINES; sold: number; products: number }[];
    byCategory: { category: string; sold: number; products: number }[];
    byPayment: { method: string; count: number; total: number }[];
    statusBreakdown: { status: string; count: number }[];
  };
  topProducts: { _id: string; name: string; images: string[]; soldCount: number; price: number; stock: number; category: string }[];
  recentOrders: { id: string; name: string; total: number; status: string; date: string }[];
}

const axis = { fontSize: 11, fill: '#8a8580' };
const tooltipStyle = { borderRadius: 12, border: '1px solid #eee', boxShadow: '0 8px 24px -12px rgba(0,0,0,.2)', fontSize: 12 };
const pieColors = [brand.terraDark, brand.gold, brand.cocoaDark, brand.rose];

export default function DashboardPage() {
  const user = useAuth((s) => s.user);
  const [data, setData] = useState<Dashboard | null>(null);
  const [metric, setMetric] = useState<'sales' | 'orders'>('sales');

  const load = () =>
    api<Dashboard>('/dashboard')
      .then(setData)
      .catch((e) => message.error(e.message));
  useEffect(() => {
    load();
  }, []);

  if (!data) return <Skeleton active paragraph={{ rows: 12 }} />;
  const c = data.cards;
  const fmt = (v: number) => (metric === 'sales' ? inr(v) : `${v} orders`);
  const hour = new Date().getHours();

  return (
    <>
      <PageTitle
        title={`Good ${hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'}, ${user?.name?.split(' ')[0] ?? 'Admin'}`}
        subtitle="Here’s what’s glowing at Jyotessa today."
        extra={<Button onClick={load}>Refresh</Button>}
      />

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Today's sales" value={inr(c.todaySales)} hint={`${c.todayOrders} orders today`} icon={<RiseOutlined />} tone="terra" />
        <StatCard label="Total sales" value={inr(c.totalSales)} hint="Excluding cancelled" icon={<WalletOutlined />} tone="cocoa" />
        <Link to="/orders"><StatCard label="Orders" value={c.orders} hint={`${c.pendingOrders} not yet delivered`} icon={<ShoppingCartOutlined />} tone="gold" /></Link>
        <Link to="/customers"><StatCard label="Customers" value={c.customers} hint="Accounts from Sign up" icon={<TeamOutlined />} tone="char" /></Link>
        <Link to="/products"><StatCard label="Products" value={c.products} icon={<AppstoreOutlined />} tone="cocoa" /></Link>
        <Link to="/products?stock=low"><StatCard label="Low stock" value={c.lowStock} hint="Under 10 pieces" icon={<WarningOutlined />} tone="gold" /></Link>
        <Link to="/orders?status=Order Placed"><StatCard label="To pack" value={c.pendingOrders} hint="Placed → out for delivery" icon={<ShoppingCartOutlined />} tone="terra" /></Link>
        <StatCard label="Cancelled" value={c.cancelledOrders} icon={<CloseCircleOutlined />} tone="char" />
      </div>

      {/* Inbox strip */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[
          { to: '/inquiries', label: 'New contact enquiries', v: c.newInquiries, icon: <MessageOutlined /> },
          { to: '/tickets', label: 'Open chat requests', v: c.openTickets, icon: <CustomerServiceOutlined /> },
        ].map((x) => (
          <Link key={x.to} to={x.to} className="flex items-center gap-3 rounded-2xl border border-terra/40 bg-terra-soft px-4 py-3 transition hover:border-terra-dark">
            <span className="text-lg text-terra-dark">{x.icon}</span>
            <span className="text-sm text-char/70">{x.label}</span>
            <span className="ml-auto text-lg font-semibold text-char">{x.v}</span>
          </Link>
        ))}
      </div>

      {/* Charts */}
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <div className="panel xl:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-lg">Last 30 days</h3>
              <p className="text-xs text-char/50">{metric === 'sales' ? 'Daily sales (₹)' : 'Daily orders'}</p>
            </div>
            <Segmented size="small" value={metric} onChange={(v) => setMetric(v as 'sales' | 'orders')} options={[{ label: 'Sales', value: 'sales' }, { label: 'Orders', value: 'orders' }]} />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.charts.daily} margin={{ left: -10, right: 8, top: 5 }}>
              <defs>
                <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={brand.terraDark} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={brand.terraDark} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#f0ebe6" />
              <XAxis dataKey="date" tick={axis} tickLine={false} axisLine={false} tickFormatter={(d) => d.slice(8)} minTickGap={16} />
              <YAxis tick={axis} tickLine={false} axisLine={false} tickFormatter={(v) => (metric === 'sales' ? compactInr(v) : v)} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={(d) => date(d)} formatter={(v: number) => [fmt(v), metric === 'sales' ? 'Sales' : 'Orders']} cursor={{ stroke: '#ccc', strokeDasharray: 4 }} />
              <Area type="monotone" dataKey={metric} stroke={brand.terraDark} strokeWidth={2} fill="url(#fillSales)" activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="panel">
          <h3 className="text-lg">Orders by status</h3>
          <p className="mb-3 text-xs text-char/50">All time</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={[...data.charts.statusBreakdown].sort((a, b) => b.count - a.count)} layout="vertical" margin={{ left: 10, right: 16 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="status" tick={axis} tickLine={false} axisLine={false} width={110} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#faf5f1' }} formatter={(v: number) => [v, 'Orders']} />
              <Bar dataKey="count" fill={brand.cocoaDark} radius={[0, 4, 4, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel xl:col-span-2">
          <h3 className="text-lg">Monthly sales</h3>
          <p className="mb-3 text-xs text-char/50">Last 12 months (₹)</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.charts.monthly} margin={{ left: -10, right: 8 }}>
              <CartesianGrid vertical={false} stroke="#f0ebe6" />
              <XAxis dataKey="month" tick={axis} tickLine={false} axisLine={false} />
              <YAxis tick={axis} tickLine={false} axisLine={false} tickFormatter={compactInr} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#faf5f1' }} formatter={(v: number) => [inr(v), 'Sales']} />
              <Bar dataKey="sales" fill={brand.terraDark} radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel">
          <h3 className="text-lg">Payment methods</h3>
          <p className="mb-1 text-xs text-char/50">Share of orders</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={data.charts.byPayment} dataKey="count" nameKey="method" innerRadius={48} outerRadius={78} paddingAngle={2} stroke="none">
                {data.charts.byPayment.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number, n: string) => [`${v} orders`, PAYMENT[n] ?? n]} />
            </PieChart>
          </ResponsiveContainer>
          <ul className="m-0 mt-1 list-none space-y-1 p-0 text-sm">
            {data.charts.byPayment.map((p, i) => (
              <li key={p.method} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: pieColors[i % pieColors.length] }} />
                {PAYMENT[p.method] ?? p.method}
                <span className="ml-auto text-char/60">{p.count} · {inr(p.total)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel xl:col-span-2">
          <h3 className="text-lg">Units sold by category</h3>
          <p className="mb-3 text-xs text-char/50">
            {data.charts.byLine.map((l) => `${LINES[l.line] ?? l.line}: ${l.sold} sold`).join(' · ')}
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.charts.byCategory.map((x) => ({ ...x, label: CATEGORIES[x.category] ?? x.category }))} margin={{ left: -10, right: 8 }}>
              <CartesianGrid vertical={false} stroke="#f0ebe6" />
              <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} interval={0} />
              <YAxis tick={axis} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#faf5f1' }} formatter={(v: number) => [v, 'Units sold']} />
              <Bar dataKey="sold" fill={brand.gold} radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel">
          <h3 className="mb-3 text-lg">Top products</h3>
          <ul className="m-0 list-none space-y-3 p-0">
            {data.topProducts.map((p, i) => (
              <li key={p._id} className="flex items-center gap-3">
                <span className="w-4 text-xs text-char/40">{i + 1}</span>
                <img src={assetUrl(p.images[0])} alt="" className="h-11 w-11 rounded-lg object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{p.name}</span>
                  <span className="text-xs text-char/50">{CATEGORIES[p.category] ?? p.category} · {p.stock} in stock</span>
                </span>
                <span className="text-sm font-semibold">{p.soldCount} sold</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="panel mt-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg">Recent orders</h3>
          <Link to="/orders" className="text-sm text-terra-dark">View all</Link>
        </div>
        <Table
          size="small"
          rowKey="id"
          pagination={false}
          dataSource={data.recentOrders}
          scroll={{ x: 500 }}
          columns={[
            { title: 'Order', dataIndex: 'id', render: (id) => <Link to={`/orders/${id}`} className="font-medium text-terra-dark">#{id}</Link> },
            { title: 'Customer', dataIndex: 'name' },
            { title: 'Date', dataIndex: 'date', render: date },
            { title: 'Total', dataIndex: 'total', align: 'right', render: inr },
            { title: 'Status', dataIndex: 'status', render: (s) => <StatusTag status={s} /> },
          ]}
        />
      </div>
    </>
  );
}
