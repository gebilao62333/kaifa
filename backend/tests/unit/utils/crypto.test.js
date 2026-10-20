const cryptoUtil = require('../../../src/utils/crypto');

describe('Utils - Crypto Functions', () => {
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
