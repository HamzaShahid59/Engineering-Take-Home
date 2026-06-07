import { Component, DestroyRef, OnInit, computed, effect, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import type { Observable } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { ApplicationFormStateService } from '../../../core/services/application-form-state.service';
import { AuthService } from '../../../core/services/auth.service';
import { MortgageApplicationService } from '../../../core/services/mortgage-application.service';
import { Step1ProjectDetailsComponent } from './step1-project-details/step1-project-details';
import { Step2BorrowerDetailsComponent } from './step2-borrower-details/step2-borrower-details';
import { Step3IncomeDetailsComponent } from './step3-income-details/step3-income-details';
import { Step4LiabilityDetailsComponent } from './step4-liability-details/step4-liability-details';
import { Step5DescriptionComponent } from './step5-description/step5-description';
import type { SubmitMortgageApplicationRequest } from '../../../core/models/application.models';
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
  imports: [
    TranslatePipe,
    Step1ProjectDetailsComponent,
    Step2BorrowerDetailsComponent,
    Step3IncomeDetailsComponent,
    Step4LiabilityDetailsComponent,
    Step5DescriptionComponent,
  ],
  templateUrl: './application-form.html',
})
export class ApplicationFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly appService = inject(MortgageApplicationService);
  private readonly authService = inject(AuthService);
  protected readonly formState = inject(ApplicationFormStateService);

  private readonly step1Ref = viewChild(Step1ProjectDetailsComponent);
  private readonly step2Ref = viewChild(Step2BorrowerDetailsComponent);
  private readonly step3Ref = viewChild(Step3IncomeDetailsComponent);
  private readonly step4Ref = viewChild(Step4LiabilityDetailsComponent);
  private readonly step5Ref = viewChild(Step5DescriptionComponent);

  protected readonly steps = STEPS;
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly currentStep = signal(1);
  protected readonly confirmSubmit = signal(false);
  protected readonly submitting = signal(false);
  protected readonly submitError = signal(false);
  protected readonly confirmLeave = signal(false);
  protected readonly isLogoutConfirm = signal(false);
  private deactivateSubject: Subject<boolean> | null = null;

  private readonly logoutEffect = effect(() => {
    if (this.authService.pendingLogout()) {
      if (!this.formState.draftFormData()) {
        this.authService.logout();
        return;
      }
      this.isLogoutConfirm.set(true);
      this.confirmLeave.set(true);
    }
  });

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
    if (step === 1) return this.step1Ref()?.isValid() ?? false;
    if (step === 2) return this.step2Ref()?.isValid() ?? false;
    if (step === 3) return this.step3Ref()?.isValid() ?? false;
    if (step === 4) return this.step4Ref()?.isValid() ?? false;
    if (step === 5) return this.step5Ref()?.isValid() ?? false;
    return false;
  });

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
    if (this.isLogoutConfirm()) {
      this.isLogoutConfirm.set(false);
      this.authService.logout();
      return;
    }
    this.deactivateSubject?.next(true);
    this.deactivateSubject?.complete();
    this.deactivateSubject = null;
  }

  protected onLeaveCancel(): void {
    this.confirmLeave.set(false);
    if (this.isLogoutConfirm()) {
      this.isLogoutConfirm.set(false);
      this.authService.cancelLogout();
      return;
    }
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
    //  console.log('ON SUBMIT CONFIRM FIRED');
    const id = this.formState.applicationId();
    const draft = this.formState.draftFormData();
    // console.log('Application ID:', id);
// console.log('Draft:', draft);
    if (!id || !draft) return;
// console.log("after return")
    const payload: SubmitMortgageApplicationRequest = {
      application_details: {
        project_details: draft.project_details!,
        borrower_details: draft.borrower_details!,
        income_details: draft.income_details ?? [],
        liability_details: draft.liability_details ?? {
          has_existing_loans: false,
          liabilities: [],
          additional_financial_obligations: null,
        },
        description: draft.description ?? '',
      },
    };

    console.log('Submit payload:', payload);
    this.submitting.set(true);
    this.submitError.set(false);

    this.appService.submitApplication(id, payload).subscribe({
      next: () => {
        this.formState.clear();
        this.router.navigateByUrl('/applications');
      },
      error: (err) => {
        console.error('Submit failed:', err);
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
