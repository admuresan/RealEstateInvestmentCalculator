#!/bin/bash

# Cleanup script to remove old calculator installation from /home/ubuntu
# This is a one-time script to migrate from /home/ubuntu/calculator to /opt/calculator

set -e

# Configuration
SERVER_IP="40.233.70.245"
SERVER_USER="ubuntu"
SSH_KEY="ssh/ssh-key-2025-12-26.key"
OLD_APP_DIR="/home/ubuntu/calculator"
SERVICE_NAME="calculator.service"

echo "=========================================="
echo "Cleaning Up Old Calculator Installation"
echo "=========================================="
echo "Server: $SERVER_USER@$SERVER_IP"
echo "Old Directory: $OLD_APP_DIR"
echo "=========================================="
echo ""

# Check if SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo "❌ Error: SSH key not found at $SSH_KEY"
    exit 1
fi

# Set proper permissions for SSH key
chmod 600 "$SSH_KEY"

echo "⚠️  WARNING: This will remove the old installation from $OLD_APP_DIR"
echo "   Make sure the new installation at /opt/calculator is working correctly!"
echo ""
read -p "Continue with cleanup? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Cleanup cancelled."
    exit 0
fi

echo ""
echo "🧹 Starting cleanup..."

# Run cleanup on server
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" << 'REMOTE_EOF'
    set -e
    OLD_APP_DIR="/home/ubuntu/calculator"
    SERVICE_NAME="calculator.service"
    
    echo "1️⃣  Checking if old directory exists..."
    if [ ! -d "$OLD_APP_DIR" ]; then
        echo "   ✅ Old directory does not exist. Nothing to clean up."
        exit 0
    fi
    
    echo "   ⚠️  Old directory found at $OLD_APP_DIR"
    echo ""
    
    echo "2️⃣  Checking if service is still pointing to old location..."
    if sudo systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
        SERVICE_FILE=$(sudo systemctl show -p FragmentPath "$SERVICE_NAME" --value 2>/dev/null || echo "")
        if [ -n "$SERVICE_FILE" ]; then
            if grep -q "$OLD_APP_DIR" "$SERVICE_FILE" 2>/dev/null; then
                echo "   ⚠️  WARNING: Service is still configured to use old directory!"
                echo "   Service file: $SERVICE_FILE"
                echo "   Please ensure the service has been updated to use /opt/calculator"
                echo "   before removing the old installation."
                exit 1
            else
                echo "   ✅ Service is not using old directory"
            fi
        fi
    else
        echo "   ℹ️  Service is not running (this is okay)"
    fi
    echo ""
    
    echo "3️⃣  Listing contents of old directory..."
    ls -lah "$OLD_APP_DIR" | head -20
    echo ""
    
    echo "4️⃣  Calculating disk space to be freed..."
    OLD_SIZE=$(du -sh "$OLD_APP_DIR" 2>/dev/null | cut -f1 || echo "unknown")
    echo "   Old installation size: $OLD_SIZE"
    echo ""
    
    echo "5️⃣  Removing old installation..."
    echo "   Removing: $OLD_APP_DIR"
    rm -rf "$OLD_APP_DIR"
    
    if [ ! -d "$OLD_APP_DIR" ]; then
        echo "   ✅ Old directory successfully removed"
    else
        echo "   ❌ Failed to remove old directory"
        exit 1
    fi
    echo ""
    
    echo "6️⃣  Checking for any remaining calculator files in home directory..."
    REMAINING_FILES=$(find /home/ubuntu -name "*calculator*" -o -name "*Calculator*" 2>/dev/null | grep -v ".ssh" || true)
    if [ -n "$REMAINING_FILES" ]; then
        echo "   ⚠️  Found remaining files:"
        echo "$REMAINING_FILES" | while read -r file; do
            echo "      - $file"
        done
        echo "   (These may be unrelated files - review manually)"
    else
        echo "   ✅ No remaining calculator files found"
    fi
    echo ""
    
    echo "✅ Cleanup complete!"
    echo "   Old installation removed from $OLD_APP_DIR"
    echo "   Disk space freed: $OLD_SIZE"
REMOTE_EOF

echo ""
echo "=========================================="
echo "✅ Cleanup Complete!"
echo "=========================================="
echo ""
echo "The old installation has been removed from:"
echo "  $OLD_APP_DIR"
echo ""
echo "The new installation is located at:"
echo "  /opt/calculator"
echo ""
echo "Verify the application is working:"
echo "  ssh $SERVER_USER@$SERVER_IP 'sudo systemctl status $SERVICE_NAME'"
echo ""

