import paramiko
import sys

host = "50.6.44.186"
user = "root"
password = "Rootforhost@9124"

print(f"Connecting to {user}@{host}...")
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(host, username=user, password=password, timeout=10)
    print("✅ SSH Connection Successful!")
    
    stdin, stdout, stderr = client.exec_command("uname -a; cat /etc/os-release")
    print("--- OS Info ---")
    print(stdout.read().decode())
    
    client.close()
except Exception as e:
    print(f"❌ Error connecting: {e}")
    sys.exit(1)
