# api-contract.md

Backend endpoints used by the Angular frontend.

## Response Format

All APIs return:

{
  success,
  data,
  error
}

## Authentication

POST /auth/register

POST /auth/login

## Mortgage Simulations

GET /mortgage-simulations/options

GET /mortgage-simulations/options/{type}

POST /mortgage-simulations/calculate

POST /mortgage-simulations/save-and-lock

GET /mortgage-simulations/my-simulations

GET /mortgage-simulations/{simulation_id}

PUT /mortgage-simulations/{simulation_id}

DELETE /mortgage-simulations/{simulation_id}

PATCH /mortgage-simulations/{simulation_id}/office

## Mortgage Applications

POST /mortgage-applications/from-simulation/{simulation_id}

GET /mortgage-applications/my-applications

GET /mortgage-applications/{application_id}

GET /mortgage-applications/{application_id}/form

POST /mortgage-applications/{application_id}/submit

## Documents

POST /mortgage-applications/{application_id}/documents

GET /mortgage-applications/{application_id}/documents

DELETE /mortgage-applications/{application_id}/documents/{document_id}

## Notes

Use JWT authentication for protected endpoints.

Application form schema comes from:

GET /mortgage-applications/{application_id}/form

Documents are uploaded only after application submission.