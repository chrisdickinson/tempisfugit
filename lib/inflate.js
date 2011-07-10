var jxg = require('../vendor/jxgcompressor');
var Buffer = require('buffer').Buffer;

exports.inflate = function(buffer, ready) {
  try {
    var hex = buffer.toString('base64'),
        result = jxg.JXG.decompress(hex),
        bytes = Buffer.byteLength(result),
        buff = new Buffer(bytes);

    buff.write(result); 
    setTimeout(function(){ ready(null, buff); }, 0);
  } catch(err) {
    setTimeout(function(){ ready(err); }, 0);
  } 
};
