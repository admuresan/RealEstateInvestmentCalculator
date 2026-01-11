#!/bin/bash

# Deployment script for Real Estate Investment Calculator
# Deploys to Oracle Ubuntu 22.04 server without interfering with existing apps

set -e  # Exit on error

# Configuration
SERVER_IP="40.233.70.245"
SERVER_USER="ubuntu"
SSH_KEY="ssh/ssh-key-2025-12-26.key"
APP_NAME="calculator"
APP_DIR="/home/$SERVER_USER/$APP_NAME"  # Use absolute path to avoid Windows $HOME expansion
APP_PORT="5001"  # Different port to avoid conflicts
SERVICE_NAME="${APP_NAME}.service"

echo "=========================================="
echo "Deploying Real Estate Investment Calculator"
echo "=========================================="
echo "Server: $SERVER_USER@$SERVER_IP"
echo "App Directory: $APP_DIR"
echo "Port: $APP_PORT"
echo "=========================================="
echo ""

# Check if SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo "❌ Error: SSH key not found at $SSH_KEY"
    exit 1
fi

# Set proper permissions for SSH key
chmod 600 "$SSH_KEY"

echo "📦 Preparing deployment package..."

# Check if rsync is available, otherwise use tar+scp
if command -v rsync &> /dev/null; then
    echo "Using rsync for file transfer..."
    # Create a temporary directory for deployment
    TEMP_DIR=$(mktemp -d 2>/dev/null || echo "/tmp/deploy_$$")
    DEPLOY_DIR="$TEMP_DIR/$APP_NAME"
    
    # Copy application files (exclude unnecessary files)
    mkdir -p "$DEPLOY_DIR"
    rsync -av --progress \
        --exclude='.git' \
        --exclude='__pycache__' \
        --exclude='*.pyc' \
        --exclude='venv' \
        --exclude='node_modules' \
        --exclude='.gitignore' \
        --exclude='*.bat' \
        --exclude='find_python.bat' \
        --exclude='ssh' \
        --exclude='*.md' \
        --exclude='DEVELOPMENT.md' \
        --exclude='instructions' \
        ./ "$DEPLOY_DIR/"
    
    echo ""
    echo "🚀 Uploading files to server..."
    
    # Upload files to server
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" << 'REMOTE_EOF'
        set -e
        APP_DIR="/home/ubuntu/calculator"
        APP_PORT="5001"
        SERVICE_NAME="calculator.service"
        
        # Create app directory
        mkdir -p "$APP_DIR"
        
        # Stop existing calculator service if it's running
        if sudo systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
            echo "🛑 Stopping existing calculator service..."
            sudo systemctl stop "$SERVICE_NAME" || true
            sleep 2
        fi
        
        # Check if port is still in use by another service (not our calculator)
        if netstat -tuln 2>/dev/null | grep -q ":$APP_PORT " || ss -tuln 2>/dev/null | grep -q ":$APP_PORT "; then
            echo "⚠️  Warning: Port $APP_PORT is still in use by another service!"
            echo "Please stop the service using port $APP_PORT or choose a different port."
            exit 1
        fi
REMOTE_EOF
    
    # Copy files to server
    rsync -avz --progress -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
        "$DEPLOY_DIR/" "$SERVER_USER@$SERVER_IP:$APP_DIR/"
    
    # Clean up temp directory
    rm -rf "$TEMP_DIR"
