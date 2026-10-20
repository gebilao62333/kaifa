jest.mock('../../../src/models', () => ({
  UserPref: {
    findOne: jest.fn(),
    findAll: jest.fn()
  }
}));

const { UserPref } = require('../../../src/models');
const privacy = require('../../../src/utils/privacyPrefs');

describe('utils/privacyPrefs（C-9 隐私开关服务端消费）', () => {
  beforeEach(() => jest.clearAllMocks());

  it('无偏好行时全部按默认公开', async () => {
    UserPref.findOne.mockResolvedValue(null);
    expect(await privacy.getPrivacyPrefs(7)).toEqual({
      showOnline: true, showLocation: true, allowVisit: true, allowSearch: true
    });
  });

  it('读取失败/JSON 损坏时降级为默认值，不抛错', async () => {
    UserPref.findOne.mockRejectedValue(new Error('db down'));
    expect(await privacy.getPrivacyPrefs(7)).toEqual(privacy.PRIVACY_DEFAULTS);

    UserPref.findOne.mockResolvedValue({ data: '{bad json' });
    expect(await privacy.getPrivacyPrefs(7)).toEqual(privacy.PRIVACY_DEFAULTS);
  });

  it('保留关闭项（false 不被默认值覆盖）', async () => {
    UserPref.findOne.mockResolvedValue({
      data: JSON.stringify({ privacy: { showOnline: false, allowSearch: false, autoRecall: 30 } })
    });
    expect(await privacy.getPrivacyPrefs(7)).toEqual({
      showOnline: false, showLocation: true, allowVisit: true, allowSearch: false
    });
  });

  it('批量读取：缺失用户补默认值，已存用户按自身值', async () => {
    UserPref.findAll.mockResolvedValue([
      { user_id: 7, data: JSON.stringify({ privacy: { allowVisit: false } }) }
    ]);
    const map = await privacy.getPrivacyPrefsForUsers([7, 8, 8, 0, -1]);
    expect(Object.keys(map).sort()).toEqual(['7', '8']);
    expect(map[7].allowVisit).toBe(false);
    expect(map[8]).toEqual(privacy.PRIVACY_DEFAULTS);
    // 非法 id 不进入查询
    expect(UserPref.findAll.mock.calls[0][0].where.user_id).toBeDefined();
  });

  it('空 id 列表不查库', async () => {
    const map = await privacy.getPrivacyPrefsForUsers([]);
    expect(map).toEqual({});
    expect(UserPref.findAll).not.toHaveBeenCalled();
  });
});
