import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface WebhookKey {
  id: string;
  label: string;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateApiKey(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function useWebhookKeys() {
  const { user } = useAuth();
  const [keys, setKeys] = useState<WebhookKey[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchKeys = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('webhook_api_keys')
      .select('id, label, is_active, last_used_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setKeys((data as WebhookKey[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const createKey = async (label: string): Promise<string | null> => {
    if (!user) return null;
    const rawKey = generateApiKey();
    const keyHash = await hashApiKey(rawKey);

    const { error } = await supabase
      .from('webhook_api_keys')
      .insert([{ user_id: user.id, api_key_hash: keyHash, label }] as any);

    if (error) {
      console.error('Error creating key:', error);
      return null;
    }

    await fetchKeys();
    return rawKey;
  };

  const toggleKey = async (id: string, isActive: boolean) => {
    await (supabase
      .from('webhook_api_keys') as any)
      .update({ is_active: isActive })
      .eq('id', id);
    await fetchKeys();
  };

  const deleteKey = async (id: string) => {
    await supabase.from('webhook_api_keys').delete().eq('id', id);
    await fetchKeys();
  };

  return { keys, loading, createKey, toggleKey, deleteKey };
}
