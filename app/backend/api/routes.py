"""
Flask API routes for real estate investment calculator.
"""

from flask import Blueprint, request, jsonify
from decimal import Decimal, getcontext

# Set precision to 28 total digits, 14 decimal places
getcontext().prec = 28
getcontext().Emin = -999999
getcontext().Emax = 999999
from app.backend.calculations.mortgage import (
    calculate_monthly_payment,
    calculate_year_breakdown,
    calculate_month_breakdown
)
from app.backend.calculations.expenses import (
    calculate_maintenance,
    calculate_property_tax,
    calculate_rental_income,
    calculate_maintenance_monthly,
    calculate_property_tax_monthly,
    calculate_rental_income_monthly
)
from app.backend.calculations.investment import (
    calculate_total_expenses,
    calculate_deductible_expenses,
    calculate_taxable_income,
    calculate_taxes_due,
    calculate_net_profit,
    calculate_expected_return,
    calculate_cumulative_investment,
    calculate_cumulative_investment_new,
    calculate_cumulative_expected_return,
    calculate_cumulative_expected_return_monthly
)
from app.backend.calculations.sale import (
    calculate_home_value,
    calculate_sales_fees,
    calculate_capital_gains_tax_ontario,
    calculate_sale_income,
    calculate_sale_net,
    calculate_net_return,
    calculate_net_return_new,
    calculate_return_percent,
    calculate_return_comparison
)

api_bp = Blueprint('api', __name__)


