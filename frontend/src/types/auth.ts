export type UserRole = 'student' | 'instructor' | 'coordinator' | 'company_manager' | 'admin';

export interface Student {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  organization_id: number | null;
  is_active: boolean;
  created_at: string;
}

export interface Organization {
  id: number;
  name: string;
  legal_name: string | null;
  document: string | null;
  contact_email: string | null;
  is_active: boolean;
  created_at: string;
}

export interface StudentProfile {
  id: number;
  student_id: number;
  phone: string | null;
  document: string | null;
  position: string | null;
  department: string | null;
  bio: string | null;
  created_at: string;
}

export interface InstructorProfile {
  id: number;
  student_id: number;
  specialties: string | null;
  bio: string | null;
  rating: string | null;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
