import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { SimulatorStateService, FinancialDetailsDraft } from '../../../../core/services/simulator-state.service';
import { MortgageSimulationService } from '../../../../core/services/mortgage-simulation.service';
import { DropdownOption } from '../../../../core/models/simulation.models';

@Component({
  selector: 'app-step5-financial',
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './step5-financial.html',
})
export class Step5FinancialComponent implements OnInit {
  private readonly state = inject(SimulatorStateService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly simService = inject(MortgageSimulationService);

  protected readonly incomeTypes = signal<DropdownOption[]>([]);
  protected readonly liabilityTypes = signal<DropdownOption[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly duplicateIncomeTypes = signal<Set<string>>(new Set());
  protected readonly duplicateLiabilityTypes = signal<Set<string>>(new Set());

  protected readonly incomeForm: FormArray<FormGroup> = this.fb.array<FormGroup>([]);
  protected readonly liabilityForm: FormArray<FormGroup> = this.fb.array<FormGroup>([]);

  ngOnInit(): void {
    this.simService.getOptions().subscribe({
      next: opts => {
        this.incomeTypes.set(opts.income_types);
        this.liabilityTypes.set(opts.liability_types);
        this.loading.set(false);

        const saved = this.state.financialDetails();
        if (saved?.incomes?.length) {
          saved.incomes.forEach(r =>
            this.incomeForm.push(this.makeRow(r.type ?? '', r.monthly_amount), { emitEvent: false })
          );
        } else {
          this.incomeForm.push(this.makeRow(), { emitEvent: false });
        }
        if (saved?.liabilities?.length) {
          saved.liabilities.forEach(r =>
            this.liabilityForm.push(this.makeRow(r.type ?? '', r.monthly_amount), { emitEvent: false })
          );
        }

        this.updateDuplicates();
        this.subscribeChanges();
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set(true);
      },
    });
  }

  private makeRow(type = '', amount: number | null = null): FormGroup {
    return this.fb.group({
      type: [type, Validators.required],
      monthly_amount: [amount, [Validators.required, Validators.min(0.01)]],
    });
  }

  protected addIncomeRow(): void {
    this.incomeForm.push(this.makeRow());
    this.persist();
  }

  protected removeIncomeRow(i: number): void {
    this.incomeForm.removeAt(i);
    this.updateDuplicates();
    this.persist();
  }

  protected addLiabilityRow(): void {
    this.liabilityForm.push(this.makeRow());
    this.persist();
  }

  protected removeLiabilityRow(i: number): void {
    this.liabilityForm.removeAt(i);
    this.updateDuplicates();
    this.persist();
  }

  protected get incomeRows(): FormGroup[] {
    return this.incomeForm.controls as FormGroup[];
  }

  protected get liabilityRows(): FormGroup[] {
    return this.liabilityForm.controls as FormGroup[];
  }

  protected isIncomeDuplicate(i: number): boolean {
    const val: string = this.incomeRows[i]?.controls['type']?.value;
    return val ? this.duplicateIncomeTypes().has(val) : false;
  }

  protected isLiabilityDuplicate(i: number): boolean {
    const val: string = this.liabilityRows[i]?.controls['type']?.value;
    return val ? this.duplicateLiabilityTypes().has(val) : false;
  }

  private subscribeChanges(): void {
    this.incomeForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.updateDuplicates();
      this.persist();
    });
    this.liabilityForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.updateDuplicates();
      this.persist();
    });
  }

  private updateDuplicates(): void {
    this.duplicateIncomeTypes.set(this.findDuplicates(this.incomeRows));
    this.duplicateLiabilityTypes.set(this.findDuplicates(this.liabilityRows));
  }

  private findDuplicates(rows: FormGroup[]): Set<string> {
    const seen = new Set<string>();
    const dupes = new Set<string>();
    for (const g of rows) {
      const t: string = g.controls['type'].value;
      if (t) {
        if (seen.has(t)) dupes.add(t);
        else seen.add(t);
      }
    }
    return dupes;
  }

  private persist(): void {
    const draft: FinancialDetailsDraft = {
      incomes: this.incomeRows.map(g => ({
        type: g.controls['type'].value as string | null,
        monthly_amount: g.controls['monthly_amount'].value as number | null,
      })),
      liabilities: this.liabilityRows.map(g => ({
        type: g.controls['type'].value as string | null,
        monthly_amount: g.controls['monthly_amount'].value as number | null,
      })),
    };
    this.state.setFinancialDetails(draft);
  }

  protected inputClass(hasError: boolean): string {
    const base = 'w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-navy-900 dark:text-white';
    return hasError
      ? `${base} border-red-400 dark:border-red-500`
      : `${base} border-gray-300 dark:border-navy-600`;
  }

  protected selectClass(hasError: boolean): string {
    const base = 'w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-navy-900 dark:text-white';
    return hasError
      ? `${base} border-red-400 dark:border-red-500`
      : `${base} border-gray-300 dark:border-navy-600`;
  }
}
