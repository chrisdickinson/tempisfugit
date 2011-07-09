var types = require('./types');

var GitObject = function() {
};

/*function(oid, repo, src, in_memory, modified) {
  this.in_memory = in_memory || 1;
  this.modified = modified || 1;

  this.oid = oid;
  this.repo = repo;
  this.src = src;
};
*/
GitObject.fromBuffer = function(repo, oid, buf, expectLoose) {
  var bits = (function() {
    var firstSpace = (function(b) {
          for(var i = 0, len = b.length; i < len; ++i) {
            if(b[i] === ' ') return i;
          }
          return -1;
        })(buf),
        type = buf.slice(0, firstSpace).toString('utf8');

    for(var i = firstSpace + 1, len = buf.length;
        i < len &&
        !isNaN(parseInt(buf[i], 10)) &&
        buf[i] !== 0;
        ++i)
      ;

    var head = buf.slice(0, i).toString('utf8'),
        tail = buf.slice(i+1).toString('utf8');

    return {'type':type, 'head':head, 'tail':tail};
  })(); 

  if(expectLoose && (GitObject.loose_types.indexOf(bits.type) === -1)) throw new Error("Invalid loose type.");

  var retVal = GitObject.type_parsers[bits.type](repo, oid, bits.tail);
  retVal.asBuffer = function() { return buf; };
  retVal.type = bits.type;
  return retVal;
};

GitObject.loose_types = [
   'commit'
  ,'tree'
  ,'blob'
  ,'tag'
];

GitObject.type_parsers = {
  'ext1':       types.GitExt1.parse,
  'ext2':       types.GitExt2.parse,
  'commit':     types.GitCommit.parse,
  'tree':       types.GitTree.parse,
  'blob':       types.GitBlob.parse,
  'tag':        types.GitTag.parse,
  'OFS_DELTA':  types.GitOFSDelta.parse,
  'REF_DELTA':  types.GitRefDelta.parse
};

GitObject.type_parsers_packed = {
  0x1:GitObject.type_parsers.commit,
  0x2:GitObject.type_parsers.tree,
  0x3:GitObject.type_parsers.blob,
  0x4:GitObject.type_parsers.tag,
  0x6:GitObject.type_parsers.OFS_DELTA,
  0x7:GitObject.type_parsers.REF_DELTA
};

GitObject.types_to_packed = {
  'commit':0x1,
  'tree':0x2,
  'blob':0x3,
  'tag':0x4
};

GitObject.LOOSE_IS_OKAY = 1;
GitObject.LOOSE_IS_BAD = 0;

GitObject.prototype.sourceOpen = function() {
};

GitObject.prototype.write = function(callback) {
};

exports.GitObject = GitObject;
