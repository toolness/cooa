(function() {
  function Autovisit(story) {
    function refresh() {
      findAll(story.parent, '[data-show-if-visited]').forEach(function(el) {
        var sectionID = el.getAttribute('data-show-if-visited');
        COOA.Util.setClass(el, 'cooa-hidden',
                           story.now[varName(sectionID)] != 'on');
      });
    }

    function shouldSectionBeTracked(id) {
      var selector = '[data-show-if-visited="' + id + '"]';
      return !!story.parent.querySelector(selector);
    }

    story.parent.addEventListener('cooasectionshow', function(e) {
      var sectionID = e.target.id;

      refresh();

      if (shouldSectionBeTracked(sectionID))
        story.next[varName(sectionID)] = 'on';
    });

    return {
      refresh: refresh
    };
  }

  function findAll(element, selector) {
    return [].slice.call(element.querySelectorAll(selector));
  }

  function varName(sectionID) {
    return 'av.' + sectionID;
  }

  document.documentElement.addEventListener('cooainit', function(e) {
    var story = e.detail.story;

    story.autovisit = Autovisit(story);
  }, false);
})();
