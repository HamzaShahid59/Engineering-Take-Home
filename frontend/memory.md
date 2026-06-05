# memory.md

Project decisions and business rules.

## Simulator

The Mortgage Simulator is public.

Users can calculate mortgages without authentication.

Save & Lock requires authentication.

Locked simulations remain editable.

Users can recalculate and lock again.

Backend always recalculates mortgage results.

Frontend never sends calculation_result.

## Applications

Review & Apply creates a draft application.

Draft applications remain editable.

Application flow:

1 Review Simulation Summary
2 Property Details
3 Borrower Details
4 Income Details
5 Liabilities
6 Description
7 Review
8 Submit

Submitted applications become read-only.

## Documents

Documents are uploaded only after submission.

Documents can be viewed.

Documents can be deleted.

Documents use ImageKit.

## Dashboard

Contains:

- My Simulations
- My Applications

## Application Details

Display:

- Mortgage Summary
- Simulation Snapshot
- Application Details
- Documents

## Storage

Persist:

- JWT Token
- Theme
- Language
- Draft Form Progress

Use application-specific localStorage keys.

## Theme

Light
Dark
System

## Languages

English
Dutch
French