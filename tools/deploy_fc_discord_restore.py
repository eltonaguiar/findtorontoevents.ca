#!/usr/bin/env python3
"""Deploy restored FC Discord files to the live server."""
import ftplib
import winreg
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parent.parent

key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r'Environment')
HOST = winreg.QueryValueEx(key, 'FTP_SERVER')[0]
USER = winreg.QueryValueEx(key, 'FTP_USER')[0]
PASS = winreg.QueryValueEx(key, 'FTP_PASS')[0]
winreg.CloseKey(key)

# Files to deploy: (local_path_relative_to_workspace, remote_path_relative_to_site_root)
FILES = [
    # Built frontend assets (Discord-enabled build)
    ('favcreators/docs/assets/main-AiqOe6XV.js', 'fc/assets/main-AiqOe6XV.js'),
    ('favcreators/docs/assets/main-BJU6wxaj.css', 'fc/assets/main-BJU6wxaj.css'),
    
    # Updated index.html (references Discord build + VR nav fix)
    ('favcreators/docs/index.html', 'fc/index.html'),
    
    # Discord PHP backend
    ('favcreators/public/api/discord_auth.php', 'fc/api/discord_auth.php'),
    ('favcreators/public/api/discord_callback.php', 'fc/api/discord_callback.php'),
    ('favcreators/public/api/discord_config.php', 'fc/api/discord_config.php'),
    ('favcreators/public/api/discord_interactions.php', 'fc/api/discord_interactions.php'),
    ('favcreators/public/api/discord_interactions_backend.php', 'fc/api/discord_interactions_backend.php'),
    ('favcreators/public/api/discord_interactions_full.php', 'fc/api/discord_interactions_full.php'),
    ('favcreators/public/api/discord_register_commands.php', 'fc/api/discord_register_commands.php'),
    ('favcreators/public/api/discord_unlink.php', 'fc/api/discord_unlink.php'),
    ('favcreators/public/api/ed25519_verify.php', 'fc/api/ed25519_verify.php'),
    ('favcreators/public/api/setup_discord_tables.php', 'fc/api/setup_discord_tables.php'),
    
    # Updated get_me.php with Discord fields
    ('favcreators/public/api/get_me.php', 'fc/api/get_me.php'),
]

REMOTE_BASE = '/findtorontoevents.ca'

print(f"Connecting to {HOST}...")
ftp = ftplib.FTP(HOST, timeout=30)
ftp.login(USER, PASS)

deployed = 0
failed = 0

for local_rel, remote_rel in FILES:
    local_path = WORKSPACE / local_rel
    if not local_path.exists():
        print(f"  SKIP (not found): {local_rel}")
        continue
    
    remote_full = f"{REMOTE_BASE}/{remote_rel}"
    remote_dir = '/'.join(remote_full.rsplit('/', 1)[:-1])
    remote_filename = remote_full.rsplit('/', 1)[-1]
    
    try:
        ftp.cwd(remote_dir)
    except:
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
    
    try:
        ftp.cwd(remote_dir)
        with open(local_path, 'rb') as f:
            ftp.storbinary(f'STOR {remote_filename}', f)
        size_kb = local_path.stat().st_size / 1024
        print(f"  OK: {remote_rel} ({size_kb:.0f} KB)")
        deployed += 1
    except Exception as e:
        print(f"  FAIL: {remote_rel} - {e}")
        failed += 1

ftp.quit()

print()
print("=" * 60)
print(f"Deployed: {deployed}  Failed: {failed}")
print("=" * 60)
