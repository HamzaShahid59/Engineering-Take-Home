import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/components/header/header';
import { ToastComponent } from './shared/components/toast/toast';
import { ThemeService } from './core/services/theme.service';
import { LanguageService } from './core/services/language.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, ToastComponent],
  templateUrl: './app.html',
})
export class App {
  private readonly themeService = inject(ThemeService);
  private readonly languageService = inject(LanguageService);

  constructor() {
    this.languageService.init();
  }
}
