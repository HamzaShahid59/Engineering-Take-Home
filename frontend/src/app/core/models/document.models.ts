export type DocumentStatus = 'to_be_verified' | 'verified' | 'rejected';

export interface DocumentType {
  value: string;
  label: string;
}

export interface DocumentResponse {
  id: string;
  user_id: string;
  application_id: string;
  document_type: string;
  original_file_name: string;
  file_url: string;
  storage_file_id: string;
  file_type: string;
  file_size: number;
  status: DocumentStatus;
  uploaded_at: string;
}

export interface UploadDocumentRequest {
  application_id: string;
  document_type: string;
  file: File;
}
