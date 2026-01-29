#!/bin/bash

# Deployment script for Real Estate Investment Calculator
# Deploys to Oracle Ubuntu 22.04 server without interfering with existing apps

set -e  # Exit on error

# Configuration
SERVER_IP="40.233.70.245"
SERVER_USER="ubuntu"
SSH_KEY="ssh/ssh-key-2025-12-26.key"
APP_NAME="calculator"
APP_DIR="/opt/$APP_NAME"  # Install to /opt for system-wide applications
APP_PORT="6006"  # Same port as local development
VENV_NAME="calculator_venv"  # Specific name for virtual environment
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

# SSH options - suppress MOTD/login messages
SSH_OPTS="-i $SSH_KEY -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR -o BatchMode=yes"

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
        --exclude='calculator_venv' \
        --exclude='node_modules' \
        --exclude='.gitignore' \
        --exclude='*.bat' \
        --exclude='find_python.bat' \
        --exclude='ssh' \
        --exclude='instructions' \
        ./ "$DEPLOY_DIR/"
    
    echo ""
    echo "🚀 Uploading files to server..."
    
    # Upload files to server
    ssh $SSH_OPTS "$SERVER_USER@$SERVER_IP" << 'REMOTE_EOF'
        set -e
        APP_DIR="/opt/calculator"
        APP_PORT="6006"
        SERVICE_NAME="calculator.service"
        
        # Create app directory with proper permissions
        sudo mkdir -p "$APP_DIR"
        sudo chown -R ubuntu:ubuntu "$APP_DIR"
        
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
    rsync -avz --progress -e "ssh $SSH_OPTS" \
        "$DEPLOY_DIR/" "$SERVER_USER@$SERVER_IP:$APP_DIR/"
    
    # Clean up temp directory
    rm -rf "$TEMP_DIR"
else
    echo "rsync not found, using tar+scp for file transfer..."
    echo "🚀 Uploading files to server..."
    
    # Create tar archive and upload
    ssh $SSH_OPTS "$SERVER_USER@$SERVER_IP" << 'REMOTE_EOF'
        set -e
        APP_DIR="/opt/calculator"
        APP_PORT="6006"
        SERVICE_NAME="calculator.service"
        
        # Create app directory with proper permissions
        sudo mkdir -p "$APP_DIR"
        sudo chown -R ubuntu:ubuntu "$APP_DIR"
        
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
        --exclude='calculator_venv' \
        --exclude='node_modules' \
        --exclude='.gitignore' \
        --exclude='*.bat' \
        --exclude='find_python.bat' \
        --exclude='ssh' \
        --exclude='instructions' \
        --exclude='deploy.sh' \
        -czf - . | ssh $SSH_OPTS "$SERVER_USER@$SERVER_IP" "sudo mkdir -p /opt/calculator && sudo chown -R ubuntu:ubuntu /opt/calculator && cd /opt/calculator && tar -xzf -"
fi

echo ""
echo "🔧 Setting up application on server..."

# Run setup commands on server
ssh $SSH_OPTS "$SERVER_USER@$SERVER_IP" << 'REMOTE_EOF'
    set -e
    APP_DIR="/opt/calculator"
    APP_PORT="6006"
    VENV_NAME="calculator_venv"
    SERVICE_NAME="calculator.service"
    
    # Ensure directory exists and has proper ownership
    sudo mkdir -p "$APP_DIR"
    sudo chown -R ubuntu:ubuntu "$APP_DIR"
    
    cd "$APP_DIR"
    
    echo "📦 Installing system dependencies..."
    sudo apt-get update -qq
    sudo apt-get install -y python3 python3-pip python3-venv > /dev/null 2>&1 || true
    
    VENV_DIR="$APP_DIR/$VENV_NAME"
    VENV_REQUIREMENTS="$VENV_DIR/requirements.txt"
    
    # Check if virtual environment exists and if requirements have changed
    RECREATE_VENV=false
    
    if [ ! -d "$VENV_DIR" ]; then
        echo "🐍 Virtual environment not found. Creating new virtual environment..."
        RECREATE_VENV=true
    else
        echo "🔍 Checking if requirements have changed..."
        if [ ! -f "$VENV_REQUIREMENTS" ]; then
            echo "⚠️  Requirements file not found in venv. Recreating virtual environment..."
            RECREATE_VENV=true
        elif ! cmp -s "$APP_DIR/requirements.txt" "$VENV_REQUIREMENTS" > /dev/null 2>&1; then
            echo "📝 Requirements file has changed. Recreating virtual environment..."
            RECREATE_VENV=true
        else
            echo "✅ Virtual environment exists and requirements are unchanged."
            echo "📥 Upgrading pip and checking for dependency updates..."
            "$VENV_DIR/bin/pip" install --upgrade pip --quiet
            "$VENV_DIR/bin/pip" install -r "$APP_DIR/requirements.txt" --quiet --upgrade
        fi
    fi
    
    if [ "$RECREATE_VENV" = true ]; then
        # Remove old venv if it exists
        if [ -d "$VENV_DIR" ]; then
            echo "🗑️  Removing old virtual environment..."
            rm -rf "$VENV_DIR"
        fi
        
        echo "🐍 Creating new virtual environment: $VENV_NAME..."
        python3 -m venv "$VENV_DIR"
        
        echo "📥 Installing Python dependencies..."
        "$VENV_DIR/bin/pip" install --upgrade pip --quiet
        "$VENV_DIR/bin/pip" install -r "$APP_DIR/requirements.txt" --quiet
        
        echo "📋 Copying requirements.txt into virtual environment for future comparison..."
        cp "$APP_DIR/requirements.txt" "$VENV_REQUIREMENTS"
        echo "✅ Virtual environment created and requirements file saved."
    fi
    
    echo "📝 Using production app runner from repository..."
    # The run_production.py file is already in the repo and will be deployed
    # It's configured to use 127.0.0.1 (localhost) by default for AppManager proxy compatibility
    
    echo "⚙️  Creating systemd service..."
    # Set Feature Requestor URL - use direct port access (domain:port model)
    FEATURE_REQUESTOR_PORT="${FEATURE_REQUESTOR_PORT:-6003}"
    FEATURE_REQUESTOR_URL="${FEATURE_REQUESTOR_URL:-http://${SERVER_DOMAIN}:${FEATURE_REQUESTOR_PORT}}"
    SERVER_DOMAIN="${SERVER_DOMAIN:-blackgrid.ddns.net}"
    SERVER_IP="${SERVER_IP:-40.233.70.245}"
    
    sudo tee /etc/systemd/system/$SERVICE_NAME > /dev/null << SERVICEEOF
