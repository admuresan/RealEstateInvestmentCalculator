"""
Investment calculation utilities.
Handles net profit, cumulative investment, and expected return calculations.
"""

from decimal import Decimal, getcontext

# Set precision to 28 total digits, 14 decimal places
getcontext().prec = 28
getcontext().Emin = -999999
getcontext().Emax = 999999


def calculate_total_expenses(mortgage_payment: float, maintenance: float, 
                             property_tax: float, insurance: float, 
                             utilities: float, repairs: float) -> float:
    """
    Calculate total expenses for a year.
    
    Args:
        mortgage_payment: Annual mortgage payment
        maintenance: Annual maintenance fees
        property_tax: Annual property tax
        insurance: Annual insurance
        utilities: Annual utilities
        repairs: Annual repairs
    
    Returns:
        Total expenses
    """
    total = (Decimal(str(mortgage_payment)) + Decimal(str(maintenance)) + 
             Decimal(str(property_tax)) + Decimal(str(insurance)) + 
             Decimal(str(utilities)) + Decimal(str(repairs)))
    return float(total)


def calculate_deductible_expenses(interest_paid: float, maintenance: float,
                                  property_tax: float, insurance: float,
                                  utilities: float, repairs: float) -> float:
    """
    Calculate deductible expenses (using interest instead of full payment).
    
    Args:
        interest_paid: Annual interest paid
        maintenance: Annual maintenance fees
        property_tax: Annual property tax
        insurance: Annual insurance
        utilities: Annual utilities
        repairs: Annual repairs
    
    Returns:
        Total deductible expenses
    """
    total = (Decimal(str(interest_paid)) + Decimal(str(maintenance)) + 
             Decimal(str(property_tax)) + Decimal(str(insurance)) + 
             Decimal(str(utilities)) + Decimal(str(repairs)))
    return float(total)


def calculate_taxable_income(rental_income: float, deductible_expenses: float) -> float:
    """
    Calculate taxable income.
    
    Args:
        rental_income: Annual rental income
        deductible_expenses: Total deductible expenses
    
    Returns:
        Taxable income (can be negative)
    """
    return float(Decimal(str(rental_income)) - Decimal(str(deductible_expenses)))


def calculate_taxes_due(taxable_income: float, marginal_tax_rate: float) -> float:
    """
    Calculate taxes due on taxable income.
    
    Args:
        taxable_income: Taxable income amount
        marginal_tax_rate: Marginal tax rate (as decimal, e.g., 0.25 for 25%)
    
    Returns:
        Taxes due (0 if taxable income is negative)
    """
    ti = Decimal(str(taxable_income))
    if ti <= 0:
        return 0.0
    return float(ti * Decimal(str(marginal_tax_rate)))


def calculate_net_profit(rental_income: float, total_expenses: float, taxes_due: float) -> float:
    """
    Calculate net profit for a year.
    
    Args:
        rental_income: Annual rental income
        total_expenses: Total expenses
        taxes_due: Taxes due
    
    Returns:
        Net profit
    """
    return float(Decimal(str(rental_income)) - Decimal(str(total_expenses)) - Decimal(str(taxes_due)))


def calculate_expected_return(cumulative_investment: float, previous_cumulative_expected_return: float, 
                              expected_return_rate: float) -> float:
    """
    Calculate expected return based on cumulative investment and previous cumulative expected return.
    
    Args:
        cumulative_investment: Current cumulative investment amount
        previous_cumulative_expected_return: Previous month's cumulative expected return
        expected_return_rate: Expected return rate (as decimal, monthly)
    
    Returns:
        Expected return = (cumulative investment + previous cumulative expected return) × return rate
    """
    ci = Decimal(str(cumulative_investment))
    pcer = Decimal(str(previous_cumulative_expected_return))
    rate = Decimal(str(expected_return_rate))
    return float((ci + pcer) * rate)


def calculate_cumulative_investment(previous_cumulative: float, net_profit: float, 
                                   downpayment: float, is_first_year: bool) -> float:
    """
    Calculate cumulative investment.
    Adds the negative of net profit (subtracts profit, adds losses).
    When net_profit is positive (profit), cumulative investment decreases.
    When net_profit is negative (loss), cumulative investment increases.
    
    Args:
        previous_cumulative: Previous month's cumulative investment
        net_profit: Current month's net profit
        downpayment: Initial downpayment amount (unused, kept for compatibility)
        is_first_year: Whether this is the first month (unused, kept for compatibility)
    
    Returns:
        Cumulative investment
    """
    return float(Decimal(str(previous_cumulative)) - Decimal(str(net_profit)))


def calculate_cumulative_investment_new(downpayment: float, cumulative_net_profit: float) -> float:
    """
    Calculate cumulative investment using new approach.
    Investment = downpayment + any losses (if cumulative net profit is negative).
    This represents total cash invested.
    
    Args:
        downpayment: Initial downpayment amount
        cumulative_net_profit: Sum of all net profits up to this point
    
    Returns:
        Cumulative investment (downpayment + losses if any)
    """
    dp = Decimal(str(downpayment))
    cnp = Decimal(str(cumulative_net_profit))
    
    # If cumulative net profit is negative, add the absolute value to investment
    # If positive, investment stays at downpayment
    if cnp < 0:
        return float(dp - cnp)  # Subtracting negative = adding absolute value
    else:
        return float(dp)


def calculate_cumulative_expected_return(previous_cumulative: float, net_profit: float,
                                        expected_return_rate: float, downpayment: float,
                                        is_first_year: bool) -> float:
    """
    Calculate cumulative expected return (compounded annually).
    Shows what the investor would have made if they invested all their money
    (downpayment + cumulative net profits) at the expected return rate.
    
    Args:
        previous_cumulative: Previous year's cumulative expected return
        net_profit: Current year's net profit
        expected_return_rate: Expected return rate (as decimal)
        downpayment: Initial downpayment amount
        is_first_year: Whether this is the first year
    
    Returns:
        Cumulative expected return (compounded value)
    """
    dp = Decimal(str(downpayment))
    np = Decimal(str(net_profit))
    rate = Decimal(str(expected_return_rate))
    
    if is_first_year:
        # First year: start with downpayment - net profit, then compound
        initial_investment = dp - np
        return float(initial_investment * (Decimal('1') + rate))
    
    # For subsequent years:
    # Take previous year's compounded value, subtract this year's net profit, then compound
    pc = Decimal(str(previous_cumulative))
    total_before_compound = pc - np
    return float(total_before_compound * (Decimal('1') + rate))


def calculate_cumulative_expected_return_monthly(previous_cumulative: float, expected_return: float) -> float:
    """
    Calculate cumulative expected return as the sum of expected return values.
    Shows the cumulative sum of expected return up to and including the current row.
    
    Args:
        previous_cumulative: Previous month's cumulative expected return
        expected_return: Current month's expected return
    
    Returns:
        Cumulative expected return (sum of all expected return values up to this month)
    """
    pc = Decimal(str(previous_cumulative))
    er = Decimal(str(expected_return))
    return float(pc + er)

