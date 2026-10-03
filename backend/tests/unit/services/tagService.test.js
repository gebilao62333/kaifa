jest.mock('../../../src/models', () => {
  const VirtualUserTag = {
    findAll: jest.fn(), findByPk: jest.fn(), findOne: jest.fn(),
    findAndCountAll: jest.fn(), create: jest.fn(), update: jest.fn(), destroy: jest.fn(),
    sequelize: { Op: { like: 'like' } }
  };
  return {
    VirtualUserTag,
    VirtualUserTagRelation: { findAll: jest.fn(), findOne: jest.fn(), create: jest.fn(), update: jest.fn(), destroy: jest.fn() },
    VirtualUser: { findByPk: jest.fn() }
  };
});

const tagService = require('../../../src/services/tagService');
const { VirtualUserTag, VirtualUserTagRelation, VirtualUser } = require('../../../src/models');

const tag = (over = {}) => ({ id: 1, name: 'tag', icon: 'i', category: null, is_default: 0, sort_order: 1, status: 1, create_time: 1, update_time: 1, ...over });

describe('Service - TagService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('createTag validates the name and returns the formatted tag', async () => {
    await expect(tagService.createTag({})).rejects.toThrow('标签名称不能为空');

    VirtualUserTag.create.mockResolvedValue(tag());
    const result = await tagService.createTag({ name: 'tag', is_default: true });
    expect(result.id).toBe(1);
    expect(VirtualUserTag.create.mock.calls[0][0].is_default).toBe(1);
  });

  it('getTagById throws when missing', async () => {
    VirtualUserTag.findByPk.mockResolvedValue(null);
    await expect(tagService.getTagById(1)).rejects.toThrow('标签不存在');

    VirtualUserTag.findByPk.mockResolvedValue(tag());
    expect((await tagService.getTagById(1)).name).toBe('tag');
  });

  it('getAllTags applies filters and pagination', async () => {
    VirtualUserTag.findAndCountAll.mockResolvedValue({ count: 1, rows: [tag()] });
    const result = await tagService.getAllTags({ page: '2', pageSize: '10', status: '1', keyword: 'a' });
    expect(result.total).toBe(1);
    expect(result.list.length).toBe(1);
    expect(VirtualUserTag.findAndCountAll.mock.calls[0][0].where.status).toBe(1);
    expect(VirtualUserTag.findAndCountAll.mock.calls[0][0].where.name).toEqual({ like: '%a%' });

    const plain = await tagService.getAllTags({});
    expect(plain.total).toBe(1);
    expect(VirtualUserTag.findAndCountAll.mock.calls[1][0].where.status).toBeUndefined();
  });

  it('getTagsByCategory filters by category', async () => {
    VirtualUserTag.findAll.mockResolvedValue([tag()]);
    await tagService.getTagsByCategory('style');
    expect(VirtualUserTag.findAll.mock.calls[0][0].where.category).toBe('style');

    await tagService.getTagsByCategory(null);
    expect(VirtualUserTag.findAll.mock.calls[1][0].where.category).toBeUndefined();
  });

  it('updateTag validates existence and updates fields', async () => {
    VirtualUserTag.findByPk.mockResolvedValue(null);
    await expect(tagService.updateTag(1, {})).rejects.toThrow('标签不存在');

    const update = jest.fn().mockResolvedValue(true);
    VirtualUserTag.findByPk.mockResolvedValue({ ...tag(), update });
    const result = await tagService.updateTag(1, {
      name: 'n', icon: 'i', category: 'c', is_default: true, sort_order: 2, status: 0
    });
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ name: 'n', is_default: 1, status: 0 }));
    expect(result.id).toBe(1);
  });

  it('deleteTag removes relations and the tag', async () => {
    VirtualUserTag.findByPk.mockResolvedValue(null);
    await expect(tagService.deleteTag(1)).rejects.toThrow('标签不存在');

    const destroy = jest.fn().mockResolvedValue(true);
    VirtualUserTag.findByPk.mockResolvedValue({ ...tag(), destroy });
    VirtualUserTagRelation.destroy.mockResolvedValue(2);
    await expect(tagService.deleteTag(1)).resolves.toBe(true);
    expect(VirtualUserTagRelation.destroy).toHaveBeenCalledWith({ where: { tag_id: 1 } });
    expect(destroy).toHaveBeenCalled();
  });

  describe('assignTagToUser', () => {
    it('validates the virtual user, tag and existing relation', async () => {
      VirtualUser.findByPk.mockResolvedValue(null);
      await expect(tagService.assignTagToUser(1, 2)).rejects.toThrow('虚拟用户不存在');

      VirtualUser.findByPk.mockResolvedValue({ id: 1 });
      VirtualUserTag.findByPk.mockResolvedValue(null);
      await expect(tagService.assignTagToUser(1, 2)).rejects.toThrow('标签不存在或已禁用');

      VirtualUserTag.findByPk.mockResolvedValue(tag({ status: 0 }));
      await expect(tagService.assignTagToUser(1, 2)).rejects.toThrow('标签不存在或已禁用');

      VirtualUserTag.findByPk.mockResolvedValue(tag());
      VirtualUserTagRelation.findOne.mockResolvedValue({ id: 1 });
      await expect(tagService.assignTagToUser(1, 2)).rejects.toThrow('该标签已分配给此虚拟用户');
    });

    it('assigns the tag', async () => {
      VirtualUser.findByPk.mockResolvedValue({ id: 1 });
      VirtualUserTag.findByPk.mockResolvedValue(tag());
      VirtualUserTagRelation.findOne.mockResolvedValue(null);
      VirtualUserTagRelation.create.mockResolvedValue({ id: 1 });
      await expect(tagService.assignTagToUser(1, 2, true, { a: 1 })).resolves.toBe(true);
      expect(VirtualUserTagRelation.create.mock.calls[0][0].is_primary).toBe(1);
    });
  });

  it('removeTagFromUser validates and removes', async () => {
    VirtualUserTagRelation.findOne.mockResolvedValue(null);
    await expect(tagService.removeTagFromUser(1, 2)).rejects.toThrow('该标签未分配给此虚拟用户');

    const destroy = jest.fn().mockResolvedValue(true);
    VirtualUserTagRelation.findOne.mockResolvedValue({ id: 1, destroy });
    await expect(tagService.removeTagFromUser(1, 2)).resolves.toBe(true);
    expect(destroy).toHaveBeenCalled();
  });

  it('getUserTags joins relations with tags', async () => {
    VirtualUserTagRelation.findAll.mockResolvedValue([{ tag_id: 1, is_primary: 1 }, { tag_id: 99, is_primary: 0 }]);
    VirtualUserTag.findByPk.mockImplementation((id) => Promise.resolve(id === 1 ? tag() : null));
    const result = await tagService.getUserTags(1);
    expect(result.length).toBe(1);
    expect(result[0].is_primary).toBe(1);
  });

  it('setPrimaryTag validates and sets', async () => {
    VirtualUserTagRelation.findOne.mockResolvedValue(null);
    await expect(tagService.setPrimaryTag(1, 2)).rejects.toThrow('该标签未分配给此虚拟用户');

    const update = jest.fn().mockResolvedValue(true);
    VirtualUserTagRelation.findOne.mockResolvedValue({ update });
    VirtualUserTagRelation.update.mockResolvedValue([1]);
    await expect(tagService.setPrimaryTag(1, 2)).resolves.toBe(true);
    expect(VirtualUserTagRelation.update).toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith({ is_primary: 1 });
  });

  it('recommendTags filters by keyword', async () => {
    VirtualUserTag.findAll.mockResolvedValue([tag({ name: 'Game' }), tag({ id: 2, name: 'Music' })]);
    const filtered = await tagService.recommendTags({ keyword: 'game', limit: '5' });
    expect(filtered.length).toBe(1);
    expect(filtered[0].name).toBe('Game');

    const all = await tagService.recommendTags({});
    expect(all.length).toBe(2);
  });

  it('getTagsWithUsers validates the tag and maps users', async () => {
    VirtualUserTag.findByPk.mockResolvedValue(null);
    await expect(tagService.getTagsWithUsers(1)).rejects.toThrow('标签不存在');

    VirtualUserTag.findByPk.mockResolvedValue(tag());
    VirtualUserTagRelation.findAll.mockResolvedValue([{ virtual_user_id: 5 }, { virtual_user_id: 6 }]);
    VirtualUser.findByPk.mockImplementation((id) => Promise.resolve(id === 5 ? { id: 5, name: 'u', avatar: 'a', gender: 1, age: 20, region: 'r' } : null));
    const result = await tagService.getTagsWithUsers(1);
    expect(result.userCount).toBe(1);
    expect(result.users[0].id).toBe(5);
  });

  it('getDefaultTags maps defaults', async () => {
    VirtualUserTag.findAll.mockResolvedValue([tag({ is_default: 1 })]);
    const result = await tagService.getDefaultTags();
    expect(result.length).toBe(1);
    expect(VirtualUserTag.findAll.mock.calls[0][0].where.is_default).toBe(1);
  });

  it('initializeDefaultTags creates only missing tags', async () => {
    VirtualUserTag.findOne.mockImplementation(({ where }) => Promise.resolve(where.name === '游戏陪玩' ? tag() : null));
    VirtualUserTag.create.mockResolvedValue(tag());
    await expect(tagService.initializeDefaultTags()).resolves.toBe(true);
    expect(VirtualUserTag.create).toHaveBeenCalledTimes(5);
  });
});
