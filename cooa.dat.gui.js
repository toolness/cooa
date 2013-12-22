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
        if (window.dat && window.dat.GUI) initGUI();
        loadDatGUI(function() { if (story.debugMode) initGUI(); });
      } else if (!story.debugMode && story.debugGUI) {
        story.debugGUI.destroy();
        story.debugGUI = null;
      }
    });
  });

  html.addEventListener('cooadebugguiinit', function addSectionController(e) {
    function updateModel() {
      model.activeSection = story.activeSection.id;
      if (controller) controller.updateDisplay();
    }

    function getAvailableSections() {
      var sections = [];
      for (var i = 0; i < story.parent.children.length; i++) {
        var child = story.parent.children[i];
        if (child.nodeName == 'SECTION' && child.id)
          sections.push(child.id);
      }
      return sections;
    }

    var story = e.detail.story;
    var gui = story.debugGUI;
    var sections = getAvailableSections();
    var model = {
      activeSection: story.activeSection ? story.activeSection.id : ''
    };
    var controller = null;

    controller = gui.add(model, 'activeSection', sections);

    controller.onFinishChange(function(value) {
      story.showSection(COOA.Hash.update(story.hash, {
        section: value
      }));
    });
    story.parent.addEventListener('cooasectionshow', updateModel, false);
  });
})();
