export type ProjectPurpose = string;
export type BorrowerType = string;
export type PropertyType = string;
export type PropertyLocation = string;
export type PropertyUsage = string;
export type SaleType = string;
export type IncomeType = string;
export type LiabilityType = string;

export interface ProjectDetails {
  project_purpose: ProjectPurpose;
  borrower_type: BorrowerType;
  property_type: PropertyType;
  property_location: PropertyLocation;
  property_price: number;
  property_usage: PropertyUsage;
  sale_type: SaleType;
  epc_score?: number | null;
}

export interface Contribution {
  own_funds: number;
}

export interface IncomeItem {
  income_type: IncomeType;
  monthly_amount: number;
}

export interface LiabilityItem {
  liability_type: LiabilityType;
  monthly_amount: number;
}

export interface FinancialDetails {
  incomes: IncomeItem[];
  liabilities?: LiabilityItem[];
}

export interface PersonalDetails {
  date_of_birth: string; // ISO date YYYY-MM-DD
  number_of_dependents: number;
}

export interface SimulationCalculateRequest {
  project_details: ProjectDetails;
  contribution: Contribution;
  financial_details: FinancialDetails;
  personal_details: PersonalDetails;
  preferred_duration_years: number; // 5–30, multiples of 5
}

export interface SimulationResult {
  property_price: number;
  own_funds: number;
  loan_amount: number;
  monthly_income: number;
  monthly_liabilities: number;
  net_available_income: number;
  monthly_payment: number;
  duration_years: number;
  interest_rate: number;
  feasibility_status: string;
}

export interface DropdownOption {
  label: string;
  value: string;
}

export interface Office {
  office_id: string;
  name: string;
  city: string;
}

export interface SimulationOptions {
  project_purposes: DropdownOption[];
  borrower_types: DropdownOption[];
  property_types: DropdownOption[];
  property_locations: DropdownOption[];
  property_usages: DropdownOption[];
  sale_types: DropdownOption[];
  income_types: DropdownOption[];
  liability_types: DropdownOption[];
  offices: Office[];
}
