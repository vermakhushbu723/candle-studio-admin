import { Button, Form, Input, InputNumber, Select, message } from 'antd';
import { useState } from 'react';
import { api } from '@/api/client';
import type { Note } from '@/api/types';
import { useCounts } from '@/store/countsStore';
import { dateTime } from '@/utils/format';

interface Props {
  path: string; // e.g. /inquiries/<id>
  status: string;
  statuses: string[];
  notes: Note[];
  withAmount?: number | null;
  onSaved: (item: unknown) => void;
}

/** Status select + internal notes timeline, shared by enquiries and quotes. */
export default function StatusNotesPanel({ path, status, statuses, notes, withAmount, onSaved }: Props) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const refreshCounts = useCounts((s) => s.refresh);

  const save = async (v: { status: string; note?: string; quotedAmount?: number }) => {
    setSaving(true);
    try {
      const r = await api<{ item: unknown }>(path, { method: 'PATCH', body: v });
      message.success('Saved');
      form.setFieldValue('note', '');
      onSaved(r.item);
      refreshCounts();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-6 rounded-2xl bg-[#faf7f5] p-4">
      <Form form={form} layout="vertical" onFinish={save} initialValues={{ status, quotedAmount: withAmount ?? undefined }} requiredMark={false}>
        <div className="grid gap-x-3 sm:grid-cols-2">
          <Form.Item name="status" label="Status"><Select options={statuses.map((s) => ({ value: s }))} /></Form.Item>
          {withAmount !== undefined && (
            <Form.Item name="quotedAmount" label="Quoted amount (₹)"><InputNumber min={0} className="w-full" /></Form.Item>
          )}
        </div>
        <Form.Item name="note" label="Add internal note"><Input.TextArea rows={2} placeholder="e.g. Called customer, sent catalogue on WhatsApp" /></Form.Item>
        <Button type="primary" htmlType="submit" loading={saving}>Save</Button>
      </Form>
      {notes.length > 0 && (
        <ul className="m-0 mt-4 list-none space-y-2 p-0">
          {[...notes].reverse().map((n, i) => (
            <li key={i} className="rounded-xl bg-white p-3 text-sm">
              <p>{n.text}</p>
              <p className="mt-1 text-xs text-char/45">{n.by} · {dateTime(n.at)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
