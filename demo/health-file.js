/**
 * Joey AI — Health File demo (sample timeline, 1 record view or share preview).
 */
(function () {
  'use strict';

  var RECORDS = [
    {
      id: 'rabies',
      type: 'vaccine',
      typeLabel: 'Vaccine',
      title: 'Rabies (1-year)',
      date: '2025-03-14',
      dateLabel: 'Given 14 Mar 2025 · due 14 Mar 2026',
      status: 'due-soon',
      statusLabel: 'Due in ~6 months',
      summary: 'City Animal Hospital · Dr. Mehta',
      detail: [
        { label: 'Product', value: 'Rabisin® — lot RB-4421' },
        { label: 'Site', value: 'Right hind leg' },
        { label: 'Next due', value: '14 Mar 2026' },
        { label: 'Notes', value: 'No reaction observed. Booster scheduled with annual exam.' },
      ],
    },
    {
      id: 'dhpp',
      type: 'vaccine',
      typeLabel: 'Vaccine',
      title: 'DHPP booster',
      date: '2025-03-14',
      dateLabel: '14 Mar 2025',
      status: 'ok',
      statusLabel: 'Up to date',
      summary: 'Given with rabies · same visit',
      detail: [
        { label: 'Product', value: 'Nobivac® DHPPi' },
        { label: 'Next due', value: '14 Mar 2026' },
        { label: 'Notes', value: 'Routine adult booster.' },
      ],
    },
    {
      id: 'flea',
      type: 'medication',
      typeLabel: 'Medication',
      title: 'Flea & tick prevention',
      date: '2026-08-01',
      dateLabel: 'Monthly · last given 1 Aug 2026',
      status: 'ok',
      statusLabel: 'On schedule',
      summary: 'Chewable · with food',
      detail: [
        { label: 'Medication', value: 'Simparica Trio®' },
        { label: 'Dose', value: '1 chew · 20–40 kg band' },
        { label: 'Reminder', value: '1st of each month' },
        { label: 'Notes', value: 'Give with a meal. Skip if vomiting within 2 hours.' },
      ],
    },
    {
      id: 'wellness',
      type: 'vet-visit',
      typeLabel: 'Vet visit',
      title: 'Annual wellness exam',
      date: '2025-03-14',
      dateLabel: '14 Mar 2025',
      status: 'ok',
      statusLabel: 'Completed',
      summary: 'City Animal Hospital · weight 28.4 kg',
      detail: [
        { label: 'Weight', value: '28.4 kg (stable)' },
        { label: 'BCS', value: '5 / 9 — ideal' },
        { label: 'Findings', value: 'Heart and lungs clear. Mild tartar — dental discussed.' },
        { label: 'Plan', value: 'Continue preventives. Recheck dental in 12 months.' },
      ],
    },
    {
      id: 'cbc',
      type: 'lab-result',
      typeLabel: 'Lab result',
      title: 'Pre-anesthetic blood panel',
      date: '2024-11-02',
      dateLabel: '2 Nov 2024',
      status: 'ok',
      statusLabel: 'Within range',
      summary: 'CBC + chemistry · all values normal',
      detail: [
        { label: 'ALT', value: '42 U/L (ref 10–125)' },
        { label: 'Creatinine', value: '1.1 mg/dL (ref 0.5–1.6)' },
        { label: 'HCT', value: '48% (ref 37–55%)' },
        { label: 'Notes', value: 'Cleared for routine dental under GA.' },
      ],
    },
  ];

  var TYPE_ICONS = {
    vaccine: '💉',
    medication: '💊',
    'vet-visit': '🩺',
    'lab-result': '🧪',
  };

  var timelineEl = document.querySelector('[data-health-timeline]');
  var emptyEl = document.querySelector('[data-health-empty]');
  var tabsRoot = document.querySelector('[data-health-tabs]');
  var detailDialog = document.querySelector('[data-health-detail]');
  var shareDialog = document.querySelector('[data-health-share-modal]');
  var shareBtn = document.querySelector('[data-health-share]');
  var limitBanner = document.querySelector('[data-demo-limit]');
  if (!timelineEl) return;

  var filter = 'all';
  var demoLocked = false;
  var usedAction = false;

  function retargetSignup() {
    var CONFIG = window.JOEY_CONFIG || {};
    var APP_URL = (CONFIG.appUrl || 'https://joey.ai').replace(/\/+$/, '');
    var path = (CONFIG.paths && CONFIG.paths.signup) || '/signup';
    document.querySelectorAll('[data-cta="signup"]').forEach(function (link) {
      link.setAttribute('href', APP_URL + path);
      link.setAttribute('rel', 'noopener');
    });
  }

  function lockDemo() {
    demoLocked = true;
    if (limitBanner) limitBanner.hidden = false;
    timelineEl.querySelectorAll('.demo-health-record').forEach(function (btn) {
      btn.disabled = true;
    });
    if (shareBtn) shareBtn.disabled = true;
  }

  function useDemoAction() {
    if (usedAction) return;
    usedAction = true;
    lockDemo();
  }

  function filteredRecords() {
    if (filter === 'all') return RECORDS.slice();
    return RECORDS.filter(function (r) { return r.type === filter; });
  }

  function renderTimeline() {
    var list = filteredRecords();
    timelineEl.innerHTML = '';

    if (!list.length) {
      if (emptyEl) emptyEl.hidden = false;
      return;
    }
    if (emptyEl) emptyEl.hidden = true;

    list.forEach(function (record) {
      var li = document.createElement('li');
      li.className = 'demo-health-record-wrap';

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'demo-health-record';
      btn.setAttribute('data-record-id', record.id);
      btn.disabled = demoLocked;

      var icon = TYPE_ICONS[record.type] || '📄';
      var statusClass = record.status === 'due-soon' ? 'demo-health-record__status--due' : 'demo-health-record__status--ok';

      btn.innerHTML =
        '<span class="demo-health-record__icon" aria-hidden="true">' + icon + '</span>' +
        '<span class="demo-health-record__main">' +
          '<span class="demo-health-record__row">' +
            '<span class="demo-health-record__type">' + record.typeLabel + '</span>' +
            '<span class="demo-health-record__status ' + statusClass + '">' + record.statusLabel + '</span>' +
          '</span>' +
          '<span class="demo-health-record__title">' + record.title + '</span>' +
          '<span class="demo-health-record__meta">' + record.dateLabel + ' · ' + record.summary + '</span>' +
        '</span>' +
        '<span class="demo-health-record__chev" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>' +
        '</span>';

      btn.addEventListener('click', function () {
        openRecord(record.id);
      });

      li.appendChild(btn);
      timelineEl.appendChild(li);
    });

    if (window.DemoMotion) window.DemoMotion.stagger(timelineEl);
  }

  function openRecord(id) {
    if (demoLocked && usedAction) return;
    var record = RECORDS.find(function (r) { return r.id === id; });
    if (!record || !detailDialog) return;

    var typeEl = document.querySelector('[data-health-detail-type]');
    var titleEl = document.querySelector('[data-health-detail-title]');
    var dateEl = document.querySelector('[data-health-detail-date]');
    var bodyEl = document.querySelector('[data-health-detail-body]');

    if (typeEl) typeEl.textContent = record.typeLabel;
    if (titleEl) titleEl.textContent = record.title;
    if (dateEl) dateEl.textContent = record.dateLabel;
    if (bodyEl) {
      bodyEl.innerHTML = record.detail.map(function (row) {
        return '<div class="demo-health-detail__row"><dt>' + row.label + '</dt><dd>' + row.value + '</dd></div>';
      }).join('');
    }

    detailDialog.showModal();
    useDemoAction();
  }

  function openSharePreview() {
    if (demoLocked && usedAction) return;
    var bodyEl = document.querySelector('[data-health-share-body]');
    if (!bodyEl || !shareDialog) return;

    bodyEl.innerHTML =
      '<div class="demo-health-share__head">' +
        '<p class="demo-health-share__pet">Demo dog · Labrador · 4 yrs · 28.4 kg</p>' +
        '<p class="demo-health-share__date">Summary generated ' + new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) + '</p>' +
      '</div>' +
      '<section class="demo-health-share__section">' +
        '<h3>Vaccinations</h3>' +
        '<ul><li>Rabies — due Mar 2026</li><li>DHPP — due Mar 2026</li></ul>' +
      '</section>' +
      '<section class="demo-health-share__section">' +
        '<h3>Active medications</h3>' +
        '<ul><li>Simparica Trio — monthly flea/tick/heartworm</li></ul>' +
      '</section>' +
      '<section class="demo-health-share__section">' +
        '<h3>Recent visits</h3>' +
        '<ul><li>Annual wellness — Mar 2025 · weight stable, mild tartar noted</li></ul>' +
      '</section>' +
      '<section class="demo-health-share__section">' +
        '<h3>Owner notes for clinic</h3>' +
        '<p>No vomiting or limping this month. Appetite and energy normal. Here for vaccine discussion.</p>' +
      '</section>' +
      '<p class="demo-health-share__fine">Revocable link · expires in 7 days in the full app</p>';

    shareDialog.showModal();
    useDemoAction();
  }

  if (tabsRoot) {
    tabsRoot.addEventListener('click', function (e) {
      var tab = e.target.closest('[data-health-filter]');
      if (!tab) return;
      filter = tab.getAttribute('data-health-filter') || 'all';
      tabsRoot.querySelectorAll('.demo-hub-tab').forEach(function (btn) {
        var active = btn === tab;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      renderTimeline();
    });
  }

  document.querySelectorAll('[data-health-detail-close]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (detailDialog) detailDialog.close();
    });
  });

  document.querySelectorAll('[data-health-share-close]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (shareDialog) shareDialog.close();
    });
  });

  if (shareBtn) {
    shareBtn.addEventListener('click', openSharePreview);
  }

  [detailDialog, shareDialog].forEach(function (dlg) {
    if (!dlg) return;
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg) dlg.close();
    });
  });

  renderTimeline();
  retargetSignup();
})();
