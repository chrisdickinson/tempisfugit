var odb = require('tempis/odb'),
    fs = require('fs'),
    path = require('path'),
    integer = require('tempis/int'),
    U32 = integer.U32,
    U64 = integer.U64,
    oid = require('tempis/oid'),
    compress = require('compress'),
    GitObject = require('tempis/object').GitObject,
    ofs = require('tempis/ofs');

var ODBPack = function(odb) {
  this.parent = odb;
  this.packs = null;
};

var IDXOffset = function(offset, oid, crc) {
  this.offset = offset;
  this.oid = oid;
  this.crc = crc;
};

var PackFile = function(dir, name) {
  this.dir = dir;
  this.name = name;
  this.idx = null;

  var self = this;
  fs.stat(path.join(this.dir, this.name+'.pack'), function(e, i) {
    self.mtime = new Date(i.mtime);
    self.packSize = i.size;
  });
};

PackFile.zlibTypes = {
  0x1:true, 0x010:true, 0x011:true, 0x100:true
};

PackFile.PackVersion1 = function(pack) {
  this.pack = pack;
  this.im_fanout = new Buffer(256 * 4);
  this.objects = [];
};

PackFile.PackVersion2 = function(pack) {
  this.pack = pack;
  this.im_fanout = new Buffer(256 * 4);
  this.objects = [];
};

PackFile.PackVersion1.prototype.load = function(filename, callback) {
  var self = this;
  fs.open(filename, 'r', function(err, fd) {
    var exit = function(err, val) {
        exit = function() { throw new Error("Cannot be reentrant."); };
        if(fd) {
          fs.close(fd, function(){ callback(err, val); });
        } else callback(err, val);
    };
    if(err) exit(err); else {
      fs.read(fd, self.im_fanout, 0, self.im_fanout.length, function(err, nBytes) {
        if(nBytes < self.im_fanout.length) exit(new Error('Corrupted Pack'));
        else if(err) exit(err);
        else {
          // validate the fanout, plz.
          for(var i = 0; i < 256; ++i) {
            if(i && U32(self.im_fanout.slice(i*4, (i+1)*4)) < U32(self.im_fanout.slice((i-1)*4, i))) {
              exit(new Error('Fanout went poorly'));
              return;
            }
          }
          var objCount = U32(self.im_fanout.slice(i*4*255)),
              objBuffer = new Buffer(objCount * 24);

          // read starting at the end of im_fanout for as many bytes
          fs.read(fd, objBuffer, 0, objBuffer.length, self.im_fanout.length, function(err, nBytes) {
            if(err) exit(err); else if(nBytes < objBuffer.length) exit(new Error("Corrupted Pack")); else {
              for(var i = 0; i < objCount; ++i) {
                var idx = i * 24;
                self.objects.push(
                  new IDXOffset(
                    U32(objBuffer.slice(idx, idx+4)), oid.OID.fromRaw(objBuffer.slice(idx + 4, idx + 4 + 20))
                  )
                );
              }
              var checkSums = new Buffer(20 * 2);
              fs.read(fd, checkSums, 0, checkSums.length, self.im_fanout.length + objBuffer.length, function(err, nBytes) {
                if(err) exit(err); else if(nBytes < checkSums.length) exit(new Error("Corrupted Pack")); else {
                  self.packChecksum = oid.OID.fromRaw(checkSums);
                  self.idxChecksum = oid.OID.fromRaw(checkSums.slice(20));

                  exit(null, self);
                } 
              });
            }
          });
        }
      }); 
    }
  });
};

PackFile.PackVersion1.prototype.read = function(oid, callback) {
  
};

