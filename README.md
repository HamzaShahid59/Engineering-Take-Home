# Oper Credits - Borrower Mortgage Portal

## Overview

This project was developed as part of the Oper Credits AI-Native Engineer take-home assignment.

The application provides a complete borrower mortgage journey, allowing users to:

* Calculate mortgage simulations
* Save and lock mortgage rates
* Manage mortgage simulations
* Create mortgage applications
* Complete a mortgage application workflow
* Upload supporting documents
* Track application progress

The solution consists of a FastAPI backend and an Angular frontend.

---

# Project Structure

```text
/
├── backend/
├── frontend/
└── README.md
```

---

# Technology Stack

## Backend

* FastAPI
* MongoDB Atlas
* Motor
* Pydantic
* JWT Authentication
* ImageKit
* Pytest

## Frontend

* Angular
* TypeScript
* Angular Signals
* Tailwind CSS
* Reactive Forms
* ngx-translate
* JWT Authentication
* Route Guards
* HTTP Interceptors

---

# Implemented Features

## Authentication

* User Registration
* User Login
* JWT Authentication
* Protected Endpoints

---

## Mortgage Simulator

* Multi-step mortgage simulator
* Dynamic mortgage calculations
* Mortgage feasibility assessment
* Save & Lock Rate
* Office selection
* Anonymous calculations

---

## Dashboard

### My Simulations

* View simulations
* Edit simulations
* Delete simulations
* Select preferred office

### My Applications

* View applications
* Access application details

---

## Mortgage Applications

* Create application from simulation
* Draft application workflow
* Multi-step application form
* Auto-save draft progress
* Submit application
* Application overview page
* Application detail page

---

## Documents

* Upload documents
* Delete documents
* View uploaded documents
* ImageKit integration
* Document type management
* Verification status support

Supported document types:

* ID Card
* Payslip
* Bank Statement
* Employment/Business Contract
* Property Document

Supported file formats:

* PDF
* PNG
* JPG
* JPEG

---

# User Journey

## 1. Authentication

The borrower creates an account or logs into an existing account.

---

## 2. Mortgage Simulation

The borrower:

* Selects project details
* Provides financial information
* Provides personal information
* Calculates mortgage feasibility

The simulator is publicly accessible and does not require authentication.

---

## 3. Save & Lock Rate

If the borrower wants to continue:

* Authentication is required
* The simulation is recalculated on the backend
* A mortgage rate is locked
* The simulation is saved

---

## 4. Office Selection

The borrower selects a preferred office.

Example offices:

* Antwerp Office
* Brussels Office
* Ghent Office

---

## 5. Dashboard

The borrower can:

* View saved simulations
* Edit simulations
* Delete simulations

---

## 6. Create Mortgage Application

The borrower reviews a saved simulation and creates a mortgage application.

A draft application is generated from the locked simulation.

---

## 7. Complete Application

The borrower completes a multi-step application flow:

1. Review Simulation Summary
2. Property Details
3. Borrower Details
4. Income Details
5. Liabilities
6. Description
7. Review
8. Submit

---

## 8. Application Submission

When submitted:

* Draft becomes submitted
* Application information becomes read-only
* Application snapshot is preserved

---

## 9. Document Upload

After submission:

* Supporting documents can be uploaded
* Documents can be viewed
* Documents can be deleted

---

## 10. Tracking Progress

The borrower can:

* View application details
* View uploaded documents
* View document verification status

---

# Backend Architecture

The backend follows a modular architecture organized by feature.

```text
app/
│
├── core/
│
├── modules/
│   ├── auth/
│   ├── mortgage_simulations/
│   ├── mortgage_applications/
│   └── documents/
│
└── shared/
```

Each module follows the same structure:

```text
module/
│
├── router.py
├── service.py
├── repository.py
├── schemas.py
└── models.py
```

### Responsibilities

#### router.py

* API endpoints
* Request handling
* Response formatting

#### service.py

* Business logic
* Validation
* Workflow coordination

#### repository.py

* MongoDB operations

#### schemas.py

* Request and response validation

#### models.py

* MongoDB document representation

---

# Frontend Architecture

