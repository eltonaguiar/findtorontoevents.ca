import ftplib

FTP_HOST = 'ftps2.50webs.com'
FTP_USER = 'ejaguiar1'
FTP_PASS = '$a^FzN7BqKapSQMsZxD&^FeTJ'

def upload(local, remote):
    try:
        ftp = ftplib.FTP(FTP_HOST)
        ftp.login(FTP_USER, FTP_PASS)
        ftp.cwd('/findtorontoevents.ca/vr')
        with open(local, 'rb') as f:
            ftp.storbinary(f'STOR {remote}', f)
        ftp.quit()
        print(f'[OK] {remote}')
        return True
    except Exception as e:
        print(f'[FAIL] {remote}: {e}')
        return False

files = [
    ('vr/vr-mode-toggle.js', 'vr-mode-toggle.js'),
    ('vr/index.html', 'index.html'),
]

success = sum(upload(l, r) for l, r in files)
print(f'DEPLOYED: {success}/{len(files)} files')
