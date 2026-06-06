import { Component, DestroyRef, OnInit, inject, input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { ApplicationFormStateService } from '../../../../core/services/application-form-state.service';
import type {
  ApplicationFieldSchema,
  ApplicationFormField,
  ApplicationIncomeItem,
  IncomeDetails,
  PrefilledIncome,
} from '../../../../core/models/application.models';

type IncomeSchema = ApplicationFieldSchema['income_details'];

interface IncomeRow {
  income_type: string;
  detailFields: ApplicationFormField[];
}

@Component({
  selector: 'app-step3-income-details',
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './step3-income-details.html',
})
export class Step3IncomeDetailsComponent implements OnInit {
  readonly incomeSchema = input.required<IncomeSchema>();

  private readonly formState = inject(ApplicationFormStateService);
  private readonly destroyRef = inject(DestroyRef);

  protected incomeRows: IncomeRow[] = [];
  protected groups: FormGroup<Record<string, FormControl<string | null>>>[] = [];

  ngOnInit(): void {
    const schema = this.incomeSchema();
    const draft = this.formState.draftFormData()?.income_details;
    const prefillIncomes = this.formState.prefilledIncomes();

    console.log('[Step3] draftFormData.income_details:', draft);
    console.log('[Step3] prefilledIncomes:', prefillIncomes);

    const hasDraft = Array.isArray(draft) && draft.length > 0;
    const seed: ApplicationIncomeItem[] = hasDraft
      ? draft
      : prefillIncomes?.map((inc: PrefilledIncome) => ({
          income_type: inc.income_type,
          monthly_amount: inc.monthly_amount,
          details: {} as IncomeDetails,
        })) ?? [];

    console.log('[Step3] final seed used for rendering:', seed);

    this.incomeRows = seed.map(item => ({
      income_type: item.income_type,
      detailFields: schema.details_by_income_type[item.income_type] ?? [],
    }));

    this.groups = seed.map((item, i) => {
      const row = this.incomeRows[i];
      const group: Record<string, FormControl<string | null>> = {};

      group['monthly_amount'] = new FormControl<string | null>(
        item.monthly_amount != null ? String(item.monthly_amount) : null,
        Validators.required,
      );

      const details = item.details as unknown as Record<string, unknown>;
      for (const field of row.detailFields) {
        const val = details?.[field.name];
        group[field.name] = new FormControl<string | null>(
          val != null ? String(val) : null,
          field.required ? Validators.required : [],
        );
      }

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
    const updated: ApplicationIncomeItem[] = this.groups.map((grp, i) => {
      const row = this.incomeRows[i];
      const raw = grp.getRawValue();
      const { monthly_amount, ...rest } = raw;
      return {
        income_type: row.income_type,
        monthly_amount: monthly_amount ? parseFloat(monthly_amount) : 0,
        details: rest as unknown as IncomeDetails,
      };
    });
    this.formState.updateDraft({
      ...this.formState.draftFormData(),
      income_details: updated,
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

  protected selectClass(hasError: boolean): string {
    const base =
      'w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-navy-900 dark:text-white';
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

  protected labelKey(name: string): string {
    return `application_form.income_details.${name}`;
  }
}
