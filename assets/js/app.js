require(['aura/aura'], function (Aura) {
  window.mixPortfolioBlocks = function () {
    var repoList = document.querySelector('[data-aura-widget="repos"]');
    var articleList = document.querySelector('[data-aura-widget="articles"]');
    if (!repoList || !articleList) return;

    var repos = Array.prototype.slice.call(repoList.children);
    var articles = Array.prototype.slice.call(articleList.children);
    if (!repos.length || !articles.length) return;

    var fragment = document.createDocumentFragment();
    var interval = Math.max(1, Math.ceil(repos.length / articles.length));
    var repoIndex = 0;
    var articleIndex = 0;

    while (repoIndex < repos.length || articleIndex < articles.length) {
      for (var count = 0; count < interval && repoIndex < repos.length; count++) {
        fragment.appendChild(repos[repoIndex++]);
      }
      if (articleIndex < articles.length) {
        fragment.appendChild(articles[articleIndex++]);
      }
    }

    repoList.appendChild(fragment);
  };

  var app = new Aura({
    github: { }
  });
  app.use('assets/js/extensions/aura-github');
  app.use('assets/js/extensions/aura-attachEvents');
  app.use(function(app) {
    window.App = app.createSandbox();
  });
  app.use('assets/js/extensions/aura-time');
  app.start({ widgets: 'body' });
});
