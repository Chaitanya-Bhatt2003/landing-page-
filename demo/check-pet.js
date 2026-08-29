/**
 * Joey AI — Dog Symptom Checker demo (Omelo-style wizard).
 */
(function () {
  'use strict';

  var STEPS = ['intro', 'symptom', 'duration', 'context', 'result'];
  var state = { symptom: '', duration: '', context: '' };
  var stepIndex = 0;

  var root = document.querySelector('[data-flow]');
  var progressRoot = document.querySelector('[data-flow-progress]');
  if (!root) return;

  var panels = {};
  STEPS.forEach(function (name) {
    panels[name] = document.querySelector('[data-flow-step="' + name + '"]');
  });

  var contextTitle = document.querySelector('[data-context-title]');
  var contextHint = document.querySelector('[data-context-hint]');
  var resultTriage = document.querySelector('[data-result-triage]');
  var resultHeadline = document.querySelector('[data-result-headline]');
  var resultBody = document.querySelector('[data-result-body]');
  var resultWatch = document.querySelector('[data-result-watch]');
  var resultActions = document.querySelector('[data-result-actions]');

  var SYMPTOM_COPY = {
    vomiting: { label: 'Vomiting', contextQ: 'Is your dog still drinking water?', contextH: 'Dehydration changes how urgent vomiting is tonight.' },
    'not-eating': { label: 'Not eating', contextQ: 'Is your dog drinking water normally?', contextH: 'Skipping food but drinking can be very different from skipping both.' },
    'low-energy': { label: 'Low energy', contextQ: 'Is your dog responsive when you call or touch them?', contextH: 'Lethargy plus unresponsiveness is more urgent than tired alone.' },
    limping: { label: 'Limping', contextQ: 'Is your dog putting any weight on that leg?', contextH: 'A leg held completely off the ground needs a faster look.' },
    coughing: { label: 'Coughing', contextQ: 'Is the cough getting worse or staying the same?', contextH: 'Rapid worsening — especially at rest — matters tonight.' },
    blood: { label: 'Blood', contextQ: 'Where did you see blood?', contextH: 'Vomit, stool, urine, or a wound each change the urgency.' },
    bathroom: { label: 'Bathroom problems', contextQ: 'Is your dog straining without producing anything?', contextH: 'Straining with nothing out can signal a blockage — treat seriously.' },
    'acting-off': { label: 'Acting off', contextQ: 'Did anything unusual happen today?', contextH: 'New food, a walk in heat, or a possible toxin exposure changes the plan.' },
  };

  function setProgress(step) {
    if (!progressRoot) return;
    var n = step === 'intro' ? 1 : step === 'symptom' ? 2 : step === 'duration' ? 3 : 4;
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

    var panel = panels[name];
    if (panel && window.DemoMotion) {
      window.DemoMotion.animatePanel(panel);
      var staggerRoot = panel.querySelector('[data-demo-stagger]');
      if (staggerRoot) window.DemoMotion.stagger(staggerRoot);
    }

    if (panel) {
      var focusable = panel.querySelector('button, [href], input, textarea');
      if (focusable) window.setTimeout(function () { focusable.focus(); }, 80);
    }
  }

  function clearSelections(container) {
    if (!container) return;
    container.querySelectorAll('.is-selected').forEach(function (el) {
      el.classList.remove('is-selected');
    });
  }

  function buildResult() {
    var s = state.symptom;
    var d = state.duration;
    var c = state.context;
    var copy = SYMPTOM_COPY[s] || { label: 'this symptom' };

    var triage = 'monitor';
    var headline = 'Monitor closely tonight';
    var body = 'Based on what you shared, Joey would start with a calm monitoring plan — but escalate fast if anything worsens.';
    var watch = ['Appetite and water intake', 'Energy and responsiveness', 'Whether symptoms repeat or worsen'];
    var actions = ['Log symptoms in Joey tonight', 'Call your vet in the morning if nothing improves', 'Use AI vet chat for follow-up questions'];

    if (s === 'blood') {
      triage = 'emergency';
      headline = 'Treat this as an emergency';
      body = 'Blood in vomit, stool, urine, or from a wound needs a veterinarian now — not a wait-and-see plan. If bleeding is heavy or your dog is weak, go to the nearest emergency hospital.';
      watch = ['Pale gums', 'Collapse or extreme weakness', 'Bleeding that will not stop'];
      actions = ['Call your emergency vet now', 'Keep your dog calm and warm on the way', 'Bring a photo or sample if safe to do so'];
    } else if (s === 'vomiting') {
      if (d === 'multi-day' || c === 'not-at-all') triage = 'urgent';
      if (d === 'just-started' && c === 'yes-normal') triage = 'monitor';
      headline = triage === 'urgent' ? 'Vet contact within 24 hours' : 'Watch vomiting closely tonight';
      body = 'For Bruno (Labrador, 4 yrs), repeated vomiting plus poor fluid intake pushes this toward urgent. A single vomit with normal drinking is often monitor — but not if blood, bloat, or swallowed objects are possible.';
      watch = ['Repeated vomiting', 'Blood or coffee-ground vomit', 'Bloated or painful belly', 'Lethargy'];
      actions = triage === 'urgent'
        ? ['Withhold food for a few hours only if your vet agrees', 'Offer small amounts of water if keeping it down', 'Book a vet visit within 24 hours']
        : ['Small sips of water if tolerated', 'No rich treats or table scraps', 'Chat with Joey if it happens again tonight'];
    } else if (s === 'not-eating') {
      triage = c === 'not-at-all' || d === 'multi-day' ? 'urgent' : 'monitor';
      headline = triage === 'urgent' ? 'Skipping food and water needs a vet look' : 'Appetite dip — watch the next meal';
      body = 'Labs often skip a meal when warm or stressed. Skipping food AND water, or refusing food for more than a day, is a different conversation — especially with vomiting or lethargy.';
      watch = ['Vomiting or diarrhoea', 'Hunched posture', 'Gum colour'];
      actions = ['Offer bland food only if drinking normally', 'Weigh appetite against energy', 'Call your vet if still not eating by tomorrow'];
    } else if (s === 'limping') {
      triage = c === 'not-at-all' ? 'urgent' : 'monitor';
      headline = triage === 'urgent' ? 'Non-weight-bearing limp — vet today' : 'Limping — rest and observe';
      body = 'A sudden limp after play may be a sprain. A leg held completely off the ground, swelling, or crying when touched needs an exam — Joey would not wait the weekend on that.';
      watch = ['Swelling or heat in the joint', 'Worsening pain', 'Not bearing weight at all'];
      actions = ['Strict rest tonight', 'No stairs or jumping', 'Vet visit if not improved in 24–48 hours'];
    } else if (s === 'low-energy') {
      triage = c === 'not-at-all' ? 'urgent' : 'monitor';
      headline = triage === 'urgent' ? 'Unresponsive lethargy — call your vet' : 'Low energy — track overnight';
      body = 'Tired after a long walk is routine. Flat, uninterested, or hard to rouse is not — especially with vomiting, pale gums, or heat exposure.';
      watch = ['Gum colour', 'Breathing rate', 'Response to food or voice'];
      actions = ['Keep cool and quiet', 'Note when it started', 'Emergency vet if collapse or unresponsive'];
    } else if (s === 'coughing') {
      triage = d === 'multi-day' ? 'urgent' : 'monitor';
      headline = 'Cough — watch breathing tonight';
      body = 'A single cough after pulling on the lead is different from a persistent cough, especially in older dogs or breeds prone to heart or airway issues.';
      watch = ['Breathing effort', 'Blue or grey gums', 'Cough at rest'];
      actions = ['Avoid collar pressure — use a harness', 'Keep air cool and smoke-free', 'Vet if cough persists beyond 48 hours'];
    } else if (s === 'bathroom') {
      triage = c === 'not-at-all' ? 'emergency' : 'urgent';
      headline = triage === 'emergency' ? 'Possible blockage — emergency vet' : 'Bathroom changes need a vet plan';
      body = 'Straining with nothing produced, especially with vomiting, is an emergency until proven otherwise. Diarrhoea alone is often urgent if bloody or very frequent.';
      watch = ['Repeated straining', 'Blood in stool', 'Vomiting plus no stool'];
      actions = ['Do not give human anti-diarrhoea meds without vet advice', 'Collect a photo if safe', 'Call your vet today'];
    } else if (s === 'acting-off') {
      triage = d === 'just-started' ? 'monitor' : 'urgent';
      headline = 'Trust your instinct — log what changed';
      body = '"Acting off" is often the first sign owners notice before vomiting or pain shows. Joey would ask what is different: hiding, pacing, whining, or not greeting you at the door.';
      watch = ['Hiding or clinginess', 'Pacing or restlessness', 'New lumps or pain'];
      actions = ['Note exact behaviour changes', 'Check for toxins or new foods', 'Open AI vet chat with details'];
    }

    if (c === 'not-at-all' && triage === 'monitor') triage = 'urgent';
    if (d === 'multi-day' && triage === 'monitor' && s !== 'acting-off') triage = 'urgent';

    resultTriage.className = 'demo-triage demo-triage--' + triage;
    resultTriage.textContent = triage;

    resultHeadline.textContent = headline;
    resultBody.textContent = body.replace('Bruno', 'your dog');

    resultWatch.innerHTML = watch.map(function (w) { return '<li>' + w + '</li>'; }).join('');
    resultActions.innerHTML = actions.map(function (a) { return '<li>' + a + '</li>'; }).join('');
  }

  document.querySelectorAll('[data-flow-next]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      showStep('symptom');
    });
  });

  document.querySelectorAll('[data-flow-back]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (stepIndex > 0) showStep(STEPS[stepIndex - 1]);
    });
  });

  document.querySelectorAll('[data-flow-step="symptom"] [data-flow-pick]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      clearSelections(document.querySelector('[data-symptom-grid]'));
      btn.classList.add('is-selected');
      state.symptom = btn.getAttribute('data-symptom');
      var meta = SYMPTOM_COPY[state.symptom];
      if (contextTitle && meta) contextTitle.textContent = meta.contextQ;
      if (contextHint && meta) contextHint.textContent = meta.contextH;
      window.setTimeout(function () { showStep('duration'); }, 180);
    });
  });

  document.querySelectorAll('[data-duration-options] [data-flow-pick]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      clearSelections(document.querySelector('[data-duration-options]'));
      btn.classList.add('is-selected');
      state.duration = btn.getAttribute('data-duration');
      window.setTimeout(function () { showStep('context'); }, 180);
    });
  });

  document.querySelectorAll('[data-context-options] [data-flow-pick]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      clearSelections(document.querySelector('[data-context-options]'));
      btn.classList.add('is-selected');
      state.context = btn.getAttribute('data-context');
      buildResult();
      window.setTimeout(function () { showStep('result'); }, 220);
    });
  });

  document.querySelectorAll('[data-flow-restart]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      state = { symptom: '', duration: '', context: '' };
      clearSelections(document.querySelector('[data-symptom-grid]'));
      clearSelections(document.querySelector('[data-duration-options]'));
      clearSelections(document.querySelector('[data-context-options]'));
      showStep('intro');
    });
  });

  var CONFIG = window.JOEY_CONFIG || {};
  var APP_URL = (CONFIG.appUrl || 'https://joey.ai').replace(/\/+$/, '');
  var signupPath = (CONFIG.paths && CONFIG.paths.signup) || '/signup';
  document.querySelectorAll('[data-cta="signup"]').forEach(function (link) {
    link.setAttribute('href', APP_URL + signupPath);
    link.setAttribute('rel', 'noopener');
  });

  showStep('intro');
})();
