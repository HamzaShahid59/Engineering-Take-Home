import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiResponse } from '../models/auth.models';
import type { DocumentResponse, DocumentType } from '../models/document.models';

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/mortgage-applications`;

  getDocumentTypes(): Observable<DocumentType[]> {
    return this.http
      .get<ApiResponse<DocumentType[]>>(`${this.baseUrl}/documents/types`)
      .pipe(map(res => res.data!));
  }

  uploadDocument(applicationId: string, documentType: string, file: File): Observable<DocumentResponse> {
    const formData = new FormData();
    formData.append('document_type', documentType);
    formData.append('file', file);

    return this.http
      .post<ApiResponse<DocumentResponse>>(`${this.baseUrl}/${applicationId}/documents`, formData)
      .pipe(map(res => res.data!));
  }

  getApplicationDocuments(applicationId: string): Observable<DocumentResponse[]> {
    return this.http
      .get<ApiResponse<DocumentResponse[]>>(`${this.baseUrl}/${applicationId}/documents`)
      .pipe(map(res => res.data!));
  }

  deleteDocument(applicationId: string, documentId: string): Observable<{ message: string }> {
    return this.http
      .delete<ApiResponse<{ message: string }>>(`${this.baseUrl}/${applicationId}/documents/${documentId}`)
      .pipe(map(res => res.data!));
  }
}
