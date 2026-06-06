import type {
  Contribution,
  FinancialDetails,
  Office,
  PersonalDetails,
  ProjectDetails,
  SimulationResult,
} from './simulation.models';

export type MaritalStatus = 'Single' | 'Married' | 'Legally cohabiting' | 'Divorced' | 'Widowed';

export type ContractType = 'Indefinite' | 'Fixed-term' | 'Temporary' | 'Freelance' | 'Not applicable';

export interface ApplicationProjectDetails {
  property_address: string;
  house_number: string;
  box_number?: string | null;
  postal_code: string;
  city: string;
  country: string;
  estimated_purchase_date: string; // ISO date YYYY-MM-DD
  notary_name?: string | null;
  real_estate_agency?: string | null;
}

export interface BorrowerDetails {
  nationality: string;
  marital_status: MaritalStatus;
  current_residential_address: string;
  current_postal_code: string;
  current_city: string;
  current_country: string;
}

export interface SalaryIncomeDetails {
  employer_name: string;
  profession: string;
  contract_type: ContractType;
  employment_start_date: string; // ISO date YYYY-MM-DD
  additional_income_information?: string | null;
  income_stability_notes?: string | null;
}

export interface BusinessOwnerIncomeDetails {
  business_name: string;
  business_start_date: string; // ISO date YYYY-MM-DD
  additional_income_information?: string | null;
  income_stability_notes?: string | null;
}

export interface RentalIncomeDetails {
  rental_property_address: string;
  rental_contract_start_date: string; // ISO date YYYY-MM-DD
  additional_income_information?: string | null;
  income_stability_notes?: string | null;
}

export interface OtherIncomeDetails {
  additional_income_information: string;
  income_stability_notes?: string | null;
}

export type IncomeDetails =
  | SalaryIncomeDetails
  | BusinessOwnerIncomeDetails
  | RentalIncomeDetails
  | OtherIncomeDetails;

export interface ApplicationIncomeItem {
  income_type: string;
  monthly_amount: number;
  details: IncomeDetails;
}

export interface ApplicationLiabilityItem {
  liability_type: string;
  monthly_repayment: number;
  outstanding_balance: number;
}

export interface ApplicationLiabilityDetails {
  has_existing_loans: boolean;
  liabilities: ApplicationLiabilityItem[];
  additional_financial_obligations?: string | null;
}

export interface ApplicationDetails {
  project_details: ApplicationProjectDetails;
  borrower_details: BorrowerDetails;
  income_details: ApplicationIncomeItem[];
  liability_details: ApplicationLiabilityDetails;
  description: string;
}

export interface SubmitMortgageApplicationRequest {
  application_details: ApplicationDetails;
}

export interface SimulationSnapshot {
  project_details: ProjectDetails;
  contribution: Contribution;
  financial_details: FinancialDetails;
  personal_details: PersonalDetails;
  calculation_result: SimulationResult;
  selected_office?: Office | null;
}

export interface MortgageApplicationResponse {
  id: string;
  user_id: string;
  simulation_id: string;
  status: string;
  simulation_snapshot: SimulationSnapshot;
  application_details?: ApplicationDetails | null;
  created_at: string;
  updated_at: string;
  submitted_at?: string | null;
}

export interface ApplicationFormField {
  name: string;
  label: string;
  type: 'text' | 'date' | 'number' | 'select' | 'textarea' | 'boolean' | 'array';
  required: boolean;
  options?: string[];
}

export interface ApplicationFieldSchema {
  project_details: ApplicationFormField[];
  borrower_details: ApplicationFormField[];
  income_details: {
    base_fields: ApplicationFormField[];
    details_by_income_type: Record<string, ApplicationFormField[]>;
  };
  liability_details: ApplicationFormField[];
  application_details: ApplicationFormField[];
}

export interface PrefilledIncome {
  income_type: string;
  monthly_amount: number;
}

export interface ApplicationFormResponse extends MortgageApplicationResponse {
  field_schema: ApplicationFieldSchema;
  prefilled_data?: {
    financial_details?: {
      incomes?: PrefilledIncome[];
    };
  } | null;
}