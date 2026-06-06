import { Component, DestroyRef, OnInit, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { ApplicationFormStateService } from '../../../../core/services/application-form-state.service';
import type {
  ApplicationDetails,
  ApplicationFormField,
} from '../../../../core/models/application.models';

const FIELD_VALIDATORS: Record<string, ValidatorFn[]> = {
  description: [Validators.required, Validators.minLength(5), Validators.maxLength(1000)],
};

interface ErrorInfo {
  key: string;
  params?: Record<string, number>;
}

@Component({
  selector: 'app-step5-description',
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './step5-description.html',
})
export class Step5DescriptionComponent implements OnInit {
  readonly fields = input.required<ApplicationFormField[]>();

  private readonly formState = inject(ApplicationFormStateService);
  private readonly destroyRef = inject(DestroyRef);

  protected form!: FormGroup;

  private readonly _formValid = signal(false);
  readonly isValid = this._formValid.asReadonly();

  ngOnInit(): void {
    const group: Record<string, FormControl<string | null>> = {};
    for (const field of this.fields()) {
      const validators = FIELD_VALIDATORS[field.name] ?? (field.required ? [Validators.required] : []);
      group[field.name] = new FormControl<string | null>(null, validators);
    }
    this.form = new FormGroup(group);

    const draft = this.formState.draftFormData() as unknown as Record<string, unknown>;
    const seed: Record<string, unknown> = {};
    for (const field of this.fields()) {
      const v = draft?.[field.name];
      if (v != null) seed[field.name] = v;
    }
    if (Object.keys(seed).length) {
      this.form.patchValue(seed, { emitEvent: false });
    }

    this._formValid.set(this.form.valid);
    this.form.statusChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this._formValid.set(this.form.valid);
    });

    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      const raw = this.form.getRawValue() as unknown as Partial<ApplicationDetails>;
      this.formState.updateDraft({
        ...this.formState.draftFormData(),
        ...raw,
      });
    });
  }

  protected hasError(name: string): boolean {
    const c = this.form?.get(name);
    return !!c && c.invalid && c.touched;
  }

  protected getErrorInfo(name: string): ErrorInfo | null {
    const c = this.form?.get(name);
    if (!c || !c.invalid || !c.touched) return null;
    if (c.errors?.['required']) return { key: 'application_form.error.required' };
    if (c.errors?.['minlength']) return { key: 'application_form.error.min_length', params: { min: c.errors['minlength'].requiredLength } };
    if (c.errors?.['maxlength']) return { key: 'application_form.error.max_length', params: { max: c.errors['maxlength'].requiredLength } };
    return null;
  }

  protected labelKey(name: string): string {
    return `application_form.application_details.${name}`;
  }

  protected inputClass(hasError: boolean): string {
    const base =
      'w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-navy-900 dark:text-white';
    return hasError
      ? `${base} border-red-400 dark:border-red-500`
      : `${base} border-gray-300 dark:border-navy-600`;
  }

  protected textareaClass(hasError: boolean): string {
    const base =
      'w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-navy-900 dark:text-white resize-none';
    return hasError
      ? `${base} border-red-400 dark:border-red-500`
      : `${base} border-gray-300 dark:border-navy-600`;
  }
}
