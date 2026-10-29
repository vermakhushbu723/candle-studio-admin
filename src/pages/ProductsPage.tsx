import { AppstoreOutlined, DeleteOutlined, EyeOutlined, MinusCircleOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import { Button, ColorPicker, Form, Input, InputNumber, Popconfirm, Select, Skeleton, Switch, message } from 'antd';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, assetUrl, WEBSITE_URL } from '@/api/client';
import { CATEGORIES, LINES, type Collection, type Product } from '@/api/types';
import ImageListEditor from '@/components/ImageListEditor';
import MasterDetail, { Avatar, DetailHeader, Pane, fromList } from '@/components/MasterDetail';
import { useList } from '@/hooks/useList';
import { useCounts } from '@/store/countsStore';
import { inr } from '@/utils/format';

const NEW = '__new';
const MOODS = ['budget', 'self', 'calm', 'gift', 'floral', 'host', 'fresh', 'value', 'cozy', 'fun', 'festive', 'romance'];
const BADGES = ['Most Popular', 'Bestseller', 'Hot Selling', 'New', 'Set of 2', 'Tester Kit', 'Limited'];
const options = (o: Record<string, string> | string[]) => (Array.isArray(o) ? o.map((v) => ({ value: v, label: v })) : Object.entries(o).map(([value, label]) => ({ value, label })));
const chips = ['All', 'Live', 'Hidden', 'Low stock'];
const FRAGRANCE_SUGGESTIONS = ['Lotus', 'Vanilla', 'Chocolate', 'Coffee', 'Rose', 'Lavender', 'Jasmine', 'Sandalwood', 'Mogra', 'Unscented'];
// ColorPicker gives a Color object once touched, a string before that
const hexOf = (c: unknown) => (typeof c === 'string' ? c : c && typeof c === 'object' && 'toHexString' in c ? (c as { toHexString: () => string }).toHexString() : '').toUpperCase().slice(0, 7);

