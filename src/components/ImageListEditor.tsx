import { ArrowLeftOutlined, ArrowRightOutlined, CloseOutlined, LinkOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Input, Space, Tooltip, message } from 'antd';
import { useRef, useState } from 'react';
import { assetUrl, uploadImage } from '@/api/client';

/**
 * Photo list for a product or a colour: upload several photos at once, reorder, remove or paste a URL.
 * The first photo is the cover. Works as an antd Form control (value / onChange).
 */
export default function ImageListEditor({ value = [], onChange, compact = false }: { value?: string[]; onChange?: (v: string[]) => void; compact?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [url, setUrl] = useState('');
  const set = (v: string[]) => onChange?.(v);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = [...files];
    setUploading(list.length);
    let next = [...value];
    for (const file of list) {
      try {
        next = [...next, await uploadImage(file)];
        set(next);
      } catch (e) {
        message.error(`${file.name}: ${(e as Error).message}`);
      }
      setUploading((n) => n - 1);
    }
    if (input.current) input.current.value = '';
  };

  const move = (i: number, d: number) => {
    const v = [...value];
    [v[i], v[i + d]] = [v[i + d], v[i]];
    set(v);
  };

  const addUrl = () => {
    const u = url.trim();
    if (!u) return;
    set([...value, u]);
    setUrl('');
  };

  const size = compact ? 'h-16 w-16' : 'h-28 w-24';
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map((src, i) => (
          <div key={`${src}-${i}`} className={`group relative ${size} shrink-0 overflow-hidden rounded-xl border border-black/10 bg-black/5`}>
            <img src={assetUrl(src)} alt="" className="h-full w-full object-cover" />
            {i === 0 && <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 text-[10px] font-semibold text-white">Cover</span>}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/55 opacity-0 transition group-hover:opacity-100">
              <Button size="small" type="text" className="!text-white" icon={<ArrowLeftOutlined />} disabled={i === 0} onClick={() => move(i, -1)} />
              <Button size="small" type="text" className="!text-white" icon={<CloseOutlined />} onClick={() => set(value.filter((_, j) => j !== i))} />
              <Button size="small" type="text" className="!text-white" icon={<ArrowRightOutlined />} disabled={i === value.length - 1} onClick={() => move(i, 1)} />
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={uploading > 0}
          className={`${size} flex shrink-0 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-black/15 text-xs text-black/50 transition hover:border-[#B5532A] hover:text-[#B5532A]`}
        >
          <UploadOutlined className="text-lg" />
          {uploading > 0 ? `Uploading ${uploading}…` : compact ? 'Add' : 'Upload photos'}
        </button>
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => onFiles(e.target.files)} />
      {!compact && (
        <Space.Compact className="w-full max-w-xl">
          <Input prefix={<LinkOutlined />} placeholder="…or paste an image URL / path" value={url} onChange={(e) => setUrl(e.target.value)} onPressEnter={(e) => (e.preventDefault(), addUrl())} />
          <Tooltip title="Add this URL"><Button onClick={addUrl}>Add</Button></Tooltip>
        </Space.Compact>
      )}
    </div>
  );
}
