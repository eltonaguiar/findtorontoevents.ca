#!/usr/bin/env python3
"""Deploy VR assets to production"""
import ftplib
import os

FTP_HOST = "ftps2.50webs.com"
FTP_USER = "ejaguiar1"
FTP_PASS = "$a^FzN7BqKapSQMsZxD&^FeTJ"
LOCAL_ASSETS_DIR = "vr/assets"
REMOTE_DIR = "/findtorontoevents.ca/vr/assets"

def deploy_assets():
    print(f"Connecting to {FTP_HOST}...")
    ftp = ftplib.FTP(FTP_HOST)
    ftp.login(FTP_USER, FTP_PASS)
    
    # Create assets directory
    try:
        ftp.mkd('/findtorontoevents.ca/vr/assets')
        print("Created assets directory")
    except:
        pass
    
    ftp.cwd(REMOTE_DIR)
    print(f"Connected! cwd={REMOTE_DIR}")
    
    files = os.listdir(LOCAL_ASSETS_DIR)
    print(f"Found {len(files)} asset files to deploy")
    
    success = 0
    failed = []
    
    for filename in files:
        local_path = os.path.join(LOCAL_ASSETS_DIR, filename)
        if os.path.isfile(local_path):
            try:
                with open(local_path, 'rb') as f:
                    ftp.storbinary(f'STOR {filename}', f)
                print(f"  [OK] {filename}")
                success += 1
            except Exception as e:
                print(f"  [FAIL] {filename}: {e}")
                failed.append(filename)
    
    ftp.quit()
    print(f"\nDeployed: {success}/{len(files)}")
    if failed:
        print(f"Failed: {failed}")

if __name__ == "__main__":
    deploy_assets()
