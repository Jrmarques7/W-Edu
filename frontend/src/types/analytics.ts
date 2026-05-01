export interface AnalyticsOverview {
  total_students: number;
  total_instructors: number;
  total_organizations: number;
  total_courses: number;
  total_classes: number;
  total_meetings: number;
  closed_meetings: number;
  certificates_issued: number;
  active_subscriptions: number;
  pending_charges_cents: number;
  paid_charges_cents: number;
  document_count: number;
  attendance_rate: number;
  completion_rate: number;
  engagement_rate: number;
}

export interface CourseAnalytics {
  course_id: number;
  course_name: string;
  modality: string;
  enrollments: number;
  class_offerings: number;
  meetings: number;
  closed_meetings: number;
  certificates_issued: number;
  attendance_rate: number;
  completion_rate: number;
  average_best_quiz_score: number;
  pending_charges_cents: number;
  paid_charges_cents: number;
}

export interface StudentAnalytics {
  student_id: number;
  student_name: string;
  enrollments: number;
  completed_courses: number;
  certificates_issued: number;
  attendance_rate: number;
  progress_rate: number;
  quiz_rate: number;
  documents_count: number;
  active_subscriptions: number;
}

export interface ClassAnalytics {
  class_offering_id: number;
  class_name: string;
  course_id: number;
  course_name: string;
  total_enrolled: number;
  meetings: number;
  closed_meetings: number;
  present: number;
  late: number;
  absent: number;
  attendance_rate: number;
  waitlist_count: number;
  certificates_issued: number;
}

export interface CompletionReportRow {
  scope_type: 'course' | 'class';
  scope_id: number;
  course_id: number;
  course_name: string;
  class_name: string | null;
  enrolled: number;
  completed: number;
  completion_rate: number;
}

export interface AttendanceReportRow {
  class_offering_id: number;
  class_name: string;
  course_id: number;
  course_name: string;
  meetings: number;
  closed_meetings: number;
  present: number;
  late: number;
  absent: number;
  attendance_rate: number;
}

export interface EngagementReportRow {
  course_id: number;
  course_name: string;
  progress_records: number;
  completed_progress_records: number;
  engagement_rate: number;
  quiz_attempts: number;
  passed_quiz_attempts: number;
  quiz_pass_rate: number;
}

export interface ClassPerformanceReportRow {
  class_offering_id: number;
  class_name: string;
  course_id: number;
  course_name: string;
  enrolled: number;
  completion_rate: number;
  attendance_rate: number;
  average_best_quiz_score: number;
}

export interface RoiReportRow {
  organization_id: number | null;
  organization_name: string;
  students: number;
  paid_charges_cents: number;
  pending_charges_cents: number;
  certificates_issued: number;
  completion_rate: number;
  revenue_per_certificate_cents: number;
}
