from datetime import date
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class ProjectPurpose(str, Enum):
    buy_property = "Buy property"
    build_property = "Build a property"
    buy_out = "Buy out"
    renovate_property = "Renovate property"
    refinance_mortgage = "Refinance my mortgage"


class BorrowerType(str, Enum):
    alone = "Only for myself"
    # with_somebody_else = "With somebody else"

class PropertyType(str, Enum):
    home = "Home"
    apartment = "Apartment"
    studio = "Studio"
    construction_land = "Construction land"
    investment_property = "Investment property"
    villa = "Villa"


class PropertyLocation(str, Enum):
    brussels = "Brussels"
    flanders = "Flanders"
    wallonia = "Wallonia"
    not_sure = "Not sure"


class PropertyUsage(str, Enum):
    living = "Living"
    second_stay = "Second stay"
    commercial = "Commercial"
    investment_property = "Investment property"
    private_rent = "Private rent"
    professional_rent = "Professional rent"


class SaleType(str, Enum):
    private_sale = "Private sale"
    vat_regime = "VAT regime"


class IncomeType(str, Enum):
    salary = "Salary"
    business_owner = "Business owner"
    rent = "Rent"
    variable_income = "Variable income"
    future_rent = "Future rent"
    child_benefit = "Child benefit"
    unemployment_benefit = "Unemployment benefit"
    household_income = "Household income"
    retirement = "Retirement"
    other = "Other"


class LiabilityType(str, Enum):
    credit_card = "Credit card"
    consumer_loan = "Consumer loan"
    movable_loan = "Movable loan"
    immovable_loan = "Immovable loan"
    mortgage_loan = "Mortgage loan"
    alimony = "Alimony"
    rent = "Rent"
    other = "Other"


# Basic project information collected during the simulation flow.
# These fields are embedded inside a mortgage simulation document.
class ProjectDetailsSchema(BaseModel):
    project_purpose: ProjectPurpose
    borrower_type: BorrowerType = BorrowerType.alone
    property_type: PropertyType
    property_location: PropertyLocation
    property_price: float = Field(..., gt=0)
    property_usage: PropertyUsage
    sale_type: SaleType

    # Optional because users may not know the EPC score during simulation.
    epc_score: Optional[int] = Field(default=None, ge=0, le=2000)


# User contribution toward the mortgage project.
class ContributionSchema(BaseModel):
    own_funds: float = Field(..., ge=0)


# Income entered by the borrower for affordability calculation.
class IncomeItemSchema(BaseModel):
    income_type: IncomeType
    monthly_amount: float = Field(..., gt=0)


# Optional liability/expense item.
class LiabilityItemSchema(BaseModel):
    liability_type: LiabilityType
    monthly_amount: float = Field(..., gt=0)


# Financial information used for the simulation calculation.
class FinancialDetailsSchema(BaseModel):
    incomes: List[IncomeItemSchema] = Field(..., min_length=1)
    liabilities: Optional[List[LiabilityItemSchema]] = Field(default_factory=list)


# Personal details collected before showing the simulation result.
class PersonalDetailsSchema(BaseModel):
    date_of_birth: date
    number_of_dependents: int = Field(..., ge=0, le=10)

    @field_validator("date_of_birth")
    @classmethod
    def validate_date_of_birth(cls, value: date) -> date:
        today = date.today()
        age = today.year - value.year - (
            (today.month, today.day) < (value.month, value.day)
        )

        if age < 18:
            raise ValueError("Borrower must be at least 18 years old")

        if age > 65:
            raise ValueError("Borrower age must not exceed 65 years")

        return value


# Main request schema for mortgage simulation calculation.
class MortgageSimulationCalculateSchema(BaseModel):
    project_details: ProjectDetailsSchema
    contribution: ContributionSchema
    financial_details: FinancialDetailsSchema
    personal_details: PersonalDetailsSchema
    preferred_duration_years: int = Field(default=25, ge=5, le=30)

    @field_validator("preferred_duration_years")
    @classmethod
    def validate_duration(cls, value: int) -> int:
        if value % 5 != 0:
            raise ValueError("Duration must be in 5-year steps")

        return value


# Result returned by the calculator.
class MortgageSimulationResultSchema(BaseModel):
    property_price: float
    own_funds: float
    loan_amount: float
    monthly_income: float
    monthly_liabilities: float
    net_available_income: float
    monthly_payment: float
    duration_years: int
    interest_rate: float
    feasibility_status: str

class SelectedOfficeSchema(BaseModel):
    office_id: str
    name: str
    city: str



class SaveAndLockSimulationSchema(MortgageSimulationCalculateSchema):
    selected_office: Optional[SelectedOfficeSchema] = None


class UpdateMortgageSimulationSchema(MortgageSimulationCalculateSchema):
    selected_office: Optional[SelectedOfficeSchema] = None


class MortgageSimulationResponseSchema(BaseModel):
    id: str
    user_id: str
    project_details: dict
    contribution: dict
    financial_details: dict
    personal_details: dict
    calculation_result: dict
    status: str
    rate_locked_until: str
    selected_office: Optional[dict] = None


class SelectOfficeSchema(BaseModel):
    office_id: str