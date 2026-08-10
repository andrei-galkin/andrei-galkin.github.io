define(['text!./articles.html', 'underscore'], function (tpl, _) {
  var template = _.template(tpl);
  return {
    initialize: function () {
      this.fetch();
    },
    fetch: function () {
      var widget = this;
      var feedUrl = 'https://medium.com/feed/@andron.galkin';
      var apiUrl = 'https://api.rss2json.com/v1/api.json?rss_url=' +
        encodeURIComponent(feedUrl);

      $.getJSON(apiUrl)
        .done(function (data) {
          if (data.status !== 'ok') {
            widget.renderError();
            return;
          }

          var articles = _.map(data.items, function (article) {
            var description = $('<div>').html(
              article.description || article.content || ''
            ).text().replace(/\s+/g, ' ').trim();

            return {
              title: article.title,
              link: article.link,
              description: description,
              date: new Date(article.pubDate).toLocaleDateString(
                'en-US',
                { year: 'numeric', month: 'short', day: 'numeric' }
              )
            };
          });

          widget.html(template({ articles: articles, _: _ }));
          widget.sandbox.dom.attachEvents(widget.events, widget);
          window.mixPortfolioBlocks();
        })
        .fail(function () {
          widget.renderError();
        });
    },
    renderError: function () {
      this.$el.html(
        '<li class="item"><div class="content">' +
        '<a href="https://medium.com/@andron.galkin">' +
        'Read articles on Medium →</a></div></li>'
      );
    },
    events: {
      'click .item-content': function (event) {
        if (!$(event.target).is('a')) {
          window.open(event.currentTarget.getAttribute('data-href'), '_blank');
        }
      }
    }
  };
});
