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

# 3. SFTP Upload Static Files
print("\n⬆️ Step 3: Uploading static dist files to VPS...", flush=True)
sftp = client.open_sftp()

def upload_dir(local_path, remote_path):
    try:
        sftp.mkdir(remote_path)
    except IOError:
        pass

    for item in os.listdir(local_path):
        l_item = os.path.join(local_path, item)
        r_item = os.path.join(remote_path, item).replace("\\", "/")
        if os.path.isdir(l_item):
            upload_dir(l_item, r_item)
        else:
            print(f"   Uploading {item}...", flush=True)
            sftp.put(l_item, r_item)

upload_dir(LOCAL_DIST, REMOTE_DIR)
sftp.close()
print("✅ All static assets uploaded successfully!", flush=True)

# 4. Create Nginx Configuration
print("\n⚙️ Step 4: Configuring Nginx for React SPA...", flush=True)
nginx_config = f"""server {{
    listen 80;
    server_name {DOMAIN} www.{DOMAIN};

    root {REMOTE_DIR};
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

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

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";
}}
"""

run_cmd(f"cat << 'EOF' > /etc/nginx/sites-available/bitwise-learning\n{nginx_config}\nEOF")
run_cmd("rm -f /etc/nginx/sites-enabled/default")
run_cmd("ln -sf /etc/nginx/sites-available/bitwise-learning /etc/nginx/sites-enabled/bitwise-learning")

# 5. Open UFW / Firewall Ports & Restart Nginx
print("\n🛡️ Step 5: Configuring Firewall & Reloading Nginx...", flush=True)
run_cmd("ufw allow 80/tcp; ufw allow 443/tcp; ufw allow 'Nginx Full' || true")
run_cmd("nginx -t")
run_cmd("systemctl restart nginx")

# 6. Issue Certbot SSL Certificate
print("\n🔒 Step 6: Setting up Free SSL Certificate via Certbot...", flush=True)
run_cmd(f"certbot --nginx --non-interactive --agree-tos -m bitwiselearning0@gmail.com -d {DOMAIN} -d www.{DOMAIN} || echo 'Certbot will issue SSL once DNS finishes propagating.'")

client.close()
print("\n🎉 ALL DEPLOYMENT STEPS COMPLETED!", flush=True)
