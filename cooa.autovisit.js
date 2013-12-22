(function() {
  function Autovisit(story) {
    function isSectionVisited(sectionID) {
      return story.now[varName(sectionID)] == 'on';
    }

    function refresh() {
      findAll(story.parent, '[data-show-if-visited]').forEach(function(el) {
        var sectionID = el.getAttribute('data-show-if-visited');
        COOA.Util.setClass(el, 'cooa-hidden', !isSectionVisited(sectionID));
      });
    }

    function shouldSectionBeTracked(id) {
      var selector = '[data-show-if-visited="' + id + '"]';
      return !!story.parent.querySelector(selector);
    }

    function addToDebugGUI() {
      function updateDisplays() {
        controllers.forEach(function(c) { c.updateDisplay(); });
      }

      function findSectionsToTrack() {
        var sectionIDs = {};
        findAll(parent, '[data-show-if-visited]').forEach(function(el) {
          var sectionID = el.getAttribute('data-show-if-visited');
          sectionIDs[sectionID] = true;
        });
        return Object.keys(sectionIDs);
      }

      var gui = story.debugGUI;
      var parent = story.parent;
      var model = {};
      var controllers = [];

      findSectionsToTrack().forEach(function(sectionID) {
        var prop = varName(sectionID);

        Object.defineProperty(model, prop, {
          get: function() {
            return isSectionVisited(sectionID);
          },
          set: function(value) {
            var updates = {now: {}};
            updates.now[prop] = value ? 'on' : undefined;
            story.showSection(COOA.Hash.update(story.hash, updates));
          }
        });
        controllers.push(gui.add(model, prop));
      });

      parent.addEventListener('cooasectionshow', updateDisplays, false);
      parent.addEventListener('cooadebugguishutdown', function remove() {
        parent.removeEventListener('cooasectionshow', updateDisplays, false);
        parent.removeEventListener('cooadebugguishutdown', remove, false);
      }, false);
    }

    story.parent.addEventListener('cooasectionshow', function(e) {
      var sectionID = e.target.id;

      refresh();

      if (shouldSectionBeTracked(sectionID))
        story.next[varName(sectionID)] = 'on';
    }, false);

    story.parent.addEventListener('cooadebugguiinit', addToDebugGUI, false);

    return {
      refresh: refresh
    };
  }

  function findAll(element, selector) {
    return [].slice.call(element.querySelectorAll(selector));
  }

  function varName(sectionID) {
    return 'visited_' + sectionID;
  }

  document.documentElement.addEventListener('cooainit', function(e) {
    var story = e.detail.story;

    story.autovisit = Autovisit(story);
  }, false);
})();
