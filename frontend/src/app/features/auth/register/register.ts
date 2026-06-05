import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import type { RegisterRequest } from '../../../core/models/auth.models';

function passwordStrength(ctrl: AbstractControl): ValidationErrors | null {
  const v = ctrl.value as string;
  if (!v) return null;
  if (!/[A-Z]/.test(v)) return { noUppercase: true };
  if (!/[0-9]/.test(v)) return { noNumber: true };
  return null;
}

const BELGIAN_PHONE_RE = /^(\+32|0)[1-9][0-9]{7,8}$/;

function belgianPhone(ctrl: AbstractControl): ValidationErrors | null {
  const v = (ctrl.value as string | null)?.replace(/\s/g, '') ?? '';
  if (!v) return null;
  return BELGIAN_PHONE_RE.test(v) ? null : { belgianPhone: true };
}

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, TranslatePipe, RouterLink],
  templateUrl: './register.html',
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.group({
    full_name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone_number: ['', belgianPhone],
    password: ['', [Validators.required, Validators.minLength(8), passwordStrength]],
  });

  protected readonly loading = signal(false);
  protected readonly submitted = signal(false);
  protected readonly errorKey = signal<string | null>(null);

  protected get fullNameCtrl() { return this.form.controls.full_name; }
  protected get emailCtrl() { return this.form.controls.email; }
  protected get phoneCtrl() { return this.form.controls.phone_number; }
  protected get passwordCtrl() { return this.form.controls.password; }

  protected submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;

    this.loading.set(true);
    this.errorKey.set(null);

    const raw = this.form.getRawValue();
    const payload: RegisterRequest = {
      full_name: raw.full_name!,
      email: raw.email!,
      password: raw.password!,
    };
    if (raw.phone_number) {
      payload.phone_number = raw.phone_number.replace(/\s/g, '');
    }

    this.authService.register(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigateByUrl('/dashboard');
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        const keyMap: Record<number, string> = {
          409: 'auth.register.error.email_exists',
          422: 'auth.register.error.password_validation',
        };
        this.errorKey.set(keyMap[err.status] ?? 'auth.register.error.generic');
      },
    });
  }

  protected inputClass(hasError: boolean): string {
    const base = 'w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-navy-900 dark:text-white';
    return hasError
      ? `${base} border-red-400 dark:border-red-500`
      : `${base} border-gray-300 dark:border-navy-600`;
  }
}
