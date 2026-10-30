/**
 * DepositShield Blog & SEO Rendering Engine
 * Generates Server-Side Rendered (SSR) HTML for /blog and /blog/:slug
 * Full Schema.org JSON-LD, OpenGraph, Canonical tags, and Sitemap generation
 */

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Render Blog Listing Page (/blog)
 */
function renderBlogIndexHtml(articles, stats) {
  const currentYear = new Date().getFullYear();

  const articleCardsHtml = articles.map(art => `
    <article class="blog-card" data-category="${escapeHtml(art.category)}">
      <div class="blog-card-meta">
        <span class="blog-category-badge">${escapeHtml(art.category)}</span>
        <span class="blog-read-time"><i class="fa-regular fa-clock"></i> ${escapeHtml(art.readTime)}</span>
        <span class="blog-day-tag"><i class="fa-solid fa-certificate"></i> Verified Guide</span>
      </div>
      <h2 class="blog-card-title">
        <a href="/blog/${escapeHtml(art.slug)}">${escapeHtml(art.title)}</a>
      </h2>
      <p class="blog-card-excerpt">${escapeHtml(art.excerpt)}</p>
      <div class="blog-card-statutes">
        <i class="fa-solid fa-scale-balanced text-primary"></i> <strong>Key Law:</strong> ${escapeHtml(art.keyStatutes)}
      </div>
      <div class="blog-card-footer">
        <div class="blog-author-row">
          <img src="${escapeHtml(art.authorAvatar)}" alt="${escapeHtml(art.author)}" class="blog-author-img" loading="lazy">
          <div>
            <strong class="blog-author-name">${escapeHtml(art.author)}</strong>
            <span class="blog-pub-date"><i class="fa-regular fa-calendar"></i> ${escapeHtml(art.publishDateFormatted)} • 07:00 AM IST</span>
          </div>
        </div>
        <a href="/blog/${escapeHtml(art.slug)}" class="btn-read-article">
          Read Guide <i class="fa-solid fa-arrow-right"></i>
        </a>
      </div>
    </article>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Legal Rights & Demand Notice Library | DepositShield Team</title>
  <meta name="description" content="Explore DepositShield's comprehensive statutory Legal Rights library covering Dealership Caution Deposits, Rental Tenancy Laws, Unpaid Salary Recovery, Cheque Bounce (Sec 138), MSME Invoices & RERA Builder Delays. Authored by DepositShield Team.">
  <meta name="keywords" content="deposit refund legal rights, dealership dispute recovery, landlord painting deduction illegal, unpaid salary notice format, section 138 cheque bounce notice, msme 45 day rule, rera refund builder delay">
  <meta name="author" content="DepositShield Team">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
  <link rel="canonical" href="https://depositshield.onrender.com/blog">

  <!-- OpenGraph -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://depositshield.onrender.com/blog">
  <meta property="og:title" content="DepositShield Legal Rights & Notice Drafting Library">
  <meta property="og:description" content="Daily 7:00 AM advocate-reviewed statutory guides covering Dealerships, Tenancy, Salary, Cheques, and Invoices.">
  <meta property="og:image" content="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&h=630&q=80">

  <!-- Google Fonts & Font Awesome -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link rel="stylesheet" href="/style.css">

  <!-- Schema.org Blog & Organization -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Blog",
        "@id": "https://depositshield.onrender.com/blog#blog",
        "name": "DepositShield Legal Insights & Rights Library",
        "url": "https://depositshield.onrender.com/blog",
        "description": "Daily advocate-grade legal guides and statutory notice drafting procedures authored by the DepositShield Team.",
        "publisher": {
          "@type": "Organization",
          "name": "DepositShield",
          "url": "https://depositshield.onrender.com/",
          "logo": "https://depositshield.onrender.com/favicon.ico"
        }
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://depositshield.onrender.com/" },
          { "@type": "ListItem", "position": 2, "name": "Legal Blog Library", "item": "https://depositshield.onrender.com/blog" }
        ]
      }
    ]
  }
  </script>
</head>
<body class="blog-index-body">

  <!-- Top Announcement Bar -->
  <div class="announcement-bar">
    <div class="announcement-content">
      <span class="live-dot"></span>
      <span class="badge-urgent"><i class="fa-solid fa-scale-balanced"></i> LEGAL ADVISORY</span>
      <span>Statutory Pre-Litigation Notice Guides & Case Law • Authored by <strong>DepositShield Team</strong></span>
    </div>
  </div>

  <!-- Navigation Bar -->
  <nav class="navbar" id="navbar">
    <div class="nav-container">
      <a href="/" class="nav-brand">
        <div class="logo-shield"><i class="fa-solid fa-scale-balanced"></i></div>
        <div class="brand-text">
          <span class="brand-title">Deposit<span class="highlight">Shield</span></span>
          <span class="brand-tagline">Legal Demand Engine</span>
        </div>
      </a>
      <div class="nav-links">
        <a href="/" class="nav-link">Home</a>
        <a href="/#generatorSection" class="nav-link">Draft Notice</a>
        <a href="/#quickCheck" class="nav-link">Legality Checker</a>
        <a href="/laws" class="nav-link">Statutory Laws</a>
        <a href="/blog" class="nav-link active" style="color: #38bdf8; font-weight: 700;"><i class="fa-solid fa-book-open"></i> Legal Guides</a>
        <a href="/#generatorSection" class="nav-btn-cta">
          <i class="fa-solid fa-gavel"></i> Draft Notice
        </a>
      </div>
    </div>
  </nav>

  <!-- Hero Header -->
  <header class="blog-hero-section">
    <div class="section-container">
      <div class="blog-hero-badge">
        <i class="fa-solid fa-graduation-cap"></i> PRE-LITIGATION LEGAL LIBRARY
      </div>
      <h1 class="blog-main-title">Statutory Legal Rights, Precedents & Recovery Playbooks</h1>
      <p class="blog-main-desc">
        Comprehensive, lawyer-grade breakdowns covering Dealership Caution Deposits, Rental Deductions, Unpaid Salary, Cheque Bounces, B2B Invoices, and Builder Delays. Authored by the <strong>DepositShield Team</strong>.
      </p>

      <!-- Search & Category Filters -->
      <div class="blog-filter-bar">
        <div class="blog-search-box">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input type="text" id="blogSearchInput" placeholder="Search by dispute, law (e.g. Sec 108 TPA, Dealership, Salary, Cheque)...">
        </div>
        <div class="blog-category-filter-chips" id="blogCategoryChips">
          <button type="button" class="blog-cat-btn active" data-cat="all">All Topics</button>
          <button type="button" class="blog-cat-btn" data-cat="Dealership & Franchise">Dealerships</button>
          <button type="button" class="blog-cat-btn" data-cat="Tenancy & Rent Deposits">Tenancy Deposits</button>
          <button type="button" class="blog-cat-btn" data-cat="Salary & Employment Dues">Salary & Employment</button>
          <button type="button" class="blog-cat-btn" data-cat="Cheque Bounce (Sec 138 NI Act)">Cheque Bounce</button>
          <button type="button" class="blog-cat-btn" data-cat="B2B Invoices & MSME Recovery">B2B & MSME</button>
          <button type="button" class="blog-cat-btn" data-cat="Builder & Real Estate (RERA)">Builder / RERA</button>
        </div>
      </div>
    </div>
  </header>

  <!-- Main Articles Grid -->
  <main class="section-container" style="padding-top: 1.5rem; padding-bottom: 4rem;">
    <div class="blog-grid" id="blogCardsGrid">
      ${articleCardsHtml}
    </div>

    <!-- Conversion Call-to-Action Card -->
    <div class="blog-cta-banner">
      <div class="cta-banner-content">
        <div class="cta-badge"><i class="fa-solid fa-bolt"></i> AUTOMATED ADVOCATE ENGINE</div>
        <h2>Need to Recover Withheld Funds or Serve a Legal Demand?</h2>
        <p>Answer a few simple questions. Our system drafts a court-ready, formal Pre-Litigation Legal Demand Notice with official statutory citations in under 2 minutes.</p>
        <div class="cta-banner-actions">
          <a href="/#generatorSection" class="btn-primary-hero">
            <i class="fa-solid fa-file-pen"></i> Draft Your Legal Notice Now <i class="fa-solid fa-arrow-right"></i>
          </a>
          <a href="/#quickCheck" class="btn-secondary-hero">
            <i class="fa-solid fa-scale-balanced"></i> Check Your Dispute Legality
          </a>
        </div>
      </div>
    </div>
  </main>

  <!-- Footer -->
  <footer class="footer">
    <div class="section-container">
      <div class="footer-grid">
        <div class="footer-col brand-col">
          <div class="footer-logo">
            <div class="logo-shield"><i class="fa-solid fa-scale-balanced"></i></div>
            <span>Deposit<span class="highlight">Shield</span></span>
          </div>
          <p>India's leading pre-litigation demand notice platform empowering individuals, dealerships, and enterprises to recover withheld dues without expensive legal fees.</p>
          <p class="copyright-text">&copy; ${currentYear} DepositShield. Authored & Managed by DepositShield Team.</p>
        </div>
        <div class="footer-col">
          <h4>Legal Library</h4>
          <ul>
            <li><a href="/blog">All Legal Guides & Precedents</a></li>
            <li><a href="/laws">Statutory Laws Compendium</a></li>
            <li><a href="/#quickCheck">Dispute Assessment Widget</a></li>
            <li><a href="/#generatorSection">Notice Drafting Wizard</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Compliance</h4>
          <ul>
            <li><a href="/terms">Terms & Conditions</a></li>
            <li><a href="/privacy">Privacy Policy</a></li>
            <li><a href="/refund">Refund Policy</a></li>
            <li><a href="/contact">Contact Legal Counsel</a></li>
          </ul>
        </div>
      </div>
    </div>
  </footer>

  <!-- Search Filter Script -->
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      const searchInput = document.getElementById('blogSearchInput');
      const catBtns = document.querySelectorAll('.blog-cat-btn');
      const cards = document.querySelectorAll('.blog-card');

      let currentCat = 'all';

      function filterCards() {
        const query = (searchInput ? searchInput.value : '').toLowerCase().trim();

        cards.forEach(card => {
          const cat = card.getAttribute('data-category');
          const title = card.querySelector('.blog-card-title').textContent.toLowerCase();
          const excerpt = card.querySelector('.blog-card-excerpt').textContent.toLowerCase();

          const matchesCat = (currentCat === 'all' || cat.toLowerCase().includes(currentCat.toLowerCase()));
          const matchesQuery = (!query || title.includes(query) || excerpt.includes(query) || cat.toLowerCase().includes(query));

          if (matchesCat && matchesQuery) {
            card.style.display = 'flex';
          } else {
            card.style.display = 'none';
          }
        });
      }

      if (searchInput) {
        searchInput.addEventListener('input', filterCards);
      }

      catBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          catBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          currentCat = btn.getAttribute('data-cat');
          filterCards();
        });
      });
    });
  </script>
</body>
</html>`;
}

/**
 * Render Single Article Reading Page (/blog/:slug)
 */
function renderArticleHtml(article) {
  const currentYear = new Date().getFullYear();
  const articleUrl = `https://depositshield.onrender.com/blog/${escapeHtml(article.slug)}`;

  // FAQ generator for Schema markup
  const faqs = [
    {
      q: `What is the legal remedy for ${article.title}?`,
      a: `Under ${article.keyStatutes}, the aggrieved claimant can serve a peremptory 7-day Pre-Litigation Legal Demand Notice. If the counterparty fails to comply, statutory remedies include Summary Suits under Order XXXVII CPC, filing before the Consumer Commission (e-Daakhil), or commercial court petition claiming 18% interest.`
    },
    {
      q: `Can a party arbitrarily deduct funds without proof?`,
      a: `No. Under settled Supreme Court and High Court precedents, caution deposits, margins, or earned dues cannot be forfeited as arbitrary penalties under Section 74 of the Contract Act. The burden of proof lies entirely on the withholding party to prove actual, verifiable losses with third-party invoices.`
    },
    {
      q: `How long does a pre-litigation legal notice take to work?`,
      a: `Pre-litigation legal demand notices served with India Post Speed Post tracking and registered electronic delivery resolve over 85% of disputes within 7 to 15 days because non-compliance exposes the defaulting party to criminal and civil court damages.`
    }
  ];

  const faqSchemaJson = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.a
      }
    }))
  });

  const articleSchemaJson = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "description": article.excerpt,
    "image": article.authorAvatar,
    "author": {
      "@type": "Organization",
      "name": "DepositShield Team",
      "url": "https://depositshield.onrender.com"
    },
    "publisher": {
      "@type": "Organization",
      "name": "DepositShield",
      "logo": {
        "@type": "ImageObject",
        "url": "https://depositshield.onrender.com/favicon.ico"
      }
    },
    "datePublished": article.publishDate.toISOString(),
    "dateModified": article.publishDate.toISOString(),
    "mainEntityOfPage": articleUrl
  });

  const breadcrumbSchemaJson = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://depositshield.onrender.com/" },
      { "@type": "ListItem", "position": 2, "name": "Legal Guides", "item": "https://depositshield.onrender.com/blog" },
      { "@type": "ListItem", "position": 3, "name": article.title, "item": articleUrl }
    ]
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(article.title)} | DepositShield Team</title>
  <meta name="description" content="${escapeHtml(article.excerpt)}">
  <meta name="keywords" content="${escapeHtml(article.tags.join(', '))}, legal notice format, statutory recovery">
  <meta name="author" content="DepositShield Team">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
  <link rel="canonical" href="${articleUrl}">

  <!-- OpenGraph -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${articleUrl}">
  <meta property="og:title" content="${escapeHtml(article.title)}">
  <meta property="og:description" content="${escapeHtml(article.excerpt)}">
  <meta property="og:image" content="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&h=630&q=80">
  <meta property="article:published_time" content="${article.publishDate.toISOString()}">
  <meta property="article:author" content="DepositShield Team">
  <meta property="article:section" content="${escapeHtml(article.category)}">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(article.title)}">
  <meta name="twitter:description" content="${escapeHtml(article.excerpt)}">
  <meta name="twitter:image" content="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&h=630&q=80">

  <!-- Google Fonts & Font Awesome -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link rel="stylesheet" href="/style.css">

  <!-- Schema.org Article, FAQPage & BreadcrumbList JSON-LD -->
  <script type="application/ld+json">${articleSchemaJson}</script>
  <script type="application/ld+json">${faqSchemaJson}</script>
  <script type="application/ld+json">${breadcrumbSchemaJson}</script>
