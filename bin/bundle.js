var fs = require('fs');

function parseDependencies(filename) {
  var lines = fs.readFileSync(filename, 'utf-8').split('\n');
  var depMatch = lines[0].trim().match(/^\/\/ Dependencies: (.+)$/);
  var deps = [];

  if (depMatch) {
    deps = depMatch[1]
      .split(',')
      .map(function trim(s) { return s.trim(); })
      .filter(function removeNone(s) { return s != 'none' });
  }

  return deps;
}

function createDependencyMap(files) {
  function processFile(filename) {
    var deps = dependencies[filename] = parseDependencies(filename);
    files.push.apply(files, deps.filter(function(dep) {
      return !(dep in dependencies || files.indexOf(dep) >= 0);
    }));
  }

  var dependencies = {};

  while (files.length) processFile(files.pop());
  return dependencies;
}

function writeDependencies(dependencies) {
  function writeResolvedFiles() {
    filesLeft.filter(function haveDependenciesBeenResolved(filename) {
      return dependencies[filename].filter(function isUnresolved(dep) {
        return filesWritten.indexOf(dep) == -1;
      }).length == 0;
    }).forEach(function(filename) {
      console.log("//", filename, "\n");
      console.log(fs.readFileSync(filename, "utf-8"));
      filesWritten.push(filename);
      filesLeft.splice(filesLeft.indexOf(filename), 1);
    });
  }

  var filesWritten = [];
  var filesLeft = Object.keys(dependencies);

  while (filesLeft.length) writeResolvedFiles();
}

writeDependencies(createDependencyMap(process.argv.slice(2)));
