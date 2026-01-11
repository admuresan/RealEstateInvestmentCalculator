"""
Flask application for real estate investment calculator.
"""

from flask import Flask
from flask_cors import CORS
from app.backend.api.routes import api_bp


def create_app():
    """Create and configure Flask application."""
    import os
    # Get the path to the frontend folder relative to this file
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(os.path.dirname(backend_dir), 'frontend')
    app = Flask(__name__, static_folder=frontend_dir, static_url_path='')
    CORS(app)
    
    # Register blueprints
    app.register_blueprint(api_bp, url_prefix='/api')
    
    @app.route('/')
    def index():
        """Serve the main HTML page."""
        return app.send_static_file('index.html')
    
    return app


if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=6006, debug=True)

