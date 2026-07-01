(function() {
  'use strict';

  // ====== Theme ======
  var themeBtn = document.getElementById('themeBtn');
  var htmlEl = document.documentElement;
  var stored = localStorage.getItem('qr-theme');
  var prefersDark = window.matchMedia('(prefers-color-scheme:dark)').matches;
  var theme = stored || (prefersDark ? 'dark' : 'light');
  htmlEl.setAttribute('data-theme', theme);

  themeBtn.addEventListener('click', function() {
    theme = theme === 'dark' ? 'light' : 'dark';
    htmlEl.setAttribute('data-theme', theme);
    localStorage.setItem('qr-theme', theme);
  });

  // ====== Toast ======
  var toastContainer = document.getElementById('toastContainer');

  function showToast(message, type) {
    var toast = document.createElement('div');
    toast.className = 'toast' + (type === 'success' ? ' success' : type === 'error' ? ' error' : '');
    var icon = type === 'success'
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>'
      : type === 'error'
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    toast.innerHTML = icon + '<span>' + message + '</span>';
    toastContainer.appendChild(toast);
    setTimeout(function() { if (toast.parentNode) toast.remove(); }, 3500);
  }

  window.showToast = showToast;

  // ====== Shared QR Utilities ======

  function renderQrCanvas(qr, moduleCount, size, fgColor, bgColor, opts) {
    opts = opts || {};
    var roundedDots = opts.roundedDots || false;
    var gradient = opts.gradient || false;
    var gradientEnd = opts.gradientEnd || '#2563eb';
    var margin = opts.margin || 0;
    var cornerRadius = opts.cornerRadius || 0;

    var totalModules = moduleCount + margin * 2;
    var ms = size / totalModules;

    var canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    var ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = bgColor || '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // Corner rounding (clip if needed)
    if (cornerRadius > 0) {
      var cr = Math.min(cornerRadius, size / 2);
      ctx.beginPath();
      ctx.moveTo(cr, 0);
      ctx.lineTo(size - cr, 0);
      ctx.quadraticCurveTo(size, 0, size, cr);
      ctx.lineTo(size, size - cr);
      ctx.quadraticCurveTo(size, size, size - cr, size);
      ctx.lineTo(cr, size);
      ctx.quadraticCurveTo(0, size, 0, size - cr);
      ctx.lineTo(0, cr);
      ctx.quadraticCurveTo(0, 0, cr, 0);
      ctx.closePath();
      ctx.clip();
    }

    // Foreground
    var fillStyle = fgColor || '#000000';
    if (gradient) {
      var grad = ctx.createLinearGradient(0, 0, size, size);
      grad.addColorStop(0, fillStyle);
      grad.addColorStop(1, gradientEnd);
      fillStyle = grad;
    }
    ctx.fillStyle = fillStyle;

    // Draw modules
    if (roundedDots) {
      var dotR = ms * 0.4;
      for (var row = 0; row < moduleCount; row++) {
        for (var col = 0; col < moduleCount; col++) {
          if (qr.isDark(row, col)) {
            var cx = (col + margin) * ms + ms / 2;
            var cy = (row + margin) * ms + ms / 2;
            ctx.beginPath();
            ctx.arc(cx, cy, dotR, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    } else {
      for (var row2 = 0; row2 < moduleCount; row2++) {
        for (var col2 = 0; col2 < moduleCount; col2++) {
          if (qr.isDark(row2, col2)) {
            var x = (col2 + margin) * ms;
            var y = (row2 + margin) * ms;
            ctx.fillRect(x, y, Math.ceil(ms), Math.ceil(ms));
          }
        }
      }
    }

    return canvas;
  }

  function qrToSvg(qr, moduleCount, size, fgColor, bgColor, opts) {
    opts = opts || {};
    var roundedDots = opts.roundedDots || false;
    var gradient = opts.gradient || false;
    var gradientEnd = opts.gradientEnd || '#2563eb';
    var margin = opts.margin || 0;
    var cornerRadius = opts.cornerRadius || 0;

    var totalModules = moduleCount + margin * 2;
    var ms = size / totalModules;

    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" shape-rendering="crispEdges">';

    // Defs for gradient
    if (gradient) {
      svg += '<defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">';
      svg += '<stop offset="0%" stop-color="' + escXml(fgColor || '#000000') + '"/>';
      svg += '<stop offset="100%" stop-color="' + escXml(gradientEnd) + '"/>';
      svg += '</linearGradient></defs>';
    }

    // Background
    svg += '<rect width="' + size + '" height="' + size + '" fill="' + escXml(bgColor || '#ffffff') + '"';
    if (cornerRadius > 0) {
      svg += ' rx="' + cornerRadius + '" ry="' + cornerRadius + '"';
    }
    svg += '/>';

    var fill = gradient ? 'url(#g)' : escXml(fgColor || '#000000');
    var path = '';
    var r = roundedDots ? Math.round(ms * 0.4) : 0;

    for (var row = 0; row < moduleCount; row++) {
      for (var col = 0; col < moduleCount; col++) {
        if (qr.isDark(row, col)) {
          var x = (col + margin) * ms;
          var y = (row + margin) * ms;
          if (roundedDots) {
            var cxc = x + ms / 2;
            var cyc = y + ms / 2;
            svg += '<circle cx="' + cxc + '" cy="' + cyc + '" r="' + r + '" fill="' + fill + '"/>';
          } else {
            path += 'M' + x + ',' + y + 'h' + ms + 'v' + ms + 'h-' + ms + 'Z';
          }
        }
      }
    }
    if (path) {
      svg += '<path d="' + path + '" fill="' + fill + '"/>';
    }
    svg += '</svg>';
    return svg;
  }

  function escXml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function downloadPng(canvas, filename) {
    var link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function downloadSvg(svgData, filename) {
    var blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.download = filename;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
  }

  function copyImage(canvas, successMsg, failMsg) {
    if (navigator.clipboard && window.ClipboardItem) {
      canvas.toBlob(function(blob) {
        if (!blob) { fallbackCopyImg(canvas, failMsg); return; }
        navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
          .then(function() { showToast(successMsg || 'Image copied to clipboard', 'success'); })
          .catch(function() { fallbackCopyImg(canvas, failMsg); });
      });
    } else {
      fallbackCopyImg(canvas, failMsg);
    }
  }

  function fallbackCopyImg(canvas, failMsg) {
    downloadPng(canvas, 'qrcode.png');
    showToast(failMsg || 'Copy not supported. PNG downloaded instead.', 'error');
  }

  function generateQRData(text, ecl) {
    try {
      var qr = qrcode(0, ecl || 'M');
      qr.addData(text);
      qr.make();
      return qr;
    } catch (e) {
      return null;
    }
  }

  function showToolError(msgEl, msg) {
    msgEl.querySelector('span').textContent = msg;
    msgEl.classList.add('show');
  }

  function hideToolError(msgEl) {
    msgEl.classList.remove('show');
  }

  function isUrl(str) {
    try {
      var url = new URL(str);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (e) {
      return false;
    }
  }

  function copyTextToClipboard(text, successMsg) {
    navigator.clipboard.writeText(text).then(function() {
      showToast(successMsg || 'Copied to clipboard', 'success');
    }).catch(function() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); showToast(successMsg || 'Copied to clipboard', 'success'); }
      catch (e) { showToast('Failed to copy', 'error'); }
      document.body.removeChild(ta);
    });
  }

  // ====== Tool Switching ======
  var navBtns = document.querySelectorAll('.tool-nav-btn');
  var sectionIds = ['generator', 'scanner', 'wifi', 'whatsapp', 'vcard', 'email', 'sms', 'url', 'read', 'color'];
  var sections = {};
  sectionIds.forEach(function(id) {
    sections[id] = document.getElementById('tool-' + id);
  });

  navBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var tool = this.dataset.tool;
      var prevTool = document.querySelector('.tool-nav-btn.active');
      if (prevTool && prevTool.dataset.tool === tool) return;

      navBtns.forEach(function(b) {
        b.classList.remove('active');
        b.removeAttribute('aria-current');
        b.setAttribute('aria-selected', 'false');
      });
      this.classList.add('active');
      this.setAttribute('aria-current', 'page');
      this.setAttribute('aria-selected', 'true');

      Object.keys(sections).forEach(function(key) {
        sections[key].classList.toggle('active', key === tool);
      });

      // Stop camera when switching away from scanner
      if (tool !== 'scanner' && window.stopCamera) window.stopCamera();

      // Focus management
      var focusMap = {
        generator: 'qrInput', scanner: 'camStart', wifi: 'wifiSsid',
        whatsapp: 'waCountry', vcard: 'vcFname', email: 'emailTo',
        sms: 'smsPhone', url: 'urlInput', read: 'readArea', color: 'colorInput'
      };
      var focusId = focusMap[tool];
      var focusTarget = focusId ? document.getElementById(focusId) : null;
      if (focusTarget) setTimeout(function() { focusTarget.focus(); }, 100);
    });
  });

  // ======================================================================
  // ====== QR CODE GENERATOR (existing) ======
  // ======================================================================
  (function() {
    var input = document.getElementById('qrInput');
    var qrFrame = document.getElementById('qrFrame');
    var qrPlaceholder = document.getElementById('qrPlaceholder');
    var errorMsg = document.getElementById('genErrorMsg');
    var dlPng = document.getElementById('dlPng');
    var dlSvg = document.getElementById('dlSvg');
    var copyImgBtn = document.getElementById('copyImgBtn');
    var charCount = document.getElementById('charCount');

    var currentCanvas = null;
    var currentSvgData = null;
    var MAX_INPUT_LENGTH = 2000;

    function clearFrame() {
      var kids = qrFrame.children;
      for (var i = kids.length - 1; i >= 0; i--) {
        if (kids[i] !== qrPlaceholder) kids[i].remove();
      }
      currentCanvas = null;
      currentSvgData = null;
      dlPng.disabled = true;
      dlSvg.disabled = true;
      copyImgBtn.disabled = true;
    }

    function generate() {
      var text = input.value.trim();
      clearFrame();

      if (text.length === 0) {
        qrPlaceholder.style.display = '';
        qrFrame.classList.remove('has-qr');
        errorMsg.classList.remove('show');
        return;
      }

      errorMsg.classList.remove('show');
      qrPlaceholder.style.display = 'none';

      var spinner = document.createElement('div');
      spinner.className = 'spinner';
      qrFrame.appendChild(spinner);
      qrFrame.classList.add('has-qr');

      requestAnimationFrame(function() {
        setTimeout(function() {
          try {
            var qr = qrcode(0, 'M');
            qr.addData(text);
            qr.make();

            var size = 260;
            var moduleCount = qr.getModuleCount();
            var moduleSize = size / moduleCount;

            var canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            canvas.setAttribute('role', 'img');
            canvas.setAttribute('aria-label', 'QR code for: ' + text.slice(0, 100));

            var ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, size, size);

            ctx.fillStyle = '#000000';
            for (var row = 0; row < moduleCount; row++) {
              for (var col = 0; col < moduleCount; col++) {
                if (qr.isDark(row, col)) {
                  var x = Math.round(col * moduleSize);
                  var y = Math.round(row * moduleSize);
                  var x2 = Math.round((col + 1) * moduleSize);
                  var y2 = Math.round((row + 1) * moduleSize);
                  ctx.fillRect(x, y, Math.max(1, x2 - x), Math.max(1, y2 - y));
                }
              }
            }

            if (spinner.parentNode) spinner.remove();
            qrFrame.appendChild(canvas);
            currentCanvas = canvas;
            currentSvgData = buildSvg(qr, moduleCount, size);

            dlPng.disabled = false;
            dlSvg.disabled = false;
            copyImgBtn.disabled = false;

          } catch (e) {
            clearFrame();
            qrFrame.classList.remove('has-qr');
            qrPlaceholder.style.display = '';
            var msg = e.message && e.message.indexOf('code length overflow') !== -1
              ? 'Input is too long for a QR code. Try shorter text.'
              : 'Error generating QR code. Please try different input.';
            errorMsg.textContent = msg;
            errorMsg.classList.add('show');
          }
        }, 80);
      });
    }

    function buildSvg(qr, moduleCount, size) {
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" shape-rendering="crispEdges">';
      svg += '<rect width="' + size + '" height="' + size + '" fill="#ffffff"/>';
      var path = '';
      var ms = size / moduleCount;
      for (var row = 0; row < moduleCount; row++) {
        for (var col = 0; col < moduleCount; col++) {
          if (qr.isDark(row, col)) {
            path += 'M' + (col * ms) + ',' + (row * ms) + 'h' + ms + 'v' + ms + 'h-' + ms + 'Z';
          }
        }
      }
      svg += '<path d="' + path + '" fill="#000000"/>';
      svg += '</svg>';
      return svg;
    }

    var debounceTimer = null;

    input.addEventListener('input', function() {
      if (this.value.length > MAX_INPUT_LENGTH) {
        this.value = this.value.slice(0, MAX_INPUT_LENGTH);
      }
      var len = this.value.length;
      charCount.textContent = len + ' / ' + MAX_INPUT_LENGTH + ' characters';

      if (len === 0) {
        clearFrame();
        qrFrame.classList.remove('has-qr');
        qrPlaceholder.style.display = '';
        errorMsg.classList.remove('show');
        return;
      }
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(generate, 250);
    });

    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        clearTimeout(debounceTimer);
        generate();
      }
    });

    dlPng.addEventListener('click', function() {
      if (!currentCanvas) { showToast('Generate a QR code first', 'error'); return; }
      downloadPng(currentCanvas, 'qrcode.png');
      showToast('QR code downloaded as PNG', 'success');
    });

    dlSvg.addEventListener('click', function() {
      if (!currentSvgData) { showToast('Generate a QR code first', 'error'); return; }
      downloadSvg(currentSvgData, 'qrcode.svg');
      showToast('QR code downloaded as SVG', 'success');
    });

    copyImgBtn.addEventListener('click', function() {
      if (!currentCanvas) { showToast('Generate a QR code first', 'error'); return; }
      copyImage(currentCanvas, 'QR image copied to clipboard', 'Copy not supported. PNG downloaded instead.');
    });
  })();

  // ======================================================================
  // ====== QR CODE SCANNER (existing) ======
  // ======================================================================
  (function() {
    var camStart = document.getElementById('camStart');
    var camStop = document.getElementById('camStop');
    var video = document.getElementById('scannerVideo');
    var videoPlaceholder = document.getElementById('videoPlaceholder');
    var scanArea = document.getElementById('scanArea');
    var scanInput = document.getElementById('scanInput');
    var scanError = document.getElementById('scanErrorMsg');
    var scanPlaceholder = document.getElementById('scanPlaceholder');
    var resultContent = document.getElementById('scanResultContent');
    var resultText = document.getElementById('resultText');
    var resultActions = document.getElementById('resultActions');

    var stream = null;
    var scanTimer = null;
    var isScanning = false;
    var scanCanvas = document.createElement('canvas');
    var scanCtx = scanCanvas.getContext('2d');

    camStart.addEventListener('click', function() {
      if (stream) return;
      scanError.classList.remove('show');
      navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      })
        .then(function(s) {
          stream = s;
          video.srcObject = s;
          video.classList.add('active');
          videoPlaceholder.style.display = 'none';
          camStart.disabled = true;
          camStop.disabled = false;
          isScanning = true;
          scanLoop();
        })
        .catch(function() {
          showToast('Camera not available or permission denied', 'error');
        });
    });

    camStop.addEventListener('click', stopCamera);

    function stopCamera() {
      isScanning = false;
      if (scanTimer) { clearTimeout(scanTimer); scanTimer = null; }
      if (stream) {
        stream.getTracks().forEach(function(t) { t.stop(); });
        stream = null;
      }
      video.classList.remove('active');
      videoPlaceholder.style.display = '';
      camStart.disabled = false;
      camStop.disabled = true;
    }

    window.stopCamera = stopCamera;

    function scanLoop() {
      if (!isScanning || !stream) return;
      if (video.readyState < 2) {
        scanTimer = setTimeout(scanLoop, 300);
        return;
      }
      var w = video.videoWidth;
      var h = video.videoHeight;
      if (w === 0 || h === 0) {
        scanTimer = setTimeout(scanLoop, 300);
        return;
      }
      scanCanvas.width = w;
      scanCanvas.height = h;
      scanCtx.drawImage(video, 0, 0);
      var imageData = scanCtx.getImageData(0, 0, w, h);
      try {
        var code = jsQR(imageData.data, w, h);
        if (code) {
          showResult(code.data);
          showToast('QR code detected!', 'success');
          stopCamera();
          return;
        }
      } catch (e) { }
      scanTimer = setTimeout(scanLoop, 400);
    }

    scanArea.addEventListener('click', function() { scanInput.click(); });

    scanArea.addEventListener('dragover', function(e) {
      e.preventDefault();
      scanArea.classList.add('dragover');
    });
    scanArea.addEventListener('dragleave', function() {
      scanArea.classList.remove('dragover');
    });
    scanArea.addEventListener('drop', function(e) {
      e.preventDefault();
      scanArea.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
      }
    });

    scanInput.addEventListener('change', function(e) {
      if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
      }
    });

    function handleFile(file) {
      if (!file || file.type.indexOf('image/') !== 0) {
        showToast('Please upload a valid image', 'error');
        return;
      }
      scanError.classList.remove('show');

      var reader = new FileReader();
      reader.onload = function(e) {
        var img = new Image();
        img.onload = function() {
          var result = decodeImage(img);
          if (result) {
            resetResult();
            showResult(result);
            showToast('QR code decoded from image', 'success');
          } else {
            showToast('No QR code found in image', 'error');
            scanError.querySelector('span').textContent = 'No QR code could be detected. Try a clearer image.';
            scanError.classList.add('show');
          }
        };
        img.onerror = function() {
          showToast('Failed to load image', 'error');
        };
        img.src = e.target.result;
      };
      reader.onerror = function() {
        showToast('Failed to read file', 'error');
      };
      reader.readAsDataURL(file);
    }

    function decodeImage(img) {
      var w = img.naturalWidth || img.width;
      var h = img.naturalHeight || img.height;
      var maxDim = 1280;
      if (w > maxDim || h > maxDim) {
        var ratio = Math.min(maxDim / w, maxDim / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      var canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      var imageData = ctx.getImageData(0, 0, w, h);
      try {
        var code = jsQR(imageData.data, w, h);
        return code ? code.data : null;
      } catch (e) {
        return null;
      }
    }

    function showResult(data) {
      scanPlaceholder.hidden = true;
      resultContent.hidden = false;
      resultText.textContent = data;

      resultActions.innerHTML = '';

      var copyBtn = document.createElement('button');
      copyBtn.className = 'btn btn-primary';
      copyBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy';
      copyBtn.addEventListener('click', function() {
        copyTextToClipboard(data);
      });
      resultActions.appendChild(copyBtn);

      if (isUrl(data)) {
        var openBtn = document.createElement('a');
        openBtn.className = 'btn btn-success';
        openBtn.href = data;
        openBtn.target = '_blank';
        openBtn.rel = 'noopener noreferrer';
        openBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg> Open URL';
        resultActions.appendChild(openBtn);
      }
    }

    function resetResult() {
      scanPlaceholder.hidden = false;
      resultContent.hidden = true;
      resultText.textContent = '';
      resultActions.innerHTML = '';
      scanError.classList.remove('show');
    }
  })();

  // ======================================================================
  // ====== WIFI QR GENERATOR ======
  // ======================================================================
  (function() {
    var ssidInput = document.getElementById('wifiSsid');
    var passInput = document.getElementById('wifiPass');
    var encSelect = document.getElementById('wifiEncryption');
    var hiddenCheck = document.getElementById('wifiHidden');
    var errorMsg = document.getElementById('wifiErrorMsg');
    var qrFrame = document.getElementById('wifiQrFrame');
    var placeholder = document.getElementById('wifiPlaceholder');
    var dlPng = document.getElementById('wifiDlPng');
    var dlSvg = document.getElementById('wifiDlSvg');
    var copyImg = document.getElementById('wifiCopyImg');
    var copyStr = document.getElementById('wifiCopyStr');

    var currentCanvas = null;
    var currentSvg = null;
    var currentWifiStr = '';
    var debounceTimer = null;

    function buildWifiString() {
      var ssid = ssidInput.value.trim();
      var pass = passInput.value;
      var enc = encSelect.value;
      var hidden = hiddenCheck.checked;

      if (!ssid) return '';

      var parts = [];
      parts.push('WIFI:T:' + enc + ';');
      parts.push('S:' + ssid + ';');
      if (enc !== 'nopass' && pass) {
        parts.push('P:' + pass + ';');
      }
      if (hidden) {
        parts.push('H:true;');
      }
      return parts.join('');
    }

    function update() {
      var text = buildWifiString();
      hideToolError(errorMsg);

      // Clear existing canvas
      var kids = qrFrame.children;
      for (var i = kids.length - 1; i >= 0; i--) {
        if (kids[i] !== placeholder) kids[i].remove();
      }

      if (!text) {
        placeholder.style.display = '';
        qrFrame.classList.remove('has-qr');
        currentCanvas = null;
        currentSvg = null;
        currentWifiStr = '';
        dlPng.disabled = true;
        dlSvg.disabled = true;
        copyImg.disabled = true;
        copyStr.disabled = true;
        return;
      }

      placeholder.style.display = 'none';

      var spinner = document.createElement('div');
      spinner.className = 'spinner';
      qrFrame.appendChild(spinner);
      qrFrame.classList.add('has-qr');

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function() {
        try {
          var qr = generateQRData(text);
          if (!qr) throw new Error('Generation failed');
          var moduleCount = qr.getModuleCount();
          var size = 260;

          currentWifiStr = text;
          currentCanvas = renderQrCanvas(qr, moduleCount, size, '#000000', '#ffffff');
          currentSvg = qrToSvg(qr, moduleCount, size, '#000000', '#ffffff');

          if (spinner.parentNode) spinner.remove();
          qrFrame.appendChild(currentCanvas);

          dlPng.disabled = false;
          dlSvg.disabled = false;
          copyImg.disabled = false;
          copyStr.disabled = false;

        } catch (e) {
          if (spinner.parentNode) spinner.remove();
          placeholder.style.display = '';
          qrFrame.classList.remove('has-qr');
          showToolError(errorMsg, 'Error generating WiFi QR code. Please check your input.');
        }
      }, 200);
    }

    ssidInput.addEventListener('input', update);
    passInput.addEventListener('input', update);
    encSelect.addEventListener('change', update);
    hiddenCheck.addEventListener('change', update);

    dlPng.addEventListener('click', function() {
      if (!currentCanvas) { showToast('Fill in SSID first', 'error'); return; }
      downloadPng(currentCanvas, 'wifi-qrcode.png');
      showToast('WiFi QR code downloaded as PNG', 'success');
    });

    dlSvg.addEventListener('click', function() {
      if (!currentSvg) { showToast('Fill in SSID first', 'error'); return; }
      downloadSvg(currentSvg, 'wifi-qrcode.svg');
      showToast('WiFi QR code downloaded as SVG', 'success');
    });

    copyImg.addEventListener('click', function() {
      if (!currentCanvas) { showToast('Fill in SSID first', 'error'); return; }
      copyImage(currentCanvas, 'WiFi QR image copied', 'Copy not supported. PNG downloaded instead.');
    });

    copyStr.addEventListener('click', function() {
      if (!currentWifiStr) { showToast('Fill in SSID first', 'error'); return; }
      copyTextToClipboard(currentWifiStr, 'WiFi string copied to clipboard');
    });
  })();

  // ======================================================================
  // ====== WHATSAPP QR GENERATOR ======
  // ======================================================================
  (function() {
    var countryInput = document.getElementById('waCountry');
    var phoneInput = document.getElementById('waPhone');
    var msgTextarea = document.getElementById('waMsg');
    var errorMsg = document.getElementById('waErrorMsg');
    var qrFrame = document.getElementById('waQrFrame');
    var placeholder = document.getElementById('waPlaceholder');
    var openBtn = document.getElementById('waOpen');
    var dlPng = document.getElementById('waDlPng');
    var dlSvg = document.getElementById('waDlSvg');

    var currentCanvas = null;
    var currentSvg = null;
    var currentWaUrl = '';
    var debounceTimer = null;

    function buildWaUrl() {
      var country = countryInput.value.trim().replace(/^\+/, '');
      var phone = phoneInput.value.trim().replace(/[^0-9]/g, '');
      var msg = msgTextarea.value.trim();

      if (!country || !phone) return '';

      var url = 'https://wa.me/' + encodeURIComponent(country) + encodeURIComponent(phone);
      if (msg) {
        url += '?text=' + encodeURIComponent(msg);
      }
      return url;
    }

    function update() {
      var url = buildWaUrl();
      hideToolError(errorMsg);

      var kids = qrFrame.children;
      for (var i = kids.length - 1; i >= 0; i--) {
        if (kids[i] !== placeholder) kids[i].remove();
      }

      if (!url) {
        placeholder.style.display = '';
        qrFrame.classList.remove('has-qr');
        currentCanvas = null;
        currentSvg = null;
        currentWaUrl = '';
        openBtn.disabled = true;
        dlPng.disabled = true;
        dlSvg.disabled = true;
        return;
      }

      placeholder.style.display = 'none';

      var spinner = document.createElement('div');
      spinner.className = 'spinner';
      qrFrame.appendChild(spinner);
      qrFrame.classList.add('has-qr');

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function() {
        try {
          var qr = generateQRData(url);
          if (!qr) throw new Error('Generation failed');
          var moduleCount = qr.getModuleCount();
          var size = 260;

          currentWaUrl = url;
          currentCanvas = renderQrCanvas(qr, moduleCount, size, '#000000', '#ffffff');
          currentSvg = qrToSvg(qr, moduleCount, size, '#000000', '#ffffff');

          if (spinner.parentNode) spinner.remove();
          qrFrame.appendChild(currentCanvas);

          openBtn.disabled = false;
          dlPng.disabled = false;
          dlSvg.disabled = false;

        } catch (e) {
          if (spinner.parentNode) spinner.remove();
          placeholder.style.display = '';
          qrFrame.classList.remove('has-qr');
          showToolError(errorMsg, 'Error generating WhatsApp QR code.');
        }
      }, 200);
    }

    countryInput.addEventListener('input', update);
    phoneInput.addEventListener('input', update);
    msgTextarea.addEventListener('input', update);

    openBtn.addEventListener('click', function() {
      if (!currentWaUrl) { showToast('Enter phone number first', 'error'); return; }
      window.open(currentWaUrl, '_blank', 'noopener,noreferrer');
    });

    dlPng.addEventListener('click', function() {
      if (!currentCanvas) { showToast('Enter phone number first', 'error'); return; }
      downloadPng(currentCanvas, 'whatsapp-qrcode.png');
      showToast('WhatsApp QR code downloaded as PNG', 'success');
    });

    dlSvg.addEventListener('click', function() {
      if (!currentSvg) { showToast('Enter phone number first', 'error'); return; }
      downloadSvg(currentSvg, 'whatsapp-qrcode.svg');
      showToast('WhatsApp QR code downloaded as SVG', 'success');
    });
  })();

  // ======================================================================
  // ====== vCard QR GENERATOR ======
  // ======================================================================
  (function() {
    var fname = document.getElementById('vcFname');
    var lname = document.getElementById('vcLname');
    var company = document.getElementById('vcCompany');
    var title = document.getElementById('vcTitle');
    var phone = document.getElementById('vcPhone');
    var email = document.getElementById('vcEmail');
    var website = document.getElementById('vcWebsite');
    var address = document.getElementById('vcAddress');
    var notes = document.getElementById('vcNotes');
    var errorMsg = document.getElementById('vcErrorMsg');
    var qrFrame = document.getElementById('vcQrFrame');
    var placeholder = document.getElementById('vcPlaceholder');
    var dlPng = document.getElementById('vcDlPng');
    var dlSvg = document.getElementById('vcDlSvg');
    var copyVcard = document.getElementById('vcCopyStr');

    var currentCanvas = null;
    var currentSvg = null;
    var currentVcard = '';
    var debounceTimer = null;

    function buildVcard() {
      var fn = fname.value.trim();
      var ln = lname.value.trim();
      if (!fn && !ln) return '';

      var v = 'BEGIN:VCARD\r\nVERSION:3.0\r\n';
      v += 'N:' + escVcard(ln) + ';' + escVcard(fn) + '\r\n';
      v += 'FN:' + escVcard(fn) + ' ' + escVcard(ln) + '\r\n';
      if (company.value.trim()) v += 'ORG:' + escVcard(company.value.trim()) + '\r\n';
      if (title.value.trim()) v += 'TITLE:' + escVcard(title.value.trim()) + '\r\n';
      if (phone.value.trim()) v += 'TEL:' + escVcard(phone.value.trim()) + '\r\n';
      if (email.value.trim()) v += 'EMAIL:' + escVcard(email.value.trim()) + '\r\n';
      if (website.value.trim()) v += 'URL:' + escVcard(website.value.trim()) + '\r\n';
      if (address.value.trim()) v += 'ADR:' + escVcard(address.value.trim()) + '\r\n';
      if (notes.value.trim()) v += 'NOTE:' + escVcard(notes.value.trim()) + '\r\n';
      v += 'END:VCARD';
      return v;
    }

    function escVcard(s) {
      return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
    }

    function update() {
      var vcard = buildVcard();
      hideToolError(errorMsg);

      var kids = qrFrame.children;
      for (var i = kids.length - 1; i >= 0; i--) {
        if (kids[i] !== placeholder) kids[i].remove();
      }

      if (!vcard) {
        placeholder.style.display = '';
        qrFrame.classList.remove('has-qr');
        currentCanvas = null;
        currentSvg = null;
        currentVcard = '';
        dlPng.disabled = true;
        dlSvg.disabled = true;
        copyVcard.disabled = true;
        return;
      }

      placeholder.style.display = 'none';

      var spinner = document.createElement('div');
      spinner.className = 'spinner';
      qrFrame.appendChild(spinner);
      qrFrame.classList.add('has-qr');

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function() {
        try {
          var qr = generateQRData(vcard);
          if (!qr) throw new Error('Generation failed');
          var moduleCount = qr.getModuleCount();
          var size = 260;

          currentVcard = vcard;
          currentCanvas = renderQrCanvas(qr, moduleCount, size, '#000000', '#ffffff');
          currentSvg = qrToSvg(qr, moduleCount, size, '#000000', '#ffffff');

          if (spinner.parentNode) spinner.remove();
          qrFrame.appendChild(currentCanvas);

          dlPng.disabled = false;
          dlSvg.disabled = false;
          copyVcard.disabled = false;

        } catch (e) {
          if (spinner.parentNode) spinner.remove();
          placeholder.style.display = '';
          qrFrame.classList.remove('has-qr');
          showToolError(errorMsg, 'Error generating vCard QR code.');
        }
      }, 200);
    }

    var vcardFields = [fname, lname, company, title, phone, email, website, address, notes];
    vcardFields.forEach(function(el) {
      el.addEventListener('input', update);
    });

    dlPng.addEventListener('click', function() {
      if (!currentCanvas) { showToast('Enter at least a name', 'error'); return; }
      downloadPng(currentCanvas, 'vcard-qrcode.png');
      showToast('vCard QR code downloaded as PNG', 'success');
    });

    dlSvg.addEventListener('click', function() {
      if (!currentSvg) { showToast('Enter at least a name', 'error'); return; }
      downloadSvg(currentSvg, 'vcard-qrcode.svg');
      showToast('vCard QR code downloaded as SVG', 'success');
    });

    copyVcard.addEventListener('click', function() {
      if (!currentVcard) { showToast('Enter at least a name', 'error'); return; }
      copyTextToClipboard(currentVcard, 'vCard text copied to clipboard');
    });
  })();

  // ======================================================================
  // ====== EMAIL QR GENERATOR ======
  // ======================================================================
  (function() {
    var emailTo = document.getElementById('emailTo');
    var emailSubject = document.getElementById('emailSubject');
    var emailBody = document.getElementById('emailBody');
    var errorMsg = document.getElementById('emailErrorMsg');
    var qrFrame = document.getElementById('emailQrFrame');
    var placeholder = document.getElementById('emailPlaceholder');
    var dlPng = document.getElementById('emailDlPng');
    var dlSvg = document.getElementById('emailDlSvg');

    var currentCanvas = null;
    var currentSvg = null;
    var debounceTimer = null;

    function buildMailto() {
      var to = emailTo.value.trim();
      if (!to) return '';
      var subject = emailSubject.value.trim();
      var body = emailBody.value.trim();

      var url = 'mailto:' + encodeURIComponent(to);
      var params = [];
      if (subject) params.push('subject=' + encodeURIComponent(subject));
      if (body) params.push('body=' + encodeURIComponent(body));
      if (params.length) url += '?' + params.join('&');
      return url;
    }

    function update() {
      var mailto = buildMailto();
      hideToolError(errorMsg);

      var kids = qrFrame.children;
      for (var i = kids.length - 1; i >= 0; i--) {
        if (kids[i] !== placeholder) kids[i].remove();
      }

      if (!mailto) {
        placeholder.style.display = '';
        qrFrame.classList.remove('has-qr');
        currentCanvas = null;
        currentSvg = null;
        dlPng.disabled = true;
        dlSvg.disabled = true;
        return;
      }

      placeholder.style.display = 'none';

      var spinner = document.createElement('div');
      spinner.className = 'spinner';
      qrFrame.appendChild(spinner);
      qrFrame.classList.add('has-qr');

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function() {
        try {
          var qr = generateQRData(mailto);
          if (!qr) throw new Error('Generation failed');
          var moduleCount = qr.getModuleCount();
          var size = 260;

          currentCanvas = renderQrCanvas(qr, moduleCount, size, '#000000', '#ffffff');
          currentSvg = qrToSvg(qr, moduleCount, size, '#000000', '#ffffff');

          if (spinner.parentNode) spinner.remove();
          qrFrame.appendChild(currentCanvas);

          dlPng.disabled = false;
          dlSvg.disabled = false;

        } catch (e) {
          if (spinner.parentNode) spinner.remove();
          placeholder.style.display = '';
          qrFrame.classList.remove('has-qr');
          showToolError(errorMsg, 'Error generating email QR code.');
        }
      }, 200);
    }

    emailTo.addEventListener('input', update);
    emailSubject.addEventListener('input', update);
    emailBody.addEventListener('input', update);

    dlPng.addEventListener('click', function() {
      if (!currentCanvas) { showToast('Enter an email address', 'error'); return; }
      downloadPng(currentCanvas, 'email-qrcode.png');
      showToast('Email QR code downloaded as PNG', 'success');
    });

    dlSvg.addEventListener('click', function() {
      if (!currentSvg) { showToast('Enter an email address', 'error'); return; }
      downloadSvg(currentSvg, 'email-qrcode.svg');
      showToast('Email QR code downloaded as SVG', 'success');
    });
  })();

  // ======================================================================
  // ====== SMS QR GENERATOR ======
  // ======================================================================
  (function() {
    var smsPhone = document.getElementById('smsPhone');
    var smsMsg = document.getElementById('smsMsg');
    var errorMsg = document.getElementById('smsErrorMsg');
    var qrFrame = document.getElementById('smsQrFrame');
    var placeholder = document.getElementById('smsPlaceholder');
    var dlPng = document.getElementById('smsDlPng');
    var dlSvg = document.getElementById('smsDlSvg');

    var currentCanvas = null;
    var currentSvg = null;
    var debounceTimer = null;

    function buildSms() {
      var phone = smsPhone.value.trim();
      if (!phone) return '';
      var msg = smsMsg.value.trim();

      var url = 'sms:' + encodeURIComponent(phone);
      if (msg) url += '?body=' + encodeURIComponent(msg);
      return url;
    }

    function update() {
      var sms = buildSms();
      hideToolError(errorMsg);

      var kids = qrFrame.children;
      for (var i = kids.length - 1; i >= 0; i--) {
        if (kids[i] !== placeholder) kids[i].remove();
      }

      if (!sms) {
        placeholder.style.display = '';
        qrFrame.classList.remove('has-qr');
        currentCanvas = null;
        currentSvg = null;
        dlPng.disabled = true;
        dlSvg.disabled = true;
        return;
      }

      placeholder.style.display = 'none';

      var spinner = document.createElement('div');
      spinner.className = 'spinner';
      qrFrame.appendChild(spinner);
      qrFrame.classList.add('has-qr');

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function() {
        try {
          var qr = generateQRData(sms);
          if (!qr) throw new Error('Generation failed');
          var moduleCount = qr.getModuleCount();
          var size = 260;

          currentCanvas = renderQrCanvas(qr, moduleCount, size, '#000000', '#ffffff');
          currentSvg = qrToSvg(qr, moduleCount, size, '#000000', '#ffffff');

          if (spinner.parentNode) spinner.remove();
          qrFrame.appendChild(currentCanvas);

          dlPng.disabled = false;
          dlSvg.disabled = false;

        } catch (e) {
          if (spinner.parentNode) spinner.remove();
          placeholder.style.display = '';
          qrFrame.classList.remove('has-qr');
          showToolError(errorMsg, 'Error generating SMS QR code.');
        }
      }, 200);
    }

    smsPhone.addEventListener('input', update);
    smsMsg.addEventListener('input', update);

    dlPng.addEventListener('click', function() {
      if (!currentCanvas) { showToast('Enter a phone number', 'error'); return; }
      downloadPng(currentCanvas, 'sms-qrcode.png');
      showToast('SMS QR code downloaded as PNG', 'success');
    });

    dlSvg.addEventListener('click', function() {
      if (!currentSvg) { showToast('Enter a phone number', 'error'); return; }
      downloadSvg(currentSvg, 'sms-qrcode.svg');
      showToast('SMS QR code downloaded as SVG', 'success');
    });
  })();

  // ======================================================================
  // ====== URL QR GENERATOR ======
  // ======================================================================
  (function() {
    var urlInput = document.getElementById('urlInput');
    var errorMsg = document.getElementById('urlErrorMsg');
    var qrFrame = document.getElementById('urlQrFrame');
    var placeholder = document.getElementById('urlPlaceholder');
    var dlPng = document.getElementById('urlDlPng');
    var dlSvg = document.getElementById('urlDlSvg');
    var copyUrl = document.getElementById('urlCopyStr');

    var currentCanvas = null;
    var currentSvg = null;
    var currentUrl = '';
    var debounceTimer = null;

    function normalizeUrl(str) {
      str = str.trim();
      if (!str) return '';
      if (!/^https?:\/\//i.test(str)) {
        str = 'https://' + str;
      }
      try {
        var u = new URL(str);
        if (u.protocol !== 'http:' && u.protocol !== 'https:') return '';
        return u.href;
      } catch (e) {
        return '';
      }
    }

    function update() {
      var raw = urlInput.value;
      var url = normalizeUrl(raw);
      hideToolError(errorMsg);

      var kids = qrFrame.children;
      for (var i = kids.length - 1; i >= 0; i--) {
        if (kids[i] !== placeholder) kids[i].remove();
      }

      if (!raw.trim()) {
        placeholder.style.display = '';
        qrFrame.classList.remove('has-qr');
        currentCanvas = null;
        currentSvg = null;
        currentUrl = '';
        dlPng.disabled = true;
        dlSvg.disabled = true;
        copyUrl.disabled = true;
        return;
      }

      if (!url) {
        placeholder.style.display = '';
        qrFrame.classList.remove('has-qr');
        currentCanvas = null;
        currentSvg = null;
        currentUrl = '';
        dlPng.disabled = true;
        dlSvg.disabled = true;
        copyUrl.disabled = true;
        showToolError(errorMsg, 'Please enter a valid URL.');
        return;
      }

      placeholder.style.display = 'none';

      var spinner = document.createElement('div');
      spinner.className = 'spinner';
      qrFrame.appendChild(spinner);
      qrFrame.classList.add('has-qr');

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function() {
        try {
          var qr = generateQRData(url);
          if (!qr) throw new Error('Generation failed');
          var moduleCount = qr.getModuleCount();
          var size = 260;

          currentUrl = url;
          currentCanvas = renderQrCanvas(qr, moduleCount, size, '#000000', '#ffffff');
          currentSvg = qrToSvg(qr, moduleCount, size, '#000000', '#ffffff');

          if (spinner.parentNode) spinner.remove();
          qrFrame.appendChild(currentCanvas);

          dlPng.disabled = false;
          dlSvg.disabled = false;
          copyUrl.disabled = false;

        } catch (e) {
          if (spinner.parentNode) spinner.remove();
          placeholder.style.display = '';
          qrFrame.classList.remove('has-qr');
          showToolError(errorMsg, 'Error generating URL QR code.');
        }
      }, 200);
    }

    urlInput.addEventListener('input', update);

    dlPng.addEventListener('click', function() {
      if (!currentCanvas) { showToast('Enter a URL', 'error'); return; }
      downloadPng(currentCanvas, 'url-qrcode.png');
      showToast('URL QR code downloaded as PNG', 'success');
    });

    dlSvg.addEventListener('click', function() {
      if (!currentSvg) { showToast('Enter a URL', 'error'); return; }
      downloadSvg(currentSvg, 'url-qrcode.svg');
      showToast('URL QR code downloaded as SVG', 'success');
    });

    copyUrl.addEventListener('click', function() {
      if (!currentUrl) { showToast('Enter a URL', 'error'); return; }
      copyTextToClipboard(currentUrl, 'URL copied to clipboard');
    });
  })();

  // ======================================================================
  // ====== QR FROM IMAGE ======
  // ======================================================================
  (function() {
    var readArea = document.getElementById('readArea');
    var readInput = document.getElementById('readInput');
    var readError = document.getElementById('readErrorMsg');
    var readPlaceholder = document.getElementById('readPlaceholder');
    var readResultContent = document.getElementById('readResultContent');
    var readResultText = document.getElementById('readResultText');
    var readResultActions = document.getElementById('readResultActions');

    readArea.addEventListener('click', function() { readInput.click(); });

    readArea.addEventListener('dragover', function(e) {
      e.preventDefault();
      readArea.classList.add('dragover');
    });
    readArea.addEventListener('dragleave', function() {
      readArea.classList.remove('dragover');
    });
    readArea.addEventListener('drop', function(e) {
      e.preventDefault();
      readArea.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        handleReadFile(e.dataTransfer.files[0]);
      }
    });

    readInput.addEventListener('change', function(e) {
      if (e.target.files.length > 0) {
        handleReadFile(e.target.files[0]);
      }
    });

    function handleReadFile(file) {
      if (!file || file.type.indexOf('image/') !== 0) {
        showToast('Please upload a valid image', 'error');
        return;
      }
      readError.classList.remove('show');

      var reader = new FileReader();
      reader.onload = function(e) {
        var img = new Image();
        img.onload = function() {
          var result = decodeReadImage(img);
          if (result) {
            resetReadResult();
            showReadResult(result);
            showToast('QR code decoded from image', 'success');
          } else {
            showToast('No QR code found in image', 'error');
            readError.querySelector('span').textContent = 'No QR code could be detected. Try a clearer image.';
            readError.classList.add('show');
          }
        };
        img.onerror = function() {
          showToast('Failed to load image', 'error');
        };
        img.src = e.target.result;
      };
      reader.onerror = function() {
        showToast('Failed to read file', 'error');
      };
      reader.readAsDataURL(file);
    }

    function decodeReadImage(img) {
      var w = img.naturalWidth || img.width;
      var h = img.naturalHeight || img.height;
      var maxDim = 1280;
      if (w > maxDim || h > maxDim) {
        var ratio = Math.min(maxDim / w, maxDim / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      var canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      var imageData = ctx.getImageData(0, 0, w, h);
      try {
        var code = jsQR(imageData.data, w, h);
        return code ? code.data : null;
      } catch (e) {
        return null;
      }
    }

    function showReadResult(data) {
      readPlaceholder.hidden = true;
      readResultContent.hidden = false;
      readResultText.textContent = data;

      readResultActions.innerHTML = '';

      var copyBtn = document.createElement('button');
      copyBtn.className = 'btn btn-primary';
      copyBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy';
      copyBtn.addEventListener('click', function() {
        copyTextToClipboard(data);
      });
      readResultActions.appendChild(copyBtn);

      if (isUrl(data)) {
        var openBtn = document.createElement('a');
        openBtn.className = 'btn btn-success';
        openBtn.href = data;
        openBtn.target = '_blank';
        openBtn.rel = 'noopener noreferrer';
        openBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg> Open URL';
        readResultActions.appendChild(openBtn);
      }
    }

    function resetReadResult() {
      readPlaceholder.hidden = false;
      readResultContent.hidden = true;
      readResultText.textContent = '';
      readResultActions.innerHTML = '';
      readError.classList.remove('show');
    }
  })();

  // ======================================================================
  // ====== COLOR QR GENERATOR ======
  // ======================================================================
  (function() {
    var input = document.getElementById('colorInput');
    var fgPicker = document.getElementById('colorFg');
    var bgPicker = document.getElementById('colorBg');
    var gradientCheck = document.getElementById('colorGradient');
    var gradientEndWrap = document.getElementById('colorGradientEndWrap');
    var gradientEndPicker = document.getElementById('colorGradientEnd');
    var roundedDotsCheck = document.getElementById('colorRoundedDots');
    var roundedCornersCheck = document.getElementById('colorRoundedCorners');
    var sizeSelect = document.getElementById('colorSize');
    var eclSelect = document.getElementById('colorEcl');
    var marginSelect = document.getElementById('colorMargin');
    var logoInput = document.getElementById('colorLogo');
    var logoClear = document.getElementById('colorLogoClear');
    var errorMsg = document.getElementById('colorErrorMsg');
    var qrFrame = document.getElementById('colorQrFrame');
    var placeholder = document.getElementById('colorPlaceholder');
    var dlPng = document.getElementById('colorDlPng');
    var dlSvg = document.getElementById('colorDlSvg');
    var copyImg = document.getElementById('colorCopyImg');

    var currentCanvas = null;
    var currentSvg = null;
    var logoImage = null;
    var debounceTimer = null;

    gradientCheck.addEventListener('change', function() {
      gradientEndWrap.style.display = gradientCheck.checked ? '' : 'none';
      update();
    });

    logoInput.addEventListener('change', function(e) {
      if (e.target.files.length > 0) {
        var file = e.target.files[0];
        if (file.type.indexOf('image/') === 0) {
          var reader = new FileReader();
          reader.onload = function(ev) {
            var img = new Image();
            img.onload = function() {
              logoImage = img;
              logoClear.disabled = false;
              update();
            };
            img.src = ev.target.result;
          };
          reader.readAsDataURL(file);
        }
      }
    });

    logoClear.addEventListener('click', function() {
      logoImage = null;
      logoInput.value = '';
      logoClear.disabled = true;
      update();
    });

    function update() {
      var text = input.value.trim();
      hideToolError(errorMsg);

      var kids = qrFrame.children;
      for (var i = kids.length - 1; i >= 0; i--) {
        if (kids[i] !== placeholder) kids[i].remove();
      }

      if (!text) {
        placeholder.style.display = '';
        qrFrame.classList.remove('has-qr');
        currentCanvas = null;
        currentSvg = null;
        dlPng.disabled = true;
        dlSvg.disabled = true;
        copyImg.disabled = true;
        return;
      }

      placeholder.style.display = 'none';

      var spinner = document.createElement('div');
      spinner.className = 'spinner';
      qrFrame.appendChild(spinner);
      qrFrame.classList.add('has-qr');

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function() {
        try {
          var ecl = eclSelect.value || 'M';
          var qr = qrcode(0, ecl);
          qr.addData(text);
          qr.make();

          var moduleCount = qr.getModuleCount();
          var size = parseInt(sizeSelect.value, 10) || 280;
          var margin = parseInt(marginSelect.value, 10) || 2;
          var fg = fgPicker.value || '#000000';
          var bg = bgPicker.value || '#ffffff';
          var gradient = gradientCheck.checked;
          var gradientEnd = gradientEndPicker.value || '#2563eb';
          var roundedDots = roundedDotsCheck.checked;
          var roundedCorners = roundedCornersCheck.checked;

          var opts = {
            roundedDots: roundedDots,
            gradient: gradient,
            gradientEnd: gradientEnd,
            margin: margin,
            cornerRadius: roundedCorners ? 16 : 0
          };

          currentCanvas = renderQrCanvas(qr, moduleCount, size, fg, bg, opts);
          currentSvg = qrToSvg(qr, moduleCount, size, fg, bg, opts);

          // Draw logo overlay on canvas
          if (logoImage) {
            var ctx = currentCanvas.getContext('2d');
            var logoSize = size * 0.22;
            var lx = (size - logoSize) / 2;
            var ly = (size - logoSize) / 2;
            ctx.save();
            ctx.beginPath();
            ctx.arc(lx + logoSize / 2, ly + logoSize / 2, logoSize / 2 + 2, 0, Math.PI * 2);
            ctx.fillStyle = bg;
            ctx.fill();
            ctx.beginPath();
            ctx.arc(lx + logoSize / 2, ly + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(logoImage, lx, ly, logoSize, logoSize);
            ctx.restore();
          }

          if (spinner.parentNode) spinner.remove();
          qrFrame.appendChild(currentCanvas);

          dlPng.disabled = false;
          dlSvg.disabled = false;
          copyImg.disabled = false;

        } catch (e) {
          if (spinner.parentNode) spinner.remove();
          placeholder.style.display = '';
          qrFrame.classList.remove('has-qr');
          showToolError(errorMsg, 'Error generating QR code. Try shorter text or different settings.');
        }
      }, 200);
    }

    input.addEventListener('input', update);
    fgPicker.addEventListener('input', update);
    bgPicker.addEventListener('input', update);
    gradientEndPicker.addEventListener('input', update);
    roundedDotsCheck.addEventListener('change', update);
    roundedCornersCheck.addEventListener('change', update);
    sizeSelect.addEventListener('change', update);
    eclSelect.addEventListener('change', update);
    marginSelect.addEventListener('change', update);

    dlPng.addEventListener('click', function() {
      if (!currentCanvas) { showToast('Enter text first', 'error'); return; }
      downloadPng(currentCanvas, 'color-qrcode.png');
      showToast('Color QR code downloaded as PNG', 'success');
    });

    dlSvg.addEventListener('click', function() {
      if (!currentSvg) { showToast('Enter text first', 'error'); return; }
      downloadSvg(currentSvg, 'color-qrcode.svg');
      showToast('Color QR code downloaded as SVG', 'success');
    });

    copyImg.addEventListener('click', function() {
      if (!currentCanvas) { showToast('Enter text first', 'error'); return; }
      copyImage(currentCanvas, 'Color QR image copied', 'Copy not supported. PNG downloaded instead.');
    });
  })();

})();
