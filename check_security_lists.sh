#!/bin/bash

# Script to check security list configuration and verify network setup

set -e

SERVER_IP="40.233.70.245"
SERVER_USER="ubuntu"
SSH_KEY="ssh/ssh-key-2025-12-26.key"

echo "=========================================="
echo "Checking Security List Configuration"
echo "=========================================="
echo ""

# Check if SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo "❌ Error: SSH key not found at $SSH_KEY"
    exit 1
fi

chmod 600 "$SSH_KEY"

echo "🔍 Checking network configuration on the server..."
echo ""

ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" << 'REMOTE_EOF'
    set -e
    
    echo "1️⃣  Checking network interfaces and IP addresses..."
    echo "   Network interfaces:"
    ip addr show | grep -E "^[0-9]+:|inet " | head -10
    echo ""
    
    echo "2️⃣  Checking if app is listening on all interfaces..."
    echo "   Listening on port 5001:"
    sudo netstat -tuln 2>/dev/null | grep ":5001" || sudo ss -tuln 2>/dev/null | grep ":5001"
    echo ""
    
    echo "3️⃣  Testing local connectivity..."
    if curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:5001; then
        echo "   ✅ App responds on localhost"
    else
        echo "   ❌ App does NOT respond on localhost"
    fi
    echo ""
    
    echo "4️⃣  Testing connectivity from server's perspective..."
    EXTERNAL_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || echo "unknown")
    echo "   Server's external IP: $EXTERNAL_IP"
    echo ""
    
    echo "5️⃣  Checking firewall rules..."
    echo "   UFW status:"
    sudo ufw status numbered | grep -E "5001|Status:" || echo "   No UFW rules found for 5001"
    echo ""
    
    echo "6️⃣  Checking if iptables might be blocking..."
    if command -v iptables > /dev/null 2>&1; then
        echo "   iptables rules for port 5001:"
        sudo iptables -L -n | grep -E "5001|Chain" | head -10 || echo "   No iptables rules found"
    else
        echo "   iptables not available"
    fi
    echo ""
    
    echo "7️⃣  Checking if the app process is running..."
    if pgrep -f "run_production.py" > /dev/null; then
        echo "   ✅ Flask app process is running"
        ps aux | grep -E "run_production|python.*5001" | grep -v grep | head -2
    else
        echo "   ❌ Flask app process is NOT running"
        echo "   Checking systemd service..."
        sudo systemctl status calculator.service --no-pager -l | head -15 || true
    fi
    echo ""
    
    echo "=========================================="
    echo "📋 Diagnostic Summary"
    echo "=========================================="
    echo ""
    echo "If the app is running but not accessible externally:"
    echo "  1. Verify the security rule is in the CORRECT security list"
    echo "  2. Check that the instance's subnet uses that security list"
    echo "  3. In Oracle Cloud Console, check:"
    echo "     - Compute → Instances → Your Instance → Attached VNICs"
    echo "     - Note the Subnet and Security List"
    echo "     - Ensure the rule is in THAT security list"
    echo ""
REMOTE_EOF

echo ""
echo "=========================================="
echo "✅ Diagnostic complete!"
echo "=========================================="
echo ""
echo "⚠️  IMPORTANT: In Oracle Cloud Console, verify:"
echo ""
echo "1. Go to: Compute → Instances → [Your Instance]"
echo "2. Click on the instance name"
echo "3. Scroll to 'Attached VNICs' section"
echo "4. Click on the VNIC"
echo "5. Note the 'Subnet' and 'Security List'"
echo "6. Go to: Networking → Virtual Cloud Networks → [Your VCN]"
echo "7. Click 'Security Lists'"
echo "8. Click on the Security List that matches your instance"
echo "9. Verify the port 5001 rule is in THAT specific security list"
echo ""
echo "The security rule must be in the SAME security list that your instance uses!"
echo ""

