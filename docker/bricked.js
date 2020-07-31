if (typeof process !== 'undefined') {
  globalThis['process$1'] = process;
  import('crypto').then(function(esm){globalThis['crypto$1']=esm});
  globalThis['fs'] = undefined;
  globalThis['path$1'] = undefined;
} else {
  globalThis['Buffer'] = {
    from: function (a, b) {
      if (b !== 'hex') {
        throw new Error('unsupported Buffer.from');
      }
      const len = a.length / 2;
      const ret = Array(len);
      for (let i = 0; i < len; i++) {
        const x = i * 2;
        ret[i] = parseInt(a.substring(x, x + 2), 16);
      }
      return ret;
    }
  };
}


const UINT_ZERO = '0x0000000000000000000000000000000000000000000000000000000000000000';

function toStr (value, pad) {
  if (value === undefined) {
    throw new Error('value undefined');
  }

  if (typeof value === 'string') {
    if (value.length > pad) {
      return value.replace('0x', '').slice(-pad);
    }
    return value.replace('0x', '').padStart(pad, '0');
  }

  return value.toString(16).padStart(pad, '0');
}

class Inventory {
  static fromJSON (obj) {
    const ret = new this();
    ret.storage = Object.assign({}, obj.storage);
    ret.storageKeys = Object.assign({}, obj.storageKeys);
    ret.rootStorage = Object.assign({}, obj.rootStorage);

    return ret;
  }

  constructor () {
    this.storage = {};
    this.storageKeys = {};
    this.rootStorage = {};
  }

  toJSON () {
    const storage = this.storage;
    const storageKeys = this.storageKeys;
    const rootStorage = this.rootStorage;

    return { storage, storageKeys, rootStorage };
  }

  clone () {
    const ret = this.toJSON();

    return this.constructor.fromJSON(ret);
  }

  freeze () {
    Object.freeze(this);
    Object.freeze(this.storage);
    Object.freeze(this.storageKeys);
    Object.freeze(this.rootStorage);
  }

  _getValue (key) {
    return this.storage[key];
  }

  _setValue (key, value) {
    const padded = toStr(value, 64);
    const old = this.rootStorage[key] || UINT_ZERO;

    const newValue = BigInt(value);
    const oldValue = BigInt(old);
    const delta = `0x${toStr(BigInt.asUintN(256, newValue - oldValue), 64)}`;

    this.storageKeys[key] = delta;
    this.storage[key] = `0x${padded}`;
  }

  storageLoad (target, key) {
    return this._getValue(key) || UINT_ZERO;
  }

  storageStore (key, value) {
    this._setValue(key, value);
  }
}

const HEXMAP = {};

for (let i = 0; i <= 0xff; i++) {
  HEXMAP[i.toString(16).padStart(2, '0')] = i;
}

function bufferify (val) {
  return Uint8Array.from(arrayify(val));
}

function arrayify (val) {
  if (Array.isArray(val)) {
    return val;
  }

  let v = val;

  if (typeof v === 'number' || typeof v === 'bigint') {
    if (!v) {
      return [0];
    } else {
      v = v.toString(16);
    }
  }

  if (typeof v === 'object') {
    return Array.from(v);
  }

  if (typeof v !== 'string') {
    v = v.toString(16);
  }

  v = v.replace('0x', '');
  if (v.length % 2) {
    v = '0' + v;
  }

  const vLen = v.length;
  const res = [];
  for (let i = 0; i < vLen; i += 2) {
    const n = HEXMAP[v.substring(i, i + 2).toLowerCase()];

    if (n === undefined) {
      throw new TypeError(`invalid hex string ${v}`);
    }

    res.push(n);
  }

  return res;
}

function packString (values, defs) {
  let res = '';
  const len = values.length;

  for (let i = 0; i < len; i++) {
    const def = defs[i] * 2;
    const v = values[i];

    if (typeof v === 'number' || typeof v === 'bigint') {
      res += BigInt.asUintN(defs[i] * 8, v.toString()).toString(16).padStart(def, '0');
      continue;
    }

    res += v.toString(16).replace('0x', '').padStart(def, '0');
  }

  return res;
}

function toHex (buf) {
  let res = '';

  for (let i = 0; i < buf.length; i++) {
    res += (buf[i] | 0).toString(16).padStart(2, '0');
  }

  return res;
}

function toHexPrefix (buf) {
  return '0x' + toHex(buf);
}

function bufToHex (buf, start, end) {
  let res = '0x';

  for (let i = start; i < end; i++) {
    res += (buf[i] | 0).toString(16).padStart(2, '0');
  }

  return res;
}

function unwrapExports (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function createCommonjsModule(fn, basedir, module) {
	return module = {
	  path: basedir,
	  exports: {},
	  require: function (path, base) {
      return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
    }
	}, fn(module, module.exports), module.exports;
}

function commonjsRequire () {
	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
}

var nobleRipemd160 = createCommonjsModule(function (module, exports) {
/*! noble-ripemd160 - MIT License (c) Paul Miller (paulmillr.com) */
Object.defineProperty(exports, "__esModule", { value: true });
const BLOCK_SIZE = 64;
const OUTPUT_SIZE = 20;
const DEFAULT_H = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];
const f1 = (x, y, z) => x ^ y ^ z;
const f2 = (x, y, z) => (x & y) | (~x & z);
const f3 = (x, y, z) => (x | ~y) ^ z;
const f4 = (x, y, z) => (x & z) | (y & ~z);
const f5 = (x, y, z) => x ^ (y | ~z);
const rol = (x, i) => (x << i) | (x >>> (32 - i));
const slice = (arr, start = 0, end = arr.length) => {
    if (arr instanceof Uint32Array) {
        return arr.slice(start, end);
    }
    const result = new Uint32Array(end - start);
    for (let i = start, j = 0; i < end; i++, j++) {
        result[j] = Number(arr[i]);
    }
    return result;
};
const readLE32 = (ptr, padding = 0) => (Number(ptr[padding + 3]) << 24) |
    (Number(ptr[padding + 2]) << 16) |
    (Number(ptr[padding + 1]) << 8) |
    Number(ptr[padding]);
const writeLE32 = (ptr, padding, x) => {
    ptr[padding + 3] = x >>> 24;
    ptr[padding + 2] = x >>> 16;
    ptr[padding + 1] = x >>> 8;
    ptr[padding] = x >>> 0;
};
const writeLE64 = (ptr, padding, x) => {
    x = BigInt(x);
    ptr[padding + 7] = x >> 56n;
    ptr[padding + 6] = x >> 48n;
    ptr[padding + 5] = x >> 40n;
    ptr[padding + 4] = x >> 32n;
    ptr[padding + 3] = x >> 24n;
    ptr[padding + 2] = x >> 16n;
    ptr[padding + 1] = x >> 8n;
    ptr[padding] = x;
};
const Round = (a, b, c, d, e, f, x, k, r) => new Uint32Array([rol(a + f + x + k, r) + e, rol(c, 10)]);
const R11 = (a, b, c, d, e, x, r) => Round(a, b, c, d, e, f1(b, c, d), x, 0, r);
const R21 = (a, b, c, d, e, x, r) => Round(a, b, c, d, e, f2(b, c, d), x, 0x5a827999, r);
const R31 = (a, b, c, d, e, x, r) => Round(a, b, c, d, e, f3(b, c, d), x, 0x6ed9eba1, r);
const R41 = (a, b, c, d, e, x, r) => Round(a, b, c, d, e, f4(b, c, d), x, 0x8f1bbcdc, r);
const R51 = (a, b, c, d, e, x, r) => Round(a, b, c, d, e, f5(b, c, d), x, 0xa953fd4e, r);
const R12 = (a, b, c, d, e, x, r) => Round(a, b, c, d, e, f5(b, c, d), x, 0x50a28be6, r);
const R22 = (a, b, c, d, e, x, r) => Round(a, b, c, d, e, f4(b, c, d), x, 0x5c4dd124, r);
const R32 = (a, b, c, d, e, x, r) => Round(a, b, c, d, e, f3(b, c, d), x, 0x6d703ef3, r);
const R42 = (a, b, c, d, e, x, r) => Round(a, b, c, d, e, f2(b, c, d), x, 0x7a6d76e9, r);
const R52 = (a, b, c, d, e, x, r) => Round(a, b, c, d, e, f1(b, c, d), x, 0, r);
function getBinaryFromString(str) {
    const len = str.length;
    const result = new Uint32Array(len);
    for (let i = 0; i < len; i++) {
        result[i] = str.charCodeAt(i);
    }
    return result;
}
class Ripemd160 {
    constructor(h = new Uint32Array(DEFAULT_H), bytes = 0, buffer = new Uint32Array(BLOCK_SIZE)) {
        this.h = h;
        this.bytes = bytes;
        this.buffer = buffer;
    }
    input(str) {
        const input = getBinaryFromString(str);
        this.write(input, input.length);
    }
    processBlock(chunk) {
        const s = this.h;
        let a1 = s[0], b1 = s[1], c1 = s[2], d1 = s[3], e1 = s[4];
        let a2 = a1, b2 = b1, c2 = c1, d2 = d1, e2 = e1;
        let w0 = readLE32(chunk, 0), w1 = readLE32(chunk, 4), w2 = readLE32(chunk, 8), w3 = readLE32(chunk, 12);
        let w4 = readLE32(chunk, 16), w5 = readLE32(chunk, 20), w6 = readLE32(chunk, 24), w7 = readLE32(chunk, 28);
        let w8 = readLE32(chunk, 32), w9 = readLE32(chunk, 36), w10 = readLE32(chunk, 40), w11 = readLE32(chunk, 44);
        let w12 = readLE32(chunk, 48), w13 = readLE32(chunk, 52), w14 = readLE32(chunk, 56), w15 = readLE32(chunk, 60);
        [a1, c1] = R11(a1, b1, c1, d1, e1, w0, 11);
        [a2, c2] = R12(a2, b2, c2, d2, e2, w5, 8);
        [e1, b1] = R11(e1, a1, b1, c1, d1, w1, 14);
        [e2, b2] = R12(e2, a2, b2, c2, d2, w14, 9);
        [d1, a1] = R11(d1, e1, a1, b1, c1, w2, 15);
        [d2, a2] = R12(d2, e2, a2, b2, c2, w7, 9);
        [c1, e1] = R11(c1, d1, e1, a1, b1, w3, 12);
        [c2, e2] = R12(c2, d2, e2, a2, b2, w0, 11);
        [b1, d1] = R11(b1, c1, d1, e1, a1, w4, 5);
        [b2, d2] = R12(b2, c2, d2, e2, a2, w9, 13);
        [a1, c1] = R11(a1, b1, c1, d1, e1, w5, 8);
        [a2, c2] = R12(a2, b2, c2, d2, e2, w2, 15);
        [e1, b1] = R11(e1, a1, b1, c1, d1, w6, 7);
        [e2, b2] = R12(e2, a2, b2, c2, d2, w11, 15);
        [d1, a1] = R11(d1, e1, a1, b1, c1, w7, 9);
        [d2, a2] = R12(d2, e2, a2, b2, c2, w4, 5);
        [c1, e1] = R11(c1, d1, e1, a1, b1, w8, 11);
        [c2, e2] = R12(c2, d2, e2, a2, b2, w13, 7);
        [b1, d1] = R11(b1, c1, d1, e1, a1, w9, 13);
        [b2, d2] = R12(b2, c2, d2, e2, a2, w6, 7);
        [a1, c1] = R11(a1, b1, c1, d1, e1, w10, 14);
        [a2, c2] = R12(a2, b2, c2, d2, e2, w15, 8);
        [e1, b1] = R11(e1, a1, b1, c1, d1, w11, 15);
        [e2, b2] = R12(e2, a2, b2, c2, d2, w8, 11);
        [d1, a1] = R11(d1, e1, a1, b1, c1, w12, 6);
        [d2, a2] = R12(d2, e2, a2, b2, c2, w1, 14);
        [c1, e1] = R11(c1, d1, e1, a1, b1, w13, 7);
        [c2, e2] = R12(c2, d2, e2, a2, b2, w10, 14);
        [b1, d1] = R11(b1, c1, d1, e1, a1, w14, 9);
        [b2, d2] = R12(b2, c2, d2, e2, a2, w3, 12);
        [a1, c1] = R11(a1, b1, c1, d1, e1, w15, 8);
        [a2, c2] = R12(a2, b2, c2, d2, e2, w12, 6);
        [e1, b1] = R21(e1, a1, b1, c1, d1, w7, 7);
        [e2, b2] = R22(e2, a2, b2, c2, d2, w6, 9);
        [d1, a1] = R21(d1, e1, a1, b1, c1, w4, 6);
        [d2, a2] = R22(d2, e2, a2, b2, c2, w11, 13);
        [c1, e1] = R21(c1, d1, e1, a1, b1, w13, 8);
        [c2, e2] = R22(c2, d2, e2, a2, b2, w3, 15);
        [b1, d1] = R21(b1, c1, d1, e1, a1, w1, 13);
        [b2, d2] = R22(b2, c2, d2, e2, a2, w7, 7);
        [a1, c1] = R21(a1, b1, c1, d1, e1, w10, 11);
        [a2, c2] = R22(a2, b2, c2, d2, e2, w0, 12);
        [e1, b1] = R21(e1, a1, b1, c1, d1, w6, 9);
        [e2, b2] = R22(e2, a2, b2, c2, d2, w13, 8);
        [d1, a1] = R21(d1, e1, a1, b1, c1, w15, 7);
        [d2, a2] = R22(d2, e2, a2, b2, c2, w5, 9);
        [c1, e1] = R21(c1, d1, e1, a1, b1, w3, 15);
        [c2, e2] = R22(c2, d2, e2, a2, b2, w10, 11);
        [b1, d1] = R21(b1, c1, d1, e1, a1, w12, 7);
        [b2, d2] = R22(b2, c2, d2, e2, a2, w14, 7);
        [a1, c1] = R21(a1, b1, c1, d1, e1, w0, 12);
        [a2, c2] = R22(a2, b2, c2, d2, e2, w15, 7);
        [e1, b1] = R21(e1, a1, b1, c1, d1, w9, 15);
        [e2, b2] = R22(e2, a2, b2, c2, d2, w8, 12);
        [d1, a1] = R21(d1, e1, a1, b1, c1, w5, 9);
        [d2, a2] = R22(d2, e2, a2, b2, c2, w12, 7);
        [c1, e1] = R21(c1, d1, e1, a1, b1, w2, 11);
        [c2, e2] = R22(c2, d2, e2, a2, b2, w4, 6);
        [b1, d1] = R21(b1, c1, d1, e1, a1, w14, 7);
        [b2, d2] = R22(b2, c2, d2, e2, a2, w9, 15);
        [a1, c1] = R21(a1, b1, c1, d1, e1, w11, 13);
        [a2, c2] = R22(a2, b2, c2, d2, e2, w1, 13);
        [e1, b1] = R21(e1, a1, b1, c1, d1, w8, 12);
        [e2, b2] = R22(e2, a2, b2, c2, d2, w2, 11);
        [d1, a1] = R31(d1, e1, a1, b1, c1, w3, 11);
        [d2, a2] = R32(d2, e2, a2, b2, c2, w15, 9);
        [c1, e1] = R31(c1, d1, e1, a1, b1, w10, 13);
        [c2, e2] = R32(c2, d2, e2, a2, b2, w5, 7);
        [b1, d1] = R31(b1, c1, d1, e1, a1, w14, 6);
        [b2, d2] = R32(b2, c2, d2, e2, a2, w1, 15);
        [a1, c1] = R31(a1, b1, c1, d1, e1, w4, 7);
        [a2, c2] = R32(a2, b2, c2, d2, e2, w3, 11);
        [e1, b1] = R31(e1, a1, b1, c1, d1, w9, 14);
        [e2, b2] = R32(e2, a2, b2, c2, d2, w7, 8);
        [d1, a1] = R31(d1, e1, a1, b1, c1, w15, 9);
        [d2, a2] = R32(d2, e2, a2, b2, c2, w14, 6);
        [c1, e1] = R31(c1, d1, e1, a1, b1, w8, 13);
        [c2, e2] = R32(c2, d2, e2, a2, b2, w6, 6);
        [b1, d1] = R31(b1, c1, d1, e1, a1, w1, 15);
        [b2, d2] = R32(b2, c2, d2, e2, a2, w9, 14);
        [a1, c1] = R31(a1, b1, c1, d1, e1, w2, 14);
        [a2, c2] = R32(a2, b2, c2, d2, e2, w11, 12);
        [e1, b1] = R31(e1, a1, b1, c1, d1, w7, 8);
        [e2, b2] = R32(e2, a2, b2, c2, d2, w8, 13);
        [d1, a1] = R31(d1, e1, a1, b1, c1, w0, 13);
        [d2, a2] = R32(d2, e2, a2, b2, c2, w12, 5);
        [c1, e1] = R31(c1, d1, e1, a1, b1, w6, 6);
        [c2, e2] = R32(c2, d2, e2, a2, b2, w2, 14);
        [b1, d1] = R31(b1, c1, d1, e1, a1, w13, 5);
        [b2, d2] = R32(b2, c2, d2, e2, a2, w10, 13);
        [a1, c1] = R31(a1, b1, c1, d1, e1, w11, 12);
        [a2, c2] = R32(a2, b2, c2, d2, e2, w0, 13);
        [e1, b1] = R31(e1, a1, b1, c1, d1, w5, 7);
        [e2, b2] = R32(e2, a2, b2, c2, d2, w4, 7);
        [d1, a1] = R31(d1, e1, a1, b1, c1, w12, 5);
        [d2, a2] = R32(d2, e2, a2, b2, c2, w13, 5);
        [c1, e1] = R41(c1, d1, e1, a1, b1, w1, 11);
        [c2, e2] = R42(c2, d2, e2, a2, b2, w8, 15);
        [b1, d1] = R41(b1, c1, d1, e1, a1, w9, 12);
        [b2, d2] = R42(b2, c2, d2, e2, a2, w6, 5);
        [a1, c1] = R41(a1, b1, c1, d1, e1, w11, 14);
        [a2, c2] = R42(a2, b2, c2, d2, e2, w4, 8);
        [e1, b1] = R41(e1, a1, b1, c1, d1, w10, 15);
        [e2, b2] = R42(e2, a2, b2, c2, d2, w1, 11);
        [d1, a1] = R41(d1, e1, a1, b1, c1, w0, 14);
        [d2, a2] = R42(d2, e2, a2, b2, c2, w3, 14);
        [c1, e1] = R41(c1, d1, e1, a1, b1, w8, 15);
        [c2, e2] = R42(c2, d2, e2, a2, b2, w11, 14);
        [b1, d1] = R41(b1, c1, d1, e1, a1, w12, 9);
        [b2, d2] = R42(b2, c2, d2, e2, a2, w15, 6);
        [a1, c1] = R41(a1, b1, c1, d1, e1, w4, 8);
        [a2, c2] = R42(a2, b2, c2, d2, e2, w0, 14);
        [e1, b1] = R41(e1, a1, b1, c1, d1, w13, 9);
        [e2, b2] = R42(e2, a2, b2, c2, d2, w5, 6);
        [d1, a1] = R41(d1, e1, a1, b1, c1, w3, 14);
        [d2, a2] = R42(d2, e2, a2, b2, c2, w12, 9);
        [c1, e1] = R41(c1, d1, e1, a1, b1, w7, 5);
        [c2, e2] = R42(c2, d2, e2, a2, b2, w2, 12);
        [b1, d1] = R41(b1, c1, d1, e1, a1, w15, 6);
        [b2, d2] = R42(b2, c2, d2, e2, a2, w13, 9);
        [a1, c1] = R41(a1, b1, c1, d1, e1, w14, 8);
        [a2, c2] = R42(a2, b2, c2, d2, e2, w9, 12);
        [e1, b1] = R41(e1, a1, b1, c1, d1, w5, 6);
        [e2, b2] = R42(e2, a2, b2, c2, d2, w7, 5);
        [d1, a1] = R41(d1, e1, a1, b1, c1, w6, 5);
        [d2, a2] = R42(d2, e2, a2, b2, c2, w10, 15);
        [c1, e1] = R41(c1, d1, e1, a1, b1, w2, 12);
        [c2, e2] = R42(c2, d2, e2, a2, b2, w14, 8);
        [b1, d1] = R51(b1, c1, d1, e1, a1, w4, 9);
        [b2, d2] = R52(b2, c2, d2, e2, a2, w12, 8);
        [a1, c1] = R51(a1, b1, c1, d1, e1, w0, 15);
        [a2, c2] = R52(a2, b2, c2, d2, e2, w15, 5);
        [e1, b1] = R51(e1, a1, b1, c1, d1, w5, 5);
        [e2, b2] = R52(e2, a2, b2, c2, d2, w10, 12);
        [d1, a1] = R51(d1, e1, a1, b1, c1, w9, 11);
        [d2, a2] = R52(d2, e2, a2, b2, c2, w4, 9);
        [c1, e1] = R51(c1, d1, e1, a1, b1, w7, 6);
        [c2, e2] = R52(c2, d2, e2, a2, b2, w1, 12);
        [b1, d1] = R51(b1, c1, d1, e1, a1, w12, 8);
        [b2, d2] = R52(b2, c2, d2, e2, a2, w5, 5);
        [a1, c1] = R51(a1, b1, c1, d1, e1, w2, 13);
        [a2, c2] = R52(a2, b2, c2, d2, e2, w8, 14);
        [e1, b1] = R51(e1, a1, b1, c1, d1, w10, 12);
        [e2, b2] = R52(e2, a2, b2, c2, d2, w7, 6);
        [d1, a1] = R51(d1, e1, a1, b1, c1, w14, 5);
        [d2, a2] = R52(d2, e2, a2, b2, c2, w6, 8);
        [c1, e1] = R51(c1, d1, e1, a1, b1, w1, 12);
        [c2, e2] = R52(c2, d2, e2, a2, b2, w2, 13);
        [b1, d1] = R51(b1, c1, d1, e1, a1, w3, 13);
        [b2, d2] = R52(b2, c2, d2, e2, a2, w13, 6);
        [a1, c1] = R51(a1, b1, c1, d1, e1, w8, 14);
        [a2, c2] = R52(a2, b2, c2, d2, e2, w14, 5);
        [e1, b1] = R51(e1, a1, b1, c1, d1, w11, 11);
        [e2, b2] = R52(e2, a2, b2, c2, d2, w0, 15);
        [d1, a1] = R51(d1, e1, a1, b1, c1, w6, 8);
        [d2, a2] = R52(d2, e2, a2, b2, c2, w3, 13);
        [c1, e1] = R51(c1, d1, e1, a1, b1, w15, 5);
        [c2, e2] = R52(c2, d2, e2, a2, b2, w9, 11);
        [b1, d1] = R51(b1, c1, d1, e1, a1, w13, 6);
        [b2, d2] = R52(b2, c2, d2, e2, a2, w11, 11);
        const t = s[0];
        s[0] = s[1] + c1 + d2;
        s[1] = s[2] + d1 + e2;
        s[2] = s[3] + e1 + a2;
        s[3] = s[4] + a1 + b2;
        s[4] = t + b1 + c2;
    }
    write(data, len) {
        let bufsize = this.bytes % 64;
        let padding = 0;
        if (bufsize && bufsize + len >= BLOCK_SIZE) {
            this.buffer.set(slice(data, 0, BLOCK_SIZE - bufsize), bufsize);
            this.bytes += BLOCK_SIZE - bufsize;
            padding += BLOCK_SIZE - bufsize;
            this.processBlock(this.buffer);
            bufsize = 0;
        }
        while (len - padding >= 64) {
            this.processBlock(slice(data, padding, padding + BLOCK_SIZE));
            this.bytes += BLOCK_SIZE;
            padding += BLOCK_SIZE;
        }
        if (len > padding) {
            this.buffer.set(slice(data, padding, len), bufsize);
            this.bytes += len - padding;
        }
    }
    result() {
        const { h, bytes } = this;
        const pad = new Uint32Array(BLOCK_SIZE);
        const hash = new Uint32Array(OUTPUT_SIZE);
        pad[0] = 0x80;
        const sizedesc = new Array(8);
        writeLE64(sizedesc, 0, bytes << 3);
        this.write(pad, 1 + ((119 - (bytes % 64)) % 64));
        this.write(sizedesc, 8);
        writeLE32(hash, 0, h[0]);
        writeLE32(hash, 4, h[1]);
        writeLE32(hash, 8, h[2]);
        writeLE32(hash, 12, h[3]);
        writeLE32(hash, 16, h[4]);
        return hash;
    }
}
function u32to8(u32) {
    const u8 = new Uint8Array(u32.length);
    for (let i = 0; i < u32.length; i++) {
        const hs = (u32[i] & 255).toString(16);
        u8[i] = parseInt(`0${hs}`.slice(-2), 16);
    }
    return u8;
}
function toHex(uint8a) {
    return Array.from(uint8a).map(c => c.toString(16).padStart(2, '0')).join('');
}
function ripemd160(message) {
    const hasher = new Ripemd160();
    if (typeof message === "string") {
        hasher.input(message);
    }
    else {
        hasher.write(message, message.length);
    }
    const hash = u32to8(hasher.result());
    return typeof message === "string" ? toHex(hash) : hash;
}
exports.default = ripemd160;
});

var md160 = /*@__PURE__*/unwrapExports(nobleRipemd160);

var nobleSecp256k1 = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
const CURVE = {
    a: 0n,
    b: 7n,
    P: 2n ** 256n - 2n ** 32n - 977n,
    n: 2n ** 256n - 432420386565659656852420866394968145599n,
    h: 1n,
    Gx: 55066263022277343669578718895168534326250603453777594175500187360389116729240n,
    Gy: 32670510020758816978083085130507043184471273380659243275938904335757337482424n,
    beta: 0x7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501een,
};
exports.CURVE = CURVE;
const P_DIV4_1 = (CURVE.P + 1n) / 4n;
function weistrass(x) {
    const { a, b } = CURVE;
    return mod(x ** 3n + a * x + b);
}
const PRIME_SIZE = 256;
const USE_ENDOMORPHISM = CURVE.a === 0n;
class JacobianPoint {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    static fromAffine(p) {
        if (!(p instanceof Point)) {
            throw new TypeError('JacobianPoint#fromAffine: expected Point');
        }
        return new JacobianPoint(p.x, p.y, 1n);
    }
    static toAffineBatch(points) {
        const toInv = invertBatch(points.map((p) => p.z));
        return points.map((p, i) => p.toAffine(toInv[i]));
    }
    static normalizeZ(points) {
        return JacobianPoint.toAffineBatch(points).map(JacobianPoint.fromAffine);
    }
    equals(other) {
        const a = this;
        const b = other;
        const az2 = mod(a.z * a.z);
        const az3 = mod(a.z * az2);
        const bz2 = mod(b.z * b.z);
        const bz3 = mod(b.z * bz2);
        return mod(a.x * bz2) === mod(az2 * b.x) && mod(a.y * bz3) === mod(az3 * b.y);
    }
    negate() {
        return new JacobianPoint(this.x, mod(-this.y), this.z);
    }
    double() {
        const X1 = this.x;
        const Y1 = this.y;
        const Z1 = this.z;
        const A = X1 ** 2n;
        const B = Y1 ** 2n;
        const C = B ** 2n;
        const D = 2n * ((X1 + B) ** 2n - A - C);
        const E = 3n * A;
        const F = E ** 2n;
        const X3 = mod(F - 2n * D);
        const Y3 = mod(E * (D - X3) - 8n * C);
        const Z3 = mod(2n * Y1 * Z1);
        return new JacobianPoint(X3, Y3, Z3);
    }
    add(other) {
        if (!(other instanceof JacobianPoint)) {
            throw new TypeError('JacobianPoint#add: expected JacobianPoint');
        }
        const X1 = this.x;
        const Y1 = this.y;
        const Z1 = this.z;
        const X2 = other.x;
        const Y2 = other.y;
        const Z2 = other.z;
        if (X2 === 0n || Y2 === 0n)
            return this;
        if (X1 === 0n || Y1 === 0n)
            return other;
        const Z1Z1 = Z1 ** 2n;
        const Z2Z2 = Z2 ** 2n;
        const U1 = X1 * Z2Z2;
        const U2 = X2 * Z1Z1;
        const S1 = Y1 * Z2 * Z2Z2;
        const S2 = Y2 * Z1 * Z1Z1;
        const H = mod(U2 - U1);
        const r = mod(S2 - S1);
        if (H === 0n) {
            if (r === 0n) {
                return this.double();
            }
            else {
                return JacobianPoint.ZERO;
            }
        }
        const HH = mod(H ** 2n);
        const HHH = mod(H * HH);
        const V = U1 * HH;
        const X3 = mod(r ** 2n - HHH - 2n * V);
        const Y3 = mod(r * (V - X3) - S1 * HHH);
        const Z3 = mod(Z1 * Z2 * H);
        return new JacobianPoint(X3, Y3, Z3);
    }
    multiplyUnsafe(scalar) {
        if (typeof scalar !== 'number' && typeof scalar !== 'bigint') {
            throw new TypeError('Point#multiply: expected number or bigint');
        }
        let n = mod(BigInt(scalar), CURVE.n);
        if (n <= 0) {
            throw new Error('Point#multiply: invalid scalar, expected positive integer');
        }
        if (!USE_ENDOMORPHISM) {
            let p = JacobianPoint.ZERO;
            let d = this;
            while (n > 0n) {
                if (n & 1n)
                    p = p.add(d);
                d = d.double();
                n >>= 1n;
            }
            return p;
        }
        let [k1neg, k1, k2neg, k2] = splitScalar(n);
        let k1p = JacobianPoint.ZERO;
        let k2p = JacobianPoint.ZERO;
        let d = this;
        while (k1 > 0n || k2 > 0n) {
            if (k1 & 1n)
                k1p = k1p.add(d);
            if (k2 & 1n)
                k2p = k2p.add(d);
            d = d.double();
            k1 >>= 1n;
            k2 >>= 1n;
        }
        if (k1neg)
            k1p = k1p.negate();
        if (k2neg)
            k2p = k2p.negate();
        k2p = new JacobianPoint(mod(k2p.x * CURVE.beta), k2p.y, k2p.z);
        return k1p.add(k2p);
    }
    precomputeWindow(W) {
        const windows = USE_ENDOMORPHISM ? 128 / W + 2 : 256 / W + 1;
        let points = [];
        let p = this;
        let base = p;
        for (let window = 0; window < windows; window++) {
            base = p;
            points.push(base);
            for (let i = 1; i < 2 ** (W - 1); i++) {
                base = base.add(p);
                points.push(base);
            }
            p = base.double();
        }
        return points;
    }
    wNAF(n, affinePoint) {
        if (!affinePoint && this.equals(JacobianPoint.BASE))
            affinePoint = Point.BASE;
        const W = (affinePoint && affinePoint._WINDOW_SIZE) || 1;
        if (256 % W) {
            throw new Error('Point#wNAF: Invalid precomputation window, must be power of 2');
        }
        let precomputes = affinePoint && pointPrecomputes.get(affinePoint);
        if (!precomputes) {
            precomputes = this.precomputeWindow(W);
            if (affinePoint && W !== 1) {
                precomputes = JacobianPoint.normalizeZ(precomputes);
                pointPrecomputes.set(affinePoint, precomputes);
            }
        }
        let p = JacobianPoint.ZERO;
        let f = JacobianPoint.ZERO;
        const windows = USE_ENDOMORPHISM ? 128 / W + 2 : 256 / W + 1;
        const windowSize = 2 ** (W - 1);
        const mask = BigInt(2 ** W - 1);
        const maxNumber = 2 ** W;
        const shiftBy = BigInt(W);
        for (let window = 0; window < windows; window++) {
            const offset = window * windowSize;
            let wbits = Number(n & mask);
            n >>= shiftBy;
            if (wbits > windowSize) {
                wbits -= maxNumber;
                n += 1n;
            }
            if (wbits === 0) {
                f = f.add(window % 2 ? precomputes[offset].negate() : precomputes[offset]);
            }
            else {
                const cached = precomputes[offset + Math.abs(wbits) - 1];
                p = p.add(wbits < 0 ? cached.negate() : cached);
            }
        }
        return [p, f];
    }
    multiply(scalar, affinePoint) {
        if (typeof scalar !== 'number' && typeof scalar !== 'bigint') {
            throw new TypeError('Point#multiply: expected number or bigint');
        }
        let n = mod(BigInt(scalar), CURVE.n);
        if (n <= 0) {
            throw new Error('Point#multiply: invalid scalar, expected positive integer');
        }
        let point;
        let fake;
        if (USE_ENDOMORPHISM) {
            const [k1neg, k1, k2neg, k2] = splitScalar(n);
            let k1p, k2p, f1p, f2p;
            [k1p, f1p] = this.wNAF(k1, affinePoint);
            [k2p, f2p] = this.wNAF(k2, affinePoint);
            if (k1neg)
                k1p = k1p.negate();
            if (k2neg)
                k2p = k2p.negate();
            k2p = new JacobianPoint(mod(k2p.x * CURVE.beta), k2p.y, k2p.z);
            [point, fake] = [k1p.add(k2p), f1p.add(f2p)];
        }
        else {
            [point, fake] = this.wNAF(n, affinePoint);
        }
        return JacobianPoint.normalizeZ([point, fake])[0];
    }
    toAffine(invZ = invert(this.z)) {
        const invZ2 = invZ ** 2n;
        const x = mod(this.x * invZ2);
        const y = mod(this.y * invZ2 * invZ);
        return new Point(x, y);
    }
}
JacobianPoint.BASE = new JacobianPoint(CURVE.Gx, CURVE.Gy, 1n);
JacobianPoint.ZERO = new JacobianPoint(0n, 0n, 1n);
const pointPrecomputes = new WeakMap();
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    _setWindowSize(windowSize) {
        this._WINDOW_SIZE = windowSize;
        pointPrecomputes.delete(this);
    }
    static fromCompressedHex(bytes) {
        if (bytes.length !== 33) {
            throw new TypeError(`Point.fromHex: compressed expects 66 bytes, not ${bytes.length * 2}`);
        }
        const x = arrayToNumber(bytes.slice(1));
        const sqrY = weistrass(x);
        let y = powMod(sqrY, P_DIV4_1, CURVE.P);
        const isFirstByteOdd = (bytes[0] & 1) === 1;
        const isYOdd = (y & 1n) === 1n;
        if (isFirstByteOdd !== isYOdd) {
            y = mod(-y);
        }
        const point = new Point(x, y);
        point.assertValidity();
        return point;
    }
    static fromUncompressedHex(bytes) {
        if (bytes.length !== 65) {
            throw new TypeError(`Point.fromHex: uncompressed expects 130 bytes, not ${bytes.length * 2}`);
        }
        const x = arrayToNumber(bytes.slice(1, 33));
        const y = arrayToNumber(bytes.slice(33));
        const point = new Point(x, y);
        point.assertValidity();
        return point;
    }
    static fromHex(hex) {
        const bytes = hex instanceof Uint8Array ? hex : hexToArray(hex);
        const header = bytes[0];
        if (header === 0x02 || header === 0x03)
            return this.fromCompressedHex(bytes);
        if (header === 0x04)
            return this.fromUncompressedHex(bytes);
        throw new TypeError('Point.fromHex: received invalid point');
    }
    static fromPrivateKey(privateKey) {
        return Point.BASE.multiply(normalizePrivateKey(privateKey));
    }
    static fromSignature(msgHash, signature, recovery) {
        const sign = normalizeSignature(signature);
        const { r, s } = sign;
        if (r === 0n || s === 0n)
            return;
        const rinv = invert(r, CURVE.n);
        const h = typeof msgHash === 'string' ? hexToNumber(msgHash) : arrayToNumber(msgHash);
        const P_ = Point.fromHex(`0${2 + (recovery & 1)}${pad64(r)}`);
        const sP = JacobianPoint.fromAffine(P_).multiplyUnsafe(s);
        const hG = JacobianPoint.BASE.multiply(h).negate();
        const Q = sP.add(hG).multiplyUnsafe(rinv);
        const point = Q.toAffine();
        point.assertValidity();
        return point;
    }
    toRawBytes(isCompressed = false) {
        return hexToArray(this.toHex(isCompressed));
    }
    toHex(isCompressed = false) {
        const x = pad64(this.x);
        if (isCompressed) {
            return `${this.y & 1n ? '03' : '02'}${x}`;
        }
        else {
            return `04${x}${pad64(this.y)}`;
        }
    }
    assertValidity() {
        const { x, y } = this;
        if (x === 0n || y === 0n || x >= CURVE.P || y >= CURVE.P) {
            throw new TypeError('Point is not on elliptic curve');
        }
        const left = mod(y * y);
        const right = weistrass(x);
        const valid = (left - right) % CURVE.P === 0n;
        if (!valid)
            throw new TypeError('Point is not on elliptic curve');
    }
    equals(other) {
        return this.x === other.x && this.y === other.y;
    }
    negate() {
        return new Point(this.x, mod(-this.y));
    }
    double() {
        return JacobianPoint.fromAffine(this).double().toAffine();
    }
    add(other) {
        return JacobianPoint.fromAffine(this).add(JacobianPoint.fromAffine(other)).toAffine();
    }
    subtract(other) {
        return this.add(other.negate());
    }
    multiply(scalar) {
        return JacobianPoint.fromAffine(this).multiply(scalar, this).toAffine();
    }
}
exports.Point = Point;
Point.BASE = new Point(CURVE.Gx, CURVE.Gy);
Point.ZERO = new Point(0n, 0n);
class SignResult {
    constructor(r, s) {
        this.r = r;
        this.s = s;
    }
    static fromHex(hex) {
        const str = hex instanceof Uint8Array ? arrayToHex(hex) : hex;
        if (typeof str !== 'string')
            throw new TypeError({}.toString.call(hex));
        const check1 = str.slice(0, 2);
        const length = parseByte(str.slice(2, 4));
        const check2 = str.slice(4, 6);
        if (check1 !== '30' || length !== str.length - 4 || check2 !== '02') {
            throw new Error('SignResult.fromHex: Invalid signature');
        }
        const rLen = parseByte(str.slice(6, 8));
        const rEnd = 8 + rLen;
        const r = hexToNumber(str.slice(8, rEnd));
        const check3 = str.slice(rEnd, rEnd + 2);
        if (check3 !== '02') {
            throw new Error('SignResult.fromHex: Invalid signature');
        }
        const sLen = parseByte(str.slice(rEnd + 2, rEnd + 4));
        const sStart = rEnd + 4;
        const s = hexToNumber(str.slice(sStart, sStart + sLen));
        return new SignResult(r, s);
    }
    toRawBytes(isCompressed = false) {
        return hexToArray(this.toHex(isCompressed));
    }
    toHex(isCompressed = false) {
        const sHex = numberToHex(this.s);
        if (isCompressed)
            return sHex;
        const rHex = numberToHex(this.r);
        const rLen = numberToHex(rHex.length / 2);
        const sLen = numberToHex(sHex.length / 2);
        const length = numberToHex(rHex.length / 2 + sHex.length / 2 + 4);
        return `30${length}02${rLen}${rHex}02${sLen}${sHex}`;
    }
}
exports.SignResult = SignResult;
function concatTypedArrays(...arrays) {
    if (arrays.length === 1)
        return arrays[0];
    const length = arrays.reduce((a, arr) => a + arr.length, 0);
    const result = new Uint8Array(length);
    for (let i = 0, pad = 0; i < arrays.length; i++) {
        const arr = arrays[i];
        result.set(arr, pad);
        pad += arr.length;
    }
    return result;
}
function arrayToHex(uint8a) {
    let hex = '';
    for (let i = 0; i < uint8a.length; i++) {
        hex += uint8a[i].toString(16).padStart(2, '0');
    }
    return hex;
}
function pad64(num) {
    return num.toString(16).padStart(64, '0');
}
function numberToHex(num) {
    const hex = num.toString(16);
    return hex.length & 1 ? `0${hex}` : hex;
}
function hexToNumber(hex) {
    if (typeof hex !== 'string') {
        throw new TypeError('hexToNumber: expected string, got ' + typeof hex);
    }
    return BigInt(`0x${hex}`);
}
function hexToArray(hex) {
    hex = hex.length & 1 ? `0${hex}` : hex;
    const array = new Uint8Array(hex.length / 2);
    for (let i = 0; i < array.length; i++) {
        let j = i * 2;
        array[i] = Number.parseInt(hex.slice(j, j + 2), 16);
    }
    return array;
}
function arrayToNumber(bytes) {
    return hexToNumber(arrayToHex(bytes));
}
function parseByte(str) {
    return Number.parseInt(str, 16) * 2;
}
function mod(a, b = CURVE.P) {
    const result = a % b;
    return result >= 0 ? result : b + result;
}
function powMod(x, power, order) {
    let res = 1n;
    while (power > 0) {
        if (power & 1n) {
            res = mod(res * x, order);
        }
        power >>= 1n;
        x = mod(x * x, order);
    }
    return res;
}
function egcd(a, b) {
    let [x, y, u, v] = [0n, 1n, 1n, 0n];
    while (a !== 0n) {
        let q = b / a;
        let r = b % a;
        let m = x - u * q;
        let n = y - v * q;
        [b, a] = [a, r];
        [x, y] = [u, v];
        [u, v] = [m, n];
    }
    let gcd = b;
    return [gcd, x, y];
}
function invert(number, modulo = CURVE.P) {
    if (number === 0n || modulo <= 0n) {
        throw new Error('invert: expected positive integers');
    }
    let [gcd, x] = egcd(mod(number, modulo), modulo);
    if (gcd !== 1n) {
        throw new Error('invert: does not exist');
    }
    return mod(x, modulo);
}
function invertBatch(nums, n = CURVE.P) {
    const len = nums.length;
    const scratch = new Array(len);
    let acc = 1n;
    for (let i = 0; i < len; i++) {
        if (nums[i] === 0n)
            continue;
        scratch[i] = acc;
        acc = mod(acc * nums[i], n);
    }
    acc = invert(acc, n);
    for (let i = len - 1; i >= 0; i--) {
        if (nums[i] === 0n)
            continue;
        let tmp = mod(acc * nums[i], n);
        nums[i] = mod(acc * scratch[i], n);
        acc = tmp;
    }
    return nums;
}
function splitScalar(k) {
    const { n } = CURVE;
    const a1 = 0x3086d221a7d46bcde86c90e49284eb15n;
    const b1 = -0xe4437ed6010e88286f547fa90abfe4c3n;
    const a2 = 0x114ca50f7a8e2f3f657c1108d9d44cfd8n;
    const b2 = a1;
    const c1 = (b2 * k) / n;
    const c2 = (-b1 * k) / n;
    const k1 = k - c1 * a1 - c2 * a2;
    const k2 = -c1 * b1 - c2 * b2;
    const k1neg = k1 < 0;
    const k2neg = k2 < 0;
    return [k1neg, k1neg ? -k1 : k1, k2neg, k2neg ? -k2 : k2];
}
function truncateHash(hash) {
    hash = typeof hash === 'string' ? hash : arrayToHex(hash);
    let msg = hexToNumber(hash || '0');
    const delta = (hash.length / 2) * 8 - PRIME_SIZE;
    if (delta > 0) {
        msg = msg >> BigInt(delta);
    }
    if (msg >= CURVE.n) {
        msg -= CURVE.n;
    }
    return msg;
}
async function getQRSrfc6979(msgHash, privateKey) {
    const num = typeof msgHash === 'string' ? hexToNumber(msgHash) : arrayToNumber(msgHash);
    const h1 = hexToArray(pad64(num));
    const x = hexToArray(pad64(privateKey));
    const h1n = arrayToNumber(h1);
    let v = new Uint8Array(32).fill(1);
    let k = new Uint8Array(32).fill(0);
    const b0 = Uint8Array.from([0x00]);
    const b1 = Uint8Array.from([0x01]);
    k = await exports.utils.hmacSha256(k, v, b0, x, h1);
    v = await exports.utils.hmacSha256(k, v);
    k = await exports.utils.hmacSha256(k, v, b1, x, h1);
    v = await exports.utils.hmacSha256(k, v);
    for (let i = 0; i < 1000; i++) {
        v = await exports.utils.hmacSha256(k, v);
        const T = arrayToNumber(v);
        let qrs;
        if (isValidPrivateKey(T) && (qrs = calcQRSFromK(T, h1n, privateKey))) {
            return qrs;
        }
        k = await exports.utils.hmacSha256(k, v, b0);
        v = await exports.utils.hmacSha256(k, v);
    }
    throw new TypeError('secp256k1: Tried 1,000 k values for sign(), all were invalid');
}
function isValidPrivateKey(privateKey) {
    return 0 < privateKey && privateKey < CURVE.n;
}
function calcQRSFromK(k, msg, priv) {
    const max = CURVE.n;
    const q = Point.BASE.multiply(k);
    const r = mod(q.x, max);
    const s = mod(invert(k, max) * (msg + r * priv), max);
    if (r === 0n || s === 0n)
        return;
    return [q, r, s];
}
function normalizePrivateKey(privateKey) {
    if (!privateKey)
        throw new Error(`Expected receive valid private key, not "${privateKey}"`);
    let key;
    if (privateKey instanceof Uint8Array) {
        key = arrayToNumber(privateKey);
    }
    else if (typeof privateKey === 'string') {
        key = hexToNumber(privateKey);
    }
    else {
        key = BigInt(privateKey);
    }
    return key;
}
function normalizePublicKey(publicKey) {
    return publicKey instanceof Point ? publicKey : Point.fromHex(publicKey);
}
function normalizeSignature(signature) {
    return signature instanceof SignResult ? signature : SignResult.fromHex(signature);
}
function getPublicKey(privateKey, isCompressed = false) {
    const point = Point.fromPrivateKey(privateKey);
    if (typeof privateKey === 'string') {
        return point.toHex(isCompressed);
    }
    return point.toRawBytes(isCompressed);
}
exports.getPublicKey = getPublicKey;
function recoverPublicKey(msgHash, signature, recovery) {
    const point = Point.fromSignature(msgHash, signature, recovery);
    if (!point)
        return;
    return typeof msgHash === 'string' ? point.toHex() : point.toRawBytes();
}
exports.recoverPublicKey = recoverPublicKey;
function isPub(item) {
    const arr = item instanceof Uint8Array;
    const str = typeof item === 'string';
    const len = (arr || str) && item.length;
    if (arr)
        return len === 33 || len === 65;
    if (str)
        return len === 66 || len === 130;
    if (item instanceof Point)
        return true;
    return false;
}
function getSharedSecret(privateA, publicB, isCompressed = false) {
    if (isPub(privateA) && !isPub(publicB)) {
        [privateA, publicB] = [publicB, privateA];
    }
    else if (!isPub(publicB)) {
        throw new Error('Received invalid keys');
    }
    const b = publicB instanceof Point ? publicB : Point.fromHex(publicB);
    b.assertValidity();
    const shared = b.multiply(normalizePrivateKey(privateA));
    return typeof privateA === 'string'
        ? shared.toHex(isCompressed)
        : shared.toRawBytes(isCompressed);
}
exports.getSharedSecret = getSharedSecret;
async function sign(msgHash, privateKey, { recovered, canonical } = {}) {
    if (msgHash == null)
        throw new Error(`Expected valid msgHash, not "${msgHash}"`);
    const priv = normalizePrivateKey(privateKey);
    const [q, r, s] = await getQRSrfc6979(msgHash, priv);
    let recovery = (q.x === r ? 0 : 2) | Number(q.y & 1n);
    let adjustedS = s;
    const HIGH_NUMBER = CURVE.n >> 1n;
    if (s > HIGH_NUMBER && canonical) {
        adjustedS = CURVE.n - s;
        recovery ^= 1;
    }
    const sig = new SignResult(r, adjustedS);
    const hashed = typeof msgHash === 'string' ? sig.toHex() : sig.toRawBytes();
    return recovered ? [hashed, recovery] : hashed;
}
exports.sign = sign;
function verify(signature, msgHash, publicKey) {
    const h = truncateHash(msgHash);
    const { r, s } = normalizeSignature(signature);
    const pubKey = JacobianPoint.fromAffine(normalizePublicKey(publicKey));
    const s1 = invert(s, CURVE.n);
    const Ghs1 = JacobianPoint.BASE.multiply(mod(h * s1, CURVE.n));
    const Prs1 = pubKey.multiplyUnsafe(mod(r * s1, CURVE.n));
    const res = Ghs1.add(Prs1).toAffine();
    return res.x === r;
}
exports.verify = verify;
Point.BASE._setWindowSize(8);
exports.utils = {
    isValidPrivateKey(privateKey) {
        return isValidPrivateKey(normalizePrivateKey(privateKey));
    },
    randomPrivateKey: (bytesLength = 32) => {
        if (typeof window == 'object' && 'crypto' in window) {
            return window.crypto.getRandomValues(new Uint8Array(bytesLength));
        }
        else if (typeof process === 'object' && 'node' in process.versions) {
            const { randomBytes } = crypto$1;
            return new Uint8Array(randomBytes(bytesLength).buffer);
        }
        else {
            throw new Error("The environment doesn't have randomBytes function");
        }
    },
    hmacSha256: async (key, ...messages) => {
        if (typeof window == 'object' && 'crypto' in window) {
            const ckey = await window.crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: { name: 'SHA-256' } }, false, ['sign', 'verify']);
            const message = concatTypedArrays(...messages);
            const buffer = await window.crypto.subtle.sign('HMAC', ckey, message);
            return new Uint8Array(buffer);
        }
        else if (typeof process === 'object' && 'node' in process.versions) {
            const { createHmac, randomBytes } = crypto$1;
            const hash = createHmac('sha256', key);
            for (let message of messages) {
                hash.update(message);
            }
            return Uint8Array.from(hash.digest());
        }
        else {
            throw new Error("The environment doesn't have hmac-sha256 function");
        }
    },
    precompute(windowSize = 8, point = Point.BASE) {
        const cached = point === Point.BASE ? point : new Point(point.x, point.y);
        cached._setWindowSize(windowSize);
        cached.multiply(3n);
        return cached;
    },
};
});

var secp = /*@__PURE__*/unwrapExports(nobleSecp256k1);

function privateToPublic (_privateKey) {
  const privateKey = bufferify(_privateKey);

  return secp.getPublicKey(privateKey, false).slice(1);
}

async function ecsign (msgHash, privateKey, chainId) {
  // DER encoding
  // 0x30${length}02${rLen}${r}02${sLen}${s}
  const _sig = await secp.sign(msgHash, privateKey, { recovered: true, canonical: true });
  const sig = new Uint8Array(64);

  let offset = 3;
  const rLen = _sig[0][offset];
  const sLen = _sig[0][offset += (rLen + 2)];

  offset = 4;
  sig.set(_sig[0].subarray(offset, offset += rLen), 32 - rLen);
  offset += 2;
  sig.set(_sig[0].subarray(offset, offset + sLen), 64 - sLen);

  const recovery = _sig[1];
  return {
    r: sig.slice(0, 32),
    s: sig.slice(32, 64),
    v: chainId ? recovery + (chainId * 2 + 35) : recovery + 27,
  };
}
function ecrecover (msgHash, v, r, s, chainId) {
  const recovery = chainId ? v - (2 * chainId + 35) : v - 27;

  if (recovery !== 0 && recovery !== 1) {
    throw new Error('Invalid signature v value');
  }

  // DER encoding
  // 0x30${length}02${rLen}${r}02${sLen}${s}
  const sig = new Uint8Array(70);
  sig[0] = 48;
  sig[1] = 68;
  sig[2] = 2;
  sig[3] = 32;
  sig.set(r, 4 + (32 - r.length));
  sig[36] = 2;
  sig[37] = 32;
  sig.set(s, 38 + (32 - s.length));

  return secp.recoverPublicKey(msgHash, sig, recovery).slice(1);
}

// adapted from

function encodeLength (len, offset) {
  if (len < 56) {
    return [len + offset];
  } else {
    const hexLength = arrayify(len);
    const lLength = hexLength.length;
    const firstByte = arrayify(offset + 55 + lLength);

    return firstByte.concat(hexLength);
  }
}

// this doesn't support a complete RLP encoding,
// inner lists are not supported
function encode (input) {
  let ret = [];

  for (const v of input) {
    if (!v && (typeof v === 'number' || typeof v === 'bigint')) {
      ret = ret.concat(encodeLength(0, 128));
      continue;
    }

    const inputBuf = arrayify(v);

    if (inputBuf.length === 1 && inputBuf[0] < 128) {
      ret = ret.concat(inputBuf);
    } else {
      ret = ret.concat(encodeLength(inputBuf.length, 128)).concat(inputBuf);
    }
  }

  return encodeLength(ret.length, 192).concat(ret);
}

// adapted from https://github.com/cryptocoinjs/keccak.git

const P1600_ROUND_CONSTANTS = [
  1,
  0,
  32898,
  0,
  32906,
  2147483648,
  2147516416,
  2147483648,
  32907,
  0,
  2147483649,
  0,
  2147516545,
  2147483648,
  32777,
  2147483648,
  138,
  0,
  136,
  0,
  2147516425,
  0,
  2147483658,
  0,
  2147516555,
  0,
  139,
  2147483648,
  32905,
  2147483648,
  32771,
  2147483648,
  32770,
  2147483648,
  128,
  2147483648,
  32778,
  0,
  2147483658,
  2147483648,
  2147516545,
  2147483648,
  32896,
  2147483648,
  2147483649,
  0,
  2147516424,
  2147483648,
];

function p1600 (s) {
  for (let round = 0; round < 24; ++round) {
    // theta
    const lo0 = s[0] ^ s[10] ^ s[20] ^ s[30] ^ s[40];
    const hi0 = s[1] ^ s[11] ^ s[21] ^ s[31] ^ s[41];
    const lo1 = s[2] ^ s[12] ^ s[22] ^ s[32] ^ s[42];
    const hi1 = s[3] ^ s[13] ^ s[23] ^ s[33] ^ s[43];
    const lo2 = s[4] ^ s[14] ^ s[24] ^ s[34] ^ s[44];
    const hi2 = s[5] ^ s[15] ^ s[25] ^ s[35] ^ s[45];
    const lo3 = s[6] ^ s[16] ^ s[26] ^ s[36] ^ s[46];
    const hi3 = s[7] ^ s[17] ^ s[27] ^ s[37] ^ s[47];
    const lo4 = s[8] ^ s[18] ^ s[28] ^ s[38] ^ s[48];
    const hi4 = s[9] ^ s[19] ^ s[29] ^ s[39] ^ s[49];

    let lo = lo4 ^ (lo1 << 1 | hi1 >>> 31);
    let hi = hi4 ^ (hi1 << 1 | lo1 >>> 31);
    const t1slo0 = s[0] ^ lo;
    const t1shi0 = s[1] ^ hi;
    const t1slo5 = s[10] ^ lo;
    const t1shi5 = s[11] ^ hi;
    const t1slo10 = s[20] ^ lo;
    const t1shi10 = s[21] ^ hi;
    const t1slo15 = s[30] ^ lo;
    const t1shi15 = s[31] ^ hi;
    const t1slo20 = s[40] ^ lo;
    const t1shi20 = s[41] ^ hi;
    lo = lo0 ^ (lo2 << 1 | hi2 >>> 31);
    hi = hi0 ^ (hi2 << 1 | lo2 >>> 31);
    const t1slo1 = s[2] ^ lo;
    const t1shi1 = s[3] ^ hi;
    const t1slo6 = s[12] ^ lo;
    const t1shi6 = s[13] ^ hi;
    const t1slo11 = s[22] ^ lo;
    const t1shi11 = s[23] ^ hi;
    const t1slo16 = s[32] ^ lo;
    const t1shi16 = s[33] ^ hi;
    const t1slo21 = s[42] ^ lo;
    const t1shi21 = s[43] ^ hi;
    lo = lo1 ^ (lo3 << 1 | hi3 >>> 31);
    hi = hi1 ^ (hi3 << 1 | lo3 >>> 31);
    const t1slo2 = s[4] ^ lo;
    const t1shi2 = s[5] ^ hi;
    const t1slo7 = s[14] ^ lo;
    const t1shi7 = s[15] ^ hi;
    const t1slo12 = s[24] ^ lo;
    const t1shi12 = s[25] ^ hi;
    const t1slo17 = s[34] ^ lo;
    const t1shi17 = s[35] ^ hi;
    const t1slo22 = s[44] ^ lo;
    const t1shi22 = s[45] ^ hi;
    lo = lo2 ^ (lo4 << 1 | hi4 >>> 31);
    hi = hi2 ^ (hi4 << 1 | lo4 >>> 31);
    const t1slo3 = s[6] ^ lo;
    const t1shi3 = s[7] ^ hi;
    const t1slo8 = s[16] ^ lo;
    const t1shi8 = s[17] ^ hi;
    const t1slo13 = s[26] ^ lo;
    const t1shi13 = s[27] ^ hi;
    const t1slo18 = s[36] ^ lo;
    const t1shi18 = s[37] ^ hi;
    const t1slo23 = s[46] ^ lo;
    const t1shi23 = s[47] ^ hi;
    lo = lo3 ^ (lo0 << 1 | hi0 >>> 31);
    hi = hi3 ^ (hi0 << 1 | lo0 >>> 31);
    const t1slo4 = s[8] ^ lo;
    const t1shi4 = s[9] ^ hi;
    const t1slo9 = s[18] ^ lo;
    const t1shi9 = s[19] ^ hi;
    const t1slo14 = s[28] ^ lo;
    const t1shi14 = s[29] ^ hi;
    const t1slo19 = s[38] ^ lo;
    const t1shi19 = s[39] ^ hi;
    const t1slo24 = s[48] ^ lo;
    const t1shi24 = s[49] ^ hi;

    // rho & pi
    const t2slo0 = t1slo0;
    const t2shi0 = t1shi0;
    const t2slo16 = (t1shi5 << 4 | t1slo5 >>> 28);
    const t2shi16 = (t1slo5 << 4 | t1shi5 >>> 28);
    const t2slo7 = (t1slo10 << 3 | t1shi10 >>> 29);
    const t2shi7 = (t1shi10 << 3 | t1slo10 >>> 29);
    const t2slo23 = (t1shi15 << 9 | t1slo15 >>> 23);
    const t2shi23 = (t1slo15 << 9 | t1shi15 >>> 23);
    const t2slo14 = (t1slo20 << 18 | t1shi20 >>> 14);
    const t2shi14 = (t1shi20 << 18 | t1slo20 >>> 14);
    const t2slo10 = (t1slo1 << 1 | t1shi1 >>> 31);
    const t2shi10 = (t1shi1 << 1 | t1slo1 >>> 31);
    const t2slo1 = (t1shi6 << 12 | t1slo6 >>> 20);
    const t2shi1 = (t1slo6 << 12 | t1shi6 >>> 20);
    const t2slo17 = (t1slo11 << 10 | t1shi11 >>> 22);
    const t2shi17 = (t1shi11 << 10 | t1slo11 >>> 22);
    const t2slo8 = (t1shi16 << 13 | t1slo16 >>> 19);
    const t2shi8 = (t1slo16 << 13 | t1shi16 >>> 19);
    const t2slo24 = (t1slo21 << 2 | t1shi21 >>> 30);
    const t2shi24 = (t1shi21 << 2 | t1slo21 >>> 30);
    const t2slo20 = (t1shi2 << 30 | t1slo2 >>> 2);
    const t2shi20 = (t1slo2 << 30 | t1shi2 >>> 2);
    const t2slo11 = (t1slo7 << 6 | t1shi7 >>> 26);
    const t2shi11 = (t1shi7 << 6 | t1slo7 >>> 26);
    const t2slo2 = (t1shi12 << 11 | t1slo12 >>> 21);
    const t2shi2 = (t1slo12 << 11 | t1shi12 >>> 21);
    const t2slo18 = (t1slo17 << 15 | t1shi17 >>> 17);
    const t2shi18 = (t1shi17 << 15 | t1slo17 >>> 17);
    const t2slo9 = (t1shi22 << 29 | t1slo22 >>> 3);
    const t2shi9 = (t1slo22 << 29 | t1shi22 >>> 3);
    const t2slo5 = (t1slo3 << 28 | t1shi3 >>> 4);
    const t2shi5 = (t1shi3 << 28 | t1slo3 >>> 4);
    const t2slo21 = (t1shi8 << 23 | t1slo8 >>> 9);
    const t2shi21 = (t1slo8 << 23 | t1shi8 >>> 9);
    const t2slo12 = (t1slo13 << 25 | t1shi13 >>> 7);
    const t2shi12 = (t1shi13 << 25 | t1slo13 >>> 7);
    const t2slo3 = (t1slo18 << 21 | t1shi18 >>> 11);
    const t2shi3 = (t1shi18 << 21 | t1slo18 >>> 11);
    const t2slo19 = (t1shi23 << 24 | t1slo23 >>> 8);
    const t2shi19 = (t1slo23 << 24 | t1shi23 >>> 8);
    const t2slo15 = (t1slo4 << 27 | t1shi4 >>> 5);
    const t2shi15 = (t1shi4 << 27 | t1slo4 >>> 5);
    const t2slo6 = (t1slo9 << 20 | t1shi9 >>> 12);
    const t2shi6 = (t1shi9 << 20 | t1slo9 >>> 12);
    const t2slo22 = (t1shi14 << 7 | t1slo14 >>> 25);
    const t2shi22 = (t1slo14 << 7 | t1shi14 >>> 25);
    const t2slo13 = (t1slo19 << 8 | t1shi19 >>> 24);
    const t2shi13 = (t1shi19 << 8 | t1slo19 >>> 24);
    const t2slo4 = (t1slo24 << 14 | t1shi24 >>> 18);
    const t2shi4 = (t1shi24 << 14 | t1slo24 >>> 18);

    // chi
    s[0] = t2slo0 ^ (~t2slo1 & t2slo2);
    s[1] = t2shi0 ^ (~t2shi1 & t2shi2);
    s[10] = t2slo5 ^ (~t2slo6 & t2slo7);
    s[11] = t2shi5 ^ (~t2shi6 & t2shi7);
    s[20] = t2slo10 ^ (~t2slo11 & t2slo12);
    s[21] = t2shi10 ^ (~t2shi11 & t2shi12);
    s[30] = t2slo15 ^ (~t2slo16 & t2slo17);
    s[31] = t2shi15 ^ (~t2shi16 & t2shi17);
    s[40] = t2slo20 ^ (~t2slo21 & t2slo22);
    s[41] = t2shi20 ^ (~t2shi21 & t2shi22);
    s[2] = t2slo1 ^ (~t2slo2 & t2slo3);
    s[3] = t2shi1 ^ (~t2shi2 & t2shi3);
    s[12] = t2slo6 ^ (~t2slo7 & t2slo8);
    s[13] = t2shi6 ^ (~t2shi7 & t2shi8);
    s[22] = t2slo11 ^ (~t2slo12 & t2slo13);
    s[23] = t2shi11 ^ (~t2shi12 & t2shi13);
    s[32] = t2slo16 ^ (~t2slo17 & t2slo18);
    s[33] = t2shi16 ^ (~t2shi17 & t2shi18);
    s[42] = t2slo21 ^ (~t2slo22 & t2slo23);
    s[43] = t2shi21 ^ (~t2shi22 & t2shi23);
    s[4] = t2slo2 ^ (~t2slo3 & t2slo4);
    s[5] = t2shi2 ^ (~t2shi3 & t2shi4);
    s[14] = t2slo7 ^ (~t2slo8 & t2slo9);
    s[15] = t2shi7 ^ (~t2shi8 & t2shi9);
    s[24] = t2slo12 ^ (~t2slo13 & t2slo14);
    s[25] = t2shi12 ^ (~t2shi13 & t2shi14);
    s[34] = t2slo17 ^ (~t2slo18 & t2slo19);
    s[35] = t2shi17 ^ (~t2shi18 & t2shi19);
    s[44] = t2slo22 ^ (~t2slo23 & t2slo24);
    s[45] = t2shi22 ^ (~t2shi23 & t2shi24);
    s[6] = t2slo3 ^ (~t2slo4 & t2slo0);
    s[7] = t2shi3 ^ (~t2shi4 & t2shi0);
    s[16] = t2slo8 ^ (~t2slo9 & t2slo5);
    s[17] = t2shi8 ^ (~t2shi9 & t2shi5);
    s[26] = t2slo13 ^ (~t2slo14 & t2slo10);
    s[27] = t2shi13 ^ (~t2shi14 & t2shi10);
    s[36] = t2slo18 ^ (~t2slo19 & t2slo15);
    s[37] = t2shi18 ^ (~t2shi19 & t2shi15);
    s[46] = t2slo23 ^ (~t2slo24 & t2slo20);
    s[47] = t2shi23 ^ (~t2shi24 & t2shi20);
    s[8] = t2slo4 ^ (~t2slo0 & t2slo1);
    s[9] = t2shi4 ^ (~t2shi0 & t2shi1);
    s[18] = t2slo9 ^ (~t2slo5 & t2slo6);
    s[19] = t2shi9 ^ (~t2shi5 & t2shi6);
    s[28] = t2slo14 ^ (~t2slo10 & t2slo11);
    s[29] = t2shi14 ^ (~t2shi10 & t2shi11);
    s[38] = t2slo19 ^ (~t2slo15 & t2slo16);
    s[39] = t2shi19 ^ (~t2shi15 & t2shi16);
    s[48] = t2slo24 ^ (~t2slo20 & t2slo21);
    s[49] = t2shi24 ^ (~t2shi20 & t2shi21);

    // iota
    s[0] ^= P1600_ROUND_CONSTANTS[round * 2];
    s[1] ^= P1600_ROUND_CONSTANTS[round * 2 + 1];
  }
}

class Keccak256 {
  constructor () {
    this.state = new Uint32Array(50);

    // 1088 / 8
    this.blockSize = 136;
    this.count = 0;
    this.squeezing = false;
  }

  update (data) {
    const len = data.length;

    if (typeof data === 'string') {
      let i = data.startsWith('0x') ? 2 : 0;

      for (; i < len; i += 2) {
        const val = parseInt(data.substring(i, i + 2), 16);

        this.state[~~(this.count / 4)] ^= val << (8 * (this.count % 4));
        this.count += 1;

        if (this.count === this.blockSize) {
          p1600(this.state);
          this.count = 0;
        }
      }

      return this;
    }

    for (let i = 0; i < len; i++) {
      const val = data[i];

      this.state[~~(this.count / 4)] ^= val << (8 * (this.count % 4));
      this.count += 1;

      if (this.count === this.blockSize) {
        p1600(this.state);
        this.count = 0;
      }
    }

    return this;
  }

  *drain () {
    if (!this.squeezing) {
      const bits = 0x01;

      this.state[~~(this.count / 4)] ^= bits << (8 * (this.count % 4));
      this.state[~~((this.blockSize - 1) / 4)] ^= 0x80 << (8 * ((this.blockSize - 1) % 4));

      p1600(this.state);

      this.count = 0;
      this.squeezing = true;
    }

    for (let i = 0; i < 32; ++i) {
      const val = (this.state[~~(this.count / 4)] >>> (8 * (this.count % 4))) & 0xff;

      yield val;

      this.count += 1;
      if (this.count === this.blockSize) {
        p1600(this.state);
        this.count = 0;
      }
    }
  }

  digest () {
    let output = '';

    for (const val of this.drain()) {
      output += val.toString(16).padStart(2, '0');
    }

    return output;
  }

  digestArray () {
    const output = Array(32);

    let i = 0;
    for (const val of this.drain()) {
      output[i++] = val;
    }

    return output;
  }

  reset () {
    this.state.fill(0);

    this.count = 0;
    this.squeezing = false;

    return this;
  }
}

// bug with importer
const ripemd = md160.default || md160;
const keccak = new Keccak256();

function stripZeros (v) {
  if (v.length === 0) {
    return v;
  }

  let start = 0;

  while (v[start] === 0) {
    start++;
  }

  return v.slice(start);
}

async function signRlpTransaction (txObj, privKeyBuf, chainId) {
  const nonce = Number(txObj.nonce) || '0x';
  const gasPrice = txObj.gasPrice || '0x';
  const gasLimit = txObj.gasLimit || '0x';
  const to = txObj.to;
  const value = txObj.value || '0x';
  const data = bufferify(txObj.data);
  const tmp = [nonce, gasPrice, gasLimit, to, value, data];

  if (chainId !== 0) {
    tmp.push(chainId);
    tmp.push(0);
    tmp.push(0);
  }

  const unsigned = encode(tmp);
  const unsignedHash = keccak.reset().update(unsigned).digestArray();
  const { v, r, s } = await ecsign(unsignedHash, privKeyBuf, chainId);
  const signed = encode(
    [nonce, gasPrice, gasLimit, to, value, data, v, stripZeros(r), stripZeros(s)]
  );
  const rawTxHex = bufToHex(signed, 0, signed.length);
  const txHash = `0x${keccak.reset().update(signed).digest()}`;

  return { txHash, rawTxHex };
}

function recoverAddress (msg, v, r, s, chainId) {
  const from =
    '0x' +
    keccak.reset().update(
      ecrecover(
        bufferify(msg),
        Number(v) | 0,
        bufferify(r),
        bufferify(s),
        Number(chainId) | 0
      )
    ).digest().slice(24, 64);

  return from;
}

function ripemd160 (val, padded) {
  const hash = ripemd(val);

  if (padded === true) {
    const ret = new Uint8Array(32);
    ret.set(hash, 12);
    return ret;
  }
  else {
    return hash;
  }
}

async function sha256 (array) {
  if (typeof window !== 'undefined') {
    const arrayBuffer = await window.crypto.subtle.digest('sha-256', Uint8Array.from(array));
    return new Uint8Array(arrayBuffer);
  }

  const { createHash } = await import('crypto');
  return createHash('sha256').update(Uint8Array.from(array)).digest();
}

function keccak256 (array) {
  return keccak.reset().update(array).digestArray();
}

function keccak256HexPrefix (array) {
  return `0x${keccak.reset().update(array).digest()}`;
}

function publicToAddress (_pubKey) {
  const pubKey = bufferify(_pubKey);

  if (pubKey.length !== 64) {
    throw new Error('pubKey.length !== 64');
  }

  return keccak256(pubKey).slice(-20);
}

function privateToAddress (privateKey) {
  return publicToAddress(privateToPublic(privateKey));
}

const BIG_ZERO = BigInt(0);
const BIG_ONE = BigInt(1);
const ZERO_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000';

// TODO
// This needs to be rebased
class Block {
  decodeTransactionLength (buf, offset, bridge) {
  }

  encodeTx (tx, bridge) {
  }

  decodeTx (rawStringOrArray, bridge) {
  }

  newInventory () {
  }

  async executeTx (tx, bridge, dry) {
  }

  async handleExit (data) {
  }

  toRaw (bridge) {
    if (this._raw) {
      return this._raw;
    }

    let ret = '0x';

    for (const txHash of this.transactionHashes) {
      const tx = this.transactions[txHash];

      if (this.isDepositBlock) {
        ret += tx.from.substring(2) + tx.to.substring(2) + tx.data.substring(2);
        continue;
      }

      ret += this.encodeTx(tx, bridge).replace('0x', '');
    }

    return ret;
  }

  async fromBeacon (data, rootBlock, bridge) {
    this._raw = data;
    this.hash = keccak256HexPrefix(packString([this.number, data], [32, 0]));
    this.timestamp = Number(rootBlock.timestamp);

    this.log(`new Block ${this.number}/${this.hash}`);

    const buf = arrayify(data);
    const bufLength = buf.length;
    let offset = 0;

    while (offset < bufLength) {
      try {
        const txLen = this.decodeTransactionLength(buf, offset, bridge);
        const rawTx = buf.slice(offset, offset += txLen);

        try {
          await this.addTransaction(rawTx, bridge);
        } catch (e) {
          this.log(e);
        }
      } catch (e) {
        this.log('TODO - proper tx parsing', e);
      }
    }

    this.log('Done');
  }

  async onDeposit (data, rootBlock, bridge) {
    this._raw =
      '0x' +
      data.owner.replace('0x', '') +
      data.address.replace('0x', '') +
      data.value.replace('0x', '');

    this.hash = keccak256HexPrefix(packString([this.number, this._raw], [32, 0]));
    this.timestamp = Number(rootBlock.timestamp);

    this.log(`new Deposit-Block ${this.number}/${this.hash}`);
    await this.addDeposit(data, bridge);
  }

  async onExit (data, bridge) {
    // TODO/FIXME hack
    // this is not really a new block,
    // but instead a way to 'sync' exits

    if (this.number > BIG_ONE) {
      this.number--;
    }
    this.isExitBlock = true;
    this.log(`new Exit`);

    await this.handleExit(data);
  }

  constructor (prevBlock) {
    // previous block - if applicable
    this.prevBlock = prevBlock;
    // the blockHash - only available if this block was submitted to the Bridge.
    this.hash = ZERO_HASH;
    // the blockNumber
    this.number = prevBlock ? prevBlock.number + BIG_ONE : BIG_ONE;
    // the timestamp (from the L1 block)
    this.timestamp = prevBlock ? prevBlock.timestamp : 0;
    // the token inventory
    // TODO move Inventory to a proper commit-log state manager
    this.inventory = prevBlock ? prevBlock.inventory.clone() : this.newInventory();
    // address > nonce mapping
    this.nonces = {};
    // txHash > tx mapping
    this.transactions = {};
    // ordered list of transaction hashes in this Block
    this.transactionHashes = [];
    this.isDepositBlock = false;
    this.isExitBlock = false;
    this.submissionDeadline = 0;

    if (prevBlock) {
      // copy nonces since `prevBlock`
      this.nonces = Object.assign({}, prevBlock.nonces);
      // clear storageKeys
      this.inventory.storageKeys = {};
    }
  }

  calculateSize () {
    let ret = 0;

    for (const txHash of this.transactionHashes) {
      const tx = this.transactions[txHash];
      const size = tx.size || ((this.encodeTx(tx).length - 2) / 2);

      ret += size;
    }

    return ret;
  }

  async addDeposit (obj, bridge) {
    this.isDepositBlock = true;

    // borrow the transactions field for a deposit (we only have one deposit per block atm)
    // transactionHash = blockHash
    const tx = {
      from: obj.owner,
      to: obj.address,
      data: obj.value,
      nonce: BIG_ZERO,
      status: '0x1',
      errno: '0x0',
      logs: [],
      returnData: '0x',
      size: 72,
    };
    this.transactionHashes.push(this.hash);
    this.transactions[this.hash] = tx;
  }

  log (...args) {
    console.log(`${this.isDepositBlock ? 'DepositBlock' : 'Block'}(${this.number})`, ...args);
  }

  freeze () {
    // TODO
    // freeze other stuff too
    this.inventory.freeze();
  }

  prune () {
    this.log('prune');
    this.inventory = null;
    this._raw = null;
    this.nonces = {};
  }

  async rebase (block, bridge) {
    this.log(`Rebase:Started ${block.transactionHashes.length} transactions`);

    for (const txHash of block.transactionHashes) {
      const tx = block.transactions[txHash];

      if (this.prevBlock && this.prevBlock.transactions[txHash]) {
        this.log('Rebase:Dropping tx', txHash);
        continue;
      }

      this.log('Rebase:Adding tx', txHash);
      await this.addDecodedTransaction(tx, bridge);
    }

    this.log(`Rebase:Complete ${this.transactionHashes.length} transactions left`);
  }

  async addTransaction (rawStringOrArray, bridge) {
    const tx = this.decodeTx(rawStringOrArray, bridge);

    return this.addDecodedTransaction(tx, bridge);
  }

  async addDecodedTransaction (tx, bridge) {
    if (this.validateTransaction(tx)) {
      const { errno, returnValue, logs } = await this.executeTx(tx, bridge);

      this.log(`${tx.from}:${tx.nonce}:${tx.hash}`);

      // TODO
      // check modified storage keys, take MAX_SOLUTION_SIZE into account
      if (errno !== 0) {
        this.log(`invalid tx errno:${errno}`);
        // revert
        if (errno !== 7) {
          throw new Error(`transaction errno ${errno}`);
        }
      }

      tx.logs = logs || [];
      tx.status = errno === 0 ? '0x1' : '0x0';
      tx.errno = `0x${errno.toString(16)}`;
      tx.returnData = returnValue;

      this.nonces[tx.from] = tx.nonce + BIG_ONE;
      this.transactions[tx.hash] = tx;
      this.transactionHashes.push(tx.hash);

      return tx;
    }

    this.log('invalid or duplicate tx', tx.hash);

    return null;
  }

  validateTransaction (tx) {
    return true;
  }

  async dryExecuteTx (tx, bridge) {
    const { returnValue } = await this.executeTx(tx, bridge, true);

    return returnValue || '0x';
  }

  async submitBlock (bridge) {
    const hashes = this.transactionHashes;
    const transactions = [];
    const tmp = [];

    // TODO
    // this also has to take MAX_SOLUTION_SIZE into account
    let payloadLength = 0;
    for (let i = 0; i < hashes.length; i++) {
      const hash = hashes[i];
      const tx = this.transactions[hash];

      if (tx.submitted) {
        this.log(`Already marked as submitted: ${tx.from}:${tx.nonce}`);
        continue;
      }

      this.log('Preparing ' + tx.from + ':' + tx.nonce + ':' + tx.hash);

      const encoded = this.encodeTx(tx, bridge).replace('0x', '');
      const byteLength = encoded.length / 2;

      if (payloadLength + byteLength > bridge.MAX_BLOCK_SIZE) {
        this.log('reached MAX_BLOCK_SIZE');
        break;
      }

      payloadLength += byteLength;

      transactions.push(encoded);
      // mark it as submitted
      // if we get any errors in submitBlock, we unmark all again
      tmp.push(tx);
      tx.submitted = true;
    }

    if (transactions.length === 0) {
      this.log('Nothing to submit');
      return;
    }

    const rawData = transactions.join('');
    const txData = bridge.rootBridge.encodeSubmit(rawData);
    const n = this.number;

    let tx;
    try {
      // post data
      tx = await bridge.wrapSendTransaction(txData);
    } catch (e) {
      this.log(e);
      // TODO: check if we really failed to submit the block

      // unmark all transactions
      for (const v of tmp) {
        v.submitted = false;
      }
    }

    this.log('Block.submitBlock.postData', Number(tx.gasUsed));
    this.log(
      {
        total: hashes.length,
        submitted: transactions.length,
      }
    );

    // TODO: blockHash/number might not be the same if additional blocks are submitted in the meantime
    return n;
  }

  /// @dev Computes the solution for this Block.
  async computeSolution (bridge, doItWrong) {
    const storageKeys = this.inventory.storageKeys;
    const keys = Object.keys(storageKeys);

    this.log('Block.computeSolution');

    let payload = '';
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      const val = storageKeys[k];

      payload += `${k.replace('0x', '')}${val.replace('0x', '')}`;
    }

    if (doItWrong) {
      this.log('BadNodeMode!');

      payload = ''.padStart(128) + '01';
    }

    if ((payload.length / 2) > bridge.MAX_SOLUTION_SIZE) {
      throw new Error('Reached MAX_SOLUTION_SIZE');
    }

    const solution = {
      payload,
      hash: keccak256HexPrefix(payload),
    };

    this.log(`Solution: ${solution.hash}`);

    return solution;
  }
}

const ZERO_LOGS_BLOOM = `0x${''.padStart(512, '0')}`;
const ZERO_NONCE = '0x0000000000000000';
const ZERO_HASH$1 = `0x${''.padStart(64, '0')}`;

function blockRequest (block) {
  if (!block) {
    throw new Error('Requested Block not found');
  }

  let prevBlock = block.prevBlock;
  while (prevBlock && prevBlock.isExitBlock) {
    prevBlock = prevBlock.prevBlock;
  }

  const transactions = block.transactionHashes;

  return {
    hash: block.hash || ZERO_HASH$1,
    parentHash: prevBlock ? prevBlock.hash : ZERO_HASH$1,
    number: `0x${block.number.toString(16)}`,
    timestamp: `0x${block.timestamp.toString(16)}`,
    // TODO: implement block nonce
    nonce: ZERO_NONCE,
    difficulty: '0x0',
    gasLimit: '0x0',
    gasUsed: '0x0',
    miner: '0x0000000000000000000000000000000000000000',
    extraData: '0x',
    transactions,
  };
}

class Methods {
  static 'debug_submitBlock' (obj, bridge) {
    return bridge.submitBlock();
  }

  static 'debug_submitSolution' (obj, bridge) {
    return bridge.submitSolution(BigInt(obj.params[0]));
  }

  static 'debug_finalizeSolution' (obj, bridge) {
    return bridge.finalizeSolution(BigInt(obj.params[0]));
  }

  static 'debug_directReplay' (obj, bridge) {
    return bridge.directReplay(BigInt(obj.params[0]));
  }

  static 'debug_kill' () {
    setTimeout(function () {
      process.exit(1);
    }, 10);

    return true;
  }

  static 'debug_haltEvents' (obj, bridge) {
    bridge._debugHaltEvents = obj.params[0] ? true : false;
    return bridge._debugHaltEvents;
  }

  static 'debug_forwardChain' (obj, bridge) {
    return bridge.forwardChain();
  }

  static 'debug_storage' (obj, bridge) {
    return bridge.pendingBlock.inventory.storage;
  }

  static 'web3_clientVersion' (obj, bridge) {
    return bridge.rootBridge.protocolAddress;
  }

  static 'net_version' (obj, bridge) {
    return '0';
  }

  static 'eth_gasPrice' (obj) {
    // always zero, Hooray 🎉
    return '0x0';
  }

  static async 'eth_blockNumber' (obj, bridge) {
    return `0x${bridge.pendingBlock.number.toString(16)}`;
  }

  static async 'eth_getBlockByNumber' (obj, bridge) {
    let maybeNumber = obj.params[0];
    if (maybeNumber === 'latest' || maybeNumber === 'pending') {
      maybeNumber = bridge.pendingBlock.number;
    }

    const num = BigInt(maybeNumber);
    // TODO
    const withTxData = obj.params[1] ? true : false;
    const block = await bridge.getBlockByNumber(num, true);

    return blockRequest(block);
  }

  static async 'eth_getBlockByHash' (obj, bridge) {
    // TODO
    const withTxData = obj.params[1] ? true : false;
    const block = await bridge.getBlockByHash(obj.params[0], true);

    return blockRequest(block);
  }

  static async 'eth_getBalance' (obj) {
    // always zero
    return '0x0';
  }

  static async 'eth_getTransactionCount' (obj, bridge) {
    // TODO: pending, latest
    // currently returns pending-nonce
    const nonce = await bridge.getNonce(obj.params[0]);
    return `0x${nonce.toString(16)}`;
  }

  static async 'eth_estimateGas' (obj) {
    // always zero
    return '0x0';
  }

  static async 'eth_getTransactionReceipt' (obj, bridge) {
    const txHash = obj.params[0];
    const { block, tx, txIndex } = bridge.getBlockOfTransaction(txHash);

    if (!tx) {
      throw new Error('Transaction not found');
    }

    const transactionIndex = `0x${txIndex.toString(16)}`;
    const blockHash = block.hash || ZERO_HASH$1;
    const blockNumber = `0x${block.number.toString(16)}`;
    const logs = [];

    if (tx.logs) {
      const logLen = tx.logs.length;

      for (let i = 0; i < logLen; i++) {
        const logIndex = `0x${i.toString(16)}`;
        const log = tx.logs[i];
        const obj = {
          transactionLogIndex: logIndex,
          transactionIndex,
          blockNumber,
          transactionHash: txHash,
          address: log.address,
          topics: log.topics,
          data: log.data,
          logIndex,
          blockHash,
        };
        logs.push(obj);
      }
    }

    // TODO: proper receipts
    return {
      transactionHash: txHash,
      transactionIndex,
      blockHash,
      blockNumber,
      from: tx.from,
      to: tx.to,
      cumulativeGasUsed: '0x0',
      gasUsed: '0x0',
      contractAddress: null,
      logs: logs,
      logsBloom: ZERO_LOGS_BLOOM,
      status: tx.status,
    };
  }

  static async 'eth_getTransactionDetails' (obj, bridge) {
    const txHash = obj.params[0];
    const { block, tx, txIndex } = bridge.getBlockOfTransaction(txHash);

    if (!tx) {
      throw new Error('Transaction not found');
    }

    return {
      errno: tx.errno,
      returnData: tx.returnData,
    };
  }

  static async 'eth_getTransactionByHash' (obj, bridge) {
    const txHash = obj.params[0];
    const { block, tx, txIndex } = bridge.getBlockOfTransaction(txHash);

    if (!tx) {
      throw new Error('Transaction not found');
    }

    const transactionIndex = `0x${txIndex.toString(16)}`;
    const blockHash = block.hash || ZERO_HASH$1;
    const blockNumber = `0x${block.number.toString(16)}`;

    return {
      transactionIndex,
      blockHash,
      blockNumber,
      from: tx.from,
      r: tx.r,
      s: tx.s,
      v: tx.v,
      value: '0x0',
      to: tx.to,
      hash: txHash,
      data: tx.data,
      nonce: '0x' + tx.nonce.toString(16),
      gasPrice: '0x0',
      gasLimit: '0x0',
    };
  }

  static async 'eth_call' (obj, bridge) {
    const block = obj.params[1];
    // from, to, data, gas, gasPrice, value
    const tx = obj.params[0];
    return bridge.runCall(tx);
  }

  static async 'eth_getCode' (obj, bridge) {
    return bridge.getCode(obj.params[0], obj.params[1]);
  }

  static async 'eth_sendRawTransaction' (obj, bridge) {
    const data = obj.params[0];
    return bridge.runTx({ data });
  }

  static async 'eth_getLogs' (obj, bridge) {
    // TODO
    // Support
    // - blockhash filter
    // - nested topic queries
    // - pending, earliest ..
    // - correct log indices
    const eventFilter = obj.params[0];
    const filterAddress = eventFilter.address ? eventFilter.address.toLowerCase() : null;
    const filterTopics = eventFilter.topics || [];
    const res = [];
    const end = BigInt(eventFilter.toBlock || bridge.pendingBlock.number);
    let start = BigInt(eventFilter.fromBlock || bridge.pendingBlock.number);

    for (; start <= end; start++) {
      const block = await bridge.getBlockByNumber(start, true);

      if (!block) {
        break;
      }

      const blockHash = block.hash || ZERO_HASH$1;
      const blockNumber = `0x${block.number.toString(16)}`;
      const txsLength = block.transactionHashes.length;

      for (let txIndex = 0; txIndex < txsLength; txIndex++) {
        const txHash = block.transactionHashes[txIndex];
        const tx = block.transactions[txHash];

        if (filterAddress && tx.to !== filterAddress) {
          continue;
        }
        if (tx.status !== '0x1') {
          continue;
        }

        const transactionIndex = `0x${txIndex.toString(16)}`;
        const logsLength = tx.logs.length;
        for (let logIndex = 0; logIndex < logsLength; logIndex++) {
          const log = tx.logs[logIndex];
          const filterTopicsLength = filterTopics.length;
          let skip = false;

          for (let t = 0; t < filterTopicsLength; t++) {
            const q = filterTopics[t];
            if (!q || log.topics[t] !== q) {
              skip = true;
              break;
            }
          }
          if (skip) {
            continue;
          }

          const idx = `0x${logIndex.toString(16)}`;
          const obj = {
            transactionLogIndex: idx,
            transactionIndex,
            blockNumber,
            transactionHash: txHash,
            address: log.address,
            topics: log.topics,
            data: log.data,
            logIndex: idx,
            blockHash,
          };

          res.push(obj);
        }
      }
    }

    return res;
  }

  // TODO
  // eth_getStorageAt
}

async function createFetchJson (url) {
  const headers = {
    'content-type': 'application/json',
  };
  const method = 'POST';

  if (typeof fetch !== 'undefined') {
    // browser
    return async function (rpcMethod, params) {
      const payload = JSON.stringify({ id: 42, method: rpcMethod, params });
      const resp = await fetch(url, { body: payload, method, headers });
      const obj = await resp.json();

      if (obj.error) {
        throw new Error(obj.error);
      }

      return obj.result;
    };
  }

  // nodejs
  {
    const http = await import('http');
    const https = await import('https');
    const { parse } = await import('url');
    const urlParse = parse;

    return async function (rpcMethod, params) {
      const payload = JSON.stringify({ id: 42, method: rpcMethod, params });

      return new Promise(
        function (resolve, reject) {
          const fetchOptions = urlParse(url);

          fetchOptions.method = method;
          fetchOptions.headers = headers;

          const proto = fetchOptions.protocol === 'http:' ? http : https;
          const req = proto.request(fetchOptions);

          let body = '';

          req.on('error', reject);
          req.on('response', function (resp) {
            resp.on('data', function (buf) {
              body += buf.toString();
            });
            resp.on('end', function () {
              const obj = JSON.parse(body);

              if (obj.error) {
                reject(obj.error);
              }
              resolve(obj.result);
            });
          });

          req.end(payload);
        }
      );
    };
  }
}

// Deposit(address,address,uint256)
const TOPIC_DEPOSIT = '0x5548c837ab068cf56a2c2479df0882a4922fd203edb7517321831d95078c5f62';
// Exit(address,address,uint256)
const TOPIC_EXIT = '0x9b1bfa7fa9ee420a16e124f794c35ac9f90472acc99140eb2f6447c714cad8eb';
// BlockBeacon()
const TOPIC_BEACON = '0x98f7f6a06026bc1e4789634d93bff8d19b1c3b070cc440b6a6ae70bae9fec6dc';
// NewSolution(uint256,bytes32)
const TOPIC_SOLUTION = '0xc2c24b452cabde4a0f2fec2993e5af81879a802cba7b7b42cd2f42e3166a0e0b';

const FUNC_SIG_SUBMIT_BLOCK = '0x25ceb4b2';
const FUNC_SIG_SUBMIT_SOLUTION = '0xe1d45577';
const FUNC_SIG_CHALLENGE = '0xd2ef7398';
const FUNC_SIG_FINALIZE = '0xd5bb8c4b';
const FUNC_SIG_DISPUTE = '0x1f2f7fc3';

const FUNC_SIG_VERSION = '0xffa1ad74';
const FUNC_SIG_MAX_BLOCK_SIZE = '0x6ce02363';
const FUNC_SIG_MAX_SOLUTION_SIZE = '0x6f0ee0a0';
const FUNC_SIG_INSPECTION_PERIOD = '0xe70f0e35';
const FUNC_SIG_BOND_AMOUNT = '0xbcacc70a';
const FUNC_SIG_CREATED_AT_BLOCK = '0x59acb42c';
const FUNC_SIG_FINALIZED_HEIGHT = '0xb2223bd6';

const UINT_MAX = '0x'.padEnd(66, 'f');
const BIG_ZERO$1 = BigInt(0);
const BIG_ONE$1 = BigInt(1);
const MAX_SHIFT = BigInt(255);

class RootBridge {
  constructor (options) {
    this.rootRpcUrl = options.rootRpcUrl;
    this.protocolAddress = options.contract.toLowerCase();

    this.eventFilter = {
      fromBlock: 0,
      toBlock: 0,
      address: this.protocolAddress,
      topics: [
        [TOPIC_DEPOSIT, TOPIC_EXIT, TOPIC_BEACON, TOPIC_SOLUTION],
      ],
    };

    this.eventHandlers = {};
    this.eventHandlers[TOPIC_DEPOSIT] =
      async (evt, delegate) => {
        let offset = 26;
        const token = `0x${evt.data.substring(offset, offset += 40)}`;
        const owner = `0x${evt.data.substring(offset += 24, offset += 40)}`;
        const value = `0x${evt.data.substring(offset, offset += 64)}`;

        const rootBlock = await this.fetchRootBlock(evt.blockHash);
        const isERC721 = await this.isERC721(token, value, rootBlock);
        const isERC20 = isERC721 ? false : true;
        const data = { address: token, owner: owner, value: value, isERC20, isERC721 };

        await delegate.onDeposit(data, rootBlock);
      };
    this.eventHandlers[TOPIC_EXIT] =
      async (evt, delegate) => {
        let offset = 26;
        const token = `0x${evt.data.substring(offset, offset += 40)}`;
        const owner = `0x${evt.data.substring(offset += 24, offset += 40)}`;
        const value = `0x${evt.data.substring(offset, offset += 64)}`;

        const rootBlock = await this.fetchRootBlock(evt.blockHash);
        const isERC721 = await this.isERC721(token, value, rootBlock);
        const isERC20 = isERC721 ? false : true;
        const data = { address: token, owner: owner, value: value, isERC20, isERC721 };

        await delegate.onExit(data, rootBlock);
      };
    this.eventHandlers[TOPIC_BEACON] =
      async (evt, delegate) => {
        const tx = await this.fetchJson('eth_getTransactionByHash', [evt.transactionHash]);
        const rootBlock = await this.fetchRootBlock(evt.blockHash);
        const data = tx.input.substring(10, tx.input.length);

        await delegate.onBlockBeacon(tx, data, rootBlock);
      };
    this.eventHandlers[TOPIC_SOLUTION] =
      async (evt, delegate) => {
        const blockNumber = BigInt(evt.data.substring(0, 66));
        const solutionHash = `0x${evt.data.substring(66, 130)}`;

        await delegate.onSolution(blockNumber, solutionHash, evt);
      };
  }

  async init () {
    // construct it once
    this.fetchJson = await createFetchJson(this.rootRpcUrl);
  }

  async abiCall (data) {
    const res = await this.fetchJson('eth_call',
      [
        {
          to: this.protocolAddress,
          data,
        },
        'latest',
      ]
    );

    return res;
  }

  async INSPECTION_PERIOD () {
    const res = await this.abiCall(FUNC_SIG_INSPECTION_PERIOD);

    return Number(res);
  }

  async BOND_AMOUNT () {
    const res = await this.abiCall(FUNC_SIG_BOND_AMOUNT);

    return BigInt(res);
  }

  async VERSION () {
    const res = await this.abiCall(FUNC_SIG_VERSION);

    return Number(res);
  }

  async MAX_BLOCK_SIZE () {
    const res = await this.abiCall(FUNC_SIG_MAX_BLOCK_SIZE);

    return Number(res);
  }

  async MAX_SOLUTION_SIZE () {
    const res = await this.abiCall(FUNC_SIG_MAX_SOLUTION_SIZE);

    return Number(res);
  }

  async isERC721 (token, value) {
    // PUSH4 0x6352211e;
    // CALLVALUE;
    // MSTORE;
    // PUSH32 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa;
    // PUSH1 32;
    // MSTORE;
    // PUSH1 32;
    // CALLVALUE;
    // PUSH1 36;
    // PUSH1 28;
    // PUSH20 0xffffffffffffffffffffffffffffffffffffffff;
    // GAS;
    // STATICCALL;
    // CALLVALUE;
    // MLOAD;
    // ISZERO;
    // ISZERO;
    // AND;
    // CALLVALUE;
    // MSTORE;
    // PUSH1 32;
    // CALLVALUE;
    // RETURN;
    const a = value.replace('0x', '');
    const f = token.replace('0x', '');
    const data = `0x636352211e34527f${a}6020526020346024601c73${f}5afa34511515163452602034f3`;
    const res = await this.fetchJson('eth_call',
      [
        {
          data,
          value: '0x0',
        },
        'latest',
      ]
    );

    return !!Number(res);
  }

  async canFinalizeBlock (blockNumber) {
    const res = await this.abiCall(`0x5b11ae01${blockNumber.toString(16).replace('0x', '').padStart(64, '0')}`);

    return !!Number(res);
  }

  async isDisputed (blockNumber) {
    const res = await this.abiCall(`0xa2770efe${blockNumber.toString(16).replace('0x', '').padStart(64, '0')}`);

    return res === UINT_MAX;
  }

  async createdAtBlock () {
    const res = await this.abiCall(FUNC_SIG_CREATED_AT_BLOCK);

    return Number(res);
  }

  async finalizedHeight () {
    const res = await this.abiCall(FUNC_SIG_FINALIZED_HEIGHT);

    return BigInt(res);
  }

  async fetchRootBlock (blockHash) {
    const res = await this.fetchJson('eth_getBlockByHash',
      [
        blockHash,
        false
      ]
    );

    return res;
  }

  encodeSubmit (data) {
    return {
      to: this.protocolAddress,
      data: FUNC_SIG_SUBMIT_BLOCK + data.replace('0x', ''),
    };
  }

  encodeChallenge (blockData) {
    return {
      to: this.protocolAddress,
      data: FUNC_SIG_CHALLENGE + blockData.replace('0x', ''),
    };
  }

  encodeSolution (blockNumber, solutionHash) {
    return {
      to: this.protocolAddress,
      data: FUNC_SIG_SUBMIT_SOLUTION + blockNumber.toString(16).padStart(64, '0') + solutionHash.replace('0x', ''),
    };
  }

  encodeDispute (blockNumbers) {
    if (!blockNumbers.length) {
      throw new Error(`need at least one blockNumber`);
    }

    let blockN = blockNumbers[0];
    let mask = BIG_ZERO$1;

    for (const blockNumber of blockNumbers) {
      const i = blockNumber - blockN;

      if (i > MAX_SHIFT || i < BIG_ZERO$1) {
        throw new Error(`distance too large: ${blockN} / ${blockNumber}`);
      }

      mask |= BIG_ONE$1 << i;
    }

    return {
      to: this.protocolAddress,
      data: FUNC_SIG_DISPUTE + blockN.toString(16).padStart(64, '0') + mask.toString(16).padStart(64, '0'),
    };
  }

  encodeFinalize (blockNumber, someWitness) {
    return {
      to: this.protocolAddress,
      data: FUNC_SIG_FINALIZE + blockNumber.toString(16).padStart(64, '0') + someWitness.replace('0x', ''),
    };
  }

  async initialSync (delegate) {
    // this is our starting point
    const createdAtBlock = await this.createdAtBlock();
    const latestBlock = Number(await this.fetchJson('eth_blockNumber', []));

    // sync
    this.eventFilter.fromBlock = createdAtBlock;

    const quantityStepping = 100;
    let fetchQuantity = 100;
    for (let i = createdAtBlock; i <= latestBlock;)  {
      let toBlock = i + fetchQuantity;
      if (toBlock > latestBlock) {
        toBlock = latestBlock;
      }
      this.eventFilter.toBlock = toBlock;

      let res;
      try {
        const r = {
          fromBlock: '0x' + this.eventFilter.fromBlock.toString(16),
          toBlock: '0x' + this.eventFilter.toBlock.toString(16),
          address: this.eventFilter.address,
          topics: this.eventFilter.topics,
        };
        res = await this.fetchJson('eth_getLogs', [r]);
      } catch (e) {
        fetchQuantity -= quantityStepping;
        if (fetchQuantity < 1) {
          fetchQuantity = 1;
        }
        continue;
      }

      const len = res.length;
      for (let i = 0; i < len; i++) {
        await this._dispatchEvent(res[i], delegate);
      }

      i = toBlock + 1;
      this.eventFilter.fromBlock = i;
      fetchQuantity += quantityStepping;
    }

    this.ready = true;
  }

  async _dispatchEvent (evt, delegate) {
    const topic = evt.topics[0];

    if (this.eventHandlers.hasOwnProperty(topic)) {
      await this.eventHandlers[topic](evt, delegate);
    }
  }

  async fetchEvents (delegate) {
    const latestBlock = Number(await this.fetchJson('eth_blockNumber', []));

    if (latestBlock >= this.eventFilter.fromBlock) {
      this.eventFilter.toBlock = latestBlock;

      const r = {
        fromBlock: '0x' + this.eventFilter.fromBlock.toString(16),
        toBlock: '0x' + this.eventFilter.toBlock.toString(16),
        address: this.eventFilter.address,
        topics: this.eventFilter.topics,
      };
      const res = await this.fetchJson('eth_getLogs', [r]);
      const len = res.length;

      for (let i = 0; i < len; i++) {
        await this._dispatchEvent(res[i], delegate);
      }

      this.eventFilter.fromBlock = latestBlock + 1;
    }
  }
}

const BIG_ZERO$2 = BigInt(0);
const BIG_ONE$2 = BigInt(1);

/// @dev Glue for everything.
class Bridge {
  constructor (options, BlockClass) {
    this.bytecodeCache = Object.create(null);
    this.pendingBlock = new (BlockClass || Block)(null);
    this.debugMode = options.debugMode ? true : false;
    this.badNodeMode = options.badNodeMode ? true : false;
    this.eventCheckMs = options.eventCheckMs || 1000;
    // may include custom flags
    this.featureFlags = options.featureFlags | 0;

    // options regarding block submission behaviour
    this.blockSizeThreshold = options.blockSizeThreshold || 1000;
    this.blockTimeThreshold = options.blockTimeThreshold || 60;

    // TODO: find a better place / method
    this._pendingBlockSubmission = false;
    this._lastBlockSubmission = 0;

    if (options.privKey) {
      this.privKey = options.privKey.replace('0x', '');
      this.signer = toHexPrefix(privateToAddress(this.privKey));
    } else {
      this.log('Warning: No private key - Read-only mode');
    }

    this.rootBridge = new RootBridge(options);
  }

  log (...args) {
    console.log(...args);
  }

  async init () {
    await this.rootBridge.init();

    this.VERSION = await this.rootBridge.VERSION();
    this.MAX_BLOCK_SIZE = await this.rootBridge.MAX_BLOCK_SIZE();
    this.MAX_SOLUTION_SIZE = await this.rootBridge.MAX_SOLUTION_SIZE();
    this.INSPECTION_PERIOD = await this.rootBridge.INSPECTION_PERIOD();
    this.BOND_AMOUNT = await this.rootBridge.BOND_AMOUNT();
    this.CHAIN_ID = Number(await this.rootBridge.fetchJson('net_version', []));

    const rootProviderVersion = await this.rootBridge.fetchJson('web3_clientVersion', []);
    this.log(
      {
        rootRpcUrl: this.rootBridge.rootRpcUrl,
        rootProviderVersion,
        bridge: this.rootBridge.protocolAddress,
        bridgeVersion: this.VERSION,
        MAX_BLOCK_SIZE: this.MAX_BLOCK_SIZE,
        MAX_SOLUTION_SIZE: this.MAX_SOLUTION_SIZE,
        INSPECTION_PERIOD: this.INSPECTION_PERIOD,
        BOND_AMOUNT: this.BOND_AMOUNT.toString(),
        CHAIN_ID: this.CHAIN_ID,
        wallet: this.signer,
        debugMode: this.debugMode,
        badNodeMode: this.badNodeMode,
        eventCheckMs: this.eventCheckMs,
        featureFlags: this.featureFlags,
      }
    );

    // TODO
    this.log('syncing...');
    await this.rootBridge.initialSync(this);

    this.ready = true;
    this.log(
      'synced',
      {
        fromBlock: this.rootBridge.eventFilter.fromBlock,
        toBlock: this.rootBridge.eventFilter.toBlock,
      }
    );

    this._eventLoop();

    // Disable automatic submissions for testing or debugging purposes.
    if (this.debugMode) {
      this.log('Disabled update loop because of debugMode');
    }
  }

  async forwardChain () {
    if (this.shouldSubmitNextBlock()) {
      this._pendingBlockSubmission = true;

      this.log('submitting block...');
      try {
        await this.pendingBlock.submitBlock(this);
      } catch (e) {
        this.log(e);
      }

      this._pendingBlockSubmission = false;
      this._lastBlockSubmission = Date.now();
    }

    // finalize or submit solution, if possible
    {
      const next = (await this.rootBridge.finalizedHeight()) + BIG_ONE$2;
      const wrongSolutions = [];

      // we can do this for the next 256 pending blocks
      for (let i = 0; i < 256; i++) {
        const block = await this.getBlockByNumber(next + BigInt(i));

        if (!block || !block.hash) {
          break;
        }

        this.log(`forwardChain: checking ${block.number}`);

        // we found the next pending block
        // no solution yet?
        if (!block.submittedSolutionHash) {
          if (await this.submitSolution(block.number)) {
            this.log(`submitted solution for ${block.number}`);
          }
        } else {
          // ...has a submitted solution
          const mySolution = await block.computeSolution(this, this.badNodeMode);

          // check if the solution is already marked as invalid
          if (mySolution.hash !== block.submittedSolutionHash) {
            const alreadyDisputed = await this.rootBridge.isDisputed(block.number);

            if (!alreadyDisputed) {
              wrongSolutions.push(block.number);
            }
          }
        }
      }

      // dispute them, if any
      if (wrongSolutions.length) {
        await this.dispute(wrongSolutions);
      }

      // fetch the block after `finalizedHeight`
      const pendingBlock = await this.getBlockByNumber(next);
      if (!pendingBlock || !pendingBlock.hash) {
        return;
      }

      if (pendingBlock.submittedSolutionHash) {
        const mySolution = await pendingBlock.computeSolution(this, this.badNodeMode);

        if (mySolution.hash !== pendingBlock.submittedSolutionHash) {
          this.log('Different results, starting challenge...');
          await this.processChallenge(pendingBlock);
          return;
        }

        const canFinalize = await this.rootBridge.canFinalizeBlock(pendingBlock.number);
        this.log(`Can finalize pending block: ${pendingBlock.number}=${canFinalize}`);

        if (canFinalize) {
          const ok = await this.finalizeSolution(pendingBlock.number);
          this.log(`finalizeSolution: ${ok}`);
        } else {
          // cant finalize, maybe the solution is too young?
          const blockNow = Number(await this.rootBridge.fetchJson('eth_blockNumber', []));
          const submitted = pendingBlock.submittedSolutionTime;
          const diff = blockNow - submitted;

          if (diff > this.INSPECTION_PERIOD) {
            this.log(`${diff} > INSPECTION_PERIOD but can not finalize block, starting challenge...`);
            await this.processChallenge(pendingBlock);
          }
        }
      }
    }
  }

  async _eventLoop () {
    try {
      if (!this._debugHaltEvents) {
        await this.rootBridge.fetchEvents(this);
      }
      if (!this.debugMode) {
        await this.forwardChain();
      }
    } catch (e) {
      this.log(e);
    }
    setTimeout(this._eventLoop.bind(this), this.eventCheckMs);
  }

  async onDeposit (data, rootBlock) {
    const block = new this.pendingBlock.constructor(this.pendingBlock.prevBlock);

    await block.onDeposit(data, rootBlock, this);
    await this.addBlock(block);
  }

  async onExit (data) {
    const block = new this.pendingBlock.constructor(this.pendingBlock.prevBlock);

    await block.onExit(data, this);
    await this.addBlock(block);
  }

  async onBlockBeacon (tx, data, rootBlock) {
    const block = new this.pendingBlock.constructor(this.pendingBlock.prevBlock);

    await block.fromBeacon(data, rootBlock, this);
    await this.addBlock(block);
  }

  /// @dev Checks if `blockNumber` is the next Block that needs finalization.
  async isCurrentBlock (blockNumber) {
    const finalizedHeight = (await this.rootBridge.finalizedHeight()) + BIG_ONE$2;

    return finalizedHeight === blockNumber;
  }

  async onSolution (blockNumber, solutionHash, evt) {
    this.log('Solution registered');
    this.log({ blockNumber, solutionHash });

    const block = await this.getBlockByNumber(BigInt(blockNumber));

    // TODO
    if (!block) {
      return;
    }
    block.submittedSolutionHash = solutionHash;
    block.submittedSolutionTime = evt.blockNumber;
  }

  getBlockOfTransaction (txHash) {
    let block = this.pendingBlock;

    while (block) {
      let tx = block.transactions[txHash];
      if (tx) {
        const txIndex = block.transactionHashes.indexOf(txHash);
        return { block, tx, txIndex };
      }
      block = block.prevBlock;
    }

    return {};
  }

  async getBlockByHash (hash, includePending) {
    if (includePending && hash === this.pendingBlock.hash) {
      return this.pendingBlock;
    }

    let block = this.pendingBlock.prevBlock;

    while (block) {
      if (!block.isExitBlock && block.hash === hash) {
        return block;
      }
      block = block.prevBlock;
    }

    return null;
  }

  async getBlockByNumber (num, includePending) {
    if (includePending && num === this.pendingBlock.number) {
      return this.pendingBlock;
    }

    let block = this.pendingBlock.prevBlock;

    while (block) {
      if (!block.isExitBlock && block.number === num) {
        return block;
      }
      block = block.prevBlock;
    }

    return null;
  }

  async addBlock (block) {
    block.freeze();

    // create a new head
    const newHead = new this.pendingBlock.constructor(block);
    const head = this.pendingBlock;

    await newHead.rebase(head, this);
    this.pendingBlock = newHead;
  }

  async getNonce (addr) {
    const nonce = this.pendingBlock.nonces[addr.toLowerCase()];

    return nonce || BIG_ZERO$2;
  }

  getTransaction (txHash) {
    let block = this.pendingBlock;

    while (block) {
      let tx = block.transactions[txHash];
      if (tx) {
        return tx;
      }
      block = block.prevBlock;
    }

    return null;
  }

  async runCall (tx) {
    return this.pendingBlock.dryExecuteTx(tx, this);
  }

  async runTx ({ data }) {
    const tx = await this.pendingBlock.addTransaction(data, this);

    if (!tx) {
      throw new Error('Invalid transaction');
    }

    return tx.hash;
  }

  async getCode (addr) {
    let bytecode = this.bytecodeCache[addr];

    if (!bytecode) {
      bytecode = this.rootBridge.fetchJson('eth_getCode', [addr, 'latest']);
      this.bytecodeCache[addr] = bytecode;
    }

    return bytecode;
  }

  setCode (addr, bytecodeHexStr) {
    this.bytecodeCache[addr] = bytecodeHexStr;
  }

  async submitBlock () {
    const blockNumber = await this.pendingBlock.submitBlock(this);

    return `0x${blockNumber.toString(16)}`;
  }

  async submitSolution (blockNumber) {
    const block = await this.getBlockByNumber(blockNumber);

    if (!block) {
      return false;
    }

    const mySolution = await block.computeSolution(this, this.badNodeMode);
    const tx = await this.wrapSendTransaction(
      this.rootBridge.encodeSolution(blockNumber, mySolution.hash)
    );

    this.log('Bridge.submitSolution', Number(tx.gasUsed));

    return true;
  }

  async finalizeSolution (blockNumber) {
    const block = await this.getBlockByNumber(blockNumber);

    if (!block) {
      return false;
    }

    const TAG = 'Bridge.finalizeSolution';

    if (!(await this.isCurrentBlock(block.number))) {
      this.log(TAG, 'already finalized');
      return true;
    }

    const mySolution = await block.computeSolution(this, this.badNodeMode);
    const txData = this.rootBridge.encodeFinalize(
      blockNumber,
      mySolution.payload,
    );
    this.log(TAG, mySolution);

    const tx = await this.wrapSendTransaction(txData);

    this.log(TAG, Number(tx.gasUsed));

    // prune block
    if (this.pendingBlock.prevBlock !== block) {
      block.prune();
    }

    return true;
  }

  async dispute (blockNumbers) {
    this.log(`dispute: ${blockNumbers}`);

    const receipt = await this.wrapSendTransaction(this.rootBridge.encodeDispute(blockNumbers));

    this.log(`txHash: ${receipt.transactionHash} status:${receipt.status}`);
  }

  async directReplay (blockNumber) {
    const block = await this.getBlockByNumber(blockNumber);

    if (!block) {
      return false;
    }

    await this.processChallenge(block);

    return true;
  }

  async processChallenge (block) {
    const TAG = `Bridge.challenge(${block.number})`;
    const cBlock = await this.rootBridge.finalizedHeight();

    if (cBlock >= block.number) {
      this.log(TAG, 'ALREADY COMPLETED');
      return;
    }

    const txData = this.rootBridge.encodeChallenge(block.toRaw(this));
    let cumulative = 0;
    try {
      let ctr = 0;
      while (true) {
        const lBlock = await this.rootBridge.finalizedHeight();

        if (lBlock > cBlock) {
          // done
          this.log(TAG, 'done', cumulative);
          break;
        }

        const tx = await this.wrapSendTransaction(txData);
        cumulative += Number(tx.gasUsed);

        ctr++;

        this.log(TAG, `step = ${ctr}`, Number(tx.gasUsed));
      }
    } catch (e) {
      const cBlock = await this.rootBridge.finalizedHeight();
      if (cBlock >= block.number) {
        this.log(TAG, 'ALREADY COMPLETED');
        return;
      }

      this.log(TAG, e);
    }
  }

  async rpcCall (body) {
    const method = body.method;
    const { id, jsonrpc } = body;

    if (!method || (method.startsWith('debug') && !this.debugMode)) {
      return {
        id,
        jsonrpc,
        error: {
          code: -32601,
          message: 'DebugMode is not enabled',
        }
      };
    }

    if (Methods.hasOwnProperty(method)) {
      const func = Methods[method];

      try {
        if (!this.ready) {
          throw new Error('Bridge is not ready yet');
        }

        return {
          id,
          jsonrpc,
          result: await func(body, this)
        };
      } catch (e) {
        this.log(e);

        return {
          id,
          jsonrpc,
          error: {
            code: -32000,
            message: (e.message || e).toString(),
          }
        };
      }
    }

    return {
      id,
      jsonrpc,
      error: {
        code: -32601,
        message: `The method ${method} does not exist/is not available`,
      }
    };
  }

  async wrapSendTransaction (tx) {
    if (!this.signer) {
      throw new Error('Read-only mode');
    }

    tx.from = this.signer;

    if (!tx.gasPrice) {
      tx.gasPrice = await this.rootBridge.fetchJson('eth_gasPrice', []);
    }
    if (!tx.gasLimit) {
      // challenge
      if (tx.data && tx.data.startsWith('0xd2ef7398')) {
        const rootBlock = await this.rootBridge.fetchJson('eth_getBlockByNumber', ['latest', false]);
        const maxGas = ~~Number(rootBlock.gasLimit);
        // Use 1/4 of the block gas limit as our target
        // TODO: make this configurable
        const targetGas = ~~(maxGas * 0.25);

        // dynamically find the best (in hindsight of targetGas) gasLimit per challenge call
        let bestOffset = 0;
        let bestGas = 0;

        for (let gas = 500000; gas < maxGas; gas += 250000) {
          tx.gas = `0x${gas.toString(16)}`;

          const callRes = await this.rootBridge.fetchJson('eth_call', [tx, 'latest']);
          const complete = Number(callRes.substring(0, 66));

          if (complete) {
            bestGas = gas;
            break;
          }

          const challengeOffset = Number(callRes.substring(66, 130));

          if (!challengeOffset) {
            continue;
          }

          if (bestOffset === 0) {
            bestOffset = challengeOffset;
          }

          if (challengeOffset > bestOffset) {
            bestOffset = challengeOffset;
            bestGas = gas;

            if (gas > targetGas) {
              // need to stop now
              break;
            }
          }
        }

        if (bestGas === 0) {
          throw new Error(`Impossible to calculate gasLimit for successful challenge`);
        }

        tx.gasLimit = bestGas;
        this.log('wrapSendTransaction', { bestGas, bestOffset });
      }
      else {
        // TODO: make this a config option
        tx.gasLimit = Number((await this.rootBridge.fetchJson('eth_estimateGas', [tx]))) + 50000;
      }
    }

    const nonce = Number(await this.rootBridge.fetchJson('eth_getTransactionCount', [this.signer, 'pending']));
    tx.nonce = nonce;

    const { txHash, rawTxHex } = await signRlpTransaction(tx, this.privKey, this.CHAIN_ID);

    await this.rootBridge.fetchJson('eth_sendRawTransaction', [rawTxHex]);

    // TODO bound loop size
    while (true) {
      const latestNonce = Number(await this.rootBridge.fetchJson('eth_getTransactionCount', [this.signer, 'latest']));

      if (latestNonce > nonce) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    let receipt;
    while (true) {
      receipt = await this.rootBridge.fetchJson('eth_getTransactionReceipt', [txHash]);

      if (receipt) {
        if (Number(receipt.status) === 0) {
          throw new Error(`transaction reverted`);
        }
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return receipt;
  }

  shouldSubmitNextBlock () {
    // TODO: support more than one
    if (this._pendingBlockSubmission || !this.pendingBlock.transactionHashes.length) {
      return false;
    }

    if (this.pendingBlock.submissionDeadline !== 0) {
      // TODO: make this a config option or calculate block submission time averages
      // 180 seconds
      const submissionTime = 180;
      const now = ~~(Date.now() / 1000);
      const shouldSubmit = now >= (this.pendingBlock.submissionDeadline - submissionTime);

      this.log(`should submit next block because of transaction deadline: ${shouldSubmit} delta: ${this.pendingBlock.submissionDeadline - now}`);

      if (shouldSubmit) {
        return shouldSubmit;
      }
    }

    const timeSinceLastSubmission = Date.now() - this._lastBlockSubmission;
    const size = this.pendingBlock.calculateSize();

    return size >= this.blockSizeThreshold || timeSinceLastSubmission >= this.blockTimeThreshold;
  }
}

var OPCODES = {
  // name, off stack, on stack
  0x00: ['STOP', 0, 0],
  0x01: ['ADD', 2, 1],
  0x02: ['MUL', 2, 1],
  0x03: ['SUB', 2, 1],
  0x04: ['DIV', 2, 1],
  0x05: ['SDIV', 2, 1],
  0x06: ['MOD', 2, 1],
  0x07: ['SMOD', 2, 1],
  0x08: ['ADDMOD', 3, 1],
  0x09: ['MULMOD', 3, 1],
  0x0a: ['EXP', 2, 1],
  0x0b: ['SIGNEXTEND', 2, 1],
  0x10: ['LT', 2, 1],
  0x11: ['GT', 2, 1],
  0x12: ['SLT', 2, 1],
  0x13: ['SGT', 2, 1],
  0x14: ['EQ', 2, 1],
  0x15: ['ISZERO', 1, 1],
  0x16: ['AND', 2, 1],
  0x17: ['OR', 2, 1],
  0x18: ['XOR', 2, 1],
  0x19: ['NOT', 1, 1],
  0x1a: ['BYTE', 2, 1],
  0x1b: ['SHL', 2, 1],
  0x1c: ['SHR', 2, 1],
  0x1d: ['SAR', 2, 1],
  0x20: ['SHA3', 2, 1],
  0x30: ['ADDRESS', 0, 1],
  0x31: ['BALANCE', 1, 1],
  0x32: ['ORIGIN', 0, 1],
  0x33: ['CALLER', 0, 1],
  0x34: ['CALLVALUE', 0, 1],
  0x35: ['CALLDATALOAD', 1, 1],
  0x36: ['CALLDATASIZE', 0, 1],
  0x37: ['CALLDATACOPY', 3, 0],
  0x38: ['CODESIZE', 0, 1],
  0x39: ['CODECOPY', 3, 0],
  0x3a: ['GASPRICE', 0, 1],
  0x3b: ['EXTCODESIZE', 1, 1],
  0x3c: ['EXTCODECOPY', 4, 0],
  0x3d: ['RETURNDATASIZE', 0, 1],
  0x3e: ['RETURNDATACOPY', 3, 0],
  0x3f: ['EXTCODEHASH', 1, 1],
  0x40: ['BLOCKHASH', 1, 1],
  0x41: ['COINBASE', 0, 1],
  0x42: ['TIMESTAMP', 0, 1],
  0x43: ['NUMBER', 0, 1],
  0x44: ['DIFFICULTY', 0, 1],
  0x45: ['GASLIMIT', 0, 1],
  0x46: ['CHAINID', 0, 1],
  0x47: ['SELFBALANCE', 0, 1],
  0x50: ['POP', 1, 0],
  0x51: ['MLOAD', 1, 1],
  0x52: ['MSTORE', 2, 0],
  0x53: ['MSTORE8', 2, 0],
  0x54: ['SLOAD', 1, 1],
  0x55: ['SSTORE', 2, 0],
  0x56: ['JUMP', 1, 0],
  0x57: ['JUMPI', 2, 0],
  0x58: ['PC', 0, 1],
  0x59: ['MSIZE', 0, 1],
  0x5a: ['GAS', 0, 1],
  0x5b: ['JUMPDEST', 0, 0],
  0x60: ['PUSH', 0, 1],
  0x61: ['PUSH', 0, 1],
  0x62: ['PUSH', 0, 1],
  0x63: ['PUSH', 0, 1],
  0x64: ['PUSH', 0, 1],
  0x65: ['PUSH', 0, 1],
  0x66: ['PUSH', 0, 1],
  0x67: ['PUSH', 0, 1],
  0x68: ['PUSH', 0, 1],
  0x69: ['PUSH', 0, 1],
  0x6a: ['PUSH', 0, 1],
  0x6b: ['PUSH', 0, 1],
  0x6c: ['PUSH', 0, 1],
  0x6d: ['PUSH', 0, 1],
  0x6e: ['PUSH', 0, 1],
  0x6f: ['PUSH', 0, 1],
  0x70: ['PUSH', 0, 1],
  0x71: ['PUSH', 0, 1],
  0x72: ['PUSH', 0, 1],
  0x73: ['PUSH', 0, 1],
  0x74: ['PUSH', 0, 1],
  0x75: ['PUSH', 0, 1],
  0x76: ['PUSH', 0, 1],
  0x77: ['PUSH', 0, 1],
  0x78: ['PUSH', 0, 1],
  0x79: ['PUSH', 0, 1],
  0x7a: ['PUSH', 0, 1],
  0x7b: ['PUSH', 0, 1],
  0x7c: ['PUSH', 0, 1],
  0x7d: ['PUSH', 0, 1],
  0x7e: ['PUSH', 0, 1],
  0x7f: ['PUSH', 0, 1],
  0x80: ['DUP', 0, 1],
  0x81: ['DUP', 0, 1],
  0x82: ['DUP', 0, 1],
  0x83: ['DUP', 0, 1],
  0x84: ['DUP', 0, 1],
  0x85: ['DUP', 0, 1],
  0x86: ['DUP', 0, 1],
  0x87: ['DUP', 0, 1],
  0x88: ['DUP', 0, 1],
  0x89: ['DUP', 0, 1],
  0x8a: ['DUP', 0, 1],
  0x8b: ['DUP', 0, 1],
  0x8c: ['DUP', 0, 1],
  0x8d: ['DUP', 0, 1],
  0x8e: ['DUP', 0, 1],
  0x8f: ['DUP', 0, 1],
  0x90: ['SWAP', 0, 0],
  0x91: ['SWAP', 0, 0],
  0x92: ['SWAP', 0, 0],
  0x93: ['SWAP', 0, 0],
  0x94: ['SWAP', 0, 0],
  0x95: ['SWAP', 0, 0],
  0x96: ['SWAP', 0, 0],
  0x97: ['SWAP', 0, 0],
  0x98: ['SWAP', 0, 0],
  0x99: ['SWAP', 0, 0],
  0x9a: ['SWAP', 0, 0],
  0x9b: ['SWAP', 0, 0],
  0x9c: ['SWAP', 0, 0],
  0x9d: ['SWAP', 0, 0],
  0x9e: ['SWAP', 0, 0],
  0x9f: ['SWAP', 0, 0],
  0xa0: ['LOG', 2, 0],
  0xa1: ['LOG', 3, 0],
  0xa2: ['LOG', 4, 0],
  0xa3: ['LOG', 5, 0],
  0xa4: ['LOG', 6, 0],
  0xf0: ['CREATE', 3, 1],
  0xf1: ['CALL', 7, 1],
  0xf2: ['CALLCODE', 7, 1],
  0xf3: ['RETURN', 2, 0],
  0xf4: ['DELEGATECALL', 6, 1],
  0xf5: ['CREATE2', 4, 1],
  0xfa: ['STATICCALL', 6, 1],
  0xfd: ['REVERT', 2, 0],
  0xfe: ['INVALID', 0, 0],
  0xff: ['SELFDESTRUCT', 1, 0],
};

function _p1 (data) {
  const results = {};

  const msgHash = data.slice(0, 32);
  const v = Number(toHexPrefix(data.slice(32, 64)));
  const r = data.slice(64, 96);
  const s = data.slice(96, 128);

  let address;
  try {
    address = recoverAddress(msgHash, v, r, s);
  } catch (e) {
    results.returnValue = [];
    results.exception = 1;
    return results;
  }

  results.returnValue = arrayify(address.slice(2).padStart(64, '0'));
  results.exception = 1;

  return results;
}

async function _p2 (data) {
  return {
    returnValue: await sha256(data),
    exception: 1
  };
}

function _p3 (data) {
  return {
    returnValue: ripemd160(data, true),
    exception: 1
  };
}

function _p4 (data) {
  const results = {};

  results.returnValue = data;
  results.exception = 1;

  return results;
}

function pad (buf, len) {
  for (let i = buf.length; i < len; i++) {
    buf[i] = 0;
  }

  return buf;
}

const BIG_ZERO$3 = BigInt(0);
const BIG_ONE$3 = BigInt(1);
const BIG_TWO = BigInt(2);

function expmod (base, exponent, modulus) {
  if (modulus <= BIG_ONE$3) {
    return BIG_ZERO$3;
  }

  if (exponent === BIG_ZERO$3) {
    return BIG_ONE$3 % modulus;
  }

  let r = BIG_ONE$3;
  let b = base;
  let e = exponent;

  while (true) {
    if (e % BIG_TWO === BIG_ONE$3) {
      r = (r * b) % modulus;
    }
    e /= BIG_TWO;

    if (e === BIG_ZERO$3) {
      break;
    }

    b = (b * b) % modulus;
  }

  return r;
}

function getOOGResults (results) {
  results.returnValue = [];
  results.exception = 0;
  return results;
}

function _p5 (data) {
  const results = {};

  const bLen = ~~Number(toHexPrefix(data.slice(0, 32)));
  const eLen = ~~Number(toHexPrefix(data.slice(32, 64)));
  const mLen = ~~Number(toHexPrefix(data.slice(64, 96)));

  if (bLen === 0) {
    results.returnValue = [0];
    results.exception = 1;
    return results;
  }

  if (mLen === 0) {
    results.returnValue = [];
    results.exception = 1;
    return results;
  }

  const maxSize = 2048;

  if (bLen > maxSize || eLen > maxSize || mLen > maxSize) {
    return getOOGResults(results);
  }

  const bStart = 96;
  const bEnd = bStart + bLen;
  const eStart = bEnd;
  const eEnd = eStart + eLen;
  const mStart = eEnd;
  const mEnd = mStart + mLen;

  const base = BigInt(toHexPrefix(pad(data.slice(bStart, bEnd), bLen)));
  const exponent = BigInt(toHexPrefix(pad(data.slice(eStart, eEnd), eLen)));
  const modulus = BigInt(toHexPrefix(pad(data.slice(mStart, mEnd), mLen)));

  const res = expmod(base, exponent, modulus);

  results.returnValue = arrayify(res.toString(16).padStart(mLen * 2, '0'));
  results.exception = 1;

  return results;
}

var index_asm = createCommonjsModule(function (module) {
var Module;if(!Module)Module=(typeof Module!=="undefined"?Module:null)||{};var moduleOverrides={};for(var key in Module){if(Module.hasOwnProperty(key)){moduleOverrides[key]=Module[key];}}var ENVIRONMENT_IS_WEB=false;var ENVIRONMENT_IS_WORKER=false;var ENVIRONMENT_IS_NODE=false;var ENVIRONMENT_IS_SHELL=false;if(Module["ENVIRONMENT"]){if(Module["ENVIRONMENT"]==="WEB"){ENVIRONMENT_IS_WEB=true;}else if(Module["ENVIRONMENT"]==="WORKER"){ENVIRONMENT_IS_WORKER=true;}else if(Module["ENVIRONMENT"]==="NODE"){ENVIRONMENT_IS_NODE=true;}else if(Module["ENVIRONMENT"]==="SHELL"){ENVIRONMENT_IS_SHELL=true;}else {throw new Error("The provided Module['ENVIRONMENT'] value is not valid. It must be one of: WEB|WORKER|NODE|SHELL.")}}else {ENVIRONMENT_IS_WEB=typeof window==="object";ENVIRONMENT_IS_WORKER=typeof importScripts==="function";ENVIRONMENT_IS_NODE=typeof process==="object"&&typeof commonjsRequire==="function"&&!ENVIRONMENT_IS_WEB&&!ENVIRONMENT_IS_WORKER;ENVIRONMENT_IS_SHELL=!ENVIRONMENT_IS_WEB&&!ENVIRONMENT_IS_NODE&&!ENVIRONMENT_IS_WORKER;}if(ENVIRONMENT_IS_NODE){if(!Module["print"])Module["print"]=console.log;if(!Module["printErr"])Module["printErr"]=console.warn;var nodeFS;var nodePath;Module["read"]=function shell_read(filename,binary){var ret;ret=tryParseAsDataURI(filename);if(!ret){if(!nodeFS)nodeFS=fs;if(!nodePath)nodePath=path$1;filename=nodePath["normalize"](filename);ret=nodeFS["readFileSync"](filename);}return binary?ret:ret.toString()};Module["readBinary"]=function readBinary(filename){var ret=Module["read"](filename,true);if(!ret.buffer){ret=new Uint8Array(ret);}assert(ret.buffer);return ret};Module["load"]=function load(f){globalEval(read(f));};if(!Module["thisProgram"]){if(process["argv"].length>1){Module["thisProgram"]=process["argv"][1].replace(/\\/g,"/");}else {Module["thisProgram"]="unknown-program";}}Module["arguments"]=process["argv"].slice(2);{module["exports"]=Module;}Module["inspect"]=(function(){return "[Emscripten Module object]"});}else if(ENVIRONMENT_IS_SHELL){if(!Module["print"])Module["print"]=print;if(typeof printErr!="undefined")Module["printErr"]=printErr;if(typeof read!="undefined"){Module["read"]=function shell_read(f){var data=tryParseAsDataURI(f);if(data){return intArrayToString(data)}return read(f)};}else {Module["read"]=function shell_read(){throw "no read() available"};}Module["readBinary"]=function readBinary(f){var data;data=tryParseAsDataURI(f);if(data){return data}if(typeof readbuffer==="function"){return new Uint8Array(readbuffer(f))}data=read(f,"binary");assert(typeof data==="object");return data};if(typeof scriptArgs!="undefined"){Module["arguments"]=scriptArgs;}else if(typeof arguments!="undefined"){Module["arguments"]=arguments;}if(typeof quit==="function"){Module["quit"]=(function(status,toThrow){quit(status);});}}else if(ENVIRONMENT_IS_WEB||ENVIRONMENT_IS_WORKER){Module["read"]=function shell_read(url){try{var xhr=new XMLHttpRequest;xhr.open("GET",url,false);xhr.send(null);return xhr.responseText}catch(err){var data=tryParseAsDataURI(url);if(data){return intArrayToString(data)}throw err}};if(ENVIRONMENT_IS_WORKER){Module["readBinary"]=function readBinary(url){try{var xhr=new XMLHttpRequest;xhr.open("GET",url,false);xhr.responseType="arraybuffer";xhr.send(null);return new Uint8Array(xhr.response)}catch(err){var data=tryParseAsDataURI(f);if(data){return data}throw err}};}Module["readAsync"]=function readAsync(url,onload,onerror){var xhr=new XMLHttpRequest;xhr.open("GET",url,true);xhr.responseType="arraybuffer";xhr.onload=function xhr_onload(){if(xhr.status==200||xhr.status==0&&xhr.response){onload(xhr.response);return}var data=tryParseAsDataURI(url);if(data){onload(data.buffer);return}onerror();};xhr.onerror=onerror;xhr.send(null);};if(typeof arguments!="undefined"){Module["arguments"]=arguments;}if(typeof console!=="undefined"){if(!Module["print"])Module["print"]=function shell_print(x){console.log(x);};if(!Module["printErr"])Module["printErr"]=function shell_printErr(x){console.warn(x);};}else {var TRY_USE_DUMP=false;if(!Module["print"])Module["print"]=TRY_USE_DUMP&&typeof dump!=="undefined"?(function(x){dump(x);}):(function(x){});}if(ENVIRONMENT_IS_WORKER){Module["load"]=importScripts;}if(typeof Module["setWindowTitle"]==="undefined"){Module["setWindowTitle"]=(function(title){document.title=title;});}}else {throw new Error("Unknown runtime environment. Where are we?")}function globalEval(x){eval.call(null,x);}if(!Module["load"]&&Module["read"]){Module["load"]=function load(f){globalEval(Module["read"](f));};}if(!Module["print"]){Module["print"]=(function(){});}if(!Module["printErr"]){Module["printErr"]=Module["print"];}if(!Module["arguments"]){Module["arguments"]=[];}if(!Module["thisProgram"]){Module["thisProgram"]="./this.program";}if(!Module["quit"]){Module["quit"]=(function(status,toThrow){throw toThrow});}Module.print=Module["print"];Module.printErr=Module["printErr"];Module["preRun"]=[];Module["postRun"]=[];for(var key in moduleOverrides){if(moduleOverrides.hasOwnProperty(key)){Module[key]=moduleOverrides[key];}}moduleOverrides=undefined;var Runtime={setTempRet0:(function(value){tempRet0=value;return value}),getTempRet0:(function(){return tempRet0}),stackSave:(function(){return STACKTOP}),stackRestore:(function(stackTop){STACKTOP=stackTop;}),getNativeTypeSize:(function(type){switch(type){case"i1":case"i8":return 1;case"i16":return 2;case"i32":return 4;case"i64":return 8;case"float":return 4;case"double":return 8;default:{if(type[type.length-1]==="*"){return Runtime.QUANTUM_SIZE}else if(type[0]==="i"){var bits=parseInt(type.substr(1));assert(bits%8===0);return bits/8}else {return 0}}}}),getNativeFieldSize:(function(type){return Math.max(Runtime.getNativeTypeSize(type),Runtime.QUANTUM_SIZE)}),STACK_ALIGN:16,prepVararg:(function(ptr,type){if(type==="double"||type==="i64"){if(ptr&7){assert((ptr&7)===4);ptr+=4;}}else {assert((ptr&3)===0);}return ptr}),getAlignSize:(function(type,size,vararg){if(!vararg&&(type=="i64"||type=="double"))return 8;if(!type)return Math.min(size,8);return Math.min(size||(type?Runtime.getNativeFieldSize(type):0),Runtime.QUANTUM_SIZE)}),dynCall:(function(sig,ptr,args){if(args&&args.length){return Module["dynCall_"+sig].apply(null,[ptr].concat(args))}else {return Module["dynCall_"+sig].call(null,ptr)}}),functionPointers:[],addFunction:(function(func){for(var i=0;i<Runtime.functionPointers.length;i++){if(!Runtime.functionPointers[i]){Runtime.functionPointers[i]=func;return 2*(1+i)}}throw "Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS."}),removeFunction:(function(index){Runtime.functionPointers[(index-2)/2]=null;}),warnOnce:(function(text){if(!Runtime.warnOnce.shown)Runtime.warnOnce.shown={};if(!Runtime.warnOnce.shown[text]){Runtime.warnOnce.shown[text]=1;Module.printErr(text);}}),funcWrappers:{},getFuncWrapper:(function(func,sig){if(!func)return;assert(sig);if(!Runtime.funcWrappers[sig]){Runtime.funcWrappers[sig]={};}var sigCache=Runtime.funcWrappers[sig];if(!sigCache[func]){if(sig.length===1){sigCache[func]=function dynCall_wrapper(){return Runtime.dynCall(sig,func)};}else if(sig.length===2){sigCache[func]=function dynCall_wrapper(arg){return Runtime.dynCall(sig,func,[arg])};}else {sigCache[func]=function dynCall_wrapper(){return Runtime.dynCall(sig,func,Array.prototype.slice.call(arguments))};}}return sigCache[func]}),getCompilerSetting:(function(name){throw "You must build with -s RETAIN_COMPILER_SETTINGS=1 for Runtime.getCompilerSetting or emscripten_get_compiler_setting to work"}),stackAlloc:(function(size){var ret=STACKTOP;STACKTOP=STACKTOP+size|0;STACKTOP=STACKTOP+15&-16;return ret}),staticAlloc:(function(size){var ret=STATICTOP;STATICTOP=STATICTOP+size|0;STATICTOP=STATICTOP+15&-16;return ret}),dynamicAlloc:(function(size){var ret=HEAP32[DYNAMICTOP_PTR>>2];var end=(ret+size+15|0)&-16;HEAP32[DYNAMICTOP_PTR>>2]=end;if(end>=TOTAL_MEMORY){var success=enlargeMemory();if(!success){HEAP32[DYNAMICTOP_PTR>>2]=ret;return 0}}return ret}),alignMemory:(function(size,quantum){var ret=size=Math.ceil(size/(quantum?quantum:16))*(quantum?quantum:16);return ret}),makeBigInt:(function(low,high,unsigned){var ret=unsigned?+(low>>>0)+ +(high>>>0)*+4294967296:+(low>>>0)+ +(high|0)*+4294967296;return ret}),GLOBAL_BASE:8,QUANTUM_SIZE:4,__dummy__:0};Module["Runtime"]=Runtime;var ABORT=0;function assert(condition,text){if(!condition){abort("Assertion failed: "+text);}}function getCFunc(ident){var func=Module["_"+ident];if(!func){try{func=eval("_"+ident);}catch(e){}}assert(func,"Cannot call unknown function "+ident+" (perhaps LLVM optimizations or closure removed it?)");return func}var cwrap,ccall;((function(){var JSfuncs={"stackSave":(function(){Runtime.stackSave();}),"stackRestore":(function(){Runtime.stackRestore();}),"arrayToC":(function(arr){var ret=Runtime.stackAlloc(arr.length);writeArrayToMemory(arr,ret);return ret}),"stringToC":(function(str){var ret=0;if(str!==null&&str!==undefined&&str!==0){var len=(str.length<<2)+1;ret=Runtime.stackAlloc(len);stringToUTF8(str,ret,len);}return ret})};var toC={"string":JSfuncs["stringToC"],"array":JSfuncs["arrayToC"]};ccall=function ccallFunc(ident,returnType,argTypes,args,opts){var func=getCFunc(ident);var cArgs=[];var stack=0;if(args){for(var i=0;i<args.length;i++){var converter=toC[argTypes[i]];if(converter){if(stack===0)stack=Runtime.stackSave();cArgs[i]=converter(args[i]);}else {cArgs[i]=args[i];}}}var ret=func.apply(null,cArgs);if(returnType==="string")ret=Pointer_stringify(ret);if(stack!==0){if(opts&&opts.async){EmterpreterAsync.asyncFinalizers.push((function(){Runtime.stackRestore(stack);}));return}Runtime.stackRestore(stack);}return ret};var sourceRegex=/^function\s*[a-zA-Z$_0-9]*\s*\(([^)]*)\)\s*{\s*([^*]*?)[\s;]*(?:return\s*(.*?)[;\s]*)?}$/;function parseJSFunc(jsfunc){var parsed=jsfunc.toString().match(sourceRegex).slice(1);return {arguments:parsed[0],body:parsed[1],returnValue:parsed[2]}}var JSsource=null;function ensureJSsource(){if(!JSsource){JSsource={};for(var fun in JSfuncs){if(JSfuncs.hasOwnProperty(fun)){JSsource[fun]=parseJSFunc(JSfuncs[fun]);}}}}cwrap=function cwrap(ident,returnType,argTypes){argTypes=argTypes||[];var cfunc=getCFunc(ident);var numericArgs=argTypes.every((function(type){return type==="number"}));var numericRet=returnType!=="string";if(numericRet&&numericArgs){return cfunc}var argNames=argTypes.map((function(x,i){return "$"+i}));var funcstr="(function("+argNames.join(",")+") {";var nargs=argTypes.length;if(!numericArgs){ensureJSsource();funcstr+="var stack = "+JSsource["stackSave"].body+";";for(var i=0;i<nargs;i++){var arg=argNames[i],type=argTypes[i];if(type==="number")continue;var convertCode=JSsource[type+"ToC"];funcstr+="var "+convertCode.arguments+" = "+arg+";";funcstr+=convertCode.body+";";funcstr+=arg+"=("+convertCode.returnValue+");";}}var cfuncname=parseJSFunc((function(){return cfunc})).returnValue;funcstr+="var ret = "+cfuncname+"("+argNames.join(",")+");";if(!numericRet){var strgfy=parseJSFunc((function(){return Pointer_stringify})).returnValue;funcstr+="ret = "+strgfy+"(ret);";}if(!numericArgs){ensureJSsource();funcstr+=JSsource["stackRestore"].body.replace("()","(stack)")+";";}funcstr+="return ret})";return eval(funcstr)};}))();Module["ccall"]=ccall;Module["cwrap"]=cwrap;function setValue(ptr,value,type,noSafe){type=type||"i8";if(type.charAt(type.length-1)==="*")type="i32";switch(type){case"i1":HEAP8[ptr>>0]=value;break;case"i8":HEAP8[ptr>>0]=value;break;case"i16":HEAP16[ptr>>1]=value;break;case"i32":HEAP32[ptr>>2]=value;break;case"i64":tempI64=[value>>>0,(tempDouble=value,+Math_abs(tempDouble)>=+1?tempDouble>+0?(Math_min(+Math_floor(tempDouble/+4294967296),+4294967295)|0)>>>0:~~+Math_ceil((tempDouble- +(~~tempDouble>>>0))/+4294967296)>>>0:0)],HEAP32[ptr>>2]=tempI64[0],HEAP32[ptr+4>>2]=tempI64[1];break;case"float":HEAPF32[ptr>>2]=value;break;case"double":HEAPF64[ptr>>3]=value;break;default:abort("invalid type for setValue: "+type);}}Module["setValue"]=setValue;function getValue(ptr,type,noSafe){type=type||"i8";if(type.charAt(type.length-1)==="*")type="i32";switch(type){case"i1":return HEAP8[ptr>>0];case"i8":return HEAP8[ptr>>0];case"i16":return HEAP16[ptr>>1];case"i32":return HEAP32[ptr>>2];case"i64":return HEAP32[ptr>>2];case"float":return HEAPF32[ptr>>2];case"double":return HEAPF64[ptr>>3];default:abort("invalid type for getValue: "+type);}return null}Module["getValue"]=getValue;var ALLOC_NORMAL=0;var ALLOC_STACK=1;var ALLOC_STATIC=2;var ALLOC_DYNAMIC=3;var ALLOC_NONE=4;Module["ALLOC_NORMAL"]=ALLOC_NORMAL;Module["ALLOC_STACK"]=ALLOC_STACK;Module["ALLOC_STATIC"]=ALLOC_STATIC;Module["ALLOC_DYNAMIC"]=ALLOC_DYNAMIC;Module["ALLOC_NONE"]=ALLOC_NONE;function allocate(slab,types,allocator,ptr){var zeroinit,size;if(typeof slab==="number"){zeroinit=true;size=slab;}else {zeroinit=false;size=slab.length;}var singleType=typeof types==="string"?types:null;var ret;if(allocator==ALLOC_NONE){ret=ptr;}else {ret=[typeof _malloc==="function"?_malloc:Runtime.staticAlloc,Runtime.stackAlloc,Runtime.staticAlloc,Runtime.dynamicAlloc][allocator===undefined?ALLOC_STATIC:allocator](Math.max(size,singleType?1:types.length));}if(zeroinit){var ptr=ret,stop;assert((ret&3)==0);stop=ret+(size&~3);for(;ptr<stop;ptr+=4){HEAP32[ptr>>2]=0;}stop=ret+size;while(ptr<stop){HEAP8[ptr++>>0]=0;}return ret}if(singleType==="i8"){if(slab.subarray||slab.slice){HEAPU8.set(slab,ret);}else {HEAPU8.set(new Uint8Array(slab),ret);}return ret}var i=0,type,typeSize,previousType;while(i<size){var curr=slab[i];if(typeof curr==="function"){curr=Runtime.getFunctionIndex(curr);}type=singleType||types[i];if(type===0){i++;continue}if(type=="i64")type="i32";setValue(ret+i,curr,type);if(previousType!==type){typeSize=Runtime.getNativeTypeSize(type);previousType=type;}i+=typeSize;}return ret}Module["allocate"]=allocate;function getMemory(size){if(!staticSealed)return Runtime.staticAlloc(size);if(!runtimeInitialized)return Runtime.dynamicAlloc(size);return _malloc(size)}Module["getMemory"]=getMemory;function Pointer_stringify(ptr,length){if(length===0||!ptr)return "";var hasUtf=0;var t;var i=0;while(1){t=HEAPU8[ptr+i>>0];hasUtf|=t;if(t==0&&!length)break;i++;if(length&&i==length)break}if(!length)length=i;var ret="";if(hasUtf<128){var MAX_CHUNK=1024;var curr;while(length>0){curr=String.fromCharCode.apply(String,HEAPU8.subarray(ptr,ptr+Math.min(length,MAX_CHUNK)));ret=ret?ret+curr:curr;ptr+=MAX_CHUNK;length-=MAX_CHUNK;}return ret}return Module["UTF8ToString"](ptr)}Module["Pointer_stringify"]=Pointer_stringify;function AsciiToString(ptr){var str="";while(1){var ch=HEAP8[ptr++>>0];if(!ch)return str;str+=String.fromCharCode(ch);}}Module["AsciiToString"]=AsciiToString;function stringToAscii(str,outPtr){return writeAsciiToMemory(str,outPtr,false)}Module["stringToAscii"]=stringToAscii;var UTF8Decoder=typeof TextDecoder!=="undefined"?new TextDecoder("utf8"):undefined;function UTF8ArrayToString(u8Array,idx){var endPtr=idx;while(u8Array[endPtr])++endPtr;if(endPtr-idx>16&&u8Array.subarray&&UTF8Decoder){return UTF8Decoder.decode(u8Array.subarray(idx,endPtr))}else {var u0,u1,u2,u3,u4,u5;var str="";while(1){u0=u8Array[idx++];if(!u0)return str;if(!(u0&128)){str+=String.fromCharCode(u0);continue}u1=u8Array[idx++]&63;if((u0&224)==192){str+=String.fromCharCode((u0&31)<<6|u1);continue}u2=u8Array[idx++]&63;if((u0&240)==224){u0=(u0&15)<<12|u1<<6|u2;}else {u3=u8Array[idx++]&63;if((u0&248)==240){u0=(u0&7)<<18|u1<<12|u2<<6|u3;}else {u4=u8Array[idx++]&63;if((u0&252)==248){u0=(u0&3)<<24|u1<<18|u2<<12|u3<<6|u4;}else {u5=u8Array[idx++]&63;u0=(u0&1)<<30|u1<<24|u2<<18|u3<<12|u4<<6|u5;}}}if(u0<65536){str+=String.fromCharCode(u0);}else {var ch=u0-65536;str+=String.fromCharCode(55296|ch>>10,56320|ch&1023);}}}}Module["UTF8ArrayToString"]=UTF8ArrayToString;function UTF8ToString(ptr){return UTF8ArrayToString(HEAPU8,ptr)}Module["UTF8ToString"]=UTF8ToString;function stringToUTF8Array(str,outU8Array,outIdx,maxBytesToWrite){if(!(maxBytesToWrite>0))return 0;var startIdx=outIdx;var endIdx=outIdx+maxBytesToWrite-1;for(var i=0;i<str.length;++i){var u=str.charCodeAt(i);if(u>=55296&&u<=57343)u=65536+((u&1023)<<10)|str.charCodeAt(++i)&1023;if(u<=127){if(outIdx>=endIdx)break;outU8Array[outIdx++]=u;}else if(u<=2047){if(outIdx+1>=endIdx)break;outU8Array[outIdx++]=192|u>>6;outU8Array[outIdx++]=128|u&63;}else if(u<=65535){if(outIdx+2>=endIdx)break;outU8Array[outIdx++]=224|u>>12;outU8Array[outIdx++]=128|u>>6&63;outU8Array[outIdx++]=128|u&63;}else if(u<=2097151){if(outIdx+3>=endIdx)break;outU8Array[outIdx++]=240|u>>18;outU8Array[outIdx++]=128|u>>12&63;outU8Array[outIdx++]=128|u>>6&63;outU8Array[outIdx++]=128|u&63;}else if(u<=67108863){if(outIdx+4>=endIdx)break;outU8Array[outIdx++]=248|u>>24;outU8Array[outIdx++]=128|u>>18&63;outU8Array[outIdx++]=128|u>>12&63;outU8Array[outIdx++]=128|u>>6&63;outU8Array[outIdx++]=128|u&63;}else {if(outIdx+5>=endIdx)break;outU8Array[outIdx++]=252|u>>30;outU8Array[outIdx++]=128|u>>24&63;outU8Array[outIdx++]=128|u>>18&63;outU8Array[outIdx++]=128|u>>12&63;outU8Array[outIdx++]=128|u>>6&63;outU8Array[outIdx++]=128|u&63;}}outU8Array[outIdx]=0;return outIdx-startIdx}Module["stringToUTF8Array"]=stringToUTF8Array;function stringToUTF8(str,outPtr,maxBytesToWrite){return stringToUTF8Array(str,HEAPU8,outPtr,maxBytesToWrite)}Module["stringToUTF8"]=stringToUTF8;function lengthBytesUTF8(str){var len=0;for(var i=0;i<str.length;++i){var u=str.charCodeAt(i);if(u>=55296&&u<=57343)u=65536+((u&1023)<<10)|str.charCodeAt(++i)&1023;if(u<=127){++len;}else if(u<=2047){len+=2;}else if(u<=65535){len+=3;}else if(u<=2097151){len+=4;}else if(u<=67108863){len+=5;}else {len+=6;}}return len}Module["lengthBytesUTF8"]=lengthBytesUTF8;var UTF16Decoder=typeof TextDecoder!=="undefined"?new TextDecoder("utf-16le"):undefined;function demangle(func){var __cxa_demangle_func=Module["___cxa_demangle"]||Module["__cxa_demangle"];if(__cxa_demangle_func){try{var s=func.substr(1);var len=lengthBytesUTF8(s)+1;var buf=_malloc(len);stringToUTF8(s,buf,len);var status=_malloc(4);var ret=__cxa_demangle_func(buf,0,0,status);if(getValue(status,"i32")===0&&ret){return Pointer_stringify(ret)}}catch(e){}finally{if(buf)_free(buf);if(status)_free(status);if(ret)_free(ret);}return func}Runtime.warnOnce("warning: build with  -s DEMANGLE_SUPPORT=1  to link in libcxxabi demangling");return func}function demangleAll(text){var regex=/__Z[\w\d_]+/g;return text.replace(regex,(function(x){var y=demangle(x);return x===y?x:x+" ["+y+"]"}))}function jsStackTrace(){var err=new Error;if(!err.stack){try{throw new Error(0)}catch(e){err=e;}if(!err.stack){return "(no stack trace available)"}}return err.stack.toString()}function stackTrace(){var js=jsStackTrace();if(Module["extraStackTrace"])js+="\n"+Module["extraStackTrace"]();return demangleAll(js)}Module["stackTrace"]=stackTrace;var HEAP,buffer,HEAP8,HEAPU8,HEAP16,HEAPU16,HEAP32,HEAPU32,HEAPF32,HEAPF64;function updateGlobalBufferViews(){Module["HEAP8"]=HEAP8=new Int8Array(buffer);Module["HEAP16"]=HEAP16=new Int16Array(buffer);Module["HEAP32"]=HEAP32=new Int32Array(buffer);Module["HEAPU8"]=HEAPU8=new Uint8Array(buffer);Module["HEAPU16"]=HEAPU16=new Uint16Array(buffer);Module["HEAPU32"]=HEAPU32=new Uint32Array(buffer);Module["HEAPF32"]=HEAPF32=new Float32Array(buffer);Module["HEAPF64"]=HEAPF64=new Float64Array(buffer);}var STATIC_BASE,STATICTOP,staticSealed;var STACK_BASE,STACKTOP,STACK_MAX;var DYNAMIC_BASE,DYNAMICTOP_PTR;STATIC_BASE=STATICTOP=STACK_BASE=STACKTOP=STACK_MAX=DYNAMIC_BASE=DYNAMICTOP_PTR=0;staticSealed=false;function abortOnCannotGrowMemory(){abort("Cannot enlarge memory arrays. Either (1) compile with  -s TOTAL_MEMORY=X  with X higher than the current value "+TOTAL_MEMORY+", (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which allows increasing the size at runtime but prevents some optimizations, (3) set Module.TOTAL_MEMORY to a higher value before the program runs, or (4) if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 ");}function enlargeMemory(){abortOnCannotGrowMemory();}var TOTAL_STACK=Module["TOTAL_STACK"]||5242880;var TOTAL_MEMORY=Module["TOTAL_MEMORY"]||16777216;if(TOTAL_MEMORY<TOTAL_STACK)Module.printErr("TOTAL_MEMORY should be larger than TOTAL_STACK, was "+TOTAL_MEMORY+"! (TOTAL_STACK="+TOTAL_STACK+")");if(Module["buffer"]){buffer=Module["buffer"];}else {{buffer=new ArrayBuffer(TOTAL_MEMORY);}}updateGlobalBufferViews();function getTotalMemory(){return TOTAL_MEMORY}HEAP32[0]=1668509029;HEAP16[1]=25459;if(HEAPU8[2]!==115||HEAPU8[3]!==99)throw "Runtime error: expected the system to be little-endian!";Module["HEAP"]=HEAP;Module["buffer"]=buffer;Module["HEAP8"]=HEAP8;Module["HEAP16"]=HEAP16;Module["HEAP32"]=HEAP32;Module["HEAPU8"]=HEAPU8;Module["HEAPU16"]=HEAPU16;Module["HEAPU32"]=HEAPU32;Module["HEAPF32"]=HEAPF32;Module["HEAPF64"]=HEAPF64;function callRuntimeCallbacks(callbacks){while(callbacks.length>0){var callback=callbacks.shift();if(typeof callback=="function"){callback();continue}var func=callback.func;if(typeof func==="number"){if(callback.arg===undefined){Module["dynCall_v"](func);}else {Module["dynCall_vi"](func,callback.arg);}}else {func(callback.arg===undefined?null:callback.arg);}}}var __ATPRERUN__=[];var __ATINIT__=[];var __ATMAIN__=[];var __ATEXIT__=[];var __ATPOSTRUN__=[];var runtimeInitialized=false;function preRun(){if(Module["preRun"]){if(typeof Module["preRun"]=="function")Module["preRun"]=[Module["preRun"]];while(Module["preRun"].length){addOnPreRun(Module["preRun"].shift());}}callRuntimeCallbacks(__ATPRERUN__);}function ensureInitRuntime(){if(runtimeInitialized)return;runtimeInitialized=true;callRuntimeCallbacks(__ATINIT__);}function preMain(){callRuntimeCallbacks(__ATMAIN__);}function exitRuntime(){callRuntimeCallbacks(__ATEXIT__);}function postRun(){if(Module["postRun"]){if(typeof Module["postRun"]=="function")Module["postRun"]=[Module["postRun"]];while(Module["postRun"].length){addOnPostRun(Module["postRun"].shift());}}callRuntimeCallbacks(__ATPOSTRUN__);}function addOnPreRun(cb){__ATPRERUN__.unshift(cb);}Module["addOnPreRun"]=addOnPreRun;function addOnInit(cb){__ATINIT__.unshift(cb);}Module["addOnInit"]=addOnInit;function addOnPreMain(cb){__ATMAIN__.unshift(cb);}Module["addOnPreMain"]=addOnPreMain;function addOnExit(cb){__ATEXIT__.unshift(cb);}Module["addOnExit"]=addOnExit;function addOnPostRun(cb){__ATPOSTRUN__.unshift(cb);}Module["addOnPostRun"]=addOnPostRun;function writeStringToMemory(string,buffer,dontAddNull){Runtime.warnOnce("writeStringToMemory is deprecated and should not be called! Use stringToUTF8() instead!");var lastChar,end;if(dontAddNull){end=buffer+lengthBytesUTF8(string);lastChar=HEAP8[end];}stringToUTF8(string,buffer,Infinity);if(dontAddNull)HEAP8[end]=lastChar;}Module["writeStringToMemory"]=writeStringToMemory;function writeArrayToMemory(array,buffer){HEAP8.set(array,buffer);}Module["writeArrayToMemory"]=writeArrayToMemory;function writeAsciiToMemory(str,buffer,dontAddNull){for(var i=0;i<str.length;++i){HEAP8[buffer++>>0]=str.charCodeAt(i);}if(!dontAddNull)HEAP8[buffer>>0]=0;}Module["writeAsciiToMemory"]=writeAsciiToMemory;if(!Math["imul"]||Math["imul"](4294967295,5)!==-5)Math["imul"]=function imul(a,b){var ah=a>>>16;var al=a&65535;var bh=b>>>16;var bl=b&65535;return al*bl+(ah*bl+al*bh<<16)|0};Math.imul=Math["imul"];if(!Math["clz32"])Math["clz32"]=(function(x){x=x>>>0;for(var i=0;i<32;i++){if(x&1<<31-i)return i}return 32});Math.clz32=Math["clz32"];if(!Math["trunc"])Math["trunc"]=(function(x){return x<0?Math.ceil(x):Math.floor(x)});Math.trunc=Math["trunc"];var Math_abs=Math.abs;var Math_ceil=Math.ceil;var Math_floor=Math.floor;var Math_min=Math.min;var runDependencies=0;var dependenciesFulfilled=null;function getUniqueRunDependency(id){return id}function addRunDependency(id){runDependencies++;if(Module["monitorRunDependencies"]){Module["monitorRunDependencies"](runDependencies);}}Module["addRunDependency"]=addRunDependency;function removeRunDependency(id){runDependencies--;if(Module["monitorRunDependencies"]){Module["monitorRunDependencies"](runDependencies);}if(runDependencies==0){if(dependenciesFulfilled){var callback=dependenciesFulfilled;dependenciesFulfilled=null;callback();}}}Module["removeRunDependency"]=removeRunDependency;Module["preloadedImages"]={};Module["preloadedAudios"]={};var memoryInitializer=null;STATIC_BASE=Runtime.GLOBAL_BASE;STATICTOP=STATIC_BASE+17504;__ATINIT__.push();memoryInitializer="data:application/octet-stream;base64,AQAA8JP14UORcLl5SOgzKF1YgYG2RVC4KaAx4XJOZDCnbSGuRea4G+NZXOOxOv5ThYC7Uz2DSYylRE5/sdAWAon6ilNb/Czz+wFF1BEZ57X2f0EK/x6rRx81uMpxn9gG3zAV2q9tzbG2PSin5hDyYvsK2goMC3/vRCVZLZBu/SBH/XzYFowgPI3KcWiRaoGXXViBgbZFULgpoDHhck5kMAAAAAAAAP8DAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP8DAAAAAAAAAAAAAAAAAAAAAP8DAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/wMAAAAAAACgBgAADQAAAHYqAADAAQAACAcAAA0AAAAAAAAAAAEAAQABAAEAAQABAAEAAQABAAEAAgACAwAAAAAEAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUAAAADAgAAAAAGAAIAAAcAAAIIAAAHAAAAAAAAAAAAAAAAAAAAAAAAAAkKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAEAAAAAAAAAAgQAAAwAAgAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAABAgMDAwQDAwMDAwMFBgMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMAAAAAAAAAAAAAAADA/wAAAAD/AwAAAAAAAAAA/wMAAP8DAAAAAAAAAAAAAADAAQDA/wAAAAAAAP8D/wMAAAAAAAAAAAAA/wMAAAAA/////+cBAAAAAAAAgAAAAP4DAAcAAP8DAAD/AwAAAAAAAAAA////////HwACBAAAAAAAAAAAPgAAAAAAAAAAAP8DAAAAAAAAwP8AAAAAAAAAAP8DAAAAAAAAwP8AAP8DAAAAAP8DAAAAAAAA/////////////////38AAADA////////pBYAABEAAAC1FgAAIQAAAAwCAAAZAAAApBYAABEAAAC1FgAAIQAAAMoCAAAJAAAAAQAAAAQAAAAEAAAAAQAAAAEAAAACAAAAUEAAAAAAAAD0FgAAAgAAAPYWAAAfAAAAlAMAAAUAAAAMGAAAKwAAADcYAAAfAAAATwEAABUAAABxGAAAKwAAAJwYAAAfAAAATwEAABUAAADaGAAAHQAAAA8GAAAKAAAA9xgAABEAAAAIGQAAIQAAAMoCAAAJAAAAPBkAAE0AAAAUAAAADgAAADwZAABNAAAAJgAAAA4AAACJGQAAKwAAALQZAAAfAAAATwEAABUAAAACAAAACAAAAAQAAAADAAAAMDEyMzQ1Njc4OWFiY2RlZhIaAAAUAAAA8RkAABMAAAAEGgAADgAAACYaAAArAAAAURoAAB8AAABPAQAAFQAAAHAaAAARAAAAgRoAACEAAAAMAgAAGQAAAHAaAAARAAAAgRoAACEAAADKAgAACQAAAMAaAAArAAAA6xoAAB8AAABPAQAAFQAAAAobAAAVAAAAIA4AAAEAAABRQAAAAAAAAEobAAACAAAAjBsAACIAAAA+AwAACgAAAGgbAAAkAAAAkwQAABQAAAADAAAABAAAAAQAAAABAAAABAAAAAQAAAAEAAAAAgAAAAEAAAACAAAAAAAAAAUAAAAGAAAADAAAAAQAAAAEAAAABwAAAAgAAAAEAAAABQAAAOQbAAAgAAAABBwAACMAAABlAAAADQAAAEQdAAAnAAAANgAAAA0AAABEHQAAJwAAADsAAAANAAAAEh0AADIAAACGHAAAKwAAAAAAAAAIAAAAAwAAAAkAAAAKAAAABAAAAAQAAAABAAAAAQAAAAIAAAABAAAAAAAAAPYcAAAIAAAA/hwAAA8AAAANHQAAAwAAABAdAAABAAAAEB0AAAEAAAARHQAAAQAAAMMcAAAzAAAAUUAAAAAAAABrHQAAAgAAAG0dAAAfAAAAlAMAAAUAAACMHQAAJAAAAMMBAAASAAAACwAAAAQAAAAEAAAAAQAAAAMAAAAEAAAADAAAAAQAAAAEAAAAAgAAAAMAAAAGAAAABQAAAAYAAAANAAAADAAAAAQAAAAEAAAABQAAAAcAAAAHAAAACAAAAA4AAAAEAAAABAAAAAkAAAAlHgAALQAAAFIeAAAMAAAAXh4AAAEAAAAPAAAABAAAAAQAAAAKAAAAEAAAAAwAAAAEAAAACwAAABEAAAABAAAAAQAAAAwAAAASAAAABAAAAAQAAAANAAAAEwAAAAQAAAAEAAAADgAAABQAAAAEAAAABAAAAA8AAABRQAAAAAAAAAQhAAALAAAA8A0AAAEAAADkIAAAIAAAANEAAAArAAAAUUAAAAAAAAAPIQAAAgAAAAEAAAAAAAAAIAAAAAgAAAADAAAAAAAAAAAAAAACAAAAAwAAABUAAAAEAAAABAAAABAAAAAWAAAABAAAAAQAAAARAAAAXx4AACgAAAA3AAAACQAAAF8eAAAoAAAAOQAAAAkAAABfHgAAKAAAADsAAAAJAAAAXx4AACgAAAA9AAAACQAAABcAAAAEAAAABAAAAAYAAAAHAAAAGSEAACsAAABEIQAAHwAAAE8BAAAVAAAAYyEAAC0AAACQIQAADAAAAJwhAAABAAAAuCEAACQAAADcIQAAAwAAAJ0hAAAbAAAA7wAAAAkAAAA4IgAAIQAAADsBAAAVAAAAOCIAACEAAABfAQAAFQAAAAIAAAA4IgAAIQAAAJEBAAAJAAAAGAAAAAQAAAAEAAAAEgAAAO0iAAAiAAAAHwQAABYAAADtIgAAIgAAACgEAAAWAAAAKyMAACwAAACaAAAADgAAAJIjAAArAAAAvSMAAB8AAABPAQAAFQAAAO0iAAAiAAAAHQMAABMAAADtIgAAIgAAAK0DAAARAAAAaiQAAFgAAABZJAAAEQAAAAoAAABrJQAAAgAAAG0lAAACAAAAbyUAAAMAAAABAAAAAAAAACAAAAAAAAAAAwAAAAAAAAAAAAAAAgAAAAMAAAABAAAAAQAAACAAAAAAAAAAAwAAAAAAAAABAAAAAgAAAAMAAABrJQAAAgAAAG0lAAACAAAAAQAAAAAAAAAgAAAAAAAAAAMAAAAAAAAAAAAAAAIAAAADAAAAPHVua25vd24+AAAAOjoAAC4AAABAAAAAKgAAACYAAAA8AAAAPgAAACgAAAApAAAALAAAAH4AAAAgAAAAJwAAAFsAAABdAAAAewAAAH0AAAA7AAAAKwAAACIAAAAKAAAASSUAACIAAAA+AwAACgAAACUlAAAkAAAA2wQAABQAAAAlJQAAJAAAAOgEAAAUAAAAciUAABEAAACDJQAAIQAAAKcBAAAZAAAApCUAACQAAACDJQAAIQAAAG0CAAAJAAAAciUAABEAAACDJQAAIQAAAAwCAAAZAAAAciUAABEAAACDJQAAIQAAAMoCAAAJAAAAGQAAAAQAAAAEAAAAAgAAABMAAAAUAAAA7CUAAC4AAAA3AAAADQAAAAQAAAAaAAAAAAAAABsAAAC1JgAALQAAAOImAAAMAAAA7iYAAAEAAACIJgAALQAAABUAAAAFAAAAWSYAAC8AAADBAAAACQAAABcnAAArAAAAQicAAB8AAABPAQAAFQAAABwAAAAMAAAABAAAAAMAAAAVAAAAFgAAAKknAAAuAAAALgAAABoAAAAkKAAAJQAAAFoAAAAJAAAAjygAACIAAAA+AwAACgAAAGsoAAAkAAAAkwQAABQAAADKKAAAFQAAAN8oAAABAAAAHQAAAAQAAAAEAAAABAAAABcAAAAYAAAA4CgAACAAAAAAKQAAJQAAACEAAAAFAAAAJSkAACgAAAAAKQAAJQAAADEAAAAFAAAAUUAAAAAAAABEKgAAEQAAAFUqAAAhAAAAygIAAAkAAAA2LAAAIgAAAD4DAAAKAAAAWCwAACYAAABWAAAAHAAAAFgsAAAmAAAAWgAAABwAAAAwMDAxMDIwMzA0MDUwNjA3MDgwOTEwMTExMjEzMTQxNTE2MTcxODE5MjAyMTIyMjMyNDI1MjYyNzI4MjkzMDMxMzIzMzM0MzUzNjM3MzgzOTQwNDE0MjQzNDQ0NTQ2NDc0ODQ5NTA1MTUyNTM1NDU1NTY1NzU4NTk2MDYxNjI2MzY0NjU2NjY3Njg2OTcwNzE3MjczNzQ3NTc2Nzc3ODc5ODA4MTgyODM4NDg1ODY4Nzg4ODk5MDkxOTI5Mzk0OTU5Njk3OTg5OR4AAAAMAAAABAAAAAUAAAAZAAAAGgAAAIAsAAAgAAAAPAQAABEAAACgLAAAKwAAAMssAAAfAAAATwEAABUAAACALAAAIAAAADAEAAAoAAAADy4AAAsAAAC7LgAAFgAAAE4uAAABAAAAAQAAAAAAAAAgAAAAAAAAAAMAAAAAAAAAAwAAAAAAAAADAAAAAQAAAAEAAAAgAAAAAAAAAAMAAAAAAAAAAwAAAAAAAAADAAAAAQAAAAIAAAAgAAAAAAAAAAMAAAAAAAAAAwAAAAAAAAADAAAA7y0AACAAAACpCAAACQAAAJkuAAAOAAAApy4AAAQAAACrLgAAEAAAAE4uAAABAAAAAQAAAAAAAAAgAAAAAAAAAAMAAAAAAAAAAwAAAAAAAAADAAAAAQAAAAEAAAAgAAAAAAAAAAMAAAAAAAAAAwAAAAAAAAADAAAAAQAAAAIAAAAgAAAAAAAAAAMAAAAAAAAAAwAAAAAAAAADAAAAAQAAAAMAAAAgAAAAAAAAAAMAAAAAAAAAAwAAAAAAAAADAAAA7y0AACAAAACtCAAABQAAAE8uAAArAAAAei4AAB8AAABPAQAAFQAAAA8uAAALAAAAGi4AACYAAABALgAACAAAAEguAAAGAAAATi4AAAEAAAABAAAAAAAAACAAAAAAAAAAAwAAAAAAAAADAAAAAAAAAAMAAAABAAAAAQAAACAAAAAAAAAAAwAAAAAAAAADAAAAAAAAAAMAAAABAAAAAgAAACAAAAAAAAAAAwAAAAAAAAADAAAAAAAAAAMAAAABAAAAAwAAACAAAAAAAAAAAwAAAAAAAAADAAAAAAAAAAMAAAABAAAABAAAACAAAAAAAAAAAwAAAAAAAAADAAAAAAAAAAMAAADvLQAAIAAAALoIAAAFAAAAHwAAAAQAAAAEAAAAGwAAACAAAAAEAAAABAAAABwAAADuLgAAIgAAAD4DAAAKAAAABA4AAAEAAAAhAAAABAAAAAQAAAAGAAAAHQAAAB4AAABRQAAAAAAAAPwNAAABAAAAIC8AAAIAAABRQAAAAAAAACIvAAACAAAAJC8AACAAAABELwAAEgAAAFFAAAAAAAAAAQAAAAAAAAAgAAAAAAAAAAMAAAAAAAAAAwAAAAAAAAADAAAAVi8AAB8AAAB7AwAABQAAACIAAAAEAAAABAAAAB8AAAAjAAAABAAAAAQAAAAgAAAAAQAAAAAAAAAgAAAAAAAAAAMAAAAAAAAAAwAAAAAAAAADAAAAAQAAAAEAAAAgAAAAAAAAAAMAAAAAAAAAAwAAAAAAAAADAAAAsC8AAAYAAAC2LwAAIgAAANgvAAAiAAAA7gIAAAUAAAD6LwAAFgAAABAwAAANAAAA2C8AACIAAAD0AgAABQAAAD41AAArAAAAaTUAAB8AAABPAQAAFQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHAAAACAAAAFlAAAAABAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAK/////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJBYAAGNhcGFjaXR5IG92ZXJmbG93L2NoZWNrb3V0L3NyYy9saWJhbGxvYy9yYXdfdmVjLnJzaW52YWxpZCBsYXlvdXQgZm9yIGFsbG9jX2FycmF5OiAvY2hlY2tvdXQvc3JjL2xpYmNvcmUvcmVzdWx0LnJzY2FsbGVkIGBSZXN1bHQ6OnVud3JhcCgpYCBvbiBhbiBgRXJyYCB2YWx1ZXJlYWRpbmcgZnJvbSB6ZXJvLWV4dGVuZGVkIG1lbW9yeSBjYW5ub3QgZmFpbDsgcWVkQ2Fubm90IGZhaWwgc2luY2UgMC4uMzIgaXMgMzItYnl0ZSBsZW5ndGhDYW5ub3QgZmFpbCBzaW5jZSAzMi4uNjQgaXMgMzItYnl0ZSBsZW5ndGhJbnZhbGlkIHBvaW50IHggY29vcmRpbmF0ZUludmFsaWQgcG9pbnQgeSBjb29yZGluYXRlSW52YWxpZCBjdXJ2ZSBwb2ludGNhbGxlZCBgT3B0aW9uOjp1bndyYXAoKWAgb24gYSBgTm9uZWAgdmFsdWUvY2hlY2tvdXQvc3JjL2xpYmNvcmUvb3B0aW9uLnJzSW52YWxpZFNsaWNlTGVuZ3RoTm90TWVtYmVyY2FsbGVkIGBPcHRpb246OnVud3JhcCgpYCBvbiBhIGBOb25lYCB2YWx1ZS9jaGVja291dC9zcmMvbGliY29yZS9vcHRpb24ucnNtaWxsZXIgbG9vcCBjYW5ub3QgcHJvZHVjZSB6ZXJvL2NoZWNrb3V0L3NyYy9saWJhbGxvYy92ZWMucnNjYXBhY2l0eSBvdmVyZmxvdy9jaGVja291dC9zcmMvbGliYWxsb2MvcmF3X3ZlYy5yc25vdCB5ZXQgaW1wbGVtZW50ZWQvaG9tZS9odWdvLy5jYXJnby9naXQvY2hlY2tvdXRzL2JuLTgwMTNiNDgxODM5NWRjZmIvNjI0YzYwYi9zcmMvZmllbGRzL2ZxNi5yc2NhbGxlZCBgT3B0aW9uOjp1bndyYXAoKWAgb24gYSBgTm9uZWAgdmFsdWUvY2hlY2tvdXQvc3JjL2xpYmNvcmUvb3B0aW9uLnJzaW52YWxpZCBsYXlvdXQgZm9yIGFsbG9jX2FycmF5SW52YWxpZCBjaGFyYWN0ZXIgJycgYXQgcG9zaXRpb24gSW52YWxpZCBpbnB1dCBsZW5ndGhjYWxsZWQgYE9wdGlvbjo6dW53cmFwKClgIG9uIGEgYE5vbmVgIHZhbHVlL2NoZWNrb3V0L3NyYy9saWJjb3JlL29wdGlvbi5yc2NhcGFjaXR5IG92ZXJmbG93L2NoZWNrb3V0L3NyYy9saWJhbGxvYy9yYXdfdmVjLnJzaW52YWxpZCBsYXlvdXQgZm9yIGFsbG9jX2FycmF5Y2FsbGVkIGBPcHRpb246OnVud3JhcCgpYCBvbiBhIGBOb25lYCB2YWx1ZS9jaGVja291dC9zcmMvbGliY29yZS9vcHRpb24ucnNmYXRhbCBydW50aW1lIGVycm9yOiBtYWludW5leHBlY3RlZCByZXR1cm4gdmFsdWUgd2hpbGUgdW53aW5kaW5nOiBfX3J1c3RfYmVnaW5fc2hvcnRfYmFja3RyYWNlL2NoZWNrb3V0L3NyYy9saWJjb3JlL3N0ci9wYXR0ZXJuLnJzL2NoZWNrb3V0L3NyYy9saWJjb3JlL3NsaWNlL21vZC5yc1Vud2luZEVycm9yY2FsbGVkIGBSZXN1bHQ6OnVud3JhcCgpYCBvbiBhbiBgRXJyYCB2YWx1ZWZhaWxlZCB0byBpbml0aWF0ZSBwYW5pYywgZXJyb3IgL2NoZWNrb3V0L3NyYy9saWJzdGQvc3lzL3VuaXgvb3MucnNzdHJlcnJvcl9yIGZhaWx1cmVyd2xvY2sgbWF4aW11bSByZWFkZXIgY291bnQgZXhjZWVkZWRyd2xvY2sgcmVhZCBsb2NrIHdvdWxkIHJlc3VsdCBpbiBkZWFkbG9ja3RocmVhZCBwYW5pY2tlZCB3aGlsZSBwYW5pY2tpbmcuIGFib3J0aW5nLgpCb3g8QW55Pjx1bm5hbWVkPgFub3RlOiBSdW4gd2l0aCBgUlVTVF9CQUNLVFJBQ0U9MWAgZm9yIGEgYmFja3RyYWNlLgp0aHJlYWQgJycgcGFuaWNrZWQgYXQgJycsIDoKdGhyZWFkIHBhbmlja2VkIHdoaWxlIHByb2Nlc3NpbmcgcGFuaWMuIGFib3J0aW5nLgovY2hlY2tvdXQvc3JjL2xpYnN0ZC9zeXMvdW5peC9yd2xvY2sucnM6IC9jaGVja291dC9zcmMvbGliY29yZS9yZXN1bHQucnMvY2hlY2tvdXQvc3JjL2xpYnN0ZC9zeW5jL2NvbmR2YXIucnNhdHRlbXB0ZWQgdG8gdXNlIGEgY29uZGl0aW9uIHZhcmlhYmxlIHdpdGggdHdvIG11dGV4ZXNpbnZhbGlkIGxheW91dCBmb3IgYWxsb2NfYXJyYXlkYXRhIHByb3ZpZGVkIGNvbnRhaW5zIGEgbnVsIGJ5dGVhc3NlcnRpb24gZmFpbGVkOiBgKGxlZnQgPT0gcmlnaHQpYAogIGxlZnQ6IGBgLAogcmlnaHQ6IGBgL2NoZWNrb3V0L3NyYy9saWJzdGQvc3lzL3VuaXgvY29uZHZhci5yc0Vycm9ycmVwck9zY29kZW1lc3NhZ2VLaW5kQ3VzdG9ta2luZGVycm9yTm90Rm91bmRQZXJtaXNzaW9uRGVuaWVkQ29ubmVjdGlvblJlZnVzZWRDb25uZWN0aW9uUmVzZXRDb25uZWN0aW9uQWJvcnRlZE5vdENvbm5lY3RlZEFkZHJJblVzZUFkZHJOb3RBdmFpbGFibGVCcm9rZW5QaXBlQWxyZWFkeUV4aXN0c1dvdWxkQmxvY2tJbnZhbGlkSW5wdXRJbnZhbGlkRGF0YVRpbWVkT3V0V3JpdGVaZXJvSW50ZXJydXB0ZWRPdGhlclVuZXhwZWN0ZWRFb2ZfX05vbmV4aGF1c3RpdmVpbnRlcm5hbCBlcnJvcjogZW50ZXJlZCB1bnJlYWNoYWJsZSBjb2RlZW50aXR5IG5vdCBmb3VuZGNvbm5lY3Rpb24gcmVmdXNlZGNvbm5lY3Rpb24gcmVzZXRjb25uZWN0aW9uIGFib3J0ZWRub3QgY29ubmVjdGVkYWRkcmVzcyBpbiB1c2VhZGRyZXNzIG5vdCBhdmFpbGFibGVicm9rZW4gcGlwZWVudGl0eSBhbHJlYWR5IGV4aXN0c29wZXJhdGlvbiB3b3VsZCBibG9ja2ludmFsaWQgaW5wdXQgcGFyYW1ldGVyaW52YWxpZCBkYXRhdGltZWQgb3V0d3JpdGUgemVyb29wZXJhdGlvbiBpbnRlcnJ1cHRlZG90aGVyIG9zIGVycm9ydW5leHBlY3RlZCBlbmQgb2YgZmlsZXBlcm1pc3Npb24gZGVuaWVkL2NoZWNrb3V0L3NyYy9saWJzdGQvaW8vZXJyb3IucnMgKG9zIGVycm9yIFx4TnVsRXJyb3JjYWxsZWQgYE9wdGlvbjo6dW53cmFwKClgIG9uIGEgYE5vbmVgIHZhbHVlL2NoZWNrb3V0L3NyYy9saWJjb3JlL29wdGlvbi5yc2Fzc2VydGlvbiBmYWlsZWQ6IGAobGVmdCA9PSByaWdodClgCiAgbGVmdDogYGAsCiByaWdodDogYGAvY2hlY2tvdXQvc3JjL2xpYnN0ZC9lbnYucnNmYWlsZWQgdG8gZ2V0IGVudmlyb25tZW50IHZhcmlhYmxlIGBgOiBPbmNlIGluc3RhbmNlIGhhcyBwcmV2aW91c2x5IGJlZW4gcG9pc29uZWRhc3NlcnRpb24gZmFpbGVkOiBzdGF0ZSAmIFNUQVRFX01BU0sgPT0gUlVOTklORy9jaGVja291dC9zcmMvbGlic3RkL3N5bmMvb25jZS5yc1N0cmluZ0Vycm9yY2FsbGVkIGBSZXN1bHQ6OnVud3JhcCgpYCBvbiBhbiBgRXJyYCB2YWx1ZXVzZSBvZiBzdGQ6OnRocmVhZDo6Y3VycmVudCgpIGlzIG5vdCBwb3NzaWJsZSBhZnRlciB0aGUgdGhyZWFkJ3MgbG9jYWwgZGF0YSBoYXMgYmVlbiBkZXN0cm95ZWQvY2hlY2tvdXQvc3JjL2xpYnN0ZC90aHJlYWQvbW9kLnJzaW5jb25zaXN0ZW50IHN0YXRlIGluIHVucGFyay9jaGVja291dC9zcmMvbGlic3RkL3N5c19jb21tb24vYmFja3RyYWNlLnJzaW50ZXJuYWwgZXJyb3I6IGVudGVyZWQgdW5yZWFjaGFibGUgY29kZVJVU1RfQkFDS1RSQUNFMGZ1bGxjYWxsZWQgYE9wdGlvbjo6dW53cmFwKClgIG9uIGEgYE5vbmVgIHZhbHVlL2NoZWNrb3V0L3NyYy9saWJjb3JlL29wdGlvbi5yc2luY29uc2lzdGVudCBwYXJrIHN0YXRldGhyZWFkIG5hbWUgbWF5IG5vdCBjb250YWluIGludGVyaW9yIG51bGwgYnl0ZXNmYWlsZWQgdG8gZ2VuZXJhdGUgdW5pcXVlIHRocmVhZCBJRDogYml0c3BhY2UgZXhoYXVzdGVkc3RhY2sgYmFja3RyYWNlOgpub3RlOiBTb21lIGRldGFpbHMgYXJlIG9taXR0ZWQsIHJ1biB3aXRoIGBSVVNUX0JBQ0tUUkFDRT1mdWxsYCBmb3IgYSB2ZXJib3NlIGJhY2t0cmFjZS4KLmxsdm0uRV9aTlpOMTdoXyQkJFNQJCRCUCQkUkYkJExUJCRHVCQkTFAkJFJQJCRDJCR1N2UkJHUyMCQkdTI3JCR1NWIkJHU1ZCQkdTdiJCR1N2QkJHUzYiQkdTJiJCR1MjIkL2NoZWNrb3V0L3NyYy9saWJjb3JlL3N0ci9wYXR0ZXJuLnJzL2NoZWNrb3V0L3NyYy9saWJjb3JlL3NsaWNlL21vZC5ycyAgOiAgLSBjYXBhY2l0eSBvdmVyZmxvdy9jaGVja291dC9zcmMvbGliYWxsb2MvcmF3X3ZlYy5yc1RyaWVkIHRvIHNocmluayB0byBhIGxhcmdlciBjYXBhY2l0eWNhbm5vdCBjaGFuZ2UgYWxpZ25tZW50IG9uIGByZWFsbG9jYC9jaGVja291dC9zcmMvbGlic3RkL3N5c19jb21tb24vYXRfZXhpdF9pbXAucnNhc3NlcnRpb24gZmFpbGVkOiBxdWV1ZSBhcyB1c2l6ZSAhPSAxYXNzZXJ0aW9uIGZhaWxlZDoga2V5ICE9IDAvY2hlY2tvdXQvc3JjL2xpYnN0ZC9zeXNfY29tbW9uL3RocmVhZF9sb2NhbC5ycy9jaGVja291dC9zcmMvbGlic3RkL3N5cy91bml4L3RocmVhZF9sb2NhbC5yc2Fzc2VydGlvbiBmYWlsZWQ6IGAobGVmdCA9PSByaWdodClgCiAgbGVmdDogYGAsCiByaWdodDogYGBhbHJlYWR5IGJvcnJvd2VkYWxyZWFkeSBtdXRhYmx5IGJvcnJvd2VkY2FsbGVkIGBPcHRpb246OnVud3JhcCgpYCBvbiBhIGBOb25lYCB2YWx1ZS9jaGVja291dC9zcmMvbGliY29yZS9vcHRpb24ucnNjYW5ub3QgYWNjZXNzIGEgVExTIHZhbHVlIGR1cmluZyBvciBhZnRlciBpdCBpcyBkZXN0cm95ZWRmb3JtYXR0ZXIgZXJyb3IvY2hlY2tvdXQvc3JjL2xpYnN0ZC9zeXNfY29tbW9uL3RocmVhZF9pbmZvLnJzYXNzZXJ0aW9uIGZhaWxlZDogYy5ib3Jyb3coKS5pc19ub25lKClBY2Nlc3NFcnJvcmZhaWxlZCB0byB3cml0ZSB3aG9sZSBidWZmZXIvY2hlY2tvdXQvc3JjL2xpYnN0ZC9zeXMvdW5peC9hcmdzLnJzYXNzZXJ0aW9uIGZhaWxlZDogKCpwdHIpLmlzX25vbmUoKS9jaGVja291dC9zcmMvbGliY29yZS9zdHIvcGF0dGVybi5ycy9jaGVja291dC9zcmMvbGliY29yZS9zbGljZS9tb2QucnNQb2lzb25FcnJvciB7IGlubmVyOiAuLiB9ZmF0YWwgcnVudGltZSBlcnJvcjogCmFzc2VydGlvbiBmYWlsZWQ6ICFwdHIuaXNfbnVsbCgpL2NoZWNrb3V0L3NyYy9saWJwYW5pY191bndpbmQvZW1jYy5yc2ludGVybmFsIGVycm9yOiBlbnRlcmVkIHVucmVhY2hhYmxlIGNvZGVfVVJDX05PX1JFQVNPTl9VUkNfRk9SRUlHTl9FWENFUFRJT05fQ0FVR0hUX1VSQ19GQVRBTF9QSEFTRTJfRVJST1JfVVJDX0ZBVEFMX1BIQVNFMV9FUlJPUl9VUkNfTk9STUFMX1NUT1BfVVJDX0VORF9PRl9TVEFDS19VUkNfSEFORExFUl9GT1VORF9VUkNfSU5TVEFMTF9DT05URVhUX1VSQ19DT05USU5VRV9VTldJTkRfVVJDX0ZBSUxVUkVhbGxvY2F0b3IgbWVtb3J5IGV4aGF1c3RlZHVuc3VwcG9ydGVkIGFsbG9jYXRvciByZXF1ZXN0Y2FwYWNpdHkgb3ZlcmZsb3cvY2hlY2tvdXQvc3JjL2xpYmFsbG9jL3Jhd192ZWMucnMAAAAAAAEAAAAAAAAAAgADAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUABgcAAAgAAAAGAAAAAAAIAAgAAAAAAAgACQYAAAAAAAAEAAAAAAAAAAAAAAAAAAgAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKCwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAL2NoZWNrb3V0L3NyYy9saWJjb3JlL3NsaWNlL21vZC5ycy9jaGVja291dC9zcmMvbGlic3RkX3VuaWNvZGUvdGFibGVzLnJzMHgvY2hlY2tvdXQvc3JjL2xpYmNvcmUvZm10L21vZC5yc2NhbGxlZCBgT3B0aW9uOjp1bndyYXAoKWAgb24gYSBgTm9uZWAgdmFsdWUvY2hlY2tvdXQvc3JjL2xpYmNvcmUvb3B0aW9uLnJzAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDAwMDAwMDAwMDAwMDAwMDBAQEBAQAAAAAAAAAAAAAAFsuLi5dL2NoZWNrb3V0L3NyYy9saWJjb3JlL3N0ci9tb2QucnNieXRlIGluZGV4ICBpcyBub3QgYSBjaGFyIGJvdW5kYXJ5OyBpdCBpcyBpbnNpZGUgIChieXRlcyApIG9mIGBgY2FsbGVkIGBPcHRpb246OnVud3JhcCgpYCBvbiBhIGBOb25lYCB2YWx1ZS9jaGVja291dC9zcmMvbGliY29yZS9vcHRpb24ucnNiZWdpbiA8PSBlbmQgKCA8PSApIHdoZW4gc2xpY2luZyBgIGlzIG91dCBvZiBib3VuZHMgb2YgYFV0ZjhFcnJvcnZhbGlkX3VwX3RvZXJyb3JfbGVuL2NoZWNrb3V0L3NyYy9saWJjb3JlL3NsaWNlL21vZC5ycyAgICAKCn0gfSksCiwgIHs6IC4uaW5kZXggb3V0IG9mIGJvdW5kczogdGhlIGxlbiBpcyAgYnV0IHRoZSBpbmRleCBpcyAvY2hlY2tvdXQvc3JjL2xpYmNvcmUvb3B0aW9uLnJzTm9uZVNvbWVQYXJzZUludEVycm9ya2luZEVtcHR5SW52YWxpZERpZ2l0T3ZlcmZsb3dVbmRlcmZsb3dpbmRleCAgb3V0IG9mIHJhbmdlIGZvciBzbGljZSBvZiBsZW5ndGggL2NoZWNrb3V0L3NyYy9saWJjb3JlL3NsaWNlL21vZC5yc3NsaWNlIGluZGV4IHN0YXJ0cyBhdCAgYnV0IGVuZHMgYXQgAAEDBQUIBgMHBAgICRAKGwsZDBYNEg4WDwQQAxISEwkWARcFGAIZAxoHHQEfFiADKwUsAi0LLgEwAzEDMgKnAagCqQKqBKsI+gL7Bf0E/gP/Ca14eYuNojBXWGCIi4yQHB3dDg9LTC4vP1xdX7XihI2OkZKpsbq7xcbJyt7k5QQREikxNDc6Oz1JSl2EjpKpsbS6u8bKzs/k5QAEDQ4REikxNDo7RUZJSl5kZYSRm53Jzs8EDREpRUlXZGWEjZGptLq7xcnf5OXwBA0RRUlkZYCBhLK8vr/V1/Dxg4WGiYuMmKCkpqiprLq+v8XHzs/a20iYvc3Gzs9JTk9XWV5fiY6Psba3v8HGx9cRFhdbXPb3/v+ADW1x3t8ODx9ubxwdX31+rq/6FhceH0ZHTk9YWlxefn+1xdTV3PDx9XJzj3R1lpfJL18mLi+nr7e/x8/X35pAl5gvMI8f/6/+/87/Tk9aWwcIDxAnL+7vbm83PT9CRZCR/v9TZ3XIydDR2Nnn/v8AIF8igt8EgkQIGwUFEYGsDjsFazUeFoDfAxkIAQQiAwoENAQHAwEHBgcQC1APEgdVCAIEHAoJAwgDBwMCAwMDDAQFAwsGAQ4VBToDEQcGBRAIVgcCBxUNUARDAy0DAQQRBg8MOgQdJQ0GTCBtBGolgMgFgrADGgaC/QNZBxULFwkUDBQMagYKBhoGWAgrBUYKLAQMBAEDMQssBBoGCwOArAYKBh9BTAQtA3QIPAMPAzw3CAgqBoL/ERgILxEtAyAQIQ+AjASClxkLFYdaAxYZBBCA9AUvBTsHAg4YCYCqNnQMgNYaDAWA/wWAtgUkDJvGCtIrFYSNAzcJgVwUgLgIgLg/NQQKBjgIRggMBnQLHgNaBFkJgIMYHAoWCUYKgIoGq6QMFwQxoQSB2iYHDAUFgKURgW0QeCgqBkwEgI0EgL4DGwMPDQAGAQEDAQQCCAgJAgoDCwIQAREEEgUTEhQCFQIaAxwFHQQkAWoDawK8AtEC1AzVCdYC1wLaAeAF6ALuIPAE8QH5AQwnOz5OT4+enp8GBwk2PT5W89DRBBQYVle9Nc7P4BKHiY6eBA0OERIpMTQ6O0VGSUpOT2RlWly2t4SFnQk3kJGoBwo7Pm9f7u9aYpqbJyhVnaCho6SnqK26vMQGCwwVHTo/RVGmp8zNoAcZGiIlxcYEICMlJigzODpISkxQU1VWWFpcXmBjZWZrc3h9f4qkqq+wwNAvP14iewUDBC0DZQQBLy6Agh0DMQ8cBCQJHgUrBUQEDiqAqgYkBCQEKAg0CwGAkIE3CRYKCICYOQNjCAkwFgUhAxsFAUA4BEsFKAQDBAkICQdAICcEDAk2AzoFGgcEDAdQSTczDTMHBoFgH4GBTgQeD0MOGQcKBkQMJwl1Cz9BKgY7BQoGUQYBBRADBYCLXiJICAqApl4iRQsKBg0TOAgKNhoDDwQQgWBTDAGBAEgIUx05gQdGCh0DR0k3Aw4ICoKmg5pmdQuAxIq8hC+P0YJHobmCOQcqBAJgJgpGCigFE4NwRQsvEBFAAh6X7ROC86UNgR9RgYyJBGsFDQMJBxCTYID2CnMIbhdGgLpXCRKAjoFHA4VCDxWFUCuH1YDXKUsFCgQChKA8BgEEVQUbNAKBDiwEZAxWCg0DXAQ9OR0NLAQJBwIOBoCag9ULDQMJB3QMVSsMBDgICgYoCB5SDAQ9AxwUGCgBDxeGGUJvcnJvd0Vycm9yQm9ycm93TXV0RXJyb3JjYWxsZWQgYE9wdGlvbjo6dW53cmFwKClgIG9uIGEgYE5vbmVgIHZhbHVlL2NoZWNrb3V0L3NyYy9saWJjb3JlL29wdGlvbi5yc1QhIhkNAQIDEUscDBAECx0SHidobm9wcWIgBQYPExQVGggWBygkFxgJCg4bHyUjg4J9JiorPD0+P0NHSk1YWVpbXF1eX2BhY2RlZmdpamtscnN0eXp7fABJbGxlZ2FsIGJ5dGUgc2VxdWVuY2UARG9tYWluIGVycm9yAFJlc3VsdCBub3QgcmVwcmVzZW50YWJsZQBOb3QgYSB0dHkAUGVybWlzc2lvbiBkZW5pZWQAT3BlcmF0aW9uIG5vdCBwZXJtaXR0ZWQATm8gc3VjaCBmaWxlIG9yIGRpcmVjdG9yeQBObyBzdWNoIHByb2Nlc3MARmlsZSBleGlzdHMAVmFsdWUgdG9vIGxhcmdlIGZvciBkYXRhIHR5cGUATm8gc3BhY2UgbGVmdCBvbiBkZXZpY2UAT3V0IG9mIG1lbW9yeQBSZXNvdXJjZSBidXN5AEludGVycnVwdGVkIHN5c3RlbSBjYWxsAFJlc291cmNlIHRlbXBvcmFyaWx5IHVuYXZhaWxhYmxlAEludmFsaWQgc2VlawBDcm9zcy1kZXZpY2UgbGluawBSZWFkLW9ubHkgZmlsZSBzeXN0ZW0ARGlyZWN0b3J5IG5vdCBlbXB0eQBDb25uZWN0aW9uIHJlc2V0IGJ5IHBlZXIAT3BlcmF0aW9uIHRpbWVkIG91dABDb25uZWN0aW9uIHJlZnVzZWQASG9zdCBpcyBkb3duAEhvc3QgaXMgdW5yZWFjaGFibGUAQWRkcmVzcyBpbiB1c2UAQnJva2VuIHBpcGUASS9PIGVycm9yAE5vIHN1Y2ggZGV2aWNlIG9yIGFkZHJlc3MAQmxvY2sgZGV2aWNlIHJlcXVpcmVkAE5vIHN1Y2ggZGV2aWNlAE5vdCBhIGRpcmVjdG9yeQBJcyBhIGRpcmVjdG9yeQBUZXh0IGZpbGUgYnVzeQBFeGVjIGZvcm1hdCBlcnJvcgBJbnZhbGlkIGFyZ3VtZW50AEFyZ3VtZW50IGxpc3QgdG9vIGxvbmcAU3ltYm9saWMgbGluayBsb29wAEZpbGVuYW1lIHRvbyBsb25nAFRvbyBtYW55IG9wZW4gZmlsZXMgaW4gc3lzdGVtAE5vIGZpbGUgZGVzY3JpcHRvcnMgYXZhaWxhYmxlAEJhZCBmaWxlIGRlc2NyaXB0b3IATm8gY2hpbGQgcHJvY2VzcwBCYWQgYWRkcmVzcwBGaWxlIHRvbyBsYXJnZQBUb28gbWFueSBsaW5rcwBObyBsb2NrcyBhdmFpbGFibGUAUmVzb3VyY2UgZGVhZGxvY2sgd291bGQgb2NjdXIAU3RhdGUgbm90IHJlY292ZXJhYmxlAFByZXZpb3VzIG93bmVyIGRpZWQAT3BlcmF0aW9uIGNhbmNlbGVkAEZ1bmN0aW9uIG5vdCBpbXBsZW1lbnRlZABObyBtZXNzYWdlIG9mIGRlc2lyZWQgdHlwZQBJZGVudGlmaWVyIHJlbW92ZWQARGV2aWNlIG5vdCBhIHN0cmVhbQBObyBkYXRhIGF2YWlsYWJsZQBEZXZpY2UgdGltZW91dABPdXQgb2Ygc3RyZWFtcyByZXNvdXJjZXMATGluayBoYXMgYmVlbiBzZXZlcmVkAFByb3RvY29sIGVycm9yAEJhZCBtZXNzYWdlAEZpbGUgZGVzY3JpcHRvciBpbiBiYWQgc3RhdGUATm90IGEgc29ja2V0AERlc3RpbmF0aW9uIGFkZHJlc3MgcmVxdWlyZWQATWVzc2FnZSB0b28gbGFyZ2UAUHJvdG9jb2wgd3JvbmcgdHlwZSBmb3Igc29ja2V0AFByb3RvY29sIG5vdCBhdmFpbGFibGUAUHJvdG9jb2wgbm90IHN1cHBvcnRlZABTb2NrZXQgdHlwZSBub3Qgc3VwcG9ydGVkAE5vdCBzdXBwb3J0ZWQAUHJvdG9jb2wgZmFtaWx5IG5vdCBzdXBwb3J0ZWQAQWRkcmVzcyBmYW1pbHkgbm90IHN1cHBvcnRlZCBieSBwcm90b2NvbABBZGRyZXNzIG5vdCBhdmFpbGFibGUATmV0d29yayBpcyBkb3duAE5ldHdvcmsgdW5yZWFjaGFibGUAQ29ubmVjdGlvbiByZXNldCBieSBuZXR3b3JrAENvbm5lY3Rpb24gYWJvcnRlZABObyBidWZmZXIgc3BhY2UgYXZhaWxhYmxlAFNvY2tldCBpcyBjb25uZWN0ZWQAU29ja2V0IG5vdCBjb25uZWN0ZWQAQ2Fubm90IHNlbmQgYWZ0ZXIgc29ja2V0IHNodXRkb3duAE9wZXJhdGlvbiBhbHJlYWR5IGluIHByb2dyZXNzAE9wZXJhdGlvbiBpbiBwcm9ncmVzcwBTdGFsZSBmaWxlIGhhbmRsZQBSZW1vdGUgSS9PIGVycm9yAFF1b3RhIGV4Y2VlZGVkAE5vIG1lZGl1bSBmb3VuZABXcm9uZyBtZWRpdW0gdHlwZQBObyBlcnJvciBpbmZvcm1hdGlvbg==";var tempDoublePtr=STATICTOP;STATICTOP+=16;function __ZSt18uncaught_exceptionv(){return !!__ZSt18uncaught_exceptionv.uncaught_exception}var EXCEPTIONS={last:0,caught:[],infos:{},deAdjust:(function(adjusted){if(!adjusted||EXCEPTIONS.infos[adjusted])return adjusted;for(var ptr in EXCEPTIONS.infos){var info=EXCEPTIONS.infos[ptr];if(info.adjusted===adjusted){return ptr}}return adjusted}),addRef:(function(ptr){if(!ptr)return;var info=EXCEPTIONS.infos[ptr];info.refcount++;}),decRef:(function(ptr){if(!ptr)return;var info=EXCEPTIONS.infos[ptr];assert(info.refcount>0);info.refcount--;if(info.refcount===0&&!info.rethrown){if(info.destructor){Module["dynCall_vi"](info.destructor,ptr);}delete EXCEPTIONS.infos[ptr];___cxa_free_exception(ptr);}}),clearRef:(function(ptr){if(!ptr)return;var info=EXCEPTIONS.infos[ptr];info.refcount=0;})};function ___resumeException(ptr){if(!EXCEPTIONS.last){EXCEPTIONS.last=ptr;}throw ptr}function ___cxa_find_matching_catch(){var thrown=EXCEPTIONS.last;if(!thrown){return (Runtime.setTempRet0(0),0)|0}var info=EXCEPTIONS.infos[thrown];var throwntype=info.type;if(!throwntype){return (Runtime.setTempRet0(0),thrown)|0}var typeArray=Array.prototype.slice.call(arguments);var pointer=Module["___cxa_is_pointer_type"](throwntype);if(!___cxa_find_matching_catch.buffer)___cxa_find_matching_catch.buffer=_malloc(4);HEAP32[___cxa_find_matching_catch.buffer>>2]=thrown;thrown=___cxa_find_matching_catch.buffer;for(var i=0;i<typeArray.length;i++){if(typeArray[i]&&Module["___cxa_can_catch"](typeArray[i],throwntype,thrown)){thrown=HEAP32[thrown>>2];info.adjusted=thrown;return (Runtime.setTempRet0(typeArray[i]),thrown)|0}}thrown=HEAP32[thrown>>2];return (Runtime.setTempRet0(throwntype),thrown)|0}function ___cxa_throw(ptr,type,destructor){EXCEPTIONS.infos[ptr]={ptr:ptr,adjusted:ptr,type:type,destructor:destructor,refcount:0,caught:false,rethrown:false};EXCEPTIONS.last=ptr;if(!("uncaught_exception"in __ZSt18uncaught_exceptionv)){__ZSt18uncaught_exceptionv.uncaught_exception=1;}else {__ZSt18uncaught_exceptionv.uncaught_exception++;}throw ptr}function __Unwind_FindEnclosingFunction(){return 0}function _emscripten_set_main_loop_timing(mode,value){Browser.mainLoop.timingMode=mode;Browser.mainLoop.timingValue=value;if(!Browser.mainLoop.func){return 1}if(mode==0){Browser.mainLoop.scheduler=function Browser_mainLoop_scheduler_setTimeout(){var timeUntilNextTick=Math.max(0,Browser.mainLoop.tickStartTime+value-_emscripten_get_now())|0;setTimeout(Browser.mainLoop.runner,timeUntilNextTick);};Browser.mainLoop.method="timeout";}else if(mode==1){Browser.mainLoop.scheduler=function Browser_mainLoop_scheduler_rAF(){Browser.requestAnimationFrame(Browser.mainLoop.runner);};Browser.mainLoop.method="rAF";}else if(mode==2){if(!window["setImmediate"]){var setImmediates=[];var emscriptenMainLoopMessageId="setimmediate";function Browser_setImmediate_messageHandler(event){if(event.source===window&&event.data===emscriptenMainLoopMessageId){event.stopPropagation();setImmediates.shift()();}}window.addEventListener("message",Browser_setImmediate_messageHandler,true);window["setImmediate"]=function Browser_emulated_setImmediate(func){setImmediates.push(func);if(ENVIRONMENT_IS_WORKER){if(Module["setImmediates"]===undefined)Module["setImmediates"]=[];Module["setImmediates"].push(func);window.postMessage({target:emscriptenMainLoopMessageId});}else window.postMessage(emscriptenMainLoopMessageId,"*");};}Browser.mainLoop.scheduler=function Browser_mainLoop_scheduler_setImmediate(){window["setImmediate"](Browser.mainLoop.runner);};Browser.mainLoop.method="immediate";}return 0}function _emscripten_get_now(){abort();}function _emscripten_set_main_loop(func,fps,simulateInfiniteLoop,arg,noSetTiming){Module["noExitRuntime"]=true;assert(!Browser.mainLoop.func,"emscripten_set_main_loop: there can only be one main loop function at once: call emscripten_cancel_main_loop to cancel the previous one before setting a new one with different parameters.");Browser.mainLoop.func=func;Browser.mainLoop.arg=arg;var browserIterationFunc;if(typeof arg!=="undefined"){browserIterationFunc=(function(){Module["dynCall_vi"](func,arg);});}else {browserIterationFunc=(function(){Module["dynCall_v"](func);});}var thisMainLoopId=Browser.mainLoop.currentlyRunningMainloop;Browser.mainLoop.runner=function Browser_mainLoop_runner(){if(ABORT)return;if(Browser.mainLoop.queue.length>0){var start=Date.now();var blocker=Browser.mainLoop.queue.shift();blocker.func(blocker.arg);if(Browser.mainLoop.remainingBlockers){var remaining=Browser.mainLoop.remainingBlockers;var next=remaining%1==0?remaining-1:Math.floor(remaining);if(blocker.counted){Browser.mainLoop.remainingBlockers=next;}else {next=next+.5;Browser.mainLoop.remainingBlockers=(8*remaining+next)/9;}}console.log('main loop blocker "'+blocker.name+'" took '+(Date.now()-start)+" ms");Browser.mainLoop.updateStatus();if(thisMainLoopId<Browser.mainLoop.currentlyRunningMainloop)return;setTimeout(Browser.mainLoop.runner,0);return}if(thisMainLoopId<Browser.mainLoop.currentlyRunningMainloop)return;Browser.mainLoop.currentFrameNumber=Browser.mainLoop.currentFrameNumber+1|0;if(Browser.mainLoop.timingMode==1&&Browser.mainLoop.timingValue>1&&Browser.mainLoop.currentFrameNumber%Browser.mainLoop.timingValue!=0){Browser.mainLoop.scheduler();return}else if(Browser.mainLoop.timingMode==0){Browser.mainLoop.tickStartTime=_emscripten_get_now();}if(Browser.mainLoop.method==="timeout"&&Module.ctx){Module.printErr("Looks like you are rendering without using requestAnimationFrame for the main loop. You should use 0 for the frame rate in emscripten_set_main_loop in order to use requestAnimationFrame, as that can greatly improve your frame rates!");Browser.mainLoop.method="";}Browser.mainLoop.runIter(browserIterationFunc);if(thisMainLoopId<Browser.mainLoop.currentlyRunningMainloop)return;if(typeof SDL==="object"&&SDL.audio&&SDL.audio.queueNewAudioData)SDL.audio.queueNewAudioData();Browser.mainLoop.scheduler();};if(!noSetTiming){if(fps&&fps>0)_emscripten_set_main_loop_timing(0,1e3/fps);else _emscripten_set_main_loop_timing(1,1);Browser.mainLoop.scheduler();}if(simulateInfiniteLoop){throw "SimulateInfiniteLoop"}}var Browser={mainLoop:{scheduler:null,method:"",currentlyRunningMainloop:0,func:null,arg:0,timingMode:0,timingValue:0,currentFrameNumber:0,queue:[],pause:(function(){Browser.mainLoop.scheduler=null;Browser.mainLoop.currentlyRunningMainloop++;}),resume:(function(){Browser.mainLoop.currentlyRunningMainloop++;var timingMode=Browser.mainLoop.timingMode;var timingValue=Browser.mainLoop.timingValue;var func=Browser.mainLoop.func;Browser.mainLoop.func=null;_emscripten_set_main_loop(func,0,false,Browser.mainLoop.arg,true);_emscripten_set_main_loop_timing(timingMode,timingValue);Browser.mainLoop.scheduler();}),updateStatus:(function(){if(Module["setStatus"]){var message=Module["statusMessage"]||"Please wait...";var remaining=Browser.mainLoop.remainingBlockers;var expected=Browser.mainLoop.expectedBlockers;if(remaining){if(remaining<expected){Module["setStatus"](message+" ("+(expected-remaining)+"/"+expected+")");}else {Module["setStatus"](message);}}else {Module["setStatus"]("");}}}),runIter:(function(func){if(ABORT)return;if(Module["preMainLoop"]){var preRet=Module["preMainLoop"]();if(preRet===false){return}}try{func();}catch(e){if(e instanceof ExitStatus){return}else {if(e&&typeof e==="object"&&e.stack)Module.printErr("exception thrown: "+[e,e.stack]);throw e}}if(Module["postMainLoop"])Module["postMainLoop"]();})},isFullscreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:(function(){if(!Module["preloadPlugins"])Module["preloadPlugins"]=[];if(Browser.initted)return;Browser.initted=true;try{new Blob;Browser.hasBlobConstructor=true;}catch(e){Browser.hasBlobConstructor=false;console.log("warning: no blob constructor, cannot create blobs with mimetypes");}Browser.BlobBuilder=typeof MozBlobBuilder!="undefined"?MozBlobBuilder:typeof WebKitBlobBuilder!="undefined"?WebKitBlobBuilder:!Browser.hasBlobConstructor?console.log("warning: no BlobBuilder"):null;Browser.URLObject=typeof window!="undefined"?window.URL?window.URL:window.webkitURL:undefined;if(!Module.noImageDecoding&&typeof Browser.URLObject==="undefined"){console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");Module.noImageDecoding=true;}var imagePlugin={};imagePlugin["canHandle"]=function imagePlugin_canHandle(name){return !Module.noImageDecoding&&/\.(jpg|jpeg|png|bmp)$/i.test(name)};imagePlugin["handle"]=function imagePlugin_handle(byteArray,name,onload,onerror){var b=null;if(Browser.hasBlobConstructor){try{b=new Blob([byteArray],{type:Browser.getMimetype(name)});if(b.size!==byteArray.length){b=new Blob([(new Uint8Array(byteArray)).buffer],{type:Browser.getMimetype(name)});}}catch(e){Runtime.warnOnce("Blob constructor present but fails: "+e+"; falling back to blob builder");}}if(!b){var bb=new Browser.BlobBuilder;bb.append((new Uint8Array(byteArray)).buffer);b=bb.getBlob();}var url=Browser.URLObject.createObjectURL(b);var img=new Image;img.onload=function img_onload(){assert(img.complete,"Image "+name+" could not be decoded");var canvas=document.createElement("canvas");canvas.width=img.width;canvas.height=img.height;var ctx=canvas.getContext("2d");ctx.drawImage(img,0,0);Module["preloadedImages"][name]=canvas;Browser.URLObject.revokeObjectURL(url);if(onload)onload(byteArray);};img.onerror=function img_onerror(event){console.log("Image "+url+" could not be decoded");if(onerror)onerror();};img.src=url;};Module["preloadPlugins"].push(imagePlugin);var audioPlugin={};audioPlugin["canHandle"]=function audioPlugin_canHandle(name){return !Module.noAudioDecoding&&name.substr(-4)in{".ogg":1,".wav":1,".mp3":1}};audioPlugin["handle"]=function audioPlugin_handle(byteArray,name,onload,onerror){var done=false;function finish(audio){if(done)return;done=true;Module["preloadedAudios"][name]=audio;if(onload)onload(byteArray);}function fail(){if(done)return;done=true;Module["preloadedAudios"][name]=new Audio;if(onerror)onerror();}if(Browser.hasBlobConstructor){try{var b=new Blob([byteArray],{type:Browser.getMimetype(name)});}catch(e){return fail()}var url=Browser.URLObject.createObjectURL(b);var audio=new Audio;audio.addEventListener("canplaythrough",(function(){finish(audio);}),false);audio.onerror=function audio_onerror(event){if(done)return;console.log("warning: browser could not fully decode audio "+name+", trying slower base64 approach");function encode64(data){var BASE="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";var PAD="=";var ret="";var leftchar=0;var leftbits=0;for(var i=0;i<data.length;i++){leftchar=leftchar<<8|data[i];leftbits+=8;while(leftbits>=6){var curr=leftchar>>leftbits-6&63;leftbits-=6;ret+=BASE[curr];}}if(leftbits==2){ret+=BASE[(leftchar&3)<<4];ret+=PAD+PAD;}else if(leftbits==4){ret+=BASE[(leftchar&15)<<2];ret+=PAD;}return ret}audio.src="data:audio/x-"+name.substr(-3)+";base64,"+encode64(byteArray);finish(audio);};audio.src=url;Browser.safeSetTimeout((function(){finish(audio);}),1e4);}else {return fail()}};Module["preloadPlugins"].push(audioPlugin);function pointerLockChange(){Browser.pointerLock=document["pointerLockElement"]===Module["canvas"]||document["mozPointerLockElement"]===Module["canvas"]||document["webkitPointerLockElement"]===Module["canvas"]||document["msPointerLockElement"]===Module["canvas"];}var canvas=Module["canvas"];if(canvas){canvas.requestPointerLock=canvas["requestPointerLock"]||canvas["mozRequestPointerLock"]||canvas["webkitRequestPointerLock"]||canvas["msRequestPointerLock"]||(function(){});canvas.exitPointerLock=document["exitPointerLock"]||document["mozExitPointerLock"]||document["webkitExitPointerLock"]||document["msExitPointerLock"]||(function(){});canvas.exitPointerLock=canvas.exitPointerLock.bind(document);document.addEventListener("pointerlockchange",pointerLockChange,false);document.addEventListener("mozpointerlockchange",pointerLockChange,false);document.addEventListener("webkitpointerlockchange",pointerLockChange,false);document.addEventListener("mspointerlockchange",pointerLockChange,false);if(Module["elementPointerLock"]){canvas.addEventListener("click",(function(ev){if(!Browser.pointerLock&&Module["canvas"].requestPointerLock){Module["canvas"].requestPointerLock();ev.preventDefault();}}),false);}}}),createContext:(function(canvas,useWebGL,setInModule,webGLContextAttributes){if(useWebGL&&Module.ctx&&canvas==Module.canvas)return Module.ctx;var ctx;var contextHandle;if(useWebGL){var contextAttributes={antialias:false,alpha:false};if(webGLContextAttributes){for(var attribute in webGLContextAttributes){contextAttributes[attribute]=webGLContextAttributes[attribute];}}contextHandle=GL.createContext(canvas,contextAttributes);if(contextHandle){ctx=GL.getContext(contextHandle).GLctx;}}else {ctx=canvas.getContext("2d");}if(!ctx)return null;if(setInModule){if(!useWebGL)assert(typeof GLctx==="undefined","cannot set in module if GLctx is used, but we are a non-GL context that would replace it");Module.ctx=ctx;if(useWebGL)GL.makeContextCurrent(contextHandle);Module.useWebGL=useWebGL;Browser.moduleContextCreatedCallbacks.forEach((function(callback){callback();}));Browser.init();}return ctx}),destroyContext:(function(canvas,useWebGL,setInModule){}),fullscreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullscreen:(function(lockPointer,resizeCanvas,vrDevice){Browser.lockPointer=lockPointer;Browser.resizeCanvas=resizeCanvas;Browser.vrDevice=vrDevice;if(typeof Browser.lockPointer==="undefined")Browser.lockPointer=true;if(typeof Browser.resizeCanvas==="undefined")Browser.resizeCanvas=false;if(typeof Browser.vrDevice==="undefined")Browser.vrDevice=null;var canvas=Module["canvas"];function fullscreenChange(){Browser.isFullscreen=false;var canvasContainer=canvas.parentNode;if((document["fullscreenElement"]||document["mozFullScreenElement"]||document["msFullscreenElement"]||document["webkitFullscreenElement"]||document["webkitCurrentFullScreenElement"])===canvasContainer){canvas.exitFullscreen=document["exitFullscreen"]||document["cancelFullScreen"]||document["mozCancelFullScreen"]||document["msExitFullscreen"]||document["webkitCancelFullScreen"]||(function(){});canvas.exitFullscreen=canvas.exitFullscreen.bind(document);if(Browser.lockPointer)canvas.requestPointerLock();Browser.isFullscreen=true;if(Browser.resizeCanvas)Browser.setFullscreenCanvasSize();}else {canvasContainer.parentNode.insertBefore(canvas,canvasContainer);canvasContainer.parentNode.removeChild(canvasContainer);if(Browser.resizeCanvas)Browser.setWindowedCanvasSize();}if(Module["onFullScreen"])Module["onFullScreen"](Browser.isFullscreen);if(Module["onFullscreen"])Module["onFullscreen"](Browser.isFullscreen);Browser.updateCanvasDimensions(canvas);}if(!Browser.fullscreenHandlersInstalled){Browser.fullscreenHandlersInstalled=true;document.addEventListener("fullscreenchange",fullscreenChange,false);document.addEventListener("mozfullscreenchange",fullscreenChange,false);document.addEventListener("webkitfullscreenchange",fullscreenChange,false);document.addEventListener("MSFullscreenChange",fullscreenChange,false);}var canvasContainer=document.createElement("div");canvas.parentNode.insertBefore(canvasContainer,canvas);canvasContainer.appendChild(canvas);canvasContainer.requestFullscreen=canvasContainer["requestFullscreen"]||canvasContainer["mozRequestFullScreen"]||canvasContainer["msRequestFullscreen"]||(canvasContainer["webkitRequestFullscreen"]?(function(){canvasContainer["webkitRequestFullscreen"](Element["ALLOW_KEYBOARD_INPUT"]);}):null)||(canvasContainer["webkitRequestFullScreen"]?(function(){canvasContainer["webkitRequestFullScreen"](Element["ALLOW_KEYBOARD_INPUT"]);}):null);if(vrDevice){canvasContainer.requestFullscreen({vrDisplay:vrDevice});}else {canvasContainer.requestFullscreen();}}),requestFullScreen:(function(lockPointer,resizeCanvas,vrDevice){Module.printErr("Browser.requestFullScreen() is deprecated. Please call Browser.requestFullscreen instead.");Browser.requestFullScreen=(function(lockPointer,resizeCanvas,vrDevice){return Browser.requestFullscreen(lockPointer,resizeCanvas,vrDevice)});return Browser.requestFullscreen(lockPointer,resizeCanvas,vrDevice)}),nextRAF:0,fakeRequestAnimationFrame:(function(func){var now=Date.now();if(Browser.nextRAF===0){Browser.nextRAF=now+1e3/60;}else {while(now+2>=Browser.nextRAF){Browser.nextRAF+=1e3/60;}}var delay=Math.max(Browser.nextRAF-now,0);setTimeout(func,delay);}),requestAnimationFrame:function requestAnimationFrame(func){if(typeof window==="undefined"){Browser.fakeRequestAnimationFrame(func);}else {if(!window.requestAnimationFrame){window.requestAnimationFrame=window["requestAnimationFrame"]||window["mozRequestAnimationFrame"]||window["webkitRequestAnimationFrame"]||window["msRequestAnimationFrame"]||window["oRequestAnimationFrame"]||Browser.fakeRequestAnimationFrame;}window.requestAnimationFrame(func);}},safeCallback:(function(func){return(function(){if(!ABORT)return func.apply(null,arguments)})}),allowAsyncCallbacks:true,queuedAsyncCallbacks:[],pauseAsyncCallbacks:(function(){Browser.allowAsyncCallbacks=false;}),resumeAsyncCallbacks:(function(){Browser.allowAsyncCallbacks=true;if(Browser.queuedAsyncCallbacks.length>0){var callbacks=Browser.queuedAsyncCallbacks;Browser.queuedAsyncCallbacks=[];callbacks.forEach((function(func){func();}));}}),safeRequestAnimationFrame:(function(func){return Browser.requestAnimationFrame((function(){if(ABORT)return;if(Browser.allowAsyncCallbacks){func();}else {Browser.queuedAsyncCallbacks.push(func);}}))}),safeSetTimeout:(function(func,timeout){Module["noExitRuntime"]=true;return setTimeout((function(){if(ABORT)return;if(Browser.allowAsyncCallbacks){func();}else {Browser.queuedAsyncCallbacks.push(func);}}),timeout)}),safeSetInterval:(function(func,timeout){Module["noExitRuntime"]=true;return setInterval((function(){if(ABORT)return;if(Browser.allowAsyncCallbacks){func();}}),timeout)}),getMimetype:(function(name){return {"jpg":"image/jpeg","jpeg":"image/jpeg","png":"image/png","bmp":"image/bmp","ogg":"audio/ogg","wav":"audio/wav","mp3":"audio/mpeg"}[name.substr(name.lastIndexOf(".")+1)]}),getUserMedia:(function(func){if(!window.getUserMedia){window.getUserMedia=navigator["getUserMedia"]||navigator["mozGetUserMedia"];}window.getUserMedia(func);}),getMovementX:(function(event){return event["movementX"]||event["mozMovementX"]||event["webkitMovementX"]||0}),getMovementY:(function(event){return event["movementY"]||event["mozMovementY"]||event["webkitMovementY"]||0}),getMouseWheelDelta:(function(event){var delta=0;switch(event.type){case"DOMMouseScroll":delta=event.detail;break;case"mousewheel":delta=event.wheelDelta;break;case"wheel":delta=event["deltaY"];break;default:throw "unrecognized mouse wheel event: "+event.type}return delta}),mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,touches:{},lastTouches:{},calculateMouseEvent:(function(event){if(Browser.pointerLock){if(event.type!="mousemove"&&"mozMovementX"in event){Browser.mouseMovementX=Browser.mouseMovementY=0;}else {Browser.mouseMovementX=Browser.getMovementX(event);Browser.mouseMovementY=Browser.getMovementY(event);}if(typeof SDL!="undefined"){Browser.mouseX=SDL.mouseX+Browser.mouseMovementX;Browser.mouseY=SDL.mouseY+Browser.mouseMovementY;}else {Browser.mouseX+=Browser.mouseMovementX;Browser.mouseY+=Browser.mouseMovementY;}}else {var rect=Module["canvas"].getBoundingClientRect();var cw=Module["canvas"].width;var ch=Module["canvas"].height;var scrollX=typeof window.scrollX!=="undefined"?window.scrollX:window.pageXOffset;var scrollY=typeof window.scrollY!=="undefined"?window.scrollY:window.pageYOffset;if(event.type==="touchstart"||event.type==="touchend"||event.type==="touchmove"){var touch=event.touch;if(touch===undefined){return}var adjustedX=touch.pageX-(scrollX+rect.left);var adjustedY=touch.pageY-(scrollY+rect.top);adjustedX=adjustedX*(cw/rect.width);adjustedY=adjustedY*(ch/rect.height);var coords={x:adjustedX,y:adjustedY};if(event.type==="touchstart"){Browser.lastTouches[touch.identifier]=coords;Browser.touches[touch.identifier]=coords;}else if(event.type==="touchend"||event.type==="touchmove"){var last=Browser.touches[touch.identifier];if(!last)last=coords;Browser.lastTouches[touch.identifier]=last;Browser.touches[touch.identifier]=coords;}return}var x=event.pageX-(scrollX+rect.left);var y=event.pageY-(scrollY+rect.top);x=x*(cw/rect.width);y=y*(ch/rect.height);Browser.mouseMovementX=x-Browser.mouseX;Browser.mouseMovementY=y-Browser.mouseY;Browser.mouseX=x;Browser.mouseY=y;}}),asyncLoad:(function(url,onload,onerror,noRunDep){var dep=!noRunDep?getUniqueRunDependency("al "+url):"";Module["readAsync"](url,(function(arrayBuffer){assert(arrayBuffer,'Loading data file "'+url+'" failed (no arrayBuffer).');onload(new Uint8Array(arrayBuffer));if(dep)removeRunDependency();}),(function(event){if(onerror){onerror();}else {throw 'Loading data file "'+url+'" failed.'}}));if(dep)addRunDependency();}),resizeListeners:[],updateResizeListeners:(function(){var canvas=Module["canvas"];Browser.resizeListeners.forEach((function(listener){listener(canvas.width,canvas.height);}));}),setCanvasSize:(function(width,height,noUpdates){var canvas=Module["canvas"];Browser.updateCanvasDimensions(canvas,width,height);if(!noUpdates)Browser.updateResizeListeners();}),windowedWidth:0,windowedHeight:0,setFullscreenCanvasSize:(function(){if(typeof SDL!="undefined"){var flags=HEAPU32[SDL.screen+Runtime.QUANTUM_SIZE*0>>2];flags=flags|8388608;HEAP32[SDL.screen+Runtime.QUANTUM_SIZE*0>>2]=flags;}Browser.updateResizeListeners();}),setWindowedCanvasSize:(function(){if(typeof SDL!="undefined"){var flags=HEAPU32[SDL.screen+Runtime.QUANTUM_SIZE*0>>2];flags=flags&~8388608;HEAP32[SDL.screen+Runtime.QUANTUM_SIZE*0>>2]=flags;}Browser.updateResizeListeners();}),updateCanvasDimensions:(function(canvas,wNative,hNative){if(wNative&&hNative){canvas.widthNative=wNative;canvas.heightNative=hNative;}else {wNative=canvas.widthNative;hNative=canvas.heightNative;}var w=wNative;var h=hNative;if(Module["forcedAspectRatio"]&&Module["forcedAspectRatio"]>0){if(w/h<Module["forcedAspectRatio"]){w=Math.round(h*Module["forcedAspectRatio"]);}else {h=Math.round(w/Module["forcedAspectRatio"]);}}if((document["fullscreenElement"]||document["mozFullScreenElement"]||document["msFullscreenElement"]||document["webkitFullscreenElement"]||document["webkitCurrentFullScreenElement"])===canvas.parentNode&&typeof screen!="undefined"){var factor=Math.min(screen.width/w,screen.height/h);w=Math.round(w*factor);h=Math.round(h*factor);}if(Browser.resizeCanvas){if(canvas.width!=w)canvas.width=w;if(canvas.height!=h)canvas.height=h;if(typeof canvas.style!="undefined"){canvas.style.removeProperty("width");canvas.style.removeProperty("height");}}else {if(canvas.width!=wNative)canvas.width=wNative;if(canvas.height!=hNative)canvas.height=hNative;if(typeof canvas.style!="undefined"){if(w!=wNative||h!=hNative){canvas.style.setProperty("width",w+"px","important");canvas.style.setProperty("height",h+"px","important");}else {canvas.style.removeProperty("width");canvas.style.removeProperty("height");}}}}),wgetRequests:{},nextWgetRequestHandle:0,getNextWgetRequestHandle:(function(){var handle=Browser.nextWgetRequestHandle;Browser.nextWgetRequestHandle++;return handle})};function _emscripten_exit_with_live_runtime(){Module["noExitRuntime"]=true;throw "SimulateInfiniteLoop"}function _pthread_mutexattr_settype(){}function _abort(){Module["abort"]();}function _pthread_cond_destroy(){return 0}function _pthread_condattr_destroy(){return 0}function ___cxa_free_exception(ptr){try{return _free(ptr)}catch(e){}}function ___lock(){}function ___unlock(){}function _pthread_cond_wait(){return 0}var PTHREAD_SPECIFIC={};function _pthread_getspecific(key){return PTHREAD_SPECIFIC[key]||0}var PTHREAD_SPECIFIC_NEXT_KEY=1;var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};function _pthread_key_create(key,destructor){if(key==0){return ERRNO_CODES.EINVAL}HEAP32[key>>2]=PTHREAD_SPECIFIC_NEXT_KEY;PTHREAD_SPECIFIC[PTHREAD_SPECIFIC_NEXT_KEY]=0;PTHREAD_SPECIFIC_NEXT_KEY++;return 0}function _llvm_bswap_i64(l,h){var retl=_llvm_bswap_i32(h)>>>0;var reth=_llvm_bswap_i32(l)>>>0;return (Runtime.setTempRet0(reth),retl)|0}function _pthread_mutex_init(){}function _pthread_key_delete(key){if(key in PTHREAD_SPECIFIC){delete PTHREAD_SPECIFIC[key];return 0}return ERRNO_CODES.EINVAL}function _pthread_setspecific(key,value){if(!(key in PTHREAD_SPECIFIC)){return ERRNO_CODES.EINVAL}PTHREAD_SPECIFIC[key]=value;return 0}function _pthread_mutexattr_destroy(){}function ___cxa_allocate_exception(size){return _malloc(size)}var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};function ___setErrNo(value){if(Module["___errno_location"])HEAP32[Module["___errno_location"]()>>2]=value;return value}var PATH={splitPath:(function(filename){var splitPathRe=/^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;return splitPathRe.exec(filename).slice(1)}),normalizeArray:(function(parts,allowAboveRoot){var up=0;for(var i=parts.length-1;i>=0;i--){var last=parts[i];if(last==="."){parts.splice(i,1);}else if(last===".."){parts.splice(i,1);up++;}else if(up){parts.splice(i,1);up--;}}if(allowAboveRoot){for(;up;up--){parts.unshift("..");}}return parts}),normalize:(function(path){var isAbsolute=path.charAt(0)==="/",trailingSlash=path.substr(-1)==="/";path=PATH.normalizeArray(path.split("/").filter((function(p){return !!p})),!isAbsolute).join("/");if(!path&&!isAbsolute){path=".";}if(path&&trailingSlash){path+="/";}return (isAbsolute?"/":"")+path}),dirname:(function(path){var result=PATH.splitPath(path),root=result[0],dir=result[1];if(!root&&!dir){return "."}if(dir){dir=dir.substr(0,dir.length-1);}return root+dir}),basename:(function(path){if(path==="/")return "/";var lastSlash=path.lastIndexOf("/");if(lastSlash===-1)return path;return path.substr(lastSlash+1)}),extname:(function(path){return PATH.splitPath(path)[3]}),join:(function(){var paths=Array.prototype.slice.call(arguments,0);return PATH.normalize(paths.join("/"))}),join2:(function(l,r){return PATH.normalize(l+"/"+r)}),resolve:(function(){var resolvedPath="",resolvedAbsolute=false;for(var i=arguments.length-1;i>=-1&&!resolvedAbsolute;i--){var path=i>=0?arguments[i]:FS.cwd();if(typeof path!=="string"){throw new TypeError("Arguments to path.resolve must be strings")}else if(!path){return ""}resolvedPath=path+"/"+resolvedPath;resolvedAbsolute=path.charAt(0)==="/";}resolvedPath=PATH.normalizeArray(resolvedPath.split("/").filter((function(p){return !!p})),!resolvedAbsolute).join("/");return (resolvedAbsolute?"/":"")+resolvedPath||"."}),relative:(function(from,to){from=PATH.resolve(from).substr(1);to=PATH.resolve(to).substr(1);function trim(arr){var start=0;for(;start<arr.length;start++){if(arr[start]!=="")break}var end=arr.length-1;for(;end>=0;end--){if(arr[end]!=="")break}if(start>end)return [];return arr.slice(start,end-start+1)}var fromParts=trim(from.split("/"));var toParts=trim(to.split("/"));var length=Math.min(fromParts.length,toParts.length);var samePartsLength=length;for(var i=0;i<length;i++){if(fromParts[i]!==toParts[i]){samePartsLength=i;break}}var outputParts=[];for(var i=samePartsLength;i<fromParts.length;i++){outputParts.push("..");}outputParts=outputParts.concat(toParts.slice(samePartsLength));return outputParts.join("/")})};var TTY={ttys:[],init:(function(){}),shutdown:(function(){}),register:(function(dev,ops){TTY.ttys[dev]={input:[],output:[],ops:ops};FS.registerDevice(dev,TTY.stream_ops);}),stream_ops:{open:(function(stream){var tty=TTY.ttys[stream.node.rdev];if(!tty){throw new FS.ErrnoError(ERRNO_CODES.ENODEV)}stream.tty=tty;stream.seekable=false;}),close:(function(stream){stream.tty.ops.flush(stream.tty);}),flush:(function(stream){stream.tty.ops.flush(stream.tty);}),read:(function(stream,buffer,offset,length,pos){if(!stream.tty||!stream.tty.ops.get_char){throw new FS.ErrnoError(ERRNO_CODES.ENXIO)}var bytesRead=0;for(var i=0;i<length;i++){var result;try{result=stream.tty.ops.get_char(stream.tty);}catch(e){throw new FS.ErrnoError(ERRNO_CODES.EIO)}if(result===undefined&&bytesRead===0){throw new FS.ErrnoError(ERRNO_CODES.EAGAIN)}if(result===null||result===undefined)break;bytesRead++;buffer[offset+i]=result;}if(bytesRead){stream.node.timestamp=Date.now();}return bytesRead}),write:(function(stream,buffer,offset,length,pos){if(!stream.tty||!stream.tty.ops.put_char){throw new FS.ErrnoError(ERRNO_CODES.ENXIO)}for(var i=0;i<length;i++){try{stream.tty.ops.put_char(stream.tty,buffer[offset+i]);}catch(e){throw new FS.ErrnoError(ERRNO_CODES.EIO)}}if(length){stream.node.timestamp=Date.now();}return i})},default_tty_ops:{get_char:(function(tty){if(!tty.input.length){var result=null;if(ENVIRONMENT_IS_NODE){var BUFSIZE=256;var buf=new Buffer(BUFSIZE);var bytesRead=0;var isPosixPlatform=process.platform!="win32";var fd=process.stdin.fd;if(isPosixPlatform){var usingDevice=false;try{fd=fs$1.openSync("/dev/stdin","r");usingDevice=true;}catch(e){}}try{bytesRead=fs$1.readSync(fd,buf,0,BUFSIZE,null);}catch(e){if(e.toString().indexOf("EOF")!=-1)bytesRead=0;else throw e}if(usingDevice){fs$1.closeSync(fd);}if(bytesRead>0){result=buf.slice(0,bytesRead).toString("utf-8");}else {result=null;}}else if(typeof window!="undefined"&&typeof window.prompt=="function"){result=window.prompt("Input: ");if(result!==null){result+="\n";}}else if(typeof readline=="function"){result=readline();if(result!==null){result+="\n";}}if(!result){return null}tty.input=intArrayFromString(result,true);}return tty.input.shift()}),put_char:(function(tty,val){if(val===null||val===10){Module["print"](UTF8ArrayToString(tty.output,0));tty.output=[];}else {if(val!=0)tty.output.push(val);}}),flush:(function(tty){if(tty.output&&tty.output.length>0){Module["print"](UTF8ArrayToString(tty.output,0));tty.output=[];}})},default_tty1_ops:{put_char:(function(tty,val){if(val===null||val===10){Module["printErr"](UTF8ArrayToString(tty.output,0));tty.output=[];}else {if(val!=0)tty.output.push(val);}}),flush:(function(tty){if(tty.output&&tty.output.length>0){Module["printErr"](UTF8ArrayToString(tty.output,0));tty.output=[];}})}};var MEMFS={ops_table:null,mount:(function(mount){return MEMFS.createNode(null,"/",16384|511,0)}),createNode:(function(parent,name,mode,dev){if(FS.isBlkdev(mode)||FS.isFIFO(mode)){throw new FS.ErrnoError(ERRNO_CODES.EPERM)}if(!MEMFS.ops_table){MEMFS.ops_table={dir:{node:{getattr:MEMFS.node_ops.getattr,setattr:MEMFS.node_ops.setattr,lookup:MEMFS.node_ops.lookup,mknod:MEMFS.node_ops.mknod,rename:MEMFS.node_ops.rename,unlink:MEMFS.node_ops.unlink,rmdir:MEMFS.node_ops.rmdir,readdir:MEMFS.node_ops.readdir,symlink:MEMFS.node_ops.symlink},stream:{llseek:MEMFS.stream_ops.llseek}},file:{node:{getattr:MEMFS.node_ops.getattr,setattr:MEMFS.node_ops.setattr},stream:{llseek:MEMFS.stream_ops.llseek,read:MEMFS.stream_ops.read,write:MEMFS.stream_ops.write,allocate:MEMFS.stream_ops.allocate,mmap:MEMFS.stream_ops.mmap,msync:MEMFS.stream_ops.msync}},link:{node:{getattr:MEMFS.node_ops.getattr,setattr:MEMFS.node_ops.setattr,readlink:MEMFS.node_ops.readlink},stream:{}},chrdev:{node:{getattr:MEMFS.node_ops.getattr,setattr:MEMFS.node_ops.setattr},stream:FS.chrdev_stream_ops}};}var node=FS.createNode(parent,name,mode,dev);if(FS.isDir(node.mode)){node.node_ops=MEMFS.ops_table.dir.node;node.stream_ops=MEMFS.ops_table.dir.stream;node.contents={};}else if(FS.isFile(node.mode)){node.node_ops=MEMFS.ops_table.file.node;node.stream_ops=MEMFS.ops_table.file.stream;node.usedBytes=0;node.contents=null;}else if(FS.isLink(node.mode)){node.node_ops=MEMFS.ops_table.link.node;node.stream_ops=MEMFS.ops_table.link.stream;}else if(FS.isChrdev(node.mode)){node.node_ops=MEMFS.ops_table.chrdev.node;node.stream_ops=MEMFS.ops_table.chrdev.stream;}node.timestamp=Date.now();if(parent){parent.contents[name]=node;}return node}),getFileDataAsRegularArray:(function(node){if(node.contents&&node.contents.subarray){var arr=[];for(var i=0;i<node.usedBytes;++i)arr.push(node.contents[i]);return arr}return node.contents}),getFileDataAsTypedArray:(function(node){if(!node.contents)return new Uint8Array;if(node.contents.subarray)return node.contents.subarray(0,node.usedBytes);return new Uint8Array(node.contents)}),expandFileStorage:(function(node,newCapacity){if(node.contents&&node.contents.subarray&&newCapacity>node.contents.length){node.contents=MEMFS.getFileDataAsRegularArray(node);node.usedBytes=node.contents.length;}if(!node.contents||node.contents.subarray){var prevCapacity=node.contents?node.contents.length:0;if(prevCapacity>=newCapacity)return;var CAPACITY_DOUBLING_MAX=1024*1024;newCapacity=Math.max(newCapacity,prevCapacity*(prevCapacity<CAPACITY_DOUBLING_MAX?2:1.125)|0);if(prevCapacity!=0)newCapacity=Math.max(newCapacity,256);var oldContents=node.contents;node.contents=new Uint8Array(newCapacity);if(node.usedBytes>0)node.contents.set(oldContents.subarray(0,node.usedBytes),0);return}if(!node.contents&&newCapacity>0)node.contents=[];while(node.contents.length<newCapacity)node.contents.push(0);}),resizeFileStorage:(function(node,newSize){if(node.usedBytes==newSize)return;if(newSize==0){node.contents=null;node.usedBytes=0;return}if(!node.contents||node.contents.subarray){var oldContents=node.contents;node.contents=new Uint8Array(new ArrayBuffer(newSize));if(oldContents){node.contents.set(oldContents.subarray(0,Math.min(newSize,node.usedBytes)));}node.usedBytes=newSize;return}if(!node.contents)node.contents=[];if(node.contents.length>newSize)node.contents.length=newSize;else while(node.contents.length<newSize)node.contents.push(0);node.usedBytes=newSize;}),node_ops:{getattr:(function(node){var attr={};attr.dev=FS.isChrdev(node.mode)?node.id:1;attr.ino=node.id;attr.mode=node.mode;attr.nlink=1;attr.uid=0;attr.gid=0;attr.rdev=node.rdev;if(FS.isDir(node.mode)){attr.size=4096;}else if(FS.isFile(node.mode)){attr.size=node.usedBytes;}else if(FS.isLink(node.mode)){attr.size=node.link.length;}else {attr.size=0;}attr.atime=new Date(node.timestamp);attr.mtime=new Date(node.timestamp);attr.ctime=new Date(node.timestamp);attr.blksize=4096;attr.blocks=Math.ceil(attr.size/attr.blksize);return attr}),setattr:(function(node,attr){if(attr.mode!==undefined){node.mode=attr.mode;}if(attr.timestamp!==undefined){node.timestamp=attr.timestamp;}if(attr.size!==undefined){MEMFS.resizeFileStorage(node,attr.size);}}),lookup:(function(parent,name){throw FS.genericErrors[ERRNO_CODES.ENOENT]}),mknod:(function(parent,name,mode,dev){return MEMFS.createNode(parent,name,mode,dev)}),rename:(function(old_node,new_dir,new_name){if(FS.isDir(old_node.mode)){var new_node;try{new_node=FS.lookupNode(new_dir,new_name);}catch(e){}if(new_node){for(var i in new_node.contents){throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY)}}}delete old_node.parent.contents[old_node.name];old_node.name=new_name;new_dir.contents[new_name]=old_node;old_node.parent=new_dir;}),unlink:(function(parent,name){delete parent.contents[name];}),rmdir:(function(parent,name){var node=FS.lookupNode(parent,name);for(var i in node.contents){throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY)}delete parent.contents[name];}),readdir:(function(node){var entries=[".",".."];for(var key in node.contents){if(!node.contents.hasOwnProperty(key)){continue}entries.push(key);}return entries}),symlink:(function(parent,newname,oldpath){var node=MEMFS.createNode(parent,newname,511|40960,0);node.link=oldpath;return node}),readlink:(function(node){if(!FS.isLink(node.mode)){throw new FS.ErrnoError(ERRNO_CODES.EINVAL)}return node.link})},stream_ops:{read:(function(stream,buffer,offset,length,position){var contents=stream.node.contents;if(position>=stream.node.usedBytes)return 0;var size=Math.min(stream.node.usedBytes-position,length);assert(size>=0);if(size>8&&contents.subarray){buffer.set(contents.subarray(position,position+size),offset);}else {for(var i=0;i<size;i++)buffer[offset+i]=contents[position+i];}return size}),write:(function(stream,buffer,offset,length,position,canOwn){if(!length)return 0;var node=stream.node;node.timestamp=Date.now();if(buffer.subarray&&(!node.contents||node.contents.subarray)){if(canOwn){node.contents=buffer.subarray(offset,offset+length);node.usedBytes=length;return length}else if(node.usedBytes===0&&position===0){node.contents=new Uint8Array(buffer.subarray(offset,offset+length));node.usedBytes=length;return length}else if(position+length<=node.usedBytes){node.contents.set(buffer.subarray(offset,offset+length),position);return length}}MEMFS.expandFileStorage(node,position+length);if(node.contents.subarray&&buffer.subarray)node.contents.set(buffer.subarray(offset,offset+length),position);else {for(var i=0;i<length;i++){node.contents[position+i]=buffer[offset+i];}}node.usedBytes=Math.max(node.usedBytes,position+length);return length}),llseek:(function(stream,offset,whence){var position=offset;if(whence===1){position+=stream.position;}else if(whence===2){if(FS.isFile(stream.node.mode)){position+=stream.node.usedBytes;}}if(position<0){throw new FS.ErrnoError(ERRNO_CODES.EINVAL)}return position}),allocate:(function(stream,offset,length){MEMFS.expandFileStorage(stream.node,offset+length);stream.node.usedBytes=Math.max(stream.node.usedBytes,offset+length);}),mmap:(function(stream,buffer,offset,length,position,prot,flags){if(!FS.isFile(stream.node.mode)){throw new FS.ErrnoError(ERRNO_CODES.ENODEV)}var ptr;var allocated;var contents=stream.node.contents;if(!(flags&2)&&(contents.buffer===buffer||contents.buffer===buffer.buffer)){allocated=false;ptr=contents.byteOffset;}else {if(position>0||position+length<stream.node.usedBytes){if(contents.subarray){contents=contents.subarray(position,position+length);}else {contents=Array.prototype.slice.call(contents,position,position+length);}}allocated=true;ptr=_malloc(length);if(!ptr){throw new FS.ErrnoError(ERRNO_CODES.ENOMEM)}buffer.set(contents,ptr);}return {ptr:ptr,allocated:allocated}}),msync:(function(stream,buffer,offset,length,mmapFlags){if(!FS.isFile(stream.node.mode)){throw new FS.ErrnoError(ERRNO_CODES.ENODEV)}if(mmapFlags&2){return 0}var bytesWritten=MEMFS.stream_ops.write(stream,buffer,0,length,offset,false);return 0})}};var IDBFS={dbs:{},indexedDB:(function(){if(typeof indexedDB!=="undefined")return indexedDB;var ret=null;if(typeof window==="object")ret=window.indexedDB||window.mozIndexedDB||window.webkitIndexedDB||window.msIndexedDB;assert(ret,"IDBFS used, but indexedDB not supported");return ret}),DB_VERSION:21,DB_STORE_NAME:"FILE_DATA",mount:(function(mount){return MEMFS.mount.apply(null,arguments)}),syncfs:(function(mount,populate,callback){IDBFS.getLocalSet(mount,(function(err,local){if(err)return callback(err);IDBFS.getRemoteSet(mount,(function(err,remote){if(err)return callback(err);var src=populate?remote:local;var dst=populate?local:remote;IDBFS.reconcile(src,dst,callback);}));}));}),getDB:(function(name,callback){var db=IDBFS.dbs[name];if(db){return callback(null,db)}var req;try{req=IDBFS.indexedDB().open(name,IDBFS.DB_VERSION);}catch(e){return callback(e)}if(!req){return callback("Unable to connect to IndexedDB")}req.onupgradeneeded=(function(e){var db=e.target.result;var transaction=e.target.transaction;var fileStore;if(db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)){fileStore=transaction.objectStore(IDBFS.DB_STORE_NAME);}else {fileStore=db.createObjectStore(IDBFS.DB_STORE_NAME);}if(!fileStore.indexNames.contains("timestamp")){fileStore.createIndex("timestamp","timestamp",{unique:false});}});req.onsuccess=(function(){db=req.result;IDBFS.dbs[name]=db;callback(null,db);});req.onerror=(function(e){callback(this.error);e.preventDefault();});}),getLocalSet:(function(mount,callback){var entries={};function isRealDir(p){return p!=="."&&p!==".."}function toAbsolute(root){return(function(p){return PATH.join2(root,p)})}var check=FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));while(check.length){var path=check.pop();var stat;try{stat=FS.stat(path);}catch(e){return callback(e)}if(FS.isDir(stat.mode)){check.push.apply(check,FS.readdir(path).filter(isRealDir).map(toAbsolute(path)));}entries[path]={timestamp:stat.mtime};}return callback(null,{type:"local",entries:entries})}),getRemoteSet:(function(mount,callback){var entries={};IDBFS.getDB(mount.mountpoint,(function(err,db){if(err)return callback(err);try{var transaction=db.transaction([IDBFS.DB_STORE_NAME],"readonly");transaction.onerror=(function(e){callback(this.error);e.preventDefault();});var store=transaction.objectStore(IDBFS.DB_STORE_NAME);var index=store.index("timestamp");index.openKeyCursor().onsuccess=(function(event){var cursor=event.target.result;if(!cursor){return callback(null,{type:"remote",db:db,entries:entries})}entries[cursor.primaryKey]={timestamp:cursor.key};cursor.continue();});}catch(e){return callback(e)}}));}),loadLocalEntry:(function(path,callback){var stat,node;try{var lookup=FS.lookupPath(path);node=lookup.node;stat=FS.stat(path);}catch(e){return callback(e)}if(FS.isDir(stat.mode)){return callback(null,{timestamp:stat.mtime,mode:stat.mode})}else if(FS.isFile(stat.mode)){node.contents=MEMFS.getFileDataAsTypedArray(node);return callback(null,{timestamp:stat.mtime,mode:stat.mode,contents:node.contents})}else {return callback(new Error("node type not supported"))}}),storeLocalEntry:(function(path,entry,callback){try{if(FS.isDir(entry.mode)){FS.mkdir(path,entry.mode);}else if(FS.isFile(entry.mode)){FS.writeFile(path,entry.contents,{encoding:"binary",canOwn:true});}else {return callback(new Error("node type not supported"))}FS.chmod(path,entry.mode);FS.utime(path,entry.timestamp,entry.timestamp);}catch(e){return callback(e)}callback(null);}),removeLocalEntry:(function(path,callback){try{var lookup=FS.lookupPath(path);var stat=FS.stat(path);if(FS.isDir(stat.mode)){FS.rmdir(path);}else if(FS.isFile(stat.mode)){FS.unlink(path);}}catch(e){return callback(e)}callback(null);}),loadRemoteEntry:(function(store,path,callback){var req=store.get(path);req.onsuccess=(function(event){callback(null,event.target.result);});req.onerror=(function(e){callback(this.error);e.preventDefault();});}),storeRemoteEntry:(function(store,path,entry,callback){var req=store.put(entry,path);req.onsuccess=(function(){callback(null);});req.onerror=(function(e){callback(this.error);e.preventDefault();});}),removeRemoteEntry:(function(store,path,callback){var req=store.delete(path);req.onsuccess=(function(){callback(null);});req.onerror=(function(e){callback(this.error);e.preventDefault();});}),reconcile:(function(src,dst,callback){var total=0;var create=[];Object.keys(src.entries).forEach((function(key){var e=src.entries[key];var e2=dst.entries[key];if(!e2||e.timestamp>e2.timestamp){create.push(key);total++;}}));var remove=[];Object.keys(dst.entries).forEach((function(key){var e=dst.entries[key];var e2=src.entries[key];if(!e2){remove.push(key);total++;}}));if(!total){return callback(null)}var completed=0;var db=src.type==="remote"?src.db:dst.db;var transaction=db.transaction([IDBFS.DB_STORE_NAME],"readwrite");var store=transaction.objectStore(IDBFS.DB_STORE_NAME);function done(err){if(err){if(!done.errored){done.errored=true;return callback(err)}return}if(++completed>=total){return callback(null)}}transaction.onerror=(function(e){done(this.error);e.preventDefault();});create.sort().forEach((function(path){if(dst.type==="local"){IDBFS.loadRemoteEntry(store,path,(function(err,entry){if(err)return done(err);IDBFS.storeLocalEntry(path,entry,done);}));}else {IDBFS.loadLocalEntry(path,(function(err,entry){if(err)return done(err);IDBFS.storeRemoteEntry(store,path,entry,done);}));}}));remove.sort().reverse().forEach((function(path){if(dst.type==="local"){IDBFS.removeLocalEntry(path,done);}else {IDBFS.removeRemoteEntry(store,path,done);}}));})};var NODEFS={isWindows:false,staticInit:(function(){NODEFS.isWindows=!!process.platform.match(/^win/);}),mount:(function(mount){assert(ENVIRONMENT_IS_NODE);return NODEFS.createNode(null,"/",NODEFS.getMode(mount.opts.root),0)}),createNode:(function(parent,name,mode,dev){if(!FS.isDir(mode)&&!FS.isFile(mode)&&!FS.isLink(mode)){throw new FS.ErrnoError(ERRNO_CODES.EINVAL)}var node=FS.createNode(parent,name,mode);node.node_ops=NODEFS.node_ops;node.stream_ops=NODEFS.stream_ops;return node}),getMode:(function(path){var stat;try{stat=fs$1.lstatSync(path);if(NODEFS.isWindows){stat.mode=stat.mode|(stat.mode&146)>>1;}}catch(e){if(!e.code)throw e;throw new FS.ErrnoError(ERRNO_CODES[e.code])}return stat.mode}),realPath:(function(node){var parts=[];while(node.parent!==node){parts.push(node.name);node=node.parent;}parts.push(node.mount.opts.root);parts.reverse();return PATH.join.apply(null,parts)}),flagsToPermissionStringMap:{0:"r",1:"r+",2:"r+",64:"r",65:"r+",66:"r+",129:"rx+",193:"rx+",514:"w+",577:"w",578:"w+",705:"wx",706:"wx+",1024:"a",1025:"a",1026:"a+",1089:"a",1090:"a+",1153:"ax",1154:"ax+",1217:"ax",1218:"ax+",4096:"rs",4098:"rs+"},flagsToPermissionString:(function(flags){flags&=~2097152;flags&=~2048;flags&=~32768;flags&=~524288;if(flags in NODEFS.flagsToPermissionStringMap){return NODEFS.flagsToPermissionStringMap[flags]}else {throw new FS.ErrnoError(ERRNO_CODES.EINVAL)}}),node_ops:{getattr:(function(node){var path=NODEFS.realPath(node);var stat;try{stat=fs$1.lstatSync(path);}catch(e){if(!e.code)throw e;throw new FS.ErrnoError(ERRNO_CODES[e.code])}if(NODEFS.isWindows&&!stat.blksize){stat.blksize=4096;}if(NODEFS.isWindows&&!stat.blocks){stat.blocks=(stat.size+stat.blksize-1)/stat.blksize|0;}return {dev:stat.dev,ino:stat.ino,mode:stat.mode,nlink:stat.nlink,uid:stat.uid,gid:stat.gid,rdev:stat.rdev,size:stat.size,atime:stat.atime,mtime:stat.mtime,ctime:stat.ctime,blksize:stat.blksize,blocks:stat.blocks}}),setattr:(function(node,attr){var path=NODEFS.realPath(node);try{if(attr.mode!==undefined){fs$1.chmodSync(path,attr.mode);node.mode=attr.mode;}if(attr.timestamp!==undefined){var date=new Date(attr.timestamp);fs$1.utimesSync(path,date,date);}if(attr.size!==undefined){fs$1.truncateSync(path,attr.size);}}catch(e){if(!e.code)throw e;throw new FS.ErrnoError(ERRNO_CODES[e.code])}}),lookup:(function(parent,name){var path=PATH.join2(NODEFS.realPath(parent),name);var mode=NODEFS.getMode(path);return NODEFS.createNode(parent,name,mode)}),mknod:(function(parent,name,mode,dev){var node=NODEFS.createNode(parent,name,mode,dev);var path=NODEFS.realPath(node);try{if(FS.isDir(node.mode)){fs$1.mkdirSync(path,node.mode);}else {fs$1.writeFileSync(path,"",{mode:node.mode});}}catch(e){if(!e.code)throw e;throw new FS.ErrnoError(ERRNO_CODES[e.code])}return node}),rename:(function(oldNode,newDir,newName){var oldPath=NODEFS.realPath(oldNode);var newPath=PATH.join2(NODEFS.realPath(newDir),newName);try{fs$1.renameSync(oldPath,newPath);}catch(e){if(!e.code)throw e;throw new FS.ErrnoError(ERRNO_CODES[e.code])}}),unlink:(function(parent,name){var path=PATH.join2(NODEFS.realPath(parent),name);try{fs$1.unlinkSync(path);}catch(e){if(!e.code)throw e;throw new FS.ErrnoError(ERRNO_CODES[e.code])}}),rmdir:(function(parent,name){var path=PATH.join2(NODEFS.realPath(parent),name);try{fs$1.rmdirSync(path);}catch(e){if(!e.code)throw e;throw new FS.ErrnoError(ERRNO_CODES[e.code])}}),readdir:(function(node){var path=NODEFS.realPath(node);try{return fs$1.readdirSync(path)}catch(e){if(!e.code)throw e;throw new FS.ErrnoError(ERRNO_CODES[e.code])}}),symlink:(function(parent,newName,oldPath){var newPath=PATH.join2(NODEFS.realPath(parent),newName);try{fs$1.symlinkSync(oldPath,newPath);}catch(e){if(!e.code)throw e;throw new FS.ErrnoError(ERRNO_CODES[e.code])}}),readlink:(function(node){var path=NODEFS.realPath(node);try{path=fs$1.readlinkSync(path);path=NODEJS_PATH.relative(NODEJS_PATH.resolve(node.mount.opts.root),path);return path}catch(e){if(!e.code)throw e;throw new FS.ErrnoError(ERRNO_CODES[e.code])}})},stream_ops:{open:(function(stream){var path=NODEFS.realPath(stream.node);try{if(FS.isFile(stream.node.mode)){stream.nfd=fs$1.openSync(path,NODEFS.flagsToPermissionString(stream.flags));}}catch(e){if(!e.code)throw e;throw new FS.ErrnoError(ERRNO_CODES[e.code])}}),close:(function(stream){try{if(FS.isFile(stream.node.mode)&&stream.nfd){fs$1.closeSync(stream.nfd);}}catch(e){if(!e.code)throw e;throw new FS.ErrnoError(ERRNO_CODES[e.code])}}),read:(function(stream,buffer,offset,length,position){if(length===0)return 0;var nbuffer=new Buffer(length);var res;try{res=fs$1.readSync(stream.nfd,nbuffer,0,length,position);}catch(e){throw new FS.ErrnoError(ERRNO_CODES[e.code])}if(res>0){for(var i=0;i<res;i++){buffer[offset+i]=nbuffer[i];}}return res}),write:(function(stream,buffer,offset,length,position){var nbuffer=new Buffer(buffer.subarray(offset,offset+length));var res;try{res=fs$1.writeSync(stream.nfd,nbuffer,0,length,position);}catch(e){throw new FS.ErrnoError(ERRNO_CODES[e.code])}return res}),llseek:(function(stream,offset,whence){var position=offset;if(whence===1){position+=stream.position;}else if(whence===2){if(FS.isFile(stream.node.mode)){try{var stat=fs$1.fstatSync(stream.nfd);position+=stat.size;}catch(e){throw new FS.ErrnoError(ERRNO_CODES[e.code])}}}if(position<0){throw new FS.ErrnoError(ERRNO_CODES.EINVAL)}return position})}};var WORKERFS={DIR_MODE:16895,FILE_MODE:33279,reader:null,mount:(function(mount){assert(ENVIRONMENT_IS_WORKER);if(!WORKERFS.reader)WORKERFS.reader=new FileReaderSync;var root=WORKERFS.createNode(null,"/",WORKERFS.DIR_MODE,0);var createdParents={};function ensureParent(path){var parts=path.split("/");var parent=root;for(var i=0;i<parts.length-1;i++){var curr=parts.slice(0,i+1).join("/");if(!createdParents[curr]){createdParents[curr]=WORKERFS.createNode(parent,parts[i],WORKERFS.DIR_MODE,0);}parent=createdParents[curr];}return parent}function base(path){var parts=path.split("/");return parts[parts.length-1]}Array.prototype.forEach.call(mount.opts["files"]||[],(function(file){WORKERFS.createNode(ensureParent(file.name),base(file.name),WORKERFS.FILE_MODE,0,file,file.lastModifiedDate);}));(mount.opts["blobs"]||[]).forEach((function(obj){WORKERFS.createNode(ensureParent(obj["name"]),base(obj["name"]),WORKERFS.FILE_MODE,0,obj["data"]);}));(mount.opts["packages"]||[]).forEach((function(pack){pack["metadata"].files.forEach((function(file){var name=file.filename.substr(1);WORKERFS.createNode(ensureParent(name),base(name),WORKERFS.FILE_MODE,0,pack["blob"].slice(file.start,file.end));}));}));return root}),createNode:(function(parent,name,mode,dev,contents,mtime){var node=FS.createNode(parent,name,mode);node.mode=mode;node.node_ops=WORKERFS.node_ops;node.stream_ops=WORKERFS.stream_ops;node.timestamp=(mtime||new Date).getTime();assert(WORKERFS.FILE_MODE!==WORKERFS.DIR_MODE);if(mode===WORKERFS.FILE_MODE){node.size=contents.size;node.contents=contents;}else {node.size=4096;node.contents={};}if(parent){parent.contents[name]=node;}return node}),node_ops:{getattr:(function(node){return {dev:1,ino:undefined,mode:node.mode,nlink:1,uid:0,gid:0,rdev:undefined,size:node.size,atime:new Date(node.timestamp),mtime:new Date(node.timestamp),ctime:new Date(node.timestamp),blksize:4096,blocks:Math.ceil(node.size/4096)}}),setattr:(function(node,attr){if(attr.mode!==undefined){node.mode=attr.mode;}if(attr.timestamp!==undefined){node.timestamp=attr.timestamp;}}),lookup:(function(parent,name){throw new FS.ErrnoError(ERRNO_CODES.ENOENT)}),mknod:(function(parent,name,mode,dev){throw new FS.ErrnoError(ERRNO_CODES.EPERM)}),rename:(function(oldNode,newDir,newName){throw new FS.ErrnoError(ERRNO_CODES.EPERM)}),unlink:(function(parent,name){throw new FS.ErrnoError(ERRNO_CODES.EPERM)}),rmdir:(function(parent,name){throw new FS.ErrnoError(ERRNO_CODES.EPERM)}),readdir:(function(node){var entries=[".",".."];for(var key in node.contents){if(!node.contents.hasOwnProperty(key)){continue}entries.push(key);}return entries}),symlink:(function(parent,newName,oldPath){throw new FS.ErrnoError(ERRNO_CODES.EPERM)}),readlink:(function(node){throw new FS.ErrnoError(ERRNO_CODES.EPERM)})},stream_ops:{read:(function(stream,buffer,offset,length,position){if(position>=stream.node.size)return 0;var chunk=stream.node.contents.slice(position,position+length);var ab=WORKERFS.reader.readAsArrayBuffer(chunk);buffer.set(new Uint8Array(ab),offset);return chunk.size}),write:(function(stream,buffer,offset,length,position){throw new FS.ErrnoError(ERRNO_CODES.EIO)}),llseek:(function(stream,offset,whence){var position=offset;if(whence===1){position+=stream.position;}else if(whence===2){if(FS.isFile(stream.node.mode)){position+=stream.node.size;}}if(position<0){throw new FS.ErrnoError(ERRNO_CODES.EINVAL)}return position})}};STATICTOP+=16;STATICTOP+=16;STATICTOP+=16;var FS={root:null,mounts:[],devices:[null],streams:[],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,trackingDelegate:{},tracking:{openFlags:{READ:1,WRITE:2}},ErrnoError:null,genericErrors:{},filesystems:null,syncFSRequests:0,handleFSError:(function(e){if(!(e instanceof FS.ErrnoError))throw e+" : "+stackTrace();return ___setErrNo(e.errno)}),lookupPath:(function(path,opts){path=PATH.resolve(FS.cwd(),path);opts=opts||{};if(!path)return {path:"",node:null};var defaults={follow_mount:true,recurse_count:0};for(var key in defaults){if(opts[key]===undefined){opts[key]=defaults[key];}}if(opts.recurse_count>8){throw new FS.ErrnoError(ERRNO_CODES.ELOOP)}var parts=PATH.normalizeArray(path.split("/").filter((function(p){return !!p})),false);var current=FS.root;var current_path="/";for(var i=0;i<parts.length;i++){var islast=i===parts.length-1;if(islast&&opts.parent){break}current=FS.lookupNode(current,parts[i]);current_path=PATH.join2(current_path,parts[i]);if(FS.isMountpoint(current)){if(!islast||islast&&opts.follow_mount){current=current.mounted.root;}}if(!islast||opts.follow){var count=0;while(FS.isLink(current.mode)){var link=FS.readlink(current_path);current_path=PATH.resolve(PATH.dirname(current_path),link);var lookup=FS.lookupPath(current_path,{recurse_count:opts.recurse_count});current=lookup.node;if(count++>40){throw new FS.ErrnoError(ERRNO_CODES.ELOOP)}}}}return {path:current_path,node:current}}),getPath:(function(node){var path;while(true){if(FS.isRoot(node)){var mount=node.mount.mountpoint;if(!path)return mount;return mount[mount.length-1]!=="/"?mount+"/"+path:mount+path}path=path?node.name+"/"+path:node.name;node=node.parent;}}),hashName:(function(parentid,name){var hash=0;for(var i=0;i<name.length;i++){hash=(hash<<5)-hash+name.charCodeAt(i)|0;}return (parentid+hash>>>0)%FS.nameTable.length}),hashAddNode:(function(node){var hash=FS.hashName(node.parent.id,node.name);node.name_next=FS.nameTable[hash];FS.nameTable[hash]=node;}),hashRemoveNode:(function(node){var hash=FS.hashName(node.parent.id,node.name);if(FS.nameTable[hash]===node){FS.nameTable[hash]=node.name_next;}else {var current=FS.nameTable[hash];while(current){if(current.name_next===node){current.name_next=node.name_next;break}current=current.name_next;}}}),lookupNode:(function(parent,name){var err=FS.mayLookup(parent);if(err){throw new FS.ErrnoError(err,parent)}var hash=FS.hashName(parent.id,name);for(var node=FS.nameTable[hash];node;node=node.name_next){var nodeName=node.name;if(node.parent.id===parent.id&&nodeName===name){return node}}return FS.lookup(parent,name)}),createNode:(function(parent,name,mode,rdev){if(!FS.FSNode){FS.FSNode=(function(parent,name,mode,rdev){if(!parent){parent=this;}this.parent=parent;this.mount=parent.mount;this.mounted=null;this.id=FS.nextInode++;this.name=name;this.mode=mode;this.node_ops={};this.stream_ops={};this.rdev=rdev;});FS.FSNode.prototype={};var readMode=292|73;var writeMode=146;Object.defineProperties(FS.FSNode.prototype,{read:{get:(function(){return (this.mode&readMode)===readMode}),set:(function(val){val?this.mode|=readMode:this.mode&=~readMode;})},write:{get:(function(){return (this.mode&writeMode)===writeMode}),set:(function(val){val?this.mode|=writeMode:this.mode&=~writeMode;})},isFolder:{get:(function(){return FS.isDir(this.mode)})},isDevice:{get:(function(){return FS.isChrdev(this.mode)})}});}var node=new FS.FSNode(parent,name,mode,rdev);FS.hashAddNode(node);return node}),destroyNode:(function(node){FS.hashRemoveNode(node);}),isRoot:(function(node){return node===node.parent}),isMountpoint:(function(node){return !!node.mounted}),isFile:(function(mode){return (mode&61440)===32768}),isDir:(function(mode){return (mode&61440)===16384}),isLink:(function(mode){return (mode&61440)===40960}),isChrdev:(function(mode){return (mode&61440)===8192}),isBlkdev:(function(mode){return (mode&61440)===24576}),isFIFO:(function(mode){return (mode&61440)===4096}),isSocket:(function(mode){return (mode&49152)===49152}),flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:(function(str){var flags=FS.flagModes[str];if(typeof flags==="undefined"){throw new Error("Unknown file open mode: "+str)}return flags}),flagsToPermissionString:(function(flag){var perms=["r","w","rw"][flag&3];if(flag&512){perms+="w";}return perms}),nodePermissions:(function(node,perms){if(FS.ignorePermissions){return 0}if(perms.indexOf("r")!==-1&&!(node.mode&292)){return ERRNO_CODES.EACCES}else if(perms.indexOf("w")!==-1&&!(node.mode&146)){return ERRNO_CODES.EACCES}else if(perms.indexOf("x")!==-1&&!(node.mode&73)){return ERRNO_CODES.EACCES}return 0}),mayLookup:(function(dir){var err=FS.nodePermissions(dir,"x");if(err)return err;if(!dir.node_ops.lookup)return ERRNO_CODES.EACCES;return 0}),mayCreate:(function(dir,name){try{var node=FS.lookupNode(dir,name);return ERRNO_CODES.EEXIST}catch(e){}return FS.nodePermissions(dir,"wx")}),mayDelete:(function(dir,name,isdir){var node;try{node=FS.lookupNode(dir,name);}catch(e){return e.errno}var err=FS.nodePermissions(dir,"wx");if(err){return err}if(isdir){if(!FS.isDir(node.mode)){return ERRNO_CODES.ENOTDIR}if(FS.isRoot(node)||FS.getPath(node)===FS.cwd()){return ERRNO_CODES.EBUSY}}else {if(FS.isDir(node.mode)){return ERRNO_CODES.EISDIR}}return 0}),mayOpen:(function(node,flags){if(!node){return ERRNO_CODES.ENOENT}if(FS.isLink(node.mode)){return ERRNO_CODES.ELOOP}else if(FS.isDir(node.mode)){if(FS.flagsToPermissionString(flags)!=="r"||flags&512){return ERRNO_CODES.EISDIR}}return FS.nodePermissions(node,FS.flagsToPermissionString(flags))}),MAX_OPEN_FDS:4096,nextfd:(function(fd_start,fd_end){fd_start=fd_start||0;fd_end=fd_end||FS.MAX_OPEN_FDS;for(var fd=fd_start;fd<=fd_end;fd++){if(!FS.streams[fd]){return fd}}throw new FS.ErrnoError(ERRNO_CODES.EMFILE)}),getStream:(function(fd){return FS.streams[fd]}),createStream:(function(stream,fd_start,fd_end){if(!FS.FSStream){FS.FSStream=(function(){});FS.FSStream.prototype={};Object.defineProperties(FS.FSStream.prototype,{object:{get:(function(){return this.node}),set:(function(val){this.node=val;})},isRead:{get:(function(){return (this.flags&2097155)!==1})},isWrite:{get:(function(){return (this.flags&2097155)!==0})},isAppend:{get:(function(){return this.flags&1024})}});}var newStream=new FS.FSStream;for(var p in stream){newStream[p]=stream[p];}stream=newStream;var fd=FS.nextfd(fd_start,fd_end);stream.fd=fd;FS.streams[fd]=stream;return stream}),closeStream:(function(fd){FS.streams[fd]=null;}),chrdev_stream_ops:{open:(function(stream){var device=FS.getDevice(stream.node.rdev);stream.stream_ops=device.stream_ops;if(stream.stream_ops.open){stream.stream_ops.open(stream);}}),llseek:(function(){throw new FS.ErrnoError(ERRNO_CODES.ESPIPE)})},major:(function(dev){return dev>>8}),minor:(function(dev){return dev&255}),makedev:(function(ma,mi){return ma<<8|mi}),registerDevice:(function(dev,ops){FS.devices[dev]={stream_ops:ops};}),getDevice:(function(dev){return FS.devices[dev]}),getMounts:(function(mount){var mounts=[];var check=[mount];while(check.length){var m=check.pop();mounts.push(m);check.push.apply(check,m.mounts);}return mounts}),syncfs:(function(populate,callback){if(typeof populate==="function"){callback=populate;populate=false;}FS.syncFSRequests++;if(FS.syncFSRequests>1){console.log("warning: "+FS.syncFSRequests+" FS.syncfs operations in flight at once, probably just doing extra work");}var mounts=FS.getMounts(FS.root.mount);var completed=0;function doCallback(err){assert(FS.syncFSRequests>0);FS.syncFSRequests--;return callback(err)}function done(err){if(err){if(!done.errored){done.errored=true;return doCallback(err)}return}if(++completed>=mounts.length){doCallback(null);}}mounts.forEach((function(mount){if(!mount.type.syncfs){return done(null)}mount.type.syncfs(mount,populate,done);}));}),mount:(function(type,opts,mountpoint){var root=mountpoint==="/";var pseudo=!mountpoint;var node;if(root&&FS.root){throw new FS.ErrnoError(ERRNO_CODES.EBUSY)}else if(!root&&!pseudo){var lookup=FS.lookupPath(mountpoint,{follow_mount:false});mountpoint=lookup.path;node=lookup.node;if(FS.isMountpoint(node)){throw new FS.ErrnoError(ERRNO_CODES.EBUSY)}if(!FS.isDir(node.mode)){throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR)}}var mount={type:type,opts:opts,mountpoint:mountpoint,mounts:[]};var mountRoot=type.mount(mount);mountRoot.mount=mount;mount.root=mountRoot;if(root){FS.root=mountRoot;}else if(node){node.mounted=mount;if(node.mount){node.mount.mounts.push(mount);}}return mountRoot}),unmount:(function(mountpoint){var lookup=FS.lookupPath(mountpoint,{follow_mount:false});if(!FS.isMountpoint(lookup.node)){throw new FS.ErrnoError(ERRNO_CODES.EINVAL)}var node=lookup.node;var mount=node.mounted;var mounts=FS.getMounts(mount);Object.keys(FS.nameTable).forEach((function(hash){var current=FS.nameTable[hash];while(current){var next=current.name_next;if(mounts.indexOf(current.mount)!==-1){FS.destroyNode(current);}current=next;}}));node.mounted=null;var idx=node.mount.mounts.indexOf(mount);assert(idx!==-1);node.mount.mounts.splice(idx,1);}),lookup:(function(parent,name){return parent.node_ops.lookup(parent,name)}),mknod:(function(path,mode,dev){var lookup=FS.lookupPath(path,{parent:true});var parent=lookup.node;var name=PATH.basename(path);if(!name||name==="."||name===".."){throw new FS.ErrnoError(ERRNO_CODES.EINVAL)}var err=FS.mayCreate(parent,name);if(err){throw new FS.ErrnoError(err)}if(!parent.node_ops.mknod){throw new FS.ErrnoError(ERRNO_CODES.EPERM)}return parent.node_ops.mknod(parent,name,mode,dev)}),create:(function(path,mode){mode=mode!==undefined?mode:438;mode&=4095;mode|=32768;return FS.mknod(path,mode,0)}),mkdir:(function(path,mode){mode=mode!==undefined?mode:511;mode&=511|512;mode|=16384;return FS.mknod(path,mode,0)}),mkdirTree:(function(path,mode){var dirs=path.split("/");var d="";for(var i=0;i<dirs.length;++i){if(!dirs[i])continue;d+="/"+dirs[i];try{FS.mkdir(d,mode);}catch(e){if(e.errno!=ERRNO_CODES.EEXIST)throw e}}}),mkdev:(function(path,mode,dev){if(typeof dev==="undefined"){dev=mode;mode=438;}mode|=8192;return FS.mknod(path,mode,dev)}),symlink:(function(oldpath,newpath){if(!PATH.resolve(oldpath)){throw new FS.ErrnoError(ERRNO_CODES.ENOENT)}var lookup=FS.lookupPath(newpath,{parent:true});var parent=lookup.node;if(!parent){throw new FS.ErrnoError(ERRNO_CODES.ENOENT)}var newname=PATH.basename(newpath);var err=FS.mayCreate(parent,newname);if(err){throw new FS.ErrnoError(err)}if(!parent.node_ops.symlink){throw new FS.ErrnoError(ERRNO_CODES.EPERM)}return parent.node_ops.symlink(parent,newname,oldpath)}),rename:(function(old_path,new_path){var old_dirname=PATH.dirname(old_path);var new_dirname=PATH.dirname(new_path);var old_name=PATH.basename(old_path);var new_name=PATH.basename(new_path);var lookup,old_dir,new_dir;try{lookup=FS.lookupPath(old_path,{parent:true});old_dir=lookup.node;lookup=FS.lookupPath(new_path,{parent:true});new_dir=lookup.node;}catch(e){throw new FS.ErrnoError(ERRNO_CODES.EBUSY)}if(!old_dir||!new_dir)throw new FS.ErrnoError(ERRNO_CODES.ENOENT);if(old_dir.mount!==new_dir.mount){throw new FS.ErrnoError(ERRNO_CODES.EXDEV)}var old_node=FS.lookupNode(old_dir,old_name);var relative=PATH.relative(old_path,new_dirname);if(relative.charAt(0)!=="."){throw new FS.ErrnoError(ERRNO_CODES.EINVAL)}relative=PATH.relative(new_path,old_dirname);if(relative.charAt(0)!=="."){throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY)}var new_node;try{new_node=FS.lookupNode(new_dir,new_name);}catch(e){}if(old_node===new_node){return}var isdir=FS.isDir(old_node.mode);var err=FS.mayDelete(old_dir,old_name,isdir);if(err){throw new FS.ErrnoError(err)}err=new_node?FS.mayDelete(new_dir,new_name,isdir):FS.mayCreate(new_dir,new_name);if(err){throw new FS.ErrnoError(err)}if(!old_dir.node_ops.rename){throw new FS.ErrnoError(ERRNO_CODES.EPERM)}if(FS.isMountpoint(old_node)||new_node&&FS.isMountpoint(new_node)){throw new FS.ErrnoError(ERRNO_CODES.EBUSY)}if(new_dir!==old_dir){err=FS.nodePermissions(old_dir,"w");if(err){throw new FS.ErrnoError(err)}}try{if(FS.trackingDelegate["willMovePath"]){FS.trackingDelegate["willMovePath"](old_path,new_path);}}catch(e){console.log("FS.trackingDelegate['willMovePath']('"+old_path+"', '"+new_path+"') threw an exception: "+e.message);}FS.hashRemoveNode(old_node);try{old_dir.node_ops.rename(old_node,new_dir,new_name);}catch(e){throw e}finally{FS.hashAddNode(old_node);}try{if(FS.trackingDelegate["onMovePath"])FS.trackingDelegate["onMovePath"](old_path,new_path);}catch(e){console.log("FS.trackingDelegate['onMovePath']('"+old_path+"', '"+new_path+"') threw an exception: "+e.message);}}),rmdir:(function(path){var lookup=FS.lookupPath(path,{parent:true});var parent=lookup.node;var name=PATH.basename(path);var node=FS.lookupNode(parent,name);var err=FS.mayDelete(parent,name,true);if(err){throw new FS.ErrnoError(err)}if(!parent.node_ops.rmdir){throw new FS.ErrnoError(ERRNO_CODES.EPERM)}if(FS.isMountpoint(node)){throw new FS.ErrnoError(ERRNO_CODES.EBUSY)}try{if(FS.trackingDelegate["willDeletePath"]){FS.trackingDelegate["willDeletePath"](path);}}catch(e){console.log("FS.trackingDelegate['willDeletePath']('"+path+"') threw an exception: "+e.message);}parent.node_ops.rmdir(parent,name);FS.destroyNode(node);try{if(FS.trackingDelegate["onDeletePath"])FS.trackingDelegate["onDeletePath"](path);}catch(e){console.log("FS.trackingDelegate['onDeletePath']('"+path+"') threw an exception: "+e.message);}}),readdir:(function(path){var lookup=FS.lookupPath(path,{follow:true});var node=lookup.node;if(!node.node_ops.readdir){throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR)}return node.node_ops.readdir(node)}),unlink:(function(path){var lookup=FS.lookupPath(path,{parent:true});var parent=lookup.node;var name=PATH.basename(path);var node=FS.lookupNode(parent,name);var err=FS.mayDelete(parent,name,false);if(err){throw new FS.ErrnoError(err)}if(!parent.node_ops.unlink){throw new FS.ErrnoError(ERRNO_CODES.EPERM)}if(FS.isMountpoint(node)){throw new FS.ErrnoError(ERRNO_CODES.EBUSY)}try{if(FS.trackingDelegate["willDeletePath"]){FS.trackingDelegate["willDeletePath"](path);}}catch(e){console.log("FS.trackingDelegate['willDeletePath']('"+path+"') threw an exception: "+e.message);}parent.node_ops.unlink(parent,name);FS.destroyNode(node);try{if(FS.trackingDelegate["onDeletePath"])FS.trackingDelegate["onDeletePath"](path);}catch(e){console.log("FS.trackingDelegate['onDeletePath']('"+path+"') threw an exception: "+e.message);}}),readlink:(function(path){var lookup=FS.lookupPath(path);var link=lookup.node;if(!link){throw new FS.ErrnoError(ERRNO_CODES.ENOENT)}if(!link.node_ops.readlink){throw new FS.ErrnoError(ERRNO_CODES.EINVAL)}return PATH.resolve(FS.getPath(link.parent),link.node_ops.readlink(link))}),stat:(function(path,dontFollow){var lookup=FS.lookupPath(path,{follow:!dontFollow});var node=lookup.node;if(!node){throw new FS.ErrnoError(ERRNO_CODES.ENOENT)}if(!node.node_ops.getattr){throw new FS.ErrnoError(ERRNO_CODES.EPERM)}return node.node_ops.getattr(node)}),lstat:(function(path){return FS.stat(path,true)}),chmod:(function(path,mode,dontFollow){var node;if(typeof path==="string"){var lookup=FS.lookupPath(path,{follow:!dontFollow});node=lookup.node;}else {node=path;}if(!node.node_ops.setattr){throw new FS.ErrnoError(ERRNO_CODES.EPERM)}node.node_ops.setattr(node,{mode:mode&4095|node.mode&~4095,timestamp:Date.now()});}),lchmod:(function(path,mode){FS.chmod(path,mode,true);}),fchmod:(function(fd,mode){var stream=FS.getStream(fd);if(!stream){throw new FS.ErrnoError(ERRNO_CODES.EBADF)}FS.chmod(stream.node,mode);}),chown:(function(path,uid,gid,dontFollow){var node;if(typeof path==="string"){var lookup=FS.lookupPath(path,{follow:!dontFollow});node=lookup.node;}else {node=path;}if(!node.node_ops.setattr){throw new FS.ErrnoError(ERRNO_CODES.EPERM)}node.node_ops.setattr(node,{timestamp:Date.now()});}),lchown:(function(path,uid,gid){FS.chown(path,uid,gid,true);}),fchown:(function(fd,uid,gid){var stream=FS.getStream(fd);if(!stream){throw new FS.ErrnoError(ERRNO_CODES.EBADF)}FS.chown(stream.node,uid,gid);}),truncate:(function(path,len){if(len<0){throw new FS.ErrnoError(ERRNO_CODES.EINVAL)}var node;if(typeof path==="string"){var lookup=FS.lookupPath(path,{follow:true});node=lookup.node;}else {node=path;}if(!node.node_ops.setattr){throw new FS.ErrnoError(ERRNO_CODES.EPERM)}if(FS.isDir(node.mode)){throw new FS.ErrnoError(ERRNO_CODES.EISDIR)}if(!FS.isFile(node.mode)){throw new FS.ErrnoError(ERRNO_CODES.EINVAL)}var err=FS.nodePermissions(node,"w");if(err){throw new FS.ErrnoError(err)}node.node_ops.setattr(node,{size:len,timestamp:Date.now()});}),ftruncate:(function(fd,len){var stream=FS.getStream(fd);if(!stream){throw new FS.ErrnoError(ERRNO_CODES.EBADF)}if((stream.flags&2097155)===0){throw new FS.ErrnoError(ERRNO_CODES.EINVAL)}FS.truncate(stream.node,len);}),utime:(function(path,atime,mtime){var lookup=FS.lookupPath(path,{follow:true});var node=lookup.node;node.node_ops.setattr(node,{timestamp:Math.max(atime,mtime)});}),open:(function(path,flags,mode,fd_start,fd_end){if(path===""){throw new FS.ErrnoError(ERRNO_CODES.ENOENT)}flags=typeof flags==="string"?FS.modeStringToFlags(flags):flags;mode=typeof mode==="undefined"?438:mode;if(flags&64){mode=mode&4095|32768;}else {mode=0;}var node;if(typeof path==="object"){node=path;}else {path=PATH.normalize(path);try{var lookup=FS.lookupPath(path,{follow:!(flags&131072)});node=lookup.node;}catch(e){}}var created=false;if(flags&64){if(node){if(flags&128){throw new FS.ErrnoError(ERRNO_CODES.EEXIST)}}else {node=FS.mknod(path,mode,0);created=true;}}if(!node){throw new FS.ErrnoError(ERRNO_CODES.ENOENT)}if(FS.isChrdev(node.mode)){flags&=~512;}if(flags&65536&&!FS.isDir(node.mode)){throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR)}if(!created){var err=FS.mayOpen(node,flags);if(err){throw new FS.ErrnoError(err)}}if(flags&512){FS.truncate(node,0);}flags&=~(128|512);var stream=FS.createStream({node:node,path:FS.getPath(node),flags:flags,seekable:true,position:0,stream_ops:node.stream_ops,ungotten:[],error:false},fd_start,fd_end);if(stream.stream_ops.open){stream.stream_ops.open(stream);}if(Module["logReadFiles"]&&!(flags&1)){if(!FS.readFiles)FS.readFiles={};if(!(path in FS.readFiles)){FS.readFiles[path]=1;Module["printErr"]("read file: "+path);}}try{if(FS.trackingDelegate["onOpenFile"]){var trackingFlags=0;if((flags&2097155)!==1){trackingFlags|=FS.tracking.openFlags.READ;}if((flags&2097155)!==0){trackingFlags|=FS.tracking.openFlags.WRITE;}FS.trackingDelegate["onOpenFile"](path,trackingFlags);}}catch(e){console.log("FS.trackingDelegate['onOpenFile']('"+path+"', flags) threw an exception: "+e.message);}return stream}),close:(function(stream){if(stream.getdents)stream.getdents=null;try{if(stream.stream_ops.close){stream.stream_ops.close(stream);}}catch(e){throw e}finally{FS.closeStream(stream.fd);}}),llseek:(function(stream,offset,whence){if(!stream.seekable||!stream.stream_ops.llseek){throw new FS.ErrnoError(ERRNO_CODES.ESPIPE)}stream.position=stream.stream_ops.llseek(stream,offset,whence);stream.ungotten=[];return stream.position}),read:(function(stream,buffer,offset,length,position){if(length<0||position<0){throw new FS.ErrnoError(ERRNO_CODES.EINVAL)}if((stream.flags&2097155)===1){throw new FS.ErrnoError(ERRNO_CODES.EBADF)}if(FS.isDir(stream.node.mode)){throw new FS.ErrnoError(ERRNO_CODES.EISDIR)}if(!stream.stream_ops.read){throw new FS.ErrnoError(ERRNO_CODES.EINVAL)}var seeking=true;if(typeof position==="undefined"){position=stream.position;seeking=false;}else if(!stream.seekable){throw new FS.ErrnoError(ERRNO_CODES.ESPIPE)}var bytesRead=stream.stream_ops.read(stream,buffer,offset,length,position);if(!seeking)stream.position+=bytesRead;return bytesRead}),write:(function(stream,buffer,offset,length,position,canOwn){if(length<0||position<0){throw new FS.ErrnoError(ERRNO_CODES.EINVAL)}if((stream.flags&2097155)===0){throw new FS.ErrnoError(ERRNO_CODES.EBADF)}if(FS.isDir(stream.node.mode)){throw new FS.ErrnoError(ERRNO_CODES.EISDIR)}if(!stream.stream_ops.write){throw new FS.ErrnoError(ERRNO_CODES.EINVAL)}if(stream.flags&1024){FS.llseek(stream,0,2);}var seeking=true;if(typeof position==="undefined"){position=stream.position;seeking=false;}else if(!stream.seekable){throw new FS.ErrnoError(ERRNO_CODES.ESPIPE)}var bytesWritten=stream.stream_ops.write(stream,buffer,offset,length,position,canOwn);if(!seeking)stream.position+=bytesWritten;try{if(stream.path&&FS.trackingDelegate["onWriteToFile"])FS.trackingDelegate["onWriteToFile"](stream.path);}catch(e){console.log("FS.trackingDelegate['onWriteToFile']('"+path+"') threw an exception: "+e.message);}return bytesWritten}),allocate:(function(stream,offset,length){if(offset<0||length<=0){throw new FS.ErrnoError(ERRNO_CODES.EINVAL)}if((stream.flags&2097155)===0){throw new FS.ErrnoError(ERRNO_CODES.EBADF)}if(!FS.isFile(stream.node.mode)&&!FS.isDir(stream.node.mode)){throw new FS.ErrnoError(ERRNO_CODES.ENODEV)}if(!stream.stream_ops.allocate){throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP)}stream.stream_ops.allocate(stream,offset,length);}),mmap:(function(stream,buffer,offset,length,position,prot,flags){if((stream.flags&2097155)===1){throw new FS.ErrnoError(ERRNO_CODES.EACCES)}if(!stream.stream_ops.mmap){throw new FS.ErrnoError(ERRNO_CODES.ENODEV)}return stream.stream_ops.mmap(stream,buffer,offset,length,position,prot,flags)}),msync:(function(stream,buffer,offset,length,mmapFlags){if(!stream||!stream.stream_ops.msync){return 0}return stream.stream_ops.msync(stream,buffer,offset,length,mmapFlags)}),munmap:(function(stream){return 0}),ioctl:(function(stream,cmd,arg){if(!stream.stream_ops.ioctl){throw new FS.ErrnoError(ERRNO_CODES.ENOTTY)}return stream.stream_ops.ioctl(stream,cmd,arg)}),readFile:(function(path,opts){opts=opts||{};opts.flags=opts.flags||"r";opts.encoding=opts.encoding||"binary";if(opts.encoding!=="utf8"&&opts.encoding!=="binary"){throw new Error('Invalid encoding type "'+opts.encoding+'"')}var ret;var stream=FS.open(path,opts.flags);var stat=FS.stat(path);var length=stat.size;var buf=new Uint8Array(length);FS.read(stream,buf,0,length,0);if(opts.encoding==="utf8"){ret=UTF8ArrayToString(buf,0);}else if(opts.encoding==="binary"){ret=buf;}FS.close(stream);return ret}),writeFile:(function(path,data,opts){opts=opts||{};opts.flags=opts.flags||"w";opts.encoding=opts.encoding||"utf8";if(opts.encoding!=="utf8"&&opts.encoding!=="binary"){throw new Error('Invalid encoding type "'+opts.encoding+'"')}var stream=FS.open(path,opts.flags,opts.mode);if(opts.encoding==="utf8"){var buf=new Uint8Array(lengthBytesUTF8(data)+1);var actualNumBytes=stringToUTF8Array(data,buf,0,buf.length);FS.write(stream,buf,0,actualNumBytes,0,opts.canOwn);}else if(opts.encoding==="binary"){FS.write(stream,data,0,data.length,0,opts.canOwn);}FS.close(stream);}),cwd:(function(){return FS.currentPath}),chdir:(function(path){var lookup=FS.lookupPath(path,{follow:true});if(lookup.node===null){throw new FS.ErrnoError(ERRNO_CODES.ENOENT)}if(!FS.isDir(lookup.node.mode)){throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR)}var err=FS.nodePermissions(lookup.node,"x");if(err){throw new FS.ErrnoError(err)}FS.currentPath=lookup.path;}),createDefaultDirectories:(function(){FS.mkdir("/tmp");FS.mkdir("/home");FS.mkdir("/home/web_user");}),createDefaultDevices:(function(){FS.mkdir("/dev");FS.registerDevice(FS.makedev(1,3),{read:(function(){return 0}),write:(function(stream,buffer,offset,length,pos){return length})});FS.mkdev("/dev/null",FS.makedev(1,3));TTY.register(FS.makedev(5,0),TTY.default_tty_ops);TTY.register(FS.makedev(6,0),TTY.default_tty1_ops);FS.mkdev("/dev/tty",FS.makedev(5,0));FS.mkdev("/dev/tty1",FS.makedev(6,0));var random_device;if(typeof crypto!=="undefined"){var randomBuffer=new Uint8Array(1);random_device=(function(){crypto.getRandomValues(randomBuffer);return randomBuffer[0]});}else if(ENVIRONMENT_IS_NODE){random_device=(function(){return crypto$1.randomBytes(1)[0]});}else {random_device=(function(){return Math.random()*256|0});}FS.createDevice("/dev","random",random_device);FS.createDevice("/dev","urandom",random_device);FS.mkdir("/dev/shm");FS.mkdir("/dev/shm/tmp");}),createSpecialDirectories:(function(){FS.mkdir("/proc");FS.mkdir("/proc/self");FS.mkdir("/proc/self/fd");FS.mount({mount:(function(){var node=FS.createNode("/proc/self","fd",16384|511,73);node.node_ops={lookup:(function(parent,name){var fd=+name;var stream=FS.getStream(fd);if(!stream)throw new FS.ErrnoError(ERRNO_CODES.EBADF);var ret={parent:null,mount:{mountpoint:"fake"},node_ops:{readlink:(function(){return stream.path})}};ret.parent=ret;return ret})};return node})},{},"/proc/self/fd");}),createStandardStreams:(function(){if(Module["stdin"]){FS.createDevice("/dev","stdin",Module["stdin"]);}else {FS.symlink("/dev/tty","/dev/stdin");}if(Module["stdout"]){FS.createDevice("/dev","stdout",null,Module["stdout"]);}else {FS.symlink("/dev/tty","/dev/stdout");}if(Module["stderr"]){FS.createDevice("/dev","stderr",null,Module["stderr"]);}else {FS.symlink("/dev/tty1","/dev/stderr");}var stdin=FS.open("/dev/stdin","r");assert(stdin.fd===0,"invalid handle for stdin ("+stdin.fd+")");var stdout=FS.open("/dev/stdout","w");assert(stdout.fd===1,"invalid handle for stdout ("+stdout.fd+")");var stderr=FS.open("/dev/stderr","w");assert(stderr.fd===2,"invalid handle for stderr ("+stderr.fd+")");}),ensureErrnoError:(function(){if(FS.ErrnoError)return;FS.ErrnoError=function ErrnoError(errno,node){this.node=node;this.setErrno=(function(errno){this.errno=errno;for(var key in ERRNO_CODES){if(ERRNO_CODES[key]===errno){this.code=key;break}}});this.setErrno(errno);this.message=ERRNO_MESSAGES[errno];};FS.ErrnoError.prototype=new Error;FS.ErrnoError.prototype.constructor=FS.ErrnoError;[ERRNO_CODES.ENOENT].forEach((function(code){FS.genericErrors[code]=new FS.ErrnoError(code);FS.genericErrors[code].stack="<generic error, no stack>";}));}),staticInit:(function(){FS.ensureErrnoError();FS.nameTable=new Array(4096);FS.mount(MEMFS,{},"/");FS.createDefaultDirectories();FS.createDefaultDevices();FS.createSpecialDirectories();FS.filesystems={"MEMFS":MEMFS,"IDBFS":IDBFS,"NODEFS":NODEFS,"WORKERFS":WORKERFS};}),init:(function(input,output,error){assert(!FS.init.initialized,"FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)");FS.init.initialized=true;FS.ensureErrnoError();Module["stdin"]=input||Module["stdin"];Module["stdout"]=output||Module["stdout"];Module["stderr"]=error||Module["stderr"];FS.createStandardStreams();}),quit:(function(){FS.init.initialized=false;var fflush=Module["_fflush"];if(fflush)fflush(0);for(var i=0;i<FS.streams.length;i++){var stream=FS.streams[i];if(!stream){continue}FS.close(stream);}}),getMode:(function(canRead,canWrite){var mode=0;if(canRead)mode|=292|73;if(canWrite)mode|=146;return mode}),joinPath:(function(parts,forceRelative){var path=PATH.join.apply(null,parts);if(forceRelative&&path[0]=="/")path=path.substr(1);return path}),absolutePath:(function(relative,base){return PATH.resolve(base,relative)}),standardizePath:(function(path){return PATH.normalize(path)}),findObject:(function(path,dontResolveLastLink){var ret=FS.analyzePath(path,dontResolveLastLink);if(ret.exists){return ret.object}else {___setErrNo(ret.error);return null}}),analyzePath:(function(path,dontResolveLastLink){try{var lookup=FS.lookupPath(path,{follow:!dontResolveLastLink});path=lookup.path;}catch(e){}var ret={isRoot:false,exists:false,error:0,name:null,path:null,object:null,parentExists:false,parentPath:null,parentObject:null};try{var lookup=FS.lookupPath(path,{parent:true});ret.parentExists=true;ret.parentPath=lookup.path;ret.parentObject=lookup.node;ret.name=PATH.basename(path);lookup=FS.lookupPath(path,{follow:!dontResolveLastLink});ret.exists=true;ret.path=lookup.path;ret.object=lookup.node;ret.name=lookup.node.name;ret.isRoot=lookup.path==="/";}catch(e){ret.error=e.errno;}return ret}),createFolder:(function(parent,name,canRead,canWrite){var path=PATH.join2(typeof parent==="string"?parent:FS.getPath(parent),name);var mode=FS.getMode(canRead,canWrite);return FS.mkdir(path,mode)}),createPath:(function(parent,path,canRead,canWrite){parent=typeof parent==="string"?parent:FS.getPath(parent);var parts=path.split("/").reverse();while(parts.length){var part=parts.pop();if(!part)continue;var current=PATH.join2(parent,part);try{FS.mkdir(current);}catch(e){}parent=current;}return current}),createFile:(function(parent,name,properties,canRead,canWrite){var path=PATH.join2(typeof parent==="string"?parent:FS.getPath(parent),name);var mode=FS.getMode(canRead,canWrite);return FS.create(path,mode)}),createDataFile:(function(parent,name,data,canRead,canWrite,canOwn){var path=name?PATH.join2(typeof parent==="string"?parent:FS.getPath(parent),name):parent;var mode=FS.getMode(canRead,canWrite);var node=FS.create(path,mode);if(data){if(typeof data==="string"){var arr=new Array(data.length);for(var i=0,len=data.length;i<len;++i)arr[i]=data.charCodeAt(i);data=arr;}FS.chmod(node,mode|146);var stream=FS.open(node,"w");FS.write(stream,data,0,data.length,0,canOwn);FS.close(stream);FS.chmod(node,mode);}return node}),createDevice:(function(parent,name,input,output){var path=PATH.join2(typeof parent==="string"?parent:FS.getPath(parent),name);var mode=FS.getMode(!!input,!!output);if(!FS.createDevice.major)FS.createDevice.major=64;var dev=FS.makedev(FS.createDevice.major++,0);FS.registerDevice(dev,{open:(function(stream){stream.seekable=false;}),close:(function(stream){if(output&&output.buffer&&output.buffer.length){output(10);}}),read:(function(stream,buffer,offset,length,pos){var bytesRead=0;for(var i=0;i<length;i++){var result;try{result=input();}catch(e){throw new FS.ErrnoError(ERRNO_CODES.EIO)}if(result===undefined&&bytesRead===0){throw new FS.ErrnoError(ERRNO_CODES.EAGAIN)}if(result===null||result===undefined)break;bytesRead++;buffer[offset+i]=result;}if(bytesRead){stream.node.timestamp=Date.now();}return bytesRead}),write:(function(stream,buffer,offset,length,pos){for(var i=0;i<length;i++){try{output(buffer[offset+i]);}catch(e){throw new FS.ErrnoError(ERRNO_CODES.EIO)}}if(length){stream.node.timestamp=Date.now();}return i})});return FS.mkdev(path,mode,dev)}),createLink:(function(parent,name,target,canRead,canWrite){var path=PATH.join2(typeof parent==="string"?parent:FS.getPath(parent),name);return FS.symlink(target,path)}),forceLoadFile:(function(obj){if(obj.isDevice||obj.isFolder||obj.link||obj.contents)return true;var success=true;if(typeof XMLHttpRequest!=="undefined"){throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.")}else if(Module["read"]){try{obj.contents=intArrayFromString(Module["read"](obj.url),true);obj.usedBytes=obj.contents.length;}catch(e){success=false;}}else {throw new Error("Cannot load without read() or XMLHttpRequest.")}if(!success)___setErrNo(ERRNO_CODES.EIO);return success}),createLazyFile:(function(parent,name,url,canRead,canWrite){function LazyUint8Array(){this.lengthKnown=false;this.chunks=[];}LazyUint8Array.prototype.get=function LazyUint8Array_get(idx){if(idx>this.length-1||idx<0){return undefined}var chunkOffset=idx%this.chunkSize;var chunkNum=idx/this.chunkSize|0;return this.getter(chunkNum)[chunkOffset]};LazyUint8Array.prototype.setDataGetter=function LazyUint8Array_setDataGetter(getter){this.getter=getter;};LazyUint8Array.prototype.cacheLength=function LazyUint8Array_cacheLength(){var xhr=new XMLHttpRequest;xhr.open("HEAD",url,false);xhr.send(null);if(!(xhr.status>=200&&xhr.status<300||xhr.status===304))throw new Error("Couldn't load "+url+". Status: "+xhr.status);var datalength=Number(xhr.getResponseHeader("Content-length"));var header;var hasByteServing=(header=xhr.getResponseHeader("Accept-Ranges"))&&header==="bytes";var usesGzip=(header=xhr.getResponseHeader("Content-Encoding"))&&header==="gzip";var chunkSize=1024*1024;if(!hasByteServing)chunkSize=datalength;var doXHR=(function(from,to){if(from>to)throw new Error("invalid range ("+from+", "+to+") or no bytes requested!");if(to>datalength-1)throw new Error("only "+datalength+" bytes available! programmer error!");var xhr=new XMLHttpRequest;xhr.open("GET",url,false);if(datalength!==chunkSize)xhr.setRequestHeader("Range","bytes="+from+"-"+to);if(typeof Uint8Array!="undefined")xhr.responseType="arraybuffer";if(xhr.overrideMimeType){xhr.overrideMimeType("text/plain; charset=x-user-defined");}xhr.send(null);if(!(xhr.status>=200&&xhr.status<300||xhr.status===304))throw new Error("Couldn't load "+url+". Status: "+xhr.status);if(xhr.response!==undefined){return new Uint8Array(xhr.response||[])}else {return intArrayFromString(xhr.responseText||"",true)}});var lazyArray=this;lazyArray.setDataGetter((function(chunkNum){var start=chunkNum*chunkSize;var end=(chunkNum+1)*chunkSize-1;end=Math.min(end,datalength-1);if(typeof lazyArray.chunks[chunkNum]==="undefined"){lazyArray.chunks[chunkNum]=doXHR(start,end);}if(typeof lazyArray.chunks[chunkNum]==="undefined")throw new Error("doXHR failed!");return lazyArray.chunks[chunkNum]}));if(usesGzip||!datalength){chunkSize=datalength=1;datalength=this.getter(0).length;chunkSize=datalength;console.log("LazyFiles on gzip forces download of the whole file when length is accessed");}this._length=datalength;this._chunkSize=chunkSize;this.lengthKnown=true;};if(typeof XMLHttpRequest!=="undefined"){if(!ENVIRONMENT_IS_WORKER)throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";var lazyArray=new LazyUint8Array;Object.defineProperties(lazyArray,{length:{get:(function(){if(!this.lengthKnown){this.cacheLength();}return this._length})},chunkSize:{get:(function(){if(!this.lengthKnown){this.cacheLength();}return this._chunkSize})}});var properties={isDevice:false,contents:lazyArray};}else {var properties={isDevice:false,url:url};}var node=FS.createFile(parent,name,properties,canRead,canWrite);if(properties.contents){node.contents=properties.contents;}else if(properties.url){node.contents=null;node.url=properties.url;}Object.defineProperties(node,{usedBytes:{get:(function(){return this.contents.length})}});var stream_ops={};var keys=Object.keys(node.stream_ops);keys.forEach((function(key){var fn=node.stream_ops[key];stream_ops[key]=function forceLoadLazyFile(){if(!FS.forceLoadFile(node)){throw new FS.ErrnoError(ERRNO_CODES.EIO)}return fn.apply(null,arguments)};}));stream_ops.read=function stream_ops_read(stream,buffer,offset,length,position){if(!FS.forceLoadFile(node)){throw new FS.ErrnoError(ERRNO_CODES.EIO)}var contents=stream.node.contents;if(position>=contents.length)return 0;var size=Math.min(contents.length-position,length);assert(size>=0);if(contents.slice){for(var i=0;i<size;i++){buffer[offset+i]=contents[position+i];}}else {for(var i=0;i<size;i++){buffer[offset+i]=contents.get(position+i);}}return size};node.stream_ops=stream_ops;return node}),createPreloadedFile:(function(parent,name,url,canRead,canWrite,onload,onerror,dontCreateFile,canOwn,preFinish){Browser.init();var fullname=name?PATH.resolve(PATH.join2(parent,name)):parent;function processData(byteArray){function finish(byteArray){if(preFinish)preFinish();if(!dontCreateFile){FS.createDataFile(parent,name,byteArray,canRead,canWrite,canOwn);}if(onload)onload();removeRunDependency();}var handled=false;Module["preloadPlugins"].forEach((function(plugin){if(handled)return;if(plugin["canHandle"](fullname)){plugin["handle"](byteArray,fullname,finish,(function(){if(onerror)onerror();removeRunDependency();}));handled=true;}}));if(!handled)finish(byteArray);}addRunDependency();if(typeof url=="string"){Browser.asyncLoad(url,(function(byteArray){processData(byteArray);}),onerror);}else {processData(url);}}),indexedDB:(function(){return window.indexedDB||window.mozIndexedDB||window.webkitIndexedDB||window.msIndexedDB}),DB_NAME:(function(){return "EM_FS_"+window.location.pathname}),DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:(function(paths,onload,onerror){onload=onload||(function(){});onerror=onerror||(function(){});var indexedDB=FS.indexedDB();try{var openRequest=indexedDB.open(FS.DB_NAME(),FS.DB_VERSION);}catch(e){return onerror(e)}openRequest.onupgradeneeded=function openRequest_onupgradeneeded(){console.log("creating db");var db=openRequest.result;db.createObjectStore(FS.DB_STORE_NAME);};openRequest.onsuccess=function openRequest_onsuccess(){var db=openRequest.result;var transaction=db.transaction([FS.DB_STORE_NAME],"readwrite");var files=transaction.objectStore(FS.DB_STORE_NAME);var ok=0,fail=0,total=paths.length;function finish(){if(fail==0)onload();else onerror();}paths.forEach((function(path){var putRequest=files.put(FS.analyzePath(path).object.contents,path);putRequest.onsuccess=function putRequest_onsuccess(){ok++;if(ok+fail==total)finish();};putRequest.onerror=function putRequest_onerror(){fail++;if(ok+fail==total)finish();};}));transaction.onerror=onerror;};openRequest.onerror=onerror;}),loadFilesFromDB:(function(paths,onload,onerror){onload=onload||(function(){});onerror=onerror||(function(){});var indexedDB=FS.indexedDB();try{var openRequest=indexedDB.open(FS.DB_NAME(),FS.DB_VERSION);}catch(e){return onerror(e)}openRequest.onupgradeneeded=onerror;openRequest.onsuccess=function openRequest_onsuccess(){var db=openRequest.result;try{var transaction=db.transaction([FS.DB_STORE_NAME],"readonly");}catch(e){onerror(e);return}var files=transaction.objectStore(FS.DB_STORE_NAME);var ok=0,fail=0,total=paths.length;function finish(){if(fail==0)onload();else onerror();}paths.forEach((function(path){var getRequest=files.get(path);getRequest.onsuccess=function getRequest_onsuccess(){if(FS.analyzePath(path).exists){FS.unlink(path);}FS.createDataFile(PATH.dirname(path),PATH.basename(path),getRequest.result,true,true,true);ok++;if(ok+fail==total)finish();};getRequest.onerror=function getRequest_onerror(){fail++;if(ok+fail==total)finish();};}));transaction.onerror=onerror;};openRequest.onerror=onerror;})};var SYSCALLS={DEFAULT_POLLMASK:5,mappings:{},umask:511,calculateAt:(function(dirfd,path){if(path[0]!=="/"){var dir;if(dirfd===-100){dir=FS.cwd();}else {var dirstream=FS.getStream(dirfd);if(!dirstream)throw new FS.ErrnoError(ERRNO_CODES.EBADF);dir=dirstream.path;}path=PATH.join2(dir,path);}return path}),doStat:(function(func,path,buf){try{var stat=func(path);}catch(e){if(e&&e.node&&PATH.normalize(path)!==PATH.normalize(FS.getPath(e.node))){return -ERRNO_CODES.ENOTDIR}throw e}HEAP32[buf>>2]=stat.dev;HEAP32[buf+4>>2]=0;HEAP32[buf+8>>2]=stat.ino;HEAP32[buf+12>>2]=stat.mode;HEAP32[buf+16>>2]=stat.nlink;HEAP32[buf+20>>2]=stat.uid;HEAP32[buf+24>>2]=stat.gid;HEAP32[buf+28>>2]=stat.rdev;HEAP32[buf+32>>2]=0;HEAP32[buf+36>>2]=stat.size;HEAP32[buf+40>>2]=4096;HEAP32[buf+44>>2]=stat.blocks;HEAP32[buf+48>>2]=stat.atime.getTime()/1e3|0;HEAP32[buf+52>>2]=0;HEAP32[buf+56>>2]=stat.mtime.getTime()/1e3|0;HEAP32[buf+60>>2]=0;HEAP32[buf+64>>2]=stat.ctime.getTime()/1e3|0;HEAP32[buf+68>>2]=0;HEAP32[buf+72>>2]=stat.ino;return 0}),doMsync:(function(addr,stream,len,flags){var buffer=new Uint8Array(HEAPU8.subarray(addr,addr+len));FS.msync(stream,buffer,0,len,flags);}),doMkdir:(function(path,mode){path=PATH.normalize(path);if(path[path.length-1]==="/")path=path.substr(0,path.length-1);FS.mkdir(path,mode,0);return 0}),doMknod:(function(path,mode,dev){switch(mode&61440){case 32768:case 8192:case 24576:case 4096:case 49152:break;default:return -ERRNO_CODES.EINVAL}FS.mknod(path,mode,dev);return 0}),doReadlink:(function(path,buf,bufsize){if(bufsize<=0)return -ERRNO_CODES.EINVAL;var ret=FS.readlink(path);var len=Math.min(bufsize,lengthBytesUTF8(ret));var endChar=HEAP8[buf+len];stringToUTF8(ret,buf,bufsize+1);HEAP8[buf+len]=endChar;return len}),doAccess:(function(path,amode){if(amode&~7){return -ERRNO_CODES.EINVAL}var node;var lookup=FS.lookupPath(path,{follow:true});node=lookup.node;var perms="";if(amode&4)perms+="r";if(amode&2)perms+="w";if(amode&1)perms+="x";if(perms&&FS.nodePermissions(node,perms)){return -ERRNO_CODES.EACCES}return 0}),doDup:(function(path,flags,suggestFD){var suggest=FS.getStream(suggestFD);if(suggest)FS.close(suggest);return FS.open(path,flags,0,suggestFD,suggestFD).fd}),doReadv:(function(stream,iov,iovcnt,offset){var ret=0;for(var i=0;i<iovcnt;i++){var ptr=HEAP32[iov+i*8>>2];var len=HEAP32[iov+(i*8+4)>>2];var curr=FS.read(stream,HEAP8,ptr,len,offset);if(curr<0)return -1;ret+=curr;if(curr<len)break}return ret}),doWritev:(function(stream,iov,iovcnt,offset){var ret=0;for(var i=0;i<iovcnt;i++){var ptr=HEAP32[iov+i*8>>2];var len=HEAP32[iov+(i*8+4)>>2];var curr=FS.write(stream,HEAP8,ptr,len,offset);if(curr<0)return -1;ret+=curr;}return ret}),varargs:0,get:(function(varargs){SYSCALLS.varargs+=4;var ret=HEAP32[SYSCALLS.varargs-4>>2];return ret}),getStr:(function(){var ret=Pointer_stringify(SYSCALLS.get());return ret}),getStreamFromFD:(function(){var stream=FS.getStream(SYSCALLS.get());if(!stream)throw new FS.ErrnoError(ERRNO_CODES.EBADF);return stream}),getSocketFromFD:(function(){var socket=SOCKFS.getSocket(SYSCALLS.get());if(!socket)throw new FS.ErrnoError(ERRNO_CODES.EBADF);return socket}),getSocketAddress:(function(allowNull){var addrp=SYSCALLS.get(),addrlen=SYSCALLS.get();if(allowNull&&addrp===0)return null;var info=__read_sockaddr(addrp,addrlen);if(info.errno)throw new FS.ErrnoError(info.errno);info.addr=DNS.lookup_addr(info.addr)||info.addr;return info}),get64:(function(){var low=SYSCALLS.get(),high=SYSCALLS.get();if(low>=0)assert(high===0);else assert(high===-1);return low}),getZero:(function(){assert(SYSCALLS.get()===0);})};function ___syscall54(which,varargs){SYSCALLS.varargs=varargs;try{var stream=SYSCALLS.getStreamFromFD(),op=SYSCALLS.get();switch(op){case 21505:{if(!stream.tty)return -ERRNO_CODES.ENOTTY;return 0};case 21506:{if(!stream.tty)return -ERRNO_CODES.ENOTTY;return 0};case 21519:{if(!stream.tty)return -ERRNO_CODES.ENOTTY;var argp=SYSCALLS.get();HEAP32[argp>>2]=0;return 0};case 21520:{if(!stream.tty)return -ERRNO_CODES.ENOTTY;return -ERRNO_CODES.EINVAL};case 21531:{var argp=SYSCALLS.get();return FS.ioctl(stream,op,argp)};case 21523:{if(!stream.tty)return -ERRNO_CODES.ENOTTY;return 0};default:abort("bad ioctl syscall "+op);}}catch(e){if(typeof FS==="undefined"||!(e instanceof FS.ErrnoError))abort(e);return -e.errno}}function __Unwind_GetIPInfo(){abort("Unwind_GetIPInfo");}function _pthread_cond_init(){return 0}function __emscripten_traverse_stack(args){if(!args||!args.callee||!args.callee.name){return [null,"",""]}var funstr=args.callee.toString();var funcname=args.callee.name;var str="(";var first=true;for(i in args){var a=args[i];if(!first){str+=", ";}first=false;if(typeof a==="number"||typeof a==="string"){str+=a;}else {str+="("+typeof a+")";}}str+=")";var caller=args.callee.caller;args=caller?caller.arguments:[];if(first)str="";return [args,funcname,str]}function _emscripten_get_callstack_js(flags){var callstack=jsStackTrace();var iThisFunc=callstack.lastIndexOf("_emscripten_log");var iThisFunc2=callstack.lastIndexOf("_emscripten_get_callstack");var iNextLine=callstack.indexOf("\n",Math.max(iThisFunc,iThisFunc2))+1;callstack=callstack.slice(iNextLine);if(flags&8&&typeof emscripten_source_map==="undefined"){Runtime.warnOnce('Source map information is not available, emscripten_log with EM_LOG_C_STACK will be ignored. Build with "--pre-js $EMSCRIPTEN/src/emscripten-source-map.min.js" linker flag to add source map loading to code.');flags^=8;flags|=16;}var stack_args=null;if(flags&128){var stack_args=__emscripten_traverse_stack(arguments);while(stack_args[1].indexOf("_emscripten_")>=0)stack_args=__emscripten_traverse_stack(stack_args[0]);}lines=callstack.split("\n");callstack="";var newFirefoxRe=new RegExp("\\s*(.*?)@(.*?):([0-9]+):([0-9]+)");var firefoxRe=new RegExp("\\s*(.*?)@(.*):(.*)(:(.*))?");var chromeRe=new RegExp("\\s*at (.*?) \\((.*):(.*):(.*)\\)");for(l in lines){var line=lines[l];var jsSymbolName="";var file="";var lineno=0;var column=0;var parts=chromeRe.exec(line);if(parts&&parts.length==5){jsSymbolName=parts[1];file=parts[2];lineno=parts[3];column=parts[4];}else {parts=newFirefoxRe.exec(line);if(!parts)parts=firefoxRe.exec(line);if(parts&&parts.length>=4){jsSymbolName=parts[1];file=parts[2];lineno=parts[3];column=parts[4]|0;}else {callstack+=line+"\n";continue}}var cSymbolName=flags&32?demangle(jsSymbolName):jsSymbolName;if(!cSymbolName){cSymbolName=jsSymbolName;}var haveSourceMap=false;if(flags&8){var orig=emscripten_source_map.originalPositionFor({line:lineno,column:column});haveSourceMap=orig&&orig.source;if(haveSourceMap){if(flags&64){orig.source=orig.source.substring(orig.source.replace(/\\/g,"/").lastIndexOf("/")+1);}callstack+="    at "+cSymbolName+" ("+orig.source+":"+orig.line+":"+orig.column+")\n";}}if(flags&16||!haveSourceMap){if(flags&64){file=file.substring(file.replace(/\\/g,"/").lastIndexOf("/")+1);}callstack+=(haveSourceMap?"     = "+jsSymbolName:"    at "+cSymbolName)+" ("+file+":"+lineno+":"+column+")\n";}if(flags&128&&stack_args[0]){if(stack_args[1]==jsSymbolName&&stack_args[2].length>0){callstack=callstack.replace(/\s+$/,"");callstack+=" with values: "+stack_args[1]+stack_args[2]+"\n";}stack_args=__emscripten_traverse_stack(stack_args[0]);}}callstack=callstack.replace(/\s+$/,"");return callstack}function __Unwind_Backtrace(func,arg){var trace=_emscripten_get_callstack_js();var parts=trace.split("\n");for(var i=0;i<parts.length;i++){var ret=Module["dynCall_iii"](func,0,arg);if(ret!==0)return}}function _pthread_condattr_setclock(){return 0}var _environ=STATICTOP;STATICTOP+=16;function ___buildEnvironment(env){var MAX_ENV_VALUES=64;var TOTAL_ENV_SIZE=1024;var poolPtr;var envPtr;if(!___buildEnvironment.called){___buildEnvironment.called=true;ENV["USER"]=ENV["LOGNAME"]="web_user";ENV["PATH"]="/";ENV["PWD"]="/";ENV["HOME"]="/home/web_user";ENV["LANG"]="C";ENV["_"]=Module["thisProgram"];poolPtr=allocate(TOTAL_ENV_SIZE,"i8",ALLOC_STATIC);envPtr=allocate(MAX_ENV_VALUES*4,"i8*",ALLOC_STATIC);HEAP32[envPtr>>2]=poolPtr;HEAP32[_environ>>2]=envPtr;}else {envPtr=HEAP32[_environ>>2];poolPtr=HEAP32[envPtr>>2];}var strings=[];var totalSize=0;for(var key in env){if(typeof env[key]==="string"){var line=key+"="+env[key];strings.push(line);totalSize+=line.length;}}if(totalSize>TOTAL_ENV_SIZE){throw new Error("Environment size exceeded TOTAL_ENV_SIZE!")}var ptrSize=4;for(var i=0;i<strings.length;i++){var line=strings[i];writeAsciiToMemory(line,poolPtr);HEAP32[envPtr+i*ptrSize>>2]=poolPtr;poolPtr+=line.length+1;}HEAP32[envPtr+strings.length*ptrSize>>2]=0;}var ENV={};function _getenv(name){if(name===0)return 0;name=Pointer_stringify(name);if(!ENV.hasOwnProperty(name))return 0;if(_getenv.ret)_free(_getenv.ret);_getenv.ret=allocate(intArrayFromString(ENV[name]),"i8",ALLOC_NORMAL);return _getenv.ret}function _pthread_rwlock_rdlock(){return 0}function ___cxa_find_matching_catch_3(){return ___cxa_find_matching_catch.apply(null,arguments)}function _emscripten_memcpy_big(dest,src,num){HEAPU8.set(HEAPU8.subarray(src,src+num),dest);return dest}function ___syscall6(which,varargs){SYSCALLS.varargs=varargs;try{var stream=SYSCALLS.getStreamFromFD();FS.close(stream);return 0}catch(e){if(typeof FS==="undefined"||!(e instanceof FS.ErrnoError))abort(e);return -e.errno}}function _pthread_cond_signal(){return 0}function _dladdr(addr,info){var fname=allocate(intArrayFromString(Module["thisProgram"]||"./this.program"),"i8",ALLOC_NORMAL);HEAP32[addr>>2]=fname;HEAP32[addr+4>>2]=0;HEAP32[addr+8>>2]=0;HEAP32[addr+12>>2]=0;return 1}function ___gxx_personality_v0(){}function _pthread_mutex_destroy(){}function _pthread_mutexattr_init(){}function ___syscall4(which,varargs){SYSCALLS.varargs=varargs;try{var stream=SYSCALLS.getStreamFromFD(),buf=SYSCALLS.get(),count=SYSCALLS.get();return FS.write(stream,HEAP8,buf,count)}catch(e){if(typeof FS==="undefined"||!(e instanceof FS.ErrnoError))abort(e);return -e.errno}}function _pthread_condattr_init(){return 0}function _llvm_trap(){abort("trap!");}function ___cxa_find_matching_catch_2(){return ___cxa_find_matching_catch.apply(null,arguments)}function ___syscall140(which,varargs){SYSCALLS.varargs=varargs;try{var stream=SYSCALLS.getStreamFromFD(),offset_high=SYSCALLS.get(),offset_low=SYSCALLS.get(),result=SYSCALLS.get(),whence=SYSCALLS.get();var offset=offset_low;FS.llseek(stream,offset,whence);HEAP32[result>>2]=stream.position;if(stream.getdents&&offset===0&&whence===0)stream.getdents=null;return 0}catch(e){if(typeof FS==="undefined"||!(e instanceof FS.ErrnoError))abort(e);return -e.errno}}function ___syscall146(which,varargs){SYSCALLS.varargs=varargs;try{var stream=SYSCALLS.getStreamFromFD(),iov=SYSCALLS.get(),iovcnt=SYSCALLS.get();return SYSCALLS.doWritev(stream,iov,iovcnt)}catch(e){if(typeof FS==="undefined"||!(e instanceof FS.ErrnoError))abort(e);return -e.errno}}function _pthread_rwlock_unlock(){return 0}Module["requestFullScreen"]=function Module_requestFullScreen(lockPointer,resizeCanvas,vrDevice){Module.printErr("Module.requestFullScreen is deprecated. Please call Module.requestFullscreen instead.");Module["requestFullScreen"]=Module["requestFullscreen"];Browser.requestFullScreen(lockPointer,resizeCanvas,vrDevice);};Module["requestFullscreen"]=function Module_requestFullscreen(lockPointer,resizeCanvas,vrDevice){Browser.requestFullscreen(lockPointer,resizeCanvas,vrDevice);};Module["requestAnimationFrame"]=function Module_requestAnimationFrame(func){Browser.requestAnimationFrame(func);};Module["setCanvasSize"]=function Module_setCanvasSize(width,height,noUpdates){Browser.setCanvasSize(width,height,noUpdates);};Module["pauseMainLoop"]=function Module_pauseMainLoop(){Browser.mainLoop.pause();};Module["resumeMainLoop"]=function Module_resumeMainLoop(){Browser.mainLoop.resume();};Module["getUserMedia"]=function Module_getUserMedia(){Browser.getUserMedia();};Module["createContext"]=function Module_createContext(canvas,useWebGL,setInModule,webGLContextAttributes){return Browser.createContext(canvas,useWebGL,setInModule,webGLContextAttributes)};if(ENVIRONMENT_IS_NODE){_emscripten_get_now=function _emscripten_get_now_actual(){var t=process["hrtime"]();return t[0]*1e3+t[1]/1e6};}else if(typeof dateNow!=="undefined"){_emscripten_get_now=dateNow;}else if(typeof self==="object"&&self["performance"]&&typeof self["performance"]["now"]==="function"){_emscripten_get_now=(function(){return self["performance"]["now"]()});}else if(typeof performance==="object"&&typeof performance["now"]==="function"){_emscripten_get_now=(function(){return performance["now"]()});}else {_emscripten_get_now=Date.now;}FS.staticInit();__ATINIT__.unshift((function(){if(!Module["noFSInit"]&&!FS.init.initialized)FS.init();}));__ATMAIN__.push((function(){FS.ignorePermissions=false;}));__ATEXIT__.push((function(){FS.quit();}));Module["FS_createFolder"]=FS.createFolder;Module["FS_createPath"]=FS.createPath;Module["FS_createDataFile"]=FS.createDataFile;Module["FS_createPreloadedFile"]=FS.createPreloadedFile;Module["FS_createLazyFile"]=FS.createLazyFile;Module["FS_createLink"]=FS.createLink;Module["FS_createDevice"]=FS.createDevice;Module["FS_unlink"]=FS.unlink;__ATINIT__.unshift((function(){TTY.init();}));__ATEXIT__.push((function(){TTY.shutdown();}));if(ENVIRONMENT_IS_NODE){var fs$1=fs;var NODEJS_PATH=path$1;NODEFS.staticInit();}___buildEnvironment(ENV);DYNAMICTOP_PTR=allocate(1,"i32",ALLOC_STATIC);STACK_BASE=STACKTOP=Runtime.alignMemory(STATICTOP);STACK_MAX=STACK_BASE+TOTAL_STACK;DYNAMIC_BASE=Runtime.alignMemory(STACK_MAX);HEAP32[DYNAMICTOP_PTR>>2]=DYNAMIC_BASE;staticSealed=true;function intArrayFromString(stringy,dontAddNull,length){var len=length>0?length:lengthBytesUTF8(stringy)+1;var u8array=new Array(len);var numBytesWritten=stringToUTF8Array(stringy,u8array,0,u8array.length);if(dontAddNull)u8array.length=numBytesWritten;return u8array}var intArrayToString=(function(array){var ret=[];for(var i=0;i<array.length;i++){var chr=array[i];if(chr>255){chr&=255;}ret.push(String.fromCharCode(chr));}return ret.join("")});Module["intArrayFromString"]=intArrayFromString;Module["intArrayToString"]=intArrayToString;var keyStr="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";var decodeBase64=typeof atob==="function"?atob:(function(input){var output="";var chr1,chr2,chr3;var enc1,enc2,enc3,enc4;var i=0;input=input.replace(/[^A-Za-z0-9\+\/\=]/g,"");do{enc1=keyStr.indexOf(input.charAt(i++));enc2=keyStr.indexOf(input.charAt(i++));enc3=keyStr.indexOf(input.charAt(i++));enc4=keyStr.indexOf(input.charAt(i++));chr1=enc1<<2|enc2>>4;chr2=(enc2&15)<<4|enc3>>2;chr3=(enc3&3)<<6|enc4;output=output+String.fromCharCode(chr1);if(enc3!==64){output=output+String.fromCharCode(chr2);}if(enc4!==64){output=output+String.fromCharCode(chr3);}}while(i<input.length);return output});function intArrayFromBase64(s){if(typeof ENVIRONMENT_IS_NODE==="boolean"&&ENVIRONMENT_IS_NODE){var buf;try{buf=Buffer.from(s,"base64");}catch(_){buf=new Buffer(s,"base64");}return new Uint8Array(buf.buffer,buf.byteOffset,buf.byteLength)}try{var decoded=decodeBase64(s);var bytes=new Uint8Array(decoded.length);for(var i=0;i<decoded.length;++i){bytes[i]=decoded.charCodeAt(i);}return bytes}catch(_){throw new Error("Converting base64 string to bytes failed.")}}function tryParseAsDataURI(filename){var dataURIPrefix="data:application/octet-stream;base64,";if(!(String.prototype.startsWith?filename.startsWith(dataURIPrefix):filename.indexOf(dataURIPrefix)===0)){return}return intArrayFromBase64(filename.slice(dataURIPrefix.length))}function invoke_iiii(index,a1,a2,a3){try{return Module["dynCall_iiii"](index,a1,a2,a3)}catch(e){if(typeof e!=="number"&&e!=="longjmp")throw e;Module["setThrew"](1,0);}}function invoke_viiiii(index,a1,a2,a3,a4,a5){try{Module["dynCall_viiiii"](index,a1,a2,a3,a4,a5);}catch(e){if(typeof e!=="number"&&e!=="longjmp")throw e;Module["setThrew"](1,0);}}function invoke_i(index){try{return Module["dynCall_i"](index)}catch(e){if(typeof e!=="number"&&e!=="longjmp")throw e;Module["setThrew"](1,0);}}function invoke_vi(index,a1){try{Module["dynCall_vi"](index,a1);}catch(e){if(typeof e!=="number"&&e!=="longjmp")throw e;Module["setThrew"](1,0);}}function invoke_vii(index,a1,a2){try{Module["dynCall_vii"](index,a1,a2);}catch(e){if(typeof e!=="number"&&e!=="longjmp")throw e;Module["setThrew"](1,0);}}function invoke_ii(index,a1){try{return Module["dynCall_ii"](index,a1)}catch(e){if(typeof e!=="number"&&e!=="longjmp")throw e;Module["setThrew"](1,0);}}function invoke_viii(index,a1,a2,a3){try{Module["dynCall_viii"](index,a1,a2,a3);}catch(e){if(typeof e!=="number"&&e!=="longjmp")throw e;Module["setThrew"](1,0);}}function invoke_v(index){try{Module["dynCall_v"](index);}catch(e){if(typeof e!=="number"&&e!=="longjmp")throw e;Module["setThrew"](1,0);}}function invoke_iii(index,a1,a2){try{return Module["dynCall_iii"](index,a1,a2)}catch(e){if(typeof e!=="number"&&e!=="longjmp")throw e;Module["setThrew"](1,0);}}function invoke_iiiiii(index,a1,a2,a3,a4,a5){try{return Module["dynCall_iiiiii"](index,a1,a2,a3,a4,a5)}catch(e){if(typeof e!=="number"&&e!=="longjmp")throw e;Module["setThrew"](1,0);}}function invoke_viiii(index,a1,a2,a3,a4){try{Module["dynCall_viiii"](index,a1,a2,a3,a4);}catch(e){if(typeof e!=="number"&&e!=="longjmp")throw e;Module["setThrew"](1,0);}}Module.asmGlobalArg={"Math":Math,"Int8Array":Int8Array,"Int16Array":Int16Array,"Int32Array":Int32Array,"Uint8Array":Uint8Array,"Uint16Array":Uint16Array,"Uint32Array":Uint32Array,"Float32Array":Float32Array,"Float64Array":Float64Array,"NaN":NaN,"Infinity":Infinity};Module.asmLibraryArg={"abort":abort,"assert":assert,"enlargeMemory":enlargeMemory,"getTotalMemory":getTotalMemory,"abortOnCannotGrowMemory":abortOnCannotGrowMemory,"invoke_iiii":invoke_iiii,"invoke_viiiii":invoke_viiiii,"invoke_i":invoke_i,"invoke_vi":invoke_vi,"invoke_vii":invoke_vii,"invoke_ii":invoke_ii,"invoke_viii":invoke_viii,"invoke_v":invoke_v,"invoke_iii":invoke_iii,"invoke_iiiiii":invoke_iiiiii,"invoke_viiii":invoke_viiii,"_pthread_cond_wait":_pthread_cond_wait,"_llvm_bswap_i64":_llvm_bswap_i64,"__Unwind_FindEnclosingFunction":__Unwind_FindEnclosingFunction,"_emscripten_get_callstack_js":_emscripten_get_callstack_js,"_pthread_key_create":_pthread_key_create,"___setErrNo":___setErrNo,"___gxx_personality_v0":___gxx_personality_v0,"_pthread_rwlock_unlock":_pthread_rwlock_unlock,"___cxa_find_matching_catch_2":___cxa_find_matching_catch_2,"__ZSt18uncaught_exceptionv":__ZSt18uncaught_exceptionv,"___buildEnvironment":___buildEnvironment,"_pthread_cond_init":_pthread_cond_init,"__Unwind_GetIPInfo":__Unwind_GetIPInfo,"_pthread_mutexattr_destroy":_pthread_mutexattr_destroy,"__emscripten_traverse_stack":__emscripten_traverse_stack,"_emscripten_set_main_loop_timing":_emscripten_set_main_loop_timing,"___cxa_free_exception":___cxa_free_exception,"_pthread_key_delete":_pthread_key_delete,"___cxa_allocate_exception":___cxa_allocate_exception,"_pthread_rwlock_rdlock":_pthread_rwlock_rdlock,"___resumeException":___resumeException,"___cxa_find_matching_catch":___cxa_find_matching_catch,"_pthread_condattr_setclock":_pthread_condattr_setclock,"_pthread_getspecific":_pthread_getspecific,"___cxa_find_matching_catch_3":___cxa_find_matching_catch_3,"_emscripten_memcpy_big":_emscripten_memcpy_big,"_pthread_cond_signal":_pthread_cond_signal,"_pthread_mutex_destroy":_pthread_mutex_destroy,"_abort":_abort,"_pthread_condattr_init":_pthread_condattr_init,"_pthread_mutexattr_settype":_pthread_mutexattr_settype,"_getenv":_getenv,"_pthread_condattr_destroy":_pthread_condattr_destroy,"___syscall54":___syscall54,"___unlock":___unlock,"___syscall140":___syscall140,"_emscripten_set_main_loop":_emscripten_set_main_loop,"_emscripten_get_now":_emscripten_get_now,"_pthread_mutexattr_init":_pthread_mutexattr_init,"_pthread_setspecific":_pthread_setspecific,"_dladdr":_dladdr,"___cxa_throw":___cxa_throw,"___lock":___lock,"___syscall6":___syscall6,"___syscall4":___syscall4,"_pthread_cond_destroy":_pthread_cond_destroy,"_llvm_trap":_llvm_trap,"_pthread_mutex_init":_pthread_mutex_init,"__Unwind_Backtrace":__Unwind_Backtrace,"___syscall146":___syscall146,"_emscripten_exit_with_live_runtime":_emscripten_exit_with_live_runtime,"DYNAMICTOP_PTR":DYNAMICTOP_PTR,"tempDoublePtr":tempDoublePtr,"ABORT":ABORT,"STACKTOP":STACKTOP,"STACK_MAX":STACK_MAX};// EMSCRIPTEN_START_ASM
var asm=(function(global,env,buffer) {
"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.DYNAMICTOP_PTR|0;var j=env.tempDoublePtr|0;var k=env.ABORT|0;var l=env.STACKTOP|0;var m=env.STACK_MAX|0;var n=0;var o=0;var p=0;var q=0;var r=global.NaN,s=global.Infinity;var t=0,u=0,v=0,w=0,x=0.0;var y=0;var z=global.Math.floor;var A=global.Math.abs;var B=global.Math.sqrt;var C=global.Math.pow;var D=global.Math.cos;var E=global.Math.sin;var F=global.Math.tan;var G=global.Math.acos;var H=global.Math.asin;var I=global.Math.atan;var J=global.Math.atan2;var K=global.Math.exp;var L=global.Math.log;var M=global.Math.ceil;var N=global.Math.imul;var O=global.Math.min;var P=global.Math.max;var Q=global.Math.clz32;var R=env.abort;var S=env.assert;var T=env.enlargeMemory;var U=env.getTotalMemory;var V=env.abortOnCannotGrowMemory;var W=env.invoke_iiii;var X=env.invoke_viiiii;var Y=env.invoke_i;var Z=env.invoke_vi;var _=env.invoke_vii;var $=env.invoke_ii;var aa=env.invoke_viii;var ba=env.invoke_v;var ca=env.invoke_iii;var da=env.invoke_iiiiii;var ea=env.invoke_viiii;var fa=env._pthread_cond_wait;var ga=env._llvm_bswap_i64;var ha=env.__Unwind_FindEnclosingFunction;var ia=env._emscripten_get_callstack_js;var ja=env._pthread_key_create;var ka=env.___setErrNo;var la=env.___gxx_personality_v0;var ma=env._pthread_rwlock_unlock;var na=env.___cxa_find_matching_catch_2;var oa=env.__ZSt18uncaught_exceptionv;var pa=env.___buildEnvironment;var qa=env._pthread_cond_init;var ra=env.__Unwind_GetIPInfo;var sa=env._pthread_mutexattr_destroy;var ta=env.__emscripten_traverse_stack;var ua=env._emscripten_set_main_loop_timing;var va=env.___cxa_free_exception;var wa=env._pthread_key_delete;var xa=env.___cxa_allocate_exception;var ya=env._pthread_rwlock_rdlock;var za=env.___resumeException;var Aa=env.___cxa_find_matching_catch;var Ba=env._pthread_condattr_setclock;var Ca=env._pthread_getspecific;var Da=env.___cxa_find_matching_catch_3;var Ea=env._emscripten_memcpy_big;var Fa=env._pthread_cond_signal;var Ga=env._pthread_mutex_destroy;var Ha=env._abort;var Ia=env._pthread_condattr_init;var Ja=env._pthread_mutexattr_settype;var Ka=env._getenv;var La=env._pthread_condattr_destroy;var Ma=env.___syscall54;var Na=env.___unlock;var Oa=env.___syscall140;var Pa=env._emscripten_set_main_loop;var Qa=env._emscripten_get_now;var Ra=env._pthread_mutexattr_init;var Sa=env._pthread_setspecific;var Ta=env._dladdr;var Ua=env.___cxa_throw;var Va=env.___lock;var Wa=env.___syscall6;var Xa=env.___syscall4;var Ya=env._pthread_cond_destroy;var Za=env._llvm_trap;var _a=env._pthread_mutex_init;var $a=env.__Unwind_Backtrace;var ab=env.___syscall146;var bb=env._emscripten_exit_with_live_runtime;var cb=0.0;
// EMSCRIPTEN_START_FUNCS
function ob(a){a=a|0;var b=0;b=l;l=l+a|0;l=l+15&-16;return b|0}function pb(){return l|0}function qb(a){a=a|0;l=a;}function rb(a,b){a=a|0;b=b|0;l=a;m=b;}function sb(a,b){a=a|0;b=b|0;if(!n){n=a;o=b;}}function tb(a){a=a|0;y=a;}function ub(){return y|0}function vb(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0;i=l;l=l+16|0;g=i;h=a+4|0;f=c[h>>2]|0;e=f*288|0;if(f|0){b=f*576|0;if((b|0)<0)$i(1928);b=_b(c[a>>2]|0,e,8,b,8,g)|0;if(!b){d=g+4|0;j=c[d>>2]|0;d=c[d+4>>2]|0;c[g>>2]=c[g>>2];e=g+4|0;c[e>>2]=j;c[e+4>>2]=d;Yb(g);}e=b;g=a;j=f<<1;c[g>>2]=e;c[h>>2]=j;l=i;return}Wb(g,288,8,4);if((c[g>>2]|0)==1){b=c[g+4>>2]|0;if(b|0?(d=Xb(b,c[g+8>>2]|0,g)|0,d|0):0){f=d;g=a;j=4;c[g>>2]=f;c[h>>2]=j;l=i;return}}c[g>>2]=1;c[g+4>>2]=5846;c[g+8>>2]=30;Yb(g);}function wb(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;j=l;l=l+16|0;h=j;i=a+4|0;e=c[i>>2]|0;if((e-b|0)>>>0>=d>>>0){l=j;return}d=b+d|0;if(d>>>0<b>>>0)cj(5796,17);g=e<<1;g=d>>>0>=g>>>0?d:g;Wb(h,1,1,g);if((c[h>>2]|0)!=1)$i(1904);d=c[h+4>>2]|0;b=c[h+8>>2]|0;if((d|0)<0)$i(1928);e=c[i>>2]|0;if(!e){b=Xb(d,b,h)|0;d=(b|0)==0&1;e=0;f=0;}else {b=_b(c[a>>2]|0,e,1,d,b,h)|0;e=(b|0)==0;f=h+4|0;d=e&1;b=e?c[h>>2]|0:b;e=c[f>>2]|0;f=c[f+4>>2]|0;}if((d|0)==1){c[h>>2]=b;d=h+4|0;c[d>>2]=e;c[d+4>>2]=f;Yb(h);}c[a>>2]=b;c[i>>2]=g;l=j;return}function xb(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,m=0,o=0,p=0,q=0,r=0,s=0;s=l;l=l+16|0;k=s;if(!f){a[b>>0]=3;l=s;return}m=d+9|0;o=d+4|0;p=k+4|0;q=d+8|0;while(1){do if(!(a[m>>0]|0)){i=c[o>>2]|0;g=f>>>0<=i>>>0?f:i;h=c[d>>2]|0;i=i-g|0;j=h+g|0;if((g|0)!=1){ok(e|0,h|0,g|0)|0;c[d>>2]=j;c[o>>2]=i;if(!g){a[m>>0]=1;r=9;break}}else {a[e>>0]=a[h>>0]|0;c[d>>2]=j;c[o>>2]=i;}c[k>>2]=0;c[p>>2]=g;}else r=9;while(0);if((r|0)==9){r=0;g=e+f|0;h=e;do{a[h>>0]=a[q>>0]|0;h=h+1|0;}while((h|0)!=(g|0));c[k>>2]=0;c[p>>2]=f;if(!f){r=3;break}else g=f;}if(f>>>0<g>>>0){r=12;break}f=f-g|0;if(!f){r=16;break}else e=e+g|0;}if((r|0)==3){a[b>>0]=3;l=s;return}else if((r|0)==12){n=0;_(8,g|0,f|0);n=0;s=na()|0;yb(k);za(s|0);}else if((r|0)==16){a[b>>0]=3;l=s;return}}function yb(a){a=a|0;var b=0,e=0,f=0;if(!(c[a>>2]|0))return;if((d[a+4>>0]|0)<2)return;e=a+8|0;f=c[e>>2]|0;a=f+4|0;n=0;Z(c[c[a>>2]>>2]|0,c[f>>2]|0);b=n;n=0;if(b&1){b=na()|0;zb(c[f>>2]|0,c[a>>2]|0);Ab(c[e>>2]|0);za(b|0);}a=c[a>>2]|0;b=c[a+4>>2]|0;if(b|0)Zb(c[f>>2]|0,b,c[a+8>>2]|0);Zb(c[e>>2]|0,12,4);return}function zb(a,b){a=a|0;b=b|0;var d=0;d=c[b+4>>2]|0;if(!d)return;Zb(a,d,c[b+8>>2]|0);return}function Ab(a){a=a|0;Zb(a,12,4);return}function Bb(a){a=a|0;return}function Cb(a){a=a|0;kb[c[a>>2]&3]();return Rd()|0}function Db(a){a=a|0;kb[a&3]();return Rd()|0}function Eb(a){a=a|0;var b=0,e=0,f=0;if((d[a>>0]|0)<2)return;e=a+4|0;f=c[e>>2]|0;a=f+4|0;n=0;Z(c[c[a>>2]>>2]|0,c[f>>2]|0);b=n;n=0;if(b&1){b=na()|0;Fb(c[f>>2]|0,c[a>>2]|0);Gb(c[e>>2]|0);za(b|0);}a=c[a>>2]|0;b=c[a+4>>2]|0;if(b|0)Zb(c[f>>2]|0,b,c[a+8>>2]|0);Zb(c[e>>2]|0,12,4);return}function Fb(a,b){a=a|0;b=b|0;var d=0;d=c[b+4>>2]|0;if(!d)return;Zb(a,d,c[b+8>>2]|0);return}function Gb(a){a=a|0;Zb(a,12,4);return}function Hb(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;g=l;l=l+48|0;f=g+32|0;e=g+8|0;c[g>>2]=a;c[g+4>>2]=b;c[f>>2]=g;c[f+4>>2]=33;c[f+8>>2]=d;c[f+12>>2]=34;c[e>>2]=1976;c[e+4>>2]=2;c[e+8>>2]=5264;c[e+12>>2]=2;c[e+16>>2]=f;c[e+20>>2]=2;n=0;_(9,e|0,1992);n=0;b=na()|0;Eb(d);za(b|0);}function Ib(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;i=l;l=l+64|0;g=i+32|0;f=i+8|0;h=i+48|0;c[i>>2]=b;c[i+4>>2]=d;a[h>>0]=e&1;c[g>>2]=i;c[g+4>>2]=33;c[g+8>>2]=h;c[g+12>>2]=35;c[f>>2]=1976;c[f+4>>2]=2;c[f+8>>2]=5264;c[f+12>>2]=2;c[f+16>>2]=g;c[f+20>>2]=2;aj(f,1992);}function Jb(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;g=l;l=l+48|0;f=g+32|0;e=g+8|0;c[g>>2]=a;c[g+4>>2]=b;c[f>>2]=g;c[f+4>>2]=33;c[f+8>>2]=d;c[f+12>>2]=36;c[e>>2]=1976;c[e+4>>2]=2;c[e+8>>2]=5264;c[e+12>>2]=2;c[e+16>>2]=f;c[e+20>>2]=2;aj(e,1992);}function Kb(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;g=l;l=l+48|0;f=g+32|0;e=g+8|0;c[g>>2]=a;c[g+4>>2]=b;c[f>>2]=g;c[f+4>>2]=33;c[f+8>>2]=d;c[f+12>>2]=37;c[e>>2]=1976;c[e+4>>2]=2;c[e+8>>2]=5264;c[e+12>>2]=2;c[e+16>>2]=f;c[e+20>>2]=2;aj(e,1992);}function Lb(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;B=l;l=l+848|0;A=B;j=B+680|0;u=B+640|0;k=B+632|0;m=B+816|0;y=B+740|0;w=B+600|0;v=B+568|0;x=B+504|0;o=B+472|0;p=B+376|0;q=B+280|0;r=B+208|0;d=B+752|0;s=B+712|0;h=B+104|0;t=B+8|0;i=B+700|0;z=B+688|0;Ff(A,b);Gf(u,c[A>>2]|0,c[A+4>>2]|0);if((c[u>>2]|0)==1){f=u+4|0;g=c[f+4>>2]|0;A=j;c[A>>2]=c[f>>2];c[A+4>>2]=g;Kb(5909,43,j);}od(u,c[u+4>>2]|0,c[u+8>>2]|0);if((c[u>>2]|0)==1){f=u+4|0;g=c[f+4>>2]|0;A=j;c[A>>2]=c[f>>2];c[A+4>>2]=g;Jb(5909,43,j);}b=u+4|0;c[z>>2]=c[b>>2];c[z+4>>2]=c[b+4>>2];c[z+8>>2]=c[b+8>>2];b=c[z>>2]|0;e=c[z+8>>2]|0;A=b;n=0;f=$(9,0)|0;g=n;n=0;a:do if(!(g&1)?(c[i>>2]=b,c[i+4>>2]=e,a[i+8>>0]=f,a[i+9>>0]=0,n=0,_(10,h|0,i|0),g=n,n=0,!(g&1)):0){do if((c[h>>2]|0)!=1){g=t;e=h+8|0;f=g+96|0;do{c[g>>2]=c[e>>2];g=g+4|0;e=e+4|0;}while((g|0)<(f|0));g=m;f=g+32|0;do{a[g>>0]=0;g=g+1|0;}while((g|0)<(f|0));n=0;ea(3,k|0,i|0,m|0,32);i=n;n=0;if(i&1)break a;if((a[k>>0]|0)!=3){y=k;A=c[y+4>>2]|0;B=j;c[B>>2]=c[y>>2];c[B+4>>2]=A;n=0;aa(2,5952,50,j|0);n=0;break a}n=0;aa(3,u|0,m|0,32);m=n;n=0;if(m&1)break a;if((a[u>>0]|0)==1)break;b=c[u+8>>2]|0;g=u+12|0;c[s>>2]=c[g>>2];c[s+4>>2]=c[g+4>>2];c[s+8>>2]=c[g+8>>2];c[s+12>>2]=c[g+12>>2];c[s+16>>2]=c[g+16>>2];c[s+20>>2]=c[g+20>>2];c[s+24>>2]=c[g+24>>2];g=d;f=g+64|0;do{a[g>>0]=0;g=g+1|0;}while((g|0)<(f|0));g=p;e=t;f=g+96|0;do{c[g>>2]=c[e>>2];g=g+4|0;e=e+4|0;}while((g|0)<(f|0));c[o>>2]=b;u=o+4|0;c[u>>2]=c[s>>2];c[u+4>>2]=c[s+4>>2];c[u+8>>2]=c[s+8>>2];c[u+12>>2]=c[s+12>>2];c[u+16>>2]=c[s+16>>2];c[u+20>>2]=c[s+20>>2];c[u+24>>2]=c[s+24>>2];n=0;aa(4,q|0,p|0,o|0);u=n;n=0;if(u&1)break a;n=0;_(11,r|0,q|0);u=n;n=0;if(u&1)break a;u=r;do if((c[u>>2]|0)==1&(c[u+4>>2]|0)==0){g=x;e=r+8|0;f=g+64|0;do{c[g>>2]=c[e>>2];g=g+4|0;e=e+4|0;}while((g|0)<(f|0));n=0;_(12,v|0,x|0);u=n;n=0;if(u&1)break a;n=0;b=W(9,v|0,d|0,32)|0;v=n;n=0;if(v&1)break a;if(b<<24>>24!=2){n=0;aa(6,6002,41,(b&1)!=0|0);n=0;break a}n=0;_(13,w|0,x|0);x=n;n=0;if(x&1)break a;n=0;b=W(9,w|0,d+32|0,32)|0;x=n;n=0;if(x&1)break a;if(b<<24>>24==2)break;else {n=0;aa(6,6043,42,(b&1)!=0|0);n=0;break a}}while(0);n=0;aa(5,y|0,d|0,64);x=n;n=0;if(x&1)break a;d=y+8|0;n=0;aa(7,y|0,c[d>>2]|0,1);x=n;n=0;if(x&1){B=na()|0;Ob(y);Mb(z);za(B|0);}b=c[d>>2]|0;c[d>>2]=b+1;a[(c[y>>2]|0)+b>>0]=0;b=c[y>>2]|0;d=c[y+4>>2]|0;if(d|0)Zb(b,d,1);d=c[z+4>>2]|0;if(d|0)Zb(A,d,1);A=b;l=B;return A|0}while(0);d=c[z+4>>2]|0;if(d|0)Zb(A,d,1);A=16464;l=B;return A|0}while(0);B=na()|0;Mb(z);za(B|0);return 0}function Mb(a){a=a|0;var b=0;b=c[a+4>>2]|0;if(!b)return;Zb(c[a>>2]|0,b,1);return}function Nb(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;q=l;l=l+480|0;k=q+264|0;f=q+232|0;j=q+160|0;m=q+388|0;n=q+328|0;o=q+64|0;g=q+32|0;h=q;e=q+448|0;p=e;r=p+32|0;do{a[p>>0]=0;p=p+1|0;}while((p|0)<(r|0));xb(f,d,e,32);if((a[f>>0]|0)!=3){s=f;p=c[s+4>>2]|0;r=k;c[r>>2]=c[s>>2];c[r+4>>2]=p;Hb(5952,50,k);}cc(k,e,32);if((a[k>>0]|0)==1){c[b>>2]=1;c[b+4>>2]=6085;c[b+8>>2]=26;}else {s=c[k+8>>2]|0;r=k+12|0;c[f>>2]=c[r>>2];c[f+4>>2]=c[r+4>>2];c[f+8>>2]=c[r+8>>2];c[f+12>>2]=c[r+12>>2];c[f+16>>2]=c[r+16>>2];c[f+20>>2]=c[r+20>>2];c[f+24>>2]=c[r+24>>2];c[j>>2]=c[f>>2];c[j+4>>2]=c[f+4>>2];c[j+8>>2]=c[f+8>>2];c[j+12>>2]=c[f+12>>2];c[j+16>>2]=c[f+16>>2];c[j+20>>2]=c[f+20>>2];c[j+24>>2]=c[f+24>>2];c[h>>2]=s;s=h+4|0;c[s>>2]=c[j>>2];c[s+4>>2]=c[j+4>>2];c[s+8>>2]=c[j+8>>2];c[s+12>>2]=c[j+12>>2];c[s+16>>2]=c[j+16>>2];c[s+20>>2]=c[j+20>>2];c[s+24>>2]=c[j+24>>2];xb(f,d,e,32);if((a[f>>0]|0)!=3){p=f;r=c[p+4>>2]|0;s=k;c[s>>2]=c[p>>2];c[s+4>>2]=r;Hb(5952,50,k);}cc(k,e,32);a:do if((a[k>>0]|0)==1){c[b>>2]=1;c[b+4>>2]=6111;c[b+8>>2]=26;}else {s=c[k+8>>2]|0;r=k+12|0;c[f>>2]=c[r>>2];c[f+4>>2]=c[r+4>>2];c[f+8>>2]=c[r+8>>2];c[f+12>>2]=c[r+12>>2];c[f+16>>2]=c[r+16>>2];c[f+20>>2]=c[r+20>>2];c[f+24>>2]=c[r+24>>2];c[j>>2]=c[f>>2];c[j+4>>2]=c[f+4>>2];c[j+8>>2]=c[f+8>>2];c[j+12>>2]=c[f+12>>2];c[j+16>>2]=c[f+16>>2];c[j+20>>2]=c[f+20>>2];c[j+24>>2]=c[f+24>>2];c[g>>2]=s;s=g+4|0;c[s>>2]=c[j>>2];c[s+4>>2]=c[j+4>>2];c[s+8>>2]=c[j+8>>2];c[s+12>>2]=c[j+12>>2];c[s+16>>2]=c[j+16>>2];c[s+20>>2]=c[j+20>>2];c[s+24>>2]=c[j+24>>2];ac(f);if((Xj(h,f,32)|0)==0?(ac(k),(Xj(g,k,32)|0)==0):0)fc(o);else i=13;do if((i|0)==13){c[f>>2]=c[h>>2];c[f+4>>2]=c[h+4>>2];c[f+8>>2]=c[h+8>>2];c[f+12>>2]=c[h+12>>2];c[f+16>>2]=c[h+16>>2];c[f+20>>2]=c[h+20>>2];c[f+24>>2]=c[h+24>>2];c[f+28>>2]=c[h+28>>2];c[k>>2]=c[g>>2];c[k+4>>2]=c[g+4>>2];c[k+8>>2]=c[g+8>>2];c[k+12>>2]=c[g+12>>2];c[k+16>>2]=c[g+16>>2];c[k+20>>2]=c[g+20>>2];c[k+24>>2]=c[g+24>>2];c[k+28>>2]=c[g+28>>2];ic(j,f,k);if((a[j>>0]|0)==1){c[b>>2]=1;c[b+4>>2]=6137;c[b+8>>2]=19;break a}else {e=c[j+8>>2]|0;p=m;d=j+12|0;r=p+60|0;do{c[p>>2]=c[d>>2];p=p+4|0;d=d+4|0;}while((p|0)<(r|0));p=n;d=m;r=p+60|0;do{c[p>>2]=c[d>>2];p=p+4|0;d=d+4|0;}while((p|0)<(r|0));c[k>>2]=e;p=k+4|0;d=n;r=p+60|0;do{c[p>>2]=c[d>>2];p=p+4|0;d=d+4|0;}while((p|0)<(r|0));mc(o,k);break}}while(0);c[b>>2]=0;p=b+8|0;d=o;r=p+96|0;do{c[p>>2]=c[d>>2];p=p+4|0;d=d+4|0;}while((p|0)<(r|0));l=q;return}while(0)}l=q;return}function Ob(a){a=a|0;var b=0;b=c[a+4>>2]|0;if(!b)return;Zb(c[a>>2]|0,b,1);return}function Pb(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0;D=l;l=l+1072|0;C=D;j=D+808|0;A=D+864|0;y=D+776|0;u=D+744|0;z=D+680|0;v=D+584|0;w=D+488|0;x=D+392|0;s=D+320|0;d=D+1008|0;q=D+216|0;k=D+112|0;t=D+16|0;r=D+852|0;m=D+840|0;h=D+8|0;o=D+880|0;i=D+828|0;B=D+816|0;Ff(C,b);Gf(A,c[C>>2]|0,c[C+4>>2]|0);if((c[A>>2]|0)==1){f=A+4|0;g=c[f+4>>2]|0;C=j;c[C>>2]=c[f>>2];c[C+4>>2]=g;Kb(5909,43,j);}od(A,c[A+4>>2]|0,c[A+8>>2]|0);if((c[A>>2]|0)==1){f=A+4|0;g=c[f+4>>2]|0;C=j;c[C>>2]=c[f>>2];c[C+4>>2]=g;Jb(5909,43,j);}b=A+4|0;c[B>>2]=c[b>>2];c[B+4>>2]=c[b+4>>2];c[B+8>>2]=c[b+8>>2];b=c[B>>2]|0;e=c[B+8>>2]|0;C=b;n=0;f=$(9,0)|0;g=n;n=0;a:do if(!(g&1)){c[i>>2]=b;c[i+4>>2]=e;a[i+8>>0]=f;a[i+9>>0]=0;f=o;g=f+128|0;do{a[f>>0]=0;f=f+1|0;}while((f|0)<(g|0));n=0;ea(3,h|0,i|0,o|0,128);i=n;n=0;if(!(i&1)){if((a[h>>0]|0)!=3){A=h;C=c[A+4>>2]|0;D=j;c[D>>2]=c[A>>2];c[D+4>>2]=C;n=0;aa(2,5952,50,j|0);n=0;break}b=o+64|0;n=0;e=$(9,0)|0;j=n;n=0;if((!(j&1)?(c[m>>2]=o,c[m+4>>2]=64,a[m+8>>0]=e,a[m+9>>0]=0,n=0,p=$(9,0)|0,o=n,n=0,!(o&1)):0)?(c[r>>2]=b,c[r+4>>2]=64,a[r+8>>0]=p,a[r+9>>0]=0,n=0,_(10,k|0,m|0),p=n,n=0,!(p&1)):0){if((c[k>>2]|0)==1){d=c[B+4>>2]|0;if(d|0)Zb(C,d,1);C=16464;l=D;return C|0}f=t;e=k+8|0;g=f+96|0;do{c[f>>2]=c[e>>2];f=f+4|0;e=e+4|0;}while((f|0)<(g|0));n=0;_(10,q|0,r|0);r=n;n=0;if(!(r&1)){if((c[q>>2]|0)==1)b=16464;else {b=q+8|0;f=d;g=f+64|0;do{a[f>>0]=0;f=f+1|0;}while((f|0)<(g|0));f=w;e=t;g=f+96|0;do{c[f>>2]=c[e>>2];f=f+4|0;e=e+4|0;}while((f|0)<(g|0));f=v;e=b;g=f+96|0;do{c[f>>2]=c[e>>2];f=f+4|0;e=e+4|0;}while((f|0)<(g|0));n=0;aa(8,x|0,w|0,v|0);w=n;n=0;if(w&1)break;n=0;_(11,s|0,x|0);x=n;n=0;if(x&1)break;x=s;do if((c[x>>2]|0)==1&(c[x+4>>2]|0)==0){f=z;e=s+8|0;g=f+64|0;do{c[f>>2]=c[e>>2];f=f+4|0;e=e+4|0;}while((f|0)<(g|0));n=0;_(12,u|0,z|0);x=n;n=0;if(x&1)break a;n=0;b=W(9,u|0,d|0,32)|0;x=n;n=0;if(x&1)break a;if(b<<24>>24!=2){n=0;aa(6,6002,41,(b&1)!=0|0);n=0;break a}n=0;_(13,y|0,z|0);z=n;n=0;if(z&1)break a;n=0;b=W(9,y|0,d+32|0,32)|0;z=n;n=0;if(z&1)break a;if(b<<24>>24==2)break;else {n=0;aa(6,6043,42,(b&1)!=0|0);n=0;break a}}while(0);n=0;aa(5,A|0,d|0,64);z=n;n=0;if(z&1)break;d=A+8|0;n=0;aa(7,A|0,c[d>>2]|0,1);z=n;n=0;if(z&1){D=na()|0;Ob(A);Mb(B);za(D|0);}b=c[d>>2]|0;c[d>>2]=b+1;a[(c[A>>2]|0)+b>>0]=0;b=c[A>>2]|0;d=c[A+4>>2]|0;if(d|0)Zb(b,d,1);}d=c[B+4>>2]|0;if(d|0)Zb(C,d,1);C=b;l=D;return C|0}}}}while(0);D=na()|0;Mb(B);za(D|0);return 0}function Qb(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,ba=0,ca=0,da=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,oa=0,pa=0,qa=0,ra=0,sa=0,ta=0,ua=0,va=0,wa=0,xa=0,ya=0,Aa=0,Ba=0,Ca=0,Da=0,Ea=0,Fa=0,Ga=0,Ha=0;Ga=l;l=l+6960|0;z=Ga;ta=Ga+6664|0;ua=Ga+6568|0;va=Ga+6184|0;wa=Ga+5800|0;ya=Ga+5128|0;Aa=Ga+4456|0;Ba=Ga+4072|0;Ca=Ga+3688|0;Fa=Ga+6896|0;pa=Ga+6908|0;qa=Ga+6920|0;ra=Ga+3304|0;oa=Ga+2920|0;Ea=Ga+6880|0;sa=Ga+2536|0;A=Ga+2248|0;B=Ga+2120|0;C=Ga+1928|0;D=Ga+1864|0;E=Ga+1800|0;F=Ga+1664|0;G=Ga+1472|0;H=Ga+1280|0;I=Ga+1248|0;J=Ga+1216|0;K=Ga+1152|0;L=Ga+1120|0;M=Ga+1088|0;N=Ga+1024|0;O=Ga+960|0;P=Ga+864|0;Q=Ga+832|0;R=Ga+800|0;S=Ga+728|0;T=Ga+632|0;U=Ga+600|0;V=Ga+568|0;W=Ga+472|0;X=Ga+432|0;Y=Ga+400|0;ba=Ga+360|0;ca=Ga+328|0;da=Ga+288|0;fa=Ga+256|0;ga=Ga+216|0;ha=Ga+184|0;ia=Ga+144|0;ja=Ga+112|0;ka=Ga+72|0;la=Ga+40|0;ma=Ga+6868|0;xa=Ga+8|0;Ha=Ga+6856|0;Ff(z,b);Gf(ua,c[z>>2]|0,c[z+4>>2]|0);if((c[ua>>2]|0)==1){x=ua+4|0;y=c[x+4>>2]|0;z=ta;c[z>>2]=c[x>>2];c[z+4>>2]=y;Kb(5909,43,ta);}od(ua,c[ua+4>>2]|0,c[ua+8>>2]|0);if((c[ua>>2]|0)==1){x=ua+4|0;y=c[x+4>>2]|0;z=ta;c[z>>2]=c[x>>2];c[z+4>>2]=y;Jb(5909,43,ta);}y=ua+4|0;c[Ha>>2]=c[y>>2];c[Ha+4>>2]=c[y+4>>2];c[Ha+8>>2]=c[y+8>>2];y=c[Ha+8>>2]|0;z=(y>>>0)/192|0;a:do if(!((y>>>0)%192|0)){if(y){c[ma>>2]=8;g=ma+4|0;c[g>>2]=0;h=ma+8|0;c[h>>2]=0;b:do if(y>>>0>191){i=ka+8|0;j=ia+8|0;p=ga+8|0;q=da+8|0;r=ba+8|0;s=X+8|0;t=A+96|0;u=F+8|0;v=S+8|0;w=c[Ha>>2]|0;x=0;c:while(1){f=x*192|0;x=x+1|0;b=f|32;if(y>>>0<b>>>0){Da=16;break}n=0;aa(9,ka|0,w+f|0,b-f|0);o=n;n=0;if(o&1){Da=125;break}if((a[ka>>0]|0)==1){Da=23;break};c[la>>2]=c[i>>2];c[la+4>>2]=c[i+4>>2];c[la+8>>2]=c[i+8>>2];c[la+12>>2]=c[i+12>>2];c[la+16>>2]=c[i+16>>2];c[la+20>>2]=c[i+20>>2];c[la+24>>2]=c[i+24>>2];c[la+28>>2]=c[i+28>>2];d=f+64|0;if(d>>>0<b>>>0){Da=20;break}if(y>>>0<d>>>0){Da=22;break}n=0;aa(9,ia|0,w+b|0,d-b|0);o=n;n=0;if(o&1){Da=125;break}if((a[ia>>0]|0)==1){Da=31;break};c[ja>>2]=c[j>>2];c[ja+4>>2]=c[j+4>>2];c[ja+8>>2]=c[j+8>>2];c[ja+12>>2]=c[j+12>>2];c[ja+16>>2]=c[j+16>>2];c[ja+20>>2]=c[j+20>>2];c[ja+24>>2]=c[j+24>>2];c[ja+28>>2]=c[j+28>>2];b=f+96|0;if(y>>>0<b>>>0){Da=30;break}n=0;aa(9,ga|0,w+d|0,32);o=n;n=0;if(o&1){Da=125;break}if((a[ga>>0]|0)==1){Da=37;break};c[ha>>2]=c[p>>2];c[ha+4>>2]=c[p+4>>2];c[ha+8>>2]=c[p+8>>2];c[ha+12>>2]=c[p+12>>2];c[ha+16>>2]=c[p+16>>2];c[ha+20>>2]=c[p+20>>2];c[ha+24>>2]=c[p+24>>2];c[ha+28>>2]=c[p+28>>2];d=f+128|0;if(y>>>0<d>>>0){Da=36;break}n=0;aa(9,da|0,w+b|0,32);o=n;n=0;if(o&1){Da=125;break}if((a[da>>0]|0)==1){Da=43;break};c[fa>>2]=c[q>>2];c[fa+4>>2]=c[q+4>>2];c[fa+8>>2]=c[q+8>>2];c[fa+12>>2]=c[q+12>>2];c[fa+16>>2]=c[q+16>>2];c[fa+20>>2]=c[q+20>>2];c[fa+24>>2]=c[q+24>>2];c[fa+28>>2]=c[q+28>>2];e=f+160|0;if(y>>>0<e>>>0){Da=42;break}n=0;aa(9,ba|0,w+d|0,32);o=n;n=0;if(o&1){Da=125;break}if((a[ba>>0]|0)==1){Da=49;break};c[ca>>2]=c[r>>2];c[ca+4>>2]=c[r+4>>2];c[ca+8>>2]=c[r+8>>2];c[ca+12>>2]=c[r+12>>2];c[ca+16>>2]=c[r+16>>2];c[ca+20>>2]=c[r+20>>2];c[ca+24>>2]=c[r+24>>2];c[ca+28>>2]=c[r+28>>2];b=f+192|0;if(y>>>0<b>>>0){Da=48;break}n=0;aa(9,X|0,w+e|0,32);o=n;n=0;if(o&1){Da=125;break}if((a[X>>0]|0)==1){Da=54;break};c[Y>>2]=c[s>>2];c[Y+4>>2]=c[s+4>>2];c[Y+8>>2]=c[s+8>>2];c[Y+12>>2]=c[s+12>>2];c[Y+16>>2]=c[s+16>>2];c[Y+20>>2]=c[s+20>>2];c[Y+24>>2]=c[s+24>>2];c[Y+28>>2]=c[s+28>>2];n=0;Z(36,V|0);o=n;n=0;if(o&1){Da=125;break}do if(!(Xj(la,V,32)|0)){n=0;Z(36,U|0);o=n;n=0;if(o&1){Da=125;break c}if(Xj(ja,U,32)|0){Da=56;break}n=0;Z(37,T|0);o=n;n=0;if(o&1){Da=125;break c}k=W;m=T;o=k+96|0;do{c[k>>2]=c[m>>2];k=k+4|0;m=m+4|0;}while((k|0)<(o|0))}else Da=56;while(0);if((Da|0)==56){Da=0;c[R>>2]=c[la>>2];c[R+4>>2]=c[la+4>>2];c[R+8>>2]=c[la+8>>2];c[R+12>>2]=c[la+12>>2];c[R+16>>2]=c[la+16>>2];c[R+20>>2]=c[la+20>>2];c[R+24>>2]=c[la+24>>2];c[R+28>>2]=c[la+28>>2];c[Q>>2]=c[ja>>2];c[Q+4>>2]=c[ja+4>>2];c[Q+8>>2]=c[ja+8>>2];c[Q+12>>2]=c[ja+12>>2];c[Q+16>>2]=c[ja+16>>2];c[Q+20>>2]=c[ja+20>>2];c[Q+24>>2]=c[ja+24>>2];c[Q+28>>2]=c[ja+28>>2];n=0;aa(10,S|0,R|0,Q|0);o=n;n=0;if(o&1){Da=125;break}if((a[S>>0]|0)==1){Da=65;break}k=O;m=v;o=k+64|0;do{c[k>>2]=c[m>>2];k=k+4|0;m=m+4|0;}while((k|0)<(o|0));n=0;_(15,P|0,O|0);o=n;n=0;if(o&1){Da=125;break}k=W;m=P;o=k+96|0;do{c[k>>2]=c[m>>2];k=k+4|0;m=m+4|0;}while((k|0)<(o|0))};c[M>>2]=c[fa>>2];c[M+4>>2]=c[fa+4>>2];c[M+8>>2]=c[fa+8>>2];c[M+12>>2]=c[fa+12>>2];c[M+16>>2]=c[fa+16>>2];c[M+20>>2]=c[fa+20>>2];c[M+24>>2]=c[fa+24>>2];c[M+28>>2]=c[fa+28>>2];c[L>>2]=c[ha>>2];c[L+4>>2]=c[ha+4>>2];c[L+8>>2]=c[ha+8>>2];c[L+12>>2]=c[ha+12>>2];c[L+16>>2]=c[ha+16>>2];c[L+20>>2]=c[ha+20>>2];c[L+24>>2]=c[ha+24>>2];c[L+28>>2]=c[ha+28>>2];n=0;aa(11,N|0,M|0,L|0);o=n;n=0;if(o&1){Da=125;break};c[J>>2]=c[Y>>2];c[J+4>>2]=c[Y+4>>2];c[J+8>>2]=c[Y+8>>2];c[J+12>>2]=c[Y+12>>2];c[J+16>>2]=c[Y+16>>2];c[J+20>>2]=c[Y+20>>2];c[J+24>>2]=c[Y+24>>2];c[J+28>>2]=c[Y+28>>2];c[I>>2]=c[ca>>2];c[I+4>>2]=c[ca+4>>2];c[I+8>>2]=c[ca+8>>2];c[I+12>>2]=c[ca+12>>2];c[I+16>>2]=c[ca+16>>2];c[I+20>>2]=c[ca+20>>2];c[I+24>>2]=c[ca+24>>2];c[I+28>>2]=c[ca+28>>2];n=0;aa(11,K|0,J|0,I|0);o=n;n=0;if(o&1){Da=125;break}n=0;b=$(10,fa|0)|0;o=n;n=0;if(o&1){Da=125;break}do if(b){n=0;b=$(10,ha|0)|0;o=n;n=0;if(o&1){Da=125;break c}if(!b){Da=70;break}n=0;b=$(10,Y|0)|0;o=n;n=0;if(o&1){Da=125;break c}if(!b){Da=70;break}n=0;b=$(10,ca|0)|0;o=n;n=0;if(o&1){Da=125;break c}if(!b){Da=70;break}n=0;Z(38,G|0);o=n;n=0;if(o&1){Da=125;break c}ok(H|0,G|0,192)|0;}else Da=70;while(0);if((Da|0)==70){Da=0;k=E;m=N;o=k+64|0;do{c[k>>2]=c[m>>2];k=k+4|0;m=m+4|0;}while((k|0)<(o|0));k=D;m=K;o=k+64|0;do{c[k>>2]=c[m>>2];k=k+4|0;m=m+4|0;}while((k|0)<(o|0));n=0;aa(12,F|0,E|0,D|0);o=n;n=0;if(o&1){Da=125;break}if((a[F>>0]|0)==1){Da=83;break}k=B;m=u;o=k+128|0;do{c[k>>2]=c[m>>2];k=k+4|0;m=m+4|0;}while((k|0)<(o|0));n=0;_(16,C|0,B|0);o=n;n=0;if(o&1){Da=125;break}ok(H|0,C|0,192)|0;}k=A;m=W;o=k+96|0;do{c[k>>2]=c[m>>2];k=k+4|0;m=m+4|0;}while((k|0)<(o|0));ok(t|0,H|0,192)|0;b=c[h>>2]|0;if((b|0)==(c[g>>2]|0)){n=0;Z(39,ma|0);o=n;n=0;if(o&1){Da=125;break}b=c[h>>2]|0;}ok((c[ma>>2]|0)+(b*288|0)|0,A|0,288)|0;c[h>>2]=b+1;if(x>>>0>=z>>>0)break b}switch(Da|0){case 16:{n=0;_(14,b|0,y|0);n=0;Da=125;break}case 20:{n=0;_(8,b|0,d|0);n=0;Da=125;break}case 22:{n=0;_(14,d|0,y|0);n=0;Da=125;break}case 23:break;case 30:{n=0;_(14,b|0,y|0);n=0;Da=125;break}case 31:{Da=32;break}case 36:{n=0;_(14,d|0,y|0);n=0;Da=125;break}case 37:{Da=38;break}case 42:{n=0;_(14,e|0,y|0);n=0;Da=125;break}case 43:{Da=44;break}case 48:{n=0;_(14,b|0,y|0);n=0;Da=125;break}case 49:{Da=50;break}case 54:{Da=55;break}case 65:{Da=66;break}case 83:{Da=66;break}}if((Da|0)==66)Da=55;else if((Da|0)==125){Ga=na()|0;Sb(ma);Mb(Ha);za(Ga|0);}if((Da|0)==55)Da=50;if((Da|0)==50)Da=44;if((Da|0)==44)Da=38;if((Da|0)==38)Da=32;b=c[g>>2]|0;if(b|0)Zb(c[ma>>2]|0,b*288|0,8);break a}while(0);c[ta>>2]=c[ma>>2];c[ta+4>>2]=c[ma+4>>2];c[ta+8>>2]=c[ma+8>>2];g=c[ta>>2]|0;b=c[ta+8>>2]|0;h=g+(b*288|0)|0;i=c[ta+4>>2]|0;c[Ea>>2]=g;c[Ea+4>>2]=i;j=Ea+8|0;c[j>>2]=g;c[Ea+12>>2]=h;n=0;Z(40,oa|0);ma=n;n=0;if(ma&1){Ga=na()|0;Rb(Ea);Mb(Ha);za(Ga|0);}ok(Ca|0,oa|0,384)|0;do if(b){b=Aa+384|0;d=ya+384|0;e=ya+480|0;f=g;while(1){k=f;f=f+288|0;ok(Aa|0,Ca|0,384)|0;ok(b|0,k|0,288)|0;ok(ya|0,Ca|0,384)|0;ok(d|0,k|0,288)|0;ok(wa|0,Aa|0,384)|0;k=ua;m=b;o=k+96|0;do{c[k>>2]=c[m>>2];k=k+4|0;m=m+4|0;}while((k|0)<(o|0));ok(ta|0,e|0,192)|0;n=0;aa(13,va|0,ua|0,ta|0);oa=n;n=0;if(oa&1)break;n=0;aa(14,Ba|0,wa|0,va|0);oa=n;n=0;if(oa&1)break;ok(Ca|0,Ba|0,384)|0;if((f|0)==(h|0)){Da=94;break}}if((Da|0)==94){c[j>>2]=h;ok(sa|0,Ca|0,384)|0;break}b=na()|0;c[j>>2]=f;n=0;Z(41,Ea|0);Ga=n;n=0;if(Ga&1){Ga=na()|0;Mb(Ha);za(Ga|0);}else {Ga=b;Mb(Ha);za(Ga|0);}}else ok(sa|0,Ca|0,384)|0;while(0);if(i|0)Zb(g,i*288|0,8);n=0;Z(40,ra|0);Ea=n;n=0;if(Ea&1){Ga=na()|0;Mb(Ha);za(Ga|0);}do if((((((((Xj(sa,ra,32)|0)==0?(Xj(sa+32|0,ra+32|0,32)|0)==0:0)?(Xj(sa+64|0,ra+64|0,32)|0)==0:0)?(Xj(sa+96|0,ra+96|0,32)|0)==0:0)?(Xj(sa+128|0,ra+128|0,32)|0)==0:0)?(Xj(sa+160|0,ra+160|0,32)|0)==0:0)?(Xj(sa+192|0,ra+192|0,32)|0)==0:0)?(Xj(sa+224|0,ra+224|0,32)|0)==0:0){if(Xj(sa+256|0,ra+256|0,32)|0){Da=113;break}if(Xj(sa+288|0,ra+288|0,32)|0){Da=113;break}if(Xj(sa+320|0,ra+320|0,32)|0){Da=113;break}if(Xj(sa+352|0,ra+352|0,32)|0){Da=115;break}Ea=xa;c[Ea>>2]=1;c[Ea+4>>2]=0;Ea=xa+8|0;c[Ea>>2]=0;c[Ea+4>>2]=0;c[Ea+8>>2]=0;c[Ea+12>>2]=0;c[Ea+16>>2]=0;c[Ea+20>>2]=0;}else Da=113;while(0);if((Da|0)==113)Da=115;if((Da|0)==115){c[xa>>2]=0;c[xa+4>>2]=0;c[xa+8>>2]=0;c[xa+12>>2]=0;c[xa+16>>2]=0;c[xa+20>>2]=0;c[xa+24>>2]=0;c[xa+28>>2]=0;}}else {Ea=xa;c[Ea>>2]=1;c[Ea+4>>2]=0;Ea=xa+8|0;c[Ea>>2]=0;c[Ea+4>>2]=0;c[Ea+8>>2]=0;c[Ea+12>>2]=0;c[Ea+16>>2]=0;c[Ea+20>>2]=0;}k=qa;o=k+32|0;do{a[k>>0]=0;k=k+1|0;}while((k|0)<(o|0));n=0;ea(4,pa|0,xa|0,qa|0,32);Ea=n;n=0;if(!(Ea&1)?(n=0,aa(5,Fa|0,qa|0,32),Ea=n,n=0,!(Ea&1)):0){b=Fa+8|0;n=0;aa(7,Fa|0,c[b>>2]|0,1);Ea=n;n=0;if(Ea&1){Ga=na()|0;Ob(Fa);Mb(Ha);za(Ga|0);}d=c[b>>2]|0;c[b>>2]=d+1;a[(c[Fa>>2]|0)+d>>0]=0;d=c[Fa>>2]|0;b=c[Fa+4>>2]|0;if(b|0)Zb(d,b,1);b=c[Ha+4>>2]|0;if(b|0)Zb(c[Ha>>2]|0,b,1);Ha=d;l=Ga;return Ha|0}Ga=na()|0;Mb(Ha);za(Ga|0);}while(0);b=c[Ha+4>>2]|0;if(b|0)Zb(c[Ha>>2]|0,b,1);Ha=16464;l=Ga;return Ha|0}function Rb(a){a=a|0;var b=0,d=0,e=0;b=a+8|0;d=c[b>>2]|0;e=c[a+12>>2]|0;if((d|0)!=(e|0))c[b>>2]=d+(((((e+-288-d|0)>>>0)/288|0)+1|0)*288|0);b=c[a+4>>2]|0;if(!b)return;Zb(c[a>>2]|0,b*288|0,8);return}function Sb(a){a=a|0;var b=0;b=c[a+4>>2]|0;if(!b)return;Zb(c[a>>2]|0,b*288|0,8);return}function Tb(a,b){a=a|0;b=b|0;var d=0,e=0;d=l;l=l+16|0;e=d;c[e>>2]=1;b=Od(e,1952,a,b)|0;l=d;return b|0}function Ub(){bb();return}function Vb(a,b){a=a|0;b=b|0;return zi(c[a>>2]|0,c[a+4>>2]|0,b)|0}function Wb(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;g=0-d|0;f=b+((b+-1+d&g)-b)|0;if(f>>>0<b>>>0){c[a>>2]=0;return}b=N(f,e)|0;h=(e|0)==0;if(h?0:((b>>>0)/((h?1:e)>>>0)|0|0)!=(f|0)){c[a>>2]=0;return}if((d+-1&(d|-2147483648)|0)!=0|b>>>0>g>>>0)$i(2008);c[a>>2]=1;c[a+4>>2]=b;c[a+8>>2]=d;c[a+12>>2]=f;return}function Xb(a,b,c){a=a|0;b=b|0;c=c|0;return Mg(a,b,c)|0}function Yb(a){a=a|0;Ng(a);}function Zb(a,b,c){a=a|0;b=b|0;c=c|0;Og(a,b,c);return}function _b(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;return Pg(a,b,c,d,e,f)|0}function $b(e,f,g){e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0;k=l;l=l+112|0;h=k+32|0;j=k;if((g|0)==32){m=f;g=m;m=m+4|0;m=ga(d[g>>0]|d[g+1>>0]<<8|d[g+2>>0]<<16|d[g+3>>0]<<24|0,d[m>>0]|d[m+1>>0]<<8|d[m+2>>0]<<16|d[m+3>>0]<<24|0)|0;g=y;o=f+8|0;n=o;o=o+4|0;o=ga(d[n>>0]|d[n+1>>0]<<8|d[n+2>>0]<<16|d[n+3>>0]<<24|0,d[o>>0]|d[o+1>>0]<<8|d[o+2>>0]<<16|d[o+3>>0]<<24|0)|0;n=y;q=f+16|0;p=q;q=q+4|0;q=ga(d[p>>0]|d[p+1>>0]<<8|d[p+2>>0]<<16|d[p+3>>0]<<24|0,d[q>>0]|d[q+1>>0]<<8|d[q+2>>0]<<16|d[q+3>>0]<<24|0)|0;p=y;i=f+24|0;f=i;i=i+4|0;i=ga(d[f>>0]|d[f+1>>0]<<8|d[f+2>>0]<<16|d[f+3>>0]<<24|0,d[i>>0]|d[i+1>>0]<<8|d[i+2>>0]<<16|d[i+3>>0]<<24|0)|0;c[h>>2]=i;c[h+4>>2]=y;i=h+8|0;c[i>>2]=q;c[i+4>>2]=p;i=h+16|0;c[i>>2]=o;c[i+4>>2]=n;i=h+24|0;c[i>>2]=m;c[i+4>>2]=g;Mc(h,40,8,-268435457,-1025378925);c[j>>2]=c[h>>2];c[j+4>>2]=c[h+4>>2];c[j+8>>2]=c[h+8>>2];c[j+12>>2]=c[h+12>>2];c[j+16>>2]=c[h+16>>2];c[j+20>>2]=c[h+20>>2];c[j+24>>2]=c[h+24>>2];c[j+28>>2]=c[h+28>>2];h=k+64+6|0;i=h;f=j;g=i+32|0;do{b[i>>1]=b[f>>1]|0;i=i+2|0;f=f+2|0;}while((i|0)<(g|0));i=e+8|0;f=h;g=i+32|0;do{b[i>>1]=b[f>>1]|0;i=i+2|0;f=f+2|0;}while((i|0)<(g|0));q=0;a[e>>0]=q;l=k;return}else {a[e+1>>0]=0;q=1;a[e>>0]=q;l=k;return}}function ac(a){a=a|0;c[a>>2]=0;c[a+4>>2]=0;c[a+8>>2]=0;c[a+12>>2]=0;c[a+16>>2]=0;c[a+20>>2]=0;c[a+24>>2]=0;c[a+28>>2]=0;return}function bc(a){a=a|0;var b=0;b=a;if((((c[b>>2]|0)==0&(c[b+4>>2]|0)==0?(b=a+8|0,(c[b>>2]|0)==0&(c[b+4>>2]|0)==0):0)?(b=a+16|0,(c[b>>2]|0)==0&(c[b+4>>2]|0)==0):0)?(b=a+24|0,(c[b>>2]|0)==0&(c[b+4>>2]|0)==0):0){b=1;return b|0}b=0;return b|0}function cc(e,f,g){e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0;k=l;l=l+112|0;i=k+32|0;h=k;j=k+64|0;do if((g|0)==32){n=f;m=n;n=n+4|0;n=ga(d[m>>0]|d[m+1>>0]<<8|d[m+2>>0]<<16|d[m+3>>0]<<24|0,d[n>>0]|d[n+1>>0]<<8|d[n+2>>0]<<16|d[n+3>>0]<<24|0)|0;m=y;p=f+8|0;o=p;p=p+4|0;p=ga(d[o>>0]|d[o+1>>0]<<8|d[o+2>>0]<<16|d[o+3>>0]<<24|0,d[p>>0]|d[p+1>>0]<<8|d[p+2>>0]<<16|d[p+3>>0]<<24|0)|0;o=y;r=f+16|0;q=r;r=r+4|0;r=ga(d[q>>0]|d[q+1>>0]<<8|d[q+2>>0]<<16|d[q+3>>0]<<24|0,d[r>>0]|d[r+1>>0]<<8|d[r+2>>0]<<16|d[r+3>>0]<<24|0)|0;q=y;g=f+24|0;f=g;g=g+4|0;g=ga(d[f>>0]|d[f+1>>0]<<8|d[f+2>>0]<<16|d[f+3>>0]<<24|0,d[g>>0]|d[g+1>>0]<<8|d[g+2>>0]<<16|d[g+3>>0]<<24|0)|0;c[i>>2]=g;c[i+4>>2]=y;g=i+8|0;c[g>>2]=r;c[g+4>>2]=q;g=i+16|0;c[g>>2]=p;c[g+4>>2]=o;g=i+24|0;c[g>>2]=n;c[g+4>>2]=m;if(!(Qc(i,136)|0)){h=1;break}Mc(i,72,136,-460954743,-2016278654);c[h>>2]=c[i>>2];c[h+4>>2]=c[i+4>>2];c[h+8>>2]=c[i+8>>2];c[h+12>>2]=c[i+12>>2];c[h+16>>2]=c[i+16>>2];c[h+20>>2]=c[i+20>>2];c[h+24>>2]=c[i+24>>2];c[h+28>>2]=c[i+28>>2];g=j+6|0;i=g;f=i+32|0;do{b[i>>1]=b[h>>1]|0;i=i+2|0;h=h+2|0;}while((i|0)<(f|0));i=e+8|0;h=g;f=i+32|0;do{b[i>>1]=b[h>>1]|0;i=i+2|0;h=h+2|0;}while((i|0)<(f|0));r=0;a[e>>0]=r;l=k;return}else h=0;while(0);a[e+1>>0]=h;r=1;a[e>>0]=r;l=k;return}function dc(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;g=l;l=l+96|0;h=g+64|0;i=g+32|0;f=g;c[i>>2]=c[b>>2];c[i+4>>2]=c[b+4>>2];c[i+8>>2]=c[b+8>>2];c[i+12>>2]=c[b+12>>2];c[i+16>>2]=c[b+16>>2];c[i+20>>2]=c[b+20>>2];c[i+24>>2]=c[b+24>>2];c[i+28>>2]=c[b+28>>2];b=h;c[b>>2]=1;c[b+4>>2]=0;b=h+8|0;c[b>>2]=0;c[b+4>>2]=0;c[b+8>>2]=0;c[b+12>>2]=0;c[b+16>>2]=0;c[b+20>>2]=0;Mc(i,h,136,-460954743,-2016278654);c[f>>2]=c[i>>2];c[f+4>>2]=c[i+4>>2];c[f+8>>2]=c[i+8>>2];c[f+12>>2]=c[i+12>>2];c[f+16>>2]=c[i+16>>2];c[f+20>>2]=c[i+20>>2];c[f+24>>2]=c[i+24>>2];c[f+28>>2]=c[i+28>>2];b=i;c[b>>2]=-980480611;c[b+4>>2]=-748862579;b=i+8|0;c[b>>2]=-171504835;c[b+4>>2]=175696680;b=i+16|0;c[b>>2]=2021213740;c[b+4>>2]=1718526831;b=i+24|0;c[b>>2]=-1710760145;c[b+4>>2]=235567041;b=h;c[b>>2]=-662897337;c[b+4>>2]=1008765974;b=h+8|0;c[b>>2]=1752287885;c[b+4>>2]=-1753126255;b=h+16|0;c[b>>2]=-2122229667;c[b+4>>2]=-1202698826;b=h+24|0;c[b>>2]=-516841431;c[b+4>>2]=811880050;Mc(f,i,h,-460954743,-2016278654);if((e|0)!=32){i=0;l=g;return i|0}e=f+24|0;e=ga(c[e>>2]|0,c[e+4>>2]|0)|0;h=y;i=d;b=i;a[b>>0]=e;a[b+1>>0]=e>>8;a[b+2>>0]=e>>16;a[b+3>>0]=e>>24;i=i+4|0;a[i>>0]=h;a[i+1>>0]=h>>8;a[i+2>>0]=h>>16;a[i+3>>0]=h>>24;i=f+16|0;i=ga(c[i>>2]|0,c[i+4>>2]|0)|0;h=y;b=d+8|0;e=b;a[e>>0]=i;a[e+1>>0]=i>>8;a[e+2>>0]=i>>16;a[e+3>>0]=i>>24;b=b+4|0;a[b>>0]=h;a[b+1>>0]=h>>8;a[b+2>>0]=h>>16;a[b+3>>0]=h>>24;b=f+8|0;b=ga(c[b>>2]|0,c[b+4>>2]|0)|0;h=y;e=d+16|0;i=e;a[i>>0]=b;a[i+1>>0]=b>>8;a[i+2>>0]=b>>16;a[i+3>>0]=b>>24;e=e+4|0;a[e>>0]=h;a[e+1>>0]=h>>8;a[e+2>>0]=h>>16;a[e+3>>0]=h>>24;e=f;e=ga(c[e>>2]|0,c[e+4>>2]|0)|0;h=y;i=d+24|0;f=i;a[f>>0]=e;a[f+1>>0]=e>>8;a[f+2>>0]=e>>16;a[f+3>>0]=e>>24;i=i+4|0;a[i>>0]=h;a[i+1>>0]=h>>8;a[i+2>>0]=h>>16;a[i+3>>0]=h>>24;i=2;l=g;return i|0}function ec(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=l;l=l+64|0;f=e;c[f>>2]=c[b>>2];c[f+4>>2]=c[b+4>>2];c[f+8>>2]=c[b+8>>2];c[f+12>>2]=c[b+12>>2];c[f+16>>2]=c[b+16>>2];c[f+20>>2]=c[b+20>>2];c[f+24>>2]=c[b+24>>2];c[f+28>>2]=c[b+28>>2];b=f+32|0;c[b>>2]=c[d>>2];c[b+4>>2]=c[d+4>>2];c[b+8>>2]=c[d+8>>2];c[b+12>>2]=c[d+12>>2];c[b+16>>2]=c[d+16>>2];c[b+20>>2]=c[d+20>>2];c[b+24>>2]=c[d+24>>2];c[b+28>>2]=c[d+28>>2];b=f;d=a+64|0;do{c[a>>2]=c[b>>2];a=a+4|0;b=b+4|0;}while((a|0)<(d|0));l=e;return}function fc(a){a=a|0;var b=0;c[a>>2]=0;c[a+4>>2]=0;c[a+8>>2]=0;c[a+12>>2]=0;c[a+16>>2]=0;c[a+20>>2]=0;c[a+24>>2]=0;c[a+28>>2]=0;b=a+32|0;c[b>>2]=-980480611;c[b+4>>2]=-748862579;b=a+40|0;c[b>>2]=-171504835;c[b+4>>2]=175696680;b=a+48|0;c[b>>2]=2021213740;c[b+4>>2]=1718526831;b=a+56|0;c[b>>2]=-1710760145;c[b+4>>2]=235567041;a=a+64|0;c[a>>2]=0;c[a+4>>2]=0;c[a+8>>2]=0;c[a+12>>2]=0;c[a+16>>2]=0;c[a+20>>2]=0;c[a+24>>2]=0;c[a+28>>2]=0;return}function gc(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;j=l;l=l+288|0;f=j+192|0;g=j+96|0;h=j;i=g;e=i+96|0;do{c[i>>2]=c[b>>2];i=i+4|0;b=b+4|0;}while((i|0)<(e|0));i=f;b=d;e=i+96|0;do{c[i>>2]=c[b>>2];i=i+4|0;b=b+4|0;}while((i|0)<(e|0));Dc(h,g,f);i=a;b=h;e=i+96|0;do{c[i>>2]=c[b>>2];i=i+4|0;b=b+4|0;}while((i|0)<(e|0));l=j;return}function hc(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;j=l;l=l+224|0;f=j+192|0;g=j+96|0;h=j;i=g;e=i+96|0;do{c[i>>2]=c[b>>2];i=i+4|0;b=b+4|0;}while((i|0)<(e|0));c[f>>2]=c[d>>2];c[f+4>>2]=c[d+4>>2];c[f+8>>2]=c[d+8>>2];c[f+12>>2]=c[d+12>>2];c[f+16>>2]=c[d+16>>2];c[f+20>>2]=c[d+20>>2];c[f+24>>2]=c[d+24>>2];c[f+28>>2]=c[d+28>>2];Cc(h,g,f);i=a;b=h;e=i+96|0;do{c[i>>2]=c[b>>2];i=i+4|0;b=b+4|0;}while((i|0)<(e|0));l=j;return}function ic(d,e,f){d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0;k=l;l=l+208|0;g=k+104|0;i=k+72|0;h=k;j=k+136|0;c[i>>2]=c[e>>2];c[i+4>>2]=c[e+4>>2];c[i+8>>2]=c[e+8>>2];c[i+12>>2]=c[e+12>>2];c[i+16>>2]=c[e+16>>2];c[i+20>>2]=c[e+20>>2];c[i+24>>2]=c[e+24>>2];c[i+28>>2]=c[e+28>>2];c[g>>2]=c[f>>2];c[g+4>>2]=c[f+4>>2];c[g+8>>2]=c[f+8>>2];c[g+12>>2]=c[f+12>>2];c[g+16>>2]=c[f+16>>2];c[g+20>>2]=c[f+20>>2];c[g+24>>2]=c[f+24>>2];c[g+28>>2]=c[f+28>>2];uc(h,i,g);e=a[h>>0]|0;f=a[h+1>>0]|0;g=j;h=h+2|0;i=g+70|0;do{b[g>>1]=b[h>>1]|0;g=g+2|0;h=h+2|0;}while((g|0)<(i|0));if(e<<24>>24==1){a[d+1>>0]=f<<24>>24!=0&1;j=1;a[d>>0]=j;l=k;return}else {g=d+8|0;h=j+6|0;i=g+64|0;do{b[g>>1]=b[h>>1]|0;g=g+2|0;h=h+2|0;}while((g|0)<(i|0));j=0;a[d>>0]=j;l=k;return}}function jc(a,b){a=a|0;b=b|0;c[a>>2]=c[b>>2];c[a+4>>2]=c[b+4>>2];c[a+8>>2]=c[b+8>>2];c[a+12>>2]=c[b+12>>2];c[a+16>>2]=c[b+16>>2];c[a+20>>2]=c[b+20>>2];c[a+24>>2]=c[b+24>>2];c[a+28>>2]=c[b+28>>2];return}function kc(a,b){a=a|0;b=b|0;b=b+32|0;c[a>>2]=c[b>>2];c[a+4>>2]=c[b+4>>2];c[a+8>>2]=c[b+8>>2];c[a+12>>2]=c[b+12>>2];c[a+16>>2]=c[b+16>>2];c[a+20>>2]=c[b+20>>2];c[a+24>>2]=c[b+24>>2];c[a+28>>2]=c[b+28>>2];return}function lc(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;f=l;l=l+80|0;d=f;Ac(d,b);e=d;if((c[e>>2]|0)==1&(c[e+4>>2]|0)==0){e=a+8|0;b=d+8|0;d=e+64|0;do{c[e>>2]=c[b>>2];e=e+4|0;b=b+4|0;}while((e|0)<(d|0));b=1;d=0;}else {b=0;d=0;}c[a>>2]=b;c[a+4>>2]=d;l=f;return}function mc(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;f=l;l=l+64|0;d=f;c[d>>2]=c[b>>2];c[d+4>>2]=c[b+4>>2];c[d+8>>2]=c[b+8>>2];c[d+12>>2]=c[b+12>>2];c[d+16>>2]=c[b+16>>2];c[d+20>>2]=c[b+20>>2];c[d+24>>2]=c[b+24>>2];c[d+28>>2]=c[b+28>>2];e=b+32|0;b=d+32|0;c[b>>2]=c[e>>2];c[b+4>>2]=c[e+4>>2];c[b+8>>2]=c[e+8>>2];c[b+12>>2]=c[e+12>>2];c[b+16>>2]=c[e+16>>2];c[b+20>>2]=c[e+20>>2];c[b+24>>2]=c[e+24>>2];c[b+28>>2]=c[e+28>>2];b=a;e=b+64|0;do{c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;}while((b|0)<(e|0));e=a+64|0;c[e>>2]=-980480611;c[e+4>>2]=-748862579;e=a+72|0;c[e>>2]=-171504835;c[e+4>>2]=175696680;e=a+80|0;c[e>>2]=2021213740;c[e+4>>2]=1718526831;a=a+88|0;c[a>>2]=-1710760145;c[a+4>>2]=235567041;l=f;return}function nc(a){a=a|0;var b=0,d=0;b=a;d=b+64|0;do{c[b>>2]=0;b=b+4|0;}while((b|0)<(d|0));b=a+64|0;c[b>>2]=-980480611;c[b+4>>2]=-748862579;b=a+72|0;c[b>>2]=-171504835;c[b+4>>2]=175696680;b=a+80|0;c[b>>2]=2021213740;c[b+4>>2]=1718526831;b=a+88|0;c[b>>2]=-1710760145;c[b+4>>2]=235567041;b=a+96|0;d=b+96|0;do{c[b>>2]=0;b=b+4|0;}while((b|0)<(d|0));return}function oc(a){a=a|0;var b=0;b=a;c[b>>2]=-980480611;c[b+4>>2]=-748862579;b=a+8|0;c[b>>2]=-171504835;c[b+4>>2]=175696680;b=a+16|0;c[b>>2]=2021213740;c[b+4>>2]=1718526831;b=a+24|0;c[b>>2]=-1710760145;c[b+4>>2]=235567041;hk(a+32|0,0,352)|0;return}function pc(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0;d=l;l=l+1152|0;f=d+768|0;g=d+384|0;e=d;ok(g|0,b|0,384)|0;ok(f|0,c|0,384)|0;Tc(e,g,f);ok(a|0,e|0,384)|0;l=d;return}function qc(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;d=l;l=l+384|0;e=d;Ec(e,b,c);ok(a|0,e|0,384)|0;l=d;return}function rc(d,e,f){d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,m=0,n=0;n=l;l=l+400|0;h=n+200|0;i=n+136|0;k=n;m=n+264|0;j=i;g=j+64|0;do{c[j>>2]=c[e>>2];j=j+4|0;e=e+4|0;}while((j|0)<(g|0));j=h;e=f;g=j+64|0;do{c[j>>2]=c[e>>2];j=j+4|0;e=e+4|0;}while((j|0)<(g|0));vc(k,i,h);j=a[k>>0]|0;e=a[k+1>>0]|0;ok(m|0,k+2|0,134)|0;if(j<<24>>24==1){a[d+1>>0]=e<<24>>24!=0&1;m=1;a[d>>0]=m;l=n;return}else {j=d+8|0;e=m+6|0;g=j+128|0;do{b[j>>1]=b[e>>1]|0;j=j+2|0;e=e+2|0;}while((j|0)<(g|0));m=0;a[d>>0]=m;l=n;return}}function sc(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;f=l;l=l+128|0;d=f;e=d;g=b;h=e+64|0;do{c[e>>2]=c[g>>2];e=e+4|0;g=g+4|0;}while((e|0)<(h|0));e=d+64|0;g=b+64|0;h=e+64|0;do{c[e>>2]=c[g>>2];e=e+4|0;g=g+4|0;}while((e|0)<(h|0));e=a;g=d;h=e+128|0;do{c[e>>2]=c[g>>2];e=e+4|0;g=g+4|0;}while((e|0)<(h|0));h=a+128|0;c[h>>2]=-980480611;c[h+4>>2]=-748862579;h=a+136|0;c[h>>2]=-171504835;c[h+4>>2]=175696680;h=a+144|0;c[h>>2]=2021213740;c[h+4>>2]=1718526831;h=a+152|0;c[h>>2]=-1710760145;c[h+4>>2]=235567041;h=a+160|0;c[h>>2]=0;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[h+16>>2]=0;c[h+20>>2]=0;c[h+24>>2]=0;c[h+28>>2]=0;l=f;return}function tc(b,c){b=b|0;c=c|0;var d=0,e=0;e=l;l=l+16|0;d=e;if((a[b>>0]|0)==1){vi(d,c,6248,9);d=Ti(d)|0;l=e;return d|0}else {vi(d,c,6230,18);d=Ti(d)|0;l=e;return d|0}return 0}function uc(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,m=0;h=l;l=l+224|0;f=h+160|0;m=h+128|0;k=h+96|0;j=h+64|0;g=h+32|0;i=h;c[m>>2]=c[e>>2];c[m+4>>2]=c[e+4>>2];c[m+8>>2]=c[e+8>>2];c[m+12>>2]=c[e+12>>2];c[m+16>>2]=c[e+16>>2];c[m+20>>2]=c[e+20>>2];c[m+24>>2]=c[e+24>>2];c[m+28>>2]=c[e+28>>2];c[f>>2]=c[e>>2];c[f+4>>2]=c[e+4>>2];c[f+8>>2]=c[e+8>>2];c[f+12>>2]=c[e+12>>2];c[f+16>>2]=c[e+16>>2];c[f+20>>2]=c[e+20>>2];c[f+24>>2]=c[e+24>>2];c[f+28>>2]=c[e+28>>2];Mc(m,f,136,-460954743,-2016278654);c[i>>2]=c[m>>2];c[i+4>>2]=c[m+4>>2];c[i+8>>2]=c[m+8>>2];c[i+12>>2]=c[m+12>>2];c[i+16>>2]=c[m+16>>2];c[i+20>>2]=c[m+20>>2];c[i+24>>2]=c[m+24>>2];c[i+28>>2]=c[m+28>>2];c[m>>2]=c[d>>2];c[m+4>>2]=c[d+4>>2];c[m+8>>2]=c[d+8>>2];c[m+12>>2]=c[d+12>>2];c[m+16>>2]=c[d+16>>2];c[m+20>>2]=c[d+20>>2];c[m+24>>2]=c[d+24>>2];c[m+28>>2]=c[d+28>>2];c[f>>2]=c[d>>2];c[f+4>>2]=c[d+4>>2];c[f+8>>2]=c[d+8>>2];c[f+12>>2]=c[d+12>>2];c[f+16>>2]=c[d+16>>2];c[f+20>>2]=c[d+20>>2];c[f+24>>2]=c[d+24>>2];c[f+28>>2]=c[d+28>>2];Mc(m,f,136,-460954743,-2016278654);c[k>>2]=c[m>>2];c[k+4>>2]=c[m+4>>2];c[k+8>>2]=c[m+8>>2];c[k+12>>2]=c[m+12>>2];c[k+16>>2]=c[m+16>>2];c[k+20>>2]=c[m+20>>2];c[k+24>>2]=c[m+24>>2];c[k+28>>2]=c[m+28>>2];c[f>>2]=c[d>>2];c[f+4>>2]=c[d+4>>2];c[f+8>>2]=c[d+8>>2];c[f+12>>2]=c[d+12>>2];c[f+16>>2]=c[d+16>>2];c[f+20>>2]=c[d+20>>2];c[f+24>>2]=c[d+24>>2];c[f+28>>2]=c[d+28>>2];Mc(k,f,136,-460954743,-2016278654);c[j>>2]=c[k>>2];c[j+4>>2]=c[k+4>>2];c[j+8>>2]=c[k+8>>2];c[j+12>>2]=c[k+12>>2];c[j+16>>2]=c[k+16>>2];c[j+20>>2]=c[k+20>>2];c[j+24>>2]=c[k+24>>2];c[j+28>>2]=c[k+28>>2];k=f;c[k>>2]=1353525463;c[k+4>>2]=2048379561;k=f+8|0;c[k>>2]=-514514503;c[k+4>>2]=527090042;k=f+16|0;c[k>>2]=1768673924;c[k+4>>2]=860613198;k=f+24|0;c[k>>2]=-837313138;c[k+4>>2]=706701124;Kc(j,f,136);c[g>>2]=c[j>>2];c[g+4>>2]=c[j+4>>2];c[g+8>>2]=c[j+8>>2];c[g+12>>2]=c[j+12>>2];c[g+16>>2]=c[j+16>>2];c[g+20>>2]=c[j+20>>2];c[g+24>>2]=c[j+24>>2];c[g+28>>2]=c[j+28>>2];if(!(Xj(i,g,32)|0)){c[f>>2]=c[d>>2];c[f+4>>2]=c[d+4>>2];c[f+8>>2]=c[d+8>>2];c[f+12>>2]=c[d+12>>2];c[f+16>>2]=c[d+16>>2];c[f+20>>2]=c[d+20>>2];c[f+24>>2]=c[d+24>>2];c[f+28>>2]=c[d+28>>2];g=f+32|0;c[g>>2]=c[e>>2];c[g+4>>2]=c[e+4>>2];c[g+8>>2]=c[e+8>>2];c[g+12>>2]=c[e+12>>2];c[g+16>>2]=c[e+16>>2];c[g+20>>2]=c[e+20>>2];c[g+24>>2]=c[e+24>>2];c[g+28>>2]=c[e+28>>2];g=b+8|0;d=f;e=g+64|0;do{c[g>>2]=c[d>>2];g=g+4|0;d=d+4|0;}while((g|0)<(e|0));m=0;a[b>>0]=m;l=h;return}else {a[b+1>>0]=0;m=1;a[b>>0]=m;l=h;return}}function vc(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0;n=l;l=l+960|0;f=n+768|0;g=n+704|0;h=n+512|0;i=n+320|0;j=n+128|0;k=n;dd(k,e);dd(g,d);m=f;o=d;p=m+64|0;do{c[m>>2]=c[o>>2];m=m+4|0;o=o+4|0;}while((m|0)<(p|0));cd(i,g,f);c[g>>2]=c[i>>2];c[g+4>>2]=c[i+4>>2];c[g+8>>2]=c[i+8>>2];c[g+12>>2]=c[i+12>>2];c[g+16>>2]=c[i+16>>2];c[g+20>>2]=c[i+20>>2];c[g+24>>2]=c[i+24>>2];c[g+28>>2]=c[i+28>>2];p=f;c[p>>2]=2008548008;c[p+4>>2]=1006188771;p=f+8|0;c[p>>2]=909333341;c[p+4>>2]=34282279;p=f+16|0;c[p>>2]=1232425568;c[p+4>>2]=649588208;p=f+24|0;c[p>>2]=1132767341;c[p+4>>2]=622118450;Kc(g,f,136);c[j>>2]=c[g>>2];c[j+4>>2]=c[g+4>>2];c[j+8>>2]=c[g+8>>2];c[j+12>>2]=c[g+12>>2];c[j+16>>2]=c[g+16>>2];c[j+20>>2]=c[g+20>>2];c[j+24>>2]=c[g+24>>2];c[j+28>>2]=c[g+28>>2];p=i+32|0;c[g>>2]=c[p>>2];c[g+4>>2]=c[p+4>>2];c[g+8>>2]=c[p+8>>2];c[g+12>>2]=c[p+12>>2];c[g+16>>2]=c[p+16>>2];c[g+20>>2]=c[p+20>>2];c[g+24>>2]=c[p+24>>2];c[g+28>>2]=c[p+28>>2];p=f;c[p>>2]=-774045849;c[p+4>>2]=954723532;p=f+8|0;c[p>>2]=-1815212738;c[p+4>>2]=1710273405;p=f+16|0;c[p>>2]=581697706;c[p+4>>2]=-683028259;p=f+24|0;c[p>>2]=1248365901;c[p+4>>2]=21084622;Kc(g,f,136);c[h>>2]=c[g>>2];c[h+4>>2]=c[g+4>>2];c[h+8>>2]=c[g+8>>2];c[h+12>>2]=c[g+12>>2];c[h+16>>2]=c[g+16>>2];c[h+20>>2]=c[g+20>>2];c[h+24>>2]=c[g+24>>2];c[h+28>>2]=c[g+28>>2];p=j+32|0;c[p>>2]=c[h>>2];c[p+4>>2]=c[h+4>>2];c[p+8>>2]=c[h+8>>2];c[p+12>>2]=c[h+12>>2];c[p+16>>2]=c[h+16>>2];c[p+20>>2]=c[h+20>>2];c[p+24>>2]=c[h+24>>2];c[p+28>>2]=c[h+28>>2];if((Xj(k,j,32)|0)==0?(Xj(k+32|0,j+32|0,32)|0)==0:0){m=k;o=d;p=m+64|0;do{c[m>>2]=c[o>>2];m=m+4|0;o=o+4|0;}while((m|0)<(p|0));m=k+64|0;o=e;p=m+64|0;do{c[m>>2]=c[o>>2];m=m+4|0;o=o+4|0;}while((m|0)<(p|0));m=h;o=k;p=m+128|0;do{c[m>>2]=c[o>>2];m=m+4|0;o=o+4|0;}while((m|0)<(p|0));m=h+128|0;c[m>>2]=-980480611;c[m+4>>2]=-748862579;m=h+136|0;c[m>>2]=-171504835;c[m+4>>2]=175696680;m=h+144|0;c[m>>2]=2021213740;c[m+4>>2]=1718526831;m=h+152|0;c[m>>2]=-1710760145;c[m+4>>2]=235567041;m=h+160|0;c[m>>2]=0;c[m+4>>2]=0;c[m+8>>2]=0;c[m+12>>2]=0;c[m+16>>2]=0;c[m+20>>2]=0;c[m+24>>2]=0;c[m+28>>2]=0;m=f;c[m>>2]=1342177275;c[m+4>>2]=-1399442404;m=f+8|0;c[m>>2]=-1621045975;c[m+4>>2]=922515093;m=f+16|0;c[m>>2]=2021213742;c[m+4>>2]=1718526831;m=f+24|0;c[m>>2]=-1710760145;c[m+4>>2]=235567041;Nc(f,8);c[g>>2]=c[f>>2];c[g+4>>2]=c[f+4>>2];c[g+8>>2]=c[f+8>>2];c[g+12>>2]=c[f+12>>2];c[g+16>>2]=c[f+16>>2];c[g+20>>2]=c[f+20>>2];c[g+24>>2]=c[f+24>>2];c[g+28>>2]=c[f+28>>2];wc(i,h,g);m=f;o=k;p=m+128|0;do{c[m>>2]=c[o>>2];m=m+4|0;o=o+4|0;}while((m|0)<(p|0));p=f+128|0;c[p>>2]=-980480611;c[p+4>>2]=-748862579;p=f+136|0;c[p>>2]=-171504835;c[p+4>>2]=175696680;p=f+144|0;c[p>>2]=2021213740;c[p+4>>2]=1718526831;p=f+152|0;c[p>>2]=-1710760145;c[p+4>>2]=235567041;p=f+160|0;c[p>>2]=0;c[p+4>>2]=0;c[p+8>>2]=0;c[p+12>>2]=0;c[p+16>>2]=0;c[p+20>>2]=0;c[p+24>>2]=0;c[p+28>>2]=0;xc(j,i,f);p=j+128|0;do if((c[p>>2]|0)==0&(c[p+4>>2]|0)==0){p=j+136|0;if(!((c[p>>2]|0)==0&(c[p+4>>2]|0)==0))break;p=j+144|0;if(!((c[p>>2]|0)==0&(c[p+4>>2]|0)==0))break;p=j+152|0;if(!((c[p>>2]|0)==0&(c[p+4>>2]|0)==0))break;p=j+160|0;if(!((c[p>>2]|0)==0&(c[p+4>>2]|0)==0))break;p=j+168|0;if(!((c[p>>2]|0)==0&(c[p+4>>2]|0)==0))break;p=j+176|0;if(!((c[p>>2]|0)==0&(c[p+4>>2]|0)==0))break;p=j+184|0;if((c[p>>2]|0)==0&(c[p+4>>2]|0)==0){m=f;o=d;p=m+64|0;do{c[m>>2]=c[o>>2];m=m+4|0;o=o+4|0;}while((m|0)<(p|0));m=f+64|0;o=e;p=m+64|0;do{c[m>>2]=c[o>>2];m=m+4|0;o=o+4|0;}while((m|0)<(p|0));a[b>>0]=0;m=b+8|0;o=f;p=m+128|0;do{c[m>>2]=c[o>>2];m=m+4|0;o=o+4|0;}while((m|0)<(p|0));l=n;return}}while(0);a[b>>0]=1;a[b+1>>0]=1;l=n;return}a[b>>0]=1;a[b+1>>0]=0;l=n;return}function wc(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0;n=l;l=l+800|0;h=n+608|0;i=n+416|0;j=n+224|0;k=n+192|0;m=n;f=m;g=f+64|0;do{c[f>>2]=0;f=f+4|0;}while((f|0)<(g|0));f=m+64|0;c[f>>2]=-980480611;c[f+4>>2]=-748862579;f=m+72|0;c[f>>2]=-171504835;c[f+4>>2]=175696680;f=m+80|0;c[f>>2]=2021213740;c[f+4>>2]=1718526831;f=m+88|0;c[f>>2]=-1710760145;c[f+4>>2]=235567041;f=m+96|0;g=f+96|0;do{c[f>>2]=0;f=f+4|0;}while((f|0)<(g|0));c[i>>2]=c[d>>2];c[i+4>>2]=c[d+4>>2];c[i+8>>2]=c[d+8>>2];c[i+12>>2]=c[d+12>>2];c[i+16>>2]=c[d+16>>2];c[i+20>>2]=c[d+20>>2];c[i+24>>2]=c[d+24>>2];c[i+28>>2]=c[d+28>>2];d=h;c[d>>2]=1;c[d+4>>2]=0;d=h+8|0;c[d>>2]=0;c[d+4>>2]=0;c[d+8>>2]=0;c[d+12>>2]=0;c[d+16>>2]=0;c[d+20>>2]=0;Mc(i,h,8,-268435457,-1025378925);c[k>>2]=c[i>>2];c[k+4>>2]=c[i+4>>2];c[k+8>>2]=c[i+8>>2];c[k+12>>2]=c[i+12>>2];c[k+16>>2]=c[i+16>>2];c[k+20>>2]=c[i+20>>2];c[k+24>>2]=c[i+24>>2];c[k+28>>2]=c[i+28>>2];d=256;while(1){if(!d){d=7;break}d=d+-1|0;if(d>>>0>255){d=7;break}g=k+(d>>>6<<3)|0;o=c[g>>2]|0;g=c[g+4>>2]|0;f=nk(1,0,d&63|0)|0;if(!((o&f|0)==0&(g&y|0)==0)){e=d;d=9;break}}if((d|0)==7){ok(a|0,m|0,192)|0;l=n;return}else if((d|0)==9){a:while(1){ok(i|0,m|0,192)|0;ok(h|0,b|0,192)|0;xc(j,i,h);ok(m|0,j|0,192)|0;while(1){if(!e){d=7;break a}e=e+-1|0;if(e>>>0>255){d=7;break a}o=k+(e>>>6<<3)|0;f=c[o>>2]|0;o=c[o+4>>2]|0;g=nk(1,0,e&63|0)|0;o=(f&g|0)==0&(o&y|0)==0;yc(h,m);ok(m|0,h|0,192)|0;if(!o)continue a}}if((d|0)==7){ok(a|0,m|0,192)|0;l=n;return}}}function xc(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;J=l;l=l+1696|0;E=J+1632|0;F=J+1568|0;G=J+1536|0;H=J+1472|0;v=J+1408|0;w=J+1344|0;x=J+1280|0;y=J+1216|0;z=J+1152|0;A=J+1088|0;B=J+1024|0;p=J+960|0;q=J+896|0;r=J+832|0;s=J+768|0;e=J+704|0;f=J+640|0;g=J+576|0;C=J+512|0;h=J+448|0;i=J+384|0;j=J+320|0;k=J+256|0;m=J+192|0;n=J+128|0;D=J+64|0;t=J;u=b+128|0;L=u;if((((((((c[L>>2]|0)==0&(c[L+4>>2]|0)==0?(L=b+136|0,(c[L>>2]|0)==0&(c[L+4>>2]|0)==0):0)?(L=b+144|0,(c[L>>2]|0)==0&(c[L+4>>2]|0)==0):0)?(L=b+152|0,(c[L>>2]|0)==0&(c[L+4>>2]|0)==0):0)?(L=b+160|0,(c[L>>2]|0)==0&(c[L+4>>2]|0)==0):0)?(L=b+168|0,(c[L>>2]|0)==0&(c[L+4>>2]|0)==0):0)?(L=b+176|0,(c[L>>2]|0)==0&(c[L+4>>2]|0)==0):0)?(L=b+184|0,(c[L>>2]|0)==0&(c[L+4>>2]|0)==0):0){ok(a|0,d|0,192)|0;l=J;return}o=d+128|0;L=o;if((((((((c[L>>2]|0)==0&(c[L+4>>2]|0)==0?(L=d+136|0,(c[L>>2]|0)==0&(c[L+4>>2]|0)==0):0)?(L=d+144|0,(c[L>>2]|0)==0&(c[L+4>>2]|0)==0):0)?(L=d+152|0,(c[L>>2]|0)==0&(c[L+4>>2]|0)==0):0)?(L=d+160|0,(c[L>>2]|0)==0&(c[L+4>>2]|0)==0):0)?(L=d+168|0,(c[L>>2]|0)==0&(c[L+4>>2]|0)==0):0)?(L=d+176|0,(c[L>>2]|0)==0&(c[L+4>>2]|0)==0):0)?(L=d+184|0,(c[L>>2]|0)==0&(c[L+4>>2]|0)==0):0){ok(a|0,b|0,192)|0;l=J;return}dd(t,u);dd(D,o);I=F;K=b;L=I+64|0;do{c[I>>2]=c[K>>2];I=I+4|0;K=K+4|0;}while((I|0)<(L|0));I=E;K=D;L=I+64|0;do{c[I>>2]=c[K>>2];I=I+4|0;K=K+4|0;}while((I|0)<(L|0));cd(n,F,E);I=F;K=d;L=I+64|0;do{c[I>>2]=c[K>>2];I=I+4|0;K=K+4|0;}while((I|0)<(L|0));I=E;K=t;L=I+64|0;do{c[I>>2]=c[K>>2];I=I+4|0;K=K+4|0;}while((I|0)<(L|0));cd(m,F,E);I=F;K=u;L=I+64|0;do{c[I>>2]=c[K>>2];I=I+4|0;K=K+4|0;}while((I|0)<(L|0));I=E;K=t;L=I+64|0;do{c[I>>2]=c[K>>2];I=I+4|0;K=K+4|0;}while((I|0)<(L|0));cd(k,F,E);I=F;K=o;L=I+64|0;do{c[I>>2]=c[K>>2];I=I+4|0;K=K+4|0;}while((I|0)<(L|0));I=E;K=D;L=I+64|0;do{c[I>>2]=c[K>>2];I=I+4|0;K=K+4|0;}while((I|0)<(L|0));cd(j,F,E);I=F;K=b+64|0;L=I+64|0;do{c[I>>2]=c[K>>2];I=I+4|0;K=K+4|0;}while((I|0)<(L|0));I=E;K=j;L=I+64|0;do{c[I>>2]=c[K>>2];I=I+4|0;K=K+4|0;}while((I|0)<(L|0));cd(i,F,E);I=F;K=d+64|0;L=I+64|0;do{c[I>>2]=c[K>>2];I=I+4|0;K=K+4|0;}while((I|0)<(L|0));I=E;K=k;L=I+64|0;do{c[I>>2]=c[K>>2];I=I+4|0;K=K+4|0;}while((I|0)<(L|0));cd(h,F,E);if((((Xj(n,m,32)|0)==0?(Xj(n+32|0,m+32|0,32)|0)==0:0)?(Xj(i,h,32)|0)==0:0)?(Xj(i+32|0,h+32|0,32)|0)==0:0)yc(a,b);else {I=v;K=m;L=I+64|0;do{c[I>>2]=c[K>>2];I=I+4|0;K=K+4|0;}while((I|0)<(L|0));I=H;K=n;L=I+64|0;do{c[I>>2]=c[K>>2];I=I+4|0;K=K+4|0;}while((I|0)<(L|0));c[F>>2]=c[m>>2];c[F+4>>2]=c[m+4>>2];c[F+8>>2]=c[m+8>>2];c[F+12>>2]=c[m+12>>2];c[F+16>>2]=c[m+16>>2];c[F+20>>2]=c[m+20>>2];c[F+24>>2]=c[m+24>>2];c[F+28>>2]=c[m+28>>2];c[E>>2]=c[n>>2];c[E+4>>2]=c[n+4>>2];c[E+8>>2]=c[n+8>>2];c[E+12>>2]=c[n+12>>2];c[E+16>>2]=c[n+16>>2];c[E+20>>2]=c[n+20>>2];c[E+24>>2]=c[n+24>>2];c[E+28>>2]=c[n+28>>2];Lc(F,E,136);c[C>>2]=c[F>>2];c[C+4>>2]=c[F+4>>2];c[C+8>>2]=c[F+8>>2];c[C+12>>2]=c[F+12>>2];c[C+16>>2]=c[F+16>>2];c[C+20>>2]=c[F+20>>2];c[C+24>>2]=c[F+24>>2];c[C+28>>2]=c[F+28>>2];I=v+32|0;c[F>>2]=c[I>>2];c[F+4>>2]=c[I+4>>2];c[F+8>>2]=c[I+8>>2];c[F+12>>2]=c[I+12>>2];c[F+16>>2]=c[I+16>>2];c[F+20>>2]=c[I+20>>2];c[F+24>>2]=c[I+24>>2];c[F+28>>2]=c[I+28>>2];I=H+32|0;c[E>>2]=c[I>>2];c[E+4>>2]=c[I+4>>2];c[E+8>>2]=c[I+8>>2];c[E+12>>2]=c[I+12>>2];c[E+16>>2]=c[I+16>>2];c[E+20>>2]=c[I+20>>2];c[E+24>>2]=c[I+24>>2];c[E+28>>2]=c[I+28>>2];Lc(F,E,136);c[G>>2]=c[F>>2];c[G+4>>2]=c[F+4>>2];c[G+8>>2]=c[F+8>>2];c[G+12>>2]=c[F+12>>2];c[G+16>>2]=c[F+16>>2];c[G+20>>2]=c[F+20>>2];c[G+24>>2]=c[F+24>>2];c[G+28>>2]=c[F+28>>2];I=C+32|0;c[I>>2]=c[G>>2];c[I+4>>2]=c[G+4>>2];c[I+8>>2]=c[G+8>>2];c[I+12>>2]=c[G+12>>2];c[I+16>>2]=c[G+16>>2];c[I+20>>2]=c[G+20>>2];c[I+24>>2]=c[G+24>>2];c[I+28>>2]=c[G+28>>2];I=v;K=h;L=I+64|0;do{c[I>>2]=c[K>>2];I=I+4|0;K=K+4|0;}while((I|0)<(L|0));I=H;K=i;L=I+64|0;do{c[I>>2]=c[K>>2];I=I+4|0;K=K+4|0;}while((I|0)<(L|0));c[F>>2]=c[h>>2];c[F+4>>2]=c[h+4>>2];c[F+8>>2]=c[h+8>>2];c[F+12>>2]=c[h+12>>2];c[F+16>>2]=c[h+16>>2];c[F+20>>2]=c[h+20>>2];c[F+24>>2]=c[h+24>>2];c[F+28>>2]=c[h+28>>2];c[E>>2]=c[i>>2];c[E+4>>2]=c[i+4>>2];c[E+8>>2]=c[i+8>>2];c[E+12>>2]=c[i+12>>2];c[E+16>>2]=c[i+16>>2];c[E+20>>2]=c[i+20>>2];c[E+24>>2]=c[i+24>>2];c[E+28>>2]=c[i+28>>2];Lc(F,E,136);c[g>>2]=c[F>>2];c[g+4>>2]=c[F+4>>2];c[g+8>>2]=c[F+8>>2];c[g+12>>2]=c[F+12>>2];c[g+16>>2]=c[F+16>>2];c[g+20>>2]=c[F+20>>2];c[g+24>>2]=c[F+24>>2];c[g+28>>2]=c[F+28>>2];I=v+32|0;c[F>>2]=c[I>>2];c[F+4>>2]=c[I+4>>2];c[F+8>>2]=c[I+8>>2];c[F+12>>2]=c[I+12>>2];c[F+16>>2]=c[I+16>>2];c[F+20>>2]=c[I+20>>2];c[F+24>>2]=c[I+24>>2];c[F+28>>2]=c[I+28>>2];I=H+32|0;c[E>>2]=c[I>>2];c[E+4>>2]=c[I+4>>2];c[E+8>>2]=c[I+8>>2];c[E+12>>2]=c[I+12>>2];c[E+16>>2]=c[I+16>>2];c[E+20>>2]=c[I+20>>2];c[E+24>>2]=c[I+24>>2];c[E+28>>2]=c[I+28>>2];Lc(F,E,136);c[G>>2]=c[F>>2];c[G+4>>2]=c[F+4>>2];c[G+8>>2]=c[F+8>>2];c[G+12>>2]=c[F+12>>2];c[G+16>>2]=c[F+16>>2];c[G+20>>2]=c[F+20>>2];c[G+24>>2]=c[F+24>>2];c[G+28>>2]=c[F+28>>2];I=g+32|0;c[I>>2]=c[G>>2];c[I+4>>2]=c[G+4>>2];c[I+8>>2]=c[G+8>>2];c[I+12>>2]=c[G+12>>2];c[I+16>>2]=c[G+16>>2];c[I+20>>2]=c[G+20>>2];c[I+24>>2]=c[G+24>>2];c[I+28>>2]=c[G+28>>2];I=v;K=C;L=I+64|0;do{c[I>>2]=c[K>>2];I=I+4|0;K=K+4|0;}while((I|0)<(L|0));I=H;K=C;L=I+64|0;do{c[I>>2]=c[K>>2];I=I+4|0;K=K+4|0;}while((I|0)<(L|0));c[F>>2]=c[v>>2];c[F+4>>2]=c[v+4>>2];c[F+8>>2]=c[v+8>>2];c[F+12>>2]=c[v+12>>2];c[F+16>>2]=c[v+16>>2];c[F+20>>2]=c[v+20>>2];c[F+24>>2]=c[v+24>>2];c[F+28>>2]=c[v+28>>2];c[E>>2]=c[C>>2];c[E+4>>2]=c[C+4>>2];c[E+8>>2]=c[C+8>>2];c[E+12>>2]=c[C+12>>2];c[E+16>>2]=c[C+16>>2];c[E+20>>2]=c[C+20>>2];c[E+24>>2]=c[C+24>>2];c[E+28>>2]=c[C+28>>2];Kc(F,E,136);c[w>>2]=c[F>>2];c[w+4>>2]=c[F+4>>2];c[w+8>>2]=c[F+8>>2];c[w+12>>2]=c[F+12>>2];c[w+16>>2]=c[F+16>>2];c[w+20>>2]=c[F+20>>2];c[w+24>>2]=c[F+24>>2];c[w+28>>2]=c[F+28>>2];I=v+32|0;c[F>>2]=c[I>>2];c[F+4>>2]=c[I+4>>2];c[F+8>>2]=c[I+8>>2];c[F+12>>2]=c[I+12>>2];c[F+16>>2]=c[I+16>>2];c[F+20>>2]=c[I+20>>2];c[F+24>>2]=c[I+24>>2];c[F+28>>2]=c[I+28>>2];I=H+32|0;c[E>>2]=c[I>>2];c[E+4>>2]=c[I+4>>2];c[E+8>>2]=c[I+8>>2];c[E+12>>2]=c[I+12>>2];c[E+16>>2]=c[I+16>>2];c[E+20>>2]=c[I+20>>2];c[E+24>>2]=c[I+24>>2];c[E+28>>2]=c[I+28>>2];Kc(F,E,136);c[G>>2]=c[F>>2];c[G+4>>2]=c[F+4>>2];c[G+8>>2]=c[F+8>>2];c[G+12>>2]=c[F+12>>2];c[G+16>>2]=c[F+16>>2];c[G+20>>2]=c[F+20>>2];c[G+24>>2]=c[F+24>>2];c[G+28>>2]=c[F+28>>2];I=w+32|0;c[I>>2]=c[G>>2];c[I+4>>2]=c[G+4>>2];c[I+8>>2]=c[G+8>>2];c[I+12>>2]=c[G+12>>2];c[I+16>>2]=c[G+16>>2];c[I+20>>2]=c[G+20>>2];c[I+24>>2]=c[G+24>>2];c[I+28>>2]=c[G+28>>2];dd(f,w);I=F;K=C;L=I+64|0;do{c[I>>2]=c[K>>2];I=I+4|0;K=K+4|0;}while((I|0)<(L|0));I=E;K=f;L=I+64|0;do{c[I>>2]=c[K>>2];I=I+4|0;K=K+4|0;}while((I|0)<(L|0));cd(e,F,E);I=v;K=g;L=I+64|0;do{c[I>>2]=c[K>>2];I=I+4|0;K=K+4|0;}while((I|0)<(L|0));I=H;K=g;L=I+64|0;do{c[I>>2]=c[K>>2];I=I+4|0;K=K+4|0;}while((I|0)<(L|0));c[F>>2]=c[v>>2];c[F+4>>2]=c[v+4>>2];c[F+8>>2]=c[v+8>>2];c[F+12>>2]=c[v+12>>2];c[F+16>>2]=c[v+16>>2];c[F+20>>2]=c[v+20>>2];c[F+24>>2]=c[v+24>>2];c[F+28>>2]=c[v+28>>2];c[E>>2]=c[g>>2];c[E+4>>2]=c[g+4>>2];c[E+8>>2]=c[g+8>>2];c[E+12>>2]=c[g+12>>2];c[E+16>>2]=c[g+16>>2];c[E+20>>2]=c[g+20>>2];c[E+24>>2]=c[g+24>>2];c[E+28>>2]=c[g+28>>2];Kc(F,E,136);c[s>>2]=c[F>>2];c[s+4>>2]=c[F+4>>2];c[s+8>>2]=c[F+8>>2];c[s+12>>2]=c[F+12>>2];c[s+16>>2]=c[F+16>>2];c[s+20>>2]=c[F+20>>2];c[s+24>>2]=c[F+24>>2];c[s+28>>2]=c[F+28>>2];I=v+32|0;c[F>>2]=c[I>>2];c[F+4>>2]=c[I+4>>2];c[F+8>>2]=c[I+8>>2];c[F+12>>2]=c[I+12>>2];c[F+16>>2]=c[I+16>>2];c[F+20>>2]=c[I+20>>2];c[F+24>>2]=c[I+24>>2];c[F+28>>2]=c[I+28>>2];I=H+32|0;c[E>>2]=c[I>>2];c[E+4>>2]=c[I+4>>2];c[E+8>>2]=c[I+8>>2];c[E+12>>2]=c[I+12>>2];c[E+16>>2]=c[I+16>>2];c[E+20>>2]=c[I+20>>2];c[E+24>>2]=c[I+24>>2];c[E+28>>2]=c[I+28>>2];Kc(F,E,136);c[G>>2]=c[F>>2];c[G+4>>2]=c[F+4>>2];c[G+8>>2]=c[F+8>>2];c[G+12>>2]=c[F+12>>2];c[G+16>>2]=c[F+16>>2];c[G+20>>2]=c[F+20>>2];c[G+24>>2]=c[F+24>>2];c[G+28>>2]=c[F+28>>2];I=s+32|0;c[I>>2]=c[G>>2];c[I+4>>2]=c[G+4>>2];c[I+8>>2]=c[G+8>>2];c[I+12>>2]=c[G+12>>2];c[I+16>>2]=c[G+16>>2];c[I+20>>2]=c[G+20>>2];c[I+24>>2]=c[G+24>>2];c[I+28>>2]=c[G+28>>2];I=F;K=n;L=I+64|0;do{c[I>>2]=c[K>>2];I=I+4|0;K=K+4|0;}while((I|0)<(L|0));I=E;K=f;L=I+64|0;do{c[I>>2]=c[K>>2];I=I+4|0;K=K+4|0;}while((I|0)<(L|0));cd(r,F,E);I=F;K=i;L=I+64|0;do{c[I>>2]=c[K>>2];I=I+4|0;K=K+4|0;}while((I|0)<(L|0));I=E;K=e;L=I+64|0;do{c[I>>2]=c[K>>2];I=I+4|0;K=K+4|0;}while((I|0)<(L|0));cd(q,F,E);dd(v,s);I=H;K=e;L=I+64|0;do{c[I>>2]=c[K>>2];I=I+4|0;K=K+4|0;}while((I|0)<(L|0));c[F>>2]=c[v>>2];c[F+4>>2]=c[v+4>>2];c[F+8>>2]=c[v+8>>2];c[F+12>>2]=c[v+12>>2];c[F+16>>2]=c[v+16>>2];c[F+20>>2]=c[v+20>>2];c[F+24>>2]=c[v+24>>2];c[F+28>>2]=c[v+28>>2];c[E>>2]=c[e>>2];c[E+4>>2]=c[e+4>>2];c[E+8>>2]=c[e+8>>2];c[E+12>>2]=c[e+12>>2];c[E+16>>2]=c[e+16>>2];c[E+20>>2]=c[e+20>>2];c[E+24>>2]=c[e+24>>2];c[E+28>>2]=c[e+28>>2];Lc(F,E,136);c[x>>2]=c[F>>2];c[x+4>>2]=c[F+4>>2];c[x+8>>2]=c[F+8>>2];c[x+12>>2]=c[F+12>>2];c[x+16>>2]=c[F+16>>2];c[x+20>>2]=c[F+20>>2];c[x+24>>2]=c[F+24>>2];c[x+28>>2]=c[F+28>>2];b=v+32|0;c[F>>2]=c[b>>2];c[F+4>>2]=c[b+4>>2];c[F+8>>2]=c[b+8>>2];c[F+12>>2]=c[b+12>>2];c[F+16>>2]=c[b+16>>2];c[F+20>>2]=c[b+20>>2];c[F+24>>2]=c[b+24>>2];c[F+28>>2]=c[b+28>>2];b=H+32|0;c[E>>2]=c[b>>2];c[E+4>>2]=c[b+4>>2];c[E+8>>2]=c[b+8>>2];c[E+12>>2]=c[b+12>>2];c[E+16>>2]=c[b+16>>2];c[E+20>>2]=c[b+20>>2];c[E+24>>2]=c[b+24>>2];c[E+28>>2]=c[b+28>>2];Lc(F,E,136);c[G>>2]=c[F>>2];c[G+4>>2]=c[F+4>>2];c[G+8>>2]=c[F+8>>2];c[G+12>>2]=c[F+12>>2];c[G+16>>2]=c[F+16>>2];c[G+20>>2]=c[F+20>>2];c[G+24>>2]=c[F+24>>2];c[G+28>>2]=c[F+28>>2];b=x+32|0;c[b>>2]=c[G>>2];c[b+4>>2]=c[G+4>>2];c[b+8>>2]=c[G+8>>2];c[b+12>>2]=c[G+12>>2];c[b+16>>2]=c[G+16>>2];c[b+20>>2]=c[G+20>>2];c[b+24>>2]=c[G+24>>2];c[b+28>>2]=c[G+28>>2];I=v;K=r;L=I+64|0;do{c[I>>2]=c[K>>2];I=I+4|0;K=K+4|0;}while((I|0)<(L|0));I=H;K=r;L=I+64|0;do{c[I>>2]=c[K>>2];I=I+4|0;K=K+4|0;}while((I|0)<(L|0));c[F>>2]=c[v>>2];c[F+4>>2]=c[v+4>>2];c[F+8>>2]=c[v+8>>2];c[F+12>>2]=c[v+12>>2];c[F+16>>2]=c[v+16>>2];c[F+20>>2]=c[v+20>>2];c[F+24>>2]=c[v+24>>2];c[F+28>>2]=c[v+28>>2];c[E>>2]=c[r>>2];c[E+4>>2]=c[r+4>>2];c[E+8>>2]=c[r+8>>2];c[E+12>>2]=c[r+12>>2];c[E+16>>2]=c[r+16>>2];c[E+20>>2]=c[r+20>>2];c[E+24>>2]=c[r+24>>2];c[E+28>>2]=c[r+28>>2];Kc(F,E,136);c[w>>2]=c[F>>2];c[w+4>>2]=c[F+4>>2];c[w+8>>2]=c[F+8>>2];c[w+12>>2]=c[F+12>>2];c[w+16>>2]=c[F+16>>2];c[w+20>>2]=c[F+20>>2];c[w+24>>2]=c[F+24>>2];c[w+28>>2]=c[F+28>>2];I=v+32|0;c[F>>2]=c[I>>2];c[F+4>>2]=c[I+4>>2];c[F+8>>2]=c[I+8>>2];c[F+12>>2]=c[I+12>>2];c[F+16>>2]=c[I+16>>2];c[F+20>>2]=c[I+20>>2];c[F+24>>2]=c[I+24>>2];c[F+28>>2]=c[I+28>>2];I=H+32|0;c[E>>2]=c[I>>2];c[E+4>>2]=c[I+4>>2];c[E+8>>2]=c[I+8>>2];c[E+12>>2]=c[I+12>>2];c[E+16>>2]=c[I+16>>2];c[E+20>>2]=c[I+20>>2];c[E+24>>2]=c[I+24>>2];c[E+28>>2]=c[I+28>>2];Kc(F,E,136);c[G>>2]=c[F>>2];c[G+4>>2]=c[F+4>>2];c[G+8>>2]=c[F+8>>2];c[G+12>>2]=c[F+12>>2];c[G+16>>2]=c[F+16>>2];c[G+20>>2]=c[F+20>>2];c[G+24>>2]=c[F+24>>2];c[G+28>>2]=c[F+28>>2];I=w+32|0;c[I>>2]=c[G>>2];c[I+4>>2]=c[G+4>>2];c[I+8>>2]=c[G+8>>2];c[I+12>>2]=c[G+12>>2];c[I+16>>2]=c[G+16>>2];c[I+20>>2]=c[G+20>>2];c[I+24>>2]=c[G+24>>2];c[I+28>>2]=c[G+28>>2];c[F>>2]=c[x>>2];c[F+4>>2]=c[x+4>>2];c[F+8>>2]=c[x+8>>2];c[F+12>>2]=c[x+12>>2];c[F+16>>2]=c[x+16>>2];c[F+20>>2]=c[x+20>>2];c[F+24>>2]=c[x+24>>2];c[F+28>>2]=c[x+28>>2];c[E>>2]=c[w>>2];c[E+4>>2]=c[w+4>>2];c[E+8>>2]=c[w+8>>2];c[E+12>>2]=c[w+12>>2];c[E+16>>2]=c[w+16>>2];c[E+20>>2]=c[w+20>>2];c[E+24>>2]=c[w+24>>2];c[E+28>>2]=c[w+28>>2];Lc(F,E,136);c[p>>2]=c[F>>2];c[p+4>>2]=c[F+4>>2];c[p+8>>2]=c[F+8>>2];c[p+12>>2]=c[F+12>>2];c[p+16>>2]=c[F+16>>2];c[p+20>>2]=c[F+20>>2];c[p+24>>2]=c[F+24>>2];c[p+28>>2]=c[F+28>>2];c[F>>2]=c[b>>2];c[F+4>>2]=c[b+4>>2];c[F+8>>2]=c[b+8>>2];c[F+12>>2]=c[b+12>>2];c[F+16>>2]=c[b+16>>2];c[F+20>>2]=c[b+20>>2];c[F+24>>2]=c[b+24>>2];c[F+28>>2]=c[b+28>>2];c[E>>2]=c[I>>2];c[E+4>>2]=c[I+4>>2];c[E+8>>2]=c[I+8>>2];c[E+12>>2]=c[I+12>>2];c[E+16>>2]=c[I+16>>2];c[E+20>>2]=c[I+20>>2];c[E+24>>2]=c[I+24>>2];c[E+28>>2]=c[I+28>>2];Lc(F,E,136);c[G>>2]=c[F>>2];c[G+4>>2]=c[F+4>>2];c[G+8>>2]=c[F+8>>2];c[G+12>>2]=c[F+12>>2];c[G+16>>2]=c[F+16>>2];c[G+20>>2]=c[F+20>>2];c[G+24>>2]=c[F+24>>2];c[G+28>>2]=c[F+28>>2];I=p+32|0;c[I>>2]=c[G>>2];c[I+4>>2]=c[G+4>>2];c[I+8>>2]=c[G+8>>2];c[I+12>>2]=c[G+12>>2];c[I+16>>2]=c[G+16>>2];c[I+20>>2]=c[G+20>>2];c[I+24>>2]=c[G+24>>2];c[I+28>>2]=c[G+28>>2];I=a;K=p;L=I+64|0;do{c[I>>2]=c[K>>2];I=I+4|0;K=K+4|0;}while((I|0)<(L|0));I=x;K=s;L=I+64|0;do{c[I>>2]=c[K>>2];I=I+4|0;K=K+4|0;}while((I|0)<(L|0));I=v;K=r;L=I+64|0;do{c[I>>2]=c[K>>2];I=I+4|0;K=K+4|0;}while((I|0)<(L|0));I=H;K=p;L=I+64|0;do{c[I>>2]=c[K>>2];I=I+4|0;K=K+4|0;}while((I|0)<(L|0));c[F>>2]=c[r>>2];c[F+4>>2]=c[r+4>>2];c[F+8>>2]=c[r+8>>2];c[F+12>>2]=c[r+12>>2];c[F+16>>2]=c[r+16>>2];c[F+20>>2]=c[r+20>>2];c[F+24>>2]=c[r+24>>2];c[F+28>>2]=c[r+28>>2];c[E>>2]=c[p>>2];c[E+4>>2]=c[p+4>>2];c[E+8>>2]=c[p+8>>2];c[E+12>>2]=c[p+12>>2];c[E+16>>2]=c[p+16>>2];c[E+20>>2]=c[p+20>>2];c[E+24>>2]=c[p+24>>2];c[E+28>>2]=c[p+28>>2];Lc(F,E,136);c[w>>2]=c[F>>2];c[w+4>>2]=c[F+4>>2];c[w+8>>2]=c[F+8>>2];c[w+12>>2]=c[F+12>>2];c[w+16>>2]=c[F+16>>2];c[w+20>>2]=c[F+20>>2];c[w+24>>2]=c[F+24>>2];c[w+28>>2]=c[F+28>>2];I=v+32|0;c[F>>2]=c[I>>2];c[F+4>>2]=c[I+4>>2];c[F+8>>2]=c[I+8>>2];c[F+12>>2]=c[I+12>>2];c[F+16>>2]=c[I+16>>2];c[F+20>>2]=c[I+20>>2];c[F+24>>2]=c[I+24>>2];c[F+28>>2]=c[I+28>>2];I=H+32|0;c[E>>2]=c[I>>2];c[E+4>>2]=c[I+4>>2];c[E+8>>2]=c[I+8>>2];c[E+12>>2]=c[I+12>>2];c[E+16>>2]=c[I+16>>2];c[E+20>>2]=c[I+20>>2];c[E+24>>2]=c[I+24>>2];c[E+28>>2]=c[I+28>>2];Lc(F,E,136);c[G>>2]=c[F>>2];c[G+4>>2]=c[F+4>>2];c[G+8>>2]=c[F+8>>2];c[G+12>>2]=c[F+12>>2];c[G+16>>2]=c[F+16>>2];c[G+20>>2]=c[F+20>>2];c[G+24>>2]=c[F+24>>2];c[G+28>>2]=c[F+28>>2];I=w+32|0;c[I>>2]=c[G>>2];c[I+4>>2]=c[G+4>>2];c[I+8>>2]=c[G+8>>2];c[I+12>>2]=c[G+12>>2];c[I+16>>2]=c[G+16>>2];c[I+20>>2]=c[G+20>>2];c[I+24>>2]=c[G+24>>2];c[I+28>>2]=c[G+28>>2];cd(y,x,w);I=v;K=q;L=I+64|0;do{c[I>>2]=c[K>>2];I=I+4|0;K=K+4|0;}while((I|0)<(L|0));I=H;K=q;L=I+64|0;do{c[I>>2]=c[K>>2];I=I+4|0;K=K+4|0;}while((I|0)<(L|0));c[F>>2]=c[v>>2];c[F+4>>2]=c[v+4>>2];c[F+8>>2]=c[v+8>>2];c[F+12>>2]=c[v+12>>2];c[F+16>>2]=c[v+16>>2];c[F+20>>2]=c[v+20>>2];c[F+24>>2]=c[v+24>>2];c[F+28>>2]=c[v+28>>2];c[E>>2]=c[q>>2];c[E+4>>2]=c[q+4>>2];c[E+8>>2]=c[q+8>>2];c[E+12>>2]=c[q+12>>2];c[E+16>>2]=c[q+16>>2];c[E+20>>2]=c[q+20>>2];c[E+24>>2]=c[q+24>>2];c[E+28>>2]=c[q+28>>2];Kc(F,E,136);c[w>>2]=c[F>>2];c[w+4>>2]=c[F+4>>2];c[w+8>>2]=c[F+8>>2];c[w+12>>2]=c[F+12>>2];c[w+16>>2]=c[F+16>>2];c[w+20>>2]=c[F+20>>2];c[w+24>>2]=c[F+24>>2];c[w+28>>2]=c[F+28>>2];I=v+32|0;c[F>>2]=c[I>>2];c[F+4>>2]=c[I+4>>2];c[F+8>>2]=c[I+8>>2];c[F+12>>2]=c[I+12>>2];c[F+16>>2]=c[I+16>>2];c[F+20>>2]=c[I+20>>2];c[F+24>>2]=c[I+24>>2];c[F+28>>2]=c[I+28>>2];I=H+32|0;c[E>>2]=c[I>>2];c[E+4>>2]=c[I+4>>2];c[E+8>>2]=c[I+8>>2];c[E+12>>2]=c[I+12>>2];c[E+16>>2]=c[I+16>>2];c[E+20>>2]=c[I+20>>2];c[E+24>>2]=c[I+24>>2];c[E+28>>2]=c[I+28>>2];Kc(F,E,136);c[G>>2]=c[F>>2];c[G+4>>2]=c[F+4>>2];c[G+8>>2]=c[F+8>>2];c[G+12>>2]=c[F+12>>2];c[G+16>>2]=c[F+16>>2];c[G+20>>2]=c[F+20>>2];c[G+24>>2]=c[F+24>>2];c[G+28>>2]=c[F+28>>2];I=w+32|0;c[I>>2]=c[G>>2];c[I+4>>2]=c[G+4>>2];c[I+8>>2]=c[G+8>>2];c[I+12>>2]=c[G+12>>2];c[I+16>>2]=c[G+16>>2];c[I+20>>2]=c[G+20>>2];c[I+24>>2]=c[G+24>>2];c[I+28>>2]=c[G+28>>2];c[F>>2]=c[y>>2];c[F+4>>2]=c[y+4>>2];c[F+8>>2]=c[y+8>>2];c[F+12>>2]=c[y+12>>2];c[F+16>>2]=c[y+16>>2];c[F+20>>2]=c[y+20>>2];c[F+24>>2]=c[y+24>>2];c[F+28>>2]=c[y+28>>2];c[E>>2]=c[w>>2];c[E+4>>2]=c[w+4>>2];c[E+8>>2]=c[w+8>>2];c[E+12>>2]=c[w+12>>2];c[E+16>>2]=c[w+16>>2];c[E+20>>2]=c[w+20>>2];c[E+24>>2]=c[w+24>>2];c[E+28>>2]=c[w+28>>2];Lc(F,E,136);c[B>>2]=c[F>>2];c[B+4>>2]=c[F+4>>2];c[B+8>>2]=c[F+8>>2];c[B+12>>2]=c[F+12>>2];c[B+16>>2]=c[F+16>>2];c[B+20>>2]=c[F+20>>2];c[B+24>>2]=c[F+24>>2];c[B+28>>2]=c[F+28>>2];K=y+32|0;c[F>>2]=c[K>>2];c[F+4>>2]=c[K+4>>2];c[F+8>>2]=c[K+8>>2];c[F+12>>2]=c[K+12>>2];c[F+16>>2]=c[K+16>>2];c[F+20>>2]=c[K+20>>2];c[F+24>>2]=c[K+24>>2];c[F+28>>2]=c[K+28>>2];c[E>>2]=c[I>>2];c[E+4>>2]=c[I+4>>2];c[E+8>>2]=c[I+8>>2];c[E+12>>2]=c[I+12>>2];c[E+16>>2]=c[I+16>>2];c[E+20>>2]=c[I+20>>2];c[E+24>>2]=c[I+24>>2];c[E+28>>2]=c[I+28>>2];Lc(F,E,136);c[G>>2]=c[F>>2];c[G+4>>2]=c[F+4>>2];c[G+8>>2]=c[F+8>>2];c[G+12>>2]=c[F+12>>2];c[G+16>>2]=c[F+16>>2];c[G+20>>2]=c[F+20>>2];c[G+24>>2]=c[F+24>>2];c[G+28>>2]=c[F+28>>2];I=B+32|0;c[I>>2]=c[G>>2];c[I+4>>2]=c[G+4>>2];c[I+8>>2]=c[G+8>>2];c[I+12>>2]=c[G+12>>2];c[I+16>>2]=c[G+16>>2];c[I+20>>2]=c[G+20>>2];c[I+24>>2]=c[G+24>>2];c[I+28>>2]=c[G+28>>2];I=v;K=u;L=I+64|0;do{c[I>>2]=c[K>>2];I=I+4|0;K=K+4|0;}while((I|0)<(L|0));I=H;K=o;L=I+64|0;do{c[I>>2]=c[K>>2];I=I+4|0;K=K+4|0;}while((I|0)<(L|0));c[F>>2]=c[u>>2];c[F+4>>2]=c[u+4>>2];c[F+8>>2]=c[u+8>>2];c[F+12>>2]=c[u+12>>2];c[F+16>>2]=c[u+16>>2];c[F+20>>2]=c[u+20>>2];c[F+24>>2]=c[u+24>>2];c[F+28>>2]=c[u+28>>2];c[E>>2]=c[o>>2];c[E+4>>2]=c[o+4>>2];c[E+8>>2]=c[o+8>>2];c[E+12>>2]=c[o+12>>2];c[E+16>>2]=c[o+16>>2];c[E+20>>2]=c[o+20>>2];c[E+24>>2]=c[o+24>>2];c[E+28>>2]=c[o+28>>2];Kc(F,E,136);c[w>>2]=c[F>>2];c[w+4>>2]=c[F+4>>2];c[w+8>>2]=c[F+8>>2];c[w+12>>2]=c[F+12>>2];c[w+16>>2]=c[F+16>>2];c[w+20>>2]=c[F+20>>2];c[w+24>>2]=c[F+24>>2];c[w+28>>2]=c[F+28>>2];I=v+32|0;c[F>>2]=c[I>>2];c[F+4>>2]=c[I+4>>2];c[F+8>>2]=c[I+8>>2];c[F+12>>2]=c[I+12>>2];c[F+16>>2]=c[I+16>>2];c[F+20>>2]=c[I+20>>2];c[F+24>>2]=c[I+24>>2];c[F+28>>2]=c[I+28>>2];I=H+32|0;c[E>>2]=c[I>>2];c[E+4>>2]=c[I+4>>2];c[E+8>>2]=c[I+8>>2];c[E+12>>2]=c[I+12>>2];c[E+16>>2]=c[I+16>>2];c[E+20>>2]=c[I+20>>2];c[E+24>>2]=c[I+24>>2];c[E+28>>2]=c[I+28>>2];Kc(F,E,136);c[G>>2]=c[F>>2];c[G+4>>2]=c[F+4>>2];c[G+8>>2]=c[F+8>>2];c[G+12>>2]=c[F+12>>2];c[G+16>>2]=c[F+16>>2];c[G+20>>2]=c[F+20>>2];c[G+24>>2]=c[F+24>>2];c[G+28>>2]=c[F+28>>2];I=w+32|0;c[I>>2]=c[G>>2];c[I+4>>2]=c[G+4>>2];c[I+8>>2]=c[G+8>>2];c[I+12>>2]=c[G+12>>2];c[I+16>>2]=c[G+16>>2];c[I+20>>2]=c[G+20>>2];c[I+24>>2]=c[G+24>>2];c[I+28>>2]=c[G+28>>2];dd(x,w);I=H;K=t;L=I+64|0;do{c[I>>2]=c[K>>2];I=I+4|0;K=K+4|0;}while((I|0)<(L|0));c[F>>2]=c[x>>2];c[F+4>>2]=c[x+4>>2];c[F+8>>2]=c[x+8>>2];c[F+12>>2]=c[x+12>>2];c[F+16>>2]=c[x+16>>2];c[F+20>>2]=c[x+20>>2];c[F+24>>2]=c[x+24>>2];c[F+28>>2]=c[x+28>>2];c[E>>2]=c[t>>2];c[E+4>>2]=c[t+4>>2];c[E+8>>2]=c[t+8>>2];c[E+12>>2]=c[t+12>>2];c[E+16>>2]=c[t+16>>2];c[E+20>>2]=c[t+20>>2];c[E+24>>2]=c[t+24>>2];c[E+28>>2]=c[t+28>>2];Lc(F,E,136);c[y>>2]=c[F>>2];c[y+4>>2]=c[F+4>>2];c[y+8>>2]=c[F+8>>2];c[y+12>>2]=c[F+12>>2];c[y+16>>2]=c[F+16>>2];c[y+20>>2]=c[F+20>>2];c[y+24>>2]=c[F+24>>2];c[y+28>>2]=c[F+28>>2];b=x+32|0;c[F>>2]=c[b>>2];c[F+4>>2]=c[b+4>>2];c[F+8>>2]=c[b+8>>2];c[F+12>>2]=c[b+12>>2];c[F+16>>2]=c[b+16>>2];c[F+20>>2]=c[b+20>>2];c[F+24>>2]=c[b+24>>2];c[F+28>>2]=c[b+28>>2];b=H+32|0;c[E>>2]=c[b>>2];c[E+4>>2]=c[b+4>>2];c[E+8>>2]=c[b+8>>2];c[E+12>>2]=c[b+12>>2];c[E+16>>2]=c[b+16>>2];c[E+20>>2]=c[b+20>>2];c[E+24>>2]=c[b+24>>2];c[E+28>>2]=c[b+28>>2];Lc(F,E,136);c[G>>2]=c[F>>2];c[G+4>>2]=c[F+4>>2];c[G+8>>2]=c[F+8>>2];c[G+12>>2]=c[F+12>>2];c[G+16>>2]=c[F+16>>2];c[G+20>>2]=c[F+20>>2];c[G+24>>2]=c[F+24>>2];c[G+28>>2]=c[F+28>>2];b=y+32|0;c[b>>2]=c[G>>2];c[b+4>>2]=c[G+4>>2];c[b+8>>2]=c[G+8>>2];c[b+12>>2]=c[G+12>>2];c[b+16>>2]=c[G+16>>2];c[b+20>>2]=c[G+20>>2];c[b+24>>2]=c[G+24>>2];c[b+28>>2]=c[G+28>>2];I=H;K=D;L=I+64|0;do{c[I>>2]=c[K>>2];I=I+4|0;K=K+4|0;}while((I|0)<(L|0));c[F>>2]=c[y>>2];c[F+4>>2]=c[y+4>>2];c[F+8>>2]=c[y+8>>2];c[F+12>>2]=c[y+12>>2];c[F+16>>2]=c[y+16>>2];c[F+20>>2]=c[y+20>>2];c[F+24>>2]=c[y+24>>2];c[F+28>>2]=c[y+28>>2];c[E>>2]=c[D>>2];c[E+4>>2]=c[D+4>>2];c[E+8>>2]=c[D+8>>2];c[E+12>>2]=c[D+12>>2];c[E+16>>2]=c[D+16>>2];c[E+20>>2]=c[D+20>>2];c[E+24>>2]=c[D+24>>2];c[E+28>>2]=c[D+28>>2];Lc(F,E,136);c[z>>2]=c[F>>2];c[z+4>>2]=c[F+4>>2];c[z+8>>2]=c[F+8>>2];c[z+12>>2]=c[F+12>>2];c[z+16>>2]=c[F+16>>2];c[z+20>>2]=c[F+20>>2];c[z+24>>2]=c[F+24>>2];c[z+28>>2]=c[F+28>>2];c[F>>2]=c[b>>2];c[F+4>>2]=c[b+4>>2];c[F+8>>2]=c[b+8>>2];c[F+12>>2]=c[b+12>>2];c[F+16>>2]=c[b+16>>2];c[F+20>>2]=c[b+20>>2];c[F+24>>2]=c[b+24>>2];c[F+28>>2]=c[b+28>>2];I=H+32|0;c[E>>2]=c[I>>2];c[E+4>>2]=c[I+4>>2];c[E+8>>2]=c[I+8>>2];c[E+12>>2]=c[I+12>>2];c[E+16>>2]=c[I+16>>2];c[E+20>>2]=c[I+20>>2];c[E+24>>2]=c[I+24>>2];c[E+28>>2]=c[I+28>>2];Lc(F,E,136);c[G>>2]=c[F>>2];c[G+4>>2]=c[F+4>>2];c[G+8>>2]=c[F+8>>2];c[G+12>>2]=c[F+12>>2];c[G+16>>2]=c[F+16>>2];c[G+20>>2]=c[F+20>>2];c[G+24>>2]=c[F+24>>2];c[G+28>>2]=c[F+28>>2];I=z+32|0;c[I>>2]=c[G>>2];c[I+4>>2]=c[G+4>>2];c[I+8>>2]=c[G+8>>2];c[I+12>>2]=c[G+12>>2];c[I+16>>2]=c[G+16>>2];c[I+20>>2]=c[G+20>>2];c[I+24>>2]=c[G+24>>2];c[I+28>>2]=c[G+28>>2];I=E;K=C;L=I+64|0;do{c[I>>2]=c[K>>2];I=I+4|0;K=K+4|0;}while((I|0)<(L|0));cd(A,z,E);I=a+64|0;K=B;L=I+64|0;do{c[I>>2]=c[K>>2];I=I+4|0;K=K+4|0;}while((I|0)<(L|0));I=a+128|0;K=A;L=I+64|0;do{c[I>>2]=c[K>>2];I=I+4|0;K=K+4|0;}while((I|0)<(L|0))}l=J;return}function yc(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;y=l;l=l+1120|0;o=y+1056|0;q=y+992|0;r=y+960|0;s=y+896|0;t=y+832|0;u=y+768|0;v=y+704|0;w=y+640|0;h=y+576|0;i=y+512|0;j=y+448|0;k=y+384|0;e=y+320|0;m=y+256|0;n=y+192|0;f=y+128|0;d=y+64|0;g=y;dd(g,b);p=b+64|0;dd(d,p);dd(f,d);x=t;z=b;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));x=s;z=d;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));c[q>>2]=c[b>>2];c[q+4>>2]=c[b+4>>2];c[q+8>>2]=c[b+8>>2];c[q+12>>2]=c[b+12>>2];c[q+16>>2]=c[b+16>>2];c[q+20>>2]=c[b+20>>2];c[q+24>>2]=c[b+24>>2];c[q+28>>2]=c[b+28>>2];c[o>>2]=c[d>>2];c[o+4>>2]=c[d+4>>2];c[o+8>>2]=c[d+8>>2];c[o+12>>2]=c[d+12>>2];c[o+16>>2]=c[d+16>>2];c[o+20>>2]=c[d+20>>2];c[o+24>>2]=c[d+24>>2];c[o+28>>2]=c[d+28>>2];Kc(q,o,136);c[u>>2]=c[q>>2];c[u+4>>2]=c[q+4>>2];c[u+8>>2]=c[q+8>>2];c[u+12>>2]=c[q+12>>2];c[u+16>>2]=c[q+16>>2];c[u+20>>2]=c[q+20>>2];c[u+24>>2]=c[q+24>>2];c[u+28>>2]=c[q+28>>2];x=t+32|0;c[q>>2]=c[x>>2];c[q+4>>2]=c[x+4>>2];c[q+8>>2]=c[x+8>>2];c[q+12>>2]=c[x+12>>2];c[q+16>>2]=c[x+16>>2];c[q+20>>2]=c[x+20>>2];c[q+24>>2]=c[x+24>>2];c[q+28>>2]=c[x+28>>2];x=s+32|0;c[o>>2]=c[x>>2];c[o+4>>2]=c[x+4>>2];c[o+8>>2]=c[x+8>>2];c[o+12>>2]=c[x+12>>2];c[o+16>>2]=c[x+16>>2];c[o+20>>2]=c[x+20>>2];c[o+24>>2]=c[x+24>>2];c[o+28>>2]=c[x+28>>2];Kc(q,o,136);c[r>>2]=c[q>>2];c[r+4>>2]=c[q+4>>2];c[r+8>>2]=c[q+8>>2];c[r+12>>2]=c[q+12>>2];c[r+16>>2]=c[q+16>>2];c[r+20>>2]=c[q+20>>2];c[r+24>>2]=c[q+24>>2];c[r+28>>2]=c[q+28>>2];x=u+32|0;c[x>>2]=c[r>>2];c[x+4>>2]=c[r+4>>2];c[x+8>>2]=c[r+8>>2];c[x+12>>2]=c[r+12>>2];c[x+16>>2]=c[r+16>>2];c[x+20>>2]=c[r+20>>2];c[x+24>>2]=c[r+24>>2];c[x+28>>2]=c[r+28>>2];dd(v,u);x=s;z=g;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));c[q>>2]=c[v>>2];c[q+4>>2]=c[v+4>>2];c[q+8>>2]=c[v+8>>2];c[q+12>>2]=c[v+12>>2];c[q+16>>2]=c[v+16>>2];c[q+20>>2]=c[v+20>>2];c[q+24>>2]=c[v+24>>2];c[q+28>>2]=c[v+28>>2];c[o>>2]=c[g>>2];c[o+4>>2]=c[g+4>>2];c[o+8>>2]=c[g+8>>2];c[o+12>>2]=c[g+12>>2];c[o+16>>2]=c[g+16>>2];c[o+20>>2]=c[g+20>>2];c[o+24>>2]=c[g+24>>2];c[o+28>>2]=c[g+28>>2];Lc(q,o,136);c[w>>2]=c[q>>2];c[w+4>>2]=c[q+4>>2];c[w+8>>2]=c[q+8>>2];c[w+12>>2]=c[q+12>>2];c[w+16>>2]=c[q+16>>2];c[w+20>>2]=c[q+20>>2];c[w+24>>2]=c[q+24>>2];c[w+28>>2]=c[q+28>>2];d=v+32|0;c[q>>2]=c[d>>2];c[q+4>>2]=c[d+4>>2];c[q+8>>2]=c[d+8>>2];c[q+12>>2]=c[d+12>>2];c[q+16>>2]=c[d+16>>2];c[q+20>>2]=c[d+20>>2];c[q+24>>2]=c[d+24>>2];c[q+28>>2]=c[d+28>>2];d=s+32|0;c[o>>2]=c[d>>2];c[o+4>>2]=c[d+4>>2];c[o+8>>2]=c[d+8>>2];c[o+12>>2]=c[d+12>>2];c[o+16>>2]=c[d+16>>2];c[o+20>>2]=c[d+20>>2];c[o+24>>2]=c[d+24>>2];c[o+28>>2]=c[d+28>>2];Lc(q,o,136);c[r>>2]=c[q>>2];c[r+4>>2]=c[q+4>>2];c[r+8>>2]=c[q+8>>2];c[r+12>>2]=c[q+12>>2];c[r+16>>2]=c[q+16>>2];c[r+20>>2]=c[q+20>>2];c[r+24>>2]=c[q+24>>2];c[r+28>>2]=c[q+28>>2];d=w+32|0;c[d>>2]=c[r>>2];c[d+4>>2]=c[r+4>>2];c[d+8>>2]=c[r+8>>2];c[d+12>>2]=c[r+12>>2];c[d+16>>2]=c[r+16>>2];c[d+20>>2]=c[r+20>>2];c[d+24>>2]=c[r+24>>2];c[d+28>>2]=c[r+28>>2];x=s;z=f;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));c[q>>2]=c[w>>2];c[q+4>>2]=c[w+4>>2];c[q+8>>2]=c[w+8>>2];c[q+12>>2]=c[w+12>>2];c[q+16>>2]=c[w+16>>2];c[q+20>>2]=c[w+20>>2];c[q+24>>2]=c[w+24>>2];c[q+28>>2]=c[w+28>>2];c[o>>2]=c[f>>2];c[o+4>>2]=c[f+4>>2];c[o+8>>2]=c[f+8>>2];c[o+12>>2]=c[f+12>>2];c[o+16>>2]=c[f+16>>2];c[o+20>>2]=c[f+20>>2];c[o+24>>2]=c[f+24>>2];c[o+28>>2]=c[f+28>>2];Lc(q,o,136);c[n>>2]=c[q>>2];c[n+4>>2]=c[q+4>>2];c[n+8>>2]=c[q+8>>2];c[n+12>>2]=c[q+12>>2];c[n+16>>2]=c[q+16>>2];c[n+20>>2]=c[q+20>>2];c[n+24>>2]=c[q+24>>2];c[n+28>>2]=c[q+28>>2];c[q>>2]=c[d>>2];c[q+4>>2]=c[d+4>>2];c[q+8>>2]=c[d+8>>2];c[q+12>>2]=c[d+12>>2];c[q+16>>2]=c[d+16>>2];c[q+20>>2]=c[d+20>>2];c[q+24>>2]=c[d+24>>2];c[q+28>>2]=c[d+28>>2];d=s+32|0;c[o>>2]=c[d>>2];c[o+4>>2]=c[d+4>>2];c[o+8>>2]=c[d+8>>2];c[o+12>>2]=c[d+12>>2];c[o+16>>2]=c[d+16>>2];c[o+20>>2]=c[d+20>>2];c[o+24>>2]=c[d+24>>2];c[o+28>>2]=c[d+28>>2];Lc(q,o,136);c[r>>2]=c[q>>2];c[r+4>>2]=c[q+4>>2];c[r+8>>2]=c[q+8>>2];c[r+12>>2]=c[q+12>>2];c[r+16>>2]=c[q+16>>2];c[r+20>>2]=c[q+20>>2];c[r+24>>2]=c[q+24>>2];c[r+28>>2]=c[q+28>>2];d=n+32|0;c[d>>2]=c[r>>2];c[d+4>>2]=c[r+4>>2];c[d+8>>2]=c[r+8>>2];c[d+12>>2]=c[r+12>>2];c[d+16>>2]=c[r+16>>2];c[d+20>>2]=c[r+20>>2];c[d+24>>2]=c[r+24>>2];c[d+28>>2]=c[r+28>>2];x=t;z=n;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));x=s;z=n;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));c[q>>2]=c[t>>2];c[q+4>>2]=c[t+4>>2];c[q+8>>2]=c[t+8>>2];c[q+12>>2]=c[t+12>>2];c[q+16>>2]=c[t+16>>2];c[q+20>>2]=c[t+20>>2];c[q+24>>2]=c[t+24>>2];c[q+28>>2]=c[t+28>>2];c[o>>2]=c[n>>2];c[o+4>>2]=c[n+4>>2];c[o+8>>2]=c[n+8>>2];c[o+12>>2]=c[n+12>>2];c[o+16>>2]=c[n+16>>2];c[o+20>>2]=c[n+20>>2];c[o+24>>2]=c[n+24>>2];c[o+28>>2]=c[n+28>>2];Kc(q,o,136);c[n>>2]=c[q>>2];c[n+4>>2]=c[q+4>>2];c[n+8>>2]=c[q+8>>2];c[n+12>>2]=c[q+12>>2];c[n+16>>2]=c[q+16>>2];c[n+20>>2]=c[q+20>>2];c[n+24>>2]=c[q+24>>2];c[n+28>>2]=c[q+28>>2];x=t+32|0;c[q>>2]=c[x>>2];c[q+4>>2]=c[x+4>>2];c[q+8>>2]=c[x+8>>2];c[q+12>>2]=c[x+12>>2];c[q+16>>2]=c[x+16>>2];c[q+20>>2]=c[x+20>>2];c[q+24>>2]=c[x+24>>2];c[q+28>>2]=c[x+28>>2];x=s+32|0;c[o>>2]=c[x>>2];c[o+4>>2]=c[x+4>>2];c[o+8>>2]=c[x+8>>2];c[o+12>>2]=c[x+12>>2];c[o+16>>2]=c[x+16>>2];c[o+20>>2]=c[x+20>>2];c[o+24>>2]=c[x+24>>2];c[o+28>>2]=c[x+28>>2];Kc(q,o,136);c[r>>2]=c[q>>2];c[r+4>>2]=c[q+4>>2];c[r+8>>2]=c[q+8>>2];c[r+12>>2]=c[q+12>>2];c[r+16>>2]=c[q+16>>2];c[r+20>>2]=c[q+20>>2];c[r+24>>2]=c[q+24>>2];c[r+28>>2]=c[q+28>>2];c[d>>2]=c[r>>2];c[d+4>>2]=c[r+4>>2];c[d+8>>2]=c[r+8>>2];c[d+12>>2]=c[r+12>>2];c[d+16>>2]=c[r+16>>2];c[d+20>>2]=c[r+20>>2];c[d+24>>2]=c[r+24>>2];c[d+28>>2]=c[r+28>>2];x=t;z=g;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));x=s;z=g;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));c[q>>2]=c[t>>2];c[q+4>>2]=c[t+4>>2];c[q+8>>2]=c[t+8>>2];c[q+12>>2]=c[t+12>>2];c[q+16>>2]=c[t+16>>2];c[q+20>>2]=c[t+20>>2];c[q+24>>2]=c[t+24>>2];c[q+28>>2]=c[t+28>>2];c[o>>2]=c[g>>2];c[o+4>>2]=c[g+4>>2];c[o+8>>2]=c[g+8>>2];c[o+12>>2]=c[g+12>>2];c[o+16>>2]=c[g+16>>2];c[o+20>>2]=c[g+20>>2];c[o+24>>2]=c[g+24>>2];c[o+28>>2]=c[g+28>>2];Kc(q,o,136);c[u>>2]=c[q>>2];c[u+4>>2]=c[q+4>>2];c[u+8>>2]=c[q+8>>2];c[u+12>>2]=c[q+12>>2];c[u+16>>2]=c[q+16>>2];c[u+20>>2]=c[q+20>>2];c[u+24>>2]=c[q+24>>2];c[u+28>>2]=c[q+28>>2];d=t+32|0;c[q>>2]=c[d>>2];c[q+4>>2]=c[d+4>>2];c[q+8>>2]=c[d+8>>2];c[q+12>>2]=c[d+12>>2];c[q+16>>2]=c[d+16>>2];c[q+20>>2]=c[d+20>>2];c[q+24>>2]=c[d+24>>2];c[q+28>>2]=c[d+28>>2];d=s+32|0;c[o>>2]=c[d>>2];c[o+4>>2]=c[d+4>>2];c[o+8>>2]=c[d+8>>2];c[o+12>>2]=c[d+12>>2];c[o+16>>2]=c[d+16>>2];c[o+20>>2]=c[d+20>>2];c[o+24>>2]=c[d+24>>2];c[o+28>>2]=c[d+28>>2];Kc(q,o,136);c[r>>2]=c[q>>2];c[r+4>>2]=c[q+4>>2];c[r+8>>2]=c[q+8>>2];c[r+12>>2]=c[q+12>>2];c[r+16>>2]=c[q+16>>2];c[r+20>>2]=c[q+20>>2];c[r+24>>2]=c[q+24>>2];c[r+28>>2]=c[q+28>>2];d=u+32|0;c[d>>2]=c[r>>2];c[d+4>>2]=c[r+4>>2];c[d+8>>2]=c[r+8>>2];c[d+12>>2]=c[r+12>>2];c[d+16>>2]=c[r+16>>2];c[d+20>>2]=c[r+20>>2];c[d+24>>2]=c[r+24>>2];c[d+28>>2]=c[r+28>>2];x=s;z=g;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));c[q>>2]=c[u>>2];c[q+4>>2]=c[u+4>>2];c[q+8>>2]=c[u+8>>2];c[q+12>>2]=c[u+12>>2];c[q+16>>2]=c[u+16>>2];c[q+20>>2]=c[u+20>>2];c[q+24>>2]=c[u+24>>2];c[q+28>>2]=c[u+28>>2];c[o>>2]=c[g>>2];c[o+4>>2]=c[g+4>>2];c[o+8>>2]=c[g+8>>2];c[o+12>>2]=c[g+12>>2];c[o+16>>2]=c[g+16>>2];c[o+20>>2]=c[g+20>>2];c[o+24>>2]=c[g+24>>2];c[o+28>>2]=c[g+28>>2];Kc(q,o,136);c[m>>2]=c[q>>2];c[m+4>>2]=c[q+4>>2];c[m+8>>2]=c[q+8>>2];c[m+12>>2]=c[q+12>>2];c[m+16>>2]=c[q+16>>2];c[m+20>>2]=c[q+20>>2];c[m+24>>2]=c[q+24>>2];c[m+28>>2]=c[q+28>>2];c[q>>2]=c[d>>2];c[q+4>>2]=c[d+4>>2];c[q+8>>2]=c[d+8>>2];c[q+12>>2]=c[d+12>>2];c[q+16>>2]=c[d+16>>2];c[q+20>>2]=c[d+20>>2];c[q+24>>2]=c[d+24>>2];c[q+28>>2]=c[d+28>>2];x=s+32|0;c[o>>2]=c[x>>2];c[o+4>>2]=c[x+4>>2];c[o+8>>2]=c[x+8>>2];c[o+12>>2]=c[x+12>>2];c[o+16>>2]=c[x+16>>2];c[o+20>>2]=c[x+20>>2];c[o+24>>2]=c[x+24>>2];c[o+28>>2]=c[x+28>>2];Kc(q,o,136);c[r>>2]=c[q>>2];c[r+4>>2]=c[q+4>>2];c[r+8>>2]=c[q+8>>2];c[r+12>>2]=c[q+12>>2];c[r+16>>2]=c[q+16>>2];c[r+20>>2]=c[q+20>>2];c[r+24>>2]=c[q+24>>2];c[r+28>>2]=c[q+28>>2];x=m+32|0;c[x>>2]=c[r>>2];c[x+4>>2]=c[r+4>>2];c[x+8>>2]=c[r+8>>2];c[x+12>>2]=c[r+12>>2];c[x+16>>2]=c[r+16>>2];c[x+20>>2]=c[r+20>>2];c[x+24>>2]=c[r+24>>2];c[x+28>>2]=c[r+28>>2];dd(e,m);x=v;z=e;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));x=t;z=n;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));x=s;z=n;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));c[q>>2]=c[t>>2];c[q+4>>2]=c[t+4>>2];c[q+8>>2]=c[t+8>>2];c[q+12>>2]=c[t+12>>2];c[q+16>>2]=c[t+16>>2];c[q+20>>2]=c[t+20>>2];c[q+24>>2]=c[t+24>>2];c[q+28>>2]=c[t+28>>2];c[o>>2]=c[n>>2];c[o+4>>2]=c[n+4>>2];c[o+8>>2]=c[n+8>>2];c[o+12>>2]=c[n+12>>2];c[o+16>>2]=c[n+16>>2];c[o+20>>2]=c[n+20>>2];c[o+24>>2]=c[n+24>>2];c[o+28>>2]=c[n+28>>2];Kc(q,o,136);c[u>>2]=c[q>>2];c[u+4>>2]=c[q+4>>2];c[u+8>>2]=c[q+8>>2];c[u+12>>2]=c[q+12>>2];c[u+16>>2]=c[q+16>>2];c[u+20>>2]=c[q+20>>2];c[u+24>>2]=c[q+24>>2];c[u+28>>2]=c[q+28>>2];x=t+32|0;c[q>>2]=c[x>>2];c[q+4>>2]=c[x+4>>2];c[q+8>>2]=c[x+8>>2];c[q+12>>2]=c[x+12>>2];c[q+16>>2]=c[x+16>>2];c[q+20>>2]=c[x+20>>2];c[q+24>>2]=c[x+24>>2];c[q+28>>2]=c[x+28>>2];x=s+32|0;c[o>>2]=c[x>>2];c[o+4>>2]=c[x+4>>2];c[o+8>>2]=c[x+8>>2];c[o+12>>2]=c[x+12>>2];c[o+16>>2]=c[x+16>>2];c[o+20>>2]=c[x+20>>2];c[o+24>>2]=c[x+24>>2];c[o+28>>2]=c[x+28>>2];Kc(q,o,136);c[r>>2]=c[q>>2];c[r+4>>2]=c[q+4>>2];c[r+8>>2]=c[q+8>>2];c[r+12>>2]=c[q+12>>2];c[r+16>>2]=c[q+16>>2];c[r+20>>2]=c[q+20>>2];c[r+24>>2]=c[q+24>>2];c[r+28>>2]=c[q+28>>2];x=u+32|0;c[x>>2]=c[r>>2];c[x+4>>2]=c[r+4>>2];c[x+8>>2]=c[r+8>>2];c[x+12>>2]=c[r+12>>2];c[x+16>>2]=c[r+16>>2];c[x+20>>2]=c[r+20>>2];c[x+24>>2]=c[r+24>>2];c[x+28>>2]=c[r+28>>2];c[q>>2]=c[e>>2];c[q+4>>2]=c[e+4>>2];c[q+8>>2]=c[e+8>>2];c[q+12>>2]=c[e+12>>2];c[q+16>>2]=c[e+16>>2];c[q+20>>2]=c[e+20>>2];c[q+24>>2]=c[e+24>>2];c[q+28>>2]=c[e+28>>2];c[o>>2]=c[u>>2];c[o+4>>2]=c[u+4>>2];c[o+8>>2]=c[u+8>>2];c[o+12>>2]=c[u+12>>2];c[o+16>>2]=c[u+16>>2];c[o+20>>2]=c[u+20>>2];c[o+24>>2]=c[u+24>>2];c[o+28>>2]=c[u+28>>2];Lc(q,o,136);c[k>>2]=c[q>>2];c[k+4>>2]=c[q+4>>2];c[k+8>>2]=c[q+8>>2];c[k+12>>2]=c[q+12>>2];c[k+16>>2]=c[q+16>>2];c[k+20>>2]=c[q+20>>2];c[k+24>>2]=c[q+24>>2];c[k+28>>2]=c[q+28>>2];z=v+32|0;c[q>>2]=c[z>>2];c[q+4>>2]=c[z+4>>2];c[q+8>>2]=c[z+8>>2];c[q+12>>2]=c[z+12>>2];c[q+16>>2]=c[z+16>>2];c[q+20>>2]=c[z+20>>2];c[q+24>>2]=c[z+24>>2];c[q+28>>2]=c[z+28>>2];c[o>>2]=c[x>>2];c[o+4>>2]=c[x+4>>2];c[o+8>>2]=c[x+8>>2];c[o+12>>2]=c[x+12>>2];c[o+16>>2]=c[x+16>>2];c[o+20>>2]=c[x+20>>2];c[o+24>>2]=c[x+24>>2];c[o+28>>2]=c[x+28>>2];Lc(q,o,136);c[r>>2]=c[q>>2];c[r+4>>2]=c[q+4>>2];c[r+8>>2]=c[q+8>>2];c[r+12>>2]=c[q+12>>2];c[r+16>>2]=c[q+16>>2];c[r+20>>2]=c[q+20>>2];c[r+24>>2]=c[q+24>>2];c[r+28>>2]=c[q+28>>2];x=k+32|0;c[x>>2]=c[r>>2];c[x+4>>2]=c[r+4>>2];c[x+8>>2]=c[r+8>>2];c[x+12>>2]=c[r+12>>2];c[x+16>>2]=c[r+16>>2];c[x+20>>2]=c[r+20>>2];c[x+24>>2]=c[r+24>>2];c[x+28>>2]=c[r+28>>2];x=t;z=f;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));x=s;z=f;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));c[q>>2]=c[t>>2];c[q+4>>2]=c[t+4>>2];c[q+8>>2]=c[t+8>>2];c[q+12>>2]=c[t+12>>2];c[q+16>>2]=c[t+16>>2];c[q+20>>2]=c[t+20>>2];c[q+24>>2]=c[t+24>>2];c[q+28>>2]=c[t+28>>2];c[o>>2]=c[f>>2];c[o+4>>2]=c[f+4>>2];c[o+8>>2]=c[f+8>>2];c[o+12>>2]=c[f+12>>2];c[o+16>>2]=c[f+16>>2];c[o+20>>2]=c[f+20>>2];c[o+24>>2]=c[f+24>>2];c[o+28>>2]=c[f+28>>2];Kc(q,o,136);c[j>>2]=c[q>>2];c[j+4>>2]=c[q+4>>2];c[j+8>>2]=c[q+8>>2];c[j+12>>2]=c[q+12>>2];c[j+16>>2]=c[q+16>>2];c[j+20>>2]=c[q+20>>2];c[j+24>>2]=c[q+24>>2];c[j+28>>2]=c[q+28>>2];d=t+32|0;c[q>>2]=c[d>>2];c[q+4>>2]=c[d+4>>2];c[q+8>>2]=c[d+8>>2];c[q+12>>2]=c[d+12>>2];c[q+16>>2]=c[d+16>>2];c[q+20>>2]=c[d+20>>2];c[q+24>>2]=c[d+24>>2];c[q+28>>2]=c[d+28>>2];d=s+32|0;c[o>>2]=c[d>>2];c[o+4>>2]=c[d+4>>2];c[o+8>>2]=c[d+8>>2];c[o+12>>2]=c[d+12>>2];c[o+16>>2]=c[d+16>>2];c[o+20>>2]=c[d+20>>2];c[o+24>>2]=c[d+24>>2];c[o+28>>2]=c[d+28>>2];Kc(q,o,136);c[r>>2]=c[q>>2];c[r+4>>2]=c[q+4>>2];c[r+8>>2]=c[q+8>>2];c[r+12>>2]=c[q+12>>2];c[r+16>>2]=c[q+16>>2];c[r+20>>2]=c[q+20>>2];c[r+24>>2]=c[q+24>>2];c[r+28>>2]=c[q+28>>2];d=j+32|0;c[d>>2]=c[r>>2];c[d+4>>2]=c[r+4>>2];c[d+8>>2]=c[r+8>>2];c[d+12>>2]=c[r+12>>2];c[d+16>>2]=c[r+16>>2];c[d+20>>2]=c[r+20>>2];c[d+24>>2]=c[r+24>>2];c[d+28>>2]=c[r+28>>2];x=t;z=j;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));x=s;z=j;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));c[q>>2]=c[t>>2];c[q+4>>2]=c[t+4>>2];c[q+8>>2]=c[t+8>>2];c[q+12>>2]=c[t+12>>2];c[q+16>>2]=c[t+16>>2];c[q+20>>2]=c[t+20>>2];c[q+24>>2]=c[t+24>>2];c[q+28>>2]=c[t+28>>2];c[o>>2]=c[j>>2];c[o+4>>2]=c[j+4>>2];c[o+8>>2]=c[j+8>>2];c[o+12>>2]=c[j+12>>2];c[o+16>>2]=c[j+16>>2];c[o+20>>2]=c[j+20>>2];c[o+24>>2]=c[j+24>>2];c[o+28>>2]=c[j+28>>2];Kc(q,o,136);c[j>>2]=c[q>>2];c[j+4>>2]=c[q+4>>2];c[j+8>>2]=c[q+8>>2];c[j+12>>2]=c[q+12>>2];c[j+16>>2]=c[q+16>>2];c[j+20>>2]=c[q+20>>2];c[j+24>>2]=c[q+24>>2];c[j+28>>2]=c[q+28>>2];x=t+32|0;c[q>>2]=c[x>>2];c[q+4>>2]=c[x+4>>2];c[q+8>>2]=c[x+8>>2];c[q+12>>2]=c[x+12>>2];c[q+16>>2]=c[x+16>>2];c[q+20>>2]=c[x+20>>2];c[q+24>>2]=c[x+24>>2];c[q+28>>2]=c[x+28>>2];x=s+32|0;c[o>>2]=c[x>>2];c[o+4>>2]=c[x+4>>2];c[o+8>>2]=c[x+8>>2];c[o+12>>2]=c[x+12>>2];c[o+16>>2]=c[x+16>>2];c[o+20>>2]=c[x+20>>2];c[o+24>>2]=c[x+24>>2];c[o+28>>2]=c[x+28>>2];Kc(q,o,136);c[r>>2]=c[q>>2];c[r+4>>2]=c[q+4>>2];c[r+8>>2]=c[q+8>>2];c[r+12>>2]=c[q+12>>2];c[r+16>>2]=c[q+16>>2];c[r+20>>2]=c[q+20>>2];c[r+24>>2]=c[q+24>>2];c[r+28>>2]=c[q+28>>2];c[d>>2]=c[r>>2];c[d+4>>2]=c[r+4>>2];c[d+8>>2]=c[r+8>>2];c[d+12>>2]=c[r+12>>2];c[d+16>>2]=c[r+16>>2];c[d+20>>2]=c[r+20>>2];c[d+24>>2]=c[r+24>>2];c[d+28>>2]=c[r+28>>2];x=t;z=j;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));x=s;z=j;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));c[q>>2]=c[t>>2];c[q+4>>2]=c[t+4>>2];c[q+8>>2]=c[t+8>>2];c[q+12>>2]=c[t+12>>2];c[q+16>>2]=c[t+16>>2];c[q+20>>2]=c[t+20>>2];c[q+24>>2]=c[t+24>>2];c[q+28>>2]=c[t+28>>2];c[o>>2]=c[j>>2];c[o+4>>2]=c[j+4>>2];c[o+8>>2]=c[j+8>>2];c[o+12>>2]=c[j+12>>2];c[o+16>>2]=c[j+16>>2];c[o+20>>2]=c[j+20>>2];c[o+24>>2]=c[j+24>>2];c[o+28>>2]=c[j+28>>2];Kc(q,o,136);c[j>>2]=c[q>>2];c[j+4>>2]=c[q+4>>2];c[j+8>>2]=c[q+8>>2];c[j+12>>2]=c[q+12>>2];c[j+16>>2]=c[q+16>>2];c[j+20>>2]=c[q+20>>2];c[j+24>>2]=c[q+24>>2];c[j+28>>2]=c[q+28>>2];x=t+32|0;c[q>>2]=c[x>>2];c[q+4>>2]=c[x+4>>2];c[q+8>>2]=c[x+8>>2];c[q+12>>2]=c[x+12>>2];c[q+16>>2]=c[x+16>>2];c[q+20>>2]=c[x+20>>2];c[q+24>>2]=c[x+24>>2];c[q+28>>2]=c[x+28>>2];x=s+32|0;c[o>>2]=c[x>>2];c[o+4>>2]=c[x+4>>2];c[o+8>>2]=c[x+8>>2];c[o+12>>2]=c[x+12>>2];c[o+16>>2]=c[x+16>>2];c[o+20>>2]=c[x+20>>2];c[o+24>>2]=c[x+24>>2];c[o+28>>2]=c[x+28>>2];Kc(q,o,136);c[r>>2]=c[q>>2];c[r+4>>2]=c[q+4>>2];c[r+8>>2]=c[q+8>>2];c[r+12>>2]=c[q+12>>2];c[r+16>>2]=c[q+16>>2];c[r+20>>2]=c[q+20>>2];c[r+24>>2]=c[q+24>>2];c[r+28>>2]=c[q+28>>2];c[d>>2]=c[r>>2];c[d+4>>2]=c[r+4>>2];c[d+8>>2]=c[r+8>>2];c[d+12>>2]=c[r+12>>2];c[d+16>>2]=c[r+16>>2];c[d+20>>2]=c[r+20>>2];c[d+24>>2]=c[r+24>>2];c[d+28>>2]=c[r+28>>2];x=q;z=p;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));x=o;z=b+128|0;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));cd(i,q,o);x=a;z=k;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));x=v;z=m;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));x=t;z=n;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));x=s;z=k;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));c[q>>2]=c[n>>2];c[q+4>>2]=c[n+4>>2];c[q+8>>2]=c[n+8>>2];c[q+12>>2]=c[n+12>>2];c[q+16>>2]=c[n+16>>2];c[q+20>>2]=c[n+20>>2];c[q+24>>2]=c[n+24>>2];c[q+28>>2]=c[n+28>>2];c[o>>2]=c[k>>2];c[o+4>>2]=c[k+4>>2];c[o+8>>2]=c[k+8>>2];c[o+12>>2]=c[k+12>>2];c[o+16>>2]=c[k+16>>2];c[o+20>>2]=c[k+20>>2];c[o+24>>2]=c[k+24>>2];c[o+28>>2]=c[k+28>>2];Lc(q,o,136);c[u>>2]=c[q>>2];c[u+4>>2]=c[q+4>>2];c[u+8>>2]=c[q+8>>2];c[u+12>>2]=c[q+12>>2];c[u+16>>2]=c[q+16>>2];c[u+20>>2]=c[q+20>>2];c[u+24>>2]=c[q+24>>2];c[u+28>>2]=c[q+28>>2];x=t+32|0;c[q>>2]=c[x>>2];c[q+4>>2]=c[x+4>>2];c[q+8>>2]=c[x+8>>2];c[q+12>>2]=c[x+12>>2];c[q+16>>2]=c[x+16>>2];c[q+20>>2]=c[x+20>>2];c[q+24>>2]=c[x+24>>2];c[q+28>>2]=c[x+28>>2];x=s+32|0;c[o>>2]=c[x>>2];c[o+4>>2]=c[x+4>>2];c[o+8>>2]=c[x+8>>2];c[o+12>>2]=c[x+12>>2];c[o+16>>2]=c[x+16>>2];c[o+20>>2]=c[x+20>>2];c[o+24>>2]=c[x+24>>2];c[o+28>>2]=c[x+28>>2];Lc(q,o,136);c[r>>2]=c[q>>2];c[r+4>>2]=c[q+4>>2];c[r+8>>2]=c[q+8>>2];c[r+12>>2]=c[q+12>>2];c[r+16>>2]=c[q+16>>2];c[r+20>>2]=c[q+20>>2];c[r+24>>2]=c[q+24>>2];c[r+28>>2]=c[q+28>>2];x=u+32|0;c[x>>2]=c[r>>2];c[x+4>>2]=c[r+4>>2];c[x+8>>2]=c[r+8>>2];c[x+12>>2]=c[r+12>>2];c[x+16>>2]=c[r+16>>2];c[x+20>>2]=c[r+20>>2];c[x+24>>2]=c[r+24>>2];c[x+28>>2]=c[r+28>>2];cd(w,v,u);x=s;z=j;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));c[q>>2]=c[w>>2];c[q+4>>2]=c[w+4>>2];c[q+8>>2]=c[w+8>>2];c[q+12>>2]=c[w+12>>2];c[q+16>>2]=c[w+16>>2];c[q+20>>2]=c[w+20>>2];c[q+24>>2]=c[w+24>>2];c[q+28>>2]=c[w+28>>2];c[o>>2]=c[j>>2];c[o+4>>2]=c[j+4>>2];c[o+8>>2]=c[j+8>>2];c[o+12>>2]=c[j+12>>2];c[o+16>>2]=c[j+16>>2];c[o+20>>2]=c[j+20>>2];c[o+24>>2]=c[j+24>>2];c[o+28>>2]=c[j+28>>2];Lc(q,o,136);c[h>>2]=c[q>>2];c[h+4>>2]=c[q+4>>2];c[h+8>>2]=c[q+8>>2];c[h+12>>2]=c[q+12>>2];c[h+16>>2]=c[q+16>>2];c[h+20>>2]=c[q+20>>2];c[h+24>>2]=c[q+24>>2];c[h+28>>2]=c[q+28>>2];x=w+32|0;c[q>>2]=c[x>>2];c[q+4>>2]=c[x+4>>2];c[q+8>>2]=c[x+8>>2];c[q+12>>2]=c[x+12>>2];c[q+16>>2]=c[x+16>>2];c[q+20>>2]=c[x+20>>2];c[q+24>>2]=c[x+24>>2];c[q+28>>2]=c[x+28>>2];x=s+32|0;c[o>>2]=c[x>>2];c[o+4>>2]=c[x+4>>2];c[o+8>>2]=c[x+8>>2];c[o+12>>2]=c[x+12>>2];c[o+16>>2]=c[x+16>>2];c[o+20>>2]=c[x+20>>2];c[o+24>>2]=c[x+24>>2];c[o+28>>2]=c[x+28>>2];Lc(q,o,136);c[r>>2]=c[q>>2];c[r+4>>2]=c[q+4>>2];c[r+8>>2]=c[q+8>>2];c[r+12>>2]=c[q+12>>2];c[r+16>>2]=c[q+16>>2];c[r+20>>2]=c[q+20>>2];c[r+24>>2]=c[q+24>>2];c[r+28>>2]=c[q+28>>2];x=h+32|0;c[x>>2]=c[r>>2];c[x+4>>2]=c[r+4>>2];c[x+8>>2]=c[r+8>>2];c[x+12>>2]=c[r+12>>2];c[x+16>>2]=c[r+16>>2];c[x+20>>2]=c[r+20>>2];c[x+24>>2]=c[r+24>>2];c[x+28>>2]=c[r+28>>2];x=t;z=i;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));x=s;z=i;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));c[q>>2]=c[t>>2];c[q+4>>2]=c[t+4>>2];c[q+8>>2]=c[t+8>>2];c[q+12>>2]=c[t+12>>2];c[q+16>>2]=c[t+16>>2];c[q+20>>2]=c[t+20>>2];c[q+24>>2]=c[t+24>>2];c[q+28>>2]=c[t+28>>2];c[o>>2]=c[i>>2];c[o+4>>2]=c[i+4>>2];c[o+8>>2]=c[i+8>>2];c[o+12>>2]=c[i+12>>2];c[o+16>>2]=c[i+16>>2];c[o+20>>2]=c[i+20>>2];c[o+24>>2]=c[i+24>>2];c[o+28>>2]=c[i+28>>2];Kc(q,o,136);c[u>>2]=c[q>>2];c[u+4>>2]=c[q+4>>2];c[u+8>>2]=c[q+8>>2];c[u+12>>2]=c[q+12>>2];c[u+16>>2]=c[q+16>>2];c[u+20>>2]=c[q+20>>2];c[u+24>>2]=c[q+24>>2];c[u+28>>2]=c[q+28>>2];x=t+32|0;c[q>>2]=c[x>>2];c[q+4>>2]=c[x+4>>2];c[q+8>>2]=c[x+8>>2];c[q+12>>2]=c[x+12>>2];c[q+16>>2]=c[x+16>>2];c[q+20>>2]=c[x+20>>2];c[q+24>>2]=c[x+24>>2];c[q+28>>2]=c[x+28>>2];x=s+32|0;c[o>>2]=c[x>>2];c[o+4>>2]=c[x+4>>2];c[o+8>>2]=c[x+8>>2];c[o+12>>2]=c[x+12>>2];c[o+16>>2]=c[x+16>>2];c[o+20>>2]=c[x+20>>2];c[o+24>>2]=c[x+24>>2];c[o+28>>2]=c[x+28>>2];Kc(q,o,136);c[r>>2]=c[q>>2];c[r+4>>2]=c[q+4>>2];c[r+8>>2]=c[q+8>>2];c[r+12>>2]=c[q+12>>2];c[r+16>>2]=c[q+16>>2];c[r+20>>2]=c[q+20>>2];c[r+24>>2]=c[q+24>>2];c[r+28>>2]=c[q+28>>2];x=u+32|0;c[x>>2]=c[r>>2];c[x+4>>2]=c[r+4>>2];c[x+8>>2]=c[r+8>>2];c[x+12>>2]=c[r+12>>2];c[x+16>>2]=c[r+16>>2];c[x+20>>2]=c[r+20>>2];c[x+24>>2]=c[r+24>>2];c[x+28>>2]=c[r+28>>2];x=a+64|0;z=h;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));x=a+128|0;z=u;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));l=y;return}function zc(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0;p=l;l=l+656|0;g=p+520|0;h=p+448|0;i=p+384|0;j=p+320|0;k=p+256|0;m=p+128|0;n=p+64|0;o=p;f=b+128|0;d=f;if((((((((c[d>>2]|0)==0&(c[d+4>>2]|0)==0?(d=b+136|0,(c[d>>2]|0)==0&(c[d+4>>2]|0)==0):0)?(d=b+144|0,(c[d>>2]|0)==0&(c[d+4>>2]|0)==0):0)?(d=b+152|0,(c[d>>2]|0)==0&(c[d+4>>2]|0)==0):0)?(d=b+160|0,(c[d>>2]|0)==0&(c[d+4>>2]|0)==0):0)?(d=b+168|0,(c[d>>2]|0)==0&(c[d+4>>2]|0)==0):0)?(d=b+176|0,(c[d>>2]|0)==0&(c[d+4>>2]|0)==0):0)?(d=b+184|0,(c[d>>2]|0)==0&(c[d+4>>2]|0)==0):0){o=a;c[o>>2]=0;c[o+4>>2]=0;l=p;return}d=g;c[d>>2]=-980480611;c[d+4>>2]=-748862579;d=g+8|0;c[d>>2]=-171504835;c[d+4>>2]=175696680;d=g+16|0;c[d>>2]=2021213740;c[d+4>>2]=1718526831;d=g+24|0;c[d>>2]=-1710760145;c[d+4>>2]=235567041;d=g+32|0;c[d>>2]=0;c[d+4>>2]=0;c[d+8>>2]=0;c[d+12>>2]=0;c[d+16>>2]=0;c[d+20>>2]=0;c[d+24>>2]=0;c[d+28>>2]=0;if((f|0)!=(g|0)?(Xj(f,g,32)|0)!=0:0)d=f;else e=12;do if((e|0)==12){d=b+160|0;e=g+32|0;if((d|0)!=(e|0)?Xj(d,e,32)|0:0){d=f;break}f=g;d=b;e=f+64|0;do{c[f>>2]=c[d>>2];f=f+4|0;d=d+4|0;}while((f|0)<(e|0));f=g+64|0;d=b+64|0;e=f+64|0;do{c[f>>2]=c[d>>2];f=f+4|0;d=d+4|0;}while((f|0)<(e|0));f=a;c[f>>2]=1;c[f+4>>2]=0;f=a+8|0;d=g;e=f+128|0;do{c[f>>2]=c[d>>2];f=f+4|0;d=d+4|0;}while((f|0)<(e|0));l=p;return}while(0);f=g;e=f+64|0;do{c[f>>2]=c[d>>2];f=f+4|0;d=d+4|0;}while((f|0)<(e|0));ed(h,g);f=h;if(!((c[f>>2]|0)==1&(c[f+4>>2]|0)==0))$i(2032);f=o;d=h+8|0;e=f+64|0;do{c[f>>2]=c[d>>2];f=f+4|0;d=d+4|0;}while((f|0)<(e|0));dd(n,o);f=h;d=b;e=f+64|0;do{c[f>>2]=c[d>>2];f=f+4|0;d=d+4|0;}while((f|0)<(e|0));f=g;d=n;e=f+64|0;do{c[f>>2]=c[d>>2];f=f+4|0;d=d+4|0;}while((f|0)<(e|0));cd(m,h,g);f=j;d=b+64|0;e=f+64|0;do{c[f>>2]=c[d>>2];f=f+4|0;d=d+4|0;}while((f|0)<(e|0));f=h;d=n;e=f+64|0;do{c[f>>2]=c[d>>2];f=f+4|0;d=d+4|0;}while((f|0)<(e|0));f=g;d=o;e=f+64|0;do{c[f>>2]=c[d>>2];f=f+4|0;d=d+4|0;}while((f|0)<(e|0));cd(i,h,g);cd(k,j,i);f=m+64|0;d=k;e=f+64|0;do{c[f>>2]=c[d>>2];f=f+4|0;d=d+4|0;}while((f|0)<(e|0));f=a;c[f>>2]=1;c[f+4>>2]=0;f=a+8|0;d=m;e=f+128|0;do{c[f>>2]=c[d>>2];f=f+4|0;d=d+4|0;}while((f|0)<(e|0));l=p;return}function Ac(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0;n=l;l=l+320|0;d=n+256|0;f=n+224|0;g=n+192|0;h=n+160|0;i=n+128|0;m=n+64|0;j=n+32|0;k=n;e=b+64|0;o=e;if((((c[o>>2]|0)==0&(c[o+4>>2]|0)==0?(o=b+72|0,(c[o>>2]|0)==0&(c[o+4>>2]|0)==0):0)?(o=b+80|0,(c[o>>2]|0)==0&(c[o+4>>2]|0)==0):0)?(o=b+88|0,(c[o>>2]|0)==0&(c[o+4>>2]|0)==0):0){o=a;c[o>>2]=0;c[o+4>>2]=0;l=n;return}o=d;c[o>>2]=-980480611;c[o+4>>2]=-748862579;o=d+8|0;c[o>>2]=-171504835;c[o+4>>2]=175696680;o=d+16|0;c[o>>2]=2021213740;c[o+4>>2]=1718526831;o=d+24|0;c[o>>2]=-1710760145;c[o+4>>2]=235567041;if((e|0)!=(d|0))if(Xj(e,d,32)|0){c[d>>2]=c[e>>2];c[d+4>>2]=c[e+4>>2];c[d+8>>2]=c[e+8>>2];c[d+12>>2]=c[e+12>>2];c[d+16>>2]=c[e+16>>2];c[d+20>>2]=c[e+20>>2];c[d+24>>2]=c[e+24>>2];c[d+28>>2]=c[e+28>>2];o=d;if((((c[o>>2]|0)==0&(c[o+4>>2]|0)==0?(o=d+8|0,(c[o>>2]|0)==0&(c[o+4>>2]|0)==0):0)?(o=d+16|0,(c[o>>2]|0)==0&(c[o+4>>2]|0)==0):0)?(o=d+24|0,(c[o>>2]|0)==0&(c[o+4>>2]|0)==0):0)$i(2032);Oc(d,136);Mc(d,104,136,-460954743,-2016278654);c[k>>2]=c[d>>2];c[k+4>>2]=c[d+4>>2];c[k+8>>2]=c[d+8>>2];c[k+12>>2]=c[d+12>>2];c[k+16>>2]=c[d+16>>2];c[k+20>>2]=c[d+20>>2];c[k+24>>2]=c[d+24>>2];c[k+28>>2]=c[d+28>>2];c[f>>2]=c[k>>2];c[f+4>>2]=c[k+4>>2];c[f+8>>2]=c[k+8>>2];c[f+12>>2]=c[k+12>>2];c[f+16>>2]=c[k+16>>2];c[f+20>>2]=c[k+20>>2];c[f+24>>2]=c[k+24>>2];c[f+28>>2]=c[k+28>>2];c[d>>2]=c[k>>2];c[d+4>>2]=c[k+4>>2];c[d+8>>2]=c[k+8>>2];c[d+12>>2]=c[k+12>>2];c[d+16>>2]=c[k+16>>2];c[d+20>>2]=c[k+20>>2];c[d+24>>2]=c[k+24>>2];c[d+28>>2]=c[k+28>>2];Mc(f,d,136,-460954743,-2016278654);c[j>>2]=c[f>>2];c[j+4>>2]=c[f+4>>2];c[j+8>>2]=c[f+8>>2];c[j+12>>2]=c[f+12>>2];c[j+16>>2]=c[f+16>>2];c[j+20>>2]=c[f+20>>2];c[j+24>>2]=c[f+24>>2];c[j+28>>2]=c[f+28>>2];c[f>>2]=c[b>>2];c[f+4>>2]=c[b+4>>2];c[f+8>>2]=c[b+8>>2];c[f+12>>2]=c[b+12>>2];c[f+16>>2]=c[b+16>>2];c[f+20>>2]=c[b+20>>2];c[f+24>>2]=c[b+24>>2];c[f+28>>2]=c[b+28>>2];c[d>>2]=c[j>>2];c[d+4>>2]=c[j+4>>2];c[d+8>>2]=c[j+8>>2];c[d+12>>2]=c[j+12>>2];c[d+16>>2]=c[j+16>>2];c[d+20>>2]=c[j+20>>2];c[d+24>>2]=c[j+24>>2];c[d+28>>2]=c[j+28>>2];Mc(f,d,136,-460954743,-2016278654);c[m>>2]=c[f>>2];c[m+4>>2]=c[f+4>>2];c[m+8>>2]=c[f+8>>2];c[m+12>>2]=c[f+12>>2];c[m+16>>2]=c[f+16>>2];c[m+20>>2]=c[f+20>>2];c[m+24>>2]=c[f+24>>2];c[m+28>>2]=c[f+28>>2];b=b+32|0;c[h>>2]=c[b>>2];c[h+4>>2]=c[b+4>>2];c[h+8>>2]=c[b+8>>2];c[h+12>>2]=c[b+12>>2];c[h+16>>2]=c[b+16>>2];c[h+20>>2]=c[b+20>>2];c[h+24>>2]=c[b+24>>2];c[h+28>>2]=c[b+28>>2];c[f>>2]=c[j>>2];c[f+4>>2]=c[j+4>>2];c[f+8>>2]=c[j+8>>2];c[f+12>>2]=c[j+12>>2];c[f+16>>2]=c[j+16>>2];c[f+20>>2]=c[j+20>>2];c[f+24>>2]=c[j+24>>2];c[f+28>>2]=c[j+28>>2];c[d>>2]=c[k>>2];c[d+4>>2]=c[k+4>>2];c[d+8>>2]=c[k+8>>2];c[d+12>>2]=c[k+12>>2];c[d+16>>2]=c[k+16>>2];c[d+20>>2]=c[k+20>>2];c[d+24>>2]=c[k+24>>2];c[d+28>>2]=c[k+28>>2];Mc(f,d,136,-460954743,-2016278654);c[g>>2]=c[f>>2];c[g+4>>2]=c[f+4>>2];c[g+8>>2]=c[f+8>>2];c[g+12>>2]=c[f+12>>2];c[g+16>>2]=c[f+16>>2];c[g+20>>2]=c[f+20>>2];c[g+24>>2]=c[f+24>>2];c[g+28>>2]=c[f+28>>2];Mc(h,g,136,-460954743,-2016278654);c[i>>2]=c[h>>2];c[i+4>>2]=c[h+4>>2];c[i+8>>2]=c[h+8>>2];c[i+12>>2]=c[h+12>>2];c[i+16>>2]=c[h+16>>2];c[i+20>>2]=c[h+20>>2];c[i+24>>2]=c[h+24>>2];c[i+28>>2]=c[h+28>>2];b=m+32|0;c[b>>2]=c[i>>2];c[b+4>>2]=c[i+4>>2];c[b+8>>2]=c[i+8>>2];c[b+12>>2]=c[i+12>>2];c[b+16>>2]=c[i+16>>2];c[b+20>>2]=c[i+20>>2];c[b+24>>2]=c[i+24>>2];c[b+28>>2]=c[i+28>>2];b=a;c[b>>2]=1;c[b+4>>2]=0;b=a+8|0;d=m;a=b+64|0;do{c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;}while((b|0)<(a|0));l=n;return};c[d>>2]=c[b>>2];c[d+4>>2]=c[b+4>>2];c[d+8>>2]=c[b+8>>2];c[d+12>>2]=c[b+12>>2];c[d+16>>2]=c[b+16>>2];c[d+20>>2]=c[b+20>>2];c[d+24>>2]=c[b+24>>2];c[d+28>>2]=c[b+28>>2];o=b+32|0;b=d+32|0;c[b>>2]=c[o>>2];c[b+4>>2]=c[o+4>>2];c[b+8>>2]=c[o+8>>2];c[b+12>>2]=c[o+12>>2];c[b+16>>2]=c[o+16>>2];c[b+20>>2]=c[o+20>>2];c[b+24>>2]=c[o+24>>2];c[b+28>>2]=c[o+28>>2];b=a;c[b>>2]=1;c[b+4>>2]=0;b=a+8|0;a=b+64|0;do{c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;}while((b|0)<(a|0));l=n;return}function Bc(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;d=l;l=l+480|0;h=d+448|0;g=d+416|0;e=d+384|0;m=d+352|0;j=d+320|0;f=d+288|0;i=d+256|0;k=d+224|0;n=d+192|0;s=d+160|0;p=d+128|0;o=d+96|0;r=d+64|0;u=d+32|0;t=d;c[g>>2]=c[b>>2];c[g+4>>2]=c[b+4>>2];c[g+8>>2]=c[b+8>>2];c[g+12>>2]=c[b+12>>2];c[g+16>>2]=c[b+16>>2];c[g+20>>2]=c[b+20>>2];c[g+24>>2]=c[b+24>>2];c[g+28>>2]=c[b+28>>2];c[h>>2]=c[b>>2];c[h+4>>2]=c[b+4>>2];c[h+8>>2]=c[b+8>>2];c[h+12>>2]=c[b+12>>2];c[h+16>>2]=c[b+16>>2];c[h+20>>2]=c[b+20>>2];c[h+24>>2]=c[b+24>>2];c[h+28>>2]=c[b+28>>2];Mc(g,h,136,-460954743,-2016278654);c[t>>2]=c[g>>2];c[t+4>>2]=c[g+4>>2];c[t+8>>2]=c[g+8>>2];c[t+12>>2]=c[g+12>>2];c[t+16>>2]=c[g+16>>2];c[t+20>>2]=c[g+20>>2];c[t+24>>2]=c[g+24>>2];c[t+28>>2]=c[g+28>>2];q=b+32|0;c[g>>2]=c[q>>2];c[g+4>>2]=c[q+4>>2];c[g+8>>2]=c[q+8>>2];c[g+12>>2]=c[q+12>>2];c[g+16>>2]=c[q+16>>2];c[g+20>>2]=c[q+20>>2];c[g+24>>2]=c[q+24>>2];c[g+28>>2]=c[q+28>>2];c[h>>2]=c[q>>2];c[h+4>>2]=c[q+4>>2];c[h+8>>2]=c[q+8>>2];c[h+12>>2]=c[q+12>>2];c[h+16>>2]=c[q+16>>2];c[h+20>>2]=c[q+20>>2];c[h+24>>2]=c[q+24>>2];c[h+28>>2]=c[q+28>>2];Mc(g,h,136,-460954743,-2016278654);c[u>>2]=c[g>>2];c[u+4>>2]=c[g+4>>2];c[u+8>>2]=c[g+8>>2];c[u+12>>2]=c[g+12>>2];c[u+16>>2]=c[g+16>>2];c[u+20>>2]=c[g+20>>2];c[u+24>>2]=c[g+24>>2];c[u+28>>2]=c[g+28>>2];c[g>>2]=c[u>>2];c[g+4>>2]=c[u+4>>2];c[g+8>>2]=c[u+8>>2];c[g+12>>2]=c[u+12>>2];c[g+16>>2]=c[u+16>>2];c[g+20>>2]=c[u+20>>2];c[g+24>>2]=c[u+24>>2];c[g+28>>2]=c[u+28>>2];c[h>>2]=c[u>>2];c[h+4>>2]=c[u+4>>2];c[h+8>>2]=c[u+8>>2];c[h+12>>2]=c[u+12>>2];c[h+16>>2]=c[u+16>>2];c[h+20>>2]=c[u+20>>2];c[h+24>>2]=c[u+24>>2];c[h+28>>2]=c[u+28>>2];Mc(g,h,136,-460954743,-2016278654);c[r>>2]=c[g>>2];c[r+4>>2]=c[g+4>>2];c[r+8>>2]=c[g+8>>2];c[r+12>>2]=c[g+12>>2];c[r+16>>2]=c[g+16>>2];c[r+20>>2]=c[g+20>>2];c[r+24>>2]=c[g+24>>2];c[r+28>>2]=c[g+28>>2];c[g>>2]=c[b>>2];c[g+4>>2]=c[b+4>>2];c[g+8>>2]=c[b+8>>2];c[g+12>>2]=c[b+12>>2];c[g+16>>2]=c[b+16>>2];c[g+20>>2]=c[b+20>>2];c[g+24>>2]=c[b+24>>2];c[g+28>>2]=c[b+28>>2];c[h>>2]=c[u>>2];c[h+4>>2]=c[u+4>>2];c[h+8>>2]=c[u+8>>2];c[h+12>>2]=c[u+12>>2];c[h+16>>2]=c[u+16>>2];c[h+20>>2]=c[u+20>>2];c[h+24>>2]=c[u+24>>2];c[h+28>>2]=c[u+28>>2];Kc(g,h,136);c[e>>2]=c[g>>2];c[e+4>>2]=c[g+4>>2];c[e+8>>2]=c[g+8>>2];c[e+12>>2]=c[g+12>>2];c[e+16>>2]=c[g+16>>2];c[e+20>>2]=c[g+20>>2];c[e+24>>2]=c[g+24>>2];c[e+28>>2]=c[g+28>>2];c[g>>2]=c[e>>2];c[g+4>>2]=c[e+4>>2];c[g+8>>2]=c[e+8>>2];c[g+12>>2]=c[e+12>>2];c[g+16>>2]=c[e+16>>2];c[g+20>>2]=c[e+20>>2];c[g+24>>2]=c[e+24>>2];c[g+28>>2]=c[e+28>>2];c[h>>2]=c[e>>2];c[h+4>>2]=c[e+4>>2];c[h+8>>2]=c[e+8>>2];c[h+12>>2]=c[e+12>>2];c[h+16>>2]=c[e+16>>2];c[h+20>>2]=c[e+20>>2];c[h+24>>2]=c[e+24>>2];c[h+28>>2]=c[e+28>>2];Mc(g,h,136,-460954743,-2016278654);c[m>>2]=c[g>>2];c[m+4>>2]=c[g+4>>2];c[m+8>>2]=c[g+8>>2];c[m+12>>2]=c[g+12>>2];c[m+16>>2]=c[g+16>>2];c[m+20>>2]=c[g+20>>2];c[m+24>>2]=c[g+24>>2];c[m+28>>2]=c[g+28>>2];c[h>>2]=c[t>>2];c[h+4>>2]=c[t+4>>2];c[h+8>>2]=c[t+8>>2];c[h+12>>2]=c[t+12>>2];c[h+16>>2]=c[t+16>>2];c[h+20>>2]=c[t+20>>2];c[h+24>>2]=c[t+24>>2];c[h+28>>2]=c[t+28>>2];Lc(m,h,136);c[j>>2]=c[m>>2];c[j+4>>2]=c[m+4>>2];c[j+8>>2]=c[m+8>>2];c[j+12>>2]=c[m+12>>2];c[j+16>>2]=c[m+16>>2];c[j+20>>2]=c[m+20>>2];c[j+24>>2]=c[m+24>>2];c[j+28>>2]=c[m+28>>2];c[h>>2]=c[r>>2];c[h+4>>2]=c[r+4>>2];c[h+8>>2]=c[r+8>>2];c[h+12>>2]=c[r+12>>2];c[h+16>>2]=c[r+16>>2];c[h+20>>2]=c[r+20>>2];c[h+24>>2]=c[r+24>>2];c[h+28>>2]=c[r+28>>2];Lc(j,h,136);c[o>>2]=c[j>>2];c[o+4>>2]=c[j+4>>2];c[o+8>>2]=c[j+8>>2];c[o+12>>2]=c[j+12>>2];c[o+16>>2]=c[j+16>>2];c[o+20>>2]=c[j+20>>2];c[o+24>>2]=c[j+24>>2];c[o+28>>2]=c[j+28>>2];c[g>>2]=c[o>>2];c[g+4>>2]=c[o+4>>2];c[g+8>>2]=c[o+8>>2];c[g+12>>2]=c[o+12>>2];c[g+16>>2]=c[o+16>>2];c[g+20>>2]=c[o+20>>2];c[g+24>>2]=c[o+24>>2];c[g+28>>2]=c[o+28>>2];c[h>>2]=c[o>>2];c[h+4>>2]=c[o+4>>2];c[h+8>>2]=c[o+8>>2];c[h+12>>2]=c[o+12>>2];c[h+16>>2]=c[o+16>>2];c[h+20>>2]=c[o+20>>2];c[h+24>>2]=c[o+24>>2];c[h+28>>2]=c[o+28>>2];Kc(g,h,136);c[o>>2]=c[g>>2];c[o+4>>2]=c[g+4>>2];c[o+8>>2]=c[g+8>>2];c[o+12>>2]=c[g+12>>2];c[o+16>>2]=c[g+16>>2];c[o+20>>2]=c[g+20>>2];c[o+24>>2]=c[g+24>>2];c[o+28>>2]=c[g+28>>2];c[g>>2]=c[t>>2];c[g+4>>2]=c[t+4>>2];c[g+8>>2]=c[t+8>>2];c[g+12>>2]=c[t+12>>2];c[g+16>>2]=c[t+16>>2];c[g+20>>2]=c[t+20>>2];c[g+24>>2]=c[t+24>>2];c[g+28>>2]=c[t+28>>2];c[h>>2]=c[t>>2];c[h+4>>2]=c[t+4>>2];c[h+8>>2]=c[t+8>>2];c[h+12>>2]=c[t+12>>2];c[h+16>>2]=c[t+16>>2];c[h+20>>2]=c[t+20>>2];c[h+24>>2]=c[t+24>>2];c[h+28>>2]=c[t+28>>2];Kc(g,h,136);c[e>>2]=c[g>>2];c[e+4>>2]=c[g+4>>2];c[e+8>>2]=c[g+8>>2];c[e+12>>2]=c[g+12>>2];c[e+16>>2]=c[g+16>>2];c[e+20>>2]=c[g+20>>2];c[e+24>>2]=c[g+24>>2];c[e+28>>2]=c[g+28>>2];c[h>>2]=c[t>>2];c[h+4>>2]=c[t+4>>2];c[h+8>>2]=c[t+8>>2];c[h+12>>2]=c[t+12>>2];c[h+16>>2]=c[t+16>>2];c[h+20>>2]=c[t+20>>2];c[h+24>>2]=c[t+24>>2];c[h+28>>2]=c[t+28>>2];Kc(e,h,136);c[p>>2]=c[e>>2];c[p+4>>2]=c[e+4>>2];c[p+8>>2]=c[e+8>>2];c[p+12>>2]=c[e+12>>2];c[p+16>>2]=c[e+16>>2];c[p+20>>2]=c[e+20>>2];c[p+24>>2]=c[e+24>>2];c[p+28>>2]=c[e+28>>2];c[g>>2]=c[p>>2];c[g+4>>2]=c[p+4>>2];c[g+8>>2]=c[p+8>>2];c[g+12>>2]=c[p+12>>2];c[g+16>>2]=c[p+16>>2];c[g+20>>2]=c[p+20>>2];c[g+24>>2]=c[p+24>>2];c[g+28>>2]=c[p+28>>2];c[h>>2]=c[p>>2];c[h+4>>2]=c[p+4>>2];c[h+8>>2]=c[p+8>>2];c[h+12>>2]=c[p+12>>2];c[h+16>>2]=c[p+16>>2];c[h+20>>2]=c[p+20>>2];c[h+24>>2]=c[p+24>>2];c[h+28>>2]=c[p+28>>2];Mc(g,h,136,-460954743,-2016278654);c[s>>2]=c[g>>2];c[s+4>>2]=c[g+4>>2];c[s+8>>2]=c[g+8>>2];c[s+12>>2]=c[g+12>>2];c[s+16>>2]=c[g+16>>2];c[s+20>>2]=c[g+20>>2];c[s+24>>2]=c[g+24>>2];c[s+28>>2]=c[g+28>>2];c[m>>2]=c[s>>2];c[m+4>>2]=c[s+4>>2];c[m+8>>2]=c[s+8>>2];c[m+12>>2]=c[s+12>>2];c[m+16>>2]=c[s+16>>2];c[m+20>>2]=c[s+20>>2];c[m+24>>2]=c[s+24>>2];c[m+28>>2]=c[s+28>>2];c[g>>2]=c[o>>2];c[g+4>>2]=c[o+4>>2];c[g+8>>2]=c[o+8>>2];c[g+12>>2]=c[o+12>>2];c[g+16>>2]=c[o+16>>2];c[g+20>>2]=c[o+20>>2];c[g+24>>2]=c[o+24>>2];c[g+28>>2]=c[o+28>>2];c[h>>2]=c[o>>2];c[h+4>>2]=c[o+4>>2];c[h+8>>2]=c[o+8>>2];c[h+12>>2]=c[o+12>>2];c[h+16>>2]=c[o+16>>2];c[h+20>>2]=c[o+20>>2];c[h+24>>2]=c[o+24>>2];c[h+28>>2]=c[o+28>>2];Kc(g,h,136);c[e>>2]=c[g>>2];c[e+4>>2]=c[g+4>>2];c[e+8>>2]=c[g+8>>2];c[e+12>>2]=c[g+12>>2];c[e+16>>2]=c[g+16>>2];c[e+20>>2]=c[g+20>>2];c[e+24>>2]=c[g+24>>2];c[e+28>>2]=c[g+28>>2];Lc(m,e,136);c[n>>2]=c[m>>2];c[n+4>>2]=c[m+4>>2];c[n+8>>2]=c[m+8>>2];c[n+12>>2]=c[m+12>>2];c[n+16>>2]=c[m+16>>2];c[n+20>>2]=c[m+20>>2];c[n+24>>2]=c[m+24>>2];c[n+28>>2]=c[m+28>>2];c[g>>2]=c[r>>2];c[g+4>>2]=c[r+4>>2];c[g+8>>2]=c[r+8>>2];c[g+12>>2]=c[r+12>>2];c[g+16>>2]=c[r+16>>2];c[g+20>>2]=c[r+20>>2];c[g+24>>2]=c[r+24>>2];c[g+28>>2]=c[r+28>>2];c[h>>2]=c[r>>2];c[h+4>>2]=c[r+4>>2];c[h+8>>2]=c[r+8>>2];c[h+12>>2]=c[r+12>>2];c[h+16>>2]=c[r+16>>2];c[h+20>>2]=c[r+20>>2];c[h+24>>2]=c[r+24>>2];c[h+28>>2]=c[r+28>>2];Kc(g,h,136);c[k>>2]=c[g>>2];c[k+4>>2]=c[g+4>>2];c[k+8>>2]=c[g+8>>2];c[k+12>>2]=c[g+12>>2];c[k+16>>2]=c[g+16>>2];c[k+20>>2]=c[g+20>>2];c[k+24>>2]=c[g+24>>2];c[k+28>>2]=c[g+28>>2];c[g>>2]=c[k>>2];c[g+4>>2]=c[k+4>>2];c[g+8>>2]=c[k+8>>2];c[g+12>>2]=c[k+12>>2];c[g+16>>2]=c[k+16>>2];c[g+20>>2]=c[k+20>>2];c[g+24>>2]=c[k+24>>2];c[g+28>>2]=c[k+28>>2];c[h>>2]=c[k>>2];c[h+4>>2]=c[k+4>>2];c[h+8>>2]=c[k+8>>2];c[h+12>>2]=c[k+12>>2];c[h+16>>2]=c[k+16>>2];c[h+20>>2]=c[k+20>>2];c[h+24>>2]=c[k+24>>2];c[h+28>>2]=c[k+28>>2];Kc(g,h,136);c[k>>2]=c[g>>2];c[k+4>>2]=c[g+4>>2];c[k+8>>2]=c[g+8>>2];c[k+12>>2]=c[g+12>>2];c[k+16>>2]=c[g+16>>2];c[k+20>>2]=c[g+20>>2];c[k+24>>2]=c[g+24>>2];c[k+28>>2]=c[g+28>>2];c[g>>2]=c[k>>2];c[g+4>>2]=c[k+4>>2];c[g+8>>2]=c[k+8>>2];c[g+12>>2]=c[k+12>>2];c[g+16>>2]=c[k+16>>2];c[g+20>>2]=c[k+20>>2];c[g+24>>2]=c[k+24>>2];c[g+28>>2]=c[k+28>>2];c[h>>2]=c[k>>2];c[h+4>>2]=c[k+4>>2];c[h+8>>2]=c[k+8>>2];c[h+12>>2]=c[k+12>>2];c[h+16>>2]=c[k+16>>2];c[h+20>>2]=c[k+20>>2];c[h+24>>2]=c[k+24>>2];c[h+28>>2]=c[k+28>>2];Kc(g,h,136);c[k>>2]=c[g>>2];c[k+4>>2]=c[g+4>>2];c[k+8>>2]=c[g+8>>2];c[k+12>>2]=c[g+12>>2];c[k+16>>2]=c[g+16>>2];c[k+20>>2]=c[g+20>>2];c[k+24>>2]=c[g+24>>2];c[k+28>>2]=c[g+28>>2];c[g>>2]=c[q>>2];c[g+4>>2]=c[q+4>>2];c[g+8>>2]=c[q+8>>2];c[g+12>>2]=c[q+12>>2];c[g+16>>2]=c[q+16>>2];c[g+20>>2]=c[q+20>>2];c[g+24>>2]=c[q+24>>2];c[g+28>>2]=c[q+28>>2];b=b+64|0;c[h>>2]=c[b>>2];c[h+4>>2]=c[b+4>>2];c[h+8>>2]=c[b+8>>2];c[h+12>>2]=c[b+12>>2];c[h+16>>2]=c[b+16>>2];c[h+20>>2]=c[b+20>>2];c[h+24>>2]=c[b+24>>2];c[h+28>>2]=c[b+28>>2];Mc(g,h,136,-460954743,-2016278654);c[i>>2]=c[g>>2];c[i+4>>2]=c[g+4>>2];c[i+8>>2]=c[g+8>>2];c[i+12>>2]=c[g+12>>2];c[i+16>>2]=c[g+16>>2];c[i+20>>2]=c[g+20>>2];c[i+24>>2]=c[g+24>>2];c[i+28>>2]=c[g+28>>2];c[a>>2]=c[n>>2];c[a+4>>2]=c[n+4>>2];c[a+8>>2]=c[n+8>>2];c[a+12>>2]=c[n+12>>2];c[a+16>>2]=c[n+16>>2];c[a+20>>2]=c[n+20>>2];c[a+24>>2]=c[n+24>>2];c[a+28>>2]=c[n+28>>2];c[m>>2]=c[p>>2];c[m+4>>2]=c[p+4>>2];c[m+8>>2]=c[p+8>>2];c[m+12>>2]=c[p+12>>2];c[m+16>>2]=c[p+16>>2];c[m+20>>2]=c[p+20>>2];c[m+24>>2]=c[p+24>>2];c[m+28>>2]=c[p+28>>2];c[g>>2]=c[o>>2];c[g+4>>2]=c[o+4>>2];c[g+8>>2]=c[o+8>>2];c[g+12>>2]=c[o+12>>2];c[g+16>>2]=c[o+16>>2];c[g+20>>2]=c[o+20>>2];c[g+24>>2]=c[o+24>>2];c[g+28>>2]=c[o+28>>2];c[h>>2]=c[n>>2];c[h+4>>2]=c[n+4>>2];c[h+8>>2]=c[n+8>>2];c[h+12>>2]=c[n+12>>2];c[h+16>>2]=c[n+16>>2];c[h+20>>2]=c[n+20>>2];c[h+24>>2]=c[n+24>>2];c[h+28>>2]=c[n+28>>2];Lc(g,h,136);c[e>>2]=c[g>>2];c[e+4>>2]=c[g+4>>2];c[e+8>>2]=c[g+8>>2];c[e+12>>2]=c[g+12>>2];c[e+16>>2]=c[g+16>>2];c[e+20>>2]=c[g+20>>2];c[e+24>>2]=c[g+24>>2];c[e+28>>2]=c[g+28>>2];Mc(m,e,136,-460954743,-2016278654);c[j>>2]=c[m>>2];c[j+4>>2]=c[m+4>>2];c[j+8>>2]=c[m+8>>2];c[j+12>>2]=c[m+12>>2];c[j+16>>2]=c[m+16>>2];c[j+20>>2]=c[m+20>>2];c[j+24>>2]=c[m+24>>2];c[j+28>>2]=c[m+28>>2];c[h>>2]=c[k>>2];c[h+4>>2]=c[k+4>>2];c[h+8>>2]=c[k+8>>2];c[h+12>>2]=c[k+12>>2];c[h+16>>2]=c[k+16>>2];c[h+20>>2]=c[k+20>>2];c[h+24>>2]=c[k+24>>2];c[h+28>>2]=c[k+28>>2];Lc(j,h,136);c[f>>2]=c[j>>2];c[f+4>>2]=c[j+4>>2];c[f+8>>2]=c[j+8>>2];c[f+12>>2]=c[j+12>>2];c[f+16>>2]=c[j+16>>2];c[f+20>>2]=c[j+20>>2];c[f+24>>2]=c[j+24>>2];c[f+28>>2]=c[j+28>>2];c[g>>2]=c[i>>2];c[g+4>>2]=c[i+4>>2];c[g+8>>2]=c[i+8>>2];c[g+12>>2]=c[i+12>>2];c[g+16>>2]=c[i+16>>2];c[g+20>>2]=c[i+20>>2];c[g+24>>2]=c[i+24>>2];c[g+28>>2]=c[i+28>>2];c[h>>2]=c[i>>2];c[h+4>>2]=c[i+4>>2];c[h+8>>2]=c[i+8>>2];c[h+12>>2]=c[i+12>>2];c[h+16>>2]=c[i+16>>2];c[h+20>>2]=c[i+20>>2];c[h+24>>2]=c[i+24>>2];c[h+28>>2]=c[i+28>>2];Kc(g,h,136);c[e>>2]=c[g>>2];c[e+4>>2]=c[g+4>>2];c[e+8>>2]=c[g+8>>2];c[e+12>>2]=c[g+12>>2];c[e+16>>2]=c[g+16>>2];c[e+20>>2]=c[g+20>>2];c[e+24>>2]=c[g+24>>2];c[e+28>>2]=c[g+28>>2];b=a+32|0;c[b>>2]=c[f>>2];c[b+4>>2]=c[f+4>>2];c[b+8>>2]=c[f+8>>2];c[b+12>>2]=c[f+12>>2];c[b+16>>2]=c[f+16>>2];c[b+20>>2]=c[f+20>>2];c[b+24>>2]=c[f+24>>2];c[b+28>>2]=c[f+28>>2];b=a+64|0;c[b>>2]=c[e>>2];c[b+4>>2]=c[e+4>>2];c[b+8>>2]=c[e+8>>2];c[b+12>>2]=c[e+12>>2];c[b+16>>2]=c[e+16>>2];c[b+20>>2]=c[e+20>>2];c[b+24>>2]=c[e+24>>2];c[b+28>>2]=c[e+28>>2];l=d;return}function Cc(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0;n=l;l=l+320|0;i=n+224|0;j=n+128|0;k=n+96|0;m=n;c[m>>2]=0;c[m+4>>2]=0;c[m+8>>2]=0;c[m+12>>2]=0;c[m+16>>2]=0;c[m+20>>2]=0;c[m+24>>2]=0;c[m+28>>2]=0;h=m+32|0;c[h>>2]=-980480611;c[h+4>>2]=-748862579;h=m+40|0;c[h>>2]=-171504835;c[h+4>>2]=175696680;h=m+48|0;c[h>>2]=2021213740;c[h+4>>2]=1718526831;h=m+56|0;c[h>>2]=-1710760145;c[h+4>>2]=235567041;h=m+64|0;c[h>>2]=0;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[h+16>>2]=0;c[h+20>>2]=0;c[h+24>>2]=0;c[h+28>>2]=0;c[j>>2]=c[d>>2];c[j+4>>2]=c[d+4>>2];c[j+8>>2]=c[d+8>>2];c[j+12>>2]=c[d+12>>2];c[j+16>>2]=c[d+16>>2];c[j+20>>2]=c[d+20>>2];c[j+24>>2]=c[d+24>>2];c[j+28>>2]=c[d+28>>2];d=i;c[d>>2]=1;c[d+4>>2]=0;d=i+8|0;c[d>>2]=0;c[d+4>>2]=0;c[d+8>>2]=0;c[d+12>>2]=0;c[d+16>>2]=0;c[d+20>>2]=0;Mc(j,i,8,-268435457,-1025378925);c[k>>2]=c[j>>2];c[k+4>>2]=c[j+4>>2];c[k+8>>2]=c[j+8>>2];c[k+12>>2]=c[j+12>>2];c[k+16>>2]=c[j+16>>2];c[k+20>>2]=c[j+20>>2];c[k+24>>2]=c[j+24>>2];c[k+28>>2]=c[j+28>>2];d=256;while(1){if(!d){d=7;break}d=d+-1|0;if(d>>>0>255){d=7;break}h=k+(d>>>6<<3)|0;f=c[h>>2]|0;h=c[h+4>>2]|0;g=nk(1,0,d&63|0)|0;if(!((f&g|0)==0&(h&y|0)==0)){e=d;d=9;break}}if((d|0)==7){f=a;g=m;h=f+96|0;do{c[f>>2]=c[g>>2];f=f+4|0;g=g+4|0;}while((f|0)<(h|0));l=n;return}else if((d|0)==9){a:while(1){f=j;g=m;h=f+96|0;do{c[f>>2]=c[g>>2];f=f+4|0;g=g+4|0;}while((f|0)<(h|0));f=i;g=b;h=f+96|0;do{c[f>>2]=c[g>>2];f=f+4|0;g=g+4|0;}while((f|0)<(h|0));Dc(m,j,i);while(1){if(!e){d=7;break a}e=e+-1|0;if(e>>>0>255){d=7;break a}d=k+(e>>>6<<3)|0;g=c[d>>2]|0;d=c[d+4>>2]|0;f=nk(1,0,e&63|0)|0;d=(g&f|0)==0&(d&y|0)==0;Bc(i,m);f=m;g=i;h=f+96|0;do{c[f>>2]=c[g>>2];f=f+4|0;g=g+4|0;}while((f|0)<(h|0));if(!d)continue a}}if((d|0)==7){f=a;g=m;h=f+96|0;do{c[f>>2]=c[g>>2];f=f+4|0;g=g+4|0;}while((f|0)<(h|0));l=n;return}}}function Dc(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0;F=l;l=l+768|0;x=F+736|0;y=F+704|0;z=F+672|0;A=F+640|0;C=F+608|0;D=F+576|0;E=F+544|0;e=F+512|0;f=F+480|0;g=F+448|0;h=F+416|0;i=F+384|0;j=F+352|0;k=F+320|0;m=F+288|0;n=F+256|0;o=F+224|0;p=F+192|0;q=F+160|0;r=F+128|0;s=F+96|0;t=F+64|0;u=F+32|0;v=F;w=b+64|0;B=w;if((((c[B>>2]|0)==0&(c[B+4>>2]|0)==0?(B=b+72|0,(c[B>>2]|0)==0&(c[B+4>>2]|0)==0):0)?(B=b+80|0,(c[B>>2]|0)==0&(c[B+4>>2]|0)==0):0)?(B=b+88|0,(c[B>>2]|0)==0&(c[B+4>>2]|0)==0):0){b=d;e=a+96|0;do{c[a>>2]=c[b>>2];a=a+4|0;b=b+4|0;}while((a|0)<(e|0));l=F;return}B=d+64|0;G=B;if((((c[G>>2]|0)==0&(c[G+4>>2]|0)==0?(G=d+72|0,(c[G>>2]|0)==0&(c[G+4>>2]|0)==0):0)?(G=d+80|0,(c[G>>2]|0)==0&(c[G+4>>2]|0)==0):0)?(G=d+88|0,(c[G>>2]|0)==0&(c[G+4>>2]|0)==0):0){e=a+96|0;do{c[a>>2]=c[b>>2];a=a+4|0;b=b+4|0;}while((a|0)<(e|0));l=F;return};c[y>>2]=c[w>>2];c[y+4>>2]=c[w+4>>2];c[y+8>>2]=c[w+8>>2];c[y+12>>2]=c[w+12>>2];c[y+16>>2]=c[w+16>>2];c[y+20>>2]=c[w+20>>2];c[y+24>>2]=c[w+24>>2];c[y+28>>2]=c[w+28>>2];c[x>>2]=c[w>>2];c[x+4>>2]=c[w+4>>2];c[x+8>>2]=c[w+8>>2];c[x+12>>2]=c[w+12>>2];c[x+16>>2]=c[w+16>>2];c[x+20>>2]=c[w+20>>2];c[x+24>>2]=c[w+24>>2];c[x+28>>2]=c[w+28>>2];Mc(y,x,136,-460954743,-2016278654);c[v>>2]=c[y>>2];c[v+4>>2]=c[y+4>>2];c[v+8>>2]=c[y+8>>2];c[v+12>>2]=c[y+12>>2];c[v+16>>2]=c[y+16>>2];c[v+20>>2]=c[y+20>>2];c[v+24>>2]=c[y+24>>2];c[v+28>>2]=c[y+28>>2];c[y>>2]=c[B>>2];c[y+4>>2]=c[B+4>>2];c[y+8>>2]=c[B+8>>2];c[y+12>>2]=c[B+12>>2];c[y+16>>2]=c[B+16>>2];c[y+20>>2]=c[B+20>>2];c[y+24>>2]=c[B+24>>2];c[y+28>>2]=c[B+28>>2];c[x>>2]=c[B>>2];c[x+4>>2]=c[B+4>>2];c[x+8>>2]=c[B+8>>2];c[x+12>>2]=c[B+12>>2];c[x+16>>2]=c[B+16>>2];c[x+20>>2]=c[B+20>>2];c[x+24>>2]=c[B+24>>2];c[x+28>>2]=c[B+28>>2];Mc(y,x,136,-460954743,-2016278654);c[u>>2]=c[y>>2];c[u+4>>2]=c[y+4>>2];c[u+8>>2]=c[y+8>>2];c[u+12>>2]=c[y+12>>2];c[u+16>>2]=c[y+16>>2];c[u+20>>2]=c[y+20>>2];c[u+24>>2]=c[y+24>>2];c[u+28>>2]=c[y+28>>2];c[y>>2]=c[b>>2];c[y+4>>2]=c[b+4>>2];c[y+8>>2]=c[b+8>>2];c[y+12>>2]=c[b+12>>2];c[y+16>>2]=c[b+16>>2];c[y+20>>2]=c[b+20>>2];c[y+24>>2]=c[b+24>>2];c[y+28>>2]=c[b+28>>2];c[x>>2]=c[u>>2];c[x+4>>2]=c[u+4>>2];c[x+8>>2]=c[u+8>>2];c[x+12>>2]=c[u+12>>2];c[x+16>>2]=c[u+16>>2];c[x+20>>2]=c[u+20>>2];c[x+24>>2]=c[u+24>>2];c[x+28>>2]=c[u+28>>2];Mc(y,x,136,-460954743,-2016278654);c[t>>2]=c[y>>2];c[t+4>>2]=c[y+4>>2];c[t+8>>2]=c[y+8>>2];c[t+12>>2]=c[y+12>>2];c[t+16>>2]=c[y+16>>2];c[t+20>>2]=c[y+20>>2];c[t+24>>2]=c[y+24>>2];c[t+28>>2]=c[y+28>>2];c[y>>2]=c[d>>2];c[y+4>>2]=c[d+4>>2];c[y+8>>2]=c[d+8>>2];c[y+12>>2]=c[d+12>>2];c[y+16>>2]=c[d+16>>2];c[y+20>>2]=c[d+20>>2];c[y+24>>2]=c[d+24>>2];c[y+28>>2]=c[d+28>>2];c[x>>2]=c[v>>2];c[x+4>>2]=c[v+4>>2];c[x+8>>2]=c[v+8>>2];c[x+12>>2]=c[v+12>>2];c[x+16>>2]=c[v+16>>2];c[x+20>>2]=c[v+20>>2];c[x+24>>2]=c[v+24>>2];c[x+28>>2]=c[v+28>>2];Mc(y,x,136,-460954743,-2016278654);c[s>>2]=c[y>>2];c[s+4>>2]=c[y+4>>2];c[s+8>>2]=c[y+8>>2];c[s+12>>2]=c[y+12>>2];c[s+16>>2]=c[y+16>>2];c[s+20>>2]=c[y+20>>2];c[s+24>>2]=c[y+24>>2];c[s+28>>2]=c[y+28>>2];c[y>>2]=c[w>>2];c[y+4>>2]=c[w+4>>2];c[y+8>>2]=c[w+8>>2];c[y+12>>2]=c[w+12>>2];c[y+16>>2]=c[w+16>>2];c[y+20>>2]=c[w+20>>2];c[y+24>>2]=c[w+24>>2];c[y+28>>2]=c[w+28>>2];c[x>>2]=c[v>>2];c[x+4>>2]=c[v+4>>2];c[x+8>>2]=c[v+8>>2];c[x+12>>2]=c[v+12>>2];c[x+16>>2]=c[v+16>>2];c[x+20>>2]=c[v+20>>2];c[x+24>>2]=c[v+24>>2];c[x+28>>2]=c[v+28>>2];Mc(y,x,136,-460954743,-2016278654);c[r>>2]=c[y>>2];c[r+4>>2]=c[y+4>>2];c[r+8>>2]=c[y+8>>2];c[r+12>>2]=c[y+12>>2];c[r+16>>2]=c[y+16>>2];c[r+20>>2]=c[y+20>>2];c[r+24>>2]=c[y+24>>2];c[r+28>>2]=c[y+28>>2];c[y>>2]=c[B>>2];c[y+4>>2]=c[B+4>>2];c[y+8>>2]=c[B+8>>2];c[y+12>>2]=c[B+12>>2];c[y+16>>2]=c[B+16>>2];c[y+20>>2]=c[B+20>>2];c[y+24>>2]=c[B+24>>2];c[y+28>>2]=c[B+28>>2];c[x>>2]=c[u>>2];c[x+4>>2]=c[u+4>>2];c[x+8>>2]=c[u+8>>2];c[x+12>>2]=c[u+12>>2];c[x+16>>2]=c[u+16>>2];c[x+20>>2]=c[u+20>>2];c[x+24>>2]=c[u+24>>2];c[x+28>>2]=c[u+28>>2];Mc(y,x,136,-460954743,-2016278654);c[q>>2]=c[y>>2];c[q+4>>2]=c[y+4>>2];c[q+8>>2]=c[y+8>>2];c[q+12>>2]=c[y+12>>2];c[q+16>>2]=c[y+16>>2];c[q+20>>2]=c[y+20>>2];c[q+24>>2]=c[y+24>>2];c[q+28>>2]=c[y+28>>2];G=b+32|0;c[y>>2]=c[G>>2];c[y+4>>2]=c[G+4>>2];c[y+8>>2]=c[G+8>>2];c[y+12>>2]=c[G+12>>2];c[y+16>>2]=c[G+16>>2];c[y+20>>2]=c[G+20>>2];c[y+24>>2]=c[G+24>>2];c[y+28>>2]=c[G+28>>2];c[x>>2]=c[q>>2];c[x+4>>2]=c[q+4>>2];c[x+8>>2]=c[q+8>>2];c[x+12>>2]=c[q+12>>2];c[x+16>>2]=c[q+16>>2];c[x+20>>2]=c[q+20>>2];c[x+24>>2]=c[q+24>>2];c[x+28>>2]=c[q+28>>2];Mc(y,x,136,-460954743,-2016278654);c[p>>2]=c[y>>2];c[p+4>>2]=c[y+4>>2];c[p+8>>2]=c[y+8>>2];c[p+12>>2]=c[y+12>>2];c[p+16>>2]=c[y+16>>2];c[p+20>>2]=c[y+20>>2];c[p+24>>2]=c[y+24>>2];c[p+28>>2]=c[y+28>>2];G=d+32|0;c[y>>2]=c[G>>2];c[y+4>>2]=c[G+4>>2];c[y+8>>2]=c[G+8>>2];c[y+12>>2]=c[G+12>>2];c[y+16>>2]=c[G+16>>2];c[y+20>>2]=c[G+20>>2];c[y+24>>2]=c[G+24>>2];c[y+28>>2]=c[G+28>>2];c[x>>2]=c[r>>2];c[x+4>>2]=c[r+4>>2];c[x+8>>2]=c[r+8>>2];c[x+12>>2]=c[r+12>>2];c[x+16>>2]=c[r+16>>2];c[x+20>>2]=c[r+20>>2];c[x+24>>2]=c[r+24>>2];c[x+28>>2]=c[r+28>>2];Mc(y,x,136,-460954743,-2016278654);c[o>>2]=c[y>>2];c[o+4>>2]=c[y+4>>2];c[o+8>>2]=c[y+8>>2];c[o+12>>2]=c[y+12>>2];c[o+16>>2]=c[y+16>>2];c[o+20>>2]=c[y+20>>2];c[o+24>>2]=c[y+24>>2];c[o+28>>2]=c[y+28>>2];if((Xj(t,s,32)|0)==0?(Xj(p,o,32)|0)==0:0)Bc(a,b);else {c[y>>2]=c[s>>2];c[y+4>>2]=c[s+4>>2];c[y+8>>2]=c[s+8>>2];c[y+12>>2]=c[s+12>>2];c[y+16>>2]=c[s+16>>2];c[y+20>>2]=c[s+20>>2];c[y+24>>2]=c[s+24>>2];c[y+28>>2]=c[s+28>>2];c[x>>2]=c[t>>2];c[x+4>>2]=c[t+4>>2];c[x+8>>2]=c[t+8>>2];c[x+12>>2]=c[t+12>>2];c[x+16>>2]=c[t+16>>2];c[x+20>>2]=c[t+20>>2];c[x+24>>2]=c[t+24>>2];c[x+28>>2]=c[t+28>>2];Lc(y,x,136);c[n>>2]=c[y>>2];c[n+4>>2]=c[y+4>>2];c[n+8>>2]=c[y+8>>2];c[n+12>>2]=c[y+12>>2];c[n+16>>2]=c[y+16>>2];c[n+20>>2]=c[y+20>>2];c[n+24>>2]=c[y+24>>2];c[n+28>>2]=c[y+28>>2];c[y>>2]=c[o>>2];c[y+4>>2]=c[o+4>>2];c[y+8>>2]=c[o+8>>2];c[y+12>>2]=c[o+12>>2];c[y+16>>2]=c[o+16>>2];c[y+20>>2]=c[o+20>>2];c[y+24>>2]=c[o+24>>2];c[y+28>>2]=c[o+28>>2];c[x>>2]=c[p>>2];c[x+4>>2]=c[p+4>>2];c[x+8>>2]=c[p+8>>2];c[x+12>>2]=c[p+12>>2];c[x+16>>2]=c[p+16>>2];c[x+20>>2]=c[p+20>>2];c[x+24>>2]=c[p+24>>2];c[x+28>>2]=c[p+28>>2];Lc(y,x,136);c[m>>2]=c[y>>2];c[m+4>>2]=c[y+4>>2];c[m+8>>2]=c[y+8>>2];c[m+12>>2]=c[y+12>>2];c[m+16>>2]=c[y+16>>2];c[m+20>>2]=c[y+20>>2];c[m+24>>2]=c[y+24>>2];c[m+28>>2]=c[y+28>>2];c[y>>2]=c[n>>2];c[y+4>>2]=c[n+4>>2];c[y+8>>2]=c[n+8>>2];c[y+12>>2]=c[n+12>>2];c[y+16>>2]=c[n+16>>2];c[y+20>>2]=c[n+20>>2];c[y+24>>2]=c[n+24>>2];c[y+28>>2]=c[n+28>>2];c[x>>2]=c[n>>2];c[x+4>>2]=c[n+4>>2];c[x+8>>2]=c[n+8>>2];c[x+12>>2]=c[n+12>>2];c[x+16>>2]=c[n+16>>2];c[x+20>>2]=c[n+20>>2];c[x+24>>2]=c[n+24>>2];c[x+28>>2]=c[n+28>>2];Kc(y,x,136);c[z>>2]=c[y>>2];c[z+4>>2]=c[y+4>>2];c[z+8>>2]=c[y+8>>2];c[z+12>>2]=c[y+12>>2];c[z+16>>2]=c[y+16>>2];c[z+20>>2]=c[y+20>>2];c[z+24>>2]=c[y+24>>2];c[z+28>>2]=c[y+28>>2];c[y>>2]=c[z>>2];c[y+4>>2]=c[z+4>>2];c[y+8>>2]=c[z+8>>2];c[y+12>>2]=c[z+12>>2];c[y+16>>2]=c[z+16>>2];c[y+20>>2]=c[z+20>>2];c[y+24>>2]=c[z+24>>2];c[y+28>>2]=c[z+28>>2];c[x>>2]=c[z>>2];c[x+4>>2]=c[z+4>>2];c[x+8>>2]=c[z+8>>2];c[x+12>>2]=c[z+12>>2];c[x+16>>2]=c[z+16>>2];c[x+20>>2]=c[z+20>>2];c[x+24>>2]=c[z+24>>2];c[x+28>>2]=c[z+28>>2];Mc(y,x,136,-460954743,-2016278654);c[k>>2]=c[y>>2];c[k+4>>2]=c[y+4>>2];c[k+8>>2]=c[y+8>>2];c[k+12>>2]=c[y+12>>2];c[k+16>>2]=c[y+16>>2];c[k+20>>2]=c[y+20>>2];c[k+24>>2]=c[y+24>>2];c[k+28>>2]=c[y+28>>2];c[y>>2]=c[n>>2];c[y+4>>2]=c[n+4>>2];c[y+8>>2]=c[n+8>>2];c[y+12>>2]=c[n+12>>2];c[y+16>>2]=c[n+16>>2];c[y+20>>2]=c[n+20>>2];c[y+24>>2]=c[n+24>>2];c[y+28>>2]=c[n+28>>2];c[x>>2]=c[k>>2];c[x+4>>2]=c[k+4>>2];c[x+8>>2]=c[k+8>>2];c[x+12>>2]=c[k+12>>2];c[x+16>>2]=c[k+16>>2];c[x+20>>2]=c[k+20>>2];c[x+24>>2]=c[k+24>>2];c[x+28>>2]=c[k+28>>2];Mc(y,x,136,-460954743,-2016278654);c[j>>2]=c[y>>2];c[j+4>>2]=c[y+4>>2];c[j+8>>2]=c[y+8>>2];c[j+12>>2]=c[y+12>>2];c[j+16>>2]=c[y+16>>2];c[j+20>>2]=c[y+20>>2];c[j+24>>2]=c[y+24>>2];c[j+28>>2]=c[y+28>>2];c[y>>2]=c[m>>2];c[y+4>>2]=c[m+4>>2];c[y+8>>2]=c[m+8>>2];c[y+12>>2]=c[m+12>>2];c[y+16>>2]=c[m+16>>2];c[y+20>>2]=c[m+20>>2];c[y+24>>2]=c[m+24>>2];c[y+28>>2]=c[m+28>>2];c[x>>2]=c[m>>2];c[x+4>>2]=c[m+4>>2];c[x+8>>2]=c[m+8>>2];c[x+12>>2]=c[m+12>>2];c[x+16>>2]=c[m+16>>2];c[x+20>>2]=c[m+20>>2];c[x+24>>2]=c[m+24>>2];c[x+28>>2]=c[m+28>>2];Kc(y,x,136);c[i>>2]=c[y>>2];c[i+4>>2]=c[y+4>>2];c[i+8>>2]=c[y+8>>2];c[i+12>>2]=c[y+12>>2];c[i+16>>2]=c[y+16>>2];c[i+20>>2]=c[y+20>>2];c[i+24>>2]=c[y+24>>2];c[i+28>>2]=c[y+28>>2];c[y>>2]=c[t>>2];c[y+4>>2]=c[t+4>>2];c[y+8>>2]=c[t+8>>2];c[y+12>>2]=c[t+12>>2];c[y+16>>2]=c[t+16>>2];c[y+20>>2]=c[t+20>>2];c[y+24>>2]=c[t+24>>2];c[y+28>>2]=c[t+28>>2];c[x>>2]=c[k>>2];c[x+4>>2]=c[k+4>>2];c[x+8>>2]=c[k+8>>2];c[x+12>>2]=c[k+12>>2];c[x+16>>2]=c[k+16>>2];c[x+20>>2]=c[k+20>>2];c[x+24>>2]=c[k+24>>2];c[x+28>>2]=c[k+28>>2];Mc(y,x,136,-460954743,-2016278654);c[h>>2]=c[y>>2];c[h+4>>2]=c[y+4>>2];c[h+8>>2]=c[y+8>>2];c[h+12>>2]=c[y+12>>2];c[h+16>>2]=c[y+16>>2];c[h+20>>2]=c[y+20>>2];c[h+24>>2]=c[y+24>>2];c[h+28>>2]=c[y+28>>2];c[y>>2]=c[p>>2];c[y+4>>2]=c[p+4>>2];c[y+8>>2]=c[p+8>>2];c[y+12>>2]=c[p+12>>2];c[y+16>>2]=c[p+16>>2];c[y+20>>2]=c[p+20>>2];c[y+24>>2]=c[p+24>>2];c[y+28>>2]=c[p+28>>2];c[x>>2]=c[j>>2];c[x+4>>2]=c[j+4>>2];c[x+8>>2]=c[j+8>>2];c[x+12>>2]=c[j+12>>2];c[x+16>>2]=c[j+16>>2];c[x+20>>2]=c[j+20>>2];c[x+24>>2]=c[j+24>>2];c[x+28>>2]=c[j+28>>2];Mc(y,x,136,-460954743,-2016278654);c[g>>2]=c[y>>2];c[g+4>>2]=c[y+4>>2];c[g+8>>2]=c[y+8>>2];c[g+12>>2]=c[y+12>>2];c[g+16>>2]=c[y+16>>2];c[g+20>>2]=c[y+20>>2];c[g+24>>2]=c[y+24>>2];c[g+28>>2]=c[y+28>>2];c[y>>2]=c[i>>2];c[y+4>>2]=c[i+4>>2];c[y+8>>2]=c[i+8>>2];c[y+12>>2]=c[i+12>>2];c[y+16>>2]=c[i+16>>2];c[y+20>>2]=c[i+20>>2];c[y+24>>2]=c[i+24>>2];c[y+28>>2]=c[i+28>>2];c[x>>2]=c[i>>2];c[x+4>>2]=c[i+4>>2];c[x+8>>2]=c[i+8>>2];c[x+12>>2]=c[i+12>>2];c[x+16>>2]=c[i+16>>2];c[x+20>>2]=c[i+20>>2];c[x+24>>2]=c[i+24>>2];c[x+28>>2]=c[i+28>>2];Mc(y,x,136,-460954743,-2016278654);c[z>>2]=c[y>>2];c[z+4>>2]=c[y+4>>2];c[z+8>>2]=c[y+8>>2];c[z+12>>2]=c[y+12>>2];c[z+16>>2]=c[y+16>>2];c[z+20>>2]=c[y+20>>2];c[z+24>>2]=c[y+24>>2];c[z+28>>2]=c[y+28>>2];c[x>>2]=c[j>>2];c[x+4>>2]=c[j+4>>2];c[x+8>>2]=c[j+8>>2];c[x+12>>2]=c[j+12>>2];c[x+16>>2]=c[j+16>>2];c[x+20>>2]=c[j+20>>2];c[x+24>>2]=c[j+24>>2];c[x+28>>2]=c[j+28>>2];Lc(z,x,136);c[A>>2]=c[z>>2];c[A+4>>2]=c[z+4>>2];c[A+8>>2]=c[z+8>>2];c[A+12>>2]=c[z+12>>2];c[A+16>>2]=c[z+16>>2];c[A+20>>2]=c[z+20>>2];c[A+24>>2]=c[z+24>>2];c[A+28>>2]=c[z+28>>2];c[y>>2]=c[h>>2];c[y+4>>2]=c[h+4>>2];c[y+8>>2]=c[h+8>>2];c[y+12>>2]=c[h+12>>2];c[y+16>>2]=c[h+16>>2];c[y+20>>2]=c[h+20>>2];c[y+24>>2]=c[h+24>>2];c[y+28>>2]=c[h+28>>2];c[x>>2]=c[h>>2];c[x+4>>2]=c[h+4>>2];c[x+8>>2]=c[h+8>>2];c[x+12>>2]=c[h+12>>2];c[x+16>>2]=c[h+16>>2];c[x+20>>2]=c[h+20>>2];c[x+24>>2]=c[h+24>>2];c[x+28>>2]=c[h+28>>2];Kc(y,x,136);c[z>>2]=c[y>>2];c[z+4>>2]=c[y+4>>2];c[z+8>>2]=c[y+8>>2];c[z+12>>2]=c[y+12>>2];c[z+16>>2]=c[y+16>>2];c[z+20>>2]=c[y+20>>2];c[z+24>>2]=c[y+24>>2];c[z+28>>2]=c[y+28>>2];Lc(A,z,136);c[f>>2]=c[A>>2];c[f+4>>2]=c[A+4>>2];c[f+8>>2]=c[A+8>>2];c[f+12>>2]=c[A+12>>2];c[f+16>>2]=c[A+16>>2];c[f+20>>2]=c[A+20>>2];c[f+24>>2]=c[A+24>>2];c[f+28>>2]=c[A+28>>2];c[a>>2]=c[f>>2];c[a+4>>2]=c[f+4>>2];c[a+8>>2]=c[f+8>>2];c[a+12>>2]=c[f+12>>2];c[a+16>>2]=c[f+16>>2];c[a+20>>2]=c[f+20>>2];c[a+24>>2]=c[f+24>>2];c[a+28>>2]=c[f+28>>2];c[A>>2]=c[i>>2];c[A+4>>2]=c[i+4>>2];c[A+8>>2]=c[i+8>>2];c[A+12>>2]=c[i+12>>2];c[A+16>>2]=c[i+16>>2];c[A+20>>2]=c[i+20>>2];c[A+24>>2]=c[i+24>>2];c[A+28>>2]=c[i+28>>2];c[y>>2]=c[h>>2];c[y+4>>2]=c[h+4>>2];c[y+8>>2]=c[h+8>>2];c[y+12>>2]=c[h+12>>2];c[y+16>>2]=c[h+16>>2];c[y+20>>2]=c[h+20>>2];c[y+24>>2]=c[h+24>>2];c[y+28>>2]=c[h+28>>2];c[x>>2]=c[f>>2];c[x+4>>2]=c[f+4>>2];c[x+8>>2]=c[f+8>>2];c[x+12>>2]=c[f+12>>2];c[x+16>>2]=c[f+16>>2];c[x+20>>2]=c[f+20>>2];c[x+24>>2]=c[f+24>>2];c[x+28>>2]=c[f+28>>2];Lc(y,x,136);c[z>>2]=c[y>>2];c[z+4>>2]=c[y+4>>2];c[z+8>>2]=c[y+8>>2];c[z+12>>2]=c[y+12>>2];c[z+16>>2]=c[y+16>>2];c[z+20>>2]=c[y+20>>2];c[z+24>>2]=c[y+24>>2];c[z+28>>2]=c[y+28>>2];Mc(A,z,136,-460954743,-2016278654);c[C>>2]=c[A>>2];c[C+4>>2]=c[A+4>>2];c[C+8>>2]=c[A+8>>2];c[C+12>>2]=c[A+12>>2];c[C+16>>2]=c[A+16>>2];c[C+20>>2]=c[A+20>>2];c[C+24>>2]=c[A+24>>2];c[C+28>>2]=c[A+28>>2];c[y>>2]=c[g>>2];c[y+4>>2]=c[g+4>>2];c[y+8>>2]=c[g+8>>2];c[y+12>>2]=c[g+12>>2];c[y+16>>2]=c[g+16>>2];c[y+20>>2]=c[g+20>>2];c[y+24>>2]=c[g+24>>2];c[y+28>>2]=c[g+28>>2];c[x>>2]=c[g>>2];c[x+4>>2]=c[g+4>>2];c[x+8>>2]=c[g+8>>2];c[x+12>>2]=c[g+12>>2];c[x+16>>2]=c[g+16>>2];c[x+20>>2]=c[g+20>>2];c[x+24>>2]=c[g+24>>2];c[x+28>>2]=c[g+28>>2];Kc(y,x,136);c[z>>2]=c[y>>2];c[z+4>>2]=c[y+4>>2];c[z+8>>2]=c[y+8>>2];c[z+12>>2]=c[y+12>>2];c[z+16>>2]=c[y+16>>2];c[z+20>>2]=c[y+20>>2];c[z+24>>2]=c[y+24>>2];c[z+28>>2]=c[y+28>>2];Lc(C,z,136);c[e>>2]=c[C>>2];c[e+4>>2]=c[C+4>>2];c[e+8>>2]=c[C+8>>2];c[e+12>>2]=c[C+12>>2];c[e+16>>2]=c[C+16>>2];c[e+20>>2]=c[C+20>>2];c[e+24>>2]=c[C+24>>2];c[e+28>>2]=c[C+28>>2];c[y>>2]=c[w>>2];c[y+4>>2]=c[w+4>>2];c[y+8>>2]=c[w+8>>2];c[y+12>>2]=c[w+12>>2];c[y+16>>2]=c[w+16>>2];c[y+20>>2]=c[w+20>>2];c[y+24>>2]=c[w+24>>2];c[y+28>>2]=c[w+28>>2];c[x>>2]=c[B>>2];c[x+4>>2]=c[B+4>>2];c[x+8>>2]=c[B+8>>2];c[x+12>>2]=c[B+12>>2];c[x+16>>2]=c[B+16>>2];c[x+20>>2]=c[B+20>>2];c[x+24>>2]=c[B+24>>2];c[x+28>>2]=c[B+28>>2];Kc(y,x,136);c[z>>2]=c[y>>2];c[z+4>>2]=c[y+4>>2];c[z+8>>2]=c[y+8>>2];c[z+12>>2]=c[y+12>>2];c[z+16>>2]=c[y+16>>2];c[z+20>>2]=c[y+20>>2];c[z+24>>2]=c[y+24>>2];c[z+28>>2]=c[y+28>>2];c[y>>2]=c[z>>2];c[y+4>>2]=c[z+4>>2];c[y+8>>2]=c[z+8>>2];c[y+12>>2]=c[z+12>>2];c[y+16>>2]=c[z+16>>2];c[y+20>>2]=c[z+20>>2];c[y+24>>2]=c[z+24>>2];c[y+28>>2]=c[z+28>>2];c[x>>2]=c[z>>2];c[x+4>>2]=c[z+4>>2];c[x+8>>2]=c[z+8>>2];c[x+12>>2]=c[z+12>>2];c[x+16>>2]=c[z+16>>2];c[x+20>>2]=c[z+20>>2];c[x+24>>2]=c[z+24>>2];c[x+28>>2]=c[z+28>>2];Mc(y,x,136,-460954743,-2016278654);c[A>>2]=c[y>>2];c[A+4>>2]=c[y+4>>2];c[A+8>>2]=c[y+8>>2];c[A+12>>2]=c[y+12>>2];c[A+16>>2]=c[y+16>>2];c[A+20>>2]=c[y+20>>2];c[A+24>>2]=c[y+24>>2];c[A+28>>2]=c[y+28>>2];c[x>>2]=c[v>>2];c[x+4>>2]=c[v+4>>2];c[x+8>>2]=c[v+8>>2];c[x+12>>2]=c[v+12>>2];c[x+16>>2]=c[v+16>>2];c[x+20>>2]=c[v+20>>2];c[x+24>>2]=c[v+24>>2];c[x+28>>2]=c[v+28>>2];Lc(A,x,136);c[C>>2]=c[A>>2];c[C+4>>2]=c[A+4>>2];c[C+8>>2]=c[A+8>>2];c[C+12>>2]=c[A+12>>2];c[C+16>>2]=c[A+16>>2];c[C+20>>2]=c[A+20>>2];c[C+24>>2]=c[A+24>>2];c[C+28>>2]=c[A+28>>2];c[x>>2]=c[u>>2];c[x+4>>2]=c[u+4>>2];c[x+8>>2]=c[u+8>>2];c[x+12>>2]=c[u+12>>2];c[x+16>>2]=c[u+16>>2];c[x+20>>2]=c[u+20>>2];c[x+24>>2]=c[u+24>>2];c[x+28>>2]=c[u+28>>2];Lc(C,x,136);c[D>>2]=c[C>>2];c[D+4>>2]=c[C+4>>2];c[D+8>>2]=c[C+8>>2];c[D+12>>2]=c[C+12>>2];c[D+16>>2]=c[C+16>>2];c[D+20>>2]=c[C+20>>2];c[D+24>>2]=c[C+24>>2];c[D+28>>2]=c[C+28>>2];c[x>>2]=c[n>>2];c[x+4>>2]=c[n+4>>2];c[x+8>>2]=c[n+8>>2];c[x+12>>2]=c[n+12>>2];c[x+16>>2]=c[n+16>>2];c[x+20>>2]=c[n+20>>2];c[x+24>>2]=c[n+24>>2];c[x+28>>2]=c[n+28>>2];Mc(D,x,136,-460954743,-2016278654);c[E>>2]=c[D>>2];c[E+4>>2]=c[D+4>>2];c[E+8>>2]=c[D+8>>2];c[E+12>>2]=c[D+12>>2];c[E+16>>2]=c[D+16>>2];c[E+20>>2]=c[D+20>>2];c[E+24>>2]=c[D+24>>2];c[E+28>>2]=c[D+28>>2];G=a+32|0;c[G>>2]=c[e>>2];c[G+4>>2]=c[e+4>>2];c[G+8>>2]=c[e+8>>2];c[G+12>>2]=c[e+12>>2];c[G+16>>2]=c[e+16>>2];c[G+20>>2]=c[e+20>>2];c[G+24>>2]=c[e+24>>2];c[G+28>>2]=c[e+28>>2];G=a+64|0;c[G>>2]=c[E>>2];c[G+4>>2]=c[E+4>>2];c[G+8>>2]=c[E+8>>2];c[G+12>>2]=c[E+12>>2];c[G+16>>2]=c[E+16>>2];c[G+20>>2]=c[E+20>>2];c[G+24>>2]=c[E+24>>2];c[G+28>>2]=c[E+28>>2];}l=F;return}function Ec(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,Y=0,$=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,oa=0,pa=0,qa=0,ra=0,sa=0,ta=0,ua=0,va=0,wa=0,xa=0,ya=0,Aa=0,Ba=0,Ca=0,Da=0,Ea=0,Fa=0,Ga=0,Ha=0,Ia=0,Ja=0,Ka=0,La=0,Ma=0,Na=0,Oa=0,Pa=0,Qa=0,Ra=0,Sa=0,Ta=0,Ua=0,Va=0,Wa=0,Xa=0,Ya=0,Za=0,_a=0,$a=0,ab=0,bb=0,cb=0,db=0,eb=0,fb=0,gb=0,hb=0,ib=0,jb=0,kb=0,lb=0,mb=0,nb=0,ob=0,pb=0,qb=0,rb=0,sb=0,tb=0,ub=0,vb=0,wb=0,xb=0,yb=0,zb=0,Ab=0,Bb=0,Cb=0,Db=0,Eb=0,Fb=0,Gb=0,Hb=0,Ib=0,Jb=0,Kb=0,Lb=0,Mb=0,Nb=0,Ob=0,Pb=0,Qb=0,Rb=0,Sb=0,Tb=0,Ub=0,Vb=0,Wb=0,_b=0,$b=0,ac=0,bc=0,cc=0,dc=0,ec=0,fc=0,gc=0,hc=0,ic=0,jc=0,kc=0,lc=0,mc=0,nc=0,oc=0,pc=0,qc=0,rc=0,sc=0,tc=0,uc=0,vc=0,wc=0,xc=0,yc=0,Bc=0,Cc=0,Dc=0,Ec=0,Fc=0,Ic=0,Jc=0,Kc=0,Lc=0,Mc=0,Nc=0,Oc=0,Pc=0,Qc=0,Rc=0,Sc=0,Tc=0,Uc=0,Vc=0,Wc=0,Xc=0,Yc=0,Zc=0,_c=0,$c=0,ad=0,bd=0,cd=0,dd=0,ed=0,fd=0,gd=0,hd=0,id=0,jd=0,kd=0,ld=0,md=0,nd=0,od=0,pd=0,qd=0,rd=0,sd=0,td=0,ud=0,vd=0,wd=0,xd=0,yd=0,zd=0,Ad=0,Bd=0,Cd=0,Dd=0,Ed=0,Fd=0,Gd=0,Hd=0,Id=0,Jd=0,Kd=0,Ld=0,Md=0,Nd=0,Od=0,Pd=0,Qd=0,Rd=0,Sd=0,Td=0,Ud=0,Vd=0,Wd=0,Xd=0,Yd=0,Zd=0,_d=0,$d=0,ae=0,be=0,ce=0;ce=l;l=l+12736|0;Xc=ce+12576|0;bd=ce+12504|0;fd=ce+12472|0;qd=ce+12440|0;sd=ce+12408|0;td=ce+12376|0;ud=ce+12344|0;Tc=ce+12312|0;vd=ce+12280|0;wd=ce+12248|0;xd=ce+12216|0;yd=ce+12184|0;zd=ce+12152|0;Ad=ce+12120|0;Cd=ce+12088|0;Hd=ce+12056|0;Id=ce+12024|0;Jd=ce+11992|0;Kd=ce+11960|0;Ld=ce+11928|0;Md=ce+11896|0;Nd=ce+11864|0;Od=ce+11832|0;Pd=ce+11800|0;Uc=ce+11768|0;Vc=ce+11736|0;Wc=ce+11704|0;Yc=ce+11672|0;Zc=ce+11640|0;_c=ce+11608|0;$c=ce+11576|0;ad=ce+11544|0;Qd=ce+11512|0;Rd=ce+11448|0;Sd=ce+11416|0;Td=ce+11352|0;Ud=ce+11288|0;Vd=ce+10904|0;Wd=ce+10872|0;Xd=ce+10808|0;Yd=ce+10776|0;Zd=ce+10712|0;_d=ce+10648|0;$d=ce+10264|0;cd=ce+10232|0;dd=ce+10168|0;ed=ce+10136|0;gd=ce+10072|0;hd=ce+10008|0;id=ce+9624|0;jd=ce+9592|0;kd=ce+9528|0;ld=ce+9496|0;md=ce+9432|0;nd=ce+9368|0;od=ce+8984|0;pd=ce+8600|0;rd=ce+8568|0;ae=ce+8184|0;Nb=ce+8152|0;Ob=ce+8120|0;Pb=ce+8088|0;Qb=ce+8056|0;Rb=ce+8024|0;Sb=ce+7992|0;Tb=ce+7960|0;Ub=ce+7928|0;Vb=ce+7896|0;Wb=ce+7864|0;_b=ce+7832|0;$b=ce+7800|0;ac=ce+7768|0;bc=ce+7736|0;cc=ce+7704|0;dc=ce+7672|0;ec=ce+7640|0;sc=ce+7608|0;tc=ce+7576|0;uc=ce+7544|0;vc=ce+7512|0;be=ce+7480|0;Ic=ce+7416|0;Jc=ce+7352|0;xc=ce+7288|0;yc=ce+7224|0;Kc=ce+7160|0;Bc=ce+7096|0;Cc=ce+7032|0;Dc=ce+6968|0;fc=ce+6904|0;gc=ce+6840|0;hc=ce+6776|0;ic=ce+6712|0;jc=ce+6648|0;kc=ce+6584|0;lc=ce+6520|0;mc=ce+6456|0;Ka=ce+6392|0;La=ce+6328|0;Ma=ce+6264|0;Na=ce+6200|0;Oa=ce+6136|0;Pa=ce+6072|0;Qa=ce+6008|0;Ra=ce+5944|0;Sa=ce+5880|0;Ta=ce+5816|0;Ua=ce+5752|0;Va=ce+5688|0;Wa=ce+5624|0;Xa=ce+5560|0;Ya=ce+5496|0;Za=ce+5432|0;_a=ce+5368|0;$a=ce+5304|0;ab=ce+5240|0;bb=ce+5176|0;cb=ce+5112|0;db=ce+5048|0;eb=ce+4984|0;fb=ce+4920|0;gb=ce+4856|0;hb=ce+4792|0;ib=ce+4728|0;jb=ce+4664|0;kb=ce+4600|0;lb=ce+4536|0;mb=ce+4472|0;nb=ce+4408|0;ob=ce+4344|0;pb=ce+4280|0;qb=ce+4216|0;rb=ce+4152|0;sb=ce+4088|0;tb=ce+4024|0;ub=ce+3960|0;vb=ce+3896|0;wb=ce+3832|0;xb=ce+3768|0;yb=ce+3704|0;zb=ce+3640|0;Ab=ce+3576|0;Bb=ce+3512|0;Cb=ce+3448|0;Db=ce+3384|0;Eb=ce+3320|0;Fb=ce+3256|0;Gb=ce+3192|0;Hb=ce+3128|0;Ib=ce+3064|0;nc=ce+3e3|0;oc=ce+2936|0;wc=ce+2872|0;pc=ce+2808|0;qc=ce+2744|0;rc=ce+2680|0;Rc=ce+2488|0;Lc=ce+2296|0;Ec=ce+2168|0;Mc=ce+2040|0;Fc=ce+1912|0;Jb=ce+1720|0;Kb=ce+1528|0;Lb=ce+1496|0;Sc=ce+12712|0;Nc=ce+1304|0;Bd=ce+1160|0;Dd=ce+776|0;Ed=ce+384|0;Fd=ce+256|0;Gd=ce+192|0;e=ce+128|0;f=ce;Ac(bd,b);zc(Xc,d);b=c[bd>>2]|0;Oc=e;Pc=bd+8|0;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));d=c[Xc>>2]|0;Oc=f;Pc=Xc+8|0;Qc=Oc+128|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));if((b|0)==0|(d|0)==0){be=a;c[be>>2]=-980480611;c[be+4>>2]=-748862579;be=a+8|0;c[be>>2]=-171504835;c[be+4>>2]=175696680;be=a+16|0;c[be>>2]=2021213740;c[be+4>>2]=1718526831;be=a+24|0;c[be>>2]=-1710760145;c[be+4>>2]=235567041;hk(a+32|0,0,352)|0;l=ce;return}Oc=Fd;Pc=f;Qc=Oc+128|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));Oc=Gd;Pc=e;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));Oc=Nc;Pc=f;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));Ia=Fd+64|0;Ga=Nc+64|0;Oc=Ga;Pc=Ia;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));Ha=Nc+128|0;b=Nc+128|0;c[b>>2]=-980480611;c[b+4>>2]=-748862579;b=Nc+136|0;c[b>>2]=-171504835;c[b+4>>2]=175696680;b=Nc+144|0;c[b>>2]=2021213740;c[b+4>>2]=1718526831;b=Nc+152|0;c[b>>2]=-1710760145;c[b+4>>2]=235567041;b=Nc+160|0;c[b>>2]=0;c[b+4>>2]=0;c[b+8>>2]=0;c[b+12>>2]=0;c[b+16>>2]=0;c[b+20>>2]=0;c[b+24>>2]=0;c[b+28>>2]=0;b=Xb(19584,8,Xc)|0;if(!b){c[Xc>>2]=0;Yb(Xc);}c[Sc>>2]=b;Ja=Sc+4|0;c[Ja>>2]=102;Mb=Sc+8|0;c[Mb>>2]=0;e=Lb;c[e>>2]=-1099547736;c[e+4>>2]=-1652985799;e=Lb+8|0;c[e>>2]=1;c[e+4>>2]=0;e=Lb+16|0;c[e>>2]=0;c[e+4>>2]=0;c[e+8>>2]=0;c[e+12>>2]=0;e=Kb+64|0;f=Kb+128|0;g=dc+8|0;h=dc+16|0;i=dc+24|0;j=Hb+32|0;k=bc+8|0;m=bc+16|0;o=bc+24|0;p=Ib+32|0;q=Ab+32|0;r=zb+32|0;s=Bb+32|0;t=yb+32|0;u=Cb+32|0;v=wb+8|0;w=wb+16|0;x=wb+24|0;z=wb+32|0;A=wb+40|0;B=wb+48|0;C=wb+56|0;D=sb+32|0;E=rb+32|0;F=tb+32|0;G=qb+32|0;H=ub+32|0;I=nb+32|0;J=mb+32|0;K=ob+32|0;L=jd+8|0;M=jd+16|0;N=jd+24|0;O=hd+8|0;P=hd+16|0;Q=hd+24|0;R=pb+32|0;S=ib+32|0;T=hb+32|0;U=jb+32|0;V=fb+32|0;W=eb+32|0;Y=gb+32|0;$=kb+32|0;ba=lb+32|0;ca=cb+32|0;da=bb+32|0;ea=db+32|0;fa=Xa+32|0;ga=Wa+32|0;ha=Ya+32|0;ia=Ra+32|0;ja=Qa+32|0;ka=Sa+32|0;la=Pa+32|0;ma=Ta+32|0;oa=Ua+32|0;pa=Va+32|0;qa=Ka+8|0;ra=Ka+16|0;sa=Ka+24|0;ta=Ka+32|0;ua=Ka+40|0;va=Ka+48|0;wa=Ka+56|0;xa=kc+32|0;ya=lc+32|0;Aa=hc+32|0;Ba=gc+32|0;Ca=ic+32|0;Da=fc+32|0;Ea=jc+32|0;b=0;Fa=256;a:while(1){Fa=Fa+-1|0;d=Lb+(Fa>>>6<<3)|0;Pc=c[d>>2]|0;d=c[d+4>>2]|0;Qc=nk(1,0,Fa&63|0)|0;d=(Pc&Qc|0)!=0|(d&y|0)!=0;do if(b){Oc=Gb;Pc=Nc;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));Oc=Fb;Pc=Ga;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));n=0;aa(15,Hb|0,Gb|0,Fb|0);Qc=n;n=0;if(Qc&1){b=82;break a};c[ec>>2]=c[Hb>>2];c[ec+4>>2]=c[Hb+4>>2];c[ec+8>>2]=c[Hb+8>>2];c[ec+12>>2]=c[Hb+12>>2];c[ec+16>>2]=c[Hb+16>>2];c[ec+20>>2]=c[Hb+20>>2];c[ec+24>>2]=c[Hb+24>>2];c[ec+28>>2]=c[Hb+28>>2];Qc=dc;c[Qc>>2]=1325794674;c[Qc+4>>2]=-2017531950;Qc=g;c[Qc>>2]=790391525;c[Qc+4>>2]=-788714787;Qc=h;c[Qc>>2]=-50507964;c[Qc+4>>2]=-1889569646;Qc=i;c[Qc>>2]=1033682860;c[Qc+4>>2]=523723546;n=0;X(1,ec|0,dc|0,136,-460954743,-2016278654);Qc=n;n=0;if(Qc&1){b=82;break a};c[Ib>>2]=c[ec>>2];c[Ib+4>>2]=c[ec+4>>2];c[Ib+8>>2]=c[ec+8>>2];c[Ib+12>>2]=c[ec+12>>2];c[Ib+16>>2]=c[ec+16>>2];c[Ib+20>>2]=c[ec+20>>2];c[Ib+24>>2]=c[ec+24>>2];c[Ib+28>>2]=c[ec+28>>2];c[cc>>2]=c[j>>2];c[cc+4>>2]=c[j+4>>2];c[cc+8>>2]=c[j+8>>2];c[cc+12>>2]=c[j+12>>2];c[cc+16>>2]=c[j+16>>2];c[cc+20>>2]=c[j+20>>2];c[cc+24>>2]=c[j+24>>2];c[cc+28>>2]=c[j+28>>2];Qc=bc;c[Qc>>2]=1325794674;c[Qc+4>>2]=-2017531950;Qc=k;c[Qc>>2]=790391525;c[Qc+4>>2]=-788714787;Qc=m;c[Qc>>2]=-50507964;c[Qc+4>>2]=-1889569646;Qc=o;c[Qc>>2]=1033682860;c[Qc+4>>2]=523723546;n=0;X(1,cc|0,bc|0,136,-460954743,-2016278654);Qc=n;n=0;if(Qc&1){b=82;break a};c[be>>2]=c[cc>>2];c[be+4>>2]=c[cc+4>>2];c[be+8>>2]=c[cc+8>>2];c[be+12>>2]=c[cc+12>>2];c[be+16>>2]=c[cc+16>>2];c[be+20>>2]=c[cc+20>>2];c[be+24>>2]=c[cc+24>>2];c[be+28>>2]=c[cc+28>>2];c[p>>2]=c[be>>2];c[p+4>>2]=c[be+4>>2];c[p+8>>2]=c[be+8>>2];c[p+12>>2]=c[be+12>>2];c[p+16>>2]=c[be+16>>2];c[p+20>>2]=c[be+20>>2];c[p+24>>2]=c[be+24>>2];c[p+28>>2]=c[be+28>>2];n=0;_(17,Eb|0,Ga|0);Qc=n;n=0;if(Qc&1){b=82;break a}n=0;_(17,Db|0,Ha|0);Qc=n;n=0;if(Qc&1){b=82;break a}Oc=Ab;Pc=Db;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));Oc=zb;Pc=Db;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));c[ac>>2]=c[Ab>>2];c[ac+4>>2]=c[Ab+4>>2];c[ac+8>>2]=c[Ab+8>>2];c[ac+12>>2]=c[Ab+12>>2];c[ac+16>>2]=c[Ab+16>>2];c[ac+20>>2]=c[Ab+20>>2];c[ac+24>>2]=c[Ab+24>>2];c[ac+28>>2]=c[Ab+28>>2];c[$b>>2]=c[Db>>2];c[$b+4>>2]=c[Db+4>>2];c[$b+8>>2]=c[Db+8>>2];c[$b+12>>2]=c[Db+12>>2];c[$b+16>>2]=c[Db+16>>2];c[$b+20>>2]=c[Db+20>>2];c[$b+24>>2]=c[Db+24>>2];c[$b+28>>2]=c[Db+28>>2];n=0;aa(16,ac|0,$b|0,136);Qc=n;n=0;if(Qc&1){b=82;break a};c[Bb>>2]=c[ac>>2];c[Bb+4>>2]=c[ac+4>>2];c[Bb+8>>2]=c[ac+8>>2];c[Bb+12>>2]=c[ac+12>>2];c[Bb+16>>2]=c[ac+16>>2];c[Bb+20>>2]=c[ac+20>>2];c[Bb+24>>2]=c[ac+24>>2];c[Bb+28>>2]=c[ac+28>>2];c[_b>>2]=c[q>>2];c[_b+4>>2]=c[q+4>>2];c[_b+8>>2]=c[q+8>>2];c[_b+12>>2]=c[q+12>>2];c[_b+16>>2]=c[q+16>>2];c[_b+20>>2]=c[q+20>>2];c[_b+24>>2]=c[q+24>>2];c[_b+28>>2]=c[q+28>>2];c[Wb>>2]=c[r>>2];c[Wb+4>>2]=c[r+4>>2];c[Wb+8>>2]=c[r+8>>2];c[Wb+12>>2]=c[r+12>>2];c[Wb+16>>2]=c[r+16>>2];c[Wb+20>>2]=c[r+20>>2];c[Wb+24>>2]=c[r+24>>2];c[Wb+28>>2]=c[r+28>>2];n=0;aa(16,_b|0,Wb|0,136);Qc=n;n=0;if(Qc&1){b=82;break a};c[be>>2]=c[_b>>2];c[be+4>>2]=c[_b+4>>2];c[be+8>>2]=c[_b+8>>2];c[be+12>>2]=c[_b+12>>2];c[be+16>>2]=c[_b+16>>2];c[be+20>>2]=c[_b+20>>2];c[be+24>>2]=c[_b+24>>2];c[be+28>>2]=c[_b+28>>2];c[s>>2]=c[be>>2];c[s+4>>2]=c[be+4>>2];c[s+8>>2]=c[be+8>>2];c[s+12>>2]=c[be+12>>2];c[s+16>>2]=c[be+16>>2];c[s+20>>2]=c[be+20>>2];c[s+24>>2]=c[be+24>>2];c[s+28>>2]=c[be+28>>2];Oc=yb;Pc=Db;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));c[Vb>>2]=c[Bb>>2];c[Vb+4>>2]=c[Bb+4>>2];c[Vb+8>>2]=c[Bb+8>>2];c[Vb+12>>2]=c[Bb+12>>2];c[Vb+16>>2]=c[Bb+16>>2];c[Vb+20>>2]=c[Bb+20>>2];c[Vb+24>>2]=c[Bb+24>>2];c[Vb+28>>2]=c[Bb+28>>2];c[Ub>>2]=c[Db>>2];c[Ub+4>>2]=c[Db+4>>2];c[Ub+8>>2]=c[Db+8>>2];c[Ub+12>>2]=c[Db+12>>2];c[Ub+16>>2]=c[Db+16>>2];c[Ub+20>>2]=c[Db+20>>2];c[Ub+24>>2]=c[Db+24>>2];c[Ub+28>>2]=c[Db+28>>2];n=0;aa(16,Vb|0,Ub|0,136);Qc=n;n=0;if(Qc&1){b=82;break a};c[Cb>>2]=c[Vb>>2];c[Cb+4>>2]=c[Vb+4>>2];c[Cb+8>>2]=c[Vb+8>>2];c[Cb+12>>2]=c[Vb+12>>2];c[Cb+16>>2]=c[Vb+16>>2];c[Cb+20>>2]=c[Vb+20>>2];c[Cb+24>>2]=c[Vb+24>>2];c[Cb+28>>2]=c[Vb+28>>2];c[Tb>>2]=c[s>>2];c[Tb+4>>2]=c[s+4>>2];c[Tb+8>>2]=c[s+8>>2];c[Tb+12>>2]=c[s+12>>2];c[Tb+16>>2]=c[s+16>>2];c[Tb+20>>2]=c[s+20>>2];c[Tb+24>>2]=c[s+24>>2];c[Tb+28>>2]=c[s+28>>2];c[Sb>>2]=c[t>>2];c[Sb+4>>2]=c[t+4>>2];c[Sb+8>>2]=c[t+8>>2];c[Sb+12>>2]=c[t+12>>2];c[Sb+16>>2]=c[t+16>>2];c[Sb+20>>2]=c[t+20>>2];c[Sb+24>>2]=c[t+24>>2];c[Sb+28>>2]=c[t+28>>2];n=0;aa(16,Tb|0,Sb|0,136);Qc=n;n=0;if(Qc&1){b=82;break a};c[be>>2]=c[Tb>>2];c[be+4>>2]=c[Tb+4>>2];c[be+8>>2]=c[Tb+8>>2];c[be+12>>2]=c[Tb+12>>2];c[be+16>>2]=c[Tb+16>>2];c[be+20>>2]=c[Tb+20>>2];c[be+24>>2]=c[Tb+24>>2];c[be+28>>2]=c[Tb+28>>2];c[u>>2]=c[be>>2];c[u+4>>2]=c[be+4>>2];c[u+8>>2]=c[be+8>>2];c[u+12>>2]=c[be+12>>2];c[u+16>>2]=c[be+16>>2];c[u+20>>2]=c[be+20>>2];c[u+24>>2]=c[be+24>>2];c[u+28>>2]=c[be+28>>2];Oc=wb;c[Oc>>2]=2008548008;c[Oc+4>>2]=1006188771;Oc=v;c[Oc>>2]=909333341;c[Oc+4>>2]=34282279;Oc=w;c[Oc>>2]=1232425568;c[Oc+4>>2]=649588208;Oc=x;c[Oc>>2]=1132767341;c[Oc+4>>2]=622118450;Oc=z;c[Oc>>2]=-774045849;c[Oc+4>>2]=954723532;Oc=A;c[Oc>>2]=-1815212738;c[Oc+4>>2]=1710273405;Oc=B;c[Oc>>2]=581697706;c[Oc+4>>2]=-683028259;Oc=C;c[Oc>>2]=1248365901;c[Oc+4>>2]=21084622;Oc=vb;Pc=Cb;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));n=0;aa(15,xb|0,wb|0,vb|0);Qc=n;n=0;if(Qc&1){b=82;break a}Oc=sb;Pc=xb;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));Oc=rb;Pc=xb;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));c[Rb>>2]=c[sb>>2];c[Rb+4>>2]=c[sb+4>>2];c[Rb+8>>2]=c[sb+8>>2];c[Rb+12>>2]=c[sb+12>>2];c[Rb+16>>2]=c[sb+16>>2];c[Rb+20>>2]=c[sb+20>>2];c[Rb+24>>2]=c[sb+24>>2];c[Rb+28>>2]=c[sb+28>>2];c[Qb>>2]=c[xb>>2];c[Qb+4>>2]=c[xb+4>>2];c[Qb+8>>2]=c[xb+8>>2];c[Qb+12>>2]=c[xb+12>>2];c[Qb+16>>2]=c[xb+16>>2];c[Qb+20>>2]=c[xb+20>>2];c[Qb+24>>2]=c[xb+24>>2];c[Qb+28>>2]=c[xb+28>>2];n=0;aa(16,Rb|0,Qb|0,136);Qc=n;n=0;if(Qc&1){b=82;break a};c[tb>>2]=c[Rb>>2];c[tb+4>>2]=c[Rb+4>>2];c[tb+8>>2]=c[Rb+8>>2];c[tb+12>>2]=c[Rb+12>>2];c[tb+16>>2]=c[Rb+16>>2];c[tb+20>>2]=c[Rb+20>>2];c[tb+24>>2]=c[Rb+24>>2];c[tb+28>>2]=c[Rb+28>>2];c[Pb>>2]=c[D>>2];c[Pb+4>>2]=c[D+4>>2];c[Pb+8>>2]=c[D+8>>2];c[Pb+12>>2]=c[D+12>>2];c[Pb+16>>2]=c[D+16>>2];c[Pb+20>>2]=c[D+20>>2];c[Pb+24>>2]=c[D+24>>2];c[Pb+28>>2]=c[D+28>>2];c[Ob>>2]=c[E>>2];c[Ob+4>>2]=c[E+4>>2];c[Ob+8>>2]=c[E+8>>2];c[Ob+12>>2]=c[E+12>>2];c[Ob+16>>2]=c[E+16>>2];c[Ob+20>>2]=c[E+20>>2];c[Ob+24>>2]=c[E+24>>2];c[Ob+28>>2]=c[E+28>>2];n=0;aa(16,Pb|0,Ob|0,136);Qc=n;n=0;if(Qc&1){b=82;break a};c[be>>2]=c[Pb>>2];c[be+4>>2]=c[Pb+4>>2];c[be+8>>2]=c[Pb+8>>2];c[be+12>>2]=c[Pb+12>>2];c[be+16>>2]=c[Pb+16>>2];c[be+20>>2]=c[Pb+20>>2];c[be+24>>2]=c[Pb+24>>2];c[be+28>>2]=c[Pb+28>>2];c[F>>2]=c[be>>2];c[F+4>>2]=c[be+4>>2];c[F+8>>2]=c[be+8>>2];c[F+12>>2]=c[be+12>>2];c[F+16>>2]=c[be+16>>2];c[F+20>>2]=c[be+20>>2];c[F+24>>2]=c[be+24>>2];c[F+28>>2]=c[be+28>>2];Oc=qb;Pc=xb;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));c[Nb>>2]=c[tb>>2];c[Nb+4>>2]=c[tb+4>>2];c[Nb+8>>2]=c[tb+8>>2];c[Nb+12>>2]=c[tb+12>>2];c[Nb+16>>2]=c[tb+16>>2];c[Nb+20>>2]=c[tb+20>>2];c[Nb+24>>2]=c[tb+24>>2];c[Nb+28>>2]=c[tb+28>>2];c[ae>>2]=c[xb>>2];c[ae+4>>2]=c[xb+4>>2];c[ae+8>>2]=c[xb+8>>2];c[ae+12>>2]=c[xb+12>>2];c[ae+16>>2]=c[xb+16>>2];c[ae+20>>2]=c[xb+20>>2];c[ae+24>>2]=c[xb+24>>2];c[ae+28>>2]=c[xb+28>>2];n=0;aa(16,Nb|0,ae|0,136);Qc=n;n=0;if(Qc&1){b=82;break a};c[ub>>2]=c[Nb>>2];c[ub+4>>2]=c[Nb+4>>2];c[ub+8>>2]=c[Nb+8>>2];c[ub+12>>2]=c[Nb+12>>2];c[ub+16>>2]=c[Nb+16>>2];c[ub+20>>2]=c[Nb+20>>2];c[ub+24>>2]=c[Nb+24>>2];c[ub+28>>2]=c[Nb+28>>2];c[rd>>2]=c[F>>2];c[rd+4>>2]=c[F+4>>2];c[rd+8>>2]=c[F+8>>2];c[rd+12>>2]=c[F+12>>2];c[rd+16>>2]=c[F+16>>2];c[rd+20>>2]=c[F+20>>2];c[rd+24>>2]=c[F+24>>2];c[rd+28>>2]=c[F+28>>2];c[pd>>2]=c[G>>2];c[pd+4>>2]=c[G+4>>2];c[pd+8>>2]=c[G+8>>2];c[pd+12>>2]=c[G+12>>2];c[pd+16>>2]=c[G+16>>2];c[pd+20>>2]=c[G+20>>2];c[pd+24>>2]=c[G+24>>2];c[pd+28>>2]=c[G+28>>2];n=0;aa(16,rd|0,pd|0,136);Qc=n;n=0;if(Qc&1){b=82;break a};c[be>>2]=c[rd>>2];c[be+4>>2]=c[rd+4>>2];c[be+8>>2]=c[rd+8>>2];c[be+12>>2]=c[rd+12>>2];c[be+16>>2]=c[rd+16>>2];c[be+20>>2]=c[rd+20>>2];c[be+24>>2]=c[rd+24>>2];c[be+28>>2]=c[rd+28>>2];c[H>>2]=c[be>>2];c[H+4>>2]=c[be+4>>2];c[H+8>>2]=c[be+8>>2];c[H+12>>2]=c[be+12>>2];c[H+16>>2]=c[be+16>>2];c[H+20>>2]=c[be+20>>2];c[H+24>>2]=c[be+24>>2];c[H+28>>2]=c[be+28>>2];Oc=nb;Pc=Eb;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));Oc=mb;Pc=ub;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));c[od>>2]=c[Eb>>2];c[od+4>>2]=c[Eb+4>>2];c[od+8>>2]=c[Eb+8>>2];c[od+12>>2]=c[Eb+12>>2];c[od+16>>2]=c[Eb+16>>2];c[od+20>>2]=c[Eb+20>>2];c[od+24>>2]=c[Eb+24>>2];c[od+28>>2]=c[Eb+28>>2];c[nd>>2]=c[ub>>2];c[nd+4>>2]=c[ub+4>>2];c[nd+8>>2]=c[ub+8>>2];c[nd+12>>2]=c[ub+12>>2];c[nd+16>>2]=c[ub+16>>2];c[nd+20>>2]=c[ub+20>>2];c[nd+24>>2]=c[ub+24>>2];c[nd+28>>2]=c[ub+28>>2];n=0;aa(16,od|0,nd|0,136);Qc=n;n=0;if(Qc&1){b=82;break a};c[ob>>2]=c[od>>2];c[ob+4>>2]=c[od+4>>2];c[ob+8>>2]=c[od+8>>2];c[ob+12>>2]=c[od+12>>2];c[ob+16>>2]=c[od+16>>2];c[ob+20>>2]=c[od+20>>2];c[ob+24>>2]=c[od+24>>2];c[ob+28>>2]=c[od+28>>2];c[md>>2]=c[I>>2];c[md+4>>2]=c[I+4>>2];c[md+8>>2]=c[I+8>>2];c[md+12>>2]=c[I+12>>2];c[md+16>>2]=c[I+16>>2];c[md+20>>2]=c[I+20>>2];c[md+24>>2]=c[I+24>>2];c[md+28>>2]=c[I+28>>2];c[ld>>2]=c[J>>2];c[ld+4>>2]=c[J+4>>2];c[ld+8>>2]=c[J+8>>2];c[ld+12>>2]=c[J+12>>2];c[ld+16>>2]=c[J+16>>2];c[ld+20>>2]=c[J+20>>2];c[ld+24>>2]=c[J+24>>2];c[ld+28>>2]=c[J+28>>2];n=0;aa(16,md|0,ld|0,136);Qc=n;n=0;if(Qc&1){b=82;break a};c[be>>2]=c[md>>2];c[be+4>>2]=c[md+4>>2];c[be+8>>2]=c[md+8>>2];c[be+12>>2]=c[md+12>>2];c[be+16>>2]=c[md+16>>2];c[be+20>>2]=c[md+20>>2];c[be+24>>2]=c[md+24>>2];c[be+28>>2]=c[md+28>>2];c[K>>2]=c[be>>2];c[K+4>>2]=c[be+4>>2];c[K+8>>2]=c[be+8>>2];c[K+12>>2]=c[be+12>>2];c[K+16>>2]=c[be+16>>2];c[K+20>>2]=c[be+20>>2];c[K+24>>2]=c[be+24>>2];c[K+28>>2]=c[be+28>>2];c[kd>>2]=c[ob>>2];c[kd+4>>2]=c[ob+4>>2];c[kd+8>>2]=c[ob+8>>2];c[kd+12>>2]=c[ob+12>>2];c[kd+16>>2]=c[ob+16>>2];c[kd+20>>2]=c[ob+20>>2];c[kd+24>>2]=c[ob+24>>2];c[kd+28>>2]=c[ob+28>>2];Qc=jd;c[Qc>>2]=1325794674;c[Qc+4>>2]=-2017531950;Qc=L;c[Qc>>2]=790391525;c[Qc+4>>2]=-788714787;Qc=M;c[Qc>>2]=-50507964;c[Qc+4>>2]=-1889569646;Qc=N;c[Qc>>2]=1033682860;c[Qc+4>>2]=523723546;n=0;X(1,kd|0,jd|0,136,-460954743,-2016278654);Qc=n;n=0;if(Qc&1){b=82;break a};c[pb>>2]=c[kd>>2];c[pb+4>>2]=c[kd+4>>2];c[pb+8>>2]=c[kd+8>>2];c[pb+12>>2]=c[kd+12>>2];c[pb+16>>2]=c[kd+16>>2];c[pb+20>>2]=c[kd+20>>2];c[pb+24>>2]=c[kd+24>>2];c[pb+28>>2]=c[kd+28>>2];c[id>>2]=c[K>>2];c[id+4>>2]=c[K+4>>2];c[id+8>>2]=c[K+8>>2];c[id+12>>2]=c[K+12>>2];c[id+16>>2]=c[K+16>>2];c[id+20>>2]=c[K+20>>2];c[id+24>>2]=c[K+24>>2];c[id+28>>2]=c[K+28>>2];Qc=hd;c[Qc>>2]=1325794674;c[Qc+4>>2]=-2017531950;Qc=O;c[Qc>>2]=790391525;c[Qc+4>>2]=-788714787;Qc=P;c[Qc>>2]=-50507964;c[Qc+4>>2]=-1889569646;Qc=Q;c[Qc>>2]=1033682860;c[Qc+4>>2]=523723546;n=0;X(1,id|0,hd|0,136,-460954743,-2016278654);Qc=n;n=0;if(Qc&1){b=82;break a};c[be>>2]=c[id>>2];c[be+4>>2]=c[id+4>>2];c[be+8>>2]=c[id+8>>2];c[be+12>>2]=c[id+12>>2];c[be+16>>2]=c[id+16>>2];c[be+20>>2]=c[id+20>>2];c[be+24>>2]=c[id+24>>2];c[be+28>>2]=c[id+28>>2];c[R>>2]=c[be>>2];c[R+4>>2]=c[be+4>>2];c[R+8>>2]=c[be+8>>2];c[R+12>>2]=c[be+12>>2];c[R+16>>2]=c[be+16>>2];c[R+20>>2]=c[be+20>>2];c[R+24>>2]=c[be+24>>2];c[R+28>>2]=c[be+28>>2];Oc=ib;Pc=Ga;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));Oc=hb;Pc=Ha;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));c[gd>>2]=c[Ga>>2];c[gd+4>>2]=c[Ga+4>>2];c[gd+8>>2]=c[Ga+8>>2];c[gd+12>>2]=c[Ga+12>>2];c[gd+16>>2]=c[Ga+16>>2];c[gd+20>>2]=c[Ga+20>>2];c[gd+24>>2]=c[Ga+24>>2];c[gd+28>>2]=c[Ga+28>>2];c[ed>>2]=c[Ha>>2];c[ed+4>>2]=c[Ha+4>>2];c[ed+8>>2]=c[Ha+8>>2];c[ed+12>>2]=c[Ha+12>>2];c[ed+16>>2]=c[Ha+16>>2];c[ed+20>>2]=c[Ha+20>>2];c[ed+24>>2]=c[Ha+24>>2];c[ed+28>>2]=c[Ha+28>>2];n=0;aa(16,gd|0,ed|0,136);Qc=n;n=0;if(Qc&1){b=82;break a};c[jb>>2]=c[gd>>2];c[jb+4>>2]=c[gd+4>>2];c[jb+8>>2]=c[gd+8>>2];c[jb+12>>2]=c[gd+12>>2];c[jb+16>>2]=c[gd+16>>2];c[jb+20>>2]=c[gd+20>>2];c[jb+24>>2]=c[gd+24>>2];c[jb+28>>2]=c[gd+28>>2];c[dd>>2]=c[S>>2];c[dd+4>>2]=c[S+4>>2];c[dd+8>>2]=c[S+8>>2];c[dd+12>>2]=c[S+12>>2];c[dd+16>>2]=c[S+16>>2];c[dd+20>>2]=c[S+20>>2];c[dd+24>>2]=c[S+24>>2];c[dd+28>>2]=c[S+28>>2];c[cd>>2]=c[T>>2];c[cd+4>>2]=c[T+4>>2];c[cd+8>>2]=c[T+8>>2];c[cd+12>>2]=c[T+12>>2];c[cd+16>>2]=c[T+16>>2];c[cd+20>>2]=c[T+20>>2];c[cd+24>>2]=c[T+24>>2];c[cd+28>>2]=c[T+28>>2];n=0;aa(16,dd|0,cd|0,136);Qc=n;n=0;if(Qc&1){b=82;break a};c[be>>2]=c[dd>>2];c[be+4>>2]=c[dd+4>>2];c[be+8>>2]=c[dd+8>>2];c[be+12>>2]=c[dd+12>>2];c[be+16>>2]=c[dd+16>>2];c[be+20>>2]=c[dd+20>>2];c[be+24>>2]=c[dd+24>>2];c[be+28>>2]=c[dd+28>>2];c[U>>2]=c[be>>2];c[U+4>>2]=c[be+4>>2];c[U+8>>2]=c[be+8>>2];c[U+12>>2]=c[be+12>>2];c[U+16>>2]=c[be+16>>2];c[U+20>>2]=c[be+20>>2];c[U+24>>2]=c[be+24>>2];c[U+28>>2]=c[be+28>>2];n=0;_(17,kb|0,jb|0);Qc=n;n=0;if(Qc&1){b=82;break a}Oc=fb;Pc=Eb;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));Oc=eb;Pc=Db;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));c[$d>>2]=c[Eb>>2];c[$d+4>>2]=c[Eb+4>>2];c[$d+8>>2]=c[Eb+8>>2];c[$d+12>>2]=c[Eb+12>>2];c[$d+16>>2]=c[Eb+16>>2];c[$d+20>>2]=c[Eb+20>>2];c[$d+24>>2]=c[Eb+24>>2];c[$d+28>>2]=c[Eb+28>>2];c[_d>>2]=c[Db>>2];c[_d+4>>2]=c[Db+4>>2];c[_d+8>>2]=c[Db+8>>2];c[_d+12>>2]=c[Db+12>>2];c[_d+16>>2]=c[Db+16>>2];c[_d+20>>2]=c[Db+20>>2];c[_d+24>>2]=c[Db+24>>2];c[_d+28>>2]=c[Db+28>>2];n=0;aa(16,$d|0,_d|0,136);Qc=n;n=0;if(Qc&1){b=82;break a};c[gb>>2]=c[$d>>2];c[gb+4>>2]=c[$d+4>>2];c[gb+8>>2]=c[$d+8>>2];c[gb+12>>2]=c[$d+12>>2];c[gb+16>>2]=c[$d+16>>2];c[gb+20>>2]=c[$d+20>>2];c[gb+24>>2]=c[$d+24>>2];c[gb+28>>2]=c[$d+28>>2];c[Zd>>2]=c[V>>2];c[Zd+4>>2]=c[V+4>>2];c[Zd+8>>2]=c[V+8>>2];c[Zd+12>>2]=c[V+12>>2];c[Zd+16>>2]=c[V+16>>2];c[Zd+20>>2]=c[V+20>>2];c[Zd+24>>2]=c[V+24>>2];c[Zd+28>>2]=c[V+28>>2];c[Yd>>2]=c[W>>2];c[Yd+4>>2]=c[W+4>>2];c[Yd+8>>2]=c[W+8>>2];c[Yd+12>>2]=c[W+12>>2];c[Yd+16>>2]=c[W+16>>2];c[Yd+20>>2]=c[W+20>>2];c[Yd+24>>2]=c[W+24>>2];c[Yd+28>>2]=c[W+28>>2];n=0;aa(16,Zd|0,Yd|0,136);Qc=n;n=0;if(Qc&1){b=82;break a};c[be>>2]=c[Zd>>2];c[be+4>>2]=c[Zd+4>>2];c[be+8>>2]=c[Zd+8>>2];c[be+12>>2]=c[Zd+12>>2];c[be+16>>2]=c[Zd+16>>2];c[be+20>>2]=c[Zd+20>>2];c[be+24>>2]=c[Zd+24>>2];c[be+28>>2]=c[Zd+28>>2];c[Y>>2]=c[be>>2];c[Y+4>>2]=c[be+4>>2];c[Y+8>>2]=c[be+8>>2];c[Y+12>>2]=c[be+12>>2];c[Y+16>>2]=c[be+16>>2];c[Y+20>>2]=c[be+20>>2];c[Y+24>>2]=c[be+24>>2];c[Y+28>>2]=c[be+28>>2];c[Xd>>2]=c[kb>>2];c[Xd+4>>2]=c[kb+4>>2];c[Xd+8>>2]=c[kb+8>>2];c[Xd+12>>2]=c[kb+12>>2];c[Xd+16>>2]=c[kb+16>>2];c[Xd+20>>2]=c[kb+20>>2];c[Xd+24>>2]=c[kb+24>>2];c[Xd+28>>2]=c[kb+28>>2];c[Wd>>2]=c[gb>>2];c[Wd+4>>2]=c[gb+4>>2];c[Wd+8>>2]=c[gb+8>>2];c[Wd+12>>2]=c[gb+12>>2];c[Wd+16>>2]=c[gb+16>>2];c[Wd+20>>2]=c[gb+20>>2];c[Wd+24>>2]=c[gb+24>>2];c[Wd+28>>2]=c[gb+28>>2];n=0;aa(17,Xd|0,Wd|0,136);Qc=n;n=0;if(Qc&1){b=82;break a};c[lb>>2]=c[Xd>>2];c[lb+4>>2]=c[Xd+4>>2];c[lb+8>>2]=c[Xd+8>>2];c[lb+12>>2]=c[Xd+12>>2];c[lb+16>>2]=c[Xd+16>>2];c[lb+20>>2]=c[Xd+20>>2];c[lb+24>>2]=c[Xd+24>>2];c[lb+28>>2]=c[Xd+28>>2];c[Vd>>2]=c[$>>2];c[Vd+4>>2]=c[$+4>>2];c[Vd+8>>2]=c[$+8>>2];c[Vd+12>>2]=c[$+12>>2];c[Vd+16>>2]=c[$+16>>2];c[Vd+20>>2]=c[$+20>>2];c[Vd+24>>2]=c[$+24>>2];c[Vd+28>>2]=c[$+28>>2];c[Ud>>2]=c[Y>>2];c[Ud+4>>2]=c[Y+4>>2];c[Ud+8>>2]=c[Y+8>>2];c[Ud+12>>2]=c[Y+12>>2];c[Ud+16>>2]=c[Y+16>>2];c[Ud+20>>2]=c[Y+20>>2];c[Ud+24>>2]=c[Y+24>>2];c[Ud+28>>2]=c[Y+28>>2];n=0;aa(17,Vd|0,Ud|0,136);Qc=n;n=0;if(Qc&1){b=82;break a};c[be>>2]=c[Vd>>2];c[be+4>>2]=c[Vd+4>>2];c[be+8>>2]=c[Vd+8>>2];c[be+12>>2]=c[Vd+12>>2];c[be+16>>2]=c[Vd+16>>2];c[be+20>>2]=c[Vd+20>>2];c[be+24>>2]=c[Vd+24>>2];c[be+28>>2]=c[Vd+28>>2];c[ba>>2]=c[be>>2];c[ba+4>>2]=c[be+4>>2];c[ba+8>>2]=c[be+8>>2];c[ba+12>>2]=c[be+12>>2];c[ba+16>>2]=c[be+16>>2];c[ba+20>>2]=c[be+20>>2];c[ba+24>>2]=c[be+24>>2];c[ba+28>>2]=c[be+28>>2];Oc=cb;Pc=xb;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));Oc=bb;Pc=Eb;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));c[Td>>2]=c[xb>>2];c[Td+4>>2]=c[xb+4>>2];c[Td+8>>2]=c[xb+8>>2];c[Td+12>>2]=c[xb+12>>2];c[Td+16>>2]=c[xb+16>>2];c[Td+20>>2]=c[xb+20>>2];c[Td+24>>2]=c[xb+24>>2];c[Td+28>>2]=c[xb+28>>2];c[Sd>>2]=c[Eb>>2];c[Sd+4>>2]=c[Eb+4>>2];c[Sd+8>>2]=c[Eb+8>>2];c[Sd+12>>2]=c[Eb+12>>2];c[Sd+16>>2]=c[Eb+16>>2];c[Sd+20>>2]=c[Eb+20>>2];c[Sd+24>>2]=c[Eb+24>>2];c[Sd+28>>2]=c[Eb+28>>2];n=0;aa(17,Td|0,Sd|0,136);Qc=n;n=0;if(Qc&1){b=82;break a};c[db>>2]=c[Td>>2];c[db+4>>2]=c[Td+4>>2];c[db+8>>2]=c[Td+8>>2];c[db+12>>2]=c[Td+12>>2];c[db+16>>2]=c[Td+16>>2];c[db+20>>2]=c[Td+20>>2];c[db+24>>2]=c[Td+24>>2];c[db+28>>2]=c[Td+28>>2];c[Rd>>2]=c[ca>>2];c[Rd+4>>2]=c[ca+4>>2];c[Rd+8>>2]=c[ca+8>>2];c[Rd+12>>2]=c[ca+12>>2];c[Rd+16>>2]=c[ca+16>>2];c[Rd+20>>2]=c[ca+20>>2];c[Rd+24>>2]=c[ca+24>>2];c[Rd+28>>2]=c[ca+28>>2];c[Qd>>2]=c[da>>2];c[Qd+4>>2]=c[da+4>>2];c[Qd+8>>2]=c[da+8>>2];c[Qd+12>>2]=c[da+12>>2];c[Qd+16>>2]=c[da+16>>2];c[Qd+20>>2]=c[da+20>>2];c[Qd+24>>2]=c[da+24>>2];c[Qd+28>>2]=c[da+28>>2];n=0;aa(17,Rd|0,Qd|0,136);Qc=n;n=0;if(Qc&1){b=82;break a};c[be>>2]=c[Rd>>2];c[be+4>>2]=c[Rd+4>>2];c[be+8>>2]=c[Rd+8>>2];c[be+12>>2]=c[Rd+12>>2];c[be+16>>2]=c[Rd+16>>2];c[be+20>>2]=c[Rd+20>>2];c[be+24>>2]=c[Rd+24>>2];c[be+28>>2]=c[Rd+28>>2];c[ea>>2]=c[be>>2];c[ea+4>>2]=c[be+4>>2];c[ea+8>>2]=c[be+8>>2];c[ea+12>>2]=c[be+12>>2];c[ea+16>>2]=c[be+16>>2];c[ea+20>>2]=c[be+20>>2];c[ea+24>>2]=c[be+24>>2];c[ea+28>>2]=c[be+28>>2];n=0;_(17,ab|0,Nc|0);Qc=n;n=0;if(Qc&1){b=82;break a}n=0;_(17,$a|0,xb|0);Qc=n;n=0;if(Qc&1){b=82;break a}Oc=Za;Pc=Ib;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));Oc=Xa;Pc=Eb;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));Oc=Wa;Pc=ub;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));c[ad>>2]=c[Eb>>2];c[ad+4>>2]=c[Eb+4>>2];c[ad+8>>2]=c[Eb+8>>2];c[ad+12>>2]=c[Eb+12>>2];c[ad+16>>2]=c[Eb+16>>2];c[ad+20>>2]=c[Eb+20>>2];c[ad+24>>2]=c[Eb+24>>2];c[ad+28>>2]=c[Eb+28>>2];c[$c>>2]=c[ub>>2];c[$c+4>>2]=c[ub+4>>2];c[$c+8>>2]=c[ub+8>>2];c[$c+12>>2]=c[ub+12>>2];c[$c+16>>2]=c[ub+16>>2];c[$c+20>>2]=c[ub+20>>2];c[$c+24>>2]=c[ub+24>>2];c[$c+28>>2]=c[ub+28>>2];n=0;aa(17,ad|0,$c|0,136);Qc=n;n=0;if(Qc&1){b=82;break a};c[Ya>>2]=c[ad>>2];c[Ya+4>>2]=c[ad+4>>2];c[Ya+8>>2]=c[ad+8>>2];c[Ya+12>>2]=c[ad+12>>2];c[Ya+16>>2]=c[ad+16>>2];c[Ya+20>>2]=c[ad+20>>2];c[Ya+24>>2]=c[ad+24>>2];c[Ya+28>>2]=c[ad+28>>2];c[_c>>2]=c[fa>>2];c[_c+4>>2]=c[fa+4>>2];c[_c+8>>2]=c[fa+8>>2];c[_c+12>>2]=c[fa+12>>2];c[_c+16>>2]=c[fa+16>>2];c[_c+20>>2]=c[fa+20>>2];c[_c+24>>2]=c[fa+24>>2];c[_c+28>>2]=c[fa+28>>2];c[Zc>>2]=c[ga>>2];c[Zc+4>>2]=c[ga+4>>2];c[Zc+8>>2]=c[ga+8>>2];c[Zc+12>>2]=c[ga+12>>2];c[Zc+16>>2]=c[ga+16>>2];c[Zc+20>>2]=c[ga+20>>2];c[Zc+24>>2]=c[ga+24>>2];c[Zc+28>>2]=c[ga+28>>2];n=0;aa(17,_c|0,Zc|0,136);Qc=n;n=0;if(Qc&1){b=82;break a};c[be>>2]=c[_c>>2];c[be+4>>2]=c[_c+4>>2];c[be+8>>2]=c[_c+8>>2];c[be+12>>2]=c[_c+12>>2];c[be+16>>2]=c[_c+16>>2];c[be+20>>2]=c[_c+20>>2];c[be+24>>2]=c[_c+24>>2];c[be+28>>2]=c[_c+28>>2];c[ha>>2]=c[be>>2];c[ha+4>>2]=c[be+4>>2];c[ha+8>>2]=c[be+8>>2];c[ha+12>>2]=c[be+12>>2];c[ha+16>>2]=c[be+16>>2];c[ha+20>>2]=c[be+20>>2];c[ha+24>>2]=c[be+24>>2];c[ha+28>>2]=c[be+28>>2];n=0;aa(15,_a|0,Za|0,Ya|0);Qc=n;n=0;if(Qc&1){b=82;break a}Oc=Nc;Pc=_a;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));n=0;_(17,Ua|0,pb|0);Qc=n;n=0;if(Qc&1){b=82;break a}Oc=Ra;Pc=$a;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));Oc=Qa;Pc=$a;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));c[Yc>>2]=c[Ra>>2];c[Yc+4>>2]=c[Ra+4>>2];c[Yc+8>>2]=c[Ra+8>>2];c[Yc+12>>2]=c[Ra+12>>2];c[Yc+16>>2]=c[Ra+16>>2];c[Yc+20>>2]=c[Ra+20>>2];c[Yc+24>>2]=c[Ra+24>>2];c[Yc+28>>2]=c[Ra+28>>2];c[Wc>>2]=c[$a>>2];c[Wc+4>>2]=c[$a+4>>2];c[Wc+8>>2]=c[$a+8>>2];c[Wc+12>>2]=c[$a+12>>2];c[Wc+16>>2]=c[$a+16>>2];c[Wc+20>>2]=c[$a+20>>2];c[Wc+24>>2]=c[$a+24>>2];c[Wc+28>>2]=c[$a+28>>2];n=0;aa(16,Yc|0,Wc|0,136);Qc=n;n=0;if(Qc&1){b=82;break a};c[Sa>>2]=c[Yc>>2];c[Sa+4>>2]=c[Yc+4>>2];c[Sa+8>>2]=c[Yc+8>>2];c[Sa+12>>2]=c[Yc+12>>2];c[Sa+16>>2]=c[Yc+16>>2];c[Sa+20>>2]=c[Yc+20>>2];c[Sa+24>>2]=c[Yc+24>>2];c[Sa+28>>2]=c[Yc+28>>2];c[Vc>>2]=c[ia>>2];c[Vc+4>>2]=c[ia+4>>2];c[Vc+8>>2]=c[ia+8>>2];c[Vc+12>>2]=c[ia+12>>2];c[Vc+16>>2]=c[ia+16>>2];c[Vc+20>>2]=c[ia+20>>2];c[Vc+24>>2]=c[ia+24>>2];c[Vc+28>>2]=c[ia+28>>2];c[Uc>>2]=c[ja>>2];c[Uc+4>>2]=c[ja+4>>2];c[Uc+8>>2]=c[ja+8>>2];c[Uc+12>>2]=c[ja+12>>2];c[Uc+16>>2]=c[ja+16>>2];c[Uc+20>>2]=c[ja+20>>2];c[Uc+24>>2]=c[ja+24>>2];c[Uc+28>>2]=c[ja+28>>2];n=0;aa(16,Vc|0,Uc|0,136);Qc=n;n=0;if(Qc&1){b=82;break a};c[be>>2]=c[Vc>>2];c[be+4>>2]=c[Vc+4>>2];c[be+8>>2]=c[Vc+8>>2];c[be+12>>2]=c[Vc+12>>2];c[be+16>>2]=c[Vc+16>>2];c[be+20>>2]=c[Vc+20>>2];c[be+24>>2]=c[Vc+24>>2];c[be+28>>2]=c[Vc+28>>2];c[ka>>2]=c[be>>2];c[ka+4>>2]=c[be+4>>2];c[ka+8>>2]=c[be+8>>2];c[ka+12>>2]=c[be+12>>2];c[ka+16>>2]=c[be+16>>2];c[ka+20>>2]=c[be+20>>2];c[ka+24>>2]=c[be+24>>2];c[ka+28>>2]=c[be+28>>2];Oc=Pa;Pc=$a;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));c[Pd>>2]=c[Sa>>2];c[Pd+4>>2]=c[Sa+4>>2];c[Pd+8>>2]=c[Sa+8>>2];c[Pd+12>>2]=c[Sa+12>>2];c[Pd+16>>2]=c[Sa+16>>2];c[Pd+20>>2]=c[Sa+20>>2];c[Pd+24>>2]=c[Sa+24>>2];c[Pd+28>>2]=c[Sa+28>>2];c[Od>>2]=c[$a>>2];c[Od+4>>2]=c[$a+4>>2];c[Od+8>>2]=c[$a+8>>2];c[Od+12>>2]=c[$a+12>>2];c[Od+16>>2]=c[$a+16>>2];c[Od+20>>2]=c[$a+20>>2];c[Od+24>>2]=c[$a+24>>2];c[Od+28>>2]=c[$a+28>>2];n=0;aa(16,Pd|0,Od|0,136);Qc=n;n=0;if(Qc&1){b=82;break a};c[Ta>>2]=c[Pd>>2];c[Ta+4>>2]=c[Pd+4>>2];c[Ta+8>>2]=c[Pd+8>>2];c[Ta+12>>2]=c[Pd+12>>2];c[Ta+16>>2]=c[Pd+16>>2];c[Ta+20>>2]=c[Pd+20>>2];c[Ta+24>>2]=c[Pd+24>>2];c[Ta+28>>2]=c[Pd+28>>2];c[Nd>>2]=c[ka>>2];c[Nd+4>>2]=c[ka+4>>2];c[Nd+8>>2]=c[ka+8>>2];c[Nd+12>>2]=c[ka+12>>2];c[Nd+16>>2]=c[ka+16>>2];c[Nd+20>>2]=c[ka+20>>2];c[Nd+24>>2]=c[ka+24>>2];c[Nd+28>>2]=c[ka+28>>2];c[Md>>2]=c[la>>2];c[Md+4>>2]=c[la+4>>2];c[Md+8>>2]=c[la+8>>2];c[Md+12>>2]=c[la+12>>2];c[Md+16>>2]=c[la+16>>2];c[Md+20>>2]=c[la+20>>2];c[Md+24>>2]=c[la+24>>2];c[Md+28>>2]=c[la+28>>2];n=0;aa(16,Nd|0,Md|0,136);Qc=n;n=0;if(Qc&1){b=82;break a};c[be>>2]=c[Nd>>2];c[be+4>>2]=c[Nd+4>>2];c[be+8>>2]=c[Nd+8>>2];c[be+12>>2]=c[Nd+12>>2];c[be+16>>2]=c[Nd+16>>2];c[be+20>>2]=c[Nd+20>>2];c[be+24>>2]=c[Nd+24>>2];c[be+28>>2]=c[Nd+28>>2];c[ma>>2]=c[be>>2];c[ma+4>>2]=c[be+4>>2];c[ma+8>>2]=c[be+8>>2];c[ma+12>>2]=c[be+12>>2];c[ma+16>>2]=c[be+16>>2];c[ma+20>>2]=c[be+20>>2];c[ma+24>>2]=c[be+24>>2];c[ma+28>>2]=c[be+28>>2];c[Ld>>2]=c[Ua>>2];c[Ld+4>>2]=c[Ua+4>>2];c[Ld+8>>2]=c[Ua+8>>2];c[Ld+12>>2]=c[Ua+12>>2];c[Ld+16>>2]=c[Ua+16>>2];c[Ld+20>>2]=c[Ua+20>>2];c[Ld+24>>2]=c[Ua+24>>2];c[Ld+28>>2]=c[Ua+28>>2];c[Kd>>2]=c[Ta>>2];c[Kd+4>>2]=c[Ta+4>>2];c[Kd+8>>2]=c[Ta+8>>2];c[Kd+12>>2]=c[Ta+12>>2];c[Kd+16>>2]=c[Ta+16>>2];c[Kd+20>>2]=c[Ta+20>>2];c[Kd+24>>2]=c[Ta+24>>2];c[Kd+28>>2]=c[Ta+28>>2];n=0;aa(17,Ld|0,Kd|0,136);Qc=n;n=0;if(Qc&1){b=82;break a};c[Va>>2]=c[Ld>>2];c[Va+4>>2]=c[Ld+4>>2];c[Va+8>>2]=c[Ld+8>>2];c[Va+12>>2]=c[Ld+12>>2];c[Va+16>>2]=c[Ld+16>>2];c[Va+20>>2]=c[Ld+20>>2];c[Va+24>>2]=c[Ld+24>>2];c[Va+28>>2]=c[Ld+28>>2];c[Jd>>2]=c[oa>>2];c[Jd+4>>2]=c[oa+4>>2];c[Jd+8>>2]=c[oa+8>>2];c[Jd+12>>2]=c[oa+12>>2];c[Jd+16>>2]=c[oa+16>>2];c[Jd+20>>2]=c[oa+20>>2];c[Jd+24>>2]=c[oa+24>>2];c[Jd+28>>2]=c[oa+28>>2];c[Id>>2]=c[ma>>2];c[Id+4>>2]=c[ma+4>>2];c[Id+8>>2]=c[ma+8>>2];c[Id+12>>2]=c[ma+12>>2];c[Id+16>>2]=c[ma+16>>2];c[Id+20>>2]=c[ma+20>>2];c[Id+24>>2]=c[ma+24>>2];c[Id+28>>2]=c[ma+28>>2];n=0;aa(17,Jd|0,Id|0,136);Qc=n;n=0;if(Qc&1){b=82;break a};c[be>>2]=c[Jd>>2];c[be+4>>2]=c[Jd+4>>2];c[be+8>>2]=c[Jd+8>>2];c[be+12>>2]=c[Jd+12>>2];c[be+16>>2]=c[Jd+16>>2];c[be+20>>2]=c[Jd+20>>2];c[be+24>>2]=c[Jd+24>>2];c[be+28>>2]=c[Jd+28>>2];c[pa>>2]=c[be>>2];c[pa+4>>2]=c[be+4>>2];c[pa+8>>2]=c[be+8>>2];c[pa+12>>2]=c[be+12>>2];c[pa+16>>2]=c[be+16>>2];c[pa+20>>2]=c[be+20>>2];c[pa+24>>2]=c[be+24>>2];c[pa+28>>2]=c[be+28>>2];Oc=Ga;Pc=Va;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));Oc=Na;Pc=Eb;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));Oc=Ma;Pc=lb;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));n=0;aa(15,Oa|0,Na|0,Ma|0);Qc=n;n=0;if(Qc&1){b=82;break a}Oc=Ha;Pc=Oa;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));Oc=Ka;c[Oc>>2]=1091403767;c[Oc+4>>2]=-167360562;Oc=qa;c[Oc>>2]=-753151983;c[Oc+4>>2]=792555341;Oc=ra;c[Oc>>2]=960546513;c[Oc+4>>2]=692269950;Oc=sa;c[Oc>>2]=-1478256553;c[Oc+4>>2]=496343272;Oc=ta;c[Oc>>2]=-980480611;c[Oc+4>>2]=-748862579;Oc=ua;c[Oc>>2]=-171504835;c[Oc+4>>2]=175696680;Oc=va;c[Oc>>2]=2021213740;c[Oc+4>>2]=1718526831;Oc=wa;c[Oc>>2]=-1710760145;c[Oc+4>>2]=235567041;Oc=mc;Pc=db;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));n=0;aa(15,La|0,Ka|0,mc|0);Qc=n;n=0;if(Qc&1){b=82;break a}Oc=kc;Pc=lb;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));c[Hd>>2]=c[lb>>2];c[Hd+4>>2]=c[lb+4>>2];c[Hd+8>>2]=c[lb+8>>2];c[Hd+12>>2]=c[lb+12>>2];c[Hd+16>>2]=c[lb+16>>2];c[Hd+20>>2]=c[lb+20>>2];c[Hd+24>>2]=c[lb+24>>2];c[Hd+28>>2]=c[lb+28>>2];n=0;_(18,Hd|0,136);Qc=n;n=0;if(Qc&1){b=82;break a};c[lc>>2]=c[Hd>>2];c[lc+4>>2]=c[Hd+4>>2];c[lc+8>>2]=c[Hd+8>>2];c[lc+12>>2]=c[Hd+12>>2];c[lc+16>>2]=c[Hd+16>>2];c[lc+20>>2]=c[Hd+20>>2];c[lc+24>>2]=c[Hd+24>>2];c[lc+28>>2]=c[Hd+28>>2];c[Cd>>2]=c[xa>>2];c[Cd+4>>2]=c[xa+4>>2];c[Cd+8>>2]=c[xa+8>>2];c[Cd+12>>2]=c[xa+12>>2];c[Cd+16>>2]=c[xa+16>>2];c[Cd+20>>2]=c[xa+20>>2];c[Cd+24>>2]=c[xa+24>>2];c[Cd+28>>2]=c[xa+28>>2];n=0;_(18,Cd|0,136);Qc=n;n=0;if(Qc&1){b=82;break a};c[be>>2]=c[Cd>>2];c[be+4>>2]=c[Cd+4>>2];c[be+8>>2]=c[Cd+8>>2];c[be+12>>2]=c[Cd+12>>2];c[be+16>>2]=c[Cd+16>>2];c[be+20>>2]=c[Cd+20>>2];c[be+24>>2]=c[Cd+24>>2];c[be+28>>2]=c[Cd+28>>2];c[ya>>2]=c[be>>2];c[ya+4>>2]=c[be+4>>2];c[ya+8>>2]=c[be+8>>2];c[ya+12>>2]=c[be+12>>2];c[ya+16>>2]=c[be+16>>2];c[ya+20>>2]=c[be+20>>2];c[ya+24>>2]=c[be+24>>2];c[ya+28>>2]=c[be+28>>2];Oc=hc;Pc=ab;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));Oc=gc;Pc=ab;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));c[Ad>>2]=c[hc>>2];c[Ad+4>>2]=c[hc+4>>2];c[Ad+8>>2]=c[hc+8>>2];c[Ad+12>>2]=c[hc+12>>2];c[Ad+16>>2]=c[hc+16>>2];c[Ad+20>>2]=c[hc+20>>2];c[Ad+24>>2]=c[hc+24>>2];c[Ad+28>>2]=c[hc+28>>2];c[zd>>2]=c[ab>>2];c[zd+4>>2]=c[ab+4>>2];c[zd+8>>2]=c[ab+8>>2];c[zd+12>>2]=c[ab+12>>2];c[zd+16>>2]=c[ab+16>>2];c[zd+20>>2]=c[ab+20>>2];c[zd+24>>2]=c[ab+24>>2];c[zd+28>>2]=c[ab+28>>2];n=0;aa(16,Ad|0,zd|0,136);Qc=n;n=0;if(Qc&1){b=82;break a};c[ic>>2]=c[Ad>>2];c[ic+4>>2]=c[Ad+4>>2];c[ic+8>>2]=c[Ad+8>>2];c[ic+12>>2]=c[Ad+12>>2];c[ic+16>>2]=c[Ad+16>>2];c[ic+20>>2]=c[Ad+20>>2];c[ic+24>>2]=c[Ad+24>>2];c[ic+28>>2]=c[Ad+28>>2];c[yd>>2]=c[Aa>>2];c[yd+4>>2]=c[Aa+4>>2];c[yd+8>>2]=c[Aa+8>>2];c[yd+12>>2]=c[Aa+12>>2];c[yd+16>>2]=c[Aa+16>>2];c[yd+20>>2]=c[Aa+20>>2];c[yd+24>>2]=c[Aa+24>>2];c[yd+28>>2]=c[Aa+28>>2];c[xd>>2]=c[Ba>>2];c[xd+4>>2]=c[Ba+4>>2];c[xd+8>>2]=c[Ba+8>>2];c[xd+12>>2]=c[Ba+12>>2];c[xd+16>>2]=c[Ba+16>>2];c[xd+20>>2]=c[Ba+20>>2];c[xd+24>>2]=c[Ba+24>>2];c[xd+28>>2]=c[Ba+28>>2];n=0;aa(16,yd|0,xd|0,136);Qc=n;n=0;if(Qc&1){b=82;break a};c[be>>2]=c[yd>>2];c[be+4>>2]=c[yd+4>>2];c[be+8>>2]=c[yd+8>>2];c[be+12>>2]=c[yd+12>>2];c[be+16>>2]=c[yd+16>>2];c[be+20>>2]=c[yd+20>>2];c[be+24>>2]=c[yd+24>>2];c[be+28>>2]=c[yd+28>>2];c[Ca>>2]=c[be>>2];c[Ca+4>>2]=c[be+4>>2];c[Ca+8>>2]=c[be+8>>2];c[Ca+12>>2]=c[be+12>>2];c[Ca+16>>2]=c[be+16>>2];c[Ca+20>>2]=c[be+20>>2];c[Ca+24>>2]=c[be+24>>2];c[Ca+28>>2]=c[be+28>>2];Oc=fc;Pc=ab;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));c[wd>>2]=c[ic>>2];c[wd+4>>2]=c[ic+4>>2];c[wd+8>>2]=c[ic+8>>2];c[wd+12>>2]=c[ic+12>>2];c[wd+16>>2]=c[ic+16>>2];c[wd+20>>2]=c[ic+20>>2];c[wd+24>>2]=c[ic+24>>2];c[wd+28>>2]=c[ic+28>>2];c[vd>>2]=c[ab>>2];c[vd+4>>2]=c[ab+4>>2];c[vd+8>>2]=c[ab+8>>2];c[vd+12>>2]=c[ab+12>>2];c[vd+16>>2]=c[ab+16>>2];c[vd+20>>2]=c[ab+20>>2];c[vd+24>>2]=c[ab+24>>2];c[vd+28>>2]=c[ab+28>>2];n=0;aa(16,wd|0,vd|0,136);Qc=n;n=0;if(Qc&1){b=82;break a};c[jc>>2]=c[wd>>2];c[jc+4>>2]=c[wd+4>>2];c[jc+8>>2]=c[wd+8>>2];c[jc+12>>2]=c[wd+12>>2];c[jc+16>>2]=c[wd+16>>2];c[jc+20>>2]=c[wd+20>>2];c[jc+24>>2]=c[wd+24>>2];c[jc+28>>2]=c[wd+28>>2];c[Tc>>2]=c[Ca>>2];c[Tc+4>>2]=c[Ca+4>>2];c[Tc+8>>2]=c[Ca+8>>2];c[Tc+12>>2]=c[Ca+12>>2];c[Tc+16>>2]=c[Ca+16>>2];c[Tc+20>>2]=c[Ca+20>>2];c[Tc+24>>2]=c[Ca+24>>2];c[Tc+28>>2]=c[Ca+28>>2];c[ud>>2]=c[Da>>2];c[ud+4>>2]=c[Da+4>>2];c[ud+8>>2]=c[Da+8>>2];c[ud+12>>2]=c[Da+12>>2];c[ud+16>>2]=c[Da+16>>2];c[ud+20>>2]=c[Da+20>>2];c[ud+24>>2]=c[Da+24>>2];c[ud+28>>2]=c[Da+28>>2];n=0;aa(16,Tc|0,ud|0,136);Qc=n;n=0;if(Qc&1){b=82;break a};c[be>>2]=c[Tc>>2];c[be+4>>2]=c[Tc+4>>2];c[be+8>>2]=c[Tc+8>>2];c[be+12>>2]=c[Tc+12>>2];c[be+16>>2]=c[Tc+16>>2];c[be+20>>2]=c[Tc+20>>2];c[be+24>>2]=c[Tc+24>>2];c[be+28>>2]=c[Tc+28>>2];c[Ea>>2]=c[be>>2];c[Ea+4>>2]=c[be+4>>2];c[Ea+8>>2]=c[be+8>>2];c[Ea+12>>2]=c[be+12>>2];c[Ea+16>>2]=c[be+16>>2];c[Ea+20>>2]=c[be+20>>2];c[Ea+24>>2]=c[be+24>>2];c[Ea+28>>2]=c[be+28>>2];Oc=Kb;Pc=La;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));Oc=e;Pc=lc;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));Oc=f;Pc=jc;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));b=c[Mb>>2]|0;if((b|0)==(c[Ja>>2]|0)){n=0;Z(42,Sc|0);Qc=n;n=0;if(Qc&1){b=82;break a}b=c[Mb>>2]|0;}ok((c[Sc>>2]|0)+(b*192|0)|0,Kb|0,192)|0;c[Mb>>2]=b+1;if(!d){b=1;break}n=0;aa(18,Jb|0,Nc|0,Fd|0);Qc=n;n=0;if(Qc&1){b=82;break a}b=c[Mb>>2]|0;if((b|0)==(c[Ja>>2]|0)){n=0;Z(42,Sc|0);Qc=n;n=0;if(Qc&1){b=82;break a}b=c[Mb>>2]|0;}ok((c[Sc>>2]|0)+(b*192|0)|0,Jb|0,192)|0;c[Mb>>2]=b+1;b=1;}else b=d;while(0);if(!Fa){b=6;break}}if((b|0)==6){Qc=qc;c[Qc>>2]=1164159792;c[Qc+4>>2]=-1250477296;Qc=qc+8|0;c[Qc>>2]=-1448450988;c[Qc+4>>2]=880775624;Qc=qc+16|0;c[Qc>>2]=606996881;c[Qc+4>>2]=2046849319;Qc=qc+24|0;c[Qc>>2]=293737708;c[Qc+4>>2]=425114840;Qc=qc+32|0;c[Qc>>2]=-1599453353;c[Qc+4>>2]=1854185246;Qc=qc+40|0;c[Qc>>2]=-1980198591;c[Qc+4>>2]=-1440973971;Qc=qc+48|0;c[Qc>>2]=-85931462;c[Qc+4>>2]=-1226370099;Qc=qc+56|0;c[Qc>>2]=1317202883;c[Qc+4>>2]=644435899;c[pc>>2]=c[Fd>>2];c[pc+4>>2]=c[Fd+4>>2];c[pc+8>>2]=c[Fd+8>>2];c[pc+12>>2]=c[Fd+12>>2];c[pc+16>>2]=c[Fd+16>>2];c[pc+20>>2]=c[Fd+20>>2];c[pc+24>>2]=c[Fd+24>>2];c[pc+28>>2]=c[Fd+28>>2];Qc=Fd+32|0;c[vc>>2]=c[Qc>>2];c[vc+4>>2]=c[Qc+4>>2];c[vc+8>>2]=c[Qc+8>>2];c[vc+12>>2]=c[Qc+12>>2];c[vc+16>>2]=c[Qc+16>>2];c[vc+20>>2]=c[Qc+20>>2];c[vc+24>>2]=c[Qc+24>>2];c[vc+28>>2]=c[Qc+28>>2];Qc=uc;c[Qc>>2]=317583274;c[Qc+4>>2]=1757628553;Qc=uc+8|0;c[Qc>>2]=1923792719;c[Qc+4>>2]=-1928822936;Qc=uc+16|0;c[Qc>>2]=151523889;c[Qc+4>>2]=1373741639;Qc=uc+24|0;c[Qc>>2]=1193918714;c[Qc+4>>2]=576313009;n=0;X(1,vc|0,uc|0,136,-460954743,-2016278654);Qc=n;n=0;if(Qc&1){ce=na()|0;Gc(Sc);za(ce|0);};c[be>>2]=c[vc>>2];c[be+4>>2]=c[vc+4>>2];c[be+8>>2]=c[vc+8>>2];c[be+12>>2]=c[vc+12>>2];c[be+16>>2]=c[vc+16>>2];c[be+20>>2]=c[vc+20>>2];c[be+24>>2]=c[vc+24>>2];c[be+28>>2]=c[vc+28>>2];Qc=pc+32|0;c[Qc>>2]=c[be>>2];c[Qc+4>>2]=c[be+4>>2];c[Qc+8>>2]=c[be+8>>2];c[Qc+12>>2]=c[be+12>>2];c[Qc+16>>2]=c[be+16>>2];c[Qc+20>>2]=c[be+20>>2];c[Qc+24>>2]=c[be+24>>2];c[Qc+28>>2]=c[be+28>>2];n=0;aa(15,rc|0,qc|0,pc|0);Qc=n;n=0;if(Qc&1){ce=na()|0;Gc(Sc);za(ce|0);}Qc=oc;c[Qc>>2]=691451433;c[Qc+4>>2]=-457450228;Qc=oc+8|0;c[Qc>>2]=-516703541;c[Qc+4>>2]=-1154420382;Qc=oc+16|0;c[Qc>>2]=-110865562;c[Qc+4>>2]=833212854;Qc=oc+24|0;c[Qc>>2]=-1526662947;c[Qc+4>>2]=624259262;Qc=oc+32|0;c[Qc>>2]=1610512327;c[Qc+4>>2]=-1579713308;Qc=oc+40|0;c[Qc>>2]=2015810011;c[Qc+4>>2]=128974097;Qc=oc+48|0;c[Qc>>2]=-1149313941;c[Qc+4>>2]=1830206759;Qc=oc+56|0;c[Qc>>2]=-2048983348;c[Qc+4>>2]=747053058;c[nc>>2]=c[Ia>>2];c[nc+4>>2]=c[Ia+4>>2];c[nc+8>>2]=c[Ia+8>>2];c[nc+12>>2]=c[Ia+12>>2];c[nc+16>>2]=c[Ia+16>>2];c[nc+20>>2]=c[Ia+20>>2];c[nc+24>>2]=c[Ia+24>>2];c[nc+28>>2]=c[Ia+28>>2];Qc=Fd+96|0;c[tc>>2]=c[Qc>>2];c[tc+4>>2]=c[Qc+4>>2];c[tc+8>>2]=c[Qc+8>>2];c[tc+12>>2]=c[Qc+12>>2];c[tc+16>>2]=c[Qc+16>>2];c[tc+20>>2]=c[Qc+20>>2];c[tc+24>>2]=c[Qc+24>>2];c[tc+28>>2]=c[Qc+28>>2];Qc=sc;c[Qc>>2]=317583274;c[Qc+4>>2]=1757628553;Qc=sc+8|0;c[Qc>>2]=1923792719;c[Qc+4>>2]=-1928822936;Qc=sc+16|0;c[Qc>>2]=151523889;c[Qc+4>>2]=1373741639;Qc=sc+24|0;c[Qc>>2]=1193918714;c[Qc+4>>2]=576313009;n=0;X(1,tc|0,sc|0,136,-460954743,-2016278654);Qc=n;n=0;if(Qc&1){ce=na()|0;Gc(Sc);za(ce|0);};c[be>>2]=c[tc>>2];c[be+4>>2]=c[tc+4>>2];c[be+8>>2]=c[tc+8>>2];c[be+12>>2]=c[tc+12>>2];c[be+16>>2]=c[tc+16>>2];c[be+20>>2]=c[tc+20>>2];c[be+24>>2]=c[tc+24>>2];c[be+28>>2]=c[tc+28>>2];Qc=nc+32|0;c[Qc>>2]=c[be>>2];c[Qc+4>>2]=c[be+4>>2];c[Qc+8>>2]=c[be+8>>2];c[Qc+12>>2]=c[be+12>>2];c[Qc+16>>2]=c[be+16>>2];c[Qc+20>>2]=c[be+20>>2];c[Qc+24>>2]=c[be+24>>2];c[Qc+28>>2]=c[be+28>>2];n=0;aa(15,wc|0,oc|0,nc|0);Qc=n;n=0;if(Qc&1){ce=na()|0;Gc(Sc);za(ce|0);}Oc=Fc;Pc=rc;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));b=Fc+64|0;Oc=b;Pc=wc;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));Qc=Cc;c[Qc>>2]=1164159792;c[Qc+4>>2]=-1250477296;Qc=Cc+8|0;c[Qc>>2]=-1448450988;c[Qc+4>>2]=880775624;Qc=Cc+16|0;c[Qc>>2]=606996881;c[Qc+4>>2]=2046849319;Qc=Cc+24|0;c[Qc>>2]=293737708;c[Qc+4>>2]=425114840;Qc=Cc+32|0;c[Qc>>2]=-1599453353;c[Qc+4>>2]=1854185246;Qc=Cc+40|0;c[Qc>>2]=-1980198591;c[Qc+4>>2]=-1440973971;Qc=Cc+48|0;c[Qc>>2]=-85931462;c[Qc+4>>2]=-1226370099;Qc=Cc+56|0;c[Qc>>2]=1317202883;c[Qc+4>>2]=644435899;c[Bc>>2]=c[Fc>>2];c[Bc+4>>2]=c[Fc+4>>2];c[Bc+8>>2]=c[Fc+8>>2];c[Bc+12>>2]=c[Fc+12>>2];c[Bc+16>>2]=c[Fc+16>>2];c[Bc+20>>2]=c[Fc+20>>2];c[Bc+24>>2]=c[Fc+24>>2];c[Bc+28>>2]=c[Fc+28>>2];Qc=Fc+32|0;c[td>>2]=c[Qc>>2];c[td+4>>2]=c[Qc+4>>2];c[td+8>>2]=c[Qc+8>>2];c[td+12>>2]=c[Qc+12>>2];c[td+16>>2]=c[Qc+16>>2];c[td+20>>2]=c[Qc+20>>2];c[td+24>>2]=c[Qc+24>>2];c[td+28>>2]=c[Qc+28>>2];Qc=sd;c[Qc>>2]=317583274;c[Qc+4>>2]=1757628553;Qc=sd+8|0;c[Qc>>2]=1923792719;c[Qc+4>>2]=-1928822936;Qc=sd+16|0;c[Qc>>2]=151523889;c[Qc+4>>2]=1373741639;Qc=sd+24|0;c[Qc>>2]=1193918714;c[Qc+4>>2]=576313009;n=0;X(1,td|0,sd|0,136,-460954743,-2016278654);Qc=n;n=0;if(Qc&1){ce=na()|0;Gc(Sc);za(ce|0);};c[be>>2]=c[td>>2];c[be+4>>2]=c[td+4>>2];c[be+8>>2]=c[td+8>>2];c[be+12>>2]=c[td+12>>2];c[be+16>>2]=c[td+16>>2];c[be+20>>2]=c[td+20>>2];c[be+24>>2]=c[td+24>>2];c[be+28>>2]=c[td+28>>2];Qc=Bc+32|0;c[Qc>>2]=c[be>>2];c[Qc+4>>2]=c[be+4>>2];c[Qc+8>>2]=c[be+8>>2];c[Qc+12>>2]=c[be+12>>2];c[Qc+16>>2]=c[be+16>>2];c[Qc+20>>2]=c[be+20>>2];c[Qc+24>>2]=c[be+24>>2];c[Qc+28>>2]=c[be+28>>2];n=0;aa(15,Dc|0,Cc|0,Bc|0);Qc=n;n=0;if(Qc&1){ce=na()|0;Gc(Sc);za(ce|0);}Qc=yc;c[Qc>>2]=691451433;c[Qc+4>>2]=-457450228;Qc=yc+8|0;c[Qc>>2]=-516703541;c[Qc+4>>2]=-1154420382;Qc=yc+16|0;c[Qc>>2]=-110865562;c[Qc+4>>2]=833212854;Qc=yc+24|0;c[Qc>>2]=-1526662947;c[Qc+4>>2]=624259262;Qc=yc+32|0;c[Qc>>2]=1610512327;c[Qc+4>>2]=-1579713308;Qc=yc+40|0;c[Qc>>2]=2015810011;c[Qc+4>>2]=128974097;Qc=yc+48|0;c[Qc>>2]=-1149313941;c[Qc+4>>2]=1830206759;Qc=yc+56|0;c[Qc>>2]=-2048983348;c[Qc+4>>2]=747053058;c[xc>>2]=c[b>>2];c[xc+4>>2]=c[b+4>>2];c[xc+8>>2]=c[b+8>>2];c[xc+12>>2]=c[b+12>>2];c[xc+16>>2]=c[b+16>>2];c[xc+20>>2]=c[b+20>>2];c[xc+24>>2]=c[b+24>>2];c[xc+28>>2]=c[b+28>>2];Qc=Fc+96|0;c[qd>>2]=c[Qc>>2];c[qd+4>>2]=c[Qc+4>>2];c[qd+8>>2]=c[Qc+8>>2];c[qd+12>>2]=c[Qc+12>>2];c[qd+16>>2]=c[Qc+16>>2];c[qd+20>>2]=c[Qc+20>>2];c[qd+24>>2]=c[Qc+24>>2];c[qd+28>>2]=c[Qc+28>>2];Qc=fd;c[Qc>>2]=317583274;c[Qc+4>>2]=1757628553;Qc=fd+8|0;c[Qc>>2]=1923792719;c[Qc+4>>2]=-1928822936;Qc=fd+16|0;c[Qc>>2]=151523889;c[Qc+4>>2]=1373741639;Qc=fd+24|0;c[Qc>>2]=1193918714;c[Qc+4>>2]=576313009;n=0;X(1,qd|0,fd|0,136,-460954743,-2016278654);Qc=n;n=0;if(Qc&1){ce=na()|0;Gc(Sc);za(ce|0);};c[be>>2]=c[qd>>2];c[be+4>>2]=c[qd+4>>2];c[be+8>>2]=c[qd+8>>2];c[be+12>>2]=c[qd+12>>2];c[be+16>>2]=c[qd+16>>2];c[be+20>>2]=c[qd+20>>2];c[be+24>>2]=c[qd+24>>2];c[be+28>>2]=c[qd+28>>2];Qc=xc+32|0;c[Qc>>2]=c[be>>2];c[Qc+4>>2]=c[be+4>>2];c[Qc+8>>2]=c[be+8>>2];c[Qc+12>>2]=c[be+12>>2];c[Qc+16>>2]=c[be+16>>2];c[Qc+20>>2]=c[be+20>>2];c[Qc+24>>2]=c[be+24>>2];c[Qc+28>>2]=c[be+28>>2];n=0;aa(15,Kc|0,yc|0,xc|0);Qc=n;n=0;if(Qc&1){ce=na()|0;Gc(Sc);za(ce|0);}Oc=Ec;Pc=Dc;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));b=Ec+64|0;Oc=b;Pc=Kc;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));Oc=Mc;Pc=Ec;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));Oc=Ic;Pc=b;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));c[bd>>2]=c[b>>2];c[bd+4>>2]=c[b+4>>2];c[bd+8>>2]=c[b+8>>2];c[bd+12>>2]=c[b+12>>2];c[bd+16>>2]=c[b+16>>2];c[bd+20>>2]=c[b+20>>2];c[bd+24>>2]=c[b+24>>2];c[bd+28>>2]=c[b+28>>2];n=0;_(18,bd|0,136);Qc=n;n=0;if(Qc&1){ce=na()|0;Gc(Sc);za(ce|0);};c[Jc>>2]=c[bd>>2];c[Jc+4>>2]=c[bd+4>>2];c[Jc+8>>2]=c[bd+8>>2];c[Jc+12>>2]=c[bd+12>>2];c[Jc+16>>2]=c[bd+16>>2];c[Jc+20>>2]=c[bd+20>>2];c[Jc+24>>2]=c[bd+24>>2];c[Jc+28>>2]=c[bd+28>>2];Qc=Ic+32|0;c[Xc>>2]=c[Qc>>2];c[Xc+4>>2]=c[Qc+4>>2];c[Xc+8>>2]=c[Qc+8>>2];c[Xc+12>>2]=c[Qc+12>>2];c[Xc+16>>2]=c[Qc+16>>2];c[Xc+20>>2]=c[Qc+20>>2];c[Xc+24>>2]=c[Qc+24>>2];c[Xc+28>>2]=c[Qc+28>>2];n=0;_(18,Xc|0,136);Qc=n;n=0;if(Qc&1){ce=na()|0;Gc(Sc);za(ce|0);};c[be>>2]=c[Xc>>2];c[be+4>>2]=c[Xc+4>>2];c[be+8>>2]=c[Xc+8>>2];c[be+12>>2]=c[Xc+12>>2];c[be+16>>2]=c[Xc+16>>2];c[be+20>>2]=c[Xc+20>>2];c[be+24>>2]=c[Xc+24>>2];c[be+28>>2]=c[Xc+28>>2];Oc=Jc+32|0;c[Oc>>2]=c[be>>2];c[Oc+4>>2]=c[be+4>>2];c[Oc+8>>2]=c[be+8>>2];c[Oc+12>>2]=c[be+12>>2];c[Oc+16>>2]=c[be+16>>2];c[Oc+20>>2]=c[be+20>>2];c[Oc+24>>2]=c[be+24>>2];c[Oc+28>>2]=c[be+28>>2];Oc=Mc+64|0;Pc=Jc;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));n=0;aa(18,Lc|0,Nc|0,Fc|0);Qc=n;n=0;if(Qc&1){ce=na()|0;Gc(Sc);za(ce|0);}b=c[Mb>>2]|0;do if((b|0)==(c[Ja>>2]|0)){n=0;Z(42,Sc|0);Qc=n;n=0;if(Qc&1){ce=na()|0;Gc(Sc);za(ce|0);}else {b=c[Mb>>2]|0;break}}while(0);ok((c[Sc>>2]|0)+(b*192|0)|0,Lc|0,192)|0;c[Mb>>2]=b+1;n=0;aa(18,Rc|0,Nc|0,Mc|0);Qc=n;n=0;if(Qc&1){ce=na()|0;Gc(Sc);za(ce|0);}b=c[Mb>>2]|0;do if((b|0)==(c[Ja>>2]|0)){n=0;Z(42,Sc|0);Qc=n;n=0;if(Qc&1){ce=na()|0;Gc(Sc);za(ce|0);}else {b=c[Mb>>2]|0;break}}while(0);ok((c[Sc>>2]|0)+(b*192|0)|0,Rc|0,192)|0;c[Mb>>2]=b+1;Oc=Bd;Pc=Fd;Qc=Oc+128|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));o=Bd+128|0;c[o>>2]=c[Sc>>2];c[o+4>>2]=c[Sc+4>>2];c[o+8>>2]=c[Sc+8>>2];k=ae;c[k>>2]=-980480611;c[k+4>>2]=-748862579;k=ae+8|0;c[k>>2]=-171504835;c[k+4>>2]=175696680;k=ae+16|0;c[k>>2]=2021213740;c[k+4>>2]=1718526831;k=ae+24|0;c[k>>2]=-1710760145;c[k+4>>2]=235567041;hk(ae+32|0,0,352)|0;k=rd;c[k>>2]=-1099547736;c[k+4>>2]=-1652985799;k=rd+8|0;c[k>>2]=1;c[k+4>>2]=0;k=rd+16|0;c[k>>2]=0;c[k+4>>2]=0;c[k+8>>2]=0;c[k+12>>2]=0;o=c[o>>2]|0;k=c[Bd+136>>2]|0;m=Gd+32|0;f=md+32|0;g=kd+32|0;h=gd+32|0;i=dd+32|0;d=256;b=0;e=0;b:while(1){do{if(!d){b=87;break b}d=d+-1|0;if(d>>>0>255){b=87;break b}Rc=rd+(d>>>6<<3)|0;Pc=c[Rc>>2]|0;Rc=c[Rc+4>>2]|0;Qc=nk(1,0,d&63|0)|0;Sc=b;b=(Pc&Qc|0)!=0|(Rc&y|0)!=0;}while(!Sc);if(k>>>0<=e>>>0){b=103;break}j=e+1|0;n=0;_(19,od|0,ae|0);Sc=n;n=0;if(Sc&1){b=126;break}Oc=nd;Pc=o+(e*192|0)|0;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));Sc=o+(e*192|0)+64|0;c[ld>>2]=c[m>>2];c[ld+4>>2]=c[m+4>>2];c[ld+8>>2]=c[m+8>>2];c[ld+12>>2]=c[m+12>>2];c[ld+16>>2]=c[m+16>>2];c[ld+20>>2]=c[m+20>>2];c[ld+24>>2]=c[m+24>>2];c[ld+28>>2]=c[m+28>>2];c[Tc>>2]=c[Sc>>2];c[Tc+4>>2]=c[Sc+4>>2];c[Tc+8>>2]=c[Sc+8>>2];c[Tc+12>>2]=c[Sc+12>>2];c[Tc+16>>2]=c[Sc+16>>2];c[Tc+20>>2]=c[Sc+20>>2];c[Tc+24>>2]=c[Sc+24>>2];c[Tc+28>>2]=c[Sc+28>>2];c[ud>>2]=c[m>>2];c[ud+4>>2]=c[m+4>>2];c[ud+8>>2]=c[m+8>>2];c[ud+12>>2]=c[m+12>>2];c[ud+16>>2]=c[m+16>>2];c[ud+20>>2]=c[m+20>>2];c[ud+24>>2]=c[m+24>>2];c[ud+28>>2]=c[m+28>>2];n=0;X(1,Tc|0,ud|0,136,-460954743,-2016278654);Sc=n;n=0;if(Sc&1){b=126;break};c[md>>2]=c[Tc>>2];c[md+4>>2]=c[Tc+4>>2];c[md+8>>2]=c[Tc+8>>2];c[md+12>>2]=c[Tc+12>>2];c[md+16>>2]=c[Tc+16>>2];c[md+20>>2]=c[Tc+20>>2];c[md+24>>2]=c[Tc+24>>2];c[md+28>>2]=c[Tc+28>>2];Sc=o+(e*192|0)+96|0;c[td>>2]=c[Sc>>2];c[td+4>>2]=c[Sc+4>>2];c[td+8>>2]=c[Sc+8>>2];c[td+12>>2]=c[Sc+12>>2];c[td+16>>2]=c[Sc+16>>2];c[td+20>>2]=c[Sc+20>>2];c[td+24>>2]=c[Sc+24>>2];c[td+28>>2]=c[Sc+28>>2];c[sd>>2]=c[ld>>2];c[sd+4>>2]=c[ld+4>>2];c[sd+8>>2]=c[ld+8>>2];c[sd+12>>2]=c[ld+12>>2];c[sd+16>>2]=c[ld+16>>2];c[sd+20>>2]=c[ld+20>>2];c[sd+24>>2]=c[ld+24>>2];c[sd+28>>2]=c[ld+28>>2];n=0;X(1,td|0,sd|0,136,-460954743,-2016278654);Sc=n;n=0;if(Sc&1){b=126;break};c[be>>2]=c[td>>2];c[be+4>>2]=c[td+4>>2];c[be+8>>2]=c[td+8>>2];c[be+12>>2]=c[td+12>>2];c[be+16>>2]=c[td+16>>2];c[be+20>>2]=c[td+20>>2];c[be+24>>2]=c[td+24>>2];c[be+28>>2]=c[td+28>>2];c[f>>2]=c[be>>2];c[f+4>>2]=c[be+4>>2];c[f+8>>2]=c[be+8>>2];c[f+12>>2]=c[be+12>>2];c[f+16>>2]=c[be+16>>2];c[f+20>>2]=c[be+20>>2];c[f+24>>2]=c[be+24>>2];c[f+28>>2]=c[be+28>>2];Sc=o+(e*192|0)+128|0;c[jd>>2]=c[Gd>>2];c[jd+4>>2]=c[Gd+4>>2];c[jd+8>>2]=c[Gd+8>>2];c[jd+12>>2]=c[Gd+12>>2];c[jd+16>>2]=c[Gd+16>>2];c[jd+20>>2]=c[Gd+20>>2];c[jd+24>>2]=c[Gd+24>>2];c[jd+28>>2]=c[Gd+28>>2];c[qd>>2]=c[Sc>>2];c[qd+4>>2]=c[Sc+4>>2];c[qd+8>>2]=c[Sc+8>>2];c[qd+12>>2]=c[Sc+12>>2];c[qd+16>>2]=c[Sc+16>>2];c[qd+20>>2]=c[Sc+20>>2];c[qd+24>>2]=c[Sc+24>>2];c[qd+28>>2]=c[Sc+28>>2];c[fd>>2]=c[Gd>>2];c[fd+4>>2]=c[Gd+4>>2];c[fd+8>>2]=c[Gd+8>>2];c[fd+12>>2]=c[Gd+12>>2];c[fd+16>>2]=c[Gd+16>>2];c[fd+20>>2]=c[Gd+20>>2];c[fd+24>>2]=c[Gd+24>>2];c[fd+28>>2]=c[Gd+28>>2];n=0;X(1,qd|0,fd|0,136,-460954743,-2016278654);Sc=n;n=0;if(Sc&1){b=126;break};c[kd>>2]=c[qd>>2];c[kd+4>>2]=c[qd+4>>2];c[kd+8>>2]=c[qd+8>>2];c[kd+12>>2]=c[qd+12>>2];c[kd+16>>2]=c[qd+16>>2];c[kd+20>>2]=c[qd+20>>2];c[kd+24>>2]=c[qd+24>>2];c[kd+28>>2]=c[qd+28>>2];Sc=o+(e*192|0)+160|0;c[bd>>2]=c[Sc>>2];c[bd+4>>2]=c[Sc+4>>2];c[bd+8>>2]=c[Sc+8>>2];c[bd+12>>2]=c[Sc+12>>2];c[bd+16>>2]=c[Sc+16>>2];c[bd+20>>2]=c[Sc+20>>2];c[bd+24>>2]=c[Sc+24>>2];c[bd+28>>2]=c[Sc+28>>2];c[Xc>>2]=c[jd>>2];c[Xc+4>>2]=c[jd+4>>2];c[Xc+8>>2]=c[jd+8>>2];c[Xc+12>>2]=c[jd+12>>2];c[Xc+16>>2]=c[jd+16>>2];c[Xc+20>>2]=c[jd+20>>2];c[Xc+24>>2]=c[jd+24>>2];c[Xc+28>>2]=c[jd+28>>2];n=0;X(1,bd|0,Xc|0,136,-460954743,-2016278654);Sc=n;n=0;if(Sc&1){b=126;break};c[be>>2]=c[bd>>2];c[be+4>>2]=c[bd+4>>2];c[be+8>>2]=c[bd+8>>2];c[be+12>>2]=c[bd+12>>2];c[be+16>>2]=c[bd+16>>2];c[be+20>>2]=c[bd+20>>2];c[be+24>>2]=c[bd+24>>2];c[be+28>>2]=c[bd+28>>2];c[g>>2]=c[be>>2];c[g+4>>2]=c[be+4>>2];c[g+8>>2]=c[be+8>>2];c[g+12>>2]=c[be+12>>2];c[g+16>>2]=c[be+16>>2];c[g+20>>2]=c[be+20>>2];c[g+24>>2]=c[be+24>>2];c[g+28>>2]=c[be+28>>2];n=0;X(2,pd|0,od|0,nd|0,md|0,kd|0);Sc=n;n=0;if(Sc&1){b=126;break}ok(ae|0,pd|0,384)|0;if(!b){b=1;e=j;continue}if(k>>>0<=j>>>0){b=112;break}e=e+2|0;Oc=hd;Pc=o+(j*192|0)|0;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));Sc=o+(j*192|0)+64|0;c[ed>>2]=c[m>>2];c[ed+4>>2]=c[m+4>>2];c[ed+8>>2]=c[m+8>>2];c[ed+12>>2]=c[m+12>>2];c[ed+16>>2]=c[m+16>>2];c[ed+20>>2]=c[m+20>>2];c[ed+24>>2]=c[m+24>>2];c[ed+28>>2]=c[m+28>>2];c[Yc>>2]=c[Sc>>2];c[Yc+4>>2]=c[Sc+4>>2];c[Yc+8>>2]=c[Sc+8>>2];c[Yc+12>>2]=c[Sc+12>>2];c[Yc+16>>2]=c[Sc+16>>2];c[Yc+20>>2]=c[Sc+20>>2];c[Yc+24>>2]=c[Sc+24>>2];c[Yc+28>>2]=c[Sc+28>>2];c[Wc>>2]=c[m>>2];c[Wc+4>>2]=c[m+4>>2];c[Wc+8>>2]=c[m+8>>2];c[Wc+12>>2]=c[m+12>>2];c[Wc+16>>2]=c[m+16>>2];c[Wc+20>>2]=c[m+20>>2];c[Wc+24>>2]=c[m+24>>2];c[Wc+28>>2]=c[m+28>>2];n=0;X(1,Yc|0,Wc|0,136,-460954743,-2016278654);Sc=n;n=0;if(Sc&1){b=126;break};c[gd>>2]=c[Yc>>2];c[gd+4>>2]=c[Yc+4>>2];c[gd+8>>2]=c[Yc+8>>2];c[gd+12>>2]=c[Yc+12>>2];c[gd+16>>2]=c[Yc+16>>2];c[gd+20>>2]=c[Yc+20>>2];c[gd+24>>2]=c[Yc+24>>2];c[gd+28>>2]=c[Yc+28>>2];Sc=o+(j*192|0)+96|0;c[Vc>>2]=c[Sc>>2];c[Vc+4>>2]=c[Sc+4>>2];c[Vc+8>>2]=c[Sc+8>>2];c[Vc+12>>2]=c[Sc+12>>2];c[Vc+16>>2]=c[Sc+16>>2];c[Vc+20>>2]=c[Sc+20>>2];c[Vc+24>>2]=c[Sc+24>>2];c[Vc+28>>2]=c[Sc+28>>2];c[Uc>>2]=c[ed>>2];c[Uc+4>>2]=c[ed+4>>2];c[Uc+8>>2]=c[ed+8>>2];c[Uc+12>>2]=c[ed+12>>2];c[Uc+16>>2]=c[ed+16>>2];c[Uc+20>>2]=c[ed+20>>2];c[Uc+24>>2]=c[ed+24>>2];c[Uc+28>>2]=c[ed+28>>2];n=0;X(1,Vc|0,Uc|0,136,-460954743,-2016278654);Sc=n;n=0;if(Sc&1){b=126;break};c[be>>2]=c[Vc>>2];c[be+4>>2]=c[Vc+4>>2];c[be+8>>2]=c[Vc+8>>2];c[be+12>>2]=c[Vc+12>>2];c[be+16>>2]=c[Vc+16>>2];c[be+20>>2]=c[Vc+20>>2];c[be+24>>2]=c[Vc+24>>2];c[be+28>>2]=c[Vc+28>>2];c[h>>2]=c[be>>2];c[h+4>>2]=c[be+4>>2];c[h+8>>2]=c[be+8>>2];c[h+12>>2]=c[be+12>>2];c[h+16>>2]=c[be+16>>2];c[h+20>>2]=c[be+20>>2];c[h+24>>2]=c[be+24>>2];c[h+28>>2]=c[be+28>>2];Sc=o+(j*192|0)+128|0;c[cd>>2]=c[Gd>>2];c[cd+4>>2]=c[Gd+4>>2];c[cd+8>>2]=c[Gd+8>>2];c[cd+12>>2]=c[Gd+12>>2];c[cd+16>>2]=c[Gd+16>>2];c[cd+20>>2]=c[Gd+20>>2];c[cd+24>>2]=c[Gd+24>>2];c[cd+28>>2]=c[Gd+28>>2];c[ad>>2]=c[Sc>>2];c[ad+4>>2]=c[Sc+4>>2];c[ad+8>>2]=c[Sc+8>>2];c[ad+12>>2]=c[Sc+12>>2];c[ad+16>>2]=c[Sc+16>>2];c[ad+20>>2]=c[Sc+20>>2];c[ad+24>>2]=c[Sc+24>>2];c[ad+28>>2]=c[Sc+28>>2];c[$c>>2]=c[Gd>>2];c[$c+4>>2]=c[Gd+4>>2];c[$c+8>>2]=c[Gd+8>>2];c[$c+12>>2]=c[Gd+12>>2];c[$c+16>>2]=c[Gd+16>>2];c[$c+20>>2]=c[Gd+20>>2];c[$c+24>>2]=c[Gd+24>>2];c[$c+28>>2]=c[Gd+28>>2];n=0;X(1,ad|0,$c|0,136,-460954743,-2016278654);Sc=n;n=0;if(Sc&1){b=126;break};c[dd>>2]=c[ad>>2];c[dd+4>>2]=c[ad+4>>2];c[dd+8>>2]=c[ad+8>>2];c[dd+12>>2]=c[ad+12>>2];c[dd+16>>2]=c[ad+16>>2];c[dd+20>>2]=c[ad+20>>2];c[dd+24>>2]=c[ad+24>>2];c[dd+28>>2]=c[ad+28>>2];Sc=o+(j*192|0)+160|0;c[_c>>2]=c[Sc>>2];c[_c+4>>2]=c[Sc+4>>2];c[_c+8>>2]=c[Sc+8>>2];c[_c+12>>2]=c[Sc+12>>2];c[_c+16>>2]=c[Sc+16>>2];c[_c+20>>2]=c[Sc+20>>2];c[_c+24>>2]=c[Sc+24>>2];c[_c+28>>2]=c[Sc+28>>2];c[Zc>>2]=c[cd>>2];c[Zc+4>>2]=c[cd+4>>2];c[Zc+8>>2]=c[cd+8>>2];c[Zc+12>>2]=c[cd+12>>2];c[Zc+16>>2]=c[cd+16>>2];c[Zc+20>>2]=c[cd+20>>2];c[Zc+24>>2]=c[cd+24>>2];c[Zc+28>>2]=c[cd+28>>2];n=0;X(1,_c|0,Zc|0,136,-460954743,-2016278654);Sc=n;n=0;if(Sc&1){b=126;break};c[be>>2]=c[_c>>2];c[be+4>>2]=c[_c+4>>2];c[be+8>>2]=c[_c+8>>2];c[be+12>>2]=c[_c+12>>2];c[be+16>>2]=c[_c+16>>2];c[be+20>>2]=c[_c+20>>2];c[be+24>>2]=c[_c+24>>2];c[be+28>>2]=c[_c+28>>2];c[i>>2]=c[be>>2];c[i+4>>2]=c[be+4>>2];c[i+8>>2]=c[be+8>>2];c[i+12>>2]=c[be+12>>2];c[i+16>>2]=c[be+16>>2];c[i+20>>2]=c[be+20>>2];c[i+24>>2]=c[be+24>>2];c[i+28>>2]=c[be+28>>2];n=0;X(2,id|0,ae|0,hd|0,gd|0,dd|0);Sc=n;n=0;if(Sc&1){b=126;break}ok(ae|0,id|0,384)|0;b=1;}if((b|0)==87){if(k>>>0<=e>>>0){n=0;aa(19,2056,e|0,k|0);n=0;ce=na()|0;Hc(Bd);za(ce|0);}b=e+1|0;Oc=_d;Pc=o+(e*192|0)|0;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));ud=o+(e*192|0)+64|0;c[Yd>>2]=c[m>>2];c[Yd+4>>2]=c[m+4>>2];c[Yd+8>>2]=c[m+8>>2];c[Yd+12>>2]=c[m+12>>2];c[Yd+16>>2]=c[m+16>>2];c[Yd+20>>2]=c[m+20>>2];c[Yd+24>>2]=c[m+24>>2];c[Yd+28>>2]=c[m+28>>2];c[Pd>>2]=c[ud>>2];c[Pd+4>>2]=c[ud+4>>2];c[Pd+8>>2]=c[ud+8>>2];c[Pd+12>>2]=c[ud+12>>2];c[Pd+16>>2]=c[ud+16>>2];c[Pd+20>>2]=c[ud+20>>2];c[Pd+24>>2]=c[ud+24>>2];c[Pd+28>>2]=c[ud+28>>2];c[Od>>2]=c[m>>2];c[Od+4>>2]=c[m+4>>2];c[Od+8>>2]=c[m+8>>2];c[Od+12>>2]=c[m+12>>2];c[Od+16>>2]=c[m+16>>2];c[Od+20>>2]=c[m+20>>2];c[Od+24>>2]=c[m+24>>2];c[Od+28>>2]=c[m+28>>2];n=0;X(1,Pd|0,Od|0,136,-460954743,-2016278654);Od=n;n=0;if(Od&1){ce=na()|0;Hc(Bd);za(ce|0);};c[Zd>>2]=c[Pd>>2];c[Zd+4>>2]=c[Pd+4>>2];c[Zd+8>>2]=c[Pd+8>>2];c[Zd+12>>2]=c[Pd+12>>2];c[Zd+16>>2]=c[Pd+16>>2];c[Zd+20>>2]=c[Pd+20>>2];c[Zd+24>>2]=c[Pd+24>>2];c[Zd+28>>2]=c[Pd+28>>2];Pd=o+(e*192|0)+96|0;c[Nd>>2]=c[Pd>>2];c[Nd+4>>2]=c[Pd+4>>2];c[Nd+8>>2]=c[Pd+8>>2];c[Nd+12>>2]=c[Pd+12>>2];c[Nd+16>>2]=c[Pd+16>>2];c[Nd+20>>2]=c[Pd+20>>2];c[Nd+24>>2]=c[Pd+24>>2];c[Nd+28>>2]=c[Pd+28>>2];c[Md>>2]=c[Yd>>2];c[Md+4>>2]=c[Yd+4>>2];c[Md+8>>2]=c[Yd+8>>2];c[Md+12>>2]=c[Yd+12>>2];c[Md+16>>2]=c[Yd+16>>2];c[Md+20>>2]=c[Yd+20>>2];c[Md+24>>2]=c[Yd+24>>2];c[Md+28>>2]=c[Yd+28>>2];n=0;X(1,Nd|0,Md|0,136,-460954743,-2016278654);Yd=n;n=0;if(Yd&1){ce=na()|0;Hc(Bd);za(ce|0);};c[be>>2]=c[Nd>>2];c[be+4>>2]=c[Nd+4>>2];c[be+8>>2]=c[Nd+8>>2];c[be+12>>2]=c[Nd+12>>2];c[be+16>>2]=c[Nd+16>>2];c[be+20>>2]=c[Nd+20>>2];c[be+24>>2]=c[Nd+24>>2];c[be+28>>2]=c[Nd+28>>2];Yd=Zd+32|0;c[Yd>>2]=c[be>>2];c[Yd+4>>2]=c[be+4>>2];c[Yd+8>>2]=c[be+8>>2];c[Yd+12>>2]=c[be+12>>2];c[Yd+16>>2]=c[be+16>>2];c[Yd+20>>2]=c[be+20>>2];c[Yd+24>>2]=c[be+24>>2];c[Yd+28>>2]=c[be+28>>2];Yd=o+(e*192|0)+128|0;c[Wd>>2]=c[Gd>>2];c[Wd+4>>2]=c[Gd+4>>2];c[Wd+8>>2]=c[Gd+8>>2];c[Wd+12>>2]=c[Gd+12>>2];c[Wd+16>>2]=c[Gd+16>>2];c[Wd+20>>2]=c[Gd+20>>2];c[Wd+24>>2]=c[Gd+24>>2];c[Wd+28>>2]=c[Gd+28>>2];c[Ld>>2]=c[Yd>>2];c[Ld+4>>2]=c[Yd+4>>2];c[Ld+8>>2]=c[Yd+8>>2];c[Ld+12>>2]=c[Yd+12>>2];c[Ld+16>>2]=c[Yd+16>>2];c[Ld+20>>2]=c[Yd+20>>2];c[Ld+24>>2]=c[Yd+24>>2];c[Ld+28>>2]=c[Yd+28>>2];c[Kd>>2]=c[Gd>>2];c[Kd+4>>2]=c[Gd+4>>2];c[Kd+8>>2]=c[Gd+8>>2];c[Kd+12>>2]=c[Gd+12>>2];c[Kd+16>>2]=c[Gd+16>>2];c[Kd+20>>2]=c[Gd+20>>2];c[Kd+24>>2]=c[Gd+24>>2];c[Kd+28>>2]=c[Gd+28>>2];n=0;X(1,Ld|0,Kd|0,136,-460954743,-2016278654);Yd=n;n=0;if(Yd&1){ce=na()|0;Hc(Bd);za(ce|0);};c[Xd>>2]=c[Ld>>2];c[Xd+4>>2]=c[Ld+4>>2];c[Xd+8>>2]=c[Ld+8>>2];c[Xd+12>>2]=c[Ld+12>>2];c[Xd+16>>2]=c[Ld+16>>2];c[Xd+20>>2]=c[Ld+20>>2];c[Xd+24>>2]=c[Ld+24>>2];c[Xd+28>>2]=c[Ld+28>>2];Yd=o+(e*192|0)+160|0;c[Jd>>2]=c[Yd>>2];c[Jd+4>>2]=c[Yd+4>>2];c[Jd+8>>2]=c[Yd+8>>2];c[Jd+12>>2]=c[Yd+12>>2];c[Jd+16>>2]=c[Yd+16>>2];c[Jd+20>>2]=c[Yd+20>>2];c[Jd+24>>2]=c[Yd+24>>2];c[Jd+28>>2]=c[Yd+28>>2];c[Id>>2]=c[Wd>>2];c[Id+4>>2]=c[Wd+4>>2];c[Id+8>>2]=c[Wd+8>>2];c[Id+12>>2]=c[Wd+12>>2];c[Id+16>>2]=c[Wd+16>>2];c[Id+20>>2]=c[Wd+20>>2];c[Id+24>>2]=c[Wd+24>>2];c[Id+28>>2]=c[Wd+28>>2];n=0;X(1,Jd|0,Id|0,136,-460954743,-2016278654);Yd=n;n=0;if(Yd&1){ce=na()|0;Hc(Bd);za(ce|0);};c[be>>2]=c[Jd>>2];c[be+4>>2]=c[Jd+4>>2];c[be+8>>2]=c[Jd+8>>2];c[be+12>>2]=c[Jd+12>>2];c[be+16>>2]=c[Jd+16>>2];c[be+20>>2]=c[Jd+20>>2];c[be+24>>2]=c[Jd+24>>2];c[be+28>>2]=c[Jd+28>>2];Yd=Xd+32|0;c[Yd>>2]=c[be>>2];c[Yd+4>>2]=c[be+4>>2];c[Yd+8>>2]=c[be+8>>2];c[Yd+12>>2]=c[be+12>>2];c[Yd+16>>2]=c[be+16>>2];c[Yd+20>>2]=c[be+20>>2];c[Yd+24>>2]=c[be+24>>2];c[Yd+28>>2]=c[be+28>>2];n=0;X(2,$d|0,ae|0,_d|0,Zd|0,Xd|0);_d=n;n=0;if(_d&1){ce=na()|0;Hc(Bd);za(ce|0);}ok(ae|0,$d|0,384)|0;if(k>>>0<=b>>>0){n=0;aa(19,2056,b|0,k|0);n=0;ce=na()|0;Hc(Bd);za(ce|0);}Oc=Ud;Pc=o+(b*192|0)|0;Qc=Oc+64|0;do{c[Oc>>2]=c[Pc>>2];Oc=Oc+4|0;Pc=Pc+4|0;}while((Oc|0)<(Qc|0));$d=o+(b*192|0)+64|0;c[Sd>>2]=c[m>>2];c[Sd+4>>2]=c[m+4>>2];c[Sd+8>>2]=c[m+8>>2];c[Sd+12>>2]=c[m+12>>2];c[Sd+16>>2]=c[m+16>>2];c[Sd+20>>2]=c[m+20>>2];c[Sd+24>>2]=c[m+24>>2];c[Sd+28>>2]=c[m+28>>2];c[Hd>>2]=c[$d>>2];c[Hd+4>>2]=c[$d+4>>2];c[Hd+8>>2]=c[$d+8>>2];c[Hd+12>>2]=c[$d+12>>2];c[Hd+16>>2]=c[$d+16>>2];c[Hd+20>>2]=c[$d+20>>2];c[Hd+24>>2]=c[$d+24>>2];c[Hd+28>>2]=c[$d+28>>2];c[Cd>>2]=c[m>>2];c[Cd+4>>2]=c[m+4>>2];c[Cd+8>>2]=c[m+8>>2];c[Cd+12>>2]=c[m+12>>2];c[Cd+16>>2]=c[m+16>>2];c[Cd+20>>2]=c[m+20>>2];c[Cd+24>>2]=c[m+24>>2];c[Cd+28>>2]=c[m+28>>2];n=0;X(1,Hd|0,Cd|0,136,-460954743,-2016278654);$d=n;n=0;if($d&1){ce=na()|0;Hc(Bd);za(ce|0);};c[Td>>2]=c[Hd>>2];c[Td+4>>2]=c[Hd+4>>2];c[Td+8>>2]=c[Hd+8>>2];c[Td+12>>2]=c[Hd+12>>2];c[Td+16>>2]=c[Hd+16>>2];c[Td+20>>2]=c[Hd+20>>2];c[Td+24>>2]=c[Hd+24>>2];c[Td+28>>2]=c[Hd+28>>2];$d=o+(b*192|0)+96|0;c[Ad>>2]=c[$d>>2];c[Ad+4>>2]=c[$d+4>>2];c[Ad+8>>2]=c[$d+8>>2];c[Ad+12>>2]=c[$d+12>>2];c[Ad+16>>2]=c[$d+16>>2];c[Ad+20>>2]=c[$d+20>>2];c[Ad+24>>2]=c[$d+24>>2];c[Ad+28>>2]=c[$d+28>>2];c[zd>>2]=c[Sd>>2];c[zd+4>>2]=c[Sd+4>>2];c[zd+8>>2]=c[Sd+8>>2];c[zd+12>>2]=c[Sd+12>>2];c[zd+16>>2]=c[Sd+16>>2];c[zd+20>>2]=c[Sd+20>>2];c[zd+24>>2]=c[Sd+24>>2];c[zd+28>>2]=c[Sd+28>>2];n=0;X(1,Ad|0,zd|0,136,-460954743,-2016278654);$d=n;n=0;if($d&1){ce=na()|0;Hc(Bd);za(ce|0);};c[be>>2]=c[Ad>>2];c[be+4>>2]=c[Ad+4>>2];c[be+8>>2]=c[Ad+8>>2];c[be+12>>2]=c[Ad+12>>2];c[be+16>>2]=c[Ad+16>>2];c[be+20>>2]=c[Ad+20>>2];c[be+24>>2]=c[Ad+24>>2];c[be+28>>2]=c[Ad+28>>2];$d=Td+32|0;c[$d>>2]=c[be>>2];c[$d+4>>2]=c[be+4>>2];c[$d+8>>2]=c[be+8>>2];c[$d+12>>2]=c[be+12>>2];c[$d+16>>2]=c[be+16>>2];c[$d+20>>2]=c[be+20>>2];c[$d+24>>2]=c[be+24>>2];c[$d+28>>2]=c[be+28>>2];$d=o+(b*192|0)+128|0;c[Qd>>2]=c[Gd>>2];c[Qd+4>>2]=c[Gd+4>>2];c[Qd+8>>2]=c[Gd+8>>2];c[Qd+12>>2]=c[Gd+12>>2];c[Qd+16>>2]=c[Gd+16>>2];c[Qd+20>>2]=c[Gd+20>>2];c[Qd+24>>2]=c[Gd+24>>2];c[Qd+28>>2]=c[Gd+28>>2];c[yd>>2]=c[$d>>2];c[yd+4>>2]=c[$d+4>>2];c[yd+8>>2]=c[$d+8>>2];c[yd+12>>2]=c[$d+12>>2];c[yd+16>>2]=c[$d+16>>2];c[yd+20>>2]=c[$d+20>>2];c[yd+24>>2]=c[$d+24>>2];c[yd+28>>2]=c[$d+28>>2];c[xd>>2]=c[Gd>>2];c[xd+4>>2]=c[Gd+4>>2];c[xd+8>>2]=c[Gd+8>>2];c[xd+12>>2]=c[Gd+12>>2];c[xd+16>>2]=c[Gd+16>>2];c[xd+20>>2]=c[Gd+20>>2];c[xd+24>>2]=c[Gd+24>>2];c[xd+28>>2]=c[Gd+28>>2];n=0;X(1,yd|0,xd|0,136,-460954743,-2016278654);$d=n;n=0;if($d&1){ce=na()|0;Hc(Bd);za(ce|0);};c[Rd>>2]=c[yd>>2];c[Rd+4>>2]=c[yd+4>>2];c[Rd+8>>2]=c[yd+8>>2];c[Rd+12>>2]=c[yd+12>>2];c[Rd+16>>2]=c[yd+16>>2];c[Rd+20>>2]=c[yd+20>>2];c[Rd+24>>2]=c[yd+24>>2];c[Rd+28>>2]=c[yd+28>>2];$d=o+(b*192|0)+160|0;c[wd>>2]=c[$d>>2];c[wd+4>>2]=c[$d+4>>2];c[wd+8>>2]=c[$d+8>>2];c[wd+12>>2]=c[$d+12>>2];c[wd+16>>2]=c[$d+16>>2];c[wd+20>>2]=c[$d+20>>2];c[wd+24>>2]=c[$d+24>>2];c[wd+28>>2]=c[$d+28>>2];c[vd>>2]=c[Qd>>2];c[vd+4>>2]=c[Qd+4>>2];c[vd+8>>2]=c[Qd+8>>2];c[vd+12>>2]=c[Qd+12>>2];c[vd+16>>2]=c[Qd+16>>2];c[vd+20>>2]=c[Qd+20>>2];c[vd+24>>2]=c[Qd+24>>2];c[vd+28>>2]=c[Qd+28>>2];n=0;X(1,wd|0,vd|0,136,-460954743,-2016278654);$d=n;n=0;if($d&1){ce=na()|0;Hc(Bd);za(ce|0);};c[be>>2]=c[wd>>2];c[be+4>>2]=c[wd+4>>2];c[be+8>>2]=c[wd+8>>2];c[be+12>>2]=c[wd+12>>2];c[be+16>>2]=c[wd+16>>2];c[be+20>>2]=c[wd+20>>2];c[be+24>>2]=c[wd+24>>2];c[be+28>>2]=c[wd+28>>2];$d=Rd+32|0;c[$d>>2]=c[be>>2];c[$d+4>>2]=c[be+4>>2];c[$d+8>>2]=c[be+8>>2];c[$d+12>>2]=c[be+12>>2];c[$d+16>>2]=c[be+16>>2];c[$d+20>>2]=c[be+20>>2];c[$d+24>>2]=c[be+24>>2];c[$d+28>>2]=c[be+28>>2];n=0;X(2,Vd|0,ae|0,Ud|0,Td|0,Rd|0);be=n;n=0;if(be&1){ce=na()|0;Hc(Bd);za(ce|0);}ok(ae|0,Vd|0,384)|0;ok(Dd|0,ae|0,384)|0;n=0;_(20,Ed|0,Dd|0);be=n;n=0;if(be&1){ce=na()|0;Hc(Bd);za(ce|0);}be=Ed;if(!((c[be>>2]|0)==1&(c[be+4>>2]|0)==0)){n=0;_(21,6331,31);n=0;ce=na()|0;Hc(Bd);za(ce|0);}ok(a|0,Ed+8|0,384)|0;b=c[Bd+132>>2]|0;if(b|0)Zb(o,b*192|0,8);l=ce;return}else if((b|0)==103){n=0;aa(19,2056,e|0,k|0);n=0;ce=na()|0;Hc(Bd);za(ce|0);}else if((b|0)==112){n=0;aa(19,2056,j|0,k|0);n=0;ce=na()|0;Hc(Bd);za(ce|0);}else if((b|0)==126){ce=na()|0;Hc(Bd);za(ce|0);}}else if((b|0)==82){ce=na()|0;Gc(Sc);za(ce|0);}}function Fc(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;z=l;l=l+1024|0;r=z+960|0;s=z+896|0;t=z+832|0;u=z+768|0;v=z+704|0;w=z+640|0;x=z+576|0;g=z+512|0;h=z+448|0;i=z+384|0;j=z+320|0;k=z+256|0;e=z+192|0;f=z+128|0;m=z+64|0;n=z;y=v;A=b;B=y+64|0;do{c[y>>2]=c[A>>2];y=y+4|0;A=A+4|0;}while((y|0)<(B|0));o=b+128|0;y=s;A=o;B=y+64|0;do{c[y>>2]=c[A>>2];y=y+4|0;A=A+4|0;}while((y|0)<(B|0));y=r;A=d;B=y+64|0;do{c[y>>2]=c[A>>2];y=y+4|0;A=A+4|0;}while((y|0)<(B|0));cd(u,s,r);c[s>>2]=c[v>>2];c[s+4>>2]=c[v+4>>2];c[s+8>>2]=c[v+8>>2];c[s+12>>2]=c[v+12>>2];c[s+16>>2]=c[v+16>>2];c[s+20>>2]=c[v+20>>2];c[s+24>>2]=c[v+24>>2];c[s+28>>2]=c[v+28>>2];c[r>>2]=c[u>>2];c[r+4>>2]=c[u+4>>2];c[r+8>>2]=c[u+8>>2];c[r+12>>2]=c[u+12>>2];c[r+16>>2]=c[u+16>>2];c[r+20>>2]=c[u+20>>2];c[r+24>>2]=c[u+24>>2];c[r+28>>2]=c[u+28>>2];Lc(s,r,136);c[n>>2]=c[s>>2];c[n+4>>2]=c[s+4>>2];c[n+8>>2]=c[s+8>>2];c[n+12>>2]=c[s+12>>2];c[n+16>>2]=c[s+16>>2];c[n+20>>2]=c[s+20>>2];c[n+24>>2]=c[s+24>>2];c[n+28>>2]=c[s+28>>2];p=v+32|0;c[s>>2]=c[p>>2];c[s+4>>2]=c[p+4>>2];c[s+8>>2]=c[p+8>>2];c[s+12>>2]=c[p+12>>2];c[s+16>>2]=c[p+16>>2];c[s+20>>2]=c[p+20>>2];c[s+24>>2]=c[p+24>>2];c[s+28>>2]=c[p+28>>2];p=u+32|0;c[r>>2]=c[p>>2];c[r+4>>2]=c[p+4>>2];c[r+8>>2]=c[p+8>>2];c[r+12>>2]=c[p+12>>2];c[r+16>>2]=c[p+16>>2];c[r+20>>2]=c[p+20>>2];c[r+24>>2]=c[p+24>>2];c[r+28>>2]=c[p+28>>2];Lc(s,r,136);c[t>>2]=c[s>>2];c[t+4>>2]=c[s+4>>2];c[t+8>>2]=c[s+8>>2];c[t+12>>2]=c[s+12>>2];c[t+16>>2]=c[s+16>>2];c[t+20>>2]=c[s+20>>2];c[t+24>>2]=c[s+24>>2];c[t+28>>2]=c[s+28>>2];p=n+32|0;c[p>>2]=c[t>>2];c[p+4>>2]=c[t+4>>2];c[p+8>>2]=c[t+8>>2];c[p+12>>2]=c[t+12>>2];c[p+16>>2]=c[t+16>>2];c[p+20>>2]=c[t+20>>2];c[p+24>>2]=c[t+24>>2];c[p+28>>2]=c[t+28>>2];p=b+64|0;y=v;A=p;B=y+64|0;do{c[y>>2]=c[A>>2];y=y+4|0;A=A+4|0;}while((y|0)<(B|0));y=s;A=o;B=y+64|0;do{c[y>>2]=c[A>>2];y=y+4|0;A=A+4|0;}while((y|0)<(B|0));q=d+64|0;y=r;A=q;B=y+64|0;do{c[y>>2]=c[A>>2];y=y+4|0;A=A+4|0;}while((y|0)<(B|0));cd(u,s,r);c[s>>2]=c[v>>2];c[s+4>>2]=c[v+4>>2];c[s+8>>2]=c[v+8>>2];c[s+12>>2]=c[v+12>>2];c[s+16>>2]=c[v+16>>2];c[s+20>>2]=c[v+20>>2];c[s+24>>2]=c[v+24>>2];c[s+28>>2]=c[v+28>>2];c[r>>2]=c[u>>2];c[r+4>>2]=c[u+4>>2];c[r+8>>2]=c[u+8>>2];c[r+12>>2]=c[u+12>>2];c[r+16>>2]=c[u+16>>2];c[r+20>>2]=c[u+20>>2];c[r+24>>2]=c[u+24>>2];c[r+28>>2]=c[u+28>>2];Lc(s,r,136);c[m>>2]=c[s>>2];c[m+4>>2]=c[s+4>>2];c[m+8>>2]=c[s+8>>2];c[m+12>>2]=c[s+12>>2];c[m+16>>2]=c[s+16>>2];c[m+20>>2]=c[s+20>>2];c[m+24>>2]=c[s+24>>2];c[m+28>>2]=c[s+28>>2];y=v+32|0;c[s>>2]=c[y>>2];c[s+4>>2]=c[y+4>>2];c[s+8>>2]=c[y+8>>2];c[s+12>>2]=c[y+12>>2];c[s+16>>2]=c[y+16>>2];c[s+20>>2]=c[y+20>>2];c[s+24>>2]=c[y+24>>2];c[s+28>>2]=c[y+28>>2];y=u+32|0;c[r>>2]=c[y>>2];c[r+4>>2]=c[y+4>>2];c[r+8>>2]=c[y+8>>2];c[r+12>>2]=c[y+12>>2];c[r+16>>2]=c[y+16>>2];c[r+20>>2]=c[y+20>>2];c[r+24>>2]=c[y+24>>2];c[r+28>>2]=c[y+28>>2];Lc(s,r,136);c[t>>2]=c[s>>2];c[t+4>>2]=c[s+4>>2];c[t+8>>2]=c[s+8>>2];c[t+12>>2]=c[s+12>>2];c[t+16>>2]=c[s+16>>2];c[t+20>>2]=c[s+20>>2];c[t+24>>2]=c[s+24>>2];c[t+28>>2]=c[s+28>>2];y=m+32|0;c[y>>2]=c[t>>2];c[y+4>>2]=c[t+4>>2];c[y+8>>2]=c[t+8>>2];c[y+12>>2]=c[t+12>>2];c[y+16>>2]=c[t+16>>2];c[y+20>>2]=c[t+20>>2];c[y+24>>2]=c[t+24>>2];c[y+28>>2]=c[t+28>>2];dd(f,n);dd(e,m);y=s;A=n;B=y+64|0;do{c[y>>2]=c[A>>2];y=y+4|0;A=A+4|0;}while((y|0)<(B|0));y=r;A=f;B=y+64|0;do{c[y>>2]=c[A>>2];y=y+4|0;A=A+4|0;}while((y|0)<(B|0));cd(k,s,r);y=s;A=b;B=y+64|0;do{c[y>>2]=c[A>>2];y=y+4|0;A=A+4|0;}while((y|0)<(B|0));y=r;A=f;B=y+64|0;do{c[y>>2]=c[A>>2];y=y+4|0;A=A+4|0;}while((y|0)<(B|0));cd(j,s,r);y=s;A=o;B=y+64|0;do{c[y>>2]=c[A>>2];y=y+4|0;A=A+4|0;}while((y|0)<(B|0));y=r;A=e;B=y+64|0;do{c[y>>2]=c[A>>2];y=y+4|0;A=A+4|0;}while((y|0)<(B|0));cd(v,s,r);y=u;A=k;B=y+64|0;do{c[y>>2]=c[A>>2];y=y+4|0;A=A+4|0;}while((y|0)<(B|0));c[s>>2]=c[v>>2];c[s+4>>2]=c[v+4>>2];c[s+8>>2]=c[v+8>>2];c[s+12>>2]=c[v+12>>2];c[s+16>>2]=c[v+16>>2];c[s+20>>2]=c[v+20>>2];c[s+24>>2]=c[v+24>>2];c[s+28>>2]=c[v+28>>2];c[r>>2]=c[k>>2];c[r+4>>2]=c[k+4>>2];c[r+8>>2]=c[k+8>>2];c[r+12>>2]=c[k+12>>2];c[r+16>>2]=c[k+16>>2];c[r+20>>2]=c[k+20>>2];c[r+24>>2]=c[k+24>>2];c[r+28>>2]=c[k+28>>2];Kc(s,r,136);c[x>>2]=c[s>>2];c[x+4>>2]=c[s+4>>2];c[x+8>>2]=c[s+8>>2];c[x+12>>2]=c[s+12>>2];c[x+16>>2]=c[s+16>>2];c[x+20>>2]=c[s+20>>2];c[x+24>>2]=c[s+24>>2];c[x+28>>2]=c[s+28>>2];e=v+32|0;c[s>>2]=c[e>>2];c[s+4>>2]=c[e+4>>2];c[s+8>>2]=c[e+8>>2];c[s+12>>2]=c[e+12>>2];c[s+16>>2]=c[e+16>>2];c[s+20>>2]=c[e+20>>2];c[s+24>>2]=c[e+24>>2];c[s+28>>2]=c[e+28>>2];e=u+32|0;c[r>>2]=c[e>>2];c[r+4>>2]=c[e+4>>2];c[r+8>>2]=c[e+8>>2];c[r+12>>2]=c[e+12>>2];c[r+16>>2]=c[e+16>>2];c[r+20>>2]=c[e+20>>2];c[r+24>>2]=c[e+24>>2];c[r+28>>2]=c[e+28>>2];Kc(s,r,136);c[t>>2]=c[s>>2];c[t+4>>2]=c[s+4>>2];c[t+8>>2]=c[s+8>>2];c[t+12>>2]=c[s+12>>2];c[t+16>>2]=c[s+16>>2];c[t+20>>2]=c[s+20>>2];c[t+24>>2]=c[s+24>>2];c[t+28>>2]=c[s+28>>2];e=x+32|0;c[e>>2]=c[t>>2];c[e+4>>2]=c[t+4>>2];c[e+8>>2]=c[t+8>>2];c[e+12>>2]=c[t+12>>2];c[e+16>>2]=c[t+16>>2];c[e+20>>2]=c[t+20>>2];c[e+24>>2]=c[t+24>>2];c[e+28>>2]=c[t+28>>2];y=v;A=j;B=y+64|0;do{c[y>>2]=c[A>>2];y=y+4|0;A=A+4|0;}while((y|0)<(B|0));y=u;A=j;B=y+64|0;do{c[y>>2]=c[A>>2];y=y+4|0;A=A+4|0;}while((y|0)<(B|0));c[s>>2]=c[v>>2];c[s+4>>2]=c[v+4>>2];c[s+8>>2]=c[v+8>>2];c[s+12>>2]=c[v+12>>2];c[s+16>>2]=c[v+16>>2];c[s+20>>2]=c[v+20>>2];c[s+24>>2]=c[v+24>>2];c[s+28>>2]=c[v+28>>2];c[r>>2]=c[j>>2];c[r+4>>2]=c[j+4>>2];c[r+8>>2]=c[j+8>>2];c[r+12>>2]=c[j+12>>2];c[r+16>>2]=c[j+16>>2];c[r+20>>2]=c[j+20>>2];c[r+24>>2]=c[j+24>>2];c[r+28>>2]=c[j+28>>2];Kc(s,r,136);c[w>>2]=c[s>>2];c[w+4>>2]=c[s+4>>2];c[w+8>>2]=c[s+8>>2];c[w+12>>2]=c[s+12>>2];c[w+16>>2]=c[s+16>>2];c[w+20>>2]=c[s+20>>2];c[w+24>>2]=c[s+24>>2];c[w+28>>2]=c[s+28>>2];y=v+32|0;c[s>>2]=c[y>>2];c[s+4>>2]=c[y+4>>2];c[s+8>>2]=c[y+8>>2];c[s+12>>2]=c[y+12>>2];c[s+16>>2]=c[y+16>>2];c[s+20>>2]=c[y+20>>2];c[s+24>>2]=c[y+24>>2];c[s+28>>2]=c[y+28>>2];y=u+32|0;c[r>>2]=c[y>>2];c[r+4>>2]=c[y+4>>2];c[r+8>>2]=c[y+8>>2];c[r+12>>2]=c[y+12>>2];c[r+16>>2]=c[y+16>>2];c[r+20>>2]=c[y+20>>2];c[r+24>>2]=c[y+24>>2];c[r+28>>2]=c[y+28>>2];Kc(s,r,136);c[t>>2]=c[s>>2];c[t+4>>2]=c[s+4>>2];c[t+8>>2]=c[s+8>>2];c[t+12>>2]=c[s+12>>2];c[t+16>>2]=c[s+16>>2];c[t+20>>2]=c[s+20>>2];c[t+24>>2]=c[s+24>>2];c[t+28>>2]=c[s+28>>2];y=w+32|0;c[y>>2]=c[t>>2];c[y+4>>2]=c[t+4>>2];c[y+8>>2]=c[t+8>>2];c[y+12>>2]=c[t+12>>2];c[y+16>>2]=c[t+16>>2];c[y+20>>2]=c[t+20>>2];c[y+24>>2]=c[t+24>>2];c[y+28>>2]=c[t+28>>2];c[s>>2]=c[x>>2];c[s+4>>2]=c[x+4>>2];c[s+8>>2]=c[x+8>>2];c[s+12>>2]=c[x+12>>2];c[s+16>>2]=c[x+16>>2];c[s+20>>2]=c[x+20>>2];c[s+24>>2]=c[x+24>>2];c[s+28>>2]=c[x+28>>2];c[r>>2]=c[w>>2];c[r+4>>2]=c[w+4>>2];c[r+8>>2]=c[w+8>>2];c[r+12>>2]=c[w+12>>2];c[r+16>>2]=c[w+16>>2];c[r+20>>2]=c[w+20>>2];c[r+24>>2]=c[w+24>>2];c[r+28>>2]=c[w+28>>2];Lc(s,r,136);c[i>>2]=c[s>>2];c[i+4>>2]=c[s+4>>2];c[i+8>>2]=c[s+8>>2];c[i+12>>2]=c[s+12>>2];c[i+16>>2]=c[s+16>>2];c[i+20>>2]=c[s+20>>2];c[i+24>>2]=c[s+24>>2];c[i+28>>2]=c[s+28>>2];c[s>>2]=c[e>>2];c[s+4>>2]=c[e+4>>2];c[s+8>>2]=c[e+8>>2];c[s+12>>2]=c[e+12>>2];c[s+16>>2]=c[e+16>>2];c[s+20>>2]=c[e+20>>2];c[s+24>>2]=c[e+24>>2];c[s+28>>2]=c[e+28>>2];c[r>>2]=c[y>>2];c[r+4>>2]=c[y+4>>2];c[r+8>>2]=c[y+8>>2];c[r+12>>2]=c[y+12>>2];c[r+16>>2]=c[y+16>>2];c[r+20>>2]=c[y+20>>2];c[r+24>>2]=c[y+24>>2];c[r+28>>2]=c[y+28>>2];Lc(s,r,136);c[t>>2]=c[s>>2];c[t+4>>2]=c[s+4>>2];c[t+8>>2]=c[s+8>>2];c[t+12>>2]=c[s+12>>2];c[t+16>>2]=c[s+16>>2];c[t+20>>2]=c[s+20>>2];c[t+24>>2]=c[s+24>>2];c[t+28>>2]=c[s+28>>2];y=i+32|0;c[y>>2]=c[t>>2];c[y+4>>2]=c[t+4>>2];c[y+8>>2]=c[t+8>>2];c[y+12>>2]=c[t+12>>2];c[y+16>>2]=c[t+16>>2];c[y+20>>2]=c[t+20>>2];c[y+24>>2]=c[t+24>>2];c[y+28>>2]=c[t+28>>2];y=s;A=n;B=y+64|0;do{c[y>>2]=c[A>>2];y=y+4|0;A=A+4|0;}while((y|0)<(B|0));y=r;A=i;B=y+64|0;do{c[y>>2]=c[A>>2];y=y+4|0;A=A+4|0;}while((y|0)<(B|0));cd(t,s,r);y=b;A=t;B=y+64|0;do{c[y>>2]=c[A>>2];y=y+4|0;A=A+4|0;}while((y|0)<(B|0));y=x;A=m;B=y+64|0;do{c[y>>2]=c[A>>2];y=y+4|0;A=A+4|0;}while((y|0)<(B|0));y=v;A=j;B=y+64|0;do{c[y>>2]=c[A>>2];y=y+4|0;A=A+4|0;}while((y|0)<(B|0));y=u;A=i;B=y+64|0;do{c[y>>2]=c[A>>2];y=y+4|0;A=A+4|0;}while((y|0)<(B|0));c[s>>2]=c[j>>2];c[s+4>>2]=c[j+4>>2];c[s+8>>2]=c[j+8>>2];c[s+12>>2]=c[j+12>>2];c[s+16>>2]=c[j+16>>2];c[s+20>>2]=c[j+20>>2];c[s+24>>2]=c[j+24>>2];c[s+28>>2]=c[j+28>>2];c[r>>2]=c[i>>2];c[r+4>>2]=c[i+4>>2];c[r+8>>2]=c[i+8>>2];c[r+12>>2]=c[i+12>>2];c[r+16>>2]=c[i+16>>2];c[r+20>>2]=c[i+20>>2];c[r+24>>2]=c[i+24>>2];c[r+28>>2]=c[i+28>>2];Lc(s,r,136);c[w>>2]=c[s>>2];c[w+4>>2]=c[s+4>>2];c[w+8>>2]=c[s+8>>2];c[w+12>>2]=c[s+12>>2];c[w+16>>2]=c[s+16>>2];c[w+20>>2]=c[s+20>>2];c[w+24>>2]=c[s+24>>2];c[w+28>>2]=c[s+28>>2];y=v+32|0;c[s>>2]=c[y>>2];c[s+4>>2]=c[y+4>>2];c[s+8>>2]=c[y+8>>2];c[s+12>>2]=c[y+12>>2];c[s+16>>2]=c[y+16>>2];c[s+20>>2]=c[y+20>>2];c[s+24>>2]=c[y+24>>2];c[s+28>>2]=c[y+28>>2];y=u+32|0;c[r>>2]=c[y>>2];c[r+4>>2]=c[y+4>>2];c[r+8>>2]=c[y+8>>2];c[r+12>>2]=c[y+12>>2];c[r+16>>2]=c[y+16>>2];c[r+20>>2]=c[y+20>>2];c[r+24>>2]=c[y+24>>2];c[r+28>>2]=c[y+28>>2];Lc(s,r,136);c[t>>2]=c[s>>2];c[t+4>>2]=c[s+4>>2];c[t+8>>2]=c[s+8>>2];c[t+12>>2]=c[s+12>>2];c[t+16>>2]=c[s+16>>2];c[t+20>>2]=c[s+20>>2];c[t+24>>2]=c[s+24>>2];c[t+28>>2]=c[s+28>>2];y=w+32|0;c[y>>2]=c[t>>2];c[y+4>>2]=c[t+4>>2];c[y+8>>2]=c[t+8>>2];c[y+12>>2]=c[t+12>>2];c[y+16>>2]=c[t+16>>2];c[y+20>>2]=c[t+20>>2];c[y+24>>2]=c[t+24>>2];c[y+28>>2]=c[t+28>>2];cd(g,x,w);y=s;A=k;B=y+64|0;do{c[y>>2]=c[A>>2];y=y+4|0;A=A+4|0;}while((y|0)<(B|0));y=r;A=p;B=y+64|0;do{c[y>>2]=c[A>>2];y=y+4|0;A=A+4|0;}while((y|0)<(B|0));cd(u,s,r);c[s>>2]=c[g>>2];c[s+4>>2]=c[g+4>>2];c[s+8>>2]=c[g+8>>2];c[s+12>>2]=c[g+12>>2];c[s+16>>2]=c[g+16>>2];c[s+20>>2]=c[g+20>>2];c[s+24>>2]=c[g+24>>2];c[s+28>>2]=c[g+28>>2];c[r>>2]=c[u>>2];c[r+4>>2]=c[u+4>>2];c[r+8>>2]=c[u+8>>2];c[r+12>>2]=c[u+12>>2];c[r+16>>2]=c[u+16>>2];c[r+20>>2]=c[u+20>>2];c[r+24>>2]=c[u+24>>2];c[r+28>>2]=c[u+28>>2];Lc(s,r,136);c[h>>2]=c[s>>2];c[h+4>>2]=c[s+4>>2];c[h+8>>2]=c[s+8>>2];c[h+12>>2]=c[s+12>>2];c[h+16>>2]=c[s+16>>2];c[h+20>>2]=c[s+20>>2];c[h+24>>2]=c[s+24>>2];c[h+28>>2]=c[s+28>>2];y=g+32|0;c[s>>2]=c[y>>2];c[s+4>>2]=c[y+4>>2];c[s+8>>2]=c[y+8>>2];c[s+12>>2]=c[y+12>>2];c[s+16>>2]=c[y+16>>2];c[s+20>>2]=c[y+20>>2];c[s+24>>2]=c[y+24>>2];c[s+28>>2]=c[y+28>>2];y=u+32|0;c[r>>2]=c[y>>2];c[r+4>>2]=c[y+4>>2];c[r+8>>2]=c[y+8>>2];c[r+12>>2]=c[y+12>>2];c[r+16>>2]=c[y+16>>2];c[r+20>>2]=c[y+20>>2];c[r+24>>2]=c[y+24>>2];c[r+28>>2]=c[y+28>>2];Lc(s,r,136);c[t>>2]=c[s>>2];c[t+4>>2]=c[s+4>>2];c[t+8>>2]=c[s+8>>2];c[t+12>>2]=c[s+12>>2];c[t+16>>2]=c[s+16>>2];c[t+20>>2]=c[s+20>>2];c[t+24>>2]=c[s+24>>2];c[t+28>>2]=c[s+28>>2];y=h+32|0;c[y>>2]=c[t>>2];c[y+4>>2]=c[t+4>>2];c[y+8>>2]=c[t+8>>2];c[y+12>>2]=c[t+12>>2];c[y+16>>2]=c[t+16>>2];c[y+20>>2]=c[t+20>>2];c[y+24>>2]=c[t+24>>2];c[y+28>>2]=c[t+28>>2];y=p;A=h;B=y+64|0;do{c[y>>2]=c[A>>2];y=y+4|0;A=A+4|0;}while((y|0)<(B|0));y=s;A=o;B=y+64|0;do{c[y>>2]=c[A>>2];y=y+4|0;A=A+4|0;}while((y|0)<(B|0));y=r;A=k;B=y+64|0;do{c[y>>2]=c[A>>2];y=y+4|0;A=A+4|0;}while((y|0)<(B|0));cd(t,s,r);y=o;A=t;B=y+64|0;do{c[y>>2]=c[A>>2];y=y+4|0;A=A+4|0;}while((y|0)<(B|0));y=x;c[y>>2]=1091403767;c[y+4>>2]=-167360562;y=x+8|0;c[y>>2]=-753151983;c[y+4>>2]=792555341;y=x+16|0;c[y>>2]=960546513;c[y+4>>2]=692269950;y=x+24|0;c[y>>2]=-1478256553;c[y+4>>2]=496343272;y=x+32|0;c[y>>2]=-980480611;c[y+4>>2]=-748862579;y=x+40|0;c[y>>2]=-171504835;c[y+4>>2]=175696680;y=x+48|0;c[y>>2]=2021213740;c[y+4>>2]=1718526831;y=x+56|0;c[y>>2]=-1710760145;c[y+4>>2]=235567041;y=s;A=m;B=y+64|0;do{c[y>>2]=c[A>>2];y=y+4|0;A=A+4|0;}while((y|0)<(B|0));y=r;A=d;B=y+64|0;do{c[y>>2]=c[A>>2];y=y+4|0;A=A+4|0;}while((y|0)<(B|0));cd(v,s,r);y=s;A=n;B=y+64|0;do{c[y>>2]=c[A>>2];y=y+4|0;A=A+4|0;}while((y|0)<(B|0));y=r;A=q;B=y+64|0;do{c[y>>2]=c[A>>2];y=y+4|0;A=A+4|0;}while((y|0)<(B|0));cd(u,s,r);c[s>>2]=c[v>>2];c[s+4>>2]=c[v+4>>2];c[s+8>>2]=c[v+8>>2];c[s+12>>2]=c[v+12>>2];c[s+16>>2]=c[v+16>>2];c[s+20>>2]=c[v+20>>2];c[s+24>>2]=c[v+24>>2];c[s+28>>2]=c[v+28>>2];c[r>>2]=c[u>>2];c[r+4>>2]=c[u+4>>2];c[r+8>>2]=c[u+8>>2];c[r+12>>2]=c[u+12>>2];c[r+16>>2]=c[u+16>>2];c[r+20>>2]=c[u+20>>2];c[r+24>>2]=c[u+24>>2];c[r+28>>2]=c[u+28>>2];Lc(s,r,136);c[w>>2]=c[s>>2];c[w+4>>2]=c[s+4>>2];c[w+8>>2]=c[s+8>>2];c[w+12>>2]=c[s+12>>2];c[w+16>>2]=c[s+16>>2];c[w+20>>2]=c[s+20>>2];c[w+24>>2]=c[s+24>>2];c[w+28>>2]=c[s+28>>2];y=v+32|0;c[s>>2]=c[y>>2];c[s+4>>2]=c[y+4>>2];c[s+8>>2]=c[y+8>>2];c[s+12>>2]=c[y+12>>2];c[s+16>>2]=c[y+16>>2];c[s+20>>2]=c[y+20>>2];c[s+24>>2]=c[y+24>>2];c[s+28>>2]=c[y+28>>2];y=u+32|0;c[r>>2]=c[y>>2];c[r+4>>2]=c[y+4>>2];c[r+8>>2]=c[y+8>>2];c[r+12>>2]=c[y+12>>2];c[r+16>>2]=c[y+16>>2];c[r+20>>2]=c[y+20>>2];c[r+24>>2]=c[y+24>>2];c[r+28>>2]=c[y+28>>2];Lc(s,r,136);c[t>>2]=c[s>>2];c[t+4>>2]=c[s+4>>2];c[t+8>>2]=c[s+8>>2];c[t+12>>2]=c[s+12>>2];c[t+16>>2]=c[s+16>>2];c[t+20>>2]=c[s+20>>2];c[t+24>>2]=c[s+24>>2];c[t+28>>2]=c[s+28>>2];y=w+32|0;c[y>>2]=c[t>>2];c[y+4>>2]=c[t+4>>2];c[y+8>>2]=c[t+8>>2];c[y+12>>2]=c[t+12>>2];c[y+16>>2]=c[t+16>>2];c[y+20>>2]=c[t+20>>2];c[y+24>>2]=c[t+24>>2];c[y+28>>2]=c[t+28>>2];cd(g,x,w);y=s;A=m;B=y+64|0;do{c[y>>2]=c[A>>2];y=y+4|0;A=A+4|0;}while((y|0)<(B|0));c[r>>2]=c[m>>2];c[r+4>>2]=c[m+4>>2];c[r+8>>2]=c[m+8>>2];c[r+12>>2]=c[m+12>>2];c[r+16>>2]=c[m+16>>2];c[r+20>>2]=c[m+20>>2];c[r+24>>2]=c[m+24>>2];c[r+28>>2]=c[m+28>>2];Nc(r,136);c[u>>2]=c[r>>2];c[u+4>>2]=c[r+4>>2];c[u+8>>2]=c[r+8>>2];c[u+12>>2]=c[r+12>>2];c[u+16>>2]=c[r+16>>2];c[u+20>>2]=c[r+20>>2];c[u+24>>2]=c[r+24>>2];c[u+28>>2]=c[r+28>>2];y=s+32|0;c[r>>2]=c[y>>2];c[r+4>>2]=c[y+4>>2];c[r+8>>2]=c[y+8>>2];c[r+12>>2]=c[y+12>>2];c[r+16>>2]=c[y+16>>2];c[r+20>>2]=c[y+20>>2];c[r+24>>2]=c[y+24>>2];c[r+28>>2]=c[y+28>>2];Nc(r,136);c[t>>2]=c[r>>2];c[t+4>>2]=c[r+4>>2];c[t+8>>2]=c[r+8>>2];c[t+12>>2]=c[r+12>>2];c[t+16>>2]=c[r+16>>2];c[t+20>>2]=c[r+20>>2];c[t+24>>2]=c[r+24>>2];c[t+28>>2]=c[r+28>>2];y=u+32|0;c[y>>2]=c[t>>2];c[y+4>>2]=c[t+4>>2];c[y+8>>2]=c[t+8>>2];c[y+12>>2]=c[t+12>>2];c[y+16>>2]=c[t+16>>2];c[y+20>>2]=c[t+20>>2];c[y+24>>2]=c[t+24>>2];c[y+28>>2]=c[t+28>>2];y=a;A=g;B=y+64|0;do{c[y>>2]=c[A>>2];y=y+4|0;A=A+4|0;}while((y|0)<(B|0));y=a+64|0;A=n;B=y+64|0;do{c[y>>2]=c[A>>2];y=y+4|0;A=A+4|0;}while((y|0)<(B|0));y=a+128|0;A=u;B=y+64|0;do{c[y>>2]=c[A>>2];y=y+4|0;A=A+4|0;}while((y|0)<(B|0));l=z;return}function Gc(a){a=a|0;var b=0;b=c[a+4>>2]|0;if(!b)return;Zb(c[a>>2]|0,b*192|0,8);return}function Hc(a){a=a|0;var b=0;b=c[a+132>>2]|0;if(!b)return;Zb(c[a+128>>2]|0,b*192|0,8);return}function Ic(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;g=4;while(1){if(!g){a=0;b=5;break}g=g+-1|0;d=a+(g<<3)|0;h=c[d>>2]|0;d=c[d+4>>2]|0;f=b+(g<<3)|0;e=c[f>>2]|0;f=c[f+4>>2]|0;if(d>>>0<f>>>0|(d|0)==(f|0)&h>>>0<e>>>0){a=-1;b=5;break}if(d>>>0>f>>>0|(d|0)==(f|0)&h>>>0>e>>>0){a=1;b=5;break}}if((b|0)==5)return a|0;return 0}function Jc(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0;if((f|0)==32){g=d+24|0;g=ga(c[g>>2]|0,c[g+4>>2]|0)|0;f=y;h=e;i=h;a[i>>0]=g;a[i+1>>0]=g>>8;a[i+2>>0]=g>>16;a[i+3>>0]=g>>24;h=h+4|0;a[h>>0]=f;a[h+1>>0]=f>>8;a[h+2>>0]=f>>16;a[h+3>>0]=f>>24;h=d+16|0;h=ga(c[h>>2]|0,c[h+4>>2]|0)|0;f=y;i=e+8|0;g=i;a[g>>0]=h;a[g+1>>0]=h>>8;a[g+2>>0]=h>>16;a[g+3>>0]=h>>24;i=i+4|0;a[i>>0]=f;a[i+1>>0]=f>>8;a[i+2>>0]=f>>16;a[i+3>>0]=f>>24;i=d+8|0;i=ga(c[i>>2]|0,c[i+4>>2]|0)|0;f=y;g=e+16|0;h=g;a[h>>0]=i;a[h+1>>0]=i>>8;a[h+2>>0]=i>>16;a[h+3>>0]=i>>24;g=g+4|0;a[g>>0]=f;a[g+1>>0]=f>>8;a[g+2>>0]=f>>16;a[g+3>>0]=f>>24;g=d;g=ga(c[g>>2]|0,c[g+4>>2]|0)|0;d=y;f=e+24|0;e=f;a[e>>0]=g;a[e+1>>0]=g>>8;a[e+2>>0]=g>>16;a[e+3>>0]=g>>24;f=f+4|0;a[f>>0]=d;a[f+1>>0]=d>>8;a[f+2>>0]=d>>16;a[f+3>>0]=d>>24;c[b>>2]=0;return}else {c[b>>2]=1;c[b+4>>2]=32;c[b+8>>2]=f;return}}function Kc(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;n=a;k=c[n>>2]|0;n=c[n+4>>2]|0;g=b;l=c[g>>2]|0;g=c[g+4>>2]|0;gk(l|0,0,k|0,0)|0;m=y;k=gk(l|0,g|0,k|0,n|0)|0;l=y;n=gk(g|0,0,n|0,0)|0;m=gk(n|0,y|0,m|0,0)|0;n=a;c[n>>2]=k;c[n+4>>2]=m;n=a+8|0;g=n;q=c[g+4>>2]|0;e=b+8|0;o=c[e>>2]|0;e=c[e+4>>2]|0;g=gk(y|0,0,c[g>>2]|0,0)|0;t=y;gk(g|0,t|0,o|0,0)|0;p=y;o=gk(g|0,t|0,o|0,e|0)|0;q=gk(e|0,0,q|0,0)|0;p=gk(q|0,y|0,p|0,0)|0;q=n;c[q>>2]=o;c[q+4>>2]=p;q=a+16|0;e=q;t=c[e+4>>2]|0;g=b+16|0;r=c[g>>2]|0;g=c[g+4>>2]|0;e=gk(y|0,0,c[e>>2]|0,0)|0;f=y;gk(e|0,f|0,r|0,0)|0;s=y;r=gk(e|0,f|0,r|0,g|0)|0;t=gk(g|0,0,t|0,0)|0;s=gk(t|0,y|0,s|0,0)|0;t=q;c[t>>2]=r;c[t+4>>2]=s;t=a+24|0;g=t;f=c[g>>2]|0;g=c[g+4>>2]|0;e=b+24|0;h=c[e>>2]|0;e=c[e+4>>2]|0;b=gk(y|0,0,f|0,0)|0;j=y;i=gk(b|0,j|0,h|0,e|0)|0;gk(0,e|0,f|0,g|0)|0;gk(h|0,y|0,b|0,j|0)|0;j=y;b=t;c[b>>2]=i;c[b+4>>2]=j;b=4;do{if(!b)break;b=b+-1|0;f=a+(b<<3)|0;e=c[f>>2]|0;f=c[f+4>>2]|0;h=d+(b<<3)|0;g=c[h>>2]|0;h=c[h+4>>2]|0;if(f>>>0<h>>>0|(f|0)==(h|0)&e>>>0<g>>>0){u=6;break}}while(!(f>>>0>h>>>0|(f|0)==(h|0)&e>>>0>g>>>0));if((u|0)==6)return;f=d;u=c[f>>2]|0;f=c[f+4>>2]|0;h=fk(k|0,1,u|0,0)|0;g=y;u=fk(k|0,l|0,u|0,f|0)|0;m=fk(m|0,1,f|0,0)|0;l=(g>>>0<1|(g|0)==1&h>>>0<0)<<31>>31;m=gk(l|0,((l|0)<0)<<31>>31|0,m|0,y|0)|0;l=y;k=a;c[k>>2]=u;c[k+4>>2]=m;k=d+8|0;u=c[k+4>>2]|0;o=fk(o|0,1,c[k>>2]|0,0)|0;m=(l>>>0<1|(l|0)==1&m>>>0<0)<<31>>31;o=gk(m|0,((m|0)<0)<<31>>31|0,o|0,y|0)|0;m=y;p=fk(p|0,1,u|0,0)|0;m=(m>>>0<1|(m|0)==1&o>>>0<0)<<31>>31;p=gk(m|0,((m|0)<0)<<31>>31|0,p|0,y|0)|0;m=y;u=n;c[u>>2]=o;c[u+4>>2]=p;u=d+16|0;o=c[u+4>>2]|0;u=fk(r|0,1,c[u>>2]|0,0)|0;p=(m>>>0<1|(m|0)==1&p>>>0<0)<<31>>31;u=gk(p|0,((p|0)<0)<<31>>31|0,u|0,y|0)|0;p=y;s=fk(s|0,1,o|0,0)|0;p=(p>>>0<1|(p|0)==1&u>>>0<0)<<31>>31;s=gk(p|0,((p|0)<0)<<31>>31|0,s|0,y|0)|0;p=y;r=q;c[r>>2]=u;c[r+4>>2]=s;r=d+24|0;u=c[r+4>>2]|0;r=fk(i|0,1,c[r>>2]|0,0)|0;s=(p>>>0<1|(p|0)==1&s>>>0<0)<<31>>31;r=gk(s|0,((s|0)<0)<<31>>31|0,r|0,y|0)|0;s=y;u=fk(j|0,0,u|0,0)|0;s=(s>>>0<1|(s|0)==1&r>>>0<0)<<31>>31;s=gk(u|0,y|0,s|0,((s|0)<0)<<31>>31|0)|0;u=t;c[u>>2]=r;c[u+4>>2]=s;return}function Lc(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;i=4;while(1){if(!i){i=6;break}i=i+-1|0;f=a+(i<<3)|0;e=c[f>>2]|0;f=c[f+4>>2]|0;h=b+(i<<3)|0;g=c[h>>2]|0;h=c[h+4>>2]|0;if(f>>>0<h>>>0|(f|0)==(h|0)&e>>>0<g>>>0){i=5;break}if(f>>>0>h>>>0|(f|0)==(h|0)&e>>>0>g>>>0){i=6;break}}if((i|0)==5){g=a;h=c[g>>2]|0;g=c[g+4>>2]|0;m=d;e=c[m>>2]|0;m=c[m+4>>2]|0;gk(e|0,0,h|0,0)|0;j=y;h=gk(e|0,m|0,h|0,g|0)|0;g=gk(m|0,0,g|0,0)|0;j=gk(g|0,y|0,j|0,0)|0;g=a;c[g>>2]=h;c[g+4>>2]=j;g=a+8|0;j=g;h=c[j+4>>2]|0;m=d+8|0;e=c[m>>2]|0;m=c[m+4>>2]|0;j=gk(y|0,0,c[j>>2]|0,0)|0;l=y;gk(j|0,l|0,e|0,0)|0;i=y;e=gk(j|0,l|0,e|0,m|0)|0;h=gk(m|0,0,h|0,0)|0;i=gk(h|0,y|0,i|0,0)|0;h=g;c[h>>2]=e;c[h+4>>2]=i;h=a+16|0;i=h;e=c[i+4>>2]|0;m=d+16|0;l=c[m>>2]|0;m=c[m+4>>2]|0;i=gk(y|0,0,c[i>>2]|0,0)|0;j=y;gk(i|0,j|0,l|0,0)|0;k=y;l=gk(i|0,j|0,l|0,m|0)|0;e=gk(m|0,0,e|0,0)|0;k=gk(e|0,y|0,k|0,0)|0;e=h;c[e>>2]=l;c[e+4>>2]=k;e=a+24|0;k=e;l=c[k>>2]|0;k=c[k+4>>2]|0;m=d+24|0;j=c[m>>2]|0;m=c[m+4>>2]|0;i=gk(y|0,0,l|0,0)|0;f=y;d=gk(i|0,f|0,j|0,m|0)|0;gk(0,m|0,l|0,k|0)|0;gk(j|0,y|0,i|0,f|0)|0;f=e;c[f>>2]=d;c[f+4>>2]=y;f=a;}else if((i|0)==6){f=a;g=a+8|0;h=a+16|0;e=a+24|0;}d=f;a=c[d>>2]|0;d=c[d+4>>2]|0;k=b;m=c[k>>2]|0;k=c[k+4>>2]|0;j=fk(a|0,1,m|0,0)|0;l=y;m=fk(a|0,d|0,m|0,k|0)|0;k=fk(d|0,1,k|0,0)|0;j=(l>>>0<1|(l|0)==1&j>>>0<0)<<31>>31;k=gk(j|0,((j|0)<0)<<31>>31|0,k|0,y|0)|0;j=y;l=f;c[l>>2]=m;c[l+4>>2]=k;l=g;m=c[l+4>>2]|0;d=b+8|0;a=c[d+4>>2]|0;d=fk(c[l>>2]|0,1,c[d>>2]|0,0)|0;k=(j>>>0<1|(j|0)==1&k>>>0<0)<<31>>31;d=gk(k|0,((k|0)<0)<<31>>31|0,d|0,y|0)|0;k=y;a=fk(m|0,1,a|0,0)|0;k=(k>>>0<1|(k|0)==1&d>>>0<0)<<31>>31;a=gk(k|0,((k|0)<0)<<31>>31|0,a|0,y|0)|0;k=y;m=g;c[m>>2]=d;c[m+4>>2]=a;m=h;d=c[m+4>>2]|0;j=b+16|0;l=c[j+4>>2]|0;j=fk(c[m>>2]|0,1,c[j>>2]|0,0)|0;a=(k>>>0<1|(k|0)==1&a>>>0<0)<<31>>31;j=gk(a|0,((a|0)<0)<<31>>31|0,j|0,y|0)|0;a=y;l=fk(d|0,1,l|0,0)|0;a=(a>>>0<1|(a|0)==1&j>>>0<0)<<31>>31;l=gk(a|0,((a|0)<0)<<31>>31|0,l|0,y|0)|0;a=y;d=h;c[d>>2]=j;c[d+4>>2]=l;d=e;j=c[d+4>>2]|0;k=b+24|0;m=c[k+4>>2]|0;k=fk(c[d>>2]|0,1,c[k>>2]|0,0)|0;l=(a>>>0<1|(a|0)==1&l>>>0<0)<<31>>31;k=gk(l|0,((l|0)<0)<<31>>31|0,k|0,y|0)|0;l=y;m=fk(j|0,0,m|0,0)|0;l=(l>>>0<1|(l|0)==1&k>>>0<0)<<31>>31;l=gk(m|0,y|0,l|0,((l|0)<0)<<31>>31|0)|0;m=e;c[m>>2]=k;c[m+4>>2]=l;return}function Mc(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,z=0,A=0,B=0,C=0,D=0,E=0;x=l;l=l+64|0;v=x;g=v;h=g+64|0;do{c[g>>2]=0;g=g+4|0;}while((g|0)<(h|0));t=a+32|0;u=b+32|0;o=a;p=0;do{r=o;o=o+8|0;g=v+(p<<3)|0;q=c[r>>2]|0;r=c[r+4>>2]|0;a:do if(!((q|0)==0&(r|0)==0)){s=g+(8-p<<3)|0;h=b;m=0;n=0;while(1){k=g;g=g+8|0;if((h|0)==(u|0))if((m|0)==0&(n|0)==0)break a;else {h=u;i=0;j=0;}else {j=h;h=h+8|0;i=c[j>>2]|0;j=c[j+4>>2]|0;}E=k;D=c[E>>2]|0;E=c[E+4>>2]|0;z=qk(i|0,0,q|0,0)|0;D=gk(z|0,y|0,D|0,0)|0;z=y;gk(D|0,z|0,m|0,0)|0;C=y;z=gk(D|0,z|0,m|0,n|0)|0;D=qk(i|0,0,r|0,0)|0;B=y;i=qk(j|0,0,q|0,0)|0;A=y;n=gk(E|0,0,n|0,0)|0;n=gk(n|0,y|0,D|0,0)|0;i=gk(n|0,y|0,i|0,0)|0;i=gk(i|0,y|0,C|0,0)|0;n=y;j=qk(j|0,0,r|0,0)|0;j=gk(B|0,0,j|0,y|0)|0;j=gk(j|0,y|0,A|0,0)|0;m=gk(j|0,y|0,n|0,0)|0;n=k;c[n>>2]=z;c[n+4>>2]=i;if((g|0)==(s|0))break;else n=y;}}while(0);p=p+1|0;}while((o|0)!=(t|0));o=d+32|0;p=0;do{g=v+(p<<3)|0;q=g;q=qk(c[q>>2]|0,c[q+4>>2]|0,e|0,f|0)|0;r=y;b:do if(!((q|0)==0&(r|0)==0)){s=g+(8-p<<3)|0;h=d;j=0;k=0;while(1){i=g;g=g+8|0;if((h|0)==(o|0))if((j|0)==0&(k|0)==0)break b;else {m=0;n=0;h=o;}else {n=h;m=c[n>>2]|0;n=c[n+4>>2]|0;h=h+8|0;}b=i;A=c[b>>2]|0;b=c[b+4>>2]|0;C=qk(m|0,0,q|0,0)|0;A=gk(C|0,y|0,A|0,0)|0;C=y;gk(A|0,C|0,j|0,0)|0;D=y;C=gk(A|0,C|0,j|0,k|0)|0;A=qk(m|0,0,r|0,0)|0;z=y;E=qk(n|0,0,q|0,0)|0;B=y;b=gk(b|0,0,k|0,0)|0;A=gk(b|0,y|0,A|0,0)|0;E=gk(A|0,y|0,E|0,0)|0;D=gk(E|0,y|0,D|0,0)|0;E=y;A=qk(n|0,0,r|0,0)|0;A=gk(z|0,0,A|0,y|0)|0;B=gk(A|0,y|0,B|0,0)|0;j=gk(B|0,y|0,E|0,0)|0;E=i;c[E>>2]=C;c[E+4>>2]=D;if((g|0)==(s|0))break;else k=y;}}while(0);p=p+1|0;}while(p>>>0<4);g=v+32|0;c[a>>2]=c[g>>2];c[a+4>>2]=c[g+4>>2];c[a+8>>2]=c[g+8>>2];c[a+12>>2]=c[g+12>>2];c[a+16>>2]=c[g+16>>2];c[a+20>>2]=c[g+20>>2];c[a+24>>2]=c[g+24>>2];c[a+28>>2]=c[g+28>>2];g=4;do{if(!g)break;g=g+-1|0;i=a+(g<<3)|0;h=c[i>>2]|0;i=c[i+4>>2]|0;k=d+(g<<3)|0;j=c[k>>2]|0;k=c[k+4>>2]|0;if(i>>>0<k>>>0|(i|0)==(k|0)&h>>>0<j>>>0){w=22;break}}while(!(i>>>0>k>>>0|(i|0)==(k|0)&h>>>0>j>>>0));if((w|0)==22){l=x;return}A=a;B=c[A>>2]|0;A=c[A+4>>2]|0;C=d;D=c[C>>2]|0;C=c[C+4>>2]|0;w=fk(B|0,1,D|0,0)|0;E=y;D=fk(B|0,A|0,D|0,C|0)|0;C=fk(A|0,1,C|0,0)|0;w=(E>>>0<1|(E|0)==1&w>>>0<0)<<31>>31;C=gk(w|0,((w|0)<0)<<31>>31|0,C|0,y|0)|0;w=y;E=a;c[E>>2]=D;c[E+4>>2]=C;E=a+8|0;D=E;A=c[D+4>>2]|0;B=d+8|0;z=c[B+4>>2]|0;B=fk(c[D>>2]|0,1,c[B>>2]|0,0)|0;C=(w>>>0<1|(w|0)==1&C>>>0<0)<<31>>31;B=gk(C|0,((C|0)<0)<<31>>31|0,B|0,y|0)|0;C=y;z=fk(A|0,1,z|0,0)|0;C=(C>>>0<1|(C|0)==1&B>>>0<0)<<31>>31;z=gk(C|0,((C|0)<0)<<31>>31|0,z|0,y|0)|0;C=y;c[E>>2]=B;c[E+4>>2]=z;E=a+16|0;B=E;A=c[B+4>>2]|0;w=d+16|0;D=c[w+4>>2]|0;w=fk(c[B>>2]|0,1,c[w>>2]|0,0)|0;z=(C>>>0<1|(C|0)==1&z>>>0<0)<<31>>31;w=gk(z|0,((z|0)<0)<<31>>31|0,w|0,y|0)|0;z=y;D=fk(A|0,1,D|0,0)|0;z=(z>>>0<1|(z|0)==1&w>>>0<0)<<31>>31;D=gk(z|0,((z|0)<0)<<31>>31|0,D|0,y|0)|0;z=y;c[E>>2]=w;c[E+4>>2]=D;E=a+24|0;w=E;A=c[w+4>>2]|0;C=d+24|0;B=c[C+4>>2]|0;C=fk(c[w>>2]|0,1,c[C>>2]|0,0)|0;D=(z>>>0<1|(z|0)==1&D>>>0<0)<<31>>31;C=gk(D|0,((D|0)<0)<<31>>31|0,C|0,y|0)|0;D=y;B=fk(A|0,0,B|0,0)|0;D=(D>>>0<1|(D|0)==1&C>>>0<0)<<31>>31;D=gk(B|0,y|0,D|0,((D|0)<0)<<31>>31|0)|0;c[E>>2]=C;c[E+4>>2]=D;l=x;return}function Nc(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0;j=l;l=l+32|0;h=j;c[h>>2]=0;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[h+16>>2]=0;c[h+20>>2]=0;c[h+24>>2]=0;c[h+28>>2]=0;i=4;while(1){if(!i){d=5;break}i=i+-1|0;e=a+(i<<3)|0;d=c[e>>2]|0;e=c[e+4>>2]|0;g=h+(i<<3)|0;f=c[g>>2]|0;g=c[g+4>>2]|0;if(e>>>0<g>>>0|(e|0)==(g|0)&d>>>0<f>>>0){d=5;break}if(e>>>0>g>>>0|(e|0)==(g|0)&d>>>0>f>>>0){d=6;break}}if((d|0)==5){l=j;return}else if((d|0)==6){k=b;d=c[k>>2]|0;k=c[k+4>>2]|0;e=b+8|0;f=c[e>>2]|0;e=c[e+4>>2]|0;h=b+16|0;p=c[h>>2]|0;h=c[h+4>>2]|0;q=b+24|0;r=c[q>>2]|0;q=c[q+4>>2]|0;n=a;o=c[n>>2]|0;n=c[n+4>>2]|0;i=fk(d|0,1,o|0,0)|0;m=y;o=fk(d|0,k|0,o|0,n|0)|0;n=fk(k|0,1,n|0,0)|0;i=(m>>>0<1|(m|0)==1&i>>>0<0)<<31>>31;n=gk(i|0,((i|0)<0)<<31>>31|0,n|0,y|0)|0;i=y;m=a+8|0;k=m;d=c[k+4>>2]|0;k=fk(f|0,1,c[k>>2]|0,0)|0;i=(i>>>0<1|(i|0)==1&n>>>0<0)<<31>>31;k=gk(i|0,((i|0)<0)<<31>>31|0,k|0,y|0)|0;i=y;d=fk(e|0,1,d|0,0)|0;i=(i>>>0<1|(i|0)==1&k>>>0<0)<<31>>31;d=gk(i|0,((i|0)<0)<<31>>31|0,d|0,y|0)|0;i=y;e=a+16|0;f=e;g=c[f+4>>2]|0;f=fk(p|0,1,c[f>>2]|0,0)|0;i=(i>>>0<1|(i|0)==1&d>>>0<0)<<31>>31;f=gk(i|0,((i|0)<0)<<31>>31|0,f|0,y|0)|0;i=y;g=fk(h|0,1,g|0,0)|0;i=(i>>>0<1|(i|0)==1&f>>>0<0)<<31>>31;g=gk(i|0,((i|0)<0)<<31>>31|0,g|0,y|0)|0;i=y;b=a+24|0;h=b;p=c[h+4>>2]|0;h=fk(r|0,1,c[h>>2]|0,0)|0;i=(i>>>0<1|(i|0)==1&g>>>0<0)<<31>>31;h=gk(i|0,((i|0)<0)<<31>>31|0,h|0,y|0)|0;i=y;p=fk(q|0,0,p|0,0)|0;i=(i>>>0<1|(i|0)==1&h>>>0<0)<<31>>31;i=gk(p|0,y|0,i|0,((i|0)<0)<<31>>31|0)|0;c[a>>2]=o;c[a+4>>2]=n;a=m;c[a>>2]=k;c[a+4>>2]=d;a=e;c[a>>2]=f;c[a+4>>2]=g;c[b>>2]=h;c[b+4>>2]=i;l=j;return}}
function Oc(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0;Z=l;l=l+192|0;E=Z+160|0;N=Z+128|0;R=Z+96|0;W=Z+64|0;X=Z+32|0;Y=Z;c[Y>>2]=c[a>>2];c[Y+4>>2]=c[a+4>>2];c[Y+8>>2]=c[a+8>>2];c[Y+12>>2]=c[a+12>>2];c[Y+16>>2]=c[a+16>>2];c[Y+20>>2]=c[a+20>>2];c[Y+24>>2]=c[a+24>>2];c[Y+28>>2]=c[a+28>>2];c[X>>2]=c[b>>2];c[X+4>>2]=c[b+4>>2];c[X+8>>2]=c[b+8>>2];c[X+12>>2]=c[b+12>>2];c[X+16>>2]=c[b+16>>2];c[X+20>>2]=c[b+20>>2];c[X+24>>2]=c[b+24>>2];c[X+28>>2]=c[b+28>>2];C=W;c[C>>2]=1;c[C+4>>2]=0;C=W+8|0;c[C>>2]=0;c[C+4>>2]=0;c[C+8>>2]=0;c[C+12>>2]=0;c[C+16>>2]=0;c[C+20>>2]=0;c[R>>2]=0;c[R+4>>2]=0;c[R+8>>2]=0;c[R+12>>2]=0;c[R+16>>2]=0;c[R+20>>2]=0;c[R+24>>2]=0;c[R+28>>2]=0;D=N;c[D>>2]=1;c[D+4>>2]=0;D=N+8|0;c[D>>2]=0;c[D+4>>2]=0;c[D+8>>2]=0;c[D+12>>2]=0;c[D+16>>2]=0;c[D+20>>2]=0;a:do if(Xj(Y,N,32)|0){F=E+8|0;G=X+24|0;H=X+16|0;I=X+8|0;J=Y+24|0;K=Y+16|0;L=Y+8|0;O=b;M=c[O>>2]|0;O=c[O+4>>2]|0;Q=b+8|0;P=c[Q>>2]|0;Q=c[Q+4>>2]|0;S=W+16|0;U=b+16|0;T=c[U>>2]|0;U=c[U+4>>2]|0;V=W+24|0;x=b+24|0;w=c[x>>2]|0;x=c[x+4>>2]|0;z=R+8|0;A=R+16|0;B=R+24|0;do{v=E;c[v>>2]=1;c[v+4>>2]=0;c[F>>2]=0;c[F+4>>2]=0;c[F+8>>2]=0;c[F+12>>2]=0;c[F+16>>2]=0;c[F+20>>2]=0;if(!(Xj(X,E,32)|0))break a;d=Y;b=c[d>>2]|0;d=c[d+4>>2]|0;if((b&1|0)==0&0==0){m=W;p=J;r=K;t=L;k=C;j=S;i=V;o=c[p>>2]|0;p=c[p+4>>2]|0;q=c[r>>2]|0;r=c[r+4>>2]|0;s=c[t>>2]|0;t=c[t+4>>2]|0;e=c[m>>2]|0;m=c[m+4>>2]|0;f=c[k>>2]|0;k=c[k+4>>2]|0;g=c[j>>2]|0;j=c[j+4>>2]|0;h=c[i>>2]|0;i=c[i+4>>2]|0;do{v=nk(o|0,p|0,63)|0;u=y;o=kk(o|0,p|0,1)|0;p=y;_=nk(q|0,r|0,63)|0;n=y;$=kk(q|0,r|0,1)|0;q=$|v;r=y|u;u=nk(s|0,t|0,63)|0;v=y;$=kk(s|0,t|0,1)|0;s=$|_;t=y|n;n=kk(b|0,d|0,1)|0;b=u|n;d=v|y;if(!((e&1|0)==0&0==0)){gk(M|0,0,e|0,0)|0;v=y;e=gk(M|0,O|0,e|0,m|0)|0;m=gk(O|0,0,m|0,0)|0;m=gk(m|0,y|0,v|0,0)|0;v=gk(y|0,0,f|0,0)|0;f=y;gk(v|0,f|0,P|0,0)|0;_=y;f=gk(v|0,f|0,P|0,Q|0)|0;k=gk(Q|0,0,k|0,0)|0;k=gk(k|0,y|0,_|0,0)|0;_=gk(y|0,0,g|0,0)|0;g=y;gk(_|0,g|0,T|0,0)|0;v=y;g=gk(_|0,g|0,T|0,U|0)|0;j=gk(U|0,0,j|0,0)|0;j=gk(j|0,y|0,v|0,0)|0;v=gk(y|0,0,h|0,0)|0;_=y;$=gk(v|0,_|0,w|0,x|0)|0;gk(0,x|0,h|0,i|0)|0;gk(w|0,y|0,v|0,_|0)|0;h=$;i=y;}$=nk(h|0,i|0,63)|0;_=y;h=kk(h|0,i|0,1)|0;i=y;u=nk(g|0,j|0,63)|0;v=y;g=kk(g|0,j|0,1)|0;g=g|$;j=y|_;_=nk(f|0,k|0,63)|0;$=y;f=kk(f|0,k|0,1)|0;f=f|u;k=y|v;e=kk(e|0,m|0,1)|0;e=_|e;m=$|y;}while((n&1|0)==0&0==0);v=J;c[v>>2]=o;c[v+4>>2]=p;v=K;c[v>>2]=q;c[v+4>>2]=r;v=L;c[v>>2]=s;c[v+4>>2]=t;v=Y;c[v>>2]=b;c[v+4>>2]=d;v=W;c[v>>2]=e;c[v+4>>2]=m;v=C;c[v>>2]=f;c[v+4>>2]=k;v=S;c[v>>2]=g;c[v+4>>2]=j;v=V;c[v>>2]=h;c[v+4>>2]=i;v=d;}else v=d;i=X;d=c[i>>2]|0;i=c[i+4>>2]|0;if((d&1|0)==0&0==0){h=R;q=G;s=H;u=I;g=z;f=A;e=B;p=c[q>>2]|0;q=c[q+4>>2]|0;r=c[s>>2]|0;s=c[s+4>>2]|0;t=c[u>>2]|0;u=c[u+4>>2]|0;j=c[h>>2]|0;h=c[h+4>>2]|0;k=c[g>>2]|0;g=c[g+4>>2]|0;m=c[f>>2]|0;f=c[f+4>>2]|0;n=c[e>>2]|0;e=c[e+4>>2]|0;do{$=nk(p|0,q|0,63)|0;_=y;p=kk(p|0,q|0,1)|0;q=y;aa=nk(r|0,s|0,63)|0;o=y;ba=kk(r|0,s|0,1)|0;r=ba|$;s=y|_;_=nk(t|0,u|0,63)|0;$=y;ba=kk(t|0,u|0,1)|0;t=ba|aa;u=y|o;o=kk(d|0,i|0,1)|0;d=_|o;i=$|y;if(!((j&1|0)==0&0==0)){gk(M|0,0,j|0,0)|0;$=y;j=gk(M|0,O|0,j|0,h|0)|0;h=gk(O|0,0,h|0,0)|0;h=gk(h|0,y|0,$|0,0)|0;$=gk(y|0,0,k|0,0)|0;k=y;gk($|0,k|0,P|0,0)|0;aa=y;k=gk($|0,k|0,P|0,Q|0)|0;g=gk(Q|0,0,g|0,0)|0;g=gk(g|0,y|0,aa|0,0)|0;aa=gk(y|0,0,m|0,0)|0;m=y;gk(aa|0,m|0,T|0,0)|0;$=y;m=gk(aa|0,m|0,T|0,U|0)|0;f=gk(U|0,0,f|0,0)|0;f=gk(f|0,y|0,$|0,0)|0;$=gk(y|0,0,n|0,0)|0;aa=y;ba=gk($|0,aa|0,w|0,x|0)|0;gk(0,x|0,n|0,e|0)|0;gk(w|0,y|0,$|0,aa|0)|0;n=ba;e=y;}ba=nk(n|0,e|0,63)|0;aa=y;n=kk(n|0,e|0,1)|0;e=y;_=nk(m|0,f|0,63)|0;$=y;m=kk(m|0,f|0,1)|0;m=m|ba;f=y|aa;aa=nk(k|0,g|0,63)|0;ba=y;k=kk(k|0,g|0,1)|0;k=k|_;g=y|$;j=kk(j|0,h|0,1)|0;j=aa|j;h=ba|y;}while((o&1|0)==0&0==0);ba=G;c[ba>>2]=p;c[ba+4>>2]=q;ba=H;c[ba>>2]=r;c[ba+4>>2]=s;ba=I;c[ba>>2]=t;c[ba+4>>2]=u;ba=X;c[ba>>2]=d;c[ba+4>>2]=i;ba=R;c[ba>>2]=j;c[ba+4>>2]=h;j=z;c[j>>2]=k;c[j+4>>2]=g;j=A;c[j>>2]=m;c[j+4>>2]=f;j=B;c[j>>2]=n;c[j+4>>2]=e;j=d;}else j=d;d=4;while(1){if(!d){k=21;break}d=d+-1|0;f=Y+(d<<3)|0;e=c[f>>2]|0;f=c[f+4>>2]|0;h=X+(d<<3)|0;g=c[h>>2]|0;h=c[h+4>>2]|0;if(f>>>0<h>>>0|(f|0)==(h|0)&e>>>0<g>>>0){k=27;break}if(f>>>0>h>>>0|(f|0)==(h|0)&e>>>0>g>>>0){k=21;break}}if((k|0)==21){k=0;$=fk(b|0,1,j|0,0)|0;ba=y;b=fk(b|0,v|0,j|0,i|0)|0;aa=fk(v|0,1,i|0,0)|0;$=(ba>>>0<1|(ba|0)==1&$>>>0<0)<<31>>31;aa=gk($|0,(($|0)<0)<<31>>31|0,aa|0,y|0)|0;$=y;ba=Y;c[ba>>2]=b;c[ba+4>>2]=aa;ba=L;b=c[ba+4>>2]|0;v=I;_=c[v+4>>2]|0;v=fk(c[ba>>2]|0,1,c[v>>2]|0,0)|0;aa=($>>>0<1|($|0)==1&aa>>>0<0)<<31>>31;v=gk(aa|0,((aa|0)<0)<<31>>31|0,v|0,y|0)|0;aa=y;_=fk(b|0,1,_|0,0)|0;aa=(aa>>>0<1|(aa|0)==1&v>>>0<0)<<31>>31;_=gk(aa|0,((aa|0)<0)<<31>>31|0,_|0,y|0)|0;aa=y;b=L;c[b>>2]=v;c[b+4>>2]=_;b=K;v=c[b+4>>2]|0;$=H;ba=c[$+4>>2]|0;$=fk(c[b>>2]|0,1,c[$>>2]|0,0)|0;_=(aa>>>0<1|(aa|0)==1&_>>>0<0)<<31>>31;$=gk(_|0,((_|0)<0)<<31>>31|0,$|0,y|0)|0;_=y;ba=fk(v|0,1,ba|0,0)|0;_=(_>>>0<1|(_|0)==1&$>>>0<0)<<31>>31;ba=gk(_|0,((_|0)<0)<<31>>31|0,ba|0,y|0)|0;_=y;v=K;c[v>>2]=$;c[v+4>>2]=ba;v=J;$=c[v+4>>2]|0;aa=G;b=c[aa+4>>2]|0;aa=fk(c[v>>2]|0,1,c[aa>>2]|0,0)|0;ba=(_>>>0<1|(_|0)==1&ba>>>0<0)<<31>>31;aa=gk(ba|0,((ba|0)<0)<<31>>31|0,aa|0,y|0)|0;ba=y;b=fk($|0,0,b|0,0)|0;ba=(ba>>>0<1|(ba|0)==1&aa>>>0<0)<<31>>31;ba=gk(b|0,y|0,ba|0,((ba|0)<0)<<31>>31|0)|0;b=J;c[b>>2]=aa;c[b+4>>2]=ba;b=4;do{if(!b)break;b=b+-1|0;e=W+(b<<3)|0;d=c[e>>2]|0;e=c[e+4>>2]|0;g=R+(b<<3)|0;f=c[g>>2]|0;g=c[g+4>>2]|0;if(e>>>0<g>>>0|(e|0)==(g|0)&d>>>0<f>>>0){k=25;break}}while(!(e>>>0>g>>>0|(e|0)==(g|0)&d>>>0>f>>>0));if((k|0)==25){v=W;$=c[v>>2]|0;v=c[v+4>>2]|0;gk(M|0,0,$|0,0)|0;ba=y;$=gk(M|0,O|0,$|0,v|0)|0;v=gk(O|0,0,v|0,0)|0;ba=gk(v|0,y|0,ba|0,0)|0;v=W;c[v>>2]=$;c[v+4>>2]=ba;v=C;ba=c[v+4>>2]|0;v=gk(y|0,0,c[v>>2]|0,0)|0;$=y;gk(v|0,$|0,P|0,0)|0;_=y;$=gk(v|0,$|0,P|0,Q|0)|0;ba=gk(Q|0,0,ba|0,0)|0;_=gk(ba|0,y|0,_|0,0)|0;ba=C;c[ba>>2]=$;c[ba+4>>2]=_;ba=S;_=c[ba+4>>2]|0;ba=gk(y|0,0,c[ba>>2]|0,0)|0;$=y;gk(ba|0,$|0,T|0,0)|0;v=y;$=gk(ba|0,$|0,T|0,U|0)|0;_=gk(U|0,0,_|0,0)|0;v=gk(_|0,y|0,v|0,0)|0;_=S;c[_>>2]=$;c[_+4>>2]=v;_=V;v=c[_>>2]|0;_=c[_+4>>2]|0;$=gk(y|0,0,v|0,0)|0;ba=y;aa=gk($|0,ba|0,w|0,x|0)|0;gk(0,x|0,v|0,_|0)|0;gk(w|0,y|0,$|0,ba|0)|0;ba=V;c[ba>>2]=aa;c[ba+4>>2]=y;}g=W;b=c[g>>2]|0;g=c[g+4>>2]|0;h=R;d=c[h>>2]|0;h=c[h+4>>2]|0;j=fk(b|0,1,d|0,0)|0;i=y;d=fk(b|0,g|0,d|0,h|0)|0;b=W;e=W;f=R;}else if((k|0)==27){k=0;$=fk(j|0,1,b|0,0)|0;ba=y;b=fk(j|0,i|0,b|0,v|0)|0;aa=fk(i|0,1,v|0,0)|0;$=(ba>>>0<1|(ba|0)==1&$>>>0<0)<<31>>31;aa=gk($|0,(($|0)<0)<<31>>31|0,aa|0,y|0)|0;$=y;ba=X;c[ba>>2]=b;c[ba+4>>2]=aa;ba=I;b=c[ba+4>>2]|0;v=L;_=c[v+4>>2]|0;v=fk(c[ba>>2]|0,1,c[v>>2]|0,0)|0;aa=($>>>0<1|($|0)==1&aa>>>0<0)<<31>>31;v=gk(aa|0,((aa|0)<0)<<31>>31|0,v|0,y|0)|0;aa=y;_=fk(b|0,1,_|0,0)|0;aa=(aa>>>0<1|(aa|0)==1&v>>>0<0)<<31>>31;_=gk(aa|0,((aa|0)<0)<<31>>31|0,_|0,y|0)|0;aa=y;b=I;c[b>>2]=v;c[b+4>>2]=_;b=H;v=c[b+4>>2]|0;$=K;ba=c[$+4>>2]|0;$=fk(c[b>>2]|0,1,c[$>>2]|0,0)|0;_=(aa>>>0<1|(aa|0)==1&_>>>0<0)<<31>>31;$=gk(_|0,((_|0)<0)<<31>>31|0,$|0,y|0)|0;_=y;ba=fk(v|0,1,ba|0,0)|0;_=(_>>>0<1|(_|0)==1&$>>>0<0)<<31>>31;ba=gk(_|0,((_|0)<0)<<31>>31|0,ba|0,y|0)|0;_=y;v=H;c[v>>2]=$;c[v+4>>2]=ba;v=G;$=c[v+4>>2]|0;aa=J;b=c[aa+4>>2]|0;aa=fk(c[v>>2]|0,1,c[aa>>2]|0,0)|0;ba=(_>>>0<1|(_|0)==1&ba>>>0<0)<<31>>31;aa=gk(ba|0,((ba|0)<0)<<31>>31|0,aa|0,y|0)|0;ba=y;b=fk($|0,0,b|0,0)|0;ba=(ba>>>0<1|(ba|0)==1&aa>>>0<0)<<31>>31;ba=gk(b|0,y|0,ba|0,((ba|0)<0)<<31>>31|0)|0;b=G;c[b>>2]=aa;c[b+4>>2]=ba;b=4;do{if(!b)break;b=b+-1|0;e=R+(b<<3)|0;d=c[e>>2]|0;e=c[e+4>>2]|0;g=W+(b<<3)|0;f=c[g>>2]|0;g=c[g+4>>2]|0;if(e>>>0<g>>>0|(e|0)==(g|0)&d>>>0<f>>>0){k=31;break}}while(!(e>>>0>g>>>0|(e|0)==(g|0)&d>>>0>f>>>0));if((k|0)==31){v=R;$=c[v>>2]|0;v=c[v+4>>2]|0;gk(M|0,0,$|0,0)|0;ba=y;$=gk(M|0,O|0,$|0,v|0)|0;v=gk(O|0,0,v|0,0)|0;ba=gk(v|0,y|0,ba|0,0)|0;v=R;c[v>>2]=$;c[v+4>>2]=ba;v=z;ba=c[v+4>>2]|0;v=gk(y|0,0,c[v>>2]|0,0)|0;$=y;gk(v|0,$|0,P|0,0)|0;_=y;$=gk(v|0,$|0,P|0,Q|0)|0;ba=gk(Q|0,0,ba|0,0)|0;_=gk(ba|0,y|0,_|0,0)|0;ba=z;c[ba>>2]=$;c[ba+4>>2]=_;ba=A;_=c[ba+4>>2]|0;ba=gk(y|0,0,c[ba>>2]|0,0)|0;$=y;gk(ba|0,$|0,T|0,0)|0;v=y;$=gk(ba|0,$|0,T|0,U|0)|0;_=gk(U|0,0,_|0,0)|0;v=gk(_|0,y|0,v|0,0)|0;_=A;c[_>>2]=$;c[_+4>>2]=v;_=B;v=c[_>>2]|0;_=c[_+4>>2]|0;$=gk(y|0,0,v|0,0)|0;ba=y;aa=gk($|0,ba|0,w|0,x|0)|0;gk(0,x|0,v|0,_|0)|0;gk(w|0,y|0,$|0,ba|0)|0;ba=B;c[ba>>2]=aa;c[ba+4>>2]=y;}g=R;b=c[g>>2]|0;g=c[g+4>>2]|0;h=W;d=c[h>>2]|0;h=c[h+4>>2]|0;j=fk(b|0,1,d|0,0)|0;i=y;d=fk(b|0,g|0,d|0,h|0)|0;b=R;e=R;f=W;}_=fk(g|0,1,h|0,0)|0;t=(i>>>0<1|(i|0)==1&j>>>0<0)<<31>>31;_=gk(t|0,((t|0)<0)<<31>>31|0,_|0,y|0)|0;t=y;ba=b;c[ba>>2]=d;c[ba+4>>2]=_;ba=e+8|0;aa=ba;v=c[aa+4>>2]|0;$=f+8|0;u=c[$+4>>2]|0;$=fk(c[aa>>2]|0,1,c[$>>2]|0,0)|0;_=(t>>>0<1|(t|0)==1&_>>>0<0)<<31>>31;_=gk($|0,y|0,_|0,((_|0)<0)<<31>>31|0)|0;$=y;u=fk(v|0,1,u|0,0)|0;$=($>>>0<1|($|0)==1&_>>>0<0)<<31>>31;u=gk($|0,(($|0)<0)<<31>>31|0,u|0,y|0)|0;$=y;c[ba>>2]=_;c[ba+4>>2]=u;ba=e+16|0;_=ba;v=c[_+4>>2]|0;t=f+16|0;aa=c[t+4>>2]|0;t=fk(c[_>>2]|0,1,c[t>>2]|0,0)|0;u=($>>>0<1|($|0)==1&u>>>0<0)<<31>>31;t=gk(u|0,((u|0)<0)<<31>>31|0,t|0,y|0)|0;u=y;aa=fk(v|0,1,aa|0,0)|0;u=(u>>>0<1|(u|0)==1&t>>>0<0)<<31>>31;aa=gk(u|0,((u|0)<0)<<31>>31|0,aa|0,y|0)|0;u=y;c[ba>>2]=t;c[ba+4>>2]=aa;ba=e+24|0;t=ba;v=c[t+4>>2]|0;$=f+24|0;_=c[$+4>>2]|0;$=fk(c[t>>2]|0,1,c[$>>2]|0,0)|0;aa=(u>>>0<1|(u|0)==1&aa>>>0<0)<<31>>31;$=gk(aa|0,((aa|0)<0)<<31>>31|0,$|0,y|0)|0;aa=y;_=fk(v|0,0,_|0,0)|0;aa=(aa>>>0<1|(aa|0)==1&$>>>0<0)<<31>>31;aa=gk(_|0,y|0,aa|0,((aa|0)<0)<<31>>31|0)|0;c[ba>>2]=$;c[ba+4>>2]=aa;ba=N;c[ba>>2]=1;c[ba+4>>2]=0;c[D>>2]=0;c[D+4>>2]=0;c[D+8>>2]=0;c[D+12>>2]=0;c[D+16>>2]=0;c[D+20>>2]=0;}while((Xj(Y,N,32)|0)!=0)}while(0);ba=E;c[ba>>2]=1;c[ba+4>>2]=0;ba=E+8|0;c[ba>>2]=0;c[ba+4>>2]=0;c[ba+8>>2]=0;c[ba+12>>2]=0;c[ba+16>>2]=0;c[ba+20>>2]=0;if(!(Xj(Y,E,32)|0)){c[a>>2]=c[W>>2];c[a+4>>2]=c[W+4>>2];c[a+8>>2]=c[W+8>>2];c[a+12>>2]=c[W+12>>2];c[a+16>>2]=c[W+16>>2];c[a+20>>2]=c[W+20>>2];c[a+24>>2]=c[W+24>>2];c[a+28>>2]=c[W+28>>2];l=Z;return}else {c[a>>2]=c[R>>2];c[a+4>>2]=c[R+4>>2];c[a+8>>2]=c[R+8>>2];c[a+12>>2]=c[R+12>>2];c[a+16>>2]=c[R+16>>2];c[a+20>>2]=c[R+20>>2];c[a+24>>2]=c[R+24>>2];c[a+28>>2]=c[R+28>>2];l=Z;return}}function Pc(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0;f=a;i=c[f>>2]|0;f=c[f+4>>2]|0;j=b;d=c[j>>2]|0;j=c[j+4>>2]|0;g=fk(i|0,1,d|0,0)|0;e=y;d=fk(i|0,f|0,d|0,j|0)|0;j=fk(f|0,1,j|0,0)|0;g=(e>>>0<1|(e|0)==1&g>>>0<0)<<31>>31;j=gk(g|0,((g|0)<0)<<31>>31|0,j|0,y|0)|0;g=y;e=a;c[e>>2]=d;c[e+4>>2]=j;e=a+8|0;d=e;f=c[d+4>>2]|0;i=b+8|0;h=c[i+4>>2]|0;i=fk(c[d>>2]|0,1,c[i>>2]|0,0)|0;j=fk(i|0,y|0,(g>>>0<1|(g|0)==1&j>>>0<0)&1|0,0)|0;g=y;h=fk(f|0,1,h|0,0)|0;g=(g>>>0<1|(g|0)==1&j>>>0<0)<<31>>31;h=gk(g|0,((g|0)<0)<<31>>31|0,h|0,y|0)|0;g=y;c[e>>2]=j;c[e+4>>2]=h;e=a+16|0;j=e;f=c[j+4>>2]|0;i=b+16|0;d=c[i+4>>2]|0;i=fk(c[j>>2]|0,1,c[i>>2]|0,0)|0;h=fk(i|0,y|0,(g>>>0<1|(g|0)==1&h>>>0<0)&1|0,0)|0;g=y;d=fk(f|0,1,d|0,0)|0;g=(g>>>0<1|(g|0)==1&h>>>0<0)<<31>>31;d=gk(g|0,((g|0)<0)<<31>>31|0,d|0,y|0)|0;g=y;c[e>>2]=h;c[e+4>>2]=d;e=a+24|0;h=e;f=c[h+4>>2]|0;b=b+24|0;a=c[b+4>>2]|0;b=fk(c[h>>2]|0,1,c[b>>2]|0,0)|0;d=fk(b|0,y|0,(g>>>0<1|(g|0)==1&d>>>0<0)&1|0,0)|0;b=y;a=fk(f|0,0,a|0,0)|0;b=(b>>>0<1|(b|0)==1&d>>>0<0)<<31>>31;a=gk(b|0,((b|0)<0)<<31>>31|0,a|0,y|0)|0;b=e;c[b>>2]=d;c[b+4>>2]=a;return}function Qc(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;g=4;while(1){if(!g){a=0;b=5;break}g=g+-1|0;d=a+(g<<3)|0;h=c[d>>2]|0;d=c[d+4>>2]|0;f=b+(g<<3)|0;e=c[f>>2]|0;f=c[f+4>>2]|0;if(d>>>0<f>>>0|(d|0)==(f|0)&h>>>0<e>>>0){a=1;b=5;break}if(d>>>0>f>>>0|(d|0)==(f|0)&h>>>0>e>>>0){a=0;b=5;break}}if((b|0)==5)return a|0;return 0}function Rc(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;L=l;l=l+10896|0;q=L+10504|0;B=L+10120|0;F=L+10056|0;G=L+9992|0;H=L+9800|0;I=L+9608|0;J=L+9224|0;K=L+8840|0;f=L+8456|0;g=L+8064|0;h=L+7680|0;i=L+7296|0;j=L+6912|0;k=L+6528|0;m=L+6144|0;n=L+5760|0;o=L+5376|0;p=L+4992|0;r=L+4608|0;s=L+4224|0;t=L+3840|0;u=L+3456|0;v=L+3072|0;w=L+2688|0;x=L+2304|0;y=L+1920|0;z=L+1536|0;A=L+1152|0;C=L+768|0;D=L+384|0;E=L;ok(q|0,b|0,384)|0;Sc(g,q);e=g;if((c[e>>2]|0)==1&(c[e+4>>2]|0)==0){ok(f|0,b|0,192)|0;ok(q|0,b+192|0,192)|0;bd(B,q);ok(f+192|0,B|0,192)|0;ok(B|0,f|0,384)|0;ok(q|0,g+8|0,384)|0;Tc(K,B,q);Zc(J,K,2);Zc(H,K+192|0,2);b=B;d=H;e=b+64|0;do{c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;}while((b|0)<(e|0));b=q;c[b>>2]=16391154;c[b+4>>2]=-896696315;b=q+8|0;c[b>>2]=1756600169;c[b+4>>2]=-255470060;b=q+16|0;c[b>>2]=-1391639528;c[b+4>>2]=236982897;b=q+24|0;c[b>>2]=-1160227098;c[b+4>>2]=69799781;b=q+32|0;c[b>>2]=0;c[b+4>>2]=0;c[b+8>>2]=0;c[b+12>>2]=0;c[b+16>>2]=0;c[b+20>>2]=0;c[b+24>>2]=0;c[b+28>>2]=0;cd(I,B,q);b=B;d=H+64|0;e=b+64|0;do{c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;}while((b|0)<(e|0));b=q;c[b>>2]=16391154;c[b+4>>2]=-896696315;b=q+8|0;c[b>>2]=1756600169;c[b+4>>2]=-255470060;b=q+16|0;c[b>>2]=-1391639528;c[b+4>>2]=236982897;b=q+24|0;c[b>>2]=-1160227098;c[b+4>>2]=69799781;b=q+32|0;c[b>>2]=0;c[b+4>>2]=0;c[b+8>>2]=0;c[b+12>>2]=0;c[b+16>>2]=0;c[b+20>>2]=0;c[b+24>>2]=0;c[b+28>>2]=0;cd(G,B,q);b=B;d=H+128|0;e=b+64|0;do{c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;}while((b|0)<(e|0));b=q;c[b>>2]=16391154;c[b+4>>2]=-896696315;b=q+8|0;c[b>>2]=1756600169;c[b+4>>2]=-255470060;b=q+16|0;c[b>>2]=-1391639528;c[b+4>>2]=236982897;b=q+24|0;c[b>>2]=-1160227098;c[b+4>>2]=69799781;b=q+32|0;c[b>>2]=0;c[b+4>>2]=0;c[b+8>>2]=0;c[b+12>>2]=0;c[b+16>>2]=0;c[b+20>>2]=0;c[b+24>>2]=0;c[b+28>>2]=0;cd(F,B,q);b=I+64|0;d=G;e=b+64|0;do{c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;}while((b|0)<(e|0));b=I+128|0;d=F;e=b+64|0;do{c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;}while((b|0)<(e|0));ok(J+192|0,I|0,192)|0;ok(B|0,J|0,384)|0;ok(q|0,K|0,384)|0;Tc(E,B,q);ok(D|0,E|0,384)|0;ok(A|0,E|0,384)|0;Uc(z,A);Vc(y,z);Vc(x,y);ok(B|0,x|0,384)|0;ok(q|0,y|0,384)|0;Tc(w,B,q);Uc(v,w);Vc(u,v);Uc(t,u);ok(s|0,w|0,192)|0;ok(q|0,w+192|0,192)|0;bd(B,q);ok(s+192|0,B|0,192)|0;ok(r|0,t|0,192)|0;ok(q|0,t+192|0,192)|0;bd(B,q);ok(r+192|0,B|0,192)|0;ok(B|0,r|0,384)|0;ok(q|0,v|0,384)|0;Tc(p,B,q);ok(B|0,p|0,384)|0;ok(q|0,s|0,384)|0;Tc(o,B,q);ok(B|0,o|0,384)|0;ok(q|0,y|0,384)|0;Tc(n,B,q);ok(B|0,o|0,384)|0;ok(q|0,v|0,384)|0;Tc(m,B,q);ok(B|0,A|0,384)|0;ok(q|0,m|0,384)|0;Tc(k,B,q);Zc(j,n,1);Zc(H,n+192|0,1);b=B;d=H;e=b+64|0;do{c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;}while((b|0)<(e|0));b=q;c[b>>2]=856967431;c[b+4>>2]=-1348753770;b=q+8|0;c[b>>2]=-2018527350;c[b+4>>2]=-898949773;b=q+16|0;c[b>>2]=-259383161;c[b+4>>2]=297659742;b=q+24|0;c[b>>2]=438254204;c[b+4>>2]=49499509;b=q+32|0;c[b>>2]=1279864178;c[b+4>>2]=-1574785501;b=q+40|0;c[b>>2]=1448993115;c[b+4>>2]=-804322652;b=q+48|0;c[b>>2]=1407174950;c[b+4>>2]=-600837214;b=q+56|0;c[b>>2]=-1282828975;c[b+4>>2]=279402262;cd(I,B,q);b=B;d=H+64|0;e=b+64|0;do{c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;}while((b|0)<(e|0));b=q;c[b>>2]=856967431;c[b+4>>2]=-1348753770;b=q+8|0;c[b>>2]=-2018527350;c[b+4>>2]=-898949773;b=q+16|0;c[b>>2]=-259383161;c[b+4>>2]=297659742;b=q+24|0;c[b>>2]=438254204;c[b+4>>2]=49499509;b=q+32|0;c[b>>2]=1279864178;c[b+4>>2]=-1574785501;b=q+40|0;c[b>>2]=1448993115;c[b+4>>2]=-804322652;b=q+48|0;c[b>>2]=1407174950;c[b+4>>2]=-600837214;b=q+56|0;c[b>>2]=-1282828975;c[b+4>>2]=279402262;cd(G,B,q);b=B;d=H+128|0;e=b+64|0;do{c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;}while((b|0)<(e|0));b=q;c[b>>2]=856967431;c[b+4>>2]=-1348753770;b=q+8|0;c[b>>2]=-2018527350;c[b+4>>2]=-898949773;b=q+16|0;c[b>>2]=-259383161;c[b+4>>2]=297659742;b=q+24|0;c[b>>2]=438254204;c[b+4>>2]=49499509;b=q+32|0;c[b>>2]=1279864178;c[b+4>>2]=-1574785501;b=q+40|0;c[b>>2]=1448993115;c[b+4>>2]=-804322652;b=q+48|0;c[b>>2]=1407174950;c[b+4>>2]=-600837214;b=q+56|0;c[b>>2]=-1282828975;c[b+4>>2]=279402262;cd(F,B,q);b=I+64|0;d=G;e=b+64|0;do{c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;}while((b|0)<(e|0));b=I+128|0;d=F;e=b+64|0;do{c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;}while((b|0)<(e|0));ok(j+192|0,I|0,192)|0;ok(B|0,j|0,384)|0;ok(q|0,k|0,384)|0;Tc(i,B,q);Zc(h,o,2);Zc(H,o+192|0,2);b=B;d=H;e=b+64|0;do{c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;}while((b|0)<(e|0));b=q;c[b>>2]=16391154;c[b+4>>2]=-896696315;b=q+8|0;c[b>>2]=1756600169;c[b+4>>2]=-255470060;b=q+16|0;c[b>>2]=-1391639528;c[b+4>>2]=236982897;b=q+24|0;c[b>>2]=-1160227098;c[b+4>>2]=69799781;b=q+32|0;c[b>>2]=0;c[b+4>>2]=0;c[b+8>>2]=0;c[b+12>>2]=0;c[b+16>>2]=0;c[b+20>>2]=0;c[b+24>>2]=0;c[b+28>>2]=0;cd(I,B,q);b=B;d=H+64|0;e=b+64|0;do{c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;}while((b|0)<(e|0));b=q;c[b>>2]=16391154;c[b+4>>2]=-896696315;b=q+8|0;c[b>>2]=1756600169;c[b+4>>2]=-255470060;b=q+16|0;c[b>>2]=-1391639528;c[b+4>>2]=236982897;b=q+24|0;c[b>>2]=-1160227098;c[b+4>>2]=69799781;b=q+32|0;c[b>>2]=0;c[b+4>>2]=0;c[b+8>>2]=0;c[b+12>>2]=0;c[b+16>>2]=0;c[b+20>>2]=0;c[b+24>>2]=0;c[b+28>>2]=0;cd(G,B,q);b=B;d=H+128|0;e=b+64|0;do{c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;}while((b|0)<(e|0));b=q;c[b>>2]=16391154;c[b+4>>2]=-896696315;b=q+8|0;c[b>>2]=1756600169;c[b+4>>2]=-255470060;b=q+16|0;c[b>>2]=-1391639528;c[b+4>>2]=236982897;b=q+24|0;c[b>>2]=-1160227098;c[b+4>>2]=69799781;b=q+32|0;c[b>>2]=0;c[b+4>>2]=0;c[b+8>>2]=0;c[b+12>>2]=0;c[b+16>>2]=0;c[b+20>>2]=0;c[b+24>>2]=0;c[b+28>>2]=0;cd(F,B,q);b=I+64|0;d=G;e=b+64|0;do{c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;}while((b|0)<(e|0));b=I+128|0;d=F;e=b+64|0;do{c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;}while((b|0)<(e|0));ok(h+192|0,I|0,192)|0;ok(B|0,h|0,384)|0;ok(q|0,i|0,384)|0;Tc(g,B,q);ok(f|0,A|0,192)|0;ok(q|0,A+192|0,192)|0;bd(B,q);ok(f+192|0,B|0,192)|0;ok(B|0,f|0,384)|0;ok(q|0,n|0,384)|0;Tc(K,B,q);Zc(J,K,3);Zc(H,K+192|0,3);b=B;d=H;e=b+64|0;do{c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;}while((b|0)<(e|0));b=q;c[b>>2]=1313266045;c[b+4>>2]=911414808;b=q+8|0;c[b>>2]=-724996705;c[b+4>>2]=183964318;b=q+16|0;c[b>>2]=-904918603;c[b+4>>2]=1704830767;b=q+24|0;c[b>>2]=-2086531805;c[b+4>>2]=135359881;b=q+32|0;c[b>>2]=-1013180103;c[b+4>>2]=-1310766345;b=q+40|0;c[b>>2]=-1972125825;c[b+4>>2]=1033831047;b=q+48|0;c[b>>2]=-1934685472;c[b+4>>2]=-1692262254;b=q+56|0;c[b>>2]=-269462362;c[b+4>>2]=644367637;cd(I,B,q);b=B;d=H+64|0;e=b+64|0;do{c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;}while((b|0)<(e|0));b=q;c[b>>2]=1313266045;c[b+4>>2]=911414808;b=q+8|0;c[b>>2]=-724996705;c[b+4>>2]=183964318;b=q+16|0;c[b>>2]=-904918603;c[b+4>>2]=1704830767;b=q+24|0;c[b>>2]=-2086531805;c[b+4>>2]=135359881;b=q+32|0;c[b>>2]=-1013180103;c[b+4>>2]=-1310766345;b=q+40|0;c[b>>2]=-1972125825;c[b+4>>2]=1033831047;b=q+48|0;c[b>>2]=-1934685472;c[b+4>>2]=-1692262254;b=q+56|0;c[b>>2]=-269462362;c[b+4>>2]=644367637;cd(G,B,q);b=B;d=H+128|0;e=b+64|0;do{c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;}while((b|0)<(e|0));b=q;c[b>>2]=1313266045;c[b+4>>2]=911414808;b=q+8|0;c[b>>2]=-724996705;c[b+4>>2]=183964318;b=q+16|0;c[b>>2]=-904918603;c[b+4>>2]=1704830767;b=q+24|0;c[b>>2]=-2086531805;c[b+4>>2]=135359881;b=q+32|0;c[b>>2]=-1013180103;c[b+4>>2]=-1310766345;b=q+40|0;c[b>>2]=-1972125825;c[b+4>>2]=1033831047;b=q+48|0;c[b>>2]=-1934685472;c[b+4>>2]=-1692262254;b=q+56|0;c[b>>2]=-269462362;c[b+4>>2]=644367637;cd(F,B,q);b=I+64|0;d=G;e=b+64|0;do{c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;}while((b|0)<(e|0));b=I+128|0;d=F;e=b+64|0;do{c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;}while((b|0)<(e|0));ok(J+192|0,I|0,192)|0;ok(B|0,J|0,384)|0;ok(q|0,g|0,384)|0;Tc(C,B,q);ok(a+8|0,C|0,384)|0;H=1;J=0;K=a;I=K;c[I>>2]=H;K=K+4|0;c[K>>2]=J;l=L;return}else {H=0;J=0;K=a;I=K;c[I>>2]=H;K=K+4|0;c[K>>2]=J;l=L;return}}function Sc(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;r=l;l=l+2128|0;g=r+1928|0;h=r+1736|0;i=r+1544|0;j=r+1352|0;m=r+968|0;n=r+776|0;o=r+584|0;p=r+392|0;d=r+200|0;e=r;_c(p,b);f=b+192|0;_c(o,f);q=h;s=o+128|0;t=q+64|0;do{c[q>>2]=c[s>>2];q=q+4|0;s=s+4|0;}while((q|0)<(t|0));k=g;c[k>>2]=1091403767;c[k+4>>2]=-167360562;k=g+8|0;c[k>>2]=-753151983;c[k+4>>2]=792555341;k=g+16|0;c[k>>2]=960546513;c[k+4>>2]=692269950;k=g+24|0;c[k>>2]=-1478256553;c[k+4>>2]=496343272;k=g+32|0;c[k>>2]=-980480611;c[k+4>>2]=-748862579;k=g+40|0;c[k>>2]=-171504835;c[k+4>>2]=175696680;k=g+48|0;c[k>>2]=2021213740;c[k+4>>2]=1718526831;k=g+56|0;c[k>>2]=-1710760145;c[k+4>>2]=235567041;cd(m,h,g);k=o+64|0;q=m+64|0;s=o;t=q+64|0;do{c[q>>2]=c[s>>2];q=q+4|0;s=s+4|0;}while((q|0)<(t|0));q=m+128|0;s=k;t=q+64|0;do{c[q>>2]=c[s>>2];q=q+4|0;s=s+4|0;}while((q|0)<(t|0));q=h;s=p;t=q+64|0;do{c[q>>2]=c[s>>2];q=q+4|0;s=s+4|0;}while((q|0)<(t|0));q=g;s=m;t=q+64|0;do{c[q>>2]=c[s>>2];q=q+4|0;s=s+4|0;}while((q|0)<(t|0));fd(d,h,g);q=h;s=p+64|0;t=q+64|0;do{c[q>>2]=c[s>>2];q=q+4|0;s=s+4|0;}while((q|0)<(t|0));q=g;s=o;t=q+64|0;do{c[q>>2]=c[s>>2];q=q+4|0;s=s+4|0;}while((q|0)<(t|0));fd(j,h,g);q=h;s=p+128|0;t=q+64|0;do{c[q>>2]=c[s>>2];q=q+4|0;s=s+4|0;}while((q|0)<(t|0));q=g;s=k;t=q+64|0;do{c[q>>2]=c[s>>2];q=q+4|0;s=s+4|0;}while((q|0)<(t|0));fd(i,h,g);q=d+64|0;s=j;t=q+64|0;do{c[q>>2]=c[s>>2];q=q+4|0;s=s+4|0;}while((q|0)<(t|0));q=d+128|0;s=i;t=q+64|0;do{c[q>>2]=c[s>>2];q=q+4|0;s=s+4|0;}while((q|0)<(t|0));$c(e,d);t=e;if(!((c[t>>2]|0)==1&(c[t+4>>2]|0)==0)){p=0;s=0;t=a;q=t;c[q>>2]=p;t=t+4|0;c[t>>2]=s;l=r;return}p=e+8|0;ok(n|0,p|0,192)|0;ok(h|0,b|0,192)|0;ok(g|0,p|0,192)|0;ad(m,h,g);ok(h|0,f|0,192)|0;ok(g|0,n|0,192)|0;ad(i,h,g);bd(j,i);ok(m+192|0,j|0,192)|0;ok(a+8|0,m|0,384)|0;p=1;s=0;t=a;q=t;c[q>>2]=p;t=t+4|0;c[t>>2]=s;l=r;return}function Tc(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;x=l;l=l+2432|0;r=x+2240|0;s=x+2048|0;t=x+1984|0;u=x+1920|0;v=x+1728|0;k=x+1536|0;m=x+1344|0;e=x+1152|0;f=x+960|0;n=x+768|0;o=x+576|0;p=x+384|0;q=x+192|0;g=x;ok(s|0,b|0,192)|0;ok(r|0,d|0,192)|0;ad(g,s,r);h=b+192|0;ok(s|0,h|0,192)|0;i=d+192|0;ok(r|0,i|0,192)|0;ad(q,s,r);w=s;y=q+128|0;z=w+64|0;do{c[w>>2]=c[y>>2];w=w+4|0;y=y+4|0;}while((w|0)<(z|0));j=r;c[j>>2]=1091403767;c[j+4>>2]=-167360562;j=r+8|0;c[j>>2]=-753151983;c[j+4>>2]=792555341;j=r+16|0;c[j>>2]=960546513;c[j+4>>2]=692269950;j=r+24|0;c[j>>2]=-1478256553;c[j+4>>2]=496343272;j=r+32|0;c[j>>2]=-980480611;c[j+4>>2]=-748862579;j=r+40|0;c[j>>2]=-171504835;c[j+4>>2]=175696680;j=r+48|0;c[j>>2]=2021213740;c[j+4>>2]=1718526831;j=r+56|0;c[j>>2]=-1710760145;c[j+4>>2]=235567041;cd(k,s,r);j=q+64|0;w=k+64|0;y=q;z=w+64|0;do{c[w>>2]=c[y>>2];w=w+4|0;y=y+4|0;}while((w|0)<(z|0));w=k+128|0;y=j;z=w+64|0;do{c[w>>2]=c[y>>2];w=w+4|0;y=y+4|0;}while((w|0)<(z|0));ok(v|0,g|0,192)|0;w=s;y=k;z=w+64|0;do{c[w>>2]=c[y>>2];w=w+4|0;y=y+4|0;}while((w|0)<(z|0));w=r;y=g;z=w+64|0;do{c[w>>2]=c[y>>2];w=w+4|0;y=y+4|0;}while((w|0)<(z|0));gd(p,s,r);w=s;y=q;z=w+64|0;do{c[w>>2]=c[y>>2];w=w+4|0;y=y+4|0;}while((w|0)<(z|0));w=r;y=v+64|0;z=w+64|0;do{c[w>>2]=c[y>>2];w=w+4|0;y=y+4|0;}while((w|0)<(z|0));gd(u,s,r);w=s;y=j;z=w+64|0;do{c[w>>2]=c[y>>2];w=w+4|0;y=y+4|0;}while((w|0)<(z|0));w=r;y=v+128|0;z=w+64|0;do{c[w>>2]=c[y>>2];w=w+4|0;y=y+4|0;}while((w|0)<(z|0));gd(t,s,r);w=p+64|0;y=u;z=w+64|0;do{c[w>>2]=c[y>>2];w=w+4|0;y=y+4|0;}while((w|0)<(z|0));w=p+128|0;y=t;z=w+64|0;do{c[w>>2]=c[y>>2];w=w+4|0;y=y+4|0;}while((w|0)<(z|0));ok(k|0,b|0,192)|0;ok(v|0,h|0,192)|0;w=s;y=b;z=w+64|0;do{c[w>>2]=c[y>>2];w=w+4|0;y=y+4|0;}while((w|0)<(z|0));w=r;y=h;z=w+64|0;do{c[w>>2]=c[y>>2];w=w+4|0;y=y+4|0;}while((w|0)<(z|0));gd(e,s,r);w=s;y=k+64|0;z=w+64|0;do{c[w>>2]=c[y>>2];w=w+4|0;y=y+4|0;}while((w|0)<(z|0));w=r;y=v+64|0;z=w+64|0;do{c[w>>2]=c[y>>2];w=w+4|0;y=y+4|0;}while((w|0)<(z|0));gd(u,s,r);w=s;y=k+128|0;z=w+64|0;do{c[w>>2]=c[y>>2];w=w+4|0;y=y+4|0;}while((w|0)<(z|0));w=r;y=v+128|0;z=w+64|0;do{c[w>>2]=c[y>>2];w=w+4|0;y=y+4|0;}while((w|0)<(z|0));gd(t,s,r);w=e+64|0;y=u;z=w+64|0;do{c[w>>2]=c[y>>2];w=w+4|0;y=y+4|0;}while((w|0)<(z|0));w=e+128|0;y=t;z=w+64|0;do{c[w>>2]=c[y>>2];w=w+4|0;y=y+4|0;}while((w|0)<(z|0));ok(k|0,d|0,192)|0;ok(v|0,i|0,192)|0;w=s;y=d;z=w+64|0;do{c[w>>2]=c[y>>2];w=w+4|0;y=y+4|0;}while((w|0)<(z|0));w=r;y=i;z=w+64|0;do{c[w>>2]=c[y>>2];w=w+4|0;y=y+4|0;}while((w|0)<(z|0));gd(m,s,r);w=s;y=k+64|0;z=w+64|0;do{c[w>>2]=c[y>>2];w=w+4|0;y=y+4|0;}while((w|0)<(z|0));w=r;y=v+64|0;z=w+64|0;do{c[w>>2]=c[y>>2];w=w+4|0;y=y+4|0;}while((w|0)<(z|0));gd(u,s,r);w=s;y=k+128|0;z=w+64|0;do{c[w>>2]=c[y>>2];w=w+4|0;y=y+4|0;}while((w|0)<(z|0));w=r;y=v+128|0;z=w+64|0;do{c[w>>2]=c[y>>2];w=w+4|0;y=y+4|0;}while((w|0)<(z|0));gd(t,s,r);w=m+64|0;y=u;z=w+64|0;do{c[w>>2]=c[y>>2];w=w+4|0;y=y+4|0;}while((w|0)<(z|0));w=m+128|0;y=t;z=w+64|0;do{c[w>>2]=c[y>>2];w=w+4|0;y=y+4|0;}while((w|0)<(z|0));ad(f,e,m);ok(v|0,g|0,192)|0;w=s;y=f;z=w+64|0;do{c[w>>2]=c[y>>2];w=w+4|0;y=y+4|0;}while((w|0)<(z|0));w=r;y=g;z=w+64|0;do{c[w>>2]=c[y>>2];w=w+4|0;y=y+4|0;}while((w|0)<(z|0));fd(n,s,r);w=s;y=f+64|0;z=w+64|0;do{c[w>>2]=c[y>>2];w=w+4|0;y=y+4|0;}while((w|0)<(z|0));w=r;y=v+64|0;z=w+64|0;do{c[w>>2]=c[y>>2];w=w+4|0;y=y+4|0;}while((w|0)<(z|0));fd(u,s,r);w=s;y=f+128|0;z=w+64|0;do{c[w>>2]=c[y>>2];w=w+4|0;y=y+4|0;}while((w|0)<(z|0));w=r;y=v+128|0;z=w+64|0;do{c[w>>2]=c[y>>2];w=w+4|0;y=y+4|0;}while((w|0)<(z|0));fd(t,s,r);b=n+64|0;w=b;y=u;z=w+64|0;do{c[w>>2]=c[y>>2];w=w+4|0;y=y+4|0;}while((w|0)<(z|0));e=n+128|0;w=e;y=t;z=w+64|0;do{c[w>>2]=c[y>>2];w=w+4|0;y=y+4|0;}while((w|0)<(z|0));ok(v|0,q|0,192)|0;w=s;y=n;z=w+64|0;do{c[w>>2]=c[y>>2];w=w+4|0;y=y+4|0;}while((w|0)<(z|0));w=r;y=q;z=w+64|0;do{c[w>>2]=c[y>>2];w=w+4|0;y=y+4|0;}while((w|0)<(z|0));fd(o,s,r);w=s;y=b;z=w+64|0;do{c[w>>2]=c[y>>2];w=w+4|0;y=y+4|0;}while((w|0)<(z|0));w=r;y=v+64|0;z=w+64|0;do{c[w>>2]=c[y>>2];w=w+4|0;y=y+4|0;}while((w|0)<(z|0));fd(u,s,r);w=s;y=e;z=w+64|0;do{c[w>>2]=c[y>>2];w=w+4|0;y=y+4|0;}while((w|0)<(z|0));w=r;y=v+128|0;z=w+64|0;do{c[w>>2]=c[y>>2];w=w+4|0;y=y+4|0;}while((w|0)<(z|0));fd(t,s,r);w=o+64|0;y=u;z=w+64|0;do{c[w>>2]=c[y>>2];w=w+4|0;y=y+4|0;}while((w|0)<(z|0));w=o+128|0;y=t;z=w+64|0;do{c[w>>2]=c[y>>2];w=w+4|0;y=y+4|0;}while((w|0)<(z|0));ok(a|0,p|0,192)|0;ok(a+192|0,o|0,192)|0;l=x;return}function Uc(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0;k=l;l=l+1568|0;f=k+1184|0;g=k+800|0;h=k+768|0;i=k+384|0;j=k;d=i;c[d>>2]=-980480611;c[d+4>>2]=-748862579;d=i+8|0;c[d>>2]=-171504835;c[d+4>>2]=175696680;d=i+16|0;c[d>>2]=2021213740;c[d+4>>2]=1718526831;d=i+24|0;c[d>>2]=-1710760145;c[d+4>>2]=235567041;hk(i+32|0,0,160)|0;hk(i+192|0,0,192)|0;d=h;c[d>>2]=1248397809;c[d+4>>2]=1156158132;d=h+8|0;c[d>>2]=0;c[d+4>>2]=0;c[d+8>>2]=0;c[d+12>>2]=0;c[d+16>>2]=0;c[d+20>>2]=0;d=256;while(1){if(!d)break;d=d+-1|0;if(d>>>0>255)break;m=h+(d>>>6<<3)|0;o=c[m>>2]|0;m=c[m+4>>2]|0;n=nk(1,0,d&63|0)|0;if(!((o&n|0)==0&(m&y|0)==0)){e=8;break}}a:do if((e|0)==8)b:while(1){ok(g|0,b|0,384)|0;ok(f|0,i|0,384)|0;Tc(i,g,f);while(1){if(!d)break a;d=d+-1|0;if(d>>>0>255)break a;o=h+(d>>>6<<3)|0;m=c[o>>2]|0;o=c[o+4>>2]|0;n=nk(1,0,d&63|0)|0;o=(m&n|0)==0&(o&y|0)==0;Vc(f,i);ok(i|0,f|0,384)|0;if(!o){e=8;continue b}}}while(0);ok(j|0,i|0,384)|0;ok(a|0,j|0,192)|0;ok(f|0,j+192|0,192)|0;bd(g,f);ok(a+192|0,g|0,192)|0;l=k;return}function Vc(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0;R=l;l=l+2560|0;o=R+2368|0;z=R+2176|0;I=R+2112|0;L=R+2048|0;M=R+1984|0;N=R+1920|0;O=R+1856|0;P=R+1792|0;d=R+1728|0;e=R+1664|0;f=R+1600|0;g=R+1536|0;h=R+1472|0;i=R+1408|0;j=R+1344|0;k=R+1280|0;m=R+1216|0;n=R+1152|0;p=R+1088|0;q=R+1024|0;r=R+960|0;s=R+896|0;t=R+832|0;u=R+768|0;v=R+704|0;w=R+640|0;x=R+576|0;y=R+512|0;A=R+448|0;B=R+384|0;C=R+320|0;D=R+256|0;E=R+192|0;F=R+128|0;G=R+64|0;H=R;Q=H;S=b;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));Q=G;S=b+64|0;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));Q=F;S=b+128|0;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));J=b+192|0;Q=E;S=J;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));K=b+256|0;Q=D;S=K;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));Q=C;S=b+320|0;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));Q=z;S=b;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));Q=o;S=K;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));cd(B,z,o);Q=z;S=H;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));Q=o;S=D;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));gd(M,z,o);Q=z;S=D;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));Q=o;c[Q>>2]=1091403767;c[Q+4>>2]=-167360562;Q=o+8|0;c[Q>>2]=-753151983;c[Q+4>>2]=792555341;Q=o+16|0;c[Q>>2]=960546513;c[Q+4>>2]=692269950;Q=o+24|0;c[Q>>2]=-1478256553;c[Q+4>>2]=496343272;Q=o+32|0;c[Q>>2]=-980480611;c[Q+4>>2]=-748862579;Q=o+40|0;c[Q>>2]=-171504835;c[Q+4>>2]=175696680;Q=o+48|0;c[Q>>2]=2021213740;c[Q+4>>2]=1718526831;Q=o+56|0;c[Q>>2]=-1710760145;c[Q+4>>2]=235567041;cd(I,z,o);Q=o;S=H;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));gd(L,I,o);cd(N,M,L);Q=o;S=B;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));fd(O,N,o);Q=z;S=B;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));Q=o;c[Q>>2]=1091403767;c[Q+4>>2]=-167360562;Q=o+8|0;c[Q>>2]=-753151983;c[Q+4>>2]=792555341;Q=o+16|0;c[Q>>2]=960546513;c[Q+4>>2]=692269950;Q=o+24|0;c[Q>>2]=-1478256553;c[Q+4>>2]=496343272;Q=o+32|0;c[Q>>2]=-980480611;c[Q+4>>2]=-748862579;Q=o+40|0;c[Q>>2]=-171504835;c[Q+4>>2]=175696680;Q=o+48|0;c[Q>>2]=2021213740;c[Q+4>>2]=1718526831;Q=o+56|0;c[Q>>2]=-1710760145;c[Q+4>>2]=235567041;cd(I,z,o);fd(A,O,I);Q=z;S=B;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));Q=o;S=B;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));gd(y,z,o);Q=z;S=J;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));Q=o;S=F;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));cd(x,z,o);Q=z;S=E;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));Q=o;S=F;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));gd(M,z,o);Q=z;S=F;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));Q=o;c[Q>>2]=1091403767;c[Q+4>>2]=-167360562;Q=o+8|0;c[Q>>2]=-753151983;c[Q+4>>2]=792555341;Q=o+16|0;c[Q>>2]=960546513;c[Q+4>>2]=692269950;Q=o+24|0;c[Q>>2]=-1478256553;c[Q+4>>2]=496343272;Q=o+32|0;c[Q>>2]=-980480611;c[Q+4>>2]=-748862579;Q=o+40|0;c[Q>>2]=-171504835;c[Q+4>>2]=175696680;Q=o+48|0;c[Q>>2]=2021213740;c[Q+4>>2]=1718526831;Q=o+56|0;c[Q>>2]=-1710760145;c[Q+4>>2]=235567041;cd(I,z,o);Q=o;S=E;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));gd(L,I,o);cd(N,M,L);Q=o;S=x;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));fd(O,N,o);Q=z;S=x;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));Q=o;c[Q>>2]=1091403767;c[Q+4>>2]=-167360562;Q=o+8|0;c[Q>>2]=-753151983;c[Q+4>>2]=792555341;Q=o+16|0;c[Q>>2]=960546513;c[Q+4>>2]=692269950;Q=o+24|0;c[Q>>2]=-1478256553;c[Q+4>>2]=496343272;Q=o+32|0;c[Q>>2]=-980480611;c[Q+4>>2]=-748862579;Q=o+40|0;c[Q>>2]=-171504835;c[Q+4>>2]=175696680;Q=o+48|0;c[Q>>2]=2021213740;c[Q+4>>2]=1718526831;Q=o+56|0;c[Q>>2]=-1710760145;c[Q+4>>2]=235567041;cd(I,z,o);fd(w,O,I);Q=z;S=x;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));Q=o;S=x;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));gd(v,z,o);Q=z;S=G;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));Q=o;S=C;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));cd(u,z,o);Q=z;S=G;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));Q=o;S=C;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));gd(M,z,o);Q=z;S=C;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));Q=o;c[Q>>2]=1091403767;c[Q+4>>2]=-167360562;Q=o+8|0;c[Q>>2]=-753151983;c[Q+4>>2]=792555341;Q=o+16|0;c[Q>>2]=960546513;c[Q+4>>2]=692269950;Q=o+24|0;c[Q>>2]=-1478256553;c[Q+4>>2]=496343272;Q=o+32|0;c[Q>>2]=-980480611;c[Q+4>>2]=-748862579;Q=o+40|0;c[Q>>2]=-171504835;c[Q+4>>2]=175696680;Q=o+48|0;c[Q>>2]=2021213740;c[Q+4>>2]=1718526831;Q=o+56|0;c[Q>>2]=-1710760145;c[Q+4>>2]=235567041;cd(I,z,o);Q=o;S=G;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));gd(L,I,o);cd(N,M,L);Q=o;S=u;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));fd(O,N,o);Q=z;S=u;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));Q=o;c[Q>>2]=1091403767;c[Q+4>>2]=-167360562;Q=o+8|0;c[Q>>2]=-753151983;c[Q+4>>2]=792555341;Q=o+16|0;c[Q>>2]=960546513;c[Q+4>>2]=692269950;Q=o+24|0;c[Q>>2]=-1478256553;c[Q+4>>2]=496343272;Q=o+32|0;c[Q>>2]=-980480611;c[Q+4>>2]=-748862579;Q=o+40|0;c[Q>>2]=-171504835;c[Q+4>>2]=175696680;Q=o+48|0;c[Q>>2]=2021213740;c[Q+4>>2]=1718526831;Q=o+56|0;c[Q>>2]=-1710760145;c[Q+4>>2]=235567041;cd(I,z,o);fd(t,O,I);Q=z;S=u;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));Q=o;S=u;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));gd(s,z,o);Q=z;S=A;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));Q=o;S=H;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));fd(r,z,o);Q=z;S=r;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));Q=o;S=r;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));gd(q,z,o);Q=z;S=q;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));Q=o;S=A;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));gd(p,z,o);Q=z;S=y;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));Q=o;S=D;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));gd(n,z,o);Q=z;S=n;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));Q=o;S=n;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));gd(m,z,o);Q=z;S=m;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));Q=o;S=y;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));gd(k,z,o);Q=z;S=s;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));Q=o;c[Q>>2]=1091403767;c[Q+4>>2]=-167360562;Q=o+8|0;c[Q>>2]=-753151983;c[Q+4>>2]=792555341;Q=o+16|0;c[Q>>2]=960546513;c[Q+4>>2]=692269950;Q=o+24|0;c[Q>>2]=-1478256553;c[Q+4>>2]=496343272;Q=o+32|0;c[Q>>2]=-980480611;c[Q+4>>2]=-748862579;Q=o+40|0;c[Q>>2]=-171504835;c[Q+4>>2]=175696680;Q=o+48|0;c[Q>>2]=2021213740;c[Q+4>>2]=1718526831;Q=o+56|0;c[Q>>2]=-1710760145;c[Q+4>>2]=235567041;cd(j,z,o);Q=z;S=j;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));Q=o;S=E;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));gd(i,z,o);Q=z;S=i;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));Q=o;S=i;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));gd(h,z,o);Q=z;S=h;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));Q=o;S=j;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));gd(g,z,o);Q=z;S=t;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));Q=o;S=F;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));fd(f,z,o);Q=z;S=f;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));Q=o;S=f;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));gd(e,z,o);Q=z;S=e;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));Q=o;S=t;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));gd(d,z,o);Q=z;S=w;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));Q=o;S=G;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));fd(P,z,o);Q=z;S=P;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));Q=o;S=P;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));gd(O,z,o);Q=z;S=O;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));Q=o;S=w;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));gd(N,z,o);Q=z;S=v;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));Q=o;S=C;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));gd(M,z,o);Q=z;S=M;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));Q=o;S=M;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));gd(L,z,o);Q=z;S=L;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));Q=o;S=v;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));gd(I,z,o);Q=z;S=p;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));Q=z+64|0;S=N;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));Q=z+128|0;S=d;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));Q=o;S=g;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));Q=o+64|0;S=k;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));Q=o+128|0;S=I;T=Q+64|0;do{c[Q>>2]=c[S>>2];Q=Q+4|0;S=S+4|0;}while((Q|0)<(T|0));ok(a|0,z|0,192)|0;ok(a+192|0,o|0,192)|0;l=R;return}function Wc(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0;la=l;l=l+3584|0;V=la+3392|0;ea=la+3200|0;ha=la+3136|0;ia=la+3072|0;ja=la+3008|0;g=la+2944|0;h=la+2880|0;i=la+2816|0;j=la+2752|0;k=la+2688|0;m=la+2624|0;n=la+2560|0;o=la+2496|0;p=la+2432|0;q=la+2368|0;r=la+2304|0;s=la+2240|0;t=la+2176|0;u=la+2112|0;v=la+2048|0;w=la+1984|0;x=la+1920|0;y=la+1856|0;z=la+1792|0;A=la+1728|0;B=la+1664|0;C=la+1600|0;D=la+1536|0;E=la+1472|0;F=la+1408|0;G=la+1344|0;H=la+1280|0;I=la+1216|0;J=la+1152|0;K=la+1088|0;L=la+1024|0;M=la+960|0;N=la+896|0;O=la+832|0;P=la+768|0;Q=la+704|0;R=la+640|0;S=la+576|0;T=la+512|0;U=la+448|0;W=la+384|0;X=la+320|0;Y=la+256|0;Z=la+192|0;_=la+128|0;$=la+64|0;aa=la;ka=aa;ma=b;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ba=b+64|0;ka=$;ma=ba;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ca=b+128|0;ka=_;ma=ca;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));da=b+192|0;ka=Z;ma=da;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));fa=b+256|0;ka=Y;ma=fa;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ga=b+320|0;ka=X;ma=ga;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ka=W;ma=d;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ka=U;ma=f;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ka=T;ma=e;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ka=ea;ma=b;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ka=V;ma=d;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));cd(S,ea,V);ka=ea;ma=ca;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ka=V;ma=f;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));cd(R,ea,V);ka=ea;ma=fa;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ka=V;ma=e;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));cd(Q,ea,V);ka=ea;ma=aa;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ka=V;ma=Y;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));gd(P,ea,V);ka=ea;ma=aa;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ka=V;ma=_;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));gd(O,ea,V);ka=ea;ma=ba;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ka=V;ma=da;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));gd(ha,ea,V);ka=V;ma=ga;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));gd(N,ha,V);ka=ea;ma=$;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ka=V;ma=U;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));cd(M,ea,V);ka=ea;ma=M;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ka=V;ma=Q;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));gd(L,ea,V);ka=ea;ma=L;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ka=V;c[ka>>2]=1091403767;c[ka+4>>2]=-167360562;ka=V+8|0;c[ka>>2]=-753151983;c[ka+4>>2]=792555341;ka=V+16|0;c[ka>>2]=960546513;c[ka+4>>2]=692269950;ka=V+24|0;c[ka>>2]=-1478256553;c[ka+4>>2]=496343272;ka=V+32|0;c[ka>>2]=-980480611;c[ka+4>>2]=-748862579;ka=V+40|0;c[ka>>2]=-171504835;c[ka+4>>2]=175696680;ka=V+48|0;c[ka>>2]=2021213740;c[ka+4>>2]=1718526831;ka=V+56|0;c[ka>>2]=-1710760145;c[ka+4>>2]=235567041;cd(ha,ea,V);ka=V;ma=S;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));gd(K,ha,V);ka=J;ma=K;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ka=ea;ma=X;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ka=V;ma=T;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));cd(I,ea,V);ka=ea;ma=M;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ka=V;ma=I;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));gd(H,ea,V);ka=ea;ma=I;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ka=V;ma=R;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));gd(G,ea,V);ka=ea;ma=G;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ka=V;c[ka>>2]=1091403767;c[ka+4>>2]=-167360562;ka=V+8|0;c[ka>>2]=-753151983;c[ka+4>>2]=792555341;ka=V+16|0;c[ka>>2]=960546513;c[ka+4>>2]=692269950;ka=V+24|0;c[ka>>2]=-1478256553;c[ka+4>>2]=496343272;ka=V+32|0;c[ka>>2]=-980480611;c[ka+4>>2]=-748862579;ka=V+40|0;c[ka>>2]=-171504835;c[ka+4>>2]=175696680;ka=V+48|0;c[ka>>2]=2021213740;c[ka+4>>2]=1718526831;ka=V+56|0;c[ka>>2]=-1710760145;c[ka+4>>2]=235567041;cd(F,ea,V);ka=ea;ma=$;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ka=V;ma=W;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));cd(E,ea,V);ka=ea;ma=H;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ka=V;ma=E;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));gd(D,ea,V);ka=ea;ma=F;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ka=V;ma=E;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));gd(C,ea,V);ka=B;ma=C;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ka=ea;ma=W;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ka=V;ma=U;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));gd(A,ea,V);ka=ea;ma=O;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ka=V;ma=A;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));cd(ha,ea,V);ka=V;ma=S;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));fd(ia,ha,V);ka=V;ma=R;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));fd(z,ia,V);ka=ea;ma=Z;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ka=V;ma=T;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));cd(y,ea,V);ka=ea;ma=D;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ka=V;ma=y;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));gd(x,ea,V);ka=ea;ma=z;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ka=V;ma=y;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));gd(w,ea,V);ka=ea;ma=_;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ka=V;ma=Y;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));gd(v,ea,V);ka=u;ma=w;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ka=ea;ma=U;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ka=V;ma=T;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));gd(t,ea,V);ka=ea;ma=v;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ka=V;ma=t;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));cd(ha,ea,V);ka=V;ma=R;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));fd(ia,ha,V);ka=V;ma=Q;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));fd(s,ia,V);ka=ea;ma=s;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ka=V;c[ka>>2]=1091403767;c[ka+4>>2]=-167360562;ka=V+8|0;c[ka>>2]=-753151983;c[ka+4>>2]=792555341;ka=V+16|0;c[ka>>2]=960546513;c[ka+4>>2]=692269950;ka=V+24|0;c[ka>>2]=-1478256553;c[ka+4>>2]=496343272;ka=V+32|0;c[ka>>2]=-980480611;c[ka+4>>2]=-748862579;ka=V+40|0;c[ka>>2]=-171504835;c[ka+4>>2]=175696680;ka=V+48|0;c[ka>>2]=2021213740;c[ka+4>>2]=1718526831;ka=V+56|0;c[ka>>2]=-1710760145;c[ka+4>>2]=235567041;cd(r,ea,V);ka=ea;ma=Z;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ka=V;ma=W;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));cd(q,ea,V);ka=ea;ma=x;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ka=V;ma=q;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));gd(p,ea,V);ka=ea;ma=r;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ka=V;ma=q;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));gd(o,ea,V);ka=n;ma=o;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ka=ea;ma=X;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ka=V;ma=U;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));cd(m,ea,V);ka=ea;ma=p;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ka=V;ma=m;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));gd(k,ea,V);ka=ea;ma=m;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ka=V;c[ka>>2]=1091403767;c[ka+4>>2]=-167360562;ka=V+8|0;c[ka>>2]=-753151983;c[ka+4>>2]=792555341;ka=V+16|0;c[ka>>2]=960546513;c[ka+4>>2]=692269950;ka=V+24|0;c[ka>>2]=-1478256553;c[ka+4>>2]=496343272;ka=V+32|0;c[ka>>2]=-980480611;c[ka+4>>2]=-748862579;ka=V+40|0;c[ka>>2]=-171504835;c[ka+4>>2]=175696680;ka=V+48|0;c[ka>>2]=2021213740;c[ka+4>>2]=1718526831;ka=V+56|0;c[ka>>2]=-1710760145;c[ka+4>>2]=235567041;cd(j,ea,V);ka=ea;ma=W;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ka=V;ma=T;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));gd(i,ea,V);ka=ea;ma=P;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ka=V;ma=i;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));cd(ha,ea,V);ka=V;ma=S;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));fd(ia,ha,V);ka=V;ma=Q;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));fd(h,ia,V);ka=ea;ma=j;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ka=V;ma=h;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));gd(g,ea,V);ka=ea;ma=W;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ka=V;ma=U;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));gd(ha,ea,V);ka=V;ma=T;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));gd(ja,ha,V);ka=ea;ma=N;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ka=V;ma=ja;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));cd(ha,ea,V);ka=V;ma=k;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));fd(ia,ha,V);ka=ea;ma=J;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ka=ea+64|0;ma=B;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ka=ea+128|0;ma=u;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ka=V;ma=n;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ka=V+64|0;ma=g;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ka=V+128|0;ma=ia;na=ka+64|0;do{c[ka>>2]=c[ma>>2];ka=ka+4|0;ma=ma+4|0;}while((ka|0)<(na|0));ok(a|0,ea|0,192)|0;ok(a+192|0,V|0,192)|0;l=la;return}function Xc(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;t=l;l=l+2048|0;k=t+1856|0;m=t+1664|0;n=t+1600|0;o=t+1536|0;p=t+1344|0;q=t+1152|0;r=t+960|0;g=t+768|0;d=t+576|0;h=t+384|0;i=t+192|0;j=t;ok(m|0,b|0,192)|0;e=b+192|0;ok(k|0,e|0,192)|0;ad(j,m,k);s=m;u=b+320|0;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));f=k;c[f>>2]=1091403767;c[f+4>>2]=-167360562;f=k+8|0;c[f>>2]=-753151983;c[f+4>>2]=792555341;f=k+16|0;c[f>>2]=960546513;c[f+4>>2]=692269950;f=k+24|0;c[f>>2]=-1478256553;c[f+4>>2]=496343272;f=k+32|0;c[f>>2]=-980480611;c[f+4>>2]=-748862579;f=k+40|0;c[f>>2]=-171504835;c[f+4>>2]=175696680;f=k+48|0;c[f>>2]=2021213740;c[f+4>>2]=1718526831;f=k+56|0;c[f>>2]=-1710760145;c[f+4>>2]=235567041;cd(q,m,k);f=b+256|0;s=q+64|0;u=e;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));s=q+128|0;u=f;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));ok(p|0,b|0,192)|0;s=m;u=q;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));s=k;u=b;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));gd(g,m,k);s=m;u=e;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));s=k;u=p+64|0;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));gd(o,m,k);s=m;u=f;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));s=k;u=p+128|0;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));gd(n,m,k);s=g+64|0;u=o;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));s=g+128|0;u=n;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));ok(q|0,b|0,192)|0;ok(p|0,e|0,192)|0;s=m;u=b;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));s=k;u=e;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));gd(r,m,k);s=m;u=q+64|0;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));s=k;u=p+64|0;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));gd(o,m,k);s=m;u=q+128|0;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));s=k;u=p+128|0;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));gd(n,m,k);s=r+64|0;u=o;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));s=r+128|0;u=n;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));ad(d,g,r);ok(p|0,j|0,192)|0;s=m;u=d;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));s=k;u=j;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));fd(h,m,k);s=m;u=d+64|0;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));s=k;u=p+64|0;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));fd(o,m,k);s=m;u=d+128|0;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));s=k;u=p+128|0;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));fd(n,m,k);d=h+64|0;s=d;u=o;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));e=h+128|0;s=e;u=n;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));s=m;u=j+128|0;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));b=k;c[b>>2]=1091403767;c[b+4>>2]=-167360562;b=k+8|0;c[b>>2]=-753151983;c[b+4>>2]=792555341;b=k+16|0;c[b>>2]=960546513;c[b+4>>2]=692269950;b=k+24|0;c[b>>2]=-1478256553;c[b+4>>2]=496343272;b=k+32|0;c[b>>2]=-980480611;c[b+4>>2]=-748862579;b=k+40|0;c[b>>2]=-171504835;c[b+4>>2]=175696680;b=k+48|0;c[b>>2]=2021213740;c[b+4>>2]=1718526831;b=k+56|0;c[b>>2]=-1710760145;c[b+4>>2]=235567041;cd(p,m,k);b=j+64|0;s=p+64|0;u=j;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));s=p+128|0;u=b;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));s=m;u=h;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));s=k;u=p;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));fd(i,m,k);s=m;u=d;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));s=k;u=j;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));fd(o,m,k);s=m;u=e;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));s=k;u=b;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));fd(n,m,k);s=i+64|0;u=o;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));s=i+128|0;u=n;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));ok(q|0,j|0,192)|0;ok(p|0,j|0,192)|0;s=m;u=q;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));s=k;u=j;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));gd(r,m,k);s=m;u=q+64|0;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));s=k;u=p+64|0;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));gd(o,m,k);s=m;u=q+128|0;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));s=k;u=p+128|0;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));gd(n,m,k);s=r+64|0;u=o;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));s=r+128|0;u=n;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));ok(a|0,i|0,192)|0;ok(a+192|0,r|0,192)|0;l=t;return}function Yc(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0;i=l;l=l+16|0;g=i;h=a+4|0;f=c[h>>2]|0;e=f*192|0;if(f|0){b=f*384|0;if((b|0)<0)$i(2072);b=_b(c[a>>2]|0,e,8,b,8,g)|0;if(!b){d=g+4|0;j=c[d>>2]|0;d=c[d+4>>2]|0;c[g>>2]=c[g>>2];e=g+4|0;c[e>>2]=j;c[e+4>>2]=d;Yb(g);}e=b;g=a;j=f<<1;c[g>>2]=e;c[h>>2]=j;l=i;return}hd(g,192,8,4);if((c[g>>2]|0)==1){b=c[g+4>>2]|0;if(b|0?(d=Xb(b,c[g+8>>2]|0,g)|0,d|0):0){f=d;g=a;j=4;c[g>>2]=f;c[h>>2]=j;l=i;return}}c[g>>2]=1;c[g+4>>2]=6611;c[g+8>>2]=30;Yb(g);}function Zc(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0;r=l;l=l+384|0;i=r+320|0;k=r+288|0;m=r+256|0;n=r+192|0;o=r+128|0;f=r+64|0;p=r;h=(d&1|0)==0;if(h){q=p;e=b;g=q+64|0;do{c[q>>2]=c[e>>2];q=q+4|0;e=e+4|0;}while((q|0)<(g|0));q=n;e=b+64|0;g=q+64|0;do{c[q>>2]=c[e>>2];q=q+4|0;e=e+4|0;}while((q|0)<(g|0));j=f;}else {c[p>>2]=c[b>>2];c[p+4>>2]=c[b+4>>2];c[p+8>>2]=c[b+8>>2];c[p+12>>2]=c[b+12>>2];c[p+16>>2]=c[b+16>>2];c[p+20>>2]=c[b+20>>2];c[p+24>>2]=c[b+24>>2];c[p+28>>2]=c[b+28>>2];j=b+32|0;c[k>>2]=c[j>>2];c[k+4>>2]=c[j+4>>2];c[k+8>>2]=c[j+8>>2];c[k+12>>2]=c[j+12>>2];c[k+16>>2]=c[j+16>>2];c[k+20>>2]=c[j+20>>2];c[k+24>>2]=c[j+24>>2];c[k+28>>2]=c[j+28>>2];j=i;c[j>>2]=317583274;c[j+4>>2]=1757628553;j=i+8|0;c[j>>2]=1923792719;c[j+4>>2]=-1928822936;j=i+16|0;c[j>>2]=151523889;c[j+4>>2]=1373741639;j=i+24|0;c[j>>2]=1193918714;c[j+4>>2]=576313009;Mc(k,i,136,-460954743,-2016278654);c[m>>2]=c[k>>2];c[m+4>>2]=c[k+4>>2];c[m+8>>2]=c[k+8>>2];c[m+12>>2]=c[k+12>>2];c[m+16>>2]=c[k+16>>2];c[m+20>>2]=c[k+20>>2];c[m+24>>2]=c[k+24>>2];c[m+28>>2]=c[k+28>>2];j=p+32|0;c[j>>2]=c[m>>2];c[j+4>>2]=c[m+4>>2];c[j+8>>2]=c[m+8>>2];c[j+12>>2]=c[m+12>>2];c[j+16>>2]=c[m+16>>2];c[j+20>>2]=c[m+20>>2];c[j+24>>2]=c[m+24>>2];c[j+28>>2]=c[m+28>>2];j=b+64|0;c[n>>2]=c[j>>2];c[n+4>>2]=c[j+4>>2];c[n+8>>2]=c[j+8>>2];c[n+12>>2]=c[j+12>>2];c[n+16>>2]=c[j+16>>2];c[n+20>>2]=c[j+20>>2];c[n+24>>2]=c[j+24>>2];c[n+28>>2]=c[j+28>>2];j=b+96|0;c[k>>2]=c[j>>2];c[k+4>>2]=c[j+4>>2];c[k+8>>2]=c[j+8>>2];c[k+12>>2]=c[j+12>>2];c[k+16>>2]=c[j+16>>2];c[k+20>>2]=c[j+20>>2];c[k+24>>2]=c[j+24>>2];c[k+28>>2]=c[j+28>>2];j=i;c[j>>2]=317583274;c[j+4>>2]=1757628553;j=i+8|0;c[j>>2]=1923792719;c[j+4>>2]=-1928822936;j=i+16|0;c[j>>2]=151523889;c[j+4>>2]=1373741639;j=i+24|0;c[j>>2]=1193918714;c[j+4>>2]=576313009;Mc(k,i,136,-460954743,-2016278654);c[m>>2]=c[k>>2];c[m+4>>2]=c[k+4>>2];c[m+8>>2]=c[k+8>>2];c[m+12>>2]=c[k+12>>2];c[m+16>>2]=c[k+16>>2];c[m+20>>2]=c[k+20>>2];c[m+24>>2]=c[k+24>>2];c[m+28>>2]=c[k+28>>2];j=n+32|0;c[j>>2]=c[m>>2];c[j+4>>2]=c[m+4>>2];c[j+8>>2]=c[m+8>>2];c[j+12>>2]=c[m+12>>2];c[j+16>>2]=c[m+16>>2];c[j+20>>2]=c[m+20>>2];c[j+24>>2]=c[m+24>>2];c[j+28>>2]=c[m+28>>2];j=f;}d=((d>>>0)%6|0)&255;switch(d&7){case 0:{q=i;c[q>>2]=-980480611;c[q+4>>2]=-748862579;q=i+8|0;c[q>>2]=-171504835;c[q+4>>2]=175696680;q=i+16|0;c[q>>2]=2021213740;c[q+4>>2]=1718526831;q=i+24|0;c[q>>2]=-1710760145;c[q+4>>2]=235567041;q=i+32|0;c[q>>2]=0;c[q+4>>2]=0;c[q+8>>2]=0;c[q+12>>2]=0;c[q+16>>2]=0;c[q+20>>2]=0;c[q+24>>2]=0;c[q+28>>2]=0;break}case 1:{q=i;c[q>>2]=1164159792;c[q+4>>2]=-1250477296;q=i+8|0;c[q>>2]=-1448450988;c[q+4>>2]=880775624;q=i+16|0;c[q>>2]=606996881;c[q+4>>2]=2046849319;q=i+24|0;c[q>>2]=293737708;c[q+4>>2]=425114840;q=i+32|0;c[q>>2]=-1599453353;c[q+4>>2]=1854185246;q=i+40|0;c[q>>2]=-1980198591;c[q+4>>2]=-1440973971;q=i+48|0;c[q>>2]=-85931462;c[q+4>>2]=-1226370099;q=i+56|0;c[q>>2]=1317202883;c[q+4>>2]=644435899;break}case 2:{q=i;c[q>>2]=333974428;c[q+4>>2]=860932238;q=i+8|0;c[q>>2]=-614574407;c[q+4>>2]=2110674300;q=i+16|0;c[q>>2]=-1240115638;c[q+4>>2]=1610724536;q=i+24|0;c[q>>2]=33691616;c[q+4>>2]=646112791;q=i+32|0;c[q>>2]=0;c[q+4>>2]=0;c[q+8>>2]=0;c[q+12>>2]=0;c[q+16>>2]=0;c[q+20>>2]=0;c[q+24>>2]=0;c[q+28>>2]=0;break}case 3:{q=i;c[q>>2]=380464045;c[q+4>>2]=-911269129;q=i+8|0;c[q>>2]=1252418226;c[q+4>>2]=-1290700758;q=i+16|0;c[q>>2]=-498546700;c[q+4>>2]=435072868;q=i+24|0;c[q>>2]=-482107518;c[q+4>>2]=539442807;q=i+32|0;c[q>>2]=-137456724;c[q+4>>2]=-1396692896;q=i+40|0;c[q>>2]=2074569548;c[q+4>>2]=959698305;q=i+48|0;c[q>>2]=1147962471;c[q+4>>2]=1776687243;q=i+56|0;c[q>>2]=1142410325;c[q+4>>2]=172360557;break}default:jd(6441,19,2096);}cd(f,n,i);e=b+128|0;if(h){q=n;g=q+64|0;do{c[q>>2]=c[e>>2];q=q+4|0;e=e+4|0;}while((q|0)<(g|0))}else {c[n>>2]=c[e>>2];c[n+4>>2]=c[e+4>>2];c[n+8>>2]=c[e+8>>2];c[n+12>>2]=c[e+12>>2];c[n+16>>2]=c[e+16>>2];c[n+20>>2]=c[e+20>>2];c[n+24>>2]=c[e+24>>2];c[n+28>>2]=c[e+28>>2];q=b+160|0;c[k>>2]=c[q>>2];c[k+4>>2]=c[q+4>>2];c[k+8>>2]=c[q+8>>2];c[k+12>>2]=c[q+12>>2];c[k+16>>2]=c[q+16>>2];c[k+20>>2]=c[q+20>>2];c[k+24>>2]=c[q+24>>2];c[k+28>>2]=c[q+28>>2];q=i;c[q>>2]=317583274;c[q+4>>2]=1757628553;q=i+8|0;c[q>>2]=1923792719;c[q+4>>2]=-1928822936;q=i+16|0;c[q>>2]=151523889;c[q+4>>2]=1373741639;q=i+24|0;c[q>>2]=1193918714;c[q+4>>2]=576313009;Mc(k,i,136,-460954743,-2016278654);c[m>>2]=c[k>>2];c[m+4>>2]=c[k+4>>2];c[m+8>>2]=c[k+8>>2];c[m+12>>2]=c[k+12>>2];c[m+16>>2]=c[k+16>>2];c[m+20>>2]=c[k+20>>2];c[m+24>>2]=c[k+24>>2];c[m+28>>2]=c[k+28>>2];q=n+32|0;c[q>>2]=c[m>>2];c[q+4>>2]=c[m+4>>2];c[q+8>>2]=c[m+8>>2];c[q+12>>2]=c[m+12>>2];c[q+16>>2]=c[m+16>>2];c[q+20>>2]=c[m+20>>2];c[q+24>>2]=c[m+24>>2];c[q+28>>2]=c[m+28>>2];}switch(d&7){case 0:{q=i;c[q>>2]=-980480611;c[q+4>>2]=-748862579;q=i+8|0;c[q>>2]=-171504835;c[q+4>>2]=175696680;q=i+16|0;c[q>>2]=2021213740;c[q+4>>2]=1718526831;q=i+24|0;c[q>>2]=-1710760145;c[q+4>>2]=235567041;q=i+32|0;c[q>>2]=0;c[q+4>>2]=0;c[q+8>>2]=0;c[q+12>>2]=0;c[q+16>>2]=0;c[q+20>>2]=0;c[q+24>>2]=0;c[q+28>>2]=0;cd(o,n,i);q=a;e=p;g=q+64|0;do{c[q>>2]=c[e>>2];q=q+4|0;e=e+4|0;}while((q|0)<(g|0));q=a+64|0;e=j;g=q+64|0;do{c[q>>2]=c[e>>2];q=q+4|0;e=e+4|0;}while((q|0)<(g|0));q=a+128|0;e=o;g=q+64|0;do{c[q>>2]=c[e>>2];q=q+4|0;e=e+4|0;}while((q|0)<(g|0));l=r;return}case 1:{q=i;c[q>>2]=-2076524910;c[q+4>>2]=1935791999;q=i+8|0;c[q>>2]=657723899;c[q+4>>2]=-1514460205;q=i+16|0;c[q>>2]=1262363545;c[q+4>>2]=-1668014287;q=i+24|0;c[q>>2]=-1147153428;c[q+4>>2]=366976221;q=i+32|0;c[q>>2]=1272498505;c[q+4>>2]=1574829333;q=i+40|0;c[q>>2]=-1539024032;c[q+4>>2]=1657481637;q=i+48|0;c[q>>2]=209572537;c[q+4>>2]=935102218;q=i+56|0;c[q>>2]=829550845;c[q+4>>2]=612567709;cd(o,n,i);q=a;e=p;g=q+64|0;do{c[q>>2]=c[e>>2];q=q+4|0;e=e+4|0;}while((q|0)<(g|0));q=a+64|0;e=j;g=q+64|0;do{c[q>>2]=c[e>>2];q=q+4|0;e=e+4|0;}while((q|0)<(g|0));q=a+128|0;e=o;g=q+64|0;do{c[q>>2]=c[e>>2];q=q+4|0;e=e+4|0;}while((q|0)<(g|0));l=r;return}case 2:{q=i;c[q>>2]=-679288491;c[q+4>>2]=1905462289;q=i+8|0;c[q>>2]=-4312285;c[q+4>>2]=-1497656196;q=i+16|0;c[q>>2]=-730590140;c[q+4>>2]=-1439681724;q=i+24|0;c[q>>2]=643385667;c[q+4>>2]=742080269;q=i+32|0;c[q>>2]=0;c[q+4>>2]=0;c[q+8>>2]=0;c[q+12>>2]=0;c[q+16>>2]=0;c[q+20>>2]=0;c[q+24>>2]=0;c[q+28>>2]=0;cd(o,n,i);q=a;e=p;g=q+64|0;do{c[q>>2]=c[e>>2];q=q+4|0;e=e+4|0;}while((q|0)<(g|0));q=a+64|0;e=j;g=q+64|0;do{c[q>>2]=c[e>>2];q=q+4|0;e=e+4|0;}while((q|0)<(g|0));q=a+128|0;e=o;g=q+64|0;do{c[q>>2]=c[e>>2];q=q+4|0;e=e+4|0;}while((q|0)<(g|0));l=r;return}case 3:{q=i;c[q>>2]=2070373087;c[q+4>>2]=1149932453;q=i+8|0;c[q>>2]=687729375;c[q+4>>2]=-1076482571;q=i+16|0;c[q>>2]=245093498;c[q+4>>2]=-665258544;q=i+24|0;c[q>>2]=880208984;c[q+4>>2]=112213325;q=i+32|0;c[q>>2]=-1127663919;c[q+4>>2]=723114740;q=i+40|0;c[q>>2]=1458842015;c[q+4>>2]=-1583001990;q=i+48|0;c[q>>2]=1524543217;c[q+4>>2]=-1254887712;q=i+56|0;c[q>>2]=-2065850190;c[q+4>>2]=386695467;cd(o,n,i);q=a;e=p;g=q+64|0;do{c[q>>2]=c[e>>2];q=q+4|0;e=e+4|0;}while((q|0)<(g|0));q=a+64|0;e=j;g=q+64|0;do{c[q>>2]=c[e>>2];q=q+4|0;e=e+4|0;}while((q|0)<(g|0));q=a+128|0;e=o;g=q+64|0;do{c[q>>2]=c[e>>2];q=q+4|0;e=e+4|0;}while((q|0)<(g|0));l=r;return}default:jd(6441,19,2112);}}function _c(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;v=l;l=l+960|0;m=v+896|0;n=v+832|0;o=v+768|0;p=v+704|0;q=v+640|0;r=v+576|0;s=v+512|0;t=v+448|0;e=v+384|0;f=v+320|0;g=v+256|0;h=v+192|0;i=v+128|0;d=v+64|0;j=v;dd(j,b);u=n;w=b;x=u+64|0;do{c[u>>2]=c[w>>2];u=u+4|0;w=w+4|0;}while((u|0)<(x|0));k=b+64|0;u=m;w=k;x=u+64|0;do{c[u>>2]=c[w>>2];u=u+4|0;w=w+4|0;}while((u|0)<(x|0));cd(d,n,m);u=n;w=d;x=u+64|0;do{c[u>>2]=c[w>>2];u=u+4|0;w=w+4|0;}while((u|0)<(x|0));u=m;w=d;x=u+64|0;do{c[u>>2]=c[w>>2];u=u+4|0;w=w+4|0;}while((u|0)<(x|0));gd(i,n,m);u=n;w=b;x=u+64|0;do{c[u>>2]=c[w>>2];u=u+4|0;w=w+4|0;}while((u|0)<(x|0));u=m;w=k;x=u+64|0;do{c[u>>2]=c[w>>2];u=u+4|0;w=w+4|0;}while((u|0)<(x|0));fd(o,n,m);b=b+128|0;u=m;w=b;x=u+64|0;do{c[u>>2]=c[w>>2];u=u+4|0;w=w+4|0;}while((u|0)<(x|0));gd(p,o,m);dd(h,p);u=n;w=k;x=u+64|0;do{c[u>>2]=c[w>>2];u=u+4|0;w=w+4|0;}while((u|0)<(x|0));u=m;w=b;x=u+64|0;do{c[u>>2]=c[w>>2];u=u+4|0;w=w+4|0;}while((u|0)<(x|0));cd(g,n,m);u=n;w=g;x=u+64|0;do{c[u>>2]=c[w>>2];u=u+4|0;w=w+4|0;}while((u|0)<(x|0));u=m;w=g;x=u+64|0;do{c[u>>2]=c[w>>2];u=u+4|0;w=w+4|0;}while((u|0)<(x|0));gd(f,n,m);dd(e,b);u=p;w=j;x=u+64|0;do{c[u>>2]=c[w>>2];u=u+4|0;w=w+4|0;}while((u|0)<(x|0));u=n;w=f;x=u+64|0;do{c[u>>2]=c[w>>2];u=u+4|0;w=w+4|0;}while((u|0)<(x|0));u=m;c[u>>2]=1091403767;c[u+4>>2]=-167360562;u=m+8|0;c[u>>2]=-753151983;c[u+4>>2]=792555341;u=m+16|0;c[u>>2]=960546513;c[u+4>>2]=692269950;u=m+24|0;c[u>>2]=-1478256553;c[u+4>>2]=496343272;u=m+32|0;c[u>>2]=-980480611;c[u+4>>2]=-748862579;u=m+40|0;c[u>>2]=-171504835;c[u+4>>2]=175696680;u=m+48|0;c[u>>2]=2021213740;c[u+4>>2]=1718526831;u=m+56|0;c[u>>2]=-1710760145;c[u+4>>2]=235567041;cd(o,n,m);gd(t,p,o);u=p;w=i;x=u+64|0;do{c[u>>2]=c[w>>2];u=u+4|0;w=w+4|0;}while((u|0)<(x|0));u=n;w=e;x=u+64|0;do{c[u>>2]=c[w>>2];u=u+4|0;w=w+4|0;}while((u|0)<(x|0));u=m;c[u>>2]=1091403767;c[u+4>>2]=-167360562;u=m+8|0;c[u>>2]=-753151983;c[u+4>>2]=792555341;u=m+16|0;c[u>>2]=960546513;c[u+4>>2]=692269950;u=m+24|0;c[u>>2]=-1478256553;c[u+4>>2]=496343272;u=m+32|0;c[u>>2]=-980480611;c[u+4>>2]=-748862579;u=m+40|0;c[u>>2]=-171504835;c[u+4>>2]=175696680;u=m+48|0;c[u>>2]=2021213740;c[u+4>>2]=1718526831;u=m+56|0;c[u>>2]=-1710760145;c[u+4>>2]=235567041;cd(o,n,m);gd(s,p,o);u=n;w=i;x=u+64|0;do{c[u>>2]=c[w>>2];u=u+4|0;w=w+4|0;}while((u|0)<(x|0));u=m;w=h;x=u+64|0;do{c[u>>2]=c[w>>2];u=u+4|0;w=w+4|0;}while((u|0)<(x|0));gd(o,n,m);u=m;w=f;x=u+64|0;do{c[u>>2]=c[w>>2];u=u+4|0;w=w+4|0;}while((u|0)<(x|0));gd(p,o,m);u=m;w=j;x=u+64|0;do{c[u>>2]=c[w>>2];u=u+4|0;w=w+4|0;}while((u|0)<(x|0));fd(q,p,m);u=m;w=e;x=u+64|0;do{c[u>>2]=c[w>>2];u=u+4|0;w=w+4|0;}while((u|0)<(x|0));fd(r,q,m);u=a;w=t;x=u+64|0;do{c[u>>2]=c[w>>2];u=u+4|0;w=w+4|0;}while((u|0)<(x|0));u=a+64|0;w=s;x=u+64|0;do{c[u>>2]=c[w>>2];u=u+4|0;w=w+4|0;}while((u|0)<(x|0));u=a+128|0;w=r;x=u+64|0;do{c[u>>2]=c[w>>2];u=u+4|0;w=w+4|0;}while((u|0)<(x|0));l=v;return}function $c(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;t=l;l=l+912|0;m=t+840|0;n=t+776|0;o=t+712|0;p=t+648|0;q=t+456|0;r=t+392|0;g=t+328|0;h=t+264|0;d=t+192|0;i=t+128|0;j=t+64|0;k=t;dd(g,b);e=b+64|0;s=p;u=e;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));f=b+128|0;s=n;u=f;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));s=m;c[s>>2]=1091403767;c[s+4>>2]=-167360562;s=m+8|0;c[s>>2]=-753151983;c[s+4>>2]=792555341;s=m+16|0;c[s>>2]=960546513;c[s+4>>2]=692269950;s=m+24|0;c[s>>2]=-1478256553;c[s+4>>2]=496343272;s=m+32|0;c[s>>2]=-980480611;c[s+4>>2]=-748862579;s=m+40|0;c[s>>2]=-171504835;c[s+4>>2]=175696680;s=m+48|0;c[s>>2]=2021213740;c[s+4>>2]=1718526831;s=m+56|0;c[s>>2]=-1710760145;c[s+4>>2]=235567041;cd(o,n,m);cd(q,p,o);fd(k,g,q);dd(p,f);s=n;u=p;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));s=m;c[s>>2]=1091403767;c[s+4>>2]=-167360562;s=m+8|0;c[s>>2]=-753151983;c[s+4>>2]=792555341;s=m+16|0;c[s>>2]=960546513;c[s+4>>2]=692269950;s=m+24|0;c[s>>2]=-1478256553;c[s+4>>2]=496343272;s=m+32|0;c[s>>2]=-980480611;c[s+4>>2]=-748862579;s=m+40|0;c[s>>2]=-171504835;c[s+4>>2]=175696680;s=m+48|0;c[s>>2]=2021213740;c[s+4>>2]=1718526831;s=m+56|0;c[s>>2]=-1710760145;c[s+4>>2]=235567041;cd(q,n,m);s=n;u=b;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));s=m;u=e;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));cd(o,n,m);fd(j,q,o);dd(p,e);s=n;u=b;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));s=m;u=f;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));cd(o,n,m);fd(i,p,o);s=n;u=f;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));s=m;u=j;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));cd(p,n,m);s=n;u=e;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));s=m;u=i;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));cd(o,n,m);gd(g,p,o);s=n;u=g;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));s=m;c[s>>2]=1091403767;c[s+4>>2]=-167360562;s=m+8|0;c[s>>2]=-753151983;c[s+4>>2]=792555341;s=m+16|0;c[s>>2]=960546513;c[s+4>>2]=692269950;s=m+24|0;c[s>>2]=-1478256553;c[s+4>>2]=496343272;s=m+32|0;c[s>>2]=-980480611;c[s+4>>2]=-748862579;s=m+40|0;c[s>>2]=-171504835;c[s+4>>2]=175696680;s=m+48|0;c[s>>2]=2021213740;c[s+4>>2]=1718526831;s=m+56|0;c[s>>2]=-1710760145;c[s+4>>2]=235567041;cd(q,n,m);s=n;u=b;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));s=m;u=k;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));cd(o,n,m);gd(h,q,o);ed(d,h);v=d;if(!((c[v>>2]|0)==1&(c[v+4>>2]|0)==0)){r=0;u=0;v=a;s=v;c[s>>2]=r;v=v+4|0;c[v>>2]=u;l=t;return}b=d+8|0;s=r;u=b;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));s=n;u=b;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));s=m;u=k;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));cd(q,n,m);s=n;u=r;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));s=m;u=j;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));cd(p,n,m);s=n;u=r;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));s=m;u=i;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));cd(o,n,m);s=q+64|0;u=p;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));s=q+128|0;u=o;v=s+64|0;do{c[s>>2]=c[u>>2];s=s+4|0;u=u+4|0;}while((s|0)<(v|0));ok(a+8|0,q|0,192)|0;r=1;u=0;v=a;s=v;c[s>>2]=r;v=v+4|0;c[v>>2]=u;l=t;return}function ad(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;y=l;l=l+896|0;q=y+832|0;r=y+768|0;s=y+704|0;t=y+640|0;u=y+576|0;v=y+512|0;w=y+448|0;e=y+384|0;f=y+320|0;g=y+256|0;h=y+192|0;i=y+128|0;j=y+64|0;k=y;x=r;z=b;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));x=q;z=d;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));cd(k,r,q);m=b+64|0;x=r;z=m;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));n=d+64|0;x=q;z=n;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));cd(j,r,q);o=b+128|0;x=r;z=o;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));p=d+128|0;x=q;z=p;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));cd(i,r,q);x=r;z=m;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));x=q;z=o;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));gd(t,r,q);x=r;z=n;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));x=q;z=p;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));gd(s,r,q);cd(u,t,s);x=q;z=j;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));fd(v,u,q);x=q;z=i;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));fd(g,v,q);x=r;z=g;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));x=q;c[x>>2]=1091403767;c[x+4>>2]=-167360562;x=q+8|0;c[x>>2]=-753151983;c[x+4>>2]=792555341;x=q+16|0;c[x>>2]=960546513;c[x+4>>2]=692269950;x=q+24|0;c[x>>2]=-1478256553;c[x+4>>2]=496343272;x=q+32|0;c[x>>2]=-980480611;c[x+4>>2]=-748862579;x=q+40|0;c[x>>2]=-171504835;c[x+4>>2]=175696680;x=q+48|0;c[x>>2]=2021213740;c[x+4>>2]=1718526831;x=q+56|0;c[x>>2]=-1710760145;c[x+4>>2]=235567041;cd(w,r,q);x=q;z=k;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));gd(h,w,q);x=r;z=b;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));x=q;z=m;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));gd(t,r,q);x=r;z=d;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));x=q;z=n;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));gd(s,r,q);cd(u,t,s);x=q;z=k;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));fd(v,u,q);x=q;z=j;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));fd(w,v,q);x=r;z=i;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));x=q;c[x>>2]=1091403767;c[x+4>>2]=-167360562;x=q+8|0;c[x>>2]=-753151983;c[x+4>>2]=792555341;x=q+16|0;c[x>>2]=960546513;c[x+4>>2]=692269950;x=q+24|0;c[x>>2]=-1478256553;c[x+4>>2]=496343272;x=q+32|0;c[x>>2]=-980480611;c[x+4>>2]=-748862579;x=q+40|0;c[x>>2]=-171504835;c[x+4>>2]=175696680;x=q+48|0;c[x>>2]=2021213740;c[x+4>>2]=1718526831;x=q+56|0;c[x>>2]=-1710760145;c[x+4>>2]=235567041;cd(s,r,q);gd(f,w,s);x=r;z=b;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));x=q;z=o;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));gd(t,r,q);x=r;z=d;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));x=q;z=p;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));gd(s,r,q);cd(u,t,s);x=q;z=k;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));fd(v,u,q);x=q;z=j;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));gd(w,v,q);x=q;z=i;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));fd(e,w,q);x=a;z=h;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));x=a+64|0;z=f;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));x=a+128|0;z=e;A=x+64|0;do{c[x>>2]=c[z>>2];x=x+4|0;z=z+4|0;}while((x|0)<(A|0));l=y;return}function bd(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0;n=l;l=l+352|0;e=n+320|0;f=n+288|0;g=n+256|0;h=n+192|0;i=n+128|0;j=n+64|0;k=n;m=h;o=b;p=m+64|0;do{c[m>>2]=c[o>>2];m=m+4|0;o=o+4|0;}while((m|0)<(p|0));c[f>>2]=c[b>>2];c[f+4>>2]=c[b+4>>2];c[f+8>>2]=c[b+8>>2];c[f+12>>2]=c[b+12>>2];c[f+16>>2]=c[b+16>>2];c[f+20>>2]=c[b+20>>2];c[f+24>>2]=c[b+24>>2];c[f+28>>2]=c[b+28>>2];c[e>>2]=0;c[e+4>>2]=0;c[e+8>>2]=0;c[e+12>>2]=0;c[e+16>>2]=0;c[e+20>>2]=0;c[e+24>>2]=0;c[e+28>>2]=0;if((Ic(f,e)|0)<<24>>24==1){c[e>>2]=c[34];c[e+4>>2]=c[35];c[e+8>>2]=c[36];c[e+12>>2]=c[37];c[e+16>>2]=c[38];c[e+20>>2]=c[39];c[e+24>>2]=c[40];c[e+28>>2]=c[41];Pc(e,f);c[f>>2]=c[e>>2];c[f+4>>2]=c[e+4>>2];c[f+8>>2]=c[e+8>>2];c[f+12>>2]=c[e+12>>2];c[f+16>>2]=c[e+16>>2];c[f+20>>2]=c[e+20>>2];c[f+24>>2]=c[e+24>>2];c[f+28>>2]=c[e+28>>2];};c[k>>2]=c[f>>2];c[k+4>>2]=c[f+4>>2];c[k+8>>2]=c[f+8>>2];c[k+12>>2]=c[f+12>>2];c[k+16>>2]=c[f+16>>2];c[k+20>>2]=c[f+20>>2];c[k+24>>2]=c[f+24>>2];c[k+28>>2]=c[f+28>>2];p=h+32|0;c[f>>2]=c[p>>2];c[f+4>>2]=c[p+4>>2];c[f+8>>2]=c[p+8>>2];c[f+12>>2]=c[p+12>>2];c[f+16>>2]=c[p+16>>2];c[f+20>>2]=c[p+20>>2];c[f+24>>2]=c[p+24>>2];c[f+28>>2]=c[p+28>>2];c[e>>2]=0;c[e+4>>2]=0;c[e+8>>2]=0;c[e+12>>2]=0;c[e+16>>2]=0;c[e+20>>2]=0;c[e+24>>2]=0;c[e+28>>2]=0;if((Ic(f,e)|0)<<24>>24==1){c[e>>2]=c[34];c[e+4>>2]=c[35];c[e+8>>2]=c[36];c[e+12>>2]=c[37];c[e+16>>2]=c[38];c[e+20>>2]=c[39];c[e+24>>2]=c[40];c[e+28>>2]=c[41];Pc(e,f);c[f>>2]=c[e>>2];c[f+4>>2]=c[e+4>>2];c[f+8>>2]=c[e+8>>2];c[f+12>>2]=c[e+12>>2];c[f+16>>2]=c[e+16>>2];c[f+20>>2]=c[e+20>>2];c[f+24>>2]=c[e+24>>2];c[f+28>>2]=c[e+28>>2];};c[g>>2]=c[f>>2];c[g+4>>2]=c[f+4>>2];c[g+8>>2]=c[f+8>>2];c[g+12>>2]=c[f+12>>2];c[g+16>>2]=c[f+16>>2];c[g+20>>2]=c[f+20>>2];c[g+24>>2]=c[f+24>>2];c[g+28>>2]=c[f+28>>2];d=k+32|0;c[d>>2]=c[g>>2];c[d+4>>2]=c[g+4>>2];c[d+8>>2]=c[g+8>>2];c[d+12>>2]=c[g+12>>2];c[d+16>>2]=c[g+16>>2];c[d+20>>2]=c[g+20>>2];c[d+24>>2]=c[g+24>>2];c[d+28>>2]=c[g+28>>2];d=b+64|0;m=h;o=d;p=m+64|0;do{c[m>>2]=c[o>>2];m=m+4|0;o=o+4|0;}while((m|0)<(p|0));c[f>>2]=c[d>>2];c[f+4>>2]=c[d+4>>2];c[f+8>>2]=c[d+8>>2];c[f+12>>2]=c[d+12>>2];c[f+16>>2]=c[d+16>>2];c[f+20>>2]=c[d+20>>2];c[f+24>>2]=c[d+24>>2];c[f+28>>2]=c[d+28>>2];c[e>>2]=0;c[e+4>>2]=0;c[e+8>>2]=0;c[e+12>>2]=0;c[e+16>>2]=0;c[e+20>>2]=0;c[e+24>>2]=0;c[e+28>>2]=0;if((Ic(f,e)|0)<<24>>24==1){c[e>>2]=c[34];c[e+4>>2]=c[35];c[e+8>>2]=c[36];c[e+12>>2]=c[37];c[e+16>>2]=c[38];c[e+20>>2]=c[39];c[e+24>>2]=c[40];c[e+28>>2]=c[41];Pc(e,f);c[f>>2]=c[e>>2];c[f+4>>2]=c[e+4>>2];c[f+8>>2]=c[e+8>>2];c[f+12>>2]=c[e+12>>2];c[f+16>>2]=c[e+16>>2];c[f+20>>2]=c[e+20>>2];c[f+24>>2]=c[e+24>>2];c[f+28>>2]=c[e+28>>2];};c[j>>2]=c[f>>2];c[j+4>>2]=c[f+4>>2];c[j+8>>2]=c[f+8>>2];c[j+12>>2]=c[f+12>>2];c[j+16>>2]=c[f+16>>2];c[j+20>>2]=c[f+20>>2];c[j+24>>2]=c[f+24>>2];c[j+28>>2]=c[f+28>>2];p=h+32|0;c[f>>2]=c[p>>2];c[f+4>>2]=c[p+4>>2];c[f+8>>2]=c[p+8>>2];c[f+12>>2]=c[p+12>>2];c[f+16>>2]=c[p+16>>2];c[f+20>>2]=c[p+20>>2];c[f+24>>2]=c[p+24>>2];c[f+28>>2]=c[p+28>>2];c[e>>2]=0;c[e+4>>2]=0;c[e+8>>2]=0;c[e+12>>2]=0;c[e+16>>2]=0;c[e+20>>2]=0;c[e+24>>2]=0;c[e+28>>2]=0;if((Ic(f,e)|0)<<24>>24==1){c[e>>2]=c[34];c[e+4>>2]=c[35];c[e+8>>2]=c[36];c[e+12>>2]=c[37];c[e+16>>2]=c[38];c[e+20>>2]=c[39];c[e+24>>2]=c[40];c[e+28>>2]=c[41];Pc(e,f);c[f>>2]=c[e>>2];c[f+4>>2]=c[e+4>>2];c[f+8>>2]=c[e+8>>2];c[f+12>>2]=c[e+12>>2];c[f+16>>2]=c[e+16>>2];c[f+20>>2]=c[e+20>>2];c[f+24>>2]=c[e+24>>2];c[f+28>>2]=c[e+28>>2];};c[g>>2]=c[f>>2];c[g+4>>2]=c[f+4>>2];c[g+8>>2]=c[f+8>>2];c[g+12>>2]=c[f+12>>2];c[g+16>>2]=c[f+16>>2];c[g+20>>2]=c[f+20>>2];c[g+24>>2]=c[f+24>>2];c[g+28>>2]=c[f+28>>2];m=j+32|0;c[m>>2]=c[g>>2];c[m+4>>2]=c[g+4>>2];c[m+8>>2]=c[g+8>>2];c[m+12>>2]=c[g+12>>2];c[m+16>>2]=c[g+16>>2];c[m+20>>2]=c[g+20>>2];c[m+24>>2]=c[g+24>>2];c[m+28>>2]=c[g+28>>2];b=b+128|0;m=h;o=b;p=m+64|0;do{c[m>>2]=c[o>>2];m=m+4|0;o=o+4|0;}while((m|0)<(p|0));c[f>>2]=c[b>>2];c[f+4>>2]=c[b+4>>2];c[f+8>>2]=c[b+8>>2];c[f+12>>2]=c[b+12>>2];c[f+16>>2]=c[b+16>>2];c[f+20>>2]=c[b+20>>2];c[f+24>>2]=c[b+24>>2];c[f+28>>2]=c[b+28>>2];c[e>>2]=0;c[e+4>>2]=0;c[e+8>>2]=0;c[e+12>>2]=0;c[e+16>>2]=0;c[e+20>>2]=0;c[e+24>>2]=0;c[e+28>>2]=0;if((Ic(f,e)|0)<<24>>24==1){c[e>>2]=c[34];c[e+4>>2]=c[35];c[e+8>>2]=c[36];c[e+12>>2]=c[37];c[e+16>>2]=c[38];c[e+20>>2]=c[39];c[e+24>>2]=c[40];c[e+28>>2]=c[41];Pc(e,f);c[f>>2]=c[e>>2];c[f+4>>2]=c[e+4>>2];c[f+8>>2]=c[e+8>>2];c[f+12>>2]=c[e+12>>2];c[f+16>>2]=c[e+16>>2];c[f+20>>2]=c[e+20>>2];c[f+24>>2]=c[e+24>>2];c[f+28>>2]=c[e+28>>2];};c[i>>2]=c[f>>2];c[i+4>>2]=c[f+4>>2];c[i+8>>2]=c[f+8>>2];c[i+12>>2]=c[f+12>>2];c[i+16>>2]=c[f+16>>2];c[i+20>>2]=c[f+20>>2];c[i+24>>2]=c[f+24>>2];c[i+28>>2]=c[f+28>>2];p=h+32|0;c[f>>2]=c[p>>2];c[f+4>>2]=c[p+4>>2];c[f+8>>2]=c[p+8>>2];c[f+12>>2]=c[p+12>>2];c[f+16>>2]=c[p+16>>2];c[f+20>>2]=c[p+20>>2];c[f+24>>2]=c[p+24>>2];c[f+28>>2]=c[p+28>>2];c[e>>2]=0;c[e+4>>2]=0;c[e+8>>2]=0;c[e+12>>2]=0;c[e+16>>2]=0;c[e+20>>2]=0;c[e+24>>2]=0;c[e+28>>2]=0;if((Ic(f,e)|0)<<24>>24!=1){c[g>>2]=c[f>>2];c[g+4>>2]=c[f+4>>2];c[g+8>>2]=c[f+8>>2];c[g+12>>2]=c[f+12>>2];c[g+16>>2]=c[f+16>>2];c[g+20>>2]=c[f+20>>2];c[g+24>>2]=c[f+24>>2];c[g+28>>2]=c[f+28>>2];m=i+32|0;c[m>>2]=c[g>>2];c[m+4>>2]=c[g+4>>2];c[m+8>>2]=c[g+8>>2];c[m+12>>2]=c[g+12>>2];c[m+16>>2]=c[g+16>>2];c[m+20>>2]=c[g+20>>2];c[m+24>>2]=c[g+24>>2];c[m+28>>2]=c[g+28>>2];m=a;o=k;p=m+64|0;do{c[m>>2]=c[o>>2];m=m+4|0;o=o+4|0;}while((m|0)<(p|0));m=a+64|0;o=j;p=m+64|0;do{c[m>>2]=c[o>>2];m=m+4|0;o=o+4|0;}while((m|0)<(p|0));m=a+128|0;o=i;p=m+64|0;do{c[m>>2]=c[o>>2];m=m+4|0;o=o+4|0;}while((m|0)<(p|0));l=n;return};c[e>>2]=c[34];c[e+4>>2]=c[35];c[e+8>>2]=c[36];c[e+12>>2]=c[37];c[e+16>>2]=c[38];c[e+20>>2]=c[39];c[e+24>>2]=c[40];c[e+28>>2]=c[41];Pc(e,f);c[f>>2]=c[e>>2];c[f+4>>2]=c[e+4>>2];c[f+8>>2]=c[e+8>>2];c[f+12>>2]=c[e+12>>2];c[f+16>>2]=c[e+16>>2];c[f+20>>2]=c[e+20>>2];c[f+24>>2]=c[e+24>>2];c[f+28>>2]=c[e+28>>2];c[g>>2]=c[f>>2];c[g+4>>2]=c[f+4>>2];c[g+8>>2]=c[f+8>>2];c[g+12>>2]=c[f+12>>2];c[g+16>>2]=c[f+16>>2];c[g+20>>2]=c[f+20>>2];c[g+24>>2]=c[f+24>>2];c[g+28>>2]=c[f+28>>2];m=i+32|0;c[m>>2]=c[g>>2];c[m+4>>2]=c[g+4>>2];c[m+8>>2]=c[g+8>>2];c[m+12>>2]=c[g+12>>2];c[m+16>>2]=c[g+16>>2];c[m+20>>2]=c[g+20>>2];c[m+24>>2]=c[g+24>>2];c[m+28>>2]=c[g+28>>2];m=a;o=k;p=m+64|0;do{c[m>>2]=c[o>>2];m=m+4|0;o=o+4|0;}while((m|0)<(p|0));m=a+64|0;o=j;p=m+64|0;do{c[m>>2]=c[o>>2];m=m+4|0;o=o+4|0;}while((m|0)<(p|0));m=a+128|0;o=i;p=m+64|0;do{c[m>>2]=c[o>>2];m=m+4|0;o=o+4|0;}while((m|0)<(p|0));l=n;return}function cd(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0;e=l;l=l+288|0;h=e+256|0;o=e+224|0;n=e+192|0;m=e+160|0;j=e+128|0;g=e+96|0;f=e+64|0;i=e+32|0;k=e;c[o>>2]=c[b>>2];c[o+4>>2]=c[b+4>>2];c[o+8>>2]=c[b+8>>2];c[o+12>>2]=c[b+12>>2];c[o+16>>2]=c[b+16>>2];c[o+20>>2]=c[b+20>>2];c[o+24>>2]=c[b+24>>2];c[o+28>>2]=c[b+28>>2];c[h>>2]=c[d>>2];c[h+4>>2]=c[d+4>>2];c[h+8>>2]=c[d+8>>2];c[h+12>>2]=c[d+12>>2];c[h+16>>2]=c[d+16>>2];c[h+20>>2]=c[d+20>>2];c[h+24>>2]=c[d+24>>2];c[h+28>>2]=c[d+28>>2];Mc(o,h,136,-460954743,-2016278654);c[k>>2]=c[o>>2];c[k+4>>2]=c[o+4>>2];c[k+8>>2]=c[o+8>>2];c[k+12>>2]=c[o+12>>2];c[k+16>>2]=c[o+16>>2];c[k+20>>2]=c[o+20>>2];c[k+24>>2]=c[o+24>>2];c[k+28>>2]=c[o+28>>2];q=b+32|0;c[o>>2]=c[q>>2];c[o+4>>2]=c[q+4>>2];c[o+8>>2]=c[q+8>>2];c[o+12>>2]=c[q+12>>2];c[o+16>>2]=c[q+16>>2];c[o+20>>2]=c[q+20>>2];c[o+24>>2]=c[q+24>>2];c[o+28>>2]=c[q+28>>2];p=d+32|0;c[h>>2]=c[p>>2];c[h+4>>2]=c[p+4>>2];c[h+8>>2]=c[p+8>>2];c[h+12>>2]=c[p+12>>2];c[h+16>>2]=c[p+16>>2];c[h+20>>2]=c[p+20>>2];c[h+24>>2]=c[p+24>>2];c[h+28>>2]=c[p+28>>2];Mc(o,h,136,-460954743,-2016278654);c[i>>2]=c[o>>2];c[i+4>>2]=c[o+4>>2];c[i+8>>2]=c[o+8>>2];c[i+12>>2]=c[o+12>>2];c[i+16>>2]=c[o+16>>2];c[i+20>>2]=c[o+20>>2];c[i+24>>2]=c[o+24>>2];c[i+28>>2]=c[o+28>>2];c[o>>2]=c[i>>2];c[o+4>>2]=c[i+4>>2];c[o+8>>2]=c[i+8>>2];c[o+12>>2]=c[i+12>>2];c[o+16>>2]=c[i+16>>2];c[o+20>>2]=c[i+20>>2];c[o+24>>2]=c[i+24>>2];c[o+28>>2]=c[i+28>>2];r=h;c[r>>2]=317583274;c[r+4>>2]=1757628553;r=h+8|0;c[r>>2]=1923792719;c[r+4>>2]=-1928822936;r=h+16|0;c[r>>2]=151523889;c[r+4>>2]=1373741639;r=h+24|0;c[r>>2]=1193918714;c[r+4>>2]=576313009;Mc(o,h,136,-460954743,-2016278654);c[n>>2]=c[o>>2];c[n+4>>2]=c[o+4>>2];c[n+8>>2]=c[o+8>>2];c[n+12>>2]=c[o+12>>2];c[n+16>>2]=c[o+16>>2];c[n+20>>2]=c[o+20>>2];c[n+24>>2]=c[o+24>>2];c[n+28>>2]=c[o+28>>2];c[h>>2]=c[k>>2];c[h+4>>2]=c[k+4>>2];c[h+8>>2]=c[k+8>>2];c[h+12>>2]=c[k+12>>2];c[h+16>>2]=c[k+16>>2];c[h+20>>2]=c[k+20>>2];c[h+24>>2]=c[k+24>>2];c[h+28>>2]=c[k+28>>2];Kc(n,h,136);c[a>>2]=c[n>>2];c[a+4>>2]=c[n+4>>2];c[a+8>>2]=c[n+8>>2];c[a+12>>2]=c[n+12>>2];c[a+16>>2]=c[n+16>>2];c[a+20>>2]=c[n+20>>2];c[a+24>>2]=c[n+24>>2];c[a+28>>2]=c[n+28>>2];c[o>>2]=c[b>>2];c[o+4>>2]=c[b+4>>2];c[o+8>>2]=c[b+8>>2];c[o+12>>2]=c[b+12>>2];c[o+16>>2]=c[b+16>>2];c[o+20>>2]=c[b+20>>2];c[o+24>>2]=c[b+24>>2];c[o+28>>2]=c[b+28>>2];c[h>>2]=c[q>>2];c[h+4>>2]=c[q+4>>2];c[h+8>>2]=c[q+8>>2];c[h+12>>2]=c[q+12>>2];c[h+16>>2]=c[q+16>>2];c[h+20>>2]=c[q+20>>2];c[h+24>>2]=c[q+24>>2];c[h+28>>2]=c[q+28>>2];Kc(o,h,136);c[m>>2]=c[o>>2];c[m+4>>2]=c[o+4>>2];c[m+8>>2]=c[o+8>>2];c[m+12>>2]=c[o+12>>2];c[m+16>>2]=c[o+16>>2];c[m+20>>2]=c[o+20>>2];c[m+24>>2]=c[o+24>>2];c[m+28>>2]=c[o+28>>2];c[o>>2]=c[d>>2];c[o+4>>2]=c[d+4>>2];c[o+8>>2]=c[d+8>>2];c[o+12>>2]=c[d+12>>2];c[o+16>>2]=c[d+16>>2];c[o+20>>2]=c[d+20>>2];c[o+24>>2]=c[d+24>>2];c[o+28>>2]=c[d+28>>2];c[h>>2]=c[p>>2];c[h+4>>2]=c[p+4>>2];c[h+8>>2]=c[p+8>>2];c[h+12>>2]=c[p+12>>2];c[h+16>>2]=c[p+16>>2];c[h+20>>2]=c[p+20>>2];c[h+24>>2]=c[p+24>>2];c[h+28>>2]=c[p+28>>2];Kc(o,h,136);c[n>>2]=c[o>>2];c[n+4>>2]=c[o+4>>2];c[n+8>>2]=c[o+8>>2];c[n+12>>2]=c[o+12>>2];c[n+16>>2]=c[o+16>>2];c[n+20>>2]=c[o+20>>2];c[n+24>>2]=c[o+24>>2];c[n+28>>2]=c[o+28>>2];Mc(m,n,136,-460954743,-2016278654);c[j>>2]=c[m>>2];c[j+4>>2]=c[m+4>>2];c[j+8>>2]=c[m+8>>2];c[j+12>>2]=c[m+12>>2];c[j+16>>2]=c[m+16>>2];c[j+20>>2]=c[m+20>>2];c[j+24>>2]=c[m+24>>2];c[j+28>>2]=c[m+28>>2];c[h>>2]=c[k>>2];c[h+4>>2]=c[k+4>>2];c[h+8>>2]=c[k+8>>2];c[h+12>>2]=c[k+12>>2];c[h+16>>2]=c[k+16>>2];c[h+20>>2]=c[k+20>>2];c[h+24>>2]=c[k+24>>2];c[h+28>>2]=c[k+28>>2];Lc(j,h,136);c[g>>2]=c[j>>2];c[g+4>>2]=c[j+4>>2];c[g+8>>2]=c[j+8>>2];c[g+12>>2]=c[j+12>>2];c[g+16>>2]=c[j+16>>2];c[g+20>>2]=c[j+20>>2];c[g+24>>2]=c[j+24>>2];c[g+28>>2]=c[j+28>>2];c[h>>2]=c[i>>2];c[h+4>>2]=c[i+4>>2];c[h+8>>2]=c[i+8>>2];c[h+12>>2]=c[i+12>>2];c[h+16>>2]=c[i+16>>2];c[h+20>>2]=c[i+20>>2];c[h+24>>2]=c[i+24>>2];c[h+28>>2]=c[i+28>>2];Lc(g,h,136);c[f>>2]=c[g>>2];c[f+4>>2]=c[g+4>>2];c[f+8>>2]=c[g+8>>2];c[f+12>>2]=c[g+12>>2];c[f+16>>2]=c[g+16>>2];c[f+20>>2]=c[g+20>>2];c[f+24>>2]=c[g+24>>2];c[f+28>>2]=c[g+28>>2];d=a+32|0;c[d>>2]=c[f>>2];c[d+4>>2]=c[f+4>>2];c[d+8>>2]=c[f+8>>2];c[d+12>>2]=c[f+12>>2];c[d+16>>2]=c[f+16>>2];c[d+20>>2]=c[f+20>>2];c[d+24>>2]=c[f+24>>2];c[d+28>>2]=c[f+28>>2];l=e;return}function dd(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0;d=l;l=l+224|0;g=d+192|0;f=d+160|0;e=d+128|0;k=d+96|0;j=d+64|0;i=d+32|0;h=d;c[f>>2]=c[b>>2];c[f+4>>2]=c[b+4>>2];c[f+8>>2]=c[b+8>>2];c[f+12>>2]=c[b+12>>2];c[f+16>>2]=c[b+16>>2];c[f+20>>2]=c[b+20>>2];c[f+24>>2]=c[b+24>>2];c[f+28>>2]=c[b+28>>2];m=b+32|0;c[g>>2]=c[m>>2];c[g+4>>2]=c[m+4>>2];c[g+8>>2]=c[m+8>>2];c[g+12>>2]=c[m+12>>2];c[g+16>>2]=c[m+16>>2];c[g+20>>2]=c[m+20>>2];c[g+24>>2]=c[m+24>>2];c[g+28>>2]=c[m+28>>2];Mc(f,g,136,-460954743,-2016278654);c[h>>2]=c[f>>2];c[h+4>>2]=c[f+4>>2];c[h+8>>2]=c[f+8>>2];c[h+12>>2]=c[f+12>>2];c[h+16>>2]=c[f+16>>2];c[h+20>>2]=c[f+20>>2];c[h+24>>2]=c[f+24>>2];c[h+28>>2]=c[f+28>>2];c[f>>2]=c[m>>2];c[f+4>>2]=c[m+4>>2];c[f+8>>2]=c[m+8>>2];c[f+12>>2]=c[m+12>>2];c[f+16>>2]=c[m+16>>2];c[f+20>>2]=c[m+20>>2];c[f+24>>2]=c[m+24>>2];c[f+28>>2]=c[m+28>>2];n=g;c[n>>2]=317583274;c[n+4>>2]=1757628553;n=g+8|0;c[n>>2]=1923792719;c[n+4>>2]=-1928822936;n=g+16|0;c[n>>2]=151523889;c[n+4>>2]=1373741639;n=g+24|0;c[n>>2]=1193918714;c[n+4>>2]=576313009;Mc(f,g,136,-460954743,-2016278654);c[e>>2]=c[f>>2];c[e+4>>2]=c[f+4>>2];c[e+8>>2]=c[f+8>>2];c[e+12>>2]=c[f+12>>2];c[e+16>>2]=c[f+16>>2];c[e+20>>2]=c[f+20>>2];c[e+24>>2]=c[f+24>>2];c[e+28>>2]=c[f+28>>2];c[g>>2]=c[b>>2];c[g+4>>2]=c[b+4>>2];c[g+8>>2]=c[b+8>>2];c[g+12>>2]=c[b+12>>2];c[g+16>>2]=c[b+16>>2];c[g+20>>2]=c[b+20>>2];c[g+24>>2]=c[b+24>>2];c[g+28>>2]=c[b+28>>2];Kc(e,g,136);c[k>>2]=c[e>>2];c[k+4>>2]=c[e+4>>2];c[k+8>>2]=c[e+8>>2];c[k+12>>2]=c[e+12>>2];c[k+16>>2]=c[e+16>>2];c[k+20>>2]=c[e+20>>2];c[k+24>>2]=c[e+24>>2];c[k+28>>2]=c[e+28>>2];c[f>>2]=c[b>>2];c[f+4>>2]=c[b+4>>2];c[f+8>>2]=c[b+8>>2];c[f+12>>2]=c[b+12>>2];c[f+16>>2]=c[b+16>>2];c[f+20>>2]=c[b+20>>2];c[f+24>>2]=c[b+24>>2];c[f+28>>2]=c[b+28>>2];c[g>>2]=c[m>>2];c[g+4>>2]=c[m+4>>2];c[g+8>>2]=c[m+8>>2];c[g+12>>2]=c[m+12>>2];c[g+16>>2]=c[m+16>>2];c[g+20>>2]=c[m+20>>2];c[g+24>>2]=c[m+24>>2];c[g+28>>2]=c[m+28>>2];Kc(f,g,136);c[e>>2]=c[f>>2];c[e+4>>2]=c[f+4>>2];c[e+8>>2]=c[f+8>>2];c[e+12>>2]=c[f+12>>2];c[e+16>>2]=c[f+16>>2];c[e+20>>2]=c[f+20>>2];c[e+24>>2]=c[f+24>>2];c[e+28>>2]=c[f+28>>2];Mc(k,e,136,-460954743,-2016278654);c[j>>2]=c[k>>2];c[j+4>>2]=c[k+4>>2];c[j+8>>2]=c[k+8>>2];c[j+12>>2]=c[k+12>>2];c[j+16>>2]=c[k+16>>2];c[j+20>>2]=c[k+20>>2];c[j+24>>2]=c[k+24>>2];c[j+28>>2]=c[k+28>>2];c[g>>2]=c[h>>2];c[g+4>>2]=c[h+4>>2];c[g+8>>2]=c[h+8>>2];c[g+12>>2]=c[h+12>>2];c[g+16>>2]=c[h+16>>2];c[g+20>>2]=c[h+20>>2];c[g+24>>2]=c[h+24>>2];c[g+28>>2]=c[h+28>>2];Lc(j,g,136);c[i>>2]=c[j>>2];c[i+4>>2]=c[j+4>>2];c[i+8>>2]=c[j+8>>2];c[i+12>>2]=c[j+12>>2];c[i+16>>2]=c[j+16>>2];c[i+20>>2]=c[j+20>>2];c[i+24>>2]=c[j+24>>2];c[i+28>>2]=c[j+28>>2];c[f>>2]=c[h>>2];c[f+4>>2]=c[h+4>>2];c[f+8>>2]=c[h+8>>2];c[f+12>>2]=c[h+12>>2];c[f+16>>2]=c[h+16>>2];c[f+20>>2]=c[h+20>>2];c[f+24>>2]=c[h+24>>2];c[f+28>>2]=c[h+28>>2];b=g;c[b>>2]=317583274;c[b+4>>2]=1757628553;b=g+8|0;c[b>>2]=1923792719;c[b+4>>2]=-1928822936;b=g+16|0;c[b>>2]=151523889;c[b+4>>2]=1373741639;b=g+24|0;c[b>>2]=1193918714;c[b+4>>2]=576313009;Mc(f,g,136,-460954743,-2016278654);c[e>>2]=c[f>>2];c[e+4>>2]=c[f+4>>2];c[e+8>>2]=c[f+8>>2];c[e+12>>2]=c[f+12>>2];c[e+16>>2]=c[f+16>>2];c[e+20>>2]=c[f+20>>2];c[e+24>>2]=c[f+24>>2];c[e+28>>2]=c[f+28>>2];Lc(i,e,136);c[a>>2]=c[i>>2];c[a+4>>2]=c[i+4>>2];c[a+8>>2]=c[i+8>>2];c[a+12>>2]=c[i+12>>2];c[a+16>>2]=c[i+16>>2];c[a+20>>2]=c[i+20>>2];c[a+24>>2]=c[i+24>>2];c[a+28>>2]=c[i+28>>2];c[f>>2]=c[h>>2];c[f+4>>2]=c[h+4>>2];c[f+8>>2]=c[h+8>>2];c[f+12>>2]=c[h+12>>2];c[f+16>>2]=c[h+16>>2];c[f+20>>2]=c[h+20>>2];c[f+24>>2]=c[h+24>>2];c[f+28>>2]=c[h+28>>2];c[g>>2]=c[h>>2];c[g+4>>2]=c[h+4>>2];c[g+8>>2]=c[h+8>>2];c[g+12>>2]=c[h+12>>2];c[g+16>>2]=c[h+16>>2];c[g+20>>2]=c[h+20>>2];c[g+24>>2]=c[h+24>>2];c[g+28>>2]=c[h+28>>2];Kc(f,g,136);c[e>>2]=c[f>>2];c[e+4>>2]=c[f+4>>2];c[e+8>>2]=c[f+8>>2];c[e+12>>2]=c[f+12>>2];c[e+16>>2]=c[f+16>>2];c[e+20>>2]=c[f+20>>2];c[e+24>>2]=c[f+24>>2];c[e+28>>2]=c[f+28>>2];b=a+32|0;c[b>>2]=c[e>>2];c[b+4>>2]=c[e+4>>2];c[b+8>>2]=c[e+8>>2];c[b+12>>2]=c[e+12>>2];c[b+16>>2]=c[e+16>>2];c[b+20>>2]=c[e+20>>2];c[b+24>>2]=c[e+24>>2];c[b+28>>2]=c[e+28>>2];l=d;return}function ed(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0;n=l;l=l+288|0;f=n+256|0;g=n+224|0;h=n+192|0;i=n+160|0;d=n+96|0;m=n+64|0;j=n+32|0;k=n;c[g>>2]=c[b>>2];c[g+4>>2]=c[b+4>>2];c[g+8>>2]=c[b+8>>2];c[g+12>>2]=c[b+12>>2];c[g+16>>2]=c[b+16>>2];c[g+20>>2]=c[b+20>>2];c[g+24>>2]=c[b+24>>2];c[g+28>>2]=c[b+28>>2];c[f>>2]=c[b>>2];c[f+4>>2]=c[b+4>>2];c[f+8>>2]=c[b+8>>2];c[f+12>>2]=c[b+12>>2];c[f+16>>2]=c[b+16>>2];c[f+20>>2]=c[b+20>>2];c[f+24>>2]=c[b+24>>2];c[f+28>>2]=c[b+28>>2];Mc(g,f,136,-460954743,-2016278654);c[d>>2]=c[g>>2];c[d+4>>2]=c[g+4>>2];c[d+8>>2]=c[g+8>>2];c[d+12>>2]=c[g+12>>2];c[d+16>>2]=c[g+16>>2];c[d+20>>2]=c[g+20>>2];c[d+24>>2]=c[g+24>>2];c[d+28>>2]=c[g+28>>2];e=b+32|0;c[g>>2]=c[e>>2];c[g+4>>2]=c[e+4>>2];c[g+8>>2]=c[e+8>>2];c[g+12>>2]=c[e+12>>2];c[g+16>>2]=c[e+16>>2];c[g+20>>2]=c[e+20>>2];c[g+24>>2]=c[e+24>>2];c[g+28>>2]=c[e+28>>2];c[f>>2]=c[e>>2];c[f+4>>2]=c[e+4>>2];c[f+8>>2]=c[e+8>>2];c[f+12>>2]=c[e+12>>2];c[f+16>>2]=c[e+16>>2];c[f+20>>2]=c[e+20>>2];c[f+24>>2]=c[e+24>>2];c[f+28>>2]=c[e+28>>2];Mc(g,f,136,-460954743,-2016278654);c[h>>2]=c[g>>2];c[h+4>>2]=c[g+4>>2];c[h+8>>2]=c[g+8>>2];c[h+12>>2]=c[g+12>>2];c[h+16>>2]=c[g+16>>2];c[h+20>>2]=c[g+20>>2];c[h+24>>2]=c[g+24>>2];c[h+28>>2]=c[g+28>>2];o=f;c[o>>2]=317583274;c[o+4>>2]=1757628553;o=f+8|0;c[o>>2]=1923792719;c[o+4>>2]=-1928822936;o=f+16|0;c[o>>2]=151523889;c[o+4>>2]=1373741639;o=f+24|0;c[o>>2]=1193918714;c[o+4>>2]=576313009;Mc(h,f,136,-460954743,-2016278654);c[i>>2]=c[h>>2];c[i+4>>2]=c[h+4>>2];c[i+8>>2]=c[h+8>>2];c[i+12>>2]=c[h+12>>2];c[i+16>>2]=c[h+16>>2];c[i+20>>2]=c[h+20>>2];c[i+24>>2]=c[h+24>>2];c[i+28>>2]=c[h+28>>2];Lc(d,i,136);c[j>>2]=c[d>>2];c[j+4>>2]=c[d+4>>2];c[j+8>>2]=c[d+8>>2];c[j+12>>2]=c[d+12>>2];c[j+16>>2]=c[d+16>>2];c[j+20>>2]=c[d+20>>2];c[j+24>>2]=c[d+24>>2];c[j+28>>2]=c[d+28>>2];o=j;if((((c[o>>2]|0)==0&(c[o+4>>2]|0)==0?(o=j+8|0,(c[o>>2]|0)==0&(c[o+4>>2]|0)==0):0)?(o=j+16|0,(c[o>>2]|0)==0&(c[o+4>>2]|0)==0):0)?(o=j+24|0,(c[o>>2]|0)==0&(c[o+4>>2]|0)==0):0){k=0;m=0;o=a;a=o;c[a>>2]=k;o=o+4|0;c[o>>2]=m;l=n;return}Oc(j,136);Mc(j,104,136,-460954743,-2016278654);c[k>>2]=c[j>>2];c[k+4>>2]=c[j+4>>2];c[k+8>>2]=c[j+8>>2];c[k+12>>2]=c[j+12>>2];c[k+16>>2]=c[j+16>>2];c[k+20>>2]=c[j+20>>2];c[k+24>>2]=c[j+24>>2];c[k+28>>2]=c[j+28>>2];c[m>>2]=c[k>>2];c[m+4>>2]=c[k+4>>2];c[m+8>>2]=c[k+8>>2];c[m+12>>2]=c[k+12>>2];c[m+16>>2]=c[k+16>>2];c[m+20>>2]=c[k+20>>2];c[m+24>>2]=c[k+24>>2];c[m+28>>2]=c[k+28>>2];c[g>>2]=c[b>>2];c[g+4>>2]=c[b+4>>2];c[g+8>>2]=c[b+8>>2];c[g+12>>2]=c[b+12>>2];c[g+16>>2]=c[b+16>>2];c[g+20>>2]=c[b+20>>2];c[g+24>>2]=c[b+24>>2];c[g+28>>2]=c[b+28>>2];c[f>>2]=c[k>>2];c[f+4>>2]=c[k+4>>2];c[f+8>>2]=c[k+8>>2];c[f+12>>2]=c[k+12>>2];c[f+16>>2]=c[k+16>>2];c[f+20>>2]=c[k+20>>2];c[f+24>>2]=c[k+24>>2];c[f+28>>2]=c[k+28>>2];Mc(g,f,136,-460954743,-2016278654);c[d>>2]=c[g>>2];c[d+4>>2]=c[g+4>>2];c[d+8>>2]=c[g+8>>2];c[d+12>>2]=c[g+12>>2];c[d+16>>2]=c[g+16>>2];c[d+20>>2]=c[g+20>>2];c[d+24>>2]=c[g+24>>2];c[d+28>>2]=c[g+28>>2];c[g>>2]=c[e>>2];c[g+4>>2]=c[e+4>>2];c[g+8>>2]=c[e+8>>2];c[g+12>>2]=c[e+12>>2];c[g+16>>2]=c[e+16>>2];c[g+20>>2]=c[e+20>>2];c[g+24>>2]=c[e+24>>2];c[g+28>>2]=c[e+28>>2];c[f>>2]=c[m>>2];c[f+4>>2]=c[m+4>>2];c[f+8>>2]=c[m+8>>2];c[f+12>>2]=c[m+12>>2];c[f+16>>2]=c[m+16>>2];c[f+20>>2]=c[m+20>>2];c[f+24>>2]=c[m+24>>2];c[f+28>>2]=c[m+28>>2];Mc(g,f,136,-460954743,-2016278654);c[h>>2]=c[g>>2];c[h+4>>2]=c[g+4>>2];c[h+8>>2]=c[g+8>>2];c[h+12>>2]=c[g+12>>2];c[h+16>>2]=c[g+16>>2];c[h+20>>2]=c[g+20>>2];c[h+24>>2]=c[g+24>>2];c[h+28>>2]=c[g+28>>2];Nc(h,136);c[i>>2]=c[h>>2];c[i+4>>2]=c[h+4>>2];c[i+8>>2]=c[h+8>>2];c[i+12>>2]=c[h+12>>2];c[i+16>>2]=c[h+16>>2];c[i+20>>2]=c[h+20>>2];c[i+24>>2]=c[h+24>>2];c[i+28>>2]=c[h+28>>2];e=d+32|0;c[e>>2]=c[i>>2];c[e+4>>2]=c[i+4>>2];c[e+8>>2]=c[i+8>>2];c[e+12>>2]=c[i+12>>2];c[e+16>>2]=c[i+16>>2];c[e+20>>2]=c[i+20>>2];c[e+24>>2]=c[i+24>>2];c[e+28>>2]=c[i+28>>2];e=a+8|0;b=e+64|0;do{c[e>>2]=c[d>>2];e=e+4|0;d=d+4|0;}while((e|0)<(b|0));k=1;m=0;o=a;a=o;c[a>>2]=k;o=o+4|0;c[o>>2]=m;l=n;return}function fd(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=l;l=l+96|0;h=e+64|0;g=e+32|0;f=e;c[g>>2]=c[b>>2];c[g+4>>2]=c[b+4>>2];c[g+8>>2]=c[b+8>>2];c[g+12>>2]=c[b+12>>2];c[g+16>>2]=c[b+16>>2];c[g+20>>2]=c[b+20>>2];c[g+24>>2]=c[b+24>>2];c[g+28>>2]=c[b+28>>2];c[h>>2]=c[d>>2];c[h+4>>2]=c[d+4>>2];c[h+8>>2]=c[d+8>>2];c[h+12>>2]=c[d+12>>2];c[h+16>>2]=c[d+16>>2];c[h+20>>2]=c[d+20>>2];c[h+24>>2]=c[d+24>>2];c[h+28>>2]=c[d+28>>2];Lc(g,h,136);c[a>>2]=c[g>>2];c[a+4>>2]=c[g+4>>2];c[a+8>>2]=c[g+8>>2];c[a+12>>2]=c[g+12>>2];c[a+16>>2]=c[g+16>>2];c[a+20>>2]=c[g+20>>2];c[a+24>>2]=c[g+24>>2];c[a+28>>2]=c[g+28>>2];b=b+32|0;c[g>>2]=c[b>>2];c[g+4>>2]=c[b+4>>2];c[g+8>>2]=c[b+8>>2];c[g+12>>2]=c[b+12>>2];c[g+16>>2]=c[b+16>>2];c[g+20>>2]=c[b+20>>2];c[g+24>>2]=c[b+24>>2];c[g+28>>2]=c[b+28>>2];d=d+32|0;c[h>>2]=c[d>>2];c[h+4>>2]=c[d+4>>2];c[h+8>>2]=c[d+8>>2];c[h+12>>2]=c[d+12>>2];c[h+16>>2]=c[d+16>>2];c[h+20>>2]=c[d+20>>2];c[h+24>>2]=c[d+24>>2];c[h+28>>2]=c[d+28>>2];Lc(g,h,136);c[f>>2]=c[g>>2];c[f+4>>2]=c[g+4>>2];c[f+8>>2]=c[g+8>>2];c[f+12>>2]=c[g+12>>2];c[f+16>>2]=c[g+16>>2];c[f+20>>2]=c[g+20>>2];c[f+24>>2]=c[g+24>>2];c[f+28>>2]=c[g+28>>2];d=a+32|0;c[d>>2]=c[f>>2];c[d+4>>2]=c[f+4>>2];c[d+8>>2]=c[f+8>>2];c[d+12>>2]=c[f+12>>2];c[d+16>>2]=c[f+16>>2];c[d+20>>2]=c[f+20>>2];c[d+24>>2]=c[f+24>>2];c[d+28>>2]=c[f+28>>2];l=e;return}function gd(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=l;l=l+96|0;h=e+64|0;g=e+32|0;f=e;c[g>>2]=c[b>>2];c[g+4>>2]=c[b+4>>2];c[g+8>>2]=c[b+8>>2];c[g+12>>2]=c[b+12>>2];c[g+16>>2]=c[b+16>>2];c[g+20>>2]=c[b+20>>2];c[g+24>>2]=c[b+24>>2];c[g+28>>2]=c[b+28>>2];c[h>>2]=c[d>>2];c[h+4>>2]=c[d+4>>2];c[h+8>>2]=c[d+8>>2];c[h+12>>2]=c[d+12>>2];c[h+16>>2]=c[d+16>>2];c[h+20>>2]=c[d+20>>2];c[h+24>>2]=c[d+24>>2];c[h+28>>2]=c[d+28>>2];Kc(g,h,136);c[a>>2]=c[g>>2];c[a+4>>2]=c[g+4>>2];c[a+8>>2]=c[g+8>>2];c[a+12>>2]=c[g+12>>2];c[a+16>>2]=c[g+16>>2];c[a+20>>2]=c[g+20>>2];c[a+24>>2]=c[g+24>>2];c[a+28>>2]=c[g+28>>2];b=b+32|0;c[g>>2]=c[b>>2];c[g+4>>2]=c[b+4>>2];c[g+8>>2]=c[b+8>>2];c[g+12>>2]=c[b+12>>2];c[g+16>>2]=c[b+16>>2];c[g+20>>2]=c[b+20>>2];c[g+24>>2]=c[b+24>>2];c[g+28>>2]=c[b+28>>2];d=d+32|0;c[h>>2]=c[d>>2];c[h+4>>2]=c[d+4>>2];c[h+8>>2]=c[d+8>>2];c[h+12>>2]=c[d+12>>2];c[h+16>>2]=c[d+16>>2];c[h+20>>2]=c[d+20>>2];c[h+24>>2]=c[d+24>>2];c[h+28>>2]=c[d+28>>2];Kc(g,h,136);c[f>>2]=c[g>>2];c[f+4>>2]=c[g+4>>2];c[f+8>>2]=c[g+8>>2];c[f+12>>2]=c[g+12>>2];c[f+16>>2]=c[g+16>>2];c[f+20>>2]=c[g+20>>2];c[f+24>>2]=c[g+24>>2];c[f+28>>2]=c[g+28>>2];d=a+32|0;c[d>>2]=c[f>>2];c[d+4>>2]=c[f+4>>2];c[d+8>>2]=c[f+8>>2];c[d+12>>2]=c[f+12>>2];c[d+16>>2]=c[f+16>>2];c[d+20>>2]=c[f+20>>2];c[d+24>>2]=c[f+24>>2];c[d+28>>2]=c[f+28>>2];l=e;return}function hd(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;g=0-d|0;f=b+((b+-1+d&g)-b)|0;if(f>>>0<b>>>0){c[a>>2]=0;return}b=N(f,e)|0;h=(e|0)==0;if(h?0:((b>>>0)/((h?1:e)>>>0)|0|0)!=(f|0)){c[a>>2]=0;return}if((d+-1&(d|-2147483648)|0)!=0|b>>>0>g>>>0)$i(2128);c[a>>2]=1;c[a+4>>2]=b;c[a+8>>2]=d;c[a+12>>2]=f;return}function id(a){a=a|0;return}function jd(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=l;l=l+16|0;f=Xb(8,4,e)|0;if(!f)Yb(e);else {c[f>>2]=a;c[f+4>>2]=b;ye(f,2152,d);}}function kd(a){a=a|0;y=286299353;return 1890621284}function ld(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,m=0,o=0,p=0;p=l;l=l+32|0;g=p+12|0;o=p;i=e<<1;if((i|0)<0)$i(2256);if(i){h=Xb(i,1,g)|0;if(!h){c[g>>2]=0;Yb(g);}else f=h;}else f=1;c[o>>2]=f;j=o+4|0;c[j>>2]=i;k=o+8|0;c[k>>2]=0;m=d+e|0;if(!e){c[b>>2]=c[o>>2];c[b+4>>2]=c[o+4>>2];c[b+8>>2]=c[o+8>>2];l=p;return}f=0;h=i;while(1){e=d+1|0;d=a[d>>0]|0;g=a[2168+((d&255)>>>4&255)>>0]|0;if((f|0)==(h|0)){n=0;Z(43,o|0);i=n;n=0;if(i&1){f=7;break}f=c[k>>2]|0;}a[(c[o>>2]|0)+f>>0]=g;f=(c[k>>2]|0)+1|0;c[k>>2]=f;g=a[2168+(d&15)>>0]|0;if((f|0)==(c[j>>2]|0)){n=0;Z(43,o|0);i=n;n=0;if(i&1){f=7;break}f=c[k>>2]|0;}a[(c[o>>2]|0)+f>>0]=g;f=(c[k>>2]|0)+1|0;c[k>>2]=f;if((e|0)==(m|0)){f=17;break}d=e;h=c[j>>2]|0;}if((f|0)==7){p=na()|0;md(o);za(p|0);}else if((f|0)==17){c[b>>2]=c[o>>2];c[b+4>>2]=c[o+4>>2];c[b+8>>2]=c[o+8>>2];l=p;return}}function md(a){a=a|0;var b=0;b=c[a+4>>2]|0;if(!b)return;Zb(c[a>>2]|0,b,1);return}function nd(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0;i=l;l=l+64|0;d=i+32|0;e=i+8|0;f=i+4|0;g=i;h=c[a>>2]|0;if((h|0)==1114112){c[d>>2]=2184;c[d+4>>2]=1;c[d+8>>2]=0;c[d+16>>2]=15892;c[d+20>>2]=0;h=si(b,d)|0;l=i;return h|0}else {c[g>>2]=h;c[f>>2]=c[a+4>>2];c[d>>2]=g;c[d+4>>2]=38;c[d+8>>2]=f;c[d+12>>2]=39;c[e>>2]=2192;c[e+4>>2]=2;c[e+8>>2]=5264;c[e+12>>2]=2;c[e+16>>2]=d;c[e+20>>2]=2;h=si(b,e)|0;l=i;return h|0}return 0}function od(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,m=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;u=l;l=l+48|0;q=u+24|0;r=u+12|0;t=u;i=e>>>1;if(i){h=Xb(i,1,q)|0;if(!h){c[q>>2]=0;Yb(q);}else g=h;}else g=1;c[t>>2]=g;s=t+4|0;c[s>>2]=i;o=t+8|0;c[o>>2]=0;p=d+e|0;g=0;j=0;i=0;h=d;a:while(1){if((h|0)==(p|0)){f=0;g=7;break}else m=j;while(1){k=h;h=h+1|0;k=a[k>>0]|0;j=m;m=m+1|0;if((k+-65&255)<6){j=-55;break}if((k+-97&255)<6){j=-87;break}if((k+-48&255)<10){j=-48;break}switch(k<<24>>24){case 9:case 10:case 13:case 32:break;default:{i=j;g=10;break a}}if((h|0)==(p|0)){f=0;g=7;break a}else i=i&15;}if((h|0)==(p|0)){f=1;g=7;break}k=j+k<<24>>24|i<<4&255;while(1){j=h;h=h+1|0;j=a[j>>0]|0;i=m;m=m+1|0;if((j+-65&255)<6){i=-55;break}if((j+-97&255)<6){i=-87;break}if((j+-48&255)<10){i=-48;break}switch(j<<24>>24){case 9:case 10:case 13:case 32:break;default:{g=10;break a}}if((h|0)==(p|0)){f=1;g=7;break a}else k=k&15;}i=i+j<<24>>24|k<<4&255;if((g|0)==(c[s>>2]|0)){n=0;Z(43,t|0);k=n;n=0;if(k&1){g=6;break}g=c[o>>2]|0;}a[(c[t>>2]|0)+g>>0]=i;g=(c[o>>2]|0)+1|0;c[o>>2]=g;j=m;}if((g|0)==6){u=na()|0;md(t);za(u|0);}else if((g|0)==7){if(f){c[b>>2]=1;c[b+4>>2]=1114112;f=c[s>>2]|0;if(f|0)Zb(c[t>>2]|0,f,1);}else {c[q>>2]=c[t>>2];c[q+4>>2]=c[t+4>>2];c[q+8>>2]=c[t+8>>2];s=c[q>>2]|0;t=s+(c[q+8>>2]|0)|0;d=c[q+4>>2]|0;c[q>>2]=s;c[q+4>>2]=d;c[q+8>>2]=s;c[q+12>>2]=t;pd(r,q);c[b>>2]=0;t=b+4|0;c[t>>2]=c[r>>2];c[t+4>>2]=c[r+4>>2];c[t+8>>2]=c[r+8>>2];}l=u;return}else if((g|0)==10){do if((i|0)==0|(i|0)==(e|0))f=d+i|0;else {if(i>>>0<e>>>0?(f=d+i|0,(a[f>>0]|0)>-65):0)break;n=0;ea(5,d|0,e|0,i|0,e|0);n=0;u=na()|0;md(t);za(u|0);}while(0);m=d+i+(e-i)|0;e=(f|0)==(m|0);g=e?f:d+i+1|0;do if(!e){j=a[f>>0]|0;if(j<<24>>24<=-1){k=j&31;if((g|0)==(m|0)){f=0;h=m;}else {f=a[g>>0]&63;h=g+1|0;}g=f&255;f=g|k<<6;if((j&255)>223){if((h|0)==(m|0)){f=0;h=m;}else {f=a[h>>0]&63;h=h+1|0;}g=f&255|g<<6;f=g|k<<12;if((j&255)>239){if((h|0)==(m|0))f=0;else f=a[h>>0]&63;f=g<<6|k<<18&1835008|f&255;if((f|0)==1114112)break}}}else f=j&255;c[b>>2]=1;c[b+4>>2]=f;c[b+8>>2]=i;f=c[s>>2]|0;if(f|0)Zb(c[t>>2]|0,f,1);l=u;return}while(0);n=0;Z(44,2208);n=0;u=na()|0;md(t);za(u|0);}}function pd(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;h=l;l=l+32|0;i=h+16|0;j=h;d=c[b>>2]|0;if((d|0)==(c[b+8>>2]|0)){i=c[b+4>>2]|0;j=(c[b+12>>2]|0)-d|0;c[a>>2]=d;c[a+4>>2]=i;c[a+8>>2]=j;l=h;return}c[j>>2]=1;c[j+4>>2]=0;g=j+8|0;c[g>>2]=0;c[i>>2]=c[b>>2];c[i+4>>2]=c[b+4>>2];c[i+8>>2]=c[b+8>>2];c[i+12>>2]=c[b+12>>2];d=i+8|0;b=c[d>>2]|0;e=c[i+12>>2]|0;f=e-b|0;n=0;aa(20,j|0,0,f|0);k=n;n=0;if(k&1){d=na()|0;n=0;Z(45,i|0);k=n;n=0;if(!(k&1)){k=d;qd(j);za(k|0);}k=na()|0;qd(j);za(k|0);}else {k=c[g>>2]|0;ok((c[j>>2]|0)+k|0,b|0,f|0)|0;c[g>>2]=k+f;c[d>>2]=e;d=c[i+4>>2]|0;if(d|0)Zb(c[i>>2]|0,d,1);c[a>>2]=c[j>>2];c[a+4>>2]=c[j+4>>2];c[a+8>>2]=c[j+8>>2];l=h;return}}function qd(a){a=a|0;var b=0;b=c[a+4>>2]|0;if(!b)return;Zb(c[a>>2]|0,b,1);return}function rd(a){a=a|0;var b=0,d=0;b=a+8|0;d=c[a+12>>2]|0;if((c[b>>2]|0)!=(d|0))c[b>>2]=d;b=c[a+4>>2]|0;if(!b)return;Zb(c[a>>2]|0,b,1);return}function sd(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0;g=l;l=l+16|0;e=g;f=a+4|0;b=c[f>>2]|0;if(b|0){d=b<<1;if((d|0)<0)$i(2256);b=_b(c[a>>2]|0,b,1,d,1,e)|0;if(!b){i=e+4|0;j=c[i>>2]|0;i=c[i+4>>2]|0;c[e>>2]=c[e>>2];h=e+4|0;c[h>>2]=j;c[h+4>>2]=i;Yb(e);}h=b;i=a;j=d;c[i>>2]=h;c[f>>2]=j;l=g;return}ud(e,1,1,4);if((c[e>>2]|0)==1){b=c[e+4>>2]|0;if(b|0?(d=Xb(b,c[e+8>>2]|0,e)|0,d|0):0){h=d;i=a;j=4;c[i>>2]=h;c[f>>2]=j;l=g;return}}c[e>>2]=1;c[e+4>>2]=6818;c[e+8>>2]=30;Yb(e);}function td(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;j=l;l=l+16|0;h=j;i=a+4|0;e=c[i>>2]|0;if((e-b|0)>>>0>=d>>>0){l=j;return}d=b+d|0;if(d>>>0<b>>>0)cj(6768,17);g=e<<1;g=d>>>0>=g>>>0?d:g;ud(h,1,1,g);if((c[h>>2]|0)!=1)$i(2232);d=c[h+4>>2]|0;b=c[h+8>>2]|0;if((d|0)<0)$i(2256);e=c[i>>2]|0;if(!e){b=Xb(d,b,h)|0;d=(b|0)==0&1;e=0;f=0;}else {b=_b(c[a>>2]|0,e,1,d,b,h)|0;e=(b|0)==0;f=h+4|0;d=e&1;b=e?c[h>>2]|0:b;e=c[f>>2]|0;f=c[f+4>>2]|0;}if((d|0)==1){c[h>>2]=b;d=h+4|0;c[d>>2]=e;c[d+4>>2]=f;Yb(h);}c[a>>2]=b;c[i>>2]=g;l=j;return}function ud(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;g=0-d|0;f=b+((b+-1+d&g)-b)|0;if(f>>>0<b>>>0){c[a>>2]=0;return}b=N(f,e)|0;h=(e|0)==0;if(h?0:((b>>>0)/((h?1:e)>>>0)|0|0)!=(f|0)){c[a>>2]=0;return}if((d+-1&(d|-2147483648)|0)!=0|b>>>0>g>>>0)$i(2280);c[a>>2]=1;c[a+4>>2]=b;c[a+8>>2]=d;c[a+12>>2]=f;return}function vd(a){a=a|0;y=286299353;return 1890621284}function wd(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;j=l;l=l+16|0;f=j;g=b+8|0;i=g;h=c[i>>2]|0;i=c[i+4>>2]|0;e=c[b>>2]|0;k=ti(b)|0;d=c[b>>2]|0;if(k){d=d|8;c[b>>2]=d;if(!(c[g>>2]|0)){c[g>>2]=1;c[b+12>>2]=10;}}c[b>>2]=d|4;c[f>>2]=c[a>>2];k=_h(f,b)|0;c[g>>2]=h;c[g+4>>2]=i;c[b>>2]=e;l=j;return k|0}function xd(a,b){a=a|0;b=b|0;return $h(c[a>>2]|0,b)|0}function yd(a,b){a=a|0;b=b|0;return ci(c[a>>2]|0,b)|0}function zd(a,b){a=a|0;b=b|0;return di(c[a>>2]|0,b)|0}function Ad(a,b){a=a|0;b=b|0;return zi(c[a>>2]|0,c[a+4>>2]|0,b)|0}function Bd(a,b){a=a|0;b=b|0;return bi(c[a>>2]|0,b)|0}function Cd(a,b){a=a|0;b=b|0;var d=0;d=c[b+4>>2]|0;if(!d)return;Zb(a,d,c[b+8>>2]|0);return}function Dd(a){a=a|0;Zb(a,12,4);return}function Ed(a,b){a=a|0;b=b|0;return mf(c[a>>2]|0,b)|0}function Fd(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0;n=l;l=l+16|0;k=n;m=c[b>>2]|0;b=d>>>0<65536;if(d>>>0<128){e=m+8|0;b=c[e>>2]|0;if((b|0)==(c[m+4>>2]|0)){Bg(m);b=c[e>>2]|0;}a[(c[m>>2]|0)+b>>0]=d;c[e>>2]=(c[e>>2]|0)+1;l=n;return 0}c[k>>2]=0;if(d>>>0<2048){i=31;f=0;g=-64;e=1;b=2;}else {if(b){e=15;f=0;g=-32;h=1;j=2;b=3;}else {a[k>>0]=d>>>18&255|-16;e=63;f=1;g=-128;h=2;j=3;b=4;}a[k+f>>0]=e&d>>>12&255|g;i=63;f=h;g=-128;e=j;}a[k+f>>0]=i&d>>>6&255|g;a[k+e>>0]=d&63|-128;j=m+8|0;Cg(m,c[j>>2]|0,b);d=c[j>>2]|0;c[j>>2]=d+b;ok((c[m>>2]|0)+d|0,k|0,b|0)|0;l=n;return 0}function Gd(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=l;l=l+32|0;e=d+8|0;f=d;c[f>>2]=c[a>>2];c[e>>2]=c[b>>2];c[e+4>>2]=c[b+4>>2];c[e+8>>2]=c[b+8>>2];c[e+12>>2]=c[b+12>>2];c[e+16>>2]=c[b+16>>2];c[e+20>>2]=c[b+20>>2];b=ki(f,2672,e)|0;l=d;return b|0}function Hd(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=l;l=l+32|0;e=d+8|0;f=d;c[f>>2]=c[a>>2];c[e>>2]=c[b>>2];c[e+4>>2]=c[b+4>>2];c[e+8>>2]=c[b+8>>2];c[e+12>>2]=c[b+12>>2];c[e+16>>2]=c[b+16>>2];c[e+20>>2]=c[b+20>>2];b=ki(f,3764,e)|0;l=d;return b|0}function Id(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=c[a>>2]|0;f=e+8|0;Cg(e,c[f>>2]|0,d);a=c[f>>2]|0;c[f>>2]=a+d;ok((c[e>>2]|0)+a|0,b|0,d|0)|0;return 0}function Jd(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;h=l;l=l+16|0;i=h;b=c[b>>2]|0;qh(i,c[b>>2]|0,d,e);if((a[i>>0]|0)==3){i=0;l=h;return i|0}g=i;f=c[g>>2]|0;g=c[g+4>>2]|0;d=b+4|0;e=f&255;if((a[d>>0]|0)!=3?(n=0,Z(46,d|0),b=n,n=0,b&1):0){b=na()|0;h=d;c[h>>2]=f;c[h+4>>2]=g;if(e<<24>>24!=3)za(b|0);jf(i);za(b|0);}i=d;c[i>>2]=f;c[i+4>>2]=g;i=1;l=h;return i|0}function Kd(a,b){a=a|0;b=b|0;c[a>>2]=0;return}function Ld(a){a=a|0;y=1307671337;return -1091417412}function Md(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;f=l;l=l+32|0;e=f+8|0;d=f;c[e>>2]=c[a>>2];c[e+4>>2]=c[a+4>>2];c[e+8>>2]=c[a+8>>2];c[e+12>>2]=c[a+12>>2];c[e+16>>2]=c[a+16>>2];c[e+20>>2]=c[a+20>>2];rh(d,f+32|0,e);e=c[d+4>>2]|0;switch((c[d>>2]&255)<<24>>24){case 0:case 1:case 3:{l=f;return}default:{}}b=e;d=e;a=b+4|0;n=0;Z(c[c[a>>2]>>2]|0,c[d>>2]|0);g=n;n=0;if(g&1){g=na()|0;Cd(c[d>>2]|0,c[a>>2]|0);Dd(b);za(g|0);}a=c[a>>2]|0;b=c[a+4>>2]|0;if(b|0)Zb(c[e>>2]|0,b,c[a+8>>2]|0);Zb(e,12,4);l=f;return}function Nd(a){a=a|0;var b=0,d=0;b=l;l=l+32|0;d=b+24|0;c[d>>2]=a;c[d+4>>2]=40;c[b>>2]=2304;c[b+4>>2]=2;c[b+8>>2]=5180;c[b+12>>2]=1;c[b+16>>2]=d;c[b+20>>2]=1;Md(b);Ha();}function Od(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,m=0;m=l;l=l+48|0;i=m;j=m+40|0;h=m+24|0;k=m+12|0;g=m+32|0;c[g>>2]=b;c[g+4>>2]=d;Oh(i,6943,4);c[j>>2]=pg(i)|0;n=0;Z(47,3804);d=n;n=0;if(d&1){m=na()|0;Vg(j);za(m|0);}d=c[j>>2]|0;b=i;c[b>>2]=0;c[b+4>>2]=0;c[i+8>>2]=d;lh(3804,i);zh(e,f);c[h>>2]=0;c[j>>2]=0;c[i>>2]=g;if(!(Hh(48,i,h,j)|0)){b=0;d=c[i>>2]|0;}else {b=fb[c[600]&7]()|0;if(!b)Ue(10081,57);if((c[b>>2]|0)==1){b=b+4|0;d=c[b>>2]|0;}else {d=fb[c[2404>>2]&7]()|0;g=b;c[g>>2]=1;c[g+4>>2]=d;b=b+4|0;}d=d+-1|0;a[b>>0]=d;a[b+1>>0]=d>>8;a[b+2>>0]=d>>16;a[b+3>>0]=d>>24;d=c[j>>2]|0;c[k+4>>2]=c[h>>2];b=1;}c[k>>2]=b;c[k+4+(b<<2)>>2]=d;do if((c[3956]|0)!=3){a[j>>0]=1;c[i>>2]=j;n=0;ea(6,15824,0,i|0,3084);j=n;n=0;if(!(j&1))break;m=na()|0;Pd(k);za(m|0);}while(0);j=c[k>>2]|0;f=c[k+4>>2]|0;d=c[k+8>>2]|0;e=(j|0)==1?101:f;b=f;if(!j){l=m;return e|0}n=0;Z(c[d>>2]|0,b|0);k=n;n=0;if(k&1){m=na()|0;Qd(b,d);za(m|0);}b=c[d+4>>2]|0;if(!b){l=m;return e|0}Zb(f,b,c[d+8>>2]|0);l=m;return e|0}function Pd(a){a=a|0;var b=0,d=0;if(!(c[a>>2]|0))return;d=a+4|0;a=a+8|0;n=0;Z(c[c[a>>2]>>2]|0,c[d>>2]|0);b=n;n=0;if(b&1){b=na()|0;Qd(c[d>>2]|0,c[a>>2]|0);za(b|0);}a=c[a>>2]|0;b=c[a+4>>2]|0;if(!b)return;Zb(c[d>>2]|0,b,c[a+8>>2]|0);return}function Qd(a,b){a=a|0;b=b|0;var d=0;d=c[b+4>>2]|0;if(!d)return;Zb(a,d,c[b+8>>2]|0);return}function Rd(){return 0}function Sd(a,b){a=a|0;b=b|0;c[a>>2]=6947;c[a+4>>2]=39;return}function Td(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=l;l=l+48|0;g=d+40|0;f=d+24|0;e=d;c[g>>2]=6947;c[g+4>>2]=39;c[f>>2]=g;c[f+4>>2]=41;c[f+8>>2]=a;c[f+12>>2]=42;c[e>>2]=2320;c[e+4>>2]=2;c[e+8>>2]=5264;c[e+12>>2]=2;c[e+16>>2]=f;c[e+20>>2]=2;b=si(b,e)|0;l=d;return b|0}function Ud(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;i=l;l=l+32|0;g=i+12|0;h=i+24|0;f=i;c[f>>2]=0;c[f+4>>2]=d;c[f+8>>2]=e;d=$a(43,f|0)|0;switch(d|0){case 9:case 5:case 3:{g=c[f>>2]|0;c[b>>2]=0;h=0;h=b+4+(h<<2)|0;c[h>>2]=g;l=i;return}default:{}}e=Xb(4,4,g)|0;if(!e)Yb(g);c[e>>2]=d;d=Xb(12,4,g)|0;if(!d)Yb(g);c[d>>2]=e;c[d+4>>2]=2696;a[d+8>>0]=16;g=d+9|0;a[g>>0]=a[h>>0]|0;a[g+1>>0]=a[h+1>>0]|0;a[g+2>>0]=a[h+2>>0]|0;c[b>>2]=1;c[b+4>>2]=2;h=1;g=d;h=b+4+(h<<2)|0;c[h>>2]=g;l=i;return}function Vd(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;f=l;l=l+16|0;d=f;c[d>>2]=0;a=ra(a|0,d|0)|0;a=(((a|0)!=0&(c[d>>2]|0)==0)<<31>>31)+a|0;d=ha(a|0)|0;e=c[b>>2]|0;if(e>>>0>=(c[b+8>>2]|0)>>>0){l=f;return 0}g=c[b+4>>2]|0;c[g+(e<<3)>>2]=a;c[g+(e<<3)+4>>2]=d;c[b>>2]=(c[b>>2]|0)+1;l=f;return 0}function Wd(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0;h=l;l=l+32|0;g=h;e=h+16|0;c[e>>2]=0;c[e+4>>2]=0;c[e+8>>2]=0;c[e+12>>2]=0;do if((Ta(d|0,e|0)|0)!=0?(n=c[e+8>>2]|0,(n|0)!=0):0){e=Hj(n)|0;if((e|0)==-1)kj(-1,0);else {Fi(g,n,e);k=(c[g>>2]|0)==1;i=k?0:c[g+4>>2]|0;j=0;k=k?0:0;m=c[g+8>>2]|0;break}}else {i=0;j=0;k=0;m=0;}while(0);o=c[f>>2]|0;n=c[f+12>>2]|0;p=c[o>>2]|0;o=c[o+4>>2]|0;e=c[c[f+4>>2]>>2]|0;f=c[c[f+8>>2]>>2]|0;d=c[f>>2]|0;f=c[f+4>>2]|0;q=g;c[q>>2]=i|j;c[q+4>>2]=k|m;xg(b,p,o,e,d,f,g,a[n>>0]|0);l=h;return}function Xd(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0;P=l;l=l+96|0;j=P;O=P+80|0;e=P+64|0;c[e>>2]=0;c[e+4>>2]=0;c[e+8>>2]=0;c[e+12>>2]=0;if(!(Ta(d|0,e|0)|0)){a[b>>0]=3;l=P;return}e=c[e+8>>2]|0;if(!e){a[b>>0]=3;l=P;return}g=Hj(e)|0;if((g|0)==-1)kj(-1,0);Fi(j,e,g);e=c[j+4>>2]|0;g=c[j+8>>2]|0;if((c[j>>2]|0)==1|(e|0)==0){a[b>>0]=3;l=P;return}Ni(j,e,g,6988,28);D=c[j>>2]|0;do if((D|0)==1){e=j+8|0;g=c[j+48>>2]|0;d=c[j+52>>2]|0;h=c[j+56>>2]|0;i=c[j+60>>2]|0;if((c[j+36>>2]|0)==-1){Yd(O,e,g,d,h,i,1);break}else {Yd(O,e,g,d,h,i,0);break}}else {M=j+28|0;E=j+48|0;F=j+52|0;N=j+36|0;G=j+56|0;H=j+60|0;I=j+8|0;J=j+16|0;K=j+24|0;L=j+12|0;C=j+4|0;e=0;a:while(1){if((e|0)==1){B=c[F>>2]|0;h=c[E>>2]|0;q=c[G>>2]|0;z=c[H>>2]|0;r=z+-1|0;t=I;s=c[t>>2]|0;t=c[t+4>>2]|0;u=c[J>>2]|0;d=c[K>>2]|0;v=z-d|0;g=c[M>>2]|0;i=c[N>>2]|0;if((g|0)==(B|0)){d=61;break}A=(i|0)==-1;j=r+g|0;b:do if(j>>>0<B>>>0){e=z+g|0;w=e+r|0;x=w>>>0<B>>>0;m=d+g|0;n=m+r|0;o=n>>>0<B>>>0;p=g+1-u|0;d=g;while(1){c:while(1){while(1){if((g|0)!=(d|0)){g=i;break b}k=nk(1,0,a[h+j>>0]&63|0)|0;if(!((k&s|0)==0&(y&t|0)==0))break;i=A?i:0;if(x){d=e;j=w;}else {d=B;g=i;break b}}d=A?u:i>>>0>=u>>>0?i:u;while(1){if(d>>>0>=z>>>0)break c;if(d>>>0>4294967294)break c;j=d+g|0;if(j>>>0>=B>>>0){d=45;break a}if((a[q+d>>0]|0)==(a[h+j>>0]|0))d=d+1|0;else break}d=p+d|0;i=A?i:0;j=d+r|0;if(j>>>0>=B>>>0){d=B;g=i;break b}}d=A?0:i;j=u;do{k=j;j=j+-1|0;if(d>>>0>=k>>>0){d=49;break a}if(j>>>0>=z>>>0){d=56;break a}k=j+g|0;if(k>>>0>=B>>>0){d=52;break a}}while((a[q+j>>0]|0)==(a[h+k>>0]|0));i=A?i:v;if(o){d=m;j=n;}else {d=B;g=i;break}}}else {d=B;g=i;}while(0);d:do if((d|0)==0|(B|0)==(d|0))e=d;else {e=d;do{if(B>>>0>e>>>0?(a[h+e>>0]|0)>-65:0)break d;e=e+1|0;}while(!((e|0)==0|(B|0)==(e|0)))}while(0);c[M>>2]=d>>>0>=e>>>0?d:e;c[N>>2]=g;g=B;}else {g=c[F>>2]|0;h=c[E>>2]|0;}k=(a[L>>0]|0)!=0;a[L>>0]=(k^1)&1;m=c[C>>2]|0;if(!((m|0)==0|(g|0)==(m|0))){if(g>>>0<=m>>>0){d=13;break}e=h+m|0;if((a[e>>0]|0)<=-65){d=13;break}}else e=h+m|0;j=h+m+(g-m)|0;B=(e|0)==(j|0);g=B?e:h+m+1|0;do if(!B){h=a[e>>0]|0;if(h<<24>>24>-1){e=h&255;break}i=h&31;if((g|0)==(j|0)){e=0;d=j;}else {e=a[g>>0]&63;d=g+1|0;}g=e&255;e=g|i<<6;if((h&255)>223){if((d|0)==(j|0)){e=0;d=j;}else {e=a[d>>0]&63;d=d+1|0;}g=e&255|g<<6;e=g|i<<12;if((h&255)>239){if((d|0)==(j|0))e=0;else e=a[d>>0]&63;e=g<<6|i<<18&1835008|e&255;}}}else e=1114112;while(0);if(k){g=m;e=m;d=63;break}if((e|0)==1114112){d=62;break}c[C>>2]=(e>>>0<128?1:e>>>0<2048?2:e>>>0<65536?3:4)+m;e=D;}if((d|0)==13)Ii(h,g,m,g);else if((d|0)==45)bj(2336,j,B);else if((d|0)==49){c[N>>2]=i;c[M>>2]=e;if(A)d=63;else {c[N>>2]=0;d=63;}}else if((d|0)==52)bj(2336,k,B);else if((d|0)==56)bj(2352,j,z);else if((d|0)==61){c[M>>2]=B;d=62;}if((d|0)==62){c[O>>2]=0;break}else if((d|0)==63){c[O>>2]=1;c[O+4>>2]=g;c[O+8>>2]=e;break}}while(0);if((c[O>>2]|0)!=1){a[b>>0]=3;l=P;return}a[f>>0]=1;a[b>>0]=3;l=P;return}function Yd(b,d,e,f,g,h,i){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;t=d+20|0;r=h+-1|0;k=c[t>>2]|0;j=k+r|0;a:do if(j>>>0<f>>>0){s=d+28|0;p=d;o=c[p>>2]|0;p=c[p+4>>2]|0;q=c[d+8>>2]|0;m=c[d+16>>2]|0;n=h-m|0;d=k;b:while(1){c:while(1){l=d;while(1){k=nk(1,0,a[e+j>>0]&63|0)|0;if(!((k&o|0)==0&(y&p|0)==0))break;d=l+h|0;c[t>>2]=d;if(!i)c[s>>2]=0;j=d+r|0;if(j>>>0>=f>>>0)break a;else l=d;}if(i)d=q;else {d=c[s>>2]|0;d=d>>>0>=q>>>0?d:q;}do{if(d>>>0>=h>>>0)break c;j=d;d=d+1|0;if(j>>>0>4294967294)break c;k=l+j|0;if(k>>>0>=f>>>0){d=17;break b}}while((a[g+j>>0]|0)==(a[e+k>>0]|0));d=d+l-q|0;c[t>>2]=d;if(!i)c[s>>2]=0;j=d+r|0;if(j>>>0>=f>>>0)break a}d=i?0:c[s>>2]|0;j=q;do{k=j;j=j+-1|0;if(d>>>0>=k>>>0){d=23;break b}if(j>>>0>=h>>>0){d=33;break b}k=j+l|0;if(k>>>0>=f>>>0){d=26;break b}}while((a[g+j>>0]|0)==(a[e+k>>0]|0));d=m+l|0;c[t>>2]=d;if(!i)c[s>>2]=n;j=d+r|0;if(j>>>0>=f>>>0)break a}if((d|0)==17)bj(2336,k,f);else if((d|0)==23){d=l+h|0;c[t>>2]=d;if(!i)c[s>>2]=0;c[b>>2]=1;c[b+4>>2]=l;c[b+8>>2]=d;return}else if((d|0)==26)bj(2336,k,f);else if((d|0)==33)bj(2352,j,h);}while(0);c[t>>2]=f;c[b>>2]=0;return}function Zd(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=l;l=l+16|0;f=d+12|0;e=d;vi(e,b,7086,11);c[f>>2]=a;Si(e,f,2368)|0;b=Ti(e)|0;l=d;return b|0}function _d(a){a=a|0;return}function $d(a,b){a=a|0;b=b|0;return Mh(c[a>>2]|0,b)|0}function ae(a,b){a=a|0;b=b|0;return Lf(c[a>>2]|0,c[a+4>>2]|0,b)|0}function be(a){a=a|0;return}function ce(){var a=0,b=0,d=0,e=0;e=l;l=l+16|0;b=e;a=c[602]|0;if(!a)a=_g(2408)|0;a=Ca(a|0)|0;switch(a|0){case 0:{d=Xb(12,4,b)|0;if(!d)Yb(b);c[d>>2]=2408;b=d+4|0;a=b;c[a>>2]=0;c[a+4>>2]=0;a=c[602]|0;if(!a)a=_g(2408)|0;Sa(a|0,d|0)|0;d=b;l=e;return d|0}case 1:{d=0;l=e;return d|0}default:{d=a+4|0;l=e;return d|0}}return 0}function de(){return 0}function ee(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;g=l;l=l+16|0;d=g;c[d>>2]=a;f=c[a>>2]|0;b=c[f>>2]|0;if(!b){n=0;b=$(11,f|0)|0;h=n;n=0;if(h&1){na()|0;fe(d);Za();}else e=b;}else e=b;Sa(e|0,1)|0;Zb(a,12,4);b=c[f>>2]|0;if(b|0){h=b;Sa(h|0,0)|0;l=g;return}n=0;b=$(11,f|0)|0;h=n;n=0;if(!(h&1)){h=b;Sa(h|0,0)|0;l=g;return}na()|0;Za();}function fe(a){a=a|0;Zb(c[a>>2]|0,12,4);return}function ge(a){a=a|0;var b=0;b=c[a+4>>2]|0;if(!b)return;Zb(c[a>>2]|0,b,1);return}function he(a){a=a|0;return}function ie(a){a=a|0;var b=0,d=0;b=a+4|0;n=0;Z(c[c[b>>2]>>2]|0,c[a>>2]|0);d=n;n=0;if(d&1){d=na()|0;je(c[a>>2]|0,c[b>>2]|0);za(d|0);}b=c[b>>2]|0;d=c[b+4>>2]|0;if(!d)return;Zb(c[a>>2]|0,d,c[b+8>>2]|0);return}function je(a,b){a=a|0;b=b|0;var d=0;d=c[b+4>>2]|0;if(!d)return;Zb(a,d,c[b+8>>2]|0);return}function ke(a){a=a|0;var b=0;b=c[a+4>>2]|0;if(!b)return;Zb(c[a>>2]|0,b,1);return}function le(a){a=a|0;var b=0,d=0,e=0,f=0;f=l;l=l+16|0;e=f;b=c[a>>2]|0;if(!b)b=_g(a)|0;b=Ca(b|0)|0;switch(b|0){case 0:{d=Xb(20,4,e)|0;if(!d)Yb(e);c[d>>2]=a;c[d+8>>2]=3;b=c[a>>2]|0;if(!b)b=_g(a)|0;Sa(b|0,d|0)|0;a=d+4|0;l=f;return a|0}case 1:{a=0;l=f;return a|0}default:{a=b+4|0;l=f;return a|0}}return 0}function me(a){a=a|0;var b=0,d=0,e=0,f=0;f=l;l=l+16|0;d=f;b=c[a>>2]|0;if(!b)b=_g(a)|0;b=Ca(b|0)|0;switch(b|0){case 0:{e=Xb(20,4,d)|0;if(!e)Yb(d);c[e>>2]=a;d=e+4|0;c[d>>2]=0;b=c[a>>2]|0;if(!b)b=_g(a)|0;Sa(b|0,e|0)|0;a=d;l=f;return a|0}case 1:{a=0;l=f;return a|0}default:{a=b+4|0;l=f;return a|0}}return 0}function ne(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0;h=l;l=l+16|0;d=h+4|0;f=h;c[f>>2]=a;g=c[a>>2]|0;b=c[g>>2]|0;if(!b){n=0;b=$(11,g|0)|0;i=n;n=0;if(i&1){na()|0;oe(f);Za();}else e=b;}else e=b;Sa(e|0,1)|0;c[d>>2]=a;n=0;Z(49,d|0);i=n;n=0;if(!(i&1)){a=c[g>>2]|0;if(a|0){i=a;Sa(i|0,0)|0;l=h;return}n=0;a=$(11,g|0)|0;i=n;n=0;if(!(i&1)){i=a;Sa(i|0,0)|0;l=h;return}}na()|0;Za();}function oe(a){a=a|0;var b=0,d=0,e=0;b=c[a>>2]|0;if(c[b+4>>2]|0?(e=b+12|0,d=c[e>>2]|0,d|0):0){b=b+16|0;n=0;Z(c[c[b>>2]>>2]|0,d|0);d=n;n=0;if(d&1){d=na()|0;pe(c[e>>2]|0,c[b>>2]|0);qe(c[a>>2]|0);za(d|0);}b=c[b>>2]|0;d=c[b+4>>2]|0;if(d|0)Zb(c[e>>2]|0,d,c[b+8>>2]|0);}Zb(c[a>>2]|0,20,4);return}function pe(a,b){a=a|0;b=b|0;var d=0;d=c[b+4>>2]|0;if(!d)return;Zb(a,d,c[b+8>>2]|0);return}function qe(a){a=a|0;Zb(a,20,4);return}function re(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0;h=l;l=l+16|0;d=h;c[d>>2]=a;g=c[a>>2]|0;b=c[g>>2]|0;if(!b){n=0;b=$(11,g|0)|0;i=n;n=0;if(i&1){na()|0;te(d);Za();}else f=b;}else f=b;Sa(f|0,1)|0;if(((c[a+8>>2]&2|0)==0?(e=a+16|0,f=c[e>>2]|0,i=c[f>>2]|0,c[f>>2]=i-1,(i|0)==1):0)?(n=0,Z(50,e|0),i=n,n=0,i&1):0){na()|0;se(a);Za();}Zb(a,20,4);b=c[g>>2]|0;if(b|0){i=b;Sa(i|0,0)|0;l=h;return}n=0;b=$(11,g|0)|0;i=n;n=0;if(!(i&1)){i=b;Sa(i|0,0)|0;l=h;return}na()|0;Za();}function se(a){a=a|0;Zb(a,20,4);return}function te(a){a=a|0;var b=0,d=0,e=0;b=c[a>>2]|0;if(((c[b+8>>2]&2|0)==0?(d=b+16|0,e=c[d>>2]|0,b=c[e>>2]|0,c[e>>2]=b-1,(b|0)==1):0)?(n=0,Z(50,d|0),e=n,n=0,e&1):0){e=na()|0;se(c[a>>2]|0);za(e|0);}Zb(c[a>>2]|0,20,4);return}function ue(a){a=a|0;return a|0}function ve(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=l;l=l+16|0;f=Xb(8,4,e)|0;if(!f)Yb(e);else {c[f>>2]=a;c[f+4>>2]=b;ye(f,2432,d);}}function we(a,b){a=a|0;b=b|0;var d=0,e=0;e=l;l=l+48|0;d=e+16|0;c[e>>2]=1;c[e+4>>2]=0;c[e+8>>2]=0;c[d>>2]=c[a>>2];c[d+4>>2]=c[a+4>>2];c[d+8>>2]=c[a+8>>2];c[d+12>>2]=c[a+12>>2];c[d+16>>2]=c[a+16>>2];c[d+20>>2]=c[a+20>>2];n=0;ca(44,e|0,d|0)|0;a=n;n=0;if(a&1){d=na()|0;ge(e);za(d|0);}else {c[d>>2]=c[e>>2];c[d+4>>2]=c[e+4>>2];c[d+8>>2]=c[e+8>>2];xe(d,b);}}function xe(a,b){a=a|0;b=b|0;var d=0,e=0;e=l;l=l+32|0;d=e+12|0;c[e>>2]=c[a>>2];c[e+4>>2]=c[a+4>>2];c[e+8>>2]=c[a+8>>2];a=Xb(12,4,d)|0;if(!a)Yb(d);else {c[a>>2]=c[e>>2];c[a+4>>2]=c[e+4>>2];c[a+8>>2]=c[e+8>>2];ye(a,2416,b);}}function ye(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,m=0,o=0,p=0,q=0,r=0,s=0,t=0;r=l;l=l+80|0;p=r+56|0;q=r+32|0;k=r+8|0;c[r>>2]=b;c[r+4>>2]=d;m=c[e>>2]|0;i=c[e+4>>2]|0;j=c[e+8>>2]|0;f=c[e+12>>2]|0;g=b;h=d;n=0;e=Y(1)|0;t=n;n=0;a:do if(!(t&1)){if(!e){n=0;_(22,10081,57);n=0;break}if((c[e>>2]|0)==1){t=e+4|0;e=(c[t>>2]|0)+1|0;c[t>>2]=e;if(e>>>0>2){c[k>>2]=2504;c[k+4>>2]=1;c[k+8>>2]=0;c[k+16>>2]=15892;c[k+20>>2]=0;n=0;Z(51,k|0);t=n;n=0;if(t&1)break;Za();}else s=e;}else {s=e;c[s>>2]=1;c[s+4>>2]=0;c[e+4>>2]=1;s=1;}c[q>>2]=g;c[q+4>>2]=h;c[q+8>>2]=m;c[q+12>>2]=i;c[q+16>>2]=j;c[q+20>>2]=f;e=ya(15608)|0;switch(e|0){case 11:{n=0;aa(21,7225,36,2472);n=0;break a}case 35:break;default:o=9;}do if((o|0)==9){if(a[15644]|0){if(e|0)break;ma(15608)|0;break}c[3910]=(c[3910]|0)+1;e=c[3913]|0;if(!e){n=0;Z(52,q|0);t=n;n=0;if(t&1)break a}else {n=0;_(c[e+12>>2]|0,c[3912]|0,q|0);t=n;n=0;if(t&1)break a}c[3910]=(c[3910]|0)-1;ma(15608)|0;if(s>>>0<=1)Ae(b,d);c[p>>2]=2512;c[p+4>>2]=1;c[p+8>>2]=0;c[p+16>>2]=15892;c[p+20>>2]=0;n=0;Z(51,p|0);t=n;n=0;if(t&1)break a;Za();}while(0);n=0;aa(21,7261,41,2488);n=0;}while(0);t=na()|0;ie(r);za(t|0);}function ze(b){b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,z=0,A=0;z=l;l=l+112|0;w=z+88|0;u=z+80|0;A=z;v=z+56|0;m=z+48|0;x=z+40|0;t=z+97|0;p=z+32|0;q=z+28|0;i=z+24|0;j=z+16|0;k=z+96|0;e=ce()|0;if(!e)Ue(10081,57);if((c[e>>2]|0)==1)if((c[e+4>>2]|0)>>>0>1)e=2;else s=7;else {s=e;c[s>>2]=1;c[s+4>>2]=0;c[e+4>>2]=0;s=7;}if((s|0)==7)e=wg()|0;a[k>>0]=e;f=c[b+12>>2]|0;c[j>>2]=c[b+8>>2];c[j+4>>2]=f;c[i>>2]=c[b+16>>2];c[q>>2]=c[b+20>>2];f=c[b>>2]|0;e=c[(c[b+4>>2]|0)+12>>2]|0;b=ib[e&15](f)|0;if((b|0)==1890621284&(y|0)==286299353){e=c[f+4>>2]|0;c[p>>2]=c[f>>2];}else {b=ib[e&15](f)|0;if((b|0)==2033335871&(y|0)==160875347){e=c[f+8>>2]|0;b=c[f>>2]|0;}else {e=8;b=7345;}c[p>>2]=b;}c[p+4>>2]=e;a[t>>0]=1;e=ph(3804)|0;c[x>>2]=e;a:do if(!e){o=0;h=0;g=0;s=20;}else {e=e+16|0;f=(c[e>>2]|0)==0;e=f?0:e;do if(!f){f=c[e+4>>2]|0;b=f+-1|0;if(!f){n=0;_(14,b|0,0);n=0;break a}else {e=c[e>>2]|0;break}}else {b=0;e=0;}while(0);o=e;h=e;g=b;s=20;}while(0);do if((s|0)==20?(r=(o|0)==0,c[m>>2]=r?7353:h,c[m+4>>2]=r?9:g,c[v>>2]=m,c[v+4>>2]=p,c[v+8>>2]=j,c[v+12>>2]=i,c[v+16>>2]=q,c[v+20>>2]=k,n=0,r=$(12,2520)|0,s=n,n=0,!(s&1)):0){if(!r){n=0;_(22,10081,57);n=0;break}if((c[r>>2]|0)!=1){n=0;e=ca(45,2528,r|0)|0;s=n;n=0;if(s&1)break}else e=r+4|0;if(c[e>>2]|0){n=0;_(23,9967,16);n=0;break}b=e+4|0;h=b;g=h;g=d[g>>0]|d[g+1>>0]<<8|d[g+2>>0]<<16|d[g+3>>0]<<24;h=h+4|0;h=d[h>>0]|d[h+1>>0]<<8|d[h+2>>0]<<16|d[h+3>>0]<<24;a[b>>0]=0;a[b+1>>0]=0;a[b+2>>0]=0;a[b+3>>0]=0;a[e>>0]=0;a[e+1>>0]=0;a[e+2>>0]=0;a[e+3>>0]=0;e=(a[t>>0]|0)==1?t+1|0:0;b=A;c[b>>2]=g;c[b+4>>2]=h;b=A+8|0;c[b>>2]=e;f=h;do if(!g)if((e|0)!=0?(n=0,aa(22,v|0,b|0,2536),w=n,n=0,w&1):0){e=na()|0;b=1;s=30;}else {f=1;s=41;}else {c[u>>2]=g;c[u+4>>2]=f;n=0;aa(22,v|0,g|0,f|0);v=n;n=0;if(v&1){e=na()|0;De(u);b=0;s=30;break}c[w>>2]=g;c[w+4>>2]=h;n=0;_(24,2528,w|0);v=n;n=0;if(v&1){e=na()|0;Ee(w);b=0;s=30;break}f=c[w>>2]|0;if(f|0){e=c[w+4>>2]|0;n=0;Z(c[e>>2]|0,f|0);w=n;n=0;if(w&1){s=na()|0;pe(f,e);b=0;e=s;s=30;break}b=c[e+4>>2]|0;if(b|0)Zb(f,b,c[e+8>>2]|0);}f=0;s=41;}while(0);do if((s|0)==30)Be(x);else if((s|0)==41){e=c[x>>2]|0;if((e|0?(w=c[e>>2]|0,c[e>>2]=w-1,(w|0)==1):0)?(n=0,Z(50,x|0),x=n,n=0,x&1):0){e=na()|0;b=f<<24>>24!=0;break}b=c[A>>2]|0;if(f<<24>>24==0|(b|0)==0){l=z;return}e=A+4|0;n=0;Z(c[c[e>>2]>>2]|0,b|0);x=n;n=0;if(x&1){z=na()|0;pe(c[A>>2]|0,c[e>>2]|0);za(z|0);}e=c[e>>2]|0;b=c[e+4>>2]|0;if(!b){l=z;return}Zb(c[A>>2]|0,b,c[e+8>>2]|0);l=z;return}while(0);if(!(c[A>>2]|0)){Ee(A);A=e;za(A|0);}if(!b){A=e;za(A|0);}De(A);A=e;za(A|0);}while(0);A=na()|0;Be(x);za(A|0);}function Ae(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;f=l;l=l+48|0;e=f+32|0;d=f+8|0;c[f>>2]=Ih(a,b)|0;c[e>>2]=f;c[e+4>>2]=46;c[d>>2]=2448;c[d+4>>2]=1;c[d+8>>2]=5180;c[d+12>>2]=1;c[d+16>>2]=e;c[d+20>>2]=1;Nd(d);}function Be(a){a=a|0;var b=0,d=0;b=c[a>>2]|0;if(!b)return;d=c[b>>2]|0;c[b>>2]=d-1;if((d|0)!=1)return;Te(a);return}function Ce(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,m=0,o=0;m=l;l=l+80|0;i=m+32|0;k=m+8|0;f=m;o=c[b+4>>2]|0;g=c[b+8>>2]|0;h=c[b+12>>2]|0;j=c[b+16>>2]|0;c[i>>2]=c[b>>2];c[i+4>>2]=41;c[i+8>>2]=o;c[i+12>>2]=41;c[i+16>>2]=g;c[i+20>>2]=41;c[i+24>>2]=h;c[i+28>>2]=46;c[i+32>>2]=j;c[i+36>>2]=46;c[k>>2]=2568;c[k+4>>2]=6;c[k+8>>2]=4840;c[k+12>>2]=5;c[k+16>>2]=i;c[k+20>>2]=5;j=c[e+24>>2]|0;jb[j&31](f,d,k);switch(a[f>>0]&3){case 0:case 1:case 3:break;default:{h=c[f+4>>2]|0;f=h+4|0;n=0;Z(c[c[f>>2]>>2]|0,c[h>>2]|0);o=n;n=0;if(o&1){o=na()|0;Fe(c[h>>2]|0,c[f>>2]|0);Ge(h);za(o|0);}f=c[f>>2]|0;g=c[f+4>>2]|0;if(g|0)Zb(c[h>>2]|0,g,c[f+8>>2]|0);Zb(h,12,4);}}f=a[c[b+20>>2]>>0]|0;if(f<<24>>24!=4){tg(i,d,e,f);switch(a[i>>0]&3){case 0:case 1:case 3:break;default:{h=c[i+4>>2]|0;f=h+4|0;n=0;Z(c[c[f>>2]>>2]|0,c[h>>2]|0);o=n;n=0;if(o&1){o=na()|0;Fe(c[h>>2]|0,c[f>>2]|0);Ge(h);za(o|0);}f=c[f>>2]|0;g=c[f+4>>2]|0;if(g|0)Zb(c[h>>2]|0,g,c[f+8>>2]|0);Zb(h,12,4);}}l=m;return}f=a[7362]|0;if(f<<24>>24==1)a[7362]=0;if(!(f<<24>>24)){l=m;return}c[i>>2]=2616;c[i+4>>2]=1;c[i+8>>2]=0;c[i+16>>2]=15892;c[i+20>>2]=0;jb[j&31](k,d,i);switch(a[k>>0]&3){case 0:case 1:case 3:break;default:{h=c[k+4>>2]|0;f=h+4|0;n=0;Z(c[c[f>>2]>>2]|0,c[h>>2]|0);o=n;n=0;if(o&1){o=na()|0;Fe(c[h>>2]|0,c[f>>2]|0);Ge(h);za(o|0);}f=c[f>>2]|0;g=c[f+4>>2]|0;if(g|0)Zb(c[h>>2]|0,g,c[f+8>>2]|0);Zb(h,12,4);}}l=m;return}function De(a){a=a|0;var b=0,d=0;b=a+4|0;n=0;Z(c[c[b>>2]>>2]|0,c[a>>2]|0);d=n;n=0;if(d&1){d=na()|0;pe(c[a>>2]|0,c[b>>2]|0);za(d|0);}b=c[b>>2]|0;d=c[b+4>>2]|0;if(!d)return;Zb(c[a>>2]|0,d,c[b+8>>2]|0);return}function Ee(a){a=a|0;var b=0,d=0;b=c[a>>2]|0;if(!b)return;d=a+4|0;n=0;Z(c[c[d>>2]>>2]|0,b|0);b=n;n=0;if(b&1){b=na()|0;pe(c[a>>2]|0,c[d>>2]|0);za(b|0);}d=c[d>>2]|0;b=c[d+4>>2]|0;if(!b)return;Zb(c[a>>2]|0,b,c[d+8>>2]|0);return}function Fe(a,b){a=a|0;b=b|0;var d=0;d=c[b+4>>2]|0;if(!d)return;Zb(a,d,c[b+8>>2]|0);return}function Ge(a){a=a|0;Zb(a,12,4);return}function He(a){a=a|0;return}function Ie(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;b=dk(2,d,(e|0)>-1?e:2147483647)|0;if((b|0)==-1){e=1;b=0;d=c[(Bj()|0)>>2]|0;}else {e=0;d=0;}c[a>>2]=e;a=a+4|0;c[a>>2]=b;c[a+4>>2]=d;return}function Je(b,c){b=b|0;c=c|0;a[b>>0]=3;return}function Ke(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;qh(a,c[b>>2]|0,d,e);return}function Le(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=l;l=l+32|0;f=e;b=c[b>>2]|0;c[f>>2]=c[d>>2];c[f+4>>2]=c[d+4>>2];c[f+8>>2]=c[d+8>>2];c[f+12>>2]=c[d+12>>2];c[f+16>>2]=c[d+16>>2];c[f+20>>2]=c[d+20>>2];rh(a,b,f);l=e;return}function Me(){return me(2520)|0}function Ne(a){a=a|0;c[a>>2]=0;c[a+4>>2]=0;return}function Oe(a){a=a|0;var b=0;b=c[a>>2]|0;c[a>>2]=vg(c[b>>2]|0,c[b+4>>2]|0)|0;return}function Pe(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=l;l=l+16|0;g=c[b+4>>2]|0;c[f>>2]=c[b>>2];c[f+4>>2]=g;c[f+8>>2]=d;c[f+12>>2]=e;we(a,f);}function Qe(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;j=l;l=l+160|0;g=j;h=j+8|0;i=j+24|0;e=i;f=e+128|0;do{a[e>>0]=0;e=e+1|0;}while((e|0)<(f|0));if((ck(d,i,128)|0)<0)ve(7207,18,2456);d=Hj(i)|0;if((d|0)==-1)kj(-1,0);Fi(h,i,d);if((c[h>>2]|0)==1){h=h+4|0;i=c[h+4>>2]|0;j=g;c[j>>2]=c[h>>2];c[j+4>>2]=i;bf(7097,43,g);}else {Oh(b,c[h+4>>2]|0,c[h+8>>2]|0);l=j;return}}function Re(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,m=0,o=0,p=0,q=0,r=0,s=0;r=l;l=l+80|0;f=r;m=r+56|0;p=r+44|0;i=r+8|0;j=r+24|0;s=r+16|0;Kg(p,d,e);e=c[p>>2]|0;d=Lj(e,0,c[p+8>>2]|0)|0;if(!d){c[m>>2]=c[p>>2];c[m+4>>2]=c[p+4>>2];c[m+8>>2]=c[p+8>>2];Df(f,m);g=0;h=c[f>>2]|0;e=c[f+4>>2]|0;d=0;f=0;}else {f=p+4|0;g=1;h=d-e|0;d=c[f>>2]|0;f=c[f+4>>2]|0;}c[j>>2]=g;c[j+4>>2]=h;c[j+8>>2]=e;k=j+12|0;c[k>>2]=d;c[k+4>>2]=f;k=h;if((g|0)==1){s=j+4|0;c[m>>2]=c[s>>2];c[m+4>>2]=c[s+4>>2];c[m+8>>2]=c[s+8>>2];c[m+12>>2]=c[s+12>>2];n=0;_(25,i|0,m|0);s=n;n=0;if(s&1){s=na()|0;za(s|0);}else {q=i;p=c[q>>2]|0;q=c[q+4>>2]|0;c[b>>2]=1;s=b+4|0;c[s>>2]=p;c[s+4>>2]=q;l=r;return}}c[s>>2]=h;i=s+4|0;c[i>>2]=e;ik(15656)|0;f=Ka(h|0)|0;a:do if(!f){d=0;e=0;f=0;}else {g=Hj(f)|0;do if((g|0)!=-1){if((g|0)<0){n=0;Z(44,3740);n=0;q=25;break}if(g){d=Xb(g,1,m)|0;if(!d){c[m>>2]=0;Yb(m);}else o=d;}else o=1;c[p>>2]=o;d=p+4|0;c[d>>2]=g;e=p+8|0;c[e>>2]=0;n=0;aa(23,p|0,0,g|0);o=n;n=0;if(o&1){d=na()|0;n=0;Z(53,p|0);r=n;n=0;if(r&1){q=25;break}else break}else {q=c[e>>2]|0;c[e>>2]=q+g;ok((c[p>>2]|0)+q|0,f|0,g|0)|0;f=d;d=c[p>>2]|0;e=c[f>>2]|0;f=c[f+4>>2]|0;break a}}else {n=0;_(14,-1,0);n=0;q=25;}while(0);if((q|0)==25)d=na()|0;Se(s);s=d;za(s|0);}while(0);mk(15656)|0;c[b>>2]=0;c[b+4>>2]=d;d=b+8|0;c[d>>2]=e;c[d+4>>2]=f;a[k>>0]=0;d=c[i>>2]|0;if(d|0)Zb(c[s>>2]|0,d,1);l=r;return}function Se(b){b=b|0;var d=0;a[c[b>>2]>>0]=0;d=c[b+4>>2]|0;if(!d)return;Zb(c[b>>2]|0,d,1);return}function Te(b){b=b|0;var d=0,e=0,f=0,g=0;d=c[b>>2]|0;e=d+16|0;f=c[e>>2]|0;if(f|0?(a[f>>0]=0,g=c[d+20>>2]|0,g|0):0)Zb(c[e>>2]|0,g,1);f=d+28|0;Ga(c[f>>2]|0)|0;Zb(c[f>>2]|0,28,4);f=d+36|0;Ya(c[f>>2]|0)|0;Zb(c[f>>2]|0,48,4);f=(c[b>>2]|0)+4|0;g=c[f>>2]|0;c[f>>2]=g-1;if((g|0)!=1)return;Zb(d,48,8);return}function Ue(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;f=l;l=l+48|0;e=f+32|0;d=f+8|0;g=f;c[g>>2]=a;c[g+4>>2]=b;c[e>>2]=g;c[e+4>>2]=41;c[e+8>>2]=f+48;c[e+12>>2]=47;c[d>>2]=2624;c[d+4>>2]=2;c[d+8>>2]=5264;c[d+12>>2]=2;c[d+16>>2]=e;c[d+20>>2]=2;aj(d,2640);}function Ve(b){b=b|0;var d=0,e=0,f=0,g=0;e=(c[b>>2]|0)+4|0;if(!(a[b+4>>0]|0)){d=fb[c[600]&7]()|0;if(!d)Ue(10081,57);if((c[d>>2]|0)==1){d=d+4|0;f=c[d>>2]|0;}else {f=fb[c[2404>>2]&7]()|0;g=d;c[g>>2]=1;c[g+4>>2]=f;d=d+4|0;}a[d>>0]=f;a[d+1>>0]=f>>8;a[d+2>>0]=f>>16;a[d+3>>0]=f>>24;if(f|0)a[e>>0]=1;}mk(c[c[b>>2]>>2]|0)|0;return}function We(a){a=a|0;var b=0;b=c[a+8>>2]|0;if(!b)return;Zb(c[a+4>>2]|0,b,1);return}function Xe(b){b=b|0;var d=0,e=0,f=0,g=0;e=(c[b>>2]|0)+4|0;if(!(a[b+4>>0]|0)){d=fb[c[600]&7]()|0;if(!d)Ue(10081,57);if((c[d>>2]|0)==1){d=d+4|0;f=c[d>>2]|0;}else {f=fb[c[2404>>2]&7]()|0;g=d;c[g>>2]=1;c[g+4>>2]=f;d=d+4|0;}a[d>>0]=f;a[d+1>>0]=f>>8;a[d+2>>0]=f>>16;a[d+3>>0]=f>>24;if(f|0)a[e>>0]=1;}mk(c[c[b>>2]>>2]|0)|0;return}function Ye(a){a=a|0;Ya(c[a>>2]|0)|0;Zb(c[a>>2]|0,48,4);return}function Ze(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;i=l;l=l+64|0;g=i+32|0;f=i+8|0;h=i+48|0;c[i>>2]=b;c[i+4>>2]=d;a[h>>0]=e;c[g>>2]=i;c[g+4>>2]=41;c[g+8>>2]=h;c[g+12>>2]=48;c[f>>2]=2624;c[f+4>>2]=2;c[f+8>>2]=5264;c[f+12>>2]=2;c[f+16>>2]=g;c[f+20>>2]=2;aj(f,2640);}function _e(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;f=l;l=l+48|0;e=f+32|0;d=f+8|0;g=f;c[g>>2]=a;c[g+4>>2]=b;c[e>>2]=g;c[e+4>>2]=41;c[e+8>>2]=f+48;c[e+12>>2]=49;c[d>>2]=2624;c[d+4>>2]=2;c[d+8>>2]=5264;c[d+12>>2]=2;c[d+16>>2]=e;c[d+20>>2]=2;aj(d,2640);}function $e(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;f=l;l=l+48|0;e=f+32|0;d=f+8|0;g=f;c[g>>2]=a;c[g+4>>2]=b;c[e>>2]=g;c[e+4>>2]=41;c[e+8>>2]=f+48;c[e+12>>2]=50;c[d>>2]=2624;c[d+4>>2]=2;c[d+8>>2]=5264;c[d+12>>2]=2;c[d+16>>2]=e;c[d+20>>2]=2;aj(d,2640);}function af(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;g=l;l=l+48|0;f=g+32|0;e=g+8|0;c[g>>2]=a;c[g+4>>2]=b;c[f>>2]=g;c[f+4>>2]=41;c[f+8>>2]=d;c[f+12>>2]=51;c[e>>2]=2624;c[e+4>>2]=2;c[e+8>>2]=5264;c[e+12>>2]=2;c[e+16>>2]=f;c[e+20>>2]=2;n=0;_(9,e|0,2640);n=0;b=na()|0;We(d);za(b|0);}function bf(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;g=l;l=l+48|0;f=g+32|0;e=g+8|0;c[g>>2]=a;c[g+4>>2]=b;c[f>>2]=g;c[f+4>>2]=41;c[f+8>>2]=d;c[f+12>>2]=37;c[e>>2]=2624;c[e+4>>2]=2;c[e+8>>2]=5264;c[e+12>>2]=2;c[e+16>>2]=f;c[e+20>>2]=2;aj(e,2640);}function cf(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0;j=l;l=l+64|0;i=j+40|0;h=j+16|0;g=j+8|0;c[j>>2]=b;c[j+4>>2]=d;c[g>>2]=e;a[g+4>>0]=f&1;c[i>>2]=j;c[i+4>>2]=41;c[i+8>>2]=g;c[i+12>>2]=52;c[h>>2]=2624;c[h+4>>2]=2;c[h+8>>2]=5264;c[h+12>>2]=2;c[h+16>>2]=i;c[h+20>>2]=2;n=0;_(9,h|0,2640);n=0;f=na()|0;Xe(g);za(f|0);}function df(a){a=a|0;return}function ef(a){a=a|0;return}function ff(a){a=a|0;var b=0;b=c[a+4>>2]|0;if(!b)return;Zb(c[a>>2]|0,b,1);return}function gf(a){a=a|0;return}function hf(a){a=a|0;var b=0,e=0,f=0;if((d[a>>0]|0)<2)return;e=a+4|0;f=c[e>>2]|0;a=f+4|0;n=0;Z(c[c[a>>2]>>2]|0,c[f>>2]|0);b=n;n=0;if(b&1){b=na()|0;kf(c[f>>2]|0,c[a>>2]|0);lf(c[e>>2]|0);za(b|0);}a=c[a>>2]|0;b=c[a+4>>2]|0;if(b|0)Zb(c[f>>2]|0,b,c[a+8>>2]|0);Zb(c[e>>2]|0,12,4);return}function jf(b){b=b|0;if((a[b>>0]|0)==3)return;hf(b);return}function kf(a,b){a=a|0;b=b|0;var d=0;d=c[b+4>>2]|0;if(!d)return;Zb(a,d,c[b+8>>2]|0);return}function lf(a){a=a|0;Zb(a,12,4);return}function mf(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0;k=l;l=l+16|0;m=k;j=k+8|0;c[j>>2]=0;if(d>>>0<128){a[j>>0]=d;e=1;}else {do if(d>>>0>=2048)if(d>>>0<65536){a[j>>0]=d>>>12&15|-32;f=63;g=1;h=-128;i=2;e=3;break}else {a[j>>0]=d>>>18&255|-16;a[j+1>>0]=d>>>12&63|-128;f=63;g=2;h=-128;i=3;e=4;break}else {f=31;g=0;h=-64;i=1;e=2;}while(0);a[j+g>>0]=f&d>>>6&255|h;a[j+i>>0]=d&63|-128;}qh(m,c[b>>2]|0,j,e);if((a[m>>0]|0)==3){m=0;l=k;return m|0}h=m;g=c[h>>2]|0;h=c[h+4>>2]|0;d=b+4|0;f=g&255;if((a[d>>0]|0)!=3?(n=0,Z(46,d|0),b=n,n=0,b&1):0){e=na()|0;k=d;c[k>>2]=g;c[k+4>>2]=h;if(f<<24>>24!=3)za(e|0);jf(m);za(e|0);}m=d;c[m>>2]=g;c[m+4>>2]=h;m=1;l=k;return m|0}function nf(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=l;l=l+32|0;e=d+8|0;f=d;c[f>>2]=a;c[e>>2]=c[b>>2];c[e+4>>2]=c[b+4>>2];c[e+8>>2]=c[b+8>>2];c[e+12>>2]=c[b+12>>2];c[e+16>>2]=c[b+16>>2];c[e+20>>2]=c[b+20>>2];b=ki(f,2672,e)|0;l=d;return b|0}function of(a){a=a|0;var b=0;b=c[a+8>>2]|0;if(!b)return;Zb(c[a+4>>2]|0,b,1);return}function pf(a){a=a|0;var b=0;b=c[a+4>>2]|0;if(!b)return;Zb(c[a>>2]|0,b,1);return}function qf(a){a=a|0;return}function rf(a,b){a=a|0;b=b|0;return sf(c[a>>2]|0,b)|0}function sf(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0;h=l;l=l+32|0;g=h+8|0;e=h;f=h+20|0;switch(a[b>>0]&3){case 0:{f=b+4|0;ui(e,d,7824,2);b=Qi(e,7826,4,f,2760)|0;Qe(g,c[f>>2]|0);n=0;b=da(1,b|0,7830,7,g|0,2816)|0;f=n;n=0;if(f&1){h=na()|0;tf(g);za(h|0);}n=0;b=$(13,b|0)|0;f=n;n=0;if(f&1){h=na()|0;tf(g);za(h|0);}d=c[g+4>>2]|0;if(d|0)Zb(c[g>>2]|0,d,1);g=b;l=h;return g|0}case 1:{a[f>>0]=a[b+1>>0]|0;vi(g,d,7837,4);g=Ti(Si(g,f,2832)|0)|0;l=h;return g|0}case 2:{vi(g,d,7841,6);g=Ti(Si(g,b+4|0,2848)|0)|0;l=h;return g|0}default:{}}return 0}function tf(a){a=a|0;var b=0;b=c[a+4>>2]|0;if(!b)return;Zb(c[a>>2]|0,b,1);return}function uf(a){a=a|0;var b=0,d=0,e=0;e=c[a>>2]|0;b=e+4|0;n=0;Z(c[c[b>>2]>>2]|0,c[e>>2]|0);d=n;n=0;if(d&1){d=na()|0;kf(c[e>>2]|0,c[b>>2]|0);lf(c[a>>2]|0);za(d|0);}d=c[b>>2]|0;b=c[d+4>>2]|0;if(!b){e=c[a>>2]|0;Zb(e,12,4);return}Zb(c[e>>2]|0,b,c[d+8>>2]|0);e=c[a>>2]|0;Zb(e,12,4);return}function vf(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=l;l=l+16|0;f=d+8|0;e=d;a=c[a>>2]|0;ui(e,b,7841,6);c[f>>2]=a+8;Qi(e,7847,4,f,2864)|0;c[f>>2]=a;Qi(e,7851,5,f,2880)|0;b=Ri(e)|0;l=d;return b|0}function wf(a){a=a|0;return}function xf(a,b){a=a|0;b=b|0;a=c[a>>2]|0;return lb[c[(c[a+4>>2]|0)+28>>2]&127](c[a>>2]|0,b)|0}function yf(a){a=a|0;return}function zf(a,b){a=a|0;b=b|0;return Af(c[a>>2]|0,b)|0}function Af(b,c){b=b|0;c=c|0;var d=0,e=0;e=l;l=l+16|0;d=e;do switch(a[b>>0]&31){case 0:{vi(d,c,7856,8);d=Ti(d)|0;l=e;return d|0}case 1:{vi(d,c,7864,16);d=Ti(d)|0;l=e;return d|0}case 2:{vi(d,c,7880,17);d=Ti(d)|0;l=e;return d|0}case 3:{vi(d,c,7897,15);d=Ti(d)|0;l=e;return d|0}case 4:{vi(d,c,7912,17);d=Ti(d)|0;l=e;return d|0}case 5:{vi(d,c,7929,12);d=Ti(d)|0;l=e;return d|0}case 6:{vi(d,c,7941,9);d=Ti(d)|0;l=e;return d|0}case 7:{vi(d,c,7950,16);d=Ti(d)|0;l=e;return d|0}case 8:{vi(d,c,7966,10);d=Ti(d)|0;l=e;return d|0}case 9:{vi(d,c,7976,13);d=Ti(d)|0;l=e;return d|0}case 10:{vi(d,c,7989,10);d=Ti(d)|0;l=e;return d|0}case 11:{vi(d,c,7999,12);d=Ti(d)|0;l=e;return d|0}case 12:{vi(d,c,8011,11);d=Ti(d)|0;l=e;return d|0}case 13:{vi(d,c,8022,8);d=Ti(d)|0;l=e;return d|0}case 14:{vi(d,c,8030,9);d=Ti(d)|0;l=e;return d|0}case 15:{vi(d,c,8039,11);d=Ti(d)|0;l=e;return d|0}case 16:{vi(d,c,8050,5);d=Ti(d)|0;l=e;return d|0}case 17:{vi(d,c,8055,13);d=Ti(d)|0;l=e;return d|0}case 18:{vi(d,c,8068,15);d=Ti(d)|0;l=e;return d|0}default:{}}while(0);return 0}function Bf(a){a=a|0;return}function Cf(a,b){a=a|0;b=b|0;return yi(c[a>>2]|0,c[a+8>>2]|0,b)|0}function Df(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;k=l;l=l+32|0;g=k+12|0;h=k;f=d+8|0;n=0;aa(24,d|0,c[f>>2]|0,1);e=n;n=0;if(e&1){k=na()|0;pf(d);za(k|0);}e=c[f>>2]|0;do if((e|0)==(c[d+4>>2]|0)){n=0;Z(54,d|0);e=n;n=0;if(e&1){k=na()|0;pf(d);za(k|0);}else {e=c[f>>2]|0;break}}while(0);a[(c[d>>2]|0)+e>>0]=0;c[f>>2]=(c[f>>2]|0)+1;c[h>>2]=c[d>>2];c[h+4>>2]=c[d+4>>2];c[h+8>>2]=c[d+8>>2];d=c[h+8>>2]|0;f=h+4|0;e=c[f>>2]|0;if(e>>>0<d>>>0){n=0;Z(44,3692);n=0;k=na()|0;Eg(h);za(k|0);}do if(d){if((e|0)==(d|0)){i=c[h>>2]|0;j=d;c[b>>2]=i;b=b+4|0;c[b>>2]=j;l=k;return}e=_b(c[h>>2]|0,e,1,d,1,g)|0;if(!e){d=g+4|0;e=c[d>>2]|0;d=c[d+4>>2]|0;c[g>>2]=c[g>>2];h=g+4|0;c[h>>2]=e;c[h+4>>2]=d;Yb(g);}else {c[h>>2]=e;i=d;j=e;break}}else {if(e|0)Zb(c[h>>2]|0,e,1);c[h>>2]=1;i=0;j=1;}while(0);c[f>>2]=i;h=j;j=i;c[b>>2]=h;b=b+4|0;c[b>>2]=j;l=k;return}function Ef(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;j=l;l=l+48|0;e=j+24|0;f=j;g=j+12|0;n=0;aa(25,g|0,7684,33);i=n;n=0;if(i&1){j=na()|0;of(d);za(j|0);};c[f>>2]=c[g>>2];c[f+4>>2]=c[g+4>>2];c[f+8>>2]=c[g+8>>2];h=Xb(12,4,e)|0;if(!h)Yb(e);c[h>>2]=c[f>>2];c[h+4>>2]=c[f+4>>2];c[h+8>>2]=c[f+8>>2];i=Xb(12,4,e)|0;if(!i)Yb(e);c[i>>2]=h;c[i+4>>2]=2728;a[i+8>>0]=11;h=i+9|0;a[h>>0]=a[f>>0]|0;a[h+1>>0]=a[f+1>>0]|0;a[h+2>>0]=a[f+2>>0]|0;a[b>>0]=2;h=b+1|0;a[h>>0]=a[g>>0]|0;a[h+1>>0]=a[g+1>>0]|0;a[h+2>>0]=a[g+2>>0]|0;c[b+4>>2]=i;b=c[d+8>>2]|0;if(!b){l=j;return}Zb(c[d+4>>2]|0,b,1);l=j;return}function Ff(a,b){a=a|0;b=b|0;var d=0;d=(Hj(b)|0)+1|0;c[a>>2]=b;c[a+4>>2]=d;return}function Gf(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;d=c+-1|0;if(!c)kj(d,0);else {Fi(a,b,d);return}}function Hf(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0;j=l;l=l+48|0;g=j+24|0;h=j;i=j+12|0;Nh(i,e,f);c[h>>2]=c[i>>2];c[h+4>>2]=c[i+4>>2];c[h+8>>2]=c[i+8>>2];e=Xb(12,4,g)|0;if(!e)Yb(g);c[e>>2]=c[h>>2];c[e+4>>2]=c[h+4>>2];c[e+8>>2]=c[h+8>>2];f=Xb(12,4,g)|0;if(!f)Yb(g);else {c[f>>2]=e;c[f+4>>2]=2728;a[f+8>>0]=d;g=f+9|0;a[g>>0]=a[h>>0]|0;a[g+1>>0]=a[h+1>>0]|0;a[g+2>>0]=a[h+2>>0]|0;a[b>>0]=2;h=b+1|0;a[h>>0]=a[i>>0]|0;a[h+1>>0]=a[i+1>>0]|0;a[h+2>>0]=a[i+2>>0]|0;c[b+4>>2]=f;l=j;return}}function If(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;k=l;l=l+80|0;e=k+56|0;h=k+32|0;j=k+8|0;i=k;switch(a[b>>0]&3){case 0:{b=c[b+4>>2]|0;c[i>>2]=b;Qe(j,b);c[e>>2]=j;c[e+4>>2]=53;c[e+8>>2]=i;c[e+12>>2]=54;c[h>>2]=2896;c[h+4>>2]=3;c[h+8>>2]=5264;c[h+12>>2]=2;c[h+16>>2]=e;c[h+20>>2]=2;n=0;b=ca(55,d|0,h|0)|0;i=n;n=0;if(i&1){k=na()|0;tf(j);za(k|0);}d=c[j+4>>2]|0;if(d|0)Zb(c[j>>2]|0,d,1);j=b;l=k;return j|0}case 1:{do switch(a[b+1>>0]&31){case 0:{f=8123;g=16;break}case 1:{f=8403;g=17;break}case 2:{f=8139;g=18;break}case 3:{f=8157;g=16;break}case 4:{f=8173;g=18;break}case 5:{f=8191;g=13;break}case 6:{f=8204;g=14;break}case 7:{f=8218;g=21;break}case 8:{f=8239;g=11;break}case 9:{f=8250;g=21;break}case 10:{f=8271;g=21;break}case 11:{f=8292;g=23;break}case 12:{f=8315;g=12;break}case 13:{f=8327;g=9;break}case 14:{f=8336;g=10;break}case 15:{f=8346;g=21;break}case 16:{f=8367;g=14;break}case 17:{f=8381;g=22;break}case 18:{ve(8083,40,2920);break}default:{}}while(0);c[e>>2]=f;c[e+4>>2]=g;c[h>>2]=e;c[h+4>>2]=41;c[j>>2]=2936;c[j+4>>2]=1;c[j+8>>2]=5180;c[j+12>>2]=1;c[j+16>>2]=h;c[j+20>>2]=1;j=si(d,j)|0;l=k;return j|0}case 2:{j=c[b+4>>2]|0;j=lb[c[(c[j+4>>2]|0)+24>>2]&127](c[j>>2]|0,d)|0;l=k;return j|0}default:{}}return 0}function Jf(a,b){a=a|0;b=b|0;return zi(c[a>>2]|0,c[a+8>>2]|0,b)|0}function Kf(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;h=l;l=l+16|0;i=h;qh(i,c[b>>2]|0,d,e);if((a[i>>0]|0)==3){i=0;l=h;return i|0}g=i;f=c[g>>2]|0;g=c[g+4>>2]|0;e=b+4|0;b=f&255;if((a[e>>0]|0)!=3?(n=0,Z(46,e|0),d=n,n=0,d&1):0){d=na()|0;h=e;c[h>>2]=f;c[h+4>>2]=g;if(b<<24>>24!=3)za(d|0);jf(i);za(d|0);}i=e;c[i>>2]=f;c[i+4>>2]=g;i=1;l=h;return i|0}function Lf(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;J=l;l=l+112|0;f=J+16|0;g=J;E=J+64|0;F=J+40|0;G=J+32|0;H=J+24|0;if(ri(e,3612,1)|0){I=1;l=J;return I|0}Wh(g,b,d);Xh(f,c[g>>2]|0,c[g+4>>2]|0);b=c[f+4>>2]|0;c[H>>2]=c[f>>2];c[H+4>>2]=b;Yh(E,H);b=c[E>>2]|0;a:do if(b|0){o=E+4|0;p=E+8|0;q=E+12|0;r=E+8|0;s=E+4|0;t=E+8|0;u=E+24|0;v=E+4|0;w=F+4|0;x=F+8|0;y=F+12|0;z=F+16|0;A=F+20|0;B=E+12|0;C=E+16|0;b:while(1){m=c[p>>2]|0;n=c[q>>2]|0;k=b+(c[o>>2]|0)|0;c[E>>2]=b;c[s>>2]=k;c[t>>2]=4;c[u>>2]=4;b=4;while(1){c:while(1){if((b|0)!=4?(D=jj(r)|0,(D|0)!=1114112):0){b=D;break}b=c[E>>2]|0;i=c[s>>2]|0;if((b|0)==(i|0)){I=29;break}d=b+1|0;c[E>>2]=d;j=a[b>>0]|0;if(j<<24>>24<=-1){k=j&31;if((d|0)==(i|0)){b=0;f=i;}else {f=b+2|0;c[E>>2]=f;b=a[d>>0]&63;}g=b&255;d=g|k<<6;if((j&255)>223){if((f|0)==(i|0)){b=0;h=i;}else {h=f+1|0;c[E>>2]=h;b=a[f>>0]&63;}f=b&255|g<<6;d=f|k<<12;if((j&255)>239){if((h|0)==(i|0))b=0;else {c[E>>2]=h+1;b=a[h>>0]&63;}d=f<<6|k<<18&1835008|b&255;}}}else d=j&255;d:do if((d|0)<34)switch(d|0){case 9:{f=0;b=2;g=116;d=0;break d}case 13:{f=0;b=2;g=114;d=0;break d}case 10:{f=0;b=2;g=110;d=0;break d}default:{I=28;break d}}else {e:do if((d|0)>=92)if((d|0)<1114112)switch(d|0){case 92:break e;default:{I=28;break d}}else switch(d|0){case 1114112:{I=29;break c}default:{I=28;break d}}else switch(d|0){case 34:case 39:break;default:{I=28;break d}}while(0);f=0;b=2;g=d;d=0;}while(0);if((I|0)==28){I=0;if(pj(d)|0){f=0;b=1;g=d;d=0;}else {f=5;b=3;g=d;d=(Q(d|1|0)|0)>>>2^7;}}c[t>>2]=b;c[B>>2]=g;k=C;c[k>>2]=d;c[k+4>>2]=f;}if((I|0)==29){I=0;if((c[u>>2]|0)==4)break;b=jj(u)|0;if((b|0)==1114112)break}if(xi(e,b)|0){I=36;break b}b=c[r>>2]|0;}d=m+n|0;if(n|0){b=m;do{c[G>>2]=b;c[E>>2]=G;c[v>>2]=56;c[F>>2]=2944;c[w>>2]=1;c[x>>2]=2952;c[y>>2]=1;c[z>>2]=E;c[A>>2]=1;if(si(e,F)|0){I=40;break b}b=b+1|0;}while((b|0)!=(d|0))}Yh(E,H);b=c[E>>2]|0;if(!b)break a}I=1;l=J;return I|0}while(0);I=ri(e,3612,1)|0;l=J;return I|0}function Mf(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=l;l=l+16|0;f=d+12|0;e=d;vi(e,b,8465,8);c[f>>2]=a;Si(e,f,2988)|0;c[f>>2]=a+4;Si(e,f,3004)|0;b=Ti(e)|0;l=d;return b|0}function Nf(a){a=a|0;return}function Of(a){a=a|0;return}function Pf(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=l;l=l+16|0;f=d+8|0;e=d;ui(e,b,7815,5);c[f>>2]=a;Qi(e,7820,4,f,2800)|0;b=Ri(e)|0;l=d;return b|0}function Qf(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0;k=l;l=l+80|0;b=k+56|0;d=k+32|0;e=k+24|0;f=k+20|0;g=k+16|0;h=k+12|0;i=k+8|0;n=k+4|0;j=k;m=Ia(j|0)|0;c[n>>2]=m;c[f>>2]=n;c[e>>2]=15856;if(m|0){c[b>>2]=f;c[b+4>>2]=57;c[b+8>>2]=e;c[b+12>>2]=57;c[d>>2]=2776;c[d+4>>2]=3;c[d+8>>2]=5264;c[d+12>>2]=2;c[d+16>>2]=b;c[d+20>>2]=2;we(d,3020);}n=Ba(j|0,1)|0;c[i>>2]=n;c[f>>2]=i;c[e>>2]=15856;if(n|0){c[b>>2]=f;c[b+4>>2]=57;c[b+8>>2]=e;c[b+12>>2]=57;c[d>>2]=2776;c[d+4>>2]=3;c[d+8>>2]=5264;c[d+12>>2]=2;c[d+16>>2]=b;c[d+20>>2]=2;we(d,3036);}n=qa(a|0,j|0)|0;c[h>>2]=n;c[f>>2]=h;c[e>>2]=15856;if(n|0){c[b>>2]=f;c[b+4>>2]=57;c[b+8>>2]=e;c[b+12>>2]=57;c[d>>2]=2776;c[d+4>>2]=3;c[d+8>>2]=5264;c[d+12>>2]=2;c[d+16>>2]=b;c[d+20>>2]=2;we(d,3052);}n=La(j|0)|0;c[g>>2]=n;c[f>>2]=g;c[e>>2]=15856;if(!n){l=k;return}else {c[b>>2]=f;c[b+4>>2]=57;c[b+8>>2]=e;c[b+12>>2]=57;c[d>>2]=2776;c[d+4>>2]=3;c[d+8>>2]=5264;c[d+12>>2]=2;c[d+16>>2]=b;c[d+20>>2]=2;we(d,3068);}}function Rf(a){a=a|0;return}function Sf(b,d){b=b|0;d=d|0;b=c[b>>2]|0;d=a[b>>0]|0;a[b>>0]=0;if(!(d<<24>>24))$i(3104);ik(15864)|0;n=0;Z(55,15860);d=n;n=0;if(d&1){d=na()|0;c[3965]=0;za(d|0);}else {c[3965]=0;mk(15864)|0;Zg();return}}function Tf(b,d){b=b|0;d=d|0;d=a[b>>0]|0;a[b>>0]=0;if(!(d<<24>>24))$i(3104);ik(15864)|0;n=0;Z(55,15860);d=n;n=0;if(d&1){d=na()|0;c[3965]=0;za(d|0);}else {c[3965]=0;mk(15864)|0;Zg();return}}function Uf(a){a=a|0;var b=0,e=0,f=0;if((d[a>>0]|0)<2)return;e=a+4|0;f=c[e>>2]|0;a=f+4|0;n=0;Z(c[c[a>>2]>>2]|0,c[f>>2]|0);b=n;n=0;if(b&1){b=na()|0;Vf(c[f>>2]|0,c[a>>2]|0);Wf(c[e>>2]|0);za(b|0);}a=c[a>>2]|0;b=c[a+4>>2]|0;if(b|0)Zb(c[f>>2]|0,b,c[a+8>>2]|0);Zb(c[e>>2]|0,12,4);return}function Vf(a,b){a=a|0;b=b|0;var d=0;d=c[b+4>>2]|0;if(!d)return;Zb(a,d,c[b+8>>2]|0);return}function Wf(a){a=a|0;Zb(a,12,4);return}function Xf(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;i=l;l=l+80|0;e=i+56|0;f=i+32|0;g=i;j=i+16|0;h=i+8|0;c[h>>2]=b;c[h+4>>2]=d;Re(j,b,d);b=j+4|0;if((c[j>>2]|0)==1){a=b;i=c[a+4>>2]|0;j=g;c[j>>2]=c[a>>2];c[j+4>>2]=i;c[e>>2]=h;c[e+4>>2]=58;c[e+8>>2]=g;c[e+12>>2]=59;c[f>>2]=3152;c[f+4>>2]=2;c[f+8>>2]=5264;c[f+12>>2]=2;c[f+16>>2]=e;c[f+20>>2]=2;n=0;_(26,f|0,3168);n=0;j=na()|0;Uf(g);za(j|0);}else {c[a>>2]=c[b>>2];c[a+4>>2]=c[b+4>>2];c[a+8>>2]=c[b+8>>2];l=i;return}}function Yf(a,b){a=a|0;b=b|0;c[a>>2]=0;return}function Zf(a){a=a|0;y=1536465966;return -1196322623}function _f(a,b){a=a|0;b=b|0;var d=0;d=c[b+8>>2]|0;c[a>>2]=c[b>>2];c[a+4>>2]=d;return}function $f(a,b){a=a|0;b=b|0;return zi(c[a>>2]|0,c[a+8>>2]|0,b)|0}function ag(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,m=0,o=0,p=0,q=0,r=0;q=l;l=l+32|0;p=q+16|0;j=q;k=j+8|0;m=j+4|0;i=j|2;h=c[b>>2]|0;a:while(1){switch(h|0){case 3:{o=8;break a}case 1:{if(!d){o=4;break a}break}case 0:break;default:{if((h&3|0)!=2){o=11;break a}g=ph(3804)|0;c[p>>2]=g;if(!g){o=13;break a}c[j>>2]=g;a[k>>0]=0;c[m>>2]=0;while(1){if((h&3|0)!=2){o=16;break}c[m>>2]=h&-4;g=c[b>>2]|0;if((g|0)==(h|0))c[b>>2]=i;if((g|0)==(h|0))break;else h=g;}if((o|0)==16){o=0;g=c[j>>2]|0;if(g|0?(r=c[g>>2]|0,c[g>>2]=r-1,(r|0)==1):0)Te(j);continue a}while(1){if(a[k>>0]|0)break;n=0;ba(2);r=n;n=0;if(r&1){o=27;break a}}g=c[b>>2]|0;h=c[j>>2]|0;if(h|0?(r=c[h>>2]|0,c[h>>2]=r-1,(r|0)==1):0)Te(j);h=g;continue a}}g=c[b>>2]|0;if((g|0)==(h|0))c[b>>2]=2;if((g|0)==(h|0)){o=9;break}else h=g;}if((o|0)==4)ve(8671,42,3184);else if((o|0)==8){l=q;return}else if((o|0)==9){g=p+4|0;a[g>>0]=1;c[p>>2]=b;n=0;_(c[f+12>>2]|0,e|0,(h|0)==1|0);r=n;n=0;if(r&1){r=na()|0;dg(p);za(r|0);}else {a[g>>0]=0;bg(p);l=q;return}}else if((o|0)==11)ve(8713,47,3200);else if((o|0)==13){n=0;_(21,8847,94);n=0;r=na()|0;lg(p);za(r|0);}else if((o|0)==27){r=na()|0;cg(j);za(r|0);}}function bg(b){b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0;j=l;l=l+64|0;h=j+40|0;i=j+16|0;f=j+8|0;g=j+4|0;k=j;m=c[b>>2]|0;e=c[m>>2]|0;c[m>>2]=(a[b+4>>0]|0)==0?3:1;b=e&3;c[k>>2]=b;c[g>>2]=k;c[f>>2]=3216;if((b|0)!=2){c[h>>2]=g;c[h+4>>2]=16;c[h+8>>2]=f;c[h+12>>2]=16;c[i>>2]=3128;c[i+4>>2]=3;c[i+8>>2]=5264;c[i+12>>2]=2;c[i+16>>2]=h;c[i+20>>2]=2;we(i,3220);}b=e&-4;if(!b){l=j;return}while(1){e=b;b=c[b+4>>2]|0;f=d[e>>0]|d[e+1>>0]<<8|d[e+2>>0]<<16|d[e+3>>0]<<24;a[e>>0]=0;a[e+1>>0]=0;a[e+2>>0]=0;a[e+3>>0]=0;c[h>>2]=f;if(!f){b=7;break}c[i>>2]=f;a[e+8>>0]=1;n=0;Z(56,i|0);m=n;n=0;if(m&1){b=12;break}k=c[i>>2]|0;m=c[k>>2]|0;c[k>>2]=m-1;if((m|0)==1)Te(i);if(!b){b=5;break}}if((b|0)==5){l=j;return}else if((b|0)==7){n=0;Z(44,3104);n=0;m=na()|0;eg(h);za(m|0);}else if((b|0)==12){m=na()|0;fg(i);za(m|0);}}function cg(a){a=a|0;var b=0,d=0;b=c[a>>2]|0;if(!b)return;d=c[b>>2]|0;c[b>>2]=d-1;if((d|0)!=1)return;Te(a);return}function dg(a){a=a|0;bg(a);return}function eg(a){a=a|0;var b=0,d=0;b=c[a>>2]|0;if(!b)return;d=c[b>>2]|0;c[b>>2]=d-1;if((d|0)!=1)return;Te(a);return}function fg(a){a=a|0;var b=0,d=0;d=c[a>>2]|0;b=c[d>>2]|0;c[d>>2]=b-1;if((b|0)!=1)return;Te(a);return}function gg(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=l;l=l+16|0;f=d+12|0;e=d;vi(e,b,8793,11);c[f>>2]=a;Si(e,f,3236)|0;b=Ti(e)|0;l=d;return b|0}function hg(a){a=a|0;return}function ig(a,b){a=a|0;b=b|0;var d=0;d=c[b+4>>2]|0;if(!d)return;Zb(a,d,c[b+8>>2]|0);return}function jg(a){a=a|0;Zb(a,12,4);return}function kg(b){b=b|0;var d=0,e=0,f=0,g=0;e=(c[b>>2]|0)+4|0;if(!(a[b+4>>0]|0)){d=fb[c[600]&7]()|0;if(!d)Ue(10081,57);if((c[d>>2]|0)==1){d=d+4|0;f=c[d>>2]|0;}else {f=fb[c[2404>>2]&7]()|0;g=d;c[g>>2]=1;c[g+4>>2]=f;d=d+4|0;}a[d>>0]=f;a[d+1>>0]=f>>8;a[d+2>>0]=f>>16;a[d+3>>0]=f>>24;if(f|0)a[e>>0]=1;}mk(c[c[b>>2]>>2]|0)|0;return}function lg(a){a=a|0;var b=0,d=0;b=c[a>>2]|0;if(!b)return;d=c[b>>2]|0;c[b>>2]=d-1;if((d|0)!=1)return;Te(a);return}function mg(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=c[b>>2]|0;f=c[b+4>>2]|0;g=0-f|0;b=e+((e+-1+f&g)-e)|0;if(b>>>0<e>>>0){c[a>>2]=0;return}e=N(b,d)|0;h=(d|0)==0;if(h?0:((e>>>0)/((h?1:d)>>>0)|0|0)!=(b|0)){c[a>>2]=0;return}if((f+-1&(f|-2147483648)|0)!=0|e>>>0>g>>>0)$i(3300);c[a>>2]=1;c[a+4>>2]=e;c[a+8>>2]=f;c[a+12>>2]=b;return}function ng(){var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,o=0;m=l;l=l+32|0;k=m+16|0;j=m+8|0;o=m;b=ph(3804)|0;c[k>>2]=b;if(!b){n=0;_(21,8847,94);n=0;o=na()|0;lg(k);za(o|0);}c[o>>2]=b;d=b+24|0;b=c[d>>2]|0;if((b|0)==2)c[d>>2]=0;a:do if((b|0)!=2){f=c[o>>2]|0;e=f+28|0;ik(c[e>>2]|0)|0;f=f+32|0;n=0;d=Y(c[600]|0)|0;i=n;n=0;do if(!(i&1)){if(!d){n=0;_(22,10081,57);n=0;break}if((c[d>>2]|0)==1){d=d+4|0;b=c[d>>2]|0;}else {n=0;b=Y(c[601]|0)|0;i=n;n=0;if(i&1)break;i=d;c[i>>2]=1;c[i+4>>2]=b;d=d+4|0;}a[d>>0]=b;a[d+1>>0]=b>>8;a[d+2>>0]=b>>16;a[d+3>>0]=b>>24;d=(b|0)!=0;if(a[f>>0]|0){n=0;ea(7,8804,43,e|0,d|0);n=0;break}c[j>>2]=e;b=j+4|0;a[b>>0]=d&1;d=(c[o>>2]|0)+24|0;e=c[d>>2]|0;if(!e)c[d>>2]=1;b:do if(!e){i=k+4|0;while(1){d=c[o>>2]|0;e=c[j>>2]|0;f=a[b>>0]|0;c[k>>2]=e;a[i>>0]=f;e=c[e>>2]|0;f=e;g=d+40|0;h=c[g>>2]|0;if(!h)c[g>>2]=f;if(!((h|0)==0|(h|0)==(f|0))){d=34;break}fa(c[d+36>>2]|0,e|0)|0;e=c[k>>2]|0;f=a[i>>0]|0;if(a[e+4>>0]|0){d=36;break}c[j>>2]=e;a[b>>0]=f;d=(c[o>>2]|0)+24|0;e=c[d>>2]|0;if((e|0)==2)c[d>>2]=0;if((e|0)==2)break b}if((d|0)==34){n=0;aa(21,7600,54,2656);n=0;b=na()|0;n=0;Z(57,k|0);m=n;n=0;if(m&1)d=39;}else if((d|0)==36){n=0;ea(7,8804,43,e|0,f<<24>>24!=0|0);n=0;d=39;}if((d|0)==39)b=na()|0;m=b;og(o);za(m|0);}else {if((e|0)==2)break;n=0;aa(21,9180,23,3324);n=0;m=na()|0;kg(j);og(o);za(m|0);}while(0);e=c[j>>2]|0;f=e+4|0;if(!(a[b>>0]|0)){n=0;d=Y(c[600]|0)|0;k=n;n=0;if(k&1)break;if(!d){n=0;_(22,10081,57);n=0;break}if((c[d>>2]|0)==1){d=d+4|0;b=c[d>>2]|0;}else {n=0;b=Y(c[601]|0)|0;k=n;n=0;if(k&1)break;k=d;c[k>>2]=1;c[k+4>>2]=b;d=d+4|0;}a[d>>0]=b;a[d+1>>0]=b>>8;a[d+2>>0]=b>>16;a[d+3>>0]=b>>24;if(b|0)a[f>>0]=1;}mk(c[e>>2]|0)|0;break a}while(0);m=na()|0;og(o);za(m|0);}while(0);j=c[o>>2]|0;k=c[j>>2]|0;c[j>>2]=k-1;if((k|0)!=1){l=m;return};Te(o);l=m;return}function og(a){a=a|0;var b=0,d=0;d=c[a>>2]|0;b=c[d>>2]|0;c[d>>2]=b-1;if((b|0)!=1)return;Te(a);return}function pg(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,o=0,p=0;k=l;l=l+64|0;d=k;j=k+40|0;m=k+28|0;o=k+16|0;p=k+8|0;c[o>>2]=c[a>>2];c[o+4>>2]=c[a+4>>2];c[o+8>>2]=c[a+8>>2];do if(c[o>>2]|0){c[j>>2]=c[o>>2];c[j+4>>2]=c[o+4>>2];c[j+8>>2]=c[o+8>>2];Sh(m,j);b=c[m>>2]|0;a=Lj(b,0,c[m+8>>2]|0)|0;if(!a){c[j>>2]=c[m>>2];c[j+4>>2]=c[m+4>>2];c[j+8>>2]=c[m+8>>2];Df(d,j);e=c[d>>2]|0;f=c[d+4>>2]|0;break}else {h=m+4|0;g=c[h>>2]|0;h=c[h+4>>2]|0;c[j>>2]=a-b;c[j+4>>2]=b;i=j+8|0;c[i>>2]=g;c[i+4>>2]=h;af(9203,47,j);}}else {e=0;f=0;}while(0);c[p>>2]=e;c[p+4>>2]=f;ik(15736)|0;h=15600;g=c[h>>2]|0;h=c[h+4>>2]|0;if(!((g|0)==-1&(h|0)==-1)){f=gk(g|0,h|0,1,0)|0;i=15600;c[i>>2]=f;c[i+4>>2]=y;mk(15736)|0;n=0;Z(58,o|0);i=n;n=0;if(!(i&1)){i=Xb(48,4,j)|0;if(!i)Yb(j);a=i;b=15684;d=a+48|0;do{c[a>>2]=c[b>>2];a=a+4|0;b=b+4|0;}while((a|0)<(d|0));c[m>>2]=i;c[m+4>>2]=0;n=0;Z(60,i|0);f=n;n=0;if(!(f&1)){b=p;a=c[b>>2]|0;b=c[b+4>>2]|0;e=o;d=c[e>>2]|0;e=c[e+4>>2]|0;f=Xb(48,8,j)|0;if(!f)Yb(j);else {c[f>>2]=1;c[f+4>>2]=1;p=f+8|0;c[p>>2]=g;c[p+4>>2]=h;p=f+16|0;c[p>>2]=a;c[p+4>>2]=b;c[f+24>>2]=0;p=f+28|0;c[p>>2]=d;c[p+4>>2]=e;c[f+36>>2]=i;c[f+40>>2]=0;l=k;return f|0}}a=na()|0;n=0;Z(59,m|0);m=n;n=0;if(m&1)a=na()|0;rg(o);o=a;qg(p);za(o|0);}}else {mk(15736)|0;n=0;aa(21,9250,55,3340);n=0;}o=na()|0;qg(p);za(o|0);return 0}function qg(b){b=b|0;var d=0;d=c[b>>2]|0;if(!d)return;a[d>>0]=0;d=c[b+4>>2]|0;if(!d)return;Zb(c[b>>2]|0,d,1);return}function rg(a){a=a|0;Ga(c[a>>2]|0)|0;Zb(c[a>>2]|0,28,4);return}function sg(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,o=0,p=0;o=l;l=l+16|0;j=o;d=(c[b>>2]|0)+24|0;e=c[d>>2]|0;if(!e)c[d>>2]=2;if(!e){l=o;return}m=j+4|0;h=c[600]|0;i=c[601]|0;d=e;a:while(1){switch(d|0){case 2:{k=12;break a}case 1:break;default:{k=10;break a}}f=c[b>>2]|0;g=f+28|0;ik(c[g>>2]|0)|0;d=fb[h&7]()|0;if(!d){k=7;break}if((c[d>>2]|0)==1){d=d+4|0;e=c[d>>2]|0;}else {e=fb[i&7]()|0;p=d;c[p>>2]=1;c[p+4>>2]=e;d=d+4|0;}a[d>>0]=e;a[d+1>>0]=e>>8;a[d+2>>0]=e>>16;a[d+3>>0]=e>>24;d=(e|0)!=0;if(a[f+32>>0]|0){k=9;break}c[j>>2]=g;a[m>>0]=d&1;d=f+24|0;e=c[d>>2]|0;if((e|0)==1)c[d>>2]=2;if((e|0)==1){k=25;break}switch(e|0){case 2:break a;case 0:break;default:{k=23;break a}}e=c[j>>2]|0;f=e+4|0;if(!(a[m>>0]|0)){d=fb[h&7]()|0;if(!d){k=19;break}if((c[d>>2]|0)==1){d=d+4|0;g=c[d>>2]|0;}else {g=fb[i&7]()|0;p=d;c[p>>2]=1;c[p+4>>2]=g;d=d+4|0;}a[d>>0]=g;a[d+1>>0]=g>>8;a[d+2>>0]=g>>16;a[d+3>>0]=g>>24;if(g|0)a[f>>0]=1;}mk(c[e>>2]|0)|0;e=(c[b>>2]|0)+24|0;d=c[e>>2]|0;if(!d)c[e>>2]=2;if(!d){k=12;break}}if((k|0)==7)Ue(10081,57);else if((k|0)==9)cf(8804,43,g,d);else if((k|0)==10)ve(8975,28,3252);else if((k|0)==12){l=o;return}else if((k|0)==19)Ue(10081,57);else if((k|0)==23){n=0;aa(21,8975,28,3268);n=0;p=na()|0;kg(j);za(p|0);}else if((k|0)==25)Fa(c[(c[b>>2]|0)+36>>2]|0)|0;f=c[j>>2]|0;g=f+4|0;if(!(a[m>>0]|0)){d=fb[c[600]&7]()|0;if(!d)Ue(10081,57);if((c[d>>2]|0)==1){d=d+4|0;e=c[d>>2]|0;}else {e=fb[c[2404>>2]&7]()|0;p=d;c[p>>2]=1;c[p+4>>2]=e;d=d+4|0;}a[d>>0]=e;a[d+1>>0]=e>>8;a[d+2>>0]=e>>16;a[d+3>>0]=e>>24;if(e|0)a[g>>0]=1;}mk(c[f>>2]|0)|0;l=o;return}function tg(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;x=l;l=l+864|0;s=x+849|0;t=x+824|0;u=x;v=x+820|0;w=x+816|0;p=x+16|0;q=x+848|0;r=x+8|0;ik(15764)|0;c[r>>2]=d;n=r+4|0;c[n>>2]=e;a[q>>0]=f;hk(p|0,0,800)|0;Ud(t,p,100);d=t+4|0;o=c[d>>2]|0;a:do if((c[t>>2]|0)==1){e=kk(o|0,c[d+4>>2]|0,8)|0;f=y;d=o&255;}else {if(o>>>0>100)kj(o,100);c[v>>2]=s;if(f<<24>>24!=2){m=p+(o<<3)|0;h=m;c[u>>2]=v;i=t+4|0;j=t+4|0;k=t+4|0;g=t+4|0;f=p;d=0;while(1){e=f;if(((h-f|0)/8|0)>>>0<=3){h=21;break}ug(t,u,d,e);d=c[i>>2]|0;if((c[t>>2]|0)==1){h=29;break}ug(t,u,d,e+8|0);d=c[j>>2]|0;if((c[t>>2]|0)==1){h=29;break}ug(t,u,d,e+16|0);d=c[k>>2]|0;if((c[t>>2]|0)==1){h=29;break}ug(t,u,d,e+24|0);d=c[g>>2]|0;if((c[t>>2]|0)==1){h=29;break}else f=e+32|0;}b:do if((h|0)==21){f=t+4|0;if((e|0)!=(m|0))do{ug(t,u,d,e);e=e+8|0;d=c[f>>2]|0;if((c[t>>2]|0)==1){h=29;break b}}while((e|0)!=(m|0));d=o;}while(0);e=o-d|0;if(e>>>0<o>>>0)if(e){f=c[r>>2]|0;g=c[n>>2]|0;c[t>>2]=3356;c[t+4>>2]=1;c[t+8>>2]=0;c[t+16>>2]=15892;c[t+20>>2]=0;jb[c[g+24>>2]&31](u,f,t);f=u;g=c[f>>2]|0;d=g&255;if(d<<24>>24==3)g=e;else {e=kk(g|0,c[f+4>>2]|0,8)|0;f=y;break}}else g=0;else h=31;}else h=31;if((h|0)==31)g=0;e=c[r>>2]|0;f=c[n>>2]|0;c[t>>2]=3364;c[t+4>>2]=1;c[t+8>>2]=0;c[t+16>>2]=15892;c[t+20>>2]=0;jb[c[f+24>>2]&31](u,e,t);e=u;f=c[e>>2]|0;d=f&255;if(d<<24>>24!=3){e=kk(f|0,c[e+4>>2]|0,8)|0;f=y;break}d=o-g|0;if(d>>>0>100)kj(d,100);i=p+(d<<3)|0;j=t+4|0;k=t+8|0;m=t+12|0;c:do if(d|0){e=p;h=0;g=p;while(1){c[w>>2]=h;c[v>>2]=e;d=c[e>>2]|0;f=c[e+4>>2]|0;c[t>>2]=r;c[j>>2]=w;c[k>>2]=v;c[m>>2]=q;Wd(u,d,f,t,s);f=u;e=c[f>>2]|0;f=c[f+4>>2]|0;d=e&255;if(d<<24>>24!=3)break;d=g+8|0;if((d|0)==(i|0))break c;else {e=d;h=h+1|0;g=d;}}e=kk(e|0,f|0,8)|0;f=y;break a}while(0);v=0;w=0;u=3;mk(15764)|0;v=v&16777215;v=nk(w|0,v|0,8)|0;w=y;u=u&255;u=v|u;v=b;c[v>>2]=u;b=b+4|0;c[b>>2]=w;l=x;return}while(0);v=f;w=e;u=d;mk(15764)|0;v=v&16777215;v=nk(w|0,v|0,8)|0;w=y;u=u&255;u=v|u;v=b;c[v>>2]=u;b=b+4|0;c[b>>2]=w;l=x;return}function ug(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0;i=l;l=l+16|0;g=i;h=i+8|0;a[h>>0]=0;Xd(g,c[f>>2]|0,c[f+4>>2]|0,h,c[c[d>>2]>>2]|0);switch(a[g>>0]&3){case 0:case 1:case 3:{g=a[h>>0]|0;h=g&255;g=g^1;g=g&255;e=g+e|0;c[b>>2]=h;h=b+4|0;c[h>>2]=e;l=i;return}default:{}}g=c[g+4>>2]|0;d=g+4|0;n=0;Z(c[c[d>>2]>>2]|0,c[g>>2]|0);f=n;n=0;if(f&1){i=na()|0;ig(c[g>>2]|0,c[d>>2]|0);jg(g);za(i|0);}d=c[d>>2]|0;f=c[d+4>>2]|0;if(f|0)Zb(c[g>>2]|0,f,c[d+8>>2]|0);Zb(g,12,4);g=a[h>>0]|0;h=g&255;g=g^1;g=g&255;e=g+e|0;c[b>>2]=h;h=b+4|0;c[h>>2]=e;l=i;return}function vg(a,b){a=a|0;b=b|0;return ib[c[b+12>>2]&15](a)|0}function wg(){var b=0,d=0,e=0,f=0;f=l;l=l+32|0;d=f+12|0;b=f;switch(c[3933]|0){case 0:{Xf(b,9087,14);if(!(c[b>>2]|0)){d=1;b=4;}else {c[d>>2]=c[b>>2];c[d+4>>2]=c[b+4>>2];c[d+8>>2]=c[b+8>>2];e=c[d>>2]|0;a:do switch(c[d+8>>2]|0){case 1:{if((e|0)==9101)b=4;else b=(a[e>>0]|0)==48?4:3;break}case 4:{if((e|0)!=9102?Xj(e,9102,4)|0:0){b=3;break a}b=2;break}default:b=3;}while(0);d=c[d+4>>2]|0;if(d|0)Zb(e,d,1);d=b<<24>>24==4?1:b&255;}c[3933]=d;e=b;l=f;return e|0}case 2:{e=2;l=f;return e|0}case 3:{e=3;l=f;return e|0}case 1:{e=4;l=f;return e|0}default:ve(9047,40,3284);}return 0}
function xg(b,d,e,f,g,h,i,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;var k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;H=l;l=l+160|0;o=H;F=H+96|0;A=H+120|0;z=H+8|0;m=H+152|0;n=H+144|0;c[n>>2]=f;c[m>>2]=g;c[m+4>>2]=h;w=j<<24>>24==3;do if(w){if(!g){a[b>>0]=3;l=H;return}c[F>>2]=n;c[F+4>>2]=39;c[A>>2]=3472;c[A+4>>2]=2;c[A+8>>2]=3488;c[A+12>>2]=1;c[A+16>>2]=F;c[A+20>>2]=1;jb[c[e+24>>2]&31](z,d,A);h=z;f=c[h>>2]|0;h=c[h+4>>2]|0;if((f&255)<<24>>24==3)break;c[b>>2]=f;c[b+4>>2]=h;l=H;return}else {mi(o,3372);f=c[o>>2]|0;h=c[o+4>>2]|0;c[F>>2]=n;c[F+4>>2]=39;c[F+8>>2]=m;c[F+12>>2]=60;c[F+16>>2]=f;c[F+20>>2]=h;c[A>>2]=3376;c[A+4>>2]=3;c[A+8>>2]=3400;c[A+12>>2]=2;c[A+16>>2]=F;c[A+20>>2]=3;jb[c[e+24>>2]&31](z,d,A);h=z;f=c[h>>2]|0;h=c[h+4>>2]|0;if((f&255)<<24>>24==3)break;c[b>>2]=f;c[b+4>>2]=h;l=H;return}while(0);u=c[i>>2]|0;do if(!u){k=c[e+20>>2]|0;nb[k&15](F,d,3524,9);h=F;f=c[h>>2]|0;h=c[h+4>>2]|0;if((f&255)<<24>>24!=3){c[b>>2]=f;c[b+4>>2]=h;l=H;return}}else {i=c[i+4>>2]|0;sh(F,u,i,9410,6);a:do if((c[F>>2]|0)==1){q=c[F+4>>2]|0;f=q+6|0;if(!((f|0)==0|(i|0)==(f|0))){if(i>>>0<=f>>>0)Ii(u,i,f,i);h=u+f|0;if((a[h>>0]|0)>-65)p=h;else Ii(u,i,f,i);}else p=u+f|0;o=u+f+(i-f)|0;f=p;while(1){t=(f|0)==(o|0);h=t?f:f+1|0;if(t|(f|0)==0)break;n=a[f>>0]|0;if(n<<24>>24<=-1){g=n&31;if((h|0)==(o|0)){f=0;h=o;}else {f=a[h>>0]&63;h=h+1|0;}j=f&255;f=j|g<<6;if((n&255)>223){if((h|0)==(o|0)){f=0;m=o;}else {f=a[h>>0]&63;m=h+1|0;}j=f&255|j<<6;f=j|g<<12;if((n&255)>239){if((m|0)==(o|0)){h=o;f=0;}else {h=m+1|0;f=a[m>>0]&63;}f=j<<6|g<<18&1835008|f&255;if((f|0)==1114112)break}else h=m;}}else f=n&255;if((f+-48|0)>>>0>9&(f+-65|0)>>>0>5){x=i;break a}else f=h;}if(!((q|0)==0|(q|0)==(i|0))){if(q>>>0>=i>>>0)Ii(u,i,0,q);if((a[u+q>>0]|0)<=-65)Ii(u,i,0,q);else x=q;}else x=q;}else x=i;while(0);do if(x>>>0>4)if((a[u+3>>0]|0)>-65){if((u|0)!=9417?Xj(9417,u,3)|0:0){B=57;break}h=x+-1|0;if(h){f=u+h|0;if((a[f>>0]|0)<=-65){B=57;break}}else f=u;if((f|0)!=9416?(a[f>>0]|0)!=69:0){if((x|0)==2){B=58;break}if(x>>>0>2){B=57;break}else {B=118;break}}if(h>>>0<3)Ii(u,x,3,h);if((a[u+h>>0]|0)>-65){f=3;B=64;}else Ii(u,x,3,h);}else B=57;else if((x|0)==4)B=57;else B=118;while(0);if((B|0)==57)if((a[u+2>>0]|0)>-65)B=58;else B=118;do if((B|0)==58){if((u|0)!=9420?Xj(9420,u,2)|0:0){B=118;break}h=x+-1|0;if(h){f=u+h|0;if((a[f>>0]|0)<=-65){B=118;break}}else f=u;if((f|0)!=9416?(a[f>>0]|0)!=69:0){B=118;break}if(h>>>0<2)Ii(u,x,2,h);if((a[u+2>>0]|0)<=-65)Ii(u,x,2,h);if((a[u+h>>0]|0)>-65){f=2;h=x;B=64;}else Ii(u,x,2,h);}while(0);b:do if((B|0)==64){f=u+f|0;h=h+-3|0;t=f+h|0;m=f;while(1){if((m|0)==(t|0))break;n=m+1|0;o=a[m>>0]|0;if(o<<24>>24<=-1){i=o&31;if((n|0)==(t|0)){j=0;g=t;}else {j=a[n>>0]&63;g=m+2|0;}m=j&255;j=m|i<<6;if((o&255)>223){if((g|0)==(t|0)){n=g;j=0;g=t;}else {s=g+1|0;n=s;j=a[g>>0]&63;g=s;}m=j&255|m<<6;j=m|i<<12;if((o&255)>239){if((g|0)==(t|0))j=0;else {n=g+1|0;j=a[g>>0]&63;}j=m<<6|i<<18&1835008|j&255;if((j|0)==1114112){v=n;B=93;break}else o=0;}else o=0;}else {o=0;n=g;}}else {j=o&255;o=0;}while(1){m=j+-48|0;if(m>>>0>=10){if(j>>>0<=127){m=n;j=o;break}if(!(Vh(j)|0)){m=n;j=o;break}}q=(o*10|0)+m|0;if((n|0)==(t|0)){m=t;j=q;break}m=n+1|0;i=a[n>>0]|0;if(i<<24>>24>-1){j=i&255;o=q;n=m;continue}p=i&31;if((m|0)==(t|0)){j=0;n=t;}else {j=a[m>>0]&63;n=n+2|0;}g=j&255;if((i&255)<=223){j=g|p<<6;o=q;continue}if((n|0)==(t|0)){m=n;j=0;o=t;}else {o=n+1|0;m=o;j=a[n>>0]&63;}n=j&255|g<<6;if((i&255)<=239){j=n|p<<12;o=q;n=m;continue}if((o|0)==(t|0))j=0;else {m=o+1|0;j=a[o>>0]&63;}j=n<<6|p<<18&1835008|j&255;if((j|0)==1114112){j=q;break}else {o=q;n=m;}}if(!j){v=m;B=93;break}s=j+-1|0;c:do if(!s)j=0;else {r=s;j=0;do{if((m|0)==(t|0)){m=t;break c}n=m+1|0;p=a[m>>0]|0;if(p<<24>>24<=-1){q=p&255;if((n|0)==(t|0)){n=0;g=t;}else {n=a[n>>0]&63;g=m+2|0;}o=n&255;if((p&255)>223){if((g|0)==(t|0)){m=g;n=0;i=t;}else {i=g+1|0;m=i;n=a[g>>0]&63;}g=n&255|o<<6;if((p&255)>239){if((i|0)==(t|0))n=0;else {m=i+1|0;n=a[i>>0]&63;}if((g<<6|q<<18&1835008|n&255|0)==1114112)break c}}else m=g;}else m=n;r=r+-1|0;j=j+1|0;}while((r|0)!=0)}while(0);if((j|0)!=(s|0)){B=118;break b}}if((B|0)==93?(v|0)!=(t|0):0){j=v+1|0;g=a[v>>0]|0;if(g<<24>>24>-1){B=118;break}if((j|0)==(t|0)){n=0;j=t;}else {n=a[j>>0]&63;j=v+2|0;}if((g&255)<=223){B=118;break}if((j|0)==(t|0)){m=0;j=t;}else {m=a[j>>0]&63;j=j+1|0;}if((g&255)<=239){B=118;break}if((j|0)==(t|0))j=0;else j=a[j>>0]&63;if(((m&255|(n&255)<<6)<<6|(g&255)<<18&1835008|j&255|0)!=1114112){B=118;break}}if(w){Ni(z,f,h,9422,3);g=z+64|0;c[g>>2]=0;o=z+68|0;c[o>>2]=h;j=z+72|0;a[j>>0]=1;i=z+73|0;a[i>>0]=0;m=z+80|0;c[m>>2]=1;yg(A,z);n=c[m>>2]|0;d:do switch(n|0){case 0:{c[F>>2]=0;break}case 1:{c[m>>2]=0;do if(!(a[i>>0]|0)){if(!(a[j>>0]|0)){m=c[o>>2]|0;j=c[g>>2]|0;if((m|0)==(j|0))break}else {j=c[g>>2]|0;m=c[o>>2]|0;}a[i>>0]=1;c[F>>2]=(c[z+48>>2]|0)+j;c[F+4>>2]=m-j;break d}while(0);c[F>>2]=0;break}default:{c[m>>2]=n+-1;yg(F,z);}}while(0);j=c[A>>2]|0;q=F;r=c[q>>2]|0;q=c[q+4>>2]|0;e:do if((j|0)!=0?(c[A+4>>2]|0)==16:0){p=j+16|0;while(1){A=(j|0)==(p|0);m=A?j:j+1|0;if(A|(j|0)==0)break;o=a[j>>0]|0;if(o<<24>>24<=-1){i=o&31;if((m|0)==(p|0)){n=0;j=p;}else {n=a[m>>0]&63;j=m+1|0;}n=n&255;m=n|i<<6;if((o&255)>223){if((j|0)==(p|0)){m=0;g=p;}else {m=a[j>>0]&63;g=j+1|0;}n=m&255|n<<6;m=n|i<<12;if((o&255)>239){if((g|0)==(p|0)){j=p;m=0;}else {j=g+1|0;m=a[g>>0]&63;}m=n<<6|i<<18&1835008|m&255;if((m|0)==1114112)break}else j=g;}}else {j=m;m=o&255;}if((m+-48|0)>>>0>=10)if((m+-97|0)>>>0>=26)if((m+-65|0)>>>0<26)n=-55;else break e;else n=-87;else n=-48;if((n+m|0)>>>0>15)break e}f=(r|0)==0;h=f?0:q;f=f?16465:r;}while(0)}if(!h)B=452;else {v=F+4|0;w=e+20|0;j=1;p=f;f:while(1){if(!j?(nb[c[w>>2]&15](F,d,3536,2),D=F,A=c[D>>2]|0,C=A&255,D=kk(A|0,c[D+4>>2]|0,8)|0,C<<24>>24!=3):0){G=y;k=D;E=C;break b}r=p;q=p+1|0;i=p+h|0;f=h;while(1){g=a[r>>0]|0;if(g<<24>>24<=-1){o=g&31;if((q|0)==(i|0)){j=0;n=q;}else {j=a[q>>0]&63;n=q+1|0;}m=j&255;j=m|o<<6;if((g&255)>223){if((n|0)==(i|0)){j=0;n=i;}else {j=a[n>>0]&63;n=n+1|0;}m=j&255|m<<6;j=m|o<<12;if((g&255)>239){if((n|0)==(i|0))j=0;else j=a[n>>0]&63;j=m<<6|o<<18&1835008|j&255;if((j|0)==1114112){B=166;break f}}}}else j=g&255;if((j+-48|0)>>>0>=10){if(j>>>0<=127)break;if(!(Vh(j)|0))break}switch(f|0){case 0:{f=0;B=188;break f}case 1:break;default:if((a[q>>0]|0)<=-65){B=188;break f}}f=f+-1|0;i=q+f|0;if(!f){B=166;break f}else {r=q;q=q+1|0;}}j=h-f|0;if(j|0){if(h>>>0<=j>>>0){B=173;break}if((a[p+j>>0]|0)<=-65){B=173;break}}fj(F,p,j);if((a[F>>0]|0)==1){B=175;break}m=c[v>>2]|0;if(!((m|0)==0|(f|0)==(m|0))){if(f>>>0<=m>>>0){B=180;break}h=r+m|0;if((a[h>>0]|0)>-65)u=h;else {B=180;break}}else u=r+m|0;h=f-m|0;if((m|0)!=2)if(m>>>0>2)if((a[r+2>>0]|0)>-65)B=184;else B=193;else {j=r;f=m;B=194;}else B=184;do if((B|0)==184){if((r|0)!=9425?Xj(9425,r,2)|0:0){B=193;break}if((a[q>>0]|0)<=-65){B=191;break f}j=q;f=m+-1|0;B=194;}while(0);if((B|0)==193){f=m;B=195;}else if((B|0)==194?(B=0,f|0):0){r=j;B=195;}g:do if((B|0)==195){h:while(1){j=(f|0)==1;if(!j?(a[r+1>>0]|0)<=-65:0)B=232;else B=197;i:do if((B|0)==197){B=0;do if((r|0)!=3540){if((a[r>>0]|0)==46)break;if(!j?(a[r+1>>0]|0)<=-65:0){B=232;break i}if((r|0)!=9427?(a[r>>0]|0)!=36:0){B=232;break i}n=(f|0)==4;do if(!n)if(f>>>0>4)if((a[r+4>>0]|0)>-65){B=230;break}else {B=303;break}else if((f|0)==3){j=1;B=304;break}else break h;else B=230;while(0);j:do if((B|0)==230){B=0;do if((r|0)!=9428){if(!(Xj(9428,r,4)|0))break;if(!n?(a[r+4>>0]|0)<=-65:0){B=303;break j}do if((r|0)!=9432){if(!(Xj(9432,r,4)|0))break;if(!n?(a[r+4>>0]|0)<=-65:0){B=303;break j}do if((r|0)!=9436){if(!(Xj(9436,r,4)|0))break;if(!n?(a[r+4>>0]|0)<=-65:0){B=303;break j}do if((r|0)!=9440){if(!(Xj(9440,r,4)|0))break;if(!n?(a[r+4>>0]|0)<=-65:0){B=303;break j}do if((r|0)!=9444){if(!(Xj(9444,r,4)|0))break;if(!n?(a[r+4>>0]|0)<=-65:0){B=303;break j}do if((r|0)!=9448){if(!(Xj(9448,r,4)|0))break;if(!n?(a[r+4>>0]|0)<=-65:0){B=303;break j}if((r|0)!=9452?Xj(9452,r,4)|0:0){B=303;break j}nb[c[w>>2]&15](F,d,3568,1);m=F;A=c[m>>2]|0;j=A&255;m=kk(A|0,c[m+4>>2]|0,8)|0;if(j<<24>>24!=3){G=y;k=m;E=j;break b}j=r+4|0;if(!n?(a[j>>0]|0)<=-65:0){B=308;break f}f=f+-4|0;break i}while(0);nb[c[w>>2]&15](F,d,3564,1);m=F;A=c[m>>2]|0;j=A&255;m=kk(A|0,c[m+4>>2]|0,8)|0;if(j<<24>>24!=3){G=y;k=m;E=j;break b}j=r+4|0;if(!n?(a[j>>0]|0)<=-65:0){B=299;break f}f=f+-4|0;break i}while(0);nb[c[w>>2]&15](F,d,3560,1);m=F;A=c[m>>2]|0;j=A&255;m=kk(A|0,c[m+4>>2]|0,8)|0;if(j<<24>>24!=3){G=y;k=m;E=j;break b}j=r+4|0;if(!n?(a[j>>0]|0)<=-65:0){B=290;break f}f=f+-4|0;break i}while(0);nb[c[w>>2]&15](F,d,3556,1);m=F;A=c[m>>2]|0;j=A&255;m=kk(A|0,c[m+4>>2]|0,8)|0;if(j<<24>>24!=3){G=y;k=m;E=j;break b}j=r+4|0;if(!n?(a[j>>0]|0)<=-65:0){B=281;break f}f=f+-4|0;break i}while(0);nb[c[w>>2]&15](F,d,3552,1);m=F;A=c[m>>2]|0;j=A&255;m=kk(A|0,c[m+4>>2]|0,8)|0;if(j<<24>>24!=3){G=y;k=m;E=j;break b}j=r+4|0;if(!n?(a[j>>0]|0)<=-65:0){B=272;break f}f=f+-4|0;break i}while(0);nb[c[w>>2]&15](F,d,3548,1);m=F;A=c[m>>2]|0;j=A&255;m=kk(A|0,c[m+4>>2]|0,8)|0;if(j<<24>>24!=3){G=y;k=m;E=j;break b}j=r+4|0;if(!n?(a[j>>0]|0)<=-65:0){B=263;break f}f=f+-4|0;break i}while(0);nb[c[w>>2]&15](F,d,3544,1);m=F;A=c[m>>2]|0;j=A&255;m=kk(A|0,c[m+4>>2]|0,8)|0;if(j<<24>>24!=3){G=y;k=m;E=j;break b}j=r+4|0;if(!n?(a[j>>0]|0)<=-65:0){B=254;break f}f=f+-4|0;break i}while(0);if((B|0)==303?(B=0,(a[r+3>>0]|0)>-65):0){j=0;B=304;}do if((B|0)==304){B=0;if((r|0)!=9456?Xj(9456,r,3)|0:0)break;nb[c[w>>2]&15](F,d,3572,1);n=F;A=c[n>>2]|0;m=A&255;n=kk(A|0,c[n+4>>2]|0,8)|0;if(m<<24>>24!=3){G=y;k=n;E=m;break b}if(!j){if(f>>>0<=3){B=320;break f}j=r+3|0;if((a[j>>0]|0)<=-65){B=320;break f}}else j=r+3|0;f=f+-3|0;break i}while(0);if((f|0)!=5){if(f>>>0<=5)break h;if((a[r+5>>0]|0)>-65)j=0;else break h}else j=1;do if((r|0)!=9459){if(!(Xj(9459,r,5)|0))break;if(!j){if(f>>>0<=5)break h;if((a[r+5>>0]|0)>-65)j=0;else break h}else j=1;do if((r|0)!=9464){if(!(Xj(9464,r,5)|0))break;if(!j){if(f>>>0<=5)break h;if((a[r+5>>0]|0)>-65)j=0;else break h}else j=1;do if((r|0)!=9469){if(!(Xj(9469,r,5)|0))break;if(!j){if(f>>>0<=5)break h;if((a[r+5>>0]|0)>-65)j=0;else break h}else j=1;do if((r|0)!=9474){if(!(Xj(9474,r,5)|0))break;if(!j){if(f>>>0<=5)break h;if((a[r+5>>0]|0)>-65)n=0;else break h}else n=1;do if((r|0)!=9479){if(!(Xj(9479,r,5)|0))break;if(!n){if(f>>>0<=5)break h;if((a[r+5>>0]|0)>-65)n=0;else break h}else n=1;do if((r|0)!=9484){if(!(Xj(9484,r,5)|0))break;if(!n){if(f>>>0<=5)break h;if((a[r+5>>0]|0)>-65)n=0;else break h}else n=1;do if((r|0)!=9489){if(!(Xj(9489,r,5)|0))break;if(!n){if(f>>>0<=5)break h;if((a[r+5>>0]|0)>-65)n=0;else break h}else n=1;do if((r|0)!=9494){if(!(Xj(9494,r,5)|0))break;if(!n){if(f>>>0<=5)break h;if((a[r+5>>0]|0)>-65)n=0;else break h}else n=1;do if((r|0)!=9499){if(!(Xj(9499,r,5)|0))break;if(!n){if(f>>>0<=5)break h;if((a[r+5>>0]|0)>-65)n=0;else break h}else n=1;if((r|0)!=9504?Xj(9504,r,5)|0:0)break h;nb[c[w>>2]&15](F,d,3612,1);m=F;A=c[m>>2]|0;j=A&255;m=kk(A|0,c[m+4>>2]|0,8)|0;if(j<<24>>24!=3){G=y;k=m;E=j;break b}if(!n){if(f>>>0<=5){B=436;break f}j=r+5|0;if((a[j>>0]|0)<=-65){B=436;break f}}else j=r+5|0;f=f+-5|0;break i}while(0);nb[c[w>>2]&15](F,d,3608,1);m=F;A=c[m>>2]|0;j=A&255;m=kk(A|0,c[m+4>>2]|0,8)|0;if(j<<24>>24!=3){G=y;k=m;E=j;break b}if(!n){if(f>>>0<=5){B=428;break f}j=r+5|0;if((a[j>>0]|0)<=-65){B=428;break f}}else j=r+5|0;f=f+-5|0;break i}while(0);nb[c[w>>2]&15](F,d,3604,1);m=F;A=c[m>>2]|0;j=A&255;m=kk(A|0,c[m+4>>2]|0,8)|0;if(j<<24>>24!=3){G=y;k=m;E=j;break b}if(!n){if(f>>>0<=5){B=416;break f}j=r+5|0;if((a[j>>0]|0)<=-65){B=416;break f}}else j=r+5|0;f=f+-5|0;break i}while(0);nb[c[w>>2]&15](F,d,3600,1);m=F;A=c[m>>2]|0;j=A&255;m=kk(A|0,c[m+4>>2]|0,8)|0;if(j<<24>>24!=3){G=y;k=m;E=j;break b}if(!n){if(f>>>0<=5){B=404;break f}j=r+5|0;if((a[j>>0]|0)<=-65){B=404;break f}}else j=r+5|0;f=f+-5|0;break i}while(0);nb[c[w>>2]&15](F,d,3596,1);m=F;A=c[m>>2]|0;j=A&255;m=kk(A|0,c[m+4>>2]|0,8)|0;if(j<<24>>24!=3){G=y;k=m;E=j;break b}if(!n){if(f>>>0<=5){B=392;break f}j=r+5|0;if((a[j>>0]|0)<=-65){B=392;break f}}else j=r+5|0;f=f+-5|0;break i}while(0);nb[c[w>>2]&15](F,d,3592,1);m=F;A=c[m>>2]|0;j=A&255;m=kk(A|0,c[m+4>>2]|0,8)|0;if(j<<24>>24!=3){G=y;k=m;E=j;break b}if(!n){if(f>>>0<=5){B=380;break f}j=r+5|0;if((a[j>>0]|0)<=-65){B=380;break f}}else j=r+5|0;f=f+-5|0;break i}while(0);nb[c[w>>2]&15](F,d,3588,1);n=F;A=c[n>>2]|0;m=A&255;n=kk(A|0,c[n+4>>2]|0,8)|0;if(m<<24>>24!=3){G=y;k=n;E=m;break b}if(!j){if(f>>>0<=5){B=368;break f}j=r+5|0;if((a[j>>0]|0)<=-65){B=368;break f}}else j=r+5|0;f=f+-5|0;break i}while(0);nb[c[w>>2]&15](F,d,3584,1);n=F;A=c[n>>2]|0;m=A&255;n=kk(A|0,c[n+4>>2]|0,8)|0;if(m<<24>>24!=3){G=y;k=n;E=m;break b}if(!j){if(f>>>0<=5){B=356;break f}j=r+5|0;if((a[j>>0]|0)<=-65){B=356;break f}}else j=r+5|0;f=f+-5|0;break i}while(0);nb[c[w>>2]&15](F,d,3580,1);n=F;A=c[n>>2]|0;m=A&255;n=kk(A|0,c[n+4>>2]|0,8)|0;if(m<<24>>24!=3){G=y;k=n;E=m;break b}if(!j){if(f>>>0<=5){B=344;break f}j=r+5|0;if((a[j>>0]|0)<=-65){B=344;break f}}else j=r+5|0;f=f+-5|0;break i}while(0);nb[c[w>>2]&15](F,d,3576,1);n=F;A=c[n>>2]|0;m=A&255;n=kk(A|0,c[n+4>>2]|0,8)|0;if(m<<24>>24!=3){G=y;k=n;E=m;break b}if(!j){if(f>>>0<=5){B=332;break f}j=r+5|0;if((a[j>>0]|0)<=-65){B=332;break f}}else j=r+5|0;f=f+-5|0;break i}while(0);m=r+1|0;do if(!j){g=a[m>>0]|0;if(g<<24>>24<=-65){B=201;break f}A=f+-1|0;o=m+A|0;A=(A|0)==0;j=A?m:r+2|0;if(A){B=219;break}do if(g<<24>>24>-1)j=g&255;else {i=g&31;if((j|0)==(o|0)){m=0;n=o;}else {m=a[j>>0]&63;n=j+1|0;}j=m&255;if((g&255)<=223){j=j|i<<6;break}if((n|0)==(o|0)){m=0;n=o;}else {m=a[n>>0]&63;n=n+1|0;}m=m&255|j<<6;if((g&255)<=239){j=m|i<<12;break}if((n|0)==(o|0))j=0;else j=a[n>>0]&63;j=m<<6|i<<18&1835008|j&255;}while(0);if((j|0)!=46){B=219;break}nb[c[w>>2]&15](F,d,3536,2);m=F;A=c[m>>2]|0;j=A&255;m=kk(A|0,c[m+4>>2]|0,8)|0;if(j<<24>>24==3)m=2;else {G=y;k=m;E=j;break b}}else B=219;while(0);if((B|0)==219){B=0;nb[c[w>>2]&15](F,d,3540,1);m=F;A=c[m>>2]|0;j=A&255;m=kk(A|0,c[m+4>>2]|0,8)|0;if(j<<24>>24==3)m=1;else {G=y;k=m;E=j;break b}}if((f|0)!=(m|0)){if(f>>>0<=m>>>0){B=225;break f}j=r+m|0;if((a[j>>0]|0)<=-65){B=225;break f}}else j=r+f|0;f=f-m|0;}while(0);if((B|0)==232){B=0;q=r+f|0;s=r;t=0;k:while(1){j=s;A=(j|0)==(q|0);m=A?s:j+1|0;if((s|0)==0|A){g=f;break}i=a[j>>0]|0;do if(i<<24>>24<=-1){p=i&31;j=m;if((j|0)==(q|0)){j=0;n=q;}else {n=j+1|0;m=n;j=a[j>>0]&63;}o=j&255;if((i&255)<=223){g=m;j=o|p<<6;break}if((n|0)==(q|0)){j=0;g=q;}else {g=n+1|0;m=g;j=a[n>>0]&63;}n=j&255|o<<6;if((i&255)<=239){g=m;j=n|p<<12;break}if((g|0)==(q|0))j=0;else {m=g+1|0;j=a[g>>0]&63;}j=n<<6|p<<18&1835008|j&255;if((j|0)==1114112){g=f;break k}else g=m;}else {g=m;j=i&255;}while(0);m=t-s+g|0;switch(j&2097151|0){case 46:case 36:{B=246;break k}default:{s=g;t=m;}}}if((B|0)==246){B=0;g=(j|0)==1114112?f:t;}j=(g|0)==0|(f|0)==(g|0);if(!j){if(f>>>0<=g>>>0){B=442;break f}if((a[r+g>>0]|0)<=-65){B=442;break f}}nb[c[w>>2]&15](F,d,r,g);n=F;A=c[n>>2]|0;m=A&255;n=kk(A|0,c[n+4>>2]|0,8)|0;if(m<<24>>24!=3){G=y;k=n;E=m;break b}if(!j){if(f>>>0<=g>>>0){B=448;break f}j=r+g|0;if((a[j>>0]|0)<=-65){B=448;break f}}else j=r+g|0;f=f-g|0;}if(!f)break g;else {r=j;B=195;}}nb[c[w>>2]&15](F,d,r,f);j=F;A=c[j>>2]|0;f=A&255;j=kk(A|0,c[j+4>>2]|0,8)|0;if(f<<24>>24!=3){G=y;k=j;E=f;break b}}while(0);if(!h){B=452;break b}else {j=0;p=u;}}switch(B|0){case 166:{$i(3300);break}case 173:{Ii(p,h,0,j);break}case 175:{Ze(8804,43,a[F+1>>0]|0);break}case 180:{Ii(r,f,m,f);break}case 188:{Ii(r,f,1,f);break}case 191:{Ii(r,m,1,m);break}case 201:{Ii(r,f,1,f);break}case 225:{Ii(r,f,m,f);break}case 254:{Ii(r,f,4,f);break}case 263:{Ii(r,f,4,f);break}case 272:{Ii(r,f,4,f);break}case 281:{Ii(r,f,4,f);break}case 290:{Ii(r,f,4,f);break}case 299:{Ii(r,f,4,f);break}case 308:{Ii(r,f,4,f);break}case 320:{Ii(r,f,3,f);break}case 332:{Ii(r,f,5,f);break}case 344:{Ii(r,f,5,f);break}case 356:{Ii(r,f,5,f);break}case 368:{Ii(r,f,5,f);break}case 380:{Ii(r,f,5,f);break}case 392:{Ii(r,f,5,f);break}case 404:{Ii(r,f,5,f);break}case 416:{Ii(r,f,5,f);break}case 428:{Ii(r,f,5,f);break}case 436:{Ii(r,f,5,f);break}case 442:{Ii(r,f,0,g);break}case 448:{Ii(r,f,g,f);break}}}}while(0);if((B|0)==118){nb[c[e+20>>2]&15](F,d,u,x);k=F;G=c[k>>2]|0;f=G&255;k=kk(G|0,c[k+4>>2]|0,8)|0;if(f<<24>>24==3)B=452;else {G=y;E=f;}}if((B|0)==452){k=c[e+20>>2]|0;break}d=nk(k|0,G&16777215|0,8)|0;c[b>>2]=d|E&255;c[b+4>>2]=y;l=H;return}while(0);nb[k&15](b,d,3616,1);l=H;return}function yg(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;u=l;l=l+16|0;s=u;t=d+73|0;if(a[t>>0]|0){c[b>>2]=0;l=u;return}e=d+72|0;a:do if(!(a[e>>0]|0)){a[e>>0]=1;yg(s,d);r=c[s>>2]|0;e=r;if((r|0)!=0?(f=c[s+4>>2]|0,(f|0)!=0):0){c[b>>2]=e;c[b+4>>2]=f;}else g=7;do if((g|0)==7)if(!(a[t>>0]|0))break a;else {c[b>>2]=0;break}while(0);l=u;return}while(0);r=c[d+48>>2]|0;do if((c[d>>2]|0)==1){e=d+8|0;f=c[d+52>>2]|0;g=c[d+56>>2]|0;h=c[d+60>>2]|0;if((c[d+36>>2]|0)==-1){zg(s,e,r,f,g,h,1);break}else {zg(s,e,r,f,g,h,0);break}}else {n=d+8|0;o=d+4+9|0;p=c[d+52>>2]|0;e=a[o>>0]|0;q=c[n>>2]|0;while(1){m=e<<24>>24!=0;e=(m^1)&1;a[o>>0]=e;f=(q|0)==0;if(!(f|(p|0)==(q|0))){if(p>>>0<=q>>>0){g=18;break}if((a[r+q>>0]|0)<=-65){g=18;break}}do if(f)f=1114112;else {i=r+q|0;f=i+-1|0;k=a[f>>0]|0;if(k<<24>>24>-1){f=k&255;break}if((f|0)!=(r|0)){g=i+-2|0;j=a[g>>0]|0;f=j&31;if((j&-64)<<24>>24==-128){if((g|0)!=(r|0)){g=i+-3|0;h=a[g>>0]|0;f=h&15;if((h&-64)<<24>>24==-128){if((g|0)==(r|0))f=0;else f=a[i+-4>>0]&7;f=(f&255)<<6|h&63;}}else f=0;f=f<<6|j&63;}}else f=0;f=f<<6|k&63;}while(0);if(m){g=35;break}if((f|0)==1114112){g=34;break}m=q-(f>>>0<128?1:f>>>0<2048?2:f>>>0<65536?3:4)|0;c[n>>2]=m;q=m;}if((g|0)==18)Ii(r,p,0,q);else if((g|0)==34){c[s>>2]=0;break}else if((g|0)==35){c[s>>2]=1;c[s+4>>2]=q;c[s+8>>2]=q;break}}while(0);if((c[s>>2]|0)==1){f=c[s+8>>2]|0;d=d+68|0;e=(c[d>>2]|0)-f|0;c[d>>2]=c[s+4>>2];}else {a[t>>0]=1;e=c[d+64>>2]|0;f=e;e=(c[d+68>>2]|0)-e|0;}c[b>>2]=r+f;c[b+4>>2]=e;l=u;return}function zg(b,d,e,f,g,h,i){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;s=d+24|0;j=c[s>>2]|0;k=j-h|0;a:do if(k>>>0<f>>>0){r=d+32|0;p=d;o=c[p>>2]|0;p=c[p+4>>2]|0;q=c[d+12>>2]|0;n=c[d+16>>2]|0;d=k;b:while(1){c:while(1){k=d;while(1){m=nk(1,0,a[e+k>>0]&63|0)|0;if(!((m&o|0)==0&(y&p|0)==0))break;c[s>>2]=k;if(!i)c[r>>2]=h;d=k-h|0;if(d>>>0<f>>>0){j=k;k=d;}else break a}if(i)d=q;else {d=c[r>>2]|0;d=q>>>0<=d>>>0?q:d;}m=j-h|0;k=d;do{l=k;k=k+-1|0;if(!l)break c;if(k>>>0>=h>>>0){d=35;break b}l=k+m|0;if(l>>>0>=f>>>0){d=18;break b}}while((a[g+k>>0]|0)==(a[e+l>>0]|0));j=k+j-q|0;c[s>>2]=j;if(!i)c[r>>2]=h;d=j-h|0;if(d>>>0>=f>>>0)break a}d=i?h:c[r>>2]|0;k=q;while(1){if(k>>>0>=d>>>0){d=25;break b}if(k>>>0>4294967294){d=25;break b}if(k>>>0>=h>>>0){d=36;break b}l=m+k|0;if(l>>>0>=f>>>0){d=28;break b}if((a[g+k>>0]|0)==(a[e+l>>0]|0))k=k+1|0;else break}j=j-n|0;c[s>>2]=j;if(!i)c[r>>2]=n;d=j-h|0;if(d>>>0>=f>>>0)break a}if((d|0)==18)bj(3620,l,f);else if((d|0)==25){c[s>>2]=m;if(!i)c[r>>2]=h;c[b>>2]=1;c[b+4>>2]=m;c[b+8>>2]=j;return}else if((d|0)==28)bj(3620,l,f);else if((d|0)==35)bj(3636,k,h);else if((d|0)==36)bj(3652,k,h);}while(0);c[s>>2]=0;c[b>>2]=0;return}function Ag(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;j=l;l=l+32|0;h=j+16|0;f=j;i=a+4|0;if(((c[i>>2]|0)-b|0)>>>0>=d>>>0){l=j;return}g=b+d|0;if(g>>>0<b>>>0)cj(9586,17);c[h>>2]=1;c[h+4>>2]=1;mg(f,h,g);if((c[f>>2]|0)!=1)$i(3668);e=c[f+4>>2]|0;d=c[f+8>>2]|0;if((e|0)<0)$i(3740);b=c[i>>2]|0;if(!b){b=Xb(e,d,h)|0;d=(b|0)==0&1;e=0;f=0;}else {b=_b(c[a>>2]|0,b,1,e,d,h)|0;e=(b|0)==0;f=h+4|0;d=e&1;b=e?c[h>>2]|0:b;e=c[f>>2]|0;f=c[f+4>>2]|0;}if((d|0)==1){c[h>>2]=b;d=h+4|0;c[d>>2]=e;c[d+4>>2]=f;Yb(h);}c[a>>2]=b;c[i>>2]=g;l=j;return}function Bg(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0;h=l;l=l+32|0;f=h+16|0;d=h;g=a+4|0;b=c[g>>2]|0;if(b|0){d=b<<1;if((d|0)<0)$i(3740);b=_b(c[a>>2]|0,b,1,d,1,f)|0;if(!b){i=f+4|0;j=c[i>>2]|0;i=c[i+4>>2]|0;c[f>>2]=c[f>>2];e=f+4|0;c[e>>2]=j;c[e+4>>2]=i;Yb(f);}f=b;i=a;j=d;c[i>>2]=f;c[g>>2]=j;l=h;return}c[f>>2]=1;c[f+4>>2]=1;mg(d,f,4);if((c[d>>2]|0)==1){b=c[d+4>>2]|0;if(b|0?(e=Xb(b,c[d+8>>2]|0,f)|0,e|0):0){f=e;i=a;j=4;c[i>>2]=f;c[g>>2]=j;l=h;return}}c[f>>2]=1;c[f+4>>2]=7654;c[f+8>>2]=30;Yb(f);}function Cg(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;j=l;l=l+32|0;h=j+16|0;f=j;i=a+4|0;e=c[i>>2]|0;if((e-b|0)>>>0>=d>>>0){l=j;return}d=b+d|0;if(d>>>0<b>>>0)cj(9586,17);g=e<<1;g=d>>>0>=g>>>0?d:g;c[h>>2]=1;c[h+4>>2]=1;mg(f,h,g);if((c[f>>2]|0)!=1)$i(3716);e=c[f+4>>2]|0;d=c[f+8>>2]|0;if((e|0)<0)$i(3740);b=c[i>>2]|0;if(!b){b=Xb(e,d,h)|0;d=(b|0)==0&1;e=0;f=0;}else {b=_b(c[a>>2]|0,b,1,e,d,h)|0;e=(b|0)==0;f=h+4|0;d=e&1;b=e?c[h>>2]|0:b;e=c[f>>2]|0;f=c[f+4>>2]|0;}if((d|0)==1){c[h>>2]=b;d=h+4|0;c[d>>2]=e;c[d+4>>2]=f;Yb(h);}c[a>>2]=b;c[i>>2]=g;l=j;return}function Dg(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;j=l;l=l+32|0;h=j+16|0;f=j;i=a+4|0;e=c[i>>2]|0;if((e-b|0)>>>0>=d>>>0){l=j;return}d=b+d|0;if(d>>>0<b>>>0)cj(9586,17);g=e<<1;g=d>>>0>=g>>>0?d:g;c[h>>2]=12;c[h+4>>2]=4;mg(f,h,g);if((c[f>>2]|0)!=1)$i(3716);e=c[f+4>>2]|0;d=c[f+8>>2]|0;if((e|0)<0)$i(3740);b=c[i>>2]|0;if(!b){b=Xb(e,d,h)|0;d=(b|0)==0&1;e=0;f=0;}else {b=_b(c[a>>2]|0,b*12|0,4,e,d,h)|0;e=(b|0)==0;f=h+4|0;d=e&1;b=e?c[h>>2]|0:b;e=c[f>>2]|0;f=c[f+4>>2]|0;}if((d|0)==1){c[h>>2]=b;d=h+4|0;c[d>>2]=e;c[d+4>>2]=f;Yb(h);}c[a>>2]=b;c[i>>2]=g;l=j;return}function Eg(a){a=a|0;var b=0;b=c[a+4>>2]|0;if(!b)return;Zb(c[a>>2]|0,b,1);return}function Fg(a,b){a=a|0;b=b|0;var d=0;d=c[b+4>>2]|0;if(!d)return;Zb(a,d,c[b+8>>2]|0);return}function Gg(a){a=a|0;c[c[a>>2]>>2]=c[a+4>>2];return}function Hg(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;f=l;l=l+16|0;d=f+8|0;e=f;g=c[a>>2]|0;a=c[g>>2]|0;g=c[g+8>>2]|0;wi(e,b);b=a+g|0;if(g|0)do{c[d>>2]=a;a=a+1|0;Vi(e,d,2384)|0;}while((a|0)!=(b|0));g=Wi(e)|0;l=f;return g|0}function Ig(a){a=a|0;var b=0,d=0,e=0;b=c[a>>2]|0;d=c[a+8>>2]|0;e=b+(d*12|0)|0;if(d|0)do{d=c[b+4>>2]|0;if(d|0)Zb(c[b>>2]|0,d,1);b=b+12|0;}while((b|0)!=(e|0));b=c[a+4>>2]|0;if(!b)return;Zb(c[a>>2]|0,b*12|0,4);return}function Jg(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,o=0,p=0,q=0,r=0,s=0,t=0;t=l;l=l+48|0;m=t+36|0;p=t+24|0;q=t+16|0;r=t;c[r>>2]=4;c[r+4>>2]=0;s=r+8|0;c[s>>2]=0;h=c[b>>2]|0;d=c[b+4>>2]|0;e=c[b+8>>2]|0;f=(d|0)>(h|0);n=0;aa(26,r|0,0,(f?d-h|0:0)|0);o=n;n=0;if(o&1){t=na()|0;Ig(r);za(t|0);}g=c[r>>2]|0;b=c[s>>2]|0;c[q>>2]=s;o=q+4|0;c[o>>2]=b;c[p>>2]=h;k=p+4|0;c[k>>2]=d;j=p+8|0;c[j>>2]=e;if(!f){q=b;c[s>>2]=q;c[a>>2]=c[r>>2];c[a+4>>2]=c[r+4>>2];c[a+8>>2]=c[r+8>>2];l=t;return}i=m+4|0;g=g+(b*12|0)|0;while(1){f=h;h=h+1|0;c[p>>2]=h;n=0;aa(27,m|0,j|0,f|0);f=n;n=0;if(f&1){d=9;break}d=c[m>>2]|0;f=i;e=c[f>>2]|0;f=c[f+4>>2]|0;if(!d){d=10;break}c[g>>2]=d;d=g+4|0;c[d>>2]=e;c[d+4>>2]=f;b=b+1|0;if((h|0)>=(c[k>>2]|0)){d=10;break}else g=g+12|0;}if((d|0)==9){t=na()|0;c[o>>2]=b;Gg(q);Ig(r);za(t|0);}else if((d|0)==10){c[s>>2]=b;c[a>>2]=c[r>>2];c[a+4>>2]=c[r+4>>2];c[a+8>>2]=c[r+8>>2];l=t;return}}function Kg(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;i=l;l=l+32|0;e=i+12|0;h=i;if((d|0)<0)$i(3740);if(d){f=Xb(d,1,e)|0;if(!f){c[e>>2]=0;Yb(e);}else g=f;}else g=1;c[h>>2]=g;c[h+4>>2]=d;e=h+8|0;c[e>>2]=0;n=0;aa(23,h|0,0,d|0);g=n;n=0;if(g&1){i=na()|0;Eg(h);za(i|0);}else {g=c[e>>2]|0;c[e>>2]=g+d;ok((c[h>>2]|0)+g|0,b|0,d|0)|0;c[a>>2]=c[h>>2];c[a+4>>2]=c[h+4>>2];c[a+8>>2]=c[h+8>>2];l=i;return}}function Lg(a){a=a|0;var b=0,d=0,e=0;e=l;l=l+16|0;b=e;d=Xb(28,4,b)|0;if(!d)Yb(b);else {c[d>>2]=c[3948];c[d+4>>2]=c[3949];c[d+8>>2]=c[3950];c[d+12>>2]=c[3951];c[d+16>>2]=c[3952];c[d+20>>2]=c[3953];c[d+24>>2]=c[3954];Ra(b|0)|0;Ja(b|0,0)|0;_a(d|0,b|0)|0;sa(b|0)|0;b=a;c[b>>2]=d;c[b+4>>2]=0;l=e;return}}function Mg(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;h=l;l=l+16|0;f=h;if(b>>>0>8|b>>>0>a>>>0){c[f>>2]=0;i=(wj(f,b,a)|0)==0;if(i){e=c[f>>2]|0;g=4;}}else {e=qj(a)|0;g=4;}if((g|0)==4?e|0:0){i=e;l=h;return i|0}c[d>>2]=0;c[d+4>>2]=a;c[d+8>>2]=b;i=0;l=h;return i|0}function Ng(a){a=a|0;var b=0,d=0,e=0,f=0;d=l;l=l+16|0;b=d;f=c[a+4>>2]|0;e=c[a+8>>2]|0;c[b>>2]=c[a>>2];c[b+4>>2]=f;c[b+8>>2]=e;n=0;_(27,d+12|0,b|0);n=0;na()|0;Za();}function Og(a,b,c){a=a|0;b=b|0;c=c|0;rj(a);return}function Pg(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0;i=l;l=l+16|0;h=i;do if((d|0)==(f|0)){if(!(d>>>0>8|d>>>0>e>>>0)){f=sj(a,e)|0;if(!f){h=0;f=d;break}l=i;return f|0}c[h>>2]=0;j=(wj(h,d,e)|0)!=0;f=c[h>>2]|0;if(j|(f|0)==0){h=0;f=d;}else {ok(f|0,a|0,(b>>>0<=e>>>0?b:e)|0)|0;rj(a);j=f;l=i;return j|0}}else {h=1;e=9672;f=36;}while(0);c[g>>2]=h;c[g+4>>2]=e;c[g+8>>2]=f;j=0;l=i;return j|0}function Qg(a){a=a|0;return}function Rg(){return le(3812)|0}function Sg(a){a=a|0;c[a>>2]=0;c[a+4>>2]=2;return}function Tg(a){a=a|0;y=160875347;return 2033335871}function Ug(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=l;l=l+32|0;e=d+8|0;f=d;c[f>>2]=a;c[e>>2]=c[b>>2];c[e+4>>2]=c[b+4>>2];c[e+8>>2]=c[b+8>>2];c[e+12>>2]=c[b+12>>2];c[e+16>>2]=c[b+16>>2];c[e+20>>2]=c[b+20>>2];b=ki(f,3764,e)|0;l=d;return b|0}function Vg(a){a=a|0;var b=0,d=0;d=c[a>>2]|0;b=c[d>>2]|0;c[d>>2]=b-1;if((b|0)!=1)return;Te(a);return}function Wg(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;f=a+8|0;g=a+12|0;b=c[f>>2]|0;a:do if((b|0)!=(c[g>>2]|0)){while(1){c[f>>2]=b+8;e=c[b>>2]|0;b=c[b+4>>2]|0;n=0;Z(c[b>>2]|0,e|0);d=n;n=0;if(d&1)break;d=c[b+4>>2]|0;if(d|0)Zb(e,d,c[b+8>>2]|0);b=c[f>>2]|0;if((b|0)==(c[g>>2]|0))break a}a=na()|0;Fg(e,b);za(a|0);}while(0);b=c[a+4>>2]|0;if(!b)return;Zb(c[a>>2]|0,b<<3,4);return}function Xg(a,b){a=a|0;b=b|0;a=c[a>>2]|0;return yi(c[a>>2]|0,c[a+8>>2]|0,b)|0}function Yg(a){a=a|0;Zb(a,12,4);return}function Zg(){var a=0,b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,o=0,p=0,q=0;p=l;l=l+16|0;m=p;g=m+8|0;h=m+4|0;i=m+4|0;o=m+8|0;j=m+12|0;a=0;a:while(1){b=a;b:while(1){if(b>>>0>=10){a=5;break a}a=b+1|0;if(b>>>0>4294967294){a=5;break a}ik(15828)|0;k=c[3955]|0;c[3955]=(b|0)==9?1:0;mk(15828)|0;switch(k|0){case 1:{a=7;break a}case 0:{b=a;break}default:break b}}c[m>>2]=c[k>>2];c[m+4>>2]=c[k+4>>2];c[m+8>>2]=c[k+8>>2];b=c[m>>2]|0;f=c[g>>2]|0;d=b+(f<<3)|0;e=c[h>>2]|0;c[m>>2]=b;c[i>>2]=e;c[o>>2]=b;c[j>>2]=d;if(f|0){f=b;do{q=f;f=f+8|0;n=0;Z(c[(c[q+4>>2]|0)+12>>2]|0,c[q>>2]|0);q=n;n=0;if(q&1){a=9;break a}}while((f|0)!=(d|0));c[o>>2]=d;}if(e|0)Zb(b,e<<3,4);Zb(k,12,4);}if((a|0)==5){l=p;return}else if((a|0)==7)ve(9754,37,3788);else if((a|0)==9){q=na()|0;c[o>>2]=f;Wg(m);Yg(k);za(q|0);}}function _g(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0;m=l;l=l+64|0;b=m+32|0;e=m+28|0;f=m+24|0;g=m+20|0;h=m+16|0;i=m;j=a+4|0;d=c[j>>2]|0;c[h>>2]=0;d=ja(h|0,d|0)|0;c[g>>2]=d;c[f>>2]=g;c[e>>2]=15856;if(d|0){c[i>>2]=f;c[i+4>>2]=57;c[i+8>>2]=e;c[i+12>>2]=57;c[b>>2]=3820;c[b+4>>2]=3;c[b+8>>2]=5264;c[b+12>>2]=2;c[b+16>>2]=i;c[b+20>>2]=2;we(b,3844);}d=c[h>>2]|0;if(!d){j=c[j>>2]|0;c[h>>2]=0;j=ja(h|0,j|0)|0;c[g>>2]=j;c[f>>2]=g;c[e>>2]=15856;if(j|0){c[i>>2]=f;c[i+4>>2]=57;c[i+8>>2]=e;c[i+12>>2]=57;c[b>>2]=3820;c[b+4>>2]=3;c[b+8>>2]=5264;c[b+12>>2]=2;c[b+16>>2]=i;c[b+20>>2]=2;we(b,3844);}b=c[h>>2]|0;wa(0)|0;if(!b)ve(9791,26,3860);else k=b;}else k=d;b=c[a>>2]|0;if(!b)c[a>>2]=k;if(!b){l=m;return k|0}wa(k|0)|0;k=b;l=m;return k|0}function $g(b){b=b|0;b=b+4|0;if((a[b>>0]|0)==3)return;ah(b);return}function ah(a){a=a|0;var b=0,e=0,f=0;if((d[a>>0]|0)<2)return;e=a+4|0;f=c[e>>2]|0;a=f+4|0;n=0;Z(c[c[a>>2]>>2]|0,c[f>>2]|0);b=n;n=0;if(b&1){b=na()|0;bh(c[f>>2]|0,c[a>>2]|0);ch(c[e>>2]|0);za(b|0);}a=c[a>>2]|0;b=c[a+4>>2]|0;if(b|0)Zb(c[f>>2]|0,b,c[a+8>>2]|0);Zb(c[e>>2]|0,12,4);return}function bh(a,b){a=a|0;b=b|0;var d=0;d=c[b+4>>2]|0;if(!d)return;Zb(a,d,c[b+8>>2]|0);return}function ch(a){a=a|0;Zb(a,12,4);return}function dh(a){a=a|0;var b=0,d=0;b=c[a>>2]|0;if(!b)return;d=a+4|0;n=0;Z(c[c[d>>2]>>2]|0,b|0);b=n;n=0;if(b&1){b=na()|0;eh(c[a>>2]|0,c[d>>2]|0);za(b|0);}d=c[d>>2]|0;b=c[d+4>>2]|0;if(!b)return;Zb(c[a>>2]|0,b,c[d+8>>2]|0);return}function eh(a,b){a=a|0;b=b|0;var d=0;d=c[b+4>>2]|0;if(!d)return;Zb(a,d,c[b+8>>2]|0);return}function fh(a){a=a|0;if(!(c[a>>2]|0))return;ah(a+4|0);return}function gh(b){b=b|0;b=c[b+4>>2]|0;a[b>>0]=0;a[b+1>>0]=0;a[b+2>>0]=0;a[b+3>>0]=0;return}function hh(a,b){a=a|0;b=b|0;var c=0;a=l;l=l+16|0;c=a;ui(c,b,10237,11);b=Ri(c)|0;l=a;return b|0}function ih(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,m=0,o=0,p=0,q=0;i=l;l=l+16|0;m=i;gb[c[b+4>>2]&63](m);q=c[m>>2]|0;p=c[m+4>>2]|0;m=c[m+8>>2]|0;j=d[e>>0]|d[e+1>>0]<<8|d[e+2>>0]<<16|d[e+3>>0]<<24;g=e+4|0;o=e+8|0;h=d[o>>0]|d[o+1>>0]<<8|d[o+2>>0]<<16|d[o+3>>0]<<24;k=e+12|0;b=d[k>>0]|d[k+1>>0]<<8|d[k+2>>0]<<16|d[k+3>>0]<<24;a[e>>0]=1;a[e+1>>0]=0;a[e+2>>0]=0;a[e+3>>0]=0;a[g>>0]=q;a[g+1>>0]=q>>8;a[g+2>>0]=q>>16;a[g+3>>0]=q>>24;a[o>>0]=p;a[o+1>>0]=p>>8;a[o+2>>0]=p>>16;a[o+3>>0]=p>>24;a[k>>0]=m;a[k+1>>0]=m>>8;a[k+2>>0]=m>>16;a[k+3>>0]=m>>24;if(j|0?(f=h,h|0):0){n=0;Z(c[b>>2]|0,f|0);q=n;n=0;if(q&1){q=na()|0;eh(f,b);za(q|0);}f=c[b+4>>2]|0;if(f|0)Zb(h,f,c[b+8>>2]|0);}if((c[e>>2]|0)==1){l=i;return g|0}else $i(3876);return 0}function jh(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0;i=l;l=l+64|0;b=i;e=i+48|0;f=i+32|0;g=fb[c[a>>2]&7]()|0;if(!g)Ue(10081,57);h=g+4|0;do if((c[h>>2]|0)==3){gb[c[a+4>>2]&63](f);c[b>>2]=c[g>>2];c[b+4>>2]=c[g+4>>2];c[b+8>>2]=c[g+8>>2];c[b+12>>2]=c[g+12>>2];c[g>>2]=c[f>>2];c[g+4>>2]=c[f+4>>2];c[g+8>>2]=c[f+8>>2];c[g+12>>2]=c[f+12>>2];c[e>>2]=c[b>>2];c[e+4>>2]=c[b+4>>2];c[e+8>>2]=c[b+8>>2];c[e+12>>2]=c[b+12>>2];if((c[e+4>>2]&2|0)==0?(d=e+12|0,e=c[d>>2]|0,f=c[e>>2]|0,c[e>>2]=f-1,(f|0)==1):0)Te(d);if((c[h>>2]|0)==3)$i(3876);else break}while(0);a=c[g>>2]|0;if((a|0)==-1)_e(9983,24);h=c[h>>2]|0;c[g>>2]=a;if((h|0)==2){l=i;return}else ve(10199,38,3924);}function kh(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,m=0;m=l;l=l+16|0;j=m+8|0;g=m;f=fb[c[b>>2]&7]()|0;if(!f)Ue(10081,57);if((c[f>>2]|0)==1)k=f+4|0;else k=ih(b,f)|0;i=e;h=i;h=d[h>>0]|d[h+1>>0]<<8|d[h+2>>0]<<16|d[h+3>>0]<<24;i=i+4|0;i=d[i>>0]|d[i+1>>0]<<8|d[i+2>>0]<<16|d[i+3>>0]<<24;a[e>>0]=0;a[e+1>>0]=0;a[e+2>>0]=0;a[e+3>>0]=0;e=g;c[e>>2]=h;c[e+4>>2]=i;if(c[k>>2]|0){n=0;_(23,9967,16);n=0;m=na()|0;dh(g);za(m|0);}a[k>>0]=-1;a[k+1>>0]=-1>>8;a[k+2>>0]=-1>>16;a[k+3>>0]=-1>>24;e=k+4|0;c[j>>2]=e;c[j+4>>2]=k;b=c[e>>2]|0;if(!b){j=e;g=j;c[g>>2]=h;j=j+4|0;c[j>>2]=i;a[k>>0]=0;a[k+1>>0]=0;a[k+2>>0]=0;a[k+3>>0]=0;l=m;return}f=k+8|0;n=0;Z(c[c[f>>2]>>2]|0,b|0);g=n;n=0;if(g&1){m=na()|0;eh(c[e>>2]|0,c[f>>2]|0);k=e;c[k>>2]=h;c[k+4>>2]=i;gh(j);za(m|0);}b=c[f>>2]|0;f=c[b+4>>2]|0;if(!f){j=e;g=j;c[g>>2]=h;j=j+4|0;c[j>>2]=i;a[k>>0]=0;a[k+1>>0]=0;a[k+2>>0]=0;a[k+3>>0]=0;l=m;return}Zb(c[e>>2]|0,f,c[b+8>>2]|0);j=e;g=j;c[g>>2]=h;j=j+4|0;c[j>>2]=i;a[k>>0]=0;a[k+1>>0]=0;a[k+2>>0]=0;a[k+3>>0]=0;l=m;return}function lh(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,o=0,p=0,q=0;o=l;l=l+112|0;m=o+32|0;h=o+96|0;i=o+80|0;p=o+16|0;j=o;e=o+64|0;c[e>>2]=c[d>>2];c[e+4>>2]=c[d+4>>2];c[e+8>>2]=c[d+8>>2];n=0;k=Y(c[b>>2]|0)|0;f=n;n=0;if(f&1){p=na()|0;oh(e);za(p|0);}if(!k){d=e+8|0;q=c[d>>2]|0;f=c[q>>2]|0;c[q>>2]=f-1;if((f|0)==1){Te(d);Ue(10081,57);}else Ue(10081,57);};c[j>>2]=c[e>>2];c[j+4>>2]=c[e+4>>2];c[j+8>>2]=c[e+8>>2];f=k+4|0;a:do if((c[f>>2]|0)==3){n=0;Z(c[b+4>>2]|0,i|0);q=n;n=0;do if(!(q&1)){c[m>>2]=c[k>>2];c[m+4>>2]=c[k+4>>2];c[m+8>>2]=c[k+8>>2];c[m+12>>2]=c[k+12>>2];c[k>>2]=c[i>>2];c[k+4>>2]=c[i+4>>2];c[k+8>>2]=c[i+8>>2];c[k+12>>2]=c[i+12>>2];c[h>>2]=c[m>>2];c[h+4>>2]=c[m+4>>2];c[h+8>>2]=c[m+8>>2];c[h+12>>2]=c[m+12>>2];if(((c[h+4>>2]&2|0)==0?(g=h+12|0,i=c[g>>2]|0,q=c[i>>2]|0,c[i>>2]=q-1,(q|0)==1):0)?(n=0,Z(50,g|0),q=n,n=0,q&1):0)break;if((c[f>>2]|0)==3){n=0;Z(44,3876);n=0;break}else break a}while(0);q=na()|0;oh(j);za(q|0);}while(0);h=j;i=c[h+4>>2]|0;q=c[j+8>>2]|0;j=p;c[j>>2]=c[h>>2];c[j+4>>2]=i;c[p+8>>2]=q;if(c[k>>2]|0){n=0;_(23,9967,16);n=0;d=na()|0;n=0;Z(61,p|0);q=n;n=0;if(!(q&1)){q=d;za(q|0);}q=na()|0;za(q|0);}c[k>>2]=-1;c[m>>2]=f;e=m+4|0;c[e>>2]=k;if((c[f>>2]|0)==2){c[f>>2]=c[p>>2];c[f+4>>2]=c[p+4>>2];c[f+8>>2]=c[p+8>>2];q=c[e>>2]|0;a[q>>0]=0;a[q+1>>0]=0;a[q+2>>0]=0;a[q+3>>0]=0;l=o;return}d=k+12|0;k=c[d>>2]|0;q=c[k>>2]|0;c[k>>2]=q-1;if((q|0)!=1){c[f>>2]=c[p>>2];c[f+4>>2]=c[p+4>>2];c[f+8>>2]=c[p+8>>2];q=c[e>>2]|0;a[q>>0]=0;a[q+1>>0]=0;a[q+2>>0]=0;a[q+3>>0]=0;l=o;return};n=0;Z(50,d|0);q=n;n=0;if(!(q&1)){c[f>>2]=c[p>>2];c[f+4>>2]=c[p+4>>2];c[f+8>>2]=c[p+8>>2];q=c[e>>2]|0;a[q>>0]=0;a[q+1>>0]=0;a[q+2>>0]=0;a[q+3>>0]=0;l=o;return}q=na()|0;c[f>>2]=c[p>>2];c[f+4>>2]=c[p+4>>2];c[f+8>>2]=c[p+8>>2];mh(m);za(q|0);}function mh(b){b=b|0;b=c[b+4>>2]|0;a[b>>0]=0;a[b+1>>0]=0;a[b+2>>0]=0;a[b+3>>0]=0;return}function nh(a){a=a|0;var b=0,d=0;if((c[a>>2]|0)==2)return;a=a+8|0;d=c[a>>2]|0;b=c[d>>2]|0;c[d>>2]=b-1;if((b|0)!=1)return;Te(a);return}function oh(a){a=a|0;var b=0,d=0;a=a+8|0;d=c[a>>2]|0;b=c[d>>2]|0;c[d>>2]=b-1;if((b|0)!=1)return;Te(a);return}function ph(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,o=0;m=l;l=l+80|0;i=m;f=m+64|0;e=m+48|0;g=m+32|0;k=fb[c[b>>2]&7]()|0;if(!k){k=0;l=m;return k|0}j=k+4|0;do if((c[j>>2]|0)==3){gb[c[b+4>>2]&63](e);c[i>>2]=c[k>>2];c[i+4>>2]=c[k+4>>2];c[i+8>>2]=c[k+8>>2];c[i+12>>2]=c[k+12>>2];c[k>>2]=c[e>>2];c[k+4>>2]=c[e+4>>2];c[k+8>>2]=c[e+8>>2];c[k+12>>2]=c[e+12>>2];c[f>>2]=c[i>>2];c[f+4>>2]=c[i+4>>2];c[f+8>>2]=c[i+8>>2];c[f+12>>2]=c[i+12>>2];if((c[f+4>>2]&2|0)==0?(d=f+12|0,o=c[d>>2]|0,b=c[o>>2]|0,c[o>>2]=b-1,(b|0)==1):0)Te(d);if((c[j>>2]|0)==3)$i(3876);else break}while(0);b=c[k>>2]|0;do if((b|0)==-1){n=0;_(28,9983,24);n=0;}else {o=c[j>>2]|0;c[k>>2]=b;if((o|0)==2){c[e>>2]=0;n=0;b=$(14,e|0)|0;o=n;n=0;if(o&1)break;c[g>>2]=0;c[g+8>>2]=b;if(c[k>>2]|0){n=0;_(23,9967,16);n=0;o=na()|0;nh(g);za(o|0);}c[k>>2]=-1;c[f>>2]=j;b=f+4|0;c[b>>2]=k;if(((c[j>>2]|0)!=2?(h=k+12|0,e=c[h>>2]|0,o=c[e>>2]|0,c[e>>2]=o-1,(o|0)==1):0)?(n=0,Z(50,h|0),o=n,n=0,o&1):0){o=na()|0;c[j>>2]=c[g>>2];c[j+4>>2]=c[g+4>>2];c[j+8>>2]=c[g+8>>2];mh(f);za(o|0);};c[j>>2]=c[g>>2];c[j+4>>2]=c[g+4>>2];c[j+8>>2]=c[g+8>>2];b=c[b>>2]|0;a[b>>0]=0;a[b+1>>0]=0;a[b+2>>0]=0;a[b+3>>0]=0;b=c[k>>2]|0;}if(b|0){n=0;_(23,9967,16);n=0;o=na()|0;za(o|0);}c[k>>2]=-1;c[i>>2]=j;c[i+4>>2]=k;if((c[j>>2]|0)==2){n=0;Z(44,3876);n=0;o=na()|0;mh(i);za(o|0);}b=k+12|0;j=c[b>>2]|0;o=c[j>>2]|0;c[j>>2]=o+1;if((o|0)<0)Za();o=c[b>>2]|0;c[k>>2]=0;l=m;return o|0}while(0);o=na()|0;za(o|0);return 0}function qh(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,m=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;s=l;l=l+32|0;p=s;q=s+8|0;a:do if(f|0){r=q+4|0;d=0;b:while(1){o=(f|0)>-1?f:2147483647;g=d;while(1){d=dk(2,e,o)|0;if((d|0)==-1){i=1;d=0;m=c[(Bj()|0)>>2]|0;}else {i=0;m=g;}c[q>>2]=i;h=r;c[h>>2]=d;c[h+4>>2]=m;h=d&255;j=m;k=m;if((i|0)!=1)break;g=kk(d|0,m|0,8)|0;switch(d&3){case 0:{if((m|0)!=4){u=12;break b}break}case 1:{t=g&255;u=18;break}case 2:{t=a[j+8>>0]|0;u=18;break}default:{u=15;break b}}if((u|0)==18?(u=0,t<<24>>24!=15):0){u=12;break b}if((h&255)>=2){d=m;g=j+4|0;n=0;Z(c[c[g>>2]>>2]|0,c[d>>2]|0);i=n;n=0;if(i&1){u=25;break b}d=c[g>>2]|0;g=c[d+4>>2]|0;if(g|0)Zb(c[m>>2]|0,g,c[d+8>>2]|0);Zb(k,12,4);}g=m;}if(!d){u=9;break}if(f>>>0<d>>>0){u=11;break}f=f-d|0;if(!f)break a;else {e=e+d|0;d=m;}}do if((u|0)==9){n=0;ea(8,p|0,14,10248,28);u=n;n=0;if(u&1){u=na()|0;fh(q);za(u|0);}else {r=p;t=c[r+4>>2]|0;u=b;c[u>>2]=c[r>>2];c[u+4>>2]=t;break}}else if((u|0)==11){n=0;_(8,d|0,f|0);n=0;u=na()|0;fh(q);za(u|0);}else if((u|0)==12){u=b;c[u>>2]=d;c[u+4>>2]=m;}else if((u|0)!=15)if((u|0)==25){u=na()|0;bh(c[d>>2]|0,c[g>>2]|0);ch(j);za(u|0);}while(0);l=s;return}while(0);a[b>>0]=3;l=s;return}function rh(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;h=l;l=l+48|0;f=h;i=h+24|0;g=h+8|0;c[g>>2]=d;d=g+4|0;a[d>>0]=3;c[i>>2]=c[e>>2];c[i+4>>2]=c[e+4>>2];c[i+8>>2]=c[e+8>>2];c[i+12>>2]=c[e+12>>2];c[i+16>>2]=c[e+16>>2];c[i+20>>2]=c[e+20>>2];n=0;e=W(10,g|0,3900,i|0)|0;i=n;n=0;if(i&1){i=na()|0;$g(g);za(i|0);}do if(e){d=g+4|0;if((a[d>>0]|0)!=3){f=d;g=c[f+4>>2]|0;i=b;c[i>>2]=c[f>>2];c[i+4>>2]=g;l=h;return}n=0;ea(8,f|0,16,10138,15);i=n;n=0;if(i&1){i=na()|0;$g(g);za(i|0);}else {e=f;f=c[e+4>>2]|0;i=b;c[i>>2]=c[e>>2];c[i+4>>2]=f;break}}else a[b>>0]=3;while(0);switch(a[d>>0]&3){case 0:case 1:case 3:{l=h;return}default:{}}b=g+8|0;f=c[b>>2]|0;d=f+4|0;n=0;Z(c[c[d>>2]>>2]|0,c[f>>2]|0);i=n;n=0;if(i&1){i=na()|0;bh(c[f>>2]|0,c[d>>2]|0);ch(c[b>>2]|0);za(i|0);}d=c[d>>2]|0;e=c[d+4>>2]|0;if(e|0)Zb(c[f>>2]|0,e,c[d+8>>2]|0);Zb(c[b>>2]|0,12,4);l=h;return}function sh(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;O=l;l=l+80|0;i=O;N=O+64|0;Ni(i,d,e,f,g);K=c[i>>2]|0;do if((K|0)==1){d=i+8|0;e=c[i+48>>2]|0;f=c[i+52>>2]|0;g=c[i+56>>2]|0;h=c[i+60>>2]|0;if((c[i+36>>2]|0)==-1){th(N,d,e,f,g,h,1);break}else {th(N,d,e,f,g,h,0);break}}else {M=i+28|0;C=i+48|0;D=i+52|0;L=i+36|0;E=i+56|0;F=i+60|0;G=i+8|0;H=i+16|0;I=i+24|0;J=i+12|0;B=i+4|0;d=0;a:while(1){if((d|0)==1){A=c[D>>2]|0;g=c[C>>2]|0;o=c[E>>2]|0;x=c[F>>2]|0;p=x+-1|0;r=G;q=c[r>>2]|0;r=c[r+4>>2]|0;s=c[H>>2]|0;f=c[I>>2]|0;t=x-f|0;e=c[M>>2]|0;h=c[L>>2]|0;if((e|0)==(A|0)){f=56;break}z=(h|0)==-1;i=p+e|0;b:do if(i>>>0<A>>>0){d=x+e|0;u=d+p|0;v=u>>>0<A>>>0;w=1-s+e|0;k=e+f|0;m=k+p|0;n=m>>>0<A>>>0;f=e;while(1){c:while(1){while(1){if((e|0)!=(f|0)){e=h;break b}j=nk(1,0,a[g+i>>0]&63|0)|0;if(!((j&q|0)==0&(y&r|0)==0))break;h=z?h:0;if(v){f=d;i=u;}else {f=A;e=h;break b}}f=z?s:h>>>0>=s>>>0?h:s;while(1){if(f>>>0>=x>>>0)break c;if(f>>>0>4294967294)break c;i=f+e|0;if(i>>>0>=A>>>0){f=40;break a}if((a[o+f>>0]|0)==(a[g+i>>0]|0))f=f+1|0;else break}f=w+f|0;h=z?h:0;i=f+p|0;if(i>>>0>=A>>>0){f=A;e=h;break b}}f=z?0:h;i=s;do{j=i;i=i+-1|0;if(f>>>0>=j>>>0){f=44;break a}if(i>>>0>=x>>>0){f=51;break a}j=i+e|0;if(j>>>0>=A>>>0){f=47;break a}}while((a[o+i>>0]|0)==(a[g+j>>0]|0));h=z?h:t;if(n){f=k;i=m;}else {f=A;e=h;break}}}else {f=A;e=h;}while(0);d:do if((f|0)==0|(A|0)==(f|0))d=f;else {d=f;do{if(A>>>0>d>>>0?(a[g+d>>0]|0)>-65:0)break d;d=d+1|0;}while(!((d|0)==0|(A|0)==(d|0)))}while(0);c[M>>2]=f>>>0>=d>>>0?f:d;c[L>>2]=e;e=A;}else {e=c[D>>2]|0;g=c[C>>2]|0;}j=(a[J>>0]|0)!=0;a[J>>0]=(j^1)&1;k=c[B>>2]|0;if(!((k|0)==0|(e|0)==(k|0))){if(e>>>0<=k>>>0){f=8;break}d=g+k|0;if((a[d>>0]|0)<=-65){f=8;break}}else d=g+k|0;i=g+k+(e-k)|0;A=(d|0)==(i|0);e=A?d:g+k+1|0;do if(!A){g=a[d>>0]|0;if(g<<24>>24>-1){d=g&255;break}h=g&31;if((e|0)==(i|0)){d=0;f=i;}else {d=a[e>>0]&63;f=e+1|0;}e=d&255;d=e|h<<6;if((g&255)>223){if((f|0)==(i|0)){d=0;f=i;}else {d=a[f>>0]&63;f=f+1|0;}e=d&255|e<<6;d=e|h<<12;if((g&255)>239){if((f|0)==(i|0))d=0;else d=a[f>>0]&63;d=e<<6|h<<18&1835008|d&255;}}}else d=1114112;while(0);if(j){e=k;d=k;f=58;break}if((d|0)==1114112){f=57;break}c[B>>2]=(d>>>0<128?1:d>>>0<2048?2:d>>>0<65536?3:4)+k;d=K;}if((f|0)==8)Ii(g,e,k,e);else if((f|0)==40)bj(3956,i,A);else if((f|0)==44){c[L>>2]=h;c[M>>2]=d;if(z)f=58;else {c[L>>2]=0;f=58;}}else if((f|0)==47)bj(3956,j,A);else if((f|0)==51)bj(3972,i,x);else if((f|0)==56){c[M>>2]=A;f=57;}if((f|0)==57){c[N>>2]=0;break}else if((f|0)==58){c[N>>2]=1;c[N+4>>2]=e;c[N+8>>2]=d;break}}while(0);if((c[N>>2]|0)!=1){N=0;c[b>>2]=N;l=O;return}c[b+4>>2]=c[N+4>>2];N=1;c[b>>2]=N;l=O;return}function th(b,d,e,f,g,h,i){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;t=d+20|0;r=h+-1|0;k=c[t>>2]|0;j=k+r|0;a:do if(j>>>0<f>>>0){s=d+28|0;p=d;o=c[p>>2]|0;p=c[p+4>>2]|0;q=c[d+8>>2]|0;m=c[d+16>>2]|0;n=h-m|0;d=k;b:while(1){c:while(1){l=d;while(1){k=nk(1,0,a[e+j>>0]&63|0)|0;if(!((k&o|0)==0&(y&p|0)==0))break;d=l+h|0;c[t>>2]=d;if(!i)c[s>>2]=0;j=d+r|0;if(j>>>0>=f>>>0)break a;else l=d;}if(i)d=q;else {d=c[s>>2]|0;d=d>>>0>=q>>>0?d:q;}do{if(d>>>0>=h>>>0)break c;j=d;d=d+1|0;if(j>>>0>4294967294)break c;k=l+j|0;if(k>>>0>=f>>>0){d=17;break b}}while((a[g+j>>0]|0)==(a[e+k>>0]|0));d=d+l-q|0;c[t>>2]=d;if(!i)c[s>>2]=0;j=d+r|0;if(j>>>0>=f>>>0)break a}d=i?0:c[s>>2]|0;j=q;do{k=j;j=j+-1|0;if(d>>>0>=k>>>0){d=23;break b}if(j>>>0>=h>>>0){d=33;break b}k=j+l|0;if(k>>>0>=f>>>0){d=26;break b}}while((a[g+j>>0]|0)==(a[e+k>>0]|0));d=m+l|0;c[t>>2]=d;if(!i)c[s>>2]=n;j=d+r|0;if(j>>>0>=f>>>0)break a}if((d|0)==17)bj(3956,k,f);else if((d|0)==23){d=l+h|0;c[t>>2]=d;if(!i)c[s>>2]=0;c[b>>2]=1;c[b+4>>2]=l;c[b+8>>2]=d;return}else if((d|0)==26)bj(3956,k,f);else if((d|0)==33)bj(3972,j,h);}while(0);c[t>>2]=f;c[b>>2]=0;return}function uh(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;i=l;l=l+32|0;g=i+12|0;h=i;d=c[(c[c[b>>2]>>2]|0)+(d<<2)>>2]|0;e=Hj(d)|0;if((e|0)==-1)kj(-1,0);if((e|0)<0)$i(3740);if(e){b=Xb(e,1,g)|0;if(!b){c[g>>2]=0;Yb(g);}else f=b;}else f=1;c[h>>2]=f;c[h+4>>2]=e;b=h+8|0;c[b>>2]=0;n=0;aa(23,h|0,0,e|0);g=n;n=0;if(g&1){i=na()|0;vh(h);za(i|0);}else {g=c[b>>2]|0;c[b>>2]=g+e;ok((c[h>>2]|0)+g|0,d|0,e|0)|0;c[a>>2]=c[h>>2];c[a+4>>2]=c[h+4>>2];c[a+8>>2]=c[h+8>>2];l=i;return}}function vh(a){a=a|0;var b=0;b=c[a+4>>2]|0;if(!b)return;Zb(c[a>>2]|0,b,1);return}function wh(a){a=a|0;var b=0,d=0,e=0;b=c[a>>2]|0;d=c[a+8>>2]|0;e=b+(d*12|0)|0;if(d|0)do{d=c[b+4>>2]|0;if(d|0)Zb(c[b>>2]|0,d,1);b=b+12|0;}while((b|0)!=(e|0));b=c[a+4>>2]|0;if(!b)return;Zb(c[a>>2]|0,b*12|0,4);return}function xh(a){a=a|0;var b=0,d=0,e=0,f=0;f=c[a>>2]|0;if(!f)return;b=c[f>>2]|0;d=c[f+8>>2]|0;e=b+(d*12|0)|0;if(d|0)do{d=c[b+4>>2]|0;if(d|0)Zb(c[b>>2]|0,d,1);b=b+12|0;}while((b|0)!=(e|0));b=c[f+4>>2]|0;if(b|0)Zb(c[f>>2]|0,b*12|0,4);Zb(c[a>>2]|0,12,4);return}function yh(a,b){a=a|0;b=b|0;return yi(10417,25,b)|0}function zh(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;f=l;l=l+32|0;d=f+16|0;e=f;g=f+12|0;c[g>>2]=b;c[d>>2]=0;c[d+4>>2]=a;c[d+8>>2]=g;Jg(e,d);ik(15864)|0;if(c[3965]|0){n=0;aa(21,10313,34,3940);n=0;g=na()|0;wh(e);za(g|0);}a=Xb(12,4,d)|0;if(!a)Yb(d);else {c[a>>2]=c[e>>2];c[a+4>>2]=c[e+4>>2];c[a+8>>2]=c[e+8>>2];c[3965]=a;mk(15864)|0;l=f;return}}function Ah(a,b){a=a|0;b=b|0;a=l;l=l+16|0;c[a>>2]=c[b>>2];c[a+4>>2]=c[b+4>>2];c[a+8>>2]=c[b+8>>2];Bh(0,a);}function Bh(a,b){a=a|0;b=b|0;var d=0,e=0;d=l;l=l+32|0;e=d+24|0;a=d;c[e>>2]=b;c[e+4>>2]=61;c[a>>2]=3988;c[a+4>>2]=2;c[a+8>>2]=5180;c[a+12>>2]=1;c[a+16>>2]=e;c[a+20>>2]=1;Dh(d+32|0,a)|0;Za();}function Ch(a){a=a|0;return}function Dh(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=l;l=l+32|0;e=d+8|0;f=d;c[f>>2]=a;c[e>>2]=c[b>>2];c[e+4>>2]=c[b+4>>2];c[e+8>>2]=c[b+8>>2];c[e+12>>2]=c[b+12>>2];c[e+16>>2]=c[b+16>>2];c[e+20>>2]=c[b+20>>2];b=ki(f,4004,e)|0;l=d;return b|0}function Eh(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;j=l;l=l+16|0;b=j;c[b>>2]=0;if(d>>>0<128){a[b>>0]=d;d=1;dk(2,b,d)|0;l=j;return 0}do if(d>>>0>=2048)if(d>>>0<65536){a[b>>0]=d>>>12&15|-32;e=63;f=1;g=-128;h=2;i=3;break}else {a[b>>0]=d>>>18&255|-16;a[b+1>>0]=d>>>12&63|-128;e=63;f=2;g=-128;h=3;i=4;break}else {e=31;f=0;g=-64;h=1;i=2;}while(0);a[b+f>>0]=e&d>>>6&255|g;a[b+h>>0]=d&63|-128;d=i;dk(2,b,d)|0;l=j;return 0}function Fh(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=l;l=l+32|0;e=d+8|0;f=d;c[f>>2]=c[a>>2];c[e>>2]=c[b>>2];c[e+4>>2]=c[b+4>>2];c[e+8>>2]=c[b+8>>2];c[e+12>>2]=c[b+12>>2];c[e+16>>2]=c[b+16>>2];c[e+20>>2]=c[b+20>>2];b=ki(f,4004,e)|0;l=d;return b|0}function Gh(a,b,c){a=a|0;b=b|0;c=c|0;dk(2,b,c)|0;return 0}function Hh(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0;n=0;Z(a|0,b|0);b=n;n=0;if(!(b&1)){e=0;return e|0}a=Da(0)|0;if(!a){n=0;Z(44,4028);n=0;na()|0;Za();}f=c[a>>2]|0;b=c[a+4>>2]|0;va(a|0);c[d>>2]=f;c[e>>2]=b;e=1;return e|0}function Ih(a,b){a=a|0;b=b|0;return Lh(a,b)|0}function Jh(a,b){a=a|0;b=b|0;var d=0;d=c[b+4>>2]|0;if(!d)return;Zb(a,d,c[b+8>>2]|0);return}function Kh(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;return la(a|0,b|0,c|0,d|0,e|0,f|0)|0}function Lh(a,b){a=a|0;b=b|0;var d=0;d=xa(8)|0;if(d|0){c[d>>2]=a;c[d+4>>2]=b;Ua(d|0,0,0);}n=0;Z(c[b>>2]|0,a|0);d=n;n=0;if(d&1){d=na()|0;Jh(a,b);za(d|0);}d=c[b+4>>2]|0;if(!d)return 3;Zb(a,d,c[b+8>>2]|0);return 3}function Mh(a,b){a=a|0;b=b|0;var d=0,e=0;e=l;l=l+16|0;d=e;do switch(c[a>>2]&15){case 0:{vi(d,b,10573,14);d=Ti(d)|0;l=e;return d|0}case 1:{vi(d,b,10587,29);d=Ti(d)|0;l=e;return d|0}case 2:{vi(d,b,10616,23);d=Ti(d)|0;l=e;return d|0}case 3:{vi(d,b,10639,23);d=Ti(d)|0;l=e;return d|0}case 4:{vi(d,b,10662,16);d=Ti(d)|0;l=e;return d|0}case 5:{vi(d,b,10678,17);d=Ti(d)|0;l=e;return d|0}case 6:{vi(d,b,10695,18);d=Ti(d)|0;l=e;return d|0}case 7:{vi(d,b,10713,20);d=Ti(d)|0;l=e;return d|0}case 8:{vi(d,b,10733,20);d=Ti(d)|0;l=e;return d|0}case 9:{vi(d,b,10753,12);d=Ti(d)|0;l=e;return d|0}default:{}}while(0);return 0}function Nh(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=l;l=l+16|0;f=e;Qh(f,b,d);c[a>>2]=c[f>>2];c[a+4>>2]=c[f+4>>2];c[a+8>>2]=c[f+8>>2];l=e;return}function Oh(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=l;l=l+16|0;f=e;Qh(f,b,d);c[a>>2]=c[f>>2];c[a+4>>2]=c[f+4>>2];c[a+8>>2]=c[f+8>>2];l=e;return}function Ph(a){a=a|0;var b=0;b=c[a+4>>2]|0;if(!b)return;Zb(c[a>>2]|0,b,1);return}function Qh(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;i=l;l=l+32|0;e=i+12|0;h=i;if((d|0)<0)$i(4084);if(d){f=Xb(d,1,e)|0;if(!f){c[e>>2]=0;Yb(e);}else g=f;}else g=1;c[h>>2]=g;c[h+4>>2]=d;e=h+8|0;c[e>>2]=0;n=0;aa(28,h|0,0,d|0);g=n;n=0;if(g&1){i=na()|0;Ph(h);za(i|0);}else {g=c[e>>2]|0;c[e>>2]=g+d;ok((c[h>>2]|0)+g|0,b|0,d|0)|0;c[a>>2]=c[h>>2];c[a+4>>2]=c[h+4>>2];c[a+8>>2]=c[h+8>>2];l=i;return}}function Rh(a,b){a=a|0;b=b|0;return zi(c[a>>2]|0,c[a+4>>2]|0,b)|0}function Sh(a,b){a=a|0;b=b|0;c[a>>2]=c[b>>2];c[a+4>>2]=c[b+4>>2];c[a+8>>2]=c[b+8>>2];return}function Th(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=l;l=l+48|0;g=d+32|0;f=d+24|0;e=d;a=(c[a>>2]|0)!=1;c[g>>2]=a?10765:10791;c[g+4>>2]=a?26:29;c[f>>2]=g;c[f+4>>2]=62;c[e>>2]=4076;c[e+4>>2]=1;c[e+8>>2]=5180;c[e+12>>2]=1;c[e+16>>2]=f;c[e+20>>2]=1;b=si(b,e)|0;l=d;return b|0}function Uh(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;j=l;l=l+16|0;h=j;i=a+4|0;e=c[i>>2]|0;if((e-b|0)>>>0>=d>>>0){l=j;return}d=b+d|0;if(d>>>0<b>>>0)cj(10820,17);g=e<<1;g=d>>>0>=g>>>0?d:g;if((g|0)<0)$i(4084);if(!e){b=Xb(g,1,h)|0;d=(b|0)==0&1;e=0;f=0;}else {b=_b(c[a>>2]|0,e,1,g,1,h)|0;e=(b|0)==0;f=h+4|0;d=e&1;b=e?c[h>>2]|0:b;e=c[f>>2]|0;f=c[f+4>>2]|0;}if((d|0)==1){c[h>>2]=b;d=h+4|0;c[d>>2]=e;c[d+4>>2]=f;Yb(h);}c[a>>2]=b;c[i>>2]=g;l=j;return}function Vh(a){a=a|0;return Zh(a,168)|0}function Wh(a,b,d){a=a|0;b=b|0;d=d|0;c[a>>2]=b;c[a+4>>2]=d;return}function Xh(a,b,d){a=a|0;b=b|0;d=d|0;c[a>>2]=b;c[a+4>>2]=d;return}function Yh(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;m=d+4|0;n=c[m>>2]|0;if(!n){c[b>>2]=0;return}s=c[d>>2]|0;e=0;a:while(1){k=s+e|0;i=a[k>>0]|0;f=e+1|0;b:do if(i<<24>>24>-1)e=f;else switch(a[11498+(i&255)>>0]|0){case 2:{if(n>>>0<=f>>>0){u=15;break a}if((a[s+f>>0]&-64)<<24>>24!=-128){u=15;break a}e=e+2|0;break b}case 3:{if(n>>>0<=f>>>0){u=15;break a}g=a[s+f>>0]|0;h=(g&255)<192;if(((!(i<<24>>24==-32&(g&-32)<<24>>24==-96)?(j=g<<24>>24<0,!(h&((i+31&255)<12&j))):0)?!((g&255)<160&(i<<24>>24==-19&j)):0)?!(h&((i&-2)<<24>>24==-18&j)):0){u=15;break a}f=e+2|0;if(n>>>0<=f>>>0){u=15;break a}if((a[s+f>>0]&-64)<<24>>24!=-128){u=15;break a}e=e+3|0;break b}case 4:{if(n>>>0<=f>>>0){u=15;break a}g=a[s+f>>0]|0;if((!(i<<24>>24==-16&(g+112&255)<48)?(l=g<<24>>24<0,!((g&255)<192&((i+15&255)<3&l))):0)?!((g&255)<144&(i<<24>>24==-12&l)):0){u=15;break a}f=e+2|0;if(n>>>0<=f>>>0){u=15;break a}if((a[s+f>>0]&-64)<<24>>24!=-128){u=15;break a}f=e+3|0;if(n>>>0<=f>>>0){u=15;break a}if((a[s+f>>0]&-64)<<24>>24!=-128){u=15;break a}e=e+4|0;break b}default:{u=15;break a}}while(0);if(e>>>0>=n>>>0){o=16465;p=0;q=n;r=16465;t=0;break}}do if((u|0)==15){if(n>>>0<e>>>0)kj(e,n);if(f>>>0<e>>>0)lj(e,f);if(n>>>0<f>>>0)kj(f,n);else {o=s+f|0;p=n-f|0;q=e;r=k;t=f-e|0;break}}while(0);c[d>>2]=o;c[m>>2]=p;c[b>>2]=s;c[b+4>>2]=q;c[b+8>>2]=r;c[b+12>>2]=t;return}function Zh(a,b){a=a|0;b=b|0;var e=0,f=0,g=0;do if(a>>>0>=2048){if(a>>>0<65536){e=(a>>>6)+-32|0;if(e>>>0>=992)bj(4108,e,992);e=d[b+280+e>>0]|0;f=c[b+260>>2]|0;if(e>>>0<f>>>0){g=(c[b+256>>2]|0)+(e<<3)|0;break}else bj(4124,e,f);}e=(a>>>12)+-16|0;if(e>>>0>=256)bj(4108,e,256);f=c[b+268>>2]|0;e=(d[b+1272+e>>0]|0)<<6|a>>>6&63;if(e>>>0>=f>>>0)bj(4108,e,f);e=d[(c[b+264>>2]|0)+e>>0]|0;f=c[b+276>>2]|0;if(e>>>0<f>>>0){g=(c[b+272>>2]|0)+(e<<3)|0;break}else bj(4140,e,f);}else g=b+(a>>>6<<3)|0;while(0);f=c[g>>2]|0;g=c[g+4>>2]|0;b=nk(1,0,a&63|0)|0;return (f&b|0)!=0|(g&y|0)!=0|0}function _h(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;j=l;l=l+128|0;i=j;g=c[b>>2]|0;b=i;e=b+128|0;do{a[b>>0]=0;b=b+1|0;}while((b|0)<(e|0));f=128;h=i+128|0;e=g;while(1){h=h+-1|0;b=e&15;e=e>>>4;a[h>>0]=((b&255)<10?48:87)+b<<24>>24;b=f+-1|0;if(!e)break;else f=b;}if(b>>>0>128)lj(b,128);else {i=oi(d,1,11390,2,i+b|0,129-f|0)|0;l=j;return i|0}return 0}function $h(a,b){a=a|0;b=b|0;return ai(a,b)|0}function ai(d,e){d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0;j=l;l=l+48|0;i=j;d=c[d>>2]|0;if(d>>>0>9999){h=39;g=d;while(1){k=(g>>>0)%1e4|0;d=(g>>>0)/1e4|0;f=h+-4|0;m=i+f|0;n=b[4156+(((k>>>0)/100|0)<<1)>>1]|0;a[m>>0]=n;a[m+1>>0]=n>>8;h=i+(h+-2)|0;k=b[4156+(((k>>>0)%100|0)<<1)>>1]|0;a[h>>0]=k;a[h+1>>0]=k>>8;if(g>>>0>99999999){h=f;g=d;}else break}}else f=39;if((d|0)>99){f=f+-2|0;n=i+f|0;m=b[4156+(((d>>>0)%100|0)<<1)>>1]|0;a[n>>0]=m;a[n+1>>0]=m>>8;d=(d>>>0)/100|0;}if((d|0)<10){n=f+-1|0;a[i+n>>0]=(d&255)+48<<24>>24;m=i+n|0;n=39-n|0;n=oi(e,1,16465,0,m,n)|0;l=j;return n|0}else {n=f+-2|0;m=i+n|0;k=b[4156+(d<<1)>>1]|0;a[m>>0]=k;a[m+1>>0]=k>>8;m=i+n|0;n=39-n|0;n=oi(e,1,16465,0,m,n)|0;l=j;return n|0}return 0}function bi(b,c){b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,i=0;i=l;l=l+128|0;h=i;f=a[b>>0]|0;b=h;d=b+128|0;do{a[b>>0]=0;b=b+1|0;}while((b|0)<(d|0));e=128;g=h+128|0;d=f;while(1){g=g+-1|0;b=d&15;d=(d&255)>>>4;a[g>>0]=((b&255)<10?48:55)+b<<24>>24;b=e+-1|0;if(!(d<<24>>24))break;else e=b;}if(b>>>0>128)lj(b,128);else {h=oi(c,1,11390,2,h+b|0,129-e|0)|0;l=i;return h|0}return 0}function ci(c,d){c=c|0;d=d|0;var e=0,f=0,g=0,h=0;h=l;l=l+48|0;f=h;c=a[c>>0]|0;e=c&255;if((c&255)<=99)if((c&255)<10){c=38;g=4;}else {c=f+37|0;e=b[4156+(e<<1)>>1]|0;a[c>>0]=e;a[c+1>>0]=e>>8;c=37;}else {e=f+37|0;g=b[4156+(((c&255)%100|0)<<1&255)>>1]|0;a[e>>0]=g;a[e+1>>0]=g>>8;e=((c&255)/100|0)&255;c=36;g=4;}if((g|0)==4)a[f+c>>0]=(e&255)+48<<24>>24;g=oi(d,1,16465,0,f+c|0,39-c|0)|0;l=h;return g|0}function di(a,b){a=a|0;b=b|0;return ei(a,b)|0}function ei(d,e){d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0;k=l;l=l+48|0;j=k;d=c[d>>2]|0;i=(d|0)>-1;d=i?d:0-d|0;if(d>>>0>9999){h=39;g=d;while(1){m=(g>>>0)%1e4|0;f=(g>>>0)/1e4|0;d=h+-4|0;n=j+d|0;o=b[4156+(((m>>>0)/100|0)<<1)>>1]|0;a[n>>0]=o;a[n+1>>0]=o>>8;h=j+(h+-2)|0;m=b[4156+(((m>>>0)%100|0)<<1)>>1]|0;a[h>>0]=m;a[h+1>>0]=m>>8;if(g>>>0>99999999){h=d;g=f;}else break}}else {f=d;d=39;}if((f|0)>99){d=d+-2|0;o=j+d|0;n=b[4156+(((f>>>0)%100|0)<<1)>>1]|0;a[o>>0]=n;a[o+1>>0]=n>>8;f=(f>>>0)/100|0;}if((f|0)<10){o=d+-1|0;a[j+o>>0]=(f&255)+48<<24>>24;n=j+o|0;o=39-o|0;o=oi(e,i,16465,0,n,o)|0;l=k;return o|0}else {o=d+-2|0;n=j+o|0;m=b[4156+(f<<1)>>1]|0;a[n>>0]=m;a[n+1>>0]=m>>8;n=j+o|0;o=39-o|0;o=oi(e,i,16465,0,n,o)|0;l=k;return o|0}return 0}function fi(d,e){d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0;j=l;l=l+48|0;i=j;d=c[d>>2]|0;if(d>>>0>9999){h=39;g=d;while(1){k=(g>>>0)%1e4|0;d=(g>>>0)/1e4|0;f=h+-4|0;m=i+f|0;n=b[4156+(((k>>>0)/100|0)<<1)>>1]|0;a[m>>0]=n;a[m+1>>0]=n>>8;h=i+(h+-2)|0;k=b[4156+(((k>>>0)%100|0)<<1)>>1]|0;a[h>>0]=k;a[h+1>>0]=k>>8;if(g>>>0>99999999){h=f;g=d;}else break}}else f=39;if((d|0)>99){f=f+-2|0;n=i+f|0;m=b[4156+(((d>>>0)%100|0)<<1)>>1]|0;a[n>>0]=m;a[n+1>>0]=m>>8;d=(d>>>0)/100|0;}if((d|0)<10){n=f+-1|0;a[i+n>>0]=(d&255)+48<<24>>24;m=i+n|0;n=39-n|0;n=oi(e,1,16465,0,m,n)|0;l=j;return n|0}else {n=f+-2|0;m=i+n|0;k=b[4156+(d<<1)>>1]|0;a[m>>0]=k;a[m+1>>0]=k>>8;m=i+n|0;n=39-n|0;n=oi(e,1,16465,0,m,n)|0;l=j;return n|0}return 0}function gi(a){a=a|0;return}function hi(a,b,d){a=a|0;b=b|0;d=d|0;return Pi(c[a>>2]|0,b,d)|0}function ii(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;k=l;l=l+16|0;j=k;i=c[b>>2]|0;c[j>>2]=0;if(d>>>0<128){a[j>>0]=d;b=1;}else {do if(d>>>0>=2048)if(d>>>0<65536){a[j>>0]=d>>>12&15|-32;e=63;f=1;g=-128;h=2;b=3;break}else {a[j>>0]=d>>>18&255|-16;a[j+1>>0]=d>>>12&63|-128;e=63;f=2;g=-128;h=3;b=4;break}else {e=31;f=0;g=-64;h=1;b=2;}while(0);a[j+f>>0]=e&d>>>6&255|g;a[j+h>>0]=d&63|-128;}j=Pi(i,j,b)|0;l=k;return j|0}function ji(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=l;l=l+32|0;e=d+8|0;f=d;c[f>>2]=c[a>>2];c[e>>2]=c[b>>2];c[e+4>>2]=c[b+4>>2];c[e+8>>2]=c[b+8>>2];c[e+12>>2]=c[b+12>>2];c[e+16>>2]=c[b+16>>2];c[e+20>>2]=c[b+20>>2];b=ki(f,5092,e)|0;l=d;return b|0}function ki(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;x=l;l=l+64|0;f=x+56|0;t=x;g=c[e+16>>2]|0;u=c[e+20>>2]|0;h=g+(u<<3)|0;c[t>>2]=0;r=t+4|0;c[r>>2]=32;s=t+48|0;a[s>>0]=3;c[t+8>>2]=0;c[t+16>>2]=0;w=t+24|0;c[w>>2]=b;v=t+28|0;c[v>>2]=d;c[t+32>>2]=g;o=t+36|0;c[o>>2]=h;p=t+40|0;c[p>>2]=g;q=t+44|0;c[q>>2]=u;b=c[e>>2]|0;u=b+(c[e+4>>2]<<3)|0;c[f>>2]=b;c[f+4>>2]=u;d=c[e+8>>2]|0;do if(!d){while(1){if((g|0)==(h|0)){g=4;break}if((b|0)==(u|0)){b=u;g=4;break}s=b;b=b+8|0;if(db[c[(c[v>>2]|0)+12>>2]&15](c[w>>2]|0,c[s>>2]|0,c[s+4>>2]|0)|0){g=12;break}if(lb[c[g+4>>2]&127](c[g>>2]|0,t)|0){g=12;break}else g=g+8|0;}if((g|0)==4){c[f>>2]=b;g=6;break}else if((g|0)==12){c[f>>2]=b;break}}else {j=d+((c[e+12>>2]|0)*36|0)|0;k=t+8|0;m=t+16|0;n=t+32|0;i=d;a:while(1){if((i|0)==(j|0)){g=5;break}h=i;i=i+36|0;if((b|0)==(u|0)){b=u;g=5;break}e=b;b=b+8|0;if(db[c[(c[v>>2]|0)+12>>2]&15](c[w>>2]|0,c[e>>2]|0,c[e+4>>2]|0)|0){g=13;break}c[r>>2]=c[h+8>>2];a[s>>0]=a[h+32>>0]|0;c[t>>2]=c[h+12>>2];switch(c[h+24>>2]&3){case 0:{g=c[h+28>>2]|0;d=0;e=1;break}case 1:{e=c[h+28>>2]|0;d=c[q>>2]|0;if(e>>>0>=d>>>0){g=27;break a}g=c[p>>2]|0;if((c[g+(e<<3)+4>>2]|0)==63){g=c[c[g+(e<<3)>>2]>>2]|0;d=0;e=1;}else {g=0;d=0;e=0;}break}case 2:{g=c[n>>2]|0;if((g|0)!=(c[o>>2]|0)?(c[n>>2]=g+8,(c[g+4>>2]|0)==63):0){g=c[c[g>>2]>>2]|0;d=0;e=1;}else {g=0;d=0;e=0;}break}case 3:{g=0;d=0;e=0;break}default:{g=22;break a}}y=k;c[y>>2]=e;c[y+4>>2]=g|d;switch(c[h+16>>2]&3){case 0:{g=c[h+20>>2]|0;d=0;e=1;break}case 1:{e=c[h+20>>2]|0;d=c[q>>2]|0;if(e>>>0>=d>>>0){g=37;break a}g=c[p>>2]|0;if((c[g+(e<<3)+4>>2]|0)==63){g=c[c[g+(e<<3)>>2]>>2]|0;d=0;e=1;}else {g=0;d=0;e=0;}break}case 2:{g=c[n>>2]|0;if((g|0)!=(c[o>>2]|0)?(c[n>>2]=g+8,(c[g+4>>2]|0)==63):0){g=c[c[g>>2]>>2]|0;d=0;e=1;}else {g=0;d=0;e=0;}break}case 3:{g=0;d=0;e=0;break}default:{g=32;break a}}y=m;c[y>>2]=e;c[y+4>>2]=g|d;if((c[h>>2]|0)==1){d=c[h+4>>2]|0;e=c[q>>2]|0;if(d>>>0>=e>>>0){g=44;break}g=(c[p>>2]|0)+(d<<3)|0;}else {g=c[n>>2]|0;if((g|0)==(c[o>>2]|0)){g=40;break}c[n>>2]=g+8;}if(lb[c[g+4>>2]&127](c[g>>2]|0,t)|0){g=13;break}}if((g|0)==5){c[f>>2]=b;g=6;break}else if((g|0)==13){c[f>>2]=b;break}else if((g|0)!=22)if((g|0)==27)bj(4380,e,d);else if((g|0)!=32)if((g|0)==37)bj(4380,e,d);else if((g|0)==40)$i(4396);else if((g|0)==44)bj(4420,d,e);}while(0);do if((g|0)==6){if((b|0)!=(u|0)?(c[f>>2]=b+8,db[c[(c[v>>2]|0)+12>>2]&15](c[w>>2]|0,c[b>>2]|0,c[b+4>>2]|0)|0):0)break;y=0;l=x;return y|0}while(0);y=1;l=x;return y|0}function li(a,b){a=a|0;b=b|0;return ai(a,b)|0}function mi(a,b){a=a|0;b=b|0;c[a>>2]=b;c[a+4>>2]=63;return}function ni(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=l;l=l+32|0;e=d;f=c[b+24>>2]|0;b=c[b+28>>2]|0;c[e>>2]=c[a>>2];c[e+4>>2]=c[a+4>>2];c[e+8>>2]=c[a+8>>2];c[e+12>>2]=c[a+12>>2];c[e+16>>2]=c[a+16>>2];c[e+20>>2]=c[a+20>>2];b=ki(f,b,e)|0;l=d;return b|0}function oi(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;w=l;l=l+48|0;v=w+28|0;s=w+16|0;n=w+32|0;o=w;m=w+8|0;c[m>>2]=e;c[m+4>>2]=f;c[o>>2]=1114112;if(d){d=c[b>>2]|0;if(!(d&1)){k=d;j=h;}else {c[o>>2]=43;k=d;j=h+1|0;}}else {c[o>>2]=45;k=c[b>>2]|0;j=h+1|0;}a[n>>0]=0;if(k&4){a[n>>0]=1;i=e+f|0;if(!f)d=0;else {d=0;do{d=((a[e>>0]&-64)<<24>>24==-128&1)+d|0;e=e+1|0;}while((e|0)!=(i|0))}j=j+f-d|0;}c[s>>2]=o;c[s+4>>2]=n;c[s+8>>2]=m;a:do if((c[b+8>>2]|0)==1){d=c[b+12>>2]|0;if(d>>>0<=j>>>0){if(pi(s,b)|0){u=41;break}d=db[c[(c[b+28>>2]|0)+12>>2]&15](c[b+24>>2]|0,g,h)|0;u=38;break}if(!(k&8)){d=d-j|0;t=a[b+48>>0]|0;switch((t<<24>>24==3?1:t)&3){case 0:{q=d;p=0;break}case 3:case 1:{q=0;p=d;break}case 2:{q=(d+1|0)>>>1;p=d>>>1;break}default:{}}c[v>>2]=0;d=c[b+4>>2]|0;if(d>>>0<128){a[v>>0]=d;e=1;}else {do if(d>>>0>=2048)if(d>>>0<65536){a[v>>0]=d>>>12&15|-32;e=3;i=63;j=1;k=-128;f=2;break}else {a[v>>0]=d>>>18&255|-16;a[v+1>>0]=d>>>12&63|-128;e=4;i=63;j=2;k=-128;f=3;break}else {e=2;i=31;j=0;k=-64;f=1;}while(0);a[v+j>>0]=i&d>>>6&255|k;a[v+f>>0]=d&63|-128;}i=b+24|0;j=b+28|0;d=0;while(1){if(d>>>0>=p>>>0){u=29;break}if(d>>>0>4294967294){u=29;break}if(db[c[(c[j>>2]|0)+12>>2]&15](c[i>>2]|0,v,e)|0)break;else d=d+1|0;}b:do if(((u|0)==29?!(pi(s,b)|0):0)?!(db[c[(c[j>>2]|0)+12>>2]&15](c[i>>2]|0,g,h)|0):0){d=0;while(1){if(d>>>0>=q>>>0)break;if(d>>>0>4294967294)break;if(db[c[(c[j>>2]|0)+12>>2]&15](c[i>>2]|0,v,e)|0)break b;else d=d+1|0;}d=0;u=38;break a}while(0);d=1;u=38;break}else {e=b+4|0;c[e>>2]=48;i=b+48|0;a[i>>0]=1;if(pi(s,b)|0){u=41;break}d=d-j|0;s=a[i>>0]|0;switch((s<<24>>24==3?1:s)&3){case 0:{r=0;t=d;break}case 3:case 1:{r=d;t=0;break}case 2:{r=d>>>1;t=(d+1|0)>>>1;break}default:{}}c[v>>2]=0;d=c[e>>2]|0;if(d>>>0<128){a[v>>0]=d;j=1;}else {do if(d>>>0>=2048)if(d>>>0<65536){a[v>>0]=d>>>12&15|-32;e=63;i=1;k=-128;f=2;j=3;break}else {a[v>>0]=d>>>18&255|-16;a[v+1>>0]=d>>>12&63|-128;e=63;i=2;k=-128;f=3;j=4;break}else {e=31;i=0;k=-64;f=1;j=2;}while(0);a[v+i>>0]=e&d>>>6&255|k;a[v+f>>0]=d&63|-128;}i=b+24|0;e=b+28|0;d=0;while(1){if(d>>>0>=r>>>0){u=57;break}if(d>>>0>4294967294){u=57;break}if(db[c[(c[e>>2]|0)+12>>2]&15](c[i>>2]|0,v,j)|0)break;else d=d+1|0;}c:do if((u|0)==57?!(db[c[(c[e>>2]|0)+12>>2]&15](c[i>>2]|0,g,h)|0):0){d=0;while(1){if(d>>>0>=t>>>0)break;if(d>>>0>4294967294)break;if(db[c[(c[e>>2]|0)+12>>2]&15](c[i>>2]|0,v,j)|0)break c;else d=d+1|0;}d=0;u=38;break a}while(0);d=1;u=38;break}}else if(pi(s,b)|0)u=41;else {d=db[c[(c[b+28>>2]|0)+12>>2]&15](c[b+24>>2]|0,g,h)|0;u=38;}while(0);if((u|0)==38){v=d;l=w;return v|0}else if((u|0)==41){v=1;l=w;return v|0}return 0}function pi(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0;o=l;l=l+16|0;k=o;j=c[c[b>>2]>>2]|0;if((j|0)!=1114112){m=c[d+24>>2]|0;n=c[d+28>>2]|0;c[k>>2]=0;if(j>>>0<128){a[k>>0]=j;e=1;}else {do if(j>>>0>=2048)if(j>>>0<65536){a[k>>0]=j>>>12&15|-32;f=63;g=1;h=-128;i=2;e=3;break}else {a[k>>0]=j>>>18&255|-16;a[k+1>>0]=j>>>12&63|-128;f=63;g=2;h=-128;i=3;e=4;break}else {f=31;g=0;h=-64;i=1;e=2;}while(0);a[k+g>>0]=f&j>>>6&255|h;a[k+i>>0]=j&63|-128;}if(db[c[n+12>>2]&15](m,k,e)|0){n=1;l=o;return n|0}}if(!(a[c[b+4>>2]>>0]|0)){n=0;l=o;return n|0}n=c[b+8>>2]|0;n=db[c[(c[d+28>>2]|0)+12>>2]&15](c[d+24>>2]|0,c[n>>2]|0,c[n+4>>2]|0)|0;l=o;return n|0}function qi(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;v=l;l=l+16|0;u=v;q=b+8|0;f=(c[b+16>>2]|0)==1;if((c[q>>2]|0)==1)if(f)s=7;else {m=e;g=d;}else if(f)s=7;else {u=db[c[(c[b+28>>2]|0)+12>>2]&15](c[b+24>>2]|0,d,e)|0;l=v;return u|0}if((s|0)==7){g=c[b+20>>2]|0;n=d+e|0;c[u>>2]=0;o=u+4|0;c[o>>2]=d;k=u+8|0;c[k>>2]=n;f=u+12|0;c[f>>2]=g;p=d;a:do if(!g)if(!e)m=0;else {g=d+1|0;c[o>>2]=g;f=g;k=a[d>>0]|0;if(k<<24>>24<=-1){m=k&255;if((e|0)==1){g=0;h=n;}else {h=d+2|0;c[o>>2]=h;f=h;g=a[g>>0]&63;}i=g&255;if((k&255)>223){if((h|0)==(n|0)){g=0;j=n;}else {j=h+1|0;c[o>>2]=j;f=j;g=a[h>>0]&63;}h=g&255|i<<6;if((k&255)>239){if((j|0)==(n|0))g=0;else {f=j+1|0;c[o>>2]=f;g=a[j>>0]&63;}if((h<<6|m<<18&1835008|g&255|0)==1114112){m=e;break}}}}c[u>>2]=f-p;m=0;}else {c[f>>2]=0;j=u+4|0;if((Hi(j)|0)!=1114112){i=c[k>>2]|0;h=c[j>>2]|0;c[u>>2]=(c[u>>2]|0)+e-i+h;f=g;do{if((Hi(j)|0)==1114112){m=e;break a}f=f+-1|0;g=c[u>>2]|0;o=i;i=c[k>>2]|0;p=h;h=c[j>>2]|0;c[u>>2]=o-p+g-i+h;}while((f|0)!=0);if(!((g|0)==0|(g|0)==(e|0))){if(g>>>0>=e>>>0)Ii(d,e,0,g);if((a[d+g>>0]|0)<=-65)Ii(d,e,0,g);else m=g;}else m=g;}else m=e;}while(0);if((c[q>>2]|0)==1)g=d;else {u=db[c[(c[b+28>>2]|0)+12>>2]&15](c[b+24>>2]|0,d,m)|0;l=v;return u|0}}k=c[b+12>>2]|0;j=d+m|0;i=(m|0)==0;if(i)f=0;else {h=g;f=0;do{f=((a[h>>0]&-64)<<24>>24==-128&1)+f|0;h=h+1|0;}while((h|0)!=(j|0))}if((m-f|0)>>>0>=k>>>0){u=db[c[(c[b+28>>2]|0)+12>>2]&15](c[b+24>>2]|0,d,m)|0;l=v;return u|0}if(i)f=0;else {f=0;do{f=((a[g>>0]&-64)<<24>>24==-128&1)+f|0;g=g+1|0;}while((g|0)!=(j|0))}f=f-m+k|0;q=a[b+48>>0]|0;switch((q<<24>>24==3?0:q)&3){case 0:{r=0;t=f;break}case 3:case 1:{r=f;t=0;break}case 2:{r=f>>>1;t=(f+1|0)>>>1;break}default:{}}c[u>>2]=0;f=c[b+4>>2]|0;if(f>>>0<128){a[u>>0]=f;i=1;}else {do if(f>>>0>=2048)if(f>>>0<65536){a[u>>0]=f>>>12&15|-32;g=63;h=1;j=-128;k=2;i=3;break}else {a[u>>0]=f>>>18&255|-16;a[u+1>>0]=f>>>12&63|-128;g=63;h=2;j=-128;k=3;i=4;break}else {g=31;h=0;j=-64;k=1;i=2;}while(0);a[u+h>>0]=g&f>>>6&255|j;a[u+k>>0]=f&63|-128;}h=b+24|0;g=b+28|0;f=0;while(1){if(f>>>0>=r>>>0){s=47;break}if(f>>>0>4294967294){s=47;break}if(db[c[(c[g>>2]|0)+12>>2]&15](c[h>>2]|0,u,i)|0)break;else f=f+1|0;}b:do if((s|0)==47?!(db[c[(c[g>>2]|0)+12>>2]&15](c[h>>2]|0,d,m)|0):0){f=0;while(1){if(f>>>0>=t>>>0)break;if(f>>>0>4294967294)break;if(db[c[(c[g>>2]|0)+12>>2]&15](c[h>>2]|0,u,i)|0)break b;else f=f+1|0;}u=0;l=v;return u|0}while(0);u=1;l=v;return u|0}function ri(a,b,d){a=a|0;b=b|0;d=d|0;return db[c[(c[a+28>>2]|0)+12>>2]&15](c[a+24>>2]|0,b,d)|0}function si(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=l;l=l+32|0;e=d;f=c[a+24>>2]|0;a=c[a+28>>2]|0;c[e>>2]=c[b>>2];c[e+4>>2]=c[b+4>>2];c[e+8>>2]=c[b+8>>2];c[e+12>>2]=c[b+12>>2];c[e+16>>2]=c[b+16>>2];c[e+20>>2]=c[b+20>>2];b=ki(f,a,e)|0;l=d;return b|0}function ti(a){a=a|0;return (c[a>>2]&4|0)!=0|0}function ui(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;f=db[c[(c[d+28>>2]|0)+12>>2]&15](c[d+24>>2]|0,e,f)|0;c[b>>2]=d;a[b+4>>0]=f&1;a[b+5>>0]=0;return}function vi(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;e=db[c[(c[d+28>>2]|0)+12>>2]&15](c[d+24>>2]|0,e,f)|0;c[b>>2]=d;a[b+8>>0]=e&1;c[b+4>>2]=0;a[b+9>>0]=(f|0)==0&1;return}function wi(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=l;l=l+32|0;f=e;h=c[d+24>>2]|0;g=c[d+28>>2]|0;c[f>>2]=5084;c[f+4>>2]=1;c[f+8>>2]=0;c[f+16>>2]=15892;c[f+20>>2]=0;f=(ki(h,g,f)|0)&1;c[b>>2]=d;a[b+4>>0]=f;a[b+5>>0]=0;l=e;return}function xi(a,b){a=a|0;b=b|0;return lb[c[(c[a+28>>2]|0)+16>>2]&127](c[a+24>>2]|0,b)|0}function yi(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;t=e+24|0;r=e+28|0;if(lb[c[(c[r>>2]|0)+16>>2]&127](c[t>>2]|0,34)|0){w=1;return w|0}p=b+d|0;q=p;do if(d){e=b+1|0;f=e;j=a[b>>0]|0;if(j<<24>>24<=-1){k=j&31;if((d|0)==1){e=0;g=p;}else {g=b+2|0;f=g;e=a[e>>0]&63;}h=e&255;e=h|k<<6;if((j&255)>223){if((g|0)==(p|0)){e=0;i=p;}else {i=g+1|0;f=i;e=a[g>>0]&63;}g=e&255|h<<6;e=g|k<<12;if((j&255)>239){if((i|0)==(p|0))e=0;else {f=i+1|0;e=a[i>>0]&63;}e=g<<6|k<<18&1835008|e&255;if((e|0)==1114112){e=0;w=17;break}}}}else e=j&255;o=f;g=f+d|0;f=e;m=0;e=0;a:while(1){n=g-q|0;switch(f&2097151|0){case 9:{l=116;g=2;i=0;j=0;break}case 13:{l=114;g=2;i=0;j=0;break}case 10:{l=110;g=2;i=0;j=0;break}case 34:case 39:case 92:{l=f;g=2;i=0;j=0;break}default:if(pj(f)|0){l=f;g=1;i=0;j=0;}else {l=f;g=3;i=5;j=(Q(f|1|0)|0)>>>2^7;}}switch(g&3){case 2:case 0:{w=38;break}case 1:break;case 3:{switch(i&7){case 0:{h=0;break}case 1:{h=1;break}case 2:{h=2;break}case 3:{h=3;break}case 4:{h=4;break}case 5:{h=5;break}default:{w=36;break a}}if((h+j|0)!=1)w=38;break}default:{w=29;break a}}if((w|0)==38){w=0;if(m>>>0<e>>>0){w=45;break}if(!((e|0)==0|(e|0)==(d|0))){if(e>>>0>=d>>>0){w=45;break}if((a[b+e>>0]|0)<=-65){w=45;break}}if(!((m|0)==0|(m|0)==(d|0))){if(m>>>0>=d>>>0){w=45;break}if((a[b+m>>0]|0)<=-65){w=45;break}}if(db[c[(c[r>>2]|0)+12>>2]&15](c[t>>2]|0,b+e|0,m-e|0)|0){e=1;w=15;break}k=(l|0)==1114112;h=j;b:while(1){c:do switch(g&3){case 0:break b;case 1:{if(k)break b;else {e=l;g=0;}break}case 2:{e=92;g=1;break}case 3:switch(i&7){case 0:break b;case 1:{e=125;i=i&-256;break c}case 2:{e=l>>>(h<<2&28)&15;e=((e&255)<10?48:87)+e|0;if(!h){i=i&-256|1;break c}else {h=h+-1|0;break c}}case 3:{e=123;i=i&-256|2;break c}case 4:{e=117;i=i&-256|3;break c}case 5:{e=92;i=i&-256|4;break c}default:{w=56;break a}}default:{w=49;break a}}while(0);if(lb[c[(c[r>>2]|0)+16>>2]&127](c[t>>2]|0,e)|0){e=1;w=15;break a}}e=(f>>>0<128?1:f>>>0<2048?2:f>>>0<65536?3:4)+m|0;}f=o;if((f|0)==(p|0)){w=16;break}g=f+1|0;h=g;if(!o){w=16;break}j=a[f>>0]|0;if(j<<24>>24<=-1){k=j&31;if((g|0)==(p|0)){f=0;i=p;g=h;}else {m=f+2|0;f=a[g>>0]&63;i=m;g=m;}h=f&255;f=h|k<<6;if((j&255)>223){if((i|0)==(p|0)){f=0;i=p;}else {g=i+1|0;f=a[i>>0]&63;i=g;}h=f&255|h<<6;f=h|k<<12;if((j&255)>239){if((i|0)==(p|0))f=0;else {f=a[i>>0]&63;g=i+1|0;}f=h<<6|k<<18&1835008|f&255;if((f|0)==1114112){w=16;break}}}}else {g=h;f=j&255;}m=q-o+n+g|0;o=g;g=m;m=n;}if((w|0)==15)return e|0;else if((w|0)==16){if((e|0)==0|(e|0)==(d|0)){w=17;break}if(e>>>0>=d>>>0)Ii(b,d,e,d);f=b+e|0;if((a[f>>0]|0)>-65){u=e;v=r;s=f;break}Ii(b,d,e,d);}else if((w|0)!=29)if((w|0)!=36)if((w|0)==45)Ii(b,d,e,m);}else {e=0;w=17;}while(0);if((w|0)==17){u=e;v=r;s=b+e|0;}if(db[c[(c[v>>2]|0)+12>>2]&15](c[t>>2]|0,s,d-u|0)|0){w=1;return w|0}w=lb[c[(c[r>>2]|0)+16>>2]&127](c[t>>2]|0,34)|0;return w|0}function zi(a,b,c){a=a|0;b=b|0;c=c|0;return qi(c,a,b)|0}function Ai(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;h=b+24|0;g=b+28|0;if(lb[c[(c[g>>2]|0)+16>>2]&127](c[h>>2]|0,39)|0){h=1;return h|0}b=c[a>>2]|0;switch(b&2097151|0){case 9:{f=116;d=0;a=0;b=2;break}case 13:{f=114;d=0;a=0;b=2;break}case 10:{f=110;d=0;a=0;b=2;break}case 34:case 39:case 92:{f=b;d=0;a=0;b=2;break}default:if(pj(b)|0){f=b;d=0;a=0;b=1;}else {f=b;d=(Q(b|1|0)|0)>>>2^7;a=5;b=3;}}e=a;a:while(1){b:do switch(b&3){case 0:{a=22;break a}case 1:{a=f;b=0;break}case 2:{a=92;b=1;break}case 3:switch(e&7){case 0:{a=22;break a}case 1:{a=125;e=e&-256;break b}case 2:{a=f>>>(d<<2&28)&15;a=((a&255)<10?48:87)+a|0;if(!d){e=e&-256|1;break b}else {d=d+-1|0;break b}}case 3:{a=123;e=e&-256|2;break b}case 4:{a=117;e=e&-256|3;break b}case 5:{a=92;e=e&-256|4;break b}default:{a=19;break a}}default:{a=11;break a}}while(0);if(lb[c[(c[g>>2]|0)+16>>2]&127](c[h>>2]|0,a)|0){b=1;a=9;break}}if((a|0)==9)return b|0;else if((a|0)!=11)if((a|0)!=19)if((a|0)==22){h=lb[c[(c[g>>2]|0)+16>>2]&127](c[h>>2]|0,39)|0;return h|0}return 0}function Bi(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;k=l;l=l+16|0;j=k;if((c[d+8>>2]|0)!=1?(c[d+16>>2]|0)!=1:0){j=lb[c[(c[d+28>>2]|0)+16>>2]&127](c[d+24>>2]|0,c[b>>2]|0)|0;l=k;return j|0}e=c[b>>2]|0;c[j>>2]=0;if(e>>>0<128){a[j>>0]=e;b=1;}else {do if(e>>>0>=2048)if(e>>>0<65536){a[j>>0]=e>>>12&15|-32;f=63;g=1;h=-128;i=2;b=3;break}else {a[j>>0]=e>>>18&255|-16;a[j+1>>0]=e>>>12&63|-128;f=63;g=2;h=-128;i=3;b=4;break}else {f=31;g=0;h=-64;i=1;b=2;}while(0);a[j+g>>0]=f&e>>>6&255|h;a[j+i>>0]=e&63|-128;}j=qi(d,j,b)|0;l=k;return j|0}function Ci(d,e){d=d|0;e=e|0;var f=0,g=0,h=0,i=0;i=l;l=l+48|0;g=i;d=a[c[d>>2]>>0]|0;f=d&255;if((d&255)<=99)if((d&255)<10){d=38;h=4;}else {d=g+37|0;f=b[4156+(f<<1)>>1]|0;a[d>>0]=f;a[d+1>>0]=f>>8;d=37;}else {f=g+37|0;h=b[4156+(((d&255)%100|0)<<1&255)>>1]|0;a[f>>0]=h;a[f+1>>0]=h>>8;f=((d&255)/100|0)&255;d=36;h=4;}if((h|0)==4)a[g+d>>0]=(f&255)+48<<24>>24;h=oi(e,1,16465,0,g+d|0,39-d|0)|0;l=i;return h|0}function Di(a,b){a=a|0;b=b|0;return ai(c[a>>2]|0,b)|0}function Ei(a,b){a=a|0;b=b|0;return qi(b,c[a>>2]|0,c[a+4>>2]|0)|0}function Fi(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;g=l;l=l+16|0;f=g;Gi(f,b,d);e=c[f>>2]|0;f=c[f+4>>2]|0;if(0==0&(f&255|0)==2){c[a>>2]=0;c[a+4>>2]=b;c[a+8>>2]=d;l=g;return}else {c[a>>2]=1;d=a+4|0;c[d>>2]=e;c[d+4>>2]=f;l=g;return}}function Gi(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0;j=e>>>0>7?e+-7|0:0;a:do if(e|0){i=0;b:while(1){f=d+i|0;h=a[f>>0]|0;c:do if(h<<24>>24>=0){if((f&3|4|0)!=4){f=i+1|0;break}d:do if(i>>>0<j>>>0){f=i;do{i=d+f|0;if((c[i+4>>2]|c[i>>2])&-2139062144|0)break d;f=f+8|0;}while(f>>>0<j>>>0)}else f=i;while(0);if(f>>>0<e>>>0)do{if((a[d+f>>0]|0)<=-1)break c;f=f+1|0;}while(f>>>0<e>>>0)}else {switch(a[11498+(h&255)>>0]|0){case 2:{f=i+1|0;if(f>>>0>=e>>>0){f=12;break b}if((a[d+f>>0]&-64)<<24>>24!=-128){f=15;break b}break}case 3:{f=i+1|0;if(f>>>0>=e>>>0){f=16;break b}f=a[d+f>>0]|0;g=(f&255)<192;if(((!(h<<24>>24==-32&(f&-32)<<24>>24==-96)?(k=f<<24>>24<0,!(g&((h+31&255)<12&k))):0)?!((f&255)<160&(h<<24>>24==-19&k)):0)?!(g&((h&-2)<<24>>24==-18&k)):0){f=19;break b}f=i+2|0;if(f>>>0>=e>>>0){f=23;break b}if((a[d+f>>0]&-64)<<24>>24!=-128){f=25;break b}break}case 4:{f=i+1|0;if(f>>>0>=e>>>0){f=26;break b}f=a[d+f>>0]|0;if((!(h<<24>>24==-16&(f+112&255)<48)?(l=f<<24>>24<0,!((f&255)<192&((h+15&255)<3&l))):0)?!((f&255)<144&(h<<24>>24==-12&l)):0){f=29;break b}f=i+2|0;if(f>>>0>=e>>>0){f=32;break b}if((a[d+f>>0]&-64)<<24>>24!=-128){f=34;break b}f=i+3|0;if(f>>>0>=e>>>0){f=36;break b}if((a[d+f>>0]&-64)<<24>>24!=-128){f=38;break b}break}default:{f=10;break b}}f=f+1|0;}while(0);if(f>>>0<e>>>0)i=f;else break a}switch(f|0){case 10:{c[b>>2]=i;a[b+4>>0]=1;a[b+5>>0]=1;return}case 12:{c[b>>2]=i;a[b+4>>0]=0;return}case 15:{c[b>>2]=i;a[b+4>>0]=1;a[b+5>>0]=1;return}case 16:{c[b>>2]=i;a[b+4>>0]=0;return}case 19:{c[b>>2]=i;a[b+4>>0]=1;a[b+5>>0]=1;return}case 23:{c[b>>2]=i;a[b+4>>0]=0;return}case 25:{c[b>>2]=i;a[b+4>>0]=1;a[b+5>>0]=2;return}case 26:{c[b>>2]=i;a[b+4>>0]=0;return}case 29:{c[b>>2]=i;a[b+4>>0]=1;a[b+5>>0]=1;return}case 32:{c[b>>2]=i;a[b+4>>0]=0;return}case 34:{c[b>>2]=i;a[b+4>>0]=1;a[b+5>>0]=2;return}case 36:{c[b>>2]=i;a[b+4>>0]=0;return}case 38:{c[b>>2]=i;a[b+4>>0]=1;a[b+5>>0]=3;return}}}while(0);a[b+4>>0]=2;return}function Hi(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0;d=c[b>>2]|0;h=c[b+4>>2]|0;if((d|0)==(h|0)){j=1114112;return j|0}e=d+1|0;c[b>>2]=e;i=a[d>>0]|0;if(i<<24>>24>-1){j=i&255;return j|0}j=i&31;if((e|0)==(h|0)){d=0;e=h;}else {g=d+2|0;c[b>>2]=g;d=a[e>>0]&63;e=g;}f=d&255;if((i&255)<=223){j=f|j<<6;return j|0}if((e|0)==(h|0)){d=0;g=h;}else {g=e+1|0;c[b>>2]=g;d=a[e>>0]&63;}e=d&255|f<<6;if((i&255)<=239){j=e|j<<12;return j|0}if((g|0)==(h|0))d=0;else {c[b>>2]=g+1;d=a[g>>0]&63;}j=e<<6|j<<18&1835008|d&255;return j|0}function Ii(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;j=l;l=l+112|0;p=j+64|0;q=j+40|0;r=j+32|0;s=j+28|0;t=j+24|0;u=j+8|0;n=j;i=j+20|0;j=j+16|0;c[j>>2]=e;c[i>>2]=f;a:do if(d>>>0<257){g=d;h=0;}else {g=256;while(1){if(g>>>0<d>>>0?(a[b+g>>0]|0)>-65:0){h=1;break a}g=g+-1|0;if((g|0)==0|(g|0)==(d|0)){h=1;break}}}while(0);c[n>>2]=b;c[n+4>>2]=g;c[u>>2]=h?11754:16465;c[u+4>>2]=h?5:0;g=e>>>0>d>>>0;if(g|f>>>0>d>>>0){c[r>>2]=g?e:f;c[p>>2]=r;c[p+4>>2]=39;c[p+8>>2]=n;c[p+12>>2]=64;c[p+16>>2]=u;c[p+20>>2]=64;c[q>>2]=4436;c[q+4>>2]=3;c[q+8>>2]=4460;c[q+12>>2]=3;c[q+16>>2]=p;c[q+20>>2]=3;aj(q,4568);}if(e>>>0>f>>>0){c[p>>2]=j;c[p+4>>2]=39;c[p+8>>2]=i;c[p+12>>2]=39;c[p+16>>2]=n;c[p+20>>2]=64;c[p+24>>2]=u;c[p+28>>2]=64;c[q>>2]=4584;c[q+4>>2]=4;c[q+8>>2]=4616;c[q+12>>2]=4;c[q+16>>2]=p;c[q+20>>2]=4;aj(q,4760);}if(!((e|0)==0|(e|0)==(d|0))){if(e>>>0<d>>>0?(a[b+e>>0]|0)>-65:0)k=12;}else k=12;if((k|0)==12)e=f;c[t>>2]=e;g=(e|0)==0;b:do if(g|(e|0)==(d|0)){k=e;e=g;}else while(1){if(e>>>0<d>>>0?(a[b+e>>0]|0)>-65:0){k=e;e=0;break b}e=e+-1|0;g=(e|0)==0;if(g|(e|0)==(d|0)){k=e;e=g;break}}while(0);if(!(e|(k|0)==(d|0))){if(k>>>0>=d>>>0)Ii(b,d,k,d);e=b+k|0;if((a[e>>0]|0)>-65)m=e;else Ii(b,d,k,d);}else m=b+k|0;f=b+k+(d-k)|0;d=(m|0)==(f|0);g=d?m:b+k+1|0;if(d)$i(4776);i=a[m>>0]|0;if(i<<24>>24<=-1){j=i&31;if((g|0)==(f|0)){e=0;h=f;}else {e=a[g>>0]&63;h=g+1|0;}g=e&255;e=g|j<<6;if((i&255)>223){if((h|0)==(f|0)){e=0;h=f;}else {e=a[h>>0]&63;h=h+1|0;}g=e&255|g<<6;e=g|j<<12;if((i&255)>239){if((h|0)==(f|0))e=0;else e=a[h>>0]&63;e=g<<6|j<<18&1835008|e&255;if((e|0)==1114112)$i(4776);else o=e;}else o=e;}else o=e;}else o=i&255;c[s>>2]=o;c[r>>2]=k;c[r+4>>2]=(o>>>0<128?1:o>>>0<2048?2:o>>>0<65536?3:4)+k;c[p>>2]=t;c[p+4>>2]=39;c[p+8>>2]=s;c[p+12>>2]=65;c[p+16>>2]=r;c[p+20>>2]=66;c[p+24>>2]=n;c[p+28>>2]=64;c[p+32>>2]=u;c[p+36>>2]=64;c[q>>2]=4800;c[q+4>>2]=5;c[q+8>>2]=4840;c[q+12>>2]=5;c[q+16>>2]=p;c[q+20>>2]=5;aj(q,5020);}function Ji(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;v=l;l=l+48|0;s=v+32|0;t=v;c[s>>2]=0;if(f>>>0<128){a[s>>0]=f;g=1;}else {k=f>>>0<2048;do if(!k)if(f>>>0<65536){a[s>>0]=f>>>12&15|-32;g=63;h=1;i=-128;j=2;break}else {a[s>>0]=f>>>18&255|-16;a[s+1>>0]=f>>>12&63|-128;g=63;h=2;i=-128;j=3;break}else {g=31;h=0;i=-64;j=1;}while(0);a[s+h>>0]=g&f>>>6&255|i;a[s+j>>0]=f&63|-128;g=k?2:f>>>0<65536?3:4;}o=c[s>>2]|0;c[t>>2]=d;p=t+4|0;c[p>>2]=e;q=t+8|0;c[q>>2]=0;r=t+12|0;c[r>>2]=e;c[t+16>>2]=f;m=t+20|0;c[m>>2]=g;n=t+24|0;c[n>>2]=o;o=s+4|0;_i(s,a[g+-1+(t+24)>>0]|0,d,e);do if((c[s>>2]|0)==1){h=0;j=0;while(1){d=(c[o>>2]|0)+1+h|0;c[q>>2]=d;if(d>>>0>=g>>>0){f=d-g|0;i=c[p>>2]|0;e=d>>>0<f>>>0|i>>>0<d>>>0;h=(c[t>>2]|0)+f|0;k=e?j:g;if(!e){if(g>>>0>4){h=14;break}if((k|0)==(g|0)){if((h|0)==(n|0)){h=23;break}if(!(Xj(h,n,g)|0)){h=23;break}else j=g;}else j=g;}}else i=c[p>>2]|0;h=c[r>>2]|0;if(h>>>0<d>>>0|i>>>0<h>>>0){g=0;h=24;break}_i(s,a[g+-1+(t+24)>>0]|0,(c[t>>2]|0)+d|0,h-d|0);if((c[s>>2]|0)!=1){h=21;break}h=c[q>>2]|0;g=c[m>>2]|0;}if((h|0)==14)kj(g,4);else if((h|0)==21){u=c[r>>2]|0;break}else if((h|0)==23){c[b+4>>2]=f;u=1;c[b>>2]=u;l=v;return}else if((h|0)==24){c[b>>2]=g;l=v;return}}else u=e;while(0);c[q>>2]=u;u=0;c[b>>2]=u;l=v;return}function Ki(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;g=l;l=l+16|0;i=g+8|0;f=g;h=db[c[(c[d+28>>2]|0)+12>>2]&15](c[d+24>>2]|0,11985,9)|0;c[f>>2]=d;e=f+4|0;a[e>>0]=h&1;h=f+5|0;a[h>>0]=0;c[i>>2]=b;Qi(f,11994,11,i,5036)|0;c[i>>2]=b+4;Qi(f,12005,9,i,5052)|0;d=a[e>>0]|0;if(!(a[h>>0]|0)){i=d;i=i<<24>>24!=0;l=g;return i|0}if(!(d<<24>>24)){d=c[f>>2]|0;d=(db[c[(c[d+28>>2]|0)+12>>2]&15](c[d+24>>2]|0,c[d>>2]&4|0?12053:12055,2)|0)&1;}else d=1;a[e>>0]=d;i=d;i=i<<24>>24!=0;l=g;return i|0}function Li(a){a=a|0;return}function Mi(a){a=a|0;return}function Ni(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,z=0,A=0,B=0;switch(g|0){case 0:{c[b+48>>2]=d;c[b+52>>2]=e;c[b+56>>2]=f;c[b+60>>2]=0;c[b>>2]=0;c[b+4>>2]=0;c[b+8>>2]=e;a[b+12>>0]=1;a[b+13>>0]=1;return}case 1:{s=0;t=0;u=1;v=1;break}default:{p=0;h=1;x=3;}}a:do if((x|0)==3){b:while(1){x=0;j=1;c:while(1){n=h;o=0;m=h;while(1){n=a[f+n>>0]|0;h=o+p|0;if(h>>>0>=g>>>0){x=6;break b}h=a[f+h>>0]|0;if((n&255)<(h&255))break;if(n<<24>>24!=h<<24>>24)break c;n=o+1|0;w=(n|0)==(j|0);h=w?0:n;m=(w?n:0)+m|0;n=m+h|0;if(n>>>0>=g>>>0){q=p;r=j;break b}else o=h;}h=m+1+o|0;j=h-p|0;if(h>>>0>=g>>>0){q=p;r=j;break b}}h=m+1|0;if(h>>>0>=g>>>0){q=m;r=1;break}else {p=m;x=3;}}if((x|0)==6)bj(5068,h,g);h=1;p=0;d:while(1){j=1;e:while(1){n=h;o=0;m=h;while(1){n=a[f+n>>0]|0;h=o+p|0;if(h>>>0>=g>>>0)break d;h=a[f+h>>0]|0;if((n&255)>(h&255))break;if(n<<24>>24!=h<<24>>24)break e;n=o+1|0;w=(n|0)==(j|0);h=w?0:n;m=(w?n:0)+m|0;n=m+h|0;if(n>>>0>=g>>>0){s=q;t=p;u=r;v=j;break a}else o=h;}h=m+1+o|0;j=h-p|0;if(h>>>0>=g>>>0){s=q;t=p;u=r;v=j;break a}}h=m+1|0;if(h>>>0>=g>>>0){s=q;t=m;u=r;v=1;break a}else p=m;}bj(5068,h,g);}while(0);r=s>>>0>t>>>0;w=r?s:t;t=r?u:v;if(w>>>0>g>>>0)kj(w,g);h=t+w|0;if(h>>>0<t>>>0)lj(t,h);if(h>>>0>g>>>0)kj(h,g);s=f+t|0;if((s|0)!=(f|0)?(Xj(f,s,w)|0)!=0:0){m=g-w|0;n=m>>>0>=w>>>0;h=f+g|0;j=f;k=0;i=0;do{B=nk(1,0,a[j>>0]&63|0)|0;j=j+1|0;k=B|k;i=y|i;}while((j|0)!=(h|0));l=w;z=(n?m:w)+1|0;A=-1;B=-1;}else x=30;do if((x|0)==30){r=g+-1|0;h=1;o=0;p=1;m=0;while(1){if((p+o|0)>>>0>=g>>>0){x=40;break}j=g-o+~p|0;if(j>>>0>=g>>>0){x=33;break}n=a[f+j>>0]|0;j=r-o-m|0;if(j>>>0>=g>>>0){x=35;break}j=a[f+j>>0]|0;if((n&255)<(j&255)){n=o+1+p|0;h=n-m|0;j=0;}else {x=n<<24>>24==j<<24>>24;n=o+1|0;v=(n|0)==(h|0);h=x?h:1;j=x?(v?0:n):0;n=(x?(v?n:0):1)+p|0;m=x?m:p;}if((h|0)==(t|0)){x=40;break}else {o=j;p=n;}}if((x|0)==33)bj(5068,j,g);else if((x|0)==35)bj(5068,j,g);else if((x|0)==40){p=0;q=1;h=0;o=1;while(1){if((q+p|0)>>>0>=g>>>0){x=50;break}j=g-p+~q|0;if(j>>>0>=g>>>0){x=43;break}n=a[f+j>>0]|0;j=r-p-h|0;if(j>>>0>=g>>>0){x=45;break}j=a[f+j>>0]|0;if((n&255)>(j&255)){o=p+1+q|0;n=o-h|0;j=0;}else {x=n<<24>>24==j<<24>>24;v=p+1|0;u=(v|0)==(o|0);n=x?o:1;j=x?(u?0:v):0;o=(x?(u?v:0):1)+q|0;h=x?h:q;}if((n|0)==(t|0)){x=50;break}else {p=j;q=o;o=n;}}if((x|0)==43)bj(5068,j,g);else if((x|0)==45)bj(5068,j,g);else if((x|0)==50){l=g-(h>>>0>=m>>>0?h:m)|0;if(t>>>0>g>>>0)kj(t,g);if(!t){k=0;i=0;z=0;A=0;B=g;break}j=f;h=0;i=0;do{B=nk(1,0,a[j>>0]&63|0)|0;j=j+1|0;h=B|h;i=y|i;}while((j|0)!=(s|0));k=h;z=t;A=0;B=g;}}}while(0);c[b+48>>2]=d;c[b+52>>2]=e;c[b+56>>2]=f;c[b+60>>2]=g;c[b>>2]=1;g=b+8|0;c[g>>2]=k;c[g+4>>2]=i;c[b+16>>2]=w;c[b+20>>2]=l;c[b+24>>2]=z;c[b+28>>2]=0;c[b+32>>2]=e;c[b+36>>2]=A;c[b+40>>2]=B;return}function Oi(a){a=a|0;return}function Pi(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0;o=l;l=l+16|0;j=o;if(!e){n=0;l=o;return n|0}k=b+8|0;m=j+4|0;n=b+4|0;h=e;while(1){if(a[k>>0]|0?db[c[(c[n>>2]|0)+12>>2]&15](c[b>>2]|0,12048,4)|0:0){d=1;e=5;break}Ji(j,d,h,10);if((c[j>>2]|0)==1){i=c[m>>2]|0;a[k>>0]=1;i=i+1|0;}else {a[k>>0]=0;i=h;}e=c[b>>2]|0;f=c[n>>2]|0;g=(i|0)==0|(h|0)==(i|0);if(!g){if(h>>>0<=i>>>0){e=12;break}if((a[d+i>>0]|0)<=-65){e=12;break}}if(db[c[f+12>>2]&15](e,d,i)|0){d=1;e=5;break}if(!g){if(h>>>0<=i>>>0){e=18;break}e=d+i|0;if((a[e>>0]|0)>-65)d=e;else {e=18;break}}else d=d+i|0;e=h-i|0;if(!e){d=0;e=5;break}else h=e;}if((e|0)==5){l=o;return d|0}else if((e|0)==12)Ii(d,h,0,i);else if((e|0)==18)Ii(d,h,i,h);return 0}function Qi(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;q=l;l=l+96|0;n=q+32|0;o=q+16|0;i=q;p=q+8|0;c[p>>2]=d;j=p+4|0;c[j>>2]=e;k=b+4|0;if(a[k>>0]|0){o=1;p=b+5|0;o=o&1;a[k>>0]=o;a[p>>0]=1;l=q;return b|0}m=b+5|0;h=(a[m>>0]|0)!=0;e=h?3572:12062;h=h?1:2;c[i>>2]=e;c[i+4>>2]=h;d=c[b>>2]|0;do if(!(c[d>>2]&4)){c[o>>2]=i;c[o+4>>2]=64;c[o+8>>2]=p;c[o+12>>2]=64;j=c[d+24>>2]|0;p=c[d+28>>2]|0;c[n>>2]=5116;c[n+4>>2]=3;c[n+8>>2]=5264;c[n+12>>2]=2;c[n+16>>2]=o;c[n+20>>2]=2;if(ki(j,p,n)|0)e=8;else {d=lb[c[g+12>>2]&127](f,c[b>>2]|0)|0;e=13;}}else {z=c[d+28>>2]|0;c[o>>2]=c[d+24>>2];c[o+4>>2]=z;a[o+8>>0]=0;z=c[d+4>>2]|0;y=a[d+48>>0]|0;w=d+8|0;x=c[w>>2]|0;w=c[w+4>>2]|0;u=d+16|0;v=c[u>>2]|0;u=c[u+4>>2]|0;t=c[d+32>>2]|0;s=c[d+36>>2]|0;r=c[d+40>>2]|0;i=c[d+44>>2]|0;c[n>>2]=c[d>>2];c[n+4>>2]=z;a[n+48>>0]=y;d=n+8|0;c[d>>2]=x;c[d+4>>2]=w;d=n+16|0;c[d>>2]=v;c[d+4>>2]=u;c[n+24>>2]=o;c[n+28>>2]=4356;c[n+32>>2]=t;c[n+36>>2]=s;c[n+40>>2]=r;c[n+44>>2]=i;d=c[1092]|0;if(((!(db[d&15](o,e,h)|0)?!(db[d&15](o,12052,1)|0):0)?!(db[d&15](o,c[p>>2]|0,c[j>>2]|0)|0):0)?!(db[d&15](o,12064,2)|0):0){d=lb[c[g+12>>2]&127](f,n)|0;e=13;break}e=8;}while(0);if((e|0)==8){y=1;z=m;y=y&1;a[k>>0]=y;a[z>>0]=1;l=q;return b|0}else if((e|0)==13){y=d;z=m;y=y&1;a[k>>0]=y;a[z>>0]=1;l=q;return b|0}return 0}function Ri(b){b=b|0;var d=0,e=0;e=b+4|0;d=a[e>>0]|0;if(!(a[b+5>>0]|0)){e=d;e=e<<24>>24!=0;return e|0}if(!(d<<24>>24)){b=c[b>>2]|0;b=(db[c[(c[b+28>>2]|0)+12>>2]&15](c[b+24>>2]|0,c[b>>2]&4|0?12053:12055,2)|0)&1;}else b=1;a[e>>0]=b;e=b;e=e<<24>>24!=0;return e|0}function Si(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;o=l;l=l+64|0;j=o+12|0;k=o;m=b+8|0;n=b+4|0;do if(!(a[m>>0]|0)){g=(c[n>>2]|0)!=0;i=g?3572:3564;f=g?3580:16465;g=g&1;h=c[b>>2]|0;if(!(c[h>>2]&4)){if(db[c[(c[h+28>>2]|0)+12>>2]&15](c[h+24>>2]|0,i,1)|0){f=1;break}k=c[b>>2]|0;if(db[c[(c[k+28>>2]|0)+12>>2]&15](c[k+24>>2]|0,f,g)|0){f=1;break}f=lb[c[e+12>>2]&127](d,c[b>>2]|0)|0;break}w=c[h+28>>2]|0;c[k>>2]=c[h+24>>2];c[k+4>>2]=w;a[k+8>>0]=0;w=c[h+4>>2]|0;v=a[h+48>>0]|0;t=h+8|0;u=c[t>>2]|0;t=c[t+4>>2]|0;r=h+16|0;s=c[r>>2]|0;r=c[r+4>>2]|0;q=c[h+32>>2]|0;p=c[h+36>>2]|0;g=c[h+40>>2]|0;f=c[h+44>>2]|0;c[j>>2]=c[h>>2];c[j+4>>2]=w;a[j+48>>0]=v;h=j+8|0;c[h>>2]=u;c[h+4>>2]=t;h=j+16|0;c[h>>2]=s;c[h+4>>2]=r;c[j+24>>2]=k;c[j+28>>2]=4356;c[j+32>>2]=q;c[j+36>>2]=p;c[j+40>>2]=g;c[j+44>>2]=f;f=c[1092]|0;if(!(db[f&15](k,i,1)|0)?!(db[f&15](k,12052,1)|0):0){f=lb[c[e+12>>2]&127](d,j)|0;break}f=1;}else f=1;while(0);a[m>>0]=f&1;c[n>>2]=(c[n>>2]|0)+1;l=o;return b|0}function Ti(b){b=b|0;var d=0,e=0,f=0,g=0;f=b+4|0;d=c[f>>2]|0;g=b+8|0;e=a[g>>0]|0;if(!d){g=e;g=g<<24>>24!=0;return g|0}do if(!(e<<24>>24)){e=c[b>>2]|0;if(c[e>>2]&4){if(db[c[(c[e+28>>2]|0)+12>>2]&15](c[e+24>>2]|0,12052,1)|0){d=1;break}d=c[f>>2]|0;}if(((d|0)==1?a[b+9>>0]|0:0)?(f=c[b>>2]|0,db[c[(c[f+28>>2]|0)+12>>2]&15](c[f+24>>2]|0,3572,1)|0):0){d=1;break}d=c[b>>2]|0;d=(db[c[(c[d+28>>2]|0)+12>>2]&15](c[d+24>>2]|0,12057,1)|0)&1;}else d=1;while(0);a[g>>0]=d;g=d;g=g<<24>>24!=0;return g|0}function Ui(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;j=l;l=l+64|0;g=j+12|0;h=j;i=b+4|0;if(a[i>>0]|0){d=1;e=b+5|0;d=d&1;a[i>>0]=d;a[e>>0]=1;l=j;return}f=c[b>>2]|0;if(c[f>>2]&4|0){u=c[f+28>>2]|0;c[h>>2]=c[f+24>>2];c[h+4>>2]=u;a[h+8>>0]=0;u=c[f+4>>2]|0;t=a[f+48>>0]|0;r=f+8|0;s=c[r>>2]|0;r=c[r+4>>2]|0;p=f+16|0;q=c[p>>2]|0;p=c[p+4>>2]|0;o=c[f+32>>2]|0;n=c[f+36>>2]|0;m=c[f+40>>2]|0;k=c[f+44>>2]|0;c[g>>2]=c[f>>2];c[g+4>>2]=u;a[g+48>>0]=t;f=g+8|0;c[f>>2]=s;c[f+4>>2]=r;f=g+16|0;c[f>>2]=q;c[f+4>>2]=p;c[g+24>>2]=h;c[g+28>>2]=4356;c[g+32>>2]=o;c[g+36>>2]=n;c[g+40>>2]=m;c[g+44>>2]=k;f=b+5|0;b=(a[f>>0]|0)!=0;if(db[c[4368>>2]&15](h,b?12058:12052,b?2:1)|0){t=1;u=f;t=t&1;a[i>>0]=t;a[u>>0]=1;l=j;return}else {t=lb[c[e+12>>2]&127](d,g)|0;u=f;t=t&1;a[i>>0]=t;a[u>>0]=1;l=j;return}}g=b+5|0;do if(a[g>>0]|0)if(db[c[(c[f+28>>2]|0)+12>>2]&15](c[f+24>>2]|0,12060,2)|0){t=1;u=g;t=t&1;a[i>>0]=t;a[u>>0]=1;l=j;return}else {f=c[b>>2]|0;break}while(0);t=lb[c[e+12>>2]&127](d,f)|0;u=g;t=t&1;a[i>>0]=t;a[u>>0]=1;l=j;return}function Vi(a,b,c){a=a|0;b=b|0;c=c|0;Ui(a,b,c);return a|0}function Wi(b){b=b|0;var d=0,e=0,f=0;d=c[b>>2]|0;if((c[d>>2]&4|0)!=0?(a[b+5>>0]|0)!=0:0)e=1;else e=0;f=b+4|0;if(a[f>>0]|0){a[f>>0]=1;f=1;return f|0}e=db[c[(c[d+28>>2]|0)+12>>2]&15](c[d+24>>2]|0,e?12052:16465,e&1)|0;a[f>>0]=e&1;if(e){f=1;return f|0}f=c[b>>2]|0;f=db[c[(c[f+28>>2]|0)+12>>2]&15](c[f+24>>2]|0,3592,1)|0;return f|0}function Xi(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;k=l;l=l+16|0;j=k;c[j>>2]=0;if(d>>>0<128){a[j>>0]=d;e=1;}else {do if(d>>>0>=2048)if(d>>>0<65536){a[j>>0]=d>>>12&15|-32;f=63;g=1;h=-128;i=2;e=3;break}else {a[j>>0]=d>>>18&255|-16;a[j+1>>0]=d>>>12&63|-128;f=63;g=2;h=-128;i=3;e=4;break}else {f=31;g=0;h=-64;i=1;e=2;}while(0);a[j+g>>0]=f&d>>>6&255|h;a[j+i>>0]=d&63|-128;}j=Pi(b,j,e)|0;l=k;return j|0}function Yi(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=l;l=l+32|0;e=d+8|0;f=d;c[f>>2]=a;c[e>>2]=c[b>>2];c[e+4>>2]=c[b+4>>2];c[e+8>>2]=c[b+8>>2];c[e+12>>2]=c[b+12>>2];c[e+16>>2]=c[b+16>>2];c[e+20>>2]=c[b+20>>2];b=ki(f,5092,e)|0;l=d;return b|0}function Zi(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=l;l=l+48|0;e=d+16|0;f=d;c[f>>2]=a;c[f+4>>2]=67;c[f+8>>2]=a+4;c[f+12>>2]=67;a=c[b+24>>2]|0;b=c[b+28>>2]|0;c[e>>2]=5140;c[e+4>>2]=2;c[e+8>>2]=5264;c[e+12>>2]=2;c[e+16>>2]=f;c[e+20>>2]=2;b=ki(a,b,e)|0;l=d;return b|0}function _i(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;k=e&3;g=4-k|0;a:do if((k|0)==0|(g|0)==0)g=0;else {j=g>>>0<=f>>>0?g:f;k=e+j|0;i=k;h=e;g=0;while(1){if((i-h|0)>>>0<=3){m=8;break}o=(a[h>>0]|0)==d<<24>>24;g=((o^1)&1)+g|0;if(o)break;o=(a[h+1>>0]|0)==d<<24>>24;g=((o^1)&1)+g|0;if(o)break;o=(a[h+2>>0]|0)==d<<24>>24;g=((o^1)&1)+g|0;if(o)break;o=(a[h+3>>0]|0)==d<<24>>24;g=((o^1)&1)+g|0;if(o)break;else h=h+4|0;}if((m|0)==8)while(1){if((h|0)==(k|0)){g=j;break a}o=(a[h>>0]|0)==d<<24>>24;g=((o^1)&1)+g|0;if(o)break;else {h=h+1|0;m=8;}}c[b>>2]=1;c[b+4>>2]=g;return}while(0);h=d&255;h=h<<8|h;h=h<<16|h;if(f>>>0>7?(l=f+-8|0,g>>>0<=l>>>0):0){do{o=c[e+g>>2]^h;m=c[e+(g+4)>>2]^h;if((m&-2139062144^-2139062144)&m+-16843009|(o&-2139062144^-2139062144)&o+-16843009|0)break;g=g+8|0;}while(g>>>0<=l>>>0);if(g>>>0>f>>>0)lj(g,f);else n=g;}else n=g;h=e+n|0;j=h+(f-n)|0;i=j;g=0;while(1){if((i-h|0)>>>0<=3){m=24;break}o=(a[h>>0]|0)==d<<24>>24;g=((o^1)&1)+g|0;if(o){m=26;break}o=(a[h+1>>0]|0)==d<<24>>24;g=((o^1)&1)+g|0;if(o){m=26;break}o=(a[h+2>>0]|0)==d<<24>>24;g=((o^1)&1)+g|0;if(o){m=26;break}o=(a[h+3>>0]|0)==d<<24>>24;g=((o^1)&1)+g|0;if(o){m=26;break}else h=h+4|0;}b:do if((m|0)==24)while(1){m=0;if((h|0)==(j|0)){g=0;break b}o=(a[h>>0]|0)==d<<24>>24;g=((o^1)&1)+g|0;if(o){m=26;break}else {h=h+1|0;m=24;}}while(0);if((m|0)==26){c[b+4>>2]=g+n;g=1;}c[b>>2]=g;return}function $i(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0;d=l;l=l+48|0;b=d+32|0;i=d+24|0;j=c[a+4>>2]|0;h=c[a+8>>2]|0;g=c[a+12>>2]|0;f=c[a+16>>2]|0;e=c[a+20>>2]|0;c[i>>2]=c[a>>2];c[i+4>>2]=j;c[d>>2]=i;c[d+4>>2]=1;c[d+8>>2]=0;c[d+16>>2]=15892;c[d+20>>2]=0;c[b>>2]=h;c[b+4>>2]=g;c[b+8>>2]=f;c[b+12>>2]=e;aj(d,b);}function aj(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0;h=l;l=l+64|0;e=h+56|0;f=h+32|0;g=h;h=h+8|0;j=c[b>>2]|0;i=c[b+4>>2]|0;d=c[b+8>>2]|0;b=c[b+12>>2]|0;c[h>>2]=c[a>>2];c[h+4>>2]=c[a+4>>2];c[h+8>>2]=c[a+8>>2];c[h+12>>2]=c[a+12>>2];c[h+16>>2]=c[a+16>>2];c[h+20>>2]=c[a+20>>2];c[g>>2]=j;c[g+4>>2]=i;c[f>>2]=c[h>>2];c[f+4>>2]=c[h+4>>2];c[f+8>>2]=c[h+8>>2];c[f+12>>2]=c[h+12>>2];c[f+16>>2]=c[h+16>>2];c[f+20>>2]=c[h+20>>2];c[e>>2]=c[g>>2];c[e+4>>2]=c[g+4>>2];Pe(f,e,d,b);}function bj(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;g=l;l=l+48|0;f=g+32|0;e=g+8|0;h=g+4|0;c[g>>2]=b;c[h>>2]=d;c[f>>2]=h;c[f+4>>2]=39;c[f+8>>2]=g;c[f+12>>2]=39;c[e>>2]=5156;c[e+4>>2]=2;c[e+8>>2]=5264;c[e+12>>2]=2;c[e+16>>2]=f;c[e+20>>2]=2;aj(e,a);}function cj(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;f=l;l=l+48|0;e=f+32|0;d=f+8|0;c[f>>2]=a;c[f+4>>2]=b;c[e>>2]=f;c[e+4>>2]=64;c[d>>2]=5172;c[d+4>>2]=1;c[d+8>>2]=5180;c[d+12>>2]=1;c[d+16>>2]=e;c[d+20>>2]=1;aj(d,5216);}function dj(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;j=l;l=l+16|0;e=j+12|0;i=j;b=c[b>>2]|0;if((a[b>>0]|0)!=1){i=db[c[(c[d+28>>2]|0)+12>>2]&15](c[d+24>>2]|0,12149,4)|0;l=j;return i|0}f=db[c[(c[d+28>>2]|0)+12>>2]&15](c[d+24>>2]|0,12153,4)|0;c[i>>2]=d;h=i+8|0;a[h>>0]=f&1;f=i+4|0;c[f>>2]=0;g=i+9|0;a[g>>0]=0;c[e>>2]=b+1;Si(i,e,5232)|0;d=c[f>>2]|0;b=a[h>>0]|0;if(d){do if(!(b<<24>>24)){b=c[i>>2]|0;if(!(c[b>>2]&4))b=d;else {if(db[c[(c[b+28>>2]|0)+12>>2]&15](c[b+24>>2]|0,12052,1)|0){b=1;break}b=c[f>>2]|0;}if(!((b|0)!=1|(a[g>>0]|0)==0)?(g=c[i>>2]|0,db[c[(c[g+28>>2]|0)+12>>2]&15](c[g+24>>2]|0,3572,1)|0):0){b=1;break}b=c[i>>2]|0;b=(db[c[(c[b+28>>2]|0)+12>>2]&15](c[b+24>>2]|0,12057,1)|0)&1;}else b=1;while(0);a[h>>0]=b;}i=b<<24>>24!=0;l=j;return i|0}function ej(a){a=a|0;return}function fj(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0;if(!f){a[b>>0]=1;a[b+1>>0]=0;return}i=(a[e>>0]|0)==43;g=i?e+1|0:e;e=(i<<31>>31)+f|0;if(!e){a[b>>0]=1;a[b+1>>0]=0;return}h=g+e|0;i=0;while(1){e=d[g>>0]|0;g=g+1|0;if((e+-48|0)>>>0>=10)if((e+-97|0)>>>0>=26)if((e+-65|0)>>>0<26)f=-55;else {e=10;break}else f=-87;else f=-48;f=f+e|0;if(f>>>0>=10){e=10;break}e=i*10|0;if(i>>>0>429496729){e=12;break}i=e+f|0;if(i>>>0<e>>>0){e=14;break}if((g|0)==(h|0)){e=16;break}}if((e|0)==10){a[b>>0]=1;a[b+1>>0]=1;return}else if((e|0)==12){a[b>>0]=1;a[b+1>>0]=2;return}else if((e|0)==14){a[b>>0]=1;a[b+1>>0]=2;return}else if((e|0)==16){a[b>>0]=0;c[b+4>>2]=i;return}}function gj(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;g=l;l=l+16|0;i=g+8|0;f=g;h=db[c[(c[d+28>>2]|0)+12>>2]&15](c[d+24>>2]|0,12157,13)|0;c[f>>2]=d;e=f+4|0;a[e>>0]=h&1;h=f+5|0;a[h>>0]=0;c[i>>2]=b;Qi(f,12170,4,i,5248)|0;d=a[e>>0]|0;if(!(a[h>>0]|0)){i=d;i=i<<24>>24!=0;l=g;return i|0}if(!(d<<24>>24)){d=c[f>>2]|0;d=(db[c[(c[d+28>>2]|0)+12>>2]&15](c[d+24>>2]|0,c[d>>2]&4|0?12053:12055,2)|0)&1;}else d=1;a[e>>0]=d;i=d;i=i<<24>>24!=0;l=g;return i|0}function hj(a){a=a|0;return}function ij(b,d){b=b|0;d=d|0;switch(a[c[b>>2]>>0]&3){case 0:{d=db[c[(c[d+28>>2]|0)+12>>2]&15](c[d+24>>2]|0,12174,5)|0;return d|0}case 1:{d=db[c[(c[d+28>>2]|0)+12>>2]&15](c[d+24>>2]|0,12179,12)|0;return d|0}case 2:{d=db[c[(c[d+28>>2]|0)+12>>2]&15](c[d+24>>2]|0,12191,8)|0;return d|0}case 3:{d=db[c[(c[d+28>>2]|0)+12>>2]&15](c[d+24>>2]|0,12199,9)|0;return d|0}default:{}}return 0}function jj(b){b=b|0;var d=0,e=0,f=0,g=0;a:do switch(c[b>>2]&3){case 0:{d=1114112;break}case 1:{d=c[b+4>>2]|0;c[b>>2]=0;break}case 2:{c[b>>2]=1;d=92;break}case 3:{g=b+12|0;switch(a[g>>0]&7){case 0:{d=1114112;break a}case 1:{a[g>>0]=0;d=125;break a}case 2:{f=b+8|0;e=c[f>>2]|0;d=(c[b+4>>2]|0)>>>(e<<2&28)&15;d=((d&255)<10?48:87)+d|0;if(!e){a[g>>0]=1;break a}else {c[f>>2]=e+-1;break a}}case 3:{a[g>>0]=2;d=123;break a}case 4:{a[g>>0]=3;d=117;break a}case 5:{a[g>>0]=4;d=92;break a}default:{}}break}default:{}}while(0);return d|0}function kj(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;g=l;l=l+48|0;e=g+32|0;d=g+8|0;f=g+4|0;c[g>>2]=a;c[f>>2]=b;c[e>>2]=g;c[e+4>>2]=39;c[e+8>>2]=f;c[e+12>>2]=39;c[d>>2]=5336;c[d+4>>2]=2;c[d+8>>2]=5264;c[d+12>>2]=2;c[d+16>>2]=e;c[d+20>>2]=2;aj(d,5352);}function lj(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;g=l;l=l+48|0;e=g+32|0;d=g+8|0;f=g+4|0;c[g>>2]=a;c[f>>2]=b;c[e>>2]=g;c[e+4>>2]=39;c[e+8>>2]=f;c[e+12>>2]=39;c[d>>2]=5368;c[d+4>>2]=2;c[d+8>>2]=5264;c[d+12>>2]=2;c[d+16>>2]=e;c[d+20>>2]=2;aj(d,5384);}function mj(a,b){a=a|0;b=b|0;return db[c[(c[b+28>>2]|0)+12>>2]&15](c[b+24>>2]|0,13605,11)|0}function nj(a,b){a=a|0;b=b|0;return db[c[(c[b+28>>2]|0)+12>>2]&15](c[b+24>>2]|0,13616,14)|0}function oj(b,c,e,f,g,h,i){b=b|0;c=c|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;n=(b&65535)>>>8&255;o=c+(e<<1)|0;a:do if(e|0){k=b&255;m=0;b:while(1){j=c;c=c+2|0;e=a[j>>0]|0;j=d[j+1>>0]|0;l=j+m|0;if(n<<24>>24!=e<<24>>24)if((c|0)==(o|0)|(n&255)<(e&255))break a;else {m=l;continue}if(l>>>0<m>>>0){e=7;break}if(l>>>0>g>>>0){e=9;break}q=f+m|0;e=q+j|0;j=q;while(1){if((j|0)==(e|0))break;if((a[j>>0]|0)==k<<24>>24){p=0;e=15;break b}else j=j+1|0;}if((c|0)==(o|0))break a;else m=l;}if((e|0)==7)lj(m,l);else if((e|0)==9)kj(l,g);else if((e|0)==15)return p|0}while(0);m=h+i|0;if(!i){q=1;return q|0}l=h;j=h+1|0;k=b&65535;c=1;while(1){e=a[l>>0]|0;if(e<<24>>24<0){if((j|0)==(m|0)){e=18;break}e=d[j>>0]|(e&127)<<8;j=j+1|0;}else e=e&255;e=k-e|0;if((e|0)<0){p=c;e=15;break}c=c^1;if((j|0)==(m|0)){p=c;e=15;break}l=j;j=j+1|0;k=e;}if((e|0)==15)return p|0;else if((e|0)==18)$i(5400);return 0}function pj(a){a=a|0;var b=0;b=a&65535;if(a>>>0<65536){b=oj(b,12317,41,12399,304,12703,326)|0;return b|0}if(a>>>0<131072){b=oj(b,13029,33,13095,150,13245,360)|0;return b|0}if((a+-195102|0)>>>0<722658|((a+-191457|0)>>>0<3103|((a+-183970|0)>>>0<14|((a&2097150|0)==178206|((a+-173783|0)>>>0<41|(a+-177973|0)>>>0<11))))){b=0;return b|0}else return (a+-918e3|0)>>>0>196111|0;return 0}function qj(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;x=l;l=l+16|0;o=x;do if(a>>>0<245){k=a>>>0<11?16:a+11&-8;a=k>>>3;n=c[3973]|0;d=n>>>a;if(d&3|0){e=(d&1^1)+a|0;f=15932+(e<<1<<2)|0;b=f+8|0;a=c[b>>2]|0;g=a+8|0;d=c[g>>2]|0;if((f|0)==(d|0))c[3973]=n&~(1<<e);else {c[d+12>>2]=f;c[b>>2]=d;}w=e<<3;c[a+4>>2]=w|3;w=a+w+4|0;c[w>>2]=c[w>>2]|1;w=g;l=x;return w|0}m=c[3975]|0;if(k>>>0>m>>>0){if(d|0){h=2<<a;d=d<<a&(h|0-h);d=(d&0-d)+-1|0;h=d>>>12&16;d=d>>>h;a=d>>>5&8;d=d>>>a;f=d>>>2&4;d=d>>>f;b=d>>>1&2;d=d>>>b;e=d>>>1&1;e=(a|h|f|b|e)+(d>>>e)|0;d=15932+(e<<1<<2)|0;b=d+8|0;f=c[b>>2]|0;h=f+8|0;a=c[h>>2]|0;if((d|0)==(a|0)){a=n&~(1<<e);c[3973]=a;}else {c[a+12>>2]=d;c[b>>2]=a;a=n;}g=(e<<3)-k|0;c[f+4>>2]=k|3;f=f+k|0;c[f+4>>2]=g|1;c[f+g>>2]=g;if(m|0){e=c[3978]|0;b=m>>>3;d=15932+(b<<1<<2)|0;b=1<<b;if(!(a&b)){c[3973]=a|b;b=d+8|0;a=d;}else {a=d+8|0;b=a;a=c[a>>2]|0;}c[b>>2]=e;c[a+12>>2]=e;c[e+8>>2]=a;c[e+12>>2]=d;}c[3975]=g;c[3978]=f;w=h;l=x;return w|0}i=c[3974]|0;if(i){d=(i&0-i)+-1|0;h=d>>>12&16;d=d>>>h;g=d>>>5&8;d=d>>>g;j=d>>>2&4;d=d>>>j;a=d>>>1&2;d=d>>>a;e=d>>>1&1;e=c[16196+((g|h|j|a|e)+(d>>>e)<<2)>>2]|0;d=(c[e+4>>2]&-8)-k|0;a=c[e+16+(((c[e+16>>2]|0)==0&1)<<2)>>2]|0;if(!a){j=d;h=e;}else {do{h=(c[a+4>>2]&-8)-k|0;j=h>>>0<d>>>0;d=j?h:d;e=j?a:e;a=c[a+16+(((c[a+16>>2]|0)==0&1)<<2)>>2]|0;}while((a|0)!=0);j=d;h=e;}g=h+k|0;if(h>>>0<g>>>0){f=c[h+24>>2]|0;b=c[h+12>>2]|0;do if((b|0)==(h|0)){a=h+20|0;b=c[a>>2]|0;if(!b){a=h+16|0;b=c[a>>2]|0;if(!b){d=0;break}}while(1){e=b+20|0;d=c[e>>2]|0;if(d|0){b=d;a=e;continue}e=b+16|0;d=c[e>>2]|0;if(!d)break;else {b=d;a=e;}}c[a>>2]=0;d=b;}else {d=c[h+8>>2]|0;c[d+12>>2]=b;c[b+8>>2]=d;d=b;}while(0);do if(f|0){b=c[h+28>>2]|0;a=16196+(b<<2)|0;if((h|0)==(c[a>>2]|0)){c[a>>2]=d;if(!d){c[3974]=i&~(1<<b);break}}else {c[f+16+(((c[f+16>>2]|0)!=(h|0)&1)<<2)>>2]=d;if(!d)break}c[d+24>>2]=f;b=c[h+16>>2]|0;if(b|0){c[d+16>>2]=b;c[b+24>>2]=d;}b=c[h+20>>2]|0;if(b|0){c[d+20>>2]=b;c[b+24>>2]=d;}}while(0);if(j>>>0<16){w=j+k|0;c[h+4>>2]=w|3;w=h+w+4|0;c[w>>2]=c[w>>2]|1;}else {c[h+4>>2]=k|3;c[g+4>>2]=j|1;c[g+j>>2]=j;if(m|0){e=c[3978]|0;b=m>>>3;d=15932+(b<<1<<2)|0;b=1<<b;if(!(n&b)){c[3973]=n|b;b=d+8|0;a=d;}else {a=d+8|0;b=a;a=c[a>>2]|0;}c[b>>2]=e;c[a+12>>2]=e;c[e+8>>2]=a;c[e+12>>2]=d;}c[3975]=j;c[3978]=g;}w=h+8|0;l=x;return w|0}else n=k;}else n=k;}else n=k;}else if(a>>>0<=4294967231){a=a+11|0;k=a&-8;e=c[3974]|0;if(e){d=0-k|0;a=a>>>8;if(a)if(k>>>0>16777215)j=31;else {n=(a+1048320|0)>>>16&8;v=a<<n;m=(v+520192|0)>>>16&4;v=v<<m;j=(v+245760|0)>>>16&2;j=14-(m|n|j)+(v<<j>>>15)|0;j=k>>>(j+7|0)&1|j<<1;}else j=0;a=c[16196+(j<<2)>>2]|0;a:do if(!a){f=0;a=0;v=57;}else {f=0;h=k<<((j|0)==31?0:25-(j>>>1)|0);i=a;a=0;while(1){g=(c[i+4>>2]&-8)-k|0;if(g>>>0<d>>>0)if(!g){d=0;f=i;a=i;v=61;break a}else {d=g;a=i;}g=c[i+20>>2]|0;i=c[i+16+(h>>>31<<2)>>2]|0;f=(g|0)==0|(g|0)==(i|0)?f:g;g=(i|0)==0;if(g){v=57;break}else h=h<<((g^1)&1);}}while(0);if((v|0)==57){if((f|0)==0&(a|0)==0){a=2<<j;a=e&(a|0-a);if(!a){n=k;break}a=(a&0-a)+-1|0;j=a>>>12&16;a=a>>>j;i=a>>>5&8;a=a>>>i;m=a>>>2&4;a=a>>>m;n=a>>>1&2;a=a>>>n;f=a>>>1&1;f=c[16196+((i|j|m|n|f)+(a>>>f)<<2)>>2]|0;a=0;}if(!f){i=d;j=a;}else v=61;}if((v|0)==61)while(1){v=0;m=(c[f+4>>2]&-8)-k|0;n=m>>>0<d>>>0;d=n?m:d;a=n?f:a;f=c[f+16+(((c[f+16>>2]|0)==0&1)<<2)>>2]|0;if(!f){i=d;j=a;break}else v=61;}if((j|0)!=0?i>>>0<((c[3975]|0)-k|0)>>>0:0){h=j+k|0;if(j>>>0>=h>>>0){w=0;l=x;return w|0}g=c[j+24>>2]|0;b=c[j+12>>2]|0;do if((b|0)==(j|0)){a=j+20|0;b=c[a>>2]|0;if(!b){a=j+16|0;b=c[a>>2]|0;if(!b){b=0;break}}while(1){f=b+20|0;d=c[f>>2]|0;if(d|0){b=d;a=f;continue}f=b+16|0;d=c[f>>2]|0;if(!d)break;else {b=d;a=f;}}c[a>>2]=0;}else {w=c[j+8>>2]|0;c[w+12>>2]=b;c[b+8>>2]=w;}while(0);do if(g){a=c[j+28>>2]|0;d=16196+(a<<2)|0;if((j|0)==(c[d>>2]|0)){c[d>>2]=b;if(!b){e=e&~(1<<a);c[3974]=e;break}}else {c[g+16+(((c[g+16>>2]|0)!=(j|0)&1)<<2)>>2]=b;if(!b)break}c[b+24>>2]=g;a=c[j+16>>2]|0;if(a|0){c[b+16>>2]=a;c[a+24>>2]=b;}a=c[j+20>>2]|0;if(a){c[b+20>>2]=a;c[a+24>>2]=b;}}while(0);do if(i>>>0>=16){c[j+4>>2]=k|3;c[h+4>>2]=i|1;c[h+i>>2]=i;b=i>>>3;if(i>>>0<256){d=15932+(b<<1<<2)|0;a=c[3973]|0;b=1<<b;if(!(a&b)){c[3973]=a|b;b=d+8|0;a=d;}else {a=d+8|0;b=a;a=c[a>>2]|0;}c[b>>2]=h;c[a+12>>2]=h;c[h+8>>2]=a;c[h+12>>2]=d;break}b=i>>>8;if(b)if(i>>>0>16777215)b=31;else {v=(b+1048320|0)>>>16&8;w=b<<v;u=(w+520192|0)>>>16&4;w=w<<u;b=(w+245760|0)>>>16&2;b=14-(u|v|b)+(w<<b>>>15)|0;b=i>>>(b+7|0)&1|b<<1;}else b=0;d=16196+(b<<2)|0;c[h+28>>2]=b;a=h+16|0;c[a+4>>2]=0;c[a>>2]=0;a=1<<b;if(!(e&a)){c[3974]=e|a;c[d>>2]=h;c[h+24>>2]=d;c[h+12>>2]=h;c[h+8>>2]=h;break}a=i<<((b|0)==31?0:25-(b>>>1)|0);d=c[d>>2]|0;while(1){if((c[d+4>>2]&-8|0)==(i|0)){v=97;break}e=d+16+(a>>>31<<2)|0;b=c[e>>2]|0;if(!b){v=96;break}else {a=a<<1;d=b;}}if((v|0)==96){c[e>>2]=h;c[h+24>>2]=d;c[h+12>>2]=h;c[h+8>>2]=h;break}else if((v|0)==97){v=d+8|0;w=c[v>>2]|0;c[w+12>>2]=h;c[v>>2]=h;c[h+8>>2]=w;c[h+12>>2]=d;c[h+24>>2]=0;break}}else {w=i+k|0;c[j+4>>2]=w|3;w=j+w+4|0;c[w>>2]=c[w>>2]|1;}while(0);w=j+8|0;l=x;return w|0}else n=k;}else n=k;}else n=-1;while(0);d=c[3975]|0;if(d>>>0>=n>>>0){a=d-n|0;b=c[3978]|0;if(a>>>0>15){w=b+n|0;c[3978]=w;c[3975]=a;c[w+4>>2]=a|1;c[w+a>>2]=a;c[b+4>>2]=n|3;}else {c[3975]=0;c[3978]=0;c[b+4>>2]=d|3;w=b+d+4|0;c[w>>2]=c[w>>2]|1;}w=b+8|0;l=x;return w|0}h=c[3976]|0;if(h>>>0>n>>>0){u=h-n|0;c[3976]=u;w=c[3979]|0;v=w+n|0;c[3979]=v;c[v+4>>2]=u|1;c[w+4>>2]=n|3;w=w+8|0;l=x;return w|0}if(!(c[4091]|0)){c[4093]=4096;c[4092]=4096;c[4094]=-1;c[4095]=-1;c[4096]=0;c[4084]=0;a=o&-16^1431655768;c[o>>2]=a;c[4091]=a;a=4096;}else a=c[4093]|0;i=n+48|0;j=n+47|0;g=a+j|0;e=0-a|0;k=g&e;if(k>>>0<=n>>>0){w=0;l=x;return w|0}a=c[4083]|0;if(a|0?(m=c[4081]|0,o=m+k|0,o>>>0<=m>>>0|o>>>0>a>>>0):0){w=0;l=x;return w|0}b:do if(!(c[4084]&4)){d=c[3979]|0;c:do if(d){f=16340;while(1){a=c[f>>2]|0;if(a>>>0<=d>>>0?(r=f+4|0,(a+(c[r>>2]|0)|0)>>>0>d>>>0):0)break;a=c[f+8>>2]|0;if(!a){v=118;break c}else f=a;}b=g-h&e;if(b>>>0<2147483647){a=rk(b|0)|0;if((a|0)==((c[f>>2]|0)+(c[r>>2]|0)|0)){if((a|0)!=(-1|0)){h=a;g=b;v=135;break b}}else {e=a;v=126;}}else b=0;}else v=118;while(0);do if((v|0)==118){d=rk(0)|0;if((d|0)!=(-1|0)?(b=d,p=c[4092]|0,q=p+-1|0,b=((q&b|0)==0?0:(q+b&0-p)-b|0)+k|0,p=c[4081]|0,q=b+p|0,b>>>0>n>>>0&b>>>0<2147483647):0){r=c[4083]|0;if(r|0?q>>>0<=p>>>0|q>>>0>r>>>0:0){b=0;break}a=rk(b|0)|0;if((a|0)==(d|0)){h=d;g=b;v=135;break b}else {e=a;v=126;}}else b=0;}while(0);do if((v|0)==126){d=0-b|0;if(!(i>>>0>b>>>0&(b>>>0<2147483647&(e|0)!=(-1|0))))if((e|0)==(-1|0)){b=0;break}else {h=e;g=b;v=135;break b}a=c[4093]|0;a=j-b+a&0-a;if(a>>>0>=2147483647){h=e;g=b;v=135;break b}if((rk(a|0)|0)==(-1|0)){rk(d|0)|0;b=0;break}else {h=e;g=a+b|0;v=135;break b}}while(0);c[4084]=c[4084]|4;v=133;}else {b=0;v=133;}while(0);if(((v|0)==133?k>>>0<2147483647:0)?(s=rk(k|0)|0,r=rk(0)|0,u=r-s|0,t=u>>>0>(n+40|0)>>>0,!((s|0)==(-1|0)|t^1|s>>>0<r>>>0&((s|0)!=(-1|0)&(r|0)!=(-1|0))^1)):0){h=s;g=t?u:b;v=135;}if((v|0)==135){b=(c[4081]|0)+g|0;c[4081]=b;if(b>>>0>(c[4082]|0)>>>0)c[4082]=b;j=c[3979]|0;do if(j){f=16340;while(1){b=c[f>>2]|0;e=f+4|0;a=c[e>>2]|0;if((h|0)==(b+a|0)){v=145;break}d=c[f+8>>2]|0;if(!d)break;else f=d;}if(((v|0)==145?(c[f+12>>2]&8|0)==0:0)?j>>>0<h>>>0&j>>>0>=b>>>0:0){c[e>>2]=a+g;w=j+8|0;w=(w&7|0)==0?0:0-w&7;v=j+w|0;w=(c[3976]|0)+(g-w)|0;c[3979]=v;c[3976]=w;c[v+4>>2]=w|1;c[v+w+4>>2]=40;c[3980]=c[4095];break}if(h>>>0<(c[3977]|0)>>>0)c[3977]=h;d=h+g|0;a=16340;while(1){if((c[a>>2]|0)==(d|0)){v=153;break}b=c[a+8>>2]|0;if(!b)break;else a=b;}if((v|0)==153?(c[a+12>>2]&8|0)==0:0){c[a>>2]=h;m=a+4|0;c[m>>2]=(c[m>>2]|0)+g;m=h+8|0;m=h+((m&7|0)==0?0:0-m&7)|0;b=d+8|0;b=d+((b&7|0)==0?0:0-b&7)|0;k=m+n|0;i=b-m-n|0;c[m+4>>2]=n|3;do if((b|0)!=(j|0)){if((b|0)==(c[3978]|0)){w=(c[3975]|0)+i|0;c[3975]=w;c[3978]=k;c[k+4>>2]=w|1;c[k+w>>2]=w;break}a=c[b+4>>2]|0;if((a&3|0)==1){h=a&-8;e=a>>>3;d:do if(a>>>0<256){a=c[b+8>>2]|0;d=c[b+12>>2]|0;if((d|0)==(a|0)){c[3973]=c[3973]&~(1<<e);break}else {c[a+12>>2]=d;c[d+8>>2]=a;break}}else {g=c[b+24>>2]|0;a=c[b+12>>2]|0;do if((a|0)==(b|0)){e=b+16|0;d=e+4|0;a=c[d>>2]|0;if(!a){a=c[e>>2]|0;if(!a){a=0;break}else f=e;}else f=d;while(1){e=a+20|0;d=c[e>>2]|0;if(d|0){a=d;f=e;continue}e=a+16|0;d=c[e>>2]|0;if(!d)break;else {a=d;f=e;}}c[f>>2]=0;}else {w=c[b+8>>2]|0;c[w+12>>2]=a;c[a+8>>2]=w;}while(0);if(!g)break;d=c[b+28>>2]|0;e=16196+(d<<2)|0;do if((b|0)!=(c[e>>2]|0)){c[g+16+(((c[g+16>>2]|0)!=(b|0)&1)<<2)>>2]=a;if(!a)break d}else {c[e>>2]=a;if(a|0)break;c[3974]=c[3974]&~(1<<d);break d}while(0);c[a+24>>2]=g;e=b+16|0;d=c[e>>2]|0;if(d|0){c[a+16>>2]=d;c[d+24>>2]=a;}d=c[e+4>>2]|0;if(!d)break;c[a+20>>2]=d;c[d+24>>2]=a;}while(0);b=b+h|0;f=h+i|0;}else f=i;b=b+4|0;c[b>>2]=c[b>>2]&-2;c[k+4>>2]=f|1;c[k+f>>2]=f;b=f>>>3;if(f>>>0<256){d=15932+(b<<1<<2)|0;a=c[3973]|0;b=1<<b;if(!(a&b)){c[3973]=a|b;b=d+8|0;a=d;}else {a=d+8|0;b=a;a=c[a>>2]|0;}c[b>>2]=k;c[a+12>>2]=k;c[k+8>>2]=a;c[k+12>>2]=d;break}b=f>>>8;do if(!b)a=0;else {if(f>>>0>16777215){a=31;break}v=(b+1048320|0)>>>16&8;w=b<<v;u=(w+520192|0)>>>16&4;w=w<<u;a=(w+245760|0)>>>16&2;a=14-(u|v|a)+(w<<a>>>15)|0;a=f>>>(a+7|0)&1|a<<1;}while(0);e=16196+(a<<2)|0;c[k+28>>2]=a;b=k+16|0;c[b+4>>2]=0;c[b>>2]=0;b=c[3974]|0;d=1<<a;if(!(b&d)){c[3974]=b|d;c[e>>2]=k;c[k+24>>2]=e;c[k+12>>2]=k;c[k+8>>2]=k;break}a=f<<((a|0)==31?0:25-(a>>>1)|0);d=c[e>>2]|0;while(1){if((c[d+4>>2]&-8|0)==(f|0)){v=194;break}e=d+16+(a>>>31<<2)|0;b=c[e>>2]|0;if(!b){v=193;break}else {a=a<<1;d=b;}}if((v|0)==193){c[e>>2]=k;c[k+24>>2]=d;c[k+12>>2]=k;c[k+8>>2]=k;break}else if((v|0)==194){v=d+8|0;w=c[v>>2]|0;c[w+12>>2]=k;c[v>>2]=k;c[k+8>>2]=w;c[k+12>>2]=d;c[k+24>>2]=0;break}}else {w=(c[3976]|0)+i|0;c[3976]=w;c[3979]=k;c[k+4>>2]=w|1;}while(0);w=m+8|0;l=x;return w|0}a=16340;while(1){b=c[a>>2]|0;if(b>>>0<=j>>>0?(w=b+(c[a+4>>2]|0)|0,w>>>0>j>>>0):0)break;a=c[a+8>>2]|0;}f=w+-47|0;a=f+8|0;a=f+((a&7|0)==0?0:0-a&7)|0;f=j+16|0;a=a>>>0<f>>>0?j:a;b=a+8|0;d=h+8|0;d=(d&7|0)==0?0:0-d&7;v=h+d|0;d=g+-40-d|0;c[3979]=v;c[3976]=d;c[v+4>>2]=d|1;c[v+d+4>>2]=40;c[3980]=c[4095];d=a+4|0;c[d>>2]=27;c[b>>2]=c[4085];c[b+4>>2]=c[4086];c[b+8>>2]=c[4087];c[b+12>>2]=c[4088];c[4085]=h;c[4086]=g;c[4088]=0;c[4087]=b;b=a+24|0;do{v=b;b=b+4|0;c[b>>2]=7;}while((v+8|0)>>>0<w>>>0);if((a|0)!=(j|0)){g=a-j|0;c[d>>2]=c[d>>2]&-2;c[j+4>>2]=g|1;c[a>>2]=g;b=g>>>3;if(g>>>0<256){d=15932+(b<<1<<2)|0;a=c[3973]|0;b=1<<b;if(!(a&b)){c[3973]=a|b;b=d+8|0;a=d;}else {a=d+8|0;b=a;a=c[a>>2]|0;}c[b>>2]=j;c[a+12>>2]=j;c[j+8>>2]=a;c[j+12>>2]=d;break}b=g>>>8;if(b)if(g>>>0>16777215)d=31;else {v=(b+1048320|0)>>>16&8;w=b<<v;u=(w+520192|0)>>>16&4;w=w<<u;d=(w+245760|0)>>>16&2;d=14-(u|v|d)+(w<<d>>>15)|0;d=g>>>(d+7|0)&1|d<<1;}else d=0;e=16196+(d<<2)|0;c[j+28>>2]=d;c[j+20>>2]=0;c[f>>2]=0;b=c[3974]|0;a=1<<d;if(!(b&a)){c[3974]=b|a;c[e>>2]=j;c[j+24>>2]=e;c[j+12>>2]=j;c[j+8>>2]=j;break}a=g<<((d|0)==31?0:25-(d>>>1)|0);d=c[e>>2]|0;while(1){if((c[d+4>>2]&-8|0)==(g|0)){v=216;break}e=d+16+(a>>>31<<2)|0;b=c[e>>2]|0;if(!b){v=215;break}else {a=a<<1;d=b;}}if((v|0)==215){c[e>>2]=j;c[j+24>>2]=d;c[j+12>>2]=j;c[j+8>>2]=j;break}else if((v|0)==216){v=d+8|0;w=c[v>>2]|0;c[w+12>>2]=j;c[v>>2]=j;c[j+8>>2]=w;c[j+12>>2]=d;c[j+24>>2]=0;break}}}else {w=c[3977]|0;if((w|0)==0|h>>>0<w>>>0)c[3977]=h;c[4085]=h;c[4086]=g;c[4088]=0;c[3982]=c[4091];c[3981]=-1;b=0;do{w=15932+(b<<1<<2)|0;c[w+12>>2]=w;c[w+8>>2]=w;b=b+1|0;}while((b|0)!=32);w=h+8|0;w=(w&7|0)==0?0:0-w&7;v=h+w|0;w=g+-40-w|0;c[3979]=v;c[3976]=w;c[v+4>>2]=w|1;c[v+w+4>>2]=40;c[3980]=c[4095];}while(0);b=c[3976]|0;if(b>>>0>n>>>0){u=b-n|0;c[3976]=u;w=c[3979]|0;v=w+n|0;c[3979]=v;c[v+4>>2]=u|1;c[w+4>>2]=n|3;w=w+8|0;l=x;return w|0}}c[(Bj()|0)>>2]=12;w=0;l=x;return w|0}function rj(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;if(!a)return;d=a+-8|0;e=c[3977]|0;a=c[a+-4>>2]|0;b=a&-8;k=d+b|0;do if(!(a&1)){f=c[d>>2]|0;if(!(a&3))return;g=d+(0-f)|0;h=f+b|0;if(g>>>0<e>>>0)return;if((g|0)==(c[3978]|0)){b=k+4|0;a=c[b>>2]|0;if((a&3|0)!=3){i=g;j=g;b=h;break}c[3975]=h;c[b>>2]=a&-2;c[g+4>>2]=h|1;c[g+h>>2]=h;return}d=f>>>3;if(f>>>0<256){a=c[g+8>>2]|0;b=c[g+12>>2]|0;if((b|0)==(a|0)){c[3973]=c[3973]&~(1<<d);i=g;j=g;b=h;break}else {c[a+12>>2]=b;c[b+8>>2]=a;i=g;j=g;b=h;break}}f=c[g+24>>2]|0;a=c[g+12>>2]|0;do if((a|0)==(g|0)){d=g+16|0;b=d+4|0;a=c[b>>2]|0;if(!a){a=c[d>>2]|0;if(!a){d=0;break}else e=d;}else e=b;while(1){d=a+20|0;b=c[d>>2]|0;if(b|0){a=b;e=d;continue}d=a+16|0;b=c[d>>2]|0;if(!b)break;else {a=b;e=d;}}c[e>>2]=0;d=a;}else {d=c[g+8>>2]|0;c[d+12>>2]=a;c[a+8>>2]=d;d=a;}while(0);if(f){a=c[g+28>>2]|0;b=16196+(a<<2)|0;if((g|0)==(c[b>>2]|0)){c[b>>2]=d;if(!d){c[3974]=c[3974]&~(1<<a);i=g;j=g;b=h;break}}else {c[f+16+(((c[f+16>>2]|0)!=(g|0)&1)<<2)>>2]=d;if(!d){i=g;j=g;b=h;break}}c[d+24>>2]=f;b=g+16|0;a=c[b>>2]|0;if(a|0){c[d+16>>2]=a;c[a+24>>2]=d;}a=c[b+4>>2]|0;if(a){c[d+20>>2]=a;c[a+24>>2]=d;i=g;j=g;b=h;}else {i=g;j=g;b=h;}}else {i=g;j=g;b=h;}}else {i=d;j=d;}while(0);if(i>>>0>=k>>>0)return;a=k+4|0;e=c[a>>2]|0;if(!(e&1))return;if(!(e&2)){a=c[3978]|0;if((k|0)==(c[3979]|0)){k=(c[3976]|0)+b|0;c[3976]=k;c[3979]=j;c[j+4>>2]=k|1;if((j|0)!=(a|0))return;c[3978]=0;c[3975]=0;return}if((k|0)==(a|0)){k=(c[3975]|0)+b|0;c[3975]=k;c[3978]=i;c[j+4>>2]=k|1;c[i+k>>2]=k;return}f=(e&-8)+b|0;d=e>>>3;do if(e>>>0<256){b=c[k+8>>2]|0;a=c[k+12>>2]|0;if((a|0)==(b|0)){c[3973]=c[3973]&~(1<<d);break}else {c[b+12>>2]=a;c[a+8>>2]=b;break}}else {g=c[k+24>>2]|0;a=c[k+12>>2]|0;do if((a|0)==(k|0)){d=k+16|0;b=d+4|0;a=c[b>>2]|0;if(!a){a=c[d>>2]|0;if(!a){d=0;break}else e=d;}else e=b;while(1){d=a+20|0;b=c[d>>2]|0;if(b|0){a=b;e=d;continue}d=a+16|0;b=c[d>>2]|0;if(!b)break;else {a=b;e=d;}}c[e>>2]=0;d=a;}else {d=c[k+8>>2]|0;c[d+12>>2]=a;c[a+8>>2]=d;d=a;}while(0);if(g|0){a=c[k+28>>2]|0;b=16196+(a<<2)|0;if((k|0)==(c[b>>2]|0)){c[b>>2]=d;if(!d){c[3974]=c[3974]&~(1<<a);break}}else {c[g+16+(((c[g+16>>2]|0)!=(k|0)&1)<<2)>>2]=d;if(!d)break}c[d+24>>2]=g;b=k+16|0;a=c[b>>2]|0;if(a|0){c[d+16>>2]=a;c[a+24>>2]=d;}a=c[b+4>>2]|0;if(a|0){c[d+20>>2]=a;c[a+24>>2]=d;}}}while(0);c[j+4>>2]=f|1;c[i+f>>2]=f;if((j|0)==(c[3978]|0)){c[3975]=f;return}}else {c[a>>2]=e&-2;c[j+4>>2]=b|1;c[i+b>>2]=b;f=b;}a=f>>>3;if(f>>>0<256){d=15932+(a<<1<<2)|0;b=c[3973]|0;a=1<<a;if(!(b&a)){c[3973]=b|a;a=d+8|0;b=d;}else {b=d+8|0;a=b;b=c[b>>2]|0;}c[a>>2]=j;c[b+12>>2]=j;c[j+8>>2]=b;c[j+12>>2]=d;return}a=f>>>8;if(a)if(f>>>0>16777215)b=31;else {i=(a+1048320|0)>>>16&8;k=a<<i;h=(k+520192|0)>>>16&4;k=k<<h;b=(k+245760|0)>>>16&2;b=14-(h|i|b)+(k<<b>>>15)|0;b=f>>>(b+7|0)&1|b<<1;}else b=0;e=16196+(b<<2)|0;c[j+28>>2]=b;c[j+20>>2]=0;c[j+16>>2]=0;a=c[3974]|0;d=1<<b;do if(a&d){b=f<<((b|0)==31?0:25-(b>>>1)|0);d=c[e>>2]|0;while(1){if((c[d+4>>2]&-8|0)==(f|0)){a=73;break}e=d+16+(b>>>31<<2)|0;a=c[e>>2]|0;if(!a){a=72;break}else {b=b<<1;d=a;}}if((a|0)==72){c[e>>2]=j;c[j+24>>2]=d;c[j+12>>2]=j;c[j+8>>2]=j;break}else if((a|0)==73){i=d+8|0;k=c[i>>2]|0;c[k+12>>2]=j;c[i>>2]=j;c[j+8>>2]=k;c[j+12>>2]=d;c[j+24>>2]=0;break}}else {c[3974]=a|d;c[e>>2]=j;c[j+24>>2]=e;c[j+12>>2]=j;c[j+8>>2]=j;}while(0);k=(c[3981]|0)+-1|0;c[3981]=k;if(!k)a=16348;else return;while(1){a=c[a>>2]|0;if(!a)break;else a=a+8|0;}c[3981]=-1;return}function sj(a,b){a=a|0;b=b|0;var d=0,e=0;if(!a){a=qj(b)|0;return a|0}if(b>>>0>4294967231){c[(Bj()|0)>>2]=12;a=0;return a|0}d=tj(a+-8|0,b>>>0<11?16:b+11&-8)|0;if(d|0){a=d+8|0;return a|0}d=qj(b)|0;if(!d){a=0;return a|0}e=c[a+-4>>2]|0;e=(e&-8)-((e&3|0)==0?8:4)|0;ok(d|0,a|0,(e>>>0<b>>>0?e:b)|0)|0;rj(a);a=d;return a|0}function tj(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;m=a+4|0;l=c[m>>2]|0;d=l&-8;i=a+d|0;if(!(l&3)){if(b>>>0<256){a=0;return a|0}if(d>>>0>=(b+4|0)>>>0?(d-b|0)>>>0<=c[4093]<<1>>>0:0)return a|0;a=0;return a|0}if(d>>>0>=b>>>0){d=d-b|0;if(d>>>0<=15)return a|0;k=a+b|0;c[m>>2]=l&1|b|2;c[k+4>>2]=d|3;b=k+d+4|0;c[b>>2]=c[b>>2]|1;uj(k,d);return a|0}if((i|0)==(c[3979]|0)){k=(c[3976]|0)+d|0;e=k-b|0;d=a+b|0;if(k>>>0<=b>>>0){a=0;return a|0}c[m>>2]=l&1|b|2;c[d+4>>2]=e|1;c[3979]=d;c[3976]=e;return a|0}if((i|0)==(c[3978]|0)){f=(c[3975]|0)+d|0;if(f>>>0<b>>>0){a=0;return a|0}d=f-b|0;e=l&1;if(d>>>0>15){l=a+b|0;k=l+d|0;c[m>>2]=e|b|2;c[l+4>>2]=d|1;c[k>>2]=d;e=k+4|0;c[e>>2]=c[e>>2]&-2;e=l;}else {c[m>>2]=e|f|2;e=a+f+4|0;c[e>>2]=c[e>>2]|1;e=0;d=0;}c[3975]=d;c[3978]=e;return a|0}e=c[i+4>>2]|0;if(e&2|0){a=0;return a|0}j=(e&-8)+d|0;if(j>>>0<b>>>0){a=0;return a|0}k=j-b|0;f=e>>>3;do if(e>>>0<256){e=c[i+8>>2]|0;d=c[i+12>>2]|0;if((d|0)==(e|0)){c[3973]=c[3973]&~(1<<f);break}else {c[e+12>>2]=d;c[d+8>>2]=e;break}}else {h=c[i+24>>2]|0;d=c[i+12>>2]|0;do if((d|0)==(i|0)){f=i+16|0;e=f+4|0;d=c[e>>2]|0;if(!d){d=c[f>>2]|0;if(!d){f=0;break}else g=f;}else g=e;while(1){f=d+20|0;e=c[f>>2]|0;if(e|0){d=e;g=f;continue}f=d+16|0;e=c[f>>2]|0;if(!e)break;else {d=e;g=f;}}c[g>>2]=0;f=d;}else {f=c[i+8>>2]|0;c[f+12>>2]=d;c[d+8>>2]=f;f=d;}while(0);if(h|0){d=c[i+28>>2]|0;e=16196+(d<<2)|0;if((i|0)==(c[e>>2]|0)){c[e>>2]=f;if(!f){c[3974]=c[3974]&~(1<<d);break}}else {c[h+16+(((c[h+16>>2]|0)!=(i|0)&1)<<2)>>2]=f;if(!f)break}c[f+24>>2]=h;e=i+16|0;d=c[e>>2]|0;if(d|0){c[f+16>>2]=d;c[d+24>>2]=f;}d=c[e+4>>2]|0;if(d|0){c[f+20>>2]=d;c[d+24>>2]=f;}}}while(0);d=l&1;if(k>>>0<16){c[m>>2]=j|d|2;b=a+j+4|0;c[b>>2]=c[b>>2]|1;return a|0}else {l=a+b|0;c[m>>2]=d|b|2;c[l+4>>2]=k|3;b=l+k+4|0;c[b>>2]=c[b>>2]|1;uj(l,k);return a|0}return 0}function uj(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0;j=a+b|0;d=c[a+4>>2]|0;do if(!(d&1)){e=c[a>>2]|0;if(!(d&3))return;g=a+(0-e)|0;h=e+b|0;if((g|0)==(c[3978]|0)){a=j+4|0;d=c[a>>2]|0;if((d&3|0)!=3){i=g;a=h;break}c[3975]=h;c[a>>2]=d&-2;c[g+4>>2]=h|1;c[g+h>>2]=h;return}b=e>>>3;if(e>>>0<256){d=c[g+8>>2]|0;a=c[g+12>>2]|0;if((a|0)==(d|0)){c[3973]=c[3973]&~(1<<b);i=g;a=h;break}else {c[d+12>>2]=a;c[a+8>>2]=d;i=g;a=h;break}}f=c[g+24>>2]|0;d=c[g+12>>2]|0;do if((d|0)==(g|0)){b=g+16|0;a=b+4|0;d=c[a>>2]|0;if(!d){d=c[b>>2]|0;if(!d){b=0;break}else e=b;}else e=a;while(1){b=d+20|0;a=c[b>>2]|0;if(a|0){d=a;e=b;continue}b=d+16|0;a=c[b>>2]|0;if(!a)break;else {d=a;e=b;}}c[e>>2]=0;b=d;}else {b=c[g+8>>2]|0;c[b+12>>2]=d;c[d+8>>2]=b;b=d;}while(0);if(f){d=c[g+28>>2]|0;a=16196+(d<<2)|0;if((g|0)==(c[a>>2]|0)){c[a>>2]=b;if(!b){c[3974]=c[3974]&~(1<<d);i=g;a=h;break}}else {c[f+16+(((c[f+16>>2]|0)!=(g|0)&1)<<2)>>2]=b;if(!b){i=g;a=h;break}}c[b+24>>2]=f;a=g+16|0;d=c[a>>2]|0;if(d|0){c[b+16>>2]=d;c[d+24>>2]=b;}d=c[a+4>>2]|0;if(d){c[b+20>>2]=d;c[d+24>>2]=b;i=g;a=h;}else {i=g;a=h;}}else {i=g;a=h;}}else {i=a;a=b;}while(0);d=j+4|0;e=c[d>>2]|0;if(!(e&2)){d=c[3978]|0;if((j|0)==(c[3979]|0)){j=(c[3976]|0)+a|0;c[3976]=j;c[3979]=i;c[i+4>>2]=j|1;if((i|0)!=(d|0))return;c[3978]=0;c[3975]=0;return}if((j|0)==(d|0)){j=(c[3975]|0)+a|0;c[3975]=j;c[3978]=i;c[i+4>>2]=j|1;c[i+j>>2]=j;return}f=(e&-8)+a|0;b=e>>>3;do if(e>>>0<256){a=c[j+8>>2]|0;d=c[j+12>>2]|0;if((d|0)==(a|0)){c[3973]=c[3973]&~(1<<b);break}else {c[a+12>>2]=d;c[d+8>>2]=a;break}}else {g=c[j+24>>2]|0;d=c[j+12>>2]|0;do if((d|0)==(j|0)){b=j+16|0;a=b+4|0;d=c[a>>2]|0;if(!d){d=c[b>>2]|0;if(!d){b=0;break}else e=b;}else e=a;while(1){b=d+20|0;a=c[b>>2]|0;if(a|0){d=a;e=b;continue}b=d+16|0;a=c[b>>2]|0;if(!a)break;else {d=a;e=b;}}c[e>>2]=0;b=d;}else {b=c[j+8>>2]|0;c[b+12>>2]=d;c[d+8>>2]=b;b=d;}while(0);if(g|0){d=c[j+28>>2]|0;a=16196+(d<<2)|0;if((j|0)==(c[a>>2]|0)){c[a>>2]=b;if(!b){c[3974]=c[3974]&~(1<<d);break}}else {c[g+16+(((c[g+16>>2]|0)!=(j|0)&1)<<2)>>2]=b;if(!b)break}c[b+24>>2]=g;a=j+16|0;d=c[a>>2]|0;if(d|0){c[b+16>>2]=d;c[d+24>>2]=b;}d=c[a+4>>2]|0;if(d|0){c[b+20>>2]=d;c[d+24>>2]=b;}}}while(0);c[i+4>>2]=f|1;c[i+f>>2]=f;if((i|0)==(c[3978]|0)){c[3975]=f;return}}else {c[d>>2]=e&-2;c[i+4>>2]=a|1;c[i+a>>2]=a;f=a;}d=f>>>3;if(f>>>0<256){b=15932+(d<<1<<2)|0;a=c[3973]|0;d=1<<d;if(!(a&d)){c[3973]=a|d;d=b+8|0;a=b;}else {a=b+8|0;d=a;a=c[a>>2]|0;}c[d>>2]=i;c[a+12>>2]=i;c[i+8>>2]=a;c[i+12>>2]=b;return}d=f>>>8;if(d)if(f>>>0>16777215)a=31;else {h=(d+1048320|0)>>>16&8;j=d<<h;g=(j+520192|0)>>>16&4;j=j<<g;a=(j+245760|0)>>>16&2;a=14-(g|h|a)+(j<<a>>>15)|0;a=f>>>(a+7|0)&1|a<<1;}else a=0;e=16196+(a<<2)|0;c[i+28>>2]=a;c[i+20>>2]=0;c[i+16>>2]=0;d=c[3974]|0;b=1<<a;if(!(d&b)){c[3974]=d|b;c[e>>2]=i;c[i+24>>2]=e;c[i+12>>2]=i;c[i+8>>2]=i;return}a=f<<((a|0)==31?0:25-(a>>>1)|0);b=c[e>>2]|0;while(1){if((c[b+4>>2]&-8|0)==(f|0)){d=69;break}e=b+16+(a>>>31<<2)|0;d=c[e>>2]|0;if(!d){d=68;break}else {a=a<<1;b=d;}}if((d|0)==68){c[e>>2]=i;c[i+24>>2]=b;c[i+12>>2]=i;c[i+8>>2]=i;return}else if((d|0)==69){h=b+8|0;j=c[h>>2]|0;c[j+12>>2]=i;c[h>>2]=i;c[i+8>>2]=j;c[i+12>>2]=b;c[i+24>>2]=0;return}}function vj(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0;a=a>>>0>16?a:16;if(a+-1&a){d=16;while(1)if(d>>>0<a>>>0)d=d<<1;else {a=d;break}}if((-64-a|0)>>>0<=b>>>0){c[(Bj()|0)>>2]=12;h=0;return h|0}g=b>>>0<11?16:b+11&-8;d=qj(g+12+a|0)|0;if(!d){h=0;return h|0}f=d+-8|0;do if(d&a+-1){e=(d+a+-1&0-a)+-8|0;b=f;e=(e-b|0)>>>0>15?e:e+a|0;b=e-b|0;a=d+-4|0;i=c[a>>2]|0;d=(i&-8)-b|0;if(!(i&3)){c[e>>2]=(c[f>>2]|0)+b;c[e+4>>2]=d;b=e;a=e;break}else {i=e+4|0;c[i>>2]=d|c[i>>2]&1|2;d=e+d+4|0;c[d>>2]=c[d>>2]|1;c[a>>2]=b|c[a>>2]&1|2;c[i>>2]=c[i>>2]|1;uj(f,b);b=e;a=e;break}}else {b=f;a=f;}while(0);d=a+4|0;a=c[d>>2]|0;if(a&3|0?(h=a&-8,h>>>0>(g+16|0)>>>0):0){i=h-g|0;h=b+g|0;c[d>>2]=g|a&1|2;c[h+4>>2]=i|3;g=h+i+4|0;c[g>>2]=c[g>>2]|1;uj(h,i);}i=b+8|0;return i|0}
function wj(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;do if((b|0)!=8){e=b>>>2;if((b&3|0)!=0|(e|0)==0){a=22;return a|0}if(e+1073741823&e|0){a=22;return a|0}if((-64-b|0)>>>0<d>>>0){a=12;return a|0}else {b=vj(b>>>0>16?b:16,d)|0;break}}else b=qj(d)|0;while(0);if(!b){a=12;return a|0}c[a>>2]=b;a=0;return a|0}function xj(){return 16388}function yj(a){a=a|0;var b=0,d=0;b=l;l=l+16|0;d=b;c[d>>2]=Ej(c[a+60>>2]|0)|0;a=Aj(Wa(6,d|0)|0)|0;l=b;return a|0}function zj(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;f=l;l=l+32|0;g=f;e=f+20|0;c[g>>2]=c[a+60>>2];c[g+4>>2]=0;c[g+8>>2]=b;c[g+12>>2]=e;c[g+16>>2]=d;if((Aj(Oa(140,g|0)|0)|0)<0){c[e>>2]=-1;a=-1;}else a=c[e>>2]|0;l=f;return a|0}function Aj(a){a=a|0;if(a>>>0>4294963200){c[(Bj()|0)>>2]=0-a;a=-1;}return a|0}function Bj(){return (Cj()|0)+64|0}function Cj(){return Dj()|0}function Dj(){return 5424}function Ej(a){a=a|0;return a|0}function Fj(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0;g=l;l=l+32|0;f=g;c[b+36>>2]=11;if((c[b>>2]&64|0)==0?(c[f>>2]=c[b+60>>2],c[f+4>>2]=21523,c[f+8>>2]=g+16,Ma(54,f|0)|0):0)a[b+75>>0]=-1;f=Gj(b,d,e)|0;l=g;return f|0}function Gj(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0;n=l;l=l+48|0;i=n+16|0;f=n;e=n+32|0;j=a+28|0;g=c[j>>2]|0;c[e>>2]=g;k=a+20|0;g=(c[k>>2]|0)-g|0;c[e+4>>2]=g;c[e+8>>2]=b;c[e+12>>2]=d;g=g+d|0;h=a+60|0;c[f>>2]=c[h>>2];c[f+4>>2]=e;c[f+8>>2]=2;b=Aj(ab(146,f|0)|0)|0;a:do if((g|0)!=(b|0)){f=2;while(1){if((b|0)<0)break;g=g-b|0;p=c[e+4>>2]|0;o=b>>>0>p>>>0;e=o?e+8|0:e;f=(o<<31>>31)+f|0;p=b-(o?p:0)|0;c[e>>2]=(c[e>>2]|0)+p;o=e+4|0;c[o>>2]=(c[o>>2]|0)-p;c[i>>2]=c[h>>2];c[i+4>>2]=e;c[i+8>>2]=f;b=Aj(ab(146,i|0)|0)|0;if((g|0)==(b|0)){m=3;break a}}c[a+16>>2]=0;c[j>>2]=0;c[k>>2]=0;c[a>>2]=c[a>>2]|32;if((f|0)==2)d=0;else d=d-(c[e+4>>2]|0)|0;}else m=3;while(0);if((m|0)==3){p=c[a+44>>2]|0;c[a+16>>2]=p+(c[a+48>>2]|0);c[j>>2]=p;c[k>>2]=p;}l=n;return d|0}function Hj(b){b=b|0;var d=0,e=0,f=0;f=b;a:do if(!(f&3)){d=b;e=4;}else {d=f;while(1){if(!(a[b>>0]|0))break a;b=b+1|0;d=b;if(!(d&3)){d=b;e=4;break}}}while(0);if((e|0)==4){while(1){b=c[d>>2]|0;if(!((b&-2139062144^-2139062144)&b+-16843009))d=d+4|0;else break}if((b&255)<<24>>24)do d=d+1|0;while((a[d>>0]|0)!=0)}return d-f|0}function Ij(a){a=a|0;return 0}function Jj(a){a=a|0;return}function Kj(a){a=a|0;return Nj(a,c[(Mj()|0)+188>>2]|0)|0}function Lj(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;h=d&255;f=(e|0)!=0;a:do if(f&(b&3|0)!=0){g=d&255;while(1){if((a[b>>0]|0)==g<<24>>24){i=6;break a}b=b+1|0;e=e+-1|0;f=(e|0)!=0;if(!(f&(b&3|0)!=0)){i=5;break}}}else i=5;while(0);if((i|0)==5)if(f)i=6;else e=0;b:do if((i|0)==6){g=d&255;if((a[b>>0]|0)!=g<<24>>24){f=N(h,16843009)|0;c:do if(e>>>0>3)while(1){h=c[b>>2]^f;if((h&-2139062144^-2139062144)&h+-16843009|0)break;b=b+4|0;e=e+-4|0;if(e>>>0<=3){i=11;break c}}else i=11;while(0);if((i|0)==11)if(!e){e=0;break}while(1){if((a[b>>0]|0)==g<<24>>24)break b;b=b+1|0;e=e+-1|0;if(!e){e=0;break}}}}while(0);return (e|0?b:0)|0}function Mj(){return Dj()|0}function Nj(b,e){b=b|0;e=e|0;var f=0,g=0;f=0;while(1){if((d[13704+f>>0]|0)==(b|0)){g=2;break}f=f+1|0;if((f|0)==87){f=87;b=13792;g=5;break}}if((g|0)==2)if(!f)f=13792;else {b=13792;g=5;}if((g|0)==5)while(1){do{g=b;b=b+1|0;}while((a[g>>0]|0)!=0);f=f+-1|0;if(!f){f=b;break}else g=5;}return Oj(f,c[e+20>>2]|0)|0}function Oj(a,b){a=a|0;b=b|0;return Pj(a,b)|0}function Pj(a,b){a=a|0;b=b|0;if(!b)b=0;else b=Qj(c[b>>2]|0,c[b+4>>2]|0,a)|0;return (b|0?b:a)|0}function Qj(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;o=(c[b>>2]|0)+1794895138|0;h=Rj(c[b+8>>2]|0,o)|0;f=Rj(c[b+12>>2]|0,o)|0;g=Rj(c[b+16>>2]|0,o)|0;a:do if((h>>>0<d>>>2>>>0?(n=d-(h<<2)|0,f>>>0<n>>>0&g>>>0<n>>>0):0)?((g|f)&3|0)==0:0){n=f>>>2;m=g>>>2;l=0;while(1){k=h>>>1;j=l+k|0;i=j<<1;g=i+n|0;f=Rj(c[b+(g<<2)>>2]|0,o)|0;g=Rj(c[b+(g+1<<2)>>2]|0,o)|0;if(!(g>>>0<d>>>0&f>>>0<(d-g|0)>>>0)){f=0;break a}if(a[b+(g+f)>>0]|0){f=0;break a}f=Sj(e,b+g|0)|0;if(!f)break;f=(f|0)<0;if((h|0)==1){f=0;break a}else {l=f?l:j;h=f?k:h-k|0;}}f=i+m|0;g=Rj(c[b+(f<<2)>>2]|0,o)|0;f=Rj(c[b+(f+1<<2)>>2]|0,o)|0;if(f>>>0<d>>>0&g>>>0<(d-f|0)>>>0)f=(a[b+(f+g)>>0]|0)==0?b+f|0:0;else f=0;}else f=0;while(0);return f|0}function Rj(a,b){a=a|0;b=b|0;var c=0;c=jk(a|0)|0;return ((b|0)==0?a:c)|0}function Sj(b,c){b=b|0;c=c|0;var d=0,e=0;d=a[b>>0]|0;e=a[c>>0]|0;if(!(d<<24>>24==0?1:d<<24>>24!=e<<24>>24))do{b=b+1|0;c=c+1|0;d=a[b>>0]|0;e=a[c>>0]|0;}while(!(d<<24>>24==0?1:d<<24>>24!=e<<24>>24));return (d&255)-(e&255)|0}function Tj(){Va(16452);return 16460}function Uj(){Na(16452);return}function Vj(a){a=a|0;var b=0,d=0;do if(a){if((c[a+76>>2]|0)<=-1){b=Wj(a)|0;break}d=(Ij(a)|0)==0;b=Wj(a)|0;if(!d)Jj(a);}else {if(!(c[1448]|0))b=0;else b=Vj(c[1448]|0)|0;a=c[(Tj()|0)>>2]|0;if(a)do{if((c[a+76>>2]|0)>-1)d=Ij(a)|0;else d=0;if((c[a+20>>2]|0)>>>0>(c[a+28>>2]|0)>>>0)b=Wj(a)|0|b;if(d|0)Jj(a);a=c[a+56>>2]|0;}while((a|0)!=0);Uj();}while(0);return b|0}function Wj(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;h=a+20|0;g=a+28|0;if((c[h>>2]|0)>>>0>(c[g>>2]|0)>>>0?(db[c[a+36>>2]&15](a,0,0)|0,(c[h>>2]|0)==0):0)b=-1;else {f=a+4|0;b=c[f>>2]|0;e=a+8|0;d=c[e>>2]|0;if(b>>>0<d>>>0)db[c[a+40>>2]&15](a,b-d|0,1)|0;c[a+16>>2]=0;c[g>>2]=0;c[h>>2]=0;c[e>>2]=0;c[f>>2]=0;b=0;}return b|0}function Xj(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0;a:do if(!d)b=0;else {while(1){e=a[b>>0]|0;f=a[c>>0]|0;if(e<<24>>24!=f<<24>>24)break;d=d+-1|0;if(!d){b=0;break a}else {b=b+1|0;c=c+1|0;}}b=(e&255)-(f&255)|0;}while(0);return b|0}function Yj(a){a=a|0;return Zj(a)|0}function Zj(a){a=a|0;return lk(a|0)|0}function _j(a){a=a|0;return $j(a)|0}function $j(a){a=a|0;return jk(a|0)|0}function ak(a){a=a|0;return bk(a)|0}function bk(a){a=a|0;return lk(a|0)|0}function ck(b,c,d){b=b|0;c=c|0;d=d|0;var e=0;e=Kj(b)|0;b=Hj(e)|0;if(b>>>0>=d>>>0){b=d+-1|0;if(!d)b=34;else {ok(c|0,e|0,b|0)|0;a[c+b>>0]=0;b=34;}}else {ok(c|0,e|0,b+1|0)|0;b=0;}return b|0}function dk(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=l;l=l+16|0;f=e;c[f>>2]=a;c[f+4>>2]=b;c[f+8>>2]=d;a=Aj(Xa(4,f|0)|0)|0;l=e;return a|0}function ek(){}function fk(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;d=b-d-(c>>>0>a>>>0|0)>>>0;return (y=d,a-c>>>0|0)|0}function gk(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;c=a+c>>>0;return (y=b+d+(c>>>0<a>>>0|0)>>>0,c|0)|0}function hk(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;h=b+e|0;d=d&255;if((e|0)>=67){while(b&3){a[b>>0]=d;b=b+1|0;}f=h&-4|0;g=f-64|0;i=d|d<<8|d<<16|d<<24;while((b|0)<=(g|0)){c[b>>2]=i;c[b+4>>2]=i;c[b+8>>2]=i;c[b+12>>2]=i;c[b+16>>2]=i;c[b+20>>2]=i;c[b+24>>2]=i;c[b+28>>2]=i;c[b+32>>2]=i;c[b+36>>2]=i;c[b+40>>2]=i;c[b+44>>2]=i;c[b+48>>2]=i;c[b+52>>2]=i;c[b+56>>2]=i;c[b+60>>2]=i;b=b+64|0;}while((b|0)<(f|0)){c[b>>2]=i;b=b+4|0;}}while((b|0)<(h|0)){a[b>>0]=d;b=b+1|0;}return h-e|0}function ik(a){a=a|0;return 0}function jk(a){a=a|0;return (a&255)<<24|(a>>8&255)<<16|(a>>16&255)<<8|a>>>24|0}function kk(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){y=b>>>c;return a>>>c|(b&(1<<c)-1)<<32-c}y=0;return b>>>c-32|0}function lk(a){a=a|0;return (a&255)<<8|a>>8&255|0}function mk(a){a=a|0;return 0}function nk(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){y=b<<c|(a&(1<<c)-1<<32-c)>>>32-c;return a<<c}y=a<<c-32;return 0}function ok(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;if((e|0)>=8192)return Ea(b|0,d|0,e|0)|0;h=b|0;g=b+e|0;if((b&3)==(d&3)){while(b&3){if(!e)return h|0;a[b>>0]=a[d>>0]|0;b=b+1|0;d=d+1|0;e=e-1|0;}e=g&-4|0;f=e-64|0;while((b|0)<=(f|0)){c[b>>2]=c[d>>2];c[b+4>>2]=c[d+4>>2];c[b+8>>2]=c[d+8>>2];c[b+12>>2]=c[d+12>>2];c[b+16>>2]=c[d+16>>2];c[b+20>>2]=c[d+20>>2];c[b+24>>2]=c[d+24>>2];c[b+28>>2]=c[d+28>>2];c[b+32>>2]=c[d+32>>2];c[b+36>>2]=c[d+36>>2];c[b+40>>2]=c[d+40>>2];c[b+44>>2]=c[d+44>>2];c[b+48>>2]=c[d+48>>2];c[b+52>>2]=c[d+52>>2];c[b+56>>2]=c[d+56>>2];c[b+60>>2]=c[d+60>>2];b=b+64|0;d=d+64|0;}while((b|0)<(e|0)){c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;}}else {e=g-4|0;while((b|0)<(e|0)){a[b>>0]=a[d>>0]|0;a[b+1>>0]=a[d+1>>0]|0;a[b+2>>0]=a[d+2>>0]|0;a[b+3>>0]=a[d+3>>0]|0;b=b+4|0;d=d+4|0;}}while((b|0)<(g|0)){a[b>>0]=a[d>>0]|0;b=b+1|0;d=d+1|0;}return h|0}function pk(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0;f=a&65535;e=b&65535;c=N(e,f)|0;d=a>>>16;a=(c>>>16)+(N(e,d)|0)|0;e=b>>>16;b=N(e,f)|0;return (y=(a>>>16)+(N(e,d)|0)+(((a&65535)+b|0)>>>16)|0,a+b<<16|c&65535|0)|0}function qk(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0;e=a;f=c;c=pk(e,f)|0;a=y;return (y=(N(b,f)|0)+(N(d,e)|0)+a|a&0,c|0|0)|0}function rk(a){a=a|0;var b=0,d=0;d=a+15&-16|0;b=c[i>>2]|0;a=b+d|0;if((d|0)>0&(a|0)<(b|0)|(a|0)<0){V()|0;ka(12);return -1}c[i>>2]=a;if((a|0)>(U()|0)?(T()|0)==0:0){c[i>>2]=b;ka(12);return -1}return b|0}function sk(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return db[a&15](b|0,c|0,d|0)|0}function tk(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;eb[a&3](b|0,c|0,d|0,e|0,f|0);}function uk(a){a=a|0;return fb[a&7]()|0}function vk(a,b){a=a|0;b=b|0;gb[a&63](b|0);}function wk(a,b,c){a=a|0;b=b|0;c=c|0;hb[a&31](b|0,c|0);}function xk(a,b){a=a|0;b=b|0;return ib[a&15](b|0)|0}function yk(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;jb[a&31](b|0,c|0,d|0);}function zk(a){a=a|0;kb[a&3]();}function Ak(a,b,c){a=a|0;b=b|0;c=c|0;return lb[a&127](b|0,c|0)|0}function Bk(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;return mb[a&1](b|0,c|0,d|0,e|0,f|0)|0}function Ck(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;nb[a&15](b|0,c|0,d|0,e|0);}function Dk(a,b,c){a=a|0;b=b|0;c=c|0;R(0);return 0}function Ek(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;R(1);}function Fk(){R(2);return 0}function Gk(a){a=a|0;R(3);}function Hk(a,b){a=a|0;b=b|0;R(4);}function Ik(a){a=a|0;R(5);return 0}function Jk(a,b,c){a=a|0;b=b|0;c=c|0;R(6);}function Kk(){R(7);}function Lk(a,b){a=a|0;b=b|0;R(8);return 0}function Mk(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;R(9);return 0}function Nk(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;R(10);}

// EMSCRIPTEN_END_FUNCS
var db=[Dk,Jd,Id,Kf,Gh,Pi,hi,Fj,zj,dc,ki,Gj,Dk,Dk,Dk,Dk];var eb=[Ek,Mc,Wc,Ek];var fb=[Fk,ce,de,Me,Rg,Fk,Fk,Fk];var gb=[Gk,Bb,id,_d,be,ee,ge,he,ne,Ne,He,df,ef,ff,gf,qf,tf,Bf,uf,yf,wf,Of,Nf,Rf,hg,Qg,Sg,re,$g,Ch,gi,Mi,Li,Oi,ej,hj,ac,fc,nc,vb,oc,Rb,Yc,sd,$i,rd,hf,jh,Oe,oe,Te,Md,ze,ke,Bg,xh,sg,Ve,Lg,Ye,Qf,nh,Gk,Gk];var hb=[Hk,Je,Sd,Kd,_f,Yf,Sf,Tf,lj,aj,Nb,lc,jc,kc,kj,mc,sc,dd,Nc,Xc,Rc,cj,Ue,$e,kh,Ef,we,Ah,_e,Hk,Hk,Hk];var ib=[Ik,Cb,Db,kd,Tg,vd,Ld,Zf,yj,ue,bc,_g,me,Ri,pg,Ik];var jb=[Jk,Le,Hb,$b,hc,ld,Ib,wb,gc,cc,ic,ec,rc,qc,pc,cd,Kc,Lc,Fc,bj,td,ve,Ce,Cg,Ag,Nh,Dg,uh,Uh,Jk,Jk,Jk];var kb=[Kk,Ub,ng,Kk];var lb=[Lk,$d,yd,Ed,Gd,Td,Zd,$f,gg,di,rf,Cf,Af,vf,zf,xf,xd,Hg,Xg,Fd,Hd,mf,nf,Eh,Fh,Xi,Yi,Di,dj,ii,ji,Ci,ij,Vb,Pf,tc,nd,Ki,Bi,ai,ni,Ad,Mh,Vd,Ug,ih,fi,hh,gj,mj,nj,Mf,yh,Jf,ei,si,Bd,zd,ae,If,wd,Th,Rh,li,Ei,Ai,Zi,$h,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk,Lk];var mb=[Mk,Qi];var nb=[Nk,Ie,Ke,xb,Jc,Ii,ag,cf,Hf,Nk,Nk,Nk,Nk,Nk,Nk,Nk];return {_main:Tb,dynCall_i:uk,stackSave:pb,_i64Subtract:fk,_rust_eh_personality:Kh,setThrew:sb,dynCall_viii:yk,_bitshift64Lshr:kk,_ec_pairing:Qb,_bitshift64Shl:nk,_fflush:Vj,_htonl:_j,___errno_location:Bj,_memset:hk,dynCall_ii:xk,_sbrk:rk,_memcpy:ok,stackAlloc:ob,___muldi3:qk,_ec_mul:Lb,dynCall_vi:vk,getTempRet0:ub,dynCall_vii:wk,_ntohs:ak,setTempRet0:tb,_i64Add:gk,dynCall_iiii:sk,_pthread_mutex_unlock:mk,_llvm_bswap_i16:lk,_emscripten_get_global_libc:xj,_htons:Yj,dynCall_viiii:Ck,dynCall_iiiiii:Bk,_llvm_bswap_i32:jk,dynCall_viiiii:tk,_free:rj,runPostSets:ek,establishStackSpace:rb,stackRestore:qb,_malloc:qj,dynCall_iii:Ak,_pthread_mutex_lock:ik,dynCall_v:zk,_ec_add:Pb}})


// EMSCRIPTEN_END_ASM
(Module.asmGlobalArg,Module.asmLibraryArg,buffer);var _main=Module["_main"]=asm["_main"];var stackSave=Module["stackSave"]=asm["stackSave"];var getTempRet0=Module["getTempRet0"]=asm["getTempRet0"];var _rust_eh_personality=Module["_rust_eh_personality"]=asm["_rust_eh_personality"];var setThrew=Module["setThrew"]=asm["setThrew"];var _bitshift64Lshr=Module["_bitshift64Lshr"]=asm["_bitshift64Lshr"];var _ec_pairing=Module["_ec_pairing"]=asm["_ec_pairing"];var _bitshift64Shl=Module["_bitshift64Shl"]=asm["_bitshift64Shl"];var _fflush=Module["_fflush"]=asm["_fflush"];var setTempRet0=Module["setTempRet0"]=asm["setTempRet0"];var _memset=Module["_memset"]=asm["_memset"];var _sbrk=Module["_sbrk"]=asm["_sbrk"];var _memcpy=Module["_memcpy"]=asm["_memcpy"];var _llvm_bswap_i32=Module["_llvm_bswap_i32"]=asm["_llvm_bswap_i32"];var ___muldi3=Module["___muldi3"]=asm["___muldi3"];var _ec_mul=Module["_ec_mul"]=asm["_ec_mul"];var stackAlloc=Module["stackAlloc"]=asm["stackAlloc"];var _i64Subtract=Module["_i64Subtract"]=asm["_i64Subtract"];var _ntohs=Module["_ntohs"]=asm["_ntohs"];var _htonl=Module["_htonl"]=asm["_htonl"];var _i64Add=Module["_i64Add"]=asm["_i64Add"];var _pthread_mutex_unlock=Module["_pthread_mutex_unlock"]=asm["_pthread_mutex_unlock"];var _llvm_bswap_i16=Module["_llvm_bswap_i16"]=asm["_llvm_bswap_i16"];var _emscripten_get_global_libc=Module["_emscripten_get_global_libc"]=asm["_emscripten_get_global_libc"];var _htons=Module["_htons"]=asm["_htons"];var ___errno_location=Module["___errno_location"]=asm["___errno_location"];var _free=Module["_free"]=asm["_free"];var runPostSets=Module["runPostSets"]=asm["runPostSets"];var establishStackSpace=Module["establishStackSpace"]=asm["establishStackSpace"];var stackRestore=Module["stackRestore"]=asm["stackRestore"];var _malloc=Module["_malloc"]=asm["_malloc"];var _pthread_mutex_lock=Module["_pthread_mutex_lock"]=asm["_pthread_mutex_lock"];var _ec_add=Module["_ec_add"]=asm["_ec_add"];var dynCall_iiii=Module["dynCall_iiii"]=asm["dynCall_iiii"];var dynCall_viiiii=Module["dynCall_viiiii"]=asm["dynCall_viiiii"];var dynCall_i=Module["dynCall_i"]=asm["dynCall_i"];var dynCall_vi=Module["dynCall_vi"]=asm["dynCall_vi"];var dynCall_vii=Module["dynCall_vii"]=asm["dynCall_vii"];var dynCall_ii=Module["dynCall_ii"]=asm["dynCall_ii"];var dynCall_viii=Module["dynCall_viii"]=asm["dynCall_viii"];var dynCall_v=Module["dynCall_v"]=asm["dynCall_v"];var dynCall_iii=Module["dynCall_iii"]=asm["dynCall_iii"];var dynCall_iiiiii=Module["dynCall_iiiiii"]=asm["dynCall_iiiiii"];var dynCall_viiii=Module["dynCall_viiii"]=asm["dynCall_viiii"];Runtime.stackAlloc=Module["stackAlloc"];Runtime.stackSave=Module["stackSave"];Runtime.stackRestore=Module["stackRestore"];Runtime.establishStackSpace=Module["establishStackSpace"];Runtime.setTempRet0=Module["setTempRet0"];Runtime.getTempRet0=Module["getTempRet0"];Module["asm"]=asm;if(memoryInitializer){if(typeof Module["locateFile"]==="function"){memoryInitializer=Module["locateFile"](memoryInitializer);}else if(Module["memoryInitializerPrefixURL"]){memoryInitializer=Module["memoryInitializerPrefixURL"]+memoryInitializer;}if(ENVIRONMENT_IS_NODE||ENVIRONMENT_IS_SHELL){var data=Module["readBinary"](memoryInitializer);HEAPU8.set(data,Runtime.GLOBAL_BASE);}else {addRunDependency();var applyMemoryInitializer=(function(data){if(data.byteLength)data=new Uint8Array(data);HEAPU8.set(data,Runtime.GLOBAL_BASE);if(Module["memoryInitializerRequest"])delete Module["memoryInitializerRequest"].response;removeRunDependency();});function doBrowserLoad(){Module["readAsync"](memoryInitializer,applyMemoryInitializer,(function(){throw "could not load memory initializer "+memoryInitializer}));}var memoryInitializerBytes=tryParseAsDataURI(memoryInitializer);if(memoryInitializerBytes){applyMemoryInitializer(memoryInitializerBytes.buffer);}else if(Module["memoryInitializerRequest"]){function useRequest(){var request=Module["memoryInitializerRequest"];var response=request.response;if(request.status!==200&&request.status!==0){var data=tryParseAsDataURI(Module["memoryInitializerRequestURL"]);if(data){response=data.buffer;}else {console.warn("a problem seems to have happened with Module.memoryInitializerRequest, status: "+request.status+", retrying "+memoryInitializer);doBrowserLoad();return}}applyMemoryInitializer(response);}if(Module["memoryInitializerRequest"].response){setTimeout(useRequest,0);}else {Module["memoryInitializerRequest"].addEventListener("load",useRequest);}}else {doBrowserLoad();}}}function ExitStatus(status){this.name="ExitStatus";this.message="Program terminated with exit("+status+")";this.status=status;}ExitStatus.prototype=new Error;ExitStatus.prototype.constructor=ExitStatus;var initialStackTop;dependenciesFulfilled=function runCaller(){if(!Module["calledRun"])run();if(!Module["calledRun"])dependenciesFulfilled=runCaller;};Module["callMain"]=Module.callMain=function callMain(args){args=args||[];ensureInitRuntime();var argc=args.length+1;function pad(){for(var i=0;i<4-1;i++){argv.push(0);}}var argv=[allocate(intArrayFromString(Module["thisProgram"]),"i8",ALLOC_NORMAL)];pad();for(var i=0;i<argc-1;i=i+1){argv.push(allocate(intArrayFromString(args[i]),"i8",ALLOC_NORMAL));pad();}argv.push(0);argv=allocate(argv,"i32",ALLOC_NORMAL);try{var ret=Module["_main"](argc,argv,0);exit(ret,true);}catch(e){if(e instanceof ExitStatus){return}else if(e=="SimulateInfiniteLoop"){Module["noExitRuntime"]=true;return}else {var toLog=e;if(e&&typeof e==="object"&&e.stack){toLog=[e,e.stack];}Module.printErr("exception thrown: "+toLog);Module["quit"](1,e);}}finally{}};function run(args){args=args||Module["arguments"];if(runDependencies>0){return}preRun();if(runDependencies>0)return;if(Module["calledRun"])return;function doRun(){if(Module["calledRun"])return;Module["calledRun"]=true;if(ABORT)return;ensureInitRuntime();preMain();if(Module["onRuntimeInitialized"])Module["onRuntimeInitialized"]();if(Module["_main"]&&shouldRunNow)Module["callMain"](args);postRun();}if(Module["setStatus"]){Module["setStatus"]("Running...");setTimeout((function(){setTimeout((function(){Module["setStatus"]("");}),1);doRun();}),1);}else {doRun();}}Module["run"]=Module.run=run;function exit(status,implicit){if(implicit&&Module["noExitRuntime"]){return}if(Module["noExitRuntime"]);else {ABORT=true;STACKTOP=initialStackTop;exitRuntime();if(Module["onExit"])Module["onExit"](status);}if(ENVIRONMENT_IS_NODE){process["exit"](status);}Module["quit"](status,new ExitStatus(status));}Module["exit"]=Module.exit=exit;var abortDecorators=[];function abort(what){if(Module["onAbort"]){Module["onAbort"](what);}if(what!==undefined){Module.print(what);Module.printErr(what);what=JSON.stringify(what);}else {what="";}ABORT=true;var extra="\nIf this abort() is unexpected, build with -s ASSERTIONS=1 which can give more information.";var output="abort("+what+") at "+stackTrace()+extra;if(abortDecorators){abortDecorators.forEach((function(decorator){output=decorator(output,what);}));}throw output}Module["abort"]=Module.abort=abort;if(Module["preInit"]){if(typeof Module["preInit"]=="function")Module["preInit"]=[Module["preInit"]];while(Module["preInit"].length>0){Module["preInit"].pop()();}}var shouldRunNow=true;if(Module["noInitialRun"]){shouldRunNow=false;}Module["arguments"]=[];run();module.exports=Module;
});

const ec_add = index_asm.cwrap('ec_add', 'string', ['string']);
const ec_mul = index_asm.cwrap('ec_mul', 'string', ['string']);
const ec_pairing = index_asm.cwrap('ec_pairing', 'string', ['string']);

function bn128add (input) {
  return Buffer.from(ec_add(input.toString('hex')), 'hex')
}

function bn128mul (input) {
  return Buffer.from(ec_mul(input.toString('hex')), 'hex')
}

function bn128pairing (input) {
  return Buffer.from(ec_pairing(input.toString('hex')), 'hex')
}

var rustbn_js = {
  add: bn128add,
  mul: bn128mul,
  pairing: bn128pairing
};

function _p6 (data) {
  const returnData = rustbn_js.add(toHex(data));

  // check ecadd success or failure by comparing the output length
  if (returnData.length !== 64) {
    return {
      returnValue: [],
      exception: 0
    };
  }

  return {
    returnValue: returnData,
    exception: 1
  };
}

function _p7 (data) {
  const returnData = rustbn_js.mul(toHex(data));

  // check ecmul success or failure by comparing the output length
  if (returnData.length !== 64) {
    return {
      returnValue: [],
      exception: 0
    };
  }

  return {
    returnValue: returnData,
    exception: 1,
  };
}

function _p8 (data) {
  const returnData = rustbn_js.pairing(toHex(data));

  // check ecpairing success or failure by comparing the output length
  if (returnData.length !== 32) {
    return {
      returnValue: [],
      exception: 0
    };
  }

  return {
    returnValue: returnData,
    exception: 1
  };
}

const PRECOMPILED = {
  '1': _p1,
  '2': _p2,
  '3': _p3,
  '4': _p4,
  '5': _p5,
  '6': _p6,
  '7': _p7,
  '8': _p8,
};

const ERRNO_MAP =
  {
    'stack overflow': 0x01,
    'stack underflow': 0x02,
    'invalid opcode': 0x04,
    'invalid JUMP': 0x05,
    'instruction not supported': 0x06,
    'revert': 0x07,
    'static state change': 0x0b,
    'out of gas': 0x0d,
    'internal error': 0xff,
  };

const ERROR = {
  OUT_OF_GAS: 'out of gas',
  STACK_UNDERFLOW: 'stack underflow',
  STACK_OVERFLOW: 'stack overflow',
  INVALID_JUMP: 'invalid JUMP',
  INSTRUCTION_NOT_SUPPORTED: 'instruction not supported',
  INVALID_OPCODE: 'invalid opcode',
  REVERT: 'revert',
  STATIC_STATE_CHANGE: 'static state change',
  INTERNAL_ERROR: 'internal error',
};

function VmError (error) {
  this.error = error;
  this.errorType = 'VmError';
}
const ADDRESS_ZERO = ''.padStart(40, '0');
const MAX_INTEGER = BigInt.asUintN(256, '-1');
const SIGN_MASK = BigInt(2) ** BigInt(255);
const BIG_ZERO$4 = BigInt(0);
const BIG_ONE$4 = BigInt(1);
const BIG_TWO$1 = BigInt(2);
const MEM_LIMIT = BigInt(2 << 20);

function toUint (v) {
  return BigInt.asUintN(256, v);
}

function toInt (v) {
  return BigInt.asIntN(256, v);
}

class EVMRuntime {
  constructor () {
  }

  async runNextStep (runState) {
    let exceptionError;
    try {
      const opCode = runState.code[runState.programCounter];
      const opInfo = OPCODES[opCode] || ['INVALID', 0, 0];
      const opName = opInfo[0];

      runState.opName = opName;
      runState.opCode = opCode;
      runState.stackIn = opInfo[1];
      runState.stackOut = opInfo[2];

      if (runState.stack.length < runState.stackIn) {
        throw new VmError(ERROR.STACK_UNDERFLOW);
      }

      if ((runState.stack.length - runState.stackIn + runState.stackOut) > 1024) {
        throw new VmError(ERROR.STACK_OVERFLOW);
      }

      runState.programCounter++;

      await this[opName](runState);
    } catch (e) {
      exceptionError = e;
    }

    let errno = 0;
    if (exceptionError) {
      errno = ERRNO_MAP[exceptionError.error];

      if (!errno) {
        // re-throw if it's not a vm error
        throw exceptionError;
      }

      runState.vmError = true;
    }

    if (errno !== 0 || runState.stopped) {
      // pc should not be incremented, reverse the above
      runState.programCounter--;
    }

    runState.errno = errno;
  }

  async initRunState (obj) {
    const runState = {
      code: obj.code,
      callData: obj.data,
      // caller & origin are the same in our case
      caller: obj.caller || obj.origin || ADDRESS_ZERO,
      origin: obj.origin || ADDRESS_ZERO,
      address: obj.address || ADDRESS_ZERO,
      memory: [],
      stack: [],
      memoryWordCount: 0,
      stackIn: 0,
      stackOut: 0,
      programCounter: obj.pc | 0,
      errno: 0,
      vmError: false,
      stopped: false,
      returnValue: [],
      validJumps: {},
    };

    const len = runState.code.length;

    for (let i = 0; i < len; i++) {
      const op = OPCODES[runState.code[i]] || ['INVALID'];

      if (op[0] === 'PUSH') {
        i += runState.code[i] - 0x5f;
      }

      if (op[0] === 'JUMPDEST') {
        runState.validJumps[i] = true;
      }
    }

    if (obj.stack) {
      const len = obj.stack.length;

      for (let i = 0; i < len; i++) {
        runState.stack.push(BigInt(obj.stack[i]));
      }
    }

    if (obj.mem) {
      const len = obj.mem.length;

      for (let i = 0; i < len; i++) {
        const memSlot = obj.mem[i];

        runState.memoryWordCount++;

        for (let x = 2; x < 66;) {
          const hexVal = memSlot.substring(x, x += 2);

          runState.memory.push(hexVal ? parseInt(hexVal, 16) : 0);
        }
      }
    }

    return runState;
  }

  async run (args) {
    const runState = await this.initRunState(args);
    this.stepCount = this.stepCount | 0;

    while (!runState.stopped && !runState.vmError && runState.programCounter < runState.code.length) {
      await this.runNextStep(runState);

      if (this.stepCount !== 0) {
        if (--this.stepCount === 0) {
          runState.errno = 0xff;
          break;
        }
      }
    }

    return runState;
  }

  async STOP (runState) {
    runState.stopped = true;
  }

  async ADD (runState) {
    const a = runState.stack.pop();
    const b = runState.stack.pop();

    runState.stack.push(toUint(a + b));
  }

  async MUL (runState) {
    const a = runState.stack.pop();
    const b = runState.stack.pop();

    runState.stack.push(toUint(a * b));
  }

  async SUB (runState) {
    const a = runState.stack.pop();
    const b = runState.stack.pop();

    runState.stack.push(toUint(a - b));
  }

  async DIV (runState) {
    const a = runState.stack.pop();
    const b = runState.stack.pop();
    let r;

    if (b === BIG_ZERO$4) {
      r = b;
    } else {
      r = a / b;
    }
    runState.stack.push(r);
  }

  async SDIV (runState) {
    let a = toInt(runState.stack.pop());
    let b = toInt(runState.stack.pop());
    let r;

    if (b === BIG_ZERO$4) {
      r = b;
    } else {
      r = toUint(a / b);
    }
    runState.stack.push(r);
  }

  async MOD (runState) {
    const a = runState.stack.pop();
    const b = runState.stack.pop();
    let r;

    if (b === BIG_ZERO$4) {
      r = b;
    } else {
      r = a % b;
    }
    runState.stack.push(r);
  }

  async SMOD (runState) {
    let a = runState.stack.pop();
    let b = runState.stack.pop();
    let r;

    if (b === BIG_ZERO$4) {
      r = b;
    } else {
      r = toUint(toInt(a) % toInt(b));
    }
    runState.stack.push(r);
  }

  async ADDMOD (runState) {
    const a = runState.stack.pop();
    const b = runState.stack.pop();
    const c = runState.stack.pop();
    let r;

    if (c === BIG_ZERO$4) {
      r = c;
    } else {
      r = (a + b) % c;
    }
    runState.stack.push(r);
  }

  async MULMOD (runState) {
    const a = runState.stack.pop();
    const b = runState.stack.pop();
    const c = runState.stack.pop();
    let r;

    if (c === BIG_ZERO$4) {
      r = c;
    } else {
      r = (a * b) % c;
    }
    runState.stack.push(r);
  }

  async EXP (runState) {
    const base = runState.stack.pop();
    const exponent = runState.stack.pop();

    if (exponent === BIG_ZERO$4) {
      runState.stack.push(BIG_ONE$4);
      return;
    }

    if (base === BIG_ZERO$4) {
      runState.stack.push(BIG_ZERO$4);
      return;
    }

    let r = BIG_ONE$4;
    let b = base;
    let e = exponent;

    while (true) {
      if (e % BIG_TWO$1 === BIG_ONE$4) {
        r = toUint(r * b);
      }

      e /= BIG_TWO$1;

      if (e === BIG_ZERO$4) {
        break;
      }

      b = toUint(b * b);
    }

    runState.stack.push(r);
  }

  async SIGNEXTEND (runState) {
    const k = runState.stack.pop();
    let val = runState.stack.pop();

    if (k < BigInt(31)) {
      const signBit = (k * BigInt(8)) + BigInt(7);
      const mask = (BIG_ONE$4 << signBit);
      const fmask = mask - BIG_ONE$4;

      if (val & mask) {
        val = toUint(val | ~fmask);
      } else {
        val = val & fmask;
      }
    }

    runState.stack.push(val);
  }

  async LT (runState) {
    const a = runState.stack.pop();
    const b = runState.stack.pop();

    runState.stack.push(a < b ? BIG_ONE$4 : BIG_ZERO$4);
  }

  async GT (runState) {
    const a = runState.stack.pop();
    const b = runState.stack.pop();

    runState.stack.push(a > b ? BIG_ONE$4 : BIG_ZERO$4);
  }

  async SLT (runState) {
    const a = toInt(runState.stack.pop());
    const b = toInt(runState.stack.pop());

    runState.stack.push(a < b ? BIG_ONE$4 : BIG_ZERO$4);
  }

  async SGT (runState) {
    const a = toInt(runState.stack.pop());
    const b = toInt(runState.stack.pop());

    runState.stack.push(a > b ? BIG_ONE$4 : BIG_ZERO$4);
  }

  async EQ (runState) {
    const a = runState.stack.pop();
    const b = runState.stack.pop();

    runState.stack.push(a === b ? BIG_ONE$4 : BIG_ZERO$4);
  }

  async ISZERO (runState) {
    const a = runState.stack.pop();

    runState.stack.push(a === BIG_ZERO$4 ? BIG_ONE$4 : BIG_ZERO$4);
  }

  async AND (runState) {
    const a = runState.stack.pop();
    const b = runState.stack.pop();

    runState.stack.push(a & b);
  }

  async OR (runState) {
    const a = runState.stack.pop();
    const b = runState.stack.pop();

    runState.stack.push(a | b);
  }

  async XOR (runState) {
    const a = runState.stack.pop();
    const b = runState.stack.pop();

    runState.stack.push(a ^ b);
  }

  async NOT (runState) {
    const a = runState.stack.pop();

    runState.stack.push(toUint(~a));
  }

  async BYTE (runState) {
    const pos = runState.stack.pop();
    const word = runState.stack.pop();

    if (pos > BigInt(31)) {
      runState.stack.push(BIG_ZERO$4);
      return;
    }

    runState.stack.push((word >> (BigInt(248) - (pos * BigInt(8)))) & BigInt(0xff));
  }

  async SHL (runState) {
    const a = runState.stack.pop();
    const b = runState.stack.pop();

    if (a >= BigInt(256)) {
      runState.stack.push(BIG_ZERO$4);
      return;
    }

    runState.stack.push(toUint(b << a));
  }

  async SHR (runState) {
    const a = runState.stack.pop();
    const b = runState.stack.pop();

    if (a >= BigInt(256)) {
      runState.stack.push(BIG_ZERO$4);
      return;
    }

    runState.stack.push(b >> a);
  }

  async SAR (runState) {
    const a = runState.stack.pop();
    const b = runState.stack.pop();
    const isSigned = b & SIGN_MASK;
    let r;

    if (a >= BigInt(256)) {
      if (isSigned) {
        r = MAX_INTEGER;
      } else {
        r = BIG_ZERO$4;
      }
      runState.stack.push(r);
      return;
    }

    const c = b >> a;
    if (isSigned) {
      const shiftedOutWidth = BigInt(255) - a;
      const mask = MAX_INTEGER >> shiftedOutWidth << shiftedOutWidth;

      r = c | mask;
    } else {
      r = c;
    }
    runState.stack.push(r);
  }

  async SHA3 (runState) {
    const offset = runState.stack.pop();
    const length = runState.stack.pop();
    let data = [];

    if (offset + length > BigInt(MEM_LIMIT)) {
      throw new Error('MEM_LIMIT');
    }

    if (length !== BIG_ZERO$4) {
      data = this.memLoad(runState, offset, length);
    }

    runState.stack.push(BigInt(keccak256HexPrefix(data)));
  }

  async ADDRESS (runState) {
    runState.stack.push(BigInt('0x' + runState.address));
  }

  async BALANCE (runState) {
    throw new VmError(ERROR.INSTRUCTION_NOT_SUPPORTED);
  }

  async ORIGIN (runState) {
    runState.stack.push(BigInt('0x' + runState.origin));
  }

  async CALLER (runState) {
    runState.stack.push(BigInt('0x' + runState.caller));
  }

  async CALLVALUE (runState) {
    runState.stack.push(BIG_ZERO$4);
  }

  async CALLDATALOAD (runState) {
    const pos = Number(runState.stack.pop());

    if (pos >= runState.callData.length) {
      runState.stack.push(BIG_ZERO$4);
      return;
    }

    let ret = BIG_ZERO$4;
    for (let i = 0; i < 32; i++) {
      if (pos + i < runState.callData.length) {
        const v = runState.callData[pos + i] | 0;
        ret = ret | (BigInt(v) << BigInt(248 - (i * 8)));
      }
    }

    runState.stack.push(ret);
  }

  async CALLDATASIZE (runState) {
    runState.stack.push(BigInt(runState.callData.length));
  }

  async CALLDATACOPY (runState) {
    const memOffset = runState.stack.pop();
    const dataOffset = runState.stack.pop();
    const dataLength = runState.stack.pop();

    this.memStore(runState, memOffset, runState.callData, dataOffset, dataLength);
  }

  async CODESIZE (runState) {
    runState.stack.push(BigInt(runState.code.length));
  }

  async CODECOPY (runState) {
    const memOffset = runState.stack.pop();
    const codeOffset= runState.stack.pop();
    const length = runState.stack.pop();

    this.memStore(runState, memOffset, runState.code, codeOffset, length);
  }

  async EXTCODESIZE (runState) {
    throw new VmError(ERROR.INSTRUCTION_NOT_SUPPORTED);
  }

  async EXTCODECOPY (runState) {
    throw new VmError(ERROR.INSTRUCTION_NOT_SUPPORTED);
  }

  async EXTCODEHASH (runState) {
    throw new VmError(ERROR.INSTRUCTION_NOT_SUPPORTED);
  }

  async RETURNDATASIZE (runState) {
    runState.stack.push(BigInt(runState.returnValue.length));
  }

  async RETURNDATACOPY (runState) {
    const memOffset = runState.stack.pop();
    const returnDataOffset = runState.stack.pop();
    const length = runState.stack.pop();

    if (returnDataOffset + length > BigInt(runState.returnValue.length)) {
      throw new VmError(ERROR.OUT_OF_GAS);
    }

    this.memStore(runState, memOffset, runState.returnValue, returnDataOffset, length);
  }

  async GASPRICE (runState) {
    throw new VmError(ERROR.INSTRUCTION_NOT_SUPPORTED);
  }

  async BLOCKHASH (runState) {
    throw new VmError(ERROR.INSTRUCTION_NOT_SUPPORTED);
  }

  async COINBASE (runState) {
    throw new VmError(ERROR.INSTRUCTION_NOT_SUPPORTED);
  }

  async TIMESTAMP (runState) {
    throw new VmError(ERROR.INSTRUCTION_NOT_SUPPORTED);
  }

  async NUMBER (runState) {
    throw new VmError(ERROR.INSTRUCTION_NOT_SUPPORTED);
  }

  async DIFFICULTY (runState) {
    throw new VmError(ERROR.INSTRUCTION_NOT_SUPPORTED);
  }

  async GASLIMIT (runState) {
    throw new VmError(ERROR.INSTRUCTION_NOT_SUPPORTED);
  }

  async CHAINID (runState) {
    throw new VmError(ERROR.INSTRUCTION_NOT_SUPPORTED);
  }

  async SELFBALANCE (runState) {
    throw new VmError(ERROR.INSTRUCTION_NOT_SUPPORTED);
  }

  async POP (runState) {
    runState.stack.pop();
  }

  async MLOAD (runState) {
    const pos = runState.stack.pop();

    runState.stack.push(BigInt(toHexPrefix(this.memLoad(runState, pos, BigInt(32)))));
  }

  async MSTORE (runState) {
    const offset = runState.stack.pop();
    let word = runState.stack.pop();

    word = arrayify(word.toString(16).padStart(64, '0'));
    this.memStore(runState, offset, word, BIG_ZERO$4, BigInt(32));
  }

  async MSTORE8 (runState) {
    const offset = runState.stack.pop();
    let byte = runState.stack.pop();

    // NOTE: we're using a 'trick' here to get the least significant byte
    byte = [Number(byte & BigInt(0xff))];
    this.memStore(runState, offset, byte, BIG_ZERO$4, BIG_ONE$4);
  }

  async SLOAD (runState) {
    throw new VmError(ERROR.INSTRUCTION_NOT_SUPPORTED);
  }

  async SSTORE (runState) {
    throw new VmError(ERROR.INSTRUCTION_NOT_SUPPORTED);
  }

  async JUMP (runState) {
    const dest = runState.stack.pop();

    if (dest >= BigInt(runState.code.length)) {
      throw new VmError(ERROR.INVALID_JUMP);
    }

    const destNum = Number(dest);

    if (!runState.validJumps[destNum]) {
      throw new VmError(ERROR.INVALID_JUMP);
    }

    runState.programCounter = destNum;
  }

  async JUMPI (runState) {
    const dest = runState.stack.pop();
    const cond = runState.stack.pop();

    if (cond !== BIG_ZERO$4) {
      if (dest >= BigInt(runState.code.length)) {
        throw new VmError(ERROR.INVALID_JUMP);
      }

      const destNum = Number(dest);

      if (!runState.validJumps[destNum]) {
        throw new VmError(ERROR.INVALID_JUMP);
      }

      runState.programCounter = destNum;
    }
  }

  async PC (runState) {
    runState.stack.push(BigInt(runState.programCounter - 1));
  }

  async MSIZE (runState) {
    runState.stack.push(BigInt(runState.memoryWordCount * 32));
  }

  async GAS (runState) {
    runState.stack.push(MAX_INTEGER);
  }

  async JUMPDEST (runState) {
  }

  async PUSH (runState) {
    // needs to be right-padded with zero
    const numToPush = runState.opCode - 0x5f;
    const t = new Uint8Array(numToPush);
    for (let i = 0; i < numToPush; i++) {
      const val = runState.programCounter + i;

      if (val < runState.code.length) {
        t[i] = runState.code[val];
      }
    }
    const result = BigInt(toHexPrefix(t));

    runState.programCounter += numToPush;
    runState.stack.push(result);
  }

  async DUP (runState) {
    const stackPos = runState.opCode - 0x7f;

    if (stackPos > runState.stack.length) {
      throw new VmError(ERROR.STACK_UNDERFLOW);
    }

    runState.stack.push(runState.stack[runState.stack.length - stackPos]);
  }

  async SWAP (runState) {
    const stackPos = runState.opCode - 0x8f;
    const swapIndex = runState.stack.length - stackPos - 1;

    if (swapIndex < 0) {
      throw new VmError(ERROR.STACK_UNDERFLOW);
    }

    const topIndex = runState.stack.length - 1;
    const tmp = runState.stack[topIndex];

    runState.stack[topIndex] = runState.stack[swapIndex];
    runState.stack[swapIndex] = tmp;
  }

  async LOG (runState) {
    const val = (runState.opCode - 0xa0) + 2;

    runState.stack.splice(runState.stack.length - val);
  }

  async CREATE (runState) {
    throw new VmError(ERROR.INSTRUCTION_NOT_SUPPORTED);
  }

  async CREATE2 (runState) {
    throw new VmError(ERROR.INSTRUCTION_NOT_SUPPORTED);
  }

  async CALL (runState) {
    throw new VmError(ERROR.INSTRUCTION_NOT_SUPPORTED);
  }

  async CALLCODE (runState) {
    throw new VmError(ERROR.INSTRUCTION_NOT_SUPPORTED);
  }

  async DELEGATECALL (runState) {
    throw new VmError(ERROR.INSTRUCTION_NOT_SUPPORTED);
  }

  async STATICCALL (runState) {
    const target = runState.stack[runState.stack.length - 2] || BigInt(0xff);

    if (target >= BIG_ZERO$4 && target <= BigInt(8)) {
      // gasLimit
      runState.stack.pop();
      const toAddress = runState.stack.pop();
      const inOffset = runState.stack.pop();
      const inLength = runState.stack.pop();
      const outOffset = runState.stack.pop();
      const outLength = runState.stack.pop();
      const data = this.memLoad(runState, inOffset, inLength);

      const precompile = PRECOMPILED[toAddress.toString()];
      const r = await precompile(data);

      if (r.exception === 1) {
        this.memStore(runState, outOffset, r.returnValue, BIG_ZERO$4, outLength);
        runState.returnValue = r.returnValue;
      } else {
        runState.returnValue = [];
      }

      runState.stack.push(BigInt(r.exception));

      return;
    }

    runState.returnValue = [];
    runState.stack = runState.stack.slice(0, runState.stack.length - 6);
    runState.stack.push(BIG_ZERO$4);

    throw new VmError(ERROR.INSTRUCTION_NOT_SUPPORTED);
  }

  async RETURN (runState) {
    const offset = runState.stack.pop();
    const length = runState.stack.pop();

    if (offset + length > MEM_LIMIT) {
      throw new Error('RETURN MEM_LIMIT');
    }

    runState.stopped = true;
    runState.returnValue = this.memLoad(runState, offset, length);
  }

  async REVERT (runState) {
    const offset = runState.stack.pop();
    const length = runState.stack.pop();

    runState.returnValue = this.memLoad(runState, offset, length);
    throw new VmError(ERROR.REVERT);
  }

  async SELFDESTRUCT (runState) {
    throw new VmError(ERROR.INSTRUCTION_NOT_SUPPORTED);
  }

  async INVALID (runState) {
    throw new VmError(ERROR.INVALID_OPCODE);
  }

  memStore (runState, offset, val, valOffset, length) {
    if (length === BIG_ZERO$4) {
      return;
    }

    if (offset + length > MEM_LIMIT || valOffset + length > MEM_LIMIT) {
      throw new Error('memStore MEM_LIMIT');
    }

    offset = Number(offset);
    valOffset = Number(valOffset);
    length = Number(length);

    const words = ~~((offset + length + 31) / 32);

    if (words > runState.memoryWordCount) {
      runState.memoryWordCount = words;
    }

    let safeLen = 0;
    if (valOffset + length > val.length) {
      if (valOffset >= val.length) {
        safeLen = 0;
      } else {
        safeLen = val.length - valOffset;
      }
    } else {
      safeLen = val.length;
    }

    let i = 0;

    if (safeLen > 0) {
      safeLen = safeLen > length ? length : safeLen;
      for (; i < safeLen; i++) {
        runState.memory[offset + i] = val[valOffset + i];
      }
    }

    if (val.length > 0 && i < length) {
      for (; i < length; i++) {
        runState.memory[offset + i] = 0;
      }
    }
  }

  memLoad (runState, offset, length) {
    if (length === BIG_ZERO$4) {
      return [];
    }

    if (offset + length > MEM_LIMIT) {
      throw new Error('memLoad MEM_LIMIT');
    }

    offset = Number(offset);
    length = Number(length);

    const words = ~~((offset + length + 31) / 32);

    if (words > runState.memoryWordCount) {
      runState.memoryWordCount = words;
    }

    const loaded = runState.memory.slice(offset, offset + length);

    for (let i = loaded.length; i < length; i++) {
      loaded[i] = 0;
    }

    return loaded;
  }
}

const BIG_ZERO$5 = BigInt(0);
const BIG_ONE$5 = BigInt(1);

class BrickedRuntime extends EVMRuntime {
  async initRunState (obj) {
    const runState = await super.initRunState(obj);

    runState.customEnvironment = obj.customEnvironment;
    runState.logs = [];
    runState.bridge = obj.bridge;
    runState.playgroundEnabled = !!(obj.bridge ? obj.bridge.featureFlags & 1 : 0);
    runState.isStatic = !!obj.isStatic;

    return runState;
  }

  async TIMESTAMP (runState) {
    runState.stack.push(this.timestamp);
  }

  async CHAINID (runState) {
    runState.stack.push(BigInt(runState.bridge.CHAIN_ID));
  }

  async EXTCODESIZE (runState) {
    // TODO: fetch from L1?
  }

  async LOG (runState) {
    if (runState.isStatic) {
      throw new VmError(ERROR.STATIC_STATE_CHANGE);
    }

    const offset = runState.stack.pop();
    const len = runState.stack.pop();
    const data = toHexPrefix(this.memLoad(runState, offset, len));
    const topics = [];
    let numTopics = runState.opCode - 0xa0;

    while (numTopics--) {
      topics.push('0x' + runState.stack.pop().toString(16).padStart(64, '0'));
    }

    const obj = {
      address: `0x${runState.address}`,
      topics,
      data,
    };
    runState.logs.push(obj);
  }

  async interceptCall (runState, target, dataBytes, retOffset, retSize, keepAddress, keepCaller, isStatic) {
    const targetAddressStr = target.toString(16).padStart(40, '0');

    if (!keepAddress && !keepCaller && !isStatic) {
      // if this is a CALL, then only allow this opcode for call to self.
      if (targetAddressStr !== runState.address) {
        throw new VmError(ERROR.INSTRUCTION_NOT_SUPPORTED);
      }
    }

    const code = arrayify(await runState.bridge.getCode('0x' + targetAddressStr));
    const data = dataBytes;
    const address = keepAddress ? runState.address : targetAddressStr;
    const origin = runState.origin;
    const caller = keepCaller ? runState.caller : runState.address;
    const inventory = runState.customEnvironment;
    const customEnvironment = inventory.clone();
    const bridge = runState.bridge;
    const state = await this.run(
      {
        address,
        origin,
        caller,
        code,
        data,
        customEnvironment,
        bridge,
        isStatic,
      }
    );

    const success = state.errno === 0;
    if (success) {
      inventory.storage = customEnvironment.storage;
      inventory.storageKeys = customEnvironment.storageKeys;

      runState.logs = runState.logs.concat(state.logs);
      runState.stack.push(BIG_ONE$5);
    } else {
      runState.stack.push(BIG_ZERO$5);
    }

    if (state.errno === 0 || state.errno === 7) {
      runState.returnValue = state.returnValue;
      this.memStore(runState, retOffset, runState.returnValue, BIG_ZERO$5, retSize);
    } else {
      throw new Error(`BrickedRuntime execution error ${state.errno}`);
    }
  }

  async CALL (runState) {
    // gasLimit
    runState.stack.pop();
    const starget = runState.stack.pop();
    const value = runState.stack.pop();
    const inOffset = runState.stack.pop();
    const inSize = runState.stack.pop();
    const retOffset = runState.stack.pop();
    const retSize = runState.stack.pop();
    const data = this.memLoad(runState, inOffset, inSize);

    await this.interceptCall(runState, starget, data, retOffset, retSize);
  }

  async STATICCALL (runState) {
    // skip for precompiles
    // this should basically work in all calls*, but LEVM is special
    const _target = runState.stack[runState.stack.length - 2];
    if (_target >= BIG_ZERO$5 && _target <= BigInt(8)) {
      return super.STATICCALL(runState);
    }

    // gasLimit
    runState.stack.pop();
    const target = runState.stack.pop();
    const inOffset = runState.stack.pop();
    const inSize = runState.stack.pop();
    const retOffset = runState.stack.pop();
    const retSize = runState.stack.pop();
    const data = this.memLoad(runState, inOffset, inSize);

    // TODO: state changes possible
    await this.interceptCall(runState, target, data, retOffset, retSize, false, false, true);
  }

   async CALLCODE (runState) {
     // identical to call but only use the code from `target` and stay in the context of the current contract otherwise
     // gasLimit
     runState.stack.pop();
     const starget = runState.stack.pop();
     const value = runState.stack.pop();
     const inOffset = runState.stack.pop();
     const inSize = runState.stack.pop();
     const retOffset = runState.stack.pop();
     const retSize = runState.stack.pop();
     const data = this.memLoad(runState, inOffset, inSize);

     await this.interceptCall(runState, starget, data, retOffset, retSize, true, false);
  }

  async DELEGATECALL (runState) {
    // identical to callcode but also keep caller and callvalue
    // gasLimit
    runState.stack.pop();
    const starget = runState.stack.pop();
    const inOffset = runState.stack.pop();
    const inSize = runState.stack.pop();
    const retOffset = runState.stack.pop();
    const retSize = runState.stack.pop();
    const data = this.memLoad(runState, inOffset, inSize);

    await this.interceptCall(runState, starget, data, retOffset, retSize, true, true);
  }

  async SLOAD (runState) {
    const msgSender = `0x${runState.address}`;
    const key = `0x${runState.stack.pop().toString(16).padStart(64, '0')}`;

    // TODO/FIXME: clarify that we only can modify state of our own contract
    if (msgSender === runState.bridge.rootBridge.protocolAddress) {
      const value = runState.customEnvironment.storageLoad(msgSender, key);
      runState.stack.push(BigInt(value));
    } else {
      // fetch the latest value from L1
      const value = await runState.bridge.rootBridge.fetchJson(
        'eth_getStorageAt', [msgSender, key, 'latest']
      );
      runState.stack.push(BigInt(value));
    }
  }

  async SSTORE (runState) {
    if (runState.isStatic) {
      throw new VmError(ERROR.STATIC_STATE_CHANGE);
    }

    const key = `0x${runState.stack.pop().toString(16).padStart(64, '0')}`;
    const value = `0x${runState.stack.pop().toString(16).padStart(64, '0')}`;

    runState.customEnvironment.storageStore(key, value);
  }
}

const BIG_ZERO$6 = BigInt(0);
// _InternalTransactionDeadline(uint256)
const INTERNAL_EVENT_DEADLINE_TOPIC = '0xa2f8e76d2f371a87c6d59fbc04d7af80e5a3cbd34a2d44287c97e55d25cb1dd8';

class Block$1 extends Block {
  decodeTransactionLength (buf, offset, bridge) {
    return bridge.transactionBuilder.decodeLength(buf, offset);
  }

  encodeTx (tx, bridge) {
    const encoded = bridge.transactionBuilder.encode(tx);

    return bufToHex(encoded, 0, encoded.length);
  }

  decodeTx (rawStringOrArray, bridge) {
    const bytes = arrayify(rawStringOrArray);
    const tx = bridge.transactionBuilder.decode(bytes);

    tx.to = bridge.rootBridge.protocolAddress;
    tx.nonce = this.nonces[tx.from] || BIG_ZERO$6;

    return tx;
  }

  newInventory () {
    return new Inventory();
  }

  async handleExit (data) {
    // TODO/FIXME
    // dirty hack to 'sync' storage changes
    const keccak = new Keccak256();
    if (data.isERC20) {
      const k = '0x' +
        keccak.reset()
        .update('9944279a')
        .update(data.owner)
        .update(data.address)
        .digest();
      const oldValue = BigInt(this.inventory.storage[k] || 0);
      const newValue = '0x' + (oldValue - BigInt(data.value)).toString(16).padStart(64, '0');

      this.inventory.storage[k] = newValue;
      return;
    }

    if (data.isERC721) {
      const k = '0x' +
        keccak.reset()
        .update('2cf56c4e')
        .update(data.address)
        .update(data.value)
        .digest();
      this.inventory.storage[k] = `0x${''.padStart(64, '0')}`;
    }
  }

  async addDeposit (obj, bridge) {
    await super.addDeposit(obj);
    const ret = await this.executeTx({}, bridge, false, obj);

    // TODO: save result & log events somewhere?
    if (ret.errno !== 0) {
      this.log(`Deposit error ${ret.errno}`);
    }
  }

  constructor (prevBlock) {
    super(prevBlock);

    this.inventory.rootStorage = this.inventory.storage;
  }

  async rebase (block, bridge) {
    this._isPending = true;

    return super.rebase(block, bridge);
  }

  async executeTx (tx, bridge, dry, deposit) {
    // copy the environment
    const customEnvironment = this.inventory.clone();
    let data;

    // TODO: hack, unify upstream events
    if (deposit) {
      // function onDeposit (address token, address owner, uint256 value)
      const value = arrayify(deposit.value);
      const owner = Array(12).concat(arrayify(deposit.owner));
      const token = Array(12).concat(arrayify(deposit.address));
      data = arrayify('0x412c6d50').concat(token).concat(owner).concat(value);
    } else if (!dry) {
      data = bridge.transactionBuilder.encodeCall(tx);
    } else {
      // assume eth_call
      data = arrayify(tx.data || '0x');
    }

    const address = bridge.rootBridge.protocolAddress.replace('0x', '');
    const caller = address;
    const code = arrayify(await bridge.getCode(bridge.rootBridge.protocolAddress));
    const runtime = new BrickedRuntime();

    if (this._isPending) {
      runtime.timestamp = BigInt(~~(Date.now() / 1000));
    } else {
      runtime.timestamp = BigInt(this.timestamp);
    }

    // the maximum allowed steps the call can make; this is merely to avoid infinite execution
    // TODO: estimate gas for the call on the root-chain
    runtime.stepCount = 0x1fffff;
    const state = await runtime.run({ address, caller, code, data, customEnvironment, bridge });

    // no errors and not in dry-mode = use new state
    if (state.errno === 0 && !dry) {
      this.inventory = customEnvironment;

      // check if the contract emitted deadline events
      if (this._isPending) {
        for (const log of state.logs) {
          if (log.topics.length !== 2) {
            continue;
          }

          if (log.topics[0] === INTERNAL_EVENT_DEADLINE_TOPIC) {
            const time = Number(log.topics[1]);

            if (this.submissionDeadline === 0 || time < this.submissionDeadline) {
              this.submissionDeadline = time;

              this.log(`found deadline event: ${time}`);
            }
          }
        }
      }
    }

    let returnValue = '0x';
    for (const v of state.returnValue) {
      returnValue += (v | 0).toString(16).padStart(2, '0');
    }

    return {
      errno: state.errno,
      returnValue,
      logs: state.errno === 0 ? state.logs : [],
    };
  }
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const SUPPORTED_TYPES = {
  address: 20,
  bytes: 0,
  string: 0,
  bytes32: 32,
  bytes31: 31,
  bytes30: 30,
  bytes29: 29,
  bytes28: 28,
  bytes27: 27,
  bytes26: 26,
  bytes25: 25,
  bytes24: 24,
  bytes23: 23,
  bytes22: 22,
  bytes21: 21,
  bytes20: 20,
  bytes19: 19,
  bytes18: 18,
  bytes17: 17,
  bytes16: 16,
  bytes15: 15,
  bytes14: 14,
  bytes13: 13,
  bytes12: 12,
  bytes11: 11,
  bytes10: 10,
  bytes9: 9,
  bytes8: 8,
  bytes7: 7,
  bytes6: 6,
  bytes5: 5,
  bytes4: 4,
  bytes3: 3,
  bytes2: 2,
  bytes1: 1,
  uint256: 32,
  int256: 32,
  uint248: 31,
  int248: 31,
  uint240: 30,
  int240: 30,
  uint232: 29,
  int232: 29,
  uint224: 28,
  int224: 28,
  uint216: 27,
  int216: 27,
  uint208: 26,
  int208: 26,
  uint200: 25,
  int200: 25,
  uint192: 24,
  int192: 24,
  uint184: 23,
  int184: 23,
  uint176: 22,
  int176: 22,
  uint168: 21,
  int168: 21,
  uint160: 20,
  int160: 20,
  uint152: 19,
  int152: 19,
  uint144: 18,
  int144: 18,
  uint136: 17,
  int136: 17,
  uint128: 16,
  int128: 16,
  uint120: 15,
  int120: 15,
  uint112: 14,
  int112: 14,
  uint104: 13,
  int104: 13,
  uint96: 12,
  int96: 12,
  uint88: 11,
  int88: 11,
  uint80: 10,
  int80: 10,
  uint72: 9,
  int72: 9,
  uint64: 8,
  int64: 8,
  uint56: 7,
  int56: 7,
  uint48: 6,
  int48: 6,
  uint40: 5,
  int40: 5,
  uint32: 4,
  int32: 4,
  uint24: 3,
  int24: 3,
  uint16: 2,
  int16: 2,
  uint8: 1,
  int8: 1,
};

function hash (val) {
  if (typeof val === 'string') {
    if (!val.startsWith('0x')) {
      return keccak256HexPrefix(encoder.encode(val));
    }
  }

  return keccak256HexPrefix(val);
}

function pad32 (x) {
  const v = arrayify(x);

  if (v.length === 32) {
    return v;
  }

  return Array(32 - v.length).fill(0).concat(v);
}

function decodeValue (type, typeSize, val) {
  if (type === 'string') {
    return decoder.decode(Uint8Array.from(val));
  }
  // uint
  if (type[0] === 'u') {
    const n = SUPPORTED_TYPES[type] * 8;
    return BigInt.asUintN(n, bufToHex(val, 0, typeSize));
  }
  // int
  if (type[0] === 'i') {
    const n = SUPPORTED_TYPES[type] * 8;
    return BigInt.asIntN(n, bufToHex(val, 0, typeSize));
  }

  return bufToHex(val, 0, SUPPORTED_TYPES[type] || val.length);
}

function encodeHashingValue (type, val) {
  if (type === 'string') {
    return '0x' + toHex(encoder.encode(val));
  }

  if (type === 'bytes') {
    return '0x' + toHex(arrayify(val));
  }

  const n = SUPPORTED_TYPES[type];

  // bytes
  if (type[0] === 'b') {
    return '0x' + BigInt.asUintN(n * 8, BigInt(val)).toString(16).padEnd(64, '0');
  }

  // int
  if (type[0] === 'i') {
    return '0x' + BigInt.asUintN(n * 8, BigInt(val)).toString(16).padStart(64, 'f');
  }

  // everything else
  return '0x' + BigInt.asUintN(n * 8, BigInt(val)).toString(16).padStart(64, '0');
}

function encodeValue (type, val) {
  let ret = [];

  if (type === 'string') {
    ret = Array.from(encoder.encode(val));
  } else if (type === 'bytes') {
    ret = arrayify(val);
  } else {
    const n = SUPPORTED_TYPES[type] * 8;
    const str = BigInt.asUintN(n, BigInt(val)).toString(16);
    const v = str.padStart(str.length % 2 ? str.length + 1 : str.length, '0');
    ret = arrayify(v);
  }

  const isStatic = type !== 'bytes' && type !== 'string';
  // if static then size = 1 byte else 2 bytes
  const len = ret.length.toString(16).padStart(isStatic ? 2 : 4, '0');
  ret = arrayify(len).concat(ret);

  return ret;
}

class TransactionBuilder {
  constructor (typedData) {
    const typedDataObj = typeof typedData === 'string' ? JSON.parse(typedData) : typedData;

    // TODO: merge
    this.types = typedDataObj.types;
    this.primaryTypes = typedDataObj.primaryTypes;
    this.typeHashes = {};
    this.fieldNames = {};
    this.functionSigs = {};

    for (const k in this.types) {
      // ignore EIP712Domain
      if (k === 'EIP712Domain') {
        continue;
      }
      this.typeHashes[k] = hash(this.encodeType(k));
    }

    for (const t of this.primaryTypes) {
      const fieldNames = [];

      if (this.fieldNames[t]) {
        throw new Error('should not happen');
      }

      this.fieldNames[t] = fieldNames;
      const fields = Array.from(this.types[t]).reverse();
      let todo = [];

      // initial seed
      for (const field of fields) {
        todo.push({ field, parent: [] });
      }

      while (todo.length) {
        const { field, parent, customType } = todo.pop();

        if (this.types[field.type] !== undefined) {
          // a custom type - not a primitive
          const x = this.types[field.type];
          for (let k of Array.from(x).reverse()) {
            todo.push(
              {
                field: k,
                customType: field.type,
                parent: parent.concat([field.name]),
              }
            );
          }
          continue;
        }

        if (!SUPPORTED_TYPES.hasOwnProperty(field.type)) {
          throw new TypeError(`unsupported type: ${field.type}`);
        }

        // everything else
        fieldNames.push({ name: field.name, customType, type: field.type, parent });
      }
    }

    for (const primaryType of this.primaryTypes) {
      let functionString = `on${primaryType}(address,`;
      const fields = this.fieldNames[primaryType];

      for (const field of fields) {
        functionString += field.type + ',';
      }
      functionString = functionString.slice(0, -1) + ')';

      const functionSig = hash(functionString).slice(0, 10);
      this.functionSigs[primaryType] = functionSig;
    }

    this.domainStructHash = this.structHash('EIP712Domain', typedDataObj.domain);
  }

  decode (bytes, start) {
    start = start | 0;
    let offset = start;

    const v = bytes[offset++];
    const r = bufToHex(bytes, offset, offset += 32);
    const s = bufToHex(bytes, offset, offset += 32);
    const primaryType = this.primaryTypes[bytes[offset++]];
    const root = {};

    if (!primaryType) {
      throw new Error('Unknown transaction type');
    }

    for (const field of this.fieldNames[primaryType]) {
      let obj = root;

      for (const key of field.parent) {
        let f = obj[key];
        if (!f) {
          f = {};
          obj[key] = f;
        }
        obj = f;
      }

      const encType = field.type;
      const isStatic = encType !== 'bytes' && encType !== 'string';
      // if static 1 byte else 2 bytes
      const typeSize = Number(bufToHex(bytes, offset, offset += (isStatic ? 1 : 2)));
      const val = bytes.slice(offset, offset += typeSize);

      // convert bytes to type
      const decodedValue = decodeValue(encType, typeSize, val);

      obj[field.name] = decodedValue;
    }

    const ret = {
      primaryType,
      message: root,
      v,
      r,
      s,
    };

    const typedDataHash = this.sigHash(ret);
    // TODO: support chainId parameter across all calls
    const chainId = 0;
    ret.from = recoverAddress(typedDataHash, v, r, s, chainId);
    ret.hash = keccak256HexPrefix(bytes.slice(start, offset));
    ret.size = offset - start;

    return ret;
  }

  encode (tx) {
    const transactionType = this.primaryTypes.indexOf(tx.primaryType);

    let ret = arrayify(tx.v).concat(arrayify(tx.r)).concat(arrayify(tx.s)).concat([transactionType]);

    for (const field of this.fieldNames[tx.primaryType]) {
      let value = tx.message;
      for (const p of field.parent) {
        value = value[p];
      }
      value = value[field.name];

      const encodedValue = encodeValue(field.type, value);
      ret = ret.concat(encodedValue);
    }

    return ret;
  }

  // Returns the function declaration as input for the typeHash
  encodeType (primaryType) {
    const struct = this.types[primaryType];
    const deps = [];
    const todo = [];

    for (const x of struct) {
      todo.push(x.type);
    }

    while (todo.length) {
      const type = todo.pop();

      if (type !== primaryType && this.types[type] && deps.indexOf(type) === -1) {
        deps.push(type);

        for (const x of this.types[type]) {
          todo.push(x.type);
        }
      }
    }

    let str = '';
    // primary first, then alphabetical
    for (const type of [primaryType].concat(deps.sort())) {
      const args = this.types[type].map(({ name, type }) => `${type} ${name}`).join(',');
      str += `${type}(${args})`;
    }

    return str;
  }

  encodeData (primaryType, data) {
    const encValues = [];

    // add typehash
    encValues.push(this.typeHashes[primaryType] || hash(this.encodeType(primaryType)));

    // add field contents
    for (const field of this.types[primaryType]) {
      const value = data[field.name];

      if (typeof value === 'undefined') {
        throw new Error(`${field.name} not defined`);
      }

      if (field.type === 'string' || field.type === 'bytes') {
        encValues.push(hash(encodeHashingValue(field.type, value)));
        continue;
      }

      if (this.types[field.type] !== undefined) {
        encValues.push(hash(this.encodeData(field.type, value)));
        continue;
      }

      encValues.push(encodeHashingValue(field.type, value));
    }

    return '0x' + encValues.flatMap(v => v.replace('0x', '')).join('');
  }

  structHash (primaryType, data) {
    return hash(this.encodeData(primaryType, data));
  }

  sigHash (tx) {
    return hash(
      '0x1901' +
      this.domainStructHash.replace('0x', '') +
      this.structHash(tx.primaryType, tx.message).replace('0x', '')
    );
  }

  info () {
    const ret = {
      EIP712Domain: {
        domainStructHash: this.domainStructHash
      }
    };

    for (const key of this.primaryTypes) {
      if (ret[key]) {
        continue;
      }

      const encodedType = this.encodeType(key);
      const typeHash = this.typeHashes[key];
      const functionSig = this.functionSigs[key];

      let functionString = `on${key}(address,`;
      for (const field of this.fieldNames[key]) {
        functionString += field.type + ',';
      }
      functionString = functionString.slice(0, -1) + ')';

      ret[key] = { encodedType, typeHash, functionSig, functionString };
    }

    return ret;
  }

  encodeCall (tx) {
    const fields = this.fieldNames[tx.primaryType];
    const functionSig = this.functionSigs[tx.primaryType];
    // order for head and tail
    // first one is always transaction sender
    let headSize = 32;
    for (const field of fields) {
      headSize += 32;
    }

    let head = arrayify(functionSig).concat(pad32(tx.from));
    let tail = [];
    for (const field of fields) {
      const isStatic = field.type !== 'bytes' && field.type !== 'string';

      let fieldValue = tx.message;
      for (const p of field.parent) {
        fieldValue = fieldValue[p];
      }
      fieldValue = fieldValue[field.name];

      if (isStatic) {
        head = head.concat(arrayify(encodeHashingValue(field.type, fieldValue)));
      } else {
        head = head.concat(pad32(headSize));

        const v = field.type === 'string' ? Array.from(encoder.encode(fieldValue)) : arrayify(fieldValue);
        const p = 32 * ~~((v.length + 31) / 32);

        headSize += 32 + p;
        tail = tail.concat(pad32(v.length));
        tail = tail.concat(v).concat(Array(p - v.length).fill(0));
      }
    }

    return head.concat(tail);
  }

  decodeLength (bytes, _offset) {
    const start = _offset | 0;
    let offset = start;

    // v, r, s
    offset += 65;
    const primaryType = this.primaryTypes[bytes[offset++]];

    if (!primaryType) {
      return offset - start;
    }

    for (const field of this.fieldNames[primaryType]) {
      const encType = field.type;
      const isStatic = encType !== 'bytes' && encType !== 'string';
      // if static 1 byte else 2 bytes
      const typeSize = Number(bufToHex(bytes, offset, offset += (isStatic ? 1 : 2)));
      offset += typeSize;
    }

    return offset - start;
  }
}

/// @dev Glue for everything.
class Bridge$1 extends Bridge {
  constructor (options) {
    super(options, Block$1);

    this.transactionBuilder = new TransactionBuilder(options.typedData);
  }
}

async function startServer (bridge, { host, rpcPort }) {
  function log (...args) {
    console.log('Server:', ...args);
  }

  function onRequest (req, resp) {
    resp.sendDate = false;
    resp.setHeader('Access-Control-Allow-Origin', '*');

    if (req.method === 'POST') {
      const maxLen = 8 << 20;
      const len = parseInt(req.headers['content-length'] || maxLen);

      if (len > maxLen) {
        resp.writeHead(413);
        resp.end();
        return;
      }

      let body = '';

      req.on('data', function (buf) {
        body += buf.toString();

        // this is actually not correct but we also do not expect unicode
        if (body.length > len) {
          resp.abort();
        }
      });

      req.on('end', async function () {
        try {
          const obj = JSON.parse(body);

          log(obj.method);
          resp.end(JSON.stringify(await bridge.rpcCall(obj)));
        } catch (e) {
          resp.writeHead(400);
          resp.end();
        }
      });

      return;
    }

    resp.setHeader('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept, X-Requested-With');
    resp.end();
  }
  // TODO:
  // - start the server after the bridge is properly initialized
  // - allow for a https option (path to cert/key)
  // - use HTTP/2

  // lazy import
  const esm = await import('http');
  const server = new esm.default.Server(onRequest);
  // timeout after 120 seconds
  server.timeout = 120000;
  server.listen(rpcPort, host);

  log(`listening on ${host}:${rpcPort}`);
}

export { Block$1 as Block, BrickedRuntime, Bridge$1 as Bridge, Inventory, TransactionBuilder, startServer };
