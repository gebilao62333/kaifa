const cryptoUtil = require('../../../src/utils/crypto');
const crypto = require('crypto');

describe('Utils - Crypto Functions', () => {
  describe('hashPassword', () => {
    it('should hash password using PBKDF2 with salt', () => {
      const password = 'testpassword123';
      const result = cryptoUtil.hashPassword(password);
      
      expect(typeof result).toBe('string');
      // PBKDF2 格式: salt:hash，salt 128 hex + ":" + hash 128 hex = 257 字符
      expect(result).toContain(':');
      const [salt, hash] = result.split(':');
      expect(salt).toHaveLength(32);  // 16 bytes hex = 32 chars
      expect(hash).toHaveLength(128); // 64 bytes hex = 128 chars
    });

    it('should produce different hashes for same password (different salts)', () => {
      const password = 'mypassword';
      const hash1 = cryptoUtil.hashPassword(password);
      const hash2 = cryptoUtil.hashPassword(password);
      
      expect(hash1).not.toEqual(hash2);
    });

    it('should verify password correctly', () => {
      const password = 'mypassword';
      const hash = cryptoUtil.hashPassword(password);
      
      expect(cryptoUtil.verifyPassword(password, hash)).toBe(true);
      expect(cryptoUtil.verifyPassword('wrong', hash)).toBe(false);
    });

    it('should verify legacy SHA256 passwords', () => {
      const password = 'oldpassword';
      const legacyHash = crypto.createHash('sha256').update(password).digest('hex');
      
      expect(cryptoUtil.verifyPassword(password, legacyHash)).toBe(true);
      expect(cryptoUtil.verifyPassword('wrong', legacyHash)).toBe(false);
    });
  });

  describe('md5', () => {
    it('should generate MD5 hash', () => {
      const text = 'test text';
      const result = cryptoUtil.md5(text);
      
      expect(typeof result).toBe('string');
      expect(result).toHaveLength(32);
      
      const expectedHash = crypto.createHash('md5').update(text).digest('hex');
      expect(result).toEqual(expectedHash);
    });
  });

  describe('sha1', () => {
    it('should generate SHA1 hash', () => {
      const text = 'test text';
      const result = cryptoUtil.sha1(text);
      
      expect(typeof result).toBe('string');
      expect(result).toHaveLength(40);
      
      const expectedHash = crypto.createHash('sha1').update(text).digest('hex');
      expect(result).toEqual(expectedHash);
    });
  });

  describe('generateRandomString', () => {
    it('should generate random string with default length 32', () => {
      const result = cryptoUtil.generateRandomString();
      expect(typeof result).toBe('string');
      expect(result.length).toBe(32);
    });

    it('should generate random string with specified length', () => {
      const length = 16;
      const result = cryptoUtil.generateRandomString(length);
      expect(result.length).toBe(length);
    });

    it('should generate different random strings', () => {
      const str1 = cryptoUtil.generateRandomString();
      const str2 = cryptoUtil.generateRandomString();
      
      expect(str1).not.toEqual(str2);
    });
  });

  describe('encrypt and decrypt', () => {
    const testPassword = 'mysecretpassword';
    const testText = 'Hello, this is a secret message!';

    it('should encrypt and decrypt successfully', () => {
      const encrypted = cryptoUtil.encrypt(testText, testPassword);
      
      expect(typeof encrypted).toBe('string');
      expect(encrypted.length).toBeGreaterThan(0);
      
      const decrypted = cryptoUtil.decrypt(encrypted, testPassword);
      expect(decrypted).toEqual(testText);
    });

    it('should produce different encrypted results for same text', () => {
      const encrypted1 = cryptoUtil.encrypt(testText, testPassword);
      const encrypted2 = cryptoUtil.encrypt(testText, testPassword);
      
      expect(encrypted1).not.toEqual(encrypted2);
    });

    it('should decrypt to same text with correct password', () => {
      const encrypted = cryptoUtil.encrypt(testText, testPassword);
      const decrypted1 = cryptoUtil.decrypt(encrypted, testPassword);
      const decrypted2 = cryptoUtil.decrypt(encrypted, testPassword);
      
      expect(decrypted1).toEqual(decrypted2);
      expect(decrypted1).toEqual(testText);
    });

    it('should handle empty string', () => {
      const encrypted = cryptoUtil.encrypt('', testPassword);
      const decrypted = cryptoUtil.decrypt(encrypted, testPassword);
      
      expect(decrypted).toEqual('');
    });
  });

  describe('error handling in decryption', () => {
    const testPassword = 'testpassword';

    it('should throw error when decrypting invalid data', () => {
      expect(() => {
        cryptoUtil.decrypt('invalidhexdata', testPassword);
      }).toThrow();
    });

    it('should throw error when decrypting wrong password', () => {
      const encrypted = cryptoUtil.encrypt('secret', 'correctpassword');
      
      expect(() => {
        cryptoUtil.decrypt(encrypted, 'wrongpassword');
      }).toThrow();
    });
  });
});
