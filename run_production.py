"""
Production runner for Real Estate Investment Calculator.
Configured to run on localhost:6006 for AppManager proxy compatibility.
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
    
    # Production settings - port from environment variable or default to 6006 (same as local)
    port = int(os.environ.get('PORT', 6006))
    
    # Use 127.0.0.1 when behind AppManager proxy (recommended for security)
    # Use 0.0.0.0 if the app needs to be accessible from outside the host
    host = os.environ.get('HOST', '127.0.0.1')
    
    print(f"Starting Real Estate Investment Calculator on {host}:{port}...")
    app.run(host=host, port=port, debug=False)

