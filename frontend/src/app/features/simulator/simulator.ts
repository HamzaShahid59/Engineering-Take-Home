import { Component, computed, inject } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SimulatorStateService } from './simulator-state.service';
import { Step1PurposeComponent } from './steps/step1-purpose/step1-purpose';
import { Step2BorrowerComponent } from './steps/step2-borrower/step2-borrower';
import { Step3PropertyComponent } from './steps/step3-property/step3-property';
import { Step4ContributionComponent } from './steps/step4-contribution/step4-contribution';
import { Step5FinancialComponent } from './steps/step5-financial/step5-financial';
import { Step6PersonalComponent } from './steps/step6-personal/step6-personal';

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
  imports: [TranslatePipe, Step1PurposeComponent, Step2BorrowerComponent, Step3PropertyComponent, Step4ContributionComponent, Step5FinancialComponent, Step6PersonalComponent],
  templateUrl: './simulator.html',
})
export class SimulatorComponent {
  protected readonly state = inject(SimulatorStateService);
  private readonly translate = inject(TranslateService);
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
      return pd !== null && !!pd.date_of_birth && pd.number_of_dependents !== null && pd.number_of_dependents >= 0;
    }
    return false;
  });

  protected readonly continueLabel = computed(() =>
    this.state.currentStep() === 6 ? 'simulator.show_result' : 'simulator.continue'
  );

  protected readonly continueTitle = computed(() => {
    if (this.canContinue() || this.state.currentStep() !== 5) return '';
    return this.translate.instant('simulator.continue_incomplete');
  });

  protected continue(): void {
    this.state.setStep(this.state.currentStep() + 1);
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
