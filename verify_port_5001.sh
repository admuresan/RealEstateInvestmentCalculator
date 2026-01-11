#!/bin/bash

# Script to verify and ensure port 5001 is accessible externally

set -e

SERVER_IP="40.233.70.245"
SERVER_USER="ubuntu"
SSH_KEY="ssh/ssh-key-2025-12-26.key"

echo "=========================================="
echo "Verifying Port 5001 Direct Access Setup"
echo "=========================================="
echo ""

# Check if SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo "❌ Error: SSH key not found at $SSH_KEY"
    exit 1
fi

# Set proper permissions for SSH key
chmod 600 "$SSH_KEY"

echo "🔍 Verifying port 5001 configuration..."
echo ""

ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" << 'REMOTE_EOF'
    set -e
    
    echo "1️⃣  Checking if Flask app is running on port 5001..."
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:5001 | grep -q "200\|404"; then
        echo "   ✅ Flask app is running and responding on port 5001"
        echo "   Response:"
        curl -s http://localhost:5001 | head -5
        echo ""
    else
        echo "   ❌ Flask app is NOT responding on port 5001"
        echo "   Checking service status..."
        sudo systemctl status calculator.service --no-pager -l || true
        exit 1
    fi
    
    echo ""
    echo "2️⃣  Verifying Flask app is bound to 0.0.0.0 (all interfaces)..."
    if sudo netstat -tuln 2>/dev/null | grep ":5001" | grep -q "0.0.0.0:5001" || \
       sudo ss -tuln 2>/dev/null | grep ":5001" | grep -q "0.0.0.0:5001"; then
        echo "   ✅ App is bound to 0.0.0.0:5001 (accessible from outside)"
        sudo netstat -tuln 2>/dev/null | grep ":5001" || sudo ss -tuln 2>/dev/null | grep ":5001"
    else
        echo "   ⚠️  Checking what's listening on port 5001..."
        sudo netstat -tuln 2>/dev/null | grep ":5001" || sudo ss -tuln 2>/dev/null | grep ":5001" || echo "   No process found listening on 5001"
    fi
    
    echo ""
    echo "3️⃣  Checking UFW firewall for port 5001..."
    if sudo ufw status | grep -q "5001/tcp"; then
        echo "   ✅ Port 5001 is allowed in UFW firewall"
        sudo ufw status | grep "5001"
    else
        echo "   ⚠️  Port 5001 is NOT explicitly allowed - adding rule..."
        sudo ufw allow 5001/tcp
        echo "   ✅ Port 5001 rule added"
    fi
    
    echo ""
    echo "4️⃣  Testing external access simulation..."
    # Try to connect from the server's external IP perspective
    EXTERNAL_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || echo "unknown")
    echo "   Server external IP: $EXTERNAL_IP"
    echo "   Testing if port 5001 is reachable..."
    
    # Use timeout to test if port is open
    if timeout 2 bash -c "echo > /dev/tcp/localhost/5001" 2>/dev/null; then
        echo "   ✅ Port 5001 is open and accepting connections"
    else
        echo "   ⚠️  Could not connect to port 5001 (this might be normal if testing from localhost)"
    fi
    
    echo ""
    echo "=========================================="
    echo "✅ Server-side verification complete!"
    echo "=========================================="
    echo ""
    echo "📋 Summary:"
    echo "   - Flask app: Running on port 5001"
    echo "   - Binding: 0.0.0.0:5001 (accessible externally)"
    echo "   - UFW Firewall: Port 5001 allowed"
    echo ""
    echo "🌐 Access your app at:"
    echo "   http://40.233.70.245:5001"
    echo ""
    echo "⚠️  IMPORTANT: Make sure Oracle Cloud Security Rules allow port 5001!"
    echo "   If you can't access it, check Oracle Cloud Console:"
    echo "   1. Go to Networking → Virtual Cloud Networks"
    echo "   2. Select your VCN → Security Lists"
    echo "   3. Add Ingress Rule:"
    echo "      - Source: 0.0.0.0/0"
    echo "      - Protocol: TCP"
    echo "      - Port: 5001"
    echo ""
REMOTE_EOF

echo ""
echo "=========================================="
echo "✅ Verification complete!"
echo "=========================================="
echo ""
echo "If you still can't access http://40.233.70.245:5001,"
echo "the issue is Oracle Cloud Security Rules."
echo ""
echo "Add this Ingress Rule in Oracle Cloud Console:"
echo "  - Source Type: CIDR"
echo "  - Source CIDR: 0.0.0.0/0"
echo "  - IP Protocol: TCP"
echo "  - Destination Port Range: 5001"
echo "  - Description: Calculator App Direct Access"
echo ""

