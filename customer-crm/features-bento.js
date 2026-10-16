/* One-time progressive entrance. No timers, looping, data calls or dependencies. */
(() => {
  const section = document.querySelector('.bento-features[data-motion="pending"]');
  if (!section) return;
  const reveal = () => {
    if (section.dataset.motion === 'revealed') return;
    section.dataset.motion = 'revealed';
  };
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduceMotion.matches || !('IntersectionObserver' in window)) {
    reveal();
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    reveal();
    observer.disconnect();
  }, { threshold: 0.12, rootMargin: '0px 0px -28px 0px' });
  observer.observe(section);
})();
