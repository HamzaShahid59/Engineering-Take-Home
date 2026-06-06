import { Injectable, signal } from '@angular/core';

export interface Toast {
  key: string;
  type: 'success' | 'error';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly current = signal<Toast | null>(null);

  private timerId: ReturnType<typeof setTimeout> | null = null;

  show(key: string, type: 'success' | 'error' = 'success', duration = 4000): void {
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
    }
    this.current.set({ key, type });
    this.timerId = setTimeout(() => this.dismiss(), duration);
  }

  dismiss(): void {
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.current.set(null);
  }
}
