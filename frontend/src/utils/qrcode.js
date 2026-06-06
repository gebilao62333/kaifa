export const QRCodeErrorCorrectLevel = {
  L: 1,
  M: 0,
  Q: 3,
  H: 2
};

const QRMode = {
  MODE_NUMBER: 1 << 0,
  MODE_ALPHANUM: 1 << 1,
  MODE_8BIT_BYTE: 1 << 2,
  MODE_KANJI: 1 << 3
};

const QRMaskPattern = {
  PATTERN000: 0,
  PATTERN001: 1,
  PATTERN010: 2,
  PATTERN011: 3,
  PATTERN100: 4,
  PATTERN101: 5,
  PATTERN110: 6,
  PATTERN111: 7
};

class QRUtil {
  static getPatternPosition(i) {
    const positions = [
      [6, 18], [18, 6], [22, 6], [34, 6], [6, 22], [22, 22], [34, 22],
      [6, 34], [18, 34], [22, 34], [34, 34], [6, 46], [18, 46], [22, 46],
      [34, 46], [6, 58], [18, 58], [22, 58], [34, 58], [6, 70], [18, 70],
      [22, 70], [34, 70], [6, 82], [18, 82], [22, 82], [34, 82], [6, 94],
      [18, 94], [22, 94], [34, 94], [6, 106], [18, 106], [22, 106], [34, 106],
      [6, 118], [18, 118], [22, 118], [34, 118], [6, 130], [18, 130], [22, 130],
      [34, 130], [6, 142], [18, 142], [22, 142], [34, 142]
    ];
    return positions[i] || [0, 0];
  }

  static getMask(maskPattern, i, j) {
    switch (maskPattern) {
      case QRMaskPattern.PATTERN000: return (i + j) % 2 === 0;
      case QRMaskPattern.PATTERN001: return i % 2 === 0;
      case QRMaskPattern.PATTERN010: return j % 3 === 0;
      case QRMaskPattern.PATTERN011: return (i + j) % 3 === 0;
      case QRMaskPattern.PATTERN100: return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0;
      case QRMaskPattern.PATTERN101: return (i * j) % 2 + (i * j) % 3 === 0;
      case QRMaskPattern.PATTERN110: return ((i * j) % 2 + (i * j) % 3) % 2 === 0;
      case QRMaskPattern.PATTERN111: return ((i * j) % 3 + (i + j) % 2) % 2 === 0;
      default: return false;
    }
  }

  static getErrorCorrectPolynomial(errorCorrectLength) {
    let a = [1];
    for (let i = 0; i < errorCorrectLength; i++) {
      a = QRUtil.multiply(a, [1, QRUtil.gexp(i)]);
    }
    return a;
  }

  static multiply(a, b) {
    const r = new Array(a.length + b.length - 1);
    for (let i = 0; i < a.length; i++) {
      for (let j = 0; j < b.length; j++) {
        r[i + j] ^= QRUtil.gexp(QRUtil.glog(a[i]) + QRUtil.glog(b[j]));
      }
    }
    return r;
  }

  static gexp(n) {
    while (n < 0) n += 255;
    while (n >= 256) n -= 255;
    return QRUtil.EXP_TABLE[n];
  }

  static glog(n) {
    if (n < 1) throw new Error('glog(' + n + ')');
    return QRUtil.LOG_TABLE[n];
  }

  static stringToBytes(s) {
    const bytes = [];
    for (let i = 0; i < s.length; i++) {
      bytes.push(s.charCodeAt(i));
    }
    return bytes;
  }
}

QRUtil.EXP_TABLE = new Array(256);
QRUtil.LOG_TABLE = new Array(256);
for (let i = 0; i < 8; i++) {
  QRUtil.EXP_TABLE[i] = 1 << i;
}
for (let i = 8; i < 256; i++) {
  QRUtil.EXP_TABLE[i] = QRUtil.EXP_TABLE[i - 4] ^ QRUtil.EXP_TABLE[i - 5] ^ QRUtil.EXP_TABLE[i - 6] ^ QRUtil.EXP_TABLE[i - 8];
}
for (let i = 0; i < 255; i++) {
  QRUtil.LOG_TABLE[QRUtil.EXP_TABLE[i]] = i;
}

class QRMath {
  static mod(num, mod) {
    return ((num % mod) + mod) % mod;
  }
}

