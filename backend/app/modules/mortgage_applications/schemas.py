from datetime import date, datetime
from enum import Enum
from typing import Annotated, List, Literal, Optional, Union

from pydantic import BaseModel, Field, field_validator

from app.modules.mortgage_simulations.schemas import (
    ContributionSchema,
    FinancialDetailsSchema,
    IncomeType,
    MortgageSimulationResultSchema,
    PersonalDetailsSchema,
    ProjectDetailsSchema,
)


class MaritalStatus(str, Enum):
    single = "Single"
    married = "Married"
    legally_cohabiting = "Legally cohabiting"
    divorced = "Divorced"
    widowed = "Widowed"


class ContractType(str, Enum):
    indefinite = "Indefinite"
    fixed_term = "Fixed-term"
    temporary = "Temporary"
    freelance = "Freelance"
    not_applicable = "Not applicable"


# Stores the exact data copied from the locked simulation.
class SimulationSnapshotSchema(BaseModel):
    project_details: ProjectDetailsSchema
    contribution: ContributionSchema
    financial_details: FinancialDetailsSchema
    personal_details: PersonalDetailsSchema
    calculation_result: MortgageSimulationResultSchema
    selected_office: Optional[dict] = None


# Captures detailed property information entered during application.
class ApplicationProjectDetailsSchema(BaseModel):
    property_address: str = Field(..., min_length=2, max_length=150)
    house_number: str = Field(..., min_length=1, max_length=20)
    box_number: Optional[str] = Field(default=None, max_length=20)
    postal_code: str = Field(..., min_length=3, max_length=20)
    city: str = Field(..., min_length=2, max_length=100)
    country: str = Field(..., min_length=2, max_length=100)
    estimated_purchase_date: date
    notary_name: Optional[str] = Field(default=None, max_length=100)
    real_estate_agency: Optional[str] = Field(default=None, max_length=100)

    @field_validator(
        "property_address",
        "house_number",
        "box_number",
        "postal_code",
        "city",
        "country",
        "notary_name",
        "real_estate_agency",
    )
    @classmethod
    def strip_text_fields(cls, value: Optional[str]):
        if value is None:
            return value

        value = value.strip()

        if not value:
            return None

        return value


# Captures borrower identity and current residence details.
class BorrowerDetailsSchema(BaseModel):
    nationality: str = Field(..., min_length=2, max_length=100)
    marital_status: MaritalStatus
    current_residential_address: str = Field(..., min_length=2, max_length=150)
    current_postal_code: str = Field(..., min_length=3, max_length=20)
    current_city: str = Field(..., min_length=2, max_length=100)
    current_country: str = Field(..., min_length=2, max_length=100)

    @field_validator(
        "nationality",
        "current_residential_address",
        "current_postal_code",
        "current_city",
        "current_country",
    )
    @classmethod
    def strip_text_fields(cls, value: str):
        return value.strip()


# Details required when the income source is salary.
class SalaryIncomeDetailsSchema(BaseModel):
    employer_name: str = Field(..., min_length=2, max_length=100)
    profession: str = Field(..., min_length=2, max_length=100)
    contract_type: ContractType
    employment_start_date: date
    additional_income_information: Optional[str] = Field(default=None, max_length=500)
    income_stability_notes: Optional[str] = Field(default=None, max_length=500)

    @field_validator(
        "employer_name",
        "profession",
        "additional_income_information",
        "income_stability_notes",
    )
    @classmethod
    def strip_text_fields(cls, value: Optional[str]):
        if value is None:
            return value

        value = value.strip()

        if not value:
            return None

        return value


# Details required when the borrower owns a business.
class BusinessOwnerIncomeDetailsSchema(BaseModel):
    business_name: str = Field(..., min_length=2, max_length=100)
    business_start_date: date
    additional_income_information: Optional[str] = Field(default=None, max_length=500)
    income_stability_notes: Optional[str] = Field(default=None, max_length=500)

    @field_validator(
        "business_name",
        "additional_income_information",
        "income_stability_notes",
    )
    @classmethod
    def strip_text_fields(cls, value: Optional[str]):
        if value is None:
            return value

        value = value.strip()

        if not value:
            return None

        return value