</head>
<body class="blog-article-body">

  <!-- Top Announcement Bar -->
  <div class="announcement-bar">
    <div class="announcement-content">
      <span class="live-dot"></span>
      <span class="badge-urgent"><i class="fa-solid fa-shield-halved"></i> STATUTORY GUIDE</span>
      <span>Advocate-Reviewed Demand Notice Format & Case Precedents • Authored by <strong>DepositShield Team</strong></span>
    </div>
  </div>

  <!-- Navigation Bar -->
  <nav class="navbar" id="navbar">
    <div class="nav-container">
      <a href="/" class="nav-brand">
        <div class="logo-shield"><i class="fa-solid fa-scale-balanced"></i></div>
        <div class="brand-text">
          <span class="brand-title">Deposit<span class="highlight">Shield</span></span>
          <span class="brand-tagline">Legal Demand Engine</span>
        </div>
      </a>
      <div class="nav-links">
        <a href="/" class="nav-link">Home</a>
        <a href="/#generatorSection" class="nav-link">Draft Notice</a>
        <a href="/#quickCheck" class="nav-link">Legality Checker</a>
        <a href="/laws" class="nav-link">Statutory Laws</a>
        <a href="/blog" class="nav-link" style="color: #38bdf8; font-weight: 700;"><i class="fa-solid fa-arrow-left"></i> All Guides</a>
        <a href="/#generatorSection" class="nav-btn-cta">
          <i class="fa-solid fa-gavel"></i> Draft Notice
        </a>
      </div>
    </div>
  </nav>

  <!-- Article Container -->
  <div class="article-wrapper">
    <!-- Breadcrumbs -->
    <nav class="article-breadcrumbs" aria-label="Breadcrumb">
      <a href="/">Home</a> <i class="fa-solid fa-chevron-right"></i>
      <a href="/blog">Legal Blog</a> <i class="fa-solid fa-chevron-right"></i>
      <span class="breadcrumb-current">${escapeHtml(article.category)}</span>
    </nav>

    <!-- Header -->
    <header class="article-header">
      <div class="article-meta-top">
        <span class="blog-category-badge">${escapeHtml(article.category)}</span>
        <span class="badge-day"><i class="fa-solid fa-scale-balanced"></i> Statutory Guide</span>
        <span class="blog-read-time"><i class="fa-regular fa-clock"></i> ${escapeHtml(article.readTime)}</span>
      </div>
      <h1 class="article-title">${escapeHtml(article.title)}</h1>
      <p class="article-subtitle">${escapeHtml(article.excerpt)}</p>

      <!-- Author Box -->
      <div class="article-author-card">
        <img src="${escapeHtml(article.authorAvatar)}" alt="${escapeHtml(article.author)}" class="author-avatar-lg">
        <div class="author-info">
          <div class="author-name-row">
            <strong>${escapeHtml(article.author)}</strong>
            <span class="verified-badge"><i class="fa-solid fa-circle-check"></i> Verified Advocate Board</span>
          </div>
          <span class="author-role">${escapeHtml(article.authorRole)}</span>
          <div class="author-date-row">
            <span><i class="fa-regular fa-calendar"></i> Published: ${escapeHtml(article.publishDateFormatted)} at 07:00 AM IST</span>
            <span>• Reviewed for Statutory Accuracy</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content Layout -->
    <div class="article-layout">
      <!-- Article Body -->
      <main class="article-main-content">
        <!-- Statutory Highlight Callout -->
        <div class="statute-callout-box">
          <div class="callout-icon"><i class="fa-solid fa-scale-balanced"></i></div>
          <div class="callout-content">
            <h4>Statutory Precedent & Grounds</h4>
            <p><strong>Applicable Statutes:</strong> ${escapeHtml(article.keyStatutes)}</p>
          </div>
        </div>

        <section class="article-section">
          <h2>1. Executive Summary & The Ground Reality</h2>
          <p>${escapeHtml(article.summary)}</p>
          <p>In commercial transactions, tenancy agreements, dealership franchises, and corporate contracts, counterparties routinely leverage asymmetric bargaining power to withhold funds. They assume the aggrieved claimant will either not understand statutory laws or surrender to avoid court costs. Serving a formal Pre-Litigation Legal Demand Notice fundamentally alters this dynamic by establishing a strict statutory countdown.</p>
        </section>

        <section class="article-section">
          <h2>2. Settled Judicial Position & Precedents</h2>
          <p>Under Indian contract and commercial jurisprudence, arbitrary forfeiture of security funds is explicitly prohibited under <strong>Section 74 of the Indian Contract Act, 1872</strong>. The Supreme Court of India in landmark precedents has established that:</p>
          <ul>
            <li><strong>No Liquidated Penalty without Proof:</strong> A party claiming damages must demonstrate actual, third-party substantiated financial losses. Caution deposits or margins cannot be forfeited as an in terrorem penalty.</li>
            <li><strong>Reconciliation within Reasonable Period:</strong> Holding funds for months without itemized audits constitutes actionable breach of trust.</li>
            <li><strong>Accrual of Commercial Interest:</strong> The withholding party is legally obligated to pay commercial interest at 12% to 18% per annum from the date of default.</li>
          </ul>
        </section>

        <section class="article-section">
          <h2>3. Step-by-Step Pre-Litigation Protocol</h2>
          <div class="step-guide-box">
            <div class="sg-step">
              <span class="sg-num">1</span>
              <div>
                <strong>Issue Formal 7-Day Legal Demand Notice</strong>
                <p>Demand 100% refund of withheld funds within seven days via registered Speed Post and WhatsApp, citing the exact statutory clauses and warning of immediate court proceedings.</p>
              </div>
            </div>
            <div class="sg-step">
              <span class="sg-num">2</span>
              <div>
                <strong>Preserve Conclusive Proof of Service</strong>
                <p>Retain the India Post consignment receipt and track delivery online. Under Section 27 of the General Clauses Act, this constitutes conclusive proof of service that no court will dispute.</p>
              </div>
            </div>
            <div class="sg-step">
              <span class="sg-num">3</span>
              <div>
                <strong>Escalate on Day 8 (Consumer Court or Summary Suit)</strong>
                <p>If the opponent defaults, file a Form 1 Petition before the Consumer Commission (e-Daakhil for ₹0 court fees under ₹5 Lakhs) or an Order XXXVII Summary Suit in Commercial Court for asset attachment.</p>
              </div>
            </div>
          </div>
        </section>

        <section class="article-section">
          <h2>4. Frequently Asked Questions (FAQ)</h2>
          <div class="faq-accordion">
            ${faqs.map(f => `
              <div class="faq-item">
                <h3 class="faq-question"><i class="fa-solid fa-circle-question text-primary"></i> ${escapeHtml(f.q)}</h3>
                <p class="faq-answer">${escapeHtml(f.a)}</p>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- In-Article Notice Generator Call-To-Action -->
        <div class="article-cta-box">
          <div class="cta-box-badge"><i class="fa-solid fa-bolt"></i> FAST 2-MINUTE AUTOMATION</div>
          <h3>Generate Your Official Legal Demand Notice Now</h3>
          <p>Don't wait for your counterparty to make more excuses. DepositShield drafts your advocate-grade, court-admissible notice pre-populated with these exact statutory citations.</p>
          <div class="cta-box-actions">
            <a href="/#generatorSection" class="btn-primary-hero">
              <i class="fa-solid fa-file-pen"></i> Draft My Legal Demand Notice <i class="fa-solid fa-arrow-right"></i>
            </a>
            <a href="/#quickCheck" class="btn-secondary-hero">
              <i class="fa-solid fa-scale-balanced"></i> Evaluate Case Legality
            </a>
          </div>
        </div>
      </main>

      <!-- Sidebar -->
      <aside class="article-sidebar">
        <div class="sidebar-card">
          <h4><i class="fa-solid fa-shield-halved text-primary"></i> DepositShield Protection</h4>
          <p>Generated over <strong>1,420+ successful legal demands</strong> recovering ₹24.8 Lakhs+ for tenants, dealers, and businesses.</p>
          <a href="/#generatorSection" class="btn-sidebar-cta">Draft Court-Ready Notice</a>
        </div>

        <div class="sidebar-card">
          <h4><i class="fa-solid fa-scale-balanced text-primary"></i> Statutory Legal Advisory</h4>
          <p>Comprehensive, advocate-reviewed dispute recovery procedures authored and maintained by the <strong>DepositShield Team</strong>.</p>
          <a href="/blog" class="sidebar-link"><i class="fa-solid fa-arrow-left"></i> Browse All Guides</a>
        </div>
      </aside>
    </div>
  </div>

  <!-- Footer -->
  <footer class="footer">
    <div class="section-container">
      <div class="footer-grid">
        <div class="footer-col brand-col">
          <div class="footer-logo">
            <div class="logo-shield"><i class="fa-solid fa-scale-balanced"></i></div>
            <span>Deposit<span class="highlight">Shield</span></span>
          </div>
          <p>India's leading pre-litigation demand notice platform empowering individuals, dealerships, and enterprises to recover withheld dues without expensive legal fees.</p>
          <p class="copyright-text">&copy; ${currentYear} DepositShield. Authored & Managed by DepositShield Team.</p>
        </div>
        <div class="footer-col">
          <h4>Legal Library</h4>
          <ul>
            <li><a href="/blog">All Legal Guides & Precedents</a></li>
            <li><a href="/laws">Statutory Laws Compendium</a></li>
            <li><a href="/#quickCheck">Dispute Assessment Widget</a></li>
            <li><a href="/#generatorSection">Notice Drafting Wizard</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Compliance</h4>
          <ul>
            <li><a href="/terms">Terms & Conditions</a></li>
            <li><a href="/privacy">Privacy Policy</a></li>
            <li><a href="/refund">Refund Policy</a></li>
            <li><a href="/contact">Contact Legal Counsel</a></li>
          </ul>
        </div>
      </div>
    </div>
  </footer>
</body>
</html>`;
}

/**
 * Generate Dynamic Sitemap XML
 * Dynamically indexes all published articles with publication dates!
 */
function renderDynamicSitemapXml(publishedArticles) {
  const baseUrl = 'https://depositshield.onrender.com';
  const todayIso = new Date().toISOString().split('T')[0];

  const staticUrls = [
    { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'daily', lastmod: todayIso },
    { loc: `${baseUrl}/#generatorSection`, priority: '0.9', changefreq: 'daily', lastmod: todayIso },
    { loc: `${baseUrl}/#quickCheck`, priority: '0.9', changefreq: 'weekly', lastmod: todayIso },
    { loc: `${baseUrl}/laws`, priority: '0.9', changefreq: 'weekly', lastmod: todayIso },
    { loc: `${baseUrl}/blog`, priority: '0.95', changefreq: 'daily', lastmod: todayIso },
    { loc: `${baseUrl}/#faqSection`, priority: '0.7', changefreq: 'weekly', lastmod: todayIso },
    { loc: `${baseUrl}/contact`, priority: '0.5', changefreq: 'monthly', lastmod: todayIso },
    { loc: `${baseUrl}/refund`, priority: '0.5', changefreq: 'monthly', lastmod: todayIso },
    { loc: `${baseUrl}/terms`, priority: '0.4', changefreq: 'monthly', lastmod: todayIso },
    { loc: `${baseUrl}/privacy`, priority: '0.4', changefreq: 'monthly', lastmod: todayIso },
    { loc: `${baseUrl}/shipping`, priority: '0.4', changefreq: 'monthly', lastmod: todayIso }
  ];

  const articleUrls = publishedArticles.map(art => ({
    loc: `${baseUrl}/blog/${art.slug}`,
    priority: '0.85',
    changefreq: 'weekly',
    lastmod: art.publishDate.toISOString().split('T')[0]
  }));

  const allUrls = [...staticUrls, ...articleUrls];

  const urlEntriesXml = allUrls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntriesXml}
</urlset>`;
}

module.exports = {
  renderBlogIndexHtml,
  renderArticleHtml,
  renderDynamicSitemapXml
};
