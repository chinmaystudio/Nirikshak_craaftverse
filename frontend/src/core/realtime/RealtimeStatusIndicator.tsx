import { useEffect, useState } from 'react';
import { supabase } from '@/core/supabase/client';

type ConnectionState = 'live' | 'reconnecting' | 'offline';

export function RealtimeStatusIndicator({ className = '' }: { className?: string }) {
  const [state, setState] = useState<ConnectionState>(() => navigator.onLine ? 'reconnecting' : 'offline');

  useEffect(() => {
    const channel = supabase.channel(`connection-status-${crypto.randomUUID()}`);
    const online = () => setState('reconnecting');
    const offline = () => setState('offline');
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    channel.subscribe((status, error) => {
      if (status === 'SUBSCRIBED') setState('live');
      else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        setState(navigator.onLine ? 'reconnecting' : 'offline');
        if (error) console.warn('Supabase realtime connection status:', status, error);
      }
    });
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
      void supabase.removeChannel(channel);
    };
  }, []);

  const label = state === 'live' ? 'Live' : state === 'reconnecting' ? 'Reconnecting' : 'Offline';
  const dot = state === 'live' ? 'bg-emerald-500' : state === 'reconnecting' ? 'bg-amber-500' : 'bg-slate-400';
  return <span className={`inline-flex items-center gap-1.5 whitespace-nowrap text-xs ${className}`} title="Supabase realtime connection">
    <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden="true" />{label}
  </span>;
}
