import { Injectable, signal } from '@angular/core';

const TOKEN_KEY = 'oper:jwt';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly isAuthenticated = signal(!!localStorage.getItem(TOKEN_KEY));

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.isAuthenticated.set(false);
  }
}
