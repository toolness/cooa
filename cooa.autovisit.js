(function() {
  function Autovisit(story) {
    function isSectionVisited(sectionID) {
      return story.now[varName(sectionID)];
    }

    function refresh() {
      findAll(story.parent, '[data-show-if-visited]').forEach(function(el) {
        var sectionID = el.getAttribute('data-show-if-visited');
        COOA.Util.setClass(el, 'cooa-hidden', !isSectionVisited(sectionID));
      });
    }

    function findSectionsToTrack() {
      var sectionIDs = {};
      findAll(story.parent, '[data-show-if-visited]').forEach(function(el) {
        var sectionID = el.getAttribute('data-show-if-visited');
        sectionIDs[sectionID] = true;
      });
      return Object.keys(sectionIDs);
    }

    var sectionsToTrack = findSectionsToTrack();

    story.parent.addEventListener('cooasectionshow', function(e) {
      var sectionID = e.target.id;

      refresh();

      if (sectionsToTrack.indexOf(sectionID) >= 0)
        story.next[varName(sectionID)] = true;
    }, false);

    sectionsToTrack.forEach(function(sectionID) {
      story.schema.define(varName(sectionID), 'boolean', false);
    });

    return {
      refresh: refresh
    };
  }

  function findAll(element, selector) {
    return [].slice.call(element.querySelectorAll(selector));
  }

  function varName(sectionID) {
    return 'vis_' + sectionID;
  }

  document.documentElement.addEventListener('cooainit', function(e) {
    var story = e.detail.story;

    story.autovisit = Autovisit(story);
  }, false);
})();
