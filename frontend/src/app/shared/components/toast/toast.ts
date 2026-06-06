import { Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  imports: [TranslatePipe],
  template: `
    @if (toast.current(); as t) {
      <div
        class="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 px-4 sm:px-0"
        [attr.role]="t.type === 'error' ? 'alert' : 'status'"
        [attr.aria-live]="t.type === 'error' ? 'assertive' : 'polite'">
        <div
          class="flex w-full max-w-sm items-center gap-3 rounded-xl px-4 py-3 text-sm shadow-2xl ring-1"
          [class]="t.type === 'success'
            ? 'bg-gray-900 text-white ring-white/10 dark:bg-navy-700 dark:ring-white/5'
            : 'bg-red-600 text-white ring-red-500/30'">
          @if (t.type === 'success') {
            <svg class="h-4 w-4 shrink-0 text-emerald-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clip-rule="evenodd"/>
            </svg>
          } @else {
            <svg class="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          }
          <span class="font-medium">{{ t.key | translate }}</span>
          <button
            type="button"
            (click)="toast.dismiss()"
            class="ml-2 rounded-full p-0.5 opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            [attr.aria-label]="'toast.dismiss' | translate">
            <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
      </div>
    }
  `,
})
export class ToastComponent {
  protected readonly toast = inject(ToastService);
}
