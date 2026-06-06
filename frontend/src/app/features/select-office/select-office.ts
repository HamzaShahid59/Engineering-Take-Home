import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { MortgageSimulationService } from '../../core/services/mortgage-simulation.service';
import { OfficeStateService } from '../../core/services/office-state.service';
import { SaveLockService } from '../../core/services/save-lock.service';
import { ToastService } from '../../core/services/toast.service';
import { SimulatorStateService } from '../simulator/simulator-state.service';
import type { Office, SaveLockRequest } from '../../core/models/simulation.models';

@Component({
  selector: 'app-select-office',
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './select-office.html',
})
export class SelectOfficeComponent implements OnInit {
  private readonly simulationService = inject(MortgageSimulationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly saveLockService = inject(SaveLockService);
  private readonly toastService = inject(ToastService);
  private readonly simState = inject(SimulatorStateService);
  protected readonly officeState = inject(OfficeStateService);

  protected readonly offices = signal<Office[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly saving = signal(false);
  protected readonly saveError = signal(false);

  protected readonly form = this.fb.group({
    office_id: ['', Validators.required],
  });

  ngOnInit(): void {
    const current = this.officeState.selectedOffice();
    if (current) {
      this.form.patchValue({ office_id: current.office_id }, { emitEvent: false });
    }

    this.form.controls['office_id'].valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(id => {
        this.saveError.set(false);
        const match = this.offices().find(o => o.office_id === id) ?? null;
        if (match) {
          this.officeState.select(match);
        } else {
          this.officeState.clear();
        }
      });

    this.simulationService.getOffices().subscribe({
      next: list => {
        this.offices.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set(true);
      },
    });
  }

  protected onSaveLock(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.buildPayload();
    if (!payload) {
      this.saveError.set(true);
      return;
    }

    this.saving.set(true);
    this.saveError.set(false);

    this.saveLockService.saveLock(payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.simState.startOver();
        this.toastService.show('save_lock.toast_success');
        this.router.navigateByUrl('/dashboard');
      },
      error: () => {
        this.saving.set(false);
        this.saveError.set(true);
      },
    });
  }

  private buildPayload(): SaveLockRequest | null {
    const pd = this.simState.propertyDetails();
    const fd = this.simState.financialDetails();
    const personal = this.simState.personalDetails();
    const result = this.simState.result();
    const office = this.officeState.selectedOffice();
    const purpose = this.simState.projectPurpose();
    const borrower = this.simState.borrowerType();
    const contribution = this.simState.contribution();

    if (!pd || !fd || !personal || !result || !office || !purpose || !borrower || !contribution) {
      return null;
    }

    const ownFunds = this.simState.sliderOwnFunds() ?? contribution.own_funds!;
    const durationYears = this.simState.sliderDurationYears() ?? 25;

    return {
      project_details: {
        project_purpose: purpose,
        borrower_type: borrower,
        property_type: pd.property_type!,
        property_location: pd.property_location!,
        property_price: pd.property_price!,
        property_usage: pd.property_usage!,
        sale_type: pd.sale_type!,
        epc_score: pd.epc_score,
      },
      contribution: { own_funds: ownFunds },
      financial_details: {
        incomes: fd.incomes.map(r => ({ income_type: r.type!, monthly_amount: r.monthly_amount! })),
        liabilities: fd.liabilities.length > 0
          ? fd.liabilities.map(r => ({ liability_type: r.type!, monthly_amount: r.monthly_amount! }))
          : undefined,
      },
      personal_details: {
        date_of_birth: personal.date_of_birth!,
        number_of_dependents: personal.number_of_dependents!,
      },
      preferred_duration_years: durationYears,
      calculation_result: result,
      selected_office: office,
    };
  }

  protected selectClass(hasError: boolean): string {
    const base =
      'w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-navy-900 dark:text-white';
    return hasError
      ? `${base} border-red-400 dark:border-red-500`
      : `${base} border-gray-300 dark:border-navy-600`;
  }
}
