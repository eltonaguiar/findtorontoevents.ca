import winreg

key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r'Environment')
for n in ['DB_SERVER_EVENTS_PASSWORD', 'DB_PASS_SERVER_FAVCREATORS', 'DBPASS_MOVIES']:
    val, regtype = winreg.QueryValueEx(key, n)
    types = {1: 'REG_SZ', 2: 'REG_EXPAND_SZ'}
    print(f'{n}:')
    print(f'  type: {types.get(regtype, str(regtype))}')
    print(f'  length: {len(val)}')
    print(f'  repr: {repr(val)}')
    # Show hex for spotting encoding issues
    hexstr = val.encode('utf-8').hex()
    print(f'  hex: {hexstr}')
    # Generate PHP-safe single-quoted version
    php_safe = val.replace("\\", "\\\\").replace("'", "\\'")
    print(f'  php_safe: {repr(php_safe)}')
    print()
winreg.CloseKey(key)
