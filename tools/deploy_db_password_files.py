#!/usr/bin/env python3
"""Deploy all files that were updated with new database passwords."""
import ftplib
import winreg
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parent.parent

# Read FTP creds
key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r'Environment')
ftp_creds = {}
for n in ['FTP_PASS', 'FTP_SERVER', 'FTP_USER']:
    try:
        v, _ = winreg.QueryValueEx(key, n)
        ftp_creds[n] = v
    except:
        ftp_creds[n] = ''
winreg.CloseKey(key)

# Fallback from .env
env_file = WORKSPACE / '.env'
if env_file.exists():
    for line in env_file.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, _, v = line.partition('=')
            k, v = k.strip(), v.strip()
            if k and not ftp_creds.get(k):
                ftp_creds[k] = v

HOST = ftp_creds.get('FTP_SERVER') or ftp_creds.get('FTP_HOST', '')
USER = ftp_creds.get('FTP_USER', '')
PASS = ftp_creds.get('FTP_PASS', '')
REMOTE_BASE = '/findtorontoevents.ca'

# All files to deploy (local path relative to workspace -> remote path under findtorontoevents.ca/)
FILES_TO_DEPLOY = [
    # .env files
    'api/events/.env',
    'favcreators/public/api/.env',
    # Note: favcreators/docs/ is the built version served at /fc/
    # The actual deployed path for favcreators is /fc/api/
    
    # PHP config files
    'api/auth_db_config.php',
    'favcreators/public/api/events_db_config.php',
    'favcreators/public/api/db_config.php',  # deploy even if unchanged (has env fallback)
    
    # MOVIESHOWS3 (deployed to /MOVIESHOWS3/ on server)
    'TORONTOEVENTS_ANTIGRAVITY/MOVIESHOWS3/api/db-config.php',
    'TORONTOEVENTS_ANTIGRAVITY/MOVIESHOWS3/api/db_connect.php',
    'TORONTOEVENTS_ANTIGRAVITY/MOVIESHOWS3/init-database.php',
    'TORONTOEVENTS_ANTIGRAVITY/MOVIESHOWS3/verify-database.php',
    
    # MOVIESHOWS2 (deployed to /movieshows2/ on server)
    'TORONTOEVENTS_ANTIGRAVITY/MOVIESHOWS2/api/db-config.php',
    'TORONTOEVENTS_ANTIGRAVITY/MOVIESHOWS2/init-database.php',
    'TORONTOEVENTS_ANTIGRAVITY/MOVIESHOWS2/verify-database.php',
    'TORONTOEVENTS_ANTIGRAVITY/MOVIESHOWS2/log/index.php',
    'TORONTOEVENTS_ANTIGRAVITY/MOVIESHOWS2/log/api_status.php',
    'TORONTOEVENTS_ANTIGRAVITY/MOVIESHOWS2/fetch_new_content.php',
    'TORONTOEVENTS_ANTIGRAVITY/MOVIESHOWS2/admin_search.php',
    'TORONTOEVENTS_ANTIGRAVITY/MOVIESHOWS2/admin_fetch_year.php',
    'TORONTOEVENTS_ANTIGRAVITY/MOVIESHOWS2/admin_add_single.php',
    
    # MOVIESHOWS v1 (deployed to /MOVIESHOWS/ on server)
    'TORONTOEVENTS_ANTIGRAVITY/MOVIESHOWS/api/db-config.php',
    'TORONTOEVENTS_ANTIGRAVITY/MOVIESHOWS/init-database.php',
    'TORONTOEVENTS_ANTIGRAVITY/MOVIESHOWS/verify-database.php',
]

# Map local paths to remote paths
def local_to_remote(local_rel):
    """Convert local relative path to remote FTP path."""
    p = local_rel.replace('\\', '/')
    
    # TORONTOEVENTS_ANTIGRAVITY/MOVIESHOWS3/x -> MOVIESHOWS3/x
    if p.startswith('TORONTOEVENTS_ANTIGRAVITY/MOVIESHOWS3/'):
        return p.replace('TORONTOEVENTS_ANTIGRAVITY/MOVIESHOWS3/', 'MOVIESHOWS3/')
    
    # TORONTOEVENTS_ANTIGRAVITY/MOVIESHOWS2/x -> movieshows2/x
    if p.startswith('TORONTOEVENTS_ANTIGRAVITY/MOVIESHOWS2/'):
        return p.replace('TORONTOEVENTS_ANTIGRAVITY/MOVIESHOWS2/', 'movieshows2/')
    
    # TORONTOEVENTS_ANTIGRAVITY/MOVIESHOWS/x -> MOVIESHOWS/x
    if p.startswith('TORONTOEVENTS_ANTIGRAVITY/MOVIESHOWS/'):
        return p.replace('TORONTOEVENTS_ANTIGRAVITY/MOVIESHOWS/', 'MOVIESHOWS/')
    
    # favcreators/public/api/x -> fc/api/x (deployed as /fc/)
    if p.startswith('favcreators/public/api/'):
        return p.replace('favcreators/public/api/', 'fc/api/')
    
    # Everything else: same path
    return p


print(f"Connecting to {HOST} as {USER}...")
ftp = ftplib.FTP(HOST, timeout=30)
ftp.login(USER, PASS)

deployed = 0
failed = 0

for local_rel in FILES_TO_DEPLOY:
    local_path = WORKSPACE / local_rel
    if not local_path.exists():
        print(f"  SKIP (not found): {local_rel}")
        continue
    
    remote_rel = local_to_remote(local_rel)
    remote_full = f"{REMOTE_BASE}/{remote_rel}"
    
    # Ensure remote directory exists
    remote_dir = '/'.join(remote_full.split('/')[:-1])
    try:
        ftp.cwd(remote_dir)
    except:
        # Try to create directory tree
        parts = remote_dir.split('/')
        for i in range(1, len(parts) + 1):
            d = '/'.join(parts[:i])
            if d:
                try:
                    ftp.cwd(d)
                except:
                    try:
                        ftp.mkd(d)
                        ftp.cwd(d)
                    except:
                        pass
    
    remote_filename = remote_full.split('/')[-1]
    try:
        ftp.cwd(remote_dir)
        with open(local_path, 'rb') as f:
            ftp.storbinary(f'STOR {remote_filename}', f)
        print(f"  OK: {remote_rel}")
        deployed += 1
    except Exception as e:
        print(f"  FAIL: {remote_rel} - {e}")
        failed += 1

ftp.quit()

print()
print("=" * 60)
print(f"Deployed: {deployed}  Failed: {failed}  Skipped: {len(FILES_TO_DEPLOY) - deployed - failed}")
print("=" * 60)
