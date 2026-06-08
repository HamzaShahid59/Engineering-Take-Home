import { Injectable, signal } from '@angular/core';
import { SavedSimulation, SimulationResult } from '../models/simulation.models';

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
  highestStepReached?: number;
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
  private readonly _highestStepReached = signal<number>(
    this._draft.highestStepReached ?? (this._draft.result ? 7 : this._draft.currentStep)
  );
  private readonly _editMode = signal<boolean>(false);
  private readonly _editSimulationId = signal<string | null>(null);

  readonly currentStep = this._currentStep.asReadonly();
  readonly highestStepReached = this._highestStepReached.asReadonly();
  readonly projectPurpose = this._projectPurpose.asReadonly();
  readonly borrowerType = this._borrowerType.asReadonly();
  readonly propertyDetails = this._propertyDetails.asReadonly();
  readonly contribution = this._contribution.asReadonly();
  readonly financialDetails = this._financialDetails.asReadonly();
  readonly personalDetails = this._personalDetails.asReadonly();
  readonly result = this._result.asReadonly();
  readonly sliderOwnFunds = this._sliderOwnFunds.asReadonly();
  readonly sliderDurationYears = this._sliderDurationYears.asReadonly();
  readonly editMode = this._editMode.asReadonly();
  readonly editSimulationId = this._editSimulationId.asReadonly();

  setStep(step: number): void {
    this._currentStep.set(step);
    if (step > this._highestStepReached()) {
      this._highestStepReached.set(step);
    }
    this.persist();
  }

  setProjectPurpose(value: string): void {
    this._projectPurpose.set(value);
    this.invalidateResultIfNeeded();
    this.persist();
  }

  setBorrowerType(value: string): void {
    this._borrowerType.set(value);
    this.invalidateResultIfNeeded();
    this.persist();
  }

  setPropertyDetails(details: PropertyDetailsDraft): void {
    this._propertyDetails.set(details);
    this.invalidateResultIfNeeded();
    this.persist();
  }

  setContribution(contribution: ContributionDraft): void {
    this._contribution.set(contribution);
    this.invalidateResultIfNeeded();
    this.persist();
  }

  setFinancialDetails(details: FinancialDetailsDraft): void {
    this._financialDetails.set(details);
    this.invalidateResultIfNeeded();
    this.persist();
  }

  setPersonalDetails(details: PersonalDetailsDraft): void {
    this._personalDetails.set(details);
    this.invalidateResultIfNeeded();
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

  setEditMode(id: string): void {
    this._editMode.set(true);
    this._editSimulationId.set(id);
  }

  prefillFromSaved(saved: SavedSimulation): void {
    const pd = saved.project_details;
    this._projectPurpose.set(pd.project_purpose);
    this._borrowerType.set(pd.borrower_type);
    this._propertyDetails.set({
      property_type: pd.property_type,
      property_location: pd.property_location,
      property_price: pd.property_price,
      property_usage: pd.property_usage,
      sale_type: pd.sale_type,
      epc_score: pd.epc_score ?? null,
    });
    this._contribution.set({ own_funds: saved.contribution.own_funds });
    this._financialDetails.set({
      incomes: saved.financial_details.incomes.map(i => ({
        type: i.income_type,
        monthly_amount: i.monthly_amount,
      })),
      liabilities: (saved.financial_details.liabilities ?? []).map(l => ({
        type: l.liability_type,
        monthly_amount: l.monthly_amount,
      })),
    });
    this._personalDetails.set({
      date_of_birth: saved.personal_details.date_of_birth,
      number_of_dependents: saved.personal_details.number_of_dependents,
    });
    this._result.set(saved.calculation_result);
    this._sliderOwnFunds.set(saved.contribution.own_funds);
    this._sliderDurationYears.set(saved.calculation_result.duration_years);
    this._currentStep.set(1);
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
    this._highestStepReached.set(1);
    this._editMode.set(false);
    this._editSimulationId.set(null);
    localStorage.removeItem(DRAFT_KEY);
  }

  private invalidateResultIfNeeded(): void {
    if (this._result() !== null && !this._editMode() && this._highestStepReached() > 6) {
      this._highestStepReached.set(6);
    }
  }

  private persist(): void {
    const draft: SimulatorDraft = { currentStep: this._currentStep(), highestStepReached: this._highestStepReached() };
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
