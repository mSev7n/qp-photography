document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  gsap.registerPlugin(ScrollTrigger);

  // Lenis smooth scroll synced with GSAP's ScrollTrigger
  const lenis = new Lenis({ lerp: 0.075, smoothWheel: true });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  // Split all headline text before any animation runs
  Splitting();

  // Three.js bokeh particle field in the hero background
  (() => {
    const canvas   = document.getElementById('hero-canvas');
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60, canvas.offsetWidth / canvas.offsetHeight, 0.1, 100
    );
    camera.position.z = 5;

    // Fewer particles on smaller screens to keep things snappy
    const COUNT = window.innerWidth < 768 ? 60 : 110;

    const positions = new Float32Array(COUNT * 3);
    const colors    = new Float32Array(COUNT * 3);
    const sizes     = new Float32Array(COUNT);

    const amber = new THREE.Color(0xe8b86d);
    const stone = new THREE.Color(0x383230);

    for (let i = 0; i < COUNT; i++) {
      positions[i*3]   = (Math.random() - 0.5) * 20;
      positions[i*3+1] = (Math.random() - 0.5) * 14;
      positions[i*3+2] = (Math.random() - 0.5) * 10 - 2;

      // Roughly one in four particles gets the amber colour
      const c = Math.random() < 0.25 ? amber : stone;
      colors[i*3] = c.r; colors[i*3+1] = c.g; colors[i*3+2] = c.b;

      sizes[i] = Math.random() * 55 + 18;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));

    // Radial gradient painted onto a canvas gives us soft bokeh circles
    const bokehCanvas = document.createElement('canvas');
    bokehCanvas.width = bokehCanvas.height = 64;
    const bCtx = bokehCanvas.getContext('2d');
    const grd  = bCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0,   'rgba(255,255,255,0.85)');
    grd.addColorStop(0.45,'rgba(255,255,255,0.25)');
    grd.addColorStop(1,   'rgba(255,255,255,0)');
    bCtx.fillStyle = grd;
    bCtx.fillRect(0, 0, 64, 64);

    const mat = new THREE.PointsMaterial({
      map:             new THREE.CanvasTexture(bokehCanvas),
      vertexColors:    true,
      transparent:     true,
      opacity:         0.32,
      sizeAttenuation: true,
      depthWrite:      false,
      blending:        THREE.AdditiveBlending,
    });

    const field = new THREE.Points(geo, mat);
    scene.add(field);

    let tick = 0;
    const loop = () => {
      requestAnimationFrame(loop);
      tick += 0.0007;
      field.rotation.y  = tick * 0.12;
      field.rotation.x  = Math.sin(tick * 0.35) * 0.035;
      field.position.y  = Math.sin(tick * 0.55) * 0.12;
      renderer.render(scene, camera);
    };
    loop();

    window.addEventListener('resize', () => {
      const w = canvas.offsetWidth, h = canvas.offsetHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }, { passive: true });
  })();

  // Scroll progress ribbon grows from left to right as you scroll
  gsap.to('#scroll-ribbon', {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: {
      trigger: document.body,
      start:   'top top',
      end:     'bottom bottom',
      scrub:   0.3,
    },
  });

  // Frosted-glass nav becomes visible after 100px of scroll
  ScrollTrigger.create({
    start:       '100px top',
    onEnter:     () => document.getElementById('nav').classList.add('is-scrolled'),
    onLeaveBack: () => document.getElementById('nav').classList.remove('is-scrolled'),
  });

  // Hero entrance — eyebrow, headline characters, subtext, actions, stats
  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .to('.hero__eyebrow',  { opacity: 1, y: 0, duration: 0.8, delay: 0.25 })
    .to('.hero__headline .char', {
      opacity: 1, y: '0%', rotate: 0,
      duration: 0.7, stagger: 0.022,
      ease: 'back.out(1.5)',
    }, '-=0.45')
    .to('.hero__sub',      { opacity: 1, y: 0, duration: 0.7 }, '-=0.35')
    .to('.hero__actions',  { opacity: 1, y: 0, duration: 0.65 }, '-=0.5')
    .to('.hero__stats',    { opacity: 1, duration: 0.6 }, '-=0.4');

  // Hero content drifts up gently as you scroll past it
  gsap.to('.hero__content', {
    y: 90, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.4 },
  });

  // Section headlines reveal character by character on scroll
  document.querySelectorAll('.section-title, .cta-banner__headline').forEach(el => {
    gsap.to(el.querySelectorAll('.char'), {
      opacity: 1, y: '0%', rotate: 0,
      duration: 0.6, stagger: 0.018,
      ease: 'back.out(1.3)',
      scrollTrigger: {
        trigger:       el,
        start:         'top 88%',
        toggleActions: 'play none none none',
      },
    });
  });

  // How It Works steps fade and slide up as they enter the viewport
  document.querySelectorAll('.hiw__step').forEach((step, i) => {
    gsap.to(step, {
      opacity: 1, y: 0, duration: 0.85,
      ease: 'power3.out',
      scrollTrigger: {
        trigger:       step,
        start:         'top 85%',
        toggleActions: 'play none none none',
      },
    });
  });

  // Review cards stagger in when the grid scrolls into view
  gsap.to('.review-card', {
    opacity: 1, y: 0, duration: 0.7, stagger: 0.13,
    ease: 'power3.out',
    scrollTrigger: {
      trigger:       '.reviews__grid',
      start:         'top 85%',
      toggleActions: 'play none none none',
    },
  });

  // Benefit cards stagger in the same way
  gsap.to('.benefit-card', {
    opacity: 1, y: 0, duration: 0.7, stagger: 0.13,
    ease: 'power3.out',
    scrollTrigger: {
      trigger:       '.benefits__grid',
      start:         'top 85%',
      toggleActions: 'play none none none',
    },
  });

  // Gallery cells scale up slightly as they appear
  gsap.from('.gallery__cell', {
    opacity: 0, scale: 0.94, duration: 0.75, stagger: 0.07,
    ease: 'power3.out',
    scrollTrigger: {
      trigger:       '.gallery__grid',
      start:         'top 87%',
      toggleActions: 'play none none none',
    },
  });

  // FAQ items slide up one after the other
  gsap.to('.faq__item', {
    opacity: 1, y: 0, duration: 0.6, stagger: 0.08,
    ease: 'power3.out',
    scrollTrigger: {
      trigger:       '.faq__list',
      start:         'top 85%',
      toggleActions: 'play none none none',
    },
  });

  // FAQ accordion — clicking a question opens its answer and closes any other
  document.querySelectorAll('.faq__q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item   = btn.closest('.faq__item');
      const body   = item.querySelector('.faq__body');
      const isOpen = item.classList.contains('is-open');

      // Close whatever was open first
      document.querySelectorAll('.faq__item.is-open').forEach(open => {
        open.classList.remove('is-open');
        open.querySelector('.faq__body').style.maxHeight = '0';
        open.querySelector('.faq__q').setAttribute('aria-expanded', 'false');
      });

      if (!isOpen) {
        item.classList.add('is-open');
        body.style.maxHeight = body.scrollHeight + 'px';
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // Mobile hamburger menu
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobile-nav');
  let menuOpen    = false;

  const toggleMenu = (open) => {
    menuOpen = open;
    mobileNav.classList.toggle('is-open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    // Lock body scroll while the overlay is visible
    document.body.style.overflow = open ? 'hidden' : '';

    const [s0, s1, s2] = hamburger.querySelectorAll('span');
    if (open) {
      gsap.to(s0, { rotation: 45,  y:  6, duration: 0.3 });
      gsap.to(s1, { opacity: 0,        duration: 0.18 });
      gsap.to(s2, { rotation: -45, y: -6, duration: 0.3 });
    } else {
      gsap.to(s0, { rotation: 0, y: 0, duration: 0.3 });
      gsap.to(s1, { opacity: 1,        duration: 0.3 });
      gsap.to(s2, { rotation: 0, y: 0, duration: 0.3 });
    }
  };

  hamburger.addEventListener('click', () => toggleMenu(!menuOpen));

  // Any nav link inside the overlay closes the menu
  document.querySelectorAll('.m-link').forEach(link =>
    link.addEventListener('click', () => toggleMenu(false))
  );

  // --- Built By Badge (mSeven) Logic ---
  (() => {
    const badgeWrapper = document.getElementById('m7-badge-wrapper');
    const badgeBtn     = document.getElementById('m7-badge-btn');
    const badgeCard    = document.getElementById('m7-badge-card');
    const badgeHint    = document.getElementById('m7-badge-hint');

    if (!badgeWrapper || !badgeBtn || !badgeCard) return;

    const toggleBadge = (open) => {
      if (open) {
        badgeCard.classList.add('is-open');
        badgeCard.setAttribute('aria-hidden', 'false');
        badgeBtn.setAttribute('aria-expanded', 'true');
        if (badgeHint) {
          badgeHint.classList.add('hidden');
        }
      } else {
        badgeCard.classList.remove('is-open');
        badgeCard.setAttribute('aria-hidden', 'true');
        badgeBtn.setAttribute('aria-expanded', 'false');
        if (badgeHint) {
          badgeHint.classList.remove('hidden');
        }
      }
    };

    badgeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = badgeCard.classList.contains('is-open');
      toggleBadge(!isOpen);
    });

    // Close badge when clicking outside
    document.addEventListener('click', (e) => {
      if (!badgeWrapper.contains(e.target)) {
        toggleBadge(false);
      }
    });

    // Close badge when pressing Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        toggleBadge(false);
      }
    });
  })();

});
