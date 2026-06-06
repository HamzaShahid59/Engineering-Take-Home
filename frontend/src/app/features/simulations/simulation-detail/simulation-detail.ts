import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { MortgageSimulationService } from '../../../core/services/mortgage-simulation.service';
import { ToastService } from '../../../core/services/toast.service';
import type { SavedSimulation } from '../../../core/models/simulation.models';

@Component({
  selector: 'app-simulation-detail',
  imports: [TranslatePipe],
  templateUrl: './simulation-detail.html',
})
export class SimulationDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly simService = inject(MortgageSimulationService);
  private readonly toastService = inject(ToastService);

  protected readonly simulation = signal<SavedSimulation | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly confirmDelete = signal(false);
  protected readonly deleting = signal(false);

  protected readonly ltv = computed(() => {
    const r = this.simulation()?.calculation_result;
    if (!r || r.property_price === 0) return 0;
    return (r.loan_amount / r.property_price) * 100;
  });

  protected readonly ltvWidth = computed(() => `${Math.min(this.ltv(), 100).toFixed(1)}%`);

  protected readonly totalRepayable = computed(() => {
    const r = this.simulation()?.calculation_result;
    if (!r) return 0;
    return r.monthly_payment * r.duration_years * 12;
  });

  protected readonly debtRatio = computed(() => {
    const r = this.simulation()?.calculation_result;
    if (!r || r.monthly_income === 0) return 0;
    return (r.monthly_payment / r.monthly_income) * 100;
  });

  protected readonly debtRatioWidth = computed(() => `${Math.min(this.debtRatio(), 100).toFixed(1)}%`);

  protected readonly liabilitiesDisplay = computed(() => {
    const v = this.simulation()?.calculation_result.monthly_liabilities ?? 0;
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

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigateByUrl('/dashboard');
      return;
    }
    this.simService.getSimulationById(id).subscribe({
      next: sim => {
        this.simulation.set(sim);
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

  protected onEditClick(): void {
    const id = this.simulation()?.id;
    if (id) this.router.navigate(['/simulations', id, 'edit']);
  }

  protected onDeleteClick(): void {
    this.confirmDelete.set(true);
  }

  protected onDeleteCancel(): void {
    this.confirmDelete.set(false);
  }

  protected onDeleteConfirm(): void {
    const id = this.simulation()?.id;
    if (!id) return;
    this.deleting.set(true);
    this.simService.deleteSimulation(id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.confirmDelete.set(false);
        this.toastService.show('dashboard.toast_deleted');
        this.router.navigateByUrl('/dashboard');
      },
      error: () => {
        this.deleting.set(false);
        this.confirmDelete.set(false);
        this.toastService.show('dashboard.toast_delete_error', 'error');
      },
    });
  }

  protected feasibilityBadgeClass(status: string): string {
    const base = 'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ring-inset';
    if (status === 'Within reach') return `${base} bg-emerald-500/20 text-emerald-300 ring-emerald-500/40`;
    if (status === 'Conditionally feasible') return `${base} bg-amber-500/20 text-amber-300 ring-amber-500/40`;
    return `${base} bg-red-500/20 text-red-300 ring-red-500/40`;
  }

  protected feasibilityDotClass(status: string): string {
    if (status === 'Within reach') return 'h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400';
    if (status === 'Conditionally feasible') return 'h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400';
    return 'h-1.5 w-1.5 shrink-0 rounded-full bg-red-400';
  }

  protected feasibilityKey(status: string): string {
    if (status === 'Within reach') return 'simulator.step7.feasible';
    if (status === 'Conditionally feasible') return 'simulator.step7.conditionally_feasible';
    return 'simulator.step7.not_feasible';
  }

  protected purposeKey(value: string): string {
    const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    return `simulator.purpose.${slug}`;
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

  protected fmtDate(value: string | null | undefined): string {
    if (!value) return '—';
    return new Intl.DateTimeFormat('nl-BE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));
  }
}
