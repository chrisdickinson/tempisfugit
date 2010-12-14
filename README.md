TEMPIS FUGIT
============

    "Time flies when you're using GIT"


** SEE THE BOTTOM FOR REQUIREMENTS **

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


OTHER THINGS and REQUIREMENTS and BORING STUFF
----------------------------------------------

*   **Node 0.3**

*   **NPM** After cloning this repo, `npm install .` it.

*   **Node Compress** To get this to work, you will have to clone [my fork of node-compress](https://github.com/chrisdickinson/node-compress) which
moves to the newer Buffer API, as well as sets the window bits for deflate to work properly with git objects. After cloning it, `cd` into that directory
and `npm install .`.

*   **A sense of humor, hopefully** Please don't get too grossed out by the ... relative lack of quality of the code. It will get better, I promise. This was largely a *beat it
with hammers until it works* sort of ordeal, and there are, of course, kinks to be ironed out. I'd love to end up using node-seq for a big chunk of this
stuff. It looks neat. 