```text
src/app/
│
├── core/
│   ├── services/
│   ├── interceptors/
│   ├── guards/
│   ├── models/
│   └── theme/
│
├── features/
│   ├── auth/
│   ├── simulator/
│   ├── dashboard/
│   └── applications/
│
├── shared/
│   ├── components/
│   └── utils/
│
└── app.routes.ts
```

### Frontend Features

* Standalone Components
* Angular Signals
* Reactive Forms
* Route Guards
* HTTP Interceptors
* Translation Support
* Theme Support

---

# Internationalization

The application supports:

* English
* Dutch
* French

All UI text is implemented through translation keys from the beginning using ngx-translate.

---

# Theme Support

The application supports:

* Light Theme
* Dark Theme
* System Theme

User preferences are persisted in local storage.

---

# Draft Persistence

Application progress is automatically saved in local storage.

Features:

* Auto-save
* Restore after refresh
* Start Over action
* Stepper navigation

---

# Backend Setup

## Requirements

* Python 3.12+
* MongoDB Atlas

## Installation

```bash
cd backend

python -m venv venv

source venv/bin/activate
# Windows:
# venv\Scripts\activate

pip install -r requirements.txt
```

---

## Environment Variables

Create:

```env
.env
```

```env
MONGO_URI=
DATABASE_NAME=

JWT_SECRET_KEY=
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_URL_ENDPOINT=
```

---

## Run Backend

```bash
uvicorn app.main:app --reload
```

---

## Run Tests

```bash
pytest
```

Implemented test coverage currently includes:

* Authentication
* Mortgage Simulations

---

# Frontend Setup

## Requirements

* Node.js
* Angular CLI

## Installation

```bash
cd frontend

npm install
```

---

## Run Frontend

```bash
ng serve
```

Application:

```text
http://localhost:4200
```

---

# Deployment

## Backend

```text
[TODO]
```

## Frontend

```text
[TODO]
```

---

# AI Usage

AI tools were used throughout development as productivity and implementation assistants.

## Backend Development

Primarily developed with:

* ChatGPT Plus

Usage included:

* Architecture discussions
* Code generation
* Validation logic
* Testing support
* Refactoring assistance

---

## Frontend Development

Primarily developed with:

* Claude

Usage included:

* Angular implementation
* UI workflows
* Form architecture
* Translation support
* Theme implementation

---

# Lessons Learned

## ChatGPT

Observed strengths:

* Rapid backend implementation
* Strong architecture discussions
* Helpful validation and testing support

Observed challenges:

* Sometimes produced inconsistent naming and schemas
* Occasionally introduced tighter coupling than desired
* Required explicit reminders to maintain established architecture and coding style
* Needed continuous context reinforcement to preserve consistency

---

## Claude

Observed strengths:

* Strong Angular implementation support
* Effective UI workflow generation
* Helpful frontend architecture guidance

Observed challenges:

* Large multi-fix prompts could lead to hallucinations
* Sometimes drifted from the intended architecture if not constrained
* Could spend excessive tokens on small UI adjustments
* Benefited from strict architecture guidance through project instructions

---

# Key Takeaways

* Build the initial architecture yourself before relying on AI
* Verify generated code rather than accepting it blindly
* Provide exact files and context when requesting changes
* Maintain strict architectural boundaries
* Manage context carefully and compact conversations strategically

AI accelerated development significantly but still required engineering judgment, code review, and validation throughout the project.

---

# Future Improvements

## Testing

* Expand frontend test coverage
* Add application workflow tests
* Add document workflow tests

---

## Frontend

* Create more reusable Angular form components
* Improve form builder capabilities
* Improve dashboard analytics

---

## Security

* Add malware scanning for uploads
* Add file content validation
* Add rate limiting

---

## Workflow

* Advisor workflows
* Reviewer workflows
* Underwriter workflows
* Role-based permissions
* Application review lifecycle

---

# Final Notes

The objective of this project was not to build a production-ready mortgage platform but to demonstrate:

* Backend architecture
* Frontend architecture
* API design
* Domain modelling
* Testing approach
* AI-native development workflow
* Ability to explain design decisions

The implementation focuses on readability, maintainability, consistency, and clear separation of responsibilities while remaining practical for a take-home assignment.
