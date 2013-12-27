(function() {
  function splitSections(markdown) {
    var rawSections = markdown.split(/^#([A-Za-z0-9_\-]+)/m);
    var sections = [];

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

    [].slice.call(cooa.attributes).forEach(function(attr) {
      if (attr.nodeName != 'type')
        story.setAttribute(attr.nodeName, attr.value);
    });
    story.classList.add('cooa');

    splitSections(cooa.textContent).forEach(function(section) {
      story.appendChild(makeSection(section));
    });

    cooa.parentNode.replaceChild(story, cooa);
  }

  var html = document.documentElement;

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
