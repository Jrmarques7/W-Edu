export interface CertificateRule {
  id: number;
  course_id: number;
  require_lessons_complete: boolean;
  minimum_progress_percent: number;
  require_quiz: boolean;
  minimum_quiz_score: number;
  require_attendance: boolean;
  minimum_attendance_percent: number;
  auto_issue: boolean;
  created_at: string;
  updated_at: string;
}

export interface Certificate {
  id: number;
  student_id: number;
  course_id: number;
  validation_code: string;
  issued_by_id: number | null;
  issued_at: string;
  revoked_at: string | null;
  revoked_reason: string | null;
  pdf_url: string | null;
}

export interface CertificateEligibility {
  course_id: number;
  student_id: number;
  eligible: boolean;
  progress_percent: number;
  quiz_percent: number;
  attendance_percent: number;
  reasons: string[];
}

export interface CertificateValidation {
  valid: boolean;
  certificate: Certificate | null;
  message: string | null;
}

export interface CertificateIssueResult {
  issued: boolean;
  certificate_id: number | null;
  validation_code: string | null;
}
