(function () {
  'use strict';
  var profile = (window.siteConfig && window.siteConfig.profile) || {};
  document.querySelectorAll('[data-profile-emphasis]').forEach(function (element) {
    var text = profile[element.getAttribute('data-profile-emphasis')] || '';
    text.split(/(\*\*[^*]+\*\*)/).forEach(function (part) {
      if (!part) return;
      if (part.slice(0, 2) === '**' && part.slice(-2) === '**') {
        var strong = document.createElement('strong');
        strong.textContent = part.slice(2, -2);
        element.appendChild(strong);
      } else {
        element.appendChild(document.createTextNode(part));
      }
    });
  });
  document.querySelectorAll('[data-profile-links]').forEach(function (container) {
    (profile.links || []).forEach(function (link) {
      if (!link.url) return;
      var anchor = document.createElement('a'); anchor.href = link.url; anchor.textContent = link.label;
      if (/^https?:/.test(link.url)) { anchor.target = '_blank'; anchor.rel = 'noopener noreferrer'; }
      container.appendChild(anchor);
    });
  });
  document.querySelectorAll('[data-current-year]').forEach(function (element) { element.textContent = new Date().getFullYear(); });
  var links = Array.prototype.slice.call(document.querySelectorAll('.primary-navigation a'));
  var sections = Array.prototype.slice.call(document.querySelectorAll('main > section[id]'));
  function activate(id) {
    links.forEach(function (link) {
      var active = link.getAttribute('href') === '#' + id;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
    });
  }
  function activateHash() {
    var id = window.location.hash.slice(1);
    if (sections.some(function (section) { return section.id === id; })) activate(id);
  }
  activate(window.location.hash ? window.location.hash.slice(1) : 'about');
  window.addEventListener('hashchange', activateHash);
  if ('IntersectionObserver' in window) {
    var visibility = {};
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        visibility[entry.target.id] = entry.isIntersecting ? entry.intersectionRatio : 0;
      });
      var current = sections.reduce(function (best, section) {
        return (visibility[section.id] || 0) > (visibility[best.id] || 0) ? section : best;
      }, sections[0]);
      if (visibility[current.id]) activate(current.id);
    }, { rootMargin: '-20% 0px -60% 0px', threshold: 0 });
    sections.forEach(function (section) { observer.observe(section); });
  }
}());