class QRRSBlock {
  constructor(totalCount, dataCount) {
    this.totalCount = totalCount;
    this.dataCount = dataCount;
  }
}

QRRSBlock.RS_BLOCK_TABLE = [
  [1, 26, 19], [1, 26, 16], [1, 26, 13], [1, 26, 9],
  [1, 44, 34], [1, 44, 28], [1, 44, 22], [1, 44, 16],
  [1, 70, 55], [1, 70, 44], [2, 35, 17], [2, 35, 13],
  [1, 100, 80], [2, 50, 32], [2, 50, 24], [4, 25, 9],
  [1, 134, 108], [2, 67, 43], [2, 33, 15, 2, 34, 16], [2, 33, 11, 2, 34, 12],
  [2, 86, 68], [4, 43, 27], [4, 43, 19], [4, 43, 15],
  [2, 98, 78], [4, 49, 31], [2, 32, 14, 4, 33, 15], [4, 39, 13, 1, 40, 14],
  [2, 121, 97], [2, 60, 38, 2, 61, 39], [4, 40, 18, 2, 41, 19], [4, 40, 14, 2, 41, 15],
  [2, 146, 116], [3, 58, 36, 2, 59, 37], [4, 36, 16, 4, 37, 17], [4, 36, 12, 4, 37, 13],
  [2, 86, 68, 2, 87, 69], [4, 69, 43, 1, 70, 44], [6, 43, 19, 2, 44, 20], [6, 43, 15, 2, 44, 16],
  [4, 101, 81], [1, 80, 50, 4, 81, 51], [4, 50, 22, 4, 51, 23], [3, 36, 12, 8, 37, 13],
  [2, 116, 92, 2, 117, 93], [6, 58, 36, 2, 59, 37], [4, 46, 20, 6, 47, 21], [7, 42, 14, 4, 43, 15],
  [4, 133, 107], [8, 59, 37, 1, 60, 38], [8, 44, 20, 4, 45, 21], [12, 33, 11, 4, 34, 12],
  [3, 145, 115, 1, 146, 116], [4, 64, 40, 5, 65, 41], [11, 36, 16, 5, 37, 17], [11, 36, 12, 5, 37, 13],
  [5, 109, 87, 1, 110, 88], [5, 65, 41, 5, 66, 42], [5, 54, 24, 7, 55, 25], [11, 36, 12],
  [5, 122, 98, 1, 123, 99], [7, 73, 45, 3, 74, 46], [15, 43, 19, 2, 44, 20], [3, 45, 15, 13, 46, 16],
  [1, 135, 107, 5, 136, 108], [10, 74, 46, 1, 75, 47], [1, 50, 22, 15, 51, 23], [2, 42, 14, 17, 43, 15],
  [5, 150, 120, 1, 151, 121], [9, 69, 43, 4, 70, 44], [17, 50, 22, 1, 51, 23], [2, 42, 14, 19, 43, 15],
  [3, 141, 113, 4, 142, 114], [3, 70, 44, 11, 71, 45], [17, 47, 21, 4, 48, 22], [9, 39, 13, 16, 40, 14],
  [3, 135, 107, 5, 136, 108], [3, 67, 41, 13, 68, 42], [15, 54, 24, 5, 55, 25], [15, 43, 15, 10, 44, 16],
  [4, 144, 116, 4, 145, 117], [17, 68, 42], [17, 50, 22, 6, 51, 23], [19, 46, 16, 6, 47, 17],
  [2, 139, 111, 7, 140, 112], [17, 73, 45], [7, 54, 24, 16, 55, 25], [34, 37, 13],
  [4, 151, 121, 5, 152, 122], [4, 75, 47, 14, 76, 48], [11, 54, 24, 14, 55, 25], [16, 45, 15, 14, 46, 16],
  [6, 147, 117, 4, 148, 118], [6, 73, 45, 14, 74, 46], [11, 54, 24, 16, 55, 25], [30, 46, 16, 2, 47, 17],
  [8, 132, 106, 4, 133, 107], [8, 75, 47, 13, 76, 48], [7, 54, 24, 22, 55, 25], [22, 45, 15, 13, 46, 16],
  [10, 142, 114, 2, 143, 115], [19, 74, 46, 4, 75, 47], [28, 50, 22, 6, 51, 23], [33, 46, 16, 4, 47, 17],
  [8, 152, 122, 4, 153, 123], [22, 73, 45, 3, 74, 46], [8, 53, 23, 26, 54, 24], [12, 45, 15, 28, 46, 16],
  [3, 147, 117, 10, 148, 118], [3, 73, 45, 23, 74, 46], [4, 54, 24, 31, 55, 25], [11, 45, 15, 31, 46, 16],
  [7, 146, 116, 7, 147, 117], [21, 73, 45, 7, 74, 46], [1, 53, 23, 37, 54, 24], [19, 45, 15, 26, 46, 16],
  [5, 145, 115, 10, 146, 116], [19, 75, 47, 10, 76, 48], [15, 54, 24, 25, 55, 25], [23, 45, 15, 25, 46, 16],
  [13, 145, 115, 3, 146, 116], [2, 73, 45, 29, 74, 46], [42, 54, 24, 1, 55, 25], [23, 45, 15, 28, 46, 16],
  [17, 145, 115], [10, 74, 46, 23, 75, 47], [10, 54, 24, 35, 55, 25], [19, 45, 15, 35, 46, 16],
  [17, 145, 115, 1, 146, 116], [14, 74, 46, 21, 75, 47], [29, 54, 24, 19, 55, 25], [11, 45, 15, 46, 46, 16],
  [13, 145, 115, 6, 146, 116], [14, 74, 46, 23, 75, 47], [44, 54, 24, 7, 55, 25], [59, 46, 16, 1, 47, 17],
  [12, 151, 121, 7, 152, 122], [12, 75, 47, 26, 76, 48], [39, 54, 24, 14, 55, 25], [22, 45, 15, 41, 46, 16],
  [6, 151, 121, 14, 152, 122], [6, 75, 47, 34, 76, 48], [46, 54, 24, 10, 55, 25], [2, 45, 15, 64, 46, 16],
  [17, 152, 122, 4, 153, 123], [29, 74, 46, 14, 75, 47], [49, 54, 24, 10, 55, 25], [24, 45, 15, 46, 46, 16],
  [4, 152, 122, 18, 153, 123], [13, 74, 46, 32, 75, 47], [48, 54, 24, 14, 55, 25], [42, 45, 15, 32, 46, 16],
  [20, 147, 117, 4, 148, 118], [40, 75, 47, 7, 76, 48], [43, 54, 24, 22, 55, 25], [10, 45, 15, 67, 46, 16],
  [19, 148, 118, 6, 149, 119], [18, 75, 47, 31, 76, 48], [34, 54, 24, 34, 55, 25], [20, 45, 15, 61, 46, 16]
];

