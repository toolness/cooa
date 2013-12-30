// Dependencies: cooa.js

(function() {
  function Autovisit(story) {
    function isSectionVisited(sectionID) {
      return story.now[varName(sectionID)];
    }

    function refresh() {
      story.$all('[data-show-if-visited]').forEach(function(el) {
        var sectionID = el.getAttribute('data-show-if-visited');
        COOA.Util.setClass(el, 'cooa-hidden', !isSectionVisited(sectionID));
      });
    }

    function findSectionsToTrack() {
      var sectionIDs = {};
      story.$all('[data-show-if-visited]').forEach(function(el) {
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

  function varName(sectionID) {
    return 'visited_' + sectionID;
  }

  document.documentElement.addEventListener('cooainit', function(e) {
    var story = e.detail.story;

    story.autovisit = Autovisit(story);
  }, false);
})();