[Unit]
Description=Real Estate Investment Calculator
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=$APP_DIR
Environment="PATH=$APP_DIR/$VENV_NAME/bin"
Environment="PORT=$APP_PORT"
Environment="FEATURE_REQUESTOR_URL=$FEATURE_REQUESTOR_URL"
Environment="SERVER_DOMAIN=$SERVER_DOMAIN"
Environment="SERVER_IP=$SERVER_IP"
ExecStart=$APP_DIR/$VENV_NAME/bin/python $APP_DIR/run_production.py
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
    echo "🔓 Configuring firewall to allow external access on port $APP_PORT..."
    
    # Ensure firewall allows the app port
    sudo ufw allow $APP_PORT/tcp > /dev/null 2>&1 || true
    
    echo ""
    echo "✅ Local firewall (UFW) configured!"
    echo ""
    echo "🌐 Attempting to configure Oracle Cloud Security Lists..."
    
    # Check if OCI CLI is available
    if command -v oci > /dev/null 2>&1; then
        echo "   ✅ OCI CLI found"
        
        # Check if OCI config exists
        if [ -f ~/.oci/config ]; then
            echo "   ✅ OCI config found"
            
            # Try to find the security list for this instance
            INSTANCE_OCID=$(curl -s http://169.254.169.254/opc/v2/instance/id 2>/dev/null || echo "")
            
            if [ -n "$INSTANCE_OCID" ]; then
                echo "   ✅ Found instance OCID: $INSTANCE_OCID"
                
                # Get VNIC and subnet information
                VNIC_OCID=$(oci compute instance list-vnics --instance-id "$INSTANCE_OCID" --query 'data[0].id' --raw-output 2>/dev/null || echo "")
                
                if [ -n "$VNIC_OCID" ]; then
                    SUBNET_OCID=$(oci network vnic get --vnic-id "$VNIC_OCID" --query 'data.subnet-id' --raw-output 2>/dev/null || echo "")
                    
                    if [ -n "$SUBNET_OCID" ]; then
                        SECURITY_LIST_OCID=$(oci network subnet get --subnet-id "$SUBNET_OCID" --query 'data."security-list-ids"[0]' --raw-output 2>/dev/null || echo "")
                        
                        if [ -n "$SECURITY_LIST_OCID" ]; then
                            echo "   ✅ Found security list: $SECURITY_LIST_OCID"
                            
                            # Check if rule already exists
                            EXISTING_RULE=$(oci network security-list get --security-list-id "$SECURITY_LIST_OCID" \
                                --query "data.\"ingress-security-rules\"[?contains(description, 'Calculator App') && \"tcp-options\".\"destination-port-range\".min==\`$APP_PORT\` && \"tcp-options\".\"destination-port-range\".max==\`$APP_PORT\`]" \
                                --raw-output 2>/dev/null || echo "")
                            
                            if [ -z "$EXISTING_RULE" ] || [ "$EXISTING_RULE" = "[]" ]; then
                                echo "   📝 Adding ingress rule for port $APP_PORT..."
                                
                                # Create a temporary file with updated rules
                                TEMP_RULES_FILE=$(mktemp)
                                export APP_PORT
                                
                                # Get current security list and add new rule using Python
                                oci network security-list get --security-list-id "$SECURITY_LIST_OCID" \
                                    --query 'data."ingress-security-rules"' --raw-output 2>/dev/null | \
                                    python3 -c "
import sys, json, os
port = int(os.environ.get('APP_PORT', 6006))
try:
    rules = json.load(sys.stdin)
    if not isinstance(rules, list):
        rules = []
    # Add new rule
    new_rule = {
        'protocol': '6',
        'source': '0.0.0.0/0',
        'isStateless': False,
        'description': f'Calculator App - Port {port}',
        'tcpOptions': {
            'destinationPortRange': {'min': port, 'max': port}
        }
    }
    rules.append(new_rule)
    print(json.dumps(rules))
except Exception as e:
    # If parsing fails, create minimal rule set
    print(json.dumps([{
        'protocol': '6',
        'source': '0.0.0.0/0',
        'isStateless': False,
        'description': f'Calculator App - Port {port}',
        'tcpOptions': {
            'destinationPortRange': {'min': port, 'max': port}
        }
    }]))
" > "$TEMP_RULES_FILE" 2>/dev/null
                                
                                # Update security list
                                if [ -s "$TEMP_RULES_FILE" ] && \
                                   oci network security-list update --security-list-id "$SECURITY_LIST_OCID" \
                                   --ingress-security-rules file://"$TEMP_RULES_FILE" > /dev/null 2>&1; then
                                    echo "   ✅ Successfully added Oracle Cloud Security List rule for port $APP_PORT!"
                                    rm -f "$TEMP_RULES_FILE"
                                else
                                    echo "   ⚠️  Failed to update security list automatically"
                                    echo "   Please add the rule manually in Oracle Cloud Console"
                                    rm -f "$TEMP_RULES_FILE"
                                fi
                            else
                                echo "   ✅ Security list rule for port $APP_PORT already exists"
                            fi
                        else
                            echo "   ⚠️  Could not find security list OCID"
                        fi
                    else
                        echo "   ⚠️  Could not find subnet OCID"
                    fi
                else
                    echo "   ⚠️  Could not find VNIC OCID"
                fi
            else
                echo "   ⚠️  Could not get instance OCID from metadata service"
            fi
        else
            echo "   ⚠️  OCI config not found at ~/.oci/config"
            echo "   To enable automatic security list configuration:"
            echo "   1. Install OCI CLI: https://docs.oracle.com/en-us/iaas/Content/API/SDKDocs/cliinstall.htm"
            echo "   2. Configure: oci setup config"
        fi
    else
        echo "   ⚠️  OCI CLI not installed"
        echo "   To enable automatic security list configuration, install OCI CLI:"
        echo "   bash -c \"\$(curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh)\""
    fi
    
    echo ""
    echo "✅ Firewall configuration complete!"
    echo "   Application is accessible directly on port $APP_PORT"
    if ! command -v oci > /dev/null 2>&1 || [ ! -f ~/.oci/config ]; then
        echo "   ⚠️  Make sure Oracle Cloud Security Lists allow port $APP_PORT"
        echo "   (See manual instructions below if OCI CLI is not configured)"
    fi
REMOTE_EOF

echo ""
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "Application Details:"
echo "  - URL: http://$SERVER_IP:$APP_PORT"
echo "  - Service: $SERVICE_NAME"
echo "  - Port: $APP_PORT (same as local development)"
echo ""
echo "Useful Commands:"
echo "  - View logs: ssh $SERVER_USER@$SERVER_IP 'sudo journalctl -u $SERVICE_NAME -f'"
echo "  - Restart: ssh $SERVER_USER@$SERVER_IP 'sudo systemctl restart $SERVICE_NAME'"
echo "  - Stop: ssh $SERVER_USER@$SERVER_IP 'sudo systemctl stop $SERVICE_NAME'"
echo "  - Status: ssh $SERVER_USER@$SERVER_IP 'sudo systemctl status $SERVICE_NAME'"
echo ""
echo "⚠️  IMPORTANT: Make sure port $APP_PORT is accessible from the web!"
echo ""
echo "   The deploy script attempted to configure Oracle Cloud Security Lists automatically."
echo "   If OCI CLI is installed and configured on the server, the rule was added automatically."
echo ""
echo "   If you need to configure manually:"
echo "   1. Go to Networking → Virtual Cloud Networks"
echo "   2. Select your VCN → Security Lists"
echo "   3. Add Ingress Rule:"
echo "      - Source: 0.0.0.0/0"
echo "      - Protocol: TCP"
echo "      - Destination Port: $APP_PORT"
echo "      - Description: Calculator App"
echo ""
echo "   To enable automatic configuration in future deployments:"
echo "   - Install OCI CLI on the server: https://docs.oracle.com/en-us/iaas/Content/API/SDKDocs/cliinstall.htm"
echo "   - Configure OCI CLI: oci setup config"
echo ""
echo "   The app will be accessible at: http://$SERVER_IP:$APP_PORT"
echo "   (No nginx/HTTPS - direct port access for linking from other apps)"
echo ""

