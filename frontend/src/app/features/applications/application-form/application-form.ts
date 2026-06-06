import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ApplicationFormStateService } from '../../../core/services/application-form-state.service';
import { MortgageApplicationService } from '../../../core/services/mortgage-application.service';
import { Step1ProjectDetailsComponent } from './step1-project-details/step1-project-details';
import { Step2BorrowerDetailsComponent } from './step2-borrower-details/step2-borrower-details';
import { Step3IncomeDetailsComponent } from './step3-income-details/step3-income-details';
import type { ApplicationFormField } from '../../../core/models/application.models';

interface AppFormStep {
  index: number;
  labelKey: string;
}

const STEPS: AppFormStep[] = [
  { index: 1, labelKey: 'application_form.step.project_details' },
  { index: 2, labelKey: 'application_form.step.borrower_details' },
  { index: 3, labelKey: 'application_form.step.income' },
  { index: 4, labelKey: 'application_form.step.liabilities' },
  { index: 5, labelKey: 'application_form.step.review' },
];

@Component({
  selector: 'app-application-form',
  imports: [TranslatePipe, Step1ProjectDetailsComponent, Step2BorrowerDetailsComponent, Step3IncomeDetailsComponent],
  templateUrl: './application-form.html',
})
export class ApplicationFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly appService = inject(MortgageApplicationService);
  protected readonly formState = inject(ApplicationFormStateService);

  protected readonly steps = STEPS;
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly currentStep = signal(1);

  protected readonly step1Fields = computed(
    () => this.formState.fieldSchema()?.project_details ?? [],
  );

  protected readonly step2Fields = computed(
    () => this.formState.fieldSchema()?.borrower_details ?? [],
  );

  protected readonly step3IncomeSchema = computed(
    () => this.formState.fieldSchema()?.income_details ?? null,
  );

  protected readonly canContinue = computed(() => {
    const step = this.currentStep();
    const draft = this.formState.draftFormData();
    if (step === 1) return this.allRequiredFilled(this.step1Fields(), draft?.project_details);
    if (step === 2) return this.allRequiredFilled(this.step2Fields(), draft?.borrower_details);
    if (step === 3) return this.incomeDetailsFilled();
    return false;
  });

  private incomeDetailsFilled(): boolean {
    const schema = this.formState.fieldSchema()?.income_details;
    const items = this.formState.draftFormData()?.income_details;
    if (!schema || !items || items.length === 0) return false;
    for (const item of items) {
      if (!item.monthly_amount || item.monthly_amount <= 0) return false;
      const detailFields = schema.details_by_income_type[item.income_type] ?? [];
      const details = item.details as unknown as Record<string, unknown>;
      const allFilled = detailFields
        .filter((f: ApplicationFormField) => f.required)
        .every((f: ApplicationFormField) => {
          const v = details?.[f.name];
          return v !== null && v !== undefined && String(v).trim() !== '';
        });
      if (!allFilled) return false;
    }
    return true;
  }

  private allRequiredFilled(fields: ApplicationFormField[], section: unknown): boolean {
    if (!fields.length || !section) return false;
    const map = section as Record<string, unknown>;
    return fields
      .filter(f => f.required)
      .every(f => {
        const v = map[f.name];
        return v !== null && v !== undefined && String(v).trim() !== '';
      });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigateByUrl('/dashboard');
      return;
    }
    this.formState.init(id);
    this.appService.getApplicationForm(id).subscribe({
      next: app => {
        console.log(app);
        this.formState.setFromApiResponse(app);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set(true);
      },
    });
  }

  protected goBack(): void {
    this.router.navigateByUrl('/dashboard');
  }

  protected onContinue(): void {
    const next = this.currentStep() + 1;
    if (next <= STEPS.length) {
      this.currentStep.set(next);
    }
  }

  protected stepCircleClass(index: number): string {
    const base = 'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors';
    const current = this.currentStep();
    if (index < current) return `${base} bg-primary-600 text-white dark:bg-primary-500`;
    if (index === current) return `${base} bg-primary-600 text-white ring-2 ring-primary-300 ring-offset-2 ring-offset-white dark:bg-primary-500 dark:ring-primary-800 dark:ring-offset-navy-950`;
    return `${base} bg-gray-100 text-gray-400 dark:bg-navy-800 dark:text-navy-500`;
  }

  protected connectorClass(index: number): string {
    const base = 'mx-1 h-px flex-1 transition-colors';
    return index < this.currentStep()
      ? `${base} bg-primary-500 dark:bg-primary-600`
      : `${base} bg-gray-200 dark:bg-navy-700`;
  }

  protected stepLabelClass(index: number): string {
    const base = 'mt-1.5 max-w-[4.5rem] text-center text-[10px] leading-tight transition-colors';
    const current = this.currentStep();
    if (index < current) return `${base} text-primary-600 dark:text-primary-400`;
    if (index === current) return `${base} font-semibold text-primary-700 dark:text-primary-300`;
    return `${base} text-gray-400 dark:text-navy-500`;
  }
}
