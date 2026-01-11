# Real Estate Investment Calculator

A web application for analyzing real estate investment returns over time. Calculate mortgage payments, expenses, rental income, taxes, and expected returns with a comprehensive year-by-year breakdown.

## Features

- **Comprehensive Calculations**: Mortgage amortization, expenses, rental income, taxes, and investment returns
- **Interactive Table**: View calculations for up to 30 years with all metrics displayed
- **Input Controls**: Adjustable parameters for purchase price, interest rates, expenses, and more
- **Sidebar Information**: Hover over column headers to see explanations and formulas
- **Real-time Updates**: Calculations update automatically as you change inputs

## Setup

### Prerequisites

- Python 3.8 or higher
- Node.js and npm (for TypeScript compilation)

### Installation

Run the setup script to create a virtual environment and install all dependencies:

**Windows:**
```bash
setup.bat
```

If `setup.bat` doesn't find Python, try:
- `py setup_venv.py` (using Python launcher)
- `python3 setup_venv.py`
- Or run `find_python.bat` to see available Python commands

**Linux/Mac:**
```bash
chmod +x setup.sh
./setup.sh
```

**Or manually:**
```bash
python setup_venv.py
# or
python3 setup_venv.py
# or (Windows)
py setup_venv.py
```

This will:
1. Create a virtual environment in the `venv` directory
2. Install Python dependencies (Flask, flask-cors)
3. Install Node.js dependencies (TypeScript)
4. Compile TypeScript to JavaScript

### Running the Application

Simply run:
```bash
python app.py
```

The `app.py` script will automatically detect and use the virtual environment. The application will be available at `http://localhost:6006`

## Project Structure

```
app/
├── backend/
│   ├── calculations/     # Calculation utilities
│   │   ├── mortgage.py   # Mortgage payment calculations
│   │   ├── expenses.py   # Expense calculations
│   │   └── investment.py # Investment metrics
│   ├── api/
│   │   └── routes.py     # Flask API endpoints
│   └── app.py            # Flask application setup
├── frontend/
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── utils/        # Utility functions
│   │   └── main.ts       # Application entry point
│   ├── styles/
│   │   └── main.css      # Stylesheet
│   └── index.html        # HTML template
└── app.py                # Main entry point
```

## Usage

1. Enter property details (purchase price, downpayment)
2. Set loan parameters (interest rate, loan term)
3. Configure expenses (maintenance, property tax, insurance, utilities, repairs)
4. Set rental income and expected increases
5. Configure tax rate and expected return rate
6. View the calculated results in the table

Hover over column headers in the table to see detailed explanations and formulas for each metric.

