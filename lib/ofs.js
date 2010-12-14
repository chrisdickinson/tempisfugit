var integer = require('tempis/int'),
    U32 = integer.U32,
    U64 = integer.U64;

var deltaHeader = function(deltaBuffer) {
  var i = 0,
      c,
      r = 0,
      shift = 0;

  do {
    if(i === deltaBuffer.length) throw new Error("Bad delta");

    c = deltaBuffer[i++];
    r |= (c & 0x7F) << shift;
    shift += 7;

  } while(c & 0x80);

  return {
    'size':r,
    'buffer':deltaBuffer.slice(i)
  };
};

exports.applyDelta = function(deltaBuffer, baseBuffer) {
  var baseSizeInfo = deltaHeader(deltaBuffer),
      resizedSizeInfo = deltaHeader(baseSizeInfo.buffer),
      delta = resizedSizeInfo.buffer,
      outBuffer = new Buffer(resizedSizeInfo.size),
      i = 0,
      outgoingIDX = 0;


  while(i < delta.length) {
    var command = delta[i++];
    if(command & 0x80) {
      // copy instruction. copy from base.
      var offset = [0,0,0,0], length = [0,0,0,0];

      if(command & 0x01) offset[3] = delta[i++];
      if(command & 0x02) offset[2] = delta[i++];
      if(command & 0x04) offset[1] = delta[i++];
      if(command & 0x08) offset[0] = delta[i++];

      if(command & 0x10) length[3] = delta[i++];
      if(command & 0x20) length[2] = delta[i++];
      if(command & 0x40) length[1] = delta[i++];

      length = U32(length);
      offset = U32(offset);

      !length && (length = 0x10000); 

      baseBuffer.copy(outBuffer, outgoingIDX, offset, offset+length);

      outgoingIDX += length; 
    } else if(command) {
      // literal insert instruction. copy from delta stream.

      delta.copy(outBuffer, outgoingIDX, i, command+i);
      i += command;
      outgoingIDX += command;
    }
  }
  return outBuffer;
};
