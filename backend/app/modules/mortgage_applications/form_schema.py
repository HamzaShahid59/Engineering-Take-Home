# Defines the frontend form fields for submitting an application.
def get_application_form_schema() -> dict:
    return {
        "project_details": [
            {"name": "property_address", "label": "Property address", "type": "text", "required": True},
            {"name": "house_number", "label": "House number", "type": "text", "required": True},
            {"name": "box_number", "label": "Box number", "type": "text", "required": False},
            {"name": "postal_code", "label": "Postal code", "type": "text", "required": True},
            {"name": "city", "label": "City", "type": "text", "required": True},
            {"name": "country", "label": "Country", "type": "text", "required": True},
            {"name": "estimated_purchase_date", "label": "Estimated purchase date", "type": "date", "required": True},
            {"name": "notary_name", "label": "Notary name", "type": "text", "required": False},
            {"name": "real_estate_agency", "label": "Real estate agency", "type": "text", "required": False},
        ],
        "borrower_details": [
            {"name": "nationality", "label": "Nationality", "type": "text", "required": True},
            {
                "name": "marital_status",
                "label": "Marital status",
                "type": "select",
                "required": True,
                "options": ["Single", "Married", "Legally cohabiting", "Divorced", "Widowed"],
            },
            {"name": "current_residential_address", "label": "Current residential address", "type": "text", "required": True},
            {"name": "current_postal_code", "label": "Current postal code", "type": "text", "required": True},
            {"name": "current_city", "label": "Current city", "type": "text", "required": True},
            {"name": "current_country", "label": "Current country", "type": "text", "required": True},
        ],
        "income_details": {
            "base_fields": [
                {
                    "name": "income_type",
                    "label": "Income type",
                    "type": "select",
                    "required": True,
                    "options": [
                        "Salary",
                        "Business owner",
                        "Rent",
                        "Variable income",
                        "Future rent",
                        "Child benefit",
                        "Unemployment benefit",
                        "Household income",
                        "Retirement",
                        "Other",
                    ],
                },
                {"name": "monthly_amount", "label": "Monthly amount", "type": "number", "required": True},
            ],
            "details_by_income_type": {
                "Salary": [
                    {"name": "employer_name", "label": "Employer name", "type": "text", "required": True},
                    {"name": "profession", "label": "Profession", "type": "text", "required": True},
                    {
                        "name": "contract_type",
                        "label": "Contract type",
                        "type": "select",
                        "required": True,
                        "options": ["Indefinite", "Fixed-term", "Temporary", "Freelance", "Not applicable"],
                    },
                    {"name": "employment_start_date", "label": "Employment start date", "type": "date", "required": True},
                    {"name": "additional_income_information", "label": "Additional income information", "type": "textarea", "required": False},
                    {"name": "income_stability_notes", "label": "Income stability notes", "type": "textarea", "required": False},
                ],
                "Business owner": [
                    {"name": "business_name", "label": "Business name", "type": "text", "required": True},
                    {"name": "business_start_date", "label": "Business start date", "type": "date", "required": True},
                    {"name": "additional_income_information", "label": "Additional income information", "type": "textarea", "required": False},
                    {"name": "income_stability_notes", "label": "Income stability notes", "type": "textarea", "required": False},
                ],
                "Rent": [
                    {"name": "rental_property_address", "label": "Rental property address", "type": "text", "required": True},
                    {"name": "rental_contract_start_date", "label": "Rental contract start date", "type": "date", "required": True},
                    {"name": "additional_income_information", "label": "Additional income information", "type": "textarea", "required": False},
                    {"name": "income_stability_notes", "label": "Income stability notes", "type": "textarea", "required": False},
                ],
                "Future rent": [
                    {"name": "rental_property_address", "label": "Rental property address", "type": "text", "required": True},
                    {"name": "rental_contract_start_date", "label": "Rental contract start date", "type": "date", "required": True},
                    {"name": "additional_income_information", "label": "Additional income information", "type": "textarea", "required": False},
                    {"name": "income_stability_notes", "label": "Income stability notes", "type": "textarea", "required": False},
                ],
                "Variable income": [
                    {"name": "additional_income_information", "label": "Additional income information", "type": "textarea", "required": True},
                    {"name": "income_stability_notes", "label": "Income stability notes", "type": "textarea", "required": False},
                ],
                "Child benefit": [
                    {"name": "additional_income_information", "label": "Additional income information", "type": "textarea", "required": True},
                    {"name": "income_stability_notes", "label": "Income stability notes", "type": "textarea", "required": False},
                ],
                "Unemployment benefit": [
                    {"name": "additional_income_information", "label": "Additional income information", "type": "textarea", "required": True},
                    {"name": "income_stability_notes", "label": "Income stability notes", "type": "textarea", "required": False},
                ],
                "Household income": [
                    {"name": "additional_income_information", "label": "Additional income information", "type": "textarea", "required": True},
                    {"name": "income_stability_notes", "label": "Income stability notes", "type": "textarea", "required": False},
                ],
                "Retirement": [
                    {"name": "additional_income_information", "label": "Additional income information", "type": "textarea", "required": True},
                    {"name": "income_stability_notes", "label": "Income stability notes", "type": "textarea", "required": False},
                ],
                "Other": [
                    {"name": "additional_income_information", "label": "Additional income information", "type": "textarea", "required": True},
                    {"name": "income_stability_notes", "label": "Income stability notes", "type": "textarea", "required": False},
                ],
            },
        },
        "liability_details": [
            {"name": "has_existing_loans", "label": "Has existing loans", "type": "boolean", "required": True},
            {"name": "liabilities", "label": "Liabilities", "type": "array", "required": False},
            {"name": "additional_financial_obligations", "label": "Additional financial obligations", "type": "textarea", "required": False},
        ],
        "application_details": [
            {"name": "description", "label": "Application description", "type": "textarea", "required": True},
        ],
    }