export default function ProductsPage() {
  const [params] = useSearchParams();
  const list = useList<Product>('/products', { stock: params.get('stock') ?? undefined, limit: 50 });
  const [chip, setChip] = useState(params.get('stock') === 'low' ? 'Low stock' : 'All');
  const [selected, setSelected] = useState<string | null>(null);
  const refreshCounts = useCounts((s) => s.refresh);

  const onChip = (v: string) => {
    setChip(v);
    setSelected(null);
    list.update({ active: v === 'Live' ? 'true' : v === 'Hidden' ? 'false' : undefined, stock: v === 'Low stock' ? 'low' : undefined });
  };

  return (
    <MasterDetail<Product>
      title="Products"
      icon={<AppstoreOutlined />}
      {...fromList(list)}
      getKey={(p) => p._id}
      searchPlaceholder="Search name or slug…"
      chips={{ options: chips, value: chip, onChange: onChip }}
      actions={<Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => setSelected(NEW)}>New product</Button>}
      selectedKey={selected}
      onSelect={setSelected}
      renderRow={(p) => ({
        avatar: <Avatar src={assetUrl(p.images[0])} text={p.name} />,
        title: p.name,
        meta: `${CATEGORIES[p.category] ?? p.category} · ${p.subtitle || LINES[p.line]}${p.packs?.length ? ` · ${p.packs.length} packs` : ''}${p.colors?.length ? ` · ${p.colors.length} colours` : ''}${p.fragranceOptions?.length ? ` · ${p.fragranceOptions.length} fragrances` : ''}${p.isActive ? '' : ' · hidden'}`,
        preview: `${inr(p.price)} · ${p.soldCount} sold${p.reviews > 0 ? ` · ★ ${p.rating}` : ''}`,
        badge: (
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${p.stock === 0 ? 'bg-red-50 text-red-600' : p.stock < 10 ? 'bg-[#F7EBCB] text-[#8a6d10]' : 'bg-cocoa-light text-cocoa-dark'}`}>
            {p.stock === 0 ? 'Sold out' : `${p.stock} left`}
          </span>
        ),
      })}
      renderDetail={(key) => (
        <ProductEditor
          id={key === NEW ? null : key}
          onSaved={(id) => {
            list.reload();
            refreshCounts();
            setSelected(id);
          }}
          onDeleted={() => {
            list.reload();
            refreshCounts();
            setSelected(null);
          }}
        />
      )}
    />
  );
}

function ProductEditor({ id, onSaved, onDeleted }: { id: string | null; onSaved: (id: string) => void; onDeleted: () => void }) {
  const [form] = Form.useForm();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);

  useEffect(() => {
    api<{ items: Collection[] }>('/collections').then((r) => setCollections(r.items)).catch(() => undefined);
  }, []);

  const toForm = (p: Partial<Product>) => ({ ...p, includes: p.includes?.join('\n'), howToUse: p.howToUse?.join('\n') });
  // The pane remounts per selection, so the "new product" defaults can be the initial state
  const [initial, setInitial] = useState<Record<string, unknown>>(() =>
    id ? {} : toForm({ line: 'handcrafted', category: 'floral', stock: 20, isActive: true, rating: 0, reviews: 0, collections: [], moods: [], images: [], packs: [], colors: [], fragranceOptions: [], includes: [], howToUse: [] }),
  );

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api<{ product: Product }>(`/products/${id}`)
      .then((r) => {
        setProduct(r.product);
        setInitial(toForm(r.product));
      })
      .catch((e) => message.error(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const save = async (v: Record<string, unknown>) => {
    setSaving(true);
    const lines = (x: unknown) => String(x ?? '').split('\n').map((s) => s.trim()).filter(Boolean);
    // Cleared number inputs come back as null — drop them so optional fields stay unset
    const clean = Object.fromEntries(Object.entries(v).filter(([, x]) => x !== null && x !== undefined));
    const colors = ((v.colors as { name?: string; hex?: unknown; images?: string[] }[] | undefined) ?? [])
      .filter((c) => c?.name?.trim())
      .map((c) => ({ name: c.name!.trim(), hex: hexOf(c.hex), images: c.images ?? [] }));
    const packs = ((v.packs as { label?: string; price?: number | null; compareAt?: number | null; images?: string[] }[] | undefined) ?? [])
      .filter((p) => p?.label?.trim() && typeof p.price === 'number')
      .map((p) => ({ label: p.label!.trim(), price: p.price!, ...(p.compareAt ? { compareAt: p.compareAt } : {}), images: p.images ?? [] }));
    const body = {
      ...clean,
      badge: v.badge ?? '',
      images: (v.images as string[] | undefined) ?? [],
      colors,
      packs,
      fragranceOptions: ((v.fragranceOptions as string[] | undefined) ?? []).map((f) => f.trim()).filter(Boolean),
      includes: lines(v.includes),
      howToUse: lines(v.howToUse),
    };
    try {
      const r = id
        ? await api<{ product: Product }>(`/products/${id}`, { method: 'PUT', body })
        : await api<{ product: Product }>('/products', { method: 'POST', body });
      message.success(id ? 'Product updated' : 'Product created — it is live on the website');
      onSaved(r.product._id);
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await api(`/products/${id}`, { method: 'DELETE' });
      message.success('Product deleted');
      onDeleted();
    } catch (e) {
      message.error((e as Error).message);
    }
  };

  const packCount = ((Form.useWatch('packs', form) as unknown[] | undefined) ?? []).length;
  if (loading) return <div className="p-6"><Skeleton active avatar paragraph={{ rows: 10 }} /></div>;

  return (
    <>
      <DetailHeader
        avatar={<Avatar src={assetUrl(product?.images[0])} text={product?.name ?? 'New'} />}
        title={product?.name ?? 'New product'}
        subtitle={product ? `/${product.slug} · ${product.soldCount} sold · ★ ${product.rating} (${product.reviews} reviews)` : 'Fill the details and save to publish on the website'}
        extra={
          <>
            {product && (
              <a href={`${WEBSITE_URL}/product/${product.slug}`} target="_blank" rel="noreferrer"><Button icon={<EyeOutlined />} title="View on website" /></a>
            )}
            {product && (
              <Popconfirm title="Delete this product?" description="Tip: switch “Live on website” off to hide it instead." onConfirm={remove}>
                <Button danger icon={<DeleteOutlined />} />
              </Popconfirm>
            )}
            <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={() => form.submit()}>Save</Button>
          </>
        }
      />
      <div className="p-4 md:p-5">
        <Form key={product?._id ?? 'new'} form={form} initialValues={initial} layout="vertical" onFinish={save} requiredMark={false} className="space-y-4">
          <Pane>
            <Form.Item name="images" label="Photos" extra="Upload several photos at once (JPG / PNG / WebP). The first photo is the cover — use the arrows to reorder." className="mb-0">
              <ImageListEditor />
            </Form.Item>
          </Pane>
          <Pane className="grid gap-x-4 sm:grid-cols-2 xl:grid-cols-3">
            <Form.Item name="name" label="Name" rules={[{ required: true, min: 2 }]} className="sm:col-span-2"><Input /></Form.Item>
            <Form.Item name="subtitle" label="Subtitle"><Input placeholder="e.g. Set of 2 Mini Candles" /></Form.Item>
            {!product && (
              <Form.Item name="slug" label="URL slug (optional)" extra="Auto-generated from the name" rules={[{ pattern: /^[a-z0-9-]+$/, message: 'lowercase letters, numbers and dashes' }]}>
                <Input placeholder="ocean-escape" />
              </Form.Item>
            )}
            <Form.Item name="line" label="Candle line" rules={[{ required: true }]}><Select options={options(LINES)} /></Form.Item>
            <Form.Item name="category" label="Category" rules={[{ required: true }]}><Select options={options(CATEGORIES)} /></Form.Item>
            <Form.Item name="price" label="Price (₹)" extra={packCount ? 'Taken from the first pack' : undefined} rules={[{ required: !packCount }]}><InputNumber min={0} className="w-full" disabled={packCount > 0} /></Form.Item>
            <Form.Item name="compareAt" label="Compare-at / MRP (₹)"><InputNumber min={0} className="w-full" disabled={packCount > 0} /></Form.Item>
            <Form.Item name="stock" label="Stock"><InputNumber min={0} className="w-full" /></Form.Item>
            <Form.Item name="badge" label="Badge"><Select allowClear options={options(BADGES)} placeholder="None" /></Form.Item>
            <Form.Item name="rating" label="Rating"><InputNumber min={0} max={5} step={0.1} className="w-full" /></Form.Item>
            <Form.Item name="reviews" label="Review count"><InputNumber min={0} className="w-full" /></Form.Item>
            <Form.Item name="sortOrder" label="Sort order"><InputNumber className="w-full" /></Form.Item>
          </Pane>
          <Pane className="grid gap-x-4 sm:grid-cols-2">
            <Form.Item name="collections" label="Collections (shop menu)"><Select mode="multiple" optionFilterProp="label" options={collections.map((c) => ({ value: c.slug, label: c.isActive ? c.name : `${c.name} (hidden)` }))} /></Form.Item>
            <Form.Item name="moods" label="Moods (scent finder quiz)"><Select mode="tags" options={options(MOODS)} /></Form.Item>
          </Pane>
          <Pane>
            <p className="mb-1 font-semibold">Colour options</p>
            <p className="mb-3 text-xs text-black/50">Customers pick a colour on the product page. Add photos for each colour — they replace the gallery when that colour is chosen. Leave empty if the product has no colour choice.</p>
            <Form.List name="colors">
              {(fields, { add, remove }) => (
                <div className="space-y-3">
                  {fields.map(({ key, name }) => (
                    <div key={key} className="rounded-xl border border-black/10 p-3">
                      <div className="flex flex-wrap items-start gap-3">
                        <Form.Item name={[name, 'name']} label="Colour name" rules={[{ required: true, message: 'Name the colour' }]} className="mb-2 min-w-[160px] flex-1">
                          <Input placeholder="e.g. Pastel Pink" />
                        </Form.Item>
                        <Form.Item name={[name, 'hex']} label="Swatch" className="mb-2">
                          <ColorPicker format="hex" disabledAlpha />
                        </Form.Item>
                        <Button type="text" danger icon={<MinusCircleOutlined />} className="mt-7" onClick={() => remove(name)}>Remove</Button>
                      </div>
                      <Form.Item name={[name, 'images']} label="Photos of this colour" className="mb-0">
                        <ImageListEditor compact />
                      </Form.Item>
                    </div>
                  ))}
                  <Button icon={<PlusOutlined />} onClick={() => add({ name: '', hex: '#C47A5A', images: [] })}>Add colour</Button>
                </div>
              )}
            </Form.List>
          </Pane>
          <Pane>
            <p className="mb-1 font-semibold">Pack / quantity options</p>
            <p className="mb-3 text-xs text-black/50">
              e.g. Single · Set of 2 · Pack of 4 — each with its own price. The first pack is the default and its price is shown on the shop page.
              Pack photos (optional) are shown when that pack is chosen. Leave empty to sell just one size at the price above.
            </p>
            <Form.List name="packs">
              {(fields, { add, remove, move }) => (
                <div className="space-y-3">
                  {fields.map(({ key, name }, i) => (
                    <div key={key} className="rounded-xl border border-black/10 p-3">
                      <div className="flex flex-wrap items-start gap-3">
                        <Form.Item name={[name, 'label']} label={i === 0 ? 'Pack name (default)' : 'Pack name'} rules={[{ required: true, message: 'Name the pack' }]} className="mb-2 min-w-[150px] flex-1">
                          <Input placeholder="e.g. Set of 2" />
                        </Form.Item>
                        <Form.Item name={[name, 'price']} label="Price (₹)" rules={[{ required: true, message: 'Price' }]} className="mb-2 w-28">
                          <InputNumber min={0} className="w-full" />
                        </Form.Item>
                        <Form.Item name={[name, 'compareAt']} label="MRP (₹)" className="mb-2 w-28">
                          <InputNumber min={0} className="w-full" />
                        </Form.Item>
                        <div className="mt-7 flex gap-1">
                          <Button size="small" disabled={i === 0} onClick={() => move(i, i - 1)}>↑</Button>
                          <Button size="small" disabled={i === fields.length - 1} onClick={() => move(i, i + 1)}>↓</Button>
                          <Button size="small" type="text" danger icon={<MinusCircleOutlined />} onClick={() => remove(name)} />
                        </div>
                      </div>
                      <Form.Item name={[name, 'images']} label="Photos of this pack (optional)" className="mb-0">
                        <ImageListEditor compact />
                      </Form.Item>
                    </div>
                  ))}
                  <Button icon={<PlusOutlined />} onClick={() => add({ label: fields.length === 0 ? 'Single' : '', price: undefined, images: [] })}>Add pack</Button>
                </div>
              )}
            </Form.List>
          </Pane>
          <Pane>
            <p className="mb-1 font-semibold">Fragrance options</p>
            <p className="mb-3 text-xs text-black/50">Customers choose one of these on the product page. Type a fragrance and press Enter. Leave empty for no fragrance choice.</p>
            <Form.Item name="fragranceOptions" className="mb-0">
              <Select mode="tags" tokenSeparators={[',']} placeholder="e.g. Lotus, Vanilla, Chocolate, Coffee" options={FRAGRANCE_SUGGESTIONS.map((v) => ({ value: v, label: v }))} />
            </Form.Item>
          </Pane>
          <Pane>
            <Form.Item name="tagline" label="Tagline"><Input /></Form.Item>
            <Form.Item name="description" label="Description"><Input.TextArea rows={4} /></Form.Item>
            <div className="grid gap-x-4 sm:grid-cols-2">
              <Form.Item name="includes" label="What's included (one per line)"><Input.TextArea rows={4} /></Form.Item>
              <Form.Item name="howToUse" label="How to use (one step per line)"><Input.TextArea rows={4} /></Form.Item>
            </div>
            <Form.Item name="bestFor" label="Best for"><Input /></Form.Item>
          </Pane>
          <Pane className="flex flex-wrap gap-8">
            <Form.Item name="isActive" label="Live on website" valuePropName="checked" className="mb-0"><Switch /></Form.Item>
            {!product && (
              <Form.Item name="notify" label="Notify customers" valuePropName="checked" className="mb-0" tooltip="Sends a push notification + email to customers who want offer updates, as soon as you save.">
                <Switch />
              </Form.Item>
            )}
          </Pane>
        </Form>
      </div>
    </>
  );
}
