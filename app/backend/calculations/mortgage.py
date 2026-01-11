"""
Mortgage calculation utilities.
Handles mortgage payment calculations, principal, and interest computations.
"""

from decimal import Decimal, getcontext

# Set precision to 28 total digits, 14 decimal places
getcontext().prec = 28
getcontext().Emin = -999999
getcontext().Emax = 999999


def calculate_monthly_payment(principal: float, annual_rate: float, years: int, payment_type: str = 'principal_and_interest') -> float:
    """
    Calculate monthly mortgage payment using standard amortization formula or interest-only.
    
    Args:
        principal: Loan principal amount
        annual_rate: Annual interest rate (as decimal, e.g., 0.05 for 5%)
        years: Loan term in years
        payment_type: 'principal_and_interest' or 'interest_only'
    
    Returns:
        Monthly payment amount
    """
    p = Decimal(str(principal))
    r = Decimal(str(annual_rate))
    y = Decimal(str(years))
    
    if p <= 0 or y <= 0:
        return 0.0
    
    # For interest-only payments, payment is just the monthly interest
    if payment_type == 'interest_only':
        if r == 0:
            return 0.0
        monthly_rate = r / Decimal('12')
        return float(p * monthly_rate)
    
    # Standard amortization formula for principal and interest
    if r == 0:
        return float(p / (y * Decimal('12')))
    
    monthly_rate = r / Decimal('12')
    num_payments = y * Decimal('12')
    
    one_plus_rate = Decimal('1') + monthly_rate
    numerator = p * monthly_rate * (one_plus_rate ** num_payments)
    denominator = (one_plus_rate ** num_payments) - Decimal('1')
    
    payment = numerator / denominator
    
    return float(payment)


def calculate_annual_payment(principal: float, annual_rate: float, years: int, payment_type: str = 'principal_and_interest') -> float:
    """Calculate annual mortgage payment."""
    monthly = Decimal(str(calculate_monthly_payment(principal, annual_rate, years, payment_type)))
    return float(monthly * Decimal('12'))


def calculate_year_breakdown(principal_remaining: float, annual_rate: float, 
                            years_remaining: int, monthly_payment: float, 
                            payment_type: str = 'principal_and_interest') -> dict:
    """
    Calculate principal and interest paid for a given year.
    
    Args:
        principal_remaining: Remaining principal at start of year
        annual_rate: Annual interest rate (as decimal)
        years_remaining: Years remaining on loan
        monthly_payment: Monthly payment amount
        payment_type: 'principal_and_interest' or 'interest_only'
    
    Returns:
        Dictionary with 'principal_paid', 'interest_paid', 'principal_remaining'
    """
    p = Decimal(str(principal_remaining))
    r = Decimal(str(annual_rate))
    mp = Decimal(str(monthly_payment))
    
    if p <= 0:
        return {
            'principal_paid': 0.0,
            'interest_paid': 0.0,
            'principal_remaining': 0.0
        }
    
    monthly_rate = r / Decimal('12')
    principal_paid = Decimal('0')
    interest_paid = Decimal('0')
    current_principal = p
    
    # Calculate for 12 months
    for month in range(12):
        if current_principal <= 0:
            break
        
        interest_for_month = current_principal * monthly_rate
        
        if payment_type == 'interest_only':
            # For interest-only, payment is only interest, no principal reduction
            principal_for_month = Decimal('0')
        else:
            # Standard amortization: principal = payment - interest
            principal_for_month = min(mp - interest_for_month, current_principal)
        
        principal_paid += principal_for_month
        interest_paid += interest_for_month
        current_principal -= principal_for_month
    
    return {
        'principal_paid': float(principal_paid),
        'interest_paid': float(interest_paid),
        'principal_remaining': float(max(Decimal('0'), current_principal))
    }


def calculate_month_breakdown(principal_remaining: float, annual_rate: float, 
                              monthly_payment: float, payment_type: str = 'principal_and_interest') -> dict:
    """
    Calculate principal and interest paid for a single month.
    
    Args:
        principal_remaining: Remaining principal at start of month
        annual_rate: Annual interest rate (as decimal)
        monthly_payment: Monthly payment amount
        payment_type: 'principal_and_interest' or 'interest_only'
    
    Returns:
        Dictionary with 'principal_paid', 'interest_paid', 'principal_remaining'
    """
    p = Decimal(str(principal_remaining))
    r = Decimal(str(annual_rate))
    mp = Decimal(str(monthly_payment))
    
    if p <= 0:
        return {
            'principal_paid': 0.0,
            'interest_paid': 0.0,
            'principal_remaining': 0.0
        }
    
    monthly_rate = r / Decimal('12')
    interest_for_month = p * monthly_rate
    
    if payment_type == 'interest_only':
        # For interest-only, payment is only interest, no principal reduction
        principal_for_month = Decimal('0')
    else:
        # Standard amortization: principal = payment - interest
        principal_for_month = min(mp - interest_for_month, p)
    
    new_principal = max(Decimal('0'), p - principal_for_month)
    
    return {
        'principal_paid': float(principal_for_month),
        'interest_paid': float(interest_for_month),
        'principal_remaining': float(new_principal)
    }
