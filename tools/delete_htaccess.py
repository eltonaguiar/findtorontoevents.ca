#!/usr/bin/env python3
"""
Delete the .htaccess file from the server that's causing 500 errors
"""

import os
import sys

# Add favcreators to path to import upload_to_ftp
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'favcreators'))

try:
    from upload_to_ftp import get_ftp_connection, FTP_REMOTE_PATH
except ImportError:
    print("Error: Could not import from upload_to_ftp.py")
    sys.exit(1)

def delete_file(remote_path):
    """Delete a file from the FTP server"""
    ftp = get_ftp_connection()
    try:
        ftp.delete(remote_path)
        print(f"Deleted: {remote_path}")
        return True
    except Exception as e:
        print(f"Error deleting {remote_path}: {e}")
        return False
    finally:
        ftp.quit()

if __name__ == "__main__":
    remote_file = f"{FTP_REMOTE_PATH}/api/.htaccess"
    print(f"Attempting to delete: {remote_file}")
    success = delete_file(remote_file)
    sys.exit(0 if success else 1)