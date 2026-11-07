(() => {
  // The comparison preview manages its own two-frame transition.
  if (window.top !== window) return;

  const key = 'portfolio-project-zoom';
  const siteBase = new URL('./', document.currentScript.src);
  const routes = new Set(['aiib/', 'mawei/', 'guohua/', 'jieyang/', 'fuyao/']
    .map(route => new URL(route, siteBase).pathname));
  const root = document.documentElement;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const animations = [];
  let busy = false;
  let arrivalHandled = false;

  function readPending() {
    try {
      const pending = JSON.parse(sessionStorage.getItem(key));
      return pending && Date.now() - pending.time < 8000 && routes.has(pending.path) ? pending : null;
    } catch {
      return null;
    }
  }

  const arrival = readPending();
  const arriving = arrival?.path === location.pathname && !reducedMotion.matches;
  if (arriving) root.dataset.projectZoom = 'arriving';

  function matchIncomingBitmap() {
    if (!arriving || !arrival.image) return;
    const image = document.querySelector('.hero-slide img');
    if (!image) return;
    const source = new URL(arrival.image, location.href);
    const project = location.pathname.slice(siteBase.pathname.length);
    const optimizedAssets = new URL(`assets/web-optimized/${project}assets/`, siteBase).pathname;
    if (source.origin !== location.origin || ![`${location.pathname}assets/`, optimizedAssets]
      .some(directory => source.pathname.startsWith(directory))) return;
    // Responsive image selection may prefer a larger cached file after navigation.
    // Keep the already-decoded homepage bitmap for this entry only.
    image.removeAttribute('srcset');
    image.src = source.href;
  }

  function clearPending() {
    try { sessionStorage.removeItem(key); } catch { /* Navigation still works without storage. */ }
  }

  function finishArrival() {
    root.classList.remove('zoom-native');
    if (arriving) root.dataset.projectZoom = 'ready';
    clearPending();
  }

  addEventListener('pageswap', event => {
    const destination = event.activation?.entry?.url;
    const pending = readPending();
    if (!busy || reducedMotion.matches || !pending || !destination || new URL(destination).pathname !== pending.path) {
      event.viewTransition?.skipTransition();
      return;
    }
    if (event.viewTransition) root.classList.add('zoom-native');
  });

  // Registered in the head, before the incoming document's first rendered frame.
  addEventListener('pagereveal', event => {
    if (!arriving) {
      event.viewTransition?.skipTransition();
      return;
    }
    arrivalHandled = true;
    matchIncomingBitmap();
    if (event.viewTransition && !reducedMotion.matches) {
      root.classList.add('zoom-native');
      event.viewTransition.finished.then(finishArrival, finishArrival);
    } else {
      finishArrival();
    }
  });

  addEventListener('pageshow', event => {
    if (!event.persisted) return;
    animations.splice(0).forEach(animation => animation.cancel());
    root.classList.remove('zoom-native');
    delete root.dataset.projectZoom;
    document.querySelector('[data-preview]')?.removeAttribute('aria-busy');
    const preview = document.querySelector('[data-preview]');
    if (preview) preview.inert = false;
    busy = false;
    clearPending();
  });

  const preloaded = new Set();
  function preload(url) {
    if (preloaded.has(url.href)) return;
    preloaded.add(url.href);
    fetch(url.href, { cache: 'force-cache', signal: AbortSignal.timeout(4000) }).catch(() => {});
  }

  function animate(element, frames, duration) {
    const animation = element.animate(frames, {
      duration, easing: 'cubic-bezier(.32,0,.2,1)', fill: 'both',
    });
    animations.push(animation);
    return animation;
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (arriving) {
      matchIncomingBitmap();
      // Browsers without cross-document transitions take the normal navigation path.
      setTimeout(() => { if (!arrivalHandled) finishArrival(); }, 100);
    }
    const preview = document.querySelector('[data-preview]');
    if (!preview) return;

    for (const type of ['pointerover', 'focusin']) {
      preview.addEventListener(type, event => {
        const link = event.target.closest('.preview-slide a');
        if (link) preload(new URL(link.href));
      });
    }

    document.addEventListener('click', async event => {
      const link = event.target.closest('.preview-slide a');
      if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank' || link.hasAttribute('download')) return;
      const url = new URL(link.href);
      if (url.origin !== location.origin || !routes.has(url.pathname) || reducedMotion.matches) return;
      event.preventDefault();
      if (busy) return;
      busy = true;
      preview.setAttribute('aria-busy', 'true');
      preview.inert = true;
      root.dataset.projectZoom = 'leaving';
      preload(url);
      const slide = link.closest('.preview-slide');
      const image = slide.querySelector('img');
      try {
        const parentTransform = getComputedStyle(slide).transform;
        if (parentTransform !== 'none' && parentTransform !== 'matrix(1, 0, 0, 1, 0, 0)') {
          animate(slide, [{ transform: parentTransform }, { transform: 'scale(1)' }], 360);
        }
        const zoom = animate(image, [{ transform: 'scale(1)' }, { transform: 'scale(1.1)' }], innerWidth <= 600 ? 850 : 1000);
        for (const element of preview.querySelectorAll('.is-active .slide-copy, .is-active .slide-shade, .slide-control, .preview-controls')) {
          animate(element, [{ opacity: getComputedStyle(element).opacity }, { opacity: 0 }], 360);
        }
        const profile = document.querySelector('.home-profile');
        if (profile) animate(profile, [{ opacity: 1 }, { opacity: 0 }], 360);
        await zoom.finished;
        if (!busy) return;
        try { sessionStorage.setItem(key, JSON.stringify({ path: url.pathname, image: image.currentSrc, time: Date.now() })); } catch { /* Fall back to ordinary navigation. */ }
      } catch {
        clearPending();
      }
      if (!busy) return;
      location.assign(url.href);
    });
  });
})();
