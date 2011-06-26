var fs = require('fs');
var path = require('path');
var tempis = require('../');
var oid = tempis.oid;

var Ref = function(repo, path) {
  this.repo = repo;
  this.path = path.split(': ').slice(1).join(': ').replace(/\s+$/g, ''); 
};

Ref.prototype.toOID = function(callback) {
  var target = path.join(this.repo.path.repository, this.path),
      repo = this.repo;
  fs.readFile(target, function(err, data) {
    if(err) {
      callback(err);
    } else {
      var id = oid.OID.fromHex(data.toString('utf8').slice(0,40));
      callback(null, id);
    }
  });
};

Ref.prototype.lookup = function(callback) {
  var repo = this.repo;
  this.toOID(function(err, id) {
    repo.lookup(id, callback);
  });
};

exports.Ref = Ref;
