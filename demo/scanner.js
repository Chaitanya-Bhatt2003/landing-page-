/**
 * Joey AI — Image Scanner demo (1 scan limit, sample or own photo, no server upload).
 */
(function () {
  'use strict';

  var DEMO_LIMIT = 1;
  var MAX_FILE_BYTES = 8 * 1024 * 1024;

  var SCANS = {
    skin: {
      label: 'Skin & coat',
      image: '../assets/scan-dog.jpg',
      alt: 'Sample skin scan — dog with irritated skin area',
      confidence: 87,
      triage: 'monitor',
      summary: 'Reddened area with mild scaling at the edge',
      lede: 'Pattern fits surface irritation rather than a deep infection — but only a vet exam can confirm.',
      customLede: 'This demo uses your photo for preview only. Results below follow our skin & coat triage template — the full app runs real vision AI on your image.',
      insights: [
        'Localized redness without open drainage is a common starting point',
        'Depth and infection cannot be confirmed from a photo alone',
        'Seasonal allergies flare this pattern in many breeds',
      ],
      actions: [
        'Book a routine vet visit if scratching increases over 48 hours',
        'Keep the area dry — avoid home ointments unless your vet approves',
        'Log appetite and energy tonight in the full app',
      ],
    },
    eye: {
      label: 'Eyes',
      image: '../assets/photo-scan.jpg',
      alt: 'Sample eye scan — dog outdoors',
      confidence: 82,
      triage: 'monitor',
      summary: 'Mild conjunctival redness — no heavy discharge visible',
      lede: 'A single red eye can be irritation or something that needs same-day care if it worsens quickly.',
      customLede: 'Your photo is shown locally only. Eye triage below is illustrative — Joey AI in the app analyses the actual image with your dog\'s record.',
      insights: [
        'Sclera inflammation is worth monitoring closely',
        'Ulcers and cloudiness need same-day care if they appear',
        'Squinting or pawing at the eye raises urgency',
      ],
      actions: [
        'Flush gently with sterile saline only if your vet has advised it before',
        'Prevent rubbing — an Elizabethan collar if needed',
        'Same-day vet if squinting, cloudiness, or green/yellow discharge appears',
      ],
    },
    ear: {
      label: 'Ears',
      image: '../assets/trust-scan.jpg',
      alt: 'Sample ear scan — dog being examined',
      confidence: 84,
      triage: 'monitor',
      summary: 'Pinna edge looks irritated with light scaling',
      lede: 'Ear issues often start at the flap before the canal — shaking and odor matter for triage.',
      customLede: 'Demo results are scripted for ear scans. The production app inspects canal access, discharge, and breed risk from your upload.',
      insights: [
        'Outer pinna changes are common before deep canal infection',
        'Head shaking or odor would push this toward urgent',
        'Floppy-eared breeds need closer monitoring',
      ],
      actions: [
        'Do not insert cotton swabs into the canal',
        'Keep ears dry after baths or swimming',
        'Vet visit within a few days if head shaking starts',
      ],
    },
    wound: {
      label: 'Wounds',
      image: '../assets/photo-care.jpg',
      alt: 'Sample wound scan — dog in care setting',
      confidence: 79,
      triage: 'urgent',
      summary: 'Open break in the skin — depth unclear from photo alone',
      lede: 'Any wound that is gaping, bleeding heavily, or on a paw pad needs a vet look soon.',
      customLede: 'Wounds need in-person assessment. This demo cannot measure depth — use the app or call your vet if bleeding is active.',
      insights: [
        'Surface breaks can hide deeper tracking, especially bite wounds',
        'Paw pads and nail beds bleed heavily and heal slowly',
        'Bandage only if your vet has shown you how',
      ],
      actions: [
        'Apply gentle pressure with a clean cloth if actively bleeding',
        'Do not use human antiseptics unless your vet directs',
        'Vet within 24 hours — emergency if bleeding will not stop',
      ],
    },
    dental: {
      label: 'Dental',
      image: '../assets/trust-food.jpg',
      alt: 'Sample dental context — dog near food',
      confidence: 76,
      triage: 'routine',
      summary: 'Tartar buildup likely — full mouth exam needed',
      lede: 'Photos rarely show the whole mouth. Bad breath plus drooling changes the urgency.',
      customLede: 'Dental photos are hard to judge without gum-line focus. The full app guides framing; a vet exam is still required for treatment.',
      insights: [
        'Tartar at the gum line often precedes painful gingivitis',
        'Broken teeth hurt even when your dog still eats',
        'Drooling or pawing at the mouth needs a faster look',
      ],
      actions: [
        'Book a dental check — anesthesia x-rays are often needed',
        'Offer soft food if chewing seems painful',
        'Emergency if jaw swelling or refusal to open mouth',
      ],
    },
    stool: {
      label: 'Stool',
      image: '../assets/photo-scan.jpg',
      alt: 'Sample stool scan context',
      confidence: 81,
      triage: 'monitor',
      summary: 'Soft stool sample — color and mucus noted',
      lede: 'One soft stool is different from bloody diarrhea or straining with nothing produced.',
      customLede: 'Stool photos help your vet — this demo shows typical soft-stool guidance. Blood or black tarry stool is always urgent.',
      insights: [
        'Single soft stool often follows diet change or scavenging',
        'Blood, black color, or straining changes the urgency',
        'Hydration and energy matter more than one loose motion',
      ],
      actions: [
        'Withhold rich treats; offer water',
        'Vet same day if blood, vomiting, or lethargy',
        'Bring a fresh sample to the clinic if asked',
      ],
    },
  };

  var typesRoot = document.querySelector('[data-scan-types]');
  var subtitle = document.querySelector('[data-scan-subtitle]');
  var imageEl = document.querySelector('[data-scan-image]');
  var scanFrame = document.querySelector('[data-scan-frame]');
  var adjustLayer = document.querySelector('[data-scan-adjust]');
  var adjustViewport = document.querySelector('[data-adjust-viewport]');
  var adjustImg = document.querySelector('[data-adjust-image]');
  var adjustBar = document.querySelector('[data-adjust-bar]');
  var adjustConfirm = document.querySelector('[data-adjust-confirm]');
  var adjustCancel = document.querySelector('[data-adjust-cancel]');
  var adjustZoomIn = document.querySelector('[data-adjust-zoom-in]');
  var adjustZoomOut = document.querySelector('[data-adjust-zoom-out]');
  var labelEl = document.querySelector('[data-scan-label]');
  var runBtn = document.querySelector('[data-scan-run]');
  var idleEl = document.querySelector('[data-scan-idle]');
  var idleText = document.querySelector('[data-scan-idle-text]');
  var analyzingEl = document.querySelector('[data-scan-analyzing]');
  var resultEl = document.querySelector('[data-scan-result]');
  var limitBanner = document.querySelector('[data-demo-limit]');
  var quotaRoot = document.querySelector('[data-demo-quota]');
  var sourceTabs = document.querySelector('[data-scan-source-tabs]');
  var uploadPanel = document.querySelector('[data-scan-upload]');
  var cameraBtn = document.querySelector('[data-scan-camera]');
  var uploadBtn = document.querySelector('[data-scan-upload-btn]');
  var fileCamera = document.querySelector('[data-scan-file]');
  var fileGallery = document.querySelector('[data-scan-file-gallery]');
  var cameraModal = document.querySelector('[data-camera-modal]');
  var cameraVideo = document.querySelector('[data-camera-video]');
  var cameraCanvas = document.querySelector('[data-camera-canvas]');
  var cameraStatus = document.querySelector('[data-camera-status]');
  var cameraCaptureBtn = document.querySelector('[data-camera-capture]');

  var cameraStream = null;

  var resultTriage = document.querySelector('[data-result-triage]');
  var resultConfidence = document.querySelector('[data-result-confidence]');
  var resultSummary = document.querySelector('[data-result-summary]');
  var resultLede = document.querySelector('[data-result-lede]');
  var resultInsights = document.querySelector('[data-result-insights]');
  var resultActions = document.querySelector('[data-result-actions]');
  var resultUpgrade = document.querySelector('[data-result-upgrade]');

  if (!typesRoot || !runBtn) return;

  var selectedType = 'skin';
  var photoSource = 'sample';
  var customObjectUrl = null;
  var hasCustomPhoto = false;
  var scansUsed = 0;
  var demoLocked = false;
  var analyzing = false;

  var adjustActive = false;
  var adjustSourceImg = null;
  var adjustScale = 1;
  var adjustX = 0;
  var adjustY = 0;
  var adjustMinScale = 1;
  var adjustMaxScale = 4;
  var adjustDragging = false;
  var adjustPointerId = null;
  var adjustLastX = 0;
  var adjustLastY = 0;

  function retargetSignupLinks() {
    var CONFIG = window.JOEY_CONFIG || {};
    var APP_URL = (CONFIG.appUrl || 'https://joey.ai').replace(/\/+$/, '');
    var signupPath = (CONFIG.paths && CONFIG.paths.signup) || '/signup';
    document.querySelectorAll('[data-cta="signup"]').forEach(function (link) {
      link.setAttribute('href', APP_URL + signupPath);
      link.setAttribute('rel', 'noopener');
    });
  }

  function updateQuota() {
    var remaining = Math.max(0, DEMO_LIMIT - scansUsed);
    if (quotaRoot) {
      quotaRoot.innerHTML =
        remaining > 0
          ? '<strong>' + remaining + '</strong> free scan' + (remaining === 1 ? '' : 's') + ' — no account needed'
          : '<strong>0</strong> scans left in this demo';
    }
  }

  function revokeCustomUrl() {
    if (customObjectUrl) {
      URL.revokeObjectURL(customObjectUrl);
      customObjectUrl = null;
    }
  }

  function updateRunButton() {
    if (!runBtn) return;
    var canRun = !demoLocked && !analyzing && !adjustActive && (photoSource === 'sample' || hasCustomPhoto);
    runBtn.disabled = !canRun;
    if (runBtn) runBtn.hidden = adjustActive;
  }

  function updateSubtitle() {
    var scan = SCANS[selectedType];
    if (!scan || !subtitle) return;
    if (photoSource === 'sample') {
      subtitle.textContent = scan.label + ' — sample photo ready to scan.';
    } else if (hasCustomPhoto) {
      subtitle.textContent = scan.label + ' — your photo is ready. One demo scan remaining.';
    } else {
      subtitle.textContent = scan.label + ' — take or upload a photo to scan.';
    }
  }

  function showSampleImage() {
    var scan = SCANS[selectedType];
    if (!scan || !imageEl) return;
    revokeCustomUrl();
    hasCustomPhoto = false;
    imageEl.src = scan.image;
    imageEl.alt = scan.alt;
    if (labelEl) labelEl.textContent = 'Sample · ' + scan.label;
    updateSubtitle();
    updateRunButton();
  }

  function setPhotoSource(source) {
    if (demoLocked || analyzing) return;
    if (source === 'sample' && adjustActive) cancelAdjust();
    photoSource = source;

    if (sourceTabs) {
      sourceTabs.querySelectorAll('[data-source]').forEach(function (btn) {
        var active = btn.getAttribute('data-source') === source;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-selected', active ? 'true' : 'false');
      });
    }

    if (uploadPanel) uploadPanel.hidden = source !== 'custom';

    if (source === 'sample') {
      showSampleImage();
      if (idleText) idleText.textContent = 'Select a scan type, then run your one free demo scan.';
    } else {
      if (idleText) {
        idleText.textContent = hasCustomPhoto
          ? 'Your photo is loaded. Run your one free demo scan.'
          : 'Take or upload a photo, then run your one free demo scan.';
      }
      if (!hasCustomPhoto && imageEl) {
        imageEl.src = SCANS[selectedType].image;
        imageEl.alt = 'Waiting for your photo';
        if (labelEl) labelEl.textContent = 'Your photo · ' + SCANS[selectedType].label;
      }
    }

    if (resultEl) resultEl.hidden = true;
    if (idleEl) idleEl.hidden = false;
    updateSubtitle();
    updateRunButton();
  }

  function selectType(type) {
    if (demoLocked || analyzing) return;
    selectedType = type;
    var scan = SCANS[type];
    if (!scan) return;

    typesRoot.querySelectorAll('.demo-scan-type').forEach(function (btn) {
      var active = btn.getAttribute('data-scan-type') === type;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    if (photoSource === 'sample') {
      showSampleImage();
    } else if (adjustActive && labelEl) {
      labelEl.textContent = 'Adjusting · ' + scan.label;
    } else if (hasCustomPhoto && labelEl) {
      labelEl.textContent = 'Your photo · ' + scan.label;
    } else if (labelEl) {
      labelEl.textContent = 'Your photo · ' + scan.label;
    }

    if (resultEl) resultEl.hidden = true;
    if (idleEl) idleEl.hidden = false;
    updateSubtitle();
    updateRunButton();
  }

  function lockDemo() {
    demoLocked = true;
    if (runBtn) runBtn.disabled = true;
    if (limitBanner) limitBanner.hidden = false;
    if (resultUpgrade) resultUpgrade.hidden = false;
    typesRoot.querySelectorAll('.demo-scan-type').forEach(function (btn) {
      btn.disabled = true;
    });
    if (sourceTabs) {
      sourceTabs.querySelectorAll('button').forEach(function (btn) {
        btn.disabled = true;
      });
    }
    if (cameraBtn) cameraBtn.disabled = true;
    if (uploadBtn) uploadBtn.disabled = true;
    if (adjustConfirm) adjustConfirm.disabled = true;
    if (adjustCancel) adjustCancel.disabled = true;
    cancelAdjust();
    stopCamera();
    retargetSignupLinks();
  }

  function renderResult(scan, isCustom) {
    if (resultTriage) {
      resultTriage.className = 'demo-triage demo-triage--' + scan.triage;
      resultTriage.textContent = scan.triage;
    }
    if (resultConfidence) {
      resultConfidence.textContent = isCustom ? 'Demo analysis' : scan.confidence + '% match';
    }
    if (resultSummary) resultSummary.textContent = scan.summary;
    if (resultLede) resultLede.textContent = isCustom ? scan.customLede : scan.lede;
    if (resultInsights) {
      resultInsights.innerHTML = scan.insights.map(function (i) { return '<li>' + i + '</li>'; }).join('');
    }
    if (resultActions) {
      resultActions.innerHTML = scan.actions.map(function (a) { return '<li>' + a + '</li>'; }).join('');
    }
  }

  function runScan() {
    if (demoLocked || analyzing || scansUsed >= DEMO_LIMIT) return;
    if (photoSource === 'custom' && !hasCustomPhoto) return;

    var scan = SCANS[selectedType];
    if (!scan) return;
    var isCustom = photoSource === 'custom' && hasCustomPhoto;

    analyzing = true;
    updateRunButton();
    if (idleEl) idleEl.hidden = true;
    if (resultEl) resultEl.hidden = true;
    if (analyzingEl) analyzingEl.hidden = false;

    window.setTimeout(function () {
      if (analyzingEl) analyzingEl.hidden = true;
      renderResult(scan, isCustom);
      if (resultEl) resultEl.hidden = false;
      if (window.DemoMotion) window.DemoMotion.revealBlock(resultEl);

      scansUsed += 1;
      updateQuota();
      analyzing = false;

      if (scansUsed >= DEMO_LIMIT) lockDemo();
      else updateRunButton();
    }, isCustom ? 2000 : 1600);
  }

  function loadImageForAdjust(file) {
    if (!file || demoLocked || analyzing) return;
    if (!file.type || file.type.indexOf('image/') !== 0) {
      window.alert('Please choose a photo (JPEG, PNG, or WebP).');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      window.alert('Photo must be under 8 MB for this demo.');
      return;
    }

    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        startAdjust(img);
      };
      img.onerror = function () {
        window.alert('Could not load that image. Try another file.');
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function getAdjustMetrics() {
    if (!adjustViewport || !adjustSourceImg) return null;
    var vw = adjustViewport.clientWidth;
    var vh = adjustViewport.clientHeight;
    var iw = adjustSourceImg.naturalWidth;
    var ih = adjustSourceImg.naturalHeight;
    if (!vw || !vh || !iw || !ih) return null;
    return { vw: vw, vh: vh, iw: iw, ih: ih };
  }

  function fitAdjustImage() {
    var m = getAdjustMetrics();
    if (!m) return;
    adjustMinScale = Math.max(m.vw / m.iw, m.vh / m.ih);
    adjustMaxScale = adjustMinScale * 4;
    adjustScale = adjustMinScale;
    adjustX = (m.vw - m.iw * adjustScale) / 2;
    adjustY = (m.vh - m.ih * adjustScale) / 2;
    clampAdjust();
    applyAdjustTransform();
  }

  function clampAdjust() {
    var m = getAdjustMetrics();
    if (!m) return;
    adjustScale = Math.max(adjustMinScale, Math.min(adjustMaxScale, adjustScale));
    var dw = m.iw * adjustScale;
    var dh = m.ih * adjustScale;
    if (dw <= m.vw) adjustX = (m.vw - dw) / 2;
    else adjustX = Math.min(0, Math.max(m.vw - dw, adjustX));
    if (dh <= m.vh) adjustY = (m.vh - dh) / 2;
    else adjustY = Math.min(0, Math.max(m.vh - dh, adjustY));
  }

  function applyAdjustTransform() {
    if (!adjustImg) return;
    adjustImg.style.width = (adjustSourceImg.naturalWidth * adjustScale) + 'px';
    adjustImg.style.height = (adjustSourceImg.naturalHeight * adjustScale) + 'px';
    adjustImg.style.transform = 'translate(' + adjustX + 'px, ' + adjustY + 'px)';
  }

  function zoomAdjust(factor, clientX, clientY) {
    if (!adjustActive || !adjustViewport) return;
    var m = getAdjustMetrics();
    if (!m) return;

    var rect = adjustViewport.getBoundingClientRect();
    var px = typeof clientX === 'number' ? clientX - rect.left : m.vw / 2;
    var py = typeof clientY === 'number' ? clientY - rect.top : m.vh / 2;
    var prevScale = adjustScale;
    adjustScale = Math.max(adjustMinScale, Math.min(adjustMaxScale, adjustScale * factor));

    var imageX = (px - adjustX) / prevScale;
    var imageY = (py - adjustY) / prevScale;
    adjustX = px - imageX * adjustScale;
    adjustY = py - imageY * adjustScale;

    clampAdjust();
    applyAdjustTransform();
  }

  function startAdjust(img) {
    if (!img || !adjustLayer || !adjustViewport || !adjustImg) return;

    adjustActive = true;
    adjustSourceImg = img;
    hasCustomPhoto = false;

    adjustImg.src = img.src;
    adjustImg.alt = 'Adjust your photo for ' + SCANS[selectedType].label + ' scan';

    if (scanFrame) scanFrame.classList.add('is-adjusting');
    adjustLayer.hidden = false;
    if (adjustBar) adjustBar.hidden = false;

    if (labelEl) labelEl.textContent = 'Adjusting · ' + SCANS[selectedType].label;
    if (idleText) idleText.textContent = 'Drag the photo to frame the scan area, then tap Use this photo.';
    if (resultEl) resultEl.hidden = true;
    if (idleEl) idleEl.hidden = false;

    window.requestAnimationFrame(function () {
      fitAdjustImage();
    });

    updateSubtitle();
    updateRunButton();
  }

  function exitAdjustMode() {
    adjustActive = false;
    adjustDragging = false;
    adjustSourceImg = null;
    if (scanFrame) scanFrame.classList.remove('is-adjusting');
    if (adjustLayer) adjustLayer.hidden = true;
    if (adjustBar) adjustBar.hidden = true;
    if (adjustViewport) adjustViewport.classList.remove('is-dragging');
    if (adjustImg) {
      adjustImg.removeAttribute('src');
      adjustImg.style.width = '';
      adjustImg.style.height = '';
      adjustImg.style.transform = '';
    }
  }

  function confirmAdjust() {
    if (!adjustActive || !adjustSourceImg || !adjustViewport) return;

    var m = getAdjustMetrics();
    if (!m) return;

    var canvas = document.createElement('canvas');
    canvas.width = m.vw;
    canvas.height = m.vh;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var sx = -adjustX / adjustScale;
    var sy = -adjustY / adjustScale;
    var sw = m.vw / adjustScale;
    var sh = m.vh / adjustScale;

    ctx.drawImage(adjustSourceImg, sx, sy, sw, sh, 0, 0, m.vw, m.vh);

    canvas.toBlob(
      function (blob) {
        if (!blob) return;
        exitAdjustMode();
        revokeCustomUrl();
        customObjectUrl = URL.createObjectURL(blob);
        hasCustomPhoto = true;

        if (imageEl) {
          imageEl.src = customObjectUrl;
          imageEl.alt = 'Your photo for ' + SCANS[selectedType].label + ' scan';
        }
        if (labelEl) labelEl.textContent = 'Your photo · ' + SCANS[selectedType].label;
        if (idleText) idleText.textContent = 'Your photo is ready. Run your one free demo scan.';
        updateSubtitle();
        updateRunButton();
      },
      'image/jpeg',
      0.92
    );
  }

  function cancelAdjust() {
    if (!adjustActive) return;
    exitAdjustMode();
    hasCustomPhoto = false;
    if (photoSource === 'custom' && imageEl) {
      imageEl.src = SCANS[selectedType].image;
      imageEl.alt = 'Waiting for your photo';
      if (labelEl) labelEl.textContent = 'Your photo · ' + SCANS[selectedType].label;
    }
    if (idleText) {
      idleText.textContent = 'Take or upload a photo, then run your one free demo scan.';
    }
    updateSubtitle();
    updateRunButton();
  }

  function handleFile(file) {
    loadImageForAdjust(file);
  }

  function onFileChange(e) {
    var file = e.target.files && e.target.files[0];
    e.target.value = '';
    handleFile(file);
  }

  function stopCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach(function (track) {
        track.stop();
      });
      cameraStream = null;
    }
    if (cameraVideo) cameraVideo.srcObject = null;
    if (cameraModal) cameraModal.hidden = true;
    document.body.classList.remove('is-camera-open');
  }

  function setCameraStatus(message) {
    if (cameraStatus) cameraStatus.textContent = message;
  }

  function openCamera() {
    if (demoLocked || analyzing) return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (fileCamera) fileCamera.click();
      return;
    }

    if (cameraModal) cameraModal.hidden = false;
    document.body.classList.add('is-camera-open');
    setCameraStatus('Starting camera…');
    if (cameraCaptureBtn) cameraCaptureBtn.disabled = true;

    var constraints = {
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    };

    navigator.mediaDevices
      .getUserMedia(constraints)
      .catch(function () {
        return navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      })
      .then(function (stream) {
        cameraStream = stream;
        if (cameraVideo) {
          cameraVideo.srcObject = stream;
          return cameraVideo.play();
        }
      })
      .then(function () {
        setCameraStatus('Frame your dog\'s concern, then tap Capture.');
        if (cameraCaptureBtn) cameraCaptureBtn.disabled = false;
      })
      .catch(function () {
        stopCamera();
        setCameraStatus('');
        if (fileCamera) {
          fileCamera.click();
        } else {
          window.alert('Could not access the camera. Allow camera permission or use Upload photo instead.');
        }
      });
  }

  function captureFromCamera() {
    if (!cameraVideo || !cameraCanvas || !cameraStream) return;

    var w = cameraVideo.videoWidth;
    var h = cameraVideo.videoHeight;
    if (!w || !h) return;

    cameraCanvas.width = w;
    cameraCanvas.height = h;
    var ctx = cameraCanvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(cameraVideo, 0, 0, w, h);
    cameraCanvas.toBlob(
      function (blob) {
        stopCamera();
        if (!blob) return;
        loadImageForAdjust(new File([blob], 'joey-scan-demo.jpg', { type: 'image/jpeg' }));
      },
      'image/jpeg',
      0.9
    );
  }

  if (adjustViewport) {
    adjustViewport.addEventListener('pointerdown', function (e) {
      if (!adjustActive || demoLocked) return;
      adjustDragging = true;
      adjustPointerId = e.pointerId;
      adjustLastX = e.clientX;
      adjustLastY = e.clientY;
      adjustViewport.classList.add('is-dragging');
      adjustViewport.setPointerCapture(e.pointerId);
    });

    adjustViewport.addEventListener('pointermove', function (e) {
      if (!adjustDragging || e.pointerId !== adjustPointerId) return;
      adjustX += e.clientX - adjustLastX;
      adjustY += e.clientY - adjustLastY;
      adjustLastX = e.clientX;
      adjustLastY = e.clientY;
      clampAdjust();
      applyAdjustTransform();
    });

    function endAdjustDrag(e) {
      if (!adjustDragging || e.pointerId !== adjustPointerId) return;
      adjustDragging = false;
      adjustPointerId = null;
      adjustViewport.classList.remove('is-dragging');
      try {
        adjustViewport.releasePointerCapture(e.pointerId);
      } catch (err) {
        /* no-op */
      }
    }

    adjustViewport.addEventListener('pointerup', endAdjustDrag);
    adjustViewport.addEventListener('pointercancel', endAdjustDrag);

    adjustViewport.addEventListener(
      'wheel',
      function (e) {
        if (!adjustActive) return;
        e.preventDefault();
        var factor = e.deltaY > 0 ? 0.92 : 1.08;
        zoomAdjust(factor, e.clientX, e.clientY);
      },
      { passive: false }
    );
  }

  if (adjustConfirm) adjustConfirm.addEventListener('click', confirmAdjust);
  if (adjustCancel) adjustCancel.addEventListener('click', cancelAdjust);
  if (adjustZoomIn) adjustZoomIn.addEventListener('click', function () { zoomAdjust(1.12); });
  if (adjustZoomOut) adjustZoomOut.addEventListener('click', function () { zoomAdjust(0.88); });

  window.addEventListener('resize', function () {
    if (adjustActive) fitAdjustImage();
  });

  typesRoot.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-scan-type]');
    if (!btn || btn.disabled) return;
    selectType(btn.getAttribute('data-scan-type'));
  });

  if (sourceTabs) {
    sourceTabs.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-source]');
      if (!btn || btn.disabled) return;
      setPhotoSource(btn.getAttribute('data-source'));
    });
  }

  if (cameraBtn) {
    cameraBtn.addEventListener('click', function () {
      if (!demoLocked) openCamera();
    });
  }

  if (cameraCaptureBtn) {
    cameraCaptureBtn.addEventListener('click', captureFromCamera);
  }

  document.querySelectorAll('[data-camera-close]').forEach(function (el) {
    el.addEventListener('click', stopCamera);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && cameraModal && !cameraModal.hidden) {
      stopCamera();
    }
    if (e.key === 'Escape' && adjustActive) {
      cancelAdjust();
    }
  });

  if (uploadBtn && fileGallery) {
    uploadBtn.addEventListener('click', function () {
      if (!demoLocked) fileGallery.click();
    });
  }

  if (fileCamera) fileCamera.addEventListener('change', onFileChange);
  if (fileGallery) fileGallery.addEventListener('change', onFileChange);

  runBtn.addEventListener('click', runScan);

  setPhotoSource('sample');
  selectType('skin');
  updateQuota();
  retargetSignupLinks();
})();
