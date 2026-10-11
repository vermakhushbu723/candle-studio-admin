# Jyotessa Admin (candle-studio-admin)

React + TypeScript + Ant Design admin panel for the Jyotessa store.

```bash
npm install
cp .env.example .env   # VITE_API_URL (backend) + VITE_WEBSITE_URL (storefront, used for product photos)
npm run dev            # http://localhost:5180
```

Needs `candle-studio-backend` running on port 5050.

## Pages

Sidebar: Dashboard · Orders · Products · Customers · Coupons · Contact Enquiries · Chat Requests · Settings.
Navbar: menu toggle, page title, notification bell (new orders / enquiries / chat requests / low stock), profile menu with logout.

- **Dashboard** — sales/order KPIs, 30-day and monthly charts, payment split, units by category, top products, recent orders.
- **Orders** — every checkout from the website; update status (drives the website's Track Order page), payment status, courier/AWB; CSV export.
- **Products** — full catalogue editor; changes appear on the website immediately. Hide with “Live on website”.
- **Customers** — accounts from the Sign up form, their orders, block/unblock.
- **Coupons** — codes used in the cart/checkout coupon box.
- **Contact Enquiries** — Contact page form, with status + internal notes.
- **Chat Requests** — support chatbot “Leave us a message” form, with status + internal notes.
- **Settings** — profile, password, system info.
