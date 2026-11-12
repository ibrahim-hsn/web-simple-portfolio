/* Ibrahim Bin Hassan — simple portfolio (plain JavaScript, no libraries) */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  /* ---------- dark mode ---------- */
  var themeBtn = $('#theme-btn');
  function syncThemeLabel() {
    var dark = root.dataset.theme === 'dark';
    themeBtn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  }
  themeBtn.addEventListener('click', function () {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', root.dataset.theme);
    syncThemeLabel();
  });
  syncThemeLabel();

  /* ---------- mobile menu ---------- */
  var nav = $('#nav');
  var menuBtn = $('#menu-btn');
  var links = $('#nav-links');
  function setMenu(open) {
    links.classList.toggle('is-open', open);
    nav.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.textContent = open ? 'Close' : 'Menu';
  }
  menuBtn.addEventListener('click', function () { setMenu(!links.classList.contains('is-open')); });
  links.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && links.classList.contains('is-open')) { setMenu(false); menuBtn.focus(); }
  });

  /* ---------- show / hide panels (Skills, Projects) ---------- */
  $$('.chips li').forEach(function (li, i) { li.style.setProperty('--i', i); });
  $$('[data-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      var open = btn.getAttribute('aria-expanded') !== 'true';
      // only one panel open at a time
      $$('[data-toggle]').forEach(function (b) {
        b.setAttribute('aria-expanded', 'false');
        document.getElementById(b.getAttribute('aria-controls')).classList.remove('is-open');
      });
      btn.setAttribute('aria-expanded', open);
      panel.classList.toggle('is-open', open);
    });
  });

  /* ---------- typed role ---------- */
  var typed = $('#typed');
  var roles = ['an aspiring AI / ML engineer', 'a Computer Science student', 'learning Python for AI', 'open to internships'];
  if (!reduced) {
    var r = 0, c = roles[0].length, deleting = true;
    (function tick() {
      var word = roles[r];
      c += deleting ? -1 : 1;
      typed.textContent = word.slice(0, c);
      var wait = deleting ? 35 : 70;
      if (!deleting && c === word.length) { deleting = true; wait = 2200; }
      else if (deleting && c === 0) { deleting = false; r = (r + 1) % roles.length; wait = 300; }
      setTimeout(tick, wait);
    })();
  }

  /* ---------- reveal on scroll (staggered per section) ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });
  $$('section').forEach(function (sec) {
    sec.querySelectorAll('.reveal').forEach(function (el, i) {
      el.style.setProperty('--d', (i * 0.08) + 's');
      io.observe(el);
    });
  });

  /* ---------- copy email ---------- */
  var toast = $('#toast');
  var toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('is-on'); }, 1800);
  }
  $$('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (!navigator.clipboard) { showToast('Copy: ' + btn.dataset.copy); return; }
      navigator.clipboard.writeText(btn.dataset.copy)
        .then(function () { showToast('Email copied ✓'); })
        .catch(function () { showToast('Copy: ' + btn.dataset.copy); });
    });
  });

  /* ---------- device showcase: desktop flips up, slides away; phone falls in, slides away ---------- */
  var showcase = $('#showcase');
  var desktop = $('#desktop');
  var phone = $('#phone');
  var cap = $('#device-cap');

  var clamp = function (v) { return Math.min(1, Math.max(0, v)); };
  var seg = function (p, a, b) { return clamp((p - a) / (b - a)); };          // local 0..1 inside [a, b]
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
  var easeIn = function (t) { return t * t * t; };
  var easeBack = function (t) { var s = 1.7; t -= 1; return t * t * ((s + 1) * t + s) + 1; }; // overshoot = "landing"

  var sticky = $('.showcase__sticky');
  var deskImg = $('.desktop__screen img');
  var popout = $('#popout');
  var frame = $('#popout-frame');
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var easeInOut = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

  /* scroll timeline (p = 0..1 through the section)
     0.00-0.14 desktop flips up      0.14-0.26 hold, slight grow
     0.26-0.36 screen pops out       0.36-0.44 full screen
     0.44-0.54 screen returns        0.54-0.62 desktop slides away
     0.60-0.74 phone falls in        0.74-0.88 phone sways      0.88-1 phone slides away */
  function renderShowcase() {
    var rect = showcase.getBoundingClientRect();
    var p = clamp(-rect.top / (rect.height - innerHeight));
    var vw = innerWidth / 100, vh = innerHeight / 100;

    // desktop
    var flip = easeOut(seg(p, 0, 0.14));
    var grow = seg(p, 0.14, 0.26);
    var away = easeIn(seg(p, 0.54, 0.62));
    desktop.style.opacity = Math.min(1, flip * 1.5);
    desktop.style.transform =
      'translate3d(' + (-130 * vw * away) + 'px,' + ((1 - flip) * 20 * vh) + 'px,0)' +
      ' rotateX(' + (-75 * (1 - flip)) + 'deg) rotateY(' + (35 * away) + 'deg) scale(' + (1 + 0.05 * grow) + ')';

    // pop-out: frame travels from the monitor's screen to the full viewport and back
    var pop = easeInOut(seg(p, 0.26, 0.36)) * (1 - easeInOut(seg(p, 0.44, 0.54)));
    if (pop > 0) {
      var s = sticky.getBoundingClientRect();
      var r = deskImg.getBoundingClientRect();
      var W = s.width, H = s.height;
      var tw = W, th = H, tl = 0, tt = 0;
      if (W / H < 1.2) { th = W / 1.6; tt = (H - th) / 2; } // portrait screens: keep 16:10, centred
      frame.style.left = lerp(r.left - s.left, tl, pop) + 'px';
      frame.style.top = lerp(r.top - s.top, tt, pop) + 'px';
      frame.style.width = lerp(r.width, tw, pop) + 'px';
      frame.style.height = lerp(r.height, th, pop) + 'px';
      frame.style.borderRadius = lerp(4, 0, pop) + 'px';
      frame.style.opacity = 1;
      popout.style.setProperty('--dim', (0.55 * pop).toFixed(3));
      deskImg.style.opacity = 0;
      desktop.style.filter = 'brightness(' + (1 - 0.35 * pop) + ')';
      nav.style.opacity = 1 - pop;
      nav.style.visibility = pop > 0.98 ? 'hidden' : '';
    } else {
      frame.style.opacity = 0;
      popout.style.setProperty('--dim', 0);
      deskImg.style.opacity = 1;
      desktop.style.filter = '';
      nav.style.opacity = '';
      nav.style.visibility = '';
    }

    // phone
    var fall = seg(p, 0.6, 0.74);
    var sway = seg(p, 0.74, 0.88);
    var exit = easeIn(seg(p, 0.88, 1));
    phone.style.opacity = fall > 0 ? 1 : 0;
    phone.style.transform =
      'translate3d(' + (130 * vw * exit) + 'px,' + ((1 - easeOut(fall)) * -110 * vh) + 'px,0)' +
      ' rotate(' + (-40 * (1 - easeBack(fall)) + Math.sin(sway * Math.PI) * 4 + 25 * exit) + 'deg)';

    var txt = p < 0.26 ? 'Desktop · 1440 × 900' : p < 0.54 ? 'Full screen · the real layout' : p < 0.6 ? 'Desktop · 1440 × 900' : 'Mobile · 390 × 844';
    if (cap.textContent !== txt) cap.textContent = txt;
  }

  /* ---------- scroll: progress bar, nav state, active link, showcase ---------- */
  var bar = $('#progress');
  var sections = $$('main > section');
  var navLinks = $$('.nav__links a');
  var ticking = false;
  function onScroll() {
    var max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? scrollY / max : 0) + ')';
    nav.classList.toggle('is-solid', scrollY > 30);
    var current = sections[0].id;
    sections.forEach(function (s) { if (s.getBoundingClientRect().top < innerHeight * 0.4) current = s.id; });
    navLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + current); });
    if (!reduced) renderShowcase();
    ticking = false;
  }
  addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();
})();
