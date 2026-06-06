import { Injectable, signal } from '@angular/core';
import { SimulationResult } from '../../core/models/simulation.models';

export interface ContributionDraft {
  own_funds: number | null;
}

export interface FinancialRowDraft {
  type: string | null;
  monthly_amount: number | null;
}

export interface FinancialDetailsDraft {
  incomes: FinancialRowDraft[];
  liabilities: FinancialRowDraft[];
}

export interface PersonalDetailsDraft {
  date_of_birth: string | null;
  number_of_dependents: number | null;
}

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
  contribution?: ContributionDraft;
  financialDetails?: FinancialDetailsDraft;
  personalDetails?: PersonalDetailsDraft;
  result?: SimulationResult;
  sliderOwnFunds?: number;
  sliderDurationYears?: number;
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
  private readonly _contribution = signal<ContributionDraft | null>(this._draft.contribution ?? null);
  private readonly _financialDetails = signal<FinancialDetailsDraft | null>(this._draft.financialDetails ?? null);
  private readonly _personalDetails = signal<PersonalDetailsDraft | null>(this._draft.personalDetails ?? null);
  private readonly _result = signal<SimulationResult | null>(this._draft.result ?? null);
  private readonly _sliderOwnFunds = signal<number | null>(this._draft.sliderOwnFunds ?? null);
  private readonly _sliderDurationYears = signal<number | null>(this._draft.sliderDurationYears ?? null);

  readonly currentStep = this._currentStep.asReadonly();
  readonly projectPurpose = this._projectPurpose.asReadonly();
  readonly borrowerType = this._borrowerType.asReadonly();
  readonly propertyDetails = this._propertyDetails.asReadonly();
  readonly contribution = this._contribution.asReadonly();
  readonly financialDetails = this._financialDetails.asReadonly();
  readonly personalDetails = this._personalDetails.asReadonly();
  readonly result = this._result.asReadonly();
  readonly sliderOwnFunds = this._sliderOwnFunds.asReadonly();
  readonly sliderDurationYears = this._sliderDurationYears.asReadonly();

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

  setContribution(contribution: ContributionDraft): void {
    this._contribution.set(contribution);
    this.persist();
  }

  setFinancialDetails(details: FinancialDetailsDraft): void {
    this._financialDetails.set(details);
    this.persist();
  }

  setPersonalDetails(details: PersonalDetailsDraft): void {
    this._personalDetails.set(details);
    this.persist();
  }

  setResult(result: SimulationResult): void {
    this._result.set(result);
    this.persist();
  }

  setResultWithSliders(result: SimulationResult, ownFunds: number, durationYears: number): void {
    this._result.set(result);
    this._sliderOwnFunds.set(ownFunds);
    this._sliderDurationYears.set(durationYears);
    this.persist();
  }

  startOver(): void {
    this._currentStep.set(1);
    this._projectPurpose.set(null);
    this._borrowerType.set(null);
    this._propertyDetails.set(null);
    this._contribution.set(null);
    this._financialDetails.set(null);
    this._personalDetails.set(null);
    this._result.set(null);
    this._sliderOwnFunds.set(null);
    this._sliderDurationYears.set(null);
    localStorage.removeItem(DRAFT_KEY);
  }

  private persist(): void {
    const draft: SimulatorDraft = { currentStep: this._currentStep() };
    const purpose = this._projectPurpose();
    const borrower = this._borrowerType();
    const property = this._propertyDetails();
    const contribution = this._contribution();
    const financial = this._financialDetails();
    const personal = this._personalDetails();
    const result = this._result();
    const sliderOwnFunds = this._sliderOwnFunds();
    const sliderDurationYears = this._sliderDurationYears();
    if (purpose) draft.projectPurpose = purpose;
    if (borrower) draft.borrowerType = borrower;
    if (property) draft.propertyDetails = property;
    if (contribution) draft.contribution = contribution;
    if (financial) draft.financialDetails = financial;
    if (personal) draft.personalDetails = personal;
    if (result) draft.result = result;
    if (sliderOwnFunds !== null) draft.sliderOwnFunds = sliderOwnFunds;
    if (sliderDurationYears !== null) draft.sliderDurationYears = sliderDurationYears;
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
        if (step > 4 && !parsed.contribution) return { currentStep: 4, projectPurpose: parsed.projectPurpose, borrowerType: parsed.borrowerType, propertyDetails: parsed.propertyDetails };
        if (step > 5 && !parsed.financialDetails) return { currentStep: 5, projectPurpose: parsed.projectPurpose, borrowerType: parsed.borrowerType, propertyDetails: parsed.propertyDetails, contribution: parsed.contribution };
        if (step > 6 && !parsed.personalDetails) return { currentStep: 6, projectPurpose: parsed.projectPurpose, borrowerType: parsed.borrowerType, propertyDetails: parsed.propertyDetails, contribution: parsed.contribution, financialDetails: parsed.financialDetails };
        if (step === 7 && !parsed.result) return { currentStep: 6, projectPurpose: parsed.projectPurpose, borrowerType: parsed.borrowerType, propertyDetails: parsed.propertyDetails, contribution: parsed.contribution, financialDetails: parsed.financialDetails, personalDetails: parsed.personalDetails };
        return { currentStep: step, projectPurpose: parsed.projectPurpose, borrowerType: parsed.borrowerType, propertyDetails: parsed.propertyDetails, contribution: parsed.contribution, financialDetails: parsed.financialDetails, personalDetails: parsed.personalDetails, result: parsed.result, sliderOwnFunds: parsed.sliderOwnFunds, sliderDurationYears: parsed.sliderDurationYears };
      }
    } catch {}
    return { currentStep: 1 };
  }
}
