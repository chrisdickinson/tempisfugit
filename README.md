TEMPIS FUGIT
============

    "Time flies when you're using GIT"

A native Javascript client for interacting with GIT.

Based loosely off of libgit2 -- the goal is to provide an asynchronous interface to GIT versioned repositories.

At the moment, you can read Loose Refs (that are deflated) and Packed refs/indexes of version 2. It does OFS-deltas, but not REF-deltas.

It is hopefully going to be pretty slick.

THE API
-------

    var tempis = require('tempis'),
        Repo = tempis.repository.Repository;

    Repo.open('/path/to/git/dir', [<is bare?>,] function(error, repository_object) {
        repo.lookup('<hash>', function(err, commitObject) {

        });

        repo.head.lookup(function(err, commitObject) {

        });
    });

SUPER EXCITING
