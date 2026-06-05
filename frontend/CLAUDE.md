# CLAUDE.md

Read this file before generating or modifying Angular frontend code.

## Project

This is the Angular frontend for the Oper mortgage borrower portal.
The Mortgage Simulator is the main entry point. There is no marketing landing page.

## Stack

Angular
Standalone Components
TypeScript
Tailwind CSS
Reactive Forms
JWT Authentication
HTTP Interceptors
Route Guards
ngx-translate

## Architecture

Use:
src/app/
- core
- features
- shared
- app.routes.ts

Keep code feature-based.
Use standalone components only.
Keep API communication inside services.
Keep authentication inside guards and interceptors.
Keep reusable UI inside shared components.

## Forms

Use Reactive Forms.
Large forms use stepper flows.
Persist draft progress in localStorage.
Provide a Start Over action.

## Authentication

Public:
- Simulator
- Mortgage Calculation

Protected:
- Save & Lock
- Dashboard
- Applications
- Documents

Store JWT in localStorage.
Attach tokens through an interceptor.

## Theme

Support:
- Light
- Dark
- System

Persist theme in localStorage.

## Languages

Support:
- English
- Dutch
- French

Use translation keys from day one.
Never hardcode UI text.

## Coding Style

Prefer simple and readable code.
Avoid unnecessary abstractions.
Keep components small.
Keep services explicit.
Use typed interfaces.