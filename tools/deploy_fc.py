"""
Deploy favcreators app to /fc/ path on the live site.

The app is built with base: '/fc/' and should be deployed to fc/ directory.
"""
import os
import ftplib
from pathlib import Path

# Local favcreators build output (vite base: /fc/, outDir: docs)
LOCAL_DOCS = Path(__file__).resolve().parent.parent / "favcreators" / "docs"

# Remote paths: Deploy to fc/ directory
REMOTE_PATHS = [
    "findtorontoevents.ca/fc",  # domain folder
    "fc",                        # FTP root (if docroot is root)
]


def ensure_dir(ftp, remote_dir):
    """Create remote path (directory by directory)."""
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


def upload_tree(ftp, local_dir, remote_base):
    """Upload local_dir contents into remote_base (create dirs as needed)."""
    ftp.cwd("/")
    if not ensure_dir(ftp, remote_base):
        return False
    count = 0
    for root, dirs, files in os.walk(local_dir):
        for name in files:
            local_path = Path(root) / name
            rel = local_path.relative_to(local_dir)
            remote_path = remote_base + "/" + str(rel).replace("\\", "/")
            remote_parts = remote_path.split("/")
            remote_file = remote_parts[-1]
            remote_parent = "/".join(remote_parts[:-1])
            ftp.cwd("/")
            ensure_dir(ftp, remote_parent)
            try:
                with open(local_path, "rb") as f:
                    ftp.storbinary(f"STOR {remote_file}", f)
                print(f"  {remote_path}")
                count += 1
            except Exception as e:
                print(f"  ERROR {remote_path}: {e}")
    return count


def deploy_favcreators():
    host = os.environ.get("FTP_SERVER")
    user = os.environ.get("FTP_USER")
    password = os.environ.get("FTP_PASS")
    if not all([host, user, password]):
        print("Set FTP_SERVER, FTP_USER, FTP_PASS")
        return False
    if not LOCAL_DOCS.is_dir():
        print(f"Local docs not found: {LOCAL_DOCS}")
        return False
    print(f"Local: {LOCAL_DOCS}")
    print(f"Remote: {REMOTE_PATHS}\n")
    try:
        with ftplib.FTP(host) as ftp:
            ftp.login(user, password)
            for remote in REMOTE_PATHS:
                print(f"Uploading to {remote}/ ...")
                n = upload_tree(ftp, str(LOCAL_DOCS), remote)
                print(f"  -> {n} files\n")
        print("FavCreators deployment complete.")
        return True
    except Exception as e:
        print(f"Deploy failed: {e}")
        return False


if __name__ == "__main__":
    ok = deploy_favcreators()
    if not ok:
        exit(1)
