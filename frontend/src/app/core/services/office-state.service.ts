import { Injectable, signal } from '@angular/core';
import type { Office } from '../models/simulation.models';

@Injectable({ providedIn: 'root' })
export class OfficeStateService {
  readonly selectedOffice = signal<Office | null>(null);

  select(office: Office): void {
    this.selectedOffice.set(office);
  }

  clear(): void {
    this.selectedOffice.set(null);
  }
}
