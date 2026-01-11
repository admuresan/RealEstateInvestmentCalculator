"""
Expense calculation utilities.
Handles maintenance, property tax, insurance, utilities, and repairs.
"""

from decimal import Decimal, getcontext

# Set precision to 28 total digits, 14 decimal places
getcontext().prec = 28
getcontext().Emin = -999999
getcontext().Emax = 999999


def calculate_maintenance(year: int, base_maintenance: float, yearly_increase: float) -> float:
    """
    Calculate maintenance fees for a given year.
    
    Args:
        year: Year number (0-indexed, where 0 is first year)
        base_maintenance: Base annual maintenance amount
        yearly_increase: Yearly increase rate (as decimal, e.g., 0.03 for 3%)
    
    Returns:
        Maintenance amount for the year
    """
    base = Decimal(str(base_maintenance))
    increase = Decimal(str(yearly_increase))
    if year == 0:
        return float(base)
    factor = (Decimal('1') + increase) ** year
    return float(base * factor)


def calculate_property_tax(year: int, base_tax: float, yearly_increase: float) -> float:
    """
    Calculate property tax for a given year.
    
    Args:
        year: Year number (0-indexed)
        base_tax: Base annual property tax amount
        yearly_increase: Yearly increase rate (as decimal)
    
    Returns:
        Property tax amount for the year
    """
    base = Decimal(str(base_tax))
    increase = Decimal(str(yearly_increase))
    if year == 0:
        return float(base)
    factor = (Decimal('1') + increase) ** year
    return float(base * factor)


def calculate_rental_income(year: int, base_rental: float, yearly_increase: float) -> float:
    """
    Calculate rental income for a given year.
    
    Args:
        year: Year number (0-indexed)
        base_rental: Base monthly rental income
        yearly_increase: Yearly increase rate (as decimal)
    
    Returns:
        Annual rental income for the year
    """
    base = Decimal(str(base_rental))
    increase = Decimal(str(yearly_increase))
    if year == 0:
        monthly_rent = base
    else:
        factor = (Decimal('1') + increase) ** year
        monthly_rent = base * factor
    return float(monthly_rent * Decimal('12'))


def calculate_maintenance_monthly(month: int, base_maintenance: float, yearly_increase: float) -> float:
    """
    Calculate maintenance fees for a given month.
    Increases apply only at the start of each new year, starting from year 2.
    
    Args:
        month: Month number (0-indexed, where 0 is month 0)
        base_maintenance: Base monthly maintenance amount
        yearly_increase: Yearly increase rate (as decimal)
    
    Returns:
        Maintenance amount for the month
    """
    # Year 1 (months 0-11): no increase
    # Year 2 (months 12-23): first increase
    # Year 3 (months 24-35): second increase, etc.
    year = month // 12
    base = Decimal(str(base_maintenance))
    increase = Decimal(str(yearly_increase))
    # Apply increases only starting from year 2 (year index 1)
    # Year 0 = first year (no increase), Year 1+ = apply (year) increases
    if year == 0:
        return float(base)
    else:
        factor = (Decimal('1') + increase) ** year
        return float(base * factor)


def calculate_property_tax_monthly(month: int, base_tax: float, yearly_increase: float) -> float:
    """
    Calculate property tax for a given month.
    Increases apply only at the start of each new year, starting from year 2.
    
    Args:
        month: Month number (0-indexed, where 0 is month 0)
        base_tax: Base annual property tax amount
        yearly_increase: Yearly increase rate (as decimal)
    
    Returns:
        Property tax amount for the month (1/12 of annual)
    """
    # Year 1 (months 0-11): no increase
    # Year 2 (months 12-23): first increase
    # Year 3 (months 24-35): second increase, etc.
    year = month // 12
    base = Decimal(str(base_tax))
    increase = Decimal(str(yearly_increase))
    if year == 0:
        annual_tax = base
    else:
        factor = (Decimal('1') + increase) ** year
        annual_tax = base * factor
    return float(annual_tax / Decimal('12'))


def calculate_rental_income_monthly(month: int, base_rental: float, yearly_increase: float) -> float:
    """
    Calculate rental income for a given month.
    Increases apply only at the start of each new year, starting from year 2.
    
    Args:
        month: Month number (0-indexed, where 0 is month 0)
        base_rental: Base monthly rental income
        yearly_increase: Yearly increase rate (as decimal)
    
    Returns:
        Monthly rental income for the month
    """
    # Year 1 (months 0-11): no increase
    # Year 2 (months 12-23): first increase
    # Year 3 (months 24-35): second increase, etc.
    year = month // 12
    base = Decimal(str(base_rental))
    increase = Decimal(str(yearly_increase))
    if year == 0:
        return float(base)
    else:
        factor = (Decimal('1') + increase) ** year
        return float(base * factor)