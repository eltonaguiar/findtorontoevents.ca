/**
 * Security Audit Script for findtorontoevents.ca (Node.js version)
 * 
 * Tests:
 * 1. XSS vulnerabilities in API endpoints
 * 2. SQL injection vulnerabilities
 * 3. Admin panel exposure
 * 4. API domain restrictions
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const homedir = require('os').homedir();
const outputFile = path.join(homedir, 'audit_results.txt');

let output = '';

function log(msg) {
    console.log(msg);
    output += msg + '\n';
}

async function makeRequest(url, options = {}) {
    return new Promise((resolve) => {
        const req = https.get(url, { 
            timeout: 5000,
            headers: options.headers || {},
            ...options 
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ 
                status: res.statusCode, 
                headers: res.headers,
                data,
                success: true 
            }));
        });
        
        req.on('error', () => resolve({ success: false }));
        req.on('timeout', () => {
            req.destroy();
            resolve({ success: false, timeout: true });
        });
    });
}

async function runAudit() {
    log('=== SECURITY AUDIT ===');
    log('Date: ' + new Date().toISOString());
    log('Target: findtorontoevents.ca');
    log('');

    const baseUrl = 'https://findtorontoevents.ca';
    
    // ===== TEST 1: XSS VULNERABILITIES =====
    log('TEST 1: XSS Vulnerability Scan');
    log('--------------------------------');
    
    const xssPayloads = [
        '<script>alert("XSS")</script>',
        '"><script>alert(String.fromCharCode(88,83,83))</script>',
        "'-alert(1)-'",
        '<img src=x onerror=alert("XSS")>',
    ];
    
    const xssEndpoints = [
        '/fc/api/TLC.php?user=',
        '/fc/api/creator_news_api.php?creator_id=',
    ];
    
    let xssIssues = 0;
    for (const endpoint of xssEndpoints) {
        for (const payload of xssPayloads) {
            const url = baseUrl + endpoint + encodeURIComponent(payload);
            const res = await makeRequest(url);
            
            if (res.success && res.data && (
                res.data.includes(payload) ||
                res.data.includes('<script>') ||
                res.data.includes('alert(')
            )) {
                log(`  [!] POTENTIAL XSS: ${endpoint}`);
                xssIssues++;
            }
        }
    }
    
    if (xssIssues === 0) {
        log('  [✓] No obvious XSS vulnerabilities detected');
    } else {
        log(`  [!] Found ${xssIssues} potential XSS issues`);
    }
    
    // ===== TEST 2: SQL INJECTION =====
    log('');
    log('TEST 2: SQL Injection Scan');
    log('--------------------------------');
    
    const sqlPayloads = [
        "' OR '1'='1",
        "' OR 1=1--",
        "' UNION SELECT * FROM users--",
        "1' AND 1=1--",
    ];
    
    const sqlEndpoints = [
        '/fc/api/TLC.php?user=',
        '/fc/api/get_my_creators.php?user_id=',
    ];
    
    const sqlErrors = [
        'sql syntax',
        'mysql_fetch',
        'mysqli_error',
        'pdo exception',
        'sqlstate',
    ];
    
    let sqlIssues = 0;
    for (const endpoint of sqlEndpoints) {
        for (const payload of sqlPayloads) {
            const url = baseUrl + endpoint + encodeURIComponent(payload);
            const res = await makeRequest(url);
            
            if (res.success && res.data) {
                const dataLower = res.data.toLowerCase();
                for (const error of sqlErrors) {
                    if (dataLower.includes(error)) {
                        log(`  [!] POTENTIAL SQLi: ${endpoint} - ${error}`);
                        sqlIssues++;
                        break;
                    }
                }
            }
        }
    }
    
    if (sqlIssues === 0) {
        log('  [✓] No obvious SQL injection vulnerabilities detected');
    } else {
        log(`  [!] Found ${sqlIssues} potential SQL injection issues`);
    }
    
    // ===== TEST 3: ADMIN PANEL EXPOSURE =====
    log('');
    log('TEST 3: Admin Panel Exposure Check');
    log('--------------------------------');
    
    const adminPaths = [
        '/fc/api/admin_tools.php',
        '/fc/api/view_logs.php',
        '/fc/api/validate_tables.php',
        '/fc/api/sync_creators_table.php',
        '/fc/api/setup_tables.php',
    ];
    
    let exposedPanels = 0;
    for (const path of adminPaths) {
        const url = baseUrl + path;
        const res = await makeRequest(url);
        
        if (res.success && res.status === 200) {
            if (!res.data.includes('Unauthorized') && 
                !res.data.includes('Forbidden') &&
                !res.data.includes('login')) {
                log(`  [!] EXPOSED: ${path} (HTTP ${res.status})`);
                exposedPanels++;
            } else {
                log(`  [✓] Protected: ${path} (requires auth)`);
            }
        } else if (res.status === 401 || res.status === 403) {
            log(`  [✓] Protected: ${path} (HTTP ${res.status})`);
        } else {
            log(`  [?] Status: ${path} (HTTP ${res.status || 'Error'})`);
        }
    }
    
    // ===== TEST 4: CORS CONFIGURATION =====
    log('');
    log('TEST 4: API Domain/CORS Configuration');
    log('--------------------------------');
    
    const corsEndpoints = [
        '/fc/api/TLC.php?user=test',
        '/fc/api/creator_news_api.php',
    ];
    
    const testOrigins = [
        'https://evil.com',
        'http://localhost:3000',
    ];
    
    let corsIssues = 0;
    for (const endpoint of corsEndpoints) {
        for (const origin of testOrigins) {
            const url = baseUrl + endpoint;
            const res = await makeRequest(url, {
                headers: { 'Origin': origin }
            });
            
            if (res.success && res.headers) {
                const corsHeader = res.headers['access-control-allow-origin'];
                if (corsHeader === '*') {
                    log(`  [!] CORS ISSUE: ${endpoint} allows wildcard (*)`);
                    corsIssues++;
                }
            }
        }
    }
    
    if (corsIssues === 0) {
        log('  [✓] CORS appears properly restricted');
    }
    
    // ===== TEST 5: WEAK CREDENTIALS =====
    log('');
    log('TEST 5: Login Security Check');
    log('--------------------------------');
    
    const weakCreds = [
        { email: 'admin', password: 'admin' },
        { email: 'admin', password: 'password' },
        { email: 'bob', password: 'bob' },
    ];
    
    let weakLogins = 0;
    for (const cred of weakCreds) {
        const postData = JSON.stringify(cred);
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const res = await new Promise((resolve) => {
            const req = https.request(baseUrl + '/fc/api/login.php', options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve({ success: true, data }));
            });
            req.on('error', () => resolve({ success: false }));
            req.write(postData);
            req.end();
        });
        
        if (res.success) {
            try {
                const json = JSON.parse(res.data);
                if (json.user && json.user.role === 'admin') {
                    log(`  [!] WEAK ADMIN LOGIN: ${cred.email}/${cred.password}`);
                    weakLogins++;
                }
            } catch (e) {}
        }
    }
    
    if (weakLogins === 0) {
        log('  [✓] No weak admin credentials detected');
    }
    
    // ===== SUMMARY =====
    log('');
    log('=== SECURITY AUDIT SUMMARY ===');
    log('--------------------------------');
    
    const totalIssues = xssIssues + sqlIssues + exposedPanels + corsIssues + weakLogins;
    
    if (totalIssues === 0) {
        log('✓ No critical security issues detected in automated scan');
    } else {
        log(`! Found ${totalIssues} potential security issues:`);
        log(`  - XSS: ${xssIssues}`);
        log(`  - SQL Injection: ${sqlIssues}`);
        log(`  - Exposed Panels: ${exposedPanels}`);
        log(`  - CORS Issues: ${corsIssues}`);
        log(`  - Weak Logins: ${weakLogins}`);
    }
    
    log('');
    log('=== SECURITY RECOMMENDATIONS ===');
    log('1. Implement prepared statements for all database queries');
    log('2. Add output encoding for all user-supplied data');
    log('3. Implement rate limiting on all API endpoints');
    log('4. Use specific CORS origins instead of wildcard (*)');
    log('5. Add CSRF tokens for state-changing operations');
    log('6. Implement proper session timeout and regeneration');
    log('7. Add security headers (X-Frame-Options, CSP, etc.)');
    
    log('');
    log('=== ADMIN PASSWORD STATUS ===');
    log('Admin backdoor password updated to: adminelton2016');
    log('Location: favcreators/public/api/login.php');
    log('Location: favcreators/docs/api/login.php');
    log('');
    log('Audit complete!');

    // Save to file
    fs.writeFileSync(outputFile, output);
    log(`\nResults saved to: ${outputFile}`);
}

runAudit().catch(console.error);