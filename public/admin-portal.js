// ==========================================================================
// DepositShield India - Admin Command Center Logic
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // UI Elements
  const loginScreen = document.getElementById('loginScreen');
  const dashboardScreen = document.getElementById('dashboardScreen');
  const loginForm = document.getElementById('adminLoginForm');
  const loginErrorMsg = document.getElementById('loginErrorMsg');
  const errorText = document.getElementById('errorText');
  const btnLogout = document.getElementById('btnLogout');
  const navTabs = document.querySelectorAll('.nav-tab');
  const tabContents = document.querySelectorAll('.tab-content');

  // Search & Filter Elements
  const searchSubmissions = document.getElementById('searchSubmissions');
  const btnRefreshSubmissions = document.getElementById('btnRefreshSubmissions');
  const searchPayments = document.getElementById('searchPayments');
  const filterPaymentStatus = document.getElementById('filterPaymentStatus');
  const searchInquiries = document.getElementById('searchInquiries');
  const filterInquiryStatus = document.getElementById('filterInquiryStatus');
  const btnRefreshInquiries = document.getElementById('btnRefreshInquiries');

  // Modal Elements
  const noticeDetailsModal = document.getElementById('noticeDetailsModal');
  const btnCloseNoticeModal = document.getElementById('btnCloseNoticeModal');
  const modalNoticeTitle = document.getElementById('modalNoticeTitle');
  const modalNoticeRef = document.getElementById('modalNoticeRef');
  const modalNoticeContent = document.getElementById('modalNoticeContent');

  // State cache
  let currentStats = null;

  // Show Toast
  function showToast(msg, type = 'success') {
    const toast = document.getElementById('toastNotification');
    toast.innerHTML = `<i class="fa-solid fa-${type === 'success' ? 'circle-check' : 'circle-exclamation'}"></i> ${msg}`;
    toast.style.borderColor = type === 'success' ? '#10b981' : '#ef4444';
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 4000);
  }

  // Display Webhook URL dynamically
  const displayWebhookUrl = document.getElementById('displayWebhookUrl');
  if (displayWebhookUrl) {
    displayWebhookUrl.textContent = `${window.location.origin}/api/webhook/payment`;
  }

  // 1. Check existing session on load
  checkAuthAndLoad();

  function checkAuthAndLoad() {
    fetch('/api/admin/dashboard-stats')
      .then(res => {
        if (!res.ok) throw new Error('Not logged in');
        return res.json();
      })
      .then(data => {
        currentStats = data;
        showDashboard();
        renderDashboard(data);
      })
      .catch(() => {
        showLogin();
      });
  }

  function showLogin() {
    loginScreen.classList.remove('hidden');
    dashboardScreen.classList.add('hidden');
  }

  function showDashboard() {
    loginScreen.classList.add('hidden');
    dashboardScreen.classList.remove('hidden');
  }

  // 2. Login Form Submission
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      loginErrorMsg.classList.add('hidden');
      const username = document.getElementById('adminUsername').value.trim();
      const password = document.getElementById('adminPassword').value.trim();

      fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showToast('Welcome back, Akash (aks008)!');
          checkAuthAndLoad();
        } else {
          loginErrorMsg.classList.remove('hidden');
          errorText.textContent = data.message || 'Invalid credentials';
        }
      })
      .catch(() => {
        loginErrorMsg.classList.remove('hidden');
        errorText.textContent = 'Server connection error. Please try again.';
      });
    });
  }

  // 3. Logout
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      fetch('/api/admin/auth/logout', { method: 'POST' })
        .then(() => {
          showToast('Logged out successfully');
          showLogin();
        });
    });
  }

  // 4. Tab Navigation
  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      navTabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const targetId = tab.dataset.tab;
      const targetContent = document.getElementById(targetId);
      if (targetContent) targetContent.classList.add('active');
    });
  });

  // 5. Render Dashboard & KPIs
  function renderDashboard(data) {
    if (!data) return;
    const { kpis, reports, notices, payments, settings } = data;

    // KPI Cards
    document.getElementById('kpiTodayRev').textContent = `₹${(kpis.todayRevenue || 0).toLocaleString('en-IN')}`;
    document.getElementById('kpiMonthRev').textContent = `₹${(kpis.monthRevenue || 0).toLocaleString('en-IN')}`;
    document.getElementById('kpiMonthOrders').textContent = `${kpis.totalOrders || 0} total paid orders`;
    document.getElementById('kpiYearRev').textContent = `₹${(kpis.yearRevenue || 0).toLocaleString('en-IN')}`;
    document.getElementById('kpiTotalRev').textContent = `₹${(kpis.totalRevenue || 0).toLocaleString('en-IN')}`;
    document.getElementById('kpiTotalOrders').textContent = `${kpis.totalOrders || 0} Transactions`;
    document.getElementById('kpiNoticesCount').textContent = `${kpis.totalNotices || 0}`;
    document.getElementById('kpiUnlockedCount').textContent = `${kpis.unlockedNotices || 0} notices unlocked`;
    document.getElementById('kpiConversionRate').textContent = `${kpis.conversionRate || 0}%`;

    // Tab badges
    document.getElementById('tabCountNotices').textContent = notices.length;
    document.getElementById('tabCountPayments').textContent = payments.length;
    const tabCountInquiries = document.getElementById('tabCountInquiries');
    if (tabCountInquiries) {
      tabCountInquiries.textContent = (data.inquiries || []).length;
    }

    // Render Tables
    renderNoticesTable(notices);
    renderPaymentsTable(payments);
    renderInquiriesTable(data.inquiries || []);
    renderReports(reports);
    populateSettingsForm(settings);
  }

  // TAB 1: Render User Tenancy Submissions Table
  function renderNoticesTable(noticesList) {
    const tbody = document.getElementById('submissionsTableBody');
    if (!noticesList || noticesList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="empty-state">No tenant submissions recorded yet in MongoDB Atlas.</td></tr>`;
      return;
    }

    const filterQuery = (searchSubmissions.value || '').toLowerCase().trim();
    const filtered = noticesList.filter(n => {
      if (!filterQuery) return true;
      return (
        (n.refNo && n.refNo.toLowerCase().includes(filterQuery)) ||
        (n.tenantName && n.tenantName.toLowerCase().includes(filterQuery)) ||
        (n.tenantPhone && n.tenantPhone.toLowerCase().includes(filterQuery)) ||
        (n.landlordName && n.landlordName.toLowerCase().includes(filterQuery)) ||
        (n.city && n.city.toLowerCase().includes(filterQuery))
      );
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="empty-state">No submissions match your search query.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(n => {
      const dateStr = n.createdAt ? new Date(n.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A';
      const statusClass = n.isUnlocked ? 'unlocked' : 'locked';
      const statusText = n.isUnlocked ? `UNLOCKED (${n.tierUnlocked || 'TIER_1'})` : 'LOCKED (Unpaid)';
      const excusesList = (n.excuses || []).join(', ') || 'N/A';

      return `
        <tr>
          <td><span class="ref-code">${n.refNo}</span></td>
          <td>${dateStr}</td>
          <td>
            <strong>${escapeHtml(n.tenantName)}</strong><br>
            <span style="font-size:0.75rem; color:#94a3b8;">${escapeHtml(n.tenantPhone)}</span>
          </td>
          <td>
            <strong>${escapeHtml(n.landlordName)}</strong><br>
            <span style="font-size:0.75rem; color:#94a3b8;">${escapeHtml(n.landlordPhone || 'N/A')}</span>
          </td>
          <td>${escapeHtml(n.city || 'India')}</td>
          <td><strong style="color:#ef4444;">₹${(n.amountWithheld || 0).toLocaleString('en-IN')}</strong></td>
          <td><span style="font-size:0.78rem; color:#cbd5e1;">${escapeHtml(excusesList)}</span></td>
          <td>
            <span class="badge-status ${statusClass}">${statusText}</span>
          </td>
          <td>
            <button type="button" class="btn-action-sm btn-view-notice" data-ref="${n.refNo}">
              <i class="fa-solid fa-eye"></i> View Details
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Attach click events for View Details
    document.querySelectorAll('.btn-view-notice').forEach(btn => {
      btn.addEventListener('click', () => {
        const ref = btn.dataset.ref;
        const notice = noticesList.find(item => item.refNo === ref);
        if (notice) openNoticeModal(notice);
      });
    });
  }

  // TAB 2: Render Payments & Webhooks Table
  function renderPaymentsTable(paymentsList) {
    const tbody = document.getElementById('paymentsTableBody');
    if (!paymentsList || paymentsList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="empty-state">No payment records found in MongoDB Atlas.</td></tr>`;
      return;
    }

    const filterQuery = (searchPayments.value || '').toLowerCase().trim();
    const statusFilter = filterPaymentStatus.value;

    const filtered = paymentsList.filter(p => {
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
      if (!filterQuery) return true;
      return (
        (p.paymentId && p.paymentId.toLowerCase().includes(filterQuery)) ||
        (p.orderId && p.orderId.toLowerCase().includes(filterQuery)) ||
        (p.noticeRefNo && p.noticeRefNo.toLowerCase().includes(filterQuery))
      );
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="empty-state">No payments match your filter criteria.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(p => {
      const dateStr = p.createdAt ? new Date(p.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A';
      const statusClass = p.status.toLowerCase();
      const tierBadge = p.tier === 'TIER_2' ? '<span class="badge-tier tier-2">Tier 2 (₹499)</span>' : '<span class="badge-tier">Tier 1 (₹99)</span>';
      const gatewayBadge = p.gateway === 'RAZORPAY' ? '<span style="color:#38bdf8; font-weight:700;"><i class="fa-solid fa-bolt"></i> Razorpay</span>' : '<span style="color:#a78bfa; font-weight:700;"><i class="fa-solid fa-qrcode"></i> UPI Direct</span>';

      const actionBtn = p.status === 'PENDING' ? `
        <button type="button" class="btn-action-sm btn-approve-sm btn-approve-payment" data-id="${p.paymentId}" data-ref="${p.noticeRefNo}">
          <i class="fa-solid fa-check"></i> Approve
        </button>
      ` : `<span style="font-size:0.75rem; color:#10b981;"><i class="fa-solid fa-circle-check"></i> Verified</span>`;

      return `
        <tr>
          <td><span class="ref-code">${p.paymentId}</span></td>
          <td><span class="ref-code" style="color:#94a3b8;">${p.noticeRefNo || 'N/A'}</span></td>
          <td><strong style="color:#10b981;">₹${p.amount}</strong></td>
          <td>${tierBadge}</td>
          <td>${gatewayBadge}</td>
          <td><span class="badge-status ${statusClass}">${p.status}</span></td>
          <td>${dateStr}</td>
          <td>${actionBtn}</td>
        </tr>
      `;
    }).join('');

    // Attach approve handlers
    document.querySelectorAll('.btn-approve-payment').forEach(btn => {
      btn.addEventListener('click', () => {
        const pId = btn.dataset.id;
        const pRef = btn.dataset.ref;
        if (confirm(`Manually approve payment for UTR/Payment ID: ${pId}?`)) {
          fetch('/api/admin/manual-approve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId: pId, noticeRefNo: pRef })
          })
          .then(res => res.json())
          .then(resData => {
            showToast(resData.message || 'Payment confirmed and unlocked!');
            checkAuthAndLoad();
          })
          .catch(() => showToast('Failed to approve payment', 'error'));
        }
      });
    });
  }

  // TAB 2.5: Render Customer Inquiries & Leads Table
  function renderInquiriesTable(inquiriesList) {
    const tbody = document.getElementById('inquiriesTableBody');
    if (!tbody) return;
    if (!inquiriesList || inquiriesList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="empty-state">No callback inquiries recorded yet.</td></tr>`;
      return;
    }

    const filterQuery = (searchInquiries?.value || '').toLowerCase().trim();
    const statusFilter = filterInquiryStatus?.value || 'ALL';

    const filtered = inquiriesList.filter(i => {
      if (statusFilter !== 'ALL' && i.status !== statusFilter) return false;
      if (!filterQuery) return true;
      return (
        (i.inquiryId && i.inquiryId.toLowerCase().includes(filterQuery)) ||
        (i.name && i.name.toLowerCase().includes(filterQuery)) ||
        (i.phone && i.phone.includes(filterQuery)) ||
        (i.city && i.city.toLowerCase().includes(filterQuery)) ||
        (i.message && i.message.toLowerCase().includes(filterQuery))
      );
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="empty-state">No inquiries match your filter criteria.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(i => {
      const dateStr = i.createdAt ? new Date(i.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A';
      const statusBadge = i.status === 'NEW' 
        ? `<span class="badge-status pending"><i class="fa-solid fa-bell"></i> NEW LEAD</span>` 
        : `<span class="badge-status unlocked"><i class="fa-solid fa-check-double"></i> CONTACTED</span>`;
      
      const phoneDigits = String(i.phone).replace(/\D/g, '');
      const waMsg = encodeURIComponent(`Hello ${i.name}, this is DepositShield India team regarding your rental deposit refund inquiry.`);

      return `
        <tr>
          <td>
            <span class="ref-code">${i.inquiryId}</span><br>
            <span style="font-size:0.75rem; color:#94a3b8;">${dateStr}</span>
          </td>
          <td>
            <strong style="color:#f8fafc; font-size:0.95rem;">${escapeHtml(i.name)}</strong>
          </td>
          <td>
            <div style="display:flex; flex-direction:column; gap:0.4rem;">
              <a href="tel:+91${phoneDigits}" style="color:#38bdf8; font-weight:700; text-decoration:none; display:inline-flex; align-items:center; gap:0.35rem; font-size:0.92rem;">
                <i class="fa-solid fa-phone"></i> +91 ${i.phone}
              </a>
              <a href="https://wa.me/91${phoneDigits}?text=${waMsg}" target="_blank" style="background:#22c55e; color:#ffffff; font-size:0.75rem; font-weight:700; padding:0.25rem 0.6rem; border-radius:4px; text-decoration:none; display:inline-flex; align-items:center; gap:0.35rem; width:fit-content;">
                <i class="fa-brands fa-whatsapp"></i> Chat on WhatsApp
              </a>
            </div>
          </td>
          <td><span style="color:#cbd5e1;">${escapeHtml(i.city || 'N/A')}</span></td>
          <td><strong style="color:#ef4444;">₹${(i.amountWithheld || 0).toLocaleString('en-IN')}</strong></td>
          <td style="max-width:240px; font-size:0.8rem; color:#94a3b8; line-height:1.4;">
            ${escapeHtml(i.message || 'No description provided')}
          </td>
          <td>${statusBadge}</td>
          <td>
            <button type="button" class="btn-action-sm btn-toggle-inquiry-status" data-id="${i.inquiryId}" data-status="${i.status === 'NEW' ? 'CONTACTED' : 'NEW'}">
              <i class="fa-solid fa-${i.status === 'NEW' ? 'check' : 'rotate-left'}"></i>
              ${i.status === 'NEW' ? 'Mark Contacted' : 'Mark New'}
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Attach click handlers to Mark Contacted / New
    document.querySelectorAll('.btn-toggle-inquiry-status').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const newStatus = btn.dataset.status;
        fetch('/api/admin/inquiry/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inquiryId: id, status: newStatus })
        })
        .then(res => res.json())
        .then(resData => {
          showToast(resData.message || `Inquiry marked as ${newStatus}`);
          checkAuthAndLoad();
        })
        .catch(() => showToast('Failed to update inquiry status', 'error'));
      });
    });
  }

  // TAB 3: Populate Settings Form
  function populateSettingsForm(cfg) {
    if (!cfg) return;
    document.getElementById('cfgTier1Price').value = cfg.tier1Price || 99;
    document.getElementById('cfgTier2Price').value = cfg.tier2Price || 499;
    document.getElementById('cfgUpiId').value = cfg.upiId || '8000757744@upi';
    document.getElementById('cfgDirectUpiEnabled').checked = Boolean(cfg.directUpiEnabled);

    document.getElementById('cfgRzpKeyId').value = cfg.razorpayKeyId || '';
    document.getElementById('cfgRazorpayEnabled').checked = Boolean(cfg.razorpayEnabled);
  }

  // Save Pricing Settings
  const pricingConfigForm = document.getElementById('pricingConfigForm');
  if (pricingConfigForm) {
    pricingConfigForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const payload = {
        tier1Price: document.getElementById('cfgTier1Price').value,
        tier2Price: document.getElementById('cfgTier2Price').value,
        upiId: document.getElementById('cfgUpiId').value.trim(),
        directUpiEnabled: false
      };

      fetch('/api/admin/update-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showToast(data.message || 'Product prices updated successfully!');
        } else {
          showToast(data.error || 'Failed to update pricing', 'error');
        }
      })
      .catch(() => showToast('Server update error', 'error'));
    });
  }

  // Save Razorpay Settings
  const razorpayConfigForm = document.getElementById('razorpayConfigForm');
  if (razorpayConfigForm) {
    razorpayConfigForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const keyId = document.getElementById('cfgRzpKeyId').value.trim();
      const keySecret = document.getElementById('cfgRzpKeySecret').value.trim();
      const enabled = document.getElementById('cfgRazorpayEnabled').checked;

      const payload = {
        razorpayKeyId: keyId,
        razorpayEnabled: enabled
      };
      if (keySecret) payload.razorpayKeySecret = keySecret;

      fetch('/api/admin/update-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showToast(data.message || 'Razorpay configuration updated successfully!');
          document.getElementById('cfgRzpKeySecret').value = '';
        } else {
          showToast(data.error || 'Failed to update Razorpay settings', 'error');
        }
      })
      .catch(() => showToast('Server error saving Razorpay config', 'error'));
    });
  }

  // TAB 4: Render Reports (Daily, Monthly, Yearly)
  function renderReports(reports) {
    if (!reports) return;

    // Daily Table
    const dailyTbody = document.getElementById('dailyReportTableBody');
    const dailyList = (reports.daily || []).reverse();
    if (dailyList.length === 0) {
      dailyTbody.innerHTML = `<tr><td colspan="3" class="empty-state">No daily data available yet.</td></tr>`;
    } else {
      dailyTbody.innerHTML = dailyList.map(d => `
        <tr>
          <td><strong style="color:#cbd5e1;">${d.date}</strong></td>
          <td>${d.count} orders</td>
          <td><strong style="color:#10b981;">₹${(d.revenue || 0).toLocaleString('en-IN')}</strong></td>
        </tr>
      `).join('');
    }

    // Monthly Table
    const monthlyTbody = document.getElementById('monthlyReportTableBody');
    const monthlyList = reports.monthly || [];
    monthlyTbody.innerHTML = monthlyList.map(m => `
      <tr>
        <td><strong>${m.month} ${m.year}</strong></td>
        <td>${m.count} orders</td>
        <td><strong style="color:#38bdf8;">₹${(m.revenue || 0).toLocaleString('en-IN')}</strong></td>
      </tr>
    `).join('');

    // Yearly Summary
    const yearly = reports.yearly && reports.yearly[0];
    if (yearly) {
      document.getElementById('yearlySummaryRev').textContent = `₹${(yearly.revenue || 0).toLocaleString('en-IN')}`;
    }
  }

  // Search filter event listeners
  if (searchSubmissions) searchSubmissions.addEventListener('input', () => {
    if (currentStats) renderNoticesTable(currentStats.notices);
  });
  if (btnRefreshSubmissions) btnRefreshSubmissions.addEventListener('click', checkAuthAndLoad);

  if (searchPayments) searchPayments.addEventListener('input', () => {
    if (currentStats) renderPaymentsTable(currentStats.payments);
  });
  if (filterPaymentStatus) filterPaymentStatus.addEventListener('change', () => {
    if (currentStats) renderPaymentsTable(currentStats.payments);
  });

  if (searchInquiries) searchInquiries.addEventListener('input', () => {
    if (currentStats) renderInquiriesTable(currentStats.inquiries);
  });
  if (filterInquiryStatus) filterInquiryStatus.addEventListener('change', () => {
    if (currentStats) renderInquiriesTable(currentStats.inquiries);
  });
  if (btnRefreshInquiries) btnRefreshInquiries.addEventListener('click', checkAuthAndLoad);

  // Modal inspection
  function openNoticeModal(notice) {
    modalNoticeTitle.textContent = `${notice.tenantName} vs ${notice.landlordName}`;
    modalNoticeRef.textContent = `Ref: ${notice.refNo}`;

    modalNoticeContent.innerHTML = `
      <div class="notice-detail-section">
        <h4>Tenancy & Rental Agreement</h4>
        <div class="detail-grid-row">
          <div><span>City:</span> <strong>${escapeHtml(notice.city)}</strong></div>
          <div><span>Property Address:</span> <strong>${escapeHtml(notice.propertyAddress)}</strong></div>
          <div><span>Vacate Date:</span> <strong>${notice.vacateDate || 'N/A'}</strong></div>
          <div><span>IP Address:</span> <code style="font-size:0.8rem; color:#94a3b8;">${notice.ipAddress || 'N/A'}</code></div>
        </div>
      </div>

      <div class="notice-detail-section">
        <h4>Financial Breakdown</h4>
        <div class="detail-grid-row">
          <div><span>Deposit Paid:</span> <strong>₹${(notice.depositPaid || 0).toLocaleString('en-IN')}</strong></div>
          <div><span>Monthly Rent:</span> <strong>₹${(notice.monthlyRent || 0).toLocaleString('en-IN')}</strong></div>
          <div><span>Amount Refunded:</span> <strong>₹${(notice.amountRefunded || 0).toLocaleString('en-IN')}</strong></div>
          <div><span>Amount Withheld:</span> <strong style="color:#ef4444;">₹${(notice.amountWithheld || 0).toLocaleString('en-IN')}</strong></div>
        </div>
      </div>

      <div class="notice-detail-section">
        <h4>Landlord Claims / Excuses</h4>
        <div style="background:rgba(15,23,42,0.6); padding:0.85rem; border-radius:8px; border:1px solid rgba(255,255,255,0.05);">
          ${(notice.excuses || []).map(exc => `<span class="badge-tier" style="margin-right:0.4rem; margin-bottom:0.4rem; display:inline-block;">${escapeHtml(exc)}</span>`).join('')}
        </div>
      </div>

      <div class="notice-detail-section">
        <h4>Unlock & Document Access Status</h4>
        <div class="detail-grid-row">
          <div><span>Status:</span> <strong style="color:${notice.isUnlocked ? '#10b981' : '#f59e0b'};">${notice.isUnlocked ? 'Unlocked & Downloaded' : 'Locked (Pending Payment)'}</strong></div>
          <div><span>Tier:</span> <strong>${notice.tierUnlocked || 'None'}</strong></div>
          <div><span>Unlocked Timestamp:</span> <span>${notice.unlockedAt ? new Date(notice.unlockedAt).toLocaleString('en-IN') : 'N/A'}</span></div>
        </div>
      </div>
    `;

    noticeDetailsModal.classList.remove('hidden');
  }

  if (btnCloseNoticeModal) {
    btnCloseNoticeModal.addEventListener('click', () => noticeDetailsModal.classList.add('hidden'));
  }
  noticeDetailsModal.addEventListener('click', (e) => {
    if (e.target === noticeDetailsModal) noticeDetailsModal.classList.add('hidden');
  });

  // Copy Sales Reply Template
  const btnCopySalesReply = document.getElementById('btnCopySalesReply');
  if (btnCopySalesReply) {
    btnCopySalesReply.addEventListener('click', () => {
      const text = document.getElementById('salesReplyTemplate').value;
      navigator.clipboard.writeText(text);
      showToast('Copied Reddit conversion pitch to clipboard!');
    });
  }

  // Copy Startup Sale Listing
  const btnCopyStartupListing = document.getElementById('btnCopyStartupListing');
  if (btnCopyStartupListing) {
    btnCopyStartupListing.addEventListener('click', () => {
      const text = document.getElementById('startupSaleTemplate').value;
      navigator.clipboard.writeText(text);
      showToast('Copied Acquisition Listing Memorandum to clipboard!');
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m]));
  }
});
