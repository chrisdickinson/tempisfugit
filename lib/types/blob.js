var tempis = require('../');
var GitBlob = function(content) {
  this.content = content;
};

GitBlob.prototype.toString = function() {
  return this.content.toString('utf8');
};

GitBlob.parse = function(repo, oid, buf) {
  return new GitBlob(buf);
};

exports.GitBlob = GitBlob;
