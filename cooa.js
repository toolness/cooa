// Dependencies: none

var COOA = (function() {
  var COOA = {story: null, autorun: true};

  var Util = COOA.Util = {
    setClass: function(element, className, enabled) {
      // We would just use classList.toggle(), but IE doesn't pay attention
      // to its second argument.
      if (typeof(enabled) == 'undefined') enabled = true;
      if (enabled)
        element.classList.add(className);
      else
        element.classList.remove(className);
    },
    isHashLink: function(element) {
      if (element.nodeName == 'A') {
        var href = element.getAttribute('href');
        return (href && href[0] == '#');
      }
      return false;
    },
    updateHashLink: function(element, obj) {
      var origHref = element.getAttribute('data-orig-href');
      if (!origHref) {
        origHref = element.getAttribute('href');
        element.setAttribute('data-orig-href', origHref);
      }
      if (origHref == '#') return;
      element.setAttribute('href', Hash.update(origHref, obj));
    },
    extend: function(dest) {
      for (var i = 1; i < arguments.length; i++) {
        var arg = arguments[i];
        Object.keys(arg).forEach(function(key) { dest[key] = arg[key]; });
      }
      return dest;
    }
  };

  var Schema = COOA.Schema = function() {
    var self = {};
    var schema = {};

    self.define = function(name, type, defaultValue) {
      if (!(type in SchemaTypes)) throw new Error('unknown type: ' + type);
      if (typeof(defaultValue) == 'undefined')
        defaultValue = SchemaTypes[type].defaultDefaultValue;

      schema[name] = {type: SchemaTypes[type], defaultValue: defaultValue};
    };

    self.parse = function(obj) {
      var result = {};

      Object.keys(schema).forEach(function(name) {
        var def = schema[name];

        if (name in obj) {
          result[name] = def.type.parse(obj[name], def.defaultValue);
        } else {
          result[name] = def.defaultValue;
        }
      });

      return result;
    };

    self.stringify = function(obj) {
      var result = {};

      Object.keys(schema).forEach(function(name) {
        var def = schema[name];

        if (name in obj && obj[name] != def.defaultValue)
          result[name] = def.type.stringify(obj[name]);
      });

      return result;
    };

    return self;
  };

  var SchemaTypes = COOA.Schema.Types = {
    'number': {
      parse: function(str, defaultValue) {
        var num = parseFloat(str);
        return isNaN(num) ? defaultValue : num;
      },
      stringify: function(value) { return value.toString(); },
      defaultDefaultValue: 0
    },
    'string': {
      parse: function(str, defaultValue) { return str; },
      stringify: function(value) { return value; },
      defaultDefaultValue: ''
    },
    'boolean': {
      parse: function(str, defaultValue) {
        if (defaultValue === true && str == 'off') return false;
        if (defaultValue === false && str == 'on') return true;
        return defaultValue;
      },
      stringify: function(value) { return value ? 'on' : 'off'; },
      defaultDefaultValue: false
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
        obj.now[name] = decodeURIComponent(parts[1]);
      });
      return obj;
    },
    stringify: function(obj) {
      var nowNames = Object.keys(obj.now || {});
      var hash = '#' + obj.section;

      nowNames = nowNames.filter(function(name) {
        return ['string', 'number'].indexOf(typeof(obj.now[name])) >= 0;
      });

      if (nowNames.length)
        hash += '&' + nowNames.map(function(name) {
          return encodeURIComponent(name) + '=' +
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

  var CustomEvent = COOA.CustomEvent = function CustomEvent(type, params) {
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
    }

    function $all(selector) {
      try {
        return [].slice.call(parent.querySelectorAll(selector));
      } catch (e) { return []; }
    }

    function refresh() {
      highlightBrokenLinks();
    }

    function highlightBrokenLinks() {
      var links = parent.querySelectorAll('a[href^="#"]');
      var link, linkInfo;

      $all('a[href^="#"]').forEach(function(link) {
        linkInfo = Hash.parse(link.getAttribute('href'));
        Util.setClass(link, 'cooa-broken', 
                      linkInfo.section && !$('section#' + linkInfo.section));
      });
    }

    function isStateChanged(section, now) {
      if (!section.classList.contains('cooa-active')) return true;
      if (!self.now) return true;

      for (var name in self.now)
        if (self.now[name] !== now[name]) return true;

      return false;
    }

    function showSection(info) {
      if (info && typeof(info) == 'object') {
        info.section = info.section ||
                       (self.activeSection ? self.activeSection.id : '');
        info.now = Util.extend({}, self.now || schema.parse({}),
                               info.now || {});
      } else {
        info = Hash.parse(info);
        info.now = schema.parse(info.now);
      }
      var oldSection = $('section.cooa-active');
      var newSection = $('section#' + info.section) || $('section');

      if (!newSection || !isStateChanged(newSection, info.now)) return;
      if (oldSection) oldSection.classList.remove('cooa-active');
      newSection.classList.add('cooa-active');
      self.hash = Hash.stringify({
        section: info.section,
        now: schema.stringify(info.now)
      });
      self.now = Object.freeze(info.now || {});
      self.next = JSON.parse(JSON.stringify(self.now));
      newSection.dispatchEvent(CustomEvent('cooasectionshow', {
        bubbles: true,
        cancelable: false,
        detail: {story: self}
      }));
    };

    function maybeUpdateLink(e) {
      if (!Util.isHashLink(e.target)) return;
      Util.updateHashLink(e.target, {now: schema.stringify(self.next)});
    }

    function setDebugMode(enabled) {
      Util.setClass(parent, 'cooa-debug', enabled);
      parent.dispatchEvent(CustomEvent('cooadebugmodechange', {
        bubbles: true,
        cancelable: false,
        detail: {story: self}
      }));
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
    var schema = Schema();
    var self = {
      $: $,
      $all: $all,
      parent: parent,
      globalParent: globalParent,
      hash: null,
      schema: schema,
      refresh: refresh,
      showSection: showSection,
      setDebugMode: setDebugMode,
      storage: storage
    };

    Object.defineProperties(self, {
      debugMode: {
        get: function() { return parent.classList.contains('cooa-debug'); }
      },
      activeSection: {
        get: function() { return $('section.cooa-active'); }
      }
    });
    refresh();
    globalParent.addEventListener('mouseover', maybeUpdateLink, true);
    globalParent.addEventListener('touchstart', maybeUpdateLink, true);
    globalParent.addEventListener('click', function(e) {
      if (!Util.isHashLink(e.target)) return;
      if (!parent.dispatchEvent(CustomEvent('cooasectionlinkclick', {
        bubbles: false,
        cancelable: true,
        detail: {href: e.target.getAttribute('href')}
      }))) e.preventDefault();
    }, true);
    parent.dispatchEvent(CustomEvent('cooainit', {
      bubbles: true,
      cancelable: false,
      detail: {story: self}
    }));
    setDebugMode(false);
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
      var inHashChange = false;

      story.parent.addEventListener('cooasectionshow', function(e) {
        if (!inHashChange) window.location.hash = story.hash;
      });
      window.addEventListener('hashchange', function() {
        if (story.hash != window.location.hash) {
          inHashChange = true;
          try {
            story.showSection(window.location.hash);
          } finally { inHashChange = false; }
        }
      }, false);
      story.showSection(window.location.hash);
    }

    function initEmbedded() {
      var storage = story.storage;

      // We might be in jsbin or thimble or another two-pane editor,
      // which often handle named anchors poorly, so we'll handle
      // them ourselves.
      story.parent.addEventListener('cooasectionshow', function(e) {
        storage.set('cooa-hash', story.hash);
      });
      story.parent.addEventListener('cooasectionlinkclick', function(e) {
        story.showSection(e.detail.href);
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
