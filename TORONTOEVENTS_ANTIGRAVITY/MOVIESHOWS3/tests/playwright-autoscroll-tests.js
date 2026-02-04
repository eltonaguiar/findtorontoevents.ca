const { chromium } = require('playwright');

/**
 * PLAYWRIGHT AUTO-SCROLL FEATURE TESTS - 20 TESTS
 * Comprehensive testing of the new auto-scroll functionality
 */

async function runAutoScrollTests() {
    console.log('🎭 PLAYWRIGHT AUTO-SCROLL TESTS - 20 TESTS\n');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    let passed = 0;
    let failed = 0;
    const results = [];

    try {
        // Load page
        console.log('Loading page...');
        await page.goto('https://findtorontoevents.ca/MOVIESHOWS3/', { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('.video-card', { timeout: 10000 });
        console.log('✅ Page loaded\n');

        // TEST 1: Auto-scroll toggle exists
        console.log('Test 1: Auto-scroll toggle exists');
        try {
            await page.click('.hamburger-btn');
            await page.waitForSelector('#autoScrollToggle', { timeout: 2000 });
            console.log('✅ PASS\n');
            passed++;
            results.push({ test: 1, name: 'Toggle exists', result: 'PASS' });
        } catch (e) {
            console.log('❌ FAIL:', e.message, '\n');
            failed++;
            results.push({ test: 1, name: 'Toggle exists', result: 'FAIL', error: e.message });
        }

        // TEST 2: Delay slider exists
        console.log('Test 2: Delay slider exists');
        try {
            const slider = await page.$('#autoScrollDelay');
            if (slider) {
                console.log('✅ PASS\n');
                passed++;
                results.push({ test: 2, name: 'Delay slider exists', result: 'PASS' });
            } else {
                throw new Error('Slider not found');
            }
        } catch (e) {
            console.log('❌ FAIL:', e.message, '\n');
            failed++;
            results.push({ test: 2, name: 'Delay slider exists', result: 'FAIL', error: e.message });
        }

        // TEST 3: Default delay is 10 seconds
        console.log('Test 3: Default delay is 10 seconds');
        try {
            const delayValue = await page.textContent('#delayValue');
            if (delayValue === '10') {
                console.log('✅ PASS\n');
                passed++;
                results.push({ test: 3, name: 'Default delay 10s', result: 'PASS' });
            } else {
                throw new Error(`Expected 10, got ${delayValue}`);
            }
        } catch (e) {
            console.log('❌ FAIL:', e.message, '\n');
            failed++;
            results.push({ test: 3, name: 'Default delay 10s', result: 'FAIL', error: e.message });
        }

        // TEST 4: Toggle auto-scroll ON
        console.log('Test 4: Toggle auto-scroll ON');
        try {
            await page.click('#autoScrollToggle');
            await page.waitForTimeout(500);
            const isChecked = await page.isChecked('#autoScrollToggle');
            if (isChecked) {
                console.log('✅ PASS\n');
                passed++;
                results.push({ test: 4, name: 'Toggle ON', result: 'PASS' });
            } else {
                throw new Error('Toggle not checked');
            }
        } catch (e) {
            console.log('❌ FAIL:', e.message, '\n');
            failed++;
            results.push({ test: 4, name: 'Toggle ON', result: 'FAIL', error: e.message });
        }

        // TEST 5: Delay container visible when enabled
        console.log('Test 5: Delay container visible when enabled');
        try {
            const isVisible = await page.isVisible('#autoScrollDelayContainer');
            if (isVisible) {
                console.log('✅ PASS\n');
                passed++;
                results.push({ test: 5, name: 'Delay container visible', result: 'PASS' });
            } else {
                throw new Error('Delay container not visible');
            }
        } catch (e) {
            console.log('❌ FAIL:', e.message, '\n');
            failed++;
            results.push({ test: 5, name: 'Delay container visible', result: 'FAIL', error: e.message });
        }

        // TEST 6: Change delay to 15 seconds
        console.log('Test 6: Change delay to 15 seconds');
        try {
            await page.fill('#autoScrollDelay', '15');
            await page.waitForTimeout(300);
            const delayValue = await page.textContent('#delayValue');
            if (delayValue === '15') {
                console.log('✅ PASS\n');
                passed++;
                results.push({ test: 6, name: 'Change delay to 15s', result: 'PASS' });
            } else {
                throw new Error(`Expected 15, got ${delayValue}`);
            }
        } catch (e) {
            console.log('❌ FAIL:', e.message, '\n');
            failed++;
            results.push({ test: 6, name: 'Change delay to 15s', result: 'FAIL', error: e.message });
        }

        // TEST 7: Settings persist in localStorage
        console.log('Test 7: Settings persist in localStorage');
        try {
            const settings = await page.evaluate(() => {
                return localStorage.getItem('autoScrollSettings');
            });
            if (settings && settings.includes('"enabled":true') && settings.includes('"delay":15')) {
                console.log('✅ PASS\n');
                passed++;
                results.push({ test: 7, name: 'Settings persist', result: 'PASS' });
            } else {
                throw new Error('Settings not persisted correctly');
            }
        } catch (e) {
            console.log('❌ FAIL:', e.message, '\n');
            failed++;
            results.push({ test: 7, name: 'Settings persist', result: 'FAIL', error: e.message });
        }

        // TEST 8: Toggle auto-scroll OFF
        console.log('Test 8: Toggle auto-scroll OFF');
        try {
            await page.click('#autoScrollToggle');
            await page.waitForTimeout(500);
            const isChecked = await page.isChecked('#autoScrollToggle');
            if (!isChecked) {
                console.log('✅ PASS\n');
                passed++;
                results.push({ test: 8, name: 'Toggle OFF', result: 'PASS' });
            } else {
                throw new Error('Toggle still checked');
            }
        } catch (e) {
            console.log('❌ FAIL:', e.message, '\n');
            failed++;
            results.push({ test: 8, name: 'Toggle OFF', result: 'FAIL', error: e.message });
        }

        // TEST 9: Delay container hidden when disabled
        console.log('Test 9: Delay container hidden when disabled');
        try {
            const isVisible = await page.isVisible('#autoScrollDelayContainer');
            if (!isVisible) {
                console.log('✅ PASS\n');
                passed++;
                results.push({ test: 9, name: 'Delay container hidden', result: 'PASS' });
            } else {
                throw new Error('Delay container still visible');
            }
        } catch (e) {
            console.log('❌ FAIL:', e.message, '\n');
            failed++;
            results.push({ test: 9, name: 'Delay container hidden', result: 'FAIL', error: e.message });
        }

        // TEST 10: Minimum delay value (5 seconds)
        console.log('Test 10: Minimum delay value (5 seconds)');
        try {
            await page.click('#autoScrollToggle'); // Enable again
            await page.waitForTimeout(300);
            await page.fill('#autoScrollDelay', '5');
            await page.waitForTimeout(300);
            const delayValue = await page.textContent('#delayValue');
            if (delayValue === '5') {
                console.log('✅ PASS\n');
                passed++;
                results.push({ test: 10, name: 'Min delay 5s', result: 'PASS' });
            } else {
                throw new Error(`Expected 5, got ${delayValue}`);
            }
        } catch (e) {
            console.log('❌ FAIL:', e.message, '\n');
            failed++;
            results.push({ test: 10, name: 'Min delay 5s', result: 'FAIL', error: e.message });
        }

        // TEST 11: Maximum delay value (30 seconds)
        console.log('Test 11: Maximum delay value (30 seconds)');
        try {
            await page.fill('#autoScrollDelay', '30');
            await page.waitForTimeout(300);
            const delayValue = await page.textContent('#delayValue');
            if (delayValue === '30') {
                console.log('✅ PASS\n');
                passed++;
                results.push({ test: 11, name: 'Max delay 30s', result: 'PASS' });
            } else {
                throw new Error(`Expected 30, got ${delayValue}`);
            }
        } catch (e) {
            console.log('❌ FAIL:', e.message, '\n');
            failed++;
            results.push({ test: 11, name: 'Max delay 30s', result: 'FAIL', error: e.message });
        }

        // TEST 12: Settings restore on page reload
        console.log('Test 12: Settings restore on page reload');
        try {
            await page.reload({ waitUntil: 'domcontentloaded' });
            await page.waitForSelector('.hamburger-btn', { timeout: 5000 });
            await page.click('.hamburger-btn');
            await page.waitForSelector('#autoScrollToggle', { timeout: 2000 });
            const isChecked = await page.isChecked('#autoScrollToggle');
            const delayValue = await page.textContent('#delayValue');
            if (isChecked && delayValue === '30') {
                console.log('✅ PASS\n');
                passed++;
                results.push({ test: 12, name: 'Settings restore', result: 'PASS' });
            } else {
                throw new Error('Settings not restored');
            }
        } catch (e) {
            console.log('❌ FAIL:', e.message, '\n');
            failed++;
            results.push({ test: 12, name: 'Settings restore', result: 'FAIL', error: e.message });
        }

        // TEST 13: Auto-scroll function exists
        console.log('Test 13: Auto-scroll function exists');
        try {
            const hasFunction = await page.evaluate(() => {
                return typeof triggerAutoScroll === 'function';
            });
            if (hasFunction) {
                console.log('✅ PASS\n');
                passed++;
                results.push({ test: 13, name: 'Function exists', result: 'PASS' });
            } else {
                throw new Error('triggerAutoScroll function not found');
            }
        } catch (e) {
            console.log('❌ FAIL:', e.message, '\n');
            failed++;
            results.push({ test: 13, name: 'Function exists', result: 'FAIL', error: e.message });
        }

        // TEST 14: Auto-scroll settings object exists
        console.log('Test 14: Auto-scroll settings object exists');
        try {
            const hasSettings = await page.evaluate(() => {
                return typeof autoScrollSettings === 'object' && autoScrollSettings !== null;
            });
            if (hasSettings) {
                console.log('✅ PASS\n');
                passed++;
                results.push({ test: 14, name: 'Settings object exists', result: 'PASS' });
            } else {
                throw new Error('autoScrollSettings object not found');
            }
        } catch (e) {
            console.log('❌ FAIL:', e.message, '\n');
            failed++;
            results.push({ test: 14, name: 'Settings object exists', result: 'FAIL', error: e.message });
        }

        // TEST 15: Toggle switch styling
        console.log('Test 15: Toggle switch styling');
        try {
            const hasStyle = await page.evaluate(() => {
                const toggle = document.querySelector('.toggle-slider');
                const styles = window.getComputedStyle(toggle);
                return styles.borderRadius !== '0px';
            });
            if (hasStyle) {
                console.log('✅ PASS\n');
                passed++;
                results.push({ test: 15, name: 'Toggle styling', result: 'PASS' });
            } else {
                throw new Error('Toggle not styled');
            }
        } catch (e) {
            console.log('❌ FAIL:', e.message, '\n');
            failed++;
            results.push({ test: 15, name: 'Toggle styling', result: 'FAIL', error: e.message });
        }

        // TEST 16: Delay slider styling
        console.log('Test 16: Delay slider styling');
        try {
            const hasStyle = await page.evaluate(() => {
                const slider = document.querySelector('.delay-slider');
                return slider && slider.type === 'range';
            });
            if (hasStyle) {
                console.log('✅ PASS\n');
                passed++;
                results.push({ test: 16, name: 'Slider styling', result: 'PASS' });
            } else {
                throw new Error('Slider not styled correctly');
            }
        } catch (e) {
            console.log('❌ FAIL:', e.message, '\n');
            failed++;
            results.push({ test: 16, name: 'Slider styling', result: 'FAIL', error: e.message });
        }

        // TEST 17: Menu divider exists
        console.log('Test 17: Menu divider exists');
        try {
            const hasDivider = await page.$('.menu-divider');
            if (hasDivider) {
                console.log('✅ PASS\n');
                passed++;
                results.push({ test: 17, name: 'Menu divider exists', result: 'PASS' });
            } else {
                throw new Error('Menu divider not found');
            }
        } catch (e) {
            console.log('❌ FAIL:', e.message, '\n');
            failed++;
            results.push({ test: 17, name: 'Menu divider exists', result: 'FAIL', error: e.message });
        }

        // TEST 18: Setting icons display
        console.log('Test 18: Setting icons display');
        try {
            const icons = await page.$$('.setting-icon');
            if (icons.length >= 2) {
                console.log('✅ PASS\n');
                passed++;
                results.push({ test: 18, name: 'Setting icons display', result: 'PASS' });
            } else {
                throw new Error('Setting icons not found');
            }
        } catch (e) {
            console.log('❌ FAIL:', e.message, '\n');
            failed++;
            results.push({ test: 18, name: 'Setting icons display', result: 'FAIL', error: e.message });
        }

        // TEST 19: Clear localStorage and verify reset
        console.log('Test 19: Clear localStorage and verify reset');
        try {
            await page.evaluate(() => {
                localStorage.removeItem('autoScrollSettings');
            });
            await page.reload({ waitUntil: 'domcontentloaded' });
            await page.waitForSelector('.hamburger-btn', { timeout: 5000 });
            await page.click('.hamburger-btn');
            await page.waitForSelector('#autoScrollToggle', { timeout: 2000 });
            const isChecked = await page.isChecked('#autoScrollToggle');
            const delayValue = await page.textContent('#delayValue');
            if (!isChecked && delayValue === '10') {
                console.log('✅ PASS\n');
                passed++;
                results.push({ test: 19, name: 'Reset to defaults', result: 'PASS' });
            } else {
                throw new Error('Did not reset to defaults');
            }
        } catch (e) {
            console.log('❌ FAIL:', e.message, '\n');
            failed++;
            results.push({ test: 19, name: 'Reset to defaults', result: 'FAIL', error: e.message });
        }

        // TEST 20: No JavaScript errors
        console.log('Test 20: No JavaScript errors');
        try {
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));

            // Perform various actions
            await page.click('#autoScrollToggle');
            await page.waitForTimeout(300);
            await page.fill('#autoScrollDelay', '20');
            await page.waitForTimeout(300);
            await page.click('#autoScrollToggle');
            await page.waitForTimeout(300);

            if (errors.length === 0) {
                console.log('✅ PASS\n');
                passed++;
                results.push({ test: 20, name: 'No JS errors', result: 'PASS' });
            } else {
                throw new Error(`Found ${errors.length} errors: ${errors.join(', ')}`);
            }
        } catch (e) {
            console.log('❌ FAIL:', e.message, '\n');
            failed++;
            results.push({ test: 20, name: 'No JS errors', result: 'FAIL', error: e.message });
        }

    } catch (error) {
        console.error('Fatal error:', error);
    }

    await browser.close();

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('🎭 PLAYWRIGHT AUTO-SCROLL TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`Total Tests: 20`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / 20) * 100).toFixed(2)}%`);
    console.log('='.repeat(60));

    // Save results
    const fs = require('fs');
    fs.writeFileSync('./PLAYWRIGHT_AUTOSCROLL_TESTS.json', JSON.stringify({
        timestamp: new Date().toISOString(),
        total: 20,
        passed,
        failed,
        results
    }, null, 2));

    console.log('\n📄 Results saved to: PLAYWRIGHT_AUTOSCROLL_TESTS.json\n');

    process.exit(failed > 0 ? 1 : 0);
}

runAutoScrollTests();
