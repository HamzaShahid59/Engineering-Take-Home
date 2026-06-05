import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  ApiResponse,
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  User,
} from '../models/auth.models';

const TOKEN_KEY = 'oper:jwt';
const USER_KEY = 'oper:user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/auth`;

  private readonly _currentUser = signal<User | null>(this.restoreUser());

  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  register(payload: RegisterRequest): Observable<User> {
    return this.http
      .post<ApiResponse<TokenResponse>>(`${this.baseUrl}/register`, payload)
      .pipe(
        map(res => res.data!),
        tap(tokenRes => this.persist(tokenRes)),
        map(tokenRes => tokenRes.user),
      );
  }

  login(payload: LoginRequest): Observable<User> {
    return this.http
      .post<ApiResponse<TokenResponse>>(`${this.baseUrl}/login`, payload)
      .pipe(
        map(res => res.data!),
        tap(tokenRes => this.persist(tokenRes)),
        map(tokenRes => tokenRes.user),
      );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._currentUser.set(null);
  }

  private persist(tokenRes: TokenResponse): void {
    localStorage.setItem(TOKEN_KEY, tokenRes.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(tokenRes.user));
    this._currentUser.set(tokenRes.user);
  }

  private restoreUser(): User | null {
    const stored = localStorage.getItem(USER_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored) as User;
    } catch {
      return null;
    }
  }
}
