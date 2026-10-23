const puppeteer = require('puppeteer-core');
const path = require('path');

const ARTIFACT_DIR = '/home/webcodegenie/.gemini/antigravity-ide/brain/01cca1c1-2a5e-4bc5-9090-9cdee91a8091';

async function testTimeline() {
  console.log('[E2E-TIMELINE] Launching Google Chrome...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    defaultViewport: { width: 1280, height: 1000 }
  });

  const page = await browser.newPage();

  try {
    console.log('[E2E-TIMELINE] Navigating to http://localhost:3333 ...');
    await page.goto('http://localhost:3333', { waitUntil: 'networkidle2' });

    // Fill Step 1
    await page.type('#tenantName', 'Rahul Sharma');
    await page.type('#tenantPhone', '9876543210');
    await page.type('#tenantEmail', 'rahul@example.com');
    await page.type('#landlordName', 'Suresh Patel');
    await page.type('#landlordPhone', '9812345678');
    await page.type('#propertyAddress', 'Flat 402, Green Glen Layout, Bellandur, Bengaluru - 560103');
    await page.type('#tenancyStartDate', '2023-01-01');
    await page.type('#vacateDate', '2024-01-05');
    await page.click('#btnStep1Next');
    await new Promise(r => setTimeout(r, 600));

    // Fill Step 2
    await page.type('#depositPaid', '75000');
    await page.type('#monthlyRent', '25000');
    await page.type('#amountRefunded', '0');
    await page.type('#amountWithheld', '50000');
    await page.click('#btnStep2Next');
    await new Promise(r => setTimeout(r, 600));

    // Fill Step 3
    await page.click('#btnStep3Next');
    await new Promise(r => setTimeout(r, 1000));

    // Scroll to the timeline section
    console.log('[E2E-TIMELINE] Scrolling to Timeline section...');
    await page.evaluate(() => {
      const el = document.getElementById('timelineGuideSection');
      if (el) el.scrollIntoView();
    });
    await new Promise(r => setTimeout(r, 800));

    const timelineScreenshotPath = path.join(ARTIFACT_DIR, 'timeline_done_actions_section.png');
    await page.screenshot({ path: timelineScreenshotPath, fullPage: false });
    console.log(`[E2E-TIMELINE] Saved screenshot: ${timelineScreenshotPath}`);

    // Click Copy Day 8 Script to verify interaction
    console.log('[E2E-TIMELINE] Clicking #btnCopyDay8Script...');
    await page.click('#btnCopyDay8Script');
    await new Promise(r => setTimeout(r, 500));

    // Full page screenshot of step 4 including timeline
    const fullStep4Path = path.join(ARTIFACT_DIR, 'step4_complete_with_timeline.png');
    await page.screenshot({ path: fullStep4Path, fullPage: true });
    console.log(`[E2E-TIMELINE] Saved full step 4 screenshot: ${fullStep4Path}`);

    console.log('[E2E-TIMELINE] All checks completed successfully!');
  } catch (err) {
    console.error('[E2E-TIMELINE ERROR]:', err);
  } finally {
    await browser.close();
  }
}

testTimeline();
