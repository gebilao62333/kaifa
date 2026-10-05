const {
  expToNextLevel,
  VIP_BOOST,
  vipBoost,
  EXP_SOURCES,
  applyExp,
  BENEFITS,
  benefitByLevel,
  findBenefit,
  ALBUM_LIMIT_BASE,
  ALBUM_LIMIT_EXPANDED
} = require('../../../src/utils/level');

describe('Utils - level', () => {
  describe('expToNextLevel', () => {
    it('follows lv*1000+500 and floors bad input to Lv.1', () => {
      expect(expToNextLevel(1)).toBe(1500);
      expect(expToNextLevel(10)).toBe(10500);
      expect(expToNextLevel(0)).toBe(1500);
      expect(expToNextLevel('abc')).toBe(1500);
    });
  });

  describe('vipBoost', () => {
    it('maps VIP levels and falls back to 1.0', () => {
      expect(vipBoost(0)).toBe(1.0);
      expect(vipBoost(1)).toBe(1.2);
      expect(vipBoost(2)).toBe(1.5);
      expect(vipBoost(3)).toBe(1.8);
      expect(vipBoost(4)).toBe(2.0);
      expect(vipBoost(9)).toBe(1.0);
      expect(vipBoost(null)).toBe(1.0);
      expect(Object.keys(VIP_BOOST)).toHaveLength(5);
    });
  });

  describe('applyExp', () => {
    it('keeps exp inside the current level', () => {
      expect(applyExp(1, 0, 300)).toEqual({ lv: 1, exp: 300, leveledUp: false });
    });

    it('carries the overflow into the next level', () => {
      // Lv.1 需 1500，Lv.2 需 2500
      expect(applyExp(1, 1400, 200)).toEqual({ lv: 2, exp: 100, leveledUp: true });
      expect(applyExp(1, 1400, 2700)).toEqual({ lv: 3, exp: 100, leveledUp: true });
    });

    it('ignores negative and non-numeric input', () => {
      expect(applyExp(1, 100, -50)).toEqual({ lv: 1, exp: 100, leveledUp: false });
      expect(applyExp(-3, -10, 'x')).toEqual({ lv: 1, exp: 0, leveledUp: false });
    });

    it('rounds fractional amounts', () => {
      expect(applyExp(1, 0, 50.4)).toEqual({ lv: 1, exp: 50, leveledUp: false });
      expect(applyExp(1, 0, 50.6)).toEqual({ lv: 1, exp: 51, leveledUp: false });
    });

    it('stops instead of looping forever on absurd jumps', () => {
      const r = applyExp(1, 0, 1e9);
      expect(r.lv).toBe(1001);
      expect(r.leveledUp).toBe(true);
    });
  });

  describe('BENEFITS', () => {
    it('keeps 7 ascending, uniquely keyed benefits', () => {
      expect(BENEFITS).toHaveLength(7);
      expect(new Set(BENEFITS.map(b => b.key)).size).toBe(7);
      BENEFITS.slice(1).forEach((b, i) => {
        expect(b.level).toBeGreaterThan(BENEFITS[i].level);
      });
    });

    it('every benefit is an enforceable, named gate', () => {
      BENEFITS.forEach(b => {
        expect(b.key).toMatch(/^[a-z_]+$/);
        expect(b.name).toBeTruthy();
        expect(b.level).toBeGreaterThan(1);
      });
    });

    it('benefitByLevel returns only unlocked entries', () => {
      expect(benefitByLevel(1).map(b => b.key)).toEqual([]);
      expect(benefitByLevel(6).map(b => b.key)).toEqual(['signature']);
      expect(benefitByLevel(999)).toHaveLength(7);
    });

    it('findBenefit tolerates unknown keys', () => {
      expect(findBenefit('skin_shop').level).toBe(45);
      expect(findBenefit('nope')).toBeNull();
    });
  });

  it('exposes the album quota pair', () => {
    expect(ALBUM_LIMIT_BASE).toBe(20);
    expect(ALBUM_LIMIT_EXPANDED).toBe(50);
  });

  it('defines a positive base value for every exp source', () => {
    Object.entries(EXP_SOURCES).forEach(([key, value]) => {
      expect(value).toBeGreaterThan(0);
      expect(Number.isInteger(value)).toBe(true);
      expect(key).toMatch(/^[a-z_]+$/);
    });
  });
});
