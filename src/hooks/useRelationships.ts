import { useState, useEffect, useCallback } from 'react';

interface RelationshipData {
  tasks?: any[];
  agents?: any[];
  skills?: any[];
  clients?: any[];
}

export function useRelationships(type: string, id: string | null) {
  const [data, setData] = useState<RelationshipData>({});
  const [loading, setLoading] = useState(false);

  const fetch_ = useCallback(async () => {
    if (!id || !type) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/relationships?type=${type}&id=${id}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (err) {
      console.error('Failed to fetch relationships:', err);
    } finally {
      setLoading(false);
    }
  }, [type, id]);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  return { ...data, loading, refresh: fetch_ };
}
