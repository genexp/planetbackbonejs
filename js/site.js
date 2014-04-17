var App = {
  Models: { Instances: {} },
  Collections: { Instances: {} },
  Views: { Instances: {} }
};

function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

App.Models.Site = Backbone.Model.extend({

  url: function() {
    var feedUrl = encodeURIComponent(this.get('feed'));
    return 'https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20xml%20where%20url%3D\'' + feedUrl + '\'&format=json&diagnostics=true&callback=?';
  },

  fetch: function(options) {
    var self = this;
    var url = this.url();

    $.get(url, function(response) {
      var results = response.query.results;
      if(results) {
        var post = new App.Models.Post(results.rss.channel.item[0]);
        post.set('author', self.get('author'));

        App.Collections.Instances.posts.add(post);
      }
    });
  },

  initialize: function() {
    this.fetch();
  }

});

App.Models.Post = Backbone.Model.extend({});

App.Collections.Sites = Backbone.Collection.extend({

  model: App.Models.Site,

  url: '/config.json',

  initialize: function() {
    this.fetch();
  }

});

App.Collections.Posts = Backbone.Collection.extend({

  model: App.Models.Post,

  initialize: function() {
    this.on('add', this.sort, this);
  },

  comparator: function(model) {
    var pubDate = new Date(model.get('pubDate'));
    return -pubDate.getTime();
  }

});

App.Views.Sites = Backbone.View.extend({

  el: '#sites ol',

  template: _.template($('#site-template').html()),

  initialize: function(options) {
    this.collection = options.collection;

    this.collection.on('sync', this.render, this);
  },

  render: function() {
    var self = this;

    this.collection.each(function(site) {
      self.$el.append(self.template(site.toJSON()));
    });
  }

});

App.Views.Posts = Backbone.View.extend({

  el: '#posts',

  template: _.template($('#post-template').html()),

  initialize: function(options) {
    this.collection = options.collection;

    this.collection.on('sort', this.render, this);
  },

  render: function() {
    var self = this;

    this.$el.empty();
    this.collection.each(function(post) {
      self.$el.append(self.template(post.toJSON()));
    });
  }

});

App.Collections.Instances.sites = new App.Collections.Sites();
App.Collections.Instances.posts = new App.Collections.Posts();

App.Views.Instances.sites = new App.Views.Sites({ collection: App.Collections.Instances.sites });
App.Views.Instances.posts = new App.Views.Posts({ collection: App.Collections.Instances.posts });
