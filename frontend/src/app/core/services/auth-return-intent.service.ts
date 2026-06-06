import { Injectable } from '@angular/core';

const INTENT_KEY = 'oper:auth:return-intent';

@Injectable({ providedIn: 'root' })
export class AuthReturnIntentService {
  set(intent: string): void {
    localStorage.setItem(INTENT_KEY, intent);
  }

  consume(): string | null {
    const value = localStorage.getItem(INTENT_KEY);
    localStorage.removeItem(INTENT_KEY);
    return value;
  }
}
