#!/usr/bin/env bash
# ==============================================================================
# Bitwise Learning - Bluehost VPS Automated Deployment Script
# ==============================================================================

set -e

# Configured Target Details
VPS_IP=${VPS_IP:-"50.6.44.186"}
DOMAIN_NAME=${DOMAIN_NAME:-"bitwiselearning.online"}
VPS_USER=${VPS_USER:-"root"}
REMOTE_DIR="/var/www/bitwise-learning"

echo "🚀 Bitwise Learning - Bluehost VPS Deployment Helper"
echo "----------------------------------------------------"
echo "📌 Target Server: ${VPS_USER}@${VPS_IP}"
echo "📌 Target Domain: ${DOMAIN_NAME}"
echo "📌 Remote Directory: ${REMOTE_DIR}"
echo "----------------------------------------------------"

echo "📦 1. Creating target directory on VPS & Uploading build files..."
ssh -o StrictHostKeyChecking=accept-new ${VPS_USER}@${VPS_IP} "mkdir -p ${REMOTE_DIR}"
scp -r ./dist/* ${VPS_USER}@${VPS_IP}:${REMOTE_DIR}/

echo "⚙️ 2. Installing Nginx (if needed) & Configuring Web Server..."
ssh ${VPS_USER}@${VPS_IP} "sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx 2>/dev/null || sudo yum install -y nginx certbot python-certbot-nginx 2>/dev/null || true"

scp ./nginx.conf.template ${VPS_USER}@${VPS_IP}:/etc/nginx/sites-available/bitwise-learning

ssh ${VPS_USER}@${VPS_IP} << 'ENDSSH'
set -e
sudo mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled
sudo ln -sf /etc/nginx/sites-available/bitwise-learning /etc/nginx/sites-enabled/bitwise-learning
sudo ufw allow 80/tcp 2>/dev/null || true
sudo ufw allow 443/tcp 2>/dev/null || true
sudo nginx -t
sudo systemctl restart nginx || sudo service nginx restart
ENDSSH

echo "🔒 3. Generating Free SSL Certificate via Certbot..."
ssh ${VPS_USER}@${VPS_IP} "sudo certbot --nginx --non-interactive --agree-tos -m admin@${DOMAIN_NAME} -d ${DOMAIN_NAME} -d www.${DOMAIN_NAME} || echo '⚠️ Certbot SSL step skipped or requires manual confirmation if DNS is not yet propagated.'"

echo ""
echo "✅ Deployment completed!"
echo "🌐 Open https://${DOMAIN_NAME} in your browser once DNS has propagated."
