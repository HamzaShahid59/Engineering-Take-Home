import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type Language = 'en' | 'nl' | 'fr';

const STORAGE_KEY = 'oper:language';
const SUPPORTED: Language[] = ['en', 'nl', 'fr'];

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);

  readonly language = signal<Language>(this.loadLanguage());

  init(): void {
    this.translate.setDefaultLang('en');
    this.translate.use(this.language());
  }

  setLanguage(lang: Language): void {
    localStorage.setItem(STORAGE_KEY, lang);
    this.language.set(lang);
    this.translate.use(lang);
  }

  private loadLanguage(): Language {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED.includes(stored as Language)) {
      return stored as Language;
    }
    const browser = navigator.language.slice(0, 2) as Language;
    return SUPPORTED.includes(browser) ? browser : 'en';
  }
}
