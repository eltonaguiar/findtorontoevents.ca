#!/usr/bin/env python3
"""
Deploy the full site to an alternative domain via FTP with automatic path rewriting.

This script mirrors the entire site (main page, Next.js chunks, FavCreators, APIs,
Stats, VR, FindStocks) to an alternative FTP path, rewriting all hardcoded domain
references so the alternative site is fully independent.

Usage:
    python tools/deploy_to_altsite.py                          # defaults to tdotevent.ca
    python tools/deploy_to_altsite.py --target tdotevent.ca    # explicit target
    python tools/deploy_to_altsite.py --dry-run                # show what would be deployed

Environment variables:
    FTP_SERVER  (or FTP_HOST) - FTP hostname
    FTP_USER    - FTP username
    FTP_PASS    - FTP password

The FTP_PATH for the alternative site is /<target_domain>/ (e.g. /tdotevent.ca/).
"""

import argparse
import ftplib
import os
import shutil
import tempfile
from pathlib import Path

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
_SCRIPT_DIR = Path(__file__).resolve().parent
WORKSPACE = _SCRIPT_DIR.parent

SOURCE_DOMAIN = "findtorontoevents.ca"

# Text-based file extensions that may contain domain references to rewrite
REWRITABLE_EXTENSIONS = {
    ".html", ".htm", ".php", ".js", ".jsx", ".ts", ".tsx", ".css",
    ".json", ".xml", ".svg", ".md", ".txt", ".yml", ".yaml",
    ".htaccess", ".env", ".example", ".map",
}

# Directories/files to skip entirely during staging
SKIP_PATTERNS = {
    ".git", "node_modules", "__pycache__", ".cursor", ".github",
    "TORONTOEVENTS_ANTIGRAVITY", "MOVIESHOWS", "MOVIESHOWS2", "MOVIESHOWS3",
    "DEPLOY", "favcreators_source", "tests", "playwright.config.ts",
    "playwright-report", "test-results", ".env",
    "package-lock.json",
}

# Reserved filenames on Windows that cannot be read/written
WINDOWS_RESERVED = {
    "con", "prn", "aux", "nul",
    *(f"com{i}" for i in range(1, 10)),
    *(f"lpt{i}" for i in range(1, 10)),
}

# Components and their local→remote mapping
# Format: (local_relative_path, remote_relative_path, description)
DEPLOY_COMPONENTS = [
    # Main site
    ("index.html",           "",             "Main site index"),
    (".htaccess",            "",             "Apache rewrite rules"),
    ("events.json",          "",             "Events data (root)"),
    ("events.json",          "next",         "Events data (next/)"),
    ("last_update.json",     "",             "Last update timestamp"),
    # Next.js chunks
    ("next/_next",           "next/_next",   "Next.js static chunks"),
    ("_next",                "_next",        "Alt Next.js static chunks"),
    # FavCreators (docs = built frontend)
    ("favcreators/docs",     "fc",           "FavCreators app"),
    # FavCreators API (PHP backend)
    ("favcreators/public/api", "fc/api",     "FavCreators API"),
    # Events API
    ("api/events",           "fc/events-api", "Events API"),
    # Main API auth
    ("api/google_auth.php",      "api",      "Google OAuth (auth)"),
    ("api/google_callback.php",  "api",      "Google OAuth (callback)"),
    ("api/auth_db_config.php",   "api",      "Auth DB config"),
    ("api/.htaccess",            "api",      "API htaccess"),
    # Stats
    ("stats",                "stats",        "Stats dashboard"),
    # VR pages
    ("vr",                   "vr",           "VR experience"),
    # FindStocks
    ("findstocks",           "findstocks",   "FindStocks app"),
]


# ---------------------------------------------------------------------------
# .env loader
# ---------------------------------------------------------------------------
def _load_env():
    """Load workspace .env for FTP credentials."""
    env_file = WORKSPACE / ".env"
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8", errors="ignore").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, _, v = line.partition("=")
                k, v = k.strip(), v.strip()
                if k and os.environ.get(k) in (None, ""):
                    os.environ.setdefault(k, v)
        if "FTP_SERVER" not in os.environ and os.environ.get("FTP_HOST"):
            os.environ.setdefault("FTP_SERVER", os.environ["FTP_HOST"])


def _env(key: str, fallback: str = "") -> str:
    return os.environ.get(key, fallback).strip()


