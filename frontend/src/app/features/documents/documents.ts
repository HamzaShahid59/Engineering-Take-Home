import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-documents',
  imports: [TranslatePipe],
  templateUrl: './documents.html',
})
export class DocumentsComponent {}
