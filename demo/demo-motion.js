/**
 * Joey AI — shared demo motion (page enter, stagger, flow panels, messages).
 */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function animatePanel(panel) {
    if (!panel || reduced) return;
    panel.classList.remove('flow-panel--enter');
    void panel.offsetWidth;
    panel.classList.add('flow-panel--enter');
  }

  function stagger(container) {
    if (!container || reduced) return;
    var items = container.children;
    for (var i = 0; i < items.length; i++) {
      var el = items[i];
      el.style.setProperty('--stagger', String(i));
      el.classList.remove('demo-stagger-in');
      void el.offsetWidth;
      el.classList.add('demo-stagger-in');
    }
  }

  function revealMsg(el) {
    if (!el || reduced) return;
    el.classList.add('demo-msg--in');
  }

  function revealBlock(el) {
    if (!el || reduced) return;
    el.classList.remove('demo-reveal-block--in');
    void el.offsetWidth;
    el.classList.add('demo-reveal-block--in');
  }

  function initPage() {
    document.body.classList.add('demo-is-ready');

    document.querySelectorAll('[data-demo-stagger]').forEach(function (root) {
      stagger(root);
    });

    document.querySelectorAll('.demo-modal').forEach(function (dlg) {
      dlg.addEventListener('close', function () {
        dlg.classList.remove('demo-modal--open');
      });
      dlg.addEventListener('cancel', function (e) {
        e.preventDefault();
        dlg.close();
      });
    });
  }

  window.DemoMotion = {
    animatePanel: animatePanel,
    stagger: stagger,
    revealMsg: revealMsg,
    revealBlock: revealBlock,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage);
  } else {
    initPage();
  }
})();
