var OID = require('../oid').OID,
    Buffer = require('buffer').Buffer;

var GitTree = function(repo, oid, entries) {
  this.repo = repo;
  this.oid = oid;
  this.entries = entries;
};

GitTree.prototype.toString = function() {
  return this.entries.slice().map(function(e) {
    return [e.mode, e.filename, e.oid.toHex()].join('\t\t');
  }).join('\n');
};

GitTree.parse = function(repo, oid, str) {
  var entries = [],
      i = 0,
      search = [].indexOf,
      buf = new Buffer(Buffer.byteLength(str, 'binary'));

  buf.write(str, 0, 'binary');
  while(i < buf.length) {
    var attr,
        name,
        oid;

    attr = [];

    while(buf[i] > 47 && buf[i] < 58) {
      if(i >= buf.length) throw new Error('Failed to parse tree member attributes.');
      attr.push(String.fromCharCode(buf[i]));
      ++i;
    }

    attr = parseInt(attr.join(''), 8);
    ++i;

    name = [];
    while(buf[i] !== 0) {
      if(i >= buf.length) throw new Error('Failed to parse tree member name: "'+ entries.map(function(i){return i.filename;}).join('","')+'"');
      name.push(String.fromCharCode(buf[i]));
      ++i;
    }
    ++i;

    name = name.join('');
    oid = OID.fromRaw(buf.slice(i));
    i += 20;
    ++i;
    entries.push({
      'filename':name,
      'oid':oid,
      'mode':attr
    });
  }

  return new GitTree(repo, oid, entries); 
};

exports.GitTree = GitTree;
