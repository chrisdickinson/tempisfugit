var OID = require('tempis/oid').OID,
    assert = process.assert;

var GitCommit = function(repo, oid, treeOID, parentOIDs, author, committer, msg) {
  this.repo = repo;
  this.oid = oid;
  this.treeOID = treeOID;
  this.parentOIDs = parentOIDs;
  this.author = author;
  this.committer = committer;
  this.message = msg;
};

var oidParse = function(info) {
  return OID.fromHex(info); 
};

var personParse = function(info) {
  var bits = info.split(/(<|>)/g);
  return {
    'name':bits[0],
    'email':bits[2],
    'datetime':Date.parse((new Date(parseInt(bits[4]))) + bits[4].split(' ').slice(-1)[0])
  }; 
};

GitCommit.parse = function(repo, oid, buf) {
  var beginMessageIDX = Array.prototype.indexOf.call(buf, '\n\n'),
      head = buf.slice(0, beginMessageIDX),
      tail = buf.slice(beginMessageIDX);

  var headParts = head.toString('utf8').split(/\n/g),
      committer,
      author,
      parents = [],
      tree,
      parsers = {
        'parent':oidParse,
        'tree':oidParse,
        'author':personParse,
        'committer':personParse 
      },
      info = {
        'parent':function(result){ parents.push(result); },
        'tree':function(result){ tree = result; },
        'author':function(result){ author = result; },
        'committer':function(result) { committer = result; }
      };
  headParts.forEach(function(part) {
    var bits = part.split(' '),
        first = bits[0],
        rest = bits.slice(1).join(' ');

    try {
      info[first](
        parsers[first](rest)
      );
    } catch(err) {

    }
  });

  assert(tree);
  assert(committer);
  assert(author);

  return new GitCommit(repo, oid, tree, parents, author, committer, tail); 
};

exports.GitCommit = GitCommit;
