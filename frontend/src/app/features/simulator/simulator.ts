import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SimulatorStateService } from '../../core/services/simulator-state.service';
import { MortgageSimulationService } from '../../core/services/mortgage-simulation.service';
import { SimulationCalculateRequest } from '../../core/models/simulation.models';
import { AuthService } from '../../core/services/auth.service';
import { AuthReturnIntentService } from '../../core/services/auth-return-intent.service';
import { ToastService } from '../../core/services/toast.service';
import { Step1PurposeComponent } from './steps/step1-purpose/step1-purpose';
import { Step2BorrowerComponent } from './steps/step2-borrower/step2-borrower';
import { Step3PropertyComponent } from './steps/step3-property/step3-property';
import { Step4ContributionComponent } from './steps/step4-contribution/step4-contribution';
import { Step5FinancialComponent } from './steps/step5-financial/step5-financial';
import { Step6PersonalComponent } from './steps/step6-personal/step6-personal';
import { Step7ResultComponent } from './steps/step7-result/step7-result';

interface SimulatorStep {
  index: number;
  labelKey: string;
}

const STEPS: SimulatorStep[] = [
  { index: 1, labelKey: 'simulator.step.purpose' },
  { index: 2, labelKey: 'simulator.step.borrower' },
  { index: 3, labelKey: 'simulator.step.property' },
  { index: 4, labelKey: 'simulator.step.contribution' },
  { index: 5, labelKey: 'simulator.step.financial' },
  { index: 6, labelKey: 'simulator.step.personal' },
  { index: 7, labelKey: 'simulator.step.results' },
];

