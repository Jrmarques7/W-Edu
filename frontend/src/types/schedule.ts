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

export interface InstructorAgendaAvailability {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface InstructorAgendaMeeting {
  id: number;
  class_offering_id: number;
  class_name: string;
  course_id: number;
  course_name: string;
  room_id: number | null;
  room_name: string | null;
  title: string;
  starts_at: string;
  ends_at: string;
  type: MeetingType;
  is_closed: boolean;
}

export interface InstructorAgendaSuggestion {
  starts_at: string;
  ends_at: string;
  availability_id: number;
}

export interface InstructorAgenda {
  instructor_id: number;
  instructor_name: string;
  range_start: string;
  range_end: string;
  availability: InstructorAgendaAvailability[];
  meetings: InstructorAgendaMeeting[];
  suggestions: InstructorAgendaSuggestion[];
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

export interface MeetingAttendanceReportRow {
  student_id: number;
  student_name: string;
  student_email: string;
  status: AttendanceStatus;
  method: AttendanceMethod | null;
  recorded_at: string | null;
  notes: string | null;
  practical_score: number | null;
  practical_status: 'reviewed' | 'returned' | null;
  practical_feedback: string | null;
  practical_recorded_at: string | null;
}
