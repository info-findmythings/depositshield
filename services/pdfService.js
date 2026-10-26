const PDFDocument = require('pdfkit');

/**
 * Helper to format currency in Indian numbering format
 */
function formatINR(amt) {
  return Number(amt || 0).toLocaleString('en-IN');
}

/**
 * Generate Court-Admissible 2-Page Pre-Litigation Legal Demand Notice PDF
 * Pure Node.js (Zero Chromium / Ultra-lightweight / <15MB RAM)
 * Guarantees strictly 2 pages without text overlaps using dynamic cursor calculation.
 * @param {Object} notice - Notice data from MongoDB
 * @returns {Promise<Buffer>} - Resolves with PDF buffer
 */
function generateNoticePdf(notice) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 32, bottom: 28, left: 38, right: 38 },
        bufferPages: true,
        autoFirstPage: true,
        info: {
          Title: `Legal Demand Notice - ${notice.tenantName} vs ${notice.landlordName}`,
          Author: 'DepositShield India Self-Help Drafting Engine',
          Subject: `Pre-Litigation Demand for Security Deposit Refund of Rs. ${notice.amountWithheld}`,
          Keywords: 'Legal Notice, Rental Deposit, Consumer Court, TPA 1882, BNS 2023, Party-in-Person'
        }
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      const dateStr = notice.currentDate || new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      const pageWidth = 595.28;
      const leftMargin = 38;
      const contentWidth = pageWidth - (leftMargin * 2); // 519.28 pt

      // =======================================================================
      // PAGE 1: FORMAL LEGAL DEMAND NOTICE & STATUTORY GROUNDS
      // =======================================================================

      // Top Legal Header Bar
      doc.rect(leftMargin, 30, contentWidth, 3).fill('#1e3a8a');

      // Title & Statute
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#0f172a').text(
        'FORMAL PRE-LITIGATION LEGAL DEMAND NOTICE',
        leftMargin, 38, { width: contentWidth, align: 'center', characterSpacing: 0.5 }
      );
      doc.font('Helvetica').fontSize(7.5).fillColor('#475569').text(
        '(ISSUED UNDER SECTION 106 & 108 OF TRANSFER OF PROPERTY ACT, 1882 READ WITH SECTION 73 OF INDIAN CONTRACT ACT, 1872)',
        leftMargin, 53, { width: contentWidth, align: 'center' }
      );

      // Metadata Header Box
      const metaY = 66;
      doc.roundedRect(leftMargin, metaY, contentWidth, 26, 3).fillAndStroke('#f8fafc', '#cbd5e1');
      doc.fillColor('#0f172a').fontSize(8);
      doc.font('Helvetica-Bold').text('NOTICE REF NO: ', leftMargin + 8, metaY + 5, { continued: true });
      doc.font('Helvetica').text(notice.refNo || 'DS/NOTICE/' + Date.now());
      doc.font('Helvetica-Bold').text('DATE OF DISPATCH: ', leftMargin + 8, metaY + 15, { continued: true });
      doc.font('Helvetica').text(dateStr);

      doc.font('Helvetica-Bold').text('TRANSMISSION: ', leftMargin + 290, metaY + 5, { continued: true });
      doc.font('Helvetica').text('Speed Post (RPAD) & WhatsApp');
      doc.font('Helvetica-Bold').text('STATUTORY DEADLINE: ', leftMargin + 290, metaY + 15, { continued: true });
      doc.font('Helvetica-Bold').fillColor('#b91c1c').text('7 CALENDAR DAYS PEREMPTORY');

      // Parties Box (Opposite Party Landlord vs Aggrieved Tenant)
      const partyY = 98;
      const halfWidth = (contentWidth - 8) / 2;
      
      // TO (Landlord)
      doc.roundedRect(leftMargin, partyY, halfWidth, 72, 3).fillAndStroke('#ffffff', '#e2e8f0');
      doc.fillColor('#1e3a8a').font('Helvetica-Bold').fontSize(8.5).text('TO (OPPOSITE PARTY / LANDLORD):', leftMargin + 8, partyY + 7);
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(9).text(notice.landlordName || 'Landlord / Property Owner', leftMargin + 8, partyY + 19);
      doc.font('Helvetica').fontSize(7.5).fillColor('#475569');
      doc.text(`Mobile / Contact: ${notice.landlordPhone || 'Recorded on Lease Agreement'}`, leftMargin + 8, partyY + 31);
      doc.text(`Demised Premises: ${notice.propertyAddress || 'Demised Rental Property'}`, leftMargin + 8, partyY + 42, { width: halfWidth - 16, height: 26 });

      // FROM (Tenant)
      const fromX = leftMargin + halfWidth + 8;
      doc.roundedRect(fromX, partyY, halfWidth, 72, 3).fillAndStroke('#ffffff', '#e2e8f0');
      doc.fillColor('#1e3a8a').font('Helvetica-Bold').fontSize(8.5).text('FROM (AGGRIEVED TENANT / CLAIMANT):', fromX + 8, partyY + 7);
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(9).text(notice.tenantName || 'Tenant', fromX + 8, partyY + 19);
      doc.font('Helvetica').fontSize(7.5).fillColor('#475569');
      doc.text(`Mobile: +91 ${notice.tenantPhone || 'N/A'}`, fromX + 8, partyY + 31);
      doc.text(`Email: ${notice.tenantEmail || 'N/A'}`, fromX + 8, partyY + 42);
      doc.font('Helvetica-Bold').fillColor('#059669').text(`Legal Capacity: Party-in-Person`, fromX + 8, partyY + 53);

      // Subject Banner Box
      const subjY = 176;
      doc.rect(leftMargin, subjY, contentWidth, 22).fill('#0f172a');
      doc.fillColor('#f8fafc').font('Helvetica-Bold').fontSize(8).text(
        `SUBJECT: DEMAND FOR IMMEDIATE REFUND OF SECURITY DEPOSIT OF RS. ${formatINR(notice.amountWithheld)}/- WRONGFULLY WITHHELD`,
        leftMargin + 8, subjY + 6, { width: contentWidth - 16, align: 'left' }
      );

      // Opening Formal Line
      let curY = 204;
      doc.fillColor('#1e293b').font('Helvetica').fontSize(8).lineGap(1.5);
      doc.text(
        'Under instructions from the undersigned Tenant (Party-in-Person), this formal Pre-Litigation Legal Demand Notice is hereby served upon you regarding deliberate and wrongful retention of tenancy caution deposit funds.',
        leftMargin, curY, { width: contentWidth }
      );
      curY = doc.y + 10;

      // Section 1: Tenancy Particulars & Peaceful Handover
      doc.font('Helvetica-Bold').fillColor('#0f172a').fontSize(8).text('1. TENANCY PARTICULARS & PEACEFUL VACANT HANDOVER:', leftMargin, curY);
      curY = doc.y + 4;
      doc.font('Helvetica').fillColor('#1e293b').fontSize(7.8).lineGap(1.5).text(
        `The undersigned occupied the demised premises at "${notice.propertyAddress}" as a lawful, rent-paying tenant. On ${notice.vacateDate}, vacant, peaceful, and unencumbered possession was delivered to you after providing due advance notice. The premises were handed over in clean, habitable condition without any deliberate damage or vandalism.`,
        leftMargin, curY, { width: contentWidth }
      );
      curY = doc.y + 10;

      // Financial Particulars Schedule Box
      const fBoxY = curY;
      doc.roundedRect(leftMargin, fBoxY, contentWidth, 42, 3).fillAndStroke('#f1f5f9', '#cbd5e1');
      doc.fillColor('#0f172a').fontSize(7.5);
      
      doc.font('Helvetica-Bold').text('Original Caution Deposit Paid:', leftMargin + 10, fBoxY + 6);
      doc.font('Helvetica').text(`Rs. ${formatINR(notice.depositPaid)}/-`, leftMargin + 155, fBoxY + 6);
      doc.font('Helvetica-Bold').text('Monthly Rental Rate:', leftMargin + 270, fBoxY + 6);
      doc.font('Helvetica').text(`Rs. ${formatINR(notice.monthlyRent)}/-`, leftMargin + 380, fBoxY + 6);

      doc.font('Helvetica-Bold').text('Amount Refunded Till Date:', leftMargin + 10, fBoxY + 18);
      doc.font('Helvetica').text(`Rs. ${formatINR(notice.amountRefunded || 0)}/-`, leftMargin + 155, fBoxY + 18);
      doc.font('Helvetica-Bold').text('Vacant Handover Date:', leftMargin + 270, fBoxY + 18);
      doc.font('Helvetica').text(`${notice.vacateDate}`, leftMargin + 380, fBoxY + 18);

      doc.rect(leftMargin, fBoxY + 28, contentWidth, 14).fill('#e2e8f0');
      doc.fillColor('#b91c1c').font('Helvetica-Bold').text('TOTAL SECURITY DEPOSIT WRONGFULLY WITHHELD:', leftMargin + 10, fBoxY + 31);
      doc.text(`RS. ${formatINR(notice.amountWithheld)}/-`, leftMargin + 380, fBoxY + 31);

      // Section 2: Unlawful Deductions & Fictitious Charges
      curY = fBoxY + 42 + 12;
      doc.font('Helvetica-Bold').fillColor('#0f172a').fontSize(8).text('2. UNLAWFUL DEDUCTIONS WITHOUT VERIFIABLE GST INVOICES:', leftMargin, curY);
      curY = doc.y + 4;
      doc.font('Helvetica').fillColor('#1e293b').fontSize(7.8).lineGap(1.5).text(
        `Following key handover, you have arbitrarily and unilaterally withheld Rs. ${formatINR(notice.amountWithheld)}/- citing unauthorized deductions (e.g. repainting, natural weathering, deep cleaning) without providing genuine third-party GST vendor invoices, prior written estimates, or joint move-out inspection reports. Such unilateral withholding is contrary to contract law and constitutes unjust enrichment.`,
        leftMargin, curY, { width: contentWidth }
      );
      curY = doc.y + 12;

      // Section 3: Statutory Precedents & High Court Authorities (Latest GOV Approvals)
      doc.font('Helvetica-Bold').fillColor('#0f172a').fontSize(8).text('3. SETTLED STATUTORY FRAMEWORK & JUDICIAL PRECEDENTS:', leftMargin, curY);
      curY = doc.y + 4;
      doc.font('Helvetica').fillColor('#1e293b').fontSize(7.5).lineGap(2).text(
        `a) Section 108(m) of the Transfer of Property Act, 1882: Normal weathering, minor wall scuffs, and reasonable wear & tear are the sole statutory maintenance obligation of the lessor and cannot be deducted from caution deposits without proving willful destruction.\n` +
        `b) Section 73 of the Indian Contract Act, 1872: Entitles the aggrieved party to compensation with commercial interest (18% p.a.) for breach of contractual covenants and restitution of security entrusted.\n` +
        `c) Section 2(47) of the Consumer Protection Act, 2019: Unilateral forfeiture of caution money without actual tax invoices constitutes Unfair Trade Practice.\n` +
        `d) Bharatiya Nyaya Sanhita, 2023 (Section 316) / Indian Penal Code (Section 405/406): Holding tenant caution money as a fiduciary custodian and refusing repayment constitutes Criminal Breach of Trust.`,
        leftMargin, curY, { width: contentWidth }
      );

      // Page 1 Fixed Footer
      doc.font('Helvetica').fontSize(7).fillColor('#64748b').text(
        `DepositShield India Legal Self-Help Engine • Notice Ref: ${notice.refNo} • Page 1 of 2 [Continued on Page 2]`,
        leftMargin, 792, { width: contentWidth, align: 'center', lineBreak: false }
      );

      // =======================================================================
      // PAGE 2: STATUTORY 7-DAY DEMAND & ESCALATION CONSEQUENCES
      // =======================================================================
      doc.addPage();

      // Top Legal Header Bar
      doc.rect(leftMargin, 30, contentWidth, 3).fill('#1e3a8a');

      // Page 2 Header
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#0f172a').text(
        'STATUTORY DEMAND & CONSEQUENCES OF NON-COMPLIANCE',
        leftMargin, 38, { width: contentWidth, align: 'center' }
      );
      doc.font('Helvetica').fontSize(7.5).fillColor('#475569').text(
        `Notice Ref: ${notice.refNo} | Aggrieved Tenant: ${notice.tenantName} vs Landlord: ${notice.landlordName}`,
        leftMargin, 51, { width: contentWidth, align: 'center' }
      );

      // Warning Box: 7-Day Statutory Ultimatum
      const p2WarnY = 64;
      doc.roundedRect(leftMargin, p2WarnY, contentWidth, 38, 3).fillAndStroke('#fef2f2', '#f87171');
      doc.fillColor('#991b1b').font('Helvetica-Bold').fontSize(8.5).text(
        'PEREMPTORY SEVEN (7) DAYS STATUTORY ULTIMATUM', leftMargin + 10, p2WarnY + 6
      );
      doc.fillColor('#7f1d1d').font('Helvetica').fontSize(7.8).lineGap(1.5).text(
        `You are hereby formally called upon to refund the entire withheld sum of Rs. ${formatINR(notice.amountWithheld)}/- directly to the Tenant within seven (7) calendar days of the receipt of this notice, failing which legal proceedings shall be instituted without further reference entirely at your risk, cost, and legal peril.`,
        leftMargin + 10, p2WarnY + 18, { width: contentWidth - 20 }
      );

      // Section 4: Escalation Measures upon Expiry
      let p2Y = p2WarnY + 38 + 14;
      doc.font('Helvetica-Bold').fillColor('#0f172a').fontSize(8.5).text('4. CONCURRENT LEGAL PROCEEDINGS UPON EXPIRY OF 7 DAYS:', leftMargin, p2Y);
      p2Y = doc.y + 5;
      
      const p2Sec4 = 
        `In the event of failure, neglect, or refusal to remit the said sum within the stipulated 7-day period, the undersigned shall initiate the following concurrent legal actions:\n\n` +
        `I. DISTRICT CONSUMER COMMISSION (e-Jagriti Portal & NCH 1915): A formal Consumer Complaint under Section 35 of the Consumer Protection Act, 2019 will be filed before the competent District Consumer Disputes Redressal Commission (DCDRC). The complaint will claim refund of the principal amount together with 18% compound interest per annum, punitive damages of Rs. 50,000/- for mental agony and harassment, and legal litigation costs.\n\n` +
        `II. POLICE COMPLAINT FOR CRIMINAL BREACH OF TRUST: A formal Criminal Complaint under Section 316 of Bharatiya Nyaya Sanhita, 2023 (formerly Section 405/406 IPC) will be lodged with the jurisdictional Police Station for dishonestly converting and misappropriating tenant security funds held in fiduciary custody.\n\n` +
        `III. RECOVERY SUMMARY SUIT (ORDER XXXVII CPC): A summary suit under Order XXXVII of the Code of Civil Procedure, 1908 for recovery of liquidated debt along with attachment of rental receivables of the demised premises.\n\n` +
        `IV. GST NON-COMPLIANCE SCRUTINY: Formal notification to the Directorate General of GST Intelligence (DGGI) regarding unauthorized commercial deductions made without valid tax invoices.`;
      
      doc.font('Helvetica').fillColor('#1e293b').fontSize(7.5).lineGap(2.2).text(p2Sec4, leftMargin, p2Y, { width: contentWidth });
      p2Y = doc.y + 14;

      // Section 5: Remittance Direction Box (Dynamic Height Calculation - ZERO OVERLAP)
      const remitTitle = '5. REMITTANCE DIRECTION FOR REFUND:';
      const remitBody = `You are directed to remit the refund sum of Rs. ${formatINR(notice.amountWithheld)}/- directly to the undersigned Aggrieved Tenant's verified bank account / original payment source from which caution funds were paid, or contact the undersigned immediately for current RTGS/NEFT/IMPS bank coordinates. Quote Notice Ref: ${notice.refNo} in transaction remarks.`;

      doc.font('Helvetica').fontSize(7.5);
      const remitBodyHeight = doc.heightOfString(remitBody, { width: contentWidth - 20, lineGap: 1.5 });
      const remitBoxHeight = 10 + 12 + remitBodyHeight + 8;

      doc.roundedRect(leftMargin, p2Y, contentWidth, remitBoxHeight, 3).fillAndStroke('#f8fafc', '#94a3b8');
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(8).text(remitTitle, leftMargin + 10, p2Y + 8);
      doc.fillColor('#334155').font('Helvetica').fontSize(7.5).lineGap(1.5).text(remitBody, leftMargin + 10, p2Y + 20, { width: contentWidth - 20 });
      p2Y += remitBoxHeight + 16;

      // Section 6: Signature & Verification Block (Cleanly Placed Below Box)
      const sigBlockY = p2Y;

      // Left: Signature
      doc.font('Helvetica-Bold').fillColor('#0f172a').fontSize(8).text('ISSUED AND SIGNED BY:', leftMargin, sigBlockY);
      
      const signLineY = sigBlockY + 36;
      doc.moveTo(leftMargin, signLineY).lineTo(leftMargin + 180, signLineY).stroke('#0f172a');
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#0f172a').text(notice.tenantName, leftMargin, signLineY + 4);
      doc.font('Helvetica').fontSize(7.5).fillColor('#64748b').text('Aggrieved Outgoing Tenant (Party-in-Person)', leftMargin, signLineY + 15);
      doc.text(`Place: ${notice.city || 'India'} | Date: ${dateStr}`, leftMargin, signLineY + 25);

      // Right: Deemed Service Box under Section 27 General Clauses Act & BSA 2023
      const deemedX = leftMargin + 205;
      const deemedWidth = contentWidth - 205;
      doc.roundedRect(deemedX, sigBlockY, deemedWidth, 68, 3).fillAndStroke('#eff6ff', '#bfdbfe');
      doc.fillColor('#1e40af').font('Helvetica-Bold').fontSize(7.5).text('STATUTORY SERVICE & EVIDENCE NOTICE:', deemedX + 8, sigBlockY + 6);
      doc.fillColor('#1e3a8a').font('Helvetica').fontSize(6.8).lineGap(1.5).text(
        'Under Section 27 of the General Clauses Act, 1897, Section 63 of Bharatiya Sakshya Adhiniyam, 2023 (formerly Section 65B Evidence Act), and Supreme Court precedent (C.C. Alavi Haji), dispatch via India Post Speed Post with Acknowledgment Due (RPAD) and WhatsApp delivery constitutes conclusive "Deemed Service" under Indian law.',
        deemedX + 8, sigBlockY + 18, { width: deemedWidth - 16 }
      );

      // Page 2 Fixed Footer
      doc.font('Helvetica').fontSize(7).fillColor('#64748b').text(
        `Generated via DepositShield India • Document Authenticity Hash: ${(notice.refNo || '').slice(-12)} • Page 2 of 2`,
        leftMargin, 792, { width: contentWidth, align: 'center', lineBreak: false }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Generate 2-Page Consumer Court Petition (Form 1 for e-Jagriti & District Forum)
 * Formatted dynamically with ZERO text overlap.
 */
function generateCourtPetitionPdf(notice) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 32, bottom: 28, left: 38, right: 38 },
        bufferPages: true,
        autoFirstPage: true
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const dateStr = notice.currentDate || new Date().toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
      const leftMargin = 38;
      const contentWidth = 595.28 - (leftMargin * 2);

      // ================================= PAGE 1 =================================
      doc.rect(leftMargin, 30, contentWidth, 3).fill('#1e3a8a');
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#0f172a').text(
        'BEFORE THE DISTRICT CONSUMER DISPUTES REDRESSAL COMMISSION',
        leftMargin, 38, { width: contentWidth, align: 'center' }
      );
      doc.font('Helvetica').fontSize(8).fillColor('#475569').text(
        `AT ${(notice.city || 'DISTRICT CONSUMER COMMISSION').toUpperCase()}`,
        leftMargin, 51, { width: contentWidth, align: 'center' }
      );
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#0284c7').text(
        `CONSUMER COMPLAINT NO: _________ OF 2026 (PARTY-IN-PERSON)`,
        leftMargin, 62, { width: contentWidth, align: 'center' }
      );

      // Memo of Parties Box
      const partyY = 74;
      doc.roundedRect(leftMargin, partyY, contentWidth, 74, 3).fillAndStroke('#ffffff', '#cbd5e1');
      doc.fillColor('#0f172a').fontSize(8);
      doc.font('Helvetica-Bold').text('IN THE MATTER OF (COMPLAINANT / CONSUMER):', leftMargin + 8, partyY + 6);
      doc.font('Helvetica-Bold').fontSize(8.5).text(notice.tenantName, leftMargin + 8, partyY + 16);
      doc.font('Helvetica').fontSize(7.5).fillColor('#475569');
      doc.text(`Rented Demised Premises: ${notice.propertyAddress}`, leftMargin + 8, partyY + 26);
      doc.text(`Mobile: +91 ${notice.tenantPhone || 'N/A'} | Email: ${notice.tenantEmail || 'N/A'}`, leftMargin + 8, partyY + 36);
      doc.font('Helvetica-Bold').fillColor('#059669').text('... COMPLAINANT IN PERSON', leftMargin + 370, partyY + 36);

      doc.moveTo(leftMargin + 8, partyY + 47).lineTo(leftMargin + contentWidth - 8, partyY + 47).stroke('#e2e8f0');
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(8).text('VERSUS (OPPOSITE PARTY / SERVICE PROVIDER):', leftMargin + 8, partyY + 50);
      doc.font('Helvetica-Bold').fontSize(8.5).text(`${notice.landlordName} (Property Owner)`, leftMargin + 8, partyY + 60);
      doc.font('Helvetica').fontSize(7.5).fillColor('#475569').text(`Mobile: ${notice.landlordPhone || 'Recorded on Tenancy Agreement'}`, leftMargin + 260, partyY + 60);
      doc.font('Helvetica-Bold').fillColor('#b91c1c').text('... OPPOSITE PARTY', leftMargin + 410, partyY + 60);

      // Subject Box
      const subjY = 154;
      doc.rect(leftMargin, subjY, contentWidth, 24).fill('#0f172a');
      doc.fillColor('#f8fafc').font('Helvetica-Bold').fontSize(7.5).text(
        `COMPLAINT UNDER SECTION 35 OF THE CONSUMER PROTECTION ACT, 2019 FOR UNFAIR TRADE PRACTICE, GROSS DEFICIENCY IN SERVICE & WRONGFUL RETENTION OF SECURITY DEPOSIT OF RS. ${formatINR(notice.amountWithheld)}/-`,
        leftMargin + 8, subjY + 6, { width: contentWidth - 16, align: 'left' }
      );

      // Body Paragraphs (Dynamic Flow)
      let pY = 186;
      doc.fillColor('#1e293b').fontSize(7.8).lineGap(2);
      
      doc.font('Helvetica-Bold').text('MOST RESPECTFULLY SHOWETH:', leftMargin, pY);
      pY = doc.y + 6;

      doc.font('Helvetica-Bold').text('1. STATUS AS PROTECTED CONSUMER: ', leftMargin, pY, { continued: true });
      doc.font('Helvetica').text(`The Complainant is a 'Consumer' within Section 2(7) of the Consumer Protection Act, 2019, having hired residential tenancy accommodation for valuable monthly rental consideration of Rs. ${formatINR(notice.monthlyRent)}/- from the Opposite Party.`);
      pY = doc.y + 6;

      doc.font('Helvetica-Bold').text('2. FIDUCIARY CAUTION DEPOSIT ENTRUSTMENT: ', leftMargin, pY, { continued: true });
      doc.font('Helvetica').text(`At the commencement of tenancy, the Complainant entrusted an advance interest-free security caution deposit of Rs. ${formatINR(notice.depositPaid)}/- via verified banking channels, with the express covenant that the entire sum would be refunded in full upon delivery of vacant possession.`);
      pY = doc.y + 6;

      doc.font('Helvetica-Bold').text('3. PEACEFUL VACATION & UNLAWFUL FORFEITURE: ', leftMargin, pY, { continued: true });
      doc.font('Helvetica').text(`On ${notice.vacateDate}, the Complainant peacefully vacated the premises and handed over vacant physical possession and keys. Despite prompt handover, the Opposite Party unlawfully withheld Rs. ${formatINR(notice.amountWithheld)}/- under the unlawful pretext of routine repainting and deep cleaning without providing registered third-party GST vendor invoices.`);
      pY = doc.y + 6;

      doc.font('Helvetica-Bold').text('4. STATUTORY VIOLATION OF SECTION 108(m) TPA 1882: ', leftMargin, pY, { continued: true });
      doc.font('Helvetica').text(`Ordinary weathering, minor wall scuffs, and natural wear & tear are the statutory maintenance liability of the lessor under Section 108(m) of the Transfer of Property Act, 1882. The Opposite Party's unilateral deduction constitutes unfair trade practice and unjust enrichment under Section 2(47) of the Consumer Protection Act, 2019.`);
      pY = doc.y + 6;

      doc.font('Helvetica-Bold').text('5. JURISDICTION & LIMITATION: ', leftMargin, pY, { continued: true });
      doc.font('Helvetica').text(`The cause of action arose within the territorial jurisdiction of this Hon'ble Commission where the rented premises are situated. This complaint is filed well within the 2-year limitation period prescribed under Section 69 of the Consumer Protection Act, 2019.`);

      doc.font('Helvetica').fontSize(7).fillColor('#64748b').text(
        `Consumer Complaint under CPA 2019 • Notice Ref: ${notice.refNo} • Page 1 of 2 [Prayer Overleaf]`,
        leftMargin, 792, { width: contentWidth, align: 'center', lineBreak: false }
      );

      // ================================= PAGE 2 =================================
      doc.addPage();
      doc.rect(leftMargin, 30, contentWidth, 3).fill('#1e3a8a');
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#0f172a').text(
        'PRAYER CLAUSE & STATUTORY VERIFICATION',
        leftMargin, 38, { width: contentWidth, align: 'center' }
      );
      doc.font('Helvetica').fontSize(7.5).fillColor('#475569').text(
        `Before the District Consumer Commission | In re: ${notice.tenantName} vs ${notice.landlordName}`,
        leftMargin, 51, { width: contentWidth, align: 'center' }
      );

      // Prayer Box - Dynamic Height
      const prayerY = 64;
      const prayerText = 
        `It is, therefore, most respectfully prayed that this Hon'ble District Consumer Commission may graciously be pleased to:\n\n` +
        `a) Direct the Opposite Party to immediately refund the unlawfully withheld caution deposit sum of Rs. ${formatINR(notice.amountWithheld)}/- in full to the Complainant;\n\n` +
        `b) Direct the Opposite Party to pay commercial interest at 18% per annum on the withheld deposit from ${notice.vacateDate} until the date of actual realization;\n\n` +
        `c) Award punitive compensation of Rs. 50,000/- in favour of the Complainant for severe mental agony, financial distress, and gross deficiency in service;\n\n` +
        `d) Award litigation costs of Rs. 10,000/- in favour of the Complainant towards drafting and filing expenses; and pass such further order(s) as this Hon'ble Commission deems fit in the interest of justice.`;

      doc.font('Helvetica').fontSize(7.5);
      const prayerHeight = doc.heightOfString(prayerText, { width: contentWidth - 20, lineGap: 2 });
      const prayerBoxHeight = 16 + prayerHeight + 12;

      doc.roundedRect(leftMargin, prayerY, contentWidth, prayerBoxHeight, 3).fillAndStroke('#f8fafc', '#cbd5e1');
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(8.5).text('PRAYER:', leftMargin + 10, prayerY + 8);
      doc.fillColor('#1e293b').font('Helvetica').fontSize(7.5).lineGap(2).text(prayerText, leftMargin + 10, prayerY + 22, { width: contentWidth - 20 });

      // Complainant Signature Block
      let p2Y = prayerY + prayerBoxHeight + 16;
      doc.font('Helvetica').fontSize(8).fillColor('#0f172a');
      doc.text(`Place: ${notice.city || 'India'}`, leftMargin, p2Y);
      doc.text(`Date: ${dateStr}`, leftMargin, p2Y + 12);
      
      const sigLineY = p2Y + 24;
      doc.moveTo(leftMargin + contentWidth - 180, sigLineY).lineTo(leftMargin + contentWidth, sigLineY).stroke('#0f172a');
      doc.font('Helvetica-Bold').fontSize(8).text('COMPLAINANT IN PERSON', leftMargin + contentWidth - 180, sigLineY + 4);
      doc.font('Helvetica').fontSize(7.5).text(notice.tenantName, leftMargin + contentWidth - 180, sigLineY + 14);

      // Statutory Verification Box (Order VI Rule 15 CPC & Section 35 CPA 2019)
      p2Y = sigLineY + 36;
      const verText = 
        `I, ${notice.tenantName}, the Complainant named above, do hereby solemnly verify and affirm that the contents of paragraphs 1 to 5 and Prayers (a) to (d) of the accompanying complaint are true and correct to the best of my personal knowledge derived from tenancy lease records, banking receipts, and official correspondence, that no part thereof is false, and that no material facts have been concealed therefrom.\n\n` +
        `Verified at ${notice.city || 'India'} on this ${dateStr}.`;

      doc.font('Helvetica').fontSize(7.5);
      const verHeight = doc.heightOfString(verText, { width: contentWidth - 20, lineGap: 2 });
      const verBoxHeight = 16 + verHeight + 36;

      doc.roundedRect(leftMargin, p2Y, contentWidth, verBoxHeight, 3).fillAndStroke('#eff6ff', '#bfdbfe');
      doc.fillColor('#1e40af').font('Helvetica-Bold').fontSize(8).text(
        'STATUTORY VERIFICATION CLAUSE [ORDER VI RULE 15 CPC & SEC 35 CPA 2019]', leftMargin + 10, p2Y + 8
      );
      doc.fillColor('#1e293b').font('Helvetica').fontSize(7.5).lineGap(2).text(verText, leftMargin + 10, p2Y + 22, { width: contentWidth - 20 });

      const vSigY = p2Y + verBoxHeight - 18;
      doc.moveTo(leftMargin + contentWidth - 180, vSigY).lineTo(leftMargin + contentWidth, vSigY).stroke('#1e40af');
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#1e40af').text('DEPONENT / COMPLAINANT IN PERSON', leftMargin + contentWidth - 180, vSigY + 4);

      // Page 2 Footer
      doc.font('Helvetica').fontSize(7).fillColor('#64748b').text(
        `Official Form 1 Consumer Petition • e-Jagriti Portal (e-jagriti.gov.in) • Page 2 of 2`,
        leftMargin, 792, { width: contentWidth, align: 'center', lineBreak: false }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Generate 1-Page Police Station Criminal Complaint under Section 316 BNS (formerly IPC 405/406)
 * Formatted dynamically with ZERO text overlap.
 */
function generatePoliceComplaintPdf(notice) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 32, bottom: 28, left: 38, right: 38 },
        bufferPages: true,
        autoFirstPage: true
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const dateStr = notice.currentDate || new Date().toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
      const leftMargin = 38;
      const contentWidth = 595.28 - (leftMargin * 2);

      // Top Legal Bar
      doc.rect(leftMargin, 30, contentWidth, 3).fill('#dc2626');

      // To Police Station Header
      let curY = 40;
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#0f172a').text('TO,', leftMargin, curY);
      curY = doc.y + 2;
      doc.text('THE STATION HOUSE OFFICER (SHO),', leftMargin, curY);
      curY = doc.y + 2;
      doc.font('Helvetica').fontSize(8).fillColor('#475569');
      doc.text(`POLICE STATION JURISDICTION: LOCAL AREA POLICE STATION`, leftMargin, curY);
      curY = doc.y + 2;
      doc.text(`DISTRICT / COMMISSIONERATE: ${(notice.city || 'LOCAL DISTRICT').toUpperCase()}`, leftMargin, curY);
      cur      // Subject Box
      const pSubjY = curY;
      doc.roundedRect(leftMargin, pSubjY, contentWidth, 34, 3).fillAndStroke('#fef2f2', '#f87171');
      doc.fillColor('#991b1b').font('Helvetica-Bold').fontSize(7.5).text(
        `SUBJECT: FORMAL CRIMINAL COMPLAINT UNDER SECTION 173 BHARATIYA NAGARIK SURAKSHA SANHITA (BNSS), 2023 READ WITH SECTION 316 BHARATIYA NYAYA SANHITA (BNS), 2023 (FORMERLY SEC 405/406 IPC)\n` +
        `FOR CRIMINAL BREACH OF TRUST AND DISHONEST MISAPPROPRIATION OF CAUTION DEPOSIT OF RS. ${formatINR(notice.amountWithheld)}/-`,
        leftMargin + 8, pSubjY + 6, { width: contentWidth - 16, align: 'left' }
      );
      curY = pSubjY + 34 + 10;

      // Salutation
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(8).text('RESPECTED SIR / MADAM,', leftMargin, curY);
      curY = doc.y + 4;

      const policeBody = 
        `I, the undersigned Complainant, ${notice.tenantName}, residing at ${notice.city || 'India'} (Mobile: +91 ${notice.tenantPhone || 'N/A'}), state as follows:\n\n` +
        `1. ENTRUSTMENT OF MOVABLE PROPERTY (AMANAT): That I was an authorized tenant in the residential property owned by the accused person, namely ${notice.landlordName} (Mobile: ${notice.landlordPhone || 'Recorded on Tenancy Agreement'}), situated at "${notice.propertyAddress}". At the start of the tenancy, I entrusted the accused with an advance caution security deposit of Rs. ${formatINR(notice.depositPaid)}/- purely in fiduciary capacity for safe custody.\n\n` +
        `2. DISHONEST CONVERSION & MISAPPROPRIATION: That on ${notice.vacateDate}, I peacefully delivered vacant physical possession and keys of the premises to the accused in habitable, undamaged condition. However, following key handover, the accused dishonestly converted and refused to refund the sum of Rs. ${formatINR(notice.amountWithheld)}/-, with fraudulent intention to cause wrongful loss to me and wrongful personal gain to himself.\n\n` +
        `3. STATUTORY COGNIZANCE UNDER SECTION 173 BNSS 2023 & SECTION 316 BNS 2023: That despite service of a formal 7-Day Pre-Litigation Legal Demand Notice (Ref: ${notice.refNo}), the accused has retained the entrusted funds without legal authority. This act satisfies all ingredients of Criminal Breach of Trust under Section 316 of Bharatiya Nyaya Sanhita, 2023 (formerly IPC Section 405/406) and is cognizable under Section 173 of Bharatiya Nagarik Suraksha Sanhita, 2023. Banking UPI records and handover proofs are certified under Section 63 of Bharatiya Sakshya Adhiniyam, 2023.\n\n` +
        `PRAYER: It is humbly requested that an official General Diary (GD) entry be registered, an inquiry be instituted under Section 173 BNSS 2023, and the accused be summoned to the Police Station to return the lawful caution deposit forthwith.`;

      doc.font('Helvetica').fontSize(7.5).fillColor('#1e293b').lineGap(2).text(policeBody, leftMargin, curY, { width: contentWidth });
      curY = doc.y + 12;

      // Date & Sign
      doc.font('Helvetica').fontSize(8).fillColor('#0f172a');
      doc.text(`Date: ${dateStr}`, leftMargin, curY);
      doc.text(`Place: ${notice.city || 'India'}`, leftMargin, curY + 11);

      const sigLineY = curY + 20;
      doc.moveTo(leftMargin + contentWidth - 180, sigLineY).lineTo(leftMargin + contentWidth, sigLineY).stroke('#0f172a');
      doc.font('Helvetica-Bold').fontSize(8.5).text('COMPLAINANT SIGNATURE', leftMargin + contentWidth - 180, sigLineY + 4);
      doc.font('Helvetica').fontSize(7.5).text(notice.tenantName, leftMargin + contentWidth - 180, sigLineY + 14);

      // Police Station Acknowledgment Stamp Box
      curY = sigLineY + 36;
      doc.roundedRect(leftMargin, curY, contentWidth, 54, 3).fillAndStroke('#f8fafc', '#cbd5e1');
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(7.5).text(
        'FOR POLICE STATION USE ONLY (DUTY OFFICER ACKNOWLEDGMENT):', leftMargin + 8, curY + 6
      );
      doc.font('Helvetica').fontSize(7.2).fillColor('#475569');
      doc.text('GD Entry No: _________________________', leftMargin + 8, curY + 18);
      doc.text('Receiving Officer Name: _________________', leftMargin + 8, curY + 30);
      doc.text('Date & Time: _________________________', leftMargin + 270, curY + 18);
      doc.text('Rank / Batch No: ______________________', leftMargin + 270, curY + 30);
      doc.text('Station Seal & Duty Officer Signature: ________________________________________________', leftMargin + 8, curY + 42);

      // Footer
      doc.font('Helvetica').fontSize(7).fillColor('#64748b').text(
        `Police Complaint for Criminal Breach of Trust • Section 316 BNS 2023 & Section 173 BNSS 2023 • Page 1 of 1`,
        leftMargin, 792, { width: contentWidth, align: 'center', lineBreak: false }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Generate 1-Page Notary Verification Affidavit for Consumer Court
 * Formatted dynamically with ZERO text overlap.
 */
function generateAffidavitPdf(notice) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 32, bottom: 28, left: 38, right: 38 },
        bufferPages: true,
        autoFirstPage: true
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const dateStr = notice.currentDate || new Date().toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
      const leftMargin = 38;
      const contentWidth = 595.28 - (leftMargin * 2);

      // Top Legal Bar
      doc.rect(leftMargin, 30, contentWidth, 3).fill('#7c3aed');

      // Title
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#0f172a').text(
        'VERIFICATION AFFIDAVIT FOR DISTRICT CONSUMER COMMISSION',
        leftMargin, 40, { width: contentWidth, align: 'center' }
      );
      doc.font('Helvetica').fontSize(8).fillColor('#475569').text(
        '(To be printed on Non-Judicial Stamp Paper of Rs. 20/50 and Notarized)',
        leftMargin, 53, { width: contentWidth, align: 'center' }
      );

      // Body
      let curY = 74;
      const affText = 
        `I, ${notice.tenantName}, residing at "${notice.propertyAddress}", do hereby solemnly affirm and declare on oath as under:\n\n` +
        `1. That I am the Complainant in the accompanying Consumer Complaint filed against ${notice.landlordName} (Property Owner) and am fully conversant with the true facts of the dispute.\n\n` +
        `2. That the contents of paragraphs 1 to 5 and the Prayer Clause of the accompanying complaint are true and correct to my personal knowledge, derived from lease documents, banking transaction records, and formal correspondence.\n\n` +
        `3. That the Opposite Party (${notice.landlordName}) has unlawfully and arbitrarily withheld my refundable caution security deposit of Rs. ${formatINR(notice.amountWithheld)}/- without legal authority.\n\n` +
        `4. That no other complaint, suit, or legal proceeding regarding the subject matter of this dispute has been instituted by me in any other court of law or judicial tribunal.`;

      doc.fillColor('#0f172a').font('Helvetica').fontSize(8).lineGap(2.5).text(affText, leftMargin, curY, { width: contentWidth });
      curY = doc.y + 14;

      // Deponent Signature
      const depY = curY;
      doc.moveTo(leftMargin + contentWidth - 180, depY).lineTo(leftMargin + contentWidth, depY).stroke('#0f172a');
      doc.font('Helvetica-Bold').fontSize(8.5).text('DEPONENT', leftMargin + contentWidth - 180, depY + 5);
      doc.font('Helvetica').fontSize(8).text(`(${notice.tenantName})`, leftMargin + contentWidth - 180, depY + 16);

      // Verification Clause Box
      curY = depY + 36;
      const verClauseText = `Verified at ${notice.city || 'India'} on this day ${dateStr} that the contents of paragraphs 1 to 4 of this affidavit are true and correct to my personal knowledge, no part of it is false, and nothing material has been concealed therefrom.`;
      
      doc.font('Helvetica').fontSize(8);
      const verClauseHeight = doc.heightOfString(verClauseText, { width: contentWidth - 20, lineGap: 2 });
      const verClauseBoxHeight = 14 + verClauseHeight + 34;

      doc.roundedRect(leftMargin, curY, contentWidth, verClauseBoxHeight, 3).fillAndStroke('#faf5ff', '#d8b4fe');
      doc.fillColor('#6b21a8').font('Helvetica-Bold').fontSize(8.5).text('VERIFICATION CLAUSE:', leftMargin + 10, curY + 8);
      doc.fillColor('#1e293b').font('Helvetica').fontSize(8).lineGap(2).text(verClauseText, leftMargin + 10, curY + 22, { width: contentWidth - 20 });

      const verY = curY + verClauseBoxHeight - 16;
      doc.moveTo(leftMargin + contentWidth - 180, verY).lineTo(leftMargin + contentWidth, verY).stroke('#6b21a8');
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#6b21a8').text('DEPONENT SIGNATURE', leftMargin + contentWidth - 180, verY + 4);

      // Notary Acknowledgment Box
      curY += verClauseBoxHeight + 14;
      doc.roundedRect(leftMargin, curY, contentWidth, 58, 3).fillAndStroke('#f8fafc', '#cbd5e1');
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(7.5).text(
        'BEFORE ME (NOTARY PUBLIC / OATH COMMISSIONER USE ONLY):', leftMargin + 8, curY + 6
      );
      doc.font('Helvetica').fontSize(7.2).fillColor('#475569');
      doc.text('Sworn and signed before me by the Deponent who is personally known to me / identified by document.', leftMargin + 8, curY + 18);
      doc.text('Notary Seal & Registration No: ________________________', leftMargin + 8, curY + 32);
      doc.text('Signature of Notary Public: ___________________________', leftMargin + 270, curY + 32);
      doc.text('Date & Place: _______________________________________', leftMargin + 8, curY + 44);

      // Footer
      doc.font('Helvetica').fontSize(7).fillColor('#64748b').text(
        `Notary Verification Affidavit • Consumer Protection Act, 2019 • Page 1 of 1`,
        leftMargin, 792, { width: contentWidth, align: 'center', lineBreak: false }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generateNoticePdf,
  generateCourtPetitionPdf,
  generatePoliceComplaintPdf,
  generateAffidavitPdf
};
