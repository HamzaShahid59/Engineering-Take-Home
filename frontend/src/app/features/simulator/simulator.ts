import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-simulator',
  imports: [TranslatePipe],
  template: `
    <div class="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-16 text-center">
      <h1 class="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
        {{ 'page.simulator.title' | translate }}
      </h1>
      <p class="max-w-sm text-base text-gray-500 dark:text-navy-300">
        {{ 'page.simulator.subtitle' | translate }}
      </p>
    </div>
  `,
})
export class SimulatorComponent {}
