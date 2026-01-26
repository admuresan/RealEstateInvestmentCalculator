"""
Flask application for real estate investment calculator.
"""

from flask import Flask, request, url_for, jsonify
from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix
from app.backend.api.routes import api_bp


def create_app():
    """Create and configure Flask application."""
    import os
    # Get the path to the frontend folder relative to this file
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(os.path.dirname(backend_dir), 'frontend')
    templates_dir = os.path.join(backend_dir, 'templates')
    
    # Create templates directory if it doesn't exist
    os.makedirs(templates_dir, exist_ok=True)
    
    app = Flask(__name__, 
                static_folder=frontend_dir, 
                static_url_path='',
                template_folder=templates_dir)
    
    # CRITICAL: Configure ProxyFix BEFORE CORS and routes
    # This allows the app to work properly when proxied by AppManager
    app.wsgi_app = ProxyFix(
        app.wsgi_app,
        x_for=1,      # Number of proxies in front (AppManager = 1)
        x_proto=1,    # Trust X-Forwarded-Proto header
        x_host=1,     # Trust X-Forwarded-Host header
        x_port=1,     # Trust X-Forwarded-Port header
        x_prefix=1    # Trust X-Forwarded-Prefix header
    )
    
    CORS(app)
    
    # Register blueprints
    app.register_blueprint(api_bp, url_prefix='/api')
    
    @app.route('/')
    def index():
        """Serve the main HTML page."""
        from flask import render_template
        return render_template('index.html')
    
    # Debug endpoints for testing ProxyFix configuration
    @app.route('/debug/proxy')
    def debug_proxy():
        """Debug endpoint to check proxy headers."""
        return jsonify({
            'remote_addr': request.remote_addr,
            'is_secure': request.is_secure,
            'host': request.host,
            'url': request.url,
            'base_url': request.base_url,
            'headers': dict(request.headers)
        })
    
    @app.route('/test/urls')
    def test_urls():
        """Test URL generation."""
        return jsonify({
            'index_url': url_for('index', _external=True),
            'current_url': request.url,
            'base_url': request.base_url,
            'css_url': url_for('static', filename='styles/main.css', _external=True),
            'js_url': url_for('static', filename='static/js/main.js', _external=True)
        })
    
    return app


if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=6006, debug=True)

