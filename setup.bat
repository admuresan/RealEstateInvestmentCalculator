@echo off
echo Setting up Real Estate Investment Calculator...
echo.

REM Try to find Python - check multiple common commands
set PYTHON_CMD=
python --version >nul 2>&1
if not errorlevel 1 (
    set PYTHON_CMD=python
    goto :found_python
)

py --version >nul 2>&1
if not errorlevel 1 (
    set PYTHON_CMD=py
    goto :found_python
)

python3 --version >nul 2>&1
if not errorlevel 1 (
    set PYTHON_CMD=python3
    goto :found_python
)

echo Error: Python is not found!
echo.
echo Please ensure Python is installed and available in your PATH.
echo You can try:
echo   - Using the Python launcher: py setup_venv.py
echo   - Or run setup_venv.py directly if Python is installed
echo.
pause
exit /b 1

:found_python
echo Found Python: %PYTHON_CMD%
echo.

REM Run the setup script
REM Use -3 flag with py launcher to ensure Python 3
if "%PYTHON_CMD%"=="py" (
    %PYTHON_CMD% -3 setup_venv.py
) else (
    %PYTHON_CMD% setup_venv.py
)

if errorlevel 1 (
    echo Setup failed!
    pause
    exit /b 1
)

echo.
echo Setup complete! You can now run the app with: %PYTHON_CMD% app.py
pause

