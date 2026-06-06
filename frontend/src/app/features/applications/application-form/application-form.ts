import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import type { Observable } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { ApplicationFormStateService } from '../../../core/services/application-form-state.service';
import { MortgageApplicationService } from '../../../core/services/mortgage-application.service';
import { Step1ProjectDetailsComponent } from './step1-project-details/step1-project-details';
import { Step2BorrowerDetailsComponent } from './step2-borrower-details/step2-borrower-details';
import { Step3IncomeDetailsComponent } from './step3-income-details/step3-income-details';
import { Step4LiabilityDetailsComponent } from './step4-liability-details/step4-liability-details';
import { Step5DescriptionComponent } from './step5-description/step5-description';
import type {
  ApplicationFormField,
  SubmitMortgageApplicationRequest,
} from '../../../core/models/application.models';

interface AppFormStep {
  index: number;
  labelKey: string;
}

const STEPS: AppFormStep[] = [
  { index: 1, labelKey: 'application_form.step.project_details' },
  { index: 2, labelKey: 'application_form.step.borrower_details' },
  { index: 3, labelKey: 'application_form.step.income' },
  { index: 4, labelKey: 'application_form.step.liabilities' },
  { index: 5, labelKey: 'application_form.step.description' },
];

@Component({
  selector: 'app-application-form',
  imports: [TranslatePipe, Step1ProjectDetailsComponent, Step2BorrowerDetailsComponent, Step3IncomeDetailsComponent, Step4LiabilityDetailsComponent, Step5DescriptionComponent],
  templateUrl: './application-form.html',
})
export class ApplicationFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly appService = inject(MortgageApplicationService);
  protected readonly formState = inject(ApplicationFormStateService);

  protected readonly steps = STEPS;
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly currentStep = signal(1);
  protected readonly confirmSubmit = signal(false);
  protected readonly submitting = signal(false);
  protected readonly submitError = signal(false);
  protected readonly confirmLeave = signal(false);
  private deactivateSubject: Subject<boolean> | null = null;

  protected readonly step1Fields = computed(
    () => this.formState.fieldSchema()?.project_details ?? [],
  );

  protected readonly step2Fields = computed(
    () => this.formState.fieldSchema()?.borrower_details ?? [],
  );

  protected readonly step3IncomeSchema = computed(
    () => this.formState.fieldSchema()?.income_details ?? null,
  );

  protected readonly hasPrefilledLiabilities = computed(
    () => (this.formState.prefilledLiabilities()?.length ?? 0) > 0,
  );

  protected readonly step5Fields = computed(
    () => this.formState.fieldSchema()?.application_details ?? [],
  );

  protected readonly isLastStep = computed(() => this.currentStep() === STEPS.length);

  protected readonly canContinue = computed(() => {
    const step = this.currentStep();
    const draft = this.formState.draftFormData();
    if (step === 1) return this.allRequiredFilled(this.step1Fields(), draft?.project_details);
    if (step === 2) return this.allRequiredFilled(this.step2Fields(), draft?.borrower_details);
    if (step === 3) return this.incomeDetailsFilled();
    if (step === 4) return this.liabilityDetailsFilled();
    if (step === 5) return this.applicationDetailsFilled();
    return false;
  });

  private applicationDetailsFilled(): boolean {
    const fields = this.step5Fields();
    const draft = this.formState.draftFormData() as unknown as Record<string, unknown>;
    return fields.filter(f => f.required).every(f => {
      const v = draft?.[f.name];
      return v !== null && v !== undefined && String(v).trim() !== '';
    });
  }

  private liabilityDetailsFilled(): boolean {
    const liabilities = this.formState.draftFormData()?.liability_details?.liabilities;
    if (!liabilities || liabilities.length === 0) return false;
    return liabilities.every(item => item.monthly_repayment > 0);
  }

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
    const handler = (e: BeforeUnloadEvent) => {
      if (this.formState.draftFormData()) e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    this.destroyRef.onDestroy(() => window.removeEventListener('beforeunload', handler));

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
    let next = this.currentStep() + 1;
    if (next === 4 && !this.hasPrefilledLiabilities()) {
      next = 5;
    }
    if (next <= STEPS.length) {
      this.currentStep.set(next);
    }
  }

  canDeactivate(): boolean | Observable<boolean> {
    if (!this.formState.draftFormData()) return true;
    this.confirmLeave.set(true);
    this.deactivateSubject = new Subject<boolean>();
    return this.deactivateSubject.asObservable();
  }

  protected onLeaveConfirm(): void {
    this.formState.clear();
    this.confirmLeave.set(false);
    this.deactivateSubject?.next(true);
    this.deactivateSubject?.complete();
    this.deactivateSubject = null;
  }

  protected onLeaveCancel(): void {
    this.confirmLeave.set(false);
    this.deactivateSubject?.next(false);
    this.deactivateSubject?.complete();
    this.deactivateSubject = null;
  }

  protected onSubmitClick(): void {
    this.submitError.set(false);
    this.confirmSubmit.set(true);
  }

  protected onSubmitCancel(): void {
    this.confirmSubmit.set(false);
  }

  protected onSubmitConfirm(): void {
    const id = this.formState.applicationId();
    const draft = this.formState.draftFormData();
    if (!id || !draft) return;

    const payload: SubmitMortgageApplicationRequest = {
      application_details: {
        project_details: draft.project_details!,
        borrower_details: draft.borrower_details!,
        income_details: draft.income_details ?? [],
        liability_details: draft.liability_details!,
        description: draft.description ?? '',
      },
    };

    this.submitting.set(true);
    this.submitError.set(false);

    this.appService.submitApplication(id, payload).subscribe({
      next: () => {
        this.formState.clear();
        this.router.navigateByUrl('/applications');
      },
      error: () => {
        this.submitting.set(false);
        this.submitError.set(true);
      },
    });
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
