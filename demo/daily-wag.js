/**
 * Joey AI — Daily Wag demo (one-minute check-in → score dashboard).
 */
(function () {
  'use strict';

  var STEPS = ['intro', 'appetite', 'energy', 'activity', 'stool', 'result'];
  var LOG_STEPS = ['appetite', 'energy', 'activity', 'stool'];
  var state = { appetite: '', energy: '', activity: '', stool: '' };
  var stepIndex = 0;
  var demoLocked = false;

  var root = document.querySelector('[data-flow]');
  var progressRoot = document.querySelector('[data-flow-progress]');
  if (!root) return;

  var panels = {};
  STEPS.forEach(function (name) {
    panels[name] = document.querySelector('[data-flow-step="' + name + '"]');
  });

  var scoreEl = document.querySelector('[data-wag-score]');
  var scoreHintEl = document.querySelector('[data-wag-score-hint]');
  var chipEl = document.querySelector('[data-wag-chip]');
  var ringEl = document.querySelector('[data-wag-ring]');
  var ringLabelEl = document.querySelector('[data-wag-ring-label]');
  var insightEl = document.querySelector('[data-wag-insight]');
  var watchWrap = document.querySelector('[data-wag-watch]');
  var watchList = document.querySelector('[data-wag-watch-list]');
  var limitBanner = document.querySelector('[data-demo-limit]');
  var restartBtn = document.querySelector('[data-flow-restart]');
  var energyBars = document.querySelector('[data-wag-energy-bars]');

  var DISPLAY = {
    appetite: {
      refused: { label: 'Refused', hint: 'Skipped both meals', points: 1 },
      less: { label: 'Less', hint: 'Picked at food', points: 2 },
      normal: { label: 'Normal', hint: 'Finished both meals', points: 5 },
      more: { label: 'More', hint: 'Extra hungry today', points: 4 },
    },
    energy: {
      '1': { label: '1 / 10', hint: 'Very lethargic', points: 1 },
      '2': { label: '3 / 10', hint: 'Low energy', points: 2 },
      '3': { label: '5 / 10', hint: 'Steady day', points: 3 },
      '4': { label: '7 / 10', hint: 'Playful after dinner', points: 4 },
      '5': { label: '9 / 10', hint: 'Bouncy all day', points: 5 },
    },
    activity: {
      rest: { label: 'Rest day', hint: 'Mostly napping', points: 2 },
      short: { label: '2.1 km', hint: 'Short neighbourhood loop', points: 3 },
      good: { label: '4.8 km', hint: 'Solid walk + play', points: 4 },
      high: { label: '6.2 km', hint: 'Above the 7-day average', points: 5 },
    },
    stool: {
      normal: { label: 'Normal', hint: 'Firm and smooth', points: 5 },
      soft: { label: 'Soft', hint: 'Monitor if it repeats', points: 3 },
      loose: { label: 'Loose', hint: 'Worth a vet call if ongoing', points: 1 },
      hard: { label: 'Hard', hint: 'Hydration and fibre check', points: 2 },
    },
  };

  function setProgress(step) {
    if (!progressRoot) return;
    var n = step === 'intro' ? 0 : LOG_STEPS.indexOf(step) + 1;
    if (step === 'result') n = 5;
    progressRoot.querySelectorAll('[data-progress-seg]').forEach(function (seg, i) {
      seg.classList.toggle('is-done', i < n);
    });
  }

  function showStep(name) {
    stepIndex = STEPS.indexOf(name);
    STEPS.forEach(function (key) {
      if (!panels[key]) return;
      var active = key === name;
      panels[key].hidden = !active;
      panels[key].classList.toggle('is-active', active);
    });
    setProgress(name);

    if (name === 'result') {
      buildResult();
      demoLocked = true;
      if (limitBanner) limitBanner.hidden = false;
      if (restartBtn) restartBtn.hidden = true;
    }

    var panel = panels[name];
    if (panel && window.DemoMotion) {
      window.DemoMotion.animatePanel(panel);
      var staggerRoot = panel.querySelector('[data-demo-stagger]');
      if (staggerRoot) window.DemoMotion.stagger(staggerRoot);
    }

    if (panel && name !== 'result') {
      var focusable = panel.querySelector('button:not([hidden])');
      if (focusable) window.setTimeout(function () { focusable.focus(); }, 80);
    }
  }

  function clearGroup(group) {
    var container = document.querySelector('[data-wag-pick-group="' + group + '"]');
    if (!container) return;
    container.querySelectorAll('.is-selected').forEach(function (el) {
      el.classList.remove('is-selected');
    });
  }

  function clearAllSelections() {
    LOG_STEPS.forEach(clearGroup);
  }

  function computeScore() {
    var total = 0;
    var count = 0;
    LOG_STEPS.forEach(function (key) {
      var val = state[key];
      var row = DISPLAY[key] && DISPLAY[key][val];
      if (row) {
        total += row.points;
        count += 1;
      }
    });
    if (!count) return 72;
    var avg = total / count;
    return Math.round(58 + avg * 8.4);
  }

  function chipForScore(score) {
    if (score >= 82) return { text: 'On track', className: 'metric-chip metric-chip--good' };
    if (score >= 68) return { text: 'Watch closely', className: 'metric-chip demo-wag-chip--watch' };
    return { text: 'Needs attention', className: 'metric-chip demo-wag-chip--alert' };
  }

  function animateRing(score) {
    if (!ringEl) return;
    ringEl.style.stroke = 'url(#wag-ring-demo)';
    ringEl.style.strokeDasharray = score + ' 100';
    ringEl.style.strokeDashoffset = '100';
    ringEl.style.transition = 'none';
    void ringEl.offsetWidth;
    ringEl.style.transition = 'stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1)';
    ringEl.style.strokeDashoffset = '0';

    if (ringLabelEl) {
      var current = 0;
      var target = score;
      var start = performance.now();
      function tick(now) {
        var t = Math.min(1, (now - start) / 900);
        current = Math.round(target * t);
        ringLabelEl.textContent = current + '%';
        if (t < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
  }

  function setMetric(key) {
    var val = state[key];
    var row = DISPLAY[key] && DISPLAY[key][val];
    var metricEl = document.querySelector('[data-wag-metric="' + key + '"]');
    var hintEl = document.querySelector('[data-wag-hint="' + key + '"]');
    if (metricEl && row) metricEl.textContent = row.label;
    if (hintEl && row) hintEl.textContent = row.hint;

    if (key === 'energy' && energyBars && row) {
      var level = parseInt(state.energy, 10) || 3;
      var onCount = Math.max(1, Math.min(10, level * 2));
      energyBars.querySelectorAll('span').forEach(function (bar, i) {
        bar.classList.toggle('is-on', i < onCount);
      });
    }
  }

  function buildResult() {
    var score = computeScore();
    var chip = chipForScore(score);

    if (scoreEl) scoreEl.textContent = String(score);
    if (scoreHintEl) {
      scoreHintEl.textContent = score >= 80
        ? 'Steady week · demo check-in'
        : 'Demo check-in · log again tomorrow in the app';
    }
    if (chipEl) {
      chipEl.textContent = chip.text;
      chipEl.className = chip.className;
    }

    LOG_STEPS.forEach(setMetric);
    animateRing(score);

    var flags = [];
    if (state.appetite === 'refused' || state.appetite === 'less') {
      flags.push('Appetite below baseline — note if it continues past one meal');
    }
    if (state.stool === 'loose') {
      flags.push('Loose stool — hydrate and call your vet if it persists 24 hours');
    }
    if (state.stool === 'hard') {
      flags.push('Hard stool — check water intake and fibre');
    }
    if (parseInt(state.energy, 10) <= 2) {
      flags.push('Low energy — watch responsiveness and gum colour tonight');
    }
    if (state.activity === 'rest' && parseInt(state.energy, 10) >= 4) {
      flags.push('High energy but low activity — could be rest day or soreness');
    }

    if (insightEl) {
      if (score >= 82) {
        insightEl.textContent = 'A steady day overall. Joey would fold this into your weekly trend and only ping you if the same signal shows up twice.';
      } else if (score >= 68) {
        insightEl.textContent = 'Nothing alarming on its own — but Joey would watch for a repeat tomorrow before calling it normal.';
      } else {
        insightEl.textContent = 'A few signals worth a closer look. In the full app, Joey compares today against your dog\'s own baseline — not generic averages.';
      }
    }

    if (watchWrap && watchList) {
      if (flags.length) {
        watchWrap.hidden = false;
        watchList.innerHTML = flags.map(function (f) { return '<li>' + f + '</li>'; }).join('');
      } else {
        watchWrap.hidden = true;
        watchList.innerHTML = '';
      }
    }
  }

  function nextAfterPick(group) {
    var idx = LOG_STEPS.indexOf(group);
    if (idx === -1) return;
    if (idx < LOG_STEPS.length - 1) {
      showStep(LOG_STEPS[idx + 1]);
    } else {
      showStep('result');
    }
  }

  document.querySelectorAll('[data-flow-next]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (demoLocked) return;
      showStep('appetite');
    });
  });

  document.querySelectorAll('[data-flow-back]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (demoLocked) return;
      var current = STEPS[stepIndex];
      var idx = STEPS.indexOf(current);
      if (idx > 0) showStep(STEPS[idx - 1]);
    });
  });

  document.querySelectorAll('[data-wag-pick]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (demoLocked) return;
      var groupEl = btn.closest('[data-wag-pick-group]');
      if (!groupEl) return;
      var group = groupEl.getAttribute('data-wag-pick-group');
      var value = btn.getAttribute('data-value');
      if (!group || !value) return;

      groupEl.querySelectorAll('.is-selected').forEach(function (el) {
        el.classList.remove('is-selected');
      });
      btn.classList.add('is-selected');
      state[group] = value;

      window.setTimeout(function () {
        nextAfterPick(group);
      }, 220);
    });
  });

  if (restartBtn) {
    restartBtn.addEventListener('click', function () {
      if (!demoLocked) return;
      state = { appetite: '', energy: '', activity: '', stool: '' };
      demoLocked = false;
      clearAllSelections();
      if (limitBanner) limitBanner.hidden = true;
      restartBtn.hidden = true;
      showStep('intro');
    });
  }

  showStep('intro');
})();
