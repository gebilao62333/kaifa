jest.mock('../../../src/migrations/20240101000000_add_currency_column', () => ({ up: jest.fn(), convertData: jest.fn() }));
jest.mock('../../../src/migrations/20260824000000_add_virtual_user_online_columns', () => ({ up: jest.fn(), convertData: jest.fn() }));
jest.mock('../../../src/migrations/20261001000000_add_post_tag_album_fields', () => ({ up: jest.fn(), convertData: jest.fn() }));
jest.mock('../../../src/migrations/20261001000001_add_interaction_fix_columns', () => ({ up: jest.fn(), convertData: jest.fn() }));
jest.mock('../../../src/migrations/20261001000002_drop_legacy_tables', () => ({ up: jest.fn(), convertData: jest.fn() }));
jest.mock('../../../src/migrations/20261003000001_add_red_packet_log_unique', () => ({ up: jest.fn(), convertData: jest.fn() }));
jest.mock('../../../src/migrations/20261003000002_widen_user_id_and_ip', () => ({ up: jest.fn(), convertData: jest.fn() }));
jest.mock('../../../src/migrations/20261003000003_add_card_key', () => ({ up: jest.fn(), convertData: jest.fn() }));
jest.mock('../../../src/migrations/20261004000001_add_user_exp_and_backfill', () => ({ up: jest.fn(), convertData: jest.fn() }));
jest.mock('../../../src/migrations/20261004000002_widen_pii_columns', () => ({ up: jest.fn(), convertData: jest.fn() }));
jest.mock('../../../src/migrations/20261017000000_add_chat_log_expire_at', () => ({ up: jest.fn(), convertData: jest.fn() }));
jest.mock('../../../src/migrations/20261017000001_add_chat_log_read_destroy', () => ({ up: jest.fn(), convertData: jest.fn() }));
jest.mock('../../../src/migrations/20261020000000_add_notice', () => ({ up: jest.fn(), convertData: jest.fn() }));
jest.mock('../../../src/migrations/20261020000001_encrypt_card_password', () => ({ up: jest.fn(), convertData: jest.fn() }));
jest.mock('../../../src/migrations/20261020000002_backfill_real_name_encryption', () => ({ up: jest.fn(), convertData: jest.fn() }));
jest.mock('../../../src/migrations/20261020000003_encrypt_mobile', () => ({ up: jest.fn(), convertData: jest.fn() }));
jest.mock('../../../src/migrations/20261021120000_add_companion_apply_fields', () => ({ up: jest.fn(), convertData: jest.fn() }));

const MODULES = [
 "20240101000000_add_currency_column",
 "20260824000000_add_virtual_user_online_columns",
 "20261001000000_add_post_tag_album_fields",
 "20261001000001_add_interaction_fix_columns",
 "20261001000002_drop_legacy_tables",
 "20261003000001_add_red_packet_log_unique",
 "20261003000002_widen_user_id_and_ip",
 "20261003000003_add_card_key",
 "20261004000001_add_user_exp_and_backfill",
 "20261004000002_widen_pii_columns",
 "20261017000000_add_chat_log_expire_at",
 "20261017000001_add_chat_log_read_destroy",
 "20261020000000_add_notice",
 "20261020000001_encrypt_card_password",
 "20261020000002_backfill_real_name_encryption",
 "20261020000003_encrypt_mobile",
 "20261021120000_add_companion_apply_fields"
];
const fns = {};
for (const m of MODULES) fns[m] = require('../../../src/migrations/' + m);
const { runMigrations, shouldRunWidenColumns } = require('../../../src/migrations/runMigrations');

const WIDEN_MODULES = ['20261003000002_widen_user_id_and_ip', '20261004000002_widen_pii_columns'];

const resetMocks = () => {
  for (const key of Object.keys(fns)) fns[key].up.mockClear();
  fns['20240101000000_add_currency_column'].convertData.mockClear();
};

describe('migrations/runMigrations 接线（防漏接回归）', () => {
  beforeEach(() => {
    resetMocks();
    delete process.env.AUTO_MIGRATE_WIDEN_COLUMNS;
    process.env.NODE_ENV = 'test';
  });

  afterAll(() => {
    delete process.env.AUTO_MIGRATE_WIDEN_COLUMNS;
    process.env.NODE_ENV = 'test';
  });

  it('17 个迁移文件的 up（共 18 步，含 2 个宽列迁移）全部被 await 执行一次', async () => {
    await runMigrations();
    for (const key of Object.keys(fns)) {
      expect(fns[key].up).toHaveBeenCalledTimes(1);
    }
    expect(fns['20240101000000_add_currency_column'].convertData).toHaveBeenCalledTimes(1);
  });

  it('AUTO_MIGRATE_WIDEN_COLUMNS=false 时跳过两个宽列迁移，其余 15 个模块照常执行', async () => {
    process.env.AUTO_MIGRATE_WIDEN_COLUMNS = 'false';
    await runMigrations();

    for (const key of WIDEN_MODULES) {
      expect(fns[key].up).not.toHaveBeenCalled();
    }
    for (const key of Object.keys(fns)) {
      if (WIDEN_MODULES.includes(key)) continue;
      expect(fns[key].up).toHaveBeenCalledTimes(1);
    }
  });

  it('宽列开关：未设置时非生产执行、生产跳过；显式 true 覆盖生产默认', () => {
    const originalEnv = process.env.NODE_ENV;

    process.env.NODE_ENV = 'production';
    delete process.env.AUTO_MIGRATE_WIDEN_COLUMNS;
    expect(shouldRunWidenColumns()).toBe(false);

    process.env.NODE_ENV = 'development';
    expect(shouldRunWidenColumns()).toBe(true);

    process.env.NODE_ENV = 'production';
    process.env.AUTO_MIGRATE_WIDEN_COLUMNS = 'true';
    expect(shouldRunWidenColumns()).toBe(true);

    process.env.NODE_ENV = 'development';
    process.env.AUTO_MIGRATE_WIDEN_COLUMNS = 'false';
    expect(shouldRunWidenColumns()).toBe(false);

    delete process.env.AUTO_MIGRATE_WIDEN_COLUMNS;
    process.env.NODE_ENV = originalEnv;
  });
});
