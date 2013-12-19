(function() {
  function findAll(element, selector) {
    return [].slice.call(element.querySelectorAll(selector));
  }

  function varName(sectionID) {
    return 'av.' + sectionID;
  }

  function setVisitedVisibility(story, section) {
    findAll(section, '[data-show-if-visited]').forEach(function(el) {
      var sectionID = el.getAttribute('data-show-if-visited');
      el.style.display = story.now[varName(sectionID)] == 'on' ? '' : 'none';
    });
  }

  function shouldSectionBeTracked(id, parent) {
    return !!parent.querySelector('[data-show-if-visited="' + id + '"]');
  }

  document.documentElement.addEventListener('cooasectionshow', function(e) {
    var story = e.detail.story;
    var sectionID = e.target.id;

    setVisitedVisibility(story, e.target);

    if (shouldSectionBeTracked(sectionID, story.parent))
      story.next[varName(sectionID)] = 'on';
  });
})();
