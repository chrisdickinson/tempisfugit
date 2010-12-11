var path = require('path'),
    fs = require('fs'),
    odb = require('tempis/odb');

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
      !stat.isDirectory() && exit(errors.NOTAREPO(baseFolder)) || (function() {
        fs.stat(objectsFolder, function(err, stats) {
          err && exit(err, null) || (function() {
            !stat.isDirectory() && exit(errors.NOTAREPO(objectsFolder)) || (function() {
              fs.readFile(indexFile, function(err, indexData) {
                err && exit(err, null) || (function() {
                  fs.readFile(headFile, function(err, headData) {
                    err && exit(err, null) || (function() {
                      odb.ODB.open(objectsFolder, function(err, odbObject) {
                        exit(null, new Repository(odbObject, indexData, headData, {
                          'repository':dir,
                          'index':indexFile,
                          'head':headFile,
                          'objects':objectsPath,
                          'bare':isBare                          
                        }));
                      });
                    })();
                  });
                })();
              });
            })();
          })();
        })();
      })();
    })();
  });
};

exports.Repository = Repository;
