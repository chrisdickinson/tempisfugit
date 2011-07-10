var odb = require('../odb'),
    inflate = require('../inflate').inflate,
    fs = require('fs'),
    path = require('path'),
    GitObject = require('../object').GitObject;

var ODBLoose = function(odb) {
  this.parent = odb;
};

ODBLoose.prototype.locateObject = function(oid) {
  var hex = oid.toHex(),
      start = hex.slice(0, 2),
      end = hex.slice(2),
      loc = path.join(this.parent.repo.path.objects, start, end);

  return loc;
};

ODBLoose.prototype.read = function(oid, callback) {
  // returns RAW
  var self = this;
  fs.readFile(this.locateObject(oid), function(err, data) {
    if(err) {
      callback(err);
    } else {
      var w = ((data[0] << 8) + data[1]),
          isZLIB = data[0] == 0x78 && !(w % 31);
      if(isZLIB) {
        inflate(data, function(err, data) {
            try {
              if(err) { callback(err); } else {
                callback(null, GitObject.fromBuffer(self.parent.repo, oid, data, GitObject.LOOSE_IS_OKAY));
              }
            } catch(gitObjectError) {
              callback(gitObjectError);
            }
        });
      } else {

      }
    }
  });
};

ODBLoose.prototype.readHeader = function(oid, callback) {

};

ODBLoose.prototype.write = function(oid, raw, callback) {

};

ODBLoose.prototype.exists = function(oid, callback) {

};

ODBLoose.open = function(odb) {
  return new ODBLoose(odb);
};

odb.ODB.register(ODBLoose);
