/* editorial 版 · 滚动入场动画
   渐进增强：只在支持 IntersectionObserver 且用户未要求减少动态效果时启用。
   无脚本 / 爬虫 / 整页截图时内容始终完整可见。 */
(() => {
  'use strict';

  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const selector = [
    '.section-head', '.avatar-card', '.about-text', '.timeline-item',
    '.skill-card', '.stat', '.project-card', '.process', '.verify-note',
    '.hobby', '.contact-card'
  ].join(',');

  const nodes = [...document.querySelectorAll(selector)];
  if (!nodes.length) return;

  document.documentElement.classList.add('has-motion');

  // 同组内轻微错峰，节奏克制，不喧宾夺主
  nodes.forEach((el, i) => {
    el.classList.add('reveal');
    el.style.transitionDelay = (i % 4) * 55 + 'ms';
  });

  const show = (el) => el.classList.add('in');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { show(entry.target); io.unobserve(entry.target); }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });

  nodes.forEach(el => io.observe(el));

  // 兜底：整页截图 / 不滚动的抓取工具也能读到完整内容
  const revealAll = () => nodes.forEach(show);
  window.addEventListener('load', () => setTimeout(revealAll, 2400));
  setTimeout(revealAll, 4000);
})();
