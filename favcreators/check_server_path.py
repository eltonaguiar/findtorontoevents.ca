import ftplib
import os

ftp = ftplib.FTP_TLS()
ftp.connect(os.environ.get('FTP_SERVER', 'ftps2.50webs.com'), 21, timeout=30)
ftp.login(os.environ.get('FTP_USER', 'ejaguiar1'), os.environ.get('FTP_PASS', ''))
ftp.prot_p()

# Check directory structure
print("Listing /findtorontoevents.ca/fc/:")
try:
    ftp.cwd('/findtorontoevents.ca/fc/')
    items = ftp.nlst()
    for item in items[:20]:
        print(f"  {item}")
except Exception as e:
    print(f"Error: {e}")

print("\nListing /findtorontoevents.ca/fc/api/:")
try:
    ftp.cwd('/findtorontoevents.ca/fc/api/')
    items = ftp.nlst()
    for item in items[:10]:
        print(f"  {item}")
except Exception as e:
    print(f"Error: {e}")

ftp.quit()