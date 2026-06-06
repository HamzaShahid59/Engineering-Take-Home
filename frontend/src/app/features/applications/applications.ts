import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { MortgageApplicationService } from '../../core/services/mortgage-application.service';
import type { MortgageApplicationResponse } from '../../core/models/application.models';

@Component({
  selector: 'app-applications',
  imports: [TranslatePipe],
  templateUrl: './applications.html',
})
export class ApplicationsComponent implements OnInit {
  private readonly appService = inject(MortgageApplicationService);
  private readonly router = inject(Router);

  protected readonly applications = signal<MortgageApplicationResponse[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly skeletons = [1, 2, 3];

  ngOnInit(): void {
    this.appService.getMyApplications().subscribe({
      next: list => {
        this.applications.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set(true);
      },
    });
  }

  protected onViewApplication(id: string): void {
    this.router.navigate(['/applications', id]);
  }

  protected onFillInfo(id: string): void {
    this.router.navigate(['/applications', id, 'form']);
  }

  protected statusBadgeClass(status: string): string {
    const base =
      'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ring-inset';
    switch (status.toLowerCase()) {
      case 'draft':
        return `${base} bg-amber-500/20 text-amber-300 ring-amber-500/40`;
      case 'submitted':
        return `${base} bg-blue-500/20 text-blue-300 ring-blue-500/40`;
      case 'in_review':
        return `${base} bg-purple-500/20 text-purple-300 ring-purple-500/40`;
      case 'approved':
        return `${base} bg-emerald-500/20 text-emerald-300 ring-emerald-500/40`;
      case 'rejected':
        return `${base} bg-red-500/20 text-red-300 ring-red-500/40`;
      default:
        return `${base} bg-gray-500/20 text-gray-300 ring-gray-500/40`;
    }
  }

  protected statusDotClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'bg-amber-400';
      case 'submitted':
        return 'bg-blue-400';
      case 'in_review':
        return 'bg-purple-400';
      case 'approved':
        return 'bg-emerald-400';
      case 'rejected':
        return 'bg-red-400';
      default:
        return 'bg-gray-400';
    }
  }

  protected statusKey(status: string): string {
    const slug = status.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    return `applications.status.${slug}`;
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
