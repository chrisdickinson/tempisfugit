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
  return function() {
    var self = this,
        i = -1,
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
  backendClasses.push(klass.open);
};

ODB.init = function() {
  return new ODB(backendClasses.slice());
};

setTimeout(function() {
  require('tempis/odb/pack');
  require('tempis/odb/loose');
});

exports.ODB = ODB;
