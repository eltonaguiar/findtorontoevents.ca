#!/usr/bin/env python
"""Deploy built assets to the server"""
import ftplib
import os

host = os.environ.get('FTP_SERVER', 'ftps2.50webs.com')
user = os.environ.get('FTP_USER', 'ejaguiar1')
passwd = os.environ.get('FTP_PASS', '')
remote_dir = '/findtorontoevents.ca/fc'
local_dir = 'favcreators/docs'

ftp = ftplib.FTP_TLS()
ftp.connect(host, 21, timeout=30)
ftp.login(user, passwd)
ftp.prot_p()
ftp.cwd(remote_dir)

# Upload main JS file (new hash)
files = [
    ('assets/main-CaC_NiQq.js', 'assets/main-CaC_NiQq.js'),  # New hash
    ('assets/main-Cc_osnA3.css', 'assets/main-Cc_osnA3.css'),  # Same CSS
]

for local_file, remote_file in files:
    local_path = os.path.join(local_dir, local_file)
    print(f'Uploading {local_file}...')
    ftp.cwd(remote_dir)
    ftp.cwd('assets')
    with open(local_path, 'rb') as f:
        ftp.storbinary(f'STOR {os.path.basename(remote_file)}', f)
    print(f'  Done')

ftp.quit()
print('Build deployed!')
