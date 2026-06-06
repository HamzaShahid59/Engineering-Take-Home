import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { MortgageSimulationService } from '../../core/services/mortgage-simulation.service';
import { ToastService } from '../../core/services/toast.service';
import type { SavedSimulation } from '../../core/models/simulation.models';

@Component({
  selector: 'app-dashboard',
  imports: [TranslatePipe],
  templateUrl: './dashboard.html',
})
export class DashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly simService = inject(MortgageSimulationService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly currentUser = this.authService.currentUser;
  protected readonly simulations = signal<SavedSimulation[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly skeletons = [1, 2, 3];

  protected readonly confirmDeleteId = signal<string | null>(null);
  protected readonly deleting = signal(false);

  ngOnInit(): void {
    this.simService.getMySimulations().subscribe({
      next: list => {
        this.simulations.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set(true);
      },
    });
  }

  protected onViewSimulation(id: string): void {
    this.router.navigate(['/simulations', id]);
  }

  protected onEditSimulation(id: string): void {
    this.router.navigate(['/simulations', id, 'edit']);
  }

  protected onDeleteClick(id: string): void {
    this.confirmDeleteId.set(id);
  }

  protected onDeleteCancel(): void {
    this.confirmDeleteId.set(null);
  }

  protected onDeleteConfirm(): void {
    const id = this.confirmDeleteId();
    if (!id) return;
    this.deleting.set(true);
    this.simService.deleteSimulation(id).subscribe({
      next: () => {
        this.simulations.update(list => list.filter(s => s.id !== id));
        this.confirmDeleteId.set(null);
        this.deleting.set(false);
        this.toastService.show('dashboard.toast_deleted');
      },
      error: () => {
        this.confirmDeleteId.set(null);
        this.deleting.set(false);
        this.toastService.show('dashboard.toast_delete_error', 'error');
      },
    });
  }

  protected feasibilityBadgeClass(status: string): string {
    const base = 'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ring-inset';
    if (status === 'Within reach') {
      return `${base} bg-emerald-500/20 text-emerald-300 ring-emerald-500/40`;
    }
    if (status === 'Conditionally feasible') {
      return `${base} bg-amber-500/20 text-amber-300 ring-amber-500/40`;
    }
    return `${base} bg-red-500/20 text-red-300 ring-red-500/40`;
  }

  protected feasibilityDotClass(status: string): string {
    if (status === 'Within reach') return 'bg-emerald-400';
    if (status === 'Conditionally feasible') return 'bg-amber-400';
    return 'bg-red-400';
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

  protected fmtDate(value: string | null | undefined): string {
    if (!value) return '—';
    return new Intl.DateTimeFormat('nl-BE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));
  }
}
