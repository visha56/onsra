/**
 * ONSRA Yoga Ashram - Dynamic Content Loader
 * Hydrates live content from data/content.json across all pages
 */
(function () {
  'use strict';

  function fetchContent() {
    // Append timestamp to prevent aggressive browser caching
    var url = 'data/content.json?v=' + new Date().getTime();
    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('Status ' + res.status);
        return res.json();
      })
      .then(function (data) {
        if (!data) return;
        hydrateGeneral(data.general);
        hydrateHero(data.hero);
        hydratePhilosophy(data.philosophy);
        hydratePrograms(data.programs);
        hydrateBatches(data.batches);
        hydrateSchedule(data.schedule);
        hydrateRooms(data.rooms);
        hydrateAccommodation(data.accommodation);
        hydrateAbout(data.about);
        hydrateInstagram(data.instagram);
        hydrateTestimonials(data.testimonials);
      })
      .catch(function (err) {
        // Fallback silently to existing static HTML
        console.debug('ONSRA Content Loader: Using static fallback.', err);
      });
  }

  function hydrateGeneral(gen) {
    if (!gen) return;

    // Update announcement bar if present
    var annBars = document.querySelectorAll('.announcement-bar');
    annBars.forEach(function (bar) {
      if (gen.announcement) {
        bar.innerHTML = gen.announcement;
      }
    });

    // Update Logo if present
    if (gen.logoImage) {
      document.querySelectorAll('.logo-img, .footer-logo img').forEach(function (img) {
        img.src = gen.logoImage;
      });
    }

    // Update Phone links & texts
    if (gen.primaryPhone) {
      document.querySelectorAll('a[href^="tel:"]').forEach(function (a) {
        if (a.getAttribute('data-cms-ignore') === 'true') return;
        if (a.href.indexOf('9850250033') !== -1 || a.classList.contains('primary-phone')) {
          a.href = 'tel:' + gen.primaryPhone.replace(/\s+/g, '');
          if (a.textContent.trim().startsWith('+91')) {
            a.textContent = gen.primaryPhone;
          }
        }
      });
    }

    // Update WhatsApp links
    if (gen.whatsappNumber) {
      document.querySelectorAll('a[href*="wa.me"]').forEach(function (a) {
        var cleanNum = gen.whatsappNumber.replace(/[^0-9]/g, '');
        var currentHref = a.getAttribute('href');
        var parts = currentHref.split('?');
        var query = parts.length > 1 ? '?' + parts[1] : '';
        a.href = 'https://wa.me/' + cleanNum + query;
      });
    }

    // Update Instagram links
    if (gen.instagramUrl) {
      document.querySelectorAll('a[href*="instagram.com"]').forEach(function (a) {
        a.href = gen.instagramUrl;
      });
    }
  }

  function hydrateHero(hero) {
    if (!hero) return;
    var heroEl = document.querySelector('.hero');
    if (heroEl && hero.bgImage) {
      heroEl.style.backgroundImage = "url('" + hero.bgImage + "')";
    }
    var heroBadge = document.querySelector('.hero-badge');
    if (heroBadge && hero.badge) heroBadge.innerHTML = hero.badge;
    var heroTitle = document.querySelector('.hero-content h1');
    var heroSub = document.querySelector('.hero-content p');
    if (heroTitle && hero.title) heroTitle.innerHTML = hero.title;
    if (heroSub && hero.subtitle) heroSub.innerHTML = hero.subtitle;
  }

  function hydratePhilosophy(phil) {
    if (!phil) return;
    var quote = document.querySelector('.intro-quote blockquote');
    if (quote && phil.quote) quote.innerHTML = '"' + phil.quote.replace(/^"|"$/g, '') + '"';
    var cite = document.querySelector('.intro-quote cite');
    if (cite && phil.cite) cite.innerHTML = phil.cite;
    var title = document.querySelector('.intro-story h2');
    if (title && phil.title) title.innerHTML = phil.title;
    var paragraphs = document.querySelectorAll('.intro-story p');
    if (paragraphs.length >= 2) {
      if (phil.text1) paragraphs[0].innerHTML = phil.text1;
      if (phil.text2) paragraphs[1].innerHTML = phil.text2;
    }
  }

  function hydratePrograms(programs) {
    if (!programs || !Array.isArray(programs) || programs.length === 0) return;

    var container = document.querySelector('.programs-grid');
    if (container) {
      var html = programs.map(function (p) {
        var tagBg = p.id === 'retreat-womens' ? 'var(--earth)' : (p.id === 'ashram-stay' ? 'var(--forest)' : 'var(--primary)');
        var tagStyle = 'background: ' + (p.tagBg || tagBg) + ';';

        return '<div class="program-card revealed" style="opacity:1 !important; transform:none !important;">' +
          '<div class="program-card-img">' +
          '<img src="' + p.image + '" alt="' + p.title + '" loading="lazy" />' +
          (p.tag ? '<span class="program-tag" style="' + tagStyle + '">' + p.tag + '</span>' : '') +
          '</div>' +
          '<div class="program-card-body">' +
          '<h3>' + p.title + '</h3>' +
          '<div class="program-meta">' +
          (p.duration ? '<span class="program-meta-item">🗓 ' + p.duration.replace(/^🗓\s*/, '') + '</span>' : '') +
          (p.location ? '<span class="program-meta-item">📍 ' + p.location.replace(/^[📍🌊🏡]\s*/, '') + '</span>' : '') +
          (p.style ? '<span class="program-meta-item">🧘 ' + p.style.replace(/^[🧘💆🌱]\s*/, '') + '</span>' : '') +
          '</div>' +
          '<p>' + p.description + '</p>' +
          '<div class="program-price">' +
          '<div>' +
          '<div class="price-label">' + (p.priceLabel || 'Holistic Experience') + '</div>' +
          '<div class="price-amount">' + (p.priceAmount || 'Inquire Now') + '</div>' +
          '</div>' +
          '<a href="' + (p.link || 'contact.html#booking') + '" class="btn btn-earth btn-sm">Learn More →</a>' +
          '</div>' +
          '</div>' +
          '</div>';
      }).join('');
      container.innerHTML = html;
    }
  }

  function hydrateBatches(batches) {
    if (!batches || !Array.isArray(batches) || batches.length === 0) return;

    var batchContainer = document.querySelector('#batches [style*="display:flex; flex-direction:column"]');
    if (batchContainer) {
      var html = batches.map(function (b) {
        var statusBadge = b.statusClass === 'status-filling'
          ? '<span class="batch-status status-filling">⚡ ' + b.status + '</span>'
          : '<span class="batch-status status-open">✔ ' + b.status + '</span>';

        return '<div class="batch-card">' +
          '<div class="batch-info">' +
          '<h4>' + b.name + '</h4>' +
          '<p>📅 ' + b.dates + ' &nbsp;|&nbsp; 📍 ' + b.location + ' &nbsp;|&nbsp; 🧘 ' + b.style + '</p>' +
          '</div>' +
          '<div style="display:flex; align-items:center; gap:16px; flex-wrap:wrap;">' +
          statusBadge +
          '<a href="contact.html#booking" class="btn btn-primary btn-sm">Apply Now</a>' +
          '</div>' +
          '</div>';
      }).join('');
      batchContainer.innerHTML = html;
    }
  }

  function hydrateSchedule(schedule) {
    if (!schedule || !Array.isArray(schedule) || schedule.length === 0) return;

    var tbody = document.querySelector('.schedule-table tbody');
    if (tbody) {
      var html = schedule.map(function (item) {
        var icon = item.icon ? item.icon + ' ' : '';
        return '<tr>' +
          '<td class="time-cell">' + item.time + '</td>' +
          '<td>' + icon + item.activity + '</td>' +
          '</tr>';
      }).join('');
      tbody.innerHTML = html;
    }
  }

  function hydrateRooms(rooms) {
    if (!rooms || !Array.isArray(rooms) || rooms.length === 0) return;

    var roomContainer = document.querySelector('.grid-3[style*="margin-top:40px"]') ||
      (document.querySelector('.room-card') ? document.querySelector('.room-card').parentElement : null);
    if (roomContainer) {
      var html = rooms.map(function (r) {
        var amenitiesHtml = (r.amenities || []).map(function (am) {
          return '<span class="amenity-tag">' + am + '</span>';
        }).join('');

        return '<div class="room-card revealed" style="opacity:1 !important; transform:none !important;">' +
          '<div class="room-img"><img src="' + r.image + '" alt="' + (r.alt || r.title) + '" /></div>' +
          '<div class="room-body">' +
          '<h3>' + r.title + '</h3>' +
          '<p>' + r.description + '</p>' +
          '<div class="room-amenities">' + amenitiesHtml + '</div>' +
          '<a href="' + (r.inquireLink || 'contact.html#booking') + '" class="btn btn-ghost btn-sm">Inquire</a>' +
          '</div>' +
          '</div>';
      }).join('');
      roomContainer.innerHTML = html;
    }
  }

  function hydrateAccommodation(acc) {
    if (!acc || !acc.image) return;
    var accImg = document.querySelector('img[alt="ONSRA Yoga Ashram accommodation Goa"]');
    if (accImg) {
      accImg.src = acc.image;
    }
  }

  function hydrateAbout(about) {
    if (!about || !about.image) return;
    var aboutImg = document.querySelector('img[alt="ONSRA Yoga Ashram Garden Goa"]');
    if (aboutImg) {
      aboutImg.src = about.image;
    }
  }

  function hydrateInstagram(ig) {
    if (!ig) return;
    var instaImgs = document.querySelectorAll('.instagram-grid img, .insta-item img');
    if (instaImgs && instaImgs.length >= 4) {
      if (ig.img1) instaImgs[0].src = ig.img1;
      if (ig.img2) instaImgs[1].src = ig.img2;
      if (ig.img3) instaImgs[2].src = ig.img3;
      if (ig.img4) instaImgs[3].src = ig.img4;
    }
  }

  function hydrateTestimonials(testimonials) {
    if (!testimonials || !Array.isArray(testimonials) || testimonials.length === 0) return;

    var track = document.querySelector('.testimonial-track');
    if (track) {
      var html = testimonials.map(function (t) {
        var stars = '★'.repeat(t.rating || 5);
        var starSpans = stars.split('').map(function (s) { return '<span>' + s + '</span>'; }).join('');
        var avatar = t.avatar || (t.name ? t.name.charAt(0).toUpperCase() : 'Y');

        return '<div class="testimonial-slide">' +
          '<div class="testimonial-card">' +
          '<div class="testimonial-stars">' + starSpans + '</div>' +
          '<p class="testimonial-text">"' + t.text + '"</p>' +
          '<div class="testimonial-author">' +
          '<div class="author-avatar">' + avatar + '</div>' +
          '<div class="author-info">' +
          '<strong>' + t.name + '</strong>' +
          '<span>' + t.location + '</span>' +
          '</div>' +
          '</div>' +
          '</div>' +
          '</div>';
      }).join('');
      track.innerHTML = html;
    }
  }

  // Run on DOMContentLoaded or immediately if already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fetchContent);
  } else {
    fetchContent();
  }
})();
