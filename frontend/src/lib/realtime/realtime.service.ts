import { supabase } from '../supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type RealtimeEventCategory =
  | 'project_updated'
  | 'tender_published'
  | 'bid_submitted'
  | 'contract_awarded'
  | 'progress_submitted'
  | 'progress_reviewed'
  | 'finance_updated'
  | 'complaint_updated'
  | 'ai_insight_created';

export interface SubscriptionHandler {
  unsubscribe: () => void;
}

class RealtimeService {
  /**
   * Subscribes to database changes on a table with safe unsubscription lifecycle.
   */
  subscribeToTable(
    table: string,
    event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
    callback: (payload: any) => void,
    filter?: string
  ): SubscriptionHandler {
    const channelName = `realtime:${table}:${Date.now()}`;
    const channel: RealtimeChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event, schema: 'public', table, filter },
        (payload) => callback(payload)
      )
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
      },
    };
  }

  /**
   * Subscribes to notifications for a specific user.
   */
  subscribeToUserNotifications(userId: string, callback: (notification: any) => void): SubscriptionHandler {
    return this.subscribeToTable(
      'notifications',
      'INSERT',
      (payload) => {
        if (payload.new && payload.new.user_id === userId) {
          callback(payload.new);
        }
      },
      `user_id=eq.${userId}`
    );
  }
}

export const realtimeService = new RealtimeService();
