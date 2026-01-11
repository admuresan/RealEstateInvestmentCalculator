#!/bin/bash

echo "Setting up Real Estate Investment Calculator..."
echo

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed or not in PATH"
    exit 1
fi

# Run the setup script
python3 setup_venv.py

if [ $? -ne 0 ]; then
    echo "Setup failed!"
    exit 1
fi

echo
echo "Setup complete! You can now run the app with: python app.py"

