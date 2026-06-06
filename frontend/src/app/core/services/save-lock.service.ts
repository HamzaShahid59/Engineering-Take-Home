import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiResponse } from '../models/auth.models';
import type { SaveLockRequest } from '../models/simulation.models';

@Injectable({ providedIn: 'root' })
export class SaveLockService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/mortgage-simulations`;

  saveLock(payload: SaveLockRequest): Observable<void> {
    return this.http
      .post<ApiResponse<unknown>>(`${this.baseUrl}/save-and-lock`, payload)
      .pipe(map(() => undefined));
  }
}
