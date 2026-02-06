#!/usr/bin/env python
"""Deploy fixed PHP files to the server"""
import ftplib
import os

# Load credentials from .env
host = 'ftps2.50webs.com'
user = 'ejaguiar1'
passwd = r'$a^FzN7BqKapSQMsZxD&^FeTJ'
remote_dir = '/findtorontoevents.ca/fc/api'

files_to_upload = [
    ('favcreators/public/api/update_streamer_last_seen.php', 'update_streamer_last_seen.php'),
    ('favcreators/public/api/get_streamer_last_seen.php', 'get_streamer_last_seen.php'),
    ('favcreators/public/api/sync_live_status.php', 'sync_live_status.php'),
    ('favcreators/public/api/get_live_cached.php', 'get_live_cached.php'),
]

print('Connecting to FTP...')
ftp = ftplib.FTP_TLS()
ftp.connect(host, 21, timeout=30)
ftp.login(user, passwd)
ftp.prot_p()
print('Connected!')

# Change to the API directory
try:
    ftp.cwd(remote_dir)
    print(f'Changed to directory: {remote_dir}')
except Exception as e:
    print(f'Warning: Could not change to {remote_dir}: {e}')

for local_file, remote_name in files_to_upload:
    print(f'Uploading {remote_name}...')
    with open(local_file, 'rb') as f:
        ftp.storbinary(f'STOR {remote_name}', f)
    print(f'  Uploaded successfully')

ftp.quit()
print('All files uploaded successfully!')
