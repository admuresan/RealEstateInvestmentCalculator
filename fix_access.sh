#!/bin/bash

# Script to fix external access to the calculator app
# This checks and fixes firewall and nginx configuration

set -e

SERVER_IP="40.233.70.245"
SERVER_USER="ubuntu"
SSH_KEY="ssh/ssh-key-2025-12-26.key"

echo "=========================================="
echo "Fixing External Access to Calculator App"
echo "=========================================="
echo ""

# Check if SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo "❌ Error: SSH key not found at $SSH_KEY"
    exit 1
fi

# Set proper permissions for SSH key
chmod 600 "$SSH_KEY"

echo "🔍 Diagnosing the issue..."
echo ""

ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" << 'REMOTE_EOF'
    set -e
    
    echo "1️⃣  Checking if Flask app is running..."
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:5001 | grep -q "200\|404"; then
        echo "   ✅ Flask app is running on port 5001"
    else
        echo "   ❌ Flask app is NOT responding on port 5001"
        echo "   Checking service status..."
        sudo systemctl status calculator.service --no-pager -l || true
        exit 1
    fi
    
    echo ""
    echo "2️⃣  Checking nginx status..."
    if sudo systemctl is-active --quiet nginx; then
        echo "   ✅ Nginx is running"
    else
        echo "   ❌ Nginx is NOT running - starting it..."
        sudo systemctl start nginx
        sudo systemctl enable nginx
        echo "   ✅ Nginx started"
    fi
    
    echo ""
    echo "3️⃣  Checking nginx configuration..."
    if sudo nginx -t 2>&1 | grep -q "successful"; then
        echo "   ✅ Nginx configuration is valid"
    else
        echo "   ❌ Nginx configuration has errors:"
        sudo nginx -t || true
        exit 1
    fi
    
    echo ""
    echo "4️⃣  Checking UFW firewall status..."
    UFW_STATUS=$(sudo ufw status | head -1)
    echo "   Status: $UFW_STATUS"
    
    if echo "$UFW_STATUS" | grep -q "inactive"; then
        echo "   ⚠️  UFW is inactive - enabling it..."
        echo "y" | sudo ufw enable
        echo "   ✅ UFW enabled"
    fi
    
    echo ""
    echo "5️⃣  Configuring firewall rules..."
    sudo ufw allow 22/tcp > /dev/null 2>&1 || true  # SSH
    sudo ufw allow 80/tcp > /dev/null 2>&1 || true  # HTTP
    sudo ufw allow 443/tcp > /dev/null 2>&1 || true # HTTPS
    
    echo "   ✅ Firewall rules configured"
    
    echo ""
    echo "6️⃣  Checking current firewall rules..."
    sudo ufw status numbered
    
    echo ""
    echo "7️⃣  Reloading nginx to ensure latest configuration..."
    sudo systemctl reload nginx
    echo "   ✅ Nginx reloaded"
    
    echo ""
    echo "8️⃣  Testing nginx locally..."
    if curl -s -k -o /dev/null -w "%{http_code}" https://localhost | grep -q "200\|404\|301\|302"; then
        echo "   ✅ Nginx is responding on HTTPS"
    else
        echo "   ⚠️  Nginx HTTPS test returned:"
        curl -s -k -w "\nHTTP Status: %{http_code}\n" https://localhost || true
    fi
    
    if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200\|404\|301\|302"; then
        echo "   ✅ Nginx is responding on HTTP (should redirect to HTTPS)"
    else
        echo "   ⚠️  Nginx HTTP test returned:"
        curl -s -w "\nHTTP Status: %{http_code}\n" http://localhost || true
    fi
    
    echo ""
    echo "=========================================="
    echo "✅ Server-side checks complete!"
    echo "=========================================="
    echo ""
    echo "📋 Summary:"
    echo "   - Flask app: Running on port 5001"
    echo "   - Nginx: Running and configured"
    echo "   - Firewall: Configured for ports 80, 443"
    echo ""
    echo "🌐 Try accessing your app at:"
    echo "   - HTTPS: https://40.233.70.245"
    echo "   - HTTP: http://40.233.70.245 (redirects to HTTPS)"
    echo ""
    echo "⚠️  If you still can't access it, check Oracle Cloud Console:"
    echo "   1. Go to Networking → Virtual Cloud Networks"
    echo "   2. Select your VCN → Security Lists"
    echo "   3. Ensure ports 80 and 443 are allowed from 0.0.0.0/0"
    echo ""
REMOTE_EOF

echo ""
echo "=========================================="
echo "✅ Diagnostic complete!"
echo "=========================================="
echo ""
echo "If you still can't access the app, the issue is likely:"
echo "  1. Oracle Cloud Security Rules - check the console"
echo "  2. Network routing issues"
echo ""
echo "To check Oracle Cloud Security Rules:"
echo "  - Log into Oracle Cloud Console"
echo "  - Networking → Virtual Cloud Networks"
echo "  - Select your VCN → Security Lists"
echo "  - Add Ingress Rules for ports 80 and 443"
echo ""

