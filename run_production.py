"""
Production runner for Real Estate Investment Calculator.
This file is created on the server during deployment.
"""

import os
import sys

# Add the app directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Remove conflicting 'app' module if it exists
if 'app' in sys.modules and not hasattr(sys.modules['app'], '__path__'):
    del sys.modules['app']

from app.backend.app import create_app

if __name__ == '__main__':
    app = create_app()
    
    # Production settings - port from environment variable or default to 5001
    port = int(os.environ.get('PORT', 5001))
    
    print(f"Starting Real Estate Investment Calculator on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=False)

