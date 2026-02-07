"""Deploy db-health-check.php and fetch results, then clean up."""
import ftplib
import winreg
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import HTTPError

key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r'Environment')
pw = {}
for n in ['FTP_PASS', 'FTP_SERVER', 'FTP_USER']:
    try:
        v, _ = winreg.QueryValueEx(key, n)
        pw[n] = v
    except FileNotFoundError:
        pw[n] = ''
winreg.CloseKey(key)

# Fallback FTP creds from .env
env_file = Path(__file__).resolve().parent.parent / '.env'
if env_file.exists():
    for line in env_file.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, _, v = line.partition('=')
            k, v = k.strip(), v.strip()
            if k and not pw.get(k):
                pw[k] = v

host = pw.get('FTP_SERVER') or pw.get('FTP_HOST', '')
user = pw.get('FTP_USER', '')
fpw = pw.get('FTP_PASS', '')

local_file = Path(__file__).resolve().parent.parent / 'stats' / 'db-health-check.php'
remote_name = 'db-health-check.php'

# Deploy
print(f"Deploying {remote_name}...")
ftp = ftplib.FTP(host, timeout=30)
ftp.login(user, fpw)
try:
    ftp.cwd('/findtorontoevents.ca/stats')
except:
    ftp.mkd('/findtorontoevents.ca/stats')
    ftp.cwd('/findtorontoevents.ca/stats')
with open(local_file, 'rb') as f:
    ftp.storbinary(f'STOR {remote_name}', f)
ftp.quit()
print("Deployed. Testing...\n")

# Test
url = f'https://findtorontoevents.ca/stats/{remote_name}'
try:
    req = Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    r = urlopen(req, timeout=20)
    body = r.read().decode('utf-8', 'replace')
    print(body)
except HTTPError as e:
    print(f'HTTP {e.code}: {e.reason}')
    print(e.read().decode('utf-8', 'replace')[:1000])
except Exception as e:
    print(f'Error: {e}')

# Clean up remote
print("Cleaning up remote file...")
ftp2 = ftplib.FTP(host, timeout=30)
ftp2.login(user, fpw)
ftp2.cwd('/findtorontoevents.ca/stats')
try:
    ftp2.delete(remote_name)
    print("Remote file deleted.")
except:
    print("Warning: could not delete remote file")
ftp2.quit()
