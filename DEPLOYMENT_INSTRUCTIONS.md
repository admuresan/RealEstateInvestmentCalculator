# Deployment Instructions

## Prerequisites

1. **SSH Access**: Ensure you have the SSH private key (`ssh/ssh-key-2025-12-26.key`) with proper permissions (600)
2. **Server Access**: You should be able to SSH into the server at `40.233.70.245`
3. **rsync (optional)**: The script will use `rsync` if available for faster transfers, otherwise it will use `tar+scp` which works on all systems

## Deployment Steps

### 1. Run the Deployment Script

From your local machine, run:

```bash
chmod +x deploy.sh
./deploy.sh
```

This script will:
- Upload the application to `~/calculator` on the server
- Create a Python virtual environment
- Install dependencies
- Create a systemd service
- Start the application on port **5001**

### 1.5. Set Up HTTPS (Optional but Recommended)

If you have a domain name pointing to your server:

```bash
chmod +x setup_https.sh
./setup_https.sh your-domain.com
```

This will automatically configure nginx with SSL certificates from Let's Encrypt.

### 2. Make the Port Accessible from the Web

**✅ HTTPS is automatically configured!** The deployment script sets up:
- Self-signed SSL certificate
- Nginx reverse proxy with HTTPS
- Automatic HTTP to HTTPS redirect

**Configure Oracle Cloud Firewall:**

1. Log into Oracle Cloud Console
2. Navigate to **Networking** → **Virtual Cloud Networks**
3. Select your VCN
4. Go to **Security Lists**
5. Click on the security list for your subnet
6. Click **Add Ingress Rules**
7. Add rules for:
   - **Port 80** (HTTP) - Source: 0.0.0.0/0, Protocol: TCP
   - **Port 443** (HTTPS) - Source: 0.0.0.0/0, Protocol: TCP
   - Description: Calculator App
8. Click **Add Ingress Rules**

**Configure UFW Firewall (if needed):**

SSH into the server and run:

```bash
ssh -i ssh/ssh-key-2025-12-26.key ubuntu@40.233.70.245

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# If UFW is inactive, enable it
sudo ufw enable
```

Now you can access the app at:
- **HTTPS**: `https://40.233.70.245` (recommended)
- **HTTP**: `http://40.233.70.245` (automatically redirects to HTTPS)

**Note:** Browsers will show a security warning for the self-signed certificate. This is normal and safe for development/testing. Click "Advanced" → "Proceed to site" to continue.

#### Option A: Direct Port Access (When Ports 80/443 Are in Use)

If you need to access the app directly on port 5001 (e.g., when ports 80/443 are used by another app):

**Server-side firewall is already configured** - the deployment script automatically allows port 5001 in UFW.

**You MUST configure Oracle Cloud Security Rules:**

1. Log into Oracle Cloud Console
2. Navigate to **Networking** → **Virtual Cloud Networks**
3. Select your VCN → **Security Lists**
4. Click on the security list for your subnet
5. Click **Add Ingress Rules**
6. Add rule:
   - **Source Type**: CIDR
   - **Source CIDR**: `0.0.0.0/0`
   - **IP Protocol**: TCP
   - **Destination Port Range**: `5001`
   - **Description**: `Calculator App Direct Access`
7. Click **Add Ingress Rules**

Then access your app at: `http://40.233.70.245:5001`

**Note:** The Flask app is already configured to bind to `0.0.0.0:5001`, so it's accessible externally once the Oracle Cloud rule is added.

#### Option B: Upgrade to Let's Encrypt Certificate (Recommended for Production)

The deployment automatically sets up HTTPS with a self-signed certificate. If you have a domain name, you can upgrade to a trusted Let's Encrypt certificate (no browser warnings).

**1. Install Nginx and Certbot:**

SSH into the server:

```bash
ssh -i ssh/ssh-key-2025-12-26.key ubuntu@40.233.70.245

# Install nginx and certbot if not already installed
sudo apt-get update
sudo apt-get install -y nginx certbot python3-certbot-nginx
```

**2. Create Initial Nginx Configuration (HTTP only, for certificate setup):**

```bash
sudo nano /etc/nginx/sites-available/calculator
```

Add the following configuration (replace `your-domain.com` with your actual domain, or use the IP for IP-based access):

```nginx
server {
    listen 80;
    server_name your-domain.com 40.233.70.245;

    location / {
        proxy_pass http://127.0.0.1:5001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support (if needed in future)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

**3. Enable the Site and Test:**

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/calculator /etc/nginx/sites-enabled/

# Remove default nginx site if it conflicts
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

**4. Set Up SSL Certificate with Let's Encrypt:**

**If you have a domain name:**

```bash
# Request SSL certificate (replace your-domain.com with your actual domain)
sudo certbot --nginx -d your-domain.com

