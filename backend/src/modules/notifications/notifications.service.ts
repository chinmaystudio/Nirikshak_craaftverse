import { supabaseAdmin, createAuthenticatedClient } from '../../core/database/supabase.js';
import { NotificationRecord } from './notifications.types.js';
import { UserContext } from '../../core/auth/userContext.js';
import { ValidationError } from '../../core/http/errors.js';

export class NotificationsService {
  async listNotifications(
    userContext: UserContext,
    token: string,
    limit: number = 50
  ): Promise<NotificationRecord[]> {
    const scopedClient = await createAuthenticatedClient(token);
    let query = scopedClient
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (userContext.organizationId) {
      query = query.or(`recipient_user_id.eq.${userContext.userId},recipient_organization_id.eq.${userContext.organizationId}`);
    } else {
      query = query.eq('recipient_user_id', userContext.userId);
    }

    const { data, error } = await query;
    if (error) {
      throw new ValidationError(`Failed to fetch notifications: ${error.message}`);
    }

    return (data || []) as NotificationRecord[];
  }

  async getUnreadCount(
    userContext: UserContext,
    token: string
  ): Promise<number> {
    const scopedClient = await createAuthenticatedClient(token);
    let query = scopedClient
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false);

    if (userContext.organizationId) {
      query = query.or(`recipient_user_id.eq.${userContext.userId},recipient_organization_id.eq.${userContext.organizationId}`);
    } else {
      query = query.eq('recipient_user_id', userContext.userId);
    }

    const { count, error } = await query;
    if (error) {
      throw new ValidationError(`Failed to count unread notifications: ${error.message}`);
    }

    return count || 0;
  }

  async markRead(
    notificationId: string,
    userContext: UserContext,
    token: string
  ): Promise<boolean> {
    const scopedClient = await createAuthenticatedClient(token);
    const { data, error } = await scopedClient.rpc('mark_notification_read', {
      p_notification_id: notificationId,
    });

    if (error) {
      throw new ValidationError(`Failed to mark notification as read: ${error.message}`);
    }

    return !!data;
  }

  async markAllRead(
    userContext: UserContext,
    token: string
  ): Promise<boolean> {
    const scopedClient = await createAuthenticatedClient(token);
    let query = scopedClient
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('is_read', false);

    if (userContext.organizationId) {
      query = query.or(`recipient_user_id.eq.${userContext.userId},recipient_organization_id.eq.${userContext.organizationId}`);
    } else {
      query = query.eq('recipient_user_id', userContext.userId);
    }

    const { error } = await query;
    if (error) {
      throw new ValidationError(`Failed to mark all notifications as read: ${error.message}`);
    }

    return true;
  }
}

export const notificationsService = new NotificationsService();
