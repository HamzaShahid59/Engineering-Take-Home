import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { MortgageApplicationService } from '../../../core/services/mortgage-application.service';
import type { ApplicationIncomeItem, MortgageApplicationResponse } from '../../../core/models/application.models';

@Component({
  selector: 'app-application-detail',
  imports: [TranslatePipe],
  templateUrl: './application-detail.html',
})
export class ApplicationDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly appService = inject(MortgageApplicationService);

  protected readonly application = signal<MortgageApplicationResponse | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly activeTab = signal<'details' | 'documents'>('details');

  protected readonly ltv = computed(() => {
    const r = this.application()?.simulation_snapshot.calculation_result;
    if (!r || r.property_price === 0) return 0;
    return (r.loan_amount / r.property_price) * 100;
  });

  protected readonly ltvWidth = computed(() => `${Math.min(this.ltv(), 100).toFixed(1)}%`);

  protected readonly totalRepayable = computed(() => {
    const r = this.application()?.simulation_snapshot.calculation_result;
    if (!r) return 0;
    return r.monthly_payment * r.duration_years * 12;
  });

  protected readonly debtRatio = computed(() => {
    const r = this.application()?.simulation_snapshot.calculation_result;
    if (!r || r.monthly_income === 0) return 0;
    return (r.monthly_payment / r.monthly_income) * 100;
  });

  protected readonly debtRatioWidth = computed(() => `${Math.min(this.debtRatio(), 100).toFixed(1)}%`);

  protected readonly liabilitiesDisplay = computed(() => {
    const v = this.application()?.simulation_snapshot.calculation_result.monthly_liabilities ?? 0;
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
      this.router.navigateByUrl('/applications');
      return;
    }
    this.appService.getApplicationById(id).subscribe({
      next: app => {
        this.application.set(app);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set(true);
      },
    });
  }

  protected goBack(): void {
    this.router.navigateByUrl('/applications');
  }

  protected onFillInfo(id: string): void {
    this.router.navigate(['/applications', id, 'form']);
  }

  protected statusBadgeClass(status: string): string {
    const base = 'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ring-inset';
    switch (status.toLowerCase()) {
      case 'draft': return `${base} bg-amber-500/20 text-amber-300 ring-amber-500/40`;
      case 'submitted': return `${base} bg-blue-500/20 text-blue-300 ring-blue-500/40`;
      case 'in_review': return `${base} bg-purple-500/20 text-purple-300 ring-purple-500/40`;
      case 'approved': return `${base} bg-emerald-500/20 text-emerald-300 ring-emerald-500/40`;
      case 'rejected': return `${base} bg-red-500/20 text-red-300 ring-red-500/40`;
      default: return `${base} bg-gray-500/20 text-gray-300 ring-gray-500/40`;
    }
  }

  protected statusDotClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'draft': return 'bg-amber-400';
      case 'submitted': return 'bg-blue-400';
      case 'in_review': return 'bg-purple-400';
      case 'approved': return 'bg-emerald-400';
      case 'rejected': return 'bg-red-400';
      default: return 'bg-gray-400';
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

  protected propertyTypeKey(value: string): string {
    const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    return `simulator.property_type.${slug}`;
  }

  protected incomeDetailFields(item: ApplicationIncomeItem): Array<{ labelKey: string; value: string }> {
    const d = item.details as unknown as Record<string, unknown>;
    const fields: Array<{ labelKey: string; value: string }> = [];

    const add = (key: string, labelKey: string, format?: 'date') => {
      const val = d[key];
      if (val == null || val === '') return;
      const display = format === 'date' ? this.fmtDate(String(val)) : String(val);
      fields.push({ labelKey, value: display });
    };

    add('employer_name', 'application_detail.income.employer_name');
    add('profession', 'application_detail.income.profession');
    add('contract_type', 'application_detail.income.contract_type');
    add('employment_start_date', 'application_detail.income.employment_start_date', 'date');
    add('business_name', 'application_detail.income.business_name');
    add('business_start_date', 'application_detail.income.business_start_date', 'date');
    add('rental_property_address', 'application_detail.income.rental_property_address');
    add('rental_contract_start_date', 'application_detail.income.rental_contract_start_date', 'date');
    add('additional_income_information', 'application_detail.income.additional_info');
    add('income_stability_notes', 'application_detail.income.stability_notes');

    return fields;
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
