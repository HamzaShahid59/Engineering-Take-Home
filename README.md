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

## What Was Built

### Authentication

* User registration
* User login
* JWT authentication
* Protected routes and endpoints

### Mortgage Simulator

* Multi-step mortgage simulator
* Mortgage affordability and feasibility calculation
* Save & Lock Rate workflow
* Office selection
* Anonymous simulations

### Dashboard

* View simulations
* Edit simulations
* Delete simulations
* View applications

### Mortgage Applications

* Create application from simulation
* Draft application workflow
* Multi-step application form
* Draft persistence
* Application submission
* Read-only submitted applications

### Documents

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
* Employment / Business Contract
* Property Document

Supported file formats:

* PDF
* PNG
* JPG
* JPEG

---

## What Was Intentionally Not Built

To keep the scope manageable and focus on the borrower journey, the following items were intentionally not implemented:

* Email notifications
* Role-based access control
* Document approval and rejection workflows
* Frontend automated tests

---

## Architecture Summary

### Frontend

Angular SPA responsible for:

* Authentication
* Mortgage simulations
* Applications
* Document management
* Localization
* Theme management

### Backend

FastAPI API responsible for:

* Authentication
* Mortgage calculations
* Application workflows
* Document management
* Business validation

### Storage

MongoDB Atlas stores:

* Users
* Simulations
* Applications
* Document metadata

ImageKit stores:

* Uploaded document files

---

## Data Model

The core entities are:

* User
* Mortgage Simulation
* Mortgage Application
* Document

A mortgage application is created from a locked mortgage simulation.

Applications store a snapshot of simulation data to preserve historical information even if future simulations are modified.

Uploaded documents are linked to a specific application. Files are stored in ImageKit while metadata is stored in MongoDB Atlas.

---

## User Journey

### 1. Authentication

The borrower creates an account or logs into an existing account.

### 2. Mortgage Simulation

The borrower:

* Selects project details
* Provides financial information
* Provides personal information
* Calculates mortgage feasibility

The simulator is publicly accessible and does not require authentication.

### 3. Save & Lock Rate

If the borrower wants to continue:

* Authentication is required
* The simulation is recalculated on the backend
* A mortgage rate is locked
* The simulation is saved

### 4. Office Selection

The borrower selects a preferred office.

### 5. Dashboard

The borrower can:

* View saved simulations
* Edit simulations
* Delete simulations

### 6. Create Mortgage Application

The borrower reviews a saved simulation and creates a mortgage application.

A draft application is generated from the locked simulation.

### 7. Complete Application

The borrower completes:

1. Property Details
2. Borrower Details
3. Income Details
4. Liabilities
5. Description
6. Submit Application

### 8. Application Submission

When submitted:

* Draft becomes submitted
* Application becomes read-only
* Application snapshot is preserved

### 9. Document Upload

After submission:

* Supporting documents can be uploaded
* Documents can be viewed
* Documents can be deleted

### 10. Tracking Progress

The borrower can:

* View application details
* View uploaded documents
* View document verification status

---

## Technology Stack

### Backend

* FastAPI
* MongoDB Atlas
* Motor
* Pydantic
* JWT Authentication
* ImageKit
* Pytest

### Frontend

* Angular
* TypeScript
* Angular Signals
* Tailwind CSS
* Reactive Forms
* ngx-translate
* Route Guards
* HTTP Interceptors

---

## Backend Architecture

The backend follows a modular feature-based architecture.

```text
app/
├── core/
├── modules/
│   ├── users/
│   ├── mortgage_simulations/
│   ├── mortgage_applications/
│   └── documents/
└── shared/
```

Each module follows:

```text
router.py
service.py
repository.py
schemas.py
models.py
```

Responsibilities:

* router.py → API endpoints
* service.py → business logic
* repository.py → database operations
* schemas.py → validation
* models.py → persistence models

---

## Frontend Architecture

```text
src/app/
├── core/
│   ├── services/
│   ├── interceptors/
│   ├── guards/
│   └── models/
├── features/
│   ├── auth/
│   ├── simulator/
│   ├── dashboard/
│   ├── applications/
│   └── documents/
└── shared/
```

Key frontend features:

* Standalone Components
* Angular Signals
* Reactive Forms
* Translation Support
* Theme Support
* Route Guards
* HTTP Interceptors

---

## Local Development

### Backend

```bash
cd backend
python -m venv venv
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm start
```

### Environment Variables (Backend Only)

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

## Deployment

### Frontend

https://engineering-take-home.vercel.app/

### Backend

https://engineering-take-home.fly.dev/

---

## Testing

Current automated tests cover:

* User registration
* User login
* Authentication validation
* Mortgage simulation workflows

---

## Trade-offs Due To Time Limit

To prioritize delivering a complete end-to-end workflow:

* Implemented a simplified mortgage calculation model
* Limited automated testing to backend authentication and simulation workflows
* Kept document handling metadata-based without approval workflows
* Prioritized feature completeness and clean architecture over advanced optimizations

---

## AI Usage

The overall architecture, workflows, and implementation decisions were defined by me and then implemented with AI assistance.

AI-generated code was reviewed, tested, debugged, and adjusted manually before being integrated into the application.

### Backend Development

Primarily developed with ChatGPT Plus.

Used for:

* Architecture discussions
* Code generation
* Validation logic
* Testing support
* Refactoring assistance

### Frontend Development

Primarily developed with Claude.

Used for:

* Angular implementation
* UI workflows
* Form architecture
* Localization support
* Theme implementation

---

## Time Spent

I exceeded the suggested 2-hour limit.

Estimated active development time:

* Backend implementation: ~30–35 minutes
* Backend debugging and testing: ~15–20 minutes
* Frontend implementation: ~45–50 minutes
* Frontend debugging and testing: ~40–45 minutes

Total active human time: approximately 2.2–2.5 hours.

A significant portion of the time was spent debugging and validating end-to-end workflows rather than implementing new features.

---

## Lessons Learned

### ChatGPT

Strengths:

* Rapid backend implementation
* Strong architecture discussions
* Helpful validation and testing support

Challenges:

* Sometimes produced inconsistent naming and schemas
* Occasionally introduced tighter coupling than desired
* Required explicit reminders to maintain architecture consistency
* Needed continuous context reinforcement

### Claude

Strengths:

* Strong Angular implementation support
* Effective UI workflow generation
* Helpful frontend architecture guidance

Challenges:

* Large prompts could lead to hallucinations
* Occasionally drifted from intended architecture
* Sometimes used excessive reasoning for small UI changes
* Benefited from strict architectural instructions

---

## Future Improvements

* Expand frontend and backend automated test coverage
* Create more reusable Angular form abstractions
* Add malware scanning for uploaded files
* Add deeper file content validation
* Implement document approval workflows
* Introduce role-based review processes

---

## Final Notes

The objective of this project was not to build a production-ready mortgage platform but to demonstrate:

* Backend architecture
* Frontend architecture
* API design
* Domain modelling
* Testing approach
* AI-native development workflow
* Ability to explain design decisions

The implementation focuses on readability, maintainability, consistency, and clear separation of responsibilities while remaining practical for a take-home assignment.
