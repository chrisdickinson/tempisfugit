var odb = require('tempis/odb'),
    compress = require('compress');

var ODBLoose = function(odb) {
  this.parent = odb;
};

ODBLoose.prototype.locateObject = function(oid) {
  var hex = oid.toHex(),
      start = hex.slice(0, 2),
      end = hex.slice(2),
      loc = path.join(this.parent.path.objects, start, end);

  return loc;
};

ODBLoose.prototype.read = function(oid, callback) {
  // returns RAW
  fs.readFile(this.locateObject(oid), function(err, data) {
    var w = ((data[0] << 8) + data[1]),
        isZLIB = data[0] == 0x78 && !(w % 31);

    if(isZLIB) {
      var gunzip = new compress.Gunzip();
      gunzip.write(data, function(err, data) {
        gunzip.close(function(err2) {
          try {
            callback(err || err2, (err || err2) ? GitObject.fromBuffer(this.parent.repo, oid, data, GitObject.LOOSE_IS_OKAY) : undefined);
          } catch(gitObjectError) {
            callback(gitObjectError);
          }
        });
      });
    } else {

    }
  });
};

ODBLoose.prototype.readHeader = function(oid, callback) {

};

ODBLoose.prototype.write = function(oid, raw, callback) {

};

ODBLoose.prototype.exists = function(oid, callback) {

};

ODBLoose.open = function(folder, callback) {
  callback(null, function(odb) {
    return new ODBLoose(odb);
  });
};

odb.ODB.register(ODBLoose);
