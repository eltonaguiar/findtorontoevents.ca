"""
Deploy AI assistant to all pages on findtorontoevents.ca
Uploads ai-assistant.js + all HTML pages that reference it + the API endpoint
"""
import os, ftplib

FTP_HOST = os.environ.get('FTP_SERVER') or os.environ.get('FTP_HOST')
FTP_USER = os.environ.get('FTP_USER')
FTP_PASS = os.environ.get('FTP_PASS')
BASE = '/findtorontoevents.ca'

files_to_upload = [
    # Core AI assistant
    ('ai-assistant.js', f'{BASE}/ai-assistant.js'),
    # Main events page
    ('index.html', f'{BASE}/index.html'),
    # FavCreators (served at /fc/)
    ('favcreators/docs/index.html', f'{BASE}/fc/index.html'),
    # FavCreators API endpoint for preferences
    ('favcreators/docs/api/ai_preferences.php', f'{BASE}/fc/api/ai_preferences.php'),
    # FindStocks
    ('findstocks/index.html', f'{BASE}/findstocks/index.html'),
    # MovieShows V1
    ('MOVIESHOWS/index.html', f'{BASE}/MOVIESHOWS/index.html'),
    # MovieShows V2
    ('TORONTOEVENTS_ANTIGRAVITY/MOVIESHOWS2/index.html', f'{BASE}/movieshows2/index.html'),
    # MovieShows V3
    ('TORONTOEVENTS_ANTIGRAVITY/MOVIESHOWS3/index.html', f'{BASE}/MOVIESHOWS3/index.html'),
    # Mental Health Resources
    ('MENTALHEALTHRESOURCES/index.html', f'{BASE}/MENTALHEALTHRESOURCES/index.html'),
    # Windows Boot Fixer
    ('WINDOWSFIXER/index.html', f'{BASE}/WINDOWSFIXER/index.html'),
    # Stats
    ('stats/index.html', f'{BASE}/stats/index.html'),
]

def upload():
    ftp = ftplib.FTP(FTP_HOST)
    ftp.login(FTP_USER, FTP_PASS)
    for local, remote in files_to_upload:
        if not os.path.isfile(local):
            print(f'  SKIP (not found): {local}')
            continue
        # Ensure remote dir exists
        rdir = '/'.join(remote.split('/')[:-1])
        try: ftp.mkd(rdir)
        except: pass
        with open(local, 'rb') as f:
            ftp.storbinary(f'STOR {remote}', f)
        print(f'  Uploaded {remote}')
    ftp.quit()
    print('Done.')

if __name__ == '__main__':
    upload()
