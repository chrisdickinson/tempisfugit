var BigInteger = function(bytes) {
  this.int0 = U32(bytes);
  this.int1 = U32(bytes.slice(4)); 
};

BigInteger.prototype.bitwiseAnd = function(rhs) {
  rhs = rhs instanceof this.constructor ? rhs : new BigInteger(bytes(0).concat(bytes(rhs)));
  return new BigInteger(bytes(this.int0 & rhs.int0).concat(bytes(this.int1 & rhs.int1)));
};

var U16 = function(bytes) {
  return (bytes[0] << 8) |
         (bytes[1]);
};

var U32 = function(bytes) {
  // this is unbelievably irritating.
  // by performing bitwise operations (b0 << 24 | b1 << 16 | b2 << 8 | b3)
  // javascript coerces them into negative values, which then don't compare
  // correctly to the original hex values!
  // so U32([0xFF, 0x74, 0x4F, 0x63]) would !== 0xFF744F63.
  // ARG. so we parseInt instead..

  var pad = function(n) {
    return n.length < 2 ? '0'+n : n;
  };

  return parseInt(pad(bytes[0].toString(16)) +
                  pad(bytes[1].toString(16)) +
                  pad(bytes[2].toString(16)) +
                  pad(bytes[3].toString(16)), 16);
};

var U64 = function(bytes) {
  return new BigInteger(bytes);
};

var bytes = function(num) {
  var b = [];
  b[0] = 0xFF & (num >> 24);
  b[1] = 0xFF & (num >> 16);
  b[2] = 0xFF & (num >> 8);
  b[3] = 0xFF & (num);
  return b;
};

exports.BigInteger = BigInteger;
exports.bytes = bytes;
exports.U16 = U16;
exports.U32 = U32;
exports.U64 = U64;
