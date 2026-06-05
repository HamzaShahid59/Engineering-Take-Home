from app.modules.mortgage_simulations.schemas import (
    MortgageSimulationCalculateSchema,
)


# Calculates monthly mortgage payment using a standard fixed-rate
# amortization formula. This is a simplified estimate, not a real
# Belgian bank underwriting model.
def calculate_monthly_payment(
    loan_amount: float,
    annual_interest_rate: float,
    duration_years: int,
) -> float:
    monthly_interest_rate = annual_interest_rate / 12 / 100
    total_months = duration_years * 12

    if loan_amount <= 0:
        return 0

    if monthly_interest_rate == 0:
        return round(loan_amount / total_months, 2)

    monthly_payment = loan_amount * (
        monthly_interest_rate
        * (1 + monthly_interest_rate) ** total_months
        / ((1 + monthly_interest_rate) ** total_months - 1)
    )

    return round(monthly_payment, 2)


# Calculates a simple interest rate based on the simulation details.
# These rules are intentionally simple for the take-home assignment
# and can later be replaced with a real pricing engine.
def estimate_interest_rate(payload: MortgageSimulationCalculateSchema) -> float:
    base_rate = 3.25

    own_funds = payload.contribution.own_funds
    property_price = payload.project_details.property_price

    loan_to_value = 1

    if property_price > 0:
        loan_to_value = (property_price - own_funds) / property_price

    if loan_to_value <= 0.8:
        base_rate -= 0.15

    if loan_to_value > 0.9:
        base_rate += 0.25

    if payload.project_details.property_usage.value in [
        "Investment property",
        "Private rent",
        "Professional rent",
        "Commercial",
    ]:
        base_rate += 0.20

    if payload.project_details.epc_score is not None:
        if payload.project_details.epc_score <= 100:
            base_rate -= 0.10

        if payload.project_details.epc_score >= 400:
            base_rate += 0.10

    return round(base_rate, 2)


# Runs the full mortgage simulation calculation.
# It returns the final calculator result without saving anything to MongoDB.
def calculate_mortgage_simulation(
    payload: MortgageSimulationCalculateSchema,
) -> dict:
    property_price = payload.project_details.property_price
    own_funds = payload.contribution.own_funds

    loan_amount = property_price - own_funds

    if loan_amount < 0:
        loan_amount = 0

    monthly_income = sum(
        income.monthly_amount
        for income in payload.financial_details.incomes
    )

    monthly_liabilities = sum(
        liability.monthly_amount
        for liability in payload.financial_details.liabilities or []
    )

    net_available_income = monthly_income - monthly_liabilities

    interest_rate = estimate_interest_rate(payload)

    monthly_payment = calculate_monthly_payment(
        loan_amount=loan_amount,
        annual_interest_rate=interest_rate,
        duration_years=payload.preferred_duration_years,
    )

    # Simple affordability rule:
    # monthly mortgage payment should not exceed 35% of net available income.
    max_affordable_payment = net_available_income * 0.35

    feasibility_status = (
        "Within reach"
        if monthly_payment <= max_affordable_payment
        else "Not within reach"
    )

    return {
        "property_price": round(property_price, 2),
        "own_funds": round(own_funds, 2),
        "loan_amount": round(loan_amount, 2),
        "monthly_income": round(monthly_income, 2),
        "monthly_liabilities": round(monthly_liabilities, 2),
        "net_available_income": round(net_available_income, 2),
        "monthly_payment": monthly_payment,
        "duration_years": payload.preferred_duration_years,
        "interest_rate": interest_rate,
        "feasibility_status": feasibility_status,
    }