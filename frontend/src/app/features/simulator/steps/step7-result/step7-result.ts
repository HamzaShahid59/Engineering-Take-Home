import { Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Subject, debounceTime, switchMap } from 'rxjs';
import { SimulationResult } from '../../../../core/models/simulation.models';
import { SimulatorStateService } from '../../simulator-state.service';
import { MortgageSimulationService } from '../../../../core/services/mortgage-simulation.service';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthReturnIntentService } from '../../../../core/services/auth-return-intent.service';

@Component({
  selector: 'app-step7-result',
  imports: [TranslatePipe],
  templateUrl: './step7-result.html',
})
export class Step7ResultComponent {
  readonly result = input.required<SimulationResult>();

  private readonly state = inject(SimulatorStateService);
  private readonly simService = inject(MortgageSimulationService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly returnIntentService = inject(AuthReturnIntentService);

  protected readonly ownFunds = signal(this.state.sliderOwnFunds() ?? this.state.contribution()!.own_funds!);
  protected readonly durationYears = signal(this.state.sliderDurationYears() ?? 25);
  protected readonly isRecalculating = signal(false);

  private readonly recalcSubject = new Subject<void>();

  constructor() {
    this.recalcSubject.pipe(
      debounceTime(500),
      switchMap(() => {
        this.isRecalculating.set(true);
        return this.simService.calculate(this.buildPayload());
      }),
      takeUntilDestroyed(),
    ).subscribe({
      next: result => {
        this.isRecalculating.set(false);
        this.state.setResultWithSliders(result, this.ownFunds(), this.durationYears());
      },
      error: () => this.isRecalculating.set(false),
    });
  }

  protected readonly propertyPrice = computed(() =>
    this.state.propertyDetails()!.property_price!
  );

  protected readonly loanPreview = computed(() =>
    Math.max(0, this.propertyPrice() - this.ownFunds())
  );

  protected readonly feasible = computed(() =>
    this.result().feasibility_status === 'Within reach'
  );

  protected readonly conditionallyFeasible = computed(() => false);

  protected readonly showSaveLock = computed(() =>
    this.result().feasibility_status === 'Within reach'
  );

  protected readonly ltv = computed(() => {
    const r = this.result();
    return r.property_price > 0 ? (r.loan_amount / r.property_price) * 100 : 0;
  });

  protected readonly ltvWidth = computed(() =>
    `${Math.min(this.ltv(), 100).toFixed(1)}%`
  );

  protected readonly totalRepayable = computed(() => {
    const r = this.result();
    return r.monthly_payment * r.duration_years * 12;
  });

  protected readonly debtRatio = computed(() => {
    const r = this.result();
    return r.monthly_income > 0 ? (r.monthly_payment / r.monthly_income) * 100 : 0;
  });

  protected readonly debtRatioWidth = computed(() =>
    `${Math.min(this.debtRatio(), 100).toFixed(1)}%`
  );

  protected readonly liabilitiesDisplay = computed(() => {
    const v = this.result().monthly_liabilities;
    return v > 0 ? `−${this.fmt(v)}` : this.fmt(v);
  });

  protected readonly debtRatioValueClass = computed(() => {
    const r = this.debtRatio();
    if (r > 40) return 'font-semibold text-red-500 dark:text-red-400';
    if (r > 30) return 'font-semibold text-amber-500 dark:text-amber-400';
    return 'font-semibold text-emerald-600 dark:text-emerald-400';
  });

  protected readonly debtRatioBarClass = computed(() => {
    const r = this.debtRatio();
    if (r > 40) return 'bg-gradient-to-r from-red-500 to-red-400';
    if (r > 30) return 'bg-gradient-to-r from-amber-500 to-amber-400';
    return 'bg-gradient-to-r from-emerald-500 to-emerald-400';
  });

  protected onOwnFundsChange(event: Event): void {
    this.ownFunds.set(+(event.target as HTMLInputElement).value);
    this.recalcSubject.next();
  }

  protected onDurationChange(event: Event): void {
    this.durationYears.set(+(event.target as HTMLInputElement).value);
    this.recalcSubject.next();
  }

  private buildPayload() {
    const pd = this.state.propertyDetails()!;
    const fd = this.state.financialDetails()!;
    return {
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
      contribution: { own_funds: this.ownFunds() },
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
      preferred_duration_years: this.durationYears(),
    };
  }

  protected onSaveLock(): void {
    if (!this.authService.isAuthenticated()) {
      this.returnIntentService.set('save-lock');
      this.router.navigateByUrl('/register');
    } else {
      this.router.navigateByUrl('/select-office');
    }
  }

  protected fmt(value: number): string {
    return new Intl.NumberFormat('nl-BE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  protected fmtRate(value: number): string {
    return `${value.toFixed(2)}%`;
  }

  protected fmtPct(value: number): string {
    return `${value.toFixed(1)}%`;
  }
}
