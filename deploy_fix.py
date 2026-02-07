import ftplib

FTP_HOST = 'ftps2.50webs.com'
FTP_USER = 'ejaguiar1'
FTP_PASS = '$a^FzN7BqKapSQMsZxD&^FeTJ'

try:
    ftp = ftplib.FTP(FTP_HOST)
    ftp.login(FTP_USER, FTP_PASS)
    ftp.cwd('/findtorontoevents.ca/vr')
    with open('vr/mobile-detect.js', 'rb') as f:
        ftp.storbinary('STOR mobile-detect.js', f)
    ftp.quit()
    print('[OK] mobile-detect.js deployed')
except Exception as e:
    print(f'[FAIL] {e}')
