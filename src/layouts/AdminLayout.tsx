import {
  AppstoreOutlined,
  BellOutlined,
  CustomerServiceOutlined,
  DashboardOutlined,
  FolderOpenOutlined,
  GlobalOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MessageOutlined,
  SettingOutlined,
  ShoppingOutlined,
  TagsOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar, Badge, Drawer, Dropdown, Grid, Layout, Menu, type MenuProps } from 'antd';
import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { WEBSITE_URL } from '@/api/client';
import LogoMark from '@/components/LogoMark';
import { useAuth } from '@/store/authStore';
import { useCounts } from '@/store/countsStore';

const { Sider, Header, Content } = Layout;

const titles: Record<string, string> = {
  '/': 'Dashboard',
  '/orders': 'Orders',
  '/products': 'Products',
  '/collections': 'Collections',
  '/customers': 'Customers',
  '/coupons': 'Coupons',
  '/inquiries': 'Contact Enquiries',
  '/tickets': 'Chat Requests',
  '/settings': 'Settings',
};

export default function AdminLayout() {
  const { token, user, logout } = useAuth();
  const { counts, refresh } = useCounts();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const screens = Grid.useBreakpoint();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = !screens.lg;

  useEffect(() => {
    if (!token) return;
    refresh();
    const t = setInterval(refresh, 30000);
    return () => clearInterval(t);
  }, [token, refresh]);

  if (!token) return <Navigate to={`/login?redirect=${encodeURIComponent(pathname)}`} replace />;

  const badge = (n: number) => (n > 0 ? <Badge count={n} size="small" className="ml-auto" /> : null);
  const label = (text: string, n?: number) => (
    <span className="flex items-center gap-2">
      {text}
      {n !== undefined && badge(n)}
    </span>
  );

  // In the collapsed rail, group titles become thin dividers instead of truncated text
  const railCollapsed = collapsed && !isMobile;
  const group = (title: string, children: NonNullable<MenuProps['items']>): NonNullable<MenuProps['items']> =>
    railCollapsed
      ? [{ type: 'divider', style: { borderColor: 'rgba(255,255,255,.12)', margin: '10px 12px' } }, ...children]
      : [{ type: 'group', label: <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">{title}</span>, children }];

  const items: MenuProps['items'] = [
    { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
    ...group('Store', [
      { key: '/orders', icon: <ShoppingOutlined />, label: label('Orders', counts.orders) },
      { key: '/products', icon: <AppstoreOutlined />, label: label('Products', counts.lowStock) },
      { key: '/collections', icon: <FolderOpenOutlined />, label: 'Collections' },
      { key: '/customers', icon: <TeamOutlined />, label: 'Customers' },
      { key: '/coupons', icon: <TagsOutlined />, label: 'Coupons' },
    ]),
    ...group('Inbox', [
      { key: '/inquiries', icon: <MessageOutlined />, label: label('Contact Enquiries', counts.inquiries) },
      { key: '/tickets', icon: <CustomerServiceOutlined />, label: label('Chat Requests', counts.tickets) },
    ]),
    ...group('Account', [{ key: '/settings', icon: <SettingOutlined />, label: 'Settings' }]),
  ];

  const selected = '/' + (pathname.split('/')[1] ?? '');
  const go: MenuProps['onClick'] = ({ key }) => {
    navigate(key);
    setMobileOpen(false);
  };

  const sidebar = (
    <>
      {collapsed && !isMobile ? (
        <div className="flex h-16 items-center justify-center">
          <LogoMark size={46} variant="mark" light />
        </div>
      ) : (
        <div className="px-4 pb-2 pt-4 text-center">
          <LogoMark size={140} light className="mx-auto" />
          <span className="mt-2 block text-[9px] uppercase tracking-[0.3em] text-terra">Admin Studio</span>
        </div>
      )}
      <Menu theme="dark" mode="inline" selectedKeys={[selected]} items={items} onClick={go} className="no-scrollbar flex-1 overflow-y-auto border-0 px-2" />
      <a href={WEBSITE_URL} target="_blank" rel="noreferrer" className="m-3 flex items-center gap-2 rounded-xl bg-white/5 px-4 py-3 text-sm text-white/70 hover:bg-white/10 hover:text-white">
        <GlobalOutlined /> {(!collapsed || isMobile) && 'View website'}
      </a>
    </>
  );

  const userMenu: MenuProps['items'] = [
    { key: 'settings', icon: <UserOutlined />, label: 'Profile & settings' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true },
  ];
  const notifMenu: MenuProps['items'] = [
    { key: '/orders', label: `${counts.orders} new orders to pack` },
    { key: '/inquiries', label: `${counts.inquiries} new contact enquiries` },
    { key: '/tickets', label: `${counts.tickets} open chat requests` },
    { key: '/products?stock=low', label: `${counts.lowStock} products low on stock` },
  ];

  return (
    <Layout className="min-h-screen">
      {isMobile ? (
        <Drawer placement="left" open={mobileOpen} onClose={() => setMobileOpen(false)} width={230} styles={{ body: { padding: 0, background: '#3A1507', display: 'flex', flexDirection: 'column' }, header: { display: 'none' } }}>
          {sidebar}
        </Drawer>
      ) : (
        <Sider width={220} collapsedWidth={68} collapsed={collapsed} className="!fixed left-0 top-0 z-20 h-screen">
          {sidebar}
        </Sider>
      )}

      <Layout style={{ marginLeft: isMobile ? 0 : collapsed ? 68 : 220, transition: 'margin .2s' }}>
        <Header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-3 border-b border-black/5 !px-4 md:!px-6">
          <div className="flex min-w-0 items-center gap-2">
            <button
              onClick={() => (isMobile ? setMobileOpen(true) : setCollapsed(!collapsed))}
              className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border-0 bg-transparent text-lg text-char hover:bg-black/5"
              aria-label="Toggle menu"
            >
              {collapsed || isMobile ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </button>
            <span className="truncate text-sm font-semibold text-char">{titles[selected] ?? ''}</span>
          </div>
          <div className="flex items-center gap-2">
            <Dropdown menu={{ items: notifMenu, onClick: ({ key }) => navigate(key) }} trigger={['click']} placement="bottomRight">
              <button className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border-0 bg-transparent hover:bg-black/5" aria-label="Notifications">
                <Badge count={counts.orders + counts.inquiries + counts.tickets} size="small">
                  <BellOutlined className="text-lg text-char" />
                </Badge>
              </button>
            </Dropdown>
            <Dropdown
              menu={{ items: userMenu, onClick: ({ key }) => (key === 'logout' ? (logout(), navigate('/login')) : navigate('/settings')) }}
              trigger={['click']}
              placement="bottomRight"
            >
              <button className="flex cursor-pointer items-center gap-2 rounded-xl border-0 bg-transparent px-2 py-1 hover:bg-black/5">
                <Avatar className="bg-terra-dark text-white">{user?.name?.[0] ?? 'A'}</Avatar>
                <span className="hidden text-left leading-tight sm:block">
                  <span className="block text-sm font-medium text-char">{user?.name}</span>
                  <span className="block text-xs text-char/50">Administrator</span>
                </span>
              </button>
            </Dropdown>
          </div>
        </Header>
        <Content className="p-4 md:p-6">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
