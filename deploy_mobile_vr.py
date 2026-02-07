import os
import ftplib
import sys

FTP_HOST = os.environ.get('FTP_SERVER', 'ftps2.50webs.com')
FTP_USER = os.environ.get('FTP_USER', 'ejaguiar1')
FTP_PASS = os.environ.get('FTP_PASS', '')
REMOTE_DIR = '/findtorontoevents.ca/vr'

def upload(local_path, remote_name):
    try:
        ftp = ftplib.FTP(FTP_HOST)
        ftp.login(FTP_USER, FTP_PASS)
        ftp.cwd(REMOTE_DIR)
        with open(local_path, 'rb') as f:
            ftp.storbinary(f'STOR {remote_name}', f)
        ftp.quit()
        print(f'[OK] {remote_name}')
        return True
    except Exception as e:
        print(f'[FAIL] {remote_name}: {e}')
        return False

files = [
    ('vr/mobile-index.html', 'mobile-index.html'),
    ('vr/mobile-weather.html', 'mobile-weather.html'),
    ('vr/mobile-detect.js', 'mobile-detect.js'),
    ('vr/index.html', 'index.html'),
]

success = sum(upload(l, r) for l, r in files)
print(f'DEPLOYED: {success}/{len(files)} files')
sys.exit(0 if success == len(files) else 1)
