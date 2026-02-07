import ftplib

FTP_HOST = 'ftps2.50webs.com'
FTP_USER = 'ejaguiar1'
FTP_PASS = '$a^FzN7BqKapSQMsZxD&^FeTJ'

try:
    ftp = ftplib.FTP(FTP_HOST)
    ftp.login(FTP_USER, FTP_PASS)
    ftp.cwd('/findtorontoevents.ca/vr')
    with open('vr/mobile-index.html', 'rb') as f:
        ftp.storbinary('STOR mobile-index.html', f)
    ftp.quit()
    print('[OK] mobile-index.html deployed')
except Exception as e:
    print(f'[FAIL] {e}')
