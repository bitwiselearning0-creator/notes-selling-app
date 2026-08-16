import os
import sys
import paramiko

HOST = "50.6.44.186"
USER = "root"
PASSWORD = "Rootforhost@9124"
DOMAIN = "bitwiselearning.online"
LOCAL_DIST = "/Users/akhalaq/Programming/Notes Selling App/dist"
REMOTE_DIR = "/var/www/bitwise-learning"

print("🚀 Starting Bitwise Learning Deployment to Bluehost VPS...", flush=True)
print(f"Target: {USER}@{HOST} ({DOMAIN})", flush=True)

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(HOST, username=USER, password=PASSWORD, timeout=15)
    print("✅ SSH Connected successfully!", flush=True)
except Exception as e:
    print(f"❌ Failed to connect SSH: {e}", flush=True)
    sys.exit(1)

def run_cmd(cmd):
    print(f"➜ Running: {cmd}", flush=True)
    stdin, stdout, stderr = client.exec_command(f"export DEBIAN_FRONTEND=noninteractive; {cmd}")
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out.strip():
        print(f"[STDOUT]\n{out.strip()}", flush=True)
    if err.strip():
        print(f"[STDERR]\n{err.strip()}", flush=True)
    return out, err

# 1. Update APT & Install Nginx + Certbot
print("\n📦 Step 1: Installing Nginx & Certbot on VPS...", flush=True)
run_cmd("apt-get update -y && apt-get install -y nginx certbot python3-certbot-nginx")

# 2. Create Remote Web Root Directory
print("\n📁 Step 2: Preparing web root directory...", flush=True)
run_cmd(f"mkdir -p {REMOTE_DIR}")

# 3. SFTP Upload Static Files & Backend Server Files (Skipping node_modules for 100x ultra-fast deployment)
print("\n⬆️ Step 3: Uploading static dist files and backend server code to VPS...", flush=True)
sftp = client.open_sftp()

def upload_dir(local_path, remote_path):
    try:
        sftp.mkdir(remote_path)
    except IOError:
        pass

    for item in os.listdir(local_path):
        if item in ['node_modules', '.git', '.DS_Store', 'dist']:
            continue
        l_item = os.path.join(local_path, item)
        r_item = os.path.join(remote_path, item).replace("\\", "/")
        if os.path.isdir(l_item):
            upload_dir(l_item, r_item)
        else:
            print(f"   Uploading {item}...", flush=True)
            sftp.put(l_item, r_item)

upload_dir(LOCAL_DIST, REMOTE_DIR)

LOCAL_SERVER = "/Users/akhalaq/Programming/Notes Selling App/server"
REMOTE_SERVER = "/var/www/bitwise-backend"
print("\n⚙️ Uploading backend server API to /var/www/bitwise-backend...", flush=True)
upload_dir(LOCAL_SERVER, REMOTE_SERVER)

if os.path.exists("bitwise-learning.apk"):
    print("   Uploading bitwise-learning.apk...", flush=True)
    sftp.put("bitwise-learning.apk", f"{REMOTE_DIR}/bitwise-learning.apk")
sftp.close()
print("✅ All static assets and backend server files uploaded successfully!", flush=True)

# 4. Create Nginx Configuration
print("\n⚙️ Step 4: Configuring Nginx for React SPA...", flush=True)
nginx_config = f"""server {{
    listen 80;
    server_name {DOMAIN} www.{DOMAIN};

    root {REMOTE_DIR};
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    client_max_body_size 200M;

    # Cloudflare Real IP Header Restoration
    set_real_ip_from 103.21.244.0/22;
    set_real_ip_from 103.22.200.0/22;
    set_real_ip_from 103.31.4.0/22;
    set_real_ip_from 104.16.0.0/13;
    set_real_ip_from 104.24.0.0/14;
    set_real_ip_from 108.162.192.0/18;
    set_real_ip_from 131.0.72.0/22;
    set_real_ip_from 141.101.64.0/18;
    set_real_ip_from 162.158.0.0/15;
    set_real_ip_from 172.64.0.0/13;
    set_real_ip_from 173.245.48.0/21;
    set_real_ip_from 188.114.96.0/20;
    set_real_ip_from 190.93.240.0/20;
    set_real_ip_from 197.234.240.0/22;
    set_real_ip_from 198.41.128.0/17;
    real_ip_header CF-Connecting-IP;

    location / {{
        try_files $uri $uri/ /index.html;
    }}

    location /api/ {{
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }}

    location /assets/ {{
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }}

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval';" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
}}
"""

run_cmd(f"cat << 'EOF' > /etc/nginx/sites-available/bitwise-learning\n{nginx_config}\nEOF")
run_cmd("rm -f /etc/nginx/sites-enabled/default")
run_cmd("ln -sf /etc/nginx/sites-available/bitwise-learning /etc/nginx/sites-enabled/bitwise-learning")

# 5. Restart Backend PM2 Process & Reload Nginx
print("\n🛡️ Step 5: Restarting Backend API Node process & Reloading Nginx...", flush=True)
run_cmd("cd /var/www/bitwise-backend && npm install --omit=dev || true")
run_cmd("pm2 restart all || pm2 start /var/www/bitwise-backend/index.js --name bitwise-backend")
run_cmd("ufw allow 80/tcp; ufw allow 443/tcp; ufw allow 'Nginx Full' || true")
run_cmd("nginx -t")
run_cmd("systemctl reload nginx")

# 6. Issue Certbot SSL Certificate
print("\n🔒 Step 6: Setting up Free SSL Certificate via Certbot...", flush=True)
run_cmd(f"certbot --nginx --non-interactive --agree-tos -m bitwiselearning0@gmail.com -d {DOMAIN} -d www.{DOMAIN} || echo 'Certbot will issue SSL once DNS finishes propagating.'")

client.close()
print("\n🎉 ALL DEPLOYMENT STEPS COMPLETED!", flush=True)
