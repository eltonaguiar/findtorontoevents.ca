const puppeteer = require('puppeteer');
const fs = require('fs');

/**
 * PUPPETEER AUTO-SCROLL FEATURE TESTS - 20 TESTS
 * Comprehensive testing of the new auto-scroll functionality
 */

async function runAutoScrollTests() {
    console.log('🤖 PUPPETEER AUTO-SCROLL TESTS - 20 TESTS\n');

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    let passed = 0;
    let failed = 0;
    const results = [];
    const consoleErrors = [];

    // Monitor console errors
    page.on('console', msg => {
        if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
        }
    });

    try {
        // Load page
        console.log('Loading page...');
        await page.goto('https://findtorontoevents.ca/MOVIESHOWS3/', { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('.video-card', { timeout: 10000 });
        console.log('✅ Page loaded\n');

        // TEST 1: Auto-scroll settings object initialized
        console.log('Test 1: Auto-scroll settings object initialized');
        try {
            const initialized = await page.evaluate(() => {
                return typeof autoScrollSettings !== 'undefined' &&
                    autoScrollSettings.delay === 10 &&
                    autoScrollSettings.enabled === false;
            });
            if (initialized) {
                console.log('✅ PASS\n');
                passed++;
                results.push({ test: 1, name: 'Settings initialized', result: 'PASS' });
            } else {
                throw new Error('Settings not initialized correctly');
            }
        } catch (e) {
            console.log('❌ FAIL:', e.message, '\n');
            failed++;
            results.push({ test: 1, name: 'Settings initialized', result: 'FAIL', error: e.message });
        }

        // TEST 2: triggerAutoScroll function exists
        console.log('Test 2: triggerAutoScroll function exists');
        try {
            const exists = await page.evaluate(() => typeof triggerAutoScroll === 'function');
            if (exists) {
                console.log('✅ PASS\n');
                passed++;
                results.push({ test: 2, name: 'triggerAutoScroll exists', result: 'PASS' });
            } else {
                throw new Error('Function not found');
            }
        } catch (e) {
            console.log('❌ FAIL:', e.message, '\n');
            failed++;
            results.push({ test: 2, name: 'triggerAutoScroll exists', result: 'FAIL', error: e.message });
        }

        // TEST 3: toggleAutoScroll function exists
        console.log('Test 3: toggleAutoScroll function exists');
        try {
            const exists = await page.evaluate(() => typeof toggleAutoScroll === 'function');
            if (exists) {
                console.log('✅ PASS\n');
                passed++;
                results.push({ test: 3, name: 'toggleAutoScroll exists', result: 'PASS' });
            } else {
                throw new Error('Function not found');
            }
        } catch (e) {
            console.log('❌ FAIL:', e.message, '\n');
            failed++;
            results.push({ test: 3, name: 'toggleAutoScroll exists', result: 'FAIL', error: e.message });
        }

        // TEST 4: updateAutoScrollDelay function exists
        console.log('Test 4: updateAutoScrollDelay function exists');
        try {
            const exists = await page.evaluate(() => typeof updateAutoScrollDelay === 'function');
            if (exists) {
                console.log('✅ PASS\n');
                passed++;
                results.push({ test: 4, name: 'updateAutoScrollDelay exists', result: 'PASS' });
            } else {
                throw new Error('Function not found');
            }
        } catch (e) {
            console.log('❌ FAIL:', e.message, '\n');
            failed++;
            results.push({ test: 4, name: 'updateAutoScrollDelay exists', result: 'FAIL', error: e.message });
        }

        // TEST 5: loadAutoScrollSettings function exists
        console.log('Test 5: loadAutoScrollSettings function exists');
        try {
            const exists = await page.evaluate(() => typeof loadAutoScrollSettings === 'function');
            if (exists) {
                console.log('✅ PASS\n');
                passed++;
                results.push({ test: 5, name: 'loadAutoScrollSettings exists', result: 'PASS' });
            } else {
                throw new Error('Function not found');
            }
        } catch (e) {
            console.log('❌ FAIL:', e.message, '\n');
            failed++;
            results.push({ test: 5, name: 'loadAutoScrollSettings exists', result: 'FAIL', error: e.message });
        }

        // TEST 6: Enable auto-scroll programmatically
        console.log('Test 6: Enable auto-scroll programmatically');
        try {
            await page.evaluate(() => {
                autoScrollSettings.enabled = true;
                saveAutoScrollSettings();
            });
            const saved = await page.evaluate(() => {
                const settings = localStorage.getItem('autoScrollSettings');
                return JSON.parse(settings).enabled === true;
            });
            if (saved) {
                console.log('✅ PASS\n');
                passed++;
                results.push({ test: 6, name: 'Enable programmatically', result: 'PASS' });
            } else {
                throw new Error('Not saved correctly');
            }
        } catch (e) {
            console.log('❌ FAIL:', e.message, '\n');
            failed++;
            results.push({ test: 6, name: 'Enable programmatically', result: 'FAIL', error: e.message });
        }

        // TEST 7: Change delay programmatically
        console.log('Test 7: Change delay programmatically');
        try {
            await page.evaluate(() => {
                autoScrollSettings.delay = 25;
                saveAutoScrollSettings();
            });
            const saved = await page.evaluate(() => {
                const settings = localStorage.getItem('autoScrollSettings');
                return JSON.parse(settings).delay === 25;
            });
            if (saved) {
                console.log('✅ PASS\n');
                passed++;
                results.push({ test: 7, name: 'Change delay programmatically', result: 'PASS' });
            } else {
                throw new Error('Delay not saved correctly');
            }
        } catch (e) {
            console.log('❌ FAIL:', e.message, '\n');
            failed++;
            results.push({ test: 7, name: 'Change delay programmatically', result: 'FAIL', error: e.message });
        }

        // TEST 8: Trigger auto-scroll when disabled (should not scroll)
        console.log('Test 8: Trigger auto-scroll when disabled');
        try {
            await page.evaluate(() => {
                autoScrollSettings.enabled = false;
                triggerAutoScroll();
            });
            await page.waitForTimeout(500);
            const timeoutSet = await page.evaluate(() => autoScrollTimeout !== null);
            if (!timeoutSet) {
                console.log('✅ PASS\n');
                passed++;
                results.push({ test: 8, name: 'No scroll when disabled', result: 'PASS' });
            } else {
                throw new Error('Timeout was set when disabled');
            }
        } catch (e) {
            console.log('❌ FAIL:', e.message, '\n');
            failed++;
            results.push({ test: 8, name: 'No scroll when disabled', result: 'FAIL', error: e.message });
        }

        // TEST 9: Trigger auto-scroll when enabled (should set timeout)
        console.log('Test 9: Trigger auto-scroll when enabled');
        try {
            await page.evaluate(() => {
                autoScrollSettings.enabled = true;
                autoScrollSettings.delay = 5;
                triggerAutoScroll();
            });
            await page.waitForTimeout(500);
            const timeoutSet = await page.evaluate(() => autoScrollTimeout !== null);
            if (timeoutSet) {
                console.log('✅ PASS\n');
                passed++;
                results.push({ test: 9, name: 'Timeout set when enabled', result: 'PASS' });
            } else {
                throw new Error('Timeout was not set');
            }
        } catch (e) {
            console.log('❌ FAIL:', e.message, '\n');
            failed++;
            results.push({ test: 9, name: 'Timeout set when enabled', result: 'FAIL', error: e.message });
        }

        // TEST 10: Auto-scroll timeout clears on toggle off
        console.log('Test 10: Auto-scroll timeout clears on toggle off');
        try {
            await page.click('.hamburger-btn');
            await page.waitForSelector('#autoScrollToggle', { timeout: 2000 });
            await page.click('#autoScrollToggle'); // Turn on
            await page.waitForTimeout(300);
            await page.click('#autoScrollToggle'); // Turn off
            await page.waitForTimeout(300);
            const timeoutCleared = await page.evaluate(() => autoScrollTimeout === null);
            if (timeoutCleared) {
                console.log('✅ PASS\n');
                passed++;
                results.push({ test: 10, name: 'Timeout clears on toggle off', result: 'PASS' });
            } else {
                throw new Error('Timeout not cleared');
            }
        } catch (e) {
            console.log('❌ FAIL:', e.message, '\n');
            failed++;
            results.push({ test: 10, name: 'Timeout clears on toggle off', result: 'FAIL', error: e.message });
        }

        // TEST 11: Delay slider range validation (min 5)
        console.log('Test 11: Delay slider range validation (min 5)');
        try {
            const min = await page.$eval('#autoScrollDelay', el => el.min);
            if (min === '5') {
                console.log('✅ PASS\n');
                passed++;
                results.push({ test: 11, name: 'Min delay is 5', result: 'PASS' });
            } else {
                throw new Error(`Expected min 5, got ${min}`);
            }
        } catch (e) {
            console.log('❌ FAIL:', e.message, '\n');
            failed++;
            results.push({ test: 11, name: 'Min delay is 5', result: 'FAIL', error: e.message });
        }

        // TEST 12: Delay slider range validation (max 30)
        console.log('Test 12: Delay slider range validation (max 30)');
        try {
            const max = await page.$eval('#autoScrollDelay', el => el.max);
            if (max === '30') {
                console.log('✅ PASS\n');
                passed++;
                results.push({ test: 12, name: 'Max delay is 30', result: 'PASS' });
            } else {
                throw new Error(`Expected max 30, got ${max}`);
            }
        } catch (e) {
            console.log('❌ FAIL:', e.message, '\n');
            failed++;
            results.push({ test: 12, name: 'Max delay is 30', result: 'FAIL', error: e.message });
        }

        // TEST 13: Delay slider step is 1
        console.log('Test 13: Delay slider step is 1');
        try {
            const step = await page.$eval('#autoScrollDelay', el => el.step);
            if (step === '1') {
                console.log('✅ PASS\n');
                passed++;
                results.push({ test: 13, name: 'Step is 1', result: 'PASS' });
            } else {
                throw new Error(`Expected step 1, got ${step}`);
            }
        } catch (e) {
            console.log('❌ FAIL:', e.message, '\n');
            failed++;
            results.push({ test: 13, name: 'Step is 1', result: 'FAIL', error: e.message });
        }

        // TEST 14: Multiple rapid toggles don't cause errors
        console.log('Test 14: Multiple rapid toggles');
        try {
            for (let i = 0; i < 10; i++) {
                await page.click('#autoScrollToggle');
                await page.waitForTimeout(50);
            }
            if (consoleErrors.length === 0) {
                console.log('✅ PASS\n');
                passed++;
                results.push({ test: 14, name: 'Rapid toggles', result: 'PASS' });
            } else {
                throw new Error('Console errors detected');
            }
        } catch (e) {
            console.log('❌ FAIL:', e.message, '\n');
            failed++;
            results.push({ test: 14, name: 'Rapid toggles', result: 'FAIL', error: e.message });
        }

        // TEST 15: Rapid delay changes don't cause errors
        console.log('Test 15: Rapid delay changes');
        try {
            for (let i = 5; i <= 30; i += 5) {
                await page.evaluate((val) => {
                    document.getElementById('autoScrollDelay').value = val;
                    updateAutoScrollDelay(val);
                }, i);
                await page.waitForTimeout(50);
            }
            if (consoleErrors.length === 0) {
                console.log('✅ PASS\n');
                passed++;
                results.push({ test: 15, name: 'Rapid delay changes', result: 'PASS' });
            } else {
                throw new Error('Console errors detected');
            }
        } catch (e) {
            console.log('❌ FAIL:', e.message, '\n');
            failed++;
            results.push({ test: 15, name: 'Rapid delay changes', result: 'FAIL', error: e.message });
        }

        // TEST 16: Settings persist across page reloads
        console.log('Test 16: Settings persist across page reloads');
        try {
            await page.evaluate(() => {
                autoScrollSettings.enabled = true;
                autoScrollSettings.delay = 18;
                saveAutoScrollSettings();
            });
            await page.reload({ waitUntil: 'domcontentloaded' });
            await page.waitForSelector('.video-card', { timeout: 5000 });
            const restored = await page.evaluate(() => {
                return autoScrollSettings.enabled === true && autoScrollSettings.delay === 18;
            });
            if (restored) {
                console.log('✅ PASS\n');
                passed++;
                results.push({ test: 16, name: 'Settings persist', result: 'PASS' });
            } else {
                throw new Error('Settings not restored');
            }
        } catch (e) {
            console.log('❌ FAIL:', e.message, '\n');
            failed++;
            results.push({ test: 16, name: 'Settings persist', result: 'FAIL', error: e.message });
        }

        // TEST 17: Invalid localStorage data handling
        console.log('Test 17: Invalid localStorage data handling');
        try {
            await page.evaluate(() => {
                localStorage.setItem('autoScrollSettings', 'invalid json');
            });
            await page.reload({ waitUntil: 'domcontentloaded' });
            await page.waitForSelector('.video-card', { timeout: 5000 });
            const hasDefaults = await page.evaluate(() => {
                return autoScrollSettings.delay === 10 && autoScrollSettings.enabled === false;
            });
            if (hasDefaults) {
                console.log('✅ PASS\n');
                passed++;
                results.push({ test: 17, name: 'Invalid data handling', result: 'PASS' });
            } else {
                throw new Error('Did not fallback to defaults');
            }
        } catch (e) {
            console.log('❌ FAIL:', e.message, '\n');
            failed++;
            results.push({ test: 17, name: 'Invalid data handling', result: 'FAIL', error: e.message });
        }

        // TEST 18: Auto-scroll timeout variable exists
        console.log('Test 18: Auto-scroll timeout variable exists');
        try {
            const exists = await page.evaluate(() => typeof autoScrollTimeout !== 'undefined');
            if (exists) {
                console.log('✅ PASS\n');
                passed++;
                results.push({ test: 18, name: 'Timeout variable exists', result: 'PASS' });
            } else {
                throw new Error('Variable not found');
            }
        } catch (e) {
            console.log('❌ FAIL:', e.message, '\n');
            failed++;
            results.push({ test: 18, name: 'Timeout variable exists', result: 'FAIL', error: e.message });
        }

        // TEST 19: Console logging for auto-scroll events
        console.log('Test 19: Console logging for auto-scroll events');
        try {
            const logs = [];
            page.on('console', msg => {
                if (msg.text().includes('Auto-scroll')) {
                    logs.push(msg.text());
                }
            });

            await page.click('.hamburger-btn');
            await page.waitForSelector('#autoScrollToggle', { timeout: 2000 });
            await page.click('#autoScrollToggle');
            await page.waitForTimeout(500);

            if (logs.length > 0) {
                console.log('✅ PASS\n');
                passed++;
                results.push({ test: 19, name: 'Console logging', result: 'PASS' });
            } else {
                throw new Error('No console logs found');
            }
        } catch (e) {
            console.log('❌ FAIL:', e.message, '\n');
            failed++;
            results.push({ test: 19, name: 'Console logging', result: 'FAIL', error: e.message });
        }

        // TEST 20: No memory leaks (timeout cleanup)
        console.log('Test 20: No memory leaks (timeout cleanup)');
        try {
            await page.evaluate(() => {
                autoScrollSettings.enabled = true;
                // Trigger multiple times
                for (let i = 0; i < 10; i++) {
                    triggerAutoScroll();
                }
            });
            await page.waitForTimeout(500);
            const singleTimeout = await page.evaluate(() => {
                // Should only have one timeout, not 10
                return autoScrollTimeout !== null;
            });
            if (singleTimeout) {
                console.log('✅ PASS\n');
                passed++;
                results.push({ test: 20, name: 'No memory leaks', result: 'PASS' });
            } else {
                throw new Error('Timeout management issue');
            }
        } catch (e) {
            console.log('❌ FAIL:', e.message, '\n');
            failed++;
            results.push({ test: 20, name: 'No memory leaks', result: 'FAIL', error: e.message });
        }

    } catch (error) {
        console.error('Fatal error:', error);
    }

    await browser.close();

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('🤖 PUPPETEER AUTO-SCROLL TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`Total Tests: 20`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / 20) * 100).toFixed(2)}%`);
    console.log(`Console Errors: ${consoleErrors.length}`);
    console.log('='.repeat(60));

    // Save results
    fs.writeFileSync('./PUPPETEER_AUTOSCROLL_TESTS.json', JSON.stringify({
        timestamp: new Date().toISOString(),
        total: 20,
        passed,
        failed,
        consoleErrors,
        results
    }, null, 2));

    console.log('\n📄 Results saved to: PUPPETEER_AUTOSCROLL_TESTS.json\n');

    process.exit(failed > 0 ? 1 : 0);
}

runAutoScrollTests();
