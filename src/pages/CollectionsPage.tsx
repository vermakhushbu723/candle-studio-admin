import { DeleteOutlined, EyeOutlined, FolderOpenOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import { Button, ColorPicker, Form, Input, InputNumber, Popconfirm, Select, Skeleton, Switch, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { api, assetUrl, WEBSITE_URL } from '@/api/client';
import type { Collection, Product } from '@/api/types';
import MasterDetail, { Avatar, DetailHeader, Pane } from '@/components/MasterDetail';
import { inr } from '@/utils/format';

const NEW = '__new';
const TYPES = [
  { value: 'festive', label: 'Festive (Diwali, Valentine, Christmas…)' },
  { value: 'curated', label: 'Curated (Winter, Ocean, Spiritual…)' },
];

/** Seasonal & curated collections — what the website's collection tiles and shop menu show. */
export default function CollectionsPage() {
  const [all, setAll] = useState<Collection[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [chip, setChip] = useState('All');
  const [selected, setSelected] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [c, p] = await Promise.all([api<{ items: Collection[] }>('/collections'), api<{ items: Product[] }>('/products', { query: { limit: 100 } })]);
      setAll(c.items);
      setProducts(p.items);
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const items = useMemo(
    () =>
      all.filter(
        (c) =>
          (chip === 'All' || (chip === 'Festive' && c.type === 'festive') || (chip === 'Curated' && c.type === 'curated') || (chip === 'Hidden' && !c.isActive)) &&
          (!q || `${c.name} ${c.slug}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [all, chip, q],
  );

  return (
    <MasterDetail<Collection>
      title="Collections"
      icon={<FolderOpenOutlined />}
      items={items}
      total={items.length}
      page={1}
      limit={Math.max(items.length, 5)}
      loading={loading}
      onPage={() => undefined}
      onRefresh={load}
      onSearch={setQ}
      getKey={(c) => c._id}
      searchPlaceholder="Search collections…"
      chips={{ options: ['All', 'Festive', 'Curated', 'Hidden'], value: chip, onChange: (v) => { setChip(v); setSelected(null); } }}
      actions={<Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => setSelected(NEW)}>New collection</Button>}
      selectedKey={selected}
      onSelect={setSelected}
      renderRow={(c) => ({
        avatar: <Avatar src={assetUrl(c.image)} text={c.name} />,
        title: c.name,
        meta: `${c.type} · /${c.slug}${c.isActive ? '' : ' · hidden'}`,
        preview: c.description,
        badge: <span className="rounded-full bg-terra-soft px-2 py-0.5 text-[11px] font-semibold text-terra-dark">{c.productCount} products</span>,
      })}
      renderDetail={(key) => (
        <CollectionEditor
          key={key}
          id={key === NEW ? null : key}
          products={products}
          onSaved={async (id) => {
            await load();
            setSelected(id);
          }}
          onDeleted={async () => {
            await load();
            setSelected(null);
          }}
        />
      )}
    />
  );
}

function CollectionEditor({ id, products, onSaved, onDeleted }: { id: string | null; products: Product[]; onSaved: (id: string) => void; onDeleted: () => void }) {
  const [form] = Form.useForm();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [initial, setInitial] = useState<Record<string, unknown>>({ type: 'festive', isActive: true, sortOrder: 0, tone: '#F3E4D4', productIds: [] });

  useEffect(() => {
    if (!id) return;
    api<{ collection: Collection; products: { slug: string }[] }>(`/collections/${id}`)
      .then((r) => {
        setCollection(r.collection);
        setInitial({ ...r.collection, productIds: r.products.map((p) => p.slug) });
      })
      .catch((e) => message.error(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const save = async (v: Record<string, unknown>) => {
    setSaving(true);
    const tone = typeof v.tone === 'string' ? v.tone : (v.tone as { toHexString?: () => string })?.toHexString?.() ?? '#F3E4D4';
    const body = { ...v, tone, sortOrder: v.sortOrder ?? 0 };
    try {
      const r = id
        ? await api<{ collection: Collection }>(`/collections/${id}`, { method: 'PUT', body })
        : await api<{ collection: Collection }>('/collections', { method: 'POST', body });
      message.success(id ? 'Collection updated' : 'Collection created — it is live on the website');
      onSaved(r.collection._id);
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await api(`/collections/${id}`, { method: 'DELETE' });
      message.success('Collection deleted (its products are kept)');
      onDeleted();
    } catch (e) {
      message.error((e as Error).message);
    }
  };

  const chosen: string[] = Form.useWatch('productIds', form) ?? [];
  const image: string | undefined = Form.useWatch('image', form);
  const tone = Form.useWatch('tone', form);
  const toneHex = typeof tone === 'string' ? tone : tone?.toHexString?.();
  if (loading) return <div className="p-6"><Skeleton active avatar paragraph={{ rows: 8 }} /></div>;

  return (
    <>
      <DetailHeader
        avatar={<Avatar src={assetUrl(collection?.image)} text={collection?.name ?? 'New'} />}
        title={collection?.name ?? 'New collection'}
        subtitle={collection ? `/shop?category=${collection.slug} · ${chosen.length} products` : 'e.g. Diwali Collection, Valentine Collection, Winter Collection'}
        extra={
          <>
            {collection && (
              <a href={`${WEBSITE_URL}/shop?category=${collection.slug}`} target="_blank" rel="noreferrer"><Button icon={<EyeOutlined />} title="View on website" /></a>
            )}
            {collection && (
              <Popconfirm title="Delete this collection?" description="Products stay in the shop; they just leave this collection." onConfirm={remove}>
                <Button danger icon={<DeleteOutlined />} />
              </Popconfirm>
            )}
            <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={() => form.submit()}>Save</Button>
          </>
        }
      />
      <div className="p-4 md:p-5">
        <Form key={collection?._id ?? 'new'} form={form} initialValues={initial} layout="vertical" onFinish={save} requiredMark={false} className="space-y-4">
          <Pane className="grid gap-x-4 sm:grid-cols-2">
            <Form.Item name="name" label="Collection name" rules={[{ required: true, min: 2 }]}><Input placeholder="Diwali Collection" /></Form.Item>
            {!collection ? (
              <Form.Item name="slug" label="URL slug (optional)" extra="Auto-generated from the name; can’t be changed later" rules={[{ pattern: /^[a-z0-9-]+$/, message: 'lowercase letters, numbers and dashes' }]}>
                <Input placeholder="diwali-special" />
              </Form.Item>
            ) : (
              <Form.Item label="URL slug"><Input value={collection.slug} disabled /></Form.Item>
            )}
            <Form.Item name="type" label="Type" extra="Festive collections appear under “Festive Specials” in the shop menu"><Select options={TYPES} /></Form.Item>
            <Form.Item name="sortOrder" label="Sort order"><InputNumber className="w-full" /></Form.Item>
            <Form.Item name="description" label="Description" className="sm:col-span-2"><Input.TextArea rows={2} /></Form.Item>
            <Form.Item name="image" label="Cover image URL" extra="e.g. /images/products/festive-diya-set-1.webp"><Input /></Form.Item>
            <Form.Item name="tone" label="Tile colour"><ColorPicker showText /></Form.Item>
            <Form.Item name="isActive" label="Live on website" valuePropName="checked" className="mb-0"><Switch /></Form.Item>
            {!collection && (
              <Form.Item name="notify" label="Notify customers" valuePropName="checked" className="mb-0" tooltip="Sends a push notification + email to customers who want offer updates, as soon as you save.">
                <Switch />
              </Form.Item>
            )}
          </Pane>

          {image && (
            <Pane className="flex items-center gap-4" >
              <div className="h-28 w-28 overflow-hidden rounded-2xl" style={{ background: toneHex }}>
                <img src={assetUrl(image)} alt="" className="h-full w-full object-cover" />
              </div>
              <p className="text-sm text-char/60">Tile preview on the website’s “Collections” grid.</p>
            </Pane>
          )}

          <Pane>
            <Form.Item name="productIds" label={`Products in this collection (${chosen.length})`} className="mb-3">
              <Select
                mode="multiple"
                showSearch
                optionFilterProp="label"
                placeholder="Search and add products…"
                options={products.map((p) => ({ value: p.slug, label: p.name }))}
              />
            </Form.Item>
            <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
              {chosen.map((slug) => {
                const p = products.find((x) => x.slug === slug);
                if (!p) return null;
                return (
                  <li key={slug} className="flex items-center gap-3 rounded-xl border border-black/5 bg-white p-2">
                    <img src={assetUrl(p.images[0])} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{p.name}</span>
                      <span className="text-xs text-char/50">{inr(p.price)} · {p.stock} in stock{p.isActive ? '' : ' · hidden'}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </Pane>
        </Form>
      </div>
    </>
  );
}
