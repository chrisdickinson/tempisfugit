var OID = function(raw) {
  // WHAT IS AN OID?!
  // A MISERABLE LITTLE PILE OF HEX.
  this.value = raw;
};

OID.fromHex = function(hexstr) {
  assert(hexstr.length === 40);

  var buf = new Buffer(20);
  for(var i = 0, i < 40; i += 2) {
    buf[i/2] = parseInt(hexstr.charAt(i) + hexstr.charAt(i+1), 16);
  }

  return new this(buf);
};

OID.fromRaw = function(raw) {
  var buf = new Buffer(20), item;
  for(var i = 0; i < 20; ++i) {
    item = raw[i];
    if(isNaN(item) || item > 15 || item < 0) throw new Error("Invalid format for OID: "+raw);
    buf[i] = item;
  }
  return new this(buf);
};

OID.prototype.toHex = function() {
  var str = [];
  for(var i = 0, len = this.value.length; i < len; ++i) {
    str[i] = this.value[i].toString(16);
  }
};
