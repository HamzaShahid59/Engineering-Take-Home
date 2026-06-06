import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiResponse } from '../models/auth.models';
import type {
  Office,
  SimulationCalculateRequest,
  SimulationOptions,
  SimulationResult,
} from '../models/simulation.models';

@Injectable({ providedIn: 'root' })
export class MortgageSimulationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/mortgage-simulations`;

  getOptions(): Observable<SimulationOptions> {
    return this.http
      .get<ApiResponse<SimulationOptions>>(`${this.baseUrl}/options`)
      .pipe(map(res => res.data!));
  }

  getOffices(): Observable<Office[]> {
    return this.http
      .get<ApiResponse<Office[]>>(`${this.baseUrl}/options/offices`)
      .pipe(map(res => res.data!));
  }

  calculate(payload: SimulationCalculateRequest): Observable<SimulationResult> {
    return this.http
      .post<ApiResponse<SimulationResult>>(`${this.baseUrl}/calculate`, payload)
      .pipe(map(res => res.data!));
  }
}
