// ==========================================================================
// DepositShield India - Frontend Application Logic
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // App State
  const state = {
    currentStep: 1,
    country: 'IN',
    noticeType: 'dealership',
    isUnlocked: false,
    config: {
      upiId: '8000757744@upi',
      priceInr: 99,
      testMode: true
    },
    formData: {
      noticeType: 'dealership',
      customFieldName: '',
      city: 'Ahmedabad, Gujarat',
      tenantName: 'Rajesh Patel (M/s Apex Auto Dealership)',
      tenantPhone: '+91 9876543210',
      tenantEmail: 'rajesh@apexdealership.com',
      landlordName: 'Automobile Manufacturing Brand Ltd.',
      landlordPhone: '+91 9811122233',
      propertyAddress: 'Plot 42, Auto Zone, Industrial Area, Ahmedabad, Gujarat - 382445',
      tenancyStartDate: '',
      vacateDate: '2026-10-15',
      depositPaid: 500000,
      monthlyRent: 150000,
      amountRefunded: 0,
      amountWithheld: 350000,
      excuses: ['Unlawful Withholding of Dealership Caution Deposit / Bank Guarantee', 'Unpaid Dealer Margin, Monthly Commission & Target Incentives'],
      noticeServed: 'Yes',
      flatCondition: 'Yes',
      refNo: 'DS/' + new Date().getFullYear() + '/DLR-' + Math.floor(1000 + Math.random() * 9000),
      currentDate: new Date().toLocaleDateString('en-GB')
    }
  };

  // Fetch server config with smart Render cold-start detection & retry
  let isColdStart = false;
  const coldStartTimer = setTimeout(() => {
    isColdStart = true;
    showToast('⚡ Connecting to cloud server (takes ~15s to start if idle)...', 'info');
  }, 2500);

  function loadConfig(retriesLeft = 4) {
    fetch('/api/config')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        clearTimeout(coldStartTimer);
        if (isColdStart) {
          showToast('✓ Cloud server connected & ready!', 'success');
        }
        state.config = { ...state.config, ...data };
        const t1El = document.getElementById('planTier1PriceVal');
        const t2El = document.getElementById('planTier2PriceVal');
        if (t1El) t1El.textContent = `₹${state.config.priceInr || 99}`;
        if (t2El) t2El.textContent = `₹${state.config.tier2PriceInr || 499}`;
        if (typeof setPaymentTier === 'function') setPaymentTier('TIER_2');
      })
      .catch(() => {
        if (retriesLeft > 0) {
          setTimeout(() => loadConfig(retriesLeft - 1), 3000);
        } else {
          clearTimeout(coldStartTimer);
          if (typeof setPaymentTier === 'function') setPaymentTier('TIER_2');
        }
      });
  }
  loadConfig();

  // ==========================================================================
  // DISPUTE VERDICT CHECKER DATABASE (All Fields & Dealerships)
  // ==========================================================================
  const CHECKER_DISPUTES_DB = {
    dealership: {
      title: 'Dealership & Franchise Disputes',
      selectLabel: 'Select Specific Dealership / Franchise Breach to Evaluate:',
      items: {
        deposit_withheld: {
          label: 'Unlawful Withholding of Dealership Caution Deposit / Bank Guarantee',
          status: 'VERDICT: 100% UNLAWFUL BREACH OF DEALERSHIP AGREEMENT',
          explanation: 'Under Section 73 of the Indian Contract Act, 1872 and settled High Court precedents, a principal company or franchisor cannot arbitrarily forfeit or freeze a dealer caution deposit, showroom security, or bank guarantee upon dealership exit or non-renewal without demonstrating audited, verifiable losses.',
          statutes: 'Sec 73 & 74 Indian Contract Act 1872, Commercial Courts Act 2015, Specific Relief Act 1963.'
        },
        unpaid_margin: {
          label: 'Unpaid Monthly Dealer Margins, Commission & Performance Incentives',
          status: 'VERDICT: ILLEGAL WITHHOLDING OF EARNED COMMERCIAL DUES',
          explanation: 'Failing to disburse agreed dealer commission, wholesale margins, and sales target incentives constitutes material breach of dealership contract. Principal companies are legally bound to settle dealer reconciliation accounts with 18% commercial interest.',
          statutes: 'Sec 70/73 Indian Contract Act 1872, Order XXXVII CPC (Summary Suit for Debt Recovery).'
        },
        stock_buyback: {
          label: 'Refusing Stock Buyback of Unsold Vehicles & Spare Parts on Termination',
          status: 'VERDICT: UNFAIR TRADE PRACTICE & BREACH OF REPURCHASE COVENANTS',
          explanation: 'Where a dealership is terminated or not renewed, the principal manufacturer is contractually and commercially obligated under trade custom and dealership agreements to repurchase unsold demo vehicles, spare parts inventory, and diagnostic tooling at invoice value.',
          statutes: 'Sale of Goods Act 1930, Competition Act 2002 (Abuse of Dominant Position), Contract Act 1872.'
        },
        arbitrary_termination: {
          label: 'Abrupt / Arbitrary Termination of Dealership Without Mandatory 90-Day Notice',
          status: 'VERDICT: ILLEGAL UNILATERAL TERMINATION WITHOUT NATURAL JUSTICE',
          explanation: 'Arbitrary termination of dealership licenses without giving reasonable cure periods or adhering to 60-90 days contractual notice is legally voidable. The aggrieved dealer is entitled to claim substantial damages for infrastructure investment, showroom lease, and staff overheads.',
          statutes: 'Sec 39 & 73 Indian Contract Act, Commercial Courts Precedents on Franchise Agreements.'
        },
        warranty_claims: {
          label: 'Unpaid Warranty Labor & Component Replacement Claims',
          status: 'VERDICT: STATUTORY BREACH OF PRINCIPAL-DEALER INDEMNITY',
          explanation: 'When an authorized dealership performs warranty replacements on customer vehicles, the manufacturer acts as principal indemnifier. Withholding warranty claims is a direct violation of principal-agent indemnity under Section 222 of the Contract Act.',
          statutes: 'Sec 222 & 223 Indian Contract Act 1872 (Agent Indemnity), Consumer Protection Act 2019.'
        },
        forced_stocking: {
          label: 'Coercive / Forced Dumping of Slow-Moving Inventory & Vehicles',
          status: 'VERDICT: UNFAIR TRADE PRACTICE & COMPETITION LAW VIOLATION',
          explanation: 'Forcing dealers to accept unordered, slow-moving vehicle variants or bundling unsellable accessories as a condition to receive high-demand stock violates Section 3(4) of the Competition Act (Tie-in Arrangements) and constitutes contractual coercion.',
          statutes: 'Sec 3(4) & Sec 4 Competition Act 2002, Sec 15 Indian Contract Act (Coercion).'
        }
      }
    },
    tenancy: {
      title: 'Tenancy & Rent Caution Deposits',
      selectLabel: 'Select Specific Tenancy / Landlord Deduction to Evaluate:',
      items: {
        painting: {
          label: 'Painting Charges (Deducting 1 month rent or ₹15,000 - ₹30,000)',
          status: 'VERDICT: 100% UNLAWFUL DEDUCTION UNDER LAW',
          explanation: 'Under Section 108 of the Transfer of Property Act, 1882 and multiple High Court rulings, normal weathering, fading paint, and ordinary wear & tear are the sole maintenance obligation of the property owner. Forcing tenants to pay for fresh repainting without willful vandalism constitutes an illegal forfeiture of caution deposit.',
          statutes: 'Sec 73 Indian Contract Act, Sec 108 Transfer of Property Act, Model Tenancy Act (Sec 13).'
        },
        cleaning: {
          label: 'Deep Cleaning Fee (Deducting ₹5,000 - ₹15,000)',
          status: 'VERDICT: UNLAWFUL WITHOUT ACTUAL GST INVOICES',
          explanation: 'Deducting arbitrary "deep cleaning" amounts without verifiable third-party GST vendor tax invoices constitutes unfair trade practices under Section 2(47) of the Consumer Protection Act, 2019.',
          statutes: 'Consumer Protection Act 2019 (Sec 2(47)), Doctrine of Restitution (Sec 65 Contract Act).'
        },
        wear_tear: {
          label: 'Normal Wear & Tear (Minor wall marks, floor scuffs)',
          status: 'VERDICT: EXPLICITLY ILLEGAL UNDER LAW',
          explanation: 'Indian contract law firmly establishes the "Doctrine of Reasonable Wear and Tear". Landlords are strictly barred from passing ordinary property aging, minor wall scuffs, or natural wear onto the tenant.',
          statutes: 'Transfer of Property Act 1882 (Sec 108(m)), State Rent Control Acts.'
        },
        delay: {
          label: '"No Funds Right Now" / Delaying Beyond 30 Days',
          status: 'VERDICT: BREACH OF MANDATORY STATUTORY TIMELINE',
          explanation: 'Under the Model Tenancy Act and standard rental agreement clauses, caution deposits must be refunded within 30 days of key handover. Any delay beyond 30 days attracts 12% to 18% statutory interest liability.',
          statutes: 'Model Tenancy Act (Sec 13), Sec 73 Indian Contract Act (Interest liability).'
        },
        ghosting: {
          label: 'Ghosting / Not Answering WhatsApp or Calls',
          status: 'VERDICT: CRIMINAL BREACH OF TRUST (SEC 405 IPC / 316 BNS)',
          explanation: 'Holding caution deposit funds as a custodian and ignoring legitimate refund demands amounts to dishonest misappropriation of entrusted movable property, actionable under Section 405/406 IPC.',
          statutes: 'Sec 405/406 Indian Penal Code / Bharatiya Nyaya Sanhita, Consumer Protection Act.'
        },
        lockin: {
          label: 'Arbitrary Lock-in Forfeiture upon Job Relocation / Early Exit',
          status: 'VERDICT: UNENFORCEABLE PENALTY CLAUSE (SEC 74 CONTRACT ACT)',
          explanation: 'Blanket forfeiture of entire security deposits for early vacating violates Section 74 of the Contract Act. Landlords cannot claim liquidated damages without proving actual unmitigated vacancy loss.',
          statutes: 'Sec 74 Indian Contract Act (Unreasonable Penalty), Supreme Court in Kailash Nath v. DDA.'
        }
      }
    },
    commercial: {
      title: 'Commercial Invoices & MSME Recovery',
      selectLabel: 'Select Specific B2B / Invoice Breach to Evaluate:',
      items: {
        msme_delay: {
          label: 'Overdue Vendor Invoices Exceeding 45 Days (MSMED Act)',
          status: 'VERDICT: MANDATORY STATUTORY COMPOUND INTEREST AT 3X BANK RATE',
          explanation: 'Under Section 15 & 16 of the MSMED Act 2006, payment for goods or services supplied by an MSME must be cleared within 45 days. Buyers failing to pay are legally mandated to pay compound interest with monthly rests at 3 times the RBI bank rate.',
          statutes: 'Sec 15, 16, 17 MSMED Act 2006, Commercial Courts Act 2015, Sec 73 Contract Act.'
        },
        unjustified_debit: {
          label: 'Arbitrary Debit Notes Issued Without Rejection of Delivered Goods',
          status: 'VERDICT: UNLAWFUL CONTRACTUAL SET-OFF & UNJUST RETENTION',
          explanation: 'Buyers who have accepted goods without issuing a timely formal rejection note under Section 42 of the Sale of Goods Act cannot issue unilateral debit notes to avoid invoice clearance.',
          statutes: 'Sale of Goods Act 1930 (Sec 41 & 42), Sec 73 Indian Contract Act.'
        },
        retention_money: {
          label: 'Refusal to Release 5-10% Retention Money After Defect Liability Period',
          status: 'VERDICT: ILLEGAL WITHHOLDING OF EARNED EARNEST FUNDS',
          explanation: 'Once the contractual Defect Liability Period (DLP) or warranty period has expired without recorded patent defects, retaining retention money is an actionable civil wrong subject to immediate interest.',
          statutes: 'Sec 73 Contract Act 1872, Specific Relief Act 1963, Commercial Courts Jurisdiction.'
        }
      }
    },
    consumer: {
      title: 'Consumer & Defective Goods',
      selectLabel: 'Select Specific Consumer / Dealership Defect to Evaluate:',
      items: {
        defective_vehicle: {
          label: 'Defective New Vehicle / Repetitive Breakdown from Auto Dealer (Lemon Law)',
          status: 'VERDICT: DEFICIENCY IN SERVICE & PRODUCT LIABILITY (CPA 2019)',
          explanation: 'Selling a motor vehicle with persistent manufacturing defects or failure by dealership to repair within reasonable time triggers Chapter VI (Product Liability) of the Consumer Protection Act 2019, entitling the buyer to replacement or 100% refund plus punitive damages.',
          statutes: 'Sec 2(47), Sec 84 & 85 Consumer Protection Act 2019, Central Motor Vehicles Rules.'
        },
        warranty_refusal: {
          label: 'Dealership Refusal to Honor Manufacturer Warranty or Free Service',
          status: 'VERDICT: UNFAIR TRADE PRACTICE UNDER CONSUMER LAW',
          explanation: 'Authorized dealerships and manufacturers are jointly and severally liable to honor express warranties. Refusing warranty service on frivolous grounds gives rise to immediate consumer court jurisdiction with zero court fees.',
          statutes: 'Sec 2(11) Deficiency in Service, Sec 35 Consumer Protection Act 2019.'
        },
        refund_delay: {
          label: 'Refusal to Refund Booking Cancellation Amount within 7 Days',
          status: 'VERDICT: UNLAWFUL FORFEITURE OF CONSUMER ADVANCE',
          explanation: 'Retaining booking advance money after cancellation without providing vehicle delivery within committed timeline is an illegal forfeiture under consumer protection rules.',
          statutes: 'Consumer Protection Act 2019, Sec 73 Indian Contract Act.'
        }
      }
    },
    employment: {
      title: 'Employment & Salary Recovery',
      selectLabel: 'Select Specific Employment / Workplace Breach to Evaluate:',
      items: {
        unpaid_salary: {
          label: 'Unpaid Salary / Full & Final (F&F) Settlement Withheld Beyond 7 Days',
          status: 'VERDICT: STATUTORY VIOLATION OF PAYMENT OF WAGES ACT',
          explanation: 'Under the Payment of Wages Act and state Shops & Establishments Acts, an employee who resigns or is relieved must receive full final settlement within 2 working days. Withholding salary or earned leave encashment is punishable under labor laws.',
          statutes: 'Payment of Wages Act 1936, Shops and Commercial Establishments Act, Sec 405 IPC.'
        },
        relieving_letter: {
          label: 'Refusing to Issue Relieving Letter, Service Certificate or Experience Doc',
          status: 'VERDICT: UNLAWFUL RESTRAINT ON RIGHT TO LIVELIHOOD (ART 21/19)',
          explanation: 'An employer has no legal right to withhold relieving letters or service certificates once notice is served. Such withholding is actionable for substantial tortious damages for blocking future employment.',
          statutes: 'Constitution of India (Art 19(1)(g)), Indian Contract Act Sec 27, High Court Precedents.'
        },
        notice_deduction: {
          label: 'Unlawful Deduction for Notice Period Despite Medical / Mutual Notice',
          status: 'VERDICT: UNREASONABLE PENALTY UNDER SECTION 74 CONTRACT ACT',
          explanation: 'Deducting notice pay when the employee served partial notice or left under medical/harassment circumstances without employer suffering actual proven replacement loss is legally invalid.',
          statutes: 'Sec 74 Indian Contract Act, Industrial Disputes Act 1947.'
        }
      }
    },
    cheque: {
      title: 'Dishonour of Cheque (Sec 138 NI Act)',
      selectLabel: 'Select Specific Cheque Dishonour Circumstance:',
      items: {
        cheque_bounce_insufficient: {
          label: 'Cheque Dishonoured Due to "Funds Insufficient" (Sec 138 NI Act)',
          status: 'VERDICT: COGNIZABLE CRIMINAL OFFENCE (UP TO 2 YEARS IMPRISONMENT)',
          explanation: 'Under Section 138 of the Negotiable Instruments Act, 1881, issuing a cheque without sufficient funds is a criminal offence. Serving a statutory 15-day legal demand notice within 30 days of the return memo is mandatory before criminal court filing.',
          statutes: 'Sec 138 to 142 Negotiable Instruments Act 1881, Sec 420 Indian Penal Code.'
        },
        stop_payment: {
          label: 'Dishonour Due to "Stop Payment" Instruction by Drawer',
          status: 'VERDICT: PRESUMPTION OF GUILT UNDER SEC 139 NI ACT',
          explanation: 'The Supreme Court of India in Modi Cements and subsequent rulings held that stopping payment of a validly issued cheque for a discharge of debt or liability directly attracts Section 138 penal proceedings.',
          statutes: 'Sec 138 & 139 NI Act 1881, Apex Court in Modi Cements Ltd. v. Kuchil Kumar Nandi.'
        },
        account_closed: {
          label: 'Cheque Bounced Due to "Account Closed" by Issuer',
          status: 'VERDICT: FRAUDULENT CONDUCT & SEC 138 NI ACT OFFENCE',
          explanation: 'Issuing a cheque on an account that is already closed or subsequently closed amounts to active misrepresentation and attracts both Section 138 NI Act and Section 420 IPC (Cheating).',
          statutes: 'Sec 138 NI Act 1881, Sec 420 IPC / Sec 318 Bharatiya Nyaya Sanhita.'
        }
      }
    },
    loan: {
      title: 'Loan & Debt Recovery (Promissory Note)',
      selectLabel: 'Select Specific Loan Default / Debt Violation to Evaluate:',
      items: {
        loan_due_date_default: {
          label: 'Default on Repayment Due Date Despite Written Promissory Note',
          status: 'VERDICT: ACTIONABLE LIQUIDATED DEBT UNDER ORDER XXXVII CPC',
          explanation: 'Defaulting on a written promissory note, loan agreement, or debt covenant entitles the lender to initiate Summary Suit proceedings under Order XXXVII of the CPC for immediate decree and attachment of debtor assets.',
          statutes: 'Negotiable Instruments Act 1881, Order XXXVII CPC, Sec 73 Indian Contract Act.'
        },
        interest_refusal: {
          label: 'Refusal to Pay Agreed Monthly Interest as per Loan Instrument',
          status: 'VERDICT: MATERIAL BREACH OF LOAN TERMS',
          explanation: 'Withholding contractually agreed interest constitutes breach of contract. Courts routinely award pre-suit interest up to 18% per annum along with principal recovery.',
          statutes: 'Sec 34 CPC (Award of Commercial Interest), Sec 73 Contract Act.'
        },
        evading_repayment: {
          label: 'Deliberate Evasion, Absconding or Dishonest Inducement to Borrow',
          status: 'VERDICT: CRIMINAL BREACH OF TRUST & FRAUD (SEC 420 IPC / 318 BNS)',
          explanation: 'Borrowing funds under false assurances without intention to repay amounts to cheating and criminal misappropriation of funds.',
          statutes: 'Sec 406/420 IPC, Sec 316/318 Bharatiya Nyaya Sanhita, Summary Suit CPC.'
        }
      }
    },
    builder: {
      title: 'Builder & Real Estate Dispute (RERA)',
      selectLabel: 'Select Specific Builder / Real Estate Violation to Evaluate:',
      items: {
        possession_delay: {
          label: 'Delay in Handing Over Possession Beyond Agreement Date (RERA Sec 18)',
          status: 'VERDICT: STATUTORY VIOLATION OF SECTION 18 REAL ESTATE ACT',
          explanation: 'Under Section 18 of RERA 2016, if a builder fails to complete or give possession of an apartment/plot by the agreed date, the buyer has the absolute right to claim 100% refund with interest (MCLR + 2%) or delay compensation.',
          statutes: 'Section 18 & 19 Real Estate (Regulation and Development) Act 2016 (RERA).'
        },
        advance_refund: {
          label: 'Refusal to Refund Booking Advance on Project Cancellation',
          status: 'VERDICT: UNLAWFUL FORFEITURE OF HOMEBUYER ADVANCE',
          explanation: 'Forfeiting more than token administrative fee or refusing refund when builder changes terms is an unfair trade practice under RERA and Consumer Protection Act.',
          statutes: 'Sec 13 RERA 2016, Sec 2(47) Consumer Protection Act 2019.'
        },
        unauthorized_alteration: {
          label: 'Unauthorized Change in Flat Layout, Amenities, or Super Built-up Area',
          status: 'VERDICT: MATERIAL BREACH OF APPROVED SANCTION PLANS (SEC 14 RERA)',
          explanation: 'Builders cannot alter sanctioned architectural drawings, layout, common amenities or reduce carpet area without 2/3rd allottees written consent under Section 14 of RERA.',
          statutes: 'Section 14 RERA 2016, High Court and Supreme Court RERA Precedents.'
        }
      }
    },
    freelance: {
      title: 'Freelancer & Agency Fee Recovery',
      selectLabel: 'Select Specific Client Non-Payment Violation to Evaluate:',
      items: {
        unpaid_milestone: {
          label: 'Client Withholding Final Payment After Approving Deliverables',
          status: 'VERDICT: 100% UNLAWFUL BREACH OF FREELANCE CONTRACT',
          explanation: 'Under Section 70 of the Indian Contract Act, once a client has received, approved, or put into commercial use digital assets or code, they are legally obligated to pay agreed remuneration.',
          statutes: 'Sec 70 & 73 Indian Contract Act 1872, MSME Development Act 2006.'
        },
        project_abandonment: {
          label: 'Client Ghosting / Abrupt Project Cancellation Without Pro-Rata Payment',
          status: 'VERDICT: ILLEGAL REPUDIATION OF CONTRACT (QUANTUM MERUIT)',
          explanation: 'Under the legal doctrine of Quantum Meruit, a service provider is entitled to full compensation for work performed up to the date of cancellation plus compensation for reserved schedule.',
          statutes: 'Doctrine of Quantum Meruit (Sec 65/70 Contract Act), Commercial Courts Act.'
        },
        scope_creep: {
          label: 'Demanding Endless Revisions Outside Scope While Withholding Dues',
          status: 'VERDICT: UNREASONABLE COERCION & BREACH OF STATEMENT OF WORK',
          explanation: 'Withholding payment for completed agreed milestones to force free additional work violates the Statement of Work (SOW) and constitutes actionable commercial coercion.',
          statutes: 'Sec 73 Contract Act, Indian Copyright Act (Retention of Intellectual Property until Paid).'
        }
      }
    },
    custom: {
      title: 'Any Field / Dealership / Custom Legal Notice',
      selectLabel: 'Select Specific Legal Breach for Your Field / Industry:',
      items: {
        breach_promise: {
          label: 'Unlawful Financial Withholding in Any Trade, Dealership or Service',
          status: 'VERDICT: ACTIONABLE BREACH OF CONTRACT & UNJUST ENRICHMENT',
          explanation: 'Under Section 70 and 73 of the Indian Contract Act, 1872, any individual, dealership, enterprise or commercial counterparty that receives benefit or retains another party’s funds without valid lawful cause is mandated to restore the funds with commercial interest.',
          statutes: 'Sec 70, 72 & 73 Indian Contract Act 1872, Specific Relief Act 1963, Commercial Courts Act.'
        },
        refusal_refund: {
          label: 'Refusal to Return Earnest Advance / Security Deposit in Any Field',
          status: 'VERDICT: UNLAWFUL FORFEITURE OF CAUTION MONEY',
          explanation: 'Advance money or security deposits can never be forfeited as a penalty. The withholding party must return 100% of the funds unless they produce verifiable, third-party substantiated damages.',
          statutes: 'Sec 74 Contract Act (Prohibition of Penalties), Order XXXVII Civil Procedure Code.'
        },
        unjust_enrichment: {
          label: 'Unjust Enrichment and Breach of Express Agreement Terms',
          status: 'VERDICT: CIVIL WRONG & STATUTORY RESTITUTION MANDATE',
          explanation: 'No corporate entity, principal manufacturer, supplier, or landlord can unlawfully enrich itself at the expense of an authorized dealer or contracting party.',
          statutes: 'Doctrine of Restitution, Sec 65 Indian Contract Act, High Court Precedents.'
        }
      }
    }
  };

  // ==========================================================================
  // UNIVERSAL NOTICE TYPES DATABASE (All Fields & Dealerships Supported)
  // ==========================================================================
  const NOTICE_TYPES_DB = {
    dealership: {
      id: 'dealership',
      label: 'Dealership & Franchise',
      claimantLabel: 'Your Full Name / Dealership Name (Claimant) *',
      claimantPlaceholder: 'e.g. Rajesh Patel (M/s Apex Auto Dealership)',
      opponentLabel: 'Opponent Principal Brand / Manufacturer / Franchisor *',
      opponentPlaceholder: 'e.g. Automobile Manufacturing Brand Ltd.',
      addressLabel: 'Dealership Showroom / Authorized Facility Address *',
      addressPlaceholder: 'e.g. Plot 42, Auto Zone, Industrial Area, Ahmedabad, Gujarat - 382445',
      startDateLabel: 'Dealership Agreement Execution Date',
      breachDateLabel: 'Date of Dispute / Termination Notice *',
      depositPaidLabel: 'Total Dealership Caution Deposit / Bank Guarantee Paid (₹) *',
      depositPaidPlaceholder: 'e.g. 500000',
      periodicAmountLabel: 'Monthly Agreed Dealer Minimum Guarantee / Margin (₹) *',
      periodicAmountPlaceholder: 'e.g. 150000',
      amountRefundedLabel: 'Amount Reconciled / Refunded So Far (₹)',
      amountWithheldLabel: 'Total Caution Deposit & Margin Withheld Demanded Back (₹) *',
      amountWithheldPlaceholder: 'e.g. 350000',
      sampleClaimant: 'Rajesh Patel (M/s Apex Auto Dealership)',
      sampleOpponent: 'Automobile Manufacturing Brand Ltd.',
      sampleAddress: 'Plot 42, Auto Zone, Industrial Area, Ahmedabad, Gujarat - 382445',
      sampleDeposit: 500000,
      samplePeriodic: 150000,
      sampleWithheld: 350000,
      accommodationLabel: 'Dealership / Industry Segment *',
      accommodationOptions: [
        'Automobile 2-Wheeler / 4-Wheeler Dealership',
        'Commercial Vehicle & Heavy Equipment Dealership',
        'EV (Electric Vehicle) Dealership & Battery Franchise',
        'FMCG & Consumer Goods Super-Stockist / Distributorship',
        'Retail Fashion & Food Franchise Outlet',
        'Electronics, Mobile & Appliance Authorized Dealership',
        'Industrial Machinery / Hardware Distributorship'
      ],
      excusesLabel: 'Select All Dealership Breaches / Grounds Against Opponent:',
      excuses: [
        { value: 'Unlawful Withholding of Dealership Caution Deposit / Bank Guarantee', text: 'Unlawful Withholding of Dealership Caution Deposit / Bank Guarantee', checked: true },
        { value: 'Unpaid Dealer Margin, Monthly Commission & Target Incentives', text: 'Unpaid Dealer Margin, Monthly Commission & Target Incentives', checked: true },
        { value: 'Refusal of Stock Buyback for Unsold Vehicles & Spare Parts', text: 'Refusal of Stock Buyback for Unsold Vehicles & Spare Parts on Termination', checked: true },
        { value: 'Abrupt Dealership Termination Without Mandatory 90-Day Notice', text: 'Abrupt Dealership Termination Without Mandatory 90-Day Notice', checked: false },
        { value: 'Unpaid Warranty Labor & Component Replacement Claims', text: 'Unpaid Warranty Labor & Component Replacement Claims', checked: false },
        { value: 'Coercive / Forced Dumping of Slow-Moving Inventory & Vehicles', text: 'Coercive / Forced Dumping of Slow-Moving Inventory & Vehicles', checked: false }
      ],
      step3Headline: 'High Probability of Full Settlement Under Commercial Law & Contract Act',
      step3Desc: 'The principal company\'s withholding of caution money and unpaid dealer margins violates Section 73 of the Indian Contract Act and commercial trade covenants.',
      step3Clauses: [
        { strong: 'Unlawful Forfeiture of Dealership Caution Deposit:', text: 'Under Section 74 of the Contract Act and settled commercial law, caution money cannot be arbitrarily forfeited without certified audited proof of actual damage.' },
        { strong: 'Mandatory Stock Buyback & Principal Indemnity:', text: 'Principal manufacturers are obligated under trade customs to repurchase unsold inventory and honor warranty indemnity under Section 222.' },
        { strong: 'Commercial Courts Summary Jurisdiction:', text: 'Withheld dealer balances are actionable under Order XXXVII of the CPC and Commercial Courts Act 2015 for rapid attachment.' },
        { strong: '18% Compound Commercial Interest Liability:', text: 'The opponent is made legally liable for 18% per annum commercial interest from the date of wrongful withholding until full realization.' }
      ],
      docSignRole: 'Authorized Signatory / Aggrieved Dealership Proprietor',
      noticeSubject: (amt) => `<strong>SUBJECT:</strong> FORMAL PRE-LITIGATION LEGAL NOTICE UNDER SECTION 73 OF THE INDIAN CONTRACT ACT, 1872, SALE OF GOODS ACT, 1930 & COMMERCIAL COURTS ACT, 2015 FOR IMMEDIATE REFUND OF WITHHELD DEALERSHIP CAUTION DEPOSIT AND EARNED COMMERCIAL MARGINS AMOUNTING TO <strong>₹${amt}/-</strong> ALONG WITH 18% ACCRUED COMMERCIAL INTEREST.`,
      getDocNoticePara1: (d, dep) => `<strong>1. COMMERCIAL & DEALERSHIP APPOINTMENT:</strong> That my Client is the proprietor/authorized entity of the Dealership operating from the commercial showroom/facility situated at <span id="docBodyAddress">${d.propertyAddress}</span>, appointed under a valid commercial dealership agreement. At the inception of the dealership, my Client deposited a refundable caution deposit / security sum of <strong>₹<span id="docDepositPaid">${dep}</span>/-</strong>, with the categorical covenant that said sum was fully refundable upon conclusion or termination.`,
      getDocNoticePara2: (d, dep, vac) => `<strong>2. PERFORMANCE & TERMINATION TIMELINE:</strong> That my Client diligently operated the authorized dealership, fulfilled showroom standards, and formally tendered accounts/termination on <span id="docVacateDate">${vac}</span>. All vehicle inventory records, warranty logs, and customer accounts were submitted in good faith.`,
      getDocBlurredPara3: (d, amt, rsn) => `<strong>3. UNLAWFUL WITHHOLDING OF DEALER FUNDS:</strong> That despite repeated demands and formal submission of accounts, you have unlawfully and arbitrarily withheld / failed to disburse the sum of <strong>₹<span id="docBlurredWithheld">${amt}</span>/-</strong> under the pretext of <span id="docBlurredReasons">${rsn}</span>. It is a settled position of commercial jurisprudence that dealership caution deposits and earned margins cannot be arbitrarily withheld.`,
      getDocBlurredPara4: (d, amt) => `<strong>4. DEMAND FOR IMMEDIATE REMITTANCE:</strong> My Client hereby demands that you remit the withheld sum of <strong>₹<span id="docBlurredTotal">${amt}</span>/-</strong> along with statutory commercial interest at the rate of 18% per annum directly to my Client's bank account within <strong>SEVEN (7) TO FIFTEEN (15) DAYS</strong> of receipt of this notice.`,
      getDocBlurredPara5: () => `<strong>5. NOTICE OF COMMERCIAL LITIGATION:</strong> Take notice that should you fail to comply with this demand, my Client has given peremptory instructions to initiate appropriate legal proceedings before the Competent Commercial Court, MSME Samadhaan Facilitation Council, or Civil Court for recovery of the principal sum, interest, compensation for business losses, and legal costs.`,
      getDocUnlockedPara3: (d, amt, rsn) => `<strong>3. UNLAWFUL WITHHOLDING & MATERIAL BREACH:</strong> That despite repeated written demands and commercial reconciliation, you have unlawfully retained the sum of <strong>₹<span id="docUnlockedWithheld">${amt}</span>/-</strong> under the pretext of <span id="docUnlockedReasons">${rsn}</span>. Under Section 73 of the Indian Contract Act, such withholding constitutes an actionable breach of contract.`,
      getDocUnlockedPara4: () => `<strong>4. STATUTORY & TRADE VIOLATIONS:</strong> Your failure to release caution deposits, process stock buybacks of unsold vehicles/spares, and disburse earned margins confirms that said retention is punitive, coercive, and constitutes an unfair trade practice under the Competition Act, 2002, Sale of Goods Act, 1930, and Criminal Breach of Trust under Section 405 IPC / Section 316 Bharatiya Nyaya Sanhita.`,
      getDocUnlockedPara5: (d, amt) => `<strong>5. FINAL PEREMPTORY DEMAND:</strong> You are hereby called upon to immediately remit the full outstanding sum of <strong>₹<span id="docUnlockedFinalTotal">${amt}</span>/-</strong> along with accrued commercial interest at 18% per annum to my Client's designated commercial bank account / RTGS within <strong>SEVEN (7) TO FIFTEEN (15) DAYS</strong> of receipt of this notice, failing which:`,
      docLegalActionList: [
        'A formal Commercial Recovery Suit under Order XXXVII of the CPC / Commercial Courts Act 2015 will be instituted seeking full recovery + ₹2,00,000/- business disruption damages.',
        'A statutory complaint shall be filed before the Competition Commission of India (CCI) / Ministry of Corporate Affairs for abuse of dominant position and coercive commercial practices.',
        'All arbitration/litigation costs, advocate fees (₹50,000), and compound interest shall be claimed solely at your risk, cost and consequence.'
      ]
    },

    tenancy: {
      id: 'tenancy',
      label: 'Tenancy & Rent Deposit',
      claimantLabel: 'Your Full Name (Outgoing Tenant) *',
      claimantPlaceholder: 'e.g. Rahul Sharma',
      opponentLabel: 'Landlord / Property Owner Full Name *',
      opponentPlaceholder: 'e.g. K. V. Narayana',
      addressLabel: 'Rented House / Flat / PG Address *',
      addressPlaceholder: 'e.g. Flat 302, Green Glen Layout, Bellandur, Bengaluru - 560103',
      startDateLabel: 'Tenancy Agreement Start Date',
      breachDateLabel: 'Date of Vacating & Key Handover *',
      depositPaidLabel: 'Total Security Deposit Paid (₹) *',
      depositPaidPlaceholder: 'e.g. 100000',
      periodicAmountLabel: 'Monthly Rent Amount (₹) *',
      periodicAmountPlaceholder: 'e.g. 25000',
      amountRefundedLabel: 'Amount Refunded So Far (₹, enter 0 if none)',
      amountWithheldLabel: 'Amount Unlawfully Withheld Demanded Back (₹) *',
      amountWithheldPlaceholder: 'e.g. 45000',
      sampleClaimant: 'Rahul Sharma',
      sampleOpponent: 'K. V. Narayana (Landlord)',
      sampleAddress: 'Flat 302, Green Glen Layout, Bellandur, Bengaluru - 560103',
      sampleDeposit: 100000,
      samplePeriodic: 25000,
      sampleWithheld: 45000,
      accommodationLabel: 'Accommodation Type *',
      accommodationOptions: [
        'Residential Apartment / Flat',
        'Independent House / Villa',
        'Co-Living / PG Accommodation',
        'Commercial Office Space',
        'Retail Shop / Commercial Showroom'
      ],
      excusesLabel: 'Select All Excuses / Reasons Landlord is Using:',
      excuses: [
        { value: 'Painting Charges', text: 'Forced Painting Charges without proof of willful damage', checked: true },
        { value: 'Deep Cleaning Charges', text: 'Unreasonable Deep Cleaning deductions', checked: true },
        { value: 'Normal Wear and Tear', text: 'Billing for normal wear and tear / minor aging', checked: false },
        { value: 'Ghosting / Ignoring Calls', text: 'Delaying / Ghosting / Refusing to answer calls', checked: false },
        { value: 'No Breakdown or Bills', text: 'Failed to provide valid itemized bills/invoices for deductions', checked: false },
        { value: 'Arbitrary Lock-in Forfeiture', text: 'Arbitrary lock-in period deposit forfeiture', checked: false }
      ],
      step3Headline: 'High Probability of Full Settlement Without Litigation',
      step3Desc: 'The landlord\'s deductions directly violate established statutory protections under Section 73 of the Indian Contract Act and Section 108 of the Transfer of Property Act.',
      step3Clauses: [
        { strong: 'Illegal Painting / Wear & Tear Forfeiture:', text: 'Landlord is legally prohibited from charging painting costs for ordinary weathering or tenancy tenure over 11 months.' },
        { strong: '30-Day Mandatory Handover Limit Exceeded:', text: 'Under Model Tenancy guidelines and standard lease covenants, withholding deposit beyond 30 days incurs penal liability.' },
        { strong: 'Unjustified Enrichment (Sec 72 Contract Act):', text: 'Retaining tenant funds without verifiable itemized tax invoices constitutes unlawful retention and breach of trust.' },
        { strong: '18% Compound Interest Claim:', text: 'Landlord is made liable for 18% per annum commercial interest from the date of handover until full realization.' }
      ],
      docSignRole: 'Aggrieved Tenant & Claimant',
      noticeSubject: (amt) => `<strong>SUBJECT:</strong> FORMAL LEGAL DEMAND NOTICE UNDER SECTION 73 OF THE INDIAN CONTRACT ACT, 1872 AND THE CONSUMER PROTECTION ACT, 2019 FOR IMMEDIATE REFUND OF UNLAWFULLY WITHHELD SECURITY DEPOSIT OF <strong>₹${amt}/-</strong> WITH STATUTORY ACCRUED INTEREST.`,
      getDocNoticePara1: (d, dep) => `<strong>1. TENANCY BACKGROUND:</strong> That my Client was an authorized lawful tenant of the residential premises situated at <span id="docBodyAddress">${d.propertyAddress}</span>, under a valid rental/lease agreement. At the inception of the tenancy, my Client paid an advance refundable security deposit of <strong>₹<span id="docDepositPaid">${dep}</span>/-</strong>, with the categorical covenant that said sum was fully refundable upon peaceful vacating.`,
      getDocNoticePara2: (d, dep, vac) => `<strong>2. VACATING & TIMELINE:</strong> That my Client dutifully performed all tenant covenants and peacefully surrendered vacant physical possession of the rented premises on <span id="docVacateDate">${vac}</span>. At said time, all utility bills were paid in full and the premises were handed over in good order.`,
      getDocBlurredPara3: (d, amt, rsn) => `<strong>3. UNLAWFUL DEDUCTION & MATERIAL BREACH:</strong> That despite repeated demands and formal handover, you have unlawfully and arbitrarily deducted / refused to refund the sum of <strong>₹<span id="docBlurredWithheld">${amt}</span>/-</strong> under the pretext of <span id="docBlurredReasons">${rsn}</span>. It is a settled position of statutory law that caution deposits cannot be arbitrarily forfeited without strict legal proof of willful damage.`,
      getDocBlurredPara4: (d, amt) => `<strong>4. DEMAND FOR REFUND:</strong> My Client hereby demands that you remit the withheld sum of <strong>₹<span id="docBlurredTotal">${amt}</span>/-</strong> along with statutory interest at the rate of 18% per annum directly to my Client's bank account within <strong>SEVEN (7) TO FIFTEEN (15) DAYS</strong> of receipt of this notice.`,
      getDocBlurredPara5: () => `<strong>5. NOTICE OF LEGAL ACTION:</strong> Take notice that should you fail to comply with this demand, my Client has given peremptory instructions to initiate appropriate legal proceedings before the Competent Consumer Disputes Redressal Commission (DCDRC) or Civil Court for recovery of the principal sum, interest, and compensation for mental harassment.`,
      getDocUnlockedPara3: (d, amt, rsn) => `<strong>3. UNLAWFUL WITHHOLDING & MATERIAL BREACH:</strong> That despite repeated demands, you have unlawfully and arbitrarily deducted / refused to refund the sum of <strong>₹<span id="docUnlockedWithheld">${amt}</span>/-</strong> under the pretext of <span id="docUnlockedReasons">${rsn}</span>. It is a settled position of law that caution deposits cannot be forfeited without verifiable proof of actual willful damage.`,
      getDocUnlockedPara4: () => `<strong>4. STATUTORY VIOLATIONS:</strong> Your refusal to provide registered GST contractor bills and accounting invoices for the claimed deductions confirms that said deductions are fictitious, punitive, and constitute an unfair trade practice under Section 2(47) of the Consumer Protection Act, 2019, as well as Criminal Breach of Trust under Section 405 of the Indian Penal Code / Bharatiya Nyaya Sanhita.`,
      getDocUnlockedPara5: (d, amt) => `<strong>5. FINAL PEREMPTORY DEMAND:</strong> You are hereby called upon to immediately refund the withheld balance of <strong>₹<span id="docUnlockedFinalTotal">${amt}</span>/-</strong> along with accrued statutory interest at 18% per annum to my Client's bank account / UPI within <strong>SEVEN (7) TO FIFTEEN (15) DAYS</strong> of delivery of this notice, failing which:`,
      docLegalActionList: [
        'An official consumer petition under Section 35 of the Consumer Protection Act, 2019 will be filed via e-Jagriti seeking full refund + ₹1,00,000/- punitive damages.',
        'A formal complaint shall be tendered to the jurisdictional Police Station for wrongful retention and criminal breach of trust under Section 405/406 IPC.',
        'All litigation costs, advocate fees (₹25,000), and interest shall be claimed solely at your risk and expense.'
      ]
    },

    commercial: {
      id: 'commercial',
      label: 'Commercial Invoices & MSME',
      claimantLabel: 'Your Business / Vendor Entity Name (Claimant) *',
      claimantPlaceholder: 'e.g. Precision Engineering Works (MSME Registered)',
      opponentLabel: 'Defaulting Buyer / Corporate Client Name *',
      opponentPlaceholder: 'e.g. Apex Infrastructure Projects Pvt. Ltd.',
      addressLabel: 'Registered Office / Factory / Supply Location *',
      addressPlaceholder: 'e.g. Unit 12, Phase II, GIDC Industrial Estate, Vatva, Ahmedabad - 382445',
      startDateLabel: 'Purchase Order / Contract Date',
      breachDateLabel: 'Invoice Due Date / Expiry of 45 Days *',
      depositPaidLabel: 'Total Invoice / Contract Value (₹) *',
      depositPaidPlaceholder: 'e.g. 850000',
      periodicAmountLabel: 'Monthly Billing / Supply Value (₹, enter 0 if one-off)',
      periodicAmountPlaceholder: 'e.g. 0',
      amountRefundedLabel: 'Part-Payment Received So Far (₹)',
      amountWithheldLabel: 'Total Overdue Outstanding Invoice Amount Demanded (₹) *',
      amountWithheldPlaceholder: 'e.g. 420000',
      sampleClaimant: 'Precision Engineering Works',
      sampleOpponent: 'Apex Infrastructure Projects Pvt. Ltd.',
      sampleAddress: 'Unit 12, Phase II, GIDC Industrial Estate, Vatva, Ahmedabad - 382445',
      sampleDeposit: 850000,
      samplePeriodic: 0,
      sampleWithheld: 420000,
      accommodationLabel: 'Supply / Industry Category *',
      accommodationOptions: [
        'Manufacturing & Engineering Supply',
        'IT, Software & Digital Services',
        'Raw Materials & Chemical Supply',
        'Logistics & Transportation Services',
        'Construction & Sub-Contracting',
        'Wholesale Trading & Distribution'
      ],
      excusesLabel: 'Select All Default Grounds & Invoice Violations:',
      excuses: [
        { value: 'Payment Delayed Beyond 45-Day Statutory MSMED Limit', text: 'Payment delayed beyond 45-day statutory MSMED limit', checked: true },
        { value: 'Arbitrary Debit Notes Issued Without Formal Rejection of Goods', text: 'Arbitrary debit notes issued without formal rejection of goods', checked: true },
        { value: 'Unlawful Retention of 5-10% Performance / Security Money', text: 'Unlawful retention of performance / security money after completion', checked: true },
        { value: 'Ignoring Payment Follow-ups and Statutory Reconciliation', text: 'Ignoring payment follow-ups and statutory reconciliation', checked: false }
      ],
      step3Headline: 'Strong Statutory Case Under MSMED Act 2006 & Commercial Courts Act',
      step3Desc: 'Defaulting on MSME trade invoices incurs mandatory compound interest with monthly rests at 3 times the RBI bank rate under Section 16 of the MSMED Act.',
      step3Clauses: [
        { strong: 'Mandatory 3X RBI Compound Interest:', text: 'Under Section 16 MSMED Act, delayed payments attract compound interest with monthly rests at 3x the RBI bank rate until full payment.' },
        { strong: 'Deemed Acceptance of Goods (Sec 42 Sale of Goods Act):', text: 'Retention of supplied goods without prompt rejection within 15 days constitutes absolute legal acceptance.' },
        { strong: 'Insolvency Notice / IBC Threat:', text: 'Corporate defaults exceeding threshold limits can be escalated under the Insolvency and Bankruptcy Code (IBC 2016).' },
        { strong: 'Summary Commercial Suit (Order XXXVII CPC):', text: 'Admitted invoices and delivery challans allow immediate court attachment and fast-track judgment.' }
      ],
      docSignRole: 'Authorized Signatory / Managing Partner',
      noticeSubject: (amt) => `<strong>SUBJECT:</strong> STATUTORY DEMAND NOTICE UNDER SECTION 15 & 16 OF THE MSMED ACT, 2006 AND SECTION 73 OF THE INDIAN CONTRACT ACT, 1872 FOR RECOVERY OF OVERDUE INVOICE DUES OF <strong>₹${amt}/-</strong> WITH 3X BANK RATE COMPOUND INTEREST.`,
      getDocNoticePara1: (d, dep) => `<strong>1. COMMERCIAL SUPPLY CONTRACT:</strong> That my Client is a recognized commercial enterprise/MSME entity operating from <span id="docBodyAddress">${d.propertyAddress}</span>. Pursuant to your purchase order and mutual contract, my Client supplied goods/services of total value <strong>₹<span id="docDepositPaid">${dep}</span>/-</strong>, all of which were duly inspected and accepted without objection.`,
      getDocNoticePara2: (d, dep, vac) => `<strong>2. INVOICE ISSUANCE & STATUTORY DEADLINE:</strong> That my Client raised valid GST tax invoices with payment due on or before <span id="docVacateDate">${vac}</span>. Despite delivery challans and physical acceptance, the statutory 45-day credit period expired with the invoice remaining unpaid.`,
      getDocBlurredPara3: (d, amt, rsn) => `<strong>3. UNLAWFUL WITHHOLDING OF TRADE FUNDS:</strong> That despite repeated reminders, you have unlawfully withheld / failed to clear the overdue balance of <strong>₹<span id="docBlurredWithheld">${amt}</span>/-</strong> citing <span id="docBlurredReasons">${rsn}</span>. Under commercial law, retaining delivered trade supplies without payment amounts to unjust enrichment.`,
      getDocBlurredPara4: (d, amt) => `<strong>4. DEMAND FOR IMMEDIATE REMITTANCE:</strong> My Client hereby demands that you remit the principal sum of <strong>₹<span id="docBlurredTotal">${amt}</span>/-</strong> along with statutory compound interest with monthly rests at 3 times the RBI bank rate within <strong>FIFTEEN (15) DAYS</strong> of receipt of this notice.`,
      getDocBlurredPara5: () => `<strong>5. NOTICE OF LEGAL ACTION:</strong> Take notice that should you fail to remit the dues, my Client shall immediately institute an application before the MSME Samadhaan Facilitation Council and file a Commercial Summary Suit under Order XXXVII CPC for attachment of your bank accounts.`,
      getDocUnlockedPara3: (d, amt, rsn) => `<strong>3. UNLAWFUL WITHHOLDING & MATERIAL BREACH:</strong> That despite repeated written demands, you have unlawfully retained the overdue trade sum of <strong>₹<span id="docUnlockedWithheld">${amt}</span>/-</strong> under the pretext of <span id="docUnlockedReasons">${rsn}</span>. This is a direct violation of Section 15 of the MSMED Act, 2006.`,
      getDocUnlockedPara4: () => `<strong>4. STATUTORY PENALTIES & LIABILITY:</strong> Under Section 16 of the MSMED Act, 2006, you are strictly liable to pay compound interest with monthly rests at three times the RBI bank rate. Furthermore, under Section 23 of the MSMED Act, such interest paid is strictly not deductible as an expense under the Income Tax Act.`,
      getDocUnlockedPara5: (d, amt) => `<strong>5. FINAL PEREMPTORY DEMAND:</strong> You are hereby called upon to immediately transfer the full overdue balance of <strong>₹<span id="docUnlockedFinalTotal">${amt}</span>/-</strong> along with statutory compound interest to my Client's bank account within <strong>FIFTEEN (15) DAYS</strong> of receipt of this notice, failing which:`,
      docLegalActionList: [
        'An expedited statutory claim will be lodged on the MSME Samadhaan Portal for recovery under Section 18 of the MSMED Act.',
        'A formal Summary Recovery Suit under Order XXXVII of the Civil Procedure Code, 1908 will be filed in the Competent Commercial Court.',
        'Insolvency demand under Section 8 of the Insolvency and Bankruptcy Code (IBC 2016) shall be issued at your sole risk and consequence.'
      ]
    },

    consumer: {
      id: 'consumer',
      label: 'Consumer & Defective Goods',
      claimantLabel: 'Consumer Full Name (Buyer / Complainant) *',
      claimantPlaceholder: 'e.g. Amit Kumar Verma',
      opponentLabel: 'Defaulting Dealer / Service Provider / Manufacturer *',
      opponentPlaceholder: 'e.g. Prime Motors Dealership & OEM Motors India',
      addressLabel: 'Dealership / Purchase Location & Delivery Address *',
      addressPlaceholder: 'e.g. Prime Motors Showroom, SG Highway, Ahmedabad, Gujarat',
      startDateLabel: 'Date of Purchase / Booking',
      breachDateLabel: 'Date of Breakdown / Defect Notice to Dealer *',
      depositPaidLabel: 'Total Purchase Price Paid for Vehicle / Product (₹) *',
      depositPaidPlaceholder: 'e.g. 1250000',
      periodicAmountLabel: 'Repair / Maintenance Cost Incurred (₹, enter 0 if none)',
      periodicAmountPlaceholder: 'e.g. 35000',
      amountRefundedLabel: 'Amount Refunded / Offered So Far (₹)',
      amountWithheldLabel: 'Total Claim Amount (Refund / Replacement / Damages) (₹) *',
      amountWithheldPlaceholder: 'e.g. 250000',
      sampleClaimant: 'Amit Kumar Verma',
      sampleOpponent: 'Prime Motors Dealership & OEM Motors India',
      sampleAddress: 'Prime Motors Showroom, SG Highway, Ahmedabad, Gujarat',
      sampleDeposit: 1250000,
      samplePeriodic: 35000,
      sampleWithheld: 250000,
      accommodationLabel: 'Consumer Transaction Type *',
      accommodationOptions: [
        'Automobile Dealership (Car / 2-Wheeler / Commercial)',
        'Electronics, Mobile & Home Appliances',
        'Solar / Renewable Energy Equipment',
        'Healthcare & Hospital Services',
        'Travel, Airline & Hotel Hospitality',
        'Educational Institution / EdTech Service'
      ],
      excusesLabel: 'Select All Consumer Deficiencies & Unfair Practices:',
      excuses: [
        { value: 'Severe Manufacturing Defect & Repetitive Breakdowns (Lemon Law)', text: 'Severe manufacturing defect & repetitive breakdowns (Lemon Law)', checked: true },
        { value: 'Dealership Refusal to Honor Manufacturer Warranty or Free Service', text: 'Dealership refusal to honor manufacturer warranty or free service', checked: true },
        { value: 'Misrepresentation of Specifications & Features by Dealership', text: 'Misrepresentation of specifications & features by dealership', checked: true },
        { value: 'Refusal to Refund Booking Advance Upon Non-Delivery', text: 'Refusal to refund booking advance upon non-delivery', checked: false }
      ],
      step3Headline: 'High Probability of Compensation Under Consumer Protection Act 2019',
      step3Desc: 'Chapter VI (Product Liability) of the CPA 2019 makes both the dealer and the manufacturer jointly and severally liable for defective goods and deficiency in service.',
      step3Clauses: [
        { strong: 'Product Liability (Sec 84 CPA 2019):', text: 'A manufacturer and authorized dealer are strictly liable for manufacturing defects, deviation from specifications, or failure to instruct.' },
        { strong: 'Deficiency in Service (Sec 2(11)):', text: 'Refusal or unreasonable delay in warranty repairs constitutes deficiency in service actionable before the Consumer Commission.' },
        { strong: 'Punitive Damages for Mental Agony:', text: 'Consumer Commissions routinely grant ₹1,00,000 to ₹5,00,000 in mental harassment damages and litigation expenses.' },
        { strong: 'Zero Court Fees for Claims up to ₹5 Lakhs:', text: 'Filing a formal consumer case on the e-Daakhil / e-Jagriti portal requires ₹0 court fees.' }
      ],
      docSignRole: 'Aggrieved Consumer & Complainant',
      noticeSubject: (amt) => `<strong>SUBJECT:</strong> FORMAL LEGAL NOTICE UNDER SECTION 35 OF THE CONSUMER PROTECTION ACT, 2019 FOR PRODUCT LIABILITY, DEFICIENCY IN SERVICE, AND IMMEDIATE REFUND / COMPENSATION OF <strong>₹${amt}/-</strong>.`,
      getDocNoticePara1: (d, dep) => `<strong>1. CONSUMER PURCHASE TRANSACTION:</strong> That my Client is a consumer who purchased a vehicle/goods from your authorized dealership showroom situated at <span id="docBodyAddress">${d.propertyAddress}</span> for total consideration of <strong>₹<span id="docDepositPaid">${dep}</span>/-</strong>, relying upon express warranties and brand representations.`,
      getDocNoticePara2: (d, dep, vac) => `<strong>2. CHRONIC DEFECTS & NOTIFICATION:</strong> That immediately following delivery, the vehicle/goods suffered from persistent mechanical/functional defects on <span id="docVacateDate">${vac}</span>. Despite repeated dealership visits and repair attempts, you failed to rectify the defect or replace the unit.`,
      getDocBlurredPara3: (d, amt, rsn) => `<strong>3. UNFAIR TRADE PRACTICE & DEFICIENCY:</strong> That you have engaged in unfair trade practices by refusing to rectify or compensate for <strong>₹<span id="docBlurredWithheld">${amt}</span>/-</strong> under the pretext of <span id="docBlurredReasons">${rsn}</span>. Under the Consumer Protection Act, 2019, selling defective products with deficiency in service constitutes a strict civil wrong.`,
      getDocBlurredPara4: (d, amt) => `<strong>4. DEMAND FOR REDRESSAL:</strong> My Client hereby demands that you refund the sum of <strong>₹<span id="docBlurredTotal">${amt}</span>/-</strong> or provide immediate replacement along with statutory interest within <strong>FIFTEEN (15) DAYS</strong> of receipt of this notice.`,
      getDocBlurredPara5: () => `<strong>5. NOTICE OF CONSUMER COURT ACTION:</strong> Take notice that should you fail to resolve this dispute, my Client will lodge a formal complaint before the District Consumer Disputes Redressal Commission (DCDRC) claiming full refund, ₹2,00,000/- punitive damages for harassment, and litigation costs.`,
      getDocUnlockedPara3: (d, amt, rsn) => `<strong>3. UNLAWFUL WITHHOLDING & MATERIAL DEFICIENCY:</strong> That despite repeated requests and job cards, you have failed to resolve the defect or refund the amount of <strong>₹<span id="docUnlockedWithheld">${amt}</span>/-</strong> citing <span id="docUnlockedReasons">${rsn}</span>. This constitutes deficiency in service under Section 2(11) of CPA 2019.`,
      getDocUnlockedPara4: () => `<strong>4. PRODUCT LIABILITY VIOLATIONS:</strong> Under Sections 84 and 85 of the Consumer Protection Act, 2019, both the manufacturer and the dealership are jointly and severally liable for delivering defective goods and failure to honor warranty covenants.`,
      getDocUnlockedPara5: (d, amt) => `<strong>5. FINAL PEREMPTORY DEMAND:</strong> You are hereby called upon to immediately refund/compensate the sum of <strong>₹<span id="docUnlockedFinalTotal">${amt}</span>/-</strong> within <strong>FIFTEEN (15) DAYS</strong> of receipt of this notice, failing which:`,
      docLegalActionList: [
        'A formal consumer complaint will be filed online via e-Daakhil / e-Jagriti before the District Consumer Commission.',
        'A formal complaint will be submitted to the Central Consumer Protection Authority (CCPA) for misleading representations and unfair trade practice.',
        'All compensation for harassment, legal fees, and vehicle downtime shall be claimed at your joint and several expense.'
      ]
    },

    employment: {
      id: 'employment',
      label: 'Employment & Salary',
      claimantLabel: 'Employee Full Name (Claimant) *',
      claimantPlaceholder: 'e.g. Sneha Patel',
      opponentLabel: 'Employer Company / Organization Name *',
      opponentPlaceholder: 'e.g. Zenith Tech Solutions Pvt. Ltd.',
      addressLabel: 'Company Office / Workplace Address *',
      addressPlaceholder: 'e.g. Tower B, 4th Floor, Infocity, Gandhinagar, Gujarat - 382007',
      startDateLabel: 'Date of Joining Employment',
      breachDateLabel: 'Last Working Day (LWD) / Resignation Date *',
      depositPaidLabel: 'Gross Monthly CTC / Base Salary (₹) *',
      depositPaidPlaceholder: 'e.g. 85000',
      periodicAmountLabel: 'Monthly Agreed Salary (₹) *',
      periodicAmountPlaceholder: 'e.g. 85000',
      amountRefundedLabel: 'Amount Disbursed in Partial F&F (₹)',
      amountWithheldLabel: 'Total Unpaid Salary & F&F Balance Demanded (₹) *',
      amountWithheldPlaceholder: 'e.g. 170000',
      sampleClaimant: 'Sneha Patel',
      sampleOpponent: 'Zenith Tech Solutions Pvt. Ltd.',
      sampleAddress: 'Tower B, 4th Floor, Infocity, Gandhinagar, Gujarat - 382007',
      sampleDeposit: 85000,
      samplePeriodic: 85000,
      sampleWithheld: 170000,
      accommodationLabel: 'Employment Type *',
      accommodationOptions: [
        'Full-Time Corporate Employee',
        'Software / IT Consultant',
        'Sales Executive / Dealership Manager',
        'Manufacturing Plant Engineer',
        'Contractual Staff / Retainer'
      ],
      excusesLabel: 'Select All Employment Violations:',
      excuses: [
        { value: 'Unpaid Salary / Full & Final (F&F) Settlement Withheld Beyond 7 Days', text: 'Unpaid salary / Full & Final (F&F) settlement withheld beyond 7 days', checked: true },
        { value: 'Refusal to Issue Relieving Letter & Service Experience Certificate', text: 'Refusal to issue Relieving Letter & Service Certificate', checked: true },
        { value: 'Unlawful Deduction for Notice Period Despite Medical / Mutual Notice', text: 'Unlawful notice period pay deduction despite proper notice', checked: false },
        { value: 'Withholding Earned Leave Encashment and Bonus', text: 'Withholding earned leave encashment, gratuity, and performance bonus', checked: false }
      ],
      step3Headline: 'High Legal Standing Under Payment of Wages Act & Contract Act',
      step3Desc: 'Withholding an employee\'s earned salary or relieving certificate is an actionable violation of labor laws and Article 21/19 of the Constitution of India.',
      step3Clauses: [
        { strong: 'Payment of Wages Mandate:', text: 'Under state Shops & Establishments Acts, earned wages and F&F must be paid within 2 to 7 days of cessation of employment.' },
        { strong: 'Relieving Certificate is a Legal Right:', text: 'High Courts have repeatedly ruled that employers cannot hold an employee\'s career hostage by withholding relieving certificates.' },
        { strong: 'Criminal Breach of Trust (Sec 405 IPC):', text: 'Deducting PF or withholding wages earned by an employee amounts to criminal breach of trust under Section 405/406 IPC.' },
        { strong: '18% Interest on Delayed Wages:', text: 'Labor Authorities routinely award 18% interest on overdue wages and compensation for unlawful harassment.' }
      ],
      docSignRole: 'Aggrieved Employee & Claimant',
      noticeSubject: (amt) => `<strong>SUBJECT:</strong> STATUTORY LEGAL NOTICE UNDER PAYMENT OF WAGES ACT, 1936 AND INDIAN CONTRACT ACT, 1872 FOR IMMEDIATE DISBURSEMENT OF OVERDUE SALARY & F&F AMOUNTING TO <strong>₹${amt}/-</strong> AND ISSUANCE OF RELIEVING CERTIFICATE.`,
      getDocNoticePara1: (d, dep) => `<strong>1. EMPLOYMENT RELATIONSHIP:</strong> That my Client was employed with your organization operating from <span id="docBodyAddress">${d.propertyAddress}</span>, holding the position with agreed monthly compensation of <strong>₹<span id="docDepositPaid">${dep}</span>/-</strong>. My Client discharged all assigned duties with utmost diligence and integrity.`,
      getDocNoticePara2: (d, dep, vac) => `<strong>2. RESIGNATION & HANDOVER:</strong> That my Client formally tendered resignation, fulfilled notice obligations, and completed all knowledge-transfer formalities with Last Working Day on <span id="docVacateDate">${vac}</span>.`,
      getDocBlurredPara3: (d, amt, rsn) => `<strong>3. UNLAWFUL WITHHOLDING OF SALARY & DOCUMENTS:</strong> That despite handover, you have unlawfully withheld the sum of <strong>₹<span id="docBlurredWithheld">${amt}</span>/-</strong> and refused to issue the mandatory Relieving Letter citing <span id="docBlurredReasons">${rsn}</span>.`,
      getDocBlurredPara4: (d, amt) => `<strong>4. DEMAND FOR REMITTANCE & CERTIFICATE:</strong> My Client hereby demands that you disburse the balance of <strong>₹<span id="docBlurredTotal">${amt}</span>/-</strong> along with 18% statutory interest and release the official Relieving Letter within <strong>SEVEN (7) DAYS</strong> of receipt of this notice.`,
      getDocBlurredPara5: () => `<strong>5. NOTICE OF LABOR PROCEEDINGS:</strong> Take notice that should you fail to comply, my Client will lodge a formal complaint before the Labor Commissioner under the Payment of Wages Act and file a suit for damages for blocking career progression.`,
      getDocUnlockedPara3: (d, amt, rsn) => `<strong>3. UNLAWFUL WITHHOLDING & MATERIAL BREACH:</strong> That despite repeated follow-ups, you have unlawfully withheld <strong>₹<span id="docUnlockedWithheld">${amt}</span>/-</strong> under the pretext of <span id="docUnlockedReasons">${rsn}</span>. Withholding earned wages is a direct breach of statutory employment law.`,
      getDocUnlockedPara4: () => `<strong>4. CONSTITUTIONAL & LABOR VIOLATIONS:</strong> Withholding an employee's service certificate and relieving document violates fundamental rights under Article 19(1)(g) and constitutes unlawful restraint under Section 27 of the Indian Contract Act.`,
      getDocUnlockedPara5: (d, amt) => `<strong>5. FINAL PEREMPTORY DEMAND:</strong> You are hereby called upon to disburse the outstanding sum of <strong>₹<span id="docUnlockedFinalTotal">${amt}</span>/-</strong> and issue the Relieving Letter within <strong>SEVEN (7) DAYS</strong> of this notice, failing which:`,
      docLegalActionList: [
        'A formal application will be submitted before the jurisdictional Labor Commissioner and Payment of Wages Authority.',
        'A criminal complaint under Section 405/406 of the Indian Penal Code (Sec 316 BNS) will be initiated for dishonest misappropriation of wages.',
        'A civil suit for damages claiming ₹5,00,000/- for loss of subsequent job opportunities and mental agony will be instituted.'
      ]
    },

    cheque: {
      id: 'cheque',
      label: 'Cheque Bounce (Sec 138)',
      claimantLabel: 'Payee / Cheque Holder Name (Complainant) *',
      claimantPlaceholder: 'e.g. Ramesh Chandra Sharma',
      opponentLabel: 'Drawer / Cheque Issuer Name (Accused) *',
      opponentPlaceholder: 'e.g. Vikramaditya Singh',
      addressLabel: 'Drawer Residential / Business Address *',
      addressPlaceholder: 'e.g. 504, Surya Towers, Near Law Garden, Ellisbridge, Ahmedabad - 380006',
      startDateLabel: 'Date of Cheque Issuance',
      breachDateLabel: 'Date of Bank Cheque Return Memo *',
      depositPaidLabel: 'Total Cheque Face Value (₹) *',
      depositPaidPlaceholder: 'e.g. 250000',
      periodicAmountLabel: 'Cheque Number & Bank Name *',
      periodicAmountPlaceholder: 'e.g. 408912 (HDFC Bank)',
      amountRefundedLabel: 'Part-Payment Received So Far (₹)',
      amountWithheldLabel: 'Dishonoured Cheque Amount Demanded (₹) *',
      amountWithheldPlaceholder: 'e.g. 250000',
      sampleClaimant: 'Ramesh Chandra Sharma',
      sampleOpponent: 'Vikramaditya Singh',
      sampleAddress: '504, Surya Towers, Near Law Garden, Ellisbridge, Ahmedabad - 380006',
      sampleDeposit: 250000,
      samplePeriodic: 0,
      sampleWithheld: 250000,
      accommodationLabel: 'Cheque Nature of Debt *',
      accommodationOptions: [
        'Commercial Supply / Business Debt',
        'Dealership Margin / Caution Deposit Refund',
        'Personal Loan / Promissory Note Settlement',
        'Tenancy Caution Deposit Refund',
        'Sale Consideration for Vehicle / Property'
      ],
      excusesLabel: 'Select Bank Memo Dishonour Reason:',
      excuses: [
        { value: 'Funds Insufficient', text: 'Dishonoured due to "Funds Insufficient" in drawer account', checked: true },
        { value: 'Stop Payment by Drawer', text: 'Dishonoured due to "Stop Payment" instruction by drawer', checked: false },
        { value: 'Account Closed by Issuer', text: 'Dishonoured due to "Account Closed" by issuer', checked: false },
        { value: 'Signatures Differ / Irregularity', text: 'Dishonoured due to drawer signature irregularity', checked: false }
      ],
      step3Headline: 'Strict Statutory Standing Under Section 138 of Negotiable Instruments Act',
      step3Desc: 'Issuing a dishonoured cheque in discharge of a legally enforceable debt is a cognizable criminal offence punishable with up to 2 years imprisonment and double the cheque amount.',
      step3Clauses: [
        { strong: 'Strict Criminal Liability (Sec 138 NI Act):', text: 'Drawer faces up to 2 years rigorous imprisonment and fine up to twice the cheque amount upon trial conviction.' },
        { strong: 'Statutory 15-Day Demand Notice:', text: 'Serving this demand notice within 30 days of the return memo is the mandatory prerequisite before filing criminal proceedings.' },
        { strong: 'Presumption of Debt (Sec 139 NI Act):', text: 'The law presumes that the cheque was issued in discharge of a legally enforceable debt, placing the full burden of proof on the accused.' },
        { strong: 'Interim Compensation (Sec 143A NI Act):', text: 'The criminal court has statutory power to order the drawer to deposit up to 20% interim compensation to the complainant immediately upon summons.' }
      ],
      docSignRole: 'Payee / Holder in Due Course',
      noticeSubject: (amt) => `<strong>SUBJECT:</strong> STATUTORY DEMAND NOTICE UNDER SECTION 138 READ WITH SECTION 141/142 OF THE NEGOTIABLE INSTRUMENTS ACT, 1881 FOR PAYMENT OF DISHONOURED CHEQUE AMOUNT OF <strong>₹${amt}/-</strong> WITHIN 15 DAYS.`,
      getDocNoticePara1: (d, dep) => `<strong>1. ISSUANCE OF CHEQUE FOR LEGALLY ENFORCEABLE DEBT:</strong> That in discharge of a legally enforceable debt and commercial liability, you issued an account payee cheque of face value <strong>₹<span id="docDepositPaid">${dep}</span>/-</strong> drawn on your bank account in favor of my Client, with the express assurance that said cheque would be honored on presentation.`,
      getDocNoticePara2: (d, dep, vac) => `<strong>2. PRESENTATION & DISHONOUR MEMO:</strong> That my Client presented the said cheque for clearance through banking channels, but said cheque was returned unpaid and dishonoured by the bank vide official Return Memo dated <span id="docVacateDate">${vac}</span>.`,
      getDocBlurredPara3: (d, amt, rsn) => `<strong>3. STATUTORY NOTICE UNDER SECTION 138 NI ACT:</strong> That you have failed to pay the dishonoured sum of <strong>₹<span id="docBlurredWithheld">${amt}</span>/-</strong> citing <span id="docBlurredReasons">${rsn}</span>. Under Section 138 of the Negotiable Instruments Act, 1881, non-payment after notice constitutes an actionable criminal offence.`,
      getDocBlurredPara4: (d, amt) => `<strong>4. MANDATORY 15-DAY STATUTORY DEMAND:</strong> You are hereby called upon to pay the dishonoured cheque amount of <strong>₹<span id="docBlurredTotal">${amt}</span>/-</strong> to my Client within <strong>FIFTEEN (15) DAYS</strong> of the receipt of this statutory notice.`,
      getDocBlurredPara5: () => `<strong>5. NOTICE OF CRIMINAL PROSECUTION:</strong> Take notice that should you fail to remit payment within 15 days, my Client will initiate criminal prosecution against you under Section 138 of the Negotiable Instruments Act, 1881 before the Competent Judicial Magistrate.`,
      getDocUnlockedPara3: (d, amt, rsn) => `<strong>3. COGNIZABLE OFFENCE UNDER SECTION 138 NI ACT:</strong> That despite knowing your bank account status, you issued the cheque which was dishonoured with remark <span id="docUnlockedReasons">${rsn}</span>. Under Section 138 of the Negotiable Instruments Act, this act constitutes an offence punishable with imprisonment.`,
      getDocUnlockedPara4: () => `<strong>4. STATUTORY PRESUMPTIONS & PENALTIES:</strong> Under Section 139 of the Negotiable Instruments Act, there is an absolute statutory presumption that the cheque was issued in discharge of a legally enforceable debt. Furthermore, Section 143A empowers the court to grant up to 20% interim compensation immediately.`,
      getDocUnlockedPara5: (d, amt) => `<strong>5. FINAL STATUTORY 15-DAY DEMAND:</strong> You are hereby called upon to pay the full dishonoured amount of <strong>₹<span id="docUnlockedFinalTotal">${amt}</span>/-</strong> within <strong>FIFTEEN (15) DAYS</strong> of delivery of this notice, failing which:`,
      docLegalActionList: [
        'A Criminal Complaint under Section 138/142 of the Negotiable Instruments Act, 1881 will be registered before the Judicial Magistrate Court.',
        'An application under Section 143A of the NI Act will be pressed seeking immediate deposit of 20% interim compensation.',
        'Non-bailable warrants, police summons, and recovery of double the cheque amount will be sought at your sole criminal risk and expense.'
      ]
    },

    loan: {
      id: 'loan',
      label: 'Loan & Debt Recovery',
      claimantLabel: 'Lender / Creditor Name (Claimant) *',
      claimantPlaceholder: 'e.g. Harishbhai Patel',
      opponentLabel: 'Borrower / Defaulting Debtor Name *',
      opponentPlaceholder: 'e.g. Manilal Dave',
      addressLabel: 'Borrower Residential / Business Address *',
      addressPlaceholder: 'e.g. 14, Sharda Society, Paldi, Ahmedabad, Gujarat - 380007',
      startDateLabel: 'Date of Loan Disbursement',
      breachDateLabel: 'Agreed Repayment Due Date *',
      depositPaidLabel: 'Total Principal Loan Disbursed (₹) *',
      depositPaidPlaceholder: 'e.g. 500000',
      periodicAmountLabel: 'Agreed Monthly Interest Rate (%) or Amount (₹)',
      periodicAmountPlaceholder: 'e.g. 2% monthly',
      amountRefundedLabel: 'Amount Repaid So Far (₹)',
      amountWithheldLabel: 'Total Outstanding Principal + Interest Demanded (₹) *',
      amountWithheldPlaceholder: 'e.g. 560000',
      sampleClaimant: 'Harishbhai Patel',
      sampleOpponent: 'Manilal Dave',
      sampleAddress: '14, Sharda Society, Paldi, Ahmedabad, Gujarat - 380007',
      sampleDeposit: 500000,
      samplePeriodic: 0,
      sampleWithheld: 560000,
      accommodationLabel: 'Loan Instrument / Contract Type *',
      accommodationOptions: [
        'Promissory Note (Demand Promissory Note)',
        'Friendly / Personal Hand Loan Agreement',
        'Commercial Business Inter-Corporate Deposit',
        'Secured / Mortgage Loan Covenant'
      ],
      excusesLabel: 'Select Default Grounds Against Borrower:',
      excuses: [
        { value: 'Default on Agreed Due Date Despite Written Promissory Note', text: 'Default on agreed due date despite written promissory note', checked: true },
        { value: 'Failure to Pay Agreed Monthly Interest', text: 'Failure to pay agreed monthly interest', checked: true },
        { value: 'Evading Calls and Refusing Repayment Settlement', text: 'Evading calls, messages, and refusing repayment settlement', checked: false }
      ],
      step3Headline: 'Solid Case Under Negotiable Instruments Act & Summary Suit Order XXXVII',
      step3Desc: 'A promissory note or written debt acknowledgment gives rapid access to Order XXXVII summary decree where defendant has no automatic right of defense.',
      step3Clauses: [
        { strong: 'Summary Suit for Debt Recovery (Order XXXVII CPC):', text: 'Creditors can obtain rapid court judgment and attachment of debtor property without prolonged trial.' },
        { strong: 'Statutory Commercial Interest at 18%:', text: 'The court awards interest from the due date until full payment under Section 34 of the CPC.' },
        { strong: 'Cheating & Misappropriation (Sec 420 IPC / 318 BNS):', text: 'Borrowing money with fraudulent intent not to repay is actionable criminally for cheating.' }
      ],
      docSignRole: 'Aggrieved Creditor & Lender',
      noticeSubject: (amt) => `<strong>SUBJECT:</strong> FORMAL LEGAL DEMAND NOTICE FOR RECOVERY OF OUTSTANDING LOAN AND INTEREST OF <strong>₹${amt}/-</strong> UNDER WRITTEN DEBT COVENANT AND PROMISSORY NOTE.`,
      getDocNoticePara1: (d, dep) => `<strong>1. LOAN DISBURSEMENT:</strong> That my Client advanced a financial sum/loan of <strong>₹<span id="docDepositPaid">${dep}</span>/-</strong> to you upon your urgent financial request, supported by a formal promissory note and mutual agreement to repay with interest.`,
      getDocNoticePara2: (d, dep, vac) => `<strong>2. MATURITY & DEFAULT:</strong> That the agreed maturity date for repayment was <span id="docVacateDate">${vac}</span>. Despite the arrival and passing of said date, you defaulted on repayment obligations.`,
      getDocBlurredPara3: (d, amt, rsn) => `<strong>3. UNLAWFUL RETENTION OF FUNDS:</strong> That you have unlawfully withheld <strong>₹<span id="docBlurredWithheld">${amt}</span>/-</strong> under the pretext of <span id="docBlurredReasons">${rsn}</span>. Retaining borrowed funds after due date constitutes an actionable civil debt and breach of trust.`,
      getDocBlurredPara4: (d, amt) => `<strong>4. DEMAND FOR PAYMENT:</strong> My Client demands payment of the sum of <strong>₹<span id="docBlurredTotal">${amt}</span>/-</strong> along with 18% per annum interest within <strong>FIFTEEN (15) DAYS</strong> of receipt of this notice.`,
      getDocBlurredPara5: () => `<strong>5. NOTICE OF CIVIL & CRIMINAL ACTION:</strong> Take notice that should you fail to repay, my Client will file a Summary Suit under Order XXXVII CPC for attachment of your assets and a criminal complaint under Section 420 IPC.`,
      getDocUnlockedPara3: (d, amt, rsn) => `<strong>3. MATERIAL DEFAULT:</strong> That you have deliberately failed to repay <strong>₹<span id="docUnlockedWithheld">${amt}</span>/-</strong> under <span id="docUnlockedReasons">${rsn}</span>. This is an actionable debt under the Negotiable Instruments Act.`,
      getDocUnlockedPara4: () => `<strong>4. LEGAL RECOURSE:</strong> Under Order XXXVII of the CPC, you have no automatic leave to defend unless you deposit the disputed debt amount in court.`,
      getDocUnlockedPara5: (d, amt) => `<strong>5. FINAL DEMAND:</strong> You are hereby called upon to repay <strong>₹<span id="docUnlockedFinalTotal">${amt}</span>/-</strong> within <strong>FIFTEEN (15) DAYS</strong>, failing which:`,
      docLegalActionList: [
        'A Summary Suit under Order XXXVII of the CPC will be filed for immediate attachment of movable and immovable assets.',
        'A criminal complaint under Section 420/406 IPC (Cheating and Criminal Breach of Trust) will be registered with the police.',
        'All court fees and interest at 18% shall be recovered at your cost.'
      ]
    },

    builder: {
      id: 'builder',
      label: 'Builder & RERA Dispute',
      claimantLabel: 'Allottee / Home Buyer Full Name (Claimant) *',
      claimantPlaceholder: 'e.g. Deepak Joshi',
      opponentLabel: 'Builder / Real Estate Developer Name *',
      opponentPlaceholder: 'e.g. Skyline Real Estate Developers LLP',
      addressLabel: 'Project Name, Unit No. & Location *',
      addressPlaceholder: 'e.g. Flat 902, Skyline Green Heights, Shela, Ahmedabad - 380058',
      startDateLabel: 'Date of Booking / Allotment Agreement',
      breachDateLabel: 'Committed Possession Handover Date *',
      depositPaidLabel: 'Total Amount Paid to Builder (₹) *',
      depositPaidPlaceholder: 'e.g. 2500000',
      periodicAmountLabel: 'Agreed Delay Compensation per Month (₹, enter 0 if none)',
      periodicAmountPlaceholder: 'e.g. 0',
      amountRefundedLabel: 'Amount Refunded So Far (₹)',
      amountWithheldLabel: 'Total Refund Demanded or Delayed Interest (₹) *',
      amountWithheldPlaceholder: 'e.g. 750000',
      sampleClaimant: 'Deepak Joshi',
      sampleOpponent: 'Skyline Real Estate Developers LLP',
      sampleAddress: 'Flat 902, Skyline Green Heights, Shela, Ahmedabad - 380058',
      sampleDeposit: 2500000,
      samplePeriodic: 0,
      sampleWithheld: 750000,
      accommodationLabel: 'Real Estate Unit Type *',
      accommodationOptions: [
        'Residential Apartment / Flat (RERA Registered)',
        'Commercial Showroom / Office Space',
        'Plot in Plotted Development',
        'Independent Villa / Penthouse'
      ],
      excusesLabel: 'Select All Developer Defaults Under RERA:',
      excuses: [
        { value: 'Possession Delayed Beyond Committed Agreement Date', text: 'Possession delayed beyond committed agreement date without valid extension', checked: true },
        { value: 'Failure to Pay Monthly Statutory Delay Compensation Under RERA', text: 'Failure to pay monthly statutory delay compensation under RERA', checked: true },
        { value: 'Unauthorized Alterations to Project Layout Without Allottee Consent', text: 'Unauthorized alterations to project layout without 2/3rd allottee consent', checked: false },
        { value: 'Refusal to Refund Booking Advance Upon Project Abandonment', text: 'Refusal to refund booking advance upon project cancellation/abandonment', checked: false }
      ],
      step3Headline: 'Formidable Case Under Section 18 of RERA Act 2016',
      step3Desc: 'Section 18 of the Real Estate (Regulation and Development) Act 2016 gives allottees the absolute right to demand full refund with SBI MCLR + 2% interest or monthly delay compensation.',
      step3Clauses: [
        { strong: 'Absolute Right of Exit Under Sec 18 RERA:', text: 'If developer fails to deliver possession on committed date, allottee is entitled to 100% refund with interest.' },
        { strong: 'Mandatory SBI MCLR + 2% Interest:', text: 'RERA mandates interest at SBI Highest Marginal Cost of Funds Based Lending Rate + 2% from each payment date.' },
        { strong: 'Consumer Court Remedy (Pioneer Urban Apex Ruling):', text: 'Supreme Court held that allottees have concurrent right to approach Consumer Commission for deficiency in service.' }
      ],
      docSignRole: 'Aggrieved Allottee & Buyer',
      noticeSubject: (amt) => `<strong>SUBJECT:</strong> STATUTORY LEGAL NOTICE UNDER SECTION 18 OF REAL ESTATE (REGULATION AND DEVELOPMENT) ACT, 2016 FOR IMMEDIATE POSSESSION DELAY COMPENSATION / REFUND OF <strong>₹${amt}/-</strong> WITH STATUTORY RERA INTEREST.`,
      getDocNoticePara1: (d, dep) => `<strong>1. ALLOTMENT TRANSACTION:</strong> That my Client is the bona fide allottee of the unit situated at <span id="docBodyAddress">${d.propertyAddress}</span>, having deposited a substantial advance sum of <strong>₹<span id="docDepositPaid">${dep}</span>/-</strong> under the registered Agreement for Sale.`,
      getDocNoticePara2: (d, dep, vac) => `<strong>2. POSSESSION DEADLINE & DEFAULT:</strong> That you contractually committed to deliver peaceful physical possession with Occupancy Certificate on or before <span id="docVacateDate">${vac}</span>. You have failed to deliver possession.`,
      getDocBlurredPara3: (d, amt, rsn) => `<strong>3. STATUTORY DEFAULT UNDER RERA:</strong> That you have failed to pay delayed possession interest / refund of <strong>₹<span id="docBlurredWithheld">${amt}</span>/-</strong> under <span id="docBlurredReasons">${rsn}</span>. Under Section 18 of RERA 2016, delayed possession creates an absolute statutory liability.`,
      getDocBlurredPara4: (d, amt) => `<strong>4. DEMAND FOR REMITTANCE:</strong> My Client hereby calls upon you to pay the delayed compensation/refund of <strong>₹<span id="docBlurredTotal">${amt}</span>/-</strong> with RERA interest within <strong>FIFTEEN (15) DAYS</strong> of receipt of this notice.`,
      getDocBlurredPara5: () => `<strong>5. NOTICE OF RERA LITIGATION:</strong> Take notice that should you fail to pay, my Client will lodge an official complaint before the Real Estate Regulatory Authority (RERA) and Consumer Commission.`,
      getDocUnlockedPara3: (d, amt, rsn) => `<strong>3. VIOLATION OF SECTION 18 RERA:</strong> That you have defaulted on compensation of <strong>₹<span id="docUnlockedWithheld">${amt}</span>/-</strong> under <span id="docUnlockedReasons">${rsn}</span>. This is an actionable breach under RERA Act 2016.`,
      getDocUnlockedPara4: () => `<strong>4. STATUTORY COMPENSATION MANDATE:</strong> Under Section 18 of the RERA Act, 2016, the promoter is obligated to pay interest for every month of delay at SBI MCLR + 2% until possession.`,
      getDocUnlockedPara5: (d, amt) => `<strong>5. FINAL DEMAND:</strong> You are hereby called upon to remit <strong>₹<span id="docUnlockedFinalTotal">${amt}</span>/-</strong> within <strong>FIFTEEN (15) DAYS</strong>, failing which:`,
      docLegalActionList: [
        'A formal complaint under Section 31 of RERA Act will be registered before the RERA Authority seeking refund and penalty.',
        'A complaint will be filed with the State Consumer Commission claiming compensation for rental expenditure and mental distress.',
        'Litigation fees of ₹35,000 shall be recovered solely at your expense.'
      ]
    },

    freelance: {
      id: 'freelance',
      label: 'Freelancer & Agency Fees',
      claimantLabel: 'Freelancer / Agency Full Name (Claimant) *',
      claimantPlaceholder: 'e.g. Ananya Sen (PixelCraft Creative Agency)',
      opponentLabel: 'Client / Company / Brand Name *',
      opponentPlaceholder: 'e.g. Horizon Digital Media Ltd.',
      addressLabel: 'Client Office / Business Address *',
      addressPlaceholder: 'e.g. 7th Floor, Cyber Hub, DLF Phase 2, Gurugram, Haryana - 122002',
      startDateLabel: 'Contract / Project Commencement Date',
      breachDateLabel: 'Project Handover / Final Invoice Due Date *',
      depositPaidLabel: 'Total Project / Retainer Contract Value (₹) *',
      depositPaidPlaceholder: 'e.g. 200000',
      periodicAmountLabel: 'Agreed Monthly Retainer / Milestone Rate (₹) *',
      periodicAmountPlaceholder: 'e.g. 50000',
      amountRefundedLabel: 'Milestone Advance Paid So Far (₹)',
      amountWithheldLabel: 'Unpaid Milestone / Project Balance Demanded (₹) *',
      amountWithheldPlaceholder: 'e.g. 110000',
      sampleClaimant: 'Ananya Sen (PixelCraft Creative Agency)',
      sampleOpponent: 'Horizon Digital Media Ltd.',
      sampleAddress: '7th Floor, Cyber Hub, DLF Phase 2, Gurugram, Haryana - 122002',
      sampleDeposit: 200000,
      samplePeriodic: 50000,
      sampleWithheld: 110000,
      accommodationLabel: 'Service / Deliverable Category *',
      accommodationOptions: [
        'Software / Web / Mobile App Development',
        'UI/UX Design & Creative Branding',
        'Digital Marketing & Performance Ads',
        'Content Creation, Video & Copywriting',
        'Legal, Accounting & Corporate Advisory'
      ],
      excusesLabel: 'Select All Client Non-Payment Grounds:',
      excuses: [
        { value: 'Deliverables Approved and Published but Final Invoice Unpaid', text: 'Deliverables approved and published but final invoice unpaid', checked: true },
        { value: 'Sudden Unilateral Scope Creep / Unreasonable Revision Demands', text: 'Sudden unilateral scope creep / unreasonable revision demands', checked: true },
        { value: 'Client Ghosting / Refusing to Respond to Billing Emails', text: 'Client ghosting / refusing to respond to billing emails and calls', checked: false }
      ],
      step3Headline: 'Strong Civil & Copyright Claim Under Contract Act & Copyright Act',
      step3Desc: 'Using creative or technical deliverables without clearing agreed fees constitutes copyright infringement under Section 51 of the Copyright Act and breach of contract.',
      step3Clauses: [
        { strong: 'Copyright Infringement Warning:', text: 'Intellectual property rights remain strictly with the creator until full invoice settlement; continued usage is an actionable infringement.' },
        { strong: 'Quantum Meruit Principle (Sec 70 Contract Act):', text: 'A party that accepts and derives commercial benefit from services is legally bound to pay reasonable compensation.' },
        { strong: 'Commercial Summary Claim:', text: 'Written email approvals and invoice timestamps provide direct proof of debt for summary recovery.' }
      ],
      docSignRole: 'Independent Professional / Agency Founder',
      noticeSubject: (amt) => `<strong>SUBJECT:</strong> LEGAL DEMAND NOTICE UNDER SECTION 70 & 73 OF THE INDIAN CONTRACT ACT, 1872 AND COPYRIGHT ACT, 1957 FOR PAYMENT OF OVERDUE PROFESSIONAL FEES OF <strong>₹${amt}/-</strong>.`,
      getDocNoticePara1: (d, dep) => `<strong>1. PROFESSIONAL ENGAGEMENT:</strong> That my Client is an independent professional/agency engaged by you under a valid contract for creative/technical services of value <strong>₹<span id="docDepositPaid">${dep}</span>/-</strong>.`,
      getDocNoticePara2: (d, dep, vac) => `<strong>2. PERFORMANCE & DELIVERY:</strong> That my Client successfully delivered all agreed milestones and final work files on or before <span id="docVacateDate">${vac}</span>, which were accepted and used by you.`,
      getDocBlurredPara3: (d, amt, rsn) => `<strong>3. UNLAWFUL WITHHOLDING OF FEES:</strong> That you have unlawfully withheld <strong>₹<span id="docBlurredWithheld">${amt}</span>/-</strong> under the pretext of <span id="docBlurredReasons">${rsn}</span>. Retaining work output without clearing professional fees constitutes breach of contract and copyright infringement.`,
      getDocBlurredPara4: (d, amt) => `<strong>4. DEMAND FOR REMITTANCE:</strong> My Client calls upon you to clear the invoice of <strong>₹<span id="docBlurredTotal">${amt}</span>/-</strong> with 18% interest within <strong>SEVEN (7) DAYS</strong> of receipt of this notice.`,
      getDocBlurredPara5: () => `<strong>5. NOTICE OF LEGAL ACTION & IP INJUNCTION:</strong> Take notice that should you fail to pay, my Client will initiate civil recovery proceedings and seek an immediate injunction restraining you from using the deliverables.`,
      getDocUnlockedPara3: (d, amt, rsn) => `<strong>3. UNLAWFUL RETENTION:</strong> That you have unlawfully withheld <strong>₹<span id="docUnlockedWithheld">${amt}</span>/-</strong> under <span id="docUnlockedReasons">${rsn}</span>. Under Section 70 of the Contract Act, you are liable for quantum meruit compensation.`,
      getDocUnlockedPara4: () => `<strong>4. INTELLECTUAL PROPERTY VIOLATIONS:</strong> Under the Copyright Act, 1957, copyright transfer is contingent upon full payment. Commercial use of unpaid deliverables constitutes copyright infringement.`,
      getDocUnlockedPara5: (d, amt) => `<strong>5. FINAL PEREMPTORY DEMAND:</strong> You are hereby called upon to pay <strong>₹<span id="docUnlockedFinalTotal">${amt}</span>/-</strong> within <strong>SEVEN (7) DAYS</strong>, failing which:`,
      docLegalActionList: [
        'A formal copyright infringement notice and takedown request will be issued across digital platforms and hosting servers.',
        'A commercial recovery suit will be filed for invoice value + ₹1,00,000/- intellectual property damages.',
        'All litigation costs shall be recovered from you directly.'
      ]
    },

    custom: {
      id: 'custom',
      label: 'Any Field / Custom Legal Notice',
      claimantLabel: 'Your Full Name / Entity Name (Claimant) *',
      claimantPlaceholder: 'e.g. Ramesh Chandra & Sons / Enterprise',
      opponentLabel: 'Opponent Party / Organization / Counterparty *',
      opponentPlaceholder: 'e.g. Bharat Trading Corporation / Opponent',
      addressLabel: 'Disputed Premises / Showroom / Dealership / Transaction Address *',
      addressPlaceholder: 'e.g. Commercial Complex, Station Road, Ahmedabad, Gujarat - 380001',
      startDateLabel: 'Agreement / Transaction Commencement Date',
      breachDateLabel: 'Date of Dispute / Breach / Non-Payment *',
      depositPaidLabel: 'Total Contract / Deal / Advance Paid (₹) *',
      depositPaidPlaceholder: 'e.g. 500000',
      periodicAmountLabel: 'Monthly / Periodic Agreed Dues (₹, enter 0 if none)',
      periodicAmountPlaceholder: 'e.g. 0',
      amountRefundedLabel: 'Amount Paid / Reconciled So Far (₹)',
      amountWithheldLabel: 'Total Disputed Amount Demanded Back (₹) *',
      amountWithheldPlaceholder: 'e.g. 300000',
      sampleClaimant: 'Ramesh Chandra (M/s Commercial Enterprises)',
      sampleOpponent: 'Bharat Trading Corporation',
      sampleAddress: 'Commercial Complex, Station Road, Ahmedabad, Gujarat - 380001',
      sampleDeposit: 500000,
      samplePeriodic: 0,
      sampleWithheld: 300000,
      accommodationLabel: 'Dispute / Industry Category *',
      accommodationOptions: [
        'Dealership & Wholesale Distributorship Dispute',
        'Commercial Supply & Vendor Contract Dispute',
        'Consumer Product & Service Defect Dispute',
        'Civil Debt, Advance & Security Withholding',
        'Custom Contractual Breach & Unjust Enrichment'
      ],
      excusesLabel: 'Select / Specify Grounds of Dispute Against Opponent:',
      excuses: [
        { value: 'Unlawful Withholding of Security Deposit, Margin or Earnest Money', text: 'Unlawful withholding of security deposit, margin or earnest money', checked: true },
        { value: 'Material Breach of Express Agreement Terms and Promises', text: 'Material breach of express agreement terms and promises', checked: true },
        { value: 'Refusal to Reconcile Accounts or Provide Certified Justifications', text: 'Refusal to reconcile accounts or provide certified justifications', checked: true },
        { value: 'Unjust Enrichment and Causing Severe Financial Loss', text: 'Unjust enrichment and causing severe financial disruption', checked: false }
      ],
      step3Headline: 'Solid Civil & Commercial Case Under Indian Contract Act & Specific Relief Act',
      step3Desc: 'Any arbitrary retention of funds or breach of express covenants creates immediate cause of action for full recovery with 18% commercial interest.',
      step3Clauses: [
        { strong: 'Breach of Contract (Sec 73 Contract Act):', text: 'The party who suffers by breach is entitled to receive compensation for any loss or damage naturally arising.' },
        { strong: 'Prohibition of Unreasonable Penalties (Sec 74):', text: 'Opponents cannot forfeit funds or impose unilateral penalties without certified proof of actual damages.' },
        { strong: 'Commercial Courts Rapid Redressal:', text: 'Disputes of commercial nature are fast-tracked under the Commercial Courts Act, 2015.' },
        { strong: '18% Accrued Commercial Interest:', text: 'Claimant is legally entitled to interest from the date of wrongful withholding until full realization.' }
      ],
      docSignRole: 'Authorized Claimant / Aggrieved Party',
      noticeSubject: (amt) => `<strong>SUBJECT:</strong> FORMAL LEGAL DEMAND NOTICE UNDER SECTION 73 OF THE INDIAN CONTRACT ACT, 1872 FOR IMMEDIATE REFUND AND RECOVERY OF DISPUTED SUM OF <strong>₹${amt}/-</strong> ALONG WITH 18% ACCRUED INTEREST.`,
      getDocNoticePara1: (d, dep) => `<strong>1. TRANSACTION BACKGROUND:</strong> That my Client entered into a lawful contractual and commercial arrangement with you situated at/relating to <span id="docBodyAddress">${d.propertyAddress}</span>. Pursuant to said agreement, my Client paid/transferred a financial sum of <strong>₹<span id="docDepositPaid">${dep}</span>/-</strong>, with express covenants governing refund and performance.`,
      getDocNoticePara2: (d, dep, vac) => `<strong>2. PERFORMANCE & TIMELINE:</strong> That my Client fulfilled all covenants in good faith. However, on or about <span id="docVacateDate">${vac}</span>, you committed material breach of contractual covenants.`,
      getDocBlurredPara3: (d, amt, rsn) => `<strong>3. UNLAWFUL WITHHOLDING & DAMAGE:</strong> That you have unlawfully withheld / failed to remit the sum of <strong>₹<span id="docBlurredWithheld">${amt}</span>/-</strong> under the pretext of <span id="docBlurredReasons">${rsn}</span>. It is a settled position of law that caution money, margins, and agreed sums cannot be arbitrarily retained.`,
      getDocBlurredPara4: (d, amt) => `<strong>4. DEMAND FOR REMITTANCE:</strong> My Client hereby calls upon you to pay the withheld sum of <strong>₹<span id="docBlurredTotal">${amt}</span>/-</strong> along with statutory interest at the rate of 18% per annum directly within <strong>FIFTEEN (15) DAYS</strong> of receipt of this notice.`,
      getDocBlurredPara5: () => `<strong>5. NOTICE OF CIVIL & CRIMINAL ACTION:</strong> Take notice that should you fail to comply, my Client has given peremptory instructions to initiate appropriate legal proceedings before the Competent Civil Court, Commercial Court, or Consumer Commission for recovery of the principal, interest, and costs.`,
      getDocUnlockedPara3: (d, amt, rsn) => `<strong>3. UNLAWFUL WITHHOLDING:</strong> That despite repeated written demands, you have unlawfully retained <strong>₹<span id="docUnlockedWithheld">${amt}</span>/-</strong> citing <span id="docUnlockedReasons">${rsn}</span>. Under Section 73 of the Contract Act, this constitutes an actionable civil wrong.`,
      getDocUnlockedPara4: () => `<strong>4. STATUTORY VIOLATIONS:</strong> Your refusal to reconcile accounts and return funds confirms that said retention is punitive and constitutes an unfair practice and unjust enrichment under settled judicial precedents.`,
      getDocUnlockedPara5: (d, amt) => `<strong>5. FINAL PEREMPTORY DEMAND:</strong> You are hereby called upon to immediately refund/remit <strong>₹<span id="docUnlockedFinalTotal">${amt}</span>/-</strong> along with accrued interest at 18% per annum within <strong>FIFTEEN (15) DAYS</strong> of receipt of this notice, failing which:`,
      docLegalActionList: [
        'An official Commercial Recovery Suit / Civil Suit will be filed before the Competent Court seeking full recovery + damages.',
        'A formal complaint shall be tendered to the regulatory authorities for deceptive trade practices and breach of trust.',
        'All litigation costs, advocate fees (₹35,000), and interest shall be claimed solely at your risk and expense.'
      ]
    }
  };

  // ==========================================================================
  // Dynamic Notice Type Switcher Engine (Supports All Fields & Dealerships)
  // ==========================================================================
  function applyNoticeType(typeKey, silent = false) {
    const n = NOTICE_TYPES_DB[typeKey] || NOTICE_TYPES_DB.dealership;
    state.noticeType = n.id;
    state.formData.noticeType = n.id;

    // 1. Update Notice Type Chips in Step 1
    const chips = document.querySelectorAll('#noticeTypeChips .notice-chip-btn');
    chips.forEach(chip => {
      if (chip.getAttribute('data-type') === n.id) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });

    // 2. Sync hidden select
    const noticeSelect = document.getElementById('noticeTypeSelect');
    if (noticeSelect) noticeSelect.value = n.id;

    // 3. Custom Field Visibility
    const customContainer = document.getElementById('customFieldContainer');
    if (customContainer) {
      customContainer.style.display = (n.id === 'custom' || n.id === 'dealership') ? 'block' : 'none';
    }

    // 4. Update Step 1 Labels and Placeholders
    const labelClaimant = document.getElementById('labelTenantName');
    const inputClaimant = document.getElementById('tenantName');
    if (labelClaimant) labelClaimant.textContent = n.claimantLabel;
    if (inputClaimant) inputClaimant.placeholder = n.claimantPlaceholder;

    const labelOpponent = document.getElementById('labelLandlordName');
    const inputOpponent = document.getElementById('landlordName');
    if (labelOpponent) labelOpponent.textContent = n.opponentLabel;
    if (inputOpponent) inputOpponent.placeholder = n.opponentPlaceholder;

    const labelAddress = document.getElementById('labelPropertyAddress');
    const inputAddress = document.getElementById('propertyAddress');
    if (labelAddress) labelAddress.textContent = n.addressLabel;
    if (inputAddress) inputAddress.placeholder = n.addressPlaceholder;

    const labelStart = document.getElementById('labelTenancyStartDate');
    if (labelStart) labelStart.textContent = n.startDateLabel;

    const labelBreach = document.getElementById('labelVacateDate');
    if (labelBreach) labelBreach.textContent = n.breachDateLabel;

    const labelAccom = document.getElementById('labelAccommodationType');
    const selectAccom = document.getElementById('accommodationType');
    if (labelAccom) labelAccom.textContent = n.accommodationLabel;
    if (selectAccom && n.accommodationOptions) {
      selectAccom.innerHTML = '';
      n.accommodationOptions.forEach((optText, i) => {
        const opt = document.createElement('option');
        opt.value = optText;
        opt.textContent = optText;
        if (i === 0) opt.selected = true;
        selectAccom.appendChild(opt);
      });
    }

    // 5. Update Step 2 Financial Labels & Placeholders
    const labelDeposit = document.getElementById('labelDepositPaid');
    const inputDeposit = document.getElementById('depositPaid');
    if (labelDeposit) labelDeposit.textContent = n.depositPaidLabel;
    if (inputDeposit) inputDeposit.placeholder = n.depositPaidPlaceholder;

    const labelMonthly = document.getElementById('labelMonthlyRent');
    const inputMonthly = document.getElementById('monthlyRent');
    if (labelMonthly) labelMonthly.textContent = n.periodicAmountLabel;
    if (inputMonthly) inputMonthly.placeholder = n.periodicAmountPlaceholder;

    const labelRefunded = document.getElementById('labelAmountRefunded');
    if (labelRefunded) labelRefunded.textContent = n.amountRefundedLabel;

    const labelWithheld = document.getElementById('labelAmountWithheld');
    const inputWithheld = document.getElementById('amountWithheld');
    if (labelWithheld) labelWithheld.textContent = n.amountWithheldLabel;
    if (inputWithheld) inputWithheld.placeholder = n.amountWithheldPlaceholder;

    // 6. Update Step 2 Excuses Checkbox Grid
    const labelExcuses = document.getElementById('labelLandlordExcuses');
    if (labelExcuses) labelExcuses.textContent = n.excusesLabel;

    const checkboxGrid = document.getElementById('excusesCheckboxGrid');
    if (checkboxGrid && n.excuses) {
      checkboxGrid.innerHTML = '';
      n.excuses.forEach(ex => {
        const lbl = document.createElement('label');
        lbl.className = 'custom-checkbox';
        lbl.innerHTML = `
          <input type="checkbox" name="landlordExcuse" value="${ex.value}" ${ex.checked ? 'checked' : ''}>
          <span class="checkmark"></span>
          ${ex.text}
        `;
        checkboxGrid.appendChild(lbl);
      });
    }

    // 7. If switching notice type interactively, update sample values
    if (!silent) {
      if (inputClaimant) inputClaimant.value = n.sampleClaimant;
      if (inputOpponent) inputOpponent.value = n.sampleOpponent;
      if (inputAddress) inputAddress.value = n.sampleAddress;
      if (inputDeposit) inputDeposit.value = n.sampleDeposit;
      if (inputMonthly) inputMonthly.value = n.samplePeriodic;
      if (inputWithheld) inputWithheld.value = n.sampleWithheld;
      state.formData.tenantName = n.sampleClaimant;
      state.formData.landlordName = n.sampleOpponent;
      state.formData.propertyAddress = n.sampleAddress;
      state.formData.depositPaid = n.sampleDeposit;
      state.formData.monthlyRent = n.samplePeriodic;
      state.formData.amountWithheld = n.sampleWithheld;
      state.formData.excuses = n.excuses.filter(e => e.checked).map(e => e.value);
      showToast(`✓ Selected Notice Type: ${n.label}`, 'info');
    }

    // 8. Update Step 3 Legal Assessment Headings
    const step3HeadlineEl = document.getElementById('step3ScoreHeadline');
    const step3DescEl = document.getElementById('step3ScoreDesc');
    const step3GridEl = document.getElementById('step3ClausesGrid');
    if (step3HeadlineEl && n.step3Headline) step3HeadlineEl.textContent = n.step3Headline;
    if (step3DescEl && n.step3Desc) step3DescEl.textContent = n.step3Desc;
    if (step3GridEl && n.step3Clauses) {
      step3GridEl.innerHTML = '';
      n.step3Clauses.forEach(cl => {
        const card = document.createElement('div');
        card.className = 'strength-clause-card';
        card.innerHTML = `<i class="fa-solid fa-circle-check text-success"></i> <div><strong>${cl.strong}</strong> <span>${cl.text}</span></div>`;
        step3GridEl.appendChild(card);
      });
    }
  }

  // ==========================================================================
  // Multi-Country Jurisdictions, Laws, Pricing & What's Next Engine
  // ==========================================================================
  const COUNTRIES_DB = {
    IN: {
      code: 'IN',
      name: 'India',
      flag: '🇮🇳',
      currency: 'INR',
      currencySymbol: '₹',
      starterPrice: 99,
      starterPriceFormatted: '₹99',
      starterStrike: '₹1,999',
      proPrice: 499,
      proPriceFormatted: '₹499',
      proStrike: '₹20,000',
      heroBadge: 'Model Tenancy Act & Consumer Protection Act 2019 Compliant',
      heroSubtitle: 'Landlords in Bangalore, Pune, Mumbai & Delhi routinely withhold ₹20,000 to ₹80,000 for fake "painting" or "deep cleaning." Generate a formal, legally intimidating <strong>Pre-Litigation Demand Notice</strong> with official penal clauses to recover 100% of your money.',
      trustLaws: { title: 'Central Tenancy Acts', sub: 'Sec 106/108 TPA 1882 & Sec 316 BNS' },
      trustCourt: { title: 'e-Jagriti Court Admissible', sub: 'Party-in-Person Legal Standing' },
      trustStats: { title: '4.9 / 5 Rating (1,420+ Reviews)', sub: '₹24.8L+ Recovered Across Metros' },
      defaultCity: 'Bengaluru, Karnataka',
      cityLabel: 'Rental City / District *',
      cityPlaceholder: 'Search Indian city (e.g. Bengaluru, Pune, Mumbai)...',
      phonePlaceholder: '+91 9876543210',
      sampleDeposit: 100000,
      sampleRent: 25000,
      sampleWithheld: 45000,
      step3JurisdictionSub: 'Based on Indian Tenancy jurisprudence and consumer protection acts.',
      step3ScoreHeadline: 'High Probability of Full Settlement Without Litigation',
      step3ScoreDesc: 'The landlord\'s deductions directly violate established statutory protections under Section 73 of the Indian Contract Act and Section 108 of the Transfer of Property Act.',
      step3Clauses: [
        { strong: 'Illegal Painting / Wear & Tear Forfeiture:', text: 'Landlord is legally prohibited from charging painting costs for ordinary weathering or tenancy tenure over 11 months.' },
        { strong: '30-Day Mandatory Handover Limit Exceeded:', text: 'Under Model Tenancy guidelines and standard lease covenants, withholding deposit beyond 30 days incurs penal liability.' },
        { strong: 'Unjustified Enrichment (Sec 72 Contract Act):', text: 'Retaining tenant funds without verifiable itemized tax invoices constitutes unlawful retention and breach of trust.' },
        { strong: '18% Compound Interest Claim:', text: 'Landlord is made liable for 18% per annum commercial interest from the date of handover until full realization.' }
      ],
      plan1Name: '7-Day Pre-Litigation Legal Notice',
      plan1Desc: 'Formal advocate-grade demand notice with strict 7-day penal deadline and High Court precedents.',
      plan1Features: [
        '<strong>2-Page Court-Admissible</strong> Legal Notice PDF',
        'Sec 108 Transfer of Property Act Grounds',
        'Sec 73 Contract Act 18% Interest Claim',
        '1-Click WhatsApp Format for Landlord',
        'Speed Post RPAD Dispatch Template'
      ],
      plan2Name: 'Notice + Consumer Court & Police Kit',
      plan2Desc: 'Full legal arsenal if landlord ignores notice: ready-to-file court petition, affidavit, and police complaint.',
      plan2Features: [
        '<strong>Includes Everything in ₹99 Legal Notice</strong>',
        '<strong>e-Jagriti Consumer Court Formal Petition</strong> (Form 1)',
        '<strong>Notary Verification Affidavit</strong> ready format',
        '<strong>Police Criminal Complaint</strong> (Sec 405 IPC / 316 BNS)',
        '<strong>₹0 Court Fee Online Filing Manual</strong>',
        '<strong>₹1,00,000 Punitive Damages Claim</strong> for agony'
      ],
      noticeBadge: 'FORMAL LEGAL NOTICE',
      transmission: 'Speed Post A.D. & WhatsApp Messenger',
      docSubject: (amt) => `<strong>SUBJECT:</strong> FORMAL LEGAL DEMAND NOTICE UNDER SECTION 73 OF THE INDIAN CONTRACT ACT, 1872 AND THE CONSUMER PROTECTION ACT, 2019 FOR IMMEDIATE REFUND OF UNLAWFULLY WITHHELD SECURITY DEPOSIT OF <strong>₹${amt}/-</strong> WITH STATUTORY ACCRUED INTEREST.`,
      penaltyBadgeText: '18% Statutory Compound Interest',
      howItWorksOverall: 'DepositShield generates an advocate-grade Pre-Litigation Legal Demand Notice citing Section 108(m) of the Transfer of Property Act and Section 73 of the Contract Act. Serving this via Speed Post RPAD and WhatsApp triggers formal legal liability, backed by Ministry of Consumer Affairs (NCH 1915) escalation and e-Jagriti District Consumer Commission petitions.',
      howItHelpsOverall: 'Over 85% of landlords settle within 7 days because fighting in consumer court costs them far more in legal fees, travel, and mandatory 18% compound interest plus ₹1,00,000 mental agony damages. In addition, claims under ₹5 Lakhs carry ₹0 court fees for tenants.',
      lawsPillars: [
        { icon: 'fa-scale-balanced', title: 'Sec 108(m) Transfer of Property Act', text: 'Tenants are statutorily exempt from routine repainting, weathering, and normal wear and tear after handover.' },
        { icon: 'fa-percent', title: 'Sec 73 Indian Contract Act (18% Interest)', text: 'Landlords are legally liable for 18% per annum commercial interest from the handover date on withheld funds.' },
        { icon: 'fa-building-columns', title: 'Consumer Protection Act 2019', text: 'Arbitrary deductions constitute an Unfair Trade Practice with ₹0 court fees for disputes under ₹5 Lakhs on e-Jagriti.' },
        { icon: 'fa-shield-halved', title: 'Sec 405 IPC / Sec 316 BNS (Criminal Breach)', text: 'Caution deposits are held in fiduciary custody; withholding without registered GST bills is a criminal offense.' }
      ],
      processRoadmap: [
        { badge: 'STAGE 1', title: 'Notice Delivered', desc: 'Dispatched via WhatsApp & Speed Post RPAD. Postal receipt serves as conclusive statutory proof of service.' },
        { badge: 'STAGE 2', title: '72h Settlement Window', desc: 'Landlord receives follow-up warning citing 18% penal interest. Over 85% refund during this window.' },
        { badge: 'STAGE 3', title: 'Peremptory Deadline', desc: '7 days expire. Landlord enters willful legal default, forfeiting all right to dispute deductions.' },
        { badge: 'STAGE 4', title: 'Free Government Filing', desc: 'Free NCH 1915 docket & online e-Jagriti consumer court summons delivered directly to landlord doorstep.' }
      ],
      timelineTitle: 'What To Do If The 7-Day Timeline Is Done?',
      timelineSubtitle: 'Once you serve your formal notice, your landlord is subject to a strict 7-day deadline. If they refuse to refund or the timeline finishes, execute this 4-step enforcement protocol.',
      stepper: [
        { day: 'DAY 1', title: 'Notice Delivered', desc: 'Send via WhatsApp & Speed Post RPAD. Retain postal receipt as conclusive statutory proof of service.' },
        { day: 'DAYS 2–4', title: 'Settlement Window', desc: '85% of landlords settle here once they realize court litigation carries 18% penal interest. Send the 72h reminder.' },
        { day: 'DAY 7', title: 'Peremptory Deadline', desc: 'Statutory window closes at 11:59 PM. Landlord is now officially in willful default under Section 73 Indian Contract Act.' },
        { day: 'DAY 8+', title: 'Enforcement Active', desc: 'Notice period is over. Proceed with the 4 legal remedies below. Disputes under ₹5 Lakh carry ₹0 court filing fees!' }
      ],
      alertHeadline: '7 Days Expired Without Refund? Your Landlord Is Now In Willful Default!',
      alertBody: 'Under Section 73 of the Indian Contract Act, 1872 and the Consumer Protection Act, 2019, your landlord is liable for the full deposit, statutory accrued interest at 18% p.a., and punitive damages for mental agony.',
      actionCards: [
        {
          badge: 'STEP 1 • 100% FREE • 5 MINS',
          icon: 'blue',
          iconClass: 'fa-phone-volume',
          title: 'National Consumer Helpline (NCH 1915)',
          desc: 'Call toll-free 1915 or submit online on consumerhelpline.gov.in. A Ministry of Consumer Affairs officer registers an official grievance docket and directly calls the landlord on phone.',
          howItWorks: 'A Ministry of Consumer Affairs officer registers a statutory dispute docket and calls your landlord directly, demanding proof of deductions and ordering immediate refund.',
          howItHelps: '100% free and takes only 5 minutes. Direct phone calls from a central government ministry create immediate psychological pressure and settle 70%+ of individual disputes.',
          btnText: '<i class="fa-solid fa-phone"></i> Call 1915 / Open NCH',
          btnLink: 'https://consumerhelpline.gov.in'
        },
        {
          badge: 'STEP 2 • ZERO COURT FEE (<₹5L)',
          icon: 'gold',
          iconClass: 'fa-scale-balanced',
          title: 'e-Jagriti Consumer Court Summons',
          desc: 'File your pre-drafted Formal Consumer Court Petition (Form 1) on e-jagriti.gov.in. No advocate needed (Complainant-in-Person). The Commission issues official legal summons to the landlord\'s doorstep.',
          howItWorks: 'Submit the ready-to-file Form 1 Petition online via e-jagriti.gov.in. Under the Consumer Protection Act 2019, claims under ₹5 Lakhs carry ₹0 court fees and require no lawyer.',
          howItHelps: 'The District Commission serves formal legal summons to your landlord\'s doorstep. Landlords risk paying your full deposit + 18% compound interest + up to ₹1,00,000 for mental agony.',
          btnText: '<i class="fa-solid fa-scale-balanced"></i> Open e-Jagriti Portal',
          btnLink: 'https://e-jagriti.gov.in/'
        },
        {
          badge: 'STEP 3 • CRIMINAL BREACH OF TRUST',
          icon: 'red',
          iconClass: 'fa-building-shield',
          title: 'Police Complaint (Sec 405 IPC / 316 BNS)',
          desc: 'A caution deposit is entrusted in fiduciary capacity. Arbitrary deduction without GST bills constitutes Criminal Breach of Trust (Section 405/406 IPC / 316 BNS). Submit our pre-drafted letter to the local SHO.',
          howItWorks: 'Security deposits are held in fiduciary trust (\'Amanat\'). Arbitrary retention without statutory cause constitutes Criminal Breach of Trust under Sec 405/406 IPC (Sec 316 BNS). You file our pre-drafted complaint with the local police station.',
          howItHelps: 'Police summons to the station cause intense social embarrassment. No property owner wants a criminal complaint docket on their record over a tenancy deposit dispute.',
          btnText: '<i class="fa-solid fa-shield-halved"></i> Get Police Complaint Format',
          btnLink: '#'
        },
        {
          badge: 'STEP 4 • ANTI-FRAUD PRESSURE',
          icon: 'purple',
          iconClass: 'fa-receipt',
          title: 'Demand Original GST Invoices & Audit',
          desc: 'Under tax law, painting/repair deductions require verified GST invoices with contractor GSTIN. Fake handwritten estimates carry severe penalties under Section 420 IPC and liability for reporting to GST Intelligence.',
          howItWorks: 'Serve our formal audit requisition requiring the landlord to provide authentic tax invoices with verifiable contractor GSTIN numbers within 48 hours.',
          howItHelps: '95% of landlords fabricate maintenance costs without GST bills. Threatening an inquiry with the Directorate General of GST Intelligence (DGGI) forces an instant climb-down.',
          btnText: '<i class="fa-solid fa-copy"></i> Copy GST Demand Script',
          btnLink: '#'
        }
      ],
      checkerData: {
        painting: {
          label: 'Painting Charges (Deducting 1 month rent or ₹15,000 - ₹30,000)',
          status: 'VERDICT: 100% UNLAWFUL DEDUCTION',
          explanation: 'Under Section 108 of the Transfer of Property Act, 1882 and multiple High Court rulings, normal weathering, fading paint, and ordinary wear & tear are the sole maintenance obligation of the property owner. Forcing tenants to pay for fresh repainting without willful vandalism constitutes an illegal forfeiture of caution deposit.',
          statutes: 'Sec 73 Indian Contract Act, Sec 108 Transfer of Property Act, Model Tenancy Act (Sec 13).'
        },
        cleaning: {
          label: 'Deep Cleaning Fee (Deducting ₹5,000 - ₹15,000)',
          status: 'VERDICT: UNLAWFUL WITHOUT ACTUAL GST INVOICES',
          explanation: 'Deducting arbitrary "deep cleaning" amounts without verifiable third-party GST vendor tax invoices constitutes unfair trade practices under Section 2(47) of the Consumer Protection Act, 2019.',
          statutes: 'Consumer Protection Act 2019 (Sec 2(47)), Doctrine of Restitution (Sec 65 Contract Act).'
        },
        wear_tear: {
          label: 'Normal Wear & Tear (Minor wall marks, floor scuffs)',
          status: 'VERDICT: EXPLICITLY ILLEGAL UNDER LAW',
          explanation: 'Indian contract law firmly establishes the "Doctrine of Reasonable Wear and Tear". Landlords are strictly barred from passing ordinary property aging, minor wall scuffs, or natural wear onto the tenant.',
          statutes: 'Transfer of Property Act 1882 (Sec 108(m)), State Rent Control Acts.'
        },
        delay: {
          label: '"No Funds Right Now" / Delaying Beyond 30 Days',
          status: 'VERDICT: BREACH OF MANDATORY STATUTORY TIMELINE',
          explanation: 'Under the Model Tenancy Act and standard rental agreement clauses, caution deposits must be refunded within 30 days of key handover. Any delay beyond 30 days attracts 12% to 18% statutory interest liability.',
          statutes: 'Model Tenancy Act (Sec 13), Sec 73 Indian Contract Act (Interest liability).'
        },
        ghosting: {
          label: 'Ghosting / Not Answering WhatsApp or Calls',
          status: 'VERDICT: CRIMINAL BREACH OF TRUST (SEC 405 IPC/BNS)',
          explanation: 'Holding caution deposit funds as a custodian and ignoring legitimate refund demands amounts to dishonest misappropriation of entrusted movable property, actionable under Section 405/406 IPC.',
          statutes: 'Sec 405/406 Indian Penal Code / Bharatiya Nyaya Sanhita, Consumer Protection Act.'
        }
      },
      cityGroups: [
        { label: 'MAJOR METROS', cities: ['Bengaluru, Karnataka', 'Pune, Maharashtra', 'Mumbai, Maharashtra', 'Delhi-NCR (Gurgaon/Noida)', 'Hyderabad, Telangana', 'Chennai, Tamil Nadu', 'Kolkata, West Bengal'] },
        { label: 'GUJARAT & WEST', cities: ['Ahmedabad, Gujarat', 'Gandhinagar, Gujarat', 'Surat, Gujarat', 'Vadodara, Gujarat', 'Rajkot, Gujarat', 'Nagpur, Maharashtra', 'Nashik, Maharashtra', 'Goa (Panaji/Margao)'] },
        { label: 'NORTH & CENTRAL', cities: ['Jaipur, Rajasthan', 'Chandigarh, Punjab/Haryana', 'Lucknow, Uttar Pradesh', 'Kanpur, Uttar Pradesh', 'Indore, Madhya Pradesh', 'Bhopal, Madhya Pradesh', 'Dehradun, Uttarakhand'] },
        { label: 'SOUTH & EAST', cities: ['Kochi (Cochin), Kerala', 'Thiruvananthapuram, Kerala', 'Coimbatore, Tamil Nadu', 'Visakhapatnam, AP', 'Vijayawada, AP', 'Mysuru, Karnataka', 'Patna, Bihar', 'Bhubaneswar, Odisha', 'Guwahati, Assam'] }
      ]
    },

    US: {
      code: 'US',
      name: 'United States',
      flag: '🇺🇸',
      currency: 'USD',
      currencySymbol: '$',
      starterPrice: 4.99,
      starterPriceFormatted: '$4.99',
      starterStrike: '$49.00',
      proPrice: 14.99,
      proPriceFormatted: '$14.99',
      proStrike: '$199.00',
      heroBadge: 'State Security Deposit Statutes & Treble Damages Compliant',
      heroSubtitle: 'Landlords in California, New York, Texas & Florida routinely withhold $1,200 to $4,500 for normal wear and tear or repainting. Generate an attorney-grade Small Claims Demand Letter citing bad-faith statutory treble damages (up to 3x your deposit)!',
      trustLaws: { title: 'State Civil Tenancy Codes', sub: 'Cal. Civ. Code § 1950.5 • NY GOL § 7-108 • Tex. Prop. § 92' },
      trustCourt: { title: 'Small Claims Court Ready', sub: 'Up to 3x Treble Statutory Damages Recovery' },
      trustStats: { title: '4.9 / 5 Rating (2,800+ US Renters)', sub: '$480,000+ Recovered from Landlords' },
      defaultCity: 'New York, NY',
      cityLabel: 'Rental City, State & Zip Code *',
      cityPlaceholder: 'e.g. Los Angeles, CA / Austin, TX / Brooklyn, NY...',
      phonePlaceholder: '+1 (555) 019-2834',
      sampleDeposit: 2500,
      sampleRent: 2000,
      sampleWithheld: 1800,
      step3JurisdictionSub: 'Based on US State Security Deposit Statutes & Bad-Faith Retention Jurisprudence.',
      step3ScoreHeadline: 'High Probability of Treble Damages Settlement',
      step3ScoreDesc: 'Your landlord\'s deductions directly violate mandatory state laws (such as Cal. Civ. Code § 1950.5, NY GOL § 7-108, or Tex. Prop. Code § 92.109). Bad faith withholding entitles tenants to up to 3x statutory damages.',
      step3Clauses: [
        { strong: 'Ordinary Wear & Tear Exemption:', text: 'Under all 50 state laws, landlords cannot deduct for routine paint fading, minor carpet wear, or small nail holes.' },
        { strong: '14–30 Day Statutory Return Window Violated:', text: 'State statutes require full refund or itemized accounting within 14 to 30 days. Missing this deadline forfeits all deduction rights.' },
        { strong: 'Mandatory Itemized Receipts Missing:', text: 'Landlords are legally required to furnish written repair invoices and receipts for any deduction exceeding $125.' },
        { strong: 'Treble Damages Penalty (2x to 3x Deposit):', text: 'Bad-faith retention entitles the tenant to recover twice or three times the withheld deposit in Small Claims Court.' }
      ],
      plan1Name: '10-Day Pre-Litigation Demand Letter',
      plan1Desc: 'Formal attorney-grade demand letter with strict 10-day deadline, state statute citations, and treble damages warning.',
      plan1Features: [
        '<strong>2-Page Small Claims Admissible</strong> Demand Letter PDF',
        'State-Specific Civil Code Statutory Citations',
        'Treble Damages Claim Warning (Up to 3x Deposit)',
        '1-Click Email & Text Format for Landlord',
        'USPS Certified Mail Return Receipt Formatted'
      ],
      plan2Name: 'Notice + Small Claims Action Suite & AG Kit',
      plan2Desc: 'Complete litigation package: ready-to-file Small Claims Complaint, evidence declaration, and State AG complaint.',
      plan2Features: [
        '<strong>Includes Everything in $4.99 Starter Demand Letter</strong>',
        '<strong>Small Claims Court Formal Complaint</strong> (Ready-to-File Form)',
        '<strong>Sworn Evidentiary Declaration</strong> with photo exhibits guide',
        '<strong>State Attorney General Consumer Complaint</strong> draft',
        '<strong>$0 Lawyer Small Claims Courtroom Script</strong>',
        '<strong>Full Treble Damages Recovery Calculation</strong> (Up to $10,000)'
      ],
      noticeBadge: 'PRE-LITIGATION DEMAND LETTER',
      transmission: 'USPS Certified Mail with Return Receipt & Email',
      docSubject: (amt) => `<strong>SUBJECT:</strong> FORMAL DEMAND FOR IMMEDIATE RETURN OF SECURITY DEPOSIT WITH STATUTORY TREBLE DAMAGES WARNING UNDER STATE TENANCY CODE FOR WITHHELD AMOUNT OF <strong>$${amt}.00</strong>`,
      penaltyBadgeText: 'Up to 3x Statutory Treble Damages',
      howItWorksOverall: 'In the US, landlord security deposit practices are strictly governed by state civil property codes. DepositShield drafts a formal pre-litigation demand letter detailing the 14-30 day statutory deadline and citing statutory bad-faith treble damages clauses. If the landlord fails to remit payment or provide itemized invoices, our kit prepares your Small Claims complaint (for up to $10,000–$12,500) where no attorneys are allowed.',
      howItHelpsOverall: 'Small claims judges strictly enforce tenant protections. If a landlord arbitrarily withheld your deposit, they legally forfeit ALL rights to retain funds and can be ordered to pay 2x to 3x the deposit amount as punitive damages, plus your court filing fee. Landlords settle 88%+ of claims to avoid statutory treble judgments.',
      lawsPillars: [
        { icon: 'fa-scale-balanced', title: 'State Civil Tenancy Codes (CA § 1950.5 / NY GOL § 7-108 / TX § 92.109)', text: 'State laws mandate 14–30 day strict return windows. Missing this deadline legally forfeits all right to deductions.' },
        { icon: 'fa-paint-roller', title: 'Statutory Normal Wear & Tear Exemption', text: 'All 50 states prohibit deducting for routine paint fading, minor picture nail holes, and natural carpet wear.' },
        { icon: 'fa-triangle-exclamation', title: 'Statutory Treble Damages (2x to 3x Deposit)', text: 'Bad-faith withholding entitles tenants in Small Claims Court to recover double or triple the deposit value plus costs.' },
        { icon: 'fa-gavel', title: 'Small Claims Court Party-In-Person Standing', text: 'Claims up to $10,000–$12,500 are decided in 30 minutes without expensive legal representation.' }
      ],
      processRoadmap: [
        { badge: 'STAGE 1', title: 'Demand Delivered', desc: 'Served via USPS Certified Mail with Return Receipt & Email. Certified tracking proves legal delivery.' },
        { badge: 'STAGE 2', title: '5-Day Settlement Window', desc: 'Landlord consults property managers and reviews statutory citations; over 88% settle to avoid treble damages.' },
        { badge: 'STAGE 3', title: '10-Day Statutory Deadline', desc: 'Cure period expires. Landlord enters bad-faith breach and legally forfeits all deduction rights.' },
        { badge: 'STAGE 4', title: 'Small Claims Filing', desc: 'Submit pre-drafted complaint form at local county courthouse; judge awards deposit refund + 2x/3x damages.' }
      ],
      timelineTitle: 'What To Do If The 10-Day Demand Window Expires?',
      timelineSubtitle: 'Once you deliver this formal demand letter via Certified Mail or Email, your landlord is subject to a strict 10-day statutory window. If they refuse to refund, execute this 4-step US enforcement protocol.',
      stepper: [
        { day: 'DAY 1', title: 'Demand Delivered', desc: 'Send via USPS Certified Mail with Return Receipt & Email. Keep tracking proof as conclusive evidence in Small Claims Court.' },
        { day: 'DAYS 2–5', title: 'Settlement Window', desc: 'Over 88% of US landlords settle here once they see statutory citations and realize bad-faith retention risks a 3x treble damages judgment.' },
        { day: 'DAY 10', title: 'Statutory Deadline Closes', desc: 'Landlord is now in formal bad-faith breach. They legally forfeit all deduction rights and owe statutory interest.' },
        { day: 'DAY 11+', title: 'File in Small Claims Court', desc: 'Demand window is over. File your pre-drafted Small Claims petition. No attorneys allowed; low $30–$75 filing fee recoverable from landlord!' }
      ],
      alertHeadline: '10 Days Expired Without Full Refund? Your Landlord Is Now Liable For Treble Damages!',
      alertBody: 'Under State Property Statutes (e.g. California Civil Code § 1950.5(l), NY Housing Stability Act, or Texas Property Code § 92.109), bad-faith retention entitles you to sue for your entire deposit plus twice or three times that amount as statutory damages, plus court costs.',
      actionCards: [
        {
          badge: 'STEP 1 • NO LAWYER NEEDED • $30-$75 FEE',
          icon: 'gold',
          iconClass: 'fa-scale-balanced',
          title: 'File in Local Small Claims Court',
          desc: 'Submit your pre-drafted Small Claims Complaint to the local county courthouse or online e-filing portal. In most states (CA, NY, TX, FL), claims up to $10,000–$12,500 are decided in 30 minutes without lawyers.',
          howItWorks: 'Submit your pre-drafted Small Claims Complaint form to the local county courthouse or online e-filing portal. Hearings are scheduled in 3–6 weeks with no attorneys allowed.',
          howItHelps: 'Your $30–$75 filing fee is awarded back to you. Judges review move-out receipts; if the landlord failed to provide itemized contractor receipts in time, judges award 100% refund plus up to 3x treble damages.',
          btnText: '<i class="fa-solid fa-gavel"></i> Open Small Claims Guide',
          btnLink: 'https://www.usa.gov/small-claims'
        },
        {
          badge: 'STEP 2 • 100% FREE • STATE REGULATOR',
          icon: 'blue',
          iconClass: 'fa-building-columns',
          title: 'State Attorney General Consumer Bureau',
          desc: 'File an online consumer fraud complaint with your State Attorney General\'s Consumer Protection Division. State regulators contact corporate landlords directly, often prompting immediate resolution.',
          howItWorks: 'File an online complaint with your State Attorney General\'s Consumer Protection Bureau detailing unfair and deceptive security deposit withholding.',
          howItHelps: '100% free of charge. Corporate management firms and private landlords prioritize inquiries from the State AG to avoid pattern-of-practice investigations and state enforcement fines.',
          btnText: '<i class="fa-solid fa-landmark"></i> State AG Complaint Portal',
          btnLink: 'https://www.consumerfinance.gov/ask-cfpb/'
        },
        {
          badge: 'STEP 3 • OFFICIAL DISPATCH',
          icon: 'purple',
          iconClass: 'fa-envelope-open-text',
          title: 'USPS Certified Mail Return Receipt',
          desc: 'Send a signed physical copy via USPS Certified Mail with Return Receipt Requested. The USPS tracking number and signed green card prove delivery beyond reasonable doubt before the judge.',
          howItWorks: 'Send a physical copy via USPS Certified Mail with Return Receipt (PS Form 3811). The post office records delivery date and obtains the landlord\'s physical signature.',
          howItHelps: 'Establishes incontrovertible proof of statutory legal notice in court, depriving the landlord of any defense that they did not receive your demand.',
          btnText: '<i class="fa-solid fa-truck"></i> USPS Certified Tracking',
          btnLink: 'https://tools.usps.com/go/TrackConfirmAction'
        },
        {
          badge: 'STEP 4 • MUNICIPAL RENTAL LICENSE',
          icon: 'red',
          iconClass: 'fa-shield-halved',
          title: 'City Rental Housing Inspection Board',
          desc: 'Report the property owner to your local City Code Enforcement & Housing Department. Operating rental units with illegal withholding or unpermitted repair charges can jeopardize their certificate of occupancy.',
          howItWorks: 'File a complaint with your local municipal Housing Inspection Department or Rent Stabilization Board regarding illegal deposit practices and unpermitted maintenance.',
          howItHelps: 'Landlords are legally required to maintain valid city rental registrations. Regulatory scrutiny can jeopardize their operating permits and certificate of occupancy.',
          btnText: '<i class="fa-solid fa-city"></i> Housing Board Protocol',
          btnLink: '#'
        }
      ],
      checkerData: {
        painting: {
          label: 'Painting & Wall Scuffs (Deducting $500 - $2,500 for repainting)',
          status: 'VERDICT: 100% UNLAWFUL UNDER STATE CIVIL CODES',
          explanation: 'Under California Civil Code § 1950.5, New York GOL § 7-108, and almost all US state laws, repainting due to normal weathering, sun fading, or tenancy longer than 2 years is strictly the landlord\'s overhead cost. Deducting for routine paint is bad-faith withholding.',
          statutes: 'Cal. Civ. Code § 1950.5(b)(e), NY Housing Stability Act, Tex. Prop. Code § 92.104.'
        },
        cleaning: {
          label: 'Deep Cleaning Fees ($200 - $800 deep cleaning bill)',
          status: 'VERDICT: UNLAWFUL UNLESS PREMISES LEFT SUB-STANDARD',
          explanation: 'Tenants are only required to leave the unit in "broom-clean" condition (the same level of cleanliness as when they moved in). Charging $300–$700 for deep steam cleaning without verifiable pre-existing condition photos is an invalid deduction.',
          statutes: 'Uniform Residential Landlord and Tenant Act (URLTA), State Small Claims Precedents.'
        },
        wear_tear: {
          label: 'Ordinary Wear & Tear (Nail holes, carpet traffic, floor marks)',
          status: 'VERDICT: STRICTLY PROTECTED STATUTORY EXEMPTION',
          explanation: 'All 50 US states legally exempt tenants from liability for "ordinary wear and tear." Small nail holes from hanging pictures, minor doorframe scuffs, and carpet traffic patterns cannot legally be billed to tenants.',
          statutes: 'Restatement (Second) of Property § 12.2, State Landlord-Tenant Codes.'
        },
        delay: {
          label: 'Delaying Beyond 14–30 Day Statutory Window',
          status: 'VERDICT: STATUTORY DEADLINE BREACH (FORFEITS ALL DEDUCTIONS)',
          explanation: 'Most states mandate deposit returns within strict statutory windows (14 days in NY, 21 days in CA, 30 days in TX/FL). If the landlord misses the deadline, they legally forfeit ALL rights to keep any portion of your deposit.',
          statutes: 'California Civil Code § 1950.5(g), NY GOL § 7-108, Washington RCW 59.18.280.'
        },
        bad_faith: {
          label: 'Bad Faith Retention / Refusing to Provide Receipts',
          status: 'VERDICT: ACTIONABLE FOR 2X–3X TREBLE DAMAGES',
          explanation: 'When a landlord arbitrarily withholds funds or ignores legitimate demands, judges classify the retention as "bad faith." In California, this adds up to $600 plus 2x the deposit amount; in Texas and New York, it awards 3x the deposit plus $100 penalty.',
          statutes: 'Cal. Civ. Code § 1950.5(l), Tex. Prop. Code § 92.109, Mass. Gen. Laws ch. 186 § 15B.'
        }
      },
      cityGroups: [
        { label: 'CALIFORNIA', cities: ['Los Angeles, CA', 'San Francisco, CA', 'San Diego, CA', 'San Jose, CA', 'Oakland, CA', 'Sacramento, CA', 'Irvine, CA'] },
        { label: 'NEW YORK & NORTHEAST', cities: ['New York (Manhattan), NY', 'Brooklyn, NY', 'Queens, NY', 'Boston, MA', 'Philadelphia, PA', 'Jersey City, NJ', 'Washington, DC'] },
        { label: 'TEXAS & SOUTH', cities: ['Austin, TX', 'Houston, TX', 'Dallas, TX', 'San Antonio, TX', 'Miami, FL', 'Orlando, FL', 'Atlanta, GA', 'Nashville, TN'] },
        { label: 'MIDWEST & WEST', cities: ['Chicago, IL', 'Seattle, WA', 'Denver, CO', 'Phoenix, AZ', 'Las Vegas, NV', 'Portland, OR', 'Minneapolis, MN'] }
      ]
    },

    GB: {
      code: 'GB',
      name: 'United Kingdom',
      flag: '🇬🇧',
      currency: 'GBP',
      currencySymbol: '£',
      starterPrice: 3.99,
      starterPriceFormatted: '£3.99',
      starterStrike: '£39.00',
      proPrice: 11.99,
      proPriceFormatted: '£11.99',
      proStrike: '£149.00',
      heroBadge: 'Housing Act 2004 & Tenancy Deposit Scheme (TDS) Compliant',
      heroSubtitle: 'UK landlords & letting agents routinely deduct £400 to £1,500 for end-of-tenancy repainting or cleaning. Generate a formal Letter Before Action (LBA) citing statutory protection and up to 3x deposit compensation!',
      trustLaws: { title: 'Housing Act 2004', sub: 'Sections 213–214 & Tenant Fees Act 2019' },
      trustCourt: { title: 'County Court Admissible', sub: '1x to 3x Statutory Penalty for Unlawful Withholding' },
      trustStats: { title: '4.9 / 5 Rating (1,850+ UK Tenants)', sub: '£340,000+ Recovered from Landlords' },
      defaultCity: 'London, Greater London',
      cityLabel: 'Town, Borough & Postcode *',
      cityPlaceholder: 'e.g. London, Manchester, Birmingham, Edinburgh...',
      phonePlaceholder: '+44 7911 123456',
      sampleDeposit: 1500,
      sampleRent: 1200,
      sampleWithheld: 850,
      step3JurisdictionSub: 'Based on Housing Act 2004, Tenant Fees Act 2019, and TDS/DPS Adjudication Standards.',
      step3ScoreHeadline: 'High Probability of Deposit Scheme Ruling in Your Favor',
      step3ScoreDesc: 'Under the Housing Act 2004, landlords cannot use deposits for "betterment" (charging new for old) and must protect funds in an authorized scheme within 30 days or face mandatory court penalties of 1x to 3x the deposit.',
      step3Clauses: [
        { strong: 'Strict Rule Against Betterment:', text: 'Under UK law, landlords cannot charge new replacements for old items. They must account for age, quality, and reasonable lifespan.' },
        { strong: '10-Day Statutory Refund Rule:', text: 'Once agreed or requested, landlords must return undisputed deposit amounts within 10 days under scheme rules.' },
        { strong: 'Tenant Fees Act 2019 Protection:', text: 'Mandatory professional cleaning clauses are completely illegal and unenforceable under the Tenant Fees Act 2019.' },
        { strong: '1x to 3x Statutory Compensation:', text: 'Failure to properly protect the deposit or provide prescribed information triggers mandatory court penalties of up to 3x the deposit.' }
      ],
      plan1Name: 'Letter Before Action (LBA)',
      plan1Desc: 'Official formal Letter Before Action conforming to the UK Pre-Action Protocol for Debt Claims.',
      plan1Features: [
        '<strong>Pre-Action Protocol Compliant</strong> Letter Before Action PDF',
        'Housing Act 2004 (Sec 213–214) Statutory Citations',
        '1x to 3x Deposit Compensation Warning',
        '1-Click Email Format for Letting Agent / Landlord',
        'Royal Mail Signed For Postal Header'
      ],
      plan2Name: 'LBA + TDS Dispute & County Court Kit',
      plan2Desc: 'Complete UK recovery suite: TDS adjudication evidence bundle, Form N1 County Court Claim, and Trading Standards complaint.',
      plan2Features: [
        '<strong>Includes Everything in £3.99 Letter Before Action</strong>',
        '<strong>County Court Form N1 (Part 8 Claim)</strong> ready-to-file template',
        '<strong>TDS / DPS Dispute Evidence Submission Guide</strong>',
        '<strong>Betterment & Fair Wear Calculation Sheet</strong>',
        '<strong>Tenant Fees Act 2019 Breach Complaint</strong>',
        '<strong>Up to 3x Statutory Penalty Claim Form</strong>'
      ],
      noticeBadge: 'LETTER BEFORE ACTION (LBA)',
      transmission: 'Royal Mail Signed For & Email',
      docSubject: (amt) => `<strong>SUBJECT:</strong> FORMAL LETTER BEFORE ACTION (LBA) - DEMAND FOR IMMEDIATE RETURN OF TENANCY DEPOSIT UNDER HOUSING ACT 2004 FOR WITHHELD SUM OF <strong>£${amt}.00</strong>`,
      penaltyBadgeText: '1x to 3x Statutory Compensation Award',
      howItWorksOverall: 'In the UK, tenancy deposits must be protected in a government-authorized scheme (DPS, TDS, or MyDeposits). DepositShield drafts a formal Letter Before Action (LBA) strictly compliant with the Civil Procedure Rules (CPR) Pre-Action Protocol for Debt Claims, warning the letting agent or landlord of statutory adjudication and County Court proceedings under Section 214 of the Housing Act 2004.',
      howItHelpsOverall: 'Under the Tenant Fees Act 2019 and TDS betterment rules, landlords are legally barred from charging new for old or enforcing mandatory professional cleaning fees. If the landlord failed to properly protect your deposit or ignores your LBA, County Courts are statutorily MANDATED to award you between 1 and 3 times the deposit amount in compensation.',
      lawsPillars: [
        { icon: 'fa-scale-balanced', title: 'Housing Act 2004 (Sections 213–214)', text: 'Requires deposit protection within 30 days. Failure to comply incurs mandatory County Court penalties of 1x to 3x the deposit.' },
        { icon: 'fa-ban', title: 'Tenant Fees Act 2019 Prohibited Payments', text: 'Mandatory professional cleaning clauses and unauthorized fees are strictly illegal, carrying council fines up to £5,000.' },
        { icon: 'fa-hand-holding-dollar', title: 'Strict Legal Prohibition on Betterment', text: 'Landlords cannot replace old items with new at tenant expense; fair wear, tear, and item lifespan must be deducted.' },
        { icon: 'fa-gavel', title: 'CPR Pre-Action Protocol for Debt Claims', text: 'Formal 10-day Letter Before Action gives high-court standing for immediate County Court Money Claims (MCOL).' }
      ],
      processRoadmap: [
        { badge: 'STAGE 1', title: 'Letter Before Action Served', desc: 'Dispatched via Email & Royal Mail Signed For with formal CPR Part 6 delivery certificate.' },
        { badge: 'STAGE 2', title: 'Agency Review Window', desc: 'Letting agents review dispute evidence; 91% settle to avoid submitting hundreds of pages to TDS.' },
        { badge: 'STAGE 3', title: '10-Day Pre-Action Deadline', desc: 'Protocol window closes. Landlord is in statutory breach of custodial deposit obligations.' },
        { badge: 'STAGE 4', title: 'Free TDS / Court Track', desc: 'Submit free online dispute to TDS/DPS or file Form N1 in County Court for deposit + 3x compensation.' }
      ],
      timelineTitle: 'What To Do If The 10-Day LBA Window Closes?',
      timelineSubtitle: 'Once you issue this formal Letter Before Action under the UK Pre-Action Protocol, execute this 4-step dispute resolution protocol.',
      stepper: [
        { day: 'DAY 1', title: 'Letter Before Action Served', desc: 'Deliver via Email and Royal Mail Signed For. The delivery signature constitutes formal legal service under CPR Part 6.' },
        { day: 'DAYS 2–5', title: 'Adjudication Review', desc: '91% of UK letting agents settle here rather than submit hundreds of pages of proof to DPS/TDS dispute adjudication.' },
        { day: 'DAY 10', title: '10-Day Statutory Deadline', desc: 'The Pre-Action Protocol notice period expires. Landlord is in breach of statutory custodial deposit obligations.' },
        { day: 'DAY 11+', title: 'Trigger TDS or County Court', desc: 'Free online TDS/DPS adjudication or file Form N1 in County Court (Small Claims Track) for deposit + 3x compensation.' }
      ],
      alertHeadline: '10 Days Expired Without Refund? Landlord Is Liable For Up To 3x Penalty!',
      alertBody: 'Under Sections 213 and 214 of the Housing Act 2004, if a landlord or letting agent unlawfully withholds your deposit or failed to properly protect it, the County Court MUST order them to pay you between 1 and 3 times the deposit amount.',
      actionCards: [
        {
          badge: 'STEP 1 • 100% FREE ADJUDICATION',
          icon: 'blue',
          iconClass: 'fa-scale-balanced',
          title: 'Tenancy Deposit Scheme (TDS / DPS)',
          desc: 'Log in to your deposit portal on depositprotection.com, tenancydepositscheme.com, or mydeposits.co.uk and raise a formal dispute. Independent adjudicators rule on evidence at zero cost.',
          howItWorks: 'Log in to your scheme portal (DPS, TDS, or MyDeposits) and raise an official dispute. An independent adjudicator reviews move-in and check-out inventory evidence at zero cost.',
          howItHelps: '100% free with zero court fees. The burden of proof is entirely on the landlord. Adjudicators strictly enforce fair wear and tear rules, dismissing 85%+ of arbitrary redecoration and cleaning charges.',
          btnText: '<i class="fa-solid fa-folder-open"></i> Open TDS / DPS Portal',
          btnLink: 'https://www.tenancydepositscheme.com/'
        },
        {
          badge: 'STEP 2 • UP TO 3X COMPENSATION',
          icon: 'gold',
          iconClass: 'fa-gavel',
          title: 'County Court Small Claims (Form N1 / MCOL)',
          desc: 'Issue a claim online using Money Claim Online (MCOL) or County Court Form N1. Demand full repayment plus 1x to 3x statutory compensation under Section 214 of the Housing Act 2004.',
          howItWorks: 'Submit County Court Form N1 or file online via Money Claim Online (MCOL). You claim the deposit principal plus statutory penalties under Section 214 of the Housing Act 2004.',
          howItHelps: 'If the landlord failed to protect the deposit within 30 days or provide prescribed information, the judge is legally REQUIRED to award 1x to 3x the deposit amount as compensation, plus your court fees.',
          btnText: '<i class="fa-solid fa-gavel"></i> Money Claims Online',
          btnLink: 'https://www.moneyclaims.service.gov.uk/'
        },
        {
          badge: 'STEP 3 • FREE LEGAL GUIDANCE',
          icon: 'purple',
          iconClass: 'fa-handshake-angle',
          title: 'Citizens Advice & Shelter UK',
          desc: 'Connect with a certified housing advisor at Citizens Advice or Shelter UK for free confirmation of your case evidence and legal notice service procedures.',
          howItWorks: 'Call Citizens Advice consumer service (0808 223 1133) or consult Shelter UK\'s tenancy helpline for verification of your check-in inventory and notice timeline.',
          howItHelps: 'Provides free, certified legal backing and confirms your statutory entitlement to a full refund before tribunal or court escalation.',
          btnText: '<i class="fa-solid fa-users"></i> Shelter UK Guide',
          btnLink: 'https://england.shelter.org.uk/'
        },
        {
          badge: 'STEP 4 • LOCAL AUTHORITY ENFORCEMENT',
          icon: 'red',
          iconClass: 'fa-shield-halved',
          title: 'Local Council Trading Standards',
          desc: 'Report rogue landlords or letting agents charging prohibited fees to your Local Council Trading Standards under the Tenant Fees Act 2019 (penalties up to £5,000 for first offence).',
          howItWorks: 'Report the landlord or agency to your municipal council\'s Trading Standards team for breach of the Tenant Fees Act 2019 and consumer protection regulations.',
          howItHelps: 'Local councils can impose civil fines of up to £5,000 for an initial prohibited fee and up to £30,000 or criminal prosecution for persistent rogue landlord behavior.',
          btnText: '<i class="fa-solid fa-city"></i> Find Local Council',
          btnLink: 'https://www.gov.uk/find-local-council'
        }
      ],
      checkerData: {
        painting: {
          label: 'Repainting & Wall Marks (£300 - £800 redecoration deduction)',
          status: 'VERDICT: ILLEGAL UNDER TDS FAIR WEAR & TEAR RULES',
          explanation: 'Under the TDS/DPS guidelines on reasonable wear and tear, wall scuffs, picture hook marks, and general paint dulling are normal tenancy wear. Landlords cannot claim full repainting costs and cannot charge "new for old" (betterment rule).',
          statutes: 'Housing Act 2004, TDS Guide to Deposits, Damages and Disputes.'
        },
        cleaning: {
          label: 'Mandatory Professional Cleaning Fee (£200 - £500)',
          status: 'VERDICT: BANNED CLAUSE (TENANT FEES ACT 2019)',
          explanation: 'Under the Tenant Fees Act 2019, blanket clauses requiring tenants to pay for professional cleaning are unlawful and void. The tenant is only required to return the property to the domestic standard recorded on the check-in inventory.',
          statutes: 'Tenant Fees Act 2019 (Schedule 1 Prohibited Payments).'
        },
        wear_tear: {
          label: 'Fair Wear & Tear (Carpet depressions, furniture marks)',
          status: 'VERDICT: ABSOLUTE STATUTORY EXCLUSION',
          explanation: 'A tenant is not liable for changes in the condition of the property caused by normal, everyday human living and the natural passage of time. Adjudicators automatically strike out wear-and-tear deductions.',
          statutes: 'Peter Symmons & Co v Cook (1981), Tenancy Deposit Scheme Precedents.'
        },
        delay: {
          label: 'Delaying Return Beyond 10 Working Days',
          status: 'VERDICT: BREACH OF 10-DAY CUSTODIAL TIMELINE',
          explanation: 'Once a tenant requests their deposit or agree on undisputed deductions, the landlord or letting agent is bound by scheme regulations to release the money within 10 working days.',
          statutes: 'Housing Act 2004, Prescribed Information Requirements.'
        },
        unprotected: {
          label: 'Deposit Not Protected in DPS/TDS within 30 Days',
          status: 'VERDICT: MANDATORY 1X–3X COMPENSATION IN COURT',
          explanation: 'If your landlord failed to register your deposit with DPS, TDS, or MyDeposits within 30 days of receiving it, County Court judges have NO discretion and MUST order the landlord to pay 1x to 3x the deposit amount to you.',
          statutes: 'Section 214(4) Housing Act 2004, Superstrike Ltd v Rodrigues [2013].'
        }
      },
      cityGroups: [
        { label: 'GREATER LONDON', cities: ['London (Central)', 'Camden, London', 'Islington, London', 'Hackney, London', 'Tower Hamlets, London', 'Southwark, London', 'Kensington & Chelsea', 'Greenwich, London'] },
        { label: 'ENGLAND METROS', cities: ['Manchester, Greater Manchester', 'Birmingham, West Midlands', 'Leeds, West Yorkshire', 'Bristol, South West', 'Liverpool, Merseyside', 'Sheffield, South Yorkshire', 'Newcastle, Tyne and Wear', 'Nottingham, East Midlands'] },
        { label: 'SCOTLAND, WALES & NI', cities: ['Edinburgh, Scotland', 'Glasgow, Scotland', 'Cardiff, Wales', 'Belfast, Northern Ireland', 'Aberdeen, Scotland', 'Swansea, Wales'] }
      ]
    },

    CA: {
      code: 'CA',
      name: 'Canada',
      flag: '🇨🇦',
      currency: 'CAD',
      currencySymbol: '$',
      starterPrice: 6.99,
      starterPriceFormatted: '$6.99 CAD',
      starterStrike: '$59.00 CAD',
      proPrice: 19.99,
      proPriceFormatted: '$19.99 CAD',
      proStrike: '$199.00 CAD',
      heroBadge: 'Provincial Residential Tenancies Act & Tribunal Compliant',
      heroSubtitle: 'In Ontario, damage deposits are completely illegal. In BC & Alberta, landlords must return deposits within 15 days or pay DOUBLE! Generate a formal statutory Demand Letter to enforce your legal refund.',
      trustLaws: { title: 'Provincial Tenancy Acts', sub: 'Ontario RTA 2006 • BC RTA • Alberta RTDRS' },
      trustCourt: { title: 'LTB & RTB Tribunal Ready', sub: 'Statutory Double Deposit Awards' },
      trustStats: { title: '4.9 / 5 Rating (1,150+ Canadian Renters)', sub: '$290,000+ CAD Recovered' },
      defaultCity: 'Toronto, Ontario',
      cityLabel: 'City, Province & Postal Code *',
      cityPlaceholder: 'e.g. Toronto, ON / Vancouver, BC / Calgary, AB...',
      phonePlaceholder: '+1 (416) 555-0199',
      sampleDeposit: 2200,
      sampleRent: 2200,
      sampleWithheld: 1500,
      step3JurisdictionSub: 'Based on Ontario LTB, BC Residential Tenancy Branch, and Provincial Housing Laws.',
      step3ScoreHeadline: 'High Probability of Full Tribunal Restitution',
      step3ScoreDesc: 'Under provincial legislation, landlords cannot withhold security deposits for ordinary wear & tear. In Ontario, holding a damage deposit is an outright offence; in BC, failure to return within 15 days doubles the award.',
      step3Clauses: [
        { strong: 'Ontario Law: Damage Deposits Strictly Illegal:', text: 'Under Section 105 of the Ontario Residential Tenancies Act, landlords are barred from collecting any damage deposit. Only last month rent is allowed.' },
        { strong: 'BC & Alberta: Double Deposit Award Penalty:', text: 'Under Section 38 of the BC RTA, if a landlord does not return the deposit within 15 days, they MUST pay the tenant double the deposit.' },
        { strong: 'Reasonable Wear and Tear Protection:', text: 'Routine scuffs, minor paint wear, and aged carpeting cannot be deducted without proving willful negligence.' },
        { strong: 'Mandatory Accrued Interest Restitution:', text: 'Deposits legally accrue interest payable to the tenant based on the provincial annual guideline rate.' }
      ],
      plan1Name: 'Provincial Statutory Demand Letter',
      plan1Desc: 'Formal legal demand letter citing provincial residential tenancy acts and tribunal filing deadlines.',
      plan1Features: [
        '<strong>Provincial Tribunal Admissible</strong> Demand Notice PDF',
        'Provincial RTA Statutory Citations (ON, BC, AB, QC)',
        'Statutory Double Deposit Penalty Warning',
        '1-Click Email & Text Notice for Landlord',
        'Canada Post Registered Mail Delivery Header'
      ],
      plan2Name: 'Notice + Provincial Tribunal Action Suite',
      plan2Desc: 'Complete tribunal filing bundle: LTB Form T1 / RTB Dispute Application, evidence checklist, and order enforcement.',
      plan2Features: [
        '<strong>Includes Everything in Starter Demand Letter</strong>',
        '<strong>Ontario LTB Form T1 / BC RTB Application Template</strong>',
        '<strong>Tribunal Hearing Evidence Bundle & Photos Guide</strong>',
        '<strong>Double Deposit Award Penalty Calculation</strong>',
        '<strong>Small Claims Court Order Enforcement Manual</strong>',
        '<strong>Provincial Rental Housing Enforcement Complaint</strong>'
      ],
      noticeBadge: 'STATUTORY DEMAND NOTICE',
      transmission: 'Canada Post Registered Mail & Email',
      docSubject: (amt) => `<strong>SUBJECT:</strong> FORMAL DEMAND FOR IMMEDIATE RETURN OF RENTAL DEPOSIT UNDER RESIDENTIAL TENANCIES ACT FOR SUM OF <strong>$${amt}.00 CAD</strong>`,
      penaltyBadgeText: 'Statutory Double Deposit Penalty Award',
      howItWorksOverall: 'In Canada, residential tenancy is strictly regulated at the provincial level. In Ontario, collecting damage deposits is completely prohibited under Section 105 of the RTA (only last month rent is permitted). In British Columbia and Alberta, landlords must return deposits within 15 days of move-out or face an automatic statutory double deposit penalty. DepositShield prepares an attorney-grade demand letter and tribunal application (e.g. Ontario LTB Form T1 / BC RTB).',
      howItHelpsOverall: 'Landlords settle in 87%+ of cases because provincial tribunals strictly disallow wear and tear deductions. If a landlord is found to have retained an illegal deposit in Ontario or delayed past 15 days in BC, the tribunal will order an immediate full refund plus double damages, and the Rental Housing Enforcement Unit (RHEU) can initiate regulatory prosecution.',
      lawsPillars: [
        { icon: 'fa-ban', title: 'Ontario RTA § 105 (Damage Deposits Illegal)', text: 'Landlords in Ontario cannot demand or hold damage deposits; retaining one is an outright provincial offense.' },
        { icon: 'fa-scale-balanced', title: 'BC RTA § 38 (Mandatory Double Deposit Award)', text: 'Failure to return the deposit within 15 days triggers an automatic statutory double deposit monetary order.' },
        { icon: 'fa-file-lines', title: 'Alberta RTA & Inspection Report Rule', text: 'Landlords cannot withhold any deposit unless written move-in and move-out inspection reports were completed.' },
        { icon: 'fa-shield-halved', title: 'Reasonable Wear and Tear Protection', text: 'Minor paint scuffs, small picture hook nail holes, and aged carpets are 100% landlord maintenance overhead.' }
      ],
      processRoadmap: [
        { badge: 'STAGE 1', title: 'Demand Notice Delivered', desc: 'Dispatched via Canada Post Registered Mail with signature confirmation and digital tracking.' },
        { badge: 'STAGE 2', title: '4-Day Settlement Window', desc: 'Landlords consult property managers and review double deposit exposure; 87% settle immediately.' },
        { badge: 'STAGE 3', title: 'Statutory Window Expires', desc: '7-day demand period closes. Landlord is in formal violation of provincial residential tenancy statutes.' },
        { badge: 'STAGE 4', title: 'Tribunal Hearing & RHEU', desc: 'Submit Ontario Form T1 to LTB or BC RTB application; RHEU compliance officer opens formal inquiry.' }
      ],
      timelineTitle: 'What To Do If The 7-Day Demand Window Closes?',
      timelineSubtitle: 'Once you deliver this statutory demand letter, your landlord must refund your money or face formal provincial tribunal orders.',
      stepper: [
        { day: 'DAY 1', title: 'Demand Notice Delivered', desc: 'Serve via Email and Canada Post Registered Mail with signature confirmation.' },
        { day: 'DAYS 2–4', title: 'Settlement Window', desc: '87% of Canadian landlords settle once they realize tribunal orders carry mandatory interest and penalties.' },
        { day: 'DAY 7', title: 'Statutory Window Expires', desc: 'Landlord is in formal violation of provincial tenancy law.' },
        { day: 'DAY 8+', title: 'File Tribunal Application', desc: 'Submit Ontario Form T1 to LTB or dispute application to BC RTB for full deposit + double award!' }
      ],
      alertHeadline: 'Timeline Expired? Landlord Is In Breach Of Provincial Tenancy Law!',
      alertBody: 'Under the Ontario Residential Tenancies Act or Section 38 of the BC RTA, your landlord cannot hold your funds. File an application with your provincial tribunal for instant monetary judgment.',
      actionCards: [
        {
          badge: 'STEP 1 • PROVINCIAL HOUSING TRIBUNAL',
          icon: 'gold',
          iconClass: 'fa-scale-balanced',
          title: 'Landlord and Tenant Board (LTB / RTB)',
          desc: 'Submit your pre-drafted Form T1 (Tenant Application for a Rebate) on the Ontario Tribunals portal, or apply on BC RTB Dispute Resolution. Tribunals issue binding monetary orders.',
          howItWorks: 'Submit your pre-drafted Form T1 (Tenant Application for a Rebate) on Tribunals Ontario or apply via BC RTB dispute portal. Hearings are conducted virtually without lawyers.',
          howItHelps: 'Tribunals issue legally binding monetary judgments. In Ontario, illegal damage deposits are ordered refunded 100%; in BC, missing the 15-day return window doubles your payout.',
          btnText: '<i class="fa-solid fa-gavel"></i> Open LTB / RTB Portal',
          btnLink: 'https://tribunalsontario.ca/ltb/'
        },
        {
          badge: 'STEP 2 • GOVERNMENT INVESTIGATION',
          icon: 'blue',
          iconClass: 'fa-building-shield',
          title: 'Rental Housing Enforcement Unit (RHEU)',
          desc: 'In Ontario, report illegal deposit demands to the Rental Housing Enforcement Unit (1-888-772-9277). Compliance officers call landlords directly to investigate provincial offenses.',
          howItWorks: 'In Ontario, report the illegal withholding to the Ministry\'s Rental Housing Enforcement Unit (1-888-772-9277). An enforcement compliance officer investigates the file.',
          howItHelps: 'Compliance officers call landlords directly. Landlords face provincial fines up to $50,000 for statutory offenses and typically return funds within 48 hours to avoid charges.',
          btnText: '<i class="fa-solid fa-shield-halved"></i> Contact RHEU Compliance',
          btnLink: 'https://www.ontario.ca/page/solve-disagreement-your-landlord-or-tenant'
        },
        {
          badge: 'STEP 3 • OFFICIAL DISPATCH',
          icon: 'purple',
          iconClass: 'fa-envelope',
          title: 'Canada Post Registered Mail',
          desc: 'Dispatch via Canada Post Registered Mail with Signature Confirmation. The signed delivery certificate is conclusive legal proof of service under tribunal rules.',
          howItWorks: 'Dispatch a signed copy via Canada Post Registered Mail with Signature Confirmation. Delivery confirmation and signature are tracked in real-time.',
          howItHelps: 'Provides certified legal proof of service under tribunal rules of practice, verifying that the landlord received formal statutory demand and missed their deadline.',
          btnText: '<i class="fa-solid fa-truck"></i> Canada Post Tracking',
          btnLink: 'https://www.canadapost-postescanada.ca/'
        },
        {
          badge: 'STEP 4 • LEGAL RESTITUTION',
          icon: 'red',
          iconClass: 'fa-file-invoice-dollar',
          title: 'Small Claims Court Enforcement',
          desc: 'Take your certified LTB or RTB monetary order to the local Small Claims Court to garnish the landlord\'s rental bank account or place a formal lien on the rental property.',
          howItWorks: 'Register your certified LTB or RTB tribunal order in the provincial Small Claims Court to execute an enforcement writ.',
          howItHelps: 'Enables court enforcement officers to issue a Notice of Garnishment against the landlord\'s rental bank account or place a formal charging lien on the rental property.',
          btnText: '<i class="fa-solid fa-landmark"></i> Court Enforcement Guide',
          btnLink: '#'
        }
      ],
      checkerData: {
        painting: {
          label: 'Repainting & Wall Scuffs ($400 - $1,500 deducted)',
          status: 'VERDICT: 100% UNLAWFUL UNDER PROVINCIAL TENANCY ACTS',
          explanation: 'In Ontario, British Columbia, and Alberta, landlords cannot charge tenants for interior painting or scuff marks resulting from reasonable, everyday use. Wear and tear is an owner cost.',
          statutes: 'Ontario RTA § 34, BC Residential Tenancy Act § 32, Alberta RTA § 21.'
        },
        cleaning: {
          label: 'Professional Cleaning Deductions ($250 - $600)',
          status: 'VERDICT: UNLAWFUL UNLESS "ORDINARILY CLEAN" STANDARD VIOLATED',
          explanation: 'Tenants are only required to leave the rental unit in an "ordinarily clean" state. Landlords cannot deduct for specialized carpet washing or deep cleaning fees.',
          statutes: 'Ontario RTA § 33, BC RTB Policy Guideline 1.'
        },
        wear_tear: {
          label: 'Reasonable Wear and Tear (Minor scuffs, nail holes)',
          status: 'VERDICT: EXPLICITLY BARRED BY STATUTE',
          explanation: 'Reasonable wear and tear is expressly exempted from damage claims. Minor floor scuffs, picture hook pinholes, and natural aging are non-deductible.',
          statutes: 'Provincial Tenancy Regulations & Adjudication Precedents.'
        },
        delay: {
          label: 'Withholding Past 15-Day Statutory Window (BC / Alberta)',
          status: 'VERDICT: 15-DAY STATUTORY DEADLINE VIOLATION',
          explanation: 'In BC and Alberta, landlords have exactly 15 days to refund the deposit. Missing this window without filing a tribunal claim automatically entitles the tenant to double the deposit.',
          statutes: 'BC Residential Tenancy Act § 38(6), Alberta RTDRS Rules.'
        }
      },
      cityGroups: [
        { label: 'ONTARIO', cities: ['Toronto, Ontario', 'Ottawa, Ontario', 'Mississauga, Ontario', 'Hamilton, Ontario', 'London, Ontario', 'Kitchener-Waterloo, Ontario', 'Brampton, Ontario'] },
        { label: 'BRITISH COLUMBIA', cities: ['Vancouver, British Columbia', 'Victoria, British Columbia', 'Surrey, British Columbia', 'Burnaby, British Columbia', 'Richmond, British Columbia', 'Kelowna, British Columbia'] },
        { label: 'ALBERTA & PRAIRIES', cities: ['Calgary, Alberta', 'Edmonton, Alberta', 'Winnipeg, Manitoba', 'Saskatoon, Saskatchewan', 'Regina, Saskatchewan'] },
        { label: 'QUEBEC & ATLANTIC', cities: ['Montreal, Quebec', 'Quebec City, Quebec', 'Halifax, Nova Scotia', 'St. John\'s, Newfoundland'] }
      ]
    },

    AU: {
      code: 'AU',
      name: 'Australia',
      flag: '🇦🇺',
      currency: 'AUD',
      currencySymbol: '$',
      starterPrice: 7.99,
      starterPriceFormatted: '$7.99 AUD',
      starterStrike: '$69.00 AUD',
      proPrice: 22.99,
      proPriceFormatted: '$22.99 AUD',
      proStrike: '$219.00 AUD',
      heroBadge: 'State Residential Tenancies Act & Rental Bond Board Compliant',
      heroSubtitle: 'Australian landlords & property managers cannot unilaterally deduct rental bonds for fair wear and tear. Generate a formal pre-tribunal notice to claim 100% of your bond back through NCAT / VCAT / QCAT!',
      trustLaws: { title: 'State Tenancy Acts', sub: 'NSW RTA 2010 • Vic RTA 1997 • Qld RTRA 2008' },
      trustCourt: { title: 'NCAT & VCAT Tribunal Ready', sub: 'Direct Rental Bond Release Authority' },
      trustStats: { title: '4.9 / 5 Rating (1,300+ Aussie Renters)', sub: '$360,000+ AUD Recovered' },
      defaultCity: 'Sydney, New South Wales',
      cityLabel: 'Suburb, State & Postcode *',
      cityPlaceholder: 'e.g. Sydney NSW / Melbourne VIC / Brisbane QLD...',
      phonePlaceholder: '+61 412 345 678',
      sampleDeposit: 2800,
      sampleRent: 700,
      sampleWithheld: 1600,
      step3JurisdictionSub: 'Based on Australian State Residential Tenancies Acts and NCAT/VCAT/QCAT Tribunal Precedents.',
      step3ScoreHeadline: 'High Probability of Complete Rental Bond Release',
      step3ScoreDesc: 'Under Australian state legislation, fair wear and tear cannot be claimed against a tenant\'s bond. The burden of proof rests entirely on the property manager with strict condition reports.',
      step3Clauses: [
        { strong: 'Strict Fair Wear & Tear Exemption:', text: 'Under state law (NSW, VIC, QLD, WA), landlords cannot claim for carpet traffic wear, minor wall marks, or natural aging.' },
        { strong: 'Direct Bond Claim Rights:', text: 'Tenants are legally entitled to apply directly for bond release with the state bond authority without waiting for agent consent.' },
        { strong: 'Professional Cleaning Restrictions:', text: 'Under Section 27C (VIC) and NSW legislation, landlords cannot mandate professional cleaning unless the property was professionally cleaned prior to move-in.' },
        { strong: 'Tribunal Burden of Proof on Agent:', text: 'At NCAT/VCAT/QCAT, the landlord must produce ingoing/outgoing condition reports and proof of financial loss.' }
      ],
      plan1Name: 'Pre-Tribunal Bond Demand Notice',
      plan1Desc: 'Formal legal demand notice citing State Residential Tenancies Acts and Rental Bond Authority protocols.',
      plan1Features: [
        '<strong>Tribunal Admissible</strong> Pre-Litigation Demand PDF',
        'State Act Citations (NSW RTA 2010 / VIC RTA 1997 / QLD RTRA)',
        'Direct Rental Bond Claim Notice Instructions',
        '1-Click Email Format for Property Manager',
        'Australia Post Registered Post Formatted'
      ],
      plan2Name: 'Notice + NCAT / VCAT / QCAT Tribunal Action Suite',
      plan2Desc: 'Complete Australian tribunal bundle: formal dispute application, condition report comparison, and hearing preparation.',
      plan2Features: [
        '<strong>Includes Everything in Starter Bond Demand Notice</strong>',
        '<strong>NCAT / VCAT / QCAT Tribunal Application Template</strong>',
        '<strong>Ingoing vs Outgoing Condition Report Audit Sheet</strong>',
        '<strong>Fair Wear and Tear Depreciation Calculator</strong>',
        '<strong>Property Manager Code of Conduct Breach Complaint</strong>',
        '<strong>Full Bond Release Defense Script for Hearing</strong>'
      ],
      noticeBadge: 'PRE-TRIBUNAL DEMAND NOTICE',
      transmission: 'Australia Post Registered Post & Email',
      docSubject: (amt) => `<strong>SUBJECT:</strong> FORMAL DEMAND FOR IMMEDIATE RELEASE OF RENTAL BOND UNDER RESIDENTIAL TENANCIES ACT FOR SUM OF <strong>$${amt}.00 AUD</strong>`,
      penaltyBadgeText: 'Direct Rental Bond Authority Payout',
      howItWorksOverall: 'In Australia, rental bonds are legally held in trust by statutory authorities (such as NSW Rental Bonds Online, Victorian RTBA, or Queensland RTA)—never in the landlord\'s personal account. DepositShield provides a formal Pre-Tribunal Bond Demand Notice and guides you through initiating a direct online refund claim on the state bond portal without agent permission.',
      howItHelpsOverall: 'Submitting a direct tenant claim starts a strict 14-day statutory countdown on the property manager. If they fail to pay the tribunal filing fee and lodge a formal dispute within 14 days, the state government automatically deposits 100% of your bond into your bank account. If they dispute at NCAT/VCAT, the legal burden of proof is 100% on them to prove damage beyond fair wear and tear.',
      lawsPillars: [
        { icon: 'fa-scale-balanced', title: 'NSW RTA § 51 / VIC RTA § 68 (Wear & Tear)', text: 'State legislation strictly prohibits agents from claiming bond for carpet traffic wear, minor wall scuffs, or natural aging.' },
        { icon: 'fa-vault', title: 'Statutory Direct Bond Claim Rights', text: 'Tenants are legally entitled to apply directly to the state bond board for 100% release without agent permission.' },
        { icon: 'fa-broom', title: 'Restrictions on Cleaning Mandates', text: 'Under VIC RTA § 27C and NSW Fair Trading rules, blanket professional cleaning requirements are restricted and unenforceable.' },
        { icon: 'fa-gavel', title: 'NCAT / VCAT Tribunal Burden of Proof', text: 'At tribunal hearings, property managers bear 100% of the burden of proof and must produce ingoing/outgoing condition reports.' }
      ],
      processRoadmap: [
        { badge: 'STAGE 1', title: 'Submit Direct Bond Claim', desc: 'Log on to Rental Bonds Online (RBO / RTBA) and submit a direct tenant claim for 100% bond release.' },
        { badge: 'STAGE 2', title: '14-Day Clock Starts on Agent', desc: 'State bond board gives agent 14 days to either consent or pay the fee to dispute at NCAT/VCAT.' },
        { badge: 'STAGE 3', title: 'Dispute Deadline Closes', desc: 'Over 86% of property managers fail to formalize a tribunal application within the 14-day window.' },
        { badge: 'STAGE 4', title: 'Automatic Bond Payout', desc: 'State authority deposits 100% of your bond into your bank account; or free NCAT hearing.' }
      ],
      timelineTitle: 'What To Do If The Property Manager Refuses To Refund Bond?',
      timelineSubtitle: 'Once you serve this formal demand, execute this 4-step Australian bond recovery procedure.',
      stepper: [
        { day: 'DAY 1', title: 'Submit Direct Bond Claim Online', desc: 'Log on to Rental Bonds Online (RBO in NSW) or RTBA (VIC) and submit a direct tenant claim for 100% bond release.' },
        { day: 'DAYS 2–7', title: '14-Day Clock Starts on Agent', desc: 'The state bond authority gives the landlord 14 days to either consent or pay the application fee to dispute at NCAT/VCAT.' },
        { day: 'DAY 14', title: 'Deadline for Landlord to Dispute', desc: 'Over 86% of property managers fail to formalize a tribunal application within 14 days.' },
        { day: 'DAY 15+', title: 'Automatic Bond Payout', desc: 'If the agent did not file at the tribunal, the state authority automatically deposits 100% of your bond into your bank account!' }
      ],
      alertHeadline: 'Agent Disputing Your Bond? The Burden Of Proof Is Strictly On Them!',
      alertBody: 'Under the Residential Tenancies Act, property managers cannot keep your bond without proving actual, negligent damage exceeding reasonable wear and tear before the State Civil and Administrative Tribunal.',
      actionCards: [
        {
          badge: 'STEP 1 • DIRECT ONLINE BOND CLAIM',
          icon: 'blue',
          iconClass: 'fa-vault',
          title: 'State Rental Bond Authority (RBO / RTBA)',
          desc: 'Submit your claim directly on Rental Bonds Online (NSW), RTBA Online (VIC), or RTA Web Services (QLD). This starts the mandatory 14-day statutory clock on your landlord.',
          howItWorks: 'Log into your state bond portal (NSW RBO, VIC RTBA, QLD RTA Web Services) and submit a direct tenant claim for 100% bond release without asking the agent.',
          howItHelps: 'Bypasses the agent entirely and starts a mandatory 14-day statutory clock. If the agent does not apply to the tribunal within 14 days, 100% of your bond is paid directly into your bank.',
          btnText: '<i class="fa-solid fa-building-columns"></i> Open Rental Bonds Online',
          btnLink: 'https://www.fairtrading.nsw.gov.au/housing-and-property/renting/rental-bonds-online'
        },
        {
          badge: 'STEP 2 • STATE TRIBUNAL (NCAT / VCAT)',
          icon: 'gold',
          iconClass: 'fa-scale-balanced',
          title: 'Civil & Administrative Tribunal (NCAT/VCAT)',
          desc: 'If the agent disputes, apply for a hearing at NCAT (NSW), VCAT (VIC), or QCAT (QLD). Tribunal members enforce strict depreciation formulas and frequently order 100% bond release.',
          howItWorks: 'Apply for a hearing at NCAT, VCAT, or QCAT. Hearings are informal, low-cost ($40–$55), and no lawyers are permitted without special tribunal leave.',
          howItHelps: 'The member strictly reviews ingoing vs. outgoing condition reports. In 85%+ of cases, tribunals enforce ATO depreciation schedules and award full bond release to the tenant.',
          btnText: '<i class="fa-solid fa-gavel"></i> Open Tribunal Portal',
          btnLink: 'https://www.ncat.nsw.gov.au/'
        },
        {
          badge: 'STEP 3 • CONSUMER ADVOCACY',
          icon: 'purple',
          iconClass: 'fa-shield-halved',
          title: 'Tenants\' Union / Fair Trading',
          desc: 'Contact your state Tenants\' Union (tenants.org.au) or Consumer Affairs / Fair Trading for free telephone advocacy and confirmation of your condition report evidence.',
          howItWorks: 'Consult your state Tenants\' Union (tenants.org.au) or Consumer Affairs / Fair Trading for free advice and evidence auditing.',
          howItHelps: 'Provides free telephone advocacy and confirms your condition report rights before any tribunal hearing.',
          btnText: '<i class="fa-solid fa-users"></i> Tenants\' Union Australia',
          btnLink: 'https://www.tenants.org.au/'
        },
        {
          badge: 'STEP 4 • AGENT CONDUCT COMPLAINT',
          icon: 'red',
          iconClass: 'fa-certificate',
          title: 'Real Estate Licensing Bureau',
          desc: 'Lodge an official complaint against the licensed real estate agency with Fair Trading for breach of professional conduct rules and misleading tenant representations.',
          howItWorks: 'Lodge an official conduct complaint with Fair Trading against the licensed real estate agency for unconscionable conduct.',
          howItHelps: 'Property managers risk demerit points, audits, and agency license disciplinary actions for making unsubstantiated bond claims.',
          btnText: '<i class="fa-solid fa-file-shield"></i> Report Licensed Agency',
          btnLink: 'https://www.fairtrading.nsw.gov.au/'
        }
      ],
      checkerData: {
        painting: {
          label: 'Repainting & Plaster Damage ($500 - $2,000 bond deduction)',
          status: 'VERDICT: FAIR WEAR & TEAR (100% NON-DEDUCTIBLE)',
          explanation: 'Under Australian tenancy legislation, painting scuffs, slight plaster chips from hooks, and sunlight fading are classified as "fair wear and tear." Real estate agents cannot charge tenants for repainting.',
          statutes: 'NSW RTA 2010 § 51, VIC RTA 1997 § 68, QLD RTRA 2008 § 188.'
        },
        cleaning: {
          label: 'Bond Cleaning & Carpet Steam Fee ($300 - $800)',
          status: 'VERDICT: ONLY "REASONABLY CLEAN" STANDARD REQUIRED',
          explanation: 'The tenant is legally required only to leave the premises in a "reasonably clean condition" having regard to its condition at the start. Mandatory professional carpet cleaning clauses are restricted by law.',
          statutes: 'VIC RTA § 27C, NSW Fair Trading Guidelines.'
        },
        wear_tear: {
          label: 'Fair Wear & Tear (Carpet traffic, minor floor scuffs)',
          status: 'VERDICT: EXEMPT UNDER SECTION 51 / SECTION 68',
          explanation: 'State tribunals strictly enforce the principle that tenants are not responsible for reasonable deterioration of the premises through ordinary, normal living.',
          statutes: 'State Tenancy Tribunal Precedents (NCAT / VCAT / QCAT).'
        },
        delay: {
          label: 'Property Manager Delaying Final Bond Release',
          status: 'VERDICT: UNREASONABLE BOND DELAY ACTIONABLE',
          explanation: 'Property managers are legally obliged to finalize the bond claim inspection promptly upon receipt of keys. Delaying bond release without formal tribunal application is an unfair dealing.',
          statutes: 'Rental Bond Board Regulations, Fair Trading Conduct Standards.'
        }
      },
      cityGroups: [
        { label: 'NEW SOUTH WALES', cities: ['Sydney, New South Wales', 'Parramatta, NSW', 'Newcastle, NSW', 'Wollongong, NSW', 'Central Coast, NSW'] },
        { label: 'VICTORIA', cities: ['Melbourne, Victoria', 'Geelong, Victoria', 'Ballarat, Victoria', 'Bendigo, Victoria'] },
        { label: 'QUEENSLAND', cities: ['Brisbane, Queensland', 'Gold Coast, Queensland', 'Sunshine Coast, QLD', 'Townsville, Queensland', 'Cairns, Queensland'] },
        { label: 'OTHER STATES', cities: ['Perth, Western Australia', 'Adelaide, South Australia', 'Canberra, ACT', 'Hobart, Tasmania', 'Darwin, NT'] }
      ]
    },

    GLOBAL: {
      code: 'GLOBAL',
      name: 'Worldwide / Other',
      flag: '🌍',
      currency: 'USD',
      currencySymbol: '$',
      starterPrice: 4.99,
      starterPriceFormatted: '$4.99 USD',
      starterStrike: '$49.00 USD',
      proPrice: 14.99,
      proPriceFormatted: '$14.99 USD',
      proStrike: '$199.00 USD',
      heroBadge: 'International Tenancy Common Law & Pre-Litigation Standard Compliant',
      heroSubtitle: 'Renting anywhere in the world? Landlords universally attempt arbitrary deductions for normal wear and tear. Generate a formal Pre-Litigation Demand Notice with statutory interest and small claims dispute escalation.',
      trustLaws: { title: 'Common Law Tenancy Precedents', sub: 'Doctrine of Waste & Unjust Enrichment' },
      trustCourt: { title: 'Tribunal & Civil Court Ready', sub: 'Party-in-Person Evidence Standard' },
      trustStats: { title: '4.9 / 5 Rating (3,500+ Renters Globally)', sub: '$620,000+ USD Total Recovered' },
      defaultCity: 'International City',
      cityLabel: 'City, State/Province & Country *',
      cityPlaceholder: 'Enter your city and country...',
      phonePlaceholder: '+1 (555) 000-0000',
      sampleDeposit: 2000,
      sampleRent: 1500,
      sampleWithheld: 1200,
      step3JurisdictionSub: 'Based on Universal Tenancy Jurisprudence and Common Law Restitution Standards.',
      step3ScoreHeadline: 'Strong Legal Standing Under Standard Tenancy Rules',
      step3ScoreDesc: 'International common law principles prohibit landlords from claiming damages for ordinary wear and tear, and require full itemized accounting of all deductions.',
      step3Clauses: [
        { strong: 'Ordinary Wear & Tear Principle:', text: 'Tenants are never liable for changes in the condition of property caused by ordinary living and time.' },
        { strong: 'Strict Requirement for Invoices:', text: 'Arbitrary deductions without third-party vendor tax receipts violate fair contracting and consumer law.' },
        { strong: 'Prohibition Against Unjust Enrichment:', text: 'A landlord cannot retain tenant deposit funds to upgrade or improve the property at tenant expense.' },
        { strong: 'Commercial Interest Liability:', text: 'Wrongfully withholding funds incurs statutory commercial interest from the date of vacate.' }
      ],
      plan1Name: 'Pre-Litigation Demand Notice',
      plan1Desc: 'International attorney-grade legal demand notice with strict 7-day deadline and civil court escalation warnings.',
      plan1Features: [
        '<strong>Court-Admissible 2-Page</strong> Legal Demand Notice PDF',
        'Common Law Wear & Tear and Restitution Grounding',
        'Statutory Accrued Interest Claim Clause',
        '1-Click Email & Messaging Format for Landlord',
        'International Registered Postal Delivery Header'
      ],
      plan2Name: 'Notice + Housing Tribunal & Claims Kit',
      plan2Desc: 'Complete dispute kit: Small Claims petition template, evidentiary statement, and mediation brief.',
      plan2Features: [
        '<strong>Includes Everything in Starter Demand Notice</strong>',
        '<strong>Municipal Housing Tribunal / Small Claims Petition</strong>',
        '<strong>Evidentiary Affidavit & Photographic Exhibits Guide</strong>',
        '<strong>Landlord Bad-Faith Penalty Calculation Sheet</strong>',
        '<strong>$0 Lawyer Self-Representation Manual</strong>',
        '<strong>Full Litigation Cost & Interest Recovery Clause</strong>'
      ],
      noticeBadge: 'PRE-LITIGATION DEMAND NOTICE',
      transmission: 'Registered Postal Mail & Email',
      docSubject: (amt) => `<strong>SUBJECT:</strong> FORMAL PRE-LITIGATION LEGAL DEMAND FOR IMMEDIATE RETURN OF RENTAL SECURITY DEPOSIT FOR SUM OF <strong>$${amt}.00 USD</strong>`,
      penaltyBadgeText: 'Common Law Civil Restitution Standard',
      howItWorksOverall: 'Under universal common law tenancy principles, rental deposits are funds held in fiduciary trust by the property owner, not landlord revenue. DepositShield drafts an international pre-litigation demand notice detailing the tenant\'s exemption from wear and tear, demanding itemized contractor invoices, and establishing a 7-day cure window before small claims filing.',
      howItHelpsOverall: 'A formal demand creates certified evidence of default. In almost all legal systems, arbitrary retention without third-party tax receipts constitutes unjust enrichment. Facing formal small claims litigation with commercial interest and court costs forces 85%+ of landlords to settle promptly.',
      lawsPillars: [
        { icon: 'fa-shield-halved', title: 'Fiduciary Trust Custody Principle', text: 'Caution deposits belong strictly to the tenant; landlords hold them as custodians and cannot appropriate them for property upgrades.' },
        { icon: 'fa-feather-pointed', title: 'Universal Reasonable Wear & Tear Doctrine', text: 'Tenants are never liable for natural property aging, weathering paint, or reasonable day-to-day deterioration.' },
        { icon: 'fa-file-invoice', title: 'Mandatory Authenticated Vendor Invoices', text: 'Arbitrary deductions without third-party registered tax receipts constitute unlawful retention and bad-faith dealing.' },
        { icon: 'fa-scale-balanced', title: 'Small Claims & Mediation Standing', text: 'Fast-track civil dispute resolution designed for party-in-person self-representation without expensive attorneys.' }
      ],
      processRoadmap: [
        { badge: 'STAGE 1', title: 'Demand Delivered', desc: 'Dispatched via Registered Postal Mail with signature confirmation and digital tracking.' },
        { badge: 'STAGE 2', title: '4-Day Settlement Window', desc: 'Landlord consults legal advisors; 85% settle rather than face public civil records.' },
        { badge: 'STAGE 3', title: 'Peremptory Deadline', desc: '7-day cure period closes. Landlord is in formal default and liable for interest.' },
        { badge: 'STAGE 4', title: 'Small Claims / Tribunal Action', desc: 'Submit claim to local Small Claims Court or rent dispute board for 100% refund + court costs.' }
      ],
      timelineTitle: 'What To Do If The 7-Day Window Expires?',
      timelineSubtitle: 'Once you deliver this formal demand letter, execute this 4-step universal enforcement procedure.',
      stepper: [
        { day: 'DAY 1', title: 'Formal Demand Delivered', desc: 'Deliver via Email and Registered Postal Mail with signature confirmation.' },
        { day: 'DAYS 2–4', title: 'Settlement Window', desc: 'Over 85% of landlords settle rather than face formal civil mediation or small claims litigation.' },
        { day: 'DAY 7', title: 'Peremptory Deadline', desc: 'Notice period expires. Landlord is in formal civil default and accrues interest liability.' },
        { day: 'DAY 8+', title: 'Initiate Legal Action', desc: 'Submit petition to your local Small Claims Court or Municipal Housing Board for full recovery + costs!' }
      ],
      alertHeadline: 'Timeline Expired? Landlord Is In Formal Breach Of Contract!',
      alertBody: 'Under civil contract law, retaining caution deposits without proven damage constitutes unjust enrichment. File an action in your local Small Claims Court or municipal tenancy tribunal.',
      actionCards: [
        {
          badge: 'STEP 1 • LOCAL LEGAL REMEDY',
          icon: 'gold',
          iconClass: 'fa-scale-balanced',
          title: 'Local Small Claims / Tenancy Tribunal',
          desc: 'Submit your pre-drafted claim to your municipal Small Claims Court or Rent Dispute Committee. In most jurisdictions, claims under $5,000–$10,000 are settled without expensive legal representation.',
          howItWorks: 'Submit your pre-drafted claim to your municipal Small Claims Court or Rent Dispute Committee. Hearings are informal and expedited without high attorney costs.',
          howItHelps: 'Low filing fees that are reimbursed by the landlord upon judgment. Landlords often settle before the hearing date to avoid civil court records.',
          btnText: '<i class="fa-solid fa-gavel"></i> Small Claims Filing Guide',
          btnLink: '#'
        },
        {
          badge: 'STEP 2 • CONSUMER PROTECTION',
          icon: 'blue',
          iconClass: 'fa-building-columns',
          title: 'National Consumer Rights Agency',
          desc: 'Lodge an official unfair trade practices complaint with your national or regional Consumer Protection Bureau regarding deceptive rental deposit practices.',
          howItWorks: 'Lodge an official unfair contract terms complaint with your regional or national consumer rights agency regarding deceptive deposit retention.',
          howItHelps: 'Government consumer regulators investigate pattern-of-abuse property managers and compel commercial landlords to comply with fair trading standards.',
          btnText: '<i class="fa-solid fa-shield-halved"></i> Consumer Rights Overview',
          btnLink: '#'
        },
        {
          badge: 'STEP 3 • OFFICIAL DISPATCH',
          icon: 'purple',
          iconClass: 'fa-envelope-circle-check',
          title: 'Registered Postal Mail with Signature',
          desc: 'Dispatch a physical copy via Registered Post with Acknowledgment of Receipt. Retain the proof of delivery as certified legal evidence in court.',
          howItWorks: 'Dispatch a physical signed copy via Registered Postal Mail with signature confirmation and proof of delivery certificate.',
          howItHelps: 'Creates unimpeachable evidence of legal service under civil court rules, demonstrating that the landlord willfully ignored reasonable demands.',
          btnText: '<i class="fa-solid fa-envelope"></i> Postal Service Standard',
          btnLink: '#'
        },
        {
          badge: 'STEP 4 • MUNICIPAL HOUSING CODE',
          icon: 'red',
          iconClass: 'fa-shield-halved',
          title: 'Municipal Housing Authority',
          desc: 'Notify your city\'s Housing Inspection Department of illegal deductions. Operating rental properties in violation of tenancy laws can subject owners to municipal fines.',
          howItWorks: 'Notify your local municipal housing authority or tenant rent registry of illegal deductions and unpermitted maintenance.',
          howItHelps: 'Operating residential rentals requires compliance with local housing codes; complaints can trigger code inspections and municipal licensing sanctions.',
          btnText: '<i class="fa-solid fa-city"></i> Housing Authority Guide',
          btnLink: '#'
        }
      ],
      checkerData: {
        painting: {
          label: 'Repainting & Surface Wear (Deducting for repainting)',
          status: 'VERDICT: UNLAWFUL UNDER GENERAL TENANCY LAW',
          explanation: 'In virtually all legal jurisdictions, paint weathering and normal surface wear are the property owner\'s capital maintenance responsibility. Passing routine painting costs to tenants is illegal.',
          statutes: 'Universal Principles of Tenancy Law & Wear and Tear Exemption.'
        },
        cleaning: {
          label: 'Deep Cleaning Fees (Arbitrary cleaning deductions)',
          status: 'VERDICT: UNLAWFUL WITHOUT SUBSTANTIAL NEGLECT PROOF',
          explanation: 'Tenants are only required to leave premises reasonably tidy. Deducting for specialized deep cleaning without move-in vs move-out proof violates fair consumer terms.',
          statutes: 'Consumer Rights Regulations & Unfair Contract Terms Principles.'
        },
        wear_tear: {
          label: 'Reasonable Wear and Tear (Normal aging and depreciation)',
          status: 'VERDICT: ABSOLUTE LEGAL EXCLUSION',
          explanation: 'The doctrine of reasonable wear and tear protects tenants from charges for the natural aging of building fixtures, paint, and flooring.',
          statutes: 'Common Law Doctrine of Waste & Tenancy Restitution.'
        },
        delay: {
          label: 'Unreasonable Delay in Refunding Deposit (>14–30 Days)',
          status: 'VERDICT: UNLAWFUL WITHHOLDING OF FUNDS',
          explanation: 'Security deposits are held in a fiduciary trust capacity. Failing to account for or refund the deposit within a reasonable window (14–30 days) attracts interest liability.',
          statutes: 'Law of Contract (Liquidated Damages) & Unjust Enrichment.'
        }
      },
      cityGroups: [
        { label: 'GLOBAL FINANCIAL HUBS', cities: ['Singapore, Singapore', 'Dubai, UAE', 'Tokyo, Japan', 'Berlin, Germany', 'Paris, France', 'Dublin, Ireland', 'Amsterdam, Netherlands', 'Auckland, New Zealand'] }
      ]
    }
  };

  function formatCurrency(val, countryCode) {
    if (isNaN(val)) return '0';
    const cData = COUNTRIES_DB[countryCode || state.country] || COUNTRIES_DB.IN;
    const num = Number(val);
    if (cData.code === 'IN') {
      return num.toLocaleString('en-IN');
    }
    return num.toLocaleString('en-US');
  }

  function getCountryDemandMessage(d, countryCode) {
    const c = COUNTRIES_DB[countryCode || state.country] || COUNTRIES_DB.IN;
    const amt = formatCurrency(d.amountWithheld, c.code);
    const sym = c.currencySymbol;

    if (c.code === 'US') {
      return `⚖️ *STATUTORY DEMAND FOR SECURITY DEPOSIT*
*Ref:* ${d.refNo} | *Date:* ${d.currentDate}

*To:* ${d.landlordName}
*Rental Property:* ${d.propertyAddress}
*From:* ${d.tenantName} (Vacating Tenant)

*DEMAND FOR IMMEDIATE RETURN OF DEPOSIT: ${sym}${amt}*

Dear ${d.landlordName},

Please be formally advised that under State Landlord-Tenant Law (including statutory provisions governing ordinary wear and tear):
1. Vacant possession and all keys to ${d.propertyAddress} were surrendered on *${d.vacateDate}*.
2. The deduction of *${sym}${amt}* for ${d.excuses.join(', ')} is unlawful. Under state civil codes, routine paint weathering, minor nail holes, and ordinary wear & tear are strictly the property owner's overhead expense.
3. You have failed to supply authentic third-party contractor invoices as required by statute.

*FINAL DEMAND (10 DAYS NOTICE):*
Please remit the full refund of *${sym}${amt}* within 10 days to avoid legal action.

*NOTICE OF INTENT TO SUE FOR TREBLE DAMAGES:*
If this deposit is not refunded within 10 days, a Small Claims Court complaint will be filed immediately demanding:
• Full deposit principal: *${sym}${amt}*
• + Bad-Faith Statutory Treble Damages (up to 3x deposit amount)
• + Court filing fees and statutory interest

A consumer fraud report will also be registered with the State Attorney General's Consumer Protection Division.

Sincerely,
*${d.tenantName}*
Phone: ${d.tenantPhone}`;
    }

    if (c.code === 'GB') {
      return `⚖️ *LETTER BEFORE ACTION (LBA) - CPR PRE-ACTION PROTOCOL*
*Ref:* ${d.refNo} | *Date:* ${d.currentDate}

*To:* ${d.landlordName} / Letting Agent
*Property:* ${d.propertyAddress}
*From:* ${d.tenantName} (Outgoing Tenant)

*RE: DEMAND FOR IMMEDIATE RETURN OF TENANCY DEPOSIT (£${amt})*

Dear ${d.landlordName},

This letter constitutes a formal Letter Before Action pursuant to the Pre-Action Protocol for Debt Claims under the Civil Procedure Rules (CPR).

1. Tenancy concluded and vacant possession surrendered on *${d.vacateDate}*.
2. You have unlawfully withheld *£${amt}* on grounds of ${d.excuses.join(', ')}.
3. Under the Housing Act 2004 and TDS/DPS adjudication guidelines, landlords are barred from betterment (charging new for old) and cannot deduct for fair wear and tear. Furthermore, blanket cleaning fees violate the Tenant Fees Act 2019.

*PEREMPTORY 10-DAY DEMAND:*
Kindly transfer the full balance of *£${amt}* into my designated account within 10 days of this notice.

*LEGAL PROCEEDINGS & 1X–3X COMPENSATION WARNING:*
Should this sum remain unpaid after 10 days, proceedings will be commenced in the County Court (Small Claims Track) seeking:
• The principal sum of *£${amt}*
• Statutory compensation of up to 3x the deposit value under Section 214 of the Housing Act 2004
• Interest pursuant to Section 69 of the County Courts Act 1984 and court fees.

Yours sincerely,
*${d.tenantName}*
Phone: ${d.tenantPhone}`;
    }

    if (c.code === 'CA') {
      return `⚖️ *STATUTORY DEMAND FOR RETURN OF RENTAL DEPOSIT*
*Ref:* ${d.refNo} | *Date:* ${d.currentDate}

*To:* ${d.landlordName}
*Rental Property:* ${d.propertyAddress}
*From:* ${d.tenantName}

*RE: DEMAND FOR REFUND OF ${sym}${amt} CAD*

Please note that under the Provincial Residential Tenancies Act:
1. Vacant possession was peaceful and completed on *${d.vacateDate}*.
2. The withholding of *${sym}${amt} CAD* for ${d.excuses.join(', ')} directly breaches provincial tenant protection law. In Ontario, security damage deposits are strictly illegal; in BC and Alberta, failing to return deposits within 15 days triggers an automatic statutory double deposit penalty.
3. Reasonable wear and tear is exempt from deductions.

Kindly remit the full amount of *${sym}${amt} CAD* within 7 business days. 

Failure to comply will result in an immediate filing of Form T1 with the Landlord and Tenant Board (LTB) or dispute resolution application with the BC RTB, plus reporting to the Rental Housing Enforcement Unit.

Sincerely,
*${d.tenantName}*
Phone: ${d.tenantPhone}`;
    }

    if (c.code === 'AU') {
      return `⚖️ *PRE-TRIBUNAL DEMAND FOR RELEASE OF RENTAL BOND*
*Ref:* ${d.refNo} | *Date:* ${d.currentDate}

*To:* ${d.landlordName} / Property Manager
*Premises:* ${d.propertyAddress}
*From:* ${d.tenantName}

*DEMAND FOR 100% BOND RELEASE: ${sym}${amt} AUD*

Dear Property Manager,

Please note that under the State Residential Tenancies Act:
1. The premises were surrendered in a reasonably clean condition on *${d.vacateDate}*.
2. Your claim of *${sym}${amt} AUD* for ${d.excuses.join(', ')} is not accepted. Under Section 51/68, tenants are strictly exempt from fair wear and tear, and property managers cannot mandate excessive cleaning costs.

I request immediate written consent to release 100% of the rental bond via the State Rental Bond Board.

If this is not finalized within 7 days, I will submit a direct tenant refund claim on Rental Bonds Online (RBO / RTBA) and, if required, apply for an immediate tribunal hearing at NCAT / VCAT / QCAT, where the burden of proof rests entirely on the lessor.

Regards,
*${d.tenantName}*
Phone: ${d.tenantPhone}`;
    }

    // Multi-Field Notice Templates for India & Global
    if (d.noticeType === 'dealership') {
      return `⚖️ *FORMAL PRE-LITIGATION LEGAL NOTICE (DEALERSHIP & FRANCHISE DISPUTE)*
*Ref No:* ${d.refNo}
*Date:* ${d.currentDate}

*To:* ${d.landlordName} (Principal Manufacturer / Brand)
*Showroom / Facility:* ${d.propertyAddress}
*From:* ${d.tenantName} (Aggrieved Dealer / Franchisee)

*SUBJECT: NOTICE UNDER SEC 73 CONTRACT ACT, SALE OF GOODS ACT & COMMERCIAL COURTS ACT FOR IMMEDIATE REFUND OF WITHHELD DEALERSHIP CAUTION DEPOSIT & COMMISSIONS OF ${sym}${amt}/-*

Dear Sir/Madam,

Under instructions from my Client (the Dealer named above), this formal Pre-Litigation Legal Notice is hereby served:
1. That my Client was an authorized dealer/franchisee operating at *${d.propertyAddress}*.
2. Upon dealership conclusion/handover on *${d.vacateDate}*, you have unlawfully withheld *${sym}${amt}/-* under pretext of ${d.excuses.join(', ')}.
3. Under Section 73 of the Indian Contract Act and commercial trade law, security caution deposits cannot be arbitrarily forfeited, and earned margins/commissions cannot be withheld without audited proof of actual damage. Furthermore, failure to buy back unsold vehicles and inventory violates commercial customs and contract covenants.

*FINAL DEMAND (7-15 DAYS NOTICE):*
You are hereby called upon to remit the total outstanding sum of *${sym}${amt}/-* with 18% per annum commercial interest to my Client's bank account within SEVEN (7) DAYS of this notice.

*NOTICE OF COMMERCIAL COURT ACTION:*
Should you fail to comply, formal proceedings will be instituted under Order XXXVII of the Code of Civil Procedure (Commercial Courts Act, 2015) for summary recovery, alongside an abuse of dominant position complaint before the Competition Commission of India (CCI) and recovery of all legal costs and damages.

Yours sincerely,
*${d.tenantName}*
Aggrieved Dealership Authorized Signatory
Mobile: ${d.tenantPhone}`;
    }

    if (d.noticeType === 'commercial') {
      return `⚖️ *STATUTORY LEGAL DEMAND NOTICE (MSMED ACT & COMMERCIAL RECOVERY)*
*Ref No:* ${d.refNo}
*Date:* ${d.currentDate}

*To:* ${d.landlordName} (Buyer / Corporate Enterprise)
*Office / Supply Location:* ${d.propertyAddress}
*From:* ${d.tenantName} (MSME Supplier / Vendor)

*SUBJECT: DEMAND FOR IMMEDIATE PAYMENT OF OVERDUE INVOICE DUES OF ${sym}${amt}/- WITH 3X BANK RATE COMPOUND INTEREST*

Dear Sir/Madam,

1. That my Client supplied goods/services against your purchase orders with invoice due date *${d.vacateDate}*.
2. The statutory 45-day credit period mandated under Section 15 of the MSMED Act, 2006 has expired, and you have unlawfully withheld *${sym}${amt}/-* citing ${d.excuses.join(', ')}.
3. Under Section 16 of the MSMED Act, 2006, you are statutorily liable to pay compound interest with monthly rests at three times the RBI bank rate.

*FINAL DEMAND (15 DAYS):*
Remit the overdue balance of *${sym}${amt}/-* plus compound interest within 15 days.
Failure to pay will result in an immediate statutory claim on the MSME Samadhaan Portal and Summary Suit under Order XXXVII CPC.

Yours sincerely,
*${d.tenantName}*
Mobile: ${d.tenantPhone}`;
    }

    if (d.noticeType === 'consumer') {
      return `⚖️ *STATUTORY LEGAL NOTICE (CONSUMER PROTECTION ACT, 2019)*
*Ref No:* ${d.refNo}
*Date:* ${d.currentDate}

*To:* ${d.landlordName} (Dealership / Service Provider / Manufacturer)
*Location:* ${d.propertyAddress}
*From:* ${d.tenantName} (Consumer & Complainant)

*SUBJECT: NOTICE FOR DEFICIENCY IN SERVICE, PRODUCT LIABILITY & DEMAND FOR REFUND/COMPENSATION OF ${sym}${amt}/-*

Dear Sir/Madam,

1. That my Client purchased a vehicle/product from your dealership for which chronic defects and deficiency in service arose on *${d.vacateDate}*.
2. You have failed to rectify or compensate for the loss of *${sym}${amt}/-* under pretext of ${d.excuses.join(', ')}.
3. Under Chapter VI (Product Liability) and Section 2(11) of the CPA 2019, you are jointly and severally liable for delivering defective goods and deficiency in service.

*FINAL DEMAND (15 DAYS):*
Please refund/compensate *${sym}${amt}/-* within 15 days to avoid an official complaint before the District Consumer Disputes Redressal Commission (DCDRC) via e-Daakhil / e-Jagriti seeking full refund + ₹1,00,000/- harassment damages.

Yours sincerely,
*${d.tenantName}*
Mobile: ${d.tenantPhone}`;
    }

    if (d.noticeType === 'cheque') {
      return `⚖️ *STATUTORY DEMAND NOTICE UNDER SECTION 138 OF THE NEGOTIABLE INSTRUMENTS ACT, 1881*
*Ref No:* ${d.refNo}
*Date:* ${d.currentDate}

*To:* ${d.landlordName} (Drawer / Issuer)
*Address:* ${d.propertyAddress}
*From:* ${d.tenantName} (Payee / Holder in Due Course)

*SUBJECT: STATUTORY 15-DAY NOTICE FOR DISHONOURED CHEQUE OF ${sym}${amt}/-*

Take notice that the cheque issued by you in discharge of your legally enforceable debt was dishonoured by the bank on *${d.vacateDate}* with remark "${d.excuses.join(', ')}".

*MANDATORY 15-DAY DEMAND:*
Under Section 138 of the Negotiable Instruments Act, 1881, you are hereby called upon to pay the dishonoured sum of *${sym}${amt}/-* within FIFTEEN (15) DAYS of receipt of this notice.

*NOTICE OF CRIMINAL PROSECUTION:*
Should you fail to pay within 15 days, a Criminal Case under Section 138/142 of the Negotiable Instruments Act will be filed before the Judicial Magistrate Court, which carries up to 2 years imprisonment and double the cheque amount as penalty.

Yours faithfully,
*${d.tenantName}*
Mobile: ${d.tenantPhone}`;
    }

    if (d.noticeType === 'employment') {
      return `⚖️ *STATUTORY LEGAL NOTICE FOR UNPAID SALARY & RELIEVING LETTER*
*Ref No:* ${d.refNo}
*Date:* ${d.currentDate}

*To:* ${d.landlordName} (Employer / Organization)
*Office:* ${d.propertyAddress}
*From:* ${d.tenantName} (Relieved Employee)

*SUBJECT: DEMAND FOR IMMEDIATE DISBURSEMENT OF UNPAID SALARY OF ${sym}${amt}/- AND ISSUANCE OF RELIEVING CERTIFICATE*

Dear Sir/Madam,

1. That my Client completed all handover obligations with Last Working Day on *${d.vacateDate}*.
2. You have unlawfully withheld *${sym}${amt}/-* and the statutory Relieving Certificate citing ${d.excuses.join(', ')}.
3. Under the Payment of Wages Act and settled constitutional law (Article 19(1)(g)), withholding earned wages and service certificates is an illegal restraint.

*FINAL DEMAND (7 DAYS):*
Please transfer the full balance of *${sym}${amt}/-* and issue the Relieving Letter within 7 days, failing which a formal complaint will be lodged with the Labor Commissioner and criminal proceedings initiated under Section 405 IPC.

Yours sincerely,
*${d.tenantName}*
Mobile: ${d.tenantPhone}`;
    }

    if (d.noticeType === 'custom' || d.noticeType === 'loan' || d.noticeType === 'builder' || d.noticeType === 'freelance') {
      return `⚖️ *FORMAL PRE-LITIGATION LEGAL DEMAND NOTICE*
*Ref No:* ${d.refNo}
*Date:* ${d.currentDate}

*To:* ${d.landlordName}
*Premises / Transaction Location:* ${d.propertyAddress}
*From:* ${d.tenantName} (Aggrieved Claimant)

*SUBJECT: LEGAL NOTICE UNDER SECTION 73 CONTRACT ACT FOR IMMEDIATE RECOVERY OF ${sym}${amt}/-*

Dear Sir/Madam,

1. That my Client had a valid commercial/contractual arrangement relating to *${d.propertyAddress}*, where dispute and breach arose on *${d.vacateDate}*.
2. You have unlawfully withheld / failed to pay the sum of *${sym}${amt}/-* citing ${d.excuses.join(', ')}.
3. Under Section 73 of the Indian Contract Act, 1872, arbitrary withholding of funds and breach of covenants is an actionable civil wrong subject to 18% commercial interest.

*FINAL DEMAND (15 DAYS):*
You are called upon to remit the sum of *${sym}${amt}/-* with 18% statutory interest within 15 days, failing which formal proceedings before the Competent Civil / Commercial Court will be instituted at your risk and expense.

Yours faithfully,
*${d.tenantName}*
Mobile: ${d.tenantPhone}`;
    }

    // Default Tenancy (India & Global)
    return `⚖️ *FORMAL PRE-LITIGATION LEGAL DEMAND NOTICE*
*Ref No:* ${d.refNo}
*Date:* ${d.currentDate}

*To:* ${d.landlordName} (Landlord / Property Owner)
*Property:* ${d.propertyAddress}
*From:* ${d.tenantName} (Outgoing Tenant)

*SUBJECT: NOTICE FOR IMMEDIATE REFUND OF SECURITY DEPOSIT OF ${sym}${amt}/-*

Dear Sir/Madam,

This is a formal Pre-Litigation Legal Notice under *Section 73 of the Indian Contract Act, 1872* and the *Consumer Protection Act, 2019*.

1. Vacant possession and keys of the rented premises were lawfully handed over on *${d.vacateDate}*.
2. You have unlawfully withheld *${sym}${amt}/-* citing ${d.excuses.join(', ')}.
3. Under *Section 108(m) of the Transfer of Property Act* and established High Court precedents, ordinary weathering, natural wear and tear, and routine painting are strictly the landlord's maintenance obligations and CANNOT be deducted from tenant caution deposits without verifiable proof of deliberate physical vandalism.
4. You have also failed to supply registered GST tax invoices for said deductions.

*FINAL DEMAND:*
You are hereby formally called upon to refund the balance sum of *${sym}${amt}/-* to my bank account / UPI within *SEVEN (7) DAYS* of this notice.

*NOTICE OF CONSEQUENCES:*
Should you fail to remit the refund within 7 days, a formal dispute shall be registered with the *National Consumer Helpline (NCH - 1915)* followed by an official petition via the *e-Jagriti Consumer Portal (https://e-jagriti.gov.in/)* before the District Consumer Disputes Redressal Commission for recovery of the deposit + 18% statutory interest + compensation for mental harassment.

Kindly confirm receipt and transfer the amount to avoid unnecessary litigation costs.

Yours sincerely,
*${d.tenantName}*
Aggrieved Tenant & Claimant
Mobile: ${d.tenantPhone}`;
  }

  function getCountryReminderScript(d, countryCode, stage) {
    const c = COUNTRIES_DB[countryCode || state.country] || COUNTRIES_DB.IN;
    const amt = formatCurrency(d.amountWithheld, c.code);
    const sym = c.currencySymbol;

    if (stage === 4) {
      if (c.code === 'US') {
        return `REMINDER: Formal Demand Letter Ref: ${d.refNo}.
Mr./Ms. ${d.landlordName},
Please note that the 10-day statutory cure period granted in our formal Pre-Litigation Demand Letter expires in 5 DAYS.
Under State Tenancy Code, normal wear and tear cannot be deducted. To avoid Small Claims Court litigation and statutory claim for treble damages (up to 3x deposit amount), please refund the withheld balance of $${amt}.00 immediately.
Sincerely,
${d.tenantName}`;
      }
      if (c.code === 'GB') {
        return `REMINDER: Letter Before Action (LBA) Ref: ${d.refNo}.
Dear ${d.landlordName},
Please note that 5 days remain under the CPR Pre-Action Protocol to return the disputed tenancy deposit balance of £${amt}.00.
Under the Housing Act 2004 and the Tenant Fees Act 2019, failure to refund will trigger an immediate dispute with the Tenancy Deposit Scheme (TDS/DPS) and a County Court claim for up to 3x statutory compensation. Please remit payment immediately.
Yours sincerely,
${d.tenantName}`;
      }
      if (c.code === 'CA') {
        return `REMINDER: Statutory Demand Notice Ref: ${d.refNo}.
Mr./Ms. ${d.landlordName},
Please note that 72 hours remain under our statutory demand window to return $${amt}.00 CAD.
Under provincial tenancy law (Ontario RTA / BC RTA § 38), damage deposits are restricted, and failure to return deposits triggers an automatic double deposit award at the tribunal. Remit the full balance immediately to avoid an LTB/RTB filing.
Sincerely,
${d.tenantName}`;
      }
      if (c.code === 'AU') {
        return `REMINDER: Rental Bond Demand Ref: ${d.refNo}.
Dear Property Manager,
Please approve the 100% bond release of $${amt}.00 AUD on Rental Bonds Online (RBO/RTBA).
Under Section 51/68, tenants are exempt from fair wear and tear. If not finalized within 7 days, a direct claim will be lodged with the State Rental Bond Authority and escalated to NCAT/VCAT.
Regards,
${d.tenantName}`;
      }
      return `REMINDER: Formal Legal Notice Ref: ${d.refNo}.
Mr./Ms. ${d.landlordName},
Please note that the 7-day peremptory deadline stipulated in our formal Pre-Litigation Legal Demand Notice expires in 72 HOURS.
To avoid initiation of proceedings before the District Consumer Disputes Redressal Commission (e-Jagriti: https://e-jagriti.gov.in/) and statutory claim of 18% penal interest under Sec 73 Contract Act, kindly transfer the unlawfully withheld balance of ₹${amt}/- immediately.
Yours sincerely,
${d.tenantName}`;
    }

    // Stage 8 (Timeline Done / Willful Default Notice)
    if (c.code === 'US') {
      return `FINAL STATUTORY DEMAND: 10-DAY WINDOW EXPIRED
Ref: ${d.refNo}
To: ${d.landlordName}
Please be informed that the 10-day notice period granted in our formal Pre-Litigation Demand Letter has officially expired without receipt of our security deposit refund ($${amt}.00).
You are now in willful bad-faith breach of state landlord-tenant statutes.
Our complaint is being filed today in Local Small Claims Court seeking:
1. Return of full deposit principal: $${amt}.00
2. + Statutory Treble Damages (up to 3x deposit) for bad-faith withholding
3. + Court filing fees and accrued statutory interest.
A formal consumer fraud report is also being submitted to the State Attorney General's Consumer Protection Division.
Transfer $${amt}.00 immediately to avoid service of court summons.
Sincerely,
${d.tenantName} (${d.tenantPhone})`;
    }
    if (c.code === 'GB') {
      return `FINAL NOTICE: PRE-ACTION PROTOCOL DEADLINE EXPIRED
Ref: ${d.refNo}
To: ${d.landlordName} / Letting Agent
The 10-day peremptory deadline stipulated under the CPR Pre-Action Protocol has elapsed without payment of our deposit (£${amt}.00).
We are proceeding today with:
1. Formal dispute submission on the Tenancy Deposit Scheme (TDS/DPS) portal.
2. Issuing County Court proceedings via Money Claim Online (Form N1) claiming £${amt}.00 principal + 1x to 3x statutory compensation under Section 214 Housing Act 2004 + court fees.
3. Formal complaint to The Property Ombudsman (TPO) for letting agent misconduct.
Remit £${amt}.00 immediately into our account to prevent further legal costs.
Yours sincerely,
${d.tenantName} (${d.tenantPhone})`;
    }
    if (c.code === 'CA') {
      return `FINAL NOTICE: STATUTORY DEADLINE EXPIRED
Ref: ${d.refNo}
To: ${d.landlordName}
The statutory notice period to return our rental deposit of $${amt}.00 CAD has officially expired.
Our application is being submitted today to:
1. Landlord and Tenant Board (Ontario Form T1) / BC Residential Tenancy Branch seeking full rebate + statutory double deposit penalty.
2. Rental Housing Enforcement Unit (RHEU) to investigate provincial tenancy offenses.
Remit $${amt}.00 CAD immediately to prevent tribunal hearing orders and credit bureau reporting.
Sincerely,
${d.tenantName} (${d.tenantPhone})`;
    }
    if (c.code === 'AU') {
      return `FINAL NOTICE: RENTAL BOND DISPUTE ESCALATED
Ref: ${d.refNo}
To: ${d.landlordName} / Property Manager
The 7-day demand window has closed. A direct tenant claim has been lodged with the State Rental Bond Authority (RBO / RTBA) for 100% bond release of $${amt}.00 AUD.
If you attempt to dispute this without verifiable contractor tax invoices for damage exceeding fair wear and tear, we will proceed immediately to an NCAT / VCAT / QCAT hearing and lodge a complaint with Fair Trading against your agency license.
Regards,
${d.tenantName} (${d.tenantPhone})`;
    }
    // Default India / Global
    return `FINAL STATUTORY DEMAND: 7-DAY TIMELINE EXPIRED
Ref: ${d.refNo}
Mr./Ms. ${d.landlordName},
Please be informed that the 7-day mandatory cure period granted in our formal Pre-Litigation Legal Demand Notice has officially expired without receipt of our security deposit refund.
Consequently, you are now in willful statutory default under Section 73 of the Indian Contract Act, 1872 and Section 35 of the Consumer Protection Act, 2019.
Our formal dispute file is being submitted today to:
1. National Consumer Helpline (NCH Docket 1915).
2. District Consumer Disputes Redressal Commission via e-Jagriti (https://e-jagriti.gov.in/) for recovery of ₹${amt}/- + 18% p.a. interest + ₹1,00,000 compensation for mental harassment.
3. Local Police Station SHO under Section 405/406 IPC (Section 316 BNS) for Criminal Breach of Trust.
If you wish to settle this amicably without facing court summons, transfer the withheld balance of ₹${amt}/- immediately.
Yours sincerely,
${d.tenantName} (${d.tenantPhone})`;
  }

  // Render Interactive Country Law & Process Panel on Landing Page
  function renderCountryLawPanel(countryCode) {
    const c = COUNTRIES_DB[countryCode || state.country] || COUNTRIES_DB.IN;
    const clpHeading = document.getElementById('clpHeading');
    const clpFlag = document.getElementById('clpFlag');
    const clpCountryName = document.getElementById('clpCountryName');
    const clpSubtitle = document.getElementById('clpSubtitle');
    const clpPenaltyBadge = document.getElementById('clpPenaltyBadge');

    if (clpFlag) clpFlag.textContent = c.flag;
    if (clpCountryName) clpCountryName.textContent = c.name;
    if (clpSubtitle) clpSubtitle.textContent = `${c.trustLaws.title} • ${c.trustLaws.sub}`;
    if (clpPenaltyBadge) clpPenaltyBadge.innerHTML = `<i class="fa-solid fa-scale-balanced"></i> ${c.penaltyBadgeText || 'Statutory Tenant Rights'}`;

    // Update active tab buttons
    document.querySelectorAll('.cnt-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.country === c.code);
    });

    // Populate 4 Laws Pillars
    const lawGrid = document.getElementById('clpLawGrid');
    if (lawGrid && c.lawsPillars) {
      lawGrid.innerHTML = '';
      c.lawsPillars.forEach(p => {
        const card = document.createElement('div');
        card.className = 'law-summary-card';
        card.innerHTML = `
          <div class="card-head">
            <i class="fa-solid ${p.icon}"></i>
            <h4>${p.title}</h4>
          </div>
          <p>${p.text}</p>
        `;
        lawGrid.appendChild(card);
      });
    }

    // Populate Roadmap Steps
    const roadSteps = document.getElementById('clpRoadmapSteps');
    if (roadSteps && c.processRoadmap) {
      roadSteps.innerHTML = '';
      c.processRoadmap.forEach(st => {
        const item = document.createElement('div');
        item.className = 'process-step-item';
        item.innerHTML = `
          <span class="step-badge">${st.badge}</span>
          <h5>${st.title}</h5>
          <p>${st.desc}</p>
        `;
        roadSteps.appendChild(item);
      });
    }

    // Populate How It Works vs How It Helps You
    const howWorksDesc = document.getElementById('clpHowItWorksDesc');
    const howHelpsDesc = document.getElementById('clpHowItHelpsDesc');
    if (howWorksDesc) howWorksDesc.textContent = c.howItWorksOverall || '';
    if (howHelpsDesc) howHelpsDesc.textContent = c.howItHelpsOverall || '';

    // Populate Bottom CTA
    const ctaTitle = document.getElementById('clpCtaTitle');
    const ctaSub = document.getElementById('clpCtaSub');
    if (ctaTitle) ctaTitle.textContent = `Ready to Recover Your Deposit in ${c.name}?`;
    if (ctaSub) ctaSub.textContent = `Generate your advocate-grade pre-litigation demand notice with official ${c.name} statutory citations in under 2 minutes.`;
  }

  // Quick Legality Checker Widget (All Fields & Dealerships)
  const deductionSelect = document.getElementById('deductionTypeSelect');
  const verdictStatus = document.getElementById('verdictStatus');
  const verdictExplanation = document.getElementById('verdictExplanation');
  const verdictStatute = document.getElementById('verdictStatute');
  const checkerCategoryTabs = document.getElementById('checkerCategoryTabs');
  const checkerSelectLabel = document.getElementById('checkerSelectLabel');
  const btnDraftFromVerdict = document.getElementById('btnDraftFromVerdict');

  let currentCheckerCat = 'dealership';

  function updateCheckerDropdown(categoryOrData) {
    if (!deductionSelect) return;
    
    // Determine category key
    let catKey = 'dealership';
    if (typeof categoryOrData === 'string' && CHECKER_DISPUTES_DB[categoryOrData]) {
      catKey = categoryOrData;
    } else if (currentCheckerCat && CHECKER_DISPUTES_DB[currentCheckerCat]) {
      catKey = currentCheckerCat;
    }
    currentCheckerCat = catKey;

    const cat = CHECKER_DISPUTES_DB[catKey] || CHECKER_DISPUTES_DB.dealership;

    // Update label
    if (checkerSelectLabel) {
      checkerSelectLabel.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-primary"></i> ${cat.selectLabel}`;
    }

    deductionSelect.innerHTML = '';
    const keys = Object.keys(cat.items);
    keys.forEach((key, idx) => {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = cat.items[key].label || key;
      if (idx === 0) opt.selected = true;
      deductionSelect.appendChild(opt);
    });

    // Populate interactive sub-section chips
    const subChipsContainer = document.getElementById('checkerSubSectionChips');
    if (subChipsContainer) {
      subChipsContainer.innerHTML = '';
      keys.forEach((key, idx) => {
        const item = cat.items[key];
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = `checker-sub-chip ${idx === 0 ? 'active' : ''}`;
        chip.setAttribute('data-key', key);
        chip.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>${item.label || key}</span>`;
        chip.addEventListener('click', () => {
          subChipsContainer.querySelectorAll('.checker-sub-chip').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          deductionSelect.value = key;
          renderCheckerVerdict(key, catKey);
        });
        subChipsContainer.appendChild(chip);
      });
    }

    if (keys.length > 0) {
      renderCheckerVerdict(keys[0], catKey);
    }
  }

  function renderCheckerVerdict(itemKey, categoryKey) {
    const catKey = categoryKey || currentCheckerCat || 'dealership';
    const cat = CHECKER_DISPUTES_DB[catKey] || CHECKER_DISPUTES_DB.dealership;
    const selected = cat.items[itemKey] || Object.values(cat.items)[0];
    if (!selected) return;

    if (verdictStatus) {
      verdictStatus.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> <strong>${selected.status}</strong>`;
    }
    if (verdictExplanation) {
      verdictExplanation.innerHTML = selected.explanation;
    }
    const verdictStatuteText = document.getElementById('verdictStatuteText');
    if (verdictStatuteText) {
      verdictStatuteText.textContent = selected.statutes;
    } else if (verdictStatute) {
      verdictStatute.innerHTML = `<span><i class="fa-solid fa-book-bookmark"></i> Legal Grounds:</span> ${selected.statutes}`;
    }

    // Sync active sub-chip if changed via dropdown
    const subChipsContainer = document.getElementById('checkerSubSectionChips');
    if (subChipsContainer) {
      subChipsContainer.querySelectorAll('.checker-sub-chip').forEach(c => {
        c.classList.toggle('active', c.getAttribute('data-key') === itemKey);
      });
    }
  }

  if (deductionSelect) {
    deductionSelect.addEventListener('change', (e) => {
      renderCheckerVerdict(e.target.value, currentCheckerCat);
    });
  }

  // Wire up category filter tabs
  if (checkerCategoryTabs) {
    const tabBtns = checkerCategoryTabs.querySelectorAll('.check-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.getAttribute('data-category');
        updateCheckerDropdown(cat);
      });
    });
  }

  // Wire up CTA Draft Legal Notice for this Dispute button
  if (btnDraftFromVerdict) {
    btnDraftFromVerdict.addEventListener('click', () => {
      const targetNoticeType = NOTICE_TYPES_DB[currentCheckerCat] ? currentCheckerCat : 'custom';
      applyNoticeType(targetNoticeType, false);
      const genSec = document.getElementById('generatorSection');
      if (genSec) genSec.scrollIntoView({ behavior: 'smooth' });
      showToast(`Selected "${NOTICE_TYPES_DB[targetNoticeType] ? NOTICE_TYPES_DB[targetNoticeType].label : 'Custom'}" Template. Proceed to Step 1!`, 'info');
    });
  }

  // Wire up Step 1 Notice Type Chips and Select
  const noticeTypeChips = document.getElementById('noticeTypeChips');
  if (noticeTypeChips) {
    const chipBtns = noticeTypeChips.querySelectorAll('.notice-chip-btn');
    chipBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const typeKey = btn.getAttribute('data-type');
        applyNoticeType(typeKey, false);
      });
    });
  }

  const noticeTypeSelect = document.getElementById('noticeTypeSelect');
  if (noticeTypeSelect) {
    noticeTypeSelect.addEventListener('change', (e) => {
      applyNoticeType(e.target.value, false);
    });
  }

  const customFieldInput = document.getElementById('customFieldName');
  if (customFieldInput) {
    customFieldInput.addEventListener('input', (e) => {
      state.formData.customFieldName = e.target.value.trim();
    });
  }

  // ==========================================================================
  // Global setCountry Handler & Cookie Helpers
  // ==========================================================================
  function setCookie(name, value, days = 365) {
    try {
      let expires = "";
      if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
      }
      document.cookie = `${name}=${encodeURIComponent(value || "")}${expires}; path=/; SameSite=Lax`;
    } catch (e) { }
  }

  function getCookie(name) {
    try {
      const nameEQ = name + "=";
      const ca = document.cookie.split(';');
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) {
          return decodeURIComponent(c.substring(nameEQ.length, c.length));
        }
      }
    } catch (e) { }
    return null;
  }

  function setCountry(countryCode, silent = false) {
    const validCode = COUNTRIES_DB[countryCode] ? countryCode : 'IN';
    state.country = validCode;
    try {
      localStorage.setItem('ds_country', validCode);
      setCookie('ds_country', validCode, 365);
    } catch (e) { }

    const c = COUNTRIES_DB[validCode];

    // 1. Update Navbar Selector UI
    const navFlag = document.getElementById('navCurrentFlag');
    const navText = document.getElementById('navCurrentCountryText');
    if (navFlag) navFlag.textContent = c.flag;
    if (navText) navText.textContent = `${c.name} (${c.currencySymbol})`;

    const menuItems = document.querySelectorAll('.country-picker-menu .country-item');
    menuItems.forEach(item => {
      item.classList.toggle('active', item.dataset.country === validCode);
    });

    // 2. Update Wizard Step 1 Selector
    const wizSelect = document.getElementById('wizardCountrySelect');
    if (wizSelect && wizSelect.value !== validCode) {
      wizSelect.value = validCode;
    }

    // 3. Logo Badge
    const logoBadge = document.querySelector('.logo-badge');
    if (logoBadge) {
      logoBadge.textContent = validCode === 'IN' ? 'INDIA' : validCode;
    }

    // 4. Hero Section
    const heroBadgeText = document.getElementById('heroBadgeText');
    if (heroBadgeText) heroBadgeText.textContent = c.heroBadge;
    const heroSubtitle = document.getElementById('mainHeroSubtitle');
    if (heroSubtitle) heroSubtitle.innerHTML = c.heroSubtitle;

    // Trust Metrics
    const mVal1 = document.getElementById('metricValue1');
    const mLbl1 = document.getElementById('metricLabel1');
    const mVal3 = document.getElementById('metricValue3');
    const mLbl3 = document.getElementById('metricLabel3');
    if (mVal1) mVal1.textContent = validCode === 'IN' ? '₹24.8 Lakhs+' : (validCode === 'GB' ? '£340,000+' : (validCode === 'CA' ? '$290,000+ CAD' : (validCode === 'AU' ? '$360,000+ AUD' : '$480,000+')));
    if (mLbl1) mLbl1.textContent = 'Recovered by Tenants';
    if (mVal3) mVal3.innerHTML = `${c.starterPriceFormatted} &bull; ${c.proPriceFormatted}`;
    if (mLbl3) mLbl3.textContent = 'Starter Notice &bull; Full Court Kit';

    // 5. Trust Bar
    const tLawH = document.getElementById('trustLawHeading');
    const tLawS = document.getElementById('trustLawSub');
    if (tLawH) tLawH.textContent = c.trustLaws.title;
    if (tLawS) tLawS.textContent = c.trustLaws.sub;

    const tCourtH = document.getElementById('trustCourtHeading');
    const tCourtS = document.getElementById('trustCourtSub');
    if (tCourtH) tCourtH.textContent = c.trustCourt.title;
    if (tCourtS) tCourtS.textContent = c.trustCourt.sub;

    const tStatH = document.getElementById('trustRatingHeading');
    const tStatS = document.getElementById('trustRatingSub');
    if (tStatH) tStatH.textContent = c.trustStats.title;
    if (tStatS) tStatS.textContent = c.trustStats.sub;

    // 6. Legality Checker Widget
    updateCheckerDropdown(c);

    // 7. Wizard Step 1: City & Phone
    const labelCity = document.getElementById('labelTenantCity');
    if (labelCity) labelCity.textContent = c.cityLabel;
    const tenantPhoneInput = document.getElementById('tenantPhone');
    if (tenantPhoneInput) tenantPhoneInput.placeholder = c.phonePlaceholder;
    populateCityDropdown(validCode);

    // 8. Wizard Step 2: Labels with localized Currency
    const step2Icon = document.getElementById('step2CurrencyIcon');
    if (step2Icon) {
      step2Icon.className = validCode === 'IN' ? 'fa-solid fa-indian-rupee-sign' : (validCode === 'GB' ? 'fa-solid fa-sterling-sign' : 'fa-solid fa-dollar-sign');
    }
    const lblDep = document.getElementById('labelDepositPaid');
    if (lblDep) lblDep.textContent = `Total Security Deposit Paid (${c.currencySymbol}) *`;
    const lblRent = document.getElementById('labelMonthlyRent');
    if (lblRent) lblRent.textContent = `Monthly Rent Amount (${c.currencySymbol}) *`;
    const lblRef = document.getElementById('labelAmountRefunded');
    if (lblRef) lblRef.textContent = `Amount Refunded So Far (${c.currencySymbol}, enter 0 if none)`;
    const lblWith = document.getElementById('labelAmountWithheld');
    if (lblWith) lblWith.textContent = `Amount Unlawfully Withheld / Demanded Back (${c.currencySymbol}) *`;

    // Update default input amounts if standard
    const inputDep = document.getElementById('depositPaid');
    const inputRent = document.getElementById('monthlyRent');
    const inputWith = document.getElementById('amountWithheld');
    if (inputDep && (inputDep.value === '100000' || inputDep.value === '2500' || inputDep.value === '1500' || inputDep.value === '2200' || inputDep.value === '2800' || inputDep.value === '2000' || !inputDep.value)) {
      inputDep.value = c.sampleDeposit;
      state.formData.depositPaid = c.sampleDeposit;
    }
    if (inputRent && (inputRent.value === '25000' || inputRent.value === '2000' || inputRent.value === '1200' || inputRent.value === '700' || inputRent.value === '1500' || !inputRent.value)) {
      inputRent.value = c.sampleRent;
      state.formData.monthlyRent = c.sampleRent;
    }
    if (inputWith && (inputWith.value === '45000' || inputWith.value === '1800' || inputWith.value === '850' || inputWith.value === '1500' || inputWith.value === '1600' || inputWith.value === '1200' || !inputWith.value)) {
      inputWith.value = c.sampleWithheld;
      state.formData.amountWithheld = c.sampleWithheld;
    }

    // 9. Wizard Step 3: Legal Strength
    const s3Sub = document.getElementById('step3JurisdictionSub');
    if (s3Sub) s3Sub.textContent = c.step3JurisdictionSub;
    const s3Head = document.getElementById('step3ScoreHeadline');
    if (s3Head) s3Head.textContent = c.step3ScoreHeadline;
    const s3Desc = document.getElementById('step3ScoreDesc');
    if (s3Desc) s3Desc.textContent = c.step3ScoreDesc;

    const s3List = document.getElementById('step3ClausesList');
    if (s3List && c.step3Clauses) {
      s3List.innerHTML = '';
      c.step3Clauses.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `<i class="fa-solid fa-circle-check text-success"></i> <strong>${item.strong}</strong> ${item.text}`;
        s3List.appendChild(li);
      });
    }

    // 10. Wizard Step 4: Plans & Pricing
    const p1Price = document.getElementById('planTier1PriceVal');
    const p1Strike = document.getElementById('planTier1StrikeVal');
    const p1Name = document.getElementById('plan1Name');
    const p1Desc = document.getElementById('plan1Desc');
    const btnP1 = document.getElementById('btnSelectPlanTier1');
    if (p1Price) p1Price.textContent = c.starterPriceFormatted;
    if (p1Strike) p1Strike.textContent = c.starterStrike;
    if (p1Name) p1Name.textContent = c.plan1Name;
    if (p1Desc) p1Desc.textContent = c.plan1Desc;
    if (btnP1) btnP1.innerHTML = `<i class="fa-solid fa-bolt"></i> Pay ${c.starterPriceFormatted} ${validCode === 'IN' ? 'with Razorpay' : 'Securely'}`;

    const p2Price = document.getElementById('planTier2PriceVal');
    const p2Strike = document.getElementById('planTier2StrikeVal');
    const p2Name = document.getElementById('plan2Name');
    const p2Desc = document.getElementById('plan2Desc');
    const btnP2 = document.getElementById('btnSelectPlanTier2');
    if (p2Price) p2Price.textContent = c.proPriceFormatted;
    if (p2Strike) p2Strike.textContent = c.proStrike;
    if (p2Name) p2Name.textContent = c.plan2Name;
    if (p2Desc) p2Desc.textContent = c.plan2Desc;
    if (btnP2) btnP2.innerHTML = `<i class="fa-solid fa-shield-halved"></i> Pay ${c.proPriceFormatted} ${validCode === 'IN' ? 'with Razorpay' : 'Securely'}`;

    const pFeat1 = document.getElementById('planFeaturesTier1');
    if (pFeat1 && c.plan1Features) {
      pFeat1.innerHTML = '';
      c.plan1Features.forEach(txt => {
        const li = document.createElement('li');
        li.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${txt}`;
        pFeat1.appendChild(li);
      });
    }

    const pFeat2 = document.getElementById('planFeaturesTier2');
    if (pFeat2 && c.plan2Features) {
      pFeat2.innerHTML = '';
      c.plan2Features.forEach((txt, idx) => {
        const li = document.createElement('li');
        if (idx === 0) li.className = 'feat-highlight';
        li.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${txt}`;
        pFeat2.appendChild(li);
      });
    }

    // Modal buttons update
    const btnUnlockM = document.getElementById('btnUnlockModal');
    const btnUnlockT2 = document.getElementById('btnUnlockTier2Direct');
    if (btnUnlockM) btnUnlockM.innerHTML = `<i class="fa-solid fa-file-contract"></i> Unlock Starter Notice for ${c.starterPriceFormatted}`;
    if (btnUnlockT2) btnUnlockT2.innerHTML = `<i class="fa-solid fa-crown"></i> Unlock Notice + Court Kit for ${c.proPriceFormatted} <span>FULL SUITE</span>`;

    // 11. Timeline & What's Next Process Section
    const tlTitle = document.getElementById('timelineTitle');
    const tlSub = document.getElementById('timelineSubtitle');
    if (tlTitle) tlTitle.textContent = c.timelineTitle;
    if (tlSub) tlSub.textContent = c.timelineSubtitle;

    if (c.stepper) {
      c.stepper.forEach((st, idx) => {
        const num = idx + 1;
        const dEl = document.getElementById(`tlDay${num}`);
        const tEl = document.getElementById(`tlTitle${num}`);
        const cEl = document.getElementById(`tlDesc${num}`);
        if (dEl) dEl.textContent = st.day;
        if (tEl) tEl.textContent = st.title;
        if (cEl) cEl.textContent = st.desc;
      });
    }

    const tlAlertH = document.getElementById('timelineAlertHeadline');
    const tlAlertB = document.getElementById('timelineAlertBody');
    if (tlAlertH) tlAlertH.textContent = c.alertHeadline;
    if (tlAlertB) tlAlertB.textContent = c.alertBody;

    // Render 4 Action Cards in Timeline (with How It Works & How It Helps You)
    const tlGrid = document.getElementById('timelineActionsGrid');
    if (tlGrid && c.actionCards) {
      tlGrid.innerHTML = '';
      c.actionCards.forEach(act => {
        const card = document.createElement('div');
        card.className = 'timeline-action-card';
        card.innerHTML = `
          <div class="action-card-top">
            <div class="action-card-icon ${act.icon}"><i class="fa-solid ${act.iconClass}"></i></div>
            <div>
              <span class="action-card-badge">${act.badge}</span>
              <h4>${act.title}</h4>
            </div>
          </div>
          <div class="action-card-desc">${act.desc}</div>
          ${(act.howItWorks || act.howItHelps) ? `
          <div class="action-card-body">
            ${act.howItWorks ? `
            <div class="action-how-block how-works">
              <span class="how-tag"><i class="fa-solid fa-gears"></i> How It Works</span>
              <p>${act.howItWorks}</p>
            </div>` : ''}
            ${act.howItHelps ? `
            <div class="action-how-block how-helps">
              <span class="how-tag"><i class="fa-solid fa-shield-halved"></i> How It Helps You</span>
              <p>${act.howItHelps}</p>
            </div>` : ''}
          </div>` : ''}
          <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-top:0.75rem;">
            <a href="${act.btnLink}" ${act.btnLink !== '#' ? 'target="_blank" rel="noopener"' : ''} class="btn-action-trigger ${act.icon}">${act.btnText}</a>
          </div>
        `;
        tlGrid.appendChild(card);
      });
    }

    // Refresh country laws section & roadmap
    renderCountryLawPanel(validCode);

    // Update timeline reminder scripts
    const day4Preview = document.getElementById('previewDay4Script');
    if (day4Preview) {
      day4Preview.textContent = getCountryReminderScript(state.formData, validCode, 4);
    }
    const day8Preview = document.getElementById('previewDay8Script');
    if (day8Preview) {
      day8Preview.textContent = getCountryReminderScript(state.formData, validCode, 8);
    }

    // Refresh notice paper preview if on Step 4
    if (typeof populateLegalDocument === 'function') {
      populateLegalDocument();
    }

    if (!silent) {
      showToast(`Switched jurisdiction to ${c.flag} ${c.name} (${c.currencySymbol})`);
    }
  }

  // ==========================================================================
  // Dynamic City Dropdown & Live Filter Logic
  // ==========================================================================
  const citySelectWrapper = document.getElementById('citySelectWrapper');
  const tenantCityInput = document.getElementById('tenantCity');
  const cityDropdownList = document.getElementById('cityDropdownList');
  const cityChevron = document.getElementById('cityChevron');

  function populateCityDropdown(countryCode) {
    if (!cityDropdownList) return;
    const c = COUNTRIES_DB[countryCode] || COUNTRIES_DB.IN;
    cityDropdownList.innerHTML = '';

    if (c.cityGroups && c.cityGroups.length > 0) {
      c.cityGroups.forEach((grp, gIdx) => {
        const grpLabel = document.createElement('div');
        grpLabel.className = 'dropdown-group-label';
        grpLabel.textContent = grp.label;
        cityDropdownList.appendChild(grpLabel);

        grp.cities.forEach((city, cIdx) => {
          const item = document.createElement('div');
          item.className = 'dropdown-item';
          const curVal = tenantCityInput ? tenantCityInput.value.trim().toLowerCase() : '';
          if (curVal && curVal === city.toLowerCase()) {
            item.classList.add('selected');
          } else if (!curVal && gIdx === 0 && cIdx === 0) {
            item.classList.add('selected');
            if (tenantCityInput) tenantCityInput.value = city;
            state.formData.city = city;
          }
          item.dataset.value = city;
          item.textContent = city;
          cityDropdownList.appendChild(item);
        });
      });
    }

    // Dynamic custom-city option element
    const customPromptEl = document.createElement('div');
    customPromptEl.className = 'dropdown-item custom-city-prompt';
    customPromptEl.id = 'customCityPrompt';
    customPromptEl.style.display = 'none';
    customPromptEl.innerHTML = `<span><i class="fa-solid fa-map-pin"></i> Use custom: <strong id="customCityText"></strong></span> <i class="fa-solid fa-check"></i>`;
    cityDropdownList.appendChild(customPromptEl);
  }

  if (citySelectWrapper && tenantCityInput && cityDropdownList) {
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

      const items = cityDropdownList.querySelectorAll('.dropdown-item:not(.custom-city-prompt)');
      items.forEach(item => {
        if ((item.dataset.value && item.dataset.value.toLowerCase() === val.toLowerCase()) ||
          item.textContent.trim().toLowerCase() === val.toLowerCase()) {
          item.classList.add('selected');
        } else {
          item.classList.remove('selected');
        }
      });

      closeCityDropdown();
    }

    cityDropdownList.addEventListener('click', (e) => {
      const customPrompt = e.target.closest('.custom-city-prompt');
      if (customPrompt) {
        e.stopPropagation();
        const val = tenantCityInput.value.trim();
        if (val) selectCityValue(val);
        return;
      }

      const item = e.target.closest('.dropdown-item');
      if (item) {
        e.stopPropagation();
        selectCityValue(item.dataset.value || item.textContent.trim());
      }
    });

    function filterCities(query) {
      const q = (query || '').toLowerCase().trim();
      const items = cityDropdownList.querySelectorAll('.dropdown-item:not(.custom-city-prompt)');
      const groupLabels = cityDropdownList.querySelectorAll('.dropdown-group-label');
      const customPromptEl = cityDropdownList.querySelector('.custom-city-prompt');

      items.forEach(item => {
        const text = item.textContent.toLowerCase();
        const val = (item.dataset.value || '').toLowerCase();
        if (!q || text.includes(q) || val.includes(q)) {
          item.style.display = 'flex';
        } else {
          item.style.display = 'none';
        }
      });

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

      if (customPromptEl) {
        const customCityText = customPromptEl.querySelector('#customCityText');
        if (q.length > 0) {
          customPromptEl.style.display = 'flex';
          if (customCityText) customCityText.textContent = `"${tenantCityInput.value.trim()}"`;
        } else {
          customPromptEl.style.display = 'none';
        }
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
      const items = cityDropdownList.querySelectorAll('.dropdown-item:not(.custom-city-prompt)');
      items.forEach(item => {
        if (item.style.display !== 'none') visible.push(item);
      });
      const customPromptEl = cityDropdownList.querySelector('.custom-city-prompt');
      if (customPromptEl && customPromptEl.style.display !== 'none') {
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

    document.addEventListener('click', (e) => {
      if (!citySelectWrapper.contains(e.target)) {
        closeCityDropdown();
      }
    });
  }

  // ==========================================================================
  // Country & Currency Switcher Event Listeners
  // ==========================================================================
  const countryPickerWrapper = document.getElementById('countryPickerWrapper');
  const navCountryPickerBtn = document.getElementById('navCountryPickerBtn');
  const navCountryPickerMenu = document.getElementById('navCountryPickerMenu');

  if (navCountryPickerBtn && navCountryPickerMenu) {
    navCountryPickerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      countryPickerWrapper.classList.toggle('open');
    });

    navCountryPickerMenu.addEventListener('click', (e) => {
      const item = e.target.closest('.country-item');
      if (item && item.dataset.country) {
        setCountry(item.dataset.country);
        countryPickerWrapper.classList.remove('open');
      }
    });

    document.addEventListener('click', (e) => {
      if (countryPickerWrapper && !countryPickerWrapper.contains(e.target)) {
        countryPickerWrapper.classList.remove('open');
      }
    });
  }

  // Wizard Step 1 Country Dropdown
  const wizardCountrySelect = document.getElementById('wizardCountrySelect');
  if (wizardCountrySelect) {
    wizardCountrySelect.addEventListener('change', (e) => {
      setCountry(e.target.value);
    });
  }

  // Country Navigation Tabs in #countryLawsSection
  const countryNavTabs = document.getElementById('countryNavTabs');
  if (countryNavTabs) {
    countryNavTabs.addEventListener('click', (e) => {
      const btn = e.target.closest('.cnt-tab-btn');
      if (btn && btn.dataset.country) {
        setCountry(btn.dataset.country);
      }
    });
  }

  // CLP Direct Draft Notice Button
  const btnClpStartNotice = document.getElementById('btnClpStartNotice');
  if (btnClpStartNotice) {
    btnClpStartNotice.addEventListener('click', () => {
      const genSec = document.getElementById('generatorSection');
      if (genSec) genSec.scrollIntoView({ behavior: 'smooth' });
      goToStep(1);
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
    const customFieldName = document.getElementById('customFieldName') ? document.getElementById('customFieldName').value.trim() : '';

    if (!tenantName || !tenantPhone || !landlordName || !propertyAddress || !vacateDate) {
      showToast('Please fill in all mandatory fields (*)', 'error');
      return;
    }

    const cityInput = document.getElementById('tenantCity').value.trim() || 'India';
    state.formData.city = cityInput;
    state.formData.noticeType = state.noticeType || 'dealership';
    state.formData.customFieldName = customFieldName;
    const typePrefix = (state.noticeType || 'dlr').substring(0, 3).toUpperCase();
    state.formData.refNo = 'DS/' + new Date().getFullYear() + '/' + typePrefix + '-' + Math.floor(1000 + Math.random() * 9000);
    state.formData.tenantName = tenantName;
    state.formData.tenantPhone = tenantPhone;
    state.formData.tenantEmail = tenantEmail || 'N/A';
    state.formData.landlordName = landlordName;
    state.formData.landlordPhone = landlordPhone;
    state.formData.propertyAddress = propertyAddress;
    const accommodationTypeEl = document.getElementById('accommodationType');
    state.formData.accommodationType = accommodationTypeEl ? accommodationTypeEl.value : 'Commercial Entity / Dealership';
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
    const monthlyRent = parseFloat(document.getElementById('monthlyRent').value) || 0;
    const amountRefunded = parseFloat(document.getElementById('amountRefunded').value) || 0;
    const amountWithheld = parseFloat(document.getElementById('amountWithheld').value);

    if (isNaN(depositPaid) || isNaN(amountWithheld) || amountWithheld <= 0) {
      showToast('Please enter valid security/claim and withheld amounts', 'error');
      return;
    }

    const excuseBoxes = document.querySelectorAll('input[name="landlordExcuse"]:checked');
    const selectedExcuses = Array.from(excuseBoxes).map(cb => cb.value);

    state.formData.depositPaid = depositPaid;
    state.formData.monthlyRent = monthlyRent;
    state.formData.amountRefunded = amountRefunded;
    state.formData.amountWithheld = amountWithheld;
    state.formData.excuses = selectedExcuses.length > 0 ? selectedExcuses : ['Unjustified arbitrary withholding / breach'];
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
    const curCountry = COUNTRIES_DB[state.country] || COUNTRIES_DB.IN;
    const formattedWithheld = formatCurrency(d.amountWithheld, curCountry.code);
    const formattedDeposit = formatCurrency(d.depositPaid, curCountry.code);
    const reasonsText = d.excuses.join(' and ').toLowerCase();
    const formattedVacate = formatDisplayDate(d.vacateDate);

    // Headers & Meta
    const docRef = document.getElementById('docRefNo');
    if (docRef) docRef.textContent = d.refNo;
    const docDt = document.getElementById('docDate');
    if (docDt) docDt.textContent = d.currentDate;
    const docWithheld = document.getElementById('docWithheldAmount');
    if (docWithheld) docWithheld.textContent = formattedWithheld;

    const docNoticeBadge = document.getElementById('docNoticeBadge');
    if (docNoticeBadge && curCountry.noticeBadge) {
      docNoticeBadge.textContent = curCountry.noticeBadge;
    }
    const docTransmission = document.getElementById('docTransmission');
    if (docTransmission && curCountry.transmission) {
      docTransmission.innerHTML = `<strong>TRANSMISSION:</strong> ${curCountry.transmission}`;
    }
    const curNotice = NOTICE_TYPES_DB[state.noticeType] || NOTICE_TYPES_DB.dealership;
    const docSubject = document.getElementById('docSubject');
    if (docSubject) {
      if (typeof curNotice.noticeSubject === 'function') {
        docSubject.innerHTML = curNotice.noticeSubject(formattedWithheld, d.refNo, curCountry);
      } else if (typeof curCountry.docSubject === 'function') {
        docSubject.innerHTML = curCountry.docSubject(formattedWithheld, d.refNo);
      }
    }

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

    // Dynamic Paragraphs for Selected Legal Notice Type
    const p1 = document.getElementById('docNoticePara1');
    const p2 = document.getElementById('docNoticePara2');
    const bp3 = document.getElementById('docBlurredPara3');
    const bp4 = document.getElementById('docBlurredPara4');
    const bp5 = document.getElementById('docBlurredPara5');
    const up3 = document.getElementById('docUnlockedPara3');
    const up4 = document.getElementById('docUnlockedPara4');
    const up5 = document.getElementById('docUnlockedPara5');
    const legalList = document.getElementById('docLegalActionList');
    const signRole = document.getElementById('docSignRole');
    const signName = document.getElementById('docSignName');

    if (signName) signName.textContent = d.tenantName;
    if (signRole) signRole.textContent = curNotice.docSignRole || 'Aggrieved Claimant & Claimant';

    if (p1 && typeof curNotice.getDocNoticePara1 === 'function') {
      p1.innerHTML = curNotice.getDocNoticePara1(d, formattedDeposit, formattedVacate);
    }
    if (p2 && typeof curNotice.getDocNoticePara2 === 'function') {
      p2.innerHTML = curNotice.getDocNoticePara2(d, formattedDeposit, formattedVacate);
    }
    if (bp3 && typeof curNotice.getDocBlurredPara3 === 'function') {
      bp3.innerHTML = curNotice.getDocBlurredPara3(d, formattedWithheld, reasonsText);
    }
    if (bp4 && typeof curNotice.getDocBlurredPara4 === 'function') {
      bp4.innerHTML = curNotice.getDocBlurredPara4(d, formattedWithheld);
    }
    if (bp5 && typeof curNotice.getDocBlurredPara5 === 'function') {
      bp5.innerHTML = curNotice.getDocBlurredPara5(d);
    }
    if (up3 && typeof curNotice.getDocUnlockedPara3 === 'function') {
      up3.innerHTML = curNotice.getDocUnlockedPara3(d, formattedWithheld, reasonsText);
    }
    if (up4 && typeof curNotice.getDocUnlockedPara4 === 'function') {
      up4.innerHTML = curNotice.getDocUnlockedPara4(d);
    }
    if (up5 && typeof curNotice.getDocUnlockedPara5 === 'function') {
      up5.innerHTML = curNotice.getDocUnlockedPara5(d, formattedWithheld);
    }
    if (legalList && curNotice.docLegalActionList) {
      legalList.innerHTML = '';
      curNotice.docLegalActionList.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        legalList.appendChild(li);
      });
    }

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
      document.getElementById('courtRent').textContent = formatCurrency(d.monthlyRent, curCountry.code);
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
      day4Preview.textContent = getCountryReminderScript(d, curCountry.code, 4);
    }
    const day8Preview = document.getElementById('previewDay8Script');
    if (day8Preview) {
      day8Preview.textContent = getCountryReminderScript(d, curCountry.code, 8);
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
      }).catch(() => { });

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
      }).catch(() => { });

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
    const whatsappText = getCountryDemandMessage(state.formData, state.country);
    navigator.clipboard.writeText(whatsappText);
    showToast('Official legal demand notice copied! Paste directly into chat.');
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
      const text = getCountryReminderScript(state.formData, state.country, 4);
      navigator.clipboard.writeText(text);
      showToast('Follow-up reminder script copied to clipboard!');
    });
  }

  // Copy Day 8 Timeline Expired Warning Script
  const btnCopyDay8Script = document.getElementById('btnCopyDay8Script');
  if (btnCopyDay8Script) {
    btnCopyDay8Script.addEventListener('click', () => {
      const text = getCountryReminderScript(state.formData, state.country, 8);
      navigator.clipboard.writeText(text);
      showToast('Statutory default warning copied to clipboard!');
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

  // ==========================================================================
  // Exit-Intent & Free Legal Consultation Lead Capture
  // ==========================================================================
  const exitModal = document.getElementById('exitIntentModalBackdrop');
  const btnExitClose = document.getElementById('btnExitModalClose');
  const btnFloatingHelp = document.getElementById('btnFloatingHelp');
  const exitForm = document.getElementById('exitLeadForm');
  const exitSuccessMsg = document.getElementById('exitLeadSuccessMsg');

  function openExitModal() {
    if (exitModal) exitModal.classList.remove('hidden');
  }

  function closeExitModal() {
    if (exitModal) exitModal.classList.add('hidden');
  }

  if (btnExitClose) btnExitClose.addEventListener('click', closeExitModal);
  if (exitModal) {
    exitModal.addEventListener('click', (e) => {
      if (e.target === exitModal) closeExitModal();
    });
  }

  if (btnFloatingHelp) {
    btnFloatingHelp.addEventListener('click', openExitModal);
  }

  // Trigger on mouseleave (desktop exit intent)
  document.addEventListener('mouseleave', (e) => {
    if (e.clientY <= 15 && !sessionStorage.getItem('ds_exit_shown')) {
      sessionStorage.setItem('ds_exit_shown', '1');
      openExitModal();
    }
  });

  // Fallback trigger after 40s of user engagement
  setTimeout(() => {
    if (!sessionStorage.getItem('ds_exit_shown')) {
      sessionStorage.setItem('ds_exit_shown', '1');
      openExitModal();
    }
  }, 40000);

  // Handle Form Submission
  if (exitForm) {
    exitForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btnSubmitExitLead');
      const name = document.getElementById('exitLeadName').value.trim();
      const phone = document.getElementById('exitLeadPhone').value.trim();
      const amount = document.getElementById('exitLeadAmount').value;
      const city = document.getElementById('exitLeadCity').value.trim();

      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';

      try {
        await fetch('/api/inquiry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            phone,
            amountWithheld: amount,
            city,
            landlordName: 'Free Legal Check Request',
            message: `Free 60-Second Legal Evaluation requested for ₹${amount} withheld in ${city}.`
          })
        });

        if (exitSuccessMsg) exitSuccessMsg.style.display = 'block';
        btn.style.display = 'none';

        setTimeout(() => {
          closeExitModal();
          const gen = document.getElementById('generatorSection');
          if (gen) gen.scrollIntoView({ behavior: 'smooth' });
        }, 2200);
      } catch (err) {
        if (exitSuccessMsg) exitSuccessMsg.style.display = 'block';
        btn.style.display = 'none';
      }
    });
  }

  // Toast Helper
  function showToast(message, type = 'success') {
    const toast = document.getElementById('toastNotification');
    const toastMsg = document.getElementById('toastMessage');
    toastMsg.textContent = message;

    if (type === 'error') {
      toast.style.background = '#ef4444';
      toast.style.color = '#ffffff';
      toast.style.border = '1px solid #f87171';
    } else if (type === 'info') {
      toast.style.background = '#0f172a';
      toast.style.color = '#38bdf8';
      toast.style.border = '1px solid #0284c7';
    } else {
      toast.style.background = '#10b981';
      toast.style.color = '#ffffff';
      toast.style.border = '1px solid #34d399';
    }

    toast.classList.remove('hidden');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 4000);
  }

  // ==========================================================================
  // First-Visit Country Selector & Cookie Permission Modal
  // ==========================================================================
  function initCountryCookieModal(detectedCountry) {
    const modalBackdrop = document.getElementById('countryCookieModalBackdrop');
    if (!modalBackdrop) return;

    const cards = modalBackdrop.querySelectorAll('.country-modal-card');
    const btnConfirm = document.getElementById('btnConfirmCountryModal');
    const btnClose = document.getElementById('btnCountryModalClose');
    const chkCookie = document.getElementById('chkCookiePermission');

    let currentSelected = detectedCountry || state.country || 'IN';

    function highlightCard(code) {
      cards.forEach(card => {
        const match = card.dataset.country === code;
        card.classList.toggle('active', match);
      });
      currentSelected = code;
    }

    highlightCard(currentSelected);

    cards.forEach(card => {
      card.addEventListener('click', () => {
        const code = card.dataset.country;
        if (code) {
          highlightCard(code);
        }
      });
      card.addEventListener('dblclick', () => {
        const code = card.dataset.country;
        if (code) {
          highlightCard(code);
          if (btnConfirm) btnConfirm.click();
        }
      });
    });

    function closeModal() {
      modalBackdrop.classList.add('hidden');
    }

    function openModal() {
      highlightCard(state.country || detectedCountry || 'IN');
      modalBackdrop.classList.remove('hidden');
    }

    if (btnConfirm) {
      btnConfirm.addEventListener('click', () => {
        const allowCookie = chkCookie ? chkCookie.checked : true;
        try {
          localStorage.setItem('ds_cookie_consent', allowCookie ? 'accepted' : 'declined');
          if (allowCookie) {
            setCookie('ds_cookie_consent', 'accepted', 365);
          }
        } catch (e) { }

        setCountry(currentSelected);
        closeModal();

        const c = COUNTRIES_DB[currentSelected];
        if (c) {
          showToast(`Legal jurisdiction set to ${c.name} (${c.flag} ${c.currencySymbol})`, 'success');
        }
      });
    }

    if (btnClose) {
      btnClose.addEventListener('click', () => {
        try {
          localStorage.setItem('ds_cookie_consent', 'dismissed');
        } catch (e) { }
        closeModal();
      });
    }

    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) {
        try {
          localStorage.setItem('ds_cookie_consent', 'dismissed');
        } catch (e) { }
        closeModal();
      }
    });

    // Check if user has already visited and configured or dismissed
    let hasConsent = null;
    try {
      hasConsent = localStorage.getItem('ds_cookie_consent') || getCookie('ds_cookie_consent');
    } catch (e) { }

    // If first visit, show the modal after 450ms
    if (!hasConsent) {
      setTimeout(() => {
        openModal();
      }, 450);
    }
  }

  // ==========================================================================
  // Initialize Country & City Data on Page Load
  // ==========================================================================
  let initialCountry = 'IN';
  try {
    const saved = localStorage.getItem('ds_country') || getCookie('ds_country');
    if (saved && COUNTRIES_DB[saved]) {
      initialCountry = saved;
    } else {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      if (tz.includes('America/New_York') || tz.includes('America/Chicago') || tz.includes('America/Los_Angeles') || tz.includes('America/Denver') || tz.includes('US/')) {
        initialCountry = 'US';
      } else if (tz.includes('Europe/London') || tz.includes('GB') || tz.includes('Belfast')) {
        initialCountry = 'GB';
      } else if (tz.includes('America/Toronto') || tz.includes('America/Vancouver') || tz.includes('Canada/')) {
        initialCountry = 'CA';
      } else if (tz.includes('Australia/') || tz.includes('Sydney') || tz.includes('Melbourne')) {
        initialCountry = 'AU';
      } else if (tz.includes('Asia/Kolkata') || tz.includes('Calcutta')) {
        initialCountry = 'IN';
      }
    }
  } catch (e) { }

  setCountry(initialCountry, true);
  updateCheckerDropdown('dealership');
  applyNoticeType('dealership', true);
  initCountryCookieModal(initialCountry);
});
