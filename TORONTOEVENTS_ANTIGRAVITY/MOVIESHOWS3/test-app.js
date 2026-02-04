const { chromium } = require('playwright');

async function testMovieShows() {
    console.log('🎬 Starting MOVIESHOWS3 Comprehensive Test\n');

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });

    const page = await context.newPage();

    // Collect console logs
    const consoleLogs = [];
    page.on('console', msg => {
        consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    });

    // Collect errors
    const errors = [];
    page.on('pageerror', error => {
        errors.push(error.message);
    });

    try {
        console.log('📍 Test 1: Loading main page...');
        await page.goto('https://findtorontoevents.ca/MOVIESHOWS3/', {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        // Wait a bit for page to settle
        await page.waitForTimeout(3000);

        // Check which HTML file is loaded
        const pageTitle = await page.title();
        console.log(`   ✅ Page Title: ${pageTitle}`);

        // Check for loading indicator
        const hasLoading = await page.locator('.loading').count();
        console.log(`   ${hasLoading > 0 ? '⚠️' : '✅'} Loading indicator: ${hasLoading > 0 ? 'VISIBLE (stuck?)' : 'Hidden'}`);

        // Check for error message
        const hasError = await page.locator('.error').count();
        console.log(`   ${hasError > 0 ? '❌' : '✅'} Error message: ${hasError > 0 ? 'VISIBLE' : 'None'}`);

        // Check if movies loaded
        const movieCount = await page.locator('.video-card').count();
        console.log(`   ${movieCount > 0 ? '✅' : '❌'} Video cards loaded: ${movieCount}`);

        // Check for iframes
        const iframeCount = await page.locator('iframe').count();
        console.log(`   ${iframeCount > 0 ? '✅' : '❌'} YouTube iframes: ${iframeCount}`);

        // Check API response
        console.log('\n📍 Test 2: Checking API...');
        const apiResponse = await page.evaluate(async () => {
            try {
                const response = await fetch('/MOVIESHOWS3/api/get-movies.php');
                const data = await response.json();
                return {
                    success: true,
                    count: data.count,
                    hasMovies: data.movies && data.movies.length > 0,
                    firstMovie: data.movies ? data.movies[0].title : null
                };
            } catch (e) {
                return { success: false, error: e.message };
            }
        });

        if (apiResponse.success) {
            console.log(`   ✅ API Response: ${apiResponse.count} movies`);
            console.log(`   ✅ First movie: ${apiResponse.firstMovie}`);
        } else {
            console.log(`   ❌ API Error: ${apiResponse.error}`);
        }

        // Check which scripts are loaded
        console.log('\n📍 Test 3: Checking loaded scripts...');
        const scripts = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('script[src]')).map(s => s.src);
        });

        const hasScrollFix = scripts.some(s => s.includes('scroll-fix.js'));
        const hasUiMinimal = scripts.some(s => s.includes('ui-minimal.js'));

        console.log(`   ${hasScrollFix ? '⚠️  OLD VERSION' : '✅ NEW VERSION'} scroll-fix.js: ${hasScrollFix ? 'LOADED' : 'Not loaded'}`);
        console.log(`   ${hasUiMinimal ? '⚠️  OLD VERSION' : '✅ NEW VERSION'} ui-minimal.js: ${hasUiMinimal ? 'LOADED' : 'Not loaded'}`);

        if (hasScrollFix || hasUiMinimal) {
            console.log('\n   ⚠️  WARNING: Old app.html is being served instead of index.html!');
        }

        // Check for unmute button
        console.log('\n📍 Test 4: Checking UI elements...');
        const unmuteBtn = await page.locator('.unmute-btn').count();
        console.log(`   ${unmuteBtn > 0 ? '✅' : '❌'} Unmute button: ${unmuteBtn > 0 ? 'Present' : 'Missing'}`);

        // Check hamburger menu
        const hamburger = await page.locator('.hamburger-btn').count();
        console.log(`   ${hamburger > 0 ? '✅' : '❌'} Hamburger menu: ${hamburger > 0 ? 'Present' : 'Missing'}`);

        // Test scroll
        if (movieCount > 1) {
            console.log('\n📍 Test 5: Testing scroll functionality...');
            await page.mouse.wheel(0, 1000);
            await page.waitForTimeout(1000);
            console.log('   ✅ Scroll executed');
        }

        // Take screenshot
        await page.screenshot({ path: 'movieshows-test.png', fullPage: false });
        console.log('\n📸 Screenshot saved: movieshows-test.png');

        // Print console logs
        console.log('\n📋 Console Logs (last 10):');
        consoleLogs.slice(-10).forEach(log => console.log(`   ${log}`));

        // Print errors
        if (errors.length > 0) {
            console.log('\n❌ JavaScript Errors:');
            errors.forEach(err => console.log(`   ${err}`));
        }

        console.log('\n✅ Test Complete!');

    } catch (error) {
        console.error('\n❌ Test Failed:', error.message);
    } finally {
        await browser.close();
    }
}

testMovieShows().catch(console.error);
