var COOA = (function() {
  var COOA = {story: null, autorun: true};

  var Util = COOA.Util = {
    isHashLink: function(element) {
      if (element.nodeName == 'A') {
        var href = element.getAttribute('href');
        return (href && href[0] == '#');
      }
      return false;
    },
    extend: function(dest) {
      for (var i = 1; i < arguments.length; i++) {
        var arg = arguments[i];
        Object.keys(arg).forEach(function(key) { dest[key] = arg[key]; });
      }
      return dest;
    }
  };

  var Hash = COOA.Hash = {
    parse: function(str) {
      var pairs = (str ? str.slice(1) : '').split('&');
      var obj = {section: pairs[0] || '', now: {}};
      pairs.slice(1).forEach(function(pair) {
        var parts = pair.split('=');
        if (parts.length != 2) return;
        var name = decodeURIComponent(parts[0]);
        var nameMatch = name.match(/^now\.(.+)$/);
        if (!nameMatch) return;
        obj.now[nameMatch[1]] = decodeURIComponent(parts[1]);
      });
      return obj;
    },
    stringify: function(obj) {
      var nowNames = Object.keys(obj.now || {});
      var hash = '#' + obj.section;

      if (nowNames.length)
        hash += '&' + nowNames.map(function(name) {
          return encodeURIComponent('now.' + name) + '=' +
                 encodeURIComponent(obj.now[name]);
        }).join('&');

      return hash;
    },
    update: function(hash, obj) {
      var hashObj = Hash.parse(hash);

      return Hash.stringify({
        section: obj.section || hashObj.section,
        now: Util.extend(hashObj.now, obj.now || {})
      });
    }
  };

  var CustomEvent = function CustomEvent(type, params) {
      params = params || {bubbles: false, cancelable: false};
      var event = document.createEvent('CustomEvent');
      event.initCustomEvent(type, params.bubbles, params.cancelable,
                            params.detail);
      return event;
    };

  var Story = COOA.Story = function Story(options) {
    function $(selector) {
      try {
        return parent.querySelector(selector);
      } catch (e) { return null; }
    };

    function highlightBrokenLinks() {
      var links = parent.querySelectorAll('a[href^="#"]');
      var link, linkInfo;

      for (var i = 0; i < links.length; i++) {
        link = links[i];
        linkInfo = Hash.parse(link.getAttribute('href'));
        if (linkInfo.section && !$('section#' + linkInfo.section))
          link.classList.add('cooa-broken');
      }
    }

    function showSection(info) {
      if (!info || typeof(info) != 'object') info = Hash.parse(info);
      var oldSection = $('section.cooa-active');
      var newSection = $('section#' + info.section) || $('section');

      if (oldSection) oldSection.classList.remove('cooa-active');
      if (newSection) newSection.classList.add('cooa-active');
      self.now = info.now || {};
      self.next = JSON.parse(JSON.stringify(self.now));
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
    var storage = options.storage || Storage({});
    var self = {
      $: $,
      parent: parent,
      showSection: showSection,
      setDebugMode: setDebugMode,
      storage: storage
    };

    highlightBrokenLinks();
    globalParent.addEventListener('click', function(e) {
      if (!Util.isHashLink(e.target)) return;
      var changeEvent = CustomEvent('cooasectionchange', {
        bubbles: false,
        cancelable: true,
        detail: {href: e.target.getAttribute('href')}
      });
      parent.dispatchEvent(changeEvent);
      if (changeEvent.defaultPrevented) e.preventDefault();
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

  var init = COOA.init = function init(story) {
    function initTopLevel() {
      function showCurrentSection() {
        story.showSection(window.location.hash);
      }

      window.addEventListener('hashchange', showCurrentSection, false);
      showCurrentSection();
    }

    function initEmbedded() {
      var storage = story.storage;

      // We might be in jsbin or thimble or another two-pane editor,
      // which often handle named anchors poorly, so we'll handle
      // them ourselves.
      story.parent.addEventListener('cooasectionchange', function(e) {
        story.showSection(e.detail.href);
        storage.set('cooa-hash', e.detail.href);
        e.preventDefault();
      }, false);

      // Two-pane editors don't always retain scroll position, so we'll
      // do that ourselves too.
      window.addEventListener('load', function() {
        scrollTo(0, storage.get('cooa-scroll') || 0);
        setInterval(function() {
          storage.set('cooa-scroll', window.pageYOffset);
        }, 1000);
      }, false);

      story.showSection(storage.get('cooa-hash'));
    }

    COOA.story = story;
    window.parent === window ? initTopLevel() : initEmbedded();
  };

  window.addEventListener("DOMContentLoaded", function() {
    var parent = document.querySelector('.cooa');

    if (!(parent && COOA.autorun)) return;
    init(Story({
      parent: parent,
      globalParent: document.body,
      storage: Storage(window.sessionStorage),
      debugCheckbox: document.querySelector('input#cooa-debug')
    }));
  }, false);

  return COOA;
})();