PackFile.PackVersion2.prototype.load = function(filename, callback) {
  var self = this;
  fs.open(filename, 'r', function(err, fd) {
    var exit = function(err, val) {
        exit = function() { throw new Error("Cannot be reentrant."); };
        if(fd) {
          fs.close(fd, function(){ callback(err, val); });
        } else callback(err, val);
    };
    if(err) exit(err); else fs.read(fd, self.im_fanout, 0, self.im_fanout.length, 8, function(err, nBytes) { 
      if(err) exit(err); else if(nBytes < self.im_fanout.length) exit(new Error('Corrupted Pack')); else {
        var objCount = U32(self.im_fanout.slice(4*255)),
            targetBuffer = new Buffer(20 * objCount + 4 * objCount + 4 * objCount);

        fs.read(fd, targetBuffer, 0, targetBuffer.length, 8 + self.im_fanout.length, function(err, nBytes) {
          if(err) exit(err); else if(nBytes < targetBuffer.length) exit(new Error('Corrupted Pack')); else {
            var shaBuffer = targetBuffer.slice(0, 20*objCount);
                crcBuffer = targetBuffer.slice(20*objCount, 20*objCount + 4*objCount),
                offsetBuffer = targetBuffer.slice(20*objCount + 4*objCount, 20*objCount + 4*objCount + 4*objCount);

            var N = 0;
            for(var i = 0; i < objCount; ++i) {
              (offsetBuffer[i*4] & 0x80) && ++N;
            }

            var largeOffsetBuffer = new Buffer(8 * N),
                trailerBuffer = new Buffer(40),
                off = 8 + self.im_fanout.length + 20*objCount + 4*objCount + 4*objCount;
                readTail = function() {
                  fs.read(fd, trailerBuffer, 0, trailerBuffer.length, off + N * 8, function(err, nBytes) {
                    if(err) exit(err); else if (nBytes < trailerBuffer.length) exit(new Error('Corrupted Pack')); else {
                      self.packChecksum = oid.OID.fromRaw(trailerBuffer);
                      self.idxChecksum = oid.OID.fromRaw(trailerBuffer.slice(20));

                      var seenBigOffs = 0;
                      for(var i = 0; i < objCount; ++i) {
                        var offset;
                        if(offsetBuffer[i*4] & 0x80) {
                          offset = new BigInteger(largeOffsetBuffer(seenBigOffs * 8),largeOffsetBuffer(seenBigOffs * 8)+8); 
                          ++seenBigOffs;
                        } else {
                          offset = U32(offsetBuffer.slice(i*4, i*4+4));
                        }

                        self.objects.push(
                          new IDXOffset(
                            offset,
                            oid.OID.fromRaw(shaBuffer.slice(i*20, i*20+20)),
                            crcBuffer.slice(i * 4, i * 4 + 4)
                          )
                        );

                      }
                      self.objects.slice().sort(function(lhs, rhs) {
                        if(lhs.offset < rhs.offset) return -1;
                        if(lhs.offset > rhs.offset) return 1;
                        return 0;
                      }).forEach(function(item, ind, arr) {
                        item.nextOffset = arr[ind+1];
                      });
                      exit(null, self); 
                    }
                  }); 
                };
            if(N > 0) {
              fs.read(fd, largeOffsetBuffer, 0, largeOffsetBuffer.length, off, function(err, nBytes) {
                if(err) exit(err); else if (nBytes < largeOffsetBuffer.length) exit(new Error('Corrupted Pack')); else {
                  readTail();
                }
              }); 
            } else readTail();
          }
        });
      }
    });
  });
};

var compareBuffers = function(lhs, rhs) {
  var len = Math.min(lhs.length, rhs.length);
  for(var i = 0; i < len; ++i) {
    if(lhs[i] < rhs[i]) return -1;
    if(lhs[i] > rhs[i]) return 1;
  }
  return 0;
};

