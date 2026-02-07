#!/usr/bin/env python3
"""Deploy all VR files to production"""
import ftplib
import os
import time

FTP_HOST = "ftps2.50webs.com"
FTP_USER = "ejaguiar1"
FTP_PASS = "$a^FzN7BqKapSQMsZxD&^FeTJ"
LOCAL_VR_DIR = "vr"
REMOTE_DIR = "/findtorontoevents.ca/vr"

def deploy_files():
    print(f"Connecting to {FTP_HOST}...")
    ftp = ftplib.FTP(FTP_HOST)
    ftp.login(FTP_USER, FTP_PASS)
    ftp.cwd(REMOTE_DIR)
    print(f"Connected! cwd={REMOTE_DIR}")
    
    files = os.listdir(LOCAL_VR_DIR)
    js_files = [f for f in files if f.endswith('.js')]
    print(f"Found {len(js_files)} JS files to deploy")
    
    success = 0
    failed = []
    
    for filename in js_files:
        local_path = os.path.join(LOCAL_VR_DIR, filename)
        try:
            with open(local_path, 'rb') as f:
                ftp.storbinary(f'STOR {filename}', f)
            print(f"  [OK] {filename}")
            success += 1
        except Exception as e:
            print(f"  [FAIL] {filename}: {e}")
            failed.append(filename)
    
    ftp.quit()
    print(f"\nDeployed: {success}/{len(js_files)}")
    if failed:
        print(f"Failed: {failed}")

if __name__ == "__main__":
    deploy_files()
