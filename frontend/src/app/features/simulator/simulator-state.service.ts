import { Injectable, signal } from '@angular/core';

interface SimulatorDraft {
  currentStep: number;
  projectPurpose?: string;
}

const DRAFT_KEY = 'oper:simulator:draft';
const TOTAL_STEPS = 7;

@Injectable({ providedIn: 'root' })
export class SimulatorStateService {
  private readonly _draft = this.restoreDraft();

  private readonly _currentStep = signal<number>(this._draft.currentStep);
  private readonly _projectPurpose = signal<string | null>(this._draft.projectPurpose ?? null);

  readonly currentStep = this._currentStep.asReadonly();
  readonly projectPurpose = this._projectPurpose.asReadonly();

  setStep(step: number): void {
    this._currentStep.set(step);
    this.persist();
  }

  setProjectPurpose(value: string): void {
    this._projectPurpose.set(value);
    this.persist();
  }

  startOver(): void {
    this._currentStep.set(1);
    this._projectPurpose.set(null);
    localStorage.removeItem(DRAFT_KEY);
  }

  private persist(): void {
    const draft: SimulatorDraft = { currentStep: this._currentStep() };
    const purpose = this._projectPurpose();
    if (purpose) draft.projectPurpose = purpose;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }

  private restoreDraft(): SimulatorDraft {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SimulatorDraft;
        const step = Math.min(Math.max(parsed.currentStep ?? 1, 1), TOTAL_STEPS);
        // Step 2+ requires a project purpose — fall back to step 1 if data is missing.
        if (step > 1 && !parsed.projectPurpose) {
          return { currentStep: 1 };
        }
        return { currentStep: step, projectPurpose: parsed.projectPurpose };
      }
    } catch {}
    return { currentStep: 1 };
  }
}
