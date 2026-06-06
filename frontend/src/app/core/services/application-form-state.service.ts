import { Injectable, signal } from '@angular/core';
import type {
  ApplicationDetails,
  ApplicationFieldSchema,
  ApplicationFormResponse,
  PrefilledIncome,
  PrefilledLiability,
} from '../models/application.models';

interface ApplicationFormStorage {
  applicationId: string;
  status: string;
  fieldSchema: ApplicationFieldSchema | null;
  prefilledData: ApplicationDetails | null;
  prefilledIncomes: PrefilledIncome[] | null;
  prefilledLiabilities: PrefilledLiability[] | null;
  draftFormData: Partial<ApplicationDetails> | null;
}

const storageKey = (id: string) => `oper:application-form:${id}`;

@Injectable({ providedIn: 'root' })
export class ApplicationFormStateService {
  private readonly _applicationId = signal<string | null>(null);
  private readonly _status = signal<string | null>(null);
  private readonly _fieldSchema = signal<ApplicationFieldSchema | null>(null);
  private readonly _prefilledData = signal<ApplicationDetails | null>(null);
  private readonly _prefilledIncomes = signal<PrefilledIncome[] | null>(null);
  private readonly _prefilledLiabilities = signal<PrefilledLiability[] | null>(null);
  private readonly _draftFormData = signal<Partial<ApplicationDetails> | null>(null);

  readonly applicationId = this._applicationId.asReadonly();
  readonly status = this._status.asReadonly();
  readonly fieldSchema = this._fieldSchema.asReadonly();
  readonly prefilledData = this._prefilledData.asReadonly();
  readonly prefilledIncomes = this._prefilledIncomes.asReadonly();
  readonly prefilledLiabilities = this._prefilledLiabilities.asReadonly();
  readonly draftFormData = this._draftFormData.asReadonly();

  /**
   * Attempt to restore persisted state for the given application.
   * Returns true if cached data was found and loaded.
   */
  init(applicationId: string): boolean {
    const stored = this.restore(applicationId);
    if (stored) {
      this._applicationId.set(stored.applicationId);
      this._status.set(stored.status);
      this._fieldSchema.set(stored.fieldSchema);
      this._prefilledData.set(stored.prefilledData);
      this._prefilledIncomes.set(stored.prefilledIncomes ?? null);
      this._prefilledLiabilities.set(stored.prefilledLiabilities ?? null);
      this._draftFormData.set(stored.draftFormData);
      return true;
    }
    this._applicationId.set(applicationId);
    return false;
  }

  /** Store API response data and persist. Draft form data is preserved. */
  setFromApiResponse(app: ApplicationFormResponse): void {
    this._applicationId.set(app.id);
    this._status.set(app.status);
    this._fieldSchema.set(app.field_schema);
    this._prefilledData.set(app.application_details ?? null);
    const incomes = app.prefilled_data?.financial_details?.incomes ?? null;
    console.log('[FormState] prefilled_data.incomes from API:', incomes);
    this._prefilledIncomes.set(incomes);

    const liabilities = app.prefilled_data?.financial_details?.liabilities ?? null;
    this._prefilledLiabilities.set(liabilities);

    // If the saved draft has an empty income_details list (stale from a previous run
    // before prefilled_data was supported), wipe it so the prefill can take effect.
    const currentDraft = this._draftFormData();
    if (
      incomes?.length &&
      currentDraft?.income_details != null &&
      currentDraft.income_details.length === 0
    ) {
      this._draftFormData.set({ ...currentDraft, income_details: undefined });
    }

    this.persist();
  }

  /** Update the user's in-progress draft form data and persist. */
  updateDraft(data: Partial<ApplicationDetails>): void {
    this._draftFormData.set(data);
    this.persist();
  }

  /** Remove only the draft form entries from storage (keeps API data). */
  clearDraft(): void {
    this._draftFormData.set(null);
    this.persist();
  }

  /** Clear all persisted state for the current application and reset signals. */
  clear(): void {
    const id = this._applicationId();
    if (id) localStorage.removeItem(storageKey(id));
    this._applicationId.set(null);
    this._status.set(null);
    this._fieldSchema.set(null);
    this._prefilledData.set(null);
    this._prefilledIncomes.set(null);
    this._prefilledLiabilities.set(null);
    this._draftFormData.set(null);
  }

  private persist(): void {
    const id = this._applicationId();
    if (!id) return;
    const state: ApplicationFormStorage = {
      applicationId: id,
      status: this._status() ?? '',
      fieldSchema: this._fieldSchema(),
      prefilledData: this._prefilledData(),
      prefilledIncomes: this._prefilledIncomes(),
      prefilledLiabilities: this._prefilledLiabilities(),
      draftFormData: this._draftFormData(),
    };
    localStorage.setItem(storageKey(id), JSON.stringify(state));
  }

  private restore(applicationId: string): ApplicationFormStorage | null {
    try {
      const raw = localStorage.getItem(storageKey(applicationId));
      if (raw) return JSON.parse(raw) as ApplicationFormStorage;
    } catch {}
    return null;
  }
}
