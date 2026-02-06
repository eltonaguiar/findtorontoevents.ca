#!/usr/bin/env python
"""Deploy built assets to the server"""
import ftplib
import os

# Load credentials from .env
host = 'ftps2.50webs.com'
user = 'ejaguiar1'
passwd = r'$a^FzN7BqKapSQMsZxD&^FeTJ'
remote_dir = '/findtorontoevents.ca/fc'
local_dir = 'favcreators/docs'

print('Connecting to FTP...')
ftp = ftplib.FTP_TLS()
ftp.connect(host, 21, timeout=30)
ftp.login(user, passwd)
ftp.prot_p()
print('Connected!')

# Change to the fc directory
try:
    ftp.cwd(remote_dir)
    print(f'Changed to directory: {remote_dir}')
except Exception as e:
    print(f'Warning: Could not change to {remote_dir}: {e}')

# Ensure assets directory exists
try:
    ftp.mkd('assets')
    print('Created assets directory')
except:
    pass  # Directory may already exist

# Change to assets directory
ftp.cwd('assets')
print('Changed to assets directory')

# Upload main JS and CSS files
files_to_upload = [
    'main-C5K1mBF3.js',
    'main-Cc_osnA3.css',
]

for filename in files_to_upload:
    local_path = os.path.join(local_dir, 'assets', filename)
    print(f'Uploading {filename}...')
    with open(local_path, 'rb') as f:
        ftp.storbinary(f'STOR {filename}', f)
    print(f'  Uploaded successfully')

ftp.quit()
print('All files uploaded successfully!')
