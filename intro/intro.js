/**
 * Joey AI — cinematic opening intro.
 * Dog entrance → idle → greet → logo morph → smooth page reveal.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var intro = document.getElementById('joey-intro');
  if (!intro) {
    root.classList.remove('joey-intro-pending');
    return;
  }

  var CONFIG = (window.JOEY_CONFIG && window.JOEY_CONFIG.intro) || {};
  if (CONFIG.enabled === false) {
    finishImmediately();
    return;
  }

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DURATION_MS = typeof CONFIG.durationMs === 'number' ? CONFIG.durationMs : 3000;
  var cleanedUp = false;

  var TIMING = reducedMotion
    ? { logo: 380, reveal: 520, total: 900 }
    : {
        walk: 880,
        idle: 480,
        greet: 320,
        morph: 520,
        reveal: 900,
      };

  if (!reducedMotion) {
    TIMING.morphStart = TIMING.walk + TIMING.idle + TIMING.greet;
    TIMING.revealStart = TIMING.morphStart + 180;
    TIMING.total = DURATION_MS;
  }

  root.classList.add('joey-intro-active');

  if (reducedMotion) {
    intro.classList.add('is-reduced');
    runReducedSequence();
    return;
  }

  runFullSequence();

  function runFullSequence() {
    setPhase('walking');

    schedule(function () {
      setPhase('idle');
    }, TIMING.walk);

    schedule(function () {
      setPhase('greeting');
    }, TIMING.walk + TIMING.idle);

    schedule(function () {
      setPhase('morphing');
    }, TIMING.morphStart);

    schedule(function () {
      beginReveal();
    }, TIMING.revealStart);

    schedule(function () {
      teardown();
    }, TIMING.total);
  }

  function runReducedSequence() {
    schedule(function () {
      beginReveal();
    }, TIMING.logo);

    schedule(function () {
      teardown();
    }, TIMING.total);
  }

  function setPhase(name) {
    intro.classList.remove('is-walking', 'is-idle', 'is-greeting', 'is-morphing');
    if (name) intro.classList.add('is-' + name);
  }

  function beginReveal() {
    intro.classList.add('is-revealing');
    root.classList.add('joey-intro-revealing');
    root.classList.remove('joey-intro-active');
  }

  function teardown() {
    if (cleanedUp) return;
    intro.classList.add('is-complete');
    root.classList.remove('joey-intro-pending', 'joey-intro-active');
    schedule(cleanup, 140);
  }

  function cleanup() {
    if (cleanedUp) return;
    cleanedUp = true;
    root.classList.remove('joey-intro-revealing');
    if (intro.parentNode) intro.parentNode.removeChild(intro);
  }

  function finishImmediately() {
    root.classList.remove('joey-intro-pending', 'joey-intro-active', 'joey-intro-revealing');
    if (intro.parentNode) intro.parentNode.removeChild(intro);
  }

  function schedule(fn, delay) {
    return window.setTimeout(fn, delay);
  }
})();
