import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiResponse } from '../models/auth.models';
import type {
  ApplicationFormResponse,
  MortgageApplicationResponse,
  SubmitMortgageApplicationRequest,
} from '../models/application.models';

@Injectable({ providedIn: 'root' })
export class MortgageApplicationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/mortgage-applications`;

  createFromSimulation(simulationId: string): Observable<MortgageApplicationResponse> {
    return this.http
      .post<ApiResponse<MortgageApplicationResponse>>(`${this.baseUrl}/from-simulation/${simulationId}`, {})
      .pipe(map(res => res.data!));
  }

  getMyApplications(): Observable<MortgageApplicationResponse[]> {
    return this.http
      .get<ApiResponse<MortgageApplicationResponse[]>>(`${this.baseUrl}/my-applications`)
      .pipe(map(res => res.data!));
  }

  submitApplication(
    applicationId: string,
    payload: SubmitMortgageApplicationRequest,
  ): Observable<MortgageApplicationResponse> {
    return this.http
      .post<ApiResponse<MortgageApplicationResponse>>(`${this.baseUrl}/${applicationId}/submit`, payload)
      .pipe(map(res => res.data!));
  }

  getApplicationForm(applicationId: string): Observable<ApplicationFormResponse> {
    return this.http
      .get<ApiResponse<ApplicationFormResponse>>(`${this.baseUrl}/${applicationId}/form`)
      .pipe(map(res => res.data!));
  }

  getApplicationById(applicationId: string): Observable<MortgageApplicationResponse> {
    return this.http
      .get<ApiResponse<MortgageApplicationResponse>>(`${this.baseUrl}/${applicationId}`)
      .pipe(map(res => res.data!));
  }
}
