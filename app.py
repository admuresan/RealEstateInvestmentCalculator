"""
Main entry point for the real estate investment calculator.
"""

import sys
import os
import subprocess

def ensure_venv():
    """Ensure we're running in the virtual environment."""
    venv_dir = os.path.join(os.path.dirname(__file__), 'venv')
    
    if not os.path.exists(venv_dir):
        print("Virtual environment not found!")
        print("Please run: python setup_venv.py")
        sys.exit(1)
    
    # Determine venv Python path
    if sys.platform == 'win32':
        venv_python = os.path.join(venv_dir, 'Scripts', 'python.exe')
        venv_scripts = os.path.join(venv_dir, 'Scripts')
    else:
        venv_python = os.path.join(venv_dir, 'bin', 'python')
        venv_scripts = os.path.join(venv_dir, 'bin')
    
    if not os.path.exists(venv_python):
        print(f"Virtual environment Python not found at {venv_python}")
        print("Please run: python setup_venv.py")
        sys.exit(1)
    
    # Check if we're already running with the venv's Python
    current_python = sys.executable
    if os.path.abspath(current_python) == os.path.abspath(venv_python):
        # We're already using the venv's Python
        return
    
    # Check if venv is in the path (alternative check)
    if venv_scripts in os.environ.get('PATH', ''):
        # Venv is activated
        return
    
    # We're not in the venv, so we need to restart with venv's Python
    print("Activating virtual environment and restarting...")
    os.execv(venv_python, [venv_python] + sys.argv)

if __name__ == '__main__':
    # Ensure we're in the virtual environment
    ensure_venv()
    
    # Note: For development, use Vite dev server (npm run dev) instead of Flask serving frontend
    # Flask is for production or API-only access
    
    # Workaround for naming conflict between app.py and app/ directory
    # When Python loads this file, it creates a module named 'app' in sys.modules
    # We need to remove it so we can import the app/ directory package instead
    _current_dir = os.path.dirname(os.path.abspath(__file__))
    if _current_dir not in sys.path:
        sys.path.insert(0, _current_dir)
    
    # Remove the conflicting module if it exists (created from this file)
    if 'app' in sys.modules and not hasattr(sys.modules['app'], '__path__'):
        del sys.modules['app']
    
    # Now we can import the app package directory
    from app.backend.app import create_app
    
    app = create_app()
    print("\n✅ Flask API server starting at http://localhost:6006")
    print("💡 For development, run 'npm run dev' in another terminal to start Vite dev server")
    print("   Then access the app at http://localhost:5173\n")
    debug = os.environ.get('FLASK_ENV') != 'production'
    app.run(host='0.0.0.0', port=6006, debug=debug)

