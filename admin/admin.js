/**
 * ONSRA Yoga Ashram - Live Web Admin Dashboard Engine
 * Supports both Local Node.js API and Live GitHub REST API
 */

(function () {
  'use strict';

  var GITHUB_REPO = 'visha56/onsra';
  var GITHUB_BRANCH = 'main';
  var GITHUB_TOKEN_KEY = 'onsra_github_pat';

  var isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  var siteData = null;
  var currentSha = null; // Used for GitHub Contents API

  // DOM Elements
  var statusIndicator = document.getElementById('status-indicator');
  var tokenModal = document.getElementById('token-modal');
  var tokenInput = document.getElementById('github-token-input');
  var saveBtn = document.getElementById('btn-save-all');
  var publishBtn = document.getElementById('btn-publish-git');

  // Initialization
  document.addEventListener('DOMContentLoaded', initAdmin);

  function initAdmin() {
    setupTabs();
    setupTokenModal();
    updateConnectionStatus();
    loadContent();
    setupSaveActions();
    loadGalleryImages();
  }

  /* ------------------- Connection & Environment ------------------- */
  function updateConnectionStatus() {
    var token = localStorage.getItem(GITHUB_TOKEN_KEY);
    var dot = document.getElementById('status-dot');
    var text = document.getElementById('status-text');

    if (isLocal) {
      dot.className = 'status-dot';
      text.textContent = '🟢 Local Server Connected (Port 3000)';
      if (publishBtn) publishBtn.style.display = 'inline-flex';
    } else if (token) {
      dot.className = 'status-dot';
      text.textContent = '🟢 GitHub API Connected';
      if (publishBtn) publishBtn.style.display = 'inline-flex';
    } else {
      dot.className = 'status-dot offline';
      text.textContent = '🟡 GitHub Token Required for Saving';
      if (publishBtn) publishBtn.style.display = 'inline-flex';
    }
  }

  function setupTokenModal() {
    var btnOpen = document.getElementById('btn-open-token-modal');
    var btnClose = document.getElementById('btn-close-token-modal');
    var btnSaveToken = document.getElementById('btn-save-token');
    var btnClearToken = document.getElementById('btn-clear-token');

    if (btnOpen) {
      btnOpen.addEventListener('click', function () {
        tokenInput.value = localStorage.getItem(GITHUB_TOKEN_KEY) || '';
        tokenModal.classList.add('open');
      });
    }

    if (btnClose) {
      btnClose.addEventListener('click', function () {
        tokenModal.classList.remove('open');
      });
    }

    if (btnSaveToken) {
      btnSaveToken.addEventListener('click', function () {
        var token = tokenInput.value.trim();
        if (!token) {
          showToast('कृपया वैध GitHub टोकन टाका.', 'error');
          return;
        }
        localStorage.setItem(GITHUB_TOKEN_KEY, token);
        tokenModal.classList.remove('open');
        updateConnectionStatus();
        showToast('GitHub टोकन सेव्ह झाले! कनेक्शन सक्रिय आहे.', 'success');
      });
    }

    if (btnClearToken) {
      btnClearToken.addEventListener('click', function () {
        localStorage.removeItem(GITHUB_TOKEN_KEY);
        tokenInput.value = '';
        tokenModal.classList.remove('open');
        updateConnectionStatus();
        showToast('टोकन काढून टाकले.', 'info');
      });
    }
  }

  /* ------------------- Load Content ------------------- */
  function loadContent() {
    showToast('माहिती लोड होत आहे...', 'info');

    var fetchUrl = isLocal
      ? '/api/content'
      : 'https://api.github.com/repos/' + GITHUB_REPO + '/contents/data/content.json?ref=' + GITHUB_BRANCH;

    if (isLocal) {
      fetch(fetchUrl)
        .then(function (res) { return res.json(); })
        .then(function (data) {
          siteData = data;
          renderAll();
          showToast('माहिती यशस्वीरीत्या लोड झाली!', 'success');
        })
        .catch(fallbackLocalFetch);
    } else {
      // Remote GitHub fetch
      var headers = { 'Accept': 'application/vnd.github.v3+json' };
      var token = localStorage.getItem(GITHUB_TOKEN_KEY);
      if (token) headers['Authorization'] = 'token ' + token;

      fetch(fetchUrl, { headers: headers })
        .then(function (res) {
          if (!res.ok) throw new Error('Status ' + res.status);
          return res.json();
        })
        .then(function (resData) {
          currentSha = resData.sha;
          var decodedStr = decodeURIComponent(escape(atob(resData.content)));
          siteData = JSON.parse(decodedStr);
          renderAll();
          showToast('GitHub वरून माहिती लोड झाली!', 'success');
        })
        .catch(function (err) {
          console.warn('GitHub API fetch failed, falling back to static json:', err);
          fallbackLocalFetch();
        });
    }
  }

  function fallbackLocalFetch() {
    fetch('../data/content.json?v=' + new Date().getTime())
      .then(function (res) { return res.json(); })
      .then(function (data) {
        siteData = data;
        renderAll();
        showToast('माहिती लोड झाली.', 'success');
      })
      .catch(function (err) {
        showToast('डेटा लोड करताना त्रुटी: ' + err.message, 'error');
      });
  }

  /* ------------------- Render Forms ------------------- */
  function renderAll() {
    if (!siteData) return;
    renderGeneralTab();
    renderBatches();
    renderSchedule();
    renderRooms();
    renderTestimonials();
    renderHeroTab();
  }

  /* 1. General & Contact Tab */
  function renderGeneralTab() {
    var g = siteData.general || {};
    document.getElementById('input-site-name').value = g.siteName || '';
    document.getElementById('input-tagline').value = g.tagline || '';
    document.getElementById('input-announcement').value = g.announcement || '';
    document.getElementById('input-phone1').value = g.primaryPhone || '';
    document.getElementById('input-phone2').value = g.secondaryPhone || '';
    document.getElementById('input-whatsapp').value = g.whatsappNumber || '';
    document.getElementById('input-email').value = g.email || '';
    document.getElementById('input-instagram-url').value = g.instagramUrl || '';
    document.getElementById('input-location').value = g.location || '';
  }

  /* 2. Batches */
  function renderBatches() {
    var container = document.getElementById('batches-list');
    var batches = siteData.batches || [];
    container.innerHTML = '';

    batches.forEach(function (b, index) {
      var item = document.createElement('div');
      item.className = 'item-card';
      item.innerHTML =
        '<div class="item-header">' +
        '<span class="item-badge">बॅच #' + (index + 1) + '</span>' +
        '<button type="button" class="btn btn-danger btn-sm" onclick="ONSRA_ADMIN.deleteBatch(' + index + ')">🗑 हटवा</button>' +
        '</div>' +
        '<div class="form-grid">' +
        '<div class="form-group">' +
        '<label>बॅचचे नाव</label>' +
        '<input type="text" value="' + (b.name || '') + '" oninput="ONSRA_ADMIN.updateBatch(' + index + ', \'name\', this.value)" />' +
        '</div>' +
        '<div class="form-group">' +
        '<label>तारखा (Dates)</label>' +
        '<input type="text" value="' + (b.dates || '') + '" oninput="ONSRA_ADMIN.updateBatch(' + index + ', \'dates\', this.value)" />' +
        '</div>' +
        '<div class="form-group">' +
        '<label>स्थान व प्रकार</label>' +
        '<input type="text" value="' + (b.style || '') + '" oninput="ONSRA_ADMIN.updateBatch(' + index + ', \'style\', this.value)" placeholder="Hatha Yoga" />' +
        '</div>' +
        '<div class="form-group">' +
        '<label>स्थिती (Status)</label>' +
        '<select onchange="ONSRA_ADMIN.updateBatchStatus(' + index + ', this.value)">' +
        '<option value="Open" ' + (b.status === 'Open' ? 'selected' : '') + '>✔ Open</option>' +
        '<option value="Filling Fast" ' + (b.status === 'Filling Fast' ? 'selected' : '') + '>⚡ Filling Fast</option>' +
        '<option value="Sold Out" ' + (b.status === 'Sold Out' ? 'selected' : '') + '>❌ Sold Out</option>' +
        '</select>' +
        '</div>' +
        '</div>';
      container.appendChild(item);
    });
  }

  /* 3. Daily Schedule */
  function renderSchedule() {
    var container = document.getElementById('schedule-list');
    var schedule = siteData.schedule || [];
    container.innerHTML = '';

    schedule.forEach(function (s, index) {
      var item = document.createElement('div');
      item.className = 'item-card';
      item.innerHTML =
        '<div class="item-header">' +
        '<span class="item-badge">वेळ #' + (index + 1) + '</span>' +
        '<button type="button" class="btn btn-danger btn-sm" onclick="ONSRA_ADMIN.deleteSchedule(' + index + ')">🗑 हटवा</button>' +
        '</div>' +
        '<div class="form-grid">' +
        '<div class="form-group" style="max-width:180px;">' +
        '<label>वेळ (Time)</label>' +
        '<input type="text" value="' + (s.time || '') + '" oninput="ONSRA_ADMIN.updateSchedule(' + index + ', \'time\', this.value)" />' +
        '</div>' +
        '<div class="form-group" style="max-width:100px;">' +
        '<label>आयकॉन</label>' +
        '<input type="text" value="' + (s.icon || '') + '" oninput="ONSRA_ADMIN.updateSchedule(' + index + ', \'icon\', this.value)" />' +
        '</div>' +
        '<div class="form-group full">' +
        '<label>सत्र / क्रिया (Activity)</label>' +
        '<input type="text" value="' + (s.activity || '') + '" oninput="ONSRA_ADMIN.updateSchedule(' + index + ', \'activity\', this.value)" />' +
        '</div>' +
        '</div>';
      container.appendChild(item);
    });
  }

  /* 4. Rooms */
  function renderRooms() {
    var container = document.getElementById('rooms-list');
    var rooms = siteData.rooms || [];
    container.innerHTML = '';

    rooms.forEach(function (r, index) {
      var item = document.createElement('div');
      item.className = 'item-card';
      var amenitiesStr = (r.amenities || []).join(', ');

      item.innerHTML =
        '<div class="item-header">' +
        '<span class="item-badge">खोली #' + (index + 1) + ': ' + (r.title || '') + '</span>' +
        '</div>' +
        '<div class="form-grid">' +
        '<div class="form-group">' +
        '<label>खोलीचे नाव (Room Title)</label>' +
        '<input type="text" value="' + (r.title || '') + '" oninput="ONSRA_ADMIN.updateRoom(' + index + ', \'title\', this.value)" />' +
        '</div>' +
        '<div class="form-group">' +
        '<label>फोटो पाथ (Image Path)</label>' +
        '<div style="display:flex; gap:8px;">' +
        '<input type="text" id="room-img-input-' + index + '" value="' + (r.image || '') + '" oninput="ONSRA_ADMIN.updateRoom(' + index + ', \'image\', this.value)" />' +
        '<button type="button" class="btn btn-secondary btn-sm" onclick="ONSRA_ADMIN.pickImageFor(\'room-img-input-' + index + '\', ' + index + ', \'room\')">🖼 निवडा</button>' +
        '</div>' +
        '</div>' +
        '<div class="form-group full">' +
        '<div class="img-picker-wrap">' +
        '<img src="../' + (r.image || 'images/logo.png') + '" id="room-preview-' + index + '" class="img-preview" alt="Preview" />' +
        '<span style="font-size:0.85rem; color:var(--text-muted);">चालू फोटो प्रीव्ह्यू. फोटो बदलण्यासाठी वरील "🖼 निवडा" बटण वापरा किंवा नवीन फोटो अपलोड करा.</span>' +
        '</div>' +
        '</div>' +
        '<div class="form-group full">' +
        '<label>वर्णन (Description)</label>' +
        '<textarea oninput="ONSRA_ADMIN.updateRoom(' + index + ', \'description\', this.value)">' + (r.description || '') + '</textarea>' +
        '</div>' +
        '<div class="form-group full">' +
        '<label>सुविधा (Amenities - कॉमाने वेगळे करा)</label>' +
        '<input type="text" value="' + amenitiesStr + '" oninput="ONSRA_ADMIN.updateRoomAmenities(' + index + ', this.value)" />' +
        '</div>' +
        '</div>';
      container.appendChild(item);
    });
  }

  /* 5. Testimonials (Student Stories) */
  function renderTestimonials() {
    var container = document.getElementById('testimonials-list');
    var list = siteData.testimonials || [];
    container.innerHTML = '';

    list.forEach(function (t, index) {
      var item = document.createElement('div');
      item.className = 'item-card';

      item.innerHTML =
        '<div class="item-header">' +
        '<span class="item-badge">रिव्ह्यू #' + (index + 1) + ': ' + (t.name || '') + '</span>' +
        '<button type="button" class="btn btn-danger btn-sm" onclick="ONSRA_ADMIN.deleteTestimonial(' + index + ')">🗑 हटवा</button>' +
        '</div>' +
        '<div class="form-grid">' +
        '<div class="form-group">' +
        '<label>विद्यार्थ्याचे नाव</label>' +
        '<input type="text" value="' + (t.name || '') + '" oninput="ONSRA_ADMIN.updateTestimonial(' + index + ', \'name\', this.value)" />' +
        '</div>' +
        '<div class="form-group">' +
        '<label>देश / शहर (उदा. 🇬🇧 London, UK)</label>' +
        '<input type="text" value="' + (t.location || '') + '" oninput="ONSRA_ADMIN.updateTestimonial(' + index + ', \'location\', this.value)" />' +
        '</div>' +
        '<div class="form-group full">' +
        '<label>अभिप्राय / रिव्ह्यू (Review Text)</label>' +
        '<textarea oninput="ONSRA_ADMIN.updateTestimonial(' + index + ', \'text\', this.value)">' + (t.text || '') + '</textarea>' +
        '</div>' +
        '</div>';
      container.appendChild(item);
    });
  }

  /* 6. Hero & Programs Tab */
  function renderHeroTab() {
    var h = siteData.hero || {};
    document.getElementById('input-hero-badge').value = h.badge || '';
    document.getElementById('input-hero-title').value = h.title || '';
    document.getElementById('input-hero-sub').value = h.subtitle || '';
    document.getElementById('input-hero-cta').value = h.ctaText || '';
    document.getElementById('input-hero-sec-cta').value = h.secondaryCtaText || '';

    // Programs
    var ttc = (siteData.programs || []).find(function (p) { return p.id === 'ttc200'; }) || {};
    document.getElementById('input-ttc-title').value = ttc.title || '';
    document.getElementById('input-ttc-desc').value = ttc.description || '';
    document.getElementById('input-ttc-img').value = ttc.image || '';
    var ttcPreview = document.getElementById('ttc-preview-img');
    if (ttcPreview) ttcPreview.src = '../' + (ttc.image || 'images/ttc-featured.jpg');
  }

  /* ------------------- Image Manager & Gallery ------------------- */
  function loadGalleryImages() {
    var gallery = document.getElementById('gallery-grid');
    if (!gallery) return;

    if (isLocal) {
      fetch('/api/images')
        .then(function (res) { return res.json(); })
        .then(function (data) {
          renderGallery(data.images || []);
        })
        .catch(function () {
          renderDefaultGallery();
        });
    } else {
      renderDefaultGallery();
    }
  }

  function renderDefaultGallery() {
    var defaults = [
      'ttc-featured.jpg', 'room-private.jpg', 'ttc-beach-group.jpg', 'ashram-about.jpg',
      'womens-retreat.jpg', 'hero-bg.jpg', 'logo.png', 'ig-beach-yoga.jpg', 'ig-meditation.jpg', 'ig-sunset.jpg'
    ];
    renderGallery(defaults);
  }

  function renderGallery(files) {
    var gallery = document.getElementById('gallery-grid');
    if (!gallery) return;
    gallery.innerHTML = '';

    files.forEach(function (f) {
      var fullPath = 'images/' + f;
      var div = document.createElement('div');
      div.className = 'gallery-item';
      div.innerHTML =
        '<img src="../' + fullPath + '" alt="' + f + '" />' +
        '<span>' + f + '</span>' +
        '<button type="button" class="btn btn-secondary btn-sm" style="margin-top:4px; width:100%;" onclick="ONSRA_ADMIN.copyImagePath(\'' + fullPath + '\')">कॉपी लिंक</button>';
      gallery.appendChild(div);
    });
  }

  /* ------------------- Save & Publish Actions ------------------- */
  function collectFormData() {
    if (!siteData) siteData = {};

    // General
    siteData.general = {
      siteName: document.getElementById('input-site-name').value.trim(),
      tagline: document.getElementById('input-tagline').value.trim(),
      announcement: document.getElementById('input-announcement').value.trim(),
      primaryPhone: document.getElementById('input-phone1').value.trim(),
      secondaryPhone: document.getElementById('input-phone2').value.trim(),
      whatsappNumber: document.getElementById('input-whatsapp').value.trim(),
      email: document.getElementById('input-email').value.trim(),
      instagramUrl: document.getElementById('input-instagram-url').value.trim(),
      instagramHandle: '@onsra_yoga__ashram_goa',
      location: document.getElementById('input-location').value.trim()
    };

    // Hero
    siteData.hero = {
      badge: document.getElementById('input-hero-badge').value.trim(),
      title: document.getElementById('input-hero-title').value.trim(),
      subtitle: document.getElementById('input-hero-sub').value.trim(),
      ctaText: document.getElementById('input-hero-cta').value.trim(),
      ctaLink: 'training.html',
      secondaryCtaText: document.getElementById('input-hero-sec-cta').value.trim(),
      secondaryCtaLink: 'contact.html#booking'
    };

    // TTC Program
    var ttc = (siteData.programs || []).find(function (p) { return p.id === 'ttc200'; });
    if (ttc) {
      ttc.title = document.getElementById('input-ttc-title').value.trim();
      ttc.description = document.getElementById('input-ttc-desc').value.trim();
      ttc.image = document.getElementById('input-ttc-img').value.trim();
    }
  }

  function setupSaveActions() {
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        collectFormData();
        if (isLocal) {
          saveLocally();
        } else {
          saveToGitHub();
        }
      });
    }

    if (publishBtn) {
      publishBtn.addEventListener('click', function () {
        collectFormData();
        if (isLocal) {
          // In local mode, save and push directly via git
          saveLocally(function () {
            pushGitLocally();
          });
        } else {
          // In live mode, commit to GitHub
          saveToGitHub();
        }
      });
    }

    // Image Upload input
    var imgInput = document.getElementById('admin-image-upload');
    if (imgInput) {
      imgInput.addEventListener('change', handleImageUpload);
    }
  }

  function saveLocally(callback) {
    showToast('स्थानिक सर्व्हरवर सेव्ह करत आहे...', 'info');
    fetch('/api/save-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(siteData, null, 2)
    })
      .then(function (res) { return res.json(); })
      .then(function (resData) {
        if (resData.success) {
          showToast('बदल यशस्वीरीत्या सेव्ह झाले! 🎉', 'success');
          if (callback) callback();
        } else {
          showToast('सेव्ह करताना त्रुटी: ' + (resData.error || 'Unknown'), 'error');
        }
      })
      .catch(function (err) {
        showToast('सर्व्हर एरर: ' + err.message, 'error');
      });
  }

  function pushGitLocally() {
    showToast('GitHub वर पुश करत आहे (यात काही सेकंद लागतील)...', 'info');
    fetch('/api/git-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Update content via Admin Panel: ' + new Date().toLocaleString() })
    })
      .then(function (res) { return res.json(); })
      .then(function (resData) {
        if (resData.success) {
          showToast('बदल GitHub वर यशस्वीरीत्या पुश झाले! 🚀', 'success');
        } else {
          showToast('Git पुश त्रुटी: ' + (resData.error || 'Error'), 'error');
        }
      })
      .catch(function (err) {
        showToast('Git पुश एरर: ' + err.message, 'error');
      });
  }

  function saveToGitHub() {
    var token = localStorage.getItem(GITHUB_TOKEN_KEY);
    if (!token) {
      showToast('GitHub टोकन आवश्यक आहे! कृपया वर दिलेले "🔑 GitHub Token" बटण दाबा.', 'error');
      tokenModal.classList.add('open');
      return;
    }

    showToast('GitHub वर बदल सेव्ह करत आहे...', 'info');

    // Fetch latest sha first
    var getUrl = 'https://api.github.com/repos/' + GITHUB_REPO + '/contents/data/content.json?ref=' + GITHUB_BRANCH;
    var headers = {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': 'token ' + token
    };

    fetch(getUrl, { headers: headers })
      .then(function (res) {
        if (!res.ok) throw new Error('Status ' + res.status);
        return res.json();
      })
      .then(function (remoteData) {
        var sha = remoteData.sha;
        var jsonContent = JSON.stringify(siteData, null, 2);
        var base64Content = btoa(unescape(encodeURIComponent(jsonContent)));

        var putUrl = 'https://api.github.com/repos/' + GITHUB_REPO + '/contents/data/content.json';
        var body = {
          message: 'Update content via ONSRA Web Admin: ' + new Date().toLocaleString(),
          content: base64Content,
          sha: sha,
          branch: GITHUB_BRANCH
        };

        return fetch(putUrl, {
          method: 'PUT',
          headers: headers,
          body: JSON.stringify(body)
        });
      })
      .then(function (res) {
        if (!res.ok) throw new Error('GitHub API Error: ' + res.status);
        return res.json();
      })
      .then(function () {
        showToast('बदल GitHub वर सेव्ह झाले! साधारण १ मिनिटात लाईव्ह साइट अपडेट होईल. 🚀', 'success');
      })
      .catch(function (err) {
        showToast('GitHub वर सेव्ह करताना अडचण: ' + err.message, 'error');
      });
  }

  function handleImageUpload(e) {
    var file = e.target.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function (evt) {
      var base64Data = evt.target.result;
      var cleanFilename = file.name.toLowerCase().replace(/[^a-z0-9._-]/g, '_');

      showToast('फोटो अपलोड होत आहे: ' + cleanFilename, 'info');

      if (isLocal) {
        fetch('/api/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: cleanFilename, base64: base64Data })
        })
          .then(function (res) { return res.json(); })
          .then(function (resData) {
            if (resData.success) {
              showToast('फोटो यशस्वीरीत्या अपलोड झाला: ' + resData.path, 'success');
              loadGalleryImages();
            } else {
              showToast('फोटो अपलोड त्रुटी: ' + resData.error, 'error');
            }
          });
      } else {
        // Upload via GitHub Contents API
        var token = localStorage.getItem(GITHUB_TOKEN_KEY);
        if (!token) {
          showToast('फोटो अपलोड करण्यासाठी GitHub टोकन आवश्यक आहे!', 'error');
          tokenModal.classList.add('open');
          return;
        }

        var rawBase64 = base64Data.split(',')[1];
        var putUrl = 'https://api.github.com/repos/' + GITHUB_REPO + '/contents/images/' + cleanFilename;
        var headers = {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': 'token ' + token
        };

        fetch(putUrl, {
          method: 'PUT',
          headers: headers,
          body: JSON.stringify({
            message: 'Upload ' + cleanFilename + ' via ONSRA Web Admin',
            content: rawBase64,
            branch: GITHUB_BRANCH
          })
        })
          .then(function (res) { return res.json(); })
          .then(function () {
            showToast('फोटो GitHub वर यशस्वीरीत्या अपलोड झाला: images/' + cleanFilename, 'success');
            loadGalleryImages();
          })
          .catch(function (err) {
            showToast('फोटो अपलोड त्रुटी: ' + err.message, 'error');
          });
      }
    };
    reader.readAsDataURL(file);
  }

  /* ------------------- Tab Switching ------------------- */
  function setupTabs() {
    var buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        buttons.forEach(function (b) { b.classList.remove('active'); });
        document.querySelectorAll('.tab-pane').forEach(function (p) { p.classList.remove('active'); });

        btn.classList.add('active');
        var targetId = btn.getAttribute('data-tab');
        var targetPane = document.getElementById(targetId);
        if (targetPane) targetPane.classList.add('active');
      });
    });
  }

  /* ------------------- Notifications ------------------- */
  function showToast(message, type) {
    var container = document.getElementById('toast-container');
    if (!container) return;
    var toast = document.createElement('div');
    toast.className = 'toast ' + (type || 'info');
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(function () {
      toast.style.opacity = '0';
      setTimeout(function () { toast.remove(); }, 300);
    }, 4000);
  }

  /* ------------------- Global API for Inline Events ------------------- */
  window.ONSRA_ADMIN = {
    // Batches
    updateBatch: function (index, field, val) {
      if (siteData && siteData.batches && siteData.batches[index]) {
        siteData.batches[index][field] = val;
      }
    },
    updateBatchStatus: function (index, val) {
      if (siteData && siteData.batches && siteData.batches[index]) {
        siteData.batches[index].status = val;
        siteData.batches[index].statusClass = val === 'Filling Fast' ? 'status-filling' : 'status-open';
      }
    },
    deleteBatch: function (index) {
      if (confirm('ही बॅच खरोखर हटवायची आहे का?')) {
        siteData.batches.splice(index, 1);
        renderBatches();
      }
    },
    addBatch: function () {
      if (!siteData.batches) siteData.batches = [];
      siteData.batches.push({
        id: Date.now(),
        name: 'New TTC Batch',
        dates: 'Oct 1 – Oct 24, 2027',
        location: 'Goa, India',
        style: 'Hatha Yoga',
        status: 'Open',
        statusClass: 'status-open'
      });
      renderBatches();
    },

    // Schedule
    updateSchedule: function (index, field, val) {
      if (siteData && siteData.schedule && siteData.schedule[index]) {
        siteData.schedule[index][field] = val;
      }
    },
    deleteSchedule: function (index) {
      if (confirm('हा स्लॉट खरोखर हटवायचा आहे का?')) {
        siteData.schedule.splice(index, 1);
        renderSchedule();
      }
    },
    addSchedule: function () {
      if (!siteData.schedule) siteData.schedule = [];
      siteData.schedule.push({
        time: '8:00 – 9:00 AM',
        activity: 'New Yoga Session',
        icon: '🧘'
      });
      renderSchedule();
    },

    // Rooms
    updateRoom: function (index, field, val) {
      if (siteData && siteData.rooms && siteData.rooms[index]) {
        siteData.rooms[index][field] = val;
        if (field === 'image') {
          var preview = document.getElementById('room-preview-' + index);
          if (preview) preview.src = '../' + val;
        }
      }
    },
    updateRoomAmenities: function (index, val) {
      if (siteData && siteData.rooms && siteData.rooms[index]) {
        siteData.rooms[index].amenities = val.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      }
    },

    // Testimonials
    updateTestimonial: function (index, field, val) {
      if (siteData && siteData.testimonials && siteData.testimonials[index]) {
        siteData.testimonials[index][field] = val;
      }
    },
    deleteTestimonial: function (index) {
      if (confirm('हा रिव्ह्यू खरोखर हटवायचा आहे का?')) {
        siteData.testimonials.splice(index, 1);
        renderTestimonials();
      }
    },
    addTestimonial: function () {
      if (!siteData.testimonials) siteData.testimonials = [];
      siteData.testimonials.push({
        id: Date.now(),
        name: 'New Student',
        location: '🇮🇳 Mumbai, India',
        rating: 5,
        text: 'An exceptional spiritual and educational experience at ONSRA.'
      });
      renderTestimonials();
    },

    // Image Helpers
    pickImageFor: function (inputId, index, type) {
      var path = prompt('फोटोचा पाथ टाका (उदा. images/room-private.jpg किंवा गॅलरीमधून कॉपी केलेली लिंक):', 'images/');
      if (path) {
        var input = document.getElementById(inputId);
        if (input) input.value = path;
        if (type === 'room') {
          this.updateRoom(index, 'image', path);
        } else if (type === 'ttc') {
          var ttcPreview = document.getElementById('ttc-preview-img');
          if (ttcPreview) ttcPreview.src = '../' + path;
        }
      }
    },
    copyImagePath: function (path) {
      navigator.clipboard.writeText(path).then(function () {
        showToast('फोटो पाथ कॉपी झाला: ' + path, 'success');
      });
    }
  };

})();

