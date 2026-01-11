"""
Sale-related calculation utilities.
Handles home value, capital gains tax, sales fees, and sale metrics.
"""

from decimal import Decimal, getcontext

# Set precision to 28 total digits, 14 decimal places
getcontext().prec = 28
getcontext().Emin = -999999
getcontext().Emax = 999999


def calculate_home_value(purchase_price: float, real_estate_market_increase: float, months: int) -> float:
    """
    Calculate current home value based on market appreciation.
    
    Args:
        purchase_price: Original purchase price
        real_estate_market_increase: Annual market increase rate (as decimal, e.g., 0.03 for 3%)
        months: Number of months since purchase
    
    Returns:
        Current home value
    """
    if months <= 0:
        return purchase_price
    
    price = Decimal(str(purchase_price))
    rate = Decimal(str(real_estate_market_increase))
    m = Decimal(str(months))
    
    # Convert annual rate to monthly rate
    monthly_rate = rate / Decimal('12')
    
    # Compound monthly
    factor = (Decimal('1') + monthly_rate) ** m
    return float(price * factor)


def calculate_sales_fees(home_value: float, commission_percentage: float) -> float:
    """
    Calculate sales fees (commission) based on home value.
    
    Args:
        home_value: Current home value
        commission_percentage: Commission percentage (as decimal, e.g., 0.05 for 5%)
    
    Returns:
        Sales fees (commission amount)
    """
    return float(Decimal(str(home_value)) * Decimal(str(commission_percentage)))


def calculate_capital_gains_tax_ontario(
    sale_price: float,
    purchase_price: float,
    selling_costs: float,
    marginal_tax_rate: float
) -> float:
    """
    Calculate capital gains tax in Ontario, Canada.
    
    Capital gain = Sale Price - Purchase Price - Selling Costs (commissions)
    
    As of June 2024, for individuals:
    - First $250,000 of capital gains: 50% inclusion rate (half is taxable)
    - Capital gains over $250,000: 66.67% inclusion rate (two-thirds is taxable)
    
    For corporations/trusts: 66.67% inclusion rate applies to all gains.
    
    This function uses a simplified 50% inclusion rate for all gains.
    For more accurate calculations with the new rules, consider tracking annual gains.
    
    Args:
        sale_price: Sale price of the property
        purchase_price: Original purchase price
        selling_costs: Total selling costs (fees)
        marginal_tax_rate: Marginal tax rate (as decimal, e.g., 0.30 for 30%)
    
    Returns:
        Capital gains tax amount
    """
    # Calculate capital gain
    sp = Decimal(str(sale_price))
    pp = Decimal(str(purchase_price))
    sc = Decimal(str(selling_costs))
    capital_gain = sp - pp - sc
    
    if capital_gain <= 0:
        return 0.0
    
    # Simplified: 50% of capital gain is taxable (applies to first $250k for individuals)
    # Note: For gains over $250k, the inclusion rate is 66.67%, but this calculator
    # uses 50% for simplicity. For accurate calculations, track annual gains separately.
    taxable_capital_gain = capital_gain * Decimal('0.5')
    
    # Apply marginal tax rate
    tax_owed = taxable_capital_gain * Decimal(str(marginal_tax_rate))
    
    return float(tax_owed)


def calculate_sale_income(home_value: float, sales_fees: float, capital_gains_tax: float) -> float:
    """
    Calculate sale income (amount gained if property sold immediately).
    Sale income is the net proceeds after deducting direct selling costs (fees and capital gains tax).
    
    Args:
        home_value: Current home value
        sales_fees: Sales fees (commission)
        capital_gains_tax: Capital gains tax
    
    Returns:
        Sale income
    """
    return float(Decimal(str(home_value)) - Decimal(str(sales_fees)) - Decimal(str(capital_gains_tax)))


def calculate_sale_net(sale_income: float, principal_owing: float) -> float:
    """
    Calculate sale net (sale income minus principal owing).
    
    Args:
        sale_income: Sale income amount
        principal_owing: Principal remaining on mortgage
    
    Returns:
        Sale net
    """
    return float(Decimal(str(sale_income)) - Decimal(str(principal_owing)))


def calculate_net_return(sale_net: float, cumulative_investment: float) -> float:
    """
    Calculate net return (sale net minus cumulative investment).
    
    Args:
        sale_net: Sale net amount
        cumulative_investment: Cumulative investment made
    
    Returns:
        Net return
    """
    return float(Decimal(str(sale_net)) - Decimal(str(cumulative_investment)))


def calculate_net_return_new(sale_net: float, downpayment: float, cumulative_net_profit: float) -> float:
    """
    Calculate net return using new approach.
    Return = (sale net - downpayment) + any profits already received.
    This represents total profit from the investment.
    
    Args:
        sale_net: Sale net amount (after paying off mortgage)
        downpayment: Initial downpayment amount
        cumulative_net_profit: Sum of all net profits up to this point
    
    Returns:
        Net return (profit from sale + profits already received)
    """
    sn = Decimal(str(sale_net))
    dp = Decimal(str(downpayment))
    cnp = Decimal(str(cumulative_net_profit))
    
    # Profit from sale = sale_net - downpayment
    # Add any profits already received (if cumulative net profit is positive)
    profit_from_sale = sn - dp
    profits_received = max(Decimal('0'), cnp)
    
    return float(profit_from_sale + profits_received)


def calculate_return_percent(net_return: float, cumulative_investment: float) -> float:
    """
    Calculate return percentage based on cumulative investment.
    
    Args:
        net_return: Net return amount
        cumulative_investment: Cumulative investment made
    
    Returns:
        Return percentage (as decimal, multiply by 100 for percentage)
    """
    ci = Decimal(str(cumulative_investment))
    if ci <= 0:
        return 0.0
    
    return float(Decimal(str(net_return)) / ci)


def calculate_return_comparison(cumulative_expected_return: float, net_return: float) -> float:
    """
    Calculate return comparison ratio.
    Ratio of net return to cumulative expected return.
    
    Args:
        cumulative_expected_return: Cumulative expected return amount
        net_return: Net return amount
    
    Returns:
        Return comparison ratio (net_return / cumulative_expected_return)
    """
    cer = Decimal(str(cumulative_expected_return))
    if cer == 0:
        return 0.0
    
    return float(Decimal(str(net_return)) / cer)