class QRData {
  constructor(mode, data) {
    this.mode = mode;
    this.data = data;
    this.parsedData = QRData.getBytes(data, mode);
  }

  static getBytes(data, mode) {
    if (mode === QRMode.MODE_8BIT_BYTE) {
      return QRUtil.stringToBytes(data);
    }
    return [];
  }

  getLength() {
    return this.parsedData.length;
  }
}

class QRCodeModel {
  constructor(typeNumber, errorCorrectLevel) {
    this.typeNumber = typeNumber;
    this.errorCorrectLevel = errorCorrectLevel;
    this.modules = null;
    this.moduleCount = 0;
    this.dataCache = null;
    this.dataList = [];
  }

  addData(data) {
    const newData = new QRData(QRMode.MODE_8BIT_BYTE, data);
    this.dataList.push(newData);
    this.dataCache = null;
  }

  isDark(row, col) {
    if (row < 0 || this.moduleCount <= row || col < 0 || this.moduleCount <= col) {
      throw new Error(`${row}, ${col}`);
    }
    return this.modules[row][col];
  }

  getModuleCount() {
    return this.moduleCount;
  }

  make() {
    this.moduleCount = this.typeNumber * 4 + 17;
    this.modules = new Array(this.moduleCount);
    for (let row = 0; row < this.moduleCount; row++) {
      this.modules[row] = new Array(this.moduleCount);
      for (let col = 0; col < this.moduleCount; col++) {
        this.modules[row][col] = false;
      }
    }
    this.setupPositionProbePattern(0, 0);
    this.setupPositionProbePattern(this.moduleCount - 7, 0);
    this.setupPositionProbePattern(0, this.moduleCount - 7);
    this.setupPositionAdjustPattern();
    this.setupTimingPattern();
    this.setupTypeInfo(this.errorCorrectLevel);
    if (this.typeNumber >= 7) {
      this.setupTypeNumber();
    }
    this.makeImpl(false, this.getBestMaskPattern());
  }