# Follow the prompts:
# - Enter your email address
# - Agree to terms of service
# - Choose whether to redirect HTTP to HTTPS (recommended: Yes)
```

Certbot will automatically:
- Obtain the SSL certificate
- Update your nginx configuration to use HTTPS
- Set up automatic renewal

**If you only have an IP address (no domain):**

You cannot use Let's Encrypt with just an IP address. You have two options:

1. **Use self-signed certificate** (browsers will show a warning):
```bash
# Generate self-signed certificate
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/calculator-selfsigned.key \
    -out /etc/ssl/certs/calculator-selfsigned.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=40.233.70.245"

# Update nginx config manually (see step 5)
```

2. **Use a domain name** - Get a free domain from services like Freenom, or use a subdomain from a domain you own.

**5. Final Nginx Configuration (with HTTPS):**

After certbot runs, your nginx config will be automatically updated. If you're using a self-signed certificate or want to customize, here's the full HTTPS configuration:

```nginx
# HTTP server - redirect to HTTPS
server {
    listen 80;
    server_name your-domain.com 40.233.70.245;
    
    # Redirect all HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name your-domain.com 40.233.70.245;

    # SSL certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # Or for self-signed:
    # ssl_certificate /etc/ssl/certs/calculator-selfsigned.crt;
    # ssl_certificate_key /etc/ssl/private/calculator-selfsigned.key;

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
        proxy_pass http://127.0.0.1:5001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support (if needed in future)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

**6. Configure Firewall:**

```bash
# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Verify firewall status
sudo ufw status
```

**7. Configure Oracle Cloud Firewall:**

Allow ports 80 (HTTP) and 443 (HTTPS) in Oracle Cloud Console:
1. Go to **Networking** → **Virtual Cloud Networks**
2. Select your VCN → **Security Lists**
3. Add Ingress Rules for:
   - **Port 80** (HTTP) - Source: 0.0.0.0/0
   - **Port 443** (HTTPS) - Source: 0.0.0.0/0

**8. Test HTTPS:**

- With domain: `https://your-domain.com`
- With IP (if using self-signed): `https://40.233.70.245` (browser will show warning)

**9. Set Up Automatic Certificate Renewal:**

Let's Encrypt certificates expire every 90 days. Certbot sets up automatic renewal, but verify it's working:

```bash
# Test renewal
sudo certbot renew --dry-run

# Check renewal timer
sudo systemctl status certbot.timer
```

The certificate will be automatically renewed before expiration.

## Managing the Application

### View Logs

```bash
ssh -i ssh/ssh-key-2025-12-26.key ubuntu@40.233.70.245
sudo journalctl -u calculator.service -f
```

### Restart the Application

```bash
ssh -i ssh/ssh-key-2025-12-26.key ubuntu@40.233.70.245
sudo systemctl restart calculator.service
```

### Stop the Application

```bash
ssh -i ssh/ssh-key-2025-12-26.key ubuntu@40.233.70.245
sudo systemctl stop calculator.service
```

### Check Application Status

```bash
ssh -i ssh/ssh-key-2025-12-26.key ubuntu@40.233.70.245
sudo systemctl status calculator.service
```

### Update the Application

To update the application after making changes:

```bash
# Run the deployment script again
./deploy.sh

# Or manually update:
ssh -i ssh/ssh-key-2025-12-26.key ubuntu@40.233.70.245
cd ~/calculator
git pull  # if using git
# Or upload new files
sudo systemctl restart calculator.service
```

## Troubleshooting

### Application Not Starting

1. Check service status:
   ```bash
   sudo systemctl status calculator.service
   ```

2. Check logs:
   ```bash
   sudo journalctl -u calculator.service -n 50
   ```

3. Verify port is not in use:
   ```bash
   sudo netstat -tuln | grep 5001
   ```

4. Check Python and dependencies:
   ```bash
   cd ~/calculator
   ./venv/bin/python --version
   ./venv/bin/pip list
   ```

### Port Already in Use

If port 5001 is already in use, you can change it:

1. Edit the service file:
   ```bash
   sudo nano /etc/systemd/system/calculator.service
   ```
   Change `Environment="PORT=5001"` to a different port (e.g., 5002)

2. Reload and restart:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl restart calculator.service
   ```

3. Update firewall rules for the new port.

### Cannot Access from Web

1. **Check firewall:**
   ```bash
   sudo ufw status
   ```

2. **Check if app is running:**
   ```bash
   curl http://localhost:5001
   ```

3. **Check Oracle Cloud Security Lists** (as described above)

4. **Test from server:**
   ```bash
   curl http://40.233.70.245:5001
   ```

## Notes

- The application runs on port **5001** to avoid conflicts with other services
- The application is isolated in its own directory (`~/calculator`) and virtual environment
- The systemd service automatically restarts the application if it crashes
- Logs are managed by systemd and can be viewed with `journalctl`

