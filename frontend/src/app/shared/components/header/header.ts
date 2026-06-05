import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ThemeService, Theme } from '../../../core/services/theme.service';
import { LanguageService, Language } from '../../../core/services/language.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './header.html',
})
export class HeaderComponent {
  protected readonly themeService = inject(ThemeService);
  protected readonly languageService = inject(LanguageService);
  protected readonly authService = inject(AuthService);

  protected readonly languages: Language[] = ['en', 'nl', 'fr'];
  protected readonly menuOpen = signal(false);

  protected toggleMenu(): void {
    this.menuOpen.update(v => !v);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected cycleTheme(): void {
    const order: Theme[] = ['light', 'dark', 'system'];
    const current = this.themeService.theme();
    const next = order[(order.indexOf(current) + 1) % order.length];
    this.themeService.setTheme(next);
  }

  protected setLanguage(lang: Language): void {
    this.languageService.setLanguage(lang);
  }

  protected navClass(active: boolean): string {
    const base = 'text-sm rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500';
    const inactive = 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white';
    const activeState = 'font-semibold text-primary-600 dark:text-primary-400';
    return `${base} ${active ? activeState : inactive}`;
  }

  protected mobileNavClass(active: boolean): string {
    const base = 'block rounded-md px-3 py-2 text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500';
    const inactive = 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-navy-800 dark:hover:text-white';
    const activeState = 'font-semibold text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-navy-800';
    return `${base} ${active ? activeState : inactive}`;
  }
}
