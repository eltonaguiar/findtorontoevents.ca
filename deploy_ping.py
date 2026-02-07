#!/usr/bin/env python
"""Deploy ping file to the server"""
import ftplib
import os

host = os.environ.get('FTP_SERVER', 'ftps2.50webs.com')
user = os.environ.get('FTP_USER', 'ejaguiar1')
passwd = os.environ.get('FTP_PASS', '')
remote_dir = '/findtorontoevents.ca/fc/api'

ftp = ftplib.FTP_TLS()
ftp.connect(host, 21, timeout=30)
ftp.login(user, passwd)
ftp.prot_p()
ftp.cwd(remote_dir)

with open('favcreators/public/api/ping.php', 'rb') as f:
    ftp.storbinary('STOR ping.php', f)
print('ping.php uploaded')

ftp.quit()
