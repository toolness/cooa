(function() {
  function findAll(element, selector) {
    return [].slice.call(element.querySelectorAll(selector));
  }

  function varName(sectionID) {
    return 'av.' + sectionID;
  }

  function setVisitedVisibility(story) {
    findAll(story.parent, '[data-show-if-visited]').forEach(function(el) {
      var sectionID = el.getAttribute('data-show-if-visited');
      if (story.now[varName(sectionID)] == 'on')
        el.classList.remove('cooa-hidden');
      else
        el.classList.add('cooa-hidden');
    });
  }

  function shouldSectionBeTracked(id, parent) {
    return !!parent.querySelector('[data-show-if-visited="' + id + '"]');
  }

  document.documentElement.addEventListener('cooasectionshow', function(e) {
    var story = e.detail.story;
    var sectionID = e.target.id;

    setVisitedVisibility(story);

    if (shouldSectionBeTracked(sectionID, story.parent))
      story.next[varName(sectionID)] = 'on';
  });
})();
