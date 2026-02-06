#!/usr/bin/env python
"""Deploy index.html to the server"""
import ftplib

host = 'ftps2.50webs.com'
user = 'ejaguiar1'
passwd = r'$a^FzN7BqKapSQMsZxD&^FeTJ'
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
