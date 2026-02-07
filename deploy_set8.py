import ftplib

FTP_HOST = 'ftps2.50webs.com'
FTP_USER = 'ejaguiar1'
FTP_PASS = '$a^FzN7BqKapSQMsZxD&^FeTJ'

try:
    ftp = ftplib.FTP(FTP_HOST)
    ftp.login(FTP_USER, FTP_PASS)
    ftp.cwd('/findtorontoevents.ca/vr')
    with open('vr/quick-wins-substantial-set8.js', 'rb') as f:
        ftp.storbinary('STOR quick-wins-substantial-set8.js', f)
    ftp.quit()
    print('[OK] quick-wins-substantial-set8.js deployed')
except Exception as e:
    print(f'[FAIL] {e}')
