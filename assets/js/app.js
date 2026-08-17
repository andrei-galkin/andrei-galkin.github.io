(function () {
  'use strict';

  var config = window.siteConfig || {};
  var profile = config.profile || {};

  function createElement(tag, className, text) {
    var element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function fetchJson(url, timeout) {
    var controller = new AbortController();
    var timer = window.setTimeout(function () { controller.abort(); }, timeout || 15000);
    return fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal
    }).then(function (response) {
      if (!response.ok) throw new Error('Request failed with status ' + response.status);
      return response.json();
    }).finally(function () {
      window.clearTimeout(timer);
    });
  }

  function initializeProfileCard() {
    var card = document.querySelector('[data-profile-card]');
    var image = document.querySelector('[data-profile-avatar]');
    if (image && profile.avatarUrl) image.src = profile.avatarUrl;
    if (!card) return;
    function toggle() {
      var flipped = !card.classList.contains('flipped');
      card.classList.toggle('flipped', flipped);
      card.setAttribute('aria-pressed', String(flipped));
      card.setAttribute('aria-label', flipped
        ? 'Andrei Galkin profile details. Activate to show photo.'
        : 'Andrei Galkin profile card. Activate to show details.');
    }
    card.addEventListener('click', function (event) {
      if (event.target.closest('a')) return;
      if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
      toggle();
    });
    card.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      toggle();
    });
  }

  function relativeTime(value) {
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'recently';
    var seconds = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));
    var units = [['year', 31557600], ['month', 2629800], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
    for (var index = 0; index < units.length; index += 1) {
      if (seconds >= units[index][1]) {
        var amount = Math.floor(seconds / units[index][1]);
        return amount + ' ' + units[index][0] + (amount === 1 ? '' : 's') + ' ago';
      }
    }
    return 'just now';
  }

  function createIcon(type) {
    var namespace = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(namespace, 'svg');
    svg.setAttribute('class', 'repo-meta-icon repo-' + type + '-icon');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    if (type === 'star') {
      var star = document.createElementNS(namespace, 'path');
      star.setAttribute('d', 'M12 2.8l2.8 5.7 6.3.9-4.6 4.4 1.1 6.3-5.6-3-5.6 3 1.1-6.3-4.6-4.4 6.3-.9z');
      svg.appendChild(star);
      return svg;
    }
    var branch = document.createElementNS(namespace, 'path');
    branch.setAttribute('d', 'M7 6v7a4 4 0 0 0 4 4h6M17 6v12');
    svg.appendChild(branch);
    [[7, 4], [17, 4], [17, 20]].forEach(function (point) {
      var circle = document.createElementNS(namespace, 'circle');
      circle.setAttribute('cx', point[0]);
      circle.setAttribute('cy', point[1]);
      circle.setAttribute('r', '2');
      svg.appendChild(circle);
    });
    return svg;
  }

  function createStat(type, value, label) {
    var stat = createElement('span', 'meta-stat');
    stat.setAttribute('aria-label', value + ' ' + label);
    stat.appendChild(createIcon(type));
    stat.appendChild(document.createTextNode(String(value)));
    return stat;
  }

  function createRepositoryCard(repo) {
    var item = createElement('li', 'card-item');
    var link = createElement('a', 'portfolio-card');
    link.href = repo.html_url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    var content = createElement('div', 'card-content');
    content.appendChild(createElement('h3', 'card-title', repo.name));
    if (repo.homepage) content.appendChild(createElement('span', 'card-url', repo.homepage));
    content.appendChild(createElement('p', 'card-description', repo.description || 'No description provided.'));
    content.appendChild(createElement('small', 'card-date', 'Last updated ' + relativeTime(repo.pushed_at)));
    var meta = createElement('footer', 'card-meta');
    if (repo.language) meta.appendChild(createElement('span', 'meta-language', repo.language));
    meta.appendChild(createStat('star', repo.stargazers_count, 'stars'));
    meta.appendChild(createStat('fork', repo.forks_count, 'forks'));
    link.appendChild(content);
    link.appendChild(meta);
    item.appendChild(link);
    return item;
  }

  async function loadRepositories() {
    var list = document.querySelector('[data-repositories]');
    var status = document.querySelector('[data-repos-status]');
    if (!list || !status) return;
    try {
      var repositories = [];
      var page = 1;
      var batch;
      do {
        batch = await fetchJson('https://api.github.com/users/andrei-galkin/repos?per_page=100&page=' + page);
        repositories = repositories.concat(batch);
        page += 1;
      } while (batch.length === 100);
      repositories = repositories.filter(function (repo) { return !repo.fork; });
      var featured = (config.projects && config.projects.featuredRepositories) || [];
      repositories.sort(function (a, b) {
        var aPriority = featured.indexOf(a.name);
        var bPriority = featured.indexOf(b.name);
        if (aPriority !== -1 || bPriority !== -1) {
          if (aPriority === -1) return 1;
          if (bPriority === -1) return -1;
          return aPriority - bPriority;
        }
        return b.stargazers_count - a.stargazers_count;
      });
      var fragment = document.createDocumentFragment();
      repositories.forEach(function (repo) { fragment.appendChild(createRepositoryCard(repo)); });
      list.replaceChildren(fragment);
      status.textContent = repositories.length ? '' : 'No projects are available right now.';
    } catch (error) {
      status.textContent = '';
      status.appendChild(document.createTextNode('Projects could not be loaded. '));
      var fallback = createElement('a', '', 'Visit GitHub directly.');
      fallback.href = profile.githubUrl;
      fallback.target = '_blank';
      fallback.rel = 'noopener noreferrer';
      status.appendChild(fallback);
    }
  }

  function normalizeArticle(item, source) {
    var container = document.createElement('div');
    container.innerHTML = item.description || item.content || '';
    var date = item.pubDate ? new Date(item.pubDate) : null;
    var validDate = date && !Number.isNaN(date.getTime());
    return {
      title: item.title || 'Untitled article',
      description: container.textContent.replace(/\s+/g, ' ').trim(),
      date: validDate ? date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '',
      isoDate: validDate ? date.toISOString() : '',
      tags: Array.isArray(item.categories) ? item.categories : [],
      url: item.link,
      source: source || 'Publication'
    };
  }

  function createArticleCard(article) {
    var item = createElement('li', 'card-item');
    var link = createElement('a', 'portfolio-card');
    link.href = article.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    var content = createElement('div', 'card-content');
    content.appendChild(createElement('span', 'article-source', article.source));
    content.appendChild(createElement('h3', 'card-title', article.title));
    if (article.description) content.appendChild(createElement('p', 'card-description', article.description));
    if (article.date) {
      var time = createElement('time', 'card-date', 'Published ' + article.date);
      time.dateTime = article.isoDate;
      content.appendChild(time);
    }
    if (article.tags.length) {
      var tags = createElement('ul', 'article-tags');
      tags.setAttribute('aria-label', 'Topics');
      article.tags.forEach(function (tag) { tags.appendChild(createElement('li', '', tag)); });
      content.appendChild(tags);
    }
    link.appendChild(content);
    link.appendChild(createElement('footer', 'card-meta article-footer', 'Read at ' + article.source + ' →'));
    item.appendChild(link);
    return item;
  }

  async function loadArticles() {
    var list = document.querySelector('[data-articles]');
    var status = document.querySelector('[data-articles-status]');
    if (!list || !status) return;
    var articleConfig = config.articles || {};
    var feed = (articleConfig.feeds || [])[0];
    try {
      var articles = articleConfig.items || [];
      if (!articles.length && feed) {
        var data = await fetchJson('https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(feed.url));
        if (data.status !== 'ok') throw new Error(data.message || 'Feed request failed');
        articles = (data.items || []).map(function (item) { return normalizeArticle(item, feed.source); });
      }
      var fragment = document.createDocumentFragment();
      articles.forEach(function (article) {
        if (article.url) fragment.appendChild(createArticleCard(article));
      });
      list.replaceChildren(fragment);
      status.textContent = list.children.length ? '' : 'No articles are configured yet.';
    } catch (error) {
      status.textContent = 'Articles could not be loaded.';
      if (feed && feed.profileUrl) {
        status.appendChild(document.createTextNode(' '));
        var fallback = createElement('a', '', 'Visit ' + (feed.source || 'the publication') + ' directly.');
        fallback.href = feed.profileUrl;
        fallback.target = '_blank';
        fallback.rel = 'noopener noreferrer';
        status.appendChild(fallback);
      }
    }
  }

  initializeProfileCard();
  loadRepositories();
  loadArticles();
}());