# Details required when the income comes from rent.
class RentalIncomeDetailsSchema(BaseModel):
    rental_property_address: str = Field(..., min_length=2, max_length=150)
    rental_contract_start_date: date
    additional_income_information: Optional[str] = Field(default=None, max_length=500)
    income_stability_notes: Optional[str] = Field(default=None, max_length=500)

    @field_validator(
        "rental_property_address",
        "additional_income_information",
        "income_stability_notes",
    )
    @classmethod
    def strip_text_fields(cls, value: Optional[str]):
        if value is None:
            return value

        value = value.strip()

        if not value:
            return None

        return value


# Details required for flexible or benefit-based income types.
class OtherIncomeDetailsSchema(BaseModel):
    additional_income_information: str = Field(..., min_length=2, max_length=500)
    income_stability_notes: Optional[str] = Field(default=None, max_length=500)

    @field_validator(
        "additional_income_information",
        "income_stability_notes",
    )
    @classmethod
    def strip_text_fields(cls, value: Optional[str]):
        if value is None:
            return value

        return value.strip()


IncomeDetailsSchema = Annotated[
    Union[
        SalaryIncomeDetailsSchema,
        BusinessOwnerIncomeDetailsSchema,
        RentalIncomeDetailsSchema,
        OtherIncomeDetailsSchema,
    ],
    Field(union_mode="left_to_right"),
]


# Represents one income entry with details based on income type.
class ApplicationIncomeItemSchema(BaseModel):
    income_type: IncomeType
    monthly_amount: float = Field(..., gt=0)
    details: IncomeDetailsSchema

    @field_validator("details")
    @classmethod
    def validate_details_for_income_type(cls, value: IncomeDetailsSchema, info):
        income_type = info.data.get("income_type")

        if income_type == IncomeType.salary and not isinstance(
            value,
            SalaryIncomeDetailsSchema,
        ):
            raise ValueError("Salary income requires salary details.")

        if income_type == IncomeType.business_owner and not isinstance(
            value,
            BusinessOwnerIncomeDetailsSchema,
        ):
            raise ValueError("Business owner income requires business details.")

        if income_type in [IncomeType.rent, IncomeType.future_rent] and not isinstance(
            value,
            RentalIncomeDetailsSchema,
        ):
            raise ValueError("Rental income requires rental details.")

        flexible_income_types = [
            IncomeType.variable_income,
            IncomeType.child_benefit,
            IncomeType.unemployment_benefit,
            IncomeType.household_income,
            IncomeType.retirement,
            IncomeType.other,
        ]

        if income_type in flexible_income_types and not isinstance(
            value,
            OtherIncomeDetailsSchema,
        ):
            raise ValueError("This income type requires general income details.")

        return value


# Represents one existing loan or financial obligation.
class ApplicationLiabilityItemSchema(BaseModel):
    liability_type: str = Field(..., min_length=2, max_length=100)
    monthly_repayment: float = Field(..., ge=0)
    outstanding_balance: float = Field(..., ge=0)

    @field_validator("liability_type")
    @classmethod
    def strip_liability_type(cls, value: str):
        return value.strip()


# Captures final liabilities for the submitted application.
class ApplicationLiabilityDetailsSchema(BaseModel):
    has_existing_loans: bool
    liabilities: List[ApplicationLiabilityItemSchema] = Field(default_factory=list)
    additional_financial_obligations: Optional[str] = Field(
        default=None,
        max_length=500,
    )

    @field_validator("additional_financial_obligations")
    @classmethod
    def strip_additional_obligations(cls, value: Optional[str]):
        if value is None:
            return value

        value = value.strip()

        if not value:
            return None

        return value


# Stores the full application data entered by the borrower.
class ApplicationDetailsSchema(BaseModel):
    project_details: ApplicationProjectDetailsSchema
    borrower_details: BorrowerDetailsSchema
    income_details: List[ApplicationIncomeItemSchema] = Field(..., min_length=1)
    liability_details: ApplicationLiabilityDetailsSchema
    description: str = Field(..., min_length=5, max_length=1000)

    @field_validator("description")
    @classmethod
    def strip_description(cls, value: str):
        return value.strip()


# Payload used to submit a draft mortgage application.
class SubmitMortgageApplicationSchema(BaseModel):
    application_details: ApplicationDetailsSchema


# Public response shape for mortgage applications.
class MortgageApplicationResponseSchema(BaseModel):
    id: str
    user_id: str
    simulation_id: str
    status: str

    simulation_snapshot: SimulationSnapshotSchema
    application_details: Optional[ApplicationDetailsSchema] = None

    created_at: datetime
    updated_at: datetime
    submitted_at: Optional[datetime] = None