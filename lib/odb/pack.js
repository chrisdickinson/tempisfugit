var odb = require('tempis/odb');

var ODBPack = function(odb) {
  this.parent = odb;
};

ODBPack.prototype.read = function(oid, callback) {
  // returns RAW
};

ODBPack.prototype.readHeader = function(oid, callback) {

};

ODBPack.prototype.write = function(oid, raw, callback) {

};

ODBPack.prototype.exists = function(oid, callback) {

};

ODBPack.open = function(folder, callback) {

  callback(null, function(odb) {
    return new ODBPack(odb);
  });
};

odb.ODB.register(ODBPack);