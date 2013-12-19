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
  var story = COOA.Story({parent: this.sample});
  ok(!this.sample.classList.contains('cooa-debug'));
  story.setDebugMode(true);
  ok(this.sample.classList.contains('cooa-debug'));
  story.setDebugMode(false);
  ok(!this.sample.classList.contains('cooa-debug'));
});

test('Showing sections works', function() {
  var story = COOA.Story({parent: this.sample});
  story.showSection('#b');
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