# ---------------------------------------------------------------------------
# Path rewriting
# ---------------------------------------------------------------------------
def _rewrite_content(content: str, source: str, target: str) -> str:
    """Replace all domain references from source to target domain."""
    replacements = [
        # Full URLs with www
        (f"https://www.{source}", f"https://www.{target}"),
        (f"http://www.{source}", f"http://www.{target}"),
        # Full URLs without www
        (f"https://{source}", f"https://{target}"),
        (f"http://{source}", f"http://{target}"),
        # Hostname comparisons (JS): hostname === 'findtorontoevents.ca'
        (f"'{source}'", f"'{target}'"),
        (f'"{source}"', f'"{target}"'),
        # Display text / branding (only domain name, no protocol)
        # Be careful: this catches remaining bare references
        (source, target),
    ]
    for old, new in replacements:
        content = content.replace(old, new)
    return content


def _is_rewritable(path: Path) -> bool:
    """Check if file should have domain references rewritten."""
    name = path.name.lower()
    suffix = path.suffix.lower()
    # .htaccess has no suffix but needs rewriting
    if name == ".htaccess":
        return True
    return suffix in REWRITABLE_EXTENSIONS


def _should_skip(name: str) -> bool:
    """Check if a file or directory should be skipped."""
    if name in SKIP_PATTERNS:
        return True
    # Skip Windows reserved filenames (e.g. nul, con, prn)
    stem = Path(name).stem.lower()
    if stem in WINDOWS_RESERVED:
        return True
    return False


# ---------------------------------------------------------------------------
# Staging: copy files with rewriting
# ---------------------------------------------------------------------------
def _stage_file(src: Path, dst: Path, source_domain: str, target_domain: str):
    """Copy a single file, rewriting text content if applicable."""
    dst.parent.mkdir(parents=True, exist_ok=True)
    if _is_rewritable(src):
        try:
            text = src.read_text(encoding="utf-8", errors="ignore")
            rewritten = _rewrite_content(text, source_domain, target_domain)
            dst.write_text(rewritten, encoding="utf-8")
            return
        except Exception:
            pass  # Fall through to binary copy
    # Binary copy (images, fonts, etc.)
    shutil.copy2(src, dst)


def _stage_tree(src_dir: Path, dst_dir: Path, source_domain: str, target_domain: str) -> int:
    """Recursively copy a directory tree with rewriting."""
    count = 0
    if not src_dir.is_dir():
        return 0
    for root, dirs, files in os.walk(src_dir):
        # Filter out skip patterns
        dirs[:] = [d for d in dirs if not _should_skip(d)]
        for name in files:
            if _should_skip(name):
                continue
            src_file = Path(root) / name
            rel = src_file.relative_to(src_dir)
            dst_file = dst_dir / rel
            _stage_file(src_file, dst_file, source_domain, target_domain)
            count += 1
    return count


def stage_site(staging_dir: Path, source_domain: str, target_domain: str) -> dict:
    """Stage all deployable components into staging_dir with rewritten paths.
    
    Returns a dict of component_name -> (staged_local_path, remote_relative_path)
    """
    manifest = {}
    
    for local_rel, remote_rel, desc in DEPLOY_COMPONENTS:
        src = WORKSPACE / local_rel.replace("/", os.sep)
        
        if not src.exists():
            print(f"  Skip {desc}: {local_rel} not found")
            continue
        
        if src.is_file():
            # Single file
            filename = src.name
            staged_path = staging_dir / remote_rel / filename if remote_rel else staging_dir / filename
            _stage_file(src, staged_path, source_domain, target_domain)
            manifest[desc] = (staged_path, f"{remote_rel}/{filename}" if remote_rel else filename)
            print(f"  Staged {desc}: {local_rel} -> {remote_rel or '(root)'}/{filename}")
        else:
            # Directory tree
            staged_path = staging_dir / remote_rel if remote_rel else staging_dir
            count = _stage_tree(src, staged_path, source_domain, target_domain)
            manifest[desc] = (staged_path, remote_rel)
            print(f"  Staged {desc}: {local_rel}/ -> {remote_rel}/ ({count} files)")
    
    return manifest


# ---------------------------------------------------------------------------
# FTP deployment
# ---------------------------------------------------------------------------
def _ensure_dir(ftp: ftplib.FTP, remote_dir: str) -> bool:
    """Ensure remote directory exists, creating parents as needed."""
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
                print(f"    Warning: mkd/cwd {part}: {e}")
                return False
    return True


def _upload_tree(ftp: ftplib.FTP, local_dir: Path, remote_base: str) -> int:
    """Upload a local directory tree to FTP."""
    if not local_dir.is_dir():
        return 0
    ftp.cwd("/")
    if not _ensure_dir(ftp, remote_base):
        return 0
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
            _ensure_dir(ftp, remote_parent)
            try:
                with open(local_path, "rb") as f:
                    ftp.storbinary(f"STOR {remote_file}", f)
                count += 1
            except Exception as e:
                print(f"    ERROR {remote_path}: {e}")
    return count


