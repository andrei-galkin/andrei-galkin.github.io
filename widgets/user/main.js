define(['text!./user.html', 'underscore'], function(tpl, _) {
  var template = _.template(tpl);

  return {
    initialize: function() {
      _.bindAll(this);
      this.options.style = this.options.style || 'small';
      if (this.options.user) {
        this.path = "users/" + this.options.user;
      } else {
        this.path = "orgs/" + this.options.org;
      }
      this.fetch();
    },

    fetch: function() {
      this.sandbox.github(this.path).then(this.render);
    },

    render: function(user) {
      this.html(template({
        user: user,
        style: this.options.style
      }));
      this.sandbox.dom.attachEvents(this.events, this);
    },


    events: {
      'click .item': function(e) {
        if(!$(e.target).is('a') && (this.options.style === 'complete' || this.options.style === 'sidebar')){
          if (this.options.style === 'sidebar' && window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
            return;
          }
          this.toggle(e.currentTarget);
        }
      },
      'keydown .item': function(e) {
        if (this.options.style === 'sidebar' && (e.key === 'Enter' || e.key === ' ' || e.keyCode === 13 || e.keyCode === 32)) {
          e.preventDefault();
          this.toggle(e.currentTarget);
        }
      }
    },

    toggle: function(element) {
      var $element = $(element);
      var flipped = !$element.hasClass('flipped');
      $element.toggleClass('flipped', flipped);
      if (this.options.style === 'sidebar') {
        $element.attr('aria-pressed', flipped ? 'true' : 'false');
        $element.attr('aria-label', flipped ? 'Andrei Galkin profile details. Activate to show photo.' : 'Andrei Galkin profile card. Activate to show details.');
      }
    }
  };

});
