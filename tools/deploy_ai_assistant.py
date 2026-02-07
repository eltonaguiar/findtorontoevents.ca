#!/usr/bin/env python3
"""Quick deploy: upload ai-assistant.js + index.html + findstocks/index.html to remote."""
import os, ftplib
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parent.parent
_env_file = WORKSPACE / ".env"
if _env_file.exists():
    for line in _env_file.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            k, v = k.strip(), v.strip()
            if k and os.environ.get(k) in (None, ""):
                os.environ.setdefault(k, v)
    if "FTP_SERVER" not in os.environ and os.environ.get("FTP_HOST"):
        os.environ.setdefault("FTP_SERVER", os.environ["FTP_HOST"])

host = os.environ.get("FTP_SERVER", "").strip()
user = os.environ.get("FTP_USER", "").strip()
pw = os.environ.get("FTP_PASS", "").strip()
remote = "findtorontoevents.ca"

files = [
    (WORKSPACE / "ai-assistant.js", f"{remote}/ai-assistant.js"),
    (WORKSPACE / "index.html", f"{remote}/index.html"),
    (WORKSPACE / "findstocks" / "index.html", f"{remote}/findstocks/index.html"),
]

with ftplib.FTP(host) as ftp:
    ftp.login(user, pw)
    for local, rpath in files:
        if not local.is_file():
            print(f"  Skip {local} (not found)")
            continue
        parts = rpath.split("/")
        ftp.cwd("/")
        for p in parts[:-1]:
            try: ftp.cwd(p)
            except:
                try: ftp.mkd(p); ftp.cwd(p)
                except: pass
        with open(local, "rb") as f:
            ftp.storbinary(f"STOR {parts[-1]}", f)
        print(f"  Uploaded {rpath}")
print("Done.")
