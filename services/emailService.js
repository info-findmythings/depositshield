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
    .badge { display: inline-block; background: #fbbf24; color: #78350f; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; margin-top: 8px; text-transform: uppercase; }
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
      <h2>🚨 New Payment Reference Received</h2>
      <div class="badge">Awaiting Admin Verification</div>
    </div>
    <div class="body">
      <div class="amount-box">
        <div style="font-size: 12px; color: #166534; font-weight: 600;">CLAIMED PAYMENT AMOUNT</div>
        <div class="amt">₹${payment.amount}</div>
        <div style="font-size: 12px; color: #475569;">Plan: <strong>${payment.tier === 'TIER_2' ? 'Notice + Court & Police Kit (₹499)' : 'Starter Legal Notice (₹99)'}</strong></div>
      </div>

      <table class="info-table">
        <tr>
          <td class="label">UPI UTR / Reference:</td>
          <td class="val"><span class="utr-highlight">${payment.paymentId}</span></td>
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

      <div class="btn-wrap">
        <a href="${quickApproveUrl}" class="btn-approve" target="_blank">
          ✓ Approve Payment & Send Notice PDF
        </a>
        <br>
        <a href="${quickApproveUrl.split('/api')[0]}/portal-aks008" class="btn-portal" target="_blank">
          Or View Full Admin Dashboard
        </a>
      </div>
      <p style="font-size: 11.5px; color: #64748b; text-align: center; margin-top: 14px;">
        Checking this button will automatically mark the payment as CONFIRMED, unlock the customer's portal, and immediately dispatch the official Legal Notice PDF to their email.
      </p>
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
      subject: `🚨 [DepositShield] New Payment Received: ₹${payment.amount} - UTR ${payment.paymentId}`,
      quickApproveUrl
    });
    return { success: true, simulated: true };
  }

  try {
    const fromEmail = process.env.FROM_EMAIL || process.env.EMAIL_USER || process.env.SMTP_USER;
    const info = await transporter.sendMail({
      from: `"DepositShield Alerts" <${fromEmail}>`,
      to: adminEmail,
      subject: `🚨 New Payment Submitted: ₹${payment.amount} from ${notice.tenantName || 'Customer'} (UTR: ${payment.paymentId})`,
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

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #091e42 0%, #0052cc 100%); padding: 30px; text-align: center; color: #ffffff; }
    .logo-badge { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; background: rgba(255,255,255,0.15); border-radius: 50%; font-size: 22px; margin-bottom: 10px; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; }
    .header p { margin: 6px 0 0; font-size: 12.5px; color: #93c5fd; }
    .body { padding: 30px; }
    .confirm-pill { display: inline-block; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; font-size: 11.5px; font-weight: 700; padding: 5px 12px; border-radius: 20px; margin-bottom: 20px; }
    .intro { font-size: 14.5px; line-height: 1.6; color: #334155; margin-bottom: 22px; }
    .summary-card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 18px; margin-bottom: 26px; }
    .summary-card h4 { margin: 0 0 12px; font-size: 12px; text-transform: uppercase; color: #0284c7; letter-spacing: 0.5px; }
    .grid { width: 100%; border-collapse: collapse; }
    .grid td { padding: 6px 4px; font-size: 13px; }
    .grid td.label { color: #64748b; font-weight: 500; width: 40%; }
    .grid td.val { color: #0f172a; font-weight: 700; }
    .steps-box { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 18px 20px; border-radius: 0 8px 8px 0; margin-bottom: 26px; }
    .steps-box h3 { margin: 0 0 10px; font-size: 14px; color: #166534; }
    .step-item { margin-bottom: 10px; font-size: 13px; line-height: 1.5; color: #14532d; }
    .step-item strong { color: #0f172a; }
    .alert-spam { background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 12px 14px; font-size: 12px; color: #92400e; margin-bottom: 24px; }
    .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; line-height: 1.6; }
    .footer a { color: #0284c7; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="logo-badge">⚖️</div>
      <h1>DepositShield India</h1>
      <p>Automated Legal Self-Help Engine • Pre-Litigation Notice</p>
    </div>
    <div class="body">
      <div class="confirm-pill">
        ✓ PAYMENT VERIFIED & OFFICIAL NOTICE UNLOCKED
      </div>

      <div class="intro">
        Dear <strong>${notice.tenantName}</strong>,<br><br>
        Your payment of <strong>₹${payment.amount}</strong> has been successfully confirmed. Your official, court-admissible <strong>2-Page Pre-Litigation Legal Demand Notice</strong> has been prepared and is <strong>attached to this email as a ready-to-print PDF</strong>.
      </div>

      <div class="summary-card">
        <h4>Dispute Case Details</h4>
        <table class="grid">
          <tr>
            <td class="label">Notice Reference No:</td>
            <td class="val">${notice.refNo}</td>
          </tr>
          <tr>
            <td class="label">Landlord / Owner:</td>
            <td class="val">${notice.landlordName}</td>
          </tr>
          <tr>
            <td class="label">Rental Property:</td>
            <td class="val">${notice.propertyAddress}</td>
          </tr>
          <tr>
            <td class="label">Deposit Withheld:</td>
            <td class="val" style="color: #b91c1c;">₹${formatINR(notice.amountWithheld)}/-</td>
          </tr>
          <tr>
            <td class="label">Statutory Deadline:</td>
            <td class="val">7 Calendar Days to Remit</td>
          </tr>
          <tr>
            <td class="label">Governing Law:</td>
            <td class="val">Sec 108 TPA 1882 & Sec 73 Contract Act</td>
          </tr>
        </table>
      </div>

      <div class="steps-box">
        <h3>⚡ Recommended 3-Step Action Plan (Day 1):</h3>
        <div class="step-item">
          <strong>1. Download & Print the Attached PDF:</strong> Open the attached PDF file (<code>${safeFilename}</code>) and print 2 copies. Sign on the "Aggrieved Tenant" line.
        </div>
        <div class="step-item">
          <strong>2. Send on WhatsApp:</strong> Send a copy of the notice text and PDF to your landlord's WhatsApp. Under Supreme Court rulings, WhatsApp delivery ticks constitute valid primary documentary evidence.
        </div>
        <div class="step-item">
          <strong>3. Dispatch via Speed Post (RPAD):</strong> Post one physical copy via India Post Speed Post with Acknowledgment Due to the landlord's registered address. Under Section 27 General Clauses Act, this establishes legal "Deemed Service".
        </div>
      </div>

      <div class="alert-spam">
        <strong>📬 Important Email Tip:</strong> If this email or future case updates ever land in your <strong>Spam / Promotions</strong> folder, please mark it as <em>"Not Spam"</em> or move it to your Primary Inbox to ensure you never miss legal notifications.
      </div>

      <p style="font-size: 13px; color: #475569; margin: 0;">
        If your landlord fails to refund within the 7-day period, this notice serves as your mandatory evidentiary foundation to file a claim before the <strong>District Consumer Forum (e-Daakhil)</strong> and the <strong>National Consumer Helpline (NCH 1915)</strong>.
      </p>
    </div>

    <div class="footer">
      <strong>Disclaimer:</strong> DepositShield India is an automated legal self-help document drafting software engine. It does not provide legal representation or attorney advisory services. Documents are executed by the user as a Party-in-Person.<br><br>
      © 2026 DepositShield India • <a href="https://depositshield.onrender.com">depositshield.onrender.com</a>
    </div>
  </div>
</body>
</html>
`;

  if (!transporter) {
    console.log('[EMAIL SIMULATION - CUSTOMER DELIVERY]:', {
      to: customerEmail,
      subject: `⚖️ Official Legal Demand Notice - ${notice.tenantName} vs ${notice.landlordName}`,
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
      subject: `⚖️ Official Legal Demand Notice Approved - ${notice.tenantName} vs ${notice.landlordName}`,
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
    console.log('[CUSTOMER EMAIL SENT SUCCESSFULLY]:', info.messageId, 'to', customerEmail);
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
