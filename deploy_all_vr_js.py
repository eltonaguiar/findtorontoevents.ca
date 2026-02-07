import ftplib
import os

FTP_HOST = 'ftps2.50webs.com'
FTP_USER = 'ejaguiar1'
FTP_PASS = '$a^FzN7BqKapSQMsZxD&^FeTJ'

def upload(ftp, local_path, remote_name):
    try:
        with open(local_path, 'rb') as f:
            ftp.storbinary(f'STOR {remote_name}', f)
        print(f'[OK] {remote_name}')
        return True
    except Exception as e:
        print(f'[FAIL] {remote_name}: {e}')
        return False

def main():
    try:
        ftp = ftplib.FTP(FTP_HOST)
        ftp.login(FTP_USER, FTP_PASS)
        ftp.cwd('/findtorontoevents.ca/vr')
        
        # List of all JS files to deploy
        files = [
            'advanced-ux.js',
            'area-guide.js',
            'comfort-intelligence.js',
            'completeness.js',
            'content-depth.js',
            'controller-support.js',
            'hub-badges-enhanced.js',
            'intelligence-engage.js',
            'interaction.js',
            'keyboard-hints.js',
            'mobile-detect.js',
            'nav-menu.js',
            'personalization.js',
            'polish-productivity.js',
            'presence.js',
            'quick-wins.js',
            'quick-wins-set7.js',
            'quick-wins-substantial.js',
            'quick-wins-substantial-set10.js',
            'quick-wins-substantial-set11.js',
            'quick-wins-substantial-set12.js',
            'quick-wins-substantial-set13.js',
            'quick-wins-substantial-set14.js',
            'quick-wins-substantial-set15.js',
            'quick-wins-substantial-set16.js',
            'quick-wins-substantial-set2.js',
            'quick-wins-substantial-set3.js',
            'quick-wins-substantial-set4.js',
            'quick-wins-substantial-set5.js',
            'quick-wins-substantial-set6.js',
            'quick-wins-substantial-set7.js',
            'quick-wins-substantial-set8.js',
            'quick-wins-substantial-set9.js',
            'scene-enhancements.js',
            'social-rich.js',
            'vr-audio.js',
            'vr-comfort.js',
            'vr-controls.js',
            'vr-logger.js',
            'vr-mobile.js',
            'vr-mode-toggle.js',
            'index.html',
        ]
        
        success = 0
        for filename in files:
            local_path = f'vr/{filename}'
            if os.path.exists(local_path):
                if upload(ftp, local_path, filename):
                    success += 1
            else:
                print(f'[MISSING] {filename} not found locally')
        
        ftp.quit()
        print(f'\nDEPLOYED: {success}/{len(files)} files')
        
    except Exception as e:
        print(f'[ERROR] {e}')

if __name__ == '__main__':
    main()