@Component({
  selector: 'app-simulator',
  imports: [TranslatePipe, Step1PurposeComponent, Step2BorrowerComponent, Step3PropertyComponent, Step4ContributionComponent, Step5FinancialComponent, Step6PersonalComponent, Step7ResultComponent],
  templateUrl: './simulator.html',
})
export class SimulatorComponent {
  protected readonly state = inject(SimulatorStateService);
  private readonly translate = inject(TranslateService);
  private readonly simService = inject(MortgageSimulationService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly returnIntentService = inject(AuthReturnIntentService);
  private readonly toast = inject(ToastService);
  protected readonly steps = STEPS;

  protected readonly canContinue = computed(() => {
    const step = this.state.currentStep();
    if (step === 1) return this.state.projectPurpose() !== null;
    if (step === 2) return this.state.borrowerType() !== null;
    if (step === 3) {
      const pd = this.state.propertyDetails();
      if (!pd) return false;
      if (!pd.property_type || !pd.property_location || !pd.property_usage || !pd.sale_type) return false;
      if ((pd.property_price ?? 0) <= 0) return false;
      if (pd.epc_score !== null && pd.epc_score !== undefined && (pd.epc_score < 0 || pd.epc_score > 2000)) return false;
      return true;
    }
    if (step === 4) {
      const c = this.state.contribution();
      return c !== null && c.own_funds !== null && c.own_funds >= 0;
    }
    if (step === 5) {
      const fd = this.state.financialDetails();
      if (!fd || fd.incomes.length === 0) return false;
      for (const r of fd.incomes) {
        if (!r.type || r.monthly_amount === null || r.monthly_amount <= 0) return false;
      }
      const incomeTypes = fd.incomes.map(r => r.type).filter((t): t is string => !!t);
      if (new Set(incomeTypes).size !== incomeTypes.length) return false;
      for (const r of fd.liabilities) {
        if (!r.type || r.monthly_amount === null || r.monthly_amount <= 0) return false;
      }
      const liabilityTypes = fd.liabilities.map(r => r.type).filter((t): t is string => !!t);
      if (new Set(liabilityTypes).size !== liabilityTypes.length) return false;
      return true;
    }
    if (step === 6) {
      const pd = this.state.personalDetails();

      if (
        !pd ||
        !pd.date_of_birth ||
        pd.number_of_dependents === null ||
        pd.number_of_dependents < 0 ||
        pd.number_of_dependents > 10
      ) {
        return false;
      }

      const birthDate = new Date(pd.date_of_birth);
      const today = new Date();

      let age = today.getFullYear() - birthDate.getFullYear();

      const birthdayPassed =
        today.getMonth() > birthDate.getMonth() ||
        (
          today.getMonth() === birthDate.getMonth() &&
          today.getDate() >= birthDate.getDate()
        );

      if (!birthdayPassed) {
        age--;
      }

      return age >= 18 && age <= 65;
    }
    return false;
  });

  protected readonly innerContainerClass = computed(() =>
    this.state.currentStep() === 7 ? 'mx-auto max-w-4xl' : 'mx-auto max-w-2xl'
  );

  protected readonly continueLabel = computed(() =>
    this.state.currentStep() === 6 ? 'simulator.show_result' : 'simulator.continue'
  );

  protected readonly continueTitle = computed(() => {
    if (this.canContinue() || this.state.currentStep() !== 5) return '';
    return this.translate.instant('simulator.continue_incomplete');
  });

  protected continue(): void {
    if (this.state.currentStep() === 6) {
      this.showResult();
    } else {
      this.state.setStep(this.state.currentStep() + 1);
    }
  }

  private showResult(): void {
    const pd = this.state.propertyDetails()!;
    const fd = this.state.financialDetails()!;

    const payload: SimulationCalculateRequest = {
      project_details: {
        project_purpose: this.state.projectPurpose()!,
        borrower_type: this.state.borrowerType()!,
        property_type: pd.property_type!,
        property_location: pd.property_location!,
        property_price: pd.property_price!,
        property_usage: pd.property_usage!,
        sale_type: pd.sale_type!,
        epc_score: pd.epc_score,
      },
      contribution: {
        own_funds: this.state.contribution()!.own_funds!,
      },
      financial_details: {
        incomes: fd.incomes.map(r => ({ income_type: r.type!, monthly_amount: r.monthly_amount! })),
        liabilities: fd.liabilities.length > 0
          ? fd.liabilities.map(r => ({ liability_type: r.type!, monthly_amount: r.monthly_amount! }))
          : undefined,
      },
      personal_details: {
        date_of_birth: this.state.personalDetails()!.date_of_birth!,
        number_of_dependents: this.state.personalDetails()!.number_of_dependents!,
      },
      preferred_duration_years: this.state.sliderDurationYears() ?? 25,
    };

    this.simService.calculate(payload).subscribe({
      next: result => {
        this.state.setResultWithSliders(result, this.state.contribution()!.own_funds!, this.state.sliderDurationYears() ?? 25);
        this.state.setStep(7);
      },
      error: err => console.error('[Simulator] calculate error:', err),
    });
  }

  protected onSaveLock(): void {
    if (this.state.editMode()) {
      this.performUpdate();
      return;
    }
    if (!this.authService.isAuthenticated()) {
      this.returnIntentService.set('save-lock');
      this.router.navigateByUrl('/register');
    } else {
      this.router.navigateByUrl('/select-office');
    }
  }

  private performUpdate(): void {
    const pd = this.state.propertyDetails()!;
    const fd = this.state.financialDetails()!;
    const id = this.state.editSimulationId()!;

    const payload: SimulationCalculateRequest = {
      project_details: {
        project_purpose: this.state.projectPurpose()!,
        borrower_type: this.state.borrowerType()!,
        property_type: pd.property_type!,
        property_location: pd.property_location!,
        property_price: pd.property_price!,
        property_usage: pd.property_usage!,
        sale_type: pd.sale_type!,
        epc_score: pd.epc_score,
      },
      contribution: {
        own_funds: this.state.sliderOwnFunds() ?? this.state.contribution()!.own_funds!,
      },
      financial_details: {
        incomes: fd.incomes.map(r => ({ income_type: r.type!, monthly_amount: r.monthly_amount! })),
        liabilities: fd.liabilities.length > 0
          ? fd.liabilities.map(r => ({ liability_type: r.type!, monthly_amount: r.monthly_amount! }))
          : undefined,
      },
      personal_details: {
        date_of_birth: this.state.personalDetails()!.date_of_birth!,
        number_of_dependents: this.state.personalDetails()!.number_of_dependents!,
      },
      preferred_duration_years: this.state.sliderDurationYears() ?? 25,
    };

    this.simService.updateSimulation(id, payload).subscribe({
      next: () => {
        this.toast.show('simulator.edit.update_success');
        this.state.startOver();
        this.router.navigateByUrl(`/simulations/${id}`);
      },
      error: () => this.toast.show('simulator.edit.update_error', 'error'),
    });
  }

  protected jumpToStep(index: number): void {
    this.state.setStep(index);
  }

  protected startOver(): void {
    this.state.startOver();
  }

  protected stepCircleClass(stepIndex: number): string {
    const base = 'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors';
    const current = this.state.currentStep();
    if (stepIndex < current) {
      return `${base} bg-primary-600 text-white dark:bg-primary-500`;
    }
    if (stepIndex === current) {
      return `${base} bg-primary-600 text-white ring-2 ring-primary-300 ring-offset-2 ring-offset-white dark:bg-primary-500 dark:ring-primary-800 dark:ring-offset-navy-950`;
    }
    return `${base} bg-gray-100 text-gray-400 dark:bg-navy-800 dark:text-navy-500`;
  }

  protected connectorClass(stepIndex: number): string {
    const base = 'mx-1 h-px flex-1 transition-colors';
    return stepIndex < this.state.currentStep()
      ? `${base} bg-primary-500 dark:bg-primary-600`
      : `${base} bg-gray-200 dark:bg-navy-700`;
  }

  protected stepLabelClass(stepIndex: number): string {
    const base = 'mt-1.5 max-w-[4.5rem] text-center text-[10px] leading-tight transition-colors';
    const current = this.state.currentStep();
    if (stepIndex < current) return `${base} text-primary-600 dark:text-primary-400`;
    if (stepIndex === current) return `${base} font-semibold text-primary-700 dark:text-primary-300`;
    return `${base} text-gray-400 dark:text-navy-500`;
  }
}
