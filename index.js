var fs = require('fs'),
    vm = require('vm'),
    path = require('path'),
    Module = require('module');

var resolve = require.resolve;

module.exports = function (request, args) {
  var filename = resolve(request);

  var mod = new Module(filename, module.parent);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));

  var content = fs.readFileSync(filename);

  function require(path) {
    return mod.require(path);
  }

  require.resolve = function(request) {
    return Module._resolveFilename(request, mod);
  };

  Object.defineProperty(require, 'paths', { get: function() {
    throw new Error('require.paths is removed. Use ' +
                    'node_modules folders, or the NODE_PATH ' +
                    'environment variable instead.');
  }});

  require.main = process.mainModule;

  // Enable support to add extra extension types
  require.extensions = Module._extensions;
  require.registerExtension = function() {
    throw new Error('require.registerExtension() removed. Use ' +
                    'require.extensions instead.');
  };

  require.cache = Module._cache;

  var sandbox = {};

  for (var k in args) {
    sandbox[k] = args[k];
  }

  for (var k in global) {
    sandbox[k] = global[k];
  }

  sandbox.require = require;
  sandbox.__filename = filename;
  sandbox.__dirname = path.dirname(filename);
  sandbox.module = mod;
  sandbox.global = sandbox;
  sandbox.root = root;

  var mod = vm.runInNewContext(content, sandbox, { filename: filename });

  return sandbox;
}
