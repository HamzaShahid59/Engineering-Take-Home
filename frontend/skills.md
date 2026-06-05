# skills.md

Reusable frontend development standards.

## Naming

Files and folders:
- kebab-case

Classes and interfaces:
- PascalCase

Variables and methods:
- camelCase

## Components

Use standalone components.

Keep components focused on one responsibility.

Move API calls into services.

## Services

One service per domain.

Examples:

- AuthService
- MortgageSimulationService
- MortgageApplicationService
- DocumentService
- ThemeService
- LanguageService

## Forms

Use Reactive Forms.

Keep form structure aligned with backend payloads.

Persist draft progress where required.

## Translations

Use ngx-translate.

All visible text must use translation keys.

## Styling

Use Tailwind CSS.

Keep styling consistent.

Support Light, Dark, and System themes.

## State

Prefer local component state.

Do not introduce NgRx unless truly necessary.

## Review Checklist

- Typed interfaces
- Reactive Forms
- Translation keys
- Theme support
- Error handling
- Guarded routes
- Interceptor-based auth
- Clean component structure