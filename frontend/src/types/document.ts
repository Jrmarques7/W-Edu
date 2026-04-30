export type DocumentType = 'contract' | 'term' | 'material' | 'policy' | 'template' | 'other';
export type DocumentStatus = 'draft' | 'active' | 'archived';

export interface DocumentVersion {
  id: number;
  document_id: number;
  version_number: number;
  file_name: string | null;
  mime_type: string | null;
  file_size: number | null;
  external_url: string | null;
  notes: string | null;
  created_by_id: number | null;
  created_at: string;
}

export interface Document {
  id: number;
  title: string;
  document_type: DocumentType;
  description: string | null;
  status: DocumentStatus;
  course_id: number | null;
  class_offering_id: number | null;
  organization_id: number | null;
  student_id: number | null;
  uploaded_by_id: number | null;
  latest_version_number: number;
  is_signed: boolean;
  signed_at: string | null;
  signed_by: string | null;
  external_reference: string | null;
  created_at: string;
  updated_at: string;
  versions: DocumentVersion[];
}
