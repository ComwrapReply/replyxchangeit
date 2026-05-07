/* eslint-disable no-unused-vars */
/**
 * Sparkle colours — pulled from the site's neon palette.
 * Each sparkle randomly picks one of these on each cycle.
 */
const SPARKLE_COLORS = ['#00fbfb', '#10b981', '#06b6d4', '#ffffff', '#a7f3d0'];

const SPARKLE_COUNT = 18;

/**
 * Returns a random float between min and max.
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
const rand = (min, max) => Math.random() * (max - min) + min;

/**
 * Randomises the position and colour of a single sparkle element.
 * Called on creation and again every animation cycle so sparkles
 * drift to a new location after each twinkle.
 * @param {HTMLElement} el
 */
function randomiseSparkle(el) {
  const color = SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)];
  el.style.setProperty('--sparkle-x', `${rand(0, 100)}%`);
  el.style.setProperty('--sparkle-y', `${rand(-40, 140)}%`);
  el.style.setProperty('--sparkle-color', color);
  el.style.setProperty('--sparkle-size', `${rand(4, 10)}px`);
  el.style.setProperty('--sparkle-delay', `${rand(0, 2.5)}s`);
  el.style.setProperty('--sparkle-duration', `${rand(1.2, 2.8)}s`);
}

/**
 * Creates an animated sparkle field around the h2 inside the hero block.
 * Spawns SPARKLE_COUNT absolutely-positioned <span> elements that twinkle
 * using a CSS keyframe animation. JS re-randomises each sparkle's position
 * after every cycle so they feel alive and non-repetitive.
 * @param {HTMLHeadingElement} h2
 */
function addSparkles(h2) {
  const container = document.createElement('span');
  container.className = 'hero-sparkles';
  container.setAttribute('aria-hidden', 'true');

  for (let i = 0; i < SPARKLE_COUNT; i += 1) {
    const sparkle = document.createElement('span');
    sparkle.className = 'hero-sparkle';
    randomiseSparkle(sparkle);

    // Re-randomise position when this sparkle's animation ends so each
    // twinkle appears in a fresh spot — gives a drifting, living effect
    sparkle.addEventListener('animationiteration', () => randomiseSparkle(sparkle));

    container.append(sparkle);
  }

  // Wrap h2 in a relative-positioned container so sparkles are anchored to it
  const wrapper = document.createElement('span');
  wrapper.className = 'hero-h2-wrapper';
  h2.replaceWith(wrapper);
  wrapper.append(container);
  wrapper.append(h2);
}

/**
 * Injects a down-arrow link directly after the hero h2.
 * @param {HTMLHeadingElement} h2
 */
function addDownArrow(h2) {
  if (!h2) return;

  const arrowConfig = {
    targetId: 'image',
    label: 'Scroll to cards of images',
  };

  const arrow = document.createElement('a');
  arrow.className = 'hero-down-arrow';
  arrow.href = `#${arrowConfig.targetId}`;
  arrow.setAttribute('title', arrowConfig.label);
  arrow.setAttribute('aria-label', arrowConfig.label);
  arrow.addEventListener('click', (event) => {
    event.preventDefault();
    const targetEl = document.getElementById(arrowConfig.targetId);
    if (!targetEl) return;

    const scrollConfig = {
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    };
    targetEl.scrollIntoView(scrollConfig);
  });
  h2.insertAdjacentElement('afterend', arrow);
}

/* eslint-enable no-unused-vars */

/**
 * Wraps each character of an h1 in a <span class="hero-char"> so the
 * zooming-wave CSS animation can stagger per letter.
 * Spaces become <span class="hero-char hero-char--space"> for layout.
 * @param {HTMLHeadingElement} h1
 */
// eslint-disable-next-line no-unused-vars
function wrapChars(h1) {
  const text = h1.textContent;
  h1.textContent = '';
  [...text].forEach((char, i) => {
    const span = document.createElement('span');
    span.classList.add('hero-char');
    if (char === ' ') {
      span.classList.add('hero-char-space');
      span.textContent = '\u00a0';
    } else {
      span.textContent = char;
    }
    // 80 ms stagger per character. The total stagger across 20 chars
    // (1.6 s) is close to the 1.8 s cycle, so the wave flows through
    // the title almost continuously with no dead pause.
    span.style.animationDelay = `${(i % 20) * 0.08}s`;
    h1.append(span);
  });
}

/**
 * Hero block – full-bleed image with text overlay at the bottom.
 *
 * DOM output:
 *   .hero
 *     .hero-image        ← full-bleed background layer (picture/img)
 *     .hero-content      ← overlay container (gradient + text)
 *       .hero-text       ← badge, heading, description, buttons
 *         h1 > .hero-char  ← one span per character for wave animation
 *
 * @param {Element} block
 */
export default function decorate(block) {
  const pic = block.querySelector('picture');

  // Collect all non-image content elements
  const contentEls = [];
  block.querySelectorAll(':scope > div > div').forEach((col) => {
    [...col.children].forEach((el) => {
      if (el.tagName === 'P' && el.querySelector('picture') && el.children.length === 1) return;
      if (el.tagName === 'PICTURE') return;
      contentEls.push(el);
    });
  });

  block.textContent = '';

  // ── Image layer ──────────────────────────────────────────────
  const imageLayer = document.createElement('div');
  imageLayer.classList.add('hero-image');
  if (pic) {
    // Ensure the img inside fills the container
    const img = pic.querySelector('img');
    if (img) {
      img.removeAttribute('width');
      img.removeAttribute('height');
      img.setAttribute('loading', 'eager');
    }
    imageLayer.append(pic);
  }

  // ── Content overlay ──────────────────────────────────────────
  const contentLayer = document.createElement('div');
  contentLayer.classList.add('hero-content');

  const textCol = document.createElement('div');
  textCol.classList.add('hero-text');

  let foundHeading = false;
  contentEls.forEach((el) => {
    const clone = el.cloneNode(true);

    if (/^H[1-6]$/.test(clone.tagName)) foundHeading = true;

    // Tag short paragraph before the first heading as badge/eyebrow
    if (
      !foundHeading
      && clone.tagName === 'P'
      && !clone.querySelector('a')
      && !clone.querySelector('picture')
    ) {
      const text = clone.textContent.trim();
      if (text.length > 0 && text.length < 50) {
        clone.classList.add('hero-badge');
      }
    }

    // Detect single-link CTA paragraphs
    if (clone.tagName === 'P' && clone.querySelectorAll('a').length === 1 && clone.children.length <= 2) {
      const link = clone.querySelector('a');
      if (link) link.classList.add('button');
    }

    textCol.append(clone);
  });

  // Wrap CTA buttons
  const buttonParas = textCol.querySelectorAll('p:has(a.button)');
  if (buttonParas.length) {
    const btnWrap = document.createElement('div');
    btnWrap.classList.add('hero-buttons');
    buttonParas.forEach((p, i) => {
      const link = p.querySelector('a.button');
      if (i === 0) link.classList.add('primary');
      else link.classList.add('secondary');
      btnWrap.append(p);
    });
    textCol.append(btnWrap);
  }

  const heroH2 = textCol.querySelector('h2');
  if (heroH2) addDownArrow(heroH2);

  contentLayer.append(textCol);

  block.append(imageLayer);
  block.append(contentLayer);

  // Wave animation and sparkles are currently disabled.
  // To re-enable: uncomment the two lines below.
  // const h1 = block.querySelector('h1');
  // if (h1) wrapChars(h1);
  // const h2 = block.querySelector('h2');
  // if (h2) addSparkles(h2);
}
