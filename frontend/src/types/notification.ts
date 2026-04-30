export type NotificationChannel = 'internal' | 'whatsapp' | 'email' | 'push';
export type NotificationStatus = 'pending' | 'sent' | 'failed';
export type NotificationEventType =
  | 'class_created'
  | 'meeting_created'
  | 'meeting_reminder'
  | 'absence_registered'
  | 'attendance_recorded'
  | 'content_published'
  | 'certificate_issued';

export interface NotificationTemplate {
  id: number;
  key: string;
  channel: NotificationChannel;
  title_template: string;
  body_template: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationEvent {
  id: number;
  event_type: NotificationEventType;
  channel: NotificationChannel;
  template_key: string | null;
  recipient_student_id: number | null;
  course_id: number | null;
  class_offering_id: number | null;
  scheduled_meeting_id: number | null;
  payload: Record<string, string>;
  title: string;
  body: string;
  status: NotificationStatus;
  scheduled_for: string | null;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
}

