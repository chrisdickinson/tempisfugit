require.paths.push(process.cwd());

var tempis = require('tempis'),
    Repo = tempis.repository.Repository,
    path = require('path'),
    util = require('util');

var usage = process.memoryUsage();

var start = Date.now(),
    i = 0,
    data = [],
    last;

Repo.open(process.cwd(), function(err, repo) {
  var log = function(err, commit) {
    ++i;
    if(commit && commit.parentOIDs && commit.parentOIDs[0]) {
      if(commit.oid.toHex() === commit.parentOIDs[0].toHex()) {
        console.log('saw '+commit.oid.toHex()+' twice');
        console.log(i + ' commits in ' + (Date.now()-start) + 'ms');
      } else {
        repo.lookup(commit.parentOIDs[0], arguments.callee);
        last = commit;
      }
    } else {
      console.log(i + ' commits in ' + (Date.now()-start) + 'ms');
      console.log('last oid: '+last.parentOIDs[0].toHex());
    }
  };
  repo.head.lookup(log);
});
