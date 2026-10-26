// ==========================================================================
// DepositShield India - Frontend Application Logic
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // App State
  const state = {
    currentStep: 1,
    isUnlocked: false,
    config: {
      upiId: '8000757744@upi',
      priceInr: 99,
      testMode: true
    },
    formData: {
      city: 'Bengaluru, Karnataka',
      tenantName: 'Rahul Sharma',
      tenantPhone: '+91 9876543210',
      tenantEmail: 'rahul@example.com',
      landlordName: 'K. V. Narayana',
      landlordPhone: '+91 9811122233',
      propertyAddress: 'Flat 302, Green Glen Layout, Bellandur, Bengaluru - 560103',
      tenancyStartDate: '',
      vacateDate: '2026-10-15',
      depositPaid: 100000,
      monthlyRent: 25000,
      amountRefunded: 0,
      amountWithheld: 45000,
      excuses: ['Painting Charges', 'Deep Cleaning Charges'],
      noticeServed: 'Yes',
      flatCondition: 'Yes',
      refNo: 'DS/' + new Date().getFullYear() + '/BLR-' + Math.floor(1000 + Math.random() * 9000),
      currentDate: new Date().toLocaleDateString('en-GB')
    }
  };

  // Fetch server config
  fetch('/api/config')
    .then(res => res.json())
    .then(data => {
      state.config = { ...state.config, ...data };
      const t1El = document.getElementById('planTier1PriceVal');
      const t2El = document.getElementById('planTier2PriceVal');
      if (t1El) t1El.textContent = `₹${state.config.priceInr || 99}`;
      if (t2El) t2El.textContent = `₹${state.config.tier2PriceInr || 499}`;
      if (typeof setPaymentTier === 'function') setPaymentTier('TIER_2');
    })
    .catch(() => {
      if (typeof setPaymentTier === 'function') setPaymentTier('TIER_2');
    });

  // ==========================================================================
  // Quick Legality Checker Widget
  // ==========================================================================
  const deductionSelect = document.getElementById('deductionTypeSelect');
  const verdictStatus = document.getElementById('verdictStatus');
  const verdictExplanation = document.getElementById('verdictExplanation');
  const verdictStatute = document.getElementById('verdictStatute');

  const verdictData = {
    painting: {
      status: 'VERDICT: 100% UNLAWFUL DEDUCTION',
      explanation: 'Under Section 108 of the Transfer of Property Act, 1882 and multiple High Court rulings, normal weathering, fading paint, and ordinary wear & tear are the sole maintenance obligation of the property owner. Forcing tenants to pay for fresh repainting without willful vandalism constitutes an illegal forfeiture of caution deposit.',
      statutes: 'Sec 73 Indian Contract Act, Sec 108 Transfer of Property Act, Model Tenancy Act (Sec 13).'
    },
    cleaning: {
      status: 'VERDICT: UNLAWFUL WITHOUT ACTUAL GST INVOICES',
      explanation: 'Deducting arbitrary "deep cleaning" amounts (₹5,000 - ₹15,000) without verifiable third-party GST vendor tax invoices constitutes unfair trade practices under Section 2(47) of the Consumer Protection Act, 2019.',
      statutes: 'Consumer Protection Act 2019 (Sec 2(47)), Doctrine of Restitution (Sec 65 Contract Act).'
    },
    wear_tear: {
      status: 'VERDICT: EXPLICITLY ILLEGAL UNDER LAW',
      explanation: 'Indian contract law firmly establishes the "Doctrine of Reasonable Wear and Tear". Landlords are strictly barred from passing ordinary property aging, minor wall scuffs, or natural wear onto the tenant.',
      statutes: 'Transfer of Property Act 1882 (Sec 108(m)), Karnataka Rent Control Act.'
    },
    delay: {
      status: 'VERDICT: BREACH OF MANDATORY STATUTORY TIMELINE',
      explanation: 'Under the Model Tenancy Act and standard rental agreement clauses, caution deposits must be refunded within 30 days of key handover. Any delay beyond 30 days attracts 12% to 18% statutory interest liability.',
      statutes: 'Model Tenancy Act (Sec 13), Sec 73 Indian Contract Act (Interest liability).'
    },
    ghosting: {
      status: 'VERDICT: CRIMINAL BREACH OF TRUST (SEC 405 IPC/BNS)',
      explanation: 'Holding caution deposit funds as a custodian and ignoring legitimate refund demands amounts to dishonest misappropriation of entrusted movable property, actionable under Section 405/406 IPC.',
      statutes: 'Sec 405/406 Indian Penal Code / Bharatiya Nyaya Sanhita, Consumer Protection Act.'
    },
    fake_repairs: {
      status: 'VERDICT: LANDLORD CAPITAL EXPENSE (CANNOT CHARGE TENANT)',
      explanation: 'Replacement of old plumbing lines, geyser heating coils, or pre-existing aging fixtures are structural capital repairs. Tenants are only liable for repairs caused by direct, proven accidental damage.',
      statutes: 'Model Tenancy Act (Schedule II - Landlord Structural Responsibilities).'
    },
    gujarat_hc: {
      status: 'VERDICT: ILLEGAL UNDER HIGH COURT OF GUJARAT PRECEDENTS',
      explanation: 'The High Court of Gujarat (Ahmedabad Bench) firmly prohibits unilateral landlord deductions for painting, plumbing, or repairs without a joint move-out inspection and verifiable third-party GST contractor invoices. Caution deposits are fiduciary trust funds, not discretionary landlord profit.',
      statutes: 'High Court of Gujarat Precedents, Gujarat Tenancy Framework, Sec 73 Indian Contract Act, Sec 35 Consumer Protection Act 2019.'
    },
    pg_lockin: {
      status: 'VERDICT: VOID PENAL FORFEITURE (SEC 74 CONTRACT ACT)',
      explanation: 'Under Section 52 of the Indian Easements Act and Section 2(46) of the Consumer Protection Act 2019, Paying Guest (PG) occupants are legally protected consumers. Arbitrary clauses forfeiting caution deposits under a 6-month or 11-month lock-in period without proving actual financial loss are illegal and void in law.',
      statutes: 'Sec 52 Indian Easements Act, Sec 74 Indian Contract Act, Sec 2(46) Consumer Protection Act 2019.'
    },
    job_relocation: {
      status: 'VERDICT: FULL REFUND MANDATORY (DOCTRINE OF FRUSTRATION)',
      explanation: 'When a corporate employee is transferred, relocated, or laid off, lease performance becomes impossible through no fault of the tenant. Under Section 56 of the Indian Contract Act, submitting an employer transfer letter with 30-day notice legally discharges the agreement without lock-in penalties.',
      statutes: 'Sec 56 Indian Contract Act (Doctrine of Frustration), Sec 65B Indian Evidence Act (WhatsApp/Email Notice).'
    },
    student_threat: {
      status: 'VERDICT: CRIMINAL EXTORTION UNDER SEC 308 BNS (IPC 383)',
      explanation: 'Withholding student marksheets, diplomas, laptops, or personal belongings to enforce deposit deductions constitutes criminal extortion under Section 308 BNS. Landlords have zero legal standing to contact college deans or debar students from exams over civil deposit disputes.',
      statutes: 'Sec 308 Bharatiya Nyaya Sanhita (IPC 383/384 Extortion), Sec 15 Indian Contract Act (Coercion).'
    }
  };

  if (deductionSelect) {
    deductionSelect.addEventListener('change', (e) => {
      const selected = verdictData[e.target.value] || verdictData.painting;
      verdictStatus.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> <strong>${selected.status}</strong>`;
      verdictExplanation.innerHTML = selected.explanation;
      verdictStatute.innerHTML = `<span><i class="fa-solid fa-book-bookmark"></i> Legal Grounds:</span> ${selected.statutes}`;
    });
  }

  // ==========================================================================
  // Custom City Dropdown & Live Filter Logic
  // ==========================================================================
  const citySelectWrapper = document.getElementById('citySelectWrapper');
  const tenantCityInput = document.getElementById('tenantCity');
  const cityDropdownList = document.getElementById('cityDropdownList');
  const cityChevron = document.getElementById('cityChevron');

  if (citySelectWrapper && tenantCityInput && cityDropdownList) {
    const dropdownItems = cityDropdownList.querySelectorAll('.dropdown-item:not(.custom-city-prompt)');
    const groupLabels = cityDropdownList.querySelectorAll('.dropdown-group-label');

    // Dynamic custom-city option element
    const customPromptEl = document.createElement('div');
    customPromptEl.className = 'dropdown-item custom-city-prompt';
    customPromptEl.style.display = 'none';
    customPromptEl.innerHTML = `<span><i class="fa-solid fa-map-pin"></i> Use custom: <strong id="customCityText"></strong></span> <i class="fa-solid fa-check"></i>`;
    cityDropdownList.appendChild(customPromptEl);

    function openCityDropdown() {
      citySelectWrapper.classList.add('open');
      filterCities(tenantCityInput.value);
    }

    function closeCityDropdown() {
      citySelectWrapper.classList.remove('open');
      clearItemHighlight();
    }

    function toggleCityDropdown() {
      if (citySelectWrapper.classList.contains('open')) {
        closeCityDropdown();
      } else {
        openCityDropdown();
      }
    }

    tenantCityInput.addEventListener('focus', openCityDropdown);
    tenantCityInput.addEventListener('click', (e) => {
      e.stopPropagation();
      openCityDropdown();
    });

    if (cityChevron) {
      cityChevron.addEventListener('click', (e) => {
        e.stopPropagation();
        tenantCityInput.focus();
        toggleCityDropdown();
      });
    }

    function selectCityValue(val) {
      if (!val) return;
      tenantCityInput.value = val;
      state.formData.city = val;

      dropdownItems.forEach(item => {
        if ((item.dataset.value && item.dataset.value.toLowerCase() === val.toLowerCase()) ||
            item.textContent.trim().toLowerCase() === val.toLowerCase()) {
          item.classList.add('selected');
        } else {
          item.classList.remove('selected');
        }
      });

      closeCityDropdown();
    }

    dropdownItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        selectCityValue(item.dataset.value || item.textContent.trim());
      });
    });

    customPromptEl.addEventListener('click', (e) => {
      e.stopPropagation();
      const val = tenantCityInput.value.trim();
      if (val) {
        selectCityValue(val);
      }
    });

    function filterCities(query) {
      const q = (query || '').toLowerCase().trim();
      let matchCount = 0;

      dropdownItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        const val = (item.dataset.value || '').toLowerCase();
        if (!q || text.includes(q) || val.includes(q)) {
          item.style.display = 'flex';
          matchCount++;
        } else {
          item.style.display = 'none';
        }
      });

      // Filter group labels
      groupLabels.forEach(label => {
        let sibling = label.nextElementSibling;
        let hasVisibleChild = false;
        while (sibling && !sibling.classList.contains('dropdown-group-label') && !sibling.classList.contains('custom-city-prompt')) {
          if (sibling.style.display !== 'none') {
            hasVisibleChild = true;
            break;
          }
          sibling = sibling.nextElementSibling;
        }
        label.style.display = hasVisibleChild ? 'block' : 'none';
      });

      // Show custom prompt if query exists and doesn't exactly match
      const customCityText = document.getElementById('customCityText');
      if (q.length > 0) {
        customPromptEl.style.display = 'flex';
        if (customCityText) customCityText.textContent = `"${tenantCityInput.value.trim()}"`;
      } else {
        customPromptEl.style.display = 'none';
      }
    }

    tenantCityInput.addEventListener('input', () => {
      if (!citySelectWrapper.classList.contains('open')) {
        openCityDropdown();
      }
      filterCities(tenantCityInput.value);
    });

    // Keyboard navigation (ArrowDown, ArrowUp, Enter, Escape)
    let highlightIndex = -1;

    function getVisibleItems() {
      const visible = [];
      dropdownItems.forEach(item => {
        if (item.style.display !== 'none') visible.push(item);
      });
      if (customPromptEl.style.display !== 'none') {
        visible.push(customPromptEl);
      }
      return visible;
    }

    function clearItemHighlight() {
      const visible = getVisibleItems();
      visible.forEach(it => it.classList.remove('highlighted'));
      highlightIndex = -1;
    }

    tenantCityInput.addEventListener('keydown', (e) => {
      if (!citySelectWrapper.classList.contains('open')) {
        if (e.key === 'ArrowDown' || e.key === 'Enter') {
          openCityDropdown();
          return;
        }
      }

      const visible = getVisibleItems();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (visible.length === 0) return;
        highlightIndex = (highlightIndex + 1) % visible.length;
        visible.forEach((it, idx) => {
          it.classList.toggle('highlighted', idx === highlightIndex);
          if (idx === highlightIndex) {
            it.scrollIntoView({ block: 'nearest' });
          }
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (visible.length === 0) return;
        highlightIndex = (highlightIndex - 1 + visible.length) % visible.length;
        visible.forEach((it, idx) => {
          it.classList.toggle('highlighted', idx === highlightIndex);
          if (idx === highlightIndex) {
            it.scrollIntoView({ block: 'nearest' });
          }
        });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (highlightIndex >= 0 && visible[highlightIndex]) {
          const selectedEl = visible[highlightIndex];
          if (selectedEl.classList.contains('custom-city-prompt')) {
            selectCityValue(tenantCityInput.value.trim());
          } else {
            selectCityValue(selectedEl.dataset.value || selectedEl.textContent.trim());
          }
        } else if (tenantCityInput.value.trim()) {
          selectCityValue(tenantCityInput.value.trim());
        }
      } else if (e.key === 'Escape') {
        closeCityDropdown();
      }
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (!citySelectWrapper.contains(e.target)) {
        closeCityDropdown();
      }
    });
  }

  // ==========================================================================
  // Stepper Wizard Navigation & Validation
  // ==========================================================================
  const stepIndicators = [
    document.getElementById('stepIndicator1'),
    document.getElementById('stepIndicator2'),
    document.getElementById('stepIndicator3'),
    document.getElementById('stepIndicator4')
  ];

  const stepContents = [
    document.getElementById('wizardStep1'),
    document.getElementById('wizardStep2'),
    document.getElementById('wizardStep3'),
    document.getElementById('wizardStep4')
  ];

  function goToStep(step) {
    if (step < 1 || step > 4) return;
    state.currentStep = step;

    stepContents.forEach((content, idx) => {
      if (idx + 1 === step) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });

    stepIndicators.forEach((ind, idx) => {
      if (idx + 1 === step) {
        ind.classList.add('active');
        ind.classList.remove('completed');
      } else if (idx + 1 < step) {
        ind.classList.add('completed');
        ind.classList.remove('active');
      } else {
        ind.classList.remove('active', 'completed');
      }
    });

    // Scroll smoothly to wizard container
    document.getElementById('wizardContainer').scrollIntoView({ behavior: 'smooth', block: 'start' });

    if (step === 4) {
      populateLegalDocument();
      // Auto-save user tenancy submission directly to MongoDB Atlas
      fetch('/api/save-notice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.formData)
      }).catch(err => console.warn('Could not auto-save to MongoDB Atlas:', err.message));
    }
  }

  // Step 1 Next
  const btnStep1Next = document.getElementById('btnStep1Next');
  btnStep1Next.addEventListener('click', () => {
    const tenantName = document.getElementById('tenantName').value.trim();
    const tenantPhone = document.getElementById('tenantPhone').value.trim();
    const tenantEmail = document.getElementById('tenantEmail').value.trim();
    const landlordName = document.getElementById('landlordName').value.trim();
    const landlordPhone = document.getElementById('landlordPhone').value.trim();
    const propertyAddress = document.getElementById('propertyAddress').value.trim();
    const vacateDate = document.getElementById('vacateDate').value;

    if (!tenantName || !tenantPhone || !landlordName || !propertyAddress || !vacateDate) {
      showToast('Please fill in all mandatory fields (*)', 'error');
      return;
    }

    const cityInput = document.getElementById('tenantCity').value.trim() || 'India';
    state.formData.city = cityInput;
    const cityCode = cityInput.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() || 'IND';
    state.formData.refNo = 'DS/' + new Date().getFullYear() + '/' + cityCode + '-' + Math.floor(1000 + Math.random() * 9000);
    state.formData.tenantName = tenantName;
    state.formData.tenantPhone = tenantPhone;
    state.formData.tenantEmail = tenantEmail || 'N/A';
    state.formData.landlordName = landlordName;
    state.formData.landlordPhone = landlordPhone;
    state.formData.propertyAddress = propertyAddress;
    const accommodationTypeEl = document.getElementById('accommodationType');
    state.formData.accommodationType = accommodationTypeEl ? accommodationTypeEl.value : 'Residential Apartment / Flat';
    state.formData.tenancyStartDate = document.getElementById('tenancyStartDate').value;
    state.formData.vacateDate = vacateDate;

    goToStep(2);
  });

  // Step 2 Next & Prev
  const btnStep2Prev = document.getElementById('btnStep2Prev');
  const btnStep2Next = document.getElementById('btnStep2Next');

  btnStep2Prev.addEventListener('click', () => goToStep(1));
  btnStep2Next.addEventListener('click', () => {
    const depositPaid = parseFloat(document.getElementById('depositPaid').value);
    const monthlyRent = parseFloat(document.getElementById('monthlyRent').value);
    const amountRefunded = parseFloat(document.getElementById('amountRefunded').value) || 0;
    const amountWithheld = parseFloat(document.getElementById('amountWithheld').value);

    if (isNaN(depositPaid) || isNaN(monthlyRent) || isNaN(amountWithheld) || amountWithheld <= 0) {
      showToast('Please enter valid deposit and withheld amounts', 'error');
      return;
    }

    const excuseBoxes = document.querySelectorAll('input[name="landlordExcuse"]:checked');
    const selectedExcuses = Array.from(excuseBoxes).map(cb => cb.value);

    state.formData.depositPaid = depositPaid;
    state.formData.monthlyRent = monthlyRent;
    state.formData.amountRefunded = amountRefunded;
    state.formData.amountWithheld = amountWithheld;
    state.formData.excuses = selectedExcuses.length > 0 ? selectedExcuses : ['Unjustified arbitrary deductions'];
    state.formData.noticeServed = document.getElementById('noticeServed').value;
    state.formData.flatCondition = document.getElementById('flatCondition').value;

    goToStep(3);
  });

  // Step 3 Next & Prev
  const btnStep3Prev = document.getElementById('btnStep3Prev');
  const btnStep3Next = document.getElementById('btnStep3Next');

  btnStep3Prev.addEventListener('click', () => goToStep(2));
  btnStep3Next.addEventListener('click', () => goToStep(4));

  // Step 4 Prev
  const btnStep4Prev = document.getElementById('btnStep4Prev');
  btnStep4Prev.addEventListener('click', () => goToStep(1));

  // Allow clicking indicators directly
  stepIndicators.forEach((ind, idx) => {
    ind.addEventListener('click', () => {
      if (idx + 1 <= state.currentStep) {
        goToStep(idx + 1);
      }
    });
  });

  // ==========================================================================
  // Populate Legal Document Content
  // ==========================================================================
  function formatINR(val) {
    return Number(val).toLocaleString('en-IN');
  }

  function formatDisplayDate(val) {
    if (!val) return new Date().toLocaleDateString('en-GB');
    const d = new Date(val);
    if (isNaN(d.getTime()) || d.getFullYear() > 2050 || d.getFullYear() < 1990) {
      return new Date().toLocaleDateString('en-GB');
    }
    return d.toLocaleDateString('en-GB');
  }

  function populateLegalDocument() {
    const d = state.formData;
    const formattedWithheld = formatINR(d.amountWithheld);
    const formattedDeposit = formatINR(d.depositPaid);
    const reasonsText = d.excuses.join(' and ').toLowerCase();
    const formattedVacate = formatDisplayDate(d.vacateDate);

    // Headers & Meta
    document.getElementById('docRefNo').textContent = d.refNo;
    document.getElementById('docDate').textContent = d.currentDate;
    document.getElementById('docWithheldAmount').textContent = formattedWithheld;

    // Parties
    document.getElementById('docLandlordName').textContent = d.landlordName;
    document.getElementById('docLandlordPhone').textContent = d.landlordPhone;
    document.getElementById('docPropertyAddress').textContent = d.propertyAddress;

    document.getElementById('docTenantName').textContent = d.tenantName;
    document.getElementById('docTenantPhone').textContent = d.tenantPhone;
    document.getElementById('docTenantEmail').textContent = d.tenantEmail;

    // Body content
    document.getElementById('docBodyAddress').textContent = d.propertyAddress;
    document.getElementById('docDepositPaid').textContent = formattedDeposit;
    document.getElementById('docVacateDate').textContent = formattedVacate;

    // Blurred block elements
    document.getElementById('docBlurredWithheld').textContent = formattedWithheld;
    document.getElementById('docBlurredReasons').textContent = reasonsText;
    document.getElementById('docBlurredTotal').textContent = formattedWithheld;

    // Unlocked block elements
    document.getElementById('docUnlockedWithheld').textContent = formattedWithheld;
    document.getElementById('docUnlockedReasons').textContent = reasonsText;
    document.getElementById('docUnlockedFinalTotal').textContent = formattedWithheld;
    document.getElementById('docUnlockedDate').textContent = d.currentDate;

    // Court Petition Page 1 & Page 2 Elements
    const courtCityEl = document.getElementById('courtCity');
    if (courtCityEl) {
      const cityClean = (d.city || 'Bengaluru, Karnataka').toUpperCase();
      const placeClean = (d.city || 'Bengaluru').split(',')[0].trim();

      courtCityEl.textContent = cityClean;
      const cCity2 = document.getElementById('courtCity2');
      if (cCity2) cCity2.textContent = cityClean;

      document.getElementById('courtTenantName').textContent = d.tenantName;
      document.getElementById('courtTenantAddress').textContent = d.propertyAddress;
      document.getElementById('courtTenantPhone').textContent = d.tenantPhone;
      document.getElementById('courtLandlordName').textContent = d.landlordName;
      document.getElementById('courtLandlordPhone').textContent = d.landlordPhone;
      document.getElementById('courtPropertyAddress').textContent = d.propertyAddress;
      document.getElementById('courtRent').textContent = formatINR(d.monthlyRent);
      document.getElementById('courtDeposit').textContent = formattedDeposit;
      document.getElementById('courtVacateDate').textContent = formattedVacate;
      document.getElementById('courtWithheld').textContent = formattedWithheld;

      // Page 2 Court Petition
      document.getElementById('courtPrayerTotal').textContent = formattedWithheld;
      const prayerVacate = document.getElementById('courtPrayerVacateDate');
      if (prayerVacate) prayerVacate.textContent = formattedVacate;
      document.getElementById('courtPlace').textContent = placeClean;
      document.getElementById('courtDate').textContent = d.currentDate;
      document.getElementById('courtSignName').textContent = d.tenantName;

      // Verification Clause (Order VI Rule 15 CPC)
      const vTenant = document.getElementById('courtVerifyTenant');
      if (vTenant) vTenant.textContent = d.tenantName;
      const vCity = document.getElementById('courtVerifyCity');
      if (vCity) vCity.textContent = placeClean;
      const vDate = document.getElementById('courtVerifyDate');
      if (vDate) vDate.textContent = d.currentDate;
    }

    // Police Complaint Elements
    const policeJurisdictionEl = document.getElementById('policeJurisdiction');
    if (policeJurisdictionEl) {
      const placeClean = (d.city || 'Bengaluru').split(',')[0].trim();

      policeJurisdictionEl.textContent = placeClean.toUpperCase() + ' POLICE';
      document.getElementById('policeCity').textContent = (d.city || 'Bengaluru, Karnataka').toUpperCase();
      document.getElementById('policeWithheldAmount').textContent = formattedWithheld;
      document.getElementById('policeTenantName').textContent = d.tenantName;
      document.getElementById('policeTenantAddress').textContent = d.propertyAddress;
      document.getElementById('policeLandlordName').textContent = d.landlordName;
      document.getElementById('policeLandlordPhone').textContent = d.landlordPhone;
      document.getElementById('policePropertyAddress').textContent = d.propertyAddress;
      document.getElementById('policeDepositAmount').textContent = formattedDeposit;
      document.getElementById('policeVacateDate').textContent = formattedVacate;
      document.getElementById('policeWithheld2').textContent = formattedWithheld;
      document.getElementById('policeDate').textContent = d.currentDate;
      const pPlace = document.getElementById('policePlace');
      if (pPlace) pPlace.textContent = placeClean;
      document.getElementById('policeSignName').textContent = d.tenantName;
      document.getElementById('policePhone').textContent = d.tenantPhone;
    }

    // Discrete 2-Page Legal Notice Elements
    const noticeRefP1 = document.getElementById('noticeRefP1');
    if (noticeRefP1) {
      const placeClean = (d.city || 'Bengaluru').split(',')[0].trim();

      noticeRefP1.textContent = d.refNo;
      const nRefP2 = document.getElementById('noticeRefP2');
      if (nRefP2) nRefP2.textContent = d.refNo;

      document.getElementById('noticeLandlordP1').textContent = d.landlordName;
      document.getElementById('noticeLandlordPhoneP1').textContent = d.landlordPhone;
      document.getElementById('noticePropertyP1').textContent = d.propertyAddress;

      document.getElementById('noticeTenantP1').textContent = d.tenantName;
      document.getElementById('noticeTenantPhoneP1').textContent = d.tenantPhone;
      document.getElementById('noticeTenantEmailP1').textContent = d.tenantEmail;

      document.getElementById('noticeWithheldP1').textContent = formattedWithheld;
      document.getElementById('noticePropertyBodyP1').textContent = d.propertyAddress;
      document.getElementById('noticeDepositP1').textContent = formattedDeposit;
      document.getElementById('noticeVacateP1').textContent = formattedVacate;
      document.getElementById('noticeWithheldBodyP1').textContent = formattedWithheld;
      document.getElementById('noticeReasonsP1').textContent = reasonsText;

      // Page 2 Notice
      document.getElementById('noticeDateP2').textContent = d.currentDate;
      const nWithheldP2 = document.getElementById('noticeWithheldP2');
      if (nWithheldP2) nWithheldP2.textContent = formattedWithheld;
      const nRemit = document.getElementById('noticeWithheldRemitP2');
      if (nRemit) nRemit.textContent = formattedWithheld;
      document.getElementById('noticePlaceP2').textContent = placeClean;
      document.getElementById('noticeDateSignP2').textContent = d.currentDate;
      document.getElementById('noticeSignNameP2').textContent = d.tenantName;
    }

    // Update Timeline Done copy scripts with real tenancy details
    const day4Preview = document.getElementById('previewDay4Script');
    if (day4Preview) {
      day4Preview.textContent = `REMINDER: Formal Legal Notice Ref: ${d.refNo}. Mr./Ms. ${d.landlordName}, the 7-day peremptory deadline expires in 72 hours. To avoid consumer court litigation and statutory 18% penal interest, please refund the withheld balance of ₹${formattedWithheld}/- immediately.`;
    }
    const day8Preview = document.getElementById('previewDay8Script');
    if (day8Preview) {
      day8Preview.textContent = `FINAL NOTICE: 7-DAY STATUTORY TIMELINE EXPIRED. Ref: ${d.refNo}. Mr./Ms. ${d.landlordName}, you are now in willful statutory default under Sec 73 Contract Act. Our dispute docket is being submitted to the National Consumer Helpline (1915), e-Jagriti Consumer Court Portal (e-jagriti.gov.in) demanding ₹${formattedWithheld}/- + 18% interest + ₹1,00,000 punitive damages, and local Police Station for Criminal Breach of Trust. Transfer ₹${formattedWithheld}/- immediately to avoid summons.`;
    }
  }

  // ==========================================================================
  // Razorpay Checkout & Tier Management (Tier 1: ₹99 First, Tier 2: ₹499 Second)
  // ==========================================================================
  let activePaymentTier = 'TIER_1';
  let currentDemoOrderId = '';
  let currentDemoPayAmount = 99;

  const upiModalBackdrop = document.getElementById('upiModalBackdrop');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const btnPayRazorpay = document.getElementById('btnPayRazorpay');

  const btnSelectPlanTier1 = document.getElementById('btnSelectPlanTier1');
  const btnSelectPlanTier2 = document.getElementById('btnSelectPlanTier2');
  const btnUnlockModal = document.getElementById('btnUnlockModal');
  const btnUnlockTier2Direct = document.getElementById('btnUnlockTier2Direct');
  const btnUnlockTier2Modal = document.getElementById('btnUnlockTier2Modal');

  const tabTier1Notice = document.getElementById('tabTier1Notice');
  const tabTier2Kit = document.getElementById('tabTier2Kit');

  function openRazorpayModal() {
    setPaymentTier(activePaymentTier);
    const standardRzpView = document.getElementById('standardRzpView');
    const paymentPendingScreen = document.getElementById('paymentPendingScreen');
    const demoPaymentScreen = document.getElementById('demoPaymentScreen');
    if (demoPaymentScreen) demoPaymentScreen.classList.add('hidden');
    if (paymentPendingScreen) paymentPendingScreen.classList.add('hidden');
    if (standardRzpView) standardRzpView.classList.remove('hidden');

    const checkoutEmailInput = document.getElementById('checkoutUserEmail');
    if (checkoutEmailInput && (!checkoutEmailInput.value || checkoutEmailInput.value === 'N/A')) {
      checkoutEmailInput.value = (state.formData.tenantEmail && state.formData.tenantEmail !== 'N/A') ? state.formData.tenantEmail : '';
    }

    if (upiModalBackdrop) {
      upiModalBackdrop.classList.remove('hidden');
    }
  }

  function closeRazorpayModal() {
    if (upiModalBackdrop) {
      upiModalBackdrop.classList.add('hidden');
    }
    const standardRzpView = document.getElementById('standardRzpView');
    const paymentPendingScreen = document.getElementById('paymentPendingScreen');
    const demoPaymentScreen = document.getElementById('demoPaymentScreen');
    if (demoPaymentScreen) demoPaymentScreen.classList.add('hidden');
    if (paymentPendingScreen) paymentPendingScreen.classList.add('hidden');
    if (standardRzpView) standardRzpView.classList.remove('hidden');
  }

  function setPaymentTier(tier) {
    activePaymentTier = tier;
    const tier1Price = state.config.priceInr || 99;
    const tier2Price = state.config.tier2PriceInr || 499;
    const chosenPrice = tier === 'TIER_2' ? tier2Price : tier1Price;
    const upiId = state.config.upiId || '8000757744@upi';

    const modalTitle = document.getElementById('modalTitle');
    const modalDesc = document.getElementById('modalDesc');
    const modalAmountVal = document.getElementById('modalAmountVal');
    const summaryPlanTitle = document.getElementById('summaryPlanTitle');
    const summaryPlanPrice = document.getElementById('summaryPlanPrice');
    const summaryPlanSubtitle = document.getElementById('summaryPlanSubtitle');
    const tabT1Price = document.getElementById('tabTier1PriceDisplay');
    const tabT2Price = document.getElementById('tabTier2PriceDisplay');
    const btnPayRazorpay = document.getElementById('btnPayRazorpay');

    // Update Direct UPI QR & Link
    const qrImg = document.getElementById('directUpiQrImg');
    if (qrImg) {
      qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=upi%3A%2F%2Fpay%3Fpa%3D${encodeURIComponent(upiId)}%26pn%3DDepositShield%26am%3D${chosenPrice}%26cu%3DINR`;
    }

    const displayUpi = document.getElementById('displayUpiId');
    if (displayUpi) displayUpi.textContent = upiId;

    const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=DepositShield&am=${chosenPrice}&cu=INR`;
    const linkGPay = document.getElementById('linkGPay');
    const linkPhonePe = document.getElementById('linkPhonePe');
    const linkPaytm = document.getElementById('linkPaytm');
    if (linkGPay) linkGPay.href = upiUri;
    if (linkPhonePe) linkPhonePe.href = upiUri;
    if (linkPaytm) linkPaytm.href = upiUri;

    if (tabT1Price) tabT1Price.textContent = `₹${tier1Price}`;
    if (tabT2Price) tabT2Price.textContent = `₹${tier2Price}`;

    if (tabTier1Notice && tabTier2Kit) {
      tabTier1Notice.classList.toggle('active', tier === 'TIER_1');
      tabTier2Kit.classList.toggle('active', tier === 'TIER_2');
    }

    if (tier === 'TIER_2') {
      if (modalTitle) modalTitle.textContent = 'Unlock Notice + Consumer Court & Police Kit';
      if (modalDesc) modalDesc.textContent = 'Instant auto-unlock via Razorpay (UPI, GPay, PhonePe, Cards, NetBanking)';
      if (summaryPlanTitle) summaryPlanTitle.textContent = 'Notice + Consumer Court & Police Kit';
      if (summaryPlanPrice) summaryPlanPrice.textContent = `₹${tier2Price}`;
      if (summaryPlanSubtitle) summaryPlanSubtitle.textContent = 'Includes 2-Page Notice + Form 1 Court Petition + Police Complaint + Affidavit';
      if (modalAmountVal) modalAmountVal.textContent = `₹${tier2Price} Only`;
      if (btnPayRazorpay) btnPayRazorpay.innerHTML = `<i class="fa-solid fa-lock"></i> Pay ₹${tier2Price} Securely via Razorpay`;
    } else {
      if (modalTitle) modalTitle.textContent = 'Unlock Your Official Legal Demand Notice';
      if (modalDesc) modalDesc.textContent = 'Instant auto-unlock via Razorpay (UPI, GPay, PhonePe, Cards, NetBanking)';
      if (summaryPlanTitle) summaryPlanTitle.textContent = '7-Day Pre-Litigation Legal Demand Notice';
      if (summaryPlanPrice) summaryPlanPrice.textContent = `₹${tier1Price}`;
      if (summaryPlanSubtitle) summaryPlanSubtitle.textContent = 'Includes 2-Page Notice + WhatsApp Format + Speed Post Template';
      if (modalAmountVal) modalAmountVal.textContent = `₹${tier1Price} Only`;
      if (btnPayRazorpay) btnPayRazorpay.innerHTML = `<i class="fa-solid fa-lock"></i> Pay ₹${tier1Price} Securely via Razorpay`;
    }
  }

  // Open modal buttons from Step 4 Plan Cards
  if (btnSelectPlanTier1) {
    btnSelectPlanTier1.addEventListener('click', () => {
      setPaymentTier('TIER_1');
      openRazorpayModal();
    });
  }

  if (btnSelectPlanTier2) {
    btnSelectPlanTier2.addEventListener('click', () => {
      setPaymentTier('TIER_2');
      openRazorpayModal();
    });
  }

  // Open modal from Lock Card inside Document Preview
  if (btnUnlockModal) {
    btnUnlockModal.addEventListener('click', () => {
      setPaymentTier('TIER_1');
      openRazorpayModal();
    });
  }

  if (btnUnlockTier2Direct) {
    btnUnlockTier2Direct.addEventListener('click', () => {
      setPaymentTier('TIER_2');
      openRazorpayModal();
    });
  }

  // Open modal from bottom Tier 2 Card
  if (btnUnlockTier2Modal) {
    btnUnlockTier2Modal.addEventListener('click', () => {
      setPaymentTier('TIER_2');
      openRazorpayModal();
    });
  }

  // Switch between Tier 1 and Tier 2 tabs inside the Modal
  if (tabTier1Notice) {
    tabTier1Notice.addEventListener('click', () => setPaymentTier('TIER_1'));
  }
  if (tabTier2Kit) {
    tabTier2Kit.addEventListener('click', () => setPaymentTier('TIER_2'));
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeRazorpayModal);
  }

  if (upiModalBackdrop) {
    upiModalBackdrop.addEventListener('click', (e) => {
      if (e.target === upiModalBackdrop) closeRazorpayModal();
    });
  }

  // ==========================================================================
  // Direct UPI Payment Controls & Live Status Polling
  // ==========================================================================
  let upiPollInterval = null;

  // 1. Copy UPI ID button
  const btnCopyUpiId = document.getElementById('btnCopyUpiId');
  if (btnCopyUpiId) {
    btnCopyUpiId.addEventListener('click', () => {
      const upiText = (document.getElementById('displayUpiId')?.textContent || '8000757744@upi').trim();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(upiText).then(() => {
          showToast('UPI ID copied: ' + upiText);
        }).catch(() => {
          showToast('UPI ID: ' + upiText);
        });
      } else {
        showToast('UPI ID: ' + upiText);
      }
    });
  }

  // 2. Submit UPI UTR / Reference Number
  const btnSubmitUpiUtr = document.getElementById('btnSubmitUpiUtr');
  if (btnSubmitUpiUtr) {
    btnSubmitUpiUtr.addEventListener('click', async () => {
      const emailInput = document.getElementById('checkoutUserEmail');
      const emailVal = emailInput ? emailInput.value.trim() : '';
      const utrInput = document.getElementById('inputUpiUtr');
      const utrVal = utrInput ? utrInput.value.trim().toUpperCase() : '';
      const chosenPrice = activePaymentTier === 'TIER_2' ? (state.config.tier2PriceInr || 499) : (state.config.priceInr || 99);

      if (!emailVal || !emailVal.includes('@') || !emailVal.includes('.')) {
        showToast('Please enter a valid email address to receive your notice PDF.', 'error');
        if (emailInput) {
          emailInput.focus();
          emailInput.style.borderColor = '#ef4444';
        }
        return;
      }
      if (emailInput) emailInput.style.borderColor = '#38bdf8';

      if (!utrVal || utrVal.length < 8) {
        showToast('Please enter your genuine 12-digit UPI UTR / Reference number from PhonePe, GPay, or Paytm.', 'error');
        if (utrInput) {
          utrInput.focus();
          utrInput.style.borderColor = '#ef4444';
        }
        return;
      }
      if (utrInput) utrInput.style.borderColor = '#38bdf8';

      // Save latest notice inputs with customer email
      state.formData.tenantEmail = emailVal;
      fetch('/api/save-notice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.formData)
      }).catch(() => {});

      btnSubmitUpiUtr.disabled = true;
      btnSubmitUpiUtr.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting Reference...';

      try {
        const res = await fetch('/api/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentRef: utrVal,
            noticeId: state.formData.refNo,
            amount: chosenPrice,
            tier: activePaymentTier,
            customerEmail: emailVal,
            customerPhone: state.formData.tenantPhone
          })
        });

        const data = await res.json();
        btnSubmitUpiUtr.disabled = false;
        btnSubmitUpiUtr.innerHTML = '<i class="fa-solid fa-circle-check"></i> Submit Reference & Unlock';

        if (!res.ok && data.error === 'INVALID_UTR') {
          showToast(data.message || 'Invalid UTR reference number', 'error');
          return;
        }

        // Case A: Already confirmed by admin or instant authorization
        if (data.verified) {
          if (activePaymentTier === 'TIER_2') {
            unlockTier2UI();
          } else {
            unlockNoticeUI();
          }
          showToast('Payment verified! Official legal documents unlocked.');
          closeRazorpayModal();
          return;
        }

        // Case B: Payment PENDING -> Transition to Dual Delivery Waiting Screen
        const standardRzpView = document.getElementById('standardRzpView');
        const pendingScreen = document.getElementById('paymentPendingScreen');
        const utrDisplay = document.getElementById('submittedUtrDisplay');
        const amtDisplay = document.getElementById('submittedAmountDisplay');
        const emailDisplay = document.getElementById('targetEmailDisplay');

        if (utrDisplay) utrDisplay.textContent = utrVal;
        if (amtDisplay) amtDisplay.textContent = `₹${chosenPrice}`;
        if (emailDisplay) emailDisplay.textContent = emailVal;

        if (standardRzpView) standardRzpView.classList.add('hidden');
        if (pendingScreen) pendingScreen.classList.remove('hidden');

        showToast('Payment reference received! Awaiting bank confirmation.');

        // Live status polling every 4 seconds
        if (upiPollInterval) clearInterval(upiPollInterval);
        upiPollInterval = setInterval(async () => {
          try {
            const pollRes = await fetch(`/api/payment-status/${encodeURIComponent(utrVal)}`);
            const pollData = await pollRes.json();
            if (pollData.verified) {
              clearInterval(upiPollInterval);
              upiPollInterval = null;
              if (activePaymentTier === 'TIER_2') {
                unlockTier2UI();
                showToast(`Payment of ₹${chosenPrice} confirmed! Notice + Court & Police Kit unlocked!`, 'success');
              } else {
                unlockNoticeUI();
                showToast(`Payment of ₹${chosenPrice} confirmed! Official legal notice unlocked!`, 'success');
              }
              setTimeout(() => {
                closeRazorpayModal();
              }, 1200);
            }
          } catch (e) { }
        }, 4000);

      } catch (err) {
        btnSubmitUpiUtr.disabled = false;
        btnSubmitUpiUtr.innerHTML = '<i class="fa-solid fa-circle-check"></i> Submit Reference & Unlock';
        showToast('Error communicating with verification server. Please try again.', 'error');
      }
    });
  }

  // ==========================================================================
  // Primary Razorpay Checkout Action
  // ==========================================================================
  if (btnPayRazorpay) {
    btnPayRazorpay.addEventListener('click', () => {
      const payAmount = activePaymentTier === 'TIER_2' ? (state.config.tier2PriceInr || 499) : (state.config.priceInr || 99);

      // Validate delivery email address
      const checkoutEmailInput = document.getElementById('checkoutUserEmail');
      const enteredEmail = checkoutEmailInput ? checkoutEmailInput.value.trim() : (state.formData.tenantEmail || '');
      if (!enteredEmail || !enteredEmail.includes('@') || !enteredEmail.includes('.')) {
        showToast('Please enter a valid email address to receive your official notice PDF.', 'error');
        if (checkoutEmailInput) {
          checkoutEmailInput.focus();
          checkoutEmailInput.style.borderColor = '#f43f5e';
        }
        return;
      }
      if (checkoutEmailInput) checkoutEmailInput.style.borderColor = '#38bdf8';
      state.formData.tenantEmail = enteredEmail;

      btnPayRazorpay.disabled = true;
      btnPayRazorpay.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Launching Secure Razorpay Checkout...';

      // Ensure form data is recorded in MongoDB Atlas first
      fetch('/api/save-notice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...state.formData, tenantEmail: enteredEmail })
      }).catch(() => {});

      // Request order creation from server
      fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: payAmount,
          tier: activePaymentTier,
          noticeRefNo: state.formData.refNo,
          customerName: state.formData.tenantName,
          customerPhone: state.formData.tenantPhone,
          customerEmail: enteredEmail
        })
      })
      .then(r => r.json())
      .then(orderData => {
        btnPayRazorpay.disabled = false;
        setPaymentTier(activePaymentTier);

        if (!orderData.success) {
          showToast(orderData.message || 'Could not initiate Razorpay. Please try again.', 'error');
          return;
        }

        // Case A: Real Razorpay Key Configured & SDK Loaded
        if (orderData.keyId && window.Razorpay && !orderData.isDemo) {
          const options = {
            key: orderData.keyId,
            amount: orderData.amount,
            currency: orderData.currency || 'INR',
            name: 'DepositShield India',
            description: activePaymentTier === 'TIER_2' ? 'Notice + Consumer Court & Police Kit' : '7-Day Pre-Litigation Legal Demand Notice',
            order_id: orderData.orderId,
            modal: {
              ondismiss: function () {
                btnPayRazorpay.disabled = false;
                setPaymentTier(activePaymentTier);
              }
            },
            handler: function (response) {
              btnPayRazorpay.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verifying Payment & Dispatching PDF...';
              fetch('/api/razorpay/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  noticeRefNo: state.formData.refNo,
                  tier: activePaymentTier,
                  amount: payAmount,
                  customerEmail: enteredEmail,
                  customerPhone: state.formData.tenantPhone
                })
              })
              .then(res => res.json())
              .then(verifyData => {
                if (verifyData.verified) {
                  unlockNoticeUI();
                  if (activePaymentTier === 'TIER_2') {
                    unlockTier2UI();
                    showToast(`✓ Payment Verified! Official Notice + Kit unlocked & PDF emailed to ${enteredEmail}`);
                  } else {
                    showToast(`✓ Payment Verified! Legal Demand Notice unlocked & PDF emailed to ${enteredEmail}`);
                  }
                  closeRazorpayModal();
                } else {
                  showToast('Payment verification failed. Please contact support.', 'error');
                  btnPayRazorpay.disabled = false;
                  setPaymentTier(activePaymentTier);
                }
              })
              .catch(() => {
                showToast('Server verification error. Please refresh.', 'error');
                btnPayRazorpay.disabled = false;
                setPaymentTier(activePaymentTier);
              });
            },
            prefill: {
              name: state.formData.tenantName,
              email: enteredEmail,
              contact: state.formData.tenantPhone
            },
            theme: {
              color: '#0284c7'
            }
          };

          const rzpInstance = new window.Razorpay(options);
          rzpInstance.open();
          return;
        }

        // Case B: Interactive Demo / Sandbox Mode
        // Open the interactive demo payment screen asking user for method selection & confirmation
        const standardRzpView = document.getElementById('standardRzpView');
        const demoPaymentScreen = document.getElementById('demoPaymentScreen');
        const demoPayableAmountDisplay = document.getElementById('demoPayableAmountDisplay');
        const btnAuth = document.getElementById('btnAuthorizeDemoPayment');

        if (standardRzpView && demoPaymentScreen) {
          standardRzpView.classList.add('hidden');
          demoPaymentScreen.classList.remove('hidden');
          if (demoPayableAmountDisplay) demoPayableAmountDisplay.textContent = `₹${payAmount}`;
          if (btnAuth) {
            btnAuth.disabled = false;
            btnAuth.innerHTML = `<i class="fa-solid fa-lock"></i> Authorize & Pay ₹${payAmount}`;
          }
          currentDemoOrderId = orderData.orderId;
          currentDemoPayAmount = payAmount;
        }
      })
      .catch(() => {
        btnPayRazorpay.disabled = false;
        setPaymentTier(activePaymentTier);
        showToast('Error communicating with Razorpay service', 'error');
      });
    });
  }

  function unlockNoticeUI() {
    state.isUnlocked = true;
    document.getElementById('noticeBlurredSection').classList.add('hidden');
    document.getElementById('noticeUnlockedSection').classList.remove('hidden');
    document.getElementById('unlockedActionsBar').classList.remove('hidden');
    
    // Reveal Tier 2 Escalation Card
    const t2Card = document.getElementById('tier2Card');
    if (t2Card) {
      t2Card.classList.remove('hidden');
    }

    const watermark = document.getElementById('watermarkPreview');
    if (watermark) {
      watermark.textContent = 'OFFICIAL PRE-LITIGATION DEMAND NOTICE';
      watermark.style.color = 'rgba(16, 185, 129, 0.08)';
    }

    document.getElementById('unlockedActionsBar').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function unlockTier2UI() {
    document.getElementById('tier2LockedBox').classList.add('hidden');
    document.getElementById('tier2UnlockedBox').classList.remove('hidden');
    document.getElementById('tier2UnlockedBox').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ==========================================================================
  // Post-Unlock Actions: PDF, WhatsApp, Escalation Guide & Tier 2 Downloads
  // ==========================================================================
  const btnDownloadPdf = document.getElementById('btnDownloadPdf');
  const btnCopyWhatsapp = document.getElementById('btnCopyWhatsapp');
  const btnViewEscalation = document.getElementById('btnViewEscalation');
  const guideModalBackdrop = document.getElementById('guideModalBackdrop');
  const guideModalCloseBtn = document.getElementById('guideModalCloseBtn');

  // Tier 2 Elements
  const btnDownloadCourtPetition = document.getElementById('btnDownloadCourtPetition');
  const btnDownloadAffidavit = document.getElementById('btnDownloadAffidavit');
  const btnDownloadPoliceComplaint = document.getElementById('btnDownloadPoliceComplaint');
  const btnOpenEdaakhilGuide = document.getElementById('btnOpenEdaakhilGuide');
  const edaakhilModalBackdrop = document.getElementById('edaakhilModalBackdrop');
  const edaakhilModalCloseBtn = document.getElementById('edaakhilModalCloseBtn');

  // e-Daakhil Guide Modal
  if (btnOpenEdaakhilGuide) {
    btnOpenEdaakhilGuide.addEventListener('click', () => {
      edaakhilModalBackdrop.classList.remove('hidden');
    });
  }

  if (edaakhilModalCloseBtn) {
    edaakhilModalCloseBtn.addEventListener('click', () => {
      edaakhilModalBackdrop.classList.add('hidden');
    });
  }

  if (edaakhilModalBackdrop) {
    edaakhilModalBackdrop.addEventListener('click', (e) => {
      if (e.target === edaakhilModalBackdrop) {
        edaakhilModalBackdrop.classList.add('hidden');
      }
    });
  }

  // 1. Download Consumer Court Petition (Discrete 2-Page A4 Layout)
  if (btnDownloadCourtPetition) {
    btnDownloadCourtPetition.addEventListener('click', async () => {
      showToast('Generating official 2-Page Consumer Court Petition (PDF)...');
      try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const p1El = document.getElementById('courtPetitionPage1');
        const p2El = document.getElementById('courtPetitionPage2');

        const canvas1 = await html2canvas(p1El, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff'
        });
        const imgData1 = canvas1.toDataURL('image/png');
        pdf.addImage(imgData1, 'PNG', 0, 0, 210, 297);

        const canvas2 = await html2canvas(p2El, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff'
        });
        const imgData2 = canvas2.toDataURL('image/png');
        pdf.addPage();
        pdf.addImage(imgData2, 'PNG', 0, 0, 210, 297);

        pdf.save(`Consumer_Court_Petition_${state.formData.tenantName.replace(/\s+/g, '_')}_vs_${state.formData.landlordName.replace(/\s+/g, '_')}.pdf`);
        showToast('Consumer Court Petition downloaded successfully!');
      } catch (err) {
        console.error(err);
        showToast('Error generating petition PDF', 'error');
      }
    });
  }

  // 2. Download Police Station Criminal Complaint (Discrete 1-Page A4)
  if (btnDownloadPoliceComplaint) {
    btnDownloadPoliceComplaint.addEventListener('click', async () => {
      showToast('Generating Police Criminal Complaint letter (PDF)...');
      try {
        const policeEl = document.getElementById('printablePoliceComplaint');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');

        const canvas = await html2canvas(policeEl, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff'
        });
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
        pdf.save(`Police_Criminal_Complaint_Sec405_${state.formData.tenantName.replace(/\s+/g, '_')}.pdf`);
        showToast('Police Complaint letter downloaded successfully!');
      } catch (err) {
        console.error(err);
        showToast('Error generating police complaint PDF', 'error');
      }
    });
  }

  // 3. Download Notary Verification Affidavit
  if (btnDownloadAffidavit) {
    btnDownloadAffidavit.addEventListener('click', () => {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const d = state.formData;

      pdf.setFont('times', 'bold');
      pdf.setFontSize(14);
      pdf.text('VERIFICATION AFFIDAVIT FOR DISTRICT CONSUMER COMMISSION', 105, 30, { align: 'center' });
      pdf.setFontSize(11);
      pdf.text('(To be executed on Stamp Paper of Rs. 20/50 and Notarized)', 105, 38, { align: 'center' });

      pdf.setFont('times', 'normal');
      pdf.setFontSize(12);
      const affidavitText = 
`I, ${d.tenantName}, residing at ${d.propertyAddress}, do hereby solemnly affirm and declare on oath as under:

1. That I am the Complainant in the accompanying Consumer Complaint and well conversant with the facts of the case.

2. That the contents of paragraphs 1 to 5 of the accompanying complaint are true and correct to the best of my knowledge, derived from official rental receipts and bank records.

3. That the Opposite Party (${d.landlordName}) has unlawfully withheld my refundable security deposit of Rs. ${formatINR(d.amountWithheld)}/- without legal authority.

4. That no other complaint regarding this dispute has been instituted by me in any other court of law.

DEPONENT: _________________________
(${d.tenantName})

VERIFICATION:
Verified at ${d.city.split(',')[0]} on this day ${d.currentDate} that the contents of this affidavit are true and correct.

DEPONENT: _________________________`;

      pdf.text(pdf.splitTextToSize(affidavitText, 170), 20, 55);
      pdf.save(`Notary_Affidavit_${d.tenantName.replace(/\s+/g, '_')}.pdf`);
      showToast('Notary Verification Affidavit downloaded!');
    });
  }

  // 4. Download 2-Page Legal Demand Notice (Discrete A4 Layout)
  btnDownloadPdf.addEventListener('click', async () => {
    showToast('Generating official 2-Page Legal Demand Notice (PDF)...');
    try {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const p1El = document.getElementById('noticePdfPage1');
      const p2El = document.getElementById('noticePdfPage2');

      const canvas1 = await html2canvas(p1El, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const imgData1 = canvas1.toDataURL('image/png');
      pdf.addImage(imgData1, 'PNG', 0, 0, 210, 297);

      const canvas2 = await html2canvas(p2El, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const imgData2 = canvas2.toDataURL('image/png');
      pdf.addPage();
      pdf.addImage(imgData2, 'PNG', 0, 0, 210, 297);

      pdf.save(`Legal_Demand_Notice_${state.formData.tenantName.replace(/\s+/g, '_')}_vs_${state.formData.landlordName.replace(/\s+/g, '_')}.pdf`);
      showToast('Official Legal Notice downloaded successfully!');
    } catch (err) {
      console.error(err);
      showToast('Error generating Legal Notice PDF', 'error');
    }
  });

  // 2. Copy 1-Click WhatsApp Notice
  btnCopyWhatsapp.addEventListener('click', () => {
    const d = state.formData;
    const whatsappText = 
`⚖️ *FORMAL PRE-LITIGATION LEGAL DEMAND NOTICE*
*Ref No:* ${d.refNo}
*Date:* ${d.currentDate}

*To:* ${d.landlordName} (Landlord / Property Owner)
*Property:* ${d.propertyAddress}
*From:* ${d.tenantName} (Outgoing Tenant)

*SUBJECT: NOTICE FOR IMMEDIATE REFUND OF SECURITY DEPOSIT OF ₹${formatINR(d.amountWithheld)}/-*

Dear Sir/Madam,

This is a formal Pre-Litigation Legal Notice under *Section 73 of the Indian Contract Act, 1872* and the *Consumer Protection Act, 2019*.

1. Vacant possession and keys of the rented premises were lawfully handed over on *${d.vacateDate}*.
2. You have unlawfully withheld *₹${formatINR(d.amountWithheld)}/-* citing ${d.excuses.join(', ')}.
3. Under *Section 108(m) of the Transfer of Property Act* and established High Court precedents, ordinary weathering, natural wear and tear, and routine painting are strictly the landlord's maintenance obligations and CANNOT be deducted from tenant caution deposits without verifiable proof of deliberate physical vandalism.
4. You have also failed to supply registered GST tax invoices for said deductions.

*FINAL DEMAND:*
You are hereby formally called upon to refund the balance sum of *₹${formatINR(d.amountWithheld)}/-* to my bank account / UPI within *SEVEN (7) DAYS* of this notice.

*NOTICE OF CONSEQUENCES:*
Should you fail to remit the refund within 7 days, a formal dispute shall be registered with the *National Consumer Helpline (NCH - 1915)* followed by an official petition via the *e-Jagriti Consumer Portal (https://e-jagriti.gov.in/)* before the District Consumer Disputes Redressal Commission for recovery of the deposit + 18% statutory interest + ₹1,00,000 compensation for mental harassment.

Kindly confirm receipt and transfer the amount to avoid unnecessary litigation costs.

Yours sincerely,
*${d.tenantName}*
Aggrieved Tenant & Claimant
Mobile: ${d.tenantPhone}`;

    navigator.clipboard.writeText(whatsappText);
    showToast('WhatsApp legal notice copied! Paste directly into landlord chat.');
  });

  // 3. Escalation Guide Modal
  btnViewEscalation.addEventListener('click', () => {
    guideModalBackdrop.classList.remove('hidden');
  });

  guideModalCloseBtn.addEventListener('click', () => {
    guideModalBackdrop.classList.add('hidden');
  });

  guideModalBackdrop.addEventListener('click', (e) => {
    if (e.target === guideModalBackdrop) {
      guideModalBackdrop.classList.add('hidden');
    }
  });

  // 4. Timeline Tracker & Post-Deadline Action Handlers
  const btnScrollToTimeline = document.getElementById('btnScrollToTimeline');
  if (btnScrollToTimeline) {
    btnScrollToTimeline.addEventListener('click', () => {
      const el = document.getElementById('timelineGuideSection');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    });
  }

  const btnTimelineOpenEdaakhil = document.getElementById('btnTimelineOpenEdaakhil');
  if (btnTimelineOpenEdaakhil) {
    btnTimelineOpenEdaakhil.addEventListener('click', () => {
      if (edaakhilModalBackdrop) edaakhilModalBackdrop.classList.remove('hidden');
    });
  }

  const btnTimelinePolicePrompt = document.getElementById('btnTimelinePolicePrompt');
  if (btnTimelinePolicePrompt) {
    btnTimelinePolicePrompt.addEventListener('click', () => {
      if (state.tier2Unlocked) {
        generatePoliceComplaintPDF();
      } else {
        setPaymentTier('TIER_2');
        openRazorpayModal();
      }
    });
  }

  // Copy Day 4 72h Reminder Script
  const btnCopyDay4Script = document.getElementById('btnCopyDay4Script');
  if (btnCopyDay4Script) {
    btnCopyDay4Script.addEventListener('click', () => {
      const d = state.formData;
      const formattedWithheld = formatINR(d.amountWithheld);
      const text = `REMINDER: Formal Legal Notice Ref: ${d.refNo}.

Mr./Ms. ${d.landlordName},

Please note that the 7-day peremptory deadline stipulated in our formal Pre-Litigation Legal Demand Notice expires in 72 HOURS.

To avoid initiation of proceedings before the District Consumer Disputes Redressal Commission (e-Jagriti: https://e-jagriti.gov.in/) and statutory claim of 18% penal interest under Sec 73 Contract Act, kindly transfer the unlawfully withheld balance of ₹${formattedWithheld}/- immediately.

Yours sincerely,
${d.tenantName}`;

      navigator.clipboard.writeText(text);
      showToast('Day 4 follow-up reminder copied to clipboard!');
    });
  }

  // Copy Day 8 Timeline Expired Warning Script
  const btnCopyDay8Script = document.getElementById('btnCopyDay8Script');
  if (btnCopyDay8Script) {
    btnCopyDay8Script.addEventListener('click', () => {
      const d = state.formData;
      const formattedWithheld = formatINR(d.amountWithheld);
      const text = `FINAL STATUTORY DEMAND: 7-DAY TIMELINE EXPIRED
Ref: ${d.refNo}

Mr./Ms. ${d.landlordName},

Please be informed that the 7-day mandatory cure period granted in our formal Pre-Litigation Legal Demand Notice has officially expired without receipt of our security deposit refund.

Consequently, you are now in willful statutory default under Section 73 of the Indian Contract Act, 1872 and Section 35 of the Consumer Protection Act, 2019.

Our formal dispute file is being submitted today to:
1. National Consumer Helpline (NCH Docket 1915).
2. District Consumer Disputes Redressal Commission via e-Jagriti (https://e-jagriti.gov.in/) for recovery of ₹${formattedWithheld}/- + 18% p.a. interest + ₹1,00,000 compensation for mental harassment.
3. Local Police Station SHO under Section 405/406 IPC (Section 316 BNS) for Criminal Breach of Trust.

If you wish to settle this amicably without facing court summons, transfer the withheld balance of ₹${formattedWithheld}/- immediately.

Yours sincerely,
${d.tenantName}`;

      navigator.clipboard.writeText(text);
      showToast('Day 8 Timeline Expired warning copied to clipboard!');
    });
  }

  // Copy GST Invoice Demand Challenge Script
  const btnCopyGstDemand = document.getElementById('btnCopyGstDemand');
  if (btnCopyGstDemand) {
    btnCopyGstDemand.addEventListener('click', () => {
      const d = state.formData;
      const formattedWithheld = formatINR(d.amountWithheld);
      const text = `FORMAL DEMAND FOR REGISTERED GST TAX INVOICES:

Mr./Ms. ${d.landlordName},

With reference to the alleged deduction of ₹${formattedWithheld}/- towards painting / maintenance repairs:

Under the Central Goods and Services Tax (CGST) Act, 2017 and Indian Contract Act, deductions are legally impermissible without providing an official Tax Invoice containing the vendor's registered GSTIN, invoice date, and proof of banking payment.

Please furnish verified GST tax invoices for all claimed repairs within 48 hours. Providing handwritten estimates or unverified chits to retain caution money is punishable under Section 420 IPC / Section 318 BNS (Cheating) and liable for reporting to the Directorate General of GST Intelligence (DGGI) for tax evasion inquiry.

Yours sincerely,
${d.tenantName}`;

      navigator.clipboard.writeText(text);
      showToast('GST challenge script copied to clipboard!');
    });
  }

  // ==========================================================================
  // FAQ Accordion
  // ==========================================================================
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      faqItems.forEach(i => i.classList.remove('open'));
      if (!isOpen) {
        item.classList.add('open');
      }
    });
  });

  // ==========================================================================
  // Live Activity Social Proof Ticker
  // ==========================================================================
  function initLiveActivityTicker() {
    const toast = document.getElementById('liveActivityToast');
    const toastContent = document.getElementById('liveActivityToastContent');
    if (!toast || !toastContent) return;

    const activities = [
      { location: 'HSR Layout, Bengaluru', amount: '₹62,000', action: 'recovered', time: 'Notice delivered • 4 mins ago' },
      { location: 'Kharadi, Pune', amount: '₹48,000', action: 'served notice for', time: 'Legal draft generated • 11 mins ago' },
      { location: 'Whitefield, Bengaluru', amount: '₹95,000', action: 'recovered', time: 'Deposit refunded via UPI • 18 mins ago' },
      { location: 'Andheri West, Mumbai', amount: '₹85,000', action: 'served notice for', time: 'Pre-litigation draft sent • 24 mins ago' },
      { location: 'Gachibowli, Hyderabad', amount: '₹40,000', action: 'disputed unlawful painting fee of', time: 'Full refund received • 32 mins ago' },
      { location: 'DLF Phase 3, Gurugram', amount: '₹75,000', action: 'recovered', time: 'Landlord settled • 45 mins ago' }
    ];

    let currentIndex = 0;

    function showNextActivity() {
      const act = activities[currentIndex];
      toastContent.innerHTML = `<strong>Tenant in ${act.location}</strong> ${act.action} <strong>${act.amount}</strong><span class="time">${act.time}</span>`;
      toast.classList.add('visible');

      setTimeout(() => {
        toast.classList.remove('visible');
      }, 5500);

      currentIndex = (currentIndex + 1) % activities.length;
    }

    // Allow user to dismiss by tapping
    toast.addEventListener('click', () => {
      toast.classList.remove('visible');
    });

    // Initial appearance after 3.5s, then every 16s
    setTimeout(() => {
      showNextActivity();
      setInterval(showNextActivity, 16000);
    }, 3500);
  }

  initLiveActivityTicker();

  // Toast Helper
  function showToast(message, type = 'success') {
    const toast = document.getElementById('toastNotification');
    const toastMsg = document.getElementById('toastMessage');
    toastMsg.textContent = message;
    
    if (type === 'error') {
      toast.style.background = '#ef4444';
    } else {
      toast.style.background = '#10b981';
    }

    toast.classList.remove('hidden');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 4000);
  }
});
