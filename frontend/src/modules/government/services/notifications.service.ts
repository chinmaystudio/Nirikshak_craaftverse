import { apiClient } from '@/lib/api/apiClient';

export interface AppNotification {
  id: string;
  user_id: string;
  organization_id: string | null;
  project_id: string | null;
  title: string;
  message: string;
  notification_type: string;
  read_status: boolean;
  read_at: string | null;
  created_at: string;
}

export const notificationsService = {
  async getNotifications(): Promise<AppNotification[]> {
    return apiClient.get<AppNotification[]>('/api/notifications');
  },

  async getUnreadCount(): Promise<number> {
    const res = await apiClient.get<{ unread_count: number }>('/api/notifications/unread-count');
    return res.unread_count;
  },

  async markRead(notificationId: string): Promise<void> {
    await apiClient.post(`/api/notifications/${notificationId}/read`);
  },

  async markAllRead(): Promise<void> {
    await apiClient.post('/api/notifications/read-all');
  },
};
