#!/usr/bin/env python3
"""
Deploy MENTALHEALTHRESOURCES folder to FTP.

Uploads all HTML files from MENTALHEALTHRESOURCES/ to findtorontoevents.ca/MENTALHEALTHRESOURCES/

Uses environment variables:
  FTP_SERVER (or FTP_HOST) - FTP hostname
  FTP_USER   - FTP username
  FTP_PASS   - FTP password

Run from project root:
  set FTP_SERVER=... FTP_USER=... FTP_PASS=...
  python tools/deploy_mental_health.py
"""
import os
import ftplib
from pathlib import Path

_SCRIPT_DIR = Path(__file__).resolve().parent
WORKSPACE = _SCRIPT_DIR.parent

# Load workspace .env
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

DEFAULT_REMOTE_PATH = "findtorontoevents.ca"


def _env(key: str, fallback: str = "") -> str:
    return os.environ.get(key, fallback).strip()


def _ensure_dir(ftp: ftplib.FTP, remote_dir: str) -> bool:
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


def _upload_file(ftp: ftplib.FTP, local_path: Path, remote_path: str) -> bool:
    remote_dir = "/".join(remote_path.split("/")[:-1])
    ftp.cwd("/")
    if remote_dir and not _ensure_dir(ftp, remote_dir):
        return False
    try:
        with open(local_path, "rb") as f:
            ftp.storbinary(f"STOR {remote_path.split('/')[-1]}", f)
        print(f"  [OK] {remote_path}")
        return True
    except Exception as e:
        print(f"  [ERROR] {remote_path}: {e}")
        return False


def deploy_mental_health(ftp: ftplib.FTP, remote_base: str) -> int:
    """Upload MENTALHEALTHRESOURCES/ to remote_base/MENTALHEALTHRESOURCES/"""
    local_dir = WORKSPACE / "MENTALHEALTHRESOURCES"
    if not local_dir.is_dir():
        print("  Skip MENTALHEALTHRESOURCES (folder not found)")
        return 0
    
    remote = f"{remote_base}/MENTALHEALTHRESOURCES"
    count = 0
    
    # Upload all HTML files
    for f in local_dir.glob("*.html"):
        if _upload_file(ftp, f, f"{remote}/{f.name}"):
            count += 1
    
    return count


def main() -> None:
    host = _env("FTP_SERVER") or _env("FTP_HOST")
    user = _env("FTP_USER")
    password = _env("FTP_PASS")
    remote_path = _env("FTP_REMOTE_PATH") or DEFAULT_REMOTE_PATH

    if not host or not user or not password:
        print("Set FTP_SERVER (or FTP_HOST), FTP_USER, FTP_PASS in environment.")
        raise SystemExit(1)

    print(f"Deploy Mental Health Resources to FTP: {host}")
    print(f"Remote path: {remote_path}/MENTALHEALTHRESOURCES/")
    print()

    try:
        with ftplib.FTP(host) as ftp:
            ftp.login(user, password)
            print("Connected.\n")

            print("Uploading MENTALHEALTHRESOURCES/ ...")
            count = deploy_mental_health(ftp, remote_path)
            print(f"\n  -> {count} files uploaded")
            print()

        print("Deploy complete!")
        print(f"View at: https://findtorontoevents.ca/MENTALHEALTHRESOURCES/")
    except Exception as e:
        print(f"Deploy failed: {e}")
        raise SystemExit(1)


if __name__ == "__main__":
    main()
