require.paths.push(process.cwd());

var tempis = require('tempis'),
    Repo = tempis.repository.Repository,
    path = require('path'),
    util = require('util');

i = Date.now();
Repo.open(process.cwd(), function(err, repo) {
  repo.head.lookup(function(err, commit) {
    console.log(commit.message);
    console.log(Date.now() - i);



  });
});
