import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { MortgageSimulationService } from '../../../../core/services/mortgage-simulation.service';
import type { DropdownOption } from '../../../../core/models/simulation.models';

@Component({
  selector: 'app-step1-purpose',
  imports: [TranslatePipe],
  templateUrl: './step1-purpose.html',
})
export class Step1PurposeComponent implements OnInit {
  private readonly simulationService = inject(MortgageSimulationService);

  readonly selected = input<string | null>(null);
  readonly select = output<string>();

  protected readonly options = signal<DropdownOption[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);

  ngOnInit(): void {
    this.simulationService.getOptions().subscribe({
      next: opts => {
        this.options.set(opts.project_purposes);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set(true);
      },
    });
  }

  protected optionKey(value: string): string {
    const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    return `simulator.purpose.${slug}`;
  }

  protected cardClass(isSelected: boolean): string {
    const base = 'relative flex w-full items-center gap-3 rounded-xl border px-4 py-4 text-left text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-navy-950';
    if (isSelected) {
      return `${base} border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-500/60 dark:bg-primary-900/20 dark:text-primary-300`;
    }
    return `${base} border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-800/50 dark:text-navy-200 dark:hover:border-navy-600 dark:hover:bg-navy-800`;
  }
}
