# Quick Deployment Guide

## One-Command Deployment

```bash
./deploy.sh
```

This will deploy the calculator app to `40.233.70.245` on port **5001**.

## Make Port Accessible

**✅ HTTPS is automatically configured!** The deployment script sets up HTTPS with a self-signed certificate.

**Configure Oracle Cloud Console:**
1. Go to Networking → Virtual Cloud Networks
2. Select your VCN → Security Lists
3. Add Ingress Rules:
   - **Port 80** (HTTP) - Source: 0.0.0.0/0
   - **Port 443** (HTTPS) - Source: 0.0.0.0/0

**Access at:**
- **HTTPS**: `https://40.233.70.245` ✅ (recommended)
- **HTTP**: `http://40.233.70.245` (redirects to HTTPS)

**Note:** Browsers will show a security warning for self-signed certificates. Click "Advanced" → "Proceed" to continue.

### Upgrade to Let's Encrypt Certificate (Optional)

**If you have a domain name pointing to your server:**

```bash
# Run the HTTPS upgrade script
./setup_https.sh your-domain.com
```

This will:
- Replace self-signed certificate with Let's Encrypt
- Remove browser security warnings
- Set up automatic renewal

**Access at:** `https://your-domain.com` (no browser warnings!)

**Note:** HTTPS with self-signed certificate is already set up automatically. This step is only needed if you want a trusted certificate without browser warnings.

## Useful Commands

```bash
# View logs
ssh -i ssh/ssh-key-2025-12-26.key ubuntu@40.233.70.245 'sudo journalctl -u calculator.service -f'

# Restart app
ssh -i ssh/ssh-key-2025-12-26.key ubuntu@40.233.70.245 'sudo systemctl restart calculator.service'

# Check status
ssh -i ssh/ssh-key-2025-12-26.key ubuntu@40.233.70.245 'sudo systemctl status calculator.service'
```

For detailed instructions, see `DEPLOYMENT_INSTRUCTIONS.md`.

