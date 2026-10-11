import { message } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { api, type Paged } from '@/api/client';

/** Paginated list with search/status params; re-fetches when params change. */
export function useList<T>(path: string, initial: Record<string, unknown> = {}) {
  const [params, setParams] = useState<Record<string, unknown>>({ page: 1, limit: 20, ...initial });
  const [data, setData] = useState<Paged<T>>({ items: [], total: 0, page: 1, limit: 10 });
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api<Paged<T>>(path, { query: params }));
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [path, JSON.stringify(params)]);

  useEffect(() => {
    reload();
  }, [reload]);

  const update = (patch: Record<string, unknown>) => setParams((p) => ({ ...p, page: 1, ...patch }));
  const pagination = {
    current: data.page,
    pageSize: data.limit,
    total: data.total,
    showSizeChanger: true,
    showTotal: (t: number) => `${t} records`,
    onChange: (page: number, limit: number) => setParams((p) => ({ ...p, page, limit })),
  };

  const goTo = (page: number, limit: number) => setParams((p) => ({ ...p, page, limit }));

  return { ...data, loading, reload, params, update, goTo, pagination };
}
