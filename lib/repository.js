var path = require('path'),
    fs = require('fs'),
    odb = require('tempis/odb'),
    oid = require('tempis/oid');

var Repository = function(db, index, hashtable, path_info) {
  this.odb = db;
  this.odb.repo = this;
  this.index = index;
  this.hashtable = hashtable;
  this.path = path_info;
};

Repository.PATH = {
  FOLDER:'.git',
  OBJECTS:'objects',
  INDEX:'index',
  HEAD:'HEAD'
};

Repository.prototype.lookup = function(id, callback) {
  id = id instanceof oid.OID ? id : oid.OID.fromHex(id);
  this.odb.read(id, callback);
};

Repository.open = function(dir, bare, callback) {
  var isBare = callback === undefined ? false : bare;
  callback = callback || bare;

  var exit = function(err, value) {
    callback(err, value);
    return true;
  };

  var baseFolder = isBare ? dir : path.join(dir, Repository.PATH.FOLDER),
      objectsFolder = path.join(baseFolder, Repository.PATH.OBJECTS),
      indexFile = path.join(baseFolder, Repository.PATH.INDEX),
      headFile = path.join(baseFolder, Repository.PATH.HEAD);

  fs.stat(baseFolder, function(err, stats) {
    err && exit(err, null) || (function() {
      !stats.isDirectory() && exit(errors.NOTAREPO(baseFolder)) || (function() {
        fs.stat(objectsFolder, function(err, stats) {
          err && exit(err, null) || (function() {
            !stats.isDirectory() && exit(errors.NOTAREPO(objectsFolder)) || (function() {
              fs.readFile(indexFile, function(err, indexData) {
                err && exit(err, null) || (function() {
                  fs.readFile(headFile, function(err, headData) {
                    err && exit(err, null) || (function() {
                      var odbObject = odb.ODB.init();
                      exit(null, new Repository(odbObject, indexData, headData, {
                        'repository':dir,
                        'index':indexFile,
                        'head':headFile,
                        'objects':objectsFolder,
                        'bare':isBare                          
                      }));
                    })();
                  });
                })();
              });
            })();
          })();
        });
      })();
    })();
  });
};

exports.Repository = Repository;
