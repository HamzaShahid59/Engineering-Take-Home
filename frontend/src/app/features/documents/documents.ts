import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-documents',
  imports: [TranslatePipe],
  template: `
    <div class="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <p class="text-sm text-gray-400 dark:text-navy-400">{{ 'page.documents.placeholder' | translate }}</p>
    </div>
  `,
})
export class DocumentsComponent {}
