(function() {
  function loadDatGUI(cb) {
    var dgScript = document.createElement('script');
    var dgHref = script.getAttribute('data-datgui-href');

    dgScript.onload = cb;
    dgScript.setAttribute('src', dgHref);
    (script.parentNode || document.head).appendChild(dgScript);
  }

  var script = document.scripts[document.scripts.length - 1];
  var html = document.documentElement;

  html.addEventListener('cooainit', function initDebugGUI(e) {
    function initGUI() {
      var gui = story.debugGUI = new window.dat.GUI();
      story.parent.dispatchEvent(COOA.CustomEvent('cooadebugguiinit', {
        bubbles: true,
        cancelable: false,
        detail: {story: story}
      }));
      gui.open();
    }

    var story = e.detail.story;

    story.debugGUI = null;
    story.parent.addEventListener('cooadebugmodechange', function(e) {
      if (story.debugMode && !story.debugGUI) {
        if (window.dat && window.dat.GUI) return initGUI();
        loadDatGUI(function() { if (story.debugMode) initGUI(); });
      } else if (!story.debugMode && story.debugGUI) {
        story.parent.dispatchEvent(COOA.CustomEvent('cooadebugguishutdown', {
          bubbles: true,
          cancelable: false,
          detail: {story: story}
        }));
        story.debugGUI.destroy();
        story.debugGUI = null;
      }
    });
  });

  html.addEventListener('cooadebugguiinit', function addNowControllers(e) {
    function updateDisplays() {
      controllers.forEach(function(c) { c.updateDisplay(); });
    }

    var story = e.detail.story;
    var parent = story.parent;
    var controllers = [];
    var model = {};

    Object.keys(story.now).forEach(function(name) {
      var guiName = name;

      Object.defineProperty(model, guiName, {
        get: function() {
          return story.now[name];
        },
        set: function(value) {
          var changes = {};
          changes[name] = value;
          story.showSection({now: changes});
        }
      });
      controllers.push(story.debugGUI.add(model, guiName));
    });

    parent.addEventListener('cooasectionshow', updateDisplays, false);
    parent.addEventListener('cooadebugguishutdown', function remove() {
      parent.removeEventListener('cooasectionshow', updateDisplays, false);
      parent.removeEventListener('cooadebugguishutdown', remove, false);
    }, false);
  });

  html.addEventListener('cooadebugguiinit', function addSectionController(e) {
    function getAvailableSections() {
      var sections = [];
      for (var i = 0; i < parent.children.length; i++) {
        var child = parent.children[i];
        if (child.nodeName == 'SECTION' && child.id)
          sections.push(child.id);
      }
      return sections;
    }

    var story = e.detail.story;
    var parent = story.parent;
    var gui = story.debugGUI;
    var sections = getAvailableSections();
    var model = Object.create(Object.prototype, {
      activeSection: {
        get: function() {
          return story.activeSection ? story.activeSection.id : '';
        },
        set: function(value) {
          story.showSection({section: value});
        }
      }
    });
    var controller = gui.add(model, 'activeSection', sections);
    var updateDisplay = controller.updateDisplay.bind(controller);

    parent.addEventListener('cooasectionshow', updateDisplay, false);
    parent.addEventListener('cooadebugguishutdown', function remove() {
      parent.removeEventListener('cooasectionshow', updateDisplay, false);
      parent.removeEventListener('cooadebugguishutdown', remove, false);
    }, false);
  });
})();