@api_bp.route('/calculate', methods=['POST'])
def calculate_investment():
    """
    Calculate investment metrics for all months.
    
    Expected request body:
    {
        "purchase_price": float,
        "downpayment_percentage": float (as percentage, e.g., 20 for 20%),
        "closing_costs": float,
        "land_transfer_tax": float,
        "interest_rate": float (as percentage),
        "loan_years": int,
        "payment_type": str ("Principal and Interest" or "Interest Only"),
        "maintenance_base": float (monthly),
        "maintenance_increase": float (as percentage),
        "property_tax_base": float,
        "property_tax_increase": float (as percentage),
        "insurance": float,
        "utilities": float (monthly),
        "repairs": float,
        "rental_income_base": float (monthly),
        "rental_increase": float (as percentage),
        "marginal_tax_rate": float (as percentage),
        "expected_return_rate": float (as percentage),
        "real_estate_market_increase": float (as percentage),
        "commission_percentage": float (as percentage),
        "num_years": int
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided. Please fill in all required fields.'}), 400
        
        # Extract parameters with error handling
        errors = []
        
        try:
            purchase_price = float(data.get('purchase_price', 0))
            if purchase_price <= 0:
                errors.append('Purchase Price must be greater than 0')
        except (ValueError, TypeError):
            errors.append('Purchase Price must be a valid number')
        
        try:
            downpayment_percentage = float(data.get('downpayment_percentage', 20)) / 100
            if downpayment_percentage < 0 or downpayment_percentage > 1:
                errors.append('Downpayment Percentage must be between 0 and 100')
        except (ValueError, TypeError):
            errors.append('Downpayment Percentage must be a valid number')
        
        try:
            interest_rate = float(data.get('interest_rate', 0)) / 100
            if interest_rate < 0:
                errors.append('Interest Rate cannot be negative')
        except (ValueError, TypeError):
            errors.append('Interest Rate must be a valid number')
        
        try:
            loan_years = int(data.get('loan_years', 30))
            if loan_years <= 0:
                errors.append('Loan Years must be greater than 0')
        except (ValueError, TypeError):
            errors.append('Loan Years must be a valid integer')
        
        # Check other numeric fields
        numeric_fields = {
            'maintenance_base': 'Maintenance - Monthly Base',
            'maintenance_increase': 'Maintenance - Yearly Increase',
            'property_tax_base': 'Property Tax - Annual Base',
            'property_tax_increase': 'Property Tax - Yearly Increase',
            'insurance': 'Annual Insurance',
            'utilities': 'Monthly Utilities',
            'repairs': 'Annual Repairs',
            'rental_income_base': 'Monthly Rental',
            'rental_increase': 'Rental - Yearly Increase',
            'marginal_tax_rate': 'Marginal Tax Rate',
            'expected_return_rate': 'Expected Return Rate',
            'real_estate_market_increase': 'Real Estate Market Increase',
            'commission_percentage': 'Commission Percentage',
            'closing_costs': 'Closing Costs',
            'land_transfer_tax': 'Land Transfer Tax'
        }
        
        for field, label in numeric_fields.items():
            try:
                value = float(data.get(field, 0))
                if value < 0 and field not in ['maintenance_increase', 'property_tax_increase', 'rental_increase', 'real_estate_market_increase']:
                    errors.append(f'{label} cannot be negative')
            except (ValueError, TypeError):
                errors.append(f'{label} must be a valid number')
        
        if errors:
            return jsonify({'error': 'Validation errors', 'errors': errors}), 400
        
        # Extract parameters (now safe to do) - convert to Decimal for precision
        purchase_price = float(Decimal(str(data.get('purchase_price', 0))))
        downpayment_percentage = float(Decimal(str(data.get('downpayment_percentage', 20))) / Decimal('100'))
        downpayment = float(Decimal(str(purchase_price)) * Decimal(str(downpayment_percentage)))
        closing_costs = float(Decimal(str(data.get('closing_costs', 0))))
        land_transfer_tax = float(Decimal(str(data.get('land_transfer_tax', 0))))
        # Total initial investment = downpayment + closing costs + land transfer tax
        total_initial_investment = float(Decimal(str(downpayment)) + Decimal(str(closing_costs)) + Decimal(str(land_transfer_tax)))
        interest_rate = float(Decimal(str(data.get('interest_rate', 0))) / Decimal('100'))
        loan_years = int(data.get('loan_years', 30))
        maintenance_base = float(Decimal(str(data.get('maintenance_base', 0))))
        maintenance_increase = float(Decimal(str(data.get('maintenance_increase', 0))) / Decimal('100'))
        property_tax_base = float(Decimal(str(data.get('property_tax_base', 0))))
        property_tax_increase = float(Decimal(str(data.get('property_tax_increase', 0))) / Decimal('100'))
        insurance = float(Decimal(str(data.get('insurance', 0))))
        utilities = float(Decimal(str(data.get('utilities', 0))))
        repairs = float(Decimal(str(data.get('repairs', 0))))
        rental_income_base = float(Decimal(str(data.get('rental_income_base', 0))))
        rental_increase = float(Decimal(str(data.get('rental_increase', 0))) / Decimal('100'))
        marginal_tax_rate = float(Decimal(str(data.get('marginal_tax_rate', 0))) / Decimal('100'))
        expected_return_rate = float(Decimal(str(data.get('expected_return_rate', 0))) / Decimal('100'))
        real_estate_market_increase = float(Decimal(str(data.get('real_estate_market_increase', 0))) / Decimal('100'))
        commission_percentage = float(Decimal(str(data.get('commission_percentage', 5))) / Decimal('100'))
        num_years = int(data.get('num_years', 30))
        
        # Extract payment type and normalize it
        payment_type_raw = data.get('payment_type', 'Principal and Interest')
        if payment_type_raw == 'Interest Only':
            payment_type = 'interest_only'
        else:
            payment_type = 'principal_and_interest'  # Default
        
        # Calculate loan principal using Decimal
        loan_principal = float(Decimal(str(purchase_price)) - Decimal(str(downpayment)))
        
        # Calculate monthly payment
        monthly_payment = calculate_monthly_payment(loan_principal, interest_rate, loan_years, payment_type)
        
        # Monthly amounts (divide annual by 12 for insurance and repairs) using Decimal
        insurance_monthly = float(Decimal(str(insurance)) / Decimal('12'))
        utilities_monthly = utilities  # Already monthly
        repairs_monthly = float(Decimal(str(repairs)) / Decimal('12'))
        
        # Initialize results
        results = []
        principal_remaining = loan_principal
        cumulative_investment_old = total_initial_investment  # Keep old calculation for expected return
        cumulative_net_profit = 0.0  # Track cumulative net profit for new calculation
        cumulative_expected_return = 0.0  # Start at 0, will be sum of expected return values
        
        num_months = num_years * 12
        
        # Month 0 - initial state
        home_value_0 = calculate_home_value(purchase_price, real_estate_market_increase, 0)
        sales_fees_0 = calculate_sales_fees(home_value_0, commission_percentage)
        capital_gains_tax_0 = calculate_capital_gains_tax_ontario(
            home_value_0, purchase_price, sales_fees_0, marginal_tax_rate
        )
        sale_income_0 = calculate_sale_income(home_value_0, sales_fees_0, capital_gains_tax_0)
        sale_net_0 = calculate_sale_net(sale_income_0, loan_principal)
        # Use new calculation methods for month 0 (cumulative_net_profit is 0)
        cumulative_investment_0 = calculate_cumulative_investment_new(total_initial_investment, 0.0)
        net_return_0 = calculate_net_return_new(sale_net_0, total_initial_investment, 0.0)
        return_percent_0 = calculate_return_percent(net_return_0, cumulative_investment_0)
        return_comparison_0 = calculate_return_comparison(0.0, net_return_0)  # cumulative_expected_return is 0.0 for month 0
        
        result_row = {
            'month': 0,
            'year': 0,
            'principal_remaining': loan_principal,
            'mortgage_payments': 0.0,
            'principal_paid': 0.0,
            'interest_paid': 0.0,
            'maintenance_fees': 0.0,
            'property_tax': 0.0,
            'insurance_paid': 0.0,
            'utilities': 0.0,
            'repairs': 0.0,
            'total_expenses': 0.0,
            'deductible_expenses': 0.0,
            'rental_income': 0.0,
            'taxable_income': 0.0,
            'taxes_due': 0.0,
            'rental_gains': 0.0,
            'cumulative_rental_gains': 0.0,
            'cumulative_investment': cumulative_investment_0,
            'expected_return': 0.0,
            'cumulative_expected_return': 0.0,
            'home_value': home_value_0,
            'capital_gains_tax': capital_gains_tax_0,
            'sales_fees': sales_fees_0,
            'sale_income': sale_income_0,
            'sale_net': sale_net_0,
            'net_return': net_return_0,
            'return_percent': return_percent_0 * 100,  # Convert to percentage
            'return_comparison': return_comparison_0
        }
        results.append(result_row)
        
        for month in range(1, num_months + 1):
            year = (month - 1) // 12
            
            # Calculate mortgage breakdown for this month
            mortgage_breakdown = calculate_month_breakdown(
                principal_remaining, interest_rate, monthly_payment, payment_type
            )
            
            principal_paid = mortgage_breakdown['principal_paid']
            interest_paid = mortgage_breakdown['interest_paid']
            principal_remaining = mortgage_breakdown['principal_remaining']
            
            # Calculate monthly expenses
            maintenance = calculate_maintenance_monthly(month - 1, maintenance_base, maintenance_increase)
            property_tax = calculate_property_tax_monthly(month - 1, property_tax_base, property_tax_increase)
            
            # Calculate rental income
            rental_income = calculate_rental_income_monthly(month - 1, rental_income_base, rental_increase)
            
            # Calculate totals (all monthly amounts)
            total_expenses = calculate_total_expenses(
                monthly_payment, maintenance, property_tax, insurance_monthly, utilities_monthly, repairs_monthly
            )
            
            deductible_expenses = calculate_deductible_expenses(
                interest_paid, maintenance, property_tax, insurance_monthly, utilities_monthly, repairs_monthly
            )
            
            taxable_income = calculate_taxable_income(rental_income, deductible_expenses)
            taxes_due = calculate_taxes_due(taxable_income, marginal_tax_rate)
            net_profit = calculate_net_profit(rental_income, total_expenses, taxes_due)
            
            # Track cumulative net profit for new calculation
            cumulative_net_profit += net_profit
            
            # Calculate cumulative values for expected return (using old method)
            is_first_month = (month == 1)
            cumulative_investment_old = calculate_cumulative_investment(
                cumulative_investment_old, net_profit, total_initial_investment, is_first_month
            )
            
            # Expected return is calculated monthly based on (cumulative investment + previous cumulative expected return) × return rate
            monthly_return_rate = expected_return_rate / 12
            expected_return = calculate_expected_return(
                cumulative_investment_old, cumulative_expected_return, monthly_return_rate
            )
            
            # Cumulative expected return is the sum of expected return values up to and including this month
            cumulative_expected_return = calculate_cumulative_expected_return_monthly(
                cumulative_expected_return, expected_return
            )
            
            # Calculate sale-related metrics
            home_value = calculate_home_value(purchase_price, real_estate_market_increase, month)
            sales_fees = calculate_sales_fees(home_value, commission_percentage)
            capital_gains_tax = calculate_capital_gains_tax_ontario(
                home_value, purchase_price, sales_fees, marginal_tax_rate
            )
            sale_income = calculate_sale_income(home_value, sales_fees, capital_gains_tax)
            sale_net = calculate_sale_net(sale_income, principal_remaining)
            
            # Use new calculation methods
            cumulative_investment = calculate_cumulative_investment_new(total_initial_investment, cumulative_net_profit)
            net_return = calculate_net_return_new(sale_net, total_initial_investment, cumulative_net_profit)
            return_percent = calculate_return_percent(net_return, cumulative_investment)
            return_comparison = calculate_return_comparison(cumulative_expected_return, net_return)
            
            # Build result row
            # Note: Values are kept at full Decimal precision (converted to float)
            # Frontend will format to 2 decimal places for display
            result_row = {
                'month': month,
                'year': year + 1,
                'principal_remaining': principal_remaining,
                'mortgage_payments': monthly_payment,
                'principal_paid': principal_paid,
                'interest_paid': interest_paid,
                'maintenance_fees': maintenance,
                'property_tax': property_tax,
                'insurance_paid': insurance_monthly,
                'utilities': utilities_monthly,
                'repairs': repairs_monthly,
                'total_expenses': total_expenses,
                'deductible_expenses': deductible_expenses,
                'rental_income': rental_income,
                'taxable_income': taxable_income,
            'taxes_due': taxes_due,
            'rental_gains': net_profit,
            'cumulative_rental_gains': cumulative_net_profit,
            'cumulative_investment': cumulative_investment,
                'expected_return': expected_return,
                'cumulative_expected_return': cumulative_expected_return,
                'home_value': home_value,
                'capital_gains_tax': capital_gains_tax,
                'sales_fees': sales_fees,
                'sale_income': sale_income,
                'sale_net': sale_net,
                'net_return': net_return,
                'return_percent': return_percent * 100,  # Convert to percentage
                'return_comparison': return_comparison
            }
            
            results.append(result_row)
        
        return jsonify({'results': results})
    
    except ValueError as e:
        error_msg = str(e)
        if 'could not convert' in error_msg.lower() or 'invalid literal' in error_msg.lower():
            return jsonify({'error': 'Invalid input values. Please ensure all fields contain valid numbers only (no letters or special characters).', 'details': error_msg}), 400
        return jsonify({'error': f'Invalid value: {error_msg}'}), 400
    except ZeroDivisionError:
        return jsonify({'error': 'Cannot divide by zero. Please check that loan years and other rate fields are not zero.'}), 400
    except Exception as e:
        error_msg = str(e)
        return jsonify({'error': f'Calculation error: {error_msg}'}), 500

