/**
 * Joey AI — Breed Alerts demo (pick breed, 1 alert detail).
 */
(function () {
  'use strict';

  var BREEDS = {
    labrador: {
      label: 'Labrador Retriever',
      subtitle: 'Labrador Retriever — predispositions and what to watch this season.',
    },
    golden: {
      label: 'Golden Retriever',
      subtitle: 'Golden Retriever — predispositions and what to watch this season.',
    },
    frenchie: {
      label: 'French Bulldog',
      subtitle: 'French Bulldog — predispositions and what to watch this season.',
    },
    'german-shepherd': {
      label: 'German Shepherd',
      subtitle: 'German Shepherd — predispositions and what to watch this season.',
    },
    corgi: {
      label: 'Pembroke Welsh Corgi',
      subtitle: 'Pembroke Welsh Corgi — predispositions and what to watch this season.',
    },
    beagle: {
      label: 'Beagle',
      subtitle: 'Beagle — predispositions and what to watch this season.',
    },
  };

  var ALERTS = {
    labrador: [
      {
        id: 'lab-bloat',
        severity: 'critical',
        title: 'Bloat (GDV) risk',
        summary: 'Deep-chested breeds can twist the stomach after large meals or heavy exercise — act fast if the belly swells.',
        category: 'Emergency',
        body: [
          'Labradors are among the breeds at higher risk for gastric dilatation-volvulus (bloat).',
          'Watch for a hard, swollen abdomen, retching without vomit, restlessness, and pale gums.',
          'Do not wait — this is a same-hour emergency. Call your nearest emergency vet while you travel.',
        ],
        watch: ['Distended belly', 'Unproductive retching', 'Collapse or extreme weakness'],
        when: 'Emergency vet immediately',
      },
      {
        id: 'lab-hip',
        severity: 'warning',
        title: 'Hip dysplasia watch',
        summary: 'Stiffness after rest, bunny-hopping, or reluctance on stairs can be early joint pain — especially in seniors.',
        category: 'Mobility',
        body: [
          'Labs often show hip and elbow issues in middle age. Joey would compare gait changes week over week, not just one stiff morning.',
          'Keep weight in the ideal range — every extra kilo loads the joints.',
        ],
        watch: ['Limping after play', 'Difficulty rising', 'Less enthusiasm on walks'],
        when: 'Vet exam if persistent beyond 48 hours',
      },
      {
        id: 'lab-ears',
        severity: 'info',
        title: 'Swimmer\'s ear season',
        summary: 'After lake or pool swims, dry ears and watch for head shaking — Labs are prone to otitis.',
        category: 'Seasonal',
        body: [
          'Moist ear canals plus floppy ears make infection common in warm months.',
          'Gentle dry after swimming; avoid cotton deep in the canal.',
        ],
        watch: ['Head tilt', 'Odour or discharge', 'Scratching at ears'],
        when: 'Vet if smell or pain within a few days',
      },
    ],
    golden: [
      {
        id: 'gold-cancer',
        severity: 'warning',
        title: 'Lump check habit',
        summary: 'Goldens have higher cancer rates — a monthly “pet and feel” at home catches changes early.',
        category: 'Cancer awareness',
        body: [
          'Not every lump is malignant, but new masses, fast growth, or ulceration need a vet look.',
          'Joey would log photos and size so your vet sees the trend, not a one-off snapshot.',
        ],
        watch: ['New lumps', 'Weight loss with good appetite', 'Lethargy plus enlarged lymph nodes'],
        when: 'Vet within a week for any new mass',
      },
      {
        id: 'gold-hip',
        severity: 'warning',
        title: 'Joint care in active dogs',
        summary: 'Enthusiastic fetch can mask soreness — watch for slower stands and shorter sessions.',
        category: 'Mobility',
        body: [
          'Hip and elbow dysplasia are common. Ramps for cars and sofas reduce daily strain.',
        ],
        watch: ['Stiff mornings', 'Reluctance to jump', 'Licking at joints'],
        when: 'Orthopedic consult if limp lasts more than a few days',
      },
      {
        id: 'gold-hotspot',
        severity: 'info',
        title: 'Hot spot season',
        summary: 'Humid weather plus thick coat can trigger moist dermatitis — clip and dry early.',
        category: 'Seasonal',
        body: [
          'A small red patch can spread in hours. Keep the area dry and prevent licking until your vet sees it.',
        ],
        watch: ['Moist red patch', 'Intense licking', 'Hair loss over one spot'],
        when: 'Vet within 24–48 hours if spreading',
      },
    ],
    frenchie: [
      {
        id: 'fr-heat',
        severity: 'critical',
        title: 'Heat stroke — brachycephalic risk',
        summary: 'Short noses struggle in heat. Walks before 8 a.m., AC indoors, and never leave in a car.',
        category: 'Emergency',
        body: [
          'French Bulldogs overheat faster than most breeds. Panting, blue gums, or collapse need cooling and emergency care now.',
          'Use a harness, not a collar, to protect the airway.',
        ],
        watch: ['Heavy panting at rest', 'Vomiting in heat', 'Staggering or collapse'],
        when: 'Emergency vet while cooling (wet paws, fan — not ice bath)',
      },
      {
        id: 'fr-boas',
        severity: 'warning',
        title: 'Breathing noise (BOAS)',
        summary: 'Snoring and exercise intolerance can worsen with weight — discuss airway assessment with your vet.',
        category: 'Airway',
        body: [
          'Brachycephalic obstructive airway syndrome ranges from noisy breathing to life-threatening episodes.',
          'Surgical options exist for severe cases — an exam beats guessing from YouTube.',
        ],
        watch: ['Gagging after mild play', 'Cyanotic gums', 'Sleep apnea patterns'],
        when: 'Vet referral for airway workup if worsening',
      },
      {
        id: 'fr-skin',
        severity: 'info',
        title: 'Skin fold care',
        summary: 'Clean face and tail folds weekly — yeast builds quickly in wrinkles.',
        category: 'Dermatology',
        body: [
          'Use vet-approved wipes; keep folds dry. Redness and smell mean infection may already be starting.',
        ],
        watch: ['Brown discharge in folds', 'Rubbing face on carpet', 'Strong odour'],
        when: 'Vet if redness persists after 2 days of cleaning',
      },
    ],
    'german-shepherd': [
      {
        id: 'gs-dm',
        severity: 'warning',
        title: 'Degenerative myelopathy awareness',
        summary: 'Dragging back paws or wobbly hind legs in seniors — early physio and vet neurology referral help.',
        category: 'Neurology',
        body: [
          'DM is progressive. Joey would track gait videos so your vet sees change over months, not one visit.',
        ],
        watch: ['Knuckling on back paws', 'Crossing hind legs when standing', 'Falls on smooth floors'],
        when: 'Neurology consult for progressive signs',
      },
      {
        id: 'gs-bloat',
        severity: 'critical',
        title: 'Bloat (GDV) risk',
        summary: 'Large, deep-chested — rest after meals and avoid vigorous play right after eating.',
        category: 'Emergency',
        body: [
          'Same emergency signs as other at-risk breeds: swollen belly, retching, shock.',
        ],
        watch: ['Hard abdomen', 'Pale gums', 'Collapse'],
        when: 'Emergency vet immediately',
      },
      {
        id: 'gs-allergy',
        severity: 'info',
        title: 'Seasonal allergies',
        summary: 'Paw licking and ear flares often spike in spring — log itch days to find patterns.',
        category: 'Seasonal',
        body: [
          'Environmental allergies are common. Foot soaks after walks can reduce pollen load.',
        ],
        watch: ['Red paws', 'Ear infections recurring', 'Face rubbing'],
        when: 'Vet if skin breaks or ears smell',
      },
    ],
    corgi: [
      {
        id: 'corgi-ivdd',
        severity: 'warning',
        title: 'Back health (IVDD)',
        summary: 'Long back, short legs — use ramps, limit jumping off furniture, and support the chest when lifting.',
        category: 'Spine',
        body: [
          'Intervertebral disc disease can cause sudden pain or paralysis. Crate rest and urgent vet care if hind limb weakness appears.',
        ],
        watch: ['Arched back', 'Yelp when picked up', 'Weak or dragging back legs'],
        when: 'Emergency vet if paralysis or severe pain',
      },
      {
        id: 'corgi-weight',
        severity: 'info',
        title: 'Weight on a small frame',
        summary: 'A “cute” extra kilo loads the spine — weigh monthly and adjust portions.',
        category: 'Nutrition',
        body: [
          'Corgis gain weight easily. Joey ties Daily Wag appetite logs to weight trends.',
        ],
        watch: ['Loss of waist', 'Reluctance on stairs', 'Heavy panting on short walks'],
        when: 'Vet nutrition plan if BCS above 6/9',
      },
      {
        id: 'corgi-hip',
        severity: 'info',
        title: 'Hip dysplasia watch',
        summary: 'Bunny-hopping as a puppy or stiffness at age 6+ — early X-rays help planning.',
        category: 'Mobility',
        body: [
          'Keep lean and avoid repetitive jumping while growing.',
        ],
        watch: ['Bunny hop gait', 'Stiff after naps'],
        when: 'Orthopedic exam if persistent',
      },
    ],
    beagle: [
      {
        id: 'beagle-obesity',
        severity: 'info',
        title: 'Food motivation',
        summary: 'Beagles are famously food-driven — secure bins and measure meals; “extra” adds up fast.',
        category: 'Nutrition',
        body: [
          'Joey’s food checker helps when kids drop snacks. Weight gain strains joints and worsens ear infections.',
        ],
        watch: ['Constant scavenging', 'Weight creep', 'Less visible ribs'],
        when: 'Vet if weight up 5% in a month',
      },
      {
        id: 'beagle-epilepsy',
        severity: 'warning',
        title: 'Seizure awareness',
        summary: 'Breed predisposition exists — time seizures, keep safe from stairs, and call your vet after first event.',
        category: 'Neurology',
        body: [
          'First seizure warrants baseline bloodwork and a plan. Cluster seizures are an emergency.',
        ],
        watch: ['Collapse and paddling', 'Drooling', 'Disorientation after'],
        when: 'Emergency if seizure lasts >3 min or clusters',
      },
      {
        id: 'beagle-ears',
        severity: 'info',
        title: 'Ear infection loop',
        summary: 'Long ears trap moisture — dry after baths and treat flares early.',
        category: 'Ears',
        body: [
          'Chronic otitis often ties to allergies. Log head-shake days in Joey.',
        ],
        watch: ['Head shake', 'Brown discharge', 'Odour'],
        when: 'Vet if pain or smell',
      },
    ],
  };

  var SEVERITY_LABEL = {
    critical: 'Critical',
    warning: 'Warning',
    info: 'Info',
  };

  var listEl = document.querySelector('[data-alerts-list]');
  var emptyEl = document.querySelector('[data-alerts-empty]');
  var subtitleEl = document.querySelector('[data-alerts-subtitle]');
  var breedRoot = document.querySelector('[data-breed-list]');
  var filtersRoot = document.querySelector('[data-alerts-filters]');
  var detailDialog = document.querySelector('[data-alert-detail]');
  var limitBanner = document.querySelector('[data-demo-limit]');
  if (!listEl) return;

  var breed = 'labrador';
  var severityFilter = 'all';
  var demoLocked = false;
  var usedDetail = false;

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
    listEl.querySelectorAll('[data-alert-learn]').forEach(function (btn) {
      btn.disabled = true;
    });
  }

  function currentAlerts() {
    var items = ALERTS[breed] || [];
    if (severityFilter === 'all') return items;
    return items.filter(function (a) { return a.severity === severityFilter; });
  }

  function renderAlerts() {
    var items = currentAlerts();
    listEl.innerHTML = '';

    if (subtitleEl && BREEDS[breed]) {
      subtitleEl.textContent = BREEDS[breed].subtitle;
    }

    if (!items.length) {
      if (emptyEl) emptyEl.hidden = false;
      return;
    }
    if (emptyEl) emptyEl.hidden = true;

    var order = { critical: 0, warning: 1, info: 2 };
    items.slice().sort(function (a, b) {
      return order[a.severity] - order[b.severity];
    }).forEach(function (alert) {
      var li = document.createElement('li');
      li.className = 'demo-alert-card demo-alert-card--' + alert.severity;

      li.innerHTML =
        '<div class="demo-alert-card__icon" aria-hidden="true">' + severityIcon(alert.severity) + '</div>' +
        '<div class="demo-alert-card__body">' +
          '<div class="demo-alert-card__row">' +
            '<h3 class="demo-alert-card__title">' + alert.title + '</h3>' +
            '<span class="demo-alert-badge demo-alert-badge--' + alert.severity + '">' + SEVERITY_LABEL[alert.severity] + '</span>' +
          '</div>' +
          '<p class="demo-alert-card__summary">' + alert.summary + '</p>' +
          '<span class="demo-alert-card__meta">' + alert.category + '</span>' +
        '</div>' +
        '<button type="button" class="btn btn-secondary btn-sm demo-alert-card__cta" data-alert-learn data-alert-id="' + alert.id + '">Learn more</button>';

      listEl.appendChild(li);
    });

    if (window.DemoMotion) window.DemoMotion.stagger(listEl);

    listEl.querySelectorAll('[data-alert-learn]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openDetail(btn.getAttribute('data-alert-id'));
      });
      if (demoLocked) btn.disabled = true;
    });
  }

  function severityIcon(severity) {
    if (severity === 'critical') {
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>';
    }
    if (severity === 'warning') {
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>';
    }
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>';
  }

  function findAlert(id) {
    var list = ALERTS[breed] || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function openDetail(id) {
    if (usedDetail && demoLocked) return;
    var alert = findAlert(id);
    if (!alert || !detailDialog) return;

    var badgeEl = document.querySelector('[data-alert-detail-severity]');
    var titleEl = document.querySelector('[data-alert-detail-title]');
    var metaEl = document.querySelector('[data-alert-detail-meta]');
    var bodyEl = document.querySelector('[data-alert-detail-body]');

    if (badgeEl) {
      badgeEl.className = 'demo-alert-badge demo-alert-badge--' + alert.severity;
      badgeEl.textContent = SEVERITY_LABEL[alert.severity];
    }
    if (titleEl) titleEl.textContent = alert.title;
    if (metaEl) {
      metaEl.textContent = (BREEDS[breed] ? BREEDS[breed].label : '') + ' · ' + alert.category;
    }
    if (bodyEl) {
      var html = alert.body.map(function (p) { return '<p>' + p + '</p>'; }).join('');
      html +=
        '<div class="demo-alert-detail__block">' +
          '<p class="demo-alert-detail__label">Watch for</p>' +
          '<ul>' + alert.watch.map(function (w) { return '<li>' + w + '</li>'; }).join('') + '</ul>' +
        '</div>' +
        '<div class="demo-alert-detail__block">' +
          '<p class="demo-alert-detail__label">When to call the vet</p>' +
          '<p><strong>' + alert.when + '</strong></p>' +
        '</div>';
      bodyEl.innerHTML = html;
    }

    detailDialog.showModal();
    if (!usedDetail) {
      usedDetail = true;
      lockDemo();
    }
  }

  if (breedRoot) {
    breedRoot.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-breed]');
      if (!btn) return;
      breed = btn.getAttribute('data-breed') || 'labrador';
      breedRoot.querySelectorAll('.demo-breed-pick').forEach(function (pick) {
        var active = pick === btn;
        pick.classList.toggle('is-active', active);
        pick.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      renderAlerts();
    });
  }

  if (filtersRoot) {
    filtersRoot.addEventListener('click', function (e) {
      var tab = e.target.closest('[data-alert-filter]');
      if (!tab) return;
      severityFilter = tab.getAttribute('data-alert-filter') || 'all';
      filtersRoot.querySelectorAll('.demo-hub-tab').forEach(function (btn) {
        var active = btn === tab;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      renderAlerts();
    });
  }

  document.querySelectorAll('[data-alert-detail-close]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (detailDialog) detailDialog.close();
    });
  });

  if (detailDialog) {
    detailDialog.addEventListener('click', function (e) {
      if (e.target === detailDialog) detailDialog.close();
    });
  }

  renderAlerts();
  retargetSignup();
})();
