/**
 * Joey AI marketing site — behaviour.
 *
 * No dependencies, no build step. Every interactive block is guarded so a
 * missing element on one page (the legal pages share this file) is a no-op
 * rather than a thrown error that kills the rest of the script.
 */
(function () {
  'use strict';

  var CONFIG = window.JOEY_CONFIG || {};
  var APP_URL = (CONFIG.appUrl || 'https://joey.ai').replace(/\/+$/, '');
  var PATHS = CONFIG.paths || {};
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  /* ======================================================================
     Outbound links
     ----------------------------------------------------------------------
     Markup ships real hrefs so the page works without JS. This only
     retargets them when config.js points somewhere other than production
     (staging, a preview deploy, a local Next.js dev server on :4444).
     ====================================================================== */

  (function retargetLinks() {
    if (!APP_URL) return;

    $$('[data-cta]').forEach(function (link) {
      var path = PATHS[link.getAttribute('data-cta')] || '/';
      link.setAttribute('href', APP_URL + path);
      // External destination — never leak the referrer's opener handle.
      link.setAttribute('rel', 'noopener');
    });

    if (CONFIG.supportEmail) {
      $$('[data-support-email]').forEach(function (el) {
        el.setAttribute('href', 'mailto:' + CONFIG.supportEmail);
        if (el.textContent.indexOf('@') !== -1) el.textContent = CONFIG.supportEmail;
      });
    }
  })();

  /* ======================================================================
     Copyright year — was hardcoded, drifts silently every January.
     ====================================================================== */

  $$('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ======================================================================
     Announcement bar
     ----------------------------------------------------------------------
     Dismissible, and the dismissal sticks. `no-announce` on <body> zeroes
     the --announce-h token so the sticky nav offset and the anchor
     scroll-padding both stay correct after it is removed.
     ====================================================================== */

  (function announceBar() {
    var bar = $('[data-announce]');
    var closeBtn = $('[data-announce-close]');
    if (!bar || !closeBtn) return;

    var KEY = 'joey.announce.dismissed.v1';

    function readDismissed() {
      try {
        return window.localStorage.getItem(KEY) === '1';
      } catch (err) {
        return false; // Private mode / storage disabled — just show the bar.
      }
    }

    if (readDismissed()) {
      bar.hidden = true;
      document.body.classList.add('no-announce');
      return;
    }

    closeBtn.addEventListener('click', function () {
      bar.hidden = true;
      document.body.classList.add('no-announce');
      try {
        window.localStorage.setItem(KEY, '1');
      } catch (err) {
        /* Nothing to do — dismissal is best-effort. */
      }
    });
  })();

  /* ======================================================================
     Sticky nav shadow
     ====================================================================== */

  (function stickyNav() {
    var nav = $('[data-nav]');
    if (!nav) return;

    function sync() {
      nav.classList.toggle('is-stuck', window.scrollY > 8);
    }

    sync();
    window.addEventListener('scroll', sync, { passive: true });
  })();

  /* ======================================================================
     Mobile menu
     ----------------------------------------------------------------------
     Closes on link click, Escape, and outside click. Focus returns to the
     toggle on keyboard dismissal. The open state uses its own class rather
     than borrowing `is-stuck`, which previously stayed applied after the
     menu closed and left the nav mis-styled at scroll position 0.
     ====================================================================== */

  (function mobileMenu() {
    var toggle = $('[data-menu-toggle]');
    var menu = $('[data-mobile-nav]');
    var nav = $('[data-nav]');
    if (!toggle || !menu) return;

    function isOpen() {
      return toggle.getAttribute('aria-expanded') === 'true';
    }

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      menu.hidden = !open;
      if (nav) nav.classList.toggle('is-menu-open', open);
    }

    setOpen(false);

    toggle.addEventListener('click', function (event) {
      event.stopPropagation();
      setOpen(!isOpen());
    });

    menu.addEventListener('click', function (event) {
      if (event.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape' || !isOpen()) return;
      setOpen(false);
      toggle.focus();
    });

    document.addEventListener('click', function (event) {
      if (!isOpen()) return;
      if (menu.contains(event.target) || toggle.contains(event.target)) return;
      setOpen(false);
    });

    // Leaving the mobile breakpoint with the menu open would otherwise strand
    // an open panel over the desktop layout.
    var wide = window.matchMedia('(min-width: 861px)');
    var onChange = function (event) {
      if (event.matches && isOpen()) setOpen(false);
    };
    if (wide.addEventListener) wide.addEventListener('change', onChange);
    else if (wide.addListener) wide.addListener(onChange);
  })();

  /* ======================================================================
     Hero video
     ----------------------------------------------------------------------
     Muted autoplay is desktop-only. Phones crop most of the frame away
     anyway (portrait source into a landscape hero), so there's no reason
     to make a small screen download a video it'll barely see — it gets
     the poster image instead. `preload` starts at "none" in the markup;
     this only escalates it once a desktop viewport is confirmed.
     ====================================================================== */

  (function heroVideo() {
    var video = $('[data-hero-video]');
    if (!video) return;

    var desktop = window.matchMedia('(min-width: 768px)');

    function sync(matches) {
      if (matches && !prefersReducedMotion) {
        video.setAttribute('preload', 'auto');
        video.play().catch(function () {
          /* Autoplay blocked by the browser — the poster still shows. */
        });
      } else {
        video.pause();
      }
    }

    sync(desktop.matches);
    var onChange = function (event) {
      sync(event.matches);
    };
    if (desktop.addEventListener) desktop.addEventListener('change', onChange);
    else if (desktop.addListener) desktop.addListener(onChange);
  })();

  /* ======================================================================
     FAQ accordion
     ====================================================================== */

  (function faq() {
    $$('.faq-item button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var panel = document.getElementById(btn.getAttribute('aria-controls'));
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', open ? 'false' : 'true');
        if (panel) panel.hidden = open;
      });
    });
  })();

  /* ======================================================================
     Toxic-food checker
     ----------------------------------------------------------------------
     A demo of the checker that ships inside the app. Two rules govern it,
     because this is health-adjacent copy and a confident wrong answer is
     worse than no answer:

       1. Matching is on whole words / phrases, never substrings. The old
          `indexOf` version answered "pineapple" from the "apple" entry and
          "chicken curry" from the "chicken" entry — reassuring the reader
          about an onion- and garlic-heavy dish.
       2. "Safe" is never the fallback. An unrecognised food, or a safe
          ingredient buried in a prepared dish, resolves to "ask Joey",
          not to "generally fine".

     Severity levels mirror the `toxicity_level` enum on the backend's
     `toxic_foods` table (mild | moderate | severe | lethal), and the entries
     below are drawn from its seed data so the demo and the product agree.
     ====================================================================== */

  var LEVELS = {
    lethal: { rank: 5, label: 'Emergency — call a vet now', triage: 'triage-emergency', css: 'level-lethal' },
    severe: { rank: 4, label: 'Unsafe — vet within 24 hours', triage: 'triage-emergency', css: 'level-severe' },
    moderate: { rank: 3, label: 'Not safe — avoid', triage: 'triage-monitor', css: 'level-moderate' },
    mild: { rank: 2, label: 'Best avoided', triage: 'triage-urgent', css: 'level-mild' },
    safe: { rank: 1, label: 'Generally fine in small amounts', triage: 'triage-routine', css: 'level-safe' }
  };

  // `names` are matched as whole words or whole phrases, longest first.
  var FOODS = [
    // ---- Lethal -------------------------------------------------------
    { names: ['chocolate', 'dark chocolate', 'cocoa', 'cacao', 'baking chocolate', 'milk chocolate'], level: 'lethal', title: 'Chocolate & cocoa', text: 'Theobromine and caffeine. Dark and baking chocolate are the most dangerous — around 2–3 g per kg of body weight can be fatal.', watch: 'Hyperactivity, vomiting, tremors, seizures, cardiac arrest.' },
    { names: ['xylitol', 'birch sugar', 'sugar free gum', 'sugar-free gum', 'sugarfree gum'], level: 'lethal', title: 'Xylitol', text: 'Hides in sugar-free gum, some peanut butters, and baked goods. As little as 0.1 g per kg causes severe hypoglycemia and can lead to liver failure.', watch: 'Vomiting, lethargy, collapse, seizures.' },
    { names: ['grape', 'grapes', 'raisin', 'raisins', 'sultana', 'sultanas', 'currants'], level: 'lethal', title: 'Grapes & raisins', text: 'Cause acute kidney injury. The toxic threshold is unknown, so treat every amount as dangerous — including a single grape.', watch: 'Vomiting, lethargy, reduced urination.' },
    { names: ['alcohol', 'beer', 'wine', 'whisky', 'whiskey', 'rum', 'vodka', 'liquor'], level: 'lethal', title: 'Alcohol', text: 'Dogs metabolise alcohol far more slowly than people. Small volumes cause serious poisoning.', watch: 'Vomiting, unsteadiness, low body temperature, respiratory depression.' },
    { names: ['tobacco', 'nicotine', 'cigarette', 'cigarettes', 'vape', 'vape liquid', 'nicotine patch'], level: 'lethal', title: 'Tobacco & nicotine', text: 'Includes patches, gum, and vape liquid. Concentrated nicotine is rapidly fatal.', watch: 'Hyperexcitability, tremors, seizures, cardiac arrest.' },
    { names: ['paracetamol', 'acetaminophen', 'crocin', 'dolo', 'ibuprofen', 'brufen', 'aspirin', 'painkiller', 'painkillers'], level: 'lethal', title: 'Human painkillers', text: 'Never give human pain medication to a dog. Paracetamol damages the liver and red blood cells; ibuprofen and aspirin cause stomach ulcers and kidney failure. Doses that are routine for people are toxic for dogs.', watch: 'Vomiting, dark or brown gums, swollen face, black stool, collapse.' },

    // ---- Severe -------------------------------------------------------
    { names: ['onion', 'onions', 'onion powder', 'spring onion', 'leek', 'leeks', 'chives', 'shallot', 'shallots'], level: 'severe', title: 'Onion & the allium family', text: 'N-propyl disulfide destroys red blood cells. Raw, cooked, fried, and powdered forms are all toxic — powder most of all.', watch: 'Vomiting, weakness, pale gums, dark urine.' },
    { names: ['macadamia', 'macadamia nuts', 'macadamia nut'], level: 'severe', title: 'Macadamia nuts', text: 'As little as 2 g per kg causes signs within twelve hours. The mechanism is still unknown.', watch: 'Weakness, tremors, high temperature, vomiting.' },
    { names: ['caffeine', 'coffee', 'espresso', 'energy drink', 'energy drinks'], level: 'severe', title: 'Caffeine', text: 'A methylxanthine like theobromine, and dogs are far more sensitive to it than we are.', watch: 'Restlessness, tremors, vomiting, seizures.' },
    { names: ['raw dough', 'bread dough', 'yeast', 'yeast dough', 'raw bread dough'], level: 'severe', title: 'Raw yeast dough', text: 'Yeast keeps fermenting in the stomach, producing ethanol and gas. Risks both alcohol poisoning and life-threatening bloat.', watch: 'Swollen abdomen, retching without producing, distress.' },
    { names: ['cooked bone', 'cooked bones', 'chicken bones', 'chicken bone', 'poultry bones'], level: 'severe', title: 'Cooked bones', text: 'Cooked bone splinters into sharp shards. Never feed cooked bones of any kind, poultry least of all.', watch: 'Gagging, drooling, straining, bloody stool.' },
    { names: ['wild mushroom', 'wild mushrooms', 'toadstool'], level: 'severe', title: 'Wild mushrooms', text: 'Many species are fatal and identification in the field is unreliable. Store-bought button mushrooms are a different matter and are fine plain.', watch: 'Vomiting, jaundice, unsteadiness, seizures.' },
    { names: ['marijuana', 'cannabis', 'thc', 'weed', 'edible', 'edibles'], level: 'severe', title: 'Cannabis / THC', text: 'Edibles frequently combine THC with chocolate or xylitol, which stacks three toxins in one bite.', watch: 'Unsteadiness, dribbling urine, low temperature, unresponsiveness.' },
    { names: ['moldy food', 'mouldy food', 'spoiled food', 'compost', 'garbage', 'rubbish bin'], level: 'severe', title: 'Mouldy or spoiled food', text: 'Tremorgenic mycotoxins from kitchen waste and compost act fast and are a common emergency.', watch: 'Muscle tremors, agitation, seizures.' },
    { names: ['star fruit', 'starfruit', 'carambola'], level: 'severe', title: 'Star fruit', text: 'Oxalate load comparable to grapes, with the same kidney risk.', watch: 'Vomiting, weakness, reduced urination.' },
    { names: ['excess salt', 'playdough', 'play dough', 'ice melt', 'rock salt'], level: 'severe', title: 'Salt overload', text: 'Homemade playdough and de-icing salt are the usual culprits, and sodium ion poisoning escalates quickly.', watch: 'Vomiting, tremors, seizures, extreme thirst.' },
    { names: ['hops'], level: 'severe', title: 'Hops', text: 'A brewing byproduct that causes malignant hyperthermia. Especially dangerous for greyhounds and Border collies.', watch: 'Rapid panting, racing heart, high temperature.' },
    { names: ['artificial sweetener', 'artificial sweeteners', 'diet food', 'sugar free'], level: 'severe', title: 'Artificial sweeteners', text: 'Read the label before sharing anything labelled sugar-free — xylitol is the one that turns this into an emergency.', watch: 'Sudden weakness, vomiting, collapse.' },

    // ---- Moderate -----------------------------------------------------
    { names: ['garlic'], level: 'moderate', title: 'Garlic', text: 'Roughly five times more potent than onion by weight. Small amounts in home cooking still accumulate into a problem.', watch: 'Vomiting, weakness, pale gums.' },
    { names: ['avocado'], level: 'moderate', title: 'Avocado', text: 'Persin sits in the skin and pit, and the flesh is largely fat — enough to trigger pancreatitis. The pit is also a choking and obstruction hazard.', watch: 'Vomiting, abdominal pain, loss of appetite.' },
    { names: ['nutmeg'], level: 'moderate', title: 'Nutmeg', text: 'Myristicin is a neurotoxin for dogs. Watch for it in festive baking.', watch: 'Disorientation, tremors, racing heart.' },
    { names: ['rhubarb'], level: 'moderate', title: 'Rhubarb', text: 'Oxalic acid binds calcium and can damage the kidneys.', watch: 'Drooling, tremors, reduced urination.' },
    { names: ['cherry', 'cherries', 'cherry pit', 'peach pit', 'apricot pit', 'plum pit', 'persimmon'], level: 'moderate', title: 'Stone fruit pits', text: 'Pits contain cyanogenic compounds and block the gut. The flesh is not the problem — the stone is.', watch: 'Vomiting, straining, difficulty breathing.' },
    { names: ['raw potato', 'green potato', 'sprouted potato'], level: 'moderate', title: 'Raw or green potato', text: 'Solanine concentrates in green and sprouting parts. Plain cooked white potato is fine.', watch: 'Vomiting, unsteadiness, weakness.' },
    { names: ['chilli', 'chili', 'chillies', 'hot pepper', 'hot peppers', 'capsicum spice'], level: 'moderate', title: 'Chilli & hot peppers', text: 'Capsaicin irritates the whole digestive tract. Common in leftovers shared from an Indian kitchen.', watch: 'Drooling, vomiting, diarrhoea.' },
    { names: ['bacon', 'cured pork', 'sausage', 'salami', 'fat trimmings'], level: 'moderate', title: 'Bacon & fatty cured meat', text: 'High fat plus high salt is a reliable trigger for pancreatitis, particularly in predisposed breeds.', watch: 'Vomiting, hunched posture, refusing food.' },
    { names: ['raw bone', 'raw bones', 'marrow bone', 'weight bearing bone'], level: 'moderate', title: 'Large raw bones', text: 'Recreational only, and never weight-bearing leg bones from large animals — they fracture teeth.', watch: 'Broken tooth, constipation, straining.' },

    // ---- Mild ---------------------------------------------------------
    { names: ['white chocolate'], level: 'mild', title: 'White chocolate', text: 'Only trace theobromine, so the real issue is fat and sugar rather than poisoning.', watch: 'Digestive upset.' },
    { names: ['apple seeds', 'apple core'], level: 'mild', title: 'Apple core & seeds', text: 'A few seeds are unlikely to harm, but the core is a choking hazard. Remove both and the flesh is a good snack.', watch: 'Gagging, coughing.' },
    { names: ['ice cream'], level: 'mild', title: 'Ice cream', text: 'Lactose plus sugar. Plain unsweetened yogurt is the better version of this treat — just check it for xylitol.', watch: 'Loose stool, gas.' },
    { names: ['chips', 'crisps', 'pretzels', 'salty snacks', 'namkeen'], level: 'mild', title: 'Salty snacks', text: 'Not toxic in a stray piece, but the sodium adds up and there is usually onion or garlic powder in the seasoning.', watch: 'Excess thirst.' },
    { names: ['pickle', 'pickles', 'achar'], level: 'mild', title: 'Pickles', text: 'Very high salt, and Indian pickles usually carry garlic, chilli, and mustard oil too.', watch: 'Thirst, digestive upset.' },
    { names: ['citrus', 'lemon', 'lime', 'orange peel', 'grapefruit'], level: 'mild', title: 'Citrus peel & oils', text: 'Limonene and psoralens sit in the peel and pith. A little flesh is harmless; the peel is not worth it.', watch: 'Digestive upset.' },
    { names: ['green tomato', 'raw tomato', 'tomato plant', 'tomato leaves'], level: 'mild', title: 'Green tomato & plant', text: 'Solanine sits in unripe fruit, leaves, and stems. Ripe red flesh in small amounts is fine.', watch: 'Digestive upset, drowsiness.' },
    { names: ['bread'], level: 'mild', title: 'Plain bread', text: 'Not toxic, but empty calories with nothing useful in it. Raw dough is a completely different and serious matter.', watch: 'Weight gain over time.' },
    { names: ['coconut water'], level: 'mild', title: 'Coconut water', text: 'High potassium in volume. A few licks as a treat is fine.', watch: 'Loose stool.' },

    // ---- Generally safe ----------------------------------------------
    // Drawn from the app's diet catalog. Portion caveats travel with each
    // entry, because "safe" without a quantity is not useful advice.
    { names: ['apple'], level: 'safe', title: 'Apple', text: 'Peeled and deseeded, in small slices. Remove the core — the seeds and the choking risk both live there.' },
    { names: ['carrot', 'carrots'], level: 'safe', title: 'Carrot', text: 'Raw or cooked. A reliable low-calorie crunch at about 41 kcal per 100 g.' },
    { names: ['banana'], level: 'safe', title: 'Banana', text: 'Small quantities only — high sugar, so treat it as a treat rather than a topper.' },
    { names: ['pumpkin'], level: 'safe', title: 'Pumpkin', text: 'Cooked and plain. Excellent fibre for settling digestion, and only 26 kcal per 100 g.' },
    { names: ['blueberry', 'blueberries', 'strawberry', 'strawberries'], level: 'safe', title: 'Berries', text: 'Blueberries and strawberries are both fine in small handfuls.' },
    { names: ['watermelon'], level: 'safe', title: 'Watermelon', text: 'Deseeded and without the rind. Mostly water — good in heat.' },
    { names: ['cucumber'], level: 'safe', title: 'Cucumber', text: 'Peeled and raw. Among the lowest-calorie snacks available at 16 kcal per 100 g.' },
    { names: ['plain rice', 'white rice', 'brown rice', 'boiled rice'], level: 'safe', title: 'Plain cooked rice', text: 'A staple of bland recovery meals. Plain and unseasoned only — restaurant or leftover rice usually carries onion, garlic, and salt.' },
    { names: ['chicken', 'plain chicken', 'boiled chicken', 'chicken breast', 'cooked chicken'], level: 'safe', title: 'Plain cooked chicken', text: 'Boiled, skinless, boneless, and unseasoned. No onion, no garlic, no masala, and never cooked bones.' },
    { names: ['sweet potato'], level: 'safe', title: 'Sweet potato', text: 'Cooked and plain. Good fibre and a gentler carbohydrate than white potato.' },
    { names: ['plain yogurt', 'curd', 'dahi', 'yoghurt', 'yogurt'], level: 'safe', title: 'Plain yogurt', text: 'Unsweetened and probiotic-rich. Check the label for xylitol in anything flavoured.' },
    { names: ['paneer'], level: 'safe', title: 'Paneer', text: 'Low-fat and plain, in small amounts. Skip it entirely if your dog is lactose-sensitive.' },
    { names: ['egg', 'eggs', 'boiled egg'], level: 'safe', title: 'Cooked egg', text: 'Fully cooked and plain. Skip raw egg.' },
    { names: ['green beans', 'peas', 'green peas'], level: 'safe', title: 'Green beans & peas', text: 'Cooked and plain. Good fibre, low calorie.' },
    { names: ['salmon', 'sardines', 'white fish', 'fish'], level: 'safe', title: 'Cooked fish', text: 'Cooked and fully deboned. Never raw, and never with the bones in.' },
    { names: ['broccoli'], level: 'safe', title: 'Broccoli', text: 'Cooked, and no more than about 10% of the meal — isothiocyanates irritate the gut in quantity.' },
    { names: ['oats', 'oatmeal'], level: 'safe', title: 'Rolled oats', text: 'Cooked plain in water, no sugar or milk.' },
    { names: ['peanut butter'], level: 'safe', title: 'Peanut butter', text: 'Only after you have read the label and confirmed there is no xylitol. That check is not optional — it is the difference between a treat and an emergency.' }
  ];

  // Words that carry no food meaning and should not block a confident match.
  var STOPWORDS = {
    can: 1, my: 1, dog: 1, dogs: 1, puppy: 1, eat: 1, eats: 1, eating: 1, a: 1, an: 1, the: 1,
    is: 1, are: 1, it: 1, this: 1, that: 1, safe: 1, ok: 1, okay: 1, for: 1, to: 1, do: 1, does: 1,
    give: 1, feed: 1, have: 1, some: 1, any: 1, of: 1, and: 1, with: 1, in: 1, on: 1, i: 1, he: 1,
    she: 1, they: 1, him: 1, her: 1, them: 1, please: 1, plain: 1, raw: 1, cooked: 1, boiled: 1,
    fresh: 1, small: 1, little: 1, bit: 1, piece: 1, pieces: 1
  };

  function normalise(raw) {
    return String(raw || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Whole-word / whole-phrase containment. `needle` must appear in `haystack`
   * bounded by string edges or spaces — so "apple" does not match
   * "pineapple", and "grape" does not match "grapefruit".
   */
  function containsPhrase(haystack, needle) {
    var padded = ' ' + haystack + ' ';
    return padded.indexOf(' ' + needle + ' ') !== -1;
  }

  /**
   * Every matching entry, most severe first — severity is the safe default
   * when a query names several foods ("chicken with onion gravy" is an onion
   * answer, not a chicken one).
   *
   * The one exception is specificity: an entry whose alias strictly contains
   * the leader's alias describes the same food more precisely and wins even
   * at lower severity. That is what makes "white chocolate" resolve to its
   * own mild entry instead of the lethal bare-"chocolate" one.
   */
  function findMatches(query) {
    var hits = [];

    FOODS.forEach(function (entry) {
      var best = null;
      entry.names.forEach(function (name) {
        if (!containsPhrase(query, name)) return;
        if (!best || name.length > best.length) best = name;
      });
      if (best) hits.push({ entry: entry, alias: best });
    });

    hits.sort(function (a, b) {
      var diff = LEVELS[b.entry.level].rank - LEVELS[a.entry.level].rank;
      return diff !== 0 ? diff : b.alias.length - a.alias.length;
    });

    if (hits.length > 1) {
      var leader = hits[0];
      for (var i = 1; i < hits.length; i++) {
        if (hits[i].alias.length > leader.alias.length && containsPhrase(hits[i].alias, leader.alias)) {
          hits.unshift(hits.splice(i, 1)[0]);
          break;
        }
      }
    }

    return hits;
  }

  /**
   * True when the query carries meaningful words the matched alias does not
   * account for — "carrot cake" beyond "carrot", "chicken curry" beyond
   * "chicken". A safe verdict must not survive this, because the unaccounted
   * word is usually where the onion, sugar, or salt is hiding.
   */
  function hasUnaccountedWords(query, alias) {
    var aliasWords = {};
    alias.split(' ').forEach(function (w) {
      aliasWords[w] = 1;
    });

    return query.split(' ').some(function (word) {
      return word && !aliasWords[word] && !STOPWORDS[word];
    });
  }

  (function foodChecker() {
    var form = $('[data-checker]');
    var out = $('[data-checker-out]');
    if (!form || !out) return;

    var input = form.elements.food;

    function render(html, levelClass) {
      out.className = 'checker-out ' + (levelClass || '');
      out.innerHTML = html;
    }

    function escapeHtml(str) {
      return String(str).replace(/[&<>"']/g, function (ch) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
      });
    }

    function verdict(title, level, body, watch) {
      var meta = LEVELS[level];
      var html =
        '<strong>' + escapeHtml(title) + '</strong>' +
        '<span class="triage ' + meta.triage + '">' + escapeHtml(meta.label) + '</span>' +
        '<p>' + escapeHtml(body) + '</p>';
      if (watch) html += '<p><b>Watch for:</b> ' + escapeHtml(watch) + '</p>';
      return { html: html, css: meta.css };
    }

    function check(raw) {
      var query = normalise(raw);

      if (!query) {
        render('<p>Type a food to check — try chocolate, grapes, or carrot.</p>', 'level-unknown');
        return;
      }

      var hits = findMatches(query);
      var top = hits[0];

      // Nothing recognised. This must never read as reassurance.
      if (!top) {
        render(
          '<strong>Not in this quick list</strong>' +
            '<span class="triage triage-monitor">Check before you feed it</span>' +
            '<p>This demo covers common foods only. Open Joey AI for the full checker, which reads the answer against your dog\'s breed, weight, allergies, and medications. If your dog has already eaten it, call your vet.</p>',
          'level-unknown'
        );
        return;
      }

      var entry = top.entry;

      // Anything unsafe wins outright, even when a safe ingredient also
      // matched — "chicken with onion gravy" is an onion answer.
      if (entry.level !== 'safe') {
        var bad = verdict(entry.title, entry.level, entry.text, entry.watch);
        render(bad.html, bad.css);
        return;
      }

      // Safe ingredient, but the query describes a prepared dish.
      if (hasUnaccountedWords(query, top.alias)) {
        render(
          '<strong>Depends how it is prepared</strong>' +
            '<span class="triage triage-monitor">Check the recipe first</span>' +
            '<p>' + escapeHtml(entry.title) + ' on its own is generally fine, but a prepared dish usually is not. Onion, garlic, salt, sugar, chilli, and cooked bones are the usual problems, and any one of them changes the answer.</p>' +
            '<p>Ask Joey with the actual dish and your dog\'s file, or describe the ingredients to your vet.</p>',
          'level-unknown'
        );
        return;
      }

      var good = verdict(entry.title, 'safe', entry.text);
      render(good.html, good.css);
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      check(input ? input.value : '');
    });

    $$('[data-food-example]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var value = btn.getAttribute('data-food-example');
        if (input) input.value = value;
        check(value);
      });
    });
  })();

  /* ======================================================================
     Chat bubble reveal — decorative only, skipped under reduced motion.
     ====================================================================== */

  (function chatReveal() {
    if (prefersReducedMotion) return;

    var thread = $('[data-chat]');
    if (!thread || !('IntersectionObserver' in window)) return;

    var bubbles = $$(':scope > *', thread);
    if (!bubbles.length) return;

    bubbles.forEach(function (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(10px)';
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          observer.disconnect();
          bubbles.forEach(function (el, i) {
            window.setTimeout(function () {
              el.style.transition = 'opacity 260ms cubic-bezier(0.22,1,0.36,1), transform 260ms cubic-bezier(0.22,1,0.36,1)';
              el.style.opacity = '1';
              el.style.transform = 'none';
            }, 120 + i * 260);
          });
        });
      },
      { threshold: 0.35 }
    );

    observer.observe(thread);
  })();

  /* ======================================================================
     Analytics — opt-in only.
     ----------------------------------------------------------------------
     Nothing is requested until an id is configured, matching how the app's
     GoogleAnalytics / MicrosoftClarity components behave. CTA clicks are
     tagged so the funnel is measurable once an id exists.
     ====================================================================== */

  (function analytics() {
    if (CONFIG.gaId) {
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(CONFIG.gaId);
      document.head.appendChild(s);

      window.dataLayer = window.dataLayer || [];
      window.gtag = function () {
        window.dataLayer.push(arguments);
      };
      window.gtag('js', new Date());
      window.gtag('config', CONFIG.gaId);
    }

    if (CONFIG.clarityId) {
      (function (c, l, a, r, i, t, y) {
        c[a] =
          c[a] ||
          function () {
            (c[a].q = c[a].q || []).push(arguments);
          };
        t = l.createElement(r);
        t.async = 1;
        t.src = 'https://www.clarity.ms/tag/' + i;
        y = l.getElementsByTagName(r)[0];
        y.parentNode.insertBefore(t, y);
      })(window, document, 'clarity', 'script', CONFIG.clarityId);
    }

    $$('[data-analytics]').forEach(function (link) {
      link.addEventListener('click', function () {
        if (typeof window.gtag !== 'function') return;
        window.gtag('event', 'cta_click', {
          cta: link.getAttribute('data-cta') || 'link',
          location: link.getAttribute('data-analytics')
        });
      });
    });
  })();
})();
