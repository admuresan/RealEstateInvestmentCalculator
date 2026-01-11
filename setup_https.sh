#!/bin/bash

# Script to set up HTTPS for the Calculator app using Let's Encrypt
# Usage: ./setup_https.sh your-domain.com

set -e

if [ -z "$1" ]; then
    echo "Usage: ./setup_https.sh <domain-name>"
    echo "Example: ./setup_https.sh calculator.example.com"
    exit 1
fi

DOMAIN="$1"
SERVER_IP="40.233.70.245"
SERVER_USER="ubuntu"
SSH_KEY="ssh/ssh-key-2025-12-26.key"
NGINX_CONFIG="/etc/nginx/sites-available/calculator"

echo "=========================================="
echo "Setting up HTTPS for Calculator App"
echo "=========================================="
echo "Domain: $DOMAIN"
echo "Server: $SERVER_USER@$SERVER_IP"
echo "=========================================="
echo ""

# Check if SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo "❌ Error: SSH key not found at $SSH_KEY"
    exit 1
fi

# Set proper permissions for SSH key
chmod 600 "$SSH_KEY"

echo "🔧 Setting up HTTPS on server..."

ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" << EOF
    set -e
    
    echo "📦 Installing certbot..."
    sudo apt-get update -qq
    sudo apt-get install -y certbot python3-certbot-nginx > /dev/null 2>&1 || true
    
    # Ensure nginx config exists (create basic HTTP config if needed)
    if [ ! -f /etc/nginx/sites-available/calculator ]; then
        echo "📝 Creating nginx configuration..."
        sudo tee /etc/nginx/sites-available/calculator > /dev/null << NGINXEOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:5001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINXEOF
        
        # Enable site if not already enabled
        if [ ! -L /etc/nginx/sites-enabled/calculator ]; then
            sudo ln -s /etc/nginx/sites-available/calculator /etc/nginx/sites-enabled/
        fi
        
        # Remove default if it exists
        sudo rm -f /etc/nginx/sites-enabled/default
        
        # Test and reload nginx
        sudo nginx -t
        sudo systemctl reload nginx
    fi
    
    echo "🔐 Requesting SSL certificate for $DOMAIN..."
    echo "   (You may be prompted for an email address)"
    sudo certbot --nginx -d $DOMAIN --redirect
    
    echo ""
    echo "✅ SSL certificate installed!"
    echo ""
    echo "🔍 Verifying certificate..."
    sudo certbot certificates
    
    echo ""
    echo "✅ HTTPS setup complete!"
    echo "   Access your app at: https://$DOMAIN"
    echo ""
    echo "📝 Certificate will auto-renew. Test renewal with:"
    echo "   sudo certbot renew --dry-run"
EOF

echo ""
echo "=========================================="
echo "✅ HTTPS Setup Complete!"
echo "=========================================="
echo ""
echo "Your app is now accessible at:"
echo "  - https://$DOMAIN (HTTPS)"
echo "  - http://$DOMAIN (redirects to HTTPS)"
echo ""
echo "Certificate will automatically renew before expiration."
echo ""

