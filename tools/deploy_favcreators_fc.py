import os
import ssl
from ftplib import FTP_TLS, error_perm

here = os.path.dirname(os.path.abspath(__file__))
parent = os.path.dirname(here)

# Load .env
env_path = os.path.join(parent, ".env")
env = {}
with open(env_path, "r", encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        k, v = line.split("=", 1)
        env[k.strip()] = v.strip()

FTP_HOST = env.get("FTP_HOST", "")
FTP_USER = env.get("FTP_USER", "")
FTP_PASS = env.get("FTP_PASS", "")

# Upload all files from docs folder
local_docs = os.path.join(parent, "favcreators", "docs")
remote_base = "/findtorontoevents.ca/fc"

print(f"Connecting to {FTP_HOST}...")
context = ssl.create_default_context()
ftp = FTP_TLS(context=context)
ftp.connect(FTP_HOST, 21, timeout=60)
ftp.login(FTP_USER, FTP_PASS)
ftp.prot_p()
print("Connected!")

def upload_dir(local_path, remote_path):
    """Recursively upload directory"""
    for root, dirs, files in os.walk(local_path):
        # Create remote directory
        rel_path = os.path.relpath(root, local_path)
        if rel_path == '.':
            current_remote = remote_path
        else:
            current_remote = remote_path + "/" + rel_path.replace("\\", "/")
        
        # Try to create and enter directory
        try:
            ftp.cwd(current_remote)
        except:
            try:
                ftp.mkd(current_remote)
                ftp.cwd(current_remote)
            except Exception as e:
                print(f"  Warning: Could not create/enter {current_remote}: {e}")
                continue
        
        # Upload files
        for file in files:
            local_file = os.path.join(root, file)
            with open(local_file, "rb") as f:
                ftp.storbinary(f"STOR {file}", f)
                rel_file = os.path.join(rel_path, file) if rel_path != '.' else file
                print(f"  Uploaded: {rel_file}")

upload_dir(local_docs, remote_base)

ftp.quit()
print("\nDeployment complete!")
print("Visit: https://findtorontoevents.ca/fc/")
