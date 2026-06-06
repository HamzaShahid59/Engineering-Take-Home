import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { SimulatorStateService } from '../../../core/services/simulator-state.service';
import { MortgageSimulationService } from '../../../core/services/mortgage-simulation.service';
import { SimulatorComponent } from '../simulator';

@Component({
  selector: 'app-edit-simulator',
  imports: [SimulatorComponent, TranslatePipe],
  templateUrl: './edit-simulator.html',
})
export class EditSimulatorComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly state = inject(SimulatorStateService);
  private readonly simService = inject(MortgageSimulationService);

  protected readonly ready = signal(false);
  protected readonly error = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.simService.getSimulationById(id).subscribe({
      next: saved => {
        this.state.prefillFromSaved(saved);
        this.state.setEditMode(id);
        this.ready.set(true);
      },
      error: () => this.error.set(true),
    });
  }
}
