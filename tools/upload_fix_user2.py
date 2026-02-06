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

local_file = os.path.join(parent, "favcreators", "public", "api", "comprehensive_fix.php")
remote_dir = "/findtorontoevents.ca/fc/api"
remote_file = "comprehensive_fix.php"

print(f"Connecting to {FTP_HOST}...")
context = ssl.create_default_context()
ftp = FTP_TLS(context=context)
ftp.connect(FTP_HOST, 21, timeout=60)
ftp.login(FTP_USER, FTP_PASS)
ftp.prot_p()
print("Connected!")

# Change to directory
ftp.cwd(remote_dir)
print(f"Changed to {remote_dir}")

# Upload file
with open(local_file, "rb") as f:
    ftp.storbinary(f"STOR {remote_file}", f)
    print(f"Uploaded {remote_file}")

ftp.quit()
print("Done! Access at: https://findtorontoevents.ca/fc/api/fix_user2_creators.php")
