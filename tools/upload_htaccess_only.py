#!/usr/bin/env python3
"""Upload only root .htaccess to FTP (findtorontoevents.ca and findevents)."""
import os
import ftplib
from pathlib import Path

W = Path(__file__).resolve().parent.parent
env_file = W / ".env"
if env_file.exists():
    for line in env_file.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            k, v = k.strip(), v.strip()
            if k:
                os.environ.setdefault(k, v)
if "FTP_SERVER" not in os.environ and os.environ.get("FTP_HOST"):
    os.environ.setdefault("FTP_SERVER", os.environ["FTP_HOST"])

host = os.environ.get("FTP_SERVER") or os.environ.get("FTP_HOST")
user = os.environ.get("FTP_USER")
password = os.environ.get("FTP_PASS")
if not host or not user or not password:
    print("Set FTP_SERVER, FTP_USER, FTP_PASS (or use .env)")
    raise SystemExit(1)

def ensure_dir(ftp, d):
    ftp.cwd("/")
    for part in d.split("/"):
        if not part:
            continue
        try:
            ftp.cwd(part)
        except ftplib.error_perm:
            ftp.mkd(part)
            ftp.cwd(part)

with ftplib.FTP(host) as ftp:
    ftp.login(user, password)
    for base in ["findtorontoevents.ca", "findtorontoevents.ca/findevents"]:
        ensure_dir(ftp, base)
        with open(W / ".htaccess", "rb") as f:
            ftp.storbinary("STOR .htaccess", f)
        print("Uploaded .htaccess to", base)
print("Done.")
