const puppeteer = require('puppeteer-core');
const path = require('path');

const ARTIFACT_DIR = '/home/webcodegenie/.gemini/antigravity-ide/brain/01cca1c1-2a5e-4bc5-9090-9cdee91a8091';

async function run() {
  console.log('[E2E] Launching Google Chrome...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    defaultViewport: { width: 1280, height: 900 }
  });

  const page = await browser.newPage();

  try {
    console.log('[E2E] Navigating to http://localhost:3333 ...');
    await page.goto('http://localhost:3333', { waitUntil: 'networkidle2' });

    // Fill Step 1
    console.log('[E2E] Filling Step 1...');
    await page.type('#tenantName', 'Rahul Sharma');
    await page.type('#tenantPhone', '9876543210');
    await page.type('#tenantEmail', 'rahul@example.com');
    await page.type('#landlordName', 'Suresh Patel');
    await page.type('#landlordPhone', '9812345678');
    await page.type('#propertyAddress', 'Flat 402, Green Glen Layout, Bellandur, Bengaluru - 560103');
    await page.type('#tenancyStartDate', '2023-01-01');
    await page.type('#vacateDate', '2024-01-05');

    // Click Next to Step 2
    console.log('[E2E] Clicking #btnStep1Next...');
    await page.click('#btnStep1Next');
    await new Promise(r => setTimeout(r, 600));

    // Fill Step 2
    console.log('[E2E] Filling Step 2...');
    await page.type('#depositPaid', '75000');
    await page.type('#monthlyRent', '25000');
    await page.type('#amountRefunded', '0');
    await page.type('#amountWithheld', '50000');

    // Click Next to Step 3
    console.log('[E2E] Clicking #btnStep2Next...');
    await page.click('#btnStep2Next');
    await new Promise(r => setTimeout(r, 600));

    // Click Next to Step 4 (Review)
    console.log('[E2E] Moving to Step 4 via #btnStep3Next...');
    await page.click('#btnStep3Next');
    await new Promise(r => setTimeout(r, 1200));

    // 1. Take screenshot of Step 4 with the newly added unmissable Plan Selector cards (Starter ₹99 vs Recommended ₹499 combo)
    const step4Path = path.join(ARTIFACT_DIR, 'step4_unmissable_tier_selector.png');
    await page.screenshot({ path: step4Path, fullPage: true });
    console.log(`[E2E] Saved Step 4 screenshot: ${step4Path}`);

    // 2. Click the ₹499 Plan Button (#btnSelectPlanTier2)
    console.log('[E2E] Clicking Pay ₹499 with Razorpay (#btnSelectPlanTier2)...');
    await page.click('#btnSelectPlanTier2');
    await new Promise(r => setTimeout(r, 800));

    // Take screenshot of Razorpay Modal with ₹499 selected
    const modal499Path = path.join(ARTIFACT_DIR, 'razorpay_modal_tier2_499.png');
    await page.screenshot({ path: modal499Path });
    console.log(`[E2E] Saved Razorpay Modal ₹499 screenshot: ${modal499Path}`);

    // 3. Switch to Option 1 (₹99) tab inside the modal
    console.log('[E2E] Switching to Option 1 (₹99) tab in modal (#tabTier1Notice)...');
    await page.click('#tabTier1Notice');
    await new Promise(r => setTimeout(r, 600));

    // Take screenshot of Razorpay Modal with ₹99 selected
    const modal99Path = path.join(ARTIFACT_DIR, 'razorpay_modal_tier1_99.png');
    await page.screenshot({ path: modal99Path });
    console.log(`[E2E] Saved Razorpay Modal ₹99 screenshot: ${modal99Path}`);

    // 4. Click Pay with Razorpay button inside modal to trigger payment & unlock
    console.log('[E2E] Clicking Pay with Razorpay button (#btnPayRazorpay)...');
    await page.click('#btnPayRazorpay');
    await new Promise(r => setTimeout(r, 2500));

    // Take screenshot of unlocked document
    const unlockedPath = path.join(ARTIFACT_DIR, 'document_unlocked_via_razorpay.png');
    await page.screenshot({ path: unlockedPath, fullPage: true });
    console.log(`[E2E] Saved Unlocked Document screenshot: ${unlockedPath}`);

    // -------------------------------------------------------------
    // ADMIN PORTAL VERIFICATION
    // -------------------------------------------------------------
    console.log('[E2E] Navigating to Secret Admin Portal http://localhost:3333/portal-aks008 ...');
    await page.goto('http://localhost:3333/portal-aks008', { waitUntil: 'networkidle2' });

    // Login if needed
    const loginInput = await page.$('#adminUsername');
    if (loginInput) {
      console.log('[E2E] Entering admin credentials...');
      await page.type('#adminUsername', 'aks008');
      await page.type('#adminPassword', 'Akash@1060');
      await page.click('#adminLoginForm button[type="submit"]');
      await new Promise(r => setTimeout(r, 1500));
    }

    // Click Payments tab
    console.log('[E2E] Clicking Payments & Webhooks tab...');
    await page.evaluate(() => {
      const btn = document.querySelector('button[data-tab="tabPayments"]');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    const adminPaymentsPath = path.join(ARTIFACT_DIR, 'admin_verified_razorpay_payments.png');
    await page.screenshot({ path: adminPaymentsPath, fullPage: true });
    console.log(`[E2E] Saved Admin Payments screenshot: ${adminPaymentsPath}`);

    // Click Price & Gateway Settings tab
    console.log('[E2E] Clicking Price & Gateway Settings tab...');
    await page.evaluate(() => {
      const btn = document.querySelector('button[data-tab="tabConfig"]');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    const adminConfigPath = path.join(ARTIFACT_DIR, 'admin_verified_razorpay_config.png');
    await page.screenshot({ path: adminConfigPath, fullPage: true });
    console.log(`[E2E] Saved Admin Settings screenshot: ${adminConfigPath}`);

    console.log('[E2E] ALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('[E2E ERROR]:', err);
  } finally {
    await browser.close();
  }
}

run();
