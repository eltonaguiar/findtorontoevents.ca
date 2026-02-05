/**
 * Script to diagnose the overlapping text issue on findtorontoevents.ca
 * Run with: node diagnose_overlap.js
 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Navigate to the site
  await page.goto('https://findtorontoevents.ca/index.html', { waitUntil: 'networkidle' });
  
  // Wait for banners to load
  await page.waitForTimeout(3000);
  
  // Take screenshot
  await page.screenshot({ path: 'overlap_diagnosis.png' });
  console.log('Screenshot saved to overlap_diagnosis.png');
  
  // Analyze the FavCreators banner structure
  const analysis = await page.evaluate(() => {
    const favBanner = document.querySelector('.favcreators-promo');
    if (!favBanner) return { error: 'FavCreators banner not found' };
    
    const group = favBanner.querySelector('.group');
    const overrideDiv = favBanner.querySelector('.override-overflow');
    const tooltip = favBanner.querySelector('.absolute.top-full, [class*="absolute"][class*="right-0"]');
    const bannerText = favBanner.querySelector('.text-[10px].text-\[var\(--text-2\)\]');
    
    return {
      groupFound: !!group,
      overrideDivFound: !!overrideDiv,
      tooltipFound: !!tooltip,
      bannerTextFound: !!bannerText,
      overrideDivStyles: overrideDiv ? {
        maxWidth: window.getComputedStyle(overrideDiv).maxWidth,
        opacity: window.getComputedStyle(overrideDiv).opacity,
        width: window.getComputedStyle(overrideDiv).width,
        display: window.getComputedStyle(overrideDiv).display,
        visibility: window.getComputedStyle(overrideDiv).visibility
      } : null,
      tooltipStyles: tooltip ? {
        opacity: window.getComputedStyle(tooltip).opacity,
        visibility: window.getComputedStyle(tooltip).visibility,
        display: window.getComputedStyle(tooltip).display,
        zIndex: window.getComputedStyle(tooltip).zIndex,
        position: window.getComputedStyle(tooltip).position
      } : null,
      bannerTextContent: bannerText ? bannerText.textContent : null,
      tooltipTextContent: tooltip ? tooltip.textContent?.substring(0, 100) : null
    };
  });
  
  console.log('\n=== Analysis Results ===');
  console.log(JSON.stringify(analysis, null, 2));
  
  await browser.close();
})();
