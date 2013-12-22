COOA.autorun = false;

module('COOA', {
  setup: function() {
    this.sample = document.querySelector('#sample.cooa');
    this.sampleCopy = this.sample.cloneNode(true);
  },
  teardown: function() {
    this.sample.parentNode.replaceChild(this.sampleCopy, this.sample);
  }
});

test('Storage works', function() {
  var now = Date.now();
  var store = {};
  var storage = COOA.Storage(store);

  storage.set('lol', {a: now});
  equal(typeof(store.lol), 'string');
  deepEqual(storage.get('lol'), {a: now});
});

test('Storage traps exceptions', function() {
  var storage = COOA.Storage({lol: 'wut'});
  var cyclic = {};

  cyclic.cyclic = cyclic;
  equal(storage.get('hmmm'), null);
  equal(storage.get('lol'), null);
  storage.set('cyclic', cyclic);
});

test('Broken links are marked', function() {
  var nonexistentLink = this.sample.querySelector('a[href="#nonexistent"]');
  ok(!nonexistentLink.classList.contains('cooa-broken'));
  var story = COOA.Story({parent: this.sample});
  ok(nonexistentLink.classList.contains('cooa-broken'));
});

test('Debug mode works', function() {
  var eventTriggered = 0;

  this.sample.addEventListener('cooadebugmodechange', function(e) {
    eventTriggered++;
  }, false);

  var story = COOA.Story({parent: this.sample});

  equal(story.debugMode, false);
  equal(eventTriggered, 1);
  ok(!this.sample.classList.contains('cooa-debug'));
  story.setDebugMode(true);
  equal(eventTriggered, 2);
  equal(story.debugMode, true);
  ok(this.sample.classList.contains('cooa-debug'));
  story.setDebugMode(false);
  equal(eventTriggered, 3);
  ok(!this.sample.classList.contains('cooa-debug'));
});

asyncTest('Story init event works', function() {
  expect(0);
  this.sample.addEventListener('cooainit', function(e) {
    setTimeout(start, 0);
  }, false);

  COOA.Story({parent: this.sample});
});

test('Showing sections works', function() {
  var story = COOA.Story({parent: this.sample});
  equal(story.activeSection, null);
  story.showSection('#b');
  equal(story.activeSection.id, 'b');
  ok(this.sample.querySelector('#b').classList.contains('cooa-active'));
  ok(!this.sample.querySelector('#a').classList.contains('cooa-active'));
  story.showSection('#a');
  ok(!this.sample.querySelector('#b').classList.contains('cooa-active'));
  ok(this.sample.querySelector('#a').classList.contains('cooa-active'));  
});

test('Hash parsing works', function() {
  deepEqual(COOA.Hash.parse('#foo'), {section: 'foo', now: {}});
  deepEqual(COOA.Hash.parse('#foo&now.k=1'), {section: 'foo', now: {k: '1'}});
});

test('Hash stringification works', function() {
  deepEqual(COOA.Hash.stringify({section: 'foo'}), '#foo');
  deepEqual(COOA.Hash.stringify({section: 'foo', now: {k: '1'}}),
            '#foo&now.k=1');
});

test('Hash.update works', function() {
  deepEqual(COOA.Hash.update('#foo', {now: {k: '1'}}), '#foo&now.k=1');
  deepEqual(COOA.Hash.update('#foo', {now: {k: undefined}}), '#foo');
  deepEqual(COOA.Hash.update('#foo', {now: {k: null}}), '#foo');
  deepEqual(COOA.Hash.update('#foo', {now: {k: {}}}), '#foo');
  deepEqual(COOA.Hash.update('#foo', {now: {k: 3}}), '#foo&now.k=3');
  deepEqual(COOA.Hash.update('#foo&now.k=2', {now: {k: '1'}}),
            '#foo&now.k=1');
  deepEqual(COOA.Hash.update('#foo', {section: 'lol'}), '#lol');
});

test('Util.extend works', function() {
  var i = {a: 1};

  equal(COOA.Util.extend(i), i);
  deepEqual(COOA.Util.extend(i), {a: 1});
  deepEqual(COOA.Util.extend({k: 1}, {u: 2}), {k: 1, u: 2});
  deepEqual(COOA.Util.extend({k: 1}, {}, {u: 2}), {k: 1, u: 2});
  deepEqual(COOA.Util.extend({k: 1}, {k: 2}), {k: 2});
});

test('Util.isHashLink works', function() {
  var isHashLink = COOA.Util.isHashLink;
  var hashLink = document.createElement('a');
  var nonHashLink = document.createElement('a');

  hashLink.setAttribute('href', '#foo');
  nonHashLink.setAttribute('href', 'lol.html');

  equal(isHashLink(document.body), false);
  equal(isHashLink(hashLink), true);
  equal(isHashLink(nonHashLink), false);
});

test('Util.setClass works', function() {
  var setClass = COOA.Util.setClass;
  var el = document.createElement('div');

  setClass(el, 'lol');
  ok(el.classList.contains('lol'));

  setClass(el, 'lol', true);
  ok(el.classList.contains('lol'));

  setClass(el, 'lol', false);
  ok(!el.classList.contains('lol'));
});

test('Util.updateHashLink works', function() {
  var hashLink = document.createElement('a');

  hashLink.setAttribute('href', '#foo');
  COOA.Util.updateHashLink(hashLink, {now: {k: '1'}});
  equal(hashLink.getAttribute('href'), '#foo&now.k=1');
  equal(hashLink.getAttribute('data-orig-href'), '#foo');
  COOA.Util.updateHashLink(hashLink, {now: {k: '2'}});
  equal(hashLink.getAttribute('href'), '#foo&now.k=2');
  equal(hashLink.getAttribute('data-orig-href'), '#foo');

  var resetLink = document.createElement('a');
  resetLink.setAttribute('href', '#');
  COOA.Util.updateHashLink(resetLink, {now: {k: '1'}});
  equal(resetLink.getAttribute('href'), '#');
});
