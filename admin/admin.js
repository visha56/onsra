/**
     * ONSRA Yoga Ashram - Live Web Admin Dashboard Engine
     */
    (function () {
      'use strict';

      var GITHUB_REPO = 'visha56/onsra';
      var GITHUB_BRANCH = 'main';
      var GITHUB_TOKEN_KEY = 'onsra_github_pat';

      var isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      var siteData = null;
      var currentSha = null;

      // DOM Elements
      var tokenModal = document.getElementById('token-modal');
      var tokenInput = document.getElementById('github-token-input');
      var saveBtn = document.getElementById('btn-save-all');
      var publishBtn = document.getElementById('btn-publish-git');

      // Fix image and relative paths depending on trailing slash
      function resolveAsset(relativePath) {
        if (!relativePath) return '';
        if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) return relativePath;
        var base = window.location.pathname.endsWith('/') ? '../' : './';
        return base + relativePath.replace(/^\.\//, '').replace(/^\.\.\//, '');
      }

      var AUTH_KEY = 'onsra_admin_auth';
      var VALID_USER = 'admin@onsrayoga.com';
      var VALID_PASS = 'onsra@123';
      var isAdminInitialized = false;

      function isAuthenticated() {
        return localStorage.getItem(AUTH_KEY) === 'true' || sessionStorage.getItem(AUTH_KEY) === 'true';
      }

      function setAuthenticated(remember) {
        if (remember) {
          localStorage.setItem(AUTH_KEY, 'true');
        } else {
          sessionStorage.setItem(AUTH_KEY, 'true');
        }
      }

      function clearAuthentication() {
        localStorage.removeItem(AUTH_KEY);
        sessionStorage.removeItem(AUTH_KEY);
      }

      function showAdminDashboard() {
        var overlay = document.getElementById('login-overlay');
        var mainWrap = document.getElementById('admin-main-wrap');
        if (overlay) overlay.style.display = 'none';
        if (mainWrap) mainWrap.style.display = 'block';
      }

      function showLoginScreen() {
        var overlay = document.getElementById('login-overlay');
        var mainWrap = document.getElementById('admin-main-wrap');
        if (overlay) overlay.style.display = 'flex';
        if (mainWrap) mainWrap.style.display = 'none';
        var emailInput = document.getElementById('login-email');
        if (emailInput) setTimeout(function () { emailInput.focus(); }, 150);
      }

      function setupLogin() {
        var form = document.getElementById('admin-login-form');
        var emailInput = document.getElementById('login-email');
        var pwdInput = document.getElementById('login-password');
        var rememberInput = document.getElementById('login-remember');
        var errBox = document.getElementById('login-error');
        var errMsg = document.getElementById('login-error-msg');
        var togglePwd = document.getElementById('btn-toggle-pwd');
        var logoutBtn = document.getElementById('btn-admin-logout');

        if (togglePwd && pwdInput) {
          togglePwd.addEventListener('click', function () {
            if (pwdInput.type === 'password') {
              pwdInput.type = 'text';
              togglePwd.textContent = '🙈';
            } else {
              pwdInput.type = 'password';
              togglePwd.textContent = '👁';
            }
          });
        }

        if (form) {
          form.addEventListener('submit', function (e) {
            e.preventDefault();
            var email = (emailInput ? emailInput.value : '').trim().toLowerCase();
            var pwd = (pwdInput ? pwdInput.value : '');

            if (email === VALID_USER && pwd === VALID_PASS) {
              if (errBox) errBox.style.display = 'none';
              var remember = rememberInput ? rememberInput.checked : true;
              setAuthenticated(remember);
              showToast('लॉगिन यशस्वी झाले! स्वागत आहे. 🙏', 'success');
              showAdminDashboard();
              initAdmin();
            } else {
              if (errBox) {
                errBox.style.display = 'flex';
                if (errMsg) errMsg.textContent = 'ईमेल किंवा पासवर्ड चुकीचा आहे! कृपया योग्य माहिती टाका.';
              }
              if (pwdInput) {
                pwdInput.value = '';
                pwdInput.focus();
              }
            }
          });
        }

        if (logoutBtn) {
          logoutBtn.addEventListener('click', function () {
            if (confirm('तुम्हाला ॲडमिन पॅनलमधून नक्की लॉगआउट करायचे आहे का?')) {
              clearAuthentication();
              showToast('तुम्ही यशस्वीरीत्या लॉगआउट झाला आहात.', 'info');
              showLoginScreen();
            }
          });
        }
      }

      document.addEventListener('DOMContentLoaded', function () {
        setupLogin();
        if (isAuthenticated()) {
          showAdminDashboard();
          initAdmin();
        } else {
          showLoginScreen();
        }
      });

      function initAdmin() {
        if (isAdminInitialized) return;
        isAdminInitialized = true;
        setupTabs();
        setupTokenModal();
        updateConnectionStatus();
        loadContent();
        setupSaveActions();
        loadGalleryImages();
      }

      function updateConnectionStatus() {
        var token = localStorage.getItem(GITHUB_TOKEN_KEY);
        var dot = document.getElementById('status-dot');
        var text = document.getElementById('status-text');

        if (isLocal) {
          dot.className = 'status-dot';
          text.textContent = '🟢 Local Server Connected (Port 3000)';
        } else if (token) {
          dot.className = 'status-dot';
          text.textContent = '🟢 GitHub API Connected';
        } else {
          dot.className = 'status-dot offline';
          text.textContent = '🟡 GitHub Token Required for Live Saving';
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

      function loadContent() {
        showToast('माहिती लोड होत आहे...', 'info');

        if (isLocal) {
          fetch('/api/content')
            .then(function (res) { return res.json(); })
            .then(function (data) {
              siteData = data;
              renderAll();
              showToast('माहिती यशस्वीरीत्या लोड झाली!', 'success');
            })
            .catch(fallbackLocalFetch);
        } else {
          var headers = { 'Accept': 'application/vnd.github.v3+json' };
          var token = localStorage.getItem(GITHUB_TOKEN_KEY);
          if (token) headers['Authorization'] = 'token ' + token;

          var ghUrl = 'https://api.github.com/repos/' + GITHUB_REPO + '/contents/data/content.json?ref=' + GITHUB_BRANCH;
          fetch(ghUrl, { headers: headers })
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
              console.warn('GitHub API fetch failed, falling back to local json:', err);
              fallbackLocalFetch();
            });
        }
      }

      function fallbackLocalFetch() {
        var jsonUrl = window.location.pathname.endsWith('/') ? '../data/content.json' : './data/content.json';
        fetch(jsonUrl + '?v=' + new Date().getTime())
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

      function renderAll() {
        if (!siteData) return;
        renderGeneralTab();
        renderPrograms();
        renderHeroTab();
        renderBatches();
        renderSchedule();
        renderRooms();
        renderTestimonials();
        renderInstagramTab();
      }

      function renderGeneralTab() {
        var g = siteData.general || {};
        document.getElementById('input-site-name').value = g.siteName || '';
        document.getElementById('input-tagline').value = g.tagline || '';
        document.getElementById('input-announcement').value = g.announcement || '';
        var logoInput = document.getElementById('input-logo-img');
        if (logoInput) logoInput.value = g.logoImage || 'images/logo.png';
        var logoPreview = document.getElementById('logo-preview-img');
        if (logoPreview) logoPreview.src = resolveAsset(g.logoImage || 'images/logo.png');

        document.getElementById('input-phone1').value = g.primaryPhone || '';
        document.getElementById('input-phone2').value = g.secondaryPhone || '';
        document.getElementById('input-whatsapp').value = g.whatsappNumber || '';
        document.getElementById('input-email').value = g.email || '';
        document.getElementById('input-instagram-url').value = g.instagramUrl || '';
        document.getElementById('input-location').value = g.location || '';
      }

      function renderPrograms() {
        var container = document.getElementById('programs-list');
        if (!container) return;
        var progs = siteData.programs || [];
        container.innerHTML = '';

        progs.forEach(function (p, index) {
          var item = document.createElement('div');
          item.className = 'item-card';
          var imgSrc = resolveAsset(p.image || 'images/ttc-featured.jpg');

          item.innerHTML =
            '<div class="item-header">' +
            '<span class="item-badge">प्रोग्राम #' + (index + 1) + ': ' + (p.title || '') + '</span>' +
            '<button type="button" class="btn btn-danger btn-sm" onclick="ONSRA_ADMIN.deleteProgram(' + index + ')">🗑 हटवा</button>' +
            '</div>' +
            '<div class="form-grid">' +
            '<div class="form-group">' +
            '<label>प्रोग्रामचे नाव (Title)</label>' +
            '<input type="text" value="' + (p.title || '') + '" oninput="ONSRA_ADMIN.updateProgram(' + index + ', \'title\', this.value)" />' +
            '</div>' +
            '<div class="form-group">' +
            '<label>टॅग / बॅज (उदा. ⭐ Most Popular, 🌸 For Women)</label>' +
            '<input type="text" value="' + (p.tag || '') + '" oninput="ONSRA_ADMIN.updateProgram(' + index + ', \'tag\', this.value)" />' +
            '</div>' +
            '<div class="form-group">' +
            '<label>कालावधी (उदा. 24 Days किंवा 3 Days)</label>' +
            '<input type="text" value="' + (p.duration || '') + '" oninput="ONSRA_ADMIN.updateProgram(' + index + ', \'duration\', this.value)" />' +
            '</div>' +
            '<div class="form-group">' +
            '<label>ठिकाण (उदा. Goa, India किंवा Beachside)</label>' +
            '<input type="text" value="' + (p.location || '') + '" oninput="ONSRA_ADMIN.updateProgram(' + index + ', \'location\', this.value)" />' +
            '</div>' +
            '<div class="form-group">' +
            '<label>प्रकार / स्टाईल (उदा. Hatha Yoga किंवा Wellness)</label>' +
            '<input type="text" value="' + (p.style || '') + '" oninput="ONSRA_ADMIN.updateProgram(' + index + ', \'style\', this.value)" />' +
            '</div>' +
            '<div class="form-group">' +
            '<label>टार्गेट लिंक (उदा. training.html किंवा retreats.html)</label>' +
            '<input type="text" value="' + (p.link || '') + '" oninput="ONSRA_ADMIN.updateProgram(' + index + ', \'link\', this.value)" />' +
            '</div>' +
            '<div class="form-group full">' +
            '<label>प्रोग्राम मुख्य फोटो पाथ (Image Path)</label>' +
            '<div style="display:flex; gap:8px;">' +
            '<input type="text" id="prog-img-input-' + index + '" value="' + (p.image || '') + '" oninput="ONSRA_ADMIN.updateProgram(' + index + ', \'image\', this.value)" />' +
            '<button type="button" class="btn btn-secondary btn-sm" onclick="ONSRA_ADMIN.pickImageFor(\'prog-img-input-' + index + '\', ' + index + ', \'program\')">🖼 निवडा</button>' +
            '</div>' +
            '</div>' +
            '<div class="form-group full">' +
            '<div class="img-picker-wrap">' +
            '<img src="' + imgSrc + '" id="prog-preview-' + index + '" class="img-preview" alt="Preview" style="height:120px;" />' +
            '<span style="font-size:0.85rem; color:var(--text-muted);">सध्याचा फोटो प्रीव्ह्यू. बदलण्यासाठी वरील "🖼 निवडा" वापरा.</span>' +
            '</div>' +
            '</div>' +
            '<div class="form-group full">' +
            '<label>संक्षिप्त माहिती (Description)</label>' +
            '<textarea oninput="ONSRA_ADMIN.updateProgram(' + index + ', \'description\', this.value)">' + (p.description || '') + '</textarea>' +
            '</div>' +
            '</div>';
          container.appendChild(item);
        });
      }

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

      function renderRooms() {
        var accInput = document.getElementById('input-acc-img');
        var accPreview = document.getElementById('acc-preview-img');
        var accImg = (siteData.accommodation && siteData.accommodation.image) ? siteData.accommodation.image : 'images/ashram-accommodation.jpg';
        if (accInput) accInput.value = accImg;
        if (accPreview) accPreview.src = resolveAsset(accImg);

        var container = document.getElementById('rooms-list');
        var rooms = siteData.rooms || [];
        container.innerHTML = '';

        rooms.forEach(function (r, index) {
          var item = document.createElement('div');
          item.className = 'item-card';
          var amenitiesStr = (r.amenities || []).join(', ');
          var imgSrc = resolveAsset(r.image || 'images/logo.png');

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
            '<img src="' + imgSrc + '" id="room-preview-' + index + '" class="img-preview" alt="Preview" />' +
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

      function renderHeroTab() {
        var h = siteData.hero || {};
        var phil = siteData.philosophy || {};
        var about = siteData.about || {};

        document.getElementById('input-hero-badge').value = h.badge || '';
        document.getElementById('input-hero-title').value = h.title || '';
        document.getElementById('input-hero-sub').value = h.subtitle || '';
        document.getElementById('input-hero-cta').value = h.ctaText || '';
        document.getElementById('input-hero-sec-cta').value = h.secondaryCtaText || '';

        var bgInput = document.getElementById('input-hero-bg');
        if (bgInput) bgInput.value = h.bgImage || 'images/hero-bg.jpg';
        var bgPreview = document.getElementById('hero-bg-preview');
        if (bgPreview) bgPreview.src = resolveAsset(h.bgImage || 'images/hero-bg.jpg');

        var q = document.getElementById('input-phil-quote');
        if (q) q.value = phil.quote || '';
        var qc = document.getElementById('input-phil-cite');
        if (qc) qc.value = phil.cite || '';
        var pt = document.getElementById('input-phil-title');
        if (pt) pt.value = phil.title || '';
        var pt1 = document.getElementById('input-phil-text1');
        if (pt1) pt1.value = phil.text1 || '';
        var pt2 = document.getElementById('input-phil-text2');
        if (pt2) pt2.value = phil.text2 || '';

        var abInput = document.getElementById('input-about-img');
        if (abInput) abInput.value = about.image || 'images/ashram-accommodation.jpg';
        var abPreview = document.getElementById('about-preview-img');
        if (abPreview) abPreview.src = resolveAsset(about.image || 'images/ashram-accommodation.jpg');
      }

      function renderInstagramTab() {
        var ig = siteData.instagram || {};
        var ig1 = document.getElementById('input-ig-1');
        if (ig1) ig1.value = ig.img1 || 'images/ig-beach-yoga.jpg';
        var p1 = document.getElementById('ig-preview-1');
        if (p1) p1.src = resolveAsset(ig.img1 || 'images/ig-beach-yoga.jpg');

        var ig2 = document.getElementById('input-ig-2');
        if (ig2) ig2.value = ig.img2 || 'images/ig-meditation.jpg';
        var p2 = document.getElementById('ig-preview-2');
        if (p2) p2.src = resolveAsset(ig.img2 || 'images/ig-meditation.jpg');

        var ig3 = document.getElementById('input-ig-3');
        if (ig3) ig3.value = ig.img3 || 'images/ig-sunset.jpg';
        var p3 = document.getElementById('ig-preview-3');
        if (p3) p3.src = resolveAsset(ig.img3 || 'images/ig-sunset.jpg');

        var ig4 = document.getElementById('input-ig-4');
        if (ig4) ig4.value = ig.img4 || 'images/ttc-beach-group.jpg';
        var p4 = document.getElementById('ig-preview-4');
        if (p4) p4.src = resolveAsset(ig.img4 || 'images/ttc-beach-group.jpg');
      }

      var galleryImagesCache = [];

      function loadGalleryImages() {
        var gallery = document.getElementById('gallery-grid');
        if (gallery) {
          gallery.innerHTML = '<div style="grid-column: 1/-1; padding: 24px; text-align: center; color: var(--text-muted);"><span class="spinner"></span> फोटो लोड होत आहेत...</div>';
        }

        if (isLocal) {
          fetch('/api/images')
            .then(function (res) { return res.json(); })
            .then(function (data) {
              if (data && data.images && data.images.length > 0) {
                var items = data.images.map(function (filename) {
                  return { name: filename, path: 'images/' + filename };
                });
                galleryImagesCache = items;
                renderGallery(items);
              } else {
                renderDefaultGallery();
              }
            })
            .catch(function () {
              renderDefaultGallery();
            });
        } else {
          var token = localStorage.getItem(GITHUB_TOKEN_KEY);
          var headers = { 'Accept': 'application/vnd.github.v3+json' };
          if (token) headers['Authorization'] = 'token ' + token;

          fetch('https://api.github.com/repos/' + GITHUB_REPO + '/contents/images?ref=' + GITHUB_BRANCH, { headers: headers })
            .then(function (res) {
              if (!res.ok) throw new Error('Status ' + res.status);
              return res.json();
            })
            .then(function (items) {
              if (Array.isArray(items) && items.length > 0) {
                var imageFiles = items
                  .filter(function (item) {
                    return item.type === 'file' && /\.(jpg|jpeg|png|webp|svg|gif)$/i.test(item.name);
                  })
                  .map(function (item) {
                    return {
                      name: item.name,
                      path: 'images/' + item.name,
                      sha: item.sha,
                      downloadUrl: item.download_url
                    };
                  });
                galleryImagesCache = imageFiles;
                renderGallery(imageFiles);
              } else {
                renderDefaultGallery();
              }
            })
            .catch(function (err) {
              console.warn('Could not load images from GitHub API, falling back to defaults:', err);
              renderDefaultGallery();
            });
        }
      }

      function renderDefaultGallery() {
        var defaults = [
          'ttc-featured.jpg', 'room-private.jpg', 'ttc-beach-group.jpg', 'ashram-about.jpg',
          'womens-retreat.jpg', 'hero-bg.jpg', 'logo.png', 'ig-beach-yoga.jpg', 'ig-meditation.jpg', 'ig-sunset.jpg'
        ];
        var items = defaults.map(function (name) {
          return { name: name, path: 'images/' + name };
        });
        galleryImagesCache = items;
        renderGallery(items);
      }

      function renderGallery(items) {
        var gallery = document.getElementById('gallery-grid');
        if (!gallery) return;
        gallery.innerHTML = '';

        if (!items || items.length === 0) {
          gallery.innerHTML = '<div style="grid-column: 1/-1; padding: 24px; text-align: center; color: var(--text-muted);">कोणतेही फोटो सापडले नाहीत.</div>';
          return;
        }

        items.forEach(function (item) {
          var filename = typeof item === 'string' ? item : item.name;
          var fullPath = typeof item === 'string' ? ('images/' + item) : item.path;
          var sha = (typeof item === 'object' && item.sha) ? item.sha : '';
          var imgSrc = resolveAsset(fullPath);

          var div = document.createElement('div');
          div.className = 'gallery-item';
          div.innerHTML =
            '<div style="width:100%; height:95px; overflow:hidden; border-radius:4px; background:#f1f5f9; display:flex; align-items:center; justify-content:center;">' +
            '<img src="' + imgSrc + '" alt="' + filename + '" loading="lazy" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null; this.src=\'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22 viewBox=%220 0 100 100%22><text x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22 fill=%22%2394a3b8%22 font-size=%2212%22>Photo</text></svg>\';" />' +
            '</div>' +
            '<span title="' + filename + '">' + filename + '</span>' +
            '<div style="display:flex; gap:4px; margin-top:auto;">' +
            '<button type="button" class="btn btn-secondary btn-sm" style="flex:1; padding:4px 2px; font-size:11px;" onclick="ONSRA_ADMIN.copyImagePath(\'' + fullPath + '\')" title="पाथ कॉपी करा">📋 कॉपी</button>' +
            '<button type="button" class="btn btn-sm" style="flex:1; padding:4px 2px; font-size:11px; background:#ef4444; color:#fff; border:none; border-radius:4px; cursor:pointer;" onclick="ONSRA_ADMIN.deleteImage(\'' + filename + '\', \'' + sha + '\')" title="हा फोटो कायमचा डिलीट करा">🗑 डिलीट</button>' +
            '</div>';
          gallery.appendChild(div);
        });
      }

      function collectFormData() {
        if (!siteData) siteData = {};

        var logoInput = document.getElementById('input-logo-img');
        var siteNameInput = document.getElementById('input-site-name');
        var taglineInput = document.getElementById('input-tagline');
        var announceInput = document.getElementById('input-announcement');
        var phone1Input = document.getElementById('input-phone1');
        var phone2Input = document.getElementById('input-phone2');
        var waInput = document.getElementById('input-whatsapp');
        var emailInput = document.getElementById('input-email');
        var igUrlInput = document.getElementById('input-instagram-url');
        var locInput = document.getElementById('input-location');

        siteData.general = {
          siteName: siteNameInput ? siteNameInput.value.trim() : (siteData.general ? siteData.general.siteName : ''),
          tagline: taglineInput ? taglineInput.value.trim() : (siteData.general ? siteData.general.tagline : ''),
          announcement: announceInput ? announceInput.value.trim() : (siteData.general ? siteData.general.announcement : ''),
          primaryPhone: phone1Input ? phone1Input.value.trim() : (siteData.general ? siteData.general.primaryPhone : ''),
          secondaryPhone: phone2Input ? phone2Input.value.trim() : (siteData.general ? siteData.general.secondaryPhone : ''),
          whatsappNumber: waInput ? waInput.value.trim() : (siteData.general ? siteData.general.whatsappNumber : ''),
          email: emailInput ? emailInput.value.trim() : (siteData.general ? siteData.general.email : ''),
          instagramUrl: igUrlInput ? igUrlInput.value.trim() : (siteData.general ? siteData.general.instagramUrl : ''),
          instagramHandle: (siteData.general && siteData.general.instagramHandle) || '@onsra_yoga__ashram_goa',
          location: locInput ? locInput.value.trim() : (siteData.general ? siteData.general.location : ''),
          logoImage: (logoInput && logoInput.value.trim()) ? logoInput.value.trim() : ((siteData.general && siteData.general.logoImage) || 'images/logo.png')
        };

        var heroBadge = document.getElementById('input-hero-badge');
        var heroTitle = document.getElementById('input-hero-title');
        var heroSub = document.getElementById('input-hero-sub');
        var heroCta = document.getElementById('input-hero-cta');
        var heroSecCta = document.getElementById('input-hero-sec-cta');
        var heroBg = document.getElementById('input-hero-bg');

        siteData.hero = {
          badge: heroBadge ? heroBadge.value.trim() : (siteData.hero ? siteData.hero.badge : ''),
          title: heroTitle ? heroTitle.value.trim() : (siteData.hero ? siteData.hero.title : ''),
          subtitle: heroSub ? heroSub.value.trim() : (siteData.hero ? siteData.hero.subtitle : ''),
          ctaText: heroCta ? heroCta.value.trim() : (siteData.hero ? siteData.hero.ctaText : ''),
          ctaLink: 'training.html',
          secondaryCtaText: heroSecCta ? heroSecCta.value.trim() : (siteData.hero ? siteData.hero.secondaryCtaText : ''),
          secondaryCtaLink: 'contact.html#booking',
          bgImage: (heroBg && heroBg.value.trim()) ? heroBg.value.trim() : ((siteData.hero && siteData.hero.bgImage) || 'images/hero-bg.jpg')
        };

        var quoteInput = document.getElementById('input-phil-quote');
        var citeInput = document.getElementById('input-phil-cite');
        var philTitleInput = document.getElementById('input-phil-title');
        var philText1Input = document.getElementById('input-phil-text1');
        var philText2Input = document.getElementById('input-phil-text2');
        if (quoteInput || citeInput || philTitleInput || philText1Input || philText2Input) {
          siteData.philosophy = {
            badge: (siteData.philosophy && siteData.philosophy.badge) || 'OUR PHILOSOPHY',
            quote: quoteInput ? quoteInput.value.trim() : '',
            cite: citeInput ? citeInput.value.trim() : '',
            title: philTitleInput ? philTitleInput.value.trim() : '',
            text1: philText1Input ? philText1Input.value.trim() : '',
            text2: philText2Input ? philText2Input.value.trim() : ''
          };
        }

        var aboutImgInput = document.getElementById('input-about-img');
        if (aboutImgInput) {
          if (!siteData.about) siteData.about = {};
          siteData.about.image = aboutImgInput.value.trim() || 'images/ashram-accommodation.jpg';
        }

        var ig1 = document.getElementById('input-ig-1');
        var ig2 = document.getElementById('input-ig-2');
        var ig3 = document.getElementById('input-ig-3');
        var ig4 = document.getElementById('input-ig-4');
        if (ig1 || ig2 || ig3 || ig4) {
          siteData.instagram = {
            img1: (ig1 && ig1.value.trim()) ? ig1.value.trim() : 'images/ig-beach-yoga.jpg',
            img2: (ig2 && ig2.value.trim()) ? ig2.value.trim() : 'images/ig-meditation.jpg',
            img3: (ig3 && ig3.value.trim()) ? ig3.value.trim() : 'images/ig-sunset.jpg',
            img4: (ig4 && ig4.value.trim()) ? ig4.value.trim() : 'images/ttc-beach-group.jpg'
          };
        }

        if (!siteData.accommodation) siteData.accommodation = {};
        var accInput = document.getElementById('input-acc-img');
        if (accInput) {
          siteData.accommodation.image = accInput.value.trim() || 'images/ashram-accommodation.jpg';
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
              saveLocally(function () {
                pushGitLocally();
              });
            } else {
              saveToGitHub();
            }
          });
        }

        var imgInput = document.getElementById('admin-image-upload');
        if (imgInput) {
          imgInput.addEventListener('change', handleImageUpload);
        }

        var dropZone = document.getElementById('upload-drop-zone');
        if (dropZone) {
          ['dragenter', 'dragover'].forEach(function (eventName) {
            dropZone.addEventListener(eventName, function (e) {
              e.preventDefault();
              e.stopPropagation();
              dropZone.style.borderColor = 'var(--primary)';
              dropZone.style.background = '#f0fdf4';
            }, false);
          });
          ['dragleave', 'drop'].forEach(function (eventName) {
            dropZone.addEventListener(eventName, function (e) {
              e.preventDefault();
              e.stopPropagation();
              dropZone.style.borderColor = 'var(--border)';
              dropZone.style.background = '#FAF8F5';
            }, false);
          });
          dropZone.addEventListener('drop', function (e) {
            var dt = e.dataTransfer;
            var files = dt.files;
            if (files && files.length > 0) {
              handleImageUpload({ target: { files: files, value: '' } });
            }
          }, false);
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

      function compressImage(file, maxWidth, maxHeight, quality, callback) {
        if (file.type === 'image/svg+xml') {
          var reader = new FileReader();
          reader.onload = function (e) { callback(e.target.result); };
          reader.readAsDataURL(file);
          return;
        }

        var reader = new FileReader();
        reader.onload = function (e) {
          var img = new Image();
          img.onload = function () {
            var width = img.width;
            var height = img.height;

            if (width > maxWidth || height > maxHeight) {
              if (width / height > maxWidth / maxHeight) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
              } else {
                width = Math.round((width * maxHeight) / height);
                height = maxHeight;
              }
            }

            var canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            var outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
            var dataUrl = canvas.toDataURL(outputType, quality || 0.85);
            callback(dataUrl);
          };
          img.onerror = function () {
            callback(e.target.result);
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      }

      function handleImageUpload(e) {
        var file = e.target.files && e.target.files[0];
        if (!file) return;

        var cleanFilename = file.name.toLowerCase().replace(/[^a-z0-9._-]/g, '_');
        showToast('फोटो तयार करत आहे: ' + cleanFilename + '...', 'info');

        compressImage(file, 1920, 1920, 0.85, function (base64Data) {
          if (isLocal) {
            showToast('स्थानिक सर्व्हरवर अपलोड करत आहे...', 'info');
            fetch('/api/upload-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ filename: cleanFilename, base64: base64Data })
            })
              .then(function (res) { return res.json(); })
              .then(function (resData) {
                if (resData.success) {
                  showToast('फोटो यशस्वीरीत्या अपलोड झाला: ' + resData.path + ' 🎉', 'success');
                  loadGalleryImages();
                  if (e.target) e.target.value = '';
                } else {
                  showToast('फोटो अपलोड त्रुटी: ' + (resData.error || 'Unknown'), 'error');
                }
              })
              .catch(function (err) {
                showToast('फोटो अपलोड सर्व्हर त्रुटी: ' + err.message, 'error');
              });
          } else {
            var token = localStorage.getItem(GITHUB_TOKEN_KEY);
            if (!token) {
              showToast('फोटो अपलोड करण्यासाठी GitHub टोकन आवश्यक आहे!', 'error');
              if (tokenModal) tokenModal.classList.add('open');
              return;
            }

            var rawBase64 = base64Data.split(',')[1];
            var fileUrl = 'https://api.github.com/repos/' + GITHUB_REPO + '/contents/images/' + cleanFilename;
            var headers = {
              'Accept': 'application/vnd.github.v3+json',
              'Authorization': 'token ' + token
            };

            showToast('GitHub वर फाईल तपासत आहे...', 'info');

            // Check if file exists to supply existing sha
            fetch(fileUrl + '?ref=' + GITHUB_BRANCH, { headers: headers })
              .then(function (res) {
                if (res.ok) {
                  return res.json().then(function (info) { return info.sha; });
                }
                return null;
              })
              .catch(function () { return null; })
              .then(function (existingSha) {
                showToast('GitHub वर फोटो अपलोड करत आहे: ' + cleanFilename, 'info');
                var payload = {
                  message: 'Upload ' + cleanFilename + ' via ONSRA Web Admin',
                  content: rawBase64,
                  branch: GITHUB_BRANCH
                };
                if (existingSha) {
                  payload.sha = existingSha;
                }

                return fetch(fileUrl, {
                  method: 'PUT',
                  headers: headers,
                  body: JSON.stringify(payload)
                });
              })
              .then(function (res) {
                if (!res.ok) {
                  return res.json().then(function (errData) {
                    throw new Error(errData.message || ('GitHub API Error ' + res.status));
                  });
                }
                return res.json();
              })
              .then(function () {
                showToast('फोटो GitHub वर यशस्वीरीत्या अपलोड झाला: images/' + cleanFilename + ' 🚀', 'success');
                loadGalleryImages();
                if (e.target) e.target.value = '';
              })
              .catch(function (err) {
                showToast('फोटो अपलोड त्रुटी: ' + err.message, 'error');
              });
          }
        });
      }

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

      window.ONSRA_ADMIN = {
        updateProgram: function (index, field, val) {
          if (siteData && siteData.programs && siteData.programs[index]) {
            siteData.programs[index][field] = val;
            if (field === 'image') {
              var preview = document.getElementById('prog-preview-' + index);
              if (preview) preview.src = resolveAsset(val);
            }
          }
        },
        deleteProgram: function (index) {
          if (confirm('हा प्रोग्राम खरोखर हटवायचा आहे का?')) {
            siteData.programs.splice(index, 1);
            renderPrograms();
          }
        },
        addProgram: function () {
          if (!siteData.programs) siteData.programs = [];
          siteData.programs.push({
            id: 'prog-' + Date.now(),
            tag: '✨ NEW',
            title: 'New Program / Retreat',
            duration: '7 Days',
            location: 'Goa, India',
            style: 'Hatha Yoga',
            description: 'Experience an authentic yoga journey with our experienced teachers.',
            image: 'images/ashram-accommodation.jpg',
            priceLabel: 'Starting from',
            priceAmount: '€650',
            link: 'contact.html#booking'
          });
          renderPrograms();
        },

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

        updateRoom: function (index, field, val) {
          if (siteData && siteData.rooms && siteData.rooms[index]) {
            siteData.rooms[index][field] = val;
            if (field === 'image') {
              var preview = document.getElementById('room-preview-' + index);
              if (preview) preview.src = resolveAsset(val);
            }
          }
        },
        updateRoomAmenities: function (index, val) {
          if (siteData && siteData.rooms && siteData.rooms[index]) {
            siteData.rooms[index].amenities = val.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
          }
        },

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

        pickImageFor: function (inputId, index, type) {
          var input = document.getElementById(inputId);
          var currentVal = input ? input.value : 'images/';
          var path = prompt('फोटोचा पाथ टाका (उदा. images/room-private.jpg किंवा गॅलरीमधून कॉपी केलेली लिंक):', currentVal || 'images/');
          if (path) {
            path = path.trim();
            if (input) input.value = path;
            if (type === 'room') {
              this.updateRoom(index, 'image', path);
            } else if (type === 'program') {
              this.updateProgram(index, 'image', path);
            } else if (type === 'logo') {
              var logoPreview = document.getElementById('logo-preview-img');
              if (logoPreview) logoPreview.src = resolveAsset(path);
              if (!siteData.general) siteData.general = {};
              siteData.general.logoImage = path;
            } else if (type === 'hero-bg') {
              var heroPreview = document.getElementById('hero-bg-preview');
              if (heroPreview) heroPreview.src = resolveAsset(path);
              if (!siteData.hero) siteData.hero = {};
              siteData.hero.bgImage = path;
            } else if (type === 'about') {
              var aboutPreview = document.getElementById('about-preview-img');
              if (aboutPreview) aboutPreview.src = resolveAsset(path);
              if (!siteData.about) siteData.about = {};
              siteData.about.image = path;
            } else if (type === 'acc') {
              var accPreview = document.getElementById('acc-preview-img');
              if (accPreview) accPreview.src = resolveAsset(path);
              if (!siteData.accommodation) siteData.accommodation = {};
              siteData.accommodation.image = path;
            } else if (type === 'ig') {
              var igPreview = document.getElementById('ig-preview-' + index);
              if (igPreview) igPreview.src = resolveAsset(path);
              if (!siteData.instagram) siteData.instagram = {};
              siteData.instagram['img' + index] = path;
            }
          }
        },
        copyImagePath: function (path) {
          navigator.clipboard.writeText(path).then(function () {
            showToast('फोटो पाथ कॉपी झाला: ' + path, 'success');
          });
        },
        refreshGallery: function () {
          loadGalleryImages();
        },
        deleteImage: function (filename, sha) {
          if (!confirm('तुम्हाला खरोखर "' + filename + '" हा फोटो डिलीट करायचा आहे का?\n\nहा फोटो गॅलरीमधून व वेबसाईटवरून कायमचा काढला जाईल.')) {
            return;
          }

          showToast('फोटो डिलीट करत आहे: ' + filename + '...', 'info');

          if (isLocal) {
            fetch('/api/delete-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ filename: filename })
            })
              .then(function (res) { return res.json(); })
              .then(function (resData) {
                if (resData.success) {
                  showToast('फोटो यशस्वीरीत्या डिलीट झाला: ' + filename + ' 🗑', 'success');
                  loadGalleryImages();
                } else {
                  showToast('फोटो डिलीट करताना त्रुटी: ' + (resData.error || 'Unknown'), 'error');
                }
              })
              .catch(function (err) {
                showToast('सर्व्हर त्रुटी: ' + err.message, 'error');
              });
          } else {
            var token = localStorage.getItem(GITHUB_TOKEN_KEY);
            if (!token) {
              showToast('फोटो डिलीट करण्यासाठी GitHub टोकन आवश्यक आहे!', 'error');
              if (tokenModal) tokenModal.classList.add('open');
              return;
            }

            var headers = {
              'Accept': 'application/vnd.github.v3+json',
              'Authorization': 'token ' + token
            };
            var fileUrl = 'https://api.github.com/repos/' + GITHUB_REPO + '/contents/images/' + filename;

            var getShaPromise = sha ? Promise.resolve(sha) : fetch(fileUrl + '?ref=' + GITHUB_BRANCH, { headers: headers })
              .then(function (res) {
                if (!res.ok) throw new Error('फाईल माहिती मिळाली नाही (' + res.status + ')');
                return res.json();
              })
              .then(function (data) { return data.sha; });

            getShaPromise
              .then(function (fileSha) {
                return fetch(fileUrl, {
                  method: 'DELETE',
                  headers: headers,
                  body: JSON.stringify({
                    message: 'Delete ' + filename + ' via ONSRA Web Admin',
                    sha: fileSha,
                    branch: GITHUB_BRANCH
                  })
                });
              })
              .then(function (res) {
                if (!res.ok) {
                  return res.json().then(function (errData) {
                    throw new Error(errData.message || ('GitHub API Error ' + res.status));
                  });
                }
                return res.json();
              })
              .then(function () {
                showToast('फोटो GitHub वरून यशस्वीरीत्या डिलीट झाला: ' + filename + ' 🗑', 'success');
                loadGalleryImages();
              })
              .catch(function (err) {
                showToast('फोटो डिलीट करताना त्रुटी: ' + err.message, 'error');
              });
          }
        }
      };

    })();