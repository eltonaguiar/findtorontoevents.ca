#!/usr/bin/env python3
"""
Fix PHP 5 compatibility by replacing http_response_code() with header() calls.
Run this on all API files in favcreators/public/api/
"""

import os
import re
import sys

API_DIR = "favcreators/public/api"

# Mapping of status codes to status text
STATUS_MAP = {
    '200': 'OK',
    '204': 'No Content',
    '400': 'Bad Request',
    '401': 'Unauthorized',
    '403': 'Forbidden',
    '404': 'Not Found',
    '500': 'Internal Server Error',
    '502': 'Bad Gateway',
    '503': 'Service Unavailable',
}

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    original = content
    
    # Replace http_response_code(X) with header('HTTP/1.1 X Status')
    def replace_http_response(match):
        code = match.group(1)
        status = STATUS_MAP.get(code, 'Unknown')
        return f"header('HTTP/1.1 {code} {status}')"
    
    content = re.sub(r'http_response_code\((\d+)\)', replace_http_response, content)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed: {filepath}")
        return True
    return False

def main():
    fixed_count = 0
    
    if not os.path.exists(API_DIR):
        print(f"Error: Directory {API_DIR} not found")
        sys.exit(1)
    
    for filename in os.listdir(API_DIR):
        if filename.endswith('.php'):
            filepath = os.path.join(API_DIR, filename)
            if fix_file(filepath):
                fixed_count += 1
    
    print(f"\nTotal files fixed: {fixed_count}")

if __name__ == "__main__":
    main()