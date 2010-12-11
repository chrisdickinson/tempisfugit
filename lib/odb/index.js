var fs = require('fs');

var backendClasses = [];

var ODB = function(backends) {
  var self = this;

  this.repo = null;   // will be set later, by the repository object.

  this.backends = backends.map(function(item) {
    return item(self); 
  });
};

var eterateUntilProperty = function(property) {
  var self = this;
  return function() {
    var i = -1,
        len = self.backends.length,
        callback = arguments[arguments.length-1],
        args = Array.prototype.slice.call(arguments, 0, -1),
        eterator = function(err, val) {
          if(val) {
            callback(null, val);
          } else {
            ++i;
            if(i < len) {
              setTimeout(function() {
                try {
                  self.backends[i][property].apply(self.backends[i], args);
                } catch(err) {
                  args[args.length-1](err);
                }
              });
            } else {
              callback(new Error('Could not'));
            }
          }
        };
    args.push(eterator);
    eterator();
  };
};

ODB.prototype.read = eterateUntilProperty('read');
ODB.prototype.readHeader = eterateUntilProperty('readHeader');
ODB.prototype.write = eterateUntilProperty('write');
ODB.prototype.exists = eterateUntilProperty('exists');

ODB.register = function(klass) {
  backendClasses.push(klass);
};

ODB.open = function(folder, callback) {
  var i = -1,
      len = backendClasses.length,
      backends = [],
      eterator = function(err, val) {
        var callee = arguments.callee;
        if(err) {
          callback(err);
        } else {
          i > -1 && backends.push(val);
          ++i;
          if(i < len) {
            setTimeout(function() {
              backends[i].open(folder, callee);
            });
          } else {
            callback(null, new ODB(backends));
          }  
        }
      };

  eterator();
};

setTimeout(function() {
  require('tempis/odb/pack');
  require('tempis/odb/loose');
});

exports.ODB = ODB;
