(function(_) {
  function initDefaults(schema, defaults) {
    Object.keys(defaults).forEach(function(name) {
      schema.define(name, typeof(defaults[name]), defaults[name]);
    });
  }

  function initSection(script) {
    var section = document.createElement('section');

    [].slice.call(script.attributes).forEach(function(attr) {
      if (attr.nodeName != 'type')
        section.setAttribute(attr.nodeName, attr.value);
    });

    section.setAttribute('data-template', script.textContent);
    script.parentNode.replaceChild(section, script);
  }

  function buildContext(story) {
    var context = {};

    Object.keys(story.now).forEach(function(name) {
      var value = story.now[name];

      Object.defineProperty(context, name, {
        get: function() { return value; },
        set: function(newValue) { value = story.next[name] = newValue; }
      });
    });

    return context;
  }

  function initTemplatedStory(story) {
    if (story.globalParent === document.body && window.defaults)
      initDefaults(story.schema, window.defaults);
    story.parent.classList.add('cooa-no-debug-x-ray');
    story.$all('script[type="text/html-section"]').forEach(initSection);
    story.parent.addEventListener('cooasectionshow', function(e) {
      var section = e.target;
      var templateSource = section.getAttribute('data-template');
      var template;

      if (!templateSource) return;
      template = _.template(templateSource);
      section.innerHTML = template(buildContext(story));

      story.refresh();
    }, false);
    story.refresh();
  }

  document.documentElement.addEventListener('cooainit', function(e) {
    initTemplatedStory(e.detail.story);
  }, false);
})(_);
