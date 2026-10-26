const nodemailer = require('nodemailer');

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
 * Send Court-Ready Notice PDF to Customer upon Admin Approval
 */
async function sendCustomerNoticeEmail({ notice, payment, pdfBuffer }) {
  const customerEmail = payment.customerEmail || notice.tenantEmail;
  if (!customerEmail || customerEmail === 'N/A' || !customerEmail.includes('@')) {
    console.warn('[CUSTOMER EMAIL WARNING]: No valid email found for customer', notice.refNo);
    return { success: false, message: 'No valid recipient email address' };
  }

  const transporter = getTransporter();
  const formatINR = (amt) => Number(amt || 0).toLocaleString('en-IN');
  const safeFilename = `Legal_Demand_Notice_${(notice.tenantName || 'Tenant').replace(/[^a-zA-Z0-9]/g, '_')}_vs_${(notice.landlordName || 'Landlord').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  const appUrl = process.env.APP_URL || 'https://depositshield.onrender.com';
  const downloadPdfUrl = `${appUrl}/api/notice/${notice.refNo}/pdf`;
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.EMAIL_USER || 'akashrupareliya321@gmail.com';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 24px 12px; color: #1e293b; }
    .card { max-width: 660px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.25); border: 1px solid #cbd5e1; }
    .header { background: linear-gradient(135deg, #091e42 0%, #0284c7 100%); padding: 32px 28px; text-align: center; color: #ffffff; }
    .logo-badge { display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: rgba(255,255,255,0.18); border-radius: 50%; font-size: 24px; margin-bottom: 12px; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; }
    .header p { margin: 6px 0 0; font-size: 13px; color: #bae6fd; }
    .body { padding: 30px 28px; }
    .confirm-pill { display: inline-block; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; font-size: 12px; font-weight: 700; padding: 6px 14px; border-radius: 20px; margin-bottom: 20px; }
    .intro { font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 22px; }
    
    .dossier-card { background: #0b1329; border: 1.5px solid #0284c7; border-radius: 10px; padding: 20px; margin-bottom: 26px; color: #f8fafc; }
    .dossier-card h3 { margin: 0 0 14px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #38bdf8; display: flex; align-items: center; gap: 8px; }
    .dossier-table { width: 100%; border-collapse: collapse; }
    .dossier-table td { padding: 7px 6px; font-size: 12.5px; border-bottom: 1px solid #1e293b; }
    .dossier-table td.lbl { color: #94a3b8; width: 38%; font-weight: 600; }
    .dossier-table td.val { color: #f8fafc; font-weight: 700; }
    .ref-highlight { background: rgba(56, 189, 248, 0.2); color: #38bdf8; padding: 3px 8px; border-radius: 4px; font-family: monospace; font-size: 13.5px; display: inline-block; }
    
    .btn-download-box { text-align: center; margin: 18px 0 6px; }
    .btn-download { display: inline-block; background: linear-gradient(135deg, #059669, #10b981); color: #ffffff !important; text-decoration: none; font-size: 13.5px; font-weight: 700; padding: 12px 24px; border-radius: 8px; box-shadow: 0 4px 12px rgba(16,185,129,0.3); }

    .playbook-header { margin: 28px 0 14px; font-size: 16px; font-weight: 800; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
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
      <p>Official Case Dossier • Pre-Litigation Legal Notice & Recovery Playbook</p>
    </div>
    <div class="body">
      <div class="confirm-pill">
        ✓ PAYMENT CONFIRMED • NOTICE GENERATED & ATTACHED
      </div>

      <div class="intro">
        Dear <strong>${notice.tenantName}</strong>,<br><br>
        Your payment of <strong>₹${payment.amount}</strong> (Payment Ref: <code>${payment.paymentId}</code>) has been successfully verified. Your official, court-admissible <strong>2-Page Pre-Litigation Legal Demand Notice</strong> is <strong>attached to this email as a ready-to-print PDF (${safeFilename})</strong>.<br><br>
        <strong>Please save this email safely:</strong> All your permanent reference numbers, future escalation steps, and official document download links are documented below so you can execute them step by step if your landlord does not comply.
      </div>

      <!-- Official Reference Dossier -->
      <div class="dossier-card">
        <h3>📂 OFFICIAL CASE REFERENCE DOSSIER</h3>
        <table class="dossier-table">
          <tr>
            <td class="lbl">Notice Reference No:</td>
            <td class="val"><span class="ref-highlight">${notice.refNo}</span></td>
          </tr>
          <tr>
            <td class="lbl">Payment Reference ID:</td>
            <td class="val"><code>${payment.paymentId}</code> (Razorpay Verified)</td>
          </tr>
          <tr>
            <td class="lbl">Date of Issuance:</td>
            <td class="val">${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
          </tr>
          <tr>
            <td class="lbl">Claimant / Tenant:</td>
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
            <td class="val" style="color: #f87171; font-size: 14px;">₹${formatINR(notice.amountWithheld)}/-</td>
          </tr>
          <tr>
            <td class="lbl">Peremptory Deadline:</td>
            <td class="val" style="color: #fbbf24;">7 Calendar Days from Service</td>
          </tr>
        </table>
        
        <div class="btn-download-box">
          <a href="${downloadPdfUrl}" class="btn-download" target="_blank">
            📥 Download Legal Notice PDF Anytime
          </a>
        </div>
      </div>

      <!-- Step-by-Step Recovery Playbook -->
      <div class="playbook-header">
        🗺️ STEP-BY-STEP RECOVERY PLAYBOOK (HOW TO TAKE ACTION)
      </div>

      <!-- STEP 1 -->
      <div class="step-box">
        <div class="step-title">⚡ STEP 1: Download & Print 2 Physical Copies (Day 1)</div>
        <p class="step-desc">
          Open the attached PDF (<code>${safeFilename}</code>). Print <strong>two (2) physical copies</strong> on standard white A4 paper. Sign on the <em>"Aggrieved Tenant (Party-in-Person)"</em> line on Page 2 using blue ink.
        </p>
      </div>

      <!-- STEP 2 -->
      <div class="step-box">
        <div class="step-title">📱 STEP 2: Serve Instantly via WhatsApp & Email (Day 1)</div>
        <p class="step-desc">
          Send the attached PDF along with the following formal notice text directly to your landlord's WhatsApp and Email. Under Section 65B of the Indian Evidence Act and Supreme Court precedents (<em>C.C. Alavi Haji</em>), blue/double delivery ticks establish primary legal proof of service:
        </p>
        <div class="copy-box">FORMAL LEGAL DEMAND NOTICE: Ref No. ${notice.refNo}
To: Mr./Ms. ${notice.landlordName}
Premises: ${notice.propertyAddress}

Please find attached formal Pre-Litigation Legal Demand Notice regarding the unlawful withholding of ₹${formatINR(notice.amountWithheld)}/- from my caution security deposit. Under Sec 108(m) Transfer of Property Act 1882 & Sec 73 Indian Contract Act, you are hereby given seven (7) calendar days to remit the refund balance. Failure to comply will lead to formal proceedings before the District Consumer Disputes Redressal Commission (DCDRC) claiming 18% compound interest and damages, and a Police Complaint for Criminal Breach of Trust under Section 316 BNS (IPC 405/406). Kindly acknowledge receipt.</div>
      </div>

      <!-- STEP 3 -->
      <div class="step-box">
        <div class="step-title">📮 STEP 3: Dispatch via India Post Speed Post with RPAD (Day 1–2)</div>
        <p class="step-desc">
          Take the second physical signed copy to your nearest India Post counter and send it via <strong>Speed Post with Acknowledgment Due (RPAD)</strong> to the landlord's registered home or office address. Keep the postal booking receipt carefully. Once delivered, download the delivery tracking report from <strong>indiapost.gov.in</strong>. Under Section 27 of the General Clauses Act, 1897, this establishes conclusive statutory <em>"Deemed Service"</em> in court.
        </p>
      </div>

      <!-- STEP 4 -->
      <div class="step-box urgent">
        <div class="step-title">⏰ STEP 4: Send Day 4 Reminder Follow-up (72 Hours Remaining)</div>
        <p class="step-desc">
          If the landlord has not refunded by Day 4, send this 72-hour reminder:
        </p>
        <div class="copy-box">REMINDER: Formal Legal Notice Ref: ${notice.refNo}. Mr./Ms. ${notice.landlordName}, your 7-day statutory deadline expires in 72 hours. To avoid consumer court litigation, penal 18% statutory interest, and escalation to National Consumer Helpline / e-Jagriti, please refund the withheld balance of ₹${formatINR(notice.amountWithheld)}/- immediately.</div>
      </div>

      <!-- STEP 5 -->
      <div class="step-box court">
        <div class="step-title">🏛️ STEP 5: Day 8 Escalation — Free Consumer Court & NCH Filing (Day 8 Onward)</div>
        <p class="step-desc">
          If the 7-day period expires without refund, submit your claim directly without hiring an expensive lawyer:
          <br><br>
          <strong>A. National Consumer Helpline (NCH 1915):</strong> Call toll-free <strong>1915</strong> or file at <a href="https://consumerhelpline.gov.in" target="_blank" style="color: #0284c7; font-weight: 700;">consumerhelpline.gov.in</a>. A government consumer officer calls the landlord directly to resolve the grievance.
          <br><br>
          <strong>B. Government e-Jagriti Portal:</strong> File a formal Party-in-Person petition at <a href="https://e-jagriti.gov.in" target="_blank" style="color: #0284c7; font-weight: 700;">e-jagriti.gov.in</a> under Section 35 of the Consumer Protection Act, 2019. Claim:
          <br>&bull; Principal withheld deposit: <strong>₹${formatINR(notice.amountWithheld)}/-</strong>
          <br>&bull; Accrued statutory penal interest: <strong>18% per annum</strong>
          <br>&bull; Punitive compensation for mental distress & unfair trade practice: <strong>₹50,000/- to ₹1,00,000/-</strong>
          <br>&bull; Litigation expenses: <strong>₹10,000/-</strong>
        </p>
      </div>

      <!-- STEP 6 -->
      <div class="step-box urgent">
        <div class="step-title">🚨 STEP 6: Police Criminal Complaint for Criminal Breach of Trust</div>
        <p class="step-desc">
          If the landlord abuses, intimidates, or dishonestly mismanages the caution deposit entrusted to them for safe custody, submit a formal criminal complaint to the local Police Station under <strong>Section 316 of Bharatiya Nyaya Sanhita, 2023 (formerly Section 405/406 IPC)</strong> for Criminal Breach of Trust.
        </p>
      </div>

      <div class="alert-spam">
        <strong>📬 Important Email Tip:</strong> If this email or future case updates ever land in your <strong>Spam or Promotions</strong> folder, please mark it as <em>"Not Spam"</em> or move it to your Primary Inbox to ensure you never miss statutory updates.
      </div>

      <p style="font-size: 13px; color: #475569; margin: 18px 0 0; line-height: 1.5;">
        You can always re-access your notice PDF and dispute details online anytime at <a href="${appUrl}" style="color: #0284c7; font-weight: 700;">${appUrl}</a>.
      </p>
    </div>

    <div class="footer">
      <strong>Disclaimer:</strong> DepositShield India is an automated legal self-help document drafting software engine. It does not provide legal representation or attorney advisory services. Documents are executed by the user as a Party-in-Person.<br><br>
      A reference copy of this dossier has also been archived at <code>${adminEmail}</code>.<br><br>
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
      subject: `⚖️ Case Dossier & 7-Day Legal Notice: ${notice.tenantName} vs ${notice.landlordName} [Ref: ${notice.refNo}]`,
      hasPdfAttachment: Boolean(pdfBuffer)
    });
    return { success: true, simulated: true };
  }

  try {
    const fromName = process.env.FROM_NAME || 'DepositShield India';
    const fromEmail = process.env.FROM_EMAIL || process.env.EMAIL_USER || process.env.SMTP_USER;
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: customerEmail,
      cc: adminEmail, // User email AND your email both receive the complete reference copy!
      subject: `⚖️ Official Legal Notice & Recovery Dossier - ${notice.tenantName} vs ${notice.landlordName} [Ref: ${notice.refNo}]`,
      html,
      attachments: pdfBuffer ? [
        {
          filename: safeFilename,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ] : []
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[CUSTOMER EMAIL SENT SUCCESSFULLY]:', info.messageId, 'to', customerEmail, 'and CC to', adminEmail);
    return { success: true, messageId: info.messageId };
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
