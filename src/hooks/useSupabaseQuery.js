import { useEffect, useState, useCallback } from 'react';

// Runs `queryFn(supabase)` whenever `deps` change, and exposes loading/error/data + a refetch fn.
export function useSupabaseQuery(queryFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const run = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const result = await queryFn();
      setData(result);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { run(); }, [run]);

  return { data, loading, error, refetch: run };
}
