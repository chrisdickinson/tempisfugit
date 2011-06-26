var platoon = require('platoon');
var tempis = require('../');
var fixture_path = require('path').join(__dirname, 'fixtures/fs-repo');
var EventEmitter = tempis.EventEmitter;

module.exports = exports = {
  'Test of repository reading':platoon.unit({},
    function(assert) {
      "Test that tempis.repo(<path>) returns an EventEmitter"
      var ee = tempis.repo(fixture_path);
      assert.isInstance(ee, EventEmitter);
    },

    function(assert) {
      "Test that tempis.repo(<path>, [callback]) returns an EventEmitter and calls the provided callback."
      var ee = tempis.repo(fixture_path, assert.async(function(err, repo) {
        assert.fail(err);
        assert.isInstance(repo, tempis.Repository);
      }));

      assert.isInstance(ee, EventEmitter);
    },

    function(assert) {
      "Test that a repository can be opened with `new tempis.Repository([path])`"
      var repo = new tempis.Repository(fixture_path);

      // somewhat redundant:
      assert.isInstance(repo, tempis.Repository);

      // less redundant:
      assert.isInstance(repo.ee, EventEmitter);
      assert.isInstance(repo.readyCallback, Function);

      // internally:
      repo.readyCallback = assert.async(function(err, data) {
        assert.fail(err);
        assert.strictEqual(data, repo);
      });

      repo.on('data', assert.async(function(data) {
        assert.strictEqual(data, repo);
      }));
    },

    function(assert) {
      "Test that a `tempis.repo([invalid_path])` emits an error."
      var ee = tempis.repo('dne');
      ee.on('error', assert.async(function(err) {
        assert.isInstance(err, tempis.InvalidPath);
      }));
    },

    function(assert) {
      "Test that `tempis.repo([invalid_path], [callback]) calls the `callback` with an error"
      tempis.repo('dne', assert.async(function(err, data) {
        assert.isInstance(err, tempis.InvalidPath);
      }));
    }
  ),

  'Test of repository configuration':platoon.unit({},
    function(assert) {
      "Test that `tempis.repo([path], [ODB array])` works as expected"
      tempis.repo(fixture_path, [tempis.ODB.Loose, tempis.ODB.PackV1, tempis.ODB.PackV2], assert.async(function(err, data) {
        assert.fail(err);
        assert.isInstance(data, tempis.Repository); 
        assert.deepEqual(data.odb(), [tempis.ODB.Loose, tempis.ODB.PackV1, tempis.ODB.PackV2]);
      }));
    },

    function(assert) {
      "Test that a repository or promise may configure the ODB's after the fact."
      var ee = tempis.repo(fixture_path);
      assert.ok(ee.odb);
      assert.doesNotThrow(Error, function() {
        ee.odb(tempis.ODB.Loose, tempis.ODB.PackV1, tempis.ODB.PackV2);
      });

      ee.on('data', assert.async(function(err, data) {
        assert.fail(err);
        assert.deepEqual(data.odb(), [tempis.ODB.Loose, tempis.ODB.PackV1, tempis.ODB.PackV2]);
      }));
    },

    function(assert) {
    'Test that Repository#odb returns the list of default ODBs if none have been set"
      var ee = tempis.repo(fixture_path);

      assert.deepEqual(ee.odb(), tempis.Repository.DEFAULT_ODB_LIST);

      ee.on('data', assert.async(function(err, data) {
        assert.deepEqual(data.odb(), tempis.Repository.DEFAULT_ODB_LIST);
      }));
    }
  ),
  'Test of repository basic api existance':platoon.unit({},
    function(assert) {
      "Test that Repository has basic lookups"
      assert.ok(tempis.Repository.prototype.lookup);
      assert.ok(tempis.Repository.prototype.lookupTag);
      assert.ok(tempis.Repository.prototype.lookupRef);
      assert.ok(tempis.Repository.prototype.lookupOID);
      assert.ok(tempis.Repository.prototype.lookupRemote);
      assert.ok(tempis.Repository.prototype.remotes);
      assert.ok(tempis.Repository.prototype.refs);
      assert.ok(tempis.Repository.prototype.head);
    },

    function(assert) {
      "Test that Repository has basic write commands"
      assert.ok(tempis.Repository.commit);
      assert.ok(tempis.Repository.blob);
      assert.ok(tempis.Repository.tree);
      assert.ok(tempis.Repository.tag);
    }

    function(assert) {
      "Test that Repository has basic communications"
      assert.ok(tempis.Repository.fetch);
      assert.ok(tempis.Repository.push);
      assert.ok(tempis.Repository.pull);
    }
  )
};
