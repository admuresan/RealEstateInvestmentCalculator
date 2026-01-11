"""
Setup script to install dependencies in the virtual environment.
"""

import os
import sys
import subprocess

def get_venv_python():
    """Get the Python executable path from the virtual environment."""
    venv_dir = os.path.join(os.path.dirname(__file__), 'venv')
    
    if not os.path.exists(venv_dir):
        print("Virtual environment not found!")
        print("Please create it first with: python -m venv venv")
        sys.exit(1)
    
    if sys.platform == 'win32':
        python_path = os.path.join(venv_dir, 'Scripts', 'python.exe')
    else:
        python_path = os.path.join(venv_dir, 'bin', 'python')
    
    if not os.path.exists(python_path):
        print(f"Python not found in virtual environment at {python_path}")
        sys.exit(1)
    
    return python_path

def install_requirements(python_path):
    """Install Python requirements in the virtual environment."""
    requirements_file = os.path.join(os.path.dirname(__file__), 'requirements.txt')
    
    print(f"Installing Python requirements from {requirements_file}...")
    try:
        subprocess.check_call([python_path, '-m', 'pip', 'install', '--upgrade', 'pip'])
        subprocess.check_call([python_path, '-m', 'pip', 'install', '-r', requirements_file])
        print("Python requirements installed successfully!")
    except subprocess.CalledProcessError as e:
        print(f"Error installing requirements: {e}")
        sys.exit(1)

def install_node_dependencies():
    """Install Node.js dependencies."""
    print("Installing Node.js dependencies...")
    try:
        subprocess.check_call(['npm', 'install'], cwd=os.path.dirname(__file__))
        print("Node.js dependencies installed successfully!")
    except subprocess.CalledProcessError as e:
        print(f"Error installing Node.js dependencies: {e}")
        print("Make sure Node.js and npm are installed.")
        sys.exit(1)

def build_typescript():
    """Compile TypeScript."""
    print("Compiling TypeScript...")
    try:
        subprocess.check_call(['npm', 'run', 'build'], cwd=os.path.dirname(__file__))
        print("TypeScript compiled successfully!")
    except subprocess.CalledProcessError as e:
        print(f"Error compiling TypeScript: {e}")
        sys.exit(1)

if __name__ == '__main__':
    print("Setting up Real Estate Investment Calculator...")
    print("=" * 50)
    
    # Get Python from virtual environment
    python_path = get_venv_python()
    
    # Install Python requirements
    install_requirements(python_path)
    
    # Install Node.js dependencies
    install_node_dependencies()
    
    # Build TypeScript
    build_typescript()
    
    print("=" * 50)
    print("Setup complete! You can now run the app with: python app.py")

