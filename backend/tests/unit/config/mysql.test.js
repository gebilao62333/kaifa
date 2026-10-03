jest.mock('sequelize', () => ({ Sequelize: jest.fn(function () { return { options: {} }; }), Op: {} }));
jest.mock('../../../src/config', () => {
  const os = require('os');
  const path = require('path');
  return {
    useMockDb: true,
    nodeEnv: 'test',
    paths: { logs: path.join(os.tmpdir(), 'dsh-mysql-test-logs') },
    db: {
      mysql: {
        name: 'db', user: 'u', password: 'p', host: '127.0.0.1', port: 3306,
        charset: 'utf8mb4', pool: { max: 1, min: 0 }
      }
    }
  };
});

const { Sequelize } = require('sequelize');
const config = require('../../../src/config');

describe('Config - MySQL', () => {
  beforeEach(() => jest.clearAllMocks());

  it('exposes an in-memory mock connection when useMockDb is true', async () => {
    config.useMockDb = true;
    let mod;
    jest.isolateModules(() => { mod = require('../../../src/config/mysql'); });

    await expect(mod.authenticate()).resolves.toBeUndefined();
    await expect(mod.sync()).resolves.toBeUndefined();
    expect(await mod.query()).toEqual([[], {}]);

    const model = mod.define();
    expect(await model.findAll()).toEqual([]);
    expect(await model.findOne()).toBe(null);
    expect(await model.findByPk(1)).toBe(null);
    expect(await model.findOrCreate()).toEqual([{}, false]);
    expect(await model.findAndCountAll()).toEqual({ rows: [], count: 0 });
    expect((await model.create({ a: 1 })).a).toBe(1);
    expect(await model.update()).toEqual([0]);
    expect(await model.destroy()).toBe(0);
    expect(await model.count()).toBe(0);
    expect(await model.sum()).toBe(0);
    expect(await model.max()).toBe(null);
    expect(await model.min()).toBe(null);
    expect(await model.increment()).toEqual([{}]);
    expect(await model.decrement()).toEqual([{}]);
    expect(await model.bulkCreate([1, 2])).toEqual([1, 2]);
    expect(await model.upsert()).toEqual([{}]);
    model.associate();
    model.hasMany();
    model.belongsTo();
    model.hasOne();
    model.belongsToMany();

    const txn = await mod.transaction((t) => { t.commit(); t.rollback(); });
    expect(txn).toBeUndefined();
    await mod.transaction();
  });

  it('constructs a real Sequelize instance when useMockDb is false', () => {
    config.useMockDb = false;
    Sequelize.mockClear();
    let mod;
    jest.isolateModules(() => { mod = require('../../../src/config/mysql'); });

    expect(Sequelize).toHaveBeenCalledTimes(1);
    const args = Sequelize.mock.calls[0];
    expect(args[0]).toBe('db');
    expect(args[1]).toBe('u');
    expect(args[2]).toBe('p');
    expect(args[3].dialect).toBe('mysql');
    expect(mod).toBeDefined();
  });
});
