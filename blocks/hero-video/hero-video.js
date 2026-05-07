/**
 * Wraps each character of an h1 in a <span class="hero-char"> so the
 * zooming-wave CSS animation can stagger per letter.
 * Spaces become <span class="hero-char hero-char--space"> for layout.
 * @param {HTMLHeadingElement} h1
 */
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
    span.style.animationDelay = `${(i % 20) * 0.08}s`;
    h1.append(span);
  });
}

/** Returns true for direct video file URLs (.mp4, .webm, .ogg, .mov) */
const isDirectVideoUrl = (href) => /\.(mp4|webm|ogg|mov)(\?|$)/i.test(href);

/**
 * Build a muted, looping, autoplaying <video> element from a URL string.
 * Browser autoplay policy requires muted + playsinline.
 * @param {string} src
 * @returns {HTMLVideoElement}
 */
function buildVideoEl(src) {
  const video = document.createElement('video');
  video.src = src;
  video.className = 'hero-video-media';

  video.setAttribute('playsinline', '');
  video.setAttribute('muted', '');
  video.setAttribute('loop', '');
  video.setAttribute('autoplay', '');
  // Chrome ignores the muted attribute on dynamically created elements —
  // setting the property explicitly is required to guarantee silence
  video.muted = true;

  // Trigger play() after the element is connected to the DOM.
  // Browsers reject play() on detached elements, which previously caused
  // the catch block to run immediately and enable controls before the
  // video had any chance to autoplay.
  video.addEventListener('canplay', () => {
    video.play().catch(() => {
      // Only show controls if the browser genuinely blocks autoplay
      // (e.g. strict data-saver policy) after the video is in the DOM
      video.controls = true;
    });
  }, { once: true });

  return video;
}

/**
 * Hero-video block – full-bleed autoplaying video background with text overlay.
 *
 * Expected authored content (one or two rows in the block table):
 *   Row 1 (video):  a link to an MP4/WebM/etc. URL
 *   Row 2+ (text):  badge, heading, description, CTA links — same as hero block
 *
 * DOM output:
 *   .hero-video
 *     .hero-video-image       ← full-bleed video layer
 *       video.hero-video-media
 *     .hero-content           ← overlay (reuses hero overlay styles)
 *       .hero-text
 *         .hero-badge?
 *         h1 > .hero-char     ← one span per char for wave animation
 *         p                   ← description
 *         .hero-buttons?      ← CTA links
 *
 * @param {Element} block
 */
export default function decorate(block) {
  // ── Collect authored elements ──────────────────────────────
  let videoSrc = null;
  const contentEls = [];

  block.querySelectorAll(':scope > div > div').forEach((col) => {
    [...col.children].forEach((el) => {
      // Check if this element contains a direct video link
      const anchor = el.tagName === 'A' ? el : el.querySelector('a');
      if (anchor && isDirectVideoUrl(anchor.href)) {
        if (!videoSrc) videoSrc = anchor.href;
        return; // don't add to content
      }
      // Skip bare picture/img elements (not used in this block but defensive)
      if (el.tagName === 'PICTURE') return;
      if (el.tagName === 'P' && el.querySelector('picture') && el.children.length === 1) return;

      contentEls.push(el);
    });
  });

  block.textContent = '';

  // ── Video layer ────────────────────────────────────────────
  const videoLayer = document.createElement('div');
  videoLayer.classList.add('hero-video-image');

  if (videoSrc) {
    videoLayer.append(buildVideoEl(videoSrc));
  }

  // ── Content overlay ────────────────────────────────────────
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

    // Detect CTA buttons. Handles all authored patterns:
    //   1. Bare anchor:  <a href="…" class="button">Label</a>
    //   2. Plain link:   <p><a href="…">Label</a></p>
    //   3. Bold link:    <p><strong><a href="…">Label</a></strong></p>  → primary
    //   4. Italic link:  <p><em><a href="…">Label</a></em></p>          → secondary
    if (clone.tagName === 'A' && clone.hasAttribute('href')) {
      // Pattern 1: bare <a> — wrap it in a <p> so it integrates with .hero-buttons
      clone.classList.add('button');
      const wrapper = document.createElement('p');
      wrapper.append(clone);
      textCol.append(wrapper);
      return;
    }

    if (clone.tagName === 'P') {
      const anchors = clone.querySelectorAll('a[href]');
      const pText = clone.textContent.trim();
      if (anchors.length === 1 && anchors[0].textContent.trim() === pText) {
        const link = anchors[0];
        const strong = link.closest('strong');
        const em = link.closest('em');

        link.classList.add('button');

        if (strong) {
          link.classList.add('primary');
          strong.replaceWith(link);
        } else if (em) {
          link.classList.add('secondary');
          em.replaceWith(link);
        }
      }
    }

    textCol.append(clone);
  });

  // Collect all button-carrying paragraphs and move them into .hero-buttons
  const buttonParas = textCol.querySelectorAll('p:has(a.button)');
  if (buttonParas.length) {
    const btnWrap = document.createElement('div');
    btnWrap.classList.add('hero-buttons');
    let primaryAssigned = false;
    buttonParas.forEach((p) => {
      const link = p.querySelector('a.button');
      // Assign primary/secondary if not already set by strong/em detection
      if (!link.classList.contains('primary') && !link.classList.contains('secondary')) {
        link.classList.add(primaryAssigned ? 'secondary' : 'primary');
      }
      primaryAssigned = true;
      btnWrap.append(p);
    });
    textCol.append(btnWrap);
  }

  contentLayer.append(textCol);

  block.append(videoLayer);
  block.append(contentLayer);

  // Wrap h1 characters for the wave animation after DOM is built
  const h1 = block.querySelector('h1');
  if (h1) wrapChars(h1);
}
