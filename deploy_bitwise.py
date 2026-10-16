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

CYBERPANEL_DIR = f"/home/{DOMAIN}/public_html"

print("\n📦 Step 1: Preparing web root directories on VPS...", flush=True)
run_cmd(f"mkdir -p {REMOTE_DIR} {CYBERPANEL_DIR}")

# SFTP Upload Static Files & Backend Server Files
print("\n⬆️ Step 2: Uploading static dist files and backend server code to VPS...", flush=True)
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
upload_dir(LOCAL_DIST, CYBERPANEL_DIR)

LOCAL_SERVER = "/Users/akhalaq/Programming/Notes Selling App/server"
REMOTE_SERVER = "/var/www/bitwise-backend"
print("\n⚙️ Uploading backend server API to /var/www/bitwise-backend...", flush=True)
upload_dir(LOCAL_SERVER, REMOTE_SERVER)

if os.path.exists("bitwise-learning.apk"):
    print("   Uploading bitwise-learning.apk...", flush=True)
    sftp.put("bitwise-learning.apk", f"{REMOTE_DIR}/bitwise-learning.apk")
    sftp.put("bitwise-learning.apk", f"{CYBERPANEL_DIR}/bitwise-learning.apk")
sftp.close()
print("✅ All static assets and backend server files uploaded successfully!", flush=True)

# Step 3: Configure OpenLiteSpeed / CyberPanel .htaccess and permissions
print("\n⚙️ Step 3: Configuring CyberPanel/OpenLiteSpeed .htaccess and permissions...", flush=True)
htaccess_config = """RewriteEngine On
RewriteBase /

# Force HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Exclude API from SPA rewrite
RewriteRule ^api - [L]

# SPA Fallback for React
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]
"""
run_cmd(f"cat << 'EOF' > {CYBERPANEL_DIR}/.htaccess\n{htaccess_config}\nEOF")
run_cmd(f"chmod 755 {CYBERPANEL_DIR} && find {CYBERPANEL_DIR} -type d -exec chmod 755 {{}} + && find {CYBERPANEL_DIR} -type f -exec chmod 644 {{}} +")
run_cmd(f"chown -R bitwi2915:nogroup {CYBERPANEL_DIR}")
run_cmd(f"rm -rf {CYBERPANEL_DIR}/uploads && ln -s {REMOTE_DIR}/uploads {CYBERPANEL_DIR}/uploads && chown -h bitwi2915:nogroup {CYBERPANEL_DIR}/uploads")

# Step 4: Restart Backend PM2 Process & Reload OpenLiteSpeed
print("\n🛡️ Step 4: Restarting Backend API Node process & Reloading OpenLiteSpeed...", flush=True)
run_cmd("cd /var/www/bitwise-backend && npm install --omit=dev || true")
run_cmd("pm2 restart all || pm2 start /var/www/bitwise-backend/index.js --name bitwise-backend")
run_cmd("/usr/local/lsws/bin/lswsctrl restart || systemctl reload lsws || true")

client.close()
print("\n🎉 ALL DEPLOYMENT STEPS COMPLETED!", flush=True)