PackFile.PackVersion2.prototype.read = function(oid, callback) {

  var lo = oid.value[0] ? U32(this.im_fanout.slice((oid.value[0] - 1) * 4, (oid.value[0] - 1) * 4 + 4)) : 0,
      hi = U32(this.im_fanout.slice(oid.value[0] * 4, oid.value[0] * 4 + 4));
  try { 
    do {
      var middle = (lo + hi) >>> 1,
          cmp = compareBuffers(oid.value, this.objects[middle].oid.value);

      if(cmp < 0) {
        hi = middle;
      } else if(cmp === 0) {
        this.readObjectAt(this.objects[middle], this.objects[middle].nextOffset, callback);
        return;
      } else {
        lo = middle+1;
      }
    } while(lo < hi);
  } catch(err) { 
    callback(err); return;
  }
  callback(new Error('Could not find oid.'));
};

PackFile.PackVersion2.TMP_BUF = new Buffer(1);

PackFile.PackVersion2.prototype.readObjectAt = function(offset, nextOffset, callback, _fd) {
  var self = this,
      packFilename = path.join(self.pack.dir, self.pack.name+'.pack'),
      readUntil = nextOffset ? nextOffset.offset : self.pack.packSize-20;

  var targetBuffer = new Buffer(readUntil - offset.offset),
      initialOffset = offset.offset;

  var execute = function(err, fd) {
    if(err) callback(err); else try {
      var exit = function(e, v) {
        exit = function() { throw new Error("Cannot be reentrant."); };

        fs.close(fd, function() { callback(e, v); });
      };
      exit.from = function(where) {
        return this;
      };

      var expandedSize = [],
          tmpBuf = PackFile.PackVersion2.TMP_BUF,
          type;

      var headerIter = function(e, byt) {
        if(e || byt < 1) exit.from('headerIter')(e); else try {
          expandedSize.push(tmpBuf[0] & ~0x80);
          if(tmpBuf[0] & 0x80) {
            fs.read(fd, tmpBuf, 0, 1, ++initialOffset, headerIter); 
          } else {
            // we have the entire thing.
            var size = expandedSize.pop(),
                len = expandedSize.length + 1;

            while(expandedSize.length) {
              // hohoho, as if this will work.
              size |= expandedSize.pop() << (4 + (7 * (len - expandedSize.length)));
            }
         
            fs.read(fd, targetBuffer, 0, targetBuffer.length, ++initialOffset, function(err, nBytes) {
              if(err) exit.from('readTarget')(err); else if(nBytes < targetBuffer.length) exit(new Error('Corrupted Pack')); else try {

                if(PackFile.zlibTypes[type]) {
                  var gunzip = new compress.Gunzip();
                  gunzip.write(targetBuffer, function(err, data) {
                    gunzip.close(function(err2) {
                        if(err) { exit.from('gunzip')(err); } else try {
                          exit(null, {
                            type:type,
                            data:data
                          });

                        } catch(err) { exit(err); }
                    });
                  });
                } else if(type === 6) {
                  // oh god it's either an OFS or REF delta.
                  var _by = targetBuffer[0],
                      deltaOffset = _by & 0x7F,
                      i = 1;

                  while(_by & 0x80) {
                    deltaOffset += 1;
                    deltaOffset <<= 7;
                    _by = targetBuffer[i++];
                    deltaOffset += _by & 0x7F;
                  }
                  var newOffset = offset.offset - deltaOffset,
                      deltaBuffer = targetBuffer.slice(i);

                  self.readObjectAt({offset:newOffset}, offset, function(err, data) {
                    var inbuf = new Buffer(Buffer.byteLength(data.data, 'binary')),
                        originalType = data.type;
                    inbuf.write(data.data, 'binary');
                  
                    var gunzip = new compress.Gunzip();
                    gunzip.write(deltaBuffer, function(err, data) {
                      gunzip.close(function() {
                        if(err) exit(err); else try {
                          var dataAsBuffer = new Buffer(Buffer.byteLength(data, 'binary')),
                              outgoing;
                          dataAsBuffer.write(data, 'binary');
                          outgoing = ofs.applyDelta(dataAsBuffer, inbuf);
                          exit(null, {type:originalType, data:outgoing.toString('binary')});
                        } catch(err) { exit(err); }
                      });

                    });
                  }, fd, true); 
                } else if(type === 7) {
                  callback(null, null);
                } else {
                  callback(null, null);
                }
              } catch(err) { exit(err); }
            });
          }
        } catch(err) { exit(err); }
      };

      fs.read(fd, tmpBuf, 0, 1, initialOffset, function(err, bytes) {
        if(err) exit.from('initialRead of '+tmpBuf)(err); else {
          type = (tmpBuf[0] & ~0x80) >> 4;

          expandedSize.push(tmpBuf[0] & 0x0F);
          fs.read(fd, tmpBuf, 0, 1, ++initialOffset, headerIter);
        }
      }); 
    } catch(err) { exit(err); }
  };

  _fd ? execute(null, _fd) : fs.open(packFilename, 'r', execute);
};

