#!/usr/bin/env python
"""Deploy debug file to the server"""
import ftplib
import os

host = 'ftps2.50webs.com'
user = 'ejaguiar1'
passwd = r'$a^FzN7BqKapSQMsZxD&^FeTJ'
remote_dir = '/findtorontoevents.ca/fc/api'

print('Connecting to FTP...')
ftp = ftplib.FTP_TLS()
ftp.connect(host, 21, timeout=30)
ftp.login(user, passwd)
ftp.prot_p()
print('Connected!')

ftp.cwd(remote_dir)
print(f'Changed to directory: {remote_dir}')

local_file = 'favcreators/public/api/debug_last_seen.php'
filename = 'debug_last_seen.php'
print(f'Uploading {filename}...')
with open(local_file, 'rb') as f:
    ftp.storbinary(f'STOR {filename}', f)
print(f'  Uploaded successfully')

ftp.quit()
print('Done!')
