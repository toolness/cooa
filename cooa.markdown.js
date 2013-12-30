// Dependencies: cooa.js, cooa.template.js, vendor/showdown.js

(function() {
  function splitSections(markdown) {
    var rawSections = markdown.split(/^SECTION:\s*([A-Za-z0-9_\-]+)/m);
    var sections = [];

    sections.preamble = rawSections[0] || null;
    for (var i = 1; i < rawSections.length; i += 2)
      sections.push({
        id: rawSections[i],
        source: rawSections[i+1].trim()
      });

    return sections;
  }

  function makeSection(info) {
    var section = document.createElement('section');

    section.setAttribute('id', info.id);
    section.setAttribute('data-template', info.source);

    return section;
  }

  function init() {
    var cooa = document.querySelector('script[type=cooa]');

    if (!cooa) return;

    var story = document.createElement('div');
    var sections;

    [].slice.call(cooa.attributes).forEach(function(attr) {
      if (attr.nodeName != 'type')
        story.setAttribute(attr.nodeName, attr.value);
    });
    story.classList.add('cooa');

    sections = splitSections(cooa.textContent);
    if (sections.preamble)
      story.setAttribute('data-preamble', sections.preamble);
    sections.forEach(function(section) {
      story.appendChild(makeSection(section));
    });

    cooa.parentNode.replaceChild(story, cooa);
  }

  var html = document.documentElement;

  html.addEventListener('cooainit', function(e) {
    var story = e.detail.story;
    var preamble = story.parent.getAttribute('data-preamble');
    var origWindowKeys = Object.keys(window);

    if (!preamble) return;

    try {
      (COOA.Template.compile(preamble))({});
      Object.keys(window).filter(function(key) {
        return origWindowKeys.indexOf(key) == -1;
      }).forEach(function(key) {
        story.schema.define(key, typeof(window[key]), window[key]);
        delete window[key];
      });
    } catch (e) {
      COOA.Template.showError(story.parent, e, 'Story init error');
    }
  }, false);

  html.addEventListener('cooatemplaterender', function(e) {
    var story = e.detail.story;
    var section = e.target;
    var converter = new Showdown.converter();

    section.innerHTML = converter.makeHtml(e.detail.rendered);
    story.refresh();
    e.preventDefault();
  }, false);

  init();
})();
