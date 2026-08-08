/* ==========================================================================
   FOTOMATÓN PARTY MADRID - INTERACTIVE LOGIC & DYNAMIC DATA
   ========================================================================== */


document.addEventListener('DOMContentLoaded', () => {
  // --- 00. LENIS SMOOTH SCROLL INTEGRATION ---
  if (typeof Lenis !== 'undefined') {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 2
    });

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    } else {
      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    }
  }

  // --- 01. HERO SECTION LAYERED PARALLAX (GSAP ScrollTrigger) ---
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    const heroEl = document.getElementById('hero');
    if (heroEl) {
      const heroTl = gsap.timeline({
        scrollTrigger: {
          trigger: heroEl,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.5
        }
      });

      // Layer 1 (Fastest): Title and Description move upward and fade out
      const heroTitle = heroEl.querySelector('.hero-title');
      const heroDesc = heroEl.querySelector('.hero-description');
      if (heroTitle || heroDesc) {
        heroTl.to([heroTitle, heroDesc].filter(Boolean), {
          y: -120,
          opacity: 0.25,
          ease: 'none'
        }, 0);
      }



      // Layer 3: Floating Cards move subtly (hero-red-arch remains fixed)
      const cardsFlex = heroEl.querySelector('.hero-cards-flex');
      if (cardsFlex) {
        heroTl.to(cardsFlex, {
          y: -40,
          scale: 0.97,
          ease: 'none'
        }, 0);
      }
    }
  }

  // --- Osmo Supply: Basic Custom Cursor ---
  if (typeof gsap !== 'undefined' && document.querySelector('.cursor')) {
    gsap.set('.cursor', { xPercent: -50, yPercent: -50 });

    let xTo = gsap.quickTo('.cursor', 'x', { duration: 0.6, ease: 'power3' });
    let yTo = gsap.quickTo('.cursor', 'y', { duration: 0.6, ease: 'power3' });

    window.addEventListener('mousemove', e => {
      xTo(e.clientX);
      yTo(e.clientY);
    });
  }

  // 0. Hero Background Video & Sticker reveal on end
  const heroVideo = document.getElementById('hero-bg-video');
  const heroSection = document.getElementById('hero');

  if (heroVideo && heroSection) {
    const onVideoEnd = () => {
      heroSection.classList.add('video-ended');
      heroVideo.pause();
    };

    heroVideo.addEventListener('ended', onVideoEnd);
    heroVideo.addEventListener('error', onVideoEnd);

    // Fallback: trigger video-ended after 12s if video stream doesn't trigger ended
    setTimeout(() => {
      if (!heroSection.classList.contains('video-ended')) {
        onVideoEnd();
      }
    }, 12000);
  }

  // 1. Header scroll effect
  const header = document.querySelector('.header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // 2. Packs Data Store (Derived directly from LP FOTOMATÓN —COPY.txt Section 7)
  const packsData = {
    clasico: {
      bannerTitle: "Más ritmo, más grupos y el mejor precio",
      includedItems: [
        "Copias ilimitadas",
        "Fondo decorativo",
        "Atrezzo divertido",
        "Diseño personalizado",
        "Álbum de firmas",
        "Técnico asistente",
        "Fotografías digitales del evento",
        "Montaje y desmontaje"
      ],
      packs: [
        {
          id: "clasico-esencial",
          badge: null,
          popular: false,
          name: "Pack Esencial",
          hours: "2 horas",
          price: "249",
          desc: "Una opción práctica para celebraciones pequeñas o para concentrar la experiencia en el momento más animado del evento.",
          features: [
            "2 horas de servicio",
            "Copias ilimitadas",
            "Fondo y atrezzo",
            "Diseño con nombre y fecha",
            "Álbum de firmas",
            "Técnico asistente",
            "Entrega digital"
          ],
          btnText: "Consultar Pack Esencial",
          microcopy: "Consulta disponibilidad antes de reservar."
        },
        {
          id: "clasico-fiesta",
          badge: "Más popular",
          popular: true,
          name: "Pack Fiesta",
          hours: "3 horas",
          price: "329",
          desc: "El equilibrio ideal para que diferentes grupos de invitados puedan participar sin prisas.",
          features: [
            "3 horas de servicio",
            "Copias ilimitadas",
            "Fondo y atrezzo",
            "Diseño con nombre y fecha",
            "Álbum de firmas",
            "Técnico asistente",
            "Entrega digital"
          ],
          btnText: "Consultar Pack Fiesta",
          microcopy: "Una hora adicional por solo 50 € más."
        },
        {
          id: "clasico-completo",
          badge: "Experiencia premium",
          popular: false,
          name: "Pack Completo",
          hours: "5 horas",
          price: "449",
          desc: "La opción para bodas, fiestas grandes y eventos en los que quieres mantener la experiencia disponible durante más tiempo.",
          features: [
            "5 horas de servicio",
            "Copias ilimitadas",
            "Fondo y atrezzo",
            "Diseño con nombre y fecha",
            "Álbum de firmas",
            "Técnico asistente",
            "Entrega digital"
          ],
          btnText: "Consultar Pack Completo",
          microcopy: "La mejor relación entre duración y precio."
        }
      ]
    },
    espejo: {
      bannerTitle: "Más impacto visual y una experiencia interactiva premium",
      includedItems: [
        "Pantalla espejo táctil",
        "Copias ilimitadas",
        "Fondo y atrezzo",
        "Marcos animados y overlays",
        "Álbum de firmas personalizado",
        "Dos técnicos asistentes",
        "Fotografías personalizadas",
        "Montaje y desmontaje"
      ],
      packs: [
        {
          id: "espejo-esencial",
          badge: null,
          popular: false,
          name: "Pack Esencial",
          hours: "2 horas",
          price: "299",
          desc: "Todo lo necesario para incorporar la experiencia interactiva del Espejo a tu celebración.",
          features: [
            "2 horas de servicio",
            "Pantalla espejo táctil",
            "Copias ilimitadas",
            "Fondo y atrezzo",
            "Marcos animados y overlays",
            "Álbum con portada personalizada",
            "Dos técnicos asistentes",
            "Fotografías con nombre y fecha"
          ],
          btnText: "Consultar Pack Esencial",
          microcopy: "La forma más accesible de disfrutar del Fotomatón Espejo."
        },
        {
          id: "espejo-fiesta",
          badge: "Más popular",
          popular: true,
          name: "Pack Fiesta",
          hours: "3 horas",
          price: "399",
          desc: "Más tiempo y una puesta en escena preparada para convertir el fotomatón en uno de los centros de atención del evento.",
          features: [
            "3 horas de servicio",
            "Todo lo incluido en el Pack Esencial",
            "Alfombra roja",
            "Set elegante de bienvenida",
            "Animación adicional",
            "Juegos, dinámicas y ayuda con las poses"
          ],
          btnText: "Consultar Pack Fiesta",
          microcopy: "Ideal para bodas y celebraciones con muchos invitados."
        },
        {
          id: "espejo-completo",
          badge: "Experiencia premium",
          popular: false,
          name: "Pack Completo",
          hours: "4 horas",
          price: "499",
          desc: "La experiencia más completa para bodas, galas y eventos en los que la estética y la personalización son una prioridad.",
          features: [
            "4 horas de servicio",
            "Todo lo incluido en el Pack Esencial",
            "Alfombra roja",
            "Set elegante de bienvenida",
            "Personalización ampliada de la interfaz",
            "Marcos y elementos visuales premium"
          ],
          btnText: "Consultar Pack Completo",
          microcopy: "Más tiempo, mayor personalización y máximo impacto visual."
        }
      ]
    }
  };

  // 3. Render Packs Function
  let currentModel = 'clasico';
  const toggleClasicoBtn = document.getElementById('toggle-clasico');
  const toggleEspejoBtn = document.getElementById('toggle-espejo');
  const bannerTitleEl = document.getElementById('packs-banner-title');
  const bannerTagsEl = document.getElementById('packs-banner-tags');
  const packsGridEl = document.getElementById('packs-grid');

  function renderPacks(model) {
    currentModel = model;
    const data = packsData[model];

    // Toggle button styles
    if (model === 'clasico') {
      toggleClasicoBtn.classList.add('active');
      toggleEspejoBtn.classList.remove('active');
    } else {
      toggleEspejoBtn.classList.add('active');
      toggleClasicoBtn.classList.remove('active');
    }

    // Update banner
    bannerTitleEl.textContent = data.bannerTitle;
    bannerTagsEl.innerHTML = data.includedItems
      .map(item => `<span class="tag">✓ ${item}</span>`)
      .join('');

    // Update Cards
    packsGridEl.innerHTML = data.packs.map(pack => `
      <div class="pack-card ${pack.popular ? 'popular' : ''}">
        ${pack.badge ? `<div class="pack-badge">${pack.badge}</div>` : ''}
        <div style="text-align: center; margin-bottom: 16px;">
          <h3 class="pack-name" style="font-size: 1.5rem; font-weight: 800;">${pack.name}</h3>
          <div class="pack-hours" style="font-size: 0.85rem; font-family: var(--font-mono); font-weight: 700;">${pack.hours}</div>
          <div class="pack-price">${pack.price} € <span>/ servicio</span></div>
        </div>
        <p class="pack-desc" style="font-size: 0.9rem; margin-bottom: 20px; text-align: center;">${pack.desc}</p>
        <ul class="feature-list" style="margin-bottom: 24px;">
          ${pack.features.map(f => `
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <span>${f}</span>
            </li>
          `).join('')}
        </ul>
        <button class="btn ${pack.popular ? 'btn-white-pill' : 'btn-red'} pack-cta-btn" onclick="selectPack('${model}', '${pack.name}')">
          ${pack.btnText} <span class="btn-arrow">↗</span>
        </button>
        <div style="font-size: 0.75rem; text-align: center; margin-top: 12px; font-family: var(--font-mono); opacity: 0.8;">${pack.microcopy}</div>
      </div>
    `).join('');

    centerPopularPack();
  }

  // Mobile Packs Carousel Arrow & Auto-Center Logic
  const packsArrowLeft = document.getElementById('packs-arrow-left');
  const packsArrowRight = document.getElementById('packs-arrow-right');

  function updateArrowVisibility() {
    if (!packsGridEl || !packsArrowLeft || !packsArrowRight) return;
    if (window.innerWidth > 768) return;

    const scrollLeft = packsGridEl.scrollLeft;
    const maxScroll = packsGridEl.scrollWidth - packsGridEl.clientWidth;

    // Hide left arrow if at start (scrollLeft <= 15px)
    if (scrollLeft <= 15) {
      packsArrowLeft.style.opacity = '0';
      packsArrowLeft.style.pointerEvents = 'none';
    } else {
      packsArrowLeft.style.opacity = '1';
      packsArrowLeft.style.pointerEvents = 'auto';
    }

    // Hide right arrow if at end (scrollLeft >= maxScroll - 15px)
    if (scrollLeft >= maxScroll - 15) {
      packsArrowRight.style.opacity = '0';
      packsArrowRight.style.pointerEvents = 'none';
    } else {
      packsArrowRight.style.opacity = '1';
      packsArrowRight.style.pointerEvents = 'auto';
    }
  }

  function centerPopularPack() {
    if (window.innerWidth <= 768 && packsGridEl) {
      setTimeout(() => {
        const popularCard = packsGridEl.querySelector('.pack-card.popular') || packsGridEl.children[1];
        if (popularCard) {
          const scrollPos = popularCard.offsetLeft - (packsGridEl.offsetWidth - popularCard.offsetWidth) / 2;
          packsGridEl.scrollTo({ left: scrollPos, behavior: 'smooth' });
        }
        updateArrowVisibility();
      }, 60);
    }
  }

  if (packsArrowLeft && packsArrowRight && packsGridEl) {
    packsGridEl.addEventListener('scroll', updateArrowVisibility, { passive: true });
    window.addEventListener('resize', updateArrowVisibility);

    packsArrowLeft.addEventListener('click', () => {
      const card = packsGridEl.querySelector('.pack-card');
      const step = card ? (card.offsetWidth + 16) : 280;
      packsGridEl.scrollBy({ left: -step, behavior: 'smooth' });
    });

    packsArrowRight.addEventListener('click', () => {
      const card = packsGridEl.querySelector('.pack-card');
      const step = card ? (card.offsetWidth + 16) : 280;
      packsGridEl.scrollBy({ left: step, behavior: 'smooth' });
    });

    // Touch & Pointer Drag Gesture Support
    let isDragging = false;
    let startX = 0;
    let scrollStart = 0;

    packsGridEl.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button, a, input, select')) return;
      isDragging = true;
      startX = e.clientX;
      scrollStart = packsGridEl.scrollLeft;
      packsGridEl.style.scrollSnapType = 'none';
      packsGridEl.style.scrollBehavior = 'auto';
    });

    window.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - startX;
      packsGridEl.scrollLeft = scrollStart - deltaX;
      updateArrowVisibility();
    });

    const stopDragging = () => {
      if (!isDragging) return;
      isDragging = false;
      packsGridEl.style.scrollSnapType = 'x mandatory';
      packsGridEl.style.scrollBehavior = 'smooth';
      updateArrowVisibility();
    };

    window.addEventListener('pointerup', stopDragging);
    window.addEventListener('pointercancel', stopDragging);
  }

  toggleClasicoBtn.addEventListener('click', () => renderPacks('clasico'));
  toggleEspejoBtn.addEventListener('click', () => renderPacks('espejo'));

  // Initial render
  renderPacks('clasico');
  window.addEventListener('resize', centerPopularPack);

  // Global helper to select pack and scroll to form
  window.selectPack = function (model, packName) {
    const boothSelect = document.getElementById('form-booth');
    const packSelect = document.getElementById('form-pack');

    if (boothSelect) {
      boothSelect.value = model === 'clasico' ? 'Fotomatón Clásico' : 'Fotomatón Espejo';
    }
    if (packSelect) {
      if (packName.includes('Esencial')) packSelect.value = 'Esencial';
      else if (packName.includes('Fiesta')) packSelect.value = 'Fiesta';
      else if (packName.includes('Completo')) packSelect.value = 'Completo';
    }

    const formSec = document.getElementById('formulario');
    if (formSec) {
      formSec.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Switch to model from cards in Section 4
  window.switchToModel = function (model) {
    renderPacks(model);
    const packsSection = document.getElementById('packs');
    if (packsSection) {
      packsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 4. FAQ Accordions
  const faqButtons = document.querySelectorAll('.faq-button');
  faqButtons.forEach(button => {
    button.addEventListener('click', () => {
      const faqItem = button.parentElement;
      const isActive = faqItem.classList.contains('active');

      // Close all
      document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
        const content = item.querySelector('.faq-content');
        if (content) content.style.maxHeight = null;
      });

      // Toggle current
      if (!isActive) {
        faqItem.classList.add('active');
        const content = faqItem.querySelector('.faq-content');
        if (content) content.style.maxHeight = (content.scrollHeight + 60) + 'px';
      }
    });
  });

  // 5. Help Me Choose Decision Modal Logic
  const helpModal = document.getElementById('help-modal');
  const openHelpBtn = document.getElementById('open-help-modal');
  const closeHelpBtn = document.getElementById('close-help-modal');

  if (openHelpBtn && helpModal) {
    openHelpBtn.addEventListener('click', () => {
      helpModal.classList.add('active');
    });
  }

  if (closeHelpBtn && helpModal) {
    closeHelpBtn.addEventListener('click', () => {
      helpModal.classList.remove('active');
    });
  }

  window.chooseWizard = function (choice) {
    if (helpModal) helpModal.classList.remove('active');
    switchToModel(choice);
  };

  // 6. Form Submission & Dynamic WhatsApp Link Builder
  const bookingForm = document.getElementById('booking-form');
  const successBox = document.getElementById('form-success');
  const whatsappFloatBtn = document.getElementById('whatsapp-float');
  const whatsappSuccessBtn = document.getElementById('whatsapp-success-btn');

  function buildWhatsAppUrl(eventType = '', date = '', location = '', boothType = '') {
    const formattedEvent = eventType || '[TIPO DE EVENTO]';
    const formattedDate = date || '[FECHA]';
    const formattedLocation = location || '[LOCALIDAD]';
    const formattedBooth = boothType || '[CLÁSICO / ESPEJO]';

    const messageText = `Hola, estoy organizando un/a ${formattedEvent} el ${formattedDate} en ${formattedLocation}. Estoy interesado/a en el Fotomatón ${formattedBooth} y me gustaría consultar disponibilidad y condiciones.`;
    const phone = "34672546955";
    return `https://wa.me/${phone}?text=${encodeURIComponent(messageText)}`;
  }

  // Update dynamic whatsapp link when form values change
  const eventInput = document.getElementById('form-event');
  const dateInput = document.getElementById('form-date');
  const locInput = document.getElementById('form-location');
  const boothInput = document.getElementById('form-booth');

  function updateWhatsAppLinks() {
    const url = buildWhatsAppUrl(
      eventInput?.value,
      dateInput?.value,
      locInput?.value,
      boothInput?.value
    );
    if (whatsappFloatBtn) whatsappFloatBtn.href = url;
    if (whatsappSuccessBtn) whatsappSuccessBtn.href = url;
  }

  [eventInput, dateInput, locInput, boothInput].forEach(el => {
    if (el) el.addEventListener('change', updateWhatsAppLinks);
    if (el) el.addEventListener('input', updateWhatsAppLinks);
  });

  // Set default WhatsApp float link
  updateWhatsAppLinks();

  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      // Show success feedback state
      bookingForm.style.display = 'none';
      if (successBox) successBox.classList.add('visible');
      updateWhatsAppLinks();
    });
  }

  // 7. Active Navbar Scroll Spy (Highlight active section link with red underline)
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  const observerOptions = {
    root: null,
    rootMargin: '-30% 0px -50% 0px',
    threshold: 0
  };

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const activeId = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          const href = link.getAttribute('href');
          if (href === `#${activeId}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach(sec => sectionObserver.observe(sec));

  // 8. BlurText Headline Animation (React Bits Component Integration - Excludes .hero-title)
  function initBlurText() {
    const headlines = document.querySelectorAll('.section-title, .cta-title, h1:not(.hero-title), h2');

    headlines.forEach(headline => {
      if (headline.classList.contains('blur-text-init')) return;
      headline.classList.add('blur-text-init', 'blur-text-target');

      let wordIndex = 0;

      function wrapWords(node) {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent;
          if (!text.trim()) return;

          const words = text.split(/(\s+)/);
          const fragment = document.createDocumentFragment();

          words.forEach(word => {
            if (word.trim().length > 0) {
              const span = document.createElement('span');
              span.className = 'blur-word';
              span.textContent = word;
              span.style.transitionDelay = `${wordIndex * 0.07}s`;
              wordIndex++;
              fragment.appendChild(span);
            } else if (word) {
              fragment.appendChild(document.createTextNode(word));
            }
          });

          node.parentNode.replaceChild(fragment, node);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.tagName.toLowerCase() === 'br') return;
          Array.from(node.childNodes).forEach(child => wrapWords(child));
        }
      }

      Array.from(headline.childNodes).forEach(child => wrapWords(child));

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const blurWords = entry.target.querySelectorAll('.blur-word');
            blurWords.forEach(w => w.classList.add('animate'));
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px' });

      observer.observe(headline);
    });
  }

  // --- ScrollVelocity Component Implementation ---
  function initScrollVelocity() {
    const scrollers = document.querySelectorAll('.scroller');
    if (!scrollers.length) return;

    let lastScrollY = window.scrollY;
    let scrollVelocity = 0;
    let smoothVelocity = 0;

    window.addEventListener('scroll', () => {
      const currentScrollY = window.scrollY;
      scrollVelocity = currentScrollY - lastScrollY;
      lastScrollY = currentScrollY;
    }, { passive: true });

    const scrollerStates = Array.from(scrollers).map((el, index) => {
      return {
        el,
        baseVelocity: index % 2 === 0 ? 70 : -70,
        baseX: 0,
        directionFactor: 1
      };
    });

    let lastTime = performance.now();

    function animate(currentTime) {
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      smoothVelocity += (scrollVelocity - smoothVelocity) * 0.1;
      scrollVelocity *= 0.88;

      const velocityFactor = Math.max(-4, Math.min(4, smoothVelocity * 0.06));

      scrollerStates.forEach(state => {
        let moveBy = state.directionFactor * state.baseVelocity * delta;

        if (velocityFactor < 0) {
          state.directionFactor = -1;
        } else if (velocityFactor > 0) {
          state.directionFactor = 1;
        }

        moveBy += state.directionFactor * moveBy * Math.abs(velocityFactor);
        state.baseX += moveBy;

        const firstSpan = state.el.querySelector('span');
        if (firstSpan) {
          const copyWidth = firstSpan.offsetWidth;
          if (copyWidth > 0) {
            const wrappedX = (((state.baseX % copyWidth) + copyWidth) % copyWidth) - copyWidth;
            state.el.style.transform = `translate3d(${wrappedX}px, 0, 0)`;
          }
        }
      });

      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }

  initScrollVelocity();
  initBlurText();
});
