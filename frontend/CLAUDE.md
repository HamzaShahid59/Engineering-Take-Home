# CLAUDE.md

Read before modifying frontend code.

## Project

Angular frontend for the Oper mortgage borrower portal.

Main flow:

Simulator → Login/Register → Save & Lock → Dashboard → Applications → Documents

## Stack

Angular
Standalone Components
TypeScript
Tailwind CSS
Reactive Forms
JWT
Route Guards
HTTP Interceptors
ngx-translate

## Architecture

src/app/
- core
- features
- shared
- app.routes.ts

Keep code feature-based.

## File Rules

Services must live in:

src/app/core/services

Do not create services inside feature folders.

Components must use:

- component.ts
- component.html

Do not use inline templates for feature components.

Follow existing folder structure and naming conventions before creating new files.

## Forms

Use Reactive Forms.

Use stepper flows for large forms.

Persist simulator drafts in localStorage.

## Authentication

Public:
- Simulator
- Mortgage Calculation

Protected:
- Save & Lock
- Dashboard
- Applications
- Documents
- Simulation Detail
- Simulation Edit

Store JWT in localStorage.

Use interceptors for bearer tokens.

## Theme

Support:
- Light
- Dark
- System

Persist theme in localStorage.

Use the existing premium glassmorphism design style.

## Languages

Support:
- English
- Dutch
- French

Never hardcode UI text.

Always add new translation keys to:
- en.json
- nl.json
- fr.json

## Coding Style

Keep code simple and readable.

Use typed interfaces.

Avoid any.

Use inject().

Use signals and computed() when appropriate.

Use @if, @for, @switch.

## Workflow

Do not run build, test, install, or verification commands unless explicitly asked.

After completing a task:
- summarize files changed
- stop

Work in small steps.

Do not modify unrelated features.

Do not read unrelated files unless required.