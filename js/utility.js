function hex(value, options) {
  function hex_char(value) {
    if (value == 0) { return "0"; }
    else if (value == 1) { return "1"; }
    else if (value == 2) { return "2"; }
    else if (value == 3) { return "3"; }
    else if (value == 4) { return "4"; }
    else if (value == 5) { return "5"; }
    else if (value == 6) { return "6"; }
    else if (value == 7) { return "7"; }
    else if (value == 8) { return "8"; }
    else if (value == 9) { return "9"; }
    else if (value == 10) { return "a"; }
    else if (value == 11) { return "b"; }
    else if (value == 12) { return "c"; }
    else if (value == 13) { return "d"; }
    else if (value == 14) { return "e"; }
    else if (value == 15) { return "f"; }
  }

  var s = "";
  while (value > 0) {
    var hi = (value >> 4) & 0xf;
    var lo = value & 0xf;
    value = value >> 8;
    s = hex_char(hi) + hex_char(lo) + s;
  }

  if ((s.length & 1) > 0) {
    s = "0" + s;
  }

  if (options != null) {
    if (options.leading_zeroes > 0) {
      while (s.length < options.leading_zeroes) {
        s = "0" + s;
      }
    }
  }

  return s;
}