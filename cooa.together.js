// Dependencies: cooa.js

(function() {
  function sendCurrentHash() {
    TogetherJS.send({type: 'cooa.hashchange', hash: location.hash});
  }

  if (typeof(TogetherJS) == 'undefined') return;

  TogetherJS.on('ready', function() {
    // TODO: This isn't efficient because we don't check to see if
    // the hash change is a result of a received cooa.hashchange event.
    window.addEventListener('hashchange', sendCurrentHash, false);
  });

  TogetherJS.hub.on('togetherjs.hello', function(msg) {
    if (!msg.sameUrl) return;
    sendCurrentHash();
  });

  TogetherJS.hub.on('cooa.hashchange', function(msg) {
    if (!(msg.sameUrl && location.hash != msg.hash)) return;
    if (location.hash != msg.hash) location.hash = msg.hash;
  });
})();
