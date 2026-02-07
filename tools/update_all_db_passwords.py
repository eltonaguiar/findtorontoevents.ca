#!/usr/bin/env python3
"""
Update all database passwords across the entire codebase.
Reads NEW passwords from Windows registry environment variables.
Updates .env files, PHP config files, and hardcoded credentials.
"""
import winreg
import os
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parent.parent

# 1. Read new passwords from Windows registry
key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r'Environment')
NEW_EVENTS_PW = winreg.QueryValueEx(key, 'DB_SERVER_EVENTS_PASSWORD')[0]
NEW_FAVCREATORS_PW = winreg.QueryValueEx(key, 'DB_PASS_SERVER_FAVCREATORS')[0]
NEW_MOVIES_PW = winreg.QueryValueEx(key, 'DBPASS_MOVIES')[0]
winreg.CloseKey(key)

print("New passwords loaded from registry:")
print(f"  ejaguiar1_events:          {NEW_EVENTS_PW[:4]}...{NEW_EVENTS_PW[-4:]} (len={len(NEW_EVENTS_PW)})")
print(f"  ejaguiar1_favcreators:     {NEW_FAVCREATORS_PW[:4]}...{NEW_FAVCREATORS_PW[-4:]} (len={len(NEW_FAVCREATORS_PW)})")
print(f"  ejaguiar1_tvmoviestrailers:{NEW_MOVIES_PW[:4]}...{NEW_MOVIES_PW[-4:]} (len={len(NEW_MOVIES_PW)})")
print()

# Old passwords to replace
OLD_EVENTS_PASSWORDS = ['event123']
OLD_FAVCREATORS_PASSWORDS = ['Solid-Kitten-92-Brave-Vessel']
OLD_MOVIES_PASSWORDS = ['virus2016']
OLD_DEBUGLOG_PASSWORDS = ['debuglog']

changes = []

def update_file(rel_path, replacements):
    """Replace old passwords with new ones in a file. Returns True if changed."""
    full_path = WORKSPACE / rel_path
    if not full_path.exists():
        return False
    
    content = full_path.read_text(encoding='utf-8', errors='replace')
    original = content
    
    for old, new in replacements:
        if old in content:
            content = content.replace(old, new)
    
    if content != original:
        full_path.write_text(content, encoding='utf-8')
        changes.append(str(rel_path))
        return True
    return False


# ============================================================
# 2. Update .env files
# ============================================================
print("=== Updating .env files ===")

# api/events/.env - ejaguiar1_events password
update_file('api/events/.env', [
    ('event123', NEW_EVENTS_PW),
])

# favcreators/public/api/.env - ejaguiar1_favcreators password + remove debuglog
update_file('favcreators/public/api/.env', [
    ('Solid-Kitten-92-Brave-Vessel', NEW_FAVCREATORS_PW),
])

# favcreators/docs/api/.env - duplicate of above
update_file('favcreators/docs/api/.env', [
    ('Solid-Kitten-92-Brave-Vessel', NEW_FAVCREATORS_PW),
])

# ============================================================
# 3. Update PHP config files with env-var fallback defaults
# ============================================================
print("=== Updating PHP config files ===")

# api/auth_db_config.php - favcreators password (hardcoded default)
update_file('api/auth_db_config.php', [
    ('Solid-Kitten-92-Brave-Vessel', NEW_FAVCREATORS_PW),
])

# favcreators/public/api/events_db_config.php - events password (hardcoded default)
update_file('favcreators/public/api/events_db_config.php', [
    ('event123', NEW_EVENTS_PW),
])

# favcreators/public/api/config.php - favcreators (may have empty password)
update_file('favcreators/public/api/config.php', [
    ('Solid-Kitten-92-Brave-Vessel', NEW_FAVCREATORS_PW),
])

# ============================================================
# 4. Update MOVIESHOWS3 files (ejaguiar1_tvmoviestrailers)
# ============================================================
print("=== Updating MOVIESHOWS3 files ===")

ms3_files = [
    'TORONTOEVENTS_ANTIGRAVITY/MOVIESHOWS3/api/db-config.php',
    'TORONTOEVENTS_ANTIGRAVITY/MOVIESHOWS3/api/db_connect.php',
    'TORONTOEVENTS_ANTIGRAVITY/MOVIESHOWS3/init-database.php',
    'TORONTOEVENTS_ANTIGRAVITY/MOVIESHOWS3/verify-database.php',
]
for f in ms3_files:
    update_file(f, [
        ('virus2016', NEW_MOVIES_PW),
        ('Solid-Kitten-92-Brave-Vessel', NEW_FAVCREATORS_PW),
    ])

