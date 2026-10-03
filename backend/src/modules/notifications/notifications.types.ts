export interface NotificationRecord {
  id: string;
  recipient_user_id: string;
  recipient_organization_id: string | null;
  project_id: string | null;
  notification_type: string;
  title: string;
  body: string;
  action_url: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}