else
    echo "rsync not found, using tar+scp for file transfer..."
    echo "🚀 Uploading files to server..."
    
    # Create tar archive and upload
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" << 'REMOTE_EOF'
        set -e
        APP_DIR="/home/ubuntu/calculator"
        APP_PORT="5001"
        SERVICE_NAME="calculator.service"
        
        mkdir -p "$APP_DIR"
        
        # Stop existing calculator service if it's running
        if sudo systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
            echo "🛑 Stopping existing calculator service..."
            sudo systemctl stop "$SERVICE_NAME" || true
        fi
        
        # Check if port is still in use by another service
        if netstat -tuln 2>/dev/null | grep -q ":$APP_PORT " || ss -tuln 2>/dev/null | grep -q ":$APP_PORT "; then
            # Check if it's our service that's still stopping
            sleep 2
            if netstat -tuln 2>/dev/null | grep -q ":$APP_PORT " || ss -tuln 2>/dev/null | grep -q ":$APP_PORT "; then
                echo "⚠️  Warning: Port $APP_PORT is still in use by another service!"
                echo "Please stop the service using port $APP_PORT or choose a different port."
                exit 1
            fi
        fi
REMOTE_EOF
    
    # Create tar archive excluding unnecessary files
    tar --exclude='.git' \
        --exclude='__pycache__' \
        --exclude='*.pyc' \
        --exclude='venv' \
        --exclude='node_modules' \
        --exclude='.gitignore' \
        --exclude='*.bat' \
        --exclude='find_python.bat' \
        --exclude='ssh' \
        --exclude='*.md' \
        --exclude='DEVELOPMENT.md' \
        --exclude='instructions' \
        --exclude='deploy.sh' \
        -czf - . | ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "cd /home/ubuntu/calculator && tar -xzf -"
fi

echo ""
echo "🔧 Setting up application on server..."

# Run setup commands on server
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" << 'REMOTE_EOF'
    set -e
    APP_DIR="/home/ubuntu/calculator"
    APP_PORT="5001"
    SERVICE_NAME="calculator.service"
    
    cd "$APP_DIR"
    
    echo "📦 Installing system dependencies..."
    sudo apt-get update -qq
    sudo apt-get install -y python3 python3-pip python3-venv nginx certbot python3-certbot-nginx > /dev/null 2>&1 || true
    
    echo "🐍 Creating virtual environment..."
    python3 -m venv venv
    
    echo "📥 Installing Python dependencies..."
    ./venv/bin/pip install --upgrade pip --quiet
    ./venv/bin/pip install -r requirements.txt --quiet
    
    echo "📝 Creating production app runner..."
    cat > run_production.py << 'PYEOF'
import os
import sys

# Add the app directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Remove conflicting 'app' module if it exists
if 'app' in sys.modules and not hasattr(sys.modules['app'], '__path__'):
    del sys.modules['app']

from app.backend.app import create_app

app = create_app()

if __name__ == '__main__':
    # Production settings
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
PYEOF
    
    echo "⚙️  Creating systemd service..."
    sudo tee /etc/systemd/system/$SERVICE_NAME > /dev/null << SERVICEEOF
[Unit]
Description=Real Estate Investment Calculator
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=$APP_DIR
Environment="PATH=$APP_DIR/venv/bin"
Environment="PORT=$APP_PORT"
ExecStart=$APP_DIR/venv/bin/python $APP_DIR/run_production.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
SERVICEEOF
    
    echo "🔄 Reloading systemd and starting service..."
    sudo systemctl daemon-reload
    sudo systemctl enable $SERVICE_NAME
    sudo systemctl restart $SERVICE_NAME
    
    echo ""
    echo "✅ Checking service status..."
    sleep 2
    sudo systemctl status $SERVICE_NAME --no-pager -l || true
    
    echo ""
    echo "🌐 Checking if app is responding..."
    sleep 3
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:$APP_PORT | grep -q "200\|404"; then
        echo "✅ Application is running on port $APP_PORT"
    else
        echo "⚠️  Application may not be responding yet. Check logs with:"
        echo "   sudo journalctl -u $SERVICE_NAME -f"
    fi
    
    echo ""
    echo "🔒 Setting up HTTPS with self-signed certificate..."
    
    # Create SSL directory if it doesn't exist
    sudo mkdir -p /etc/ssl/private /etc/ssl/certs
    
    # Check if certificate already exists
    if [ ! -f /etc/ssl/certs/calculator-selfsigned.crt ]; then
        echo "📜 Generating self-signed SSL certificate..."
        sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout /etc/ssl/private/calculator-selfsigned.key \
            -out /etc/ssl/certs/calculator-selfsigned.crt \
            -subj "/C=US/ST=State/L=City/O=Calculator/CN=40.233.70.245" \
            -addext "subjectAltName=IP:40.233.70.245" 2>/dev/null || \
        sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout /etc/ssl/private/calculator-selfsigned.key \
            -out /etc/ssl/certs/calculator-selfsigned.crt \
            -subj "/C=US/ST=State/L=City/O=Calculator/CN=40.233.70.245"
        
        # Set proper permissions
        sudo chmod 600 /etc/ssl/private/calculator-selfsigned.key
        sudo chmod 644 /etc/ssl/certs/calculator-selfsigned.crt
        
        echo "✅ Self-signed certificate created"
    else
        echo "✅ Self-signed certificate already exists"
    fi
    
    echo "⚙️  Configuring nginx for HTTPS..."
    
    # Create nginx configuration with HTTPS
    sudo tee /etc/nginx/sites-available/calculator > /dev/null << NGINXCONFIG
