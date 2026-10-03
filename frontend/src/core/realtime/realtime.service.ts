import { supabase } from '@/core/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type RealtimeTable =
  | 'projects'
  | 'tenders'
  | 'tender_bids'
  | 'contracts'
  | 'project_milestones'
  | 'progress_updates'
  | 'complaints'
  | 'complaint_updates'
  | 'notifications'
  | 'inspections'
  | 'environmental_incidents';

export interface TableChangeEvent<T = any> {
  table: RealtimeTable;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  new: T;
  old: Partial<T>;
}

type Listener<T = any> = (event: TableChangeEvent<T>) => void;
type Invalidator = () => void;

class RealtimeService {
  private channels = new Map<string, RealtimeChannel>();
  private tableListeners = new Map<RealtimeTable, Set<Listener>>();
  private invalidators = new Set<Invalidator>();
  private initializedTables = new Set<RealtimeTable>();

  /**
   * Register a global cache/query invalidator callback.
   * Invoked whenever relevant entity data changes in Supabase.
   */
  public registerInvalidator(fn: Invalidator): () => void {
    this.invalidators.add(fn);
    return () => {
      this.invalidators.delete(fn);
    };
  }

  private triggerInvalidation() {
    this.invalidators.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('Realtime invalidator execution error:', err);
      }
    });
  }

  /**
   * Subscribes to Postgres Changes for a specific table.
   * Ensures exactly one channel per table to avoid duplicate subscriptions.
   */
  public subscribeToTable<T = any>(
    table: RealtimeTable,
    listener: (event: TableChangeEvent<T>) => void
  ): () => void {
    if (!this.tableListeners.has(table)) {
      this.tableListeners.set(table, new Set());
    }
    this.tableListeners.get(table)!.add(listener as Listener);

    // Initialize Supabase channel if not already active
    if (!this.initializedTables.has(table)) {
      this.initializedTables.add(table);

      const channelName = `realtime:${table}`;
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          (payload: any) => {
            const changeEvent: TableChangeEvent<T> = {
              table,
              eventType: payload.eventType,
              new: payload.new,
              old: payload.old,
            };

            // Notify registered listeners for this table
            const listeners = this.tableListeners.get(table);
            if (listeners) {
              listeners.forEach((fn) => {
                try {
                  fn(changeEvent);
                } catch (e) {
                  console.error(`Error in realtime listener for ${table}:`, e);
                }
              });
            }

            // Trigger global cache/query invalidation
            this.triggerInvalidation();
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`[RealtimeService] Connected to ${table}`);
          }
        });

      this.channels.set(channelName, channel);
    }

    // Return cleanup unbind function
    return () => {
      const set = this.tableListeners.get(table);
      if (set) {
        set.delete(listener as Listener);
        if (set.size === 0) {
          // If no listeners left for this table, we can keep the channel or tear down
        }
      }
    };
  }

  /**
   * Subscribes to targeted broadcast topic (e.g. org:government:<id>, org:contractor:<id>, project:<id>)
   */
  public subscribeToTopic(
    topic: string,
    event: string,
    callback: (payload: any) => void
  ): () => void {
    const channelName = `broadcast:${topic}`;
    let channel = this.channels.get(channelName);

    if (!channel) {
      channel = supabase.channel(channelName);
      this.channels.set(channelName, channel);
    }

    channel.on('broadcast', { event }, (msg) => {
      try {
        callback(msg.payload);
      } catch (err) {
        console.error(`Error in broadcast callback for topic ${topic} event ${event}:`, err);
      }
    });

    channel.subscribe();

    return () => {
      // Unsubscribe when component unmounts
    };
  }

  /**
   * Broadcasts domain event across a topic
   */
  public async broadcast(topic: string, event: string, payload: any): Promise<void> {
    const channelName = `broadcast:${topic}`;
    let channel = this.channels.get(channelName);
    if (!channel) {
      channel = supabase.channel(channelName);
      channel.subscribe();
      this.channels.set(channelName, channel);
    }

    await channel.send({
      type: 'broadcast',
      event,
      payload,
    });
  }

  /**
   * Cleans up all active subscriptions on logout or teardown
   */
  public cleanupAll(): void {
    this.channels.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
    this.tableListeners.clear();
    this.invalidators.clear();
    this.initializedTables.clear();
  }
}

export const realtimeService = new RealtimeService();
