/*
 * Embed Block
 * Show videos and social posts directly on your page
 * https://www.hlx.live/developer/block-collection/embed
 */

const loadScript = (url, callback, type) => {
  const head = document.querySelector('head');
  const script = document.createElement('script');
  script.src = url;
  if (type) {
    script.setAttribute('type', type);
  }
  script.onload = callback;
  head.append(script);
  return script;
};

const getDefaultEmbed = (url) => `<div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;">
    <iframe src="${url.href}" style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;" allowfullscreen=""
      scrolling="no" allow="encrypted-media" title="Content from ${url.hostname}" loading="lazy">
    </iframe>
  </div>`;

const embedYoutube = (url, autoplay) => {
  const usp = new URLSearchParams(url.search);
  const suffix = autoplay ? '&muted=1&autoplay=1' : '';
  let vid = usp.get('v') ? encodeURIComponent(usp.get('v')) : '';
  const embed = url.pathname;
  if (url.origin.includes('youtu.be')) {
    [, vid] = url.pathname.split('/');
  }
  const embedHTML = `<div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;">
      <iframe src="https://www.youtube.com${vid ? `/embed/${vid}?rel=0&v=${vid}${suffix}` : embed}" style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;" 
      allow="autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope; picture-in-picture" allowfullscreen="" scrolling="no" title="Content from Youtube" loading="lazy"></iframe>
    </div>`;
  return embedHTML;
};

const embedVimeo = (url, autoplay) => {
  const [, video] = url.pathname.split('/');
  const suffix = autoplay ? '?muted=1&autoplay=1' : '';
  const embedHTML = `<div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;">
      <iframe src="https://player.vimeo.com/video/${video}${suffix}" 
      style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;" 
      frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen  
      title="Content from Vimeo" loading="lazy"></iframe>
    </div>`;
  return embedHTML;
};

const embedTwitter = (url) => {
  const embedHTML = `<blockquote class="twitter-tweet"><a href="${url.href}"></a></blockquote>`;
  loadScript('https://platform.twitter.com/widgets.js');
  return embedHTML;
};

/**
 * Embed a direct MP4 (or other native video) URL using a <video> element.
 * Autoplay requires muted + playsinline to satisfy browser autoplay policies.
 */
const embedVideo = (url, autoplay) => {
  const embedVideoConfig = {
    anchorId: 'video',
  };

  const wrapper = document.createElement('div');
  wrapper.className = 'embed-video-wrapper';
  if (!document.getElementById(embedVideoConfig.anchorId)) {
    wrapper.id = embedVideoConfig.anchorId;
  }

  const video = document.createElement('video');
  video.src = url.href;
  video.className = 'embed-video';

  video.setAttribute('playsinline', '');
  video.setAttribute('muted', '');
  video.setAttribute('loop', '');
  // Chrome ignores the muted attribute on dynamically created elements —
  // the property must also be set explicitly
  video.muted = true;

  if (autoplay) {
    video.setAttribute('autoplay', '');
    // play() must be called after the element is in the DOM — calling it on a
    // detached element always rejects, which would incorrectly enable controls
    video.addEventListener('canplay', () => {
      video.play().catch(() => {
        video.controls = true;
      });
    }, { once: true });
  } else {
    video.controls = true;
  }

  wrapper.append(video);
  return wrapper;
};

/** Returns true for direct video file URLs (.mp4, .webm, .ogg, .mov) */
const isDirectVideoUrl = (link) => /\.(mp4|webm|ogg|mov)(\?|$)/i.test(link);

const loadEmbed = (block, link, autoplay) => {
  if (block.classList.contains('embed-is-loaded')) {
    return;
  }

  const EMBEDS_CONFIG = [
    {
      match: ['youtube', 'youtu.be'],
      embed: embedYoutube,
    },
    {
      match: ['vimeo'],
      embed: embedVimeo,
    },
    {
      match: ['twitter'],
      embed: embedTwitter,
    },
  ];

  const url = new URL(link);

  // Handle direct video file URLs with a native <video> element
  if (isDirectVideoUrl(link)) {
    const videoEl = embedVideo(url, autoplay);
    block.innerHTML = '';
    block.append(videoEl);
    block.classList.add('embed-video', 'embed-is-loaded');
    return;
  }

  const config = EMBEDS_CONFIG.find((e) => e.match.some((match) => link.includes(match)));
  if (config) {
    block.innerHTML = config.embed(url, autoplay);
    block.classList = `block embed embed-${config.match[0]}`;
  } else {
    block.innerHTML = getDefaultEmbed(url);
    block.classList = 'block embed';
  }
  block.classList.add('embed-is-loaded');
};

export default function decorate(block) {
  const placeholder = block.querySelector('picture');
  const linkEl = block.querySelector('a');

  if (!linkEl) return;

  const link = linkEl.href;
  block.textContent = '';

  if (placeholder) {
    const wrapper = document.createElement('div');
    wrapper.className = 'embed-placeholder';
    wrapper.innerHTML = '<div class="embed-placeholder-play"><button type="button" title="Play"></button></div>';
    wrapper.prepend(placeholder);
    wrapper.addEventListener('click', () => {
      loadEmbed(block, link, true);
    });
    block.append(wrapper);
  } else {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer.disconnect();
        // Direct video URLs always autoplay (muted); others use default behaviour
        loadEmbed(block, link, isDirectVideoUrl(link));
      }
    });
    observer.observe(block);
  }
}
