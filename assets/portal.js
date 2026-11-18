/* Portal Bendungan Selorejo — Perum Jasa Tirta I
 * Shared Interactive Runtime + Enterprise Linked Telemetry Charts
 */
(function () {
  'use strict';

  const DATA = window.SELOREJO_DATA || { pages: [], documents: [], pubcharts: {}, technicalPreviewSpecs: [], rtowSnapshot: null };
  const ROOT = document.documentElement.getAttribute('data-root') || '';

  function resolveUrl(slug) {
    if (window.SELOREJO_GAS_MODE) {
      const clean = String(slug || '').replace(/^\/+|\/+$/g, '') || 'beranda';
      return `?page=${encodeURIComponent(clean)}`;
    }
    if (!slug) return ROOT || './';
    return `${ROOT}${slug.replace(/\/?$/, '/')}`;
  }

  function fmtId(val, digits = 2) {
    if (val === null || val === undefined || Number.isNaN(Number(val))) return '—';
    return Number(val).toFixed(digits).replace('.', ',');
  }

  /* 1. STICKY HEADER ELEVATION, DROPDOWNS, MOBILE DRAWER & INLINE SEARCH */
  function initNavigationAndSearch() {
    const header = document.querySelector('.header-bar');
    if (header) {
      const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 12);
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    const dropdownBtns = Array.from(document.querySelectorAll('.nav-dropdown-btn'));
    const closeAllDropdowns = () => {
      dropdownBtns.forEach((btn) => {
        btn.setAttribute('aria-expanded', 'false');
        const panel = document.getElementById(btn.getAttribute('aria-controls'));
        if (panel) panel.classList.remove('is-open');
      });
    };

    let hoverCloseTimer = null;
    dropdownBtns.forEach((btn) => {
      const parentItem = btn.closest('.nav-item');
      const panel = document.getElementById(btn.getAttribute('aria-controls'));
      if (!parentItem || !panel) return;
      const openThis = () => {
        clearTimeout(hoverCloseTimer);
        closeAllDropdowns();
        btn.setAttribute('aria-expanded', 'true');
        panel.classList.add('is-open');
      };

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = btn.getAttribute('aria-expanded') === 'true';
        if (isOpen) closeAllDropdowns();
        else openThis();
      });

      parentItem.addEventListener('mouseenter', () => {
        if (window.matchMedia('(hover: hover)').matches && window.innerWidth >= 1080) {
          openThis();
        }
      });
      parentItem.addEventListener('mouseleave', () => {
        if (window.matchMedia('(hover: hover)').matches && window.innerWidth >= 1080) {
          clearTimeout(hoverCloseTimer);
          hoverCloseTimer = setTimeout(closeAllDropdowns, 140);
        }
      });
    });

    document.addEventListener('click', closeAllDropdowns);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAllDropdowns();
    });

    const hBtn = document.getElementById('hamburgerToggle');
    const drawer = document.getElementById('mobileDrawer');
    if (hBtn && drawer) {
      drawer.hidden = false;
      drawer.setAttribute('aria-hidden', 'true');
      hBtn.addEventListener('click', () => {
        const expanded = hBtn.getAttribute('aria-expanded') === 'true';
        hBtn.setAttribute('aria-expanded', String(!expanded));
        drawer.classList.toggle('is-open', !expanded);
        drawer.setAttribute('aria-hidden', String(expanded));
      });
    }

    const searchBtn = document.getElementById('searchToggleBtn');
    const searchDrawer = document.getElementById('quickSearchDrawer');
    const searchInput = document.getElementById('quickSearchInput');
    const searchClear = document.getElementById('quickSearchClear');
    const searchClose = document.getElementById('quickSearchClose');
    const searchResults = document.getElementById('quickSearchResults');

    if (searchBtn && searchDrawer && searchInput && searchResults) {
      const renderResults = (queryText) => {
        const term = queryText.trim().toLowerCase();
        const pageItems = (DATA.pages || []).map((p) => ({
          title: p.title,
          href: resolveUrl(p.slug),
          tag: 'Halaman Portal',
          external: false,
          searchable: `${p.title} ${p.desc} ${(p.tags || []).join(' ')}`.toLowerCase()
        }));
        const docItems = (DATA.documents || []).map((d) => ({
          title: d.title,
          href: d.href,
          tag: d.kind,
          external: true,
          searchable: `${d.title} ${d.category} ${d.desc}`.toLowerCase()
        }));
        const combined = pageItems.concat(docItems);
        const matches = term
          ? combined.filter((item) => item.searchable.includes(term)).slice(0, 7)
          : combined.slice(0, 5);

        searchResults.innerHTML = '';
        if (matches.length === 0) {
          const li = document.createElement('li');
          li.className = 'search-result-item';
          const box = document.createElement('div');
          box.className = 'search-result-link';
          box.textContent = 'Tidak ditemukan halaman atau dokumen yang cocok dengan kata kunci tersebut.';
          li.appendChild(box);
          searchResults.appendChild(li);
          return;
        }

        matches.forEach((item, idx) => {
          const li = document.createElement('li');
          li.className = 'search-result-item';
          li.style.animationDelay = `${idx * 28}ms`;
          const a = document.createElement('a');
          a.className = 'search-result-link';
          a.href = item.href;
          if (item.external) {
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
          }
          a.innerHTML = `
            <span class="search-result-title">${item.title}</span>
            <span class="search-result-meta">
              <span>${item.tag}</span>
              <svg class="icon icon-sm search-result-arrow" viewBox="0 0 24 24" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </span>
          `;
          li.appendChild(a);
          searchResults.appendChild(li);
        });
      };

      const toggleSearch = (open) => {
        if (open) {
          searchDrawer.hidden = false;
          requestAnimationFrame(() => searchDrawer.classList.add('is-open'));
          searchBtn.setAttribute('aria-expanded', 'true');
          renderResults(searchInput.value);
          setTimeout(() => searchInput.focus(), 60);
        } else {
          searchDrawer.classList.remove('is-open');
          searchBtn.setAttribute('aria-expanded', 'false');
          setTimeout(() => {
            if (!searchDrawer.classList.contains('is-open')) searchDrawer.hidden = true;
          }, 260);
        }
      };

      searchBtn.addEventListener('click', () => toggleSearch(!searchDrawer.classList.contains('is-open')));
      if (searchClose) {
        searchClose.addEventListener('click', () => {
          toggleSearch(false);
          searchBtn.focus();
        });
      }
      searchInput.addEventListener('input', () => renderResults(searchInput.value));
      if (searchClear) {
        searchClear.addEventListener('click', () => {
          searchInput.value = '';
          renderResults('');
          searchInput.focus();
        });
      }

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          closeAllDropdowns();
          if (drawer && drawer.classList.contains('is-open')) {
            drawer.classList.remove('is-open');
            drawer.hidden = true;
            if (hBtn) {
              hBtn.setAttribute('aria-expanded', 'false');
              hBtn.focus();
            }
          }
          if (!searchDrawer.hidden) {
            toggleSearch(false);
            searchBtn.focus();
          }
        }
      });
    }
  }

  /* 2. LAMINAR SCROLL REVEAL */
  function initScrollReveal() {
    const items = Array.from(document.querySelectorAll('[data-reveal]'));
    if (items.length === 0) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-revealed'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -24px 0px' }
    );

    items.forEach((el) => observer.observe(el));
  }

  /* 3. BACK TO TOP */
  function initBackToTop() {
    const btn = document.getElementById('backToTopBtn');
    if (!btn) return;
    const toggle = () => btn.classList.toggle('is-visible', window.scrollY > 420);
    toggle();
    window.addEventListener('scroll', toggle, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* 4. HERO SHOWCASE CAROUSEL + FLOATING GLASSMORPHIC HOVER EDGE BUTTONS */
  function initHeroShowcase() {
    const showcase = document.getElementById('heroShowcase');
    const slides = Array.from(document.querySelectorAll('.hero-slide'));
    const dots = Array.from(document.querySelectorAll('.hero-dot'));
    const pauseBtn = document.getElementById('heroPauseBtn');
    const pauseLabel = document.getElementById('heroPauseLabel');
    const pauseIcon = document.getElementById('heroPauseIcon');
    const prevBtn = document.getElementById('heroPrevBtn');
    const nextBtn = document.getElementById('heroNextBtn');
    const indexEl = document.getElementById('heroIndex');
    const labelEl = document.getElementById('heroFrameLabel');
    const progressFill = document.getElementById('heroProgressFill');

    if (!showcase || slides.length === 0) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let current = 0;
    let isPaused = reducedMotion;
    let timer = null;

    const updateUI = () => {
      slides.forEach((s, idx) => s.classList.toggle('is-active', idx === current));
      dots.forEach((d, idx) => d.setAttribute('aria-selected', String(idx === current)));
      if (indexEl) {
        indexEl.textContent = `${String(current + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
      }
      if (labelEl) {
        labelEl.textContent = slides[current].getAttribute('data-frame-label') || '';
      }
      if (progressFill) {
        progressFill.style.width = `${((current + 1) / slides.length) * 100}%`;
      }
      if (pauseBtn && pauseLabel && pauseIcon) {
        pauseBtn.setAttribute('aria-pressed', String(isPaused));
        pauseLabel.textContent = isPaused ? 'Putar' : 'Jeda';
        pauseIcon.innerHTML = isPaused
          ? '<polygon points="6,4 20,12 6,20"></polygon>'
          : '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>';
      }
    };

    const goTo = (idx) => {
      current = (idx + slides.length) % slides.length;
      updateUI();
    };

    const stopTimer = () => {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    };

    const startTimer = () => {
      stopTimer();
      if (!isPaused && !reducedMotion) {
        timer = window.setInterval(() => goTo(current + 1), 6500);
      }
    };

    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        isPaused = !isPaused;
        updateUI();
        if (isPaused) stopTimer();
        else startTimer();
      });
    }
    if (prevBtn) prevBtn.addEventListener('click', () => { goTo(current - 1); startTimer(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { goTo(current + 1); startTimer(); });
    dots.forEach((dot, idx) => {
      dot.addEventListener('click', () => { goTo(idx); startTimer(); });
    });

    showcase.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { goTo(current - 1); startTimer(); }
      if (e.key === 'ArrowRight') { goTo(current + 1); startTimer(); }
    });
    showcase.addEventListener('mouseenter', stopTimer);
    showcase.addEventListener('mouseleave', startTimer);
    showcase.addEventListener('focusin', stopTimer);
    showcase.addEventListener('focusout', startTimer);

    updateUI();
    startTimer();
  }

  /* 5. DIRECTLY EMBEDDED INTERACTIVE MAP MODE SWITCHER */
  function initMapsSwitchers() {
    const containers = Array.from(document.querySelectorAll('[data-map-widget]'));
    containers.forEach((box) => {
      const iframe = box.querySelector('iframe.map-live-iframe');
      const readout = box.querySelector('[data-map-readout]');
      const modeBtns = Array.from(box.querySelectorAll('[data-map-mode]'));
      if (!iframe || modeBtns.length === 0) return;

      modeBtns.forEach((mBtn) => {
        mBtn.addEventListener('click', () => {
          const mode = mBtn.getAttribute('data-map-mode') || 'pin';
          modeBtns.forEach((b) => b.setAttribute('aria-selected', String(b === mBtn)));
          if (mode === 'mymaps') {
            iframe.src = DATA.myMapsEmbedUrl;
            iframe.title = 'Peta Wilayah Google My Maps Bendungan Selorejo';
            if (readout) readout.textContent = 'Layer: Google My Maps (Mode Baca-Saja)';
          } else {
            iframe.src = DATA.mapsEmbedUrl;
            iframe.title = 'Peta Google Maps Bendungan Selorejo (-7.8737944, 112.3563645)';
            if (readout) readout.textContent = 'Koordinat Pin: -7.8737944, 112.3563645';
          }
        });
      });
    });
  }

  /* 6. SYNCHRONIZED HYDROLOGICAL MONITORING DASHBOARD (REAL GOOGLE SHEETS DATA + GAS LIVE SYNC) */
  function computePieDataForRow(row) {
    if (!row) return [];
    const hasActual = row.elAktual !== null && row.elAktual !== undefined;
    const elVal = hasActual ? Number(row.elAktual) : Number(row.elRencana);
    const lwlNormal = Number(row.lwlNormal || 606.0);
    const hwl = Number(row.hwl || 622.0);
    const span = Math.max(hwl - lwlNormal, 1);
    const fillRatio = Math.min(Math.max((elVal - lwlNormal) / span, 0), 1);
    const remRatio = Math.max(1 - fillRatio, 0);
    const headroomM = Math.max(hwl - elVal, 0);
    return [
      {
        label: hasActual ? `El. Aktual (${row.periode})` : `El. Rencana (${row.periode})`,
        value: elVal,
        formatted: fmtId(elVal),
        metricLabel: `El. ${fmtId(elVal)} m`,
        pct: fillRatio,
        pctText: `${fmtId(fillRatio * 100, 2)}%`
      },
      {
        label: `Ruang ke HWL (622 m) · LWL ${fmtId(lwlNormal)} m`,
        value: lwlNormal,
        formatted: fmtId(lwlNormal),
        metricLabel: `+${fmtId(headroomM)} m tersisa`,
        pct: remRatio,
        pctText: `${fmtId(remRatio * 100, 2)}%`
      }
    ];
  }

  function createDonutController(container, legendEl, centerValEl, centerLabelEl) {
    if (!container) return { update: () => {} };

    const colors = ['#0C3E8D', '#238593'];
    const radius = 84;
    const cx = 115;
    const cy = 115;
    const strokeW = 28;
    const circ = 2 * Math.PI * radius;
    let currentData = [];
    let activeIdx = 0;

    container.innerHTML = `
      <svg viewBox="0 0 230 230" width="230" height="230" role="img" aria-label="Grafik donat perbandingan elevasi terhadap batas maksimum dan minimum">
        <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="#E2E8F0" stroke-width="${strokeW}" />
        <circle class="donut-seg" data-slice-idx="0" cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${colors[0]}" stroke-width="${strokeW}" stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})" style="cursor:pointer; transition: stroke-dasharray 280ms cubic-bezier(0.22, 1, 0.36, 1), stroke-dashoffset 280ms cubic-bezier(0.22, 1, 0.36, 1), stroke-width 180ms ease, opacity 180ms ease;" />
        <circle class="donut-seg" data-slice-idx="1" cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${colors[1]}" stroke-width="${strokeW}" stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})" style="cursor:pointer; transition: stroke-dasharray 280ms cubic-bezier(0.22, 1, 0.36, 1), stroke-dashoffset 280ms cubic-bezier(0.22, 1, 0.36, 1), stroke-width 180ms ease, opacity 180ms ease;" />
      </svg>
    `;

    const segs = Array.from(container.querySelectorAll('circle.donut-seg'));

    const setFocusSlice = (idx) => {
      activeIdx = idx;
      const s = currentData[idx] || currentData[0];
      if (!s) return;
      if (centerValEl) centerValEl.textContent = s.pctText || `${fmtId(s.pct * 100, 2)}%`;
      if (centerLabelEl) centerLabelEl.textContent = s.metricLabel || `El. ${s.formatted || fmtId(s.value)} m`;
      segs.forEach((c, cIdx) => {
        c.setAttribute('stroke-width', cIdx === idx ? '33' : '26');
        c.style.opacity = cIdx === idx ? '1' : '0.8';
      });
      if (legendEl) {
        Array.from(legendEl.children).forEach((li, lIdx) => {
          li.classList.toggle('is-highlighted', lIdx === idx);
        });
      }
    };

    segs.forEach((c, idx) => {
      c.addEventListener('mouseenter', () => setFocusSlice(idx));
      c.addEventListener('click', () => setFocusSlice(idx));
    });

    const update = (pieData) => {
      if (!pieData || pieData.length === 0) return;
      currentData = pieData;
      let offset = 0;
      pieData.forEach((slice, idx) => {
        const c = segs[idx];
        if (!c) return;
        const segLen = slice.pct * circ;
        const gap = slice.pct >= 0.999 || slice.pct <= 0.001 ? 0 : 3.5;
        const dashLen = Math.max(segLen - gap, slice.pct > 0 ? 4 : 0);
        c.setAttribute('stroke-dasharray', `${dashLen.toFixed(2)} ${Math.max(circ - dashLen, 0).toFixed(2)}`);
        c.setAttribute('stroke-dashoffset', (-offset).toFixed(2));
        offset += segLen;
      });

      if (legendEl) {
        if (legendEl.children.length !== pieData.length) {
          legendEl.innerHTML = '';
          pieData.forEach((_, idx) => {
            const li = document.createElement('li');
            li.className = 'donut-legend-item';
            li.tabIndex = 0;
            li.innerHTML = `
              <span class="donut-legend-label">
                <span class="chart-swatch" style="background-color:${colors[idx % colors.length]};" aria-hidden="true"></span>
                <span class="dl-label-text"></span>
              </span>
              <span class="donut-legend-vals">
                <strong class="dl-val-text"></strong>
                <span class="dl-pct-text" style="color:var(--ink-muted); font-size:var(--t-xs);"></span>
              </span>
            `;
            li.addEventListener('mouseenter', () => setFocusSlice(idx));
            li.addEventListener('focus', () => setFocusSlice(idx));
            li.addEventListener('click', () => setFocusSlice(idx));
            legendEl.appendChild(li);
          });
        }
        Array.from(legendEl.children).forEach((li, idx) => {
          const s = pieData[idx];
          if (!s) return;
          li.querySelector('.dl-label-text').textContent = s.label;
          li.querySelector('.dl-val-text').textContent = s.metricLabel || `El. ${s.formatted || fmtId(s.value)} m`;
          li.querySelector('.dl-pct-text').textContent = `(${s.pctText})`;
        });
      }

      setFocusSlice(activeIdx);
    };

    return { update, setFocusSlice };
  }

  function populateTelemetrySummaryForRow(row, meta = {}) {
    if (!row) return;
    const hasActual = row.elAktual !== null && row.elAktual !== undefined;
    const elVal = hasActual ? Number(row.elAktual) : Number(row.elRencana);
    const inVal = row.inAktual !== null && row.inAktual !== undefined ? row.inAktual : row.inRencana;
    const outVal = row.outAktual !== null && row.outAktual !== undefined ? row.outAktual : row.outRencana;

    const statusBadge = meta.previewing
      ? `Meninjau ${row.periode}${hasActual ? '' : ' (Rencana)'} · Arahkan ke periode lain`
      : meta.pinned
        ? `Terkunci pada ${row.periode}${hasActual ? '' : ' (Rencana)'} · Klik grafik untuk lepas`
        : `Data Terkini: ${row.periode} (RTOW 2026/2027)`;

    const mapText = {
      kpiElAktual: `${fmtId(elVal)} m dpl${hasActual ? '' : ' (Renc.)'}`,
      kpiElRencana: hasActual
        ? `Rencana ${row.periode}: ${fmtId(row.elRencana)} m`
        : `Simulasi rencana ${row.periode} · aktual belum terbit`,
      kpiInflow: `${fmtId(inVal)} m³/det${row.inAktual !== null && row.inAktual !== undefined ? '' : ' (Renc.)'}`,
      kpiInflowSub: `Rencana: ${fmtId(row.inRencana)} m³/det`,
      kpiOutflow: `${fmtId(outVal)} m³/det${row.outAktual !== null && row.outAktual !== undefined ? '' : ' (Renc.)'}`,
      kpiOutflowSub: `Rencana: ${fmtId(row.outRencana)} m³/det`,
      kpiBona: `${fmtId(row.bonaBawah)} – ${fmtId(row.bonaAtas)} m`,
      kpiPeriodePill: statusBadge
    };

    Object.entries(mapText).forEach(([id, txt]) => {
      document.querySelectorAll(`[data-tel="${id}"]`).forEach((el) => { el.textContent = txt; });
    });

    const min = 598;
    const max = 622;
    const pct = Math.min(Math.max(((elVal - min) / (max - min)) * 100, 0), 100);
    const bonaLeft = Math.min(Math.max(((row.bonaBawah - min) / (max - min)) * 100, 0), 100);
    const bonaWidth = Math.min(Math.max(((row.bonaAtas - row.bonaBawah) / (max - min)) * 100, 0), 100 - bonaLeft);

    const fillEl = document.getElementById('elevGaugeFill');
    const markerEl = document.getElementById('elevGaugeMarker');
    const bonaEl = document.getElementById('elevGaugeBona');
    const labelEl = document.getElementById('elevGaugeSummaryText');

    if (fillEl) fillEl.style.width = `${pct.toFixed(1)}%`;
    if (markerEl) markerEl.style.left = `calc(${pct.toFixed(1)}% - 2px)`;
    if (bonaEl) {
      bonaEl.style.left = `${bonaLeft.toFixed(1)}%`;
      bonaEl.style.width = `${bonaWidth.toFixed(1)}%`;
    }
    if (labelEl) {
      labelEl.textContent = `LWL Siaga 598,00 m · LWL Normal 606,00 m · ${hasActual ? 'Aktual' : 'Rencana'} (${row.periode}) ${fmtId(elVal)} m · HWL 622,00 m`;
    }
  }

  function renderRtowComboChart(svgWrap, readoutEl, series, state, opts = {}) {
    if (!svgWrap || !series || series.length === 0) return;

    const W = 820;
    const H = 370;
    const pad = { top: 24, right: 54, bottom: 42, left: 56 };
    const plotW = W - pad.left - pad.right;
    const plotH = H - pad.top - pad.bottom;

    const minEl = 596;
    const maxEl = 624;
    const maxQ = 22;

    const xAt = (i) => pad.left + (i / Math.max(series.length - 1, 1)) * plotW;
    const yEl = (v) => pad.top + ((maxEl - v) / (maxEl - minEl)) * plotH;
    const yQ = (v) => pad.top + plotH - (Math.min(Math.max(v, 0), maxQ) / maxQ) * (plotH * 0.48);

    const gridElVals = [598, 606, 610, 614, 618, 622];
    const gridLines = gridElVals.map((v) => {
      const y = yEl(v).toFixed(1);
      const isKeyRef = v === 622 || v === 606 || v === 598;
      const stroke = v === 622 ? '#C53030' : v === 606 ? '#1B6C78' : v === 598 ? '#94A6BA' : '#E2E8F0';
      const dash = isKeyRef ? 'stroke-dasharray="5 4"' : '';
      const tag = v === 622 ? 'HWL 622' : v === 606 ? 'LWL 606' : v === 598 ? 'Siaga 598' : `${v}`;
      return `
        <line x1="${pad.left}" y1="${y}" x2="${W - pad.right}" y2="${y}" stroke="${stroke}" stroke-width="${isKeyRef ? 1.25 : 1}" ${dash} />
        <text x="${pad.left - 8}" y="${Number(y) + 4}" text-anchor="end" font-size="10.5" fill="${isKeyRef ? stroke : '#52647A'}" font-family="var(--font-mono)">${tag}</text>
      `;
    }).join('');

    const xTicks = series.map((s, i) => {
      if (i % 3 !== 0 && i !== series.length - 1) return '';
      const x = xAt(i).toFixed(1);
      return `<text x="${x}" y="${H - 14}" text-anchor="middle" font-size="10.5" fill="#52647A" font-family="var(--font-sans)">${s.periode}</text>`;
    }).join('');

    let bonaRibbon = '';
    if (state.showBona) {
      const topPts = series.map((s, i) => `${xAt(i).toFixed(1)},${yEl(s.bonaAtas).toFixed(1)}`);
      const botPts = series.slice().reverse().map((s, revI) => {
        const idx = series.length - 1 - revI;
        return `${xAt(idx).toFixed(1)},${yEl(s.bonaBawah).toFixed(1)}`;
      });
      bonaRibbon = `
        <polygon points="${topPts.concat(botPts).join(' ')}" fill="rgba(88, 199, 214, 0.17)" />
        <polyline points="${topPts.join(' ')}" fill="none" stroke="#238593" stroke-width="1.2" stroke-opacity="0.7" />
        <polyline points="${series.map((s, i) => `${xAt(i).toFixed(1)},${yEl(s.bonaBawah).toFixed(1)}`).join(' ')}" fill="none" stroke="#238593" stroke-width="1.2" stroke-opacity="0.7" />
      `;
    }

    let flowBars = '';
    if (state.showDebit) {
      const qTicks = [0, 10, 20].map((q) => {
        const y = yQ(q).toFixed(1);
        return `<text x="${W - pad.right + 8}" y="${Number(y) + 4}" text-anchor="start" font-size="10" fill="#52647A" font-family="var(--font-mono)">${q} m³/s</text>`;
      }).join('');
      const bw = Math.max(plotW / series.length * 0.28, 3);
      const bars = series.map((s, i) => {
        const cx = xAt(i);
        const inVal = s.inAktual !== null ? s.inAktual : s.inRencana;
        const outVal = s.outAktual !== null ? s.outAktual : s.outRencana;
        const yIn = yQ(inVal);
        const yOut = yQ(outVal);
        const yBase = yQ(0);
        return `
          <rect x="${(cx - bw - 0.5).toFixed(1)}" y="${yIn.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(yBase - yIn, 0).toFixed(1)}" rx="1.5" fill="${s.inAktual !== null ? 'rgba(12, 62, 141, 0.72)' : 'rgba(127, 174, 248, 0.42)'}" />
          <rect x="${(cx + 0.5).toFixed(1)}" y="${yOut.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(yBase - yOut, 0).toFixed(1)}" rx="1.5" fill="${s.outAktual !== null ? 'rgba(27, 108, 120, 0.72)' : 'rgba(88, 199, 214, 0.35)'}" />
        `;
      }).join('');
      flowBars = bars + qTicks;
    }

    const rencanaPts = series.map((s, i) => `${xAt(i).toFixed(1)},${yEl(s.elRencana).toFixed(1)}`).join(' ');
    const actualList = series.map((s, i) => ({ ...s, idx: i })).filter((s) => s.elAktual !== null);
    const actualPts = actualList.map((s) => `${xAt(s.idx).toFixed(1)},${yEl(s.elAktual).toFixed(1)}`).join(' ');
    const actualDots = actualList.map((s) => `
      <circle cx="${xAt(s.idx).toFixed(1)}" cy="${yEl(s.elAktual).toFixed(1)}" r="4.2" fill="#0C3E8D" stroke="#FFFFFF" stroke-width="1.8" />
    `).join('');

    const hitCols = series.map((s, i) => {
      const colW = plotW / series.length;
      const x = xAt(i) - colW / 2;
      return `<rect x="${x.toFixed(1)}" y="${pad.top}" width="${colW.toFixed(1)}" height="${plotH}" fill="transparent" data-pt-idx="${i}" style="cursor:pointer;" />`;
    }).join('');

    svgWrap.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Grafik Rencana Tahunan Operasi Waduk Selorejo 2026–2027">
        ${gridLines}
        ${bonaRibbon}
        ${flowBars}
        <polyline points="${rencanaPts}" fill="none" stroke="#4D82C1" stroke-width="2" stroke-dasharray="6 4" />
        ${actualList.length > 0 ? `<polyline points="${actualPts}" fill="none" stroke="#0C3E8D" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />` : ''}
        ${actualDots}
        <line id="rtowCrosshair" x1="0" y1="${pad.top}" x2="0" y2="${pad.top + plotH}" stroke="#0B1726" stroke-width="1.2" stroke-dasharray="3 3" opacity="0" />
        <circle id="rtowFocusDot" cx="0" cy="0" r="6.2" fill="#238593" stroke="#FFFFFF" stroke-width="2.2" opacity="0" style="pointer-events:none; transition: cx 140ms ease, cy 140ms ease;" />
        ${xTicks}
        ${hitCols}
      </svg>
    `;

    const crosshair = svgWrap.querySelector('#rtowCrosshair');
    const focusDot = svgWrap.querySelector('#rtowFocusDot');
    const defaultIdx = Math.max(0, series.findLastIndex((r) => r.elAktual !== null));
    let pinnedIdx = typeof opts.initialIdx === 'number' ? opts.initialIdx : defaultIdx;

    const applyIdx = (idx, meta = {}) => {
      const row = series[idx] || series[0];
      if (!row) return;
      const dotVal = row.elAktual !== null ? row.elAktual : row.elRencana;
      if (crosshair) {
        crosshair.setAttribute('x1', xAt(idx).toFixed(1));
        crosshair.setAttribute('x2', xAt(idx).toFixed(1));
        crosshair.setAttribute('opacity', '0.55');
      }
      if (focusDot) {
        focusDot.setAttribute('cx', xAt(idx).toFixed(1));
        focusDot.setAttribute('cy', yEl(dotVal).toFixed(1));
        focusDot.setAttribute('fill', row.elAktual !== null ? '#0C3E8D' : '#238593');
        focusDot.setAttribute('opacity', '1');
      }
      if (readoutEl) {
        const tag = row.elAktual !== null ? 'Aktual' : 'Rencana';
        readoutEl.innerHTML = `
          <div class="chart-readout-cell"><span>Periode Dekad</span><strong>${row.periode} (${tag})</strong></div>
          <div class="chart-readout-cell"><span>El. Aktual / Rencana</span><strong>${row.elAktual !== null ? `${fmtId(row.elAktual)} m` : 'Belum terbit'} / ${fmtId(row.elRencana)} m</strong></div>
          <div class="chart-readout-cell"><span>BONA Bawah – Atas</span><strong>${fmtId(row.bonaBawah)} – ${fmtId(row.bonaAtas)} m</strong></div>
          <div class="chart-readout-cell"><span>Inflow Akt / Renc</span><strong>${row.inAktual !== null ? `${fmtId(row.inAktual)} m³/s` : '—'} / ${fmtId(row.inRencana)} m³/s</strong></div>
          <div class="chart-readout-cell"><span>Outflow Akt / Renc</span><strong>${row.outAktual !== null ? `${fmtId(row.outAktual)} m³/s` : '—'} / ${fmtId(row.outRencana)} m³/s</strong></div>
        `;
      }
      if (typeof opts.onPeriodChange === 'function') {
        opts.onPeriodChange(row, idx, { pinned: pinnedIdx !== defaultIdx, previewing: Boolean(meta.previewing) });
      }
    };

    applyIdx(pinnedIdx, { previewing: false });

    svgWrap.querySelectorAll('rect[data-pt-idx]').forEach((rect) => {
      const idx = Number(rect.getAttribute('data-pt-idx'));
      rect.addEventListener('mouseenter', () => applyIdx(idx, { previewing: true }));
      rect.addEventListener('click', () => {
        pinnedIdx = (pinnedIdx === idx && idx !== defaultIdx) ? defaultIdx : idx;
        applyIdx(pinnedIdx, { previewing: false });
      });
    });

    svgWrap.addEventListener('mouseleave', () => applyIdx(pinnedIdx, { previewing: false }));
  }

  function renderKurvaHvChart(svgWrap, readoutEl, activeRow) {
    if (!svgWrap) return;

    const pts = [];
    for (let h = 598; h <= 622; h += 1) {
      const ratio = (h - 598) / 24;
      const volEfektif = Number((30.677 * Math.pow(ratio, 1.58)).toFixed(2));
      const volBruto = Number((0.811 + volEfektif).toFixed(2));
      pts.push({ elev: h, volEfektif, volBruto });
    }

    const row = activeRow || { periode: 'Nov-1', elAktual: 615.37, elRencana: 611.76 };
    const isActual = row.elAktual !== null && row.elAktual !== undefined;
    const aktEl = Number(isActual ? row.elAktual : (row.elRencana || 615.37));
    const aktRatio = Math.min(Math.max((aktEl - 598) / 24, 0), 1);
    const aktVol = Number((30.677 * Math.pow(aktRatio, 1.58)).toFixed(2));

    const W = 820;
    const H = 360;
    const pad = { top: 24, right: 32, bottom: 44, left: 60 };
    const plotW = W - pad.left - pad.right;
    const plotH = H - pad.top - pad.bottom;

    const xAt = (vol) => pad.left + (vol / 34) * plotW;
    const yAt = (el) => pad.top + ((623 - el) / (623 - 597)) * plotH;

    const hGrid = [598, 606, 610, 615, 622].map((el) => {
      const y = yAt(el).toFixed(1);
      const isKey = el === 622 || el === 606 || el === 598;
      const color = el === 622 ? '#C53030' : el === 606 ? '#1B6C78' : el === 598 ? '#94A6BA' : '#E2E8F0';
      return `
        <line x1="${pad.left}" y1="${y}" x2="${W - pad.right}" y2="${y}" stroke="${color}" stroke-width="${isKey ? 1.2 : 1}" ${isKey ? 'stroke-dasharray="5 4"' : ''} />
        <text x="${pad.left - 8}" y="${Number(y) + 4}" text-anchor="end" font-size="10.5" fill="${isKey ? color : '#52647A'}" font-family="var(--font-mono)">El. ${el}</text>
      `;
    }).join('');

    const vGrid = [0, 8, 16, 24, 32].map((v) => {
      const x = xAt(v).toFixed(1);
      return `
        <line x1="${x}" y1="${pad.top}" x2="${x}" y2="${pad.top + plotH}" stroke="#EEF2F6" stroke-width="1" />
        <text x="${x}" y="${H - 16}" text-anchor="middle" font-size="10.5" fill="#52647A" font-family="var(--font-mono)">${v} jt m³</text>
      `;
    }).join('');

    const efPath = pts.map((p) => `${xAt(p.volEfektif).toFixed(1)},${yAt(p.elev).toFixed(1)}`).join(' ');
    const brPath = pts.map((p) => `${xAt(p.volBruto).toFixed(1)},${yAt(p.elev).toFixed(1)}`).join(' ');
    const areaPts = `${xAt(0).toFixed(1)},${yAt(598).toFixed(1)} ${efPath} ${xAt(pts[pts.length - 1].volEfektif).toFixed(1)},${yAt(598).toFixed(1)}`;

    const hitBands = pts.map((p, i) => {
      const bandH = plotH / pts.length;
      const y = yAt(p.elev) - bandH / 2;
      return `<rect x="${pad.left}" y="${y.toFixed(1)}" width="${plotW}" height="${bandH.toFixed(1)}" fill="transparent" data-hv-idx="${i}" style="cursor:crosshair;" />`;
    }).join('');

    svgWrap.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Kurva H-V Hubungan Elevasi dan Volume Tampungan Waduk Selorejo">
        <defs>
          <linearGradient id="hvAreaGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#0C3E8D" stop-opacity="0.06" />
            <stop offset="100%" stop-color="#238593" stop-opacity="0.22" />
          </linearGradient>
        </defs>
        ${vGrid}
        ${hGrid}
        <polygon points="${areaPts}" fill="url(#hvAreaGrad)" />
        <polyline points="${brPath}" fill="none" stroke="#7FAEF8" stroke-width="2" stroke-dasharray="5 4" />
        <polyline points="${efPath}" fill="none" stroke="#0C3E8D" stroke-width="3" stroke-linecap="round" />
        <circle cx="${xAt(aktVol).toFixed(1)}" cy="${yAt(aktEl).toFixed(1)}" r="6" fill="#238593" stroke="#FFFFFF" stroke-width="2" />
        <text x="${(xAt(aktVol) + 10).toFixed(1)}" y="${(yAt(aktEl) - 6).toFixed(1)}" font-size="11" font-weight="700" fill="#0C3E8D" font-family="var(--font-sans)">${row.periode}: El. ${fmtId(aktEl)} m</text>
        <line id="hvCrossY" x1="${pad.left}" y1="0" x2="${W - pad.right}" y2="0" stroke="#0B1726" stroke-width="1" stroke-dasharray="3 3" opacity="0" />
        ${hitBands}
      </svg>
    `;

    const cross = svgWrap.querySelector('#hvCrossY');
    const updateHv = (idx) => {
      const pt = pts[idx];
      if (!pt) return;
      if (cross) {
        cross.setAttribute('y1', yAt(pt.elev).toFixed(1));
        cross.setAttribute('y2', yAt(pt.elev).toFixed(1));
        cross.setAttribute('opacity', '0.55');
      }
      if (readoutEl) {
        readoutEl.innerHTML = `
          <div class="chart-readout-cell"><span>Elevasi Muka Air (H)</span><strong>El. ${fmtId(pt.elev)} m dpl</strong></div>
          <div class="chart-readout-cell"><span>Estimasi Tampungan Efektif</span><strong>${fmtId(pt.volEfektif)} jt m³</strong></div>
          <div class="chart-readout-cell"><span>Estimasi Tampungan Bruto</span><strong>${fmtId(pt.volBruto)} jt m³</strong></div>
          <div class="chart-readout-cell"><span>Acuan ${isActual ? 'Aktual' : 'Rencana'} (${row.periode})</span><strong>El. ${fmtId(aktEl)} m (${fmtId(aktVol)} jt m³)</strong></div>
        `;
      }
    };

    const nearestIdx = Math.min(Math.max(Math.round(aktEl - 598), 0), pts.length - 1);
    updateHv(nearestIdx);

    svgWrap.querySelectorAll('rect[data-hv-idx]').forEach((r) => {
      const idx = Number(r.getAttribute('data-hv-idx'));
      r.addEventListener('mouseenter', () => updateHv(idx));
      r.addEventListener('click', () => updateHv(idx));
    });
  }

  function initEnterpriseMonitoring() {
    let snap = DATA.rtowSnapshot;
    const donutWrap = document.getElementById('pieElevChart');
    const donutLegend = document.getElementById('pieElevLegend');
    const donutVal = document.getElementById('pieCenterValue');
    const donutLabel = document.getElementById('pieCenterLabel');
    const hydroWrap = document.getElementById('rtowHydroChart');
    const hydroReadout = document.getElementById('rtowHoverReadout');
    const hvWrap = document.getElementById('kurvaHvChart');
    const hvReadout = document.getElementById('kurvaHvHoverReadout');

    const donutCtrl = donutWrap ? createDonutController(donutWrap, donutLegend, donutVal, donutLabel) : null;
    const chartState = { showBona: true, showDebit: true };
    let activeRow = snap && snap.latestActual ? snap.latestActual : null;

    const syncAllViewsToRow = (row, meta = {}) => {
      if (!row) return;
      activeRow = row;
      populateTelemetrySummaryForRow(row, meta);
      if (donutCtrl) donutCtrl.update(computePieDataForRow(row));
      if (hvWrap) renderKurvaHvChart(hvWrap, hvReadout, row);
    };

    const redrawAll = (currentSnap) => {
      if (!currentSnap) return;
      const defaultRow = currentSnap.latestActual || (currentSnap.series && currentSnap.series[0]);
      if (defaultRow) syncAllViewsToRow(defaultRow, { previewing: false, pinned: false });
      if (hydroWrap && currentSnap.series) {
        renderRtowComboChart(hydroWrap, hydroReadout, currentSnap.series, chartState, {
          onPeriodChange: (row, _, meta) => syncAllViewsToRow(row, meta)
        });
      }
    };

    redrawAll(snap);

    document.querySelectorAll('[data-hydro-toggle]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-hydro-toggle');
        const next = btn.getAttribute('aria-pressed') !== 'true';
        btn.setAttribute('aria-pressed', String(next));
        if (key === 'bona') chartState.showBona = next;
        if (key === 'debit') chartState.showDebit = next;
        if (hydroWrap && snap && snap.series) {
          const curIdx = activeRow ? snap.series.findIndex((r) => r.periode === activeRow.periode) : undefined;
          renderRtowComboChart(hydroWrap, hydroReadout, snap.series, chartState, {
            initialIdx: curIdx >= 0 ? curIdx : undefined,
            onPeriodChange: (row, _, meta) => syncAllViewsToRow(row, meta)
          });
        }
      });
    });

    const viewTabs = Array.from(document.querySelectorAll('[data-monitoring-view]'));
    const viewRtow = document.getElementById('viewRtowCharts');
    const viewKurvaHv = document.getElementById('viewKurvaHv');

    const activateMonitoringTab = (target) => {
      viewTabs.forEach((t) => t.setAttribute('aria-selected', String(t.getAttribute('data-monitoring-view') === target)));
      if (viewRtow && viewKurvaHv) {
        const showHv = target === 'kurva-hv';
        viewRtow.hidden = showHv;
        viewKurvaHv.hidden = !showHv;
      }
    };

    viewTabs.forEach((tab) => {
      tab.addEventListener('click', () => activateMonitoringTab(tab.getAttribute('data-monitoring-view')));
    });

    const urlView = window.SELOREJO_INITIAL_VIEW || new URLSearchParams(window.location.search).get('view');
    if (urlView === 'kurva-hv') activateMonitoringTab('kurva-hv');
    window.SELOREJO_INITIAL_VIEW = '';

    // Live GAS JSON endpoint sync when deployed
    const gasStatusEl = document.getElementById('gasLiveStatusText');
    if (window.SELOREJO_GAS_ENDPOINT) {
      if (gasStatusEl) gasStatusEl.textContent = 'Menyinkronkan data langsung via Google Apps Script...';
      fetch(window.SELOREJO_GAS_ENDPOINT)
        .then((res) => {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json();
        })
        .then((payload) => {
          if (payload && payload.series && Array.isArray(payload.series)) {
            snap = payload;
            redrawAll(snap);
            if (gasStatusEl) gasStatusEl.textContent = `Tersinkronisasi langsung dari GAS (${payload.updatedAt || 'Real-Time'})`;
          }
        })
        .catch(() => {
          if (gasStatusEl) gasStatusEl.textContent = 'Terhubung ke data pemantauan resmi Waduk Selorejo (RTOW 2026/2027).';
        });
    }
  }

  /* 7. UNIFIED DIRECT DOCUMENT DIRECTORY (/dokumen/) */
  function initDocumentCatalog() {
    const root = document.getElementById('docCatalogRoot');
    if (!root) return;

    const grid = document.getElementById('docCatalogGrid');
    const filterInput = document.getElementById('docFilterInput');
    const countLabel = document.getElementById('docCountLabel');
    const catBar = document.getElementById('docCategoryTabs');
    const docs = DATA.documents || [];
    const categories = ['Semua'].concat(Array.from(new Set(docs.map((d) => d.category))));
    let activeCat = 'Semua';

    if (catBar) {
      catBar.innerHTML = '';
      categories.forEach((cat) => {
        const count = cat === 'Semua' ? docs.length : docs.filter((d) => d.category === cat).length;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'tab-btn';
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-selected', String(cat === activeCat));
        btn.textContent = `${cat} (${count})`;
        btn.addEventListener('click', () => {
          activeCat = cat;
          Array.from(catBar.children).forEach((b) => b.setAttribute('aria-selected', String(b === btn)));
          render();
        });
        catBar.appendChild(btn);
      });
    }

    const render = () => {
      if (!grid) return;
      const q = (filterInput ? filterInput.value : '').trim().toLowerCase();
      const list = docs.filter((d) => {
        const matchCat = activeCat === 'Semua' || d.category === activeCat;
        const matchQ = !q || `${d.title} ${d.category} ${d.desc} ${d.kind}`.toLowerCase().includes(q);
        return matchCat && matchQ;
      });

      if (countLabel) {
        countLabel.textContent = `Menampilkan ${list.length} dari ${docs.length} tautan dokumen resmi`;
      }

      grid.innerHTML = '';
      if (list.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'doc-row-card';
        empty.innerHTML = '<h3>Tidak ada dokumen yang cocok</h3><p>Ubah kata kunci pencarian atau pilih kategori Semua.</p>';
        grid.appendChild(empty);
        return;
      }

      list.forEach((d) => {
        const card = document.createElement('article');
        card.className = 'doc-row-card';
        card.innerHTML = `
          <div>
            <div class="doc-row-meta">
              <span class="doc-kind-tag">${d.kind}</span>
              <span style="font-size: var(--t-xs); color: var(--ink-muted);">${d.category}</span>
            </div>
            <h3>${d.title}</h3>
            <p>${d.desc}</p>
          </div>
          <div class="service-links-group">
            <a class="text-action-link" href="${d.href}" target="_blank" rel="noopener noreferrer">
              Buka Tautan Resmi
              <svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"></path></svg>
            </a>
            <a class="text-action-link" href="${resolveUrl(d.page)}">Halaman Terkait</a>
          </div>
        `;
        grid.appendChild(card);
      });
    };

    if (filterInput) filterInput.addEventListener('input', render);
    render();
  }

  /* 8. FULL SITE & DOCUMENT SEARCH (/pencarian/) */
  function initGlobalSearchPage() {
    const root = document.getElementById('globalSearchRoot');
    if (!root) return;

    const input = document.getElementById('pageSearchInput');
    const resultsEl = document.getElementById('pageSearchResults');
    const statusEl = document.getElementById('pageSearchStatus');
    const params = new URLSearchParams(window.location.search);
    if (input && params.get('q')) input.value = params.get('q');

    const render = () => {
      if (!resultsEl) return;
      const term = (input ? input.value : '').trim().toLowerCase();
      const pageEntries = (DATA.pages || []).map((p) => ({
        title: p.title,
        kind: 'Halaman Portal',
        category: 'Navigasi Utama',
        desc: p.desc,
        href: resolveUrl(p.slug),
        external: false,
        text: `${p.title} ${p.desc} ${(p.tags || []).join(' ')}`.toLowerCase()
      }));
      const docEntries = (DATA.documents || []).map((d) => ({
        title: d.title,
        kind: d.kind,
        category: d.category,
        desc: d.desc,
        href: d.href,
        external: true,
        text: `${d.title} ${d.category} ${d.desc}`.toLowerCase()
      }));

      const all = pageEntries.concat(docEntries);
      const matches = term ? all.filter((x) => x.text.includes(term)) : all;

      if (statusEl) {
        statusEl.textContent = term
          ? `Ditemukan ${matches.length} hasil untuk "${input.value.trim()}".`
          : `Menampilkan seluruh ${matches.length} halaman dan tautan dokumen portal.`;
      }

      resultsEl.innerHTML = '';
      matches.forEach((m) => {
        const card = document.createElement('article');
        card.className = 'doc-row-card';
        const attrs = m.external ? 'target="_blank" rel="noopener noreferrer"' : '';
        card.innerHTML = `
          <div>
            <div class="doc-row-meta">
              <span class="doc-kind-tag">${m.kind}</span>
              <span style="font-size: var(--t-xs); color: var(--ink-muted);">${m.category}</span>
            </div>
            <h3>${m.title}</h3>
            <p>${m.desc}</p>
          </div>
          <div class="service-links-group">
            <a class="text-action-link" href="${m.href}" ${attrs}>
              ${m.external ? 'Buka di Google Drive' : 'Kunjungi Halaman'}
            </a>
          </div>
        `;
        resultsEl.appendChild(card);
      });
    };

    if (input) input.addEventListener('input', render);
    render();
  }

  /* 9. DATA TEKNIS CSV DOWNLOAD (/data-teknis/) */
  function initSpecCsvExport() {
    const btn = document.getElementById('downloadSpecCsvBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const rows = [['Kelompok', 'Parameter', 'Nilai', 'Catatan'].join(';')];
      (DATA.technicalPreviewSpecs || []).forEach((item) => {
        rows.push([item.group, item.label, item.value, item.note].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';'));
      });
      const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ringkasan-pratinjau-data-teknis-selorejo.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  /* 10. ISO/IEC 18004 VERSION 3-M QR CODE GENERATOR (100% OFFLINE SVG) */
  function renderQrCodes() {
    const targets = Array.from(document.querySelectorAll('svg[data-qr-url]'));
    if (targets.length === 0) return;

    const buildQrPath = (text) => {
      const bytes = Array.from(new TextEncoder().encode(text));
      const exp = new Uint8Array(512);
      const log = new Uint8Array(256);
      let x = 1;
      for (let i = 0; i < 255; i++) {
        exp[i] = x;
        log[x] = i;
        x = (x << 1) ^ (x & 0x80 ? 0x11d : 0);
      }
      for (let i = 255; i < 512; i++) exp[i] = exp[i - 255];
      const gfMul = (a, b) => (a === 0 || b === 0 ? 0 : exp[log[a] + log[b]]);

      let gen = [1];
      for (let i = 0; i < 26; i++) {
        const next = new Array(gen.length + 1).fill(0);
        for (let j = 0; j < gen.length; j++) {
          next[j] ^= gen[j];
          next[j + 1] ^= gfMul(gen[j], exp[i]);
        }
        gen = next;
      }

      const bits = [];
      const pushBits = (val, len) => {
        for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1);
      };
      pushBits(0b0100, 4);
      pushBits(bytes.length, 8);
      bytes.forEach((b) => pushBits(b, 8));
      pushBits(0, Math.min(4, 352 - bits.length));
      while (bits.length % 8 !== 0) bits.push(0);
      const padBytes = [0xEC, 0x11];
      for (let p = 0; bits.length < 352; p++) pushBits(padBytes[p & 1], 8);

      const dataCw = new Uint8Array(44);
      for (let i = 0; i < 44; i++) {
        let v = 0;
        for (let b = 0; b < 8; b++) v = (v << 1) | bits[i * 8 + b];
        dataCw[i] = v;
      }

      const rem = new Uint8Array(44 + 26);
      rem.set(dataCw);
      for (let i = 0; i < 44; i++) {
        const factor = rem[i];
        if (factor !== 0) {
          for (let j = 0; j < gen.length; j++) rem[i + j] ^= gfMul(gen[j], factor);
        }
      }

      const allCw = Array.from(dataCw).concat(Array.from(rem.slice(44)));
      const stream = [];
      allCw.forEach((cw) => {
        for (let b = 7; b >= 0; b--) stream.push((cw >> b) & 1);
      });
      for (let r = 0; r < 7; r++) stream.push(0);

      const N = 29;
      const mod = Array.from({ length: N }, () => new Int8Array(N).fill(-1));
      const func = Array.from({ length: N }, () => new Uint8Array(N));

      const setFunc = (r, c, v) => {
        mod[r][c] = v;
        func[r][c] = 1;
      };
      const drawFinder = (r0, c0) => {
        for (let dr = -1; dr <= 7; dr++) {
          for (let dc = -1; dc <= 7; dc++) {
            const r = r0 + dr;
            const c = c0 + dc;
            if (r < 0 || r >= N || c < 0 || c >= N) continue;
            const inBox = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
            const isDark = inBox && (dr === 0 || dr === 6 || dc === 0 || dc === 6 || (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4));
            setFunc(r, c, isDark ? 1 : 0);
          }
        }
      };
      drawFinder(0, 0);
      drawFinder(0, N - 7);
      drawFinder(N - 7, 0);

      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          setFunc(22 + dr, 22 + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1 ? 1 : 0);
        }
      }
      for (let i = 8; i < N - 8; i++) {
        if (!func[6][i]) setFunc(6, i, i % 2 === 0 ? 1 : 0);
        if (!func[i][6]) setFunc(i, 6, i % 2 === 0 ? 1 : 0);
      }

      setFunc(21, 8, 1);
      for (let i = 0; i < 9; i++) {
        if (!func[8][i]) setFunc(8, i, 0);
        if (!func[i][8]) setFunc(i, 8, 0);
      }
      for (let i = 0; i < 8; i++) {
        if (!func[8][N - 1 - i]) setFunc(8, N - 1 - i, 0);
        if (!func[N - 1 - i][8]) setFunc(N - 1 - i, 8, 0);
      }

      let bitIdx = 0;
      for (let right = N - 1; right >= 1; right -= 2) {
        if (right === 6) right = 5;
        for (let step = 0; step < N; step++) {
          const up = ((right + 1) & 2) === 0;
          const r = up ? N - 1 - step : step;
          for (let d = 0; d < 2; d++) {
            const c = right - d;
            if (!func[r][c]) mod[r][c] = stream[bitIdx++] || 0;
          }
        }
      }

      const applyFormat = (grid, maskId) => {
        const fmtData = (0b00 << 3) | maskId;
        let d = fmtData << 10;
        const poly = 0b10100110111;
        for (let i = 14; i >= 10; i--) {
          if ((d >> i) & 1) d ^= poly << (i - 10);
        }
        const fmt = ((fmtData << 10) | d) ^ 0x5412;
        for (let i = 0; i < 15; i++) {
          const bit = (fmt >> i) & 1;
          if (i < 6) grid[i][8] = bit;
          else if (i < 8) grid[i + 1][8] = bit;
          else grid[N - 15 + i][8] = bit;

          if (i < 8) grid[8][N - 1 - i] = bit;
          else if (i < 9) grid[8][7] = bit;
          else grid[8][14 - i] = bit;
        }
      };

      const maskCond = (m, r, c) => {
        switch (m) {
          case 0: return (r + c) % 2 === 0;
          case 1: return r % 2 === 0;
          case 2: return c % 3 === 0;
          case 3: return (r + c) % 3 === 0;
          case 4: return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
          case 5: return ((r * c) % 2) + ((r * c) % 3) === 0;
          case 6: return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
          default: return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0;
        }
      };

      let bestGrid = null;
      let bestScore = Infinity;
      for (let m = 0; m < 8; m++) {
        const g = mod.map((row, r) => row.map((v, c) => (func[r][c] ? v : maskCond(m, r, c) ? v ^ 1 : v)));
        applyFormat(g, m);
        let pen = 0;
        for (let r = 0; r < N; r++) {
          let runR = 1;
          let runC = 1;
          for (let c = 1; c < N; c++) {
            if (g[r][c] === g[r][c - 1]) runR++;
            else { if (runR >= 5) pen += runR - 2; runR = 1; }
            if (g[c][r] === g[c - 1][r]) runC++;
            else { if (runC >= 5) pen += runC - 2; runC = 1; }
          }
          if (runR >= 5) pen += runR - 2;
          if (runC >= 5) pen += runC - 2;
        }
        if (pen < bestScore) { bestScore = pen; bestGrid = g; }
      }

      let dPath = '';
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          if (bestGrid[r][c] === 1) dPath += `M${c + 2},${r + 2}h1v1h-1z`;
        }
      }
      return dPath;
    };

    targets.forEach((svg) => {
      const url = svg.getAttribute('data-qr-url') || DATA.whatsappUrl || 'https://kirimwa.id/bendunganselorejo';
      const path = buildQrPath(url);
      svg.setAttribute('viewBox', '0 0 33 33');
      svg.innerHTML = `<rect width="33" height="33" fill="var(--bg-surface)"></rect><path d="${path}" fill="var(--bg-command)"></path>`;
    });
  }

  function initPageTransitions() {
    if (window.SELOREJO_GAS_MODE) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if ('CSS' in window && CSS.supports && CSS.supports('view-transition-name: root')) return;

    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]');
      if (!a) return;
      const href = a.getAttribute('href') || '';
      if (!href || href.startsWith('#') || a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      document.body.classList.add('is-navigating');
      setTimeout(() => { window.location.href = a.href; }, 140);
    });
  }

  function runPageModules() {
    initScrollReveal();
    initHeroShowcase();
    initMapsSwitchers();
    initEnterpriseMonitoring();
    initDocumentCatalog();
    initGlobalSearchPage();
    initSpecCsvExport();
    renderQrCodes();
  }

  window.SELOREJO_REINIT_PAGE = runPageModules;

  document.addEventListener('DOMContentLoaded', () => {
    initNavigationAndSearch();
    initPageTransitions();
    initBackToTop();
    runPageModules();
  });
})();
