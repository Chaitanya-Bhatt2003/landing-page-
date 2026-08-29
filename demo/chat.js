/**
 * Joey AI — AI Vet Chat demo (static, 1 message limit, no saved pet data).
 */
(function () {
  'use strict';

  var DEMO_LIMIT = 1;

  var messagesEl = document.querySelector('[data-demo-messages]');
  var form = document.querySelector('[data-demo-form]');
  var input = document.querySelector('[data-demo-input]');
  var sendBtn = document.querySelector('[data-demo-send]');
  var micBtn = document.querySelector('[data-demo-mic]');
  var voiceErrorEl = document.querySelector('[data-demo-voice-error]');
  var promptsRoot = document.querySelector('[data-demo-prompts]');
  var composeEl = document.querySelector('[data-demo-compose]');
  var composeLimitEl = document.querySelector('[data-demo-compose-limit]');
  var limitBanner = document.querySelector('[data-demo-limit]');
  var quotaCount = document.querySelector('[data-demo-quota-count]');
  var quotaRoot = document.querySelector('[data-demo-quota]');
  if (!messagesEl || !form || !input) return;

  var typing = false;
  var messageId = 0;
  var userMessagesSent = 0;
  var demoLocked = false;
  var listening = false;
  var recognitionRef = null;
  var baseTextRef = '';

  function getSpeechRecognition() {
    if (typeof window === 'undefined') return null;
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
  }

  function showVoiceError(message) {
    if (!voiceErrorEl) return;
    if (message) {
      voiceErrorEl.textContent = message;
      voiceErrorEl.hidden = false;
    } else {
      voiceErrorEl.textContent = '';
      voiceErrorEl.hidden = true;
    }
  }

  function setListening(active) {
    listening = active;
    if (!micBtn) return;
    micBtn.classList.toggle('is-listening', active);
    micBtn.setAttribute('aria-pressed', active ? 'true' : 'false');
    micBtn.setAttribute('aria-label', active ? 'Stop dictation' : 'Dictate your message');
    micBtn.title = active ? 'Listening — click to stop' : 'Speak your message';
  }

  function stopListening() {
    if (recognitionRef) {
      try {
        recognitionRef.stop();
      } catch (err) {
        /* already stopped */
      }
      recognitionRef = null;
    }
    setListening(false);
  }

  function startListening() {
    var Recognition = getSpeechRecognition();
    if (!Recognition || demoLocked || !input) return;

    var recognition = new Recognition();
    recognition.lang = navigator.language || 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;

    baseTextRef = input.value ? input.value.trimEnd() + ' ' : '';

    recognition.onresult = function (e) {
      var transcript = '';
      for (var i = 0; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
      }
      input.value = baseTextRef + transcript;
      autoResize();
    };

    recognition.onerror = function (e) {
      showVoiceError(
        e.error === 'not-allowed'
          ? 'Microphone permission denied — allow access to dictate.'
          : 'Could not hear you. Try again or type instead.'
      );
      stopListening();
    };

    recognition.onend = function () {
      setListening(false);
      recognitionRef = null;
    };

    showVoiceError('');
    recognitionRef = recognition;
    setListening(true);

    try {
      recognition.start();
    } catch (err) {
      showVoiceError('Could not start dictation. Try again or type instead.');
      stopListening();
    }
  }

  function initVoiceInput() {
    var Recognition = getSpeechRecognition();
    if (!micBtn) return;

    if (Recognition) {
      micBtn.hidden = false;
      micBtn.addEventListener('click', function () {
        if (demoLocked || micBtn.disabled) return;
        if (listening) stopListening();
        else startListening();
      });
    }
  }

  var INITIAL = {
    role: 'assistant',
    content:
      "Hi — I'm Joey AI Vet. Tell me what's going on with your dog and I'll help you triage it in plain language. What's worrying you tonight?",
    time: Date.now(),
  };

  function formatTime(ts) {
    return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  function triageLabel(level) {
    return level.charAt(0).toUpperCase() + level.slice(1);
  }

  function buildReply(text) {
    var lower = text.toLowerCase();

    if (lower.indexOf('blood') !== -1 || lower.indexOf('bloat') !== -1) {
      return {
        content:
          "Blood or a hard, swollen belly is an emergency — don't wait on chat. Call your nearest emergency vet now and keep your dog calm and warm on the way.",
        triage: 'emergency',
      };
    }

    if (lower.indexOf('vomit') !== -1 || lower.indexOf('throw up') !== -1 || lower.indexOf('skipped dinner') !== -1) {
      return {
        content:
          "I hear you — vomiting plus a skipped meal needs a closer look. How long since the last vomit, and did you see blood, a toy, or anything they might have eaten off the floor?",
        triage: 'urgent',
      };
    }

    if (lower.indexOf('ear') !== -1 || lower.indexOf('itch') !== -1 || lower.indexOf('redness') !== -1) {
      return {
        content:
          "Got it — let's narrow this down. Where is your dog scratching most (ears, paws, belly), and is this new today or building for a few days?",
        triage: lower.indexOf('emergency') !== -1 ? 'urgent' : 'monitor',
      };
    }

    if (lower.indexOf('overnight') !== -1 || lower.indexOf('watch') !== -1) {
      return {
        content:
          "Tonight, log appetite, water intake, and energy every few hours. Call your vet in the morning if vomiting returns, they won't drink, or they seem painful or lethargic.",
        triage: 'monitor',
      };
    }

    if (lower.indexOf('rice') !== -1 || lower.indexOf('feed') !== -1 || lower.indexOf('diet') !== -1) {
      return {
        content:
          "After vomiting, a small portion of plain boiled rice with a little plain chicken can be gentle — but only once vomiting has stopped for several hours and they're keeping water down. Skip it if they vomit again.",
        triage: 'routine',
      };
    }

    return {
      content:
        "Thanks for the detail. Based on what you've shared, I'd start with a calm monitoring plan tonight — but tell me if appetite, energy, or vomiting changes. In the full app, Joey reads your dog's breed and history for a sharper answer.",
      triage: 'monitor',
    };
  }

  function renderMessage(msg) {
    var wrap = document.createElement('div');
    wrap.className = 'demo-msg demo-msg--' + msg.role;
    wrap.setAttribute('data-msg-id', String(msg.id));

    var bubble = document.createElement('div');
    bubble.className = 'demo-msg__bubble';

    var text = document.createElement('p');
    text.className = 'demo-msg__text';
    text.textContent = msg.content;
    bubble.appendChild(text);

    if (msg.triage) {
      var chip = document.createElement('span');
      chip.className = 'demo-triage demo-triage--' + msg.triage;
      chip.textContent = triageLabel(msg.triage);
      bubble.appendChild(chip);
    }

    if (msg.limitNote) {
      var note = document.createElement('p');
      note.className = 'demo-msg__limit-note';
      note.innerHTML =
        'That was your free demo message. <a href="https://joey.ai/signup" data-cta="signup">Start free in Joey AI</a> for unlimited chats and your dog\'s health record.';
      bubble.appendChild(note);
    }

    var time = document.createElement('time');
    time.className = 'demo-msg__time';
    time.dateTime = new Date(msg.time).toISOString();
    time.textContent = formatTime(msg.time);
    bubble.appendChild(time);

    wrap.appendChild(bubble);
    messagesEl.appendChild(wrap);
    if (window.DemoMotion) window.DemoMotion.revealMsg(wrap);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function renderTyping() {
    var existing = document.querySelector('[data-demo-typing]');
    if (existing) existing.remove();

    var wrap = document.createElement('div');
    wrap.className = 'demo-msg demo-msg--assistant';
    wrap.setAttribute('data-demo-typing', '');

    var bubble = document.createElement('div');
    bubble.className = 'demo-msg__bubble demo-msg__bubble--typing';
    bubble.innerHTML =
      '<span class="demo-typing-dots" aria-hidden="true"><span></span><span></span><span></span></span>' +
      '<span class="demo-typing-label">Joey is thinking…</span>';

    wrap.appendChild(bubble);
    messagesEl.appendChild(wrap);
    if (window.DemoMotion) window.DemoMotion.revealMsg(wrap);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function clearTyping() {
    var el = document.querySelector('[data-demo-typing]');
    if (el) el.remove();
  }

  function pushMessage(role, content, triage, limitNote) {
    messageId += 1;
    renderMessage({
      id: messageId,
      role: role,
      content: content,
      triage: triage || null,
      limitNote: limitNote || false,
      time: Date.now(),
    });
  }

  function updateQuota() {
    var remaining = Math.max(0, DEMO_LIMIT - userMessagesSent);
    if (quotaCount) quotaCount.textContent = String(remaining);
    if (quotaRoot) {
      quotaRoot.innerHTML =
        remaining > 0
          ? '<strong data-demo-quota-count>' + remaining + '</strong> free message' + (remaining === 1 ? '' : 's') + ' — no account needed'
          : '<strong>0</strong> messages left in this demo';
    }
  }

  function lockDemo() {
    demoLocked = true;
    stopListening();
    input.disabled = true;
    input.placeholder = 'Demo limit reached — start free in the app to keep chatting';
    if (sendBtn) sendBtn.disabled = true;
    if (micBtn) micBtn.disabled = true;
    if (composeEl) composeEl.classList.add('is-locked');
    if (composeLimitEl) composeLimitEl.hidden = false;
    if (limitBanner) limitBanner.hidden = false;

    if (promptsRoot) {
      promptsRoot.querySelectorAll('.demo-prompt').forEach(function (btn) {
        btn.disabled = true;
      });
    }

    retargetSignupLinks();
  }

  function sendMessage(text) {
    var trimmed = (text || '').trim();
    if (!trimmed || typing || demoLocked || userMessagesSent >= DEMO_LIMIT) return;

    stopListening();
    showVoiceError('');

    userMessagesSent += 1;
    updateQuota();

    pushMessage('user', trimmed);
    input.value = '';
    input.style.height = 'auto';
    typing = true;
    renderTyping();

    var isLastMessage = userMessagesSent >= DEMO_LIMIT;

    window.setTimeout(function () {
      clearTyping();
      var reply = buildReply(trimmed);
      pushMessage('assistant', reply.content, reply.triage, isLastMessage);
      typing = false;

      if (isLastMessage) lockDemo();
    }, 1100);
  }

  function autoResize() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  }

  function retargetSignupLinks() {
    var CONFIG = window.JOEY_CONFIG || {};
    var APP_URL = (CONFIG.appUrl || 'https://joey.ai').replace(/\/+$/, '');
    var signupPath = (CONFIG.paths && CONFIG.paths.signup) || '/signup';
    document.querySelectorAll('[data-cta="signup"]').forEach(function (link) {
      link.setAttribute('href', APP_URL + signupPath);
      link.setAttribute('rel', 'noopener');
    });
  }

  renderMessage({
    id: messageId,
    role: INITIAL.role,
    content: INITIAL.content,
    time: INITIAL.time,
  });

  updateQuota();

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    sendMessage(input.value);
  });

  input.addEventListener('input', autoResize);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!demoLocked) form.requestSubmit();
    }
  });

  if (promptsRoot) {
    promptsRoot.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-prompt]');
      if (!btn || btn.disabled) return;
      sendMessage(btn.getAttribute('data-prompt'));
    });
  }

  retargetSignupLinks();
  initVoiceInput();

  window.addEventListener('beforeunload', stopListening);
})();
