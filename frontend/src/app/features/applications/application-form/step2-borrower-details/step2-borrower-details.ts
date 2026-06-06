import { Component, DestroyRef, OnInit, inject, input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { ApplicationFormStateService } from '../../../../core/services/application-form-state.service';
import type { ApplicationFormField, BorrowerDetails } from '../../../../core/models/application.models';

@Component({
  selector: 'app-step2-borrower-details',
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './step2-borrower-details.html',
})
export class Step2BorrowerDetailsComponent implements OnInit {
  readonly fields = input.required<ApplicationFormField[]>();

  private readonly formState = inject(ApplicationFormStateService);
  private readonly destroyRef = inject(DestroyRef);

  protected form!: FormGroup;

  ngOnInit(): void {
    const group: Record<string, FormControl<string | null>> = {};
    for (const field of this.fields()) {
      group[field.name] = new FormControl<string | null>(
        null,
        field.required ? Validators.required : [],
      );
    }
    this.form = new FormGroup(group);

    const draft = this.formState.draftFormData()?.borrower_details;
    const prefill = this.formState.prefilledData()?.borrower_details;
    const seed = draft ?? prefill ?? null;
    if (seed) {
      this.form.patchValue(seed as unknown as Record<string, unknown>, { emitEvent: false });
    }

    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.formState.updateDraft({
        ...this.formState.draftFormData(),
        borrower_details: this.form.getRawValue() as BorrowerDetails,
      });
    });
  }

  protected isFullWidth(name: string): boolean {
    return name === 'current_residential_address';
  }

  protected labelKey(name: string): string {
    return `application_form.borrower_details.${name}`;
  }

  protected hasError(name: string): boolean {
    const c = this.form.get(name);
    return !!c && c.invalid && c.touched;
  }

  protected inputClass(hasError: boolean): string {
    const base = 'w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-navy-900 dark:text-white';
    return hasError
      ? `${base} border-red-400 dark:border-red-500`
      : `${base} border-gray-300 dark:border-navy-600`;
  }

  protected selectClass(hasError: boolean): string {
    const base = 'w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-navy-900 dark:text-white';
    return hasError
      ? `${base} border-red-400 dark:border-red-500`
      : `${base} border-gray-300 dark:border-navy-600`;
  }
}
