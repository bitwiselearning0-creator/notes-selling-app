import os
import sys
import paramiko

HOST = "50.6.44.186"
USER = "root"
PASSWORD = "Rootforhost@9124"
DOMAIN = "bitwiselearning.online"
LOCAL_SERVER_DIR = "/Users/akhalaq/Programming/Notes Selling App/server"
REMOTE_SERVER_DIR = "/var/www/bitwise-backend"
REMOTE_WEB_DIR = "/var/www/bitwise-learning"

print("🚀 Starting Complete VPS Backend & PostgreSQL Setup...", flush=True)
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

# 1. Install Node.js, npm, PostgreSQL & PM2
print("\n📦 Step 1: Installing PostgreSQL & PM2 on VPS...", flush=True)
run_cmd("apt-get update -y && apt-get install -y postgresql postgresql-contrib")
run_cmd("npm install -g pm2 || true")

# 2. Configure PostgreSQL Database
print("\n🗄️ Step 2: Configuring PostgreSQL database (bitwise_db)...", flush=True)
run_cmd("systemctl start postgresql && systemctl enable postgresql")
run_cmd("su - postgres -c \"psql -c \\\"CREATE USER bitwise_admin WITH SUPERUSER PASSWORD 'BitwisePass2026!';\\\"\" || true")
run_cmd("su - postgres -c \"psql -c \\\"ALTER USER bitwise_admin WITH SUPERUSER PASSWORD 'BitwisePass2026!';\\\"\" || true")
run_cmd("su - postgres -c \"psql -c \\\"CREATE DATABASE bitwise_db OWNER bitwise_admin;\\\"\" || true")
run_cmd("su - postgres -c \"psql -d bitwise_db -c \\\"CREATE EXTENSION IF NOT EXISTS \\\\\\\"uuid-ossp\\\\\\\";\\\"\" || true")

# 3. Upload Server Backend Files
print("\n⬆️ Step 3: Uploading Express Backend Code to VPS...", flush=True)
run_cmd(f"mkdir -p {REMOTE_SERVER_DIR}")

sftp = client.open_sftp()
for file_name in ["package.json", "schema.sql", "db.js", "authController.js", "catalogController.js", "index.js", "seed.js"]:
    local_path = os.path.join(LOCAL_SERVER_DIR, file_name)
    remote_path = os.path.join(REMOTE_SERVER_DIR, file_name)
    if os.path.exists(local_path):
        print(f"   Uploading {file_name}...", flush=True)
        sftp.put(local_path, remote_path)
sftp.close()

# 4. Apply Database Schema & Seed Catalog Data
print("\n📜 Step 4: Applying PostgreSQL Schema & Seeding Initial Data...", flush=True)
run_cmd(f"su - postgres -c \"psql -d bitwise_db -f {REMOTE_SERVER_DIR}/schema.sql\"")

# 5. Install Dependencies, Seed DB & Start Server with PM2
print("\n⚡ Step 5: Installing npm modules, seeding database & launching backend API...", flush=True)
run_cmd(f"cd {REMOTE_SERVER_DIR} && npm install --production")
run_cmd(f"cd {REMOTE_SERVER_DIR} && node seed.js")
run_cmd("pm2 delete bitwise-api || true")
run_cmd(f"cd {REMOTE_SERVER_DIR} && pm2 start index.js --name bitwise-api")
run_cmd("pm2 save")

# 6. Configure Nginx Reverse Proxy for /api
print("\n⚙️ Step 6: Updating Nginx configuration with /api reverse proxy...", flush=True)
nginx_config = f"""server {{
    listen 80;
    server_name {DOMAIN} www.{DOMAIN};

    root {REMOTE_WEB_DIR};
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
run_cmd("nginx -t")
run_cmd("systemctl restart nginx")

# 7. Test Backend Health Check
print("\n🧪 Step 7: Testing VPS Backend Health Check...", flush=True)
run_cmd("curl -s http://127.0.0.1:5000/api/health")

client.close()
print("\n🎉 COMPLETE VPS BACKEND & DATABASE SETUP FINISHED SUCCESSFULLY!", flush=True)
