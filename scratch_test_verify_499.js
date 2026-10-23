const puppeteer = require('puppeteer-core');
const path = require('path');

const ARTIFACT_DIR = '/home/webcodegenie/.gemini/antigravity-ide/brain/01cca1c1-2a5e-4bc5-9090-9cdee91a8091';

async function verify499() {
  console.log('[VERIFY-499] Launching Google Chrome...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    defaultViewport: { width: 1280, height: 900 }
  });

  const page = await browser.newPage();

  try {
    console.log('[VERIFY-499] Navigating to http://localhost:3333 ...');
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

    // Step 3 Next -> Step 4
    await page.click('#btnStep3Next');
    await new Promise(r => setTimeout(r, 1000));

    // 1. Screenshot of the lock card inside document preview
    console.log('[VERIFY-499] Scrolling to lock card...');
    await page.evaluate(() => {
      const lockCard = document.querySelector('.notice-blur-overlay .lock-card');
      if (lockCard) lockCard.scrollIntoView({ block: 'center' });
    });
    await new Promise(r => setTimeout(r, 800));

    const lockCardPath = path.join(ARTIFACT_DIR, 'verify_lock_card_with_499.png');
    await page.screenshot({ path: lockCardPath, fullPage: false });
    console.log(`[VERIFY-499] Saved lock card screenshot: ${lockCardPath}`);

    // 2. Click the primary Tier 2 button in the lock card
    console.log('[VERIFY-499] Clicking #btnUnlockTier2Direct...');
    await page.click('#btnUnlockTier2Direct');
    await new Promise(r => setTimeout(r, 800));

    // 3. Screenshot of Razorpay modal showing ₹499 by default
    const modalPath = path.join(ARTIFACT_DIR, 'verify_modal_default_499.png');
    await page.screenshot({ path: modalPath, fullPage: false });
    console.log(`[VERIFY-499] Saved modal screenshot: ${modalPath}`);

    console.log('[VERIFY-499] Verification completed successfully!');
  } catch (err) {
    console.error('[VERIFY-499 ERROR]:', err);
  } finally {
    await browser.close();
  }
}

verify499();
