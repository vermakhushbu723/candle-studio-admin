import { ApiOutlined, CarOutlined, GiftOutlined, LockOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Form, Input, message } from 'antd';
import type { ReactNode } from 'react';
import { api, API_URL, WEBSITE_URL } from '@/api/client';
import MasterDetail, { DetailHeader, Pane } from '@/components/MasterDetail';
import ShippingSettings from '@/components/ShippingSettings';
import FollowOfferSettings from '@/components/FollowOfferSettings';
import { Field } from '@/components/ui';
import { useAuth, type AdminUser } from '@/store/authStore';

interface Section {
  key: string;
  title: string;
  preview: string;
  icon: ReactNode;
}

const sections: Section[] = [
  { key: 'shipping', title: 'Shipping charges', preview: 'Delivery fee & free-shipping limit', icon: <CarOutlined /> },
  { key: 'follow', title: 'Follow & Save offer', preview: 'Footer QR code · follow us for a coupon', icon: <GiftOutlined /> },
  { key: 'profile', title: 'Profile', preview: 'Name, email and phone', icon: <UserOutlined /> },
  { key: 'password', title: 'Password & security', preview: 'Change your admin password', icon: <LockOutlined /> },
  { key: 'system', title: 'System', preview: 'API, storefront & role', icon: <ApiOutlined /> },
];

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const [pwForm] = Form.useForm();

  const saveProfile = async (v: Partial<AdminUser>) => {
    try {
      const r = await api<{ user: AdminUser }>('/me', { method: 'PUT', body: v });
      setUser(r.user);
      message.success('Profile updated');
    } catch (e) {
      message.error((e as Error).message);
    }
  };

  const changePassword = async (v: { current: string; next: string }) => {
    try {
      await api('/password', { method: 'PUT', body: { current: v.current, next: v.next } });
      message.success('Password changed');
      pwForm.resetFields();
    } catch (e) {
      message.error((e as Error).message);
    }
  };

  const icon = (n: ReactNode) => <span className="flex h-11 w-11 items-center justify-center rounded-full bg-cocoa-light text-lg text-cocoa-dark">{n}</span>;

  return (
    <MasterDetail<Section>
      title="Settings"
      icon={<SettingOutlined />}
      items={sections}
      total={sections.length}
      page={1}
      limit={sections.length}
      loading={false}
      onPage={() => undefined}
      onRefresh={() => undefined}
      onSearch={() => undefined}
      searchPlaceholder="Search settings…"
      getKey={(s) => s.key}
      renderRow={(s) => ({ avatar: icon(s.icon), title: s.title, preview: s.preview })}
      renderDetail={(key) => {
        const s = sections.find((x) => x.key === key)!;
        return (
          <>
            <DetailHeader avatar={icon(s.icon)} title={s.title} subtitle={s.preview} />
            <div className="p-4 md:p-5">
              {key === 'profile' && (
                <Pane className="max-w-xl">
                  <Form layout="vertical" initialValues={user ?? {}} onFinish={saveProfile} requiredMark={false}>
                    <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="email" normalize={(v?: string) => v?.replace(/\s+/g, '')} label="Email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
                    <Form.Item name="phone" label="Mobile" rules={[{ pattern: /^[6-9]\d{9}$/, message: '10-digit mobile number' }]}><Input addonBefore="+91" maxLength={10} /></Form.Item>
                    <Button type="primary" htmlType="submit">Save profile</Button>
                  </Form>
                </Pane>
              )}
              {key === 'password' && (
                <Pane className="max-w-xl">
                  <Form form={pwForm} layout="vertical" onFinish={changePassword} requiredMark={false}>
                    <Form.Item name="current" label="Current password" rules={[{ required: true }]}><Input.Password /></Form.Item>
                    <Form.Item name="next" label="New password" rules={[{ required: true, min: 6 }]}><Input.Password /></Form.Item>
                    <Form.Item
                      name="confirm"
                      label="Confirm new password"
                      dependencies={['next']}
                      rules={[{ required: true }, ({ getFieldValue }) => ({ validator: (_, v) => (!v || v === getFieldValue('next') ? Promise.resolve() : Promise.reject(new Error('Passwords do not match'))) })]}
                    >
                      <Input.Password />
                    </Form.Item>
                    <Button type="primary" htmlType="submit">Update password</Button>
                  </Form>
                </Pane>
              )}
              {key === 'shipping' && <ShippingSettings />}
              {key === 'follow' && <FollowOfferSettings />}
              {key === 'system' && (
                <Pane className="grid max-w-2xl gap-4 sm:grid-cols-3">
                  <Field label="API endpoint">{API_URL}</Field>
                  <Field label="Storefront">{WEBSITE_URL}</Field>
                  <Field label="Role"><span className="capitalize">{user?.role}</span></Field>
                </Pane>
              )}
            </div>
          </>
        );
      }}
    />
  );
}