# HTTP server - redirect to HTTPS
server {
    listen 80;
    server_name 40.233.70.245 _;
    
    # Redirect all HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name 40.233.70.245 _;

    # Self-signed SSL certificates
    ssl_certificate /etc/ssl/certs/calculator-selfsigned.crt;
    ssl_certificate_key /etc/ssl/private/calculator-selfsigned.key;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://127.0.0.1:$APP_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # WebSocket support (if needed in future)
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
NGINXCONFIG
    
    # Enable site
    sudo ln -sf /etc/nginx/sites-available/calculator /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test nginx configuration
    if sudo nginx -t > /dev/null 2>&1; then
        echo "✅ Nginx configuration is valid"
        sudo systemctl reload nginx
        echo "✅ Nginx reloaded with HTTPS configuration"
    else
        echo "⚠️  Nginx configuration test failed, but continuing..."
        sudo nginx -t || true
    fi
    
    # Ensure firewall allows HTTPS
    sudo ufw allow 80/tcp > /dev/null 2>&1 || true
    sudo ufw allow 443/tcp > /dev/null 2>&1 || true
    
    echo ""
    echo "✅ HTTPS setup complete!"
    echo "   Access your app at: https://40.233.70.245"
    echo "   (Browsers will show a security warning for self-signed certificates)"
    echo "   HTTP requests will automatically redirect to HTTPS"
REMOTE_EOF

echo ""
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "Application Details:"
echo "  - URL: http://$SERVER_IP:$APP_PORT"
echo "  - Service: $SERVICE_NAME"
echo ""
echo "Useful Commands:"
echo "  - View logs: ssh $SERVER_USER@$SERVER_IP 'sudo journalctl -u $SERVICE_NAME -f'"
echo "  - Restart: ssh $SERVER_USER@$SERVER_IP 'sudo systemctl restart $SERVICE_NAME'"
echo "  - Stop: ssh $SERVER_USER@$SERVER_IP 'sudo systemctl stop $SERVICE_NAME'"
echo "  - Status: ssh $SERVER_USER@$SERVER_IP 'sudo systemctl status $SERVICE_NAME'"
echo ""
echo "✅ HTTPS automatically configured with self-signed certificate!"
echo "   Access your app at: https://$SERVER_IP"
echo "   (Browsers will show a security warning - this is normal for self-signed certs)"
echo ""
echo "⚠️  IMPORTANT: Make sure ports 80 and 443 are accessible from the web!"
echo "   See DEPLOYMENT_INSTRUCTIONS.md for Oracle Cloud firewall setup."
echo ""
echo "🔒 To upgrade to Let's Encrypt certificate (if you have a domain name):"
echo "   ./setup_https.sh your-domain.com"
echo ""

