import { Result, Button } from 'antd';
import { createBrowserRouter, Link, RouterProvider } from 'react-router-dom';
import AdminLayout from '@/layouts/AdminLayout';
import CollectionsPage from '@/pages/CollectionsPage';
import CouponsPage from '@/pages/CouponsPage';
import CustomersPage from '@/pages/CustomersPage';
import DashboardPage from '@/pages/DashboardPage';
import InquiriesPage from '@/pages/InquiriesPage';
import LoginPage from '@/pages/LoginPage';
import NotificationsPage from '@/pages/NotificationsPage';
import OrdersPage from '@/pages/OrdersPage';
import ProductsPage from '@/pages/ProductsPage';
import SettingsPage from '@/pages/SettingsPage';
import TicketsPage from '@/pages/TicketsPage';

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <AdminLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'orders', element: <OrdersPage /> },
      { path: 'orders/:id', element: <OrdersPage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'collections', element: <CollectionsPage /> },
      { path: 'customers', element: <CustomersPage /> },
      { path: 'coupons', element: <CouponsPage /> },
      { path: 'inquiries', element: <InquiriesPage /> },
      { path: 'tickets', element: <TicketsPage /> },
      { path: 'notifications', element: <NotificationsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <Result status="404" title="Page not found" extra={<Link to="/"><Button type="primary">Back to dashboard</Button></Link>} /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
