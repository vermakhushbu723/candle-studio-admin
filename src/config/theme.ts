import type { ThemeConfig } from 'antd';

export const brand = { terra: '#E3A77C', terraDark: '#6C2408', cocoa: '#E3A77C', cocoaDark: '#8A3A16', char: '#3A1507', gold: '#C98A4B', rose: '#C47A5A' };

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: brand.terraDark,
    colorLink: brand.terraDark,
    colorWarning: brand.gold,
    colorTextHeading: brand.char,
    borderRadius: 12,
    fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
    fontSize: 13,
    controlHeight: 34,
  },
  components: {
    Layout: { siderBg: brand.char, headerBg: '#ffffff', bodyBg: '#f7f3ef' },
    Menu: {
      darkItemBg: brand.char,
      darkSubMenuItemBg: brand.char,
      darkItemSelectedBg: brand.terraDark,
      darkItemSelectedColor: '#ffffff',
      darkItemColor: 'rgba(255,255,255,.72)',
      darkItemHoverColor: '#fff',
      itemBorderRadius: 10,
    },
    Table: { headerBg: '#fbf6f1', headerColor: brand.char },
    Card: { borderRadiusLG: 16 },
  },
};

/** Colour per status for tags across all modules */
export const statusColor: Record<string, string> = {
  'Payment Pending': 'volcano',
  'Order Placed': 'default',
  Packed: 'cyan',
  Shipped: 'orange',
  'Out for Delivery': 'gold',
  Delivered: 'green',
  Cancelled: 'red',
  New: 'magenta',
  'In progress': 'blue',
  Resolved: 'green',
  Open: 'magenta',
  Closed: 'default',
  Pending: 'gold',
  Paid: 'green',
  Refunded: 'purple',
  Failed: 'red',
  Active: 'green',
  Paused: 'default',
  Expired: 'red',
};
