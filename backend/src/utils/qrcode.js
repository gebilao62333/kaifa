var QRCode;
(function (QRCode) {
    var QRErrorCorrectLevel;
    (function (QRErrorCorrectLevel) {
        QRErrorCorrectLevel[QRErrorCorrectLevel["L"] = 1] = "L";
        QRErrorCorrectLevel[QRErrorCorrectLevel["M"] = 0] = "M";
        QRErrorCorrectLevel[QRErrorCorrectLevel["Q"] = 3] = "Q";
        QRErrorCorrectLevel[QRErrorCorrectLevel["H"] = 2] = "H";
    })(QRErrorCorrectLevel = QRCode.QRErrorCorrectLevel || (QRCode.QRErrorCorrectLevel = {}));
    var QRMode;
    (function (QRMode) {
        QRMode[QRMode["MODE_NUMBER"] = 1] = "MODE_NUMBER";
        QRMode[QRMode["MODE_ALPHA_NUM"] = 2] = "MODE_ALPHA_NUM";
        QRMode[QRMode["MODE_8BIT_BYTE"] = 4] = "MODE_8BIT_BYTE";
        QRMode[QRMode["MODE_KANJI"] = 8] = "MODE_KANJI";
    })(QRMode = QRCode.QRMode || (QRCode.QRMode = {}));
    var QRMaskPattern;
    (function (QRMaskPattern) {
        QRMaskPattern[QRMaskPattern["PATTERN000"] = 0] = "PATTERN000";
        QRMaskPattern[QRMaskPattern["PATTERN001"] = 1] = "PATTERN001";
        QRMaskPattern[QRMaskPattern["PATTERN010"] = 2] = "PATTERN010";
        QRMaskPattern[QRMaskPattern["PATTERN011"] = 3] = "PATTERN011";
        QRMaskPattern[QRMaskPattern["PATTERN100"] = 4] = "PATTERN100";
        QRMaskPattern[QRMaskPattern["PATTERN101"] = 5] = "PATTERN101";
        QRMaskPattern[QRMaskPattern["PATTERN110"] = 6] = "PATTERN110";
        QRMaskPattern[QRMaskPattern["PATTERN111"] = 7] = "PATTERN111";
    })(QRMaskPattern = QRCode.QRMaskPattern || (QRCode.QRMaskPattern = {}));
    var QRUtil;
    (function (QRUtil) {
        QRUtil.PATTERN_POSITION_TABLE = [
            [],
            [6, 18],
            [6, 22],
            [6, 26],
            [6, 30],
            [6, 34],
            [6, 22, 38],
            [6, 24, 42],
            [6, 26, 46],
            [6, 28, 50],
            [6, 30, 54],
            [6, 32, 58],
            [6, 34, 62],
            [6, 26, 46, 66],
            [6, 26, 48, 70],
            [6, 26, 50, 74],
            [6, 30, 54, 78],
            [6, 30, 56, 82],
            [6, 30, 58, 86],
            [6, 34, 62, 90],
            [6, 28, 50, 72, 94],
            [6, 26, 50, 74, 98],
            [6, 30, 54, 78, 102],
            [6, 28, 54, 80, 106],
            [6, 32, 58, 84, 110],
            [6, 30, 58, 86, 114],
            [6, 34, 62, 90, 118],
            [6, 26, 50, 74, 98, 122],
            [6, 30, 54, 78, 102, 126],
            [6, 26, 52, 78, 104, 130],
            [6, 30, 56, 82, 108, 134],
            [6, 34, 60, 86, 112, 138],
            [6, 30, 58, 86, 114, 142],
            [6, 34, 62, 90, 118, 146],
            [6, 30, 54, 78, 102, 126, 150],
            [6, 24, 50, 76, 102, 128, 154],
            [6, 28, 54, 80, 106, 132, 158],
            [6, 32, 58, 84, 110, 136, 162],
            [6, 26, 54, 82, 110, 138, 166],
            [6, 30, 58, 86, 114, 142, 170]
        ];
        QRUtil.G15 = (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0);
        QRUtil.G18 = (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0);
        QRUtil.G15_MASK = (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1);
        QRUtil.ALPHANUMERIC_TABLE = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";
        QRUtil.getBCHTypeInfo = function (data) {
            var d = data << 10;
            while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15) >= 0) {
                d ^= (QRUtil.G15 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15)));
            }
            return ((data << 10) | d) ^ QRUtil.G15_MASK;
        };
        QRUtil.getBCHTypeNumber = function (data) {
            var d = data << 12;
            while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18) >= 0) {
                d ^= (QRUtil.G18 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18)));
            }
            return (data << 12) | d;
        };
        QRUtil.getBCHDigit = function (data) {
            var digit = 0;
            while (data !== 0) {
                digit++;
                data >>>= 1;
            }
            return digit;
        };
        QRUtil.getPatternPosition = function (typeNumber) {
            return QRUtil.PATTERN_POSITION_TABLE[typeNumber - 1];
        };
        QRUtil.getMask = function (maskPattern, i, j) {
            switch (maskPattern) {
                case QRMaskPattern.PATTERN000: return (i + j) % 2 === 0;
                case QRMaskPattern.PATTERN001: return i % 2 === 0;
                case QRMaskPattern.PATTERN010: return j % 3 === 0;
                case QRMaskPattern.PATTERN011: return (i + j) % 3 === 0;
                case QRMaskPattern.PATTERN100: return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0;
                case QRMaskPattern.PATTERN101: return (i * j) % 2 + (i * j) % 3 === 0;
                case QRMaskPattern.PATTERN110: return ((i * j) % 2 + (i * j) % 3) % 2 === 0;
                case QRMaskPattern.PATTERN111: return ((i * j) % 3 + (i + j) % 2) % 2 === 0;
                default:
                    throw new Error("bad maskPattern:" + maskPattern);
            }
        };
        QRUtil.charCountIndicator = function (mode, type) {
            if (type >= 1 && type < 10) {
                switch (mode) {
                    case QRMode.MODE_NUMBER: return 10;
                    case QRMode.MODE_ALPHA_NUM: return 9;
                    case QRMode.MODE_8BIT_BYTE: return 8;
                    case QRMode.MODE_KANJI: return 8;
                    default:
                        throw new Error("mode:" + mode);
                }
            }
            else if (type < 27) {
                switch (mode) {
                    case QRMode.MODE_NUMBER: return 12;
                    case QRMode.MODE_ALPHA_NUM: return 11;
                    case QRMode.MODE_8BIT_BYTE: return 16;
                    case QRMode.MODE_KANJI: return 10;
                    default:
                        throw new Error("mode:" + mode);
                }
            }
            else if (type < 41) {
                switch (mode) {
                    case QRMode.MODE_NUMBER: return 14;
                    case QRMode.MODE_ALPHA_NUM: return 13;
                    case QRMode.MODE_8BIT_BYTE: return 16;
                    case QRMode.MODE_KANJI: return 12;
                    default:
                        throw new Error("mode:" + mode);
                }
            }
            else {
                throw new Error("type:" + type);
            }
        };
        QRUtil.getMinimumLength = function (mode, errorCorrectLevel, type) {
            var blocks = QRRSBlock.getRSBlocks(type, errorCorrectLevel);
            var totalDataCount = 0;
            for (var i = 0; i < blocks.length; i++) {
                totalDataCount += blocks[i].dataCount;
            }
            return totalDataCount * 8;
        };
        QRUtil.getMode = function (c) {
            if (c >= '0'.charCodeAt(0) && c <= '9'.charCodeAt(0)) {
                return QRMode.MODE_NUMBER;
            }
            else if (c >= 'A'.charCodeAt(0) && c <= 'Z'.charCodeAt(0) ||
                c === ' '.charCodeAt(0) ||
                c === '$'.charCodeAt(0) ||
                c === '%'.charCodeAt(0) ||
                c === '*'.charCodeAt(0) ||
                c === '+'.charCodeAt(0) ||
                c === '-'.charCodeAt(0) ||
                c === '.'.charCodeAt(0) ||
                c === '/'.charCodeAt(0) ||
                c === ':'.charCodeAt(0)) {
                return QRMode.MODE_ALPHA_NUM;
            }
            else if (c >= 0x81 && c <= 0x9F || c >= 0xE0 && c <= 0xEB) {
                return QRMode.MODE_KANJI;
            }
            return QRMode.MODE_8BIT_BYTE;
        };
    })(QRUtil = QRCode.QRUtil || (QRCode.QRUtil = {}));
    var QRMath;
    (function (QRMath) {
        QRMath.EXP_TABLE = new Int32Array(256);
        QRMath.LOG_TABLE = new Int32Array(256);
        QRMath.gf_exp = function (n) {
            if (n < 0) {
                n += 255;
            }
            return QRMath.EXP_TABLE[n];
        };
        QRMath.gf_log = function (n) {
            return QRMath.LOG_TABLE[n];
        };
        QRMath.gf_mul = function (a, b) {
            if (a === 0 || b === 0) {
                return 0;
            }
            return QRMath.EXP_TABLE[(QRMath.LOG_TABLE[a] + QRMath.LOG_TABLE[b]) % 255];
        };
        QRMath.gf_div = function (a, b) {
            if (b === 0) {
                throw new Error("division by zero");
            }
            if (a === 0) {
                return 0;
            }
            return QRMath.EXP_TABLE[(QRMath.LOG_TABLE[a] - QRMath.LOG_TABLE[b] + 255) % 255];
        };
        QRMath.gf_pow = function (a, n) {
            var res = 1;
            var aa = a;
            while (n !== 0) {
                if ((n & 1) === 1) {
                    res = QRMath.gf_mul(res, aa);
                }
                aa = QRMath.gf_mul(aa, aa);
                n >>>= 1;
            }
            return res;
        };
        QRMath.gf_poly_mul = function (p, q) {
            var res = new Int32Array(p.length + q.length - 1);
            for (var i = 0; i < p.length; i++) {
                for (var j = 0; j < q.length; j++) {
                    res[i + j] ^= QRMath.gf_mul(p[i], q[j]);
                }
            }
            return res;
        };
        QRMath.gf_poly_add = function (p, q) {
            var res = new Int32Array(Math.max(p.length, q.length));
            for (var i = 0; i < p.length; i++) {
                res[i] = p[i];
            }
            for (var i = 0; i < q.length; i++) {
                res[i] ^= q[i];
            }
            return res;
        };
        QRMath.gf_poly_mul_scalar = function (p, a) {
            var res = new Int32Array(p.length);
            for (var i = 0; i < p.length; i++) {
                res[i] = QRMath.gf_mul(p[i], a);
            }
            return res;
        };
        QRMath.gf_poly_div = function (dividend, divisor) {
            var res = new Int32Array(dividend.length - divisor.length + 1);
            var work = new Int32Array(dividend);
            for (var i = work.length - divisor.length; i >= 0; i--) {
                var coef = work[i];
                if (coef !== 0) {
                    res[i] = coef;
                    for (var j = 0; j < divisor.length; j++) {
                        work[i + j] ^= QRMath.gf_mul(divisor[j], coef);
                    }
                }
            }
            return { quotient: res, remainder: work.slice(dividend.length - divisor.length + 1) };
        };
        (function () {
            for (var i = 0; i < 8; i++) {
                QRMath.EXP_TABLE[i] = 1 << i;
            }
            for (var i = 8; i < 256; i++) {
                QRMath.EXP_TABLE[i] = QRMath.EXP_TABLE[i - 4] ^
                    QRMath.EXP_TABLE[i - 5] ^
                    QRMath.EXP_TABLE[i - 6] ^
                    QRMath.EXP_TABLE[i - 8];
            }
            for (var i = 0; i < 255; i++) {
                QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]] = i;
            }
        })();
    })(QRMath = QRCode.QRMath || (QRCode.QRMath = {}));
    var QRRSBlock;
    (function (QRRSBlock) {
        var RS_BLOCK_TABLE = [
            [],
            [{ rsBlockCount: 1, dataCount: 19, totalCount: 26 }],
            [{ rsBlockCount: 1, dataCount: 34, totalCount: 44 }],
            [{ rsBlockCount: 1, dataCount: 55, totalCount: 70 }],
            [{ rsBlockCount: 1, dataCount: 80, totalCount: 100 }],
            [{ rsBlockCount: 1, dataCount: 108, totalCount: 130 }],
            [{ rsBlockCount: 2, dataCount: 68, totalCount: 86 }],
            [{ rsBlockCount: 2, dataCount: 81, totalCount: 100 }],
            [{ rsBlockCount: 2, dataCount: 92, totalCount: 116 }],
            [{ rsBlockCount: 2, dataCount: 107, totalCount: 134 }],
            [{ rsBlockCount: 2, dataCount: 121, totalCount: 154 }],
            [{ rsBlockCount: 2, dataCount: 135, totalCount: 174 }],
            [{ rsBlockCount: 2, dataCount: 150, totalCount: 192 }],
            [{ rsBlockCount: 2, dataCount: 167, totalCount: 213 }],
            [{ rsBlockCount: 2, dataCount: 185, totalCount: 235 }],
            [{ rsBlockCount: 2, dataCount: 203, totalCount: 258 }],
            [{ rsBlockCount: 2, dataCount: 223, totalCount: 280 }],
            [{ rsBlockCount: 2, dataCount: 243, totalCount: 303 }],
            [{ rsBlockCount: 2, dataCount: 263, totalCount: 328 }],
            [{ rsBlockCount: 2, dataCount: 285, totalCount: 352 }],
            [{ rsBlockCount: 4, dataCount: 154, totalCount: 190 }],
            [{ rsBlockCount: 4, dataCount: 173, totalCount: 213 }],
            [{ rsBlockCount: 4, dataCount: 194, totalCount: 236 }],
            [{ rsBlockCount: 4, dataCount: 216, totalCount: 260 }],
            [{ rsBlockCount: 4, dataCount: 238, totalCount: 286 }],
            [{ rsBlockCount: 4, dataCount: 262, totalCount: 312 }],
            [{ rsBlockCount: 4, dataCount: 286, totalCount: 338 }],
            [{ rsBlockCount: 4, dataCount: 310, totalCount: 364 }],
            [{ rsBlockCount: 4, dataCount: 336, totalCount: 394 }],
            [{ rsBlockCount: 4, dataCount: 362, totalCount: 422 }],
            [{ rsBlockCount: 6, dataCount: 233, totalCount: 283 }],
            [{ rsBlockCount: 6, dataCount: 253, totalCount: 309 }],
            [{ rsBlockCount: 6, dataCount: 273, totalCount: 335 }],
            [{ rsBlockCount: 6, dataCount: 295, totalCount: 363 }],
            [{ rsBlockCount: 6, dataCount: 319, totalCount: 391 }],
            [{ rsBlockCount: 6, dataCount: 343, totalCount: 421 }],
            [{ rsBlockCount: 6, dataCount: 369, totalCount: 451 }],
            [{ rsBlockCount: 6, dataCount: 395, totalCount: 481 }],
            [{ rsBlockCount: 6, dataCount: 423, totalCount: 513 }],
            [{ rsBlockCount: 8, dataCount: 292, totalCount: 354 }],
            [{ rsBlockCount: 8, dataCount: 318, totalCount: 386 }],
            [{ rsBlockCount: 8, dataCount: 344, totalCount: 418 }],
            [{ rsBlockCount: 8, dataCount: 370, totalCount: 450 }],
            [{ rsBlockCount: 8, dataCount: 398, totalCount: 484 }],
            [{ rsBlockCount: 8, dataCount: 426, totalCount: 518 }],
            [{ rsBlockCount: 8, dataCount: 454, totalCount: 552 }],
            [{ rsBlockCount: 8, dataCount: 484, totalCount: 588 }],
            [{ rsBlockCount: 8, dataCount: 514, totalCount: 624 }],
            [{ rsBlockCount: 10, dataCount: 364, totalCount: 434 }],
            [{ rsBlockCount: 10, dataCount: 390, totalCount: 468 }],
            [{ rsBlockCount: 10, dataCount: 418, totalCount: 502 }],
            [{ rsBlockCount: 10, dataCount: 446, totalCount: 538 }],
            [{ rsBlockCount: 10, dataCount: 476, totalCount: 574 }],
            [{ rsBlockCount: 10, dataCount: 506, totalCount: 610 }],
            [{ rsBlockCount: 10, dataCount: 538, totalCount: 648 }],
            [{ rsBlockCount: 10, dataCount: 570, totalCount: 686 }],
            [{ rsBlockCount: 10, dataCount: 604, totalCount: 724 }],
            [{ rsBlockCount: 12, dataCount: 442, totalCount: 530 }],
            [{ rsBlockCount: 12, dataCount: 474, totalCount: 566 }],
            [{ rsBlockCount: 12, dataCount: 506, totalCount: 602 }],
            [{ rsBlockCount: 12, dataCount: 540, totalCount: 640 }],
            [{ rsBlockCount: 12, dataCount: 574, totalCount: 678 }],
            [{ rsBlockCount: 12, dataCount: 610, totalCount: 716 }],
            [{ rsBlockCount: 12, dataCount: 646, totalCount: 756 }],
            [{ rsBlockCount: 12, dataCount: 684, totalCount: 796 }],
            [{ rsBlockCount: 12, dataCount: 722, totalCount: 836 }],
            [{ rsBlockCount: 14, dataCount: 530, totalCount: 628 }],
            [{ rsBlockCount: 14, dataCount: 564, totalCount: 666 }],
            [{ rsBlockCount: 14, dataCount: 600, totalCount: 704 }],
            [{ rsBlockCount: 14, dataCount: 636, totalCount: 744 }],
            [{ rsBlockCount: 14, dataCount: 674, totalCount: 784 }],
            [{ rsBlockCount: 14, dataCount: 712, totalCount: 824 }],
            [{ rsBlockCount: 14, dataCount: 752, totalCount: 866 }],
            [{ rsBlockCount: 14, dataCount: 792, totalCount: 908 }],
            [{ rsBlockCount: 14, dataCount: 834, totalCount: 950 }]
        ];
        var RS_BLOCK_TABLE_M = [
            [],
            [{ rsBlockCount: 1, dataCount: 16, totalCount: 26 }],
            [{ rsBlockCount: 1, dataCount: 28, totalCount: 44 }],
            [{ rsBlockCount: 1, dataCount: 44, totalCount: 70 }],
            [{ rsBlockCount: 1, dataCount: 64, totalCount: 100 }],
            [{ rsBlockCount: 1, dataCount: 86, totalCount: 130 }],
            [{ rsBlockCount: 2, dataCount: 54, totalCount: 86 }],
            [{ rsBlockCount: 2, dataCount: 68, totalCount: 100 }],
            [{ rsBlockCount: 2, dataCount: 78, totalCount: 116 }],
            [{ rsBlockCount: 2, dataCount: 97, totalCount: 134 }],
            [{ rsBlockCount: 2, dataCount: 111, totalCount: 154 }],
            [{ rsBlockCount: 2, dataCount: 127, totalCount: 174 }],
            [{ rsBlockCount: 2, dataCount: 143, totalCount: 192 }],
            [{ rsBlockCount: 2, dataCount: 159, totalCount: 213 }],
            [{ rsBlockCount: 2, dataCount: 177, totalCount: 235 }],
            [{ rsBlockCount: 2, dataCount: 195, totalCount: 258 }],
            [{ rsBlockCount: 2, dataCount: 215, totalCount: 280 }],
            [{ rsBlockCount: 2, dataCount: 233, totalCount: 303 }],
            [{ rsBlockCount: 2, dataCount: 253, totalCount: 328 }],
            [{ rsBlockCount: 2, dataCount: 275, totalCount: 352 }],
            [{ rsBlockCount: 4, dataCount: 146, totalCount: 190 }],
            [{ rsBlockCount: 4, dataCount: 164, totalCount: 213 }],
            [{ rsBlockCount: 4, dataCount: 182, totalCount: 236 }],
            [{ rsBlockCount: 4, dataCount: 204, totalCount: 260 }],
            [{ rsBlockCount: 4, dataCount: 226, totalCount: 286 }],
            [{ rsBlockCount: 4, dataCount: 248, totalCount: 312 }],
            [{ rsBlockCount: 4, dataCount: 272, totalCount: 338 }],
            [{ rsBlockCount: 4, dataCount: 296, totalCount: 364 }],
            [{ rsBlockCount: 4, dataCount: 320, totalCount: 394 }],
            [{ rsBlockCount: 4, dataCount: 346, totalCount: 422 }],
            [{ rsBlockCount: 6, dataCount: 220, totalCount: 283 }],
            [{ rsBlockCount: 6, dataCount: 242, totalCount: 309 }],
            [{ rsBlockCount: 6, dataCount: 264, totalCount: 335 }],
            [{ rsBlockCount: 6, dataCount: 288, totalCount: 363 }],
            [{ rsBlockCount: 6, dataCount: 312, totalCount: 391 }],
            [{ rsBlockCount: 6, dataCount: 338, totalCount: 421 }],
            [{ rsBlockCount: 6, dataCount: 364, totalCount: 451 }],
            [{ rsBlockCount: 6, dataCount: 390, totalCount: 481 }],
            [{ rsBlockCount: 6, dataCount: 418, totalCount: 513 }],
            [{ rsBlockCount: 8, dataCount: 276, totalCount: 354 }],
            [{ rsBlockCount: 8, dataCount: 300, totalCount: 386 }],
            [{ rsBlockCount: 8, dataCount: 326, totalCount: 418 }],
            [{ rsBlockCount: 8, dataCount: 352, totalCount: 450 }],
            [{ rsBlockCount: 8, dataCount: 380, totalCount: 484 }],
            [{ rsBlockCount: 8, dataCount: 408, totalCount: 518 }],
            [{ rsBlockCount: 8, dataCount: 438, totalCount: 552 }],
            [{ rsBlockCount: 8, dataCount: 468, totalCount: 588 }],
            [{ rsBlockCount: 8, dataCount: 500, totalCount: 624 }],
            [{ rsBlockCount: 10, dataCount: 344, totalCount: 434 }],
            [{ rsBlockCount: 10, dataCount: 370, totalCount: 468 }],
            [{ rsBlockCount: 10, dataCount: 398, totalCount: 502 }],
            [{ rsBlockCount: 10, dataCount: 426, totalCount: 538 }],
            [{ rsBlockCount: 10, dataCount: 456, totalCount: 574 }],
            [{ rsBlockCount: 10, dataCount: 486, totalCount: 610 }],
            [{ rsBlockCount: 10, dataCount: 518, totalCount: 648 }],
            [{ rsBlockCount: 10, dataCount: 550, totalCount: 686 }],
            [{ rsBlockCount: 10, dataCount: 584, totalCount: 724 }],
            [{ rsBlockCount: 12, dataCount: 416, totalCount: 530 }],
            [{ rsBlockCount: 12, dataCount: 446, totalCount: 566 }],
            [{ rsBlockCount: 12, dataCount: 478, totalCount: 602 }],
            [{ rsBlockCount: 12, dataCount: 510, totalCount: 640 }],
            [{ rsBlockCount: 12, dataCount: 544, totalCount: 678 }],
            [{ rsBlockCount: 12, dataCount: 578, totalCount: 716 }],
            [{ rsBlockCount: 12, dataCount: 614, totalCount: 756 }],
            [{ rsBlockCount: 12, dataCount: 650, totalCount: 796 }],
            [{ rsBlockCount: 12, dataCount: 688, totalCount: 836 }],
            [{ rsBlockCount: 14, dataCount: 504, totalCount: 628 }],
            [{ rsBlockCount: 14, dataCount: 538, totalCount: 666 }],
            [{ rsBlockCount: 14, dataCount: 572, totalCount: 704 }],
            [{ rsBlockCount: 14, dataCount: 608, totalCount: 744 }],
            [{ rsBlockCount: 14, dataCount: 644, totalCount: 784 }],
            [{ rsBlockCount: 14, dataCount: 682, totalCount: 824 }],
            [{ rsBlockCount: 14, dataCount: 720, totalCount: 866 }],
            [{ rsBlockCount: 14, dataCount: 760, totalCount: 908 }],
            [{ rsBlockCount: 14, dataCount: 800, totalCount: 950 }]
        ];
        var RS_BLOCK_TABLE_Q = [
            [],
            [{ rsBlockCount: 1, dataCount: 13, totalCount: 26 }],
            [{ rsBlockCount: 1, dataCount: 22, totalCount: 44 }],
            [{ rsBlockCount: 1, dataCount: 34, totalCount: 70 }],
            [{ rsBlockCount: 1, dataCount: 50, totalCount: 100 }],
            [{ rsBlockCount: 1, dataCount: 67, totalCount: 130 }],
            [{ rsBlockCount: 2, dataCount: 43, totalCount: 86 }],
            [{ rsBlockCount: 2, dataCount: 54, totalCount: 100 }],
            [{ rsBlockCount: 2, dataCount: 64, totalCount: 116 }],
            [{ rsBlockCount: 2, dataCount: 78, totalCount: 134 }],
            [{ rsBlockCount: 2, dataCount: 87, totalCount: 154 }],
            [{ rsBlockCount: 2, dataCount: 100, totalCount: 174 }],
            [{ rsBlockCount: 2, dataCount: 113, totalCount: 192 }],
            [{ rsBlockCount: 2, dataCount: 121, totalCount: 213 }],
            [{ rsBlockCount: 2, dataCount: 134, totalCount: 235 }],
            [{ rsBlockCount: 2, dataCount: 146, totalCount: 258 }],
            [{ rsBlockCount: 2, dataCount: 160, totalCount: 280 }],
            [{ rsBlockCount: 2, dataCount: 174, totalCount: 303 }],
            [{ rsBlockCount: 2, dataCount: 188, totalCount: 328 }],
            [{ rsBlockCount: 2, dataCount: 203, totalCount: 352 }],
            [{ rsBlockCount: 4, dataCount: 116, totalCount: 190 }],
            [{ rsBlockCount: 4, dataCount: 130, totalCount: 213 }],
            [{ rsBlockCount: 4, dataCount: 144, totalCount: 236 }],
            [{ rsBlockCount: 4, dataCount: 162, totalCount: 260 }],
            [{ rsBlockCount: 4, dataCount: 178, totalCount: 286 }],
            [{ rsBlockCount: 4, dataCount: 196, totalCount: 312 }],
            [{ rsBlockCount: 4, dataCount: 212, totalCount: 338 }],
            [{ rsBlockCount: 4, dataCount: 230, totalCount: 364 }],
            [{ rsBlockCount: 4, dataCount: 248, totalCount: 394 }],
            [{ rsBlockCount: 4, dataCount: 266, totalCount: 422 }],
            [{ rsBlockCount: 6, dataCount: 172, totalCount: 283 }],
            [{ rsBlockCount: 6, dataCount: 192, totalCount: 309 }],
            [{ rsBlockCount: 6, dataCount: 210, totalCount: 335 }],
            [{ rsBlockCount: 6, dataCount: 230, totalCount: 363 }],
            [{ rsBlockCount: 6, dataCount: 250, totalCount: 391 }],
            [{ rsBlockCount: 6, dataCount: 270, totalCount: 421 }],
            [{ rsBlockCount: 6, dataCount: 292, totalCount: 451 }],
            [{ rsBlockCount: 6, dataCount: 314, totalCount: 481 }],
            [{ rsBlockCount: 6, dataCount: 336, totalCount: 513 }],
            [{ rsBlockCount: 8, dataCount: 218, totalCount: 354 }],
            [{ rsBlockCount: 8, dataCount: 238, totalCount: 386 }],
            [{ rsBlockCount: 8, dataCount: 260, totalCount: 418 }],
            [{ rsBlockCount: 8, dataCount: 282, totalCount: 450 }],
            [{ rsBlockCount: 8, dataCount: 306, totalCount: 484 }],
            [{ rsBlockCount: 8, dataCount: 330, totalCount: 518 }],
            [{ rsBlockCount: 8, dataCount: 354, totalCount: 552 }],
            [{ rsBlockCount: 8, dataCount: 380, totalCount: 588 }],
            [{ rsBlockCount: 8, dataCount: 406, totalCount: 624 }],
            [{ rsBlockCount: 10, dataCount: 274, totalCount: 434 }],
            [{ rsBlockCount: 10, dataCount: 298, totalCount: 468 }],
            [{ rsBlockCount: 10, dataCount: 322, totalCount: 502 }],
            [{ rsBlockCount: 10, dataCount: 348, totalCount: 538 }],
            [{ rsBlockCount: 10, dataCount: 374, totalCount: 574 }],
            [{ rsBlockCount: 10, dataCount: 402, totalCount: 610 }],
            [{ rsBlockCount: 10, dataCount: 430, totalCount: 648 }],
            [{ rsBlockCount: 10, dataCount: 458, totalCount: 686 }],
            [{ rsBlockCount: 10, dataCount: 488, totalCount: 724 }],
            [{ rsBlockCount: 12, dataCount: 334, totalCount: 530 }],
            [{ rsBlockCount: 12, dataCount: 360, totalCount: 566 }],
            [{ rsBlockCount: 12, dataCount: 388, totalCount: 602 }],
            [{ rsBlockCount: 12, dataCount: 416, totalCount: 640 }],
            [{ rsBlockCount: 12, dataCount: 444, totalCount: 678 }],
            [{ rsBlockCount: 12, dataCount: 474, totalCount: 716 }],
            [{ rsBlockCount: 12, dataCount: 504, totalCount: 756 }],
            [{ rsBlockCount: 12, dataCount: 536, totalCount: 796 }],
            [{ rsBlockCount: 12, dataCount: 568, totalCount: 836 }],
            [{ rsBlockCount: 14, dataCount: 406, totalCount: 628 }],
            [{ rsBlockCount: 14, dataCount: 436, totalCount: 666 }],
            [{ rsBlockCount: 14, dataCount: 466, totalCount: 704 }],
            [{ rsBlockCount: 14, dataCount: 498, totalCount: 744 }],
            [{ rsBlockCount: 14, dataCount: 530, totalCount: 784 }],
            [{ rsBlockCount: 14, dataCount: 564, totalCount: 824 }],
            [{ rsBlockCount: 14, dataCount: 598, totalCount: 866 }],
            [{ rsBlockCount: 14, dataCount: 634, totalCount: 908 }],
            [{ rsBlockCount: 14, dataCount: 670, totalCount: 950 }]
        ];
        var RS_BLOCK_TABLE_H = [
            [],
            [{ rsBlockCount: 1, dataCount: 9, totalCount: 26 }],
            [{ rsBlockCount: 1, dataCount: 16, totalCount: 44 }],
            [{ rsBlockCount: 1, dataCount: 28, totalCount: 70 }],
            [{ rsBlockCount: 1, dataCount: 36, totalCount: 100 }],
            [{ rsBlockCount: 1, dataCount: 48, totalCount: 130 }],
            [{ rsBlockCount: 2, dataCount: 36, totalCount: 86 }],
            [{ rsBlockCount: 2, dataCount: 43, totalCount: 100 }],
            [{ rsBlockCount: 2, dataCount: 54, totalCount: 116 }],
            [{ rsBlockCount: 2, dataCount: 64, totalCount: 134 }],
            [{ rsBlockCount: 2, dataCount: 73, totalCount: 154 }],
            [{ rsBlockCount: 2, dataCount: 86, totalCount: 174 }],
            [{ rsBlockCount: 2, dataCount: 98, totalCount: 192 }],
            [{ rsBlockCount: 2, dataCount: 107, totalCount: 213 }],
            [{ rsBlockCount: 2, dataCount: 116, totalCount: 235 }],
            [{ rsBlockCount: 2, dataCount: 126, totalCount: 258 }],
            [{ rsBlockCount: 2, dataCount: 139, totalCount: 280 }],
            [{ rsBlockCount: 2, dataCount: 151, totalCount: 303 }],
            [{ rsBlockCount: 2, dataCount: 163, totalCount: 328 }],
            [{ rsBlockCount: 2, dataCount: 177, totalCount: 352 }],
            [{ rsBlockCount: 4, dataCount: 98, totalCount: 190 }],
            [{ rsBlockCount: 4, dataCount: 110, totalCount: 213 }],
            [{ rsBlockCount: 4, dataCount: 122, totalCount: 236 }],
            [{ rsBlockCount: 4, dataCount: 136, totalCount: 260 }],
            [{ rsBlockCount: 4, dataCount: 150, totalCount: 286 }],
            [{ rsBlockCount: 4, dataCount: 164, totalCount: 312 }],
            [{ rsBlockCount: 4, dataCount: 178, totalCount: 338 }],
            [{ rsBlockCount: 4, dataCount: 194, totalCount: 364 }],
            [{ rsBlockCount: 4, dataCount: 210, totalCount: 394 }],
            [{ rsBlockCount: 4, dataCount: 226, totalCount: 422 }],
            [{ rsBlockCount: 6, dataCount: 146, totalCount: 283 }],
            [{ rsBlockCount: 6, dataCount: 162, totalCount: 309 }],
            [{ rsBlockCount: 6, dataCount: 178, totalCount: 335 }],
            [{ rsBlockCount: 6, dataCount: 196, totalCount: 363 }],
            [{ rsBlockCount: 6, dataCount: 214, totalCount: 391 }],
            [{ rsBlockCount: 6, dataCount: 232, totalCount: 421 }],
            [{ rsBlockCount: 6, dataCount: 252, totalCount: 451 }],
            [{ rsBlockCount: 6, dataCount: 272, totalCount: 481 }],
            [{ rsBlockCount: 6, dataCount: 292, totalCount: 513 }],
            [{ rsBlockCount: 8, dataCount: 180, totalCount: 354 }],
            [{ rsBlockCount: 8, dataCount: 200, totalCount: 386 }],
            [{ rsBlockCount: 8, dataCount: 220, totalCount: 418 }],
            [{ rsBlockCount: 8, dataCount: 242, totalCount: 450 }],
            [{ rsBlockCount: 8, dataCount: 264, totalCount: 484 }],
            [{ rsBlockCount: 8, dataCount: 286, totalCount: 518 }],
            [{ rsBlockCount: 8, dataCount: 310, totalCount: 552 }],
            [{ rsBlockCount: 8, dataCount: 334, totalCount: 588 }],
            [{ rsBlockCount: 8, dataCount: 360, totalCount: 624 }],
            [{ rsBlockCount: 10, dataCount: 226, totalCount: 434 }],
            [{ rsBlockCount: 10, dataCount: 248, totalCount: 468 }],
            [{ rsBlockCount: 10, dataCount: 270, totalCount: 502 }],
            [{ rsBlockCount: 10, dataCount: 294, totalCount: 538 }],
            [{ rsBlockCount: 10, dataCount: 318, totalCount: 574 }],
            [{ rsBlockCount: 10, dataCount: 342, totalCount: 610 }],
            [{ rsBlockCount: 10, dataCount: 368, totalCount: 648 }],
            [{ rsBlockCount: 10, dataCount: 394, totalCount: 686 }],
            [{ rsBlockCount: 10, dataCount: 420, totalCount: 724 }],
            [{ rsBlockCount: 12, dataCount: 274, totalCount: 530 }],
            [{ rsBlockCount: 12, dataCount: 300, totalCount: 566 }],
            [{ rsBlockCount: 12, dataCount: 326, totalCount: 602 }],
            [{ rsBlockCount: 12, dataCount: 352, totalCount: 640 }],
            [{ rsBlockCount: 12, dataCount: 380, totalCount: 678 }],
            [{ rsBlockCount: 12, dataCount: 408, totalCount: 716 }],
            [{ rsBlockCount: 12, dataCount: 438, totalCount: 756 }],
            [{ rsBlockCount: 12, dataCount: 468, totalCount: 796 }],
            [{ rsBlockCount: 12, dataCount: 500, totalCount: 836 }],
            [{ rsBlockCount: 14, dataCount: 340, totalCount: 628 }],
            [{ rsBlockCount: 14, dataCount: 368, totalCount: 666 }],
            [{ rsBlockCount: 14, dataCount: 396, totalCount: 704 }],
            [{ rsBlockCount: 14, dataCount: 426, totalCount: 744 }],
            [{ rsBlockCount: 14, dataCount: 456, totalCount: 784 }],
            [{ rsBlockCount: 14, dataCount: 488, totalCount: 824 }],
            [{ rsBlockCount: 14, dataCount: 520, totalCount: 866 }],
            [{ rsBlockCount: 14, dataCount: 554, totalCount: 908 }],
            [{ rsBlockCount: 14, dataCount: 588, totalCount: 950 }]
        ];
        var RSBlock = /** @class */ (function () {
            function RSBlock(totalCount, dataCount) {
                this.totalCount = totalCount;
                this.dataCount = dataCount;
            }
            return RSBlock;
        }());
        QRRSBlock.getRSBlocks = function (typeNumber, errorCorrectLevel) {
            var rsBlock;
            switch (errorCorrectLevel) {
                case QRErrorCorrectLevel.L:
                    rsBlock = RS_BLOCK_TABLE[typeNumber - 1];
                    break;
                case QRErrorCorrectLevel.M:
                    rsBlock = RS_BLOCK_TABLE_M[typeNumber - 1];
                    break;
                case QRErrorCorrectLevel.Q:
                    rsBlock = RS_BLOCK_TABLE_Q[typeNumber - 1];
                    break;
                case QRErrorCorrectLevel.H:
                    rsBlock = RS_BLOCK_TABLE_H[typeNumber - 1];
                    break;
                default:
                    return null;
            }
            var length = 0;
            for (var i = 0; i < rsBlock.length; i++) {
                length += rsBlock[i].rsBlockCount;
            }
            var list = [];
            for (var i = 0; i < rsBlock.length; i++) {
                for (var j = 0; j < rsBlock[i].rsBlockCount; j++) {
                    list.push(new RSBlock(rsBlock[i].totalCount, rsBlock[i].dataCount));
                }
            }
            return list;
        };
    })(QRRSBlock = QRCode.QRRSBlock || (QRCode.QRRSBlock = {}));
    var QRBitBuffer = /** @class */ (function () {
        function QRBitBuffer() {
            this.buffer = [];
            this.length = 0;
        }
        QRBitBuffer.prototype.get = function (index) {
            var bufIndex = Math.floor(index / 8);
            var bitIndex = index % 8;
            return ((this.buffer[bufIndex] >>> (7 - bitIndex)) & 1) === 1;
        };
        QRBitBuffer.prototype.put = function (num, length) {
            for (var i = 0; i < length; i++) {
                this.putBit(((num >>> (length - i - 1)) & 1) === 1);
            }
        };
        QRBitBuffer.prototype.getLengthInBits = function () {
            return this.length;
        };
        QRBitBuffer.prototype.putBit = function (bit) {
            var bufIndex = Math.floor(this.length / 8);
            if (this.buffer.length <= bufIndex) {
                this.buffer.push(0);
            }
            if (bit) {
                this.buffer[bufIndex] |= (0x80 >>> (this.length % 8));
            }
            this.length++;
        };
        return QRBitBuffer;
    }());
    QRCode.QRBitBuffer = QRBitBuffer;
    var QRData;
    (function (QRData) {
        var QRNumber = /** @class */ (function () {
            function QRNumber(data) {
                this.mode = QRMode.MODE_NUMBER;
                this.data = data;
            }
            QRNumber.prototype.getLength = function () {
                return this.data.length;
            };
            QRNumber.prototype.write = function (buffer) {
                var data = this.data;
                var i = 0;
                while (i + 3 <= data.length) {
                    buffer.put(QRNumber.strToNum(data.substring(i, i + 3)), 10);
                    i += 3;
                }
                if (data.length - i === 1) {
                    buffer.put(QRNumber.strToNum(data.substring(i)), 4);
                }
                else if (data.length - i === 2) {
                    buffer.put(QRNumber.strToNum(data.substring(i)), 7);
                }
            };
            QRNumber.strToNum = function (s) {
                var num = 0;
                for (var i = 0; i < s.length; i++) {
                    num = num * 10 + QRNumber.charToNum(s.charAt(i));
                }
                return num;
            };
            QRNumber.charToNum = function (c) {
                return c.charCodeAt(0) - '0'.charCodeAt(0);
            };
            return QRNumber;
        }());
        QRData.QRNumber = QRNumber;
        var QRAlphaNum = /** @class */ (function () {
            function QRAlphaNum(data) {
                this.mode = QRMode.MODE_ALPHA_NUM;
                this.data = data;
            }
            QRAlphaNum.prototype.getLength = function () {
                return this.data.length;
            };
            QRAlphaNum.prototype.write = function (buffer) {
                var s = this.data;
                var i = 0;
                while (i + 2 <= s.length) {
                    buffer.put(QRAlphaNum.getCode(s.charAt(i)) * 45 + QRAlphaNum.getCode(s.charAt(i + 1)), 11);
                    i += 2;
                }
                if (s.length - i === 1) {
                    buffer.put(QRAlphaNum.getCode(s.charAt(i)), 6);
                }
            };
            QRAlphaNum.getCode = function (c) {
                if (c >= '0'.charCodeAt(0) && c <= '9'.charCodeAt(0)) {
                    return c.charCodeAt(0) - '0'.charCodeAt(0);
                }
                else if (c >= 'A'.charCodeAt(0) && c <= 'Z'.charCodeAt(0)) {
                    return c.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
                }
                else {
                    switch (c) {
                        case ' ': return 36;
                        case '$': return 37;
                        case '%': return 38;
                        case '*': return 39;
                        case '+': return 40;
                        case '-': return 41;
                        case '.': return 42;
                        case '/': return 43;
                        case ':': return 44;
                        default:
                            throw new Error("illegal char :" + c);
                    }
                }
            };
            return QRAlphaNum;
        }());
        QRData.QRAlphaNum = QRAlphaNum;
        var QR8BitByte = /** @class */ (function () {
            function QR8BitByte(data) {
                this.mode = QRMode.MODE_8BIT_BYTE;
                this.data = data;
            }
            QR8BitByte.prototype.getLength = function () {
                return this.data.length;
            };
            QR8BitByte.prototype.write = function (buffer) {
                for (var i = 0; i < this.data.length; i++) {
                    buffer.put(this.data.charCodeAt(i), 8);
                }
            };
            return QR8BitByte;
        }());
        QRData.QR8BitByte = QR8BitByte;
        var QRKanji = /** @class */ (function () {
            function QRKanji(data) {
                this.mode = QRMode.MODE_KANJI;
                this.data = data;
            }
            QRKanji.prototype.getLength = function () {
                return this.data.length;
            };
            QRKanji.prototype.write = function (buffer) {
                var data = this.data;
                for (var i = 0; i + 1 < data.length; i += 2) {
                    var c = ((data.charCodeAt(i) & 0xFF) << 8) | (data.charCodeAt(i + 1) & 0xFF);
                    if (0x8140 <= c && c <= 0x9FFC) {
                        c -= 0x8140;
                    }
                    else if (0xE040 <= c && c <= 0xEBBF) {
                        c -= 0xC140;
                    }
                    else {
                        throw new Error("illegal char at " + i + " :" + c);
                    }
                    var tmp = ((c >> 8) & 0xFF) * 0xC0;
                    tmp += (c & 0xFF);
                    buffer.put(tmp, 13);
                }
            };
            return QRKanji;
        }());
        QRData.QRKanji = QRKanji;
        QRData.createData = function (data, errorCorrectLevel) {
            if (typeof data !== 'string') {
                throw new Error('data must be string');
            }
            var mode = QRUtil.getMode(data.charCodeAt(0));
            for (var i = 1; i < data.length; i++) {
                var newMode = QRUtil.getMode(data.charCodeAt(i));
                if (mode < newMode) {
                    mode = newMode;
                }
            }
            switch (mode) {
                case QRMode.MODE_NUMBER:
                    return new QRNumber(data);
                case QRMode.MODE_ALPHA_NUM:
                    return new QRAlphaNum(data);
                case QRMode.MODE_8BIT_BYTE:
                    return new QR8BitByte(data);
                case QRMode.MODE_KANJI:
                    return new QRKanji(data);
                default:
                    throw new Error("mode:" + mode);
            }
        };
    })(QRData = QRCode.QRData || (QRCode.QRData = {}));
    var QRCodeModel = /** @class */ (function () {
        function QRCodeModel(typeNumber, errorCorrectLevel) {
            this.typeNumber = typeNumber;
            this.errorCorrectLevel = errorCorrectLevel;
            this.modules = null;
            this.moduleCount = 0;
            this.dataCache = null;
            this.dataList = [];
        }
        QRCodeModel.prototype.addData = function (data) {
            var newData = QRData.createData(data, this.errorCorrectLevel);
            this.dataList.push(newData);
            this.dataCache = null;
        };
        QRCodeModel.prototype.isDark = function (row, col) {
            if (row < 0 || this.moduleCount <= row || col < 0 || this.moduleCount <= col) {
                throw new Error(row + "," + col);
            }
            return this.modules[row][col];
        };
        QRCodeModel.prototype.getModuleCount = function () {
            return this.moduleCount;
        };
        QRCodeModel.prototype.make = function () {
            this.makeImpl(false, this.getBestMaskPattern());
        };
        QRCodeModel.prototype.makeImpl = function (test, maskPattern) {
            this.moduleCount = this.typeNumber * 4 + 17;
            this.modules = new Array(this.moduleCount);
            for (var i = 0; i < this.moduleCount; i++) {
                this.modules[i] = new Array(this.moduleCount);
                for (var j = 0; j < this.moduleCount; j++) {
                    this.modules[i][j] = null;
                }
            }
            this.setupPositionProbePattern(0, 0);
            this.setupPositionProbePattern(this.moduleCount - 7, 0);
            this.setupPositionProbePattern(0, this.moduleCount - 7);
            this.setupPositionAdjustPattern();
            this.setupTimingPattern();
            this.setupTypeInfo(test, maskPattern);
            if (this.typeNumber >= 7) {
                this.setupTypeNumber(test);
            }
            if (this.dataCache === null) {
                this.dataCache = QRCodeModel.createData(this.typeNumber, this.errorCorrectLevel, this.dataList);
            }
            this.mapData(this.dataCache, maskPattern);
        };
        QRCodeModel.prototype.setupPositionProbePattern = function (row, col) {
            for (var r = -1; r <= 7; r++) {
                if (row + r <= -1 || this.moduleCount <= row + r)
                    continue;
                for (var c = -1; c <= 7; c++) {
                    if (col + c <= -1 || this.moduleCount <= col + c)
                        continue;
                    if ((0 <= r && r <= 6 && (c === 0 || c === 6)) ||
                        (0 <= c && c <= 6 && (r === 0 || r === 6)) ||
                        (2 <= r && r <= 4 && 2 <= c && c <= 4)) {
                        this.modules[row + r][col + c] = true;
                    }
                    else {
                        this.modules[row + r][col + c] = false;
                    }
                }
            }
        };
        QRCodeModel.prototype.getBestMaskPattern = function () {
            var minLostPoint = 0;
            var pattern = 0;
            for (var i = 0; i < 8; i++) {
                this.makeImpl(true, i);
                var lostPoint = this.getLostPoint();
                if (i === 0 || minLostPoint > lostPoint) {
                    minLostPoint = lostPoint;
                    pattern = i;
                }
            }
            return pattern;
        };
        QRCodeModel.prototype.getLostPoint = function () {
            var moduleCount = this.moduleCount;
            var lostPoint = 0;
            for (var row = 0; row < moduleCount; row++) {
                for (var col = 0; col < moduleCount; col++) {
                    var sameCount = 0;
                    var dark = this.modules[row][col];
                    for (var r = -1; r <= 1; r++) {
                        for (var c = -1; c <= 1; c++) {
                            if (!(r === 0 && c === 0) &&
                                row + r > -1 && row + r < moduleCount &&
                                col + c > -1 && col + c < moduleCount &&
                                dark === this.modules[row + r][col + c]) {
                                sameCount++;
                            }
                        }
                    }
                    if (sameCount > 5) {
                        lostPoint += (3 + sameCount - 5);
                    }
                }
            }
            for (var row = 0; row < moduleCount - 1; row++) {
                for (var col = 0; col < moduleCount - 1; col++) {
                    var count = 0;
                    if (this.modules[row][col])
                        count++;
                    if (this.modules[row][col + 1])
                        count++;
                    if (this.modules[row + 1][col])
                        count++;
                    if (this.modules[row + 1][col + 1])
                        count++;
                    if (count === 0 || count === 4) {
                        lostPoint += 3;
                    }
                }
            }
            for (var row = 0; row < moduleCount; row++) {
                for (var col = 0; col < moduleCount - 6; col++) {
                    if (this.modules[row][col] &&
                        !this.modules[row][col + 1] &&
                        this.modules[row][col + 2] &&
                        this.modules[row][col + 3] &&
                        this.modules[row][col + 4] &&
                        !this.modules[row][col + 5] &&
                        this.modules[row][col + 6]) {
                        lostPoint += 40;
                    }
                }
            }
            for (var col = 0; col < moduleCount; col++) {
                for (var row = 0; row < moduleCount - 6; row++) {
                    if (this.modules[row][col] &&
                        !this.modules[row + 1][col] &&
                        this.modules[row + 2][col] &&
                        this.modules[row + 3][col] &&
                        this.modules[row + 4][col] &&
                        !this.modules[row + 5][col] &&
                        this.modules[row + 6][col]) {
                        lostPoint += 40;
                    }
                }
            }
            var darkCount = 0;
            for (var row = 0; row < moduleCount; row++) {
                for (var col = 0; col < moduleCount; col++) {
                    if (this.modules[row][col]) {
                        darkCount++;
                    }
                }
            }
            var ratio = Math.abs((100 * darkCount) / (moduleCount * moduleCount) - 50) / 5;
            lostPoint += ratio * 10;
            return lostPoint;
        };
        QRCodeModel.prototype.setupTimingPattern = function () {
            for (var r = 8; r < this.moduleCount - 8; r++) {
                if (this.modules[r][6] !== null) {
                    continue;
                }
                this.modules[r][6] = (r % 2 === 0);
            }
            for (var c = 8; c < this.moduleCount - 8; c++) {
                if (this.modules[6][c] !== null) {
                    continue;
                }
                this.modules[6][c] = (c % 2 === 0);
            }
        };
        QRCodeModel.prototype.setupPositionAdjustPattern = function () {
            var pos = QRUtil.getPatternPosition(this.typeNumber);
            for (var i = 0; i < pos.length; i++) {
                for (var j = 0; j < pos.length; j++) {
                    var row = pos[i];
                    var col = pos[j];
                    if (this.modules[row][col] !== null) {
                        continue;
                    }
                    for (var r = -2; r <= 2; r++) {
                        for (var c = -2; c <= 2; c++) {
                            this.modules[row + r][col + c] = (r === -2 || r === 2 || c === -2 || c === 2 || (r === 0 && c === 0));
                        }
                    }
                }
            }
        };
        QRCodeModel.prototype.setupTypeInfo = function (test, maskPattern) {
            var data = (this.errorCorrectLevel << 3) | maskPattern;
            var bits = QRUtil.getBCHTypeInfo(data);
            for (var i = 0; i < 15; i++) {
                var mod = (!test && ((bits >> i) & 1) === 1);
                if (i < 6 || (8 <= i && i < 14)) {
                    this.modules[Math.floor(i / 3)][i % 3 === 0 ? 8 : (i % 3 === 1 ? this.moduleCount - 8 : 8)] = mod;
                }
                else {
                    this.modules[i < 8 ? 8 : this.moduleCount - 8][i < 8 ? 14 - i : (i === 8 ? 8 : 14 - (i - 8))] = mod;
                }
            }
        };
        QRCodeModel.prototype.setupTypeNumber = function (test) {
            var bits = QRUtil.getBCHTypeNumber(this.typeNumber);
            for (var i = 0; i < 18; i++) {
                var mod = (!test && ((bits >> i) & 1) === 1);
                var row = Math.floor(i / 3);
                var col = i % 3;
                this.modules[row][col + this.moduleCount - 8 - 3] = mod;
                this.modules[col + this.moduleCount - 8 - 3][row] = mod;
            }
        };
        QRCodeModel.prototype.mapData = function (data, maskPattern) {
            var moduleCount = this.moduleCount;
            var inc = -1;
            var row = moduleCount - 1;
            var bitIndex = 7;
            var byteIndex = 0;
            for (var col = moduleCount - 1; col > 0; col -= 2) {
                if (col === 6) {
                    col--;
                }
                while (true) {
                    for (var c = 0; c < 2; c++) {
                        if (this.modules[row][col - c] === null) {
                            var dark = false;
                            if (byteIndex < data.length) {
                                dark = (((data[byteIndex] >>> bitIndex) & 1) === 1);
                            }
                            var mask = QRUtil.getMask(maskPattern, row, col - c);
                            if (mask) {
                                dark = !dark;
                            }
                            this.modules[row][col - c] = dark;
                            bitIndex--;
                            if (bitIndex === -1) {
                                byteIndex++;
                                bitIndex = 7;
                            }
                        }
                    }
                    row += inc;
                    if (row < 0 || row >= moduleCount) {
                        row -= inc;
                        inc = -inc;
                        break;
                    }
                }
            }
        };
        QRCodeModel.createData = function (typeNumber, errorCorrectLevel, dataList) {
            var blocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectLevel);
            var buffer = new QRBitBuffer();
            for (var i = 0; i < dataList.length; i++) {
                var data = dataList[i];
                buffer.put(data.mode, 4);
                buffer.put(data.getLength(), QRUtil.charCountIndicator(data.mode, typeNumber));
                data.write(buffer);
            }
            var totalDataCount = 0;
            for (var i = 0; i < blocks.length; i++) {
                totalDataCount += blocks[i].dataCount;
            }
            if (buffer.getLengthInBits() > totalDataCount * 8) {
                throw new Error("code length overflow. (" + buffer.getLengthInBits() + ">" + totalDataCount * 8 + ")");
            }
            while (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
                buffer.put(0, 4);
            }
            while (buffer.getLengthInBits() % 8 !== 0) {
                buffer.putBit(false);
            }
            var maxDataBytes = totalDataCount - (blocks.length * 2);
            var rawData = [];
            while (buffer.getLengthInBits() > 0) {
                rawData.push(buffer.buffer.shift());
            }
            while (rawData.length < maxDataBytes) {
                rawData.push(0);
            }
            var eccData = QRCodeModel.createECC(rawData, blocks);
            var code = [];
            var dataIndex = 0;
            var eccIndex = 0;
            for (var i = 0; i < blocks.length; i++) {
                var dataCount = blocks[i].dataCount;
                var eccCount = blocks[i].totalCount - dataCount;
                for (var j = 0; j < dataCount; j++) {
                    code.push(rawData[dataIndex++]);
                }
                for (var j = 0; j < eccCount; j++) {
                    code.push(eccData[eccIndex++]);
                }
            }
            return code;
        };
        QRCodeModel.createECC = function (data, blocks) {
            var totalCount = 0;
            for (var i = 0; i < blocks.length; i++) {
                totalCount += blocks[i].totalCount;
            }
            var eccCount = totalCount - data.length;
            var g = QRCodeModel.generateECCPoly(eccCount);
            var numBlocks = blocks.length;
            var dataBlocks = [];
            var eccBlocks = [];
            var dataPos = 0;
            for (var i = 0; i < numBlocks; i++) {
                var dataCount = blocks[i].dataCount;
                dataBlocks.push(data.slice(dataPos, dataPos + dataCount));
                dataPos += dataCount;
            }
            for (var i = 0; i < numBlocks; i++) {
                var padded = new Int32Array(g.length - 1);
                for (var j = 0; j < dataBlocks[i].length; j++) {
                    padded[j] = dataBlocks[i][j];
                }
                var result = QRMath.gf_poly_div(padded, g);
                var ecc = result.remainder;
                while (ecc.length < g.length - 1) {
                    ecc = new Int32Array([0, ...ecc]);
                }
                eccBlocks.push(ecc);
            }
            var eccData = [];
            for (var i = 0; i < g.length - 1; i++) {
                for (var j = 0; j < numBlocks; j++) {
                    if (i < eccBlocks[j].length) {
                        eccData.push(eccBlocks[j][i]);
                    }
                }
            }
            return eccData;
        };
        QRCodeModel.generateECCPoly = function (degree) {
            var poly = new Int32Array([1]);
            for (var i = 0; i < degree; i++) {
                poly = QRMath.gf_poly_mul(poly, new Int32Array([1, QRMath.gf_exp(i)]));
            }
            return poly;
        };
        return QRCodeModel;
    }());
    QRCode.QRCodeModel = QRCodeModel;
})(QRCode || (QRCode = {}));
module.exports = QRCode;