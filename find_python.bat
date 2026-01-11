@echo off
REM Helper script to find and display available Python commands

echo Searching for Python installations...
echo.

python --version >nul 2>&1
if not errorlevel 1 (
    echo [FOUND] python
    python --version
    echo.
)

py --version >nul 2>&1
if not errorlevel 1 (
    echo [FOUND] py
    py --version
    echo.
)

python3 --version >nul 2>&1
if not errorlevel 1 (
    echo [FOUND] python3
    python3 --version
    echo.
)

echo If Python is installed but not found, you may need to:
echo 1. Add Python to your PATH environment variable
echo 2. Or use the full path to Python.exe
echo 3. Or use the Python launcher: py setup_venv.py
echo.
pause

