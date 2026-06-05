import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { SimulatorStateService, PersonalDetailsDraft } from '../../simulator-state.service';
import {
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

function ageValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null;
    }

    const birthDate = new Date(value);
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

    if (age < 18) {
      return { minAge: true };
    }

    if (age > 65) {
      return { maxAge: true };
    }

    return null;
  };
}

@Component({
  selector: 'app-step6-personal',
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './step6-personal.html',
})
export class Step6PersonalComponent implements OnInit {
  private readonly state = inject(SimulatorStateService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly form = this.fb.group({
    date_of_birth: [
      null as string | null,
      [
        Validators.required,
        ageValidator(),
      ],
    ],
    number_of_dependents: [
      null as number | null,
      [
        Validators.required,
        Validators.min(0),
        Validators.max(10),
      ],
    ],
  });

  ngOnInit(): void {
    const saved = this.state.personalDetails();
    if (saved) {
      this.form.patchValue(saved, { emitEvent: false });
    }

    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.state.setPersonalDetails(this.form.getRawValue() as PersonalDetailsDraft);
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
