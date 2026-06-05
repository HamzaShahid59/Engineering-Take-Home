import { Injectable, signal } from '@angular/core';

export interface PropertyDetailsDraft {
  property_type: string | null;
  property_location: string | null;
  property_price: number | null;
  property_usage: string | null;
  sale_type: string | null;
  epc_score: number | null;
}

interface SimulatorDraft {
  currentStep: number;
  projectPurpose?: string;
  borrowerType?: string;
  propertyDetails?: PropertyDetailsDraft;
}

const DRAFT_KEY = 'oper:simulator:draft';
const TOTAL_STEPS = 7;

@Injectable({ providedIn: 'root' })
export class SimulatorStateService {
  private readonly _draft = this.restoreDraft();

  private readonly _currentStep = signal<number>(this._draft.currentStep);
  private readonly _projectPurpose = signal<string | null>(this._draft.projectPurpose ?? null);
  private readonly _borrowerType = signal<string | null>(this._draft.borrowerType ?? null);
  private readonly _propertyDetails = signal<PropertyDetailsDraft | null>(this._draft.propertyDetails ?? null);

  readonly currentStep = this._currentStep.asReadonly();
  readonly projectPurpose = this._projectPurpose.asReadonly();
  readonly borrowerType = this._borrowerType.asReadonly();
  readonly propertyDetails = this._propertyDetails.asReadonly();

  setStep(step: number): void {
    this._currentStep.set(step);
    this.persist();
  }

  setProjectPurpose(value: string): void {
    this._projectPurpose.set(value);
    this.persist();
  }

  setBorrowerType(value: string): void {
    this._borrowerType.set(value);
    this.persist();
  }

  setPropertyDetails(details: PropertyDetailsDraft): void {
    this._propertyDetails.set(details);
    this.persist();
  }

  startOver(): void {
    this._currentStep.set(1);
    this._projectPurpose.set(null);
    this._borrowerType.set(null);
    this._propertyDetails.set(null);
    localStorage.removeItem(DRAFT_KEY);
  }

  private persist(): void {
    const draft: SimulatorDraft = { currentStep: this._currentStep() };
    const purpose = this._projectPurpose();
    const borrower = this._borrowerType();
    const property = this._propertyDetails();
    if (purpose) draft.projectPurpose = purpose;
    if (borrower) draft.borrowerType = borrower;
    if (property) draft.propertyDetails = property;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }

  private restoreDraft(): SimulatorDraft {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SimulatorDraft;
        const step = Math.min(Math.max(parsed.currentStep ?? 1, 1), TOTAL_STEPS);
        if (step > 1 && !parsed.projectPurpose) return { currentStep: 1 };
        if (step > 2 && !parsed.borrowerType) return { currentStep: 2, projectPurpose: parsed.projectPurpose };
        if (step > 3 && !parsed.propertyDetails) return { currentStep: 3, projectPurpose: parsed.projectPurpose, borrowerType: parsed.borrowerType };
        return { currentStep: step, projectPurpose: parsed.projectPurpose, borrowerType: parsed.borrowerType, propertyDetails: parsed.propertyDetails };
      }
    } catch {}
    return { currentStep: 1 };
  }
}
