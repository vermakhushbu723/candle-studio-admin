import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { Alert, Button, Form, Input } from 'antd';
import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { api, assetUrl } from '@/api/client';
import LogoMark from '@/components/LogoMark';
import { useAuth, type AdminUser } from '@/store/authStore';

export default function LoginPage() {
  const { token, setSession } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (token) return <Navigate to="/" replace />;

  const onFinish = async (v: { email: string; password: string }) => {
    setLoading(true);
    setError('');
    try {
      const r = await api<{ token: string; user: AdminUser }>('/login', { method: 'POST', body: v });
      setSession(r.token, r.user);
      navigate(params.get('redirect') || '/', { replace: true });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-char lg:block">
        <img src={assetUrl('/images/site/hero-candle.webp')} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-char via-char/40 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <LogoMark size={170} light />
          <h2 className="mt-6 text-4xl text-white">Every order, enquiry and candle — in one studio.</h2>
          <p className="mt-3 max-w-md text-white/70">Manage products, orders, customers, coupons, contact enquiries and chat requests for Jyotessa.</p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-cream p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <LogoMark size={150} />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-terra-dark">Admin Studio</p>
          <h1 className="mt-2 text-3xl">Welcome back</h1>
          <p className="mb-7 mt-1 text-sm text-char/55">Sign in to manage your store.</p>

          {error && <Alert type="error" message={error} showIcon className="mb-4" />}
          <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
            <Form.Item name="email" normalize={(v?: string) => v?.replace(/\s+/g, '')} label="Email" rules={[{ required: true, type: 'email' }]}>
              <Input size="large" prefix={<MailOutlined className="text-char/40" />} autoComplete="username" />
            </Form.Item>
            <Form.Item name="password" label="Password" rules={[{ required: true }]}>
              <Input.Password size="large" prefix={<LockOutlined className="text-char/40" />} autoComplete="current-password" />
            </Form.Item>
            <Button type="primary" htmlType="submit" size="large" block loading={loading}>
              Sign in
            </Button>
          </Form>
        </div>
      </div>
    </div>
  );
}
