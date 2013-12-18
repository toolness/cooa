var COOA = (function() {
  var COOA = {story: null};

  var Events = COOA.Events = {
    // This was lifted from Backbone.Events.

    // Regular expression used to split event strings
    eventSplitter: /\s+/,

    // Bind one or more space separated events, `events`, to a `callback`
    // function. Passing `"all"` will bind the callback to all events fired.
    on: function(events, callback, context) {

      var calls, event, node, tail, list;
      if (!callback) return this;
      events = events.split(this.eventSplitter);
      calls = this._callbacks || (this._callbacks = {});

      // Create an immutable callback list, allowing traversal during
      // modification.  The tail is an empty object that will always be used
      // as the next node.
      while (event = events.shift()) {
        list = calls[event];
        node = list ? list.tail : {};
        node.next = tail = {};
        node.context = context;
        node.callback = callback;
        calls[event] = {tail: tail, next: list ? list.next : node};
      }

      return this;
    },

    // Remove one or many callbacks. If `context` is null, removes all
    // callbacks with that function. If `callback` is null, removes all
    // callbacks for the event. If `events` is null, removes all bound
    // callbacks for all events.
    off: function(events, callback, context) {
      var event, calls, node, tail, cb, ctx;

      // No events, or removing *all* events.
      if (!(calls = this._callbacks)) return;
      if (!(events || callback || context)) {
        delete this._callbacks;
        return this;
      }

      // Loop through the listed events and contexts, splicing them out of the
      // linked list of callbacks if appropriate.
      events = events ? events.split(this.eventSplitter) : Object.keys(calls);
      while (event = events.shift()) {
        node = calls[event];
        delete calls[event];
        if (!node || !(callback || context)) continue;
        // Create a new list, omitting the indicated callbacks.
        tail = node.tail;
        while ((node = node.next) !== tail) {
          cb = node.callback;
          ctx = node.context;
          if ((callback && cb !== callback) || (context && ctx !== context)) {
            this.on(event, cb, ctx);
          }
        }
      }

      return this;
    },

    // Trigger one or many events, firing all bound callbacks. Callbacks are
    // passed the same arguments as `trigger` is, apart from the event name
    // (unless you're listening on `"all"`, which will cause your callback to
    // receive the true name of the event as the first argument).
    trigger: function(events) {
      var event, node, calls, tail, args, all, rest;
      if (!(calls = this._callbacks)) return this;
      all = calls.all;
      events = events.split(this.eventSplitter);
      rest = Array.prototype.slice.call(arguments, 1);

      // For each event, walk through the linked list of callbacks twice,
      // first to trigger the event, then to trigger any `"all"` callbacks.
      while (event = events.shift()) {
        if (node = calls[event]) {
          tail = node.tail;
          while ((node = node.next) !== tail) {
            node.callback.apply(node.context || this, rest);
          }
        }
        if (node = all) {
          tail = node.tail;
          args = [event].concat(rest);
          while ((node = node.next) !== tail) {
            node.callback.apply(node.context || this, args);
          }
        }
      }

      return this;
    },

    mixin: function(target) {
      ['on', 'off', 'trigger', 'eventSplitter'].forEach(function(name) {
        target[name] = this[name];
      }, this);
      return target;
    }
  };

  var Story = COOA.Story = function Story(options) {
    function $(selector) {
      try {
        return parent.querySelector(selector);
      } catch (e) { return null; }
    };

    function highlightBrokenLinks() {
      var links = parent.querySelectorAll('a[href^="#"]');
      var link, sectionName;

      for (var i = 0; i < links.length; i++) {
        link = links[i];
        sectionName = link.getAttribute('href').slice(1);
        if (sectionName && !$('section#' + sectionName))
          link.classList.add('cooa-broken');
      }
    }

    function showSection(name) {
      var oldSection = $('section.cooa-active');
      var newSection = $('section#' + name) || $('section');

      if (oldSection) oldSection.classList.remove('cooa-active');
      if (newSection) newSection.classList.add('cooa-active');
    };

    function setDebugMode(enabled) {
      if (enabled)
        parent.classList.add('cooa-debug');
      else
        parent.classList.remove('cooa-debug');
    }

    function hookupDebugCheckbox(checkbox) {
      function update() {
        storage.set('cooa-debug', checkbox.checked);
        setDebugMode(checkbox.checked);
      };

      checkbox.checked = !!storage.get('cooa-debug');
      checkbox.addEventListener('change', update, false);
      update();
    }

    var parent = options.parent;
    var globalParent = options.globalParent || parent;
    var storage = options.storage;
    var self = Events.mixin({
      $: $,
      showSection: showSection,
      setDebugMode: setDebugMode,
      storage: storage
    });

    highlightBrokenLinks();
    globalParent.addEventListener('click', function(e) {
      if (e.target.nodeName == 'A') {
        var href = e.target.getAttribute('href');

        if (!(href && href[0] == '#')) return;
        self.trigger('sectionchange', {
          section: href.slice(1),
          preventDefault: e.preventDefault.bind(e)
        });
      }
    }, true);
    if (options.debugCheckbox) hookupDebugCheckbox(options.debugCheckbox);

    return self;
  };

  var Storage = COOA.Storage = function Storage(store) {
    return {
      set: function set(name, value) {
        try {
          store[name] = JSON.stringify(value);
        } catch (e) {};
      },
      get: function get(name) {
        try {
          return JSON.parse(store[name]);
        } catch (e) { return null; }
      }
    };
  };

  var init = function init() {
    function initTopLevel() {
      function showCurrentSection() {
        story.showSection(window.location.hash.slice(1));
      }

      window.addEventListener('hashchange', showCurrentSection, false);
      showCurrentSection();
    }

    function initEmbedded() {
      // We might be in jsbin or thimble or another two-pane editor,
      // which often handle named anchors poorly, so we'll handle
      // them ourselves.
      story.on('sectionchange', function(e) {
        story.showSection(e.section);
        storage.set('cooa-section', e.section);
        e.preventDefault();
      });

      // Two-pane editors don't always retain scroll position, so we'll
      // do that ourselves too.
      window.addEventListener('load', function() {
        scrollTo(0, storage.get('cooa-scroll') || 0);
        setInterval(function() {
          storage.set('cooa-scroll', window.pageYOffset);
        }, 1000);
      }, false);

      story.showSection(storage.get('cooa-section') || '');
    }

    var parent = document.querySelector('.cooa');
    var storage = Storage(window.sessionStorage);
    var story;

    if (!parent) return;

    story = COOA.story = Story({
      parent: parent,
      globalParent: document.body,
      storage: storage,
      debugCheckbox: document.querySelector('input#cooa-debug')
    });

    window.parent === window ? initTopLevel() : initEmbedded();
  };

  window.addEventListener("DOMContentLoaded", init, false);

  return COOA;
})();
