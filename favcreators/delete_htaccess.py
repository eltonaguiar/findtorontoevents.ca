import ftplib
import os

ftp = ftplib.FTP_TLS()
ftp.connect(os.environ.get('FTP_SERVER', 'ftps2.50webs.com'), 21, timeout=30)
# Use raw string to handle special characters
ftp.login(os.environ.get('FTP_USER', 'ejaguiar1'), os.environ.get('FTP_PASS', ''))
ftp.prot_p()
print("Logged in successfully")

try:
    ftp.delete('/findtorontoevents.ca/fc/api/.htaccess')
    print('Deleted .htaccess successfully')
except Exception as e:
    print(f'Error deleting: {e}')

ftp.quit()