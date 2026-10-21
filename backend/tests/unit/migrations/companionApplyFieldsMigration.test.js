jest.mock('../../../src/config/mysql', () => ({ query: jest.fn() }));

const sequelize = require('../../../src/config/mysql');
const migration = require('../../../src/migrations/20261021120000_add_companion_apply_fields');

const TABLE = 'xn_companion_profile';
const COLUMNS = ['city', 'skill_level', 'zone', 'position', 'play_type', 'approve_time', 'reject_reason'];

const columnsResult = (names) => [names.map((name) => ({ col: name }))];
const alterResult = [{}];

describe('migrations - 陪玩师入驻资料字段（P1-9）', () => {
  beforeEach(() => {
    sequelize.query.mockReset();
  });

  it('缺列时一次性 ALTER 补齐 7 列，并先查 INFORMATION_SCHEMA', async () => {
    sequelize.query
      .mockResolvedValueOnce(columnsResult([]))
      .mockResolvedValueOnce(alterResult);

    await migration.up();

    const [selectSql, selectOptions] = sequelize.query.mock.calls[0];
    expect(selectSql).toContain('INFORMATION_SCHEMA.COLUMNS');
    expect(selectOptions).toEqual({ replacements: [TABLE] });

    const [alterSql] = sequelize.query.mock.calls[1];
    expect(alterSql).toContain(`ALTER TABLE ${TABLE}`);
    for (const name of COLUMNS) {
      expect(alterSql).toContain(`ADD COLUMN ${name}`);
    }
  });

  it('只补缺失列，已存在的列不重复 ADD（幂等）', async () => {
    sequelize.query
      .mockResolvedValueOnce(columnsResult(['city', 'zone']))
      .mockResolvedValueOnce(alterResult);

    await migration.up();

    const [alterSql] = sequelize.query.mock.calls[1];
    expect(alterSql).not.toContain('ADD COLUMN city');
    expect(alterSql).not.toContain('ADD COLUMN zone');
    for (const name of ['skill_level', 'position', 'play_type', 'approve_time', 'reject_reason']) {
      expect(alterSql).toContain(`ADD COLUMN ${name}`);
    }
  });

  it('全部列已存在时不执行 ALTER（重复执行安全）', async () => {
    sequelize.query.mockResolvedValueOnce(columnsResult(COLUMNS));

    await migration.up();

    expect(sequelize.query).toHaveBeenCalledTimes(1);
  });

  it('down 只 DROP 已存在的列', async () => {
    sequelize.query
      .mockResolvedValueOnce(columnsResult(['city', 'play_type']))
      .mockResolvedValueOnce(alterResult);

    await migration.down();

    const [alterSql] = sequelize.query.mock.calls[1];
    expect(alterSql).toContain('DROP COLUMN city');
    expect(alterSql).toContain('DROP COLUMN play_type');
    expect(alterSql).not.toContain('DROP COLUMN zone');
  });

  it('down 在列都不存在时不执行 ALTER', async () => {
    sequelize.query.mockResolvedValueOnce(columnsResult([]));

    await migration.down();

    expect(sequelize.query).toHaveBeenCalledTimes(1);
  });
});
