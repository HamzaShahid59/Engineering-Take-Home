import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { ApplicationFormStateService } from '../../../../core/services/application-form-state.service';
import type {
  ApplicationLiabilityItem,
} from '../../../../core/models/application.models';

interface LiabilityRow {
  liability_type: string;
}

@Component({
  selector: 'app-step4-liability-details',
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './step4-liability-details.html',
})
export class Step4LiabilityDetailsComponent implements OnInit {
  private readonly formState = inject(ApplicationFormStateService);
  private readonly destroyRef = inject(DestroyRef);

  protected liabilityRows: LiabilityRow[] = [];
  protected groups: FormGroup<Record<string, FormControl<string | null>>>[] = [];

  ngOnInit(): void {
    const draft = this.formState.draftFormData()?.liability_details;
    const prefillLiabilities = this.formState.prefilledLiabilities();

    const hasDraft =
      Array.isArray(draft?.liabilities) && draft.liabilities.length > 0;

    const seed: ApplicationLiabilityItem[] = hasDraft
      ? draft.liabilities
      : (prefillLiabilities ?? []).map(pl => ({
          liability_type: pl.liability_type,
          monthly_repayment: pl.monthly_repayment,
          outstanding_balance: pl.outstanding_balance,
        }));

    this.liabilityRows = seed.map(item => ({
      liability_type: item.liability_type,
    }));

    this.groups = seed.map(item => {
      const group: Record<string, FormControl<string | null>> = {
        monthly_repayment: new FormControl<string | null>(
          item.monthly_repayment != null ? String(item.monthly_repayment) : null,
          Validators.required,
        ),
        outstanding_balance: new FormControl<string | null>(
          item.outstanding_balance != null ? String(item.outstanding_balance) : null,
          Validators.required,
        ),
      };
      return new FormGroup(group);
    });

    for (const grp of this.groups) {
      grp.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
        this.saveDraft();
      });
    }

    this.saveDraft();
  }

  private saveDraft(): void {
    const liabilities: ApplicationLiabilityItem[] = this.groups.map((grp, i) => {
      const raw = grp.getRawValue();
      return {
        liability_type: this.liabilityRows[i].liability_type,
        monthly_repayment: raw['monthly_repayment'] ? parseFloat(raw['monthly_repayment']) : 0,
        outstanding_balance: raw['outstanding_balance'] ? parseFloat(raw['outstanding_balance']) : 0,
      };
    });

    this.formState.updateDraft({
      ...this.formState.draftFormData(),
      liability_details: {
        has_existing_loans: liabilities.length > 0,
        liabilities,
        additional_financial_obligations: null,
      },
    });
  }

  protected hasError(groupIndex: number, name: string): boolean {
    const c = this.groups[groupIndex]?.get(name);
    return !!c && c.invalid && c.touched;
  }

  protected inputClass(hasError: boolean): string {
    const base =
      'w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-navy-900 dark:text-white';
    return hasError
      ? `${base} border-red-400 dark:border-red-500`
      : `${base} border-gray-300 dark:border-navy-600`;
  }
}
