// script.js
// Masonry gallery + lightbox + filters + theme toggle (saved to localStorage)

(() => {
  const gallery = document.getElementById('gallery');
  const items = Array.from(gallery.querySelectorAll('.gallery-item'));
  const lightbox = document.getElementById('lightbox');
  const lbImage = lightbox.querySelector('.lightbox-image');
  const lbCaption = lightbox.querySelector('.lightbox-caption');
  const lbIndexIndicator = lightbox.querySelector('.index-indicator');
  const btnPrev = lightbox.querySelector('.nav.prev');
  const btnNext = lightbox.querySelector('.nav.next');
  const btnClose = lightbox.querySelector('.lightbox-close');
  const filterBtns = Array.from(document.querySelectorAll('.filter-btn'));
  const filterToggles = Array.from(document.querySelectorAll('.filter-toggle'));
  const live = document.getElementById('a11y-live');

  const themeToggle = document.getElementById('theme-toggle');
  const body = document.body;

  let currentIndex = 0;
  let visibleIndexes = items.map((_, i) => i);
  let activeFilter = 'all';
  let activeImgFilter = 'none';

  /* -----------------------
     THEME: init & toggle
     ----------------------- */
  function initTheme() {
    const saved = localStorage.getItem('site-theme');
    if (saved) {
      applyTheme(saved);
    } else {
      // prefer user's OS setting
      const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
      applyTheme(prefersLight ? 'light' : 'dark');
    }
  }

  function applyTheme(name) {
    if (name === 'light') {
      body.classList.remove('dark-theme');
      body.classList.add('light-theme');
      body.classList.remove('dark-theme'); // redundant safe
      themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
      themeToggle.setAttribute('aria-label', 'Switch to dark theme');
    } else {
      body.classList.remove('light-theme');
      body.classList.add('dark-theme');
      themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
      themeToggle.setAttribute('aria-label', 'Switch to light theme');
    }
    localStorage.setItem('site-theme', name);
  }

  themeToggle.addEventListener('click', () => {
    const isLight = body.classList.contains('light-theme');
    applyTheme(isLight ? 'dark' : 'light');
  });

  /* -----------------------
     FILTERS & VISIBLE INDEXES
     ----------------------- */
  function refreshVisibleIndexes() {
    if (activeFilter === 'all') {
      visibleIndexes = items.map((_, i) => i);
    } else {
      visibleIndexes = items
        .map((it, i) => ({ it, i }))
        .filter(({ it }) => it.dataset.category === activeFilter)
        .map(({ i }) => i);
    }
  }

  function applyCategoryFilter(cat) {
    activeFilter = cat;
    filterBtns.forEach(b => b.classList.toggle('active', b.dataset.filter === cat));
    items.forEach((it) => {
      const matches = cat === 'all' || it.dataset.category === cat;
      it.style.display = matches ? 'inline-block' : 'none';
    });
    refreshVisibleIndexes();
    if (lightbox.classList.contains('open')) {
      if (!visibleIndexes.includes(currentIndex)) {
        if (visibleIndexes.length) {
          currentIndex = visibleIndexes[0];
          showImage(currentIndex);
        } else {
          closeLightbox();
        }
      } else {
        showImage(currentIndex);
      }
    }
  }

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => applyCategoryFilter(btn.dataset.filter || 'all'));
  });

  /* -----------------------
     LIGHTBOX show/close/navigate
     ----------------------- */
  function openLightbox(index) {
    currentIndex = index;
    showImage(currentIndex);
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    btnClose.focus();
    announce(`Opened image ${currentIndex + 1}`);
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    lbImage.className = 'lightbox-image';
    activeImgFilter = 'none';
    announce('Closed preview');
  }

  function showImage(index) {
    refreshVisibleIndexes();
    if (!visibleIndexes.includes(index)) {
      index = visibleIndexes.length ? visibleIndexes[0] : index;
      currentIndex = index;
    }

    const fig = items[index];
    const imgEl = fig.querySelector('img');
    const src = imgEl.getAttribute('src');
    const alt = imgEl.getAttribute('alt') || '';
    const captionText = fig.querySelector('.caption')?.textContent?.trim() || alt;

    lbImage.src = src;
    lbImage.alt = alt;
    lbCaption.textContent = captionText;

    const posInVisible = visibleIndexes.indexOf(index);
    const totalVisible = visibleIndexes.length || 1;
    lbIndexIndicator.textContent = `${posInVisible + 1} / ${totalVisible}`;

    applyImgFilter(activeImgFilter);
    announce(`Showing ${captionText}. Image ${posInVisible + 1} of ${totalVisible}.`);
  }

  function nextImage() {
    refreshVisibleIndexes();
    const pos = visibleIndexes.indexOf(currentIndex);
    if (pos === -1) currentIndex = visibleIndexes[0] || currentIndex;
    else currentIndex = visibleIndexes[(pos + 1) % visibleIndexes.length];
    showImage(currentIndex);
  }
  function prevImage() {
    refreshVisibleIndexes();
    const pos = visibleIndexes.indexOf(currentIndex);
    if (pos === -1) currentIndex = visibleIndexes[0] || currentIndex;
    else currentIndex = visibleIndexes[(pos - 1 + visibleIndexes.length) % visibleIndexes.length];
    showImage(currentIndex);
  }

  /* -----------------------
     Image filter (lightbox)
     ----------------------- */
  function applyImgFilter(filterName) {
    lbImage.classList.remove('img-filter-grayscale', 'img-filter-sepia', 'img-filter-blur', 'img-filter-high-contrast');
    activeImgFilter = filterName || 'none';
    switch (filterName) {
      case 'grayscale': lbImage.classList.add('img-filter-grayscale'); break;
      case 'sepia': lbImage.classList.add('img-filter-sepia'); break;
      case 'blur': lbImage.classList.add('img-filter-blur'); break;
      case 'high-contrast': lbImage.classList.add('img-filter-high-contrast'); break;
      default: break;
    }
    filterToggles.forEach(t => t.classList.toggle('active', t.dataset.filter === filterName));
    announce(filterName === 'none' ? 'Normal filter' : `${filterName} filter applied`);
  }

  filterToggles.forEach(t => {
    t.addEventListener('click', () => applyImgFilter(t.dataset.filter || 'none'));
  });

  /* -----------------------
     Events: attach to items
     ----------------------- */
  items.forEach((it, idx) => {
    const openHandler = (ev) => {
      ev.preventDefault();
      openLightbox(idx);
    };
    it.addEventListener('click', openHandler);
    it.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openHandler(e); }
    });
  });

  btnNext.addEventListener('click', (e) => { e.stopPropagation(); nextImage(); });
  btnPrev.addEventListener('click', (e) => { e.stopPropagation(); prevImage(); });
  btnClose.addEventListener('click', (e) => { e.stopPropagation(); closeLightbox(); });

  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  lbImage.addEventListener('click', (e) => { e.stopPropagation(); nextImage(); });

  window.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowRight') nextImage();
    else if (e.key === 'ArrowLeft') prevImage();
  });

  // touch swipe for lightbox image (basic)
  (function addTouchSwipe() {
    let startX = 0, startY = 0, isTouch = false, threshold = 40;
    lbImage.addEventListener('touchstart', (e) => {
      if (!e.touches || e.touches.length > 1) return;
      isTouch = true; startX = e.touches[0].clientX; startY = e.touches[0].clientY;
    }, { passive: true });
    lbImage.addEventListener('touchend', (e) => {
      if (!isTouch) return; isTouch = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX, dy = t.clientY - startY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) { dx < 0 ? nextImage() : prevImage(); }
    }, { passive: true });
  })();

  // simple focus trap
  document.addEventListener('focus', (ev) => {
    if (!lightbox.classList.contains('open')) return;
    if (!lightbox.contains(ev.target)) { ev.stopPropagation(); btnClose.focus(); }
  }, true);

  // announce helper
  function announce(text) {
    if (!live) return;
    live.textContent = '';
    setTimeout(() => { live.textContent = text; }, 50);
  }

  // init
  (function init() {
    refreshVisibleIndexes();
    if (!filterBtns.some(b => b.classList.contains('active'))) {
      const allBtn = filterBtns.find(b => b.dataset.filter === 'all');
      if (allBtn) allBtn.classList.add('active');
    }
    filterToggles.forEach(t => t.classList.toggle('active', t.dataset.filter === 'none'));
    initTheme();
  })();

  // tiny API for debugging
  window.__gallery = { open: openLightbox, close: closeLightbox, next: nextImage, prev: prevImage, setFilter: applyCategoryFilter, setImgFilter: applyImgFilter };
})();
