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

test('story.$all works', function() {
  var story = COOA.Story({parent: this.sample});

  ok(Array.isArray(story.$all('section')), 'array is returned');
  ok(story.$all('section').length > 0, 'matching elements populate array');
  ok(Array.isArray(story.$all('')), 'exceptions are caught');
});

test('Properties on story are properly exposed', function() {
  var story = COOA.Story({parent: this.sample});

  equal(story.parent, this.sample, 'parent is exposed');
  equal(story.globalParent, this.sample, 'globalParent is exposed');
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

  nonexistentLink.setAttribute('href', '#a');  
  story.refresh();
  ok(!nonexistentLink.classList.contains('cooa-broken'));
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

test('cooasectionshow is triggered only when state changes', function() {
  var story = COOA.Story({parent: this.sample});
  var showTriggered = false;

  story.parent.addEventListener('cooasectionshow', function() {
    showTriggered = true;
  }, false);
  story.schema.define('foo', 'number', 5);
  story.schema.define('bar', 'boolean', false);

  story.showSection('#b');
  equal(showTriggered, true);
  showTriggered = false;

  story.showSection('#b');
  equal(showTriggered, false);  

  story.showSection('#b&foo=5');
  equal(showTriggered, false);  

  story.showSection('#b&bar=off');
  equal(showTriggered, false);  

  story.showSection('#b&bar=on');
  equal(showTriggered, true);
  showTriggered = false;

  story.showSection('#b&foo=5&bar=on');
  equal(showTriggered, false);

  story.showSection('#b&bar=on&foo=5');
  equal(showTriggered, false);

  story.showSection('#b&foo=5');
  equal(showTriggered, true);
  showTriggered = false;

  story.showSection('#a&foo=5');
  equal(showTriggered, true);
  showTriggered = false;

  story.showSection('#a&lol=u');
  equal(showTriggered, false);
});

test('Passing objects to story.showSection() works', function() {
  var story = COOA.Story({parent: this.sample});

  story.schema.define('foo', 'number', 5);
  story.showSection('#b');
  equal(story.now.foo, 5);

  story.showSection({now: {foo: 6}});
  equal(story.activeSection.id, 'b');
  equal(story.hash, '#b&foo=6');
  equal(story.now.foo, 6);

  story.showSection({section: 'a'});
  equal(story.activeSection.id, 'a');
  equal(story.hash, '#a&foo=6');
  equal(story.now.foo, 6);

  story.showSection({now: {foo: 5}});
  equal(story.hash, '#a');
  equal(story.now.foo, 5);
});

test('Hash parsing works', function() {
  deepEqual(COOA.Hash.parse('#foo'), {section: 'foo', now: {}});
  deepEqual(COOA.Hash.parse('#foo&k=1'), {section: 'foo', now: {k: '1'}});
});

test('Hash stringification works', function() {
  deepEqual(COOA.Hash.stringify({section: 'foo'}), '#foo');
  deepEqual(COOA.Hash.stringify({section: 'foo', now: {k: '1'}}),
            '#foo&k=1');
});

test('Hash.update works', function() {
  deepEqual(COOA.Hash.update('#foo', {now: {k: '1'}}), '#foo&k=1');
  deepEqual(COOA.Hash.update('#foo', {now: {k: undefined}}), '#foo');
  deepEqual(COOA.Hash.update('#foo', {now: {k: null}}), '#foo');
  deepEqual(COOA.Hash.update('#foo', {now: {k: {}}}), '#foo');
  deepEqual(COOA.Hash.update('#foo', {now: {k: 3}}), '#foo&k=3');
  deepEqual(COOA.Hash.update('#foo&k=2', {now: {k: '1'}}), '#foo&k=1');
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

test('Schema works with numbers', function() {
  var schema = COOA.Schema();

  schema.define('foo', 'number', 5);

  deepEqual(schema.parse({}), {foo: 5});
  deepEqual(schema.parse({bar: '1'}), {foo: 5});
  deepEqual(schema.parse({foo: '2'}), {foo: 2});
  deepEqual(schema.parse({foo: 'lol'}), {foo: 5});

  deepEqual(schema.stringify({foo: 5}), {});
  deepEqual(schema.stringify({foo: 6}), {foo: '6'});
});

test('Schema works with strings', function() {
  var schema = COOA.Schema();

  schema.define('foo', 'string', 'lol');

  deepEqual(schema.parse({}), {foo: 'lol'});
  deepEqual(schema.parse({foo: '2'}), {foo: '2'});
  deepEqual(schema.parse({foo: ''}), {foo: ''});

  deepEqual(schema.stringify({foo: 'lol'}), {});
  deepEqual(schema.stringify({foo: 'oof'}), {foo: 'oof'});
});

test('Schema works with booleans that default to false', function() {
  var schema = COOA.Schema();

  schema.define('foo', 'boolean');

  deepEqual(schema.parse({}), {foo: false});
  deepEqual(schema.parse({bar: '1'}), {foo: false});
  deepEqual(schema.parse({foo: '2'}), {foo: false});
  deepEqual(schema.parse({foo: 'off'}), {foo: false});
  deepEqual(schema.parse({foo: 'on'}), {foo: true});

  deepEqual(schema.stringify({foo: false}), {});
  deepEqual(schema.stringify({foo: true}), {foo: 'on'});
});

test('Schema works with booleans that default to true', function() {
  var schema = COOA.Schema();

  schema.define('foo', 'boolean', true);

  deepEqual(schema.parse({}), {foo: true});
  deepEqual(schema.parse({bar: '1'}), {foo: true});
  deepEqual(schema.parse({foo: '2'}), {foo: true});
  deepEqual(schema.parse({foo: 'off'}), {foo: false});
  deepEqual(schema.parse({foo: 'on'}), {foo: true});

  deepEqual(schema.stringify({foo: false}), {foo: 'off'});
  deepEqual(schema.stringify({foo: true}), {});
});

test('Util.updateHashLink works', function() {
  var hashLink = document.createElement('a');

  hashLink.setAttribute('href', '#foo');
  COOA.Util.updateHashLink(hashLink, {now: {k: '1'}});
  equal(hashLink.getAttribute('href'), '#foo&k=1');
  equal(hashLink.getAttribute('data-orig-href'), '#foo');
  COOA.Util.updateHashLink(hashLink, {now: {k: '2'}});
  equal(hashLink.getAttribute('href'), '#foo&k=2');
  equal(hashLink.getAttribute('data-orig-href'), '#foo');

  var resetLink = document.createElement('a');
  resetLink.setAttribute('href', '#');
  COOA.Util.updateHashLink(resetLink, {now: {k: '1'}});
  equal(resetLink.getAttribute('href'), '#');
});
