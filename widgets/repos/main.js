define(['text!./repos.html', 'underscore'], function (tpl, _) {

  var template = _.template(tpl);

  return {

    defaultParams: {
      per_page: 100,
      page: 1
    },

    initialize: function () {
      _.bindAll(this);
      this.setupPath();
      this.setupParams();
      this.fetch();
    },

    setupParams: function() {
      var params = this.defaultParams;
      _.each(_.keys(this.defaultParams), function(key) {
        if (this.options[key] != undefined) {
          params[key] = this.options[key];
        }
      }.bind(this));
      this.params = params;
    },

    setupPath: function() {
      if (this.options.path) {
        this.owner = this.options.path.split("/")[0];
        this.path = this.options.path;
        if (!/\/repos$/.test(this.path)) {
          this.path = this.path + '/repos';
        }
      } else if (this.options.user) {
        this.owner = this.options.user;
        this.path = 'users/' + this.options.user + '/repos';
      } else if (this.options.org) {
        this.owner = this.options.org;
        this.path = 'orgs/' + this.options.org + '/repos';
      } else {
        this.owner = 'user';
        this.path = 'user/repos';
      }
    },

    fetch: function() {
      if (!this.path) return;
      this.fetchPage(1, []);
    },

    fetchPage: function(page, allRepos) {
      var params = _.extend({}, this.params, { page: page, per_page: 100 });
      this.sandbox.github(this.path, 'get', params).then(function(repos){
        allRepos = allRepos.concat(repos);
        if (repos.length === params.per_page) {
          this.fetchPage(page + 1, allRepos);
          return;
        }
        // Remove forked repositories 
        // we have to do this client side, Github API does not seem
        // to allow filtering on unauthenticated calls
        repos = _.reject(allRepos, function(repo) {
          return (repo.fork);
        });
        // And sort by popularity
        var config = (window.siteConfig && window.siteConfig.projects) || {};
        var featured = config.featuredRepositories || [];
        repos = _.sortBy(repos, function(repo) {
          var priority = _.indexOf(featured, repo.name);
          return priority < 0 ? featured.length + 100000 - repo.watchers_count : priority;
        });
        this.render(repos);
      }.bind(this), this.renderError);
    },

    render: function (repos) {
      this.html(template({
        repos: repos,
        relativeTime: this.sandbox.relativeTime,
        _: _
      }));
      this.sandbox.dom.attachEvents(this.events, this);
      var status = document.querySelector('[data-repos-status]');
      if (status) status.textContent = repos.length ? '' : 'No projects are available right now.';
    },
    renderError: function () {
      var status = document.querySelector('[data-repos-status]');
      if (status) status.textContent = 'Projects could not be loaded. Visit GitHub to browse them directly.';
    },

    events: {
      'click .item-content': function(e) {
        if(!$(e.target).is('a')){
          var href = e.currentTarget.getAttribute('data-href');
          window.open(href);
        }
      }
    }
  };

});
