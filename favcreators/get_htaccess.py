import ftplib
import os

ftp = ftplib.FTP_TLS()
ftp.connect(os.environ.get('FTP_SERVER', 'ftps2.50webs.com'), 21, timeout=30)
ftp.login(os.environ.get('FTP_USER', 'ejaguiar1'), os.environ.get('FTP_PASS', ''))
ftp.prot_p()

# Download root .htaccess
with open('root_htaccess.txt', 'wb') as f:
    ftp.retrbinary('RETR /findtorontoevents.ca/.htaccess', f.write)

print("Downloaded root .htaccess to root_htaccess.txt")

ftp.quit()