  setupPositionProbePattern(row, col) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        if (row + r <= -1 || this.moduleCount <= row + r || col + c <= -1 || this.moduleCount <= col + c) continue;
        this.modules[row + r][col + c] = (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
                                         (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
                                         (r >= 2 && r <= 4 && c >= 2 && c <= 4);
      }
    }
  }

  setupTimingPattern() {
    for (let r = 8; r < this.moduleCount - 8; r++) {
      if (this.modules[r][6]) continue;
      this.modules[r][6] = (r % 2 === 0);
    }
    for (let c = 8; c < this.moduleCount - 8; c++) {
      if (this.modules[6][c]) continue;
      this.modules[6][c] = (c % 2 === 0);
    }
  }

  setupPositionAdjustPattern() {
    const pos = QRCodeModel.getPatternPosition(this.typeNumber);
    for (let i = 0; i < pos.length; i += 2) {
      const row = pos[i];
      const col = pos[i + 1];
      for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
          this.modules[row + r][col + c] = (r === -2 || r === 2 || c === -2 || c === 2 ||
                                            (r === 0 && c === 0));
        }
      }
    }
  }

  setupTypeInfo(errorCorrectLevel) {
    let data = (errorCorrectLevel << 3) | 0;
    const mask = 0x537;
    let bits = QRCodeModel.createData(1, data);
    for (let i = 0; i < 15; i++) {
      const mod = QRUtil.getMask(0, Math.floor(i / 3), i % 3);
      if (mod) bits[i] ^= 1;
    }
    for (let i = 0; i < 15; i++) {
      const r = Math.floor(i / 3);
      const c = i % 3 === 0 ? 0 : (i % 3 === 1 ? 6 : this.moduleCount - 1);
      if (r < 6) {
        this.modules[r][c] = (bits[i] === 1);
      } else {
        this.modules[c][r - 6] = (bits[i] === 1);
      }
    }
  }

  setupTypeNumber() {
    const bits = QRCodeModel.createData(1, this.typeNumber);
    for (let i = 0; i < 18; i++) {
      const mod = QRUtil.getMask(0, Math.floor(i / 3), i % 3);
      const r = Math.floor(i / 3);
      const c = i % 3;
      this.modules[r][this.moduleCount - 11 + c] = ((bits[i] ^ (mod ? 1 : 0)) === 1);
    }
    for (let i = 0; i < 18; i++) {
      const mod = QRUtil.getMask(0, Math.floor(i / 3), i % 3);
      const r = Math.floor(i / 3);
      const c = i % 3;
      this.modules[this.moduleCount - 11 + c][r] = ((bits[i] ^ (mod ? 1 : 0)) === 1);
    }
  }

  makeImpl(test, maskPattern) {
    for (let r = 0; r < this.moduleCount; r++) {
      for (let c = 0; c < this.moduleCount; c++) {
        if (!this.modules[r][c]) {
          const mod = QRUtil.getMask(maskPattern, r, c);
          this.modules[r][c] = mod;
        }
      }
    }
    const data = this.getData();
    let index = 0;
    for (let r = this.moduleCount - 1; r > 0; r -= 2) {
      if (r === 6) r--;
      for (let c = this.moduleCount - 1; c >= 0; c--) {
        for (let rc = 0; rc < 2; rc++) {
          const row = r - rc;
          if (!this.modules[row][c] && index < data.length) {
            this.modules[row][c] = (data[index] === 1);
            index++;
          }
        }
      }
    }
  }

  getBestMaskPattern() {
    let minLostPoint = 0;
    let pattern = 0;
    for (let i = 0; i < 8; i++) {
      this.makeImpl(true, i);
      const lostPoint = this.getLostPoint();
      if (i === 0 || minLostPoint > lostPoint) {
        minLostPoint = lostPoint;
        pattern = i;
      }
    }
    return pattern;
  }

  getLostPoint() {
    let lostPoint = 0;
    for (let r = 0; r < this.moduleCount; r++) {
      for (let c = 0; c < this.moduleCount; c++) {
        let sameCount = 0;
        const dark = this.modules[r][c];
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            if (r + dr < 0 || this.moduleCount <= r + dr ||
                c + dc < 0 || this.moduleCount <= c + dc) continue;
            if (dark === this.modules[r + dr][c + dc]) sameCount++;
          }
        }
        if (sameCount > 5) lostPoint += (3 + sameCount - 5);
      }
    }
    for (let r = 0; r < this.moduleCount - 1; r++) {
      for (let c = 0; c < this.moduleCount - 1; c++) {
        let count = 0;
        if (this.modules[r][c]) count++;
        if (this.modules[r + 1][c]) count++;
        if (this.modules[r][c + 1]) count++;
        if (this.modules[r + 1][c + 1]) count++;
        if (count === 0 || count === 4) lostPoint += 3;
      }
    }
    for (let r = 0; r < this.moduleCount; r++) {
      for (let c = 0; c < this.moduleCount - 6; c++) {
        if (this.modules[r][c] && !this.modules[r][c + 1] &&
            this.modules[r][c + 2] && this.modules[r][c + 3] &&
            this.modules[r][c + 4] && !this.modules[r][c + 5] &&
            this.modules[r][c + 6]) {
          lostPoint += 40;
        }
      }
    }
    for (let c = 0; c < this.moduleCount; c++) {
      for (let r = 0; r < this.moduleCount - 6; r++) {
        if (this.modules[r][c] && !this.modules[r + 1][c] &&
            this.modules[r + 2][c] && this.modules[r + 3][c] &&
            this.modules[r + 4][c] && !this.modules[r + 5][c] &&
            this.modules[r + 6][c]) {
          lostPoint += 40;
        }
      }
    }
    let darkCount = 0;
    for (let r = 0; r < this.moduleCount; r++) {
      for (let c = 0; c < this.moduleCount; c++) {
        if (this.modules[r][c]) darkCount++;
      }
    }
    const ratio = Math.abs((darkCount * 100) / (this.moduleCount * this.moduleCount) - 50) / 5;
    lostPoint += ratio * 10;
    return lostPoint;
  }

  getData() {
    if (this.dataCache) return this.dataCache;
    let totalDataCount = 0;
    for (let i = 0; i < this.dataList.length; i++) {
      totalDataCount += this.dataList[i].getLength();
    }
    const rsBlocks = QRCodeModel.getRSBlocks(this.typeNumber, this.errorCorrectLevel);
    let buffer = [];
    for (let i = 0; i < this.dataList.length; i++) {
      const data = this.dataList[i];
      buffer.push((data.mode << 4) | data.getLength());
      for (let j = 0; j < data.parsedData.length; j++) {
        buffer.push(data.parsedData[j]);
      }
    }
    const totalCodeCount = rsBlocks[0].totalCount * rsBlocks.length;
    while (buffer.length * 8 + 4 <= totalCodeCount * 8 - 4) {
      buffer.push(0);
    }
    buffer.push(0);
    while (buffer.length * 8 % 8 !== 0) {
      buffer.push(0);
    }
    this.dataCache = QRCodeModel.createData(totalCodeCount, buffer);
    return this.dataCache;
  }

  static getPatternPosition(typeNumber) {
    const positions = [
      [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42],
      [6, 26, 46], [6, 28, 50], [6, 30, 54], [6, 32, 58], [6, 34, 62], [6, 26, 46, 66],
      [6, 26, 48, 70], [6, 26, 50, 74], [6, 30, 54, 78], [6, 30, 56, 82], [6, 30, 58, 86],
      [6, 34, 62, 90], [6, 28, 50, 72, 94], [6, 26, 50, 74, 98], [6, 30, 54, 78, 102],
      [6, 28, 54, 80, 106], [6, 32, 58, 84, 110], [6, 30, 58, 86, 114], [6, 34, 62, 90, 118],
      [6, 26, 50, 74, 98, 122], [6, 30, 54, 78, 102, 126], [6, 26, 52, 78, 104, 130],
      [6, 30, 56, 82, 108, 134], [6, 34, 60, 86, 112, 138], [6, 30, 58, 86, 114, 142],
      [6, 34, 62, 90, 118, 146], [6, 30, 54, 78, 102, 126, 150], [6, 24, 50, 76, 102, 128, 154],
      [6, 28, 54, 80, 106, 132, 158], [6, 32, 58, 84, 110, 136, 162], [6, 26, 54, 82, 110, 138, 166],
      [6, 30, 58, 86, 114, 142, 170]
    ];
    return positions[typeNumber - 1] || [];
  }

  static getRSBlocks(typeNumber, errorCorrectLevel) {
    const rsBlock = QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + errorCorrectLevel];
    const length = rsBlock.length / 3;
    const list = [];
    for (let i = 0; i < length; i++) {
      const count = rsBlock[i * 3 + 0];
      const totalCount = rsBlock[i * 3 + 1];
      const dataCount = rsBlock[i * 3 + 2];
      for (let j = 0; j < count; j++) {
        list.push(new QRRSBlock(totalCount, dataCount));
      }
    }
    return list;
  }

  static createData(totalCodeCount, data) {
    const rsBlocks = QRCodeModel.getRSBlocksFromTotal(totalCodeCount, data.length);
    const offset = 0;
    const dcData = [];
    const ecData = [];
    for (let i = 0; i < rsBlocks.length; i++) {
      const dcCount = rsBlocks[i].dataCount;
      const ecCount = rsBlocks[i].totalCount - dcCount;
      for (let j = 0; j < dcCount; j++) {
        dcData.push(data[offset + i * dcCount + j]);
      }
      const poly = QRUtil.getErrorCorrectPolynomial(ecCount);
      const raw = [];
      for (let j = 0; j < dcCount; j++) {
        raw.push(data[offset + i * dcCount + j]);
      }
      for (let j = 0; j < ecCount; j++) {
        raw.push(0);
      }
      for (let j = dcCount - 1; j >= 0; j--) {
        const coef = raw[j];
        if (coef !== 0) {
          for (let k = ecCount - 1; k >= 0; k--) {
            raw[j + k + 1] ^= QRUtil.gexp(QRUtil.glog(coef) + QRUtil.glog(poly[k]));
          }
        }
      }
      for (let j = 0; j < ecCount; j++) {
        ecData.push(raw[dcCount + j]);
      }
    }
    const rsBlockCount = rsBlocks.length;
    const maxDcCount = Math.max(...rsBlocks.map(r => r.dataCount));
    const maxEcCount = Math.max(...rsBlocks.map(r => r.totalCount - r.dataCount));
    let index = 0;
    const result = [];
    for (let i = 0; i < maxDcCount; i++) {
      for (let j = 0; j < rsBlockCount; j++) {
        if (i < rsBlocks[j].dataCount) {
          result.push(data[index]);
          index++;
        }
      }
    }
    for (let i = 0; i < maxEcCount; i++) {
      for (let j = 0; j < rsBlockCount; j++) {
        if (i < rsBlocks[j].totalCount - rsBlocks[j].dataCount) {
          result.push(ecData[j * maxEcCount + i]);
        }
      }
    }
    return result;
  }

  static getRSBlocksFromTotal(totalCodeCount, dataCount) {
    const rsBlockCount = Math.ceil(totalCodeCount / 256);
    const blocks = [];
    const baseCount = Math.floor(totalCodeCount / rsBlockCount);
    const remainder = totalCodeCount % rsBlockCount;
    for (let i = 0; i < rsBlockCount; i++) {
      const count = baseCount + (i < remainder ? 1 : 0);
      blocks.push(new QRRSBlock(count, Math.floor(count * 0.7)));
    }
    return blocks;
  }
}

export const generateQRCode = (text, options = {}) => {
  const { width = 200, margin = 4 } = options;
  
  let typeNumber = 1;
  const maxLengths = [25, 47, 77, 114, 154, 192, 230, 271, 321, 367, 425, 458, 520, 586, 644, 718, 792, 858, 929, 1003];
  for (let i = 0; i < maxLengths.length; i++) {
    if (text.length <= maxLengths[i]) {
      typeNumber = i + 1;
      break;
    }
  }
  
  const qr = new QRCodeModel(typeNumber, QRCodeErrorCorrectLevel.H);
  qr.addData(text);
  qr.make();
  
  const moduleCount = qr.getModuleCount();
  const size = width - margin * 2;
  const moduleSize = size / moduleCount;
  
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${width}" viewBox="0 0 ${width} ${width}">`;
  svg += `<rect width="100%" height="100%" fill="white"/>`;
  
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (qr.isDark(row, col)) {
        const x = margin + col * moduleSize;
        const y = margin + row * moduleSize;
        svg += `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="black"/>`;
      }
    }
  }
  svg += '</svg>';
  
  const base64 = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  
  return {
    success: true,
    svg,
    base64,
    text
  };
};

export default {
  generateQRCode,
  QRCodeErrorCorrectLevel
};
