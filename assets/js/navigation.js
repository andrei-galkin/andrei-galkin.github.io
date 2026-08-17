(function () {
  'use strict';
  var profile = (window.siteConfig && window.siteConfig.profile) || {};
  document.querySelectorAll('[data-profile]').forEach(function (element) {
    element.textContent = profile[element.getAttribute('data-profile')] || '';
  });
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
  document.querySelectorAll('[data-profile-list]').forEach(function (list) {
    (profile[list.getAttribute('data-profile-list')] || []).forEach(function (text) {
      var item = document.createElement('li'); item.textContent = text; list.appendChild(item);
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
  var links = Array.prototype.slice.call(document.querySelectorAll('.primary-navigation a, .mobile-navigation a'));
  var sections = Array.prototype.slice.call(document.querySelectorAll('main > section[id]'));
  function activate(id) {
    links.forEach(function (link) {
      var active = link.getAttribute('href') === '#' + id;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
    });
  }
  activate('about');
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { if (entry.isIntersecting) activate(entry.target.id); });
    }, { rootMargin: '-20% 0px -60% 0px', threshold: 0 });
    sections.forEach(function (section) { observer.observe(section); });
  }
}());