# ============================================================
# 5. Update MOVIESHOWS2 files (ejaguiar1_tvmoviestrailers)
# ============================================================
print("=== Updating MOVIESHOWS2 files ===")

ms2_files = [
    'TORONTOEVENTS_ANTIGRAVITY/MOVIESHOWS2/api/db-config.php',
    'TORONTOEVENTS_ANTIGRAVITY/MOVIESHOWS2/init-database.php',
    'TORONTOEVENTS_ANTIGRAVITY/MOVIESHOWS2/verify-database.php',
    'TORONTOEVENTS_ANTIGRAVITY/MOVIESHOWS2/log/index.php',
    'TORONTOEVENTS_ANTIGRAVITY/MOVIESHOWS2/log/api_status.php',
    'TORONTOEVENTS_ANTIGRAVITY/MOVIESHOWS2/fetch_new_content.php',
    'TORONTOEVENTS_ANTIGRAVITY/MOVIESHOWS2/admin_search.php',
    'TORONTOEVENTS_ANTIGRAVITY/MOVIESHOWS2/admin_fetch_year.php',
    'TORONTOEVENTS_ANTIGRAVITY/MOVIESHOWS2/admin_add_single.php',
]
for f in ms2_files:
    update_file(f, [('virus2016', NEW_MOVIES_PW)])

# ============================================================
# 6. Update MOVIESHOWS (v1) files
# ============================================================
print("=== Updating MOVIESHOWS (v1) files ===")

ms1_files = [
    'TORONTOEVENTS_ANTIGRAVITY/MOVIESHOWS/api/db-config.php',
    'TORONTOEVENTS_ANTIGRAVITY/MOVIESHOWS/init-database.php',
    'TORONTOEVENTS_ANTIGRAVITY/MOVIESHOWS/verify-database.php',
]
for f in ms1_files:
    update_file(f, [('virus2016', NEW_MOVIES_PW)])

# ============================================================
# 7. Update root-level movieshows files
# ============================================================
print("=== Updating root movieshows files ===")

root_ms_files = [
    'movieshows2/log/index.php',
    'MOVIESHOWS/populate_tmdb.php',
    'MOVIESHOWS/inspect_db.php',
]
for f in root_ms_files:
    update_file(f, [('virus2016', NEW_MOVIES_PW)])

# ============================================================
# 8. Catch any remaining files with old passwords
# ============================================================
print("=== Scanning for any remaining old passwords ===")

all_old_passwords = {
    'event123': ('ejaguiar1_events', NEW_EVENTS_PW),
    'Solid-Kitten-92-Brave-Vessel': ('ejaguiar1_favcreators', NEW_FAVCREATORS_PW),
    'virus2016': ('ejaguiar1_tvmoviestrailers', NEW_MOVIES_PW),
}

# Walk through all PHP and env files looking for remaining old passwords
scan_extensions = {'.php', '.env', '.ini', '.conf', '.json'}
skip_dirs = {'.git', 'node_modules', '.next', 'test-results', '__pycache__'}
remaining = []

for root, dirs, files in os.walk(WORKSPACE):
    dirs[:] = [d for d in dirs if d not in skip_dirs]
    for fname in files:
        ext = Path(fname).suffix.lower()
        if ext not in scan_extensions:
            continue
        fpath = Path(root) / fname
        try:
            content = fpath.read_text(encoding='utf-8', errors='replace')
        except:
            continue
        for old_pw, (db_name, new_pw) in all_old_passwords.items():
            if old_pw in content:
                rel = fpath.relative_to(WORKSPACE)
                remaining.append((str(rel), db_name, old_pw))
                # Auto-fix
                content = content.replace(old_pw, new_pw)
                fpath.write_text(content, encoding='utf-8')
                changes.append(f"{rel} (scan)")

if remaining:
    print(f"  Found and fixed {len(remaining)} additional files:")
    for path, db, old in remaining:
        print(f"    {path} ({db})")
else:
    print("  No remaining old passwords found.")

# ============================================================
# Summary
# ============================================================
print()
print("=" * 60)
print(f"TOTAL FILES UPDATED: {len(changes)}")
print("=" * 60)
for c in sorted(set(changes)):
    print(f"  {c}")
print()
print("Next: Deploy all updated files to FTP server.")
