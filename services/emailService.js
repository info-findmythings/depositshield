const nodemailer = require('nodemailer');
const {
  generateNoticePdf,
  generateCourtPetitionPdf,
  generatePoliceComplaintPdf,
  generateAffidavitPdf
} = require('./pdfService');

/**
 * Create or reuse SMTP Transporter supporting both EMAIL_* and SMTP_* variables
 */
function getTransporter() {
  const user = process.env.EMAIL_USER || process.env.SMTP_USER || '';
  const rawPass = process.env.EMAIL_PASS || process.env.SMTP_PASS || '';
  const pass = rawPass.replace(/["'\s]/g, ''); // strip quotes and whitespace from Google App Password

  if (!user || !pass) {
    console.warn('[EMAIL SERVICE WARNING]: EMAIL_USER or EMAIL_PASS not set. Emails will run in logging/simulation mode.');
    return null;
  }

  const host = process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.EMAIL_PORT || process.env.SMTP_PORT) || 587;
  const isSecure = port === 465;

  return nodemailer.createTransport({
    host: host,
    port: port,
    secure: isSecure,
    auth: {
      user: user,
      pass: pass
    }
  });
}

/**
 * Send Alert to Admin when a customer submits a 12-digit UTR
 */
async function sendAdminPaymentNotification({ payment, notice, quickApproveUrl }) {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.EMAIL_USER || process.env.SMTP_USER;
  if (!adminEmail) return { success: false, message: 'No admin email configured' };

  const transporter = getTransporter();

  const isRazorpay = payment.gateway === 'RAZORPAY' || payment.status === 'CONFIRMED';
  const appUrl = process.env.APP_URL || 'https://depositshield.onrender.com';
  const portalUrl = `${appUrl}/portal-aks008`;

  const headerTitle = isRazorpay ? '🎉 New Razorpay Payment Confirmed!' : '🚨 New Payment Reference Received';
  const badgeText = isRazorpay ? 'CONFIRMED VIA RAZORPAY • PDF EMAILED' : 'Awaiting Admin Verification';
  const badgeStyle = isRazorpay 
    ? 'background: #064e3b; color: #34d399; border: 1px solid #059669;' 
    : 'background: #fbbf24; color: #78350f;';

  const actionButtons = isRazorpay ? `
      <div class="btn-wrap">
        <div style="background: #ecfdf5; border: 1.5px solid #10b981; border-radius: 8px; padding: 12px; margin-bottom: 14px; color: #065f46; font-size: 13.5px; font-weight: 600;">
          ✓ Payment was verified instantly. Official 2-Page Legal Demand Notice PDF was automatically generated and emailed to the customer.
        </div>
        <a href="${portalUrl}" class="btn-approve" style="background: #0284c7; box-shadow: 0 4px 10px rgba(2,132,199,0.3);" target="_blank">
          Open Admin Dashboard
        </a>
      </div>
  ` : `
      <div class="btn-wrap">
        <a href="${quickApproveUrl || portalUrl}" class="btn-approve" target="_blank">
          ✓ Approve Payment & Send Notice PDF
        </a>
        <br>
        <a href="${portalUrl}" class="btn-portal" target="_blank">
          Or View Full Admin Dashboard
        </a>
      </div>
      <p style="font-size: 11.5px; color: #64748b; text-align: center; margin-top: 14px;">
        Checking this button will automatically mark the payment as CONFIRMED, unlock the customer's portal, and immediately dispatch the official Legal Notice PDF to their email.
      </p>
  `;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); padding: 24px 30px; text-align: center; color: #ffffff; }
    .header h2 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; }
    .badge { display: inline-block; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; margin-top: 8px; text-transform: uppercase; }
    .body { padding: 28px 30px; }
    .amount-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 24px; }
    .amount-box .amt { font-size: 28px; font-weight: 800; color: #15803d; }
    .info-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .info-table td { padding: 9px 6px; font-size: 13.5px; border-bottom: 1px solid #f1f5f9; }
    .info-table td.label { font-weight: 600; color: #64748b; width: 40%; }
    .info-table td.val { font-weight: 700; color: #0f172a; word-break: break-all; }
    .utr-highlight { background: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 15px; font-weight: 800; display: inline-block; }
    .btn-wrap { text-align: center; margin: 28px 0 16px; }
    .btn-approve { display: inline-block; background: #16a34a; color: #ffffff !important; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 10px rgba(22,163,74,0.3); }
    .btn-portal { display: inline-block; color: #2563eb; font-size: 12.5px; text-decoration: underline; margin-top: 10px; }
    .footer { background: #f8fafc; padding: 16px; text-align: center; font-size: 11.5px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h2>${headerTitle}</h2>
      <div class="badge" style="${badgeStyle}">${badgeText}</div>
    </div>
    <div class="body">
      <div class="amount-box">
        <div style="font-size: 12px; color: #166534; font-weight: 600;">RECEIVED PAYMENT AMOUNT</div>
        <div class="amt">₹${payment.amount}</div>
        <div style="font-size: 12px; color: #475569;">Plan: <strong>${payment.tier === 'TIER_2' ? 'Notice + Court & Police Kit (₹499)' : 'Starter Legal Notice (₹99)'}</strong></div>
      </div>

      <table class="info-table">
        <tr>
          <td class="label">Payment ID / Gateway Ref:</td>
          <td class="val"><span class="utr-highlight">${payment.paymentId}</span></td>
        </tr>
        <tr>
          <td class="label">Gateway / Method:</td>
          <td class="val"><strong style="color: #0284c7;">${payment.gateway || 'RAZORPAY'}</strong></td>
        </tr>
        <tr>
          <td class="label">Tenant / Customer:</td>
          <td class="val">${notice.tenantName || 'N/A'}</td>
        </tr>
        <tr>
          <td class="label">Phone:</td>
          <td class="val">+91 ${payment.customerPhone || notice.tenantPhone || 'N/A'}</td>
        </tr>
        <tr>
          <td class="label">Customer Email:</td>
          <td class="val">${payment.customerEmail || notice.tenantEmail || 'N/A'}</td>
        </tr>
        <tr>
          <td class="label">Landlord Name:</td>
          <td class="val">${notice.landlordName || 'N/A'}</td>
        </tr>
        <tr>
          <td class="label">Withheld Deposit:</td>
          <td class="val">₹${notice.amountWithheld ? Number(notice.amountWithheld).toLocaleString('en-IN') : 'N/A'}</td>
        </tr>
        <tr>
          <td class="label">Notice Ref No:</td>
          <td class="val">${payment.noticeRefNo || notice.refNo || 'N/A'}</td>
        </tr>
      </table>

      ${actionButtons}
    </div>
    <div class="footer">
      DepositShield India Real-Time Revenue Engine • System Notification
    </div>
  </div>
</body>
</html>
`;

  if (!transporter) {
    console.log('[EMAIL SIMULATION - ADMIN ALERT]:', {
      to: adminEmail,
      subject: isRazorpay 
        ? `🎉 [Razorpay Success] ₹${payment.amount} from ${notice.tenantName || 'Customer'} (${payment.paymentId})`
        : `🚨 [DepositShield] New Payment Received: ₹${payment.amount} - UTR ${payment.paymentId}`,
      quickApproveUrl
    });
    return { success: true, simulated: true };
  }

  try {
    const fromEmail = process.env.FROM_EMAIL || process.env.EMAIL_USER || process.env.SMTP_USER;
    const subject = isRazorpay
      ? `🎉 [Razorpay Success] ₹${payment.amount} from ${notice.tenantName || 'Customer'} (${payment.paymentId})`
      : `🚨 New Payment Submitted: ₹${payment.amount} from ${notice.tenantName || 'Customer'} (UTR: ${payment.paymentId})`;

    const info = await transporter.sendMail({
      from: `"DepositShield Alerts" <${fromEmail}>`,
      to: adminEmail,
      subject,
      html
    });
    console.log('[ADMIN ALERT EMAIL SENT]:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('[ADMIN ALERT EMAIL ERROR]:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send Complete Case Dossier to Customer and CC Admin
 * - If user buys ₹499 Plan (TIER_2): Attaches ALL 4 Court & Police PDFs (Notice + Petition + Complaint + Affidavit)
 * - If user buys ₹99 Plan (TIER_1): Attaches ONLY the 1 Legal Demand Notice PDF
 */
async function sendCustomerNoticeEmail({ notice, payment, pdfBuffer }) {
  const customerEmail = payment.customerEmail || notice.tenantEmail;
  if (!customerEmail || customerEmail === 'N/A' || !customerEmail.includes('@')) {
    console.warn('[CUSTOMER EMAIL WARNING]: No valid email found for customer', notice.refNo);
    return { success: false, message: 'No valid recipient email address' };
  }

  const transporter = getTransporter();
  const formatINR = (amt) => Number(amt || 0).toLocaleString('en-IN');
  const appUrl = process.env.APP_URL || 'https://depositshield.onrender.com';
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.EMAIL_USER || 'akashrupareliya321@gmail.com';

  const isTier2 = (payment.tier === 'TIER_2') || 
                  (Number(payment.amount) >= 400) || 
                  (notice.tierUnlocked === 'TIER_2');

  const cleanTenant = (notice.tenantName || 'Tenant').replace(/[^a-zA-Z0-9]/g, '_');
  const cleanLandlord = (notice.landlordName || 'Landlord').replace(/[^a-zA-Z0-9]/g, '_');
  const cleanRef = (notice.refNo || 'REF').replace(/[^a-zA-Z0-9]/g, '_');

  const noticeFilename = `1_Legal_Demand_Notice_${cleanTenant}_vs_${cleanLandlord}.pdf`;
  const courtPetitionFilename = `2_Consumer_Court_Petition_Form1_${cleanRef}.pdf`;
  const policeComplaintFilename = `3_Police_Criminal_Complaint_Sec316BNS_${cleanRef}.pdf`;
  const affidavitFilename = `4_Notary_Verification_Affidavit_${cleanRef}.pdf`;


  // Always generate Notice PDF
  const noticeBuf = pdfBuffer || await generateNoticePdf(notice).catch(err => {
    console.warn('[NOTICE PDF GEN ERROR]:', err.message);
    return null;
  });

  const attachments = [];
  if (noticeBuf) {
    attachments.push({
      filename: noticeFilename,
      content: noticeBuf,
      contentType: 'application/pdf'
    });
  }

  // IF USER BOUGHT ₹499 PLAN (TIER_2): Generate and attach ALL 3 remaining Court & Police PDFs!
  let courtPetitionBuf = null;
  let policeComplaintBuf = null;
  let affidavitBuf = null;

  if (isTier2) {
    [courtPetitionBuf, policeComplaintBuf, affidavitBuf] = await Promise.all([
      generateCourtPetitionPdf(notice).catch(err => {
        console.warn('[COURT PETITION PDF GEN ERROR]:', err.message);
        return null;
      }),
      generatePoliceComplaintPdf(notice).catch(err => {
        console.warn('[POLICE COMPLAINT PDF GEN ERROR]:', err.message);
        return null;
      }),
      generateAffidavitPdf(notice).catch(err => {
        console.warn('[AFFIDAVIT PDF GEN ERROR]:', err.message);
        return null;
      })
    ]);

    if (courtPetitionBuf) {
      attachments.push({
        filename: courtPetitionFilename,
        content: courtPetitionBuf,
        contentType: 'application/pdf'
      });
    }
    if (policeComplaintBuf) {
      attachments.push({
        filename: policeComplaintFilename,
        content: policeComplaintBuf,
        contentType: 'application/pdf'
      });
    }
    if (affidavitBuf) {
      attachments.push({
        filename: affidavitFilename,
        content: affidavitBuf,
        contentType: 'application/pdf'
      });
    }
  }

  const dateIssuedStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  // Custom UI content based on Plan (₹499 Tier 2 vs ₹99 Tier 1)
  const headerSubtitle = isTier2 
    ? 'Official Recovery Dossier • ₹499 Full Court & Police Escalation Suite' 
    : 'Official Pre-Litigation Legal Demand Notice • ₹99 Starter Plan';

  const confirmPillText = isTier2
    ? '✓ ₹499 PLAN CONFIRMED • ALL 4 COURT & POLICE PDFS ATTACHED'
    : '✓ ₹99 PLAN CONFIRMED • OFFICIAL 2-PAGE LEGAL DEMAND NOTICE ATTACHED';

  const introText = isTier2
    ? `Your payment of <strong>₹${payment.amount}</strong> for the <strong>Full Court & Police Escalation Suite (₹499 Plan)</strong> has been successfully verified.<br><br><strong>ALL 4 OFFICIAL GOVERNMENT-APPROVED COURT & POLICE ACTION DOCUMENTS ARE ATTACHED DIRECTLY TO THIS EMAIL AS READY-TO-PRINT PDFS.</strong> You have everything right here in your email attachments to enforce your legal rights and recover your withheld caution deposit of <strong>₹${formatINR(notice.amountWithheld)}/-</strong>.`
    : `Your payment of <strong>₹${payment.amount}</strong> for the <strong>Starter Legal Demand Notice (₹99 Plan)</strong> has been successfully verified.<br><br><strong>YOUR OFFICIAL COURT-ADMISSIBLE 2-PAGE PRE-LITIGATION LEGAL DEMAND NOTICE IS ATTACHED DIRECTLY TO THIS EMAIL (${noticeFilename}).</strong> You have your complete legal notice right here in your email attachments ready to serve upon your landlord.`;

  const attachedDocsHtml = isTier2 ? `
      <!-- 4 Attached Documents Section for ₹499 Plan -->
      <div class="attachments-card">
        <h3>📎 4 OFFICIAL LEGAL DOCUMENTS ATTACHED DIRECTLY TO THIS EMAIL</h3>
        
        <!-- Doc 1 -->
        <div class="doc-item">
          <div class="doc-title">
            <span>1. Formal Pre-Litigation Legal Demand Notice</span>
            <span class="doc-badge badge-notice">Ready to Serve (Day 1)</span>
          </div>
          <div class="doc-desc">
            Official 2-page court-admissible notice under Sec 106 & 108 of Transfer of Property Act 1882 read with Sec 73 Indian Contract Act 1872. Sets a mandatory 7-day peremptory refund deadline before court action.
          </div>
          <div style="margin-top: 8px;">
            <span class="doc-file">📎 Attached to this email: <strong>${noticeFilename}</strong></span>
          </div>
        </div>

        <!-- Doc 2 -->
        <div class="doc-item">
          <div class="doc-title">
            <span>2. Form 1 Consumer Court Petition (e-Jagriti / DCDRC)</span>
            <span class="doc-badge badge-court">Use on Day 8</span>
          </div>
          <div class="doc-desc">
            Official 2-page Party-in-Person petition under Section 35 of Consumer Protection Act 2019 for the District Consumer Disputes Redressal Commission & e-Jagriti (edaakhil.nic.in). Claims principal deposit + 18% compound interest + ₹50,000 compensation.
          </div>
          <div style="margin-top: 8px;">
            <span class="doc-file">📎 Attached to this email: <strong>${courtPetitionFilename}</strong></span>
          </div>
        </div>

        <!-- Doc 3 -->
        <div class="doc-item">
          <div class="doc-title">
            <span>3. Police Station Criminal Complaint (BNS 316 / IPC 405)</span>
            <span class="doc-badge badge-police">Emergency Criminal Redress</span>
          </div>
          <div class="doc-desc">
            Formal 1-page criminal complaint letter under Section 316 of Bharatiya Nyaya Sanhita, 2023 (formerly Section 405/406 IPC) for Criminal Breach of Trust. Ready to file with Station House Officer (SHO) or state police citizen portal.
          </div>
          <div style="margin-top: 8px;">
            <span class="doc-file">📎 Attached to this email: <strong>${policeComplaintFilename}</strong></span>
          </div>
        </div>

        <!-- Doc 4 -->
        <div class="doc-item">
          <div class="doc-title">
            <span>4. Sworn Notary Verification Affidavit</span>
            <span class="doc-badge badge-affidavit">Affidavit for Court</span>
          </div>
          <div class="doc-desc">
            Official 1-page sworn verification affidavit under Order XIX CPC & Section 297 CrPC / BNSS to accompany your Consumer Court Petition. Ready to print on ₹20/50 stamp paper and notarize with any local Notary Public.
          </div>
          <div style="margin-top: 8px;">
            <span class="doc-file">📎 Attached to this email: <strong>${affidavitFilename}</strong></span>
          </div>
        </div>
      </div>
  ` : `
      <!-- Single Attached Notice for ₹99 Plan -->
      <div class="attachments-card">
        <h3>📎 1 OFFICIAL LEGAL DOCUMENT ATTACHED TO THIS EMAIL</h3>
        
        <div class="doc-item">
          <div class="doc-title">
            <span>1. Formal Pre-Litigation Legal Demand Notice</span>
            <span class="doc-badge badge-notice">Ready to Serve (Day 1)</span>
          </div>
          <div class="doc-desc">
            Official 2-page court-admissible notice under Sec 106 & 108 of Transfer of Property Act 1882 read with Sec 73 Indian Contract Act 1872. Sets a mandatory 7-day peremptory refund deadline before court action.
          </div>
          <div style="margin-top: 8px;">
            <span class="doc-file">📎 Attached to this email: <strong>${noticeFilename}</strong></span>
          </div>
        </div>

        <!-- Upgrade Callout -->
        <div style="background: rgba(2, 132, 199, 0.15); border: 1.5px dashed #0284c7; border-radius: 8px; padding: 14px; margin-top: 14px; font-size: 12.5px; color: #bae6fd; line-height: 1.5;">
          <strong>🔒 Need the Consumer Court Petition & Police Complaint Kit?</strong><br>
          If your landlord does not refund within the 7-day statutory deadline, you can unlock the full <strong>₹499 Tier 2 Escalation Suite</strong> anytime to get your e-Jagriti Court Petition, Notary Affidavit, and Police Criminal Complaint (Sec 316 BNS).
        </div>
      </div>
  `;

  const emailSubject = isTier2
    ? `⚖️ [₹499 Full Escalation Kit] Official Legal Notice & 4 Court/Police Documents Attached - ${notice.tenantName} vs ${notice.landlordName} [Ref: ${notice.refNo}]`
    : `⚖️ [Starter Plan] Official Legal Demand Notice Attached - ${notice.tenantName} vs ${notice.landlordName} [Ref: ${notice.refNo}]`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b1329; margin: 0; padding: 24px 12px; color: #1e293b; }
    .card { max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3); border: 1px solid #cbd5e1; }
    .header { background: linear-gradient(135deg, #091e42 0%, #0284c7 100%); padding: 32px 28px; text-align: center; color: #ffffff; }
    .logo-badge { display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: rgba(255,255,255,0.18); border-radius: 50%; font-size: 24px; margin-bottom: 12px; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; }
    .header p { margin: 6px 0 0; font-size: 13px; color: #bae6fd; }
    .body { padding: 30px 28px; }
    
    .confirm-pill { display: inline-block; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; font-size: 12px; font-weight: 700; padding: 7px 16px; border-radius: 20px; margin-bottom: 20px; }
    .intro { font-size: 14px; line-height: 1.65; color: #334155; margin-bottom: 22px; }
    
    /* Search preservation box */
    .search-tip-box { background: #eff6ff; border: 1.5px dashed #3b82f6; border-radius: 10px; padding: 14px 18px; margin-bottom: 24px; font-size: 13px; color: #1e40af; line-height: 1.5; }
    .search-tip-box strong { color: #1e3a8a; }
    
    /* Attached documents box */
    .attachments-card { background: #0f172a; border-radius: 10px; padding: 20px; margin-bottom: 26px; color: #f8fafc; border: 1.5px solid #334155; }
    .attachments-card h3 { margin: 0 0 14px; font-size: 13.5px; text-transform: uppercase; letter-spacing: 0.5px; color: #38bdf8; display: flex; align-items: center; gap: 8px; }
    .doc-item { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 14px; margin-bottom: 12px; }
    .doc-item:last-child { margin-bottom: 0; }
    .doc-title { font-size: 13px; font-weight: 700; color: #ffffff; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
    .doc-badge { font-size: 10.5px; padding: 3px 8px; border-radius: 4px; font-weight: 700; text-transform: uppercase; }
    .badge-notice { background: #1e3a8a; color: #93c5fd; }
    .badge-court { background: #4c1d95; color: #c4b5fd; }
    .badge-police { background: #7f1d1d; color: #fca5a5; }
    .badge-affidavit { background: #14532d; color: #86efac; }
    .doc-desc { font-size: 12px; color: #94a3b8; margin: 6px 0 10px; line-height: 1.45; }
    .doc-file { font-size: 11.5px; font-family: monospace; color: #38bdf8; background: #0f172a; border: 1px solid #334155; padding: 5px 10px; border-radius: 4px; display: inline-block; word-break: break-all; }

    /* Case dossier table */
    .dossier-card { background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 26px; }
    .dossier-card h3 { margin: 0 0 14px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #0f172a; }
    .dossier-table { width: 100%; border-collapse: collapse; }
    .dossier-table td { padding: 8px 6px; font-size: 12.5px; border-bottom: 1px solid #e2e8f0; }
    .dossier-table td.lbl { color: #64748b; width: 38%; font-weight: 600; }
    .dossier-table td.val { color: #0f172a; font-weight: 700; }
    .ref-highlight { background: #dbeafe; color: #1e40af; padding: 3px 8px; border-radius: 4px; font-family: monospace; font-size: 13.5px; display: inline-block; font-weight: 800; }
    
    /* Playbook */
    .playbook-header { margin: 28px 0 16px; font-size: 16px; font-weight: 800; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
    .step-box { background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #0284c7; border-radius: 0 8px 8px 0; padding: 16px 18px; margin-bottom: 16px; }
    .step-box.urgent { border-left-color: #dc2626; background: #fff5f5; }
    .step-box.court { border-left-color: #7c3aed; background: #faf5ff; }
    .step-title { font-size: 13.5px; font-weight: 700; color: #0f172a; margin-bottom: 6px; }
    .step-desc { font-size: 12.5px; line-height: 1.55; color: #334155; margin: 0; }
    
    .copy-box { background: #0f172a; color: #e2e8f0; border: 1px solid #334155; border-radius: 6px; padding: 12px; margin: 10px 0 4px; font-family: monospace; font-size: 11.5px; line-height: 1.45; white-space: pre-wrap; word-break: break-word; }
    
    .alert-spam { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px; font-size: 12px; color: #92400e; margin: 24px 0 16px; line-height: 1.5; }
    .footer { background: #f1f5f9; padding: 22px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; line-height: 1.6; }
    .footer a { color: #0284c7; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="logo-badge">⚖️</div>
      <h1>DepositShield India</h1>
      <p>${headerSubtitle}</p>
    </div>
    <div class="body">
      <div class="confirm-pill">
        ${confirmPillText}
      </div>

      <div class="intro">
        Dear <strong>${notice.tenantName}</strong>,<br><br>
        ${introText}
      </div>

      <!-- Safe Search Box -->
      <div class="search-tip-box">
        💡 <strong>SAVE OR STAR THIS EMAIL FOR FUTURE ACCESS:</strong><br>
        If you ever need these documents or escalation steps in the future, simply open your email app and search for <strong>DepositShield</strong> or <strong>${notice.refNo}</strong>. All your statutory documents and recovery action plan are permanently preserved right here.
      </div>

      ${attachedDocsHtml}

      <!-- Case Reference Dossier -->
      <div class="dossier-card">
        <h3>📂 OFFICIAL CASE REFERENCE DOSSIER</h3>
        <table class="dossier-table">
          <tr>
            <td class="lbl">Notice Reference No:</td>
            <td class="val"><span class="ref-highlight">${notice.refNo}</span></td>
          </tr>
          <tr>
            <td class="lbl">Payment Reference ID:</td>
            <td class="val"><code>${payment.paymentId}</code> (${payment.gateway || 'RAZORPAY'} Verified)</td>
          </tr>
          <tr>
            <td class="lbl">Purchased Plan:</td>
            <td class="val"><strong>${isTier2 ? '₹499 Full Court & Police Escalation Suite' : '₹99 Starter Legal Demand Notice'}</strong></td>
          </tr>
          <tr>
            <td class="lbl">Date of Issuance:</td>
            <td class="val">${dateIssuedStr}</td>
          </tr>
          <tr>
            <td class="lbl">Aggrieved Tenant:</td>
            <td class="val">${notice.tenantName} (+91 ${payment.customerPhone || notice.tenantPhone || 'N/A'})</td>
          </tr>
          <tr>
            <td class="lbl">Opposite Party / Landlord:</td>
            <td class="val">${notice.landlordName} (${notice.landlordPhone || 'Recorded on Tenancy Agreement'})</td>
          </tr>
          <tr>
            <td class="lbl">Demised Rental Premises:</td>
            <td class="val">${notice.propertyAddress}</td>
          </tr>
          <tr>
            <td class="lbl">Caution Deposit Withheld:</td>
            <td class="val" style="color: #dc2626; font-size: 14px;">₹${formatINR(notice.amountWithheld)}/-</td>
          </tr>
          <tr>
            <td class="lbl">Peremptory Deadline:</td>
            <td class="val" style="color: #d97706;">7 Calendar Days from Service</td>
          </tr>
          <tr>
            <td class="lbl">Remittance Instruction:</td>
            <td class="val" style="color: #0f172a; font-weight: 600;">Direct refund to Tenant's original payment method / registered bank coordinates.</td>
          </tr>
        </table>
      </div>

      <!-- Step-by-Step Recovery Playbook -->
      <div class="playbook-header">
        🗺️ STEP-BY-STEP RECOVERY PLAYBOOK (HOW TO TAKE ACTION)
      </div>

      <!-- STEP 1 -->
      <div class="step-box">
        <div class="step-title">⚡ STEP 1: Print & Sign the Attached Notice (Day 1)</div>
        <p class="step-desc">
          Open the attached <code>${noticeFilename}</code>. Print <strong>two (2) physical copies</strong> on standard white A4 paper. Sign both copies with blue ink on the <em>"Aggrieved Tenant (Party-in-Person)"</em> line on Page 2.
        </p>
      </div>

      <!-- STEP 2 -->
      <div class="step-box">
        <div class="step-title">📱 STEP 2: Instant Service via WhatsApp & Email (Day 1)</div>
        <p class="step-desc">
          Send the attached <code>${noticeFilename}</code> directly to your landlord's WhatsApp and Email along with the following copy-paste formal message. Under Section 63 of Bharatiya Sakshya Adhiniyam, 2023 (formerly Section 65B Evidence Act) and Supreme Court precedent (<em>C.C. Alavi Haji</em>), double/blue delivery ticks constitute valid primary proof of notice:
        </p>
        <div class="copy-box">FORMAL LEGAL DEMAND NOTICE: Ref No. ${notice.refNo}
To: Mr./Ms. ${notice.landlordName}
Premises: ${notice.propertyAddress}

Please find attached formal Pre-Litigation Legal Demand Notice regarding the unlawful withholding of ₹${formatINR(notice.amountWithheld)}/- from my caution security deposit. Under Sec 108(m) Transfer of Property Act 1882 & Sec 73 Indian Contract Act, you are hereby given seven (7) calendar days to remit the refund balance directly to my bank account. Failure to comply will lead to formal proceedings before the District Consumer Disputes Redressal Commission (DCDRC) claiming 18% compound interest and damages, and a Police Complaint for Criminal Breach of Trust under Section 316 BNS (IPC 405/406). Kindly acknowledge receipt.</div>
      </div>

      <!-- STEP 3 -->
      <div class="step-box">
        <div class="step-title">📮 STEP 3: Dispatch via India Post Speed Post with RPAD (Day 1–2)</div>
        <p class="step-desc">
          Take the second signed copy to any local India Post counter and dispatch it via <strong>Speed Post with Acknowledgment Due (RPAD)</strong> to the landlord's postal address. Save your postal booking receipt. When delivered, download the delivery tracking report from <strong>indiapost.gov.in</strong>. Under Section 27 of the General Clauses Act, 1897, this establishes indisputable statutory <em>"Deemed Service"</em> in court.
        </p>
      </div>

      <!-- STEP 4 -->
      <div class="step-box urgent">
        <div class="step-title">⏰ STEP 4: Send 72-Hour Warning Reminder (Day 4)</div>
        <p class="step-desc">
          If the refund is not remitted by Day 4, send this 72-hour reminder:
        </p>
        <div class="copy-box">REMINDER: Formal Legal Notice Ref: ${notice.refNo}. Mr./Ms. ${notice.landlordName}, your 7-day statutory deadline expires in 72 hours. To avoid consumer court litigation, penal 18% statutory interest, and escalation to National Consumer Helpline / e-Jagriti, please refund the withheld balance of ₹${formatINR(notice.amountWithheld)}/- immediately.</div>
      </div>

      <!-- STEP 5 -->
      <div class="step-box court">
        <div class="step-title">🏛️ STEP 5: Consumer Court Escalation on e-Jagriti (Day 8 Onward)</div>
        <p class="step-desc">
          If the 7-day window expires without full refund, you do NOT need to hire an expensive lawyer. You have the statutory right to file as Party-in-Person under Section 35 of the Consumer Protection Act, 2019:
          <br><br>
          <strong>A. National Consumer Helpline (Free & Immediate):</strong> Call toll-free <strong>1915</strong> or log onto <a href="https://consumerhelpline.gov.in" target="_blank" style="color: #0284c7; font-weight: 700;">consumerhelpline.gov.in</a>. An official government officer contacts the landlord directly.
          <br><br>
          <strong>B. File on Government e-Jagriti Portal:</strong> Go to <a href="https://e-jagriti.gov.in" target="_blank" style="color: #0284c7; font-weight: 700;">e-jagriti.gov.in</a> (or submit at your local District Commission). Upload:
          <br>&bull; Form 1 Petition: <code>${courtPetitionFilename}</code>
          <br>&bull; Notarized Affidavit: <code>${affidavitFilename}</code> (notarized on ₹20/50 stamp paper)
          <br>&bull; Exhibits: Tenancy Agreement copy, Bank statement showing deposit payment, WhatsApp chats & Speed Post delivery report.
          <br><br>
          <strong>Your Statutory Court Claims:</strong>
          <br>&bull; Refund of principal withheld deposit: <strong>₹${formatINR(notice.amountWithheld)}/-</strong>
          <br>&bull; Statutory penal interest: <strong>18% per annum</strong> from vacating date
          <br>&bull; Mental harassment compensation: <strong>₹50,000/- to ₹1,00,000/-</strong>
          <br>&bull; Litigation expenses: <strong>₹10,000/-</strong>
        </p>
      </div>

      <!-- STEP 6 -->
      <div class="step-box urgent">
        <div class="step-title">🚨 STEP 6: Police Criminal Complaint for Criminal Breach of Trust</div>
        <p class="step-desc">
          If your landlord threatens, intimidates, or dishonestly mismanages the caution deposit entrusted to them for safe custody:
          <br><br>
          Print the attached <code>${policeComplaintFilename}</code>. Submit it to the Station House Officer (SHO) of the local police station jurisdiction where the rental property is situated, or file online via your State Police Citizen Portal under <strong>Section 316 of Bharatiya Nyaya Sanhita, 2023 (formerly IPC Section 405/406)</strong>.
          <br><br>
          Under settled law, caution deposits are held strictly in fiduciary trust and remain the tenant's property; converting or refusing to refund trust funds constitutes Criminal Breach of Trust. The police notice/summons to the landlord almost invariably compels immediate refund.
        </p>
      </div>

      <div class="alert-spam">
        <strong>📬 Email Delivery Note:</strong> If future updates ever land in your <strong>Spam or Promotions</strong> folder, please mark this sender as <em>"Not Spam"</em> or move it to your Primary Inbox to ensure you never miss critical legal updates.
      </div>

      <p style="font-size: 13px; color: #475569; margin: 18px 0 0; line-height: 1.5;">
        <strong>📁 Attached PDF Files:</strong> All official documents are attached directly to this email message. You can open, save, and print them straight from your email attachments without needing any external links.
      </p>
    </div>

    <div class="footer">
      <strong>Disclaimer:</strong> DepositShield India is an automated legal self-help document drafting software engine. It does not provide legal representation or attorney advisory services. Documents are executed by the user as a Party-in-Person.<br><br>
      A permanent reference copy of this dossier has also been archived at <code>${adminEmail}</code>.<br><br>
      © 2026 DepositShield India • <a href="${appUrl}">${appUrl}</a>
    </div>
  </div>
</body>
</html>
`;

  if (!transporter) {
    console.log('[EMAIL SIMULATION - CUSTOMER DELIVERY]:', {
      to: customerEmail,
      cc: adminEmail,
      isTier2,
      plan: isTier2 ? 'TIER_2 (₹499)' : 'TIER_1 (₹99)',
      subject: emailSubject,
      attachmentsCount: attachments.length,
      attachmentFilenames: attachments.map(a => a.filename)
    });
    return { success: true, simulated: true, isTier2, attachmentsCount: attachments.length };
  }

  try {
    const fromName = process.env.FROM_NAME || 'DepositShield India';
    const fromEmail = process.env.FROM_EMAIL || process.env.EMAIL_USER || process.env.SMTP_USER;
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: customerEmail,
      cc: adminEmail,
      subject: emailSubject,
      html,
      attachments
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[CUSTOMER EMAIL SENT - ${isTier2 ? 'TIER 2 (4 ATTACHMENTS)' : 'TIER 1 (1 ATTACHMENT)'}]:`, info.messageId, 'to', customerEmail, 'and CC to', adminEmail);
    return { success: true, messageId: info.messageId, isTier2, attachmentsCount: attachments.length };
  } catch (err) {
    console.error('[CUSTOMER EMAIL ERROR]:', err.message);
    return { success: false, error: err.message };
  }
}



module.exports = {
  getTransporter,
  sendAdminPaymentNotification,
  sendCustomerNoticeEmail
};
