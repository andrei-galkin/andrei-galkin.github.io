define(['text!./articles.html', 'underscore'], function (tpl, _) {
  var template = _.template(tpl);
  return {
    initialize: function () {
      var config = (window.siteConfig && window.siteConfig.articles) || {};
      if ((config.items || []).length) return this.render(config.items);
      var feed = (config.feeds || [])[0];
      if (!feed) return this.render([]);
      this.fetchFeed(feed);
    },
    fetchFeed: function (feed) {
      var widget = this;
      $.getJSON('https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(feed.url)).done(function (data) {
        if (data.status !== 'ok') return widget.renderError(feed);
        widget.render(_.map(data.items || [], function (item) {
          var description = $('<div>').html(item.description || item.content || '').text().replace(/\s+/g, ' ').trim();
          var date = item.pubDate ? new Date(item.pubDate) : null;
          return { title:item.title, description:description, date:date ? date.toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}) : '', isoDate:date ? date.toISOString() : '', tags:item.categories || [], url:item.link, source:feed.source || 'Publication' };
        }));
      }).fail(function () { widget.renderError(feed); });
    },
    render: function (articles) {
      this.html(template({ articles: articles, _: _ }));
      this.sandbox.dom.attachEvents(this.events, this);
      var status=document.querySelector('[data-articles-status]');
      if(status) status.textContent=articles.length ? '' : 'No articles are configured yet.';
    },
    renderError: function (feed) {
      var status=document.querySelector('[data-articles-status]');
      if(status) status.innerHTML='Articles could not be loaded. <a href="'+_.escape(feed.profileUrl || '#')+'" target="_blank" rel="noopener noreferrer">Visit '+_.escape(feed.source || 'the publication')+' directly</a>.';
    },
    events: {'click .item-content': function (event) { if (!$(event.target).is('a')) window.open(event.currentTarget.getAttribute('data-href'),'_blank'); }}
  };
});
