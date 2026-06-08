import { Component, DestroyRef, OnInit, computed, effect, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { SimulatorStateService, ContributionDraft } from '../../../../core/services/simulator-state.service';

function maxOwnFundsValidator(getMax: () => number | null) {
  return (control: AbstractControl): ValidationErrors | null => {
    const max = getMax();
    const value = control.value as number | null;
    if (max === null || value === null || value === undefined) return null;
    return value > max ? { exceeds_max: { max } } : null;
  };
}

@Component({
  selector: 'app-step4-contribution',
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './step4-contribution.html',
})
export class Step4ContributionComponent implements OnInit {
  private readonly state = inject(SimulatorStateService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly maxOwnFunds = computed(() => {
    const price = this.state.propertyDetails()?.property_price ?? null;
    return price !== null ? Math.floor(price * 0.9) : null;
  });

  protected readonly form = this.fb.group({
    own_funds: [null as number | null, [Validators.required, Validators.min(0), maxOwnFundsValidator(() => this.maxOwnFunds())]],
  });

  constructor() {
    effect(() => {
      this.maxOwnFunds();
      this.form.controls.own_funds.updateValueAndValidity({ emitEvent: false });
    });
  }

  ngOnInit(): void {
    const saved = this.state.contribution();
    if (saved) {
      this.form.patchValue(saved, { emitEvent: false });
    }

    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.state.setContribution(this.form.getRawValue() as ContributionDraft);
    });
  }

  protected inputClass(hasError: boolean): string {
    const base = 'w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-navy-900 dark:text-white';
    return hasError
      ? `${base} border-red-400 dark:border-red-500`
      : `${base} border-gray-300 dark:border-navy-600`;
  }

  get c() { return this.form.controls; }
}
