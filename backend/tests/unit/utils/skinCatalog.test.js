// 审计 H-6：目录是价格与 VIP 门槛的唯一事实来源，结构错误会直接变成资损，故逐条锁定
const { SKINS, SKIN_TYPES, skinKey, findSkin, findSkinByKey, isFreeSkin } = require('../../../src/utils/skinCatalog');

describe('utils/skinCatalog（装扮目录）', () => {
  it('共 26 项、四类齐全、id 与键唯一', () => {
    expect(SKINS.length).toBe(26);
    SKIN_TYPES.forEach((type) => {
      expect(SKINS.filter((s) => s.type === type).length).toBeGreaterThan(0);
    });
    expect(new Set(SKINS.map((s) => s.id)).size).toBe(SKINS.length);
    expect(new Set(SKINS.map((s) => s.key)).size).toBe(SKINS.length);
  });

  it('价格是非负整数，VIP 门槛在 0~4 之间且与 vipOnly 一致', () => {
    SKINS.forEach((skin) => {
      expect(Number.isInteger(skin.price)).toBe(true);
      expect(skin.price).toBeGreaterThanOrEqual(0);
      expect([0, 1, 2, 3, 4]).toContain(skin.vipLevel);
      expect(skin.vipOnly).toBe(skin.vipLevel > 0);
      expect(skin.key).toBe(skinKey(skin));
    });
  });

  it('免费项都不带 VIP 门槛，VIP 专属项都要钱', () => {
    SKINS.filter(isFreeSkin).forEach((skin) => expect(skin.vipLevel).toBe(0));
    SKINS.filter((s) => s.vipOnly).forEach((skin) => expect(skin.price).toBeGreaterThan(0));
  });

  it('每项都带可 JSON 序列化的展示资源', () => {
    const payload = JSON.parse(JSON.stringify(SKINS));
    payload.forEach((skin) => {
      expect(skin.assets).toBeTruthy();
      if (skin.type === 'theme') {
        expect(skin.assets.bg).toBeTruthy();
        expect(skin.assets.primary).toBeTruthy();
      } else {
        expect(skin.assets.style).toBeTruthy();
      }
    });
  });

  it('按 id / 键查找，未知装扮与异常入参都返回 null', () => {
    expect(findSkin('sf8').price).toBe(8888);
    expect(findSkinByKey('badge_sb6').price).toBe(9999);
    expect(findSkin('hacked_skin')).toBeNull();
    expect(findSkin('')).toBeNull();
    expect(findSkin(null)).toBeNull();
    expect(findSkin(undefined)).toBeNull();
    expect(findSkin({ toString: () => 'sf8' })).toBeNull();
    expect(findSkinByKey('frame_sf9')).toBeNull();
  });

  it('isFreeSkin 只认免费且非 VIP 专属的项', () => {
    expect(isFreeSkin(findSkin('sbbl1'))).toBe(true);
    expect(isFreeSkin(findSkin('sbbl2'))).toBe(false);
    expect(isFreeSkin(null)).toBe(false);
  });
});
