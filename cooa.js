var COOA = (function() {
  function $(selector) {
    try {
      return document.querySelector(selector);
    } catch (e) { return null; }
  };

  function highlightBrokenLinks() {
    var links = document.querySelectorAll('a[href^="#"]');
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

  function showCurrentSection() { showSection(location.hash.slice(1)); }

  function processDebugCheckbox() {
    storage.set('cooa-debug', debugCheckbox.checked);
    if (debugCheckbox.checked)
      $('body').classList.add('cooa-debug');
    else
      $('body').classList.remove('cooa-debug');
  };

  function init() {
    debugCheckbox = $('input#cooa-debug[type=checkbox]');

    if (debugCheckbox) {
      debugCheckbox.checked = !!storage.get('cooa-debug');
      debugCheckbox.addEventListener('change', processDebugCheckbox, false);
      processDebugCheckbox();
    }
    window.addEventListener('hashchange', showCurrentSection, false);
    showCurrentSection();
    highlightBrokenLinks();

    if (window.parent !== window) {
      // We might be in jsbin or thimble or another two-pane editor,
      // which often handle named anchors poorly, so we'll handle
      // them ourselves.
      document.addEventListener('click', function(e) {
        if (e.target.nodeName == 'A') {
          var href = e.target.getAttribute('href');

          if (!(href && href[0] == '#')) return;
          showSection(href.slice(1));
          storage.set('cooa-section', href.slice(1));
          e.preventDefault();
        }
      }, true);

      // Two-pane editors don't always retain scroll position, so we'll
      // do that ourselves too.
      window.addEventListener('load', function() {
        scrollTo(0, storage.get('cooa-scroll') || 0);
        setInterval(function() {
          storage.set('cooa-scroll', window.pageYOffset);
        }, 1000);
      }, false);

      showSection(storage.get('cooa-section') || '');
    }
  }

  var debugCheckbox;
  var storage = {
    set: function set(name, value) {
      try {
        sessionStorage[name] = JSON.stringify(value);
      } catch (e) {};
    },
    get: function get(name) {
      try {
        return JSON.parse(sessionStorage[name]);
      } catch (e) { return null; }
    }
  };

  window.addEventListener("DOMContentLoaded", init, false);

  return {$: $, showSection: showSection, storage: storage};
})();
