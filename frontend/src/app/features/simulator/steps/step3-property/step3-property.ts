import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { MortgageSimulationService } from '../../../../core/services/mortgage-simulation.service';
import { SimulatorStateService, PropertyDetailsDraft } from '../../simulator-state.service';
import type { DropdownOption } from '../../../../core/models/simulation.models';

interface Step3Options {
  property_types: DropdownOption[];
  property_locations: DropdownOption[];
  property_usages: DropdownOption[];
  sale_types: DropdownOption[];
}

@Component({
  selector: 'app-step3-property',
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './step3-property.html',
})
export class Step3PropertyComponent implements OnInit {
  private readonly simulationService = inject(MortgageSimulationService);
  private readonly state = inject(SimulatorStateService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly options = signal<Step3Options | null>(null);
  protected readonly loading = signal(true);

  protected readonly form = this.fb.group({
    property_type:     ['', Validators.required],
    property_location: ['', Validators.required],
    property_price:    [null as number | null, [Validators.required, Validators.min(1)]],
    property_usage:    ['', Validators.required],
    sale_type:         ['', Validators.required],
    epc_score:         [null as number | null, [Validators.min(0), Validators.max(2000)]],
  });

  ngOnInit(): void {
    const saved = this.state.propertyDetails();
    if (saved) {
      this.form.patchValue(saved, { emitEvent: false });
    }

    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.state.setPropertyDetails(this.form.getRawValue() as PropertyDetailsDraft);
    });

    this.simulationService.getOptions().subscribe({
      next: opts => {
        this.options.set({
          property_types:     opts.property_types,
          property_locations: opts.property_locations,
          property_usages:    opts.property_usages,
          sale_types:         opts.sale_types,
        });
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected optionKey(category: string, value: string): string {
    const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    return `simulator.${category}.${slug}`;
  }

  protected selectClass(hasError: boolean): string {
    const base = 'w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-navy-900 dark:text-white';
    return hasError
      ? `${base} border-red-400 dark:border-red-500`
      : `${base} border-gray-300 dark:border-navy-600`;
  }

  protected inputClass(hasError: boolean): string {
    const base = 'w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-navy-900 dark:text-white';
    return hasError
      ? `${base} border-red-400 dark:border-red-500`
      : `${base} border-gray-300 dark:border-navy-600`;
  }

  get c() { return this.form.controls; }
}
