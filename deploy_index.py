#!/usr/bin/env python
"""Deploy index.html to the server"""
import ftplib
import os

host = os.environ.get('FTP_SERVER', 'ftps2.50webs.com')
user = os.environ.get('FTP_USER', 'ejaguiar1')
passwd = os.environ.get('FTP_PASS', '')
remote_dir = '/findtorontoevents.ca/fc'

ftp = ftplib.FTP_TLS()
ftp.connect(host, 21, timeout=30)
ftp.login(user, passwd)
ftp.prot_p()
ftp.cwd(remote_dir)

print('Uploading index.html...')
with open('favcreators/docs/index.html', 'rb') as f:
    ftp.storbinary('STOR index.html', f)
print('Done!')

ftp.quit()
