#!/usr/bin/env python
"""Deploy all fixed PHP files to the server"""
import ftplib
import os

host = os.environ.get('FTP_SERVER', 'ftps2.50webs.com')
user = os.environ.get('FTP_USER', 'ejaguiar1')
passwd = os.environ.get('FTP_PASS', '')
remote_dir = '/findtorontoevents.ca/fc/api'

files_to_upload = [
    'favcreators/public/api/get_streamer_last_seen.php',
    'favcreators/public/api/update_streamer_last_seen.php',
    'favcreators/public/api/get_live_cached.php',
    'favcreators/public/api/sync_live_status.php',
    'favcreators/public/api/debug_last_seen.php',
    'favcreators/public/api/ping.php',
]

print('Connecting to FTP...')
ftp = ftplib.FTP_TLS()
ftp.connect(host, 21, timeout=30)
ftp.login(user, passwd)
ftp.prot_p()
print('Connected!')

ftp.cwd(remote_dir)
print(f'Changed to directory: {remote_dir}')

for local_file in files_to_upload:
    filename = os.path.basename(local_file)
    print(f'Uploading {filename}...')
    with open(local_file, 'rb') as f:
        ftp.storbinary(f'STOR {filename}', f)
    print(f'  Done')

ftp.quit()
print('All files uploaded successfully!')