PackFile.prototype.getIDX = function(callback) {
  if(this.idx) callback(null, this.idx); else {
    var self = this,
        filename = path.join(this.dir, this.name+'.idx');
    fs.open(filename, 'r', function(err, fd) {
      var errorExit = function(e) {
        if(fd) {
          fs.close(fd, function() {
            callback(e);
          });
        } else {
          callback(e);
        }
      };

      if(err) { errorExit(err); } else {
        var version = 1,
            buf = new Buffer(2 * 4);    // read two 32-bit integers.

        fs.read(fd, buf, 0, buf.length, 0, function(err, nBytes) {
          if(nBytes !== buf.length || err) {
            errorExit(err || new Error("Could not read IDX header."));
          } else {
            var i0 = U32(buf),
                i1 = U32(buf.slice(4));


            if(i0 === 0xff744f63) { // pack TOC
              version = i1;
            }
            self.idx = new PackFile['PackVersion'+version](self);
            fs.close(fd, function() {
                self.idx.load(filename, function(err, data) {
                  if(err) { self.idx = null; callback(err); } else {
                    callback(null, self.idx);
                  }
                });
              });
            }
          });
        }
    }); 
  }
};

PackFile.prototype.read = function(oid, callback) {
  var self = this;
  self.getIDX(function(err, idx) {
    if(err) callback(err); else {
      self.idx.read(oid, function(err, val) {
        if(err) callback(err); else {
          callback(null, val);
        }
      });      
    }
  });  
};

ODBPack.prototype.listPacks = function(callback) {
  if(this.packs) {
    callback(null, this.packs);
  } else {
    var self = this,
        packDir = path.join(
          self.parent.repo.path.repository,
          'objects',
          'pack'
        ); 
    fs.readdir(packDir, function(err, files) {
      if(err) {
        callback(err);
      } else {
        self.packs = [];
        files.filter(function(file) {
          if(file == '.' || file == '..') return false;
          if((/^pack-.*pack$/g)(file)) return true;
        }).forEach(function(packFile) {
          var pack = new PackFile(packDir, packFile.replace(/\.pack$/, ''));
          self.packs.push(pack);    
        });
        callback(null, self.packs);
      }
    });
  }
};

ODBPack.prototype.read = function(oid, callback) {
  var self = this;
  this.listPacks(function(err, packs) {
    if(err) callback(err); else {
      var len = packs.length,
          i = -1,
          eterator = function(err, val) {
            if(val) {
              try {
                callback(null, GitObject.type_parsers_packed[val.type](self.parent.repo, oid, val.data));
              } catch(e) {
                callback(e);
              }
            } else {
              ++i;
              if(i < len) {
                packs[i].read(oid, arguments.callee);
              } else {
                callback();
              }
            }
          };
      eterator();
    }
  });
};

ODBPack.prototype.readHeader = function(oid, callback) {

};

ODBPack.prototype.write = function(oid, raw, callback) {

};

ODBPack.prototype.exists = function(oid, callback) {

};

ODBPack.open = function(odb) {
  return new ODBPack(odb);
};

odb.ODB.register(ODBPack);
