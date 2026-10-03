const tagController = require('../../../src/controllers/tag');

jest.mock('../../../src/services/tagService', () => ({
  createTag: jest.fn(),
  getTagById: jest.fn(),
  getAllTags: jest.fn(),
  getTagsByCategory: jest.fn(),
  updateTag: jest.fn(),
  deleteTag: jest.fn(),
  assignTagToUser: jest.fn(),
  removeTagFromUser: jest.fn(),
  getUserTags: jest.fn(),
  setPrimaryTag: jest.fn(),
  recommendTags: jest.fn(),
  getTagsWithUsers: jest.fn(),
  getDefaultTags: jest.fn(),
  initializeDefaultTags: jest.fn()
}));

const tagService = require('../../../src/services/tagService');

const mockReq = (overrides = {}) => ({ userId: 100001, body: {}, query: {}, params: {}, ...overrides });
const mockRes = () => {
  const res = {};
  res.setHeader = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Controller - Tag', () => {
  beforeEach(() => jest.clearAllMocks());

  it('createTag rejects missing name', async () => {
    const res = mockRes();
    await tagController.createTag(mockReq({ body: {} }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('createTag applies defaults and succeeds', async () => {
    tagService.createTag.mockResolvedValue({ id: 1 });
    const res = mockRes();
    await tagController.createTag(mockReq({ body: { name: '技术流' } }), res);
    expect(tagService.createTag).toHaveBeenCalledWith({ name: '技术流', icon: undefined, sort_order: 0, status: 1 });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('createTag maps error to 422', async () => {
    tagService.createTag.mockRejectedValue(new Error('bad'));
    const res = mockRes();
    await tagController.createTag(mockReq({ body: { name: 'x' } }), res);
    expect(res.status).toHaveBeenCalledWith(422);
  });

  it('getTag returns tag and maps error to 404', async () => {
    tagService.getTagById.mockResolvedValue({ id: 3 });
    const ok = mockRes();
    await tagController.getTag(mockReq({ params: { id: '3' } }), ok);
    expect(tagService.getTagById).toHaveBeenCalledWith(3);
    expect(ok.status).toHaveBeenCalledWith(200);

    tagService.getTagById.mockRejectedValue(new Error('not found'));
    const err = mockRes();
    await tagController.getTag(mockReq({ params: { id: '3' } }), err);
    expect(err.status).toHaveBeenCalledWith(404);
  });

  it('getAllTags returns list', async () => {
    tagService.getAllTags.mockResolvedValue([]);
    const res = mockRes();
    await tagController.getAllTags(mockReq({ query: { status: '1' } }), res);
    expect(tagService.getAllTags).toHaveBeenCalledWith({ status: '1' });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getAllTags maps error to 500', async () => {
    tagService.getAllTags.mockRejectedValue(new Error('bad'));
    const res = mockRes();
    await tagController.getAllTags(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('getTagsByCategory returns list and maps error', async () => {
    tagService.getTagsByCategory.mockResolvedValue([{ id: 1 }]);
    const ok = mockRes();
    await tagController.getTagsByCategory(mockReq({ params: { category: 'game' } }), ok);
    expect(tagService.getTagsByCategory).toHaveBeenCalledWith('game');
    expect(ok.status).toHaveBeenCalledWith(200);

    tagService.getTagsByCategory.mockRejectedValue(new Error('bad'));
    const err = mockRes();
    await tagController.getTagsByCategory(mockReq({ params: { category: 'game' } }), err);
    expect(err.status).toHaveBeenCalledWith(500);
  });

  it('updateTag succeeds and maps error to 422', async () => {
    tagService.updateTag.mockResolvedValue({ id: 3 });
    const ok = mockRes();
    await tagController.updateTag(mockReq({ params: { id: '3' }, body: { name: 'n' } }), ok);
    expect(tagService.updateTag).toHaveBeenCalledWith(3, { name: 'n' });
    expect(ok.status).toHaveBeenCalledWith(200);

    tagService.updateTag.mockRejectedValue(new Error('bad'));
    const err = mockRes();
    await tagController.updateTag(mockReq({ params: { id: '3' }, body: {} }), err);
    expect(err.status).toHaveBeenCalledWith(422);
  });

  it('deleteTag succeeds and maps error to 404', async () => {
    tagService.deleteTag.mockResolvedValue(true);
    const ok = mockRes();
    await tagController.deleteTag(mockReq({ params: { id: '3' } }), ok);
    expect(tagService.deleteTag).toHaveBeenCalledWith(3);
    expect(ok.status).toHaveBeenCalledWith(200);

    tagService.deleteTag.mockRejectedValue(new Error('bad'));
    const err = mockRes();
    await tagController.deleteTag(mockReq({ params: { id: '3' } }), err);
    expect(err.status).toHaveBeenCalledWith(404);
  });

  it('assignTag rejects missing params', async () => {
    const res = mockRes();
    await tagController.assignTag(mockReq({ body: { virtualUserId: 1 } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('assignTag succeeds', async () => {
    tagService.assignTagToUser.mockResolvedValue(true);
    const res = mockRes();
    await tagController.assignTag(mockReq({ body: { virtualUserId: '1', tagId: '2', isPrimary: true, customConfig: { a: 1 } } }), res);
    expect(tagService.assignTagToUser).toHaveBeenCalledWith(1, 2, true, { a: 1 });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('assignTag maps error to 422', async () => {
    tagService.assignTagToUser.mockRejectedValue(new Error('bad'));
    const res = mockRes();
    await tagController.assignTag(mockReq({ body: { virtualUserId: 1, tagId: 2 } }), res);
    expect(res.status).toHaveBeenCalledWith(422);
  });

  it('removeTag rejects missing params', async () => {
    const res = mockRes();
    await tagController.removeTag(mockReq({ body: {} }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('removeTag succeeds and maps error', async () => {
    tagService.removeTagFromUser.mockResolvedValue(true);
    const ok = mockRes();
    await tagController.removeTag(mockReq({ body: { virtualUserId: '1', tagId: '2' } }), ok);
    expect(tagService.removeTagFromUser).toHaveBeenCalledWith(1, 2);
    expect(ok.status).toHaveBeenCalledWith(200);

    tagService.removeTagFromUser.mockRejectedValue(new Error('bad'));
    const err = mockRes();
    await tagController.removeTag(mockReq({ body: { virtualUserId: 1, tagId: 2 } }), err);
    expect(err.status).toHaveBeenCalledWith(422);
  });

  it('getUserTags returns list and maps error', async () => {
    tagService.getUserTags.mockResolvedValue([]);
    const ok = mockRes();
    await tagController.getUserTags(mockReq({ params: { virtualUserId: '1' } }), ok);
    expect(tagService.getUserTags).toHaveBeenCalledWith(1);
    expect(ok.status).toHaveBeenCalledWith(200);

    tagService.getUserTags.mockRejectedValue(new Error('bad'));
    const err = mockRes();
    await tagController.getUserTags(mockReq({ params: { virtualUserId: '1' } }), err);
    expect(err.status).toHaveBeenCalledWith(500);
  });

  it('setPrimaryTag rejects missing params, succeeds and maps error', async () => {
    const bad = mockRes();
    await tagController.setPrimaryTag(mockReq({ body: {} }), bad);
    expect(bad.status).toHaveBeenCalledWith(400);

    tagService.setPrimaryTag.mockResolvedValue(true);
    const ok = mockRes();
    await tagController.setPrimaryTag(mockReq({ body: { virtualUserId: '1', tagId: '2' } }), ok);
    expect(tagService.setPrimaryTag).toHaveBeenCalledWith(1, 2);
    expect(ok.status).toHaveBeenCalledWith(200);

    tagService.setPrimaryTag.mockRejectedValue(new Error('bad'));
    const err = mockRes();
    await tagController.setPrimaryTag(mockReq({ body: { virtualUserId: 1, tagId: 2 } }), err);
    expect(err.status).toHaveBeenCalledWith(422);
  });

  it('recommendTags returns list and maps error', async () => {
    tagService.recommendTags.mockResolvedValue([]);
    const ok = mockRes();
    await tagController.recommendTags(mockReq({ query: { limit: '5' } }), ok);
    expect(tagService.recommendTags).toHaveBeenCalledWith({ limit: '5' });
    expect(ok.status).toHaveBeenCalledWith(200);

    tagService.recommendTags.mockRejectedValue(new Error('bad'));
    const err = mockRes();
    await tagController.recommendTags(mockReq(), err);
    expect(err.status).toHaveBeenCalledWith(500);
  });

  it('getTagUsers returns users and maps error to 404', async () => {
    tagService.getTagsWithUsers.mockResolvedValue([]);
    const ok = mockRes();
    await tagController.getTagUsers(mockReq({ params: { tagId: '2' } }), ok);
    expect(tagService.getTagsWithUsers).toHaveBeenCalledWith(2);
    expect(ok.status).toHaveBeenCalledWith(200);

    tagService.getTagsWithUsers.mockRejectedValue(new Error('bad'));
    const err = mockRes();
    await tagController.getTagUsers(mockReq({ params: { tagId: '2' } }), err);
    expect(err.status).toHaveBeenCalledWith(404);
  });

  it('getDefaultTags returns list and maps error', async () => {
    tagService.getDefaultTags.mockResolvedValue([]);
    const ok = mockRes();
    await tagController.getDefaultTags(mockReq(), ok);
    expect(ok.status).toHaveBeenCalledWith(200);

    tagService.getDefaultTags.mockRejectedValue(new Error('bad'));
    const err = mockRes();
    await tagController.getDefaultTags(mockReq(), err);
    expect(err.status).toHaveBeenCalledWith(500);
  });

  it('initDefaultTags succeeds and maps error', async () => {
    tagService.initializeDefaultTags.mockResolvedValue(true);
    const ok = mockRes();
    await tagController.initDefaultTags(mockReq(), ok);
    expect(ok.status).toHaveBeenCalledWith(200);

    tagService.initializeDefaultTags.mockRejectedValue(new Error('bad'));
    const err = mockRes();
    await tagController.initDefaultTags(mockReq(), err);
    expect(err.status).toHaveBeenCalledWith(500);
  });
});
