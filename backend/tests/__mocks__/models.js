jest.mock('../src/models', () => ({
  User: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    findAndCountAll: jest.fn(),
    findAll: jest.fn(),
    increment: jest.fn(),
    decrement: jest.fn()
  },
  ChatLog: {
    findAndCountAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  },
  ChatRoom: {
    findByPk: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn()
  },
  Gift: {
    findByPk: jest.fn(),
    findAll: jest.fn()
  },
  GiftLog: {
    create: jest.fn()
  },
  Game: {
    findAll: jest.fn()
  },
  GameOrder: {
    findByPk: jest.fn(),
    create: jest.fn(),
    findAndCountAll: jest.fn(),
    update: jest.fn()
  },
  CompanionProfile: {
    findOne: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  },
  Post: {
    findByPk: jest.fn(),
    create: jest.fn(),
    findAndCountAll: jest.fn(),
    update: jest.fn()
  },
  PostLike: {
    findOne: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn()
  },
  PostComment: {
    create: jest.fn(),
    findAndCountAll: jest.fn()
  },
  UserFollow: {
    findOne: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn()
  },
  RechargePackage: {
    findAll: jest.fn(),
    findByPk: jest.fn()
  },
  OrderChong: {
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  },
  Team: {
    findByPk: jest.fn(),
    create: jest.fn()
  },
  TeamMember: {
    findOne: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  },
  Group: {
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  },
  GroupMember: {
    findOne: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  },
  CallRecord: {
    create: jest.fn(),
    update: jest.fn(),
    findByPk: jest.fn(),
    findAndCountAll: jest.fn()
  },
  CallBilling: {
    create: jest.fn()
  },
  Banner: {
    findAll: jest.fn()
  }
}));
