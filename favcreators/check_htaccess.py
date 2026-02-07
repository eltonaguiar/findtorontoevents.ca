import ftplib
import os

ftp = ftplib.FTP_TLS()
ftp.connect(os.environ.get('FTP_SERVER', 'ftps2.50webs.com'), 21, timeout=30)
ftp.login(os.environ.get('FTP_USER', 'ejaguiar1'), os.environ.get('FTP_PASS', ''))
ftp.prot_p()

# Check for .htaccess files in parent directories
paths = [
    '/findtorontoevents.ca/.htaccess',
    '/findtorontoevents.ca/fc/.htaccess', 
    '/findtorontoevents.ca/fc/public/.htaccess',
    '/findtorontoevents.ca/fc/public/api/.htaccess'
]

for path in paths:
    try:
        size = ftp.size(path)
        print(f'{path}: EXISTS ({size} bytes)')
    except Exception as e:
        print(f'{path}: NOT FOUND ({e})')

ftp.quit()