def _upload_file(ftp: ftplib.FTP, local_path: Path, remote_path: str) -> bool:
    """Upload a single file to FTP."""
    remote_dir = "/".join(remote_path.split("/")[:-1])
    ftp.cwd("/")
    if remote_dir and not _ensure_dir(ftp, remote_dir):
        return False
    try:
        with open(local_path, "rb") as f:
            ftp.storbinary(f"STOR {remote_path.split('/')[-1]}", f)
        return True
    except Exception as e:
        print(f"    ERROR {remote_path}: {e}")
        return False


def deploy_staged(ftp: ftplib.FTP, staging_dir: Path, ftp_base: str) -> int:
    """Deploy the entire staged directory to FTP under ftp_base."""
    print(f"\nDeploying to FTP path: /{ftp_base}/")
    total = _upload_tree(ftp, staging_dir, ftp_base)
    print(f"\n  Total files uploaded: {total}")
    return total


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="Deploy site to alternative domain via FTP")
    parser.add_argument("--target", default="tdotevent.ca",
                        help="Target domain name (default: tdotevent.ca)")
    parser.add_argument("--source", default=SOURCE_DOMAIN,
                        help=f"Source domain to replace (default: {SOURCE_DOMAIN})")
    parser.add_argument("--ftp-path", default=None,
                        help="FTP remote path (default: /<target>/)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Stage files but don't upload")
    parser.add_argument("--keep-staging", action="store_true",
                        help="Don't delete staging directory after deploy")
    args = parser.parse_args()

    _load_env()

    target = args.target
    source = args.source
    ftp_path = args.ftp_path or target

    host = _env("FTP_SERVER") or _env("FTP_HOST")
    user = _env("FTP_USER")
    password = _env("FTP_PASS")

    if not args.dry_run and (not host or not user or not password):
        print("ERROR: Set FTP_SERVER (or FTP_HOST), FTP_USER, FTP_PASS in environment.")
        print("  Windows: set FTP_SERVER=... & set FTP_USER=... & set FTP_PASS=...")
        print("  Or create a .env file in the project root.")
        raise SystemExit(1)

    print("=" * 70)
    print(f"  Alternative Site Deployment")
    print(f"  Source domain:  {source}")
    print(f"  Target domain:  {target}")
    print(f"  FTP path:       /{ftp_path}/")
    print(f"  FTP server:     {host or '(dry-run)'}")
    print(f"  Dry run:        {args.dry_run}")
    print("=" * 70)
    print()

    # --- Stage ---
    staging_dir = Path(tempfile.mkdtemp(prefix="altsite_deploy_"))
    print(f"Staging directory: {staging_dir}")
    print()

    print("Staging files with path rewriting...")
    try:
        manifest = stage_site(staging_dir, source, target)
    except Exception as e:
        print(f"\nStaging failed: {e}")
        shutil.rmtree(staging_dir, ignore_errors=True)
        raise SystemExit(1)

    # Count staged files
    staged_count = sum(1 for _ in staging_dir.rglob("*") if _.is_file())
    print(f"\nTotal staged files: {staged_count}")

    if args.dry_run:
        print(f"\nDry run complete. Staged files are in: {staging_dir}")
        if not args.keep_staging:
            print("(Use --keep-staging to inspect the staging directory)")
            shutil.rmtree(staging_dir, ignore_errors=True)
        return

    # --- Deploy ---
    print(f"\nConnecting to FTP: {host} ...")
    try:
        with ftplib.FTP(host, timeout=120) as ftp:
            ftp.login(user, password)
            print("Connected.\n")

            total = deploy_staged(ftp, staging_dir, ftp_path)

        print(f"\nDeploy complete! {total} files uploaded to /{ftp_path}/")
        print()
        print("Post-deploy verification:")
        print(f"  Main site:      https://{target}/")
        print(f"  Events:         https://{target}/events.json")
        print(f"  FavCreators:    https://{target}/fc/")
        print(f"  Stats:          https://{target}/stats/")
        print(f"  VR:             https://{target}/vr/")
        print(f"  FindStocks:     https://{target}/findstocks/")
        print()
        print("Setup endpoints (run once):")
        print(f"  Tables setup:   https://{target}/fc/events-api/setup_tables.php")
        print(f"  Events sync:    https://{target}/fc/events-api/sync_events.php")

    except Exception as e:
        print(f"\nDeploy failed: {e}")
        raise SystemExit(1)
    finally:
        if not args.keep_staging:
            shutil.rmtree(staging_dir, ignore_errors=True)
        else:
            print(f"\nStaging directory preserved: {staging_dir}")


if __name__ == "__main__":
    main()
