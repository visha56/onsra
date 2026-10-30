/* ============================================================
   ONSRA YOGA ASHRAM — Main JavaScript
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ============================================================
  // 1. STICKY HEADER
  // ============================================================
  const header = document.querySelector('.site-header');
  const scrollThreshold = 60;

  function handleHeaderScroll() {
    if (window.scrollY > scrollThreshold) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleHeaderScroll, { passive: true });
  handleHeaderScroll();


  // ============================================================
  // 2. MOBILE MENU
  // ============================================================
  const hamburger   = document.querySelector('.hamburger');
  const mobileNav   = document.querySelector('.mobile-nav');
  const mobileLinks = mobileNav?.querySelectorAll('a');

  hamburger?.addEventListener('click', () => {
    const isOpen = hamburger.classList.toggle('open');
    mobileNav?.classList.toggle('open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  mobileLinks?.forEach(link => {
    link.addEventListener('click', () => {
      hamburger?.classList.remove('open');
      mobileNav?.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // Close mobile nav on outside click
  document.addEventListener('click', (e) => {
    if (mobileNav?.classList.contains('open') &&
        !mobileNav.contains(e.target) &&
        !hamburger?.contains(e.target)) {
      hamburger?.classList.remove('open');
      mobileNav?.classList.remove('open');
      document.body.style.overflow = '';
    }
  });


  // ============================================================
  // 3. ACTIVE NAV LINK (based on current page)
  // ============================================================
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link, .mobile-nav a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });


  // ============================================================
  // 4. SCROLL REVEAL ANIMATIONS (IntersectionObserver)
  // ============================================================
  const revealElements = document.querySelectorAll('[data-reveal]');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));


  // ============================================================
  // 5. TESTIMONIALS CAROUSEL
  // ============================================================
  const carouselTrack = document.querySelector('.testimonial-track');
  const slides        = document.querySelectorAll('.testimonial-slide');
  const dotsContainer = document.querySelector('.carousel-dots');
  const prevBtn       = document.querySelector('.carousel-prev');
  const nextBtn       = document.querySelector('.carousel-next');

  if (carouselTrack && slides.length > 0) {
    let current  = 0;
    let autoPlay = null;
    const total  = slides.length;

    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', `Go to testimonial ${i + 1}`);
      dot.addEventListener('click', () => goToSlide(i));
      dotsContainer?.appendChild(dot);
    });

    function goToSlide(index) {
      current = (index + total) % total;
      carouselTrack.style.transform = `translateX(-${current * 100}%)`;
      document.querySelectorAll('.carousel-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === current);
      });
    }

    function nextSlide() { goToSlide(current + 1); }
    function prevSlide() { goToSlide(current - 1); }

    prevBtn?.addEventListener('click', () => { clearInterval(autoPlay); prevSlide(); startAutoPlay(); });
    nextBtn?.addEventListener('click', () => { clearInterval(autoPlay); nextSlide(); startAutoPlay(); });

    let startX = 0;
    carouselTrack.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    carouselTrack.addEventListener('touchend',   e => {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) { diff > 0 ? nextSlide() : prevSlide(); }
    });

    function startAutoPlay() {
      autoPlay = setInterval(nextSlide, 5000);
    }

    startAutoPlay();

    carouselTrack.addEventListener('mouseenter', () => clearInterval(autoPlay));
    carouselTrack.addEventListener('mouseleave', () => startAutoPlay());
  }


  // ============================================================
  // 6. STATS COUNTER ANIMATION
  // ============================================================
  const statNumbers = document.querySelectorAll('.stat-number[data-count]');

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el     = entry.target;
        const target = parseInt(el.dataset.count, 10);
        const suffix = el.dataset.suffix || '';
        const prefix = el.dataset.prefix || '';
        const duration = 2000;
        const step     = duration / target;
        let   current  = 0;

        const timer = setInterval(() => {
          current++;
          el.innerHTML = `${prefix}${current}${suffix ? `<span class="suffix">${suffix}</span>` : ''}`;
          if (current >= target) clearInterval(timer);
        }, Math.max(step, 20));

        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  statNumbers.forEach(el => counterObserver.observe(el));


  // ============================================================
  // 7. SCROLL TO TOP BUTTON
  // ============================================================
  const scrollTopBtn = document.querySelector('.scroll-top');

  window.addEventListener('scroll', () => {
    scrollTopBtn?.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  scrollTopBtn?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });


  // ============================================================
  // 8. SMOOTH SCROLL FOR ANCHOR LINKS
  // ============================================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const offset = header ? header.offsetHeight + 16 : 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });


  // ============================================================
  // 9. CONTACT / BOOKING FORM HANDLER
  // ============================================================
  const bookingForm = document.getElementById('booking-form');

  bookingForm?.addEventListener('submit', (e) => {
    e.preventDefault();

    const name    = document.getElementById('f-name')?.value    || '';
    const email   = document.getElementById('f-email')?.value   || '';
    const phone   = document.getElementById('f-phone')?.value   || '';
    const program = document.getElementById('f-program')?.value || '';
    const date    = document.getElementById('f-date')?.value    || '';
    const message = document.getElementById('f-message')?.value || '';

    const subject = `Booking Inquiry — ${program} — ONSRA Yoga Ashram`;
    const body    = [
      `Name: ${name}`,
      `Email: ${email}`,
      `WhatsApp/Phone: ${phone}`,
      `Program of Interest: ${program}`,
      `Expected Start Date: ${date}`,
      `Message: ${message}`
    ].join('%0A');

    window.location.href = `mailto:info@onsrayoga.com?subject=${encodeURIComponent(subject)}&body=${body}`;

    showFormSuccess(bookingForm);
  });

  function showFormSuccess(form) {
    const success = document.createElement('div');
    success.className = 'form-success';
    success.innerHTML = `
      <div style="text-align:center; padding:24px; background: rgba(45,74,62,0.1); border-radius:12px; border:1px solid var(--border);">
        <div style="font-size:2.5rem; margin-bottom:12px;">🙏</div>
        <h4 style="color:var(--forest);margin-bottom:8px;">Namaste! Your inquiry has been sent.</h4>
        <p style="font-size:0.9rem;color:var(--light-gray);">We'll respond within 24 hours. You can also WhatsApp us directly.</p>
      </div>`;
    form.style.display = 'none';
    form.parentNode.insertBefore(success, form.nextSibling);
  }


  // ============================================================
  // 10. HERO PARALLAX (subtle)
  // ============================================================
  const heroBg = document.querySelector('.hero-bg');
  if (heroBg) {
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      if (scrollY < window.innerHeight) {
        heroBg.style.transform = `scale(1.05) translateY(${scrollY * 0.25}px)`;
      }
    }, { passive: true });
  }


  // ============================================================
  // 11. NEWSLETTER FORM
  // ============================================================
  const newsletterForm = document.querySelector('.newsletter-form');
  newsletterForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = newsletterForm.querySelector('input[type="email"]');
    if (input?.value) {
      input.value = '';
      const btn = newsletterForm.querySelector('button');
      if (btn) {
        const original = btn.textContent;
        btn.textContent = '🙏 Subscribed!';
        setTimeout(() => btn.textContent = original, 3000);
      }
    }
  });


  // ============================================================
  // 12. AVAILABILITY STRIP CLOSE
  // ============================================================
  const availStrip = document.querySelector('.availability-strip');
  const closeBtn   = availStrip?.querySelector('.strip-close');
  closeBtn?.addEventListener('click', () => {
    availStrip.style.display = 'none';
  });


  // ============================================================
  // 13. IMAGE LAZY LOAD (native + fallback)
  // ============================================================
  document.querySelectorAll('img[data-src]').forEach(img => {
    img.setAttribute('loading', 'lazy');
    img.src = img.dataset.src;
  });


  // ============================================================
  // 14. FAQ ACCORDION (for training page)
  // ============================================================
  document.querySelectorAll('.faq-item').forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer   = item.querySelector('.faq-answer');
    question?.addEventListener('click', () => {
      const isOpen = item.classList.toggle('open');
      if (answer) {
        answer.style.maxHeight = isOpen ? answer.scrollHeight + 'px' : '0';
      }
      document.querySelectorAll('.faq-item').forEach(other => {
        if (other !== item) {
          other.classList.remove('open');
          const otherAns = other.querySelector('.faq-answer');
          if (otherAns) otherAns.style.maxHeight = '0';
        }
      });
    });
  });


  // ============================================================
  // 15. INSTAGRAM TABS & REELS SCROLLER
  // ============================================================
  const instaTabs = document.querySelectorAll('.insta-tab');
  const reelsView = document.getElementById('insta-reels-view');
  const photosView = document.getElementById('insta-photos-view');
  const reelsScroller = document.querySelector('.reels-scroller');
  const reelsPrevBtn = document.querySelector('.reels-btn-prev');
  const reelsNextBtn = document.querySelector('.reels-btn-next');

  instaTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      instaTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.target;
      if (target === 'reels') {
        if (reelsView) reelsView.style.display = 'block';
        if (photosView) photosView.style.display = 'none';
      } else {
        if (reelsView) reelsView.style.display = 'none';
        if (photosView) photosView.style.display = 'grid';
      }
    });
  });

  if (reelsScroller) {
    reelsPrevBtn?.addEventListener('click', () => {
      reelsScroller.scrollBy({ left: -280, behavior: 'smooth' });
    });
    reelsNextBtn?.addEventListener('click', () => {
      reelsScroller.scrollBy({ left: 280, behavior: 'smooth' });
    });
  }


  // ============================================================
  // 16. COOKIE CONSENT BANNER (Bottom-Left)
  // ============================================================
  const cookieBanner = document.getElementById('cookie-consent-banner');
  const acceptBtn    = document.getElementById('cookie-accept-btn');
  const rejectBtn    = document.getElementById('cookie-reject-btn');

  if (cookieBanner) {
    const consent = localStorage.getItem('onsra_cookie_consent');
    if (!consent) {
      setTimeout(() => {
        cookieBanner.classList.add('show');
      }, 700);
    }

    acceptBtn?.addEventListener('click', () => {
      localStorage.setItem('onsra_cookie_consent', 'accepted');
      cookieBanner.classList.remove('show');
    });

    rejectBtn?.addEventListener('click', () => {
      localStorage.setItem('onsra_cookie_consent', 'rejected');
      cookieBanner.classList.remove('show');
    });
  }

});
