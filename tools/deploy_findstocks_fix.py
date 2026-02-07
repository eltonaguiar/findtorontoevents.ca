#!/usr/bin/env python3
"""
Deploy findstocks fix: upload fixed JS chunks, findstocks/index.html, and data/daily-stocks.json.

Fixes:
  - SyntaxError in 2a3d702d902f026a.js (initialStock Ideas -> initialStocks)
  - Duplicate RSC data in findstocks/index.html
  - Ensures latest daily-stocks.json is deployed

Uses environment variables (or .env):
  FTP_SERVER (or FTP_HOST), FTP_USER, FTP_PASS
"""
import os
import ftplib
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parent.parent
REMOTE_BASE = "findtorontoevents.ca"

# Load .env
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


def _ensure_dir(ftp, remote_dir):
    ftp.cwd("/")
    for part in remote_dir.split("/"):
        if not part:
            continue
        try:
            ftp.cwd(part)
        except ftplib.error_perm:
            try:
                ftp.mkd(part)
                ftp.cwd(part)
            except Exception as e:
                print(f"  Warning: mkd/cwd {part}: {e}")
                return False
    return True


def _upload(ftp, local_path, remote_path):
    remote_dir = "/".join(remote_path.split("/")[:-1])
    remote_file = remote_path.split("/")[-1]
    ftp.cwd("/")
    if remote_dir and not _ensure_dir(ftp, remote_dir):
        return False
    try:
        with open(local_path, "rb") as f:
            ftp.storbinary(f"STOR {remote_file}", f)
        size_kb = local_path.stat().st_size / 1024
        print(f"  OK {remote_path} ({size_kb:.1f} KB)")
        return True
    except Exception as e:
        print(f"  ERROR {remote_path}: {e}")
        return False


def main():
    host = (os.environ.get("FTP_SERVER") or os.environ.get("FTP_HOST", "")).strip()
    user = os.environ.get("FTP_USER", "").strip()
    password = os.environ.get("FTP_PASS", "").strip()

    if not host or not user or not password:
        print("Set FTP_SERVER (or FTP_HOST), FTP_USER, FTP_PASS in environment or .env")
        raise SystemExit(1)

    # Files to upload: (local_path, remote_path)
    files = [
        (WORKSPACE / "next" / "_next" / "static" / "chunks" / "2a3d702d902f026a.js",
         f"{REMOTE_BASE}/next/_next/static/chunks/2a3d702d902f026a.js"),
        (WORKSPACE / "next" / "_next" / "static" / "chunks" / "9296210ebec41344.js",
         f"{REMOTE_BASE}/next/_next/static/chunks/9296210ebec41344.js"),
        (WORKSPACE / "findstocks" / "index.html",
         f"{REMOTE_BASE}/findstocks/index.html"),
        (WORKSPACE / "data" / "daily-stocks.json",
         f"{REMOTE_BASE}/data/daily-stocks.json"),
    ]

    # Verify all local files exist
    for local_path, _ in files:
        if not local_path.is_file():
            print(f"ERROR: {local_path} not found!")
            raise SystemExit(1)

    print(f"Deploying findstocks fix to {host} ({REMOTE_BASE}/)")
    print(f"Files: {len(files)}")
    print()

    try:
        with ftplib.FTP(host) as ftp:
            ftp.login(user, password)
            print("Connected.\n")

            ok = 0
            for local_path, remote_path in files:
                if _upload(ftp, local_path, remote_path):
                    ok += 1

            print(f"\nUploaded {ok}/{len(files)} files.")
            if ok == len(files):
                print("Deploy complete. Verify at: https://findtorontoevents.ca/findstocks/")
            else:
                print("Some files failed — check errors above.")
    except Exception as e:
        print(f"Deploy failed: {e}")
        raise SystemExit(1)


if __name__ == "__main__":
    main()
