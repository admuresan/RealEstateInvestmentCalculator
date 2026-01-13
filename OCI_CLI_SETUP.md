# OCI CLI Setup Guide

This guide explains how to set up Oracle Cloud Infrastructure (OCI) CLI to enable automatic security list configuration during deployment.

## Prerequisites

- An Oracle Cloud account
- Access to the Oracle Cloud Console
- Administrator permissions (or permissions to manage security lists)

## Step 1: Get Your OCI Credentials

### Option A: Using API Keys (Recommended)

1. **Log into Oracle Cloud Console**
   - Go to https://cloud.oracle.com
   - Sign in with your Oracle Cloud account

2. **Navigate to User Settings**
   - Click on your user profile icon (top right)
   - Select **User Settings**

3. **Generate API Key**
   - In the left sidebar, click **API Keys**
   - Click **Add API Key**
   - Select **Paste Public Key** (you'll generate this in the next step)
   - Or select **Generate API Key Pair** to download a key pair

4. **Generate SSH Key Pair (if using "Paste Public Key")**
   ```bash
   # On your local machine or server
   ssh-keygen -t rsa -N "" -b 2048 -C "oci-api-key" -f ~/.oci/oci_api_key
   
   # This creates:
   # - ~/.oci/oci_api_key (private key - keep secret!)
   # - ~/.oci/oci_api_key.pub (public key - paste this in console)
   ```

5. **Copy the Public Key**
   - If you generated a key pair, copy the contents of `~/.oci/oci_api_key.pub`
   - Paste it into the Oracle Cloud Console dialog
   - Click **Add**

6. **Save the Configuration**
   - Oracle Cloud will show you a configuration snippet like:
     ```
     [DEFAULT]
     user=ocid1.user.oc1..aaaaaaa...
     fingerprint=aa:bb:cc:dd:ee:ff:...
     tenancy=ocid1.tenancy.oc1..aaaaaaa...
     region=us-ashburn-1
     key_file=~/.oci/oci_api_key
     ```
   - **Save this information** - you'll need it for OCI CLI setup

### Option B: Using Instance Principal (For Running on the Server)

If you're running the OCI CLI directly on the Oracle Cloud instance, you can use Instance Principal authentication (no credentials needed):

1. **Create Dynamic Group**
   - Go to **Identity & Security** → **Dynamic Groups**
   - Click **Create Dynamic Group**
   - Name: `calculator-instance-principal`
   - Rule: `instance.id = 'ocid1.instance.oc1...'` (your instance OCID)
   - Click **Create**

2. **Create Policy**
   - Go to **Identity & Security** → **Policies**
   - Click **Create Policy**
   - Name: `calculator-security-list-policy`
   - Policy statements:
     ```
     Allow dynamic-group calculator-instance-principal to manage security-lists in compartment <your-compartment>
     Allow dynamic-group calculator-instance-principal to read vnics in compartment <your-compartment>
     Allow dynamic-group calculator-instance-principal to read subnets in compartment <your-compartment>
     ```
   - Click **Create**

3. **Use Instance Principal in OCI CLI**
   - When running `oci setup config`, select **Instance Principal** authentication
   - No API keys needed!

## Step 2: Get Your Tenancy and User OCIDs

1. **Tenancy OCID**
   - Go to **Administration** → **Tenancy Details**
   - Copy the **OCID** (starts with `ocid1.tenancy.oc1..`)

2. **User OCID**
   - Go to **Identity & Security** → **Users**
   - Click on your username
   - Copy the **OCID** (starts with `ocid1.user.oc1..`)

3. **Region**
   - Note your region (e.g., `us-ashburn-1`, `us-phoenix-1`, `eu-frankfurt-1`)
   - You can see this in the top right of the console

## Step 3: Install OCI CLI on the Server

SSH into your server and run:

```bash
# Install OCI CLI
bash -c "$(curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh)"

# Follow the prompts:
# - Installation directory: Press Enter for default (/home/ubuntu/bin)
# - Add to PATH: Yes
# - Run oci setup config: Yes (or run manually after)
```

## Step 4: Configure OCI CLI

### If Using API Keys:

```bash
# Run the setup command
oci setup config

# You'll be prompted for:
# - Location of config file: Press Enter (default: ~/.oci/config)
# - User OCID: Paste your user OCID from Step 2
# - Tenancy OCID: Paste your tenancy OCID from Step 2
# - Region: Enter your region (e.g., us-ashburn-1)
# - Generate API key: No (you already have one)
# - Enter location of private key: ~/.oci/oci_api_key (or path to your private key)
# - Passphrase: Press Enter (if your key has no passphrase)
```

### If Using Instance Principal:

```bash
# Create config file
mkdir -p ~/.oci
cat > ~/.oci/config << EOF
[DEFAULT]
authentication_type=instance_principal
EOF
```

## Step 5: Verify Configuration

Test your OCI CLI setup:

```bash
# Test authentication
oci iam region list

# If successful, you should see a list of regions
# If it fails, check your credentials and permissions
```

## Step 6: Verify Permissions

Make sure your user has the necessary permissions:

1. Go to **Identity & Security** → **Policies**
2. Find policies that apply to your user/group
3. Ensure you have permissions like:
   ```
   Allow group <your-group> to manage security-lists in compartment <your-compartment>
   Allow group <your-group> to read vnics in compartment <your-compartment>
   Allow group <your-group> to read subnets in compartment <your-compartment>
   ```

If you don't have these permissions, contact your Oracle Cloud administrator.

## Troubleshooting

### "NotAuthenticated" Error
- Check that your API key is correct
- Verify the fingerprint matches in Oracle Cloud Console
- Ensure the private key file path is correct

### "NotAuthorized" Error
- Your user needs permissions to manage security lists
- Contact your administrator to add the necessary policies

### "Instance Principal Not Available"
- Make sure you're running on an Oracle Cloud instance
- Verify the dynamic group and policies are set up correctly

## Security Notes

- **Never share your private API key** - it's like a password
- Keep your `~/.oci/oci_api_key` file secure (chmod 600)
- Consider using Instance Principal when running on Oracle Cloud instances
- Rotate API keys periodically for security

## Quick Reference

**Config file location:** `~/.oci/config`  
**Private key location:** `~/.oci/oci_api_key` (or custom path)  
**Test command:** `oci iam region list`  
**View config:** `cat ~/.oci/config`


