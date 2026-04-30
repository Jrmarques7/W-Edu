export type ClassStatus = 'draft' | 'open' | 'closed' | 'completed' | 'cancelled';
export type MeetingType = 'in_person' | 'live' | 'hybrid';
export type AttendanceStatus = 'present' | 'late' | 'absent';
export type AttendanceMethod = 'manual' | 'qr_code' | 'webhook' | 'biometric' | 'facial';

export interface Location {
  id: number;
  name: string;
  address: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Room {
  id: number;
  location_id: number;
  name: string;
  capacity: number;
  resources: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ClassOffering {
  id: number;
  course_id: number;
  name: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  status: ClassStatus;
  location_id: number | null;
  room_id: number | null;
  instructor_id: number | null;
  created_at: string;
}

export interface ScheduledMeeting {
  id: number;
  class_offering_id: number;
  lesson_id: number | null;
  room_id: number | null;
  title: string;
  starts_at: string;
  ends_at: string;
  type: MeetingType;
  meeting_url: string | null;
  is_closed: boolean;
  closed_at: string | null;
  created_at: string;
}

export interface CheckinToken {
  id: number;
  scheduled_meeting_id: number;
  token: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
}

export interface AttendanceRecord {
  id: number;
  scheduled_meeting_id: number;
  class_offering_id: number;
  student_id: number;
  status: AttendanceStatus;
  method: AttendanceMethod;
  recorded_at: string;
  notes: string | null;
}

export interface MeetingAttendanceSummary {
  meeting_id: number;
  class_offering_id: number;
  total_enrolled: number;
  present: number;
  late: number;
  absent: number;
  recorded: number;
}
